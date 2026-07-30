import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import {
	academicAttitudeLogs,
	academicData,
	academicDocuments,
	auditLogs,
	counselingLogs,
	courseGradeDocuments,
	courseGrades,
	crmData,
	crmDocuments,
	crmLogs,
	entrepreneurshipRecords,
	feeShareRecipients,
	finalDecision,
	financeData,
	financeDocuments,
	internalNotes,
	internshipData,
	internshipDocuments,
	paData,
	paDocuments,
	paInterviewLogs,
	paTripartiteLogs,
	pmbData,
	pmbDocuments,
	pmbFeeDisbursements,
	pmbPaymentPlan,
	postInternshipDocs,
	students,
	users,
	vocabLogs,
	weeklyEvents,
} from "../../db/schema";
import { requireRole } from "../../middleware/rbac";

export const coreRoutes = new Elysia()
	.get("/", async ({ query }) => {
		const isArchived = query?.archived === "true";
		const results = await db
			.select({
				student: students,
				pmb: pmbData,
				crm: crmData,
				finance: financeData,
				academic: academicData,
				pa: paData,
				internship: internshipData,
				decision: finalDecision,
			})
			.from(students)
			.leftJoin(pmbData, eq(students.id, pmbData.studentId))
			.leftJoin(crmData, eq(students.id, crmData.studentId))
			.leftJoin(financeData, eq(students.id, financeData.studentId))
			.leftJoin(academicData, eq(students.id, academicData.studentId))
			.leftJoin(paData, eq(students.id, paData.studentId))
			.leftJoin(internshipData, eq(students.id, internshipData.studentId))
			.leftJoin(finalDecision, eq(students.id, finalDecision.studentId))
			.where(eq(students.isArchived, isArchived));
		const allCourseGrades = await db.select().from(courseGrades);

		const dataWithCourses = results.map((r) => {
			const courses = allCourseGrades.filter(
				(c) => c.studentId === r.student.id,
			);
			return { ...r, courseGrades: courses };
		});

		return { success: true, data: dataWithCourses };
	})
	.post(
		"/",
		async ({ body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			// Validate unique nim
			const existing = await db.query.students.findFirst({
				where: eq(students.nim, body.nim),
			});
			if (existing) {
				set.status = 400;
				return { success: false, message: "NIM sudah terdaftar" };
			}

			// Insert student
			const [newStudent] = await db
				.insert(students)
				.values({
					nim: body.nim,
					name: body.name,
					cohort: body.cohort,
					program: body.program,
					subProgram: body.subProgram,
					phone: body.phone,
					parentName: body.parentName,
					paId: body.paId,
					studentStatus: body.studentStatus || "aktif",
					destinationCountry: body.destinationCountry,
					period: body.period,
				})
				.returning();

			// Initialize related panels
			const studentId = newStudent.id;
			await Promise.all([
				db.insert(pmbData).values({
					studentId,
					rekomendasi: body.rekomendasi,
					timVisit: body.timVisit,
					timSosialisasi: body.timSosialisasi,
					roReferral: body.roReferral,
					mitraSponsor: body.mitraSponsor,
					koordinator: body.koordinator,
				}),
				db.insert(pmbPaymentPlan).values({ studentId }),
				db.insert(crmData).values({ studentId }),
				db.insert(financeData).values({ studentId }),
				db.insert(academicData).values({ studentId }),
				db.insert(paData).values({ studentId }),
				db.insert(internshipData).values({ studentId }),
				db.insert(finalDecision).values({ studentId }),
			]);

			return { success: true, data: newStudent };
		},
		{
			body: t.Object({
				nim: t.String(),
				name: t.String(),
				cohort: t.Number(),
				program: t.String(),
				subProgram: t.Optional(t.String()),
				phone: t.Optional(t.String()),
				parentName: t.Optional(t.String()),
				paId: t.Optional(t.Number()),
				studentStatus: t.Optional(t.String()),
				destinationCountry: t.Optional(t.String()),
				period: t.Optional(t.String()),
				rekomendasi: t.Optional(t.String()),
				timVisit: t.Optional(t.String()),
				timSosialisasi: t.Optional(t.String()),
				roReferral: t.Optional(t.String()),
				mitraSponsor: t.Optional(t.String()),
				koordinator: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/:id",
		async ({ params, body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);

			// If nim changed, validate unique
			if (body.nim) {
				const existing = await db.query.students.findFirst({
					where: eq(students.nim, body.nim),
				});
				if (existing && existing.id !== id) {
					set.status = 400;
					return { success: false, message: "NIM sudah terdaftar" };
				}
			}

			await db
				.update(students)
				.set({
					...body,
					updatedAt: new Date(),
				})
				.where(eq(students.id, id));

			return { success: true };
		},
		{
			body: t.Object({
				nim: t.Optional(t.String()),
				name: t.Optional(t.String()),
				cohort: t.Optional(t.Number()),
				program: t.Optional(t.String()),
				subProgram: t.Optional(t.String()),
				phone: t.Optional(t.String()),
				parentName: t.Optional(t.String()),
				paId: t.Optional(t.Number()),
				studentStatus: t.Optional(t.String()),
				destinationCountry: t.Optional(t.String()),
				period: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/:id/profile-photo",
		async ({ params, body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			const file = body.file as File;

			if (!file) {
				set.status = 400;
				return { success: false, message: "Tidak ada file yang diupload" };
			}

			const uploadDir = join(process.cwd(), "uploads", "profile");
			await mkdir(uploadDir, { recursive: true });

			const fileName = `student_${id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
			const filePath = join(uploadDir, fileName);

			const fileBuffer = await file.arrayBuffer();
			await Bun.write(filePath, fileBuffer);

			const fileUrl = `/uploads/profile/${fileName}`;

			await db
				.update(students)
				.set({ profilePhotoUrl: fileUrl, updatedAt: new Date() })
				.where(eq(students.id, id));

			return { success: true, url: fileUrl };
		},
		{
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.patch("/:id/archive", async ({ params, set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);
		await db
			.update(students)
			.set({ isArchived: true, updatedAt: new Date() })
			.where(eq(students.id, id));
		return { success: true, message: "Berhasil mengarsipkan mahasiswa" };
	})
	.post("/:id/generate-account", async ({ params, set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);

		const studentData = await db.query.students.findFirst({
			where: eq(students.id, id),
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Mahasiswa tidak ditemukan" };
		}

		if (studentData.studentUserId) {
			set.status = 400;
			return { success: false, message: "Mahasiswa sudah memiliki akun" };
		}

		// Generate account
		const passwordHash = await Bun.password.hash("password");

		const [newUser] = await db
			.insert(users)
			.values({
				username: studentData.nim,
				passwordHash,
				fullName: studentData.name,
				role: "mahasiswa",
			})
			.returning();

		await db
			.update(students)
			.set({ studentUserId: newUser.id, updatedAt: new Date() })
			.where(eq(students.id, id));

		return {
			success: true,
			message:
				"Akun mahasiswa berhasil dibuat dengan password default: password",
		};
	})
	.patch("/:id/unarchive", async ({ params, set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);
		await db
			.update(students)
			.set({ isArchived: false, updatedAt: new Date() })
			.where(eq(students.id, id));
		return {
			success: true,
			message: "Berhasil memulihkan mahasiswa dari arsip",
		};
	})
	.delete("/:id", async ({ params, set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return {
				success: false,
				message: "Forbidden: Only superadmin or pmb can delete",
			};
		}
		const id = parseInt(params.id, 10);

		// Hapus seluruh data relasional karena tidak memakai CASCADE di schema
		await db.delete(pmbDocuments).where(eq(pmbDocuments.studentId, id));
		await db.delete(pmbData).where(eq(pmbData.studentId, id));

		await db.delete(crmDocuments).where(eq(crmDocuments.studentId, id));
		await db.delete(crmLogs).where(eq(crmLogs.studentId, id));
		await db.delete(crmData).where(eq(crmData.studentId, id));

		await db.delete(financeDocuments).where(eq(financeDocuments.studentId, id));
		await db.delete(financeData).where(eq(financeData.studentId, id));

		await db
			.delete(courseGradeDocuments)
			.where(eq(courseGradeDocuments.studentId, id));
		await db.delete(courseGrades).where(eq(courseGrades.studentId, id));
		await db
			.delete(academicDocuments)
			.where(eq(academicDocuments.studentId, id));
		await db.delete(academicData).where(eq(academicData.studentId, id));

		await db.delete(vocabLogs).where(eq(vocabLogs.studentId, id));
		await db.delete(counselingLogs).where(eq(counselingLogs.studentId, id));
		await db.delete(paData).where(eq(paData.studentId, id));

		await db.delete(internshipData).where(eq(internshipData.studentId, id));
		await db.delete(finalDecision).where(eq(finalDecision.studentId, id));
		await db.delete(internalNotes).where(eq(internalNotes.studentId, id));
		await db
			.delete(auditLogs)
			.where(and(eq(auditLogs.entity, "student"), eq(auditLogs.entityId, id)));

		// Hapus data utama
		await db.delete(students).where(eq(students.id, id));

		return {
			success: true,
			message: "Berhasil menghapus mahasiswa beserta seluruh data terkait",
		};
	})
	.get("/:id", async ({ params, set }) => {
		const id = parseInt(params.id, 10);
		if (Number.isNaN(id)) {
			set.status = 400;
			return { success: false, message: "Invalid ID" };
		}

		const student = await db.query.students.findFirst({
			where: eq(students.id, id),
		});

		if (!student) {
			set.status = 404;
			return { success: false, message: "Student not found" };
		}

		const [
			pmb,
			pmbPayment,
			crm,
			finance,
			academic,
			pa,
			internship,
			decision,
			grades,
		] = await Promise.all([
			db.query.pmbData.findFirst({
				where: eq(pmbData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.pmbPaymentPlan.findFirst({
				where: eq(pmbPaymentPlan.studentId, id),
			}),
			db.query.crmData.findFirst({
				where: eq(crmData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.financeData.findFirst({
				where: eq(financeData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.academicData.findFirst({
				where: eq(academicData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.paData.findFirst({
				where: eq(paData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.internshipData.findFirst({
				where: eq(internshipData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, id),
			}),
			db.query.courseGrades.findMany({
				where: eq(courseGrades.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
		]);

		return {
			success: true,
			data: {
				student,
				pmb: pmb ? { ...pmb, paymentPlan: pmbPayment } : null,
				crm,
				finance,
				academic,
				pa,
				internship,
				decision,
				courseGrades: grades,
			},
		};
	});
