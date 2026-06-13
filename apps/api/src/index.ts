import { cookie } from "@elysiajs/cookie";
import { jwt as elysiaJwt } from "@elysiajs/jwt";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { studentsRouter } from "./routes/students";
import { dosenRouter } from "./routes/dosen";
import { paRouter } from "./routes/pa";
import { magangRouter } from "./routes/magang";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_nusadaya_2026";

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
				return { user: profile as { id: number; username: string; role: string } };
			}
		}
		// 2. Fallback: httpOnly cookie (same-origin)
		if (auth.value) {
			const profile = await jwt.verify(auth.value as string);
			if (profile) {
				return { user: profile as { id: number; username: string; role: string } };
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

					// @ts-ignore - Bun is globally available in the runtime
					const isPasswordValid = await Bun.password.verify(password, user.passwordHash);
					if (!isPasswordValid) {
						set.status = 401;
						return { success: false, message: "Username atau password salah." };
					}

					const jwtPayload = { id: user.id, username: user.username, role: user.role };
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
