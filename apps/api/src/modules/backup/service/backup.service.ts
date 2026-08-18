import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { isNull } from "drizzle-orm";
import { monotonicFactory } from "ulidx";
import { db } from "../../../db";
import { files, students } from "../../../db/schema";
import { getJobProgress, setJobProgress } from "../../../lib/job";
import { acquireLock, isLocked, releaseLock } from "../../../lib/lock";
import { enqueue } from "../../../lib/queue";
import { fileService } from "../../file/service/file.service";
import type { ManifestFile } from "../manifest/manifest.generator";
import { generateManifest } from "../manifest/manifest.generator";
import type { BackupJobRecord } from "../repository/backup.repository";
import { backupRepository } from "../repository/backup.repository";
import { retentionService } from "./retention.service";

const ulid = monotonicFactory();

export interface BackupFilter {
	studentId?: number; // Backup per mahasiswa (via ID)
	nim?: string; // Backup per mahasiswa (via NIM)
	cohortId?: number; // Backup per angkatan (students.cohort)
	programId?: string; // Backup per program studi (students.program)
	specializationId?: string; // Backup per peminatan (students.sub_program)
	category?: string; // Filter per kategori dokumen
	dateFrom?: Date;
	dateTo?: Date;
}

export interface CreateBackupParams {
	type: string; // "student" | "cohort" | "program" | "specialization" | "full"
	filters: BackupFilter;
	userId: number;
}

/**
 * BackupService — logika utama backup.
 *
 * Prinsip:
 * - Admin request POST /backups → API langsung return jobId (tidak tunggu selesai)
 * - Job di-enqueue ke Redis queue
 * - BackupWorker mengambil job dan mengeksekusi di background
 * - Progress real-time disimpan di Redis (bukan PostgreSQL)
 * - Status final (completed/failed) ditulis ke PostgreSQL setelah selesai
 *
 * Backup menggunakan metadata PostgreSQL untuk menentukan file yang diambil.
 * Backup tidak mengakses filesystem melalui HTTP — langsung via FileService.
 */
export class BackupService {
	private readonly backupBasePath: string;

	constructor() {
		this.backupBasePath =
			process.env.BACKUP_PATH ?? join(process.cwd(), "../../backups");
	}

	/**
	 * Buat backup job baru.
	 * Cek lock → insert DB → enqueue Redis → return jobId.
	 */
	async createBackupJob(
		params: CreateBackupParams,
	): Promise<{ jobId: string; status: string; message?: string }> {
		const { type, filters, userId } = params;
		const lockKey = `backup:${type}:${JSON.stringify(filters)}`;

		// Cek apakah backup dengan filter sama sedang berjalan
		if (await isLocked(lockKey)) {
			return {
				jobId: "",
				status: "rejected",
				message: `Backup ${type} dengan filter yang sama sedang berjalan. Harap tunggu selesai.`,
			};
		}

		const jobId = ulid();

		// Insert ke PostgreSQL dengan status "queued"
		await backupRepository.createJob({
			id: jobId,
			type,
			status: "queued",
			filters: filters as Record<string, unknown>,
			createdBy: userId,
		});

		// Set progress awal di Redis
		await setJobProgress("backup", jobId, {
			status: "queued",
			total: 0,
			processed: 0,
			percentage: 0,
		});

		// Enqueue job ke Redis queue — worker akan mengambil ini
		await enqueue("backup", {
			jobId,
			type: "backup",
			payload: { jobId, backupType: type, filters },
			enqueuedAt: new Date().toISOString(),
		});

		return { jobId, status: "queued" };
	}

	/**
	 * Ambil status backup — merge data PostgreSQL + Redis.
	 *
	 * PostgreSQL: status final, metadata (outputPath, totalFiles, dll.)
	 * Redis: progress real-time (percentage, processed, currentFile)
	 */
	async getBackupStatus(jobId: string): Promise<object | null> {
		const record = await backupRepository.findJobById(jobId);
		if (!record) return null;

		// Ambil progress real-time dari Redis (bukan dari PostgreSQL)
		const progress = await getJobProgress("backup", jobId);

		return {
			jobId: record.id,
			type: record.type,
			status: record.status,
			filters: record.filters,
			outputPath: record.outputPath,
			totalFiles: record.totalFiles,
			processedFiles: progress?.processed ?? record.processedFiles,
			percentage:
				progress?.percentage ?? (record.status === "completed" ? 100 : 0),
			currentFile: progress?.currentFile,
			createdAt: record.createdAt,
			startedAt: record.startedAt,
			completedAt: record.completedAt,
			errorMessage: record.errorMessage ?? progress?.errorMessage,
		};
	}

	async listJobs(): Promise<BackupJobRecord[]> {
		return backupRepository.listJobs();
	}

	/**
	 * Eksekusi backup — dipanggil oleh BackupWorker (bukan dari route langsung).
	 * Tidak melalui HTTP. Worker mengakses FileService secara langsung.
	 */
	async executeBackup(
		jobId: string,
		backupType: string,
		filters: BackupFilter,
	): Promise<void> {
		const lockKey = `backup:${backupType}:${JSON.stringify(filters)}`;

		// Acquire lock — cegah duplikasi
		const locked = await acquireLock(lockKey, 60 * 60 * 2); // 2 jam TTL
		if (!locked) {
			await backupRepository.markFailed(
				jobId,
				"Backup lain dengan filter sama sedang berjalan",
			);
			return;
		}

		try {
			// Update status ke "processing"
			await backupRepository.markProcessing(jobId);
			await setJobProgress("backup", jobId, {
				status: "processing",
				startedAt: new Date().toISOString(),
			});

			// 1. Tentukan student IDs berdasarkan filter (serta peta id->nim untuk penamaan folder)
			const { studentIds, studentNimMap } =
				await this.resolveStudentIds(filters);

			// 2. Ambil semua file metadata dari PostgreSQL
			const fileRecords = await db.query.files
				.findMany({
					where: isNull(files.deletedAt),
				})
				.then((rows) =>
					rows.filter((r) => {
						if (r.studentId === null) return false;
						if (!studentIds.includes(r.studentId)) return false;
						if (filters.category && r.category !== filters.category)
							return false;
						return true;
					}),
				);

			const totalFiles = fileRecords.length;

			// Update total di Redis
			await setJobProgress("backup", jobId, {
				total: totalFiles,
				processed: 0,
				percentage: totalFiles === 0 ? 100 : 0,
			});

			// 3. Tentukan direktori output backup
			// Untuk backup type "student", gunakan NIM sebagai nama folder
			const nim =
				filters.nim ??
				(filters.studentId
					? (studentNimMap.get(filters.studentId) ?? String(filters.studentId))
					: undefined);
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const outputDir = join(
				this.backupBasePath,
				this.resolveOutputSubdir(backupType, filters, nim),
				`${timestamp}-${jobId.slice(-8)}`,
			);
			await mkdir(outputDir, { recursive: true });

			// 4. Copy file satu per satu
			let processed = 0;
			let totalSize = 0;
			const manifestFiles: ManifestFile[] = [];

			if (totalFiles > 0) {
				for (const fileRecord of fileRecords) {
					// Ganti students/{id}/... menjadi students/{nim}/... di dalam backup
					// sehingga admin mudah membaca isi folder ZIP
					let relDestPath = fileRecord.storagePath;
					if (fileRecord.studentId !== null) {
						const nim = studentNimMap.get(fileRecord.studentId);
						if (nim) {
							relDestPath = relDestPath.replace(
								`students/${fileRecord.studentId}/`,
								`students/${nim}/`,
							);
						}
					}

					try {
						await fileService.copyFileToBackup(
							fileRecord.id,
							outputDir,
							relDestPath,
						);
						totalSize += fileRecord.size;
						manifestFiles.push({
							path: relDestPath,
							originalName: fileRecord.originalName,
							size: fileRecord.size,
							checksum: fileRecord.checksum,
						});
					} catch {
						// File mungkin sudah dihapus — skip tapi catat
						console.warn(
							`[Backup] Skip file ${fileRecord.id}: file tidak ditemukan di storage`,
						);
					}

					processed++;

					// Update Redis setiap 10 file atau saat selesai (bukan tiap file — kurangi beban Redis)
					if (processed % 10 === 0 || processed === totalFiles) {
						await setJobProgress("backup", jobId, {
							processed,
							currentFile: fileRecord.originalName,
						});
					}
				}
			}

			// 5. Generate manifest.json
			await generateManifest(outputDir, {
				backup_id: jobId,
				type: backupType,
				created_at: new Date().toISOString(),
				filters: filters as Record<string, unknown>,
				total_students: studentIds.length,
				total_files: manifestFiles.length,
				total_size: totalSize,
				files: manifestFiles,
			});

			// 6. Update PostgreSQL — status final
			await backupRepository.markCompleted(
				jobId,
				outputDir,
				totalFiles,
				totalSize,
				processed,
			);

			// 7. Jalankan Retention Policy (pembersihan backup lama)
			await retentionService.runRetentionCleanup(this.backupBasePath);

			await setJobProgress("backup", jobId, {
				status: "completed",
				total: totalFiles,
				processed,
				percentage: 100,
				completedAt: new Date().toISOString(),
			});
		} catch (err) {
			const error = err as Error;
			await backupRepository.markFailed(jobId, error.message);
			await setJobProgress("backup", jobId, {
				status: "failed",
				errorMessage: error.message,
			});
			throw err;
		} finally {
			// Selalu release lock, sukses atau gagal
			await releaseLock(lockKey);
		}
	}

	/**
	 * Resolve student IDs berdasarkan filter dinamis.
	 * PostgreSQL sebagai source of truth relasi akademik.
	 */
	private async resolveStudentIds(
		filters: BackupFilter,
	): Promise<{ studentIds: number[]; studentNimMap: Map<number, string> }> {
		const nimMap = new Map<number, string>();

		if (filters.studentId) {
			// Ambil NIM untuk satu mahasiswa saja (via ID)
			const student = await db.query.students.findFirst({
				where: (s, { eq }) => eq(s.id, filters.studentId!),
				columns: { id: true, nim: true },
			});
			if (student?.nim) nimMap.set(student.id, student.nim);
			return { studentIds: [filters.studentId], studentNimMap: nimMap };
		}

		if (filters.nim) {
			// Ambil data untuk satu mahasiswa saja (via NIM)
			const student = await db.query.students.findFirst({
				where: (s, { eq }) => eq(s.nim, filters.nim!),
				columns: { id: true, nim: true },
			});
			if (!student)
				throw new Error(`Mahasiswa dengan NIM ${filters.nim} tidak ditemukan`);
			nimMap.set(student.id, student.nim!);
			return { studentIds: [student.id], studentNimMap: nimMap };
		}

		const allStudents = await db.query.students.findMany({
			columns: {
				id: true,
				nim: true,
				cohort: true,
				program: true,
				subProgram: true,
			},
		});

		const filtered = allStudents.filter((s) => {
			if (filters.cohortId && s.cohort !== filters.cohortId) return false;
			if (filters.programId && s.program !== filters.programId) return false;
			if (filters.specializationId && s.subProgram !== filters.specializationId)
				return false;
			return true;
		});

		for (const s of filtered) {
			if (s.nim) nimMap.set(s.id, s.nim);
		}

		return { studentIds: filtered.map((s) => s.id), studentNimMap: nimMap };
	}

	/**
	 * Tentukan subdirektori output berdasarkan tipe backup.
	 */
	private resolveOutputSubdir(
		backupType: string,
		filters: BackupFilter,
		nim?: string,
	): string {
		switch (backupType) {
			case "student":
				// Gunakan NIM sebagai nama folder, fallback ke ID jika NIM tidak ada
				return join("students", nim ?? String(filters.studentId ?? "unknown"));
			case "cohort":
				return join("cohorts", String(filters.cohortId ?? "unknown"));
			case "program":
				return join("programs", filters.programId ?? "unknown");
			case "specialization":
				return join("specializations", filters.specializationId ?? "unknown");
			case "full":
				return "full";
			default:
				return "administrative";
		}
	}
}

export const backupService = new BackupService();
