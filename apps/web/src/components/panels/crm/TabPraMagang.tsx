"use client";

import {
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	Link as LinkIcon,
	Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
}

export function TabPraMagang({
	studentId,
	crmState,
	fetchCrmData,
	canEdit,
	onUpdate,
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

	// Form state
	const [startDate, setStartDate] = useState(crm?.pramagangStartDate || "");
	const [endDate, setEndDate] = useState(crm?.pramagangEndDate || "");
	const [industry, setIndustry] = useState(crm?.pramagangIndustry || "");
	const [videoLink, setVideoLink] = useState(crm?.pramagangVideoLink || "");

	const handleSave = async () => {
		setIsLoading(true);
		try {
			const hasDoc =
				Boolean(videoLink && videoLink.trim().length > 0) ||
				Boolean(startDate && industry);
			const { error } = await api.students[studentId.toString()].crm.patch({
				pramagangStartDate: startDate,
				pramagangEndDate: endDate,
				pramagangIndustry: industry,
				pramagangVideoLink: videoLink,
				isPrammagangDocumentation: hasDoc,
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

	const handleToggleDoc = async (value: boolean) => {
		if (!canEdit) return;
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				isPrammagangDocumentation: value,
			});
			if (error)
				throw new Error("Gagal mengubah status dokumentasi Pra-Magang");
			toast.success(
				value
					? "Dokumentasi Pra-Magang ditandai selesai"
					: "Dokumentasi Pra-Magang dibatalkan",
			);
			fetchCrmData();
			onUpdate();
		} catch (e) {
			toast.error("Terjadi kesalahan sistem");
		}
	};

	const handleUploadSuccess = async () => {
		if (!crm?.isPrammagangReport) {
			try {
				await api.students[studentId.toString()].crm.patch({
					isPrammagangReport: true,
				});
				fetchCrmData();
				onUpdate();
			} catch (error) {
				console.error("Gagal auto-check pramagang report", error);
			}
		}
	};

	return (
		<div className="space-y-6">
			{/* Status Checklist Banner Pra-Magang */}
			<Card className="border border-slate-200 shadow-2xs bg-white overflow-hidden">
				<CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div
							className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
								crm?.isPrammagangDocumentation
									? "bg-emerald-100 text-emerald-700"
									: "bg-amber-100 text-amber-700"
							}`}
						>
							{crm?.isPrammagangDocumentation ? (
								<CheckCircle2 className="w-5 h-5" />
							) : (
								<Clock className="w-5 h-5" />
							)}
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h4 className="font-bold text-slate-800 text-sm">
									Indikator: Dokumentasi Pra-Magang
								</h4>
								{crm?.isPrammagangDocumentation ? (
									<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs font-semibold">
										Selesai (Terpenuhi)
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-amber-700 bg-amber-50 border-amber-200 text-xs font-medium"
									>
										Belum Terpenuhi
									</Badge>
								)}
							</div>
							<p className="text-xs text-slate-500 mt-0.5">
								{crm?.isPrammagangDocumentation
									? "Data penempatan dan dokumentasi video telah tercatat."
									: "Lengkapi data industri, periode, tautan video atau tandai selesai."}
							</p>
						</div>
					</div>

					{canEdit && (
						<Button
							size="sm"
							variant={crm?.isPrammagangDocumentation ? "outline" : "default"}
							onClick={() => handleToggleDoc(!crm?.isPrammagangDocumentation)}
							className={
								crm?.isPrammagangDocumentation
									? "border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
									: "bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-bold"
							}
						>
							{crm?.isPrammagangDocumentation
								? "Batalkan Status Selesai"
								: "Tandai Dokumentasi Selesai"}
						</Button>
					)}
				</CardContent>
			</Card>

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
							<Label className="text-slate-600 font-semibold">
								Masa Pra Magang
							</Label>
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
								<div className="flex items-center gap-2">
									<Input
										type="date"
										value={startDate ? startDate.split("T")[0] : ""}
										onChange={(e) => setStartDate(e.target.value)}
										disabled={isLoading}
										className="w-full"
									/>
									<span className="text-slate-400 font-medium">s.d.</span>
									<Input
										type="date"
										value={endDate ? endDate.split("T")[0] : ""}
										onChange={(e) => setEndDate(e.target.value)}
										disabled={isLoading}
										className="w-full"
									/>
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

			{/* Upload Dokumen Section */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-indigo-600">
				<div className="bg-slate-50 border-b border-slate-200 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
							<FileText className="w-4 h-4 text-indigo-600" /> Unggah Dokumen
							Laporan Akhir Pra Magang
						</h3>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Dokumen laporan akhir Pra Magang yang telah disetujui resmi (PDF)
						</p>
					</div>

					<Badge
						className={`text-xs font-bold px-2.5 py-0.5 ${
							isReportActuallyUploaded
								? "bg-emerald-50 text-emerald-700 border-emerald-200"
								: "bg-amber-50 text-amber-700 border-amber-200"
						}`}
					>
						{isReportActuallyUploaded
							? "✓ Terunggah (Lengkap)"
							: "Belum Diunggah"}
					</Badge>
				</div>
				<CardContent className="p-4 sm:p-5">
					<div className="flex flex-col w-full">
						<p className="text-xs text-slate-600 mb-3 leading-relaxed">
							Dokumen ini merupakan salah satu syarat kelengkapan indikator
							progress CRM (1/8 poin). Jika berkas dihapus, status progress akan
							otomatis berkurang.
						</p>
						<DocumentUpload
							studentId={studentId}
							panel="crm"
							documentKey="pramagang_report"
							canEdit={canEdit}
							onDocumentsLoaded={(docs) => {
								setPraMagangDocsCount(docs.length);
								if (docs.length === 0 && crm?.isPrammagangReport) {
									api.students[studentId.toString()].crm
										.patch({ isPrammagangReport: false })
										.then(() => {
											fetchCrmData();
											onUpdate();
										});
								}
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
