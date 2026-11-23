import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import {
	internshipData,
	internshipInterviews,
	students,
	users,
} from "../src/db/schema";
import { computeMagangPrerequisites } from "../src/lib/magang-prerequisites";
import { JWT_SECRET } from "../src/middleware/auth";

describe("Prasyarat Magang (aturan murni)", () => {
	const accAll = {
		pmb: { isAcc: true },
		crm: { isAcc: true },
		academic: { isAcc: true },
	};

	it("lolos tanpa ACC Finance bila registrasi & SPP Sem 1 lunas", () => {
		const r = computeMagangPrerequisites({
			...accAll,
			finance: {
				metodePembayaran: "mandiri",
				registrasiStatus: true,
				mandiriSemesterStatus: true,
			},
		});
		expect(r.ok).toBe(true);
	});

	it("talangan 2 tahap memakai t1SemesterStatus", () => {
		const base = {
			...accAll,
			finance: {
				metodePembayaran: "dana_talangan",
				talanganTipe: "2_tahap",
				registrasiStatus: true,
			},
		};
		expect(computeMagangPrerequisites(base).missing).toEqual([
			"SPP Semester 1 lunas",
		]);
		expect(
			computeMagangPrerequisites({
				...base,
				finance: { ...base.finance, t1SemesterStatus: true },
			}).ok,
		).toBe(true);
	});
});

describe("Panel Magang: prasyarat ACC, wawancara, termin agensi", () => {
	let superToken: string;
	let pmbToken: string;
	let studentId: number;

	const call = async (
		method: string,
		path: string,
		token: string,
		body?: unknown,
	) => {
		const res = await app.handle(
			new Request(`http://localhost/students/${studentId}${path}`, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					...(body ? { "Content-Type": "application/json" } : {}),
				},
				body: body ? JSON.stringify(body) : undefined,
			}),
		);
		return { status: res.status, json: (await res.json()) as any };
	};

	beforeAll(async () => {
		await Bun.sleep(2000); // tunggu DDL startup dari import `app`
		const superUser = await db.query.users.findFirst({
			where: eq(users.role, "superadmin"),
		});
		const signer = new Elysia()
			.use(jwt({ name: "jwt", secret: JWT_SECRET }))
			.get("/super", ({ jwt }: any) =>
				jwt.sign({
					id: superUser?.id,
					username: superUser?.username || "superadmin",
					role: "superadmin",
					roles: ["superadmin"],
				}),
			)
			.get("/pmb", ({ jwt }: any) =>
				jwt.sign({ id: 0, username: "pmb", role: "pmb", roles: ["pmb"] }),
			);
		superToken = await (
			await signer.handle(new Request("http://localhost/super"))
		).text();
		pmbToken = await (
			await signer.handle(new Request("http://localhost/pmb"))
		).text();

		const [s] = await db
			.insert(students)
			.values({ name: "TEST Magang Prasyarat", program: "Taiwan", cohort: 17 })
			.returning();
		studentId = s.id;
		await db.insert(internshipData).values({ studentId });
	});

	afterAll(async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await db
					.delete(internshipInterviews)
					.where(eq(internshipInterviews.studentId, studentId));
				await db
					.delete(internshipData)
					.where(eq(internshipData.studentId, studentId));
				await db.delete(students).where(eq(students.id, studentId));
				return;
			} catch {
				await Bun.sleep(1000);
			}
		}
	});

	it("GET prerequisites menyebut semua syarat yang belum terpenuhi", async () => {
		const r = await call("GET", "/internship/prerequisites", superToken);
		expect(r.status).toBe(200);
		expect(r.json.data.ok).toBe(false);
		expect(r.json.data.missing).toContain("ACC PMB");
		expect(r.json.data.missing).toContain("SPP Semester 1 lunas");
	});

	it("ACC Magang ditolak bila prasyarat belum terpenuhi", async () => {
		const r = await call("POST", "/internship/acc", superToken);
		expect(r.status).toBe(400);
		expect(r.json.code).toBe("MAGANG_PREREQUISITES");
		const row = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, studentId),
		});
		expect(row?.isAcc).toBe(false);
	});

	it("wawancara: tambah lebih dari satu, urut tanggal, ubah, hapus", async () => {
		const a = await call("POST", "/internship/interviews", superToken, {
			interviewDate: "2026-10-20",
			partnerName: "Grand Hyatt Taipei",
			result: "menunggu",
		});
		const b = await call("POST", "/internship/interviews", superToken, {
			interviewDate: "2026-10-05",
			partnerName: "Agent Hong Ta",
			result: "tidak_lulus",
		});
		expect(a.status).toBe(200);
		expect(b.status).toBe(200);

		const list = await call("GET", "/internship/interviews", superToken);
		expect(list.json.data.map((r: any) => r.partnerName)).toEqual([
			"Agent Hong Ta",
			"Grand Hyatt Taipei",
		]);

		const upd = await call(
			"PATCH",
			`/internship/interviews/${a.json.data.id}`,
			superToken,
			{ result: "lulus" },
		);
		expect(upd.json.data.result).toBe("lulus");

		const del = await call(
			"DELETE",
			`/internship/interviews/${b.json.data.id}`,
			superToken,
		);
		expect(del.status).toBe(200);
		const after = await call("GET", "/internship/interviews", superToken);
		expect(after.json.data).toHaveLength(1);
	});

	it("wawancara: hasil di luar pilihan ditolak, role non-Magang dilarang", async () => {
		const bad = await call("POST", "/internship/interviews", superToken, {
			result: "entah",
		});
		expect(bad.status).toBe(400); // error handler app memetakan VALIDATION ke 400
		const forbidden = await call("POST", "/internship/interviews", pmbToken, {
			partnerName: "X",
		});
		expect(forbidden.status).toBe(403);
	});

	it("wawancara mahasiswa lain tidak bisa diubah lewat id mahasiswa ini", async () => {
		const other = await db.query.internshipInterviews.findFirst();
		const foreign = other && other.studentId !== studentId ? other.id : 0;
		const r = await call(
			"PATCH",
			`/internship/interviews/${foreign}`,
			superToken,
			{ result: "lulus" },
		);
		expect(r.status).toBe(404);
	});

	it("termin agensi tersimpan lewat PATCH internship", async () => {
		const r = await call("PATCH", "/internship", superToken, {
			agenDpPaid: true,
			agenDpDate: "2026-10-25T00:00:00.000Z",
			agenDpNominal: 5000000,
		});
		expect(r.status).toBe(200);
		const row = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, studentId),
		});
		expect(row?.agenDpPaid).toBe(true);
		expect(row?.agenDpNominal).toBe(5000000);
		expect(row?.agenDpDate).toBeInstanceOf(Date);
	});
});
