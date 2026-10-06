import type { User } from "@/store";
import { hasRole } from "@/store";
import {
	calculateOverallStatus,
	normalizeStatus,
	type PanelStatusType,
} from "./status";

// ==========================================
// 1. CRM PANEL LOGIC (Tasks 3.1 & 3.2)
// ==========================================

export function calculateCrmChecklist(crm: any): {
	completedCount: number;
	totalChecks: number;
	isAllChecksDone: boolean;
} {
	const odsList = Array.isArray(crm?.odsDetails) ? crm.odsDetails : [];
	const completedCount = [
		Boolean(crm?.isMonitoringParent),
		Boolean(crm?.isMonitoringIndustry),
		Boolean(crm?.isVocabComplete),
		Boolean(crm?.practiceAttendance),
		Boolean(crm?.isOds1Report || odsList[0]?.isDone),
		Boolean(crm?.isOds2Report || odsList[1]?.isDone),
		Boolean(crm?.isOds3Report || odsList[2]?.isDone),
		Boolean(crm?.isOds4Report || odsList[3]?.isDone),
		Boolean(crm?.isOds5Report || odsList[4]?.isDone),
		Boolean(crm?.isPrammagangReport),
	].filter(Boolean).length;

	const totalChecks = 10;
	return {
		completedCount,
		totalChecks,
		isAllChecksDone: completedCount === totalChecks,
	};
}

export function updateCrmField<T extends { crm: any } | null>(
	state: T,
	field: string,
	value: any,
): T {
	if (!state) return state;
	return {
		...state,
		crm: {
			...state.crm,
			[field]: value,
		},
	};
}

// ==========================================
// 2. PMB PANEL LOGIC (Tasks 3.3 & 3.4)
// ==========================================

export const PMB_REQUIRED_DOC_KEYS = [
	"docKtp",
	"docKk",
	"docCv",
	"docIjazah",
	"docTranskrip",
	"docPassportDepan",
	"docPassportVisa",
	"docSkbm",
	"docPreMcu",
	"docMcu",
	"docSla",
	"docSertifikasiBahasa",
] as const;

export function calculatePmbChecklist(pmbData: any): {
	mainCompletedCount: number;
	requiredDocsCompletedCount: number;
	totalRequiredCompleted16: number;
	isAllChecklistDone: boolean;
} {
	if (!pmbData) {
		return {
			mainCompletedCount: 0,
			requiredDocsCompletedCount: 0,
			totalRequiredCompleted16: 0,
			isAllChecklistDone: false,
		};
	}

	const mainChecklist = [
		Boolean(pmbData.formReceived),
		Boolean(pmbData.documentsComplete),
		Boolean(pmbData.dataInputted),
		Boolean(pmbData.initialFollowUp),
	];

	const requiredDocsChecklist = PMB_REQUIRED_DOC_KEYS.map((key) =>
		Boolean(pmbData[key]),
	);

	const mainCompletedCount = mainChecklist.filter(Boolean).length;
	const requiredDocsCompletedCount =
		requiredDocsChecklist.filter(Boolean).length;
	const totalRequiredCompleted16 =
		mainCompletedCount + requiredDocsCompletedCount;

	return {
		mainCompletedCount,
		requiredDocsCompletedCount,
		totalRequiredCompleted16,
		isAllChecklistDone: totalRequiredCompleted16 === 16,
	};
}

export function canGivePmbAcc(pmbData: any): boolean {
	return calculatePmbChecklist(pmbData).isAllChecklistDone;
}

// ==========================================
// 3. FINANCE PANEL LOGIC (Tasks 3.5 & 3.6)
// ==========================================

export function getFinancePaymentStatus(finState: any): {
	isTalangan: boolean;
	isSemesterDone: boolean;
	isInterviewDone: boolean;
	isKeberangkatanDone: boolean;
} {
	const isTalangan = finState?.metodePembayaran === "dana_talangan";
	const isSemesterDone = isTalangan
		? Boolean(finState?.t1SemesterStatus || finState?.mandiriSemesterStatus)
		: Boolean(finState?.mandiriSemesterStatus);
	const isInterviewDone = isTalangan
		? Boolean(finState?.t1InterviewStatus)
		: Boolean(finState?.mandiriInterviewStatus);
	const isKeberangkatanDone = isTalangan
		? Boolean(finState?.t2KeberangkatanStatus)
		: Boolean(finState?.mandiriKeberangkatanStatus);

	return {
		isTalangan,
		isSemesterDone,
		isInterviewDone,
		isKeberangkatanDone,
	};
}

export function calculateFinanceChecklist(finState: any): {
	completedCount: number;
	totalChecks: number;
	isFinanceReady: boolean;
	items: Array<{ name: string; done: boolean }>;
} {
	if (!finState) {
		return {
			completedCount: 0,
			totalChecks: 6,
			isFinanceReady: false,
			items: [],
		};
	}

	const { isTalangan, isSemesterDone, isInterviewDone, isKeberangkatanDone } =
		getFinancePaymentStatus(finState);

	const items = [
		{
			name: "Registrasi / Pendaftaran",
			done: Boolean(finState.registrasiStatus || finState.registrationPaid),
		},
		{
			name: isTalangan
				? "Perkuliahan Semester (Talangan)"
				: "Perkuliahan 6 Semester",
			done: isSemesterDone,
		},
		{
			name: isTalangan ? "Interview Magang (Tahap 1)" : "Interview Magang",
			done: isInterviewDone,
		},
		{
			name: isTalangan ? "Keberangkatan (Tahap 2)" : "Keberangkatan",
			done: isKeberangkatanDone,
		},
		{
			name: "Sertifikasi Bahasa (TOEIC)",
			done: Boolean(finState.toeicStatus),
		},
		{
			name: "Paspor & Dokumen",
			done: Boolean(finState.pasporStatus),
		},
	];

	const completedCount = items.filter((i) => i.done).length;
	const totalChecks = 6;

	return {
		completedCount,
		totalChecks,
		isFinanceReady: completedCount === totalChecks,
		items,
	};
}

// ==========================================
// 4. AKADEMIK PANEL LOGIC (Tasks 3.7, 3.8, & 3.9)
// ==========================================

export const AKADEMIK_BASE_CHECKLIST = [
	{
		id: "pddiktiInput",
		label: "Validasi Input PDDIKTI",
		desc: "Data akademik terdaftar di sistem PDDIKTI",
		documentKey: "pddikti_input",
	},
	{
		id: "utsPassed",
		label: "Nilai UTS Lulus",
		desc: "Semua mata kuliah UTS memenuhi standar minimal",
		documentKey: "uts_passed",
	},
	{
		id: "uasPassed",
		label: "Nilai UAS Lulus",
		desc: "Semua mata kuliah UAS memenuhi standar minimal",
		documentKey: "uas_passed",
	},
	{
		id: "attitudeIndicator",
		label: "Indikator Sikap",
		desc: "Sikap dan etika dinilai baik oleh Dosen & PA",
		documentKey: "attitude_indicator",
	},
	{
		id: "assignmentsCompleted",
		label: "Penyelesaian Tugas",
		desc: "Tugas perkuliahan utama telah diselesaikan",
		documentKey: "assignments_completed",
	},
	{
		id: "academicCommunication",
		label: "Komunikasi Akademik",
		desc: "Komunikasi mahasiswa dengan dosen/PA aktif",
		documentKey: "academic_communication",
	},
	{
		id: "assessmentCompleted",
		label: "Asesmen Pra-keberangkatan",
		desc: "Hasil asesmen kesiapan keberangkatan",
		documentKey: "pre_departure_assessment",
	},
];

export const TAIWAN_DOCS_CONFIG = [
	{ id: "taiwanPasFotoChecked", label: "Pas Foto", key: "taiwan_pas_foto" },
	{ id: "taiwanCvChecked", label: "CV Akademik", key: "taiwan_cv" },
	{ id: "taiwanKtmChecked", label: "KTM", key: "taiwan_ktm" },
	{ id: "taiwanKhsChecked", label: "KHS", key: "taiwan_khs" },
	{
		id: "taiwanSl21Checked",
		label: "Statement Letter SL21",
		key: "taiwan_sl21",
	},
	{
		id: "taiwanAktifChecked",
		label: "Surat Mahasiswa Aktif",
		key: "taiwan_aktif",
	},
	{
		id: "taiwanGapYearChecked",
		label: "Surat Gap Year",
		key: "taiwan_gap_year",
	},
	{ id: "taiwanPddiktiChecked", label: "NIM PD Dikti", key: "taiwan_pddikti" },
	{
		id: "taiwanPribadiChecked",
		label: "Dokumen Pribadi (KTP/KK)",
		key: "taiwan_pribadi",
	},
	{
		id: "taiwanLolChecked",
		label: "Letter of Offer (LoL)",
		key: "taiwan_lol",
	},
	{
		id: "taiwanLoaChecked",
		label: "Letter of Acceptance (LoA)",
		key: "taiwan_loa",
	},
	{
		id: "taiwanSuhhanChecked",
		label: "Dokumen Suhhan",
		key: "taiwan_suhhan",
	},
];

export function buildAkademikChecklist(acadState: any): Array<{
	id: string;
	label: string;
	desc: string;
	checked: boolean;
	documentKey: string;
	forceDisabled?: boolean;
}> {
	const checklist: Array<{
		id: string;
		label: string;
		desc: string;
		checked: boolean;
		documentKey: string;
		forceDisabled?: boolean;
	}> = AKADEMIK_BASE_CHECKLIST.map((item) => ({
		...item,
		checked: Boolean(acadState?.[item.id]),
	}));

	if (acadState?.taiwanCohort) {
		TAIWAN_DOCS_CONFIG.forEach((doc) => {
			let forceDisabled = false;
			if (doc.id === "taiwanLoaChecked") {
				forceDisabled = !acadState?.taiwanLolChecked;
			}
			if (doc.id === "taiwanSuhhanChecked") {
				forceDisabled = !acadState?.taiwanLoaChecked;
			}

			checklist.push({
				id: doc.id,
				label: `[Taiwan] ${doc.label}`,
				desc:
					"Syarat wajib dokumen kohort Taiwan" +
					(forceDisabled ? " (Terkunci)" : ""),
				checked: Boolean(acadState?.[doc.id]),
				documentKey: doc.key,
				forceDisabled,
			});
		});
	}

	return checklist;
}

export function getGpaGrade(
	gpaScaled: number,
): "A" | "B+" | "B" | "C+" | "C" | "D" {
	const gpa = gpaScaled / 100;
	if (gpa >= 3.7) return "A";
	if (gpa >= 3.3) return "B+";
	if (gpa >= 3.0) return "B";
	if (gpa >= 2.7) return "C+";
	if (gpa >= 2.0) return "C";
	return "D";
}

export function getAkademikStatus(
	completedCount: number,
	totalCount: number,
): "AMAN" | "PERLU PERHATIAN" | "TIDAK AMAN" {
	if (totalCount <= 0) return "AMAN";
	if (completedCount === totalCount) return "AMAN";
	if (completedCount >= Math.floor(totalCount / 2)) return "PERLU PERHATIAN";
	return "TIDAK AMAN";
}

// ==========================================
// 5. PA PANEL LOGIC (Tasks 3.10 & 3.11)
// ==========================================

export function calculatePaChecklist(paData: any): {
	completedCount: number;
	totalChecks: number;
	isAllChecksDone: boolean;
} {
	const isCounselingDone = Boolean(paData?.counselingDone);
	const isMentalStable = Boolean(paData?.mentalStable);
	const isDisciplineGood = Boolean(paData?.disciplineGood);

	const completedCount = [
		isCounselingDone,
		isMentalStable,
		isDisciplineGood,
	].filter(Boolean).length;

	const totalChecks = 3;
	return {
		completedCount,
		totalChecks,
		isAllChecksDone: completedCount === totalChecks,
	};
}

export function canEditPa(user: User): boolean {
	return hasRole(user, "pa", "akademik", "superadmin");
}

// ==========================================
// 6. INTERNSHIP / MAGANG PANEL LOGIC (Tasks 3.12 & 3.13)
// ==========================================

export const PRA_PASPOR_ALL_16_KEYS = [
	"praPasporPasFoto",
	"praPasporKtm",
	"praPasporKtp",
	"praPasporKk",
	"praPasporAktaKelahiran",
	"praPasporSuratIzinOrtu",
	"praPasporSl21",
	"praPasporSkma",
	"praPasporRekomendasiDisdik",
	"praPasporKhs",
	"praPasporKrs",
	"praPasporTranskrip",
	"praPasporIjazah",
	"praPasporGapYear",
	"praPasporBukuRekening",
	"praPasporSertifikatBahasa",
] as const;

export function calculatePraPasporChecklist(
	data: any,
	keys: readonly string[] = PRA_PASPOR_ALL_16_KEYS,
): {
	completedCount: number;
	totalCount: number;
} {
	if (!data) {
		return { completedCount: 0, totalCount: keys.length };
	}

	const completedCount = keys.filter((k) => Boolean(data[k])).length;
	return {
		completedCount,
		totalCount: keys.length,
	};
}

export const INTERNSHIP_MAIN_KEYS = [
	"passportReady",
	"interviewReady",
	"lolReady",
	"loaConfirmed",
	"moaReady",
	"contractReady",
	"mcuReady",
	"visaReady",
	"ticketReady",
	"pdtReady",
	"dokumentasiReady",
	"agenReady",
] as const;

export function calculateInternshipDokumenChecklist(data: any): {
	completedCount: number;
	totalCount: number;
	isInternshipReady: boolean;
} {
	if (!data) {
		return {
			completedCount: 0,
			totalCount: INTERNSHIP_MAIN_KEYS.length,
			isInternshipReady: false,
		};
	}

	const completedCount = INTERNSHIP_MAIN_KEYS.filter((k) =>
		Boolean(data[k]),
	).length;
	const totalCount = INTERNSHIP_MAIN_KEYS.length;

	return {
		completedCount,
		totalCount,
		isInternshipReady: completedCount === totalCount,
	};
}

// ==========================================
// 7. FINAL DECISION & STATUS PANEL LOGIC (Tasks 3.14, 3.15, & 3.16)
// ==========================================

export const KEPUTUSAN_CONFIG_DATA = {
	menunggu: {
		label: "Menunggu Evaluasi",
		color: "slate",
		description: "Belum ada keputusan yang ditetapkan",
		bg: "bg-slate-50",
		border: "border-slate-200",
		text: "text-slate-700",
	},
	lanjut_interview: {
		label: "Lanjut Interview",
		color: "amber",
		description: "Mahasiswa diizinkan mengikuti sesi interview",
		bg: "bg-amber-50",
		border: "border-amber-200",
		text: "text-amber-700",
	},
	ttd_kontrak: {
		label: "Boleh TTD Kontrak",
		color: "blue",
		description: "Mahasiswa diizinkan menandatangani kontrak magang",
		bg: "bg-blue-50",
		border: "border-blue-200",
		text: "text-blue-700",
	},
	layak_berangkat: {
		label: "Layak Berangkat",
		color: "emerald",
		description: "Mahasiswa dinyatakan layak untuk berangkat",
		bg: "bg-emerald-50",
		border: "border-emerald-200",
		text: "text-emerald-700",
	},
	remedial: {
		label: "Remedial",
		color: "rose",
		description: "Mahasiswa perlu perbaikan sebelum lanjut",
		bg: "bg-rose-50",
		border: "border-rose-200",
		text: "text-rose-700",
	},
} as const;

export type EvaluatorDecisionType = keyof typeof KEPUTUSAN_CONFIG_DATA;

export function getKeputusanConfig(
	decision: string | null | undefined,
): (typeof KEPUTUSAN_CONFIG_DATA)[EvaluatorDecisionType] {
	if (!decision || !(decision in KEPUTUSAN_CONFIG_DATA)) {
		return KEPUTUSAN_CONFIG_DATA.menunggu;
	}
	return KEPUTUSAN_CONFIG_DATA[decision as EvaluatorDecisionType];
}

export function canMakeFinalDecision(
	panelsData:
		| {
				pmbAcc?: { isAcc?: boolean | null };
				crmAcc?: { isAcc?: boolean | null };
				financeAcc?: { isAcc?: boolean | null };
				academicAcc?: { isAcc?: boolean | null };
				paAcc?: { isAcc?: boolean | null };
				internshipAcc?: { isAcc?: boolean | null };
				dosenAcc?: { isAcc?: boolean | null };
		  }
		| null
		| undefined,
	requireDosen = false,
): boolean {
	if (!panelsData) return false;

	const coreAccs = [
		Boolean(panelsData.pmbAcc?.isAcc),
		Boolean(panelsData.crmAcc?.isAcc),
		Boolean(panelsData.financeAcc?.isAcc),
		Boolean(panelsData.academicAcc?.isAcc),
		Boolean(panelsData.paAcc?.isAcc),
		Boolean(panelsData.internshipAcc?.isAcc),
	];

	if (coreAccs.some((acc) => !acc)) {
		return false;
	}

	if (requireDosen && !panelsData.dosenAcc?.isAcc) {
		return false;
	}

	return true;
}
