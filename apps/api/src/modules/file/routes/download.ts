import { eq, or } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../../../db";
import { students } from "../../../db/schema";
import { fileService } from "../service/file.service";

/**
 * Route: GET /files/:id/download
 *
 * Streaming download file. Tidak load seluruh file ke RAM.
 * File dikembalikan dengan header Content-Type dan Content-Disposition yang sesuai.
 */
export const downloadRoute = new Elysia().get(
	"/files/:id/download",
	async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		try {
			const record = await fileService.getFileMetadata(params.id);
			if (!record) {
				set.status = 404;
				return { success: false, message: "File metadata tidak ditemukan" };
			}

			// Public files & profile photos can be viewed without token (for standard <img> tags)
			const isPublic =
				record.visibility === "public" || record.category === "profile";
			if (!isPublic && !user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			// Task 5.5: Proteksi akses file foto selfie
			// Mahasiswa hanya bisa akses foto miliknya sendiri; staff bisa akses semua
			if (
				user &&
				user.role === "mahasiswa" &&
				record.category === "selfie_absen"
			) {
				const student = await db.query.students.findFirst({
					where: or(
						eq(students.studentUserId, user.id),
						eq(students.email, user.email || ""),
						eq(students.nim, user.username || ""),
					),
					columns: { id: true },
				});
				if (!student || record.studentId !== student.id) {
					set.status = 403;
					return {
						success: false,
						message:
							"Akses ditolak: Anda hanya dapat mengakses foto selfie milik sendiri.",
					};
				}
			}

			// Local path resolution
			const absolutePath = fileService.getAbsolutePath(record.storagePath);
			const file = Bun.file(absolutePath);

			if (!(await file.exists())) {
				set.status = 404;
				return { success: false, message: "File fisik tidak ditemukan" };
			}

			// Set header agar browser tahu cara menampilkan file (walaupun Bun.file sudah set MIME, kita set disposition agar benar)
			set.headers["Content-Type"] = record.mimeType;
			set.headers["Content-Disposition"] =
				`inline; filename="${encodeURIComponent(record.originalName)}"`;
			set.headers["Content-Length"] = String(record.size);

			// Return Bun.file langsung — ini menyelesaikan masalah 'Failed to load PDF document' di browser
			return file;
		} catch (err) {
			const error = err as Error;
			set.status = 404;
			return { success: false, message: error.message };
		}
	},
);
