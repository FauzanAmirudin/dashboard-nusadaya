import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
	internshipData,
	internshipDocuments,
	pmbData,
	pmbDocuments,
	students,
} from "../db/schema";
import { cacheDel, cacheInvalidatePattern } from "./cache";

const PMB_IDENTITY_DOC_KEYS = ["pas_foto", "ktp", "kk", "ijazah"] as const;

export type InternshipCheckInput = Partial<
	typeof internshipData.$inferSelect
> | null;

/** Alur dokumen & istilah Suhan hanya berlaku untuk penempatan Taiwan. */
export function isTaiwanDestination(
	destinationCountry?: string | null,
): boolean {
	return (destinationCountry || "").toLowerCase().includes("taiwan");
}

export function getInternshipChecks(
	internship: InternshipCheckInput | undefined,
	isGapYear = false,
	destinationCountry?: string | null,
) {
	const praPasporChecks = [
		Boolean(internship?.praPasporPasFoto),
		Boolean(internship?.praPasporKtm),
		Boolean(internship?.praPasporKtp),
		Boolean(internship?.praPasporKk),
		Boolean(internship?.praPasporAktaKelahiran),
		Boolean(internship?.praPasporSuratIzinOrtu),
		Boolean(internship?.praPasporSl21),
		Boolean(internship?.praPasporSkma || internship?.praPasporLos),
		Boolean(internship?.praPasporRekomendasiDisdik),
		Boolean(internship?.praPasporKhs),
		Boolean(internship?.praPasporKrs),
		Boolean(internship?.praPasporTranskrip),
		Boolean(internship?.praPasporIjazah),
		...(isGapYear ? [Boolean(internship?.praPasporGapYear)] : []),
	];

	const dokumenChecks = [
		Boolean(internship?.passportReady),
		Boolean(internship?.interviewReady),
		Boolean(internship?.mouReady ?? internship?.moaReady),
		Boolean(internship?.loaConfirmed),
		Boolean(internship?.contractReady),
		// Suhan = izin Biro Pariwisata Taiwan, hanya wajib untuk tujuan Taiwan
		...(isTaiwanDestination(destinationCountry)
			? [Boolean(internship?.suhanReady)]
			: []),
		Boolean(internship?.mcuReady),
		Boolean(internship?.visaReady),
		Boolean(internship?.ticketReady),
		Boolean(internship?.asesmenReady ?? internship?.pdtReady),
		Boolean(internship?.dokumentasiReady),
		Boolean(internship?.agenReady),
		Boolean(internship?.asuransiBtnBpjsReady),
		Boolean(internship?.asuransiPenempatanReady),
		Boolean(internship?.ahliWarisReady),
	];

	// Syarat Akhir / Berkas Kepulangan diisi pasca-magang, tidak memblokir ACC keberangkatan
	const all = [...praPasporChecks, ...dokumenChecks];
	const completed = all.filter(Boolean).length;
	const total = all.length;

	return { completed, total, isAllCompleted: completed === total };
}

export async function invalidateMagangCaches(studentId: number) {
	await Promise.all([
		cacheDel(`cache:student:${studentId}`),
		cacheInvalidatePattern("cache:students:*"),
		cacheInvalidatePattern("cache:mahasiswa:*"),
		cacheInvalidatePattern("cache:dashboard:*"),
	]);
}

export async function recalculateInternshipStatus(studentId: number) {
	const current = await db.query.internshipData.findFirst({
		where: eq(internshipData.studentId, studentId),
	});
	if (!current) return null;

	const [pmbDataRow, studentRow] = await Promise.all([
		db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, studentId),
			columns: { isGapYear: true },
		}),
		db.query.students.findFirst({
			where: eq(students.id, studentId),
			columns: { destinationCountry: true },
		}),
	]);

	const isGapYear = Boolean(pmbDataRow?.isGapYear);
	const { completed, total } = getInternshipChecks(
		current,
		isGapYear,
		studentRow?.destinationCountry ?? null,
	);

	let newStatus: "ACC" | "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
		"BUTUH_PERHATIAN";
	if (current.isAcc) newStatus = "ACC";
	else if (completed === total) newStatus = "AMAN";
	else if (total > 0 && (completed / total) * 100 > 30) newStatus = "PROSES";

	if (current.status !== newStatus) {
		await db
			.update(internshipData)
			.set({ status: newStatus, updatedAt: new Date() })
			.where(eq(internshipData.studentId, studentId));
	}

	return { status: newStatus, completed, total };
}

/**
 * Upsert flag/field ke internship_data, hitung ulang status, dan invalidasi cache.
 */
export async function upsertInternshipFlags(
	studentId: number,
	updates: Partial<typeof internshipData.$inferInsert>,
) {
	const existing = await db.query.internshipData.findFirst({
		where: eq(internshipData.studentId, studentId),
		columns: { id: true },
	});

	if (!existing) {
		await db.insert(internshipData).values({
			studentId,
			...updates,
		});
	} else {
		await db
			.update(internshipData)
			.set({ ...updates, updatedAt: new Date() })
			.where(eq(internshipData.studentId, studentId));
	}

	await recalculateInternshipStatus(studentId);
	await invalidateMagangCaches(studentId);
}

/**
 * Sinkronkan 4 berkas identitas dari PMB (pas_foto, ktp, kk, ijazah) ke Panel Magang
 * agar tidak perlu diunggah atau dicentang ulang.
 */
export async function syncPmbIdentityToMagang(studentId: number) {
	const [pmbRow, pmbDocs, existingInternDocs] = await Promise.all([
		db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, studentId),
			columns: {
				pasFoto: true,
				docKtp: true,
				docKk: true,
				docIjazah: true,
			},
		}),
		db
			.select()
			.from(pmbDocuments)
			.where(
				and(
					eq(pmbDocuments.studentId, studentId),
					inArray(pmbDocuments.documentKey, [...PMB_IDENTITY_DOC_KEYS]),
				),
			),
		db
			.select({
				documentKey: internshipDocuments.documentKey,
				fileUrl: internshipDocuments.fileUrl,
			})
			.from(internshipDocuments)
			.where(
				and(
					eq(internshipDocuments.studentId, studentId),
					inArray(internshipDocuments.documentKey, [...PMB_IDENTITY_DOC_KEYS]),
				),
			),
	]);

	const pmbDocKeySet = new Set(pmbDocs.map((d) => d.documentKey));
	const flagUpdates: Partial<typeof internshipData.$inferInsert> = {};

	if (pmbRow?.pasFoto || pmbDocKeySet.has("pas_foto")) {
		flagUpdates.praPasporPasFoto = true;
	}
	if (pmbRow?.docKtp || pmbDocKeySet.has("ktp")) {
		flagUpdates.praPasporKtp = true;
	}
	if (pmbRow?.docKk || pmbDocKeySet.has("kk")) {
		flagUpdates.praPasporKk = true;
	}
	if (pmbRow?.docIjazah || pmbDocKeySet.has("ijazah")) {
		flagUpdates.praPasporIjazah = true;
	}

	const existingDocPairs = new Set(
		existingInternDocs.map((d) => `${d.documentKey}::${d.fileUrl}`),
	);
	const docsToInsert = pmbDocs.filter(
		(doc) => !existingDocPairs.has(`${doc.documentKey}::${doc.fileUrl}`),
	);

	if (docsToInsert.length > 0) {
		await db.insert(internshipDocuments).values(
			docsToInsert.map((doc) => ({
				studentId,
				documentKey: doc.documentKey,
				fileName: doc.fileName,
				fileUrl: doc.fileUrl,
				fileSize: doc.fileSize,
				mimeType: doc.mimeType,
				uploadedAt: doc.uploadedAt,
				uploadedBy: doc.uploadedBy,
				isVerified: doc.isVerified,
				verifiedAt: doc.verifiedAt,
				verifiedBy: doc.verifiedBy,
			})),
		);
	}

	if (Object.keys(flagUpdates).length > 0) {
		await upsertInternshipFlags(studentId, flagUpdates);
	} else if (docsToInsert.length > 0) {
		await invalidateMagangCaches(studentId);
	}
}
