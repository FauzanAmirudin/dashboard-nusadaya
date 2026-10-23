"use client";

import {
	ArrowLeft,
	Download,
	FileText,
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
import { API_URL, getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";

function StudentKrsPrintContent() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();

	const studentId = Number(params.id);
	const initialSemester = Number(searchParams.get("semester")) || 1;

	const [selectedSemester, setSelectedSemester] =
		useState<number>(initialSemester);
	const [isLoading, setIsLoading] = useState(true);
	const [summaryData, setSummaryData] = useState<any>(null);

	const fetchKrsData = useCallback(async () => {
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
				toast.error(json.message || "Gagal memuat data KRS");
			}
		} catch {
			toast.error("Gagal terhubung ke server");
		} finally {
			setIsLoading(false);
		}
	}, [studentId, selectedSemester]);

	useEffect(() => {
		if (studentId) {
			fetchKrsData();
		}

		const handleSync = (e: any) => {
			const targetId = e?.detail?.studentId;
			const targetIds = e?.detail?.studentIds;
			if (
				(!targetId && !targetIds) ||
				targetId === studentId ||
				(Array.isArray(targetIds) && targetIds.includes(studentId))
			) {
				fetchKrsData();
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
						fetchKrsData();
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
	}, [studentId, selectedSemester, fetchKrsData]);

	const grades = summaryData?.grades || [];
	const totalSksTaken = summaryData?.totalSksTaken || 0;

	// Konversi angka semester ke angka Romawi
	const toRoman = (num: number) => {
		const romanMap: Record<number, string> = {
			1: "I",
			2: "II",
			3: "III",
			4: "IV",
			5: "V",
			6: "VI",
			7: "VII",
			8: "VIII",
		};
		return romanMap[num] || num.toString();
	};

	// Tahun akademik dinamis berdasarkan semester dan tahun saat ini
	const currentYear = new Date().getFullYear();
	const isGanjil = selectedSemester % 2 !== 0;
	const tahunAkademik = isGanjil
		? `GANJIL ${currentYear} / ${currentYear + 1}`
		: `GENAP ${currentYear} / ${currentYear + 1}`;

	const todayFormatted = new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const handleExportCsv = () => {
		if (!grades || grades.length === 0) {
			toast.error("Tidak ada data KRS untuk diexport");
			return;
		}
		const exportRows = grades.map((item: any, idx: number) => ({
			No: idx + 1,
			"Kode MK": item.code || "-",
			"Nama Mata Kuliah": item.name || "-",
			SKS: item.sks || 0,
			Kelas: summaryData?.rombel || "A",
			"Dosen Pengampu": item.dosenName || "-",
		}));
		const studentNameSlug = (
			summaryData?.name ||
			summaryData?.studentName ||
			`Mahasiswa_${studentId}`
		).replace(/[^a-zA-Z0-9]/g, "_");
		exportToCSV(
			exportRows,
			`KRS_${studentNameSlug}_Semester_${selectedSemester}`,
		);
		toast.success("Dokumen KRS berhasil diexport ke CSV");
	};

	return (
		<div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white text-slate-900">
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
								const s = Number(val);
								setSelectedSemester(s);
								router.push(
									`/dashboard/students/${studentId}/krs?semester=${s}`,
								);
							}}
						>
							<SelectTrigger className="w-32 h-8 text-xs bg-slate-50 border-slate-200 font-medium">
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

					<Link
						href={`/dashboard/students/${studentId}/khs?semester=${selectedSemester}`}
					>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
						>
							<FileText className="w-3.5 h-3.5 text-blue-600" />
							<span>Lihat KHS</span>
						</Button>
					</Link>

					<Button
						variant="outline"
						size="sm"
						onClick={handleExportCsv}
						disabled={isLoading || grades.length === 0}
						className="h-8 text-xs gap-1.5 text-slate-700 hover:bg-slate-50 border-slate-200 font-semibold"
						title="Export data KRS ke format file CSV / Excel"
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
						<span>Cetak / Simpan PDF</span>
					</Button>
				</div>
			</div>

			{/* Main Document Paper Sheet (Template Sesuai Gambar User) */}
			{isLoading ? (
				<div className="max-w-4xl mx-auto bg-white p-16 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
					<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
					<p className="text-xs text-slate-500 font-medium">
						Memuat dokumen Kartu Rencana Studi (KRS)...
					</p>
				</div>
			) : (
				<div className="printable-area max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 space-y-4 text-black">
					{/* KOP Surat Lembaga Resmi */}
					<div className="flex items-center justify-between pb-1 gap-4">
						<div className="shrink-0">
							<img
								src="/logonusadaya.png"
								alt="Logo Nusadaya Academy"
								className="h-20 w-auto object-contain"
							/>
						</div>
						<div className="text-center flex-1 space-y-0.5">
							<h2 className="text-base sm:text-lg font-black uppercase text-black font-serif tracking-tight leading-snug">
								LEMBAGA PENDIDIKAN VOKASI & PELATIHAN KERJA
								<br />
								<span className="text-lg sm:text-xl font-extrabold text-blue-950">
									NUSADAYA ACADEMY
								</span>
							</h2>
							<p className="text-[11px] font-semibold text-neutral-800 leading-tight">
								SK. Izin Operasional Kemnaker / BAAK Terakreditasi Resmi
							</p>
							<p className="text-[10px] text-neutral-700 leading-tight">
								Jalan Bypass Ngurah Rai No. 88, Denpasar, Bali • TELP: (0361)
								894-8888
							</p>
							<p className="text-[10px] text-neutral-600 font-mono">
								website : https://nusadaya.ac.id • e-mail :
								akademik@nusadaya.ac.id
							</p>
						</div>
						<div className="w-16 shrink-0 hidden sm:block" />
					</div>

					{/* Double-Line Separator Garis Kop Formal (Tebal di atas, tipis di bawah) */}
					<div className="border-b-[2.5px] border-black mt-1 mb-[1.5px]" />
					<div className="border-b-[0.75px] border-black mb-3" />

					{/* Judul Dokumen */}
					<div className="text-center py-1">
						<h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-black underline underline-offset-4">
							KARTU RENCANA STUDI
						</h3>
					</div>

					{/* Identitas Mahasiswa (2 Kolom Rapi dengan Titik Dua Sejajar Sesuai Template) */}
					<div className="text-[12px] text-black font-sans leading-relaxed pt-1 pb-2">
						<div className="grid grid-cols-2 gap-x-6 gap-y-1">
							{/* Kolom Kiri */}
							<div className="space-y-1">
								<div className="flex">
									<span className="w-32 shrink-0">Nama Mahasiswa</span>
									<span className="mr-2">:</span>
									<span className="font-bold uppercase tracking-wide">
										{summaryData?.name || "-"}
									</span>
								</div>
								<div className="flex">
									<span className="w-32 shrink-0">Kelas</span>
									<span className="mr-2">:</span>
									<span className="font-semibold">
										{summaryData?.rombel || "Kelas A"}
									</span>
								</div>
								<div className="flex">
									<span className="w-32 shrink-0">Prodi</span>
									<span className="mr-2">:</span>
									<span className="font-semibold uppercase">
										{summaryData?.program || "HOSPITALITY & CRUISE LINE"}
									</span>
								</div>
								<div className="flex">
									<span className="w-32 shrink-0">Jenis Kelamin</span>
									<span className="mr-2">:</span>
									<span>{summaryData?.gender || "Laki-laki"}</span>
								</div>
							</div>

							{/* Kolom Kanan */}
							<div className="space-y-1">
								<div className="flex">
									<span className="w-36 shrink-0">No. Induk Mahasiswa</span>
									<span className="mr-2">:</span>
									<span className="font-mono font-bold">
										{summaryData?.nim || studentId}
									</span>
								</div>
								<div className="flex">
									<span className="w-36 shrink-0">Semester</span>
									<span className="mr-2">:</span>
									<span className="font-bold">{toRoman(selectedSemester)}</span>
								</div>
								<div className="flex">
									<span className="w-36 shrink-0">Tahun Akademik</span>
									<span className="mr-2">:</span>
									<span className="font-semibold uppercase">
										{tahunAkademik}
									</span>
								</div>
								<div className="flex">
									<span className="w-36 shrink-0">Angkatan</span>
									<span className="mr-2">:</span>
									<span>{summaryData?.cohort || currentYear}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Tabel KRS Sesuai Format Gambar Template */}
					<div className="overflow-hidden">
						<table className="w-full text-[11px] border border-black border-collapse font-sans">
							<thead>
								<tr className="border-b border-black text-center font-bold">
									<th className="border-r border-black w-12 py-1.5 px-2">
										No. Urut
									</th>
									<th className="border-r border-black py-1.5 px-3 text-center">
										Mata Kuliah
									</th>
									<th className="border-r border-black w-24 py-1.5 px-2">
										Kode MK
									</th>
									<th className="border-r border-black w-12 py-1.5 px-2">K</th>
									<th className="border-r border-black py-1.5 px-3 text-center">
										Dosen Pembina Mata Kuliah
									</th>
									<th className="w-16 py-1.5 px-2 text-center">Ket</th>
								</tr>
							</thead>
							<tbody>
								{grades.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="border-b border-black text-center py-6 italic text-neutral-500"
										>
											Belum ada mata kuliah yang terdaftar untuk semester{" "}
											{selectedSemester}
										</td>
									</tr>
								) : (
									grades.map((item: any, idx: number) => (
										<tr
											key={item.courseId || idx}
											className="border-b border-black"
										>
											<td className="border-r border-black text-center py-1.5 px-2 font-mono">
												{idx + 1}
											</td>
											<td className="border-r border-black py-1.5 px-3 uppercase font-medium">
												{item.name}
											</td>
											<td className="border-r border-black text-center py-1.5 px-2 font-mono uppercase">
												{item.code}
											</td>
											<td className="border-r border-black text-center py-1.5 px-2 font-bold font-mono">
												{item.sks}
											</td>
											<td className="border-r border-black py-1.5 px-3 uppercase">
												{item.dosenName || "-"}
											</td>
											<td className="text-center py-1.5 px-2">
												{item.isCustomEnrollment ? "Tambahan" : "Wajib"}
											</td>
										</tr>
									))
								)}

								{/* Baris Total Jumlah SKS Diambil */}
								<tr className="border-t-2 border-black font-bold">
									<td
										colSpan={3}
										className="border-r border-black text-center py-1.5 px-3 uppercase tracking-wider"
									>
										Jumlah SKS Diambil
									</td>
									<td className="border-r border-black text-center py-1.5 px-2 font-bold font-mono text-xs">
										{totalSksTaken}
									</td>
									<td className="border-r border-black" />
									<td />
								</tr>
							</tbody>
						</table>
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
								Dokumen Kartu Rencana Studi (KRS) ini diterbitkan secara sah
								oleh Sistem BAAK Terpadu Nusadaya Academy dan tersinkronisasi
								langsung ke modul perkuliahan.
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

export default function StudentKrsPrintPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-500">
					Memuat Kartu Rencana Studi (KRS)...
				</div>
			}
		>
			<StudentKrsPrintContent />
		</Suspense>
	);
}
