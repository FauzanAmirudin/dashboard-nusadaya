import { Image as ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/eden";
import { Button } from "./button";

interface UploadedPhoto {
	id: string;
	url: string;
	name: string;
}

interface MultiImageUploadProps {
	studentId: number;
	token: string;
	API_URL: string;
	onUpload: (photos: UploadedPhoto[]) => void;
	disabled?: boolean;
}

export function MultiImageUpload({
	studentId,
	token,
	API_URL,
	onUpload,
	disabled,
}: MultiImageUploadProps) {
	const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const newPhotos: UploadedPhoto[] = [];
		setIsUploading(true);

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			// Validasi ukuran (1MB)
			if (file.size > 1024 * 1024) {
				toast.error(`File ${file.name} melebihi 1MB`);
				continue;
			}
			// Validasi tipe
			if (!file.type.startsWith("image/")) {
				toast.error(`File ${file.name} bukan format gambar`);
				continue;
			}

			try {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("studentId", studentId.toString());
				formData.append("category", "monitoring");
				formData.append("panel", "crm");

				const res = await fetch(`${API_URL}/files/upload`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				});

				const data = await res.json();
				if (data.success) {
					newPhotos.push({
						id: data.data.id,
						url: `/files/${data.data.id}/download`,
						name: file.name,
					});
				} else {
					toast.error(`Gagal upload ${file.name}`);
				}
			} catch (error) {
				toast.error(`Error upload ${file.name}`);
			}
		}

		setIsUploading(false);
		if (fileInputRef.current) fileInputRef.current.value = "";

		if (newPhotos.length > 0) {
			const updated = [...photos, ...newPhotos];
			setPhotos(updated);
			onUpload(updated);
		}
	};

	const removePhoto = (id: string) => {
		const updated = photos.filter((p) => p.id !== id);
		setPhotos(updated);
		onUpload(updated);
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{photos.map((photo) => (
					<div
						key={photo.id}
						className="relative aspect-square rounded-md overflow-hidden border border-slate-200 group bg-slate-100 flex items-center justify-center"
					>
						{/* biome-ignore lint/performance/noImgElement: Native img is fine for user uploads */}
						<img
							src={`${API_URL}${photo.url}?token=${token}`}
							alt={photo.name}
							className="object-cover w-full h-full"
						/>
						{!disabled && (
							<button
								type="button"
								onClick={() => removePhoto(photo.id)}
								className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<X className="w-3 h-3" />
							</button>
						)}
					</div>
				))}

				{!disabled && (
					// biome-ignore lint/a11y/useKeyWithClickEvents: upload area
					// biome-ignore lint/a11y/noStaticElementInteractions: upload area
					<div
						onClick={() => !isUploading && fileInputRef.current?.click()}
						className={`relative aspect-square rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer ${
							isUploading ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{isUploading ? (
							<Loader2 className="w-6 h-6 animate-spin text-blue-500" />
						) : (
							<>
								<UploadCloud className="w-6 h-6 text-slate-400" />
								<span className="text-xs font-medium text-center px-2">
									Pilih Foto
									<br /> (Maks 1MB)
								</span>
							</>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							multiple
							className="hidden"
							onChange={handleFileChange}
							disabled={isUploading}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
