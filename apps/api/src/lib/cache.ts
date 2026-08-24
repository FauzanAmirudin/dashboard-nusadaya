import { isRedisReady, redis } from "./redis";

/**
 * Two-Tier Cache Manager (L1 In-Memory RAM + L2 Redis).
 * Dilengkapi:
 * 1. LRU (Least Recently Used) Eviction di RAM
 * 2. Request Coalescing / Cache Stampede Prevention (`cacheFetch`)
 * 3. Atomic Invalidation (L1 Regex + L2 Scan)
 * 4. Cache Performance & Hit-Ratio Metrics
 */

interface CacheEntry {
	value: any;
	expiresAt: number;
}

// Configurable limits
const MAX_MEMORY_KEYS = Number(process.env.CACHE_MAX_MEMORY_KEYS) || 2000;
export const CACHE_TTL_STUDENT_LIST =
	Number(process.env.CACHE_TTL_STUDENT_LIST) || 60; // 1 menit
export const CACHE_TTL_DASHBOARD =
	Number(process.env.CACHE_TTL_DASHBOARD) || 120; // 2 menit
export const CACHE_TTL_DETAIL = Number(process.env.CACHE_TTL_DETAIL) || 180; // 3 menit
export const CACHE_TTL_DEFAULT = Number(process.env.CACHE_TTL_DEFAULT) || 120; // 2 menit

// L1 In-Memory Store (Map retains insertion order, manipulated as LRU)
const memoryCache = new Map<string, CacheEntry>();

// In-Flight Request Coalescing Map to prevent Cache Stampede
const inFlightRequests = new Map<string, Promise<any>>();

// Metrics tracking
const metrics = {
	l1Hits: 0,
	l2Hits: 0,
	misses: 0,
	sets: 0,
	deletes: 0,
	invalidations: 0,
};

// Periodic expired keys cleanup (non-blocking, sub-millisecond)
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of memoryCache.entries()) {
		if (entry.expiresAt <= now) {
			memoryCache.delete(key);
		}
	}
	// LRU eviction if memory exceeds MAX_MEMORY_KEYS
	while (memoryCache.size > MAX_MEMORY_KEYS) {
		const oldestKey = memoryCache.keys().next().value;
		if (oldestKey) {
			memoryCache.delete(oldestKey);
		} else {
			break;
		}
	}
}, 30000);

/**
 * Ambil nilai dari cache (L1 In-Memory -> L2 Redis).
 * Jika ada di L1 RAM, kembalikan dalam <0.01ms (Zero IO).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
	const now = Date.now();

	// 1. Cek L1 In-Memory Cache
	const memEntry = memoryCache.get(key);
	if (memEntry) {
		if (memEntry.expiresAt > now) {
			// Update LRU position: delete and re-insert
			memoryCache.delete(key);
			memoryCache.set(key, memEntry);
			metrics.l1Hits++;
			return memEntry.value as T;
		}
		memoryCache.delete(key);
	}

	// 2. Cek L2 Redis — gunakan isRedisReady() bukan cached boolean
	if (isRedisReady()) {
		try {
			const value = await redis.get(key);
			if (value) {
				const parsed = JSON.parse(value) as T;
				// Promote to L1 RAM Cache
				memoryCache.set(key, {
					value: parsed,
					expiresAt: now + CACHE_TTL_DEFAULT * 1000,
				});
				metrics.l2Hits++;
				return parsed;
			}
		} catch {
			// Redis error diabaikan secara aman
		}
	}

	metrics.misses++;
	return null;
}

/**
 * Simpan nilai ke cache (L1 In-Memory + L2 Redis).
 */
export async function cacheSet(
	key: string,
	value: unknown,
	ttlSeconds = CACHE_TTL_DEFAULT,
): Promise<void> {
	const now = Date.now();

	// 1. Simpan ke L1 In-Memory Cache (LRU)
	if (memoryCache.has(key)) {
		memoryCache.delete(key);
	} else if (memoryCache.size >= MAX_MEMORY_KEYS) {
		const oldestKey = memoryCache.keys().next().value;
		if (oldestKey) memoryCache.delete(oldestKey);
	}

	memoryCache.set(key, {
		value,
		expiresAt: now + ttlSeconds * 1000,
	});
	metrics.sets++;

	// 2. Simpan ke L2 Redis — gunakan isRedisReady() bukan cached boolean
	if (isRedisReady()) {
		try {
			await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
		} catch {
			// Abaikan jika Redis gagal
		}
	}
}

/**
 * Request Coalescing / Cache Stampede Prevention.
 */
export async function cacheFetch<T>(
	key: string,
	fetcher: () => Promise<T>,
	ttlSeconds = CACHE_TTL_DEFAULT,
): Promise<T> {
	// 1. Coba ambil dari cache
	const cached = await cacheGet<T>(key);
	if (cached !== null && cached !== undefined) {
		return cached;
	}

	// 2. Jika ada query in-flight untuk key ini, tunggu promise yang sama
	if (inFlightRequests.has(key)) {
		return inFlightRequests.get(key) as Promise<T>;
	}

	// 3. Jalankan fetcher sekali dan daftarkan promise in-flight
	const fetchPromise = (async () => {
		try {
			const data = await fetcher();
			await cacheSet(key, data, ttlSeconds);
			return data;
		} finally {
			inFlightRequests.delete(key);
		}
	})();

	inFlightRequests.set(key, fetchPromise);
	return fetchPromise;
}

/**
 * Hapus satu key dari cache (L1 RAM + L2 Redis).
 */
export async function cacheDel(key: string): Promise<void> {
	memoryCache.delete(key);
	metrics.deletes++;

	if (isRedisReady()) {
		try {
			await redis.del(key);
		} catch {
			// Abaikan
		}
	}
}

/**
 * Hapus semua key yang cocok dengan pattern (misal: "cache:students:*").
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
	metrics.invalidations++;

	// 1. Invalidate di Memory Cache via Regex
	const regexPattern = new RegExp(
		`^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`,
	);
	for (const key of memoryCache.keys()) {
		if (regexPattern.test(key)) {
			memoryCache.delete(key);
		}
	}

	// 2. Invalidate di Redis via SCAN (non-blocking)
	if (isRedisReady()) {
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

/**
 * Mengembalikan statistik performa cache saat ini.
 */
export function getCacheStats() {
	const totalHits = metrics.l1Hits + metrics.l2Hits;
	const totalRequests = totalHits + metrics.misses;
	const hitRatioPercentage =
		totalRequests > 0 ? ((totalHits / totalRequests) * 100).toFixed(1) : "0.0";

	return {
		l1MemoryEntries: memoryCache.size,
		redisAvailable: isRedisReady(),
		totalHits,
		l1Hits: metrics.l1Hits,
		l2Hits: metrics.l2Hits,
		misses: metrics.misses,
		sets: metrics.sets,
		deletes: metrics.deletes,
		invalidations: metrics.invalidations,
		hitRatioPercentage: `${hitRatioPercentage}%`,
	};
}
