"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/eden";

export default function DataFinalisasiPrintPage() {
	const params = useParams();
	const router = useRouter();
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownloadPDF = async () => {
		setIsDownloading(true);
		try {
			const { toPng } = await import("html-to-image");
			const { default: jsPDF } = await import("jspdf");

			const element = document.getElementById("pdf-content");
			if (!element) return;

			// Convert HTML to PNG using browser's native rendering
			const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2 });

			// A4 size: 210mm x 297mm
			const pdf = new jsPDF({
				orientation: "portrait",
				unit: "mm",
				format: "a4",
			});

			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

			pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
			pdf.save(
				`Data_Finalisasi_${data?.student?.nim}_${data?.student?.name.replace(/\s+/g, "_")}.pdf`,
			);
		} catch (error) {
			console.error("Failed to generate PDF", error);
		} finally {
			setIsDownloading(false);
		}
	};

	useEffect(() => {
		const fetchStudent = async () => {
			const { data: resData, error } =
				await api.students[params.id as string].get();
			if (!error && resData?.data) {
				setData(resData.data);
			}
			setIsLoading(false);
		};
		fetchStudent();
	}, [params.id]);

	if (isLoading) {
		return <div className="p-10 text-center">Menyiapkan dokumen...</div>;
	}

	if (!data) {
		return (
			<div className="p-10 text-center text-rose-500">
				Data tidak ditemukan.
				<br />
				<button
					onClick={() => router.back()}
					className="text-blue-500 underline mt-4"
				>
					Kembali
				</button>
			</div>
		);
	}

	const s = data.student;
	const d = data.decision;

	const dosenIsAcc = Boolean(
		data.courseGrades &&
			data.courseGrades.length > 0 &&
			data.courseGrades.every((g: any) => g.isAcc),
	);
	const dosenAccAt = dosenIsAcc
		? new Date(
				Math.max(
					...data.courseGrades.map((g: any) =>
						new Date(g.accAt || 0).getTime(),
					),
				),
			).toLocaleDateString("id-ID")
		: "-";

	return (
		<div className="min-h-screen bg-slate-100 p-8 font-serif print:p-0 print:bg-white text-black">
			{/* Controls */}
			<div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
				>
					<ArrowLeft className="w-4 h-4" /> Kembali
				</button>
				<button
					onClick={handleDownloadPDF}
					disabled={isDownloading}
					className="flex items-center gap-2 bg-[#0517B0] text-white px-6 py-2 rounded-md shadow hover:bg-blue-800 disabled:opacity-50"
				>
					<Printer className="w-4 h-4" />{" "}
					{isDownloading ? "Memproses..." : "Download PDF"}
				</button>
			</div>

			{/* A4 Paper Container */}
			<div className="max-w-4xl mx-auto shadow-lg print:shadow-none print:max-w-full">
				<div id="pdf-content" className="bg-white p-12">
					{/* Header */}
					<div className="border-b-2 border-black pb-6 mb-8 text-center flex flex-col items-center justify-center">
						<h1 className="text-3xl font-bold uppercase tracking-wider">
							Nusadaya Academy
						</h1>
						<p className="text-lg mt-1">
							Lembaga Pelatihan Kerja Perhotelan & Kapal Pesiar
						</p>
						<p className="text-sm">
							Jl. Contoh Alamat No. 123, Kota, Provinsi, 12345
						</p>
					</div>

					{/* Title */}
					<div className="text-center mb-10">
						<h2 className="text-2xl font-bold uppercase underline mb-2">
							Rekap Data Finalisasi Keberangkatan
						</h2>
						<p className="mt-2 text-slate-600">
							Dicetak pada:{" "}
							{new Date().toLocaleDateString("id-ID", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</p>
					</div>

					{/* Content */}
					<div className="space-y-8 leading-relaxed">
						{/* Profil Singkat */}
						<div>
							<h3 className="font-bold text-lg bg-slate-100 px-3 py-1 mb-4 print:border-b print:border-black print:bg-transparent">
								A. Profil Kandidat
							</h3>
							<div className="pl-4">
								<table className="w-full">
									<tbody>
										<tr>
											<td className="w-48 py-2 font-semibold">Nama Lengkap</td>
											<td className="w-4">:</td>
											<td>{s.name}</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold">NIM</td>
											<td>:</td>
											<td>{s.nim}</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold">Program / Jurusan</td>
											<td>:</td>
											<td>{s.program}</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold">Angkatan</td>
											<td>:</td>
											<td>{s.cohort}</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold">Negara Tujuan</td>
											<td>:</td>
											<td>{s.destinationCountry || "-"}</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold">Periode</td>
											<td>:</td>
											<td>{s.period || "-"}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* Status Sistem */}
						<div>
							<h3 className="font-bold text-lg bg-slate-100 px-3 py-1 mb-4 print:border-b print:border-black print:bg-transparent">
								B. Status Kelengkapan Divisi
							</h3>
							<div className="pl-4">
								<table className="w-full text-sm sm:text-base border-collapse">
									<thead>
										<tr className="border-b-2 border-black">
											<th className="text-left py-2 font-semibold w-1/2">
												Nama Divisi
											</th>
											<th className="text-center py-2 font-semibold w-1/4">
												Status ACC
											</th>
											<th className="text-center py-2 font-semibold w-1/4">
												Tanggal ACC
											</th>
										</tr>
									</thead>
									<tbody>
										<tr className="border-b border-slate-200">
											<td className="py-2">Divisi PMB</td>
											<td className="text-center font-semibold">
												{data.pmb?.isAcc ? "Tuntas" : "-"}
											</td>
											<td className="text-center">
												{data.pmb?.accAt
													? new Date(data.pmb.accAt).toLocaleDateString("id-ID")
													: "-"}
											</td>
										</tr>
										<tr className="border-b border-slate-200">
											<td className="py-2">Divisi CRM</td>
											<td className="text-center font-semibold">
												{data.crm?.isAcc ? "Tuntas" : "-"}
											</td>
											<td className="text-center">
												{data.crm?.accAt
													? new Date(data.crm.accAt).toLocaleDateString("id-ID")
													: "-"}
											</td>
										</tr>
										<tr className="border-b border-slate-200">
											<td className="py-2">Divisi Finance</td>
											<td className="text-center font-semibold">
												{data.finance?.isAcc ? "Tuntas" : "-"}
											</td>
											<td className="text-center">
												{data.finance?.accAt
													? new Date(data.finance.accAt).toLocaleDateString(
															"id-ID",
														)
													: "-"}
											</td>
										</tr>
										<tr className="border-b border-slate-200">
											<td className="py-2">Divisi Akademik</td>
											<td className="text-center font-semibold">
												{data.academic?.isAcc ? "Tuntas" : "-"}
											</td>
											<td className="text-center">
												{data.academic?.accAt
													? new Date(data.academic.accAt).toLocaleDateString(
															"id-ID",
														)
													: "-"}
											</td>
										</tr>
										<tr className="border-b border-slate-200">
											<td className="py-2">Dosen Mata Kuliah</td>
											<td className="text-center font-semibold">
												{dosenIsAcc ? "Tuntas" : "-"}
											</td>
											<td className="text-center">{dosenAccAt}</td>
										</tr>
										<tr className="border-b border-slate-200">
											<td className="py-2">Pembimbing Akademik (PA)</td>
											<td className="text-center font-semibold">
												{data.pa?.isAcc ? "Tuntas" : "-"}
											</td>
											<td className="text-center">
												{data.pa?.accAt
													? new Date(data.pa.accAt).toLocaleDateString("id-ID")
													: "-"}
											</td>
										</tr>
										<tr className="border-b border-slate-200">
											<td className="py-2">Divisi Magang</td>
											<td className="text-center font-semibold">
												{data.internship?.isAcc ? "Tuntas" : "-"}
											</td>
											<td className="text-center">
												{data.internship?.accAt
													? new Date(data.internship.accAt).toLocaleDateString(
															"id-ID",
														)
													: "-"}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* Persetujuan Akhir */}
						<div>
							<h3 className="font-bold text-lg bg-slate-100 px-3 py-1 mb-4 print:border-b print:border-black print:bg-transparent">
								C. Rekap Persetujuan Akhir
							</h3>
							<div className="pl-4">
								<table className="w-full">
									<tbody>
										<tr>
											<td className="w-64 py-2 font-semibold">
												Status Sistem Utama
											</td>
											<td className="w-4">:</td>
											<td className="font-bold uppercase tracking-wider">
												{s.overallStatus}
											</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold">
												Keputusan Evaluator
											</td>
											<td>:</td>
											<td className="font-bold">Layak Berangkat</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold">
												Persetujuan Direktur
											</td>
											<td>:</td>
											<td className="font-bold">
												{d?.isApprovedByDirector || s.overallStatus === "AMAN"
													? "DITERIMA"
													: "MENUNGGU"}
											</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold">
												Rencana Keberangkatan
											</td>
											<td>:</td>
											<td>
												{d?.departureDate
													? new Date(d.departureDate).toLocaleDateString(
															"id-ID",
															{
																weekday: "long",
																year: "numeric",
																month: "long",
																day: "numeric",
															},
														)
													: "Belum ditentukan"}
											</td>
										</tr>
										<tr>
											<td className="py-2 font-semibold align-top">
												Catatan Tambahan
											</td>
											<td className="align-top">:</td>
											<td>
												<div className="p-3 bg-slate-50 border border-slate-200 min-h-20 print:border-black print:bg-transparent rounded-md">
													{d?.notes || "-"}
												</div>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<div className="mt-20 text-xs text-slate-500 print:text-black flex justify-between items-end border-t border-slate-200 pt-4">
						<p>
							Dokumen Internal Nusadaya Academy. Data valid sesuai sistem pada
							saat dicetak.
						</p>
						<p>
							ID Referensi: REF-{s.id}-{Date.now().toString().slice(-6)}
						</p>
					</div>
				</div>
			</div>

			<style jsx global>{`
				@media print {
					@page { size: auto; margin: 0mm; }
					body { background-color: white; -webkit-print-color-adjust: exact; }
				}
			`}</style>
		</div>
	);
}
