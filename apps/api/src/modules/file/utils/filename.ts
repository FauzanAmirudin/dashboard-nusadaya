import { monotonicFactory } from "ulidx";

const ulid = monotonicFactory();

/**
 * Generate nama file unik menggunakan ULID + extension.
 * Contoh output: "01KABCD8G3KJ7.pdf"
 *
 * Tidak menggunakan nama asli file sebagai nama fisik untuk:
 * - Menghindari filename collision
 * - Menghindari karakter spesial / spasi
 * - Keamanan (tidak expose nama dokumen via path)
 */
export function generateFilename(extension: string): string {
	const ext = extension.startsWith(".") ? extension.slice(1) : extension;
	return `${ulid()}.${ext.toLowerCase()}`;
}

/**
 * Ekstrak extension dari nama file.
 * Contoh: "ijazah.pdf" → "pdf"
 */
export function getExtension(originalName: string): string {
	const parts = originalName.split(".");
	if (parts.length < 2) return "";
	return parts[parts.length - 1].toLowerCase();
}
