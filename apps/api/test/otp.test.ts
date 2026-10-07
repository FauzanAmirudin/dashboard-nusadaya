import { describe, expect, it } from "bun:test";
import { OTP_CONFIG } from "../src/config/otp.config";
import {
	checkLoginIpRateLimit,
	checkLoginLockout,
	isAccountOtpLocked,
	recordFailedLogin,
	recordFailedOtpAttempt,
	resetLoginAttempts,
} from "../src/lib/auth-rate-limit";
import { getClientIp, isValidIp } from "../src/lib/client-ip";
import { isValidEmailFormat, normalizeEmail } from "../src/lib/normalize";
import { hashUserAgent, maskEmail } from "../src/lib/otp";

describe("Email & String Normalization (T1.1)", () => {
	it("should normalize email to lowercase and trimmed", () => {
		expect(normalizeEmail("  OneDataNusadaya@Gmail.COM ")).toBe(
			"onedatanusadaya@gmail.com",
		);
		expect(normalizeEmail("")).toBe(null);
		expect(normalizeEmail(null)).toBe(null);
		expect(normalizeEmail(undefined)).toBe(null);
	});

	it("should validate email format properly and strictly reject usernames", () => {
		expect(isValidEmailFormat("test@domain.com")).toBe(true);
		expect(isValidEmailFormat("onedatanusadaya@gmail.com")).toBe(true);
		expect(isValidEmailFormat("superadmin@onedata-nusadaya.com")).toBe(true);
		expect(isValidEmailFormat("dosen1@nusadaya.ac.id")).toBe(true);
		// Username biasa harus bernilai false (tidak boleh bisa login pakai username)
		expect(isValidEmailFormat("superadmin")).toBe(false);
		expect(isValidEmailFormat("admin")).toBe(false);
		expect(isValidEmailFormat("dosen1")).toBe(false);
		expect(isValidEmailFormat("invalid-email")).toBe(false);
		expect(isValidEmailFormat("")).toBe(false);
	});

	it("should mask email for privacy correctly", () => {
		expect(maskEmail("onedatanusadaya@gmail.com")).toBe(
			"o*************a@gmail.com",
		);
		expect(maskEmail("ab@nusadaya.ac.id")).toBe("a***@nusadaya.ac.id");
		expect(maskEmail("")).toBe("email-terdaftar");
	});
});

describe("Client IP Security & Anti-Spoofing (T2.1, T10.4)", () => {
	it("should validate IPv4 format", () => {
		expect(isValidIp("192.168.1.1")).toBe(true);
		expect(isValidIp("103.120.45.10")).toBe(true);
		expect(isValidIp("999.999.999.999")).toBe(false);
		expect(isValidIp("injection' OR 1=1--")).toBe(false);
	});

	it("should validate IPv6 format", () => {
		expect(isValidIp("::1")).toBe(true);
		expect(isValidIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
	});

	it("should prioritize x-real-ip and reject malformed spoof headers", () => {
		const req1 = new Request("http://localhost/auth/login", {
			headers: { "x-real-ip": "203.0.113.195" },
		});
		expect(getClientIp(req1)).toBe("203.0.113.195");

		// Malformed header should not inject into Redis keys
		const req2 = new Request("http://localhost/auth/login", {
			headers: { "x-real-ip": "bad_actor'; DROP TABLE;--" },
		});
		expect(getClientIp(req2)).toBe("127.0.0.1");

		// Valid forwarded for
		const req3 = new Request("http://localhost/auth/login", {
			headers: { "x-forwarded-for": "198.51.100.42, 10.0.0.1" },
		});
		expect(getClientIp(req3)).toBe("198.51.100.42");
	});
});

describe("OTP Security Constants & Policies (T3.1, T7.1, T10.3)", () => {
	it("should have correct security parameters configured", () => {
		expect(OTP_CONFIG.TTL_SECONDS).toBe(300);
		expect(OTP_CONFIG.RESEND_COOLDOWN_SECONDS).toBe(60);
		expect(OTP_CONFIG.MAX_ATTEMPTS_PER_SESSION).toBe(3);
		expect(OTP_CONFIG.ACCOUNT_LOCKOUT_FAILURES).toBe(10);
		expect(OTP_CONFIG.GLOBAL_DAILY_EMAIL_LIMIT).toBe(90);
	});

	it("should enforce OTP on all staff roles and exclude students by default", () => {
		const requiredStaff = [
			"superadmin",
			"akademik",
			"finance",
			"pmb",
			"crm",
			"dosen",
			"pa",
			"magang",
		];
		for (const role of requiredStaff) {
			expect(OTP_CONFIG.ENFORCED_ROLES).toContain(role);
		}
		expect(OTP_CONFIG.ENFORCED_ROLES).not.toContain("mahasiswa");
	});

	it("should generate deterministic User-Agent hash for device binding", () => {
		const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
		const hash1 = hashUserAgent(ua);
		const hash2 = hashUserAgent(ua);
		expect(hash1).toBe(hash2);
		expect(hash1).toHaveLength(64);
		expect(hashUserAgent(undefined)).toBe("unknown");
	});
});

describe("Multi-Layer Rate Limiting & Lockout Engine (T5.1 - T5.5, T10.2)", () => {
	it("should allow login attempts within rate limit", async () => {
		const testIp = "192.0.2.1";
		const res = await checkLoginIpRateLimit(testIp);
		expect(res.allowed).toBe(true);
	});

	it("should record failed attempts and lock out after exceeding threshold", async () => {
		const testIp = "192.0.2.99";
		const username = "test_user_lockout";

		// Initial check: not locked
		const initial = await checkLoginLockout(testIp, username);
		expect(initial.isLocked).toBe(false);

		// Record failures up to threshold
		let lastFailure: any;
		for (let i = 0; i < 7; i++) {
			lastFailure = await recordFailedLogin(testIp, username);
		}

		expect(lastFailure.isLocked).toBe(true);
		expect(lastFailure.remainingAttempts).toBe(0);

		const lockedCheck = await checkLoginLockout(testIp, username);
		expect(lockedCheck.isLocked).toBe(true);

		// Reset attempts
		await resetLoginAttempts(testIp, username);
		const afterReset = await checkLoginLockout(testIp, username);
		expect(afterReset.isLocked).toBe(false);
	});

	it("should track cumulative OTP failures per account", async () => {
		const userId = 99999;
		const initial = await isAccountOtpLocked(userId);
		expect(initial.isLocked).toBe(false);

		let status: any;
		for (let i = 0; i < OTP_CONFIG.ACCOUNT_LOCKOUT_FAILURES; i++) {
			status = await recordFailedOtpAttempt(userId);
		}

		expect(status.isLocked).toBe(true);
		const locked = await isAccountOtpLocked(userId);
		expect(locked.isLocked).toBe(true);
	});
});

describe("Email Uniqueness & Conflict Security", () => {
	it("should detect duplicate emails across different casings and whitespace", () => {
		const emailA = normalizeEmail("onedatanusadaya@gmail.com");
		const emailB = normalizeEmail("   OneDataNusadaya@Gmail.COM  ");
		expect(emailA).toBe(emailB);
	});
});
