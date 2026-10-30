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
	financeSemesterInstallments,
	financeSemesters,
	financeTalanganInstallments,
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
import { cacheDel, cacheInvalidatePattern } from "../../lib/cache";
import { hasRole } from "../../lib/permissions";
import { requireRole } from "../../middleware/rbac";

export async function invalidateFinanceCaches(studentId: number) {
	await Promise.all([
		cacheDel(`cache:student:${studentId}`),
		cacheInvalidatePattern("cache:students:*"),
		cacheInvalidatePattern("cache:mahasiswa:*"),
		cacheInvalidatePattern("cache:dashboard:*"),
	]);
}

export const financeRoutes = new Elysia()
	.get("/:id/finance", async ({ params }) => {
		const id = Number(params.id);
		const finance = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } },
			},
		});
		const paymentPlan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, id),
		});
		const pmbDp =
			paymentPlan?.totalDp ||
			paymentPlan?.pendaftaranDp ||
			paymentPlan?.pembayaranAwalDp ||
			0;

		if (finance) {
			if (
				(!finance.registrasiNominal || finance.registrasiNominal === 0) &&
				pmbDp > 0
			) {
				finance.registrasiNominal = pmbDp;
			}
			// Backward compatibility: fallback Termin 3 to legacy interview fields if null
			if (
				finance.kontrakMagangStatus === null ||
				finance.kontrakMagangStatus === undefined
			) {
				finance.kontrakMagangStatus = finance.mandiriInterviewStatus ?? false;
			}
			if (!finance.kontrakMagangBuktiBayarUrl) {
				finance.kontrakMagangBuktiBayarUrl =
					finance.mandiriInterviewBuktiBayarUrl;
			}
			if (!finance.kontrakMagangPaidDate) {
				finance.kontrakMagangPaidDate = finance.mandiriInterviewPaidDate;
			}
		}
		return {
			success: true,
			data: finance,
			paymentPlan: paymentPlan || null,
			pmbDp,
		};
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

			const isFinance = hasRole(user, "finance");
			const isMagang = hasRole(user, "magang");
			const isPmb = hasRole(user, "pmb");
			const isSuper = user.role === "superadmin";

			if (!isFinance && !isMagang && !isPmb && !isSuper) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = Number(params.id);
			const updates = body as Record<string, any>;

			if (isMagang && !isFinance && !isSuper) {
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
					"kontrakMagangStatus",
					"kontrakMagangPaidDate",
					"kontrakMagangBuktiBayarUrl",
					"suhanStatus",
					"suhanPaidDate",
					"suhanBuktiBayarUrl",
					"talanganTipe",
					"talanganTotalPengajuan",
					"talanganLembaga",
					"talanganNotes",
				];
				const hasForbiddenKey = Object.keys(updates).some(
					(k) => !allowedKeys.includes(k),
				);
				if (hasForbiddenKey) {
					set.status = 403;
					return {
						success: false,
						message:
							"Tim Magang hanya dapat mengupdate data Dana Talangan & Dokumen Magang",
					};
				}
			}

			// Total Biaya Pendidikan hanya bisa di-edit oleh PMB / Superadmin
			if (user.role !== "superadmin" && user.role !== "pmb") {
				delete updates.totalBiayaPendidikan;
			}

			// Only validate if they are actively trying to set Tahap 2 as disbursed / paid
			const isDisbursingTahap2 =
				updates.t2KeberangkatanStatus === true ||
				(updates.t2KeberangkatanPaidDate &&
					typeof updates.t2KeberangkatanPaidDate === "string" &&
					updates.t2KeberangkatanPaidDate.trim() !== "");

			if (isDisbursingTahap2) {
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

			const cleanUpdates: Record<string, any> = {
				...updates,
				updatedAt: new Date(),
			};

			const intFields = [
				"totalBiayaPendidikan",
				"registrasiNominal",
				"mandiriSemesterNominalPerSem",
				"mandiriSemesterNominalTotal",
				"mandiriInterviewNominal",
				"mandiriKeberangkatanNominal",
				"t1SemesterNominalTotal",
				"t1InterviewNominal",
				"t2KeberangkatanNominal",
				"adminTalaganNominal",
				"talanganTotalPengajuan",
				"toeicNominal",
				"pasporNominal",
				"rumahJuangNominal",
			];
			for (const field of intFields) {
				if (cleanUpdates[field] !== undefined && cleanUpdates[field] !== null) {
					cleanUpdates[field] = Math.min(
						999999999,
						Math.max(0, Number(cleanUpdates[field]) || 0),
					);
				}
			}

			// Validasi batas atas: Pembagian termin & pengajuan talangan tidak boleh melebihi Total Biaya Pendidikan
			const totalBiayaPendidikan =
				cleanUpdates.totalBiayaPendidikan !== undefined
					? Number(cleanUpdates.totalBiayaPendidikan)
					: (current?.totalBiayaPendidikan ?? 0);

			if (totalBiayaPendidikan > 0) {
				const isPartitionUpdate =
					cleanUpdates.registrasiNominal !== undefined ||
					cleanUpdates.mandiriSemesterNominal !== undefined ||
					cleanUpdates.mandiriSemesterNominalTotal !== undefined ||
					cleanUpdates.mandiriInterviewNominal !== undefined ||
					cleanUpdates.mandiriKeberangkatanNominal !== undefined;

				if (isPartitionUpdate) {
					const reg =
						cleanUpdates.registrasiNominal !== undefined
							? Number(cleanUpdates.registrasiNominal)
							: (current?.registrasiNominal ?? 0);
					const sem =
						cleanUpdates.mandiriSemesterNominal !== undefined
							? Number(cleanUpdates.mandiriSemesterNominal)
							: cleanUpdates.mandiriSemesterNominalTotal !== undefined
								? Number(cleanUpdates.mandiriSemesterNominalTotal)
								: (current?.mandiriSemesterNominal ?? 0);
					const intv =
						cleanUpdates.mandiriInterviewNominal !== undefined
							? Number(cleanUpdates.mandiriInterviewNominal)
							: (current?.mandiriInterviewNominal ?? 0);
					const keb =
						cleanUpdates.mandiriKeberangkatanNominal !== undefined
							? Number(cleanUpdates.mandiriKeberangkatanNominal)
							: (current?.mandiriKeberangkatanNominal ?? 0);

					const totalPartisi = reg + sem + intv + keb;
					if (totalPartisi > totalBiayaPendidikan) {
						set.status = 400;
						return {
							success: false,
							message: `Total pembagian termin (Rp ${totalPartisi.toLocaleString("id-ID")}) melebihi Total Biaya Pendidikan yang ditetapkan PMB (Rp ${totalBiayaPendidikan.toLocaleString("id-ID")}). Kelebihan: Rp ${(totalPartisi - totalBiayaPendidikan).toLocaleString("id-ID")}.`,
						};
					}
				}

				if (
					cleanUpdates.talanganTotalPengajuan !== undefined &&
					cleanUpdates.talanganTotalPengajuan !== null &&
					Number(cleanUpdates.talanganTotalPengajuan) > totalBiayaPendidikan
				) {
					const talanganNominal = Number(cleanUpdates.talanganTotalPengajuan);
					set.status = 400;
					return {
						success: false,
						message: `Total pengajuan dana talangan (Rp ${talanganNominal.toLocaleString("id-ID")}) tidak boleh melebihi Total Biaya Pendidikan (Rp ${totalBiayaPendidikan.toLocaleString("id-ID")}).`,
					};
				}
			}

			if (cleanUpdates.registrasiPaidDate)
				cleanUpdates.registrasiPaidDate = new Date(
					cleanUpdates.registrasiPaidDate,
				);
			if (cleanUpdates.mandiriSemesterPaidDate)
				cleanUpdates.mandiriSemesterPaidDate = new Date(
					cleanUpdates.mandiriSemesterPaidDate,
				);
			if (cleanUpdates.mandiriInterviewPaidDate)
				cleanUpdates.mandiriInterviewPaidDate = new Date(
					cleanUpdates.mandiriInterviewPaidDate,
				);
			if (cleanUpdates.mandiriKeberangkatanPaidDate)
				cleanUpdates.mandiriKeberangkatanPaidDate = new Date(
					cleanUpdates.mandiriKeberangkatanPaidDate,
				);
			if (cleanUpdates.kontrakMagangPaidDate)
				cleanUpdates.kontrakMagangPaidDate = new Date(
					cleanUpdates.kontrakMagangPaidDate,
				);
			if (cleanUpdates.suhanPaidDate)
				cleanUpdates.suhanPaidDate = new Date(cleanUpdates.suhanPaidDate);
			if (cleanUpdates.toeicPaidDate)
				cleanUpdates.toeicPaidDate = new Date(cleanUpdates.toeicPaidDate);
			if (cleanUpdates.pasporPaidDate)
				cleanUpdates.pasporPaidDate = new Date(cleanUpdates.pasporPaidDate);
			if (cleanUpdates.t1SemesterPaidDate)
				cleanUpdates.t1SemesterPaidDate = new Date(
					cleanUpdates.t1SemesterPaidDate,
				);
			if (cleanUpdates.t1InterviewPaidDate)
				cleanUpdates.t1InterviewPaidDate = new Date(
					cleanUpdates.t1InterviewPaidDate,
				);
			if (cleanUpdates.t2KeberangkatanPaidDate)
				cleanUpdates.t2KeberangkatanPaidDate = new Date(
					cleanUpdates.t2KeberangkatanPaidDate,
				);

			// Backward compatibility sync for Termin 3
			if (
				cleanUpdates.kontrakMagangStatus !== undefined ||
				cleanUpdates.suhanStatus !== undefined
			) {
				if (cleanUpdates.mandiriInterviewStatus === undefined) {
					cleanUpdates.mandiriInterviewStatus = Boolean(
						cleanUpdates.kontrakMagangStatus ??
							current?.kontrakMagangStatus ??
							cleanUpdates.suhanStatus ??
							current?.suhanStatus,
					);
				}
			} else if (cleanUpdates.mandiriInterviewStatus !== undefined) {
				if (cleanUpdates.kontrakMagangStatus === undefined) {
					cleanUpdates.kontrakMagangStatus =
						cleanUpdates.mandiriInterviewStatus;
				}
			}
			if (
				cleanUpdates.kontrakMagangBuktiBayarUrl &&
				!cleanUpdates.mandiriInterviewBuktiBayarUrl
			) {
				cleanUpdates.mandiriInterviewBuktiBayarUrl =
					cleanUpdates.kontrakMagangBuktiBayarUrl;
			} else if (
				cleanUpdates.mandiriInterviewBuktiBayarUrl &&
				!cleanUpdates.kontrakMagangBuktiBayarUrl
			) {
				cleanUpdates.kontrakMagangBuktiBayarUrl =
					cleanUpdates.mandiriInterviewBuktiBayarUrl;
			}
			const merged = { ...(current || {}), ...cleanUpdates };

			// Hitung checklist keuangan dari 6 field aktual (mendukung kedua metode pembayaran)
			let checked = 0;
			const isTalangan = merged.metodePembayaran === "dana_talangan";

			if (merged.registrasiStatus) checked++;
			if (
				isTalangan
					? merged.t1SemesterStatus || merged.mandiriSemesterStatus
					: merged.mandiriSemesterStatus
			)
				checked++;
			const isT3Done = isTalangan
				? merged.t1InterviewStatus
				: Boolean(
						merged.kontrakMagangStatus ||
							merged.suhanStatus ||
							merged.mandiriInterviewStatus,
					);
			if (isT3Done) checked++;
			if (
				isTalangan
					? merged.t2KeberangkatanStatus
					: merged.mandiriKeberangkatanStatus
			)
				checked++;
			if (merged.toeicStatus) checked++;
			if (merged.pasporStatus) checked++;

			let status: "ACC" | "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
				"BUTUH_PERHATIAN";
			if (merged.isAcc) status = "ACC";
			else if (checked === 6) status = "AMAN";
			else if (checked > 0) status = "PROSES";

			cleanUpdates.status = status;

			if (merged.isAcc && checked < 6) {
				cleanUpdates.isAcc = false;
				cleanUpdates.accAt = null;
				cleanUpdates.accBy = null;
			}

			if (!current) {
				await db.insert(financeData).values({
					studentId: id,
					...cleanUpdates,
				});
			} else {
				await db
					.update(financeData)
					.set(cleanUpdates)
					.where(eq(financeData.studentId, id));
			}

			// Sinkronisasi balik ke pmbPaymentPlan jika nominal registrasi / DP diubah oleh Finance
			if (
				cleanUpdates.registrasiNominal !== undefined &&
				cleanUpdates.registrasiNominal !== null
			) {
				const plan = await db.query.pmbPaymentPlan.findFirst({
					where: eq(pmbPaymentPlan.studentId, id),
				});
				if (plan) {
					await db
						.update(pmbPaymentPlan)
						.set({
							totalDp: cleanUpdates.registrasiNominal,
							pendaftaranDp: cleanUpdates.registrasiNominal,
							statusDp:
								cleanUpdates.registrasiStatus !== undefined
									? cleanUpdates.registrasiStatus
									: plan.statusDp,
							updatedAt: new Date(),
						})
						.where(eq(pmbPaymentPlan.studentId, id));
				}
			}

			await invalidateFinanceCaches(id);

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

		if (!currentFinance || (currentFinance.totalBiayaPendidikan || 0) <= 0) {
			set.status = 400;
			return {
				success: false,
				message:
					"Total Biaya Pendidikan belum ditentukan oleh PMB (Rp 0). ACC Keuangan tidak dapat diberikan.",
			};
		}

		const isTalangan = currentFinance?.metodePembayaran === "dana_talangan";
		const isTalanganSatuTahap =
			isTalangan && currentFinance?.talanganTipe === "1_tahap";
		const isSemesterDone = isTalangan
			? isTalanganSatuTahap ||
				Boolean(
					currentFinance?.t1SemesterStatus ||
						currentFinance?.mandiriSemesterStatus,
				)
			: Boolean(currentFinance?.mandiriSemesterStatus);
		const isInterviewDone = isTalangan
			? isTalanganSatuTahap || Boolean(currentFinance?.t1InterviewStatus)
			: Boolean(currentFinance?.mandiriInterviewStatus);
		const isKeberangkatanDone = isTalangan
			? Boolean(currentFinance?.t2KeberangkatanStatus)
			: Boolean(currentFinance?.mandiriKeberangkatanStatus);

		if (
			!currentFinance?.registrasiStatus ||
			!isSemesterDone ||
			!isInterviewDone ||
			!isKeberangkatanDone ||
			!currentFinance?.toeicStatus ||
			!currentFinance?.pasporStatus
		) {
			set.status = 400;
			return {
				success: false,
				message:
					"Semua checklist keuangan (6 item) harus lengkap dan lunas sebelum ACC.",
			};
		}

		await db
			.update(financeData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
				status: "ACC",
			})
			.where(eq(financeData.studentId, id));

		await invalidateFinanceCaches(id);

		return { success: true };
	})
	.delete("/:id/finance/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!hasRole(user, "finance")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);

		const currentFinance = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, id),
		});
		let checked = 0;
		if (currentFinance) {
			const isTalangan = currentFinance.metodePembayaran === "dana_talangan";
			const isTalanganSatuTahap =
				isTalangan && currentFinance.talanganTipe === "1_tahap";
			if (currentFinance.registrasiStatus) checked++;
			if (
				isTalangan
					? isTalanganSatuTahap ||
						currentFinance.t1SemesterStatus ||
						currentFinance.mandiriSemesterStatus
					: currentFinance.mandiriSemesterStatus
			)
				checked++;
			if (
				isTalangan
					? isTalanganSatuTahap || currentFinance.t1InterviewStatus
					: currentFinance.mandiriInterviewStatus
			)
				checked++;
			if (
				isTalangan
					? currentFinance.t2KeberangkatanStatus
					: currentFinance.mandiriKeberangkatanStatus
			)
				checked++;
			if (currentFinance.toeicStatus) checked++;
			if (currentFinance.pasporStatus) checked++;
		}
		const fallbackStatus =
			checked === 6 ? "AMAN" : checked > 0 ? "PROSES" : "BUTUH_PERHATIAN";

		await db
			.update(financeData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
				status: fallbackStatus,
			})
			.where(eq(financeData.studentId, id));

		await invalidateFinanceCaches(id);

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

		if (!hasRole(user, "finance")) {
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

		if (!hasRole(user, "finance")) {
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
	})
	.get("/:id/finance/semesters", async ({ params }) => {
		const id = Number(params.id);

		let semesters = await db.query.financeSemesters.findMany({
			where: eq(financeSemesters.studentId, id),
			orderBy: (financeSemesters, { asc }) => [
				asc(financeSemesters.semesterNumber),
			],
			with: {
				installments: {
					orderBy: (installments, { asc }) => [
						asc(installments.installmentNumber),
					],
				},
			},
		});

		// Auto-seed if empty (hanya Semester 1 untuk pengaturan awal)
		if (semesters.length === 0) {
			const seedData = [
				{
					studentId: id,
					semesterNumber: 1,
					totalBilled: 0,
				},
			];
			await db.insert(financeSemesters).values(seedData);

			semesters = await db.query.financeSemesters.findMany({
				where: eq(financeSemesters.studentId, id),
				orderBy: (financeSemesters, { asc }) => [
					asc(financeSemesters.semesterNumber),
				],
				with: {
					installments: {
						orderBy: (installments, { asc }) => [
							asc(installments.installmentNumber),
						],
					},
				},
			});
		}

		return { success: true, data: semesters };
	})
	.patch(
		"/:id/finance/semesters/:semesterId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const semesterId = Number(params.semesterId);
			const updates = body as Record<string, any>;

			const current = await db.query.financeSemesters.findFirst({
				where: eq(financeSemesters.id, semesterId),
				with: { installments: true },
			});

			if (!current) {
				set.status = 404;
				return { success: false, message: "Semester not found" };
			}

			let newStatus = current.status;
			const isTalangan =
				updates.isTalangan !== undefined
					? updates.isTalangan
					: current.isTalangan;
			const totalBilled =
				updates.totalBilled !== undefined
					? Number(updates.totalBilled)
					: current.totalBilled;

			if (isTalangan) {
				newStatus = "LUNAS";
			} else {
				const totalPaid = current.installments.reduce(
					(sum, inst) => sum + inst.nominalPaid,
					0,
				);
				if (totalPaid === 0) newStatus = "BELUM_BAYAR";
				else if (totalPaid >= (totalBilled || 0)) newStatus = "LUNAS";
				else newStatus = "SEBAGIAN";
			}

			await db
				.update(financeSemesters)
				.set({
					...updates,
					status: newStatus,
					updatedAt: new Date(),
				})
				.where(eq(financeSemesters.id, semesterId));

			const studentId = Number(params.id);

			if (current.semesterNumber === 1) {
				const isLunas = newStatus === "LUNAS";
				await db
					.update(financeData)
					.set({
						mandiriSemesterStatus: isLunas,
						mandiriSemesterPaidDate: isLunas ? new Date() : null,
						updatedAt: new Date(),
					})
					.where(eq(financeData.studentId, studentId));
			}

			await invalidateFinanceCaches(studentId);

			return { success: true };
		},
		{
			body: t.Object({
				totalBilled: t.Optional(t.Number()),
				isTalangan: t.Optional(t.Boolean()),
				notes: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/:id/finance/semesters/bulk-payment",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const studentId = Number(params.id);
			const b = body as any;
			let remainingAmount = Number(b.nominalPaid);
			if (remainingAmount <= 0) {
				set.status = 400;
				return { success: false, message: "Nominal tidak valid" };
			}

			// Fetch all semesters
			const semesters = await db.query.financeSemesters.findMany({
				where: eq(financeSemesters.studentId, studentId),
				orderBy: (financeSemesters, { asc }) => [
					asc(financeSemesters.semesterNumber),
				],
				with: { installments: true },
			});

			for (const sem of semesters) {
				if (remainingAmount <= 0) break;

				const totalPaid = sem.installments.reduce(
					(sum, inst) => sum + inst.nominalPaid,
					0,
				);
				const unpaidBalance = (sem.totalBilled || 0) - totalPaid;

				if (unpaidBalance > 0) {
					const amountToApply = Math.min(unpaidBalance, remainingAmount);

					const installmentNumber = sem.installments.length + 1;

					await db.insert(financeSemesterInstallments).values({
						semesterId: sem.id,
						installmentNumber,
						nominalPaid: amountToApply,
						paymentDate: b.paymentDate ? new Date(b.paymentDate) : new Date(),
						buktiBayarUrl: b.buktiBayarUrl,
						notes: b.notes || "Pembayaran Multi-Semester",
						isTalangan: b.isTalangan ?? false,
					});

					remainingAmount -= amountToApply;

					// Recalculate status
					const newTotalPaid = totalPaid + amountToApply;
					let newStatus = sem.status;
					if (newTotalPaid === 0) newStatus = "BELUM_BAYAR";
					else if (newTotalPaid >= (sem.totalBilled || 0)) newStatus = "LUNAS";
					else newStatus = "SEBAGIAN";

					await db
						.update(financeSemesters)
						.set({
							status: newStatus,
							isTalangan: false, // Cancel talangan because it's paid
							updatedAt: new Date(),
						})
						.where(eq(financeSemesters.id, sem.id));
				}
			}

			await invalidateFinanceCaches(studentId);

			return { success: true, remainingAmount };
		},
		{
			body: t.Object({
				nominalPaid: t.Number(),
				paymentDate: t.Optional(t.Nullable(t.String())),
				buktiBayarUrl: t.Optional(t.Nullable(t.String())),
				notes: t.Optional(t.Nullable(t.String())),
				isTalangan: t.Optional(t.Boolean()),
			}),
		},
	)
	.post(
		"/:id/finance/semesters/:semesterId/installments",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const semesterId = Number(params.semesterId);
			const b = body as any;

			const current = await db.query.financeSemesters.findFirst({
				where: eq(financeSemesters.id, semesterId),
				with: { installments: true },
			});

			if (!current) {
				set.status = 404;
				return { success: false, message: "Semester not found" };
			}

			const installmentNumber = current.installments.length + 1;
			const safeNominalScheduled = Math.min(
				999999999,
				Math.max(
					0,
					Number(
						b.nominalScheduled !== undefined
							? b.nominalScheduled
							: b.nominalPaid,
					) || 0,
				),
			);
			const safeNominalPaid = Math.min(
				999999999,
				Math.max(0, Number(b.nominalPaid) || 0),
			);
			const instStatus =
				b.status || (safeNominalPaid > 0 ? "LUNAS" : "BELUM_BAYAR");
			const dueDate = b.dueDate ? new Date(b.dueDate) : null;
			const paymentDate = b.paymentDate
				? new Date(b.paymentDate)
				: instStatus === "LUNAS" && safeNominalPaid > 0
					? new Date()
					: null;

			const [inserted] = await db
				.insert(financeSemesterInstallments)
				.values({
					semesterId,
					installmentNumber,
					nominalScheduled: safeNominalScheduled,
					dueDate,
					status: instStatus,
					nominalPaid: safeNominalPaid,
					paymentDate,
					buktiBayarUrl: b.buktiBayarUrl || null,
					notes: b.notes || null,
					isTalangan: b.isTalangan ?? false,
					installmentMonth: b.installmentMonth,
					periodNotes: b.periodNotes,
				})
				.returning();

			// Recalculate status
			const newTotalPaid =
				current.installments.reduce(
					(sum, inst) => sum + (inst.nominalPaid || 0),
					0,
				) + safeNominalPaid;
			let newStatus = current.status;

			if (newTotalPaid === 0) newStatus = "BELUM_BAYAR";
			else if (
				newTotalPaid >= (current.totalBilled || 0) &&
				(current.totalBilled || 0) > 0
			)
				newStatus = "LUNAS";
			else newStatus = "SEBAGIAN";

			await db
				.update(financeSemesters)
				.set({
					status: newStatus,
					updatedAt: new Date(),
				})
				.where(eq(financeSemesters.id, semesterId));

			const studentId = Number(params.id);

			if (current.semesterNumber === 1) {
				const isLunas = newStatus === "LUNAS";
				await db
					.update(financeData)
					.set({
						mandiriSemesterStatus: isLunas,
						mandiriSemesterPaidDate: isLunas ? new Date() : null,
						updatedAt: new Date(),
					})
					.where(eq(financeData.studentId, studentId));
			}

			await invalidateFinanceCaches(studentId);

			return { success: true, data: inserted, installmentNumber };
		},
		{
			body: t.Object({
				nominalScheduled: t.Optional(t.Number()),
				dueDate: t.Optional(t.Nullable(t.String())),
				status: t.Optional(t.String()),
				nominalPaid: t.Optional(t.Number()),
				paymentDate: t.Optional(t.Nullable(t.String())),
				buktiBayarUrl: t.Optional(t.Nullable(t.String())),
				notes: t.Optional(t.Nullable(t.String())),
				isTalangan: t.Optional(t.Boolean()),
				installmentMonth: t.Optional(t.Nullable(t.String())),
				periodNotes: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.patch(
		"/:id/finance/semesters/:semesterId/installments/:installmentId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const semesterId = Number(params.semesterId);
			const installmentId = Number(params.installmentId);
			const studentId = Number(params.id);
			const updates = body as any;

			const currentSemester = await db.query.financeSemesters.findFirst({
				where: eq(financeSemesters.id, semesterId),
				with: { installments: true },
			});

			if (!currentSemester) {
				set.status = 404;
				return { success: false, message: "Semester not found" };
			}

			const inst = await db.query.financeSemesterInstallments.findFirst({
				where: and(
					eq(financeSemesterInstallments.id, installmentId),
					eq(financeSemesterInstallments.semesterId, semesterId),
				),
			});

			if (!inst) {
				set.status = 404;
				return { success: false, message: "Installment not found" };
			}

			const newNominalPaid =
				updates.nominalPaid !== undefined
					? Math.min(999999999, Math.max(0, Number(updates.nominalPaid) || 0))
					: inst.nominalPaid;
			const newStatus =
				updates.status !== undefined
					? updates.status
					: updates.nominalPaid !== undefined
						? newNominalPaid > 0
							? "LUNAS"
							: "BELUM_BAYAR"
						: inst.status;

			const newNominalScheduled =
				updates.nominalScheduled !== undefined
					? Math.min(
							999999999,
							Math.max(0, Number(updates.nominalScheduled) || 0),
						)
					: inst.nominalScheduled;

			await db
				.update(financeSemesterInstallments)
				.set({
					nominalScheduled:
						updates.nominalScheduled !== undefined
							? Math.min(
									999999999,
									Math.max(0, Number(updates.nominalScheduled) || 0),
								)
							: inst.nominalScheduled,
					dueDate:
						updates.dueDate !== undefined
							? updates.dueDate
								? new Date(updates.dueDate)
								: null
							: inst.dueDate,
					status: newStatus,
					nominalPaid: newNominalPaid,
					paymentDate:
						updates.paymentDate !== undefined
							? updates.paymentDate
								? new Date(updates.paymentDate)
								: null
							: inst.paymentDate,
					buktiBayarUrl:
						updates.buktiBayarUrl !== undefined
							? updates.buktiBayarUrl
							: inst.buktiBayarUrl,
					notes: updates.notes !== undefined ? updates.notes : inst.notes,
					isTalangan: updates.isTalangan ?? inst.isTalangan,
					installmentMonth:
						updates.installmentMonth !== undefined
							? updates.installmentMonth
							: inst.installmentMonth,
					periodNotes:
						updates.periodNotes !== undefined
							? updates.periodNotes
							: inst.periodNotes,
				})
				.where(eq(financeSemesterInstallments.id, installmentId));

			// Recalculate status
			const refreshedSemester = await db.query.financeSemesters.findFirst({
				where: eq(financeSemesters.id, semesterId),
				with: { installments: true },
			});

			if (refreshedSemester) {
				const totalPaid = refreshedSemester.installments.reduce(
					(sum, inst) => sum + inst.nominalPaid,
					0,
				);
				let newStatus = refreshedSemester.status;
				if (totalPaid === 0) newStatus = "BELUM_BAYAR";
				else if (totalPaid >= (refreshedSemester.totalBilled || 0))
					newStatus = "LUNAS";
				else newStatus = "SEBAGIAN";

				await db
					.update(financeSemesters)
					.set({
						status: newStatus,
						updatedAt: new Date(),
					})
					.where(eq(financeSemesters.id, semesterId));

				if (refreshedSemester.semesterNumber === 1) {
					const isLunas = newStatus === "LUNAS";
					await db
						.update(financeData)
						.set({
							mandiriSemesterStatus: isLunas,
							mandiriSemesterPaidDate: isLunas ? new Date() : null,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				}
			}

			await invalidateFinanceCaches(studentId);

			return { success: true };
		},
		{
			body: t.Object({
				nominalScheduled: t.Optional(t.Number()),
				dueDate: t.Optional(t.Nullable(t.String())),
				status: t.Optional(t.String()),
				nominalPaid: t.Optional(t.Number()),
				paymentDate: t.Optional(t.Nullable(t.String())),
				buktiBayarUrl: t.Optional(t.Nullable(t.String())),
				notes: t.Optional(t.Nullable(t.String())),
				isTalangan: t.Optional(t.Boolean()),
				installmentMonth: t.Optional(t.Nullable(t.String())),
				periodNotes: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.delete(
		"/:id/finance/semesters/:semesterId/installments/:installmentId",
		async (context) => {
			const { params, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const semesterId = Number(params.semesterId);
			const installmentId = Number(params.installmentId);
			const studentId = Number(params.id);

			const inst = await db.query.financeSemesterInstallments.findFirst({
				where: and(
					eq(financeSemesterInstallments.id, installmentId),
					eq(financeSemesterInstallments.semesterId, semesterId),
				),
			});

			if (!inst) {
				set.status = 404;
				return { success: false, message: "Installment not found" };
			}

			await db
				.delete(financeSemesterInstallments)
				.where(eq(financeSemesterInstallments.id, installmentId));

			// Recalculate status
			const current = await db.query.financeSemesters.findFirst({
				where: eq(financeSemesters.id, semesterId),
				with: { installments: true },
			});

			if (current && !current.isTalangan) {
				const totalPaid = current.installments.reduce(
					(sum, inst) => sum + inst.nominalPaid,
					0,
				);
				let newStatus = current.status;
				if (totalPaid === 0) newStatus = "BELUM_BAYAR";
				else if (totalPaid >= (current.totalBilled || 0)) newStatus = "LUNAS";
				else newStatus = "SEBAGIAN";

				await db
					.update(financeSemesters)
					.set({
						status: newStatus,
						updatedAt: new Date(),
					})
					.where(eq(financeSemesters.id, semesterId));

				if (current.semesterNumber === 1) {
					const isLunas = newStatus === "LUNAS";
					await db
						.update(financeData)
						.set({
							mandiriSemesterStatus: isLunas,
							mandiriSemesterPaidDate: isLunas ? new Date() : null,
							updatedAt: new Date(),
						})
						.where(eq(financeData.studentId, studentId));
				}
			}

			await invalidateFinanceCaches(studentId);

			return { success: true };
		},
	)
	.get("/:id/finance/talangan-installments", async ({ params }) => {
		const id = Number(params.id);
		const installments = await db.query.financeTalanganInstallments.findMany({
			where: eq(financeTalanganInstallments.studentId, id),
			orderBy: (financeTalanganInstallments, { asc }) => [
				asc(financeTalanganInstallments.stage),
				asc(financeTalanganInstallments.installmentNumber),
			],
		});
		return { success: true, data: installments };
	})
	.post(
		"/:id/finance/talangan-installments",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = Number(params.id);
			const b = body as any;

			const existing = await db.query.financeTalanganInstallments.findMany({
				where: and(
					eq(financeTalanganInstallments.studentId, studentId),
					eq(financeTalanganInstallments.stage, b.stage),
				),
			});

			const installmentNumber = existing.length + 1;
			const safeTalanganNominal = Math.min(
				999999999,
				Math.max(0, Number(b.nominalPaid) || 0),
			);

			const [inserted] = await db
				.insert(financeTalanganInstallments)
				.values({
					studentId,
					stage: b.stage,
					installmentNumber,
					nominalPaid: safeTalanganNominal,
					paymentDate: b.paymentDate ? new Date(b.paymentDate) : new Date(),
					buktiBayarUrl: b.buktiBayarUrl,
					notes: b.notes,
				})
				.returning();

			await invalidateFinanceCaches(studentId);

			return { success: true, data: inserted };
		},
		{
			body: t.Object({
				stage: t.String(),
				nominalPaid: t.Number(),
				paymentDate: t.Optional(t.Nullable(t.String())),
				buktiBayarUrl: t.Optional(t.Nullable(t.String())),
				notes: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.patch(
		"/:id/finance/talangan-installments/:installmentId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const installmentId = Number(params.installmentId);
			const b = body as any;

			const updateData: any = { updatedAt: new Date() };
			if (b.nominalPaid !== undefined)
				updateData.nominalPaid = Math.min(
					999999999,
					Math.max(0, Number(b.nominalPaid) || 0),
				);
			if (b.paymentDate !== undefined)
				updateData.paymentDate = b.paymentDate ? new Date(b.paymentDate) : null;
			if (b.buktiBayarUrl !== undefined)
				updateData.buktiBayarUrl = b.buktiBayarUrl;
			if (b.notes !== undefined) updateData.notes = b.notes;

			await db
				.update(financeTalanganInstallments)
				.set(updateData)
				.where(eq(financeTalanganInstallments.id, installmentId));

			const studentId = Number(params.id);
			await invalidateFinanceCaches(studentId);

			return { success: true };
		},
		{
			body: t.Object({
				nominalPaid: t.Optional(t.Number()),
				paymentDate: t.Optional(t.Nullable(t.String())),
				buktiBayarUrl: t.Optional(t.Nullable(t.String())),
				notes: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.delete(
		"/:id/finance/talangan-installments/:installmentId",
		async (context) => {
			const { params, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const installmentId = Number(params.installmentId);

			await db
				.delete(financeTalanganInstallments)
				.where(eq(financeTalanganInstallments.id, installmentId));

			const studentId = Number(params.id);
			await invalidateFinanceCaches(studentId);

			return { success: true };
		},
	);
