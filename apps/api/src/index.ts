import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";
import { jwt as elysiaJwt } from "@elysiajs/jwt";

import { swagger } from "@elysiajs/swagger";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { validateOtpConfigOnStartup } from "./config/otp.config";
import { db, ensureDatabaseSchema } from "./db";
import { auditLogs, users } from "./db/schema";
import { authRoutes } from "./modules/auth";

// Validasi fail-closed environment variables saat startup produksi (T3.2, T4.1)
validateOtpConfigOnStartup();

import { checkRateLimit } from "./lib/rate-limiter";
import {
	createSession,
	invalidateSession,
	validateAndTouchSession,
} from "./lib/session";

// Auth Middleware & Security
import { JWT_SECRET } from "./middleware/auth";
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
		if (
			authHeader?.startsWith("Bearer ") &&
			authHeader.slice(7) !== "null" &&
			authHeader.slice(7) !== "undefined" &&
			authHeader.slice(7).trim() !== ""
		) {
			token = authHeader.slice(7).trim();
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

	// Auth routes (Modular)
	.use(authRoutes)

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
