import { redis } from "./redis";

/**
 * Queue helper menggunakan Redis Lists (LPUSH/BRPOP).
 *
 * Queue names yang digunakan:
 *   queue:backup
 *   queue:export
 *   queue:pdf
 *   queue:file-processing
 *
 * Setiap job di-serialize sebagai JSON string.
 * Worker menggunakan BRPOP untuk blocking dequeue (efisien, tidak polling).
 */

const QUEUE_PREFIX = "queue";

export interface QueueJob<T = Record<string, unknown>> {
	jobId: string;
	type: string;
	payload: T;
	enqueuedAt: string;
}

/**
 * Tambahkan job ke queue (LPUSH — masuk dari kiri).
 * Worker akan mengambil dari kanan (BRPOP) → FIFO.
 */
export async function enqueue<T>(
	queueName: string,
	job: QueueJob<T>,
): Promise<void> {
	const key = `${QUEUE_PREFIX}:${queueName}`;
	await redis.lpush(key, JSON.stringify(job));
}

/**
 * Ambil satu job dari queue secara blocking (BRPOP).
 * Timeout: 0 = block selamanya sampai ada job.
 * Return null jika timeout atau Redis error.
 */
export async function dequeue<T>(
	queueName: string,
	timeoutSeconds = 5,
): Promise<QueueJob<T> | null> {
	const key = `${QUEUE_PREFIX}:${queueName}`;
	try {
		const result = await redis.brpop(key, timeoutSeconds);
		if (!result) return null;
		return JSON.parse(result[1]) as QueueJob<T>;
	} catch {
		return null;
	}
}

/**
 * Ambil panjang queue (untuk monitoring).
 */
export async function queueLength(queueName: string): Promise<number> {
	const key = `${QUEUE_PREFIX}:${queueName}`;
	try {
		return await redis.llen(key);
	} catch {
		return 0;
	}
}
