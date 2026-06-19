"use client";

import {
	Eye,
	FileText,
	Loader2,
	Paperclip,
	Trash2,
	UploadCloud,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface DocumentUploadProps {
	studentId: number;
	panel: "pmb" | "crm" | "finance" | "akademik" | "pa" | "magang" | "dosen";
	documentKey: string;
	courseId?: number;
	canEdit: boolean;
	onUploadSuccess?: () => void;
}

export function DocumentUpload({
	studentId,
	panel,
	documentKey,
	courseId,
	canEdit,
	onUploadSuccess,
}: DocumentUploadProps) {
	const { token } = useAuthStore();
	const [isUploading, setIsUploading] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [document, setDocument] = useState<any>(null);

	const fetchDocument = async () => {
		try {
			const fetchUrl =
				panel === "dosen"
					? `${API_URL}/students/${studentId}/course-grades/${courseId}/documents`
					: `${API_URL}/students/${studentId}/${panel}/documents`;

			const res = await fetch(fetchUrl, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (res.ok) {
				const data = await res.json();
				if (data.success && data.data) {
					let doc = null;
					if (Array.isArray(data.data)) {
						// Format array (misal dari panel PA atau Magang)
						doc = data.data.find((d: any) => d.documentKey === documentKey);
					} else {
						// Format objek berdasar key (misal dari PMB, CRM, Finance)
						const docs = data.data[documentKey];
						if (docs && docs.length > 0) {
							doc = docs[0]; // Ambil dokumen pertama/terbaru
						}
					}
					setDocument(doc || null);
				}
			}
		} catch (error) {
			console.error("Failed to fetch document", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDocument();
	}, [studentId, panel, documentKey]);

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!canEdit) return;
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.type !== "application/pdf") {
			toast.error("Hanya file PDF yang diperbolehkan");
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error("Ukuran file maksimal 5MB");
			return;
		}

		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			if (panel !== "dosen") {
				formData.append("documentKey", documentKey);
			}

			const uploadUrl =
				panel === "dosen"
					? `${API_URL}/students/${studentId}/course-grades/${courseId}/upload/${documentKey}`
					: `${API_URL}/students/${studentId}/${panel}/documents`;

			const res = await fetch(uploadUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			const data = await res.json();
			if (data.success) {
				toast.success("Dokumen berhasil diunggah");
				fetchDocument();
				if (onUploadSuccess) onUploadSuccess();
			} else {
				toast.error(data.message || "Gagal mengunggah dokumen");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setIsUploading(false);
			// Reset input
			e.target.value = "";
		}
	};

	const handleDelete = async () => {
		if (!canEdit || !document) return;

		try {
			const deleteUrl =
				panel === "dosen"
					? `${API_URL}/students/${studentId}/course-grades/${courseId}/documents/${document.id}`
					: `${API_URL}/students/${studentId}/${panel}/documents/${documentKey}`;

			const res = await fetch(deleteUrl, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Dokumen dihapus");
				setDocument(null);
			} else {
				toast.error(data.message || "Gagal menghapus");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	if (isLoading) {
		return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
	}

	return (
		<div className="w-full mt-2">
			{document ? (
				<div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-md border border-slate-200 w-full">
					<div className="flex items-center gap-3 overflow-hidden">
						<div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-slate-200 shrink-0">
							<FileText className="w-4 h-4 text-[#0517B0]" />
						</div>
						<div className="min-w-0 flex flex-col items-start">
							<p className="text-sm font-medium text-slate-700 truncate max-w-[150px] sm:max-w-[200px]">
								{document.fileName}
							</p>
							<span className="text-[10px] text-slate-400">
								Diunggah{" "}
								{document.uploadedAt
									? new Date(document.uploadedAt).toLocaleDateString("id-ID")
									: "-"}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-1.5 ml-4 shrink-0">
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs font-medium text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 gap-1.5"
							title="Review Dokumen"
							onClick={() =>
								window.open(
									`/dashboard/students/${studentId}/documents/${document.id}?url=${encodeURIComponent(document.fileUrl)}&name=${encodeURIComponent(document.fileName)}`,
									"_blank",
								)
							}
						>
							<Eye className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Review</span>
						</Button>
						{canEdit && (
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="ghost"
											size="sm"
											className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
											title="Hapus Dokumen"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									}
								/>
								<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
									<AlertDialogTitle>Hapus Dokumen</AlertDialogTitle>
									<AlertDialogDescription className="text-slate-500">
										Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini
										tidak dapat dibatalkan dan file akan dihapus dari server.
									</AlertDialogDescription>
									<div className="flex justify-end gap-3 mt-4">
										<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50 text-slate-600">
											Batal
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											className="bg-rose-600 hover:bg-rose-700 text-white"
										>
											Ya, Hapus
										</AlertDialogAction>
									</div>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</div>
			) : (
				canEdit && (
					<label
						className="flex items-center justify-center gap-2 w-full h-10 rounded border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
						title="Upload PDF (Maks 5MB)"
					>
						{isUploading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								<span className="text-xs font-medium">Mengunggah...</span>
							</>
						) : (
							<>
								<UploadCloud className="w-4 h-4" />
								<span className="text-xs font-medium">Unggah Berkas PDF</span>
							</>
						)}
						<input
							type="file"
							accept="application/pdf"
							className="hidden"
							onChange={handleUpload}
							disabled={isUploading}
						/>
					</label>
				)
			)}
		</div>
	);
}
