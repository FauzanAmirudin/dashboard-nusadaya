import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
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
import { JWT_SECRET } from "../src/middleware/auth";
import { createStudentPipeline } from "../src/routes/student/core";
import { pmbRoutes } from "../src/routes/student/pmb";

describe("Pembaruan Skema Keuangan & Penataan Dokumen PMB vs Magang (Poin 10 - 12)", () => {
	let adminToken: string;
	let superadminUser: any;

	beforeAll(async () => {
		superadminUser = await db.query.users.findFirst({
			where: eq(users.role, "superadmin"),
		});

		const signer = jwt({ name: "jwt", secret: JWT_SECRET });
		const mockSignApp = new Elysia()
			.use(signer)
			.get("/sign-admin", ({ jwt }: any) =>
				jwt.sign({
					id: superadminUser?.id || 32,
					username: superadminUser?.username || "superadmin",
					role: "superadmin",
					roles: ["superadmin"],
				}),
			);

		const res = await mockSignApp.handle(
			new Request("http://localhost/sign-admin"),
		);
		adminToken = await res.text();
	});

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

	it("TC-PMB-10 (Task 5.2): PMB dapat menginput Nominal DP Pendaftaran dan tersimpan di database", async () => {
		const testTimestamp = Date.now();
		const payload = {
			name: `Siswa DP Test ${testTimestamp}`,
			email: `test.dp.${testTimestamp}@example.com`,
			phone: "081234567888",
			gender: "Laki-laki",
			religion: "Islam",
			nationality: "Indonesia",
			addressStreet: "Jl. Pendidikan No. 1",
			addressProvince: "Bali",
			addressCity: "Kota Denpasar",
			addressDistrict: "Denpasar Barat",
			addressVillage: "Dauh Puri",
			schoolOrigin: "SMK 1",
			program: "D3 Perhotelan",
			cohort: 18,
			academicYear: "2026/2027",
		};

		const { student } = await createStudentPipeline(payload, superadminUser.id);
		expect(student).toBeDefined();

		// Setup test app with pmbRoutes
		const testApp = new Elysia({ prefix: "/students" })
			.use(jwt({ name: "jwt", secret: JWT_SECRET }))
			.derive(async () => ({
				user: {
					id: superadminUser.id,
					username: superadminUser.username,
					role: "superadmin",
					roles: ["superadmin"],
				},
			}))
			.use(pmbRoutes);

		// 1. Update payment-plan dengan nominal DP
		const updateRes = await testApp.handle(
			new Request(`http://localhost/students/${student.id}/pmb/payment-plan`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${adminToken}`,
				},
				body: JSON.stringify({
					totalBiaya: 25000000,
					pendaftaranDp: 3500000,
				}),
			}),
		);

		expect(updateRes.status).toBe(200);
		const updateJson = await updateRes.json();
		expect(updateJson.success).toBe(true);

		// Verifikasi data tersimpan di pmb_payment_plan
		const plan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, student.id),
		});
		expect(plan?.pendaftaranDp).toBe(3500000);
		expect(plan?.totalBiaya).toBe(25000000);

		// 2. Verifikasi status sinkronisasi Finance
		// Awal: belum lunas
		const initialFin = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, student.id),
		});
		expect(initialFin?.registrasiStatus).toBe(false);

		// Ketika Finance menandai lunas
		await db
			.update(financeData)
			.set({ registrasiStatus: true })
			.where(eq(financeData.studentId, student.id));

		const updatedFin = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, student.id),
		});
		expect(updatedFin?.registrasiStatus).toBe(true);

		await cleanupTestStudent(student.id, student.studentUserId);
	});

	it("TC-PMB-11-12 (Task 5.3): ACC PMB berhasil dengan 14 indikator pendaftaran wajib (tanpa visa, MCU full, dan sertifikat bahasa)", async () => {
		const testTimestamp = Date.now();
		const payload = {
			name: `Siswa ACC 14 ${testTimestamp}`,
			email: `test.acc.${testTimestamp}@example.com`,
			phone: "081234567889",
			gender: "Perempuan",
			religion: "Hindu",
			nationality: "Indonesia",
			addressStreet: "Jl. Raya Sesetan",
			addressProvince: "Bali",
			addressCity: "Kota Denpasar",
			addressDistrict: "Denpasar Selatan",
			addressVillage: "Sesetan",
			schoolOrigin: "SMA 1",
			program: "D3 Perhotelan",
			cohort: 18,
			academicYear: "2026/2027",
		};

		const { student } = await createStudentPipeline(payload, superadminUser.id);
		expect(student).toBeDefined();

		// Set seluruh 14 indikator pendaftaran awal wajib menjadi true di pmb_data
		// KOSONGKAN/FALSE-kan: docPassportVisa, docMcu, docSertifikasiBahasa, docBpjs
		await db
			.update(pmbData)
			.set({
				formReceived: true,
				documentsComplete: true,
				dataInputted: true,
				initialFollowUp: true,
				pasFoto: true,
				docKtp: true,
				docKk: true,
				docCv: true,
				docIjazah: true,
				docTranskrip: true,
				docPassportDepan: true,
				docSkbm: true,
				docPreMcu: true,
				docSla: true,
				// Poin 11 & 12: Berkas berikut OPSIONAL di PMB
				docPassportVisa: false,
				docMcu: false,
				docSertifikasiBahasa: false,
				docBpjs: false,
			})
			.where(eq(pmbData.studentId, student.id));

		const testApp = new Elysia({ prefix: "/students" })
			.use(jwt({ name: "jwt", secret: JWT_SECRET }))
			.derive(async () => ({
				user: {
					id: superadminUser.id,
					username: superadminUser.username,
					role: "superadmin",
					roles: ["superadmin"],
				},
			}))
			.use(pmbRoutes);

		// Eksekusi ACC PMB
		const accRes = await testApp.handle(
			new Request(`http://localhost/students/${student.id}/pmb/acc`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			}),
		);

		expect(accRes.status).toBe(200);
		const accJson = await accRes.json();
		expect(accJson.success).toBe(true);

		// Verifikasi status mahasiswa di database telah berstatus ACC
		const studentPmb = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, student.id),
		});
		expect(studentPmb?.isAcc).toBe(true);
		expect(studentPmb?.status).toBe("ACC");

		// Verifikasi pembatalan ACC jika salah satu dari 14 indikator hilang
		await db
			.update(pmbData)
			.set({ isAcc: false, status: "PERLU_PERHATIAN", docSla: false })
			.where(eq(pmbData.studentId, student.id));

		const failedAccRes = await testApp.handle(
			new Request(`http://localhost/students/${student.id}/pmb/acc`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${adminToken}`,
				},
			}),
		);

		expect(failedAccRes.status).toBe(400);
		const failedJson = await failedAccRes.json();
		expect(failedJson.success).toBe(false);
		expect(failedJson.message).toContain("dokumen wajib PMB (9)");

		await cleanupTestStudent(student.id, student.studentUserId);
	});
});
