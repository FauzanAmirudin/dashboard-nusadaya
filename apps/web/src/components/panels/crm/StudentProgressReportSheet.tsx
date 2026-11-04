"use client";

import {
	BookOpen,
	Calendar,
	CheckCircle2,
	Clock,
	GraduationCap,
	Languages,
	ShieldCheck,
	UserCheck,
} from "lucide-react";
import React from "react";

export interface StudentProgressReportSheetProps {
	student: any;
	crm?: any;
	summary?: any;
	courses?: any[];
	pa?: any;
	hafalanSessions?: any[];
	vocabLogs?: any[];
	counselingLogs?: any[];
	customNotes?: string;
	reportDate?: string;
}

export function StudentProgressReportSheet({
	student,
	crm,
	summary,
	courses = [],
	pa,
	hafalanSessions = [],
	vocabLogs = [],
	counselingLogs = [],
	customNotes,
	reportDate,
}: StudentProgressReportSheetProps) {
	const todayFormatted =
		reportDate ||
		new Date().toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});

	// Identitas Mahasiswa
	const studentName = student?.name || "Nama Mahasiswa";
	const nim = student?.nim || "-";
	const cohort = student?.cohort || 15;
	const program = student?.program || "Perhotelan & Kapal Pesiar";
	const subProgram = student?.subProgram || "";
	const rombel = student?.rombel || "Kelas A";
	const paName =
		student?.pa?.fullName ||
		pa?.paName ||
		pa?.createdByUser?.fullName ||
		"Dr. Maya Indah Permata, M.Pd.";
	const parentName =
		student?.parentName ||
		student?.parents?.[0]?.name ||
		"Orang Tua / Wali Mahasiswa";
	const parentPhone =
		student?.parentPhone ||
		student?.parents?.[0]?.phone ||
		student?.emergencyContactPhone ||
		student?.phone ||
		"-";

	// Data Kehadiran
	const lectureTotal = summary?.lectureTotal ?? 160;
	const lecturePresent = summary?.lecturePresent ?? 0;
	const lectureRate =
		summary?.lectureRate ??
		(lectureTotal > 0 ? Math.round((lecturePresent / lectureTotal) * 100) : 0);
	const isLectureEligible = lectureRate >= 90;

	const piketTotal = summary?.piketTotal ?? 0;
	const piketPresent = summary?.piketPresent ?? 0;
	const piketRate = summary?.piketRate ?? 100;

	const barisTotal = summary?.barisTotal ?? 0;
	const barisPresent = summary?.barisPresent ?? 0;
	const barisLate = summary?.barisLate ?? 0;
	const barisRate = summary?.barisRate ?? 100;

	// ODS Data
	let odsCount = 0;
	if (Array.isArray(crm?.odsDetails)) {
		odsCount = crm.odsDetails.filter((o: any) => Boolean(o?.isDone)).length;
	} else if (summary?.odsPresent) {
		odsCount = summary.odsPresent;
	}
	const isOdsDone = Boolean(crm?.isOdsReport || odsCount >= 5);

	// Data Hafalan
	const vocabTarget = pa?.vocabTarget || 400;
	const totalVocabCount = hafalanSessions.reduce(
		(acc: number, s: any) => acc + (Number(s.vocabCount) || 0),
		0,
	);
	const totalSentenceCount = hafalanSessions.reduce(
		(acc: number, s: any) => acc + (Number(s.sentenceCount) || 0),
		0,
	);
	const vocabPercent = Math.min(
		100,
		Math.round((totalVocabCount / vocabTarget) * 100),
	);
	const isVocabComplete = Boolean(crm?.isVocabComplete || vocabPercent >= 100);

	// Data Kedisiplinan
	const isDisciplineGood = pa?.disciplineGood !== false;
	const disciplineNotes =
		pa?.disciplineNotes?.trim() ||
		"Mahasiswa beretika sopan, mematuhi tata tertib kampus, dan menunjukkan sikap kooperatif.";

	// Evaluasi Status Keseluruhan
	let overallBadge = {
		label: "PRESTASI BAIK & AMAN",
		color: "text-emerald-700 bg-emerald-50 border-emerald-300",
	};
	if (lectureRate < 80 || odsCount < 2 || vocabPercent < 30) {
		overallBadge = {
			label: "PERLU PEMBINAAN & PERHATIAN",
			color: "text-amber-800 bg-amber-50 border-amber-300",
		};
	}

	return (
		<div className="printable-report w-full space-y-6 print:space-y-0 text-slate-900 leading-normal select-text">
			{/* Aturan Cetak Scoped A4 Portrait & Paginasi Bersih */}
			<style
				dangerouslySetInnerHTML={{
					__html: `
						@page {
							size: A4 portrait;
							margin: 0;
						}
						@media print {
							html, body {
								width: 210mm !important;
								margin: 0 !important;
								padding: 0 !important;
								background: #ffffff !important;
								color: #000000 !important;
								-webkit-print-color-adjust: exact !important;
								print-color-adjust: exact !important;
							}
							.printable-report {
								width: 210mm !important;
								margin: 0 !important;
								padding: 0 !important;
								border: none !important;
								box-shadow: none !important;
							}
							.report-page {
								width: 210mm !important;
								min-height: 297mm !important;
								height: 297mm !important;
								max-height: 297mm !important;
								padding: 16mm 16mm 20mm 16mm !important;
								margin: 0 !important;
								border: none !important;
								box-shadow: none !important;
								page-break-after: always !important;
								break-after: page !important;
								box-sizing: border-box !important;
								display: flex !important;
								flex-direction: column !important;
								justify-content: space-between !important;
							}
							.report-page:last-child {
								page-break-after: avoid !important;
								break-after: avoid !important;
							}
							thead {
								display: table-header-group !important;
							}
						}
					`,
				}}
			/>

			{/* ═══════════════════════════════════════════════════════════════
			    LEMBAR 1: KOP SURAT, IDENTITAS & REKAP KEHADIRAN (BAGIAN I)
			   ═══════════════════════════════════════════════════════════════ */}
			<div
				id="crm-report-page-1"
				className="report-page report-page-1 relative bg-white border border-slate-300 shadow-md print:border-none print:shadow-none mx-auto flex flex-col justify-between"
				style={{
					width: "210mm",
					minWidth: "210mm",
					maxWidth: "210mm",
					minHeight: "297mm",
					height: "297mm",
					padding: "16mm 16mm 20mm 16mm",
					boxSizing: "border-box",
				}}
			>
				<div className="space-y-3">
					{/* ─── KOP SURAT RESMI NUSADAYA ACADEMY ─── */}
					<div className="flex items-center justify-between pb-1.5 border-b-0">
						<div className="flex items-center gap-3.5 sm:gap-4">
							<img
								src="/logonusadaya.png"
								alt="Logo Nusadaya Academy"
								className="h-15 w-auto object-contain shrink-0"
							/>
							<div>
								<h2 className="text-lg sm:text-xl font-black uppercase text-slate-950 font-serif leading-none tracking-tight">
									NUSADAYA ACADEMY
								</h2>
								<p className="text-[10.5px] font-bold text-slate-800 tracking-wide mt-1">
									Lembaga Pendidikan & Pelatihan Kerja Perhotelan & Kapal Pesiar
								</p>
								<p className="text-[9.5px] text-slate-600 mt-0.5 leading-snug">
									Kampus Utama: Jl. Raya Dalung No. 88, Kuta Utara, Badung, Bali
									| Telp: (0361) 900-8888
								</p>
								<p className="text-[9px] text-slate-500 leading-snug">
									Website: nusadayaacademy.sch.id | Email:
									crm@nusadayaacademy.sch.id
								</p>
							</div>
						</div>

						<div className="text-right hidden sm:block shrink-0">
							<span className="inline-block border border-slate-700 bg-slate-50 text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded">
								✓ DOKUMEN RESMI WALI CRM
							</span>
							<p className="text-[9px] text-slate-500 font-mono mt-1">
								Form: CRM-WALI/REV-02
							</p>
						</div>
					</div>

					{/* Double-Line Separator Garis Kop Formal */}
					<div className="border-b-[2px] border-black mt-0.5 mb-[1.5px]" />
					<div className="border-b-[0.75px] border-black mb-2.5" />

					{/* ─── JUDUL DOKUMEN & IDENTIFIKASI RESMI ─── */}
					<div className="text-center space-y-0.5 mb-2.5">
						<h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 underline underline-offset-4">
							LAPORAN REKAPITULASI PERKEMBANGAN MAHASISWA
						</h3>
						<p className="text-[10.5px] font-medium text-slate-600">
							Rekapitulasi Kehadiran Kuliah, Hafalan Bahasa & Catatan
							Kedisiplinan untuk Orang Tua / Wali
						</p>
						<p className="text-[9.5px] font-mono text-slate-500">
							Nomor Laporan:{" "}
							<span className="font-bold text-slate-800">
								REKAP/CRM-WALI/{new Date().getFullYear()}/A{cohort}/{nim}
							</span>
						</p>
					</div>

					{/* ─── TABEL DATA IDENTITAS MAHASISWA & WALI ─── */}
					<div className="rounded-lg border border-slate-300 bg-slate-50/70 p-2.5 mb-2.5 text-[10.5px] space-y-1.5">
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
							<div>
								<span className="text-slate-500 block text-[9.5px] uppercase font-semibold">
									Nama Mahasiswa
								</span>
								<strong className="text-slate-900 text-xs font-bold block truncate">
									{studentName}
								</strong>
							</div>
							<div>
								<span className="text-slate-500 block text-[9.5px] uppercase font-semibold">
									NIM / Angkatan
								</span>
								<span className="text-slate-800 font-mono font-semibold block">
									{nim} / Cohort {cohort}
								</span>
							</div>
							<div>
								<span className="text-slate-500 block text-[9.5px] uppercase font-semibold">
									Program Studi / Kelas
								</span>
								<span className="text-slate-800 font-semibold block truncate">
									{program} ({rombel})
								</span>
							</div>
							<div>
								<span className="text-slate-500 block text-[9.5px] uppercase font-semibold">
									Dosen Pembimbing (PA)
								</span>
								<span className="text-slate-800 font-semibold block truncate">
									{paName}
								</span>
							</div>
						</div>

						<div className="pt-1 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-[9.5px]">
							<div>
								<span className="text-slate-500">Orang Tua / Wali: </span>
								<strong className="text-slate-800 font-semibold">
									{parentName}
								</strong>
							</div>
							<div>
								<span className="text-slate-500">No. Kontak: </span>
								<span className="text-slate-800 font-mono">{parentPhone}</span>
							</div>
							<div>
								<span className="text-slate-500">Periode Laporan: </span>
								<span className="text-slate-800 font-semibold">
									{todayFormatted}
								</span>
							</div>
							<div>
								<span className="text-slate-500">Evaluasi Status: </span>
								<span
									className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${overallBadge.color}`}
								>
									{overallBadge.label}
								</span>
							</div>
						</div>
					</div>

					{/* ─── BAGIAN 1: REKAPITULASI PRESENSI & KEHADIRAN MAHASISWA ─── */}
					<div className="border border-slate-300 rounded-lg p-2.5 space-y-2 bg-white">
						<div className="flex items-center justify-between border-b border-slate-200 pb-1">
							<div className="flex items-center gap-1.5">
								<span className="w-1.5 h-3.5 bg-[#0517B0] rounded-sm inline-block"></span>
								<h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
									<Calendar className="w-3.5 h-3.5 text-[#0517B0]" />
									Bagian I: Rekapitulasi Presensi & Kehadiran Perkuliahan
								</h4>
							</div>
							<span className="text-[9.5px] text-slate-500 font-semibold">
								Rata-rata Presensi:{" "}
								<strong
									className={
										isLectureEligible ? "text-emerald-700" : "text-amber-700"
									}
								>
									{lectureRate}%
								</strong>
							</span>
						</div>

						{/* 4 Pilar Ringkasan Kehadiran */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-[10px]">
							<div className="p-1.5 rounded border border-slate-200 bg-slate-50/70">
								<p className="text-[9px] uppercase font-bold text-slate-500">
									1. Perkuliahan (Teori/Praktik)
								</p>
								<p className="text-sm font-black text-slate-900 mt-0.5">
									{lectureRate}%
								</p>
								<p className="text-[8.5px] text-slate-500">
									{lecturePresent} dari {lectureTotal} Pertemuan
								</p>
								<span
									className={`inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.2 rounded border ${
										isLectureEligible
											? "bg-emerald-50 text-emerald-700 border-emerald-200"
											: "bg-amber-50 text-amber-700 border-amber-200"
									}`}
								>
									{isLectureEligible
										? "✓ Memenuhi Syarat"
										: "Perlu Ditingkatkan"}
								</span>
							</div>

							<div className="p-1.5 rounded border border-slate-200 bg-slate-50/70">
								<p className="text-[9px] uppercase font-bold text-slate-500">
									2. Praktik ODS (Industri)
								</p>
								<p className="text-sm font-black text-slate-900 mt-0.5">
									{odsCount} / 5 Sesi
								</p>
								<p className="text-[8.5px] text-slate-500">
									One Day Service Industri
								</p>
								<span
									className={`inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.2 rounded border ${
										isOdsDone
											? "bg-emerald-50 text-emerald-700 border-emerald-200"
											: odsCount >= 3
												? "bg-indigo-50 text-indigo-700 border-indigo-200"
												: "bg-slate-50 text-slate-600 border-slate-200"
									}`}
								>
									{isOdsDone ? "✓ Selesai 5 Sesi" : `${odsCount} Sesi Selesai`}
								</span>
							</div>

							<div className="p-1.5 rounded border border-slate-200 bg-slate-50/70">
								<p className="text-[9px] uppercase font-bold text-slate-500">
									3. Piket Kampus
								</p>
								<p className="text-sm font-black text-slate-900 mt-0.5">
									{piketRate}%
								</p>
								<p className="text-[8.5px] text-slate-500">
									{piketPresent} dari {piketTotal} Sesi Piket
								</p>
								<span
									className={`inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.2 rounded border ${
										piketRate >= 80
											? "bg-emerald-50 text-emerald-700 border-emerald-200"
											: "bg-amber-50 text-amber-700 border-amber-200"
									}`}
								>
									{piketRate >= 80 ? "✓ Tertib" : "Perlu Pembinaan"}
								</span>
							</div>

							<div className="p-1.5 rounded border border-slate-200 bg-slate-50/70">
								<p className="text-[9px] uppercase font-bold text-slate-500">
									4. Baris Pagi Harian
								</p>
								<p className="text-sm font-black text-slate-900 mt-0.5">
									{barisRate}%
								</p>
								<p className="text-[8.5px] text-slate-500">
									{barisPresent} Hadir | {barisLate} Terlambat
								</p>
								<span
									className={`inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.2 rounded border ${
										barisRate >= 85
											? "bg-emerald-50 text-emerald-700 border-emerald-200"
											: "bg-amber-50 text-amber-700 border-amber-200"
									}`}
								>
									{barisRate >= 85 ? "✓ Disiplin" : "Perlu Pembinaan"}
								</span>
							</div>
						</div>

						{/* Tabel Rincian Kehadiran per Mata Kuliah (Semua MK tertampung utuh tanpa terpotong) */}
						<div className="overflow-hidden border border-slate-200 rounded">
							<table className="w-full text-[9.5px] border-collapse">
								<thead>
									<tr className="bg-slate-100 border-b border-slate-200 text-slate-800">
										<th className="py-1 px-2 text-left font-bold w-6">No</th>
										<th className="py-1 px-2 text-left font-bold w-20">
											Kode MK
										</th>
										<th className="py-1 px-2 text-left font-bold">
											Mata Kuliah
										</th>
										<th className="py-1 px-2 text-center font-bold w-10">
											SKS
										</th>
										<th className="py-1 px-2 text-center font-bold w-14">
											Pertemuan
										</th>
										<th className="py-1 px-2 text-center font-bold w-12">
											Hadir
										</th>
										<th className="py-1 px-2 text-center font-bold w-14">
											Presensi
										</th>
										<th className="py-1 px-2 text-center font-bold w-20">
											Status
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{courses && courses.length > 0 ? (
										courses.map((c: any, idx: number) => {
											const cRate = Number(c.attendanceRate) || 0;
											const isOk = cRate >= 90;
											return (
												<tr
													key={c.id || idx}
													className={
														idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
													}
												>
													<td className="py-1 px-2 text-slate-500">
														{idx + 1}
													</td>
													<td className="py-1 px-2 font-mono font-medium text-slate-700">
														{c.courseCode || "-"}
													</td>
													<td className="py-1 px-2 font-semibold text-slate-900 truncate max-w-[210px]">
														{c.courseName || "-"}
													</td>
													<td className="py-1 px-2 text-center text-slate-600">
														{c.sks || 2}
													</td>
													<td className="py-1 px-2 text-center text-slate-600">
														{c.totalMeetings || 16}
													</td>
													<td className="py-1 px-2 text-center font-medium text-slate-800">
														{c.attendancePresent || 0}
													</td>
													<td className="py-1 px-2 text-center font-bold font-mono">
														<span
															className={
																isOk ? "text-emerald-700" : "text-amber-700"
															}
														>
															{cRate}%
														</span>
													</td>
													<td className="py-1 px-2 text-center">
														<span
															className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold ${
																isOk
																	? "bg-emerald-50 text-emerald-700 border border-emerald-200"
																	: "bg-amber-50 text-amber-700 border border-amber-200"
															}`}
														>
															{isOk ? "✓ Aman" : "Kurang"}
														</span>
													</td>
												</tr>
											);
										})
									) : (
										<tr>
											<td
												colSpan={8}
												className="py-2.5 text-center text-slate-400 italic"
											>
												Belum ada data mata kuliah terdaftar pada periode ini.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* ─── FOOTER LEMBAR 1 (DENGAN JARAK AMAN DARI BAWAH KERTAS) ─── */}
				<div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
					<span>
						Dokumen Resmi CRM & BAAK Nusadaya Academy • Laporan Perkembangan
						Mahasiswa
					</span>
					<span className="font-semibold text-slate-700">Halaman 1 dari 2</span>
				</div>
			</div>

			{/* ═══════════════════════════════════════════════════════════════
			    LEMBAR 2: HAFALAN, KEDISIPLINAN, CATATAN CRM & PENGESAHAN
			   ═══════════════════════════════════════════════════════════════ */}
			<div
				id="crm-report-page-2"
				className="report-page report-page-2 relative bg-white border border-slate-300 shadow-md print:border-none print:shadow-none mx-auto flex flex-col justify-between"
				style={{
					width: "210mm",
					minWidth: "210mm",
					maxWidth: "210mm",
					minHeight: "297mm",
					height: "297mm",
					padding: "16mm 16mm 20mm 16mm",
					boxSizing: "border-box",
				}}
			>
				<div className="space-y-3">
					{/* ─── RUNNING HEADER LEMBAR 2 (JARAK ATAS SAMA DENGAN LEMBAR 1) ─── */}
					<div className="flex items-center justify-between pb-2 border-b border-slate-300">
						<div className="flex items-center gap-3">
							<img
								src="/logonusadaya.png"
								alt="Logo Nusadaya Academy"
								className="h-10 w-auto object-contain shrink-0"
							/>
							<div>
								<h3 className="text-xs font-black uppercase text-slate-900 font-serif leading-none tracking-tight">
									NUSADAYA ACADEMY
								</h3>
								<p className="text-[9px] text-slate-500 mt-0.5">
									Laporan Rekapitulasi Perkembangan Mahasiswa:{" "}
									<strong className="text-slate-800">
										{studentName} ({nim})
									</strong>
								</p>
							</div>
						</div>
						<div className="text-right">
							<span className="inline-block border border-slate-700 bg-slate-50 text-slate-900 text-[8.5px] font-bold px-2 py-0.5 rounded">
								FORM: CRM-WALI/REV-02
							</span>
							<p className="text-[8.5px] text-slate-400 mt-0.5">
								Lembar 2 dari 2
							</p>
						</div>
					</div>

					{/* ─── BAGIAN 2: REKAPITULASI HAFALAN KOSAKATA & BAHASA ASING ─── */}
					<div className="border border-slate-300 rounded-lg p-2.5 space-y-2 bg-white">
						<div className="flex items-center justify-between border-b border-slate-200 pb-1">
							<div className="flex items-center gap-1.5">
								<span className="w-1.5 h-3.5 bg-indigo-600 rounded-sm inline-block"></span>
								<h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
									<Languages className="w-3.5 h-3.5 text-indigo-600" />
									Bagian II: Rekapitulasi Capaian Hafalan Kosakata Bahasa Asing
								</h4>
							</div>
							<span className="text-[9.5px] text-slate-500 font-semibold">
								Progres:{" "}
								<strong
									className={
										isVocabComplete ? "text-emerald-700" : "text-indigo-700"
									}
								>
									{totalVocabCount} / {vocabTarget} Kata ({vocabPercent}%)
								</strong>
							</span>
						</div>

						{/* Stat Bar Progres Hafalan */}
						<div className="p-2 rounded border border-indigo-100 bg-indigo-50/30 flex items-center justify-between gap-4 text-[10px]">
							<div className="flex items-center gap-5">
								<div>
									<span className="text-[9px] text-slate-500 block uppercase font-bold">
										Target Kosakata
									</span>
									<strong className="text-xs font-black text-slate-900">
										{vocabTarget} Kata
									</strong>
								</div>
								<div>
									<span className="text-[9px] text-slate-500 block uppercase font-bold">
										Total Disetor
									</span>
									<strong className="text-xs font-black text-indigo-700">
										{totalVocabCount} Kata
									</strong>
								</div>
								<div>
									<span className="text-[9px] text-slate-500 block uppercase font-bold">
										Praktik Kalimat
									</span>
									<strong className="text-xs font-black text-purple-700">
										{totalSentenceCount} Kalimat
									</strong>
								</div>
								<div>
									<span className="text-[9px] text-slate-500 block uppercase font-bold">
										Tingkat Capaian
									</span>
									<strong className="text-xs font-black text-slate-900">
										{vocabPercent}%
									</strong>
								</div>
							</div>

							<div>
								<span
									className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold border ${
										isVocabComplete
											? "bg-emerald-50 text-emerald-700 border-emerald-200"
											: "bg-indigo-50 text-indigo-700 border-indigo-200"
									}`}
								>
									{isVocabComplete
										? "✓ Lulus Target Hafalan"
										: "Sedang Berproses (Belum Lulus)"}
								</span>
							</div>
						</div>

						{/* Tabel Riwayat Sesi Hafalan */}
						<div className="overflow-hidden border border-slate-200 rounded">
							<table className="w-full text-[9.5px] border-collapse">
								<thead>
									<tr className="bg-slate-100 border-b border-slate-200 text-slate-800">
										<th className="py-1 px-2 text-left font-bold w-6">No</th>
										<th className="py-1 px-2 text-left font-bold w-24">
											Tanggal Setoran
										</th>
										<th className="py-1 px-2 text-left font-bold w-20">
											Bahasa
										</th>
										<th className="py-1 px-2 text-center font-bold w-20">
											Jumlah Kata
										</th>
										<th className="py-1 px-2 text-center font-bold w-16">
											Kalimat
										</th>
										<th className="py-1 px-2 text-left font-bold w-36">
											Dosen Penguji (PA)
										</th>
										<th className="py-1 px-2 text-left font-bold">
											Catatan Evaluasi
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-200">
									{hafalanSessions.length === 0 ? (
										<tr>
											<td
												colSpan={7}
												className="py-2.5 text-center text-slate-400 italic"
											>
												Belum ada riwayat setoran hafalan kosakata yang tercatat
												oleh Dosen PA.
											</td>
										</tr>
									) : (
										hafalanSessions.slice(0, 5).map((s: any, idx: number) => {
											const formattedDate = s.date
												? new Date(s.date).toLocaleDateString("id-ID", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})
												: "-";
											const examiner =
												s.createdByUser?.fullName ||
												s.examiner ||
												"Dr. Maya Indah Permata, M.Pd.";
											return (
												<tr
													key={s.id || idx}
													className={
														idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
													}
												>
													<td className="py-1 px-2 text-slate-500">
														{idx + 1}
													</td>
													<td className="py-1 px-2 font-medium text-slate-700">
														{formattedDate}
													</td>
													<td className="py-1 px-2 font-bold uppercase text-slate-800">
														{s.language || "inggris"}
													</td>
													<td className="py-1 px-2 text-center font-bold text-emerald-700">
														+{s.vocabCount || 0} Kata
													</td>
													<td className="py-1 px-2 text-center font-medium text-purple-700">
														+{s.sentenceCount || 0}
													</td>
													<td className="py-1 px-2 font-medium text-slate-800 truncate max-w-[140px]">
														{examiner}
													</td>
													<td className="py-1 px-2 text-slate-600 truncate max-w-[180px]">
														{s.notes || "-"}
													</td>
												</tr>
											);
										})
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* ─── BAGIAN 3: REKAPITULASI KEDISIPLINAN, SIKAP & PEMBINAAN ─── */}
					<div className="border border-slate-300 rounded-lg p-2.5 space-y-2 bg-white">
						<div className="flex items-center justify-between border-b border-slate-200 pb-1">
							<div className="flex items-center gap-1.5">
								<span className="w-1.5 h-3.5 bg-emerald-600 rounded-sm inline-block"></span>
								<h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
									<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
									Bagian III: Rekapitulasi Sikap, Kedisiplinan & Catatan
									Pembinaan
								</h4>
							</div>
							<span
								className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
									isDisciplineGood
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: "bg-amber-50 text-amber-700 border-amber-200"
								}`}
							>
								{isDisciplineGood
									? "✓ Sikap Terpuji & Disiplin"
									: "Dalam Pembinaan"}
							</span>
						</div>

						{/* 2 Parameter Sikap & Catatan Pembimbing */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
							<div className="p-2 rounded border border-slate-200 bg-slate-50/70 space-y-0.5">
								<span className="text-[9px] text-slate-500 font-bold uppercase block">
									Evaluasi Kedisiplinan Dosen PA
								</span>
								<p className="text-[11px] font-bold text-slate-800">
									{isDisciplineGood
										? "✓ Berkelakuan Baik, Sopan & Kooperatif"
										: "Perlu Pendampingan Tambahan"}
								</p>
								<p className="text-[9.5px] text-slate-600 italic">
									"{disciplineNotes}"
								</p>
							</div>

							<div className="p-2 rounded border border-slate-200 bg-slate-50/70 space-y-0.5">
								<span className="text-[9px] text-slate-500 font-bold uppercase block">
									Kepatuhan Tata Tertib Kampus
								</span>
								<div className="flex items-center gap-3 text-[9.5px] text-slate-700 pt-0.5">
									<span className="flex items-center gap-1">
										<CheckCircle2 className="w-3 h-3 text-emerald-600" />
										Seragam & Grooming Rapi
									</span>
									<span className="flex items-center gap-1">
										<CheckCircle2 className="w-3 h-3 text-emerald-600" />
										Bebas Pelanggaran Berat
									</span>
								</div>
								<p className="text-[9.5px] text-slate-500 mt-0.5">
									Sesi Bimbingan PA:{" "}
									<strong>
										{pa?.counselingDone
											? "Terlaksana Rutin"
											: "Terjadwal Berkala"}
									</strong>
								</p>
							</div>
						</div>

						{/* Riwayat Catatan Konseling & Pembinaan (Bila Ada) */}
						{counselingLogs && counselingLogs.length > 0 && (
							<div className="overflow-hidden border border-slate-200 rounded">
								<div className="bg-slate-100 px-2 py-0.5 border-b border-slate-200 text-[9px] font-bold text-slate-700 uppercase">
									Riwayat Catatan Bimbingan / Konseling PA
								</div>
								<div className="divide-y divide-slate-100 text-[9.5px] p-1 space-y-0.5 bg-white">
									{counselingLogs.slice(0, 3).map((cl: any, idx: number) => {
										const cDate = cl.date
											? new Date(cl.date).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "short",
													year: "numeric",
												})
											: "-";
										return (
											<div
												key={cl.id || idx}
												className="flex items-start justify-between gap-2 py-0.5"
											>
												<div className="flex items-center gap-2">
													<span className="font-semibold text-slate-800">
														{cDate}
													</span>
													<span className="text-[8.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-mono">
														{cl.type || "Konseling"}
													</span>
													<span className="text-slate-600 truncate max-w-[320px]">
														{cl.notes || "-"}
													</span>
												</div>
												<span className="text-[8.5px] font-semibold text-emerald-700 shrink-0">
													Kondisi: {cl.condition || "Stabil"}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* ─── BAGIAN 4: CATATAN KHUSUS WALI CRM UNTUK ORANG TUA / WALI ─── */}
					<div className="border border-blue-200 bg-blue-50/20 rounded-lg p-2.5 space-y-1">
						<div className="flex items-center justify-between">
							<h4 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
								<UserCheck className="w-3.5 h-3.5 text-[#0517B0]" />
								Bagian IV: Catatan Evaluasi Tim CRM untuk Orang Tua / Wali
							</h4>
							<span className="text-[9px] text-slate-500 font-medium">
								Komunikasi Tripartit
							</span>
						</div>
						<p className="text-[10px] text-slate-700 leading-relaxed">
							{customNotes?.trim() ||
								`Yth. Bapak/Ibu Wali dari Ananda ${studentName}, secara umum progres perkembangan perkuliahan, kehadiran, dan kedisiplinan ananda dalam pemantauan tim CRM dan Dosen Pembimbing. Mohon dukungan dan motivasi berkala di rumah agar ananda senantiasa menjaga konsistensi kehadiran perkuliahan, menuntaskan target hafalan bahasa asing, serta menjaga kesiapan mental dan fisik menuju tahapan magang kerja industri.`}
						</p>
					</div>

					{/* ─── BAGIAN 5: LEMBAR PENGESAHAN TIGA PIHAK ─── */}
					<div className="border-t border-slate-300 pt-3 text-[10px] text-center">
						<p className="text-[9.5px] text-slate-500 mb-2 font-semibold uppercase tracking-wider">
							Lembar Pengesahan Tripartit Evaluasi Perkembangan Mahasiswa
							Nusadaya Academy
						</p>

						<div className="grid grid-cols-3 gap-4 pt-1">
							{/* Kolom 1: Dosen Pembimbing Akademik */}
							<div className="space-y-10">
								<div>
									<p className="text-slate-600 text-[9.5px]">Mengetahui,</p>
									<p className="font-bold text-slate-900">
										Dosen Pembimbing Akademik (PA)
									</p>
								</div>
								<div>
									<p className="font-bold underline text-slate-900 uppercase">
										{paName}
									</p>
									<p className="text-[9px] text-slate-500">
										NIDN / Dosen Wali Nusadaya
									</p>
								</div>
							</div>

							{/* Kolom 2: Tim CRM Nusadaya */}
							<div className="space-y-10">
								<div>
									<p className="text-slate-600 text-[9.5px]">
										Denpasar, {todayFormatted}
									</p>
									<p className="font-bold text-slate-900">
										Tim CRM & Hubungan Wali
									</p>
								</div>
								<div>
									<p className="font-bold underline text-slate-900 uppercase">
										Divisi CRM Nusadaya Academy
									</p>
									<p className="text-[9px] text-slate-500">
										Customer Relationship Management
									</p>
								</div>
							</div>

							{/* Kolom 3: Orang Tua / Wali Mahasiswa */}
							<div className="space-y-10">
								<div>
									<p className="text-slate-600 text-[9.5px]">
										Menyetujui & Mengetahui,
									</p>
									<p className="font-bold text-slate-900">
										Orang Tua / Wali Mahasiswa
									</p>
								</div>
								<div>
									<p className="font-bold underline text-slate-900 uppercase">
										( {parentName} )
									</p>
									<p className="text-[9px] text-slate-500">
										Tanda Tangan & Nama Terang
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* ─── FOOTER LEMBAR 2 (JARAK BAWAH SAMA DENGAN LEMBAR 1) ─── */}
				<div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[8.5px] text-slate-500">
					<div className="flex items-center gap-1.5 text-left">
						<ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
						<span>
							Dokumen rekapitulasi sah terverifikasi Sistem CRM Terpadu Nusadaya
							Academy.
						</span>
					</div>
					<div className="flex items-center gap-3 shrink-0">
						<span className="font-mono text-slate-400">
							Dicetak: {new Date().toLocaleString("id-ID")}
						</span>
						<span className="font-semibold text-slate-700">
							Halaman 2 dari 2
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
