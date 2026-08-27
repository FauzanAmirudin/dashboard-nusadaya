import { isRedisReady, redis } from "./redis";

/**
 * Authentication Rate Limiter & Brute Force Protection
 * Policy:
 * - Max failed attempts: 7 attempts per (IP + username)
 * - Window & Lockout duration: 7 minutes (420 seconds)
 * - Global IP rate limit: 15 requests/minute
 */

export const AUTH_RATE_LIMIT_CONFIG = {
	MAX_FAILED_ATTEMPTS: 7,
	LOCKOUT_SECONDS: 7 * 60, // 420 seconds (7 minutes)
	GLOBAL_IP_MAX_REQUESTS: 15,
	GLOBAL_IP_WINDOW_SECONDS: 60,
};

interface MemoryLockoutEntry {
	count: number;
	lockedUntil: number;
	resetAt: number;
}

const memoryLockouts = new Map<string, MemoryLockoutEntry>();
const memoryIpLimits = new Map<string, { count: number; resetAt: number }>();

// Periodic in-memory cleanup every 60 seconds
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of memoryLockouts.entries()) {
		if (entry.lockedUntil <= now && entry.resetAt <= now) {
			memoryLockouts.delete(key);
		}
	}
	for (const [key, entry] of memoryIpLimits.entries()) {
		if (entry.resetAt <= now) {
			memoryIpLimits.delete(key);
		}
	}
}, 60000);

function getAccountKey(ip: string, username: string): string {
	const cleanIp = (ip || "127.0.0.1").trim();
	const cleanUsername = (username || "").trim().toLowerCase();
	return `${cleanIp}:${cleanUsername}`;
}

/**
 * Check if the account or IP is currently locked out BEFORE verifying password
 */
export async function checkLoginLockout(
	ip: string,
	username: string,
): Promise<{
	isLocked: boolean;
	resetInSeconds: number;
	remainingAttempts: number;
}> {
	const key = getAccountKey(ip, username);
	const lockKey = `rl:login:locked:${key}`;
	const failKey = `rl:login:failed:${key}`;
	const now = Date.now();

	// 1. Redis check
	if (isRedisReady()) {
		try {
			const isLocked = await redis.get(lockKey);
			if (isLocked) {
				const ttl = await redis.ttl(lockKey);
				return {
					isLocked: true,
					resetInSeconds: Math.max(1, ttl),
					remainingAttempts: 0,
				};
			}

			const currentFailures = await redis.get(failKey);
			const count = currentFailures ? parseInt(currentFailures, 10) : 0;
			const ttl = count > 0 ? await redis.ttl(failKey) : 0;

			return {
				isLocked: false,
				resetInSeconds: Math.max(0, ttl),
				remainingAttempts: Math.max(
					0,
					AUTH_RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS - count,
				),
			};
		} catch (err) {
			console.warn("[AuthRateLimit] Redis error in checkLoginLockout:", err);
		}
	}

	// 2. In-Memory fallback
	const entry = memoryLockouts.get(key);
	if (entry) {
		if (entry.lockedUntil > now) {
			const resetInSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
			return {
				isLocked: true,
				resetInSeconds: Math.max(1, resetInSeconds),
				remainingAttempts: 0,
			};
		}

		if (entry.resetAt > now) {
			return {
				isLocked: false,
				resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
				remainingAttempts: Math.max(
					0,
					AUTH_RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS - entry.count,
				),
			};
		}

		// Expired entry
		memoryLockouts.delete(key);
	}

	return {
		isLocked: false,
		resetInSeconds: 0,
		remainingAttempts: AUTH_RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS,
	};
}

/**
 * Record a failed login attempt and trigger lockout if limit reached
 */
export async function recordFailedLogin(
	ip: string,
	username: string,
): Promise<{
	isLocked: boolean;
	remainingAttempts: number;
	resetInSeconds: number;
	currentCount: number;
}> {
	const key = getAccountKey(ip, username);
	const lockKey = `rl:login:locked:${key}`;
	const failKey = `rl:login:failed:${key}`;
	const { MAX_FAILED_ATTEMPTS, LOCKOUT_SECONDS } = AUTH_RATE_LIMIT_CONFIG;
	const now = Date.now();

	// 1. Redis
	if (isRedisReady()) {
		try {
			const count = await redis.incr(failKey);
			if (count === 1) {
				await redis.expire(failKey, LOCKOUT_SECONDS);
			}

			if (count >= MAX_FAILED_ATTEMPTS) {
				await redis.set(lockKey, "1", "EX", LOCKOUT_SECONDS);
				return {
					isLocked: true,
					remainingAttempts: 0,
					resetInSeconds: LOCKOUT_SECONDS,
					currentCount: count,
				};
			}

			const ttl = await redis.ttl(failKey);
			return {
				isLocked: false,
				remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - count),
				resetInSeconds: Math.max(0, ttl),
				currentCount: count,
			};
		} catch (err) {
			console.warn("[AuthRateLimit] Redis error in recordFailedLogin:", err);
		}
	}

	// 2. In-Memory fallback
	let entry = memoryLockouts.get(key);
	if (!entry || entry.resetAt <= now) {
		entry = {
			count: 1,
			lockedUntil: 0,
			resetAt: now + LOCKOUT_SECONDS * 1000,
		};
	} else {
		entry.count++;
	}

	if (entry.count >= MAX_FAILED_ATTEMPTS) {
		entry.lockedUntil = now + LOCKOUT_SECONDS * 1000;
		memoryLockouts.set(key, entry);
		return {
			isLocked: true,
			remainingAttempts: 0,
			resetInSeconds: LOCKOUT_SECONDS,
			currentCount: entry.count,
		};
	}

	memoryLockouts.set(key, entry);
	const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
	return {
		isLocked: false,
		remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - entry.count),
		resetInSeconds: Math.max(0, resetInSeconds),
		currentCount: entry.count,
	};
}

/**
 * Reset failed attempts and clear lockout on successful login
 */
export async function resetLoginAttempts(
	ip: string,
	username: string,
): Promise<void> {
	const key = getAccountKey(ip, username);
	const lockKey = `rl:login:locked:${key}`;
	const failKey = `rl:login:failed:${key}`;

	if (isRedisReady()) {
		try {
			await redis.del(lockKey, failKey);
		} catch (err) {
			console.warn("[AuthRateLimit] Redis error in resetLoginAttempts:", err);
		}
	}

	memoryLockouts.delete(key);
}

/**
 * Check general IP rate limit on login endpoint to prevent IP flood/enumeration
 */
export async function checkLoginIpRateLimit(ip: string): Promise<{
	allowed: boolean;
	remaining: number;
	resetInSeconds: number;
}> {
	const cleanIp = (ip || "127.0.0.1").trim();
	const key = `rl:login:ip:${cleanIp}`;
	const { GLOBAL_IP_MAX_REQUESTS, GLOBAL_IP_WINDOW_SECONDS } =
		AUTH_RATE_LIMIT_CONFIG;
	const now = Date.now();

	if (isRedisReady()) {
		try {
			const count = await redis.incr(key);
			if (count === 1) {
				await redis.expire(key, GLOBAL_IP_WINDOW_SECONDS);
			}
			const ttl = await redis.ttl(key);
			return {
				allowed: count <= GLOBAL_IP_MAX_REQUESTS,
				remaining: Math.max(0, GLOBAL_IP_MAX_REQUESTS - count),
				resetInSeconds: Math.max(0, ttl),
			};
		} catch (err) {
			console.warn(
				"[AuthRateLimit] Redis error in checkLoginIpRateLimit:",
				err,
			);
		}
	}

	// In-memory fallback
	const entry = memoryIpLimits.get(cleanIp);
	if (!entry || entry.resetAt <= now) {
		memoryIpLimits.set(cleanIp, {
			count: 1,
			resetAt: now + GLOBAL_IP_WINDOW_SECONDS * 1000,
		});
		return {
			allowed: true,
			remaining: GLOBAL_IP_MAX_REQUESTS - 1,
			resetInSeconds: GLOBAL_IP_WINDOW_SECONDS,
		};
	}

	entry.count++;
	const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
	return {
		allowed: entry.count <= GLOBAL_IP_MAX_REQUESTS,
		remaining: Math.max(0, GLOBAL_IP_MAX_REQUESTS - entry.count),
		resetInSeconds: Math.max(0, resetInSeconds),
	};
}
