import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { jwt as elysiaJwt } from "@elysiajs/jwt";

import { swagger } from "@elysiajs/swagger";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { dosenRouter } from "./routes/dosen";
import { magangRouter } from "./routes/magang";
import { paRouter } from "./routes/pa";
import { studentsRouter } from "./routes/students";

const JWT_SECRET =
	process.env.JWT_SECRET || "super_secret_jwt_key_nusadaya_2026";

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
	.get("/uploads/*", async ({ params, set }) => {
		const { join } = await import("node:path");
		const filePath = join(process.cwd(), "uploads", params["*"]);
		const file = Bun.file(filePath);
		if (await file.exists()) {
			return file;
		}
		set.status = 404;
		return "Not found";
	})
	.use(cors({ origin: true, credentials: true }))
	// JWT and cookie must be used before derive
	.use(elysiaJwt({ name: "jwt", secret: JWT_SECRET }))
	.use(cookie())
	// Auth derive: runs on EVERY request — reads Bearer token OR cookie
	// Must be defined inline at root level (not inside a plugin) so it propagates to all sub-routes
	.derive(async ({ jwt, cookie: { auth }, request }) => {
		// 1. Authorization: Bearer <token> header (used for cross-origin dev requests)
		const authHeader = request.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.slice(7);
			const profile = await jwt.verify(token);
			if (profile) {
				return {
					user: profile as { id: number; username: string; role: string },
				};
			}
		}
		// 2. Fallback: httpOnly cookie (same-origin)
		if (auth.value) {
			const profile = await jwt.verify(auth.value as string);
			if (profile) {
				return {
					user: profile as { id: number; username: string; role: string },
				};
			}
		}
		return { user: null };
	})
	.get("/", () => "Nusadaya API is running")

	// Auth routes
	.group("/auth", (app) =>
		app
			.post(
				"/login",
				async ({ body, jwt, cookie: { auth }, set }) => {
					const { username, password } = body;

					const user = await db.query.users.findFirst({
						where: eq(users.username, username),
					});

					if (!user) {
						set.status = 401;
						return { success: false, message: "Username atau password salah." };
					}

					const isPasswordValid = await Bun.password.verify(
						password,
						user.passwordHash,
					);
					if (!isPasswordValid) {
						set.status = 401;
						return { success: false, message: "Username atau password salah." };
					}

					const jwtPayload = {
						id: user.id,
						username: user.username,
						role: user.role,
					};
					const token = await jwt.sign(jwtPayload);

					auth.set({
						value: token,
						httpOnly: true,
						maxAge: 7 * 86400,
						path: "/",
						sameSite: "none",
						secure: true,
					});

					// Return token for cross-origin Bearer auth (frontend stores in Zustand)
					return { success: true, user: jwtPayload, token };
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
	.get("/users", async ({ query }: any) => {
		const { role } = query;
		let q = db
			.select({ id: users.id, fullName: users.fullName, role: users.role })
			.from(users);
		if (role) {
			q = q.where(eq(users.role, role as any)) as any;
		}
		const result = await q;
		return { success: true, data: result };
	})

	// studentsRouter inherits the derive context from root
	.use(studentsRouter)
	.use(dosenRouter)
	.use(paRouter)
	.use(magangRouter);

app.listen(process.env.PORT || 3001, () => {
	console.log(
		`🦊 Nusadaya API is running at http://localhost:${process.env.PORT || 3001}`,
	);
});

export type App = typeof app;
