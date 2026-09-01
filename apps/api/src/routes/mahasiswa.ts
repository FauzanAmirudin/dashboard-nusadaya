import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	academicData,
	academicDocuments,
	counselingLogs,
	courseGrades,
	courses,
	crmData,
	crmDocuments,
	crmLogs,
	departureAssessmentNotes,
	departureAssessments,
	entrepreneurshipRecords,
	finalDecision,
	financeCustomFields,
	financeData,
	financeDocuments,
	financeSemesterInstallments,
	financeSemesters,
	financeTalanganInstallments,
	internshipData,
	internshipDocuments,
	overseasProgramChecklists,
	paData,
	paDocuments,
	paHafalanSessions,
	paInterviewLogs,
	paStudentNotes,
	paTripartiteLogs,
	pmbData,
	pmbDocuments,
	pmbPaymentPlan,
	students,
	users,
	vocabLogs,
} from "../db/schema";
import {
	cacheDel,
	cacheGet,
	cacheInvalidatePattern,
	cacheSet,
} from "../lib/cache";
import { fileService } from "../modules/file/service/file.service";

function computeFinanceProgress(
	finance: any,
	semesters: any[] = [],
	talanganInstallments: any[] = [],
) {
	if (!finance) {
		return {
			isAcc: false,
			accAt: null,
			status: "PERLU_PERHATIAN",
			completedPartitions: 0,
			totalPartitions: 4,
			progressPercent: 0,
			totalBiayaPendidikan: 0,
			totalTerbayar: 0,
			sisaTagihan: 0,
			nominalPercent: 0,
			metodePembayaran: "mandiri",
			items: [],
			completedItems: 0,
			totalItems: 4,
			registrasiStatus: false,
			semesterStatus: false,
			interviewStatus: false,
			keberangkatanStatus: false,
			adminTalaganStatus: false,
		};
	}

	const isTalangan = finance.metodePembayaran === "dana_talangan";
	const totalBiayaPendidikan = finance.totalBiayaPendidikan || 0;
	const registrasiStatus = Boolean(finance.registrasiStatus);

	let items: Array<{
		key: string;
		label: string;
		desc: string;
		status: boolean;
		paidDate?: string | Date | null;
		nominal: number;
		paidNominal?: number;
		badge: string;
	}> = [];

	let totalTerbayar = 0;
	if (registrasiStatus) {
		totalTerbayar += finance.registrasiNominal || 0;
	}

	if (isTalangan) {
		const t1PaidFromInstallments = (talanganInstallments || [])
			.filter((ti: any) => ti.stage === "tahap_1")
			.reduce((sum: number, ti: any) => sum + (ti.nominalPaid || 0), 0);
		const t1Paid = Math.max(
			finance.t1SemesterNominalDibayar || 0,
			t1PaidFromInstallments,
		);

		const t2PaidFromInstallments = (talanganInstallments || [])
			.filter((ti: any) => ti.stage === "tahap_2")
			.reduce((sum: number, ti: any) => sum + (ti.nominalPaid || 0), 0);
		const t2Paid = t2PaidFromInstallments;

		const t1SemesterNominal = finance.t1SemesterNominalTotal || 0;
		const t1InterviewNominal = finance.t1InterviewNominal || 0;
		const totalTahap1Nominal = t1SemesterNominal + t1InterviewNominal;
		const totalTahap2Nominal = finance.t2KeberangkatanNominal || 0;

		const adminTalaganStatus = Boolean(finance.adminTalaganStatus);
		const t1Status = Boolean(
			finance.t1InterviewStatus ||
				finance.t1SemesterStatus ||
				(totalTahap1Nominal > 0 && t1Paid >= totalTahap1Nominal),
		);
		const t2Status = Boolean(
			finance.t2KeberangkatanStatus ||
				(totalTahap2Nominal > 0 && t2Paid >= totalTahap2Nominal),
		);

		if (adminTalaganStatus) {
			totalTerbayar += finance.adminTalaganNominal || 0;
		}

		if (t1Status) {
			totalTerbayar += Math.max(totalTahap1Nominal, t1Paid);
		} else {
			totalTerbayar += t1Paid;
		}

		if (t2Status) {
			totalTerbayar += Math.max(totalTahap2Nominal, t2Paid);
		} else {
			totalTerbayar += t2Paid;
		}

		items = [
			{
				key: "registrasi",
				label: "1. Registrasi Awal",
				desc: "Pembayaran biaya registrasi awal masuk kuliah",
				status: registrasiStatus,
				paidDate: finance.registrasiPaidDate,
				nominal: finance.registrasiNominal || 0,
				paidNominal: registrasiStatus ? finance.registrasiNominal || 0 : 0,
				badge: "Partisi 1",
			},
			{
				key: "admin_talangan",
				label: "2. Administrasi Talangan",
				desc: "Biaya administrasi perjanjian notaris & lembaga keuangan",
				status: adminTalaganStatus,
				paidDate: finance.adminTalaganPaidDate,
				nominal: finance.adminTalaganNominal || 0,
				paidNominal: adminTalaganStatus ? finance.adminTalaganNominal || 0 : 0,
				badge: "Biaya Admin",
			},
			{
				key: "tahap_1",
				label: "3. Dana Talangan Tahap 1",
				desc: "Plafon biaya perkuliahan semester & interview magang ditalangi",
				status: t1Status,
				paidDate: finance.t1InterviewPaidDate || finance.t1SemesterPaidDate,
				nominal: totalTahap1Nominal,
				paidNominal: t1Paid,
				badge: "Talangan Tahap 1",
			},
			{
				key: "tahap_2",
				label: "4. Dana Talangan Tahap 2",
				desc: "Plafon biaya visa, tiket penerbangan & keberangkatan magang",
				status: t2Status,
				paidDate: finance.t2KeberangkatanPaidDate,
				nominal: totalTahap2Nominal,
				paidNominal: t2Paid,
				badge: "Talangan Tahap 2",
			},
		];
	} else {
		// Mandiri: 4 Partisi
		const semestersLunasCount = (semesters || []).filter(
			(s: any) =>
				((s.installments || []).reduce(
					(sum: number, i: any) => sum + (i.nominalPaid || 0),
					0,
				) >= (s.totalBilled || 0) &&
					(s.totalBilled || 0) > 0) ||
				s.isTalangan,
		).length;

		let semPaid = 0;
		for (const sem of semesters || []) {
			for (const ins of sem.installments || []) {
				semPaid += ins.nominalPaid || 0;
			}
		}

		const semesterStatus = Boolean(
			finance.mandiriSemesterStatus || semestersLunasCount === 6,
		);
		const interviewStatus = Boolean(finance.mandiriInterviewStatus);
		const keberangkatanStatus = Boolean(finance.mandiriKeberangkatanStatus);

		if (semesterStatus) {
			totalTerbayar += Math.max(finance.mandiriSemesterNominal || 0, semPaid);
		} else {
			totalTerbayar += semPaid;
		}

		if (interviewStatus) {
			totalTerbayar += finance.mandiriInterviewNominal || 0;
		}

		if (keberangkatanStatus) {
			totalTerbayar += finance.mandiriKeberangkatanNominal || 0;
		}

		items = [
			{
				key: "registrasi",
				label: "1. Registrasi Awal",
				desc: "Pembayaran biaya registrasi awal masuk kuliah",
				status: registrasiStatus,
				paidDate: finance.registrasiPaidDate,
				nominal: finance.registrasiNominal || 0,
				paidNominal: registrasiStatus ? finance.registrasiNominal || 0 : 0,
				badge: "Partisi 1",
			},
			{
				key: "semester",
				label: "2. Perkuliahan 6 Semester",
				desc: "Biaya perkuliahan semester 1 s.d semester 6",
				status: semesterStatus,
				paidDate: finance.mandiriSemesterPaidDate,
				nominal: finance.mandiriSemesterNominal || 0,
				paidNominal: semPaid,
				badge: `${semestersLunasCount}/6 Semester`,
			},
			{
				key: "interview",
				label: "3. Biaya Interview Magang",
				desc: "Biaya pelaksanaan wawancara kerja magang luar negeri",
				status: interviewStatus,
				paidDate: finance.mandiriInterviewPaidDate,
				nominal: finance.mandiriInterviewNominal || 0,
				paidNominal: interviewStatus ? finance.mandiriInterviewNominal || 0 : 0,
				badge: "Partisi 3",
			},
			{
				key: "keberangkatan",
				label: "4. Biaya Keberangkatan",
				desc: "Biaya visa kerja, asuransi & tiket penerbangan ke negara tujuan",
				status: keberangkatanStatus,
				paidDate: finance.mandiriKeberangkatanPaidDate,
				nominal: finance.mandiriKeberangkatanNominal || 0,
				paidNominal: keberangkatanStatus
					? finance.mandiriKeberangkatanNominal || 0
					: 0,
				badge: "Partisi 4",
			},
		];
	}

	const completedItems = items.filter((i) => i.status).length;
	const totalItems = items.length;
	const progressPercent =
		totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

	const sisaTagihan = Math.max(0, totalBiayaPendidikan - totalTerbayar);
	const nominalPercent =
		totalBiayaPendidikan > 0
			? Math.min(100, Math.round((totalTerbayar / totalBiayaPendidikan) * 100))
			: 0;

	return {
		isAcc: Boolean(finance.isAcc),
		accAt: finance.accAt,
		status: finance.status || "PERLU_PERHATIAN",
		completedPartitions: completedItems,
		totalPartitions: totalItems,
		completedItems,
		totalItems,
		progressPercent,
		totalBiayaPendidikan,
		totalTerbayar,
		sisaTagihan,
		nominalPercent,
		metodePembayaran: finance.metodePembayaran || "mandiri",
		items,
		registrasiStatus,
		semesterStatus: isTalangan
			? Boolean(finance.t1SemesterStatus)
			: Boolean(finance.mandiriSemesterStatus),
		interviewStatus: isTalangan
			? Boolean(finance.t1InterviewStatus)
			: Boolean(finance.mandiriInterviewStatus),
		keberangkatanStatus: isTalangan
			? Boolean(finance.t2KeberangkatanStatus)
			: Boolean(finance.mandiriKeberangkatanStatus),
		adminTalaganStatus: Boolean(finance.adminTalaganStatus),
	};
}

export const mahasiswaRouter = new Elysia({ prefix: "/mahasiswa" })
	.derive(async ({ request, jwt, cookie: { auth } }: any) => {
		const authHeader = request.headers.get("authorization");
		let profile: any = null;
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.slice(7);
			profile = await jwt.verify(token);
		} else if (auth?.value) {
			profile = await jwt.verify(auth.value as string);
		}

		if (profile?.role !== "mahasiswa") {
			return { user: null };
		}

		return { user: profile as { id: number; username: string; role: string } };
	})
	.get("/me", async ({ user, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const cacheKey = `cache:mahasiswa:${user.id}:me`;
		const cached = await cacheGet<any>(cacheKey);
		if (cached) {
			return { success: true, data: cached };
		}

		const studentData = await db.query.students.findFirst({
			where: eq(students.studentUserId, user.id),
			with: {
				pa: {
					columns: {
						fullName: true,
					},
				},
			},
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Data mahasiswa tidak ditemukan" };
		}

		await cacheSet(cacheKey, studentData, 300);

		return { success: true, data: studentData };
	})
	.get("/progress", async ({ user, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const cacheKey = `cache:mahasiswa:${user.id}:progress`;
		const cached = await cacheGet<any>(cacheKey);
		if (cached) {
			return { success: true, data: cached };
		}

		const studentData = await db.query.students.findFirst({
			where: eq(students.studentUserId, user.id),
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Data mahasiswa tidak ditemukan" };
		}

		const [
			pmb,
			crm,
			finance,
			academic,
			pa,
			internship,
			decision,
			hafalanSessions,
		] = await Promise.all([
			db.query.pmbData.findFirst({
				where: eq(pmbData.studentId, studentData.id),
			}),
			db.query.crmData.findFirst({
				where: eq(crmData.studentId, studentData.id),
			}),
			db.query.financeData.findFirst({
				where: eq(financeData.studentId, studentData.id),
			}),
			db.query.academicData.findFirst({
				where: eq(academicData.studentId, studentData.id),
			}),
			db.query.paData.findFirst({
				where: eq(paData.studentId, studentData.id),
			}),
			db.query.internshipData.findFirst({
				where: eq(internshipData.studentId, studentData.id),
			}),
			db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, studentData.id),
			}),
			db.query.paHafalanSessions.findMany({
				where: eq(paHafalanSessions.studentId, studentData.id),
			}),
		]);

		// Hitung Progress PMB (14 item: 4 utama + 10 dokumen fisik)
		const pmbChecklist = [
			pmb?.formReceived,
			pmb?.documentsComplete,
			pmb?.dataInputted,
			pmb?.initialFollowUp,
			pmb?.docKtp,
			pmb?.docKk,
			pmb?.docCv,
			pmb?.docIjazah,
			pmb?.docTranskrip,
			pmb?.docPassportDepan,
			pmb?.docPassportVisa,
			pmb?.docSkbm,
			pmb?.docMcu,
			pmb?.docSertifikasiBahasa,
		];
		const pmbCompleted = pmbChecklist.filter(Boolean).length;
		const pmbTotal = 14;
		const pmbPercent = Math.round((pmbCompleted / pmbTotal) * 100);

		// Hitung Progress CRM (8 kriteria)
		const crmChecklist = [
			crm?.isMonitoringParent,
			crm?.isMonitoringIndustry,
			crm?.isVocabComplete,
			crm?.practiceAttendance,
			crm?.isOdsReport,
			crm?.odsDocumentation,
			crm?.isPrammagangReport,
			crm?.isPrammagangDocumentation,
		];
		const crmCompleted = crmChecklist.filter(Boolean).length;
		const crmTotal = 8;
		const crmPercent = Math.round((crmCompleted / crmTotal) * 100);
		const crmPresent = crm?.practiceDaysPresent ?? 0;
		const crmDaysTotal = crm?.practiceDaysTotal ?? 0;
		const crmAttendancePercent =
			crmDaysTotal > 0
				? Math.min(Math.round((crmPresent / crmDaysTotal) * 100), 100)
				: 0;

		// Hitung Progress Finance (Partisi & Realisasi Pembayaran)
		const financeProgress = computeFinanceProgress(finance);

		// Hitung Progress Akademik (6 checklist dasar + GPA + Kehadiran)
		const academicChecklist = [
			academic?.pddiktiInput,
			academic?.utsPassed,
			academic?.uasPassed,
			academic?.assignmentsCompleted,
			academic?.attitudeIndicator,
			academic?.academicCommunication,
		];
		const academicCompleted = academicChecklist.filter(Boolean).length;
		const academicTotal = 6;
		const academicPercent = Math.round(
			(academicCompleted / academicTotal) * 100,
		);
		const academicPresent = academic?.attendancePresent ?? 0;
		const academicTotalDays = academic?.attendanceTotal ?? 0;
		const academicAttendancePercent =
			academicTotalDays > 0
				? Math.min(Math.round((academicPresent / academicTotalDays) * 100), 100)
				: 0;

		// Hitung Progress PA (3 checklist + Hafalan Vocab)
		const paChecklist = [
			pa?.counselingDone,
			pa?.mentalStable,
			pa?.disciplineGood,
		];
		const paCompleted = paChecklist.filter(Boolean).length;
		const paChecklistPercent = Math.round((paCompleted / 3) * 100);
		const totalVocabCount = (hafalanSessions || []).reduce(
			(sum: number, h: any) => sum + (h.vocabCount || 0),
			0,
		);
		const vocabTarget = pa?.vocabTarget || 500;
		const vocabPercent = Math.min(
			Math.round((totalVocabCount / vocabTarget) * 100),
			100,
		);

		// Hitung Progress Magang (11 Pra-Paspor + 12 Tahapan Magang)
		const praPasporChecklist = [
			internship?.praPasporPasFoto,
			internship?.praPasporKtm,
			internship?.praPasporKtp,
			internship?.praPasporKk,
			internship?.praPasporAktaKelahiran,
			internship?.praPasporSl21,
			internship?.praPasporSkma,
			internship?.praPasporRekomendasiDisdik,
			internship?.praPasporGapYear,
			internship?.praPasporPddikti,
			internship?.praPasporCv,
		];
		const praPasporCompleted = praPasporChecklist.filter(Boolean).length;
		const praPasporPercent = Math.round((praPasporCompleted / 11) * 100);

		const mainMagangChecklist = [
			internship?.passportReady,
			internship?.interviewReady,
			internship?.loaReady,
			internship?.lolReady,
			internship?.moaReady,
			internship?.contractReady,
			internship?.mcuReady,
			internship?.visaReady,
			internship?.ticketReady,
			internship?.pdtReady,
			internship?.dokumentasiReady,
			internship?.agenReady,
		];
		const mainMagangCompleted = mainMagangChecklist.filter(Boolean).length;
		const mainMagangPercent = Math.round((mainMagangCompleted / 12) * 100);

		const responseData = {
			pmb: {
				isAcc: pmb?.isAcc ?? false,
				status: pmb?.status,
				completedItems: pmbCompleted,
				totalItems: pmbTotal,
				progressPercent: pmbPercent,
			},
			crm: {
				isAcc: crm?.isAcc ?? false,
				status: crm?.status,
				completedItems: crmCompleted,
				totalItems: crmTotal,
				progressPercent: crmPercent,
				practiceAttendancePercent: crmAttendancePercent,
				practiceDaysPresent: crmPresent,
				practiceDaysTotal: crmDaysTotal,
			},
			finance: {
				isAcc: financeProgress.isAcc,
				status: financeProgress.status,
				progressPercent: financeProgress.progressPercent,
				completedPartitions: financeProgress.completedPartitions,
				totalPartitions: financeProgress.totalPartitions,
				totalBiayaPendidikan: financeProgress.totalBiayaPendidikan,
				totalTerbayar: financeProgress.totalTerbayar,
				sisaTagihan: financeProgress.sisaTagihan,
				nominalPercent: financeProgress.nominalPercent,
				metodePembayaran: financeProgress.metodePembayaran,
				registrasiStatus: financeProgress.registrasiStatus,
				semesterStatus: financeProgress.semesterStatus,
				interviewStatus: financeProgress.interviewStatus,
				keberangkatanStatus: financeProgress.keberangkatanStatus,
			},
			academic: {
				isAcc: academic?.isAcc ?? false,
				status: academic?.status,
				completedItems: academicCompleted,
				totalItems: academicTotal,
				progressPercent: academicPercent,
				gpa: academic?.gpa ? academic.gpa / 100 : 0,
				creditsCompleted: academic?.creditsCompleted ?? 0,
				attendancePercent: academicAttendancePercent,
			},
			pa: {
				isAcc: pa?.isAcc ?? false,
				status: pa?.status,
				completedItems: paCompleted,
				totalItems: 3,
				checklistPercent: paChecklistPercent,
				totalVocab: totalVocabCount,
				vocabTarget: vocabTarget,
				vocabPercent: vocabPercent,
			},
			internship: {
				isAcc: internship?.isAcc ?? false,
				status: internship?.status,
				praPasporCompleted,
				praPasporTotal: 11,
				praPasporPercent,
				mainCompleted: mainMagangCompleted,
				mainTotal: 12,
				mainPercent: mainMagangPercent,
			},
			finalDecision: {
				evaluatorDecision: decision?.evaluatorDecision,
				isApprovedByDirector: decision?.isApprovedByDirector,
				decidedAt: decision?.decidedAt,
				skDocumentUrl: decision?.skDocumentUrl,
			},
			evaluator: {
				evaluatorDecision: decision?.evaluatorDecision,
				isApprovedByDirector: decision?.isApprovedByDirector,
				decidedAt: decision?.decidedAt,
				skDocumentUrl: decision?.skDocumentUrl,
			},
		};

		await cacheSet(cacheKey, responseData, 30);

		return {
			success: true,
			data: responseData,
		};
	})
	.patch(
		"/profil",
		async ({ user, body, set }: any) => {
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			const {
				phone,
				parentName,
				nik,
				nisn,
				birthPlace,
				birthDate,
				gender,
				address,
				schoolOrigin,
				parentJob,
				parentIncome,
				parentPhone,
			} = body;

			const studentData = await db.query.students.findFirst({
				where: eq(students.studentUserId, user.id),
			});

			if (!studentData) {
				set.status = 404;
				return { success: false, message: "Data mahasiswa tidak ditemukan" };
			}

			await db
				.update(students)
				.set({
					phone,
					parentName,
					birthPlace,
					birthDate: birthDate ? new Date(birthDate) : undefined,
					gender,
					schoolOrigin,
					parentJob,
					parentIncome,
					parentPhone,
					updatedAt: new Date(),
				})
				.where(eq(students.id, studentData.id));

			await Promise.all([
				cacheInvalidatePattern(`cache:mahasiswa:${user.id}:*`),
				cacheDel(`cache:student:${studentData.id}`),
				cacheInvalidatePattern("cache:students:list:*"),
			]);

			return { success: true, message: "Profil berhasil diperbarui" };
		},
		{
			body: t.Object({
				phone: t.Optional(t.String()),
				parentName: t.Optional(t.String()),
				birthPlace: t.Optional(t.String()),
				birthDate: t.Optional(t.String()),
				gender: t.Optional(t.String()),
				schoolOrigin: t.Optional(t.String()),
				parentJob: t.Optional(t.String()),
				parentIncome: t.Optional(t.String()),
				parentPhone: t.Optional(t.String()),
			}),
		},
	)
	.post("/profil/photo", async ({ user, body, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const file = body.file as File;
		if (!file) {
			set.status = 400;
			return { success: false, message: "Tidak ada file yang diupload" };
		}

		const studentData = await db.query.students.findFirst({
			where: eq(students.studentUserId, user.id),
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Data mahasiswa tidak ditemukan" };
		}

		// Upload foto profil mahasiswa via FileService
		let fileUrl: string;
		try {
			const uploadResult = await fileService.uploadFile({
				file,
				studentId: studentData.id,
				category: "profile",
				panel: "mahasiswa",
				documentKey: "profile_photo",
				uploadedBy: user.id,
				visibility: "public",
			});
			fileUrl = `/files/${uploadResult.id}/download`;
		} catch (err) {
			const error = err as Error;
			set.status = 400;
			return { success: false, message: error.message };
		}

		await db
			.update(students)
			.set({ profilePhotoUrl: fileUrl, updatedAt: new Date() })
			.where(eq(students.id, studentData.id));

		await db
			.update(users)
			.set({ profilePhotoUrl: fileUrl, updatedAt: new Date() })
			.where(eq(users.id, user.id));

		await Promise.all([
			cacheInvalidatePattern(`cache:mahasiswa:*`),
			cacheDel(`cache:student:${studentData.id}`),
			cacheInvalidatePattern("cache:students:*"),
			cacheInvalidatePattern("cache:dashboard:*"),
		]);

		return {
			success: true,
			message: "Foto profil berhasil diperbarui",
			url: fileUrl,
		};
	})
	.get("/panel/:panelKey", async ({ user, params, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const panelKey = params.panelKey;
		const cacheKey = `cache:mahasiswa:${user.id}:panel:${panelKey}`;
		const cached = await cacheGet<any>(cacheKey);
		if (cached) {
			return { success: true, data: cached };
		}

		const studentData = await db.query.students.findFirst({
			where: eq(students.studentUserId, user.id),
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Data mahasiswa tidak ditemukan" };
		}

		let data: any = null;

		if (panelKey === "pmb") {
			const [pmb, paymentPlan, documents] = await Promise.all([
				db.query.pmbData.findFirst({
					where: eq(pmbData.studentId, studentData.id),
				}),
				db.query.pmbPaymentPlan.findFirst({
					where: eq(pmbPaymentPlan.studentId, studentData.id),
				}),
				db.query.pmbDocuments.findMany({
					where: eq(pmbDocuments.studentId, studentData.id),
				}),
			]);

			data = {
				// 4 Checklist Utama
				formReceived: pmb?.formReceived ?? false,
				documentsComplete: pmb?.documentsComplete ?? false,
				dataInputted: pmb?.dataInputted ?? false,
				initialFollowUp: pmb?.initialFollowUp ?? false,
				isGapYear: pmb?.isGapYear ?? false,
				notes: pmb?.notes ?? null,

				// 10 Checklist Dokumen Fisik Tambahan
				docKtp: pmb?.docKtp ?? false,
				docKk: pmb?.docKk ?? false,
				docCv: pmb?.docCv ?? false,
				docIjazah: pmb?.docIjazah ?? false,
				docTranskrip: pmb?.docTranskrip ?? false,
				docPassportDepan: pmb?.docPassportDepan ?? false,
				docPassportVisa: pmb?.docPassportVisa ?? false,
				docSkbm: pmb?.docSkbm ?? false,
				docMcu: pmb?.docMcu ?? false,
				docSertifikasiBahasa: pmb?.docSertifikasiBahasa ?? false,

				// Fasilitas Rumah Juang
				rumahJuang: pmb?.rumahJuang ?? false,

				status: pmb?.status,
				isAcc: pmb?.isAcc,
				accAt: pmb?.accAt,

				// Akuisisi
				rekomendasi: pmb?.rekomendasi,
				timVisit: pmb?.timVisit,
				timSosialisasi: pmb?.timSosialisasi,
				roReferral: pmb?.roReferral,
				mitraSponsor: pmb?.mitraSponsor,
				koordinator: pmb?.koordinator,

				// Keuangan
				paymentPlan: paymentPlan
					? {
							totalBiaya: paymentPlan.totalBiaya,
							pendaftaranDp: paymentPlan.pendaftaranDp,
							totalDp: paymentPlan.totalDp,
							pembayaranAwalDp: paymentPlan.pembayaranAwalDp,
							statusDp: paymentPlan.statusDp,
							janjiTahap2: paymentPlan.janjiTahap2,
							janjiTahap2Nominal: paymentPlan.janjiTahap2Nominal,
							janjiTahap2Notes: paymentPlan.janjiTahap2Notes,
							janjiTahap3: paymentPlan.janjiTahap3,
							janjiTahap3Nominal: paymentPlan.janjiTahap3Nominal,
							janjiTahap3Notes: paymentPlan.janjiTahap3Notes,
							pengajuanDanaTalangan: paymentPlan.pengajuanDanaTalangan,
						}
					: null,

				// Dokumen Digital PMB (Fee sharing sepenuhnya dirahasiakan)
				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					fileUrl: d.fileUrl,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),
			};
		} else if (panelKey === "crm") {
			const [crm, documents, logs] = await Promise.all([
				db.query.crmData.findFirst({
					where: eq(crmData.studentId, studentData.id),
				}),
				db.query.crmDocuments.findMany({
					where: eq(crmDocuments.studentId, studentData.id),
				}),
				db.query.crmLogs.findMany({
					where: eq(crmLogs.studentId, studentData.id),
					orderBy: (crmLogs, { desc }) => [desc(crmLogs.createdAt)],
					limit: 10,
				}),
			]);

			data = {
				// Old & New Checklist
				odsActive: crm?.odsActive ?? false,
				studentMonitoring: crm?.studentMonitoring ?? false,
				parentFollowUp: crm?.parentFollowUp ?? false,
				isMonitoringParent: crm?.isMonitoringParent ?? false,
				isMonitoringIndustry: crm?.isMonitoringIndustry ?? false,
				isVocabComplete: crm?.isVocabComplete ?? false,
				hasStudyPermit: crm?.hasStudyPermit ?? false,
				isOdsReport: crm?.isOdsReport ?? false,
				odsDocumentation: crm?.odsDocumentation ?? false,
				isPrammagangReport: crm?.isPrammagangReport ?? false,
				isPrammagangDocumentation: crm?.isPrammagangDocumentation ?? false,

				// ODS & Pra-magang detail
				odsDetails: crm?.odsDetails ?? [],
				pramagangStartDate: crm?.pramagangStartDate,
				pramagangEndDate: crm?.pramagangEndDate,
				pramagangIndustry: crm?.pramagangIndustry,
				pramagangVideoLink: crm?.pramagangVideoLink,

				// Kehadiran & Kasus
				practiceAttendance: crm?.practiceAttendance ?? false,
				practiceDaysPresent: crm?.practiceDaysPresent ?? 0,
				practiceDaysTotal: crm?.practiceDaysTotal ?? 0,
				hasActiveCase: crm?.hasActiveCase ?? false,
				caseNotes: crm?.caseNotes,

				// Komunikasi Logs Ringkas
				logs: logs.map((l) => ({
					id: l.id,
					logType: l.logType,
					topic: l.topic,
					media: l.media,
					location: l.location,
					createdAt: l.createdAt,
				})),

				// Dokumen CRM
				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					fileUrl: d.fileUrl,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),

				status: crm?.status,
				isAcc: crm?.isAcc,
				accAt: crm?.accAt,
			};
		} else if (panelKey === "finance") {
			const [
				finance,
				documents,
				semesters,
				talanganInstallments,
				customFields,
			] = await Promise.all([
				db.query.financeData.findFirst({
					where: eq(financeData.studentId, studentData.id),
				}),
				db.query.financeDocuments.findMany({
					where: eq(financeDocuments.studentId, studentData.id),
				}),
				db.query.financeSemesters.findMany({
					where: eq(financeSemesters.studentId, studentData.id),
					with: {
						installments: true,
					},
					orderBy: (financeSemesters, { asc }) => [
						asc(financeSemesters.semesterNumber),
					],
				}),
				db.query.financeTalanganInstallments.findMany({
					where: eq(financeTalanganInstallments.studentId, studentData.id),
					orderBy: (financeTalanganInstallments, { asc }) => [
						asc(financeTalanganInstallments.installmentNumber),
					],
				}),
				db.query.financeCustomFields.findMany({
					where: eq(financeCustomFields.studentId, studentData.id),
				}),
			]);

			data = {
				// Plafon & Partisi Biaya Pendidikan
				totalBiayaPendidikan: finance?.totalBiayaPendidikan ?? 0,
				metodePembayaran: finance?.metodePembayaran ?? "mandiri",

				// 1. Registrasi Awal
				registrasiNominal: finance?.registrasiNominal ?? 0,
				registrasiStatus: finance?.registrasiStatus ?? false,
				registrasiPaidDate: finance?.registrasiPaidDate,
				registrasiBuktiBayarUrl: finance?.registrasiBuktiBayarUrl,

				// 2. Perkuliahan (Dana Mandiri / 6 Semester)
				mandiriSemesterNominal: finance?.mandiriSemesterNominal ?? 0,
				mandiriSemesterStatus: finance?.mandiriSemesterStatus ?? false,
				mandiriSemesterBuktiBayarUrl: finance?.mandiriSemesterBuktiBayarUrl,

				// 3. Interview Magang
				mandiriInterviewNominal: finance?.mandiriInterviewNominal ?? 0,
				mandiriInterviewStatus: finance?.mandiriInterviewStatus ?? false,
				mandiriInterviewBuktiBayarUrl: finance?.mandiriInterviewBuktiBayarUrl,
				t1InterviewNominal: finance?.t1InterviewNominal ?? 0,
				t1InterviewStatus: finance?.t1InterviewStatus ?? false,
				t1InterviewBuktiBayarUrl: finance?.t1InterviewBuktiBayarUrl,

				// 4. Keberangkatan
				mandiriKeberangkatanNominal: finance?.mandiriKeberangkatanNominal ?? 0,
				mandiriKeberangkatanStatus:
					finance?.mandiriKeberangkatanStatus ?? false,
				mandiriKeberangkatanBuktiBayarUrl:
					finance?.mandiriKeberangkatanBuktiBayarUrl,
				t2KeberangkatanNominal: finance?.t2KeberangkatanNominal ?? 0,
				t2KeberangkatanStatus: finance?.t2KeberangkatanStatus ?? false,
				t2KeberangkatanBuktiBayarUrl: finance?.t2KeberangkatanBuktiBayarUrl,

				// Dana Talangan Tahap 1 (Akumulasi Semester + Interview)
				t1SemesterNominalTotal: finance?.t1SemesterNominalTotal ?? 0,
				t1SemesterNominalDibayar: finance?.t1SemesterNominalDibayar ?? 0,
				t1SemesterNominalTalangan: finance?.t1SemesterNominalTalangan ?? 0,
				t1SemesterJumlahCicilan: finance?.t1SemesterJumlahCicilan ?? 0,
				t1SemesterCicilanKe: finance?.t1SemesterCicilanKe ?? 0,
				t1SemesterStatus: finance?.t1SemesterStatus ?? false,

				// Biaya Administrasi Talangan
				adminTalaganNominal: finance?.adminTalaganNominal ?? 0,
				adminTalaganMetode: finance?.adminTalaganMetode ?? "transfer",
				adminTalaganBankTujuan: finance?.adminTalaganBankTujuan,
				adminTalaganBuktiBayarUrl: finance?.adminTalaganBuktiBayarUrl,
				adminTalaganStatus: finance?.adminTalaganStatus ?? false,

				// Biaya Tambahan Standar
				toeicNominal: finance?.toeicNominal ?? 0,
				toeicStatus: finance?.toeicStatus ?? false,
				toeicBuktiBayarUrl: finance?.toeicBuktiBayarUrl,
				pasporNominal: finance?.pasporNominal ?? 0,
				pasporStatus: finance?.pasporStatus ?? false,
				pasporBuktiBayarUrl: finance?.pasporBuktiBayarUrl,
				rumahJuangAktif: finance?.rumahJuangAktif ?? false,
				rumahJuangNominal: finance?.rumahJuangNominal ?? 0,
				rumahJuangStatus: finance?.rumahJuangStatus ?? false,
				rumahJuangBuktiBayarUrl: finance?.rumahJuangBuktiBayarUrl,

				// Rincian 6 Semester & Cicilan
				semesters: semesters.map((s) => ({
					id: s.id,
					semesterNumber: s.semesterNumber,
					totalBilled: s.totalBilled ?? 0,
					isTalangan: s.isTalangan ?? false,
					status: s.status ?? "BELUM_BAYAR",
					notes: s.notes,
					installments: (s.installments || []).map((ins) => ({
						id: ins.id,
						installmentNumber: ins.installmentNumber,
						nominalPaid: ins.nominalPaid,
						paymentDate: ins.paymentDate,
						buktiBayarUrl: ins.buktiBayarUrl,
						notes: ins.notes,
					})),
				})),

				// Cicilan Talangan Tahap 1 & 2
				talanganInstallments: talanganInstallments.map((ti) => ({
					id: ti.id,
					stage: ti.stage,
					installmentNumber: ti.installmentNumber,
					nominalPaid: ti.nominalPaid,
					paymentDate: ti.paymentDate,
					buktiBayarUrl: ti.buktiBayarUrl,
					notes: ti.notes,
				})),

				// Custom Fields Biaya Tambahan
				customFields: customFields.map((cf) => ({
					id: cf.id,
					fieldType: cf.fieldType,
					label: cf.label,
					nominal: cf.nominal,
					status: cf.status,
					notes: cf.notes,
					buktiBayarUrl: cf.buktiBayarUrl,
				})),

				// Dokumen
				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					fileUrl: d.fileUrl,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),

				// Real-time Progress & Financial Summary
				progress: computeFinanceProgress(
					finance,
					semesters,
					talanganInstallments,
				),

				status: finance?.status,
				isAcc: finance?.isAcc,
				accAt: finance?.accAt,
			};
		} else if (panelKey === "akademik") {
			const [academic, documents, overseasChecklist, grades, assessment] =
				await Promise.all([
					db.query.academicData.findFirst({
						where: eq(academicData.studentId, studentData.id),
					}),
					db.query.academicDocuments.findMany({
						where: eq(academicDocuments.studentId, studentData.id),
					}),
					db.query.overseasProgramChecklists.findFirst({
						where: eq(overseasProgramChecklists.studentId, studentData.id),
					}),
					db.query.courseGrades.findMany({
						where: eq(courseGrades.studentId, studentData.id),
					}),
					db.query.departureAssessments.findFirst({
						where: eq(departureAssessments.studentId, studentData.id),
					}),
				]);

			data = {
				gpa: academic?.gpa ?? 0,
				creditsCompleted: academic?.creditsCompleted ?? 0,
				pddiktiInput: academic?.pddiktiInput ?? false,
				attendanceTotal: academic?.attendanceTotal ?? 0,
				attendancePresent: academic?.attendancePresent ?? 0,
				attendanceAlphaNote: academic?.attendanceAlphaNote,
				utsPassed: academic?.utsPassed ?? false,
				uasPassed: academic?.uasPassed ?? false,
				attitudeIndicator: academic?.attitudeIndicator ?? false,
				assignmentsCompleted: academic?.assignmentsCompleted ?? false,
				academicCommunication: academic?.academicCommunication ?? false,
				notes: academic?.notes,

				// Kehadiran Tambahan
				attendancePiketTotal: academic?.attendancePiketTotal ?? 0,
				attendancePiketPresent: academic?.attendancePiketPresent ?? 0,
				attendanceOdsTotal: academic?.attendanceOdsTotal ?? 0,
				attendanceOdsPresent: academic?.attendanceOdsPresent ?? 0,
				attendancePramagangTotal: academic?.attendancePramagangTotal ?? 0,
				attendancePramagangPresent: academic?.attendancePramagangPresent ?? 0,

				// Syarat Taiwan
				taiwanCohort:
					overseasChecklist?.cohort === "13/14" ||
					overseasChecklist?.programType === "taiwan",
				taiwanPasFotoChecked: overseasChecklist?.pasFotoChecked ?? false,
				taiwanCvChecked: overseasChecklist?.cvChecked ?? false,
				taiwanKtmChecked: overseasChecklist?.ktmChecked ?? false,
				taiwanKhsChecked: overseasChecklist?.khsChecked ?? false,
				taiwanSl21Checked: overseasChecklist?.sl21Checked ?? false,
				taiwanAktifChecked: overseasChecklist?.aktifChecked ?? false,
				taiwanGapYearChecked: overseasChecklist?.gapYearChecked ?? false,
				taiwanPddiktiChecked: overseasChecklist?.pddiktiChecked ?? false,
				taiwanPribadiChecked: overseasChecklist?.pribadiChecked ?? false,
				taiwanLolChecked: overseasChecklist?.lolChecked ?? false,
				taiwanLoaChecked: overseasChecklist?.loaChecked ?? false,
				taiwanSuhhanChecked: overseasChecklist?.suhhanChecked ?? false,

				// Nilai Mata Kuliah
				grades: grades.map((g) => ({
					id: g.id,
					courseCode: g.courseCode,
					courseName: g.courseName,
					grade: g.grade,
					attendanceRate: g.attendanceRate,
					practicalScore: g.practicalScore,
					theoryScore: g.theoryScore,
					entrepreneurScore: g.entrepreneurScore,
					kwuScore: g.kwuScore,
					attitudeNote: g.attitudeNote,
					isAcc: g.isAcc,
					status: g.status,
				})),

				// Assessment Keberangkatan
				assessment: assessment
					? {
							score: assessment.score,
							notes: assessment.notes,
							status: assessment.status,
							resultFileUrl: assessment.resultFileUrl,
							resultFileName: assessment.resultFileName,
							assessedAt: assessment.assessedAt,
						}
					: null,

				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					fileUrl: d.fileUrl,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),

				status: academic?.status,
				isAcc: academic?.isAcc,
				accAt: academic?.accAt,
			};
		} else if (panelKey === "pa") {
			const [
				pa,
				interviews,
				vocabs,
				counselings,
				tripartites,
				hafalanSessionsList,
				documents,
				studentNotesList,
			] = await Promise.all([
				db.query.paData.findFirst({
					where: eq(paData.studentId, studentData.id),
				}),
				db.query.paInterviewLogs.findMany({
					where: eq(paInterviewLogs.studentId, studentData.id),
					orderBy: (paInterviewLogs, { desc }) => [
						desc(paInterviewLogs.interviewDate),
					],
				}),
				db.query.vocabLogs.findMany({
					where: eq(vocabLogs.studentId, studentData.id),
					orderBy: (vocabLogs, { desc }) => [desc(vocabLogs.date)],
				}),
				db.query.counselingLogs.findMany({
					where: eq(counselingLogs.studentId, studentData.id),
					orderBy: (counselingLogs, { desc }) => [desc(counselingLogs.date)],
				}),
				db.query.paTripartiteLogs.findMany({
					where: eq(paTripartiteLogs.studentId, studentData.id),
					orderBy: (paTripartiteLogs, { desc }) => [
						desc(paTripartiteLogs.contactDate),
					],
				}),
				db.query.paHafalanSessions.findMany({
					where: eq(paHafalanSessions.studentId, studentData.id),
					orderBy: (paHafalanSessions, { desc }) => [
						desc(paHafalanSessions.createdAt),
					],
				}),
				db.query.paDocuments.findMany({
					where: eq(paDocuments.studentId, studentData.id),
				}),
				db.query.paStudentNotes.findMany({
					where: eq(paStudentNotes.studentId, studentData.id),
					orderBy: (paStudentNotes, { desc }) => [
						desc(paStudentNotes.createdAt),
					],
				}),
			]);

			data = {
				counselingDone: pa?.counselingDone ?? false,
				mentalStable: pa?.mentalStable ?? false,
				disciplineGood: pa?.disciplineGood ?? false,
				vocabTarget: pa?.vocabTarget ?? 500,
				disciplineNotes: pa?.disciplineNotes,

				status: pa?.status,
				isAcc: pa?.isAcc,
				accAt: pa?.accAt,

				// Interview Logs
				interviews: interviews.map((i) => ({
					id: i.id,
					date: i.interviewDate,
					companyName: i.companyName,
					country: i.country,
					result: i.result,
					notes: i.notes,
				})),

				// Vocab Logs & Hafalan Sessions
				vocabLogs: vocabs.map((v) => ({
					date: v.date,
					addedWords: v.addedWords,
					notes: v.notes,
				})),
				hafalanSessions: hafalanSessionsList.map((h) => ({
					id: h.id,
					language: h.language,
					languageCustom: h.languageCustom,
					vocabCount: h.vocabCount,
					sentenceCount: h.sentenceCount,
					createdAt: h.createdAt,
				})),

				// Konseling
				counselingLogs: counselings.map((c) => ({
					id: c.id,
					type: c.type,
					date: c.date,
					condition: c.condition,
					notes: c.notes,
				})),

				// Tripartit
				tripartiteLogs: tripartites.map((t) => ({
					id: t.id,
					contactType: t.contactType,
					contactName: t.contactName,
					contactDate: t.contactDate,
					summary: t.summary,
					result: t.result,
				})),

				// Catatan Khusus PA untuk Mahasiswa
				studentNotes: studentNotesList.map((sn) => ({
					id: sn.id,
					type: sn.type,
					content: sn.content,
					createdAt: sn.createdAt,
				})),

				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					fileUrl: d.fileUrl,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),
			};
		} else if (panelKey === "magang") {
			const [magang, decision, documents] = await Promise.all([
				db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, studentData.id),
				}),
				db.query.finalDecision.findFirst({
					where: eq(finalDecision.studentId, studentData.id),
				}),
				db.query.internshipDocuments.findMany({
					where: eq(internshipDocuments.studentId, studentData.id),
				}),
			]);

			data = {
				// 0. Pra-Paspor (11 Berkas)
				praPasporPasFoto: magang?.praPasporPasFoto ?? false,
				praPasporKtm: magang?.praPasporKtm ?? false,
				praPasporKtp: magang?.praPasporKtp ?? false,
				praPasporKk: magang?.praPasporKk ?? false,
				praPasporAktaKelahiran: magang?.praPasporAktaKelahiran ?? false,
				praPasporSl21: magang?.praPasporSl21 ?? false,
				praPasporSkma: magang?.praPasporSkma ?? false,
				praPasporRekomendasiDisdik: magang?.praPasporRekomendasiDisdik ?? false,
				praPasporGapYear: magang?.praPasporGapYear ?? false,
				praPasporPddikti: magang?.praPasporPddikti ?? false,
				praPasporCv: magang?.praPasporCv ?? false,

				// 1. Paspor
				passportReady: magang?.passportReady ?? false,
				passportNo: magang?.passportNo,
				passportExp: magang?.passportExp,

				// 2. Interview
				interviewReady: magang?.interviewReady ?? false,
				interviewDate: magang?.interviewDate,
				interviewResult: magang?.interviewResult,

				// 3. LoA
				loaReady: magang?.loaReady ?? false,
				loaCompany: magang?.loaCompany,
				loaPosition: magang?.loaPosition,
				loaConfirmed: magang?.loaConfirmed ?? false,
				loaDate: magang?.loaDate,

				// 4. LoL & MoA
				lolReady: magang?.lolReady ?? false,
				lolDate: magang?.lolDate,
				lolNotes: magang?.lolNotes,
				moaReady: magang?.moaReady ?? false,
				moaDate: magang?.moaDate,
				moaNotes: magang?.moaNotes,

				// 5. Contract
				contractReady: magang?.contractReady ?? false,
				contractDate: magang?.contractDate,

				// 6. MCU
				mcuReady: magang?.mcuReady ?? false,
				mcuPlace: magang?.mcuPlace,
				mcuDate: magang?.mcuDate,
				mcuResult: magang?.mcuResult,

				// 7. Visa
				visaReady: magang?.visaReady ?? false,
				visaType: magang?.visaType,
				visaStatus: magang?.visaStatus,
				visaNo: magang?.visaNo,

				// 8. Tiket
				ticketReady: magang?.ticketReady ?? false,
				ticketAirline: magang?.ticketAirline,
				ticketDate: magang?.ticketDate,
				ticketFlight: magang?.ticketFlight,

				// 9. PDT
				pdtReady: magang?.pdtReady ?? false,
				pdtDate: magang?.pdtDate,
				pdtEndDate: magang?.pdtEndDate,
				pdtPlace: magang?.pdtPlace,

				// Info Keberangkatan & Instansi
				estDepartureDate: magang?.estDepartureDate,
				destinationCity: magang?.destinationCity,
				internshipCompany: magang?.internshipCompany,
				internshipDuration: magang?.internshipDuration,

				// Kelengkapan Lainnya
				dokumentasiReady: magang?.dokumentasiReady ?? false,
				dokumentasiKeberangkatanLink: magang?.dokumentasiKeberangkatanLink,
				agenReady: magang?.agenReady ?? false,
				agenNegaraTujuan: magang?.agenNegaraTujuan,
				agenPeminatan: magang?.agenPeminatan,

				// Syarat Akhir
				logbookReady: magang?.logbookReady ?? false,
				laporanAkhirReady: magang?.laporanAkhirReady ?? false,
				videoDokumentasiReady: magang?.videoDokumentasiReady ?? false,
				videoDokumentasiLink: magang?.videoDokumentasiLink,

				// Dana Talangan Magang
				danaTahap1Amount: magang?.danaTahap1Amount ?? 0,
				danaTahap1Date: magang?.danaTahap1Date,
				danaTahap1Notes: magang?.danaTahap1Notes,
				isDanaTahap1Disbursed: magang?.isDanaTahap1Disbursed ?? false,
				danaTahap2Amount: magang?.danaTahap2Amount ?? 0,
				danaTahap2Date: magang?.danaTahap2Date,
				danaTahap2Notes: magang?.danaTahap2Notes,
				isDanaTahap2Disbursed: magang?.isDanaTahap2Disbursed ?? false,

				status: magang?.status,
				isAcc: magang?.isAcc,
				accAt: magang?.accAt,

				finalDecision: {
					evaluatorDecision: decision?.evaluatorDecision,
					isApprovedByDirector: decision?.isApprovedByDirector,
				},

				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					fileUrl: d.fileUrl,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),
			};
		} else if (panelKey === "evaluator") {
			const [pmb, crm, finance, academic, pa, internship, decision] =
				await Promise.all([
					db.query.pmbData.findFirst({
						where: eq(pmbData.studentId, studentData.id),
					}),
					db.query.crmData.findFirst({
						where: eq(crmData.studentId, studentData.id),
					}),
					db.query.financeData.findFirst({
						where: eq(financeData.studentId, studentData.id),
					}),
					db.query.academicData.findFirst({
						where: eq(academicData.studentId, studentData.id),
					}),
					db.query.paData.findFirst({
						where: eq(paData.studentId, studentData.id),
					}),
					db.query.internshipData.findFirst({
						where: eq(internshipData.studentId, studentData.id),
					}),
					db.query.finalDecision.findFirst({
						where: eq(finalDecision.studentId, studentData.id),
					}),
				]);

			data = {
				// Status ACC 6 Divisi
				panels: {
					pmb: {
						name: "PMB",
						isAcc: pmb?.isAcc ?? false,
						status: pmb?.status,
						accAt: pmb?.accAt,
					},
					crm: {
						name: "CRM",
						isAcc: crm?.isAcc ?? false,
						status: crm?.status,
						accAt: crm?.accAt,
					},
					finance: {
						name: "Finance",
						isAcc: finance?.isAcc ?? false,
						status: finance?.status,
						accAt: finance?.accAt,
					},
					academic: {
						name: "Akademik",
						isAcc: academic?.isAcc ?? false,
						status: academic?.status,
						accAt: academic?.accAt,
					},
					pa: {
						name: "PA",
						isAcc: pa?.isAcc ?? false,
						status: pa?.status,
						accAt: pa?.accAt,
					},
					internship: {
						name: "Magang",
						isAcc: internship?.isAcc ?? false,
						status: internship?.status,
						accAt: internship?.accAt,
					},
				},
				// Keputusan Evaluator & Direktur
				evaluatorDecision: decision?.evaluatorDecision ?? "menunggu",
				evaluatorNotes: decision?.evaluatorNotes,
				decidedAt: decision?.decidedAt,
				isApprovedByDirector: decision?.isApprovedByDirector ?? false,
				departureDate: decision?.departureDate,
				skDocumentUrl: decision?.skDocumentUrl,
				studentOverallStatus: studentData.overallStatus,
				destinationCountry: studentData.destinationCountry,
			};
		} else {
			set.status = 400;
			return { success: false, message: "Panel tidak valid" };
		}

		await cacheSet(cacheKey, data, 60);

		return { success: true, data };
	});
