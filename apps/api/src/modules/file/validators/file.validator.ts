import {
	SIZE_LIMITS,
	getAllowedExtensions,
	getMimeCategory,
	isAllowedMimeType,
	validateMagicBytes,
} from "../utils/mime";

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validasi file sebelum disimpan ke storage.
 * Urutan: extension → MIME type → MIME+ext match → size → magic bytes
 */
export function validateFile(
	buffer: Buffer,
	originalName: string,
	mimeType: string,
	size: number,
): ValidationResult {
	// 1. Cek extension
	const parts = originalName.split(".");
	if (parts.length < 2) {
		return { valid: false, error: "File tidak memiliki extension" };
	}
	const extension = parts[parts.length - 1].toLowerCase();
	const allowedExts = getAllowedExtensions();
	if (!allowedExts.includes(extension)) {
		return {
			valid: false,
			error: `Extension .${extension} tidak diizinkan. Diizinkan: ${allowedExts.join(", ")}`,
		};
	}

	// 2. Cek MIME type + extension match
	if (!isAllowedMimeType(mimeType, extension)) {
		return {
			valid: false,
			error: `MIME type ${mimeType} tidak sesuai dengan extension .${extension}`,
		};
	}

	// 3. Cek ukuran file
	const category = getMimeCategory(mimeType);
	const limit = SIZE_LIMITS[category] ?? SIZE_LIMITS.default;
	if (size > limit) {
		const limitMB = Math.round(limit / 1024 / 1024);
		const sizeMB = (size / 1024 / 1024).toFixed(2);
		return {
			valid: false,
			error: `Ukuran file ${sizeMB} MB melebihi batas ${limitMB} MB untuk ${category}`,
		};
	}

	// 4. Validasi magic bytes (hanya PDF dan gambar)
	if (!validateMagicBytes(buffer, mimeType)) {
		return {
			valid: false,
			error:
				"Konten file tidak valid. Pastikan file tidak corrupt atau disembunyikan sebagai format lain.",
		};
	}

	return { valid: true };
}
