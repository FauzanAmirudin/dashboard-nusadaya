import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { pmbFormResponses, pmbFormTokens, students, users } from "../db/schema";
import { hasRole } from "../lib/permissions";
import { createStudentPipeline } from "./student/core";

// Helper Auth Guard PMB Admin
function checkPmbAdminAuth(context: any): {
	authorized: boolean;
	user?: any;
	response?: { success: boolean; code: string; message: string };
} {
	const user = context.user;
	if (!user) {
		context.set.status = 401;
		if (context.sessionStatus === "idle_timeout") {
			return {
				authorized: false,
				response: {
					success: false,
					code: "IDLE_TIMEOUT",
					message:
						"Sesi Anda telah berakhir karena tidak ada aktivitas (idle timeout). Silakan login kembali.",
				},
			};
		}
		return {
			authorized: false,
			response: {
				success: false,
				code: "UNAUTHORIZED",
				message: "Autentikasi diperlukan. Silakan login terlebih dahulu.",
			},
		};
	}

	if (!hasRole(user, "pmb", "superadmin")) {
		context.set.status = 403;
		const userRoleStr =
			user.roles && Array.isArray(user.roles)
				? user.roles.join(", ")
				: user.role || "unknown";
		return {
			authorized: false,
			response: {
				success: false,
				code: "FORBIDDEN",
				message: `Akses ditolak: Akun '${user.username || "Pengguna"}' (role: ${userRoleStr}) tidak memiliki izin akses modul PMB. Harap gunakan akun staf PMB atau Superadmin.`,
			},
		};
	}

	return { authorized: true, user };
}

export const formRegisterRoutes = new Elysia()
	// 1. PUBLIC: Validate Token
	.get("/form/:token", async ({ params, set }) => {
		const tokenRecord = await db.query.pmbFormTokens.findFirst({
			where: eq(pmbFormTokens.token, params.token),
			with: {
				response: true,
			},
		});

		if (!tokenRecord) {
			set.status = 404;
			return { valid: false, message: "Token tidak ditemukan" };
		}

		if (tokenRecord.isUsed || tokenRecord.response?.status === "APPROVED") {
			set.status = 400;
			return {
				valid: false,
				message:
					"Pendaftaran telah disetujui / di-ACC. Tautan formulir tidak lagi aktif.",
				isApproved: true,
			};
		}

		return {
			valid: true,
			existingData: tokenRecord.response || null,
			responseStatus: tokenRecord.response?.status || null,
			rejectionNotes: tokenRecord.response?.rejectionNotes || null,
			rejectedTabs: tokenRecord.response?.rejectedTabs || [],
			rejectedFields: tokenRecord.response?.rejectedFields || [],
		};
	})
	// 2. PUBLIC: Submit Form
	.post(
		"/form/:token/submit",
		async ({ params, body, set }) => {
			const tokenRecord = await db.query.pmbFormTokens.findFirst({
				where: eq(pmbFormTokens.token, params.token),
				with: {
					response: true,
				},
			});

			if (
				!tokenRecord ||
				tokenRecord.isUsed ||
				tokenRecord.response?.status === "APPROVED"
			) {
				set.status = 400;
				return {
					valid: false,
					message: "Token tidak valid atau pendaftaran sudah disetujui",
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

			if (typeof insertData.friendContacts === "string") {
				try {
					insertData.friendContacts = JSON.parse(insertData.friendContacts);
				} catch {
					insertData.friendContacts = [];
				}
			}

			// Save / Update Response
			if (tokenRecord.response) {
				await db
					.update(pmbFormResponses)
					.set({
						...insertData,
						status: "PENDING",
						submittedAt: new Date(),
						rejectionNotes: null,
						rejectedTabs: [],
						rejectedFields: [],
						processedAt: null,
						processedBy: null,
					})
					.where(eq(pmbFormResponses.id, tokenRecord.response.id));
			} else {
				await db.insert(pmbFormResponses).values({
					tokenId: tokenRecord.id,
					status: "PENDING",
					...insertData,
				});
			}

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

				// Tab 3: Kesehatan & Pra-MCU
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

				// Tab 7: Informasi PMB & Referensi
				period: t.Optional(t.String()),
				rekomendasi: t.Optional(t.String()),
				timVisit: t.Optional(t.String()),
				timSosialisasi: t.Optional(t.String()),
				roReferral: t.Optional(t.String()),
				mitraSponsor: t.Optional(t.String()),
				koordinator: t.Optional(t.String()),
				referralCategory: t.Optional(t.String()),
				referralInstitutionName: t.Optional(t.String()),
				referralContactName: t.Optional(t.String()),
				referralContactPhone: t.Optional(t.String()),

				// Tab 8: Kontak Darurat & Kontak Kawan
				emergencyContactName: t.Optional(t.String()),
				emergencyContactPhone: t.Optional(t.String()),
				emergencyContactRelation: t.Optional(t.String()),
				recommendedBy: t.Optional(t.String()),
				recommenderName: t.Optional(t.String()),
				friendContacts: t.Optional(t.Any()),
			}),
		},
	)
	// 3. ADMIN: Generate Token
	.post("/pmb/form-tokens", async (context) => {
		const auth = checkPmbAdminAuth(context);
		if (!auth.authorized) return auth.response;
		const user = auth.user;

		const token = crypto.randomUUID();
		await db.insert(pmbFormTokens).values({
			token,
			createdBy: user.id,
		});

		return { success: true, data: { token } };
	})
	// 4. ADMIN: Get Tokens List
	.get("/pmb/form-tokens", async (context) => {
		const auth = checkPmbAdminAuth(context);
		if (!auth.authorized) return auth.response;

		const tokens = await db.query.pmbFormTokens.findMany({
			with: {
				creator: { columns: { fullName: true } },
				response: {
					columns: {
						id: true,
						name: true,
						status: true,
						rejectionNotes: true,
						rejectedTabs: true,
						rejectedFields: true,
					},
				},
			},
			orderBy: [desc(pmbFormTokens.createdAt)],
		});
		return { success: true, data: tokens };
	})
	// 5. ADMIN: Get Pending Responses
	.get("/pmb/form-responses", async (context) => {
		const auth = checkPmbAdminAuth(context);
		if (!auth.authorized) return auth.response;

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
			const auth = checkPmbAdminAuth(context);
			if (!auth.authorized) return auth.response;

			const { query } = context;

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
		const auth = checkPmbAdminAuth(context);
		if (!auth.authorized) return auth.response;

		const { params, set } = context;
		const id = parseInt(params.id, 10);
		const response = await db.query.pmbFormResponses.findFirst({
			where: eq(pmbFormResponses.id, id),
			with: {
				processor: { columns: { fullName: true } },
			},
		});
		if (!response) {
			set.status = 404;
			return { success: false, message: "Data tidak ditemukan" };
		}
		return { success: true, data: response };
	})
	// 8. ADMIN: Reject Response (Sistem Revisi Bertarget - Task G-2 & G-3)
	.patch(
		"/pmb/form-responses/:id/reject",
		async (context) => {
			const auth = checkPmbAdminAuth(context);
			if (!auth.authorized) return auth.response;
			const user = auth.user;

			const { params, body } = context;
			const id = parseInt(params.id, 10);

			await db
				.update(pmbFormResponses)
				.set({
					status: "REJECTED",
					rejectionNotes: body.rejectionNotes,
					rejectedTabs: body.rejectedTabs || [],
					rejectedFields: body.rejectedFields || [],
					processedAt: new Date(),
					processedBy: user.id,
				})
				.where(eq(pmbFormResponses.id, id));

			return { success: true };
		},
		{
			body: t.Object({
				rejectionNotes: t.String(),
				rejectedTabs: t.Optional(t.Array(t.Number())),
				rejectedFields: t.Optional(
					t.Array(
						t.Object({
							fieldKey: t.String(),
							fieldLabel: t.String(),
							tabIndex: t.Number(),
							reason: t.Optional(t.String()),
						}),
					),
				),
			}),
		},
	)
	// 9. ADMIN: Approve Response
	.patch("/pmb/form-responses/:id/approve", async (context) => {
		const auth = checkPmbAdminAuth(context);
		if (!auth.authorized) return auth.response;
		const user = auth.user;

		const { params, set } = context;
		const id = parseInt(params.id, 10);

		const response = await db.query.pmbFormResponses.findFirst({
			where: eq(pmbFormResponses.id, id),
		});

		if (!response || response.status !== "PENDING") {
			set.status = 400;
			return { success: false, message: "Data tidak valid" };
		}

		try {
			// Susun payload parents (Task B-2)
			const parents: any[] = [];
			if (response.ayahName) {
				parents.push({
					type: "ayah",
					name: response.ayahName,
					birthPlace: response.ayahBirthPlace,
					birthDate: response.ayahBirthDate
						? new Date(response.ayahBirthDate)
						: null,
					religion: response.ayahReligion,
					nationality: response.ayahNationality,
					education: response.ayahEducation,
					job: response.ayahJob,
					address: response.ayahAddress,
					phone: response.ayahPhone,
					email: response.ayahEmail,
					status: response.ayahStatus || "Hidup",
				});
			}
			if (response.ibuName) {
				parents.push({
					type: "ibu",
					name: response.ibuName,
					birthPlace: response.ibuBirthPlace,
					birthDate: response.ibuBirthDate
						? new Date(response.ibuBirthDate)
						: null,
					religion: response.ibuReligion,
					nationality: response.ibuNationality,
					education: response.ibuEducation,
					job: response.ibuJob,
					address: response.ibuAddress,
					phone: response.ibuPhone,
					email: response.ibuEmail,
					status: response.ibuStatus || "Hidup",
				});
			}
			if (response.waliName) {
				parents.push({
					type: "wali",
					name: response.waliName,
					birthPlace: response.waliBirthPlace,
					birthDate: response.waliBirthDate
						? new Date(response.waliBirthDate)
						: null,
					religion: response.waliReligion,
					nationality: response.waliNationality,
					education: response.waliEducation,
					job: response.waliJob,
					address: response.waliAddress,
					phone: response.waliPhone,
					email: response.waliEmail,
					guardianRelation: response.waliGuardianRelation,
				});
			}

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
				profilePhotoUrl: response.profilePhotoUrl,

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
						if (!Number.isNaN(startYear)) {
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

				// Parents array (Task B-2)
				parents,

				// Ayah, Ibu, Wali flat fields (fallback)
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

				// PMB & Referensi Terstruktur (Task I-1 & I-2)
				period: response.period || undefined,
				rekomendasi: response.rekomendasi || undefined,
				timVisit: response.timVisit || undefined,
				timSosialisasi: response.timSosialisasi || undefined,
				roReferral: response.roReferral || undefined,
				mitraSponsor: response.mitraSponsor || undefined,
				koordinator: response.koordinator || undefined,
				referralCategory: response.referralCategory || undefined,
				referralInstitutionName: response.referralInstitutionName || undefined,
				referralContactName: response.referralContactName || undefined,
				referralContactPhone: response.referralContactPhone || undefined,

				// Kontak Darurat & Kawan (Task N-1 & N-3)
				emergencyContactName: response.emergencyContactName || undefined,
				emergencyContactPhone: response.emergencyContactPhone || undefined,
				emergencyContactRelation:
					response.emergencyContactRelation || undefined,
				friendContacts: response.friendContacts || [],

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

			// Lock token
			if (response.tokenId) {
				await db
					.update(pmbFormTokens)
					.set({ isUsed: true, usedAt: new Date() })
					.where(eq(pmbFormTokens.id, response.tokenId));
			}

			return { success: true, data: student };
		} catch (error: any) {
			console.error("Failed to approve form response:", error);
			set.status = 500;
			return { success: false, message: error.message };
		}
	})
	// 10. ADMIN: Delete Form Token
	.delete("/pmb/form-tokens/:id", async (context) => {
		const auth = checkPmbAdminAuth(context);
		if (!auth.authorized) return auth.response;

		const { params, set } = context;
		const id = parseInt(params.id, 10);
		const token = await db.query.pmbFormTokens.findFirst({
			where: eq(pmbFormTokens.id, id),
		});
		if (!token) {
			set.status = 404;
			return { success: false, message: "Token not found" };
		}
		await db.delete(pmbFormResponses).where(eq(pmbFormResponses.tokenId, id));
		await db.delete(pmbFormTokens).where(eq(pmbFormTokens.id, id));
		return { success: true };
	});
