/**
 * Helper normalisasi email dan string keamanan input
 */

export function normalizeEmail(
	email: string | null | undefined,
): string | null {
	if (!email) return null;
	const cleaned = email.trim().toLowerCase();
	return cleaned.length > 0 ? cleaned : null;
}

export function isValidEmailFormat(email: string): boolean {
	const emailRegex =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
	return emailRegex.test(email);
}
