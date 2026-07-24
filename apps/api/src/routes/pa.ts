import { eq, ilike, or } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db";
import { paData, students, users } from "../db/schema";
import { requireRole } from "../middleware/rbac";

export const paRouter = new Elysia({ prefix: "/pa" })
	.use(requireRole(["pa", "superadmin"]))
	.get("/dashboard", async (context) => {
		const { query } = context;
		const user = (context as any).user;
		const searchQuery = query.q || "";

		let allStudentsQuery = db
			.select({
				student: students,
				pa: paData,
				paUser: users,
			})
			.from(students)
			.leftJoin(paData, eq(students.id, paData.studentId))
			.leftJoin(users, eq(students.paId, users.id));

		if (user && user.role !== "superadmin") {
			allStudentsQuery = allStudentsQuery.where(
				eq(students.paId, user.id),
			) as any;
		}

		let allStudents = await allStudentsQuery;

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

		const formattedStudents = allStudents.map(({ student, pa, paUser }) => {
			if (pa?.status === "AMAN") kpi.aman++;
			if (
				!pa?.status ||
				pa?.status === "PERLU_PERHATIAN" ||
				pa?.status === "TIDAK_AMAN"
			)
				kpi.perhatian++;

			if (pa?.status === "TIDAK_AMAN") kpi.vocabLow++;

			return {
				id: student.id,
				nim: student.nim,
				name: student.name,
				program: student.program,
				paName: paUser?.fullName || "-",
				status: pa?.status || "PERLU_PERHATIAN",
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
