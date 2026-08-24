import { stat } from "node:fs/promises";
import { join } from "node:path";
import { desc, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db";
import { backupJobs } from "../db/schema";
import { getCacheStats } from "../lib/cache";
import { queueLength } from "../lib/queue";
import { redis } from "../lib/redis";

/**
 * Route: GET /health
 *
 * Health check endpoint yang melaporkan status semua komponen sistem.
 * Berguna untuk monitoring (Uptime Robot, Grafana, dll.).
 * Menampilkan disk usage, Redis status, PostgreSQL status, dan backup terakhir.
 */
export const healthRoutes = new Elysia().get("/health", async ({ set }) => {
	const results: Record<string, unknown> = {
		status: "ok",
		timestamp: new Date().toISOString(),
	};

	// 1. Cek PostgreSQL
	try {
		await db.execute(sql`SELECT 1`);
		results.postgresql = "ok";
	} catch {
		results.postgresql = "error";
		results.status = "degraded";
	}

	// 2. Cek Redis
	try {
		await redis.ping();
		results.redis = "ok";
	} catch {
		results.redis = "error";
		results.status = "degraded";
	}

	// 3. Storage info
	const storagePath =
		process.env.STORAGE_PATH ?? join(process.cwd(), "../../storage");
	try {
		const statResult = await stat(storagePath);
		results.storage = {
			available: true,
			path: storagePath,
			isDirectory: statResult.isDirectory(),
		};
	} catch {
		results.storage = { available: false, path: storagePath };
		results.status = "degraded";
	}

	// 4. Queue lengths
	try {
		results.queues = {
			backup: await queueLength("backup"),
			export: await queueLength("export"),
			pdf: await queueLength("pdf"),
			fileProcessing: await queueLength("file-processing"),
		};
	} catch {
		results.queues = "unavailable";
	}

	// 5. Cache stats & hit ratio
	results.cache = getCacheStats();

	// 5. Last backup status
	try {
		const lastBackup = await db.query.backupJobs.findFirst({
			orderBy: [desc(backupJobs.createdAt)],
		});
		results.lastBackup = lastBackup
			? {
					id: lastBackup.id,
					type: lastBackup.type,
					status: lastBackup.status,
					completedAt: lastBackup.completedAt,
				}
			: null;
	} catch {
		results.lastBackup = null;
	}

	// Set HTTP status berdasarkan health
	if (results.status !== "ok") {
		set.status = 503;
	}

	return results;
});
