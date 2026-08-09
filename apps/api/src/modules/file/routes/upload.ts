import { Elysia, t } from "elysia";
import { fileService } from "../service/file.service";

/**
 * Route: POST /files/upload
 *
 * Upload file baru. File disimpan via FileService (bukan langsung ke disk).
 * Mendukung semua tipe file yang ada di whitelist (PDF, JPG, PNG, dll.).
 *
 * Body (multipart/form-data):
 * - file: File
 * - studentId?: number
 * - category: string
 * - panel?: string
 * - documentKey?: string
 */
export const uploadRoute = new Elysia().post(
	"/files/upload",
	async (context) => {
		const { body, set } = context;
		// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const file = body.file as File;
		if (!file || !file.name) {
			set.status = 400;
			return { success: false, message: "File tidak ditemukan dalam request" };
		}

		try {
			const result = await fileService.uploadFile({
				file,
				studentId: body.studentId ? Number(body.studentId) : undefined,
				category: body.category,
				panel: body.panel,
				documentKey: body.documentKey,
				uploadedBy: user.id,
				visibility: body.visibility as "private" | "public" | undefined,
			});

			return {
				success: true,
				data: result,
			};
		} catch (err) {
			const error = err as Error;
			set.status = 400;
			return { success: false, message: error.message };
		}
	},
	{
		body: t.Object({
			file: t.File(),
			studentId: t.Optional(t.String()),
			category: t.String(),
			panel: t.Optional(t.String()),
			documentKey: t.Optional(t.String()),
			visibility: t.Optional(t.String()),
		}),
	},
);
