import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	academicData,
	attendanceRecords,
	attendanceSessions,
	classSchedules,
	courseGrades,
	dutySchedules,
	odsAttendanceRecords,
	practicumSchedules,
	pramagangAttendanceRecords,
	students,
} from "../db/schema";
import { hasRole } from "../lib/permissions";

export const attendanceRoutes = new Elysia({ prefix: "/attendance" })
	// Authentication
	.derive((context) => {
		const user = (context as any).user;
		return { user };
	})
	// ==========================================
	// SESSIONS CRUD
	// ==========================================
	.get("/sessions", async ({ query }) => {
		const { cohort, sessionType, dateFrom, dateTo, scheduleId } = query;

		const conditions = [];
		if (cohort)
			conditions.push(
				eq(attendanceSessions.cohort, parseInt(cohort as string, 10)),
			);
		if (sessionType && sessionType !== "all")
			conditions.push(
				eq(attendanceSessions.sessionType, sessionType as string),
			);
		if (dateFrom)
			conditions.push(sql`${attendanceSessions.sessionDate} >= ${dateFrom}`);
		if (dateTo)
			conditions.push(sql`${attendanceSessions.sessionDate} <= ${dateTo}`);

		if (scheduleId) {
			const idNum = parseInt(scheduleId as string, 10);
			if (sessionType === "kelas")
				conditions.push(eq(attendanceSessions.classScheduleId, idNum));
			if (sessionType === "praktikum")
				conditions.push(eq(attendanceSessions.practicumScheduleId, idNum));
			if (sessionType === "piket")
				conditions.push(eq(attendanceSessions.dutyScheduleId, idNum));
		}

		const data = await db.query.attendanceSessions.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				records: {
					columns: { id: true, status: true },
				},
			},
			orderBy: [
				desc(attendanceSessions.sessionDate),
				desc(attendanceSessions.startTime),
			],
		});

		// Calculate attendance stats for the listing
		const enrichedData = data.map((session) => {
			const totalHadir = session.records.filter(
				(r) => r.status === "hadir",
			).length;
			return {
				...session,
				totalStudents: session.records.length,
				totalPresent: totalHadir,
			};
		});

		return { success: true, data: enrichedData };
	})
	.get("/sessions/:id", async ({ params }) => {
		const id = parseInt(params.id, 10);
		const data = await db.query.attendanceSessions.findFirst({
			where: eq(attendanceSessions.id, id),
			with: {
				records: {
					with: {
						student: {
							columns: { id: true, nim: true, name: true },
						},
					},
				},
			},
		});
		return { success: true, data };
	})
	.post("/sessions", async ({ body, user }) => {
		const payload = body as any;

		const result = await db
			.insert(attendanceSessions)
			.values({
				sessionType: payload.sessionType,
				cohort: parseInt(payload.cohort, 10),
				subject: payload.subject,
				sessionDate: payload.sessionDate,
				startTime: payload.startTime,
				endTime: payload.endTime,
				room: payload.room,
				notes: payload.notes,
				classScheduleId: payload.classScheduleId
					? parseInt(payload.classScheduleId, 10)
					: null,
				practicumScheduleId: payload.practicumScheduleId
					? parseInt(payload.practicumScheduleId, 10)
					: null,
				dutyScheduleId: payload.dutyScheduleId
					? parseInt(payload.dutyScheduleId, 10)
					: null,
				createdBy: user.id,
			})
			.returning();

		return { success: true, data: result[0] };
	})
	.patch("/sessions/:id", async ({ params, body }) => {
		const id = parseInt(params.id, 10);
		const payload = body as any;

		const updateData: any = { updatedAt: new Date() };
		if (payload.subject !== undefined) updateData.subject = payload.subject;
		if (payload.sessionDate !== undefined)
			updateData.sessionDate = payload.sessionDate;
		if (payload.startTime !== undefined)
			updateData.startTime = payload.startTime;
		if (payload.endTime !== undefined) updateData.endTime = payload.endTime;
		if (payload.room !== undefined) updateData.room = payload.room;
		if (payload.notes !== undefined) updateData.notes = payload.notes;

		const result = await db
			.update(attendanceSessions)
			.set(updateData)
			.where(eq(attendanceSessions.id, id))
			.returning();
		return { success: true, data: result[0] };
	})
	.delete("/sessions/:id", async ({ params }) => {
		await db
			.delete(attendanceSessions)
			.where(eq(attendanceSessions.id, parseInt(params.id, 10)));
		return { success: true };
	})

	// ==========================================
	// RECORDS CRUD & SYNC
	// ==========================================
	.post("/sessions/:id/records/bulk", async ({ params, body, user }) => {
		const sessionId = parseInt(params.id, 10);
		const { records } = body as {
			records: Array<{ studentId: number; status: string; notes?: string }>;
		};

		// 1. Get existing records for this session to know what to update vs insert
		const existingRecords = await db.query.attendanceRecords.findMany({
			where: eq(attendanceRecords.sessionId, sessionId),
		});

		const existingMap = new Map(existingRecords.map((r) => [r.studentId, r]));

		// 2. Perform upserts
		const studentsToSync = new Set<number>();

		const toInsert = [];
		for (const rec of records) {
			studentsToSync.add(rec.studentId);
			const ext = existingMap.get(rec.studentId);
			if (ext) {
				await db
					.update(attendanceRecords)
					.set({
						status: rec.status,
						notes: rec.notes,
					})
					.where(eq(attendanceRecords.id, ext.id));
			} else {
				toInsert.push({
					sessionId,
					studentId: rec.studentId,
					status: rec.status,
					notes: rec.notes,
					recordedBy: user.id,
				});
			}
		}

		if (toInsert.length > 0) {
			await db.insert(attendanceRecords).values(toInsert);
		}

		// 3. Sync aggregation to academic_data
		// For each student, calculate their aggregate
		for (const studentId of studentsToSync) {
			await syncAttendanceAggregate(studentId);
		}

		return { success: true, message: "Records saved successfully" };
	})

	// ==========================================
	// ACADEMIC DATA (MANUAL OVERRIDE & RESET)
	// ==========================================
	.patch("/academic-data/:studentId", async ({ params, body }) => {
		const studentId = parseInt(params.studentId, 10);
		const payload = body as any;

		const updateData: any = {};
		if (payload.attendanceTotal !== undefined)
			updateData.attendanceTotal = payload.attendanceTotal;
		if (payload.attendancePresent !== undefined)
			updateData.attendancePresent = payload.attendancePresent;
		if (payload.attendancePiketTotal !== undefined)
			updateData.attendancePiketTotal = payload.attendancePiketTotal;
		if (payload.attendancePiketPresent !== undefined)
			updateData.attendancePiketPresent = payload.attendancePiketPresent;
		if (payload.attendanceOdsTotal !== undefined)
			updateData.attendanceOdsTotal = payload.attendanceOdsTotal;
		if (payload.attendanceOdsPresent !== undefined)
			updateData.attendanceOdsPresent = payload.attendanceOdsPresent;
		if (payload.attendancePramagangTotal !== undefined)
			updateData.attendancePramagangTotal = payload.attendancePramagangTotal;
		if (payload.attendancePramagangPresent !== undefined)
			updateData.attendancePramagangPresent =
				payload.attendancePramagangPresent;

		const existingData = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, studentId),
		});

		if (existingData) {
			const result = await db
				.update(academicData)
				.set(updateData)
				.where(eq(academicData.id, existingData.id))
				.returning();
			return { success: true, data: result[0] };
		} else {
			const result = await db
				.insert(academicData)
				.values({
					studentId,
					...updateData,
				})
				.returning();
			return { success: true, data: result[0] };
		}
	})
	.delete("/academic-data/:studentId", async ({ params }) => {
		const studentId = parseInt(params.studentId, 10);

		const existingData = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, studentId),
		});

		if (existingData) {
			await db
				.update(academicData)
				.set({
					attendanceTotal: 0,
					attendancePresent: 0,
					attendancePiketTotal: 0,
					attendancePiketPresent: 0,
					attendanceOdsTotal: 0,
					attendanceOdsPresent: 0,
					attendancePramagangTotal: 0,
					attendancePramagangPresent: 0,
				})
				.where(eq(academicData.id, existingData.id));
		}

		// Also optionally delete all actual records for this student if "reset" implies erasing history,
		// but the user said "hapus saja ... di tiap mahasiswa yang ada di tabel". Usually, it's safer to just zero the summary,
		// or maybe they meant deleting the student? "akses edit hapus saja, pindahkan ke tiap tiap mahasiswa yang ada di tabel, lalu tabelnya itu menampilkan..."
		// I will just reset the summary for now, which is what they confirmed.

		return { success: true, message: "Attendance data reset successfully" };
	})

	// ==========================================
	// STUDENT INDIVIDUAL ATTENDANCE DATA
	// ==========================================
	.get("/mahasiswa/:studentId/mata-kuliah", async ({ params }) => {
		const studentId = parseInt(params.studentId, 10);
		const grades = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, studentId),
			orderBy: (grades, { asc }) => [asc(grades.id)],
			with: {
				dosen: {
					columns: { fullName: true },
				},
			},
		});

		const records = await db.query.attendanceRecords.findMany({
			where: eq(attendanceRecords.studentId, studentId),
			with: {
				session: true,
			},
		});

		// Filter only kelas & praktikum
		const mkRecords = records.filter(
			(r) =>
				r.session.sessionType === "kelas" ||
				r.session.sessionType === "praktikum",
		);

		return { success: true, data: { grades, records: mkRecords } };
	})
	.patch(
		"/mahasiswa/:studentId/mata-kuliah/:courseGradeId",
		async ({ params, body }) => {
			const courseGradeId = parseInt(params.courseGradeId, 10);
			const payload = body as any;
			const updateData: any = { updatedAt: new Date() };
			if (payload.attendancePresent !== undefined)
				updateData.attendancePresent = payload.attendancePresent;
			if (payload.totalMeetings !== undefined)
				updateData.totalMeetings = payload.totalMeetings;
			// Auto calculate rate
			if (
				payload.attendancePresent !== undefined &&
				payload.totalMeetings !== undefined
			) {
				const rate =
					payload.totalMeetings > 0
						? Math.round(
								(payload.attendancePresent / payload.totalMeetings) * 100,
							)
						: 0;
				updateData.attendanceRate = rate;
			}
			const result = await db
				.update(courseGrades)
				.set(updateData)
				.where(eq(courseGrades.id, courseGradeId))
				.returning();
			return { success: true, data: result[0] };
		},
	)
	.get("/mahasiswa/:studentId/piket", async ({ params }) => {
		const studentId = parseInt(params.studentId, 10);

		// Get actual attendance records
		const records = await db.query.attendanceRecords.findMany({
			where: eq(attendanceRecords.studentId, studentId),
			with: {
				session: true,
				recorder: { columns: { fullName: true } },
			},
			orderBy: [desc(attendanceRecords.id)],
		});
		const piketRecords = records.filter(
			(r) => r.session.sessionType === "piket",
		);

		// Get duty schedules for this student
		const allSchedules = await db.query.dutySchedules.findMany({
			orderBy: [desc(dutySchedules.id)],
		});

		const studentSchedules = allSchedules.filter((s) => {
			if (!s.members || !Array.isArray(s.members)) return false;
			return s.members.some((m: any) => m.id === studentId);
		});

		return {
			success: true,
			data: { records: piketRecords, schedules: studentSchedules },
		};
	})
	.post("/mahasiswa/:studentId/piket", async ({ params, body, user }) => {
		try {
			const studentId = parseInt(params.studentId, 10);
			const payload = body as any;

			// 1. Find or create a session for this date
			const sessionConditions = [
				eq(attendanceSessions.sessionType, "piket"),
				eq(attendanceSessions.sessionDate, payload.date),
			];
			if (payload.scheduleId) {
				sessionConditions.push(
					eq(
						attendanceSessions.dutyScheduleId,
						parseInt(payload.scheduleId, 10),
					),
				);
			}

			let session = await db.query.attendanceSessions.findFirst({
				where: and(...sessionConditions),
			});

			if (!session) {
				let scheduleDetails = null;
				if (payload.scheduleId) {
					scheduleDetails = await db.query.dutySchedules.findFirst({
						where: eq(dutySchedules.id, parseInt(payload.scheduleId, 10)),
					});
				}

				const result = await db
					.insert(attendanceSessions)
					.values({
						sessionType: "piket",
						cohort: scheduleDetails ? scheduleDetails.cohort : 0,
						subject: scheduleDetails
							? `Piket ${scheduleDetails.groupName}`
							: "Piket Kebersihan",
						sessionDate: payload.date,
						startTime: scheduleDetails?.startTime || "00:00",
						endTime: scheduleDetails?.endTime || "23:59",
						room: scheduleDetails?.room || "Area Kampus",
						dutyScheduleId: scheduleDetails ? scheduleDetails.id : null,
						createdBy: user.id,
					})
					.returning();
				session = result[0];
			}

			// 2. Insert attendance record
			const result = await db
				.insert(attendanceRecords)
				.values({
					sessionId: session.id,
					studentId: studentId,
					status: payload.status,
					notes: payload.notes,
					recordedBy: user.id,
				})
				.returning();

			await syncAttendanceAggregate(studentId);

			return { success: true, data: result[0] };
		} catch (error: any) {
			console.error("POST piket error:", error);
			return { success: false, error: error.message || String(error) };
		}
	})
	.patch("/mahasiswa/:studentId/piket/:recordId", async ({ params, body }) => {
		const recordId = parseInt(params.recordId, 10);
		const studentId = parseInt(params.studentId, 10);
		const payload = body as any;
		await db
			.update(attendanceRecords)
			.set({ status: payload.status, notes: payload.notes })
			.where(eq(attendanceRecords.id, recordId));
		await syncAttendanceAggregate(studentId);
		return { success: true };
	})

	// =========================================================================
	// PIKET MANAGEMENT (DAILY BOARD, SAVE BATCH, REKAP & STUDENT SUMMARY)
	// =========================================================================
	.get("/piket/daily-board", async ({ query }) => {
		const targetDate =
			(query.date as string) || new Date().toISOString().split("T")[0];
		const cohortFilter = query.cohort as string | undefined;
		const search = (query.search as string | undefined)?.toLowerCase();
		const showAllDays = query.allDays === "true";

		const daysOfWeekIndo = [
			"Minggu",
			"Senin",
			"Selasa",
			"Rabu",
			"Kamis",
			"Jumat",
			"Sabtu",
		];
		const parsedDate = new Date(`${targetDate}T00:00:00Z`);
		const dayName = daysOfWeekIndo[parsedDate.getUTCDay()];

		// 1. Fetch all duty schedules
		const dutyConditions = [];
		if (cohortFilter && cohortFilter !== "all") {
			dutyConditions.push(eq(dutySchedules.cohort, parseInt(cohortFilter, 10)));
		}

		if (!showAllDays) {
			dutyConditions.push(
				or(
					eq(dutySchedules.dayOfWeek, dayName),
					eq(dutySchedules.sessionDate, targetDate),
				),
			);
		}

		const schedules = await db.query.dutySchedules.findMany({
			where: dutyConditions.length > 0 ? and(...dutyConditions) : undefined,
			orderBy: [asc(dutySchedules.dayOfWeek), asc(dutySchedules.startTime)],
		});

		// 2. Fetch existing piket sessions for this date
		const sessions = await db.query.attendanceSessions.findMany({
			where: and(
				eq(attendanceSessions.sessionType, "piket"),
				eq(attendanceSessions.sessionDate, targetDate),
			),
			with: {
				records: {
					with: {
						student: {
							columns: { id: true, name: true, nim: true, phone: true },
						},
						recorder: { columns: { fullName: true } },
					},
				},
				creator: { columns: { fullName: true } },
			},
		});

		const sessionMap = new Map<number, (typeof sessions)[0]>();
		for (const s of sessions) {
			if (s.dutyScheduleId) {
				sessionMap.set(s.dutyScheduleId, s);
			}
		}

		// 3. Map duty schedules to enriched group items
		const groups = schedules.map((schedule) => {
			const session = sessionMap.get(schedule.id) || null;
			const existingRecords = session?.records || [];
			const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));

			const rawMembers = Array.isArray(schedule.members)
				? (schedule.members as any[])
				: [];

			const members = rawMembers.map((m: any) => {
				const sId = m.id || m.studentId;
				const rec = recordMap.get(sId);
				return {
					studentId: sId,
					name: m.name || m.studentName || "Mahasiswa",
					nim: m.nim || m.studentNIM || "-",
					status: rec ? rec.status : null,
					notes: rec ? rec.notes || "" : "",
					recordId: rec ? rec.id : null,
					recordedBy: rec?.recorder?.fullName || null,
					recordedAt: rec?.recordedAt || null,
				};
			});

			const hadirCount = members.filter((m) => m.status === "hadir").length;
			const izinCount = members.filter((m) => m.status === "izin").length;
			const sakitCount = members.filter((m) => m.status === "sakit").length;
			const alphaCount = members.filter((m) => m.status === "alpha").length;
			const unrecordedCount = members.filter((m) => !m.status).length;
			const totalMembers = members.length;
			const isCompleted = totalMembers > 0 && unrecordedCount === 0;

			return {
				schedule,
				session,
				sessionId: session?.id || null,
				isRecorded: !!session && existingRecords.length > 0,
				isCompleted,
				lastRecordedBy: session?.creator?.fullName || null,
				sessionNotes: session?.notes || "",
				members,
				stats: {
					total: totalMembers,
					hadir: hadirCount,
					izin: izinCount,
					sakit: sakitCount,
					alpha: alphaCount,
					unrecorded: unrecordedCount,
					attendanceRate:
						totalMembers > 0
							? Math.round((hadirCount / totalMembers) * 100)
							: 0,
				},
			};
		});

		// 4. Filter by search if provided
		const filteredGroups = search
			? groups.filter((g) => {
					const matchGroup =
						g.schedule.groupName.toLowerCase().includes(search) ||
						g.schedule.room.toLowerCase().includes(search);
					const matchMember = g.members.some(
						(m) =>
							m.name.toLowerCase().includes(search) ||
							m.nim.toLowerCase().includes(search),
					);
					return matchGroup || matchMember;
				})
			: groups;

		// 5. Aggregate overall summary stats
		let totalScheduledStudents = 0;
		let totalHadir = 0;
		let totalIzin = 0;
		let totalSakit = 0;
		let totalAlpha = 0;
		let totalUnrecorded = 0;
		let recordedGroupsCount = 0;

		for (const g of filteredGroups) {
			totalScheduledStudents += g.stats.total;
			totalHadir += g.stats.hadir;
			totalIzin += g.stats.izin;
			totalSakit += g.stats.sakit;
			totalAlpha += g.stats.alpha;
			totalUnrecorded += g.stats.unrecorded;
			if (g.isRecorded) recordedGroupsCount++;
		}

		const overallRate =
			totalScheduledStudents > 0
				? Math.round((totalHadir / totalScheduledStudents) * 100)
				: 0;

		return {
			success: true,
			data: {
				date: targetDate,
				dayName,
				groups: filteredGroups,
				summary: {
					totalGroups: filteredGroups.length,
					recordedGroups: recordedGroupsCount,
					totalStudents: totalScheduledStudents,
					hadir: totalHadir,
					izin: totalIzin,
					sakit: totalSakit,
					alpha: totalAlpha,
					unrecorded: totalUnrecorded,
					attendanceRate: overallRate,
				},
			},
		};
	})
	.post("/piket/daily-board/save", async ({ body, user, set }) => {
		const payload = body as {
			dutyScheduleId: number;
			sessionDate: string;
			notes?: string;
			records: Array<{
				studentId: number;
				status: "hadir" | "izin" | "sakit" | "alpha";
				notes?: string;
			}>;
		};

		if (!payload.dutyScheduleId || !payload.sessionDate) {
			set.status = 400;
			return { success: false, message: "ID Jadwal dan Tanggal wajib diisi" };
		}

		// 1. Fetch duty schedule
		const dutySchedule = await db.query.dutySchedules.findFirst({
			where: eq(dutySchedules.id, payload.dutyScheduleId),
		});

		if (!dutySchedule) {
			set.status = 404;
			return { success: false, message: "Jadwal piket tidak ditemukan" };
		}

		// 2. Find or create session
		let session = await db.query.attendanceSessions.findFirst({
			where: and(
				eq(attendanceSessions.sessionType, "piket"),
				eq(attendanceSessions.dutyScheduleId, payload.dutyScheduleId),
				eq(attendanceSessions.sessionDate, payload.sessionDate),
			),
		});

		if (!session) {
			const [newSession] = await db
				.insert(attendanceSessions)
				.values({
					sessionType: "piket",
					dutyScheduleId: dutySchedule.id,
					cohort: dutySchedule.cohort,
					subject: `Piket ${dutySchedule.groupName}`,
					sessionDate: payload.sessionDate,
					startTime: dutySchedule.startTime || "07:00",
					endTime: dutySchedule.endTime || "08:00",
					room: dutySchedule.room,
					notes: payload.notes || dutySchedule.notes || null,
					createdBy: user.id,
				})
				.returning();
			session = newSession;
		} else {
			const [updatedSession] = await db
				.update(attendanceSessions)
				.set({
					notes: payload.notes !== undefined ? payload.notes : session.notes,
					updatedAt: new Date(),
				})
				.where(eq(attendanceSessions.id, session.id))
				.returning();
			session = updatedSession;
		}

		// 3. Upsert records
		const existingRecords = await db.query.attendanceRecords.findMany({
			where: eq(attendanceRecords.sessionId, session.id),
		});
		const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));

		const studentsToSync = new Set<number>();

		for (const rec of payload.records || []) {
			studentsToSync.add(rec.studentId);
			const existing = recordMap.get(rec.studentId);

			if (existing) {
				await db
					.update(attendanceRecords)
					.set({
						status: rec.status,
						notes: rec.notes !== undefined ? rec.notes : existing.notes,
						recordedBy: user.id,
						recordedAt: new Date(),
					})
					.where(eq(attendanceRecords.id, existing.id));
			} else {
				await db.insert(attendanceRecords).values({
					sessionId: session.id,
					studentId: rec.studentId,
					status: rec.status,
					notes: rec.notes || null,
					recordedBy: user.id,
					recordedAt: new Date(),
				});
			}
		}

		// 4. Sync aggregate to academic_data
		for (const sId of studentsToSync) {
			await syncAttendanceAggregate(sId);
		}

		return {
			success: true,
			message: "Presensi piket berhasil disimpan",
			data: { sessionId: session.id },
		};
	})
	.get("/piket/rekap-history", async ({ query }) => {
		const { cohort, dateFrom, dateTo, search } = query;

		const conditions = [eq(attendanceSessions.sessionType, "piket")];
		if (cohort && cohort !== "all") {
			conditions.push(
				eq(attendanceSessions.cohort, parseInt(cohort as string, 10)),
			);
		}
		if (dateFrom) {
			conditions.push(sql`${attendanceSessions.sessionDate} >= ${dateFrom}`);
		}
		if (dateTo) {
			conditions.push(sql`${attendanceSessions.sessionDate} <= ${dateTo}`);
		}

		const sessions = await db.query.attendanceSessions.findMany({
			where: and(...conditions),
			with: {
				dutySchedule: true,
				creator: { columns: { fullName: true } },
				records: {
					with: {
						student: {
							columns: { id: true, name: true, nim: true, cohort: true },
						},
						recorder: { columns: { fullName: true } },
					},
				},
			},
			orderBy: [
				desc(attendanceSessions.sessionDate),
				desc(attendanceSessions.id),
			],
		});

		const enriched = sessions.map((session) => {
			const records = session.records || [];
			const hadir = records.filter((r) => r.status === "hadir").length;
			const izin = records.filter((r) => r.status === "izin").length;
			const sakit = records.filter((r) => r.status === "sakit").length;
			const alpha = records.filter((r) => r.status === "alpha").length;
			const total = records.length;
			const attendanceRate = total > 0 ? Math.round((hadir / total) * 100) : 0;

			return {
				id: session.id,
				sessionDate: session.sessionDate,
				groupName: session.dutySchedule?.groupName || session.subject,
				room: session.room,
				cohort: session.cohort,
				startTime: session.startTime,
				endTime: session.endTime,
				notes: session.notes,
				recordedBy: session.creator?.fullName || "Petugas",
				createdAt: session.createdAt,
				stats: {
					total,
					hadir,
					izin,
					sakit,
					alpha,
					attendanceRate,
				},
				records,
			};
		});

		const filtered = search
			? enriched.filter((s) => {
					const q = (search as string).toLowerCase();
					return (
						s.groupName.toLowerCase().includes(q) ||
						s.room.toLowerCase().includes(q) ||
						s.records.some(
							(r) =>
								(r.student?.name && r.student.name.toLowerCase().includes(q)) ||
								(r.student?.nim && r.student.nim.toLowerCase().includes(q)),
						)
					);
				})
			: enriched;

		return { success: true, data: filtered };
	})
	.get("/piket/student-summary", async ({ query }) => {
		const { cohort, search, status } = query;

		const studentConditions = [eq(students.isArchived, false)];
		if (cohort && cohort !== "all") {
			studentConditions.push(
				eq(students.cohort, parseInt(cohort as string, 10)),
			);
		}

		const [allStudents, allAcademicData] = await Promise.all([
			db.query.students.findMany({
				where: and(...studentConditions),
				orderBy: [asc(students.name)],
			}),
			db.query.academicData.findMany(),
		]);

		const acadMap = new Map(allAcademicData.map((a) => [a.studentId, a]));

		const mapped = allStudents.map((s) => {
			const acad = acadMap.get(s.id);
			const total = acad?.attendancePiketTotal || 0;
			const present = acad?.attendancePiketPresent || 0;
			const rate = total > 0 ? Math.round((present / total) * 100) : 0;

			let complianceStatus: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "AMAN";
			if (total > 0) {
				if (rate >= 85) complianceStatus = "AMAN";
				else if (rate >= 70) complianceStatus = "PERLU_PERHATIAN";
				else complianceStatus = "TIDAK_AMAN";
			}

			return {
				id: s.id,
				nim: s.nim,
				name: s.name,
				cohort: s.cohort,
				program: s.program,
				subProgram: s.subProgram,
				phone: s.phone,
				totalJadwal: total,
				totalHadir: present,
				attendanceRate: rate,
				complianceStatus,
			};
		});

		const filtered = mapped.filter((s) => {
			if (search) {
				const q = (search as string).toLowerCase();
				const matchSearch =
					s.name.toLowerCase().includes(q) ||
					(s.nim && s.nim.toLowerCase().includes(q)) ||
					(s.program && s.program.toLowerCase().includes(q));
				if (!matchSearch) return false;
			}

			if (status && status !== "all") {
				if (status === "aman" && s.complianceStatus !== "AMAN") return false;
				if (status === "perhatian" && s.complianceStatus !== "PERLU_PERHATIAN")
					return false;
				if (status === "tidak_aman" && s.complianceStatus !== "TIDAK_AMAN")
					return false;
			}

			return true;
		});

		return { success: true, data: filtered };
	})
	// ODS Routes
	.get("/mahasiswa/:studentId/ods", async ({ params }) => {
		const studentId = parseInt(params.studentId, 10);
		const records = await db.query.odsAttendanceRecords.findMany({
			where: eq(odsAttendanceRecords.studentId, studentId),
			with: { recorder: { columns: { fullName: true } } },
			orderBy: [desc(odsAttendanceRecords.date)],
		});
		return { success: true, data: records };
	})
	.post("/mahasiswa/:studentId/ods", async ({ params, body, user, set }) => {
		if (!hasRole(user, "crm")) {
			set.status = 403;
			return {
				success: false,
				message:
					"Hanya Divisi CRM yang memiliki hak akses menginput data One Day Service",
			};
		}
		const studentId = parseInt(params.studentId, 10);
		const payload = body as any;
		const result = await db
			.insert(odsAttendanceRecords)
			.values({
				studentId,
				date: payload.date,
				status: payload.status,
				notes: payload.notes,
				recordedBy: user.id,
			})
			.returning();
		await syncAttendanceAggregate(studentId);
		return { success: true, data: result[0] };
	})
	.patch(
		"/mahasiswa/:studentId/ods/:recordId",
		async ({ params, body, user, set }) => {
			if (!hasRole(user, "crm")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya Divisi CRM yang memiliki hak akses mengubah data One Day Service",
				};
			}
			const recordId = parseInt(params.recordId, 10);
			const studentId = parseInt(params.studentId, 10);
			const payload = body as any;
			const result = await db
				.update(odsAttendanceRecords)
				.set({
					date: payload.date,
					status: payload.status,
					notes: payload.notes,
				})
				.where(eq(odsAttendanceRecords.id, recordId))
				.returning();
			await syncAttendanceAggregate(studentId);
			return { success: true, data: result[0] };
		},
	)
	// Pramagang Routes
	.get("/mahasiswa/:studentId/pramagang", async ({ params }) => {
		const studentId = parseInt(params.studentId, 10);
		const records = await db.query.pramagangAttendanceRecords.findMany({
			where: eq(pramagangAttendanceRecords.studentId, studentId),
			with: { recorder: { columns: { fullName: true } } },
			orderBy: [desc(pramagangAttendanceRecords.date)],
		});
		return { success: true, data: records };
	})
	.post(
		"/mahasiswa/:studentId/pramagang",
		async ({ params, body, user, set }) => {
			if (!hasRole(user, "crm")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya Divisi CRM yang memiliki hak akses menginput data Pra Magang",
				};
			}
			const studentId = parseInt(params.studentId, 10);
			const payload = body as any;
			const result = await db
				.insert(pramagangAttendanceRecords)
				.values({
					studentId,
					date: payload.date,
					status: payload.status,
					notes: payload.notes,
					recordedBy: user.id,
				})
				.returning();
			await syncAttendanceAggregate(studentId);
			return { success: true, data: result[0] };
		},
	)
	.patch(
		"/mahasiswa/:studentId/pramagang/:recordId",
		async ({ params, body, user, set }) => {
			if (!hasRole(user, "crm")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya Divisi CRM yang memiliki hak akses mengubah data Pra Magang",
				};
			}
			const recordId = parseInt(params.recordId, 10);
			const studentId = parseInt(params.studentId, 10);
			const payload = body as any;
			const result = await db
				.update(pramagangAttendanceRecords)
				.set({
					date: payload.date,
					status: payload.status,
					notes: payload.notes,
				})
				.where(eq(pramagangAttendanceRecords.id, recordId))
				.returning();
			await syncAttendanceAggregate(studentId);
			return { success: true, data: result[0] };
		},
	);

// Helper function to sync attendance aggregate for a student
async function syncAttendanceAggregate(studentId: number) {
	// Query all records for this student
	const allRecords = await db.query.attendanceRecords.findMany({
		where: eq(attendanceRecords.studentId, studentId),
		with: {
			session: true,
		},
	});

	let kelasPraktikumTotal = 0;
	let kelasPraktikumHadir = 0;

	let piketTotal = 0;
	let piketHadir = 0;

	for (const rec of allRecords) {
		const type = rec.session.sessionType;
		if (type === "kelas" || type === "praktikum") {
			kelasPraktikumTotal++;
			if (rec.status === "hadir" || rec.status === "izin")
				kelasPraktikumHadir++;
		} else if (type === "piket") {
			piketTotal++;
			if (rec.status === "hadir" || rec.status === "izin") piketHadir++;
		}
	}

	// Query ODS
	const odsRecords = await db.query.odsAttendanceRecords.findMany({
		where: eq(odsAttendanceRecords.studentId, studentId),
	});
	const odsTotal = odsRecords.length;
	const odsHadir = odsRecords.filter(
		(r) => r.status === "hadir" || r.status === "izin",
	).length;

	// Query Pramagang
	const pramagangRecords = await db.query.pramagangAttendanceRecords.findMany({
		where: eq(pramagangAttendanceRecords.studentId, studentId),
	});
	const pramagangTotal = pramagangRecords.length;
	const pramagangHadir = pramagangRecords.filter(
		(r) => r.status === "hadir" || r.status === "izin",
	).length;

	// Check if academicData exists
	const existingData = await db.query.academicData.findFirst({
		where: eq(academicData.studentId, studentId),
	});

	if (existingData) {
		await db
			.update(academicData)
			.set({
				attendanceTotal: kelasPraktikumTotal,
				attendancePresent: kelasPraktikumHadir,
				attendancePiketTotal: piketTotal,
				attendancePiketPresent: piketHadir,
				attendanceOdsTotal: odsTotal,
				attendanceOdsPresent: odsHadir,
				attendancePramagangTotal: pramagangTotal,
				attendancePramagangPresent: pramagangHadir,
			})
			.where(eq(academicData.id, existingData.id));
	} else {
		await db.insert(academicData).values({
			studentId,
			attendanceTotal: kelasPraktikumTotal,
			attendancePresent: kelasPraktikumHadir,
			attendancePiketTotal: piketTotal,
			attendancePiketPresent: piketHadir,
			attendanceOdsTotal: odsTotal,
			attendanceOdsPresent: odsHadir,
			attendancePramagangTotal: pramagangTotal,
			attendancePramagangPresent: pramagangHadir,
		});
	}
}
