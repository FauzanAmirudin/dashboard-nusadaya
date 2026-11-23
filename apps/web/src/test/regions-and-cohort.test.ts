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
		// Patokan: Angkatan 17 = tahun ajaran 2026/2027
		expect(calculateCohortFromYear(2026)).toBe(17);
		expect(calculateCohortFromYear(2027)).toBe(18);
		expect(calculateYearFromCohort(17)).toBe(2026);
		expect(calculateYearFromCohort(18)).toBe(2027);
		expect(getAcademicYearFromCohort(17)).toBe("2026/2027");
		expect(getAcademicYearFromCohort(18)).toBe("2027/2028");

		const fixed2026 = new Date(2026, 4, 1);
		const default2026 = getDefaultCohortOption(fixed2026);
		expect(default2026.cohort).toBe(17);
		expect(default2026.academicYear).toBe("2026/2027");

		const options2026 = getDynamicCohortOptions(fixed2026);
		expect(
			options2026.some(
				(o) => o.cohort === 17 && o.academicYear === "2026/2027",
			),
		).toBe(true);
		expect(
			options2026.some(
				(o) => o.cohort === 16 && o.academicYear === "2025/2026",
			),
		).toBe(true);
	});
});
