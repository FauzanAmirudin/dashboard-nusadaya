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
