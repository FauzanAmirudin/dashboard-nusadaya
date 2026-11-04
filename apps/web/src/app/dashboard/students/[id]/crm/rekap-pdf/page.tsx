"use client";

import {
	ArrowLeft,
	Download,
	FileDown,
	Loader2,
	MessageSquare,
	Printer,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React, {
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { StudentProgressReportSheet } from "@/components/panels/crm/StudentProgressReportSheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { API_URL, getToken } from "@/lib/eden";

function CrmRekapPdfContent() {
	const params = useParams();
	const searchParams = useSearchParams();
	const studentId = Number(params.id);
	const initialNotes = searchParams.get("notes") || "";

	const [studentData, setStudentData] = useState<any>(null);
	const [crmData, setCrmData] = useState<any>(null);
	const [kehadiranData, setKehadiranData] = useState<any>(null);
	const [paData, setPaData] = useState<any>(null);
	const [customNotes, setCustomNotes] = useState(initialNotes);
	const [isLoading, setIsLoading] = useState(true);
	const [isExporting, setIsExporting] = useState(false);

	const reportSheetRef = useRef<HTMLDivElement>(null);

	const fetchAllData = useCallback(async () => {
		setIsLoading(true);
		try {
			const token = getToken();
			const headers = {
				Authorization: `Bearer ${token}`,
				"Cache-Control": "no-cache",
			};

			const [studentRes, crmRes, kehadiranRes, paRes] = await Promise.all([
				fetch(`${API_URL}/students/${studentId}`, { headers }).then((r) =>
					r.ok ? r.json() : null,
				),
				fetch(`${API_URL}/students/${studentId}/crm`, { headers }).then((r) =>
					r.ok ? r.json() : null,
				),
				fetch(`${API_URL}/students/${studentId}/crm/kehadiran`, {
					headers,
				}).then((r) => (r.ok ? r.json() : null)),
				fetch(`${API_URL}/students/${studentId}/pa`, { headers }).then((r) =>
					r.ok ? r.json() : null,
				),
			]);

			if (studentRes?.success && studentRes.data) {
				setStudentData(studentRes.data.student || studentRes.data);
			}
			if (crmRes?.success && crmRes.data) {
				setCrmData(crmRes.data.crm || crmRes.data);
			}
			if (kehadiranRes?.success && kehadiranRes.data) {
				setKehadiranData(kehadiranRes.data);
			}
			if (paRes?.success && paRes.data) {
				setPaData(paRes.data);
			}
		} catch (error) {
			console.error("Failed to load CRM rekap PDF data:", error);
			toast.error("Gagal memuat data laporan mahasiswa");
		} finally {
			setIsLoading(false);
		}
	}, [studentId]);

	useEffect(() => {
		if (studentId) {
			fetchAllData();
		}
	}, [studentId, fetchAllData]);

	const studentName = studentData?.name || `Mahasiswa_${studentId}`;
	const nim = studentData?.nim || "";
	const studentSlug = studentName.replace(/[^a-zA-Z0-9]/g, "_");
	const filename = `Rekap_Perkembangan_${studentSlug}_${nim || studentId}.pdf`;

	const handleDownloadPdf = async () => {
		const page1El = document.getElementById("crm-report-page-1");
		const page2El = document.getElementById("crm-report-page-2");

		if (!page1El) {
			toast.error("Gagal mendeteksi lembar dokumen untuk di-export");
			return;
		}

		setIsExporting(true);
		const toastId = toast.loading("Memproses dan mengekspor dokumen PDF...");

		try {
			const { toPng } = await import("html-to-image");
			const { jsPDF } = await import("jspdf");

			const pdf = new jsPDF({
				orientation: "p",
				unit: "mm",
				format: "a4",
				compress: true,
			});

			const pdfWidth = 210;
			const pdfHeight = 297;

			// Render Lembar 1
			const imgPage1 = await toPng(page1El, {
				quality: 0.98,
				pixelRatio: 2,
				backgroundColor: "#ffffff",
			});
			pdf.addImage(
				imgPage1,
				"PNG",
				0,
				0,
				pdfWidth,
				pdfHeight,
				undefined,
				"FAST",
			);

			// Render Lembar 2 jika ada
			if (page2El) {
				pdf.addPage();
				const imgPage2 = await toPng(page2El, {
					quality: 0.98,
					pixelRatio: 2,
					backgroundColor: "#ffffff",
				});
				pdf.addImage(
					imgPage2,
					"PNG",
					0,
					0,
					pdfWidth,
					pdfHeight,
					undefined,
					"FAST",
				);
			}

			pdf.save(filename);
			toast.success("Dokumen PDF berhasil diunduh!", { id: toastId });
		} catch (error) {
			console.error("Failed to generate PDF", error);
			toast.error(
				"Gagal membuat file PDF. Silakan gunakan tombol Cetak Browser.",
				{
					id: toastId,
				},
			);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white text-slate-900">
			{/* Top Control Bar - Hidden in Print */}
			<div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden space-y-3">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<Link href={`/dashboard/students/${studentId}?tab=crm`}>
							<Button
								variant="outline"
								size="sm"
								className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
							>
								<ArrowLeft className="w-3.5 h-3.5" />
								Kembali ke Panel CRM
							</Button>
						</Link>
						<span className="text-xs font-bold text-slate-700 hidden sm:inline">
							Laporan Rekapitulasi Orang Tua / Wali
						</span>
					</div>

					<div className="flex items-center gap-2 justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownloadPdf}
							disabled={isLoading || isExporting}
							className="h-8 text-xs gap-1.5 text-slate-700 hover:bg-slate-50 border-slate-200 font-semibold"
							title="Eksport Rekapitulasi Mahasiswa untuk Orang Tua/Wali ke PDF"
						>
							{isExporting ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									<span>Mengekspor Rekap...</span>
								</>
							) : (
								<>
									<Download className="w-3.5 h-3.5 text-indigo-600" />
									<span>Eksport Rekap</span>
								</>
							)}
						</Button>

						<Button
							size="sm"
							onClick={() => window.print()}
							className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs gap-1.5 h-8 shadow-xs"
						>
							<Printer className="w-3.5 h-3.5" />
							Cetak / Simpan PDF
						</Button>
					</div>
				</div>

				{/* Input Catatan CRM opsional */}
				<div className="pt-2 border-t border-slate-100">
					<div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
						<MessageSquare className="w-3 h-3 text-[#0517B0]" />
						<span>Catatan Tambahan untuk Orang Tua (Opsional):</span>
					</div>
					<Textarea
						value={customNotes}
						onChange={(e) => setCustomNotes(e.target.value)}
						placeholder="Tulis pesan khusus tim CRM untuk orang tua mahasiswa..."
						rows={2}
						className="text-xs bg-slate-50 border-slate-200 focus:bg-white resize-none"
					/>
				</div>
			</div>

			{/* Main Document Paper Sheet */}
			{isLoading ? (
				<div className="max-w-4xl mx-auto bg-white p-16 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
					<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
					<p className="text-xs text-slate-500 font-medium">
						Memuat dokumen rekapitulasi resmi...
					</p>
				</div>
			) : (
				<div
					ref={reportSheetRef}
					className="printable-area max-w-4xl mx-auto flex flex-col items-center gap-8 print:p-0 print:gap-0"
				>
					<StudentProgressReportSheet
						student={studentData}
						crm={crmData}
						summary={kehadiranData?.summary}
						courses={kehadiranData?.courses}
						pa={paData?.data || paData?.pa}
						hafalanSessions={paData?.hafalanSessions || []}
						vocabLogs={paData?.vocabLogs || []}
						counselingLogs={paData?.counselingLogs || []}
						customNotes={customNotes}
					/>
				</div>
			)}
		</div>
	);
}

export default function StudentCrmRekapPdfPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-500">
					Memuat Halaman Cetak Rekapitulasi...
				</div>
			}
		>
			<CrmRekapPdfContent />
		</Suspense>
	);
}
