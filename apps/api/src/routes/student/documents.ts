import { and, eq } from "drizzle-orm";
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
import { fileService } from "../../modules/file/service/file.service";
import { invalidateFinanceCaches } from "./finance";

export const documentsRoutes = new Elysia()
	.get("/:id/:panel/documents", async (context) => {
		const { params } = context;
		const studentId = Number(params.id);
		const panel = params.panel as string;

		let table: any;
		switch (panel) {
			case "pmb":
				table = pmbDocuments;
				break;
			case "crm":
				table = crmDocuments;
				break;
			case "finance":
				table = financeDocuments;
				break;
			case "akademik":
				table = academicDocuments;
				break;
			case "pa":
				table = paDocuments;
				break;
			case "magang":
				table = internshipDocuments;
				break;
			case "post-internship":
				table = postInternshipDocs;
				break;
			default:
				return { success: false, message: "Invalid panel" };
		}

		const docs = await db
			.select()
			.from(table)
			.where(eq(table.studentId, studentId));
		return { success: true, data: docs };
	})
	.post(
		"/:id/:panel/documents",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const studentId = Number(params.id);
			const panel = params.panel as string;
			const documentKey = (body as any).documentKey;
			const file = (body as any).file as File;

			if (file?.type !== "application/pdf") {
				set.status = 400;
				return { success: false, message: "Harus berupa file PDF" };
			}
			if (file.size > 5 * 1024 * 1024) {
				set.status = 400;
				return { success: false, message: "Ukuran file maksimal 5MB" };
			}

			let table: any;
			switch (panel) {
				case "pmb":
					table = pmbDocuments;
					break;
				case "crm":
					table = crmDocuments;
					break;
				case "finance":
					table = financeDocuments;
					break;
				case "akademik":
					table = academicDocuments;
					break;
				case "pa":
					table = paDocuments;
					break;
				case "magang":
					table = internshipDocuments;
					break;
				case "post-internship":
					table = postInternshipDocs;
					break;
				default:
					set.status = 400;
					return { success: false, message: "Invalid panel" };
			}

			// Upload file via FileService — tidak boleh akses filesystem langsung
			let uploadResult: { id: string; storagePath: string } | null = null;
			try {
				uploadResult = await fileService.uploadFile({
					file,
					studentId,
					category: panel,
					panel,
					documentKey,
					uploadedBy: user.id,
				});
			} catch (err) {
				const error = err as Error;
				set.status = 400;
				return { success: false, message: error.message };
			}

			const fileUrl = `/files/${uploadResult.id}/download`;
			const originalName = file.name;

			// Allow multiple files per documentKey by NOT deleting the old ones

			await db.insert(table).values({
				studentId,
				documentKey,
				fileName: originalName,
				fileUrl,
				fileSize: file.size,
				mimeType: file.type,
				uploadedBy: user.id,
			});

			// Jika panel finance, update status field terkait secara otomatis & invalidate cache
			if (panel === "finance") {
				if (documentKey === "registrasi") {
					await db
						.update(financeData)
						.set({
							registrasiStatus: true,
							registrasiPaidDate: new Date(),
							registrasiBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				} else if (documentKey === "mandiri_interview") {
					await db
						.update(financeData)
						.set({
							mandiriInterviewStatus: true,
							mandiriInterviewBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				} else if (documentKey === "t1_interview") {
					await db
						.update(financeData)
						.set({
							t1InterviewStatus: true,
							t1InterviewBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				} else if (documentKey === "mandiri_keberangkatan") {
					await db
						.update(financeData)
						.set({
							mandiriKeberangkatanStatus: true,
							mandiriKeberangkatanBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				} else if (documentKey === "t2_keberangkatan") {
					await db
						.update(financeData)
						.set({
							t2KeberangkatanStatus: true,
							t2KeberangkatanBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				} else if (documentKey === "admin_talangan") {
					await db
						.update(financeData)
						.set({
							adminTalaganStatus: true,
							adminTalaganBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				} else if (documentKey === "toeic") {
					await db
						.update(financeData)
						.set({
							toeicStatus: true,
							toeicBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				} else if (documentKey === "paspor") {
					await db
						.update(financeData)
						.set({
							pasporStatus: true,
							pasporBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				} else if (documentKey === "rumah_juang") {
					await db
						.update(financeData)
						.set({
							rumahJuangStatus: true,
							rumahJuangBuktiBayarUrl: fileUrl,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				}

				await invalidateFinanceCaches(studentId);
			}

			return { success: true, message: "Dokumen berhasil diunggah", fileUrl };
		},
		{
			body: t.Object({
				documentKey: t.String(),
				file: t.File(),
			}),
		},
	)
	.delete("/:id/:panel/documents/:docId", async (context) => {
		const { params, set } = context;
		const studentId = Number(params.id);
		const panel = params.panel as string;
		const docId = Number(params.docId);

		let table: any;
		switch (panel) {
			case "pmb":
				table = pmbDocuments;
				break;
			case "crm":
				table = crmDocuments;
				break;
			case "finance":
				table = financeDocuments;
				break;
			case "akademik":
				table = academicDocuments;
				break;
			case "pa":
				table = paDocuments;
				break;
			case "magang":
				table = internshipDocuments;
				break;
			case "post-internship":
				table = postInternshipDocs;
				break;
			default:
				set.status = 400;
				return { success: false, message: "Invalid panel" };
		}

		await db
			.delete(table)
			.where(and(eq(table.studentId, studentId), eq(table.id, docId)));

		if (panel === "finance") {
			await invalidateFinanceCaches(studentId);
		}

		return { success: true, message: "Dokumen berhasil dihapus" };
	})
	.patch(
		"/:id/final-decision/director-approval",
		async ({ params, body, set, user }: any) => {
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = parseInt(params.id, 10);

			// Verify final decision row exists
			let row = await db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, studentId),
			});

			if (!row) {
				// Initialize it if it doesn't exist
				await db.insert(finalDecision).values({ studentId });
				row = await db.query.finalDecision.findFirst({
					where: eq(finalDecision.studentId, studentId),
				});
			}

			const student = await db.query.students.findFirst({
				where: eq(students.id, studentId),
			});

			// Validate if eligible (needs to be layak_berangkat AND overallStatus AMAN)
			if (body.isApproved) {
				if (row?.evaluatorDecision !== "layak_berangkat") {
					set.status = 400;
					return {
						success: false,
						message:
							"Mahasiswa belum dinyatakan layak berangkat oleh Evaluator",
					};
				}
				if (student?.overallStatus !== "AMAN") {
					set.status = 400;
					return {
						success: false,
						message:
							"Masih ada persyaratan divisi yang belum disetujui (TIDAK AMAN/PERLU PERHATIAN).",
					};
				}
			}

			const departureDate = body.departureDate
				? new Date(body.departureDate)
				: row?.departureDate;

			await db
				.update(finalDecision)
				.set({
					isApprovedByDirector: body.isApproved,
					departureDate: departureDate,
					notes: body.notes !== undefined ? body.notes : row?.notes,
					skDocumentUrl:
						body.skDocumentUrl !== undefined
							? body.skDocumentUrl
							: row?.skDocumentUrl,
					updatedAt: new Date(),
				})
				.where(eq(finalDecision.studentId, studentId));

			await db.insert(auditLogs).values({
				entity: "student",
				entityId: studentId,
				userId: user.id,
				action: body.isApproved
					? "director_approval_granted"
					: "director_approval_revoked",
				details: body,
			});

			return {
				success: true,
				message: "Persetujuan direktur berhasil diperbarui",
			};
		},
		{
			body: t.Object({
				isApproved: t.Boolean(),
				departureDate: t.Optional(t.String()),
				notes: t.Optional(t.String()),
				skDocumentUrl: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	);
