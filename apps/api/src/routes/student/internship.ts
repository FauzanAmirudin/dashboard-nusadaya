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

export const internshipRoutes = new Elysia()
	.get("/:id/internship", async ({ params }) => {
		const id = Number(params.id);
		const info = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } },
			},
		});

		return { success: true, data: info || null };
	})
	.get("/:id/passport-clearance", async ({ params }) => {
		const id = Number(params.id);

		const pmbDocs = await db
			.select()
			.from(pmbDocuments)
			.where(eq(pmbDocuments.studentId, id));
		const internshipDocs = await db
			.select()
			.from(internshipDocuments)
			.where(eq(internshipDocuments.studentId, id));
		const academicDocs = await db
			.select()
			.from(academicDocuments)
			.where(eq(academicDocuments.studentId, id));

		const pmbDataRow = await db.query.pmbData.findFirst({
			where: eq(pmbData.studentId, id),
		});
		const academicDataRow = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, id),
		});

		const hasDoc = (docs: any[], key: string) =>
			docs.some((d) => d.documentKey === key);

		const checks = {
			pasFoto: hasDoc(pmbDocs, "pas_foto"),
			cv: hasDoc(pmbDocs, "cv") || hasDoc(internshipDocs, "cv"),
			ktm: hasDoc(pmbDocs, "ktm"),
			khs: hasDoc(academicDocs, "khs"),
			sl21: hasDoc(pmbDocs, "sl21"),
			skma: hasDoc(pmbDocs, "skma"),
			gapYear: pmbDataRow?.isGapYear ? hasDoc(pmbDocs, "gap_year") : true,
			pddikti: academicDataRow?.pddiktiInput === true,
			ktpKkAkta: hasDoc(pmbDocs, "ktp_kk_akta"),
		};

		const isAllClear = Object.values(checks).every((v) => v === true);

		return {
			success: true,
			checks,
			isAllClear,
			isGapYear: pmbDataRow?.isGapYear || false,
		};
	})
	.patch(
		"/:id/internship",
		async (context) => {
			const { params, body, set } = context;
			const id = Number(params.id);
			const user = (context as any).user;
			const updates = body as Record<string, any>;

			if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			// Convert string dates to Date objects if necessary
			const dateFields = [
				"passportExp",
				"interviewDate",
				"contractDate",
				"mcuDate",
				"ticketDate",
				"pdtDate",
				"danaTahap1Date",
				"danaTahap2Date",
			];
			for (const field of dateFields) {
				if (updates[field]) {
					updates[field] = new Date(updates[field]);
				}
			}

			const cleanUpdates: Record<string, any> = {
				...updates,
				updatedAt: new Date(),
			};

			// Validate LoL -> LoA -> MoA State Machine
			if (cleanUpdates.loaConfirmed === true) {
				const current = await db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, id),
				});
				if (!current?.lolReady && !cleanUpdates.lolReady) {
					set.status = 400;
					return {
						success: false,
						message: "LoL (Letter of Offer) harus diselesaikan sebelum LoA.",
					};
				}
			}
			if (cleanUpdates.moaReady === true) {
				const current = await db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, id),
				});
				if (!current?.loaConfirmed && !cleanUpdates.loaConfirmed) {
					set.status = 400;
					return {
						success: false,
						message: "LoA harus dikonfirmasi sebelum memasukkan dokumen MoA.",
					};
				}
			}

			// Validate Dana Talangan Tahap 2
			if (cleanUpdates.isDanaTahap2Disbursed === true) {
				const current = await db.query.internshipData.findFirst({
					where: eq(internshipData.studentId, id),
				});
				if (!current?.visaReady && !cleanUpdates.visaReady) {
					set.status = 400;
					return {
						success: false,
						message:
							"Dana Talangan Tahap II hanya bisa dicairkan jika Visa sudah berstatus Ready.",
					};
				}
			}

			await db
				.update(internshipData)
				.set(cleanUpdates)
				.where(eq(internshipData.studentId, id));

			// Recalculate status
			const current = await db.query.internshipData.findFirst({
				where: eq(internshipData.studentId, id),
			});
			if (current) {
				const checks = [
					current.passportReady,
					current.interviewReady,
					current.loaConfirmed,
					current.contractReady,
					current.mcuReady,
					current.visaReady,
					current.ticketReady,
					current.pdtReady,
				];
				const completedCount = checks.filter(Boolean).length;
				let newStatus: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" =
					"PERLU_PERHATIAN";

				if (completedCount === 8) newStatus = "AMAN";
				else if (completedCount <= 3) newStatus = "TIDAK_AMAN";

				if (!current.passportReady || !current.visaReady) {
					newStatus = "TIDAK_AMAN"; // Blocking rules
				}

				await db
					.update(internshipData)
					.set({ status: newStatus })
					.where(eq(internshipData.studentId, id));
			}

			return { success: true };
		},
		{
			body: t.Record(t.String(), t.Any()),
		},
	)
	.patch(
		"/:id/internship/schedule",
		async (context) => {
			const { params, body, set } = context;
			const id = Number(params.id);
			const user = (context as any).user;
			const input = body as any;

			if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db
				.update(internshipData)
				.set({
					estDepartureDate: input.estDepartureDate
						? new Date(input.estDepartureDate)
						: null,
					destinationCity: input.destinationCity,
					internshipDuration: input.internshipDuration,
					internshipCompany: input.internshipCompany,
					updatedAt: new Date(),
				})
				.where(eq(internshipData.studentId, id));

			return { success: true };
		},
		{
			body: t.Record(t.String(), t.Any()),
		},
	)
	.post("/:id/internship/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db
			.update(internshipData)
			.set({
				isAcc: true,
				accAt: new Date(),
				accBy: user.id,
			})
			.where(eq(internshipData.studentId, id));

		return { success: true };
	})
	.delete("/:id/internship/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);

		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db
			.update(internshipData)
			.set({
				isAcc: false,
				accAt: null,
				accBy: null,
			})
			.where(eq(internshipData.studentId, id));

		return { success: true };
	})
	.patch(
		"/:id/internship",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const current = await db.query.internshipData.findFirst({
				where: eq(internshipData.studentId, id),
			});
			if (!current) {
				set.status = 404;
				return { success: false, message: "Not found" };
			}

			// Convert string dates to Date objects where applicable
			const updates: any = { ...body, updatedAt: new Date() };
			const dateFields = [
				"passportExp",
				"interviewDate",
				"contractDate",
				"mcuDate",
				"ticketDate",
				"pdtDate",
			];
			dateFields.forEach((field) => {
				if (updates[field] !== undefined) {
					updates[field] = updates[field] ? new Date(updates[field]) : null;
				}
			});

			// Update status calculation based on body or current
			const newState = { ...current, ...updates };

			const checks = [
				newState.passportReady,
				newState.interviewReady,
				newState.loaReady,
				newState.contractReady,
				newState.mcuReady,
				newState.visaReady,
				newState.ticketReady,
				newState.pdtReady,
			];
			const completedCount = checks.filter(Boolean).length;

			if (!newState.passportReady || !newState.visaReady) {
				updates.status = "TIDAK_AMAN";
			} else if (completedCount === 8) {
				updates.status = "AMAN";
			} else if (completedCount >= 4) {
				updates.status = "PERLU_PERHATIAN";
			} else {
				updates.status = "TIDAK_AMAN";
			}

			await db
				.update(internshipData)
				.set(updates)
				.where(eq(internshipData.studentId, id));
			await db
				.update(students)
				.set({ overallStatus: updates.status })
				.where(eq(students.id, id));

			return { success: true };
		},
		{
			body: t.Object({
				passportReady: t.Optional(t.Boolean()),
				passportNo: t.Optional(t.Union([t.String(), t.Null()])),
				passportExp: t.Optional(t.Union([t.String(), t.Null()])),
				interviewReady: t.Optional(t.Boolean()),
				interviewDate: t.Optional(t.Union([t.String(), t.Null()])),
				interviewResult: t.Optional(t.Union([t.String(), t.Null()])),
				loaReady: t.Optional(t.Boolean()),
				loaCompany: t.Optional(t.Union([t.String(), t.Null()])),
				loaPosition: t.Optional(t.Union([t.String(), t.Null()])),
				contractReady: t.Optional(t.Boolean()),
				contractDate: t.Optional(t.Union([t.String(), t.Null()])),
				mcuReady: t.Optional(t.Boolean()),
				mcuPlace: t.Optional(t.Union([t.String(), t.Null()])),
				mcuDate: t.Optional(t.Union([t.String(), t.Null()])),
				mcuResult: t.Optional(t.Union([t.String(), t.Null()])),
				visaReady: t.Optional(t.Boolean()),
				visaType: t.Optional(t.Union([t.String(), t.Null()])),
				visaStatus: t.Optional(t.Union([t.String(), t.Null()])),
				visaNo: t.Optional(t.Union([t.String(), t.Null()])),
				ticketReady: t.Optional(t.Boolean()),
				ticketAirline: t.Optional(t.Union([t.String(), t.Null()])),
				ticketDate: t.Optional(t.Union([t.String(), t.Null()])),
				ticketFlight: t.Optional(t.Union([t.String(), t.Null()])),
				pdtReady: t.Optional(t.Boolean()),
				pdtDate: t.Optional(t.Union([t.String(), t.Null()])),
				pdtPlace: t.Optional(t.Union([t.String(), t.Null()])),
				notes: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	)
	.patch(
		"/:id/internship/schedule",
		async (context) => {
			const { params, body, set } = context;
			const user = (context as any).user;
			const id = Number(params.id);

			if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db
				.update(internshipData)
				.set({
					estDepartureDate: body.estDepartureDate
						? new Date(body.estDepartureDate)
						: null,
					destinationCity: body.destinationCity,
					internshipDuration: body.internshipDuration,
					internshipCompany: body.internshipCompany,
					updatedAt: new Date(),
				})
				.where(eq(internshipData.studentId, id));

			return { success: true };
		},
		{
			body: t.Object({
				estDepartureDate: t.Optional(t.Union([t.String(), t.Null()])),
				destinationCity: t.Optional(t.Union([t.String(), t.Null()])),
				internshipDuration: t.Optional(t.Union([t.String(), t.Null()])),
				internshipCompany: t.Optional(t.Union([t.String(), t.Null()])),
			}),
		},
	);
