import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface ManifestFile {
	path: string; // path relatif dalam backup
	originalName: string;
	size: number;
	checksum: string | null;
}

export interface ManifestData {
	backup_id: string;
	type: string;
	created_at: string;
	filters: Record<string, unknown>;
	total_students: number;
	total_files: number;
	total_size: number;
	files: ManifestFile[];
}

/**
 * Generate manifest.json untuk setiap backup.
 *
 * Manifest berisi informasi lengkap tentang isi backup:
 * - ID backup, tipe, timestamp, filter yang digunakan
 * - Daftar semua file dengan checksum (untuk verifikasi integritas)
 *
 * Manifest digunakan untuk:
 * - Verifikasi integritas backup
 * - Panduan restore manual
 * - Audit trail
 * - Mendeteksi file korup
 */
export async function generateManifest(
	outputDir: string,
	data: ManifestData,
): Promise<void> {
	const manifestPath = join(outputDir, "manifest.json");
	await writeFile(manifestPath, JSON.stringify(data, null, 2), "utf-8");
}
