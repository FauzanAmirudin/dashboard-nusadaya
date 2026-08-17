import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	courseMeetingActivities,
	courseMeetingAttendances,
	courseMeetings,
	courses,
	practicesBudgetRequests,
	practicesMaterialReports,
	students,
	users,
} from "../db/schema";

export const coursesRoutes = new Elysia({ prefix: "/courses" })
	.derive((context) => {
		const user = (context as any).user;
		if (!user) {
			throw new Error("Unauthorized");
		}
		return { user };
	})

	// ==========================================
	// 1. MATA KULIAH (COURSES) CRUD
	// ==========================================
	.get("/", async ({ query, user, set }) => {
		const { cohort, type, peminatan } = query;

		const conditions = [];

		// If Dosen, only their own courses
		if (user.role === "dosen") {
			conditions.push(eq(courses.dosenId, user.id));
		}

		if (cohort)
			conditions.push(eq(courses.cohort, parseInt(cohort as string, 10)));
		if (type) conditions.push(eq(courses.type, type as "teori" | "praktik"));
		if (peminatan) conditions.push(eq(courses.peminatan, peminatan as string));

		const data = await db.query.courses.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				dosen: {
					columns: { id: true, fullName: true },
				},
				meetings: {
					columns: { id: true },
				},
			},
			orderBy: [desc(courses.createdAt)],
		});

		return { success: true, data };
	})
	.post(
		"/",
		async ({ body, user, set }) => {
			if (!["superadmin", "akademik"].includes(user.role)) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const input = body as any;

			// Validation
			const existingCourse = await db.query.courses.findFirst({
				where: eq(courses.code, input.code),
			});
			if (existingCourse) {
				set.status = 400;
				return { success: false, message: "Kode mata kuliah sudah ada" };
			}

			const [newCourse] = await db
				.insert(courses)
				.values({
					code: input.code,
					name: input.name,
					dosenId: input.dosenId,
					peminatan: input.peminatan || null,
					cohort: input.cohort,
					type: input.type,
					createdBy: user.id,
				})
				.returning();

			// Auto-generate 20 meetings
			const meetingsToInsert = [];

			// 0: PKKMB
			meetingsToInsert.push({
				courseId: newCourse.id,
				meetingNumber: 0,
				meetingType: "pkkmb" as const,
				meetingLabel: "PKKMB",
			});

			// 1: Beginning Class
			meetingsToInsert.push({
				courseId: newCourse.id,
				meetingNumber: 1,
				meetingType: "beginning" as const,
				meetingLabel: "Beginning Class",
			});

			// 2-17: Regular (8=UTS, 16=UAS is based on meetingNumber offset, so 1+8=9 is UTS, 1+16=17 is UAS)
			// Wait, let's map it cleanly:
			// Regular meetings 1 to 16.
			for (let i = 1; i <= 16; i++) {
				let mType: "regular" | "uts" | "uas" = "regular";
				let mLabel = `Pertemuan ${i}`;

				if (i === 8) {
					mType = "uts";
					mLabel = "Ujian Tengah Semester (UTS)";
				} else if (i === 16) {
					mType = "uas";
					mLabel = "Ujian Akhir Semester (UAS)";
				}

				meetingsToInsert.push({
					courseId: newCourse.id,
					meetingNumber: i + 1, // Store as 2 to 17 for internal order
					meetingType: mType,
					meetingLabel: mLabel,
				});
			}

			await db.insert(courseMeetings).values(meetingsToInsert);

			return { success: true, data: newCourse };
		},
		{
			body: t.Object({
				code: t.String(),
				name: t.String(),
				dosenId: t.Number(),
				peminatan: t.Optional(t.String()),
				cohort: t.Number(),
				type: t.Enum({ teori: "teori", praktik: "praktik" }),
			}),
		},
	)
	.get("/:id", async ({ params, user, set }) => {
		const id = parseInt(params.id, 10);
		const course = await db.query.courses.findFirst({
			where: eq(courses.id, id),
			with: {
				dosen: {
					columns: { id: true, fullName: true },
				},
			},
		});

		if (!course) {
			set.status = 404;
			return { success: false, message: "Mata kuliah tidak ditemukan" };
		}

		if (user.role === "dosen" && course.dosenId !== user.id) {
			set.status = 403;
			return { success: false, message: "Anda bukan pengampu mata kuliah ini" };
		}

		return { success: true, data: course };
	})
	.patch(
		"/:id",
		async ({ params, body, user, set }) => {
			if (!["superadmin", "akademik"].includes(user.role)) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = parseInt(params.id, 10);
			const input = body as any;

			const [updated] = await db
				.update(courses)
				.set({
					code: input.code,
					name: input.name,
					dosenId: input.dosenId,
					peminatan: input.peminatan || null,
					cohort: input.cohort,
					type: input.type,
					updatedAt: new Date(),
				})
				.where(eq(courses.id, id))
				.returning();

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				code: t.String(),
				name: t.String(),
				dosenId: t.Number(),
				peminatan: t.Optional(t.String()),
				cohort: t.Number(),
				type: t.Enum({ teori: "teori", praktik: "praktik" }),
			}),
		},
	)
	.delete("/:id", async ({ params, user, set }) => {
		if (!["superadmin", "akademik"].includes(user.role)) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = parseInt(params.id, 10);

		// Drizzle cannot cascade delete by default easily unless setup,
		// so we delete child items first manually.
		const meetings = await db.query.courseMeetings.findMany({
			where: eq(courseMeetings.courseId, id),
		});

		if (meetings.length > 0) {
			const meetingIds = meetings.map((m) => m.id);
			await db
				.delete(courseMeetingActivities)
				.where(inArray(courseMeetingActivities.meetingId, meetingIds));
			await db
				.delete(courseMeetingAttendances)
				.where(inArray(courseMeetingAttendances.meetingId, meetingIds));
			await db.delete(courseMeetings).where(eq(courseMeetings.courseId, id));
		}

		await db.delete(courses).where(eq(courses.id, id));

		return {
			success: true,
			message: "Mata kuliah beserta jadwal mengajar berhasil dihapus",
		};
	})

	// ==========================================
	// 2. MEETINGS CRUD
	// ==========================================
	.get("/:id/meetings", async ({ params, user, set }) => {
		const courseId = parseInt(params.id, 10);

		// Verify course
		const course = await db.query.courses.findFirst({
			where: eq(courses.id, courseId),
		});
		if (!course) {
			set.status = 404;
			return { success: false, message: "Not found" };
		}
		if (user.role === "dosen" && course.dosenId !== user.id) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const data = await db.query.courseMeetings.findMany({
			where: eq(courseMeetings.courseId, courseId),
			with: {
				activities: true,
				attendances: {
					with: {
						student: {
							columns: { id: true, name: true, nim: true },
						},
					},
				},
			},
			orderBy: [asc(courseMeetings.meetingNumber)],
		});

		return { success: true, data };
	})
	.patch(
		"/:id/meetings/:meetingId",
		async ({ params, body, user, set }) => {
			const meetingId = parseInt(params.meetingId, 10);
			const input = body as any;

			// Verify ownership indirectly
			const meeting = await db.query.courseMeetings.findFirst({
				where: eq(courseMeetings.id, meetingId),
				with: { course: true },
			});
			if (!meeting) {
				set.status = 404;
				return { success: false, message: "Not found" };
			}
			if (user.role === "dosen" && meeting.course.dosenId !== user.id) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const [updated] = await db
				.update(courseMeetings)
				.set({
					meetingLabel: input.meetingLabel,
					description: input.description,
					meetingDate: input.meetingDate || null,
					updatedAt: new Date(),
				})
				.where(eq(courseMeetings.id, meetingId))
				.returning();

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				meetingLabel: t.String(),
				description: t.Optional(t.Union([t.String(), t.Null()])),
				meetingDate: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)

	// ==========================================
	// 3. ACTIVITIES CRUD
	// ==========================================
	.post(
		"/:id/meetings/:meetingId/activities",
		async ({ params, body, user, set }) => {
			const meetingId = parseInt(params.meetingId, 10);
			const input = body as any;

			const [newActivity] = await db
				.insert(courseMeetingActivities)
				.values({
					meetingId: meetingId,
					activityType: input.activityType,
					score: input.score || null,
					notes: input.notes || null,
					documentUrl: input.documentUrl || null,
					documentName: input.documentName || null,
				})
				.returning();

			return { success: true, data: newActivity };
		},
		{
			body: t.Object({
				activityType: t.Enum({
					teori: "teori",
					tugas: "tugas",
					praktik: "praktik",
					ujian: "ujian",
				}),
				score: t.Optional(t.Number()),
				notes: t.Optional(t.String()),
				documentUrl: t.Optional(t.Union([t.String(), t.Null()])),
				documentName: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.patch(
		"/:id/meetings/:meetingId/activities/:activityId",
		async ({ params, body, user, set }) => {
			const activityId = parseInt(params.activityId, 10);
			const input = body as any;

			const [updated] = await db
				.update(courseMeetingActivities)
				.set({
					activityType: input.activityType,
					score: input.score !== undefined ? input.score : undefined,
					notes: input.notes !== undefined ? input.notes : undefined,
					documentUrl:
						input.documentUrl !== undefined ? input.documentUrl : undefined,
					documentName:
						input.documentName !== undefined ? input.documentName : undefined,
					updatedAt: new Date(),
				})
				.where(eq(courseMeetingActivities.id, activityId))
				.returning();

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				activityType: t.Enum({
					teori: "teori",
					tugas: "tugas",
					praktik: "praktik",
					ujian: "ujian",
				}),
				score: t.Optional(t.Number()),
				notes: t.Optional(t.String()),
				documentUrl: t.Optional(t.Union([t.String(), t.Null()])),
				documentName: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.delete(
		"/:id/meetings/:meetingId/activities/:activityId",
		async ({ params }) => {
			const activityId = parseInt(params.activityId, 10);
			await db
				.delete(courseMeetingActivities)
				.where(eq(courseMeetingActivities.id, activityId));
			return { success: true, message: "Deleted" };
		},
	)

	// ==========================================
	// 4. ATTENDANCES BULK UPSERT
	// ==========================================
	.post(
		"/:id/meetings/:meetingId/attendances",
		async ({ params, body, user, set }) => {
			const meetingId = parseInt(params.meetingId, 10);
			const input = body as any; // { attendances: [{ studentId: 1, status: "hadir", notes: "" }] }

			// Delete existing
			await db
				.delete(courseMeetingAttendances)
				.where(eq(courseMeetingAttendances.meetingId, meetingId));

			if (input.attendances && input.attendances.length > 0) {
				const toInsert = input.attendances.map((a: any) => ({
					meetingId: meetingId,
					studentId: a.studentId,
					status: a.status,
					notes: a.notes || null,
				}));

				await db.insert(courseMeetingAttendances).values(toInsert);
			}

			return { success: true, message: "Presensi berhasil disimpan" };
		},
		{
			body: t.Object({
				attendances: t.Array(
					t.Object({
						studentId: t.Number(),
						status: t.String(),
						notes: t.Optional(t.Union([t.String(), t.Null()])),
					}),
				),
			}),
		},
	)

	// ==========================================
	// 5. BUDGET REQUESTS (ANGGARAN PRAKTIK)
	// ==========================================
	.get("/:id/budget-requests", async ({ params, user, set }) => {
		const courseId = parseInt(params.id, 10);

		const data = await db.query.practicesBudgetRequests.findMany({
			where: eq(practicesBudgetRequests.courseId, courseId),
			with: {
				materialReports: true,
			},
			orderBy: [desc(practicesBudgetRequests.createdAt)],
		});

		return { success: true, data };
	})
	.post(
		"/:id/budget-requests",
		async ({ params, body, user, set }) => {
			const courseId = parseInt(params.id, 10);
			const input = body as any;

			const course = await db.query.courses.findFirst({
				where: eq(courses.id, courseId),
			});

			if (!course) {
				set.status = 404;
				return { success: false, message: "Course not found" };
			}

			if (user.role === "dosen" && course.dosenId !== user.id) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const [newRequest] = await db
				.insert(practicesBudgetRequests)
				.values({
					courseId,
					dosenId: user.id,
					daftarKebutuhan: input.daftarKebutuhan,
					totalNominal: input.totalNominal,
				})
				.returning();

			return { success: true, data: newRequest };
		},
		{
			body: t.Object({
				daftarKebutuhan: t.Array(
					t.Object({
						namaItem: t.String(),
						jumlah: t.Number(),
						satuan: t.String(),
						satuanHarga: t.Number(),
					}),
				),
				totalNominal: t.Number(),
			}),
		},
	)
	.post(
		"/:id/budget-requests/:reqId/report",
		async ({ params, body, user, set }) => {
			const reqId = parseInt(params.reqId, 10);
			const input = body as any;

			// Verify request exists
			const request = await db.query.practicesBudgetRequests.findFirst({
				where: eq(practicesBudgetRequests.id, reqId),
			});

			if (!request) {
				set.status = 404;
				return { success: false, message: "Request not found" };
			}

			const [newReport] = await db
				.insert(practicesMaterialReports)
				.values({
					budgetRequestId: reqId,
					dosenId: user.id,
					daftarSisaBahan: input.daftarSisaBahan,
					catatanDosen: input.catatanDosen,
					fileUrl: input.fileUrl,
					fileName: input.fileName,
				})
				.returning();

			return { success: true, data: newReport };
		},
	)
	.put(
		"/:id/budget-requests/:reqId",
		async ({ params, body, user, set }) => {
			const reqId = parseInt(params.reqId, 10);
			const input = body as any;

			if (
				user.role !== "dosen" &&
				user.role !== "akademik" &&
				user.role !== "superadmin"
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db
				.update(practicesBudgetRequests)
				.set({
					daftarKebutuhan: input.daftarKebutuhan,
					totalNominal: input.totalNominal,
					status: "menunggu",
					updatedAt: new Date(),
				})
				.where(eq(practicesBudgetRequests.id, reqId));

			return { success: true };
		},
		{
			body: t.Object({
				daftarKebutuhan: t.Array(t.Any()),
				totalNominal: t.Number(),
			}),
		},
	)
	.delete("/:id/budget-requests/:reqId", async ({ params, user, set }) => {
		const reqId = parseInt(params.reqId, 10);

		if (
			user.role !== "dosen" &&
			user.role !== "akademik" &&
			user.role !== "superadmin"
		) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db
			.delete(practicesMaterialReports)
			.where(eq(practicesMaterialReports.budgetRequestId, reqId));
		await db
			.delete(practicesBudgetRequests)
			.where(eq(practicesBudgetRequests.id, reqId));

		return { success: true };
	});
