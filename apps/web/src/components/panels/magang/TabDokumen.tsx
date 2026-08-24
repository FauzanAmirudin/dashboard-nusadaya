"use client";

import {
	Building2,
	Calendar,
	CheckCircle,
	CheckCircle2,
	Clock,
	FileCheck,
	FileText,
	Globe,
	Loader2,
	MapPin,
	Plane,
	ShieldCheck,
	Sparkles,
	UserCheck,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

interface TabDokumenProps {
	studentId: number;
	data: any;
	canEdit: boolean;
	loadingItem?: string | null;
	handleToggleField: (field: string, value: any) => Promise<void> | void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => Promise<void> | void;
	fetchInternshipData: () => Promise<void>;
	notes: string;
	setNotes: (val: string) => void;
	handleSaveNotes: () => Promise<void> | void;
	isSaving: boolean;
}

export function TabDokumen({
	studentId,
	data,
	canEdit,
	loadingItem = null,
	handleToggleField,
	handleLocalChange,
	handleBlurField,
	fetchInternshipData,
	notes,
	setNotes,
	handleSaveNotes,
	isSaving,
}: TabDokumenProps) {
	// Hitung kelengkapan 12 dokumen
	const checklistKeys = [
		"passportReady",
		"interviewReady",
		"lolReady",
		"loaConfirmed",
		"moaReady",
		"contractReady",
		"mcuReady",
		"visaReady",
		"ticketReady",
		"pdtReady",
		"dokumentasiReady",
		"agenReady",
	];

	const completedCount = checklistKeys.filter((k) => !!data?.[k]).length;
	const isAllCompleted = completedCount === checklistKeys.length;

	return (
		<div className="space-y-6">
			{/* Main Card */}
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<Plane className="w-4 h-4 text-[#0517B0]" />
							Status Dokumen & Kesiapan Keberangkatan (12)
						</CardTitle>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Monitoring legalitas dokumen paspor, visa, kontrak kerja, tiket,
							dan pembekalan magang
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							className={`text-xs font-bold px-2.5 py-0.5 ${
								isAllCompleted
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: "bg-blue-50 text-[#0517B0] border-blue-200"
							}`}
						>
							{completedCount}/12 Selesai
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="p-4 sm:p-5 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* 1. Paspor */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.passportReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-passportReady"
										checked={!!data?.passportReady}
										disabled={!canEdit || loadingItem === "passportReady"}
										onCheckedChange={(checked) =>
											handleToggleField("passportReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-passportReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											1. Paspor Resmi
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Scan paspor asli dengan masa berlaku minimal 18 bulan
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "passportReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.passportReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Nomor Paspor
									</Label>
									<Input
										placeholder="Contoh: A12345678"
										className="h-8 text-xs bg-white"
										value={data?.passportNo || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("passportNo", e.target.value)
										}
										onBlur={() => handleBlurField("passportNo")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Masa Berlaku Exp
									</Label>
									<Input
										type="date"
										className="h-8 text-xs bg-white"
										value={
											data?.passportExp
												? new Date(data.passportExp).toISOString().split("T")[0]
												: ""
										}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("passportExp", e.target.value)
										}
										onBlur={() => handleBlurField("passportExp")}
									/>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="passport"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 2. Wawancara User (Interview) */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.interviewReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-interviewReady"
										checked={!!data?.interviewReady}
										disabled={!canEdit || loadingItem === "interviewReady"}
										onCheckedChange={(checked) =>
											handleToggleField("interviewReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-interviewReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											2. Wawancara User (Interview)
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Hasil seleksi interview dengan mitra pengguna
											hotel/perusahaan
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "interviewReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.interviewReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tanggal Wawancara
									</Label>
									<Input
										type="date"
										className="h-8 text-xs bg-white"
										value={
											data?.interviewDate
												? new Date(data.interviewDate)
														.toISOString()
														.split("T")[0]
												: ""
										}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("interviewDate", e.target.value)
										}
										onBlur={() => handleBlurField("interviewDate")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Hasil Wawancara
									</Label>
									<Select
										value={data?.interviewResult || "menunggu"}
										disabled={!canEdit}
										onValueChange={(val) => {
											handleLocalChange("interviewResult", val);
											handleToggleField("interviewResult", val);
										}}
									>
										<SelectTrigger className="h-8 text-xs bg-white">
											<SelectValue placeholder="Pilih Hasil" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="lulus">Lulus</SelectItem>
											<SelectItem value="menunggu">Menunggu</SelectItem>
											<SelectItem value="tidak_lulus">Tidak Lulus</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="interview"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 3. Letter of Offer (LOL) */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.lolReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-lolReady"
										checked={!!data?.lolReady}
										disabled={!canEdit || loadingItem === "lolReady"}
										onCheckedChange={(checked) =>
											handleToggleField("lolReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-lolReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											3. Letter of Offer (LOL)
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Surat penawaran magang resmi dari pihak institusi / hotel
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "lolReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.lolReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tanggal Terbit LOL
									</Label>
									<Input
										type="date"
										className="h-8 text-xs bg-white"
										value={
											data?.lolDate
												? new Date(data.lolDate).toISOString().split("T")[0]
												: ""
										}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("lolDate", e.target.value)
										}
										onBlur={() => handleBlurField("lolDate")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Catatan Penawaran
									</Label>
									<Input
										placeholder="Catatan penawaran"
										className="h-8 text-xs bg-white"
										value={data?.lolNotes || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("lolNotes", e.target.value)
										}
										onBlur={() => handleBlurField("lolNotes")}
									/>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="lol"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 4. Letter of Acceptance (LOA) */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.loaConfirmed
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-loaConfirmed"
										checked={!!data?.loaConfirmed}
										disabled={!canEdit || loadingItem === "loaConfirmed"}
										onCheckedChange={(checked) =>
											handleToggleField("loaConfirmed", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-loaConfirmed"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											4. Letter of Acceptance (LOA)
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Surat penerimaan dan konfirmasi penempatan resmi
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "loaConfirmed" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.loaConfirmed ? (
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

							<div className="space-y-1 pt-1">
								<Label className="text-[11px] font-semibold text-slate-600">
									Tanggal Konfirmasi LOA
								</Label>
								<Input
									type="date"
									className="h-8 text-xs bg-white"
									value={
										data?.loaDate
											? new Date(data.loaDate).toISOString().split("T")[0]
											: ""
									}
									disabled={!canEdit}
									onChange={(e) => handleLocalChange("loaDate", e.target.value)}
									onBlur={() => handleBlurField("loaDate")}
								/>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="loa"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 5. Memorandum of Agreement (MOA) */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.moaReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-moaReady"
										checked={!!data?.moaReady}
										disabled={!canEdit || loadingItem === "moaReady"}
										onCheckedChange={(checked) =>
											handleToggleField("moaReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-moaReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											5. Memorandum of Agreement (MOA)
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Perjanjian kerjasama tripartite / penempatan magang
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "moaReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.moaReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tanggal MOA
									</Label>
									<Input
										type="date"
										className="h-8 text-xs bg-white"
										value={
											data?.moaDate
												? new Date(data.moaDate).toISOString().split("T")[0]
												: ""
										}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("moaDate", e.target.value)
										}
										onBlur={() => handleBlurField("moaDate")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Catatan MOA
									</Label>
									<Input
										placeholder="Catatan perjanjian"
										className="h-8 text-xs bg-white"
										value={data?.moaNotes || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("moaNotes", e.target.value)
										}
										onBlur={() => handleBlurField("moaNotes")}
									/>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="moa"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 6. Kontrak Kerja Magang */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.contractReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-contractReady"
										checked={!!data?.contractReady}
										disabled={!canEdit || loadingItem === "contractReady"}
										onCheckedChange={(checked) =>
											handleToggleField("contractReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-contractReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											6. Kontrak Kerja Magang
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Kontrak magang yang ditandatangani mahasiswa dan mitra
											kerja
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "contractReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.contractReady ? (
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

							<div className="space-y-1 pt-1">
								<Label className="text-[11px] font-semibold text-slate-600">
									Tanggal Penandatanganan Kontrak
								</Label>
								<Input
									type="date"
									className="h-8 text-xs bg-white"
									value={
										data?.contractDate
											? new Date(data.contractDate).toISOString().split("T")[0]
											: ""
									}
									disabled={!canEdit}
									onChange={(e) =>
										handleLocalChange("contractDate", e.target.value)
									}
									onBlur={() => handleBlurField("contractDate")}
								/>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="contract"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 7. Medical Check Up (MCU) */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.mcuReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-mcuReady"
										checked={!!data?.mcuReady}
										disabled={!canEdit || loadingItem === "mcuReady"}
										onCheckedChange={(checked) =>
											handleToggleField("mcuReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-mcuReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											7. Medical Check Up (MCU)
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Hasil pemeriksaan kesehatan laboratorium & rekomendasi
											dokter
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "mcuReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.mcuReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tempat MCU
									</Label>
									<Input
										placeholder="RS / Lab Klinik"
										className="h-8 text-xs bg-white"
										value={data?.mcuPlace || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("mcuPlace", e.target.value)
										}
										onBlur={() => handleBlurField("mcuPlace")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tanggal MCU
									</Label>
									<Input
										type="date"
										className="h-8 text-xs bg-white"
										value={
											data?.mcuDate
												? new Date(data.mcuDate).toISOString().split("T")[0]
												: ""
										}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("mcuDate", e.target.value)
										}
										onBlur={() => handleBlurField("mcuDate")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Hasil MCU
									</Label>
									<Select
										value={data?.mcuResult || "fit"}
										disabled={!canEdit}
										onValueChange={(val) => {
											handleLocalChange("mcuResult", val);
											handleToggleField("mcuResult", val);
										}}
									>
										<SelectTrigger className="h-8 text-xs bg-white">
											<SelectValue placeholder="Pilih Hasil" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="fit">FIT (Layak)</SelectItem>
											<SelectItem value="unfit">UNFIT (Tidak Layak)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="mcu"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 8. Visa Kerja / Magang */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.visaReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-visaReady"
										checked={!!data?.visaReady}
										disabled={!canEdit || loadingItem === "visaReady"}
										onCheckedChange={(checked) =>
											handleToggleField("visaReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-visaReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											8. Visa Kerja / Magang
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Penerbitan visa resmi sesuai regulasi negara penempatan
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "visaReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.visaReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tipe Visa
									</Label>
									<Input
										placeholder="Internship / Work"
										className="h-8 text-xs bg-white"
										value={data?.visaType || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("visaType", e.target.value)
										}
										onBlur={() => handleBlurField("visaType")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Nomor Visa
									</Label>
									<Input
										placeholder="No. Visa"
										className="h-8 text-xs bg-white"
										value={data?.visaNo || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("visaNo", e.target.value)
										}
										onBlur={() => handleBlurField("visaNo")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Status Visa
									</Label>
									<Select
										value={data?.visaStatus || "process"}
										disabled={!canEdit}
										onValueChange={(val) => {
											handleLocalChange("visaStatus", val);
											handleToggleField("visaStatus", val);
										}}
									>
										<SelectTrigger className="h-8 text-xs bg-white">
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="approved">
												Disetujui (Approved)
											</SelectItem>
											<SelectItem value="process">
												Proses (Under Review)
											</SelectItem>
											<SelectItem value="reject">Ditolak (Rejected)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="visa"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 9. Tiket Keberangkatan */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.ticketReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-ticketReady"
										checked={!!data?.ticketReady}
										disabled={!canEdit || loadingItem === "ticketReady"}
										onCheckedChange={(checked) =>
											handleToggleField("ticketReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-ticketReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											9. Tiket Keberangkatan
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Tiket pesawat resmi & konfirmasi rute penerbangan
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "ticketReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.ticketReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Maskapai
									</Label>
									<Input
										placeholder="Garuda / AirAsia / dll"
										className="h-8 text-xs bg-white"
										value={data?.ticketAirline || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("ticketAirline", e.target.value)
										}
										onBlur={() => handleBlurField("ticketAirline")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										No. Flight
									</Label>
									<Input
										placeholder="GA-880"
										className="h-8 text-xs bg-white"
										value={data?.ticketFlight || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("ticketFlight", e.target.value)
										}
										onBlur={() => handleBlurField("ticketFlight")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tanggal Terbang
									</Label>
									<Input
										type="date"
										className="h-8 text-xs bg-white"
										value={
											data?.ticketDate
												? new Date(data.ticketDate).toISOString().split("T")[0]
												: ""
										}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("ticketDate", e.target.value)
										}
										onBlur={() => handleBlurField("ticketDate")}
									/>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="ticket"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 10. Pelatihan Pra-Keberangkatan (PDT) */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.pdtReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-pdtReady"
										checked={!!data?.pdtReady}
										disabled={!canEdit || loadingItem === "pdtReady"}
										onCheckedChange={(checked) =>
											handleToggleField("pdtReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-pdtReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											10. Pelatihan Pra-Keberangkatan (PDT)
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Pembekalan mental, SOP kerja, bahasa, dan kesiapan budaya
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "pdtReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.pdtReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tempat PDT
									</Label>
									<Input
										placeholder="Kampus / Balai Latihan"
										className="h-8 text-xs bg-white"
										value={data?.pdtPlace || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("pdtPlace", e.target.value)
										}
										onBlur={() => handleBlurField("pdtPlace")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tanggal Mulai
									</Label>
									<Input
										type="date"
										className="h-8 text-xs bg-white"
										value={
											data?.pdtDate
												? new Date(data.pdtDate).toISOString().split("T")[0]
												: ""
										}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("pdtDate", e.target.value)
										}
										onBlur={() => handleBlurField("pdtDate")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Tanggal Selesai
									</Label>
									<Input
										type="date"
										className="h-8 text-xs bg-white"
										value={
											data?.pdtEndDate
												? new Date(data.pdtEndDate).toISOString().split("T")[0]
												: ""
										}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("pdtEndDate", e.target.value)
										}
										onBlur={() => handleBlurField("pdtEndDate")}
									/>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="pdt"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 11. Dokumentasi Keberangkatan */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.dokumentasiReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-dokumentasiReady"
										checked={!!data?.dokumentasiReady}
										disabled={!canEdit || loadingItem === "dokumentasiReady"}
										onCheckedChange={(checked) =>
											handleToggleField("dokumentasiReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-dokumentasiReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											11. Dokumentasi Pelepasan & Bandara
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Link dokumentasi foto & video pelepasan / airport
											departure
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "dokumentasiReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.dokumentasiReady ? (
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

							<div className="space-y-1 pt-1">
								<Label className="text-[11px] font-semibold text-slate-600">
									Link Dokumentasi (Google Drive / Cloud)
								</Label>
								<Input
									placeholder="https://drive.google.com/..."
									className="h-8 text-xs bg-white"
									value={data?.dokumentasiKeberangkatanLink || ""}
									disabled={!canEdit}
									onChange={(e) =>
										handleLocalChange(
											"dokumentasiKeberangkatanLink",
											e.target.value,
										)
									}
									onBlur={() => handleBlurField("dokumentasiKeberangkatanLink")}
								/>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="dokumentasi_keberangkatan"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>

						{/* 12. Mitra Penempatan & Sponsor */}
						<div
							className={`p-4 rounded-xl border transition-colors space-y-3 ${
								data?.agenReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-start gap-3">
									<Checkbox
										id="chk-agenReady"
										checked={!!data?.agenReady}
										disabled={!canEdit || loadingItem === "agenReady"}
										onCheckedChange={(checked) =>
											handleToggleField("agenReady", !!checked)
										}
										className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
									/>
									<div>
										<label
											htmlFor="chk-agenReady"
											className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
										>
											12. Mitra Penempatan & Agen Sponsor
										</label>
										<p className="text-[11px] text-slate-500 mt-0.5">
											Detail perusahaan tempat magang, durasi kerja, dan kota
											tujuan
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{loadingItem === "agenReady" ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
									) : data?.agenReady ? (
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

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Perusahaan Magang
									</Label>
									<Input
										placeholder="Nama Hotel / Resto"
										className="h-8 text-xs bg-white"
										value={data?.internshipCompany || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("internshipCompany", e.target.value)
										}
										onBlur={() => handleBlurField("internshipCompany")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Kota Tujuan
									</Label>
									<Input
										placeholder="Kuala Lumpur / Taipei / dll"
										className="h-8 text-xs bg-white"
										value={data?.destinationCity || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("destinationCity", e.target.value)
										}
										onBlur={() => handleBlurField("destinationCity")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Durasi Magang
									</Label>
									<Input
										placeholder="6 Bulan / 1 Tahun"
										className="h-8 text-xs bg-white"
										value={data?.internshipDuration || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("internshipDuration", e.target.value)
										}
										onBlur={() => handleBlurField("internshipDuration")}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-[11px] font-semibold text-slate-600">
										Peminatan / Posisi
									</Label>
									<Input
										placeholder="Hospitality / Barista"
										className="h-8 text-xs bg-white"
										value={data?.agenPeminatan || ""}
										disabled={!canEdit}
										onChange={(e) =>
											handleLocalChange("agenPeminatan", e.target.value)
										}
										onBlur={() => handleBlurField("agenPeminatan")}
									/>
								</div>
							</div>

							<div className="pt-2 border-t border-slate-100">
								<DocumentUpload
									studentId={studentId}
									panel="magang"
									documentKey="mitra_agen"
									canEdit={canEdit}
									onUploadSuccess={fetchInternshipData}
								/>
							</div>
						</div>
					</div>

					{/* Catatan Internal Magang */}
					<div className="mt-6 pt-4 border-t border-slate-200">
						<div className="flex items-center justify-between mb-2">
							<Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
								Catatan & Arahan Divisi Magang
							</Label>
							{canEdit && (
								<Button
									size="sm"
									onClick={handleSaveNotes}
									disabled={isSaving}
									className="h-7 text-xs bg-[#0517B0] hover:bg-blue-800 text-white font-semibold"
								>
									{isSaving ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
									) : null}
									Simpan Catatan
								</Button>
							)}
						</div>
						<Textarea
							value={notes}
							disabled={!canEdit}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Tambahkan catatan koordinasi, kendala visa, atau catatan khusus keberangkatan mahasiswa..."
							className="min-h-[80px] text-xs bg-white resize-none"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
