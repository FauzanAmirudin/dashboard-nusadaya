import { isRedisAvailable, redis } from "./redis";

/**
 * In-Memory L1 Cache (Zero-latency RAM cache).
 * Bekerja sebagai L1 cache lokal yang instan (<0.1ms) dan fallback otomatis
 * saat Redis tidak tersedia.
 */
interface CacheEntry {
	value: any;
	expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 120; // 2 menit
const MAX_MEMORY_KEYS = 1000;

// Cleanup memory cache yang kadaluarsa setiap 60 detik
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of memoryCache.entries()) {
		if (entry.expiresAt <= now) {
			memoryCache.delete(key);
		}
	}
	// Batasi ukuran jika melebihi batas
	if (memoryCache.size > MAX_MEMORY_KEYS) {
		const keysToDelete = Array.from(memoryCache.keys()).slice(
			0,
			memoryCache.size - MAX_MEMORY_KEYS,
		);
		for (const key of keysToDelete) {
			memoryCache.delete(key);
		}
	}
}, 60000);

/**
 * Ambil nilai dari cache (L1 In-Memory -> L2 Redis).
 * Jika ada di RAM, kembalikan dalam 0.01ms tanpa IO.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
	const now = Date.now();
	// 1. Cek L1 In-Memory Cache
	const memEntry = memoryCache.get(key);
	if (memEntry) {
		if (memEntry.expiresAt > now) {
			return memEntry.value as T;
		}
		memoryCache.delete(key);
	}

	// 2. Cek L2 Redis jika Redis siap (non-blocking)
	if (isRedisAvailable) {
		try {
			const value = await redis.get(key);
			if (value) {
				const parsed = JSON.parse(value) as T;
				// Simpan kembali ke L1 RAM Cache
				memoryCache.set(key, {
					value: parsed,
					expiresAt: now + DEFAULT_TTL * 1000,
				});
				return parsed;
			}
		} catch {
			// Redis error diabaikan secara aman
		}
	}

	return null;
}

/**
 * Simpan nilai ke cache (L1 In-Memory + L2 Redis).
 */
export async function cacheSet(
	key: string,
	value: unknown,
	ttlSeconds = DEFAULT_TTL,
): Promise<void> {
	const now = Date.now();
	// 1. Simpan ke L1 In-Memory Cache (instan 0ms)
	memoryCache.set(key, {
		value,
		expiresAt: now + ttlSeconds * 1000,
	});

	// 2. Simpan ke L2 Redis jika Redis siap
	if (isRedisAvailable) {
		try {
			await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
		} catch {
			// Abaikan jika Redis gagal
		}
	}
}

/**
 * Hapus satu key dari cache (L1 RAM + L2 Redis).
 */
export async function cacheDel(key: string): Promise<void> {
	// 1. Hapus dari L1 Memory Cache
	memoryCache.delete(key);

	// 2. Hapus dari L2 Redis jika siap
	if (isRedisAvailable) {
		try {
			await redis.del(key);
		} catch {
			// Abaikan
		}
	}
}

/**
 * Hapus semua key yang cocok dengan pattern (misal: "cache:students:*").
 * Bekerja secara aman dan instan di L1 memory regex + Redis SCAN.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
	// 1. Invalidate di Memory Cache via Regex
	const regexPattern = new RegExp(
		`^${pattern.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&").replace(/\*/g, ".*")}$`,
	);
	for (const key of memoryCache.keys()) {
		if (regexPattern.test(key)) {
			memoryCache.delete(key);
		}
	}

	// 2. Invalidate di Redis jika siap
	if (isRedisAvailable) {
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
			// Abaikan
		}
	}
}
