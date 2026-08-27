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
import { hasRole } from "../../lib/permissions";
import { requireRole } from "../../middleware/rbac";

export const internalNotesRoutes = new Elysia()
	.get("/:id/internal-notes", async (context) => {
		const { params, query, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		// Semua role staf kecuali "dosen" murni boleh mengakses
		if (
			!hasRole(
				user,
				"superadmin",
				"akademik",
				"pa",
				"pmb",
				"crm",
				"finance",
				"magang",
				"evaluator",
			)
		) {
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

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const rawValidFrom = (body as any).validFrom;
			const rawValidUntil = (body as any).validUntil;
			const validFrom = rawValidFrom ? new Date(rawValidFrom) : null;
			const validUntil = rawValidUntil ? new Date(rawValidUntil) : null;

			if (validFrom) {
				const vf = new Date(validFrom);
				vf.setHours(0, 0, 0, 0);
				if (vf < today) {
					set.status = 400;
					return {
						success: false,
						message: "Tanggal mulai tidak boleh tanggal lampau (mundur)",
					};
				}
			}

			if (validUntil) {
				const vu = new Date(validUntil);
				vu.setHours(0, 0, 0, 0);
				if (vu < today) {
					set.status = 400;
					return {
						success: false,
						message: "Tanggal berakhir tidak boleh tanggal lampau (mundur)",
					};
				}
			}

			if (validFrom && validUntil && validFrom > validUntil) {
				set.status = 400;
				return {
					success: false,
					message: "Tanggal mulai tidak boleh lebih dari tanggal berakhir",
				};
			}

			const [newNote] = await db
				.insert(internalNotes)
				.values({
					studentId: id,
					authorId: user.id,
					note: (body as any).note,
					noteType: (body as any).noteType || "informasi_umum",
					validFrom,
					validUntil,
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
			const isSuperadmin = hasRole(user, "superadmin");

			if (!isAuthor && !isSuperadmin) {
				set.status = 403;
				return {
					success: false,
					message:
						"Forbidden — hanya penulis atau superadmin yang bisa mengedit",
				};
			}

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const rawValidFrom = (body as any).validFrom;
			const rawValidUntil = (body as any).validUntil;
			const validFrom = rawValidFrom ? new Date(rawValidFrom) : null;
			const validUntil = rawValidUntil ? new Date(rawValidUntil) : null;

			if (validFrom) {
				const vf = new Date(validFrom);
				vf.setHours(0, 0, 0, 0);
				if (vf < today) {
					set.status = 400;
					return {
						success: false,
						message: "Tanggal mulai tidak boleh tanggal lampau (mundur)",
					};
				}
			}

			if (validUntil) {
				const vu = new Date(validUntil);
				vu.setHours(0, 0, 0, 0);
				if (vu < today) {
					set.status = 400;
					return {
						success: false,
						message: "Tanggal berakhir tidak boleh tanggal lampau (mundur)",
					};
				}
			}

			if (validFrom && validUntil && validFrom > validUntil) {
				set.status = 400;
				return {
					success: false,
					message: "Tanggal mulai tidak boleh lebih dari tanggal berakhir",
				};
			}

			await db
				.update(internalNotes)
				.set({
					note: (body as any).note,
					noteType: (body as any).noteType,
					validFrom,
					validUntil,
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
		const isSuperadmin = hasRole(user, "superadmin");

		if (!isAuthor && !isSuperadmin) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.delete(internalNotes).where(eq(internalNotes.id, noteId));

		return { success: true };
	});
