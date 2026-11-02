import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import {
	financeData,
	financeProjectionTargets,
	students,
	users,
} from "../src/db/schema";
import { autoIssueStudentNim, generateNextNim } from "../src/lib/nim-helper";
import { JWT_SECRET } from "../src/middleware/auth";

describe("Segmen 5 & 12: Trigger Auto NIM & Standarisasi Dokumen PDF", () => {
	let financeToken: string;
	let superToken: string;
	let testStudentId: number;

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

		// Find or create a test student
		const s = await db.query.students.findFirst();
		if (s) {
			testStudentId = s.id;
		}
	});

	it("TC-SEGMEN5-01: generateNextNim generates valid 6-digit sequential NIM format [YY][4-digit sequence]", async () => {
		const nim2026 = await generateNextNim(2026);
		expect(nim2026).toBeDefined();
		expect(typeof nim2026).toBe("string");
		expect(nim2026.length).toBe(6);
		expect(nim2026.startsWith("26")).toBe(true);
		expect(Number(nim2026)).toBeGreaterThanOrEqual(260001);
	});

	it("TC-SEGMEN5-02: Updating registrasiStatus to true automatically issues NIM if student has no NIM", async () => {
		if (!testStudentId) return;

		// Fetch current student
		const currentStudent = await db.query.students.findFirst({
			where: eq(students.id, testStudentId),
		});

		// Ensure student exists and test PATCH /students/:id/finance
		const res = await app.handle(
			new Request(`http://localhost/students/${testStudentId}/finance`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${financeToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					registrasiStatus: true,
					registrasiPaidDate: new Date().toISOString(),
				}),
			}),
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);

		const updatedStudent = await db.query.students.findFirst({
			where: eq(students.id, testStudentId),
		});
		expect(updatedStudent?.nim).toBeDefined();
		expect(updatedStudent?.nim?.length).toBe(6);
	});

	it("TC-SEGMEN12-01: Non-PDF upload on fee sharing proof is rejected with 400", async () => {
		const form = new FormData();
		form.append(
			"file",
			new Blob(["fake-image-bytes"], { type: "image/jpeg" }),
			"bukti.jpg",
		);

		const res = await app.handle(
			new Request(
				"http://localhost/finance/fee-sharing/recipients/1/upload-proof",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${financeToken}`,
					},
					body: form,
				},
			),
		);

		expect(res.status).toBe(400);
		const json = (await res.json()) as any;
		expect(json.message).toContain("PDF");
	});

	it("TC-SEGMEN12-02: Non-PDF upload on anggaran praktik proof is rejected with 400", async () => {
		const form = new FormData();
		form.append(
			"file",
			new Blob(["fake-image-bytes"], { type: "image/png" }),
			"bukti.png",
		);

		const res = await app.handle(
			new Request("http://localhost/finance/anggaran-praktik/1/upload-bukti", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${financeToken}`,
				},
				body: form,
			}),
		);

		expect(res.status).toBe(400);
		const json = (await res.json()) as any;
		expect(json.message).toContain("PDF");
	});

	it("TC-PROJECTIONS-01: GET /finance/projections returns 5 dynamic streams including Indonesia & Timur Tengah", async () => {
		const res = await app.handle(
			new Request("http://localhost/finance/projections?cohort=all", {
				headers: {
					Authorization: `Bearer ${financeToken}`,
				},
			}),
		);

		expect(res.status).toBe(200);
		const json = (await res.json()) as any;
		expect(json.success).toBe(true);
		expect(json.data.streams).toBeDefined();
		expect(json.data.streams.length).toBe(5);

		const categories = json.data.streams.map((s: any) => s.category);
		expect(categories).toContain("pmb");
		expect(categories).toContain("spp_taiwan");
		expect(categories).toContain("spp_malaysia");
		expect(categories).toContain("spp_indonesia");
		expect(categories).toContain("spp_timur_tengah");
	});

	it("TC-SEGMEN5-03: PATCH /students/:id/nim is rejected with 400 when student DP / initial registration is not paid in Finance", async () => {
		// Create or find a student without finance DP
		const unpaidStudent = await db.query.students.findFirst({
			where: eq(students.name, "Unpaid DP Test Student"),
		});

		let unpaidId = unpaidStudent?.id;
		if (!unpaidId) {
			const [s] = await db
				.insert(students)
				.values({
					name: "Unpaid DP Test Student",
					cohort: 16,
					rombel: "Kelas A",
					program: "D3 Perhotelan",
				})
				.returning();
			unpaidId = s.id;
			await db.insert(financeData).values({
				studentId: unpaidId,
				registrasiStatus: false,
			});
		} else {
			await db
				.update(financeData)
				.set({ registrasiStatus: false })
				.where(eq(financeData.studentId, unpaidId));
		}

		// Try updating NIM as non-superadmin (akademik role)
		const signer = jwt({ name: "jwt", secret: JWT_SECRET });
		const mockSignApp = new Elysia()
			.use(signer)
			.get("/sign-akademik", ({ jwt }: any) =>
				jwt.sign({
					id: 555,
					username: "akademik_user",
					role: "akademik",
					roles: ["akademik"],
				}),
			);
		const resAkad = await mockSignApp.handle(
			new Request("http://localhost/sign-akademik"),
		);
		const akademikToken = await resAkad.text();

		const res = await app.handle(
			new Request(`http://localhost/students/${unpaidId}/nim`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${akademikToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ nim: "269999" }),
			}),
		);

		expect(res.status).toBe(400);
		const json = (await res.json()) as any;
		expect(json.message).toContain("DP");
	});

	it("TC-PROJECTIONS-02: POST /finance/projections/batch-update with academicYear saves annual target and auto-divides into 12 months & 2 semesters", async () => {
		const resUpdate = await app.handle(
			new Request("http://localhost/finance/projections/batch-update", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${financeToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					cohort: 16,
					year: 2026,
					academicYear: "2026/2027",
					targets: [
						{ category: "pmb", targetNominal: 120_000_000 },
						{ category: "spp_taiwan", targetNominal: 240_000_000 },
						{ category: "spp_malaysia", targetNominal: 120_000_000 },
						{ category: "spp_indonesia", targetNominal: 120_000_000 },
						{ category: "spp_timur_tengah", targetNominal: 60_000_000 },
					],
				}),
			}),
		);

		expect(resUpdate.status).toBe(200);
		const updateJson = (await resUpdate.json()) as any;
		expect(updateJson.success).toBe(true);

		// Verify database records: month 0 (yearly) and months 1..12 (monthly)
		const pmbYearly = await db.query.financeProjectionTargets.findFirst({
			where: and(
				eq(financeProjectionTargets.cohort, 16),
				eq(financeProjectionTargets.category, "pmb"),
				eq(financeProjectionTargets.year, 2026),
				eq(financeProjectionTargets.month, 0),
			),
		});
		expect(pmbYearly).toBeDefined();
		expect(Number(pmbYearly?.targetNominal)).toBe(120_000_000);
		expect(pmbYearly?.periodType).toBe("yearly");

		// Verify month 1 breakdown (120_000_000 / 12 = 10_000_000)
		const pmbMonth1 = await db.query.financeProjectionTargets.findFirst({
			where: and(
				eq(financeProjectionTargets.cohort, 16),
				eq(financeProjectionTargets.category, "pmb"),
				eq(financeProjectionTargets.year, 2026),
				eq(financeProjectionTargets.month, 1),
			),
		});
		expect(pmbMonth1).toBeDefined();
		expect(Number(pmbMonth1?.targetNominal)).toBe(10_000_000);
		expect(pmbMonth1?.periodType).toBe("monthly");

		// Verify GET /finance/projections returns targetSemester and targetBulanan
		const resGet = await app.handle(
			new Request("http://localhost/finance/projections?cohort=16&year=2026", {
				headers: {
					Authorization: `Bearer ${financeToken}`,
				},
			}),
		);

		expect(resGet.status).toBe(200);
		const getJson = (await resGet.json()) as any;
		expect(getJson.success).toBe(true);
		expect(getJson.data.academicYear).toBe("2026/2027");

		const pmbStream = getJson.data.streams.find(
			(s: any) => s.category === "pmb",
		);
		expect(pmbStream).toBeDefined();
		expect(pmbStream.target).toBe(120_000_000);
		expect(pmbStream.targetSemester).toBe(60_000_000); // 120jt / 2
		expect(pmbStream.targetBulanan).toBe(10_000_000); // 120jt / 12
	});
});
