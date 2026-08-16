import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	announcements,
	classSchedules,
	dutySchedules,
	practicumSchedules,
	users,
} from "../db/schema";
import { and, desc, eq, or, asc, sql } from "drizzle-orm";

// Helper for time overlap checking (HH:MM format)
function isTimeOverlap(start1: string, end1: string, start2: string, end2: string) {
	return start1 < end2 && end1 > start2;
}

export const schedulingRoutes = new Elysia({ prefix: "/scheduling" })
	.derive((context) => {
		const user = (context as any).user;
		if (!user) {
			throw new Error("Unauthorized");
		}
		return { user };
	})
	
	// =========================================================================
	// CLASS SCHEDULES
	// =========================================================================
	.get("/class-schedules", async ({ query }) => {
		const { cohort, dayOfWeek, calendarId } = query;
		
		const conditions = [];
		if (cohort) conditions.push(eq(classSchedules.cohort, parseInt(cohort as string, 10)));
		if (dayOfWeek) conditions.push(eq(classSchedules.dayOfWeek, dayOfWeek as string));
		if (calendarId) conditions.push(eq(classSchedules.calendarId, parseInt(calendarId as string, 10)));

		const data = await db.query.classSchedules.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				dosen: {
					columns: { id: true, fullName: true }
				}
			},
			orderBy: [asc(classSchedules.dayOfWeek), asc(classSchedules.startTime)],
		});

		return { success: true, data };
	})
	.post("/class-schedules", async ({ body, set }) => {
		const payload = body as any;

		// Conflict Validation
		const existingClass = await db.query.classSchedules.findMany({
			where: eq(classSchedules.dayOfWeek, payload.dayOfWeek)
		});
		const existingPracticum = await db.query.practicumSchedules.findMany({
			where: eq(practicumSchedules.dayOfWeek, payload.dayOfWeek)
		});
		const existingDuty = await db.query.dutySchedules.findMany({
			where: eq(dutySchedules.dayOfWeek, payload.dayOfWeek)
		});

		// Check Room Conflict
		const allRoomSchedules = [...existingClass, ...existingPracticum, ...existingDuty]
			.filter(s => s.room === payload.room && 
				(!payload.sessionDate || !s.sessionDate || payload.sessionDate === s.sessionDate));
		
		for (const s of allRoomSchedules) {
			if (s.startTime && s.endTime && isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)) {
				set.status = 400;
				return { success: false, message: `Konflik Ruangan: Ruang ${payload.room} sudah terpakai pada rentang waktu ini.` };
			}
		}

		// Check Dosen Conflict
		if (payload.dosenId) {
			const allDosenSchedules = [...existingClass, ...existingPracticum]
				.filter(s => s.dosenId === payload.dosenId && 
					(!payload.sessionDate || !s.sessionDate || payload.sessionDate === s.sessionDate));
			
			for (const s of allDosenSchedules) {
				if (s.startTime && s.endTime && isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)) {
					set.status = 400;
					return { success: false, message: `Konflik Dosen: Dosen sudah memiliki jadwal mengajar pada rentang waktu ini.` };
				}
			}
		}

		const result = await db.insert(classSchedules).values({
			subject: payload.subject,
			dosenId: payload.dosenId,
			cohort: parseInt(payload.cohort, 10),
			room: payload.room,
			dayOfWeek: payload.dayOfWeek,
			sessionDate: payload.sessionDate || null,
			startTime: payload.startTime,
			endTime: payload.endTime,
			calendarId: payload.calendarId ? parseInt(payload.calendarId, 10) : null,
			notes: payload.notes || null,
		}).returning();

		return { success: true, data: result[0] };
	}, {
		body: t.Object({
			subject: t.String(),
			dosenId: t.Optional(t.Number()),
			cohort: t.Union([t.String(), t.Number()]),
			room: t.String(),
			dayOfWeek: t.String(),
			sessionDate: t.Optional(t.String()),
			startTime: t.String(),
			endTime: t.String(),
			calendarId: t.Optional(t.Union([t.String(), t.Number()])),
			notes: t.Optional(t.String()),
		})
	})
	.patch("/class-schedules/:id", async ({ params, body }) => {
		const id = parseInt(params.id, 10);
		const payload = body as any;
		
		// TODO: Advanced conflict check on update could skip itself, simplified for now
		
		const updateData: any = { updatedAt: new Date() };
		if (payload.subject !== undefined) updateData.subject = payload.subject;
		if (payload.dosenId !== undefined) updateData.dosenId = payload.dosenId;
		if (payload.cohort !== undefined) updateData.cohort = parseInt(payload.cohort, 10);
		if (payload.room !== undefined) updateData.room = payload.room;
		if (payload.dayOfWeek !== undefined) updateData.dayOfWeek = payload.dayOfWeek;
		if (payload.sessionDate !== undefined) updateData.sessionDate = payload.sessionDate;
		if (payload.startTime !== undefined) updateData.startTime = payload.startTime;
		if (payload.endTime !== undefined) updateData.endTime = payload.endTime;
		if (payload.calendarId !== undefined) updateData.calendarId = payload.calendarId ? parseInt(payload.calendarId, 10) : null;
		if (payload.notes !== undefined) updateData.notes = payload.notes;

		const result = await db.update(classSchedules)
			.set(updateData)
			.where(eq(classSchedules.id, id))
			.returning();

		return { success: true, data: result[0] };
	})
	.delete("/class-schedules/:id", async ({ params }) => {
		await db.delete(classSchedules).where(eq(classSchedules.id, parseInt(params.id, 10)));
		return { success: true };
	})

	// =========================================================================
	// PRACTICUM SCHEDULES
	// =========================================================================
	.get("/practicum-schedules", async ({ query }) => {
		const { cohort, dayOfWeek, calendarId } = query;
		
		const conditions = [];
		if (cohort) conditions.push(eq(practicumSchedules.cohort, parseInt(cohort as string, 10)));
		if (dayOfWeek) conditions.push(eq(practicumSchedules.dayOfWeek, dayOfWeek as string));
		if (calendarId) conditions.push(eq(practicumSchedules.calendarId, parseInt(calendarId as string, 10)));

		const data = await db.query.practicumSchedules.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				dosen: {
					columns: { id: true, fullName: true }
				}
			},
			orderBy: [asc(practicumSchedules.dayOfWeek), asc(practicumSchedules.startTime)],
		});

		return { success: true, data };
	})
	.post("/practicum-schedules", async ({ body, set }) => {
		const payload = body as any;

		// Conflict Validation (similar logic)
		const existingClass = await db.query.classSchedules.findMany({ where: eq(classSchedules.dayOfWeek, payload.dayOfWeek) });
		const existingPracticum = await db.query.practicumSchedules.findMany({ where: eq(practicumSchedules.dayOfWeek, payload.dayOfWeek) });
		const existingDuty = await db.query.dutySchedules.findMany({ where: eq(dutySchedules.dayOfWeek, payload.dayOfWeek) });

		// Room check
		const allRoomSchedules = [...existingClass, ...existingPracticum, ...existingDuty].filter(s => s.room === payload.room && (!payload.sessionDate || !s.sessionDate || payload.sessionDate === s.sessionDate));
		for (const s of allRoomSchedules) {
			if (s.startTime && s.endTime && isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)) {
				set.status = 400;
				return { success: false, message: `Konflik Ruangan: Ruang ${payload.room} sudah terpakai pada rentang waktu ini.` };
			}
		}

		// Dosen check
		if (payload.dosenId) {
			const allDosenSchedules = [...existingClass, ...existingPracticum].filter(s => s.dosenId === payload.dosenId && (!payload.sessionDate || !s.sessionDate || payload.sessionDate === s.sessionDate));
			for (const s of allDosenSchedules) {
				if (s.startTime && s.endTime && isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)) {
					set.status = 400;
					return { success: false, message: `Konflik Dosen: Dosen sudah memiliki jadwal mengajar pada rentang waktu ini.` };
				}
			}
		}

		const result = await db.insert(practicumSchedules).values({
			subject: payload.subject,
			dosenId: payload.dosenId,
			cohort: parseInt(payload.cohort, 10),
			room: payload.room,
			dayOfWeek: payload.dayOfWeek,
			sessionDate: payload.sessionDate || null,
			startTime: payload.startTime,
			endTime: payload.endTime,
			calendarId: payload.calendarId ? parseInt(payload.calendarId, 10) : null,
			notes: payload.notes || null,
		}).returning();

		return { success: true, data: result[0] };
	}, {
		body: t.Object({
			subject: t.String(),
			dosenId: t.Optional(t.Number()),
			cohort: t.Union([t.String(), t.Number()]),
			room: t.String(),
			dayOfWeek: t.String(),
			sessionDate: t.Optional(t.String()),
			startTime: t.String(),
			endTime: t.String(),
			calendarId: t.Optional(t.Union([t.String(), t.Number()])),
			notes: t.Optional(t.String()),
		})
	})
	.patch("/practicum-schedules/:id", async ({ params, body }) => {
		const id = parseInt(params.id, 10);
		const payload = body as any;
		
		const updateData: any = { updatedAt: new Date() };
		if (payload.subject !== undefined) updateData.subject = payload.subject;
		if (payload.dosenId !== undefined) updateData.dosenId = payload.dosenId;
		if (payload.cohort !== undefined) updateData.cohort = parseInt(payload.cohort, 10);
		if (payload.room !== undefined) updateData.room = payload.room;
		if (payload.dayOfWeek !== undefined) updateData.dayOfWeek = payload.dayOfWeek;
		if (payload.sessionDate !== undefined) updateData.sessionDate = payload.sessionDate;
		if (payload.startTime !== undefined) updateData.startTime = payload.startTime;
		if (payload.endTime !== undefined) updateData.endTime = payload.endTime;
		if (payload.calendarId !== undefined) updateData.calendarId = payload.calendarId ? parseInt(payload.calendarId, 10) : null;
		if (payload.notes !== undefined) updateData.notes = payload.notes;

		const result = await db.update(practicumSchedules).set(updateData).where(eq(practicumSchedules.id, id)).returning();
		return { success: true, data: result[0] };
	})
	.delete("/practicum-schedules/:id", async ({ params }) => {
		await db.delete(practicumSchedules).where(eq(practicumSchedules.id, parseInt(params.id, 10)));
		return { success: true };
	})

	// =========================================================================
	// DUTY SCHEDULES (PIKET)
	// =========================================================================
	.get("/duty-schedules", async ({ query }) => {
		const { cohort, dayOfWeek } = query;
		
		const conditions = [];
		if (cohort) conditions.push(eq(dutySchedules.cohort, parseInt(cohort as string, 10)));
		if (dayOfWeek) conditions.push(eq(dutySchedules.dayOfWeek, dayOfWeek as string));

		const data = await db.query.dutySchedules.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			orderBy: [asc(dutySchedules.dayOfWeek)],
		});

		return { success: true, data };
	})
	.post("/duty-schedules", async ({ body, set }) => {
		const payload = body as any;

		// Room Conflict Check if startTime & endTime provided
		if (payload.startTime && payload.endTime) {
			const existingClass = await db.query.classSchedules.findMany({ where: eq(classSchedules.dayOfWeek, payload.dayOfWeek) });
			const existingPracticum = await db.query.practicumSchedules.findMany({ where: eq(practicumSchedules.dayOfWeek, payload.dayOfWeek) });
			const existingDuty = await db.query.dutySchedules.findMany({ where: eq(dutySchedules.dayOfWeek, payload.dayOfWeek) });

			const allRoomSchedules = [...existingClass, ...existingPracticum, ...existingDuty].filter(s => s.room === payload.room && (!payload.sessionDate || !s.sessionDate || payload.sessionDate === s.sessionDate));
			for (const s of allRoomSchedules) {
				if (s.startTime && s.endTime && isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)) {
					set.status = 400;
					return { success: false, message: `Konflik Ruangan: Ruang ${payload.room} sudah terpakai pada rentang waktu ini.` };
				}
			}
		}

		const result = await db.insert(dutySchedules).values({
			cohort: parseInt(payload.cohort, 10),
			groupName: payload.groupName,
			members: payload.members, // Must be JSON Array
			room: payload.room,
			dayOfWeek: payload.dayOfWeek,
			sessionDate: payload.sessionDate || null,
			startTime: payload.startTime || null,
			endTime: payload.endTime || null,
			calendarId: payload.calendarId ? parseInt(payload.calendarId, 10) : null,
			notes: payload.notes || null,
		}).returning();

		return { success: true, data: result[0] };
	}, {
		body: t.Object({
			cohort: t.Union([t.String(), t.Number()]),
			groupName: t.String(),
			members: t.Array(t.Any()), 
			room: t.String(),
			dayOfWeek: t.String(),
			sessionDate: t.Optional(t.String()),
			startTime: t.Optional(t.String()),
			endTime: t.Optional(t.String()),
			calendarId: t.Optional(t.Union([t.String(), t.Number()])),
			notes: t.Optional(t.String()),
		})
	})
	.patch("/duty-schedules/:id", async ({ params, body }) => {
		const id = parseInt(params.id, 10);
		const payload = body as any;
		
		const updateData: any = { updatedAt: new Date() };
		if (payload.cohort !== undefined) updateData.cohort = parseInt(payload.cohort, 10);
		if (payload.groupName !== undefined) updateData.groupName = payload.groupName;
		if (payload.members !== undefined) updateData.members = payload.members;
		if (payload.room !== undefined) updateData.room = payload.room;
		if (payload.dayOfWeek !== undefined) updateData.dayOfWeek = payload.dayOfWeek;
		if (payload.sessionDate !== undefined) updateData.sessionDate = payload.sessionDate;
		if (payload.startTime !== undefined) updateData.startTime = payload.startTime;
		if (payload.endTime !== undefined) updateData.endTime = payload.endTime;
		if (payload.calendarId !== undefined) updateData.calendarId = payload.calendarId ? parseInt(payload.calendarId, 10) : null;
		if (payload.notes !== undefined) updateData.notes = payload.notes;

		const result = await db.update(dutySchedules).set(updateData).where(eq(dutySchedules.id, id)).returning();
		return { success: true, data: result[0] };
	})
	.delete("/duty-schedules/:id", async ({ params }) => {
		await db.delete(dutySchedules).where(eq(dutySchedules.id, parseInt(params.id, 10)));
		return { success: true };
	})

	// =========================================================================
	// ANNOUNCEMENTS
	// =========================================================================
	.get("/announcements", async ({ query }) => {
		const { targetCohort, search } = query;
		
		const conditions = [];
		if (targetCohort && targetCohort !== "all") {
			conditions.push(
				or(
					eq(announcements.targetCohort, parseInt(targetCohort as string, 10)),
					sql`${announcements.targetCohort} IS NULL`
				)
			);
		}
		if (search) {
			conditions.push(sql`${announcements.title} ILIKE ${`%${search}%`}`);
		}

		const data = await db.query.announcements.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				creator: { columns: { fullName: true } }
			},
			orderBy: [desc(announcements.publishedAt), desc(announcements.createdAt)],
		});

		return { success: true, data };
	})
	.post("/announcements", async ({ body, user }) => {
		const payload = body as any;

		const result = await db.insert(announcements).values({
			title: payload.title,
			description: payload.description,
			targetCohort: payload.targetCohort ? parseInt(payload.targetCohort, 10) : null,
			publishedAt: payload.publishedAt,
			createdBy: user.id,
		}).returning();

		return { success: true, data: result[0] };
	}, {
		body: t.Object({
			title: t.String(),
			description: t.String(),
			targetCohort: t.Optional(t.Union([t.String(), t.Number()])),
			publishedAt: t.String(),
		})
	})
	.patch("/announcements/:id", async ({ params, body }) => {
		const id = parseInt(params.id, 10);
		const payload = body as any;
		
		const updateData: any = { updatedAt: new Date() };
		if (payload.title !== undefined) updateData.title = payload.title;
		if (payload.description !== undefined) updateData.description = payload.description;
		if (payload.targetCohort !== undefined) updateData.targetCohort = payload.targetCohort ? parseInt(payload.targetCohort, 10) : null;
		if (payload.publishedAt !== undefined) updateData.publishedAt = payload.publishedAt;

		const result = await db.update(announcements).set(updateData).where(eq(announcements.id, id)).returning();
		return { success: true, data: result[0] };
	})
	.delete("/announcements/:id", async ({ params }) => {
		await db.delete(announcements).where(eq(announcements.id, parseInt(params.id, 10)));
		return { success: true };
	});
