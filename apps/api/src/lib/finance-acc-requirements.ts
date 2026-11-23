/**
 * Syarat ACC Panel Keuangan: 6 pos tagihan wajib.
 *
 * Pos yang ditandai "Tidak berlaku" (finance_data.tidak_berlaku_items) dilewati,
 * mis. Paspor/TOEIC untuk peminatan Indonesia-Reguler. Sebelumnya pos semacam itu
 * harus diisi nominal dummy lalu "dilunasi" agar ACC bisa diberikan.
 *
 * Cermin di web: calculateFinanceChecklist (apps/web/src/utils/panel-logic.ts).
 */
export const FINANCE_CHECK_KEYS = [
	"registrasi",
	"semester",
	"interview",
	"keberangkatan",
	"toeic",
	"paspor",
] as const;

export type FinanceCheckKey = (typeof FINANCE_CHECK_KEYS)[number];

export interface FinanceCheckItem {
	key: FinanceCheckKey;
	label: string;
	done: boolean;
	notApplicable: boolean;
	note?: string;
}

export interface FinanceAccRequirements {
	items: FinanceCheckItem[];
	required: number;
	done: number;
	ok: boolean;
	missing: string[];
}

type FinanceRow = Record<string, unknown> | null | undefined;

/** Daftar pos yang ditandai tidak berlaku, beserta catatannya. */
export function parseTidakBerlaku(
	finance: FinanceRow,
): Map<string, string | undefined> {
	const raw = finance?.tidakBerlakuItems;
	const map = new Map<string, string | undefined>();
	if (!Array.isArray(raw)) return map;
	for (const entry of raw) {
		if (typeof entry === "string") {
			map.set(entry, undefined);
		} else if (entry && typeof entry === "object") {
			const key = (entry as { key?: unknown }).key;
			const note = (entry as { note?: unknown }).note;
			if (typeof key === "string") {
				map.set(key, typeof note === "string" ? note : undefined);
			}
		}
	}
	return map;
}

/** Status lunas per pos, mengikuti metode pembayaran (mandiri / talangan). */
export function getFinancePaidFlags(finance: FinanceRow) {
	const f = (finance ?? {}) as Record<string, unknown>;
	const isTalangan = f.metodePembayaran === "dana_talangan";
	const isTalanganSatuTahap = isTalangan && f.talanganTipe === "1_tahap";

	const semester = isTalangan
		? isTalanganSatuTahap ||
			Boolean(f.t1SemesterStatus || f.mandiriSemesterStatus)
		: Boolean(f.mandiriSemesterStatus);
	const interview = isTalangan
		? isTalanganSatuTahap || Boolean(f.t1InterviewStatus)
		: Boolean(f.mandiriInterviewStatus);
	const keberangkatan = isTalangan
		? Boolean(f.t2KeberangkatanStatus)
		: Boolean(f.mandiriKeberangkatanStatus);

	return {
		registrasi: Boolean(f.registrasiStatus),
		semester,
		interview,
		keberangkatan,
		toeic: Boolean(f.toeicStatus),
		paspor: Boolean(f.pasporStatus),
	};
}

const LABELS: Record<FinanceCheckKey, string> = {
	registrasi: "Registrasi / Pendaftaran",
	semester: "SPP Semester 1",
	interview: "Kontrak Magang / Suhan",
	keberangkatan: "Penempatan / Keberangkatan",
	toeic: "Sertifikasi Bahasa (TOEIC)",
	paspor: "Paspor & Dokumen",
};

export function computeFinanceAccRequirements(
	finance: FinanceRow,
): FinanceAccRequirements {
	const paid = getFinancePaidFlags(finance);
	const na = parseTidakBerlaku(finance);

	const items: FinanceCheckItem[] = FINANCE_CHECK_KEYS.map((key) => ({
		key,
		label: LABELS[key],
		done: paid[key],
		notApplicable: na.has(key),
		note: na.get(key),
	}));

	const applicable = items.filter((i) => !i.notApplicable);
	const done = applicable.filter((i) => i.done).length;
	const missing = applicable.filter((i) => !i.done).map((i) => i.label);

	return {
		items,
		required: applicable.length,
		done,
		ok: missing.length === 0,
		missing,
	};
}
