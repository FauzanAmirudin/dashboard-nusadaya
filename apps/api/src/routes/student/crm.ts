import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import {
	academicAttitudeLogs,
	academicData,
	academicDocuments,
	auditLogs,
	counselingLogs,
	courseGradeDocuments,
	courseGrades,
	crmData,
	crmDocuments,
	crmLogs,
	entrepreneurshipRecords,
	feeShareRecipients,
	finalDecision,
	financeData,
	financeDocuments,
	internalNotes,
	internshipData,
	internshipDocuments,
	paData,
	paDocuments,
	paHafalanSessions,
	paInterviewLogs,
	paTripartiteLogs,
	pmbData,
	pmbDocuments,
	pmbFeeDisbursements,
	pmbPaymentPlan,
	postInternshipDocs,
	students,
	users,
	vocabLogs,
	weeklyEvents,
} from "../../db/schema";
import { cacheDel, cacheInvalidatePattern } from "../../lib/cache";
import { hasRole } from "../../lib/permissions";
import { requireRole } from "../../middleware/rbac";
import { fileService } from "../../modules/file/service/file.service";

export async function invalidateCrmCaches(studentId: number) {
	await Promise.all([
		cacheDel(`cache:student:${studentId}`),
		cacheInvalidatePattern("cache:students:*"),
		cacheInvalidatePattern("cache:mahasiswa:*"),
		cacheInvalidatePattern("cache:dashboard:*"),
	]);
}

export const crmRoutes = new Elysia()
	.get("/:id/crm", async ({ params, set }) => {
		set.headers["cache-control"] = "no-store, no-cache, must-revalidate";
		const id = Number(params.id);
		const crm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } },
			},
		});

		// Check real physical existence of uploaded documents
		const docs = await db.query.crmDocuments.findMany({
			where: eq(crmDocuments.studentId, id),
		});
		const logs = await db.query.crmLogs.findMany({
			where: eq(crmLogs.studentId, id),
			with: { author: { columns: { fullName: true } } },
			orderBy: (crmLogs, { desc }) => [desc(crmLogs.createdAt)],
			limit: 5,
		});

		const [finance, pmb, pa, hafalanSessions, vLogs] = await Promise.all([
			db.query.financeData.findFirst({
				where: eq(financeData.studentId, id),
			}),
			db.query.pmbData.findFirst({
				where: eq(pmbData.studentId, id),
				with: {
					accBy: { columns: { fullName: true } },
				},
			}),
			db.query.paData.findFirst({
				where: eq(paData.studentId, id),
				with: {
					accBy: { columns: { fullName: true } },
				},
			}),
			db.query.paHafalanSessions
				.findMany({
					where: eq(paHafalanSessions.studentId, id),
					with: {
						createdByUser: { columns: { fullName: true, username: true } },
					},
					orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
				})
				.catch(() =>
					db
						.select()
						.from(paHafalanSessions)
						.where(eq(paHafalanSessions.studentId, id)),
				),
			db.query.vocabLogs.findMany({
				where: eq(vocabLogs.studentId, id),
				orderBy: (logs, { desc }) => [desc(logs.date)],
			}),
		]);

		return {
			success: true,
			data: {
				crm,
				logs,
				finance,
				pmb,
				pa,
				hafalanSessions,
				vocabLogs: vLogs,
			},
		};
	})
	.get("/:id/crm/logs", async ({ params, query }) => {
		const id = Number(params.id);
		const limit = Number(query?.limit) || 20;
		const page = Number(query?.page) || 1;

		const logs = await db.query.crmLogs.findMany({
			where: eq(crmLogs.studentId, id),
			with: { author: { columns: { fullName: true } } },
			orderBy: (crmLogs, { desc }) => [desc(crmLogs.createdAt)],
			limit: limit,
			offset: (page - 1) * limit,
		});

		return { success: true, data: logs };
	})
	.get("/:id/crm/kehadiran", async ({ params, set }) => {
		const id = Number(params.id);
		const user = (set as any).user;

		const academic = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, id),
			columns: {
				attendanceTotal: true,
				attendancePresent: true,
				attendanceAlphaNote: true,
			},
		});

		const courses = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, id),
			columns: {
				courseName: true,
				courseCode: true,
				totalMeetings: true,
				attendancePresent: true,
			},
			with: {
				dosen: { columns: { fullName: true } },
			},
		});

		const crm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
			columns: {
				practiceAttendance: true,
			},
		});

		return {
			success: true,
			data: {
				academic: academic || {
					attendanceTotal: 0,
					attendancePresent: 0,
					attendanceAlphaNote: null,
				},
				courses: courses || [],
				crm: crm || { practiceAttendance: false },
			},
		};
	})
	.patch(
		"/:id/crm",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			if (!hasRole(user, "crm", "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = Number(params.id);
			const updates = { ...(body as Record<string, any>) };

			if ("pramagangStartDate" in updates) {
				if (!updates.pramagangStartDate || updates.pramagangStartDate === "") {
					updates.pramagangStartDate = null;
				}
			}

			if ("pramagangEndDate" in updates) {
				if (!updates.pramagangEndDate || updates.pramagangEndDate === "") {
					updates.pramagangEndDate = null;
				}
			}

			if ("odsDetails" in updates && Array.isArray(updates.odsDetails)) {
				for (let i = 0; i < 5; i++) {
					const num = i + 1;
					const item = updates.odsDetails[i];
					const isDone = Boolean(item?.isDone);
					(updates as any)[`isOds${num}Report`] = isDone;
				}
			}

			const current = await db.query.crmData.findFirst({
				where: eq(crmData.studentId, id),
			});
			if (!current) {
				await db.insert(crmData).values({ studentId: id, ...updates });
			} else {
				await db
					.update(crmData)
					.set({ ...updates, updatedAt: new Date() })
					.where(eq(crmData.studentId, id));
			}

			// Recalculate status
			const updated = await db.query.crmData.findFirst({
				where: eq(crmData.studentId, id),
			});
			if (updated) {
				const odsList = Array.isArray(updated.odsDetails)
					? (updated.odsDetails as any[])
					: [];
				const hasOds1 =
					Boolean(updated.isOds1Report) || Boolean(odsList[0]?.isDone);
				const hasOds2 =
					Boolean(updated.isOds2Report) || Boolean(odsList[1]?.isDone);
				const hasOds3 =
					Boolean(updated.isOds3Report) || Boolean(odsList[2]?.isDone);
				const hasOds4 =
					Boolean(updated.isOds4Report) || Boolean(odsList[3]?.isDone);
				const hasOds5 =
					Boolean(updated.isOds5Report) || Boolean(odsList[4]?.isDone);
				const hasPrammagang = Boolean(updated.isPrammagangReport);

				const crmChecks = [
					updated.isMonitoringParent,
					updated.isMonitoringIndustry,
					updated.isVocabComplete,
					updated.practiceAttendance,
					hasOds1,
					hasOds2,
					hasOds3,
					hasOds4,
					hasOds5,
					hasPrammagang,
				];

				const checkedCount = crmChecks.filter(Boolean).length;
				const totalChecks = 10;

				let status: "ACC" | "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
					"BUTUH_PERHATIAN";
				if (updated.isAcc) status = "ACC";
				else if (checkedCount === totalChecks) status = "AMAN";
				else if ((checkedCount / totalChecks) * 100 > 30) status = "PROSES";

				const extraUpdates: any = { status };
				if (checkedCount < totalChecks && updated.isAcc) {
					extraUpdates.isAcc = false;
					extraUpdates.accAt = null;
					extraUpdates.accBy = null;
				}

				await db
					.update(crmData)
					.set(extraUpdates)
					.where(eq(crmData.studentId, id));
			}

			await invalidateCrmCaches(id);

			return { success: true };
		},
		{
			body: t.Record(t.String(), t.Any()),
		},
	)
	.post(
		"/:id/crm/log",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);
			const payload = body as any;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			await db.insert(crmLogs).values({
				studentId: id,
				authorId: user.id,
				startTime: payload.startTime,
				endTime: payload.endTime,
				media: payload.media,
				location: payload.location,
				topic: payload.topic,
				logText: payload.logText,
				logType: payload.logType || "modul_crm",
				attachments: payload.attachments || [],
				agreements: payload.agreements || [],
				followUps: payload.followUps || [],
			});

			// Auto update parent/industry monitoring flag if appropriate
			if (
				payload.logType === "orang_tua_masalah" ||
				payload.logType === "orang_tua_komunikasi"
			) {
				await db
					.update(crmData)
					.set({ isMonitoringParent: true, updatedAt: new Date() })
					.where(eq(crmData.studentId, id));
			} else if (payload.logType === "industri_masalah") {
				await db
					.update(crmData)
					.set({ isMonitoringIndustry: true, updatedAt: new Date() })
					.where(eq(crmData.studentId, id));
			}

			await invalidateCrmCaches(id);

			return { success: true };
		},
		{
			body: t.Object({
				startTime: t.Optional(t.String()),
				endTime: t.Optional(t.String()),
				media: t.Optional(t.String()),
				location: t.Optional(t.String()),
				topic: t.Optional(t.String()),
				logText: t.String(),
				logType: t.Optional(t.String()),
				attachments: t.Optional(
					t.Array(
						t.Object({
							id: t.String(),
							url: t.String(),
							name: t.String(),
						}),
					),
				),
				agreements: t.Optional(t.Array(t.String())),
				followUps: t.Optional(t.Array(t.Any())),
			}),
		},
	)
	.delete("/:id/crm/log/:logId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const id = Number(params.id);
		const logId = Number(params.logId);

		const log = await db.query.crmLogs.findFirst({
			where: and(eq(crmLogs.id, logId), eq(crmLogs.studentId, id)),
		});

		if (!log) {
			set.status = 404;
			return { success: false, message: "Log tidak ditemukan" };
		}

		// Hapus file fisik & metadata gambar yang terlampir
		if (log.attachments && Array.isArray(log.attachments)) {
			for (const attachment of log.attachments as any[]) {
				if (attachment.id) {
					try {
						await fileService.deleteFile(attachment.id);
					} catch (e) {
						console.error(`Gagal menghapus lampiran ${attachment.id}:`, e);
					}
				}
			}
		}

		await db
			.delete(crmLogs)
			.where(and(eq(crmLogs.id, logId), eq(crmLogs.studentId, id)));

		await invalidateCrmCaches(id);

		return { success: true };
	})
	.post("/:id/crm/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return {
				success: false,
				message: "Sesi login berakhir. Silakan login kembali.",
			};
		}
		if (!hasRole(user, "crm", "superadmin")) {
			set.status = 403;
			return {
				success: false,
				message:
					"Akses ditolak: Hanya role CRM dan Superadmin yang diizinkan memberikan ACC CRM.",
			};
		}

		const currentCrm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
		});
		let odsList: any[] = [];
		if (currentCrm?.odsDetails) {
			try {
				odsList =
					typeof currentCrm.odsDetails === "string"
						? JSON.parse(currentCrm.odsDetails)
						: (currentCrm.odsDetails as any[]);
			} catch {}
		}
		const hasOds1 =
			Boolean(currentCrm?.isOds1Report) || Boolean(odsList[0]?.isDone);
		const hasOds2 =
			Boolean(currentCrm?.isOds2Report) || Boolean(odsList[1]?.isDone);
		const hasOds3 =
			Boolean(currentCrm?.isOds3Report) || Boolean(odsList[2]?.isDone);
		const hasOds4 =
			Boolean(currentCrm?.isOds4Report) || Boolean(odsList[3]?.isDone);
		const hasOds5 =
			Boolean(currentCrm?.isOds5Report) || Boolean(odsList[4]?.isDone);
		const hasPrammagang = Boolean(currentCrm?.isPrammagangReport);

		if (
			!currentCrm?.isMonitoringParent ||
			!currentCrm.isMonitoringIndustry ||
			!currentCrm.isVocabComplete ||
			!currentCrm.practiceAttendance ||
			!hasOds1 ||
			!hasOds2 ||
			!hasOds3 ||
			!hasOds4 ||
			!hasOds5 ||
			!hasPrammagang
		) {
			set.status = 400;
			return {
				success: false,
				message: "Semua checklist (10 item) harus selesai sebelum ACC.",
			};
		}

		await db
			.update(crmData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
				status: "ACC",
			})
			.where(eq(crmData.studentId, id));

		await invalidateCrmCaches(id);

		return { success: true };
	})
	.delete("/:id/crm/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user) {
			set.status = 401;
			return {
				success: false,
				message: "Sesi login berakhir. Silakan login kembali.",
			};
		}
		if (!hasRole(user, "crm", "superadmin")) {
			set.status = 403;
			return {
				success: false,
				message:
					"Akses ditolak: Hanya role CRM dan Superadmin yang diizinkan membatalkan ACC CRM.",
			};
		}
		const id = Number(params.id);

		const currentCrm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
		});
		let odsList: any[] = [];
		if (currentCrm?.odsDetails) {
			try {
				odsList =
					typeof currentCrm.odsDetails === "string"
						? JSON.parse(currentCrm.odsDetails)
						: (currentCrm.odsDetails as any[]);
			} catch {}
		}
		const crmChecks = [
			Boolean(currentCrm?.isMonitoringParent),
			Boolean(currentCrm?.isMonitoringIndustry),
			Boolean(currentCrm?.isVocabComplete),
			Boolean(currentCrm?.practiceAttendance),
			Boolean(currentCrm?.isOds1Report || odsList[0]?.isDone),
			Boolean(currentCrm?.isOds2Report || odsList[1]?.isDone),
			Boolean(currentCrm?.isOds3Report || odsList[2]?.isDone),
			Boolean(currentCrm?.isOds4Report || odsList[3]?.isDone),
			Boolean(currentCrm?.isOds5Report || odsList[4]?.isDone),
			Boolean(currentCrm?.isPrammagangReport),
		];
		const count = crmChecks.filter(Boolean).length;
		const fallbackStatus: "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
			count === 10
				? "AMAN"
				: (count / 10) * 100 > 30
					? "PROSES"
					: "BUTUH_PERHATIAN";

		await db
			.update(crmData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
				status: fallbackStatus,
			})
			.where(eq(crmData.studentId, id));

		await invalidateCrmCaches(id);

		return { success: true };
	})
	.post("/:id/crm/cancel-acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user) {
			set.status = 401;
			return {
				success: false,
				message: "Sesi login berakhir. Silakan login kembali.",
			};
		}
		if (!hasRole(user, "crm", "superadmin")) {
			set.status = 403;
			return {
				success: false,
				message:
					"Akses ditolak: Hanya role CRM dan Superadmin yang diizinkan membatalkan ACC CRM.",
			};
		}
		const id = Number(params.id);

		const currentCrm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
		});
		let odsList: any[] = [];
		if (currentCrm?.odsDetails) {
			try {
				odsList =
					typeof currentCrm.odsDetails === "string"
						? JSON.parse(currentCrm.odsDetails)
						: (currentCrm.odsDetails as any[]);
			} catch {}
		}
		const crmChecks = [
			Boolean(currentCrm?.isMonitoringParent),
			Boolean(currentCrm?.isMonitoringIndustry),
			Boolean(currentCrm?.isVocabComplete),
			Boolean(currentCrm?.practiceAttendance),
			Boolean(currentCrm?.isOds1Report || odsList[0]?.isDone),
			Boolean(currentCrm?.isOds2Report || odsList[1]?.isDone),
			Boolean(currentCrm?.isOds3Report || odsList[2]?.isDone),
			Boolean(currentCrm?.isOds4Report || odsList[3]?.isDone),
			Boolean(currentCrm?.isOds5Report || odsList[4]?.isDone),
			Boolean(currentCrm?.isPrammagangReport),
		];
		const count = crmChecks.filter(Boolean).length;
		const fallbackStatus: "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
			count === 10
				? "AMAN"
				: (count / 10) * 100 > 30
					? "PROSES"
					: "BUTUH_PERHATIAN";

		await db
			.update(crmData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
				status: fallbackStatus,
			})
			.where(eq(crmData.studentId, id));

		await invalidateCrmCaches(id);

		return { success: true };
	})

	// --- CRM DOCUMENTS ---
	.get("/:id/crm/documents", async ({ params }) => {
		const id = Number(params.id);
		const docs = await db.query.crmDocuments.findMany({
			where: eq(crmDocuments.studentId, id),
			orderBy: [desc(crmDocuments.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } },
			},
		});

		const grouped = docs.reduce(
			(acc, doc) => {
				if (!acc[doc.documentKey]) acc[doc.documentKey] = [];
				acc[doc.documentKey].push(doc);
				return acc;
			},
			{} as Record<string, typeof docs>,
		);

		return { success: true, data: grouped };
	})
	.post(
		"/:id/crm/upload/:documentKey",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			const id = Number(params.id);
			const documentKey = params.documentKey;

			const allowedKeys = [
				"parent_follow_up",
				"industry_monitoring",
				"vocab_book",
				"practice_attendance",
				"ods_report",
				"ods_documentation",
				"pramagang_report",
				"pramagang_documentation",
			];
			if (!allowedKeys.includes(documentKey)) {
				set.status = 400;
				return { success: false, message: "Document key tidak valid" };
			}

			const file = body.file as File;
			if (!file) {
				set.status = 400;
				return { success: false, message: "File tidak ditemukan" };
			}

			const MAX_SIZE = 10 * 1024 * 1024; // 10MB
			const allowedTypes = [
				"application/pdf",
				"image/jpeg",
				"image/png",
				"application/zip",
				"application/x-zip-compressed",
			];
			if (file.size > MAX_SIZE) {
				set.status = 400;
				return {
					success: false,
					message: "File terlalu besar (maksimal 10MB)",
				};
			}
			if (!allowedTypes.includes(file.type)) {
				set.status = 400;
				return {
					success: false,
					message: "Tipe file tidak diizinkan (PDF, JPG, PNG, ZIP)",
				};
			}

			// Upload via FileService — tidak boleh akses filesystem langsung
			let uploadResult: { id: string } | null = null;
			try {
				uploadResult = await fileService.uploadFile({
					file,
					studentId: id,
					category: "identity",
					panel: "crm",
					documentKey,
					uploadedBy: user.id,
				});
			} catch (err) {
				const error = err as Error;
				set.status = 400;
				return { success: false, message: error.message };
			}

			const fileUrl = `/files/${uploadResult.id}/download`;

			await db.insert(crmDocuments).values({
				studentId: id,
				documentKey,
				fileName: file.name,
				fileUrl,
				fileSize: file.size,
				mimeType: file.type,
				uploadedBy: user.id,
			});

			// Auto check corresponding CRM flag
			const flagMap: Record<string, string> = {
				ods_report: "isOds1Report",
				ods_1_report: "isOds1Report",
				ods_1: "isOds1Report",
				ods_2_report: "isOds2Report",
				ods_2: "isOds2Report",
				ods_3_report: "isOds3Report",
				ods_3: "isOds3Report",
				ods_4_report: "isOds4Report",
				ods_4: "isOds4Report",
				ods_5_report: "isOds5Report",
				ods_5: "isOds5Report",
				ods_documentation: "odsDocumentation",
				pramagang_report: "isPrammagangReport",
				pramagang_documentation: "isPrammagangDocumentation",
			};
			if (flagMap[documentKey]) {
				await db
					.update(crmData)
					.set({ [flagMap[documentKey]]: true, updatedAt: new Date() })
					.where(eq(crmData.studentId, id));
			}

			// Check all 5 ODS reports to update isOdsReport
			const allCrmDocs = await db.query.crmDocuments.findMany({
				where: eq(crmDocuments.studentId, id),
			});
			const has1 = allCrmDocs.some(
				(d) =>
					d.documentKey === "ods_1_report" ||
					d.documentKey === "ods_1" ||
					d.documentKey === "ods_report",
			);
			const has2 = allCrmDocs.some(
				(d) => d.documentKey === "ods_2_report" || d.documentKey === "ods_2",
			);
			const has3 = allCrmDocs.some(
				(d) => d.documentKey === "ods_3_report" || d.documentKey === "ods_3",
			);
			const has4 = allCrmDocs.some(
				(d) => d.documentKey === "ods_4_report" || d.documentKey === "ods_4",
			);
			const has5 = allCrmDocs.some(
				(d) => d.documentKey === "ods_5_report" || d.documentKey === "ods_5",
			);
			await db
				.update(crmData)
				.set({
					isOdsReport: has1 && has2 && has3 && has4 && has5,
					updatedAt: new Date(),
				})
				.where(eq(crmData.studentId, id));

			await invalidateCrmCaches(id);

			return { success: true, message: "File berhasil diupload" };
		},
		{
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.get("/:id/crm/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.crmDocuments.findFirst({
			where: eq(crmDocuments.id, docId),
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		const file = Bun.file(doc.fileUrl);
		if (!(await file.exists())) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan di server" };
		}

		return new Response(file, {
			headers: {
				"Content-Type": doc.mimeType || "application/octet-stream",
				"Content-Disposition": `inline; filename="${doc.fileName}"`,
			},
		});
	})
	.patch("/:id/crm/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!hasRole(user, "crm", "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(params.id);
		await db
			.update(crmDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(crmDocuments.id, Number(params.docId)));

		await invalidateCrmCaches(id);

		return { success: true };
	})
	.delete("/:id/crm/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!hasRole(user, "crm", "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(params.id);
		const docId = Number(params.docId);

		const doc = await db.query.crmDocuments.findFirst({
			where: eq(crmDocuments.id, docId),
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db.delete(crmDocuments).where(eq(crmDocuments.id, docId));

		// Check if any documents with the same documentKey remain for this student
		const remainingDocs = await db.query.crmDocuments.findMany({
			where: and(
				eq(crmDocuments.studentId, id),
				eq(crmDocuments.documentKey, doc.documentKey),
			),
		});

		if (remainingDocs.length === 0) {
			const flagMap: Record<string, string> = {
				ods_report: "isOds1Report",
				ods_1_report: "isOds1Report",
				ods_1: "isOds1Report",
				ods_2_report: "isOds2Report",
				ods_2: "isOds2Report",
				ods_3_report: "isOds3Report",
				ods_3: "isOds3Report",
				ods_4_report: "isOds4Report",
				ods_4: "isOds4Report",
				ods_5_report: "isOds5Report",
				ods_5: "isOds5Report",
				ods_documentation: "odsDocumentation",
				pramagang_report: "isPrammagangReport",
				pramagang_documentation: "isPrammagangDocumentation",
			};
			if (flagMap[doc.documentKey]) {
				await db
					.update(crmData)
					.set({ [flagMap[doc.documentKey]]: false, updatedAt: new Date() })
					.where(eq(crmData.studentId, id));
			}
		}

		// Re-evaluate isOdsReport
		const allCrmDocs = await db.query.crmDocuments.findMany({
			where: eq(crmDocuments.studentId, id),
		});
		const has1 = allCrmDocs.some(
			(d) =>
				d.documentKey === "ods_1_report" ||
				d.documentKey === "ods_1" ||
				d.documentKey === "ods_report",
		);
		const has2 = allCrmDocs.some(
			(d) => d.documentKey === "ods_2_report" || d.documentKey === "ods_2",
		);
		const has3 = allCrmDocs.some(
			(d) => d.documentKey === "ods_3_report" || d.documentKey === "ods_3",
		);
		const has4 = allCrmDocs.some(
			(d) => d.documentKey === "ods_4_report" || d.documentKey === "ods_4",
		);
		const has5 = allCrmDocs.some(
			(d) => d.documentKey === "ods_5_report" || d.documentKey === "ods_5",
		);
		await db
			.update(crmData)
			.set({
				isOdsReport: has1 && has2 && has3 && has4 && has5,
				updatedAt: new Date(),
			})
			.where(eq(crmData.studentId, id));

		await invalidateCrmCaches(id);
		return { success: true };
	});
