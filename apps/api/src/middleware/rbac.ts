import { Elysia } from "elysia";
import { hasRole } from "../lib/permissions";
import { authSetup } from "./auth";

export const requireRole = (allowedRoles: string[]) => {
	return new Elysia().use(authSetup).onBeforeHandle((context: any) => {
		const user = context.user;
		if (!user) {
			context.set.status = 401;
			return { error: "Unauthorized" };
		}
		if (!hasRole(user, ...allowedRoles)) {
			context.set.status = 403;
			return { error: "Forbidden: Insufficient privileges" };
		}
	});
};
