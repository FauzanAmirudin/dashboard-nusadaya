"use client";

import {
	Building2,
	CheckCircle,
	CheckCircle2,
	Clock,
	Edit2,
	FileText,
	FolderCheck,
	Loader2,
	Save,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { api } from "@/lib/eden";

interface DocFile {
	id: number;
	documentKey: string;
	fileName: string;
	fileUrl: string;
	isVerified: boolean;
	uploadedAt: string;
	uploadedByUser?: { fullName: string } | null;
	verifiedByUser?: { fullName: string } | null;
}

interface TabChecklistProps {
	studentId: number;
	pmbData: any;
	canEdit: boolean;
	documents: Record<string, DocFile[]>;
	fetchDocuments: () => void;
	onUpdate: () => void;
}

const ADDITIONAL_DOCS = [
	{
		key: "ktp",
		propKey: "docKtp",
		label: "KTP (Kartu Tanda Penduduk)",
		desc: "Scan / Foto KTP asli yang masih berlaku dan terbaca jelas",
	},
	{
		key: "kk",
		propKey: "docKk",
		label: "Kartu Keluarga (KK)",
		desc: "Scan Kartu Keluarga terbaru sesuai data pendaftaran",
	},
	{
		key: "cv",
		propKey: "docCv",
		label: "Curriculum Vitae (CV)",
		desc: "Dokumen CV / Resume format PDF terbaru",
	},
	{
		key: "ijazah",
		propKey: "docIjazah",
		label: "Ijazah Terakhir",
		desc: "Scan Ijazah SMA / SMK / Sederajat asli",
	},
	{
		key: "transkrip",
		propKey: "docTranskrip",
		label: "Transkrip Nilai Ijazah",
		desc: "Scan Transkrip Nilai / SKHUN resmi",
	},
	{
		key: "passport_depan",
		propKey: "docPassportDepan",
		label: "Passport (Halaman Depan)",
		desc: "Scan halaman identitas dan foto paspor",
	},
	{
		key: "passport_visa",
		propKey: "docPassportVisa",
		label: "Passport (Halaman Visa)",
		desc: "Scan halaman visa atau stempel resmi keberangkatan",
	},
	{
		key: "skbm",
		propKey: "docSkbm",
		label: "Surat Keterangan Belum Menikah (SKBM)",
		desc: "Surat resmi dari kelurahan / desa setempat",
	},
	{
		key: "mcu",
		propKey: "docMcu",
		label: "Hasil Pre Medical Checkup (MCU)",
		desc: "Hasil pemeriksaan laboratorium dan rekomendasi dokter",
	},
	{
		key: "sertifikasi_bahasa",
		propKey: "docSertifikasiBahasa",
		label: "Sertifikasi Bahasa",
		desc: "Sertifikat TOEIC, TOCFL, JLPT, atau setara",
	},
];

export function TabChecklist({
	studentId,
	pmbData,
	canEdit,
	documents = {},
	fetchDocuments,
	onUpdate,
}: TabChecklistProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [isEditingAcquisition, setIsEditingAcquisition] = useState(false);
	const [notes, setNotes] = useState(pmbData?.notes || "");
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const [localChecks, setLocalChecks] = useState<Record<string, boolean>>({
		formReceived: !!pmbData?.formReceived,
		documentsComplete: !!pmbData?.documentsComplete,
		dataInputted: !!pmbData?.dataInputted,
		initialFollowUp: !!pmbData?.initialFollowUp,
		docKtp: !!pmbData?.docKtp,
		docKk: !!pmbData?.docKk,
		docCv: !!pmbData?.docCv,
		docIjazah: !!pmbData?.docIjazah,
		docTranskrip: !!pmbData?.docTranskrip,
		docPassportDepan: !!pmbData?.docPassportDepan,
		docPassportVisa: !!pmbData?.docPassportVisa,
		docSkbm: !!pmbData?.docSkbm,
		docMcu: !!pmbData?.docMcu,
		docSertifikasiBahasa: !!pmbData?.docSertifikasiBahasa,
	});

	useEffect(() => {
		setLocalChecks({
			formReceived: !!pmbData?.formReceived,
			documentsComplete: !!pmbData?.documentsComplete,
			dataInputted: !!pmbData?.dataInputted,
			initialFollowUp: !!pmbData?.initialFollowUp,
			docKtp: !!pmbData?.docKtp,
			docKk: !!pmbData?.docKk,
			docCv: !!pmbData?.docCv,
			docIjazah: !!pmbData?.docIjazah,
			docTranskrip: !!pmbData?.docTranskrip,
			docPassportDepan: !!pmbData?.docPassportDepan,
			docPassportVisa: !!pmbData?.docPassportVisa,
			docSkbm: !!pmbData?.docSkbm,
			docMcu: !!pmbData?.docMcu,
			docSertifikasiBahasa: !!pmbData?.docSertifikasiBahasa,
		});
		setNotes(pmbData?.notes || "");
		setAcquisition({
			rekomendasi: pmbData?.rekomendasi || "",
			timVisit: pmbData?.timVisit || "",
			timSosialisasi: pmbData?.timSosialisasi || "",
			roReferral: pmbData?.roReferral || "",
			mitraSponsor: pmbData?.mitraSponsor || "",
			koordinator: pmbData?.koordinator || "",
		});
	}, [pmbData]);

	const [acquisition, setAcquisition] = useState({
		rekomendasi: pmbData?.rekomendasi || "",
		timVisit: pmbData?.timVisit || "",
		timSosialisasi: pmbData?.timSosialisasi || "",
		roReferral: pmbData?.roReferral || "",
		mitraSponsor: pmbData?.mitraSponsor || "",
		koordinator: pmbData?.koordinator || "",
	});

	const mainChecklist = [
		{
			id: "formReceived",
			documentKey: "form_received",
			label: "Formulir Masuk",
			desc: "Formulir pendaftaran telah diterima dan diverifikasi",
			checked: localChecks.formReceived,
		},
		{
			id: "documentsComplete",
			documentKey: "documents_complete",
			label: "Berkas Lengkap",
			desc: "Semua dokumen fisik/digital mahasiswa telah lengkap",
			checked: localChecks.documentsComplete,
		},
		{
			id: "dataInputted",
			documentKey: "data_inputted",
			label: "Input Data Awal",
			desc: "Data mahasiswa telah diinput ke sistem dashboard",
			checked: localChecks.dataInputted,
		},
		{
			id: "initialFollowUp",
			documentKey: "initial_follow_up",
			label: "Follow Up Awal",
			desc: "Kontak awal dan konfirmasi orang tua/wali selesai",
			checked: localChecks.initialFollowUp,
		},
	];

	const completedMainCount = [
		localChecks.formReceived,
		localChecks.documentsComplete,
		localChecks.dataInputted,
		localChecks.initialFollowUp,
	].filter(Boolean).length;

	const completedDocsCount = ADDITIONAL_DOCS.filter(
		(d) => localChecks[d.propKey],
	).length;

	const totalCompleted14 = completedMainCount + completedDocsCount;

	const handleCheckboxChange = async (propKey: string, checked: boolean) => {
		if (!canEdit) return;

		const prevState = { ...localChecks };
		const newState = { ...prevState, [propKey]: checked };
		setLocalChecks(newState);
		setLoadingItem(propKey);

		const payload = {
			formReceived: newState.formReceived,
			documentsComplete: newState.documentsComplete,
			dataInputted: newState.dataInputted,
			initialFollowUp: newState.initialFollowUp,
			docKtp: newState.docKtp,
			docKk: newState.docKk,
			docCv: newState.docCv,
			docIjazah: newState.docIjazah,
			docTranskrip: newState.docTranskrip,
			docPassportDepan: newState.docPassportDepan,
			docPassportVisa: newState.docPassportVisa,
			docSkbm: newState.docSkbm,
			docMcu: newState.docMcu,
			docSertifikasiBahasa: newState.docSertifikasiBahasa,
			notes: notes,
			rekomendasi: acquisition.rekomendasi,
			timVisit: acquisition.timVisit,
			timSosialisasi: acquisition.timSosialisasi,
			roReferral: acquisition.roReferral,
			mitraSponsor: acquisition.mitraSponsor,
			koordinator: acquisition.koordinator,
		};

		const { error } = await api.students[studentId.toString()].pmb.put(payload);
		if (error) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan status checklist");
		} else {
			toast.success("Status checklist berhasil disimpan");
			onUpdate();
		}
		setLoadingItem(null);
	};

	const handleCancelEditAcquisition = () => {
		setAcquisition({
			rekomendasi: pmbData?.rekomendasi || "",
			timVisit: pmbData?.timVisit || "",
			timSosialisasi: pmbData?.timSosialisasi || "",
			roReferral: pmbData?.roReferral || "",
			mitraSponsor: pmbData?.mitraSponsor || "",
			koordinator: pmbData?.koordinator || "",
		});
		setIsEditingAcquisition(false);
	};

	const saveAcquisitionAndNotes = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		const payload = {
			formReceived: localChecks.formReceived,
			documentsComplete: localChecks.documentsComplete,
			dataInputted: localChecks.dataInputted,
			initialFollowUp: localChecks.initialFollowUp,
			docKtp: localChecks.docKtp,
			docKk: localChecks.docKk,
			docCv: localChecks.docCv,
			docIjazah: localChecks.docIjazah,
			docTranskrip: localChecks.docTranskrip,
			docPassportDepan: localChecks.docPassportDepan,
			docPassportVisa: localChecks.docPassportVisa,
			docSkbm: localChecks.docSkbm,
			docMcu: localChecks.docMcu,
			docSertifikasiBahasa: localChecks.docSertifikasiBahasa,
			notes: notes,
			rekomendasi: acquisition.rekomendasi,
			timVisit: acquisition.timVisit,
			timSosialisasi: acquisition.timSosialisasi,
			roReferral: acquisition.roReferral,
			mitraSponsor: acquisition.mitraSponsor,
			koordinator: acquisition.koordinator,
		};
		const { error } = await api.students[studentId.toString()].pmb.put(payload);
		if (error) {
			toast.error("Gagal menyimpan data akuisisi");
		} else {
			toast.success("Data Akuisisi & Catatan berhasil disimpan");
			setIsEditingAcquisition(false);
			onUpdate();
		}
		setIsSaving(false);
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* Left & Center: Checklist & Dokumen Tambahan */}
			<div className="lg:col-span-2 space-y-6">
				{/* 1. Checklist Kelengkapan Berkas Utama */}
				<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<CheckCircle className="w-4 h-4 text-[#0517B0]" />
								Checklist Kelengkapan Berkas Utama (4)
							</CardTitle>
							<p className="text-[11px] text-slate-500 mt-0.5">
								Tahapan esensial registrasi dan verifikasi berkas awal PMB
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge
								className={`text-xs font-bold px-2.5 py-0.5 ${
									completedMainCount === 4
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: "bg-blue-50 text-[#0517B0] border-blue-200"
								}`}
							>
								{completedMainCount}/4 Selesai
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="p-4 sm:p-5 space-y-3.5">
						{mainChecklist.map((item) => (
							<div
								key={item.id}
								className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
									item.checked
										? "border-emerald-200 bg-emerald-50/20"
										: "border-slate-200 bg-white"
								}`}
							>
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3">
										<Checkbox
											id={item.id}
											checked={item.checked}
											disabled={!canEdit || loadingItem === item.id}
											onCheckedChange={(checked) =>
												handleCheckboxChange(item.id, !!checked)
											}
											className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
										/>
										<div>
											<label
												htmlFor={item.id}
												className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block"
											>
												{item.label}
											</label>
											<p className="text-[11px] text-slate-500 mt-0.5">
												{item.desc}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{loadingItem === item.id ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
										) : item.checked ? (
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

								{/* Inline Document Upload Bukti per Item */}
								<div className="pt-2 border-t border-slate-100">
									<div className="flex items-center justify-between mb-1.5">
										<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
											<FileText className="w-3 h-3 text-indigo-600" />
											Upload Bukti Dokumen {item.label} (PDF/Gambar)
										</span>
									</div>
									<DocumentUpload
										studentId={studentId}
										panel="pmb"
										documentKey={item.documentKey}
										onUploadSuccess={() => {
											fetchDocuments();
											handleCheckboxChange(item.id, true);
										}}
										canEdit={canEdit}
									/>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				{/* 2. Checklist Dokumen Mahasiswa Tambahan (10 Item Checklist Interaktif) */}
				<Card className="border border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
					<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<FolderCheck className="w-4 h-4 text-indigo-600" />
								Dokumen Mahasiswa Tambahan (10)
							</CardTitle>
							<p className="text-[11px] text-slate-500 mt-0.5">
								Validasi berkas identitas, paspor, kesehatan, dan kualifikasi
								akademik mahasiswa
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Badge
								className={`text-xs font-bold px-2.5 py-0.5 ${
									completedDocsCount === 10
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: completedDocsCount >= 5
											? "bg-indigo-50 text-indigo-700 border-indigo-200"
											: "bg-amber-50 text-amber-700 border-amber-200"
								}`}
							>
								{completedDocsCount}/10 Selesai
							</Badge>
						</div>
					</CardHeader>

					<CardContent className="p-4 sm:p-5 space-y-3.5">
						{ADDITIONAL_DOCS.map((doc) => {
							const docFiles = documents[doc.key] || [];
							const isChecked = !!localChecks[doc.propKey];
							const hasUploadedFile = docFiles.length > 0;

							return (
								<div
									key={doc.key}
									className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
										isChecked
											? "border-emerald-200 bg-emerald-50/20"
											: "border-slate-200 bg-white"
									}`}
								>
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-3">
											<Checkbox
												id={`doc-${doc.key}`}
												checked={isChecked}
												disabled={!canEdit || loadingItem === doc.propKey}
												onCheckedChange={(checked) =>
													handleCheckboxChange(doc.propKey, !!checked)
												}
												className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
											/>
											<div>
												<label
													htmlFor={`doc-${doc.key}`}
													className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block"
												>
													{doc.label}
												</label>
												<p className="text-[11px] text-slate-500 mt-0.5">
													{doc.desc}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-2">
											{loadingItem === doc.propKey ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
											) : isChecked ? (
												<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
													✓ Selesai{" "}
													{hasUploadedFile && `(${docFiles.length} File)`}
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

									{/* Inline Document Upload Bukti per Item */}
									<div className="pt-2 border-t border-slate-100">
										<div className="flex items-center justify-between mb-1.5">
											<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
												<FileText className="w-3 h-3 text-indigo-600" />
												Upload Berkas {doc.label} (PDF/Gambar)
											</span>
										</div>
										<DocumentUpload
											studentId={studentId}
											panel="pmb"
											documentKey={doc.key}
											onUploadSuccess={() => {
												fetchDocuments();
												handleCheckboxChange(doc.propKey, true);
											}}
											canEdit={canEdit}
										/>
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>

			{/* Right Column: Akuisisi & Catatan Section */}
			<div className="space-y-6">
				{/* Data Akuisisi */}
				<Card className="border border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
					<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<Building2 className="w-4 h-4 text-emerald-600" />
							Data Akuisisi & Referral
						</CardTitle>
						{canEdit && (
							<div className="flex items-center gap-2">
								{!isEditingAcquisition ? (
									<Button
										onClick={() => setIsEditingAcquisition(true)}
										size="sm"
										className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-8 font-bold"
									>
										<Edit2 className="w-3 h-3" />
										Edit Data
									</Button>
								) : (
									<>
										<Button
											variant="outline"
											size="sm"
											onClick={handleCancelEditAcquisition}
											disabled={isSaving}
											className="text-xs h-8"
										>
											Batal
										</Button>
										<Button
											onClick={saveAcquisitionAndNotes}
											disabled={isSaving}
											size="sm"
											className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 font-bold"
										>
											{isSaving ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<Save className="w-3.5 h-3.5" />
											)}
											Simpan
										</Button>
									</>
								)}
							</div>
						)}
					</CardHeader>
					<CardContent className="p-4 space-y-3.5">
						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Rekomendasi / Channel
							</Label>
							<Select
								disabled={!isEditingAcquisition || !canEdit}
								value={acquisition.rekomendasi}
								onValueChange={(val) => {
									if (val) setAcquisition({ ...acquisition, rekomendasi: val });
								}}
							>
								<SelectTrigger className="mt-1 h-9 text-xs bg-white border-slate-200">
									<SelectValue placeholder="Pilih Rekomendasi" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Pendamping">Pendamping</SelectItem>
									<SelectItem value="MoU Sekolah">MoU Sekolah</SelectItem>
									<SelectItem value="BKK">BKK</SelectItem>
									<SelectItem value="FKKS">FKKS</SelectItem>
									<SelectItem value="RO Alumni">RO Alumni</SelectItem>
									<SelectItem value="Staff/Team">Staff/Team</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Tim Visit
							</Label>
							<Input
								disabled={!isEditingAcquisition || !canEdit}
								value={acquisition.timVisit}
								onChange={(e) =>
									setAcquisition({ ...acquisition, timVisit: e.target.value })
								}
								placeholder="Nama tim visit..."
								className="mt-1 h-9 text-xs bg-white border-slate-200"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Tim Sosialisasi
							</Label>
							<Input
								disabled={!isEditingAcquisition || !canEdit}
								value={acquisition.timSosialisasi}
								onChange={(e) =>
									setAcquisition({
										...acquisition,
										timSosialisasi: e.target.value,
									})
								}
								placeholder="Nama tim sosialisasi..."
								className="mt-1 h-9 text-xs bg-white border-slate-200"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								RO Referral (Alumni)
							</Label>
							<Input
								disabled={!isEditingAcquisition || !canEdit}
								value={acquisition.roReferral}
								onChange={(e) =>
									setAcquisition({ ...acquisition, roReferral: e.target.value })
								}
								placeholder="Nama RO referral..."
								className="mt-1 h-9 text-xs bg-white border-slate-200"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Mitra / Sponsor
							</Label>
							<Input
								disabled={!isEditingAcquisition || !canEdit}
								value={acquisition.mitraSponsor}
								onChange={(e) =>
									setAcquisition({
										...acquisition,
										mitraSponsor: e.target.value,
									})
								}
								placeholder="Nama mitra..."
								className="mt-1 h-9 text-xs bg-white border-slate-200"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Koordinator
							</Label>
							<Input
								disabled={!isEditingAcquisition || !canEdit}
								value={acquisition.koordinator}
								onChange={(e) =>
									setAcquisition({
										...acquisition,
										koordinator: e.target.value,
									})
								}
								placeholder="Nama koordinator..."
								className="mt-1 h-9 text-xs bg-white border-slate-200"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Catatan Internal PMB */}
				<Card className="border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<FileText className="w-4 h-4 text-amber-600" />
							Catatan Internal PMB
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-3">
						<Textarea
							disabled={!canEdit}
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Tambahkan catatan tindak lanjut atau kendala pendaftaran..."
							className="text-xs min-h-[110px] bg-white border-slate-200"
						/>
						{canEdit && (
							<Button
								onClick={saveAcquisitionAndNotes}
								disabled={isSaving}
								size="sm"
								className="w-full bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-9 font-bold shadow-sm"
							>
								{isSaving ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5" />
								)}
								Simpan Catatan PMB
							</Button>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
