"use client";

import { CheckCircle, Clock, Edit2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDeviceDateTime } from "@/utils/format";
import type { PaData } from "./types";

interface TabChecklistPaProps {
	studentId: number;
	paData: PaData | null;
	counselingLogsCount: number;
	isPa: boolean;
	canEdit: boolean;
	isSaving: boolean;
	loadingItem: string | null;
	onChecklistChange: (field: string, value: boolean) => Promise<void>;
	onSaveNotes: (notes: string) => Promise<void>;
	onAcc: () => Promise<void>;
	onCancelAcc: () => Promise<void>;
}

export function TabChecklistPa({
	studentId,
	paData,
	counselingLogsCount,
	isPa,
	canEdit,
	isSaving,
	loadingItem,
	onChecklistChange,
	onSaveNotes,
	onAcc,
	onCancelAcc,
}: TabChecklistPaProps) {
	const [disciplineNotes, setDisciplineNotes] = useState("");
	const [isEditingNotes, setIsEditingNotes] = useState(false);

	useEffect(() => {
		if (paData) setDisciplineNotes(paData.disciplineNotes || "");
	}, [paData]);

	const checklistItems = [
		{
			id: "counselingDone",
			label: "Sesi Konseling",
			desc: `${counselingLogsCount} sesi telah terlaksana`,
			checked: !!paData?.counselingDone,
			docKey: "counseling_done",
			showBadge: counselingLogsCount >= 3 && !paData?.counselingDone,
		},
		{
			id: "mentalStable",
			label: "Kondisi Mental Stabil",
			desc: "Tidak ada indikasi masalah psikologis",
			checked: !!paData?.mentalStable,
			docKey: "mental_stable",
			showBadge: false,
		},
		{
			id: "disciplineGood",
			label: "Kedisiplinan Baik",
			desc: "Berdasarkan pemantauan asrama/harian",
			checked: !!paData?.disciplineGood,
			docKey: "discipline_good",
			showBadge: false,
		},
	];

	const completedCount = checklistItems.filter((i) => i.checked).length;

	const handleSaveDisciplineNotes = async () => {
		await onSaveNotes(disciplineNotes);
		setIsEditingNotes(false);
	};

	return (
		<div className="space-y-8">
			{/* Grid: Checklist & Catatan Kedisiplinan */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* CHECKLIST PA */}
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
					<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							CHECKLIST PA
						</h3>
						<Badge
							variant="outline"
							className="text-xs bg-white text-slate-600 border-slate-200 font-semibold"
						>
							{completedCount}/3 Selesai
						</Badge>
					</div>
					<div className="p-5 space-y-4">
						{checklistItems.map((item) => (
							<div
								key={item.id}
								className="flex flex-col rounded-lg border bg-white overflow-hidden border-slate-200"
							>
								<div
									className={`flex items-center gap-4 p-4 transition-colors ${
										item.checked
											? "bg-emerald-50 border-b border-emerald-200"
											: "bg-slate-50 border-b border-slate-200"
									}`}
								>
									<Checkbox
										id={item.id}
										checked={item.checked}
										onCheckedChange={(checked) =>
											onChecklistChange(item.id, checked === true)
										}
										disabled={!canEdit || loadingItem === item.id}
										className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
									/>
									<label
										htmlFor={item.id}
										className="flex-1 cursor-pointer block"
									>
										<div className="text-sm font-bold text-slate-800 flex items-center gap-2">
											{item.label}
											{loadingItem === item.id && (
												<Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
											)}
										</div>
										<p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
									</label>
									<div>
										{item.checked ? (
											<Tooltip>
												<TooltipTrigger>
													<CheckCircle className="w-5 h-5 text-emerald-500" />
												</TooltipTrigger>
												<TooltipContent>
													Terakhir diperbarui:{" "}
													{paData?.updatedAt
														? new Date(paData.updatedAt).toLocaleString("id-ID")
														: "-"}
												</TooltipContent>
											</Tooltip>
										) : (
											<Clock className="w-5 h-5 text-slate-400" />
										)}
									</div>
								</div>
								<div className="p-4 bg-white border-t border-slate-100">
									<div className="flex items-center justify-between mb-2">
										<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
											Lampiran Dokumen
										</span>
									</div>
									<DocumentUpload
										studentId={studentId}
										panel="pa"
										documentKey={item.docKey}
										canEdit={canEdit}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* CATATAN KEDISIPLINAN */}
				<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
					<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
						<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
							CATATAN KEDISIPLINAN
						</h3>
						{canEdit && !isEditingNotes && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditingNotes(true)}
								className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
							>
								<Edit2 className="w-4 h-4 mr-1" /> Edit
							</Button>
						)}
					</div>
					<div className="p-5 flex-1 flex flex-col">
						{isEditingNotes ? (
							<div className="space-y-3 flex-1 flex flex-col">
								<Textarea
									value={disciplineNotes}
									onChange={(e) => setDisciplineNotes(e.target.value)}
									placeholder="Ketik catatan pelanggaran atau penghargaan..."
									className="min-h-[140px] flex-1"
								/>
								<div className="flex justify-end gap-2 pt-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setDisciplineNotes(paData?.disciplineNotes || "");
											setIsEditingNotes(false);
										}}
									>
										Batal
									</Button>
									<Button
										size="sm"
										onClick={handleSaveDisciplineNotes}
										disabled={isSaving}
										className="bg-blue-600 hover:bg-blue-700 text-white"
									>
										{isSaving ? "Menyimpan..." : "Simpan Catatan"}
									</Button>
								</div>
							</div>
						) : (
							<div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex-1 min-h-[140px] text-sm text-slate-700 whitespace-pre-wrap">
								{paData?.disciplineNotes ? (
									paData.disciplineNotes
								) : (
									<span className="text-slate-400 italic">
										Belum ada catatan kedisiplinan.
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
