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
	students,
	users,
	vocabLogs,
	weeklyEvents,
} from "../../db/schema";
import { requireRole } from "../../middleware/rbac";

export const statusRoutes = new Elysia().get(
	"/:id/progress",
	async (context) => {
		const id = Number(context.params.id);

		// Fetch all data
		const [studentRecord] = await db
			.select()
			.from(students)
			.where(eq(students.id, id));
		if (!studentRecord) {
			context.set.status = 404;
			return { success: false, message: "Student not found" };
		}

		const [pmb] = await db
			.select()
			.from(pmbData)
			.where(eq(pmbData.studentId, id));
		const [crm] = await db
			.select()
			.from(crmData)
			.where(eq(crmData.studentId, id));
		const [finance] = await db
			.select()
			.from(financeData)
			.where(eq(financeData.studentId, id));
		const [academic] = await db
			.select()
			.from(academicData)
			.where(eq(academicData.studentId, id));
		const courses = await db
			.select()
			.from(courseGrades)
			.where(eq(courseGrades.studentId, id));
		const [pa] = await db.select().from(paData).where(eq(paData.studentId, id));
		const [internship] = await db
			.select()
			.from(internshipData)
			.where(eq(internshipData.studentId, id));

		const incompleteIndicators: {
			panel: string;
			name: string;
			status: "TIDAK_AMAN" | "PERLU_PERHATIAN";
			link: string;
		}[] = [];
		const panels: any[] = [];

		let totalCompleted = 0;
		let totalIndicators = 0;

		// 1. PMB
		const pmbItems = [
			{ prop: pmb?.formReceived, name: "Formulir Pendaftaran" },
			{ prop: pmb?.documentsComplete, name: "Dokumen Lengkap" },
			{ prop: pmb?.dataInputted, name: "Data Diinput" },
			{ prop: pmb?.initialFollowUp, name: "Follow Up Awal" },
		];
		const pmbCompleted = pmbItems.filter((i) => i.prop).length;
		pmbItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "PMB",
					name: i.name,
					status: "TIDAK_AMAN",
					link: "pmb",
				}),
			);
		panels.push({
			id: "pmb",
			name: "PMB",
			completed: pmbCompleted,
			total: 4,
			status:
				pmbCompleted === 4
					? "AMAN"
					: pmbCompleted >= 2
						? "PERLU_PERHATIAN"
						: "TIDAK_AMAN",
			isAcc: pmb?.isAcc,
		});
		totalCompleted += pmbCompleted;
		totalIndicators += 4;

		// 2. CRM
		const crmItems = [
			{ prop: crm?.odsActive, name: "ODS Aktif" },
			{ prop: crm?.studentMonitoring, name: "Monitoring Mahasiswa" },
			{ prop: crm?.parentFollowUp, name: "Follow Up Orang Tua" },
			{ prop: crm?.practiceAttendance, name: "Update Kehadiran Praktik" },
			{ prop: crm?.odsDocumentation, name: "Dokumentasi ODS" },
		];
		const crmCompleted = crmItems.filter((i) => i.prop).length;
		crmItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "CRM",
					name: i.name,
					status: "PERLU_PERHATIAN",
					link: "crm",
				}),
			);
		panels.push({
			id: "crm",
			name: "CRM",
			completed: crmCompleted,
			total: 5,
			status:
				crmCompleted === 5
					? "AMAN"
					: crmCompleted >= 3
						? "PERLU_PERHATIAN"
						: "TIDAK_AMAN",
			isAcc: crm?.isAcc,
		});
		totalCompleted += crmCompleted;
		totalIndicators += 5;

		// 3. Finance
		const financeItems = [
			{ prop: finance?.registrasiStatus, name: "Registrasi Lunas" },
			{
				prop: finance?.mandiriSemesterStatus || finance?.t1SemesterStatus,
				name: "Semester Lunas",
			},
			{ prop: finance?.toeicStatus, name: "Cicilan Lunas" },
			{ prop: finance?.pasporStatus, name: "Tunggakan Lunas" },
		];
		const financeCompleted = financeItems.filter((i) => i.prop).length;
		financeItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "Finance",
					name: i.name,
					status: "TIDAK_AMAN",
					link: "finance",
				}),
			);
		panels.push({
			id: "finance",
			name: "Finance",
			completed: financeCompleted,
			total: 4,
			status:
				financeCompleted === 4
					? "AMAN"
					: financeCompleted >= 2
						? "PERLU_PERHATIAN"
						: "TIDAK_AMAN",
			isAcc: finance?.isAcc,
		});
		totalCompleted += financeCompleted;
		totalIndicators += 4;

		// 4. Akademik
		const attendanceOk = academic
			? academic.attendanceTotal &&
				academic.attendanceTotal > 0 &&
				academic.attendancePresent! / academic.attendanceTotal! >= 0.8
			: false;
		const academicItems = [
			{ prop: academic?.pddiktiInput, name: "Input PDDIKTI" },
			{ prop: attendanceOk, name: "Kehadiran (≥80%)" },
			{ prop: academic?.utsPassed, name: "Lulus UTS" },
			{ prop: academic?.uasPassed, name: "Lulus UAS" },
			{ prop: academic?.attitudeIndicator, name: "Attitude Baik" },
			{ prop: academic?.assignmentsCompleted, name: "Tugas Selesai" },
			{ prop: academic?.academicCommunication, name: "Komunikasi Akademik" },
		];
		const academicCompleted = academicItems.filter((i) => i.prop).length;
		academicItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "Akademik",
					name: i.name,
					status: "PERLU_PERHATIAN",
					link: "akademik",
				}),
			);
		panels.push({
			id: "akademik",
			name: "Akademik",
			completed: academicCompleted,
			total: 7,
			status:
				academicCompleted === 7
					? "AMAN"
					: academicCompleted >= 4
						? "PERLU_PERHATIAN"
						: "TIDAK_AMAN",
			isAcc: academic?.isAcc,
		});
		totalCompleted += academicCompleted;
		totalIndicators += 7;

		// 5. Dosen per MK
		let dosenCompleted = 0;
		const dosenTotal = courses.length * 3;
		courses.forEach((c) => {
			const attOk = (c.attendanceRate || 0) >= 75;
			const gradeOk = !!c.grade;
			const accOk = !!c.isAcc;
			if (attOk) dosenCompleted++;
			else
				incompleteIndicators.push({
					panel: "Dosen",
					name: `${c.courseName}: Kehadiran <75%`,
					status: "PERLU_PERHATIAN",
					link: "dosen",
				});
			if (gradeOk) dosenCompleted++;
			else
				incompleteIndicators.push({
					panel: "Dosen",
					name: `${c.courseName}: Belum ada nilai`,
					status: "PERLU_PERHATIAN",
					link: "dosen",
				});
			if (accOk) dosenCompleted++;
			else
				incompleteIndicators.push({
					panel: "Dosen",
					name: `${c.courseName}: Belum di-ACC`,
					status: "PERLU_PERHATIAN",
					link: "dosen",
				});
		});
		panels.push({
			id: "dosen",
			name: "Dosen per MK",
			completed: dosenCompleted,
			total: dosenTotal,
			status:
				dosenTotal === 0
					? "AMAN"
					: dosenCompleted === dosenTotal
						? "AMAN"
						: dosenCompleted / dosenTotal >= 0.5
							? "PERLU_PERHATIAN"
							: "TIDAK_AMAN",
			isAcc: courses.length > 0 && courses.every((c: any) => c.isAcc),
		});
		totalCompleted += dosenCompleted;
		totalIndicators += dosenTotal;

		// 6. PA
		const paItems = [
			{ prop: pa?.counselingDone, name: "Konseling Dilakukan" },
			{ prop: pa?.mentalStable, name: "Mental Stabil" },
			{ prop: pa?.disciplineGood, name: "Disiplin Baik" },
		];
		const paCompleted = paItems.filter((i) => i.prop).length;
		paItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "Pendamping Akademik",
					name: i.name,
					status: "PERLU_PERHATIAN",
					link: "pa",
				}),
			);
		panels.push({
			id: "pa",
			name: "Pendamping Akademik",
			completed: paCompleted,
			total: 3,
			status:
				paCompleted === 3
					? "AMAN"
					: paCompleted >= 1
						? "PERLU_PERHATIAN"
						: "TIDAK_AMAN",
			isAcc: pa?.isAcc,
		});
		totalCompleted += paCompleted;
		totalIndicators += 3;

		// 7. Magang
		const magangItems = [
			{ prop: internship?.passportReady, name: "Paspor" },
			{ prop: internship?.interviewReady, name: "Interview User" },
			{ prop: internship?.loaReady, name: "Letter of Acceptance (LoA)" },
			{ prop: internship?.contractReady, name: "Kontrak Magang" },
			{ prop: internship?.mcuReady, name: "Medical Check Up (MCU)" },
			{ prop: internship?.visaReady, name: "Visa" },
			{ prop: internship?.ticketReady, name: "Tiket Pesawat" },
			{ prop: internship?.pdtReady, name: "PDT (Pembekalan)" },
		];
		const magangCompleted = magangItems.filter((i) => i.prop).length;
		magangItems
			.filter((i) => !i.prop)
			.forEach((i) =>
				incompleteIndicators.push({
					panel: "Tim Magang",
					name: i.name,
					status:
						i.name === "Paspor" || i.name === "Visa"
							? "TIDAK_AMAN"
							: "PERLU_PERHATIAN",
					link: "magang",
				}),
			);
		panels.push({
			id: "magang",
			name: "Tim Magang",
			completed: magangCompleted,
			total: 8,
			status:
				magangCompleted === 8
					? "AMAN"
					: magangCompleted >= 4
						? "PERLU_PERHATIAN"
						: "TIDAK_AMAN",
			isAcc: internship?.isAcc,
		});
		totalCompleted += magangCompleted;
		totalIndicators += 8;

		// Overall Status Logic
		let overallStatus = "AMAN";
		if (panels.some((p) => p.status === "TIDAK_AMAN"))
			overallStatus = "TIDAK_AMAN";
		else if (panels.some((p) => p.status === "PERLU_PERHATIAN"))
			overallStatus = "PERLU_PERHATIAN";

		return {
			success: true,
			data: {
				overallStatus,
				totalCompleted,
				totalIndicators,
				panels,
				incompleteIndicators,
			},
		};
	},
);
