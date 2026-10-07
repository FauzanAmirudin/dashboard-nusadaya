import { eq } from "drizzle-orm";
import { OTP_CONFIG } from "../../../config/otp.config";
import { db } from "../../../db";
import { auditLogs, users } from "../../../db/schema";
import {
	checkLoginIpRateLimit,
	checkLoginLockout,
	checkOtpResendIpRateLimit,
	checkOtpVerifyIpRateLimit,
	isAccountOtpLocked,
	recordFailedLogin,
	recordFailedOtpAttempt,
	resetLoginAttempts,
} from "../../../lib/auth-rate-limit";
import { getClientIp } from "../../../lib/client-ip";
import { sendOtpEmail } from "../../../lib/email";
import { isValidEmailFormat, normalizeEmail } from "../../../lib/normalize";
import {
	createOtpSession,
	resendOtpSession,
	verifyOtpSession,
} from "../../../lib/otp";
import { createSession } from "../../../lib/session";

// Dummy hash valid format untuk timing-safe user enumeration mitigation (T5.8)
const DUMMY_HASH =
	"$argon2id$v=19$m=65536,t=2,p=1$c29tZXJhbmRvbXNhbHQxMjM$7dI9Vn1+25zY4yNn1/w4fG7Lz9+9Z0x8s2K3J";

export interface SessionIssueResult {
	user: {
		id: number;
		username: string;
		role: string;
		roles: string[];
		sessionId: string;
	};
	token: string;
}

/**
 * Helper tunggal untuk menerbitkan server-side session di Redis dan menandatangani JWT (T6.3)
 */
export async function issueSessionAndToken({
	user,
	ip,
	userAgent,
	jwt,
	cookieAuth,
}: {
	user: {
		id: number;
		username: string;
		role: string;
		roles?: string[] | null;
	};
	ip: string;
	userAgent?: string;
	jwt: any;
	cookieAuth: any;
}): Promise<SessionIssueResult> {
	const userRoles =
		user.roles && Array.isArray(user.roles) && user.roles.length > 0
			? user.roles
			: [user.role];

	const sessionId = await createSession(
		{
			id: user.id,
			username: user.username,
			role: user.role,
			roles: userRoles,
		},
		{ ip, userAgent },
	);

	const jwtPayload = {
		id: user.id,
		username: user.username,
		role: user.role,
		roles: userRoles,
		sessionId,
	};

	const token = await jwt.sign(jwtPayload);

	cookieAuth.set({
		value: token,
		httpOnly: true,
		maxAge: 7 * 86400,
		path: "/",
		sameSite: "none",
		secure: true,
	});

	return { user: jwtPayload, token };
}

/**
 * Logika autentikasi kredensial (Step 1 Login)
 */
export async function processLogin({
	body,
	request,
	jwt,
	cookieAuth,
	set,
}: {
	body: { email: string; password: string };
	request: Request;
	jwt: any;
	cookieAuth: any;
	set: any;
}) {
	const ip = getClientIp(request);
	const userAgent = request.headers.get("user-agent") || undefined;

	// 1. IP Rate Limiting
	const ipLimit = await checkLoginIpRateLimit(ip);
	if (!ipLimit.allowed) {
		set.status = 429;
		return {
			success: false,
			code: "RATE_LIMIT_EXCEEDED",
			message: `Terlalu banyak permintaan masuk dari IP ini. Coba lagi dalam ${ipLimit.resetInSeconds} detik.`,
			resetInSeconds: ipLimit.resetInSeconds,
		};
	}

	const rawInput = (body.email || (body as any).username || "").trim();
	const normalizedEmail = normalizeEmail(rawInput);

	// Validasi Format Email (Tolak username non-email)
	if (!normalizedEmail || !isValidEmailFormat(normalizedEmail)) {
		set.status = 400;
		return {
			success: false,
			code: "INVALID_EMAIL_FORMAT",
			message:
				"Login harus menggunakan alamat email terdaftar (contoh: user@gmail.com). Penggunaan username tidak diizinkan.",
		};
	}

	// 2. Lockout Check berbasis IP + Email
	const lockout = await checkLoginLockout(ip, normalizedEmail);
	if (lockout.isLocked) {
		set.status = 429;
		const minutes = Math.ceil(lockout.resetInSeconds / 60);
		return {
			success: false,
			code: "ACCOUNT_LOCKED",
			message: `${lockout.reason || "Akun dikunci sementara demi keamanan."} Silakan coba lagi dalam ${minutes} menit (${lockout.resetInSeconds} detik).`,
			resetInSeconds: lockout.resetInSeconds,
		};
	}

	// 3. User Lookup berdasarkan kolom `email` (Lowercased)
	const user = await db.query.users.findFirst({
		where: eq(users.email, normalizedEmail),
	});

	let isPasswordValid = false;
	if (user) {
		isPasswordValid = await Bun.password.verify(
			body.password,
			user.passwordHash,
		);
	} else {
		// Timing mitigation: tetap jalankan verifikasi hash dummy
		await Bun.password.verify(body.password, DUMMY_HASH).catch(() => false);
	}

	// 4. Kredensial Salah
	if (!user || !isPasswordValid) {
		const failure = await recordFailedLogin(ip, normalizedEmail);

		try {
			await db.insert(auditLogs).values({
				userId: user ? user.id : null,
				action: failure.isLocked
					? "auth.lockout_triggered"
					: "auth.login_failed",
				entity: "auth",
				entityId: user ? user.id : null,
				details: {
					ip,
					email: normalizedEmail,
					remainingAttempts: failure.remainingAttempts,
					locked: failure.isLocked,
					timestamp: new Date().toISOString(),
				},
			});
		} catch (auditErr) {
			console.error("[Login] Audit error:", auditErr);
		}

		if (failure.isLocked) {
			set.status = 429;
			const minutes = Math.ceil(failure.resetInSeconds / 60);
			return {
				success: false,
				code: "ACCOUNT_LOCKED",
				message: `Batas percobaan login gagal tercapai. Akun dikunci selama ${minutes} menit.`,
				resetInSeconds: failure.resetInSeconds,
			};
		}

		set.status = 401;
		return {
			success: false,
			code: "INVALID_CREDENTIALS",
			message: "Email atau password salah.",
			remainingAttempts: failure.remainingAttempts,
		};
	}

	// 5. Kredensial Benar: Reset counter gagal
	await resetLoginAttempts(ip, normalizedEmail);

	// 6. Evaluasi Kebijakan OTP (Role Enforced Policy)
	const isStaffRole = OTP_CONFIG.ENFORCED_ROLES.includes(user.role);
	const shouldEnforceOtp = OTP_CONFIG.IS_ENABLED && isStaffRole;
	const userEmail = normalizeEmail(user.email);

	if (shouldEnforceOtp) {
		// Kebijakan K2: Staf tanpa email ditolak login (Fail-Closed)
		if (!userEmail) {
			try {
				await db.insert(auditLogs).values({
					userId: user.id,
					action: "auth.login_blocked_no_email",
					entity: "auth",
					entityId: user.id,
					details: {
						ip,
						username: user.username,
						role: user.role,
						timestamp: new Date().toISOString(),
					},
				});
			} catch (auditErr) {
				console.error("[Login] Audit error:", auditErr);
			}

			set.status = 403;
			return {
				success: false,
				code: "EMAIL_VERIFICATION_REQUIRED",
				message:
					"Akun Anda diwajibkan menggunakan verifikasi email (2FA), namun belum memiliki alamat email yang terdaftar. Silakan hubungi Administrator untuk melengkapi email Anda.",
			};
		}

		// Buat Sesi OTP di Redis
		const otpResult = await createOtpSession({
			userId: user.id,
			username: user.username,
			fullName: user.fullName,
			email: userEmail,
			userAgent,
		});

		if (!otpResult.success || !otpResult.tempToken || !otpResult.otpCode) {
			set.status = 503;
			return {
				success: false,
				code: "OTP_SERVICE_UNAVAILABLE",
				message:
					otpResult.error || "Layanan verifikasi kode sedang tidak tersedia.",
			};
		}

		// Kirim email via Resend
		const emailResult = await sendOtpEmail({
			userId: user.id,
			to: userEmail,
			name: user.fullName,
			otpCode: otpResult.otpCode,
			expiresInMinutes: Math.floor(OTP_CONFIG.TTL_SECONDS / 60),
			requestIp: ip,
			userAgent,
		});

		if (!emailResult.success) {
			set.status = 500;
			return {
				success: false,
				code: "EMAIL_SEND_FAILED",
				message: emailResult.error || "Gagal mengirim email kode verifikasi.",
			};
		}

		// Catat audit OTP sent
		try {
			await db.insert(auditLogs).values({
				userId: user.id,
				action: "auth.otp_sent",
				entity: "auth",
				entityId: user.id,
				details: {
					ip,
					username: user.username,
					maskedEmail: otpResult.maskedEmail,
					timestamp: new Date().toISOString(),
				},
			});
		} catch (auditErr) {
			console.error("[Login] Audit error:", auditErr);
		}

		return {
			success: true,
			requiresOtp: true,
			tempToken: otpResult.tempToken,
			maskedEmail: otpResult.maskedEmail,
			message: `Kode verifikasi telah dikirimkan ke ${otpResult.maskedEmail}`,
		};
	}

	// 7. Jika akun tidak wajib OTP (atau OTP dinonaktifkan via flag): Terbitkan Sesi Langsung
	const sessionResult = await issueSessionAndToken({
		user,
		ip,
		userAgent,
		jwt,
		cookieAuth,
	});

	try {
		await db.insert(auditLogs).values({
			userId: user.id,
			action: "auth.login_success_direct",
			entity: "auth",
			entityId: user.id,
			details: {
				ip,
				username: user.username,
				sessionId: sessionResult.user.sessionId,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (auditErr) {
		console.error("[Login] Audit error:", auditErr);
	}

	return {
		success: true,
		requiresOtp: false,
		user: sessionResult.user,
		token: sessionResult.token,
	};
}

/**
 * Logika verifikasi OTP (Step 2 Login)
 */
export async function processVerifyOtp({
	body,
	request,
	jwt,
	cookieAuth,
	set,
}: {
	body: { tempToken: string; otp: string };
	request: Request;
	jwt: any;
	cookieAuth: any;
	set: any;
}) {
	const ip = getClientIp(request);
	const userAgent = request.headers.get("user-agent") || undefined;

	// IP Rate limit check
	const ipLimit = await checkOtpVerifyIpRateLimit(ip);
	if (!ipLimit.allowed) {
		set.status = 429;
		return {
			success: false,
			code: "RATE_LIMIT_EXCEEDED",
			message: `Terlalu banyak percobaan verifikasi dari IP ini. Tunggu ${ipLimit.resetInSeconds} detik.`,
		};
	}

	const verifyResult = await verifyOtpSession(
		body.tempToken,
		body.otp,
		userAgent,
	);

	if (!verifyResult.valid) {
		if (verifyResult.reason === "STORAGE_UNAVAILABLE") {
			set.status = 503;
			return {
				success: false,
				code: "SERVICE_UNAVAILABLE",
				message: "Layanan verifikasi kode sedang tidak tersedia.",
			};
		}
		if (verifyResult.reason === "MAX_ATTEMPTS") {
			set.status = 429;
			return {
				success: false,
				code: "MAX_ATTEMPTS_EXCEEDED",
				message:
					"Batas 3 kali percobaan kode OTP telah tercapai. Sesi verifikasi dibatalkan demi keamanan. Silakan login kembali.",
			};
		}
		if (
			verifyResult.reason === "NOT_FOUND" ||
			verifyResult.reason === "EXPIRED"
		) {
			set.status = 400;
			return {
				success: false,
				code: "OTP_EXPIRED",
				message:
					"Kode OTP telah kadaluarsa atau sesi verifikasi tidak valid. Silakan login ulang.",
			};
		}

		// Salah kode OTP
		if (verifyResult.session) {
			const lockoutStatus = await recordFailedOtpAttempt(
				verifyResult.session.userId,
			);

			try {
				await db.insert(auditLogs).values({
					userId: verifyResult.session.userId,
					action: lockoutStatus.isLocked
						? "auth.otp_locked"
						: "auth.otp_failed",
					entity: "auth",
					entityId: verifyResult.session.userId,
					details: {
						ip,
						remainingAttempts: verifyResult.remainingAttempts,
						locked: lockoutStatus.isLocked,
						timestamp: new Date().toISOString(),
					},
				});
			} catch (auditErr) {
				console.error("[OTP Verify] Audit error:", auditErr);
			}

			if (lockoutStatus.isLocked) {
				set.status = 429;
				return {
					success: false,
					code: "ACCOUNT_LOCKED",
					message:
						"Terlalu banyak kegagalan verifikasi OTP pada akun ini. Akun dikunci selama 30 menit demi keamanan.",
				};
			}
		}

		set.status = 400;
		return {
			success: false,
			code: "INVALID_OTP",
			message: `Kode verifikasi salah. Sisa kesempatan mencoba: ${verifyResult.remainingAttempts ?? 0} kali.`,
			remainingAttempts: verifyResult.remainingAttempts,
		};
	}

	const session = verifyResult.session!;

	// Cek apakah akun terlockout kumulatif OTP
	const otpLockout = await isAccountOtpLocked(session.userId);
	if (otpLockout.isLocked) {
		set.status = 429;
		return {
			success: false,
			code: "ACCOUNT_LOCKED",
			message: `Akun ini sedang dalam masa penguncian OTP. Silakan coba lagi dalam ${otpLockout.resetInSeconds} detik.`,
		};
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session.userId),
	});

	if (!user) {
		set.status = 404;
		return {
			success: false,
			code: "USER_NOT_FOUND",
			message: "Pengguna tidak ditemukan.",
		};
	}

	const sessionResult = await issueSessionAndToken({
		user,
		ip,
		userAgent,
		jwt,
		cookieAuth,
	});

	try {
		await db.insert(auditLogs).values({
			userId: user.id,
			action: "auth.otp_success",
			entity: "auth",
			entityId: user.id,
			details: {
				ip,
				username: user.username,
				sessionId: sessionResult.user.sessionId,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (auditErr) {
		console.error("[OTP Verify] Audit error:", auditErr);
	}

	return {
		success: true,
		user: sessionResult.user,
		token: sessionResult.token,
	};
}

/**
 * Logika kirim ulang kode OTP
 */
export async function processResendOtp({
	body,
	request,
	set,
}: {
	body: { tempToken: string };
	request: Request;
	set: any;
}) {
	const ip = getClientIp(request);
	const userAgent = request.headers.get("user-agent") || undefined;

	// IP Rate limit check
	const ipLimit = await checkOtpResendIpRateLimit(ip);
	if (!ipLimit.allowed) {
		set.status = 429;
		return {
			success: false,
			code: "RATE_LIMIT_EXCEEDED",
			message: `Terlalu banyak permintaan kirim ulang dari IP ini. Tunggu beberapa saat.`,
		};
	}

	const resendResult = await resendOtpSession(body.tempToken, userAgent);

	if (!resendResult.success) {
		if (resendResult.reason === "COOLDOWN") {
			set.status = 429;
			return {
				success: false,
				code: "COOLDOWN_ACTIVE",
				message: resendResult.message,
				cooldownSeconds: resendResult.cooldownSeconds,
			};
		}
		if (resendResult.reason === "BUDGET_EXCEEDED") {
			set.status = 429;
			return {
				success: false,
				code: "BUDGET_EXCEEDED",
				message: resendResult.message,
			};
		}
		set.status = 400;
		return {
			success: false,
			code: "SESSION_EXPIRED",
			message:
				"Sesi verifikasi telah kadaluarsa. Silakan login kembali dari awal.",
		};
	}

	const emailResult = await sendOtpEmail({
		userId: 0, // id sudah diperiksa di resendOtpSession
		to: resendResult.email!,
		name: resendResult.fullName!,
		otpCode: resendResult.otpCode!,
		expiresInMinutes: Math.floor(OTP_CONFIG.TTL_SECONDS / 60),
		requestIp: ip,
		userAgent,
	});

	if (!emailResult.success) {
		set.status = 500;
		return {
			success: false,
			code: "EMAIL_SEND_FAILED",
			message: emailResult.error || "Gagal mengirim ulang email OTP.",
		};
	}

	try {
		await db.insert(auditLogs).values({
			userId: (resendResult as any).userId || null,
			action: "auth.otp_resend",
			entity: "auth",
			entityId: (resendResult as any).userId || null,
			details: {
				ip,
				maskedEmail: resendResult.maskedEmail,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (auditErr) {
		console.error("[OTP Resend] Audit error:", auditErr);
	}

	return {
		success: true,
		message: `Kode verifikasi baru telah dikirim ke ${resendResult.maskedEmail}`,
		maskedEmail: resendResult.maskedEmail,
		cooldownSeconds: resendResult.cooldownSeconds,
	};
}
