import { and, asc, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import {
	academicData,
	academicDocuments,
	internshipData,
	internshipDocuments,
	internshipInterviews,
	pmbData,
	pmbDocuments,
	students,
	users,
} from "../../db/schema";
import { cacheDel, cacheInvalidatePattern } from "../../lib/cache";
import { getMagangPrerequisites } from "../../lib/magang-prerequisites";
import {
	getInternshipChecks,
	isTaiwanDestination,
	recalculateInternshipStatus,
	upsertInternshipFlags,
} from "../../lib/magang-sync";

export { isTaiwanDestination };

/** Negara tujuan mahasiswa (untuk aturan khusus Taiwan: Suhan). */
async function getDestinationCountry(studentId: number) {
	const row = await db.query.students.findFirst({
		where: eq(students.id, studentId),
		columns: { destinationCountry: true },
	});
	return row?.destinationCountry ?? null;
}

async function syncPassedInterviewToInternship(studentId: number) {
	const [passed] = await db
		.select()
		.from(internshipInterviews)
		.where(
			and(
				eq(internshipInterviews.studentId, studentId),
				eq(internshipInterviews.result, "lulus"),
			),
		)
		.orderBy(
			desc(internshipInterviews.interviewDate),
			desc(internshipInterviews.id),
		)
		.limit(1);

	if (!passed) return;

	await upsertInternshipFlags(studentId, {
		interviewReady: true,
		interviewResult: "Lulus",
		...(passed.interviewDate ? { interviewDate: passed.interviewDate } : {}),
	});
}

import { getValidUserId, hasRole } from "../../lib/permissions";

const interviewBody = t.Object({
	interviewDate: t.Optional(
		t.Union([
			t.String({ format: "date-time" }),
			t.String({ format: "date" }),
			t.Null(),
		]),
	),
	partnerName: t.Optional(t.Union([t.String({ maxLength: 200 }), t.Null()])),
	result: t.Optional(
		t.Union([
			t.Literal("lulus"),
			t.Literal("menunggu"),
			t.Literal("tidak_lulus"),
		]),
	),
});

async function invalidateInternshipCaches(studentId: number) {
	await Promise.all([
		cacheDel(`cache:student:${studentId}`),
		cacheInvalidatePattern("cache:students:*"),
		cacheInvalidatePattern("cache:mahasiswa:*"),
	]);
}

export const internshipRoutes = new Elysia()
	.get("/:id/internship", async ({ params }) => {
		const id = Number(params.id);
		const info = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } },
			},
		});

		return { success: true, data: info || null };
	})
	// Prasyarat diproses Panel Magang (ACC PMB, CRM, Akademik + Registrasi & SPP Sem 1)
	.get("/:id/internship/prerequisites", async ({ params }) => {
		const data = await getMagangPrerequisites(Number(params.id));
		return { success: true, data };
	})
	// Wawancara user (bisa lebih dari satu): tanggal + hotel/agent + hasil
	.get("/:id/internship/interviews", async ({ params }) => {
		const rows = await db
			.select()
			.from(internshipInterviews)
			.where(eq(internshipInterviews.studentId, Number(params.id)))
			.orderBy(
				asc(internshipInterviews.interviewDate),
				asc(internshipInterviews.id),
			);
		return { success: true, data: rows };
	})
	.post(
		"/:id/internship/interviews",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "magang", "internship", "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = Number(params.id);
			const [row] = await db
				.insert(internshipInterviews)
				.values({
					studentId,
					interviewDate: body.interviewDate
						? new Date(body.interviewDate)
						: null,
					partnerName: body.partnerName?.trim() || null,
					result: body.result ?? "menunggu",
				})
				.returning();
			if (row?.result === "lulus") {
				await syncPassedInterviewToInternship(studentId);
			}
			await invalidateInternshipCaches(studentId);
			return { success: true, data: row };
		},
		{ body: interviewBody },
	)
	.patch(
		"/:id/internship/interviews/:interviewId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "magang", "internship", "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const studentId = Number(params.id);
			const updates: Partial<typeof internshipInterviews.$inferInsert> = {
				updatedAt: new Date(),
			};
			if (body.interviewDate !== undefined)
				updates.interviewDate = body.interviewDate
					? new Date(body.interviewDate)
					: null;
			if (body.partnerName !== undefined)
				updates.partnerName = body.partnerName?.trim() || null;
			if (body.result !== undefined) updates.result = body.result;
			const [row] = await db
				.update(internshipInterviews)
				.set(updates)
				.where(
					and(
						eq(internshipInterviews.id, Number(params.interviewId)),
						eq(internshipInterviews.studentId, studentId),
					),
				)
				.returning();
			if (!row) {
				set.status = 404;
				return { success: false, message: "Data wawancara tidak ditemukan" };
			}
			if (row.result === "lulus") {
				await syncPassedInterviewToInternship(studentId);
			}
			await invalidateInternshipCaches(studentId);
			return { success: true, data: row };
		},
		{ body: interviewBody },
	)
	.delete("/:id/internship/interviews/:interviewId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!hasRole(user, "magang", "internship", "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const studentId = Number(params.id);
		const [row] = await db
			.delete(internshipInterviews)
			.where(
				and(
					eq(internshipInterviews.id, Number(params.interviewId)),
					eq(internshipInterviews.studentId, studentId),
				),
			)
			.returning({ id: internshipInterviews.id });
		if (!row) {
			set.status = 404;
			return { success: false, message: "Data wawancara tidak ditemukan" };
		}
		await invalidateInternshipCaches(studentId);
		return { success: true };
	})
	.get("/:id/passport-clearance", async ({ params }) => {
		const id = Number(params.id);

		const pmbDocs = await db
			.select()
			.from(pmbDocuments)
			.where(eq(pmbDocuments.studentId, id));
		const internshipDocs = await db
			.select()
			.from(internshipDocuments)
			.where(eq(internshipDocuments.studentId, id));
		const academicDocs = await db
			.select()
			.from(academicDocuments)
			.where(eq(academicDocuments.studentId, id));

		const pmbDataRow = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, id),
		});
		const academicDataRow = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, id),
		});

		const hasValidDoc = (docs: any[], key: string) =>
			docs.some((d) => d.documentKey === key && d.isVerified === true);

		const checks = {
			pasFoto:
				hasValidDoc(pmbDocs, "pas_foto") ||
				hasValidDoc(internshipDocs, "pas_foto"),
			ktm: hasValidDoc(pmbDocs, "ktm") || hasValidDoc(internshipDocs, "ktm"),
			ktp: hasValidDoc(pmbDocs, "ktp") || hasValidDoc(internshipDocs, "ktp"),
			kk: hasValidDoc(pmbDocs, "kk") || hasValidDoc(internshipDocs, "kk"),
			aktaKelahiran:
				hasValidDoc(pmbDocs, "akta_kelahiran") ||
				hasValidDoc(internshipDocs, "akta_kelahiran"),
			suratIzinOrtu:
				hasValidDoc(pmbDocs, "surat_izin_ortu") ||
				hasValidDoc(internshipDocs, "surat_izin_ortu"),
			sl21: hasValidDoc(pmbDocs, "sl21") || hasValidDoc(internshipDocs, "sl21"),
			skma:
				hasValidDoc(pmbDocs, "skma") ||
				hasValidDoc(internshipDocs, "skma") ||
				hasValidDoc(pmbDocs, "los") ||
				hasValidDoc(internshipDocs, "los"),
			los:
				hasValidDoc(pmbDocs, "skma") ||
				hasValidDoc(internshipDocs, "skma") ||
				hasValidDoc(pmbDocs, "los") ||
				hasValidDoc(internshipDocs, "los"),
			rekomendasiDisdik:
				hasValidDoc(pmbDocs, "rekomendasi_disdik") ||
				hasValidDoc(internshipDocs, "rekomendasi_disdik"),
			khs:
				hasValidDoc(academicDocs, "khs") || hasValidDoc(internshipDocs, "khs"),
			krs:
				hasValidDoc(academicDocs, "krs") || hasValidDoc(internshipDocs, "krs"),
			transkrip:
				hasValidDoc(pmbDocs, "transkrip") ||
				hasValidDoc(internshipDocs, "transkrip"),
			ijazah:
				hasValidDoc(pmbDocs, "ijazah") || hasValidDoc(internshipDocs, "ijazah"),
			gapYear: pmbDataRow?.isGapYear
				? hasValidDoc(pmbDocs, "gap_year") ||
					hasValidDoc(internshipDocs, "gap_year")
				: true,
			pddikti: academicDataRow?.pddiktiInput === true,
		};

		const mandatoryChecks = [
			checks.pasFoto,
			checks.ktm,
			checks.ktp,
			checks.kk,
			checks.aktaKelahiran,
			checks.suratIzinOrtu,
			checks.sl21,
			checks.skma,
			checks.rekomendasiDisdik,
			checks.khs,
			checks.krs,
			checks.transkrip,
			checks.ijazah,
			...(pmbDataRow?.isGapYear ? [checks.gapYear] : []),
		];

		const isAllClear = mandatoryChecks.every((v) => v === true);

		return {
			success: true,
			checks,
			isAllClear,
			isGapYear: pmbDataRow?.isGapYear || false,
		};
	})
	.patch(
		"/:id/internship",
		async (context) => {
			const { params, body, set } = context;
			const id = Number(params.id);
			const user = (context as any).user;
			const updates = body as Record<string, any>;

			if (!hasRole(user, "magang", "internship", "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const agencyPaymentFields = [
				"agenDpPaid",
				"agenDpDate",
				"agenDpNominal",
				"agenPelunasanPaid",
				"agenPelunasanDate",
				"agenPelunasanNominal",
			];
			if (agencyPaymentFields.some((field) => Object.hasOwn(updates, field))) {
				set.status = 403;
				return {
					success: false,
					message:
						"Pembayaran ke agensi mitra hanya dapat dicatat oleh Finance.",
				};
			}

			// Convert string dates to Date objects if necessary
			const dateFields = [
				"passportExp",
				"interviewDate",
				"loaDate",
				"contractDate",
				"mcuDate",
				"languageCertDate",
				"ticketDate",
				"pdtDate",
				"pdtEndDate",
				"moaDate",
				"mouDate",
				"suhanDate",
				"asesmenDate",
				"asuransiBtnBpjsDate",
				"asuransiPenempatanDate",
				"estDepartureDate",
				"danaTahap1Date",
				"danaTahap2Date",
			];
			for (const field of dateFields) {
				if (updates[field]) {
					updates[field] = new Date(updates[field]);
				}
			}

			const cleanUpdates: Record<string, any> = {
				...updates,
				updatedAt: new Date(),
			};

			// Sinkronisasi backward compatibility untuk MOU, Asesmen, dan LOS/SKMA
			if (
				cleanUpdates.praPasporLos !== undefined &&
				cleanUpdates.praPasporSkma === undefined
			) {
				cleanUpdates.praPasporSkma = cleanUpdates.praPasporLos;
			}
			if (
				cleanUpdates.praPasporSkma !== undefined &&
				cleanUpdates.praPasporLos === undefined
			) {
				cleanUpdates.praPasporLos = cleanUpdates.praPasporSkma;
			}
			if (
				cleanUpdates.mouReady !== undefined &&
				cleanUpdates.moaReady === undefined
			) {
				cleanUpdates.moaReady = cleanUpdates.mouReady;
			}
			if (
				cleanUpdates.mouDate !== undefined &&
				cleanUpdates.moaDate === undefined
			) {
				cleanUpdates.moaDate = cleanUpdates.mouDate;
			}
			if (
				cleanUpdates.mouNotes !== undefined &&
				cleanUpdates.moaNotes === undefined
			) {
				cleanUpdates.moaNotes = cleanUpdates.mouNotes;
			}
			if (
				cleanUpdates.asesmenReady !== undefined &&
				cleanUpdates.pdtReady === undefined
			) {
				cleanUpdates.pdtReady = cleanUpdates.asesmenReady;
			}
			if (
				cleanUpdates.asesmenDate !== undefined &&
				cleanUpdates.pdtDate === undefined
			) {
				cleanUpdates.pdtDate = cleanUpdates.asesmenDate;
			}

			// Validate Dana Talangan Tahap 2
			if (cleanUpdates.isDanaTahap2Disbursed === true) {
				const current = await db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, id),
				});
				if (!current?.visaReady && !cleanUpdates.visaReady) {
					set.status = 400;
					return {
						success: false,
						message:
							"Dana Talangan Tahap II hanya bisa dicairkan jika Visa sudah berstatus Ready.",
					};
				}
			}

			// Upsert: ensure internship row exists for this student before patching
			const existing = await db.query.internshipData.findFirst({
				where: eq(internshipData.studentId, id),
			});

			if (!existing) {
				await db.insert(internshipData).values({
					studentId: id,
					...cleanUpdates,
				});
			} else {
				await db
					.update(internshipData)
					.set(cleanUpdates)
					.where(eq(internshipData.studentId, id));
			}

			// Sinkronkan negara tujuan dan peminatan ke profil tabel students secara real-time
			const studentUpdates: Record<string, unknown> = {};
			if (cleanUpdates.agenNegaraTujuan) {
				studentUpdates.destinationCountry = cleanUpdates.agenNegaraTujuan;
			}
			if (cleanUpdates.agenPeminatan) {
				studentUpdates.subProgram = cleanUpdates.agenPeminatan;
			}
			if (Object.keys(studentUpdates).length > 0) {
				studentUpdates.updatedAt = new Date();
				await db
					.update(students)
					.set(studentUpdates)
					.where(eq(students.id, id));
			}

			// Recalculate status
			await recalculateInternshipStatus(id);

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:*"),
				cacheInvalidatePattern("cache:mahasiswa:*"),
				cacheInvalidatePattern("cache:dashboard:*"),
			]);

			return { success: true };
		},
		{
			body: t.Record(t.String(), t.Any()),
		},
	)
	.patch(
		"/:id/internship/schedule",
		async (context) => {
			const { params, body, set } = context;
			const id = Number(params.id);
			const user = (context as any).user;
			const input = body as any;

			if (!hasRole(user, "magang", "internship", "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db
				.update(internshipData)
				.set({
					estDepartureDate: input.estDepartureDate
						? new Date(input.estDepartureDate)
						: null,
					destinationCity: input.destinationCity ?? null,
					internshipDuration: input.internshipDuration ?? null,
					internshipCompany: input.internshipCompany ?? null,
					mitraPenempatanNama: input.mitraPenempatanNama ?? null,
					agenNegaraTujuan: input.agenNegaraTujuan ?? null,
					agenPeminatan: input.agenPeminatan ?? null,
					updatedAt: new Date(),
				})
				.where(eq(internshipData.studentId, id));

			// Sinkronkan negara tujuan dan peminatan ke profil tabel students secara real-time
			const scheduleStudentUpdates: Record<string, unknown> = {};
			if (input.agenNegaraTujuan) {
				scheduleStudentUpdates.destinationCountry = input.agenNegaraTujuan;
			}
			if (input.agenPeminatan) {
				scheduleStudentUpdates.subProgram = input.agenPeminatan;
			}
			if (Object.keys(scheduleStudentUpdates).length > 0) {
				scheduleStudentUpdates.updatedAt = new Date();
				await db
					.update(students)
					.set(scheduleStudentUpdates)
					.where(eq(students.id, id));
			}

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:*"),
				cacheInvalidatePattern("cache:mahasiswa:*"),
				cacheInvalidatePattern("cache:dashboard:*"),
			]);

			return { success: true };
		},
		{
			body: t.Object({
				estDepartureDate: t.Optional(t.Union([t.String(), t.Null()])),
				destinationCity: t.Optional(t.Union([t.String(), t.Null()])),
				internshipDuration: t.Optional(t.Union([t.String(), t.Null()])),
				internshipCompany: t.Optional(t.Union([t.String(), t.Null()])),
				mitraPenempatanNama: t.Optional(t.Union([t.String(), t.Null()])),
				agenNegaraTujuan: t.Optional(t.Union([t.String(), t.Null()])),
				agenPeminatan: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.post("/:id/internship/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!hasRole(user, "magang", "internship", "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		// Fetch internship data
		const [internship] = await db
			.select()
			.from(internshipData)
			.where(eq(internshipData.studentId, id));
		if (!internship) {
			set.status = 404;
			return {
				success: false,
				message: "Data magang mahasiswa tidak ditemukan",
			};
		}

		const prereq = await getMagangPrerequisites(id);
		if (!prereq.ok) {
			set.status = 400;
			return {
				success: false,
				code: "MAGANG_PREREQUISITES",
				message: `Gagal memberikan ACC: mahasiswa belum memenuhi prasyarat Magang (${prereq.missing.join(", ")}).`,
			};
		}

		const pmbDataRow = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, id),
		});
		const isGapYear = pmbDataRow?.isGapYear || false;

		const { completed, total, isAllCompleted } = getInternshipChecks(
			internship,
			isGapYear,
			await getDestinationCountry(id),
		);
		if (!isAllCompleted) {
			set.status = 400;
			return {
				success: false,
				message: `Gagal memberikan ACC: Masih ada ${total - completed} dari ${total} checklist magang yang belum selesai.`,
			};
		}

		const userId = (await getValidUserId(user)) || user?.id;

		await db
			.update(internshipData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: userId,
				status: "ACC",
				updatedAt: new Date(),
			})
			.where(eq(internshipData.studentId, id));

		await Promise.all([
			cacheDel(`cache:student:${id}`),
			cacheInvalidatePattern("cache:students:*"),
			cacheInvalidatePattern("cache:mahasiswa:*"),
			cacheInvalidatePattern("cache:dashboard:*"),
		]);

		return { success: true };
	})
	.delete("/:id/internship/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!hasRole(user, "magang", "internship", "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const current = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, id),
		});
		let fallbackStatus: "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
			"BUTUH_PERHATIAN";
		if (current) {
			const pmbDataRow = await db.query.pmbData.findFirst({
				where: eq(pmbData.studentId, id),
			});
			const isGapYear = pmbDataRow?.isGapYear || false;
			const { completed, total } = getInternshipChecks(
				current,
				isGapYear,
				await getDestinationCountry(id),
			);
			fallbackStatus =
				completed === total
					? "AMAN"
					: total > 0 && (completed / total) * 100 > 30
						? "PROSES"
						: "BUTUH_PERHATIAN";
		}

		await db
			.update(internshipData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
				status: fallbackStatus,
				updatedAt: new Date(),
			})
			.where(eq(internshipData.studentId, id));

		await Promise.all([
			cacheDel(`cache:student:${id}`),
			cacheInvalidatePattern("cache:students:*"),
			cacheInvalidatePattern("cache:mahasiswa:*"),
			cacheInvalidatePattern("cache:dashboard:*"),
		]);

		return { success: true };
	});
