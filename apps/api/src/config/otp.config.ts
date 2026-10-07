/**
 * Konfigurasi Terpusat untuk Otentikasi OTP & Kebijakan Keamanan
 */

export const OTP_CONFIG = {
	// Masa berlaku kode OTP (300 detik = 5 menit)
	TTL_SECONDS: 300,

	// Waktu tunggu sebelum diperbolehkan kirim ulang kode (60 detik)
	RESEND_COOLDOWN_SECONDS: 60,

	// Maksimal salah tebak kode OTP per sesi (3 kali)
	MAX_ATTEMPTS_PER_SESSION: 3,

	// Kuota kirim OTP per akun
	MAX_SEND_PER_ACCOUNT_HOUR: 5,
	MAX_SEND_PER_ACCOUNT_DAY: 10,

	// Batas salah tebak OTP kumulatif per akun (memicu lockout akun)
	ACCOUNT_LOCKOUT_FAILURES: 10,
	ACCOUNT_LOCKOUT_WINDOW_SECONDS: 1800, // 30 menit

	// Anggaran kuota pengiriman email harian sistem (Safety buffer di bawah batas Resend Free 100/hari)
	GLOBAL_DAILY_EMAIL_LIMIT: 90,

	// Role yang diwajibkan melewati verifikasi OTP via email
	ENFORCED_ROLES: [
		"superadmin",
		"akademik",
		"finance",
		"pmb",
		"crm",
		"dosen",
		"pa",
		"magang",
	],

	// Flag apakah verifikasi OTP diaktifkan
	get IS_ENABLED(): boolean {
		return process.env.OTP_LOGIN_ENABLED !== "false";
	},

	// Secret key untuk HMAC hashing OTP (bukan plain SHA256)
	get HMAC_SECRET(): string {
		const secret = process.env.OTP_HMAC_SECRET;
		if (process.env.NODE_ENV === "production") {
			if (!secret || secret.length < 32) {
				throw new Error(
					"[SECURITY CRITICAL] OTP_HMAC_SECRET wajib diset minimal 32 karakter pada environment production!",
				);
			}
		}
		return secret || "dev_otp_hmac_secret_fallback_key_nusadaya_2026";
	},
};

/**
 * Validasi ketat konfigurasi keamanan saat server booting
 */
export function validateOtpConfigOnStartup(): void {
	if (process.env.NODE_ENV === "production") {
		if (OTP_CONFIG.IS_ENABLED) {
			const secret = process.env.OTP_HMAC_SECRET;
			if (!secret || secret.length < 32) {
				throw new Error(
					"[SECURITY CRITICAL] Server menolak start di produksi: OTP_HMAC_SECRET wajib diset minimal 32 karakter!",
				);
			}
			const resendKey = process.env.RESEND_API_KEY;
			if (!resendKey || resendKey.startsWith("re_your_")) {
				throw new Error(
					"[SECURITY CRITICAL] Server menolak start di produksi: RESEND_API_KEY wajib diset dengan API key yang valid!",
				);
			}
		}
	}
}
