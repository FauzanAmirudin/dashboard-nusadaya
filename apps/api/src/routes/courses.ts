import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	courseGrades,
	courseMeetingActivities,
	courseMeetingAttendances,
	courseMeetings,
	courses,
	practicesBudgetRequests,
	practicesMaterialReports,
	students,
	users,
} from "../db/schema";
import { getValidUserId, hasRole } from "../lib/permissions";

export const coursesRoutes = new Elysia({ prefix: "/courses" })
	.derive((context) => {
		const user = (context as any).user;
		return { user };
	})

	// ==========================================
	// 1. MATA KULIAH (COURSES) CRUD
	// ==========================================
	.get("/", async ({ query, user, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const { cohort, type, peminatan } = query || {};

		const conditions = [];

		// If Dosen (and not akademik/superadmin), only their own courses
		if (hasRole(user, "dosen") && !hasRole(user, "akademik")) {
			conditions.push(eq(courses.dosenId, Number(user.id)));
		}

		if (cohort)
			conditions.push(eq(courses.cohort, parseInt(cohort as string, 10)));
		if (type && type !== "all")
			conditions.push(eq(courses.type, type as "teori" | "praktik"));
		if (peminatan && peminatan !== "all")
			conditions.push(eq(courses.peminatan, peminatan as string));

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
			if (!hasRole(user, "akademik")) {
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

			// Auto-generate meetings: PKKMB (-1), Beginning Class (0), and Pertemuan 1..16 (8=UTS, 16=UAS)
			const meetingsToInsert: {
				courseId: number;
				meetingNumber: number;
				meetingType: "pkkmb" | "beginning" | "regular" | "uts" | "uas";
				meetingLabel: string;
				description?: string;
			}[] = [
				{
					courseId: newCourse.id,
					meetingNumber: -1,
					meetingType: "pkkmb",
					meetingLabel: "PKKMB - Pengenalan Program",
					description: "Pengenalan Program Perkuliahan & Kebijakan Kampus",
				},
				{
					courseId: newCourse.id,
					meetingNumber: 0,
					meetingType: "beginning",
					meetingLabel: "Beginning Class & Kontrak Kuliah",
					description: "Orientasi Perkuliahan, Silabus, dan Kontrak Belajar",
				},
			];

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
					meetingNumber: i,
					meetingType: mType,
					meetingLabel: mLabel,
					description: "",
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

		if (
			hasRole(user, "dosen") &&
			!hasRole(user, "akademik") &&
			course.dosenId !== user.id
		) {
			set.status = 403;
			return { success: false, message: "Anda bukan pengampu mata kuliah ini" };
		}

		return { success: true, data: course };
	})
	.patch(
		"/:id",
		async ({ params, body, user, set }) => {
			if (!hasRole(user, "akademik")) {
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
		if (!hasRole(user, "akademik")) {
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
		if (
			hasRole(user, "dosen") &&
			!hasRole(user, "akademik") &&
			course.dosenId !== user.id
		) {
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
			if (
				hasRole(user, "dosen") &&
				!hasRole(user, "akademik") &&
				meeting.course.dosenId !== user.id
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const updatePayload: Record<string, any> = {
				meetingLabel: input.meetingLabel,
				description: input.description,
				meetingDate: input.meetingDate || null,
				updatedAt: new Date(),
			};

			if (input.sessionType !== undefined) {
				updatePayload.sessionType = input.sessionType;
			}

			const [updated] = await db
				.update(courseMeetings)
				.set(updatePayload)
				.where(eq(courseMeetings.id, meetingId))
				.returning();

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				meetingLabel: t.String(),
				sessionType: t.Optional(t.Union([t.String(), t.Null()])),
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
	// 4. ATTENDANCES BULK UPSERT & AUTO-SYNC AGGREGATES
	// ==========================================
	.post(
		"/:id/meetings/:meetingId/attendances",
		async ({ params, body, user, set }) => {
			const courseId = parseInt(params.id, 10);
			const meetingId = parseInt(params.meetingId, 10);
			const input = body as any;

			const course = await db.query.courses.findFirst({
				where: eq(courses.id, courseId),
			});
			if (!course) {
				set.status = 404;
				return { success: false, message: "Course not found" };
			}

			// Delete existing attendances for this meeting
			await db
				.delete(courseMeetingAttendances)
				.where(eq(courseMeetingAttendances.meetingId, meetingId));

			if (input.attendances && input.attendances.length > 0) {
				const toInsert = input.attendances.map((a: any) => ({
					meetingId: meetingId,
					studentId: a.studentId,
					status: a.status || null,
					theoryScore:
						a.theoryScore !== undefined &&
						a.theoryScore !== null &&
						a.theoryScore !== ""
							? Math.max(0, Math.min(100, parseInt(a.theoryScore, 10) || 0))
							: null,
					practicalScore:
						a.practicalScore !== undefined &&
						a.practicalScore !== null &&
						a.practicalScore !== ""
							? Math.max(0, Math.min(100, parseInt(a.practicalScore, 10) || 0))
							: null,
					notes: a.notes || null,
				}));

				await db.insert(courseMeetingAttendances).values(toInsert);

				// Auto-synchronize aggregate scores and attendance rate for each affected student
				const studentIds = Array.from(
					new Set(input.attendances.map((a: any) => a.studentId)),
				) as number[];

				// Get all meetings for this course
				const allCourseMeetings = await db.query.courseMeetings.findMany({
					where: eq(courseMeetings.courseId, courseId),
					columns: { id: true },
				});
				const allMeetingIds = allCourseMeetings.map((m) => m.id);

				if (allMeetingIds.length > 0) {
					for (const studentId of studentIds) {
						// Fetch all attendances for this student across this course's meetings
						const studentAttendances =
							await db.query.courseMeetingAttendances.findMany({
								where: and(
									eq(courseMeetingAttendances.studentId, studentId),
									inArray(courseMeetingAttendances.meetingId, allMeetingIds),
								),
							});

						const presentCount = studentAttendances.filter(
							(a) => a.status === "hadir",
						).length;
						const totalMeetings = allMeetingIds.length || 18;
						const attendanceRate = Math.min(
							100,
							Math.round((presentCount / totalMeetings) * 100),
						);

						// Average theory score
						const validTheoryScores = studentAttendances
							.filter(
								(a) => a.theoryScore !== null && a.theoryScore !== undefined,
							)
							.map((a) => a.theoryScore as number);
						const avgTheory =
							validTheoryScores.length > 0
								? Math.round(
										validTheoryScores.reduce((acc, curr) => acc + curr, 0) /
											validTheoryScores.length,
									)
								: 0;

						// Average practical score
						const validPracticalScores = studentAttendances
							.filter(
								(a) =>
									a.practicalScore !== null && a.practicalScore !== undefined,
							)
							.map((a) => a.practicalScore as number);
						const avgPractical =
							validPracticalScores.length > 0
								? Math.round(
										validPracticalScores.reduce((acc, curr) => acc + curr, 0) /
											validPracticalScores.length,
									)
								: 0;

						// Calculate final score
						const isPracticalCourse = course.type === "praktik";
						const finalScore = isPracticalCourse
							? avgPractical * 0.8 + avgTheory * 0.2
							: avgTheory;

						let displayGrade = "E";
						if (finalScore >= 85) displayGrade = "A";
						else if (finalScore >= 75) displayGrade = "B";
						else if (finalScore >= 65) displayGrade = "C";
						else if (finalScore >= 50) displayGrade = "D";

						// Overall status based on attendance
						const status =
							attendanceRate >= 90
								? "AMAN"
								: attendanceRate >= 75
									? "PERLU_PERHATIAN"
									: "TIDAK_AMAN";

						// Upsert into courseGrades table
						const existingGrade = await db.query.courseGrades.findFirst({
							where: and(
								eq(courseGrades.studentId, studentId),
								eq(courseGrades.courseId, courseId),
							),
						});

						if (existingGrade) {
							await db
								.update(courseGrades)
								.set({
									courseCode: course.code,
									courseName: course.name,
									dosenId: course.dosenId,
									attendancePresent: presentCount,
									totalMeetings: totalMeetings,
									attendanceRate: attendanceRate,
									theoryScore: avgTheory,
									practicalScore: avgPractical,
									grade: displayGrade,
									status: status,
									updatedAt: new Date(),
								})
								.where(eq(courseGrades.id, existingGrade.id));
						} else {
							await db.insert(courseGrades).values({
								studentId: studentId,
								courseId: courseId,
								courseCode: course.code,
								courseName: course.name,
								dosenId: course.dosenId,
								attendancePresent: presentCount,
								totalMeetings: totalMeetings,
								attendanceRate: attendanceRate,
								theoryScore: avgTheory,
								practicalScore: avgPractical,
								grade: displayGrade,
								status: status,
							});
						}
					}
				}
			}

			return {
				success: true,
				message: "Presensi dan nilai harian berhasil disimpan",
			};
		},
		{
			body: t.Object({
				attendances: t.Array(
					t.Object({
						studentId: t.Number(),
						status: t.Optional(t.Union([t.String(), t.Null()])),
						theoryScore: t.Optional(t.Union([t.Number(), t.Null()])),
						practicalScore: t.Optional(t.Union([t.Number(), t.Null()])),
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
				course: true,
				dosen: {
					columns: { id: true, fullName: true },
				},
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

			const targetCourseId = input.courseId
				? parseInt(input.courseId, 10)
				: courseId;

			const course = await db.query.courses.findFirst({
				where: eq(courses.id, targetCourseId),
			});

			if (!course) {
				set.status = 404;
				return { success: false, message: "Course not found" };
			}

			if (
				hasRole(user, "dosen") &&
				!hasRole(user, "akademik") &&
				course.dosenId !== user.id
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const validDosenId =
				(await getValidUserId(user)) || course.dosenId || user?.id;

			const [newRequest] = await db
				.insert(practicesBudgetRequests)
				.values({
					courseId: targetCourseId,
					dosenId: validDosenId,
					daftarKebutuhan: input.daftarKebutuhan,
					totalNominal: input.totalNominal,
				})
				.returning();

			return { success: true, data: newRequest };
		},
		{
			body: t.Object({
				courseId: t.Optional(t.Number()),
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

			const validDosenId =
				(await getValidUserId(user)) || request.dosenId || user?.id;

			const [newReport] = await db
				.insert(practicesMaterialReports)
				.values({
					budgetRequestId: reqId,
					dosenId: validDosenId,
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

			if (!hasRole(user, "dosen", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const updateData: any = {
				daftarKebutuhan: input.daftarKebutuhan,
				totalNominal: input.totalNominal,
				status: "menunggu",
				updatedAt: new Date(),
			};

			if (input.courseId) {
				updateData.courseId = parseInt(input.courseId, 10);
			}

			await db
				.update(practicesBudgetRequests)
				.set(updateData)
				.where(eq(practicesBudgetRequests.id, reqId));

			return { success: true };
		},
		{
			body: t.Object({
				courseId: t.Optional(t.Number()),
				daftarKebutuhan: t.Array(t.Any()),
				totalNominal: t.Number(),
			}),
		},
	)
	.delete("/:id/budget-requests/:reqId", async ({ params, user, set }) => {
		const reqId = parseInt(params.reqId, 10);

		if (!hasRole(user, "dosen", "akademik")) {
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
