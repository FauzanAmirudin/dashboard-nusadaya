const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\.PROJECT\\dashboard-nusadaya', 'apps/api/src/routes/students.ts');
let content = fs.readFileSync(filePath, 'utf8');

const internshipRoutes = `
	// --- INTERNSHIP ROUTES ---
	.get("/:id/internship", async ({ params }) => {
		const id = Number(params.id);
		const info = await db.query.internshipData.findFirst({
			where: eq(internshipData.studentId, id),
			with: {
				accBy: { columns: { fullName: true } }
			}
		});
		
		return { success: true, data: info || null };
	})
	.patch("/:id/internship", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const updates = body as Record<string, any>;

		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		// Convert string dates to Date objects if necessary
		const dateFields = ["passportExp", "interviewDate", "contractDate", "mcuDate", "ticketDate", "pdtDate"];
		for (const field of dateFields) {
			if (updates[field]) {
				updates[field] = new Date(updates[field]);
			}
		}

		const cleanUpdates: Record<string, any> = { ...updates, updatedAt: new Date() };
		await db.update(internshipData).set(cleanUpdates).where(eq(internshipData.studentId, id));

		// Recalculate status
		const current = await db.query.internshipData.findFirst({ where: eq(internshipData.studentId, id) });
		if (current) {
			const checks = [
				current.passportReady, current.interviewReady, current.loaReady, 
				current.contractReady, current.mcuReady, current.visaReady, 
				current.ticketReady, current.pdtReady
			];
			const completedCount = checks.filter(Boolean).length;
			let newStatus = "PERLU_PERHATIAN";
			
			if (completedCount === 8) newStatus = "AMAN";
			else if (completedCount <= 3) newStatus = "TIDAK_AMAN";
			
			if (!current.passportReady || !current.visaReady) {
				newStatus = "TIDAK_AMAN"; // Blocking rules
			}
			
			await db.update(internshipData).set({ status: newStatus }).where(eq(internshipData.studentId, id));
		}

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.patch("/:id/internship/schedule", async (context) => {
		const { params, body, set } = context;
		const id = Number(params.id);
		const user = (context as any).user;
		const input = body as any;

		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(internshipData).set({
			estDepartureDate: input.estDepartureDate ? new Date(input.estDepartureDate) : null,
			destinationCity: input.destinationCity,
			internshipDuration: input.internshipDuration,
			internshipCompany: input.internshipCompany,
			updatedAt: new Date()
		}).where(eq(internshipData.studentId, id));

		return { success: true };
	}, {
		body: t.Record(t.String(), t.Any())
	})
	.post("/:id/internship/acc", async (context) => {
		const { params, set } = context;
		const user = (context as any).user;
		const id = Number(params.id);
		
		if (!user || (user.role !== "magang" && user.role !== "superadmin")) {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		await db.update(internshipData).set({
			isAcc: true,
			accAt: new Date(),
			accBy: user.id,
		}).where(eq(internshipData.studentId, id));

		return { success: true };
	});
`;

if (!content.includes('// --- INTERNSHIP ROUTES ---')) {
    content = content.replace(/}\);\s*$/, internshipRoutes);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended Internship routes');
} else {
    console.log('Internship routes already exist');
}
