import { desc, eq } from "drizzle-orm";
import Elysia, { t } from "elysia";
import { db } from "../db";
import {
	vocationalBudgetRequests,
	vocationalLeftovers,
	vocationalMonthlyBudgets,
} from "../db/schema";

export const vocationalRouter = new Elysia({ prefix: "/vocational" })
	// --- Budget Requests (Mingguan) ---
	.get("/budget-requests", async (context) => {
		const { set } = context;
		const user = (context as any).user;
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		try {
			const requests = await db.query.vocationalBudgetRequests.findMany({
				orderBy: [desc(vocationalBudgetRequests.createdAt)],
			});
			return { success: true, data: requests };
		} catch (error) {
			console.error(error);
			set.status = 500;
			return { success: false, message: "Failed to fetch budget requests" };
		}
	})
	.post(
		"/budget-requests",
		async (context) => {
			const { body, set } = context;
			const user = (context as any).user;
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}
			try {
				const {
					className,
					subject,
					weekNumber,
					requestDate,
					materials,
					totalEstimate,
					notes,
				} = body;
				const newRequest = await db
					.insert(vocationalBudgetRequests)
					.values({
						className,
						subject,
						weekNumber,
						requestDate: new Date(requestDate).toISOString().split("T")[0],
						materials,
						totalEstimate: totalEstimate.toString(),
						notes,
						submittedBy: user.id,
					})
					.returning();
				return { success: true, data: newRequest[0] };
			} catch (error) {
				console.error(error);
				set.status = 500;
				return { success: false, message: "Failed to submit budget request" };
			}
		},
		{
			body: t.Object({
				className: t.String(),
				subject: t.String(),
				weekNumber: t.Number(),
				requestDate: t.String(),
				materials: t.Any(),
				totalEstimate: t.Number(),
				notes: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/budget-requests/:id",
		async (context) => {
			const {
				params: { id },
				body,
				set,
			} = context;
			const user = (context as any).user;
			if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			try {
				const updated = await db
					.update(vocationalBudgetRequests)
					.set({ status: body.status })
					.where(eq(vocationalBudgetRequests.id, Number(id)))
					.returning();
				return { success: true, data: updated[0] };
			} catch (error) {
				console.error(error);
				set.status = 500;
				return { success: false, message: "Failed to update budget request" };
			}
		},
		{
			body: t.Object({
				status: t.String(),
			}),
		},
	)
	// --- Monthly Budgets (Estimasi Bulanan) ---
	.get("/monthly-budgets", async (context) => {
		const { set } = context;
		const user = (context as any).user;
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		try {
			const budgets = await db.query.vocationalMonthlyBudgets.findMany({
				orderBy: [
					desc(vocationalMonthlyBudgets.year),
					desc(vocationalMonthlyBudgets.month),
				],
			});
			return { success: true, data: budgets };
		} catch (error) {
			console.error(error);
			set.status = 500;
			return { success: false, message: "Failed to fetch monthly budgets" };
		}
	})
	.post(
		"/monthly-budgets",
		async (context) => {
			const { body, set } = context;
			const user = (context as any).user;
			if (!user || (user.role !== "finance" && user.role !== "superadmin")) {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			try {
				const { className, month, year, maxBudget, notes } = body;

				// Upsert logic based on className + month + year
				const existing = await db.query.vocationalMonthlyBudgets.findFirst({
					where: (b, { eq, and }) =>
						and(
							eq(b.className, className),
							eq(b.month, month),
							eq(b.year, year),
						),
				});

				if (existing) {
					const updated = await db
						.update(vocationalMonthlyBudgets)
						.set({ maxBudget: maxBudget.toString(), notes })
						.where(eq(vocationalMonthlyBudgets.id, existing.id))
						.returning();
					return { success: true, data: updated[0] };
				} else {
					const inserted = await db
						.insert(vocationalMonthlyBudgets)
						.values({
							className,
							month,
							year,
							maxBudget: maxBudget.toString(),
							notes,
							createdBy: user.id,
						})
						.returning();
					return { success: true, data: inserted[0] };
				}
			} catch (error) {
				console.error(error);
				set.status = 500;
				return { success: false, message: "Failed to save monthly budget" };
			}
		},
		{
			body: t.Object({
				className: t.String(),
				month: t.Number(),
				year: t.Number(),
				maxBudget: t.Number(),
				notes: t.Optional(t.String()),
			}),
		},
	)
	// --- Leftover Materials (Sisa Bahan) ---
	.get("/leftovers", async (context) => {
		const { set } = context;
		const user = (context as any).user;
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		try {
			const leftovers = await db.query.vocationalLeftovers.findMany({
				orderBy: [desc(vocationalLeftovers.createdAt)],
			});
			return { success: true, data: leftovers };
		} catch (error) {
			console.error(error);
			set.status = 500;
			return { success: false, message: "Failed to fetch leftovers" };
		}
	})
	.post(
		"/leftovers",
		async (context) => {
			const { body, set } = context;
			const user = (context as any).user;
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}
			try {
				const {
					className,
					subject,
					reportDate,
					materialName,
					qty,
					unit,
					condition,
					notes,
				} = body;
				const newLeftover = await db
					.insert(vocationalLeftovers)
					.values({
						className,
						subject,
						reportDate: new Date(reportDate).toISOString().split("T")[0],
						materialName,
						qty: qty.toString(),
						unit,
						condition,
						notes,
						reportedBy: user.id,
					})
					.returning();
				return { success: true, data: newLeftover[0] };
			} catch (error) {
				console.error(error);
				set.status = 500;
				return {
					success: false,
					message: "Failed to report leftover material",
				};
			}
		},
		{
			body: t.Object({
				className: t.String(),
				subject: t.String(),
				reportDate: t.String(),
				materialName: t.String(),
				qty: t.Number(),
				unit: t.String(),
				condition: t.String(),
				notes: t.Optional(t.String()),
			}),
		},
	);
