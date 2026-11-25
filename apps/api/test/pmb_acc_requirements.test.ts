import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import {
	feeShareRecipients,
	internshipData,
	internshipDocuments,
	pmbData,
	pmbPaymentPlan,
	students,
	users,
} from "../src/db/schema";
import { PMB_REQUIRED_DOC_FIELDS } from "../src/lib/pmb-acc-requirements";
import { JWT_SECRET } from "../src/middleware/auth";

describe("ACC PMB hanya jika semua tab lengkap", () => {
	let token: string;
	let studentId: number;

	const acc = async () => {
		const res = await app.handle(
			new Request(`http://localhost/students/${studentId}/pmb/acc`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			}),
		);
		return { status: res.status, json: (await res.json()) as any };
	};

	beforeAll(async () => {
		await Bun.sleep(2000); // tunggu DDL startup dari import `app`
		// acc_by merujuk ke tabel users, jadi pakai akun PMB yang benar-benar ada
		const pmbUser = await db.query.users.findFirst({
			where: eq(users.role, "pmb"),
		});
		const signer = new Elysia()
			.use(jwt({ name: "jwt", secret: JWT_SECRET }))
			.get("/s", ({ jwt }: any) =>
				jwt.sign({
					id: pmbUser?.id,
					username: pmbUser?.username || "pmb",
					role: "pmb",
					roles: ["pmb"],
				}),
			);
		token = await (
			await signer.handle(new Request("http://localhost/s"))
		).text();
		const [s] = await db
			.insert(students)
			.values({ name: "TEST ACC Req", program: "Indonesia", cohort: 17 })
			.returning();
		studentId = s.id;
		const allDocs = Object.fromEntries(
			PMB_REQUIRED_DOC_FIELDS.map((k) => [k, true]),
		);
		await db.insert(pmbData).values({ studentId, ...allDocs });
		await db.insert(pmbPaymentPlan).values({ studentId });
	});

	afterAll(async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await db
					.delete(internshipDocuments)
					.where(eq(internshipDocuments.studentId, studentId));
				await db
					.delete(internshipData)
					.where(eq(internshipData.studentId, studentId));
				await db
					.delete(feeShareRecipients)
					.where(eq(feeShareRecipients.studentId, studentId));
				await db
					.delete(pmbPaymentPlan)
					.where(eq(pmbPaymentPlan.studentId, studentId));
				await db.delete(pmbData).where(eq(pmbData.studentId, studentId));
				await db.delete(students).where(eq(students.id, studentId));
				return;
			} catch {
				await Bun.sleep(1000);
			}
		}
	});

	it("ditolak jika Skema Keuangan kosong", async () => {
		const r = await acc();
		expect(r.status).toBe(400);
		expect(r.json.message).toContain("Skema Keuangan");
	});

	it("ditolak jika belum ada penerima fee", async () => {
		await db
			.update(pmbPaymentPlan)
			.set({ totalBiaya: 25_000_000, pendaftaranDp: 3_000_000 })
			.where(eq(pmbPaymentPlan.studentId, studentId));
		const r = await acc();
		expect(r.status).toBe(400);
		expect(r.json.message).toContain("belum ada penerima");
	});

	it("ditolak jika fee belum dibayarkan Finance", async () => {
		await db.insert(feeShareRecipients).values({
			studentId,
			namaReferral: "TEST Referral",
			kategori: "Mitra",
			nominalFee: 500_000,
			statusPencairan: "cair_sebagian",
		});
		const r = await acc();
		expect(r.status).toBe(400);
		expect(r.json.message).toContain("0/1");
	});

	it("berhasil jika semua tab lengkap & fee lunas", async () => {
		await db
			.update(feeShareRecipients)
			.set({ statusPencairan: "sudah_dibayarkan" })
			.where(eq(feeShareRecipients.studentId, studentId));
		const r = await acc();
		expect(r.status).toBe(200);
		const row = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, studentId),
		});
		expect(row?.isAcc).toBe(true);
	});
});
