import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { auditLogs, pmbPaymentPlan, students } from "../db/schema";
import { cacheInvalidatePattern } from "./cache";

/** Batas bayar DP (hari kalender) sejak tagihan/VA diterbitkan. Belum ditagih = timer belum jalan. */
export const BILLING_DUE_DAYS = 2;

export function computeBillingDueDate(from: Date = new Date()): Date {
	return new Date(from.getTime() + BILLING_DUE_DAYS * 24 * 60 * 60 * 1000);
}

/** Kondisi SQL "terlambat": tagihan sudah diterbitkan dan batas bayar sudah lewat. */
export const overdueCondition = sql`(${pmbPaymentPlan.billingDueDate} is not null and ${pmbPaymentPlan.billingDueDate} < now())`;

/**
 * Arsipkan otomatis mahasiswa menunggu pembayaran yang melewati batas bayar.
 * Tidak menghapus data; saat Finance menyetujui lunas, mahasiswa keluar arsip & aktif.
 */
export async function archiveOverdueWaitingStudents(): Promise<number> {
	const overdue = await db
		.select({ id: students.id, name: students.name })
		.from(students)
		.innerJoin(pmbPaymentPlan, eq(pmbPaymentPlan.studentId, students.id))
		.where(
			and(
				eq(students.studentStatus, "menunggu_pembayaran"),
				eq(students.isArchived, false),
				eq(pmbPaymentPlan.statusDp, false),
				overdueCondition,
			),
		);

	if (overdue.length === 0) return 0;

	for (const s of overdue) {
		await db
			.update(students)
			.set({ isArchived: true, updatedAt: new Date() })
			.where(eq(students.id, s.id));
	}

	// shortcut: audit hanya jika ada user sistem (superadmin pertama), kapan di-upgrade: saat ada akun sistem khusus
	const admin = await db.query.users.findFirst({
		where: (u, { eq: e }) => e(u.role, "superadmin"),
		columns: { id: true },
	});
	if (admin) {
		await db.insert(auditLogs).values(
			overdue.map((s) => ({
				userId: admin.id,
				action: "ARCHIVE_OVERDUE_WAITING_STUDENT",
				entity: "students",
				entityId: s.id,
				details: { studentName: s.name, dueDays: BILLING_DUE_DAYS },
			})),
		);
	}

	await Promise.all([
		cacheInvalidatePattern("cache:students:list:*"),
		cacheInvalidatePattern("cache:mahasiswa:*"),
		cacheInvalidatePattern("cache:dashboard:*"),
	]);
	return overdue.length;
}
