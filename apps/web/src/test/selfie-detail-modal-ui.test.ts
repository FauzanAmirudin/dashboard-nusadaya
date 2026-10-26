import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

describe("Verifikasi Tampilan Modal Bukti Absen (SelfieDetailModal)", () => {
	const filePath = path.resolve(
		process.cwd(),
		"apps/web/src/components/panels/kehadiran/SelfieDetailModal.tsx",
	);
	const content = fs.readFileSync(filePath, "utf-8");

	it("Teks judul kolom ringkas dan tidak terbungkus berantakan", () => {
		// Pastikan teks header kolom tidak menggunakan string kepanjangan yang memicu text wrap
		expect(content).not.toContain("Foto Selfie Ber-Watermark");
		expect(content).not.toContain("POSISI SATELIT GPS & JARAK KAMPUS");
		expect(content).toContain("Foto Selfie");
		expect(content).toContain("Geolokasi GPS");
	});

	it("Badge status dan label ringkas serta rapi", () => {
		expect(content).toContain("Dalam Radius");
		expect(content).toContain("Luar Radius");
		expect(content).toContain("Auto Approved");
		expect(content).toContain("Disetujui");
		expect(content).toContain("Ditolak");
	});

	it("Tidak ada tanda kurung kosong '()' saat NIM mahasiswa kosong", () => {
		expect(content).toContain("record.student?.nim ?");
		expect(content).toContain("record.student.nim");
	});

	it("Ukuran tinggi peta dan foto pas dan proporsional (210-220px)", () => {
		expect(content).toContain('height="210px"');
		expect(content).not.toContain('height="280px"');
	});

	it("Tombol footer ringkas dan rapi", () => {
		expect(content).toContain("Tolak Presensi");
		expect(content).toContain("Setujui");
		expect(content).not.toContain("Setujui (Approve)");
	});
});
