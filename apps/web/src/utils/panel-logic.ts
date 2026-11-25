import type { User } from "@/store";
import { hasRole } from "@/store";
import {
	calculateOverallStatus,
	calculateProgressStatus,
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
	items: Array<{ name: string; done: boolean }>;
} {
	// odsDetails bisa datang sebagai string JSON dari beberapa endpoint
	let odsRaw = crm?.odsDetails;
	if (typeof odsRaw === "string") {
		try {
			odsRaw = JSON.parse(odsRaw);
		} catch {
			odsRaw = [];
		}
	}
	const odsList = Array.isArray(odsRaw) ? odsRaw : [];
	const triDharmaList = Array.isArray(crm?.triDharmaDetails)
		? crm.triDharmaDetails
		: [];
	const isTriDharmaDone = Boolean(
		crm?.isTriDharma ||
			triDharmaList.some((t: any) => t.isDone || t.status === "DISETUJUI"),
	);

	// 12 indikator — satu-satunya sumber progres CRM (panel detail & dashboard)
	const items = [
		{ name: "Monitoring Orang Tua", done: Boolean(crm?.isMonitoringParent) },
		{ name: "Monitoring Industri", done: Boolean(crm?.isMonitoringIndustry) },
		{ name: "Kendali Vocab/Bahasa", done: Boolean(crm?.isVocabComplete) },
		{ name: "Kehadiran & Pembiasaan", done: Boolean(crm?.practiceAttendance) },
		{
			name: "Laporan ODS 1",
			done: Boolean(crm?.isOds1Report || odsList[0]?.isDone),
		},
		{
			name: "Laporan ODS 2",
			done: Boolean(crm?.isOds2Report || odsList[1]?.isDone),
		},
		{
			name: "Laporan ODS 3",
			done: Boolean(crm?.isOds3Report || odsList[2]?.isDone),
		},
		{
			name: "Laporan ODS 4",
			done: Boolean(crm?.isOds4Report || odsList[3]?.isDone),
		},
		{
			name: "Laporan ODS 5",
			done: Boolean(crm?.isOds5Report || odsList[4]?.isDone),
		},
		{
			name: "Laporan Pra-Magang",
			done: Boolean(
				crm?.isPrammagangReport || crm?.pramagangVideoStatus === "DISETUJUI",
			),
		},
		{
			name: "Video Konten Bulanan",
			done: Boolean(
				crm?.isMonthlyVideo || crm?.monthlyVideoStatus === "DISETUJUI",
			),
		},
		{ name: "Kegiatan Tri Dharma", done: isTriDharmaDone },
	];

	const completedCount = items.filter((i) => i.done).length;
	const totalChecks = items.length;
	return {
		completedCount,
		totalChecks,
		isAllChecksDone: completedCount === totalChecks,
		items,
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
	"docSkbm",
	"docPreMcu",
	"docSla",
] as const;

export function calculatePmbChecklist(pmbData: any): {
	mainCompletedCount: number;
	requiredDocsCompletedCount: number;
	totalRequiredCompleted14: number;
	totalRequiredCompleted16: number;
	totalRequiredCompleted17: number;
	totalRequiredCompleted: number;
	isAllChecklistDone: boolean;
} {
	if (!pmbData) {
		return {
			mainCompletedCount: 0,
			requiredDocsCompletedCount: 0,
			totalRequiredCompleted14: 0,
			totalRequiredCompleted16: 0,
			totalRequiredCompleted17: 0,
			totalRequiredCompleted: 0,
			isAllChecklistDone: false,
		};
	}

	const mainChecklist = [
		Boolean(pmbData.formReceived),
		Boolean(pmbData.dataInputted),
		Boolean(pmbData.initialFollowUp),
		Boolean(pmbData.pasFoto),
	];

	const requiredDocsChecklist = PMB_REQUIRED_DOC_KEYS.map((key) =>
		Boolean(pmbData[key]),
	);

	const mainCompletedCount = mainChecklist.filter(Boolean).length;
	const requiredDocsCompletedCount =
		requiredDocsChecklist.filter(Boolean).length;
	const totalRequiredCompleted =
		mainCompletedCount + requiredDocsCompletedCount;

	return {
		mainCompletedCount,
		requiredDocsCompletedCount,
		totalRequiredCompleted14: totalRequiredCompleted,
		totalRequiredCompleted16: totalRequiredCompleted,
		totalRequiredCompleted17: totalRequiredCompleted,
		totalRequiredCompleted,
		// 4 berkas utama + 9 dokumen wajib = 13 (sama dengan syarat ACC di server)
		isAllChecklistDone:
			totalRequiredCompleted === 4 + PMB_REQUIRED_DOC_KEYS.length,
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
		: Boolean(
				finState?.kontrakMagangStatus ||
					finState?.suhanStatus ||
					finState?.mandiriInterviewStatus,
			);
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

/** Alur dokumen & istilah khusus Taiwan (Suhan) hanya berlaku untuk Taiwan. */
export function isTaiwanDestination(
	destinationCountry?: string | null,
): boolean {
	return (destinationCountry || "").toLowerCase().includes("taiwan");
}

export function getPenempatanLabel(destinationCountry?: string | null): string {
	const dest = (destinationCountry || "").toLowerCase();
	if (dest.includes("malaysia")) {
		return "Penempatan Magang D3 Malaysia / Keberangkatan";
	}
	if (dest.includes("taiwan")) {
		return "Penempatan Magang Taiwan / Keberangkatan";
	}
	if (dest.includes("indonesia")) {
		return "Penempatan Magang Indonesia / Keberangkatan";
	}
	if (
		dest.includes("timur tengah") ||
		dest.includes("middle east") ||
		dest.includes("arab")
	) {
		return "Penempatan Magang Timur Tengah / Keberangkatan";
	}
	// Tanpa negara tujuan yang dikenali: pakai istilah netral, bukan Taiwan
	return "Penempatan Magang / Keberangkatan";
}

export const FINANCE_CHECK_KEYS = [
	"registrasi",
	"semester",
	"interview",
	"keberangkatan",
	"toeic",
	"paspor",
] as const;

export type FinanceCheckKey = (typeof FINANCE_CHECK_KEYS)[number];

/**
 * Pos tagihan yang ditandai tidak berlaku bagi mahasiswa ini.
 * Cermin parseTidakBerlaku di apps/api/src/lib/finance-acc-requirements.ts.
 */
export function parseFinanceTidakBerlaku(
	finState: any,
): Map<string, string | undefined> {
	const map = new Map<string, string | undefined>();
	const raw = finState?.tidakBerlakuItems;
	if (!Array.isArray(raw)) return map;
	for (const entry of raw) {
		if (typeof entry === "string") map.set(entry, undefined);
		else if (
			entry &&
			typeof entry === "object" &&
			typeof entry.key === "string"
		)
			map.set(
				entry.key,
				typeof entry.note === "string" ? entry.note : undefined,
			);
	}
	return map;
}

export function calculateFinanceChecklist(
	finState: any,
	destinationCountry?: string | null,
): {
	completedCount: number;
	totalChecks: number;
	isFinanceReady: boolean;
	items: Array<{
		key?: string;
		name: string;
		done: boolean;
		notApplicable?: boolean;
		note?: string;
	}>;
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

	const penempatanName = getPenempatanLabel(
		destinationCountry || finState.destinationCountry,
	);

	// Pos yang ditandai "Tidak berlaku" oleh Finance tidak dihitung sebagai syarat ACC
	const naMap = parseFinanceTidakBerlaku(finState);

	const items = [
		{
			key: "registrasi",
			name: "Registrasi / Pendaftaran",
			done: Boolean(finState.registrasiStatus || finState.registrationPaid),
		},
		{
			key: "semester",
			name: isTalangan
				? "Pembayaran SPP Semester 1 (Talangan)"
				: "Pembayaran SPP Semester 1",
			done: isSemesterDone,
		},
		{
			key: "interview",
			name: "Kontrak Magang / Suhan",
			done: isInterviewDone,
		},
		{
			key: "keberangkatan",
			name: penempatanName,
			done: isKeberangkatanDone,
		},
		{
			key: "toeic",
			name: "Sertifikasi Bahasa (TOEIC)",
			done: Boolean(finState.toeicStatus),
		},
		{
			key: "paspor",
			name: "Paspor & Dokumen",
			done: Boolean(finState.pasporStatus),
		},
	].map((i) => ({
		...i,
		notApplicable: naMap.has(i.key),
		note: naMap.get(i.key),
	}));

	const applicable = items.filter((i) => !i.notApplicable);
	const completedCount = applicable.filter((i) => i.done).length;
	const totalChecks = applicable.length;

	return {
		completedCount,
		totalChecks,
		isFinanceReady: completedCount === totalChecks,
		items,
	};
}

export const PEMBIASAAN_MIN_RATE = 80;

/**
 * Syarat persetujuan Kehadiran & Pembiasaan oleh CRM:
 * setiap jenis pembiasaan harus punya sesi tercatat dan kehadiran >= 80%.
 * Dulu persetujuan bisa diberikan walau semua 0/0 sesi.
 * Cermin di server: checkPembiasaanEligible (apps/api/src/lib/crm-pembiasaan.ts).
 */
export function checkPembiasaanEligible(
	groups: Array<{ label: string; total: number; rate: number }>,
): { ok: boolean; blockers: string[] } {
	const blockers: string[] = [];
	for (const g of groups) {
		if (!g.total || g.total <= 0) {
			blockers.push(`${g.label}: belum ada sesi tercatat`);
		} else if (g.rate < PEMBIASAAN_MIN_RATE) {
			blockers.push(`${g.label}: ${g.rate}% (min. ${PEMBIASAAN_MIN_RATE}%)`);
		}
	}
	return { ok: blockers.length === 0, blockers };
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
	{
		id: "paCompleted",
		label: "Pendampingan Akademik (PA)",
		desc: "Otomatis saat Konseling, Mental Stabil & Disiplin Baik tuntas di Panel PA",
		documentKey: "pa_completed",
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
	data: Record<string, unknown> | null | undefined,
	keys: readonly string[] = PRA_PASPOR_ALL_16_KEYS,
): {
	completedCount: number;
	totalCount: number;
} {
	if (!data) {
		return { completedCount: 0, totalCount: keys.length };
	}

	const completedCount = keys.filter((k) => {
		if (k === "praPasporSkma") {
			return Boolean(data.praPasporSkma ?? data.praPasporLos);
		}
		return Boolean(data[k]);
	}).length;
	return {
		completedCount,
		totalCount: keys.length,
	};
}

export const INTERNSHIP_MAIN_KEYS = [
	"passportReady",
	"interviewReady",
	"mouReady",
	"loaConfirmed",
	"contractReady",
	"suhanReady",
	"mcuReady",
	"visaReady",
	"ticketReady",
	"asesmenReady",
	"dokumentasiReady",
	"agenReady",
	"asuransiBtnBpjsReady",
	"asuransiPenempatanReady",
	"ahliWarisReady",
] as const;

export function calculateInternshipDokumenChecklist(
	data: Record<string, unknown> | null | undefined,
	destinationCountry?: string | null,
): {
	completedCount: number;
	totalCount: number;
	isInternshipReady: boolean;
} {
	if (!data) {
		return {
			completedCount: 0,
			totalCount: isTaiwanDestination(destinationCountry)
				? INTERNSHIP_MAIN_KEYS.length
				: INTERNSHIP_MAIN_KEYS.length - 1,
			isInternshipReady: false,
		};
	}

	// Suhan = izin Biro Pariwisata Taiwan, hanya wajib untuk tujuan Taiwan
	const keys = isTaiwanDestination(destinationCountry)
		? INTERNSHIP_MAIN_KEYS
		: INTERNSHIP_MAIN_KEYS.filter((k) => k !== "suhanReady");

	const completedCount = keys.filter((k) => {
		if (k === "mouReady") return Boolean(data.mouReady ?? data.moaReady);
		if (k === "asesmenReady")
			return Boolean(data.asesmenReady ?? data.pdtReady);
		return Boolean(data[k]);
	}).length;
	const totalCount = keys.length;

	return {
		completedCount,
		totalCount,
		isInternshipReady: completedCount === totalCount,
	};
}

export const PRA_PASPOR_ACC_KEYS = [
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
] as const;

export const SYARAT_AKHIR_KEYS = [
	"logbookReady",
	"laporanAkhirReady",
	"videoDokumentasiReady",
] as const;

type AccGroup = { done: number; total: number; ok: boolean };

/**
 * Syarat ACC Panel Magang per grup — cermin `getInternshipChecks` di
 * apps/api/src/routes/student/internship.ts (SKMA atau LOS; Gap Year bila perlu).
 */
export function getInternshipAccRequirements(
	data: Record<string, unknown> | null | undefined,
	isGapYear = false,
	destinationCountry?: string | null,
): {
	praPaspor: AccGroup;
	dokumen: AccGroup;
	syaratAkhir: AccGroup;
	completed: number;
	total: number;
	ok: boolean;
} {
	const d = data ?? {};
	const group = (checks: boolean[]): AccGroup => {
		const done = checks.filter(Boolean).length;
		return { done, total: checks.length, ok: done === checks.length };
	};

	const praPaspor = group([
		...PRA_PASPOR_ACC_KEYS.map((k) =>
			k === "praPasporSkma"
				? Boolean(d.praPasporSkma || d.praPasporLos)
				: Boolean(d[k]),
		),
		...(isGapYear ? [Boolean(d.praPasporGapYear)] : []),
	]);
	const { completedCount, totalCount } = calculateInternshipDokumenChecklist(
		d,
		destinationCountry,
	);
	const dokumen: AccGroup = {
		done: completedCount,
		total: totalCount,
		ok: completedCount === totalCount,
	};
	const syaratAkhir = group(SYARAT_AKHIR_KEYS.map((k) => Boolean(d[k])));

	// ACC keberangkatan hanya mensyaratkan Pra-Paspor + Dokumen Keberangkatan.
	// Syarat Akhir (berkas kepulangan) tetap dilacak, tetapi tidak mengunci ACC.
	const completed = praPaspor.done + dokumen.done;
	const total = praPaspor.total + dokumen.total;
	return {
		praPaspor,
		dokumen,
		syaratAkhir,
		completed,
		total,
		ok: praPaspor.ok && dokumen.ok,
	};
}

/**
 * Prasyarat mahasiswa diproses Panel Magang — cermin
 * apps/api/src/lib/magang-prerequisites.ts (server memakai ini untuk menolak ACC Magang).
 * ACC PMB + CRM + Akademik, ditambah Registrasi & SPP Semester 1 lunas.
 */
export function getMagangPrerequisites(s: {
	pmb?: { isAcc?: boolean | null } | null;
	crm?: { isAcc?: boolean | null } | null;
	academic?: { isAcc?: boolean | null } | null;
	finance?: Record<string, unknown> | null;
}): {
	items: { key: string; label: string; ok: boolean }[];
	ok: boolean;
	missing: string[];
} {
	const f = s.finance ?? {};
	const isTalangan = f.metodePembayaran === "dana_talangan";
	const spp1 = isTalangan
		? f.talanganTipe === "1_tahap" ||
			Boolean(f.t1SemesterStatus || f.mandiriSemesterStatus)
		: Boolean(f.mandiriSemesterStatus);
	const items = [
		{ key: "pmb", label: "ACC PMB", ok: Boolean(s.pmb?.isAcc) },
		{ key: "crm", label: "ACC CRM", ok: Boolean(s.crm?.isAcc) },
		{ key: "akademik", label: "ACC Akademik", ok: Boolean(s.academic?.isAcc) },
		{
			key: "registrasi",
			label: "Registrasi lunas",
			ok: Boolean(f.registrasiStatus),
		},
		{ key: "spp1", label: "SPP Semester 1 lunas", ok: spp1 },
	];
	const missing = items.filter((i) => !i.ok).map((i) => i.label);
	return { items, ok: missing.length === 0, missing };
}

/**
 * Pengingat termin pembayaran kampus ke agensi mitra:
 * - DP saat Suhan terbit (sebelum MCU Full)
 * - Pelunasan saat visa terbit (sebelum tiket diterbitkan)
 * Hanya pengingat: tidak memblokir checklist maupun ACC.
 */
export function getAgencyPaymentReminders(
	internship: Record<string, unknown> | null | undefined,
	destinationCountry?: string | null,
): { key: "dp" | "pelunasan"; text: string }[] {
	const i = internship ?? {};
	const reminders: { key: "dp" | "pelunasan"; text: string }[] = [];
	const isTaiwan = isTaiwanDestination(destinationCountry);
	// Taiwan: DP saat Suhan terbit. Non-Taiwan tidak memakai Suhan, jadi
	// acuannya kontrak magang yang sudah selesai.
	const dpTrigger = isTaiwan ? Boolean(i.suhanReady) : Boolean(i.contractReady);
	if (dpTrigger && !i.agenDpPaid)
		reminders.push({
			key: "dp",
			text: isTaiwan
				? "Suhan sudah terbit: bayar DP ke agensi sebelum MCU Full."
				: "Kontrak magang sudah selesai: bayar DP ke agensi sebelum MCU Full.",
		});
	if (i.visaReady && !i.agenPelunasanPaid)
		reminders.push({
			key: "pelunasan",
			text: "Visa sudah terbit: lunasi biaya agensi sebelum tiket diterbitkan.",
		});
	return reminders;
}

export interface AgencyPaymentInternshipLike {
	suhanReady?: boolean | null;
	contractReady?: boolean | null;
	visaReady?: boolean | null;
	agenDpPaid?: boolean | null;
	agenDpDate?: string | Date | null;
	agenDpNominal?: number | null;
	agenPelunasanPaid?: boolean | null;
	agenPelunasanDate?: string | Date | null;
	agenPelunasanNominal?: number | null;
}

export interface AgencyPaymentTermSummary {
	key: "dp" | "pelunasan";
	label: string;
	triggerLabel: string;
	triggerReady: boolean;
	paid: boolean;
	isOverdue: boolean;
	reminderText: string | null;
	nominal: number | null;
	paidDate: string | Date | null;
}

/**
 * Ringkasan dua termin pembayaran kampus ke agensi mitra (DP & Pelunasan)
 * untuk tampilan input Finance, ringkasan baca-saja Magang, dan antrean pengingat dashboard.
 */
export function getAgencyPaymentTermsSummary(
	internship: AgencyPaymentInternshipLike | null | undefined,
	destinationCountry?: string | null,
): AgencyPaymentTermSummary[] {
	const i = internship ?? {};
	const isTaiwan = isTaiwanDestination(destinationCountry);
	const reminders = getAgencyPaymentReminders(
		i as Record<string, unknown>,
		destinationCountry,
	);
	const dpReminder = reminders.find((r) => r.key === "dp") ?? null;
	const pelunasanReminder =
		reminders.find((r) => r.key === "pelunasan") ?? null;

	return [
		{
			key: "dp",
			label: "Uang Muka (DP) ke Agensi",
			triggerLabel: isTaiwan ? "Suhan terbit" : "Kontrak magang selesai",
			triggerReady: isTaiwan ? Boolean(i.suhanReady) : Boolean(i.contractReady),
			paid: Boolean(i.agenDpPaid),
			isOverdue: Boolean(dpReminder),
			reminderText: dpReminder?.text ?? null,
			nominal:
				typeof i.agenDpNominal === "number" && i.agenDpNominal > 0
					? i.agenDpNominal
					: null,
			paidDate: i.agenDpDate ?? null,
		},
		{
			key: "pelunasan",
			label: "Pelunasan Biaya Agensi",
			triggerLabel: "Visa terbit",
			triggerReady: Boolean(i.visaReady),
			paid: Boolean(i.agenPelunasanPaid),
			isOverdue: Boolean(pelunasanReminder),
			reminderText: pelunasanReminder?.text ?? null,
			nominal:
				typeof i.agenPelunasanNominal === "number" && i.agenPelunasanNominal > 0
					? i.agenPelunasanNominal
					: null,
			paidDate: i.agenPelunasanDate ?? null,
		},
	];
}

/** Ringkasan 6 tahap keberangkatan untuk tabel Dashboard Magang. */
export function getMagangDashboardChecklist(
	internship: Record<string, unknown> | null | undefined,
	destinationCountry?: string | null,
): {
	items: Array<{ name: string; done: boolean }>;
	completed: number;
	total: number;
} {
	const i = internship ?? {};
	const isTaiwan = isTaiwanDestination(destinationCountry);
	const items = [
		{ name: "Paspor Siap", done: Boolean(i.passportReady) },
		{
			name: "MOU & LOA",
			done: Boolean((i.mouReady ?? i.moaReady) || i.loaConfirmed),
		},
		{
			name: isTaiwan ? "Kontrak & Suhan" : "Kontrak Magang",
			done: isTaiwan
				? Boolean(i.contractReady || i.suhanReady)
				: Boolean(i.contractReady),
		},
		{ name: "MCU Full", done: Boolean(i.mcuReady) },
		{ name: "Visa Disetujui", done: Boolean(i.visaReady) },
		{
			name: "Tiket & Asesmen",
			done: Boolean(i.ticketReady || i.asesmenReady || i.pdtReady),
		},
	];
	return {
		items,
		completed: items.filter((it) => it.done).length,
		total: items.length,
	};
}

/** Satu sumber status Dashboard Magang (KPI, filter, pill, export). */
export function getMagangDashboardStatus(
	internship: Record<string, unknown> | null | undefined,
	destinationCountry?: string | null,
): PanelStatusType {
	const { completed, total } = getMagangDashboardChecklist(
		internship,
		destinationCountry,
	);
	return calculateProgressStatus(completed, total, Boolean(internship?.isAcc));
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
				internshipAcc?: { isAcc?: boolean | null };
		  }
		| null
		| undefined,
): boolean {
	if (!panelsData) return false;

	// Dosen & PA berada di bawah Akademik: ACC Akademik sudah mewakili keduanya.
	const coreAccs = [
		Boolean(panelsData.pmbAcc?.isAcc),
		Boolean(panelsData.crmAcc?.isAcc),
		Boolean(panelsData.financeAcc?.isAcc),
		Boolean(panelsData.academicAcc?.isAcc),
		Boolean(panelsData.internshipAcc?.isAcc),
	];

	return coreAccs.every(Boolean);
}
