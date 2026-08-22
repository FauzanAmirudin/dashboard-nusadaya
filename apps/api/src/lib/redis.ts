import IORedis from "ioredis";

/**
 * Flag penanda apakah koneksi Redis siap digunakan.
 * Diperbarui secara otomatis melalui event listener.
 */
let isRedisAvailable = false;

/**
 * Koneksi Redis singleton menggunakan ioredis.
 *
 * Dioptimalkan dengan:
 * - enableOfflineQueue: false -> jangan memblokir / menggantung command saat Redis offline.
 * - connectTimeout: 500ms -> deteksi cepat saat Redis tidak tersedia.
 * - maxRetriesPerRequest: 1 -> cegah blocking berulang pada request API.
 */
const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
	maxRetriesPerRequest: 1,
	enableOfflineQueue: false,
	connectTimeout: 500,
	lazyConnect: false,
	reconnectOnError() {
		return false;
	},
	retryStrategy(times) {
		if (times > 10) {
			// Setelah 10 percobaan, coba setiap 30 detik agar tidak membebani log/CPU
			return 30000;
		}
		return 5000;
	},
});

redis.on("ready", () => {
	isRedisAvailable = true;
	console.log("✅ [Redis] Connected & ready");
});

redis.on("connect", () => {
	isRedisAvailable = true;
});

redis.on("error", () => {
	isRedisAvailable = false;
});

redis.on("close", () => {
	isRedisAvailable = false;
});

redis.on("end", () => {
	isRedisAvailable = false;
});

export { isRedisAvailable, redis };
