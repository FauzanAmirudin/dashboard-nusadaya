import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	masterBusinessParameters,
	masterEventTypes,
	masterServiceTags,
} from "../db/schema";

export const settingsRoutes = new Elysia({ prefix: "/settings" })
	// Master Event Types
	.get("/master-events", async () => {
		const data = await db.query.masterEventTypes.findMany();
		return { success: true, data };
	})
	.post(
		"/master-events",
		async ({ body, set, user }: any) => {
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const input = body as any;
			await db.insert(masterEventTypes).values(input);
			return { success: true };
		},
		{
			body: t.Object({
				configKey: t.String(),
				eventName: t.String(),
			}),
		},
	)
	.delete("/master-events/:id", async ({ params, set, user }: any) => {
		if (user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(masterEventTypes)
			.where(eq(masterEventTypes.id, Number(params.id)));
		return { success: true };
	})

	// Master Business Parameters
	.get("/master-business", async () => {
		const data = await db.query.masterBusinessParameters.findMany();
		return { success: true, data };
	})
	.post(
		"/master-business",
		async ({ body, set, user }: any) => {
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const input = body as any;
			await db.insert(masterBusinessParameters).values(input);
			return { success: true };
		},
		{
			body: t.Object({
				businessUnitId: t.String(),
				parameterName: t.String(),
				formulaValue: t.String(),
				description: t.Optional(t.String()),
			}),
		},
	)
	.delete("/master-business/:id", async ({ params, set, user }: any) => {
		if (user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(masterBusinessParameters)
			.where(eq(masterBusinessParameters.id, Number(params.id)));
		return { success: true };
	})

	// Master Service Tags
	.get("/master-services", async () => {
		const data = await db.query.masterServiceTags.findMany();
		return { success: true, data };
	})
	.post(
		"/master-services",
		async ({ body, set, user }: any) => {
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const input = body as any;
			await db.insert(masterServiceTags).values(input);
			return { success: true };
		},
		{
			body: t.Object({
				serviceId: t.String(),
				categoryName: t.String(),
			}),
		},
	)
	.delete("/master-services/:id", async ({ params, set, user }: any) => {
		if (user?.role !== "superadmin") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}
		await db
			.delete(masterServiceTags)
			.where(eq(masterServiceTags.id, Number(params.id)));
		return { success: true };
	});
