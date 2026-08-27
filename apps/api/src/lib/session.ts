import { db } from "../db";
import { auditLogs } from "../db/schema";
import { isRedisReady, redis } from "./redis";

/**
 * Server-side Session Management with Idle Timeout Protection
 * Policy:
 * - Idle Timeout: 30 minutes (1800 seconds) - customizable via env SESSION_IDLE_TIMEOUT_SECONDS
 * - Max Session Duration: 7 days (604800 seconds)
 * - Activity update throttle: 10 seconds to optimize Redis write performance
 */

export const SESSION_CONFIG = {
	IDLE_TIMEOUT_SECONDS: parseInt(
		process.env.SESSION_IDLE_TIMEOUT_SECONDS || "1800",
		10,
	), // 30 mins
	MAX_SESSION_TTL_SECONDS: 7 * 86400, // 7 days
	ACTIVITY_THROTTLE_MS: 10_000, // 10 seconds
};

export interface UserSessionData {
	sessionId: string;
	userId: number;
	username: string;
	role: string;
	roles: string[];
	lastActivity: number; // timestamp in ms
	createdAt: number; // timestamp in ms
	ip?: string;
	userAgent?: string;
}

const memorySessions = new Map<string, UserSessionData>();

// Periodic in-memory session cleanup
setInterval(() => {
	const now = Date.now();
	const idleTimeoutMs = SESSION_CONFIG.IDLE_TIMEOUT_SECONDS * 1000;
	for (const [sessionId, session] of memorySessions.entries()) {
		if (
			now - session.lastActivity > idleTimeoutMs ||
			now - session.createdAt > SESSION_CONFIG.MAX_SESSION_TTL_SECONDS * 1000
		) {
			memorySessions.delete(sessionId);
		}
	}
}, 60000);

/**
 * Create a new server-side session in Redis
 */
export async function createSession(
	user: {
		id: number;
		username: string;
		role: string;
		roles?: string[];
	},
	metadata?: { ip?: string; userAgent?: string },
): Promise<string> {
	const sessionId = crypto.randomUUID();
	const now = Date.now();
	const userRoles =
		user.roles && Array.isArray(user.roles) && user.roles.length > 0
			? user.roles
			: [user.role];

	const sessionData: UserSessionData = {
		sessionId,
		userId: user.id,
		username: user.username,
		role: user.role,
		roles: userRoles,
		lastActivity: now,
		createdAt: now,
		ip: metadata?.ip,
		userAgent: metadata?.userAgent,
	};

	const key = `session:${sessionId}`;

	// 1. Redis
	if (isRedisReady()) {
		try {
			await redis.set(
				key,
				JSON.stringify(sessionData),
				"EX",
				SESSION_CONFIG.MAX_SESSION_TTL_SECONDS,
			);
			return sessionId;
		} catch (err) {
			console.warn("[Session] Redis error in createSession:", err);
		}
	}

	// 2. In-Memory fallback
	memorySessions.set(sessionId, sessionData);
	return sessionId;
}

/**
 * Validate session status, check for idle timeout, and update lastActivity (throttled)
 */
export async function validateAndTouchSession(sessionId: string): Promise<{
	valid: boolean;
	reason?: "not_found" | "idle_timeout" | "expired";
	session?: UserSessionData;
	remainingSeconds?: number;
}> {
	if (!sessionId) {
		return { valid: false, reason: "not_found" };
	}

	const key = `session:${sessionId}`;
	const now = Date.now();
	const idleTimeoutMs = SESSION_CONFIG.IDLE_TIMEOUT_SECONDS * 1000;
	let session: UserSessionData | null = null;
	let redisChecked = false;

	// 1. Redis
	if (isRedisReady()) {
		try {
			const raw = await redis.get(key);
			redisChecked = true;
			if (raw) {
				session = JSON.parse(raw) as UserSessionData;
			}
		} catch (err) {
			console.warn("[Session] Redis error in validateAndTouchSession:", err);
		}
	}

	// 2. In-Memory fallback only if Redis is offline / errored
	if (!session && !redisChecked) {
		session = memorySessions.get(sessionId) || null;
	}

	if (!session) {
		return { valid: false, reason: "not_found" };
	}

	// Check absolute expiration (7 days)
	if (now - session.createdAt > SESSION_CONFIG.MAX_SESSION_TTL_SECONDS * 1000) {
		await invalidateSession(sessionId, session.userId, "session_expired");
		return { valid: false, reason: "expired" };
	}

	// Check idle timeout (30 minutes of no activity)
	const idleDurationMs = now - session.lastActivity;
	if (idleDurationMs > idleTimeoutMs) {
		await invalidateSession(sessionId, session.userId, "idle_timeout");

		// Record idle timeout in audit logs asynchronously
		try {
			await db.insert(auditLogs).values({
				userId: session.userId,
				action: "auth.idle_timeout",
				entity: "auth",
				entityId: session.userId,
				details: {
					sessionId,
					username: session.username,
					idleMinutes: Math.round(idleDurationMs / 60000),
					lastActivity: new Date(session.lastActivity).toISOString(),
					expiredAt: new Date(now).toISOString(),
				},
			});
		} catch (dbErr) {
			console.error("[Session] Error recording idle timeout audit log:", dbErr);
		}

		return { valid: false, reason: "idle_timeout" };
	}

	// Session is valid. Update lastActivity if throttled interval elapsed (>10s)
	if (idleDurationMs > SESSION_CONFIG.ACTIVITY_THROTTLE_MS) {
		session.lastActivity = now;

		if (isRedisReady()) {
			try {
				const currentTtl = await redis.ttl(key);
				const ttlToUse =
					currentTtl > 0 ? currentTtl : SESSION_CONFIG.MAX_SESSION_TTL_SECONDS;
				await redis.set(key, JSON.stringify(session), "EX", ttlToUse);
			} catch (err) {
				console.warn("[Session] Redis error updating lastActivity:", err);
			}
		}
		memorySessions.set(sessionId, session);
	}

	const remainingSeconds = Math.max(
		0,
		Math.ceil((idleTimeoutMs - (now - session.lastActivity)) / 1000),
	);

	return {
		valid: true,
		session,
		remainingSeconds,
	};
}

/**
 * Invalidate a session on manual logout, idle timeout, or revocation
 */
export async function invalidateSession(
	sessionId: string,
	userId?: number,
	reason:
		| "user_logout"
		| "idle_timeout"
		| "session_expired"
		| "revoked" = "user_logout",
): Promise<void> {
	if (!sessionId) return;

	const key = `session:${sessionId}`;

	if (isRedisReady()) {
		try {
			await redis.del(key);
		} catch (err) {
			console.warn("[Session] Redis error in invalidateSession:", err);
		}
	}

	memorySessions.delete(sessionId);

	if (userId && reason === "user_logout") {
		try {
			await db.insert(auditLogs).values({
				userId,
				action: "auth.logout",
				entity: "auth",
				entityId: userId,
				details: {
					sessionId,
					reason,
					timestamp: new Date().toISOString(),
				},
			});
		} catch (dbErr) {
			console.error("[Session] Error recording logout audit log:", dbErr);
		}
	}
}
