import { isRedisAvailable, redis } from "./redis";

/**
 * Queue helper menggunakan Redis Lists (LPUSH/BRPOP).
 *
 * Queue names yang digunakan:
 *   queue:backup
 *   queue:export
 *   queue:pdf
 *   queue:file-processing
 */

const QUEUE_PREFIX = "queue";

export interface QueueJob<T = Record<string, unknown>> {
	jobId: string;
	type: string;
	payload: T;
	enqueuedAt: string;
}

/**
 * Tambahkan job ke queue (LPUSH).
 */
export async function enqueue<T>(
	queueName: string,
	job: QueueJob<T>,
): Promise<void> {
	if (!isRedisAvailable) {
		console.warn(
			`[Queue] Cannot enqueue to '${queueName}' because Redis is not available`,
		);
		return;
	}
	const key = `${QUEUE_PREFIX}:${queueName}`;
	try {
		await redis.lpush(key, JSON.stringify(job));
	} catch (err: any) {
		console.error(`[Queue] Failed to enqueue:`, err?.message);
	}
}

/**
 * Ambil satu job dari queue secara blocking (BRPOP).
 * Jika Redis tidak aktif atau error, tidur sejenak agar worker tidak tight loop.
 */
export async function dequeue<T>(
	queueName: string,
	timeoutSeconds = 5,
): Promise<QueueJob<T> | null> {
	if (!isRedisAvailable) {
		// Tidur 5 detik agar worker tidak membakar CPU saat Redis offline
		await new Promise((r) => setTimeout(r, 5000));
		return null;
	}

	const key = `${QUEUE_PREFIX}:${queueName}`;
	try {
		const result = await redis.brpop(key, timeoutSeconds);
		if (!result) return null;
		return JSON.parse(result[1]) as QueueJob<T>;
	} catch {
		await new Promise((r) => setTimeout(r, 5000));
		return null;
	}
}

/**
 * Ambil panjang queue (untuk monitoring).
 */
export async function queueLength(queueName: string): Promise<number> {
	if (!isRedisAvailable) return 0;
	const key = `${QUEUE_PREFIX}:${queueName}`;
	try {
		return await redis.llen(key);
	} catch {
		return 0;
	}
}
