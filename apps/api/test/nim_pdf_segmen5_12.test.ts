import { beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import { financeData, students, users } from "../src/db/schema";
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
});
