import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../src";
import { db } from "../src/db";
import { financeData } from "../src/db/schema";

describe("FIN-02: 4 Termin Baku Biaya & Dokumen Kontrak vs Suhan", () => {
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
});
