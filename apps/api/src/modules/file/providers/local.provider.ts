import { mkdir, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
	StorageProvider,
	UploadOptions,
	UploadResult,
} from "./storage.interface";

/**
 * LocalStorageProvider — implementasi StorageProvider untuk local disk.
 *
 * Base path dikonfigurasi via env STORAGE_PATH.
 * Development lokal (Windows): relative ke cwd, fallback ke ".storage/"
 * Docker production: "/app/storage"
 *
 * Ketika nanti migrasi ke S3, hanya file ini yang perlu diganti dengan S3Provider.
 * Semua kode bisnis dan FileService tidak perlu berubah.
 */
export class LocalStorageProvider implements StorageProvider {
	private readonly basePath: string;

	constructor() {
		this.basePath =
			process.env.STORAGE_PATH ?? join(process.cwd(), "../../storage");
	}

	getAbsolutePath(storagePath: string): string {
		return join(this.basePath, storagePath);
	}

	async upload(options: UploadOptions): Promise<UploadResult> {
		const { buffer, storagePath } = options;
		const absolutePath = this.getAbsolutePath(storagePath);

		// Pastikan direktori sudah ada
		await mkdir(dirname(absolutePath), { recursive: true });

		// Tulis file menggunakan Bun native API
		await Bun.write(absolutePath, buffer);

		return {
			storagePath,
			size: buffer.length,
		};
	}

	async download(storagePath: string): Promise<Buffer> {
		const absolutePath = this.getAbsolutePath(storagePath);
		const file = Bun.file(absolutePath);
		if (!(await file.exists())) {
			throw new Error(`File tidak ditemukan: ${storagePath}`);
		}
		return Buffer.from(await file.arrayBuffer());
	}

	async stream(storagePath: string): Promise<ReadableStream> {
		const absolutePath = this.getAbsolutePath(storagePath);
		const file = Bun.file(absolutePath);
		if (!(await file.exists())) {
			throw new Error(`File tidak ditemukan: ${storagePath}`);
		}
		// Bun.file().stream() sudah native streaming — tidak load ke RAM
		return file.stream();
	}

	async delete(storagePath: string): Promise<void> {
		const absolutePath = this.getAbsolutePath(storagePath);
		try {
			await unlink(absolutePath);
		} catch (err: unknown) {
			// Jika file tidak ada, anggap sudah terhapus (idempotent)
			const error = err as NodeJS.ErrnoException;
			if (error.code !== "ENOENT") throw err;
		}
	}

	async exists(storagePath: string): Promise<boolean> {
		const absolutePath = this.getAbsolutePath(storagePath);
		return Bun.file(absolutePath).exists();
	}

	async move(from: string, to: string): Promise<void> {
		const absFrom = this.getAbsolutePath(from);
		const absTo = this.getAbsolutePath(to);
		await mkdir(dirname(absTo), { recursive: true });
		await rename(absFrom, absTo);
	}

	async copy(from: string, to: string): Promise<void> {
		const bufferData = await this.download(from);
		await this.upload({
			buffer: bufferData,
			storagePath: to,
			mimeType: "application/octet-stream",
		});
	}
}
