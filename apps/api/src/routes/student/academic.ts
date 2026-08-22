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
	courses,
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
	overseasProgramChecklists,
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
import { fileService } from "../../modules/file/service/file.service";

export const academicRoutes = new Elysia()
	.get("/:id/academic", async ({ params }) => {
		const id = Number(params.id);
		const academic = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } },
			},
		});
		return { success: true, data: academic };
	})
	.patch(
		"/:id/academic",
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
			const updates = body as Record<string, any>;

			const [current, overseasChecklist] = await Promise.all([
				db.query.academicData.findFirst({
					where: eq(academicData.studentId, id),
				}),
				db.query.overseasProgramChecklists.findFirst({
					where: eq(overseasProgramChecklists.studentId, id),
				}),
			]);

			const merged = { ...(current || {}), ...updates };

			let checked = 0;
			let totalRequired = 7;

			if (merged.pddiktiInput) checked++;
			if (merged.utsPassed) checked++;
			if (merged.uasPassed) checked++;
			if (merged.attitudeIndicator) checked++;
			if (merged.assignmentsCompleted) checked++;
			if (merged.academicCommunication) checked++;
			if (merged.assessmentCompleted) checked++;

			if (overseasChecklist && overseasChecklist.programType === "taiwan") {
				totalRequired += 12;
				if (overseasChecklist.pasFotoChecked) checked++;
				if (overseasChecklist.cvChecked) checked++;
				if (overseasChecklist.ktmChecked) checked++;
				if (overseasChecklist.khsChecked) checked++;
				if (overseasChecklist.sl21Checked) checked++;
				if (overseasChecklist.aktifChecked) checked++;
				if (overseasChecklist.gapYearChecked) checked++;
				if (overseasChecklist.pddiktiChecked) checked++;
				if (overseasChecklist.pribadiChecked) checked++;
				if (overseasChecklist.lolChecked) checked++;
				if (overseasChecklist.loaChecked) checked++;
				if (overseasChecklist.suhhanChecked) checked++;
			}

			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (checked === totalRequired) status = "AMAN";
			else if (checked >= Math.floor(totalRequired / 2))
				status = "PERLU_PERHATIAN";

			const cleanUpdates: Record<string, any> = {
				...updates,
				status,
				updatedAt: new Date(),
			};

			if (merged.isAcc && checked < totalRequired) {
				cleanUpdates.isAcc = false;
				cleanUpdates.accAt = null;
				cleanUpdates.accBy = null;
			}

			if (!current) {
				await db.insert(academicData).values({
					studentId: id,
					...cleanUpdates,
				});
			} else {
				await db
					.update(academicData)
					.set(cleanUpdates)
					.where(eq(academicData.studentId, id));
			}

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:list:*"),
				cacheInvalidatePattern(`cache:mahasiswa:*`),
			]);

			return { success: true };
		},
		{
			body: t.Record(t.String(), t.Any()),
		},
	)
	.post("/:id/academic/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		// Academic ACC allows "warning" bypass, so we just set isAcc to true regardless of check count
		await db
			.update(academicData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
			})
			.where(eq(academicData.studentId, id));

		return { success: true };
	})
	.delete("/:id/academic/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!hasRole(user, "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = Number(params.id);

		await db
			.update(academicData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
			})
			.where(eq(academicData.studentId, id));

		return { success: true };
	})
	.get("/:id/academic/documents", async ({ params }) => {
		const id = Number(params.id);
		const docs = await db.query.academicDocuments.findMany({
			where: eq(academicDocuments.studentId, id),
			orderBy: (t, { desc }) => [desc(t.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } },
			},
		});

		// Kelompokkan berdasarkan documentKey
		const grouped: Record<string, any[]> = {};
		for (const doc of docs) {
			if (!grouped[doc.documentKey]) grouped[doc.documentKey] = [];
			grouped[doc.documentKey].push(doc);
		}

		return { success: true, data: grouped };
	})
	.get("/:id/academic/documents/:docId/download", async ({ params, set }) => {
		const docId = Number(params.docId);
		const doc = await db.query.academicDocuments.findFirst({
			where: eq(academicDocuments.id, docId),
		});
		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}
		const file = Bun.file(doc.fileUrl);
		return new Response(file, {
			headers: {
				"Content-Type": doc.mimeType || "application/octet-stream",
				"Content-Disposition": `inline; filename="${doc.fileName}"`,
			},
		});
	})
	.patch("/:id/academic/documents/:docId/verify", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!hasRole(user, "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db
			.update(academicDocuments)
			.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
			.where(eq(academicDocuments.id, Number(params.docId)));

		return { success: true };
	})
	.delete("/:id/academic/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!hasRole(user, "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);
		const doc = await db.query.academicDocuments.findFirst({
			where: eq(academicDocuments.id, docId),
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db.delete(academicDocuments).where(eq(academicDocuments.id, docId));
		return { success: true };
	})

	// --- DOSEN ROUTES ---
	.get("/:id/course-grades", async ({ params }) => {
		const id = Number(params.id);
		const grades = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, id),
			orderBy: (grades, { asc }) => [asc(grades.id)],
			with: {
				accBy: { columns: { fullName: true } },
				course: true, // Mengambil data relasi dari tabel courses
			},
		});

		// Map hasilnya agar kompatibel dengan frontend yang masih membaca courseCode dan courseName
		const mappedGrades = grades.map((g) => ({
			...g,
			courseCode: g.course?.code || g.courseCode,
			courseName: g.course?.name || g.courseName,
		}));

		return { success: true, data: mappedGrades };
	})
	.post(
		"/:id/course-grades",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			if (!hasRole(user, "dosen", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = Number(params.id);
			const input = body as {
				courseCode: string;
				courseName: string;
				dosenId: number;
				hasKwu?: boolean;
			};

			// Cari courseId jika ada di master courses
			const matchingCourse = await db.query.courses.findFirst({
				where: eq(courses.code, input.courseCode),
			});

			await db.insert(courseGrades).values({
				studentId: id,
				courseId: matchingCourse?.id || null, // Hubungkan dengan master course
				courseCode: input.courseCode,
				courseName: input.courseName,
				dosenId: input.dosenId,
				hasKwu: input.hasKwu ?? false,
			});

			return { success: true };
		},
		{
			body: t.Object({
				courseCode: t.String(),
				courseName: t.String(),
				dosenId: t.Number(),
				hasKwu: t.Optional(t.Boolean()),
			}),
		},
	)
	.delete("/:id/course-grades/:courseId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (user?.role !== "superadmin" && user?.role !== "akademik") {
			set.status = 403;
			return {
				success: false,
				message: "Forbidden: Hanya Superadmin yang bisa menghapus MK",
			};
		}

		const courseId = Number(params.courseId);
		await db.delete(courseGrades).where(eq(courseGrades.id, courseId));

		return { success: true };
	})
	.patch(
		"/:id/course-grades/:courseId",
		async (context) => {
			const { params, body, set } = context;
			const id = Number(params.id);
			const courseId = Number(params.courseId);
			const user = (context as any).user;
			const updates = body as Record<string, any>;

			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			const current = await db.query.courseGrades.findFirst({
				where: eq(courseGrades.id, courseId),
			});

			if (!current) {
				set.status = 404;
				return { success: false, message: "Course not found" };
			}

			// Only superadmin, akademik, or the assigned dosen can edit
			if (!hasRole(user, "akademik") && current.dosenId !== user.id) {
				set.status = 403;
				return {
					success: false,
					message: "Forbidden: Not assigned to this course",
				};
			}

			const cleanUpdates: Record<string, any> = {
				...updates,
				updatedAt: new Date(),
			};

			// If attendancePresent and totalMeetings are updated, calculate attendanceRate
			if (
				cleanUpdates.attendancePresent !== undefined ||
				cleanUpdates.totalMeetings !== undefined
			) {
				const present =
					cleanUpdates.attendancePresent ?? current.attendancePresent ?? 0;
				const total = cleanUpdates.totalMeetings ?? current.totalMeetings ?? 16;
				cleanUpdates.attendanceRate =
					total > 0 ? Math.round((present / total) * 100) : 0;
			}

			await db
				.update(courseGrades)
				.set(cleanUpdates)
				.where(eq(courseGrades.id, courseId));

			// Recalculate status and calculated grade per MK
			const updated = await db.query.courseGrades.findFirst({
				where: eq(courseGrades.id, courseId),
			});
			if (updated) {
				let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
				const att = updated.attendanceRate || 0;
				const attitude = updated.attitudeNote || "Buruk";

				// Vocation Grade Calculation
				const practical = updated.practicalScore || 0;
				const theory = updated.theoryScore || 0;
				const kwu = updated.kwuScore || 0;

				// Calculate final grade (100 scale)
				// If no KWU, move the 15% weight to theory
				let calculatedGrade = 0;
				if (updated.hasKwu) {
					calculatedGrade =
						practical * 0.5 + theory * 0.2 + kwu * 0.15 + att * 0.15;
				} else {
					calculatedGrade = practical * 0.5 + theory * 0.35 + att * 0.15;
				}

				// Convert to letter grade
				let letterGrade = "E";
				if (calculatedGrade >= 85) letterGrade = "A";
				else if (calculatedGrade >= 80) letterGrade = "A-";
				else if (calculatedGrade >= 75) letterGrade = "B+";
				else if (calculatedGrade >= 70) letterGrade = "B";
				else if (calculatedGrade >= 65) letterGrade = "B-";
				else if (calculatedGrade >= 60) letterGrade = "C+";
				else if (calculatedGrade >= 55) letterGrade = "C";
				else if (calculatedGrade >= 40) letterGrade = "D";

				// Status logic from UI Plan v4.0
				const isAmanGrade = ["A", "A-", "B+", "B"].includes(letterGrade);
				const isPerhatianGrade = ["B-", "C+", "C"].includes(letterGrade);

				// New threshold: 90%
				if (att >= 90 && isAmanGrade && attitude === "Baik") {
					status = "AMAN";
				} else if (att >= 90 && isPerhatianGrade) {
					status = "PERLU_PERHATIAN";
				}
				// If att < 90, it auto locks and is TIDAK_AMAN

				await db
					.update(courseGrades)
					.set({ status, grade: letterGrade })
					.where(eq(courseGrades.id, courseId));
			}

			// Recalculate GPA and sync to academic_data
			const allGrades = await db.query.courseGrades.findMany({
				where: eq(courseGrades.studentId, id),
			});

			const gradePoints: Record<string, number> = {
				A: 400,
				"A-": 370,
				"B+": 330,
				B: 300,
				"B-": 270,
				"C+": 230,
				C: 200,
				D: 100,
				E: 0,
			};

			const totalPoints = allGrades.reduce(
				(sum, g) => sum + (gradePoints[g.grade || "E"] || 0),
				0,
			);
			const gpaScaled =
				allGrades.length > 0 ? Math.round(totalPoints / allGrades.length) : 0;

			const existingAcad = await db.query.academicData.findFirst({
				where: eq(academicData.studentId, id),
			});
			if (existingAcad) {
				await db
					.update(academicData)
					.set({ gpa: gpaScaled })
					.where(eq(academicData.studentId, id));
			} else {
				await db.insert(academicData).values({ studentId: id, gpa: gpaScaled });
			}

			return { success: true };
		},
		{
			body: t.Record(t.String(), t.Any()),
		},
	)
	.post("/:id/course-grades/:courseId/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const courseId = Number(params.courseId);

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const current = await db.query.courseGrades.findFirst({
			where: eq(courseGrades.id, courseId),
		});

		if (!current) {
			set.status = 404;
			return { success: false, message: "Course not found" };
		}

		if (!hasRole(user, "akademik") && current.dosenId !== user.id) {
			set.status = 403;
			return {
				success: false,
				message: "Forbidden: Not assigned to this course",
			};
		}

		await db
			.update(courseGrades)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
			})
			.where(eq(courseGrades.id, courseId));

		return { success: true };
	})
	.post("/:id/course-grades/:courseId/unlock", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const courseId = Number(params.courseId);

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		if (!hasRole(user, "akademik")) {
			set.status = 403;
			return {
				success: false,
				message: "Only Superadmin or Akademik can unlock courses",
			};
		}

		const current = await db.query.courseGrades.findFirst({
			where: eq(courseGrades.id, courseId),
		});

		if (!current) {
			set.status = 404;
			return { success: false, message: "Course not found" };
		}

		await db
			.update(courseGrades)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
			})
			.where(eq(courseGrades.id, courseId));

		return { success: true };
	})
	.post("/:id/course-grades/:courseId/upload/:documentKey", async (context) => {
		const { params, request, set } = context;
		const user = (context as any).user;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const id = Number(params.id);
		const courseId = Number(params.courseId);
		const documentKey = params.documentKey;

		const allowedKeys = [
			"attendance_proof",
			"grade_card",
			"dispensation",
			"product_photo",
		];
		if (!allowedKeys.includes(documentKey)) {
			set.status = 400;
			return { success: false, message: "Document key tidak valid" };
		}

		const formData = await request.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			set.status = 400;
			return { success: false, message: "File tidak ditemukan" };
		}

		const MAX_SIZE = 10 * 1024 * 1024;
		const allowedTypes = [
			"application/pdf",
			"image/jpeg",
			"image/png",
			"application/zip",
		];

		if (file.size > MAX_SIZE) {
			set.status = 400;
			return { success: false, message: "File terlalu besar (maks 10MB)" };
		}

		if (!allowedTypes.includes(file.type)) {
			set.status = 400;
			return { success: false, message: "Tipe file tidak diizinkan" };
		}

		// Upload via FileService
		let filePath: string;
		try {
			const uploadResult = await fileService.uploadFile({
				file,
				studentId: id,
				category: "academic",
				panel: "akademik",
				documentKey,
				uploadedBy: user.id,
			});
			filePath = `/files/${uploadResult.id}/download`;
		} catch (err) {
			const error = err as Error;
			set.status = 400;
			return { success: false, message: error.message };
		}

		await db.insert(courseGradeDocuments).values({
			studentId: id,
			courseGradeId: courseId,
			documentKey,
			fileName: file.name,
			fileUrl: filePath,
			fileSize: file.size,
			mimeType: file.type,
			uploadedBy: user.id,
		});

		if (documentKey === "product_photo") {
			await db
				.update(courseGrades)
				.set({ productPhotoUrl: filePath })
				.where(eq(courseGrades.id, courseId));
		}

		return {
			success: true,
			message: "File berhasil diunggah",
			fileUrl: filePath,
		};
	})
	.get("/:id/course-grades/:courseId/documents", async ({ params }) => {
		const courseId = Number(params.courseId);
		const docs = await db.query.courseGradeDocuments.findMany({
			where: eq(courseGradeDocuments.courseGradeId, courseId),
			orderBy: (t, { desc }) => [desc(t.uploadedAt)],
			with: {
				uploadedBy: { columns: { fullName: true } },
				verifiedBy: { columns: { fullName: true } },
			},
		});

		const grouped: Record<string, any[]> = {};
		for (const doc of docs) {
			if (!grouped[doc.documentKey]) grouped[doc.documentKey] = [];
			grouped[doc.documentKey].push(doc);
		}

		return { success: true, data: grouped };
	})
	.get(
		"/:id/course-grades/:courseId/documents/:docId/download",
		async ({ params, set }) => {
			const docId = Number(params.docId);
			const doc = await db.query.courseGradeDocuments.findFirst({
				where: eq(courseGradeDocuments.id, docId),
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
		},
	)
	.patch(
		"/:id/course-grades/:courseId/documents/:docId/verify",
		async (context) => {
			const { params, set } = context;
			const user = (context as any).user;

			if (!hasRole(user, "dosen", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db
				.update(courseGradeDocuments)
				.set({ isVerified: true, verifiedAt: new Date(), verifiedBy: user.id })
				.where(eq(courseGradeDocuments.id, Number(params.docId)));

			return { success: true };
		},
	)
	.delete("/:id/course-grades/:courseId/documents/:docId", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!hasRole(user, "dosen", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const docId = Number(params.docId);
		const doc = await db.query.courseGradeDocuments.findFirst({
			where: eq(courseGradeDocuments.id, docId),
		});

		if (!doc) {
			set.status = 404;
			return { success: false, message: "File tidak ditemukan" };
		}

		await db
			.delete(courseGradeDocuments)
			.where(eq(courseGradeDocuments.id, docId));
		return { success: true };
	})
	.get("/:id/attitude-logs", async ({ params }) => {
		const id = Number(params.id);
		const logs = await db.query.academicAttitudeLogs.findMany({
			where: eq(academicAttitudeLogs.studentId, id),
			with: { dosenId: { columns: { fullName: true } } },
			orderBy: (t, { desc }) => [desc(t.date)],
		});
		return { success: true, data: logs };
	})
	.post(
		"/:id/attitude-logs",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!hasRole(user, "dosen", "akademik")) {
				set.status = 403;
				return {
					success: false,
					message: "Only dosen or superadmin can post attitude logs",
				};
			}
			const input = body as any;
			await db.insert(academicAttitudeLogs).values({
				studentId: Number(params.id),
				courseGradeId: Number(input.courseGradeId),
				dosenId: user.id,
				disciplineScore: Number(input.disciplineScore),
				activenessScore: Number(input.activenessScore),
				date: new Date(input.date),
				notes: input.notes,
			});
			return { success: true };
		},
		{
			body: t.Object({
				courseGradeId: t.Any(),
				disciplineScore: t.Any(),
				activenessScore: t.Any(),
				date: t.Any(),
				notes: t.Optional(t.Any()),
			}),
		},
	)
	.get("/:id/entrepreneurship", async ({ params }) => {
		const id = Number(params.id);
		const logs = await db.query.entrepreneurshipRecords.findMany({
			where: eq(entrepreneurshipRecords.studentId, id),
			orderBy: (t, { desc }) => [desc(t.weekDate)],
		});
		return { success: true, data: logs };
	})
	.post(
		"/:id/entrepreneurship",
		async (context) => {
			const { params, body, set } = context;
			const input = body as any;

			// Auto calculate profit sharing (simplified logic as per UI plan)
			const revenue = Number(input.revenueTotal || 0);
			const share = Math.floor(revenue / 3);

			await db.insert(entrepreneurshipRecords).values({
				studentId: Number(params.id),
				courseGradeId: Number(input.courseGradeId),
				businessType: input.businessType,
				productionQty: Number(input.productionQty),
				revenueTotal: revenue,
				profitSharingStudent: share,
				profitSharingDosen: share,
				profitSharingLembaga: share,
				weekDate: new Date(input.weekDate),
				notes: input.notes,
			});

			// Calculate total kwu score for course grade
			const records = await db.query.entrepreneurshipRecords.findMany({
				where: eq(entrepreneurshipRecords.courseGradeId, input.courseGradeId),
			});

			// Sum up total revenue for the PKWU score
			const totalRevenue = records.reduce(
				(sum, r) => sum + (r.revenueTotal || 0),
				0,
			);

			await db
				.update(courseGrades)
				.set({ entrepreneurScore: totalRevenue })
				.where(eq(courseGrades.id, input.courseGradeId));

			return { success: true };
		},
		{
			body: t.Object({
				courseGradeId: t.Any(),
				businessType: t.Any(),
				productionQty: t.Any(),
				revenueTotal: t.Any(),
				weekDate: t.Any(),
				notes: t.Optional(t.Any()),
			}),
		},
	)
	.get("/:id/weekly-events", async ({ params }) => {
		const id = Number(params.id);
		const logs = await db.query.weeklyEvents.findMany({
			where: eq(weeklyEvents.studentId, id),
			orderBy: (t, { desc }) => [desc(t.eventDate)],
		});
		return { success: true, data: logs };
	})
	.post(
		"/:id/weekly-events",
		async (context) => {
			const { params, body } = context;
			const input = body as any;
			await db.insert(weeklyEvents).values({
				studentId: Number(params.id),
				eventType: input.eventType,
				eventDate: new Date(input.eventDate),
				description: input.description,
				documentUrl: input.documentUrl,
			});
			return { success: true };
		},
		{
			body: t.Object({
				eventType: t.Any(),
				eventDate: t.Any(),
				description: t.Optional(t.Any()),
				documentUrl: t.Optional(t.Any()),
			}),
		},
	);
