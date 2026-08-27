import { Elysia } from "elysia";
import { hasRole } from "../lib/permissions";
import { authSetup } from "./auth";

export const requireRole = (allowedRoles: string[]) => {
	return new Elysia().use(authSetup).onBeforeHandle((context: any) => {
		const user = context.user;
		if (!user) {
			context.set.status = 401;
			if (context.sessionStatus === "idle_timeout") {
				return {
					success: false,
					code: "IDLE_TIMEOUT",
					message: "Sesi Anda telah berakhir karena tidak ada aktivitas.",
				};
			}
			return { success: false, code: "UNAUTHORIZED", error: "Unauthorized" };
		}
		if (!hasRole(user, ...allowedRoles)) {
			context.set.status = 403;
			return { success: false, error: "Forbidden: Insufficient privileges" };
		}
	});
};
