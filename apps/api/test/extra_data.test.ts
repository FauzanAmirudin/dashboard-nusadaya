import { describe, expect, it } from "bun:test";
import { normalizeExtraData } from "../src/lib/extra-data";

describe("normalizeExtraData", () => {
	it("input kosong berarti tidak pernah dan tanpa isian lain", () => {
		const r = normalizeExtraData(undefined);
		expect(r.hasBoneFracture).toBe(false);
		expect(r.hasSurgery).toBe(false);
		expect(r.lastEducation).toBeUndefined();
		expect(r.priorCollege).toBeUndefined();
	});

	it("menyimpan detail patah tulang hanya bila 'Ya' dan membersihkan tahun", () => {
		const r = normalizeExtraData({
			hasBoneFracture: "Ya",
			boneFractureLocation: "  Lengan kanan ",
			boneFractureYear: "2021",
			hasSurgery: false,
			surgeryType: "abaikan",
		});
		expect(r.boneFractureLocation).toBe("Lengan kanan");
		expect(r.boneFractureYear).toBe(2021);
		expect(r.surgeryType).toBeUndefined();
	});

	it("menolak tahun tidak wajar", () => {
		expect(
			normalizeExtraData({
				hasSurgery: true,
				surgeryType: "X",
				surgeryYear: "3099",
			}).surgeryYear,
		).toBeUndefined();
	});

	it("pendidikan terakhir hanya SMA, MA, SMK, Paket C", () => {
		expect(normalizeExtraData({ lastEducation: "SMK" }).lastEducation).toBe(
			"SMK",
		);
		expect(normalizeExtraData({ lastEducation: "Paket C" }).lastEducation).toBe(
			"Paket C",
		);
		expect(
			normalizeExtraData({ lastEducation: "S1" }).lastEducation,
		).toBeUndefined();
		expect(
			normalizeExtraData({ lastEducation: "SMP" }).lastEducation,
		).toBeUndefined();
	});

	it("rentang pendapatan hanya dari pilihan resmi", () => {
		const r = normalizeExtraData({
			ayahIncome: "3 - 5 juta",
			ibuIncome: "banyak",
			waliIncome: "> 10 juta",
		});
		expect(r.ayahIncome).toBe("3 - 5 juta");
		expect(r.ibuIncome).toBeUndefined();
		expect(r.waliIncome).toBe("> 10 juta");
	});

	it("nama perguruan tinggi dipangkas dan boleh kosong", () => {
		expect(
			normalizeExtraData({ priorCollege: "  Universitas X " }).priorCollege,
		).toBe("Universitas X");
		expect(
			normalizeExtraData({ priorCollege: "   " }).priorCollege,
		).toBeUndefined();
	});
});
