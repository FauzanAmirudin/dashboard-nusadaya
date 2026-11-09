"use client";

import { jsPDF } from "jspdf";
import {
	AlertCircle,
	Award,
	BookOpen,
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	ExternalLink,
	FileText,
	GraduationCap,
	Info,
	Loader2,
	Printer,
	RefreshCw,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_URL, getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";

interface CourseGradeItem {
	courseId: number;
	code: string;
	name: string;
	sks: number;
	type: "teori" | "praktik";
	dosenName?: string;
	attendancePresent: number;
	totalMeetings: number;
	attendanceRate: number;
	theoryScore: number | null;
	practicalScore: number | null;
	utsScore: number | null;
	uasScore: number | null;
	finalScore: number;
	grade: string;
	gradePoint: number;
	qualityScore: number;
	status: string;
	isPassed: boolean;
	isCustomEnrollment?: boolean;
	enrollmentNotes?: string | null;
}

interface AcademicSummaryData {
	studentId: number;
	nim: string;
	name: string;
	studentName?: string;
	cohort: number;
	semester: number;
	gpaDisplay: string;
	totalCourses: number;
	totalSksTaken: number;
	totalSksPassed: number;
	allUtsPassed: boolean;
	allUasPassed: boolean;
	utsStatus: string;
	uasStatus: string;
	evaluatedUtsCount: number;
	evaluatedUasCount: number;
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
	const [selectedSemester, setSelectedSemester] = useState<number>(1);
	const [summaryData, setSummaryData] = useState<AcademicSummaryData | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncingAcademic, setIsSyncingAcademic] = useState(false);
	const [isExportingKhsPdf, setIsExportingKhsPdf] = useState(false);
	const [isExportingTranskripPdf, setIsExportingTranskripPdf] = useState(false);

	const fetchKhsData = useCallback(
		async (isSilent = false) => {
			if (!isSilent) setIsLoading(true);
			try {
				const res = await fetch(
					`${API_URL}/students/${studentId}/academic/khs?semester=${selectedSemester}&_t=${Date.now()}`,
					{
						headers: {
							Authorization: `Bearer ${getToken()}`,
							"Cache-Control": "no-cache",
							Pragma: "no-cache",
						},
						cache: "no-store",
					},
				);
				const json = await res.json();
				if (json.success && json.data) {
					setSummaryData(json.data as AcademicSummaryData);
				}
			} catch (err) {
				console.error("Gagal memuat KHS:", err);
				if (!isSilent) toast.error("Gagal mengambil data KHS mahasiswa");
			} finally {
				if (!isSilent) setIsLoading(false);
			}
		},
		[studentId, selectedSemester],
	);

	useEffect(() => {
		fetchKhsData();

		// Realtime cross-panel listener identik dengan Panel Akademik
		const handleSync = (e: Event) => {
			const customEvent = e as CustomEvent<{
				studentId?: number;
				studentIds?: number[];
			}>;
			const targetId = customEvent.detail?.studentId;
			const targetIds = customEvent.detail?.studentIds;
			if (
				(!targetId && !targetIds) ||
				targetId === studentId ||
				(Array.isArray(targetIds) && targetIds.includes(studentId))
			) {
				fetchKhsData(true);
			}
		};

		window.addEventListener("academic-data-updated", handleSync);
		window.addEventListener("student-updated", handleSync);
		window.addEventListener("course-updated", handleSync);
		window.addEventListener("course-attendance-updated", handleSync);

		let bc: BroadcastChannel | null = null;
		try {
			bc = new BroadcastChannel("dashboard-realtime-sync");
			bc.onmessage = (msg) => {
				const type = msg.data?.type;
				const targetStudentId = msg.data?.studentId;
				const targetStudentIds = msg.data?.studentIds;
				if (
					type === "academic-data-updated" ||
					type === "student-updated" ||
					type === "course-updated" ||
					type === "course-attendance-updated"
				) {
					if (
						(!targetStudentId && !targetStudentIds) ||
						targetStudentId === studentId ||
						(Array.isArray(targetStudentIds) &&
							targetStudentIds.includes(studentId))
					) {
						fetchKhsData(true);
					}
				}
			};
		} catch {}

		const handleFocus = () => {
			if (document.visibilityState === "visible") {
				fetchKhsData(true);
			}
		};
		document.addEventListener("visibilitychange", handleFocus);
		window.addEventListener("focus", handleFocus);

		return () => {
			window.removeEventListener("academic-data-updated", handleSync);
			window.removeEventListener("student-updated", handleSync);
			window.removeEventListener("course-updated", handleSync);
			window.removeEventListener("course-attendance-updated", handleSync);
			document.removeEventListener("visibilitychange", handleFocus);
			window.removeEventListener("focus", handleFocus);
			if (bc) bc.close();
		};
	}, [fetchKhsData, studentId]);

	// Sinkronisasi data ke Magang secara atomik
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
				await fetchKhsData(false);
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

	// Export KHS CSV konsisten dengan Panel Akademik
	const handleExportKhsCsv = () => {
		const gradesList = summaryData?.grades || [];
		if (!gradesList || gradesList.length === 0) {
			toast.error("Tidak ada data nilai untuk diexport");
			return;
		}

		const exportRows = gradesList.map((item, idx) => ({
			No: idx + 1,
			"Kode MK": item.code || "-",
			"Mata Kuliah": item.name || "-",
			SKS: item.sks || 0,
			"Presensi (%)": `${item.attendanceRate || 0}%`,
			"Nilai Teori":
				item.theoryScore !== null && item.theoryScore !== undefined
					? item.theoryScore
					: "-",
			"Nilai Praktik":
				item.practicalScore !== null && item.practicalScore !== undefined
					? item.practicalScore
					: "-",
			UTS:
				item.utsScore !== null && item.utsScore !== undefined
					? item.utsScore
					: "-",
			UAS:
				item.uasScore !== null && item.uasScore !== undefined
					? item.uasScore
					: "-",
			"Nilai Akhir": item.finalScore ?? "-",
			Grade: item.grade || "-",
			Bobot: ((item.gradePoint || 0) / 100).toFixed(2),
			Mutu: item.qualityScore?.toFixed(2) || "0.00",
			Status: item.isPassed ? "Lulus" : "Tidak Lulus",
		}));

		const studentNameSlug = (
			summaryData?.studentName ||
			summaryData?.name ||
			`Mahasiswa_${studentId}`
		).replace(/[^a-zA-Z0-9]/g, "_");

		exportToCSV(
			exportRows,
			`KHS_${studentNameSlug}_Semester_${selectedSemester}`,
		);
		toast.success("Data KHS semester berhasil diexport ke CSV");
	};

	// Unduh Dokumen KHS PDF Langsung Berstandar A4 Nusadaya
	const handleDownloadKhsPdf = async () => {
		const gradesList = summaryData?.grades || [];
		if (!summaryData || gradesList.length === 0) {
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

			const studentName = summaryData.name || "Mahasiswa";
			const nim = summaryData.nim || studentId.toString();

			// Header Kop Surat Nusadaya
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
			doc.text("KARTU HASIL STUDI (KHS) MAHASISWA", 105, 40, {
				align: "center",
			});
			doc.setFontSize(8);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(100, 116, 139);
			doc.text(
				`Semester ${selectedSemester} • Lampiran Resmi Dokumen Seleksi Wawancara Industri (Segmen 19)`,
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
			doc.text(`: ${summaryData.gpaDisplay} / 4.00`, 60, 68);

			doc.setFont("helvetica", "bold");
			doc.setTextColor(71, 85, 105);
			doc.text("Total SKS Lulus", 120, 56);
			doc.text("Kelulusan Evaluasi", 120, 62);
			doc.text("Status Seleksi", 120, 68);

			doc.setFont("helvetica", "normal");
			doc.setTextColor(15, 23, 42);
			doc.text(`: ${summaryData.totalSksPassed} SKS`, 155, 56);
			doc.text(
				`: ${summaryData.allUtsPassed && summaryData.allUasPassed ? "LULUS" : "PROSES"}`,
				155,
				62,
			);
			doc.text(
				`: ${Number(summaryData.gpaDisplay) >= 2.75 ? "MEMENUHI SYARAT" : "PERLU EVALUASI"}`,
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

			gradesList.forEach((item, index) => {
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
				`Total SKS: ${summaryData.totalSksTaken} SKS   |   Total SKS Lulus: ${summaryData.totalSksPassed} SKS   |   IPK Kumulatif: ${summaryData.gpaDisplay}`,
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

			const filename = `KHS_${nim}_Semester_${selectedSemester}.pdf`;
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

	// Unduh Dokumen Transkrip Nilai Kumulatif PDF
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
			let transcriptData = summaryData;
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
				transcriptData?.name || summaryData?.name || "Mahasiswa";
			const nim =
				transcriptData?.nim || summaryData?.nim || studentId.toString();
			const gradesList: CourseGradeItem[] =
				transcriptData?.grades || summaryData?.grades || [];

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

			const filename = `Transkrip_Akademik_${nim}.pdf`;
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

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-xl border border-slate-200">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-xs text-slate-500 font-medium">
					Memuat rincian nilai perkuliahan & KHS mahasiswa...
				</p>
			</div>
		);
	}

	const grades = summaryData?.grades || [];
	const gpaDisplay = summaryData?.gpaDisplay || "0.00";
	const gpaNum = Number(gpaDisplay) || 0;
	const totalSksTaken = summaryData?.totalSksTaken || 0;
	const totalSksPassed = summaryData?.totalSksPassed || 0;
	const isKhsSynced = Boolean(data?.praPasporKhs);
	const isTranskripSynced = Boolean(data?.praPasporTranskrip);

	return (
		<div className="space-y-6">
			{/* Top Action Bar & Control Header (Konsisten dengan Panel Akademik) */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="p-2 bg-blue-50 text-[#0517B0] rounded-lg">
							<GraduationCap className="w-5 h-5" />
						</span>
						<div>
							<h3 className="text-base font-bold text-slate-900">
								Rekapitulasi KHS & Transkrip Akademik (Segmen 19)
							</h3>
							<p className="text-xs text-slate-500">
								Integrasi nilai BAAK untuk syarat verifikasi seleksi wawancara
								industri luar negeri
							</p>
						</div>
					</div>
				</div>

				{/* Tombol Aksi Download, Print, dan Sinkronisasi Identik */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Selector Semester */}
					<div className="flex items-center gap-1.5 mr-1">
						<span className="text-xs font-semibold text-slate-600">
							Semester:
						</span>
						<Select
							value={selectedSemester.toString()}
							onValueChange={(val) => setSelectedSemester(Number(val))}
						>
							<SelectTrigger className="w-28 h-9 text-xs bg-slate-50 border-slate-200 font-medium">
								<SelectValue placeholder="Semester" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">Semester 1</SelectItem>
								<SelectItem value="2">Semester 2</SelectItem>
								<SelectItem value="3">Semester 3</SelectItem>
								<SelectItem value="4">Semester 4</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* 1. Unduh KHS PDF Langsung */}
					<Button
						type="button"
						size="sm"
						onClick={handleDownloadKhsPdf}
						disabled={isExportingKhsPdf || grades.length === 0}
						className="h-9 text-xs gap-1.5 bg-[#0517B0] hover:bg-blue-800 text-white font-bold shadow-xs"
						title="Unduh berkas PDF resmi KHS langsung ke komputer"
					>
						{isExportingKhsPdf ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Download className="w-3.5 h-3.5" />
						)}
						Unduh KHS PDF
					</Button>

					{/* 2. Unduh Transkrip PDF Langsung */}
					<Button
						type="button"
						size="sm"
						onClick={handleDownloadTranskripPdf}
						disabled={isExportingTranskripPdf || grades.length === 0}
						className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
						title="Unduh berkas PDF Transkrip Nilai Akademik Kumulatif"
					>
						{isExportingTranskripPdf ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Download className="w-3.5 h-3.5" />
						)}
						Unduh Transkrip PDF
					</Button>

					{/* 3. Cetak KHS (A4) - Membuka Lembar Cetak Resmi */}
					<Link
						href={`/dashboard/students/${studentId}/khs?semester=${selectedSemester}`}
						target="_blank"
					>
						<Button
							variant="outline"
							size="sm"
							className="h-9 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
							title="Buka / Cetak Kartu Hasil Studi (KHS) Format Lembar A4 Resmi"
						>
							<Printer className="w-3.5 h-3.5 text-slate-600" />
							Cetak KHS (A4)
						</Button>
					</Link>

					{/* 4. Cetak Transkrip (A4) */}
					<Link
						href={`/dashboard/students/${studentId}/transkrip`}
						target="_blank"
					>
						<Button
							variant="outline"
							size="sm"
							className="h-9 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
							title="Buka / Cetak Transkrip Nilai Kumulatif Format Lembar A4 Resmi"
						>
							<Award className="w-3.5 h-3.5 text-amber-600" />
							Transkrip (A4)
						</Button>
					</Link>

					{/* 5. Export CSV */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportKhsCsv}
						disabled={grades.length === 0}
						className="h-9 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
						title="Export data nilai KHS semester ke format CSV / Excel"
					>
						<Download className="w-3.5 h-3.5 text-emerald-600" />
						Export CSV
					</Button>

					{/* 6. Tombol Sinkronkan dari BAAK */}
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={handleSyncFromAcademic}
						disabled={isSyncingAcademic || !canEdit}
						className="h-9 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold shadow-xs"
					>
						{isSyncingAcademic ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<RefreshCw className="w-3.5 h-3.5" />
						)}
						Sinkronkan BAAK
					</Button>
				</div>
			</div>

			{/* KPI Performance Cards (Konsisten dengan Panel Akademik) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
				{/* IPK / GPA */}
				<div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/40 rounded-2xl border border-indigo-100 flex flex-col justify-between">
					<p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
						IPK Kumulatif
					</p>
					<div className="my-2">
						<span className="text-3xl font-black text-indigo-950 font-mono">
							{gpaDisplay}
						</span>
						<span className="text-xs text-indigo-600 font-semibold ml-1">
							/ 4.00
						</span>
					</div>
					<Progress
						value={(gpaNum / 4) * 100}
						className="h-1.5 bg-indigo-200/50 rounded-full"
					/>
				</div>

				{/* SKS Lulus */}
				<div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-col justify-between">
					<p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
						SKS Lulus
					</p>
					<div className="my-2">
						<span className="text-3xl font-black text-emerald-950 font-mono">
							{totalSksPassed}
						</span>
						<span className="text-xs text-emerald-700 font-semibold ml-1">
							/ {totalSksTaken} SKS
						</span>
					</div>
					<p className="text-[11px] text-emerald-700 font-medium">
						{totalSksPassed === totalSksTaken && totalSksTaken > 0
							? "100% SKS Terpenuhi"
							: `${totalSksTaken - totalSksPassed} SKS Belum Lulus`}
					</p>
				</div>

				{/* Status UTS & UAS */}
				<div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex flex-col justify-between">
					<p className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
						Evaluasi UTS & UAS
					</p>
					<div className="my-1.5 space-y-1">
						<div className="flex items-center justify-between text-xs font-semibold">
							<span className="text-slate-600">UTS:</span>
							{summaryData?.utsStatus === "BELUM_ADA_NILAI" ||
							summaryData?.evaluatedUtsCount === 0 ? (
								<Badge
									variant="outline"
									className="bg-white text-slate-500 border-slate-200 text-[10px] py-0 font-medium"
								>
									Belum Ada Nilai
								</Badge>
							) : summaryData?.allUtsPassed ? (
								<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] py-0">
									Lulus
								</Badge>
							) : (
								<Badge className="bg-rose-100 text-rose-800 border-0 text-[10px] py-0">
									Remedial
								</Badge>
							)}
						</div>
						<div className="flex items-center justify-between text-xs font-semibold">
							<span className="text-slate-600">UAS:</span>
							{summaryData?.uasStatus === "BELUM_ADA_NILAI" ||
							summaryData?.evaluatedUasCount === 0 ? (
								<Badge
									variant="outline"
									className="bg-white text-slate-500 border-slate-200 text-[10px] py-0 font-medium"
								>
									Belum Ada Nilai
								</Badge>
							) : summaryData?.allUasPassed ? (
								<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] py-0">
									Lulus
								</Badge>
							) : (
								<Badge className="bg-rose-100 text-rose-800 border-0 text-[10px] py-0">
									Remedial
								</Badge>
							)}
						</div>
					</div>
					<p className="text-[10px] text-sky-700 italic">Standar Min. 60</p>
				</div>

				{/* Standar Kelayakan Magang Industri */}
				<div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 flex flex-col justify-between">
					<p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
						Kriteria Seleksi Magang
					</p>
					<div className="my-2">
						{gpaNum >= 2.75 ? (
							<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs font-bold gap-1">
								<Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Layak
								Wawancara
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-amber-800 border-amber-300 bg-white text-xs font-semibold"
							>
								Perlu Evaluasi Nilai
							</Badge>
						)}
					</div>
					<p className="text-[10px] text-amber-800">
						Standar kualifikasi IPK $\ge 2.75$
					</p>
				</div>
			</div>

			{/* Main Table: Rincian Gabungan Komponen Nilai per Mata Kuliah (Konsisten dengan Panel Akademik) */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-2xl">
				<CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-[#0517B0]" />
							Rincian Gabungan Komponen Nilai per Mata Kuliah
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Semester {selectedSemester} • Terdaftar {grades.length} mata
							kuliah ({totalSksTaken} Total SKS)
						</p>
					</div>

					<div className="flex items-center gap-2">
						<span className="text-xs text-slate-500 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
							Bobot: P (10-15%) | T (20-25%) | Prak (40%) | UTS (15-30%) | UAS
							(15-30%)
						</span>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{grades.length === 0 ? (
						<div className="p-10 text-center space-y-2">
							<AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
							<p className="text-sm font-semibold text-slate-700">
								Belum ada mata kuliah yang terdaftar untuk mahasiswa ini
							</p>
							<p className="text-xs text-slate-500 max-w-sm mx-auto">
								Pastikan kurikulum dan jadwal mata kuliah untuk Kohort{" "}
								{summaryData?.cohort} telah dibuka pada semester ini.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50/90 text-xs">
									<TableRow>
										<TableHead className="w-12 text-center font-bold">
											No
										</TableHead>
										<TableHead className="w-24 font-bold">Kode</TableHead>
										<TableHead className="font-bold min-w-[200px]">
											Mata Kuliah
										</TableHead>
										<TableHead className="text-center font-bold w-14">
											SKS
										</TableHead>
										<TableHead className="text-center font-bold w-20">
											Presensi
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											Teori
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											Praktik
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											UTS
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											UAS
										</TableHead>
										<TableHead className="text-center font-bold w-20 bg-blue-50/50 text-[#0517B0]">
											Nilai Akhir
										</TableHead>
										<TableHead className="text-center font-bold w-16 bg-blue-50/50 text-[#0517B0]">
											Grade
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											Bobot
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											Mutu
										</TableHead>
										<TableHead className="text-center font-bold w-24">
											Status
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{grades.map((item, idx) => {
										const isA = item.grade?.startsWith("A");
										const isB = item.grade?.startsWith("B");
										const isC = item.grade?.startsWith("C");

										return (
											<TableRow
												key={item.courseId || idx}
												className="hover:bg-slate-50/80 text-xs"
											>
												<TableCell className="text-center font-mono text-slate-500">
													{idx + 1}
												</TableCell>
												<TableCell className="font-mono font-bold text-slate-700">
													{item.code}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2 flex-wrap">
														<span className="font-semibold text-slate-900">
															{item.name}
														</span>
														{item.isCustomEnrollment && (
															<Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-1.5 py-0 font-bold">
																Peserta Tambahan
															</Badge>
														)}
													</div>
													<div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
														<span className="capitalize text-slate-600">
															{item.type}
														</span>
														<span>•</span>
														<span>{item.dosenName || "Dosen Pengampu"}</span>
														{item.enrollmentNotes && (
															<span className="italic text-slate-400">
																({item.enrollmentNotes})
															</span>
														)}
													</div>
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-slate-800">
													{item.sks}
												</TableCell>
												<TableCell className="text-center font-mono">
													<span
														className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
															item.attendanceRate >= 80
																? "text-emerald-700 bg-emerald-50"
																: "text-rose-700 bg-rose-50"
														}`}
													>
														{item.attendanceRate}%
													</span>
													<div className="text-[10px] text-slate-400 mt-0.5">
														{item.attendancePresent}/16
													</div>
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700">
													{item.theoryScore !== null &&
													item.theoryScore !== undefined
														? item.theoryScore
														: "-"}
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700">
													{item.practicalScore !== null &&
													item.practicalScore !== undefined
														? item.practicalScore
														: "-"}
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700">
													{item.utsScore !== null && item.utsScore !== undefined
														? item.utsScore
														: "-"}
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700">
													{item.uasScore !== null && item.uasScore !== undefined
														? item.uasScore
														: "-"}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-sm bg-blue-50/30 text-blue-950">
													{item.grade &&
													item.grade !== "-" &&
													item.status !== "BELUM_DINILAI"
														? item.finalScore
														: "-"}
												</TableCell>
												<TableCell className="text-center bg-blue-50/30">
													{item.grade &&
													item.grade !== "-" &&
													item.status !== "BELUM_DINILAI" ? (
														<Badge
															className={`font-black text-xs px-2 py-0.5 ${
																isA
																	? "bg-emerald-100 text-emerald-800 border-emerald-300"
																	: isB
																		? "bg-blue-100 text-blue-800 border-blue-300"
																		: isC
																			? "bg-amber-100 text-amber-800 border-amber-300"
																			: "bg-rose-100 text-rose-800 border-rose-300"
															}`}
														>
															{item.grade}
														</Badge>
													) : (
														<span className="text-slate-400 font-mono text-xs">
															-
														</span>
													)}
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700 font-semibold">
													{item.grade &&
													item.grade !== "-" &&
													item.status !== "BELUM_DINILAI"
														? ((item.gradePoint || 0) / 100).toFixed(2)
														: "-"}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-slate-900">
													{item.grade &&
													item.grade !== "-" &&
													item.status !== "BELUM_DINILAI"
														? item.qualityScore?.toFixed(2) || "0.00"
														: "-"}
												</TableCell>
												<TableCell className="text-center">
													{item.isPassed ? (
														<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] px-2 py-0.5 font-bold">
															Lulus
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-rose-600 border-rose-200 text-[10px] px-2 py-0.5"
														>
															Remedial
														</Badge>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
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
