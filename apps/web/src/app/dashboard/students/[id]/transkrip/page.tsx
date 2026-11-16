"use client";

import { ArrowLeft, Award, Download, Loader2, Printer } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API_URL, getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";

interface CourseGradeItem {
	courseId: number;
	code: string;
	name: string;
	sks: number;
	semester?: number;
	finalScore?: number;
	grade: string;
	gradePoint?: number;
	qualityScore?: number;
	isPassed?: boolean;
}

interface TranscriptData {
	studentId: number;
	nim: string;
	name: string;
	cohort: number;
	rombel: string;
	program: string;
	subProgram?: string;
	faculty?: string;
	documentNo?: string;
	paName?: string;
	totalCourses: number;
	totalSksTaken: number;
	totalSksPassed: number;
	qualityScoreTotal: number;
	gpa: number;
	gpaDisplay: string;
	predikatKelulusan: string;
	grades: CourseGradeItem[];
}

function StudentTranscriptPrintContent() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();

	const studentId = Number(params.id);
	const from = searchParams.get("from"); // "magang" | "akademik"
	const autoPrint = searchParams.get("autoPrint") === "true";

	const [isLoading, setIsLoading] = useState(true);
	const [summaryData, setSummaryData] = useState<TranscriptData | null>(null);
	const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

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
				setSummaryData(json.data as TranscriptData);
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

	// Generate QR Code for document verification
	useEffect(() => {
		if (typeof window !== "undefined" && studentId) {
			const verificationUrl = `${window.location.origin}/dashboard/students/${studentId}/transkrip`;
			QRCode.toDataURL(verificationUrl, {
				width: 180,
				margin: 1,
				color: {
					dark: "#000000",
					light: "#ffffff",
				},
			})
				.then((url) => setQrCodeUrl(url))
				.catch((err) => console.error("Error generating QR code:", err));
		}
	}, [studentId]);

	// Auto print trigger if query requested
	useEffect(() => {
		if (!isLoading && summaryData && autoPrint) {
			const timer = setTimeout(() => {
				window.print();
			}, 600);
			return () => clearTimeout(timer);
		}
	}, [isLoading, summaryData, autoPrint]);

	// Filter hanya mata kuliah yang sudah selesai dinilai dan memiliki nilai akhir / huruf mutu resmi
	const validGrades = (summaryData?.grades || []).filter(
		(item) =>
			item.grade &&
			item.grade.trim() !== "" &&
			item.grade !== "-" &&
			item.grade.toUpperCase() !== "BELUM_DINILAI" &&
			item.grade.toUpperCase() !== "PROSES",
	);

	const gpaDisplay = summaryData?.gpaDisplay || "0.00";
	const gpaFormatted = gpaDisplay.replace(".", ",");
	const totalKredit =
		summaryData?.totalSksPassed ?? summaryData?.totalSksTaken ?? 0;

	const todayFormatted = new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	// Split courses into two parallel columns (Dual-Column Layout, matching SIAKAD Unila format)
	const mid = Math.ceil(validGrades.length / 2);
	const leftGrades = validGrades.slice(0, mid);
	const rightGrades = validGrades.slice(mid);

	const handleExportCsv = () => {
		if (!validGrades || validGrades.length === 0) {
			toast.error("Tidak ada data transkrip untuk diexport");
			return;
		}
		const exportRows = validGrades.map((item, idx) => ({
			No: idx + 1,
			Kode: item.code || "-",
			"Nama Mata Kuliah": item.name || "-",
			"Kredit (SKS)": item.sks || 0,
			"Huruf Mutu (HM)": item.grade || "-",
		}));
		const studentNameSlug = (
			summaryData?.name || `Mahasiswa_${studentId}`
		).replace(/[^a-zA-Z0-9]/g, "_");
		exportToCSV(exportRows, `Transkrip_${studentNameSlug}`);
		toast.success("Dokumen Transkrip berhasil diexport ke CSV");
	};

	const backHref =
		from === "magang"
			? `/dashboard/students/${studentId}?tab=magang&subtab=khs-transkrip&from=/dashboard/magang`
			: `/dashboard/students/${studentId}?tab=akademik&subtab=nilai-khs`;

	const backLabel =
		from === "magang" ? "Kembali ke Panel Magang" : "Kembali ke Panel Akademik";

	return (
		<div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white text-black font-sans">
			{/* Aturan Cetak Scoped A4 Portrait & Paginasi Bersih */}
			<style
				dangerouslySetInnerHTML={{
					__html: `
						@page {
							size: A4 portrait;
							margin: 8mm 10mm;
						}
						@media print {
							@page {
								size: A4 portrait;
								margin: 8mm 10mm;
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
			<div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
				<div className="flex items-center gap-3">
					<Link href={backHref}>
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							{backLabel}
						</Button>
					</Link>
				</div>

				<div className="flex items-center gap-2.5">
					<Button
						variant="outline"
						size="sm"
						onClick={handleExportCsv}
						disabled={isLoading || validGrades.length === 0}
						className="h-8 text-xs gap-1.5 text-slate-700 hover:bg-slate-50 border-slate-200 font-semibold"
						title="Export data transkrip ke format file CSV / Excel"
					>
						<Download className="w-3.5 h-3.5 text-emerald-600" />
						<span>Export CSV</span>
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
				<div className="max-w-[210mm] mx-auto bg-white p-16 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
					<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
					<p className="text-xs text-slate-500 font-medium">
						Memuat transkrip nilai akademik...
					</p>
				</div>
			) : (
				<div className="printable-area relative max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 sm:p-10 text-black shadow-lg print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0">
					{/* Watermark Logo Kampus di Latar Belakang (Identik dengan format Unila) */}
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
						<img
							src="/logonusadaya.png"
							alt="Watermark Nusadaya"
							className="w-[280px] h-[280px] object-contain opacity-[0.06] grayscale contrast-125 print:opacity-[0.07]"
						/>
					</div>

					{/* Konten Dokumen Utama */}
					<div className="relative z-10 space-y-2">
						{/* 1. Header / Kop Informasi Kampus */}
						<div className="flex items-center justify-between gap-4">
							<div className="shrink-0 w-20 flex justify-center">
								<img
									src="/logonusadaya.png"
									alt="Logo Kampus"
									className="h-16 w-auto object-contain"
								/>
							</div>
							<div className="flex-1 text-center font-serif text-black space-y-0.5">
								<h1 className="text-[11.5px] font-bold uppercase tracking-wider leading-snug">
									LEMBAGA PENDIDIKAN VOKASI DAN PELATIHAN KERJA
								</h1>
								<h2 className="text-[17px] font-black uppercase tracking-wide leading-tight text-black">
									NUSADAYA ACADEMY
								</h2>
								<p className="text-[9.5px] uppercase tracking-wide leading-tight text-neutral-800">
									JL. RAYA DALUNG NO. 88, KUTA UTARA, BADUNG, BALI
								</p>
								<p className="text-[9px] uppercase tracking-wide leading-tight text-neutral-800 font-mono">
									TELP : (0361) 900-8888, 894-8888 &nbsp;|&nbsp; WEBSITE :
									WWW.NUSADAYA.AC.ID
								</p>
							</div>
							{/* Spacer kanan penyeimbang kop agar teks tepat di tengah */}
							<div className="w-20 shrink-0 hidden sm:block" />
						</div>

						{/* Garis Pembatas Kop Surat (Solid Black Line) */}
						<div className="border-b-[2px] border-black mt-2 mb-3" />

						{/* 2. Judul Dokumen */}
						<div className="text-center my-3">
							<h3 className="text-[14px] font-serif font-black uppercase tracking-[0.25em] text-black">
								TRANSKRIP AKADEMIK
							</h3>
						</div>

						{/* 3. Keterangan Mahasiswa (2 Kolom Rapi dan Presisi) */}
						<div className="grid grid-cols-2 gap-x-8 text-[10px] text-black font-sans mb-3">
							{/* Kolom Kiri */}
							<div className="space-y-0.5">
								<div className="flex">
									<span className="w-24 shrink-0 uppercase font-semibold">
										NAMA
									</span>
									<span className="mr-1">:</span>
									<span className="font-bold uppercase tracking-tight truncate">
										{summaryData?.name || "-"}
									</span>
								</div>
								<div className="flex">
									<span className="w-24 shrink-0 uppercase font-semibold">
										NPM
									</span>
									<span className="mr-1">:</span>
									<span className="font-mono font-medium">
										{summaryData?.nim || "-"}
									</span>
								</div>
								<div className="flex">
									<span className="w-24 shrink-0 font-semibold">
										Pemb. Akad.
									</span>
									<span className="mr-1">:</span>
									<span className="truncate">
										{summaryData?.paName || "Dosen Pembimbing Akademik"}
									</span>
								</div>
								<div className="flex">
									<span className="w-24 shrink-0 uppercase font-semibold">
										IPK
									</span>
									<span className="mr-1">:</span>
									<span className="font-bold font-mono">{gpaFormatted}</span>
								</div>
							</div>

							{/* Kolom Kanan */}
							<div className="space-y-0.5">
								<div className="flex">
									<span className="w-24 shrink-0 font-semibold">Fakultas</span>
									<span className="mr-1">:</span>
									<span className="truncate">
										{summaryData?.faculty || "Pendidikan & Pelatihan Vokasi"}
									</span>
								</div>
								<div className="flex">
									<span className="w-24 shrink-0 font-semibold">Jurusan</span>
									<span className="mr-1">:</span>
									<span className="truncate">
										{summaryData?.program || "Perhotelan & Pariwisata"}
									</span>
								</div>
								<div className="flex">
									<span className="w-24 shrink-0 font-semibold">
										Prog. Studi
									</span>
									<span className="mr-1">:</span>
									<span className="truncate">
										{summaryData?.subProgram ||
											summaryData?.program ||
											"D1 Perhotelan & Kapal Pesiar"}
									</span>
								</div>
								<div className="flex">
									<span className="w-24 shrink-0 font-semibold">
										Total Kredit
									</span>
									<span className="mr-1">:</span>
									<span className="font-bold font-mono">{totalKredit}</span>
								</div>
							</div>
						</div>

						{/* 4. Tabel Mata Kuliah Dua Kolom (Side-by-Side Dual Column Table) */}
						{validGrades.length === 0 ? (
							<div className="border-t border-b border-black border-dotted py-6 text-center text-xs text-neutral-500 italic my-4">
								Belum ada mata kuliah yang diselesaikan atau memiliki nilai
								akhir resmi untuk ditampilkan dalam transkrip akademik.
							</div>
						) : (
							<div className="w-full mt-2">
								<div className="grid grid-cols-2 gap-x-4 w-full">
									{/* Sub-Tabel Kiri */}
									<div className="w-full">
										<table className="w-full border-collapse text-[9.5px] leading-tight text-black">
											<thead>
												<tr className="border-t border-b border-black border-dotted font-semibold text-black">
													<th className="py-1 px-1 text-right w-7">No</th>
													<th className="py-1 px-1 text-left w-20">Kode</th>
													<th className="py-1 px-1 text-left">Mata Kuliah</th>
													<th className="py-1 px-1 text-center w-10">Kredit</th>
													<th className="py-1 px-1 text-center w-8">HM</th>
												</tr>
											</thead>
											<tbody>
												{leftGrades.map((item, idx) => {
													const rowNo = idx + 1;
													return (
														<tr
															key={item.courseId || `left-${idx}`}
															className="align-top"
														>
															<td className="py-[1.5px] px-1 text-right font-mono">
																{rowNo}.
															</td>
															<td className="py-[1.5px] px-1 font-mono uppercase font-normal">
																{item.code || "-"}
															</td>
															<td className="py-[1.5px] px-1 font-sans">
																{item.name || "-"}
															</td>
															<td className="py-[1.5px] px-1 text-center font-mono">
																{item.sks ?? 0}
															</td>
															<td className="py-[1.5px] px-1 text-center font-mono font-medium">
																{item.grade || "-"}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>

									{/* Sub-Tabel Kanan */}
									<div className="w-full">
										<table className="w-full border-collapse text-[9.5px] leading-tight text-black">
											<thead>
												<tr className="border-t border-b border-black border-dotted font-semibold text-black">
													<th className="py-1 px-1 text-right w-7">No</th>
													<th className="py-1 px-1 text-left w-20">Kode</th>
													<th className="py-1 px-1 text-left">Mata Kuliah</th>
													<th className="py-1 px-1 text-center w-10">Kredit</th>
													<th className="py-1 px-1 text-center w-8">HM</th>
												</tr>
											</thead>
											<tbody>
												{rightGrades.map((item, idx) => {
													const rowNo = mid + idx + 1;
													return (
														<tr
															key={item.courseId || `right-${idx}`}
															className="align-top"
														>
															<td className="py-[1.5px] px-1 text-right font-mono">
																{rowNo}.
															</td>
															<td className="py-[1.5px] px-1 font-mono uppercase font-normal">
																{item.code || "-"}
															</td>
															<td className="py-[1.5px] px-1 font-sans">
																{item.name || "-"}
															</td>
															<td className="py-[1.5px] px-1 text-center font-mono">
																{item.sks ?? 0}
															</td>
															<td className="py-[1.5px] px-1 text-center font-mono font-medium">
																{item.grade || "-"}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								</div>

								{/* Garis Putus-Putus Pembatas Bawah Tabel (Membentang Sejajar di Bawah Kedua Kolom) */}
								<div className="border-b border-black border-dotted w-full mt-1 mb-4" />
							</div>
						)}

						{/* 5. Bagian Bawah: QR Code & Pengesahan Tanda Tangan */}
						<div
							className="flex justify-between items-start pt-6 print:pt-4"
							style={{ pageBreakInside: "avoid" }}
						>
							{/* QR Code Verifikasi Dokumen */}
							<div className="flex flex-col items-start pl-2">
								{qrCodeUrl ? (
									<img
										src={qrCodeUrl}
										alt="QR Code Verifikasi"
										className="w-20 h-20 object-contain border border-black/10"
									/>
								) : (
									<div className="w-20 h-20 bg-slate-50 border border-black/20 flex items-center justify-center text-[9px] text-slate-400">
										QR Code
									</div>
								)}
								<p className="text-[8px] text-slate-500 font-mono mt-1">
									Scan verifikasi keaslian dokumen
								</p>
							</div>

							{/* Lembar Tanda Tangan Resmi BAAK */}
							<div className="text-[10px] text-black text-left w-64 pr-2 space-y-0.5">
								<p>Denpasar, {todayFormatted}</p>
								<p className="leading-tight font-medium">
									Wakil Direktur Bidang Akademik Dan Kerja Sama,
								</p>
								<p className="leading-tight font-medium">Nusadaya Academy</p>

								{/* Ruang Tanda Tangan & Cap Lembaga */}
								<div className="h-16" />

								<p className="font-bold underline text-black">
									Dr. I Ketut Suartana, M.Par
								</p>
								<p className="font-mono text-[9.5px]">NIDN. 0812058801</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function StudentTranscriptPrintPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-slate-100 flex items-center justify-center">
					<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				</div>
			}
		>
			<StudentTranscriptPrintContent />
		</Suspense>
	);
}
