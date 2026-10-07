import { cookie } from "@elysiajs/cookie";
import { jwt as elysiaJwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { OTP_CONFIG } from "../../../config/otp.config";
import { db } from "../../../db";
import { auditLogs, users } from "../../../db/schema";
import { getClientIp } from "../../../lib/client-ip";
import { sendEmailChangeAlert } from "../../../lib/email";
import { normalizeEmail } from "../../../lib/normalize";
import {
	invalidateAllUserSessions,
	invalidateSession,
	validateAndTouchSession,
} from "../../../lib/session";
import { JWT_SECRET } from "../../../middleware/auth";
import {
	processLogin,
	processResendOtp,
	processVerifyOtp,
} from "../service/auth.service";

export const authRoutes = new Elysia({ prefix: "/auth" })
	.use(cookie())
	.use(elysiaJwt({ name: "jwt", secret: JWT_SECRET }))

	// 1. POST /login
	.post(
		"/login",
		async ({ body, jwt, cookie: { auth }, request, set }) => {
			return processLogin({
				body,
				request,
				jwt,
				cookieAuth: auth,
				set,
			});
		},
		{
			body: t.Object({
				email: t.Optional(t.String()),
				username: t.Optional(t.String()),
				password: t.String({ minLength: 1 }),
			}),
		},
	)

	// 2. POST /verify-otp
	.post(
		"/verify-otp",
		async ({ body, jwt, cookie: { auth }, request, set }) => {
			return processVerifyOtp({
				body,
				request,
				jwt,
				cookieAuth: auth,
				set,
			});
		},
		{
			body: t.Object({
				tempToken: t.String({ minLength: 10 }),
				otp: t.String({ minLength: 6, maxLength: 6 }),
			}),
		},
	)

	// 3. POST /resend-otp
	.post(
		"/resend-otp",
		async ({ body, request, set }) => {
			return processResendOtp({
				body,
				request,
				set,
			});
		},
		{
			body: t.Object({
				tempToken: t.String({ minLength: 10 }),
			}),
		},
	)

	// 4. POST /logout
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

	// 5. POST /touch (Perpanjang sesi aktif)
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

	// 6. GET /me (Current User Info)
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
				dbUser.roles && Array.isArray(dbUser.roles) && dbUser.roles.length > 0
					? dbUser.roles
					: [dbUser.role];
			return { user: { ...dbUser, roles: userRoles } };
		}
		return { user };
	})

	// 7. GET /profile
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

	// 8. PUT /profile (Dengan proteksi perubahan email)
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
				currentPassword?: string;
			};

			// Username uniqueness check
			if (input.username && input.username !== currentUser.username) {
				const existing = await db.query.users.findFirst({
					where: eq(users.username, input.username.trim().toLowerCase()),
				});
				if (existing) {
					set.status = 400;
					return {
						success: false,
						message: "Username sudah digunakan oleh akun lain.",
					};
				}
			}

			// Proteksi Perubahan Email (T7.2, T7.3, T7.5)
			let newEmail = currentUser.email;
			let emailChanged = false;
			if (input.email !== undefined) {
				newEmail = normalizeEmail(input.email);
				emailChanged = newEmail !== currentUser.email;

				if (emailChanged) {
					// 1. Staf dilarang mengosongkan email
					const isStaff = OTP_CONFIG.ENFORCED_ROLES.includes(currentUser.role);
					if (isStaff && !newEmail) {
						set.status = 400;
						return {
							success: false,
							message: `Akun staf dengan role ${currentUser.role.toUpperCase()} wajib memiliki alamat email untuk verifikasi login OTP.`,
						};
					}

					// 2. Wajib verifikasi password saat ini
					if (!input.currentPassword) {
						set.status = 400;
						return {
							success: false,
							message:
								"Kata sandi saat ini wajib diisi untuk mengubah alamat email akun.",
						};
					}

					const isPasswordValid = await Bun.password.verify(
						input.currentPassword,
						currentUser.passwordHash,
					);
					if (!isPasswordValid) {
						set.status = 400;
						return {
							success: false,
							message: "Kata sandi saat ini salah.",
						};
					}

					// 3. Email uniqueness check
					if (newEmail) {
						const existingUser = await db.query.users.findFirst({
							where: eq(users.email, newEmail),
						});
						if (existingUser && existingUser.id !== currentUser.id) {
							set.status = 400;
							return {
								success: false,
								message: "Alamat email ini sudah digunakan oleh akun lain.",
							};
						}
					}
				}
			}

			const updatePayload: Record<string, any> = {
				updatedAt: new Date(),
			};
			if (input.fullName !== undefined)
				updatePayload.fullName = input.fullName.trim();
			if (input.username !== undefined)
				updatePayload.username = input.username.trim().toLowerCase();
			if (input.email !== undefined) updatePayload.email = newEmail;
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

			// Jika email diubah, cabut sesi lain & kirim alert ke email lama (T7.3, T7.5)
			if (emailChanged) {
				await invalidateAllUserSessions(user.id, "email_changed");
				if (currentUser.email && newEmail) {
					sendEmailChangeAlert({
						to: currentUser.email,
						name: currentUser.fullName,
						newEmail,
						requestIp: getClientIp(context.request),
						userAgent: context.request.headers.get("user-agent") || undefined,
					}).catch((err) =>
						console.error("[Profile] Failed to send email change alert:", err),
					);
				}

				try {
					await db.insert(auditLogs).values({
						userId: user.id,
						action: "auth.email_changed",
						entity: "users",
						entityId: user.id,
						details: {
							oldEmail: currentUser.email,
							newEmail,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error("[Profile] Audit error:", auditErr);
				}
			}

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
				currentPassword: t.Optional(t.String()),
			}),
		},
	)

	// 9. POST /change-password
	.post(
		"/change-password",
		async (context: any) => {
			const { user, body, set } = context;
			if (!user) {
				set.status = 401;
				return { success: false, message: "Unauthorized" };
			}

			const { currentPassword, newPassword } = body;
			if (!currentPassword || !newPassword) {
				set.status = 400;
				return {
					success: false,
					message: "Password saat ini dan password baru wajib diisi.",
				};
			}

			if (newPassword.length < 8) {
				set.status = 400;
				return {
					success: false,
					message: "Password baru minimal 8 karakter.",
				};
			}

			const dbUser = await db.query.users.findFirst({
				where: eq(users.id, user.id),
			});
			if (!dbUser) {
				set.status = 404;
				return { success: false, message: "User not found" };
			}

			const isMatch = await Bun.password.verify(
				currentPassword,
				dbUser.passwordHash,
			);
			if (!isMatch) {
				set.status = 400;
				return { success: false, message: "Password saat ini salah." };
			}

			const newHash = await Bun.password.hash(newPassword);
			await db
				.update(users)
				.set({ passwordHash: newHash, updatedAt: new Date() })
				.where(eq(users.id, user.id));

			// Cabut semua sesi lain demi keamanan (T7.5)
			await invalidateAllUserSessions(user.id, "password_changed");

			try {
				await db.insert(auditLogs).values({
					userId: user.id,
					action: "auth.password_changed",
					entity: "auth",
					entityId: user.id,
					details: { timestamp: new Date().toISOString() },
				});
			} catch (auditErr) {
				console.error("[Auth] Audit error:", auditErr);
			}

			return {
				success: true,
				message: "Password berhasil diubah. Seluruh sesi lain telah dicabut.",
			};
		},
		{
			body: t.Object({
				currentPassword: t.String(),
				newPassword: t.String({ minLength: 6 }),
				confirmNewPassword: t.Optional(t.String()),
			}),
		},
	)

	// 10. GET /session-status
	.get("/session-status", async (context: any) => {
		const { user, sessionId, sessionStatus } = context;
		if (!user) {
			return {
				valid: false,
				status: sessionStatus || "unauthenticated",
				idleTimeoutSeconds: 1800,
			};
		}

		let sessionCheck: any = { valid: true };
		if (sessionId) {
			sessionCheck = await validateAndTouchSession(sessionId);
		}

		return {
			valid: sessionCheck.valid,
			status: sessionCheck.valid ? "active" : sessionCheck.reason || "invalid",
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
				roles: user.roles,
			},
			remainingSeconds: sessionCheck.remainingSeconds,
			idleTimeoutSeconds: 1800,
		};
	});
