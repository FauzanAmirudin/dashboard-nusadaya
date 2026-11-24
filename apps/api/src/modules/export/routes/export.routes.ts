import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Elysia } from "elysia";
import { hasRole } from "../../../lib/permissions";
import { exportService } from "../service/export.service";

export const exportRoutes = new Elysia()
	.post("/exports/student/:studentId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!hasRole(user, "superadmin")) {
			set.status = 403;
			return {
				success: false,
				message: "Hanya superadmin yang bisa melakukan ekspor",
			};
		}

		try {
			const studentId = Number(params.studentId);
			const result = await exportService.createExportStudentJob(
				studentId,
				user.id,
			);

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

		if (!hasRole(user, "superadmin")) {
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

		if (!hasRole(user, "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const status = await exportService.getExportStatus(params.jobId);
		if (status?.status !== "completed" || !status.downloadUrl) {
			set.status = 404;
			return {
				success: false,
				message: "File export belum tersedia atau gagal",
			};
		}

		try {
			const filePath = status.downloadUrl;
			const fileStat = await stat(filePath);
			const filename = filePath.split(/[\\/]/).pop() || "export.zip";
			const nodeStream = createReadStream(filePath);
			const webStream = new ReadableStream({
				start(controller) {
					nodeStream.on("data", (chunk) => {
						controller.enqueue(
							typeof chunk === "string" ? Buffer.from(chunk) : chunk,
						);
					});
					nodeStream.on("end", () => controller.close());
					nodeStream.on("error", (err) => controller.error(err));
				},
				cancel() {
					nodeStream.destroy();
				},
			});

			return new Response(webStream, {
				headers: {
					"Content-Type": "application/zip",
					"Content-Length": fileStat.size.toString(),
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			});
		} catch (err) {
			console.error("[ExportDownload] Failed to stream:", err);
			set.status = 404;
			return { success: false, message: "File fisik tidak ditemukan" };
		}
	});
