import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import { crmData, students, users } from "../src/db/schema";
import { JWT_SECRET } from "../src/middleware/auth";

describe("CRM melihat waiting list, tapi belum boleh mengubah datanya", () => {
	let token: string;
	let waitingId: number;

	const call = (method: string, path: string, body?: unknown) =>
		app.handle(
			new Request(`http://localhost/students/${waitingId}${path}`, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: body ? JSON.stringify(body) : undefined,
			}),
		);

	beforeAll(async () => {
		await Bun.sleep(2000); // tunggu DDL startup dari import `app`
		const crmUser = await db.query.users.findFirst({
			where: eq(users.role, "crm"),
		});
		const signer = new Elysia()
			.use(jwt({ name: "jwt", secret: JWT_SECRET }))
			.get("/s", ({ jwt }: any) =>
				jwt.sign({
					id: crmUser?.id,
					username: crmUser?.username || "crm",
					role: "crm",
					roles: ["crm"],
				}),
			);
		token = await (
			await signer.handle(new Request("http://localhost/s"))
		).text();
		const [w] = await db
			.insert(students)
			.values({
				name: "TEST CRM Waiting",
				program: "Indonesia",
				cohort: 17,
				studentStatus: "menunggu_pembayaran",
			})
			.returning();
		waitingId = w.id;
		await db.insert(crmData).values({ studentId: waitingId });
	});

	afterAll(async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await db.delete(crmData).where(eq(crmData.studentId, waitingId));
				await db.delete(students).where(eq(students.id, waitingId));
				return;
			} catch {
				await Bun.sleep(1000);
			}
		}
	});

	it("GET data CRM tetap boleh", async () => {
		const res = await call("GET", "/crm");
		expect(res.status).toBe(200);
	});

	it("PATCH data CRM ditolak 400 selama menunggu pembayaran", async () => {
		const res = await call("PATCH", "/crm", { isVocabComplete: true });
		expect(res.status).toBe(400);
		const json = (await res.json()) as any;
		expect(json.message).toContain("diverifikasi Finance");
	});

	it("muncul di daftar mahasiswa bila includeWaiting=true (dipakai Panel CRM)", async () => {
		const res = await app.handle(
			new Request("http://localhost/students?limit=100&includeWaiting=true", {
				headers: { Authorization: `Bearer ${token}` },
			}),
		);
		const json = (await res.json()) as any;
		const ids = (json.data as Array<{ student: { id: number } }>).map(
			(r) => r.student.id,
		);
		expect(ids).toContain(waitingId);
	});
});
