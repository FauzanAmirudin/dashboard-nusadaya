import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	attendanceCheckpointConfig,
	attendanceRecords,
	attendanceSessions,
	auditLogs,
	classSchedules,
	courses,
	dutySchedules,
	morningAssemblyRecords,
	morningAssemblySessions,
	odsAttendanceRecords,
	selfieFraudFlags,
	students,
	users,
} from "../db/schema";
import { cacheInvalidatePattern } from "../lib/cache";
import { reverseGeocode } from "../lib/geocoding";
import {
	calculateDistanceMeters,
	detectGpsSpoofingRisk,
	getCheckpointForSession,
	isWithinRadius,
} from "../lib/geolocation";
import { hasRole } from "../lib/permissions";
import { checkRateLimit } from "../lib/rate-limiter";
import { isRedisReady, redis } from "../lib/redis";
import { fileService } from "../modules/file/service/file.service";
import {
	evaluateMorningAssemblyArrival,
	getWIBDateTime,
	isWithinWindow,
	syncAttendanceAggregate,
} from "./attendance";

export const selfieAttendanceRoutes = new Elysia({ prefix: "/attendance" })
	// Derive user from context
	.derive((context) => {
		const user = (context as any).user;
		return { user };
	})

	// =========================================================================
	// 1. BARIS PAGI SELFIE CHECK-IN
	// =========================================================================
	.post(
		"/baris-pagi/selfie-checkin",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return {
					success: false,
					message: "Unauthorized. Silakan login terlebih dahulu.",
				};
			}

			const student = await db.query.students.findFirst({
				where: or(
					eq(students.studentUserId, user.id),
					eq(students.email, user.email || ""),
					eq(students.nim, user.username || ""),
				),
			});

			if (!student) {
				set.status = 404;
				return { success: false, message: "Profil mahasiswa tidak ditemukan." };
			}

			// 1. Anti-Replay: Client Timestamp Validation (toleransi max 5 menit)
			const clientTimestamp = body.clientTimestamp
				? Number(body.clientTimestamp)
				: null;
			if (clientTimestamp) {
				const now = Date.now();
				if (Math.abs(now - clientTimestamp) > 5 * 60 * 1000) {
					set.status = 400;
					return {
						success: false,
						message:
							"Timestamp perangkat tidak sinkron dengan server (> 5 menit). Pastikan waktu HP akurat.",
					};
				}
			}

			// 2. Rate Limiting: max 5 request per 5 menit
			const rateLimit = await checkRateLimit(
				`selfie:baris_pagi:${student.id}`,
				{
					maxRequests: 5,
					windowSeconds: 300,
					keyPrefix: "rl:selfie",
				},
			);
			if (!rateLimit.allowed) {
				set.status = 429;
				return {
					success: false,
					message:
						"Terlalu banyak percobaan presensi. Silakan tunggu beberapa saat.",
				};
			}

			// 3. Sesi Baris Pagi Aktif
			const { dateStr, timeStr } = getWIBDateTime();
			let session = null;

			if (body.sessionId) {
				session = await db.query.morningAssemblySessions.findFirst({
					where: and(
						eq(morningAssemblySessions.id, Number(body.sessionId)),
						sql`${morningAssemblySessions.sessionStatus} != 'cancelled'`,
					),
				});
			} else {
				session = await db.query.morningAssemblySessions.findFirst({
					where: and(
						eq(morningAssemblySessions.sessionDate, dateStr),
						or(
							eq(morningAssemblySessions.cohort, student.cohort),
							eq(morningAssemblySessions.cohort, 0),
						),
						sql`${morningAssemblySessions.sessionStatus} != 'cancelled'`,
					),
					orderBy: [desc(morningAssemblySessions.id)],
				});
			}

			if (!session) {
				set.status = 404;
				return {
					success: false,
					message: `Tidak ada sesi apel baris pagi aktif untuk Angkatan ${student.cohort} pada hari ini (${dateStr}).`,
				};
			}

			// 4. Validasi Window Presensi
			const windowStart = session.checkInWindowStart || "05:30";
			const windowEnd = session.checkInWindowEnd || "07:00";
			if (!isWithinWindow(timeStr, windowStart, windowEnd)) {
				set.status = 400;
				return {
					success: false,
					message: `Batas waktu presensi baris pagi adalah pukul ${windowStart} - ${windowEnd} WIB. Waktu server: ${timeStr} WIB.`,
				};
			}

			// 5. Anti Double-Submit / Lock
			const lockKey = `lock:attendance:baris_pagi:${session.id}:${student.id}`;
			if (isRedisReady()) {
				const acquired = await redis.set(lockKey, "1", "EX", 15, "NX");
				if (!acquired) {
					set.status = 409;
					return {
						success: false,
						message: "Permintaan sedang diproses, silakan tunggu.",
					};
				}
			}

			// 6. Cek Duplikasi Record
			const existingRecord = await db.query.morningAssemblyRecords.findFirst({
				where: and(
					eq(morningAssemblyRecords.sessionId, session.id),
					eq(morningAssemblyRecords.studentId, student.id),
				),
			});
			if (existingRecord) {
				set.status = 409;
				return {
					success: false,
					message: `Anda sudah melakukan presensi pada pukul ${existingRecord.arrivalTime || "-"} WIB (${existingRecord.status}).`,
					data: existingRecord,
				};
			}

			// 7. Validasi Foto & File
			const photo = body.photo as File;
			if (!photo || !photo.size) {
				set.status = 400;
				return {
					success: false,
					message: "File foto selfie wajib dilampirkan.",
				};
			}
			if (photo.size > 2.5 * 1024 * 1024) {
				set.status = 400;
				return {
					success: false,
					message: "Ukuran foto selfie maksimal 2.5 MB.",
				};
			}

			// 8. Validasi & Parsing Koordinat GPS
			const latitude = parseFloat(String(body.latitude));
			const longitude = parseFloat(String(body.longitude));
			const accuracy = parseFloat(String(body.accuracy || "10"));

			if (
				isNaN(latitude) ||
				isNaN(longitude) ||
				latitude < -90 ||
				latitude > 90 ||
				longitude < -180 ||
				longitude > 180
			) {
				set.status = 400;
				return { success: false, message: "Koordinat GPS tidak valid." };
			}

			// 9. Geolokasi: Checkpoint & Jarak Haversine
			const checkpoint = await getCheckpointForSession(
				"baris_pagi",
				student.cohort,
			);
			const distance = calculateDistanceMeters(
				latitude,
				longitude,
				checkpoint.latitude,
				checkpoint.longitude,
			);
			const isWithin = distance <= checkpoint.radiusMeters;

			// Validasi Geofencing: Mahasiswa wajib berada di dalam radius kampus
			if (!isWithin) {
				if (isRedisReady()) {
					await redis.del(lockKey);
				}
				set.status = 400;
				return {
					success: false,
					message: `Presensi gagal: Posisi perangkat Anda berada di luar radius kampus (${distance} meter dari kampus, batas maksimal ${checkpoint.radiusMeters} meter). Presensi wajib dilakukan di lingkungan Kampus Nusadaya Academy Bandar Lampung (${checkpoint.label}).`,
					distance,
					radiusMeters: checkpoint.radiusMeters,
					checkpointLabel: checkpoint.label,
				};
			}

			// 10. Deteksi Fraud / GPS Spoofing
			const spoofRisk = detectGpsSpoofingRisk(accuracy, latitude, longitude);
			const isFlagged = spoofRisk.isSuspicious;
			const verificationStatus = isFlagged ? "pending_review" : "auto_approved";

			// 11. Reverse Geocoding
			const locationName = await reverseGeocode(latitude, longitude);

			// 12. Upload Foto ke FileService
			let selfieUrl = "";
			try {
				const uploadResult = await fileService.uploadFile({
					file: photo,
					studentId: student.id,
					category: "selfie_absen",
					panel: "kehadiran",
					documentKey: `baris_pagi_${session.id}_${Date.now()}`,
					uploadedBy: user.id,
					visibility: "private",
				});
				selfieUrl = `/files/${uploadResult.id}/download`;
			} catch (err: any) {
				set.status = 500;
				return {
					success: false,
					message: `Gagal menyimpan foto selfie: ${err?.message}`,
				};
			}

			// 13. Evaluasi Status Kehadiran (Hadir vs Terlambat)
			const targetTime = session.targetTime || "06:22";
			const evalResult = evaluateMorningAssemblyArrival(timeStr, targetTime);

			// 14. Simpan ke morning_assembly_records
			const [record] = await db
				.insert(morningAssemblyRecords)
				.values({
					sessionId: session.id,
					studentId: student.id,
					status: evalResult.status,
					arrivalTime: timeStr,
					minutesLate: evalResult.minutesLate,
					selfCheckinAt: new Date(),
					checkinMethod: "self_selfie",
					selfieUrl,
					latitude,
					longitude,
					gpsAccuracy: accuracy,
					locationName,
					distanceFromCheckpoint: distance,
					isWithinRadius: isWithin,
					selfieTakenAt: new Date(),
					verificationStatus,
					rejectionReason: null,
					faceDetected: true,
					notes: body.notes
						? String(body.notes)
						: "Presensi selfie mandiri via web",
					recordedBy: user.id,
				})
				.returning();

			// 15. Jika Flagged: Catat ke selfie_fraud_flags
			if (isFlagged) {
				const flagReason = spoofRisk.reason || "gps_spoofing_suspected";

				await db.insert(selfieFraudFlags).values({
					attendanceType: "baris_pagi",
					attendanceRecordId: record.id,
					studentId: student.id,
					flagReason,
					flagDetail: {
						distanceFromCheckpoint: distance,
						radiusMeters: checkpoint.radiusMeters,
						checkpointLabel: checkpoint.label,
						gpsAccuracy: accuracy,
						coordinates: { latitude, longitude },
						spoofReason: spoofRisk.reason || null,
					},
				});
			}

			// 16. Audit Log
			await db.insert(auditLogs).values({
				userId: user.id,
				action: "SELFIE_CHECKIN_BARIS_PAGI",
				entity: "morning_assembly_records",
				entityId: record.id,
				details: {
					studentId: student.id,
					sessionId: session.id,
					status: evalResult.status,
					distance,
					isWithinRadius: isWithin,
					verificationStatus,
				},
			});

			// 17. Sync Aggregate & Invalidate Cache
			await syncAttendanceAggregate(student.id);
			await Promise.all([
				cacheInvalidatePattern("cache:attendance:*"),
				cacheInvalidatePattern("cache:students:*"),
				cacheInvalidatePattern("cache:dashboard:*"),
			]);

			const message = isFlagged
				? `Presensi diterima pukul ${timeStr} WIB (${distance}m dari titik lokasi). Status menunggu verifikasi staf karena akurasi GPS mencurigakan.`
				: evalResult.status === "hadir"
					? `Presensi Berhasil! Anda hadir tepat waktu pukul ${timeStr} WIB di lokasi ${locationName}.`
					: `Presensi Berhasil! Anda tercatat terlambat ${evalResult.minutesLate} menit (pukul ${timeStr} WIB, standar ${targetTime} WIB).`;

			return {
				success: true,
				message,
				data: {
					record,
					distance,
					isWithinRadius: isWithin,
					locationName,
					verificationStatus,
					serverTime: timeStr,
				},
			};
		},
		{
			body: t.Object({
				photo: t.File(),
				latitude: t.Numeric(),
				longitude: t.Numeric(),
				accuracy: t.Optional(t.Numeric()),
				sessionId: t.Optional(t.Numeric()),
				clientTimestamp: t.Optional(t.Numeric()),
				notes: t.Optional(t.String()),
			}),
		},
	)

	// =========================================================================
	// 2. KULIAH SELFIE CHECK-IN
	// =========================================================================
	.post(
		"/kuliah/selfie-checkin",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return {
					success: false,
					message: "Unauthorized. Silakan login terlebih dahulu.",
				};
			}

			const student = await db.query.students.findFirst({
				where: or(
					eq(students.studentUserId, user.id),
					eq(students.email, user.email || ""),
					eq(students.nim, user.username || ""),
				),
			});

			if (!student) {
				set.status = 404;
				return { success: false, message: "Profil mahasiswa tidak ditemukan." };
			}

			// Rate limit & anti-replay
			const rateLimit = await checkRateLimit(`selfie:kuliah:${student.id}`, {
				maxRequests: 5,
				windowSeconds: 300,
				keyPrefix: "rl:selfie",
			});
			if (!rateLimit.allowed) {
				set.status = 429;
				return {
					success: false,
					message: "Terlalu banyak percobaan presensi.",
				};
			}

			const { dateStr, timeStr } = getWIBDateTime();
			const scheduleId = Number(body.scheduleId || body.classScheduleId || 0);

			if (!scheduleId) {
				set.status = 400;
				return {
					success: false,
					message: "Jadwal kuliah (scheduleId) wajib dipilih.",
				};
			}

			const classSchedule = await db.query.classSchedules.findFirst({
				where: eq(classSchedules.id, scheduleId),
			});

			if (!classSchedule) {
				set.status = 404;
				return {
					success: false,
					message: "Jadwal perkuliahan tidak ditemukan.",
				};
			}

			// Cari sesi attendance hari ini untuk jadwal tersebut, atau buat jika belum ada
			let session = await db.query.attendanceSessions.findFirst({
				where: and(
					eq(attendanceSessions.classScheduleId, scheduleId),
					eq(attendanceSessions.sessionDate, dateStr),
				),
			});

			if (!session) {
				const [newSession] = await db
					.insert(attendanceSessions)
					.values({
						sessionType: "kelas",
						classScheduleId: scheduleId,
						cohort: classSchedule.cohort,
						subject: classSchedule.subject,
						sessionDate: dateStr,
						startTime: classSchedule.startTime,
						endTime: classSchedule.endTime,
						room: classSchedule.room,
						notes: "Sesi kuliah dibuka otomatis via presensi selfie mahasiswa",
						createdBy: user.id,
					})
					.returning();
				session = newSession;
			}

			// Cek duplikasi record
			const existingRecord = await db.query.attendanceRecords.findFirst({
				where: and(
					eq(attendanceRecords.sessionId, session.id),
					eq(attendanceRecords.studentId, student.id),
				),
			});

			if (existingRecord) {
				set.status = 409;
				return {
					success: false,
					message: `Anda sudah tercatat presensi pada mata kuliah ini (${existingRecord.status}).`,
					data: existingRecord,
				};
			}

			// Validasi Foto
			const photo = body.photo as File;
			if (!photo || !photo.size) {
				set.status = 400;
				return {
					success: false,
					message: "File foto selfie wajib dilampirkan.",
				};
			}

			// Geolokasi & Checkpoint
			const latitude = parseFloat(String(body.latitude));
			const longitude = parseFloat(String(body.longitude));
			const accuracy = parseFloat(String(body.accuracy || "10"));

			const checkpoint = await getCheckpointForSession(
				"kuliah",
				student.cohort,
			);
			const distance = calculateDistanceMeters(
				latitude,
				longitude,
				checkpoint.latitude,
				checkpoint.longitude,
			);
			const isWithin = distance <= checkpoint.radiusMeters;

			// Validasi Geofencing: Mahasiswa wajib berada di dalam radius kampus
			if (!isWithin) {
				set.status = 400;
				return {
					success: false,
					message: `Presensi gagal: Posisi perangkat Anda berada di luar radius kampus (${distance} meter dari kampus, batas maksimal ${checkpoint.radiusMeters} meter). Presensi wajib dilakukan di lingkungan Kampus Nusadaya Academy Bandar Lampung (${checkpoint.label}).`,
					distance,
					radiusMeters: checkpoint.radiusMeters,
					checkpointLabel: checkpoint.label,
				};
			}

			const spoofRisk = detectGpsSpoofingRisk(accuracy, latitude, longitude);
			const isFlagged = spoofRisk.isSuspicious;
			const verificationStatus = isFlagged ? "pending_review" : "auto_approved";

			const locationName = await reverseGeocode(latitude, longitude);

			// Upload Foto
			let selfieUrl = "";
			try {
				const uploadResult = await fileService.uploadFile({
					file: photo,
					studentId: student.id,
					category: "selfie_absen",
					panel: "kehadiran",
					documentKey: `kuliah_${session.id}_${Date.now()}`,
					uploadedBy: user.id,
					visibility: "private",
				});
				selfieUrl = `/files/${uploadResult.id}/download`;
			} catch (err: any) {
				set.status = 500;
				return {
					success: false,
					message: `Gagal upload foto: ${err?.message}`,
				};
			}

			// Insert ke attendanceRecords
			const [record] = await db
				.insert(attendanceRecords)
				.values({
					sessionId: session.id,
					studentId: student.id,
					status: "hadir",
					notes: body.notes
						? String(body.notes)
						: "Presensi selfie kuliah via web",
					selfieUrl,
					latitude,
					longitude,
					gpsAccuracy: accuracy,
					locationName,
					distanceFromCheckpoint: distance,
					checkinMethod: "self_selfie",
					isWithinRadius: isWithin,
					selfieTakenAt: new Date(),
					verificationStatus,
					recordedBy: user.id,
				})
				.returning();

			if (isFlagged) {
				await db.insert(selfieFraudFlags).values({
					attendanceType: "kuliah",
					attendanceRecordId: record.id,
					studentId: student.id,
					flagReason: spoofRisk.reason || "gps_spoofing_suspected",
					flagDetail: {
						distanceFromCheckpoint: distance,
						radiusMeters: checkpoint.radiusMeters,
						subject: classSchedule.subject,
						coordinates: { latitude, longitude },
					},
				});
			}

			// Audit Log & Sync
			await db.insert(auditLogs).values({
				userId: user.id,
				action: "SELFIE_CHECKIN_KULIAH",
				entity: "attendance_records",
				entityId: record.id,
				details: {
					studentId: student.id,
					subject: classSchedule.subject,
					distance,
					verificationStatus,
				},
			});

			await syncAttendanceAggregate(student.id);
			await cacheInvalidatePattern("cache:attendance:*");

			return {
				success: true,
				message: isFlagged
					? `Presensi kuliah diterima (${distance}m dari lokasi kelas). Menunggu verifikasi staf karena akurasi GPS mencurigakan.`
					: `Presensi kuliah "${classSchedule.subject}" berhasil tercatat hadir pada pukul ${timeStr} WIB.`,
				data: { record, distance, isWithinRadius: isWithin, locationName },
			};
		},
		{
			body: t.Object({
				photo: t.File(),
				latitude: t.Numeric(),
				longitude: t.Numeric(),
				accuracy: t.Optional(t.Numeric()),
				scheduleId: t.Optional(t.Numeric()),
				classScheduleId: t.Optional(t.Numeric()),
				clientTimestamp: t.Optional(t.Numeric()),
				notes: t.Optional(t.String()),
			}),
		},
	)

	// =========================================================================
	// 3. PIKET SELFIE CHECK-IN
	// =========================================================================
	.post(
		"/piket/selfie-checkin",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized." };
			}

			const student = await db.query.students.findFirst({
				where: or(
					eq(students.studentUserId, user.id),
					eq(students.email, user.email || ""),
					eq(students.nim, user.username || ""),
				),
			});

			if (!student) {
				set.status = 404;
				return { success: false, message: "Profil mahasiswa tidak ditemukan." };
			}

			const { dateStr, timeStr } = getWIBDateTime();
			const dutyScheduleId = Number(body.dutyScheduleId || 0);

			let dutySchedule = null;
			if (dutyScheduleId) {
				dutySchedule = await db.query.dutySchedules.findFirst({
					where: eq(dutySchedules.id, dutyScheduleId),
				});
			}

			// Cari sesi piket hari ini atau buat
			let session = null;
			if (dutyScheduleId) {
				session = await db.query.attendanceSessions.findFirst({
					where: and(
						eq(attendanceSessions.dutyScheduleId, dutyScheduleId),
						eq(attendanceSessions.sessionDate, dateStr),
					),
				});
			}

			if (!session) {
				const [newSession] = await db
					.insert(attendanceSessions)
					.values({
						sessionType: "piket",
						dutyScheduleId: dutyScheduleId || null,
						cohort: student.cohort,
						subject:
							dutySchedule?.groupName ||
							`Piket Kebersihan Angkatan ${student.cohort}`,
						sessionDate: dateStr,
						startTime: dutySchedule?.startTime || "07:00",
						endTime: dutySchedule?.endTime || "17:00",
						room: dutySchedule?.room || "Area Kampus",
						notes: "Sesi piket dibuka via presensi selfie",
						createdBy: user.id,
					})
					.returning();
				session = newSession;
			}

			// Cek duplikasi
			const existingRecord = await db.query.attendanceRecords.findFirst({
				where: and(
					eq(attendanceRecords.sessionId, session.id),
					eq(attendanceRecords.studentId, student.id),
				),
			});

			if (existingRecord) {
				set.status = 409;
				return {
					success: false,
					message: `Anda sudah tercatat presensi piket untuk hari ini.`,
					data: existingRecord,
				};
			}

			const photo = body.photo as File;
			if (!photo || !photo.size) {
				set.status = 400;
				return { success: false, message: "Foto selfie wajib diunggah." };
			}

			const latitude = parseFloat(String(body.latitude));
			const longitude = parseFloat(String(body.longitude));
			const accuracy = parseFloat(String(body.accuracy || "10"));

			const checkpoint = await getCheckpointForSession("piket", student.cohort);
			const distance = calculateDistanceMeters(
				latitude,
				longitude,
				checkpoint.latitude,
				checkpoint.longitude,
			);
			const isWithin = distance <= checkpoint.radiusMeters;

			// Validasi Geofencing: Mahasiswa wajib berada di dalam radius kampus
			if (!isWithin) {
				set.status = 400;
				return {
					success: false,
					message: `Presensi gagal: Posisi perangkat Anda berada di luar radius kampus (${distance} meter dari kampus, batas maksimal ${checkpoint.radiusMeters} meter). Presensi wajib dilakukan di lingkungan Kampus Nusadaya Academy Bandar Lampung (${checkpoint.label}).`,
					distance,
					radiusMeters: checkpoint.radiusMeters,
					checkpointLabel: checkpoint.label,
				};
			}

			const spoofRisk = detectGpsSpoofingRisk(accuracy, latitude, longitude);
			const isFlagged = spoofRisk.isSuspicious;
			const verificationStatus = isFlagged ? "pending_review" : "auto_approved";

			const locationName = await reverseGeocode(latitude, longitude);

			let selfieUrl = "";
			try {
				const uploadResult = await fileService.uploadFile({
					file: photo,
					studentId: student.id,
					category: "selfie_absen",
					panel: "kehadiran",
					documentKey: `piket_${session.id}_${Date.now()}`,
					uploadedBy: user.id,
					visibility: "private",
				});
				selfieUrl = `/files/${uploadResult.id}/download`;
			} catch (err: any) {
				set.status = 500;
				return {
					success: false,
					message: `Gagal upload foto: ${err?.message}`,
				};
			}

			const [record] = await db
				.insert(attendanceRecords)
				.values({
					sessionId: session.id,
					studentId: student.id,
					status: "hadir",
					notes: body.notes
						? String(body.notes)
						: "Presensi selfie piket via web",
					selfieUrl,
					latitude,
					longitude,
					gpsAccuracy: accuracy,
					locationName,
					distanceFromCheckpoint: distance,
					checkinMethod: "self_selfie",
					isWithinRadius: isWithin,
					selfieTakenAt: new Date(),
					verificationStatus,
					recordedBy: user.id,
				})
				.returning();

			if (isFlagged) {
				await db.insert(selfieFraudFlags).values({
					attendanceType: "piket",
					attendanceRecordId: record.id,
					studentId: student.id,
					flagReason: spoofRisk.reason || "gps_spoofing_suspected",
					flagDetail: {
						distanceFromCheckpoint: distance,
						radiusMeters: checkpoint.radiusMeters,
						coordinates: { latitude, longitude },
					},
				});
			}

			await syncAttendanceAggregate(student.id);
			await cacheInvalidatePattern("cache:attendance:*");

			return {
				success: true,
				message: isFlagged
					? `Presensi piket diterima (${distance}m dari lokasi piket). Menunggu verifikasi staf karena akurasi GPS mencurigakan.`
					: `Presensi piket berhasil dicatat hadir pukul ${timeStr} WIB.`,
				data: { record, distance, isWithinRadius: isWithin, locationName },
			};
		},
		{
			body: t.Object({
				photo: t.File(),
				latitude: t.Numeric(),
				longitude: t.Numeric(),
				accuracy: t.Optional(t.Numeric()),
				dutyScheduleId: t.Optional(t.Numeric()),
				clientTimestamp: t.Optional(t.Numeric()),
				notes: t.Optional(t.String()),
			}),
		},
	)

	// =========================================================================
	// 4. ODS SELFIE CHECK-IN
	// =========================================================================
	.post(
		"/ods/selfie-checkin",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized." };
			}

			const student = await db.query.students.findFirst({
				where: or(
					eq(students.studentUserId, user.id),
					eq(students.email, user.email || ""),
					eq(students.nim, user.username || ""),
				),
			});

			if (!student) {
				set.status = 404;
				return { success: false, message: "Profil mahasiswa tidak ditemukan." };
			}

			const { dateStr, timeStr } = getWIBDateTime();

			// Cek duplikasi record ODS hari ini
			const existingRecord = await db.query.odsAttendanceRecords.findFirst({
				where: and(
					eq(odsAttendanceRecords.studentId, student.id),
					eq(odsAttendanceRecords.date, dateStr),
				),
			});

			if (existingRecord) {
				set.status = 409;
				return {
					success: false,
					message: `Anda sudah melakukan presensi ODS untuk hari ini (${dateStr}).`,
					data: existingRecord,
				};
			}

			const photo = body.photo as File;
			if (!photo || !photo.size) {
				set.status = 400;
				return { success: false, message: "Foto selfie wajib dilampirkan." };
			}

			const latitude = parseFloat(String(body.latitude));
			const longitude = parseFloat(String(body.longitude));
			const accuracy = parseFloat(String(body.accuracy || "10"));

			const checkpoint = await getCheckpointForSession("ods", student.cohort);
			const distance = calculateDistanceMeters(
				latitude,
				longitude,
				checkpoint.latitude,
				checkpoint.longitude,
			);
			const isWithin = distance <= checkpoint.radiusMeters;

			// Validasi Geofencing: Mahasiswa wajib berada di dalam radius kampus
			if (!isWithin) {
				set.status = 400;
				return {
					success: false,
					message: `Presensi gagal: Posisi perangkat Anda berada di luar radius kampus (${distance} meter dari kampus, batas maksimal ${checkpoint.radiusMeters} meter). Presensi wajib dilakukan di lingkungan Kampus Nusadaya Academy Bandar Lampung (${checkpoint.label}).`,
					distance,
					radiusMeters: checkpoint.radiusMeters,
					checkpointLabel: checkpoint.label,
				};
			}

			const spoofRisk = detectGpsSpoofingRisk(accuracy, latitude, longitude);
			const isFlagged = spoofRisk.isSuspicious;
			const verificationStatus = isFlagged ? "pending_review" : "auto_approved";

			const locationName = await reverseGeocode(latitude, longitude);

			let selfieUrl = "";
			try {
				const uploadResult = await fileService.uploadFile({
					file: photo,
					studentId: student.id,
					category: "selfie_absen",
					panel: "kehadiran",
					documentKey: `ods_${dateStr}_${Date.now()}`,
					uploadedBy: user.id,
					visibility: "private",
				});
				selfieUrl = `/files/${uploadResult.id}/download`;
			} catch (err: any) {
				set.status = 500;
				return {
					success: false,
					message: `Gagal upload foto: ${err?.message}`,
				};
			}

			const [record] = await db
				.insert(odsAttendanceRecords)
				.values({
					studentId: student.id,
					date: dateStr,
					status: "hadir",
					notes: body.notes
						? String(body.notes)
						: "Presensi selfie ODS via web",
					selfieUrl,
					latitude,
					longitude,
					gpsAccuracy: accuracy,
					locationName,
					distanceFromCheckpoint: distance,
					checkinMethod: "self_selfie",
					isWithinRadius: isWithin,
					selfieTakenAt: new Date(),
					verificationStatus,
					recordedBy: user.id,
				})
				.returning();

			if (isFlagged) {
				await db.insert(selfieFraudFlags).values({
					attendanceType: "ods",
					attendanceRecordId: record.id,
					studentId: student.id,
					flagReason: spoofRisk.reason || "gps_spoofing_suspected",
					flagDetail: {
						distanceFromCheckpoint: distance,
						radiusMeters: checkpoint.radiusMeters,
						date: dateStr,
						coordinates: { latitude, longitude },
					},
				});
			}

			await syncAttendanceAggregate(student.id);
			await cacheInvalidatePattern("cache:attendance:*");

			return {
				success: true,
				message: isFlagged
					? `Presensi ODS diterima (${distance}m dari checkpoint). Menunggu verifikasi staf karena akurasi GPS mencurigakan.`
					: `Presensi ODS berhasil dicatat hadir pukul ${timeStr} WIB.`,
				data: { record, distance, isWithinRadius: isWithin, locationName },
			};
		},
		{
			body: t.Object({
				photo: t.File(),
				latitude: t.Numeric(),
				longitude: t.Numeric(),
				accuracy: t.Optional(t.Numeric()),
				clientTimestamp: t.Optional(t.Numeric()),
				notes: t.Optional(t.String()),
			}),
		},
	)

	// =========================================================================
	// 5. STAFF: GET DAFTAR SELFIE RECORDS
	// =========================================================================
	.get("/selfie/records", async ({ query, user, set }) => {
		if (!user || !hasRole(user, "akademik", "superadmin", "dosen")) {
			set.status = 403;
			return {
				success: false,
				message: "Akses ditolak. Memerlukan peran staf/dosen.",
			};
		}

		const {
			type = "all",
			date,
			cohort,
			verificationStatus,
			page = "1",
			limit = "25",
		} = query;

		const pageNum = Math.max(1, parseInt(String(page), 10));
		const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
		const offset = (pageNum - 1) * limitNum;

		const records: any[] = [];

		// Query Baris Pagi
		if (type === "all" || type === "baris_pagi") {
			const conds = [];
			if (date) {
				conds.push(eq(morningAssemblySessions.sessionDate, String(date)));
			}
			if (verificationStatus) {
				conds.push(
					eq(
						morningAssemblyRecords.verificationStatus,
						String(verificationStatus),
					),
				);
			}

			const bpRecords = await db.query.morningAssemblyRecords.findMany({
				where: conds.length > 0 ? and(...conds) : undefined,
				with: {
					student: {
						columns: {
							id: true,
							name: true,
							nim: true,
							cohort: true,
							rombel: true,
						},
					},
					session: true,
					verifier: { columns: { id: true, fullName: true } },
				},
				orderBy: [
					desc(morningAssemblyRecords.selfieTakenAt),
					desc(morningAssemblyRecords.id),
				],
				limit: limitNum,
			});

			for (const r of bpRecords) {
				if (cohort && r.student?.cohort !== parseInt(String(cohort), 10))
					continue;
				records.push({
					...r,
					attendanceType: "baris_pagi",
					title: `Baris Pagi - ${r.session?.location || "Lapangan"}`,
					sessionDate: r.session?.sessionDate,
				});
			}
		}

		// Query Kuliah & Piket
		if (type === "all" || type === "kuliah" || type === "piket") {
			const conds = [];
			if (verificationStatus) {
				conds.push(
					eq(attendanceRecords.verificationStatus, String(verificationStatus)),
				);
			}

			const attRecords = await db.query.attendanceRecords.findMany({
				where: conds.length > 0 ? and(...conds) : undefined,
				with: {
					student: {
						columns: {
							id: true,
							name: true,
							nim: true,
							cohort: true,
							rombel: true,
						},
					},
					session: true,
					verifier: { columns: { id: true, fullName: true } },
				},
				orderBy: [
					desc(attendanceRecords.selfieTakenAt),
					desc(attendanceRecords.id),
				],
				limit: limitNum,
			});

			for (const r of attRecords) {
				const isPiket = r.session?.sessionType === "piket";
				const currentType = isPiket ? "piket" : "kuliah";
				if (type !== "all" && type !== currentType) continue;
				if (date && r.session?.sessionDate !== String(date)) continue;
				if (cohort && r.student?.cohort !== parseInt(String(cohort), 10))
					continue;

				records.push({
					...r,
					attendanceType: currentType,
					title: r.session?.subject || (isPiket ? "Piket" : "Kuliah"),
					sessionDate: r.session?.sessionDate,
				});
			}
		}

		// Query ODS
		if (type === "all" || type === "ods") {
			const conds = [];
			if (date) conds.push(eq(odsAttendanceRecords.date, String(date)));
			if (verificationStatus) {
				conds.push(
					eq(
						odsAttendanceRecords.verificationStatus,
						String(verificationStatus),
					),
				);
			}

			const odsRecords = await db.query.odsAttendanceRecords.findMany({
				where: conds.length > 0 ? and(...conds) : undefined,
				with: {
					student: {
						columns: {
							id: true,
							name: true,
							nim: true,
							cohort: true,
							rombel: true,
						},
					},
					verifier: { columns: { id: true, fullName: true } },
				},
				orderBy: [
					desc(odsAttendanceRecords.selfieTakenAt),
					desc(odsAttendanceRecords.id),
				],
				limit: limitNum,
			});

			for (const r of odsRecords) {
				if (cohort && r.student?.cohort !== parseInt(String(cohort), 10))
					continue;
				records.push({
					...r,
					attendanceType: "ods",
					title: "On-Duty Service (ODS)",
					sessionDate: r.date,
				});
			}
		}

		// Sort overall by selfieTakenAt descending
		records.sort((a, b) => {
			const timeA = a.selfieTakenAt ? new Date(a.selfieTakenAt).getTime() : 0;
			const timeB = b.selfieTakenAt ? new Date(b.selfieTakenAt).getTime() : 0;
			return timeB - timeA;
		});

		const paginated = records.slice(offset, offset + limitNum);

		return {
			success: true,
			data: paginated,
			pagination: {
				total: records.length,
				page: pageNum,
				limit: limitNum,
				totalPages: Math.ceil(records.length / limitNum) || 1,
			},
		};
	})

	// =========================================================================
	// 6. STAFF: VERIFIKASI MANUAL SELFIE (APPROVE / REJECT)
	// =========================================================================
	.patch(
		"/selfie/:recordId/verify",
		async ({ params, body, user, set }) => {
			if (!user || !hasRole(user, "akademik", "superadmin", "dosen")) {
				set.status = 403;
				return { success: false, message: "Akses ditolak." };
			}

			const recordId = parseInt(params.recordId, 10);
			const { action, attendanceType, rejectionReason } = body;

			const newStatus = action === "approve" ? "approved" : "rejected";
			const now = new Date();

			let updatedRecord: any = null;
			let studentIdToSync: number | null = null;

			if (attendanceType === "baris_pagi") {
				const [updated] = await db
					.update(morningAssemblyRecords)
					.set({
						verificationStatus: newStatus,
						verifiedBy: user.id,
						verifiedAt: now,
						rejectionReason: action === "reject" ? rejectionReason : null,
					})
					.where(eq(morningAssemblyRecords.id, recordId))
					.returning();
				updatedRecord = updated;
				studentIdToSync = updated?.studentId;
			} else if (attendanceType === "ods") {
				const [updated] = await db
					.update(odsAttendanceRecords)
					.set({
						verificationStatus: newStatus,
						verifiedBy: user.id,
						verifiedAt: now,
						rejectionReason: action === "reject" ? rejectionReason : null,
					})
					.where(eq(odsAttendanceRecords.id, recordId))
					.returning();
				updatedRecord = updated;
				studentIdToSync = updated?.studentId;
			} else {
				// Kuliah / Piket
				const [updated] = await db
					.update(attendanceRecords)
					.set({
						verificationStatus: newStatus,
						verifiedBy: user.id,
						verifiedAt: now,
						rejectionReason: action === "reject" ? rejectionReason : null,
					})
					.where(eq(attendanceRecords.id, recordId))
					.returning();
				updatedRecord = updated;
				studentIdToSync = updated?.studentId;
			}

			if (!updatedRecord) {
				set.status = 404;
				return {
					success: false,
					message: "Data presensi selfie tidak ditemukan.",
				};
			}

			// Dismiss/Update status di selfie_fraud_flags jika di-approve
			if (action === "approve") {
				await db
					.update(selfieFraudFlags)
					.set({
						isDismissed: true,
						reviewedBy: user.id,
						reviewedAt: now,
					})
					.where(
						and(
							eq(selfieFraudFlags.attendanceType, attendanceType),
							eq(selfieFraudFlags.attendanceRecordId, recordId),
						),
					);
			}

			// Audit log
			await db.insert(auditLogs).values({
				userId: user.id,
				action: `VERIFY_SELFIE_${action.toUpperCase()}`,
				entity: attendanceType,
				entityId: recordId,
				details: {
					action,
					attendanceType,
					rejectionReason: rejectionReason || null,
					verifiedBy: user.fullName || user.username,
				},
			});

			if (studentIdToSync) {
				await syncAttendanceAggregate(studentIdToSync);
			}

			await Promise.all([
				cacheInvalidatePattern("cache:attendance:*"),
				cacheInvalidatePattern("cache:students:*"),
			]);

			return {
				success: true,
				message: `Status presensi selfie berhasil diubah menjadi ${newStatus}.`,
				data: updatedRecord,
			};
		},
		{
			body: t.Object({
				action: t.Union([t.Literal("approve"), t.Literal("reject")]),
				attendanceType: t.String(),
				rejectionReason: t.Optional(t.String()),
			}),
		},
	)

	// =========================================================================
	// 7. CHECKPOINT CONFIGURATION CRUD
	// =========================================================================
	.get("/checkpoint-config", async ({ user, set }) => {
		if (!user || !hasRole(user, "akademik", "superadmin", "dosen")) {
			set.status = 403;
			return { success: false, message: "Akses ditolak." };
		}
		const configs = await db.query.attendanceCheckpointConfig.findMany({
			with: {
				creator: { columns: { id: true, fullName: true } },
			},
			orderBy: [desc(attendanceCheckpointConfig.updatedAt)],
		});
		return { success: true, data: configs };
	})

	.get("/checkpoint-config/active", async ({ query }) => {
		const { type = "baris_pagi", cohort } = query;
		const checkpoint = await getCheckpointForSession(
			String(type),
			cohort ? parseInt(String(cohort), 10) : null,
		);
		return { success: true, data: checkpoint };
	})

	.post(
		"/checkpoint-config",
		async ({ body, user, set }) => {
			if (!user || !hasRole(user, "akademik", "superadmin")) {
				set.status = 403;
				return {
					success: false,
					message: "Akses ditolak. Memerlukan peran admin.",
				};
			}

			const [newConfig] = await db
				.insert(attendanceCheckpointConfig)
				.values({
					type: body.type,
					label: body.label,
					latitude: parseFloat(String(body.latitude)),
					longitude: parseFloat(String(body.longitude)),
					radiusMeters: body.radiusMeters
						? parseInt(String(body.radiusMeters), 10)
						: 100,
					isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
					cohort: body.cohort ? parseInt(String(body.cohort), 10) : null,
					notes: body.notes ? String(body.notes) : null,
					createdBy: user.id,
				})
				.returning();

			return {
				success: true,
				message: "Konfigurasi checkpoint berhasil ditambahkan.",
				data: newConfig,
			};
		},
		{
			body: t.Object({
				type: t.String(),
				label: t.String(),
				latitude: t.Numeric(),
				longitude: t.Numeric(),
				radiusMeters: t.Optional(t.Numeric()),
				isActive: t.Optional(t.Boolean()),
				cohort: t.Optional(t.Numeric()),
				notes: t.Optional(t.String()),
			}),
		},
	)

	.patch(
		"/checkpoint-config/:id",
		async ({ params, body, user, set }) => {
			if (!user || !hasRole(user, "akademik", "superadmin")) {
				set.status = 403;
				return { success: false, message: "Akses ditolak." };
			}

			const id = parseInt(params.id, 10);
			const updateData: any = { updatedAt: new Date() };

			if (body.label !== undefined) updateData.label = body.label;
			if (body.type !== undefined) updateData.type = body.type;
			if (body.latitude !== undefined)
				updateData.latitude = parseFloat(String(body.latitude));
			if (body.longitude !== undefined)
				updateData.longitude = parseFloat(String(body.longitude));
			if (body.radiusMeters !== undefined)
				updateData.radiusMeters = parseInt(String(body.radiusMeters), 10);
			if (body.isActive !== undefined)
				updateData.isActive = Boolean(body.isActive);
			if (body.cohort !== undefined)
				updateData.cohort = body.cohort
					? parseInt(String(body.cohort), 10)
					: null;
			if (body.notes !== undefined) updateData.notes = body.notes;

			const [updated] = await db
				.update(attendanceCheckpointConfig)
				.set(updateData)
				.where(eq(attendanceCheckpointConfig.id, id))
				.returning();

			return {
				success: true,
				message: "Checkpoint berhasil diperbarui.",
				data: updated,
			};
		},
		{
			body: t.Object({
				label: t.Optional(t.String()),
				type: t.Optional(t.String()),
				latitude: t.Optional(t.Numeric()),
				longitude: t.Optional(t.Numeric()),
				radiusMeters: t.Optional(t.Numeric()),
				isActive: t.Optional(t.Boolean()),
				cohort: t.Optional(t.Numeric()),
				notes: t.Optional(t.String()),
			}),
		},
	)

	.delete("/checkpoint-config/:id", async ({ params, user, set }) => {
		if (!user || !hasRole(user, "akademik", "superadmin")) {
			set.status = 403;
			return { success: false, message: "Akses ditolak." };
		}
		const id = parseInt(params.id, 10);
		await db
			.delete(attendanceCheckpointConfig)
			.where(eq(attendanceCheckpointConfig.id, id));
		return { success: true, message: "Checkpoint berhasil dihapus." };
	})

	// =========================================================================
	// 8. STAFF: LIVE FEED PRESENSI SELFIE REAL-TIME
	// =========================================================================
	.get("/selfie/live-feed", async ({ query, user, set }) => {
		if (!user || !hasRole(user, "akademik", "superadmin", "dosen")) {
			set.status = 403;
			return { success: false, message: "Akses ditolak." };
		}

		const { type = "baris_pagi", sessionId, limit = "20" } = query;
		const limitNum = Math.min(50, parseInt(String(limit), 10) || 20);

		if (type === "baris_pagi") {
			const conds = [];
			if (sessionId) {
				conds.push(
					eq(morningAssemblyRecords.sessionId, parseInt(String(sessionId), 10)),
				);
			}
			const records = await db.query.morningAssemblyRecords.findMany({
				where: conds.length > 0 ? and(...conds) : undefined,
				with: {
					student: {
						columns: {
							id: true,
							name: true,
							nim: true,
							cohort: true,
							rombel: true,
						},
					},
					session: true,
				},
				orderBy: [
					desc(morningAssemblyRecords.selfieTakenAt),
					desc(morningAssemblyRecords.id),
				],
				limit: limitNum,
			});
			return { success: true, data: records };
		}

		if (type === "kuliah" || type === "piket") {
			const conds = [];
			if (sessionId) {
				conds.push(
					eq(attendanceRecords.sessionId, parseInt(String(sessionId), 10)),
				);
			}
			const records = await db.query.attendanceRecords.findMany({
				where: conds.length > 0 ? and(...conds) : undefined,
				with: {
					student: {
						columns: {
							id: true,
							name: true,
							nim: true,
							cohort: true,
							rombel: true,
						},
					},
					session: true,
				},
				orderBy: [
					desc(attendanceRecords.selfieTakenAt),
					desc(attendanceRecords.id),
				],
				limit: limitNum,
			});
			return { success: true, data: records };
		}

		// ODS
		const records = await db.query.odsAttendanceRecords.findMany({
			with: {
				student: {
					columns: {
						id: true,
						name: true,
						nim: true,
						cohort: true,
						rombel: true,
					},
				},
			},
			orderBy: [
				desc(odsAttendanceRecords.selfieTakenAt),
				desc(odsAttendanceRecords.id),
			],
			limit: limitNum,
		});

		return { success: true, data: records };
	})

	// =========================================================================
	// 9. STAFF: STATISTIK & REKAP SELFIE PER SESI
	// =========================================================================
	.get("/selfie/summary", async ({ query, user, set }) => {
		if (!user || !hasRole(user, "akademik", "superadmin", "dosen")) {
			set.status = 403;
			return { success: false, message: "Akses ditolak." };
		}

		const { type = "baris_pagi", sessionId, date } = query;
		const { dateStr } = getWIBDateTime();
		const targetDate = date ? String(date) : dateStr;

		let totalHadir = 0;
		let totalTerlambat = 0;
		let totalPendingReview = 0;
		let totalRadiusViolations = 0;
		let totalFraudFlags = 0;
		let avgDistanceMeters = 0;
		let distanceSum = 0;
		let distanceCount = 0;

		if (type === "baris_pagi") {
			const conds = [];
			if (sessionId) {
				conds.push(
					eq(morningAssemblyRecords.sessionId, parseInt(String(sessionId), 10)),
				);
			}
			const records = await db.query.morningAssemblyRecords.findMany({
				where: conds.length > 0 ? and(...conds) : undefined,
			});

			for (const r of records) {
				if (r.status === "hadir") totalHadir++;
				if (r.status === "terlambat") totalTerlambat++;
				if (r.verificationStatus === "pending_review") totalPendingReview++;
				if (r.isWithinRadius === false) totalRadiusViolations++;
				if (
					r.distanceFromCheckpoint !== null &&
					r.distanceFromCheckpoint !== undefined
				) {
					distanceSum += r.distanceFromCheckpoint;
					distanceCount++;
				}
			}
		} else if (type === "kuliah" || type === "piket") {
			const conds = [];
			if (sessionId) {
				conds.push(
					eq(attendanceRecords.sessionId, parseInt(String(sessionId), 10)),
				);
			}
			const records = await db.query.attendanceRecords.findMany({
				where: conds.length > 0 ? and(...conds) : undefined,
			});

			for (const r of records) {
				if (r.status === "hadir") totalHadir++;
				if (r.verificationStatus === "pending_review") totalPendingReview++;
				if (r.isWithinRadius === false) totalRadiusViolations++;
				if (r.distanceFromCheckpoint) {
					distanceSum += r.distanceFromCheckpoint;
					distanceCount++;
				}
			}
		}

		// Count fraud flags
		const flags = await db.query.selfieFraudFlags.findMany({
			where: eq(selfieFraudFlags.attendanceType, String(type)),
		});
		totalFraudFlags = flags.filter((f) => !f.isDismissed).length;

		avgDistanceMeters =
			distanceCount > 0 ? Math.round(distanceSum / distanceCount) : 0;

		return {
			success: true,
			data: {
				type,
				totalHadir,
				totalTerlambat,
				totalPendingReview,
				totalRadiusViolations,
				totalFraudFlags,
				avgDistanceMeters,
				totalRecords: distanceCount,
			},
		};
	})

	// =========================================================================
	// 10. FRAUD FLAGS MANAGEMENT
	// =========================================================================
	.get("/selfie/fraud-flags", async ({ query, user, set }) => {
		if (!user || !hasRole(user, "akademik", "superadmin")) {
			set.status = 403;
			return { success: false, message: "Akses ditolak." };
		}

		const { attendanceType, isDismissed } = query;
		const conds = [];

		if (attendanceType) {
			conds.push(eq(selfieFraudFlags.attendanceType, String(attendanceType)));
		}
		if (isDismissed !== undefined) {
			conds.push(eq(selfieFraudFlags.isDismissed, isDismissed === "true"));
		}

		const flags = await db.query.selfieFraudFlags.findMany({
			where: conds.length > 0 ? and(...conds) : undefined,
			with: {
				student: {
					columns: {
						id: true,
						name: true,
						nim: true,
						cohort: true,
						rombel: true,
					},
				},
				reviewer: { columns: { id: true, fullName: true } },
			},
			orderBy: [desc(selfieFraudFlags.createdAt)],
		});

		return { success: true, data: flags };
	})

	.patch(
		"/selfie/fraud-flags/:id",
		async ({ params, body, user, set }) => {
			if (!user || !hasRole(user, "akademik", "superadmin")) {
				set.status = 403;
				return { success: false, message: "Akses ditolak." };
			}

			const flagId = parseInt(params.id, 10);
			const { isDismissed } = body;

			const [updated] = await db
				.update(selfieFraudFlags)
				.set({
					isDismissed: Boolean(isDismissed),
					reviewedBy: user.id,
					reviewedAt: new Date(),
				})
				.where(eq(selfieFraudFlags.id, flagId))
				.returning();

			return {
				success: true,
				message: "Status fraud flag berhasil diperbarui.",
				data: updated,
			};
		},
		{
			body: t.Object({
				isDismissed: t.Boolean(),
			}),
		},
	);
