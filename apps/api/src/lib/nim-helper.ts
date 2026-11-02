import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db";
import {
	auditLogs,
	financeData,
	pmbData,
	pmbPaymentPlan,
	students,
	users,
} from "../db/schema";
import { cacheDel, cacheInvalidatePattern } from "./cache";

/**
 * Menghasilkan Nomor Induk Mahasiswa (NIM) berikutnya secara sekuensial.
 * Format standar Nusadaya: [2 digit tahun][4 digit nomor urut] (contoh: 260001, 260002)
 */
export async function generateNextNim(
	cohortYear?: number | string | null,
): Promise<string> {
	let yearNumber = new Date().getFullYear();
	if (cohortYear) {
		const parsed = Number(cohortYear);
		if (!isNaN(parsed)) {
			if (parsed >= 2000 && parsed <= 2100) {
				yearNumber = parsed;
			} else if (parsed >= 20 && parsed <= 99) {
				yearNumber = 2000 + parsed;
			}
		}
	}

	const yearPrefix = yearNumber.toString().slice(-2); // misal "26"

	// Cari seluruh NIM 6-digit yang diawali dengan yearPrefix
	const existingStudents = await db
		.select({ nim: students.nim })
		.from(students)
		.where(
			and(
				isNotNull(students.nim),
				sql`length(${students.nim}) = 6`,
				sql`${students.nim} LIKE ${`${yearPrefix}%`}`,
			),
		);

	let maxSeq = 0;
	for (const s of existingStudents) {
		if (s.nim && s.nim.startsWith(yearPrefix) && s.nim.length === 6) {
			const seq = parseInt(s.nim.substring(2), 10);
			if (!isNaN(seq) && seq > maxSeq) {
				maxSeq = seq;
			}
		}
	}

	let candidateSeq = maxSeq + 1;
	let candidateNim = `${yearPrefix}${candidateSeq.toString().padStart(4, "0")}`;

	// Pastikan kandidat NIM benar-benar unik (defensive check)
	let attempts = 0;
	while (attempts < 100) {
		const conflict = await db.query.students.findFirst({
			where: eq(students.nim, candidateNim),
			columns: { id: true },
		});
		if (!conflict) break;
		candidateSeq++;
		candidateNim = `${yearPrefix}${candidateSeq.toString().padStart(4, "0")}`;
		attempts++;
	}

	return candidateNim;
}

export interface AutoIssueNimResult {
	success: boolean;
	nim?: string;
	alreadyIssued?: boolean;
	message: string;
}

/**
 * Menerbitkan NIM secara otomatis untuk mahasiswa setelah pembayaran registrasi awal divalidasi Finance.
 * Trigger ini dipanggil otomatis ketika Finance memvalidasi / melunasi Registrasi Awal (Termin 1).
 */
export async function autoIssueStudentNim(
	studentId: number,
	executorUserId?: number,
): Promise<AutoIssueNimResult> {
	const sId = Number(studentId);
	if (!sId || isNaN(sId)) {
		return { success: false, message: "ID Mahasiswa tidak valid" };
	}

	const [student, fin, pmb, plan] = await Promise.all([
		db.query.students.findFirst({
			where: eq(students.id, sId),
		}),
		db.query.financeData.findFirst({
			where: eq(financeData.studentId, sId),
		}),
		db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, sId),
		}),
		db.query.pmbPaymentPlan.findFirst({
			where: eq(pmbPaymentPlan.studentId, sId),
		}),
	]);

	if (!student) {
		return { success: false, message: "Data mahasiswa tidak ditemukan" };
	}

	// Jika mahasiswa sudah memiliki NIM, tidak perlu membuat baru
	if (student.nim && student.nim.trim().length > 0) {
		return {
			success: true,
			nim: student.nim,
			alreadyIssued: true,
			message: `Mahasiswa sudah memiliki NIM resmi: ${student.nim}`,
		};
	}

	// Verifikasi kelengkapan pembayaran registrasi awal dari Finance
	const isRegistrasiLunas = Boolean(
		fin?.registrasiStatus || (fin as any)?.registrationPaid || plan?.statusDp,
	);

	if (!isRegistrasiLunas) {
		return {
			success: false,
			message:
				"Penerbitan NIM tertahan: Pembayaran registrasi awal belum tervalidasi Finance.",
		};
	}

	// Generate NIM berikutnya
	const newNim = await generateNextNim(student.cohort);

	// Update NIM di tabel students
	await db
		.update(students)
		.set({
			nim: newNim,
			updatedAt: new Date(),
		})
		.where(eq(students.id, sId));

	// Sinkronisasi username akun login mahasiswa ke NIM baru jika akun ada
	if (student.studentUserId) {
		const userRecord = await db.query.users.findFirst({
			where: eq(users.id, student.studentUserId),
		});
		if (
			userRecord &&
			(userRecord.username.startsWith("mhs_") ||
				userRecord.username === userRecord.email ||
				!userRecord.username)
		) {
			await db
				.update(users)
				.set({
					username: newNim,
					updatedAt: new Date(),
				})
				.where(eq(users.id, student.studentUserId));
		}
	}

	// Catat audit log
	if (executorUserId) {
		await db.insert(auditLogs).values({
			userId: executorUserId,
			action: "AUTO_GENERATE_NIM",
			entity: "students",
			entityId: sId,
			details: {
				nim: newNim,
				studentName: student.name,
				cohort: student.cohort,
				reason: "Registrasi awal tervalidasi lunas oleh Finance (Segmen 5)",
			},
		});
	}

	// Invalidate cache terkait
	await Promise.all([
		cacheDel(`cache:student:${sId}`),
		cacheInvalidatePattern("cache:students:list:*"),
		cacheInvalidatePattern("cache:mahasiswa:*"),
	]);

	return {
		success: true,
		nim: newNim,
		alreadyIssued: false,
		message: `NIM resmi ${newNim} berhasil diterbitkan secara otomatis setelah registrasi awal tervalidasi Finance.`,
	};
}
