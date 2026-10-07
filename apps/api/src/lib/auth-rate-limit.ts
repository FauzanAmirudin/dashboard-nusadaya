import { isRedisReady, redis } from "./redis";

/**
 * Authentication Rate Limiter & Multi-Layer Brute Force Protection
 * Policy:
 * 1. Global IP rate limit: 15 req/min pada login
 * 2. Per-(IP+Username) lockout: 7 kegagalan -> lockout 7 menit
 * 3. Cross-IP Username lockout: 15 kegagalan lintas IP -> lockout 15 menit
 * 4. Per-IP OTP Verify limit: 20 req/10 menit
 * 5. Per-IP OTP Resend limit: 10 req/jam
 * 6. Per-Account OTP Lockout: 10 salah tebak OTP kumulatif -> lockout 30 menit
 */

export const AUTH_RATE_LIMIT_CONFIG = {
	MAX_FAILED_ATTEMPTS_PER_PAIR: 7,
	PAIR_LOCKOUT_SECONDS: 420, // 7 menit

	MAX_GLOBAL_ACCOUNT_FAILURES: 15,
	ACCOUNT_LOCKOUT_SECONDS: 900, // 15 menit

	GLOBAL_IP_MAX_REQUESTS: 15,
	GLOBAL_IP_WINDOW_SECONDS: 60,

	OTP_VERIFY_IP_LIMIT: 20,
	OTP_VERIFY_IP_WINDOW_SECONDS: 600, // 10 menit

	OTP_RESEND_IP_LIMIT: 10,
	OTP_RESEND_IP_WINDOW_SECONDS: 3600, // 1 jam

	OTP_ACCOUNT_LOCKOUT_FAILURES: 10,
	OTP_ACCOUNT_LOCKOUT_SECONDS: 1800, // 30 menit
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
 * Cek apakah kombinasi IP+Akun atau Akun secara global sedang terkunci
 */
export async function checkLoginLockout(
	ip: string,
	username: string,
): Promise<{
	isLocked: boolean;
	resetInSeconds: number;
	remainingAttempts: number;
	reason?: string;
}> {
	const cleanUser = (username || "").trim().toLowerCase();
	const pairKey = getAccountKey(ip, username);
	const lockPairKey = `rl:login:locked:${pairKey}`;
	const failPairKey = `rl:login:failed:${pairKey}`;
	const lockUserKey = `rl:login:locked_user:${cleanUser}`;
	const now = Date.now();

	if (isRedisReady()) {
		try {
			// 1. Cek lockout global akun (lintas IP)
			const userLocked = await redis.get(lockUserKey);
			if (userLocked) {
				const ttl = await redis.ttl(lockUserKey);
				return {
					isLocked: true,
					resetInSeconds: Math.max(1, ttl),
					remainingAttempts: 0,
					reason:
						"Akun dikunci sementara karena aktivitas mencurigakan dari berbagai lokasi.",
				};
			}

			// 2. Cek lockout kombinasi IP + Akun
			const isLocked = await redis.get(lockPairKey);
			if (isLocked) {
				const ttl = await redis.ttl(lockPairKey);
				return {
					isLocked: true,
					resetInSeconds: Math.max(1, ttl),
					remainingAttempts: 0,
					reason: "Terlalu banyak percobaan login gagal dari perangkat ini.",
				};
			}

			const currentFailures = await redis.get(failPairKey);
			const count = currentFailures ? parseInt(currentFailures, 10) : 0;
			const ttl = count > 0 ? await redis.ttl(failPairKey) : 0;

			return {
				isLocked: false,
				resetInSeconds: Math.max(0, ttl),
				remainingAttempts: Math.max(
					0,
					AUTH_RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS_PER_PAIR - count,
				),
			};
		} catch (err) {
			console.warn("[AuthRateLimit] Redis error in checkLoginLockout:", err);
		}
	}

	// In-memory fallback
	const entry = memoryLockouts.get(pairKey);
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
					AUTH_RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS_PER_PAIR - entry.count,
				),
			};
		}
		memoryLockouts.delete(pairKey);
	}

	return {
		isLocked: false,
		resetInSeconds: 0,
		remainingAttempts: AUTH_RATE_LIMIT_CONFIG.MAX_FAILED_ATTEMPTS_PER_PAIR,
	};
}

/**
 * Catat kegagalan login dan picu lockout jika melampaui batas
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
	const cleanUser = (username || "").trim().toLowerCase();
	const pairKey = getAccountKey(ip, username);
	const lockPairKey = `rl:login:locked:${pairKey}`;
	const failPairKey = `rl:login:failed:${pairKey}`;
	const failUserKey = `rl:login:failed_user:${cleanUser}`;
	const lockUserKey = `rl:login:locked_user:${cleanUser}`;
	const now = Date.now();

	const {
		MAX_FAILED_ATTEMPTS_PER_PAIR,
		PAIR_LOCKOUT_SECONDS,
		MAX_GLOBAL_ACCOUNT_FAILURES,
		ACCOUNT_LOCKOUT_SECONDS,
	} = AUTH_RATE_LIMIT_CONFIG;

	if (isRedisReady()) {
		try {
			const pipe = redis.pipeline();
			pipe.incr(failPairKey);
			pipe.incr(failUserKey);
			const results = await pipe.exec();

			const pairCount = (results?.[0]?.[1] as number) || 1;
			const userCount = (results?.[1]?.[1] as number) || 1;

			if (pairCount === 1) {
				await redis.expire(failPairKey, PAIR_LOCKOUT_SECONDS);
			}
			if (userCount === 1) {
				await redis.expire(failUserKey, ACCOUNT_LOCKOUT_SECONDS);
			}

			if (userCount >= MAX_GLOBAL_ACCOUNT_FAILURES) {
				await redis.set(lockUserKey, "1", "EX", ACCOUNT_LOCKOUT_SECONDS);
				return {
					isLocked: true,
					remainingAttempts: 0,
					resetInSeconds: ACCOUNT_LOCKOUT_SECONDS,
					currentCount: userCount,
				};
			}

			if (pairCount >= MAX_FAILED_ATTEMPTS_PER_PAIR) {
				await redis.set(lockPairKey, "1", "EX", PAIR_LOCKOUT_SECONDS);
				return {
					isLocked: true,
					remainingAttempts: 0,
					resetInSeconds: PAIR_LOCKOUT_SECONDS,
					currentCount: pairCount,
				};
			}

			const ttl = await redis.ttl(failPairKey);
			return {
				isLocked: false,
				remainingAttempts: Math.max(
					0,
					MAX_FAILED_ATTEMPTS_PER_PAIR - pairCount,
				),
				resetInSeconds: Math.max(0, ttl),
				currentCount: pairCount,
			};
		} catch (err) {
			console.warn("[AuthRateLimit] Redis error in recordFailedLogin:", err);
		}
	}

	// In-memory fallback
	let entry = memoryLockouts.get(pairKey);
	if (!entry || entry.resetAt <= now) {
		entry = {
			count: 1,
			lockedUntil: 0,
			resetAt: now + PAIR_LOCKOUT_SECONDS * 1000,
		};
	} else {
		entry.count++;
	}

	if (entry.count >= MAX_FAILED_ATTEMPTS_PER_PAIR) {
		entry.lockedUntil = now + PAIR_LOCKOUT_SECONDS * 1000;
		memoryLockouts.set(pairKey, entry);
		return {
			isLocked: true,
			remainingAttempts: 0,
			resetInSeconds: PAIR_LOCKOUT_SECONDS,
			currentCount: entry.count,
		};
	}

	memoryLockouts.set(pairKey, entry);
	const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
	return {
		isLocked: false,
		remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS_PER_PAIR - entry.count),
		resetInSeconds: Math.max(0, resetInSeconds),
		currentCount: entry.count,
	};
}

/**
 * Reset penghitung gagal saat login sukses
 */
export async function resetLoginAttempts(
	ip: string,
	username: string,
): Promise<void> {
	const cleanUser = (username || "").trim().toLowerCase();
	const pairKey = getAccountKey(ip, username);
	const lockPairKey = `rl:login:locked:${pairKey}`;
	const failPairKey = `rl:login:failed:${pairKey}`;
	const failUserKey = `rl:login:failed_user:${cleanUser}`;

	if (isRedisReady()) {
		try {
			await redis.del(lockPairKey, failPairKey, failUserKey);
		} catch (err) {
			console.warn("[AuthRateLimit] Redis error in resetLoginAttempts:", err);
		}
	}

	memoryLockouts.delete(pairKey);
}

/**
 * Cek IP Rate limit umum pada login endpoint
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

/**
 * Cek IP Rate limit khusus saat verifikasi OTP
 */
export async function checkOtpVerifyIpRateLimit(ip: string): Promise<{
	allowed: boolean;
	resetInSeconds: number;
}> {
	const cleanIp = (ip || "127.0.0.1").trim();
	const key = `rl:otp_verify:ip:${cleanIp}`;
	const { OTP_VERIFY_IP_LIMIT, OTP_VERIFY_IP_WINDOW_SECONDS } =
		AUTH_RATE_LIMIT_CONFIG;

	if (isRedisReady()) {
		try {
			const count = await redis.incr(key);
			if (count === 1) {
				await redis.expire(key, OTP_VERIFY_IP_WINDOW_SECONDS);
			}
			const ttl = await redis.ttl(key);
			return {
				allowed: count <= OTP_VERIFY_IP_LIMIT,
				resetInSeconds: Math.max(1, ttl),
			};
		} catch {
			// fallback
		}
	}
	return { allowed: true, resetInSeconds: 0 };
}

/**
 * Cek IP Rate limit khusus saat kirim ulang OTP
 */
export async function checkOtpResendIpRateLimit(ip: string): Promise<{
	allowed: boolean;
	resetInSeconds: number;
}> {
	const cleanIp = (ip || "127.0.0.1").trim();
	const key = `rl:otp_resend:ip:${cleanIp}`;
	const { OTP_RESEND_IP_LIMIT, OTP_RESEND_IP_WINDOW_SECONDS } =
		AUTH_RATE_LIMIT_CONFIG;

	if (isRedisReady()) {
		try {
			const count = await redis.incr(key);
			if (count === 1) {
				await redis.expire(key, OTP_RESEND_IP_WINDOW_SECONDS);
			}
			const ttl = await redis.ttl(key);
			return {
				allowed: count <= OTP_RESEND_IP_LIMIT,
				resetInSeconds: Math.max(1, ttl),
			};
		} catch {
			// fallback
		}
	}
	return { allowed: true, resetInSeconds: 0 };
}

const memoryOtpFailures = new Map<
	number,
	{ count: number; lockedUntil: number; resetAt: number }
>();

/**
 * Lockout akun jika akumulasi salah tebak OTP mencapai batas (T5.5)
 */
export async function recordFailedOtpAttempt(userId: number): Promise<{
	isLocked: boolean;
	resetInSeconds: number;
}> {
	const key = `rl:otp:account_fail:${userId}`;
	const lockKey = `rl:otp:account_locked:${userId}`;
	const { OTP_ACCOUNT_LOCKOUT_FAILURES, OTP_ACCOUNT_LOCKOUT_SECONDS } =
		AUTH_RATE_LIMIT_CONFIG;

	if (isRedisReady()) {
		try {
			const count = await redis.incr(key);
			if (count === 1) {
				await redis.expire(key, OTP_ACCOUNT_LOCKOUT_SECONDS);
			}
			if (count >= OTP_ACCOUNT_LOCKOUT_FAILURES) {
				await redis.set(lockKey, "1", "EX", OTP_ACCOUNT_LOCKOUT_SECONDS);
				return { isLocked: true, resetInSeconds: OTP_ACCOUNT_LOCKOUT_SECONDS };
			}
			const ttl = await redis.ttl(key);
			return { isLocked: false, resetInSeconds: Math.max(0, ttl) };
		} catch {
			// fallback
		}
	}

	// In-memory fallback
	const now = Date.now();
	let entry = memoryOtpFailures.get(userId);
	if (!entry || entry.resetAt <= now) {
		entry = {
			count: 1,
			lockedUntil: 0,
			resetAt: now + OTP_ACCOUNT_LOCKOUT_SECONDS * 1000,
		};
	} else {
		entry.count++;
	}

	if (entry.count >= OTP_ACCOUNT_LOCKOUT_FAILURES) {
		entry.lockedUntil = now + OTP_ACCOUNT_LOCKOUT_SECONDS * 1000;
		memoryOtpFailures.set(userId, entry);
		return { isLocked: true, resetInSeconds: OTP_ACCOUNT_LOCKOUT_SECONDS };
	}

	memoryOtpFailures.set(userId, entry);
	return {
		isLocked: false,
		resetInSeconds: Math.ceil((entry.resetAt - now) / 1000),
	};
}

export async function isAccountOtpLocked(userId: number): Promise<{
	isLocked: boolean;
	resetInSeconds: number;
}> {
	const lockKey = `rl:otp:account_locked:${userId}`;
	if (isRedisReady()) {
		try {
			const locked = await redis.get(lockKey);
			if (locked) {
				const ttl = await redis.ttl(lockKey);
				return { isLocked: true, resetInSeconds: Math.max(1, ttl) };
			}
		} catch {
			// fallback
		}
	}

	// In-memory fallback
	const entry = memoryOtpFailures.get(userId);
	const now = Date.now();
	if (entry && entry.lockedUntil > now) {
		return {
			isLocked: true,
			resetInSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
		};
	}

	return { isLocked: false, resetInSeconds: 0 };
}
