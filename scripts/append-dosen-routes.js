const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\.PROJECT\\dashboard-nusadaya', 'apps/api/src/routes/students.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('courseGrades')) {
    content = content.replace(/academicData,/, 'academicData, courseGrades, users,');
}

const dosenRoutes = `
	// --- DOSEN ROUTES ---
	.get("/:id/course-grades", async ({ params, set }) => {
		const id = Number(params.id);
		const grades = await db.query.courseGrades.findMany({
			where: eq(courseGrades.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		return { success: true, data: grades };
	})
	.patch("/:id/course-grades/:courseId", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const courseId = Number(params.courseId);
		const user = (context as any).user;
		const updates = body as Record<string, any>;

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const current = await db.query.courseGrades.findFirst({ 
			where: eq(courseGrades.id, courseId)
		});

		if (!current) {
			set.status = 404;
			return { success: false, message: "Course not found" };
		}

		// Only superadmin or the assigned dosen can edit
		if (user.role !== "superadmin" && current.dosenId !== user.id) {
			set.status = 403;
			return { success: false, message: "Forbidden: Not assigned to this course" };
		}

		const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
		await db.update(courseGrades).set(cleanUpdates).where(eq(courseGrades.id, courseId));

		// Recalculate status per MK
		const updated = await db.query.courseGrades.findFirst({ where: eq(courseGrades.id, courseId) });
		if (updated) {
			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			const att = updated.attendanceRate || 0;
			const grade = updated.grade || "E";
			const attitude = updated.attitudeNote || "Buruk";

			// Status logic from UI Plan
			const isAmanGrade = ["A", "A-", "B+", "B"].includes(grade);
			const isPerhatianGrade = grade === "B-";
			
			if (att >= 70 && isAmanGrade && attitude === "Baik") {
				status = "AMAN";
			} else if (att >= 60 || isPerhatianGrade) {
				status = "PERLU_PERHATIAN";
			}
			// If att < 60 or grade <= C, it remains TIDAK_AMAN

			await db.update(courseGrades).set({ status }).where(eq(courseGrades.id, courseId));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/course-grades/:courseId/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const courseId = Number(params.courseId);
		
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const current = await db.query.courseGrades.findFirst({ 
			where: eq(courseGrades.id, courseId)
		});

		if (!current) {
			set.status = 404;
			return { success: false, message: "Course not found" };
		}

		if (user.role !== "superadmin" && current.dosenId !== user.id) {
			set.status = 403;
			return { success: false, message: "Forbidden: Not assigned to this course" };
		}

		await db.update(courseGrades).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(courseGrades.id, courseId));

		return { success: true };
	});
`;

if (!content.includes('// --- DOSEN ROUTES ---')) {
    content = content.replace(/}\);\s*$/, dosenRoutes);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended Dosen routes');
} else {
    console.log('Dosen routes already exist');
}
