import { desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	feeShareRecipients,
	financeCustomFields,
	financeData,
	pmbData,
	practicesBudgetRequests,
	practicesMaterialReports,
	students,
} from "../db/schema";
import { cacheDel, cacheInvalidatePattern } from "../lib/cache";
import { getValidUserId, hasRole } from "../lib/permissions";
import { requireRole } from "../middleware/rbac";
import { fileService } from "../modules/file/service/file.service";

async function invalidateFinanceCache(studentId?: number) {
	await Promise.all([
		cacheInvalidatePattern("cache:mahasiswa:*"),
		cacheInvalidatePattern("cache:students:*"),
		cacheInvalidatePattern("cache:dashboard:*"),
		studentId ? cacheDel(`cache:student:${studentId}`) : Promise.resolve(),
	]);
}

export const financeRouter = new Elysia({ prefix: "/finance" })
	// Dashboard: Requires finance or superadmin
	.get("/dashboard", async (context) => {
		const user = (context as any).user;
		if (!hasRole(user, "finance")) {
			context.set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const results = await db
			.select({ student: students, finance: financeData })
			.from(students)
			.leftJoin(financeData, eq(students.id, financeData.studentId))
			.orderBy(desc(students.createdAt));

		const mappedStudents = results.map(({ student, finance }) => ({
			id: student.id,
			nim: student.nim,
			name: student.name,
			program: student.program,
			status: finance?.status || "PERLU_PERHATIAN",
			isAcc: finance?.isAcc || false,
			registrationPaid: finance?.registrasiStatus || false,
			metodePembayaran: finance?.metodePembayaran || "-",
			totalBiaya: finance?.totalBiayaPendidikan || 0,
		}));

		// Pending praktik budgets
		const pendingBudgets = await db.query.practicesBudgetRequests.findMany({
			where: eq(practicesBudgetRequests.status, "menunggu"),
		});

		const kpi = {
			totalStudents: results.length,
			aman: mappedStudents.filter((s) => s.status === "AMAN").length,
			perhatian: mappedStudents.filter((s) => s.status === "PERLU_PERHATIAN")
				.length,
			tidakAman: mappedStudents.filter((s) => s.status === "TIDAK_AMAN").length,
			pendingBudgets: pendingBudgets.length,
		};

		return { success: true, data: { kpi, students: mappedStudents } };
	})

	// Get Student Finance Details (Read-only for multiple roles depending on access)
	.get(
		"/student/:studentId",
		async ({ params: { studentId }, set, user }: any) => {
			if (!hasRole(user, "finance", "pa", "magang", "crm", "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const sId = parseInt(studentId);

			const studentData = await db.query.students.findFirst({
				where: eq(students.id, sId),
			});
			if (!studentData) {
				set.status = 404;
				return { success: false, message: "Student not found" };
			}

			const finance = await db.query.financeData.findFirst({
				where: eq(financeData.studentId, sId),
			});

			const pmb = await db.query.pmbData.findFirst({
				where: eq(pmbData.studentId, sId),
			});

			const customFields = await db.query.financeCustomFields.findMany({
				where: eq(financeCustomFields.studentId, sId),
			});

			return {
				success: true,
				data: {
					student: studentData,
					finance: finance || {},
					rumahJuangAktif: pmb?.rumahJuang || false,
					customFields,
				},
			};
		},
	)

	// Tab 1: Update Registrasi
	.patch(
		"/student/:studentId/registrasi",
		async ({ params: { studentId }, body, set, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };

			const sId = parseInt(studentId);
			await db
				.insert(financeData)
				.values({
					studentId: sId,
					registrasiNominal: body.registrasiNominal,
					registrasiStatus: body.registrasiStatus,
					registrasiBuktiBayarUrl: body.registrasiBuktiBayarUrl,
					registrasiPaidDate: body.registrasiStatus ? new Date() : null,
				})
				.onConflictDoUpdate({
					target: financeData.studentId,
					set: {
						registrasiNominal: body.registrasiNominal,
						registrasiStatus: body.registrasiStatus,
						registrasiBuktiBayarUrl: body.registrasiBuktiBayarUrl,
						registrasiPaidDate: body.registrasiStatus ? new Date() : null,
						updatedAt: new Date(),
					},
				});

			await invalidateFinanceCache(sId);
			return { success: true };
		},
		{
			body: t.Object({
				registrasiNominal: t.Optional(t.Number()),
				registrasiStatus: t.Optional(t.Boolean()),
				registrasiBuktiBayarUrl: t.Optional(t.String()),
			}),
		},
	)

	// Set Metode Pembayaran
	.patch(
		"/student/:studentId/metode",
		async ({ params: { studentId }, body, user }: any) => {
			if (!user || (user.role !== "finance" && user.role !== "superadmin"))
				return { success: false, message: "Forbidden" };
			const sId = parseInt(studentId);
			await db
				.insert(financeData)
				.values({
					studentId: sId,
					metodePembayaran: body.metodePembayaran,
				})
				.onConflictDoUpdate({
					target: financeData.studentId,
					set: {
						metodePembayaran: body.metodePembayaran,
						updatedAt: new Date(),
					},
				});
			await invalidateFinanceCache(sId);
			return { success: true };
		},
		{ body: t.Object({ metodePembayaran: t.String() }) },
	)

	// Update Dana Mandiri
	.patch(
		"/student/:studentId/mandiri",
		async ({ params: { studentId }, body, user }: any) => {
			if (!user || (user.role !== "finance" && user.role !== "superadmin"))
				return { success: false, message: "Forbidden" };
			const sId = parseInt(studentId);
			await db
				.insert(financeData)
				.values({
					studentId: sId,
					...body,
				})
				.onConflictDoUpdate({
					target: financeData.studentId,
					set: { ...body, updatedAt: new Date() },
				});
			await invalidateFinanceCache(sId);
			return { success: true };
		},
	)

	// Update Dana Talangan
	.patch(
		"/student/:studentId/talangan",
		async ({ params: { studentId }, body, user }: any) => {
			if (!user || (user.role !== "finance" && user.role !== "superadmin"))
				return { success: false, message: "Forbidden" };
			const sId = parseInt(studentId);
			await db
				.insert(financeData)
				.values({
					studentId: sId,
					...body,
				})
				.onConflictDoUpdate({
					target: financeData.studentId,
					set: { ...body, updatedAt: new Date() },
				});
			await invalidateFinanceCache(sId);
			return { success: true };
		},
	)

	// Update Biaya Tambahan (TOEIC, Paspor, Rumah Juang)
	.patch(
		"/student/:studentId/biaya-tambahan",
		async ({ params: { studentId }, body, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };
			const sId = parseInt(studentId);
			await db
				.insert(financeData)
				.values({
					studentId: sId,
					...body,
				})
				.onConflictDoUpdate({
					target: financeData.studentId,
					set: { ...body, updatedAt: new Date() },
				});
			await invalidateFinanceCache(sId);
			return { success: true };
		},
	)

	// Custom Fields
	.post(
		"/student/:studentId/custom-field",
		async ({ params: { studentId }, body, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };
			const sId = parseInt(studentId);
			const safeBody = { ...body };
			if (safeBody.nominal !== undefined) {
				safeBody.nominal = Math.min(
					999999999,
					Math.max(0, Number(safeBody.nominal) || 0),
				);
			}
			await db.insert(financeCustomFields).values({
				studentId: sId,
				...safeBody,
			});
			await invalidateFinanceCache(sId);
			return { success: true };
		},
	)
	.patch(
		"/student/:studentId/custom-field/:fieldId",
		async ({ params: { studentId, fieldId }, body, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };
			const sId = parseInt(studentId);
			const safeBody = { ...body };
			if (safeBody.nominal !== undefined) {
				safeBody.nominal = Math.min(
					999999999,
					Math.max(0, Number(safeBody.nominal) || 0),
				);
			}
			await db
				.update(financeCustomFields)
				.set({ ...safeBody, updatedAt: new Date() })
				.where(eq(financeCustomFields.id, parseInt(fieldId)));
			await invalidateFinanceCache(sId);
			return { success: true };
		},
	)
	.delete(
		"/student/:studentId/custom-field/:fieldId",
		async ({ params: { studentId, fieldId }, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };
			const sId = parseInt(studentId);
			await db
				.delete(financeCustomFields)
				.where(eq(financeCustomFields.id, parseInt(fieldId)));
			await invalidateFinanceCache(sId);
			return { success: true };
		},
	)

	// Tab 2: Fee Sharing
	.post(
		"/fee-sharing/:studentId",
		async ({ params: { studentId }, body, user }: any) => {
			if (!hasRole(user, "pmb", "finance"))
				return { success: false, message: "Forbidden" };
			await db.insert(feeShareRecipients).values({
				studentId: parseInt(studentId),
				namaReferral: body.namaReferral,
				kategori: body.kategori,
				noRekening: body.noRekening,
				namaBank: body.namaBank,
				noHp: body.noHp,
				nominalFee: 0,
				statusPencairan: "belum_dibayarkan",
				createdBy: user.id,
			});
			return { success: true };
		},
		{
			body: t.Object({
				namaReferral: t.String(),
				kategori: t.String(),
				noRekening: t.String(),
				namaBank: t.String(),
				noHp: t.String(),
			}),
		},
	)

	.get(
		"/fee-sharing/:studentId",
		async ({ params: { studentId }, user }: any) => {
			if (!hasRole(user, "finance", "pmb"))
				return { success: false, message: "Forbidden" };
			const sId = parseInt(studentId, 10);
			const recipients = await db.query.feeShareRecipients.findMany({
				where: eq(feeShareRecipients.studentId, sId),
				orderBy: [desc(feeShareRecipients.createdAt)],
			});
			const fin = await db.query.financeData.findFirst({
				where: eq(financeData.studentId, sId),
			});
			return {
				success: true,
				data: {
					recipients,
					totalBiayaPromosi: fin?.totalBiayaPromosi ?? 0,
				},
			};
		},
	)
	.patch(
		"/fee-sharing/:studentId/total-promosi",
		async ({ params: { studentId }, body, set, user }: any) => {
			if (
				!user ||
				(user.role !== "finance" &&
					user.role !== "superadmin" &&
					user.role !== "pmb")
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const sId = parseInt(studentId, 10);
			const totalBiayaPromosi = Math.max(
				0,
				Number(body.totalBiayaPromosi) || 0,
			);

			const current = await db.query.financeData.findFirst({
				where: eq(financeData.studentId, sId),
			});
			if (!current) {
				await db.insert(financeData).values({
					studentId: sId,
					totalBiayaPromosi,
				});
			} else {
				await db
					.update(financeData)
					.set({
						totalBiayaPromosi,
						updatedAt: new Date(),
					})
					.where(eq(financeData.studentId, sId));
			}

			return { success: true, data: { totalBiayaPromosi } };
		},
		{
			body: t.Object({
				totalBiayaPromosi: t.Number(),
			}),
		},
	)
	.patch(
		"/fee-sharing/recipients/:recipientId",
		async ({ params: { recipientId }, body, set, user }: any) => {
			if (!hasRole(user, "finance", "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const recipientIdInt = parseInt(recipientId, 10);
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
				.where(eq(feeShareRecipients.id, recipientIdInt));

			return { success: true };
		},
	)

	// Tab 3: Anggaran Praktik & Laporan Sisa Bahan Vokasi
	.get("/anggaran-praktik", async ({ user }: any) => {
		if (!hasRole(user, "finance"))
			return { success: false, message: "Forbidden" };

		const requests = await db.query.practicesBudgetRequests.findMany({
			with: {
				course: true,
				dosen: {
					columns: {
						id: true,
						fullName: true,
						username: true,
						email: true,
						phone: true,
					},
				},
				approvedBy: {
					columns: { id: true, fullName: true, username: true },
				},
				materialReports: true,
			},
			orderBy: (practicesBudgetRequests, { desc }) => [
				desc(practicesBudgetRequests.createdAt),
			],
		});
		return { success: true, data: requests };
	})
	.patch(
		"/anggaran-praktik/:requestId/approve",
		async ({ params: { requestId }, body, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };

			const validApproverId = await getValidUserId(user);

			const updateData: any = {
				status: "disetujui",
				approvedBy: validApproverId,
				approvedAt: new Date(),
				updatedAt: new Date(),
			};
			if (body?.buktiPencairanUrl) {
				updateData.buktiPencairanUrl = body.buktiPencairanUrl;
				updateData.buktiPencairanFileName =
					body.buktiPencairanFileName || "Bukti Pencairan Anggaran";
				updateData.tanggalPencairan = body.tanggalPencairan
					? new Date(body.tanggalPencairan)
					: new Date();
			}
			await db
				.update(practicesBudgetRequests)
				.set(updateData)
				.where(eq(practicesBudgetRequests.id, parseInt(requestId)));
			return { success: true };
		},
		{
			body: t.Optional(
				t.Object({
					buktiPencairanUrl: t.Optional(t.String()),
					buktiPencairanFileName: t.Optional(t.String()),
					tanggalPencairan: t.Optional(t.String()),
				}),
			),
		},
	)
	.patch(
		"/anggaran-praktik/:requestId/bukti",
		async ({ params: { requestId }, body, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };
			await db
				.update(practicesBudgetRequests)
				.set({
					buktiPencairanUrl: body.buktiPencairanUrl || null,
					buktiPencairanFileName: body.buktiPencairanFileName || null,
					tanggalPencairan: body.tanggalPencairan
						? new Date(body.tanggalPencairan)
						: body.buktiPencairanUrl
							? new Date()
							: null,
					updatedAt: new Date(),
				})
				.where(eq(practicesBudgetRequests.id, parseInt(requestId)));
			return { success: true };
		},
		{
			body: t.Object({
				buktiPencairanUrl: t.Optional(t.Union([t.String(), t.Null()])),
				buktiPencairanFileName: t.Optional(t.Union([t.String(), t.Null()])),
				tanggalPencairan: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.post(
		"/anggaran-praktik/:requestId/upload-bukti",
		async ({ params: { requestId }, body, set, user }: any) => {
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const reqId = parseInt(requestId, 10);
			const file = body.file as File;
			if (!file || !file.name) {
				set.status = 400;
				return {
					success: false,
					message: "File bukti pencairan tidak ditemukan dalam request",
				};
			}

			const validUploaderId = await getValidUserId(user);

			let uploadResult;
			try {
				uploadResult = await fileService.uploadFile({
					file,
					category: "finance",
					panel: "finance",
					documentKey: `bukti_anggaran_praktik_${reqId}`,
					uploadedBy: validUploaderId ?? undefined,
				});
			} catch (err) {
				const error = err as Error;
				set.status = 400;
				return { success: false, message: error.message };
			}

			const filePath = `/files/${uploadResult.id}/download`;

			await db
				.update(practicesBudgetRequests)
				.set({
					buktiPencairanUrl: filePath,
					buktiPencairanFileName: uploadResult.originalName,
					tanggalPencairan: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(practicesBudgetRequests.id, reqId));

			return {
				success: true,
				message: "Bukti pencairan anggaran berhasil diunggah",
				data: {
					buktiPencairanUrl: filePath,
					buktiPencairanFileName: uploadResult.originalName,
					tanggalPencairan: new Date().toISOString(),
				},
			};
		},
		{
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.delete(
		"/anggaran-praktik/:requestId/bukti",
		async ({ params: { requestId }, set, user }: any) => {
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const reqId = parseInt(requestId, 10);
			await db
				.update(practicesBudgetRequests)
				.set({
					buktiPencairanUrl: null,
					buktiPencairanFileName: null,
					tanggalPencairan: null,
					updatedAt: new Date(),
				})
				.where(eq(practicesBudgetRequests.id, reqId));

			return {
				success: true,
				message: "Bukti pencairan anggaran berhasil dihapus",
			};
		},
	)
	.patch(
		"/anggaran-praktik/:requestId/reject",
		async ({ params: { requestId }, body, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };
			await db
				.update(practicesBudgetRequests)
				.set({
					status: "ditolak",
					catatanFinance: body.catatanFinance,
					updatedAt: new Date(),
				})
				.where(eq(practicesBudgetRequests.id, parseInt(requestId)));
			return { success: true };
		},
		{ body: t.Object({ catatanFinance: t.String() }) },
	)
	.patch(
		"/anggaran-praktik/:requestId/reset",
		async ({ params: { requestId }, user }: any) => {
			if (!hasRole(user, "finance"))
				return { success: false, message: "Forbidden" };
			await db
				.update(practicesBudgetRequests)
				.set({
					status: "menunggu",
					catatanFinance: null,
					approvedBy: null,
					approvedAt: null,
					buktiPencairanUrl: null,
					buktiPencairanFileName: null,
					tanggalPencairan: null,
					updatedAt: new Date(),
				})
				.where(eq(practicesBudgetRequests.id, parseInt(requestId)));
			return { success: true };
		},
	)

	.post(
		"/laporan-sisa-bahan",
		async ({ body, user }: any) => {
			if (!hasRole(user, "dosen", "akademik"))
				return { success: false, message: "Forbidden" };
			await db.insert(practicesMaterialReports).values({
				budgetRequestId: parseInt(body.budgetRequestId),
				dosenId: user.id,
				daftarSisaBahan: body.daftarSisaBahan,
				catatanDosen: body.catatanDosen,
				fileUrl: body.fileUrl,
				fileName: body.fileName,
			});
			return { success: true };
		},
		{
			body: t.Object({
				budgetRequestId: t.String(),
				daftarSisaBahan: t.Any(),
				catatanDosen: t.Optional(t.String()),
				fileUrl: t.Optional(t.String()),
				fileName: t.Optional(t.String()),
			}),
		},
	)

	.get("/laporan-sisa-bahan", async ({ user }: any) => {
		if (!hasRole(user, "finance"))
			return { success: false, message: "Forbidden" };
		const reports = await db.query.practicesMaterialReports.findMany({
			with: {
				dosen: {
					columns: {
						id: true,
						fullName: true,
						username: true,
						email: true,
						phone: true,
					},
				},
				budgetRequest: {
					with: {
						course: true,
					},
				},
			},
			orderBy: (practicesMaterialReports, { desc }) => [
				desc(practicesMaterialReports.createdAt),
			],
		});
		return { success: true, data: reports };
	});
