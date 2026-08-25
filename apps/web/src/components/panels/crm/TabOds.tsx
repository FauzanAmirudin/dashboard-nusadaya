"use client";

import {
	Building,
	CheckCircle2,
	Clock,
	FileText,
	FolderCheck,
	Loader2,
	ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";

interface TabOdsProps {
	studentId: number;
	crmState: any;
	canEdit: boolean;
	fetchCrmData: () => void;
	onUpdate: () => void;
}

export function TabOds({
	studentId,
	crmState,
	canEdit,
	fetchCrmData,
	onUpdate,
}: TabOdsProps) {
	const crm = crmState?.crm;
	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const defaultOds = Array(5).fill({ date: "", industry: "", isDone: false });
	const [odsData, setOdsData] = useState<any[]>(defaultOds);

	useEffect(() => {
		if (crm?.odsDetails) {
			try {
				let parsed = crm.odsDetails;
				if (typeof parsed === "string") {
					parsed = JSON.parse(parsed);
				}
				if (Array.isArray(parsed) && parsed.length > 0) {
					const populated = [...parsed];
					while (populated.length < 5) {
						populated.push({ date: "", industry: "", isDone: false });
					}
					setOdsData(populated.slice(0, 5));
				}
			} catch (e) {
				console.error("Failed to parse odsDetails", e);
			}
		}
	}, [crm]);

	const completedOdsCount = odsData.filter((o: any) =>
		Boolean(o.isDone),
	).length;
	const isAllOdsDone = completedOdsCount === 5;

	const handleSaveOds = async () => {
		if (!canEdit) return;
		setIsLoading(true);
		try {
			const allDone = odsData.every((o: any) => Boolean(o.isDone));
			const { error } = await api.students[studentId.toString()].crm.patch({
				odsDetails: odsData,
				odsDocumentation: allDone,
			});
			if (error) throw new Error("Gagal menyimpan ODS");
			toast.success(
				allDone
					? "Data Pelaksanaan ODS berhasil disimpan (Semua sesi selesai ✓)"
					: "Data Pelaksanaan ODS berhasil disimpan",
			);
			setIsEditing(false);
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Terjadi kesalahan saat menyimpan ODS");
		} finally {
			setIsLoading(false);
		}
	};

	const handleToggleOdsDoc = async (value: boolean) => {
		if (!canEdit) return;

		if (value && !isAllOdsDone) {
			toast.error(
				`Tidak dapat menandai selesai! Masih ada ${5 - completedOdsCount} sesi ODS yang belum selesai. Semua 5 sesi wajib selesai terlebih dahulu.`,
			);
			return;
		}

		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				odsDocumentation: value,
			});
			if (error) throw new Error("Gagal mengubah status dokumentasi ODS");
			toast.success(
				value
					? "Dokumentasi ODS ditandai selesai (5/5 Selesai)"
					: "Dokumentasi ODS dibatalkan",
			);
			fetchCrmData();
			onUpdate();
		} catch (e) {
			toast.error("Terjadi kesalahan sistem");
		}
	};

	const handleQuickToggleDone = async (index: number, isChecked: boolean) => {
		if (!canEdit) return;
		const updated = [...odsData];
		updated[index] = { ...updated[index], isDone: isChecked };
		setOdsData(updated);

		const allDone = updated.every((o: any) => Boolean(o.isDone));
		try {
			await api.students[studentId.toString()].crm.patch({
				odsDetails: updated,
				odsDocumentation: allDone,
			});
			fetchCrmData();
			onUpdate();
		} catch (e) {
			console.error("Gagal update status ODS", e);
		}
	};

	const handleUpdateField = (index: number, field: string, value: any) => {
		const newData = [...odsData];
		newData[index] = { ...newData[index], [field]: value };
		setOdsData(newData);
	};

	const [odsDocsCount, setOdsDocsCount] = useState<number | null>(null);

	const isOdsReportActuallyUploaded =
		odsDocsCount !== null ? odsDocsCount > 0 : Boolean(crm?.isOdsReport);

	const handleUploadSuccess = async () => {
		if (!crm?.isOdsReport) {
			try {
				await api.students[studentId.toString()].crm.patch({
					isOdsReport: true,
				});
			} catch (error) {
				console.error("Gagal auto-check ods report", error);
			}
		}
		fetchCrmData();
		onUpdate();
	};

	const handleDeleteSuccess = async () => {
		fetchCrmData();
		onUpdate();
	};

	return (
		<TooltipProvider>
			<div className="space-y-6">
				{/* ─── STATUS INDIKATOR BANNER ODS (PMB STYLE) ─── */}
				<Card
					className={`border shadow-2xs overflow-hidden transition-all ${
						crm?.odsDocumentation && isAllOdsDone
							? "border-emerald-200 bg-emerald-50/30"
							: "border-amber-200 bg-amber-50/20"
					}`}
				>
					<CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-start gap-3.5">
							<div
								className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
									crm?.odsDocumentation && isAllOdsDone
										? "bg-emerald-100 text-emerald-700 border border-emerald-200"
										: "bg-amber-100 text-amber-700 border border-amber-200"
								}`}
							>
								{crm?.odsDocumentation && isAllOdsDone ? (
									<CheckCircle2 className="w-6 h-6" />
								) : (
									<Clock className="w-6 h-6" />
								)}
							</div>
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<h4 className="font-bold text-slate-900 text-sm sm:text-base">
										Indikator: Pelaksanaan & Dokumentasi ODS (5 Sesi)
									</h4>
									{crm?.odsDocumentation && isAllOdsDone ? (
										<Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2 py-0.5">
											✓ Selesai (5/5 Terpenuhi)
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-amber-800 bg-amber-50 border-amber-300 text-xs font-bold px-2 py-0.5"
										>
											{completedOdsCount}/5 Sesi Selesai (Belum Lengkap)
										</Badge>
									)}
								</div>
								<p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
									{crm?.odsDocumentation && isAllOdsDone
										? "Seluruh 5 sesi One Day Service telah selesai dilaksanakan dan terverifikasi sah."
										: isAllOdsDone
											? "Semua 5 sesi ODS telah selesai dicatat. Klik tombol di kanan untuk mengonfirmasi status selesai."
											: `Masih ada ${5 - completedOdsCount} dari 5 sesi ODS yang belum selesai. Semua 5 sesi wajib selesai sebelum indikator ini dapat dinyatakan tuntas.`}
								</p>
							</div>
						</div>

						{canEdit && (
							<div className="shrink-0 flex items-center gap-2">
								{crm?.odsDocumentation ? (
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleToggleOdsDoc(false)}
										className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold h-9 px-4 cursor-pointer"
									>
										Batalkan Status Selesai
									</Button>
								) : (
									<Tooltip>
										<TooltipTrigger render={<span className="inline-block" />}>
											<span>
												<Button
													size="sm"
													disabled={!isAllOdsDone}
													onClick={() => handleToggleOdsDoc(true)}
													className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-bold h-9 px-5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<CheckCircle2 className="w-4 h-4 mr-1.5" />
													Tandai ODS Selesai
												</Button>
											</span>
										</TooltipTrigger>
										{!isAllOdsDone && (
											<TooltipContent className="bg-slate-900 text-white text-xs max-w-xs p-2">
												Semua 5 sesi ODS harus berstatus selesai (5/5) sebelum
												dapat dinyatakan selesai.
											</TooltipContent>
										)}
									</Tooltip>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				{/* ─── 1. CHECKLIST PELAKSANAAN ODS (PMB STYLE GRID) ─── */}
				<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<Building className="w-4 h-4 text-[#0517B0]" />
								Checklist Pelaksanaan One Day Service (5 Sesi)
							</CardTitle>
							<p className="text-[11px] text-slate-500 mt-0.5">
								Pencatatan tanggal pelaksanaan dan nama industri per sesi ODS
							</p>
						</div>

						<div className="flex items-center gap-2.5">
							<Badge
								className={`text-xs font-bold px-2.5 py-0.5 ${
									isAllOdsDone
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: completedOdsCount >= 3
											? "bg-indigo-50 text-indigo-700 border-indigo-200"
											: "bg-amber-50 text-amber-700 border-amber-200"
								}`}
							>
								{completedOdsCount}/5 Selesai
							</Badge>

							{canEdit && !isEditing && (
								<Button
									onClick={() => setIsEditing(true)}
									variant="outline"
									size="sm"
									className="text-[#0517B0] border-blue-200 hover:bg-blue-50 text-xs font-semibold h-8"
								>
									Edit Data Sesi
								</Button>
							)}
						</div>
					</CardHeader>

					<CardContent className="p-4 sm:p-5 space-y-3.5">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
							{odsData.map((ods, index) => {
								const isDone = Boolean(ods.isDone);

								return (
									<div
										key={index}
										className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
											isDone
												? "border-emerald-200 bg-emerald-50/20 shadow-2xs"
												: "border-slate-200 bg-white"
										}`}
									>
										{/* Item Header */}
										<div className="flex items-start justify-between">
											<div className="flex items-center gap-2.5">
												<Checkbox
													id={`ods-check-${index}`}
													checked={isDone}
													disabled={!canEdit || isLoading}
													onCheckedChange={(checked) => {
														if (isEditing) {
															handleUpdateField(index, "isDone", !!checked);
														} else {
															handleQuickToggleDone(index, !!checked);
														}
													}}
													className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
												/>
												<label
													htmlFor={`ods-check-${index}`}
													className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer"
												>
													Sesi ODS {index + 1}
												</label>
											</div>

											{isDone ? (
												<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
													✓ Selesai
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-400 border-slate-200 text-[10px]"
												>
													Belum Selesai
												</Badge>
											)}
										</div>

										{/* Content Fields */}
										<div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
											<div>
												<Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
													Tanggal Pelaksanaan
												</Label>
												{isEditing ? (
													<Input
														type="date"
														value={ods.date || ""}
														onChange={(e) =>
															handleUpdateField(index, "date", e.target.value)
														}
														disabled={!canEdit || isLoading}
														className="bg-white text-xs h-8"
													/>
												) : (
													<div className="text-xs font-semibold text-slate-700 bg-slate-50/80 px-2.5 py-1.5 rounded-md border border-slate-200/70 min-h-[30px] flex items-center">
														{ods.date ? (
															new Date(ods.date).toLocaleDateString("id-ID", {
																day: "numeric",
																month: "long",
																year: "numeric",
															})
														) : (
															<span className="text-slate-400 font-normal italic">
																Belum ditentukan
															</span>
														)}
													</div>
												)}
											</div>

											<div>
												<Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
													Nama Industri / Tempat ODS
												</Label>
												{isEditing ? (
													<Input
														type="text"
														placeholder="Contoh: Hotel Mulia Senayan"
														value={ods.industry || ""}
														onChange={(e) =>
															handleUpdateField(
																index,
																"industry",
																e.target.value,
															)
														}
														disabled={!canEdit || isLoading}
														className="bg-white text-xs h-8"
													/>
												) : (
													<div className="text-xs font-semibold text-slate-700 bg-slate-50/80 px-2.5 py-1.5 rounded-md border border-slate-200/70 min-h-[30px] flex items-center truncate">
														{ods.industry || (
															<span className="text-slate-400 font-normal italic">
																Belum ditentukan
															</span>
														)}
													</div>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{canEdit && isEditing && (
							<div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-3">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setIsEditing(false);
										fetchCrmData();
									}}
									disabled={isLoading}
									className="text-xs"
								>
									Batal
								</Button>
								<Button
									size="sm"
									onClick={handleSaveOds}
									disabled={isLoading}
									className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-bold px-6"
								>
									{isLoading ? (
										<>
											<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
											Menyimpan...
										</>
									) : (
										"Simpan Data ODS"
									)}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* ─── 2. UPLOAD DOKUMEN LAPORAN ODS (PMB STYLE) ─── */}
				<Card className="border border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
					<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
								<FileText className="w-4 h-4 text-indigo-600" />
								Upload Dokumen Laporan Akhir ODS
							</CardTitle>
							<p className="text-[11px] text-slate-500 mt-0.5">
								Unggah dokumen laporan akhir One Day Service yang telah
								ditandatangani resmi (PDF)
							</p>
						</div>

						<Badge
							className={`text-xs font-bold px-2.5 py-0.5 ${
								isOdsReportActuallyUploaded
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: "bg-amber-50 text-amber-700 border-amber-200"
							}`}
						>
							{isOdsReportActuallyUploaded
								? "✓ Terunggah (Lengkap)"
								: "Belum Diunggah"}
						</Badge>
					</CardHeader>

					<CardContent className="p-4 sm:p-5">
						<div className="flex flex-col w-full">
							<p className="text-xs text-slate-600 mb-3 leading-relaxed">
								Dokumen ini merupakan salah satu syarat kelengkapan indikator
								progress CRM (1/8 poin). Jika berkas dihapus, status progress
								akan otomatis berkurang.
							</p>
							<DocumentUpload
								studentId={studentId}
								panel="crm"
								documentKey="ods_report"
								canEdit={canEdit}
								onDocumentsLoaded={(docs) => {
									setOdsDocsCount(docs.length);
									if (docs.length === 0 && crm?.isOdsReport) {
										api.students[studentId.toString()].crm
											.patch({ isOdsReport: false })
											.then(() => {
												fetchCrmData();
												onUpdate();
											});
									}
								}}
								onUploadSuccess={handleUploadSuccess}
								onDeleteSuccess={handleDeleteSuccess}
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</TooltipProvider>
	);
}
