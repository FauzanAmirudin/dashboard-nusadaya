/**
 * Syarat persetujuan Kehadiran & Pembiasaan oleh CRM (practiceAttendance).
 * Setiap jenis pembiasaan harus punya sesi tercatat dan kehadiran >= 80%.
 * Dulu persetujuan bisa diberikan walau seluruh pembiasaan 0/0 sesi.
 *
 * Cermin di web: checkPembiasaanEligible (apps/web/src/utils/panel-logic.ts).
 */
export const PEMBIASAAN_MIN_RATE = 80;

export interface PembiasaanGroup {
	label: string;
	total: number;
	present: number;
}

export function checkPembiasaanEligible(groups: PembiasaanGroup[]): {
	ok: boolean;
	blockers: string[];
} {
	const blockers: string[] = [];
	for (const g of groups) {
		if (!g.total || g.total <= 0) {
			blockers.push(`${g.label}: belum ada sesi tercatat`);
			continue;
		}
		const rate = Math.round((g.present / g.total) * 100);
		if (rate < PEMBIASAAN_MIN_RATE) {
			blockers.push(`${g.label}: ${rate}% (min. ${PEMBIASAAN_MIN_RATE}%)`);
		}
	}
	return { ok: blockers.length === 0, blockers };
}
