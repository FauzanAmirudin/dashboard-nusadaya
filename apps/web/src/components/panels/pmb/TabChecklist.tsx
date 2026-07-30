"use client";

import { Building2, CheckCircle, FileText, Loader2, Save } from "lucide-react";
import { useState } from "react";
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

export function TabChecklist({
	studentId,
	pmbData,
	canEdit,
	documents,
	fetchDocuments,
	onUpdate,
}: TabChecklistProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [notes, setNotes] = useState(pmbData?.notes || "");
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const [localChecks, setLocalChecks] = useState({
		formReceived: !!pmbData?.formReceived,
		documentsComplete: !!pmbData?.documentsComplete,
		dataInputted: !!pmbData?.dataInputted,
		initialFollowUp: !!pmbData?.initialFollowUp,
	});

	const [acquisition, setAcquisition] = useState({
		rekomendasi: pmbData?.rekomendasi || "",
		timVisit: pmbData?.timVisit || "",
		timSosialisasi: pmbData?.timSosialisasi || "",
		roReferral: pmbData?.roReferral || "",
		mitraSponsor: pmbData?.mitraSponsor || "",
		koordinator: pmbData?.koordinator || "",
	});

	const checklist = [
		{
			id: "formReceived",
			documentKey: "form_received",
			label: "Formulir Masuk",
			desc: "Formulir pendaftaran telah diterima",
			checked: localChecks.formReceived,
		},
		{
			id: "documentsComplete",
			documentKey: "documents_complete",
			label: "Berkas Lengkap",
			desc: "Semua dokumen fisik tersedia",
			checked: localChecks.documentsComplete,
		},
		{
			id: "dataInputted",
			documentKey: "data_inputted",
			label: "Input Data Awal",
			desc: "Data mahasiswa telah diinput ke sistem",
			checked: localChecks.dataInputted,
		},
		{
			id: "initialFollowUp",
			documentKey: "initial_follow_up",
			label: "Follow Up Awal",
			desc: "Kontak awal dengan mahasiswa/orang tua selesai",
			checked: localChecks.initialFollowUp,
		},
	];

	const completedCount = Object.values(localChecks).filter(Boolean).length;

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;

		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked }));
		setLoadingItem(id);

		const payload = {
			...prevState,
			[id]: checked,
			notes: notes,
			rekomendasi: acquisition.rekomendasi,
			timVisit: acquisition.timVisit,
			timSosialisasi: acquisition.timSosialisasi,
			roReferral: acquisition.roReferral,
		};

		const { error } = await api.students[studentId.toString()].pmb.put(payload);
		if (error) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan");
		} else {
			toast.success("Berhasil disimpan");
			onUpdate();
		}
		setLoadingItem(null);
	};

	const saveAcquisitionAndNotes = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		const payload = {
			...localChecks,
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
			toast.error("Gagal menyimpan data");
		} else {
			toast.success("Data berhasil disimpan");
			onUpdate();
		}
		setIsSaving(false);
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* Checklist Section */}
			<div className="lg:col-span-2 space-y-4">
				<Card className="border border-slate-200 shadow-sm">
					<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<CheckCircle className="w-4 h-4 text-[#0517B0]" />
							Checklist Kelengkapan Berkas
						</CardTitle>
						<span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
							{completedCount} dari 4 Selesai
						</span>
					</CardHeader>
					<CardContent className="p-4 space-y-4">
						{checklist.map((item) => (
							<div
								key={item.id}
								className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 transition-colors space-y-3"
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
											className="mt-0.5"
										/>
										<div>
											<label
												htmlFor={item.id}
												className="text-sm font-bold text-slate-800 cursor-pointer block"
											>
												{item.label}
											</label>
											<p className="text-xs text-slate-500 mt-0.5">
												{item.desc}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{loadingItem === item.id ? (
											<Loader2 className="w-4 h-4 animate-spin text-slate-400" />
										) : item.checked ? (
											<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px]">
												Selesai
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
								<div className="pt-2 border-t border-slate-200/60">
									<label className="text-[11px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider flex items-center gap-1">
										<FileText className="w-3.5 h-3.5 text-indigo-600" />
										Bukti Dokumen {item.label} (PDF)
									</label>
									<DocumentUpload
										studentId={studentId}
										panel="pmb"
										documentKey={item.documentKey}
										onUploadSuccess={fetchDocuments}
										canEdit={canEdit}
									/>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Akuisisi & Catatan Section */}
			<div className="space-y-4">
				<Card className="border border-slate-200 shadow-sm">
					<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<Building2 className="w-4 h-4 text-emerald-600" />
							Data Akuisisi & Referral
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-3">
						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Rekomendasi / Channel
							</Label>
							<Select
								disabled={!canEdit}
								value={acquisition.rekomendasi}
								onValueChange={(val) => {
									if (val) setAcquisition({ ...acquisition, rekomendasi: val });
								}}
							>
								<SelectTrigger className="mt-1 h-9 text-xs">
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
								disabled={!canEdit}
								value={acquisition.timVisit}
								onChange={(e) =>
									setAcquisition({ ...acquisition, timVisit: e.target.value })
								}
								placeholder="Nama tim visit..."
								className="mt-1 h-9 text-xs"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Tim Sosialisasi
							</Label>
							<Input
								disabled={!canEdit}
								value={acquisition.timSosialisasi}
								onChange={(e) =>
									setAcquisition({
										...acquisition,
										timSosialisasi: e.target.value,
									})
								}
								placeholder="Nama tim sosialisasi..."
								className="mt-1 h-9 text-xs"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								RO Referral (Alumni)
							</Label>
							<Input
								disabled={!canEdit}
								value={acquisition.roReferral}
								onChange={(e) =>
									setAcquisition({ ...acquisition, roReferral: e.target.value })
								}
								placeholder="Nama RO referral..."
								className="mt-1 h-9 text-xs"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Mitra / Sponsor
							</Label>
							<Input
								disabled={!canEdit}
								value={acquisition.mitraSponsor}
								onChange={(e) =>
									setAcquisition({
										...acquisition,
										mitraSponsor: e.target.value,
									})
								}
								placeholder="Nama mitra..."
								className="mt-1 h-9 text-xs"
							/>
						</div>

						<div>
							<Label className="text-xs font-semibold text-slate-600">
								Koordinator
							</Label>
							<Input
								disabled={!canEdit}
								value={acquisition.koordinator}
								onChange={(e) =>
									setAcquisition({
										...acquisition,
										koordinator: e.target.value,
									})
								}
								placeholder="Nama koordinator..."
								className="mt-1 h-9 text-xs"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Catatan Internal */}
				<Card className="border border-slate-200 shadow-sm">
					<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4">
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
							className="text-xs min-h-[100px]"
						/>
						{canEdit && (
							<Button
								onClick={saveAcquisitionAndNotes}
								disabled={isSaving}
								size="sm"
								className="w-full bg-[#0517B0] hover:bg-[#04128d] text-white text-xs gap-2"
							>
								{isSaving ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5" />
								)}
								Simpan Data Akuisisi & Catatan
							</Button>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
