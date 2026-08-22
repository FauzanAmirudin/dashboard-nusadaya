import { and, count, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	academicData,
	crmData,
	finalDecision,
	financeData,
	internshipData,
	paData,
	pmbData,
	students,
} from "../db/schema";
import { cacheGet, cacheSet } from "../lib/cache";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" }).get(
	"/summary",
	async ({ query }) => {
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
		const isArchived = query?.archived === "true";
		const cacheKey = `cache:dashboard:summary:${cohort || "all"}:${isArchived}`;

		const cached = await cacheGet<any>(cacheKey);
		if (cached) {
			return { success: true, data: cached };
		}

		// Base filter condition
		const conditions = [eq(students.isArchived, isArchived)];
		if (cohort && !Number.isNaN(cohort)) {
			conditions.push(eq(students.cohort, cohort));
		}
		const whereClause = and(...conditions);

		// 1. Student counts & statuses
		const [overallStats] = await db
			.select({
				total: count(students.id),
				aman: sql<number>`count(*) filter (where ${students.overallStatus} = 'AMAN')`,
				perluPerhatian: sql<number>`count(*) filter (where ${students.overallStatus} = 'PERLU_PERHATIAN')`,
				tidakAman: sql<number>`count(*) filter (where ${students.overallStatus} = 'TIDAK_AMAN')`,
				aktif: sql<number>`count(*) filter (where ${students.studentStatus} = 'aktif')`,
				cuti: sql<number>`count(*) filter (where ${students.studentStatus} = 'cuti')`,
				lulus: sql<number>`count(*) filter (where ${students.studentStatus} = 'lulus')`,
				alumni: sql<number>`count(*) filter (where ${students.studentStatus} = 'alumni')`,
				dropout: sql<number>`count(*) filter (where ${students.studentStatus} = 'dropout')`,
				keluar: sql<number>`count(*) filter (where ${students.studentStatus} = 'keluar')`,
				mengundurkanDiri: sql<number>`count(*) filter (where ${students.studentStatus} = 'mengundurkan_diri')`,
			})
			.from(students)
			.where(whereClause);

		// 2. Panel statuses (PMB, CRM, Finance, Academic, PA, Internship, Decision)
		const [panelStats] = await db
			.select({
				pmbAcc: sql<number>`count(*) filter (where ${pmbData.isAcc} = true)`,
				pmbAman: sql<number>`count(*) filter (where ${pmbData.status} = 'AMAN')`,
				pmbPerluPerhatian: sql<number>`count(*) filter (where ${pmbData.status} = 'PERLU_PERHATIAN')`,
				pmbTidakAman: sql<number>`count(*) filter (where ${pmbData.status} = 'TIDAK_AMAN')`,

				crmAcc: sql<number>`count(*) filter (where ${crmData.isAcc} = true)`,
				crmAman: sql<number>`count(*) filter (where ${crmData.status} = 'AMAN')`,
				crmPerluPerhatian: sql<number>`count(*) filter (where ${crmData.status} = 'PERLU_PERHATIAN')`,
				crmTidakAman: sql<number>`count(*) filter (where ${crmData.status} = 'TIDAK_AMAN')`,

				financeAcc: sql<number>`count(*) filter (where ${financeData.isAcc} = true)`,
				financeAman: sql<number>`count(*) filter (where ${financeData.status} = 'AMAN')`,
				financePerluPerhatian: sql<number>`count(*) filter (where ${financeData.status} = 'PERLU_PERHATIAN')`,
				financeTidakAman: sql<number>`count(*) filter (where ${financeData.status} = 'TIDAK_AMAN')`,

				academicAcc: sql<number>`count(*) filter (where ${academicData.isAcc} = true)`,
				academicAman: sql<number>`count(*) filter (where ${academicData.status} = 'AMAN')`,
				academicPerluPerhatian: sql<number>`count(*) filter (where ${academicData.status} = 'PERLU_PERHATIAN')`,
				academicTidakAman: sql<number>`count(*) filter (where ${academicData.status} = 'TIDAK_AMAN')`,

				paAcc: sql<number>`count(*) filter (where ${paData.isAcc} = true)`,
				paAman: sql<number>`count(*) filter (where ${paData.status} = 'AMAN')`,
				paPerluPerhatian: sql<number>`count(*) filter (where ${paData.status} = 'PERLU_PERHATIAN')`,
				paTidakAman: sql<number>`count(*) filter (where ${paData.status} = 'TIDAK_AMAN')`,

				internshipAcc: sql<number>`count(*) filter (where ${internshipData.isAcc} = true)`,
				internshipAman: sql<number>`count(*) filter (where ${internshipData.status} = 'AMAN')`,
				internshipPerluPerhatian: sql<number>`count(*) filter (where ${internshipData.status} = 'PERLU_PERHATIAN')`,
				internshipTidakAman: sql<number>`count(*) filter (where ${internshipData.status} = 'TIDAK_AMAN')`,

				layakBerangkat: sql<number>`count(*) filter (where ${finalDecision.evaluatorDecision} = 'layak_berangkat')`,
				disetujuiDirektur: sql<number>`count(*) filter (where ${finalDecision.isApprovedByDirector} = true)`,
				menungguEvaluator: sql<number>`count(*) filter (where ${finalDecision.evaluatorDecision} = 'menunggu' or ${finalDecision.evaluatorDecision} is null)`,
			})
			.from(students)
			.leftJoin(pmbData, eq(students.id, pmbData.studentId))
			.leftJoin(crmData, eq(students.id, crmData.studentId))
			.leftJoin(financeData, eq(students.id, financeData.studentId))
			.leftJoin(academicData, eq(students.id, academicData.studentId))
			.leftJoin(paData, eq(students.id, paData.studentId))
			.leftJoin(internshipData, eq(students.id, internshipData.studentId))
			.leftJoin(finalDecision, eq(students.id, finalDecision.studentId))
			.where(whereClause);

		// 3. Distinct cohorts list
		const cohortsResult = await db
			.selectDistinct({ cohort: students.cohort })
			.from(students)
			.orderBy(sql`${students.cohort} desc`);

		const summaryData = {
			totalStudents: Number(overallStats?.total || 0),
			byStatus: {
				AMAN: Number(overallStats?.aman || 0),
				PERLU_PERHATIAN: Number(overallStats?.perluPerhatian || 0),
				TIDAK_AMAN: Number(overallStats?.tidakAman || 0),
			},
			byStudentStatus: {
				aktif: Number(overallStats?.aktif || 0),
				cuti: Number(overallStats?.cuti || 0),
				lulus: Number(overallStats?.lulus || 0),
				alumni: Number(overallStats?.alumni || 0),
				dropout: Number(overallStats?.dropout || 0),
				keluar: Number(overallStats?.keluar || 0),
				mengundurkanDiri: Number(overallStats?.mengundurkanDiri || 0),
			},
			panels: {
				pmb: {
					acc: Number(panelStats?.pmbAcc || 0),
					aman: Number(panelStats?.pmbAman || 0),
					perluPerhatian: Number(panelStats?.pmbPerluPerhatian || 0),
					tidakAman: Number(panelStats?.pmbTidakAman || 0),
				},
				crm: {
					acc: Number(panelStats?.crmAcc || 0),
					aman: Number(panelStats?.crmAman || 0),
					perluPerhatian: Number(panelStats?.crmPerluPerhatian || 0),
					tidakAman: Number(panelStats?.crmTidakAman || 0),
				},
				finance: {
					acc: Number(panelStats?.financeAcc || 0),
					aman: Number(panelStats?.financeAman || 0),
					perluPerhatian: Number(panelStats?.financePerluPerhatian || 0),
					tidakAman: Number(panelStats?.financeTidakAman || 0),
				},
				academic: {
					acc: Number(panelStats?.academicAcc || 0),
					aman: Number(panelStats?.academicAman || 0),
					perluPerhatian: Number(panelStats?.academicPerluPerhatian || 0),
					tidakAman: Number(panelStats?.academicTidakAman || 0),
				},
				pa: {
					acc: Number(panelStats?.paAcc || 0),
					aman: Number(panelStats?.paAman || 0),
					perluPerhatian: Number(panelStats?.paPerluPerhatian || 0),
					tidakAman: Number(panelStats?.paTidakAman || 0),
				},
				internship: {
					acc: Number(panelStats?.internshipAcc || 0),
					aman: Number(panelStats?.internshipAman || 0),
					perluPerhatian: Number(panelStats?.internshipPerluPerhatian || 0),
					tidakAman: Number(panelStats?.internshipTidakAman || 0),
				},
			},
			evaluator: {
				layakBerangkat: Number(panelStats?.layakBerangkat || 0),
				disetujuiDirektur: Number(panelStats?.disetujuiDirektur || 0),
				menunggu: Number(panelStats?.menungguEvaluator || 0),
			},
			cohorts: cohortsResult.map((c) => c.cohort),
			updatedAt: new Date().toISOString(),
		};

		await cacheSet(cacheKey, summaryData, 60);

		return { success: true, data: summaryData };
	},
	{
		query: t.Optional(
			t.Object({
				cohort: t.Optional(t.String()),
				archived: t.Optional(t.String()),
			}),
		),
	},
);
