"use client";

import {
	ArrowLeft,
	Award,
	CheckCircle2,
	Download,
	GraduationCap,
	Loader2,
	Printer,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function StudentKhsPrintContent() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();

	const studentId = Number(params.id);
	const initialSemester = Number(searchParams.get("semester")) || 1;

	const [selectedSemester, setSelectedSemester] =
		useState<number>(initialSemester);
	const [isLoading, setIsLoading] = useState(true);
	const [summaryData, setSummaryData] = useState<any>(null);

	const fetchKhsData = useCallback(async () => {
		setIsLoading(true);
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
				setSummaryData(json.data);
			} else {
				toast.error(json.message || "Gagal memuat data KHS");
			}
		} catch {
			toast.error("Gagal terhubung ke server");
		} finally {
			setIsLoading(false);
		}
	}, [studentId, selectedSemester]);

	useEffect(() => {
		if (studentId) {
			fetchKhsData();
		}

		const handleSync = (e: any) => {
			const targetId = e?.detail?.studentId;
			const targetIds = e?.detail?.studentIds;
			if (
				(!targetId && !targetIds) ||
				targetId === studentId ||
				(Array.isArray(targetIds) && targetIds.includes(studentId))
			) {
				fetchKhsData();
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
						fetchKhsData();
					}
				}
			};
		} catch {}

		return () => {
			window.removeEventListener("academic-data-updated", handleSync);
			window.removeEventListener("student-updated", handleSync);
			window.removeEventListener("course-updated", handleSync);
			window.removeEventListener("course-attendance-updated", handleSync);
			if (bc) bc.close();
		};
	}, [studentId, selectedSemester, fetchKhsData]);

	const grades = summaryData?.grades || [];
	const gpaDisplay = summaryData?.gpaDisplay || "0.00";
	const totalSksTaken = summaryData?.totalSksTaken || 0;
	const totalSksPassed = summaryData?.totalSksPassed || 0;

	const todayFormatted = new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const handleExportCsv = () => {
		if (!grades || grades.length === 0) {
			toast.error("Tidak ada data nilai untuk diexport");
			return;
		}
		const exportRows = grades.map((item: any, idx: number) => ({
			No: idx + 1,
			"Kode MK": item.code || "-",
			"Mata Kuliah": item.name || "-",
			SKS: item.sks || 0,
			"Presensi (%)": `${item.attendanceRate || 0}%`,
			"Nilai Teori": item.theoryScore ?? "-",
			"Nilai Praktik": item.practicalScore ?? "-",
			UTS: item.utsScore ?? "-",
			UAS: item.uasScore ?? "-",
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
		toast.success("Dokumen KHS berhasil diexport ke CSV");
	};

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
			<div className="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
				<div className="flex items-center gap-3">
					<Link
						href={`/dashboard/students/${studentId}?tab=akademik&subtab=nilai-khs`}
					>
						<Button
							variant="outline"
							size="sm"
							className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
						>
							<ArrowLeft className="w-3.5 h-3.5" />
							Kembali ke Panel Akademik
						</Button>
					</Link>
				</div>

				<div className="flex flex-wrap items-center gap-2.5 justify-end">
					<div className="flex items-center gap-1.5">
						<span className="text-xs font-semibold text-slate-600">
							Semester:
						</span>
						<Select
							value={selectedSemester.toString()}
							onValueChange={(val) => {
								const sem = Number(val);
								setSelectedSemester(sem);
								router.replace(
									`/dashboard/students/${studentId}/khs?semester=${sem}`,
								);
							}}
						>
							<SelectTrigger className="w-28 h-8 text-xs bg-slate-50 border-slate-200 font-medium">
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

					<Button
						variant="outline"
						size="sm"
						onClick={handleExportCsv}
						disabled={isLoading || grades.length === 0}
						className="h-8 text-xs gap-1.5 text-slate-700 hover:bg-slate-50 border-slate-200 font-semibold"
						title="Export data nilai KHS ke format file CSV / Excel"
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
				<div className="max-w-4xl mx-auto bg-white p-16 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
					<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
					<p className="text-xs text-slate-500 font-medium">
						Memuat dokumen KHS resmi...
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
								✓ DOKUMEN RESMI BAAK
							</Badge>
							<p className="text-[10px] text-slate-500 font-mono mt-1">
								Form: AKD-KHS/REV-03
							</p>
						</div>
					</div>

					{/* Double-Line Separator Garis Kop Formal */}
					<div className="border-b-[2px] border-black mt-1 mb-[1.5px]" />
					<div className="border-b-[0.75px] border-black mb-4" />

					{/* Judul Dokumen & Legalitas */}
					<div className="text-center space-y-1">
						<h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 underline underline-offset-4">
							KARTU HASIL STUDI (KHS)
						</h3>
						<p className="text-xs font-mono text-slate-600">
							Nomor:{" "}
							<span className="font-bold text-slate-900">
								{summaryData?.documentNo ||
									`KHS/NUSADAYA/${new Date().getFullYear()}/A${summaryData?.cohort || "14"}/${summaryData?.nim || studentId}`}
							</span>
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
								Nomor Induk Mahasiswa (NIM):
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
								Program Keahlian:
							</span>
							<strong className="text-slate-900 font-bold">
								{summaryData?.program || "Hospitality Vokasi"}
							</strong>
						</div>
						<div>
							<span className="text-slate-500 block text-[11px]">
								Semester / Rombel:
							</span>
							<strong className="text-slate-900 font-bold">
								Semester {selectedSemester} ({summaryData?.rombel || "Kelas A"})
							</strong>
						</div>
						<div>
							<span className="text-slate-500 block text-[11px]">
								Dosen Pembimbing Akademik:
							</span>
							<strong className="text-slate-900 font-bold">
								{summaryData?.paName || "Dosen PA"}
							</strong>
						</div>
					</div>

					{/* Tabel Nilai KHS */}
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
										Mata Kuliah
									</TableHead>
									<TableHead className="text-center w-14 font-bold text-slate-900">
										SKS (K)
									</TableHead>
									<TableHead className="text-center w-16 font-bold text-slate-900">
										Nilai (N)
									</TableHead>
									<TableHead className="text-center w-14 font-bold text-slate-900">
										Grade
									</TableHead>
									<TableHead className="text-center w-14 font-bold text-slate-900">
										Bobot (M)
									</TableHead>
									<TableHead className="text-center w-16 font-bold text-slate-900">
										Mutu (KxM)
									</TableHead>
									<TableHead className="text-center w-24 font-bold text-slate-900">
										Keterangan
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
											<div className="flex items-center gap-2">
												<span>{item.name}</span>
												{item.isCustomEnrollment && (
													<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
														Tambahan
													</span>
												)}
											</div>
										</TableCell>
										<TableCell className="text-center font-mono font-bold py-2">
											{item.sks}
										</TableCell>
										<TableCell className="text-center font-mono font-bold py-2">
											{item.grade &&
											item.grade !== "-" &&
											item.status !== "BELUM_DINILAI"
												? item.finalScore
												: "-"}
										</TableCell>
										<TableCell className="text-center font-bold py-2">
											<span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold border border-slate-300">
												{item.grade || "-"}
											</span>
										</TableCell>
										<TableCell className="text-center font-mono py-2">
											{item.grade &&
											item.grade !== "-" &&
											item.status !== "BELUM_DINILAI"
												? ((item.gradePoint || 0) / 100).toFixed(2)
												: "-"}
										</TableCell>
										<TableCell className="text-center font-mono font-bold py-2">
											{item.grade &&
											item.grade !== "-" &&
											item.status !== "BELUM_DINILAI"
												? item.qualityScore?.toFixed(2) || "0.00"
												: "-"}
										</TableCell>
										<TableCell className="text-center font-semibold py-2">
											<span
												className={`text-[11px] px-2 py-0.5 rounded font-bold ${
													!item.grade ||
													item.grade === "-" ||
													item.status === "BELUM_DINILAI"
														? "text-slate-700 bg-slate-100 border border-slate-300"
														: item.isPassed
															? "text-emerald-800 bg-emerald-50 border border-emerald-300"
															: "text-rose-800 bg-rose-50 border border-rose-300"
												}`}
											>
												{!item.grade ||
												item.grade === "-" ||
												item.status === "BELUM_DINILAI"
													? "BELUM DINILAI"
													: item.isPassed
														? "LULUS"
														: "MENGULANG"}
											</span>
										</TableCell>
									</TableRow>
								))}

								<TableRow className="bg-slate-50 font-bold border-t-2 border-slate-300">
									<TableCell
										colSpan={3}
										className="text-right py-2.5 font-bold"
									>
										Total SKS Ditempuh:
									</TableCell>
									<TableCell className="text-center font-mono font-bold py-2.5">
										{totalSksTaken}
									</TableCell>
									<TableCell
										colSpan={3}
										className="text-right py-2.5 font-bold"
									>
										Total Angka Mutu:
									</TableCell>
									<TableCell className="text-center font-mono font-bold py-2.5">
										{summaryData?.qualityScoreTotal?.toFixed(2) || "0.00"}
									</TableCell>
									<TableCell />
								</TableRow>
							</TableBody>
						</Table>
					</div>

					{/* Rangkuman IP & Prestasi */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-semibold print:bg-white print:border-slate-300">
						<div>
							<span className="text-slate-600 block text-[11px]">
								Indeks Prestasi Semester (IPS):
							</span>
							<strong className="text-lg font-mono text-[#0517B0] print:text-black">
								{gpaDisplay}{" "}
								<span className="text-xs font-normal text-slate-500">
									/ 4.00
								</span>
							</strong>
						</div>
						<div>
							<span className="text-slate-600 block text-[11px]">
								Indeks Prestasi Kumulatif (IPK):
							</span>
							<strong className="text-lg font-mono text-[#0517B0] print:text-black">
								{gpaDisplay}{" "}
								<span className="text-xs font-normal text-slate-500">
									/ 4.00
								</span>
							</strong>
						</div>
						<div>
							<span className="text-slate-600 block text-[11px]">
								Status Kelulusan SKS:
							</span>
							<strong className="text-lg font-mono text-emerald-800 print:text-black">
								{totalSksPassed}{" "}
								<span className="text-xs font-normal text-slate-500">
									dari {totalSksTaken} SKS Lulus
								</span>
							</strong>
						</div>
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
								Dokumen akademik ini diterbitkan secara sah oleh Sistem BAAK
								Terpadu Nusadaya Academy dan tersinkronisasi langsung ke modul
								Magang (Pra-Paspor) serta Feeder PDDIKTI.
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

export default function StudentKhsPrintPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-500">
					Memuat Kartu Hasil Studi (KHS)...
				</div>
			}
		>
			<StudentKhsPrintContent />
		</Suspense>
	);
}
