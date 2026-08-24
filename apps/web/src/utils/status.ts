export type PanelStatusType = "ACC" | "AMAN" | "PROSES" | "BUTUH_PERHATIAN";

/**
 * Menghitung status standar 4 kategori berdasarkan progres checklist dan status ACC:
 * - ACC: Jika sudah di-ACC oleh admin panel
 * - AMAN: Jika semua progres 100% selesai (tapi belum ACC)
 * - PROSES: Jika progres mahasiswa > 30%
 * - BUTUH_PERHATIAN: Jika progres mahasiswa <= 30%
 */
export function calculateProgressStatus(
	completed: number,
	total: number,
	isAcc?: boolean | null,
): PanelStatusType {
	if (isAcc) return "ACC";
	if (total <= 0) return "AMAN";
	if (completed >= total) return "AMAN";
	const percentage = (completed / total) * 100;
	if (percentage > 30) return "PROSES";
	return "BUTUH_PERHATIAN";
}

/**
 * Menormalisasi string status legacy/database ke dalam 4 kategori standar
 */
export function normalizeStatus(
	rawStatus?: string | null,
	isAcc?: boolean | null,
): PanelStatusType {
	if (isAcc) return "ACC";
	if (!rawStatus) return "BUTUH_PERHATIAN";
	const upper = rawStatus.toUpperCase().trim();
	if (upper === "ACC") return "ACC";
	if (upper === "AMAN") return "AMAN";
	if (upper === "PROSES" || upper === "PERLU_PERHATIAN") return "PROSES";
	if (
		upper === "BUTUH_PERHATIAN" ||
		upper === "TIDAK_AMAN" ||
		upper === "BLOCKING" ||
		upper === "KENDALA"
	)
		return "BUTUH_PERHATIAN";
	return "PROSES";
}

/**
 * Menghitung overall status dari array modul/panel berdasarkan prioritas:
 * 1. Jika ada BUTUH_PERHATIAN -> BUTUH_PERHATIAN (merah)
 * 2. Jika ada PROSES -> PROSES (kuning)
 * 3. Jika semua ACC -> ACC (hijau tua)
 * 4. Jika semua AMAN atau kombinasi AMAN & ACC -> AMAN (hijau)
 */
export function calculateOverallStatus(
	modules: Array<
		| { status?: PanelStatusType | string; isAcc?: boolean }
		| PanelStatusType
		| string
	>,
): PanelStatusType {
	if (!modules || modules.length === 0) return "AMAN";

	const normalized: PanelStatusType[] = modules.map((m) => {
		if (typeof m === "string") return normalizeStatus(m);
		if (m && typeof m === "object") {
			if (m.isAcc) return "ACC";
			return normalizeStatus(m.status);
		}
		return "BUTUH_PERHATIAN";
	});

	if (normalized.some((s) => s === "BUTUH_PERHATIAN")) return "BUTUH_PERHATIAN";
	if (normalized.some((s) => s === "PROSES")) return "PROSES";
	if (normalized.every((s) => s === "ACC")) return "ACC";
	return "AMAN";
}

export const PANEL_STATUS_CONFIG: Record<
	PanelStatusType,
	{
		label: string;
		shortLabel: string;
		bg: string;
		text: string;
		border: string;
		dot: string;
		badgeClass: string;
		description: string;
	}
> = {
	ACC: {
		label: "Sudah ACC",
		shortLabel: "ACC",
		bg: "bg-emerald-50",
		text: "text-emerald-800",
		border: "border-emerald-300",
		dot: "bg-emerald-600",
		badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
		description: "Telah divalidasi dan disetujui penuh oleh admin panel.",
	},
	AMAN: {
		label: "Aman",
		shortLabel: "Aman",
		bg: "bg-green-50",
		text: "text-green-700",
		border: "border-green-300",
		dot: "bg-green-600",
		badgeClass: "bg-green-50 text-green-700 border-green-300",
		description: "Semua persyaratan selesai, menunggu persetujuan ACC.",
	},
	PROSES: {
		label: "Berproses",
		shortLabel: "Proses",
		bg: "bg-amber-50",
		text: "text-amber-700",
		border: "border-amber-200",
		dot: "bg-amber-500",
		badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
		description: "Sedang dalam proses pengerjaan.",
	},
	BUTUH_PERHATIAN: {
		label: "Butuh Perhatian",
		shortLabel: "Perhatian",
		bg: "bg-rose-50",
		text: "text-rose-700",
		border: "border-rose-200",
		dot: "bg-rose-600",
		badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
		description: "Progres minim atau belum ada tindakan.",
	},
};
