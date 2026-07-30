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

export const finalDecisionRoutes = new Elysia()
	.get("/:id/final-decision", async ({ params, set }) => {
		const id = Number(params.id);
		if (Number.isNaN(id)) {
			set.status = 400;
			return { success: false, message: "Invalid ID" };
		}

		const [
			decision,
			logs,
			student,
			pmb,
			crm,
			finance,
			academic,
			pa,
			internship,
			courses,
			academicDocs,
		] = await Promise.all([
			db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, id),
				with: {
					decidedBy: true,
				},
			}),
			db.query.auditLogs.findMany({
				where: and(
					eq(auditLogs.entity, "final_decision"),
					eq(auditLogs.entityId, id),
				),
				orderBy: [desc(auditLogs.createdAt)],
				with: {
					user: true,
				},
			}),
			db.query.students.findFirst({
				where: eq(students.id, id),
			}),
			db.query.pmbData.findFirst({
				where: eq(pmbData.studentId, id),
				with: {
					accBy: { columns: { fullName: true } },
				},
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
			db.query.courseGrades.findMany({
				where: eq(courseGrades.studentId, id),
			}),
			db.query.academicDocuments.findMany({
				where: eq(academicDocuments.studentId, id),
			}),
		]);

		let dec = decision;
		if (!dec) {
			// Create default if not exists
			await db.insert(finalDecision).values({ studentId: id });
			dec = await db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, id),
				with: {
					decidedBy: true,
				},
			});
		}

		const dosenIsAcc = courses.length > 0 && courses.every((c) => c.isAcc);
		const dosenAccAt = dosenIsAcc
			? new Date(
					Math.max(...courses.map((c) => new Date(c.accAt || 0).getTime())),
				)
			: null;

		return {
			success: true,
			data: {
				decision: dec,
				logs,
				student,
				academicData: academic,
				academicDocs: academicDocs.filter((d) =>
					["taiwan_lol", "taiwan_loa", "taiwan_suhhan"].includes(d.documentKey),
				),
				pmbAcc: { isAcc: pmb?.isAcc, accAt: pmb?.accAt, accBy: pmb?.accBy },
				crmAcc: { isAcc: crm?.isAcc, accAt: crm?.accAt, accBy: crm?.accBy },
				financeAcc: {
					isAcc: finance?.isAcc,
					accAt: finance?.accAt,
					accBy: finance?.accBy,
				},
				academicAcc: {
					isAcc: academic?.isAcc,
					accAt: academic?.accAt,
					accBy: academic?.accBy,
				},
				paAcc: { isAcc: pa?.isAcc, accAt: pa?.accAt, accBy: pa?.accBy },
				internshipAcc: {
					isAcc: internship?.isAcc,
					accAt: internship?.accAt,
					accBy: internship?.accBy,
				},
				dosenAcc: { isAcc: dosenIsAcc, accAt: dosenAccAt },
				skDocumentUrl: dec?.skDocumentUrl || null,
			},
		};
	})
	.patch(
		"/:id/final-decision",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			if (!user || (user.role !== "evaluator" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const prevDecision = await db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, id),
			});

			await db
				.update(finalDecision)
				.set({
					evaluatorDecision: (body as any).evaluatorDecision,
					evaluatorNotes: (body as any).evaluatorNotes,
					decidedAt: new Date(),
					decidedBy: user.id,
					updatedAt: new Date(),
				})
				.where(eq(finalDecision.studentId, id));

			if (prevDecision?.evaluatorDecision !== (body as any).evaluatorDecision) {
				await db.insert(auditLogs).values({
					userId: user.id,
					action: "UPDATE_EVALUATOR_DECISION",
					entity: "final_decision",
					entityId: id,
					details: {
						from: prevDecision?.evaluatorDecision || "menunggu",
						to: (body as any).evaluatorDecision,
					},
					createdAt: new Date(),
				});
			}

			return { success: true };
		},
		{
			body: t.Object({
				evaluatorDecision: t.String(),
				evaluatorNotes: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/:id/final-decision/director-approval",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			// Hanya superadmin yang bisa melakukan director approval
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db
				.update(finalDecision)
				.set({
					isApprovedByDirector: (body as any).isApproved,
					updatedAt: new Date(),
				})
				.where(eq(finalDecision.studentId, id));

			// Catat di audit log
			await db.insert(auditLogs).values({
				userId: user.id,
				action: (body as any).isApproved
					? "DIRECTOR_APPROVED"
					: "DIRECTOR_APPROVAL_REVOKED",
				entity: "final_decision",
				entityId: id,
				details: null,
				createdAt: new Date(),
			});

			return { success: true };
		},
		{
			body: t.Object({
				isApproved: t.Boolean(),
			}),
		},
	)
	.patch(
		"/:id/final-decision/confidential-notes",
		async ({ params, body, set, user }: any) => {
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = parseInt(params.id, 10);

			const row = await db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, studentId),
			});
			if (!row) {
				await db.insert(finalDecision).values({ studentId });
			}

			await db
				.update(finalDecision)
				.set({
					confidentialNotes: body.confidentialNotes,
					updatedAt: new Date(),
				})
				.where(eq(finalDecision.studentId, studentId));

			return { success: true, message: "Catatan internal berhasil disimpan" };
		},
		{
			body: t.Object({
				confidentialNotes: t.String(),
			}),
		},
	)
	.post(
		"/:id/final-decision/sk-upload",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const studentId = Number(params.id);
			const file = (body as any).file as File;

			console.log(
				"[sk-upload] Hit with file:",
				file?.name,
				file?.type,
				file?.size,
			);

			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			if (file?.type !== "application/pdf") {
				set.status = 400;
				return { success: false, message: "Harus berupa file PDF" };
			}
			if (file.size > 5 * 1024 * 1024) {
				set.status = 400;
				return { success: false, message: "Ukuran file maksimal 5MB" };
			}

			// Verify final decision row exists
			let row = await db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, studentId),
			});

			if (!row) {
				await db.insert(finalDecision).values({ studentId });
				row = await db.query.finalDecision.findFirst({
					where: eq(finalDecision.studentId, studentId),
				});
			}

			// Generate unique filename
			const timestamp = Date.now();
			const originalName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
			const filename = `${studentId}_sk_direktur_${timestamp}_${originalName}`;

			// Create directory if not exists
			const uploadDir = join(
				process.cwd(),
				"uploads",
				"documents",
				"final-decision",
			);
			await mkdir(uploadDir, { recursive: true });

			// Write file to disk
			const filePath = join(uploadDir, filename);
			const fileBuffer = await file.arrayBuffer();
			await Bun.write(filePath, fileBuffer);

			const fileUrl = `/uploads/documents/final-decision/${filename}`;

			// Update row in DB
			await db
				.update(finalDecision)
				.set({
					skDocumentUrl: fileUrl,
					updatedAt: new Date(),
				})
				.where(eq(finalDecision.studentId, studentId));

			return {
				success: true,
				message: "SK Direktur berhasil diunggah",
				fileUrl,
			};
		},
		{
			type: "formdata",
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.delete(
		"/:id/final-decision/sk-document",
		async ({ params, set, user }: any) => {
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = Number(params.id);

			await db
				.update(finalDecision)
				.set({
					skDocumentUrl: null,
					updatedAt: new Date(),
				})
				.where(eq(finalDecision.studentId, studentId));

			return { success: true, message: "SK Direktur berhasil dihapus" };
		},
	)
	.get("/finalization", async ({ query, user, set }: any) => {
		if (user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

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
			.where(
				and(
					eq(students.isArchived, false),
					eq(finalDecision.evaluatorDecision, "layak_berangkat"),
				),
			);

		const allCourseGrades = await db.select().from(courseGrades);

		const dataWithCourses = results.map((r) => {
			const courses = allCourseGrades.filter(
				(c) => c.studentId === r.student.id,
			);
			return { ...r, courseGrades: courses };
		});

		return { success: true, data: dataWithCourses };
	});
