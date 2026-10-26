import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "../db";
import { attendanceCheckpointConfig } from "../db/schema";

export interface Coordinates {
	latitude: number;
	longitude: number;
}

export interface CheckpointInfo {
	id?: number;
	type: string;
	label: string;
	latitude: number;
	longitude: number;
	radiusMeters: number;
	cohort?: number | null;
}

// Default fallback checkpoint: Kampus Nusadaya Academy (Bandar Lampung)
// Alamat: Jl. Raden Imba Kusuma Ratu, Langkapura, Kec. Langkapura, Kota Bandar Lampung, Lampung 35116
export const DEFAULT_CAMPUS_CHECKPOINT: CheckpointInfo = {
	type: "default",
	label: "Kampus Nusadaya Academy Bandar Lampung",
	latitude: -5.40145,
	longitude: 105.2114,
	radiusMeters: 150,
};

/**
 * Menghitung jarak antara dua titik koordinat GPS menggunakan formula Haversine
 * Mengembalikan jarak dalam satuan meter.
 */
export function calculateDistanceMeters(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371000; // Radius bumi dalam meter
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Math.round(R * c);
}

/**
 * Mengecek apakah posisi mahasiswa berada dalam radius checkpoint
 */
export function isWithinRadius(
	studentCoords: Coordinates,
	checkpointCoords: Coordinates,
	radiusMeters: number,
): boolean {
	const distance = calculateDistanceMeters(
		studentCoords.latitude,
		studentCoords.longitude,
		checkpointCoords.latitude,
		checkpointCoords.longitude,
	);
	return distance <= radiusMeters;
}

/**
 * Mendeteksi potensi manipulasi GPS / anomali sensor
 */
export function detectGpsSpoofingRisk(
	accuracy: number,
	latitude: number,
	longitude: number,
): { isSuspicious: boolean; reason?: string } {
	// 1. Akurasi tidak valid atau negatif
	if (isNaN(accuracy) || accuracy <= 0) {
		return {
			isSuspicious: true,
			reason: "gps_accuracy_too_low",
		};
	}

	// 2. Akurasi terlalu rendah (di atas 500m menandakan sinyal GPS sangat lemah / perkiraan IP / mock)
	if (accuracy > 500) {
		return {
			isSuspicious: true,
			reason: "gps_accuracy_too_low",
		};
	}

	// 3. Batas wilayah Indonesia: Lat: -11.5 s/d 6.5, Long: 94.5 s/d 141.5
	if (
		latitude < -11.5 ||
		latitude > 6.5 ||
		longitude < 94.5 ||
		longitude > 141.5
	) {
		return {
			isSuspicious: true,
			reason: "gps_spoofing_suspected",
		};
	}

	return { isSuspicious: false };
}

/**
 * Mengambil konfigurasi checkpoint yang aktif untuk tipe sesi absensi
 */
export async function getCheckpointForSession(
	sessionType: "baris_pagi" | "kuliah" | "piket" | "ods" | string,
	cohort?: number | null,
): Promise<CheckpointInfo> {
	try {
		// Prioritaskan checkpoint yang spesifik untuk cohort jika ada
		const conditions = [
			eq(attendanceCheckpointConfig.type, sessionType),
			eq(attendanceCheckpointConfig.isActive, true),
		];

		if (cohort) {
			const specificCohort =
				await db.query.attendanceCheckpointConfig.findFirst({
					where: and(
						...conditions,
						eq(attendanceCheckpointConfig.cohort, cohort),
					),
					orderBy: [desc(attendanceCheckpointConfig.updatedAt)],
				});
			if (specificCohort) {
				return {
					id: specificCohort.id,
					type: specificCohort.type,
					label: specificCohort.label,
					latitude: specificCohort.latitude,
					longitude: specificCohort.longitude,
					radiusMeters: specificCohort.radiusMeters,
					cohort: specificCohort.cohort,
				};
			}
		}

		// Fallback ke checkpoint umum (cohort null)
		const general = await db.query.attendanceCheckpointConfig.findFirst({
			where: and(
				...conditions,
				or(
					isNull(attendanceCheckpointConfig.cohort),
					eq(attendanceCheckpointConfig.cohort, 0),
				),
			),
			orderBy: [desc(attendanceCheckpointConfig.updatedAt)],
		});

		if (general) {
			return {
				id: general.id,
				type: general.type,
				label: general.label,
				latitude: general.latitude,
				longitude: general.longitude,
				radiusMeters: general.radiusMeters,
				cohort: general.cohort,
			};
		}
	} catch (err) {
		console.error("Error fetching checkpoint config from database:", err);
	}

	return {
		...DEFAULT_CAMPUS_CHECKPOINT,
		type: sessionType,
	};
}
