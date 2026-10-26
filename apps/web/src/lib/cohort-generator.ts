export interface DynamicCohortOption {
	cohort: number;
	academicYear: string;
	label: string;
	isCurrent?: boolean;
}

const COHORT_BASE_YEAR = 2008; // 2025 - 17 = 2008

/**
 * Menghitung nomor angkatan dari tahun awal ajaran
 * Contoh: 2025 -> 17, 2026 -> 18
 */
export function calculateCohortFromYear(startYear: number): number {
	return startYear - COHORT_BASE_YEAR;
}

/**
 * Menghitung tahun awal ajaran dari nomor angkatan
 * Contoh: 17 -> 2025, 18 -> 2026
 */
export function calculateYearFromCohort(cohort: number): number {
	return cohort + COHORT_BASE_YEAR;
}

/**
 * Menghitung rentang tahun ajaran dari nomor angkatan
 * Contoh: 17 -> "2025/2026", 18 -> "2026/2027"
 */
export function getAcademicYearFromCohort(cohort: number): string {
	const startYear = calculateYearFromCohort(cohort);
	return `${startYear}/${startYear + 1}`;
}

/**
 * Menghasilkan opsi angkatan & tahun ajaran secara dinamis
 * berdasarkan tahun kalender berjalan tanpa perlu intervensi hardcode developer.
 * Menghasilkan pilihan dari (tahun sekarang - 2) hingga (tahun sekarang + 2)
 */
export function getDynamicCohortOptions(
	referenceDate: Date = new Date(),
): DynamicCohortOption[] {
	const currentYear = referenceDate.getFullYear();
	// Jika bulan >= Juni (5), tahun ajaran target utama biasanya adalah tahun berjalan
	// PMB merekrut untuk tahun ajaran aktif dan tahun ajaran berikutnya
	const activeStartYear = currentYear;

	const options: DynamicCohortOption[] = [];

	// Menampilkan range dari 2 tahun lalu sampai 2 tahun ke depan
	for (let offset = -2; offset <= 2; offset++) {
		const startYear = activeStartYear + offset;
		const cohort = calculateCohortFromYear(startYear);
		const academicYear = `${startYear}/${startYear + 1}`;
		const isCurrent = offset === 0;

		options.push({
			cohort,
			academicYear,
			label: `Angkatan ${cohort} (${academicYear})${isCurrent ? " - Aktif" : ""}`,
			isCurrent,
		});
	}

	return options;
}

/**
 * Mendapatkan opsi angkatan default untuk tahun berjalan
 */
export function getDefaultCohortOption(
	referenceDate: Date = new Date(),
): DynamicCohortOption {
	const currentYear = referenceDate.getFullYear();
	const cohort = calculateCohortFromYear(currentYear);
	const academicYear = `${currentYear}/${currentYear + 1}`;
	return {
		cohort,
		academicYear,
		label: `Angkatan ${cohort} (${academicYear}) - Aktif`,
		isCurrent: true,
	};
}
