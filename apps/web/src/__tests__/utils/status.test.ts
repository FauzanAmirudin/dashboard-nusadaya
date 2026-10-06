import { describe, expect, it } from "bun:test";
import {
	calculateOverallStatus,
	calculateProgressStatus,
	normalizeStatus,
	type PanelStatusType,
} from "../../utils/status";

describe("Tahap 1.7 - 1.9: status.ts", () => {
	// Task 1.7: calculateProgressStatus()
	describe("Task 1.7 — calculateProgressStatus()", () => {
		it("should always return 'ACC' when isAcc is true regardless of progress", () => {
			expect(calculateProgressStatus(0, 10, true)).toBe("ACC");
			expect(calculateProgressStatus(3, 10, true)).toBe("ACC");
			expect(calculateProgressStatus(10, 10, true)).toBe("ACC");
		});

		it("should return 'AMAN' when completed >= total and not ACC", () => {
			expect(calculateProgressStatus(10, 10, false)).toBe("AMAN");
			expect(calculateProgressStatus(12, 10, false)).toBe("AMAN");
		});

		it("should return 'AMAN' when total <= 0 (edge case empty checklist)", () => {
			expect(calculateProgressStatus(0, 0, false)).toBe("AMAN");
			expect(calculateProgressStatus(0, -1, false)).toBe("AMAN");
		});

		it("should return 'PROSES' when progress is greater than 30%", () => {
			// 4 out of 10 = 40% > 30% -> PROSES
			expect(calculateProgressStatus(4, 10, false)).toBe("PROSES");
			// 7 out of 10 = 70% > 30% -> PROSES
			expect(calculateProgressStatus(7, 10, false)).toBe("PROSES");
			// 3.1 out of 10 = 31% > 30% -> PROSES
			expect(calculateProgressStatus(31, 100, false)).toBe("PROSES");
		});

		it("should return 'BUTUH_PERHATIAN' when progress is <= 30%", () => {
			// 0 out of 10 = 0% -> BUTUH_PERHATIAN
			expect(calculateProgressStatus(0, 10, false)).toBe("BUTUH_PERHATIAN");
			// 3 out of 10 = 30% <= 30% -> BUTUH_PERHATIAN
			expect(calculateProgressStatus(3, 10, false)).toBe("BUTUH_PERHATIAN");
			// 1 out of 10 = 10% <= 30% -> BUTUH_PERHATIAN
			expect(calculateProgressStatus(1, 10, false)).toBe("BUTUH_PERHATIAN");
		});
	});

	// Task 1.8: normalizeStatus()
	describe("Task 1.8 — normalizeStatus()", () => {
		it("should return 'ACC' when isAcc is true", () => {
			expect(normalizeStatus("PROSES", true)).toBe("ACC");
			expect(normalizeStatus("BUTUH_PERHATIAN", true)).toBe("ACC");
			expect(normalizeStatus(null, true)).toBe("ACC");
		});

		it("should return 'AMAN' for rawStatus 'AMAN'", () => {
			expect(normalizeStatus("AMAN")).toBe("AMAN");
			expect(normalizeStatus("aman")).toBe("AMAN");
		});

		it("should return 'ACC' for rawStatus 'ACC'", () => {
			expect(normalizeStatus("ACC")).toBe("ACC");
			expect(normalizeStatus("acc")).toBe("ACC");
		});

		it("should return 'PROSES' for rawStatus 'PROSES'", () => {
			expect(normalizeStatus("PROSES")).toBe("PROSES");
			expect(normalizeStatus("proses")).toBe("PROSES");
		});

		it("should map legacy 'PERLU_PERHATIAN' to 'PROSES'", () => {
			expect(normalizeStatus("PERLU_PERHATIAN")).toBe("PROSES");
			expect(normalizeStatus("perlu_perhatian")).toBe("PROSES");
		});

		it("should map 'TIDAK_AMAN', 'BLOCKING', 'KENDALA' to 'BUTUH_PERHATIAN'", () => {
			expect(normalizeStatus("TIDAK_AMAN")).toBe("BUTUH_PERHATIAN");
			expect(normalizeStatus("BLOCKING")).toBe("BUTUH_PERHATIAN");
			expect(normalizeStatus("KENDALA")).toBe("BUTUH_PERHATIAN");
			expect(normalizeStatus("tidak_aman")).toBe("BUTUH_PERHATIAN");
		});

		it("should return 'BUTUH_PERHATIAN' for null or undefined rawStatus", () => {
			expect(normalizeStatus(null)).toBe("BUTUH_PERHATIAN");
			expect(normalizeStatus(undefined)).toBe("BUTUH_PERHATIAN");
			expect(normalizeStatus("")).toBe("BUTUH_PERHATIAN");
		});

		it("should fallback unknown status to 'PROSES'", () => {
			expect(normalizeStatus("UNKNOWN_STATUS")).toBe("PROSES");
			expect(normalizeStatus("REVIEW")).toBe("PROSES");
		});
	});

	// Task 1.9: calculateOverallStatus()
	describe("Task 1.9 — calculateOverallStatus()", () => {
		it("should return 'ACC' when all modules are ACC", () => {
			const modules: PanelStatusType[] = ["ACC", "ACC", "ACC"];
			expect(calculateOverallStatus(modules)).toBe("ACC");
		});

		it("should return 'BUTUH_PERHATIAN' if any module is BUTUH_PERHATIAN (highest priority)", () => {
			expect(
				calculateOverallStatus(["ACC", "BUTUH_PERHATIAN", "PROSES", "AMAN"]),
			).toBe("BUTUH_PERHATIAN");
			expect(calculateOverallStatus(["ACC", "ACC", "BUTUH_PERHATIAN"])).toBe(
				"BUTUH_PERHATIAN",
			);
		});

		it("should return 'PROSES' if there is PROSES and no BUTUH_PERHATIAN", () => {
			expect(calculateOverallStatus(["ACC", "PROSES", "ACC"])).toBe("PROSES");
			expect(calculateOverallStatus(["AMAN", "PROSES"])).toBe("PROSES");
		});

		it("should return 'AMAN' for combination of AMAN and ACC", () => {
			expect(calculateOverallStatus(["AMAN", "ACC", "AMAN"])).toBe("AMAN");
			expect(calculateOverallStatus(["AMAN", "AMAN"])).toBe("AMAN");
		});

		it("should return 'AMAN' for an empty modules array", () => {
			expect(calculateOverallStatus([])).toBe("AMAN");
		});

		it("should correctly handle module objects with isAcc: true", () => {
			const modules = [
				{ status: "PROSES", isAcc: true },
				{ status: "AMAN", isAcc: true },
			];
			expect(calculateOverallStatus(modules)).toBe("ACC");
		});

		it("should correctly handle module objects with status property", () => {
			const modules = [
				{ status: "ACC", isAcc: false },
				{ status: "PROSES", isAcc: false },
			];
			expect(calculateOverallStatus(modules)).toBe("PROSES");
		});

		it("should treat null or undefined item in modules as BUTUH_PERHATIAN", () => {
			const modules = ["ACC", null as any];
			expect(calculateOverallStatus(modules)).toBe("BUTUH_PERHATIAN");
		});
	});
});
