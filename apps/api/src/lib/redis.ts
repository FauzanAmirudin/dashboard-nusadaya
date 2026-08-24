import IORedis from "ioredis";

/**
 * Redis singleton dengan exported getter function untuk isRedisAvailable.
 * KRITIS: Jangan export primitive boolean langsung — ES module snapshot membekukan nilainya.
 * Gunakan fungsi getter agar consumer selalu membaca nilai terkini.
 */
const state = {
	isAvailable: false,
};

const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
	maxRetriesPerRequest: 1,
	enableOfflineQueue: false,
	connectTimeout: 1000,
	lazyConnect: false,
	reconnectOnError() {
		return false;
	},
	retryStrategy(times) {
		if (times > 10) {
			return 30000;
		}
		return 5000;
	},
});

redis.on("ready", () => {
	state.isAvailable = true;
	console.log("✅ [Redis] Connected & ready");
});

redis.on("connect", () => {
	state.isAvailable = true;
});

redis.on("error", () => {
	state.isAvailable = false;
});

redis.on("close", () => {
	state.isAvailable = false;
});

redis.on("end", () => {
	state.isAvailable = false;
});

/**
 * Selalu kembalikan nilai terkini, bukan snapshot saat import.
 */
export function isRedisReady(): boolean {
	return state.isAvailable;
}

/**
 * @deprecated Gunakan isRedisReady() untuk mendapatkan nilai live.
 * Variabel ini hanya untuk backward compat, tidak reliable untuk modul lain.
 */
export const isRedisAvailable = state;

export { redis };
