import { eq, desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db";
import { internshipData, students } from "../db/schema";
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
		let totalStudents = results.length;
		let readyToDepart = 0;
		let processing = 0;
		let actionNeeded = 0;

		const mappedStudents = results.map(({ student, internship }) => {
			const checks = [
				internship?.passportReady, internship?.interviewReady, internship?.loaReady, 
				internship?.contractReady, internship?.mcuReady, internship?.visaReady, 
				internship?.ticketReady, internship?.pdtReady
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
				completedDocs: completedCount,
				status: internship?.status || status,
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
	});
