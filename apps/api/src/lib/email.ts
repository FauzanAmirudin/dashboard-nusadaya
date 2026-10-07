import { Resend } from "resend";
import { normalizeEmail } from "./normalize";
import { recordEmailSent } from "./otp";

const isProduction = process.env.NODE_ENV === "production";
const resendApiKey = process.env.RESEND_API_KEY;

if (isProduction) {
	if (!resendApiKey || resendApiKey.startsWith("re_your_")) {
		throw new Error(
			"[SECURITY CRITICAL] RESEND_API_KEY wajib diisi dengan API Key valid pada environment production!",
		);
	}
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;
const defaultSender =
	process.env.EMAIL_FROM || "Nusadaya OneData <noreply@onedata-nusadaya.com>";

export interface SendOtpEmailParams {
	userId: number;
	to: string;
	name: string;
	otpCode: string;
	expiresInMinutes?: number;
	requestIp?: string;
	userAgent?: string;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Mengirim email kode verifikasi OTP login dengan template resmi
 */
export async function sendOtpEmail({
	userId,
	to,
	name,
	otpCode,
	expiresInMinutes = 5,
	requestIp,
	userAgent,
}: SendOtpEmailParams): Promise<{
	success: boolean;
	id?: string;
	error?: string;
}> {
	const cleanRecipient = normalizeEmail(to);
	if (!cleanRecipient) {
		return { success: false, error: "Alamat email penerima tidak valid" };
	}

	// Fallback dev jika API Key belum diset
	if (!resend) {
		if (isProduction) {
			return {
				success: false,
				error: "Layanan email belum dikonfigurasi di server.",
			};
		}
		console.warn(`[DEV ONLY] Email mock ke ${cleanRecipient}: OTP=${otpCode}`);
		return { success: true, id: "mock-resend-dev-id" };
	}

	const currentTime = new Date().toLocaleString("id-ID", {
		timeZone: "Asia/Jakarta",
		dateStyle: "medium",
		timeStyle: "short",
	});

	const plainText = `Halo ${name},

Kode verifikasi (OTP) untuk masuk ke akun Nusadaya OneData Anda adalah:

${otpCode}

Kode ini berlaku selama ${expiresInMinutes} menit.
Permintaan masuk tercatat pada ${currentTime} WIB${requestIp ? ` dari IP ${requestIp}` : ""}.

PENTING: Jangan berikan kode ini kepada siapa pun, termasuk pihak Nusadaya.
Jika Anda tidak merasa melakukan percobaan masuk, segera hubungi Administrator untuk mengamankan akun Anda.

© ${new Date().getFullYear()} Nusadaya Academy`;

	const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi Masuk</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 520px; margin: 32px auto; padding: 32px 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #0517B0; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">NUSADAYA ONEDATA</h1>
      <p style="color: #64748b; font-size: 13px; margin-top: 4px; margin-bottom: 0;">Sistem Informasi & Manajemen Akademik Terpadu</p>
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
      <p style="font-size: 15px; margin-top: 0; color: #334155;">Halo, <strong>${escapeHtml(name)}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
        Kami menerima permintaan masuk ke akun Anda. Gunakan kode verifikasi (OTP) berikut untuk melanjutkan:
      </p>

      <div style="background-color: #f0f4ff; border: 2px dashed #0517B0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0517B0; font-family: 'Courier New', Courier, monospace; display: inline-block; padding-left: 10px;">${otpCode}</span>
      </div>

      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">
          ⏰ Berlaku selama <strong>${expiresInMinutes} menit</strong>.<br>
          🔒 <strong>Peringatan Keamanan:</strong> Jangan pernah membagikan kode ini kepada siapa pun.
        </p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #64748b; margin-bottom: 20px;">
        <span style="display: block; margin-bottom: 4px;"><strong>Rincian Permintaan:</strong></span>
        <span>Waktu: ${currentTime} WIB</span><br>
        ${requestIp ? `<span>Alamat IP: ${escapeHtml(requestIp)}</span><br>` : ""}
        ${userAgent ? `<span>Perangkat: ${escapeHtml(userAgent.slice(0, 80))}...</span>` : ""}
      </div>

      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">
        Jika Anda tidak merasa mencoba login, abaikan pesan ini atau segera hubungi Administrator untuk mengamankan akun Anda.
      </p>
    </div>

    <div style="margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Nusadaya Academy. Seluruh hak cipta dilindungi.</p>
    </div>
  </div>
</body>
</html>
`;

	try {
		// Kirim email dengan timeout pengaman 8 detik
		const sendPromise = resend.emails.send({
			from: defaultSender,
			to: [cleanRecipient],
			// PENTING: Subjek netral tanpa kode OTP agar tidak terbaca di lockscreen notification
			subject: "Kode Verifikasi Masuk — Nusadaya OneData",
			text: plainText,
			html: htmlContent,
		});

		const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
			setTimeout(() => reject(new Error("Timeout pengiriman email")), 8000),
		);

		const result = (await Promise.race([sendPromise, timeoutPromise])) as any;

		if (result.error) {
			console.error("[Resend Error]:", result.error);
			// Jangan bocorkan detail internal error ke user
			return {
				success: false,
				error: "Gagal mengirim email verifikasi. Coba beberapa saat lagi.",
			};
		}

		// Catat kuota anggaran email
		await recordEmailSent(userId);

		return { success: true, id: result.data?.id };
	} catch (err: any) {
		console.error("[Email Exception]:", err);
		return {
			success: false,
			error: "Layanan pengiriman email sedang sibuk. Silakan coba lagi.",
		};
	}
}

export interface SendEmailChangeAlertParams {
	to: string;
	name: string;
	newEmail: string;
	requestIp?: string;
	userAgent?: string;
}

/**
 * Kirim email notifikasi ke alamat email lama saat email akun diperbarui (T7.3)
 */
export async function sendEmailChangeAlert({
	to,
	name,
	newEmail,
	requestIp,
	userAgent,
}: SendEmailChangeAlertParams): Promise<{
	success: boolean;
	id?: string;
	error?: string;
}> {
	const cleanRecipient = normalizeEmail(to);
	if (!cleanRecipient) {
		return { success: false, error: "Alamat email penerima tidak valid" };
	}

	if (!resend) {
		if (isProduction) {
			return {
				success: false,
				error: "Layanan email belum dikonfigurasi di server.",
			};
		}
		console.warn(
			`[DEV ONLY] Email change alert ke ${cleanRecipient}: newEmail=${newEmail}`,
		);
		return { success: true, id: "mock-resend-dev-id" };
	}

	const currentTime = new Date().toLocaleString("id-ID", {
		timeZone: "Asia/Jakarta",
		dateStyle: "medium",
		timeStyle: "short",
	});

	const plainText = `Halo ${name},

Pemberitahuan Keamanan: Alamat email untuk akun Nusadaya OneData Anda telah diperbarui menjadi: ${newEmail}.

Perubahan ini dilakukan pada ${currentTime} WIB${requestIp ? ` dari IP ${requestIp}` : ""}.

PENTING: Jika Anda tidak melakukan perubahan ini, akun Anda mungkin dalam bahaya. Segera hubungi Administrator Sistem Nusadaya untuk memulihkan akses Anda.

© ${new Date().getFullYear()} Nusadaya Academy`;

	const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Pemberitahuan Perubahan Email Akun</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <div style="max-width: 520px; margin: 32px auto; padding: 32px 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #0517B0; margin: 0; font-size: 20px; font-weight: 800;">NUSADAYA ONEDATA</h1>
      <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Pemberitahuan Keamanan Akun</p>
    </div>
    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
      <p style="font-size: 15px; color: #334155;">Halo, <strong>${escapeHtml(name)}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Alamat email yang terhubung dengan akun Nusadaya OneData Anda baru saja diubah menjadi:
      </p>
      <div style="background-color: #f1f5f9; border-left: 4px solid #0517B0; padding: 12px 16px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #0f172a; margin: 16px 0;">
        ${escapeHtml(newEmail)}
      </div>
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
          ⚠️ <strong>Bukan Anda yang melakukan perubahan ini?</strong><br>
          Segera hubungi tim Administrator Sistem untuk mengamankan dan memulihkan akses akun Anda.
        </p>
      </div>
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #64748b;">
        <span>Waktu: ${currentTime} WIB</span><br>
        ${requestIp ? `<span>Alamat IP: ${escapeHtml(requestIp)}</span><br>` : ""}
        ${userAgent ? `<span>Perangkat: ${escapeHtml(userAgent.slice(0, 80))}...</span>` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;

	try {
		const sendPromise = resend.emails.send({
			from: defaultSender,
			to: [cleanRecipient],
			subject:
				"Keamanan Akun: Alamat Email Telah Diperbarui — Nusadaya OneData",
			text: plainText,
			html: htmlContent,
		});

		const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
			setTimeout(() => reject(new Error("Timeout pengiriman email")), 8000),
		);

		const result = (await Promise.race([sendPromise, timeoutPromise])) as any;
		return { success: !result.error, id: result.data?.id };
	} catch (err: any) {
		console.error("[Email Change Alert Error]:", err);
		return {
			success: false,
			error: "Gagal mengirim email notifikasi perubahan email.",
		};
	}
}
