import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

/**
 * FileWorker — cleanup file temporary yang sudah expired.
 *
 * Berjalan setiap 1 jam (via setInterval dari index.ts).
 * Retention policy:
 * - temporary/uploads/: hapus file >24 jam
 * - temporary/processing/: hapus file >1 jam
 * - temporary/failed/: hapus file >48 jam
 * - exports/: hapus file >7 hari
 */
export async function runFileCleanup(): Promise<void> {
	const storagePath =
		process.env.STORAGE_PATH ?? join(process.cwd(), "../../storage");

	const cleanupRules: Array<{ dir: string; maxAgeMs: number }> = [
		{
			dir: join(storagePath, "temporary", "uploads"),
			maxAgeMs: 24 * 60 * 60 * 1000, // 24 jam
		},
		{
			dir: join(storagePath, "temporary", "processing"),
			maxAgeMs: 60 * 60 * 1000, // 1 jam
		},
		{
			dir: join(storagePath, "temporary", "failed"),
			maxAgeMs: 48 * 60 * 60 * 1000, // 48 jam
		},
		{
			dir: join(storagePath, "exports"),
			maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 hari
		},
	];

	for (const rule of cleanupRules) {
		try {
			const entries = await readdir(rule.dir).catch(() => [] as string[]);
			const now = Date.now();

			for (const entry of entries) {
				const filePath = join(rule.dir, entry);
				try {
					const stats = await stat(filePath);
					const ageMs = now - stats.mtimeMs;

					if (ageMs > rule.maxAgeMs) {
						await rm(filePath, { recursive: true, force: true });
						console.log(`[FileWorker] Cleaned up expired file: ${filePath}`);
					}
				} catch {
					// Skip file yang tidak bisa dibaca
				}
			}
		} catch {
			// Directory mungkin belum ada — skip
		}
	}
}

/**
 * Mulai file cleanup worker dengan interval.
 * Dipanggil dari index.ts saat startup.
 */
export function startFileWorker(): void {
	console.log("🔄 File Worker started — cleanup runs every 1 hour");

	// Jalankan segera saat startup, lalu setiap 1 jam
	runFileCleanup();
	setInterval(runFileCleanup, 60 * 60 * 1000); // setiap 1 jam
}
