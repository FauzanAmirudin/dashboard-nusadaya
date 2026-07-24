import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	internshipData,
	internshipMonitoringSchedule,
	students,
} from "../db/schema";
import { requireRole } from "../middleware/rbac";

export const magangRouter = new Elysia({ prefix: "/magang" })
	.use(requireRole(["magang", "superadmin"]))
	.get("/dashboard", async () => {
		const results = await db
			.select({
				student: students,
				internship: internshipData,
			})
			.from(students)
			.leftJoin(internshipData, eq(students.id, internshipData.studentId))
			.orderBy(desc(students.createdAt));

		// Calculate KPIs
		const totalStudents = results.length;
		let readyToDepart = 0;
		let processing = 0;
		let actionNeeded = 0;

		const mappedStudents = results.map(({ student, internship }) => {
			const checks = [
				internship?.passportReady,
				internship?.interviewReady,
				internship?.loaConfirmed, // updated to use loaConfirmed
				internship?.contractReady,
				internship?.mcuReady,
				internship?.visaReady,
				internship?.ticketReady,
				internship?.pdtReady,
			];
			const completedCount = checks.filter(Boolean).length;
			let status = "TIDAK_AMAN";

			if (!internship?.passportReady || !internship?.visaReady) {
				status = "TIDAK_AMAN";
				actionNeeded++;
			} else if (completedCount === 8) {
				status = "AMAN";
				readyToDepart++;
			} else if (completedCount >= 4) {
				status = "PERLU_PERHATIAN";
				processing++;
			} else {
				status = "TIDAK_AMAN";
				actionNeeded++;
			}

			return {
				id: student.id,
				nim: student.nim,
				name: student.name,
				program: student.program,
				destinationCity: internship?.destinationCity || "-",
				internshipCompany: internship?.internshipCompany || "-",
				completedDocs: completedCount,
				status: internship?.status || status,
				estDepartureDate: internship?.estDepartureDate,
				passportReady: internship?.passportReady,
				visaReady: internship?.visaReady,
				mcuReady: internship?.mcuReady,
			};
		});

		return {
			success: true,
			data: {
				kpi: {
					totalStudents,
					readyToDepart,
					processing,
					actionNeeded,
				},
				students: mappedStudents,
			},
		};
	})
	.get("/monitoring/student/:studentId", async ({ params: { studentId } }) => {
		const results = await db
			.select()
			.from(internshipMonitoringSchedule)
			.where(eq(internshipMonitoringSchedule.studentId, Number(studentId)))
			.orderBy(desc(internshipMonitoringSchedule.scheduledDate));
		return { success: true, data: results };
	})
	.post(
		"/monitoring",
		async (context) => {
			const { body } = context;
			const user = (context as any).user;
			const b = body as any;
			await db.insert(internshipMonitoringSchedule).values({
				studentId: b.studentId,
				scheduledDate: new Date(b.scheduledDate),
				monitoringNotes: b.monitoringNotes,
				condition: b.condition,
				conductedBy: user?.userId,
				completedAt: b.condition ? new Date() : null,
			});
			return { success: true };
		},
		{
			body: t.Object({
				studentId: t.Number(),
				scheduledDate: t.String(),
				monitoringNotes: t.Optional(t.String()),
				condition: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/monitoring/:id",
		async (context) => {
			const {
				params: { id },
				body,
			} = context;
			const user = (context as any).user;
			const b = body as any;
			await db
				.update(internshipMonitoringSchedule)
				.set({
					monitoringNotes: b.monitoringNotes,
					condition: b.condition,
					conductedBy: user?.userId,
					completedAt: new Date(),
				})
				.where(eq(internshipMonitoringSchedule.id, Number(id)));
			return { success: true };
		},
		{
			body: t.Object({
				monitoringNotes: t.Optional(t.String()),
				condition: t.Optional(t.String()),
			}),
		},
	);
