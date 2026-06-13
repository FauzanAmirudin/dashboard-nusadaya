const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\.PROJECT\\dashboard-nusadaya', 'apps/api/src/routes/students.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure crmData and crmLogs are imported from schema
if (!content.includes('crmData')) {
    content = content.replace(/pmbData,/, 'pmbData, crmData, crmLogs,');
}
if (!content.includes('users,')) {
    content = content.replace(/pmbData,/, 'users, pmbData,');
}

const crmRoutes = `
	// --- CRM ROUTES ---
	.get("/:id/crm", async ({ params, set }) => {
		const id = Number(params.id);
		const crm = await db.query.crmData.findFirst({
			where: eq(crmData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});

		const logs = await db.query.crmLogs.findMany({
			where: eq(crmLogs.studentId, id),
			with: { authorId: { columns: { fullName: true } } },
			orderBy: (crmLogs, { desc }) => [desc(crmLogs.createdAt)],
			limit: 5,
		});

		return { success: true, data: { crm, logs } };
	})
	.patch("/:id/crm", async ({ params, body, set }) => {
		const id = Number(params.id);
		const updates = body as Record<string, any>;

		const current = await db.query.crmData.findFirst({ where: eq(crmData.studentId, id) });
		if (!current) {
			await db.insert(crmData).values({ studentId: id, ...updates });
		} else {
			await db.update(crmData).set({ ...updates, updatedAt: new Date() }).where(eq(crmData.studentId, id));
		}

		// Recalculate status
		const updated = await db.query.crmData.findFirst({ where: eq(crmData.studentId, id) });
		if (updated) {
			let checked = 0;
			if (updated.odsActive) checked++;
			if (updated.studentMonitoring) checked++;
			if (updated.parentFollowUp) checked++;
			if (updated.practiceAttendance) checked++;
			if (updated.odsDocumentation) checked++;

			let status = "TIDAK_AMAN";
			if (checked === 5) status = "AMAN";
			else if (checked >= 3) status = "PERLU_PERHATIAN";

			await db.update(crmData).set({ status }).where(eq(crmData.studentId, id));
		}

		return { success: true };
	})
	.post("/:id/crm/log", async ({ params, body, user, set }) => {
		const id = Number(params.id);
		const { logText } = body as { logText: string };

		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		await db.insert(crmLogs).values({
			studentId: id,
			authorId: user.id,
			logText
		});

		return { success: true };
	})
	.post("/:id/crm/acc", async ({ params, user, set }) => {
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const currentCrm = await db.query.crmData.findFirst({ where: eq(crmData.studentId, id) });
		if (
			!currentCrm ||
			!currentCrm.odsActive ||
			!currentCrm.studentMonitoring ||
			!currentCrm.parentFollowUp ||
			!currentCrm.practiceAttendance ||
			!currentCrm.odsDocumentation
		) {
			set.status = 400;
			return { success: false, message: "Semua checklist harus selesai sebelum ACC." };
		}

		await db.update(crmData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(crmData.studentId, id));

		return { success: true };
	});
`;

if (!content.includes('// --- CRM ROUTES ---')) {
    // Append before the final semicolon if there is one
    content = content.replace(/}\);\s*$/, crmRoutes);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended CRM routes');
} else {
    console.log('CRM routes already exist');
}
