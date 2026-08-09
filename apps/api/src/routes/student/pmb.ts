import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import {
	feeShareRecipients,
	financeData,
	pmbData,
	pmbDocuments,
	pmbFeeDisbursements,
	pmbPaymentPlan,
	students,
	users,
} from "../../db/schema";
import { fileService } from "../../modules/file/service/file.service";

export const pmbRoutes = new Elysia()
	.put(
		"/:id/pmb",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);

			// Update pmbData
			await db
				.update(pmbData)
				.set({
					formReceived: body.formReceived,
					documentsComplete: body.documentsComplete,
					dataInputted: body.dataInputted,
					initialFollowUp: body.initialFollowUp,
					notes: body.notes,
					rekomendasi: body.rekomendasi,
					timVisit: body.timVisit,
					timSosialisasi: body.timSosialisasi,
					roReferral: body.roReferral,
					mitraSponsor: body.mitraSponsor,
					koordinator: body.koordinator,
					rumahJuang: body.rumahJuang,
					updatedAt: new Date(),
				})
				.where(eq(pmbData.studentId, id));

			// Auto-calculate status based on the 4 checkboxes
			const checkboxes = [
				body.formReceived,
				body.documentsComplete,
				body.dataInputted,
				body.initialFollowUp,
			];
			const checkedCount = checkboxes.filter(Boolean).length;

			let newStatus: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (checkedCount === 4) newStatus = "AMAN";
			else if (checkedCount >= 2) newStatus = "PERLU_PERHATIAN";

			await db
				.update(pmbData)
				.set({ status: newStatus })
				.where(eq(pmbData.studentId, id));

			return { success: true };
		},
		{
			body: t.Object({
				formReceived: t.Boolean(),
				documentsComplete: t.Boolean(),
				dataInputted: t.Boolean(),
				initialFollowUp: t.Boolean(),
				notes: t.Optional(t.String()),
				rekomendasi: t.Optional(t.String()),
				timVisit: t.Optional(t.String()),
				timSosialisasi: t.Optional(t.String()),
				roReferral: t.Optional(t.String()),
				mitraSponsor: t.Optional(t.String()),
				koordinator: t.Optional(t.String()),
				rumahJuang: t.Optional(t.Boolean()),
			}),
		},
	)
	.patch(
		"/:id/pmb/rumah-juang",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			await db
				.update(pmbData)
				.set({ rumahJuang: body.rumahJuang, updatedAt: new Date() })
				.where(eq(pmbData.studentId, id));
			return { success: true };
		},
		{
			body: t.Object({
				rumahJuang: t.Boolean(),
			}),
		},
	)
	.post("/:id/pmb/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user || (user.role !== "pmb" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);

		const currentPmb = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, id),
		});
		if (
			!currentPmb?.formReceived ||
			!currentPmb.documentsComplete ||
			!currentPmb.dataInputted ||
			!currentPmb.initialFollowUp
		) {
			set.status = 400;
			return {
				success: false,
				message: "Semua checklist harus selesai sebelum ACC.",
			};
		}

		await db
			.update(pmbData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
			})
			.where(eq(pmbData.studentId, id));

		return { success: true };
	})
	.delete("/:id/pmb/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user || (user.role !== "pmb" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);

		await db
			.update(pmbData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
			})
			.where(eq(pmbData.studentId, id));

		return { success: true };
	})
	.get("/:id/pmb", async ({ params, set }) => {
		const id = Number(params.id);
		const pmb = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } },
			},
		});

		const paymentPlan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, id),
		});

		const finance = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, id),
		});

		if (!pmb) {
			set.status = 404;
			return { success: false, message: "PMB data not found" };
		}

		const { accBy: accByUser, ...rest } = pmb as any;
		return {
			success: true,
			data: { ...rest, accByUser, paymentPlan, finance },
		};
	})
	.get("/:id/pmb/documents", async ({ params }) => {
		const id = Number(params.id);
		const docs = await db.query.pmbDocuments.findMany({
			where: eq(pmbDocuments.studentId, id),
			orderBy: [desc(pmbDocuments.uploadedAt)],
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
		"/:id/pmb/upload/:documentKey",
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
				"form_received",
				"documents_complete",
				"data_inputted",
				"initial_follow_up",
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

			// Upload via FileService — tidak boleh akses filesystem langsung
			let uploadResult: { id: string } | null = null;
			try {
				uploadResult = await fileService.uploadFile({
					file,
					studentId: id,
					category: "identity",
					panel: "pmb",
					documentKey,
					uploadedBy: user.id,
				});
			} catch (err) {
				const error = err as Error;
				set.status = 400;
				return { success: false, message: error.message };
			}

			const fileUrl = `/files/${uploadResult.id}/download`;

			await db.insert(pmbDocuments).values({
				studentId: id,
				documentKey,
				fileName: file.name,
				fileUrl,
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
	.get("/:id/pmb/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.pmbDocuments.findFirst({
			where: eq(pmbDocuments.id, docId),
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
	.patch("/:id/pmb/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "pmb" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db
			.update(pmbDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(pmbDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/pmb/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "pmb" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);

		const doc = await db.query.pmbDocuments.findFirst({
			where: eq(pmbDocuments.id, docId),
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db.delete(pmbDocuments).where(eq(pmbDocuments.id, docId));
		return { success: true };
	})
	.get("/:id/pmb/payment-plan", async ({ params }) => {
		const id = parseInt(params.id, 10);
		const plan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, id),
		});
		if (!plan) return { success: false, message: "Not found" };
		return { success: true, data: plan };
	})
	.put(
		"/:id/pmb/payment-plan",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);

			const existingPlan = await db.query.pmbPaymentPlan.findFirst({
				where: eq(pmbPaymentPlan.studentId, id),
			});

			if (existingPlan) {
				await db
					.update(pmbPaymentPlan)
					.set({
						totalBiaya: body.totalBiaya,
						pendaftaranDp: body.pendaftaranDp,
						totalDp: body.totalDp,
						pembayaranAwalDp: body.pembayaranAwalDp,
						statusDp: body.statusDp,
						janjiTahap2: body.janjiTahap2 ? new Date(body.janjiTahap2) : null,
						janjiTahap2Nominal: body.janjiTahap2Nominal,
						janjiTahap2Notes: body.janjiTahap2Notes,
						janjiTahap3: body.janjiTahap3 ? new Date(body.janjiTahap3) : null,
						janjiTahap3Nominal: body.janjiTahap3Nominal,
						janjiTahap3Notes: body.janjiTahap3Notes,
						pengajuanDanaTalangan: body.pengajuanDanaTalangan,
						updatedAt: new Date(),
					})
					.where(eq(pmbPaymentPlan.studentId, id));
			} else {
				await db.insert(pmbPaymentPlan).values({
					studentId: id,
					totalBiaya: body.totalBiaya || 0,
					pendaftaranDp: body.pendaftaranDp || 0,
					totalDp: body.totalDp || 0,
					pembayaranAwalDp: body.pembayaranAwalDp || 0,
					statusDp: body.statusDp || false,
					janjiTahap2: body.janjiTahap2 ? new Date(body.janjiTahap2) : null,
					janjiTahap2Nominal: body.janjiTahap2Nominal || 0,
					janjiTahap2Notes: body.janjiTahap2Notes || null,
					janjiTahap3: body.janjiTahap3 ? new Date(body.janjiTahap3) : null,
					janjiTahap3Nominal: body.janjiTahap3Nominal || 0,
					janjiTahap3Notes: body.janjiTahap3Notes || null,
					pengajuanDanaTalangan: body.pengajuanDanaTalangan || null,
				});
			}

			if (body.totalBiaya !== undefined) {
				const existingFin = await db.query.financeData.findFirst({
					where: eq(financeData.studentId, id),
				});
				if (existingFin) {
					await db
						.update(financeData)
						.set({
							totalBiayaPendidikan: body.totalBiaya,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, id));
				} else {
					await db.insert(financeData).values({
						studentId: id,
						totalBiayaPendidikan: body.totalBiaya,
					});
				}
			}

			return { success: true };
		},
		{
			body: t.Object({
				totalBiaya: t.Optional(t.Number()),
				pendaftaranDp: t.Optional(t.Number()),
				totalDp: t.Optional(t.Number()),
				pembayaranAwalDp: t.Optional(t.Number()),
				statusDp: t.Optional(t.Boolean()),
				janjiTahap2: t.Optional(t.String()),
				janjiTahap2Nominal: t.Optional(t.Number()),
				janjiTahap2Notes: t.Optional(t.String()),
				janjiTahap3: t.Optional(t.String()),
				janjiTahap3Nominal: t.Optional(t.Number()),
				janjiTahap3Notes: t.Optional(t.String()),
				pengajuanDanaTalangan: t.Optional(t.String()),
			}),
		},
	)
	// Fee Share Recipients Routes (Table: feeShareRecipients)
	.get("/:id/pmb/fee-share-recipients", async ({ params }) => {
		const id = parseInt(params.id, 10);
		const recipients = await db.query.feeShareRecipients.findMany({
			where: eq(feeShareRecipients.studentId, id),
			orderBy: [desc(feeShareRecipients.createdAt)],
		});
		return { success: true, data: recipients };
	})
	.post(
		"/:id/pmb/fee-share-recipients",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);

			const [newRecipient] = await db
				.insert(feeShareRecipients)
				.values({
					studentId: id,
					kategori: body.kategori,
					namaReferral: body.namaReferral,
					noHp: body.noHp,
					noRekening: body.noRekening || null,
					namaBank: body.namaBank || null,
					nominalFee: body.nominalFee || 0,
					statusPencairan: body.statusPencairan || "belum_dibayarkan",
					createdBy: user.id,
				})
				.returning();

			return { success: true, data: newRecipient };
		},
		{
			body: t.Object({
				kategori: t.String(),
				namaReferral: t.String(),
				noHp: t.String(),
				noRekening: t.Optional(t.String()),
				namaBank: t.Optional(t.String()),
				nominalFee: t.Optional(t.Number()),
				statusPencairan: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/:id/pmb/fee-share-recipients/:recipientId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (
				!user ||
				(user.role !== "superadmin" &&
					user.role !== "pmb" &&
					user.role !== "finance")
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const recipientId = parseInt(params.recipientId, 10);
			const updatePayload: any = {
				updatedAt: new Date(),
			};
			if (body.kategori !== undefined) updatePayload.kategori = body.kategori;
			if (body.namaReferral !== undefined)
				updatePayload.namaReferral = body.namaReferral;
			if (body.noHp !== undefined) updatePayload.noHp = body.noHp;
			if (body.noRekening !== undefined)
				updatePayload.noRekening = body.noRekening;
			if (body.namaBank !== undefined) updatePayload.namaBank = body.namaBank;
			if (body.nominalFee !== undefined)
				updatePayload.nominalFee = body.nominalFee;
			if (body.statusPencairan !== undefined) {
				updatePayload.statusPencairan = body.statusPencairan;
				if (body.statusPencairan === "sudah_dibayarkan") {
					updatePayload.tanggalCair = body.tanggalCair
						? new Date(body.tanggalCair)
						: new Date();
				} else {
					updatePayload.tanggalCair = null;
				}
			}

			await db
				.update(feeShareRecipients)
				.set(updatePayload)
				.where(eq(feeShareRecipients.id, recipientId));

			return { success: true };
		},
		{
			body: t.Object({
				kategori: t.Optional(t.String()),
				namaReferral: t.Optional(t.String()),
				noHp: t.Optional(t.String()),
				noRekening: t.Optional(t.String()),
				namaBank: t.Optional(t.String()),
				nominalFee: t.Optional(t.Number()),
				statusPencairan: t.Optional(t.String()),
				tanggalCair: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.delete("/:id/pmb/fee-share-recipients/:recipientId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const recipientId = parseInt(params.recipientId, 10);

		const recipient = await db.query.feeShareRecipients.findFirst({
			where: eq(feeShareRecipients.id, recipientId),
		});

		if (recipient?.invoiceFileUrl) {
			// Hapus file invoice lama via FileService (berdasarkan panel+documentKey)
			// invoiceFileUrl baru berformat "/files/{id}/download"
			try {
				const fileId = recipient.invoiceFileUrl.split("/files/")[1]?.split("/")[0];
				if (fileId) {
					await fileService.deleteFile(fileId);
				}
			} catch (_) {
				// Abaikan error jika file tidak ditemukan
			}
		}

		await db
			.delete(feeShareRecipients)
			.where(eq(feeShareRecipients.id, recipientId));
		return { success: true };
	})
	.post(
		"/:id/pmb/fee-share-recipients/:recipientId/upload-invoice",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const recipientId = parseInt(params.recipientId, 10);
			const studentId = parseInt(params.id, 10);
			const file = body.file as File;

			if (!file) {
				set.status = 400;
				return { success: false, message: "File tidak ditemukan" };
			}

			// Upload invoice via FileService
			let uploadResult: { id: string } | null = null;
			try {
				uploadResult = await fileService.uploadFile({
					file,
					studentId,
					category: "finance",
					panel: "pmb",
					documentKey: `fee_invoice_${recipientId}`,
					uploadedBy: user.id,
				});
			} catch (err) {
				const error = err as Error;
				set.status = 400;
				return { success: false, message: error.message };
			}

			const filePath = `/files/${uploadResult.id}/download`;

			await db
				.update(feeShareRecipients)
				.set({
					invoiceFileUrl: filePath,
					updatedAt: new Date(),
				})
				.where(eq(feeShareRecipients.id, recipientId));

			return { success: true, message: "Invoice berhasil diupload" };
		},
		{
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.get(
		"/:id/pmb/fee-share-recipients/:recipientId/invoice",
		async ({ params, set }) => {
			const recipientId = parseInt(params.recipientId, 10);
			const recipient = await db.query.feeShareRecipients.findFirst({
				where: eq(feeShareRecipients.id, recipientId),
			});

			if (!recipient?.invoiceFileUrl) {
				set.status = 404;
				return { success: false, message: "Invoice tidak ditemukan" };
			}

			const file = Bun.file(recipient.invoiceFileUrl);
			if (!(await file.exists())) {
				set.status = 404;
				return { success: false, message: "File tidak ditemukan di server" };
			}

			return new Response(file, {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `inline; filename="invoice-${recipient.id}.pdf"`,
				},
			});
		},
	);
