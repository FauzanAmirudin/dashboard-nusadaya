import type React from "react";
import { toast } from "sonner";

/**
 * Filter string agar hanya berisi angka 0-9 dan dibatasi panjang maksimalnya.
 * Jika terdapat karakter selain angka, tampilkan notifikasi toast warning.
 */
export function filterNumeric(
	value: string,
	maxLength?: number,
	warningMessage = "Hanya angka numerik yang diperbolehkan",
): string {
	const digitsOnly = value.replace(/[^0-9]/g, "");

	if (value !== digitsOnly && /[^0-9]/.test(value)) {
		toast.warning(warningMessage);
	}

	if (maxLength && digitsOnly.length > maxLength) {
		toast.warning(`Maksimal ${maxLength} digit angka`);
		return digitsOnly.slice(0, maxLength);
	}

	return digitsOnly;
}

/**
 * Filter nomor telepon (hanya digit 0-9 dan opsional simbol '+' di awal).
 */
export function filterPhone(
	value: string,
	maxLength = 15,
	warningMessage = "Nomor telepon hanya boleh berisi angka dan tanda +",
): string {
	// Izinkan '+' hanya di indeks ke-0
	let cleaned = "";
	for (let i = 0; i < value.length; i++) {
		const char = value[i];
		if (char === "+" && i === 0) {
			cleaned += "+";
		} else if (/[0-9]/.test(char)) {
			cleaned += char;
		}
	}

	if (value !== cleaned && /[^0-9+]/.test(value)) {
		toast.warning(warningMessage);
	}

	if (cleaned.length > maxLength) {
		toast.warning(`Nomor telepon maksimal ${maxLength} karakter`);
		return cleaned.slice(0, maxLength);
	}

	return cleaned;
}

/**
 * Filter username / teks alfanumerik (huruf, angka, opsional underscore).
 */
export function filterAlphaNumeric(
	value: string,
	maxLength = 30,
	allowUnderscore = true,
	warningMessage = "Hanya huruf, angka, dan underscore yang diperbolehkan",
): string {
	const regex = allowUnderscore ? /[^a-zA-Z0-9_]/g : /[^a-zA-Z0-9]/g;
	const filtered = value.replace(regex, "");

	if (value !== filtered && regex.test(value)) {
		toast.warning(warningMessage);
	}

	if (filtered.length > maxLength) {
		toast.warning(`Maksimal ${maxLength} karakter`);
		return filtered.slice(0, maxLength);
	}

	return filtered;
}

/**
 * Validasi format email standard.
 */
export function isValidEmail(email: string): boolean {
	if (!email || email.trim() === "") return false;
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	return emailRegex.test(email.trim());
}

/**
 * Event handler onKeyDown untuk mencegah pengetikan tombol karakter non-angka pada input numerik.
 */
export function preventNonNumericKey(
	e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) {
	// Izinkan tombol kontrol/navigasi
	const controlKeys = [
		"Backspace",
		"Delete",
		"Tab",
		"Enter",
		"ArrowLeft",
		"ArrowRight",
		"ArrowUp",
		"ArrowDown",
		"Home",
		"End",
	];

	if (controlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
		return;
	}

	if (!/^[0-9]$/.test(e.key)) {
		e.preventDefault();
		toast.warning("Hanya angka yang diperbolehkan");
	}
}

/**
 * Event handler onKeyDown untuk input nomor telepon (+ dan 0-9).
 */
export function preventNonPhoneKey(
	e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) {
	const controlKeys = [
		"Backspace",
		"Delete",
		"Tab",
		"Enter",
		"ArrowLeft",
		"ArrowRight",
		"ArrowUp",
		"ArrowDown",
		"Home",
		"End",
	];

	if (controlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
		return;
	}

	if (!/^[0-9+]$/.test(e.key)) {
		e.preventDefault();
		toast.warning("Hanya angka dan tanda + yang diperbolehkan");
	}
}

/**
 * Validasi rentang nilai angka integer.
 */
export function validateIntegerRange(
	value: number | string,
	min: number,
	max: number,
	label = "Nilai",
): { isValid: boolean; message?: string } {
	const num = typeof value === "string" ? Number(value) : value;
	if (Number.isNaN(num)) {
		return { isValid: false, message: `${label} harus berupa angka valid` };
	}
	if (num < min || num > max) {
		return {
			isValid: false,
			message: `${label} harus berada dalam rentang ${min} - ${max}`,
		};
	}
	return { isValid: true };
}

/**
 * Filter integer khusus panel Finance: maksimal 9 digit (maks 999.999.999).
 * Mengembalikan number bersih yang aman untuk integer SQL.
 */
export function filterFinanceInteger(
	value: string | number,
	maxDigits = 9,
): number {
	const str = String(value ?? "").replace(/\D/g, "");
	const sliced = str.slice(0, maxDigits);
	return sliced ? Number(sliced) : 0;
}

/**
 * Filter integer khusus panel Finance: mengembalikan string (maks 9 digit).
 */
export function filterFinanceIntegerString(
	value: string | number,
	maxDigits = 9,
): string {
	const str = String(value ?? "").replace(/\D/g, "");
	return str.slice(0, maxDigits);
}

/**
 * Event handler onKeyDown untuk mencegah pengetikan karakter non-angka
 * dan mencegah pengetikan melebihi batas 9 digit pada panel Finance.
 */
export function preventFinanceIntegerKey(
	e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	maxDigits = 9,
) {
	const controlKeys = [
		"Backspace",
		"Delete",
		"Tab",
		"Enter",
		"ArrowLeft",
		"ArrowRight",
		"ArrowUp",
		"ArrowDown",
		"Home",
		"End",
	];

	if (controlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
		return;
	}

	if (!/^[0-9]$/.test(e.key)) {
		e.preventDefault();
		return;
	}

	const input = e.currentTarget as HTMLInputElement;
	const selectedText = window.getSelection()?.toString() || "";
	const currentVal = input.value.replace(/\D/g, "");

	if (currentVal.length >= maxDigits && !selectedText) {
		e.preventDefault();
		toast.warning(`Input angka maksimal ${maxDigits} digit`);
	}
}
