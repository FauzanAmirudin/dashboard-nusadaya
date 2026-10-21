import { and, asc, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	academicData,
	attendanceRecords,
	attendanceSessions,
	classSchedules,
	courseGrades,
	courseMeetingAttendances,
	courseMeetings,
	courses,
	dutySchedules,
	morningAssemblyRecords,
	morningAssemblyScheduleConfig,
	morningAssemblySessions,
	odsAttendanceRecords,
	practicumSchedules,
	pramagangAttendanceRecords,
	students,
	users,
} from "../db/schema";
import { cacheInvalidatePattern } from "../lib/cache";
import { hasRole } from "../lib/permissions";

export const attendanceRoutes = new Elysia({ prefix: "/attendance" })
	.onAfterResponse(async ({ request, set }) => {
		if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
			const status = typeof set.status === "number" ? set.status : 200;
			if (status < 400) {
				await Promise.all([
					cacheInvalidatePattern("cache:students:*"),
					cacheInvalidatePattern("cache:student:*"),
					cacheInvalidatePattern("cache:attendance:*"),
					cacheInvalidatePattern("cache:dashboard:*"),
				]);
			}
		}
	})
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
				course: true,
			},
		});

		const courseIds = grades
			.map((g) => g.courseId)
			.filter((id): id is number => typeof id === "number");

		let allMeetings: any[] = [];
		let allAttendances: any[] = [];

		if (courseIds.length > 0) {
			allMeetings = await db.query.courseMeetings.findMany({
				where: and(
					inArray(courseMeetings.courseId, courseIds),
					gte(courseMeetings.meetingNumber, 1),
					lte(courseMeetings.meetingNumber, 16),
				),
				orderBy: [asc(courseMeetings.meetingNumber)],
			});

			const meetingIds = allMeetings.map((m) => m.id);
			if (meetingIds.length > 0) {
				allAttendances = await db.query.courseMeetingAttendances.findMany({
					where: and(
						inArray(courseMeetingAttendances.meetingId, meetingIds),
						eq(courseMeetingAttendances.studentId, studentId),
					),
				});
			}
		}

		const attendanceMap = new Map<number, (typeof allAttendances)[0]>();
		for (const att of allAttendances) {
			attendanceMap.set(att.meetingId, att);
		}

		// Map meetings to each course
		const enrichedGrades = grades.map((g) => {
			const cMeetings = allMeetings
				.filter((m) => m.courseId === g.courseId)
				.map((m) => {
					const att = attendanceMap.get(m.id);
					return {
						id: m.id,
						meetingNumber: m.meetingNumber,
						meetingType: m.meetingType,
						sessionType: m.sessionType,
						meetingLabel: m.meetingLabel,
						description: m.description,
						meetingDate: m.meetingDate,
						status: att ? att.status : null,
						theoryScore: att ? att.theoryScore : null,
						practicalScore: att ? att.practicalScore : null,
						notes: att ? att.notes : null,
					};
				});

			// Real-time calculation from actual attendances in DB
			const presentCount = cMeetings.filter((m) => m.status === "hadir").length;
			const totalMeetings = 16;
			const attendanceRate = Math.min(
				100,
				Math.round((presentCount / totalMeetings) * 100),
			);

			const validTheories = cMeetings
				.filter((m) => m.theoryScore !== null && m.theoryScore !== undefined)
				.map((m) => m.theoryScore as number);
			const avgTheory =
				validTheories.length > 0
					? Math.round(
							validTheories.reduce((a, b) => a + b, 0) / validTheories.length,
						)
					: null;

			const validPracticals = cMeetings
				.filter(
					(m) => m.practicalScore !== null && m.practicalScore !== undefined,
				)
				.map((m) => m.practicalScore as number);
			const avgPractical =
				validPracticals.length > 0
					? Math.round(
							validPracticals.reduce((a, b) => a + b, 0) /
								validPracticals.length,
						)
					: null;

			const isPractical = g.course?.type === "praktik";
			let calculatedGrade: string | null = null;
			if (avgTheory !== null || avgPractical !== null) {
				const p = avgPractical ?? avgTheory ?? 0;
				const t = avgTheory ?? avgPractical ?? 0;
				const finalScore = isPractical ? Math.round(p * 0.8 + t * 0.2) : t;
				if (finalScore >= 85) calculatedGrade = "A";
				else if (finalScore >= 75) calculatedGrade = "B";
				else if (finalScore >= 65) calculatedGrade = "C";
				else if (finalScore >= 50) calculatedGrade = "D";
				else calculatedGrade = "E";
			}

			const hasActualAttendances = cMeetings.some((m) => m.status !== null);
			const finalPresent = hasActualAttendances
				? presentCount
				: g.attendancePresent || 0;
			const finalRate = hasActualAttendances
				? attendanceRate
				: g.attendanceRate || 0;
			const finalTheory = hasActualAttendances ? avgTheory : g.theoryScore;
			const finalPractical = hasActualAttendances
				? avgPractical
				: g.practicalScore;
			const finalGrade = hasActualAttendances ? calculatedGrade : g.grade;

			return {
				...g,
				totalMeetings: 16,
				attendancePresent: finalPresent,
				attendanceRate: finalRate,
				theoryScore: finalTheory,
				practicalScore: finalPractical,
				grade: finalGrade,
				meetings: cMeetings,
			};
		});

		// Backwards-compatible session logs for TabMataKuliah
		const mkRecords = allMeetings.map((m) => {
			const att = attendanceMap.get(m.id);
			const courseObj = grades.find((g) => g.courseId === m.courseId);
			return {
				id: att?.id || m.id,
				meetingId: m.id,
				studentId,
				status: att?.status || null,
				notes: att?.notes || null,
				theoryScore: att?.theoryScore ?? null,
				practicalScore: att?.practicalScore ?? null,
				session: {
					id: m.id,
					subject: courseObj?.courseName || "Perkuliahan",
					sessionDate: m.meetingDate,
					startTime: "08:00",
					endTime: "10:00",
					room: "Ruang Kelas",
					sessionType: "kelas",
				},
			};
		});

		return {
			success: true,
			data: { grades: enrichedGrades, records: mkRecords },
		};
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
			if (payload.practicalScore !== undefined)
				updateData.practicalScore = payload.practicalScore;
			if (payload.theoryScore !== undefined)
				updateData.theoryScore = payload.theoryScore;
			if (payload.attitudeNote !== undefined)
				updateData.attitudeNote = payload.attitudeNote;

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

			// Auto calculate grade if scores provided
			const existing = await db.query.courseGrades.findFirst({
				where: eq(courseGrades.id, courseGradeId),
			});

			const pScore =
				payload.practicalScore !== undefined
					? payload.practicalScore
					: existing?.practicalScore || 0;
			const tScore =
				payload.theoryScore !== undefined
					? payload.theoryScore
					: existing?.theoryScore || 0;

			if (payload.grade !== undefined) {
				updateData.grade = payload.grade;
			} else if (pScore > 0 || tScore > 0) {
				const finalScore =
					pScore > 0 && tScore > 0
						? Math.round(pScore * 0.8 + tScore * 0.2)
						: pScore || tScore;
				let displayGrade = "E";
				if (finalScore >= 85) displayGrade = "A";
				else if (finalScore >= 75) displayGrade = "B";
				else if (finalScore >= 65) displayGrade = "C";
				else if (finalScore >= 50) displayGrade = "D";
				updateData.grade = displayGrade;
			}

			const result = await db
				.update(courseGrades)
				.set(updateData)
				.where(eq(courseGrades.id, courseGradeId))
				.returning();
			return { success: true, data: result[0] };
		},
	)
	.patch(
		"/mahasiswa/:studentId/mata-kuliah-meeting/:courseId/:meetingId",
		async ({ params, body, set }) => {
			const studentId = parseInt(params.studentId, 10);
			const courseId = parseInt(params.courseId, 10);
			const meetingId = parseInt(params.meetingId, 10);
			const { status, notes, theoryScore, practicalScore } = body as {
				status: "hadir" | "izin" | "sakit" | "alpha";
				notes?: string;
				theoryScore?: number;
				practicalScore?: number;
			};

			const meeting = await db.query.courseMeetings.findFirst({
				where: and(
					eq(courseMeetings.id, meetingId),
					eq(courseMeetings.courseId, courseId),
				),
			});

			if (!meeting) {
				set.status = 404;
				return { success: false, message: "Pertemuan tidak ditemukan" };
			}

			// Check existing attendance
			const existing = await db.query.courseMeetingAttendances.findFirst({
				where: and(
					eq(courseMeetingAttendances.meetingId, meetingId),
					eq(courseMeetingAttendances.studentId, studentId),
				),
			});

			if (existing) {
				await db
					.update(courseMeetingAttendances)
					.set({
						status,
						notes: notes !== undefined ? notes : existing.notes,
						theoryScore:
							theoryScore !== undefined ? theoryScore : existing.theoryScore,
						practicalScore:
							practicalScore !== undefined
								? practicalScore
								: existing.practicalScore,
						updatedAt: new Date(),
					})
					.where(eq(courseMeetingAttendances.id, existing.id));
			} else {
				await db.insert(courseMeetingAttendances).values({
					meetingId,
					studentId,
					status,
					notes: notes || null,
					theoryScore: theoryScore ?? null,
					practicalScore: practicalScore ?? null,
				});
			}

			// Recalculate aggregates in courseGrades
			const allCourseMeetings = await db.query.courseMeetings.findMany({
				where: and(
					eq(courseMeetings.courseId, courseId),
					gte(courseMeetings.meetingNumber, 1),
					lte(courseMeetings.meetingNumber, 16),
				),
				columns: { id: true },
			});
			const allMeetingIds = allCourseMeetings.map((m) => m.id);

			if (allMeetingIds.length > 0) {
				const studentAtts = await db.query.courseMeetingAttendances.findMany({
					where: and(
						eq(courseMeetingAttendances.studentId, studentId),
						inArray(courseMeetingAttendances.meetingId, allMeetingIds),
					),
				});
				const presentCount = studentAtts.filter(
					(a) => a.status === "hadir",
				).length;
				const rate = Math.min(100, Math.round((presentCount / 16) * 100));

				// Calculate average scores if meetings have scores
				const validTheory = studentAtts
					.filter((a) => a.theoryScore !== null && a.theoryScore !== undefined)
					.map((a) => a.theoryScore as number);
				const avgTheory =
					validTheory.length > 0
						? Math.round(
								validTheory.reduce((acc, curr) => acc + curr, 0) /
									validTheory.length,
							)
						: null;

				const validPractical = studentAtts
					.filter(
						(a) => a.practicalScore !== null && a.practicalScore !== undefined,
					)
					.map((a) => a.practicalScore as number);
				const avgPractical =
					validPractical.length > 0
						? Math.round(
								validPractical.reduce((acc, curr) => acc + curr, 0) /
									validPractical.length,
							)
						: null;

				const gradeUpdate: any = {
					attendancePresent: presentCount,
					totalMeetings: 16,
					attendanceRate: rate,
					updatedAt: new Date(),
				};

				if (avgTheory !== null) gradeUpdate.theoryScore = avgTheory;
				if (avgPractical !== null) gradeUpdate.practicalScore = avgPractical;

				if (avgTheory !== null || avgPractical !== null) {
					const p = avgPractical ?? avgTheory ?? 0;
					const t = avgTheory ?? avgPractical ?? 0;
					const finalScore = Math.round(p * 0.8 + t * 0.2);
					let displayGrade = "E";
					if (finalScore >= 85) displayGrade = "A";
					else if (finalScore >= 75) displayGrade = "B";
					else if (finalScore >= 65) displayGrade = "C";
					else if (finalScore >= 50) displayGrade = "D";
					gradeUpdate.grade = displayGrade;
				}

				await db
					.update(courseGrades)
					.set(gradeUpdate)
					.where(
						and(
							eq(courseGrades.studentId, studentId),
							eq(courseGrades.courseId, courseId),
						),
					);
			}

			return {
				success: true,
				message: "Presensi sesi kuliah berhasil diperbarui",
			};
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
	)

	// =========================================================================
	// =========================================================================
	// BARIS PAGI HYBRID (KEPATUHAN JAM KEDATANGAN 06.22 - AKD-05)
	// =========================================================================

	// 1. RECURRING SCHEDULE CONFIG
	.get("/baris-pagi/schedule-config", async ({ query }) => {
		const { cohort } = query;
		const conditions = [];
		if (cohort && cohort !== "all") {
			conditions.push(
				eq(
					morningAssemblyScheduleConfig.cohort,
					parseInt(cohort as string, 10),
				),
			);
		}
		const configs = await db.query.morningAssemblyScheduleConfig.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			orderBy: [asc(morningAssemblyScheduleConfig.cohort)],
		});
		return { success: true, data: configs };
	})

	.post("/baris-pagi/schedule-config", async ({ body, user, set }) => {
		const payload = body as {
			cohort: number | string;
			dayOfWeek?: number;
			targetTime?: string;
			checkInWindowStart?: string;
			checkInWindowEnd?: string;
			location?: string;
			rombel?: string;
			isActive?: boolean;
		};

		if (!payload.cohort) {
			set.status = 400;
			return { success: false, message: "Angkatan (cohort) wajib diisi" };
		}

		const cohortNum = parseInt(payload.cohort.toString(), 10);
		const existing = await db.query.morningAssemblyScheduleConfig.findFirst({
			where: eq(morningAssemblyScheduleConfig.cohort, cohortNum),
		});

		if (existing) {
			const [updated] = await db
				.update(morningAssemblyScheduleConfig)
				.set({
					dayOfWeek:
						payload.dayOfWeek !== undefined
							? payload.dayOfWeek
							: existing.dayOfWeek,
					targetTime: payload.targetTime || existing.targetTime,
					checkInWindowStart:
						payload.checkInWindowStart || existing.checkInWindowStart,
					checkInWindowEnd:
						payload.checkInWindowEnd || existing.checkInWindowEnd,
					location: payload.location || existing.location,
					rombel: payload.rombel || existing.rombel,
					isActive:
						payload.isActive !== undefined
							? payload.isActive
							: existing.isActive,
					updatedAt: new Date(),
				})
				.where(eq(morningAssemblyScheduleConfig.id, existing.id))
				.returning();

			return {
				success: true,
				message: "Konfigurasi jadwal recurring baris pagi berhasil diperbarui",
				data: updated,
			};
		} else {
			const [created] = await db
				.insert(morningAssemblyScheduleConfig)
				.values({
					cohort: cohortNum,
					dayOfWeek: payload.dayOfWeek ?? 1,
					targetTime: payload.targetTime || "06:22",
					checkInWindowStart: payload.checkInWindowStart || "05:30",
					checkInWindowEnd: payload.checkInWindowEnd || "07:00",
					location: payload.location || "Lapangan Utama Kampus",
					rombel: payload.rombel || "Semua",
					isActive: payload.isActive ?? true,
					createdBy: await resolveValidUserId(user?.id),
				})
				.returning();

			return {
				success: true,
				message: "Konfigurasi jadwal recurring baris pagi berhasil disimpan",
				data: created,
			};
		}
	})

	// 2. AUTO GENERATE SESSIONS
	.post("/baris-pagi/generate-sessions", async ({ body, user }) => {
		const payload = body as {
			cohort?: number | string;
			startDate?: string;
			weeksAhead?: number;
		};

		const cohortNum = payload.cohort
			? parseInt(payload.cohort.toString(), 10)
			: null;
		const weeks = Math.min(Math.max(payload.weeksAhead || 4, 1), 16);

		const configConds = [eq(morningAssemblyScheduleConfig.isActive, true)];
		if (cohortNum) {
			configConds.push(eq(morningAssemblyScheduleConfig.cohort, cohortNum));
		}
		let configs = await db.query.morningAssemblyScheduleConfig.findMany({
			where: and(...configConds),
		});

		if (configs.length === 0) {
			configs = [
				{
					id: 0,
					cohort: cohortNum || 16,
					dayOfWeek: 1, // Monday
					targetTime: "06:22",
					checkInWindowStart: "05:30",
					checkInWindowEnd: "07:00",
					location: "Lapangan Utama Kampus",
					rombel: "Semua",
					isActive: true,
					createdBy: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
		}

		const createdSessions = [];

		for (const cfg of configs) {
			const targetDates: string[] = [];
			const baseDate = payload.startDate
				? new Date(payload.startDate)
				: new Date();

			for (let i = 0; i < weeks * 7; i++) {
				const checkDate = new Date(baseDate);
				checkDate.setDate(baseDate.getDate() + i);
				if (checkDate.getDay() === cfg.dayOfWeek) {
					const y = checkDate.getFullYear();
					const m = String(checkDate.getMonth() + 1).padStart(2, "0");
					const d = String(checkDate.getDate()).padStart(2, "0");
					targetDates.push(`${y}-${m}-${d}`);
				}
				if (targetDates.length >= weeks) break;
			}

			for (const dateStr of targetDates) {
				const existing = await db.query.morningAssemblySessions.findFirst({
					where: and(
						eq(morningAssemblySessions.cohort, cfg.cohort),
						eq(morningAssemblySessions.sessionDate, dateStr),
					),
				});

				if (!existing) {
					const [newSession] = await db
						.insert(morningAssemblySessions)
						.values({
							cohort: cfg.cohort,
							rombel: cfg.rombel,
							sessionDate: dateStr,
							targetTime: cfg.targetTime,
							checkInWindowStart: cfg.checkInWindowStart,
							checkInWindowEnd: cfg.checkInWindowEnd,
							location: cfg.location,
							notes: "Sesi apel pagi mingguan terjadwal otomatis",
							isAutoGenerated: true,
							sessionStatus: "scheduled",
							createdBy: await resolveValidUserId(user?.id),
						})
						.returning();
					createdSessions.push(newSession);
				}
			}
		}

		return {
			success: true,
			message: `Berhasil men-generate ${createdSessions.length} sesi apel baris pagi`,
			data: createdSessions,
		};
	})

	// 3. TODAY SESSION & WINDOW CHECK (FOR MAHASISWA & ADMIN)
	.get("/baris-pagi/today", async ({ user }) => {
		const { dateStr, timeStr } = getWIBDateTime();

		let student = null;
		if (user) {
			student = await db.query.students.findFirst({
				where: or(
					eq(students.studentUserId, user.id),
					eq(students.email, user.email || ""),
					eq(students.nim, user.username || ""),
				),
			});
		}

		const sessionConds = [
			eq(morningAssemblySessions.sessionDate, dateStr),
			sql`${morningAssemblySessions.sessionStatus} != 'cancelled'`,
		];
		if (student) {
			sessionConds.push(eq(morningAssemblySessions.cohort, student.cohort));
		}

		const session = await db.query.morningAssemblySessions.findFirst({
			where: and(...sessionConds),
			orderBy: [desc(morningAssemblySessions.id)],
			with: {
				creator: { columns: { fullName: true } },
			},
		});

		let myRecord = null;
		if (session && student) {
			myRecord = await db.query.morningAssemblyRecords.findFirst({
				where: and(
					eq(morningAssemblyRecords.sessionId, session.id),
					eq(morningAssemblyRecords.studentId, student.id),
				),
			});
		}

		const windowStart = session?.checkInWindowStart || "05:30";
		const windowEnd = session?.checkInWindowEnd || "07:00";
		const isWindowOpen = session
			? isWithinWindow(timeStr, windowStart, windowEnd)
			: false;

		let windowStatus: "UPCOMING" | "OPEN" | "CLOSED" = "CLOSED";
		if (session) {
			if (timeStr < windowStart) {
				windowStatus = "UPCOMING";
			} else if (timeStr <= windowEnd) {
				windowStatus = "OPEN";
			} else {
				windowStatus = "CLOSED";
			}
		}

		const studentCheckin = myRecord
			? {
					id: myRecord.id,
					status: myRecord.status,
					arrivalTime: myRecord.arrivalTime,
					minutesLate: myRecord.minutesLate || 0,
					checkinMethod: myRecord.checkinMethod || "officer",
					selfCheckinAt: myRecord.selfCheckinAt || null,
					selfieUrl: myRecord.selfieUrl || null,
					locationName: myRecord.locationName || null,
					distanceFromCheckpoint: myRecord.distanceFromCheckpoint ?? null,
					isWithinRadius: myRecord.isWithinRadius ?? true,
					verificationStatus: myRecord.verificationStatus || "auto_approved",
					rejectionReason: myRecord.rejectionReason || null,
				}
			: null;

		return {
			success: true,
			data: {
				hasSession: !!session,
				serverDate: dateStr,
				serverTime: timeStr,
				currentTimeWIB: `${dateStr} ${timeStr}`,
				windowStatus,
				studentCheckin,
				session: session
					? {
							id: session.id,
							cohort: session.cohort,
							rombel: session.rombel,
							sessionDate: session.sessionDate,
							targetTime: session.targetTime || "06:22",
							checkInWindowStart: session.checkInWindowStart || "05:30",
							checkInWindowEnd: session.checkInWindowEnd || "07:00",
							location: session.location,
							notes: session.notes,
							sessionStatus: session.sessionStatus,
							isAutoGenerated: session.isAutoGenerated,
							rescheduledFrom: session.rescheduledFrom,
							isWindowOpen,
							hasRecorded: !!myRecord,
							myRecord: myRecord || null,
						}
					: null,
				student: student
					? {
							id: student.id,
							name: student.name,
							nim: student.nim,
							cohort: student.cohort,
							rombel: student.rombel,
						}
					: null,
			},
		};
	})

	// 4. MAHASISWA SELF CHECK-IN
	.post("/baris-pagi/self-checkin", async ({ body, user, set }) => {
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
			return {
				success: false,
				message: "Profil mahasiswa Anda tidak ditemukan dalam database.",
			};
		}

		const { dateStr, timeStr } = getWIBDateTime();

		const session = await db.query.morningAssemblySessions.findFirst({
			where: and(
				eq(morningAssemblySessions.sessionDate, dateStr),
				eq(morningAssemblySessions.cohort, student.cohort),
				sql`${morningAssemblySessions.sessionStatus} != 'cancelled'`,
			),
		});

		if (!session) {
			set.status = 404;
			return {
				success: false,
				message: `Tidak ada sesi apel baris pagi aktif untuk Angkatan ${student.cohort} pada hari ini (${dateStr}).`,
			};
		}

		const windowStart = session.checkInWindowStart || "05:30";
		const windowEnd = session.checkInWindowEnd || "07:00";
		const withinWindow = isWithinWindow(timeStr, windowStart, windowEnd);

		if (!withinWindow) {
			set.status = 400;
			return {
				success: false,
				message: `Batas waktu presensi mandiri adalah pukul ${windowStart} - ${windowEnd} WIB. Waktu server saat ini ${timeStr} WIB.`,
			};
		}

		const existingRecord = await db.query.morningAssemblyRecords.findFirst({
			where: and(
				eq(morningAssemblyRecords.sessionId, session.id),
				eq(morningAssemblyRecords.studentId, student.id),
			),
		});

		if (existingRecord) {
			set.status = 400;
			return {
				success: false,
				message: `Anda sudah melakukan presensi untuk sesi ini pada pukul ${existingRecord.arrivalTime || "-"} WIB (${existingRecord.status}).`,
				data: existingRecord,
			};
		}

		const targetTime = session.targetTime || "06:22";
		const evalResult = evaluateMorningAssemblyArrival(timeStr, targetTime);
		const payload = (body || {}) as { notes?: string };

		const [newRecord] = await db
			.insert(morningAssemblyRecords)
			.values({
				sessionId: session.id,
				studentId: student.id,
				status: evalResult.status,
				arrivalTime: timeStr,
				minutesLate: evalResult.minutesLate,
				selfCheckinAt: new Date(),
				checkinMethod: "self",
				notes: payload.notes || "Absen mandiri via portal mahasiswa",
				recordedBy: user.id,
			})
			.returning();

		await syncAttendanceAggregate(student.id);

		const successMsg =
			evalResult.status === "hadir"
				? `Presensi Berhasil! Anda hadir tepat waktu pukul ${timeStr} WIB.`
				: `Presensi Berhasil! Anda tercatat terlambat ${evalResult.minutesLate} menit (pukul ${timeStr} WIB, batas ${targetTime} WIB).`;

		return {
			success: true,
			message: successMsg,
			data: newRecord,
		};
	})

	// 5. MAHASISWA PERSONAL RECORDS
	.get("/baris-pagi/my-records", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
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
			return { success: false, message: "Profil mahasiswa tidak ditemukan" };
		}

		const records = await db.query.morningAssemblyRecords.findMany({
			where: eq(morningAssemblyRecords.studentId, student.id),
			with: {
				session: true,
			},
			orderBy: (r, { desc }) => [desc(r.id)],
		});

		const total = records.length;
		const tepatWaktu = records.filter((r) => r.status === "hadir").length;
		const terlambat = records.filter((r) => r.status === "terlambat").length;
		const izin = records.filter((r) => r.status === "izin").length;
		const sakit = records.filter((r) => r.status === "sakit").length;
		const alpha = records.filter((r) => r.status === "alpha").length;
		const complianceRate =
			total > 0 ? Math.round((tepatWaktu / total) * 100) : 100;

		const stats = {
			totalSessions: total,
			total,
			hadir: tepatWaktu,
			tepatWaktu,
			terlambat,
			izin,
			sakit,
			alpha,
			complianceRate,
		};

		const formattedRecords = records.map((r) => ({
			id: r.id,
			sessionId: r.sessionId,
			sessionDate: r.session?.sessionDate || "-",
			targetTime: r.session?.targetTime || "06:22",
			location: r.session?.location || "-",
			arrivalTime: r.arrivalTime,
			status: r.status,
			checkinMethod: r.checkinMethod || "officer",
			minutesLate: r.minutesLate || 0,
			notes: r.notes,
			session: r.session,
			hasSelfie: Boolean(r.selfieUrl),
			selfieUrl: r.selfieUrl,
			latitude: r.latitude,
			longitude: r.longitude,
			gpsAccuracy: r.gpsAccuracy,
			locationName: r.locationName,
			distanceFromCheckpoint: r.distanceFromCheckpoint,
			isWithinRadius: r.isWithinRadius,
			verificationStatus: r.verificationStatus,
		}));

		return {
			success: true,
			data: {
				student: {
					id: student.id,
					name: student.name,
					nim: student.nim,
					cohort: student.cohort,
					rombel: student.rombel,
				},
				records: formattedRecords,
				summary: stats,
				stats,
			},
		};
	})

	// 6. SESSIONS LIST (ENRICHED WITH STATUS & TIMING)
	.get("/baris-pagi/sessions", async ({ query }) => {
		const { cohort, rombel, dateFrom, dateTo } = query;
		const conditions = [];

		if (cohort && cohort !== "all") {
			conditions.push(
				eq(morningAssemblySessions.cohort, parseInt(cohort as string, 10)),
			);
		}
		if (rombel && rombel !== "all" && rombel !== "Semua") {
			conditions.push(eq(morningAssemblySessions.rombel, rombel as string));
		}
		if (dateFrom) {
			conditions.push(
				sql`${morningAssemblySessions.sessionDate} >= ${dateFrom}`,
			);
		}
		if (dateTo) {
			conditions.push(sql`${morningAssemblySessions.sessionDate} <= ${dateTo}`);
		}

		const sessions = await db.query.morningAssemblySessions.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			orderBy: [desc(morningAssemblySessions.sessionDate)],
			with: {
				records: {
					columns: {
						id: true,
						status: true,
						arrivalTime: true,
						minutesLate: true,
						checkinMethod: true,
					},
				},
				creator: { columns: { fullName: true } },
			},
		});

		const enriched = sessions.map((s) => {
			const total = s.records.length;
			const hadir = s.records.filter((r) => r.status === "hadir").length;
			const terlambat = s.records.filter(
				(r) => r.status === "terlambat",
			).length;
			const izin = s.records.filter((r) => r.status === "izin").length;
			const sakit = s.records.filter((r) => r.status === "sakit").length;
			const alpha = s.records.filter((r) => r.status === "alpha").length;
			const selfCheckins = s.records.filter(
				(r) => r.checkinMethod === "self",
			).length;
			const complianceRate =
				total > 0 ? Math.round((hadir / total) * 100) : 100;

			return {
				id: s.id,
				cohort: s.cohort,
				rombel: s.rombel,
				sessionDate: s.sessionDate,
				targetTime: s.targetTime || "06:22",
				checkInWindowStart: s.checkInWindowStart || "05:30",
				checkInWindowEnd: s.checkInWindowEnd || "07:00",
				location: s.location,
				notes: s.notes,
				sessionStatus: s.sessionStatus || "scheduled",
				isAutoGenerated: s.isAutoGenerated || false,
				rescheduledFrom: s.rescheduledFrom || null,
				createdBy: s.creator?.fullName || "Petugas",
				createdAt: s.createdAt,
				stats: {
					total,
					hadir,
					terlambat,
					izin,
					sakit,
					alpha,
					selfCheckins,
					complianceRate,
				},
			};
		});

		return { success: true, data: enriched };
	})

	// 7. SESSION DETAIL (MEMBERS & STATS)
	.get("/baris-pagi/sessions/:id", async ({ params, set }) => {
		const id = parseInt(params.id, 10);
		const session = await db.query.morningAssemblySessions.findFirst({
			where: eq(morningAssemblySessions.id, id),
			with: {
				creator: { columns: { fullName: true } },
			},
		});

		if (!session) {
			set.status = 404;
			return { success: false, message: "Sesi baris pagi tidak ditemukan" };
		}

		const studentConds = [
			eq(students.cohort, session.cohort),
			eq(students.isArchived, false),
		];
		if (session.rombel && session.rombel !== "Semua") {
			studentConds.push(eq(students.rombel, session.rombel));
		}

		const cohortStudents = await db.query.students.findMany({
			where: and(...studentConds),
			orderBy: [asc(students.name)],
			columns: { id: true, name: true, nim: true, rombel: true, cohort: true },
		});

		const existingRecords = await db.query.morningAssemblyRecords.findMany({
			where: eq(morningAssemblyRecords.sessionId, id),
			with: {
				recorder: { columns: { fullName: true } },
			},
		});

		const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));

		const members = cohortStudents.map((st) => {
			const rec = recordMap.get(st.id);
			return {
				studentId: st.id,
				name: st.name,
				nim: st.nim || "-",
				rombel: st.rombel || "Kelas A",
				status: rec ? rec.status : null,
				arrivalTime: rec ? rec.arrivalTime || "" : "",
				minutesLate: rec ? rec.minutesLate || 0 : 0,
				checkinMethod: rec ? rec.checkinMethod || "admin" : null,
				selfCheckinAt: rec?.selfCheckinAt || null,
				notes: rec ? rec.notes || "" : "",
				recordId: rec ? rec.id : null,
				recordedBy: rec?.recorder?.fullName || null,
				recordedAt: rec?.recordedAt || null,
				selfieUrl: rec?.selfieUrl || null,
				latitude: rec?.latitude || null,
				longitude: rec?.longitude || null,
				gpsAccuracy: rec?.gpsAccuracy || null,
				locationName: rec?.locationName || null,
				distanceFromCheckpoint: rec?.distanceFromCheckpoint || null,
				isWithinRadius: rec?.isWithinRadius ?? true,
				verificationStatus: rec?.verificationStatus || null,
			};
		});

		const total = members.length;
		const hadir = members.filter((m) => m.status === "hadir").length;
		const terlambat = members.filter((m) => m.status === "terlambat").length;
		const izin = members.filter((m) => m.status === "izin").length;
		const sakit = members.filter((m) => m.status === "sakit").length;
		const alpha = members.filter((m) => m.status === "alpha").length;
		const selfCount = members.filter((m) => m.checkinMethod === "self").length;
		const unrecorded = members.filter((m) => !m.status).length;

		return {
			success: true,
			data: {
				session,
				members,
				stats: {
					total,
					hadir,
					terlambat,
					izin,
					sakit,
					alpha,
					selfCount,
					unrecorded,
					complianceRate: total > 0 ? Math.round((hadir / total) * 100) : 100,
				},
			},
		};
	})

	// 8. CREATE MANUAL SESSION
	.post("/baris-pagi/sessions", async ({ body, user, set }) => {
		const payload = body as {
			cohort: number | string;
			rombel?: string;
			sessionDate: string;
			targetTime?: string;
			checkInWindowStart?: string;
			checkInWindowEnd?: string;
			location?: string;
			notes?: string;
		};

		if (!payload.cohort || !payload.sessionDate) {
			set.status = 400;
			return {
				success: false,
				message: "Angkatan dan Tanggal Sesi wajib diisi",
			};
		}

		const cohortNum = parseInt(payload.cohort.toString(), 10);
		const targetTime = payload.targetTime?.trim() || "06:22";
		const location = payload.location?.trim() || "Lapangan Utama Kampus";

		const [newSession] = await db
			.insert(morningAssemblySessions)
			.values({
				cohort: cohortNum,
				rombel: payload.rombel || "Semua",
				sessionDate: payload.sessionDate,
				targetTime,
				checkInWindowStart: payload.checkInWindowStart || "05:30",
				checkInWindowEnd: payload.checkInWindowEnd || "07:00",
				location,
				notes: payload.notes || null,
				isAutoGenerated: false,
				sessionStatus: "scheduled",
				createdBy: await resolveValidUserId(user?.id),
			})
			.returning();

		return {
			success: true,
			message: "Sesi baris pagi mingguan berhasil dibuat",
			data: newSession,
		};
	})

	// 9. RESCHEDULE SESSION
	.patch(
		"/baris-pagi/sessions/:id/reschedule",
		async ({ params, body, set }) => {
			const id = parseInt(params.id, 10);
			const payload = body as { newDate: string; reason?: string };

			if (!payload.newDate) {
				set.status = 400;
				return {
					success: false,
					message: "Tanggal baru (newDate) wajib diisi",
				};
			}

			const session = await db.query.morningAssemblySessions.findFirst({
				where: eq(morningAssemblySessions.id, id),
			});

			if (!session) {
				set.status = 404;
				return { success: false, message: "Sesi baris pagi tidak ditemukan" };
			}

			const oldDate = session.sessionDate;
			const reasonNote = payload.reason
				? `[Jadwal diundur dari ${oldDate}: ${payload.reason}]`
				: `[Jadwal diundur dari ${oldDate}]`;

			const [updated] = await db
				.update(morningAssemblySessions)
				.set({
					sessionDate: payload.newDate,
					rescheduledFrom: oldDate,
					notes: session.notes ? `${session.notes} ${reasonNote}` : reasonNote,
					updatedAt: new Date(),
				})
				.where(eq(morningAssemblySessions.id, id))
				.returning();

			return {
				success: true,
				message: `Sesi baris pagi berhasil dijadwal ulang ke tanggal ${payload.newDate}`,
				data: updated,
			};
		},
	)

	// 10. UPDATE SESSION STATUS
	.patch("/baris-pagi/sessions/:id/status", async ({ params, body, set }) => {
		const id = parseInt(params.id, 10);
		const payload = body as { status: string };

		if (!payload.status) {
			set.status = 400;
			return { success: false, message: "Status sesi wajib diisi" };
		}

		const session = await db.query.morningAssemblySessions.findFirst({
			where: eq(morningAssemblySessions.id, id),
		});

		if (!session) {
			set.status = 404;
			return { success: false, message: "Sesi baris pagi tidak ditemukan" };
		}

		const [updated] = await db
			.update(morningAssemblySessions)
			.set({
				sessionStatus: payload.status,
				updatedAt: new Date(),
			})
			.where(eq(morningAssemblySessions.id, id))
			.returning();

		return {
			success: true,
			message: `Status sesi baris pagi berhasil diubah menjadi ${payload.status}`,
			data: updated,
		};
	})

	// 11. MARK ALL UNRECORDED STUDENTS AS ALPHA
	.post(
		"/baris-pagi/sessions/:id/auto-alpha",
		async ({ params, user, set }) => {
			const sessionId = parseInt(params.id, 10);
			const session = await db.query.morningAssemblySessions.findFirst({
				where: eq(morningAssemblySessions.id, sessionId),
			});

			if (!session) {
				set.status = 404;
				return { success: false, message: "Sesi baris pagi tidak ditemukan" };
			}

			const studentConds = [
				eq(students.cohort, session.cohort),
				eq(students.isArchived, false),
			];
			if (session.rombel && session.rombel !== "Semua") {
				studentConds.push(eq(students.rombel, session.rombel));
			}
			const allCohortStudents = await db.query.students.findMany({
				where: and(...studentConds),
				columns: { id: true },
			});

			const existingRecords = await db.query.morningAssemblyRecords.findMany({
				where: eq(morningAssemblyRecords.sessionId, sessionId),
				columns: { studentId: true },
			});
			const recordedStudentIds = new Set(
				existingRecords.map((r) => r.studentId),
			);

			const missingStudents = allCohortStudents.filter(
				(st) => !recordedStudentIds.has(st.id),
			);

			if (missingStudents.length === 0) {
				return {
					success: true,
					message:
						"Semua mahasiswa sudah memiliki catatan kehadiran untuk sesi ini.",
					markedCount: 0,
				};
			}

			for (const st of missingStudents) {
				await db.insert(morningAssemblyRecords).values({
					sessionId,
					studentId: st.id,
					status: "alpha",
					notes: "Otomatis ditandai Alpha oleh sistem (tidak check-in)",
					checkinMethod: "admin",
					recordedBy: await resolveValidUserId(user?.id),
				});
				await syncAttendanceAggregate(st.id);
			}

			return {
				success: true,
				message: `Berhasil menandai ${missingStudents.length} mahasiswa yang belum hadir sebagai Alpha`,
				markedCount: missingStudents.length,
			};
		},
	)

	// 12. GENERAL PATCH SESSION
	.patch("/baris-pagi/sessions/:id", async ({ params, body, set }) => {
		const id = parseInt(params.id, 10);
		const payload = body as any;

		const existing = await db.query.morningAssemblySessions.findFirst({
			where: eq(morningAssemblySessions.id, id),
		});

		if (!existing) {
			set.status = 404;
			return { success: false, message: "Sesi tidak ditemukan" };
		}

		const updateData: any = { updatedAt: new Date() };
		if (payload.targetTime) updateData.targetTime = payload.targetTime;
		if (payload.location) updateData.location = payload.location;
		if (payload.notes !== undefined) updateData.notes = payload.notes;
		if (payload.rombel) updateData.rombel = payload.rombel;
		if (payload.checkInWindowStart)
			updateData.checkInWindowStart = payload.checkInWindowStart;
		if (payload.checkInWindowEnd)
			updateData.checkInWindowEnd = payload.checkInWindowEnd;
		if (payload.sessionStatus) updateData.sessionStatus = payload.sessionStatus;

		const [updated] = await db
			.update(morningAssemblySessions)
			.set(updateData)
			.where(eq(morningAssemblySessions.id, id))
			.returning();

		return { success: true, data: updated };
	})

	// 13. DELETE SESSION
	.delete("/baris-pagi/sessions/:id", async ({ params, set }) => {
		const id = parseInt(params.id, 10);

		const records = await db.query.morningAssemblyRecords.findMany({
			where: eq(morningAssemblyRecords.sessionId, id),
			columns: { studentId: true },
		});
		const studentIds = Array.from(new Set(records.map((r) => r.studentId)));

		await db
			.delete(morningAssemblySessions)
			.where(eq(morningAssemblySessions.id, id));

		for (const sId of studentIds) {
			await syncAttendanceAggregate(sId);
		}

		return { success: true, message: "Sesi baris pagi berhasil dihapus" };
	})

	.post(
		"/baris-pagi/sessions/:id/records",
		async ({ params, body, user, set }) => {
			const sessionId = parseInt(params.id, 10);
			const payload = body as {
				records: Array<{
					studentId: number;
					status?: "hadir" | "terlambat" | "izin" | "sakit" | "alpha";
					arrivalTime?: string; // Format "HH:mm" misal "06:20" atau "06:35"
					notes?: string;
				}>;
			};

			const session = await db.query.morningAssemblySessions.findFirst({
				where: eq(morningAssemblySessions.id, sessionId),
			});

			if (!session) {
				set.status = 404;
				return { success: false, message: "Sesi baris pagi tidak ditemukan" };
			}

			const targetTime = session.targetTime || "06:22";

			// Upsert records
			const existingRecords = await db.query.morningAssemblyRecords.findMany({
				where: eq(morningAssemblyRecords.sessionId, sessionId),
			});
			const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));
			const studentsToSync = new Set<number>();

			for (const item of payload.records || []) {
				studentsToSync.add(item.studentId);
				const existing = recordMap.get(item.studentId);

				let finalStatus = item.status || "hadir";
				let minutesLate = 0;

				// If arrivalTime is provided, perform automatic 06.22 threshold calculation
				if (item.arrivalTime && item.arrivalTime.includes(":")) {
					const evalResult = evaluateMorningAssemblyArrival(
						item.arrivalTime,
						targetTime,
					);
					if (
						item.status === "hadir" ||
						item.status === "terlambat" ||
						!item.status
					) {
						finalStatus = evalResult.status;
						minutesLate = evalResult.minutesLate;
					}
				} else if (item.status === "terlambat") {
					minutesLate = 10; // Default late minutes if no time specified
				}

				if (existing) {
					await db
						.update(morningAssemblyRecords)
						.set({
							status: finalStatus,
							arrivalTime: item.arrivalTime || existing.arrivalTime || null,
							minutesLate,
							notes: item.notes !== undefined ? item.notes : existing.notes,
							recordedBy: user.id,
							recordedAt: new Date(),
						})
						.where(eq(morningAssemblyRecords.id, existing.id));
				} else {
					await db.insert(morningAssemblyRecords).values({
						sessionId,
						studentId: item.studentId,
						status: finalStatus,
						arrivalTime: item.arrivalTime || null,
						minutesLate,
						notes: item.notes || null,
						recordedBy: user.id,
					});
				}
			}

			// Recalculate academic data for affected students
			for (const sId of studentsToSync) {
				await syncAttendanceAggregate(sId);
			}

			return {
				success: true,
				message:
					"Presensi baris pagi mingguan berhasil disimpan & disinkronisasi",
			};
		},
	)

	.get("/baris-pagi/student-summary", async ({ query }) => {
		const { cohort, rombel, search } = query;
		const studentConds = [eq(students.isArchived, false)];

		if (cohort && cohort !== "all") {
			studentConds.push(eq(students.cohort, parseInt(cohort as string, 10)));
		}
		if (rombel && rombel !== "all") {
			studentConds.push(eq(students.rombel, rombel as string));
		}

		const [allStudents, allAcademicData] = await Promise.all([
			db.query.students.findMany({
				where: and(...studentConds),
				orderBy: [asc(students.name)],
			}),
			db.query.academicData.findMany(),
		]);

		const acadMap = new Map(allAcademicData.map((a) => [a.studentId, a]));

		const mapped = allStudents.map((s) => {
			const acad = acadMap.get(s.id);
			const total = acad?.attendanceBarisTotal || 0;
			const present = acad?.attendanceBarisPresent || 0;
			const late = acad?.attendanceBarisLate || 0;
			const complianceRate =
				total > 0 ? Math.round((present / total) * 100) : 100;

			let statusDisiplin = "DISIPLIN";
			if (total > 0) {
				if (complianceRate >= 85) statusDisiplin = "DISIPLIN";
				else if (complianceRate >= 70) statusDisiplin = "PERLU_PEMBINAAN";
				else statusDisiplin = "KRITIS";
			}

			return {
				id: s.id,
				nim: s.nim || "-",
				name: s.name,
				cohort: s.cohort,
				rombel: s.rombel || "Kelas A",
				program: s.program,
				subProgram: s.subProgram,
				totalSesi: total,
				totalTepatWaktu: present,
				totalTerlambat: late,
				complianceRate,
				statusDisiplin,
			};
		});

		const filtered = search
			? mapped.filter((s) => {
					const q = (search as string).toLowerCase();
					return (
						s.name.toLowerCase().includes(q) || s.nim.toLowerCase().includes(q)
					);
				})
			: mapped;

		return { success: true, data: filtered };
	})

	.get("/mahasiswa/:studentId/baris-pagi", async ({ params }) => {
		const studentId = parseInt(params.studentId, 10);
		const records = await db.query.morningAssemblyRecords.findMany({
			where: eq(morningAssemblyRecords.studentId, studentId),
			with: {
				session: true,
				recorder: { columns: { fullName: true } },
			},
			orderBy: (r, { desc }) => [desc(r.id)],
		});

		const total = records.length;
		const tepatWaktu = records.filter((r) => r.status === "hadir").length;
		const terlambat = records.filter((r) => r.status === "terlambat").length;
		const izin = records.filter((r) => r.status === "izin").length;
		const sakit = records.filter((r) => r.status === "sakit").length;
		const alpha = records.filter((r) => r.status === "alpha").length;
		const complianceRate =
			total > 0 ? Math.round((tepatWaktu / total) * 100) : 100;

		return {
			success: true,
			data: {
				records,
				summary: {
					total,
					tepatWaktu,
					terlambat,
					izin,
					sakit,
					alpha,
					complianceRate,
				},
			},
		};
	})

	// =========================================================================
	// MONITORING ALL-SERVICE CONSOLIDATED (PERKULIAHAN + PIKET + BARIS PAGI)
	// =========================================================================
	.get("/all-service/summary", async ({ query }) => {
		const { cohort, rombel, search } = query;
		const studentConds = [eq(students.isArchived, false)];

		if (cohort && cohort !== "all") {
			studentConds.push(eq(students.cohort, parseInt(cohort as string, 10)));
		}
		if (rombel && rombel !== "all") {
			studentConds.push(eq(students.rombel, rombel as string));
		}

		const [allStudents, allGrades, allAcademicData] = await Promise.all([
			db.query.students.findMany({
				where: and(...studentConds),
				orderBy: [asc(students.name)],
			}),
			db.query.courseGrades.findMany(),
			db.query.academicData.findMany(),
		]);

		const acadMap = new Map(allAcademicData.map((a) => [a.studentId, a]));

		// Group grades by student
		const gradesMap = new Map<number, typeof allGrades>();
		for (const g of allGrades) {
			const list = gradesMap.get(g.studentId) || [];
			list.push(g);
			gradesMap.set(g.studentId, list);
		}

		const consolidated = allStudents.map((s) => {
			const sGrades = gradesMap.get(s.id) || [];
			let kuliahTotal = 0;
			let kuliahHadir = 0;
			sGrades.forEach((g) => {
				kuliahTotal += g.totalMeetings || 16;
				kuliahHadir += g.attendancePresent || 0;
			});
			const kuliahRate =
				kuliahTotal > 0 ? Math.round((kuliahHadir / kuliahTotal) * 100) : 0;

			const acad = acadMap.get(s.id);

			// Piket metrics
			const piketTotal = acad?.attendancePiketTotal || 0;
			const piketHadir = acad?.attendancePiketPresent || 0;
			const piketRate =
				piketTotal > 0 ? Math.round((piketHadir / piketTotal) * 100) : 0;

			// Baris Pagi metrics (Threshold 06.22)
			const barisTotal = acad?.attendanceBarisTotal || 0;
			const barisTepatWaktu = acad?.attendanceBarisPresent || 0;
			const barisTerlambat = acad?.attendanceBarisLate || 0;
			const barisRate =
				barisTotal > 0 ? Math.round((barisTepatWaktu / barisTotal) * 100) : 0;

			// Weighted All-Service Index: 50% Kuliah + 25% Piket + 25% Baris Pagi
			// Dihitung dinamis proporsional berdasarkan pilar yang sudah memiliki sesi terjadwal
			let totalWeight = 0;
			let weightedSum = 0;

			if (kuliahTotal > 0) {
				totalWeight += 50;
				weightedSum += kuliahRate * 50;
			}
			if (piketTotal > 0) {
				totalWeight += 25;
				weightedSum += piketRate * 25;
			}
			if (barisTotal > 0) {
				totalWeight += 25;
				weightedSum += barisRate * 25;
			}

			const allServiceScore =
				totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

			let allServiceStatus: "DISIPLIN" | "PERLU_PEMBINAAN" | "KRITIS" =
				"DISIPLIN";
			if (allServiceScore >= 85) allServiceStatus = "DISIPLIN";
			else if (allServiceScore >= 70) allServiceStatus = "PERLU_PEMBINAAN";
			else allServiceStatus = "KRITIS";

			return {
				id: s.id,
				nim: s.nim || "-",
				name: s.name,
				cohort: s.cohort,
				rombel: s.rombel || "Kelas A",
				program: s.program,
				subProgram: s.subProgram,
				kuliah: {
					totalMeetings: kuliahTotal,
					presentCount: kuliahHadir,
					rate: kuliahRate,
				},
				piket: {
					totalSessions: piketTotal,
					presentCount: piketHadir,
					rate: piketRate,
				},
				barisPagi: {
					totalSessions: barisTotal,
					tepatWaktuCount: barisTepatWaktu,
					terlambatCount: barisTerlambat,
					rate: barisRate,
				},
				allServiceScore,
				allServiceStatus,
			};
		});

		const filtered = search
			? consolidated.filter((s) => {
					const q = (search as string).toLowerCase();
					return (
						s.name.toLowerCase().includes(q) || s.nim.toLowerCase().includes(q)
					);
				})
			: consolidated;

		return { success: true, data: filtered };
	});

// Helper function to evaluate morning assembly arrival against 06.22 threshold
export function evaluateMorningAssemblyArrival(
	arrivalTimeStr: string,
	targetTimeStr: string = "06:22",
) {
	if (!arrivalTimeStr || !arrivalTimeStr.includes(":")) {
		return { status: "hadir" as const, minutesLate: 0, isLate: false };
	}
	const [arrH, arrM] = arrivalTimeStr
		.split(":")
		.map((v) => parseInt(v, 10) || 0);
	const [tarH, tarM] = targetTimeStr
		.split(":")
		.map((v) => parseInt(v, 10) || 0);
	const arrMinutes = arrH * 60 + arrM;
	const tarMinutes = tarH * 60 + tarM;

	if (arrMinutes <= tarMinutes) {
		return { status: "hadir" as const, minutesLate: 0, isLate: false };
	} else {
		return {
			status: "terlambat" as const,
			minutesLate: arrMinutes - tarMinutes,
			isLate: true,
		};
	}
}

// Helper to get current WIB date (YYYY-MM-DD) and time (HH:mm)
export function getWIBDateTime(date: Date = new Date()) {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Jakarta",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
	const parts = formatter.formatToParts(date);
	const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
	const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
	const timeStr = `${get("hour")}:${get("minute")}`;
	return { dateStr, timeStr };
}

// Helper to check if timeStr is within windowStart and windowEnd (HH:mm)
export function isWithinWindow(
	timeStr: string,
	windowStart: string = "05:30",
	windowEnd: string = "07:00",
): boolean {
	if (!timeStr || !timeStr.includes(":")) return false;
	const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
	const [sh, sm] = windowStart.split(":").map((v) => parseInt(v, 10) || 0);
	const [eh, em] = windowEnd.split(":").map((v) => parseInt(v, 10) || 0);
	const nowMin = h * 60 + m;
	const startMin = sh * 60 + sm;
	const endMin = eh * 60 + em;
	return nowMin >= startMin && nowMin <= endMin;
}

// Helper to resolve valid user id or return null if user doesn't exist
export async function resolveValidUserId(
	userId: number | null | undefined,
): Promise<number | null> {
	if (!userId) return null;
	try {
		const u = await db.query.users.findFirst({
			where: eq(users.id, userId),
			columns: { id: true },
		});
		return u ? u.id : null;
	} catch {
		return null;
	}
}

// Helper function to sync attendance aggregate for a student
export async function syncAttendanceAggregate(studentId: number) {
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

	// Query Baris Pagi (Threshold 06.22)
	const barisRecords = await db.query.morningAssemblyRecords.findMany({
		where: eq(morningAssemblyRecords.studentId, studentId),
	});
	const barisTotal = barisRecords.length;
	const barisTepatWaktu = barisRecords.filter(
		(r) => r.status === "hadir" || r.status === "izin",
	).length;
	const barisTerlambat = barisRecords.filter(
		(r) => r.status === "terlambat",
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
				attendanceBarisTotal: barisTotal,
				attendanceBarisPresent: barisTepatWaktu,
				attendanceBarisLate: barisTerlambat,
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
			attendanceBarisTotal: barisTotal,
			attendanceBarisPresent: barisTepatWaktu,
			attendanceBarisLate: barisTerlambat,
		});
	}
}
