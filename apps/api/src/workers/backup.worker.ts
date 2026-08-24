import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { backupJobs } from "../db/schema";
import { releaseLock } from "../lib/lock";
import { dequeue } from "../lib/queue";
import { backupService } from "../modules/backup/service/backup.service";

interface BackupJobPayload {
	jobId: string;
	backupType: string;
	filters: Record<string, unknown>;
}

export async function startBackupWorker(): Promise<void> {
	console.log(
		"🔄 Backup Worker started — listening on queue:backup with DB fallback",
	);

	// 1. Initial sweep: Cek jika ada job yang tertinggal dalam status 'queued' atau 'processing' yang macet
	try {
		// Pulihkan job yang status 'processing' tapi macet karena restart server sebelumnya
		const stuckProcessingJobs = await db.query.backupJobs.findMany({
			where: eq(backupJobs.status, "processing"),
		});

		for (const sJob of stuckProcessingJobs) {
			const lockKey = `backup:${sJob.type}:${JSON.stringify(sJob.filters || {})}`;
			await releaseLock(lockKey);
			// Kembalikan ke 'queued' agar diproses ulang
			await db
				.update(backupJobs)
				.set({ status: "queued", startedAt: null })
				.where(eq(backupJobs.id, sJob.id));
			console.log(`[BackupWorker] Re-queued stuck processing job: ${sJob.id}`);
		}

		// Jalankan semua job yang berstatus 'queued'
		const queuedJobs = await db.query.backupJobs.findMany({
			where: eq(backupJobs.status, "queued"),
			orderBy: (t, { asc }) => [asc(t.createdAt)],
		});

		if (queuedJobs.length > 0) {
			console.log(
				`[BackupWorker] Found ${queuedJobs.length} queued backup job(s) in database. Processing backlog...`,
			);
			for (const qJob of queuedJobs) {
				try {
					console.log(`[BackupWorker] Executing backlog job ${qJob.id}...`);
					await backupService.executeBackup(
						qJob.id,
						qJob.type,
						(qJob.filters as Parameters<
							typeof backupService.executeBackup
						>[2]) || {},
					);
					console.log(`[BackupWorker] Backlog job ${qJob.id} completed ✅`);
				} catch (err: any) {
					console.error(
						`[BackupWorker] Failed to execute backlog job ${qJob.id}:`,
						err?.message,
					);
				}
			}
		}
	} catch (err: any) {
		console.warn("[BackupWorker] Initial sweep warning:", err?.message);
	}

	// 2. Continuous processing loop
	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			// A. Coba dequeue dari Redis queue
			let job = await dequeue<BackupJobPayload>("backup", 2);

			// B. Jika tidak ada job di Redis (atau Redis offline), polling DB untuk status 'queued'
			if (!job) {
				const nextQueuedJob = await db.query.backupJobs.findFirst({
					where: eq(backupJobs.status, "queued"),
					orderBy: (t, { asc }) => [asc(t.createdAt)],
				});

				if (nextQueuedJob) {
					job = {
						jobId: nextQueuedJob.id,
						type: "backup",
						payload: {
							jobId: nextQueuedJob.id,
							backupType: nextQueuedJob.type,
							filters: (nextQueuedJob.filters as Record<string, unknown>) || {},
						},
						enqueuedAt: nextQueuedJob.createdAt.toISOString(),
					};
				}
			}

			if (!job) {
				await new Promise((r) => setTimeout(r, 2000));
				continue;
			}

			console.log(
				`[BackupWorker] [${new Date().toISOString()}] Processing job ${job.payload.jobId} (type: ${job.payload.backupType})`,
			);

			await backupService.executeBackup(
				job.payload.jobId,
				job.payload.backupType,
				job.payload.filters as Parameters<
					typeof backupService.executeBackup
				>[2],
			);

			console.log(
				`[BackupWorker] [${new Date().toISOString()}] Job ${job.payload.jobId} completed ✅`,
			);
		} catch (err) {
			const error = err as Error;
			console.error(
				`[BackupWorker] [${new Date().toISOString()}] Error processing job:`,
				error.message,
			);
			await new Promise((r) => setTimeout(r, 5000));
		}
	}
}
