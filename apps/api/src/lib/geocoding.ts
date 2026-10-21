import { cacheGet, cacheSet } from "./cache";

/**
 * Reverse Geocoding utility menggunakan OpenStreetMap Nominatim API (Gratis)
 * Dilengkapi dengan:
 * 1. Cache L1 RAM + L2 Redis dengan koordinat rounded 4 desimal (~11 meter presisi)
 * 2. Timeout protection (3.5 detik) agar tidak menghambat submission absensi
 * 3. Graceful fallback ke string koordinat "Lat: X.XXXX, Long: Y.YYYY" jika API down / offline
 */

const GEOCODE_CACHE_TTL = 86400; // 24 jam
const NOMINATIM_USER_AGENT =
	"NusadayaAcademy-Attendance/1.0 (admin@nusadaya.ac.id)";

export async function reverseGeocode(
	lat: number,
	lon: number,
): Promise<string> {
	if (isNaN(lat) || isNaN(lon)) {
		return "Koordinat Tidak Valid";
	}

	const roundedLat = lat.toFixed(4);
	const roundedLon = lon.toFixed(4);
	const fallbackString = `Lat: ${roundedLat}, Long: ${roundedLon}`;

	const cacheKey = `cache:geocode:${roundedLat}:${roundedLon}`;

	// 1. Cek cache
	try {
		const cached = await cacheGet<string>(cacheKey);
		if (cached) {
			return cached;
		}
	} catch {
		// Abaikan cache error
	}

	// 2. Request ke Nominatim OpenStreetMap dengan AbortController timeout 3.5s
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3500);

		const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
			roundedLat,
		)}&lon=${encodeURIComponent(roundedLon)}&format=json&accept-language=id`;

		const res = await fetch(url, {
			headers: {
				"User-Agent": NOMINATIM_USER_AGENT,
				Accept: "application/json",
			},
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!res.ok) {
			return fallbackString;
		}

		const data = (await res.json()) as any;
		if (!data) return fallbackString;

		// Format nama lokasi yang mudah dibaca dan ringkas
		let formattedName = "";
		if (data.address) {
			const addr = data.address;
			const parts: string[] = [];

			const road = addr.road || addr.pedestrian || addr.building;
			if (road) parts.push(road);

			const sub = addr.suburb || addr.village || addr.neighbourhood;
			if (sub) parts.push(sub);

			const city = addr.city || addr.town || addr.municipality || addr.county;
			if (city) parts.push(city);

			const state = addr.state;
			if (state && parts.length < 3) parts.push(state);

			formattedName = parts.filter(Boolean).join(", ");
		}

		if (!formattedName && data.display_name) {
			// Ambil 3 segmen pertama dari display_name
			formattedName = data.display_name.split(",").slice(0, 3).join(",").trim();
		}

		const result = formattedName || fallbackString;

		// Simpan ke cache
		await cacheSet(cacheKey, result, GEOCODE_CACHE_TTL);

		return result;
	} catch (err) {
		// Timeout atau network failure -> kembalikan format koordinat
		return fallbackString;
	}
}
