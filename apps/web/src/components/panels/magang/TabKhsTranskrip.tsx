"use client";

import { jsPDF } from "jspdf";
import {
	Award,
	BookOpen,
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	ExternalLink,
	FileCheck,
	FileText,
	GraduationCap,
	Info,
	Loader2,
	Printer,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { API_URL, getToken } from "@/lib/eden";

interface CourseGradeItem {
	courseId: number;
	code: string;
	name: string;
	sks: number;
	type: "teori" | "praktik";
	finalScore: number;
	grade: string;
	status: string;
	isPassed: boolean;
}

interface AcademicSummaryData {
	studentId: number;
	nim: string;
	name: string;
	gpaDisplay: string;
	totalSksTaken: number;
	totalSksPassed: number;
	allUtsPassed: boolean;
	allUasPassed: boolean;
	grades: CourseGradeItem[];
}

interface TabKhsTranskripProps {
	studentId: number;
	data: Record<string, unknown> | null;
	canEdit: boolean;
	fetchInternshipData: () => Promise<void>;
}

export function TabKhsTranskrip({
	studentId,
	data,
	canEdit,
	fetchInternshipData,
}: TabKhsTranskripProps) {
	const [academicSummary, setAcademicSummary] =
		useState<AcademicSummaryData | null>(null);
	const [isLoadingAcademic, setIsLoadingAcademic] = useState(false);
	const [isSyncingAcademic, setIsSyncingAcademic] = useState(false);
	const [isExportingKhsPdf, setIsExportingKhsPdf] = useState(false);
	const [isExportingTranskripPdf, setIsExportingTranskripPdf] = useState(false);

	const fetchAcademicData = async () => {
		setIsLoadingAcademic(true);
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/academic/khs`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success && json.data) {
					setAcademicSummary(json.data as AcademicSummaryData);
				}
			}
		} catch (err) {
			console.error("Gagal memuat rekap nilai akademik KHS:", err);
		} finally {
			setIsLoadingAcademic(false);
		}
	};

	useEffect(() => {
		fetchAcademicData();
	}, [studentId]);

	const handleSyncFromAcademic = async () => {
		setIsSyncingAcademic(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/academic/sync-to-magang`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			const json = await res.json();
			if (json.success) {
				toast.success(
					"KHS & Transkrip berhasil disinkronkan secara real-time dari BAAK Akademik!",
				);
				await fetchInternshipData();
				await fetchAcademicData();
			} else {
				toast.error(json.message || "Gagal sinkronisasi data akademik");
			}
		} catch (err: unknown) {
			const errMsg =
				err instanceof Error ? err.message : "Gagal terhubung ke server";
			toast.error(errMsg);
		} finally {
			setIsSyncingAcademic(false);
		}
	};

	// Handler Unduh Dokumen KHS PDF Langsung
	const handleDownloadKhsPdf = async () => {
		if (
			!academicSummary ||
			!academicSummary.grades ||
			academicSummary.grades.length === 0
		) {
			toast.error("Belum ada data nilai KHS yang dapat diunduh");
			return;
		}

		setIsExportingKhsPdf(true);
		const toastId = toast.loading("Membuat dokumen KHS PDF resmi...");

		try {
			const doc = new jsPDF({
				orientation: "p",
				unit: "mm",
				format: "a4",
			});

			const studentName = academicSummary.name || "Mahasiswa";
			const nim = academicSummary.nim || studentId.toString();

			// Header Kop Surat
			doc.setFontSize(16);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(5, 23, 176); // #0517B0
			doc.text("NUSADAYA ACADEMY", 105, 18, { align: "center" });

			doc.setFontSize(8.5);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(71, 85, 105);
			doc.text(
				"Kampus Utama: Jl. ZA. Pagar Alam No. 12, Bandar Lampung | Telp: (0721) 701234",
				105,
				24,
				{ align: "center" },
			);
			doc.text(
				"Penyelenggara Pendidikan Vokasi & Penempatan Kerja Luar Negeri Terakreditasi",
				105,
				28,
				{ align: "center" },
			);

			doc.setDrawColor(5, 23, 176);
			doc.setLineWidth(0.6);
			doc.line(15, 31, 195, 31);
			doc.setLineWidth(0.2);
			doc.line(15, 32, 195, 32);

			// Judul Dokumen
			doc.setFontSize(13);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(15, 23, 42);
			doc.text("KARTU HASIL STUDI (KHS) MAHASISWA", 105, 40, {
				align: "center",
			});
			doc.setFontSize(8);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(100, 116, 139);
			doc.text(
				"Lampiran Dokumen Resmi Seleksi Wawancara Industri Luar Negeri (Segmen 19)",
				105,
				45,
				{ align: "center" },
			);

			// Data Mahasiswa Box
			doc.setFillColor(248, 250, 252);
			doc.roundedRect(15, 49, 180, 24, 2, 2, "F");
			doc.setDrawColor(226, 232, 240);
			doc.roundedRect(15, 49, 180, 24, 2, 2, "D");

			doc.setFontSize(8.5);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(71, 85, 105);
			doc.text("Nama Mahasiswa", 20, 56);
			doc.text("Nomor Induk (NIM)", 20, 62);
			doc.text("IPK Kumulatif", 20, 68);

			doc.setFont("helvetica", "normal");
			doc.setTextColor(15, 23, 42);
			doc.text(`: ${studentName}`, 60, 56);
			doc.text(`: ${nim}`, 60, 62);
			doc.text(`: ${academicSummary.gpaDisplay} / 4.00`, 60, 68);

			doc.setFont("helvetica", "bold");
			doc.setTextColor(71, 85, 105);
			doc.text("Total SKS Lulus", 120, 56);
			doc.text("Kelulusan Evaluasi", 120, 62);
			doc.text("Status Seleksi", 120, 68);

			doc.setFont("helvetica", "normal");
			doc.setTextColor(15, 23, 42);
			doc.text(`: ${academicSummary.totalSksPassed} SKS`, 155, 56);
			doc.text(
				`: ${academicSummary.allUtsPassed && academicSummary.allUasPassed ? "LULUS" : "PROSES"}`,
				155,
				62,
			);
			doc.text(
				`: ${Number(academicSummary.gpaDisplay) >= 2.75 ? "MEMENUHI SYARAT" : "PERLU EVALUASI"}`,
				155,
				68,
			);

			// Tabel Mata Kuliah
			let startY = 79;
			doc.setFillColor(5, 23, 176);
			doc.rect(15, startY, 180, 8, "F");

			doc.setFontSize(8);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(255, 255, 255);
			doc.text("NO", 18, startY + 5.5);
			doc.text("KODE", 28, startY + 5.5);
			doc.text("MATA KULIAH", 50, startY + 5.5);
			doc.text("SKS", 125, startY + 5.5, { align: "center" });
			doc.text("TIPE", 145, startY + 5.5, { align: "center" });
			doc.text("NILAI", 165, startY + 5.5, { align: "center" });
			doc.text("GRADE", 185, startY + 5.5, { align: "center" });

			startY += 8;
			doc.setFont("helvetica", "normal");
			doc.setTextColor(15, 23, 42);

			academicSummary.grades.forEach((item, index) => {
				const rowBg = index % 2 === 0 ? 255 : 248;
				doc.setFillColor(rowBg, rowBg, rowBg);
				doc.rect(15, startY, 180, 7, "F");
				doc.setDrawColor(241, 245, 249);
				doc.line(15, startY + 7, 195, startY + 7);

				doc.text(String(index + 1), 18, startY + 5);
				doc.text(item.code || "-", 28, startY + 5);
				doc.text((item.name || "-").substring(0, 38), 50, startY + 5);
				doc.text(String(item.sks || 0), 125, startY + 5, { align: "center" });
				doc.text((item.type || "-").toUpperCase(), 145, startY + 5, {
					align: "center",
				});
				doc.text(
					String(item.finalScore ? Math.round(item.finalScore) : "-"),
					165,
					startY + 5,
					{ align: "center" },
				);
				doc.setFont("helvetica", "bold");
				doc.text(item.grade || "-", 185, startY + 5, { align: "center" });
				doc.setFont("helvetica", "normal");

				startY += 7;
			});

			// Ringkasan Bawah
			startY += 4;
			doc.setDrawColor(203, 213, 225);
			doc.line(15, startY, 195, startY);

			startY += 6;
			doc.setFontSize(8.5);
			doc.setFont("helvetica", "bold");
			doc.text(
				`Total SKS: ${academicSummary.totalSksTaken} SKS   |   Total SKS Lulus: ${academicSummary.totalSksPassed} SKS   |   IPK Kumulatif: ${academicSummary.gpaDisplay}`,
				15,
				startY,
			);

			// Tanda Tangan & Pengesahan
			const signY = Math.max(startY + 15, 230);
			const today = new Date().toLocaleDateString("id-ID", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});

			doc.setFontSize(8);
			doc.setFont("helvetica", "normal");
			doc.text("Mengetahui,", 25, signY);
			doc.text("Pembimbing Akademik (PA)", 25, signY + 5);

			doc.text(`Bandar Lampung, ${today}`, 135, signY);
			doc.text("Wakil Direktur Bidang Akademik,", 135, signY + 5);

			// Digital Stamp Badge
			doc.setFillColor(240, 253, 244);
			doc.roundedRect(135, signY + 10, 48, 12, 1, 1, "F");
			doc.setDrawColor(187, 247, 208);
			doc.roundedRect(135, signY + 10, 48, 12, 1, 1, "D");
			doc.setFontSize(7);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(22, 101, 52);
			doc.text("TERVALIDASI RESMI SISTEM", 137, signY + 15);
			doc.setFontSize(6);
			doc.setFont("helvetica", "normal");
			doc.text("ONEDATA NUSADAYA ACADEMY", 137, signY + 19);

			doc.setTextColor(15, 23, 42);
			doc.setFontSize(8);
			doc.setFont("helvetica", "bold");
			doc.text("( Tim BAAK Nusadaya )", 25, signY + 30);
			doc.text("( Bagian Akademik & Kerjasama )", 135, signY + 30);

			const filename = `KHS_${nim}_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
			doc.save(filename);
			toast.success("Dokumen KHS PDF berhasil diunduh!", { id: toastId });
		} catch (err: unknown) {
			console.error("Gagal generate KHS PDF:", err);
			toast.error("Gagal mengunduh KHS PDF. Silakan gunakan tombol cetak A4.", {
				id: toastId,
			});
		} finally {
			setIsExportingKhsPdf(false);
		}
	};

	// Handler Unduh Dokumen Transkrip PDF Langsung
	const handleDownloadTranskripPdf = async () => {
		setIsExportingTranskripPdf(true);
		const toastId = toast.loading("Memuat dan membuat Transkrip Nilai PDF...");

		try {
			const transRes = await fetch(
				`${API_URL}/students/${studentId}/academic/transcript`,
				{
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			let transcriptData = academicSummary;
			if (transRes.ok) {
				const json = await transRes.json();
				if (json.success && json.data) {
					transcriptData = json.data;
				}
			}

			const doc = new jsPDF({
				orientation: "p",
				unit: "mm",
				format: "a4",
			});

			const studentName =
				transcriptData?.name || academicSummary?.name || "Mahasiswa";
			const nim =
				transcriptData?.nim || academicSummary?.nim || studentId.toString();
			const gradesList: CourseGradeItem[] =
				transcriptData?.grades || academicSummary?.grades || [];

			// Header Kop Surat
			doc.setFontSize(16);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(5, 23, 176);
			doc.text("NUSADAYA ACADEMY", 105, 18, { align: "center" });

			doc.setFontSize(8.5);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(71, 85, 105);
			doc.text(
				"Kampus Utama: Jl. ZA. Pagar Alam No. 12, Bandar Lampung | Telp: (0721) 701234",
				105,
				24,
				{ align: "center" },
			);
			doc.text(
				"Penyelenggara Pendidikan Vokasi & Penempatan Kerja Luar Negeri Terakreditasi",
				105,
				28,
				{ align: "center" },
			);

			doc.setDrawColor(5, 23, 176);
			doc.setLineWidth(0.6);
			doc.line(15, 31, 195, 31);
			doc.setLineWidth(0.2);
			doc.line(15, 32, 195, 32);

			// Judul Dokumen
			doc.setFontSize(13);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(15, 23, 42);
			doc.text("TRANSKRIP NILAI AKADEMIK KUMULATIF", 105, 40, {
				align: "center",
			});
			doc.setFontSize(8);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(100, 116, 139);
			doc.text(
				"Official Academic Transcript Record — Seleksi Industri & Penempatan Magang Luar Negeri",
				105,
				45,
				{ align: "center" },
			);

			// Info Box
			doc.setFillColor(248, 250, 252);
			doc.roundedRect(15, 49, 180, 24, 2, 2, "F");
			doc.setDrawColor(226, 232, 240);
			doc.roundedRect(15, 49, 180, 24, 2, 2, "D");

			doc.setFontSize(8.5);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(71, 85, 105);
			doc.text("Nama Mahasiswa", 20, 56);
			doc.text("Nomor Induk (NIM)", 20, 62);
			doc.text("Indeks Prestasi (IPK)", 20, 68);

			doc.setFont("helvetica", "normal");
			doc.setTextColor(15, 23, 42);
			doc.text(`: ${studentName}`, 60, 56);
			doc.text(`: ${nim}`, 60, 62);
			doc.text(`: ${transcriptData?.gpaDisplay || "0.00"} / 4.00`, 60, 68);

			const gpaNum = Number(transcriptData?.gpaDisplay || 0);
			let predikat = "MEMUASKAN";
			if (gpaNum >= 3.51) predikat = "DENGAN PUJIAN (CUMLAUDE)";
			else if (gpaNum >= 3.0) predikat = "SANGAT MEMUASKAN";

			doc.setFont("helvetica", "bold");
			doc.setTextColor(71, 85, 105);
			doc.text("Total SKS Lulus", 120, 56);
			doc.text("Predikat Kelulusan", 120, 62);
			doc.text("Status Kelayakan", 120, 68);

			doc.setFont("helvetica", "normal");
			doc.setTextColor(15, 23, 42);
			doc.text(`: ${transcriptData?.totalSksPassed ?? 0} SKS`, 155, 56);
			doc.text(`: ${predikat}`, 155, 62);
			doc.text(
				`: ${gpaNum >= 2.75 ? "MEMENUHI SYARAT" : "PERLU EVALUASI"}`,
				155,
				68,
			);

			// Tabel Mata Kuliah
			let startY = 79;
			doc.setFillColor(15, 23, 42);
			doc.rect(15, startY, 180, 8, "F");

			doc.setFontSize(8);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(255, 255, 255);
			doc.text("NO", 18, startY + 5.5);
			doc.text("KODE", 28, startY + 5.5);
			doc.text("MATA KULIAH", 50, startY + 5.5);
			doc.text("SKS", 130, startY + 5.5, { align: "center" });
			doc.text("NILAI AKHIR", 155, startY + 5.5, { align: "center" });
			doc.text("GRADE", 180, startY + 5.5, { align: "center" });

			startY += 8;
			doc.setFont("helvetica", "normal");
			doc.setTextColor(15, 23, 42);

			gradesList.forEach((item, index) => {
				const rowBg = index % 2 === 0 ? 255 : 248;
				doc.setFillColor(rowBg, rowBg, rowBg);
				doc.rect(15, startY, 180, 7, "F");
				doc.setDrawColor(241, 245, 249);
				doc.line(15, startY + 7, 195, startY + 7);

				doc.text(String(index + 1), 18, startY + 5);
				doc.text(item.code || "-", 28, startY + 5);
				doc.text((item.name || "-").substring(0, 42), 50, startY + 5);
				doc.text(String(item.sks || 0), 130, startY + 5, { align: "center" });
				doc.text(
					String(item.finalScore ? Math.round(item.finalScore) : "-"),
					155,
					startY + 5,
					{ align: "center" },
				);
				doc.setFont("helvetica", "bold");
				doc.text(item.grade || "-", 180, startY + 5, { align: "center" });
				doc.setFont("helvetica", "normal");

				startY += 7;
			});

			startY += 4;
			doc.setDrawColor(203, 213, 225);
			doc.line(15, startY, 195, startY);

			// Pengesahan Resmi
			const signY = Math.max(startY + 15, 230);
			const today = new Date().toLocaleDateString("id-ID", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});

			doc.setFontSize(8);
			doc.setFont("helvetica", "normal");
			doc.text("Disahkan oleh,", 25, signY);
			doc.text("Bagian Administrasi Akademik (BAAK)", 25, signY + 5);

			doc.text(`Bandar Lampung, ${today}`, 135, signY);
			doc.text("Direktur Nusadaya Academy,", 135, signY + 5);

			doc.setFillColor(240, 253, 244);
			doc.roundedRect(135, signY + 10, 48, 12, 1, 1, "F");
			doc.setDrawColor(187, 247, 208);
			doc.roundedRect(135, signY + 10, 48, 12, 1, 1, "D");
			doc.setFontSize(7);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(22, 101, 52);
			doc.text("TERVERIFIKASI RESMI", 137, signY + 15);
			doc.setFontSize(6);
			doc.setFont("helvetica", "normal");
			doc.text("AKREDITASI & VERIFIKASI KP2LN", 137, signY + 19);

			doc.setTextColor(15, 23, 42);
			doc.setFontSize(8);
			doc.setFont("helvetica", "bold");
			doc.text("( Staf BAAK & Verifikator )", 25, signY + 30);
			doc.text("( Pimpinan Institusi )", 135, signY + 30);

			const filename = `Transkrip_Akademik_${nim}_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
			doc.save(filename);
			toast.success("Dokumen Transkrip Nilai PDF berhasil diunduh!", {
				id: toastId,
			});
		} catch (err: unknown) {
			console.error("Gagal generate Transkrip PDF:", err);
			toast.error(
				"Gagal mengunduh Transkrip PDF. Silakan gunakan tombol cetak A4.",
				{ id: toastId },
			);
		} finally {
			setIsExportingTranskripPdf(false);
		}
	};

	const isKhsSynced = Boolean(data?.praPasporKhs);
	const isTranskripSynced = Boolean(data?.praPasporTranskrip);

	return (
		<div className="space-y-6">
			{/* Banner Integrasi Akademik */}
			<div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start justify-between gap-4">
				<div className="flex items-start gap-3.5">
					<div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
						<GraduationCap className="w-5 h-5" />
					</div>
					<div className="space-y-1">
						<h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
							Rekapitulasi KHS & Transkrip Nilai Akademik (Segmen 19)
						</h4>
						<p className="text-xs text-blue-800 leading-relaxed max-w-3xl">
							Panel ini dipisahkan khusus untuk mengelola rekap nilai hasil
							studi (KHS) dan transkrip kumulatif mahasiswa secara real-time
							dari modul Akademik sebagai prasyarat seleksi wawancara industri
							hotel luar negeri.
						</p>
					</div>
				</div>

				<div className="shrink-0 flex items-center gap-2">
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={handleSyncFromAcademic}
						disabled={isSyncingAcademic || !canEdit}
						className="text-xs h-9 bg-white border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold gap-1.5 shadow-xs"
					>
						{isSyncingAcademic ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<RefreshCw className="w-4 h-4" />
						)}
						Sinkronkan dari BAAK
					</Button>
				</div>
			</div>

			{/* CARD 1: KPI RINGKASAN PRESTASI AKADEMIK & SELEKSI */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
						IPK Kumulatif Mahasiswa
					</span>
					<div className="text-2xl font-black text-blue-700 flex items-baseline gap-1">
						{academicSummary?.gpaDisplay || "0.00"}
						<span className="text-xs text-slate-400 font-normal">/ 4.00</span>
					</div>
					<p className="text-[11px] text-slate-500">
						Skala penilaian standar akademik
					</p>
				</div>

				<div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
						Total SKS Lulus
					</span>
					<div className="text-2xl font-black text-slate-800 flex items-baseline gap-1">
						{academicSummary?.totalSksPassed ?? 0}
						<span className="text-xs text-slate-400 font-normal">
							/ {academicSummary?.totalSksTaken ?? 0} SKS
						</span>
					</div>
					<p className="text-[11px] text-slate-500">
						Beban SKS yang telah tuntas
					</p>
				</div>

				<div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
						Kelulusan Evaluasi Ujian
					</span>
					<div className="pt-1">
						{academicSummary?.allUtsPassed && academicSummary?.allUasPassed ? (
							<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs font-bold gap-1">
								<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Lulus
								UTS & UAS
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-amber-700 border-amber-300 text-xs font-semibold gap-1"
							>
								<Clock className="w-3.5 h-3.5 text-amber-500" /> Perlu Remedial
							</Badge>
						)}
					</div>
					<p className="text-[11px] text-slate-500 mt-1">
						Status evaluasi semester berjalan
					</p>
				</div>

				<div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
						Syarat Wawancara Industri
					</span>
					<div className="pt-1">
						{Number(academicSummary?.gpaDisplay || 0) >= 2.75 ? (
							<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs font-bold gap-1">
								<Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Memenuhi
								Kriteria
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-amber-700 border-amber-300 text-xs font-semibold"
							>
								Evaluasi Tambahan
							</Badge>
						)}
					</div>
					<p className="text-[11px] text-slate-500 mt-1">
						Standar minimum IPK $\ge 2.75$
					</p>
				</div>
			</div>

			{/* CARD 2: TABEL NILAI MATKUL REAL-TIME & KONTROL DOWNLOAD */}
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-[#0517B0]" />
							Rincian Mata Kuliah & Komponen Nilai Akhir
						</CardTitle>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Daftar mata kuliah yang ditempuh mahasiswa beserta bobot SKS dan
							nilai resmi
						</p>
					</div>

					{/* KONTROL DOWNLOAD PDF & PRINT PREVIEW LENGKAP */}
					<div className="flex flex-wrap items-center gap-2">
						{/* Unduh KHS PDF Langsung */}
						<Button
							type="button"
							size="sm"
							onClick={handleDownloadKhsPdf}
							disabled={isExportingKhsPdf || isLoadingAcademic}
							className="text-xs h-8 bg-[#0517B0] hover:bg-blue-800 text-white font-bold gap-1.5 shadow-xs"
						>
							{isExportingKhsPdf ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Download className="w-3.5 h-3.5" />
							)}
							Unduh KHS PDF
						</Button>

						{/* Unduh Transkrip PDF Langsung */}
						<Button
							type="button"
							size="sm"
							onClick={handleDownloadTranskripPdf}
							disabled={isExportingTranskripPdf || isLoadingAcademic}
							className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs"
						>
							{isExportingTranskripPdf ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Download className="w-3.5 h-3.5" />
							)}
							Unduh Transkrip PDF
						</Button>

						{/* Buka Cetak KHS Format A4 */}
						<a
							href={`/dashboard/students/${studentId}/khs`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
							title="Buka Lembar Cetak KHS Format A4 Resmi"
						>
							<Printer className="w-3.5 h-3.5 text-blue-600" />
							Cetak KHS (A4)
						</a>

						{/* Buka Cetak Transkrip Format A4 */}
						<a
							href={`/dashboard/students/${studentId}/transkrip`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
							title="Buka Lembar Cetak Transkrip Format A4 Resmi"
						>
							<Printer className="w-3.5 h-3.5 text-emerald-600" />
							Cetak Transkrip (A4)
						</a>
					</div>
				</CardHeader>

				<CardContent className="p-4 sm:p-5 space-y-4">
					{isLoadingAcademic ? (
						<div className="p-12 flex flex-col items-center justify-center gap-2.5 text-slate-500 text-xs">
							<Loader2 className="w-6 h-6 animate-spin text-[#0517B0]" />
							<span>
								Menghubungi BAAK Akademik untuk memuat nilai mahasiswa...
							</span>
						</div>
					) : academicSummary &&
						academicSummary.grades &&
						academicSummary.grades.length > 0 ? (
						<div className="border border-slate-200 rounded-xl overflow-hidden">
							<table className="w-full text-xs text-left">
								<thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
									<tr>
										<th className="px-3.5 py-2.5">Kode</th>
										<th className="px-3.5 py-2.5">Nama Mata Kuliah</th>
										<th className="px-3.5 py-2.5 text-center">SKS</th>
										<th className="px-3.5 py-2.5 text-center">Tipe</th>
										<th className="px-3.5 py-2.5 text-center">Nilai Angka</th>
										<th className="px-3.5 py-2.5 text-center">Grade</th>
										<th className="px-3.5 py-2.5 text-center">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{academicSummary.grades.map((g) => (
										<tr
											key={g.courseId}
											className="hover:bg-slate-50/80 transition-colors"
										>
											<td className="px-3.5 py-2 font-mono text-[11px] font-semibold text-slate-600">
												{g.code}
											</td>
											<td className="px-3.5 py-2 font-medium text-slate-800">
												{g.name}
											</td>
											<td className="px-3.5 py-2 text-center font-bold text-slate-700">
												{g.sks}
											</td>
											<td className="px-3.5 py-2 text-center">
												<span
													className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
														g.type === "praktik"
															? "bg-amber-50 text-amber-700 border border-amber-200"
															: "bg-blue-50 text-blue-700 border border-blue-200"
													}`}
												>
													{g.type.toUpperCase()}
												</span>
											</td>
											<td className="px-3.5 py-2 text-center font-mono text-slate-700">
												{g.finalScore ? Math.round(g.finalScore) : "-"}
											</td>
											<td className="px-3.5 py-2 text-center font-black text-slate-900 text-sm">
												{g.grade || "-"}
											</td>
											<td className="px-3.5 py-2 text-center">
												{g.isPassed ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-2 py-0.5 font-bold">
														✓ Lulus
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="text-amber-700 border-amber-200 text-[9px] px-2 py-0.5 font-semibold"
													>
														Proses
													</Badge>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
							<p className="text-xs text-slate-600">
								Belum ada rincian nilai KHS tersimpan pada sistem BAAK Akademik
								untuk mahasiswa ini.
							</p>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={handleSyncFromAcademic}
								disabled={isSyncingAcademic || !canEdit}
								className="text-xs h-8 text-blue-700 border-blue-300 font-semibold"
							>
								Sinkronkan Nilai Sekarang
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* CARD 3: ARSIP BERKAS KHS & TRANSKRIP TERLEGALISIR */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Slot KHS */}
				<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-start gap-2.5">
							<FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
							<div>
								<h5 className="text-xs font-bold text-slate-800">
									Arsip Dokumen KHS (Kartu Hasil Studi)
								</h5>
								<p className="text-[11px] text-slate-500 mt-0.5">
									Hasil cetak KHS resmi atau scan berkas legalisir per semester
								</p>
							</div>
						</div>
						{isKhsSynced ? (
							<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
								✓ Terverifikasi
							</Badge>
						) : (
							<Badge variant="outline" className="text-slate-400 text-[10px]">
								Menunggu
							</Badge>
						)}
					</div>
					<div className="pt-2 border-t border-slate-100">
						<DocumentUpload
							studentId={studentId}
							panel="magang"
							documentKey="khs"
							canEdit={canEdit}
							onUploadSuccess={fetchInternshipData}
						/>
					</div>
				</div>

				{/* Slot Transkrip */}
				<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-start gap-2.5">
							<Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
							<div>
								<h5 className="text-xs font-bold text-slate-800">
									Arsip Dokumen Transkrip Akademik Kumulatif
								</h5>
								<p className="text-[11px] text-slate-500 mt-0.5">
									Transkrip nilai keseluruhan masa studi resmi terlegalisir
								</p>
							</div>
						</div>
						{isTranskripSynced ? (
							<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
								✓ Terverifikasi
							</Badge>
						) : (
							<Badge variant="outline" className="text-slate-400 text-[10px]">
								Menunggu
							</Badge>
						)}
					</div>
					<div className="pt-2 border-t border-slate-100">
						<DocumentUpload
							studentId={studentId}
							panel="magang"
							documentKey="transkrip"
							canEdit={canEdit}
							onUploadSuccess={fetchInternshipData}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
