import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export type AuthUser = {
	id: number;
	username: string;
	role: string;
	roles?: string[];
	fullName?: string;
} | null;

export function getUserRoles(user: AuthUser): string[] {
	if (!user) return [];
	if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
		return user.roles;
	}
	return user.role ? [user.role] : [];
}

export function hasRole(user: AuthUser, ...requiredRoles: string[]): boolean {
	if (!user) return false;
	const userRoles = getUserRoles(user);
	if (user.role === "superadmin" || userRoles.includes("superadmin")) {
		return true;
	}
	return requiredRoles.some((r) => userRoles.includes(r));
}

export async function getValidUserId(user: AuthUser): Promise<number | null> {
	if (!user) return null;
	if (user.id && typeof user.id === "number") {
		try {
			const u = await db.query.users.findFirst({
				where: eq(users.id, user.id),
				columns: { id: true },
			});
			if (u) return u.id;
		} catch {}
	}
	if (user.username) {
		try {
			const uByName = await db.query.users.findFirst({
				where: eq(users.username, user.username),
				columns: { id: true },
			});
			if (uByName) return uByName.id;
		} catch {}
	}
	return null;
}
