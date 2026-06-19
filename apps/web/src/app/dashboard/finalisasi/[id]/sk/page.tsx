"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/eden";

export default function SuratKeputusanPage() {
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

			const pdf = new jsPDF({
				orientation: "portrait",
				unit: "mm",
				format: "a4",
			});

			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;

			pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
			pdf.save(
				`SK_Keberangkatan_${data?.student?.nim}_${data?.student?.name.replace(/\s+/g, "_")}.pdf`,
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

	if (!data?.decision?.isApprovedByDirector) {
		return (
			<div className="p-10 text-center text-rose-500">
				Dokumen tidak valid atau persetujuan direktur belum diberikan.
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

	return (
		<div className="min-h-screen bg-slate-100 p-8 font-serif print:p-0 print:bg-white text-black">
			{/* Controls (Hidden when printing) */}
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
					{isDownloading ? "Memproses..." : "Download SK (PDF)"}
				</button>
			</div>

			{/* A4 Paper Container */}
			<div className="max-w-4xl mx-auto shadow-lg print:shadow-none print:max-w-full">
				<div id="pdf-content" className="bg-white p-12">
					{/* Header */}
					<div className="border-b-2 border-black pb-6 mb-8 text-center flex flex-col items-center justify-center relative">
						{/* Placeholder for Logo if any */}
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
						<h2 className="text-xl font-bold uppercase underline">
							Surat Keputusan Kelayakan Berangkat
						</h2>
						<p className="mt-2">
							No: SK/{s.nim}/{new Date().getFullYear()}/
							{(Math.random() * 1000).toFixed(0).padStart(3, "0")}
						</p>
					</div>

					{/* Content */}
					<div className="space-y-6 leading-relaxed text-justify">
						<p>
							Berdasarkan hasil evaluasi akhir yang dilakukan oleh Tim Evaluator
							dan Persetujuan Direktur Nusadaya Academy, maka yang bertanda
							tangan di bawah ini menerangkan bahwa mahasiswa:
						</p>

						<div className="pl-8">
							<table className="w-full">
								<tbody>
									<tr>
										<td className="w-48 py-1 font-semibold">Nama Lengkap</td>
										<td className="w-4">:</td>
										<td>{s.name}</td>
									</tr>
									<tr>
										<td className="py-1 font-semibold">
											Nomor Induk Mahasiswa
										</td>
										<td>:</td>
										<td>{s.nim}</td>
									</tr>
									<tr>
										<td className="py-1 font-semibold">Program / Jurusan</td>
										<td>:</td>
										<td>{s.program}</td>
									</tr>
									<tr>
										<td className="py-1 font-semibold">Angkatan</td>
										<td>:</td>
										<td>{s.cohort}</td>
									</tr>
									<tr>
										<td className="py-1 font-semibold">Negara Tujuan</td>
										<td>:</td>
										<td>{s.destinationCountry || "-"}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<p>
							Telah dinyatakan <strong>MEMENUHI SELURUH PERSYARATAN</strong>{" "}
							administrasi, akademik, kedisiplinan, keuangan, dan dokumentasi.
							Oleh karena itu, mahasiswa yang bersangkutan dinyatakan:
						</p>

						<div className="text-center py-6 text-2xl font-bold uppercase tracking-widest border-2 border-black mx-12">
							LAYAK BERANGKAT
						</div>

						<p>
							Status persetujuan akhir telah diverifikasi dengan detail sebagai
							berikut:
						</p>

						<div className="pl-8">
							<ul className="list-disc space-y-1">
								<li>
									Persetujuan Divisi PMB:{" "}
									<span className="font-semibold">
										{data.pmb?.isAcc ? "Tuntas" : "-"}
									</span>
								</li>
								<li>
									Persetujuan Divisi Akademik:{" "}
									<span className="font-semibold">
										{data.academic?.isAcc ? "Tuntas" : "-"}
									</span>
								</li>
								<li>
									Persetujuan Divisi Finance:{" "}
									<span className="font-semibold">
										{data.finance?.isAcc ? "Tuntas" : "-"}
									</span>
								</li>
								<li>
									Persetujuan Divisi CRM:{" "}
									<span className="font-semibold">
										{data.crm?.isAcc ? "Tuntas" : "-"}
									</span>
								</li>
								<li>
									Persetujuan Divisi PA & Magang:{" "}
									<span className="font-semibold">Tuntas</span>
								</li>
							</ul>
						</div>

						{d.departureDate && (
							<p>
								Adapun rencana keberangkatan dijadwalkan pada:{" "}
								<strong>
									{new Date(d.departureDate).toLocaleDateString("id-ID", {
										weekday: "long",
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</strong>
								.
							</p>
						)}

						{d.notes && (
							<div className="bg-slate-50 p-4 border border-slate-200 print:border-black print:bg-transparent rounded-md mt-4">
								<strong>Catatan Direktur:</strong>
								<p className="mt-1">{d.notes}</p>
							</div>
						)}

						<p>
							Demikian Surat Keputusan ini dibuat agar dapat dipergunakan
							sebagaimana mestinya.
						</p>
					</div>

					{/* Signature */}
					<div className="mt-20 flex justify-end">
						<div className="text-center w-64">
							<p className="mb-24">
								Ditetapkan pada tanggal: <br />
								<strong>
									{d.updatedAt
										? new Date(d.updatedAt).toLocaleDateString("id-ID", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})
										: new Date().toLocaleDateString("id-ID", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
								</strong>
							</p>
							<p className="font-bold underline">Direktur Nusadaya Academy</p>
						</div>
					</div>
				</div>
			</div>

			<style jsx global>{`
				@media print {
					@page { size: auto;  margin: 0mm; }
					body { background-color: white; -webkit-print-color-adjust: exact; }
				}
			`}</style>
		</div>
	);
}
