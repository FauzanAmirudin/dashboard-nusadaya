import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
	.post("/mahasiswa/:studentId/ods", async ({ params, body, user }) => {
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
	.patch("/mahasiswa/:studentId/ods/:recordId", async ({ params, body }) => {
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
	})
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
	.post("/mahasiswa/:studentId/pramagang", async ({ params, body, user }) => {
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
	})
	.patch(
		"/mahasiswa/:studentId/pramagang/:recordId",
		async ({ params, body }) => {
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
