const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\.PROJECT\\dashboard-nusadaya', 'apps/api/src/routes/students.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('vocabLogs')) {
    content = content.replace(/courseGrades,/, 'courseGrades, paData, vocabLogs, counselingLogs,');
}

const paRoutes = `
	// --- PA ROUTES ---
	.get("/:id/pa", async ({ params }) => {
		const id = Number(params.id);
		const paInfo = await db.query.paData.findFirst({
			where: eq(paData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		
		const vocab = await db.query.vocabLogs.findMany({
			where: eq(vocabLogs.studentId, id),
			orderBy: (logs, { desc }) => [desc(logs.date)]
		});
		
		const counseling = await db.query.counselingLogs.findMany({
			where: eq(counselingLogs.studentId, id),
			orderBy: (logs, { desc }) => [desc(logs.date)]
		});
		
		return { 
			success: true, 
			data: paInfo || null,
			vocabLogs: vocab || [],
			counselingLogs: counseling || []
		};
	})
	.patch("/:id/pa", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const updates = body as Record<string, any>;

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
		await db.update(paData).set(cleanUpdates).where(eq(paData.studentId, id));

		// Recalculate status
		const current = await db.query.paData.findFirst({ where: eq(paData.studentId, id) });
		if (current) {
			const isAman = current.counselingDone && current.mentalStable && current.disciplineGood;
			const isKritis = !current.mentalStable && !current.disciplineGood;
			
			const newStatus = isAman ? "AMAN" : isKritis ? "TIDAK_AMAN" : "PERLU_PERHATIAN";
			await db.update(paData).set({ status: newStatus }).where(eq(paData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/pa/vocabulary", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const input = body as any;

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.insert(vocabLogs).values({
			studentId: id,
			addedWords: Number(input.addedWords),
			date: new Date(input.date || Date.now()),
			notes: input.notes
		});

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/pa/counseling", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const input = body as any;

		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.insert(counselingLogs).values({
			studentId: id,
			condition: input.condition,
			date: new Date(input.date || Date.now()),
			notes: input.notes
		});

		// Check if counseling done (>= 3)
		const logs = await db.query.counselingLogs.findMany({ where: eq(counselingLogs.studentId, id) });
		if (logs.length >= 3) {
			await db.update(paData).set({ counselingDone: true }).where(eq(paData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/pa/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		
		if (!user || (user.role !== "pa" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(paData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(paData.studentId, id));

		return { success: true };
	});
`;

if (!content.includes('// --- PA ROUTES ---')) {
    content = content.replace(/}\);\s*$/, paRoutes);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended PA routes');
} else {
    console.log('PA routes already exist');
}
