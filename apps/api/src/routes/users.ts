import { and, eq, inArray, not } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";

export const usersRoutes = new Elysia({ prefix: "/manage-users" })
	.derive((context) => {
		const user = (context as any).user;
		return { user };
	})
	.get("/", async ({ user, set }: any) => {
		if (!user) {
			set.status = 401;
			return { success: false, message: "Unauthorized" };
		}
		if (user.role !== "superadmin" && user.role !== "akademik") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		let whereClause;
		if (user.role === "akademik") {
			// Akademik can only see PA and Dosen
			whereClause = inArray(users.role, ["pa", "dosen"]);
		} else {
			// Superadmin can see everyone except mahasiswa
			whereClause = not(eq(users.role, "mahasiswa"));
		}

		const data = await db.query.users.findMany({
			where: whereClause,
			columns: {
				id: true,
				username: true,
				fullName: true,
				role: true,
				email: true,
				phone: true,
				profilePhotoUrl: true,
				createdAt: true,
			},
			orderBy: (users, { desc }) => [desc(users.createdAt)],
		});

		return { success: true, data };
	})
	.post(
		"/",
		async ({ body, set, user }: any) => {
			if (user.role !== "superadmin" && user.role !== "akademik") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const input = body as any;

			if (user.role === "akademik" && !["pa", "dosen"].includes(input.role)) {
				set.status = 403;
				return {
					success: false,
					message: "Akademik hanya dapat menambahkan role PA atau Dosen",
				};
			}

			const existingUser = await db.query.users.findFirst({
				where: eq(users.username, input.username),
			});
			if (existingUser) {
				set.status = 400;
				return { success: false, message: "Username sudah terdaftar" };
			}

			const passwordHash = await Bun.password.hash(input.password);

			const [newUser] = await db
				.insert(users)
				.values({
					username: input.username,
					passwordHash,
					fullName: input.fullName,
					role: input.role,
					email: input.email || null,
					phone: input.phone || null,
					profilePhotoUrl: input.profilePhotoUrl || null,
				})
				.returning({
					id: users.id,
					username: users.username,
					fullName: users.fullName,
					role: users.role,
				});

			return { success: true, data: newUser };
		},
		{
			body: t.Object({
				username: t.String(),
				password: t.String(),
				fullName: t.String(),
				role: t.String(),
				email: t.Optional(t.String()),
				phone: t.Optional(t.String()),
				profilePhotoUrl: t.Optional(t.String()),
			}),
		},
	)
	.patch(
		"/:id",
		async ({ params, body, set, user }: any) => {
			if (user.role !== "superadmin" && user.role !== "akademik") {
				set.status = 403;
				return { success: false, message: "Forbidden" };
			}

			const id = Number(params.id);
			const targetUser = await db.query.users.findFirst({
				where: eq(users.id, id),
			});

			if (!targetUser) {
				set.status = 404;
				return { success: false, message: "User not found" };
			}

			if (
				user.role === "akademik" &&
				!["pa", "dosen"].includes(targetUser.role)
			) {
				set.status = 403;
				return {
					success: false,
					message: "Akademik hanya dapat mengubah data role PA atau Dosen",
				};
			}

			const input = body as any;

			if (
				user.role === "akademik" &&
				input.role &&
				!["pa", "dosen"].includes(input.role)
			) {
				set.status = 403;
				return {
					success: false,
					message: "Akademik tidak dapat mengubah role di luar PA atau Dosen",
				};
			}

			if (input.username && input.username !== targetUser.username) {
				const existingUser = await db.query.users.findFirst({
					where: eq(users.username, input.username),
				});
				if (existingUser) {
					set.status = 400;
					return { success: false, message: "Username sudah terdaftar" };
				}
			}

			const updateData: any = {
				fullName:
					input.fullName !== undefined ? input.fullName : targetUser.fullName,
				username:
					input.username !== undefined ? input.username : targetUser.username,
				role: input.role !== undefined ? input.role : targetUser.role,
				email: input.email !== undefined ? input.email : targetUser.email,
				phone: input.phone !== undefined ? input.phone : targetUser.phone,
				profilePhotoUrl:
					input.profilePhotoUrl !== undefined
						? input.profilePhotoUrl
						: targetUser.profilePhotoUrl,
				updatedAt: new Date(),
			};

			if (input.password) {
				updateData.passwordHash = await Bun.password.hash(input.password);
			}

			const [updatedUser] = await db
				.update(users)
				.set(updateData)
				.where(eq(users.id, id))
				.returning({
					id: users.id,
					username: users.username,
					fullName: users.fullName,
					role: users.role,
				});

			return { success: true, data: updatedUser };
		},
		{
			body: t.Object({
				username: t.Optional(t.String()),
				password: t.Optional(t.String()),
				fullName: t.Optional(t.String()),
				role: t.Optional(t.String()),
				email: t.Optional(t.String()),
				phone: t.Optional(t.String()),
				profilePhotoUrl: t.Optional(t.String()),
			}),
		},
	)
	.delete("/:id", async ({ params, set, user }: any) => {
		if (user.role !== "superadmin" && user.role !== "akademik") {
			set.status = 403;
			return { success: false, message: "Forbidden" };
		}

		const id = Number(params.id);
		const targetUser = await db.query.users.findFirst({
			where: eq(users.id, id),
		});

		if (!targetUser) {
			set.status = 404;
			return { success: false, message: "User not found" };
		}

		if (
			user.role === "akademik" &&
			!["pa", "dosen"].includes(targetUser.role)
		) {
			set.status = 403;
			return {
				success: false,
				message: "Akademik hanya dapat menghapus role PA atau Dosen",
			};
		}

		await db.delete(users).where(eq(users.id, id));
		return { success: true };
	});
