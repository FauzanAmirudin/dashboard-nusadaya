import { Elysia } from "elysia";
import { fileService } from "../service/file.service";

/**
 * Routes metadata file:
 * - GET /files/:id           → detail satu file
 * - GET /students/:id/files  → semua file milik mahasiswa (opsional ?category=...)
 */
export const metadataRoute = new Elysia()
	.get("/files/:id", async (context) => {
		const { params, set } = context;
		// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const record = await fileService.getFileMetadata(params.id);
		if (!record) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		return { success: true, data: record };
	})

	.get("/students/:id/files", async (context) => {
		const { params, query, set } = context;
		// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const studentId = Number(params.id);
		const category = (query as Record<string, string>).category;

		const records = await fileService.listStudentFiles(studentId, category);
		return { success: true, data: records };
	});
