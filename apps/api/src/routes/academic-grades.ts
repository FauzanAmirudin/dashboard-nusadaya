import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { academicKhsTranscripts, students } from "../db/schema";
import { requireRole } from "../middleware/rbac";
import { GradeCalculationService } from "../modules/academic/grade-calculation.service";

export const academicGradesRouter = new Elysia({ prefix: "/academic" })
	.use(requireRole(["akademik", "superadmin", "dosen"]))

	// 1. Kalkulasi Nilai Akhir Massal (Batch)
	.post(
		"/calculate-all-grades",
		async ({ body, set }) => {
			try {
				const { cohort, rombel } = body as { cohort?: number; rombel?: string };
				if (!cohort) {
					set.status = 400;
					return { success: false, message: "Angkatan (cohort) wajib diisi" };
				}

				const result = await GradeCalculationService.calculateCohortGrades(
					Number(cohort),
					rombel,
				);

				return {
					success: true,
					message: `Berhasil menghitung otomatis nilai ${result.totalProcessed} mahasiswa Angkatan ${cohort}`,
					data: result,
				};
			} catch (err: any) {
				set.status = 500;
				return {
					success: false,
					message: err.message || "Gagal menghitung nilai massal",
				};
			}
		},
		{
			body: t.Object({
				cohort: t.Any(),
				rombel: t.Optional(t.Any()),
			}),
		},
	)

	// 2. Sinkronisasi Massal KHS & Transkrip ke Modul Magang (Segmen 19)
	.post(
		"/sync-all-to-magang",
		async (context) => {
			const { body, set } = context;
			const user = (context as any).user;
			try {
				const { cohort } = body as { cohort?: number };
				if (!cohort) {
					set.status = 400;
					return { success: false, message: "Angkatan (cohort) wajib diisi" };
				}

				const result = await GradeCalculationService.syncAllToMagang(
					Number(cohort),
					user?.id,
				);

				return {
					success: true,
					message: `Berhasil menyinkronkan ${result.syncedCount} dari ${result.totalProcessed} mahasiswa ke Modul Magang`,
					data: result,
				};
			} catch (err: any) {
				set.status = 500;
				return {
					success: false,
					message: err.message || "Gagal sinkronisasi massal ke Magang",
				};
			}
		},
		{
			body: t.Object({
				cohort: t.Any(),
			}),
		},
	)

	// 3. Ekspor Data Feeder PDDIKTI (Segmen 14)
	.get("/pddikti/export", async ({ query, set }) => {
		try {
			const cohort = query.cohort ? Number(query.cohort) : undefined;
			const type = (query.type as "krs" | "khs" | "kelulusan") || "khs";

			const exportResult = await GradeCalculationService.exportPddiktiData(
				cohort,
				type,
			);

			set.headers["Content-Type"] = "text/csv; charset=utf-8";
			set.headers["Content-Disposition"] =
				`attachment; filename="${exportResult.filename}"`;

			return exportResult.csv;
		} catch (err: any) {
			set.status = 500;
			return {
				success: false,
				message: err.message || "Gagal mengekspor data PDDIKTI",
			};
		}
	})

	// 4. Daftar Riwayat Publikasi KHS & Transkrip
	.get("/published-documents", async ({ query }) => {
		const studentId = query.studentId ? Number(query.studentId) : undefined;
		const whereClause = studentId
			? eq(academicKhsTranscripts.studentId, studentId)
			: undefined;

		const docs = await db.query.academicKhsTranscripts.findMany({
			where: whereClause,
			with: {
				student: { columns: { id: true, name: true, nim: true, cohort: true } },
				publisher: { columns: { id: true, fullName: true } },
			},
			orderBy: [desc(academicKhsTranscripts.createdAt)],
			limit: 50,
		});

		return { success: true, data: docs };
	});
