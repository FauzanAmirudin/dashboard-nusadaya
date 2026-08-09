// Whitelist MIME type dan extension yang diizinkan di sistem
// Sesuaikan batas ukuran dengan kebutuhan organisasi

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
	// Dokumen
	"application/pdf": ["pdf"],
	"application/msword": ["doc"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
		"docx",
	],
	"application/vnd.ms-excel": ["xls"],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
		"xlsx",
	],
	// Gambar
	"image/jpeg": ["jpg", "jpeg"],
	"image/png": ["png"],
	"image/webp": ["webp"],
};

// Batas ukuran file dalam bytes
export const SIZE_LIMITS: Record<string, number> = {
	image: 5 * 1024 * 1024, // 5 MB
	document: 20 * 1024 * 1024, // 20 MB
	default: 20 * 1024 * 1024, // 20 MB
};

// Magic bytes untuk validasi konten file (bukan hanya extension)
const PDF_MAGIC = "%PDF";
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

export type MimeCategory = "image" | "document";

/**
 * Tentukan kategori MIME untuk batas ukuran
 */
export function getMimeCategory(mimeType: string): MimeCategory {
	if (mimeType.startsWith("image/")) return "image";
	return "document";
}

/**
 * Cek apakah MIME type dan extension diizinkan
 */
export function isAllowedMimeType(mimeType: string, extension: string): boolean {
	const allowedExts = ALLOWED_MIME_TYPES[mimeType];
	if (!allowedExts) return false;
	return allowedExts.includes(extension.toLowerCase());
}

/**
 * Dapatkan semua extension yang diizinkan (untuk pesan error)
 */
export function getAllowedExtensions(): string[] {
	return Object.values(ALLOWED_MIME_TYPES).flat();
}

/**
 * Validasi magic bytes file untuk PDF dan gambar.
 * Mencegah file berbahaya yang mengganti extension saja.
 */
export function validateMagicBytes(
	buffer: Buffer,
	mimeType: string,
): boolean {
	if (mimeType === "application/pdf") {
		return buffer.slice(0, 4).toString("ascii") === PDF_MAGIC;
	}
	if (mimeType === "image/jpeg") {
		return (
			buffer[0] === JPEG_MAGIC[0] &&
			buffer[1] === JPEG_MAGIC[1] &&
			buffer[2] === JPEG_MAGIC[2]
		);
	}
	if (mimeType === "image/png") {
		return PNG_MAGIC.every((byte, i) => buffer[i] === byte);
	}
	// Untuk tipe lain, skip magic bytes validation (cukup MIME + ext)
	return true;
}
