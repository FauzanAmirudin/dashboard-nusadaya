import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { jwt as elysiaJwt } from "@elysiajs/jwt";

import { swagger } from "@elysiajs/swagger";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, ensureDatabaseSchema } from "./db";
import { auditLogs, users } from "./db/schema";
import {
	checkLoginIpRateLimit,
	checkLoginLockout,
	recordFailedLogin,
	resetLoginAttempts,
} from "./lib/auth-rate-limit";
import { checkRateLimit } from "./lib/rate-limiter";
import {
	createSession,
	invalidateSession,
	validateAndTouchSession,
} from "./lib/session";
import { backupModule } from "./modules/backup";
import { exportModule } from "./modules/export";
// Modul Storage Baru
import { fileModule } from "./modules/file";
import { fileService } from "./modules/file/service/file.service";
import { academicCalendarRoutes } from "./routes/academic-calendar";
import { akademikPaRouter } from "./routes/akademik-pa";
import { attendanceRoutes } from "./routes/attendance";
import { coursesRoutes } from "./routes/courses";
import { dashboardRoutes } from "./routes/dashboard";
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
	// Standard Security Headers
	.onRequest(({ set, request }) => {
		set.headers["X-Content-Type-Options"] = "nosniff";
		set.headers["X-XSS-Protection"] = "1; mode=block";
		set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

		// Untuk pratinjau dokumen / PDF di iframe dari frontend (localhost:3000, dll.)
		// X-Frame-Options: SAMEORIGIN memblokir iframe lintas-port (3000 vs 3001)
		// Kita gunakan CSP frame-ancestors untuk mengizinkan embedding dari frontend
		const isFileOrViewer =
			request.url.includes("/files/") ||
			request.url.includes("/documents") ||
			request.url.includes("/invoice") ||
			request.url.includes("/file-view") ||
			request.url.includes("/download") ||
			request.url.includes("/preview");

		if (isFileOrViewer) {
			const allowedOrigins = process.env.ALLOWED_ORIGINS
				? process.env.ALLOWED_ORIGINS.split(",")
						.map((s) => s.trim())
						.join(" ")
				: "http://localhost:3000 http://127.0.0.1:3000 http://localhost:3001 http://127.0.0.1:3001";
			set.headers["Content-Security-Policy"] =
				`frame-ancestors 'self' ${allowedOrigins}`;
		} else {
			set.headers["X-Frame-Options"] = "SAMEORIGIN";
		}
	})
	// CORS Configuration
	.use(
		cors({
			origin: process.env.ALLOWED_ORIGINS
				? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
				: true,
			credentials: true,
		}),
	)
	// JWT and cookie must be used before derive
	.use(elysiaJwt({ name: "jwt", secret: JWT_SECRET }))
	.use(cookie())
	// Auth derive: runs on EVERY request — reads Bearer token OR cookie OR query
	// Must be defined inline at root level (not inside a plugin) so it propagates to all sub-routes
	.derive(async ({ jwt, cookie: { auth }, request, query }) => {
		let token: string | null = null;
		// 1. Authorization: Bearer <token> header (used for cross-origin dev requests)
		const authHeader = request.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			token = authHeader.slice(7);
		} else if (auth?.value) {
			// 2. Fallback: httpOnly cookie (same-origin)
			token = auth.value as string;
		} else if (query?.token) {
			// 3. Fallback: Query string (used for cross-origin iframe / file downloads)
			token = query.token as string;
		}

		if (!token) {
			return {
				user: null,
				sessionStatus: "unauthenticated" as const,
				sessionId: null,
			};
		}

		const profile = await jwt.verify(token);
		if (!profile) {
			return {
				user: null,
				sessionStatus: "invalid_token" as const,
				sessionId: null,
			};
		}

		const payload = profile as {
			id: number;
			username: string;
			role: string;
			roles?: string[];
			sessionId?: string;
		};

		// 4. Validate session in Redis if sessionId exists
		if (payload.sessionId) {
			const sessionValidation = await validateAndTouchSession(
				payload.sessionId,
			);
			if (!sessionValidation.valid) {
				return {
					user: null,
					sessionStatus: sessionValidation.reason || "invalid_session",
					sessionId: payload.sessionId,
				};
			}
		}

		return {
			user: payload,
			sessionStatus: "valid" as const,
			sessionId: payload.sessionId || null,
		};
	})
	.onError(({ code, error, set }) => {
		console.error(`[API Error] ${code}:`, error);
		if ((code as string) === "NOT_FOUND") {
			set.status = 404;
			return { success: false, message: "Resource tidak ditemukan" };
		}
		if ((code as string) === "VALIDATION") {
			set.status = 400;
			return {
				success: false,
				message: (error as any)?.message || "Data input tidak valid",
			};
		}
		if ((code as string) === "PARSE") {
			set.status = 400;
			return { success: false, message: "Gagal memproses body request" };
		}
		set.status = (error as any)?.status || 500;
		return {
			success: false,
			message:
				(error as any)?.message || "Terjadi kesalahan internal pada server",
		};
	})
	.get("/", () => "Nusadaya API is running")

	// Auth routes
	.group("/auth", (app) =>
		app
			.post(
				"/login",
				async ({ body, jwt, cookie: { auth }, request, set }) => {
					const ip =
						request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
						request.headers.get("x-real-ip") ||
						"127.0.0.1";

					// 1. IP Rate Limiting (15 req/min)
					const ipLimit = await checkLoginIpRateLimit(ip);
					if (!ipLimit.allowed) {
						set.status = 429;
						return {
							success: false,
							code: "RATE_LIMIT_EXCEEDED",
							message: `Terlalu banyak permintaan login dari IP ini. Coba lagi dalam ${ipLimit.resetInSeconds} detik.`,
							resetInSeconds: ipLimit.resetInSeconds,
						};
					}

					const { username, password } = body;
					const normalizedUsername = (username || "").trim();

					// 2. Brute-Force Lockout Check (BEFORE querying DB / verifying password)
					const lockout = await checkLoginLockout(ip, normalizedUsername);
					if (lockout.isLocked) {
						set.status = 429;
						const minutes = Math.ceil(lockout.resetInSeconds / 60);
						return {
							success: false,
							code: "ACCOUNT_LOCKED",
							message: `Terlalu banyak percobaan login gagal. Akun dikunci sementara. Silakan coba lagi dalam ${minutes} menit (${lockout.resetInSeconds} detik).`,
							resetInSeconds: lockout.resetInSeconds,
						};
					}

					// 3. User verification in DB
					const user = await db.query.users.findFirst({
						where: eq(users.username, normalizedUsername),
					});

					const isValidUser = !!user;
					let isPasswordValid = false;
					if (isValidUser) {
						isPasswordValid = await Bun.password.verify(
							password,
							user.passwordHash,
						);
					}

					// 4. Handle Invalid Credentials
					if (!isValidUser || !isPasswordValid) {
						const failure = await recordFailedLogin(ip, normalizedUsername);

						// Record failed attempt or lockout in auditLogs
						try {
							await db.insert(auditLogs).values({
								userId: user ? user.id : null,
								action: failure.isLocked
									? "auth.lockout_triggered"
									: "auth.login_failed",
								entity: "auth",
								entityId: user ? user.id : null,
								details: {
									ip,
									username: normalizedUsername,
									remainingAttempts: failure.remainingAttempts,
									currentFailures: failure.currentCount,
									locked: failure.isLocked,
									lockoutSeconds: failure.isLocked ? failure.resetInSeconds : 0,
									timestamp: new Date().toISOString(),
								},
							});
						} catch (auditErr) {
							console.error("[Login] Failed to write audit log:", auditErr);
						}

						if (failure.isLocked) {
							set.status = 429;
							const minutes = Math.ceil(failure.resetInSeconds / 60);
							return {
								success: false,
								code: "ACCOUNT_LOCKED",
								message: `Batas 7 kali percobaan login gagal tercapai. Akun dikunci selama ${minutes} menit.`,
								resetInSeconds: failure.resetInSeconds,
							};
						}

						set.status = 401;
						return {
							success: false,
							code: "INVALID_CREDENTIALS",
							message: "Username atau password salah.",
							remainingAttempts: failure.remainingAttempts,
						};
					}

					// 5. Successful login: Reset failed counter in Redis
					await resetLoginAttempts(ip, normalizedUsername);

					const userRoles =
						user.roles && Array.isArray(user.roles) && user.roles.length > 0
							? user.roles
							: [user.role];

					// 6. Create Server-side Session in Redis
					const userAgent = request.headers.get("user-agent") || undefined;
					const sessionId = await createSession(
						{
							id: user.id,
							username: user.username,
							role: user.role,
							roles: userRoles,
						},
						{ ip, userAgent },
					);

					// 7. Sign JWT with sessionId
					const jwtPayload = {
						id: user.id,
						username: user.username,
						role: user.role,
						roles: userRoles,
						sessionId,
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

					// Record successful login in audit log
					try {
						await db.insert(auditLogs).values({
							userId: user.id,
							action: "auth.login_success",
							entity: "auth",
							entityId: user.id,
							details: {
								ip,
								username: user.username,
								sessionId,
								timestamp: new Date().toISOString(),
							},
						});
					} catch (auditErr) {
						console.error(
							"[Login] Failed to write success audit log:",
							auditErr,
						);
					}

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
			.post("/logout", async (context: any) => {
				const {
					cookie: { auth },
					user,
					sessionId,
				} = context;
				const activeSessionId = sessionId || user?.sessionId;
				if (activeSessionId) {
					await invalidateSession(activeSessionId, user?.id, "user_logout");
				}
				auth.remove();
				return { success: true, message: "Berhasil logout." };
			})

			.post("/touch", async (context: any) => {
				const { user, sessionId, set } = context;
				if (!user) {
					set.status = 401;
					if (context.sessionStatus === "idle_timeout") {
						return {
							success: false,
							code: "IDLE_TIMEOUT",
							message: "Sesi Anda telah berakhir karena tidak ada aktivitas.",
						};
					}
					return {
						success: false,
						code: "UNAUTHORIZED",
						message: "Unauthorized",
					};
				}

				const activeSessionId = sessionId || user.sessionId;
				if (activeSessionId) {
					const check = await validateAndTouchSession(activeSessionId);
					if (!check.valid) {
						set.status = 401;
						return {
							success: false,
							code:
								check.reason === "idle_timeout"
									? "IDLE_TIMEOUT"
									: "INVALID_SESSION",
							message:
								check.reason === "idle_timeout"
									? "Sesi Anda telah berakhir karena tidak ada aktivitas."
									: "Sesi tidak valid.",
						};
					}
					return {
						success: true,
						remainingSeconds: check.remainingSeconds,
						message: "Sesi berhasil diperbarui.",
					};
				}

				return { success: true, message: "Sesi aktif." };
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
	.use(dashboardRoutes)
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

	// 3. Jalankan background workers non-blocking
	setTimeout(() => {
		// File Worker (cleanup lokal setiap 1 jam)
		startFileWorker();

		// Backup Worker (proses backup queue & DB fallback)
		startBackupWorker();

		// Export Worker (proses export ZIP)
		startExportWorker();

		// PDF Worker (proses generate dokumen)
		startPdfWorker();

		// Scheduled Worker (cron jobs: daily midnight backup, retention)
		startScheduledWorker();
	}, 1500);
});

export { app };
export type App = typeof app;
