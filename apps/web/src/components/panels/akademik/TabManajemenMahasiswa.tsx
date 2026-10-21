"use client";

import {
	CheckCircle,
	Eye,
	FileText,
	Info,
	Loader2,
	Save,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";

interface TabManajemenMahasiswaProps {
	studentId: number;
	canEdit: boolean;
	acadState: any;
	onRefresh: () => void;
}

export function TabManajemenMahasiswa({
	studentId,
	canEdit,
	acadState,
	onRefresh,
}: TabManajemenMahasiswaProps) {
	const [loadingItem, setLoadingItem] = useState<string | null>(null);
	const [isSavingNotes, setIsSavingNotes] = useState(false);
	const [notes, setNotes] = useState("");

	const [localChecks, setLocalChecks] = useState({
		pddiktiInput: false,
		utsPassed: false,
		uasPassed: false,
		attitudeIndicator: false,
		assignmentsCompleted: false,
		academicCommunication: false,
		assessmentCompleted: false,
	});

	useEffect(() => {
		if (acadState) {
			setLocalChecks({
				pddiktiInput: !!acadState.pddiktiInput,
				utsPassed: !!acadState.utsPassed,
				uasPassed: !!acadState.uasPassed,
				attitudeIndicator: !!acadState.attitudeIndicator,
				assignmentsCompleted: !!acadState.assignmentsCompleted,
				academicCommunication: !!acadState.academicCommunication,
				assessmentCompleted: !!acadState.assessmentCompleted,
			});
			setNotes(acadState.notes || "");
		}
	}, [acadState]);

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;
		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked }));
		setLoadingItem(id);

		try {
			const { error } = await api.students[studentId.toString()].academic.patch(
				{
					[id]: checked,
				},
			);

			if (error) {
				setLocalChecks(prevState);
				toast.error("Gagal memperbarui status checklist");
			} else {
				toast.success("Status checklist berhasil diperbarui");
				onRefresh();
			}
		} catch {
			setLocalChecks(prevState);
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setLoadingItem(null);
		}
	};

	const handleSaveNotes = async () => {
		if (!canEdit) return;
		setIsSavingNotes(true);
		try {
			const { error } = await api.students[studentId.toString()].academic.patch(
				{
					notes,
				},
			);

			if (!error) {
				toast.success("Catatan akademik disimpan");
				onRefresh();
			} else {
				toast.error("Gagal menyimpan catatan");
			}
		} catch {
			toast.error("Gagal menyimpan catatan");
		} finally {
			setIsSavingNotes(false);
		}
	};

	const checklistData = [
		{
			id: "pddiktiInput",
			label: "Validasi PDDIKTI",
			desc: "Status validasi data PDDIKTI mahasiswa",
			docKey: "pddikti_bukti",
			docLabel: "Bukti Validasi PDDIKTI",
		},
		{
			id: "utsPassed",
			label: "Nilai UTS",
			desc: "Status kelulusan ujian tengah semester",
			docKey: "uts_passed",
			docLabel: "Dokumen Nilai UTS",
		},
		{
			id: "uasPassed",
			label: "Nilai UAS",
			desc: "Status kelulusan ujian akhir semester",
			docKey: "uas_passed",
			docLabel: "Dokumen Nilai UAS",
		},
		{
			id: "attitudeIndicator",
			label: "Indikator Sikap",
			desc: "Penilaian sikap dan etika mahasiswa",
			docKey: "attitude_indicator",
			docLabel: "Dokumen Indikator Sikap",
		},
		{
			id: "assignmentsCompleted",
			label: "Penyelesaian Tugas",
			desc: "Penyelesaian tugas utama perkuliahan",
			docKey: "assignments_completed",
			docLabel: "Dokumen Penyelesaian Tugas",
		},
		{
			id: "academicCommunication",
			label: "Komunikasi Akademik",
			desc: "Komunikasi mahasiswa dengan dosen/PA aktif",
			docKey: "academic_communication",
			docLabel: "Dokumen Komunikasi Akademik",
		},
		{
			id: "assessmentCompleted",
			label: "Asesmen Pra-keberangkatan",
			desc: "Hasil asesmen kesiapan mahasiswa sebelum berangkat",
			docKey: "pre_departure_assessment",
			docLabel: "Dokumen Asesmen",
		},
	];

	return (
		<div className="space-y-6">
			{/* DOKUMEN AKADEMIK SECTION */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						DOKUMEN AKADEMIK & STATUS
					</h3>
				</div>
				<div className="p-5 space-y-6">
					{checklistData.map((item) => {
						const isChecked = (localChecks as any)[item.id];
						return (
							<div
								key={item.id}
								className="flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
							>
								{/* Header & Checkbox */}
								<div
									className={`flex items-center justify-between p-4 transition-colors ${
										isChecked
											? "bg-emerald-50/50"
											: "bg-white hover:bg-slate-50/50"
									}`}
								>
									<div className="flex items-center gap-4">
										<Checkbox
											id={item.id}
											checked={isChecked}
											onCheckedChange={(c) =>
												handleCheckboxChange(item.id, c as boolean)
											}
											disabled={!canEdit || loadingItem === item.id}
											className={`w-6 h-6 rounded-md transition-all ${
												isChecked
													? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
													: ""
											}`}
										/>
										<label htmlFor={item.id} className="cursor-pointer block">
											<div
												className={`text-base font-semibold flex items-center ${
													isChecked ? "text-emerald-900" : "text-slate-700"
												}`}
											>
												{item.label}
												{loadingItem === item.id && (
													<Loader2 className="w-4 h-4 text-emerald-600 animate-spin ml-2" />
												)}
											</div>
											<p
												className={`text-sm ${isChecked ? "text-emerald-700/80" : "text-slate-500"}`}
											>
												{item.desc}
											</p>
										</label>
									</div>
									<div className="shrink-0">
										{isChecked ? (
											<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
												✔ Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-500 border-slate-300"
											>
												Belum Selesai
											</Badge>
										)}
									</div>
								</div>

								{/* Area Upload Dokumen */}
								<div className="p-4 bg-slate-50 border-t border-slate-100">
									<div className="flex items-center justify-between mb-3">
										<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
											{item.docLabel}
										</span>
									</div>
									<DocumentUpload
										studentId={studentId}
										panel="akademik"
										documentKey={item.docKey}
										canEdit={canEdit}
										onUploadSuccess={onRefresh}
										onDeleteSuccess={onRefresh}
										onUpdate={onRefresh}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* CATATAN AKADEMIK SECTION */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						CATATAN AKADEMIK
					</h3>
				</div>
				<div className="p-5">
					<Textarea
						placeholder="Tambahkan catatan khusus terkait akademik mahasiswa ini..."
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						disabled={!canEdit}
						className="min-h-[100px] bg-slate-50 resize-y mb-4"
					/>
					{canEdit && (
						<div className="flex justify-end">
							<Button
								onClick={handleSaveNotes}
								disabled={isSavingNotes}
								className="bg-slate-800 hover:bg-slate-700 text-white"
							>
								{isSavingNotes ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<Save className="w-4 h-4 mr-2" />
								)}
								Simpan Catatan
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
