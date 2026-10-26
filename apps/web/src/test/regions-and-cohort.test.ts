import { describe, expect, it } from "bun:test";
import {
	calculateCohortFromYear,
	calculateYearFromCohort,
	getAcademicYearFromCohort,
	getDefaultCohortOption,
	getDynamicCohortOptions,
} from "../lib/cohort-generator";
import {
	getCities,
	getDistricts,
	getProvinces,
	getVillages,
} from "../lib/regions";

describe("Task 6.5: Pemilihan Wilayah Bertingkat & Angkatan Otomatis", () => {
	it("Provinsi berjumlah 38 dan terurut secara alfabetis (A-Z)", () => {
		const provinces = getProvinces();
		expect(provinces.length).toBe(38);
		expect(provinces[0]).toBe("Aceh");
		expect(provinces[provinces.length - 1]).toBe("Sumatera Utara");

		// Verifikasi keterurutan A-Z
		const sorted = [...provinces].sort((a, b) => a.localeCompare(b, "id"));
		expect(provinces).toEqual(sorted);
	});

	it("Kabupaten/Kota terurut A-Z dan tersaring sesuai provinsi (Bali)", () => {
		const cities = getCities("Bali");
		expect(cities.length).toBe(9);
		expect(cities).toContain("Kota Denpasar");
		expect(cities).toContain("Kabupaten Badung");

		const sorted = [...cities].sort((a, b) => a.localeCompare(b, "id"));
		expect(cities).toEqual(sorted);
	});

	it("Kecamatan untuk Kota Denpasar dapat diambil dan terurut A-Z", async () => {
		const districts = await getDistricts("Bali", "Kota Denpasar");
		expect(districts.length).toBe(4);
		expect(districts).toContain("Denpasar Selatan");
		expect(districts).toContain("Denpasar Barat");

		const sorted = [...districts].sort((a, b) => a.localeCompare(b, "id"));
		expect(districts).toEqual(sorted);
	});

	it("Kelurahan untuk Denpasar Selatan dapat diambil dan terurut A-Z", async () => {
		const villages = await getVillages(
			"Bali",
			"Kota Denpasar",
			"Denpasar Selatan",
		);
		expect(villages.length).toBe(10);
		expect(villages).toContain("Sanur");
		expect(villages).toContain("Sidakarya");

		const sorted = [...villages].sort((a, b) => a.localeCompare(b, "id"));
		expect(villages).toEqual(sorted);
	});

	it("Kecamatan & Kelurahan di luar Bali (contoh: Lampung - Kota Bandar Lampung) dapat diambil dengan benar", async () => {
		const districts = await getDistricts("Lampung", "Kota Bandar Lampung");
		expect(districts.length).toBeGreaterThan(0);
		expect(districts).toContain("Bumi Waras");

		const villages = await getVillages(
			"Lampung",
			"Kota Bandar Lampung",
			"Bumi Waras",
		);
		expect(villages.length).toBeGreaterThan(0);
	});

	it("Generator Angkatan menghitung tahun ajaran dan angkatan secara dinamis", () => {
		// Verifikasi rumus kalkulasi
		expect(calculateCohortFromYear(2025)).toBe(17);
		expect(calculateCohortFromYear(2026)).toBe(18);
		expect(calculateYearFromCohort(17)).toBe(2025);
		expect(calculateYearFromCohort(18)).toBe(2026);
		expect(getAcademicYearFromCohort(17)).toBe("2025/2026");
		expect(getAcademicYearFromCohort(18)).toBe("2026/2027");

		const fixed2025 = new Date(2025, 4, 1);
		const default2025 = getDefaultCohortOption(fixed2025);
		expect(default2025.cohort).toBe(17);
		expect(default2025.academicYear).toBe("2025/2026");

		const options2025 = getDynamicCohortOptions(fixed2025);
		expect(
			options2025.some(
				(o) => o.cohort === 17 && o.academicYear === "2025/2026",
			),
		).toBe(true);
		expect(
			options2025.some(
				(o) => o.cohort === 18 && o.academicYear === "2026/2027",
			),
		).toBe(true);
	});
});
