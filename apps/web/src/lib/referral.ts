export const REFERRAL_CATEGORY_OPTIONS = [
	{ value: "sekolah", label: "Asal Sekolah" },
	{ value: "bkk_fkks", label: "BKK / FKKS" },
	{ value: "mitra_sponsor", label: "Mitra Sponsor" },
	{ value: "koordinator_ro", label: "Koordinator RO" },
	{ value: "tim_nusadaya", label: "Tim Nusadaya" },
	{ value: "lainnya", label: "Lainnya" },
] as const;

export const REFERRAL_CATEGORY_MAP: Record<string, string> = {
	sekolah: "Asal Sekolah",
	bkk_fkks: "BKK / FKKS",
	mitra_sponsor: "Mitra Sponsor",
	koordinator_ro: "Koordinator RO",
	tim_nusadaya: "Tim Nusadaya",
	lainnya: "Lainnya",
	"Asal Sekolah": "Asal Sekolah",
	"BKK / FKKS": "BKK / FKKS",
	"Mitra Sponsor": "Mitra Sponsor",
	"Koordinator RO": "Koordinator RO",
	"Tim Nusadaya": "Tim Nusadaya",
	Lainnya: "Lainnya",
};

/**
 * Format string kode referral (contoh: "mitra_sponsor", "bkk_fkks")
 * menjadi label UI resmi dan rapi (contoh: "Mitra Sponsor", "BKK / FKKS").
 */
export function formatReferralCategory(val: string | null | undefined): string {
	if (!val) return "-";
	const trimmed = val.trim();
	if (!trimmed) return "-";
	if (REFERRAL_CATEGORY_MAP[trimmed]) {
		return REFERRAL_CATEGORY_MAP[trimmed];
	}
	return trimmed.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
