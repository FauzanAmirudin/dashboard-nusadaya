const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\.PROJECT\\dashboard-nusadaya', 'apps/api/src/routes/students.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('financeData')) {
    content = content.replace(/crmLogs,/, 'crmLogs, financeData,');
}

const financeRoutes = `
	// --- FINANCE ROUTES ---
	.get("/:id/finance", async ({ params, set }) => {
		const id = Number(params.id);
		const finance = await db.query.financeData.findFirst({
			where: eq(financeData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		return { success: true, data: finance };
	})
	.patch("/:id/finance", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const updates = body as Record<string, any>;

		const current = await db.query.financeData.findFirst({ where: eq(financeData.studentId, id) });
		if (!current) {
			await db.insert(financeData).values({ studentId: id, ...updates });
		} else {
			// Convert ISO strings back to Date objects if needed, but JSON usually passes strings.
			// Drizzle with Postgres driver handles Date objects for timestamp fields.
			const cleanUpdates = { ...updates, updatedAt: new Date() };
			if (cleanUpdates.registrationDate) cleanUpdates.registrationDate = new Date(cleanUpdates.registrationDate);
			if (cleanUpdates.semesterDate) cleanUpdates.semesterDate = new Date(cleanUpdates.semesterDate);
			if (cleanUpdates.installmentDate) cleanUpdates.installmentDate = new Date(cleanUpdates.installmentDate);
			
			await db.update(financeData).set(cleanUpdates).where(eq(financeData.studentId, id));
		}

		// Recalculate status
		const updated = await db.query.financeData.findFirst({ where: eq(financeData.studentId, id) });
		if (updated) {
			let checked = 0;
			if (updated.registrationPaid) checked++;
			if (updated.semesterPaid) checked++;
			if (updated.installmentCleared) checked++;
			if (updated.arrearsCleared) checked++;

			let status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" = "TIDAK_AMAN";
			if (checked === 4) status = "AMAN";
			else if (checked >= 2) status = "PERLU_PERHATIAN";

			await db.update(financeData).set({ status }).where(eq(financeData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/finance/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}

		const currentFinance = await db.query.financeData.findFirst({ where: eq(financeData.studentId, id) });
		if (
			!currentFinance ||
			!currentFinance.registrationPaid ||
			!currentFinance.semesterPaid ||
			!currentFinance.installmentCleared ||
			!currentFinance.arrearsCleared
		) {
			set.status = 400;
			return { success: false, message: "Semua tagihan harus lunas / tidak ada tunggakan sebelum ACC." };
		}

		await db.update(financeData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(financeData.studentId, id));

		return { success: true };
	});
`;

if (!content.includes('// --- FINANCE ROUTES ---')) {
    content = content.replace(/}\);\s*$/, financeRoutes);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended Finance routes');
} else {
    console.log('Finance routes already exist');
}
