"use client";

import { ArrowLeft, Download, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

function DocumentReviewContent() {
	const searchParams = useSearchParams();
	const fileUrl = searchParams.get("url");
	const fileName = searchParams.get("name") || "Dokumen Tanpa Nama";
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const cleanFileUrl = fileUrl?.startsWith("./") ? fileUrl.slice(1) : fileUrl;
	const fullUrl = cleanFileUrl ? `${API_URL}${cleanFileUrl}` : "";

	return (
		<div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
			{/* Toolbar Header */}
			<div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="sm"
						className="text-slate-600 border-slate-300 hover:bg-slate-100"
						onClick={() => window.close()}
					>
						<ArrowLeft className="w-4 h-4 mr-1.5" />
						Tutup Halaman
					</Button>
					<div className="h-5 w-px bg-slate-300"></div>
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-md bg-[#0517B0]/10 flex items-center justify-center shrink-0">
							<FileText className="w-4 h-4 text-[#0517B0]" />
						</div>
						<div className="min-w-0">
							<h1 className="text-sm font-bold text-slate-800 leading-none truncate max-w-sm">
								Review Dokumen
							</h1>
							<p className="text-xs text-slate-500 mt-1 truncate max-w-sm">
								{fileName}
							</p>
						</div>
					</div>
				</div>

				{fullUrl && (
					<Button
						variant="default"
						size="sm"
						className="h-9 gap-2 bg-[#0517B0] hover:bg-blue-800 shrink-0 ml-4"
						onClick={() => {
							const a = document.createElement("a");
							a.href = fullUrl;
							a.download = fileName;
							a.target = "_blank";
							a.click();
						}}
					>
						<Download className="w-4 h-4" />
						<span className="hidden sm:inline">Unduh File</span>
					</Button>
				)}
			</div>

			{/* Viewer Area */}
			<div className="flex-1 bg-slate-200 relative">
				{fullUrl ? (
					<iframe
						src={fullUrl}
						className="w-full h-full border-0"
						title="Document Viewer"
						style={{ backgroundColor: "#e2e8f0" }}
					/>
				) : (
					<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white">
						<div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
							<span className="text-3xl font-bold">!</span>
						</div>
						<p className="font-bold text-slate-800 text-lg">
							URL Dokumen Tidak Ditemukan
						</p>
						<p className="text-sm mt-2 max-w-sm text-center">
							Tautan yang Anda tuju tidak memiliki parameter URL dokumen yang
							valid.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default function DocumentReviewPage() {
	return (
		<Suspense
			fallback={
				<div className="p-10 flex items-center justify-center">
					Memuat dokumen...
				</div>
			}
		>
			<DocumentReviewContent />
		</Suspense>
	);
}
