"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function DocumentReviewPage() {
	const params = useParams();
	const router = useRouter();
	const { token } = useAuthStore();
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	
	const studentId = params.id as string;
	const docId = params.docId as string;
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	useEffect(() => {
		if (!token) return;

		const fetchDoc = async () => {
			try {
				const res = await fetch(`${API_URL}/students/${studentId}/pmb/documents/${docId}/download`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				
				if (res.ok) {
					const blob = await res.blob();
					const url = URL.createObjectURL(blob);
					setBlobUrl(url);
				} else {
					setError(true);
					toast.error("Gagal memuat dokumen");
				}
			} catch (error) {
				setError(true);
				toast.error("Terjadi kesalahan jaringan");
			} finally {
				setLoading(false);
			}
		};

		fetchDoc();

		// Cleanup
		return () => {
			if (blobUrl) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [studentId, docId, token]);

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
						<div className="w-8 h-8 rounded-md bg-[#0517B0]/10 flex items-center justify-center">
							<FileText className="w-4 h-4 text-[#0517B0]" />
						</div>
						<div>
							<h1 className="text-sm font-bold text-slate-800 leading-none">
								Review Dokumen PMB
							</h1>
							<p className="text-xs text-slate-500 mt-1">ID Dokumen: {docId}</p>
						</div>
					</div>
				</div>
				
				{blobUrl && (
					<Button 
						variant="default" 
						size="sm" 
						className="h-9 gap-2 bg-[#0517B0] hover:bg-blue-800"
						onClick={() => {
							const a = document.createElement('a');
							a.href = blobUrl;
							a.download = `Dokumen_PMB_${docId}`;
							a.click();
						}}
					>
						<Download className="w-4 h-4" />
						Unduh File
					</Button>
				)}
			</div>
			
			{/* Viewer Area */}
			<div className="flex-1 bg-slate-200 relative">
				{loading && (
					<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white">
						<Loader2 className="w-10 h-10 animate-spin text-[#0517B0] mb-4" />
						<p className="text-sm font-medium">Sedang memuat dokumen...</p>
					</div>
				)}
				
				{error && !loading && (
					<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white">
						<div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
							<span className="text-3xl font-bold">!</span>
						</div>
						<p className="font-bold text-slate-800 text-lg">Dokumen tidak dapat dimuat</p>
						<p className="text-sm mt-2 max-w-sm text-center">Pastikan file tersedia di server dan Anda memiliki hak akses yang valid.</p>
						<Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
							Coba Muat Ulang
						</Button>
					</div>
				)}
				
				{blobUrl && !loading && !error && (
					<iframe 
						src={blobUrl} 
						className="w-full h-full border-0"
						title="Document Viewer"
						style={{ backgroundColor: '#e2e8f0' }}
					/>
				)}
			</div>
		</div>
	);
}
