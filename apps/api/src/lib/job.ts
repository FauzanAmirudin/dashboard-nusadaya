import { redis } from "./redis";

/**
 * Job progress helper — tracking progress real-time per job ID.
 *
 * Progress disimpan di Redis (bukan PostgreSQL) karena:
 * - Update sangat sering (tiap file di-proses)
 * - Data bersifat sementara (tidak perlu persist)
 * - PostgreSQL tidak perlu menerima beban update tiap detik
 *
 * Setelah job selesai, status final ditulis ke PostgreSQL (backup_jobs.status).
 * Data Redis di-expire otomatis setelah TTL.
 *
 * Key naming convention:
 *   job:backup:{jobId}
 *   job:export:{jobId}
 */

const JOB_PREFIX = "job";
const JOB_TTL = 60 * 60 * 24; // 24 jam — cukup untuk monitoring

export interface JobProgress {
	status: "queued" | "processing" | "completed" | "failed";
	total: number;
	processed: number;
	percentage: number;
	currentFile?: string;
	errorMessage?: string;
	startedAt?: string;
	completedAt?: string;
	downloadUrl?: string; // Untuk URL hasil export
}

/**
 * Simpan atau update progress job.
 * Dipanggil oleh worker setiap N file diproses.
 */
export async function setJobProgress(
	jobType: string,
	jobId: string,
	progress: Partial<JobProgress>,
): Promise<void> {
	const key = `${JOB_PREFIX}:${jobType}:${jobId}`;
	try {
		// Merge dengan data yang sudah ada
		const existing = await getJobProgress(jobType, jobId);
		const merged: JobProgress = {
			status: "queued",
			total: 0,
			processed: 0,
			percentage: 0,
			...existing,
			...progress,
		};
		// Hitung persentase otomatis
		if (merged.status === "completed") {
			merged.percentage = 100;
		} else if (merged.total > 0) {
			merged.percentage = Math.min(
				99,
				Math.round((merged.processed / merged.total) * 100),
			);
		} else if (progress.percentage !== undefined) {
			merged.percentage = progress.percentage;
		}
		await redis.set(key, JSON.stringify(merged), "EX", JOB_TTL);
	} catch {
		// Abaikan error Redis — tidak kritis untuk alur utama
	}
}

/**
 * Ambil progress job. Return null jika tidak ada (atau Redis mati).
 */
export async function getJobProgress(
	jobType: string,
	jobId: string,
): Promise<JobProgress | null> {
	const key = `${JOB_PREFIX}:${jobType}:${jobId}`;
	try {
		const value = await redis.get(key);
		if (!value) return null;
		return JSON.parse(value) as JobProgress;
	} catch {
		return null;
	}
}

/**
 * Hapus data progress dari Redis (setelah job selesai dan data sudah di-persist ke PostgreSQL).
 */
export async function clearJobProgress(
	jobType: string,
	jobId: string,
): Promise<void> {
	const key = `${JOB_PREFIX}:${jobType}:${jobId}`;
	try {
		await redis.del(key);
	} catch {
		// abaikan
	}
}
