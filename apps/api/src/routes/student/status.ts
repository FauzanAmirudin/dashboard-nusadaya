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

function calculatePanelStatus(
	completed: number,
	total: number,
	isAcc?: boolean | null,
): "ACC" | "AMAN" | "PROSES" | "BUTUH_PERHATIAN" {
	if (isAcc) return "ACC";
	if (total <= 0) return "AMAN";
	if (completed >= total) return "AMAN";
	const pct = (completed / total) * 100;
	if (pct > 30) return "PROSES";
	return "BUTUH_PERHATIAN";
}

export const statusRoutes = new Elysia().get(
	"/:id/progress",
	async (context) => {
		const id = Number(context.params.id);

		// Fetch all data
		const [studentRecord] = await db
			.select()
			.from(students)
			.where(eq(students.id, id));
		if (!studentRecord) {
			context.set.status = 404;
			return { success: false, message: "Student not found" };
		}

		const [pmb] = await db
			.select()
			.from(pmbData)
			.where(eq(pmbData.studentId, id));
		const [crm] = await db
			.select()
			.from(crmData)
			.where(eq(crmData.studentId, id));
		const crmDocs = await db
			.select()
			.from(crmDocuments)
			.where(eq(crmDocuments.studentId, id));
		const hasOdsReport = crmDocs.some((d) => d.documentKey === "ods_report");
		const hasPrammagangReport = crmDocs.some(
			(d) => d.documentKey === "pramagang_report",
		);
		const [finance] = await db
			.select()
			.from(financeData)
			.where(eq(financeData.studentId, id));
		const [academic] = await db
			.select()
			.from(academicData)
			.where(eq(academicData.studentId, id));
		const courses = await db
			.select()
			.from(courseGrades)
			.where(eq(courseGrades.studentId, id));
		const [pa] = await db.select().from(paData).where(eq(paData.studentId, id));
		const [internship] = await db
			.select()
			.from(internshipData)
			.where(eq(internshipData.studentId, id));

		const incompleteIndicators: {
			panel: string;
			name: string;
			status: "BUTUH_PERHATIAN" | "PROSES";
			link: string;
		}[] = [];
		const panels: any[] = [];

		let totalCompleted = 0;
		let totalIndicators = 0;

		// 1. PMB (14 Items Total)
		const pmbItems = [
			{ prop: pmb?.formReceived, name: "Formulir Pendaftaran" },
			{ prop: pmb?.documentsComplete, name: "Dokumen Lengkap" },
			{ prop: pmb?.dataInputted, name: "Data Diinput" },
			{ prop: pmb?.initialFollowUp, name: "Follow Up Awal" },
			{ prop: pmb?.docKtp, name: "Dokumen KTP" },
			{ prop: pmb?.docKk, name: "Dokumen KK" },
			{ prop: pmb?.docCv, name: "Dokumen CV" },
			{ prop: pmb?.docIjazah, name: "Dokumen Ijazah" },
			{ prop: pmb?.docTranskrip, name: "Dokumen Transkrip" },
			{ prop: pmb?.docPassportDepan, name: "Dokumen Paspor Depan" },
			{ prop: pmb?.docPassportVisa, name: "Dokumen Paspor Visa" },
			{ prop: pmb?.docSkbm, name: "Dokumen SKBM" },
			{ prop: pmb?.docMcu, name: "Dokumen MCU" },
			{ prop: pmb?.docSertifikasiBahasa, name: "Dokumen Sertifikasi Bahasa" },
		];
		const pmbCompleted = pmbItems.filter((i) => i.prop).length;
		pmbItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "PMB",
					name: i.name,
					status: "BUTUH_PERHATIAN",
					link: "pmb",
				}),
			);
		panels.push({
			id: "pmb",
			name: "PMB",
			completed: pmbCompleted,
			total: 14,
			status: calculatePanelStatus(pmbCompleted, 14, pmb?.isAcc),
			isAcc: Boolean(pmb?.isAcc),
		});
		totalCompleted += pmbCompleted;
		totalIndicators += 14;

		// 2. CRM (8 Items Total)
		const crmItems = [
			{ prop: Boolean(crm?.isMonitoringParent), name: "Monitoring Orang Tua" },
			{ prop: Boolean(crm?.isMonitoringIndustry), name: "Monitoring Industri" },
			{ prop: Boolean(crm?.isVocabComplete), name: "Kendali Vocab/Bahasa" },
			{ prop: Boolean(crm?.practiceAttendance), name: "Presensi Praktik ODS" },
			{ prop: Boolean(hasOdsReport), name: "Laporan ODS" },
			{ prop: Boolean(crm?.odsDocumentation), name: "Dokumentasi ODS" },
			{ prop: Boolean(hasPrammagangReport), name: "Laporan Pra-Magang" },
			{
				prop: Boolean(crm?.isPrammagangDocumentation),
				name: "Dokumentasi Pra-Magang",
			},
		];
		const crmCompleted = crmItems.filter((i) => i.prop).length;
		crmItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "CRM",
					name: i.name,
					status: "PROSES",
					link: "crm",
				}),
			);
		panels.push({
			id: "crm",
			name: "CRM",
			completed: crmCompleted,
			total: 8,
			status: calculatePanelStatus(crmCompleted, 8, crm?.isAcc),
			isAcc: Boolean(crm?.isAcc),
		});
		totalCompleted += crmCompleted;
		totalIndicators += 8;

		// 3. Finance
		const isTalangan = finance?.metodePembayaran === "dana_talangan";
		const financeItems = [
			{ prop: Boolean(finance?.registrasiStatus), name: "Registrasi Awal" },
			{
				prop: isTalangan
					? Boolean(finance?.t1SemesterStatus || finance?.mandiriSemesterStatus)
					: Boolean(finance?.mandiriSemesterStatus),
				name: isTalangan
					? "Perkuliahan Semester (Talangan)"
					: "Perkuliahan 6 Semester",
			},
			{
				prop: isTalangan
					? Boolean(finance?.t1InterviewStatus)
					: Boolean(finance?.mandiriInterviewStatus),
				name: isTalangan ? "Interview Magang (Tahap 1)" : "Interview Magang",
			},
			{
				prop: isTalangan
					? Boolean(finance?.t2KeberangkatanStatus)
					: Boolean(finance?.mandiriKeberangkatanStatus),
				name: isTalangan ? "Keberangkatan (Tahap 2)" : "Keberangkatan",
			},
			{ prop: Boolean(finance?.toeicStatus), name: "Sertifikasi Bahasa" },
			{ prop: Boolean(finance?.pasporStatus), name: "Paspor & Dokumen" },
		];
		const financeCompleted = financeItems.filter((i) => i.prop).length;
		financeItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "Finance",
					name: i.name,
					status: "BUTUH_PERHATIAN",
					link: "finance",
				}),
			);
		panels.push({
			id: "finance",
			name: "Finance",
			completed: financeCompleted,
			total: financeItems.length,
			status: calculatePanelStatus(
				financeCompleted,
				financeItems.length,
				finance?.isAcc,
			),
			isAcc: Boolean(finance?.isAcc),
		});
		totalCompleted += financeCompleted;
		totalIndicators += financeItems.length;

		// 4. Akademik
		const attendanceOk = academic
			? academic.attendanceTotal &&
				academic.attendanceTotal > 0 &&
				academic.attendancePresent! / academic.attendanceTotal! >= 0.8
			: false;
		const academicItems = [
			{ prop: academic?.pddiktiInput, name: "Input PDDIKTI" },
			{ prop: attendanceOk, name: "Kehadiran (≥80%)" },
			{ prop: academic?.utsPassed, name: "Lulus UTS" },
			{ prop: academic?.uasPassed, name: "Lulus UAS" },
			{ prop: academic?.attitudeIndicator, name: "Attitude Baik" },
			{ prop: academic?.assignmentsCompleted, name: "Tugas Selesai" },
			{ prop: academic?.academicCommunication, name: "Komunikasi Akademik" },
		];
		const academicCompleted = academicItems.filter((i) => i.prop).length;
		academicItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "Akademik",
					name: i.name,
					status: "PROSES",
					link: "akademik",
				}),
			);
		panels.push({
			id: "akademik",
			name: "Akademik",
			completed: academicCompleted,
			total: 7,
			status: calculatePanelStatus(academicCompleted, 7, academic?.isAcc),
			isAcc: Boolean(academic?.isAcc),
		});
		totalCompleted += academicCompleted;
		totalIndicators += 7;

		// 5. Dosen per MK
		let dosenCompleted = 0;
		const dosenTotal = courses.length * 3;
		courses.forEach((c) => {
			const attOk = (c.attendanceRate || 0) >= 75;
			const gradeOk = !!c.grade;
			const accOk = !!c.isAcc;
			if (attOk) dosenCompleted++;
			else
				incompleteIndicators.push({
					panel: "Dosen",
					name: `${c.courseName}: Kehadiran <75%`,
					status: "PROSES",
					link: "dosen",
				});
			if (gradeOk) dosenCompleted++;
			else
				incompleteIndicators.push({
					panel: "Dosen",
					name: `${c.courseName}: Belum ada nilai`,
					status: "PROSES",
					link: "dosen",
				});
			if (accOk) dosenCompleted++;
			else
				incompleteIndicators.push({
					panel: "Dosen",
					name: `${c.courseName}: Belum di-ACC`,
					status: "PROSES",
					link: "dosen",
				});
		});
		const isAllDosenAcc =
			courses.length > 0 && courses.every((c: any) => c.isAcc);
		panels.push({
			id: "dosen",
			name: "Dosen per MK",
			completed: dosenCompleted,
			total: dosenTotal,
			status: calculatePanelStatus(dosenCompleted, dosenTotal, isAllDosenAcc),
			isAcc: isAllDosenAcc,
		});
		totalCompleted += dosenCompleted;
		totalIndicators += dosenTotal;

		// 6. PA
		const paItems = [
			{ prop: pa?.counselingDone, name: "Konseling Dilakukan" },
			{ prop: pa?.mentalStable, name: "Mental Stabil" },
			{ prop: pa?.disciplineGood, name: "Disiplin Baik" },
		];
		const paCompleted = paItems.filter((i) => i.prop).length;
		paItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "Pendamping Akademik",
					name: i.name,
					status: "PROSES",
					link: "pa",
				}),
			);
		panels.push({
			id: "pa",
			name: "Pendamping Akademik",
			completed: paCompleted,
			total: 3,
			status: calculatePanelStatus(paCompleted, 3, pa?.isAcc),
			isAcc: Boolean(pa?.isAcc),
		});
		totalCompleted += paCompleted;
		totalIndicators += 3;

		// 7. Magang
		const magangItems = [
			{ prop: internship?.passportReady, name: "Paspor" },
			{ prop: internship?.interviewReady, name: "Interview User" },
			{ prop: internship?.contractReady, name: "Kontrak Magang" },
			{
				prop: internship?.loaReady,
				name: "Surat Izin Penerimaan Negara Tujuan",
			},
			{ prop: internship?.mcuReady, name: "Medical Check Up (MCU)" },
			{ prop: internship?.visaReady, name: "Visa" },
			{ prop: internship?.pdtReady, name: "PDT (Pembekalan)" },
			{ prop: internship?.dokumentasiReady, name: "Dokumentasi Keberangkatan" },
			{ prop: internship?.ticketReady, name: "Keberangkatan (Tiket)" },
			{ prop: internship?.agenReady, name: "Dokumen Agen" },
		];
		const magangCompleted = magangItems.filter((i) => i.prop).length;
		magangItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "Tim Magang",
					name: i.name,
					status:
						i.name === "Paspor" || i.name === "Visa"
							? "BUTUH_PERHATIAN"
							: "PROSES",
					link: "magang",
				}),
			);
		panels.push({
			id: "magang",
			name: "Tim Magang",
			completed: magangCompleted,
			total: magangItems.length,
			status: calculatePanelStatus(
				magangCompleted,
				magangItems.length,
				internship?.isAcc,
			),
			isAcc: Boolean(internship?.isAcc),
		});
		totalCompleted += magangCompleted;
		totalIndicators += magangItems.length;

		// Overall Status Logic (4 Standardized Categories)
		let overallStatus: "ACC" | "AMAN" | "PROSES" | "BUTUH_PERHATIAN" = "AMAN";
		if (panels.some((p) => p.status === "BUTUH_PERHATIAN")) {
			overallStatus = "BUTUH_PERHATIAN";
		} else if (panels.some((p) => p.status === "PROSES")) {
			overallStatus = "PROSES";
		} else if (panels.every((p) => p.status === "ACC")) {
			overallStatus = "ACC";
		} else {
			overallStatus = "AMAN";
		}

		return {
			success: true,
			data: {
				overallStatus,
				totalCompleted,
				totalIndicators,
				panels,
				incompleteIndicators,
			},
		};
	},
);
