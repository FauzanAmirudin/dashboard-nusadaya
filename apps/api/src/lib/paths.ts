import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Resolve root workspace monorepo secara konsisten, terlepas dari `process.cwd()`
 * (root proyek, `apps/api`, ataupun `/app/apps/api` di Docker production).
 */
export function resolveWorkspaceRoot(): string {
	const fromModule = resolve(import.meta.dir, "../../../..");
	if (existsSync(join(fromModule, "apps", "api"))) {
		return fromModule;
	}
	const cwd = process.cwd();
	if (existsSync(join(cwd, "apps", "api"))) {
		return cwd;
	}
	if (existsSync(join(cwd, "../../apps/api"))) {
		return resolve(cwd, "../..");
	}
	return fromModule;
}

/**
 * Path storage aktif (mengutamakan `process.env.STORAGE_PATH` untuk production Docker).
 */
export function resolveStoragePath(): string {
	if (process.env.STORAGE_PATH && process.env.STORAGE_PATH.trim() !== "") {
		return process.env.STORAGE_PATH;
	}
	return join(resolveWorkspaceRoot(), "storage");
}

/**
 * Path direktori backup (mengutamakan `process.env.BACKUP_PATH` untuk production Docker).
 */
export function resolveBackupPath(): string {
	if (process.env.BACKUP_PATH && process.env.BACKUP_PATH.trim() !== "") {
		return process.env.BACKUP_PATH;
	}
	return join(resolveWorkspaceRoot(), "backups");
}

/**
 * Path legacy `apps/api/uploads` (untuk fallback file lama seperti departure_assessments).
 */
export function resolveLegacyUploadsPath(): string {
	if (
		process.env.LEGACY_UPLOADS_PATH &&
		process.env.LEGACY_UPLOADS_PATH.trim() !== ""
	) {
		return process.env.LEGACY_UPLOADS_PATH;
	}
	return join(resolveWorkspaceRoot(), "apps", "api", "uploads");
}
