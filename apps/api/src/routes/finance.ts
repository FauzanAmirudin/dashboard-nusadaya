import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	feeDisbursementLogs,
	feeShareRecipients,
	financeCustomFields,
	financeData,
	financeDocuments,
	financeProjectionTargets,
	financeSemesterInstallments,
	financeSemesters,
	financeTalanganInstallments,
	pmbData,
	pmbPaymentPlan,
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

	// FIN-01: Executive Financial Dashboard Proyeksi Target & Realisasi
	.get("/projections", async ({ query, set, user }: any) => {
		if (
			!hasRole(
				user,
				"finance",
				"superadmin",
				"director",
				"evaluator",
				"akademik",
				"pa",
			)
		) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const cohortParam = query.cohort || "all";
		const yearParam = Number(query.year) || new Date().getFullYear();
		const monthParam = Number(query.month) || 0;
		const startDate = query.startDate ? new Date(query.startDate) : null;
		const endDate = query.endDate ? new Date(query.endDate) : null;
		if (endDate && !query.endDate.includes("T")) {
			endDate.setHours(23, 59, 59, 999);
		}

		const cohortNum = cohortParam === "all" ? 0 : Number(cohortParam) || 0;

		// 1. Fetch Target records from finance_projection_targets
		const targetRecords = await db
			.select()
			.from(financeProjectionTargets)
			.where(
				and(
					eq(financeProjectionTargets.year, yearParam),
					cohortNum > 0
						? eq(financeProjectionTargets.cohort, cohortNum)
						: or(
								eq(financeProjectionTargets.cohort, 0),
								eq(financeProjectionTargets.cohort, 15),
								eq(financeProjectionTargets.cohort, 16),
							),
				),
			);

		// Compute Target map per category
		let targetPmb = 0;
		let targetTaiwan = 0;
		let targetMalaysia = 0;

		if (cohortNum > 0) {
			const pmb = targetRecords.find(
				(r) => r.cohort === cohortNum && r.category === "pmb",
			);
			const tw = targetRecords.find(
				(r) => r.cohort === cohortNum && r.category === "spp_taiwan",
			);
			const my = targetRecords.find(
				(r) => r.cohort === cohortNum && r.category === "spp_malaysia",
			);
			targetPmb = pmb ? Number(pmb.targetNominal) : 0;
			targetTaiwan = tw ? Number(tw.targetNominal) : 0;
			targetMalaysia = my ? Number(my.targetNominal) : 0;
		} else {
			const globalPmb = targetRecords.find(
				(r) => r.cohort === 0 && r.category === "pmb",
			);
			const globalTw = targetRecords.find(
				(r) => r.cohort === 0 && r.category === "spp_taiwan",
			);
			const globalMy = targetRecords.find(
				(r) => r.cohort === 0 && r.category === "spp_malaysia",
			);

			if (globalPmb || globalTw || globalMy) {
				targetPmb = globalPmb ? Number(globalPmb.targetNominal) : 0;
				targetTaiwan = globalTw ? Number(globalTw.targetNominal) : 0;
				targetMalaysia = globalMy ? Number(globalMy.targetNominal) : 0;
			} else {
				targetPmb = targetRecords
					.filter((r) => r.category === "pmb")
					.reduce((acc, r) => acc + Number(r.targetNominal), 0);
				targetTaiwan = targetRecords
					.filter((r) => r.category === "spp_taiwan")
					.reduce((acc, r) => acc + Number(r.targetNominal), 0);
				targetMalaysia = targetRecords
					.filter((r) => r.category === "spp_malaysia")
					.reduce((acc, r) => acc + Number(r.targetNominal), 0);
			}
		}

		// 2. Fetch all students with financeData
		const studentsList = await db
			.select({
				id: students.id,
				name: students.name,
				cohort: students.cohort,
				program: students.program,
				subProgram: students.subProgram,
				destinationCountry: students.destinationCountry,
				createdAt: students.createdAt,
				finance: financeData,
			})
			.from(students)
			.leftJoin(financeData, eq(students.id, financeData.studentId));

		// 3. Fetch all semester installments joined with financeSemesters
		const rawInstallments = await db
			.select({
				studentId: financeSemesters.studentId,
				nominalPaid: financeSemesterInstallments.nominalPaid,
				paymentDate: financeSemesterInstallments.paymentDate,
				createdAt: financeSemesterInstallments.createdAt,
			})
			.from(financeSemesterInstallments)
			.innerJoin(
				financeSemesters,
				eq(financeSemesterInstallments.semesterId, financeSemesters.id),
			);

		const installmentsByStudent = new Map<number, typeof rawInstallments>();
		for (const inst of rawInstallments) {
			const arr = installmentsByStudent.get(inst.studentId) || [];
			arr.push(inst);
			installmentsByStudent.set(inst.studentId, arr);
		}

		// 3b. Fetch all talangan installments (Tahap 1 & Tahap 2)
		const rawTalanganInstallments = await db
			.select({
				studentId: financeTalanganInstallments.studentId,
				nominalPaid: financeTalanganInstallments.nominalPaid,
				paymentDate: financeTalanganInstallments.paymentDate,
				createdAt: financeTalanganInstallments.createdAt,
				stage: financeTalanganInstallments.stage,
			})
			.from(financeTalanganInstallments);

		const talanganByStudent = new Map<number, typeof rawTalanganInstallments>();
		for (const inst of rawTalanganInstallments) {
			const arr = talanganByStudent.get(inst.studentId) || [];
			arr.push(inst);
			talanganByStudent.set(inst.studentId, arr);
		}

		const isWithinDate = (d?: string | Date | null) => {
			if (!startDate || !endDate) return true;
			if (!d) return false;
			const dateObj = new Date(d);
			if (Number.isNaN(dateObj.getTime())) return false;
			return dateObj >= startDate && dateObj <= endDate;
		};

		// Available cohorts
		const cohortsSet = new Set<number>();
		studentsList.forEach((s) => {
			if (s.cohort) cohortsSet.add(s.cohort);
		});
		const availableCohorts = Array.from(cohortsSet).sort((a, b) => b - a);

		// Realization per category
		let realPmb = 0;
		let realTaiwan = 0;
		let realMalaysia = 0;

		// Cohort breakdown for comparison chart (Angkatan 15 vs 16, etc.)
		const cohortComparisonMap: Record<
			number,
			{
				cohort: number;
				pmb: number;
				spp_taiwan: number;
				spp_malaysia: number;
				total: number;
			}
		> = {};

		studentsList.forEach((s) => {
			const fin = s.finance;
			let pmbPaid = 0;
			let sppTaiwanPaid = 0;
			let sppMalaysiaPaid = 0;

			const dest =
				`${s.subProgram || ""} ${s.destinationCountry || ""} ${s.program || ""}`.toLowerCase();
			const isMalaysia = dest.includes("malaysia");

			const addSpp = (amount: number) => {
				if (amount <= 0) return;
				if (isMalaysia) sppMalaysiaPaid += amount;
				else sppTaiwanPaid += amount;
			};

			// 1. SPP dari cicilan semester mandiri (finance_semester_installments)
			const studentInsts = installmentsByStudent.get(s.id);
			let hasInsts = false;
			if (studentInsts && studentInsts.length > 0) {
				for (const inst of studentInsts) {
					const nom = Number(inst.nominalPaid) || 0;
					if (nom > 0) {
						const instDate = inst.paymentDate || inst.createdAt;
						if (isWithinDate(instDate)) {
							hasInsts = true;
							addSpp(nom);
						}
					}
				}
			}

			// 2. Pembayaran Cicilan Dana Talangan (finance_talangan_installments: Tahap 1 & Tahap 2)
			const studentTalanganInsts = talanganByStudent.get(s.id);
			let hasTalanganInsts = false;
			if (studentTalanganInsts && studentTalanganInsts.length > 0) {
				for (const inst of studentTalanganInsts) {
					const nom = Number(inst.nominalPaid) || 0;
					if (nom > 0) {
						const instDate = inst.paymentDate || inst.createdAt;
						if (isWithinDate(instDate)) {
							hasTalanganInsts = true;
							addSpp(nom);
						}
					}
				}
			}

			if (fin) {
				// 3. PMB / Registrasi Awal (Partisi 1)
				if (fin.registrasiStatus || (fin as any).registrationPaid) {
					const regDate =
						fin.registrasiPaidDate || fin.updatedAt || s.createdAt;
					if (isWithinDate(regDate)) {
						const nom = Number(fin.registrasiNominal) || 0;
						if (nom > 0) pmbPaid += nom;
					}
				}

				// 4. Fallback ke kolom single-payment legacy jika belum dipecah ke tabel installments
				if (!hasInsts && !hasTalanganInsts) {
					if (fin.mandiriSemesterStatus && fin.mandiriSemesterNominal) {
						const semDate =
							(fin as any).mandiriSemesterPaidDate || fin.updatedAt;
						if (isWithinDate(semDate)) {
							addSpp(Number(fin.mandiriSemesterNominal) || 0);
						}
					} else if (fin.t1SemesterNominalDibayar) {
						const semDate = (fin as any).t1SemesterPaidDate || fin.updatedAt;
						if (isWithinDate(semDate)) {
							addSpp(Number(fin.t1SemesterNominalDibayar) || 0);
						}
					}
				}

				// 5. Pembayaran Mandiri Termin 3 (Kontrak Magang / Suhan) & Termin 4 (Keberangkatan)
				if (fin.metodePembayaran === "mandiri") {
					// Termin 3: Kontrak Magang / Suhan
					if (fin.mandiriInterviewStatus || fin.kontrakMagangStatus) {
						const intDate =
							fin.mandiriInterviewPaidDate ||
							fin.kontrakMagangPaidDate ||
							fin.updatedAt;
						if (isWithinDate(intDate)) {
							addSpp(Number(fin.mandiriInterviewNominal) || 0);
						}
					}
					// Termin 4: Penempatan Magang / Keberangkatan
					if (fin.mandiriKeberangkatanStatus) {
						const kebDate = fin.mandiriKeberangkatanPaidDate || fin.updatedAt;
						if (isWithinDate(kebDate)) {
							addSpp(Number(fin.mandiriKeberangkatanNominal) || 0);
						}
					}
				}
			}

			const c = s.cohort;
			if (c) {
				if (!cohortComparisonMap[c]) {
					cohortComparisonMap[c] = {
						cohort: c,
						pmb: 0,
						spp_taiwan: 0,
						spp_malaysia: 0,
						total: 0,
					};
				}
				cohortComparisonMap[c].pmb += pmbPaid;
				cohortComparisonMap[c].spp_taiwan += sppTaiwanPaid;
				cohortComparisonMap[c].spp_malaysia += sppMalaysiaPaid;
				cohortComparisonMap[c].total +=
					pmbPaid + sppTaiwanPaid + sppMalaysiaPaid;
			}

			if (cohortNum === 0 || s.cohort === cohortNum) {
				realPmb += pmbPaid;
				realTaiwan += sppTaiwanPaid;
				realMalaysia += sppMalaysiaPaid;
			}
		});

		const computePct = (real: number, target: number) => {
			if (!target || target <= 0) return 0;
			return Number(((real / target) * 100).toFixed(1));
		};

		const totalTarget = targetPmb + targetTaiwan + targetMalaysia;
		const totalReal = realPmb + realTaiwan + realMalaysia;

		const streams = [
			{
				category: "pmb",
				label: "PMB (Registrasi Awal)",
				subLabel: "Biaya masuk / daftar ulang mahasiswa baru",
				target: targetPmb,
				realisasi: realPmb,
				percentage: computePct(realPmb, targetPmb),
				sisa: Math.max(0, targetPmb - realPmb),
				surplus: Math.max(0, realPmb - targetPmb),
			},
			{
				category: "spp_taiwan",
				label: "SPP Taiwan",
				subLabel: "Biaya kuliah semester program persiapan Taiwan",
				target: targetTaiwan,
				realisasi: realTaiwan,
				percentage: computePct(realTaiwan, targetTaiwan),
				sisa: Math.max(0, targetTaiwan - realTaiwan),
				surplus: Math.max(0, realTaiwan - targetTaiwan),
			},
			{
				category: "spp_malaysia",
				label: "SPP D3 Malaysia",
				subLabel: "Biaya kuliah semester program vokasi Malaysia",
				target: targetMalaysia,
				realisasi: realMalaysia,
				percentage: computePct(realMalaysia, targetMalaysia),
				sisa: Math.max(0, targetMalaysia - realMalaysia),
				surplus: Math.max(0, realMalaysia - targetMalaysia),
			},
		];

		const total = {
			target: totalTarget,
			realisasi: totalReal,
			percentage: computePct(totalReal, totalTarget),
			sisa: Math.max(0, totalTarget - totalReal),
			surplus: Math.max(0, totalReal - totalTarget),
		};

		const cohortBreakdown = Object.values(cohortComparisonMap).sort(
			(a, b) => b.cohort - a.cohort,
		);

		return {
			success: true,
			data: {
				cohort: cohortParam,
				year: yearParam,
				availableCohorts,
				streams,
				total,
				cohortBreakdown,
			},
		};
	})

	// Batch Update Target Proyeksi (FIN-01)
	.post(
		"/projections/batch-update",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "finance", "superadmin")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Forbidden: Hanya role finance & superadmin yang dapat mengubah target",
				};
			}

			const cohort = Number(body.cohort) || 0;
			const year = Number(body.year) || new Date().getFullYear();
			const month = Number(body.month) || 0;
			const targets = Array.isArray(body.targets) ? body.targets : [];

			for (const item of targets) {
				const cat = String(item.category);
				const nominal = Math.max(0, Number(item.targetNominal) || 0);
				const notes = item.notes ? String(item.notes) : null;

				await db
					.insert(financeProjectionTargets)
					.values({
						cohort,
						category: cat,
						year,
						month,
						targetNominal: nominal,
						notes,
						updatedBy: user.id,
						updatedAt: new Date(),
					})
					.onConflictDoUpdate({
						target: [
							financeProjectionTargets.cohort,
							financeProjectionTargets.category,
							financeProjectionTargets.year,
							financeProjectionTargets.month,
						],
						set: {
							targetNominal: nominal,
							notes,
							updatedBy: user.id,
							updatedAt: new Date(),
						},
					});
			}

			await invalidateFinanceCache();

			return {
				success: true,
				message: "Pagu target proyeksi berhasil diperbarui",
			};
		},
		{
			body: t.Object({
				cohort: t.Number(),
				year: t.Number(),
				month: t.Optional(t.Number()),
				targets: t.Array(
					t.Object({
						category: t.String(),
						targetNominal: t.Number(),
						notes: t.Optional(t.String()),
					}),
				),
			}),
		},
	)

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

			const [
				finance,
				pmb,
				paymentPlan,
				customFields,
				semesters,
				documents,
				talanganInstallments,
			] = await Promise.all([
				db.query.financeData.findFirst({
					where: eq(financeData.studentId, sId),
				}),
				db.query.pmbData.findFirst({
					where: eq(pmbData.studentId, sId),
				}),
				db.query.pmbPaymentPlan.findFirst({
					where: eq(pmbPaymentPlan.studentId, sId),
				}),
				db.query.financeCustomFields.findMany({
					where: eq(financeCustomFields.studentId, sId),
				}),
				db.query.financeSemesters.findMany({
					where: eq(financeSemesters.studentId, sId),
					with: { installments: true },
					orderBy: (financeSemesters, { asc }) => [
						asc(financeSemesters.semesterNumber),
					],
				}),
				db.query.financeDocuments.findMany({
					where: eq(financeDocuments.studentId, sId),
					orderBy: (financeDocuments, { desc }) => [
						desc(financeDocuments.uploadedAt),
					],
				}),
				db.query.financeTalanganInstallments.findMany({
					where: eq(financeTalanganInstallments.studentId, sId),
					orderBy: (financeTalanganInstallments, { asc }) => [
						asc(financeTalanganInstallments.installmentNumber),
					],
				}),
			]);

			const isTalangan = finance?.metodePembayaran === "dana_talangan";
			const rawFinance = (finance || {}) as Record<string, any>;

			const pmbDp =
				paymentPlan?.totalDp ||
				paymentPlan?.pendaftaranDp ||
				paymentPlan?.pembayaranAwalDp ||
				0;

			const effectiveRegistrasiNominal =
				rawFinance.registrasiNominal && rawFinance.registrasiNominal > 0
					? rawFinance.registrasiNominal
					: pmbDp;

			// 1. Dokumen Registrasi Awal
			const regDoc = documents.find(
				(d) =>
					d.documentKey === "registrasi" ||
					d.documentKey === "bukti_registrasi",
			);
			const registrasiBuktiBayarUrl =
				rawFinance.registrasiBuktiBayarUrl || regDoc?.fileUrl || null;

			// 2. SPP Semester 1 (Cicilan Bulanan Mandiri / Talangan)
			const sem1 = semesters.find((s) => s.semesterNumber === 1);
			const sem1Installments = sem1?.installments || [];
			const sem1TotalPaid = sem1Installments.reduce(
				(sum, inst) => sum + (inst.nominalPaid || 0),
				0,
			);
			const sem1TotalScheduled = sem1Installments.reduce(
				(sum, inst) =>
					sum +
					(Number(
						inst.nominalScheduled !== undefined &&
							inst.nominalScheduled !== null
							? inst.nominalScheduled
							: inst.nominalPaid,
					) || 0),
				0,
			);
			const sem1NominalPagu =
				(isTalangan
					? rawFinance.t1SemesterNominalTotal
					: rawFinance.mandiriSemesterNominal) ||
				sem1?.totalBilled ||
				0;

			let sem1StatusString: "LUNAS" | "SEBAGIAN" | "BELUM_BAYAR" =
				"BELUM_BAYAR";
			if (
				(sem1NominalPagu > 0 && sem1TotalPaid >= sem1NominalPagu) ||
				(isTalangan
					? Boolean(rawFinance.t1SemesterStatus)
					: Boolean(rawFinance.mandiriSemesterStatus))
			) {
				sem1StatusString = "LUNAS";
			} else if (sem1TotalPaid > 0) {
				sem1StatusString = "SEBAGIAN";
			}

			const paidInstWithDoc = [...sem1Installments]
				.reverse()
				.find((inst) => (inst.nominalPaid || 0) > 0 && inst.buktiBayarUrl);
			const anyInstWithDoc = [...sem1Installments]
				.reverse()
				.find((inst) => inst.buktiBayarUrl);
			const sem1Doc = documents.find(
				(d) =>
					d.documentKey.startsWith("semester_1") ||
					d.documentKey === "spp_semester_1" ||
					d.documentKey === "semester_1_inst",
			);
			const sem1BuktiBayarUrl =
				paidInstWithDoc?.buktiBayarUrl ||
				anyInstWithDoc?.buktiBayarUrl ||
				rawFinance.mandiriSemesterBuktiBayarUrl ||
				sem1Doc?.fileUrl ||
				null;

			// 3. Kontrak Magang & Suhan
			const kontrakDoc = documents.find(
				(d) => d.documentKey === "kontrak_magang",
			);
			const suhanDoc = documents.find((d) => d.documentKey === "suhan");
			const kontrakBuktiBayarUrl =
				rawFinance.kontrakMagangBuktiBayarUrl ??
				rawFinance.mandiriInterviewBuktiBayarUrl ??
				kontrakDoc?.fileUrl ??
				null;
			const suhanBuktiBayarUrl =
				rawFinance.suhanBuktiBayarUrl ?? suhanDoc?.fileUrl ?? null;
			const termin3BuktiBayarUrl =
				kontrakBuktiBayarUrl ?? suhanBuktiBayarUrl ?? null;

			const isKontrakPaid = Boolean(
				rawFinance.kontrakMagangStatus ?? rawFinance.mandiriInterviewStatus,
			);
			const isSuhanPaid = Boolean(rawFinance.suhanStatus);
			const isTermin3Lunas = isTalangan
				? Boolean(rawFinance.t1InterviewStatus)
				: isKontrakPaid && isSuhanPaid;

			// 4. Penempatan Magang / Keberangkatan
			const kebDoc = documents.find(
				(d) =>
					d.documentKey === "keberangkatan" ||
					d.documentKey === "visa_tiket" ||
					d.documentKey === "mandiri_keberangkatan",
			);
			const termin4BuktiBayarUrl = isTalangan
				? (rawFinance.t2KeberangkatanBuktiBayarUrl ?? kebDoc?.fileUrl ?? null)
				: (rawFinance.mandiriKeberangkatanBuktiBayarUrl ??
					kebDoc?.fileUrl ??
					null);

			const safeFinance = {
				...rawFinance,
				registrasiNominal: effectiveRegistrasiNominal,
				registrasiBuktiBayarUrl,
				mandiriSemesterNominal: sem1NominalPagu,
				mandiriSemesterStatus: sem1StatusString === "LUNAS",
				mandiriSemesterStatusString: sem1StatusString,
				mandiriSemesterPaidTotal: sem1TotalPaid,
				kontrakMagangStatus: isKontrakPaid,
				kontrakMagangBuktiBayarUrl: kontrakBuktiBayarUrl,
				kontrakMagangPaidDate:
					rawFinance.kontrakMagangPaidDate ??
					rawFinance.mandiriInterviewPaidDate ??
					null,
				suhanStatus: isSuhanPaid,
				suhanBuktiBayarUrl,
				suhanPaidDate: rawFinance.suhanPaidDate ?? null,
				mandiriKeberangkatanBuktiBayarUrl: termin4BuktiBayarUrl,
				termin1: {
					name: "Registrasi Awal",
					nominal: effectiveRegistrasiNominal,
					status: Boolean(rawFinance.registrasiStatus || paymentPlan?.statusDp),
					paidDate: rawFinance.registrasiPaidDate ?? null,
					buktiBayarUrl: registrasiBuktiBayarUrl,
				},
				termin2: {
					name: "Pembayaran SPP Semester 1",
					nominal: sem1NominalPagu,
					totalPaid: sem1TotalPaid,
					totalScheduled: sem1TotalScheduled,
					status: sem1StatusString === "LUNAS",
					statusString: sem1StatusString,
					paidDate: isTalangan
						? (rawFinance.t1SemesterPaidDate ?? null)
						: (rawFinance.mandiriSemesterPaidDate ?? null),
					buktiBayarUrl: sem1BuktiBayarUrl,
					installments: sem1Installments.map((inst) => ({
						id: inst.id,
						installmentNumber: inst.installmentNumber,
						installmentMonth: inst.installmentMonth,
						nominalScheduled: inst.nominalScheduled,
						nominalPaid: inst.nominalPaid,
						status: inst.status,
						dueDate: inst.dueDate,
						paymentDate: inst.paymentDate,
						buktiBayarUrl: inst.buktiBayarUrl,
						notes: inst.notes,
					})),
				},
				termin3: {
					name: "Kontrak Magang / Suhan",
					nominal: isTalangan
						? (rawFinance.t1InterviewNominal ?? 0)
						: (rawFinance.mandiriInterviewNominal ?? 0),
					status: isTalangan
						? Boolean(rawFinance.t1InterviewStatus)
						: Boolean(
								rawFinance.kontrakMagangStatus ||
									rawFinance.suhanStatus ||
									rawFinance.mandiriInterviewStatus,
							),
					isLunas: isTermin3Lunas,
					paidDate: isTalangan
						? (rawFinance.t1InterviewPaidDate ?? null)
						: (rawFinance.kontrakMagangPaidDate ??
							rawFinance.mandiriInterviewPaidDate ??
							null),
					kontrakStatus: isKontrakPaid,
					suhanStatus: isSuhanPaid,
					buktiBayarUrl: termin3BuktiBayarUrl,
					kontrakBuktiBayarUrl,
					suhanBuktiBayarUrl,
				},
				termin4: {
					name: "Penempatan Magang Taiwan / Keberangkatan",
					nominal: isTalangan
						? (rawFinance.t2KeberangkatanNominal ?? 0)
						: (rawFinance.mandiriKeberangkatanNominal ?? 0),
					status: isTalangan
						? Boolean(rawFinance.t2KeberangkatanStatus)
						: Boolean(rawFinance.mandiriKeberangkatanStatus),
					paidDate: isTalangan
						? (rawFinance.t2KeberangkatanPaidDate ?? null)
						: (rawFinance.mandiriKeberangkatanPaidDate ?? null),
					buktiBayarUrl: termin4BuktiBayarUrl,
				},
			};

			return {
				success: true,
				data: {
					student: studentData,
					finance: safeFinance,
					paymentPlan: paymentPlan || null,
					pmbDp,
					rumahJuangAktif: pmb?.rumahJuang || false,
					customFields,
					semesters,
					documents,
					talanganInstallments,
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
			const updates = { ...(body as Record<string, unknown>) };
			if (
				updates.kontrakMagangStatus !== undefined ||
				updates.suhanStatus !== undefined
			) {
				if (updates.mandiriInterviewStatus === undefined) {
					updates.mandiriInterviewStatus = Boolean(
						updates.kontrakMagangStatus || updates.suhanStatus,
					);
				}
			} else if (updates.mandiriInterviewStatus !== undefined) {
				if (updates.kontrakMagangStatus === undefined) {
					updates.kontrakMagangStatus = updates.mandiriInterviewStatus;
				}
			}
			if (
				updates.kontrakMagangBuktiBayarUrl &&
				!updates.mandiriInterviewBuktiBayarUrl
			) {
				updates.mandiriInterviewBuktiBayarUrl =
					updates.kontrakMagangBuktiBayarUrl;
			} else if (
				updates.mandiriInterviewBuktiBayarUrl &&
				!updates.kontrakMagangBuktiBayarUrl
			) {
				updates.kontrakMagangBuktiBayarUrl =
					updates.mandiriInterviewBuktiBayarUrl;
			}
			await db
				.insert(financeData)
				.values({
					studentId: sId,
					...updates,
				})
				.onConflictDoUpdate({
					target: financeData.studentId,
					set: { ...updates, updatedAt: new Date() },
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
				nominalFee: body.nominalFee || 0,
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
				nominalFee: t.Optional(t.Number()),
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
				with: {
					disbursementLogs: {
						orderBy: [desc(feeDisbursementLogs.terminNumber)],
						with: {
							disbursedByUser: {
								columns: { id: true, fullName: true, username: true },
							},
						},
					},
				},
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
				} else if (body.statusPencairan === "belum_dibayarkan") {
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
	// Segmen 13: Upload Bukti Transfer Bank Pencairan Termin Fee Sharing
	.post(
		"/fee-sharing/recipients/:recipientId/upload-proof",
		async ({ params: { recipientId }, body, set, user }: any) => {
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya divisi Finance yang memiliki wewenang mengunggah bukti transfer fee sharing",
				};
			}
			const recipientIdInt = parseInt(recipientId, 10);
			const file = body.file as File;
			if (!file || !file.name) {
				set.status = 400;
				return {
					success: false,
					message: "File bukti transfer tidak ditemukan dalam request",
				};
			}

			const validUploaderId = await getValidUserId(user);

			let uploadResult;
			try {
				uploadResult = await fileService.uploadFile({
					file,
					category: "finance",
					panel: "finance",
					documentKey: `fee_transfer_${recipientIdInt}_${Date.now()}`,
					uploadedBy: validUploaderId ?? undefined,
				});
			} catch (err: any) {
				set.status = 400;
				return {
					success: false,
					message: err?.message || "Gagal mengunggah berkas",
				};
			}

			const filePath = `/files/${uploadResult.id}/download`;

			return {
				success: true,
				message: "Bukti transfer bank berhasil diunggah",
				data: {
					transferProofUrl: filePath,
					transferProofFileName: uploadResult.originalName,
				},
			};
		},
		{
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	// Segmen 13: Pencairan Fee Sharing Bertahap (Multi-Termin) oleh Finance
	.post(
		"/fee-sharing/recipients/:recipientId/disburse",
		async ({ params: { recipientId }, body, set, user }: any) => {
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya divisi Finance yang memiliki wewenang mencairkan fee sharing",
				};
			}
			const recipientIdInt = parseInt(recipientId, 10);
			const recipient = await db.query.feeShareRecipients.findFirst({
				where: eq(feeShareRecipients.id, recipientIdInt),
			});
			if (!recipient) {
				set.status = 404;
				return {
					success: false,
					message: "Data penerima fee sharing tidak ditemukan",
				};
			}

			const amount = Math.max(0, Number(body.amount) || 0);
			if (amount <= 0) {
				set.status = 400;
				return {
					success: false,
					message: "Nominal pencairan fee sharing harus lebih dari Rp 0",
				};
			}

			const existingLogs = await db.query.feeDisbursementLogs.findMany({
				where: eq(feeDisbursementLogs.recipientId, recipientIdInt),
			});

			const nextTermin = body.terminNumber
				? Number(body.terminNumber)
				: existingLogs.length + 1;
			const disbursedDate = body.disbursedAt
				? new Date(body.disbursedAt)
				: new Date();
			const validUserId = await getValidUserId(user);

			const [newLog] = await db
				.insert(feeDisbursementLogs)
				.values({
					recipientId: recipientIdInt,
					studentId: recipient.studentId,
					terminNumber: nextTermin,
					amount,
					transferProofUrl: body.transferProofUrl || null,
					transferProofFileName:
						body.transferProofFileName ||
						(body.transferProofUrl ? "Bukti_Transfer_Fee.pdf" : null),
					disbursedAt: disbursedDate,
					disbursedBy: validUserId,
					notes: body.notes || null,
				})
				.returning();

			// Recalculate total disbursed
			const allLogs = [...existingLogs, newLog];
			const totalDisbursed = allLogs.reduce(
				(sum, l) => sum + (l.amount || 0),
				0,
			);

			let newStatus = "belum_dibayarkan";
			const targetNominal = recipient.nominalFee || 0;
			if (totalDisbursed >= targetNominal && targetNominal > 0) {
				newStatus = "sudah_dibayarkan";
			} else if (totalDisbursed > 0) {
				newStatus = "cair_sebagian";
			}

			await db
				.update(feeShareRecipients)
				.set({
					statusPencairan: newStatus,
					tanggalCair: disbursedDate,
					updatedAt: new Date(),
				})
				.where(eq(feeShareRecipients.id, recipientIdInt));

			await invalidateFinanceCache(recipient.studentId);

			return {
				success: true,
				message: `Pencairan Termin ${nextTermin} sebesar Rp ${amount.toLocaleString("id-ID")} berhasil dicatat`,
				data: {
					log: newLog,
					statusPencairan: newStatus,
					totalDisbursed,
				},
			};
		},
		{
			body: t.Object({
				amount: t.Number(),
				terminNumber: t.Optional(t.Number()),
				disbursedAt: t.Optional(t.String()),
				notes: t.Optional(t.String()),
				transferProofUrl: t.Optional(t.String()),
				transferProofFileName: t.Optional(t.String()),
			}),
		},
	)
	// Segmen 13: Hapus / Batalkan Pencairan Termin Tertentu
	.delete(
		"/fee-sharing/disbursements/:logId",
		async ({ params: { logId }, set, user }: any) => {
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya divisi Finance yang memiliki wewenang membatalkan pencairan fee",
				};
			}
			const lId = parseInt(logId, 10);
			const log = await db.query.feeDisbursementLogs.findFirst({
				where: eq(feeDisbursementLogs.id, lId),
			});
			if (!log) {
				set.status = 404;
				return {
					success: false,
					message: "Riwayat pencairan tidak ditemukan",
				};
			}

			const recipientId = log.recipientId;
			const studentId = log.studentId;

			await db
				.delete(feeDisbursementLogs)
				.where(eq(feeDisbursementLogs.id, lId));

			// Recalculate recipient status
			const remainingLogs = await db.query.feeDisbursementLogs.findMany({
				where: eq(feeDisbursementLogs.recipientId, recipientId),
				orderBy: [desc(feeDisbursementLogs.disbursedAt)],
			});

			const recipient = await db.query.feeShareRecipients.findFirst({
				where: eq(feeShareRecipients.id, recipientId),
			});

			const totalDisbursed = remainingLogs.reduce(
				(sum, l) => sum + (l.amount || 0),
				0,
			);

			let newStatus = "belum_dibayarkan";
			const targetNominal = recipient?.nominalFee || 0;
			if (totalDisbursed >= targetNominal && targetNominal > 0) {
				newStatus = "sudah_dibayarkan";
			} else if (totalDisbursed > 0) {
				newStatus = "cair_sebagian";
			}

			await db
				.update(feeShareRecipients)
				.set({
					statusPencairan: newStatus,
					tanggalCair: remainingLogs[0]?.disbursedAt || null,
					updatedAt: new Date(),
				})
				.where(eq(feeShareRecipients.id, recipientId));

			await invalidateFinanceCache(studentId);

			return {
				success: true,
				message: "Riwayat pencairan termin berhasil dihapus",
				data: { statusPencairan: newStatus, totalDisbursed },
			};
		},
	)
	// Segmen 13: Edit / Update Pencairan Termin Tertentu
	.put(
		"/fee-sharing/disbursements/:logId",
		async ({ params: { logId }, body, set, user }: any) => {
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return {
					success: false,
					message:
						"Hanya divisi Finance yang memiliki wewenang mengedit pencairan fee",
				};
			}
			const lId = parseInt(logId, 10);
			const log = await db.query.feeDisbursementLogs.findFirst({
				where: eq(feeDisbursementLogs.id, lId),
			});
			if (!log) {
				set.status = 404;
				return {
					success: false,
					message: "Riwayat pencairan tidak ditemukan",
				};
			}

			const amount =
				body.amount !== undefined
					? Math.max(0, Number(body.amount) || 0)
					: log.amount;
			if (amount <= 0) {
				set.status = 400;
				return {
					success: false,
					message: "Nominal pencairan fee sharing harus lebih dari Rp 0",
				};
			}

			const updateValues: any = {
				amount,
				updatedAt: new Date(),
			};
			if (body.terminNumber !== undefined)
				updateValues.terminNumber = Number(body.terminNumber);
			if (body.disbursedAt !== undefined)
				updateValues.disbursedAt = new Date(body.disbursedAt);
			if (body.notes !== undefined) updateValues.notes = body.notes;
			if (body.transferProofUrl !== undefined)
				updateValues.transferProofUrl = body.transferProofUrl;
			if (body.transferProofFileName !== undefined)
				updateValues.transferProofFileName = body.transferProofFileName;

			await db
				.update(feeDisbursementLogs)
				.set(updateValues)
				.where(eq(feeDisbursementLogs.id, lId));

			// Recalculate recipient status
			const remainingLogs = await db.query.feeDisbursementLogs.findMany({
				where: eq(feeDisbursementLogs.recipientId, log.recipientId),
				orderBy: [desc(feeDisbursementLogs.disbursedAt)],
			});

			const recipient = await db.query.feeShareRecipients.findFirst({
				where: eq(feeShareRecipients.id, log.recipientId),
			});

			const totalDisbursed = remainingLogs.reduce(
				(sum, l) => sum + (l.amount || 0),
				0,
			);

			let newStatus = "belum_dibayarkan";
			const targetNominal = recipient?.nominalFee || 0;
			if (totalDisbursed >= targetNominal && targetNominal > 0) {
				newStatus = "sudah_dibayarkan";
			} else if (totalDisbursed > 0) {
				newStatus = "cair_sebagian";
			}

			await db
				.update(feeShareRecipients)
				.set({
					statusPencairan: newStatus,
					tanggalCair: remainingLogs[0]?.disbursedAt || null,
					updatedAt: new Date(),
				})
				.where(eq(feeShareRecipients.id, log.recipientId));

			await invalidateFinanceCache(log.studentId);

			return {
				success: true,
				message: "Data pencairan termin berhasil diperbarui",
				data: { statusPencairan: newStatus, totalDisbursed },
			};
		},
		{
			body: t.Object({
				amount: t.Optional(t.Number()),
				terminNumber: t.Optional(t.Number()),
				disbursedAt: t.Optional(t.String()),
				notes: t.Optional(t.String()),
				transferProofUrl: t.Optional(t.String()),
				transferProofFileName: t.Optional(t.String()),
			}),
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
		async ({ params: { requestId }, body, set, user }: any) => {
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const reqId = parseInt(requestId, 10);
			const existing = await db.query.practicesBudgetRequests.findFirst({
				where: eq(practicesBudgetRequests.id, reqId),
			});
			if (!existing) {
				set.status = 404;
				return {
					success: false,
					message: "Pengajuan anggaran tidak ditemukan",
				};
			}

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
				.where(eq(practicesBudgetRequests.id, reqId));
			return {
				success: true,
				message: "Pengajuan anggaran berhasil disetujui",
			};
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
		async ({ params: { requestId }, body, set, user }: any) => {
			if (!hasRole(user, "finance")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const reason = (body?.catatanFinance || "").trim();
			if (!reason) {
				set.status = 400;
				return {
					success: false,
					message: "Alasan penolakan tertulis wajib diisi",
				};
			}
			const reqId = parseInt(requestId, 10);
			const existing = await db.query.practicesBudgetRequests.findFirst({
				where: eq(practicesBudgetRequests.id, reqId),
			});
			if (!existing) {
				set.status = 404;
				return {
					success: false,
					message: "Pengajuan anggaran tidak ditemukan",
				};
			}
			await db
				.update(practicesBudgetRequests)
				.set({
					status: "ditolak",
					catatanFinance: reason,
					updatedAt: new Date(),
				})
				.where(eq(practicesBudgetRequests.id, reqId));
			return {
				success: true,
				message: "Pengajuan anggaran berhasil ditolak",
			};
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
