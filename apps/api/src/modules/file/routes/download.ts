import { Elysia } from "elysia";
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
		// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		try {
			const { stream, record } = await fileService.streamFile(params.id);

			// Set header agar browser tahu cara menampilkan file
			set.headers["Content-Type"] = record.mimeType;
			set.headers["Content-Disposition"] =
				`inline; filename="${encodeURIComponent(record.originalName)}"`;
			set.headers["Content-Length"] = String(record.size);

			// Return stream langsung — Bun/Elysia mendukung ReadableStream response
			return stream;
		} catch (err) {
			const error = err as Error;
			set.status = 404;
			return { success: false, message: error.message };
		}
	},
);
