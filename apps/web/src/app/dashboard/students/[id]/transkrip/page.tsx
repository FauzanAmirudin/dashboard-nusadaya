"use client";

import {
	ArrowLeft,
	Award,
	CheckCircle2,
	Download,
	GraduationCap,
	Loader2,
	Printer,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_URL, getToken } from "@/lib/eden";

export default function StudentTranscriptPrintPage() {
	const params = useParams();
	const router = useRouter();

	const studentId = Number(params.id);

	const [isLoading, setIsLoading] = useState(true);
	const [summaryData, setSummaryData] = useState<any>(null);

	const fetchTranscriptData = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/academic/transcript?_t=${Date.now()}`,
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
				setSummaryData(json.data);
			} else {
				toast.error(json.message || "Gagal memuat transkrip nilai");
			}
		} catch {
			toast.error("Gagal terhubung ke server");
		} finally {
			setIsLoading(false);
		}
	}, [studentId]);

	useEffect(() => {
		if (studentId) {
			fetchTranscriptData();
		}
	}, [studentId, fetchTranscriptData]);

	const grades = summaryData?.grades || [];
	const gpaDisplay = summaryData?.gpaDisplay || "0.00";
	const gpaNum = Number(gpaDisplay) || 0;
	const totalSksTaken = summaryData?.totalSksTaken || 0;
	const totalSksPassed = summaryData?.totalSksPassed || 0;

	const todayFormatted = new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	let predikatKelulusan = "MEMUASKAN";
	if (gpaNum >= 3.51) {
		predikatKelulusan = "DENGAN PUJIAN (CUMLAUDE)";
	} else if (gpaNum >= 3.0) {
		predikatKelulusan = "SANGAT MEMUASKAN";
	}

	return (
		<div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white text-slate-900">
			{/* Aturan Cetak Scoped A4 Portrait & Paginasi Bersih */}
			<style
				dangerouslySetInnerHTML={{
					__html: `
						@page {
							size: A4 portrait;
							margin: 10mm 12mm;
						}
						@media print {
							@page {
								size: A4 portrait;
								margin: 10mm 12mm;
							}
							html, body {
								width: 210mm !important;
								height: auto !important;
								min-height: 100% !important;
								background: #ffffff !important;
								color: #000000 !important;
								-webkit-print-color-adjust: exact !important;
								print-color-adjust: exact !important;
							}
							.printable-area {
								position: relative !important;
								left: auto !important;
								top: auto !important;
								width: 100% !important;
								max-width: 100% !important;
								margin: 0 !important;
								padding: 0 !important;
								box-shadow: none !important;
								border: none !important;
								display: block !important;
								visibility: visible !important;
							}
							.printable-area * {
								visibility: visible !important;
							}
							table {
								page-break-inside: auto;
							}
							tr {
								page-break-inside: avoid;
								page-break-after: auto;
							}
							thead {
								display: table-header-group;
							}
						}
					`,
				}}
			/>

			{/* Top Control Bar - Hidden in Print */}
			<div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
				<div className="flex items-center gap-3">
					<Link
						href={`/dashboard/students/${studentId}?tab=akademik&subtab=nilai-khs`}
					>
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							Kembali ke Panel Akademik
						</Button>
					</Link>
					<div>
						<h1 className="text-sm font-bold text-slate-900">
							Pratinjau Cetak Transkrip Nilai Akademik
						</h1>
						<p className="text-[11px] text-slate-500">
							Transkrip nilai kumulatif resmi untuk persyaratan magang & Feeder
							PDDIKTI — Real-Time Live Data
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2.5">
					<Button
						variant="outline"
						size="sm"
						onClick={() => fetchTranscriptData()}
						disabled={isLoading}
						className="h-8 text-xs gap-1.5 text-slate-700 hover:bg-slate-50 border-slate-200"
						title="Muat ulang transkrip real-time dari database"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${
								isLoading ? "animate-spin text-[#0517B0]" : "text-slate-600"
							}`}
						/>
						<span className="hidden sm:inline">Perbarui</span>
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

			{/* Main Document Paper Sheet */}
			{isLoading ? (
				<div className="max-w-4xl mx-auto bg-white p-16 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
					<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
					<p className="text-xs text-slate-500 font-medium">
						Memuat transkrip nilai akademik resmi...
					</p>
				</div>
			) : (
				<div className="printable-area max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 space-y-5">
					{/* Kop Surat Lembaga Resmi Nusadaya */}
					<div className="flex items-center justify-between pb-2">
						<div className="flex items-center gap-4">
							<img
								src="/logonusadaya.png"
								alt="Logo Nusadaya Academy"
								className="h-16 w-auto object-contain shrink-0"
							/>
							<div>
								<h2 className="text-lg sm:text-xl font-black uppercase text-black font-serif leading-tight">
									NUSADAYA ACADEMY
								</h2>
								<p className="text-xs font-bold text-neutral-900 tracking-wide mt-0.5">
									Lembaga Pendidikan & Pelatihan Kerja Perhotelan & Kapal Pesiar
								</p>
								<p className="text-[10px] text-neutral-600 mt-0.5 leading-snug">
									Kampus Utama: Jl. Raya Dalung No. 88, Kuta Utara, Badung, Bali
									| Telp: (0361) 900-8888
								</p>
								<p className="text-[9.5px] text-neutral-500 leading-snug">
									Website: nusadayaacademy.sch.id | Email:
									akademik@nusadayaacademy.sch.id
								</p>
							</div>
						</div>
						<div className="text-right hidden sm:block shrink-0">
							<Badge
								variant="outline"
								className="border-slate-800 bg-neutral-100 text-slate-900 text-[10px] font-bold px-2.5 py-0.5"
							>
								TRANSKRIP RESMI
							</Badge>
							<p className="text-[10px] text-slate-500 font-mono mt-1">
								Doc: AKD-TRX/VER-2026
							</p>
						</div>
					</div>

					{/* Double-Line Separator Garis Kop Formal */}
					<div className="border-b-[2px] border-black mt-1 mb-[1.5px]" />
					<div className="border-b-[0.75px] border-black mb-4" />

					{/* Judul Dokumen */}
					<div className="text-center space-y-1">
						<h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 underline underline-offset-4">
							TRANSKRIP AKADEMIK SEMENTARA
						</h3>
						<p className="text-xs font-semibold text-[#0517B0] uppercase tracking-wider">
							OFFICIAL ACADEMIC TRANSCRIPT
						</p>
						<p className="text-[11px] font-mono text-slate-500">
							Nomor: TRX/NUSADAYA/{new Date().getFullYear()}/A
							{summaryData?.cohort || "14"}/{summaryData?.nim || studentId}
						</p>
					</div>

					{/* Identitas Mahasiswa */}
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
						<div>
							<span className="text-slate-500 block text-[11px]">
								Nama Mahasiswa:
							</span>
							<strong className="text-slate-900 font-bold">
								{summaryData?.name || "-"}
							</strong>
						</div>
						<div>
							<span className="text-slate-500 block text-[11px]">
								NIM Mahasiswa:
							</span>
							<strong className="text-slate-900 font-mono font-bold">
								{summaryData?.nim || "-"}
							</strong>
						</div>
						<div>
							<span className="text-slate-500 block text-[11px]">
								Angkatan:
							</span>
							<strong className="text-slate-900 font-bold">
								Angkatan {summaryData?.cohort || "-"}
							</strong>
						</div>
						<div>
							<span className="text-slate-500 block text-[11px]">
								Jurusan / Program:
							</span>
							<strong className="text-slate-900 font-bold">
								{summaryData?.program || "Hospitality"}
							</strong>
						</div>
						<div>
							<span className="text-slate-500 block text-[11px]">
								Total SKS Diakui:
							</span>
							<strong className="text-slate-900 font-mono font-bold">
								{totalSksPassed} SKS
							</strong>
						</div>
						<div>
							<span className="text-slate-500 block text-[11px]">
								Predikat Kelulusan:
							</span>
							<strong className="text-emerald-700 font-bold">
								{predikatKelulusan}
							</strong>
						</div>
					</div>

					{/* Tabel Transkrip Lengkap */}
					<div className="border border-slate-300 rounded-lg overflow-hidden">
						<Table className="text-xs">
							<TableHeader className="bg-slate-100 font-bold text-slate-900 border-b border-slate-300">
								<TableRow>
									<TableHead className="w-10 text-center font-bold text-slate-900">
										No
									</TableHead>
									<TableHead className="w-24 font-bold text-slate-900">
										Kode MK
									</TableHead>
									<TableHead className="font-bold text-slate-900">
										Nama Mata Kuliah
									</TableHead>
									<TableHead className="text-center w-20 font-bold text-slate-900">
										Semester
									</TableHead>
									<TableHead className="text-center w-16 font-bold text-slate-900">
										SKS (K)
									</TableHead>
									<TableHead className="text-center w-16 font-bold text-slate-900">
										Nilai (N)
									</TableHead>
									<TableHead className="text-center w-16 font-bold text-slate-900">
										Grade
									</TableHead>
									<TableHead className="text-center w-16 font-bold text-slate-900">
										Bobot (M)
									</TableHead>
									<TableHead className="text-center w-20 font-bold text-slate-900">
										K x M
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{grades.map((item: any, idx: number) => (
									<TableRow
										key={item.courseId || idx}
										className="hover:bg-transparent border-b border-slate-200"
									>
										<TableCell className="text-center font-mono py-2">
											{idx + 1}
										</TableCell>
										<TableCell className="font-mono font-bold py-2">
											{item.code}
										</TableCell>
										<TableCell className="font-medium py-2">
											{item.name}
										</TableCell>
										<TableCell className="text-center font-mono text-[11px] py-2 text-slate-600">
											Sem {item.semester || 1}
										</TableCell>
										<TableCell className="text-center font-mono font-bold py-2">
											{item.sks}
										</TableCell>
										<TableCell className="text-center font-mono font-bold py-2">
											{item.finalScore}
										</TableCell>
										<TableCell className="text-center font-bold py-2">
											<span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold border border-slate-300">
												{item.grade}
											</span>
										</TableCell>
										<TableCell className="text-center font-mono py-2">
											{((item.gradePoint || 0) / 100).toFixed(2)}
										</TableCell>
										<TableCell className="text-center font-mono font-bold py-2">
											{item.qualityScore?.toFixed(2) || "0.00"}
										</TableCell>
									</TableRow>
								))}

								<TableRow className="bg-slate-50 font-bold border-t-2 border-slate-300">
									<TableCell
										colSpan={4}
										className="text-right py-2.5 font-bold"
									>
										Total SKS Kumulatif:
									</TableCell>
									<TableCell className="text-center font-mono font-bold py-2.5">
										{totalSksTaken}
									</TableCell>
									<TableCell
										colSpan={3}
										className="text-right py-2.5 font-bold"
									>
										Total Mutu Kumulatif:
									</TableCell>
									<TableCell className="text-center font-mono font-bold py-2.5">
										{summaryData?.qualityScoreTotal?.toFixed(2) || "0.00"}
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>

					{/* Rangkuman IPK Final */}
					<div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-100 rounded-xl font-bold text-xs gap-2 print:bg-white print:border print:border-slate-300">
						<span className="text-slate-700">
							TOTAL SKS SELESAI / LULUS:{" "}
							<span className="font-mono text-emerald-800 text-sm">
								{totalSksPassed} dari {totalSksTaken} SKS
							</span>
						</span>
						<span className="text-slate-900">
							INDEKS PRESTASI KUMULATIF (IPK):{" "}
							<span className="text-base font-mono text-[#0517B0] font-black print:text-black">
								{gpaDisplay}
							</span>{" "}
							/ 4.00
						</span>
					</div>

					{/* Lembar Pengesahan Resmi */}
					<div
						className="grid grid-cols-2 gap-8 pt-8 text-xs text-center border-t border-slate-300 print:pt-6"
						style={{ pageBreakInside: "avoid" }}
					>
						<div className="space-y-16">
							<div>
								<p className="text-slate-600">Mengetahui,</p>
								<p className="font-bold text-slate-900">
									Dosen Pembimbing Akademik (PA)
								</p>
							</div>
							<div>
								<p className="font-bold underline text-slate-900 uppercase">
									{summaryData?.paName || "Dosen Pembimbing Akademik"}
								</p>
								<p className="text-[11px] text-slate-500">
									NIDN / NIP Nusadaya Academy
								</p>
							</div>
						</div>

						<div className="space-y-16">
							<div>
								<p className="text-slate-600">Denpasar, {todayFormatted}</p>
								<p className="font-bold text-slate-900">
									Kepala Bagian BAAK Akademik
								</p>
							</div>
							<div>
								<p className="font-bold underline text-slate-900 uppercase">
									Divisi Akademik Nusadaya
								</p>
								<p className="text-[11px] text-slate-500">
									Biro Administrasi Akademik & Kemahasiswaan
								</p>
							</div>
						</div>
					</div>

					{/* Footer Catatan Legalitas Dokumen */}
					<div
						className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 print:pt-2"
						style={{ pageBreakInside: "avoid" }}
					>
						<div className="flex items-center gap-1.5">
							<ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
							<span>
								Transkrip ini sah dikeluarkan oleh Nusadaya Academy untuk
								keperluan akademik, sertifikasi magang luar negeri, dan feeder
								PDDIKTI.
							</span>
						</div>
						<div className="font-mono shrink-0 text-slate-400">
							Dicetak: {new Date().toLocaleString("id-ID")}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
