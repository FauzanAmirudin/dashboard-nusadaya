"use client";

import { ExternalLink, Eye, FileText, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { API_URL, getToken } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";

interface FilePreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	file?: File | null;
	fileUrl?: string | null;
	title?: string;
}

export function FilePreviewDialog({
	open,
	onOpenChange,
	file,
	fileUrl,
	title,
}: FilePreviewDialogProps) {
	const [blobUrl, setBlobUrl] = useState<string | null>(null);

	useEffect(() => {
		if (file) {
			const objUrl = URL.createObjectURL(file);
			setBlobUrl(objUrl);
			return () => {
				URL.revokeObjectURL(objUrl);
				setBlobUrl(null);
			};
		}
		setBlobUrl(null);
	}, [file]);

	// Resolusi URL final untuk preview
	const token = getToken();
	let resolvedUrl = blobUrl
		? blobUrl
		: fileUrl
			? fileUrl.startsWith("http") || fileUrl.startsWith("blob:")
				? fileUrl
				: `${API_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`
			: null;

	if (
		resolvedUrl &&
		token &&
		!resolvedUrl.startsWith("blob:") &&
		!resolvedUrl.includes("token=")
	) {
		const sep = resolvedUrl.includes("?") ? "&" : "?";
		resolvedUrl += `${sep}token=${token}`;
	}

	const fileName =
		file?.name || (fileUrl ? fileUrl.split("/").pop()?.split("?")[0] : "");

	const isPdf =
		(file?.type && file.type === "application/pdf") ||
		(fileName && fileName.toLowerCase().endsWith(".pdf")) ||
		(resolvedUrl && resolvedUrl.toLowerCase().includes(".pdf"));

	const isImage =
		(file?.type && file.type.startsWith("image/")) ||
		(fileName && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName)) ||
		(resolvedUrl && /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(resolvedUrl));

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl bg-white z-[60]">
				<DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 shrink-0 bg-white pr-14 flex flex-row items-center justify-between">
					<div className="min-w-0 pr-4">
						<DialogTitle className="flex items-center gap-2 text-slate-900 text-base font-bold">
							<Eye className="w-5 h-5 text-[#0517B0] shrink-0" />
							<span className="truncate">
								{title || fileName || "Pratinjau Bukti Bayar"}
							</span>
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500 truncate mt-0.5">
							{fileName
								? `Berkas: ${fileName}`
								: "Pratinjau dokumen bukti pembayaran"}
						</DialogDescription>
					</div>

					{resolvedUrl && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								openDocumentReview(
									"preview",
									fileUrl || resolvedUrl,
									title || fileName,
									"preview",
								)
							}
							className="h-8 text-xs font-semibold gap-1.5 shrink-0 border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs mr-2 sm:mr-3"
						>
							<ExternalLink className="w-3.5 h-3.5" />
							<span className="hidden sm:inline">Buka di Tab Baru</span>
						</Button>
					)}
				</DialogHeader>

				<div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/70 flex items-center justify-center min-h-[350px]">
					{!resolvedUrl ? (
						<div className="text-center p-8 text-slate-400">
							<FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
							<p className="text-xs font-medium">
								Tidak ada berkas yang dapat ditampilkan
							</p>
						</div>
					) : isPdf ? (
						<iframe
							src={resolvedUrl}
							title="Pratinjau Berkas PDF"
							className="w-full h-[65vh] rounded-xl border border-slate-300 bg-white shadow-xs"
						/>
					) : isImage ? (
						<div className="max-h-[65vh] overflow-auto flex items-center justify-center p-2">
							<img
								src={resolvedUrl}
								alt="Pratinjau Bukti Pembayaran"
								className="max-h-[62vh] max-w-full object-contain rounded-xl border border-slate-300 bg-white shadow-md"
							/>
						</div>
					) : (
						<div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 max-w-md mx-auto">
							<FileText className="w-12 h-12 text-slate-400 mx-auto" />
							<div>
								<p className="text-sm font-bold text-slate-800">
									{fileName || "Dokumen Lampiran"}
								</p>
								<p className="text-xs text-slate-500 mt-1">
									Format file ini tidak mendukung pratinjau langsung di dalam
									browser. Silakan buka melalui tab baru.
								</p>
							</div>
							<Button
								type="button"
								size="sm"
								onClick={() =>
									openDocumentReview(
										"preview",
										fileUrl || resolvedUrl,
										title || fileName,
										"preview",
									)
								}
								className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 cursor-pointer shadow-2xs"
							>
								<ExternalLink className="w-3.5 h-3.5" />
								Buka / Unduh Berkas
							</Button>
						</div>
					)}
				</div>

				<DialogFooter className="m-0 p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 flex flex-row items-center justify-end">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						className="text-xs h-9 px-4 rounded-xl border-slate-200 hover:bg-slate-100 cursor-pointer"
					>
						Tutup
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
