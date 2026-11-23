import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import {
	academicData,
	courseGrades,
	crmData,
	financeData,
	students,
	users,
} from "../src/db/schema";
import { checkPembiasaanEligible } from "../src/lib/crm-pembiasaan";
import { computeFinanceAccRequirements } from "../src/lib/finance-acc-requirements";
import { JWT_SECRET } from "../src/middleware/auth";

describe("Aturan murni: syarat ACC Keuangan & pembiasaan", () => {
	it("T-02: pos 'Tidak berlaku' dilewati saat ACC Keuangan", () => {
		const base = {
			metodePembayaran: "mandiri",
			registrasiStatus: true,
			mandiriSemesterStatus: true,
			mandiriInterviewStatus: true,
			mandiriKeberangkatanStatus: true,
			toeicStatus: false,
			pasporStatus: false,
		};
		expect(computeFinanceAccRequirements(base).ok).toBe(false);
		expect(computeFinanceAccRequirements(base).required).toBe(6);

		const withNa = computeFinanceAccRequirements({
			...base,
			tidakBerlakuItems: [
				{ key: "toeic", note: "Peminatan Indonesia" },
				{ key: "paspor", note: "Tanpa paspor" },
			],
		});
		expect(withNa.required).toBe(4);
		expect(withNa.ok).toBe(true);
	});

	it("T-16: pembiasaan 0/0 sesi atau < 80% ditolak", () => {
		expect(
			checkPembiasaanEligible([{ label: "Piket", total: 0, present: 0 }]).ok,
		).toBe(false);
		expect(
			checkPembiasaanEligible([{ label: "ODS", total: 10, present: 7 }]).ok,
		).toBe(false);
		expect(
			checkPembiasaanEligible([{ label: "ODS", total: 10, present: 8 }]).ok,
		).toBe(true);
	});
});

describe("Perbaikan temuan uji E2E (endpoint)", () => {
	let superToken: string;
	let studentId: number;

	const call = async (
		method: string,
		path: string,
		body?: unknown,
		token = superToken,
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
			.get("/s", ({ jwt }: any) =>
				jwt.sign({
					id: superUser?.id,
					username: superUser?.username || "superadmin",
					role: "superadmin",
					roles: ["superadmin", "akademik", "crm", "finance", "magang"],
				}),
			);
		superToken = await (
			await signer.handle(new Request("http://localhost/s"))
		).text();

		const [s] = await db
			.insert(students)
			.values({ name: "TEST E2E Fixes", program: "Indonesia", cohort: 17 })
			.returning();
		studentId = s.id;
		await db.insert(academicData).values({ studentId });
		await db.insert(crmData).values({ studentId });
		await db.insert(financeData).values({ studentId });
	});

	afterAll(async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				await db
					.delete(courseGrades)
					.where(eq(courseGrades.studentId, studentId));
				await db.delete(crmData).where(eq(crmData.studentId, studentId));
				await db
					.delete(financeData)
					.where(eq(financeData.studentId, studentId));
				await db
					.delete(academicData)
					.where(eq(academicData.studentId, studentId));
				await db.delete(students).where(eq(students.id, studentId));
				return;
			} catch {
				await Bun.sleep(1000);
			}
		}
	});

	it("T-08: utsPassed/uasPassed tidak bisa dicentang manual", async () => {
		const r = await call("PATCH", "/academic", { utsPassed: true });
		expect(r.status).toBe(400);
		expect(r.json.code).toBe("AUTO_FIELD_READONLY");
		const row = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, studentId),
		});
		expect(row?.utsPassed).toBeFalsy();

		// Field lain tetap bisa diubah
		const ok = await call("PATCH", "/academic", { pddiktiInput: true });
		expect(ok.status).toBe(200);
	});

	it("T-16: ACC pembiasaan ditolak saat 0/0 sesi", async () => {
		const r = await call("PATCH", "/crm", { practiceAttendance: true });
		expect(r.status).toBe(400);
		expect(r.json.code).toBe("PEMBIASAAN_NOT_ELIGIBLE");
		const row = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, studentId),
		});
		expect(row?.practiceAttendance).toBeFalsy();
	});

	it("T-16: ACC pembiasaan diterima bila semua >= 80%", async () => {
		await db
			.update(academicData)
			.set({
				attendancePiketTotal: 10,
				attendancePiketPresent: 9,
				attendanceBarisTotal: 10,
				attendanceBarisPresent: 8,
				attendanceOdsTotal: 5,
				attendanceOdsPresent: 5,
				attendancePramagangTotal: 4,
				attendancePramagangPresent: 4,
			})
			.where(eq(academicData.studentId, studentId));
		const r = await call("PATCH", "/crm", { practiceAttendance: true });
		expect(r.status).toBe(200);
	});

	it("T-12: sesi ODS tanpa tanggal/industri tidak terhitung selesai", async () => {
		const r = await call("PATCH", "/crm", {
			odsDetails: [
				{ isDone: true, date: "", industry: "" },
				{ isDone: true, date: "2026-09-19", industry: "Hotel B" },
			],
		});
		expect(r.status).toBe(200);
		const row = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, studentId),
		});
		expect(row?.isOds1Report).toBe(false);
		expect(row?.isOds2Report).toBe(true);
	});

	it("T-02: ACC Keuangan ditolak dengan rincian pos belum lunas", async () => {
		await db
			.update(financeData)
			.set({ totalBiayaPendidikan: 18000000, registrasiStatus: true })
			.where(eq(financeData.studentId, studentId));
		const r = await call("POST", "/finance/acc");
		expect(r.status).toBe(400);
		expect(r.json.code).toBe("FINANCE_CHECKLIST");
		expect(r.json.message).toContain("SPP Semester 1");
	});

	it("T-02: pos tidak berlaku butuh catatan, lalu dilewati saat ACC", async () => {
		const noNote = await call("PUT", "/finance/tidak-berlaku", {
			key: "toeic",
			notApplicable: true,
		});
		expect(noNote.status).toBe(400);

		for (const key of [
			"semester",
			"interview",
			"keberangkatan",
			"toeic",
			"paspor",
		]) {
			const r = await call("PUT", "/finance/tidak-berlaku", {
				key,
				notApplicable: true,
				note: "Tidak berlaku untuk peminatan Indonesia",
			});
			expect(r.status).toBe(200);
		}
		const acc = await call("POST", "/finance/acc");
		expect(acc.status).toBe(200);
		const row = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, studentId),
		});
		expect(row?.isAcc).toBe(true);

		// Dibatalkan kembali: pos jadi tagihan lagi
		const undo = await call("PUT", "/finance/tidak-berlaku", {
			key: "paspor",
			notApplicable: false,
		});
		expect(undo.status).toBe(200);
		expect((undo.json.data as any[]).some((i) => i.key === "paspor")).toBe(
			false,
		);
	});

	it("N1: menambah mata kuliah dua kali tidak membuat nilai ganda", async () => {
		const dosen = await db.query.users.findFirst();
		const payload = {
			courseCode: "TEST-DUP-001",
			courseName: "Mata Kuliah Uji Duplikat",
			dosenId: dosen?.id as number,
		};
		const a = await call("POST", "/course-grades", payload);
		const b = await call("POST", "/course-grades", payload);
		expect(a.status).toBe(200);
		expect(b.status).toBe(200);
		const rows = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, studentId),
		});
		expect(rows.filter((r) => r.courseCode === "TEST-DUP-001")).toHaveLength(1);
	});
});
