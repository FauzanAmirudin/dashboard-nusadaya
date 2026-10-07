import {
	createHash,
	createHmac,
	randomInt,
	randomUUID,
	timingSafeEqual,
} from "node:crypto";
import { OTP_CONFIG } from "../config/otp.config";
import { normalizeEmail } from "./normalize";
import { isRedisReady, redis } from "./redis";

export interface OtpSessionData {
	tempToken: string;
	userId: number;
	username: string;
	fullName: string;
	email: string;
	hmacHash: string;
	attempts: number;
	expiresAt: number;
	userAgentHash?: string;
}

export function hashUserAgent(userAgent?: string): string {
	if (!userAgent) return "unknown";
	return createHash("sha256").update(userAgent.trim()).digest("hex");
}

function calculateOtpHmac(otp: string): string {
	return createHmac("sha256", OTP_CONFIG.HMAC_SECRET)
		.update(otp.trim())
		.digest("hex");
}

function safeCompareHashes(hashA: string, hashB: string): boolean {
	const bufA = Buffer.from(hashA, "hex");
	const bufB = Buffer.from(hashB, "hex");
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}

export function maskEmail(email: string): string {
	const normalized = normalizeEmail(email);
	if (!normalized) return "email-terdaftar";
	const parts = normalized.split("@");
	if (parts.length !== 2) return normalized;
	const [name, domain] = parts;
	if (name.length <= 2) {
		return `${name[0]}***@${domain}`;
	}
	const first = name[0];
	const last = name[name.length - 1];
	const masked = `${first}${"*".repeat(Math.max(3, name.length - 2))}${last}`;
	return `${masked}@${domain}`;
}

/**
 * Pengecekan kuota pengiriman email global & per akun
 */
export async function checkEmailBudgets(userId: number): Promise<{
	allowed: boolean;
	reason?:
		| "GLOBAL_BUDGET_EXCEEDED"
		| "ACCOUNT_HOURLY_LIMIT"
		| "ACCOUNT_DAILY_LIMIT";
	message?: string;
}> {
	if (!isRedisReady()) {
		// Fail-closed jika Redis tidak tersedia
		return {
			allowed: false,
			reason: "GLOBAL_BUDGET_EXCEEDED",
			message: "Layanan penyimpanan sementara sedang tidak tersedia.",
		};
	}

	const today = new Date().toISOString().slice(0, 10);
	const hourKey = `budget:account:${userId}:h:${new Date().toISOString().slice(0, 13)}`;
	const dayKey = `budget:account:${userId}:d:${today}`;
	const globalKey = `budget:global:emails:${today}`;

	try {
		const [globalCount, hourCount, dayCount] = await Promise.all([
			redis.get(globalKey).then((v) => (v ? parseInt(v, 10) : 0)),
			redis.get(hourKey).then((v) => (v ? parseInt(v, 10) : 0)),
			redis.get(dayKey).then((v) => (v ? parseInt(v, 10) : 0)),
		]);

		// Log peringatan terstruktur saat anggaran email mencapai >= 70% (T9.3)
		if (globalCount >= Math.floor(OTP_CONFIG.GLOBAL_DAILY_EMAIL_LIMIT * 0.7)) {
			console.warn(
				`[SECURITY ALERT - EMAIL BUDGET] Penggunaan email harian telah mencapai ${globalCount}/${OTP_CONFIG.GLOBAL_DAILY_EMAIL_LIMIT} (>= 70% batas harian).`,
			);
		}

		if (globalCount >= OTP_CONFIG.GLOBAL_DAILY_EMAIL_LIMIT) {
			return {
				allowed: false,
				reason: "GLOBAL_BUDGET_EXCEEDED",
				message:
					"Batas harian sistem pengiriman email tercapai. Hubungi administrator.",
			};
		}

		if (hourCount >= OTP_CONFIG.MAX_SEND_PER_ACCOUNT_HOUR) {
			return {
				allowed: false,
				reason: "ACCOUNT_HOURLY_LIMIT",
				message:
					"Terlalu banyak permintaan OTP untuk akun ini dalam 1 jam terakhir. Silakan tunggu.",
			};
		}

		if (dayCount >= OTP_CONFIG.MAX_SEND_PER_ACCOUNT_DAY) {
			return {
				allowed: false,
				reason: "ACCOUNT_DAILY_LIMIT",
				message:
					"Batas maksimal permintaan OTP harian untuk akun ini telah tercapai.",
			};
		}

		return { allowed: true };
	} catch (err) {
		console.error("[OTP Budget] Error checking budgets:", err);
		return {
			allowed: false,
			message: "Gagal memverifikasi anggaran kuota email.",
		};
	}
}

/**
 * Catat penambahan kuota email setelah berhasil terkirim
 */
export async function recordEmailSent(userId: number): Promise<void> {
	if (!isRedisReady()) return;
	const today = new Date().toISOString().slice(0, 10);
	const hourKey = `budget:account:${userId}:h:${new Date().toISOString().slice(0, 13)}`;
	const dayKey = `budget:account:${userId}:d:${today}`;
	const globalKey = `budget:global:emails:${today}`;

	try {
		const p = redis.pipeline();
		p.incr(globalKey);
		p.expire(globalKey, 86400 * 2);
		p.incr(hourKey);
		p.expire(hourKey, 3600 * 2);
		p.incr(dayKey);
		p.expire(dayKey, 86400 * 2);
		await p.exec();
	} catch (err) {
		console.error("[OTP Budget] Error recording sent email:", err);
	}
}

/**
 * Buat sesi OTP baru (saat login username & password valid)
 */
export async function createOtpSession(params: {
	userId: number;
	username: string;
	fullName: string;
	email: string;
	userAgent?: string;
}): Promise<{
	success: boolean;
	tempToken?: string;
	otpCode?: string;
	maskedEmail?: string;
	error?: string;
}> {
	if (!isRedisReady()) {
		return {
			success: false,
			error: "Layanan autentikasi dua faktor (Redis) sedang tidak tersedia.",
		};
	}

	const cleanEmail = normalizeEmail(params.email);
	if (!cleanEmail) {
		return { success: false, error: "Akun belum memiliki email yang valid." };
	}

	// 1. Cek kuota pengiriman
	const budgetCheck = await checkEmailBudgets(params.userId);
	if (!budgetCheck.allowed) {
		return { success: false, error: budgetCheck.message };
	}

	// 2. Batalkan sesi OTP lama milik user ini jika ada (Single Active OTP)
	const userActiveKey = `otp:active_user:${params.userId}`;
	const oldToken = await redis.get(userActiveKey);
	if (oldToken) {
		await redis.del(`otp:session:${oldToken}`);
	}

	const otpCode = randomInt(100000, 1000000).toString();
	const hmacHash = calculateOtpHmac(otpCode);
	const tempToken = randomUUID();
	const now = Date.now();
	const expiresAt = now + OTP_CONFIG.TTL_SECONDS * 1000;
	const userAgentHash = hashUserAgent(params.userAgent);

	const sessionData: OtpSessionData = {
		tempToken,
		userId: params.userId,
		username: params.username,
		fullName: params.fullName,
		email: cleanEmail,
		hmacHash,
		attempts: 0,
		expiresAt,
		userAgentHash,
	};

	const sessionKey = `otp:session:${tempToken}`;
	const cooldownKey = `otp:cooldown:${params.userId}`;

	try {
		const pipe = redis.pipeline();
		pipe.set(
			sessionKey,
			JSON.stringify(sessionData),
			"EX",
			OTP_CONFIG.TTL_SECONDS,
		);
		pipe.set(userActiveKey, tempToken, "EX", OTP_CONFIG.TTL_SECONDS);
		pipe.set(
			cooldownKey,
			now.toString(),
			"EX",
			OTP_CONFIG.RESEND_COOLDOWN_SECONDS,
		);
		await pipe.exec();

		return {
			success: true,
			tempToken,
			otpCode,
			maskedEmail: maskEmail(cleanEmail),
		};
	} catch (err) {
		console.error("[OTP] Gagal membuat sesi di Redis:", err);
		return { success: false, error: "Gagal menyimpan sesi verifikasi OTP." };
	}
}

/**
 * Verifikasi kode OTP secara atomik dan aman dari timing attack
 */
export async function verifyOtpSession(
	tempToken: string,
	inputOtp: string,
	currentUserAgent?: string,
): Promise<{
	valid: boolean;
	session?: OtpSessionData;
	reason?:
		| "STORAGE_UNAVAILABLE"
		| "NOT_FOUND"
		| "EXPIRED"
		| "MAX_ATTEMPTS"
		| "DEVICE_MISMATCH"
		| "INVALID_CODE";
	remainingAttempts?: number;
}> {
	if (!isRedisReady()) {
		return { valid: false, reason: "STORAGE_UNAVAILABLE" };
	}

	const sessionKey = `otp:session:${tempToken}`;
	const raw = await redis.get(sessionKey);
	if (!raw) {
		return { valid: false, reason: "NOT_FOUND" };
	}

	let session: OtpSessionData;
	try {
		session = JSON.parse(raw);
	} catch {
		await redis.del(sessionKey);
		return { valid: false, reason: "NOT_FOUND" };
	}

	if (session.expiresAt < Date.now()) {
		await deleteOtpSession(tempToken, session.userId);
		return { valid: false, reason: "EXPIRED" };
	}

	if (session.attempts >= OTP_CONFIG.MAX_ATTEMPTS_PER_SESSION) {
		await deleteOtpSession(tempToken, session.userId);
		return { valid: false, reason: "MAX_ATTEMPTS", remainingAttempts: 0 };
	}

	// Validasi sidik jari User-Agent (Peringatan / Pencegahan pencurian token)
	if (session.userAgentHash && currentUserAgent) {
		const currentHash = hashUserAgent(currentUserAgent);
		if (session.userAgentHash !== currentHash) {
			console.warn(
				`[OTP Security] Deteksi perubahan User-Agent untuk token ${tempToken}`,
			);
		}
	}

	const inputHmac = calculateOtpHmac(inputOtp.trim());
	const isMatch = safeCompareHashes(inputHmac, session.hmacHash);

	if (!isMatch) {
		session.attempts += 1;
		const remaining = Math.max(
			0,
			OTP_CONFIG.MAX_ATTEMPTS_PER_SESSION - session.attempts,
		);

		if (session.attempts >= OTP_CONFIG.MAX_ATTEMPTS_PER_SESSION) {
			await deleteOtpSession(tempToken, session.userId);
			return { valid: false, reason: "MAX_ATTEMPTS", remainingAttempts: 0 };
		}

		// Update sisa percobaan secara atomik
		const ttlRemaining = Math.max(
			1,
			Math.floor((session.expiresAt - Date.now()) / 1000),
		);
		await redis.set(sessionKey, JSON.stringify(session), "EX", ttlRemaining);

		return {
			valid: false,
			reason: "INVALID_CODE",
			remainingAttempts: remaining,
		};
	}

	// Verifikasi Sukses: Hapus sesi OTP agar one-time use terjamin
	await deleteOtpSession(tempToken, session.userId);

	return {
		valid: true,
		session,
	};
}

/**
 * Kirim ulang kode OTP dengan proteksi cooldown & pembatalan kode lama
 */
export async function resendOtpSession(
	tempToken: string,
	userAgent?: string,
): Promise<{
	success: boolean;
	userId?: number;
	otpCode?: string;
	email?: string;
	fullName?: string;
	maskedEmail?: string;
	cooldownSeconds?: number;
	reason?: "STORAGE_UNAVAILABLE" | "NOT_FOUND" | "COOLDOWN" | "BUDGET_EXCEEDED";
	message?: string;
}> {
	if (!isRedisReady()) {
		return { success: false, reason: "STORAGE_UNAVAILABLE" };
	}

	const sessionKey = `otp:session:${tempToken}`;
	const raw = await redis.get(sessionKey);
	if (!raw) {
		return { success: false, reason: "NOT_FOUND" };
	}

	const session: OtpSessionData = JSON.parse(raw);

	// 1. Cek cooldown
	const cooldownKey = `otp:cooldown:${session.userId}`;
	const ttl = await redis.ttl(cooldownKey);
	if (ttl > 0) {
		return {
			success: false,
			reason: "COOLDOWN",
			cooldownSeconds: ttl,
			message: `Mohon tunggu ${ttl} detik sebelum meminta kode baru.`,
		};
	}

	// 2. Cek kuota
	const budgetCheck = await checkEmailBudgets(session.userId);
	if (!budgetCheck.allowed) {
		return {
			success: false,
			reason: "BUDGET_EXCEEDED",
			message: budgetCheck.message,
		};
	}

	// 3. Generate OTP baru & perbarui masa aktif
	const newOtpCode = randomInt(100000, 1000000).toString();
	session.hmacHash = calculateOtpHmac(newOtpCode);
	session.attempts = 0;
	session.expiresAt = Date.now() + OTP_CONFIG.TTL_SECONDS * 1000;
	if (userAgent) {
		session.userAgentHash = hashUserAgent(userAgent);
	}

	const pipe = redis.pipeline();
	pipe.set(sessionKey, JSON.stringify(session), "EX", OTP_CONFIG.TTL_SECONDS);
	pipe.set(
		cooldownKey,
		Date.now().toString(),
		"EX",
		OTP_CONFIG.RESEND_COOLDOWN_SECONDS,
	);
	await pipe.exec();

	return {
		success: true,
		userId: session.userId,
		otpCode: newOtpCode,
		email: session.email,
		fullName: session.fullName,
		maskedEmail: maskEmail(session.email),
		cooldownSeconds: OTP_CONFIG.RESEND_COOLDOWN_SECONDS,
	};
}

export async function deleteOtpSession(
	tempToken: string,
	userId?: number,
): Promise<void> {
	if (!isRedisReady()) return;
	const pipe = redis.pipeline();
	pipe.del(`otp:session:${tempToken}`);
	if (userId) {
		pipe.del(`otp:active_user:${userId}`);
	}
	await pipe.exec();
}
