import { createHash } from "node:crypto";

/**
 * Hitung SHA-256 checksum dari buffer file.
 * Digunakan untuk verifikasi integritas file dan deduplication.
 * Format return: "sha256:<hex>"
 */
export function calculateChecksum(buffer: Buffer): string {
	const hash = createHash("sha256");
	hash.update(buffer);
	return `sha256:${hash.digest("hex")}`;
}
