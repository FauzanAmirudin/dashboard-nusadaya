import { describe, expect, it } from "bun:test";
import { hasRole } from "../../lib/permissions";
import {
	createAnonymousUser,
	createCrmUser,
	createMockUser,
	createPmbUser,
	createSuperadminUser,
} from "../helpers/mockUser";

describe("PMB Admin Auth Guard & Status Code Validation", () => {
	function checkPmbAdminAuth(context: any): {
		authorized: boolean;
		user?: any;
		response?: { success: boolean; code: string; message: string };
	} {
		const user = context.user;
		if (!user) {
			context.set.status = 401;
			if (context.sessionStatus === "idle_timeout") {
				return {
					authorized: false,
					response: {
						success: false,
						code: "IDLE_TIMEOUT",
						message:
							"Sesi Anda telah berakhir karena tidak ada aktivitas (idle timeout). Silakan login kembali.",
					},
				};
			}
			return {
				authorized: false,
				response: {
					success: false,
					code: "UNAUTHORIZED",
					message: "Autentikasi diperlukan. Silakan login terlebih dahulu.",
				},
			};
		}

		if (!hasRole(user, "pmb", "superadmin")) {
			context.set.status = 403;
			const userRoleStr =
				user.roles && Array.isArray(user.roles)
					? user.roles.join(", ")
					: user.role || "unknown";
			return {
				authorized: false,
				response: {
					success: false,
					code: "FORBIDDEN",
					message: `Akses ditolak: Akun '${user.username || "Pengguna"}' (role: ${userRoleStr}) tidak memiliki izin akses modul PMB. Harap gunakan akun staf PMB atau Superadmin.`,
				},
			};
		}

		return { authorized: true, user };
	}

	it("should return 401 UNAUTHORIZED when user is not logged in / token missing", () => {
		const context = {
			user: null,
			sessionStatus: "unauthenticated",
			set: { status: 200 },
		};
		const auth = checkPmbAdminAuth(context);

		expect(auth.authorized).toBe(false);
		expect(context.set.status).toBe(401);
		expect(auth.response?.code).toBe("UNAUTHORIZED");
	});

	it("should return 401 IDLE_TIMEOUT when session has expired due to idle timeout", () => {
		const context = {
			user: null,
			sessionStatus: "idle_timeout",
			set: { status: 200 },
		};
		const auth = checkPmbAdminAuth(context);

		expect(auth.authorized).toBe(false);
		expect(context.set.status).toBe(401);
		expect(auth.response?.code).toBe("IDLE_TIMEOUT");
		expect(auth.response?.message).toContain("idle timeout");
	});

	it("should return 403 FORBIDDEN when user has insufficient privileges (e.g. CRM user)", () => {
		const crmUser = createCrmUser();
		const context = {
			user: crmUser,
			sessionStatus: "valid",
			set: { status: 200 },
		};
		const auth = checkPmbAdminAuth(context);

		expect(auth.authorized).toBe(false);
		expect(context.set.status).toBe(403);
		expect(auth.response?.code).toBe("FORBIDDEN");
		expect(auth.response?.message).toContain("crm");
	});

	it("should allow user with PMB role", () => {
		const pmbUser = createPmbUser();
		const context = {
			user: pmbUser,
			sessionStatus: "valid",
			set: { status: 200 },
		};
		const auth = checkPmbAdminAuth(context);

		expect(auth.authorized).toBe(true);
		expect(context.set.status).toBe(200);
		expect(auth.user?.role).toBe("pmb");
	});

	it("should allow superadmin user to access PMB resources", () => {
		const superadmin = createSuperadminUser();
		const context = {
			user: superadmin,
			sessionStatus: "valid",
			set: { status: 200 },
		};
		const auth = checkPmbAdminAuth(context);

		expect(auth.authorized).toBe(true);
		expect(context.set.status).toBe(200);
	});
});
