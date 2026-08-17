import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	academicData,
	academicDocuments,
	counselingLogs,
	courseGrades,
	courses,
	crmData,
	crmDocuments,
	crmLogs,
	departureAssessmentNotes,
	departureAssessments,
	entrepreneurshipRecords,
	finalDecision,
	financeData,
	financeDocuments,
	financeSemesterInstallments,
	internshipData,
	internshipDocuments,
	overseasProgramChecklists,
	paData,
	paDocuments,
	paInterviewLogs,
	paStudentNotes,
	pmbData,
	pmbDocuments,
	pmbFeeDisbursements,
	pmbPaymentPlan,
	students,
	users,
	vocabLogs,
} from "../db/schema";
import { fileService } from "../modules/file/service/file.service";

export const mahasiswaRouter = new Elysia({ prefix: "/mahasiswa" })
	.derive(async ({ request, jwt, cookie: { auth } }: any) => {
		const authHeader = request.headers.get("authorization");
		let profile: any = null;
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.slice(7);
			profile = await jwt.verify(token);
		} else if (auth?.value) {
			profile = await jwt.verify(auth.value as string);
		}

		if (profile?.role !== "mahasiswa") {
			return { user: null };
		}

		return { user: profile as { id: number; username: string; role: string } };
	})
	.get("/me", async ({ user, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const studentData = await db.query.students.findFirst({
			where: eq(students.studentUserId, user.id),
			with: {
				pa: {
					columns: {
						fullName: true,
					},
				},
			},
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Data mahasiswa tidak ditemukan" };
		}

		return { success: true, data: studentData };
	})
	.get("/progress", async ({ user, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const studentData = await db.query.students.findFirst({
			where: eq(students.studentUserId, user.id),
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Data mahasiswa tidak ditemukan" };
		}

		const [pmb, crm, finance, academic, pa, internship, decision] =
			await Promise.all([
				db.query.pmbData.findFirst({
					where: eq(pmbData.studentId, studentData.id),
				}),
				db.query.crmData.findFirst({
					where: eq(crmData.studentId, studentData.id),
				}),
				db.query.financeData.findFirst({
					where: eq(financeData.studentId, studentData.id),
				}),
				db.query.academicData.findFirst({
					where: eq(academicData.studentId, studentData.id),
				}),
				db.query.paData.findFirst({
					where: eq(paData.studentId, studentData.id),
				}),
				db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, studentData.id),
				}),
				db.query.finalDecision.findFirst({
					where: eq(finalDecision.studentId, studentData.id),
				}),
			]);

		return {
			success: true,
			data: {
				pmb: { isAcc: pmb?.isAcc, status: pmb?.status },
				crm: { isAcc: crm?.isAcc, status: crm?.status },
				finance: { isAcc: finance?.isAcc, status: finance?.status },
				academic: { isAcc: academic?.isAcc, status: academic?.status },
				pa: { isAcc: pa?.isAcc, status: pa?.status },
				internship: { isAcc: internship?.isAcc, status: internship?.status },
				finalDecision: {
					evaluatorDecision: decision?.evaluatorDecision,
					isApprovedByDirector: decision?.isApprovedByDirector,
				},
			},
		};
	})
	.patch(
		"/profil",
		async ({ user, body, set }: any) => {
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			const {
				phone,
				parentName,
				nik,
				nisn,
				birthPlace,
				birthDate,
				gender,
				address,
				schoolOrigin,
				parentJob,
				parentIncome,
				parentPhone,
			} = body;

			const studentData = await db.query.students.findFirst({
				where: eq(students.studentUserId, user.id),
			});

			if (!studentData) {
				set.status = 404;
				return { success: false, message: "Data mahasiswa tidak ditemukan" };
			}

			await db
				.update(students)
				.set({
					phone,
					parentName,
					birthPlace,
					birthDate: birthDate ? new Date(birthDate) : undefined,
					gender,
					schoolOrigin,
					parentJob,
					parentIncome,
					parentPhone,
					updatedAt: new Date(),
				})
				.where(eq(students.id, studentData.id));

			return { success: true, message: "Profil berhasil diperbarui" };
		},
		{
			body: t.Object({
				phone: t.Optional(t.String()),
				parentName: t.Optional(t.String()),
				birthPlace: t.Optional(t.String()),
				birthDate: t.Optional(t.String()),
				gender: t.Optional(t.String()),
				schoolOrigin: t.Optional(t.String()),
				parentJob: t.Optional(t.String()),
				parentIncome: t.Optional(t.String()),
				parentPhone: t.Optional(t.String()),
			}),
		},
	)
	.post("/profil/photo", async ({ user, body, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const file = body.file as File;
		if (!file) {
			set.status = 400;
			return { success: false, message: "Tidak ada file yang diupload" };
		}

		const studentData = await db.query.students.findFirst({
			where: eq(students.studentUserId, user.id),
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Data mahasiswa tidak ditemukan" };
		}

		// Upload foto profil mahasiswa via FileService
		let fileUrl: string;
		try {
			const uploadResult = await fileService.uploadFile({
				file,
				studentId: studentData.id,
				category: "profile",
				panel: "mahasiswa",
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
			.where(eq(students.id, studentData.id));

		return {
			success: true,
			message: "Foto profil berhasil diperbarui",
			url: fileUrl,
		};
	})
	.get("/panel/:panelKey", async ({ user, params, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const studentData = await db.query.students.findFirst({
			where: eq(students.studentUserId, user.id),
		});

		if (!studentData) {
			set.status = 404;
			return { success: false, message: "Data mahasiswa tidak ditemukan" };
		}

		const panelKey = params.panelKey;
		let data: any = null;

		if (panelKey === "pmb") {
			const [pmb, paymentPlan, documents, feeDisbursements] = await Promise.all(
				[
					db.query.pmbData.findFirst({
						where: eq(pmbData.studentId, studentData.id),
					}),
					db.query.pmbPaymentPlan.findFirst({
						where: eq(pmbPaymentPlan.studentId, studentData.id),
					}),
					db.query.pmbDocuments.findMany({
						where: eq(pmbDocuments.studentId, studentData.id),
					}),
					db.query.pmbFeeDisbursements.findMany({
						where: eq(pmbFeeDisbursements.studentId, studentData.id),
					}),
				],
			);

			data = {
				// Checklist
				formReceived: pmb?.formReceived,
				documentsComplete: pmb?.documentsComplete,
				dataInputted: pmb?.dataInputted,
				initialFollowUp: pmb?.initialFollowUp,
				status: pmb?.status,
				isAcc: pmb?.isAcc,
				accAt: pmb?.accAt,

				// Akuisisi
				rekomendasi: pmb?.rekomendasi,
				timVisit: pmb?.timVisit,
				timSosialisasi: pmb?.timSosialisasi,
				roReferral: pmb?.roReferral,
				mitraSponsor: pmb?.mitraSponsor,
				koordinator: pmb?.koordinator,

				// Keuangan
				paymentPlan: paymentPlan
					? {
							totalBiaya: paymentPlan.totalBiaya,
							totalDp: paymentPlan.totalDp,
							statusDp: paymentPlan.statusDp,
							janjiTahap2: paymentPlan.janjiTahap2,
							janjiTahap2Nominal: paymentPlan.janjiTahap2Nominal,
							janjiTahap3: paymentPlan.janjiTahap3,
							janjiTahap3Nominal: paymentPlan.janjiTahap3Nominal,
							pengajuanDanaTalangan: paymentPlan.pengajuanDanaTalangan,
						}
					: null,

				// Dokumen & Fee
				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),
				fees: feeDisbursements.map((f) => ({
					channel: f.channel,
					namaReferral: f.namaReferral,
					nominalFee: f.nominalFee,
					statusPencairan: f.statusPencairan,
				})),
			};
		} else if (panelKey === "crm") {
			const [crm, documents] = await Promise.all([
				db.query.crmData.findFirst({
					where: eq(crmData.studentId, studentData.id),
				}),
				db.query.crmDocuments.findMany({
					where: eq(crmDocuments.studentId, studentData.id),
				}),
			]);
			data = {
				// Old Checklist (legacy but kept for safety)
				odsActive: crm?.odsActive,
				studentMonitoring: crm?.studentMonitoring,

				// New Checklist (v2)
				isMonitoringParent: crm?.isMonitoringParent,
				isMonitoringIndustry: crm?.isMonitoringIndustry,
				isVocabComplete: crm?.isVocabComplete,
				hasStudyPermit: crm?.hasStudyPermit,
				isOdsReport: crm?.isOdsReport,
				odsDocumentation: crm?.odsDocumentation,
				isPrammagangReport: crm?.isPrammagangReport,
				isPrammagangDocumentation: crm?.isPrammagangDocumentation,

				// Kehadiran & Kasus
				practiceAttendance: crm?.practiceAttendance, // checkbox
				practiceDaysPresent: crm?.practiceDaysPresent,
				practiceDaysTotal: crm?.practiceDaysTotal,
				hasActiveCase: crm?.hasActiveCase,
				caseNotes: crm?.caseNotes,

				// Dokumen CRM
				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),

				status: crm?.status,
				isAcc: crm?.isAcc,
				accAt: crm?.accAt,
			};
		} else if (panelKey === "finance") {
			const [finance, documents] = await Promise.all([
				db.query.financeData.findFirst({
					where: eq(financeData.studentId, studentData.id),
				}),
				db.query.financeDocuments.findMany({
					where: eq(financeDocuments.studentId, studentData.id),
				}),
			]);
			data = {
				registrationPaid: finance?.registrasiStatus,
				registrasiNominal: finance?.registrasiNominal,

				semesterPaid:
					finance?.mandiriSemesterStatus || finance?.t1SemesterStatus,
				mandiriSemesterNominal: finance?.mandiriSemesterNominal,

				installmentCleared: finance?.toeicStatus,
				toeicNominal: finance?.toeicNominal,

				arrearsCleared: finance?.pasporStatus,
				pasporNominal: finance?.pasporNominal,

				adminTalaganBankTujuan: finance?.adminTalaganBankTujuan,
				adminTalaganMetode: finance?.adminTalaganMetode,
				t1SemesterNominalTotal: finance?.t1SemesterNominalTotal,

				t1SemesterStatus: finance?.t1SemesterStatus,
				t2KeberangkatanNominal: finance?.t2KeberangkatanNominal,

				t2KeberangkatanStatus: finance?.t2KeberangkatanStatus,

				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),

				status: finance?.status,
				isAcc: finance?.isAcc,
				accAt: finance?.accAt,
			};
		} else if (panelKey === "akademik") {
			const [academic, documents, overseasChecklist] = await Promise.all([
				db.query.academicData.findFirst({
					where: eq(academicData.studentId, studentData.id),
				}),
				db.query.academicDocuments.findMany({
					where: eq(academicDocuments.studentId, studentData.id),
				}),
				db.query.overseasProgramChecklists.findFirst({
					where: eq(overseasProgramChecklists.studentId, studentData.id),
				}),
			]);
			data = {
				gpa: academic?.gpa,
				creditsCompleted: academic?.creditsCompleted,
				pddiktiInput: academic?.pddiktiInput,
				attendanceTotal: academic?.attendanceTotal,
				attendancePresent: academic?.attendancePresent,
				attendanceAlphaNote: academic?.attendanceAlphaNote,
				utsPassed: academic?.utsPassed,
				uasPassed: academic?.uasPassed,
				attitudeIndicator: academic?.attitudeIndicator,
				assignmentsCompleted: academic?.assignmentsCompleted,
				academicCommunication: academic?.academicCommunication,
				notes: academic?.notes,

				taiwanCohort:
					overseasChecklist?.cohort === "13/14" ||
					overseasChecklist?.programType === "taiwan",
				taiwanPasFotoChecked: overseasChecklist?.pasFotoChecked,
				taiwanCvChecked: overseasChecklist?.cvChecked,
				taiwanKtmChecked: overseasChecklist?.ktmChecked,
				taiwanKhsChecked: overseasChecklist?.khsChecked,
				taiwanSl21Checked: overseasChecklist?.sl21Checked,
				taiwanAktifChecked: overseasChecklist?.aktifChecked,
				taiwanPddiktiChecked: overseasChecklist?.pddiktiChecked,
				taiwanLolChecked: overseasChecklist?.lolChecked,
				taiwanLoaChecked: overseasChecklist?.loaChecked,
				taiwanSuhhanChecked: overseasChecklist?.suhhanChecked,

				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),

				status: academic?.status,
				isAcc: academic?.isAcc,
				accAt: academic?.accAt,
			};
		} else if (panelKey === "pa") {
			const [pa, interviews, vocabs, documents] = await Promise.all([
				db.query.paData.findFirst({
					where: eq(paData.studentId, studentData.id),
				}),
				db.query.paInterviewLogs.findMany({
					where: eq(paInterviewLogs.studentId, studentData.id),
					orderBy: (paInterviewLogs, { desc }) => [
						desc(paInterviewLogs.interviewDate),
					],
				}),
				db.query.vocabLogs.findMany({
					where: eq(vocabLogs.studentId, studentData.id),
					orderBy: (vocabLogs, { desc }) => [desc(vocabLogs.date)],
				}),
				db.query.paDocuments.findMany({
					where: eq(paDocuments.studentId, studentData.id),
				}),
			]);
			data = {
				counselingDone: pa?.counselingDone,
				mentalStable: pa?.mentalStable,
				disciplineGood: pa?.disciplineGood,
				vocabTarget: pa?.vocabTarget,
				disciplineNotes: pa?.disciplineNotes,

				status: pa?.status,
				isAcc: pa?.isAcc,
				accAt: pa?.accAt,

				interviews: interviews.map((i) => ({
					date: i.interviewDate,
					companyName: i.companyName,
					result: i.result,
				})),
				vocabLogs: vocabs.map((v) => ({
					date: v.date,
					addedWords: v.addedWords,
				})),

				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),
			};
		} else if (panelKey === "magang") {
			const [magang, decision, documents] = await Promise.all([
				db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, studentData.id),
				}),
				db.query.finalDecision.findFirst({
					where: eq(finalDecision.studentId, studentData.id),
				}),
				db.query.internshipDocuments.findMany({
					where: eq(internshipDocuments.studentId, studentData.id),
				}),
			]);
			data = {
				passportReady: magang?.passportReady,
				passportNo: magang?.passportNo,
				passportExp: magang?.passportExp,

				interviewReady: magang?.interviewReady,
				interviewDate: magang?.interviewDate,
				interviewResult: magang?.interviewResult,

				loaReady: magang?.loaReady,
				loaCompany: magang?.loaCompany,
				loaPosition: magang?.loaPosition,

				contractReady: magang?.contractReady,
				contractDate: magang?.contractDate,

				mcuReady: magang?.mcuReady,
				mcuPlace: magang?.mcuPlace,
				mcuDate: magang?.mcuDate,
				mcuResult: magang?.mcuResult,

				visaReady: magang?.visaReady,
				visaType: magang?.visaType,
				visaStatus: magang?.visaStatus,
				visaNo: magang?.visaNo,

				ticketReady: magang?.ticketReady,
				ticketAirline: magang?.ticketAirline,
				ticketDate: magang?.ticketDate,
				ticketFlight: magang?.ticketFlight,

				pdtReady: magang?.pdtReady,
				pdtDate: magang?.pdtDate,
				pdtPlace: magang?.pdtPlace,

				lolReady: magang?.lolReady,
				lolDate: magang?.lolDate,
				loaConfirmed: magang?.loaConfirmed,
				moaReady: magang?.moaReady,

				estDepartureDate: magang?.estDepartureDate,
				destinationCity: magang?.destinationCity,
				internshipCompany: magang?.internshipCompany,
				internshipDuration: magang?.internshipDuration,

				status: magang?.status,
				dokumentasiReady: magang?.dokumentasiReady,
				agenReady: magang?.agenReady,
				isAcc: magang?.isAcc,
				accAt: magang?.accAt,

				finalDecision: {
					evaluatorDecision: decision?.evaluatorDecision,
					isApprovedByDirector: decision?.isApprovedByDirector,
				},

				documents: documents.map((d) => ({
					documentKey: d.documentKey,
					fileName: d.fileName,
					isVerified: d.isVerified,
					uploadedAt: d.uploadedAt,
				})),
			};
		} else {
			set.status = 400;
			return { success: false, message: "Panel tidak valid" };
		}

		return { success: true, data };
	});
