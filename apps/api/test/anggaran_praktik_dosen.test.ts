import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import { courses, practicesBudgetRequests, users } from "../src/db/schema";
import { JWT_SECRET } from "../src/middleware/auth";

describe("Segmen 13: Anggaran Praktik Dosen & Tombol Persetujuan Finance (ACC/Tolak)", () => {
	let dosenToken: string;
	let otherDosenToken: string;
	let financeToken: string;
	let dosenId: number;
	let otherDosenId: number;
	let financeId: number;
	let practiceCourseId: number;
	let theoryCourseId: number;
	let createdRequestId: number;

	beforeAll(async () => {
		// Find or assign test users
		const existingDosen = await db.query.users.findFirst({
			where: eq(users.role, "dosen"),
		});
		dosenId = existingDosen?.id || 37;

		const allDosens = await db.query.users.findMany({
			where: eq(users.role, "dosen"),
			limit: 5,
		});
		const otherDosen = allDosens.find((d) => d.id !== dosenId) || {
			id: 9988,
			username: "dosen_other",
		};
		otherDosenId = otherDosen.id;

		const existingFinance = await db.query.users.findFirst({
			where: eq(users.role, "finance"),
		});
		financeId = existingFinance?.id || 1;

		const signer = jwt({ name: "jwt", secret: JWT_SECRET });
		const mockSignApp = new Elysia()
			.use(signer)
			.get("/sign-dosen", ({ jwt }: any) =>
				jwt.sign({
					id: dosenId,
					username: "dosen_test",
					role: "dosen",
					roles: ["dosen"],
				}),
			)
			.get("/sign-other-dosen", ({ jwt }: any) =>
				jwt.sign({
					id: otherDosenId,
					username: "other_dosen_test",
					role: "dosen",
					roles: ["dosen"],
				}),
			)
			.get("/sign-finance", ({ jwt }: any) =>
				jwt.sign({
					id: financeId,
					username: "finance_test",
					role: "finance",
					roles: ["finance"],
				}),
			);

		const resDosen = await mockSignApp.handle(
			new Request("http://localhost/sign-dosen"),
		);
		dosenToken = await resDosen.text();

		const resOtherDosen = await mockSignApp.handle(
			new Request("http://localhost/sign-other-dosen"),
		);
		otherDosenToken = await resOtherDosen.text();

		const resFinance = await mockSignApp.handle(
			new Request("http://localhost/sign-finance"),
		);
		financeToken = await resFinance.text();

		// Find or create a practice course and a theory course taught by dosenId
		let pCourse = await db.query.courses.findFirst({
			where: and(eq(courses.type, "praktik"), eq(courses.dosenId, dosenId)),
		});
		if (!pCourse) {
			const [inserted] = await db
				.insert(courses)
				.values({
					code: "TEST-PRAKTIK-01",
					name: "Praktik Barista & Tata Hidang",
					type: "praktik",
					dosenId: dosenId,
					cohort: 14,
					rombel: "Kelas A",
					sks: 3,
				})
				.returning();
			pCourse = inserted;
		}
		practiceCourseId = pCourse.id;

		let tCourse = await db.query.courses.findFirst({
			where: and(eq(courses.type, "teori"), eq(courses.dosenId, dosenId)),
		});
		if (!tCourse) {
			const [inserted] = await db
				.insert(courses)
				.values({
					code: "TEST-TEORI-01",
					name: "Pengantar Komunikasi Bisnis",
					type: "teori",
					dosenId: dosenId,
					cohort: 14,
					rombel: "Kelas A",
					sks: 2,
				})
				.returning();
			tCourse = inserted;
		}
		theoryCourseId = tCourse.id;
	});

	it("TC-PRAKTIK-01: Dosen pengampu berhasil mengajukan kebutuhan & anggaran bahan praktik", async () => {
		const payload = {
			courseId: practiceCourseId,
			daftarKebutuhan: [
				{
					namaItem: "Biji Kopi Arabika 1kg",
					jumlah: 3,
					satuan: "pack",
					satuanHarga: 120000,
				},
				{
					namaItem: "Susu UHT Fresh 1L",
					jumlah: 10,
					satuan: "kotak",
					satuanHarga: 18000,
				},
			],
			totalNominal: 540000,
		};

		const res = await app.handle(
			new Request(
				`http://localhost:3001/courses/${practiceCourseId}/budget-requests`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${dosenToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				},
			),
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);
		expect(json.data).toBeDefined();
		expect(json.data.courseId).toBe(practiceCourseId);
		expect(json.data.totalNominal).toBe(540000);
		expect(json.data.status).toBe("menunggu");
		expect(json.data.daftarKebutuhan).toHaveLength(2);

		createdRequestId = json.data.id;
	});

	it("TC-PRAKTIK-02: Dosen ditolak saat mengajukan anggaran praktik pada mata kuliah teori", async () => {
		const payload = {
			courseId: theoryCourseId,
			daftarKebutuhan: [
				{
					namaItem: "Kertas Modul",
					jumlah: 1,
					satuan: "rim",
					satuanHarga: 50000,
				},
			],
			totalNominal: 50000,
		};

		const res = await app.handle(
			new Request(
				`http://localhost:3001/courses/${theoryCourseId}/budget-requests`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${dosenToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				},
			),
		);

		expect(res.status).toBe(400);
		const json = (await res.json()) as any;
		expect(json.success).toBe(false);
		expect(json.message).toContain("hanya berlaku untuk mata kuliah praktik");
	});

	it("TC-PRAKTIK-03: Dosen lain yang bukan pengampu dilarang mengajukan anggaran pada matkul tersebut", async () => {
		const payload = {
			courseId: practiceCourseId,
			daftarKebutuhan: [
				{
					namaItem: "Item Ilegal",
					jumlah: 1,
					satuan: "pcs",
					satuanHarga: 100000,
				},
			],
			totalNominal: 100000,
		};

		const res = await app.handle(
			new Request(
				`http://localhost:3001/courses/${practiceCourseId}/budget-requests`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${otherDosenToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				},
			),
		);

		expect(res.status).toBe(403);
	});

	it("TC-PRAKTIK-04: GET /courses/:id/budget-requests menampilkan riwayat pengajuan dengan status menunggu", async () => {
		const res = await app.handle(
			new Request(
				`http://localhost:3001/courses/${practiceCourseId}/budget-requests`,
				{
					method: "GET",
					headers: { Authorization: `Bearer ${dosenToken}` },
				},
			),
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);
		expect(Array.isArray(json.data)).toBe(true);
		const item = json.data.find((r: any) => r.id === createdRequestId);
		expect(item).toBeDefined();
		expect(item.status).toBe("menunggu");
	});

	it("TC-PRAKTIK-05: Finance menolak pengajuan disertai alasan penolakan tertulis", async () => {
		const alasan =
			"Mohon kurangi jumlah kuantitas susu UHT menjadi 5 kotak saja sesuai estimasi peserta.";

		const res = await app.handle(
			new Request(
				`http://localhost:3001/finance/anggaran-praktik/${createdRequestId}/reject`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${financeToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ catatanFinance: alasan }),
				},
			),
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);

		// Verify database state
		const updated = await db.query.practicesBudgetRequests.findFirst({
			where: eq(practicesBudgetRequests.id, createdRequestId),
		});
		expect(updated?.status).toBe("ditolak");
		expect(updated?.catatanFinance).toBe(alasan);
	});

	it("TC-PRAKTIK-06: Finance gagal menolak jika alasan penolakan kosong/hanya spasi", async () => {
		const res = await app.handle(
			new Request(
				`http://localhost:3001/finance/anggaran-praktik/${createdRequestId}/reject`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${financeToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ catatanFinance: "   " }),
				},
			),
		);

		expect(res.status).toBe(400);
		const json = (await res.json()) as any;
		expect(json.success).toBe(false);
		expect(json.message).toContain("wajib diisi");
	});

	it("TC-PRAKTIK-07: Non-finance user (Dosen) dilarang melakukan ACC atau Tolak", async () => {
		const resApprove = await app.handle(
			new Request(
				`http://localhost:3001/finance/anggaran-praktik/${createdRequestId}/approve`,
				{
					method: "PATCH",
					headers: { Authorization: `Bearer ${dosenToken}` },
				},
			),
		);
		expect(resApprove.status).toBe(403);

		const resReject = await app.handle(
			new Request(
				`http://localhost:3001/finance/anggaran-praktik/${createdRequestId}/reject`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${dosenToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ catatanFinance: "Tolak coba-coba" }),
				},
			),
		);
		expect(resReject.status).toBe(403);
	});

	it("TC-PRAKTIK-08: Dosen merevisi pengajuan yang ditolak & status kembali menjadi menunggu", async () => {
		const revisedPayload = {
			courseId: practiceCourseId,
			daftarKebutuhan: [
				{
					namaItem: "Biji Kopi Arabika 1kg",
					jumlah: 3,
					satuan: "pack",
					satuanHarga: 120000,
				},
				{
					namaItem: "Susu UHT Fresh 1L",
					jumlah: 5,
					satuan: "kotak",
					satuanHarga: 18000,
				},
			],
			totalNominal: 450000,
		};

		const res = await app.handle(
			new Request(
				`http://localhost:3001/courses/${practiceCourseId}/budget-requests/${createdRequestId}`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${dosenToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(revisedPayload),
				},
			),
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);

		const updated = await db.query.practicesBudgetRequests.findFirst({
			where: eq(practicesBudgetRequests.id, createdRequestId),
		});
		expect(updated?.status).toBe("menunggu");
		expect(updated?.totalNominal).toBe(450000);
	});

	it("TC-PRAKTIK-09: Finance menyetujui (ACC) pengajuan revisi dosen", async () => {
		const res = await app.handle(
			new Request(
				`http://localhost:3001/finance/anggaran-praktik/${createdRequestId}/approve`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${financeToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						buktiPencairanUrl: "/files/999/download",
						buktiPencairanFileName: "Transfer_Bahan_Praktik.pdf",
					}),
				},
			),
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);

		const updated = await db.query.practicesBudgetRequests.findFirst({
			where: eq(practicesBudgetRequests.id, createdRequestId),
		});
		expect(updated?.status).toBe("disetujui");
		expect(updated?.approvedBy).toBe(financeId);
		expect(updated?.approvedAt).not.toBeNull();
		expect(updated?.buktiPencairanUrl).toBe("/files/999/download");
	});

	it("TC-PRAKTIK-10: Finance dapat mereset status anggaran kembali ke menunggu jika diperlukan", async () => {
		const res = await app.handle(
			new Request(
				`http://localhost:3001/finance/anggaran-praktik/${createdRequestId}/reset`,
				{
					method: "PATCH",
					headers: { Authorization: `Bearer ${financeToken}` },
				},
			),
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);

		const updated = await db.query.practicesBudgetRequests.findFirst({
			where: eq(practicesBudgetRequests.id, createdRequestId),
		});
		expect(updated?.status).toBe("menunggu");
		expect(updated?.approvedBy).toBeNull();
		expect(updated?.approvedAt).toBeNull();
		expect(updated?.buktiPencairanUrl).toBeNull();
	});
});
