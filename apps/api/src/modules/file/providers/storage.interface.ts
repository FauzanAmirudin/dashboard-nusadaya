// Storage Provider Interface
// Abstraksi provider storage agar bisa swap LocalProvider → S3Provider tanpa ubah kode bisnis

export interface UploadOptions {
	buffer: Buffer;
	storagePath: string; // path relatif dari base storage, e.g. "students/42/identity/01KABC.pdf"
	mimeType: string;
}

export interface UploadResult {
	storagePath: string;
	size: number;
}

export interface StorageProvider {
	upload(options: UploadOptions): Promise<UploadResult>;
	download(storagePath: string): Promise<Buffer>;
	stream(storagePath: string): Promise<ReadableStream>;
	delete(storagePath: string): Promise<void>;
	exists(storagePath: string): Promise<boolean>;
	move(from: string, to: string): Promise<void>;
	copy(from: string, to: string): Promise<void>;
	getAbsolutePath(storagePath: string): string;
}
