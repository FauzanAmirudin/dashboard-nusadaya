import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import {
	academicData,
	academicDocuments,
	internshipData,
	internshipDocuments,
	pmbData,
	pmbDocuments,
	students,
	users,
} from "../../db/schema";
import { cacheDel, cacheInvalidatePattern } from "../../lib/cache";
import { getValidUserId, hasRole } from "../../lib/permissions";

/**
 * Standard Helper to compute completed count and total items for Magang
 */
function getInternshipChecks(internship: any, isGapYear = false) {
	const praPasporChecks = [
		Boolean(internship?.praPasporPasFoto),
		Boolean(internship?.praPasporKtm),
		Boolean(internship?.praPasporKtp),
		Boolean(internship?.praPasporKk),
		Boolean(internship?.praPasporAktaKelahiran),
		Boolean(internship?.praPasporSl21),
		Boolean(internship?.praPasporSkma),
		Boolean(internship?.praPasporRekomendasiDisdik),
		...(isGapYear ? [Boolean(internship?.praPasporGapYear)] : []),
		Boolean(internship?.praPasporCv),
	];

	const dokumenChecks = [
		Boolean(internship?.passportReady),
		Boolean(internship?.interviewReady),
		Boolean(internship?.lolReady),
		Boolean(internship?.loaConfirmed),
		Boolean(internship?.moaReady),
		Boolean(internship?.contractReady),
		Boolean(internship?.mcuReady),
		Boolean(internship?.visaReady),
		Boolean(internship?.ticketReady),
		Boolean(internship?.pdtReady),
		Boolean(internship?.dokumentasiReady),
		Boolean(internship?.agenReady),
	];

	const syaratAkhirChecks = [
		Boolean(internship?.logbookReady),
		Boolean(internship?.laporanAkhirReady),
		Boolean(internship?.videoDokumentasiReady),
	];

	const all = [...praPasporChecks, ...dokumenChecks, ...syaratAkhirChecks];
	const completed = all.filter(Boolean).length;
	const total = all.length;

	return { completed, total, isAllCompleted: completed === total };
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
			pasFoto: hasValidDoc(pmbDocs, "pas_foto"),
			ktm: hasValidDoc(pmbDocs, "ktm"),
			ktp: hasValidDoc(pmbDocs, "ktp"),
			kk: hasValidDoc(pmbDocs, "kk"),
			aktaKelahiran: hasValidDoc(pmbDocs, "akta_kelahiran"),
			sl21: hasValidDoc(pmbDocs, "sl21"),
			skma: hasValidDoc(pmbDocs, "skma"),
			rekomendasiDisdik:
				hasValidDoc(pmbDocs, "rekomendasi_disdik") ||
				hasValidDoc(internshipDocs, "rekomendasi_disdik"),
			gapYear: pmbDataRow?.isGapYear ? hasValidDoc(pmbDocs, "gap_year") : true,
			pddikti: academicDataRow?.pddiktiInput === true,
			cv: hasValidDoc(pmbDocs, "cv") || hasValidDoc(internshipDocs, "cv"),
		};

		const mandatoryChecks = [
			checks.pasFoto,
			checks.ktm,
			checks.ktp,
			checks.kk,
			checks.aktaKelahiran,
			checks.sl21,
			checks.skma,
			checks.rekomendasiDisdik,
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

			// Convert string dates to Date objects if necessary
			const dateFields = [
				"passportExp",
				"interviewDate",
				"contractDate",
				"mcuDate",
				"ticketDate",
				"pdtDate",
				"pdtEndDate",
				"moaDate",
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

			// Validate LoL -> LoA -> MoA State Machine
			if (cleanUpdates.loaConfirmed === true) {
				const current = await db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, id),
				});
				if (!current?.lolReady && !cleanUpdates.lolReady) {
					set.status = 400;
					return {
						success: false,
						message: "LoL (Letter of Offer) harus diselesaikan sebelum LoA.",
					};
				}
			}
			if (cleanUpdates.moaReady === true) {
				const current = await db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, id),
				});
				if (!current?.loaConfirmed && !cleanUpdates.loaConfirmed) {
					set.status = 400;
					return {
						success: false,
						message: "LoA harus dikonfirmasi sebelum memasukkan dokumen MoA.",
					};
				}
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

			// Recalculate status
			const current = await db.query.internshipData.findFirst({
				where: eq(internshipData.studentId, id),
			});
			if (current) {
				const pmbDataRow = await db.query.pmbData.findFirst({
					where: eq(pmbData.studentId, id),
				});
				const isGapYear = pmbDataRow?.isGapYear || false;
				const { completed, total } = getInternshipChecks(current, isGapYear);

				let newStatus: "ACC" | "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
					"BUTUH_PERHATIAN";

				if (current.isAcc) newStatus = "ACC";
				else if (completed === total) newStatus = "AMAN";
				else if (total > 0 && (completed / total) * 100 > 30)
					newStatus = "PROSES";

				await db
					.update(internshipData)
					.set({ status: newStatus })
					.where(eq(internshipData.studentId, id));
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
		},
		{
			body: t.Object({
				estDepartureDate: t.Optional(t.Union([t.String(), t.Null()])),
				destinationCity: t.Optional(t.Union([t.String(), t.Null()])),
				internshipDuration: t.Optional(t.Union([t.String(), t.Null()])),
				internshipCompany: t.Optional(t.Union([t.String(), t.Null()])),
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

		const pmbDataRow = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, id),
		});
		const isGapYear = pmbDataRow?.isGapYear || false;

		const { completed, total, isAllCompleted } = getInternshipChecks(
			internship,
			isGapYear,
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
			const { completed, total } = getInternshipChecks(current, isGapYear);
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
