import { and, asc, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	academicCalendars,
	academicEvents,
	academicPeriods,
} from "../db/schema";

export const academicCalendarRoutes = new Elysia({
	prefix: "/academic-calendars",
})
	// Check Authentication
	.derive((context) => {
		const user = (context as any).user;
		return { user };
	})
	// GET all calendars
	.get("/", async ({ query }) => {
		const { academicYear, cohort, page, limit } = query;

		let whereClause;
		const conditions = [];

		if (academicYear)
			conditions.push(
				eq(academicCalendars.academicYear, academicYear as string),
			);
		if (cohort)
			conditions.push(
				eq(academicCalendars.cohort, parseInt(cohort as string, 10)),
			);

		if (conditions.length > 0) {
			whereClause = and(...conditions);
		}

		const p = parseInt((page as string) || "1", 10);
		const l = parseInt((limit as string) || "50", 10);
		const offset = (p - 1) * l;

		const data = await db.query.academicCalendars.findMany({
			where: whereClause,
			limit: l,
			offset: offset,
			orderBy: [desc(academicCalendars.createdAt)],
		});

		const allData = await db.query.academicCalendars.findMany({
			where: whereClause,
		});

		return {
			success: true,
			data,
			meta: {
				total: allData.length,
				page: p,
				lastPage: Math.ceil(allData.length / l),
			},
		};
	})
	// POST new calendar
	.post(
		"/",
		async ({ body, user }) => {
			const payload = body as any;

			const result = await db
				.insert(academicCalendars)
				.values({
					academicYear: payload.academicYear,
					cohort: parseInt(payload.cohort, 10),
					startDate: payload.startDate,
					endDate: payload.endDate,
					status: payload.status || "active",
					createdBy: user.id,
				})
				.returning();

			const calendarId = result[0].id;

			// Auto-generate default periods
			const defaultPeriods = [
				{ title: "PKKMB", periodType: "pkkmb" },
				{ title: "Beginning Class", periodType: "beginning_class" },
				{ title: "Pertemuan Ke-1", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-2", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-3", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-4", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-5", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-6", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-7", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-8 (UTS)", periodType: "uts" },
				{ title: "Pertemuan Ke-9", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-10", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-11", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-12", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-13", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-14", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-15", periodType: "pertemuan" },
				{ title: "Pertemuan Ke-16 (UAS)", periodType: "uas" },
			];

			await db.insert(academicPeriods).values(
				defaultPeriods.map((p, index) => ({
					calendarId,
					title: p.title,
					periodType: p.periodType as any,
					startDate: payload.startDate,
					endDate: payload.endDate,
					orderIndex: index,
				})),
			);

			return { success: true, data: result[0] };
		},
		{
			body: t.Object({
				academicYear: t.String(),
				cohort: t.Union([t.String(), t.Number()]),
				startDate: t.String(),
				endDate: t.String(),
				status: t.Optional(t.String()),
			}),
		},
	)
	// GET detail calendar
	.get("/:id", async ({ params }) => {
		const id = parseInt(params.id, 10);
		const data = await db.query.academicCalendars.findFirst({
			where: eq(academicCalendars.id, id),
			with: {
				periods: {
					orderBy: [
						asc(academicPeriods.orderIndex),
						asc(academicPeriods.startDate),
					],
				},
				events: {
					orderBy: [asc(academicEvents.startDate)],
				},
			},
		});

		if (!data) throw new Error("Calendar not found");
		return { success: true, data };
	})
	// PATCH update calendar
	.patch(
		"/:id",
		async ({ params, body }) => {
			const id = parseInt(params.id, 10);
			const payload = body as any;

			const updateData: any = { updatedAt: new Date() };
			if (payload.academicYear !== undefined)
				updateData.academicYear = payload.academicYear;
			if (payload.cohort !== undefined)
				updateData.cohort = parseInt(payload.cohort, 10);
			if (payload.startDate !== undefined)
				updateData.startDate = payload.startDate;
			if (payload.endDate !== undefined) updateData.endDate = payload.endDate;
			if (payload.status !== undefined) updateData.status = payload.status;

			const result = await db
				.update(academicCalendars)
				.set(updateData)
				.where(eq(academicCalendars.id, id))
				.returning();

			return { success: true, data: result[0] };
		},
		{
			body: t.Object({
				academicYear: t.Optional(t.String()),
				cohort: t.Optional(t.Union([t.String(), t.Number()])),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
				status: t.Optional(t.String()),
			}),
		},
	)
	// DELETE calendar
	.delete("/:id", async ({ params }) => {
		const id = parseInt(params.id, 10);
		await db.delete(academicCalendars).where(eq(academicCalendars.id, id));
		return { success: true };
	})
	// Generate Default Periods for existing calendar
	.post("/:id/generate-defaults", async ({ params }) => {
		const calendarId = parseInt(params.id, 10);

		const calendar = await db.query.academicCalendars.findFirst({
			where: eq(academicCalendars.id, calendarId),
		});

		if (!calendar) throw new Error("Calendar not found");

		const defaultPeriods = [
			{ title: "PKKMB", periodType: "pkkmb" },
			{ title: "Beginning Class", periodType: "beginning_class" },
			{ title: "Pertemuan Ke-1", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-2", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-3", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-4", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-5", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-6", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-7", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-8 (UTS)", periodType: "uts" },
			{ title: "Pertemuan Ke-9", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-10", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-11", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-12", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-13", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-14", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-15", periodType: "pertemuan" },
			{ title: "Pertemuan Ke-16 (UAS)", periodType: "uas" },
		];

		await db.insert(academicPeriods).values(
			defaultPeriods.map((p, index) => ({
				calendarId,
				title: p.title,
				periodType: p.periodType as any,
				startDate: calendar.startDate,
				endDate: calendar.endDate,
				orderIndex: index,
			})),
		);

		return { success: true };
	})
	// --- PERIODS ---
	.post(
		"/:id/periods",
		async ({ params, body }) => {
			const calendarId = parseInt(params.id, 10);
			const payload = body as any;

			const result = await db
				.insert(academicPeriods)
				.values({
					calendarId,
					title: payload.title,
					description: payload.description || null,
					periodType: payload.periodType as any,
					startDate: payload.startDate,
					endDate: payload.endDate,
					orderIndex: payload.orderIndex || 0,
				})
				.returning();

			return { success: true, data: result[0] };
		},
		{
			body: t.Object({
				title: t.String(),
				description: t.Optional(t.String()),
				periodType: t.String(),
				startDate: t.String(),
				endDate: t.String(),
				orderIndex: t.Optional(t.Number()),
			}),
		},
	)
	.patch(
		"/:id/periods/:periodId",
		async ({ params, body }) => {
			const periodId = parseInt(params.periodId, 10);
			const payload = body as any;

			const updateData: any = { updatedAt: new Date() };
			if (payload.title !== undefined) updateData.title = payload.title;
			if (payload.description !== undefined)
				updateData.description = payload.description;
			if (payload.periodType !== undefined)
				updateData.periodType = payload.periodType;
			if (payload.startDate !== undefined)
				updateData.startDate = payload.startDate;
			if (payload.endDate !== undefined) updateData.endDate = payload.endDate;
			if (payload.orderIndex !== undefined)
				updateData.orderIndex = payload.orderIndex;

			const result = await db
				.update(academicPeriods)
				.set(updateData)
				.where(eq(academicPeriods.id, periodId))
				.returning();

			return { success: true, data: result[0] };
		},
		{
			body: t.Object({
				title: t.Optional(t.String()),
				description: t.Optional(t.String()),
				periodType: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
				orderIndex: t.Optional(t.Number()),
			}),
		},
	)
	.delete("/:id/periods/:periodId", async ({ params }) => {
		const periodId = parseInt(params.periodId, 10);
		await db.delete(academicPeriods).where(eq(academicPeriods.id, periodId));
		return { success: true };
	})
	// --- EVENTS ---
	.post(
		"/:id/events",
		async ({ params, body }) => {
			const calendarId = parseInt(params.id, 10);
			const payload = body as any;

			const result = await db
				.insert(academicEvents)
				.values({
					calendarId,
					title: payload.title,
					description: payload.description || null,
					startDate: payload.startDate,
					endDate: payload.endDate || null,
				})
				.returning();

			return { success: true, data: result[0] };
		},
		{
			body: t.Object({
				title: t.String(),
				description: t.Optional(t.String()),
				startDate: t.String(),
				endDate: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/:id/events/:eventId",
		async ({ params, body }) => {
			const eventId = parseInt(params.eventId, 10);
			const payload = body as any;

			const updateData: any = { updatedAt: new Date() };
			if (payload.title !== undefined) updateData.title = payload.title;
			if (payload.description !== undefined)
				updateData.description = payload.description;
			if (payload.startDate !== undefined)
				updateData.startDate = payload.startDate;
			if (payload.endDate !== undefined) updateData.endDate = payload.endDate;

			const result = await db
				.update(academicEvents)
				.set(updateData)
				.where(eq(academicEvents.id, eventId))
				.returning();

			return { success: true, data: result[0] };
		},
		{
			body: t.Object({
				title: t.Optional(t.String()),
				description: t.Optional(t.String()),
				startDate: t.Optional(t.String()),
				endDate: t.Optional(t.String()),
			}),
		},
	)
	.delete("/:id/events/:eventId", async ({ params }) => {
		const eventId = parseInt(params.eventId, 10);
		await db.delete(academicEvents).where(eq(academicEvents.id, eventId));
		return { success: true };
	});
