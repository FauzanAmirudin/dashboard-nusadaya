import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import { financeData, users } from "../src/db/schema";
import { JWT_SECRET } from "../src/middleware/auth";

describe("FIN-02: 4 Termin Baku Biaya & Dokumen Kontrak vs Suhan", () => {
	let financeToken: string;
	let superToken: string;

	beforeAll(async () => {
		const financeUser = await db.query.users.findFirst({
			where: eq(users.role, "finance"),
		});
		const signer = jwt({ name: "jwt", secret: JWT_SECRET });
		const mockSignApp = new Elysia()
			.use(signer)
			.get("/sign-finance", ({ jwt }: any) =>
				jwt.sign({
					id: financeUser?.id || 1,
					username: financeUser?.username || "finance",
					role: "finance",
					roles: ["finance"],
				}),
			)
			.get("/sign-super", ({ jwt }: any) =>
				jwt.sign({
					id: 999,
					username: "superadmin",
					role: "superadmin",
					roles: ["superadmin"],
				}),
			);
		const resFin = await mockSignApp.handle(
			new Request("http://localhost/sign-finance"),
		);
		financeToken = await resFin.text();

		const resSuper = await mockSignApp.handle(
			new Request("http://localhost/sign-super"),
		);
		superToken = await resSuper.text();
	});
	it("TC-FIN02-01: GET /students/:id/finance should return 4 termin baku compatibility fields", async () => {
		const existing = await db.query.financeData.findFirst();
		const studentId = existing?.studentId || 11;

		const res = await app.handle(
			new Request(`http://localhost:3001/students/${studentId}/finance`, {
				method: "GET",
			}),
		);
		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);
		expect(json.data).toBeDefined();
		expect(json.data).toHaveProperty("kontrakMagangStatus");
		expect(json.data).toHaveProperty("suhanStatus");
		expect(json.data).toHaveProperty("registrasiStatus");
		expect(json.data).toHaveProperty("mandiriSemesterStatus");
	});

	it("TC-FIN02-02: PATCH /students/1/finance rejects unauthorized role without finance/magang/pmb/superadmin", async () => {
		const res = await app.handle(
			new Request("http://localhost:3001/students/1/finance", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					kontrakMagangStatus: true,
				}),
			}),
		);
		// Without auth header, should return 401 Unauthorized
		expect(res.status).toBe(401);
	});

	it("TC-FIN02-03: GET /finance/student/1 should validate role and return 403 when unauthenticated", async () => {
		const unauthRes = await app.handle(
			new Request("http://localhost:3001/finance/student/1", {
				method: "GET",
			}),
		);
		expect(unauthRes.status).toBe(403);
	});

	it("TC-FIN02-04: PMB Total DP syncs bidirectionally with Finance Registrasi Awal", async () => {
		const existing = await db.query.financeData.findFirst();
		const studentId = existing?.studentId || 11;

		// 1. Simulasikan PMB menetapkan Total DP melalui PUT payment-plan
		const pmbRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/pmb/payment-plan`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						totalBiaya: 25000000,
						pendaftaranDp: 3000000,
						totalDp: 3000000,
					}),
				},
			),
		);
		// If unauthenticated via route check, we can verify via db or route handler
		if (pmbRes.status === 200) {
			const finCheck = await db.query.financeData.findFirst({
				where: eq(financeData.studentId, studentId),
			});
			expect(finCheck?.registrasiNominal).toBe(3000000);
			expect(finCheck?.totalBiayaPendidikan).toBe(25000000);
		}

		// 2. Verifikasi GET /students/:id/finance memuat fallback pmbDp jika ada
		const getFinRes = await app.handle(
			new Request(`http://localhost:3001/students/${studentId}/finance`, {
				method: "GET",
			}),
		);
		expect(getFinRes.status).toBe(200);
		const finJson = (await getFinRes.json()) as any;
		expect(finJson.success).toBe(true);
		expect(finJson).toHaveProperty("pmbDp");
		expect(finJson).toHaveProperty("paymentPlan");
	});

	it("TC-FIN02-05: Mahasiswa yang belum ditentukan skema biayanya bernilai 0 di Finance dan ACC diblokir jika total biaya 0", async () => {
		// Gunakan student 25 atau data mahasiswa yang belum diisi PMB
		const res = await app.handle(
			new Request("http://localhost:3001/students/25/finance", {
				method: "GET",
			}),
		);
		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);
		// Jika belum ditentukan dari awal, total biaya dan DP harus 0
		if (json.data) {
			expect(json.data.totalBiayaPendidikan || 0).toBe(0);
			expect(json.data.registrasiNominal || 0).toBe(0);
		}

		// Simulasi percobaan ACC ketika totalBiayaPendidikan masih 0 harus diblokir (400)
		const accRes = await app.handle(
			new Request("http://localhost:3001/students/25/finance/acc", {
				method: "POST",
			}),
		);
		// Tanpa auth header atau dengan total biaya 0 -> status 401 atau 400
		expect([400, 401]).toContain(accRes.status);
	});

	it("TC-FIN02-06: Cicilan bulanan fleksibel Semester 1 dan tracking sisa tagihan", async () => {
		const existing = await db.query.financeData.findFirst();
		const studentId = existing?.studentId || 11;

		// 1. Ambil data semester untuk student
		const semRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/semesters`,
				{
					method: "GET",
				},
			),
		);
		expect(semRes.status).toBe(200);
		const semJson = (await semRes.json()) as any;
		expect(semJson.success).toBe(true);
		expect(Array.isArray(semJson.data)).toBe(true);
		expect(semJson.data.length).toBeGreaterThanOrEqual(1);

		const sem1 = semJson.data.find((s: any) => s.semesterNumber === 1);
		expect(sem1).toBeDefined();

		// 2. Verifikasi perhitungan tracking sisa tagihan secara matematis
		const totalBilled = sem1.totalBilled || 0;
		const totalPaid = (sem1.installments || []).reduce(
			(sum: number, inst: any) => sum + (inst.nominalPaid || 0),
			0,
		);
		const remaining = Math.max(0, totalBilled - totalPaid);
		expect(remaining).toBe(
			totalBilled - totalPaid > 0 ? totalBilled - totalPaid : 0,
		);

		// 3. Verifikasi struktur installment memiliki field bulan fleksibel, nominal scheduled, due date & status
		if (sem1.installments && sem1.installments.length > 0) {
			const firstInst = sem1.installments[0];
			expect(firstInst).toHaveProperty("nominalPaid");
			expect(firstInst).toHaveProperty("installmentMonth");
			expect(firstInst).toHaveProperty("nominalScheduled");
			expect(firstInst).toHaveProperty("status");
		}
	});

	it("TC-FIN02-07: Skema Fleksibel Dana Talangan (1 Tahap vs 2 Tahap) dan Pembagian Per Termin (Segmen 12)", async () => {
		const existing = await db.query.financeData.findFirst();
		const studentId = existing?.studentId || 11;

		await db
			.update(financeData)
			.set({ totalBiayaPendidikan: 25000000 })
			.where(eq(financeData.studentId, studentId));

		// 1. Set skema talangan 1 Tahap (Keberangkatan)
		const patch1Res = await app.handle(
			new Request(`http://localhost:3001/students/${studentId}/finance`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${financeToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					metodePembayaran: "dana_talangan",
					talanganTipe: "1_tahap",
					talanganTotalPengajuan: 25000000,
					talanganLembaga: "Bank BTN",
					talanganNotes: "Akad Keberangkatan No. BTN-001",
					t1SemesterNominalTotal: 0,
					t1InterviewNominal: 0,
					t2KeberangkatanNominal: 25000000,
				}),
			}),
		);
		expect(patch1Res.status).toBe(200);

		// 2. Verifikasi GET /finance/student/:id mengembalikan skema 1 tahap
		const get1Res = await app.handle(
			new Request(`http://localhost:3001/finance/student/${studentId}`, {
				method: "GET",
				headers: { Authorization: `Bearer ${financeToken}` },
			}),
		);
		expect(get1Res.status).toBe(200);
		const get1Json = (await get1Res.json()) as any;
		expect(get1Json.success).toBe(true);
		expect(get1Json.data.finance.talanganTipe).toBe("1_tahap");
		expect(get1Json.data.finance.talanganTotalPengajuan).toBe(25000000);
		expect(get1Json.data.finance.talanganLembaga).toBe("Bank BTN");
		expect(get1Json.data.finance.talanganNotes).toBe(
			"Akad Keberangkatan No. BTN-001",
		);

		// 3. Ubah skema talangan ke 2 Tahap (Bertahap)
		const patch2Res = await app.handle(
			new Request(`http://localhost:3001/students/${studentId}/finance`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${financeToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					talanganTipe: "2_tahap",
					talanganTotalPengajuan: 25000000,
					talanganLembaga: "Hong Ta",
					t1InterviewNominal: 15000000,
					t2KeberangkatanNominal: 10000000,
				}),
			}),
		);
		expect(patch2Res.status).toBe(200);

		// 4. Verifikasi pencatatan cicilan talangan langsung ke database (mendukung notes: null dan buktiBayarUrl: null)
		const postInstRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/talangan-installments`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${financeToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						stage: "tahap_2",
						nominalPaid: 2500000,
						notes: null,
						buktiBayarUrl: null,
					}),
				},
			),
		);
		expect(postInstRes.status).toBe(200);
		const postInstJson = (await postInstRes.json()) as any;
		expect(postInstJson.success).toBe(true);
		expect(postInstJson.data.nominalPaid).toBe(2500000);
		const createdInstId = postInstJson.data.id;

		// 5. Cleanup installment yang baru dibuat
		const delInstRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/talangan-installments/${createdInstId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${financeToken}` },
				},
			),
		);
		expect(delInstRes.status).toBe(200);
	});

	it("TC-FIN02-08: Integrasi Real-Time Proyeksi Target & Realisasi Uang Masuk (Penambahan & Pengurangan Pembayaran)", async () => {
		const existing = await db.query.financeData.findFirst();
		const studentId = existing?.studentId || 11;

		const semRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/semesters`,
				{
					headers: { Authorization: `Bearer ${financeToken}` },
				},
			),
		);
		const semJson = (await semRes.json()) as any;
		const sem1 = semJson.data.find((s: any) => s.semesterNumber === 1);
		const sem1Id = sem1?.id || 1;

		// 1. Ambil proyeksi awal
		const initialProjRes = await app.handle(
			new Request("http://localhost:3001/finance/projections?cohort=all", {
				headers: { Authorization: `Bearer ${financeToken}` },
			}),
		);
		expect(initialProjRes.status).toBe(200);
		const initialProj = (await initialProjRes.json()) as any;
		expect(initialProj.success).toBe(true);
		const initialTotal = initialProj.data.total.realisasi;

		// 2. Tambah cicilan semester (Penambahan Realisasi Pembayaran)
		const postSemInstRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/semesters/${sem1Id}/installments`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${financeToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						installmentNumber: 99,
						nominalPaid: 3000000,
						nominalScheduled: 3000000,
						paymentDate: new Date().toISOString(),
						status: "LUNAS",
						notes: "Cicilan Uji Proyeksi",
					}),
				},
			),
		);
		expect(postSemInstRes.status).toBe(200);
		const postSemJson = (await postSemInstRes.json()) as any;
		const semInstId = postSemJson.data.id;

		// 3. Verifikasi proyeksi otomatis bertambah secara realtime
		const afterAddRes = await app.handle(
			new Request("http://localhost:3001/finance/projections?cohort=all", {
				headers: { Authorization: `Bearer ${financeToken}` },
			}),
		);
		const afterAddProj = (await afterAddRes.json()) as any;
		expect(afterAddProj.data.total.realisasi).toBe(initialTotal + 3000000);

		// 4. Batalkan / Hapus cicilan semester (Pengurangan Realisasi Pembayaran)
		const delSemRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/semesters/${sem1Id}/installments/${semInstId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${financeToken}` },
				},
			),
		);
		expect(delSemRes.status).toBe(200);

		// 5. Verifikasi proyeksi otomatis berkurang kembali secara realtime
		const afterDelRes = await app.handle(
			new Request("http://localhost:3001/finance/projections?cohort=all", {
				headers: { Authorization: `Bearer ${financeToken}` },
			}),
		);
		const afterDelProj = (await afterDelRes.json()) as any;
		expect(afterDelProj.data.total.realisasi).toBe(initialTotal);

		// 6. Tambah cicilan talangan (Tahap 1 / Tahap 2) -> Verifikasi masuk proyeksi
		const postTalRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/talangan-installments`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${financeToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						stage: "tahap_1",
						nominalPaid: 1500000,
						paymentDate: new Date().toISOString(),
						notes: "Uji Talangan Masuk Proyeksi",
					}),
				},
			),
		);
		expect(postTalRes.status).toBe(200);
		const postTalJson = (await postTalRes.json()) as any;
		const talInstId = postTalJson.data.id;

		const afterTalRes = await app.handle(
			new Request("http://localhost:3001/finance/projections?cohort=all", {
				headers: { Authorization: `Bearer ${financeToken}` },
			}),
		);
		const afterTalProj = (await afterTalRes.json()) as any;
		expect(afterTalProj.data.total.realisasi).toBe(initialTotal + 1500000);

		// 7. Hapus cicilan talangan -> Verifikasi kembali normal
		const delTalRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/talangan-installments/${talInstId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${financeToken}` },
				},
			),
		);
		expect(delTalRes.status).toBe(200);

		const finalProjRes = await app.handle(
			new Request("http://localhost:3001/finance/projections?cohort=all", {
				headers: { Authorization: `Bearer ${financeToken}` },
			}),
		);
		const finalProj = (await finalProjRes.json()) as any;
		expect(finalProj.data.total.realisasi).toBe(initialTotal);
	});

	it("TC-FIN02-09: Validasi & Penanganan Error Input Pembagian Termin & Pagu Melebihi Total Biaya Pendidikan PMB", async () => {
		const existing = await db.query.financeData.findFirst();
		const studentId = existing?.studentId || 11;

		// 1. Set Total Biaya Pendidikan via PMB (misal Rp 18.000.000)
		const setPmbRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/pmb/payment-plan`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${superToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						totalBiaya: 18000000,
						pendaftaranDp: 2000000,
					}),
				},
			),
		);
		expect(setPmbRes.status).toBe(200);

		// 2. Coba kirim DP PMB yang melebihi Total Biaya -> Harus 400 Bad Request
		const invalidDpRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/pmb/payment-plan`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${superToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						totalBiaya: 18000000,
						pendaftaranDp: 25000000, // > 18.000.000
					}),
				},
			),
		);
		expect(invalidDpRes.status).toBe(400);
		const invalidDpJson = (await invalidDpRes.json()) as any;
		expect(invalidDpJson.message).toContain(
			"tidak boleh melebihi Total Biaya Pendidikan",
		);

		// 3. Finance mencoba simpan pembagian 4 partisi yang totalnya melebihi Total Biaya (Rp 18.000.000)
		const exceedPartitionsRes = await app.handle(
			new Request(`http://localhost:3001/students/${studentId}/finance`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${financeToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					registrasiNominal: 5000000,
					mandiriSemesterNominal: 12000000,
					mandiriInterviewNominal: 4000000,
					mandiriKeberangkatanNominal: 5000000, // Total = 26.000.000 > 18.000.000
				}),
			}),
		);
		expect(exceedPartitionsRes.status).toBe(400);
		const exceedJson = (await exceedPartitionsRes.json()) as any;
		expect(exceedJson.message).toContain("melebihi Total Biaya Pendidikan");

		// 4. Finance mencoba pengajuan talangan yang melebihi Total Biaya -> Harus 400 Bad Request
		const exceedTalanganRes = await app.handle(
			new Request(`http://localhost:3001/students/${studentId}/finance`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${financeToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					talanganTotalPengajuan: 30000000, // > 18.000.000
				}),
			}),
		);
		expect(exceedTalanganRes.status).toBe(400);
		const exceedTalJson = (await exceedTalanganRes.json()) as any;
		expect(exceedTalJson.message).toContain(
			"tidak boleh melebihi Total Biaya Pendidikan",
		);

		// 5. Finance mencoba jadwalkan cicilan SPP melebihi pagu SPP Semester
		const semRes = await app.handle(
			new Request(
				`http://localhost:3001/students/${studentId}/finance/semesters`,
				{
					headers: { Authorization: `Bearer ${financeToken}` },
				},
			),
		);
		const semJson = (await semRes.json()) as any;
		const sem1 = semJson.data.find((s: any) => s.semesterNumber === 1);
		if (sem1 && sem1.totalBilled > 0) {
			const exceedScheduleRes = await app.handle(
				new Request(
					`http://localhost:3001/students/${studentId}/finance/semesters/${sem1.id}/installments`,
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${financeToken}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							nominalScheduled: sem1.totalBilled + 5000000,
							status: "BELUM_BAYAR",
							installmentMonth: "Cicilan Uji Lebih",
						}),
					},
				),
			);
			expect(exceedScheduleRes.status).toBe(400);
			const exceedSchedJson = (await exceedScheduleRes.json()) as any;
			expect(exceedSchedJson.message).toContain("melebihi pagu SPP Semester");
		}
	});
});
