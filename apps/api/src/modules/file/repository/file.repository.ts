import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../../db";
import { files } from "../../../db/schema";

export type NewFile = typeof files.$inferInsert;
export type FileRecord = typeof files.$inferSelect;

/**
 * FileRepository — operasi database untuk tabel `files`.
 * Semua query tabel files melewati class ini.
 */
export class FileRepository {
	/**
	 * Insert metadata file baru ke DB.
	 */
	async createFile(data: NewFile): Promise<FileRecord> {
		const [record] = await db.insert(files).values(data).returning();
		return record;
	}

	/**
	 * Cari file berdasarkan ID (hanya yang belum di-soft-delete).
	 */
	async findFileById(id: string): Promise<FileRecord | undefined> {
		return db.query.files.findFirst({
			where: and(eq(files.id, id), isNull(files.deletedAt)),
		});
	}

	/**
	 * Cari semua file milik seorang mahasiswa, opsional filter per kategori.
	 */
	async findFilesByStudentId(
		studentId: number,
		category?: string,
	): Promise<FileRecord[]> {
		return db.query.files.findMany({
			where: and(
				eq(files.studentId, studentId),
				isNull(files.deletedAt),
				category ? eq(files.category, category) : undefined,
			),
			orderBy: (t, { desc }) => [desc(t.createdAt)],
		});
	}

	/**
	 * Cari file berdasarkan panel + documentKey (untuk backward compat dengan sistem lama).
	 */
	async findFileByPanelKey(
		studentId: number,
		panel: string,
		documentKey: string,
	): Promise<FileRecord | undefined> {
		return db.query.files.findFirst({
			where: and(
				eq(files.studentId, studentId),
				eq(files.panel, panel),
				eq(files.documentKey, documentKey),
				isNull(files.deletedAt),
			),
		});
	}

	/**
	 * Cari semua file dalam panel tertentu milik seorang mahasiswa.
	 */
	async findFilesByPanel(
		studentId: number,
		panel: string,
	): Promise<FileRecord[]> {
		return db.query.files.findMany({
			where: and(
				eq(files.studentId, studentId),
				eq(files.panel, panel),
				isNull(files.deletedAt),
			),
			orderBy: (t, { desc }) => [desc(t.createdAt)],
		});
	}

	/**
	 * Soft delete — set deletedAt (untuk audit trail).
	 * Tidak menghapus record dari DB.
	 */
	async softDeleteFile(id: string): Promise<void> {
		await db
			.update(files)
			.set({ deletedAt: new Date() })
			.where(eq(files.id, id));
	}

	/**
	 * Hard delete — hapus permanen dari DB.
	 * Gunakan hanya setelah file fisik sudah dihapus dari storage.
	 */
	async hardDeleteFile(id: string): Promise<void> {
		await db.delete(files).where(eq(files.id, id));
	}

	/**
	 * Cari semua file yang belum soft-delete untuk kebutuhan backup.
	 * Mendukung filter per student IDs (untuk backup cohort/program).
	 */
	async findFilesForBackup(
		studentIds: number[],
		category?: string,
	): Promise<FileRecord[]> {
		return db.query.files
			.findMany({
				where: and(
					isNull(files.deletedAt),
					category ? eq(files.category, category) : undefined,
				),
			})
			.then((rows) =>
				rows.filter(
					(r) => r.studentId !== null && studentIds.includes(r.studentId),
				),
			);
	}
}

export const fileRepository = new FileRepository();
