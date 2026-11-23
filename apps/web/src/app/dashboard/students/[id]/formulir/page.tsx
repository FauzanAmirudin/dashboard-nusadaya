"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/eden";

/**
 * Formulir Pendaftaran siap cetak (A4, maks. 2 lembar) untuk ditandatangani
 * mahasiswa & orang tua/wali, lalu diunggah kembali ke berkas "Formulir Masuk".
 *
 * shortcut: kop surat masih placeholder (logo + nama kampus dari sistem),
 * kapan di-upgrade: ganti blok <KopSurat /> setelah kop resmi diterima dari kampus.
 */

type Row = [string, string | number | null | undefined];

const fmtDate = (v?: string | null) =>
	v
		? new Date(v).toLocaleDateString("id-ID", {
				day: "numeric",
				month: "long",
				year: "numeric",
			})
		: "";

function KopSurat() {
	return (
		<header className="flex items-center gap-4 border-b-2 border-slate-900 pb-3">
			<img src="/icon.svg" alt="" className="h-12 w-12 object-contain" />
			<div>
				<p className="text-[13pt] font-bold tracking-wide text-slate-900">
					NUSADAYA ACADEMY
				</p>
				<p className="text-[9pt] text-slate-600">
					Pendidikan Vokasi &amp; Magang Internasional
				</p>
			</div>
		</header>
	);
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
	return (
		<section className="mt-4 break-inside-avoid">
			<h2 className="mb-1.5 text-[10pt] font-bold uppercase tracking-wide text-slate-900">
				{title}
			</h2>
			<table className="w-full border-collapse text-[9.5pt]">
				<tbody>
					{rows.map(([label, value], i) => (
						<tr key={`${i}-${label}`} className="align-top">
							<td className="w-[38%] border border-slate-300 px-2 py-1 text-slate-600">
								{label}
							</td>
							<td className="border border-slate-300 px-2 py-1 text-slate-900">
								{value === null || value === undefined || value === ""
									? "-"
									: value}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
}

export default function CetakFormulirPage() {
	const params = useParams();
	const id = String(params.id);
	const [data, setData] = useState<any>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		api.students[id]
			.get()
			.then((res: any) => {
				if (res.data?.success && res.data.data) setData(res.data.data);
				else setError(true);
			})
			.catch(() => setError(true));
	}, [id]);

	if (error) {
		return (
			<p className="p-6 text-sm text-slate-600">
				Data mahasiswa tidak ditemukan.
			</p>
		);
	}
	if (!data) {
		return <p className="p-6 text-sm text-slate-500">Memuat formulir...</p>;
	}

	const s = data.student || {};
	const parents: any[] = data.parents || [];
	const byType = (t: string) => parents.find((p) => p.type === t) || {};
	const ayah = byType("ayah");
	const ibu = byType("ibu");
	const wali = byType("wali");
	const darurat: any[] = Array.isArray(s.emergencyContacts)
		? s.emergencyContacts
		: [];

	const alamat = [
		s.addressStreet,
		s.addressNo ? `No. ${s.addressNo}` : "",
		s.addressRt || s.addressRw
			? `RT ${s.addressRt || "-"}/RW ${s.addressRw || "-"}`
			: "",
		s.addressVillage,
		s.addressDistrict,
		s.addressCity,
		s.addressProvince,
	]
		.filter(Boolean)
		.join(", ");

	const parentRows = (label: string, p: any): Row[] => [
		[`Nama ${label}`, p.name],
		[
			`Keadaan / Kewarganegaraan ${label}`,
			[p.status, p.nationality].filter(Boolean).join(" / "),
		],
		[
			`Pekerjaan / No. HP ${label}`,
			[p.job, p.phone].filter(Boolean).join(" / "),
		],
	];

	return (
		<div className="mx-auto max-w-[210mm] space-y-4 pb-10 print:pb-0">
			<style>{"@page { size: A4; margin: 12mm; }"}</style>

			{/* Toolbar (tidak ikut tercetak) */}
			<div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
				<Link
					href={`/dashboard/students/${id}?tab=pmb`}
					className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 hover:text-slate-900"
				>
					← Kembali ke Panel PMB
				</Link>
				<Button
					onClick={() => window.print()}
					className="h-11 bg-[#0517B0] hover:bg-blue-800 text-white text-sm font-semibold"
				>
					Cetak / Simpan PDF
				</Button>
			</div>
			<p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
				Setelah ditandatangani mahasiswa dan orang tua/wali, unggah hasil
				pindaiannya ke berkas <strong>Formulir Masuk</strong> di tab Dokumen.
				Kop surat masih sementara dan akan diganti kop resmi kampus.
			</p>

			{/* Dokumen A4 */}
			<article className="bg-white p-[12mm] text-slate-900 shadow-sm ring-1 ring-slate-200 print:p-0 print:shadow-none print:ring-0">
				<KopSurat />

				<h1 className="mt-4 text-center text-[12pt] font-bold uppercase">
					Formulir Pendaftaran Mahasiswa Baru
				</h1>
				<p className="text-center text-[9pt] text-slate-600">
					Angkatan {s.cohort || "-"}
					{s.academicYear ? ` · Tahun Ajaran ${s.academicYear}` : ""}
				</p>

				<Section
					title="A. Data Diri"
					rows={[
						["Nama Lengkap", s.name],
						[
							"Tempat, Tanggal Lahir",
							[s.birthPlace, fmtDate(s.birthDate)].filter(Boolean).join(", "),
						],
						[
							"Jenis Kelamin / Agama",
							[s.gender, s.religion].filter(Boolean).join(" / "),
						],
						["Kewarganegaraan", s.nationality],
						["Alamat", alamat],
						["No. HP / Email", [s.phone, s.email].filter(Boolean).join(" / ")],
					]}
				/>

				<Section
					title="B. Pendidikan & Program"
					rows={[
						[
							"Pendidikan Terakhir / Asal Sekolah",
							[s.lastEducation, s.schoolOrigin].filter(Boolean).join(" / "),
						],
						[
							"Jurusan / Tahun Lulus",
							[s.schoolMajor, s.graduationYear].filter(Boolean).join(" / "),
						],
						["Pernah Kuliah", s.priorCollege],
						[
							"Program / Peminatan",
							[s.program, s.subProgram].filter(Boolean).join(" / "),
						],
						[
							"Kelas / Batch",
							[s.classType, s.batch ?? s.period].filter(Boolean).join(" / "),
						],
						["Negara Tujuan", s.destinationCountry],
					]}
				/>

				<Section
					title="C. Orang Tua / Wali"
					rows={[
						...parentRows("Ayah", ayah),
						...parentRows("Ibu", ibu),
						...(wali.name ? parentRows("Wali", wali) : []),
					]}
				/>

				<Section
					title="D. Kontak Darurat"
					rows={
						darurat.length
							? darurat
									.slice(0, 2)
									.map(
										(c, i): Row => [
											`Kontak ${i + 1}`,
											[c.name, c.relation, c.phone].filter(Boolean).join(" / "),
										],
									)
							: [["Kontak 1", ""]]
					}
				/>

				<section className="mt-5 break-inside-avoid text-[9.5pt]">
					<p>
						Dengan ini kami menyatakan bahwa data di atas benar, dan orang
						tua/wali menyetujui calon mahasiswa mengikuti program pendidikan dan
						magang di Nusadaya Academy.
					</p>
					<p className="mt-3 text-right">
						............................, ........................ 20.....
					</p>
					<div className="mt-3 grid grid-cols-3 gap-4 text-center">
						{["Calon Mahasiswa", "Orang Tua / Wali", "Petugas PMB"].map(
							(who) => (
								<div key={who}>
									<p>{who}</p>
									<div className="h-20" />
									<p className="border-t border-slate-900 pt-1">
										(.................................)
									</p>
								</div>
							),
						)}
					</div>
				</section>
			</article>
		</div>
	);
}
