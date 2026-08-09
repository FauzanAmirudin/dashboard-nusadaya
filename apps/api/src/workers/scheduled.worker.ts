import { backupService } from "../modules/backup/service/backup.service";
import { retentionService } from "../modules/backup/service/retention.service";
import { runFileCleanup } from "./file.worker";
import { join } from "node:path";

/**
 * ScheduledWorker — cron jobs untuk automated backup dan cleanup.
 *
 * Jadwal:
 * - Daily (00:00)   → full backup trigger (database + storage)
 * - Every 1 hour    → cleanup file temporary
 * - Every 7 days    → cleanup expired exports
 *
 * Catatan: Untuk production, pertimbangkan library cron seperti "node-cron"
 * agar pengelolaan schedule lebih robust. Implementasi ini menggunakan
 * setInterval yang cukup untuk kebutuhan saat ini.
 *
 * Database backup (pg_dump) harus dikonfigurasi di level OS/Docker
 * menggunakan cron job eksternal, bukan dari dalam aplikasi Node/Bun.
 */

function getMillisUntilMidnight(): number {
	const now = new Date();
	const midnight = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() + 1,
		0,
		0,
		0,
	);
	return midnight.getTime() - now.getTime();
}

async function runDailyBackup(): Promise<void> {
	console.log("[ScheduledWorker] Running daily full backup...");
	try {
		const result = await backupService.createBackupJob({
			type: "full",
			filters: {},
			userId: 1, // System user — superadmin pertama
		});
		console.log(`[ScheduledWorker] Daily backup enqueued: ${result.jobId}`);
	} catch (err) {
		const error = err as Error;
		console.error("[ScheduledWorker] Daily backup failed:", error.message);
	}
}

/**
 * Mulai semua scheduled jobs.
 * Dipanggil sekali dari index.ts saat startup API.
 */
export function startScheduledWorker(): void {
	console.log("🔄 Scheduled Worker started");

	// 1. Daily backup — pertama kali berjalan di tengah malam
	const msUntilMidnight = getMillisUntilMidnight();
	console.log(
		`[ScheduledWorker] Next daily backup in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`,
	);
	setTimeout(() => {
		runDailyBackup();
		// Ulangi setiap 24 jam
		setInterval(runDailyBackup, 24 * 60 * 60 * 1000);
	}, msUntilMidnight);

	// 2. File cleanup — setiap 1 jam (sudah dihandle di file.worker.ts)
	// Tidak perlu set lagi di sini karena startFileWorker() sudah memanggil setInterval

	// 3. Exports cleanup — setiap 7 hari
	setInterval(
		() => {
			console.log("[ScheduledWorker] Running exports cleanup...");
			runFileCleanup();
		},
		7 * 24 * 60 * 60 * 1000,
	);

	// 4. Initial Retention Cleanup — jalan 30 detik setelah server nyala
	setTimeout(() => {
		console.log("[ScheduledWorker] Running initial retention cleanup...");
		// fallback path jika process.env.BACKUP_PATH tidak ada
		const backupPath = process.env.BACKUP_PATH ?? join(process.cwd(), "../../backups");
		retentionService.runRetentionCleanup(backupPath);
	}, 30 * 1000);
}
