import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

describe("Verifikasi UI Periode Akademik & Pergantian Semester", () => {
	const filePath = path.resolve(
		process.cwd(),
		"apps/web/src/app/dashboard/akademik/periode/page.tsx",
	);
	const fileContent = fs.readFileSync(filePath, "utf-8");

	it("Poin 1: Tombol dan judul modal tidak mengandung kata 'Wizard'", () => {
		// Pastikan tombol header adalah 'Pergantian Semester' tanpa kata 'Wizard'
		expect(fileContent).toContain("Pergantian Semester");
		expect(fileContent).not.toContain("Wizard Pergantian Semester");
	});

	it("Poin 2: Tampilan pilihan periode tujuan mendeskripsikan nama & tahun ajaran, bukan sekedar ID", () => {
		// Pastikan SelectValue menyajikan format label yang mendeskripsikan periode (name, academicYear, semesterType)
		expect(fileContent).toContain("selectedTargetTerm.name");
		expect(fileContent).toContain("selectedTargetTerm.academicYear");
		expect(fileContent).toContain("selectedTargetTerm.semesterType");
		// Pastikan terdapat kotak ringkasan Detail Periode Tujuan Terpilih
		expect(fileContent).toContain("Detail Periode Tujuan Terpilih:");
	});

	it("Poin 3: Tidak menggunakan confirm/alert bawaan browser, melainkan AlertDialog UI project", () => {
		// Pastikan tidak ada pemanggilan confirm(...) bawaan browser
		expect(fileContent).not.toMatch(/\bconfirm\s*\(/);
		expect(fileContent).not.toMatch(/\balert\s*\(/);

		// Pastikan menggunakan komponen AlertDialog dari @/components/ui/alert-dialog
		expect(fileContent).toContain("@/components/ui/alert-dialog");
		expect(fileContent).toContain("<AlertDialog");
		expect(fileContent).toContain("Konfirmasi Pergantian Semester");
		expect(fileContent).toContain("Aktifkan Periode Akademik?");
	});
});
