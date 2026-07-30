import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	courseGrades,
	practicesBudgetRequests,
	practicesMaterialReports,
	students,
} from "../db/schema";

export const dosenRouter = new Elysia({ prefix: "/dosen" })
	.get("/dashboard", async (context) => {
		const user = (context as any).user;
		const set = context.set;

		if (!user || (user.role !== "dosen" && user.role !== "superadmin")) {
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

		if (user.role !== "superadmin") {
			query = query.where(eq(courseGrades.dosenId, user.id)) as any;
		}

		const grades = await query;

		const totalStudentsSet = new Set<number>();
		let pendingAcc = 0;
		let lowAttendance = 0;

		const mappedGrades = grades.map((g) => {
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
		const uniqueCourses = new Set(grades.map((g) => g.courseGrade.courseCode))
			.size;

		return {
			success: true,
			data: {
				kpi: {
					totalCourses: uniqueCourses,
					totalStudents: totalStudentsSet.size,
					pendingAcc,
					lowAttendance,
				},
				courseGrades: mappedGrades,
			},
		};
	})
	// ====================
	// ANGGARAN PRAKTIK
	// ====================
	.post(
		"/anggaran-praktik",
		async ({ body, user, set }: any) => {
			if (
				!user ||
				(user.role !== "dosen" &&
					user.role !== "akademik" &&
					user.role !== "superadmin")
			) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			await db.insert(practicesBudgetRequests).values({
				dosenId: user.id,
				mataKuliah: body.mataKuliah,
				daftarKebutuhan: body.daftarKebutuhan,
				totalNominal: body.totalNominal,
				status: "menunggu",
			});

			return { success: true };
		},
		{
			body: t.Object({
				mataKuliah: t.String(),
				daftarKebutuhan: t.Array(t.Any()),
				totalNominal: t.Number(),
			}),
		},
	)
	.get("/anggaran-praktik", async ({ user, set }: any) => {
		if (
			!user ||
			(user.role !== "dosen" &&
				user.role !== "akademik" &&
				user.role !== "superadmin")
		) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		let query = db.select().from(practicesBudgetRequests);
		if (user.role === "dosen") {
			query = query.where(eq(practicesBudgetRequests.dosenId, user.id)) as any;
		}

		const requests = await query;
		return { success: true, data: requests };
	})
	.post("/laporan-sisa-bahan", async ({ body, user, set }: any) => {
		if (
			!user ||
			(user.role !== "dosen" &&
				user.role !== "akademik" &&
				user.role !== "superadmin")
		) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const file = body.file as File;
		let fileUrl = "";
		let fileName = "";

		if (file) {
			const uploadDir = join(process.cwd(), "uploads", "practices");
			await mkdir(uploadDir, { recursive: true });

			fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
			fileUrl = join(uploadDir, fileName);

			await Bun.write(fileUrl, await file.arrayBuffer());
		}

		await db.insert(practicesMaterialReports).values({
			budgetRequestId: Number(body.budgetRequestId),
			dosenId: user.id,
			daftarSisaBahan: JSON.parse(body.daftarSisaBahan),
			catatanDosen: body.catatanDosen || "",
			fileUrl: fileUrl,
			fileName: fileName,
		});

		return { success: true };
	});
