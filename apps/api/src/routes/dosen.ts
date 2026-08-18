import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	courseGrades,
	practicesBudgetRequests,
	practicesMaterialReports,
	students,
} from "../db/schema";
import { hasRole } from "../lib/permissions";
import { fileService } from "../modules/file/service/file.service";

export const dosenRouter = new Elysia({ prefix: "/dosen" }).get(
	"/dashboard",
	async (context) => {
		const user = (context as any).user;
		const set = context.set;

		if (!hasRole(user, "dosen")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		let query = db
			.select({
				courseGrade: courseGrades,
				student: students,
			})
			.from(courseGrades)
			.innerJoin(students, eq(courseGrades.studentId, students.id));

		if (!hasRole(user, "superadmin")) {
			query = query.where(eq(courseGrades.dosenId, user.id)) as any;
		}

		const grades = await query;

		const studentMap = new Map<number, any>();
		let pendingAccCount = 0;
		let lowAttendanceCount = 0;

		for (const g of grades) {
			const sId = g.student.id;
			if (!studentMap.has(sId)) {
				studentMap.set(sId, {
					studentId: sId,
					studentName: g.student.name,
					studentNim: g.student.nim || "-",
					studentCohort: g.student.cohort,
					program: g.student.program,
					subProgram: g.student.subProgram,
					courses: [],
				});
			}

			const std = studentMap.get(sId);
			std.courses.push({
				id: g.courseGrade.id,
				courseCode: g.courseGrade.courseCode,
				courseName: g.courseGrade.courseName,
				grade: g.courseGrade.grade,
				attendanceRate: g.courseGrade.attendanceRate,
				isAcc: g.courseGrade.isAcc,
				status: g.courseGrade.status,
			});
		}

		const studentRows = Array.from(studentMap.values()).map((std) => {
			const totalCrs = std.courses.length;
			const totalAtt = std.courses.reduce(
				(acc: number, c: any) => acc + (c.attendanceRate || 0),
				0,
			);
			const avgAtt = totalCrs > 0 ? Math.round(totalAtt / totalCrs) : 0;
			const isAllAcc = totalCrs > 0 && std.courses.every((c: any) => c.isAcc);
			const hasTidakAman = std.courses.some(
				(c: any) => c.status === "TIDAK_AMAN",
			);
			const hasPerhatian = std.courses.some(
				(c: any) => c.status === "PERLU_PERHATIAN",
			);
			const overallStatus = hasTidakAman
				? "TIDAK_AMAN"
				: hasPerhatian
					? "PERLU_PERHATIAN"
					: "AMAN";

			if (!isAllAcc) pendingAccCount++;
			if (avgAtt < 80) lowAttendanceCount++;

			return {
				...std,
				totalCourses: totalCrs,
				avgAttendance: avgAtt,
				isAllAcc,
				overallStatus,
			};
		});

		// Count unique courses based on courseCode
		const uniqueCourses = new Set(grades.map((g) => g.courseGrade.courseCode))
			.size;

		return {
			success: true,
			data: {
				kpi: {
					totalCourses: uniqueCourses,
					totalStudents: studentRows.length,
					pendingAcc: pendingAccCount,
					lowAttendance: lowAttendanceCount,
				},
				students: studentRows,
			},
		};
	},
);
