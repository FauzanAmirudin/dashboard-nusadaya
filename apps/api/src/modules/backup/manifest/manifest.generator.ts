import { writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface ManifestFile {
	path: string; // path relatif dalam backup (selalu pakai '/' agar portable Windows/Linux)
	originalName: string;
	size: number;
	checksum: string | null;
	studentId?: number | null;
	nim?: string | null;
	studentName?: string | null;
	panel?: string | null;
	tabFolder?: string | null;
	documentKey?: string | null;
}

export interface ManifestSkippedFile {
	id: string;
	originalName: string;
	studentId?: number | null;
	panel?: string | null;
	documentKey?: string | null;
	reason: string;
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
	skipped_files?: ManifestSkippedFile[];
}

/**
 * Generate manifest.json untuk setiap backup.
 *
 * Manifest berisi informasi lengkap tentang isi backup:
 * - ID backup, tipe, timestamp, filter yang digunakan
 * - Daftar semua file dengan checksum (untuk verifikasi integritas) & identitas mahasiswa/panel/tab
 */
export async function generateManifest(
	outputDir: string,
	data: ManifestData,
): Promise<void> {
	const manifestPath = join(outputDir, "manifest.json");
	await writeFile(manifestPath, JSON.stringify(data, null, 2), "utf-8");
}
