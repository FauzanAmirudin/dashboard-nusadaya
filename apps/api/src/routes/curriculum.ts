import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	academicAuditLogs,
	academicCalendars,
	academicTerms,
	classSchedules,
	courseEnrollments,
	courseGrades,
	courses,
	curricula,
	curriculumPackages,
	masterCourses,
	semesterRolloverLogs,
	studentSemesterRegistrations,
	students,
	users,
} from "../db/schema";
import { cacheDel, cacheInvalidatePattern } from "../lib/cache";
import { hasRole } from "../lib/permissions";
import {
	checkStudentScheduleConflict,
	enrollCohortRombelToPackage,
	executeSemesterRollover,
	getAcademicTermById,
	getActiveAcademicTerm,
	getStudentCoursesForTerm,
	openClassesFromPackage,
	previewSemesterRollover,
} from "../modules/academic/curriculum.service";

export const curriculumRouter = new Elysia()
	// ─────────────────────────────────────────────────────────────────────────
	// 1. PERIODE AKADEMIK (Academic Terms)
	// ─────────────────────────────────────────────────────────────────────────
	.get("/academic-terms", async () => {
		const terms = await db.query.academicTerms.findMany({
			orderBy: [desc(academicTerms.startDate)],
			with: {
				calendar: true,
			},
		});
		return { success: true, data: terms };
	})
	.get("/academic-terms/active", async () => {
		const activeTerm = await getActiveAcademicTerm();
		return { success: true, data: activeTerm };
	})
	.get("/academic-terms/:id", async ({ params, set }) => {
		const id = parseInt(params.id, 10);
		const term = await getAcademicTermById(id);
		if (!term) {
			set.status = 404;
			return { success: false, message: "Periode akademik tidak ditemukan" };
		}
		return { success: true, data: term };
	})
	.post(
		"/academic-terms",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			try {
				const existing = await db.query.academicTerms.findFirst({
					where: and(
						eq(academicTerms.academicYear, body.academicYear),
						eq(academicTerms.semesterType, body.semesterType),
					),
				});
				if (existing) {
					set.status = 400;
					return {
						success: false,
						message: `Periode untuk ${body.academicYear} semester ${body.semesterType} sudah ada.`,
					};
				}

				const [created] = await db
					.insert(academicTerms)
					.values({
						academicYear: body.academicYear,
						semesterType: body.semesterType,
						name:
							body.name ||
							`${body.academicYear} ${body.semesterType === "ganjil" ? "Ganjil" : "Genap"}`,
						startDate: body.startDate,
						endDate: body.endDate,
						krsStartDate: body.krsStartDate || null,
						krsEndDate: body.krsEndDate || null,
						gradeLockDate: body.gradeLockDate || null,
						status: body.status || "draft",
						isActive: body.isActive || false,
						calendarId: body.calendarId || null,
						createdBy: user.id,
					})
					.returning();

				if (body.isActive) {
					// Pastikan hanya 1 yang aktif
					await db
						.update(academicTerms)
						.set({ isActive: false })
						.where(sql`${academicTerms.id} != ${created.id}`);
					await cacheDel("cache:academic-term:active");
				}

				return { success: true, data: created };
			} catch (err: any) {
				set.status = 500;
				return { success: false, message: err.message };
			}
		},
		{
			body: t.Object({
				academicYear: t.String(),
				semesterType: t.String(),
				name: t.Optional(t.String()),
				startDate: t.String(),
				endDate: t.String(),
				krsStartDate: t.Optional(t.String()),
				krsEndDate: t.Optional(t.String()),
				gradeLockDate: t.Optional(t.String()),
				status: t.Optional(t.String()),
				isActive: t.Optional(t.Boolean()),
				calendarId: t.Optional(t.Number()),
			}),
		},
	)
	.patch("/academic-terms/:id/activate", async ({ params, set, user }: any) => {
		if (!hasRole(user, "superadmin", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);
		// Nonaktifkan semua term lain secara atomik
		await db.update(academicTerms).set({ isActive: false });
		// Aktifkan term ini
		await db
			.update(academicTerms)
			.set({ isActive: true, status: "berjalan", updatedAt: new Date() })
			.where(eq(academicTerms.id, id));

		await cacheDel("cache:academic-term:active");
		await cacheInvalidatePattern("cache:student:*");

		return { success: true, message: "Periode akademik aktif berhasil diubah" };
	})
	.patch(
		"/academic-terms/:id/status",
		async ({ params, body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			await db
				.update(academicTerms)
				.set({ status: body.status, updatedAt: new Date() })
				.where(eq(academicTerms.id, id));

			await cacheDel("cache:academic-term:active");
			return {
				success: true,
				message: `Status periode diubah menjadi ${body.status}`,
			};
		},
		{
			body: t.Object({
				status: t.String(),
			}),
		},
	)

	// ─────────────────────────────────────────────────────────────────────────
	// 2. MASTER MATA KULIAH (Catalog)
	// ─────────────────────────────────────────────────────────────────────────
	.get("/master-courses", async ({ query }: any) => {
		const search = query?.search?.toLowerCase();
		const allMasters = await db.query.masterCourses.findMany({
			orderBy: [asc(masterCourses.code)],
		});

		const filtered = search
			? allMasters.filter(
					(m) =>
						m.code.toLowerCase().includes(search) ||
						m.name.toLowerCase().includes(search),
				)
			: allMasters;

		return { success: true, data: filtered };
	})
	.post(
		"/master-courses",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const existing = await db.query.masterCourses.findFirst({
				where: eq(masterCourses.code, body.code),
			});
			if (existing) {
				set.status = 400;
				return {
					success: false,
					message: `Kode mata kuliah ${body.code} sudah digunakan.`,
				};
			}
			const [created] = await db
				.insert(masterCourses)
				.values({
					code: body.code.toUpperCase().trim(),
					name: body.name.trim(),
					sks: body.sks || 2,
					type: body.type || "teori",
					description: body.description || null,
					isActive: body.isActive ?? true,
					createdBy: user.id,
				})
				.returning();

			return { success: true, data: created };
		},
		{
			body: t.Object({
				code: t.String(),
				name: t.String(),
				sks: t.Optional(t.Number()),
				type: t.Optional(t.String()),
				description: t.Optional(t.String()),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)
	.put(
		"/master-courses/:id",
		async ({ params, body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			const [updated] = await db
				.update(masterCourses)
				.set({
					name: body.name,
					sks: body.sks,
					type: body.type,
					description: body.description,
					isActive: body.isActive,
					updatedAt: new Date(),
				})
				.where(eq(masterCourses.id, id))
				.returning();

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				name: t.String(),
				sks: t.Number(),
				type: t.String(),
				description: t.Optional(t.String()),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)

	// ─────────────────────────────────────────────────────────────────────────
	// 3. KURIKULUM & PAKET SEMESTER (Curricula)
	// ─────────────────────────────────────────────────────────────────────────
	.get("/curricula", async () => {
		const list = await db.query.curricula.findMany({
			orderBy: [desc(curricula.startCohort)],
			with: {
				packages: {
					with: {
						masterCourse: true,
					},
					orderBy: [
						asc(curriculumPackages.semester),
						asc(curriculumPackages.orderIndex),
					],
				},
			},
		});
		return { success: true, data: list };
	})
	.get("/curricula/:id", async ({ params, set }) => {
		const id = parseInt(params.id, 10);
		const curr = await db.query.curricula.findFirst({
			where: eq(curricula.id, id),
			with: {
				packages: {
					with: {
						masterCourse: true,
					},
					orderBy: [
						asc(curriculumPackages.semester),
						asc(curriculumPackages.orderIndex),
					],
				},
			},
		});
		if (!curr) {
			set.status = 404;
			return { success: false, message: "Kurikulum tidak ditemukan" };
		}
		return { success: true, data: curr };
	})
	.post(
		"/curricula",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const [created] = await db
				.insert(curricula)
				.values({
					name: body.name,
					program: body.program || "D3 Perhotelan",
					subProgram: body.subProgram || null,
					startCohort: body.startCohort,
					endCohort: body.endCohort || null,
					maxSksPerSemester: body.maxSksPerSemester || 24,
					isActive: body.isActive ?? true,
					createdBy: user.id,
				})
				.returning();

			return { success: true, data: created };
		},
		{
			body: t.Object({
				name: t.String(),
				program: t.Optional(t.String()),
				subProgram: t.Optional(t.String()),
				startCohort: t.Number(),
				endCohort: t.Optional(t.Number()),
				maxSksPerSemester: t.Optional(t.Number()),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)
	.post(
		"/curricula/:id/packages",
		async ({ params, body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const curriculumId = parseInt(params.id, 10);

			// Validasi semester 1-6
			if (body.semester < 1 || body.semester > 6) {
				set.status = 400;
				return {
					success: false,
					message: "Nomor semester harus antara 1 dan 6",
				};
			}

			// Upsert package item
			const existing = await db.query.curriculumPackages.findFirst({
				where: and(
					eq(curriculumPackages.curriculumId, curriculumId),
					eq(curriculumPackages.masterCourseId, body.masterCourseId),
				),
			});

			if (existing) {
				await db
					.update(curriculumPackages)
					.set({
						semester: body.semester,
						isRequired: body.isRequired ?? true,
					})
					.where(eq(curriculumPackages.id, existing.id));
				return { success: true, message: "Mata kuliah paket diperbarui" };
			}

			await db.insert(curriculumPackages).values({
				curriculumId,
				masterCourseId: body.masterCourseId,
				semester: body.semester,
				isRequired: body.isRequired ?? true,
				orderIndex: body.orderIndex || 0,
			});

			return {
				success: true,
				message: "Mata kuliah berhasil ditambahkan ke paket",
			};
		},
		{
			body: t.Object({
				masterCourseId: t.Number(),
				semester: t.Number(),
				isRequired: t.Optional(t.Boolean()),
				orderIndex: t.Optional(t.Number()),
			}),
		},
	)
	.delete(
		"/curricula/:id/packages/:packageId",
		async ({ params, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const packageId = parseInt(params.packageId, 10);
			await db
				.delete(curriculumPackages)
				.where(eq(curriculumPackages.id, packageId));
			return {
				success: true,
				message: "Mata kuliah berhasil dikeluarkan dari paket",
			};
		},
	)

	// ─────────────────────────────────────────────────────────────────────────
	// 4. PEMBUKAAN KELAS DARI PAKET (Task 3.7)
	// ─────────────────────────────────────────────────────────────────────────
	.post(
		"/curriculum/open-classes",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			try {
				const result = await openClassesFromPackage({
					termId: body.termId,
					curriculumId: body.curriculumId,
					cohort: body.cohort,
					semester: body.semester,
					rombel: body.rombel || "Kelas A",
					peminatan: body.peminatan,
					defaultDosenId: body.defaultDosenId,
					createdBy: user.id,
				});

				await cacheInvalidatePattern("cache:students:*");

				return {
					success: true,
					message: `${result.totalCreated} kelas berhasil dibuka dari paket kurikulum`,
					data: result,
				};
			} catch (err: any) {
				set.status = 500;
				return { success: false, message: err.message };
			}
		},
		{
			body: t.Object({
				termId: t.Number(),
				curriculumId: t.Number(),
				cohort: t.Number(),
				semester: t.Number(),
				rombel: t.Optional(t.String()),
				peminatan: t.Optional(t.String()),
				defaultDosenId: t.Optional(t.Number()),
			}),
		},
	)

	// ─────────────────────────────────────────────────────────────────────────
	// 5. KRS & PENDAFTARAN MATA KULIAH MAHASISWA (Task 3.6 & 4.3)
	// ─────────────────────────────────────────────────────────────────────────
	.get("/krs/student/:id", async ({ params, query }: any) => {
		const studentId = parseInt(params.id, 10);
		const termId = query?.termId ? parseInt(query.termId, 10) : undefined;

		const activeTerm = termId
			? await getAcademicTermById(termId)
			: await getActiveAcademicTerm();

		const student = await db.query.students.findFirst({
			where: eq(students.id, studentId),
		});

		const registration = activeTerm
			? await db.query.studentSemesterRegistrations.findFirst({
					where: and(
						eq(studentSemesterRegistrations.studentId, studentId),
						eq(studentSemesterRegistrations.termId, activeTerm.id),
					),
				})
			: null;

		const studentCourses = await getStudentCoursesForTerm(
			studentId,
			activeTerm?.id,
		);
		const totalSks = studentCourses.reduce((sum, c) => sum + (c.sks || 2), 0);

		return {
			success: true,
			data: {
				student,
				term: activeTerm,
				registration,
				semester: registration?.semester || student?.currentSemester || 1,
				krsStatus: registration?.krsStatus || "draft",
				totalSks,
				courses: studentCourses,
			},
		};
	})
	.post(
		"/krs/student/:id/add",
		async ({ params, body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = parseInt(params.id, 10);
			const courseId = body.courseId;
			const termId = body.termId;

			// 1. Cek periode apakah terkunci
			const term = await getAcademicTermById(termId);
			if (term?.status === "ditutup") {
				set.status = 400;
				return {
					success: false,
					message: "Periode ini sudah ditutup. Perubahan KRS tidak diizinkan.",
				};
			}

			// 2. Cek bentrok jadwal mahasiswa (Task 4.3)
			const conflictCheck = await checkStudentScheduleConflict(
				studentId,
				courseId,
				termId,
			);
			if (conflictCheck.hasConflict && !body.allowOverride) {
				set.status = 409;
				return {
					success: false,
					message:
						"Jadwal mata kuliah bentrok dengan jadwal yang sudah diambil.",
					conflicts: conflictCheck.conflicts,
				};
			}

			// 3. Masukkan ke course_enrollments
			await db
				.insert(courseEnrollments)
				.values({
					studentId,
					courseId,
					termId,
					source: body.source || "manual",
					status: "aktif",
					reason: body.reason || "Penambahan manual oleh Akademik",
					addedBy: user.id,
				})
				.onConflictDoNothing();

			// 4. Catat ke academic_audit_logs
			await db.insert(academicAuditLogs).values({
				studentId,
				termId,
				action: conflictCheck.hasConflict ? "krs_override" : "krs_add",
				details: {
					courseId,
					source: body.source,
					conflicts: conflictCheck.conflicts,
				},
				reason: body.reason || "Penambahan mata kuliah KRS",
				performedBy: user.id,
			});

			await cacheInvalidatePattern("cache:student:*");

			return {
				success: true,
				message: "Mata kuliah berhasil ditambahkan ke KRS",
			};
		},
		{
			body: t.Object({
				courseId: t.Number(),
				termId: t.Number(),
				source: t.Optional(t.String()),
				reason: t.Optional(t.String()),
				allowOverride: t.Optional(t.Boolean()),
			}),
		},
	)
	.post(
		"/krs/student/:id/drop",
		async ({ params, body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = parseInt(params.id, 10);
			const courseId = body.courseId;
			const termId = body.termId;

			const term = await getAcademicTermById(termId);
			if (term?.status === "ditutup") {
				set.status = 400;
				return {
					success: false,
					message:
						"Periode sudah ditutup. Tidak dapat membatalkan mata kuliah.",
				};
			}

			await db
				.delete(courseEnrollments)
				.where(
					and(
						eq(courseEnrollments.studentId, studentId),
						eq(courseEnrollments.courseId, courseId),
					),
				);

			await db.insert(academicAuditLogs).values({
				studentId,
				termId,
				action: "krs_drop",
				details: { courseId },
				reason: body.reason || "Pembatalan mata kuliah oleh Akademik",
				performedBy: user.id,
			});

			await cacheInvalidatePattern("cache:student:*");

			return {
				success: true,
				message: "Mata kuliah berhasil dibatalkan dari KRS",
			};
		},
		{
			body: t.Object({
				courseId: t.Number(),
				termId: t.Number(),
				reason: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/krs/student/:id/approve",
		async ({ params, body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik", "pa")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = parseInt(params.id, 10);
			const termId = body.termId;

			await db
				.update(studentSemesterRegistrations)
				.set({
					krsStatus: "disetujui",
					approvedBy: user.id,
					approvedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(studentSemesterRegistrations.studentId, studentId),
						eq(studentSemesterRegistrations.termId, termId),
					),
				);

			return { success: true, message: "KRS mahasiswa berhasil disetujui" };
		},
		{
			body: t.Object({
				termId: t.Number(),
			}),
		},
	)
	.post(
		"/krs/bulk-package-enroll",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const result = await enrollCohortRombelToPackage({
				termId: body.termId,
				cohort: body.cohort,
				rombel: body.rombel || "Kelas A",
				semester: body.semester,
				curriculumId: body.curriculumId,
				enrolledBy: user.id,
			});

			await cacheInvalidatePattern("cache:student:*");
			return {
				success: true,
				message: `${result.enrolledCount} pendaftaran KRS paket berhasil dibuat untuk ${result.totalStudents} mahasiswa.`,
				data: result,
			};
		},
		{
			body: t.Object({
				termId: t.Number(),
				cohort: t.Number(),
				rombel: t.Optional(t.String()),
				semester: t.Number(),
				curriculumId: t.Number(),
			}),
		},
	)

	// ─────────────────────────────────────────────────────────────────────────
	// 6. PERGANTIAN SEMESTER (ROLLOVER & LOGS) (Fase 5)
	// ─────────────────────────────────────────────────────────────────────────
	.post(
		"/academic-rollover/preview",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			try {
				const preview = await previewSemesterRollover(
					body.sourceTermId,
					body.targetTermId,
				);
				return { success: true, data: preview };
			} catch (err: any) {
				set.status = 400;
				return { success: false, message: err.message };
			}
		},
		{
			body: t.Object({
				sourceTermId: t.Number(),
				targetTermId: t.Number(),
			}),
		},
	)
	.post(
		"/academic-rollover/execute",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "superadmin")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya Superadmin yang berwenang mengeksekusi pergantian semester",
				};
			}
			try {
				const result = await executeSemesterRollover(
					body.sourceTermId,
					body.targetTermId,
					user.id,
				);
				return { success: true, data: result };
			} catch (err: any) {
				set.status = 500;
				return { success: false, message: err.message };
			}
		},
		{
			body: t.Object({
				sourceTermId: t.Number(),
				targetTermId: t.Number(),
			}),
		},
	)
	.get("/academic-rollover/logs", async () => {
		const logs = await db.query.semesterRolloverLogs.findMany({
			orderBy: [desc(semesterRolloverLogs.createdAt)],
			with: {
				executedByUser: {
					columns: { id: true, fullName: true, role: true },
				},
				sourceTerm: true,
				targetTerm: true,
			},
		});
		return { success: true, data: logs };
	})
	.post(
		"/academic-terms/:id/reopen",
		async ({ params, body, set, user }: any) => {
			if (!hasRole(user, "superadmin")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya Superadmin yang berwenang membuka kembali periode akademik yang ditutup",
				};
			}
			const id = parseInt(params.id, 10);
			await db
				.update(academicTerms)
				.set({
					status: "penilaian",
					updatedAt: new Date(),
				})
				.where(eq(academicTerms.id, id));

			// Catat audit
			await db.insert(academicAuditLogs).values({
				termId: id,
				action: "term_reopen",
				details: { reopenedAt: new Date().toISOString() },
				reason: body.reason,
				performedBy: user.id,
			});

			return {
				success: true,
				message: "Periode berhasil dibuka kembali untuk penilaian khusus",
			};
		},
		{
			body: t.Object({
				reason: t.String(),
			}),
		},
	);
