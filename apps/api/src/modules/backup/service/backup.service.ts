import { mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { monotonicFactory } from "ulidx";
import { db } from "../../../db";
import {
	academicDocuments,
	backupJobs,
	courseGradeDocuments,
	crmDocuments,
	departureAssessments,
	feeDisbursementLogs,
	feeShareRecipients,
	files,
	finalDecision,
	financeData,
	financeDocuments,
	financeSemesterInstallments,
	financeSemesters,
	financeTalanganInstallments,
	internshipDocuments,
	paDocuments,
	pmbDocuments,
	postInternshipDocs,
	students,
} from "../../../db/schema";
import { getJobProgress, setJobProgress } from "../../../lib/job";
import { acquireLock, isLocked, releaseLock } from "../../../lib/lock";
import {
	resolveBackupPath,
	resolveLegacyUploadsPath,
	resolveStoragePath,
} from "../../../lib/paths";
import { enqueue } from "../../../lib/queue";
import { fileService } from "../../file/service/file.service";
import { calculateChecksum } from "../../file/utils/checksum";
import type {
	ManifestFile,
	ManifestSkippedFile,
} from "../manifest/manifest.generator";
import { generateManifest } from "../manifest/manifest.generator";
import type { BackupJobRecord } from "../repository/backup.repository";
import { backupRepository } from "../repository/backup.repository";
import {
	buildClearBackupFilename,
	formatStudentFolderName,
	resolvePanelAndTabSubdir,
	sanitizeSegment,
} from "../utils/backup-naming";
import { retentionService } from "./retention.service";

const ulid = monotonicFactory();

export interface BackupFilter {
	studentId?: number; // Backup per mahasiswa (via ID)
	nim?: string; // Backup per mahasiswa (via NIM)
	cohortId?: number; // Backup per angkatan (students.cohort)
	programId?: string; // Backup per program studi (students.program)
	specializationId?: string; // Backup per peminatan (students.sub_program)
	category?: string; // Filter per kategori dokumen
	panel?: string; // Filter per panel (pmb, crm, finance, akademik, pa, magang, post-internship, kehadiran)
	dateFrom?: Date;
	dateTo?: Date;
}

export interface CreateBackupParams {
	type: string; // "student" | "cohort" | "program" | "specialization" | "full"
	filters: BackupFilter;
	userId: number;
}

interface StudentMeta {
	id: number;
	nim: string | null;
	name: string;
	folderName: string;
}

interface CollectedBackupItem {
	studentId: number | null;
	fileRecord?: typeof files.$inferSelect;
	legacyFile?: {
		id: string;
		absPath: string;
		originalName: string;
		panel: string;
		documentKey: string;
		createdAt?: Date | null;
	};
	panelOverride?: string | null;
	documentKeyOverride?: string | null;
}

function extractFileIdFromUrl(url?: string | null): string | null {
	if (!url || typeof url !== "string") return null;
	const m = url.match(/\/files\/([A-Za-z0-9]+)\/download/);
	if (m?.[1]) return m[1];
	const m2 = url.match(/\/download\/([A-Za-z0-9]+)/);
	if (m2?.[1]) return m2[1];
	return null;
}

async function getDirectorySizeAndCount(
	dirPath: string,
): Promise<{ totalBytes: number; fileCount: number }> {
	let totalBytes = 0;
	let fileCount = 0;
	try {
		const entries = await readdir(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name);
			if (entry.isDirectory()) {
				const sub = await getDirectorySizeAndCount(fullPath);
				totalBytes += sub.totalBytes;
				fileCount += sub.fileCount;
			} else if (entry.isFile()) {
				const st = await stat(fullPath);
				totalBytes += st.size;
				fileCount += 1;
			}
		}
	} catch {
		// Directory may not exist yet
	}
	return { totalBytes, fileCount };
}

/**
 * BackupService — logika utama backup terstruktur & anti-terlewat.
 *
 * Fitur utama:
 * - Mengumpulkan file dari tabel `files` + orphan URL recovery across all panel tables
 *   + fallback legacy filesystem (departure_assessments).
 * - Penamaan folder per mahasiswa `{NIM}_{Nama}` dan subfolder Panel/Tab yang jelas.
 * - Penamaan file ramah-baca `{LabelDokumen}__{OriginalName}__{Timestamp}_{ShortId}.{ext}`.
 * - Kompatibel di Windows dev, Linux monorepo, dan Docker production (`/app/storage`, `/app/backups`).
 */
export class BackupService {
	private getBackupBasePath(): string {
		return resolveBackupPath();
	}

	private buildLockKey(type: string, filters: BackupFilter): string {
		const sortedKeys = Object.keys(filters).sort();
		const normalized: Record<string, unknown> = {};
		for (const k of sortedKeys) {
			const val = (filters as Record<string, unknown>)[k];
			if (val !== undefined && val !== null && val !== "") {
				normalized[k] = val;
			}
		}
		return `backup:${type}:${JSON.stringify(normalized)}`;
	}

	/**
	 * Buat backup job baru.
	 * Cek lock → insert DB → enqueue Redis → return jobId.
	 */
	async createBackupJob(
		params: CreateBackupParams,
	): Promise<{ jobId: string; status: string; message?: string }> {
		const { type, filters, userId } = params;
		const lockKey = this.buildLockKey(type, filters);

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
	 */
	async getBackupStatus(jobId: string): Promise<object | null> {
		const record = await backupRepository.findJobById(jobId);
		if (!record) return null;

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
	 * Statistik riil storage aktif, folder backup, dan riwayat terakhir.
	 */
	async getStorageStats(): Promise<{
		totalStorageSize: number;
		totalStorageFiles: number;
		totalBackupSize: number;
		activeDbFiles: number;
		completedBackupsCount: number;
		lastBackupAt: string | null;
		lastBackupType: string | null;
		storagePath: string;
		backupPath: string;
		retentionPolicy: string;
	}> {
		const storagePath = resolveStoragePath();
		const backupPath = this.getBackupBasePath();

		const [storageDisk, backupDisk, activeFilesRows, completedJobs] =
			await Promise.all([
				getDirectorySizeAndCount(storagePath),
				getDirectorySizeAndCount(backupPath),
				db.query.files.findMany({
					where: isNull(files.deletedAt),
					columns: { id: true },
				}),
				db.query.backupJobs.findMany({
					where: eq(backupJobs.status, "completed"),
					orderBy: [desc(backupJobs.completedAt)],
				}),
			]);

		const lastJob = completedJobs[0];

		return {
			totalStorageSize: storageDisk.totalBytes,
			totalStorageFiles: storageDisk.fileCount,
			totalBackupSize: backupDisk.totalBytes,
			activeDbFiles: activeFilesRows.length,
			completedBackupsCount: completedJobs.length,
			lastBackupAt: lastJob?.completedAt
				? lastJob.completedAt.toISOString()
				: null,
			lastBackupType: lastJob?.type ?? null,
			storagePath,
			backupPath,
			retentionPolicy: "Maks. 5 Full Backup Harian & 5 salinan per Mahasiswa",
		};
	}

	/**
	 * Eksekusi backup — dipanggil oleh BackupWorker atau test runner.
	 */
	async executeBackup(
		jobId: string,
		backupType: string,
		filters: BackupFilter,
	): Promise<void> {
		const lockKey = this.buildLockKey(backupType, filters);

		const locked = await acquireLock(lockKey, 60 * 60 * 2); // 2 jam TTL
		if (!locked) {
			await backupRepository.markFailed(
				jobId,
				"Backup lain dengan filter sama sedang berjalan",
			);
			return;
		}

		try {
			await backupRepository.markProcessing(jobId);
			await setJobProgress("backup", jobId, {
				status: "processing",
				startedAt: new Date().toISOString(),
			});

			// 1. Tentukan daftar mahasiswa target berdasarkan filter
			const { studentIds, studentMap } = await this.resolveStudents(filters);

			// 2. Kumpulkan seluruh berkas lintas panel & tab tanpa ada yang terlewat
			const collectedItems = await this.collectBackupItems(
				backupType,
				studentIds,
				filters,
			);

			const totalFiles = collectedItems.length;

			await setJobProgress("backup", jobId, {
				total: totalFiles,
				processed: 0,
				percentage: totalFiles === 0 ? 100 : 0,
			});

			// 3. Tentukan direktori output backup dengan penamaan folder jelas
			const singleStudentMeta =
				studentIds.length === 1 ? studentMap.get(studentIds[0]) : undefined;
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const outputDir = join(
				this.getBackupBasePath(),
				this.resolveOutputSubdir(backupType, filters, singleStudentMeta),
				`${timestamp}-${jobId.slice(-8)}`,
			);
			await mkdir(outputDir, { recursive: true });

			// 4. Salin semua berkas ke struktur folder Panel/Tab dengan nama file jelas
			let processed = 0;
			let totalSize = 0;
			const manifestFiles: ManifestFile[] = [];
			const skippedFiles: ManifestSkippedFile[] = [];
			const usedPaths = new Set<string>();

			const ensureUniqueRelPath = (relPath: string): string => {
				const normalized = relPath.replace(/\\/g, "/");
				if (!usedPaths.has(normalized)) {
					usedPaths.add(normalized);
					return normalized;
				}
				const dotIdx = normalized.lastIndexOf(".");
				const base = dotIdx >= 0 ? normalized.slice(0, dotIdx) : normalized;
				const ext = dotIdx >= 0 ? normalized.slice(dotIdx) : "";
				let counter = 2;
				let candidate = `${base}_${counter}${ext}`;
				while (usedPaths.has(candidate)) {
					counter++;
					candidate = `${base}_${counter}${ext}`;
				}
				usedPaths.add(candidate);
				return candidate;
			};

			for (const item of collectedItems) {
				const sMeta =
					item.studentId !== null ? studentMap.get(item.studentId) : undefined;

				if (item.fileRecord) {
					const rec = item.fileRecord;
					const effectivePanel = item.panelOverride ?? rec.panel;
					const effectiveDocKey = item.documentKeyOverride ?? rec.documentKey;
					const panelTabSubdir = resolvePanelAndTabSubdir(
						effectivePanel,
						rec.category,
						effectiveDocKey,
					);
					const clearFilename = buildClearBackupFilename({
						id: rec.id,
						documentKey: effectiveDocKey,
						originalName: rec.originalName,
						extension: rec.extension,
						createdAt: rec.createdAt,
					});

					const rawRelPath = sMeta
						? join("students", sMeta.folderName, panelTabSubdir, clearFilename)
						: join("non-mahasiswa", panelTabSubdir, clearFilename);
					const relDestPath = ensureUniqueRelPath(rawRelPath);

					try {
						await fileService.copyFileToBackup(rec.id, outputDir, relDestPath);
						totalSize += rec.size;
						manifestFiles.push({
							path: relDestPath,
							originalName: rec.originalName,
							size: rec.size,
							checksum: rec.checksum,
							studentId: sMeta?.id ?? rec.studentId ?? null,
							nim: sMeta?.nim ?? null,
							studentName: sMeta?.name ?? null,
							panel: effectivePanel ?? null,
							tabFolder: panelTabSubdir.replace(/\\/g, "/"),
							documentKey: effectiveDocKey ?? null,
						});
					} catch (copyErr) {
						const msg =
							copyErr instanceof Error
								? copyErr.message
								: "File tidak ditemukan di storage";
						console.warn(`[Backup] Skip file ${rec.id}: ${msg}`);
						skippedFiles.push({
							id: rec.id,
							originalName: rec.originalName,
							studentId: rec.studentId,
							panel: effectivePanel,
							documentKey: effectiveDocKey,
							reason: msg,
						});
					}

					processed++;
					if (processed % 10 === 0 || processed === totalFiles) {
						await setJobProgress("backup", jobId, {
							processed,
							percentage:
								totalFiles > 0
									? Math.round((processed / totalFiles) * 100)
									: 100,
							currentFile: rec.originalName,
						});
					}
				} else if (item.legacyFile) {
					const leg = item.legacyFile;
					const panelTabSubdir = resolvePanelAndTabSubdir(
						leg.panel,
						"academic",
						leg.documentKey,
					);
					const clearFilename = buildClearBackupFilename({
						id: leg.id,
						documentKey: leg.documentKey,
						originalName: leg.originalName,
						extension: leg.originalName.split(".").pop() || "pdf",
						createdAt: leg.createdAt,
					});
					const rawRelPath = sMeta
						? join("students", sMeta.folderName, panelTabSubdir, clearFilename)
						: join("non-mahasiswa", panelTabSubdir, clearFilename);
					const relDestPath = ensureUniqueRelPath(rawRelPath);

					try {
						const legFile = Bun.file(leg.absPath);
						const buffer = Buffer.from(await legFile.arrayBuffer());
						const checksum = calculateChecksum(buffer);
						const destAbs = join(outputDir, relDestPath);
						await mkdir(dirname(destAbs), { recursive: true });
						await Bun.write(destAbs, buffer);

						totalSize += buffer.length;
						manifestFiles.push({
							path: relDestPath,
							originalName: leg.originalName,
							size: buffer.length,
							checksum,
							studentId: sMeta?.id ?? item.studentId ?? null,
							nim: sMeta?.nim ?? null,
							studentName: sMeta?.name ?? null,
							panel: leg.panel,
							tabFolder: panelTabSubdir.replace(/\\/g, "/"),
							documentKey: leg.documentKey,
						});
					} catch (legErr) {
						const msg =
							legErr instanceof Error
								? legErr.message
								: "Legacy file tidak dapat dibaca";
						console.warn(`[Backup] Skip legacy file ${leg.id}: ${msg}`);
						skippedFiles.push({
							id: leg.id,
							originalName: leg.originalName,
							studentId: item.studentId,
							panel: leg.panel,
							documentKey: leg.documentKey,
							reason: msg,
						});
					}

					processed++;
					if (processed % 10 === 0 || processed === totalFiles) {
						await setJobProgress("backup", jobId, {
							processed,
							percentage:
								totalFiles > 0
									? Math.round((processed / totalFiles) * 100)
									: 100,
							currentFile: leg.originalName,
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
				...(skippedFiles.length > 0 ? { skipped_files: skippedFiles } : {}),
			});

			// 6. Update PostgreSQL — status final
			await backupRepository.markCompleted(
				jobId,
				outputDir,
				manifestFiles.length,
				totalSize,
				processed,
			);

			// 7. Jalankan Retention Policy (pembersihan backup lama)
			await retentionService.runRetentionCleanup(this.getBackupBasePath());

			await setJobProgress("backup", jobId, {
				status: "completed",
				total: manifestFiles.length,
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
			await releaseLock(lockKey);
		}
	}

	/**
	 * Kumpulkan semua file milik mahasiswa dari tabel `files` + recovery URL orphan dari seluruh
	 * tabel panel/tab + legacy filesystem agar 100% tidak ada file yang terlewat.
	 */
	async collectBackupItems(
		backupType: string,
		studentIds: number[],
		filters: BackupFilter,
	): Promise<CollectedBackupItem[]> {
		const allActiveFiles = await db.query.files.findMany({
			where: isNull(files.deletedAt),
		});
		const fileById = new Map<string, typeof files.$inferSelect>();
		for (const f of allActiveFiles) {
			fileById.set(f.id, f);
		}

		const studentIdSet = new Set(studentIds);
		const items: CollectedBackupItem[] = [];
		const addedFileIds = new Set<string>();

		// A. File dari tabel `files` yang terhubung langsung ke studentIds
		for (const f of allActiveFiles) {
			if (f.studentId !== null && studentIdSet.has(f.studentId)) {
				items.push({ studentId: f.studentId, fileRecord: f });
				addedFileIds.add(f.id);
			}
		}

		// B. Orphan/Link Recovery lintas seluruh tabel panel (PMB, CRM, Finance, Akademik, PA, Magang, Post-Internship, Nilai MK, Asesmen, SK)
		if (studentIds.length > 0) {
			const tryAddReferencedFile = (
				studentId: number,
				url: string | null | undefined,
				panelOverride: string,
				docKeyOverride?: string | null,
			) => {
				const fid = extractFileIdFromUrl(url);
				if (!fid || addedFileIds.has(fid)) return;
				const rec = fileById.get(fid);
				if (!rec) return;
				addedFileIds.add(fid);
				items.push({
					studentId,
					fileRecord: rec,
					panelOverride: rec.panel ?? panelOverride,
					documentKeyOverride: rec.documentKey ?? docKeyOverride ?? undefined,
				});
			};

			const [
				studentRows,
				decisionRows,
				feeRows,
				feeDisbursementRows,
				finRows,
				semRows,
				talInstRows,
				pmbDocRows,
				crmDocRows,
				finDocRows,
				acaDocRows,
				paDocRows,
				magangDocRows,
				postDocRows,
				cgDocRows,
				depRows,
			] = await Promise.all([
				db.query.students.findMany({
					where: inArray(students.id, studentIds),
					columns: { id: true, profilePhotoUrl: true },
				}),
				db.query.finalDecision.findMany({
					where: inArray(finalDecision.studentId, studentIds),
					columns: { studentId: true, skDocumentUrl: true },
				}),
				db.query.feeShareRecipients.findMany({
					where: inArray(feeShareRecipients.studentId, studentIds),
					columns: {
						studentId: true,
						invoiceFileUrl: true,
					},
				}),
				db.query.feeDisbursementLogs.findMany({
					where: inArray(feeDisbursementLogs.studentId, studentIds),
					columns: {
						studentId: true,
						terminNumber: true,
						transferProofUrl: true,
					},
				}),
				db.query.financeData.findMany({
					where: inArray(financeData.studentId, studentIds),
				}),
				db.query.financeSemesters.findMany({
					where: inArray(financeSemesters.studentId, studentIds),
					columns: { id: true, studentId: true, semesterNumber: true },
				}),
				db.query.financeTalanganInstallments.findMany({
					where: inArray(financeTalanganInstallments.studentId, studentIds),
					columns: {
						studentId: true,
						stage: true,
						buktiBayarUrl: true,
					},
				}),
				db.query.pmbDocuments.findMany({
					where: inArray(pmbDocuments.studentId, studentIds),
					columns: { studentId: true, documentKey: true, fileUrl: true },
				}),
				db.query.crmDocuments.findMany({
					where: inArray(crmDocuments.studentId, studentIds),
					columns: { studentId: true, documentKey: true, fileUrl: true },
				}),
				db.query.financeDocuments.findMany({
					where: inArray(financeDocuments.studentId, studentIds),
					columns: { studentId: true, documentKey: true, fileUrl: true },
				}),
				db.query.academicDocuments.findMany({
					where: inArray(academicDocuments.studentId, studentIds),
					columns: { studentId: true, documentKey: true, fileUrl: true },
				}),
				db.query.paDocuments.findMany({
					where: inArray(paDocuments.studentId, studentIds),
					columns: { studentId: true, documentKey: true, fileUrl: true },
				}),
				db.query.internshipDocuments.findMany({
					where: inArray(internshipDocuments.studentId, studentIds),
					columns: { studentId: true, documentKey: true, fileUrl: true },
				}),
				db.query.postInternshipDocs.findMany({
					where: inArray(postInternshipDocs.studentId, studentIds),
					columns: { studentId: true, documentKey: true, fileUrl: true },
				}),
				db.query.courseGradeDocuments.findMany({
					where: inArray(courseGradeDocuments.studentId, studentIds),
					columns: { studentId: true, documentKey: true, fileUrl: true },
				}),
				db.query.departureAssessments.findMany({
					where: inArray(departureAssessments.studentId, studentIds),
					columns: {
						studentId: true,
						resultFileUrl: true,
						resultFileName: true,
						assessedAt: true,
					},
				}),
			]);

			for (const s of studentRows) {
				tryAddReferencedFile(s.id, s.profilePhotoUrl, "pmb", "profile_photo");
			}
			for (const d of decisionRows) {
				tryAddReferencedFile(
					d.studentId,
					d.skDocumentUrl,
					"akademik",
					"sk_direktur",
				);
			}
			for (const r of feeRows) {
				tryAddReferencedFile(
					r.studentId,
					r.invoiceFileUrl,
					"pmb",
					"fee_invoice",
				);
			}
			for (const log of feeDisbursementRows) {
				tryAddReferencedFile(
					log.studentId,
					log.transferProofUrl,
					"finance",
					`fee_transfer_termin_${log.terminNumber}`,
				);
			}

			const financeUrlFields: Array<[keyof (typeof finRows)[number], string]> =
				[
					["registrasiBuktiBayarUrl", "registrasi"],
					["mandiriSemesterBuktiBayarUrl", "semester_1_inst"],
					["mandiriInterviewBuktiBayarUrl", "mandiri_interview"],
					["mandiriKeberangkatanBuktiBayarUrl", "mandiri_keberangkatan"],
					["kontrakMagangBuktiBayarUrl", "kontrak_magang"],
					["suhanBuktiBayarUrl", "suhan"],
					["t1InterviewBuktiBayarUrl", "t1_interview"],
					["t2KeberangkatanBuktiBayarUrl", "t2_keberangkatan"],
					["adminTalaganBuktiBayarUrl", "admin_talangan"],
					["toeicBuktiBayarUrl", "toeic"],
					["pasporBuktiBayarUrl", "paspor"],
					["rumahJuangBuktiBayarUrl", "rumah_juang"],
				];
			for (const fin of finRows) {
				for (const [col, docKey] of financeUrlFields) {
					tryAddReferencedFile(
						fin.studentId,
						fin[col] as string | null,
						"finance",
						docKey,
					);
				}
			}

			if (semRows.length > 0) {
				const semMap = new Map(semRows.map((s) => [s.id, s]));
				const semInstRows = await db.query.financeSemesterInstallments.findMany(
					{
						where: inArray(
							financeSemesterInstallments.semesterId,
							semRows.map((s) => s.id),
						),
						columns: { semesterId: true, buktiBayarUrl: true },
					},
				);
				for (const inst of semInstRows) {
					const sem = semMap.get(inst.semesterId);
					if (sem) {
						tryAddReferencedFile(
							sem.studentId,
							inst.buktiBayarUrl,
							"finance",
							`semester_${sem.semesterNumber}_inst`,
						);
					}
				}
			}

			for (const ti of talInstRows) {
				tryAddReferencedFile(
					ti.studentId,
					ti.buktiBayarUrl,
					"finance",
					`talangan_${ti.stage}_inst`,
				);
			}

			for (const doc of pmbDocRows)
				tryAddReferencedFile(
					doc.studentId,
					doc.fileUrl,
					"pmb",
					doc.documentKey,
				);
			for (const doc of crmDocRows)
				tryAddReferencedFile(
					doc.studentId,
					doc.fileUrl,
					"crm",
					doc.documentKey,
				);
			for (const doc of finDocRows)
				tryAddReferencedFile(
					doc.studentId,
					doc.fileUrl,
					"finance",
					doc.documentKey,
				);
			for (const doc of acaDocRows)
				tryAddReferencedFile(
					doc.studentId,
					doc.fileUrl,
					"akademik",
					doc.documentKey,
				);
			for (const doc of paDocRows)
				tryAddReferencedFile(doc.studentId, doc.fileUrl, "pa", doc.documentKey);
			for (const doc of magangDocRows)
				tryAddReferencedFile(
					doc.studentId,
					doc.fileUrl,
					"magang",
					doc.documentKey,
				);
			for (const doc of postDocRows)
				tryAddReferencedFile(
					doc.studentId,
					doc.fileUrl,
					"post-internship",
					doc.documentKey,
				);
			for (const doc of cgDocRows)
				tryAddReferencedFile(
					doc.studentId,
					doc.fileUrl,
					"akademik",
					doc.documentKey || "course_grade",
				);

			// Departure assessment: fileService link + legacy uploads/ fallback
			const legacyBase = resolve(resolveLegacyUploadsPath());
			for (const dep of depRows) {
				if (!dep.resultFileUrl) continue;
				const fid = extractFileIdFromUrl(dep.resultFileUrl);
				if (fid) {
					tryAddReferencedFile(
						dep.studentId,
						dep.resultFileUrl,
						"akademik",
						"departure_assessment",
					);
				} else {
					const absPath = resolve(legacyBase, dep.resultFileUrl);
					if (absPath.startsWith(legacyBase)) {
						try {
							if (await Bun.file(absPath).exists()) {
								items.push({
									studentId: dep.studentId,
									legacyFile: {
										id: `LEG${dep.studentId}`,
										absPath,
										originalName: dep.resultFileName || "hasil_assessment.pdf",
										panel: "akademik",
										documentKey: "departure_assessment",
										createdAt: dep.assessedAt,
									},
								});
							}
						} catch {
							// Ignore inaccessible legacy file
						}
					}
				}
			}
		}

		// C. Jika backupType === "full", sertakan juga file non-mahasiswa aktif (anggaran praktik dosen, dll.)
		if (backupType === "full") {
			for (const f of allActiveFiles) {
				if (f.studentId === null && !addedFileIds.has(f.id)) {
					items.push({ studentId: null, fileRecord: f });
					addedFileIds.add(f.id);
				}
			}
		}

		// D. Terapkan filter opsional category & panel
		return items.filter((item) => {
			if (item.fileRecord) {
				if (filters.category && item.fileRecord.category !== filters.category) {
					return false;
				}
				const effPanel = (
					item.panelOverride ??
					item.fileRecord.panel ??
					""
				).toLowerCase();
				if (filters.panel && effPanel !== filters.panel.toLowerCase()) {
					return false;
				}
			} else if (item.legacyFile) {
				if (filters.category && filters.category !== "academic") {
					return false;
				}
				if (filters.panel && filters.panel.toLowerCase() !== "akademik") {
					return false;
				}
			}
			return true;
		});
	}

	/**
	 * Resolve mahasiswa target berdasarkan filter dinamis.
	 */
	private async resolveStudents(filters: BackupFilter): Promise<{
		studentIds: number[];
		studentMap: Map<number, StudentMeta>;
	}> {
		const studentMap = new Map<number, StudentMeta>();

		const toMeta = (s: {
			id: number;
			nim: string | null;
			name: string;
		}): StudentMeta => ({
			id: s.id,
			nim: s.nim,
			name: s.name,
			folderName: formatStudentFolderName(s),
		});

		if (filters.studentId) {
			const student = await db.query.students.findFirst({
				where: (s, { eq }) => eq(s.id, filters.studentId!),
				columns: { id: true, nim: true, name: true },
			});
			if (!student) {
				throw new Error(
					`Mahasiswa dengan ID ${filters.studentId} tidak ditemukan`,
				);
			}
			studentMap.set(student.id, toMeta(student));
			return { studentIds: [student.id], studentMap };
		}

		if (filters.nim) {
			const student = await db.query.students.findFirst({
				where: (s, { eq }) => eq(s.nim, filters.nim!),
				columns: { id: true, nim: true, name: true },
			});
			if (!student) {
				throw new Error(`Mahasiswa dengan NIM ${filters.nim} tidak ditemukan`);
			}
			studentMap.set(student.id, toMeta(student));
			return { studentIds: [student.id], studentMap };
		}

		const allStudents = await db.query.students.findMany({
			columns: {
				id: true,
				nim: true,
				name: true,
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
			studentMap.set(s.id, toMeta(s));
		}

		return { studentIds: filtered.map((s) => s.id), studentMap };
	}

	/**
	 * Tentukan subdirektori output berdasarkan tipe backup.
	 */
	private resolveOutputSubdir(
		backupType: string,
		filters: BackupFilter,
		singleStudentMeta?: StudentMeta,
	): string {
		switch (backupType) {
			case "student":
				return join(
					"students",
					singleStudentMeta?.folderName ??
						sanitizeSegment(
							filters.nim ?? String(filters.studentId ?? "unknown"),
						),
				);
			case "cohort":
				return join("cohorts", String(filters.cohortId ?? "unknown"));
			case "program":
				return join(
					"programs",
					sanitizeSegment(filters.programId ?? "unknown", 40),
				);
			case "specialization":
				return join(
					"specializations",
					sanitizeSegment(filters.specializationId ?? "unknown", 40),
				);
			case "full":
				return "full";
			default:
				return "administrative";
		}
	}
}

export const backupService = new BackupService();
