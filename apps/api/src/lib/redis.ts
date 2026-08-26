import IORedis from "ioredis";

/**
 * Koneksi Redis tunggal (singleton) menggunakan ioredis.
 *
 * Digunakan oleh:
 * - cache.ts    → cache data yang sering dibaca
 * - queue.ts    → queue job backup/export/pdf
 * - lock.ts     → distributed locking (cegah duplikasi job)
 * - job.ts      → progress tracking real-time per job
 *
 * Prinsip: Redis adalah TEMPORARY layer.
 * Jika Redis mati, aplikasi tetap berjalan (PostgreSQL sebagai source of truth).
 */
const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
	maxRetriesPerRequest: 3,
	lazyConnect: true,
	// Jika Redis tidak bisa terkoneksi, jangan crash aplikasi
	reconnectOnError(err) {
		console.warn("[Redis] Reconnect triggered by error:", err.message);
		return true;
	},
	retryStrategy(times) {
		// Jika Redis belum siap, tunggu 5 detik sebelum mencoba lagi
		// Jangan kembalikan null agar ioredis tidak berhenti mencoba (bisa auto-recover)
		if (times === 3) {
			console.warn(
				"⚠️  [Redis] Server Redis belum terdeteksi. Sistem akan terus mencoba reconnect di background tanpa mengganggu aplikasi...",
			);
		}
		return 5000;
	},
});

let hasWarnedRedis = false;

redis.on("connect", () => {
	console.log("✅ Redis connected");
	hasWarnedRedis = false;
});

redis.on("error", (err) => {
	if (!hasWarnedRedis) {
		console.warn(
			"⚠️  [Redis] Optional Redis service not connected. App will continue running normally without cache/queue worker:",
			err.message,
		);
		hasWarnedRedis = true;
	}
});

export { redis };
