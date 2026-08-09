import { redis } from "./redis";

/**
 * Cache helper — get/set/del dengan TTL.
 *
 * Key naming convention:
 *   cache:student:{id}
 *   cache:students:list
 *   cache:programs:list
 *   cache:cohorts:list
 *   cache:specializations:list
 *   cache:dashboard:stats
 *
 * Semua key harus diprefix "cache:" untuk membedakan dari queue/lock/job.
 */

const DEFAULT_TTL = 300; // 5 menit

/**
 * Ambil nilai dari cache. Return null jika tidak ada atau expired.
 * Jika Redis mati, return null (graceful degradation).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
	try {
		const value = await redis.get(key);
		if (!value) return null;
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

/**
 * Simpan nilai ke cache dengan TTL (detik).
 * Jika Redis mati, operasi diabaikan (graceful degradation).
 */
export async function cacheSet(
	key: string,
	value: unknown,
	ttlSeconds = DEFAULT_TTL,
): Promise<void> {
	try {
		await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
	} catch {
		// Redis tidak kritis — abaikan error
	}
}

/**
 * Hapus satu key dari cache.
 */
export async function cacheDel(key: string): Promise<void> {
	try {
		await redis.del(key);
	} catch {
		// abaikan
	}
}

/**
 * Hapus semua key yang cocok dengan pattern (menggunakan SCAN, bukan KEYS).
 * Aman digunakan di production karena SCAN tidak memblokir.
 * Contoh pattern: "cache:students:*"
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
	try {
		let cursor = "0";
		do {
			const [nextCursor, keys] = await redis.scan(
				cursor,
				"MATCH",
				pattern,
				"COUNT",
				100,
			);
			cursor = nextCursor;
			if (keys.length > 0) {
				await redis.del(...keys);
			}
		} while (cursor !== "0");
	} catch {
		// abaikan
	}
}
