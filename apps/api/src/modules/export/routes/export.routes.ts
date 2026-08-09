import { Elysia, t } from "elysia";
import { exportService } from "../service/export.service";
import { join } from "node:path";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";

export const exportRoutes = new Elysia()
	.post("/exports/student/:studentId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Hanya superadmin yang bisa melakukan ekspor" };
		}

		try {
			const studentId = Number(params.studentId);
			const result = await exportService.createExportStudentJob(studentId, user.id);
			
			if (result.status === "rejected") {
				set.status = 409;
				return { success: false, message: result.message };
			}

			return { success: true, data: result };
		} catch (err) {
			const error = err as Error;
			set.status = 500;
			return { success: false, message: error.message };
		}
	})

	.get("/exports/:jobId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const status = await exportService.getExportStatus(params.jobId);
		if (!status) {
			set.status = 404;
			return { success: false, message: "Export job tidak ditemukan" };
		}

		return { success: true, data: status };
	})

	.get("/exports/:jobId/download", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const status = await exportService.getExportStatus(params.jobId);
		if (status?.status !== "completed" || !status.downloadUrl) {
			set.status = 404;
			return { success: false, message: "File export belum tersedia atau gagal" };
		}

		try {
			const filePath = status.downloadUrl;
			const fileStat = await stat(filePath);
			
			// Extract filename from path
			const filename = filePath.split(/[\\/]/).pop() || "export.zip";

			set.headers = {
				"Content-Type": "application/zip",
				"Content-Length": fileStat.size.toString(),
				"Content-Disposition": `attachment; filename="${filename}"`,
			};

			return createReadStream(filePath);
		} catch (err) {
			console.error("[ExportDownload] Failed to stream:", err);
			set.status = 404;
			return { success: false, message: "File fisik tidak ditemukan" };
		}
	});
