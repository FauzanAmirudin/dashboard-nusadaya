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
	paStudentNotes,
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

export const paRoutes = new Elysia()
	.get("/:id/pa", async (context) => {
		const id = Number(context.params.id);
		const [
			pa,
			vLogs,
			cLogs,
			tripartiteLogs,
			interviewLogs,
			hafalanSessions,
			studentNotes,
		] = await Promise.all([
			db.query.paData.findFirst({
				where: eq(paData.studentId, id),
				with: {
					accBy: true,
				},
			}),
			db.query.vocabLogs.findMany({
				where: eq(vocabLogs.studentId, id),
				orderBy: [desc(vocabLogs.date)],
			}),
			db.query.counselingLogs.findMany({
				where: eq(counselingLogs.studentId, id),
				orderBy: [desc(counselingLogs.date)],
			}),
			db.query.paTripartiteLogs.findMany({
				where: eq(paTripartiteLogs.studentId, id),
				orderBy: (logs, { desc }) => [desc(logs.contactDate)],
			}),
			db.query.paInterviewLogs.findMany({
				where: eq(paInterviewLogs.studentId, id),
				orderBy: (logs, { desc }) => [desc(logs.interviewDate)],
			}),
			db.query.paHafalanSessions
				.findMany({
					where: eq(paHafalanSessions.studentId, id),
					with: {
						createdByUser: { columns: { fullName: true, username: true } },
					},
					orderBy: [desc(paHafalanSessions.createdAt)],
				})
				.catch(() =>
					db
						.select()
						.from(paHafalanSessions)
						.where(eq(paHafalanSessions.studentId, id)),
				),
			db.query.paStudentNotes
				.findMany({
					where: eq(paStudentNotes.studentId, id),
					with: {
						createdByUser: { columns: { fullName: true, username: true } },
					},
					orderBy: [desc(paStudentNotes.createdAt)],
				})
				.catch(() =>
					db
						.select()
						.from(paStudentNotes)
						.where(eq(paStudentNotes.studentId, id)),
				),
		]);

		let resolvedPa = pa;
		if (!resolvedPa) {
			await db.insert(paData).values({ studentId: id });
			resolvedPa = await db.query.paData.findFirst({
				where: eq(paData.studentId, id),
				with: { accBy: true },
			});
		}

		return {
			success: true,
			data: {
				data: resolvedPa,
				vocabLogs: vLogs,
				counselingLogs: cLogs,
				tripartiteLogs: tripartiteLogs,
				interviewLogs: interviewLogs,
				hafalanSessions,
				studentNotes,
			},
		};
	})
	.patch(
		"/:id/pa",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			if (!hasRole(user, "superadmin", "pmb", "akademik", "pa")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			// 1. Handle Dosen PA assignment to student record
			if ((body as any).paId !== undefined) {
				await db
					.update(students)
					.set({
						paId: (body as any).paId ? Number((body as any).paId) : null,
						updatedAt: new Date(),
					})
					.where(eq(students.id, id));
			}

			// 2. Handle PA checklist fields
			const hasChecklistFields =
				(body as any).counselingDone !== undefined ||
				(body as any).mentalStable !== undefined ||
				(body as any).disciplineGood !== undefined ||
				(body as any).vocabTarget !== undefined ||
				(body as any).disciplineNotes !== undefined;

			if (hasChecklistFields) {
				const pa = await db.query.paData.findFirst({
					where: eq(paData.studentId, id),
				});
				if (!pa) {
					await db.insert(paData).values({ studentId: id });
				}

				const currentPa = await db.query.paData.findFirst({
					where: eq(paData.studentId, id),
				});
				if (currentPa?.isAcc && !hasRole(user, "superadmin")) {
					set.status = 403;
					return { success: false, message: "Cannot edit after ACC" };
				}

				const updatePayload: Record<string, unknown> = {
					updatedAt: new Date(),
				};
				if ((body as any).counselingDone !== undefined)
					updatePayload.counselingDone = (body as any).counselingDone;
				if ((body as any).mentalStable !== undefined)
					updatePayload.mentalStable = (body as any).mentalStable;
				if ((body as any).disciplineGood !== undefined)
					updatePayload.disciplineGood = (body as any).disciplineGood;
				if ((body as any).vocabTarget !== undefined)
					updatePayload.vocabTarget = (body as any).vocabTarget;
				if ((body as any).disciplineNotes !== undefined)
					updatePayload.disciplineNotes = (body as any).disciplineNotes;

				await db
					.update(paData)
					.set(updatePayload)
					.where(eq(paData.studentId, id));

				// Update status
				const updatedPa = await db.query.paData.findFirst({
					where: eq(paData.studentId, id),
				});
				if (updatedPa) {
					const checks = [
						updatedPa.counselingDone,
						updatedPa.mentalStable,
						updatedPa.disciplineGood,
					];
					const completed = checks.filter(Boolean).length;
					let status: "ACC" | "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
						"BUTUH_PERHATIAN";
					if (updatedPa.isAcc) status = "ACC";
					else if (completed === 3) status = "AMAN";
					else if (completed > 0) status = "PROSES";

					await db
						.update(paData)
						.set({ status })
						.where(eq(paData.studentId, id));
				}
			}

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:*"),
				cacheInvalidatePattern("cache:mahasiswa:*"),
				cacheInvalidatePattern("cache:dashboard:*"),
			]);

			return { success: true, message: "Data PA berhasil diperbarui" };
		},
		{
			body: t.Object({
				paId: t.Optional(t.Nullable(t.Number())),
				counselingDone: t.Optional(t.Boolean()),
				mentalStable: t.Optional(t.Boolean()),
				disciplineGood: t.Optional(t.Boolean()),
				vocabTarget: t.Optional(t.Number()),
				disciplineNotes: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/:id/pa/vocabulary",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			if (!hasRole(user, "pa", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db.insert(vocabLogs).values({
				studentId: id,
				addedWords: (body as any).addedWords,
				date: new Date((body as any).date),
				notes: (body as any).notes,
			});

			return { success: true };
		},
		{
			body: t.Object({
				addedWords: t.Number(),
				date: t.String(),
				notes: t.Optional(t.String()),
			}),
		},
	)
	.delete("/:id/pa/vocabulary/:logId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const logId = Number(params.logId);

		if (!hasRole(user, "pa", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.delete(vocabLogs).where(eq(vocabLogs.id, logId));
		return { success: true };
	})
	.post(
		"/:id/pa/counseling",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			if (!hasRole(user, "pa", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db.insert(counselingLogs).values({
				studentId: id,
				type: (body as any).type || "konseling",
				condition: (body as any).condition,
				date: new Date((body as any).date),
				notes: (body as any).notes,
			});

			return { success: true };
		},
		{
			body: t.Object({
				type: t.Optional(t.String()),
				condition: t.String(),
				date: t.String(),
				notes: t.String(),
			}),
		},
	)
	.delete("/:id/pa/counseling/:logId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const logId = Number(params.logId);

		if (!hasRole(user, "pa", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.delete(counselingLogs).where(eq(counselingLogs.id, logId));
		return { success: true };
	})
	.post(
		"/:id/pa/hafalan",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);
			if (!hasRole(user, "pa", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const { language, languageCustom, vocabCount, sentenceCount, date } =
				body as any;
			const inserted = await db
				.insert(paHafalanSessions)
				.values({
					studentId: id,
					language,
					languageCustom: languageCustom ?? null,
					vocabCount: vocabCount ?? 0,
					sentenceCount: sentenceCount ?? 0,
					createdAt: date ? new Date(date) : new Date(),
					createdBy: user.id,
				})
				.returning();
			return { success: true, data: inserted[0] };
		},
		{
			body: t.Object({
				language: t.String(),
				languageCustom: t.Optional(t.Nullable(t.String())),
				vocabCount: t.Optional(t.Number()),
				sentenceCount: t.Optional(t.Number()),
				date: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/:id/pa/hafalan/:logId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "pa", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const logId = Number(params.logId);
			const { language, languageCustom, vocabCount, sentenceCount, date } =
				body as any;
			const updateData: any = {
				language,
				languageCustom: languageCustom ?? null,
				vocabCount,
				sentenceCount,
				updatedAt: new Date(),
			};
			if (date) {
				updateData.createdAt = new Date(date);
			}
			await db
				.update(paHafalanSessions)
				.set(updateData)
				.where(eq(paHafalanSessions.id, logId));
			return { success: true };
		},
		{
			body: t.Object({
				language: t.String(),
				languageCustom: t.Optional(t.Nullable(t.String())),
				vocabCount: t.Number(),
				sentenceCount: t.Number(),
				date: t.Optional(t.String()),
			}),
		},
	)
	.delete("/:id/pa/hafalan/:logId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!hasRole(user, "pa", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(paHafalanSessions)
			.where(eq(paHafalanSessions.id, Number(params.logId)));
		return { success: true };
	})
	.post(
		"/:id/pa/student-notes",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);
			if (!hasRole(user, "pa", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const { type, content } = body as any;
			const inserted = await db
				.insert(paStudentNotes)
				.values({
					studentId: id,
					type,
					content,
					createdBy: user.id,
				})
				.returning();
			return { success: true, data: inserted[0] };
		},
		{
			body: t.Object({
				type: t.String(),
				content: t.String(),
			}),
		},
	)
	.patch(
		"/:id/pa/student-notes/:noteId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "pa", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const noteId = Number(params.noteId);
			const { content } = body as any;
			await db
				.update(paStudentNotes)
				.set({ content, updatedAt: new Date() })
				.where(eq(paStudentNotes.id, noteId));
			return { success: true };
		},
		{
			body: t.Object({ content: t.String() }),
		},
	)
	.delete("/:id/pa/student-notes/:noteId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!hasRole(user, "pa", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(paStudentNotes)
			.where(eq(paStudentNotes.id, Number(params.noteId)));
		return { success: true };
	})
	.post("/:id/pa/acc", async ({ params, set, user }: any) => {
		if (!hasRole(user, "pa")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);
		const pa = await db.query.paData.findFirst({
			where: eq(paData.studentId, id),
		});
		if (!pa?.counselingDone || !pa?.mentalStable || !pa?.disciplineGood) {
			set.status = 400;
			return {
				success: false,
				message:
					"Semua indikator evaluasi PA (Konseling, Mental Stabil, Disiplin) harus selesai sebelum memberikan ACC.",
			};
		}
		await db
			.update(paData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
				status: "ACC",
				updatedAt: new Date(),
			})
			.where(eq(paData.studentId, id));
		return { success: true };
	})
	.delete("/:id/pa/acc", async ({ params, set, user }: any) => {
		if (!hasRole(user, "pa")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);
		const pa = await db.query.paData.findFirst({
			where: eq(paData.studentId, id),
		});
		let fallbackStatus: "AMAN" | "PROSES" | "BUTUH_PERHATIAN" =
			"BUTUH_PERHATIAN";
		if (pa) {
			const checks = [pa.counselingDone, pa.mentalStable, pa.disciplineGood];
			const completed = checks.filter(Boolean).length;
			fallbackStatus =
				completed === 3 ? "AMAN" : completed > 0 ? "PROSES" : "BUTUH_PERHATIAN";
		}
		await db
			.update(paData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
				status: fallbackStatus,
				updatedAt: new Date(),
			})
			.where(eq(paData.studentId, id));
		return { success: true };
	})
	.post("/:id/pa/tripartite", async ({ params, body, set, user }: any) => {
		if (!hasRole(user, "pa", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const b = body as any;
		await db.insert(paTripartiteLogs).values({
			studentId: Number(params.id),
			contactDate: new Date(b.contactDate || b.date || Date.now()),
			contactName: b.contactName || b.parentName || null,
			contactType: b.contactType || b.contactMethod || "Orang Tua",
			summary: b.summary || b.topic || "-",
			result: b.result || null,
			createdBy: user.id,
		});
		return { success: true };
	})
	.delete("/:id/pa/tripartite/:logId", async ({ params, set, user }: any) => {
		if (!hasRole(user, "pa", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(paTripartiteLogs)
			.where(eq(paTripartiteLogs.id, Number(params.logId)));
		return { success: true };
	})
	.post("/:id/pa/interview", async ({ params, body, set, user }: any) => {
		if (!hasRole(user, "pa", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const b = body as any;
		await db.insert(paInterviewLogs).values({
			studentId: Number(params.id),
			interviewDate: new Date(b.interviewDate || b.date || Date.now()),
			companyName: b.companyName || b.company || "N/A",
			country: b.country || null,
			result: b.result || "Menunggu",
			notes: b.notes || null,
			createdBy: user.id,
		});
		return { success: true };
	})
	.delete("/:id/pa/interview/:logId", async ({ params, set, user }: any) => {
		if (!hasRole(user, "pa", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(paInterviewLogs)
			.where(eq(paInterviewLogs.id, Number(params.logId)));
		return { success: true };
	});
