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
	X,
	XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	isAcc: boolean;
	accAt: string | null;
	accBy: { fullName: string } | null;
	dosen?: { fullName: string } | null;
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
		attendanceRate: number;
		grade: string;
		attitudeNote: string;
	}>({
		attendanceRate: 0,
		grade: "E",
		attitudeNote: "Buruk",
	});

	// State for Add MK Dialog
	const [showAddModal, setShowAddModal] = useState(false);
	const [newMK, setNewMK] = useState({
		courseCode: "",
		courseName: "",
		dosenId: user?.id || 0,
	});

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
			grade: g.grade ?? "E",
			attitudeNote: g.attitudeNote ?? "Buruk",
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
	};

	const handleSaveEdit = async (courseId: number) => {
		setSavingId(courseId);
		const { error } = await api.students[studentId.toString()]["course-grades"][
			courseId.toString()
		].patch({
			attendanceRate: editForm.attendanceRate,
			grade: editForm.grade,
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

	const handleAddMK = async () => {
		if (!newMK.courseCode || !newMK.courseName || !newMK.dosenId) {
			toast.error("Semua field harus diisi");
			return;
		}
		const { error } =
			await api.students[studentId.toString()]["course-grades"].post(newMK);
		if (!error) {
			toast.success("Mata Kuliah berhasil ditambahkan");
			setNewMK({ courseCode: "", courseName: "", dosenId: user?.id || 0 });
			setShowAddModal(false);
			fetchGrades();
		} else {
			toast.error("Gagal menambahkan MK");
		}
	};

	const handleDeleteCourse = async (courseId: number, courseName: string) => {
		if (!confirm(`Hapus MK "${courseName}"? Data nilai dan ACC akan hilang.`))
			return;

		const { error } =
			await api.students[studentId.toString()]["course-grades"][
				courseId.toString()
			].delete();
		if (!error) {
			toast.success(`MK "${courseName}" berhasil dihapus`);
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

	const handleDeleteDocument = async (courseId: number, docId: number) => {
		if (!confirm("Hapus dokumen ini?")) return;
		const { error } =
			await api.students[studentId.toString()]["course-grades"][
				courseId.toString()
			].documents[docId.toString()].delete();
		if (!error) {
			toast.success("Dokumen dihapus");
			fetchDocumentsForCourse(courseId);
		} else {
			toast.error("Gagal menghapus dokumen");
		}
	};

	const renderDocumentItem = (
		courseId: number,
		courseGrade: CourseGrade,
		title: string,
		key: string,
		desc: string,
	) => {
		const docs = documents[courseId]?.[key] || [];
		const canEditThisRow =
			isSuperadmin || (isDosen && user?.id === courseGrade.dosenId);

		return (
			<div className="flex flex-col sm:flex-row gap-3 py-3 border-b border-slate-100 last:border-0 pl-6 sm:pl-12">
				<div className="w-full sm:w-1/3">
					<div className="font-medium text-slate-800 text-sm flex items-center gap-2">
						<Paperclip className="w-4 h-4 text-slate-400" />
						{title}
					</div>
					<div className="text-xs text-slate-500 mt-1">{desc}</div>
				</div>
				<div className="w-full sm:w-2/3">
					{docs.length > 0 ? (
						<div className="space-y-2">
							{docs.map((doc) => (
								<div
									key={doc.id}
									className="flex flex-wrap items-center justify-between bg-white border border-slate-200 p-2 rounded-md gap-2"
								>
									<div className="flex items-center gap-2 overflow-hidden">
										<div className="text-sm font-medium text-blue-700 truncate max-w-[200px]">
											{doc.fileName}
										</div>
										<div className="text-xs text-slate-500">
											({doc.fileSize ? Math.round(doc.fileSize / 1024) : 0} KB)
										</div>
										{doc.isVerified ? (
											<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 h-5 px-1.5 text-[10px]">
												✅ Verified
											</Badge>
										) : (
											<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 h-5 px-1.5 text-[10px]">
												⏳ Pending
											</Badge>
										)}
									</div>
									<div className="flex items-center gap-1">
										<Button
											size="sm"
											variant="ghost"
											className="h-7 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
											onClick={() => handleViewDocument(courseId, doc.id)}
										>
											<Eye className="w-4 h-4" />
										</Button>
										{canEditThisRow && !doc.isVerified && (
											<Button
												size="sm"
												variant="ghost"
												className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
												onClick={() => handleVerifyDocument(courseId, doc.id)}
											>
												<CheckCircle className="w-4 h-4" />
											</Button>
										)}
										{canEditThisRow && (
											<Button
												size="sm"
												variant="ghost"
												className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
												onClick={() => handleDeleteDocument(courseId, doc.id)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="bg-slate-50 border border-slate-100 border-dashed rounded p-3 text-center">
							<span className="text-sm text-slate-400">Belum ada dokumen</span>
						</div>
					)}

					{canEditThisRow && !courseGrade.isAcc && (
						<div className="mt-2">
							<input
								type="file"
								id={`file-${courseId}-${key}`}
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleFileUpload(courseId, key, file);
								}}
							/>
							<Button
								variant="outline"
								size="sm"
								className="h-8 border-dashed text-slate-500 w-full"
								onClick={() =>
									document.getElementById(`file-${courseId}-${key}`)?.click()
								}
								disabled={uploadingKey === `${courseId}-${key}`}
							>
								{uploadingKey === `${courseId}-${key}` ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<PlusCircle className="w-4 h-4 mr-2" />
								)}
								Upload Dokumen Baru
							</Button>
						</div>
					)}
				</div>
			</div>
		);
	};

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
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="border-b border-slate-200 pb-4">
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
				</CardHeader>
				<CardContent className="pt-6">
					{/* TABLE SECTION */}
					<div className="mb-8">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							TABEL MATA KULIAH
						</h3>
						<div className="rounded-md border border-slate-200 overflow-hidden">
							<Table>
								<TableHeader className="bg-slate-50">
									<TableRow>
										<TableHead className="w-[200px]">Mata Kuliah</TableHead>
										<TableHead className="text-center">Kehadiran</TableHead>
										<TableHead className="text-center">Grade</TableHead>
										<TableHead>Catatan</TableHead>
										<TableHead className="text-center">Status</TableHead>
										<TableHead className="text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{gradesData.map((g) => {
										const isEditing = editingId === g.id;
										const canEditThisRow =
											isSuperadmin || (isDosen && user?.id === g.dosenId);
										const isExpanded = expandedRows.has(g.id);

										const rowBgColor =
											g.status === "AMAN"
												? "bg-emerald-50/50 hover:bg-emerald-50"
												: g.status === "PERLU_PERHATIAN"
													? "bg-amber-50/50 hover:bg-amber-50"
													: "bg-rose-50/50 hover:bg-rose-50";

										return (
											<React.Fragment key={g.id}>
												<TableRow
													className={`${rowBgColor} ${isExpanded ? "border-b-0" : ""}`}
												>
													<TableCell className="font-medium">
														<div className="flex items-center gap-2">
															<button
																onClick={() => toggleExpand(g.id)}
																className="text-blue-600 hover:text-blue-800 focus:outline-none"
															>
																<Badge
																	variant="outline"
																	className="text-[10px] h-5 cursor-pointer hover:bg-blue-50 transition-colors"
																>
																	{isExpanded ? "▼" : "▶"} Lampiran
																</Badge>
															</button>
															<div>
																<div>{g.courseName}</div>
																<div className="text-xs text-slate-500">
																	{g.courseCode}
																</div>
															</div>
														</div>
													</TableCell>

													{isEditing ? (
														<>
															<TableCell className="text-center">
																<div className="flex items-center justify-center gap-1">
																	<Input
																		type="number"
																		value={editForm.attendanceRate}
																		onChange={(e) =>
																			setEditForm({
																				...editForm,
																				attendanceRate: Number(e.target.value),
																			})
																		}
																		className="w-20 text-center h-8"
																		min={0}
																		max={100}
																	/>
																	<span className="text-slate-500">%</span>
																</div>
															</TableCell>
															<TableCell className="text-center">
																<Select
																	value={editForm.grade ?? ""}
																	onValueChange={(val) =>
																		setEditForm({
																			...editForm,
																			grade: val as string,
																		})
																	}
																>
																	<SelectTrigger className="w-20 h-8 mx-auto bg-white">
																		<SelectValue placeholder="Grade" />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="A">A</SelectItem>
																		<SelectItem value="A-">A-</SelectItem>
																		<SelectItem value="B+">B+</SelectItem>
																		<SelectItem value="B">B</SelectItem>
																		<SelectItem value="B-">B-</SelectItem>
																		<SelectItem value="C+">C+</SelectItem>
																		<SelectItem value="C">C</SelectItem>
																		<SelectItem value="D">D</SelectItem>
																		<SelectItem value="E">E</SelectItem>
																	</SelectContent>
																</Select>
															</TableCell>
															<TableCell>
																<Select
																	value={editForm.attitudeNote ?? ""}
																	onValueChange={(val) =>
																		setEditForm({
																			...editForm,
																			attitudeNote: val as string,
																		})
																	}
																>
																	<SelectTrigger className="w-28 h-8 bg-white">
																		<SelectValue placeholder="Catatan" />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="Baik">Baik</SelectItem>
																		<SelectItem value="Cukup">Cukup</SelectItem>
																		<SelectItem value="Buruk">Buruk</SelectItem>
																	</SelectContent>
																</Select>
															</TableCell>
															<TableCell className="text-center">
																<span className="text-slate-400 text-xs italic">
																	Unsaved
																</span>
															</TableCell>
															<TableCell className="text-right">
																<div className="flex justify-end gap-2">
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={handleCancelEdit}
																		className="h-8 px-2 text-slate-500 hover:text-slate-700"
																	>
																		<X className="w-4 h-4" />
																	</Button>
																	<Button
																		size="sm"
																		onClick={() => handleSaveEdit(g.id)}
																		disabled={savingId === g.id}
																		className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
																	>
																		{savingId === g.id ? (
																			<Loader2 className="w-4 h-4 mr-1 animate-spin" />
																		) : (
																			<Save className="w-4 h-4 mr-1" />
																		)}{" "}
																		Simpan
																	</Button>
																</div>
															</TableCell>
														</>
													) : (
														<>
															<TableCell className="text-center font-medium">
																<div className="flex items-center justify-center gap-1">
																	<span>{g.attendanceRate}%</span>
																	{(g.attendanceRate || 0) >= 70 ? (
																		<CheckCircle className="w-4 h-4 text-emerald-500" />
																	) : (
																		<XCircle className="w-4 h-4 text-rose-500" />
																	)}
																</div>
															</TableCell>
															<TableCell className="text-center font-bold text-slate-700">
																{g.grade || "-"}
															</TableCell>
															<TableCell>
																<span
																	className={
																		g.attitudeNote === "Baik"
																			? "text-emerald-700"
																			: g.attitudeNote === "Cukup"
																				? "text-amber-700"
																				: "text-rose-700"
																	}
																>
																	{g.attitudeNote || "-"}
																</span>
															</TableCell>
															<TableCell className="text-center">
																{g.status === "AMAN"
																	? "🟢"
																	: g.status === "PERLU_PERHATIAN"
																		? "🟡"
																		: "🔴"}
															</TableCell>
															<TableCell className="text-right">
																{g.isAcc ? (
																	<Badge
																		variant="secondary"
																		className="bg-slate-100 text-slate-500 hover:bg-slate-100"
																	>
																		🔒 Terkunci
																	</Badge>
																) : (
																	<div className="flex justify-end items-center gap-2">
																		{canEditThisRow ? (
																			<>
																				<Button
																					variant="ghost"
																					size="sm"
																					onClick={() => handleEditClick(g)}
																					className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
																				>
																					<Edit2 className="w-4 h-4" />
																				</Button>
																				<AlertDialog>
																					<AlertDialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-emerald-200 bg-background shadow-sm hover:bg-emerald-50 hover:text-emerald-700 h-8 px-3 text-emerald-700">
																						ACC
																					</AlertDialogTrigger>
																					<AlertDialogContent>
																						<AlertDialogTitle>
																							ACC Mata Kuliah: {g.courseName}
																						</AlertDialogTitle>
																						<AlertDialogDescription>
																							Anda akan mengunci nilai untuk
																							mata kuliah ini:
																							<div className="mt-3 bg-slate-50 border rounded-md p-3 space-y-2 mb-3 text-slate-900">
																								<div className="flex justify-between text-sm">
																									<span className="text-slate-500">
																										Kehadiran:
																									</span>
																									<span className="font-bold">
																										{g.attendanceRate}%
																									</span>
																								</div>
																								<div className="flex justify-between text-sm">
																									<span className="text-slate-500">
																										Nilai/Grade:
																									</span>
																									<span className="font-bold text-blue-700">
																										{g.grade || "-"}
																									</span>
																								</div>
																								<div className="flex justify-between text-sm">
																									<span className="text-slate-500">
																										Catatan Sikap:
																									</span>
																									<span className="font-bold">
																										{g.attitudeNote || "-"}
																									</span>
																								</div>
																							</div>
																							<span className="text-amber-700 text-sm font-medium">
																								⚠️ Data tidak dapat diubah
																								setelah dikunci!
																							</span>
																						</AlertDialogDescription>
																						<div className="flex justify-end gap-3 mt-4">
																							<AlertDialogCancel>
																								Batal
																							</AlertDialogCancel>
																							<AlertDialogAction
																								onClick={() =>
																									handleAcc(g.id, g.courseName)
																								}
																								className="bg-emerald-600 hover:bg-emerald-700"
																							>
																								Ya, Kunci Nilai
																							</AlertDialogAction>
																						</div>
																					</AlertDialogContent>
																				</AlertDialog>
																			</>
																		) : (
																			<>
																				{!isSuperadmin && isDosen && (
																					<Badge
																						variant="outline"
																						className="text-slate-400 border-slate-300 text-[10px]"
																					>
																						🔒 Bukan MK Anda
																					</Badge>
																				)}
																			</>
																		)}

																		{/* Superadmin can delete if not ACC */}
																		{isSuperadmin && (
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() =>
																					handleDeleteCourse(g.id, g.courseName)
																				}
																				className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
																			>
																				<Trash2 className="w-4 h-4" />
																			</Button>
																		)}
																	</div>
																)}
															</TableCell>
														</>
													)}
												</TableRow>

												{isExpanded && (
													<TableRow className="bg-slate-50/50">
														<TableCell colSpan={6} className="p-0">
															<div className="border-t border-slate-200 py-2">
																{renderDocumentItem(
																	g.id,
																	g,
																	"Bukti Kehadiran",
																	"attendance_proof",
																	"Daftar hadir/rekap absensi dari Dosen",
																)}
																{renderDocumentItem(
																	g.id,
																	g,
																	"Kartu Nilai",
																	"grade_card",
																	"Scan nilai UTS/UAS",
																)}
																{renderDocumentItem(
																	g.id,
																	g,
																	"Surat Dispensasi",
																	"dispensation",
																	"Surat izin ketidakhadiran resmi",
																)}
															</div>
														</TableCell>
													</TableRow>
												)}
											</React.Fragment>
										);
									})}
									{gradesData.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="text-center py-8 text-slate-500"
											>
												Belum ada data mata kuliah yang di-assign untuk
												mahasiswa ini.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</div>

					{/* RINGKASAN */}
					<div className="border-t border-slate-200 pt-6">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							RINGKASAN NILAI
						</h3>
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
				</CardContent>
			</Card>

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
									setNewMK({ ...newMK, dosenId: parseInt(e.target.value) || 0 })
								}
							/>
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
		</div>
	);
}
