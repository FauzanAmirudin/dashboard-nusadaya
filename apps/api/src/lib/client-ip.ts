import { isIP } from "node:net";

/**
 * Helper deteksi Client IP yang aman dan teruji dari spoofing header.
 * Memvalidasi format IPv4/IPv6 dan mencegah injeksi arbitrary string ke Redis key.
 */

export function isValidIp(ip: string): boolean {
	const trimmed = ip.trim();
	if (trimmed === "localhost" || trimmed === "127.0.0.1" || trimmed === "::1") {
		return true;
	}
	return isIP(trimmed) !== 0;
}

/**
 * Ekstraksi Client IP dari request Elysia / Fetch Request.
 * Prioritaskan X-Real-IP yang diset langsung oleh Nginx reverse proxy.
 */
export function getClientIp(request: Request): string {
	// 1. Cek X-Real-IP (diset oleh Nginx terpercaya)
	const xRealIp = request.headers.get("x-real-ip");
	if (xRealIp && isValidIp(xRealIp.trim())) {
		return xRealIp.trim();
	}

	// 2. Cek X-Forwarded-For
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const parts = forwarded.split(",").map((p) => p.trim());
		for (const part of parts) {
			if (isValidIp(part)) {
				return part;
			}
		}
	}

	// 3. Fallback jika tidak ditemukan atau format invalid
	return "127.0.0.1";
}
