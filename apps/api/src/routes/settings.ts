import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import {
	masterBusinessParameters,
	masterEventTypes,
	masterServiceTags,
	programFeeDefaults,
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
	})

	// Master Program Fee Defaults (Task J-4)
	.get("/program-fee-defaults", async () => {
		const data = await db.query.programFeeDefaults.findMany();
		return { success: true, data };
	})
	.patch(
		"/program-fee-defaults/:subProgram",
		async ({ params, body, set, user }: any) => {
			if (user?.role !== "superadmin") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}
			const subProgram = decodeURIComponent(params.subProgram);
			const updateData: any = { updatedAt: new Date() };
			if (body.defaultTotalBiaya !== undefined)
				updateData.defaultTotalBiaya = Number(body.defaultTotalBiaya);
			if (body.defaultRegistrasi !== undefined)
				updateData.defaultRegistrasi = Number(body.defaultRegistrasi);
			if (body.defaultPerSemester !== undefined)
				updateData.defaultPerSemester = Number(body.defaultPerSemester);
			if (body.defaultInterview !== undefined)
				updateData.defaultInterview = Number(body.defaultInterview);
			if (body.defaultKeberangkatan !== undefined)
				updateData.defaultKeberangkatan = Number(body.defaultKeberangkatan);

			await db
				.update(programFeeDefaults)
				.set(updateData)
				.where(eq(programFeeDefaults.subProgram, subProgram));

			return {
				success: true,
				message: "Pagu default biaya berhasil diperbarui",
			};
		},
		{
			body: t.Object({
				defaultTotalBiaya: t.Optional(t.Number()),
				defaultRegistrasi: t.Optional(t.Number()),
				defaultPerSemester: t.Optional(t.Number()),
				defaultInterview: t.Optional(t.Number()),
				defaultKeberangkatan: t.Optional(t.Number()),
			}),
		},
	);
