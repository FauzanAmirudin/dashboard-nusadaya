"use client";

import {
	Briefcase,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	Globe,
	Info,
	Loader2,
	MapPin,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface TabPenempatanProps {
	studentId: number;
	data: Record<string, unknown> | null;
	canEdit: boolean;
	loadingItem?: string | null;
	handleToggleField: (field: string, value: unknown) => Promise<void> | void;
	handleLocalChange: (field: string, value: unknown) => void;
	handleBlurField: (field: string) => Promise<void> | void;
	fetchInternshipData: () => Promise<void>;
}

export function TabPenempatan({
	studentId,
	data,
	canEdit,
	loadingItem = null,
	handleToggleField,
	handleLocalChange,
	handleBlurField,
	fetchInternshipData,
}: TabPenempatanProps) {
	const isVerified = Boolean(data?.agenReady);
	const isLoading = loadingItem === "agenReady";

	// 5 Departemen Utama Perhotelan sesuai mandat Notula Segmen 21
	const DEPARTEMEN_OPTIONS = [
		{ value: "HK", label: "HK — Housekeeping (Tata Graha)" },
		{ value: "FBS", label: "FBS — Food & Beverage Service (Layanan Restoran)" },
		{
			value: "FBP",
			label: "FBP — Food & Beverage Product (Tata Boga & Dapur)",
		},
		{ value: "FO", label: "FO — Front Office (Kantor Depan & Tamu)" },
		{ value: "Barista", label: "Barista — Spesialis Kopi & Minuman" },
	];

	// Rekomendasi Mitra Penempatan Terdaftar Nusadaya
	const MITRA_OPTIONS = [
		"Hong Ta (Taiwan)",
		"Flamboyan (Taiwan)",
		"Prince International (Malaysia)",
		"MBM (Malaysia)",
		"Mitra Mandiri Kampus",
	];

	const DURASI_OPTIONS = [
		"6 Bulan",
		"12 Bulan (1 Tahun)",
		"18 Bulan",
		"24 Bulan (2 Tahun)",
	];

	const NEGARA_OPTIONS = [
		"Taiwan",
		"Malaysia",
		"Jepang",
		"Timur Tengah",
		"Lainnya",
	];

	return (
		<div className="space-y-6">
			{/* Banner Notula Info */}
			<div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3.5">
				<div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
					<Building2 className="w-5 h-5" />
				</div>
				<div className="space-y-1">
					<h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
						Standarisasi Penempatan Magang & Mitra Penempatan (Segmen 21)
					</h4>
					<p className="text-xs text-blue-800 leading-relaxed">
						Berdasarkan hasil evaluasi rapat institusi, istilah agen sponsor
						distandarisasi menjadi <strong>Mitra Penempatan</strong>. Peminatan
						kerja dikunci langsung ke dalam <strong>5 Departemen Utama</strong>{" "}
						(HK, FBS, FBP, FO, dan Barista) serta penyediaan slot dokumen
						tambahan spesifik sebelum penerbitan visa.
					</p>
				</div>
			</div>

			{/* Main Form Card: Informasi Penempatan */}
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<MapPin className="w-4 h-4 text-[#0517B0]" />
							Detail Penempatan Magang & Lokasi Industri
						</CardTitle>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Konfigurasi data hotel/mitra kerja, kota tujuan, durasi magang,
							dan departemen peminatan
						</p>
					</div>
					<div className="flex items-center gap-2">
						{isVerified ? (
							<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold gap-1">
								<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
								Penempatan Terverifikasi
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 bg-white border-slate-200 text-xs font-semibold gap-1"
							>
								<Clock className="w-3.5 h-3.5 text-amber-500" />
								Menunggu Verifikasi
							</Badge>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-4 sm:p-5 space-y-5">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* 1. Mitra Penempatan */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
								<Briefcase className="w-3.5 h-3.5 text-[#0517B0]" />
								Mitra Penempatan
							</Label>
							<div className="space-y-1">
								<Input
									placeholder="Contoh: Hong Ta / Flamboyan / MBM"
									className="h-9 text-xs bg-white border-slate-200"
									value={
										(data?.mitraPenempatanNama as string) ||
										(data?.internshipCompany as string) ||
										""
									}
									disabled={!canEdit}
									onChange={(e) => {
										handleLocalChange("mitraPenempatanNama", e.target.value);
										handleLocalChange("internshipCompany", e.target.value);
									}}
									onBlur={() => {
										handleBlurField("mitraPenempatanNama");
										handleBlurField("internshipCompany");
									}}
								/>
								<div className="flex flex-wrap gap-1 mt-1">
									{MITRA_OPTIONS.slice(0, 4).map((m) => (
										<button
											type="button"
											key={m}
											disabled={!canEdit}
											onClick={() => {
												handleLocalChange("mitraPenempatanNama", m);
												handleBlurField("mitraPenempatanNama");
											}}
											className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-colors"
										>
											{m.split(" ")[0]}
										</button>
									))}
								</div>
							</div>
						</div>

						{/* 2. Nama Hotel / Perusahaan Tempat Magang */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
								<Building2 className="w-3.5 h-3.5 text-indigo-600" />
								Nama Hotel / Perusahaan
							</Label>
							<Input
								placeholder="Contoh: Grand Hyatt Taipei / Sheraton Taichung"
								className="h-9 text-xs bg-white border-slate-200"
								value={(data?.internshipCompany as string) || ""}
								disabled={!canEdit}
								onChange={(e) =>
									handleLocalChange("internshipCompany", e.target.value)
								}
								onBlur={() => handleBlurField("internshipCompany")}
							/>
						</div>

						{/* 3. Negara Tujuan */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
								<Globe className="w-3.5 h-3.5 text-sky-600" />
								Negara Tujuan
							</Label>
							<Select
								value={(data?.agenNegaraTujuan as string) || "Taiwan"}
								disabled={!canEdit}
								onValueChange={(val) => {
									handleLocalChange("agenNegaraTujuan", val);
									handleToggleField("agenNegaraTujuan", val);
								}}
							>
								<SelectTrigger className="h-9 text-xs bg-white border-slate-200">
									<SelectValue placeholder="Pilih Negara Tujuan" />
								</SelectTrigger>
								<SelectContent>
									{NEGARA_OPTIONS.map((c) => (
										<SelectItem key={c} value={c}>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 4. Kota Tujuan */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
								<MapPin className="w-3.5 h-3.5 text-rose-500" />
								Kota Tujuan Penempatan
							</Label>
							<Input
								placeholder="Contoh: Taipei / Taichung / Kaohsiung / KL"
								className="h-9 text-xs bg-white border-slate-200"
								value={(data?.destinationCity as string) || ""}
								disabled={!canEdit}
								onChange={(e) =>
									handleLocalChange("destinationCity", e.target.value)
								}
								onBlur={() => handleBlurField("destinationCity")}
							/>
						</div>

						{/* 5. Durasi Masa Magang */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
								<Clock className="w-3.5 h-3.5 text-amber-600" />
								Durasi Magang
							</Label>
							<Select
								value={
									(data?.internshipDuration as string) || "12 Bulan (1 Tahun)"
								}
								disabled={!canEdit}
								onValueChange={(val) => {
									handleLocalChange("internshipDuration", val);
									handleToggleField("internshipDuration", val);
								}}
							>
								<SelectTrigger className="h-9 text-xs bg-white border-slate-200">
									<SelectValue placeholder="Pilih Durasi" />
								</SelectTrigger>
								<SelectContent>
									{DURASI_OPTIONS.map((d) => (
										<SelectItem key={d} value={d}>
											{d}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 6. Peminatan Departemen Utama (5 Departemen Baku - Segmen 21) */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
								<Sparkles className="w-3.5 h-3.5 text-emerald-600" />
								Peminatan Departemen (5 Baku)
							</Label>
							<Select
								value={(data?.agenPeminatan as string) || "HK"}
								disabled={!canEdit}
								onValueChange={(val) => {
									handleLocalChange("agenPeminatan", val);
									handleToggleField("agenPeminatan", val);
								}}
							>
								<SelectTrigger className="h-9 text-xs bg-white border-slate-200 font-semibold text-slate-800">
									<SelectValue placeholder="Pilih Departemen" />
								</SelectTrigger>
								<SelectContent>
									{DEPARTEMEN_OPTIONS.map((dep) => (
										<SelectItem key={dep.value} value={dep.value}>
											{dep.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* 7. Estimasi Tanggal Keberangkatan / Mulai */}
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
								<Calendar className="w-3.5 h-3.5 text-purple-600" />
								Estimasi Tanggal Mulai / Terbang
							</Label>
							<Input
								type="date"
								className="h-9 text-xs bg-white border-slate-200"
								value={
									data?.estDepartureDate
										? new Date(data.estDepartureDate as string)
												.toISOString()
												.split("T")[0]
										: ""
								}
								disabled={!canEdit}
								onChange={(e) =>
									handleLocalChange("estDepartureDate", e.target.value)
								}
								onBlur={() => handleBlurField("estDepartureDate")}
							/>
						</div>

						{/* 8. Verifikasi Status Kesiapan Penempatan */}
						<div className="space-y-1.5 md:col-span-2 lg:col-span-2">
							<Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
								<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
								Verifikasi Kelayakan Penempatan
							</Label>
							<div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
								<div className="flex items-center gap-3">
									<Checkbox
										id="chk-tabPenempatan-agenReady"
										checked={isVerified}
										disabled={!canEdit || isLoading}
										onCheckedChange={(checked) =>
											handleToggleField("agenReady", !!checked)
										}
										className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-tabPenempatan-agenReady"
											className="text-xs font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											Tandai Mitra Penempatan & Lokasi Magang Selesai
											Diverifikasi
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Seluruh konfirmasi kuota dan departemen hotel telah valid
										</p>
									</div>
								</div>
								{isLoading ? (
									<Loader2 className="w-4 h-4 animate-spin text-slate-400" />
								) : isVerified ? (
									<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold">
										✓ Tervalidasi
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-slate-400 text-[10px]"
									>
										Belum
									</Badge>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Card 2: Dokumen Tambahan dari Mitra Penempatan (Segmen 21) */}
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5">
					<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
						<FileText className="w-4 h-4 text-amber-600" />
						Dokumen Tambahan dari Mitra Penempatan (Opsional Sebelum Visa)
					</CardTitle>
					<p className="text-[11px] text-slate-500 mt-0.5">
						Wadah unggah dokumen khusus yang diminta spesifik oleh agensi/mitra
						penempatan (contoh: Surat Keterangan Tunda Wisuda /{" "}
						<i>Postpone Graduation</i>, <i>Landing Permit</i> / LG Izin Terbang,
						Surat Pernyataan Lembaga)
					</p>
				</CardHeader>
				<CardContent className="p-4 sm:p-5">
					<div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
						<div className="flex items-start gap-3">
							<Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
							<div className="text-xs text-slate-600 space-y-1">
								<p className="font-semibold text-slate-800">
									Persyaratan Khusus Mitra Penempatan
								</p>
								<p className="text-[11px] text-slate-500 leading-relaxed">
									Beberapa mitra penempatan (seperti Hong Ta untuk Taiwan atau
									agensi hotel di Malaysia) terkadang mensyaratkan dokumen
									pelengkap sebelum pengajuan visa resmi. Unggah berkas tersebut
									pada slot di bawah ini.
								</p>
							</div>
						</div>
						<div className="pt-2 border-t border-slate-200/80">
							<DocumentUpload
								studentId={studentId}
								panel="magang"
								documentKey="dokumen_tambahan_mitra"
								canEdit={canEdit}
								onUploadSuccess={fetchInternshipData}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
