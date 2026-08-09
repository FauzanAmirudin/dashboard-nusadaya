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

export const internalNotesRoutes = new Elysia()
	.get("/:id/internal-notes", async (context) => {
		const { params, query, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		// Semua role kecuali "dosen" boleh mengakses
		if (!user || user.role === "dosen") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const typeFilter = (query as any).type;

		const notes = await db.query.internalNotes.findMany({
			where:
				typeFilter && typeFilter !== "semua"
					? and(
							eq(internalNotes.studentId, id),
							eq(internalNotes.noteType, typeFilter),
						)
					: eq(internalNotes.studentId, id),
			with: {
				author: true,
			},
			orderBy: [desc(internalNotes.createdAt)],
		});

		return { success: true, data: notes };
	})
	.post(
		"/:id/internal-notes",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			// Hanya superadmin, akademik, pa yang bisa menulis
			const canWrite = ["superadmin", "akademik", "pa"].includes(user?.role);
			if (!user || !canWrite) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const [newNote] = await db
				.insert(internalNotes)
				.values({
					studentId: id,
					authorId: user.id,
					note: (body as any).note,
					noteType: (body as any).noteType || "informasi_umum",
					validFrom: (body as any).validFrom
						? new Date((body as any).validFrom)
						: null,
					validUntil: (body as any).validUntil
						? new Date((body as any).validUntil)
						: null,
				})
				.returning();

			return { success: true, data: newNote };
		},
		{
			body: t.Object({
				note: t.String({ minLength: 5 }),
				noteType: t.Optional(t.String()),
				validFrom: t.Optional(t.Nullable(t.String())),
				validUntil: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.patch(
		"/:id/internal-notes/:noteId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const noteId = Number(params.noteId);

			const existingNote = await db.query.internalNotes.findFirst({
				where: eq(internalNotes.id, noteId),
			});

			if (!existingNote) {
				set.status = 404;
				return { success: false, message: "Catatan tidak ditemukan" };
			}

			const isAuthor = existingNote.authorId === user.id;
			const isSuperadmin = user.role === "superadmin";

			if (!isAuthor && !isSuperadmin) {
				set.status = 403;
				return {
					success: false,
					message:
						"Forbidden — hanya penulis atau superadmin yang bisa mengedit",
				};
			}

			await db
				.update(internalNotes)
				.set({
					note: (body as any).note,
					noteType: (body as any).noteType,
					validFrom: (body as any).validFrom
						? new Date((body as any).validFrom)
						: null,
					validUntil: (body as any).validUntil
						? new Date((body as any).validUntil)
						: null,
					updatedAt: new Date(),
				})
				.where(eq(internalNotes.id, noteId));

			return { success: true };
		},
		{
			body: t.Object({
				note: t.String({ minLength: 5 }),
				noteType: t.Optional(t.String()),
				validFrom: t.Optional(t.Nullable(t.String())),
				validUntil: t.Optional(t.Nullable(t.String())),
			}),
		},
	)
	.delete("/:id/internal-notes/:noteId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const noteId = Number(params.noteId);

		const existingNote = await db.query.internalNotes.findFirst({
			where: eq(internalNotes.id, noteId),
		});

		if (!existingNote) {
			set.status = 404;
			return { success: false, message: "Catatan tidak ditemukan" };
		}

		const isAuthor = existingNote.authorId === user.id;
		const isSuperadmin = user.role === "superadmin";

		if (!isAuthor && !isSuperadmin) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.delete(internalNotes).where(eq(internalNotes.id, noteId));

		return { success: true };
	});
