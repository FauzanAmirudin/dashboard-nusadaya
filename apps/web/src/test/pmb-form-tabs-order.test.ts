import { describe, expect, it } from "bun:test";
import fs from "fs";
import path from "path";

describe("Verifikasi Urutan Tab Formulir PMB & Sinkronisasi Wali", () => {
	it("Urutan TABS pada students/add/page.tsx harus: Mahasiswa, Pendidikan, Kesehatan, Wali, Ayah, Ibu, Informasi PMB", () => {
		const filePath = path.resolve(
			__dirname,
			"../app/dashboard/students/add/page.tsx",
		);
		const content = fs.readFileSync(filePath, "utf-8");

		const tabsMatch = content.match(/const TABS = \[([\s\S]*?)\];/);
		expect(tabsMatch).not.toBeNull();

		const tabs = (tabsMatch![1].match(/"([^"]+)"/g) || []).map((s) =>
			s.replace(/"/g, ""),
		);
		expect(tabs).toEqual([
			"Keterangan Mahasiswa",
			"Keterangan Pendidikan",
			"Keterangan Kesehatan",
			"Keterangan Wali",
			"Keterangan Ayah Kandung",
			"Keterangan Ibu Kandung",
			"Informasi PMB & Rekomendasi",
		]);
	});

	it("Urutan TABS pada students/[id]/edit/page.tsx harus: Mahasiswa, Pendidikan, Kesehatan, Wali, Ayah, Ibu, Informasi PMB", () => {
		const filePath = path.resolve(
			__dirname,
			"../app/dashboard/students/[id]/edit/page.tsx",
		);
		const content = fs.readFileSync(filePath, "utf-8");

		const tabsMatch = content.match(/const TABS = \[([\s\S]*?)\];/);
		expect(tabsMatch).not.toBeNull();

		const tabs = (tabsMatch![1].match(/"([^"]+)"/g) || []).map((s) =>
			s.replace(/"/g, ""),
		);
		expect(tabs).toEqual([
			"Keterangan Mahasiswa",
			"Keterangan Pendidikan",
			"Keterangan Kesehatan",
			"Keterangan Wali",
			"Keterangan Ayah Kandung",
			"Keterangan Ibu Kandung",
			"Informasi PMB & Rekomendasi",
		]);
	});

	it("Tab Wali (index 3) muncul sebelum Tab Ayah (index 4) dan Tab Ibu (index 5) pada JSX", () => {
		const addContent = fs.readFileSync(
			path.resolve(__dirname, "../app/dashboard/students/add/page.tsx"),
			"utf-8",
		);

		const waliIdx = addContent.indexOf("currentTab === 3");
		const ayahIdx = addContent.indexOf("currentTab === 4");
		const ibuIdx = addContent.indexOf("currentTab === 5");

		expect(waliIdx).toBeGreaterThan(0);
		expect(ayahIdx).toBeGreaterThan(waliIdx);
		expect(ibuIdx).toBeGreaterThan(ayahIdx);
	});

	it("Simulasi fungsi updateData: jika waliRole adalah ayah, data ayah otomatis tersalin ke data wali", () => {
		let formData: any = {
			waliRole: "ayah",
			ayahName: "",
			waliName: "",
			ayahPhone: "",
			waliPhone: "",
			waliGuardianRelation: "",
		};

		const updateData = (key: string, value: any) => {
			formData = { ...formData, [key]: value };
			if (formData.waliRole === "ayah") {
				if (key === "ayahName") formData.waliName = value;
				if (key === "ayahPhone") formData.waliPhone = value;
				formData.waliGuardianRelation = "Ayah Kandung";
			}
		};

		updateData("ayahName", "Bambang Pamungkas");
		updateData("ayahPhone", "081234567890");

		expect(formData.waliName).toBe("Bambang Pamungkas");
		expect(formData.waliPhone).toBe("081234567890");
		expect(formData.waliGuardianRelation).toBe("Ayah Kandung");
	});
});
