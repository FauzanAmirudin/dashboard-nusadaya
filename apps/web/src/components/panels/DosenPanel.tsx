"use client";

import {
	CheckCircle,
	Clock,
	Edit2,
	Eye,
	Loader2,
	Paperclip,
	PlusCircle,
	Save,
	Trash2,
	Unlock,
	X,
	XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { AttitudeLogs } from "@/components/panels/vokasi/AttitudeLogs";
import { Entrepreneurship } from "@/components/panels/vokasi/Entrepreneurship";
import { WeeklyEvents } from "@/components/panels/vokasi/WeeklyEvents";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface DocFile {
	id: number;
	documentKey: string;
	fileName: string;
	fileUrl: string;
	fileSize?: number;
	isVerified: boolean;
	uploadedAt: string;
	verifiedAt?: string;
	uploadedBy?: { fullName: string };
	verifiedBy?: { fullName: string };
}

interface CourseGrade {
	id: number;
	courseCode: string;
	courseName: string;
	dosenId: number;
	grade: string | null;
	attendanceRate: number | null;
	attitudeNote: string | null;
	practicalScore: number | null;
	theoryScore: number | null;
	entrepreneurScore: number | null;
	productPhotoUrl: string | null;
	totalMeetings: number | null;
	attendancePresent: number | null;
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	isAcc: boolean;
	accAt: string | null;
	accBy: { fullName: string } | null;
	dosen?: { fullName: string } | null;
	hasKwu?: boolean;
	kwuScore?: number | null;
}

interface DosenPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function DosenPanel({ studentId, onUpdate }: DosenPanelProps) {
	const { user } = useAuthStore();
	const isDosen = user?.role === "dosen" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";

	const [gradesData, setGradesData] = useState<CourseGrade[]>([]);
	const [documents, setDocuments] = useState<
		Record<number, Record<string, DocFile[]>>
	>({});
	const [isLoading, setIsLoading] = useState(true);
	const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

	const [editingId, setEditingId] = useState<number | null>(null);
	const [savingId, setSavingId] = useState<number | null>(null);
	const [uploadingKey, setUploadingKey] = useState<string | null>(null);

	const [editForm, setEditForm] = useState<{
		attendanceRate: number | string;
		attendancePresent: number | string;
		totalMeetings: number | string;
		practicalScore: number | string;
		theoryScore: number | string;
		kwuScore: number | string;
		grade: string;
		attitudeNote: string;
	}>({
		attendanceRate: 0,
		attendancePresent: 0,
		totalMeetings: 16,
		practicalScore: 0,
		theoryScore: 0,
		kwuScore: 0,
		grade: "E",
		attitudeNote: "Buruk",
	});

	// State for Add MK Dialog
	const [showAddModal, setShowAddModal] = useState(false);
	const [newMK, setNewMK] = useState({
		courseCode: "",
		courseName: "",
		dosenId: user?.id || 0,
		hasKwu: true,
	});

	const [isDeleteCourseOpen, setIsDeleteCourseOpen] = useState(false);
	const [selectedCourseToDelete, setSelectedCourseToDelete] = useState<{ id: number; name: string } | null>(null);

	const [isDeleteDocOpen, setIsDeleteDocOpen] = useState(false);
	const [selectedDocToDelete, setSelectedDocToDelete] = useState<{ courseId: number; docId: number } | null>(null);

	const fetchGrades = async () => {
		const { data, error } =
			await api.students[studentId.toString()]["course-grades"].get();
		if (!error && data?.success) {
			setGradesData(data.data as CourseGrade[]);
		}
		setIsLoading(false);
	};

	const fetchDocumentsForCourse = async (courseId: number) => {
		const { data, error } =
			await api.students[studentId.toString()]["course-grades"][
				courseId.toString()
			].documents.get();
		if (!error && data?.success) {
			setDocuments((prev) => ({
				...prev,
				[courseId]: data.data as Record<string, DocFile[]>,
			}));
		}
	};

	useEffect(() => {
		fetchGrades();
	}, [studentId]);

	useEffect(() => {
		gradesData.forEach((g) => fetchDocumentsForCourse(g.id));
	}, [gradesData]);

	// Calculation helpers
	const getGpaPoints = (grade: string | null) => {
		switch (grade) {
			case "A":
				return 4.0;
			case "A-":
				return 3.7;
			case "B+":
				return 3.3;
			case "B":
				return 3.0;
			case "B-":
				return 2.7;
			case "C+":
				return 2.3;
			case "C":
				return 2.0;
			case "D":
				return 1.0;
			case "E":
				return 0.0;
			default:
				return 0.0;
		}
	};

	let totalGpaPoints = 0;
	let badGradeCount = 0;
	let badAttitudeCount = 0;
	let isAllAcc = gradesData.length > 0;

	gradesData.forEach((g) => {
		totalGpaPoints += getGpaPoints(g.grade);
		if (g.status === "TIDAK_AMAN") badGradeCount++;
		if (g.attitudeNote === "Buruk") badAttitudeCount++;
		if (!g.isAcc) isAllAcc = false;
	});

	const estimatedGpa =
		gradesData.length > 0
			? (totalGpaPoints / gradesData.length).toFixed(2)
			: "0.00";

	let panelStatusBadge = (
		<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
			🟢 AMAN
		</Badge>
	);
	if (badGradeCount > 0) {
		panelStatusBadge = (
			<Badge className="bg-rose-50 text-rose-600 border-rose-200">
				🔴 TIDAK AMAN
			</Badge>
		);
	} else if (gradesData.some((g) => g.status === "PERLU_PERHATIAN")) {
		panelStatusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	// Actions
	const handleEditClick = (g: CourseGrade) => {
		setEditingId(g.id);
		setEditForm({
			attendanceRate: g.attendanceRate ?? 0,
			attendancePresent: g.attendancePresent ?? 0,
			totalMeetings: g.totalMeetings ?? 16,
			practicalScore: g.practicalScore ?? 0,
			theoryScore: g.theoryScore ?? 0,
			kwuScore: g.kwuScore ?? 0,
			grade: g.grade ?? "E",
			attitudeNote: g.attitudeNote ?? "Buruk",
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
	};

	const handleSaveEdit = async (courseId: number) => {
		setSavingId(courseId);

		const practical = Number(editForm.practicalScore) || 0;
		const theory = Number(editForm.theoryScore) || 0;
		const kwu = Number(editForm.kwuScore) || 0;
		const att =
			((Number(editForm.attendancePresent) || 0) /
				(Number(editForm.totalMeetings) || 16)) *
			100;

		const currentGrade = gradesData.find((gr) => gr.id === courseId);
		let finalScore = 0;
		if (currentGrade?.hasKwu) {
			finalScore = practical * 0.5 + theory * 0.2 + kwu * 0.15 + att * 0.15;
		} else {
			finalScore = practical * 0.5 + theory * 0.35 + att * 0.15;
		}

		let calculatedGrade = "E";
		if (finalScore >= 85) calculatedGrade = "A";
		else if (finalScore >= 75) calculatedGrade = "B";
		else if (finalScore >= 65) calculatedGrade = "C";
		else if (finalScore >= 50) calculatedGrade = "D";

		const { error } = await api.students[studentId.toString()]["course-grades"][
			courseId.toString()
		].patch({
			attendancePresent: Number(editForm.attendancePresent) || 0,
			totalMeetings: Number(editForm.totalMeetings) || 16,
			practicalScore: practical,
			theoryScore: theory,
			kwuScore: kwu,
			grade: calculatedGrade,
			attitudeNote: editForm.attitudeNote,
		});

		if (!error) {
			toast.success("Nilai MK berhasil disimpan");
			setEditingId(null);
			fetchGrades();
			onUpdate();
		} else {
			toast.error("Gagal menyimpan nilai MK");
		}
		setSavingId(null);
	};

	const handleAcc = async (courseId: number, courseName: string) => {
		const { error } =
			await api.students[studentId.toString()]["course-grades"][
				courseId.toString()
			].acc.post();
		if (!error) {
			toast.success(`MK ${courseName} berhasil di-ACC dan dikunci`);
			fetchGrades();
			onUpdate();
		} else {
			toast.error("Gagal mengunci nilai");
		}
	};

	const handleUnlock = async (courseId: number, courseName: string) => {
		const { error } =
			await api.students[studentId.toString()]["course-grades"][
				courseId.toString()
			].unlock.post();
		if (!error) {
			toast.success(`Kunci MK ${courseName} berhasil dibuka`);
			fetchGrades();
			onUpdate();
		} else {
			toast.error("Gagal membuka kunci nilai");
		}
	};

	const handleAddMK = async () => {
		if (!newMK.courseCode || !newMK.courseName || !newMK.dosenId) {
			toast.error("Semua field harus diisi");
			return;
		}
		const { error } =
			await api.students[studentId.toString()]["course-grades"].post(newMK);
		if (!error) {
			toast.success("Mata Kuliah berhasil ditambahkan");
			setNewMK({
				courseCode: "",
				courseName: "",
				dosenId: user?.id || 0,
				hasKwu: true,
			});
			setShowAddModal(false);
			fetchGrades();
		} else {
			toast.error("Gagal menambahkan MK");
		}
	};

	const confirmDeleteCourse = (courseId: number, courseName: string) => {
		setSelectedCourseToDelete({ id: courseId, name: courseName });
		setIsDeleteCourseOpen(true);
	};

	const handleDeleteCourse = async () => {
		if (!selectedCourseToDelete) return;
		const { error } =
			await api.students[studentId.toString()]["course-grades"][
				selectedCourseToDelete.id.toString()
			].delete();
		if (!error) {
			toast.success(`MK "${selectedCourseToDelete.name}" berhasil dihapus`);
			setIsDeleteCourseOpen(false);
			setSelectedCourseToDelete(null);
			fetchGrades();
			onUpdate();
		} else {
			toast.error("Gagal menghapus MK");
		}
	};

	const toggleExpand = (courseId: number) => {
		setExpandedRows((prev) => {
			const next = new Set(prev);
			if (next.has(courseId)) next.delete(courseId);
			else next.add(courseId);
			return next;
		});
	};

	// Document Actions
	const handleFileUpload = async (
		courseId: number,
		documentKey: string,
		file: File,
	) => {
		setUploadingKey(`${courseId}-${documentKey}`);

		const formData = new FormData();
		formData.append("file", file);

		const token = localStorage.getItem("token");
		const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/course-grades/${courseId}/upload/${documentKey}`,
				{
					method: "POST",
					body: formData,
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			if (res.ok) {
				toast.success("Dokumen berhasil diupload");
				fetchDocumentsForCourse(courseId);
			} else {
				const err = await res.json();
				toast.error(err.message || "Gagal mengupload dokumen");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setUploadingKey(null);
		}
	};

	const handleViewDocument = (courseId: number, docId: number) => {
		const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
		window.open(
			`${API_URL}/students/${studentId}/course-grades/${courseId}/documents/${docId}/download`,
			"_blank",
		);
	};

	const handleVerifyDocument = async (courseId: number, docId: number) => {
		const { error } = await api.students[studentId.toString()]["course-grades"][
			courseId.toString()
		].documents[docId.toString()].verify.patch({});
		if (!error) {
			toast.success("Dokumen terverifikasi");
			fetchDocumentsForCourse(courseId);
		} else {
			toast.error("Gagal memverifikasi dokumen");
		}
	};

	const confirmDeleteDocument = (courseId: number, docId: number) => {
		setSelectedDocToDelete({ courseId, docId });
		setIsDeleteDocOpen(true);
	};

	const handleDeleteDocument = async () => {
		if (!selectedDocToDelete) return;
		const { error } =
			await api.students[studentId.toString()]["course-grades"][
				selectedDocToDelete.courseId.toString()
			].documents[selectedDocToDelete.docId.toString()].delete();
		if (!error) {
			toast.success("Dokumen dihapus");
			setIsDeleteDocOpen(false);
			setSelectedDocToDelete(null);
			fetchDocumentsForCourse(selectedDocToDelete.courseId);
		} else {
			toast.error("Gagal menghapus dokumen");
		}
	};

	// Manually rendered docs are no longer needed, using DocumentUpload now.

	if (isLoading) {
		return (
			<div className="p-8 text-center text-slate-500 flex flex-col items-center gap-3">
				<Loader2 className="w-8 h-8 animate-spin text-blue-500" />
				Memuat data dosen & mata kuliah...
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<div className="border-b border-slate-200 pb-4 mb-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
							<span className="text-xl">📚</span> Dosen — Nilai & Kehadiran per
							MK
							<span className="ml-2 text-sm font-normal text-slate-500">
								[{gradesData.filter((g) => g.isAcc).length}/{gradesData.length}{" "}
								ACC]
							</span>
						</CardTitle>
						<div className="flex items-center gap-3 w-full sm:w-auto">
							{isSuperadmin && (
								<Button
									size="sm"
									onClick={() => setShowAddModal(true)}
									className="bg-[#0517B0] hover:bg-blue-800 text-white gap-2 h-8"
								>
									<PlusCircle className="w-4 h-4" /> Tambah MK
								</Button>
							)}
							{!isSuperadmin && (
								<Badge
									variant="outline"
									className="border-slate-200 text-slate-500 bg-white"
								>
									Dikelola oleh: Dosen MK
								</Badge>
							)}
							{panelStatusBadge}
						</div>
					</div>
				</div>
				<div>
					{/* TABLE SECTION */}
					<div className="mb-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
						<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<span className="bg-white border border-slate-200 p-1.5 rounded-md text-slate-500 shadow-sm">
									<Paperclip className="w-4 h-4" />
								</span>
								DAFTAR MATA KULIAH
							</h3>
						</div>
						<div className="p-5 space-y-4">
							{gradesData.map((g, index) => {
								const isEditing = editingId === g.id;
								const canEditThisRow =
									isSuperadmin || (isDosen && user?.id === g.dosenId);
								const isExpanded = expandedRows.has(g.id);

								const rowBgColor =
									g.status === "AMAN"
										? "bg-emerald-50 border-emerald-200"
										: g.status === "PERLU_PERHATIAN"
											? "bg-amber-50 border-amber-200"
											: "bg-rose-50 border-rose-200";

								const p = g.practicalScore || 0;
								const t = g.theoryScore || 0;
								const isInputted = p > 0 || t > 0;
								const finalScore = p * 0.8 + t * 0.2;
								let displayGrade = "E";
								if (finalScore >= 85) displayGrade = "A";
								else if (finalScore >= 75) displayGrade = "B";
								else if (finalScore >= 65) displayGrade = "C";
								else if (finalScore >= 50) displayGrade = "D";

								const finalScoreString = isInputted
									? `${finalScore.toFixed(1)} (${displayGrade})`
									: "-";

								return (
									<Collapsible
										key={g.id}
										open={isExpanded}
										onOpenChange={() => toggleExpand(g.id)}
										className={`border rounded-lg bg-white shadow-sm overflow-hidden transition-all ${
											isExpanded ? "ring-1 ring-blue-100" : ""
										}`}
									>
										<div
											className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 transition-colors border-b border-transparent ${
												isExpanded
													? "bg-slate-50/80 border-slate-100"
													: rowBgColor
											}`}
										>
											<div className="flex-1 mb-4 lg:mb-0 flex gap-3">
												<div className="mt-0.5 shrink-0">
													<div className="w-6 h-6 rounded bg-slate-200/70 text-slate-600 border border-slate-300/50 flex items-center justify-center text-xs font-bold">
														{index + 1}
													</div>
												</div>
												<div>
													<div className="flex items-center gap-2 mb-2">
														<h4 className="font-bold text-slate-800">
															{g.courseName}
														</h4>
														<Badge
															variant="outline"
															className="text-[10px] h-5 bg-white"
														>
															{g.courseCode}
														</Badge>
														{g.isAcc && (
															<Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 border-none h-5 px-1.5 text-[10px]">
																🔒 Terkunci
															</Badge>
														)}
													</div>
													<div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
														<div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-slate-100/50">
															<span className="text-slate-500">Kehadiran:</span>
															<span className="font-semibold">
																{g.attendanceRate}% (
																{g.attendancePresent ||
																	(g.attendanceRate
																		? Math.round(
																				(g.attendanceRate / 100) *
																					(g.totalMeetings || 16),
																			)
																		: 0)}
																/{g.totalMeetings || 16})
															</span>
															{(g.attendanceRate || 0) >= 90 ? (
																<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
															) : (
																<XCircle className="w-3.5 h-3.5 text-rose-500" />
															)}
														</div>
														<div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-slate-100/50">
															<span className="text-slate-500">
																Nilai Akhir:
															</span>
															<span className="font-bold text-blue-700">
																{finalScoreString}
															</span>
														</div>
														<div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-slate-100/50">
															<span className="text-slate-500">Praktik:</span>
															<span className="font-semibold text-slate-700">
																{g.practicalScore || 0}
															</span>
														</div>
														<div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-slate-100/50">
															<span className="text-slate-500">Teori:</span>
															<span className="font-semibold text-slate-700">
																{g.theoryScore || 0}
															</span>
														</div>
														<div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-slate-100/50">
															<span className="text-slate-500">KWU:</span>
															<span className="font-semibold text-slate-700">
																{g.hasKwu
																	? `Rp ${(g.entrepreneurScore || 0).toLocaleString("id-ID")}`
																	: "-"}
															</span>
															{g.hasKwu && (
																<span className="text-xs text-slate-400 font-medium ml-1">
																	(Skor: {g.kwuScore || 0})
																</span>
															)}
														</div>
														<div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-slate-100/50">
															<span className="text-slate-500">Catatan:</span>
															<span
																className={`font-medium ${
																	g.attitudeNote === "Baik"
																		? "text-emerald-700"
																		: g.attitudeNote === "Cukup"
																			? "text-amber-700"
																			: "text-rose-700"
																}`}
															>
																{g.attitudeNote || "-"}
															</span>
														</div>
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2 w-full lg:w-auto">
												{canEditThisRow && !g.isAcc && (
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															handleEditClick(g);
															if (!isExpanded) toggleExpand(g.id);
														}}
														className="h-8 text-blue-600 bg-white border-blue-100 hover:bg-blue-50 flex-1 lg:flex-none"
													>
														<Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Nilai
													</Button>
												)}
												<CollapsibleTrigger className="h-8 flex-1 lg:flex-none bg-white border border-slate-200 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 px-3 shadow-sm">
													{isExpanded ? "Tutup" : "Lihat Detail"}
												</CollapsibleTrigger>
											</div>
										</div>

										<CollapsibleContent className="bg-white">
											{/* Edit Form Area */}
											{isEditing && !g.isAcc && (
												<div className="p-5 bg-blue-50/50 border-b border-blue-100">
													<h5 className="text-xs font-bold text-blue-800 uppercase mb-4 flex items-center gap-1.5">
														<Edit2 className="w-3.5 h-3.5" /> Edit Nilai &
														Kehadiran
													</h5>
													<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
														<div className="space-y-1.5">
															<label className="text-xs font-medium text-slate-500">
																Hadir
															</label>
															<Input
																type="number"
																value={editForm.attendancePresent}
																onChange={(e) =>
																	setEditForm({
																		...editForm,
																		attendancePresent:
																			e.target.value === ""
																				? ""
																				: Number(e.target.value),
																	})
																}
																className="bg-white h-9"
																min={0}
															/>
														</div>
														<div className="space-y-1.5">
															<label className="text-xs font-medium text-slate-500">
																Total Pertemuan
															</label>
															<Input
																type="number"
																value={editForm.totalMeetings}
																onChange={(e) =>
																	setEditForm({
																		...editForm,
																		totalMeetings:
																			e.target.value === ""
																				? ""
																				: Number(e.target.value),
																	})
																}
																className="bg-white h-9"
																min={1}
															/>
														</div>
														<div className="space-y-1.5">
															<label className="text-xs font-medium text-slate-500">
																Nilai Praktik (0-100)
															</label>
															<Input
																type="number"
																value={editForm.practicalScore}
																onChange={(e) =>
																	setEditForm({
																		...editForm,
																		practicalScore:
																			e.target.value === ""
																				? ""
																				: Number(e.target.value),
																	})
																}
																className="bg-white h-9"
																min={0}
																max={100}
															/>
														</div>
														<div className="space-y-1.5">
															<label className="text-xs font-medium text-slate-500">
																Nilai Teori (0-100)
															</label>
															<Input
																type="number"
																value={editForm.theoryScore}
																onChange={(e) =>
																	setEditForm({
																		...editForm,
																		theoryScore:
																			e.target.value === ""
																				? ""
																				: Number(e.target.value),
																	})
																}
																className="bg-white h-9"
																min={0}
																max={100}
															/>
														</div>
														{g.hasKwu && (
															<div className="space-y-1.5">
																<label className="text-xs font-medium text-slate-500">
																	Skor KWU (0-100)
																</label>
																<Input
																	type="number"
																	value={editForm.kwuScore}
																	onChange={(e) =>
																		setEditForm({
																			...editForm,
																			kwuScore:
																				e.target.value === ""
																					? ""
																					: Number(e.target.value),
																		})
																	}
																	className="bg-white h-9 border-amber-200 focus-visible:ring-amber-500"
																	min={0}
																	max={100}
																/>
															</div>
														)}
														<div className="space-y-1.5">
															<label className="text-xs font-medium text-slate-500">
																Catatan Sikap
															</label>
															<Select
																value={editForm.attitudeNote ?? ""}
																onValueChange={(val) =>
																	setEditForm({
																		...editForm,
																		attitudeNote: val as string,
																	})
																}
															>
																<SelectTrigger className="bg-white h-9">
																	<SelectValue placeholder="Pilih Catatan" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="Baik">Baik</SelectItem>
																	<SelectItem value="Cukup">Cukup</SelectItem>
																	<SelectItem value="Buruk">Buruk</SelectItem>
																</SelectContent>
															</Select>
														</div>
													</div>
													<div className="flex justify-end items-center gap-2 border-t border-blue-100 pt-4 mt-2">
														<Button
															variant="ghost"
															onClick={handleCancelEdit}
															className="h-8 text-slate-500 hover:bg-slate-200"
														>
															Batal
														</Button>
														<Button
															onClick={() => handleSaveEdit(g.id)}
															disabled={savingId === g.id}
															className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
														>
															{savingId === g.id ? (
																<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
															) : (
																<Save className="w-4 h-4 mr-1.5" />
															)}{" "}
															Simpan Perubahan
														</Button>
													</div>
												</div>
											)}

											{/* Detail Document Area */}
											<div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-50/30">
												<div className="lg:col-span-3 space-y-4">
													<h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
														Lampiran Dokumen Dosen
													</h5>

													<div className="grid gap-3">
														<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
															<div className="mb-3">
																<span className="font-semibold text-slate-700 text-sm block">
																	Bukti Kehadiran
																</span>
																<span className="text-xs text-slate-500">
																	Daftar hadir atau rekap absensi dari Dosen
																</span>
															</div>
															<DocumentUpload
																studentId={studentId}
																panel="dosen"
																courseId={g.id}
																documentKey="attendance_proof"
																canEdit={canEditThisRow && !g.isAcc}
																
															/>
														</div>

														<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
															<div className="mb-3">
																<span className="font-semibold text-slate-700 text-sm block">
																	Kartu Nilai
																</span>
																<span className="text-xs text-slate-500">
																	Scan nilai UTS, UAS, atau tugas
																</span>
															</div>
															<DocumentUpload
																studentId={studentId}
																panel="dosen"
																courseId={g.id}
																documentKey="grade_card"
																canEdit={canEditThisRow && !g.isAcc}
																
															/>
														</div>

														<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
															<div className="mb-3">
																<span className="font-semibold text-slate-700 text-sm block">
																	Surat Dispensasi
																</span>
																<span className="text-xs text-slate-500">
																	Surat izin resmi jika mahasiswa tidak memenuhi
																	kehadiran
																</span>
															</div>
															<DocumentUpload
																studentId={studentId}
																panel="dosen"
																courseId={g.id}
																documentKey="dispensation"
																canEdit={canEditThisRow && !g.isAcc}
																
															/>
														</div>

														<div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
															<div className="mb-3">
																<span className="font-semibold text-slate-700 text-sm block">
																	Foto Produk Praktik
																</span>
																<span className="text-xs text-slate-500">
																	Wajib untuk penilaian praktik dan
																	kewirausahaan
																</span>
															</div>
															<DocumentUpload
																studentId={studentId}
																panel="dosen"
																courseId={g.id}
																documentKey="product_photo"
																canEdit={canEditThisRow && !g.isAcc}
																
															/>
															{g.productPhotoUrl && (
																<div className="mt-3">
																	<a
																		href={g.productPhotoUrl}
																		target="_blank"
																		rel="noreferrer"
																		className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
																	>
																		<Eye className="w-3 h-3" /> Lihat Foto Saat
																		Ini
																	</a>
																</div>
															)}
														</div>
													</div>
												</div>

												{/* Action Sidebar */}
												<div className="space-y-3 lg:border-l lg:border-slate-200 lg:pl-6">
													<h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
														Aksi Lanjutan
													</h5>

													{!isSuperadmin && isDosen && !canEditThisRow && (
														<Badge
															variant="outline"
															className="w-full justify-center py-2 text-slate-500 border-slate-300 bg-slate-50"
														>
															🔒 Bukan MK Anda
														</Badge>
													)}

													{canEditThisRow && !g.isAcc && (
														<AlertDialog>
															<AlertDialogTrigger
																render={
																	<Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
																		<CheckCircle className="w-4 h-4 mr-2" /> ACC
																		Mata Kuliah
																	</Button>
																}
															/>
															<AlertDialogContent className="bg-white border-slate-200">
																<AlertDialogTitle className="text-slate-800">
																	ACC Mata Kuliah: {g.courseName}
																</AlertDialogTitle>
																<AlertDialogDescription className="text-slate-500">
																	Anda akan mengunci nilai untuk mata kuliah
																	ini:
																</AlertDialogDescription>
																<div className="mt-4 bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3 mb-4 text-slate-800">
																	<div className="flex justify-between items-center text-sm">
																		<span className="text-slate-500">
																			Kehadiran:
																		</span>
																		<span className="font-bold">
																			{g.attendanceRate}%
																		</span>
																	</div>
																	<div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
																		<span className="text-slate-500">
																			Nilai/Grade:
																		</span>
																		<span className="font-bold text-blue-700 text-base">
																			{g.grade || "-"}
																		</span>
																	</div>
																	<div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
																		<span className="text-slate-500">
																			Catatan Sikap:
																		</span>
																		<span className="font-bold">
																			{g.attitudeNote || "-"}
																		</span>
																	</div>
																</div>
																<div className="flex items-center gap-2 text-amber-700 text-sm font-medium bg-amber-50 p-2 rounded border border-amber-200">
																	<span>⚠️</span> Data tidak dapat diubah setelah
																	dikunci!
																</div>
																<div className="flex justify-end gap-3 mt-5">
																	<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50 text-slate-600">
																		Batal
																	</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			handleAcc(g.id, g.courseName)
																		}
																		className="bg-emerald-600 hover:bg-emerald-700 text-white"
																	>
																		Ya, Kunci Nilai
																	</AlertDialogAction>
																</div>
															</AlertDialogContent>
														</AlertDialog>
													)}

													{isSuperadmin && !g.isAcc && (
														<AlertDialog>
															<AlertDialogTrigger
																render={
																	<Button
																		variant="outline"
																		className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
																	>
																		<Trash2 className="w-4 h-4 mr-2" /> Hapus MK
																	</Button>
																}
															/>
															<AlertDialogContent className="bg-white border-slate-200">
																<AlertDialogTitle>
																	Hapus Mata Kuliah
																</AlertDialogTitle>
																<AlertDialogDescription className="text-slate-500">
																	Apakah Anda yakin ingin menghapus mata kuliah
																	"{g.courseName}"? Data nilai dan dokumen yang
																	diunggah akan ikut terhapus permanen.
																</AlertDialogDescription>
																<div className="flex justify-end gap-3 mt-4">
																	<AlertDialogCancel className="bg-transparent border-slate-200 text-slate-600">
																		Batal
																	</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			confirmDeleteCourse(g.id, g.courseName)
																		}
																		className="bg-rose-600 hover:bg-rose-700 text-white"
																	>
																		Ya, Hapus
																	</AlertDialogAction>
																</div>
															</AlertDialogContent>
														</AlertDialog>
													)}

													{g.isAcc && (
														<div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-center">
															<div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-2">
																<span className="text-lg">🔒</span>
															</div>
															<p className="text-sm text-slate-700 font-bold">
																Data Terkunci
															</p>
															<p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
																Mata kuliah ini telah di-ACC. Dokumen dan nilai
																tidak dapat diubah lagi.
															</p>

															{isSuperadmin && (
																<AlertDialog>
																	<AlertDialogTrigger
																		render={
																			<Button
																				size="sm"
																				variant="outline"
																				className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
																			>
																				<Unlock className="w-3.5 h-3.5 mr-2" />{" "}
																				Buka Kunci
																			</Button>
																		}
																	/>
																	<AlertDialogContent className="bg-white border-slate-200">
																		<AlertDialogTitle>
																			Buka Kunci Mata Kuliah
																		</AlertDialogTitle>
																		<AlertDialogDescription className="text-slate-500">
																			Apakah Anda yakin ingin membuka kunci
																			nilai mata kuliah "{g.courseName}"? Ini
																			akan memungkinkan dosen untuk mengedit
																			nilai dan dokumen kembali.
																		</AlertDialogDescription>
																		<div className="flex justify-end gap-3 mt-4">
																			<AlertDialogCancel className="bg-transparent border-slate-200 text-slate-600">
																				Batal
																			</AlertDialogCancel>
																			<AlertDialogAction
																				onClick={() =>
																					handleUnlock(g.id, g.courseName)
																				}
																				className="bg-amber-600 hover:bg-amber-700 text-white"
																			>
																				Ya, Buka Kunci
																			</AlertDialogAction>
																		</div>
																	</AlertDialogContent>
																</AlertDialog>
															)}
														</div>
													)}
												</div>
											</div>
										</CollapsibleContent>
									</Collapsible>
								);
							})}

							{gradesData.length === 0 && (
								<div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-10 text-center flex flex-col items-center">
									<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
										<span className="text-2xl">📚</span>
									</div>
									<p className="text-slate-600 font-medium">
										Belum ada data mata kuliah
									</p>
									<p className="text-slate-500 text-sm mt-1 max-w-sm">
										Mata kuliah yang di-assign untuk mahasiswa ini akan muncul
										di sini.
									</p>
								</div>
							)}
						</div>
					</div>

					{/* RINGKASAN */}
					<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
						<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								RINGKASAN NILAI
							</h3>
						</div>
						<div className="p-5">
							<div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-6">
								<div className="flex-1">
									<p className="text-sm text-slate-500 font-semibold mb-1">
										GPA Estimasi
									</p>
									<div className="text-3xl font-bold text-blue-900">
										{estimatedGpa}
									</div>
								</div>
								<div className="flex-1">
									<p className="text-sm text-slate-500 font-semibold mb-1">
										MK Tidak Aman
									</p>
									<div className="text-xl font-bold text-rose-700">
										{badGradeCount}
									</div>
									{badGradeCount > 0 && (
										<p className="text-xs text-rose-600 mt-1">
											{gradesData
												.filter((g) => g.status === "TIDAK_AMAN")
												.map((g) => g.courseName)
												.join(", ")}
										</p>
									)}
								</div>
								<div className="flex-1">
									<p className="text-sm text-slate-500 font-semibold mb-1">
										Catatan Buruk
									</p>
									<div className="text-xl font-bold text-amber-700">
										{badAttitudeCount}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Status ACC Panel Card */}
			<Card className="bg-slate-50 border-slate-200 shadow-sm overflow-hidden">
				<CardContent className="p-0">
					<div className="flex flex-col sm:flex-row items-center justify-between p-6">
						<div className="flex items-center gap-4 mb-4 sm:mb-0">
							{isAllAcc ? (
								<>
									<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
										<CheckCircle className="w-6 h-6 text-emerald-600" />
									</div>
									<div>
										<h4 className="text-emerald-700 font-bold text-lg">
											✅ Semua MK Telah di-ACC
										</h4>
										<p className="text-sm text-slate-600">
											Seluruh dosen pengampu telah memberikan nilai dan
											menyetujui secara final.
										</p>
									</div>
								</>
							) : (
								<>
									<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
										<Clock className="w-6 h-6 text-slate-500" />
									</div>
									<div>
										<h4 className="text-slate-700 font-bold text-lg">
											⏳ Menunggu ACC Dosen
										</h4>
										<p className="text-sm text-slate-500 max-w-md">
											Masih ada{" "}
											{gradesData.length -
												gradesData.filter((g) => g.isAcc).length}{" "}
											mata kuliah yang belum di-ACC oleh dosen pengampu.
										</p>
									</div>
								</>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Dialog Add MK */}
			<Dialog open={showAddModal} onOpenChange={setShowAddModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Mata Kuliah Baru</DialogTitle>
						<DialogDescription>
							Masukkan data mata kuliah dan ID dosen pengampu. (Fitur ini khusus
							Superadmin).
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">
								Kode Mata Kuliah
							</label>
							<Input
								placeholder="e.g. IT-101"
								value={newMK.courseCode}
								onChange={(e) =>
									setNewMK({ ...newMK, courseCode: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">
								Nama Mata Kuliah
							</label>
							<Input
								placeholder="e.g. Pemrograman Dasar"
								value={newMK.courseName}
								onChange={(e) =>
									setNewMK({ ...newMK, courseName: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">
								ID Dosen Pengampu
							</label>
							<Input
								type="number"
								placeholder="ID User Dosen"
								value={newMK.dosenId || ""}
								onChange={(e) =>
									setNewMK({
										...newMK,
										dosenId: parseInt(e.target.value, 10) || 0,
									})
								}
							/>
						</div>
						<div className="flex items-center gap-2 pt-2">
							<input
								type="checkbox"
								id="hasKwuCheck"
								checked={newMK.hasKwu}
								onChange={(e) =>
									setNewMK({ ...newMK, hasKwu: e.target.checked })
								}
								className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<label htmlFor="hasKwuCheck" className="text-sm text-slate-700">
								Mata Kuliah memiliki praktik PKWU?
							</label>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowAddModal(false)}>
							Batal
						</Button>
						<Button
							onClick={handleAddMK}
							className="bg-[#0517B0] hover:bg-blue-800 text-white"
						>
							Simpan MK
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* NEW VOKASI MODULES */}
			<AttitudeLogs studentId={studentId} courseGrades={gradesData} />
			<Entrepreneurship
				studentId={studentId}
				courseGrades={gradesData}
				onUpdate={fetchGrades}
			/>
			<WeeklyEvents studentId={studentId} />

			<Dialog open={isDeleteCourseOpen} onOpenChange={setIsDeleteCourseOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Konfirmasi Hapus Mata Kuliah</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<p className="text-slate-600">
							Apakah Anda yakin ingin menghapus MK "{selectedCourseToDelete?.name}"? Seluruh data nilai dan status ACC akan ikut terhapus dan tidak dapat dikembalikan.
						</p>
						<div className="flex justify-end gap-3 pt-4">
							<Button variant="outline" onClick={() => setIsDeleteCourseOpen(false)}>
								Batal
							</Button>
							<Button
								variant="destructive"
								onClick={handleDeleteCourse}
							>
								Hapus MK
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteDocOpen} onOpenChange={setIsDeleteDocOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Konfirmasi Hapus Dokumen</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<p className="text-slate-600">
							Apakah Anda yakin ingin menghapus dokumen lampiran ini?
						</p>
						<div className="flex justify-end gap-3 pt-4">
							<Button variant="outline" onClick={() => setIsDeleteDocOpen(false)}>
								Batal
							</Button>
							<Button
								variant="destructive"
								onClick={handleDeleteDocument}
							>
								Hapus Dokumen
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
