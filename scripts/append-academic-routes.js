const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\.PROJECT\\dashboard-nusadaya', 'apps/api/src/routes/students.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('academicData')) {
    content = content.replace(/financeData,/, 'financeData, academicData,');
}

const academicRoutes = `
	// --- ACADEMIC ROUTES ---
	.get("/:id/academic", async ({ params, set }) => {
		const id = Number(params.id);
		const academic = await db.query.academicData.findFirst({
			where: eq(academicData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		return { success: true, data: academic };
	})
	.patch("/:id/academic", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const updates = body as Record<string, any>;

		const current = await db.query.academicData.findFirst({ where: eq(academicData.studentId, id) });
		if (!current) {
			await db.insert(academicData).values({ studentId: id, ...updates });
		} else {
			const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
			await db.update(academicData).set(cleanUpdates).where(eq(academicData.studentId, id));
		}

		// Recalculate status
		const updated = await db.query.academicData.findFirst({ where: eq(academicData.studentId, id) });
		if (updated) {
			let checked = 0;
			if (updated.pddiktiInput) checked++;
			
			const attRate = updated.attendanceTotal > 0 ? (updated.attendancePresent / updated.attendanceTotal) * 100 : 0;
			if (attRate >= 70) checked++;
			
			if (updated.utsPassed) checked++;
			if (updated.uasPassed) checked++;
			if (updated.attitudeIndicator) checked++;
			if (updated.assignmentsCompleted) checked++;
			if (updated.academicCommunication) checked++;

			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (checked === 7) status = "AMAN";
			else if (checked >= 4) status = "PERLU_PERHATIAN";

			await db.update(academicData).set({ status }).where(eq(academicData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/academic/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		// Academic ACC allows "warning" bypass, so we just set isAcc to true regardless of check count
		await db.update(academicData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(academicData.studentId, id));

		return { success: true };
	});
`;

if (!content.includes('// --- ACADEMIC ROUTES ---')) {
    content = content.replace(/}\);\s*$/, academicRoutes);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended Academic routes');
} else {
    console.log('Academic routes already exist');
}
