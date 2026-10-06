/**
 * Konfigurasi dan Helper Peminatan / Sub Program & Negara Tujuan
 * Menggunakan FlagCDN untuk icon bendera negara resolusi tinggi.
 */

export interface PeminatanOption {
	value: string;
	label: string;
	flag: string;
	alt: string;
	countryName: string;
}

export const PEMINATAN_OPTIONS: PeminatanOption[] = [
	{
		value: "Malaysia-Hospitality",
		label: "Malaysia-Hospitality",
		flag: "https://flagcdn.com/w40/my.png",
		alt: "MY",
		countryName: "Malaysia",
	},
	{
		value: "Taiwan-Hospitality",
		label: "Taiwan-Hospitality",
		flag: "https://flagcdn.com/w40/tw.png",
		alt: "TW",
		countryName: "Taiwan",
	},
	{
		value: "Timur tengah-Barista",
		label: "Timur tengah-Barista",
		flag: "https://flagcdn.com/w40/sa.png",
		alt: "SA",
		countryName: "Timur Tengah",
	},
	{
		value: "Indonesia-Reguler",
		label: "Indonesia-Reguler",
		flag: "https://flagcdn.com/w40/id.png",
		alt: "ID",
		countryName: "Indonesia",
	},
];

export const COUNTRY_FLAG_MAP: Record<
	string,
	{ flag: string; alt: string; countryName: string }
> = {
	malaysia: {
		flag: "https://flagcdn.com/w40/my.png",
		alt: "MY",
		countryName: "Malaysia",
	},
	taiwan: {
		flag: "https://flagcdn.com/w40/tw.png",
		alt: "TW",
		countryName: "Taiwan",
	},
	"timur tengah": {
		flag: "https://flagcdn.com/w40/sa.png",
		alt: "SA",
		countryName: "Timur Tengah",
	},
	saudi: {
		flag: "https://flagcdn.com/w40/sa.png",
		alt: "SA",
		countryName: "Timur Tengah",
	},
	barista: {
		flag: "https://flagcdn.com/w40/sa.png",
		alt: "SA",
		countryName: "Timur Tengah",
	},
	dubai: {
		flag: "https://flagcdn.com/w40/ae.png",
		alt: "AE",
		countryName: "Timur Tengah",
	},
	uae: {
		flag: "https://flagcdn.com/w40/ae.png",
		alt: "AE",
		countryName: "Timur Tengah",
	},
	indonesia: {
		flag: "https://flagcdn.com/w40/id.png",
		alt: "ID",
		countryName: "Indonesia",
	},
};

/**
 * Mendapatkan detail opsi peminatan & benderanya dari teks/value.
 */
export function getPeminatanOption(
	value: string | null | undefined,
): PeminatanOption {
	if (!value || value.trim() === "" || value.trim() === "-") {
		return {
			value: "-",
			label: "-",
			flag: "https://flagcdn.com/w40/id.png",
			alt: "ID",
			countryName: "Indonesia",
		};
	}

	const exact = PEMINATAN_OPTIONS.find((p) => p.value === value);
	if (exact) return exact;

	const lower = value.toLowerCase();
	for (const [key, data] of Object.entries(COUNTRY_FLAG_MAP)) {
		if (lower.includes(key)) {
			return {
				value,
				label: value,
				flag: data.flag,
				alt: data.alt,
				countryName: data.countryName,
			};
		}
	}

	// Default jika tidak spesifik
	return {
		value,
		label: value,
		flag: "https://flagcdn.com/w40/id.png",
		alt: "ID",
		countryName: "Indonesia",
	};
}

/**
 * Mendapatkan info peminatan gabungan dari subProgram, destinationCountry, atau program.
 */
export function getPeminatanInfo(
	subProgram?: string | null,
	destinationCountry?: string | null,
	program?: string | null,
): {
	label: string;
	subProgram: string;
	destinationCountry: string;
	flag: string;
	alt: string;
	countryName: string;
	hasCustomSubProgram: boolean;
} {
	const rawTarget =
		subProgram?.trim() || destinationCountry?.trim() || program?.trim() || "-";

	const opt = getPeminatanOption(rawTarget);

	const hasCustomSubProgram = Boolean(
		subProgram && subProgram.trim() !== "" && subProgram.trim() !== "-",
	);

	return {
		label: hasCustomSubProgram
			? (subProgram as string)
			: destinationCountry?.trim() || opt.label,
		subProgram: subProgram || "-",
		destinationCountry: destinationCountry || opt.countryName,
		flag: opt.flag,
		alt: opt.alt,
		countryName: opt.countryName,
		hasCustomSubProgram,
	};
}
