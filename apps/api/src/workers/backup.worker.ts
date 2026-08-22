import { dequeue } from "../lib/queue";
import { backupService } from "../modules/backup/service/backup.service";

interface BackupJobPayload {
	jobId: string;
	backupType: string;
	filters: Record<string, unknown>;
}

export async function startBackupWorker(): Promise<void> {
	console.log("🔄 Backup Worker started — listening on queue:backup");

	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			const job = await dequeue<BackupJobPayload>("backup", 5);
			if (!job) {
				await new Promise((r) => setTimeout(r, 1000));
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
