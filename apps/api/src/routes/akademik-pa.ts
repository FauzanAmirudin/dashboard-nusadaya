import { asc, count, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db";
import { students, users } from "../db/schema";

export const akademikPaRouter = new Elysia({ prefix: "/akademik/pa" })
	// GET /akademik/pa/users — list semua PA user dengan jumlah mahasiswa
	.get("/users", async (context) => {
		const { set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "akademik" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const paUsers = await db
			.select({ id: users.id, fullName: users.fullName, username: users.username })
			.from(users)
			.where(eq(users.role, "pa"))
			.orderBy(asc(users.fullName));

		const studentCounts = await db
			.select({
				paId: students.paId,
				count: count(students.id),
			})
			.from(students)
			.where(eq(students.isArchived, false))
			.groupBy(students.paId);

		const countMap = new Map(studentCounts.map((r) => [r.paId, Number(r.count)]));

		const result = paUsers.map((u) => ({
			id: u.id,
			fullName: u.fullName,
			username: u.username,
			studentCount: countMap.get(u.id) ?? 0,
		}));

		return { success: true, data: result };
	})

	// GET /akademik/pa/users/:paId/students — daftar mahasiswa bimbingan PA tertentu
	.get("/users/:paId/students", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;

		if (!user || (user.role !== "akademik" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const paId = Number(params.paId);
		if (Number.isNaN(paId)) {
			set.status = 400;
			return { success: false, message: "ID tidak valid" };
		}

		const paUser = await db
			.select({ id: users.id, fullName: users.fullName })
			.from(users)
			.where(eq(users.id, paId))
			.limit(1);

		if (!paUser.length) {
			set.status = 404;
			return { success: false, message: "PA tidak ditemukan" };
		}

		const mahasiswa = await db
			.select({
				id: students.id,
				name: students.name,
				nim: students.nim,
				program: students.program,
				subProgram: students.subProgram,
				cohort: students.cohort,
				phone: students.phone,
				academicYear: students.academicYear,
				period: students.period,
			})
			.from(students)
			.where(eq(students.paId, paId))
			.orderBy(asc(students.name));

		return {
			success: true,
			data: {
				pa: paUser[0],
				students: mahasiswa,
			},
		};
	});
