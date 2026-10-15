/**
 * Standarisasi Nama Ruangan Nusadaya Academy
 * Berdasarkan hasil rapat stakeholder & analisis akademik:
 * - Ruang Kelas teori berbasis angka (Ruang Kelas 1 s.d. Ruang Kelas 6)
 * - Ruangan khusus praktikum / rapat kampus
 */
export const STANDARDIZED_ROOMS = [
	"Ruang Kelas 1",
	"Ruang Kelas 2",
	"Ruang Kelas 3",
	"Ruang Kelas 4",
	"Ruang Kelas 5",
	"Ruang Kelas 6",
	"Lantai 4 Rapat Utama",
	"Lantai 2 Asosiasi Barista",
] as const;

export type StandardizedRoom = (typeof STANDARDIZED_ROOMS)[number];

export const DEFAULT_ROMBEL_OPTIONS = [
	"Kelas A",
	"Kelas B",
	"Kelas C",
	"Gabungan",
] as const;
