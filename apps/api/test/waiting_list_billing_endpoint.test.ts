import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import { financeData, pmbPaymentPlan, students, users } from "../src/db/schema";
import { JWT_SECRET } from "../src/middleware/auth";

describe("Waiting list: penerbitan tagihan (VA cukup nomor VA)", () => {
	let token: string;
	let studentId: number;

	const patch = (body: Record<string, unknown>) =>
		app.handle(
			new Request(
				`http://localhost/finance/waiting-list/${studentId}/billing`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				},
			),
		);

	beforeAll(async () => {
		// Beri waktu DDL startup dari import `app` selesai agar tidak deadlock saat cleanup
		await Bun.sleep(2000);
		const fin = await db.query.users.findFirst({
			where: eq(users.role, "finance"),
		});
		const signer = new Elysia()
			.use(jwt({ name: "jwt", secret: JWT_SECRET }))
			.get("/s", ({ jwt }: any) =>
				jwt.sign({
					id: fin?.id || 1,
					username: fin?.username || "finance",
					role: "finance",
					roles: ["finance"],
				}),
			);
		token = await (
			await signer.handle(new Request("http://localhost/s"))
		).text();
		const [s] = await db
			.insert(students)
			.values({
				name: "TEST Billing",
				program: "Indonesia",
				cohort: 17,
				studentStatus: "menunggu_pembayaran",
			})
			.returning();
		studentId = s.id;
		await db
			.insert(pmbPaymentPlan)
			.values({ studentId, pendaftaranDp: 1500000, totalDp: 1500000 });
		await db.insert(financeData).values({ studentId });
	});

	afterAll(async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await db
					.delete(pmbPaymentPlan)
					.where(eq(pmbPaymentPlan.studentId, studentId));
				await db
					.delete(financeData)
					.where(eq(financeData.studentId, studentId));
				await db.delete(students).where(eq(students.id, studentId));
				return;
			} catch {
				await Bun.sleep(1000);
			}
		}
	});

	it("VA hanya nomor VA: sukses, nominal PMB tidak tertimpa", async () => {
		const res = await patch({ billingType: "va", billingNumber: "1234567890" });
		expect(res.status).toBe(200);
		const plan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, studentId),
		});
		expect(plan?.billingNumber).toBe("1234567890");
		expect(plan?.billingBankName).toBeNull();
		expect(plan?.pendaftaranDp).toBe(1500000);
		const days =
			((plan?.billingDueDate?.getTime() ?? 0) - Date.now()) / 86_400_000;
		expect(days).toBeGreaterThan(1.9);
		expect(days).toBeLessThanOrEqual(2);
	});

	it("Rekening tanpa nominal/bank/atas nama ditolak 400", async () => {
		const res = await patch({ billingType: "rekening", billingNumber: "999" });
		expect(res.status).toBe(400);
	});

	it("Rekening lengkap: sukses dan nominal diperbarui", async () => {
		const res = await patch({
			billingType: "rekening",
			billingNumber: "999",
			billingBankName: "BCA",
			billingAccountHolder: "Nusadaya",
			nominal: 2000000,
		});
		expect(res.status).toBe(200);
		const plan = await db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, studentId),
		});
		expect(plan?.pendaftaranDp).toBe(2000000);
		expect(plan?.billingBankName).toBe("BCA");
	});

	it("Waiting list tidak muncul di daftar mahasiswa, kecuali includeWaiting", async () => {
		const list = async (qs: string) => {
			const res = await app.handle(
				new Request(`http://localhost/students?limit=200&${qs}`, {
					headers: { Authorization: `Bearer ${token}` },
				}),
			);
			expect(res.status).toBe(200);
			const json = (await res.json()) as any;
			return (json.data as Array<{ student: { id: number } }>).map(
				(r) => r.student.id,
			);
		};
		expect(await list("")).not.toContain(studentId);
		expect(await list("includeWaiting=true")).toContain(studentId);
	});
});
