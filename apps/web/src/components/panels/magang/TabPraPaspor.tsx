"use client";

import {
	CheckCircle,
	CheckCircle2,
	Clock,
	FileCheck,
	FolderCheck,
	GraduationCap,
	Info,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";

interface TabPraPasporProps {
	studentId: number;
	data: Record<string, unknown> | null;
	passportClearance: { isGapYear?: boolean } | null;
	canEdit: boolean;
	loadingItem?: string | null;
	handleToggleField: (field: string, value: unknown) => Promise<void> | void;
	fetchInternshipData: () => Promise<void>;
}

export function TabPraPaspor({
	studentId,
	data,
	passportClearance,
	canEdit,
	loadingItem = null,
	handleToggleField,
	fetchInternshipData,
}: TabPraPasporProps) {
	// Berkas Pra-Paspor Legalitas & Identitas (Segmen 19: SL-21 Hong Ta, Gap Year Flamboyan, LOS/SKMA Aktif)
	const docItems = [
		{
			label: "1. Pas Foto Terbaru",
			key: "praPasporPasFoto",
			docKey: "pas_foto",
			desc: "Pas foto formal ukuran paspor dengan latar belakang sesuai regulasi",
		},
		{
			label: "2. Kartu Tanda Mahasiswa (KTM)",
			key: "praPasporKtm",
			docKey: "ktm",
			desc: "Scan Kartu Tanda Mahasiswa aktif Nusadaya Academy",
		},
		{
			label: "3. Scan e-KTP",
			key: "praPasporKtp",
			docKey: "ktp",
			desc: "Scan e-KTP asli yang jelas, tidak buram, dan masih berlaku",
		},
		{
			label: "4. Scan Kartu Keluarga (KK)",
			key: "praPasporKk",
			docKey: "kk",
			desc: "Scan Kartu Keluarga terbaru yang terdaftar resmi di Disdukcapil",
		},
		{
			label: "5. Scan Akta Kelahiran",
			key: "praPasporAktaKelahiran",
			docKey: "akta_kelahiran",
			desc: "Scan Akta Kelahiran asli calon mahasiswa magang",
		},
		{
			label: "6. Surat Izin Orang Tua / Wali",
			key: "praPasporSuratIzinOrtu",
			docKey: "surat_izin_ortu",
			desc: "Scan Surat Izin Orang Tua / Wali resmi bermaterai",
		},
		{
			label: "7. Surat Pernyataan Usia >21 Tahun (SL-21)",
			key: "praPasporSl21",
			docKey: "sl21",
			badge: {
				text: "Khusus Mitra Hong Ta",
				className: "bg-indigo-50 text-indigo-700 border-indigo-200",
			},
			desc: "Surat pernyataan resmi usia dewasa di atas 21 tahun bermaterai, prasyarat khusus seleksi mitra Hong Ta Taiwan",
		},
		{
			label: "8. Surat Keterangan Riwayat Gap Year",
			key: "praPasporGapYear",
			docKey: "gap_year",
			badge: {
				text: "Khusus Mitra Flamboyan",
				className: "bg-amber-50 text-amber-800 border-amber-200",
			},
			desc: "Surat keterangan aktivitas & riwayat kelulusan masa gap year bermaterai, prasyarat khusus seleksi mitra Flamboyan Taiwan",
		},
		{
			label: "9. Letter of Student (LOS / SKMA Aktif)",
			key: "praPasporSkma",
			docKey: "los",
			badge: {
				text: "Wajib Imigrasi & Industri",
				className: "bg-emerald-50 text-emerald-700 border-emerald-200",
			},
			desc: "Letter of Student (LOS) resmi bertandatangan pimpinan kampus sebagai syarat verifikasi imigrasi dan seleksi industri luar negeri",
		},
		{
			label: "10. Surat Rekomendasi Disdik",
			key: "praPasporRekomendasiDisdik",
			docKey: "rekomendasi_disdik",
			desc: "Surat rekomendasi pembuatan paspor dari Dinas Pendidikan",
		},
		{
			label: "11. Ijazah Pendidikan Terakhir",
			key: "praPasporIjazah",
			docKey: "ijazah",
			desc: "Scan Ijazah pendidikan formal terakhir asli / legalisir",
		},
	];

	const completedCount = docItems.filter((item) => !!data?.[item.key]).length;
	const isAllClear = completedCount === docItems.length;

	return (
		<div className="space-y-6">
			{/* Info Box Pemisahan KHS & Transkrip */}
			<div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div className="flex items-start gap-3">
					<div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
						<GraduationCap className="w-4 h-4" />
					</div>
					<div>
						<h5 className="text-xs font-bold text-slate-800">
							Rekapitulasi KHS & Transkrip Nilai Dipisahkan
						</h5>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Untuk verifikasi nilai mata kuliah, IPK, SKS, dan unduh dokumen
							KHS/Transkrip seleksi industri, silakan periksa melalui tab{" "}
							<strong>KHS & Transkrip</strong>.
						</p>
					</div>
				</div>
				<div className="shrink-0 flex items-center gap-1.5">
					{data?.praPasporKhs && data?.praPasporTranskrip ? (
						<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
							✓ KHS & Transkrip Terhubung
						</Badge>
					) : (
						<Badge variant="outline" className="text-slate-400 text-[10px]">
							Periksa Tab KHS & Transkrip
						</Badge>
					)}
				</div>
			</div>

			{/* Main Card: Berkas Persyaratan Pra-Paspor */}
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<FolderCheck className="w-4 h-4 text-[#0517B0]" />
							Status Kelayakan Pra-Paspor & Dokumen Legalitas ({docItems.length}{" "}
							Berkas)
						</CardTitle>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Verifikasi berkas permohonan paspor, dokumen imigrasi, dan
							persyaratan bersyarat mitra penempatan luar negeri
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							className={`text-xs font-bold px-2.5 py-0.5 ${
								isAllClear
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: "bg-blue-50 text-[#0517B0] border-blue-200"
							}`}
						>
							{completedCount}/{docItems.length} Selesai
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="p-4 sm:p-5 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{docItems.map((item) => {
							const isChecked = Boolean(data?.[item.key]);
							const isLoading = loadingItem === item.key;

							return (
								<div
									key={item.key}
									className={`p-4 rounded-xl border transition-colors flex flex-col justify-between space-y-3 ${
										isChecked
											? "border-emerald-200 bg-emerald-50/20 shadow-xs"
											: "border-slate-200 bg-white shadow-xs"
									}`}
								>
									<div>
										<div className="flex items-start justify-between gap-3 mb-2">
											<div className="flex items-start gap-3">
												<Checkbox
													id={`chk-${item.key}`}
													checked={isChecked}
													disabled={!canEdit || isLoading}
													onCheckedChange={(checked) =>
														handleToggleField(item.key, !!checked)
													}
													className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
												/>
												<div>
													<div className="flex flex-wrap items-center gap-1.5">
														<label
															htmlFor={`chk-${item.key}`}
															className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
														>
															{item.label}
														</label>
														{item.badge && (
															<span
																className={`text-[9px] px-1.5 py-0.2 font-bold rounded-md border ${item.badge.className}`}
															>
																{item.badge.text}
															</span>
														)}
													</div>
													<p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
														{item.desc}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												{isLoading ? (
													<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
												) : isChecked ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
														✓ Selesai
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="text-slate-400 border-slate-200 text-[10px]"
													>
														Belum
													</Badge>
												)}
											</div>
										</div>
									</div>

									<div className="pt-3 border-t border-slate-100 mt-auto">
										<DocumentUpload
											studentId={studentId}
											panel="magang"
											documentKey={item.docKey}
											canEdit={canEdit}
											onUploadSuccess={fetchInternshipData}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
