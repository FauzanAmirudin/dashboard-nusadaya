import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { students } from "../db/schema";
import { setJobProgress } from "../lib/job";
import { resolveStoragePath } from "../lib/paths";
import { dequeue } from "../lib/queue";
import { backupService } from "../modules/backup/service/backup.service";
import {
	buildClearBackupFilename,
	formatStudentFolderName,
	resolvePanelAndTabSubdir,
} from "../modules/backup/utils/backup-naming";
import { fileService } from "../modules/file/service/file.service";

interface ExportJobPayload {
	jobId: string;
	exportType: string;
	filters: Record<string, unknown>;
}

export async function startExportWorker(): Promise<void> {
	console.log("🔄 Export Worker started — listening on queue:export");

	// eslint-disable-next-line no-constant-condition
	while (true) {
		try {
			const job = await dequeue<ExportJobPayload>("export", 5);
			if (!job) {
				await new Promise((r) => setTimeout(r, 1000));
				continue;
			}

			const { jobId, exportType, filters } = job.payload;
			console.log(`[ExportWorker] Processing export job ${jobId}`);

			if (exportType === "student_zip") {
				await processStudentZip(jobId, filters.studentId as number);
			}
		} catch (err) {
			const error = err as Error;
			console.error("[ExportWorker] Error:", error.message);
			await new Promise((r) => setTimeout(r, 5000));
		}
	}
}

async function processStudentZip(jobId: string, studentId: number) {
	try {
		// 1. Ambil metadata mahasiswa dari tabel students
		const studentRecord = await db.query.students.findFirst({
			where: eq(students.id, studentId),
			columns: { id: true, nim: true, name: true },
		});
		if (!studentRecord) {
			throw new Error("Mahasiswa tidak ditemukan.");
		}

		// 2. Kumpulkan seluruh berkas lintas semua panel & tab (termasuk orphan & legacy)
		const items = await backupService.collectBackupItems(
			"student",
			[studentId],
			{
				studentId,
			},
		);

		if (items.length === 0) {
			throw new Error("Tidak ada file untuk mahasiswa ini.");
		}

		const studentFolder = formatStudentFolderName(studentRecord);

		// 3. Setup output file path di storage/exports
		const storagePath = resolveStoragePath();
		const exportsDir = join(storagePath, "exports");
		await mkdir(exportsDir, { recursive: true });

		const zipFilename = `Berkas_${studentFolder}_${Date.now()}.zip`;
		const zipFilePath = join(exportsDir, zipFilename);

		await setJobProgress("export", jobId, {
			status: "processing",
			percentage: 10,
			currentFile: "Menginisialisasi kompresi berkas...",
		});

		const output = createWriteStream(zipFilePath);
		const archive = new ZipArchive({ zlib: { level: 6 } });
		const usedEntries = new Set<string>();

		await new Promise<void>((resolvePromise, rejectPromise) => {
			output.on("close", resolvePromise);
			archive.on("error", rejectPromise);
			archive.pipe(output);

			let processed = 0;
			const total = items.length;

			const makeUniqueEntry = (rawEntry: string): string => {
				const normalized = rawEntry.replace(/\\/g, "/");
				if (!usedEntries.has(normalized)) {
					usedEntries.add(normalized);
					return normalized;
				}
				const dotIdx = normalized.lastIndexOf(".");
				const base = dotIdx >= 0 ? normalized.slice(0, dotIdx) : normalized;
				const ext = dotIdx >= 0 ? normalized.slice(dotIdx) : "";
				let n = 2;
				let candidate = `${base}_${n}${ext}`;
				while (usedEntries.has(candidate)) {
					n++;
					candidate = `${base}_${n}${ext}`;
				}
				usedEntries.add(candidate);
				return candidate;
			};

			(async () => {
				for (const item of items) {
					try {
						if (item.fileRecord) {
							const rec = item.fileRecord;
							const { stream } = await fileService.streamFile(rec.id);
							const nodeStream = Readable.fromWeb(stream as any);

							const subdir = resolvePanelAndTabSubdir(
								item.panelOverride ?? rec.panel,
								rec.category,
								item.documentKeyOverride ?? rec.documentKey,
							);
							const clearFilename = buildClearBackupFilename({
								id: rec.id,
								documentKey: item.documentKeyOverride ?? rec.documentKey,
								originalName: rec.originalName,
								extension: rec.extension,
								createdAt: rec.createdAt,
							});
							const zipEntryPath = makeUniqueEntry(
								`${studentFolder}/${subdir}/${clearFilename}`,
							);

							archive.append(nodeStream, { name: zipEntryPath });

							processed++;
							const progressPct = 10 + Math.round((processed / total) * 80);
							await setJobProgress("export", jobId, {
								status: "processing",
								percentage: progressPct,
								currentFile: `Mengompresi berkas (${processed}/${total}): ${rec.originalName}`,
								processed,
								total,
							});
						} else if (item.legacyFile) {
							const leg = item.legacyFile;
							const buf = Buffer.from(
								await Bun.file(leg.absPath).arrayBuffer(),
							);
							const subdir = resolvePanelAndTabSubdir(
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
							const zipEntryPath = makeUniqueEntry(
								`${studentFolder}/${subdir}/${clearFilename}`,
							);

							archive.append(buf, { name: zipEntryPath });

							processed++;
							const progressPct = 10 + Math.round((processed / total) * 80);
							await setJobProgress("export", jobId, {
								status: "processing",
								percentage: progressPct,
								currentFile: `Mengompresi berkas (${processed}/${total}): ${leg.originalName}`,
								processed,
								total,
							});
						}
					} catch (streamErr) {
						console.warn(`[ExportWorker] Gagal menyertakan file:`, streamErr);
					}
				}
				archive.finalize();
			})().catch(rejectPromise);
		});

		await setJobProgress("export", jobId, {
			status: "completed",
			percentage: 100,
			currentFile: "Selesai mengompresi berkas.",
			downloadUrl: zipFilePath,
		});
	} catch (err: any) {
		console.error(`[ExportWorker] Export ${jobId} failed:`, err);
		await setJobProgress("export", jobId, {
			status: "failed",
			errorMessage: err?.message || "Export gagal",
		});
		throw err;
	}
}
