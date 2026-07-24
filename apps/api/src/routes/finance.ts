import { desc, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db";
import { financeData, students } from "../db/schema";
import { requireRole } from "../middleware/rbac";

export const financeRouter = new Elysia({ prefix: "/finance" })
	.use(requireRole(["finance", "superadmin", "pmb"]))
	.get("/dashboard", async (context) => {
		const results = await db
			.select({ student: students, finance: financeData })
			.from(students)
			.leftJoin(financeData, eq(students.id, financeData.studentId))
			.orderBy(desc(students.createdAt));

		const mappedStudents = results.map(({ student, finance }) => ({
			id: student.id,
			nim: student.nim,
			name: student.name,
			program: student.program,
			status: finance?.status || "PERLU_PERHATIAN",
			isAcc: finance?.isAcc || false,
			registrationPaid: finance?.registrationPaid || false,
			semesterPaid: finance?.semesterPaid || false,
			installmentCleared: finance?.installmentCleared || false,
			arrearsCleared: finance?.arrearsCleared || false,
			vMitra: finance?.vMitra || 0,
			vKoordinator: finance?.vKoordinator || 0,
			hasInvoice: !!finance?.invoiceFileUrl,
		}));

		const kpi = {
			totalStudents: results.length,
			aman: mappedStudents.filter((s) => s.status === "AMAN").length,
			perhatian: mappedStudents.filter((s) => s.status === "PERLU_PERHATIAN")
				.length,
			tidakAman: mappedStudents.filter((s) => s.status === "TIDAK_AMAN").length,
		};

		return { success: true, data: { kpi, students: mappedStudents } };
	});
