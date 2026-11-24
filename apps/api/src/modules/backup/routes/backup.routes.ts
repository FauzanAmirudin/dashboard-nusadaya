import {
	createReadStream,
	createWriteStream,
	existsSync,
	unlinkSync,
} from "node:fs";
import { stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ZipArchive } from "archiver";
import { Elysia, t } from "elysia";
import { hasRole } from "../../../lib/permissions";
import { backupRepository } from "../repository/backup.repository";
import { backupService } from "../service/backup.service";
import { sanitizeSegment } from "../utils/backup-naming";

/**
 * Backup routes:
 * POST /backups        → buat backup job baru
 * GET /backups         → daftar semua backup jobs
 * GET /backups/stats   → statistik real-time storage & backup
 * GET /backups/:id     → status backup (merge PostgreSQL + Redis)
 * GET /backups/:id/download → stream unduh ZIP tanpa OOM di production
 * DELETE /backups/:id  → hapus record backup (hanya superadmin)
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
						panel: body.filters?.panel,
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
						panel: t.Optional(t.String()),
					}),
				),
			}),
		},
	)

	// GET /backups/stats — statistik riil storage & backup server
	.get("/backups/stats", async (context) => {
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

		const stats = await backupService.getStorageStats();
		return { success: true, data: stats };
	})

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

	// GET /backups/:id/download — stream unduh backup sebagai ZIP tanpa memuat seluruh file ke RAM
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

		if (!existsSync(outputPath)) {
			set.status = 404;
			return {
				success: false,
				message: "Direktori backup fisik tidak ditemukan di server",
			};
		}

		const tmpFile = join(tmpdir(), `backup-${job.id}-${Date.now()}.zip`);

		const dateTag = new Date(job.createdAt).toISOString().slice(0, 10);
		const f = (job.filters as Record<string, unknown>) || {};
		let zipFilename = `Backup_${job.type}_${dateTag}_${job.id.slice(-6)}.zip`;
		if (job.type === "student") {
			const idLabel = f.nim
				? sanitizeSegment(String(f.nim), 30)
				: `ID${f.studentId ?? "Mhs"}`;
			zipFilename = `Backup_Mahasiswa_${idLabel}_${dateTag}.zip`;
		} else if (job.type === "cohort") {
			zipFilename = `Backup_Angkatan_${f.cohortId ?? "All"}_${dateTag}.zip`;
		} else if (job.type === "program") {
			zipFilename = `Backup_Program_${sanitizeSegment(String(f.programId ?? "All"), 30)}_${dateTag}.zip`;
		} else if (job.type === "full") {
			zipFilename = `Backup_Full_Nusadaya_${dateTag}.zip`;
		}

		try {
			const output = createWriteStream(tmpFile);
			const archive = new ZipArchive({ zlib: { level: 6 } });

			await new Promise<void>((resolve, reject) => {
				output.on("close", () => resolve());
				output.on("error", (err) => reject(err));
				archive.on("error", (err: any) => reject(err));

				archive.pipe(output);
				archive.directory(outputPath, false);
				archive.finalize();
			});

			const fileStat = await stat(tmpFile);
			const nodeStream = createReadStream(tmpFile);
			const cleanupTmp = () => {
				try {
					if (existsSync(tmpFile)) unlinkSync(tmpFile);
				} catch {}
			};

			const webStream = new ReadableStream({
				start(controller) {
					nodeStream.on("data", (chunk) => {
						controller.enqueue(
							typeof chunk === "string" ? Buffer.from(chunk) : chunk,
						);
					});
					nodeStream.on("end", () => {
						controller.close();
						cleanupTmp();
					});
					nodeStream.on("error", (err) => {
						controller.error(err);
						cleanupTmp();
					});
				},
				cancel() {
					nodeStream.destroy();
					cleanupTmp();
				},
			});

			return new Response(webStream, {
				headers: {
					"Content-Type": "application/zip",
					"Content-Disposition": `attachment; filename="${zipFilename}"`,
					"Content-Length": String(fileStat.size),
				},
			});
		} catch (err: any) {
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
