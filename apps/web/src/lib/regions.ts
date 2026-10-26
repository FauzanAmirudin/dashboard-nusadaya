import regionsData from "../data/indonesia-regions-data.json";

interface RegencyItem {
	id: string;
	name: string;
}

interface ProvinceItem {
	id: string;
	name: string;
	regencies: RegencyItem[];
}

interface BaliDistrictItem {
	id: string;
	name: string;
	villages: string[];
}

// 38 Provinsi di Indonesia (Alfabetis A-Z)
export const ALL_INDONESIA_PROVINCES: string[] = [
	"Aceh",
	"Bali",
	"Banten",
	"Bengkulu",
	"DI Yogyakarta",
	"DKI Jakarta",
	"Gorontalo",
	"Jambi",
	"Jawa Barat",
	"Jawa Tengah",
	"Jawa Timur",
	"Kalimantan Barat",
	"Kalimantan Selatan",
	"Kalimantan Tengah",
	"Kalimantan Timur",
	"Kalimantan Utara",
	"Kepulauan Bangka Belitung",
	"Kepulauan Riau",
	"Lampung",
	"Maluku",
	"Maluku Utara",
	"Nusa Tenggara Barat",
	"Nusa Tenggara Timur",
	"Papua",
	"Papua Barat",
	"Papua Barat Daya",
	"Papua Pegunungan",
	"Papua Selatan",
	"Papua Tengah",
	"Riau",
	"Sulawesi Barat",
	"Sulawesi Selatan",
	"Sulawesi Tengah",
	"Sulawesi Tenggara",
	"Sulawesi Utara",
	"Sumatera Barat",
	"Sumatera Selatan",
	"Sumatera Utara",
].sort((a, b) => a.localeCompare(b, "id"));

// In-memory cache for API requests
const districtCache = new Map<string, { id: string; name: string }[]>();
const villageCache = new Map<string, string[]>();

function toTitleCase(str: string): string {
	return str
		.toLowerCase()
		.split(" ")
		.map((word) => {
			if (word.length === 0) return word;
			if (["dki", "di", "ntb", "ntt"].includes(word)) return word.toUpperCase();
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");
}

/**
 * Mengambil daftar seluruh provinsi di Indonesia (terurut A-Z)
 */
export function getProvinces(): string[] {
	return ALL_INDONESIA_PROVINCES;
}

/**
 * Mencari data provinsi dalam dataset (toleran terhadap perbedaan huruf besar/kecil)
 */
function findProvinceEntry(provinceName: string): ProvinceItem | undefined {
	if (!provinceName) return undefined;
	const pNorm = provinceName.trim().toLowerCase();
	const provinces = regionsData.provinces as Record<string, ProvinceItem>;
	for (const [key, val] of Object.entries(provinces)) {
		if (
			key.toLowerCase() === pNorm ||
			val.name.toLowerCase() === pNorm ||
			pNorm.includes(key.toLowerCase()) ||
			key.toLowerCase().includes(pNorm)
		) {
			return val;
		}
	}
	return undefined;
}

/**
 * Mengambil daftar Kabupaten/Kota untuk suatu Provinsi (terurut A-Z)
 */
export function getCities(provinceName: string): string[] {
	if (!provinceName) return [];
	const pEntry = findProvinceEntry(provinceName);
	if (!pEntry || !pEntry.regencies) return [];

	return pEntry.regencies
		.map((r) => r.name)
		.sort((a, b) => a.localeCompare(b, "id"));
}

/**
 * Mencari id regency untuk panggilan API ke emsifa
 */
export function findRegencyId(
	provinceName: string,
	cityName: string,
): string | undefined {
	if (!provinceName || !cityName) return undefined;
	const pEntry = findProvinceEntry(provinceName);
	if (!pEntry || !pEntry.regencies) return undefined;

	const cNorm = cityName.trim().toLowerCase();
	const found = pEntry.regencies.find((r) => {
		const rNorm = r.name.toLowerCase();
		return (
			rNorm === cNorm ||
			rNorm.replace("kabupaten ", "") === cNorm.replace("kabupaten ", "") ||
			rNorm.replace("kota ", "") === cNorm.replace("kota ", "") ||
			cNorm.includes(rNorm) ||
			rNorm.includes(cNorm)
		);
	});

	return found?.id;
}

/**
 * Helper internal untuk fetch data wilayah melalui proxy internal (menghindari CORS di browser)
 * dengan fallback ke API upstream untuk server-side/test runner.
 */
async function fetchWilayah(
	type: "districts" | "villages",
	id: string,
): Promise<Array<{ id: string; name: string }>> {
	// 1. Pada browser, gunakan internal endpoint yang same-origin (kebal CORS)
	if (typeof window !== "undefined") {
		try {
			const res = await fetch(`/api/regions/${type}/${id}`);
			if (res.ok) {
				const json = await res.json();
				if (Array.isArray(json) && json.length > 0) {
					return json;
				}
			}
		} catch {
			// Fallback ke upstream langsung jika proxy internal tidak tersedia
		}
	}

	// 2. Upstream fetch langsung (berjalan di server-side, test runner bun, atau fallback)
	try {
		const res = await fetch(
			`https://emsifa.github.io/api-wilayah-indonesia/api/${type}/${id}.json`,
		);
		if (res.ok) {
			const json = await res.json();
			if (Array.isArray(json)) {
				return json;
			}
		}
	} catch {
		// Silent failure
	}

	return [];
}

/**
 * Mengambil daftar Kecamatan untuk suatu Kabupaten/Kota (terurut A-Z)
 */
export async function getDistricts(
	provinceName: string,
	cityName: string,
): Promise<string[]> {
	if (!provinceName || !cityName) return [];

	// 1. Cek offline Bali
	const pEntry = findProvinceEntry(provinceName);
	if (pEntry && pEntry.name.toLowerCase().includes("bali")) {
		const offlineBali = regionsData.offlineBali as Record<
			string,
			BaliDistrictItem[]
		>;
		for (const [regName, dists] of Object.entries(offlineBali)) {
			if (
				regName.toLowerCase() === cityName.toLowerCase() ||
				cityName.toLowerCase().includes(regName.toLowerCase()) ||
				regName.toLowerCase().includes(cityName.toLowerCase())
			) {
				return dists
					.map((d) => d.name)
					.sort((a, b) => a.localeCompare(b, "id"));
			}
		}
	}

	// 2. Cek API via internal proxy
	const regencyId = findRegencyId(provinceName, cityName);
	if (!regencyId) return [];

	if (districtCache.has(regencyId)) {
		return districtCache
			.get(regencyId)!
			.map((d) => d.name)
			.sort((a, b) => a.localeCompare(b, "id"));
	}

	try {
		const data = await fetchWilayah("districts", regencyId);
		if (!data || data.length === 0) return [];
		const mapped = data.map((d) => ({
			id: d.id,
			name: toTitleCase(d.name),
		}));
		districtCache.set(regencyId, mapped);
		return mapped.map((d) => d.name).sort((a, b) => a.localeCompare(b, "id"));
	} catch {
		return [];
	}
}

/**
 * Mengambil daftar Kelurahan/Desa untuk suatu Kecamatan (terurut A-Z)
 */
export async function getVillages(
	provinceName: string,
	cityName: string,
	districtName: string,
): Promise<string[]> {
	if (!provinceName || !cityName || !districtName) return [];

	// 1. Cek offline Bali
	const pEntry = findProvinceEntry(provinceName);
	if (pEntry && pEntry.name.toLowerCase().includes("bali")) {
		const offlineBali = regionsData.offlineBali as Record<
			string,
			BaliDistrictItem[]
		>;
		for (const [regName, dists] of Object.entries(offlineBali)) {
			if (
				regName.toLowerCase() === cityName.toLowerCase() ||
				cityName.toLowerCase().includes(regName.toLowerCase()) ||
				regName.toLowerCase().includes(cityName.toLowerCase())
			) {
				const dFound = dists.find(
					(d) =>
						d.name.toLowerCase() === districtName.toLowerCase() ||
						districtName.toLowerCase().includes(d.name.toLowerCase()),
				);
				if (dFound && dFound.villages) {
					return [...dFound.villages].sort((a, b) => a.localeCompare(b, "id"));
				}
			}
		}
	}

	// 2. Cek API via internal proxy
	const regencyId = findRegencyId(provinceName, cityName);
	if (!regencyId) return [];

	let dists = districtCache.get(regencyId);
	if (!dists) {
		await getDistricts(provinceName, cityName);
		dists = districtCache.get(regencyId);
	}
	if (!dists) return [];

	const dNorm = districtName.trim().toLowerCase();
	const distFound = dists.find(
		(d) =>
			d.name.toLowerCase() === dNorm ||
			d.name.toLowerCase().includes(dNorm) ||
			dNorm.includes(d.name.toLowerCase()),
	);

	if (!distFound) return [];

	if (villageCache.has(distFound.id)) {
		return [...villageCache.get(distFound.id)!].sort((a, b) =>
			a.localeCompare(b, "id"),
		);
	}

	try {
		const data = await fetchWilayah("villages", distFound.id);
		if (!data || data.length === 0) return [];
		const mapped = data
			.map((v) => toTitleCase(v.name))
			.sort((a, b) => a.localeCompare(b, "id"));
		villageCache.set(distFound.id, mapped);
		return mapped;
	} catch {
		return [];
	}
}
