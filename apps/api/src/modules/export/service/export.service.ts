import { monotonicFactory } from "ulidx";
import { enqueue } from "../../../lib/queue";
import { getJobProgress, setJobProgress } from "../../../lib/job";
import type { JobProgress } from "../../../lib/job";
import { isLocked } from "../../../lib/lock";

const ulid = monotonicFactory();

export class ExportService {
	/**
	 * Buat job ekspor data mahasiswa ke ZIP.
	 */
	async createExportStudentJob(studentId: number, userId: number): Promise<{ jobId: string; status: string; message?: string }> {
		const exportType = "student_zip";
		const lockKey = `export:${exportType}:${studentId}`;

		// Cegah klik berulang
		if (await isLocked(lockKey)) {
			return {
				jobId: "",
				status: "rejected",
				message: `Sedang memproses ekspor untuk mahasiswa ini. Harap tunggu selesai.`,
			};
		}

		const jobId = ulid();

		// Set progress awal di Redis
		await setJobProgress("export", jobId, {
			status: "queued",
			total: 0,
			processed: 0,
			percentage: 0,
		});

		// Masukkan ke queue
		await enqueue("export", {
			jobId,
			type: "export",
			payload: { jobId, exportType, filters: { studentId } },
			enqueuedAt: new Date().toISOString(),
		});

		return { jobId, status: "queued" };
	}

	/**
	 * Dapatkan status real-time dari job.
	 */
	async getExportStatus(jobId: string): Promise<JobProgress | null> {
		return getJobProgress("export", jobId);
	}
}

export const exportService = new ExportService();
