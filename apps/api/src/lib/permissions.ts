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
	const rolesSet = new Set<string>();
	if (user.role) {
		rolesSet.add(String(user.role).toLowerCase().trim());
	}
	if (user.roles && Array.isArray(user.roles)) {
		for (const r of user.roles) {
			if (r) rolesSet.add(String(r).toLowerCase().trim());
		}
	}
	return Array.from(rolesSet);
}

export function hasRole(user: AuthUser, ...requiredRoles: string[]): boolean {
	if (!user) return false;
	const userRoles = getUserRoles(user);
	const userPrimaryRole = user.role
		? String(user.role).toLowerCase().trim()
		: "";
	if (userPrimaryRole === "superadmin" || userRoles.includes("superadmin")) {
		return true;
	}
	const normalizedRequired = requiredRoles.map((r) =>
		String(r).toLowerCase().trim(),
	);
	return normalizedRequired.some(
		(r) => userRoles.includes(r) || (userPrimaryRole && userPrimaryRole === r),
	);
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
