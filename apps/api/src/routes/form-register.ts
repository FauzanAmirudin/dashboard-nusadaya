import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { pmbFormResponses, pmbFormTokens, students, users } from "../db/schema";
import { createStudentPipeline } from "./student/core";

export const formRegisterRoutes = new Elysia()
	// 1. PUBLIC: Validate Token
	.get("/form/:token", async ({ params, set }) => {
		const tokenRecord = await db.query.pmbFormTokens.findFirst({
			where: eq(pmbFormTokens.token, params.token),
		});

		if (!tokenRecord) {
			set.status = 404;
			return { valid: false, message: "Token tidak ditemukan" };
		}

		if (tokenRecord.isUsed) {
			set.status = 400;
			return { valid: false, message: "Token sudah digunakan" };
		}

		return { valid: true };
	})
	// 2. PUBLIC: Submit Form
	.post(
		"/form/:token/submit",
		async ({ params, body, set }) => {
			const tokenRecord = await db.query.pmbFormTokens.findFirst({
				where: eq(pmbFormTokens.token, params.token),
			});

			if (!tokenRecord || tokenRecord.isUsed) {
				set.status = 400;
				return {
					valid: false,
					message: "Token tidak valid atau sudah digunakan",
				};
			}

			// Format data
			const insertData: any = { ...body };
			if (insertData.birthDate)
				insertData.birthDate = new Date(insertData.birthDate);
			if (insertData.ayahBirthDate)
				insertData.ayahBirthDate = new Date(insertData.ayahBirthDate);
			if (insertData.ibuBirthDate)
				insertData.ibuBirthDate = new Date(insertData.ibuBirthDate);
			if (insertData.waliBirthDate)
				insertData.waliBirthDate = new Date(insertData.waliBirthDate);

			if (insertData.graduationYear)
				insertData.graduationYear = Number(insertData.graduationYear);
			if (insertData.batch) insertData.batch = Number(insertData.batch);
			if (insertData.height) insertData.height = Number(insertData.height);
			if (insertData.weight) insertData.weight = Number(insertData.weight);

			// Save Response
			await db.transaction(async (tx) => {
				await tx.insert(pmbFormResponses).values({
					tokenId: tokenRecord.id,
					status: "PENDING",
					...insertData,
				});

				await tx
					.update(pmbFormTokens)
					.set({ isUsed: true, usedAt: new Date() })
					.where(eq(pmbFormTokens.id, tokenRecord.id));
			});

			return { success: true };
		},
		{
			body: t.Object({
				// Tab 1
				name: t.String(),
				nickname: t.Optional(t.String()),
				gender: t.Optional(t.String()),
				birthPlace: t.Optional(t.String()),
				birthDate: t.Optional(t.Any()), // Will be parsed/saved as Date or string
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
				graduationYear: t.Optional(t.Any()),
				program: t.Optional(t.String()),
				subProgram: t.Optional(t.String()),
				classType: t.Optional(t.String()),
				batch: t.Optional(t.Any()),
				academicYear: t.Optional(t.String()),

				// Tab 3
				bloodType: t.Optional(t.String()),
				diseaseHistory: t.Optional(t.String()),
				congenitalDisease: t.Optional(t.String()),
				height: t.Optional(t.Any()),
				weight: t.Optional(t.Any()),
				clothingSize: t.Optional(t.String()),

				// Tab 4
				ayahName: t.Optional(t.String()),
				ayahBirthPlace: t.Optional(t.String()),
				ayahBirthDate: t.Optional(t.Any()),
				ayahReligion: t.Optional(t.String()),
				ayahNationality: t.Optional(t.String()),
				ayahEducation: t.Optional(t.String()),
				ayahJob: t.Optional(t.String()),
				ayahAddress: t.Optional(t.String()),
				ayahPhone: t.Optional(t.String()),
				ayahEmail: t.Optional(t.String()),
				ayahStatus: t.Optional(t.String()),

				// Tab 5
				ibuName: t.Optional(t.String()),
				ibuBirthPlace: t.Optional(t.String()),
				ibuBirthDate: t.Optional(t.Any()),
				ibuReligion: t.Optional(t.String()),
				ibuNationality: t.Optional(t.String()),
				ibuEducation: t.Optional(t.String()),
				ibuJob: t.Optional(t.String()),
				ibuAddress: t.Optional(t.String()),
				ibuPhone: t.Optional(t.String()),
				ibuEmail: t.Optional(t.String()),
				ibuStatus: t.Optional(t.String()),

				// Tab 6
				waliName: t.Optional(t.String()),
				waliBirthPlace: t.Optional(t.String()),
				waliBirthDate: t.Optional(t.Any()),
				waliReligion: t.Optional(t.String()),
				waliNationality: t.Optional(t.String()),
				waliEducation: t.Optional(t.String()),
				waliJob: t.Optional(t.String()),
				waliAddress: t.Optional(t.String()),
				waliPhone: t.Optional(t.String()),
				waliEmail: t.Optional(t.String()),
				waliGuardianRelation: t.Optional(t.String()),
			}),
		},
	)
	// 3. ADMIN: Generate Token
	.post("/pmb/form-tokens", async (context) => {
		const user = (context as any).user;
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			context.set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const token = crypto.randomUUID();
		await db.insert(pmbFormTokens).values({
			token,
			createdBy: user.id,
		});

		return { success: true, data: { token } };
	})
	// 4. ADMIN: Get Tokens List
	.get("/pmb/form-tokens", async (context) => {
		const user = (context as any).user;
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			context.set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const tokens = await db.query.pmbFormTokens.findMany({
			with: {
				creator: { columns: { fullName: true } },
				response: { columns: { name: true } },
			},
			orderBy: [desc(pmbFormTokens.createdAt)],
		});
		return { success: true, data: tokens };
	})
	// 5. ADMIN: Get Pending Responses
	.get("/pmb/form-responses", async (context) => {
		const user = (context as any).user;
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			context.set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const responses = await db.query.pmbFormResponses.findMany({
			where: eq(pmbFormResponses.status, "PENDING"),
			orderBy: [desc(pmbFormResponses.submittedAt)],
		});
		return { success: true, data: responses };
	})
	// 6. ADMIN: Get Response History
	.get(
		"/pmb/form-responses/history",
		async (context) => {
			const { query, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const conditions: any[] = [];

			if (query.status && query.status !== "ALL") {
				conditions.push(eq(pmbFormResponses.status, query.status as any));
			} else {
				conditions.push(
					// Not pending
					and(
						gte(pmbFormResponses.status, "APPROVED"), // actually just means anything not PENDING
					),
				);
			}

			// Since drizzle enum comparison is tricky, let's just do a manual filter for NOT pending
			const responses = await db.query.pmbFormResponses.findMany({
				with: {
					processor: { columns: { fullName: true } },
				},
				orderBy: [desc(pmbFormResponses.processedAt)],
			});

			const filtered = responses.filter((r) => {
				if (r.status === "PENDING") return false;
				if (query.status && query.status !== "ALL" && r.status !== query.status)
					return false;

				if (query.month && query.year && r.processedAt) {
					const date = new Date(r.processedAt);
					if (
						date.getMonth() + 1 !== parseInt(query.month, 10) ||
						date.getFullYear() !== parseInt(query.year, 10)
					) {
						return false;
					}
				}
				return true;
			});

			return { success: true, data: filtered };
		},
		{
			query: t.Object({
				month: t.Optional(t.String()),
				year: t.Optional(t.String()),
				status: t.Optional(t.String()),
			}),
		},
	)
	// 7. ADMIN: Get single response detail
	.get("/pmb/form-responses/:id", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);
		const response = await db.query.pmbFormResponses.findFirst({
			where: eq(pmbFormResponses.id, id),
		});
		if (!response) {
			set.status = 404;
			return { success: false, message: "Data tidak ditemukan" };
		}
		return { success: true, data: response };
	})
	// 8. ADMIN: Reject Response
	.patch(
		"/pmb/form-responses/:id/reject",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);

			await db
				.update(pmbFormResponses)
				.set({
					status: "REJECTED",
					rejectionNotes: body.rejectionNotes,
					processedAt: new Date(),
					processedBy: user.id,
				})
				.where(eq(pmbFormResponses.id, id));

			return { success: true };
		},
		{
			body: t.Object({
				rejectionNotes: t.String(),
			}),
		},
	)
	// 9. ADMIN: Approve Response
	.patch("/pmb/form-responses/:id/approve", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);

		const response = await db.query.pmbFormResponses.findFirst({
			where: eq(pmbFormResponses.id, id),
		});

		if (!response || response.status !== "PENDING") {
			set.status = 400;
			return { success: false, message: "Data tidak valid" };
		}

		try {
			// Convert payload back to match what `createStudentPipeline` expects
			const studentPayload = {
				name: response.name,
				nickname: response.nickname,
				gender: response.gender,
				birthPlace: response.birthPlace,
				birthDate: response.birthDate
					? new Date(response.birthDate)
					: undefined,
				religion: response.religion,
				nationality: response.nationality,
				addressStreet: response.addressStreet,
				addressRt: response.addressRt,
				addressRw: response.addressRw,
				addressNo: response.addressNo,
				addressVillage: response.addressVillage,
				addressDistrict: response.addressDistrict,
				addressCity: response.addressCity,
				addressProvince: response.addressProvince,
				livingWith: response.livingWith,
				phone: response.phone,
				email: response.email,

				schoolOrigin: response.schoolOrigin,
				schoolAddress: response.schoolAddress,
				schoolMajor: response.schoolMajor,
				graduationYear: response.graduationYear,
				program: response.program || "Reguler", // Fallback
				subProgram: response.subProgram || "Indonesia-Reguler",
				destinationCountry:
					response.subProgram === "Malaysia-Hospitality"
						? "Malaysia"
						: response.subProgram === "Taiwan-Hospitality"
							? "Taiwan"
							: response.subProgram === "Timur tengah-Barista"
								? "Timur Tengah"
								: "Indonesia",
				classType: response.classType,
				batch: response.batch,
				academicYear: response.academicYear || undefined,
				cohort: (() => {
					if (response.academicYear) {
						const startYear = parseInt(response.academicYear.split("/")[0], 10);
						if (!isNaN(startYear)) {
							return startYear >= 2000 ? startYear - 2010 : startYear;
						}
					}
					return new Date().getFullYear() - 2010;
				})(),

				bloodType: response.bloodType,
				diseaseHistory: response.diseaseHistory,
				congenitalDisease: response.congenitalDisease,
				height: response.height ? Number(response.height) : undefined,
				weight: response.weight ? Number(response.weight) : undefined,
				clothingSize: response.clothingSize,

				ayahName: response.ayahName,
				ayahBirthPlace: response.ayahBirthPlace,
				ayahBirthDate: response.ayahBirthDate
					? new Date(response.ayahBirthDate)
					: undefined,
				ayahReligion: response.ayahReligion,
				ayahNationality: response.ayahNationality,
				ayahEducation: response.ayahEducation,
				ayahJob: response.ayahJob,
				ayahAddress: response.ayahAddress,
				ayahPhone: response.ayahPhone,
				ayahEmail: response.ayahEmail,
				ayahStatus: response.ayahStatus,

				ibuName: response.ibuName,
				ibuBirthPlace: response.ibuBirthPlace,
				ibuBirthDate: response.ibuBirthDate
					? new Date(response.ibuBirthDate)
					: undefined,
				ibuReligion: response.ibuReligion,
				ibuNationality: response.ibuNationality,
				ibuEducation: response.ibuEducation,
				ibuJob: response.ibuJob,
				ibuAddress: response.ibuAddress,
				ibuPhone: response.ibuPhone,
				ibuEmail: response.ibuEmail,
				ibuStatus: response.ibuStatus,

				waliName: response.waliName,
				waliBirthPlace: response.waliBirthPlace,
				waliBirthDate: response.waliBirthDate
					? new Date(response.waliBirthDate)
					: undefined,
				waliReligion: response.waliReligion,
				waliNationality: response.waliNationality,
				waliEducation: response.waliEducation,
				waliJob: response.waliJob,
				waliAddress: response.waliAddress,
				waliPhone: response.waliPhone,
				waliEmail: response.waliEmail,
				waliGuardianRelation: response.waliGuardianRelation,

				studentStatus: "aktif",
			};

			// Use the existing student creation pipeline
			const { student } = await createStudentPipeline(studentPayload, user.id);

			// Update response status to APPROVED
			await db
				.update(pmbFormResponses)
				.set({
					status: "APPROVED",
					processedAt: new Date(),
					processedBy: user.id,
					studentId: student.id,
				})
				.where(eq(pmbFormResponses.id, id));

			return { success: true, data: student };
		} catch (error: any) {
			console.error("Failed to approve form response:", error);
			set.status = 500;
			return { success: false, message: error.message };
		}
	})
	// 9. ADMIN: Get Single Response
	.get("/pmb/form-responses/:id", async (context) => {
		const user = (context as any).user;
		if (!user || (user.role !== "superadmin" && user.role !== "pmb")) {
			context.set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(context.params.id);
		const response = await db.query.pmbFormResponses.findFirst({
			where: eq(pmbFormResponses.id, id),
			with: { processor: { columns: { fullName: true } } },
		});

		if (!response) {
			context.set.status = 404;
			return { success: false, message: "Response not found" };
		}

		return { success: true, data: response };
	});
