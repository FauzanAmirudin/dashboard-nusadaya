import { Elysia } from "elysia";
import { fileService } from "../service/file.service";

/**
 * Route: DELETE /files/:id
 *
 * Hapus file — soft delete di DB + hapus fisik dari storage.
 * Hanya user yang mengupload atau superadmin yang bisa menghapus.
 */
export const deleteRoute = new Elysia().delete(
	"/files/:id",
	async (context) => {
		const { params, set } = context;
		// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		try {
			// Cek metadata dulu sebelum hapus
			const record = await fileService.getFileMetadata(params.id);
			if (!record) {
				set.status = 404;
				return { success: false, message: "File tidak ditemukan" };
			}

			// Hanya superadmin atau yang mengupload yang bisa menghapus
			if (user.role !== "superadmin" && record.uploadedBy !== user.id) {
				set.status = 403;
				return {
					success: false,
					message: "Tidak punya izin menghapus file ini",
				};
			}

			await fileService.deleteFile(params.id);

			return { success: true, message: "File berhasil dihapus" };
		} catch (err) {
			const error = err as Error;
			set.status = 500;
			return { success: false, message: error.message };
		}
	},
);
