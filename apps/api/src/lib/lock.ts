import { redis } from "./redis";

/**
 * Distributed lock helper menggunakan Redis SET NX EX.
 *
 * Mencegah duplikasi job yang sama berjalan bersamaan.
 * Contoh: jika backup angkatan 2026 sedang berjalan, request kedua ditolak.
 *
 * Key naming convention:
 *   lock:backup:{filterHash}
 *   lock:processing:{fileId}
 *
 * Lock bersifat sementara — otomatis expire sesuai TTL.
 * Jika worker crash, lock akan release sendiri setelah TTL habis.
 */

const LOCK_PREFIX = "lock";

/**
 * Coba acquire lock untuk key tertentu.
 * Return true jika berhasil (lock diambil).
 * Return false jika lock sudah dipegang oleh proses lain.
 *
 * Menggunakan SET NX EX — atomic, tidak ada race condition.
 */
export async function acquireLock(
	key: string,
	ttlSeconds: number,
): Promise<boolean> {
	const lockKey = `${LOCK_PREFIX}:${key}`;
	const result = await redis.set(lockKey, "LOCKED", "EX", ttlSeconds, "NX");
	return result === "OK";
}

/**
 * Release lock.
 * Worker wajib memanggil ini setelah selesai (sukses atau gagal).
 */
export async function releaseLock(key: string): Promise<void> {
	const lockKey = `${LOCK_PREFIX}:${key}`;
	await redis.del(lockKey);
}

/**
 * Cek apakah lock sedang aktif (untuk informasi ke admin).
 */
export async function isLocked(key: string): Promise<boolean> {
	const lockKey = `${LOCK_PREFIX}:${key}`;
	const value = await redis.get(lockKey);
	return value !== null;
}
