import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import { pmbData, students } from "../src/db/schema";
import { JWT_SECRET } from "../src/middleware/auth";

describe("Fasilitas Rumah Juang dikelola CRM setelah DP lunas", () => {
	const tokens: Record<string, string> = {};
	let activeId: number;
	let waitingId: number;

	const patch = (id: number, role: string, rumahJuang: boolean) =>
		app.handle(
			new Request(`http://localhost/students/${id}/pmb/rumah-juang`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${tokens[role]}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ rumahJuang }),
			}),
		);

	beforeAll(async () => {
		await Bun.sleep(2000); // tunggu DDL startup dari import `app`
		const signer = new Elysia()
			.use(jwt({ name: "jwt", secret: JWT_SECRET }))
			.get("/s/:role", ({ jwt, params }: any) =>
				jwt.sign({
					id: 1,
					username: params.role,
					role: params.role,
					roles: [params.role],
				}),
			);
		for (const role of ["crm", "pmb", "finance"]) {
			tokens[role] = await (
				await signer.handle(new Request(`http://localhost/s/${role}`))
			).text();
		}
		const [a] = await db
			.insert(students)
			.values({ name: "TEST RJ Aktif", program: "Indonesia", cohort: 17 })
			.returning();
		const [w] = await db
			.insert(students)
			.values({
				name: "TEST RJ Waiting",
				program: "Indonesia",
				cohort: 17,
				studentStatus: "menunggu_pembayaran",
			})
			.returning();
		activeId = a.id;
		waitingId = w.id;
	});

	afterAll(async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				for (const id of [activeId, waitingId]) {
					await db.delete(pmbData).where(eq(pmbData.studentId, id));
					await db.delete(students).where(eq(students.id, id));
				}
				return;
			} catch {
				await Bun.sleep(1000);
			}
		}
	});

	it("PMB tidak boleh mengubah (403)", async () => {
		expect((await patch(activeId, "pmb", true)).status).toBe(403);
	});

	it("Finance tidak boleh mengubah (403)", async () => {
		expect((await patch(activeId, "finance", true)).status).toBe(403);
	});

	it("CRM ditolak untuk mahasiswa waiting list (400)", async () => {
		expect((await patch(waitingId, "crm", true)).status).toBe(400);
	});

	it("CRM bisa mengaktifkan untuk mahasiswa aktif", async () => {
		expect((await patch(activeId, "crm", true)).status).toBe(200);
		const row = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, activeId),
		});
		expect(row?.rumahJuang).toBe(true);
	});
});
