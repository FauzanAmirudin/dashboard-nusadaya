"use client";

import {
	Download,
	ExternalLink,
	FileDown,
	FileText,
	Loader2,
	MessageSquare,
	Printer,
	X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	StudentProgressReportSheet,
	type StudentProgressReportSheetProps,
} from "./StudentProgressReportSheet";

interface CrmReportExportModalProps extends StudentProgressReportSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	studentId: number;
}

export function CrmReportExportModal({
	open,
	onOpenChange,
	studentId,
	student,
	crm,
	summary,
	courses,
	pa,
	hafalanSessions,
	vocabLogs,
	counselingLogs,
}: CrmReportExportModalProps) {
	const [customNotes, setCustomNotes] = useState("");
	const [isExporting, setIsExporting] = useState(false);
	const printSheetRef = useRef<HTMLDivElement>(null);

	const studentName = student?.name || `Mahasiswa_${studentId}`;
	const nim = student?.nim || "";
	const studentSlug = studentName.replace(/[^a-zA-Z0-9]/g, "_");
	const filename = `Rekap_Perkembangan_${studentSlug}_${nim || studentId}.pdf`;

	const handleDownloadPdf = async () => {
		const page1El = document.getElementById("crm-report-page-1");
		const page2El = document.getElementById("crm-report-page-2");

		if (!page1El) {
			toast.error("Gagal mendeteksi lembar dokumen laporan");
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

			// Lembar 1: Presensi Perkuliahan & Data Identitas
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

			// Lembar 2: Hafalan, Kedisiplinan, Catatan CRM & Pengesahan
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
				"Gagal membuat file PDF. Silakan gunakan tombol 'Buka Halaman Cetak' untuk mencetak via browser.",
				{ id: toastId },
			);
		} finally {
			setIsExporting(false);
		}
	};

	const handleOpenStandalonePrint = () => {
		const printUrl = `/dashboard/students/${studentId}/crm/rekap-pdf${
			customNotes ? `?notes=${encodeURIComponent(customNotes)}` : ""
		}`;
		window.open(printUrl, "_blank");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[96vw] sm:max-w-4xl max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl bg-white z-[60]">
				{/* Modal Header */}
				<DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-200 shrink-0 bg-white pr-14 flex flex-row items-center justify-between">
					<div className="min-w-0 pr-4">
						<DialogTitle className="flex items-center gap-2 text-slate-900 text-base sm:text-lg font-bold">
							<FileDown className="w-5 h-5 text-[#0517B0] shrink-0" />
							<span>Ekspor Rekapitulasi Perkembangan Mahasiswa</span>
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500 truncate mt-0.5">
							Laporan resmi berkala kehadiran, hafalan, dan kedisiplinan untuk
							Orang Tua / Wali Murid:{" "}
							<span className="font-semibold text-slate-700">
								{studentName} ({nim})
							</span>
						</DialogDescription>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleOpenStandalonePrint}
							className="h-8 text-xs font-semibold gap-1.5 shrink-0 border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs hidden sm:flex"
							title="Buka tampilan cetak penuh di tab baru"
						>
							<ExternalLink className="w-3.5 h-3.5 text-[#0517B0]" />
							<span>Buka Halaman Cetak</span>
						</Button>
					</div>
				</DialogHeader>

				{/* Modal Body: Controls & Interactive Preview Sheet */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/80 space-y-4">
					{/* Controls Box: Catatan Tambahan CRM untuk Wali */}
					<div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
								<MessageSquare className="w-3.5 h-3.5 text-[#0517B0]" />
								Catatan / Evaluasi Tambahan CRM untuk Orang Tua (Opsional):
							</Label>
							<span className="text-[11px] text-slate-400">
								Teks ini akan otomatis tercantum pada Bagian IV dokumen laporan
							</span>
						</div>
						<Textarea
							placeholder="Contoh: Ananda menunjukkan peningkatan pada setoran hafalan kosakata bahasa asing. Dimohon bantuan orang tua untuk terus mengingatkan kehadiran perkuliahan tepat waktu..."
							value={customNotes}
							onChange={(e) => setCustomNotes(e.target.value)}
							rows={2}
							className="text-xs bg-slate-50/50 border-slate-200 focus:bg-white resize-none"
						/>
					</div>

					{/* Label Pratinjau Kertas A4 */}
					<div className="flex items-center justify-between px-1">
						<span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
							Pratinjau Lembar Cetak Dokumen Resmi (Format Standar A4)
						</span>
						<span className="text-[11px] text-slate-400">
							Format rapi, bergaris kop formal & bebas tumpang tindih
						</span>
					</div>

					{/* A4 Paper Container with Real Sheets */}
					<div className="flex flex-col items-center gap-6 overflow-x-auto py-2">
						<StudentProgressReportSheet
							student={student}
							crm={crm}
							summary={summary}
							courses={courses}
							pa={pa}
							hafalanSessions={hafalanSessions}
							vocabLogs={vocabLogs}
							counselingLogs={counselingLogs}
							customNotes={customNotes}
						/>
					</div>
				</div>

				{/* Modal Footer: Action Buttons */}
				<DialogFooter className="m-0 p-3.5 sm:p-4 border-t border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5">
					<div className="text-[11px] text-slate-500 hidden sm:block">
						Mendukung penyimpanan langsung format PDF atau cetak printer fisik.
					</div>

					<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							className="text-xs h-9 px-4 rounded-xl border-slate-200 hover:bg-slate-100 cursor-pointer"
						>
							Tutup
						</Button>

						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleOpenStandalonePrint}
							className="text-xs h-9 px-3.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5 cursor-pointer font-semibold sm:hidden"
						>
							<ExternalLink className="w-3.5 h-3.5" />
							Cetak Tab Baru
						</Button>

						<Button
							type="button"
							size="sm"
							onClick={handleDownloadPdf}
							disabled={isExporting}
							className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-bold h-9 px-4 rounded-xl gap-2 cursor-pointer shadow-xs"
						>
							{isExporting ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									<span>Mengekspor Rekap...</span>
								</>
							) : (
								<>
									<Download className="w-3.5 h-3.5" />
									<span>Eksport Rekap</span>
								</>
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
