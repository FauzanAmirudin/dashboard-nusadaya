"use client";

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { parseEmergencyContacts } from "@/lib/emergency-contacts";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Data = Record<string, any>;

const fmtDate = (v: unknown) => {
	if (!v) return "-";
	const d = new Date(String(v));
	return Number.isNaN(d.getTime())
		? "-"
		: d.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});
};

const val = (v: unknown) => {
	const t = v === null || v === undefined ? "" : String(v).trim();
	return t || "-";
};

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="mt-4 break-inside-avoid">
			<h2 className="mb-1 border-b border-slate-400 pb-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-800">
				{title}
			</h2>
			{children}
		</section>
	);
}

function Rows({ rows }: { rows: Array<[string, unknown]> }) {
	return (
		<table className="w-full text-[11px] leading-snug">
			<tbody>
				{rows.map(([label, value]) => (
					<tr key={label} className="align-top">
						<td className="w-[34%] py-0.5 pr-2 text-slate-600">{label}</td>
						<td className="w-3 py-0.5">:</td>
						<td className="py-0.5 font-medium text-slate-900 [overflow-wrap:anywhere]">
							{val(value)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

function Signature({ title, name }: { title: string; name?: string }) {
	return (
		<div className="text-center">
			<p className="mb-14 text-[11px] text-slate-700">{title}</p>
			<div className="mx-4 border-b border-slate-700" />
			<p className="mt-1 text-[11px] font-medium text-slate-900">
				{name ? `( ${name} )` : "( ........................ )"}
			</p>
		</div>
	);
}

/** Dokumen A4 formulir pendaftaran: isi dari respons form, siap ditandatangani. */
export function RegistrationFormDocument({ data }: { data: Data }) {
	const x: Data = data.extraData || {};
	const address = [
		data.addressStreet,
		data.addressNo && `No. ${data.addressNo}`,
		(data.addressRt || data.addressRw) &&
			`RT ${val(data.addressRt)}/RW ${val(data.addressRw)}`,
		data.addressVillage,
		data.addressDistrict,
		data.addressCity,
		data.addressProvince,
	]
		.filter(Boolean)
		.join(", ");

	const parent = (key: "ayah" | "ibu" | "wali", income?: string) => ({
		name: data[`${key}Name`],
		ttl: [data[`${key}BirthPlace`], fmtDate(data[`${key}BirthDate`])]
			.filter((v) => v && v !== "-")
			.join(", "),
		job: data[`${key}Job`],
		income,
		education: data[`${key}Education`],
		phone: data[`${key}Phone`],
		email: data[`${key}Email`],
		status: data[`${key}Status`] || data[`${key}GuardianRelation`],
	});
	const parents = [
		["Ayah", parent("ayah", x.ayahIncome)],
		["Ibu", parent("ibu", x.ibuIncome)],
		["Wali", parent("wali", x.waliIncome)],
	] as const;

	const emergency = parseEmergencyContacts(data).filter(
		(c) => c.name || c.phone,
	);
	const friends: Array<Record<string, string>> = Array.isArray(
		data.friendContacts,
	)
		? data.friendContacts
		: [];

	const guardianName = data.ayahName || data.waliName || data.ibuName;

	return (
		<div className="min-h-screen bg-slate-100 py-6 print:min-h-0 print:bg-white print:py-0">
			<style>{"@page { size: A4; margin: 14mm; }"}</style>

			<div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4 print:hidden">
				<p className="text-xs text-slate-500">
					Klik tombol, lalu pilih <strong>Simpan sebagai PDF</strong> pada
					jendela cetak.
				</p>
				<Button
					onClick={() => window.print()}
					className="shrink-0 gap-2 bg-[#0517B0] hover:bg-blue-800 cursor-pointer"
				>
					<Printer className="h-4 w-4" />
					Cetak / Simpan PDF
				</Button>
			</div>

			<article className="printable-area mx-auto max-w-[210mm] bg-white p-[14mm] shadow-sm print:max-w-none print:p-0 print:shadow-none">
				{/* Kop */}
				<div className="flex items-center gap-3 border-b-2 border-slate-800 pb-3">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/icon.svg" alt="" className="h-10 w-10 object-contain" />
					<div>
						<p className="text-base font-bold leading-tight text-slate-900">
							OneData <span className="font-light">Nusadaya</span>
						</p>
						<p className="text-[11px] text-slate-600">
							Formulir Pendaftaran Mahasiswa Baru
						</p>
					</div>
					<div className="ml-auto text-right text-[10px] text-slate-500">
						<p>Tanggal isi: {fmtDate(data.submittedAt || new Date())}</p>
						{data.id && <p>No. Formulir: #{data.id}</p>}
					</div>
				</div>

				<Section title="A. Data Mahasiswa">
					<Rows
						rows={[
							["Nama Lengkap", data.name],
							["Nama Panggilan", data.nickname],
							[
								"Tempat, Tanggal Lahir",
								`${val(data.birthPlace)}, ${fmtDate(data.birthDate)}`,
							],
							["Jenis Kelamin", data.gender],
							["Agama", data.religion],
							["Kewarganegaraan", data.nationality],
							["Alamat", address],
							["Tinggal Dengan", data.livingWith],
							["No. HP / WhatsApp", data.phone],
							["Email", data.email],
						]}
					/>
				</Section>

				<Section title="B. Pendidikan">
					<Rows
						rows={[
							[
								"Program / Peminatan",
								[data.program, data.subProgram].filter(Boolean).join(" / "),
							],
							["Pilihan Kelas", data.classType],
							[
								"Angkatan / Tahun Ajaran",
								`${val(data.batch)} / ${val(data.academicYear)}`,
							],
							["Batch Pendaftaran", data.period],
							["Pendidikan Terakhir", x.lastEducation],
							["Sekolah Asal", data.schoolOrigin],
							[
								"Jurusan / Tahun Lulus",
								`${val(data.schoolMajor)} / ${val(data.graduationYear)}`,
							],
							[
								"Pernah Kuliah",
								x.priorCollege ? `Pernah — ${x.priorCollege}` : "Belum pernah",
							],
						]}
					/>
				</Section>

				<Section title="C. Kesehatan">
					<Rows
						rows={[
							[
								"Golongan Darah / Ukuran Baju",
								`${val(data.bloodType)} / ${val(data.clothingSize)}`,
							],
							[
								"Tinggi / Berat Badan",
								`${data.height ? `${data.height} cm` : "-"} / ${data.weight ? `${data.weight} kg` : "-"}`,
							],
							["Riwayat Penyakit", data.diseaseHistory],
							["Penyakit Bawaan", data.congenitalDisease],
							[
								"Patah Tulang",
								x.hasBoneFracture
									? `Pernah — ${val(x.boneFractureLocation)} (${val(x.boneFractureYear)})`
									: "Tidak pernah",
							],
							[
								"Operasi",
								x.hasSurgery
									? `Pernah — ${val(x.surgeryType)} (${val(x.surgeryYear)})`
									: "Tidak pernah",
							],
						]}
					/>
				</Section>

				<Section title="D. Orang Tua / Wali">
					<table className="w-full border-collapse text-[11px] leading-snug">
						<thead>
							<tr className="bg-slate-100 text-left">
								<th className="border border-slate-300 px-1.5 py-1 w-[22%]" />
								{parents.map(([label]) => (
									<th
										key={label}
										className="border border-slate-300 px-1.5 py-1"
									>
										{label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{(
								[
									["Nama", "name"],
									["Tempat, Tgl Lahir", "ttl"],
									["Keadaan / Hubungan", "status"],
									["Pendidikan", "education"],
									["Pekerjaan", "job"],
									["Rentang Pendapatan", "income"],
									["No. HP", "phone"],
									["Email", "email"],
								] as const
							).map(([label, key]) => (
								<tr key={key} className="align-top">
									<td className="border border-slate-300 px-1.5 py-1 text-slate-600">
										{label}
									</td>
									{parents.map(([who, p]) => (
										<td
											key={who}
											className="border border-slate-300 px-1.5 py-1 font-medium [overflow-wrap:anywhere]"
										>
											{val((p as any)[key])}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</Section>

				<Section title="E. Kontak Darurat">
					<table className="w-full border-collapse text-[11px]">
						<thead>
							<tr className="bg-slate-100 text-left">
								<th className="w-6 border border-slate-300 px-1.5 py-1 text-center">
									No
								</th>
								<th className="border border-slate-300 px-1.5 py-1">Nama</th>
								<th className="border border-slate-300 px-1.5 py-1">
									No. WhatsApp
								</th>
								<th className="border border-slate-300 px-1.5 py-1">
									Hubungan
								</th>
							</tr>
						</thead>
						<tbody>
							{emergency.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="border border-slate-300 px-1.5 py-1"
									>
										-
									</td>
								</tr>
							)}
							{emergency.map((c, i) => (
								<tr key={i}>
									<td className="w-6 border border-slate-300 px-1.5 py-1 text-center">
										{i + 1}
									</td>
									<td className="border border-slate-300 px-1.5 py-1 font-medium">
										{val(c.name)}
									</td>
									<td className="border border-slate-300 px-1.5 py-1">
										{val(c.phone)}
									</td>
									<td className="border border-slate-300 px-1.5 py-1">
										{val(c.relation)}
										{c.note ? ` — ${c.note}` : ""}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</Section>

				<Section title="F. Referral & Rekomendasi">
					<Rows
						rows={[
							[
								"Direkomendasikan oleh",
								[data.recommendedBy, data.recommenderName]
									.filter(Boolean)
									.join(" — "),
							],
							[
								"Asal Referral",
								[data.referralInstitutionName, data.referralContactName]
									.filter(Boolean)
									.join(" — "),
							],
						]}
					/>
					{friends.length > 0 && (
						<table className="mt-2 w-full border-collapse text-[11px]">
							<thead>
								<tr className="bg-slate-100 text-left">
									<th className="w-6 border border-slate-300 px-1.5 py-1">#</th>
									<th className="border border-slate-300 px-1.5 py-1">
										Kontak Prospek
									</th>
									<th className="border border-slate-300 px-1.5 py-1">
										No. WhatsApp
									</th>
									<th className="border border-slate-300 px-1.5 py-1">
										Asal / Hubungan
									</th>
								</tr>
							</thead>
							<tbody>
								{friends.map((f, i) => (
									<tr key={i}>
										<td className="border border-slate-300 px-1.5 py-1 text-center">
											{i + 1}
										</td>
										<td className="border border-slate-300 px-1.5 py-1 font-medium">
											{val(f.name)}
										</td>
										<td className="border border-slate-300 px-1.5 py-1">
											{val(f.phone)}
										</td>
										<td className="border border-slate-300 px-1.5 py-1">
											{val(f.schoolOrRelation || f.school_or_relation)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</Section>

				<Section title="G. Pernyataan">
					<p className="text-[11px] leading-relaxed text-slate-800">
						Saya menyatakan bahwa seluruh data pada formulir ini adalah benar
						dan dapat dipertanggungjawabkan. Apabila di kemudian hari ditemukan
						ketidaksesuaian, saya bersedia menerima konsekuensi sesuai ketentuan
						yang berlaku di OneData Nusadaya.
					</p>
				</Section>

				<div className="mt-4 break-inside-avoid">
					<p className="mb-2 text-right text-[11px] text-slate-700">
						................................, ........................ 20....
					</p>
					<div className="grid grid-cols-3 gap-4">
						<Signature title="Calon Mahasiswa" name={data.name} />
						<Signature title="Orang Tua / Wali" name={guardianName} />
						<Signature title="Petugas PMB" />
					</div>
				</div>
			</article>
		</div>
	);
}
