"use client";

import React from "react";

interface ScheduleItem {
	id: number;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	subject: string;
	courseCode?: string;
	room: string;
	rombel?: string;
	cohort?: number | string;
	notes?: string;
	dosen?: {
		id?: number;
		fullName?: string;
		name?: string;
	};
	dosenPendamping?: {
		id?: number;
		fullName?: string;
		name?: string;
	};
}

interface PrintableScheduleViewProps {
	title: string;
	schedules: ScheduleItem[];
	cohortFilter?: string;
	rombelFilter?: string;
	dayFilter?: string;
	peminatanFilter?: string;
	printDate?: string;
}

export function PrintableScheduleView({
	title,
	schedules,
	cohortFilter = "all",
	rombelFilter = "all",
	dayFilter = "all",
	peminatanFilter = "all",
	printDate,
}: PrintableScheduleViewProps) {
	const formattedDate =
		printDate ||
		new Date().toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});

	const cohortLabel =
		cohortFilter === "all" ? "Semua Angkatan" : `Angkatan ${cohortFilter}`;
	const rombelLabel =
		rombelFilter === "all" ? "Semua Rombongan Belajar" : rombelFilter;
	const dayLabel = dayFilter === "all" ? "Semua Hari" : dayFilter;

	return (
		<div className="hidden print:block printable-area bg-white text-black w-full h-auto">
			{/* Aturan CSS khusus ukuran kertas A4 Portrait */}
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
								background: #ffffff !important;
								color: #000000 !important;
								-webkit-print-color-adjust: exact !important;
								print-color-adjust: exact !important;
							}
							.printable-area {
								width: 100% !important;
								max-width: 100% !important;
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

			{/* Kop Surat Resmi Nusadaya Academy */}
			<div className="flex items-center justify-between pb-2">
				<div className="flex items-center gap-3.5">
					<img
						src="/logonusadaya.png"
						alt="Logo Nusadaya Academy"
						className="h-14 w-auto object-contain shrink-0"
					/>
					<div>
						<h1 className="text-lg font-black uppercase tracking-wider text-black font-serif leading-tight">
							NUSADAYA ACADEMY
						</h1>
						<p className="text-[11px] font-bold text-neutral-900 tracking-wide leading-tight">
							Lembaga Pendidikan & Pelatihan Kerja Perhotelan dan Kapal Pesiar
						</p>
						<p className="text-[9.5px] text-neutral-700 leading-tight">
							Kampus Utama: Jl. Raya Dalung No. 88, Kuta Utara, Badung, Bali |
							Telp: (0361) 900-8888
						</p>
						<p className="text-[9px] text-neutral-600 leading-tight">
							Website: nusadayaacademy.sch.id | Email:
							akademik@nusadayaacademy.sch.id
						</p>
					</div>
				</div>
				<div className="text-right text-xs shrink-0 pl-2">
					<span className="inline-block px-2 py-0.5 border border-black font-bold uppercase text-[9px] tracking-widest bg-neutral-100">
						Dokumen Resmi
					</span>
					<p className="text-[10px] text-neutral-600 mt-1">
						Dicetak: {formattedDate}
					</p>
				</div>
			</div>

			{/* Double-Line Separator Garis Kop */}
			<div className="border-b-[2px] border-black mt-1 mb-[1.5px]" />
			<div className="border-b-[0.75px] border-black mb-3" />

			{/* Judul Dokumen & Metadata Filter */}
			<div className="text-center my-2.5">
				<h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest underline decoration-2 underline-offset-4">
					{title}
					{cohortFilter !== "all" && ` — ANGKATAN ${cohortFilter}`}
				</h2>
				<div className="flex flex-wrap justify-center items-center gap-2 text-[10.5px] mt-1.5 text-neutral-800 font-medium">
					<span>
						<strong>Rombel:</strong> {rombelLabel}
					</span>
					<span>•</span>
					<span>
						<strong>Angkatan:</strong> {cohortLabel}
					</span>
					{peminatanFilter !== "all" && (
						<>
							<span>•</span>
							<span>
								<strong>Peminatan:</strong> {peminatanFilter}
							</span>
						</>
					)}
					<span>•</span>
					<span>
						<strong>Hari:</strong> {dayLabel}
					</span>
					<span>•</span>
					<span>
						<strong>Total Sesi:</strong> {schedules.length} Sesi Terjadwal
					</span>
				</div>
			</div>

			{/* Tabel Jadwal Resmi A4 (Kolom Catatan Dihilangkan Sesuai Instruksi) */}
			<table className="w-full border-collapse border border-black text-xs mt-3">
				<thead>
					<tr className="bg-neutral-100 border-b border-black text-neutral-900 font-bold uppercase text-[10px] tracking-wider">
						<th className="border border-black px-1.5 py-1.5 text-center w-8">
							No
						</th>
						<th className="border border-black px-2 py-1.5 text-center w-16">
							Hari
						</th>
						<th className="border border-black px-2 py-1.5 text-center w-24 whitespace-nowrap">
							Waktu
						</th>
						<th className="border border-black px-2.5 py-1.5 text-left">
							Mata Kuliah
						</th>
						<th className="border border-black px-2.5 py-1.5 text-left">
							Dosen Pengampu
						</th>
						<th className="border border-black px-2 py-1.5 text-center w-24">
							Ruangan
						</th>
						<th className="border border-black px-1.5 py-1.5 text-center w-16">
							Rombel
						</th>
						<th className="border border-black px-1.5 py-1.5 text-center w-14">
							Angkatan
						</th>
					</tr>
				</thead>
				<tbody>
					{schedules.length === 0 ? (
						<tr>
							<td
								colSpan={8}
								className="border border-black px-4 py-8 text-center text-neutral-500 italic text-[11px]"
							>
								Tidak ada data jadwal kuliah untuk kriteria filter yang dipilih.
							</td>
						</tr>
					) : (
						schedules.map((item, idx) => {
							const dosenUtama =
								item.dosen?.fullName || item.dosen?.name || "-";
							const dosenPendamping =
								item.dosenPendamping?.fullName || item.dosenPendamping?.name;

							return (
								<tr
									key={item.id || idx}
									className={`break-inside-avoid ${idx % 2 === 1 ? "bg-neutral-50" : "bg-white"}`}
								>
									<td className="border border-black px-1.5 py-1.5 text-center font-medium text-[10px]">
										{idx + 1}
									</td>
									<td className="border border-black px-2 py-1.5 text-center font-semibold text-[10.5px]">
										{item.dayOfWeek}
									</td>
									<td className="border border-black px-2 py-1.5 text-center font-mono whitespace-nowrap text-[10px]">
										{item.startTime} - {item.endTime}
									</td>
									<td className="border border-black px-2.5 py-1.5 font-medium text-[11px] leading-snug">
										{item.courseCode ? (
											<span className="font-mono font-bold mr-1 text-[10px]">
												[{item.courseCode}]
											</span>
										) : null}
										<span>{item.subject}</span>
									</td>
									<td className="border border-black px-2.5 py-1.5 text-[10.5px]">
										<div className="font-semibold text-neutral-900 leading-snug">
											{dosenUtama}
										</div>
										{dosenPendamping && (
											<div className="text-[9.5px] text-neutral-600 font-normal italic mt-0.5">
												+ {dosenPendamping} (Pendamping)
											</div>
										)}
									</td>
									<td className="border border-black px-2 py-1.5 text-center font-medium text-[10px]">
										{item.room}
									</td>
									<td className="border border-black px-1.5 py-1.5 text-center text-[10px]">
										{item.rombel || "-"}
									</td>
									<td className="border border-black px-1.5 py-1.5 text-center font-medium text-[10px]">
										{item.cohort ? `Akt. ${item.cohort}` : "-"}
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>

			{/* Area Pengesahan Tanda Tangan Resmi */}
			<div className="mt-6 flex justify-between items-start text-xs break-inside-avoid">
				<div className="text-neutral-600 text-[9.5px] max-w-xs space-y-0.5">
					<p className="font-semibold text-neutral-800">
						Ketentuan Perkuliahan:
					</p>
					<p>
						1. Jadwal ini dapat berubah sewaktu-waktu sesuai dengan penyesuaian
						kalender akademik resmi.
					</p>
					<p>
						2. Mahasiswa dan Dosen Pengampu diharapkan hadir minimal 10 menit
						sebelum jam perkuliahan dimulai.
					</p>
					<p>
						3. Dokumen jadwal ini sah dan diterbitkan resmi oleh Bagian Akademik
						Nusadaya Academy.
					</p>
				</div>
				<div className="text-center w-52 shrink-0">
					<p className="text-[10.5px]">Badung, {formattedDate}</p>
					<p className="font-semibold text-[10.5px] mt-0.5">Mengetahui,</p>
					<p className="font-semibold text-[10.5px]">Kepala Bagian Akademik</p>
					<div className="h-14" />
					<p className="font-bold underline uppercase tracking-wider text-[11px]">
						( ............................................ )
					</p>
					<p className="text-[9.5px] text-neutral-500 mt-0.5">
						NIP / NIK. ....................................
					</p>
				</div>
			</div>
		</div>
	);
}
