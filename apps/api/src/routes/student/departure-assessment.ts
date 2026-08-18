import { mkdir, unlink } from "node:fs/promises";
import { extname, join } from "node:path";
import { asc, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../../db";
import {
	departureAssessmentNotes,
	departureAssessments,
	students,
	users,
} from "../../db/schema";
import { hasRole } from "../../lib/permissions";

function computeStatus(
	score: number | null | undefined,
	fileUrl: string | null | undefined,
): string {
	const hasScore = score !== null && score !== undefined;
	const hasFile = Boolean(fileUrl);
	if (hasScore && hasFile) return "selesai";
	if (hasFile) return "pdf_diunggah";
	if (hasScore) return "nilai_diisi";
	return "belum_dimulai";
}

export const departureAssessmentRoutes = new Elysia()
	// GET /students/departure-assessments — daftar semua mahasiswa + assessment
	.get("/departure-assessments", async (context) => {
		const { set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		if (!hasRole(user, "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const allStudents = await db.query.students
			.findMany({
				where: eq(students.isArchived, false),
				columns: {
					id: true,
					name: true,
					nim: true,
					program: true,
					cohort: true,
					academicYear: true,
					subProgram: true,
					period: true,
				},
				with: {
					departureAssessment: true,
				},
				orderBy: [asc(students.name)],
			})
			.catch(async (err) => {
				console.error(
					"Drizzle Query API failed for allStudents, falling back:",
					err,
				);
				// Standard select fallback
				const baseStudents = await db
					.select()
					.from(students)
					.where(eq(students.isArchived, false));
				const assessments = await db.select().from(departureAssessments);

				return baseStudents.map((s) => ({
					...s,
					departureAssessment:
						assessments.find((a) => a.studentId === s.id) || null,
				}));
			});

		return { success: true, data: allStudents };
	})

	// GET /students/:id/departure-assessment — detail assessment per mahasiswa
	.get("/:id/departure-assessment", async (context) => {
		const { params, set } = context;
		try {
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			const id = Number(params.id);
			if (Number.isNaN(id)) {
				set.status = 400;
				return { success: false, message: "ID Mahasiswa tidak valid" };
			}

			const student = await db.query.students.findFirst({
				where: eq(students.id, id),
				columns: {
					id: true,
					name: true,
					nim: true,
					program: true,
					subProgram: true,
					cohort: true,
					academicYear: true,
					period: true,
					phone: true,
					email: true,
				},
			});

			if (!student) {
				set.status = 404;
				return { success: false, message: "Mahasiswa tidak ditemukan" };
			}

			// Fallback to select if query api fails
			let assessment: any = null;
			try {
				assessment = await db.query.departureAssessments.findFirst({
					where: eq(departureAssessments.studentId, id),
					with: {
						assessedByUser: { columns: { fullName: true, username: true } },
					},
				});
			} catch (qErr) {
				console.error(
					"Drizzle Query API failed, falling back to select:",
					qErr,
				);
				const results = await db
					.select()
					.from(departureAssessments)
					.where(eq(departureAssessments.studentId, id))
					.limit(1);
				assessment = results[0] || null;
			}

			return {
				success: true,
				data: { student, assessment: assessment ?? null },
			};
		} catch (error: any) {
			console.error("GET departure-assessment error:", error);
			set.status = 500;
			return {
				success: false,
				message: error.message || "Internal Server Error",
			};
		}
	})

	// PATCH /students/:id/departure-assessment — simpan/update nilai & catatan
	.patch(
		"/:id/departure-assessment",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}
			if (!hasRole(user, "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = Number(params.id);
			const { score, notes } = body;

			// Validasi score
			if (score !== null && score !== undefined) {
				if (score < 0 || score > 100) {
					set.status = 400;
					return { success: false, message: "Nilai harus antara 0-100" };
				}
			}

			const existing = await db.query.departureAssessments.findFirst({
				where: eq(departureAssessments.studentId, id),
			});

			const newStatus = computeStatus(
				score !== undefined ? score : existing?.score,
				existing?.resultFileUrl,
			);

			if (existing) {
				await db
					.update(departureAssessments)
					.set({
						...(score !== undefined && { score }),
						...(notes !== undefined && { notes }),
						status: newStatus,
						assessedBy: user.id,
						assessedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(departureAssessments.studentId, id));
			} else {
				await db.insert(departureAssessments).values({
					studentId: id,
					score: score ?? null,
					notes: notes ?? null,
					status: newStatus,
					assessedBy: user.id,
					assessedAt: new Date(),
				});
			}

			const updated = await db.query.departureAssessments.findFirst({
				where: eq(departureAssessments.studentId, id),
				with: {
					assessedByUser: { columns: { fullName: true } },
				},
			});

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				score: t.Optional(t.Nullable(t.Number())),
				notes: t.Optional(t.Nullable(t.String())),
			}),
		},
	)

	// POST /students/:id/departure-assessment/upload — upload PDF hasil assessment
	.post(
		"/:id/departure-assessment/upload",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}
			if (!hasRole(user, "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = Number(params.id);
			const file = body.file as File;

			if (!file || file.size === 0) {
				set.status = 400;
				return { success: false, message: "File tidak ditemukan" };
			}

			const ext = extname(file.name).toLowerCase();
			if (ext !== ".pdf" && file.type !== "application/pdf") {
				set.status = 400;
				return { success: false, message: "Hanya file PDF yang diizinkan" };
			}

			const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
			if (file.size > MAX_FILE_SIZE) {
				set.status = 400;
				return { success: false, message: "Ukuran file maksimal 10MB" };
			}

			// Hapus file lama jika ada
			const existing = await db.query.departureAssessments.findFirst({
				where: eq(departureAssessments.studentId, id),
			});

			if (existing?.resultFileUrl) {
				try {
					const oldPath = join(
						process.cwd(),
						"uploads",
						existing.resultFileUrl,
					);
					await unlink(oldPath);
				} catch (_) {
					// File lama mungkin tidak ada, lanjutkan
				}
			}

			// Simpan file baru
			const dir = join(
				process.cwd(),
				"uploads",
				"departure_assessments",
				String(id),
			);
			await mkdir(dir, { recursive: true });
			const fileName = `hasil_assessment_${Date.now()}.pdf`;
			const filePath = join(dir, fileName);
			await Bun.write(filePath, await file.arrayBuffer());

			const relativeUrl = `departure_assessments/${id}/${fileName}`;

			const newStatus = computeStatus(existing?.score, relativeUrl);

			if (existing) {
				await db
					.update(departureAssessments)
					.set({
						resultFileUrl: relativeUrl,
						resultFileName: file.name,
						resultFileSize: file.size,
						status: newStatus,
						assessedBy: user.id,
						assessedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(departureAssessments.studentId, id));
			} else {
				await db.insert(departureAssessments).values({
					studentId: id,
					resultFileUrl: relativeUrl,
					resultFileName: file.name,
					resultFileSize: file.size,
					status: newStatus,
					assessedBy: user.id,
					assessedAt: new Date(),
				});
			}

			const updated = await db.query.departureAssessments.findFirst({
				where: eq(departureAssessments.studentId, id),
				with: { assessedByUser: { columns: { fullName: true } } },
			});

			return { success: true, data: updated };
		},
		{
			body: t.Object({ file: t.File() }),
		},
	)

	// GET /students/:id/departure-assessment/file-view — serve PDF untuk iframe viewer
	.get("/:id/departure-assessment/file-view", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return "Unauthorized";
		}

		const id = Number(params.id);
		if (Number.isNaN(id)) {
			set.status = 400;
			return "ID tidak valid";
		}

		const assessment = await db.query.departureAssessments.findFirst({
			where: eq(departureAssessments.studentId, id),
		});

		if (!assessment?.resultFileUrl) {
			set.status = 404;
			return "File tidak ditemukan";
		}

		const filePath = join(process.cwd(), "uploads", assessment.resultFileUrl);
		const file = Bun.file(filePath);

		if (!(await file.exists())) {
			set.status = 404;
			return "File fisik tidak ditemukan";
		}

		return file;
	})

	// DELETE /students/:id/departure-assessment/file — hapus file PDF
	.delete("/:id/departure-assessment/file", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		if (!hasRole(user, "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(params.id);

		const existing = await db.query.departureAssessments.findFirst({
			where: eq(departureAssessments.studentId, id),
		});

		if (!existing?.resultFileUrl) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		try {
			const filePath = join(process.cwd(), "uploads", existing.resultFileUrl);
			await unlink(filePath);
		} catch (_) {
			// lanjutkan meski file fisik tidak ada
		}

		const newStatus = computeStatus(existing.score, null);

		await db
			.update(departureAssessments)
			.set({
				resultFileUrl: null,
				resultFileName: null,
				resultFileSize: null,
				status: newStatus,
				updatedAt: new Date(),
			})
			.where(eq(departureAssessments.studentId, id));

		return { success: true, message: "File berhasil dihapus" };
	})

	// GET /students/:id/departure-assessment/notes — list catatan
	.get("/:id/departure-assessment/notes", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const id = Number(params.id);
		if (Number.isNaN(id)) {
			set.status = 400;
			return { success: false, message: "ID tidak valid" };
		}

		const assessment = await db.query.departureAssessments.findFirst({
			where: eq(departureAssessments.studentId, id),
		});

		if (!assessment) {
			return { success: true, data: [] };
		}

		const notes = await db.query.departureAssessmentNotes.findMany({
			where: eq(departureAssessmentNotes.assessmentId, assessment.id),
			with: {
				author: { columns: { fullName: true, username: true } },
			},
			orderBy: [desc(departureAssessmentNotes.createdAt)],
		});

		return { success: true, data: notes };
	})

	// POST /students/:id/departure-assessment/notes — tambah catatan
	.post(
		"/:id/departure-assessment/notes",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}
			if (!hasRole(user, "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = Number(params.id);
			const { content } = body;

			if (!content?.trim()) {
				set.status = 400;
				return { success: false, message: "Konten catatan tidak boleh kosong" };
			}

			// Pastikan assessment ada, buat jika belum ada
			let assessment = await db.query.departureAssessments.findFirst({
				where: eq(departureAssessments.studentId, id),
			});

			if (!assessment) {
				const inserted = await db
					.insert(departureAssessments)
					.values({
						studentId: id,
						status: "belum_dimulai",
						assessedBy: user.id,
						assessedAt: new Date(),
					})
					.returning();
				assessment = inserted[0];
			}

			const inserted = await db
				.insert(departureAssessmentNotes)
				.values({
					assessmentId: assessment.id,
					content: content.trim(),
					createdBy: user.id,
				})
				.returning();

			const note = await db.query.departureAssessmentNotes.findFirst({
				where: eq(departureAssessmentNotes.id, inserted[0].id),
				with: {
					author: { columns: { fullName: true, username: true } },
				},
			});

			return { success: true, data: note };
		},
		{
			body: t.Object({
				content: t.String(),
			}),
		},
	)

	// PATCH /students/:id/departure-assessment/notes/:noteId — edit catatan
	.patch(
		"/:id/departure-assessment/notes/:noteId",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}
			if (!hasRole(user, "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const noteId = Number(params.noteId);
			const { content } = body;

			if (!content?.trim()) {
				set.status = 400;
				return { success: false, message: "Konten catatan tidak boleh kosong" };
			}

			const existing = await db.query.departureAssessmentNotes.findFirst({
				where: eq(departureAssessmentNotes.id, noteId),
			});

			if (!existing) {
				set.status = 404;
				return { success: false, message: "Catatan tidak ditemukan" };
			}

			await db
				.update(departureAssessmentNotes)
				.set({ content: content.trim(), updatedAt: new Date() })
				.where(eq(departureAssessmentNotes.id, noteId));

			const updated = await db.query.departureAssessmentNotes.findFirst({
				where: eq(departureAssessmentNotes.id, noteId),
				with: {
					author: { columns: { fullName: true, username: true } },
				},
			});

			return { success: true, data: updated };
		},
		{
			body: t.Object({
				content: t.String(),
			}),
		},
	)

	// DELETE /students/:id/departure-assessment/notes/:noteId — hapus catatan
	.delete("/:id/departure-assessment/notes/:noteId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		if (!hasRole(user, "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const noteId = Number(params.noteId);

		const existing = await db.query.departureAssessmentNotes.findFirst({
			where: eq(departureAssessmentNotes.id, noteId),
		});

		if (!existing) {
			set.status = 404;
			return { success: false, message: "Catatan tidak ditemukan" };
		}

		await db
			.delete(departureAssessmentNotes)
			.where(eq(departureAssessmentNotes.id, noteId));

		return { success: true, message: "Catatan berhasil dihapus" };
	});
