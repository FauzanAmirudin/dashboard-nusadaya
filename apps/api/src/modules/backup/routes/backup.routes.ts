import { Elysia, t } from "elysia";
import { hasRole } from "../../../lib/permissions";
import { backupRepository } from "../repository/backup.repository";
import { backupService } from "../service/backup.service";

/**
 * Backup routes:
 * POST /backups        → buat backup job baru
 * GET /backups         → daftar semua backup jobs
 * GET /backups/:id     → status backup (merge PostgreSQL + Redis)
 * DELETE /backups/:id  → hapus backup record (hanya superadmin)
 */
export const backupRoutes = new Elysia()

	// POST /backups — buat backup job baru
	.post(
		"/backups",
		async (context) => {
			const { body, set } = context;
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			// Hanya superadmin yang bisa membuat backup
			if (!hasRole(user, "superadmin")) {
				set.status = 403;
				return {
					success: false,
					message: "Hanya superadmin yang bisa membuat backup",
				};
			}

			try {
				const result = await backupService.createBackupJob({
					type: body.type,
					filters: {
						studentId: body.filters?.studentId,
						nim: body.filters?.nim,
						cohortId: body.filters?.cohortId,
						programId: body.filters?.programId,
						specializationId: body.filters?.specializationId,
						category: body.filters?.category,
					},
					userId: user.id,
				});

				if (result.status === "rejected") {
					set.status = 409; // Conflict
					return { success: false, message: result.message };
				}

				return { success: true, data: result };
			} catch (err) {
				const error = err as Error;
				set.status = 500;
				return { success: false, message: error.message };
			}
		},
		{
			body: t.Object({
				type: t.String(), // "student" | "cohort" | "program" | "specialization" | "full"
				filters: t.Optional(
					t.Object({
						studentId: t.Optional(t.Number()),
						nim: t.Optional(t.String()),
						cohortId: t.Optional(t.Number()),
						programId: t.Optional(t.String()),
						specializationId: t.Optional(t.String()),
						category: t.Optional(t.String()),
					}),
				),
			}),
		},
	)

	// GET /backups — daftar semua backup jobs
	.get("/backups", async (context) => {
		const { set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (!hasRole(user, "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const jobs = await backupService.listJobs();
		return { success: true, data: jobs };
	})

	// GET /backups/:id — status backup dengan progress real-time dari Redis
	.get("/backups/:id", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (!hasRole(user, "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const status = await backupService.getBackupStatus(params.id);
		if (!status) {
			set.status = 404;
			return { success: false, message: "Backup job tidak ditemukan" };
		}

		return { success: true, data: status };
	})

	// DELETE /backups/:id — hapus record backup (hanya superadmin)
	.delete("/backups/:id", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (!hasRole(user, "superadmin")) {
			set.status = 403;
			return {
				success: false,
				message: "Hanya superadmin yang bisa menghapus backup",
			};
		}

		const job = await backupRepository.findJobById(params.id);
		if (!job) {
			set.status = 404;
			return { success: false, message: "Backup job tidak ditemukan" };
		}

		await backupRepository.deleteJob(params.id);
		return { success: true, message: "Backup job berhasil dihapus" };
	})

	// GET /backups/:id/download — unduh backup sebagai ZIP
	.get("/backups/:id/download", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (!hasRole(user, "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const job = await backupRepository.findJobById(params.id);
		const outputPath = job?.outputPath;
		if (!job || !outputPath) {
			set.status = 404;
			return {
				success: false,
				message: "Backup tidak ditemukan atau belum selesai",
			};
		}

		const fs = await import("node:fs");
		if (!fs.existsSync(outputPath)) {
			set.status = 404;
			return {
				success: false,
				message: "Direktori backup fisik tidak ditemukan di server",
			};
		}

		const os = await import("node:os");
		const path = await import("node:path");
		const { ZipArchive } = await import("archiver");

		const tmpFile = path.join(
			os.tmpdir(),
			`backup-${job.id}-${Date.now()}.zip`,
		);

		try {
			const output = fs.createWriteStream(tmpFile);
			const archive = new ZipArchive({ zlib: { level: 6 } });

			await new Promise<void>((resolve, reject) => {
				output.on("close", () => resolve());
				output.on("error", (err) => reject(err));
				archive.on("error", (err: any) => reject(err));

				archive.pipe(output);
				archive.directory(outputPath, false);
				archive.finalize();
			});

			const zipBuffer = fs.readFileSync(tmpFile);

			// Cleanup temp file
			try {
				fs.unlinkSync(tmpFile);
			} catch {}

			return new Response(zipBuffer, {
				headers: {
					"Content-Type": "application/zip",
					"Content-Disposition": `attachment; filename="backup-${job.id}.zip"`,
					"Content-Length": String(zipBuffer.byteLength),
				},
			});
		} catch (err: any) {
			// Cleanup on error
			try {
				if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
			} catch {}
			set.status = 500;
			return {
				success: false,
				message: `Gagal mengkompresi backup: ${err.message}`,
			};
		}
	});
