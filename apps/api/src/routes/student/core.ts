import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
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
	financeCustomFields,
	financeData,
	financeDocuments,
	financeSemesterInstallments,
	financeSemesters,
	financeTalanganInstallments,
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
import {
	cacheDel,
	cacheGet,
	cacheInvalidatePattern,
	cacheSet,
} from "../../lib/cache";
import { hasRole } from "../../lib/permissions";
import { requireRole } from "../../middleware/rbac";
import { fileService } from "../../modules/file/service/file.service";

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
		// Auto-seed 6 semester keuangan saat pendaftaran mahasiswa baru
		db.insert(financeSemesters).values(
			Array.from({ length: 6 }).map((_, i) => ({
				studentId,
				semesterNumber: i + 1,
				totalBilled: 0,
			})),
		),
	]);

	// 7. Catat di auditLogs
	await db.insert(auditLogs).values({
		userId: userId,
		action: "CREATE_STUDENT",
		entity: "students",
		entityId: studentId,
		details: { nim: newStudent.nim, name: newStudent.name },
	});

	// 8. Invalidate student list cache
	await cacheInvalidatePattern("cache:students:list:*");

	return { student: newStudent };
}

export const coreRoutes = new Elysia()
	.get(
		"/",
		async ({ query }) => {
			const isArchived = query?.archived === "true";
			const page = Math.max(1, Number(query?.page) || 1);
			const limit =
				query?.all === "true"
					? 10000
					: Math.min(100, Math.max(1, Number(query?.limit) || 50));
			const offset = (page - 1) * limit;

			const rawCohort =
				query?.cohort &&
				query.cohort !== "all" &&
				query.cohort !== "undefined" &&
				query.cohort !== "null"
					? query.cohort
					: undefined;
			const cohort =
				rawCohort && !Number.isNaN(Number(rawCohort))
					? Number(rawCohort)
					: undefined;

			const rawStatus =
				query?.status &&
				query.status !== "all" &&
				query.status !== "undefined" &&
				query.status !== "null"
					? query.status.toLowerCase()
					: undefined;
			const status = rawStatus;

			const rawSearch = query?.search?.trim();
			const search =
				rawSearch &&
				rawSearch !== "undefined" &&
				rawSearch !== "null" &&
				rawSearch !== ""
					? rawSearch.toLowerCase()
					: undefined;

			// Build dynamic WHERE conditions
			const conditions = [eq(students.isArchived, isArchived)];

			if (cohort && !Number.isNaN(cohort)) {
				if (cohort >= 2000) {
					const derivedCohort = cohort - 2010;
					conditions.push(
						or(
							eq(students.cohort, cohort),
							eq(students.cohort, derivedCohort),
							sql`${students.academicYear} LIKE ${`%${cohort}%`}`,
						)!,
					);
				} else {
					const derivedYear = 2010 + cohort;
					conditions.push(
						or(
							eq(students.cohort, cohort),
							eq(students.cohort, derivedYear),
							sql`${students.academicYear} LIKE ${`%${derivedYear}%`}`,
						)!,
					);
				}
			}

			if (search) {
				conditions.push(
					sql`(LOWER(${students.name}) LIKE ${`%${search}%`} OR LOWER(COALESCE(${students.nim}, '')) LIKE ${`%${search}%`})`,
				);
			}

			if (status === "aman") {
				conditions.push(eq(students.overallStatus, "AMAN"));
			} else if (status === "perhatian") {
				conditions.push(eq(students.overallStatus, "PERLU_PERHATIAN"));
			} else if (status === "tidak_aman") {
				conditions.push(eq(students.overallStatus, "TIDAK_AMAN"));
			}

			const whereClause = and(...conditions);

			// Cache key for pagination & filter combination
			const cacheKey = `cache:students:list:p${page}:l${limit}:c${cohort || "all"}:s${status || "all"}:q${search || ""}:a${isArchived}`;
			const cached = await cacheGet<{ data: any[]; meta: any }>(cacheKey);
			if (cached) {
				return { success: true, data: cached.data, meta: cached.meta };
			}

			// 1. Get total count for pagination
			const [countResult] = await db
				.select({ total: sql<number>`count(*)` })
				.from(students)
				.where(whereClause);

			const total = Number(countResult?.total || 0);
			const totalPages = Math.ceil(total / limit) || 1;

			if (total === 0) {
				const emptyRes = {
					data: [],
					meta: { page, limit, total: 0, totalPages: 1 },
				};
				await cacheSet(cacheKey, emptyRes, 60);
				return { success: true, data: [], meta: emptyRes.meta };
			}

			// 2. Select slim flat columns directly from single joined query
			const results = await db
				.select({
					student: {
						id: students.id,
						nim: students.nim,
						name: students.name,
						nickname: students.nickname,
						cohort: students.cohort,
						program: students.program,
						subProgram: students.subProgram,
						phone: students.phone,
						email: students.email,
						destinationCountry: students.destinationCountry,
						academicYear: students.academicYear,
						batch: students.batch,
						classType: students.classType,
						period: students.period,
						paId: students.paId,
						studentStatus: students.studentStatus,
						overallStatus: students.overallStatus,
						profilePhotoUrl: students.profilePhotoUrl,
						updatedAt: students.updatedAt,
						createdAt: students.createdAt,
					},
					pmb: {
						id: pmbData.id,
						status: pmbData.status,
						isAcc: pmbData.isAcc,
						formReceived: pmbData.formReceived,
						documentsComplete: pmbData.documentsComplete,
						dataInputted: pmbData.dataInputted,
						initialFollowUp: pmbData.initialFollowUp,
						docKtp: pmbData.docKtp,
						docKk: pmbData.docKk,
						docCv: pmbData.docCv,
						docIjazah: pmbData.docIjazah,
						docTranskrip: pmbData.docTranskrip,
						docPassportDepan: pmbData.docPassportDepan,
						docPassportVisa: pmbData.docPassportVisa,
						docSkbm: pmbData.docSkbm,
						docMcu: pmbData.docMcu,
						docSertifikasiBahasa: pmbData.docSertifikasiBahasa,
						timVisit: pmbData.timVisit,
						timSosialisasi: pmbData.timSosialisasi,
						roReferral: pmbData.roReferral,
						mitraSponsor: pmbData.mitraSponsor,
						koordinator: pmbData.koordinator,
						rekomendasi: pmbData.rekomendasi,
						rumahJuang: pmbData.rumahJuang,
					},
					crm: {
						id: crmData.id,
						status: crmData.status,
						isAcc: crmData.isAcc,
						isMonitoringParent: crmData.isMonitoringParent,
						isMonitoringIndustry: crmData.isMonitoringIndustry,
						isVocabComplete: crmData.isVocabComplete,
						hasStudyPermit: crmData.hasStudyPermit,
						practiceAttendance: crmData.practiceAttendance,
						practiceDaysPresent: crmData.practiceDaysPresent,
						practiceDaysTotal: crmData.practiceDaysTotal,
						isOdsReport: crmData.isOdsReport,
						odsDocumentation: crmData.odsDocumentation,
						isPrammagangReport: crmData.isPrammagangReport,
						isPrammagangDocumentation: crmData.isPrammagangDocumentation,
						hasActiveCase: crmData.hasActiveCase,
						pramagangStartDate: crmData.pramagangStartDate,
						pramagangEndDate: crmData.pramagangEndDate,
						pramagangIndustry: crmData.pramagangIndustry,
						caseNotes: crmData.caseNotes,
					},
					finance: {
						id: financeData.id,
						status: financeData.status,
						isAcc: financeData.isAcc,
						totalBiayaPendidikan: financeData.totalBiayaPendidikan,
						totalBiayaPromosi: financeData.totalBiayaPromosi,
						registrasiNominal: financeData.registrasiNominal,
						registrasiPaidDate: financeData.registrasiPaidDate,
						registrasiBuktiBayarUrl: financeData.registrasiBuktiBayarUrl,
						registrasiStatus: financeData.registrasiStatus,
						metodePembayaran: financeData.metodePembayaran,
						mandiriSemesterNominal: financeData.mandiriSemesterNominal,
						mandiriSemesterStatus: financeData.mandiriSemesterStatus,
						mandiriInterviewNominal: financeData.mandiriInterviewNominal,
						mandiriInterviewStatus: financeData.mandiriInterviewStatus,
						mandiriKeberangkatanNominal:
							financeData.mandiriKeberangkatanNominal,
						mandiriKeberangkatanStatus: financeData.mandiriKeberangkatanStatus,
						t1SemesterNominalTotal: financeData.t1SemesterNominalTotal,
						t1SemesterNominalDibayar: financeData.t1SemesterNominalDibayar,
						t1SemesterNominalTalangan: financeData.t1SemesterNominalTalangan,
						t1SemesterStatus: financeData.t1SemesterStatus,
						t1InterviewNominal: financeData.t1InterviewNominal,
						t1InterviewStatus: financeData.t1InterviewStatus,
						t2KeberangkatanNominal: financeData.t2KeberangkatanNominal,
						t2KeberangkatanStatus: financeData.t2KeberangkatanStatus,
						adminTalaganNominal: financeData.adminTalaganNominal,
						adminTalaganStatus: financeData.adminTalaganStatus,
						toeicNominal: financeData.toeicNominal,
						toeicStatus: financeData.toeicStatus,
						pasporNominal: financeData.pasporNominal,
						pasporStatus: financeData.pasporStatus,
						rumahJuangNominal: financeData.rumahJuangNominal,
						rumahJuangStatus: financeData.rumahJuangStatus,
					},
					academic: {
						id: academicData.id,
						status: academicData.status,
						isAcc: academicData.isAcc,
						gpa: academicData.gpa,
						creditsCompleted: academicData.creditsCompleted,
						pddiktiInput: academicData.pddiktiInput,
						utsPassed: academicData.utsPassed,
						uasPassed: academicData.uasPassed,
						attitudeIndicator: academicData.attitudeIndicator,
						assignmentsCompleted: academicData.assignmentsCompleted,
						academicCommunication: academicData.academicCommunication,
						attendanceTotal: academicData.attendanceTotal,
						attendancePresent: academicData.attendancePresent,
						attendanceAlphaNote: academicData.attendanceAlphaNote,
						assessmentCompleted: academicData.assessmentCompleted,
						attendancePiketTotal: academicData.attendancePiketTotal,
						attendancePiketPresent: academicData.attendancePiketPresent,
						attendanceOdsTotal: academicData.attendanceOdsTotal,
						attendanceOdsPresent: academicData.attendanceOdsPresent,
						attendancePramagangTotal: academicData.attendancePramagangTotal,
						attendancePramagangPresent: academicData.attendancePramagangPresent,
					},
					pa: {
						id: paData.id,
						status: paData.status,
						isAcc: paData.isAcc,
						counselingDone: paData.counselingDone,
						mentalStable: paData.mentalStable,
						disciplineGood: paData.disciplineGood,
						vocabTarget: paData.vocabTarget,
						disciplineNotes: paData.disciplineNotes,
					},
					internship: {
						id: internshipData.id,
						status: internshipData.status,
						isAcc: internshipData.isAcc,
						praPasporPasFoto: internshipData.praPasporPasFoto,
						praPasporKtm: internshipData.praPasporKtm,
						praPasporKtp: internshipData.praPasporKtp,
						praPasporKk: internshipData.praPasporKk,
						praPasporAktaKelahiran: internshipData.praPasporAktaKelahiran,
						praPasporSl21: internshipData.praPasporSl21,
						praPasporSkma: internshipData.praPasporSkma,
						praPasporRekomendasiDisdik:
							internshipData.praPasporRekomendasiDisdik,
						praPasporGapYear: internshipData.praPasporGapYear,
						praPasporPddikti: internshipData.praPasporPddikti,
						praPasporCv: internshipData.praPasporCv,
						passportReady: internshipData.passportReady,
						passportNo: internshipData.passportNo,
						interviewReady: internshipData.interviewReady,
						interviewDate: internshipData.interviewDate,
						interviewResult: internshipData.interviewResult,
						loaReady: internshipData.loaReady,
						loaCompany: internshipData.loaCompany,
						loaPosition: internshipData.loaPosition,
						loaConfirmed: internshipData.loaConfirmed,
						contractReady: internshipData.contractReady,
						contractDate: internshipData.contractDate,
						mcuReady: internshipData.mcuReady,
						mcuResult: internshipData.mcuResult,
						visaReady: internshipData.visaReady,
						visaType: internshipData.visaType,
						visaStatus: internshipData.visaStatus,
						ticketReady: internshipData.ticketReady,
						pdtReady: internshipData.pdtReady,
						lolReady: internshipData.lolReady,
						moaReady: internshipData.moaReady,
						isDanaTahap2Disbursed: internshipData.isDanaTahap2Disbursed,
						logbookReady: internshipData.logbookReady,
						laporanAkhirReady: internshipData.laporanAkhirReady,
						videoDokumentasiReady: internshipData.videoDokumentasiReady,
						videoDokumentasiLink: internshipData.videoDokumentasiLink,
						internshipCompany: internshipData.internshipCompany,
						estDepartureDate: internshipData.estDepartureDate,
					},
					decision: {
						id: finalDecision.id,
						evaluatorDecision: finalDecision.evaluatorDecision,
						evaluatorNotes: finalDecision.evaluatorNotes,
						decidedAt: finalDecision.decidedAt,
						isApprovedByDirector: finalDecision.isApprovedByDirector,
						departureDate: finalDecision.departureDate,
						notes: finalDecision.notes,
						confidentialNotes: finalDecision.confidentialNotes,
						skDocumentUrl: finalDecision.skDocumentUrl,
					},
				})
				.from(students)
				.leftJoin(pmbData, eq(students.id, pmbData.studentId))
				.leftJoin(crmData, eq(students.id, crmData.studentId))
				.leftJoin(financeData, eq(students.id, financeData.studentId))
				.leftJoin(academicData, eq(students.id, academicData.studentId))
				.leftJoin(paData, eq(students.id, paData.studentId))
				.leftJoin(internshipData, eq(students.id, internshipData.studentId))
				.leftJoin(finalDecision, eq(students.id, finalDecision.studentId))
				.where(whereClause)
				.orderBy(desc(students.updatedAt), desc(students.id))
				.limit(limit)
				.offset(offset);

			// Transform data structure to match frontend expectations while keeping payload ultra-slim
			const slimData = results.map((r) => ({
				...r,
				courseGrades: [],
				financeSemesters: [],
				financeInstallments: [],
				financeCustomFields: [],
				financeTalanganInstallments: [],
			}));

			const responsePayload = {
				data: slimData,
				meta: {
					page,
					limit,
					total,
					totalPages,
				},
			};

			await cacheSet(cacheKey, responsePayload, 120);

			return { success: true, data: slimData, meta: responsePayload.meta };
		},
		{
			query: t.Optional(
				t.Object({
					page: t.Optional(t.String()),
					limit: t.Optional(t.String()),
					cohort: t.Optional(t.String()),
					status: t.Optional(t.String()),
					search: t.Optional(t.String()),
					archived: t.Optional(t.String()),
					all: t.Optional(t.String()),
				}),
			),
		},
	)
	.post(
		"/",
		async ({ body, set, user }: any) => {
			if (!hasRole(user, "superadmin", "pmb", "akademik")) {
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
			if (!hasRole(user, "superadmin", "pmb", "akademik")) {
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

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:list:*"),
				cacheInvalidatePattern(`cache:mahasiswa:*`),
			]);

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
			if (!hasRole(user, "superadmin", "pmb", "akademik")) {
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

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:list:*"),
				cacheInvalidatePattern(`cache:mahasiswa:*`),
			]);

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
			if (!hasRole(user, "superadmin", "pmb", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			const file = body.file as File;

			if (!file) {
				set.status = 400;
				return { success: false, message: "Tidak ada file yang diupload" };
			}

			// Upload foto profil via FileService
			let fileUrl: string;
			try {
				const uploadResult = await fileService.uploadFile({
					file,
					studentId: id,
					category: "profile",
					panel: "pmb",
					documentKey: "profile_photo",
					uploadedBy: user.id,
					visibility: "public",
				});
				fileUrl = `/files/${uploadResult.id}/download`;
			} catch (err) {
				const error = err as Error;
				set.status = 400;
				return { success: false, message: error.message };
			}

			await db
				.update(students)
				.set({ profilePhotoUrl: fileUrl, updatedAt: new Date() })
				.where(eq(students.id, id));

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:list:*"),
				cacheInvalidatePattern(`cache:mahasiswa:*`),
			]);

			return { success: true, url: fileUrl };
		},
		{
			body: t.Object({
				file: t.File(),
			}),
		},
	)
	.patch("/:id/archive", async ({ params, set, user }: any) => {
		if (!hasRole(user, "superadmin", "pmb", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);
		await db
			.update(students)
			.set({ isArchived: true, updatedAt: new Date() })
			.where(eq(students.id, id));

		await Promise.all([
			cacheDel(`cache:student:${id}`),
			cacheInvalidatePattern("cache:students:list:*"),
			cacheInvalidatePattern(`cache:mahasiswa:*`),
		]);

		return { success: true, message: "Berhasil mengarsipkan mahasiswa" };
	})
	.post("/:id/generate-account", async ({ params, set, user }: any) => {
		if (!hasRole(user, "superadmin", "pmb", "akademik")) {
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
		if (!hasRole(user, "superadmin", "pmb", "akademik")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		const id = parseInt(params.id, 10);
		await db
			.update(students)
			.set({ isArchived: false, updatedAt: new Date() })
			.where(eq(students.id, id));

		await Promise.all([
			cacheDel(`cache:student:${id}`),
			cacheInvalidatePattern("cache:students:list:*"),
			cacheInvalidatePattern(`cache:mahasiswa:*`),
		]);

		return {
			success: true,
			message: "Berhasil memulihkan mahasiswa dari arsip",
		};
	})
	.delete("/:id", async ({ params, set, user }: any) => {
		if (!hasRole(user, "superadmin", "pmb")) {
			set.status = 403;
			return {
				success: false,
				message: "Forbidden: Only superadmin or pmb can delete",
			};
		}
		const id = parseInt(params.id, 10);

		// Hapus seluruh data relasional dalam transaksi database
		await db.transaction(async (tx) => {
			await tx.delete(pmbDocuments).where(eq(pmbDocuments.studentId, id));
			await tx.delete(pmbData).where(eq(pmbData.studentId, id));

			await tx.delete(crmDocuments).where(eq(crmDocuments.studentId, id));
			await tx.delete(crmLogs).where(eq(crmLogs.studentId, id));
			await tx.delete(crmData).where(eq(crmData.studentId, id));

			await tx
				.delete(financeDocuments)
				.where(eq(financeDocuments.studentId, id));
			await tx.delete(financeData).where(eq(financeData.studentId, id));
			await tx
				.delete(financeSemesters)
				.where(eq(financeSemesters.studentId, id));
			await tx
				.delete(financeCustomFields)
				.where(eq(financeCustomFields.studentId, id));
			await tx
				.delete(financeTalanganInstallments)
				.where(eq(financeTalanganInstallments.studentId, id));

			await tx
				.delete(courseGradeDocuments)
				.where(eq(courseGradeDocuments.studentId, id));
			await tx.delete(courseGrades).where(eq(courseGrades.studentId, id));
			await tx
				.delete(academicDocuments)
				.where(eq(academicDocuments.studentId, id));
			await tx.delete(academicData).where(eq(academicData.studentId, id));

			await tx.delete(vocabLogs).where(eq(vocabLogs.studentId, id));
			await tx.delete(counselingLogs).where(eq(counselingLogs.studentId, id));
			await tx.delete(paData).where(eq(paData.studentId, id));

			await tx.delete(internshipData).where(eq(internshipData.studentId, id));
			await tx.delete(finalDecision).where(eq(finalDecision.studentId, id));
			await tx.delete(internalNotes).where(eq(internalNotes.studentId, id));
			await tx
				.delete(auditLogs)
				.where(
					and(eq(auditLogs.entity, "student"), eq(auditLogs.entityId, id)),
				);

			// Hapus data utama
			await tx.delete(students).where(eq(students.id, id));
		});

		await Promise.all([
			cacheDel(`cache:student:${id}`),
			cacheInvalidatePattern("cache:students:list:*"),
			cacheInvalidatePattern(`cache:mahasiswa:*`),
		]);

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

		const cacheKey = `cache:student:${id}`;
		const cached = await cacheGet<any>(cacheKey);
		if (cached) {
			return { success: true, data: cached };
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

		const responseData = {
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
		};

		await cacheSet(cacheKey, responseData, 120);

		return {
			success: true,
			data: responseData,
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
		if (!hasRole(user, "superadmin", "pmb", "akademik")) {
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
			if (!hasRole(user, "superadmin", "pmb", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			await db
				.update(students)
				.set({ studentStatus: body.studentStatus, updatedAt: new Date() })
				.where(eq(students.id, id));

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:list:*"),
				cacheInvalidatePattern(`cache:mahasiswa:*`),
			]);

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
			if (!hasRole(user, "superadmin", "pmb", "akademik")) {
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

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:list:*"),
				cacheInvalidatePattern(`cache:mahasiswa:*`),
			]);

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
			if (!hasRole(user, "superadmin", "pmb", "akademik")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const id = parseInt(params.id, 10);
			await db
				.update(students)
				.set({ paId: body.paId ?? null, updatedAt: new Date() })
				.where(eq(students.id, id));

			await Promise.all([
				cacheDel(`cache:student:${id}`),
				cacheInvalidatePattern("cache:students:list:*"),
				cacheInvalidatePattern(`cache:mahasiswa:*`),
			]);

			return { success: true, message: "PA mahasiswa berhasil diperbarui" };
		},
		{
			body: t.Object({
				paId: t.Optional(t.Nullable(t.Number())),
			}),
		},
	);
