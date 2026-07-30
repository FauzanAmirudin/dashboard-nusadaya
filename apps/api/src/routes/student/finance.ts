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

export const financeRoutes = new Elysia()
	.get("/:id/finance", async ({ params, set }) => {
		const id = Number(params.id);
		const finance = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } },
			},
		});
		return { success: true, data: finance };
	})
	.patch(
		"/:id/finance",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;

			// AUTH CHECK
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			const isFinance = user.role === "finance" || user.role === "superadmin";
			const isMagang = user.role === "magang";

			if (!isFinance && !isMagang) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = Number(params.id);
			const updates = body as Record<string, any>;

			if (isMagang) {
				const allowedKeys = [
					"t1SemesterNominalTotal",
					"t1SemesterPaidDate",
					"danaT1Notes",
					"t1SemesterStatus",
					"t2KeberangkatanNominal",
					"t2KeberangkatanPaidDate",
					"danaT2Notes",
					"t2KeberangkatanStatus",
					"adminTalaganBankTujuan",
					"adminTalaganMetode",
				];
				const hasForbiddenKey = Object.keys(updates).some(
					(k) => !allowedKeys.includes(k),
				);
				if (hasForbiddenKey) {
					set.status = 403;
					return {
						success: false,
						message: "Tim Magang hanya dapat mengupdate data Dana Talangan",
					};
				}
			}

			// Only validate if they are actively trying to set Tahap 2 values
			const isSettingTahap2 =
				updates.t2KeberangkatanStatus === true ||
				(updates.t2KeberangkatanNominal &&
					Number(updates.t2KeberangkatanNominal) > 0) ||
				(updates.t2KeberangkatanPaidDate &&
					updates.t2KeberangkatanPaidDate.trim() !== "");

			if (isSettingTahap2) {
				const internship = await db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, id),
				});
				if (!internship?.visaReady) {
					set.status = 400;
					return {
						success: false,
						message:
							"Pencairan Tahap 2 hanya dapat dilakukan setelah Visa dinyatakan 'Turun' di Panel Magang.",
					};
				}
			}

			const current = await db.query.financeData.findFirst({
				where: eq(financeData.studentId, id),
			});
			if (!current) {
				await db.insert(financeData).values({ studentId: id, ...updates });
			} else {
				// Convert ISO strings back to Date objects if needed, but JSON usually passes strings.
				// Drizzle with Postgres driver handles Date objects for timestamp fields.
				const cleanUpdates: Record<string, any> = {
					...updates,
					updatedAt: new Date(),
				};
				if (cleanUpdates.registrasiPaidDate)
					cleanUpdates.registrasiPaidDate = new Date(
						cleanUpdates.registrasiPaidDate,
					);
				if (cleanUpdates.mandiriSemesterPaidDate)
					cleanUpdates.mandiriSemesterPaidDate = new Date(
						cleanUpdates.mandiriSemesterPaidDate,
					);
				if (cleanUpdates.toeicPaidDate)
					cleanUpdates.toeicPaidDate = new Date(cleanUpdates.toeicPaidDate);
				if (cleanUpdates.t1SemesterPaidDate)
					cleanUpdates.t1SemesterPaidDate = new Date(
						cleanUpdates.t1SemesterPaidDate,
					);
				if (cleanUpdates.t2KeberangkatanPaidDate)
					cleanUpdates.t2KeberangkatanPaidDate = new Date(
						cleanUpdates.t2KeberangkatanPaidDate,
					);

				await db
					.update(financeData)
					.set(cleanUpdates)
					.where(eq(financeData.studentId, id));
			}

			// Recalculate status and auto-revoke isAcc
			const updated = await db.query.financeData.findFirst({
				where: eq(financeData.studentId, id),
			});
			if (updated) {
				const checked = 0;
				// 				if (updated.registrationPaid) checked++;
				// 				if (updated.semesterPaid) checked++;
				// 				if (updated.installmentCleared) checked++;
				// 				if (updated.arrearsCleared) checked++;

				let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
				if (checked === 4) status = "AMAN";
				else if (checked >= 2) status = "PERLU_PERHATIAN";

				const toUpdate: any = { status };

				// AUTO-REVOKE isAcc if not all are true
				if (updated.isAcc && checked < 4) {
					toUpdate.isAcc = false;
					toUpdate.accAt = null;
					toUpdate.accBy = null;
				}

				await db
					.update(financeData)
					.set(toUpdate)
					.where(eq(financeData.studentId, id));
			}

			return { success: true };
		},
		{
			body: t.Record(t.String(), t.Any()),
		},
	)
	.post("/:id/finance/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const currentFinance = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, id),
		});
		if (
			!currentFinance?.registrasiStatus ||
			(!currentFinance?.mandiriSemesterStatus &&
				!currentFinance?.t1SemesterStatus) ||
			!currentFinance?.toeicStatus ||
			!currentFinance?.pasporStatus
		) {
			set.status = 400;
			return {
				success: false,
				message: "Semua tagihan harus lunas / tidak ada tunggakan sebelum ACC.",
			};
		}

		await db
			.update(financeData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
			})
			.where(eq(financeData.studentId, id));

		return { success: true };
	})
	.delete("/:id/finance/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);

		await db
			.update(financeData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
			})
			.where(eq(financeData.studentId, id));

		return { success: true };
	})
	.get("/:id/finance/documents", async ({ params }) => {
		const id = Number(params.id);

		const docs = await db.query.financeDocuments.findMany({
			where: eq(financeDocuments.studentId, id),
			orderBy: [desc(financeDocuments.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } },
			},
		});

		// Group by documentKey
		const grouped = docs.reduce(
			(acc, doc) => {
				if (!acc[doc.documentKey]) acc[doc.documentKey] = [];
				acc[doc.documentKey].push(doc);
				return acc;
			},
			{} as Record<string, typeof docs>,
		);

		return { success: true, data: grouped };
	})
	.get("/:id/finance/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.financeDocuments.findFirst({
			where: eq(financeDocuments.id, docId),
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		const file = Bun.file(doc.fileUrl);
		if (!(await file.exists())) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan di server" };
		}

		return new Response(file, {
			headers: {
				"Content-Type": doc.mimeType || "application/octet-stream",
				"Content-Disposition": `inline; filename="${doc.fileName}"`,
			},
		});
	})
	.patch("/:id/finance/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db
			.update(financeDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(financeDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/finance/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);
		const doc = await db.query.financeDocuments.findFirst({
			where: eq(financeDocuments.id, docId),
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db.delete(financeDocuments).where(eq(financeDocuments.id, docId));
		return { success: true };
	});
