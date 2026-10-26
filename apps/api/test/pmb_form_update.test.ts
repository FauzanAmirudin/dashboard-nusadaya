import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
	academicData,
	auditLogs,
	crmData,
	finalDecision,
	financeData,
	financeSemesters,
	internshipData,
	paData,
	pmbData,
	pmbPaymentPlan,
	studentHealth,
	studentParents,
	students,
	users,
} from "../src/db/schema";
import { createStudentPipeline } from "../src/routes/student/core";

describe("Pembaruan Formulir PMB & Superadmin (Poin 1 - 9)", () => {
	async function getAdminId() {
		const u = await db.query.users.findFirst();
		return u?.id || 32;
	}

	async function cleanupTestStudent(
		studentId: number,
		studentUserId?: number | null,
	) {
		await db.delete(auditLogs).where(eq(auditLogs.entityId, studentId));
		await db.delete(academicData).where(eq(academicData.studentId, studentId));
		await db.delete(crmData).where(eq(crmData.studentId, studentId));
		await db
			.delete(financeSemesters)
			.where(eq(financeSemesters.studentId, studentId));
		await db.delete(financeData).where(eq(financeData.studentId, studentId));
		await db
			.delete(internshipData)
			.where(eq(internshipData.studentId, studentId));
		await db.delete(paData).where(eq(paData.studentId, studentId));
		await db
			.delete(pmbPaymentPlan)
			.where(eq(pmbPaymentPlan.studentId, studentId));
		await db.delete(pmbData).where(eq(pmbData.studentId, studentId));
		await db
			.delete(finalDecision)
			.where(eq(finalDecision.studentId, studentId));
		await db
			.delete(studentHealth)
			.where(eq(studentHealth.studentId, studentId));
		await db
			.delete(studentParents)
			.where(eq(studentParents.studentId, studentId));
		await db.delete(students).where(eq(students.id, studentId));
		if (studentUserId) {
			await db.delete(users).where(eq(users.id, studentUserId));
		}
	}

	it("TC-PMB-01 (Task 6.1): Mahasiswa baru dapat dibuat dengan No. Rumah dan Jurusan Sekolah dikosongkan (opsional)", async () => {
		const adminId = await getAdminId();
		const testTimestamp = Date.now();
		const testEmail = `test.opsional.${testTimestamp}@example.com`;

		const payload = {
			name: `Siswa Opsional ${testTimestamp}`,
			email: testEmail,
			phone: "081234567890",
			gender: "Laki-laki",
			religion: "Islam",
			nationality: "Indonesia",
			addressStreet: "Jl. Merdeka No. 10",
			addressRt: "001",
			addressRw: "002",
			addressNo: "", // Kosong / opsional
			addressProvince: "Bali",
			addressCity: "Kota Denpasar",
			addressDistrict: "Denpasar Barat",
			addressVillage: "Dauh Puri",
			livingWith: "Orang tua",
			schoolOrigin: "SMK Negeri 1 Denpasar",
			schoolMajor: "", // Kosong / opsional
			graduationYear: 2024,
			schoolAddress: "Jl. Cokroaminoto",
			program: "D3 Perhotelan",
			subProgram: "Indonesia-Reguler",
			classType: "Blended Learning (Online & Offline)",
			cohort: 18,
			academicYear: "2026/2027",
			bloodType: "Belum Diketahui",
			height: 170,
			weight: 60,
			clothingSize: "L",
			diseaseHistory: "Tidak ada",
			congenitalDisease: "Tidak ada",
			hasBoneFracture: false,
			hasSurgery: false,
		};

		const res = await createStudentPipeline(payload, adminId);
		expect(res.student).toBeDefined();
		expect(res.student.name).toBe(payload.name);
		expect(res.student.addressNo).toBeNull();
		expect(res.student.schoolMajor).toBeNull();
		expect(res.student.classType).toBe("Blended Learning (Online & Offline)");

		await cleanupTestStudent(res.student.id, res.student.studentUserId);
	});

	it("TC-PMB-02 (Task 6.2): Penyimpanan riwayat patah tulang & operasi dengan rincian dan tahun", async () => {
		const adminId = await getAdminId();
		const testTimestamp = Date.now();
		const testEmail = `test.kesehatan.${testTimestamp}@example.com`;

		const payload = {
			name: `Siswa Medis ${testTimestamp}`,
			email: testEmail,
			phone: "081234567891",
			gender: "Perempuan",
			religion: "Hindu",
			nationality: "Indonesia",
			addressStreet: "Jl. Sudirman No. 5",
			addressRt: "002",
			addressRw: "003",
			addressProvince: "Bali",
			addressCity: "Kabupaten Badung",
			addressDistrict: "Kuta Utara",
			addressVillage: "Dalung",
			livingWith: "Orang tua",
			schoolOrigin: "SMA Negeri 1 Kuta",
			graduationYear: 2023,
			schoolAddress: "Jl. Raya Kuta",
			program: "D3 Perhotelan",
			cohort: 18,
			academicYear: "2026/2027",
			bloodType: "Belum Diketahui",
			height: 165,
			weight: 52,
			clothingSize: "M",
			diseaseHistory: "Pernah patah tulang lengan",
			congenitalDisease: "Tidak ada",
			hasBoneFracture: true,
			boneFractureLocation: "Lengan Kanan",
			boneFractureYear: 2021,
			hasSurgery: true,
			surgeryType: "Operasi Usus Buntu",
			surgeryYear: 2022,
		};

		const res = await createStudentPipeline(payload, adminId);
		expect(res.student).toBeDefined();

		// Verifikasi data di tabel student_health
		const health = await db.query.studentHealth.findFirst({
			where: eq(studentHealth.studentId, res.student.id),
		});
		expect(health).toBeDefined();
		expect(health?.bloodType).toBe("Belum Diketahui");
		expect(health?.hasBoneFracture).toBe(true);
		expect(health?.boneFractureLocation).toBe("Lengan Kanan");
		expect(health?.boneFractureYear).toBe(2021);
		expect(health?.hasSurgery).toBe(true);
		expect(health?.surgeryType).toBe("Operasi Usus Buntu");
		expect(health?.surgeryYear).toBe(2022);

		await cleanupTestStudent(res.student.id, res.student.studentUserId);
	});

	it("TC-PMB-03 (Task 6.3): Penyederhanaan data orang tua (hanya Nama, Status, Kewarganegaraan)", async () => {
		const adminId = await getAdminId();
		const testTimestamp = Date.now();
		const testEmail = `test.ortu.${testTimestamp}@example.com`;

		const payload = {
			name: `Siswa Ortu ${testTimestamp}`,
			email: testEmail,
			phone: "081234567892",
			gender: "Laki-laki",
			religion: "Islam",
			nationality: "Indonesia",
			addressStreet: "Jl. Gatot Subroto",
			addressRt: "001",
			addressRw: "001",
			addressProvince: "Bali",
			addressCity: "Kota Denpasar",
			addressDistrict: "Denpasar Utara",
			addressVillage: "Tonja",
			livingWith: "Orang tua",
			schoolOrigin: "SMK Pariwisata",
			graduationYear: 2024,
			schoolAddress: "Jl. Ahmad Yani",
			program: "D3 Perhotelan",
			cohort: 18,
			academicYear: "2026/2027",
			bloodType: "O",
			height: 172,
			weight: 65,
			clothingSize: "XL",
			diseaseHistory: "Tidak ada",
			congenitalDisease: "Tidak ada",
			parents: [
				{
					type: "ayah",
					name: "Budi Santoso",
					status: "Hidup",
					nationality: "Indonesia",
				},
				{
					type: "ibu",
					name: "Siti Rahmawati",
					status: "Hidup",
					nationality: "Indonesia",
				},
			],
		};

		const res = await createStudentPipeline(payload, adminId);
		expect(res.student).toBeDefined();

		const parents = await db.query.studentParents.findMany({
			where: eq(studentParents.studentId, res.student.id),
		});
		expect(parents.length).toBe(2);
		const ayah = parents.find((p) => p.type === "ayah");
		expect(ayah?.name).toBe("Budi Santoso");
		expect(ayah?.status).toBe("Hidup");
		expect(ayah?.nationality).toBe("Indonesia");
		expect(ayah?.phone).toBeNull();
		expect(ayah?.email).toBeNull();

		await cleanupTestStudent(res.student.id, res.student.studentUserId);
	});

	it("TC-PMB-04 (Task 6.4): Alur sinkronisasi data wali dari Ayah Kandung", async () => {
		const adminId = await getAdminId();
		const testTimestamp = Date.now();
		const testEmail = `test.wali.${testTimestamp}@example.com`;

		const payload = {
			name: `Siswa Wali ${testTimestamp}`,
			email: testEmail,
			phone: "081234567893",
			gender: "Laki-laki",
			religion: "Islam",
			nationality: "Indonesia",
			addressStreet: "Jl. Diponegoro",
			addressRt: "003",
			addressRw: "004",
			addressProvince: "Bali",
			addressCity: "Kota Denpasar",
			addressDistrict: "Denpasar Selatan",
			addressVillage: "Sanur",
			livingWith: "Orang tua",
			schoolOrigin: "SMA Harapan",
			graduationYear: 2024,
			schoolAddress: "Jl. Raya Sesetan",
			program: "D3 Perhotelan",
			cohort: 18,
			academicYear: "2026/2027",
			bloodType: "B+",
			height: 168,
			weight: 58,
			clothingSize: "M",
			diseaseHistory: "Tidak ada",
			congenitalDisease: "Tidak ada",
			parents: [
				{
					type: "ayah",
					name: "Made Wardana",
					status: "Hidup",
					nationality: "Indonesia",
					phone: "081999888777",
				},
				{
					type: "ibu",
					name: "Ni Ketut Suartini",
					status: "Hidup",
					nationality: "Indonesia",
				},
				// Wali disinkronkan dari Ayah Kandung
				{
					type: "wali",
					name: "Made Wardana",
					status: "Hidup",
					nationality: "Indonesia",
					phone: "081999888777",
					guardianRelation: "Ayah Kandung",
				},
			],
		};

		const res = await createStudentPipeline(payload, adminId);
		expect(res.student).toBeDefined();

		const parents = await db.query.studentParents.findMany({
			where: eq(studentParents.studentId, res.student.id),
		});
		expect(parents.length).toBe(3);
		const wali = parents.find((p) => p.type === "wali");
		expect(wali).toBeDefined();
		expect(wali?.name).toBe("Made Wardana");
		expect(wali?.guardianRelation).toBe("Ayah Kandung");
		expect(wali?.phone).toBe("081999888777");

		await cleanupTestStudent(res.student.id, res.student.studentUserId);
	});
});
