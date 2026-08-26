import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { monotonicFactory } from "ulidx";
import { db } from "../../../db";
import { students, users } from "../../../db/schema";
import { LocalStorageProvider } from "../providers/local.provider";
import type { StorageProvider } from "../providers/storage.interface";
import type { FileRecord } from "../repository/file.repository";
import { fileRepository } from "../repository/file.repository";
import { calculateChecksum } from "../utils/checksum";
import { generateFilename, getExtension } from "../utils/filename";
import { validateFile } from "../validators/file.validator";

const ulid = monotonicFactory();

export interface UploadFileParams {
	file: File; // File object dari Elysia multipart
	studentId?: number;
	category: string; // "identity" | "academic" | "profile" | "finance" | "internship" | "thesis" | "certificates" | "achievement" | "other"
	panel?: string; // "pmb" | "finance" | "akademik" | dll.
	documentKey?: string;
	uploadedBy?: number;
	visibility?: "private" | "public";
}

export interface UploadFileResult {
	id: string;
	storagePath: string;
	originalName: string;
	size: number;
	mimeType: string;
	checksum: string;
}

/**
 * FileService — SATU-SATUNYA pintu akses ke filesystem di seluruh sistem.
 *
 * Prinsip wajib:
 * - Tidak ada module bisnis (mahasiswa, finance, magang, dosen) yang boleh akses
 *   filesystem langsung (fs.writeFile, Bun.write, Bun.file di luar sini).
 * - Semua operasi file (upload, download, delete) melalui class ini.
 * - Provider dapat diganti (Local → S3) tanpa mengubah kode bisnis.
 *
 * Alur upload:
 * 1. Terima File dari Elysia
 * 2. Baca ke Buffer
 * 3. Validasi (extension, MIME, size, magic bytes)
 * 4. Simpan ke temporary storage
 * 5. Hitung checksum SHA-256
 * 6. Generate filename ULID
 * 7. Pindah ke permanent storage
 * 8. Insert metadata ke PostgreSQL
 * 9. Return metadata
 */
export class FileService {
	private readonly provider: StorageProvider;
	private readonly tempBase: string;

	constructor(provider?: StorageProvider) {
		this.provider = provider ?? new LocalStorageProvider();
		this.tempBase = "temporary/uploads";
	}

	/**
	 * Upload file — validasi → temp storage → checksum → permanent storage → DB.
	 */
	async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
		const {
			file,
			studentId,
			category,
			panel,
			documentKey,
			uploadedBy,
			visibility = "private",
		} = params;

		// 1. Baca file ke buffer
		const buffer = Buffer.from(await file.arrayBuffer());
		const originalName = file.name;
		const mimeType = file.type || "application/octet-stream";
		const size = buffer.length;

		// 2. Validasi file
		const validation = validateFile(buffer, originalName, mimeType, size);
		if (!validation.valid) {
			throw new Error(validation.error ?? "File tidak valid");
		}

		// 3. Generate nama & ID
		const extension = getExtension(originalName);
		const filename = generateFilename(extension);
		const fileId = ulid();
		const checksum = calculateChecksum(buffer);

		// 4. Tentukan path permanent storage
		//    Format: students/{studentId}/{category}/{filename} atau {category}/{filename}
		const storagePath = studentId
			? `students/${studentId}/${category}/${filename}`
			: `${category}/${filename}`;

		// 5. Simpan dulu ke temporary
		const tempPath = `${this.tempBase}/${filename}`;
		await this.provider.upload({ buffer, storagePath: tempPath, mimeType });

		// 6. Pindahkan ke permanent storage
		await this.provider.move(tempPath, storagePath);

		// Validasi referensi foreign keys secara aman untuk mencegah query failure
		let validUploadedBy: number | null = null;
		if (uploadedBy && typeof uploadedBy === "number") {
			try {
				const userExists = await db.query.users.findFirst({
					where: eq(users.id, uploadedBy),
					columns: { id: true },
				});
				if (userExists) {
					validUploadedBy = userExists.id;
				}
			} catch {}
		}

		let validStudentId: number | null = null;
		if (
			studentId &&
			typeof studentId === "number" &&
			!isNaN(studentId) &&
			studentId > 0
		) {
			try {
				const studentExists = await db.query.students.findFirst({
					where: eq(students.id, studentId),
					columns: { id: true },
				});
				if (studentExists) {
					validStudentId = studentExists.id;
				}
			} catch {}
		}

		// 7. Insert metadata ke PostgreSQL
		await fileRepository.createFile({
			id: fileId,
			studentId: validStudentId,
			category,
			storageDisk: "local",
			storagePath,
			filename,
			originalName,
			extension,
			mimeType,
			size,
			checksum,
			visibility,
			uploadedBy: validUploadedBy,
			panel: panel ?? null,
			documentKey: documentKey ?? null,
		});

		return { id: fileId, storagePath, originalName, size, mimeType, checksum };
	}

	/**
	 * Download file — return Buffer untuk serve ke client.
	 * Untuk streaming besar gunakan streamFile().
	 */
	async downloadFile(
		fileId: string,
	): Promise<{ buffer: Buffer; record: FileRecord }> {
		const record = await fileRepository.findFileById(fileId);
		if (!record) throw new Error("File tidak ditemukan");

		const buffer = await this.provider.download(record.storagePath);
		return { buffer, record };
	}

	/**
	 * Stream file — return ReadableStream untuk response streaming.
	 * Gunakan ini untuk download file besar (PDF, video, ZIP).
	 * Tidak load seluruh file ke RAM.
	 */
	async streamFile(
		fileId: string,
	): Promise<{ stream: ReadableStream; record: FileRecord }> {
		const record = await fileRepository.findFileById(fileId);
		if (!record) throw new Error("File tidak ditemukan");

		const stream = await this.provider.stream(record.storagePath);
		return { stream, record };
	}

	/**
	 * Hapus file — hapus fisik dari storage + soft delete di DB.
	 */
	async deleteFile(fileId: string): Promise<void> {
		const record = await fileRepository.findFileById(fileId);
		if (!record) throw new Error("File tidak ditemukan");

		// Hapus fisik dari storage (idempotent — tidak error jika file tidak ada)
		await this.provider.delete(record.storagePath);

		// Soft delete di DB (untuk audit trail)
		await fileRepository.softDeleteFile(fileId);
	}

	/**
	 * Ambil metadata file dari DB.
	 */
	async getFileMetadata(fileId: string): Promise<FileRecord | undefined> {
		return fileRepository.findFileById(fileId);
	}

	/**
	 * Dapatkan path absolut file.
	 */
	getAbsolutePath(storagePath: string): string {
		return this.provider.getAbsolutePath(storagePath);
	}

	/**
	 * Daftar file mahasiswa, opsional filter per kategori.
	 */
	async listStudentFiles(
		studentId: number,
		category?: string,
	): Promise<FileRecord[]> {
		return fileRepository.findFilesByStudentId(studentId, category);
	}

	/**
	 * Cari file berdasarkan panel + documentKey (backward compat).
	 */
	async findByPanelKey(
		studentId: number,
		panel: string,
		documentKey: string,
	): Promise<FileRecord | undefined> {
		return fileRepository.findFileByPanelKey(studentId, panel, documentKey);
	}

	/**
	 * Copy file fisik ke direktori backup.
	 * Dipanggil oleh BackupWorker — tidak melalui HTTP.
	 */
	async copyFileToBackup(
		fileId: string,
		backupBasePath: string,
		relativeDestPath: string,
	): Promise<void> {
		const record = await fileRepository.findFileById(fileId);
		if (!record) throw new Error(`File ${fileId} tidak ditemukan untuk backup`);

		const buffer = await this.provider.download(record.storagePath);
		const backupPath = join(backupBasePath, relativeDestPath);
		const dir = require("node:path").dirname(backupPath);

		// Pastikan direktori backup ada (support Windows & Unix path)
		await mkdir(dir, { recursive: true });

		await Bun.write(backupPath, buffer);
	}

	/**
	 * Inisialisasi direktori storage yang diperlukan saat startup.
	 * Dipanggil sekali di index.ts.
	 */
	async ensureDirectories(): Promise<void> {
		const storagePath =
			process.env.STORAGE_PATH ?? join(process.cwd(), "../../storage");
		const backupPath =
			process.env.BACKUP_PATH ?? join(process.cwd(), "../../backups");

		const dirs = [
			// Storage
			join(storagePath, "students"),
			join(storagePath, "lecturers"),
			join(storagePath, "finance"),
			join(storagePath, "internship"),
			join(storagePath, "vocational"),
			join(storagePath, "system"),
			join(storagePath, "temporary", "uploads"),
			join(storagePath, "temporary", "processing"),
			join(storagePath, "temporary", "failed"),
			join(storagePath, "exports"),
			// Backup
			join(backupPath, "database"),
			join(backupPath, "students"),
			join(backupPath, "cohorts"),
			join(backupPath, "programs"),
			join(backupPath, "specializations"),
			join(backupPath, "administrative"),
			join(backupPath, "full"),
		];

		for (const dir of dirs) {
			await mkdir(dir, { recursive: true });
		}

		console.log(`✅ Storage directories ready at ${storagePath}`);
	}
}

// Singleton instance yang digunakan di seluruh aplikasi
export const fileService = new FileService();
