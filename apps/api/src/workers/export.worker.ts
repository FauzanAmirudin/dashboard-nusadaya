import { createRequire } from "node:module";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { setJobProgress } from "../lib/job";
import { dequeue } from "../lib/queue";
import { fileService } from "../modules/file/service/file.service";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";

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
		// 1. Get student files
		const files = await fileService.listStudentFiles(studentId);

		if (files.length === 0) {
			throw new Error("Tidak ada file untuk mahasiswa ini.");
		}

		let studentName = "Mahasiswa";
		let nim = `ID${studentId}`;

		try {
			const userRecord = await db.query.users.findFirst({
				where: eq(users.id, studentId),
			});
			if (userRecord) {
				studentName = userRecord.fullName || "Mahasiswa";
				nim = userRecord.username || `ID${studentId}`;
			}
		} catch {
			// Fallback
		}

		// 3. Setup output file path
		const storagePath =
			process.env.STORAGE_PATH ?? join(process.cwd(), "../../storage");
		const exportsDir = join(storagePath, "exports");
		await mkdir(exportsDir, { recursive: true });

		const sanitizedName = studentName.replace(/[^a-zA-Z0-9_-]/g, "_");
		const zipFilename = `Berkas_${nim}_${sanitizedName}_${Date.now()}.zip`;
		const zipFilePath = join(exportsDir, zipFilename);

		await setJobProgress("export", jobId, {
			status: "processing",
			percentage: 10,
			currentFile: "Menginisialisasi kompresi berkas...",
		});

		const output = createWriteStream(zipFilePath);
		const archive = archiver("zip", { zlib: { level: 6 } });

		await new Promise<void>((resolve, reject) => {
			output.on("close", resolve);
			archive.on("error", reject);
			archive.pipe(output);

			let processed = 0;
			const total = files.length;

			(async () => {
				for (const file of files) {
					try {
						const { stream } = await fileService.streamFile(file.id);
						const nodeStream = Readable.fromWeb(stream as any);

						const ext = file.extension || "pdf";
						const folder = file.panel || "umum";
						const docName = file.documentKey || file.originalName;
						const zipEntryPath = `${folder}/${docName}.${ext}`;

						archive.append(nodeStream, { name: zipEntryPath });

						processed++;
						const progressPct = 10 + Math.round((processed / total) * 80);
						await setJobProgress("export", jobId, {
							status: "processing",
							percentage: progressPct,
							currentFile: `Mengompresi berkas (${processed}/${total}): ${file.originalName}`,
							processed,
							total,
						});
					} catch (streamErr) {
						console.warn(
							`[ExportWorker] Gagal menyertakan file ${file.id}:`,
							streamErr,
						);
					}
				}
				archive.finalize();
			})().catch(reject);
		});

		await setJobProgress("export", jobId, {
			status: "completed",
			percentage: 100,
			currentFile: "Selesai mengompresi berkas.",
			downloadUrl: `/files/exports/${zipFilename}`,
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
