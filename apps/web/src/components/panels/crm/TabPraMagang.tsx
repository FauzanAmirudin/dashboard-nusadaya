"use client";

import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	ExternalLink,
	FileText,
	Link as LinkIcon,
	Loader2,
	MessageSquare,
	RotateCcw,
	Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

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
	const { token } = useAuthStore();
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isReviewing, setIsReviewing] = useState(false);
	const [praMagangDocsCount, setPraMagangDocsCount] = useState<number | null>(
		null,
	);

	// Revision dialog state
	const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
	const [revisionTarget, setRevisionTarget] = useState<
		"pramagang" | "monthly" | null
	>(null);
	const [revisionVideoId, setRevisionVideoId] = useState<string | undefined>(
		undefined,
	);
	const [revisionNotes, setRevisionNotes] = useState("");

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

	const handleReviewPramagangVideo = async (
		status: "DISETUJUI" | "PERLU_REVISI",
		notes?: string,
	) => {
		if (!canEdit) return;
		setIsReviewing(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/review-pramagang-video`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ status, notes }),
				},
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.message || "Gagal mereview video pra-magang");
			}
			toast.success(
				status === "DISETUJUI"
					? "Video Pra-Magang disetujui (ACC Laporan Pra-Magang)!"
					: "Status video pra-magang diubah menjadi Perlu Revisi",
			);
			setRevisionDialogOpen(false);
			fetchCrmData();
			onUpdate();
		} catch (err: any) {
			toast.error(err.message || "Terjadi kesalahan saat mereview video");
		} finally {
			setIsReviewing(false);
		}
	};

	const handleReviewMonthlyVideo = async (
		status: "DISETUJUI" | "PERLU_REVISI",
		notes?: string,
		videoId?: string,
	) => {
		if (!canEdit) return;
		setIsReviewing(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/review-monthly-video`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ status, notes, videoId }),
				},
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.message || "Gagal mereview video konten bulanan");
			}
			toast.success(
				status === "DISETUJUI"
					? "Video Konten Bulanan disetujui (ACC Segmen 10)!"
					: "Status video konten bulanan diubah menjadi Perlu Revisi",
			);
			setRevisionDialogOpen(false);
			setRevisionVideoId(undefined);
			setRevisionNotes("");
			fetchCrmData();
			onUpdate();
		} catch (err: any) {
			toast.error(
				err.message || "Terjadi kesalahan saat mereview video konten",
			);
		} finally {
			setIsReviewing(false);
		}
	};

	const openRevisionDialog = (
		target: "pramagang" | "monthly",
		videoId?: string,
		initialNotes?: string,
	) => {
		setRevisionTarget(target);
		setRevisionVideoId(videoId);
		if (target === "pramagang") {
			setRevisionNotes(
				crm?.pramagangVideoNotes ||
					"Tautan video tidak dapat diakses atau belum memenuhi kriteria laporan pra-magang.",
			);
		} else {
			setRevisionNotes(
				initialNotes ||
					crm?.monthlyVideoNotes ||
					"Konten belum memenuhi ketentuan promosi/kegiatan bulanan kampus Nusadaya.",
			);
		}
		setRevisionDialogOpen(true);
	};

	const handleConfirmRevision = async () => {
		if (!revisionTarget) return;
		if (revisionTarget === "pramagang") {
			await handleReviewPramagangVideo("PERLU_REVISI", revisionNotes);
		} else {
			await handleReviewMonthlyVideo(
				"PERLU_REVISI",
				revisionNotes,
				revisionVideoId,
			);
		}
	};

	const handleUploadSuccess = async () => {
		fetchCrmData();
		onUpdate();
	};

	const renderVideoBadge = (status?: string | null) => {
		switch (status) {
			case "DISETUJUI":
				return (
					<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs font-semibold">
						<CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
						Disetujui
					</Badge>
				);
			case "MENUNGGU_REVIEW":
				return (
					<Badge className="bg-amber-100 text-amber-800 border-0 text-xs font-semibold animate-pulse">
						<Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
						Menunggu Review
					</Badge>
				);
			case "PERLU_REVISI":
				return (
					<Badge className="bg-rose-100 text-rose-800 border-0 text-xs font-semibold">
						<AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
						Perlu Revisi
					</Badge>
				);
			default:
				return (
					<Badge
						variant="outline"
						className="text-slate-400 border-slate-200 text-xs font-normal"
					>
						<Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
						Belum Diunggah
					</Badge>
				);
		}
	};

	const formatDate = (dateStr?: string | null) => {
		if (!dateStr) return "-";
		return new Date(dateStr).toLocaleString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="space-y-6">
			{/* Card 1: Data Pra Magang Utama */}
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
								<div className="p-3 bg-white border border-slate-200 rounded-md shadow-sm flex items-center justify-between gap-3">
									<div className="flex items-center gap-3 min-w-0">
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
									{videoLink && (
										<a
											href={videoLink}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-xs text-[#0517B0] hover:underline font-bold shrink-0"
										>
											<ExternalLink className="w-3.5 h-3.5" /> Buka
										</a>
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

			{/* Card 2: Review Segmen 9 - Video Pra-Magang (Unggah Mandiri Mahasiswa) */}
			<Card
				className={`shadow-sm overflow-hidden border ${
					crm?.pramagangVideoStatus === "DISETUJUI"
						? "border-emerald-200 bg-emerald-50/10"
						: crm?.pramagangVideoStatus === "PERLU_REVISI"
							? "border-rose-200 bg-rose-50/10"
							: crm?.pramagangVideoStatus === "MENUNGGU_REVIEW"
								? "border-amber-200 bg-amber-50/10"
								: "border-slate-200 bg-white"
				}`}
			>
				<div className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2.5">
						<Video className="w-4 h-4 text-blue-600 shrink-0" />
						<div>
							<h4 className="text-sm font-bold text-slate-800">
								Segmen 9: Tautan Video Laporan Pra-Magang (Unggah Mandiri)
							</h4>
							<p className="text-[11px] text-slate-500">
								Disetor langsung oleh mahasiswa via portal akun mahasiswa untuk
								diverifikasi admin CRM.
							</p>
						</div>
					</div>
					<div>{renderVideoBadge(crm?.pramagangVideoStatus)}</div>
				</div>

				<CardContent className="p-5 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<span className="text-xs font-semibold text-slate-500 block">
								Tautan Video Diserahkan:
							</span>
							{crm?.pramagangVideoLink ? (
								<div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
									<a
										href={crm.pramagangVideoLink}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs font-semibold text-blue-600 hover:underline truncate flex-1"
									>
										{crm.pramagangVideoLink}
									</a>
									<a
										href={crm.pramagangVideoLink}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold shrink-0 transition-colors"
									>
										<ExternalLink className="w-3 h-3" /> Tonton Video
									</a>
								</div>
							) : (
								<p className="text-xs text-slate-400 italic p-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-200">
									Mahasiswa belum menyetorkan tautan video laporan pra-magang.
								</p>
							)}
						</div>

						<div className="space-y-1.5 text-xs text-slate-600">
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-slate-400">Waktu Disetor:</span>
								<span className="font-medium text-slate-700">
									{formatDate(crm?.pramagangVideoSubmittedAt)}
								</span>
							</div>
							<div className="flex justify-between py-1 border-b border-slate-100">
								<span className="text-slate-400">Terakhir Direview:</span>
								<span className="font-medium text-slate-700">
									{formatDate(crm?.pramagangVideoReviewedAt)}
								</span>
							</div>
						</div>
					</div>

					{crm?.pramagangVideoNotes && (
						<div
							className={`p-3 rounded-xl border text-xs ${
								crm?.pramagangVideoStatus === "PERLU_REVISI"
									? "bg-rose-50 border-rose-200 text-rose-800"
									: "bg-slate-50 border-slate-200 text-slate-700"
							}`}
						>
							<span className="font-bold flex items-center gap-1.5 mb-1">
								<MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Catatan
								Review Admin:
							</span>
							<p className="whitespace-pre-wrap">{crm.pramagangVideoNotes}</p>
						</div>
					)}

					{canEdit && (
						<div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => openRevisionDialog("pramagang")}
								disabled={isReviewing || !crm?.pramagangVideoLink}
								className="text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 font-semibold text-xs"
							>
								<AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
								Minta Revisi
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={() => handleReviewPramagangVideo("DISETUJUI")}
								disabled={
									isReviewing ||
									!crm?.pramagangVideoLink ||
									crm?.pramagangVideoStatus === "DISETUJUI"
								}
								className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
							>
								{isReviewing ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
								) : (
									<CheckCircle2 className="w-3.5 h-3.5 mr-1" />
								)}
								Setujui Video (ACC Laporan)
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Card 3: Review Segmen 10 - Kewajiban 1 Video Konten Promosi / Kegiatan Bulanan */}
			{(() => {
				let monthlyVideosList: any[] = [];
				if (crm?.monthlyVideos) {
					try {
						monthlyVideosList =
							typeof crm.monthlyVideos === "string"
								? JSON.parse(crm.monthlyVideos)
								: crm.monthlyVideos;
						if (!Array.isArray(monthlyVideosList)) monthlyVideosList = [];
					} catch {
						monthlyVideosList = [];
					}
				}
				if (monthlyVideosList.length === 0 && crm?.monthlyVideoLink) {
					monthlyVideosList = [
						{
							id: "legacy",
							month: "Januari",
							year: new Date().getFullYear(),
							title: crm?.monthlyVideoTitle || "Video Konten Promosi Bulanan",
							platform: crm?.monthlyVideoPlatform || "Instagram",
							videoLink: crm?.monthlyVideoLink,
							status: crm?.monthlyVideoStatus || "MENUNGGU_REVIEW",
							notes: crm?.monthlyVideoNotes,
							submittedAt: crm?.monthlyVideoSubmittedAt,
							reviewedAt: crm?.monthlyVideoReviewedAt,
						},
					];
				}

				return (
					<Card
						className={`shadow-sm overflow-hidden border ${
							crm?.isMonthlyVideo || crm?.monthlyVideoStatus === "DISETUJUI"
								? "border-emerald-200 bg-emerald-50/10"
								: crm?.monthlyVideoStatus === "PERLU_REVISI"
									? "border-rose-200 bg-rose-50/10"
									: crm?.monthlyVideoStatus === "MENUNGGU_REVIEW"
										? "border-amber-200 bg-amber-50/10"
										: "border-slate-200 bg-white"
						}`}
					>
						<div className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="flex items-center gap-2.5">
								<Video className="w-4 h-4 text-purple-600 shrink-0" />
								<div>
									<h4 className="text-sm font-bold text-slate-800">
										Segmen 10: Kewajiban Video Konten Bulanan (Promosi /
										Kegiatan)
									</h4>
									<p className="text-[11px] text-slate-500">
										Kewajiban mahasiswa mengunggah video konten kegiatan bulanan
										ke medsos per bulan.
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									className={
										crm?.isMonthlyVideo
											? "bg-emerald-100 text-emerald-800 border-0 text-xs font-bold"
											: "bg-slate-100 text-slate-600 border-0 text-xs font-semibold"
									}
								>
									{crm?.isMonthlyVideo ? "✓ Terpenuhi" : "Belum Terpenuhi"}
								</Badge>
							</div>
						</div>

						<CardContent className="p-5 space-y-4">
							<div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 flex-wrap gap-2">
								<div className="flex items-center gap-2">
									<span className="text-slate-500 font-semibold">
										Total Disetor:
									</span>
									<Badge variant="secondary" className="font-bold text-xs">
										{monthlyVideosList.length} Video Bulanan
									</Badge>
								</div>
								{crm?.monthlyVideoReviewedAt && (
									<span className="text-slate-400 text-[11px]">
										Terakhir direview: {formatDate(crm.monthlyVideoReviewedAt)}
									</span>
								)}
							</div>

							{monthlyVideosList.length === 0 ? (
								<p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
									Mahasiswa belum menyetorkan video konten bulanan via portal
									mahasiswa.
								</p>
							) : (
								<div className="space-y-3.5">
									{monthlyVideosList.map((item: any, idx: number) => {
										const isApproved = item.status === "DISETUJUI";
										const isPending = item.status === "MENUNGGU_REVIEW";
										const isRevision = item.status === "PERLU_REVISI";

										return (
											<div
												key={item.id || idx}
												className={`p-4 rounded-xl border transition-all space-y-3 ${
													isApproved
														? "bg-emerald-50/20 border-emerald-200"
														: isRevision
															? "bg-rose-50/20 border-rose-200"
															: isPending
																? "bg-amber-50/20 border-amber-200"
																: "bg-slate-50 border-slate-200"
												}`}
											>
												<div className="flex items-start justify-between gap-3">
													<div>
														<div className="flex items-center gap-2 flex-wrap">
															<Badge className="bg-purple-100 text-purple-900 border-0 text-xs font-bold">
																{item.month || "Bulanan"} {item.year || ""}
															</Badge>
															<Badge
																variant="outline"
																className="text-xs text-slate-600"
															>
																{item.platform || "Instagram / TikTok"}
															</Badge>
														</div>
														<h5 className="font-bold text-slate-800 text-sm mt-1.5">
															{item.title || "Video Konten Promosi Bulanan"}
														</h5>
													</div>
													<div>{renderVideoBadge(item.status)}</div>
												</div>

												<div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
													<a
														href={item.videoLink}
														target="_blank"
														rel="noopener noreferrer"
														className="text-purple-700 hover:underline truncate flex-1 font-mono font-medium"
													>
														{item.videoLink}
													</a>
													<a
														href={item.videoLink}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-xs font-bold shrink-0 transition-colors"
													>
														<ExternalLink className="w-3.5 h-3.5" /> Tonton
														Konten
													</a>
												</div>

												<div className="flex items-center justify-between text-[11px] text-slate-400">
													<span>Disetor: {formatDate(item.submittedAt)}</span>
													{item.reviewedAt && (
														<span>Direview: {formatDate(item.reviewedAt)}</span>
													)}
												</div>

												{item.notes && (
													<div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
														<span className="font-bold flex items-center gap-1.5 mb-0.5">
															<MessageSquare className="w-3.5 h-3.5 text-rose-600" />{" "}
															Catatan Revisi Admin:
														</span>
														<p className="whitespace-pre-wrap pl-5">
															{item.notes}
														</p>
													</div>
												)}

												{canEdit && (
													<div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() =>
																openRevisionDialog(
																	"monthly",
																	item.id,
																	item.notes,
																)
															}
															disabled={isReviewing}
															className="h-7 text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 font-semibold text-xs"
														>
															<AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
															Minta Revisi
														</Button>
														<Button
															type="button"
															size="sm"
															onClick={() =>
																handleReviewMonthlyVideo(
																	"DISETUJUI",
																	undefined,
																	item.id,
																)
															}
															disabled={isReviewing || isApproved}
															className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
														>
															{isReviewing ? (
																<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
															) : (
																<CheckCircle2 className="w-3.5 h-3.5 mr-1" />
															)}
															{isApproved
																? "Sudah Disetujui"
																: "Setujui Video Ini"}
														</Button>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
				);
			})()}

			{/* Card 4: Upload Dokumen & Checklist Persetujuan Section */}
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
								Akhir Pra Magang (Berkas PDF)
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

			{/* Modal Dialog: Input Catatan Minta Revisi */}
			<Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-rose-600" />
							{revisionTarget === "pramagang"
								? "Minta Revisi Video Laporan Pra-Magang"
								: "Minta Revisi Video Konten Bulanan"}
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Berikan catatan perbaikan yang jelas agar mahasiswa dapat
							memperbaiki dan menyetorkan kembali tautan video yang benar.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<Label className="text-xs font-semibold text-slate-700">
							Catatan Perbaikan untuk Mahasiswa:
						</Label>
						<Textarea
							value={revisionNotes}
							onChange={(e) => setRevisionNotes(e.target.value)}
							placeholder="Tuliskan catatan detail revisi di sini..."
							rows={4}
							className="text-xs leading-relaxed"
						/>
					</div>

					<DialogFooter className="flex gap-2 sm:justify-end">
						<DialogClose
							render={
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={isReviewing}
								>
									Batal
								</Button>
							}
						/>
						<Button
							type="button"
							size="sm"
							onClick={handleConfirmRevision}
							disabled={isReviewing || !revisionNotes.trim()}
							className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
						>
							{isReviewing ? (
								<>
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									Mengirim...
								</>
							) : (
								"Kirim Catatan Revisi"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
