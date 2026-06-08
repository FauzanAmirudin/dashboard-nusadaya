import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { authSetup } from "./middleware/auth";
import { requireRole } from "./middleware/rbac";

const app = new Elysia()
	.use(
		swagger({
			path: "/docs",
			documentation: {
				info: {
					title: "Nusadaya Dashboard API",
					version: "1.0.0",
				},
			},
		}),
	)
	.use(cors())
	.use(authSetup)
	.get("/", () => "Nusadaya API is running")

	// Auth Module
	.group("/auth", (app) =>
		app
			.use(authSetup)
			.post(
				"/login",
				async ({ body, jwt, cookie: { auth } }) => {
					const { username } = body;

					// Mock login - in reality compare with db
					const user = await db.query.users.findFirst({
						where: eq(users.username, username),
					});

					// For setup purposes, we just simulate login if user doesn't exist but has valid mock role
					// In real app, we check passwordHash!

					// Simulate token generation
					const jwtPayload = user
						? { id: user.id, username: user.username, role: user.role }
						: { id: 1, username, role: username };

					const token = await jwt.sign(jwtPayload);

					auth.set({
						value: token,
						httpOnly: true,
						maxAge: 7 * 86400, // 7 days
						path: "/",
					});

					return { success: true, user: jwtPayload };
				},
				{
					body: t.Object({
						username: t.String(),
						password: t.String(),
					}),
				},
			)
			.post("/logout", ({ cookie: { auth } }) => {
				auth.remove();
				return { success: true };
			})
			// biome-ignore lint/suspicious/noExplicitAny: Elysia type inference workaround
			.get("/me", (context: any) => {
				const { user, set } = context;
				if (!user) {
					set.status = 401;
					return { error: "Unauthorized" };
				}
				return { user };
			}),
	)

	// Example of Protected Route
	.group("/students", (app) =>
		app.use(requireRole(["superadmin", "akademik"])).get("/", async () => {
			// Fetch students
			return { students: [] };
		}),
	);

app.listen(process.env.PORT || 3001, () => {
	console.log(
		`🦊 Nusadaya API is running at http://localhost:${process.env.PORT || 3001}`,
	);
});

export type App = typeof app;
