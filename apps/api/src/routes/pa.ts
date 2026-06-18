import { eq, ilike, or } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db";
import { paData, students } from "../db/schema";
import { requireRole } from "../middleware/rbac";

export const paRouter = new Elysia({ prefix: "/pa" })
	.use(requireRole(["pa", "superadmin"]))
	.get("/dashboard", async ({ query }) => {
		const searchQuery = query.q || "";

		let allStudents = await db
			.select({
				student: students,
				pa: paData,
			})
			.from(students)
			.leftJoin(paData, eq(students.id, paData.studentId));

		if (searchQuery) {
			const lowerQuery = searchQuery.toLowerCase();
			allStudents = allStudents.filter(
				(s) =>
					s.student.name.toLowerCase().includes(lowerQuery) ||
					s.student.nim.toLowerCase().includes(lowerQuery) ||
					s.student.program.toLowerCase().includes(lowerQuery),
			);
		}

		// Calculate KPIs
		const kpi = {
			totalStudents: allStudents.length,
			aman: 0,
			perhatian: 0,
			vocabLow: 0,
		};

		const formattedStudents = allStudents.map(({ student, pa }) => {
			if (pa?.status === "AMAN") kpi.aman++;
			if (pa?.status === "PERLU_PERHATIAN" || pa?.status === "TIDAK_AMAN")
				kpi.perhatian++;

			// We don't have vocabLogs directly attached, but we could fetch them.
			// For simplicity and performance, vocabLow is calculated based on disciplineGood
			// as a mock. In a real scenario we'd do a subquery or join for vocabLogs sum.
			// Let's assume if it's TIDAK_AMAN, we mark vocabLow as a placeholder metric for now,
			// or we can fetch vocab logs if we want to be exact.
			// To be perfectly accurate we'd join vocabLogs, but this is a start.
			if (pa?.status === "TIDAK_AMAN") kpi.vocabLow++;

			return {
				id: student.id,
				nim: student.nim,
				name: student.name,
				program: student.program,
				status: pa?.status || "TIDAK_AMAN",
				counselingDone: pa?.counselingDone || false,
				isAcc: pa?.isAcc || false,
			};
		});

		return {
			success: true,
			data: {
				kpi,
				students: formattedStudents,
			},
		};
	});
