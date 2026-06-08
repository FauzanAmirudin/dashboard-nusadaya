import { Elysia } from "elysia";
import { authSetup } from "./auth";

export const requireRole = (allowedRoles: string[]) => {
	return new Elysia().use(authSetup).onBeforeHandle(({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { error: "Unauthorized" };
		}
		if (!allowedRoles.includes(user.role)) {
			set.status = 403;
			return { error: "Forbidden: Insufficient privileges" };
		}
	});
};
