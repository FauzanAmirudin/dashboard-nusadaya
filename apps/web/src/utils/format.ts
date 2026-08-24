export const formatRupiah = (angka: number) => {
	return `Rp ${new Intl.NumberFormat("id-ID").format(angka || 0)}`;
};

/**
 * Format jam dinamis mengikuti zona waktu dan jam komputer/perangkat lokal user.
 * Contoh hasil: "14:05:30 WIB" atau "15:05:30 WITA" atau "15:05:30 GMT+8"
 */
export const formatDeviceTime = (
	dateInput: Date | string | number | null | undefined,
	options?: Intl.DateTimeFormatOptions,
): string => {
	if (!dateInput) return "-";
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	if (Number.isNaN(date.getTime())) return "-";

	const defaultOptions: Intl.DateTimeFormatOptions = {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZoneName: "short",
		...options,
	};

	try {
		return new Intl.DateTimeFormat("id-ID", defaultOptions).format(date);
	} catch {
		return date.toLocaleTimeString("id-ID", defaultOptions);
	}
};

/**
 * Format tanggal & jam dinamis mengikuti zona waktu komputer/perangkat lokal user.
 * Contoh hasil: "23 Agu 2026, 14:05 WIB"
 */
export const formatDeviceDateTime = (
	dateInput: Date | string | number | null | undefined,
	options?: Intl.DateTimeFormatOptions,
): string => {
	if (!dateInput) return "-";
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	if (Number.isNaN(date.getTime())) return "-";

	const defaultOptions: Intl.DateTimeFormatOptions = {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZoneName: "short",
		...options,
	};

	try {
		return new Intl.DateTimeFormat("id-ID", defaultOptions).format(date);
	} catch {
		return date.toLocaleString("id-ID", defaultOptions);
	}
};
