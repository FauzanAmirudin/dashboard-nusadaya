export const LAST_EDUCATION_OPTIONS = ["SMA", "MA", "SMK", "Paket C"] as const;

export const INCOME_RANGE_OPTIONS = [
	"< 1 juta",
	"1 - 3 juta",
	"3 - 5 juta",
	"5 - 10 juta",
	"> 10 juta",
] as const;

export interface ExtraData {
	// Riwayat patah tulang & operasi
	hasBoneFracture: boolean;
	boneFractureLocation?: string;
	boneFractureYear?: number;
	hasSurgery: boolean;
	surgeryType?: string;
	surgeryYear?: number;
	// Pendidikan
	lastEducation?: string;
	priorCollege?: string;
	// Rentang pendapatan orang tua / wali
	ayahIncome?: string;
	ibuIncome?: string;
	waliIncome?: string;
}

const toYear = (v: unknown): number | undefined => {
	const n = Number.parseInt(String(v ?? ""), 10);
	const max = new Date().getFullYear();
	return Number.isInteger(n) && n >= 1900 && n <= max ? n : undefined;
};

const toText = (v: unknown): string | undefined => {
	const t = String(v ?? "").trim();
	return t ? t.slice(0, 255) : undefined;
};

const toBool = (v: unknown) => v === true || v === "true" || v === "Ya";

const oneOf = <T extends string>(
	v: unknown,
	allowed: readonly T[],
): T | undefined => allowed.find((a) => a === v);

/**
 * Isian tambahan form tautan yang disimpan dalam satu kolom jsonb
 * (tabel respons mendekati batas 100 kolom Drizzle) dan dipetakan ke
 * tabel mahasiswa / orang tua / kesehatan saat respons di-ACC.
 */
export function normalizeExtraData(input: unknown): ExtraData {
	const d = (input && typeof input === "object" ? input : {}) as Record<
		string,
		unknown
	>;
	const hasBoneFracture = toBool(d.hasBoneFracture);
	const hasSurgery = toBool(d.hasSurgery);
	return {
		hasBoneFracture,
		...(hasBoneFracture && {
			boneFractureLocation: toText(d.boneFractureLocation),
			boneFractureYear: toYear(d.boneFractureYear),
		}),
		hasSurgery,
		...(hasSurgery && {
			surgeryType: toText(d.surgeryType),
			surgeryYear: toYear(d.surgeryYear),
		}),
		lastEducation: oneOf(d.lastEducation, LAST_EDUCATION_OPTIONS),
		priorCollege: toText(d.priorCollege),
		ayahIncome: oneOf(d.ayahIncome, INCOME_RANGE_OPTIONS),
		ibuIncome: oneOf(d.ibuIncome, INCOME_RANGE_OPTIONS),
		waliIncome: oneOf(d.waliIncome, INCOME_RANGE_OPTIONS),
	};
}
