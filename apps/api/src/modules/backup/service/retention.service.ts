import { readdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { backupRepository } from "../repository/backup.repository";

interface RetentionConfig {
	maxKeep: number;
}

const RETENTION_RULES: Record<string, RetentionConfig> = {
	full: { maxKeep: 7 },
	student: { maxKeep: 7 },
	cohort: { maxKeep: 4 },
	program: { maxKeep: 4 },
	specialization: { maxKeep: 4 },
};

/**
 * RetentionService — menangani penghapusan otomatis folder backup lama.
 */
export class RetentionService {
	/**
	 * Fungsi utama yang dipanggil setelah backup harian selesai atau saat server menyala.
	 * Menelusuri seluruh subdirektori di backups/ dan membersihkannya.
	 */
	async runRetentionCleanup(backupBasePath: string): Promise<void> {
		console.log(`[RetentionService] Memulai rotasi backup di: ${backupBasePath}`);

		try {
			// 1. Bersihkan backups/full/
			await this.cleanupBackupGroup(join(backupBasePath, "full"), RETENTION_RULES.full.maxKeep);

			// 2. Bersihkan backups/students/*/
			await this.cleanupGroupOfGroups(join(backupBasePath, "students"), RETENTION_RULES.student.maxKeep);

			// 3. Bersihkan backups/cohorts/*/
			await this.cleanupGroupOfGroups(join(backupBasePath, "cohorts"), RETENTION_RULES.cohort.maxKeep);

			// 4. Bersihkan backups/programs/*/
			await this.cleanupGroupOfGroups(join(backupBasePath, "programs"), RETENTION_RULES.program.maxKeep);

			// 5. Bersihkan backups/specializations/*/
			await this.cleanupGroupOfGroups(join(backupBasePath, "specializations"), RETENTION_RULES.specialization.maxKeep);

			console.log("[RetentionService] Rotasi backup selesai ✅");
		} catch (error) {
			console.error("[RetentionService] Gagal menjalankan rotasi backup:", error);
			// Kita hanya me-log error agar tidak mengganggu proses backup utama
		}
	}

	/**
	 * Membersihkan grup dari grup (misal: backups/students/42/, backups/students/43/)
	 */
	private async cleanupGroupOfGroups(baseDir: string, maxKeep: number): Promise<void> {
		try {
			const subdirs = await readdir(baseDir, { withFileTypes: true });
			for (const dirent of subdirs) {
				if (dirent.isDirectory()) {
					const groupDir = join(baseDir, dirent.name);
					await this.cleanupBackupGroup(groupDir, maxKeep);
				}
			}
		} catch (error) {
			// Folder mungkin belum ada (ENOENT), abaikan
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				console.error(`[RetentionService] Gagal membaca direktori ${baseDir}:`, error);
			}
		}
	}

	/**
	 * Membersihkan satu grup folder backup (misal: backups/full/)
	 */
	private async cleanupBackupGroup(groupDir: string, maxKeep: number): Promise<void> {
		try {
			const entries = await readdir(groupDir, { withFileTypes: true });
			
			// Kumpulkan hanya folder yang memiliki timestamp/valid format
			const backupFolders = [];

			for (const dirent of entries) {
				if (dirent.isDirectory()) {
					const folderPath = join(groupDir, dirent.name);
					const isValid = await this.validateManifest(folderPath);
					if (isValid) {
						backupFolders.push({
							name: dirent.name,
							path: folderPath,
						});
					}
				}
			}

			// Urutkan dari yang paling baru ke yang paling lama berdasarkan nama (ISO timestamp)
			// Contoh nama: 2026-08-09T00-00-00-000Z-01J4R5TGX8
			backupFolders.sort((a, b) => b.name.localeCompare(a.name));

			// Jika jumlah folder valid melebihi batas maxKeep, hapus sisanya
			if (backupFolders.length > maxKeep) {
				const foldersToDelete = backupFolders.slice(maxKeep);
				
				for (const folder of foldersToDelete) {
					console.log(`[RetentionService] Menghapus backup lama: ${folder.path}`);
					
					// Hapus dari database terlebih dahulu (silang validasi)
					// Pastikan path yang dicari cocok dengan pola path di DB
					// Path di DB biasanya absolute atau menyesuaikan struktur, 
					// jadi kita gunakan pencarian dengan LIKE atau mencocokkan id dari nama folder (8 digit terakhir).
					
					// Ambil jobId dari 8 karakter terakhir nama folder
					const jobIdSuffix = folder.name.split("-").pop();
					if (jobIdSuffix) {
						await backupRepository.deleteJobsBySuffix(jobIdSuffix);
					}

					// Hapus folder fisik secara rekursif
					await rm(folder.path, { recursive: true, force: true });
				}
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				console.error(`[RetentionService] Gagal membersihkan ${groupDir}:`, error);
			}
		}
	}

	/**
	 * Memeriksa apakah folder backup memiliki manifest.json yang valid
	 */
	private async validateManifest(folderPath: string): Promise<boolean> {
		try {
			const manifestPath = join(folderPath, "manifest.json");
			const content = await readFile(manifestPath, "utf-8");
			const manifest = JSON.parse(content);
			
			// Syarat minimal: bisa diparse JSON dan punya backup_id
			if (manifest && manifest.backup_id) {
				return true;
			}
			return false;
		} catch {
			// File tidak ada atau bukan JSON valid
			return false;
		}
	}
}

export const retentionService = new RetentionService();
