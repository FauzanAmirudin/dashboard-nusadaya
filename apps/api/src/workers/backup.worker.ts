import { dequeue } from "../lib/queue";
import { backupService } from "../modules/backup/service/backup.service";

interface BackupJobPayload {
	jobId: string;
	backupType: string;
	filters: Record<string, unknown>;
}

/**
 * BackupWorker — consumer dari queue:backup.
 *
 * Prinsip:
 * - 1 worker saja (concurrency: 1) untuk mencegah overload disk I/O
 * - Idempotent: job yang sama bisa di-retry dengan aman berkat Redis lock
 * - Tidak pernah dipanggil langsung dari route — hanya dari queue
 * - Jika worker crash, lock otomatis expire setelah TTL (2 jam)
 *
 * Alur:
 * 1. Dequeue dari Redis (blocking, tidak polling)
 * 2. Panggil backupService.executeBackup()
 * 3. Loop kembali untuk job berikutnya
 */
export async function startBackupWorker(): Promise<void> {
	console.log("🔄 Backup Worker started — listening on queue:backup");

	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			// BRPOP: blocking dequeue, timeout 5 detik
			// Return null jika timeout (tidak ada job), lanjut loop
			const job = await dequeue<BackupJobPayload>("backup", 5);

			if (!job) continue;

			console.log(
				`[BackupWorker] Processing job ${job.payload.jobId} (type: ${job.payload.backupType})`,
			);

			await backupService.executeBackup(
				job.payload.jobId,
				job.payload.backupType,
				job.payload.filters as Parameters<typeof backupService.executeBackup>[2],
			);

			console.log(`[BackupWorker] Job ${job.payload.jobId} completed ✅`);
		} catch (err) {
			const error = err as Error;
			console.error("[BackupWorker] Error processing job:", error.message);
			// Jangan crash worker — lanjut ke job berikutnya
			await new Promise((r) => setTimeout(r, 1000));
		}
	}
}
