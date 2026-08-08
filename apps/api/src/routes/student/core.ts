import { mkdir } from "node:fs/promises";
import { join } from "node:path";
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
	studentHealth,
	studentParents,
	students,
	users,
	vocabLogs,
	weeklyEvents,
} from "../../db/schema";
import { requireRole } from "../../middleware/rbac";

export async function createStudentPipeline(body: any, userId: number) {
	// 1. Validasi email & nim
	if (body.nim) {
		const existingNim = await db.query.students.findFirst({
			where: eq(students.nim, body.nim),
		});
		if (existingNim) {
			throw new Error("NIM sudah terdaftar");
		}
	}
	if (body.email) {
		const existingEmail = await db.query.students.findFirst({
			where: eq(students.email, body.email),
		});
		if (existingEmail) {
			throw new Error("Email sudah terdaftar");
		}
	}

	// 2. Buat User Account untuk Mahasiswa
	const passwordHash = await Bun.password.hash("nusadaya123"); // Default password
	const [newUser] = await db
		.insert(users)
		.values({
			username: body.nim || body.email || `mhs_${Date.now()}`, // Username pakai NIM atau Email jika kosong
			passwordHash,
			fullName: body.name,
			role: "mahasiswa",
		})
		.returning();

	// 3. Insert student
	const [newStudent] = await db
		.insert(students)
		.values({
			nim: body.nim || null,
			name: body.name,
			nickname: body.nickname,
			cohort: body.cohort,
			program: body.program,
			subProgram: body.subProgram,
			birthPlace: body.birthPlace,
			birthDate: body.birthDate ? new Date(body.birthDate) : null,
			gender: body.gender,
			religion: body.religion,
			nationality: body.nationality,
			addressStreet: body.addressStreet,
			addressRt: body.addressRt,
			addressRw: body.addressRw,
			addressNo: body.addressNo,
			addressVillage: body.addressVillage,
			addressDistrict: body.addressDistrict,
			addressCity: body.addressCity,
			addressProvince: body.addressProvince,
			livingWith: body.livingWith,
			schoolOrigin: body.schoolOrigin,
			schoolAddress: body.schoolAddress,
			schoolMajor: body.schoolMajor,
			graduationYear: body.graduationYear,
			classType: body.classType,
			academicYear: body.academicYear,
			batch: body.batch,
			phone: body.phone,
			email: body.email,
			profilePhotoUrl: body.profilePhotoUrl,
			paId: body.paId,
			studentStatus: body.studentStatus || "aktif",
			destinationCountry: body.destinationCountry,
			period: body.period,
			studentUserId: newUser.id, // Relasi ke akun login
		})
		.returning();

	const studentId = newStudent.id;

	// 4. Insert Student Health
	await db.insert(studentHealth).values({
		studentId,
		bloodType: body.bloodType,
		diseaseHistory: body.diseaseHistory,
		congenitalDisease: body.congenitalDisease,
		height: body.height,
		weight: body.weight,
		clothingSize: body.clothingSize,
	});

	// 5. Insert Student Parents (Ayah, Ibu, Wali)
	if (body.parents && body.parents.length > 0) {
		const parentInserts = body.parents.map((p: any) => ({
			studentId,
			type: p.type,
			name: p.name,
			birthPlace: p.birthPlace,
			birthDate: p.birthDate ? new Date(p.birthDate) : null,
			religion: p.religion,
			nationality: p.nationality,
			education: p.education,
			job: p.job,
			address: p.address,
			phone: p.phone,
			email: p.email,
			status: p.status,
			guardianRelation: p.guardianRelation,
		}));
		await db.insert(studentParents).values(parentInserts);
	}

	// 6. Initialize related panels
	await Promise.all([
		db.insert(pmbData).values({
			studentId,
			rekomendasi: body.rekomendasi,
			timVisit: body.timVisit,
			timSosialisasi: body.timSosialisasi,
			roReferral: body.roReferral,
			mitraSponsor: body.mitraSponsor,
			koordinator: body.koordinator,
		}),
		db.insert(pmbPaymentPlan).values({ studentId }),
		db.insert(crmData).values({ studentId }),
		db.insert(financeData).values({ studentId }),
		db.insert(academicData).values({ studentId }),
		db.insert(paData).values({ studentId }),
		db.insert(internshipData).values({ studentId }),
		db.insert(finalDecision).values({ studentId }),
	]);

	// 7. Catat di auditLogs
	await db.insert(auditLogs).values({
		userId: userId,
		action: "CREATE_STUDENT",
		entity: "students",
		entityId: studentId,
		details: { nim: newStudent.nim, name: newStudent.name },
	});

	return { student: newStudent };
}

export const coreRoutes = new Elysia()
	.get("/", async ({ query }) => {
		const isArchived = query?.archived === "true";
		const results = await db
			.select({
				student: students,
				pmb: pmbData,
				crm: crmData,
				finance: financeData,
				academic: academicData,
				pa: paData,
				internship: internshipData,
				decision: finalDecision,
			})
			.from(students)
			.leftJoin(pmbData, eq(students.id, pmbData.studentId))
			.leftJoin(crmData, eq(students.id, crmData.studentId))
			.leftJoin(financeData, eq(students.id, financeData.studentId))
			.leftJoin(academicData, eq(students.id, academicData.studentId))
			.leftJoin(paData, eq(students.id, paData.studentId))
			.leftJoin(internshipData, eq(students.id, internshipData.studentId))
			.leftJoin(finalDecision, eq(students.id, finalDecision.studentId))
			.where(eq(students.isArchived, isArchived));
		const allCourseGrades = await db.select().from(courseGrades);

		const dataWithCourses = results.map((r) => {
			const courses = allCourseGrades.filter(
				(c) => c.studentId === r.student.id,
			);
			return { ...r, courseGrades: courses };
		});

		return { success: true, data: dataWithCourses };
	})
	.post(
		"/",
		async ({ body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			try {
				const result = await createStudentPipeline(body, user.id);
				return { success: true, data: result.student };
			} catch (error: any) {
				set.status = 400;
				return { success: false, message: error.message };
			}
		},
		{
			body: t.Object({
				// Tab 1
				nim: t.Optional(t.String()),
				name: t.String(),
				nickname: t.Optional(t.String()),
				gender: t.Optional(t.String()),
				birthPlace: t.Optional(t.String()),
				birthDate: t.Optional(t.String()), // ISO string
				religion: t.Optional(t.String()),
				nationality: t.Optional(t.String()),
				addressStreet: t.Optional(t.String()),
				addressRt: t.Optional(t.String()),
				addressRw: t.Optional(t.String()),
				addressNo: t.Optional(t.String()),
				addressVillage: t.Optional(t.String()),
				addressDistrict: t.Optional(t.String()),
				addressCity: t.Optional(t.String()),
				addressProvince: t.Optional(t.String()),
				livingWith: t.Optional(t.String()),
				phone: t.Optional(t.String()),
				email: t.Optional(t.String()),
				profilePhotoUrl: t.Optional(t.String()),

				// Tab 2
				schoolOrigin: t.Optional(t.String()),
				schoolAddress: t.Optional(t.String()),
				schoolMajor: t.Optional(t.String()),
				graduationYear: t.Optional(t.Number()),
				program: t.String(),
				subProgram: t.Optional(t.String()),
				classType: t.Optional(t.String()),
				batch: t.Optional(t.Number()),
				academicYear: t.Optional(t.String()),
				cohort: t.Number(),

				// Tab 3
				bloodType: t.Optional(t.String()),
				diseaseHistory: t.Optional(t.String()),
				congenitalDisease: t.Optional(t.String()),
				height: t.Optional(t.Number()),
				weight: t.Optional(t.Number()),
				clothingSize: t.Optional(t.String()),

				// Tab 4, 5, 6
				parents: t.Optional(
					t.Array(
						t.Object({
							type: t.String(), // "ayah" | "ibu" | "wali"
							name: t.Optional(t.String()),
							birthPlace: t.Optional(t.String()),
							birthDate: t.Optional(t.String()), // ISO string
							religion: t.Optional(t.String()),
							nationality: t.Optional(t.String()),
							education: t.Optional(t.String()),
							job: t.Optional(t.String()),
							address: t.Optional(t.String()),
							phone: t.Optional(t.String()),
							email: t.Optional(t.String()),
							status: t.Optional(t.String()),
							guardianRelation: t.Optional(t.String()),
						}),
					),
				),

				paId: t.Optional(t.Number()),
				studentStatus: t.Optional(t.String()),
				destinationCountry: t.Optional(t.String()),
				period: t.Optional(t.String()),
				rekomendasi: t.Optional(t.String()),
				timVisit: t.Optional(t.String()),
				timSosialisasi: t.Optional(t.String()),
				roReferral: t.Optional(t.String()),
				mitraSponsor: t.Optional(t.String()),
				koordinator: t.Optional(t.String()),
			}),
		},
	)
	.put(
		"/:id",
		async ({ params, body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);

			// 1. Validasi email & nim (kalau berubah)
			if (body.nim) {
				const existingNim = await db.query.students.findFirst({
					where: eq(students.nim, body.nim),
				});
				if (existingNim && existingNim.id !== id) {
					set.status = 400;
					return { success: false, message: "NIM sudah terdaftar" };
				}
			}
			if (body.email) {
				const existingEmail = await db.query.students.findFirst({
					where: eq(students.email, body.email),
				});
				if (existingEmail && existingEmail.id !== id) {
					set.status = 400;
					return { success: false, message: "Email sudah terdaftar" };
				}
			}

			// 2. Update student
			await db
				.update(students)
				.set({
					nim: body.nim || null,
					name: body.name,
					nickname: body.nickname,
					cohort: body.cohort,
					program: body.program,
					subProgram: body.subProgram,
					birthPlace: body.birthPlace,
					birthDate: body.birthDate ? new Date(body.birthDate) : null,
					gender: body.gender,
					religion: body.religion,
					nationality: body.nationality,
					addressStreet: body.addressStreet,
					addressRt: body.addressRt,
					addressRw: body.addressRw,
					addressNo: body.addressNo,
					addressVillage: body.addressVillage,
					addressDistrict: body.addressDistrict,
					addressCity: body.addressCity,
					addressProvince: body.addressProvince,
					livingWith: body.livingWith,
					schoolOrigin: body.schoolOrigin,
					schoolAddress: body.schoolAddress,
					schoolMajor: body.schoolMajor,
					graduationYear: body.graduationYear,
					classType: body.classType,
					academicYear: body.academicYear,
					batch: body.batch,
					phone: body.phone,
					email: body.email,
					profilePhotoUrl: body.profilePhotoUrl,
					paId: body.paId,
					studentStatus: body.studentStatus || "aktif",
					destinationCountry: body.destinationCountry,
					period: body.period,
					updatedAt: new Date(),
				})
				.where(eq(students.id, id));

			// 3. Update Student Health
			await db
				.update(studentHealth)
				.set({
					bloodType: body.bloodType,
					diseaseHistory: body.diseaseHistory,
					congenitalDisease: body.congenitalDisease,
					height: body.height,
					weight: body.weight,
					clothingSize: body.clothingSize,
					updatedAt: new Date(),
				})
				.where(eq(studentHealth.studentId, id));

			// 4. Update Student Parents (Ayah, Ibu, Wali)
			await db.delete(studentParents).where(eq(studentParents.studentId, id));

			if (body.parents && body.parents.length > 0) {
				const parentInserts = body.parents.map((p: any) => ({
					studentId: id,
					type: p.type,
					name: p.name,
					birthPlace: p.birthPlace,
					birthDate: p.birthDate ? new Date(p.birthDate) : null,
					religion: p.religion,
					nationality: p.nationality,
					education: p.education,
					job: p.job,
					address: p.address,
					phone: p.phone,
					email: p.email,
					status: p.status,
					guardianRelation: p.guardianRelation,
				}));
				await db.insert(studentParents).values(parentInserts);
			}

			// 5. Update PMB Data
			await db
				.update(pmbData)
				.set({
					rekomendasi: body.rekomendasi,
					timVisit: body.timVisit,
					timSosialisasi: body.timSosialisasi,
					roReferral: body.roReferral,
					mitraSponsor: body.mitraSponsor,
					koordinator: body.koordinator,
					updatedAt: new Date(),
				})
				.where(eq(pmbData.studentId, id));

			// 6. Catat di auditLogs
			await db.insert(auditLogs).values({
				userId: user.id,
				action: "UPDATE_STUDENT",
				entity: "students",
				entityId: id,
				details: { nim: body.nim, name: body.name },
			});

			return { success: true };
		},
		{
			body: t.Object({
				// Tab 1
				nim: t.Optional(t.String()),
				name: t.String(),
				nickname: t.Optional(t.String()),
				gender: t.Optional(t.String()),
				birthPlace: t.Optional(t.String()),
				birthDate: t.Optional(t.String()),
				religion: t.Optional(t.String()),
				nationality: t.Optional(t.String()),
				addressStreet: t.Optional(t.String()),
				addressRt: t.Optional(t.String()),
				addressRw: t.Optional(t.String()),
				addressNo: t.Optional(t.String()),
				addressVillage: t.Optional(t.String()),
				addressDistrict: t.Optional(t.String()),
				addressCity: t.Optional(t.String()),
				addressProvince: t.Optional(t.String()),
				livingWith: t.Optional(t.String()),
				phone: t.Optional(t.String()),
				email: t.Optional(t.String()),
				profilePhotoUrl: t.Optional(t.String()),

				// Tab 2
				schoolOrigin: t.Optional(t.String()),
				schoolAddress: t.Optional(t.String()),
				schoolMajor: t.Optional(t.String()),
				graduationYear: t.Optional(t.Number()),
				program: t.String(),
				subProgram: t.Optional(t.String()),
				classType: t.Optional(t.String()),
				batch: t.Optional(t.Number()),
				academicYear: t.Optional(t.String()),
				cohort: t.Number(),

				// Tab 3
				bloodType: t.Optional(t.String()),
				diseaseHistory: t.Optional(t.String()),
				congenitalDisease: t.Optional(t.String()),
				height: t.Optional(t.Number()),
				weight: t.Optional(t.Number()),
				clothingSize: t.Optional(t.String()),

				// Tab 4, 5, 6
				parents: t.Optional(
					t.Array(
						t.Object({
							type: t.String(),
							name: t.Optional(t.String()),
							birthPlace: t.Optional(t.String()),
							birthDate: t.Optional(t.String()),
							religion: t.Optional(t.String()),
							nationality: t.Optional(t.String()),
							education: t.Optional(t.String()),
							job: t.Optional(t.String()),
							address: t.Optional(t.String()),
							phone: t.Optional(t.String()),
							email: t.Optional(t.String()),
							status: t.Optional(t.String()),
							guardianRelation: t.Optional(t.String()),
						}),
					),
				),

				paId: t.Optional(t.Number()),
				studentStatus: t.Optional(t.String()),
				destinationCountry: t.Optional(t.String()),
				period: t.Optional(t.String()),
				rekomendasi: t.Optional(t.String()),
				timVisit: t.Optional(t.String()),
				timSosialisasi: t.Optional(t.String()),
				roReferral: t.Optional(t.String()),
				mitraSponsor: t.Optional(t.String()),
				koordinator: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/:id",
		async ({ params, body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);

			// If nim changed, validate unique
			if (body.nim) {
				const existing = await db.query.students.findFirst({
					where: eq(students.nim, body.nim),
				});
				if (existing && existing.id !== id) {
					set.status = 400;
					return { success: false, message: "NIM sudah terdaftar" };
				}
			}

			await db
				.update(students)
				.set({
					...body,
					updatedAt: new Date(),
				})
				.where(eq(students.id, id));

			return { success: true };
		},
		{
			body: t.Object({
				nim: t.Optional(t.String()),
				name: t.Optional(t.String()),
				cohort: t.Optional(t.Number()),
				program: t.Optional(t.String()),
				subProgram: t.Optional(t.String()),
				phone: t.Optional(t.String()),
				parentName: t.Optional(t.String()),
				paId: t.Optional(t.Number()),
				studentStatus: t.Optional(t.String()),
				destinationCountry: t.Optional(t.String()),
				period: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/:id/profile-photo",
		async ({ params, body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			const file = body.file as File;

			if (!file) {
				set.status = 400;
				return { success: false, message: "Tidak ada file yang diupload" };
			}

			const uploadDir = join(process.cwd(), "uploads", "profile");
			await mkdir(uploadDir, { recursive: true });

			const fileName = `student_${id}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
			const filePath = join(uploadDir, fileName);

			const fileBuffer = await file.arrayBuffer();
			await Bun.write(filePath, fileBuffer);

			const fileUrl = `/uploads/profile/${fileName}`;

			await db
				.update(students)
				.set({ profilePhotoUrl: fileUrl, updatedAt: new Date() })
				.where(eq(students.id, id));

			return { success: true, url: fileUrl };
		},
		{
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.patch("/:id/archive", async ({ params, set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);
		await db
			.update(students)
			.set({ isArchived: true, updatedAt: new Date() })
			.where(eq(students.id, id));
		return { success: true, message: "Berhasil mengarsipkan mahasiswa" };
	})
	.post("/:id/generate-account", async ({ params, set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);

		const studentData = await db.query.students.findFirst({
			where: eq(students.id, id),
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Mahasiswa tidak ditemukan" };
		}

		if (studentData.studentUserId) {
			set.status = 400;
			return { success: false, message: "Mahasiswa sudah memiliki akun" };
		}

		// Generate account
		const passwordHash = await Bun.password.hash("password");

		const [newUser] = await db
			.insert(users)
			.values({
				username:
					studentData.nim || studentData.email || `mhs_${studentData.id}`,
				passwordHash,
				fullName: studentData.name,
				role: "mahasiswa",
			})
			.returning();

		await db
			.update(students)
			.set({ studentUserId: newUser.id, updatedAt: new Date() })
			.where(eq(students.id, id));

		return {
			success: true,
			message:
				"Akun mahasiswa berhasil dibuat dengan password default: password",
		};
	})
	.patch("/:id/unarchive", async ({ params, set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);
		await db
			.update(students)
			.set({ isArchived: false, updatedAt: new Date() })
			.where(eq(students.id, id));
		return {
			success: true,
			message: "Berhasil memulihkan mahasiswa dari arsip",
		};
	})
	.delete("/:id", async ({ params, set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return {
				success: false,
				message: "Forbidden: Only superadmin or pmb can delete",
			};
		}
		const id = parseInt(params.id, 10);

		// Hapus seluruh data relasional karena tidak memakai CASCADE di schema
		await db.delete(pmbDocuments).where(eq(pmbDocuments.studentId, id));
		await db.delete(pmbData).where(eq(pmbData.studentId, id));

		await db.delete(crmDocuments).where(eq(crmDocuments.studentId, id));
		await db.delete(crmLogs).where(eq(crmLogs.studentId, id));
		await db.delete(crmData).where(eq(crmData.studentId, id));

		await db.delete(financeDocuments).where(eq(financeDocuments.studentId, id));
		await db.delete(financeData).where(eq(financeData.studentId, id));

		await db
			.delete(courseGradeDocuments)
			.where(eq(courseGradeDocuments.studentId, id));
		await db.delete(courseGrades).where(eq(courseGrades.studentId, id));
		await db
			.delete(academicDocuments)
			.where(eq(academicDocuments.studentId, id));
		await db.delete(academicData).where(eq(academicData.studentId, id));

		await db.delete(vocabLogs).where(eq(vocabLogs.studentId, id));
		await db.delete(counselingLogs).where(eq(counselingLogs.studentId, id));
		await db.delete(paData).where(eq(paData.studentId, id));

		await db.delete(internshipData).where(eq(internshipData.studentId, id));
		await db.delete(finalDecision).where(eq(finalDecision.studentId, id));
		await db.delete(internalNotes).where(eq(internalNotes.studentId, id));
		await db
			.delete(auditLogs)
			.where(and(eq(auditLogs.entity, "student"), eq(auditLogs.entityId, id)));

		// Hapus data utama
		await db.delete(students).where(eq(students.id, id));

		return {
			success: true,
			message: "Berhasil menghapus mahasiswa beserta seluruh data terkait",
		};
	})
	.get("/:id", async ({ params, set }) => {
		const id = parseInt(params.id, 10);
		if (Number.isNaN(id)) {
			set.status = 400;
			return { success: false, message: "Invalid ID" };
		}

		const student = await db.query.students.findFirst({
			where: eq(students.id, id),
		});

		if (!student) {
			set.status = 404;
			return { success: false, message: "Student not found" };
		}

		const [
			pmb,
			pmbPayment,
			crm,
			finance,
			academic,
			pa,
			internship,
			decision,
			grades,
			parents,
		] = await Promise.all([
			db.query.pmbData.findFirst({
				where: eq(pmbData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.pmbPaymentPlan.findFirst({
				where: eq(pmbPaymentPlan.studentId, id),
			}),
			db.query.crmData.findFirst({
				where: eq(crmData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.financeData.findFirst({
				where: eq(financeData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.academicData.findFirst({
				where: eq(academicData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.paData.findFirst({
				where: eq(paData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.internshipData.findFirst({
				where: eq(internshipData.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.finalDecision.findFirst({
				where: eq(finalDecision.studentId, id),
			}),
			db.query.courseGrades.findMany({
				where: eq(courseGrades.studentId, id),
				with: { accBy: { columns: { fullName: true } } },
			}),
			db.query.studentParents.findMany({
				where: eq(studentParents.studentId, id),
			}),
		]);

		return {
			success: true,
			data: {
				student,
				pmb: pmb ? { ...pmb, paymentPlan: pmbPayment, finance } : null,
				crm,
				finance,
				academic,
				pa,
				internship,
				decision,
				courseGrades: grades,
				parents,
			},
		};
	})
	.get("/:id/health", async ({ params, set, user }: any) => {
		const id = parseInt(params.id, 10);
		const data = await db.query.studentHealth.findFirst({
			where: eq(studentHealth.studentId, id),
		});
		return { success: true, data };
	})
	.get("/:id/parents", async ({ params, set, user }: any) => {
		const id = parseInt(params.id, 10);
		const data = await db.query.studentParents.findMany({
			where: eq(studentParents.studentId, id),
		});
		return { success: true, data };
	})
	// GET list of all PA users (for dropdown)
	.get("/pa-list", async ({ set, user }: any) => {
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const paUsers = await db
			.select({ id: users.id, fullName: users.fullName })
			.from(users)
			.where(eq(users.role, "pa"));
		return { success: true, data: paUsers };
	})
	// PATCH student status
	.patch(
		"/:id/student-status",
		async ({ params, body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			await db
				.update(students)
				.set({ studentStatus: body.studentStatus, updatedAt: new Date() })
				.where(eq(students.id, id));
			return { success: true, message: "Status mahasiswa berhasil diperbarui" };
		},
		{
			body: t.Object({
				studentStatus: t.String(),
			}),
		},
	)
	// PATCH student NIM
	.patch(
		"/:id/nim",
		async ({ params, body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			// Check for duplicate NIM (exclude self)
			if (body.nim) {
				const existing = await db.query.students.findFirst({
					where: eq(students.nim, body.nim),
				});
				if (existing && existing.id !== id) {
					set.status = 400;
					return {
						success: false,
						message: "NIM sudah digunakan oleh mahasiswa lain",
					};
				}
			}
			await db
				.update(students)
				.set({ nim: body.nim || null, updatedAt: new Date() })
				.where(eq(students.id, id));
			return { success: true, message: "NIM mahasiswa berhasil diperbarui" };
		},
		{
			body: t.Object({
				nim: t.Optional(t.String()),
			}),
		},
	)
	// PATCH student PA assignment
	.patch(
		"/:id/pa",
		async ({ params, body, set, user }: any) => {
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			await db
				.update(students)
				.set({ paId: body.paId ?? null, updatedAt: new Date() })
				.where(eq(students.id, id));
			return { success: true, message: "PA mahasiswa berhasil diperbarui" };
		},
		{
			body: t.Object({
				paId: t.Optional(t.Nullable(t.Number())),
			}),
		},
	);
