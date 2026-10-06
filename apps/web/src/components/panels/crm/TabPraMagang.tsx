"use client";

import {
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	Link as LinkIcon,
	Loader2,
	RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";

interface TabPraMagangProps {
	studentId: number;
	crmState: any;
	fetchCrmData: () => void;
	canEdit: boolean;
	onUpdate: () => void;
	onUpdateField?: (field: string, value: any) => void;
}

export function TabPraMagang({
	studentId,
	crmState,
	fetchCrmData,
	canEdit,
	onUpdate,
	onUpdateField,
}: TabPraMagangProps) {
	const crm = crmState?.crm;
	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [praMagangDocsCount, setPraMagangDocsCount] = useState<number | null>(
		null,
	);

	const isReportActuallyUploaded =
		praMagangDocsCount !== null
			? praMagangDocsCount > 0
			: Boolean(crm?.isPrammagangReport);

	// Today's date string in YYYY-MM-DD
	const today = useMemo(() => new Date().toISOString().split("T")[0], []);

	// Form state
	const [startDate, setStartDate] = useState(crm?.pramagangStartDate || "");
	const [endDate, setEndDate] = useState(crm?.pramagangEndDate || "");
	const [industry, setIndustry] = useState(crm?.pramagangIndustry || "");
	const [videoLink, setVideoLink] = useState(crm?.pramagangVideoLink || "");

	useEffect(() => {
		if (crm) {
			setStartDate(crm.pramagangStartDate || "");
			setEndDate(crm.pramagangEndDate || "");
			setIndustry(crm.pramagangIndustry || "");
			setVideoLink(crm.pramagangVideoLink || "");
		}
	}, [crm]);

	const handleSave = async () => {
		// Validate past dates (tidak boleh disetting mundur dari hari ini)
		const cleanStart = startDate ? startDate.split("T")[0] : null;
		const cleanEnd = endDate ? endDate.split("T")[0] : null;

		if (cleanStart && cleanStart < today) {
			toast.error(
				"Tanggal mulai pra-magang tidak boleh mundur dari hari ini (" +
					new Date().toLocaleDateString("id-ID", {
						day: "numeric",
						month: "long",
						year: "numeric",
					}) +
					")",
			);
			return;
		}

		if (cleanStart && cleanEnd && cleanEnd < cleanStart) {
			toast.error(
				"Tanggal selesai pra-magang tidak boleh lebih awal dari tanggal mulai",
			);
			return;
		}

		setIsLoading(true);
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				pramagangStartDate: cleanStart || null,
				pramagangEndDate: cleanEnd || null,
				pramagangIndustry: industry ? industry.trim() : null,
				pramagangVideoLink: videoLink ? videoLink.trim() : null,
			});

			if (error) throw new Error("Gagal menyimpan data Pra Magang");

			toast.success("Data Laporan Pra Magang berhasil disimpan");
			setIsEditing(false);
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Terjadi kesalahan saat menyimpan data");
		} finally {
			setIsLoading(false);
		}
	};

	const handleToggleReportApproval = async (approved: boolean) => {
		if (!canEdit) return;
		onUpdateField?.("isPrammagangReport", approved);
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				isPrammagangReport: approved,
			});
			if (error)
				throw new Error("Gagal mengubah status persetujuan Laporan Pra-Magang");
			toast.success(
				approved
					? "Laporan Pra-Magang berhasil disetujui (ACC Laporan)!"
					: "Persetujuan Laporan Pra-Magang dibatalkan",
			);
			fetchCrmData();
			onUpdate();
		} catch (e) {
			onUpdateField?.("isPrammagangReport", !approved);
			toast.error("Terjadi kesalahan sistem saat mengubah status persetujuan");
		}
	};

	const handleUploadSuccess = async () => {
		fetchCrmData();
		onUpdate();
	};

	return (
		<div className="space-y-6">
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
					<h3 className="font-bold text-slate-800 text-lg">
						Laporan Pra Magang
					</h3>
					{canEdit && !isEditing && (
						<Button
							variant="outline"
							onClick={() => setIsEditing(true)}
							className="bg-white"
						>
							Edit Data
						</Button>
					)}
				</div>
				<CardContent className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Masa Pra Magang */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label className="text-slate-600 font-semibold flex items-center gap-1.5">
									<Calendar className="w-4 h-4 text-indigo-600" />
									Masa Pra Magang
								</Label>
								{isEditing && (startDate || endDate) && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => {
											setStartDate("");
											setEndDate("");
											toast.info(
												"Tanggal masa pra-magang direset. Klik 'Simpan Perubahan' untuk mengonfirmasi.",
											);
										}}
										className="h-6 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2 font-semibold"
									>
										<RotateCcw className="w-3 h-3 mr-1" />
										Reset Tanggal
									</Button>
								)}
							</div>
							{!isEditing ? (
								<div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md shadow-sm">
									<Calendar className="w-4 h-4 text-slate-400 shrink-0" />
									<span className="text-slate-700 font-medium truncate">
										{startDate || endDate ? (
											`${startDate ? new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "..."} s/d ${endDate ? new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "..."}`
										) : (
											<span className="text-slate-400 italic">
												Belum ditentukan
											</span>
										)}
									</span>
								</div>
							) : (
								<div className="space-y-1.5">
									<div className="flex items-center gap-2">
										<div className="w-full">
											<span className="text-[10px] text-slate-500 font-medium block mb-1">
												Tanggal Mulai
											</span>
											<Input
												type="date"
												min={today}
												value={startDate ? startDate.split("T")[0] : ""}
												onChange={(e) => {
													const val = e.target.value;
													if (val && val < today) {
														toast.error(
															"Tanggal mulai tidak boleh mundur dari hari ini",
														);
														return;
													}
													setStartDate(val);
													if (endDate && val && endDate < val) {
														setEndDate(val);
													}
												}}
												disabled={isLoading}
												className="w-full text-xs sm:text-sm bg-white"
											/>
										</div>
										<span className="text-slate-400 font-medium self-end mb-2">
											s.d.
										</span>
										<div className="w-full">
											<span className="text-[10px] text-slate-500 font-medium block mb-1">
												Tanggal Selesai
											</span>
											<Input
												type="date"
												min={startDate ? startDate.split("T")[0] : today}
												value={endDate ? endDate.split("T")[0] : ""}
												onChange={(e) => {
													const val = e.target.value;
													const minVal = startDate
														? startDate.split("T")[0]
														: today;
													if (val && val < minVal) {
														toast.error(
															"Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
														);
														return;
													}
													setEndDate(val);
												}}
												disabled={isLoading}
												className="w-full text-xs sm:text-sm bg-white"
											/>
										</div>
									</div>
									<p className="text-[11px] text-slate-400">
										* Minimal tanggal hari ini (tidak dapat memilih tanggal
										mundur).
									</p>
								</div>
							)}
						</div>

						{/* Nama Industri */}
						<div className="space-y-3">
							<Label className="text-slate-600 font-semibold">
								Nama Industri
							</Label>
							{!isEditing ? (
								<div className="p-3 bg-white border border-slate-200 rounded-md shadow-sm">
									<span className="text-slate-700 font-medium">
										{industry || (
											<span className="text-slate-400 italic">
												Belum ditentukan
											</span>
										)}
									</span>
								</div>
							) : (
								<Input
									placeholder="Masukkan nama industri..."
									value={industry}
									onChange={(e) => setIndustry(e.target.value)}
									disabled={isLoading}
									className="bg-white"
								/>
							)}
						</div>

						{/* Tautan Video Dokumentasi */}
						<div className="space-y-3 md:col-span-2">
							<Label className="text-slate-600 font-semibold">
								Upload Tautan Video Dokumentasi
							</Label>
							{!isEditing ? (
								<div className="p-3 bg-white border border-slate-200 rounded-md shadow-sm flex items-center gap-3">
									<LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />
									{videoLink ? (
										<a
											href={videoLink}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate"
										>
											{videoLink}
										</a>
									) : (
										<span className="text-slate-400 italic">
											Belum ada tautan video
										</span>
									)}
								</div>
							) : (
								<Input
									type="url"
									placeholder="https://youtube.com/..."
									value={videoLink}
									onChange={(e) => setVideoLink(e.target.value)}
									disabled={isLoading}
									className="bg-white"
								/>
							)}
						</div>
					</div>

					{isEditing && (
						<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
							<Button
								variant="outline"
								onClick={() => {
									setIsEditing(false);
									// Revert values
									setStartDate(crm?.pramagangStartDate || "");
									setEndDate(crm?.pramagangEndDate || "");
									setIndustry(crm?.pramagangIndustry || "");
									setVideoLink(crm?.pramagangVideoLink || "");
								}}
								disabled={isLoading}
							>
								Batal
							</Button>
							<Button
								onClick={handleSave}
								disabled={isLoading}
								className="bg-[#0517B0] hover:bg-blue-800 text-white px-8"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Menyimpan...
									</>
								) : (
									"Simpan Perubahan"
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Upload Dokumen & Checklist Persetujuan Section */}
			<Card
				className={`shadow-sm overflow-hidden transition-all ${
					crm?.isPrammagangReport
						? "border-emerald-200 bg-emerald-50/20 shadow-2xs"
						: "border-slate-200 bg-white"
				}`}
			>
				<div className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2.5">
						<Checkbox
							id="pramagang-report-check"
							checked={Boolean(crm?.isPrammagangReport)}
							disabled={!canEdit || isLoading}
							onCheckedChange={(checked) => {
								handleToggleReportApproval(!!checked);
							}}
							className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
						/>
						<div>
							<label
								htmlFor="pramagang-report-check"
								className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2"
							>
								<FileText className="w-4 h-4 text-indigo-600 inline" /> Laporan
								Akhir Pra Magang
							</label>
							<p className="text-[11px] text-slate-500 mt-0.5">
								Dokumen laporan akhir Pra Magang yang telah disetujui resmi
								(PDF)
							</p>
						</div>
					</div>

					{crm?.isPrammagangReport ? (
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
				<CardContent className="p-4 sm:p-5">
					<div className="flex flex-col w-full space-y-2">
						<div className="flex items-center justify-between mb-1">
							<Label className="text-[10px] uppercase font-bold text-slate-500 block">
								Upload Laporan Pra Magang (PDF)
							</Label>
							<span className="text-[10px] text-slate-400 font-normal">
								Mendukung &gt;1 file
							</span>
						</div>
						<DocumentUpload
							studentId={studentId}
							panel="crm"
							documentKey="pramagang_report"
							canEdit={canEdit}
							onDocumentsLoaded={(docs) => {
								setPraMagangDocsCount(docs.length);
							}}
							onUploadSuccess={handleUploadSuccess}
							onDeleteSuccess={() => {
								fetchCrmData();
								onUpdate();
							}}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
