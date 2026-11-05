"use client";

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

			{/* CARD 2: TABEL NILAI MATKUL REAL-TIME */}
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

					<div className="flex items-center gap-2">
						<a
							href={`${API_URL}/students/${studentId}/academic/khs/download`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs font-bold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
						>
							<Download className="w-3.5 h-3.5" /> Unduh Dokumen KHS PDF
						</a>
						<a
							href={`${API_URL}/students/${studentId}/academic/transcript`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs font-bold text-slate-700 hover:text-slate-800 inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
						>
							<Download className="w-3.5 h-3.5" /> Unduh Transkrip PDF
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
