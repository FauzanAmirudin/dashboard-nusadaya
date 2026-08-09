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
import { requireRole } from "../../middleware/rbac";

export const paRoutes = new Elysia()
	.get("/:id/pa", async (context) => {
		const id = Number(context.params.id);
		let pa = await db.query.paData.findFirst({
			where: eq(paData.studentId, id),
			with: {
				accBy: true,
			},
		});

		if (!pa) {
			await db.insert(paData).values({ studentId: id });
			pa = await db.query.paData.findFirst({
				where: eq(paData.studentId, id),
				with: {
					accBy: true,
				},
			});
		}

		const vLogs = await db.query.vocabLogs.findMany({
			where: eq(vocabLogs.studentId, id),
			orderBy: [desc(vocabLogs.date)],
		});

		const cLogs = await db.query.counselingLogs.findMany({
			where: eq(counselingLogs.studentId, id),
			orderBy: [desc(counselingLogs.date)],
		});

		const tripartiteLogs = await db.query.paTripartiteLogs.findMany({
			where: eq(paTripartiteLogs.studentId, id),
			orderBy: (logs, { desc }) => [desc(logs.contactDate)],
		});

		const interviewLogs = await db.query.paInterviewLogs.findMany({
			where: eq(paInterviewLogs.studentId, id),
			orderBy: (logs, { desc }) => [desc(logs.interviewDate)],
		});

		return {
			success: true,
			data: {
				data: pa,
				vocabLogs: vLogs,
				counselingLogs: cLogs,
				tripartiteLogs: tripartiteLogs,
				interviewLogs: interviewLogs,
			},
		};
	})
	.patch(
		"/:id/pa",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const pa = await db.query.paData.findFirst({
				where: eq(paData.studentId, id),
			});
			if (!pa) return { success: false, message: "PA data not found" };

			if (pa.isAcc && user.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Cannot edit after ACC" };
			}

			await db
				.update(paData)
				.set({
					...(body as any),
					updatedAt: new Date(),
				})
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
				let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
				if (completed === 3) status = "AMAN";
				else if (completed > 0) status = "PERLU_PERHATIAN";

				await db.update(paData).set({ status }).where(eq(paData.studentId, id));
			}

			return { success: true };
		},
		{
			body: t.Object({
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

			if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
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

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
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

			if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db.insert(counselingLogs).values({
				studentId: id,
				condition: (body as any).condition,
				date: new Date((body as any).date),
				notes: (body as any).notes,
			});

			return { success: true };
		},
		{
			body: t.Object({
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

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.delete(counselingLogs).where(eq(counselingLogs.id, logId));
		return { success: true };
	})
	.post("/:id/pa/acc", async ({ params, set, user }: any) => {
		if (user?.role !== "pa" && user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);
		await db
			.update(paData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
				updatedAt: new Date(),
			})
			.where(eq(paData.studentId, id));
		return { success: true };
	})
	.delete("/:id/pa/acc", async ({ params, set, user }: any) => {
		if (user?.role !== "pa" && user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);
		await db
			.update(paData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
				updatedAt: new Date(),
			})
			.where(eq(paData.studentId, id));
		return { success: true };
	})
	.post("/:id/pa/tripartite", async ({ params, body, set, user }: any) => {
		if (user?.role !== "pa" && user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db.insert(paTripartiteLogs).values({
			studentId: Number(params.id),
			contactDate: new Date((body as any).contactDate),
			contactName: (body as any).parentName, // frontend might send parentName
			contactType: (body as any).contactMethod || "Orang Tua", // frontend contactMethod -> contactType
			summary: (body as any).topic, // frontend topic -> summary
			result: (body as any).result,
			createdBy: user.id,
		});
		return { success: true };
	})
	.delete("/:id/pa/tripartite/:logId", async ({ params, set, user }: any) => {
		if (user?.role !== "pa" && user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(paTripartiteLogs)
			.where(eq(paTripartiteLogs.id, Number(params.logId)));
		return { success: true };
	})
	.post("/:id/pa/interview", async ({ params, body, set, user }: any) => {
		if (user?.role !== "pa" && user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db.insert(paInterviewLogs).values({
			studentId: Number(params.id),
			interviewDate: new Date((body as any).interviewDate),
			companyName: "N/A", // Default if frontend doesn't send it yet
			country: (body as any).country,
			result: (body as any).result,
			notes: (body as any).notes,
			createdBy: user.id,
		});
		return { success: true };
	})
	.delete("/:id/pa/interview/:logId", async ({ params, set, user }: any) => {
		if (user?.role !== "pa" && user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(paInterviewLogs)
			.where(eq(paInterviewLogs.id, Number(params.logId)));
		return { success: true };
	});
