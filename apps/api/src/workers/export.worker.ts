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
			if (!job) continue;

			const { jobId, exportType, filters } = job.payload;
			console.log(`[ExportWorker] Processing export job ${jobId}`);

			if (exportType === "student_zip") {
				await processStudentZip(jobId, filters.studentId as number);
			}
		} catch (err) {
			const error = err as Error;
			console.error("[ExportWorker] Error:", error.message);
			await new Promise((r) => setTimeout(r, 1000));
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

		// 2. Get student info for filename
		// Catatan: Karena kita tidak punya tabel khusus 'students', kita anggap role='student' dan id=studentId
		// atau fallback ke NPM default
		let studentName = "Mahasiswa";
		let nim = `ID${studentId}`;

		try {
			const student = await db.query.users.findFirst({
				where: eq(users.id, studentId),
			});
			if (student) {
				studentName = student.fullName.replace(/[^a-zA-Z0-9]/g, "_");
				nim = student.username; // usually username is NPM
			}
		} catch {
			// abaikan jika tidak ketemu
		}

		const zipFilename = `Berkas_${studentName}_${nim}.zip`;
		const storagePath =
			process.env.STORAGE_PATH ?? join(process.cwd(), "../../storage");
		const exportDir = join(storagePath, "exports");
		await mkdir(exportDir, { recursive: true });

		const zipFilePath = join(exportDir, zipFilename);

		// 3. Create archiver
		const output = createWriteStream(zipFilePath);
		const archive = archiver("zip", { zlib: { level: 9 } });

		// Track progress
		let processed = 0;
		const total = files.length;

		archive.on("warning", (err: any) => {
			if (err.code === "ENOENT") {
				console.warn("[ExportWorker] Archiver warning:", err);
			} else {
				throw err;
			}
		});

		archive.on("error", (err: any) => {
			throw err;
		});

		archive.pipe(output);

		for (const file of files) {
			try {
				const { stream } = await fileService.streamFile(file.id);

				// Convert Web Stream to Node Stream for archiver
				// @ts-expect-error - Readable.fromWeb takes Web Stream
				const nodeStream = Readable.fromWeb(stream);

				const filePathInZip = `${file.category}/${file.originalName}`;
				archive.append(nodeStream, { name: filePathInZip });

				processed++;
				await setJobProgress("export", jobId, { processed, total });
			} catch (err) {
				console.error(
					`[ExportWorker] Gagal memasukkan file ${file.id} ke ZIP:`,
					err,
				);
				// Tetap lanjutkan file berikutnya
			}
		}

		// Finalize archive
		await archive.finalize();

		// Tunggu sampai stream output selesai
		await new Promise<void>((resolve, reject) => {
			output.on("close", () => resolve());
			output.on("error", (err) => reject(err));
		});

		console.log(
			`[ExportWorker] Job ${jobId} completed ✅. Size: ${archive.pointer()} bytes`,
		);

		// 4. Update status dengan downloadUrl
		await setJobProgress("export", jobId, {
			status: "completed",
			processed: total,
			total,
			downloadUrl: zipFilePath, // Absolute path for the API to read and stream
			completedAt: new Date().toISOString(),
		});
	} catch (err) {
		const error = err as Error;
		console.error(`[ExportWorker] Failed job ${jobId}:`, error);
		await setJobProgress("export", jobId, {
			status: "failed",
			errorMessage: error.message,
		});
	}
}
