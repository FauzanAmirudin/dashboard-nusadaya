import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { jwt as elysiaJwt } from "@elysiajs/jwt";

import { swagger } from "@elysiajs/swagger";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, ensureDatabaseSchema } from "./db";
import { users } from "./db/schema";
import { backupModule } from "./modules/backup";
import { exportModule } from "./modules/export";
// Modul Storage Baru
import { fileModule } from "./modules/file";
import { fileService } from "./modules/file/service/file.service";
import { academicCalendarRoutes } from "./routes/academic-calendar";
import { akademikPaRouter } from "./routes/akademik-pa";
import { attendanceRoutes } from "./routes/attendance";
import { coursesRoutes } from "./routes/courses";
import { dosenRouter } from "./routes/dosen";
import { financeRouter } from "./routes/finance";
import { formRegisterRoutes } from "./routes/form-register";
import { healthRoutes } from "./routes/health";
import { magangRouter } from "./routes/magang";
import { mahasiswaRouter } from "./routes/mahasiswa";
import { paRouter } from "./routes/pa";
import { schedulingRoutes } from "./routes/scheduling";
import { settingsRoutes } from "./routes/settings";
import { studentsRouter } from "./routes/student";
import { usersRoutes } from "./routes/users";
import { vocationalRouter } from "./routes/vocational";
// Workers
import { startBackupWorker } from "./workers/backup.worker";
import { startExportWorker } from "./workers/export.worker";
import { startFileWorker } from "./workers/file.worker";
import { startPdfWorker } from "./workers/pdf.worker";
import { startScheduledWorker } from "./workers/scheduled.worker";

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
	// CATATAN: Endpoint /uploads/* lama dihapus.
	// File sekarang diakses via GET /files/:id/download (streaming, auth-protected)
	.use(cors({ origin: true, credentials: true }))
	// JWT and cookie must be used before derive
	.use(elysiaJwt({ name: "jwt", secret: JWT_SECRET }))
	.use(cookie())
	// Auth derive: runs on EVERY request — reads Bearer token OR cookie OR query
	// Must be defined inline at root level (not inside a plugin) so it propagates to all sub-routes
	.derive(async ({ jwt, cookie: { auth }, request, query }) => {
		// 1. Authorization: Bearer <token> header (used for cross-origin dev requests)
		const authHeader = request.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.slice(7);
			const profile = await jwt.verify(token);
			if (profile) {
				return {
					user: profile as {
						id: number;
						username: string;
						role: string;
						roles?: string[];
					},
				};
			}
		}
		// 2. Fallback: httpOnly cookie (same-origin)
		if (auth.value) {
			const profile = await jwt.verify(auth.value as string);
			if (profile) {
				return {
					user: profile as {
						id: number;
						username: string;
						role: string;
						roles?: string[];
					},
				};
			}
		}
		// 3. Fallback: Query string (used for cross-origin iframe / file downloads)
		if (query?.token) {
			const profile = await jwt.verify(query.token as string);
			if (profile) {
				return {
					user: profile as {
						id: number;
						username: string;
						role: string;
						roles?: string[];
					},
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

					const userRoles =
						user.roles && Array.isArray(user.roles) && user.roles.length > 0
							? user.roles
							: [user.role];

					const jwtPayload = {
						id: user.id,
						username: user.username,
						role: user.role,
						roles: userRoles,
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

			.get("/me", async (context: any) => {
				const { user, set } = context;
				if (!user) {
					set.status = 401;
					return { error: "Unauthorized" };
				}
				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, user.id),
					columns: {
						id: true,
						username: true,
						fullName: true,
						role: true,
						roles: true,
						email: true,
						phone: true,
						profilePhotoUrl: true,
					},
				});
				if (dbUser) {
					const userRoles =
						dbUser.roles &&
						Array.isArray(dbUser.roles) &&
						dbUser.roles.length > 0
							? dbUser.roles
							: [dbUser.role];
					return { user: { ...dbUser, roles: userRoles } };
				}
				return { user };
			})

			.get("/profile", async (context: any) => {
				const { user, set } = context;
				if (!user) {
					set.status = 401;
					return { success: false, message: "Unauthorized" };
				}
				const dbUser = await db.query.users.findFirst({
					where: eq(users.id, user.id),
					columns: {
						id: true,
						username: true,
						fullName: true,
						role: true,
						roles: true,
						email: true,
						phone: true,
						profilePhotoUrl: true,
						createdAt: true,
						updatedAt: true,
					},
				});
				if (!dbUser) {
					set.status = 404;
					return { success: false, message: "User not found" };
				}
				const userRoles =
					dbUser.roles && Array.isArray(dbUser.roles) && dbUser.roles.length > 0
						? dbUser.roles
						: [dbUser.role];
				return { success: true, data: { ...dbUser, roles: userRoles } };
			})

			.put(
				"/profile",
				async (context: any) => {
					const { user, body, set } = context;
					if (!user) {
						set.status = 401;
						return { success: false, message: "Unauthorized" };
					}

					const currentUser = await db.query.users.findFirst({
						where: eq(users.id, user.id),
					});
					if (!currentUser) {
						set.status = 404;
						return { success: false, message: "User not found" };
					}

					const input = body as {
						fullName?: string;
						username?: string;
						email?: string;
						phone?: string;
						profilePhotoUrl?: string;
					};

					// Check username uniqueness if changing
					if (input.username && input.username !== currentUser.username) {
						const existing = await db.query.users.findFirst({
							where: eq(users.username, input.username),
						});
						if (existing) {
							set.status = 400;
							return {
								success: false,
								message: "Username sudah digunakan oleh akun lain.",
							};
						}
					}

					const updatePayload: Record<string, any> = {
						updatedAt: new Date(),
					};
					if (input.fullName !== undefined)
						updatePayload.fullName = input.fullName.trim();
					if (input.username !== undefined)
						updatePayload.username = input.username.trim();
					if (input.email !== undefined)
						updatePayload.email = input.email ? input.email.trim() : null;
					if (input.phone !== undefined)
						updatePayload.phone = input.phone ? input.phone.trim() : null;
					if (input.profilePhotoUrl !== undefined)
						updatePayload.profilePhotoUrl = input.profilePhotoUrl || null;

					const [updated] = await db
						.update(users)
						.set(updatePayload)
						.where(eq(users.id, user.id))
						.returning({
							id: users.id,
							username: users.username,
							fullName: users.fullName,
							role: users.role,
							roles: users.roles,
							email: users.email,
							phone: users.phone,
							profilePhotoUrl: users.profilePhotoUrl,
							updatedAt: users.updatedAt,
						});

					const userRoles =
						updated.roles &&
						Array.isArray(updated.roles) &&
						updated.roles.length > 0
							? updated.roles
							: [updated.role];

					return {
						success: true,
						message: "Profil berhasil diperbarui.",
						data: { ...updated, roles: userRoles },
					};
				},
				{
					body: t.Object({
						fullName: t.Optional(t.String()),
						username: t.Optional(t.String()),
						email: t.Optional(t.String()),
						phone: t.Optional(t.String()),
						profilePhotoUrl: t.Optional(t.String()),
					}),
				},
			)

			.post(
				"/change-password",
				async (context: any) => {
					const { user, body, set } = context;
					if (!user) {
						set.status = 401;
						return { success: false, message: "Unauthorized" };
					}

					const { currentPassword, newPassword, confirmNewPassword } = body;

					if (!currentPassword || !newPassword) {
						set.status = 400;
						return {
							success: false,
							message: "Password saat ini dan password baru wajib diisi.",
						};
					}

					if (newPassword !== confirmNewPassword) {
						set.status = 400;
						return {
							success: false,
							message: "Konfirmasi password baru tidak cocok.",
						};
					}

					if (newPassword.length < 6) {
						set.status = 400;
						return {
							success: false,
							message: "Password baru minimal 6 karakter.",
						};
					}

					const currentUser = await db.query.users.findFirst({
						where: eq(users.id, user.id),
					});
					if (!currentUser) {
						set.status = 404;
						return { success: false, message: "User tidak ditemukan." };
					}

					const isPasswordValid = await Bun.password.verify(
						currentPassword,
						currentUser.passwordHash,
					);
					if (!isPasswordValid) {
						set.status = 400;
						return {
							success: false,
							message: "Password saat ini tidak sesuai.",
						};
					}

					const newPasswordHash = await Bun.password.hash(newPassword);

					await db
						.update(users)
						.set({
							passwordHash: newPasswordHash,
							updatedAt: new Date(),
						})
						.where(eq(users.id, user.id));

					return {
						success: true,
						message: "Password berhasil diperbarui.",
					};
				},
				{
					body: t.Object({
						currentPassword: t.String(),
						newPassword: t.String(),
						confirmNewPassword: t.String(),
					}),
				},
			),
	)
	.get("/users", async ({ query }: any) => {
		const { role } = query;
		const result = await db.query.users.findMany({
			columns: { id: true, fullName: true, role: true, roles: true },
		});
		if (role) {
			const filtered = result.filter((u) => {
				if (u.role === role) return true;
				if (u.roles && Array.isArray(u.roles) && u.roles.includes(role))
					return true;
				return false;
			});
			return { success: true, data: filtered };
		}
		return { success: true, data: result };
	})

	// Module Routers (existing)
	.use(studentsRouter)
	.use(formRegisterRoutes)
	.use(dosenRouter)
	.use(paRouter)
	.use(akademikPaRouter)
	.use(magangRouter)
	.use(financeRouter)
	.use(settingsRoutes)
	.use(vocationalRouter)
	.use(mahasiswaRouter)
	.use(academicCalendarRoutes)
	.use(schedulingRoutes)
	.use(attendanceRoutes)
	.use(usersRoutes)
	.use(coursesRoutes)

	// Module Routers (storage system baru)
	.use(fileModule)
	.use(backupModule)
	.use(exportModule)

	// Health check
	.use(healthRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────────────────────────────────────────

app.get("/debug", async () => {
	try {
		const { sql } = require("drizzle-orm");
		const dbRes = await db.execute(sql`SELECT 1 as num`);
		return {
			redis: process.env.REDIS_URL,
			db: process.env.DATABASE_URL,
			port: process.env.PORT,
			db_query: "success",
		};
	} catch (err: any) {
		return { db_error: err.message };
	}
});

app.listen(process.env.PORT || 3001, async () => {
	console.log(
		`🦊 Nusadaya API is running at http://localhost:${process.env.PORT || 3001}`,
	);

	// 1. Inisialisasi skema database (auto migration column baru)
	await ensureDatabaseSchema();

	// 2. Inisialisasi direktori storage
	await fileService.ensureDirectories();

	// 2. Jalankan workers di background (non-blocking)
	// Konfigurasi concurrency: Backup=1, Export=1, File=1, PDF=2
	// Sesuai rekomendasi plan: mulai konservatif, monitor disk I/O
	setTimeout(() => {
		// Backup Worker (1 instance — concurrency 1)
		startBackupWorker().catch((err) =>
			console.error("[BackupWorker] Fatal error:", err),
		);

		// Export Worker (1 instance)
		startExportWorker().catch((err) =>
			console.error("[ExportWorker] Fatal error:", err),
		);

		// File Worker (cleanup — tidak perlu banyak)
		startFileWorker();

		// PDF Workers (2 instance)
		startPdfWorker(1).catch((err) =>
			console.error("[PdfWorker#1] Fatal error:", err),
		);
		startPdfWorker(2).catch((err) =>
			console.error("[PdfWorker#2] Fatal error:", err),
		);

		// Scheduled Worker (cron jobs)
		startScheduledWorker();
	}, 1000); // Delay 1 detik agar server sudah siap dulu
});

export type App = typeof app;
