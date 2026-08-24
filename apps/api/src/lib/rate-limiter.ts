import { isRedisReady, redis } from "./redis";

/**
 * High-Performance Sliding Window Rate Limiter (In-Memory + Redis support).
 */

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const memoryRateLimit = new Map<string, RateLimitEntry>();

// Cleanup expired rate limit entries every 60s
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of memoryRateLimit.entries()) {
		if (entry.resetAt <= now) {
			memoryRateLimit.delete(key);
		}
	}
}, 60000);

export interface RateLimitOptions {
	maxRequests: number;
	windowSeconds: number;
	keyPrefix?: string;
}

export async function checkRateLimit(
	identifier: string,
	options: RateLimitOptions,
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
	const { maxRequests, windowSeconds, keyPrefix = "rl" } = options;
	const key = `${keyPrefix}:${identifier}`;
	const now = Date.now();

	// 1. If Redis is available, use atomic Redis INCR & EXPIRE
	if (isRedisReady()) {
		try {
			const current = await redis.incr(key);
			if (current === 1) {
				await redis.expire(key, windowSeconds);
			}
			const ttl = await redis.ttl(key);
			const allowed = current <= maxRequests;
			return {
				allowed,
				remaining: Math.max(0, maxRequests - current),
				resetInSeconds: Math.max(0, ttl),
			};
		} catch {
			// Fallback to in-memory rate limiting on Redis error
		}
	}

	// 2. In-Memory fallback
	const entry = memoryRateLimit.get(key);
	if (!entry || entry.resetAt <= now) {
		memoryRateLimit.set(key, {
			count: 1,
			resetAt: now + windowSeconds * 1000,
		});
		return {
			allowed: true,
			remaining: maxRequests - 1,
			resetInSeconds: windowSeconds,
		};
	}

	entry.count++;
	const resetInSeconds = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
	const allowed = entry.count <= maxRequests;

	return {
		allowed,
		remaining: Math.max(0, maxRequests - entry.count),
		resetInSeconds,
	};
}
