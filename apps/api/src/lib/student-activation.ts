import { eq } from "drizzle-orm";
import { db } from "../db";
import { auditLogs, financeData, pmbPaymentPlan, students } from "../db/schema";
import { cacheDel, cacheInvalidatePattern } from "./cache";
import { autoIssueStudentNim } from "./nim-helper";
import { hasRole } from "./permissions";

export interface DpVerificationInput {
	studentId: number;
	/** Status lunas DP setelah perubahan oleh Finance. */
	paid: boolean;
	/** Status lunas sebelum perubahan (mencegah revert tak sengaja pada mahasiswa lama). */
	wasPaid: boolean;
	userId?: number;
}

export interface DpVerificationResult {
	statusChanged: "aktif" | "menunggu_pembayaran" | null;
	nimIssued?: string;
}

/**
 * Satu-satunya pintu sinkron status mahasiswa dengan verifikasi DP oleh Finance.
 * - Lunas: menunggu_pembayaran -> aktif (keluar arsip jika terlambat), NIM terbit.
 * - Lunas dibatalkan (true -> false): aktif -> menunggu_pembayaran, NIM tetap.
 */
export async function applyDpVerification(
	input: DpVerificationInput,
): Promise<DpVerificationResult> {
	const { studentId, paid, wasPaid, userId } = input;
	const student = await db.query.students.findFirst({
		where: eq(students.id, studentId),
	});
	if (!student) return { statusChanged: null };

	// Jaga konsistensi dua penanda lunas (pmb_payment_plan & finance_data).
	if (paid !== wasPaid) {
		await db
			.update(pmbPaymentPlan)
			.set({ statusDp: paid, updatedAt: new Date() })
			.where(eq(pmbPaymentPlan.studentId, studentId));
	}

	let statusChanged: DpVerificationResult["statusChanged"] = null;
	let nimIssued: string | undefined;

	if (paid && student.studentStatus === "menunggu_pembayaran") {
		await db
			.update(students)
			.set({
				studentStatus: "aktif",
				isArchived: false,
				updatedAt: new Date(),
			})
			.where(eq(students.id, studentId));
		statusChanged = "aktif";
	} else if (!paid && wasPaid && student.studentStatus === "aktif") {
		await db
			.update(students)
			.set({ studentStatus: "menunggu_pembayaran", updatedAt: new Date() })
			.where(eq(students.id, studentId));
		statusChanged = "menunggu_pembayaran";
	}

	if (paid) {
		const issueRes = await autoIssueStudentNim(studentId, userId);
		if (issueRes.success && !issueRes.alreadyIssued && issueRes.nim) {
			nimIssued = issueRes.nim;
		}
	}

	if (statusChanged && userId) {
		await db.insert(auditLogs).values({
			userId,
			action:
				statusChanged === "aktif"
					? "ACTIVATE_STUDENT_DP_PAID"
					: "REVERT_STUDENT_TO_WAITING",
			entity: "students",
			entityId: studentId,
			details: {
				studentName: student.name,
				from: student.studentStatus,
				to: statusChanged,
			},
		});
	}

	if (statusChanged || paid !== wasPaid) {
		await Promise.all([
			cacheDel(`cache:student:${studentId}`),
			cacheInvalidatePattern("cache:students:list:*"),
			cacheInvalidatePattern("cache:mahasiswa:*"),
			cacheInvalidatePattern("cache:dashboard:*"),
		]);
	}

	return { statusChanged, nimIssued };
}

/**
 * Mahasiswa waiting list tidak boleh diaktifkan lewat ubah status manual
 * sebelum DP diverifikasi lunas Finance (kecuali superadmin).
 * Mengembalikan pesan error, atau null jika diizinkan.
 */
export async function checkWaitingStatusChange(
	studentId: number,
	newStatus: string | undefined | null,
	user: unknown,
): Promise<string | null> {
	if (!newStatus || newStatus === "menunggu_pembayaran") return null;
	if (hasRole(user as any, "superadmin")) return null;
	const [student, plan, fin] = await Promise.all([
		db.query.students.findFirst({
			where: eq(students.id, studentId),
			columns: { studentStatus: true },
		}),
		db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, studentId),
			columns: { statusDp: true },
		}),
		db.query.financeData.findFirst({
			where: eq(financeData.studentId, studentId),
			columns: { registrasiStatus: true },
		}),
	]);
	if (student?.studentStatus !== "menunggu_pembayaran") return null;
	if (plan?.statusDp || fin?.registrasiStatus) return null;
	return "Mahasiswa masih di waiting list: status baru bisa diubah setelah Finance memverifikasi pembayaran DP.";
}
