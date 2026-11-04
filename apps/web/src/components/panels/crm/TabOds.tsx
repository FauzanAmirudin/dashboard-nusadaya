"use client";

import {
	AlertCircle,
	BookOpen,
	Building,
	Check,
	CheckCircle2,
	Edit,
	GraduationCap,
	Loader2,
	MapPin,
	Plus,
	School,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

const TRI_DHARMA_CATEGORIES = [
	{ value: "pkm", label: "Pengabdian Kepada Masyarakat (PKM)" },
	{ value: "penelitian", label: "Penelitian (Dosen & Mahasiswa)" },
];

const TRI_DHARMA_LOCATIONS = [
	{ value: "sekolah_mitra", label: "Sekolah Mitra" },
	{ value: "desa_binaan", label: "Desa Binaan" },
];

interface TabOdsProps {
	studentId: number;
	crmState: any;
	canEdit: boolean;
	fetchCrmData: () => void;
	onUpdate: () => void;
	onUpdateField?: (field: string, value: any) => void;
}

export function TabOds({
	studentId,
	crmState,
	canEdit,
	fetchCrmData,
	onUpdate,
	onUpdateField,
}: TabOdsProps) {
	const { token } = useAuthStore();
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
	const crm = crmState?.crm;
	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const defaultOds = Array(5).fill({ date: "", industry: "", isDone: false });
	const [odsData, setOdsData] = useState<any[]>(defaultOds);

	// Real-time tracking of uploaded reports per session (1..5)
	const [reportsCountMap, setReportsCountMap] = useState<
		Record<number, number>
	>({
		1: crm?.isOds1Report ? 1 : 0,
		2: crm?.isOds2Report ? 1 : 0,
		3: crm?.isOds3Report ? 1 : 0,
		4: crm?.isOds4Report ? 1 : 0,
		5: crm?.isOds5Report ? 1 : 0,
	});

	// --- Segmen 9: Integrasi Tri Dharma (PKM & Penelitian) State ---
	const [triDharmaList, setTriDharmaList] = useState<any[]>([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingActivity, setEditingActivity] = useState<any | null>(null);

	const [formCategory, setFormCategory] = useState<"pkm" | "penelitian">("pkm");
	const [formLocationType, setFormLocationType] = useState<
		"sekolah_mitra" | "desa_binaan"
	>("sekolah_mitra");
	const [formLocationName, setFormLocationName] = useState("");
	const [formTitle, setFormTitle] = useState("");
	const [formDate, setFormDate] = useState("");
	const [formLecturer, setFormLecturer] = useState("");
	const [formDescription, setFormDescription] = useState("");
	const [formIsDone, setFormIsDone] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Revision Dialog State
	const [isRevisionOpen, setIsRevisionOpen] = useState(false);
	const [revisionActivityId, setRevisionActivityId] = useState<string | null>(
		null,
	);
	const [revisionNotes, setRevisionNotes] = useState("");
	const [isReviewing, setIsReviewing] = useState(false);

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

	useEffect(() => {
		if (crm?.triDharmaDetails) {
			try {
				let parsed = crm.triDharmaDetails;
				if (typeof parsed === "string") {
					parsed = JSON.parse(parsed);
				}
				if (Array.isArray(parsed)) {
					setTriDharmaList(parsed);
				}
			} catch (e) {
				console.error("Failed to parse triDharmaDetails", e);
			}
		} else {
			setTriDharmaList([]);
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
			for (let i = 0; i < 5; i++) {
				const isDone = Boolean(odsData[i]?.isDone);
				onUpdateField?.(`isOds${i + 1}Report`, isDone);
			}
			onUpdateField?.("odsDetails", odsData);

			const { error } = await api.students[studentId.toString()].crm.patch({
				odsDetails: odsData,
			});
			if (error) throw new Error("Gagal menyimpan ODS");
			toast.success("Data Pelaksanaan ODS berhasil disimpan");
			setIsEditing(false);
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Terjadi kesalahan saat menyimpan ODS");
		} finally {
			setIsLoading(false);
		}
	};

	const handleQuickToggleDone = async (index: number, isChecked: boolean) => {
		if (!canEdit) return;
		const updated = [...odsData];
		updated[index] = { ...updated[index], isDone: isChecked };
		setOdsData(updated);

		const sessionNum = index + 1;
		onUpdateField?.(`isOds${sessionNum}Report`, isChecked);
		onUpdateField?.("odsDetails", updated);

		try {
			await api.students[studentId.toString()].crm.patch({
				odsDetails: updated,
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

	// Direct fetch of real CRM documents from database
	const fetchOdsDocsCount = useCallback(async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/documents?_t=${Date.now()}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success && Array.isArray(json.data)) {
					const docs = json.data;
					const newMap: Record<number, number> = {};
					for (let i = 1; i <= 5; i++) {
						const count = docs.filter((d: any) => {
							if (
								d.documentKey === `ods_${i}_report` ||
								d.documentKey === `ods_${i}`
							)
								return true;
							if (i === 1 && d.documentKey === "ods_report") return true;
							return false;
						}).length;
						newMap[i] = count;
					}
					setReportsCountMap(newMap);
				}
			}
		} catch (err) {
			console.error("Failed to fetch ODS documents count:", err);
		}
	}, [studentId, token, API_URL]);

	useEffect(() => {
		fetchOdsDocsCount();
	}, [fetchOdsDocsCount]);

	// Update reportsCountMap if crmState changes from parent
	useEffect(() => {
		if (crm) {
			setReportsCountMap((prev) => ({
				1: prev[1] ?? (crm.isOds1Report ? 1 : 0),
				2: prev[2] ?? (crm.isOds2Report ? 1 : 0),
				3: prev[3] ?? (crm.isOds3Report ? 1 : 0),
				4: prev[4] ?? (crm.isOds4Report ? 1 : 0),
				5: prev[5] ?? (crm.isOds5Report ? 1 : 0),
			}));
		}
	}, [crm]);

	const handleDocsLoaded = (sessionNum: number, count: number) => {
		setReportsCountMap((prev) => {
			if (prev[sessionNum] === count) return prev;
			return { ...prev, [sessionNum]: count };
		});
	};

	const handleDocUploaded = (sessionNum: number) => {
		setReportsCountMap((prev) => ({
			...prev,
			[sessionNum]: (prev[sessionNum] || 0) + 1,
		}));
		fetchCrmData();
		onUpdate();
	};

	const handleDocDeleted = (sessionNum: number) => {
		const newCount = Math.max(0, (reportsCountMap[sessionNum] || 1) - 1);
		setReportsCountMap((prev) => ({
			...prev,
			[sessionNum]: newCount,
		}));
		fetchCrmData();
		onUpdate();
	};

	const reportedOdsCount = [1, 2, 3, 4, 5].filter(
		(sessionNum) => (reportsCountMap[sessionNum] || 0) > 0,
	).length;
	const isAllOdsReportUploaded = reportedOdsCount === 5;

	// --- Tri Dharma Handlers ---
	const handleOpenAdd = () => {
		setEditingActivity(null);
		setFormCategory("pkm");
		setFormLocationType("sekolah_mitra");
		setFormLocationName("");
		setFormTitle("");
		setFormDate("");
		setFormLecturer("");
		setFormDescription("");
		setFormIsDone(true);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (act: any) => {
		setEditingActivity(act);
		setFormCategory(act.category || "pkm");
		setFormLocationType(act.locationType || "sekolah_mitra");
		setFormLocationName(act.locationName || "");
		setFormTitle(act.title || "");
		setFormDate(act.date || "");
		setFormLecturer(act.lecturerName || "");
		setFormDescription(act.description || "");
		setFormIsDone(Boolean(act.isDone || act.status === "DISETUJUI"));
		setIsModalOpen(true);
	};

	const handleSaveActivity = async () => {
		if (!formLocationName.trim() || !formTitle.trim()) {
			toast.error("Nama lokasi dan judul/topik kegiatan wajib diisi");
			return;
		}
		setIsSubmitting(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/tri-dharma`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						id: editingActivity?.id,
						category: formCategory,
						locationType: formLocationType,
						locationName: formLocationName,
						title: formTitle,
						date: formDate,
						lecturerName: formLecturer,
						description: formDescription,
						isDone: formIsDone,
						status: formIsDone ? "DISETUJUI" : "MENUNGGU_REVIEW",
					}),
				},
			);
			const data = await res.json();
			if (data.success) {
				toast.success(
					editingActivity
						? "Kegiatan Tri Dharma berhasil diperbarui"
						: "Kegiatan Tri Dharma berhasil ditambahkan",
				);
				setIsModalOpen(false);
				fetchCrmData();
				onUpdate();
			} else {
				toast.error(data.message || "Gagal menyimpan kegiatan Tri Dharma");
			}
		} catch (err) {
			toast.error(
				"Terjadi kesalahan sistem saat menyimpan kegiatan Tri Dharma",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReviewActivity = async (
		activityId: string,
		action: "APPROVE" | "REVISE",
		notes?: string,
	) => {
		setIsReviewing(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/review-tri-dharma`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						activityId,
						action,
						notes,
					}),
				},
			);
			const data = await res.json();
			if (data.success) {
				toast.success(
					action === "APPROVE"
						? "Kegiatan Tri Dharma berhasil disetujui (ACC)"
						: "Status diubah menjadi Perlu Revisi",
				);
				if (action === "REVISE") setIsRevisionOpen(false);
				fetchCrmData();
				onUpdate();
			} else {
				toast.error(
					data.message || "Gagal memproses review kegiatan Tri Dharma",
				);
			}
		} catch (err) {
			toast.error("Terjadi kesalahan saat memproses review");
		} finally {
			setIsReviewing(false);
		}
	};

	const handleDeleteActivity = async (activityId: string) => {
		if (!confirm("Apakah Anda yakin ingin menghapus kegiatan Tri Dharma ini?"))
			return;
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/tri-dharma/${activityId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			const data = await res.json();
			if (data.success) {
				toast.success("Kegiatan Tri Dharma berhasil dihapus");
				fetchCrmData();
				onUpdate();
			} else {
				toast.error(data.message || "Gagal menghapus kegiatan Tri Dharma");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan saat menghapus kegiatan");
		}
	};

	const approvedTriDharmaCount = triDharmaList.filter(
		(act) => act.status === "DISETUJUI" || Boolean(act.isDone),
	).length;
	const pendingTriDharmaCount = triDharmaList.filter(
		(act) => act.status === "MENUNGGU_REVIEW",
	).length;

	return (
		<div className="space-y-6">
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
							{completedOdsCount}/5 Sesi Diisi
						</Badge>

						<Badge
							className={`text-xs font-bold px-2.5 py-0.5 ${
								isAllOdsReportUploaded
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: reportedOdsCount >= 3
										? "bg-indigo-50 text-indigo-700 border-indigo-200"
										: "bg-amber-50 text-amber-700 border-amber-200"
							}`}
						>
							{reportedOdsCount}/5 Laporan Diunggah
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
														handleUpdateField(index, "industry", e.target.value)
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

										{/* Upload Laporan Per ODS */}
										<div className="pt-2.5 border-t border-slate-100">
											<div className="flex items-center justify-between mb-1.5">
												<Label className="text-[10px] uppercase font-bold text-slate-500 block">
													Laporan ODS {index + 1} (PDF)
												</Label>
												<span className="text-[10px] text-slate-400 font-normal">
													Mendukung &gt;1 file
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="crm"
												documentKey={`ods_${index + 1}_report`}
												canEdit={canEdit}
												onDocumentsLoaded={(docs) =>
													handleDocsLoaded(index + 1, docs.length)
												}
												onUploadSuccess={() => handleDocUploaded(index + 1)}
												onDeleteSuccess={() => handleDocDeleted(index + 1)}
												onUpdate={() => {
													fetchOdsDocsCount();
													fetchCrmData();
													onUpdate();
												}}
											/>
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

			{/* ─── 2. INTEGRASI TRI DHARMA PERGURUAN TINGGI (PKM & PENELITIAN) ─── */}
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-purple-600">
				<CardHeader className="bg-purple-50/40 border-b border-purple-100/70 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<GraduationCap className="w-4 h-4 text-purple-600" />
							Integrasi Tri Dharma Perguruan Tinggi (PKM &amp; Penelitian)
						</CardTitle>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Kegiatan pengabdian masyarakat (PKM) dan penelitian dosen &amp;
							mahasiswa dengan opsi lokasi di sekolah mitra maupun desa binaan
							(Segmen 9).
						</p>
					</div>

					<div className="flex items-center gap-2.5">
						<Badge
							variant="outline"
							className={`text-xs font-bold px-2.5 py-0.5 ${
								approvedTriDharmaCount > 0
									? "bg-emerald-50 text-emerald-700 border-emerald-300"
									: "bg-slate-100 text-slate-600 border-slate-200"
							}`}
						>
							{approvedTriDharmaCount} Disetujui
						</Badge>
						{pendingTriDharmaCount > 0 && (
							<Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-2.5 py-0.5">
								{pendingTriDharmaCount} Menunggu Review
							</Badge>
						)}

						{canEdit && (
							<Button
								onClick={handleOpenAdd}
								size="sm"
								className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold h-8 gap-1.5 shadow-2xs"
							>
								<Plus className="w-3.5 h-3.5" />
								Tambah Kegiatan
							</Button>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-4 sm:p-5">
					{triDharmaList.length === 0 ? (
						<div className="text-center py-9 px-4 border border-dashed border-purple-200 rounded-xl bg-purple-50/20">
							<BookOpen className="w-10 h-10 text-purple-300 mx-auto mb-2" />
							<h4 className="text-sm font-bold text-slate-700 mb-1">
								Belum Ada Kegiatan Tri Dharma Tercatat
							</h4>
							<p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
								Kegiatan pengabdian kepada masyarakat (PKM) maupun penelitian di
								sekolah mitra atau desa binaan yang diunggah mahasiswa atau
								diinput tim CRM akan tampil di sini.
							</p>
							{canEdit && (
								<Button
									onClick={handleOpenAdd}
									variant="outline"
									size="sm"
									className="text-purple-700 border-purple-300 hover:bg-purple-50 text-xs font-semibold gap-1.5"
								>
									<Plus className="w-3.5 h-3.5" /> Tambah Kegiatan Pertama
								</Button>
							)}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{triDharmaList.map((act) => {
								const isApproved =
									act.status === "DISETUJUI" || Boolean(act.isDone);
								const isPending = act.status === "MENUNGGU_REVIEW";
								const isRevision = act.status === "PERLU_REVISI";

								const categoryLabel =
									TRI_DHARMA_CATEGORIES.find((c) => c.value === act.category)
										?.label ||
									(act.category === "penelitian"
										? "Penelitian"
										: "Pengabdian Kepada Masyarakat (PKM)");
								const locationTypeLabel =
									TRI_DHARMA_LOCATIONS.find(
										(loc) => loc.value === act.locationType,
									)?.label ||
									(act.locationType === "desa_binaan"
										? "Desa Binaan"
										: "Sekolah Mitra");

								return (
									<div
										key={act.id}
										className={`p-4 rounded-xl border transition-all space-y-3 ${
											isApproved
												? "border-emerald-200 bg-emerald-50/20 shadow-2xs"
												: isRevision
													? "border-rose-200 bg-rose-50/20"
													: "border-slate-200 bg-white"
										}`}
									>
										{/* Top Badges */}
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="flex flex-wrap items-center gap-1.5">
												<Badge
													className={
														act.category === "penelitian"
															? "bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold"
															: "bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold"
													}
												>
													{categoryLabel}
												</Badge>

												<Badge
													variant="outline"
													className={
														act.locationType === "desa_binaan"
															? "bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1 font-semibold"
															: "bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1 font-semibold"
													}
												>
													{act.locationType === "desa_binaan" ? (
														<MapPin className="w-3 h-3 text-emerald-600" />
													) : (
														<School className="w-3 h-3 text-amber-600" />
													)}
													{locationTypeLabel}
												</Badge>
											</div>

											{/* Status Badge */}
											{isApproved ? (
												<Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
													<CheckCircle2 className="w-3 h-3" /> Disetujui
												</Badge>
											) : isPending ? (
												<Badge className="bg-amber-500 text-white text-[10px] font-bold gap-1">
													Menunggu Review
												</Badge>
											) : isRevision ? (
												<Badge className="bg-rose-600 text-white text-[10px] font-bold gap-1">
													<AlertCircle className="w-3 h-3" /> Perlu Revisi
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-400 text-[10px]"
												>
													Belum Diisi
												</Badge>
											)}
										</div>

										{/* Title & Location */}
										<div>
											<h4 className="text-sm font-bold text-slate-900 leading-snug">
												{act.title || "Tanpa Judul Kegiatan"}
											</h4>
											<p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1.5">
												<span className="font-semibold text-slate-800">
													Lokasi:
												</span>{" "}
												{act.locationName || "-"}
											</p>
										</div>

										{/* Metadata Grid */}
										<div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
											<div>
												<span className="text-[10px] uppercase font-bold text-slate-400 block">
													Tanggal
												</span>
												<span className="text-slate-700 font-semibold">
													{act.date
														? new Date(act.date).toLocaleDateString("id-ID", {
																day: "numeric",
																month: "short",
																year: "numeric",
															})
														: "-"}
												</span>
											</div>
											<div>
												<span className="text-[10px] uppercase font-bold text-slate-400 block">
													Dosen Pembimbing
												</span>
												<span className="text-slate-700 font-semibold truncate block">
													{act.lecturerName || "-"}
												</span>
											</div>
										</div>

										{/* Description if present */}
										{act.description && (
											<div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
												{act.description}
											</div>
										)}

										{/* Review Notes alert */}
										{act.reviewNotes && (
											<div
												className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${
													isRevision
														? "bg-rose-50 border-rose-200 text-rose-800"
														: "bg-emerald-50 border-emerald-200 text-emerald-800"
												}`}
											>
												<AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
												<div>
													<p className="font-bold text-[11px]">
														Catatan Review CRM:
													</p>
													<p className="text-[11px] mt-0.5">
														{act.reviewNotes}
													</p>
												</div>
											</div>
										)}

										{/* Upload & Review Laporan */}
										<div className="pt-2 border-t border-slate-100">
											<div className="flex items-center justify-between mb-1.5">
												<Label className="text-[10px] uppercase font-bold text-slate-500 block">
													Laporan &amp; Bukti Tri Dharma (PDF)
												</Label>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="crm"
												documentKey={`tri_dharma_${act.id}_report`}
												canEdit={canEdit}
												onUpdate={() => {
													fetchCrmData();
													onUpdate();
												}}
											/>
										</div>

										{/* Admin Action Buttons */}
										{canEdit && (
											<div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
												<div className="flex items-center gap-1.5">
													{!isApproved && (
														<Button
															size="sm"
															onClick={() =>
																handleReviewActivity(act.id, "APPROVE")
															}
															disabled={isReviewing}
															className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 px-3 gap-1 shadow-2xs"
														>
															<Check className="w-3 h-3" />
															Setujui
														</Button>
													)}

													{!isRevision && (
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																setRevisionActivityId(act.id);
																setRevisionNotes(act.reviewNotes || "");
																setIsRevisionOpen(true);
															}}
															disabled={isReviewing}
															className="text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold text-xs h-7 px-2.5 gap-1"
														>
															<AlertCircle className="w-3 h-3" />
															Minta Revisi
														</Button>
													)}
												</div>

												<div className="flex items-center gap-1">
													<Button
														size="sm"
														variant="ghost"
														onClick={() => handleOpenEdit(act)}
														className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs h-7 px-2"
													>
														<Edit className="w-3 h-3 mr-1" /> Edit
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() => handleDeleteActivity(act.id)}
														className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-7 px-2"
													>
														<Trash2 className="w-3 h-3 mr-1" /> Hapus
													</Button>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* ─── DIALOG TAMBAH / EDIT TRI DHARMA ─── */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-lg p-5">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<GraduationCap className="w-5 h-5 text-purple-600" />
							{editingActivity
								? "Edit Kegiatan Tri Dharma"
								: "Tambah Kegiatan Tri Dharma"}
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Akomodasi kegiatan penelitian atau pengabdian masyarakat (PKM)
							dosen dan mahasiswa (Segmen 9).
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3.5 my-2 text-xs">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="text-[11px] font-bold text-slate-700 block mb-1">
									Kategori Kegiatan <span className="text-rose-500">*</span>
								</Label>
								<Select
									value={formCategory}
									onValueChange={(val: any) => setFormCategory(val)}
								>
									<SelectTrigger className="h-8 text-xs bg-white">
										<SelectValue placeholder="Pilih Kategori">
											{TRI_DHARMA_CATEGORIES.find(
												(c) => c.value === formCategory,
											)?.label || "Pilih Kategori"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{TRI_DHARMA_CATEGORIES.map((cat) => (
											<SelectItem
												key={cat.value}
												value={cat.value}
												className="text-xs"
											>
												{cat.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label className="text-[11px] font-bold text-slate-700 block mb-1">
									Tipe Lokasi Pelaksanaan{" "}
									<span className="text-rose-500">*</span>
								</Label>
								<Select
									value={formLocationType}
									onValueChange={(val: any) => setFormLocationType(val)}
								>
									<SelectTrigger className="h-8 text-xs bg-white">
										<SelectValue placeholder="Pilih Tipe Lokasi">
											{TRI_DHARMA_LOCATIONS.find(
												(loc) => loc.value === formLocationType,
											)?.label || "Pilih Tipe Lokasi"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{TRI_DHARMA_LOCATIONS.map((loc) => (
											<SelectItem
												key={loc.value}
												value={loc.value}
												className="text-xs"
											>
												{loc.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div>
							<Label className="text-[11px] font-bold text-slate-700 block mb-1">
								Nama{" "}
								{formLocationType === "desa_binaan"
									? "Desa Binaan"
									: "Sekolah Mitra"}{" "}
								<span className="text-rose-500">*</span>
							</Label>
							<Input
								placeholder={
									formLocationType === "desa_binaan"
										? "Contoh: Desa Binaan Hanura, Pesawaran"
										: "Contoh: SMK Negeri 1 Bandar Lampung"
								}
								value={formLocationName}
								onChange={(e) => setFormLocationName(e.target.value)}
								className="h-8 text-xs bg-white"
							/>
						</div>

						<div>
							<Label className="text-[11px] font-bold text-slate-700 block mb-1">
								Judul / Topik Kegiatan <span className="text-rose-500">*</span>
							</Label>
							<Input
								placeholder="Contoh: Pelatihan Standar Pelayanan Prima & Food Safety"
								value={formTitle}
								onChange={(e) => setFormTitle(e.target.value)}
								className="h-8 text-xs bg-white"
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="text-[11px] font-bold text-slate-700 block mb-1">
									Tanggal Pelaksanaan
								</Label>
								<Input
									type="date"
									value={formDate}
									onChange={(e) => setFormDate(e.target.value)}
									className="h-8 text-xs bg-white"
								/>
							</div>

							<div>
								<Label className="text-[11px] font-bold text-slate-700 block mb-1">
									Dosen Pendamping / Pembimbing
								</Label>
								<Input
									placeholder="Contoh: Dr. Budi Santoso, M.Par"
									value={formLecturer}
									onChange={(e) => setFormLecturer(e.target.value)}
									className="h-8 text-xs bg-white"
								/>
							</div>
						</div>

						<div>
							<Label className="text-[11px] font-bold text-slate-700 block mb-1">
								Deskripsi / Ringkasan Pelaksanaan (Opsional)
							</Label>
							<Textarea
								placeholder="Tuliskan gambaran ringkas pelaksanaan dan luaran kegiatan..."
								value={formDescription}
								onChange={(e) => setFormDescription(e.target.value)}
								className="text-xs bg-white min-h-[60px]"
							/>
						</div>

						<div className="pt-2 border-t border-slate-100 flex items-center gap-2">
							<Checkbox
								id="tri-dharma-done"
								checked={formIsDone}
								onCheckedChange={(checked) => setFormIsDone(Boolean(checked))}
								className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
							/>
							<Label
								htmlFor="tri-dharma-done"
								className="text-xs font-semibold text-slate-700 cursor-pointer"
							>
								Tandai kegiatan ini langsung disetujui (ACC / Selesai)
							</Label>
						</div>
					</div>

					<DialogFooter className="gap-2 mt-2">
						<DialogClose asChild>
							<Button variant="outline" size="sm" className="text-xs">
								Batal
							</Button>
						</DialogClose>
						<Button
							size="sm"
							onClick={handleSaveActivity}
							disabled={isSubmitting}
							className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									Menyimpan...
								</>
							) : editingActivity ? (
								"Simpan Perubahan"
							) : (
								"Tambah Kegiatan"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ─── DIALOG CATATAN REVISI TRI DHARMA ─── */}
			<Dialog open={isRevisionOpen} onOpenChange={setIsRevisionOpen}>
				<DialogContent className="max-w-md p-5">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-rose-600" />
							Minta Revisi Kegiatan Tri Dharma
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Berikan instruksi perbaikan dokumen laporan atau kelengkapan data
							kegiatan untuk mahasiswa.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 my-2 text-xs">
						<div>
							<Label className="text-[11px] font-bold text-slate-700 block mb-1">
								Catatan Revisi <span className="text-rose-500">*</span>
							</Label>
							<Textarea
								placeholder="Contoh: Lampirkan bukti tanda tangan surat pengesahan dari sekolah mitra dan scan PDF yang lebih jelas."
								value={revisionNotes}
								onChange={(e) => setRevisionNotes(e.target.value)}
								className="text-xs bg-white min-h-[90px]"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 mt-2">
						<DialogClose asChild>
							<Button variant="outline" size="sm" className="text-xs">
								Batal
							</Button>
						</DialogClose>
						<Button
							size="sm"
							onClick={() => {
								if (revisionActivityId) {
									handleReviewActivity(
										revisionActivityId,
										"REVISE",
										revisionNotes,
									);
								}
							}}
							disabled={isReviewing || !revisionNotes.trim()}
							className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
						>
							{isReviewing ? (
								<>
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
									Menyimpan...
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
