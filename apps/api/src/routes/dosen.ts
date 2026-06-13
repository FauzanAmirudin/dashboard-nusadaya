import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { courseGrades, students } from "../db/schema";

export const dosenRouter = new Elysia({ prefix: "/dosen" })
	.get("/dashboard", async (context) => {
		const user = (context as any).user;
		const set = context.set;

		if (!user || user.role !== "dosen") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		// Fetch all course grades assigned to this dosen, joined with students
		const grades = await db
			.select({
				courseGrade: courseGrades,
				student: students,
			})
			.from(courseGrades)
			.innerJoin(students, eq(courseGrades.studentId, students.id))
			.where(eq(courseGrades.dosenId, user.id));

		const totalStudentsSet = new Set<number>();
		let pendingAcc = 0;
		let lowAttendance = 0;

		const mappedGrades = grades.map(g => {
			totalStudentsSet.add(g.student.id);
			if (!g.courseGrade.isAcc) pendingAcc++;
			if ((g.courseGrade.attendanceRate || 0) < 70) lowAttendance++;

			return {
				id: g.courseGrade.id,
				studentId: g.student.id,
				studentName: g.student.name,
				studentNim: g.student.nim,
				courseCode: g.courseGrade.courseCode,
				courseName: g.courseGrade.courseName,
				grade: g.courseGrade.grade,
				attendanceRate: g.courseGrade.attendanceRate,
				isAcc: g.courseGrade.isAcc,
				status: g.courseGrade.status,
			};
		});

		// Count unique courses based on courseCode
		const uniqueCourses = new Set(grades.map(g => g.courseGrade.courseCode)).size;

		return {
			success: true,
			data: {
				kpi: {
					totalCourses: uniqueCourses,
					totalStudents: totalStudentsSet.size,
					pendingAcc,
					lowAttendance,
				},
				courseGrades: mappedGrades
			}
		};
	});
