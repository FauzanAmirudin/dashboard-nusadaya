import { Elysia } from "elysia";
import { authSetup } from "./auth";

export const requireRole = (allowedRoles: string[]) => {
	return new Elysia().use(authSetup).onBeforeHandle((context: any) => {
		const user = context.user;
		if (!user) {
			context.set.status = 401;
			return { error: "Unauthorized" };
		}
		if (!allowedRoles.includes(user.role)) {
			context.set.status = 403;
			return { error: "Forbidden: Insufficient privileges" };
		}
	});
};
