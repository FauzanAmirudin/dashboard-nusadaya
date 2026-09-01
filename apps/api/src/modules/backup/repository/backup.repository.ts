import { eq, like } from "drizzle-orm";
import { db } from "../../../db";
import { backupJobs } from "../../../db/schema";

export type NewBackupJob = typeof backupJobs.$inferInsert;
export type BackupJobRecord = typeof backupJobs.$inferSelect;

/**
 * BackupRepository — operasi DB untuk tabel `backup_jobs`.
 *
 * Hanya menyimpan status FINAL (queued/processing/completed/failed).
 * Progress real-time (percentage, current_file) ada di Redis via job.ts.
 */
export class BackupRepository {
	async createJob(data: NewBackupJob): Promise<BackupJobRecord> {
		const [record] = await db.insert(backupJobs).values(data).returning();
		return record;
	}

	async findJobById(id: string): Promise<BackupJobRecord | undefined> {
		return db.query.backupJobs.findFirst({
			where: eq(backupJobs.id, id),
		});
	}

	async listJobs(): Promise<BackupJobRecord[]> {
		// Pastikan record backup lama tipe full yang melebihi batas 5 dihapus dari DB
		await this.cleanupJobRecordsByType("full", 5);

		return db.query.backupJobs.findMany({
			orderBy: (t, { desc }) => [desc(t.createdAt)],
		});
	}

	async updateJob(id: string, data: Partial<BackupJobRecord>): Promise<void> {
		await db
			.update(backupJobs)
			.set(data as Record<string, unknown>)
			.where(eq(backupJobs.id, id));
	}

	async markProcessing(id: string): Promise<void> {
		await db
			.update(backupJobs)
			.set({ status: "processing", startedAt: new Date() })
			.where(eq(backupJobs.id, id));
	}

	async markCompleted(
		id: string,
		outputPath: string,
		totalFiles: number,
		totalSize: number,
		processedFiles: number,
	): Promise<void> {
		await db
			.update(backupJobs)
			.set({
				status: "completed",
				completedAt: new Date(),
				outputPath,
				totalFiles,
				totalSize,
				processedFiles,
			})
			.where(eq(backupJobs.id, id));
	}

	async markFailed(id: string, errorMessage: string): Promise<void> {
		await db
			.update(backupJobs)
			.set({
				status: "failed",
				completedAt: new Date(),
				errorMessage,
			})
			.where(eq(backupJobs.id, id));
	}

	async deleteJob(id: string): Promise<void> {
		await db.delete(backupJobs).where(eq(backupJobs.id, id));
	}

	async deleteJobsBySuffix(suffix: string): Promise<void> {
		await db.delete(backupJobs).where(like(backupJobs.id, `%${suffix}`));
	}

	async deleteJobsByOutputPath(outputPath: string): Promise<void> {
		await db.delete(backupJobs).where(eq(backupJobs.outputPath, outputPath));
	}

	async cleanupJobRecordsByType(
		type: string,
		maxKeep: number = 5,
	): Promise<void> {
		const jobs = await db.query.backupJobs.findMany({
			where: eq(backupJobs.type, type),
			orderBy: (t, { desc }) => [desc(t.createdAt)],
		});
		if (jobs.length > maxKeep) {
			const jobsToDelete = jobs.slice(maxKeep);
			for (const job of jobsToDelete) {
				await db.delete(backupJobs).where(eq(backupJobs.id, job.id));
			}
		}
	}
}

export const backupRepository = new BackupRepository();
