import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
	auditLogs,
	financeData,
	pmbPaymentPlan,
	students,
	users,
} from "../src/db/schema";
import {
	applyDpVerification,
	checkWaitingStatusChange,
} from "../src/lib/student-activation";
import { archiveOverdueWaitingStudents } from "../src/lib/waiting-list";

describe("Waiting list DP: aktif hanya setelah Finance verifikasi lunas", () => {
	let studentId: number;
	let adminId: number;

	beforeAll(async () => {
		const admin = await db.query.users.findFirst({
			where: eq(users.role, "superadmin"),
		});
		adminId = admin?.id ?? 1;
		const [s] = await db
			.insert(students)
			.values({
				name: "TEST Waiting List",
				program: "Indonesia",
				cohort: 17,
				studentStatus: "menunggu_pembayaran",
			})
			.returning();
		studentId = s.id;
		await db.insert(pmbPaymentPlan).values({ studentId });
		await db.insert(financeData).values({ studentId });
	});

	afterAll(async () => {
		await db
			.delete(pmbPaymentPlan)
			.where(eq(pmbPaymentPlan.studentId, studentId));
		await db.delete(financeData).where(eq(financeData.studentId, studentId));
		await db.delete(auditLogs).where(eq(auditLogs.entityId, studentId));
		await db.delete(students).where(eq(students.id, studentId));
	});

	const status = async () =>
		(await db.query.students.findFirst({ where: eq(students.id, studentId) }))!;

	it("tidak bisa diaktifkan manual sebelum lunas (non-superadmin)", async () => {
		const msg = await checkWaitingStatusChange(studentId, "aktif", {
			id: 1,
			role: "akademik",
			roles: ["akademik"],
		});
		expect(msg).toContain("waiting list");
	});

	it("belum ditagih: tidak diarsipkan walau sudah lama mendaftar", async () => {
		await db
			.update(students)
			.set({ createdAt: new Date(Date.now() - 30 * 86_400_000) })
			.where(eq(students.id, studentId));
		await archiveOverdueWaitingStudents();
		const s = await status();
		expect(s.isArchived).toBe(false);
		expect(s.studentStatus).toBe("menunggu_pembayaran");
	});

	it("VA sudah terbit & lewat 2 hari: diarsipkan otomatis, belum aktif", async () => {
		await db
			.update(pmbPaymentPlan)
			.set({ billingDueDate: new Date(Date.now() - 86_400_000) })
			.where(eq(pmbPaymentPlan.studentId, studentId));
		const n = await archiveOverdueWaitingStudents();
		expect(n).toBeGreaterThanOrEqual(1);
		const s = await status();
		expect(s.isArchived).toBe(true);
		expect(s.studentStatus).toBe("menunggu_pembayaran");
	});

	it("Finance setujui lunas: aktif, keluar arsip, NIM terbit", async () => {
		await db
			.update(financeData)
			.set({ registrasiStatus: true })
			.where(eq(financeData.studentId, studentId));
		const res = await applyDpVerification({
			studentId,
			paid: true,
			wasPaid: false,
			userId: adminId,
		});
		expect(res.statusChanged).toBe("aktif");
		const s = await status();
		expect(s.studentStatus).toBe("aktif");
		expect(s.isArchived).toBe(false);
		expect(s.nim).toBeTruthy();
	});

	it("batal lunas: kembali ke waiting, NIM tetap", async () => {
		const before = await status();
		await db
			.update(financeData)
			.set({ registrasiStatus: false })
			.where(eq(financeData.studentId, studentId));
		const res = await applyDpVerification({
			studentId,
			paid: false,
			wasPaid: true,
			userId: adminId,
		});
		expect(res.statusChanged).toBe("menunggu_pembayaran");
		const after = await status();
		expect(after.studentStatus).toBe("menunggu_pembayaran");
		expect(after.nim).toBe(before.nim);
	});

	it("mahasiswa lama tanpa transisi true->false tidak di-revert", async () => {
		await db
			.update(students)
			.set({ studentStatus: "aktif" })
			.where(eq(students.id, studentId));
		const res = await applyDpVerification({
			studentId,
			paid: false,
			wasPaid: false,
			userId: adminId,
		});
		expect(res.statusChanged).toBeNull();
		expect((await status()).studentStatus).toBe("aktif");
	});
});
