import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { app } from "../src";
import { db } from "../src/db";
import {
	academicData,
	academicDocuments,
	auditLogs,
	courseGrades,
	files,
	financeDocuments,
	internshipData,
	internshipDocuments,
	internshipInterviews,
	pmbData,
	pmbDocuments,
	postInternshipDocs,
	students,
	users,
} from "../src/db/schema";
import { computeMagangPrerequisites } from "../src/lib/magang-prerequisites";
import { JWT_SECRET } from "../src/middleware/auth";
import { fileService } from "../src/modules/file/service/file.service";

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
	let financeToken: string;
	let magangToken: string;
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
			)
			.get("/finance", ({ jwt }: any) =>
				jwt.sign({
					id: 0,
					username: "finance",
					role: "finance",
					roles: ["finance"],
				}),
			)
			.get("/magang", ({ jwt }: any) =>
				jwt.sign({
					id: 0,
					username: "magang",
					role: "magang",
					roles: ["magang"],
				}),
			);
		superToken = await (
			await signer.handle(new Request("http://localhost/super"))
		).text();
		pmbToken = await (
			await signer.handle(new Request("http://localhost/pmb"))
		).text();
		financeToken = await (
			await signer.handle(new Request("http://localhost/finance"))
		).text();
		magangToken = await (
			await signer.handle(new Request("http://localhost/magang"))
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
				const studentFiles = await db
					.select({ id: files.id })
					.from(files)
					.where(eq(files.studentId, studentId));
				for (const f of studentFiles) {
					await fileService.deleteFile(f.id).catch(() => {});
				}
				await db.delete(files).where(eq(files.studentId, studentId));
				await db
					.delete(auditLogs)
					.where(
						and(
							eq(auditLogs.entity, "student"),
							eq(auditLogs.entityId, studentId),
						),
					);
				await db
					.delete(courseGrades)
					.where(eq(courseGrades.studentId, studentId));
				await db
					.delete(academicDocuments)
					.where(eq(academicDocuments.studentId, studentId));
				await db
					.delete(postInternshipDocs)
					.where(eq(postInternshipDocs.studentId, studentId));
				await db
					.delete(internshipDocuments)
					.where(eq(internshipDocuments.studentId, studentId));
				await db
					.delete(pmbDocuments)
					.where(eq(pmbDocuments.studentId, studentId));
				await db
					.delete(financeDocuments)
					.where(eq(financeDocuments.studentId, studentId));
				await db
					.delete(internshipInterviews)
					.where(eq(internshipInterviews.studentId, studentId));
				await db
					.delete(internshipData)
					.where(eq(internshipData.studentId, studentId));
				await db
					.delete(academicData)
					.where(eq(academicData.studentId, studentId));
				await db.delete(pmbData).where(eq(pmbData.studentId, studentId));
				await db.delete(students).where(eq(students.id, studentId));
				return;
			} catch (err) {
				console.warn("[Test afterAll retry]:", err);
				await Bun.sleep(500);
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

	it("termin agensi tersimpan lewat PATCH /finance/agency-payments untuk finance & superadmin", async () => {
		const rFinance = await call(
			"PATCH",
			"/finance/agency-payments",
			financeToken,
			{
				agenDpPaid: true,
				agenDpDate: "2026-10-25T00:00:00.000Z",
				agenDpNominal: 5000000,
			},
		);
		expect(rFinance.status).toBe(200);
		expect(rFinance.json.data.agenDpPaid).toBe(true);

		const rSuper = await call("PATCH", "/finance/agency-payments", superToken, {
			agenPelunasanPaid: true,
			agenPelunasanDate: "2026-11-10T00:00:00.000Z",
			agenPelunasanNominal: 12000000,
		});
		expect(rSuper.status).toBe(200);
		expect(rSuper.json.data.agenPelunasanPaid).toBe(true);

		const row = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, studentId),
		});
		expect(row?.agenDpPaid).toBe(true);
		expect(row?.agenDpNominal).toBe(5000000);
		expect(row?.agenDpDate).toBeInstanceOf(Date);
		expect(row?.agenPelunasanPaid).toBe(true);
		expect(row?.agenPelunasanNominal).toBe(12000000);
		expect(row?.agenPelunasanDate).toBeInstanceOf(Date);
	});

	it("PATCH /finance/agency-payments ditolak 403 untuk magang dan pmb", async () => {
		const rMagang = await call(
			"PATCH",
			"/finance/agency-payments",
			magangToken,
			{ agenDpPaid: true },
		);
		expect(rMagang.status).toBe(403);

		const rPmb = await call("PATCH", "/finance/agency-payments", pmbToken, {
			agenDpPaid: true,
		});
		expect(rPmb.status).toBe(403);
	});

	it("PATCH /internship menolak field pembayaran agensi dengan 403", async () => {
		const r = await call("PATCH", "/internship", magangToken, {
			agenDpPaid: true,
		});
		expect(r.status).toBe(403);
	});

	it("upload dan hapus bukti pembayaran agensi (agen_dp / agen_pelunasan) ditolak 403 untuk non-finance", async () => {
		const form = new FormData();
		form.append("documentKey", "agen_dp");
		form.append(
			"file",
			new File(["%PDF-1.4"], "bukti-dp.pdf", { type: "application/pdf" }),
		);

		const uploadRes = await app.handle(
			new Request(`http://localhost/students/${studentId}/finance/documents`, {
				method: "POST",
				headers: { Authorization: `Bearer ${magangToken}` },
				body: form,
			}),
		);
		expect(uploadRes.status).toBe(403);

		const [insertedDoc] = await db
			.insert(financeDocuments)
			.values({
				studentId,
				documentKey: "agen_pelunasan",
				fileName: "bukti-pelunasan.pdf",
				fileUrl: "/files/test-dummy/download",
			})
			.returning();

		const deleteRes = await app.handle(
			new Request(
				`http://localhost/students/${studentId}/finance/documents/${insertedDoc.id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${magangToken}` },
				},
			),
		);
		expect(deleteRes.status).toBe(403);
	});

	it("PMB upload ktp otomatis menyinkronkan praPasporKtp dan menyalin dokumen ke Magang", async () => {
		await db.insert(pmbData).values({ studentId }).onConflictDoNothing();

		const form = new FormData();
		form.append("documentKey", "ktp");
		form.append(
			"file",
			new File(["%PDF-1.4\n%test"], "ktp-test.pdf", {
				type: "application/pdf",
			}),
		);

		const res = await app.handle(
			new Request(`http://localhost/students/${studentId}/pmb/documents`, {
				method: "POST",
				headers: { Authorization: `Bearer ${superToken}` },
				body: form,
			}),
		);
		expect(res.status).toBe(200);

		const row = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, studentId),
		});
		expect(row?.praPasporKtp).toBe(true);

		const copiedDocs = await db
			.select()
			.from(internshipDocuments)
			.where(
				and(
					eq(internshipDocuments.studentId, studentId),
					eq(internshipDocuments.documentKey, "ktp"),
				),
			);
		expect(copiedDocs.length).toBeGreaterThanOrEqual(1);
	});

	it("Academic ACC otomatis menyinkronkan KHS, KRS, dan Transkrip ke Magang", async () => {
		await db
			.insert(academicData)
			.values({
				studentId,
				pddiktiInput: true,
				utsPassed: true,
				uasPassed: true,
				attitudeIndicator: true,
				assignmentsCompleted: true,
				academicCommunication: true,
			})
			.onConflictDoNothing();

		const res = await call("POST", "/academic/acc", superToken);
		expect(res.status).toBe(200);

		const row = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, studentId),
		});
		expect(row?.praPasporKhs).toBe(true);
		expect(row?.praPasporKrs).toBe(true);
		expect(row?.praPasporTranskrip).toBe(true);
	});

	it("Upload dokumen magang & post-internship otomatis mencentang checklist", async () => {
		const passportForm = new FormData();
		passportForm.append("documentKey", "passport");
		passportForm.append(
			"file",
			new File(["%PDF-1.4\n%test"], "passport.pdf", {
				type: "application/pdf",
			}),
		);
		const passportRes = await app.handle(
			new Request(`http://localhost/students/${studentId}/magang/documents`, {
				method: "POST",
				headers: { Authorization: `Bearer ${superToken}` },
				body: passportForm,
			}),
		);
		expect(passportRes.status).toBe(200);

		const logbookForm = new FormData();
		logbookForm.append("documentKey", "logbook");
		logbookForm.append(
			"file",
			new File(["%PDF-1.4\n%test"], "logbook.pdf", {
				type: "application/pdf",
			}),
		);
		const logbookRes = await app.handle(
			new Request(
				`http://localhost/students/${studentId}/post-internship/documents`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${superToken}` },
					body: logbookForm,
				},
			),
		);
		expect(logbookRes.status).toBe(200);

		const row = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, studentId),
		});
		expect(row?.passportReady).toBe(true);
		expect(row?.logbookReady).toBe(true);
	});

	it("Wawancara berstatus lulus otomatis mencentang interviewReady", async () => {
		const created = await call("POST", "/internship/interviews", magangToken, {
			interviewDate: "2026-11-15",
			partnerName: "Mandarin Oriental Taipei",
			result: "lulus",
		});
		expect(created.status).toBe(200);

		const row = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, studentId),
		});
		expect(row?.interviewReady).toBe(true);
		expect(row?.interviewResult).toBe("Lulus");
	});

	it("PATCH /students/:id/finance ditolak 403 untuk role magang", async () => {
		const res = await call("PATCH", "/finance", magangToken, {
			talanganNotes: "Coba ubah dari magang",
		});
		expect(res.status).toBe(403);
	});
});
