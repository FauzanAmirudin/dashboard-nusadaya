import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { backupService } from "../modules/backup/service/backup.service";
import { retentionService } from "../modules/backup/service/retention.service";
import { runFileCleanup } from "./file.worker";

/**
 * ScheduledWorker — cron jobs untuk automated backup dan cleanup.
 *
 * Jadwal:
 * - Daily (00:00)   → full backup trigger (database + storage)
 * - Every 1 hour    → cleanup file temporary
 * - Every 7 days    → cleanup expired exports
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
		0,
	);
	return midnight.getTime() - now.getTime();
}

async function getSuperadminUserId(): Promise<number> {
	try {
		const admin = await db.query.users.findFirst({
			where: eq(users.role, "superadmin"),
			columns: { id: true },
		});
		if (admin?.id) return admin.id;
	} catch {
		console.warn(
			"[ScheduledWorker] Could not query superadmin user, fallback to userId: 1",
		);
	}
	return 1;
}

async function runDailyBackup(attempt = 1): Promise<void> {
	const timestamp = new Date().toISOString();
	console.log(
		`[ScheduledWorker] [${timestamp}] Running daily full backup (Attempt ${attempt}/3)...`,
	);
	try {
		const userId = await getSuperadminUserId();
		const result = await backupService.createBackupJob({
			type: "full",
			filters: {},
			userId,
		});

		if (result.status === "rejected") {
			console.warn(
				`[ScheduledWorker] [${timestamp}] Daily backup skipped/rejected: ${result.message}`,
			);
			return;
		}

		console.log(
			`[ScheduledWorker] [${timestamp}] Daily backup enqueued: ${result.jobId}`,
		);
	} catch (err) {
		const error = err as Error;
		console.error(
			`[ScheduledWorker] [${timestamp}] Daily backup attempt ${attempt} failed:`,
			error.message,
		);
		if (attempt < 3) {
			console.log(`[ScheduledWorker] Retrying daily backup in 5 seconds...`);
			setTimeout(() => runDailyBackup(attempt + 1), 5000);
		}
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
		const backupPath =
			process.env.BACKUP_PATH ?? join(process.cwd(), "../../backups");
		retentionService.runRetentionCleanup(backupPath);
	}, 30 * 1000);
}
