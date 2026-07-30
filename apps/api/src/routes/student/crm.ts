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

export const crmRoutes = new Elysia()
	.get("/:id/crm", async ({ params, set }) => {
		const id = Number(params.id);
		const crm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } },
			},
		});

		const logs = await db.query.crmLogs.findMany({
			where: eq(crmLogs.studentId, id),
			with: { author: { columns: { fullName: true } } },
			orderBy: (crmLogs, { desc }) => [desc(crmLogs.createdAt)],
			limit: 5,
		});

		return { success: true, data: { crm, logs } };
	})
	.get("/:id/crm/logs", async ({ params, query, set }) => {
		const id = Number(params.id);
		const limit = Number(query?.limit) || 20;
		const page = Number(query?.page) || 1;

		const logs = await db.query.crmLogs.findMany({
			where: eq(crmLogs.studentId, id),
			with: { author: { columns: { fullName: true } } },
			orderBy: (crmLogs, { desc }) => [desc(crmLogs.createdAt)],
			limit: limit,
			offset: (page - 1) * limit,
		});

		return { success: true, data: logs };
	})
	.patch(
		"/:id/crm",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			if (
				user.role !== "crm" &&
				user.role !== "superadmin" &&
				user.role !== "superadmin"
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = Number(params.id);
			const updates = body as Record<string, any>;

			const current = await db.query.crmData.findFirst({
				where: eq(crmData.studentId, id),
			});
			if (!current) {
				await db.insert(crmData).values({ studentId: id, ...updates });
			} else {
				await db
					.update(crmData)
					.set({ ...updates, updatedAt: new Date() })
					.where(eq(crmData.studentId, id));
			}

			// Recalculate status
			const updated = await db.query.crmData.findFirst({
				where: eq(crmData.studentId, id),
			});
			if (updated) {
				const crmChecks = [
					updated.isMonitoringParent,
					updated.isMonitoringIndustry,
					updated.isVocabComplete,
					updated.practiceAttendance,
					updated.isOdsReport,
					updated.odsDocumentation,
					updated.isPrammagangReport,
					updated.isPrammagangDocumentation,
				];

				const checked = crmChecks.filter(Boolean).length;
				const totalChecks = 8;

				let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
				if (checked === totalChecks) status = "AMAN";
				else if (checked >= 4) status = "PERLU_PERHATIAN";

				const extraUpdates: any = { status };
				if (checked < totalChecks && updated.isAcc) {
					extraUpdates.isAcc = false;
					extraUpdates.accAt = null;
					extraUpdates.accBy = null;
				}

				await db
					.update(crmData)
					.set(extraUpdates)
					.where(eq(crmData.studentId, id));
			}

			return { success: true };
		},
		{
			body: t.Record(t.String(), t.Any()),
		},
	)
	.post(
		"/:id/crm/log",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);
			const payload = body as any;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			await db.insert(crmLogs).values({
				studentId: id,
				authorId: user.id,
				startTime: payload.startTime,
				endTime: payload.endTime,
				media: payload.media,
				location: payload.location,
				topic: payload.topic,
				logText: payload.logText,
				agreements: payload.agreements || [],
				followUps: payload.followUps || [],
			});

			return { success: true };
		},
		{
			body: t.Object({
				startTime: t.Optional(t.String()),
				endTime: t.Optional(t.String()),
				media: t.Optional(t.String()),
				location: t.Optional(t.String()),
				topic: t.Optional(t.String()),
				logText: t.String(),
				agreements: t.Optional(t.Array(t.String())),
				followUps: t.Optional(t.Array(t.Any())),
			}),
		},
	)
	.post("/:id/crm/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const currentCrm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
		});
		if (
			!currentCrm?.isMonitoringParent ||
			!currentCrm.isMonitoringIndustry ||
			!currentCrm.isVocabComplete ||
			!currentCrm.practiceAttendance ||
			!currentCrm.isOdsReport ||
			!currentCrm.odsDocumentation ||
			!currentCrm.isPrammagangReport ||
			!currentCrm.isPrammagangDocumentation
		) {
			set.status = 400;
			return {
				success: false,
				message: "Semua checklist (8 item) harus selesai sebelum ACC.",
			};
		}

		await db
			.update(crmData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
			})
			.where(eq(crmData.studentId, id));

		return { success: true };
	})
	.delete("/:id/crm/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user || (user.role !== "crm" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);

		await db
			.update(crmData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
			})
			.where(eq(crmData.studentId, id));

		return { success: true };
	})

	// --- CRM DOCUMENTS ---
	.get("/:id/crm/documents", async ({ params, set }) => {
		const id = Number(params.id);
		const docs = await db.query.crmDocuments.findMany({
			where: eq(crmDocuments.studentId, id),
			orderBy: [desc(crmDocuments.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } },
			},
		});

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
	.post(
		"/:id/crm/upload/:documentKey",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			const id = Number(params.id);
			const documentKey = params.documentKey;

			const allowedKeys = [
				"odsActive",
				"studentMonitoring",
				"parentFollowUp",
				"practiceAttendance",
				"odsDocumentation",
			];
			if (!allowedKeys.includes(documentKey)) {
				set.status = 400;
				return { success: false, message: "Document key tidak valid" };
			}

			const file = body.file as File;
			if (!file) {
				set.status = 400;
				return { success: false, message: "File tidak ditemukan" };
			}

			const MAX_SIZE = 10 * 1024 * 1024; // 10MB
			const allowedTypes = [
				"application/pdf",
				"image/jpeg",
				"image/png",
				"application/zip",
				"application/x-zip-compressed",
			];
			if (file.size > MAX_SIZE) {
				set.status = 400;
				return {
					success: false,
					message: "File terlalu besar (maksimal 10MB)",
				};
			}
			if (!allowedTypes.includes(file.type)) {
				set.status = 400;
				return {
					success: false,
					message: "Tipe file tidak diizinkan (PDF, JPG, PNG, ZIP)",
				};
			}

			const uploadDir = join(
				process.cwd(),
				"uploads",
				"crm",
				id.toString(),
				documentKey,
			);
			await mkdir(uploadDir, { recursive: true });

			const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
			const fileUrl = join(uploadDir, filename);

			await Bun.write(fileUrl, await file.arrayBuffer());

			await db.insert(crmDocuments).values({
				studentId: id,
				documentKey,
				fileName: file.name,
				fileUrl: fileUrl,
				fileSize: file.size,
				mimeType: file.type,
				uploadedBy: user.id,
			});

			return { success: true, message: "File berhasil diupload" };
		},
		{
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.get("/:id/crm/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.crmDocuments.findFirst({
			where: eq(crmDocuments.id, docId),
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
	.patch("/:id/crm/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "crm" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db
			.update(crmDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(crmDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/crm/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "crm" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);

		const doc = await db.query.crmDocuments.findFirst({
			where: eq(crmDocuments.id, docId),
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db.delete(crmDocuments).where(eq(crmDocuments.id, docId));
		return { success: true };
	});
