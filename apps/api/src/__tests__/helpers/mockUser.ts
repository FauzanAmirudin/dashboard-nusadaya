import type { AuthUser } from "../../lib/permissions";

export type MockUserRole =
	| "superadmin"
	| "pmb"
	| "crm"
	| "finance"
	| "akademik"
	| "dosen"
	| "pa"
	| "magang"
	| "evaluator"
	| "mahasiswa";

let nextUserId = 1;

/**
 * Generate mock user object conforming to AuthUser type.
 */
export function createMockUser(
	role: MockUserRole | string = "mahasiswa",
	overrides?: Partial<NonNullable<AuthUser>>,
): NonNullable<AuthUser> {
	const id = overrides?.id ?? nextUserId++;
	const username = overrides?.username ?? `${role}_user_${id}`;
	const fullName = overrides?.fullName ?? `User ${role.toUpperCase()} ${id}`;

	return {
		id,
		username,
		role,
		roles: overrides?.roles ?? [role],
		fullName,
		...overrides,
	};
}

export const createSuperadminUser = (
	overrides?: Partial<NonNullable<AuthUser>>,
) => createMockUser("superadmin", overrides);

export const createAdminUser = createSuperadminUser;

export const createPmbUser = (overrides?: Partial<NonNullable<AuthUser>>) =>
	createMockUser("pmb", overrides);

export const createCrmUser = (overrides?: Partial<NonNullable<AuthUser>>) =>
	createMockUser("crm", overrides);

export const createFinanceUser = (overrides?: Partial<NonNullable<AuthUser>>) =>
	createMockUser("finance", overrides);

export const createAkademikUser = (
	overrides?: Partial<NonNullable<AuthUser>>,
) => createMockUser("akademik", overrides);

export const createDosenUser = (overrides?: Partial<NonNullable<AuthUser>>) =>
	createMockUser("dosen", overrides);

export const createPaUser = (overrides?: Partial<NonNullable<AuthUser>>) =>
	createMockUser("pa", overrides);

export const createMagangUser = (overrides?: Partial<NonNullable<AuthUser>>) =>
	createMockUser("magang", overrides);

export const createEvaluatorUser = (
	overrides?: Partial<NonNullable<AuthUser>>,
) => createMockUser("evaluator", overrides);

export const createMahasiswaUser = (
	overrides?: Partial<NonNullable<AuthUser>>,
) => createMockUser("mahasiswa", overrides);

export function createMultiRoleUser(
	primaryRole: MockUserRole | string,
	roles: (MockUserRole | string)[],
	overrides?: Partial<NonNullable<AuthUser>>,
): NonNullable<AuthUser> {
	return createMockUser(primaryRole, {
		roles: Array.from(new Set([primaryRole, ...roles])),
		...overrides,
	});
}

export function createAnonymousUser(): null {
	return null;
}
