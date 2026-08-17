import { Elysia, t } from "elysia";
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
			// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			// Hanya superadmin yang bisa membuat backup
			if (user.role !== "superadmin") {
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
		// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (user.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const jobs = await backupService.listJobs();
		return { success: true, data: jobs };
	})

	// GET /backups/:id — status backup dengan progress real-time dari Redis
	.get("/backups/:id", async (context) => {
		const { params, set } = context;
		// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (user.role !== "superadmin") {
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

		if (user.role !== "superadmin") {
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

		if (user.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const job = await backupRepository.findJobById(params.id);
		if (!job || !job.outputPath) {
			set.status = 404;
			return {
				success: false,
				message: "Backup tidak ditemukan atau belum selesai",
			};
		}

		// Gunakan Node.js child_process untuk zip — tidak ada crash risk
		const os = require("os");
		const path = require("path");
		const { execSync } = require("child_process");
		const { existsSync, readFileSync, unlinkSync } = require("fs");

		const tmpFile = path.join(
			os.tmpdir(),
			`backup-${job.id}-${Date.now()}.zip`,
		);

		try {
			// PowerShell Compress-Archive (Windows) atau zip (Linux/Mac)
			const isWindows = process.platform === "win32";
			if (isWindows) {
				execSync(
					`powershell -Command "Compress-Archive -Path '${job.outputPath}\\*' -DestinationPath '${tmpFile}' -Force"`,
					{ timeout: 120000 },
				);
			} else {
				execSync(`cd "${job.outputPath}" && zip -r "${tmpFile}" .`, {
					timeout: 120000,
				});
			}

			if (!existsSync(tmpFile)) {
				set.status = 500;
				return { success: false, message: "Gagal membuat file ZIP" };
			}

			const zipBuffer = readFileSync(tmpFile);

			// Cleanup temp file
			try {
				unlinkSync(tmpFile);
			} catch {}

			set.headers = {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="backup-${job.id}.zip"`,
				"Content-Length": String(zipBuffer.byteLength),
			};

			return zipBuffer;
		} catch (err: any) {
			// Cleanup on error
			try {
				if (existsSync(tmpFile)) unlinkSync(tmpFile);
			} catch {}
			set.status = 500;
			return {
				success: false,
				message: `Gagal mengkompresi backup: ${err.message}`,
			};
		}
	});
