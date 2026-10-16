"use client";

import {
	AlertCircle,
	Award,
	BookOpen,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Edit2,
	FileText,
	GraduationCap,
	Loader2,
	Lock,
	MessageSquare,
	Pencil,
	Save,
	Sparkles,
	X,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

interface MeetingDetailModalState {
	isOpen: boolean;
	courseId: number;
	meetingId: number;
	meetingNumber: number;
	meetingLabel: string;
	meetingDate: string | null;
	status: "hadir" | "izin" | "sakit" | "alpha";
	theoryScore: number | "";
	practicalScore: number | "";
	notes: string;
}

export function TabMataKuliah({ studentId }: { studentId: number }) {
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
	const { user } = useAuthStore();
	const canEdit = user?.role === "superadmin" || user?.role === "akademik";

	// Edit Agregat Mata Kuliah
	const [editingCourse, setEditingCourse] = useState<number | null>(null);
	const [editForm, setEditForm] = useState({
		attendancePresent: 0,
		totalMeetings: 16,
		practicalScore: 0,
		theoryScore: 0,
		attitudeNote: "",
		grade: "",
	});
	const [isSaving, setIsSaving] = useState(false);

	// Modal Edit Detail & Catatan Pertemuan
	const [meetingModal, setMeetingModal] = useState<MeetingDetailModalState>({
		isOpen: false,
		courseId: 0,
		meetingId: 0,
		meetingNumber: 1,
		meetingLabel: "",
		meetingDate: null,
		status: "hadir",
		theoryScore: "",
		practicalScore: "",
		notes: "",
	});
	const [isSavingMeeting, setIsSavingMeeting] = useState(false);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const res = await (api as any).attendance.mahasiswa[studentId][
				"mata-kuliah"
			].get();
			if (res.data?.success) {
				setData(res.data.data);
			} else {
				toast.error("Gagal memuat data mata kuliah");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan koneksi memuat data");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	const handleEditClick = (course: any) => {
		setEditingCourse(course.id);
		setEditForm({
			attendancePresent: course.attendancePresent || 0,
			totalMeetings: course.totalMeetings || 16,
			practicalScore: course.practicalScore || 0,
			theoryScore: course.theoryScore || 0,
			attitudeNote: course.attitudeNote || "",
			grade: course.grade || "",
		});
	};

	const handleSaveEdit = async (courseGradeId: number) => {
		setIsSaving(true);
		try {
			const payload: any = {
				attendancePresent: editForm.attendancePresent,
				totalMeetings: editForm.totalMeetings,
				practicalScore: editForm.practicalScore,
				theoryScore: editForm.theoryScore,
				attitudeNote: editForm.attitudeNote,
			};
			if (editForm.grade) payload.grade = editForm.grade;

			const res = await (api as any).attendance.mahasiswa[studentId][
				"mata-kuliah"
			][courseGradeId].patch(payload);

			if (res.data?.success) {
				toast.success("Berhasil memperbarui nilai & presensi mata kuliah");
				setEditingCourse(null);
				await fetchData();
			} else {
				toast.error(res.data?.message || "Gagal menyimpan perubahan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem saat menyimpan nilai");
		} finally {
			setIsSaving(false);
		}
	};

	// 1-Click quick status changer
	const handleQuickMeetingStatusChange = async (
		courseId: number,
		meetingId: number,
		newStatus: "hadir" | "izin" | "sakit" | "alpha",
	) => {
		try {
			const res = await (api as any).attendance.mahasiswa[studentId][
				"mata-kuliah-meeting"
			][courseId][meetingId].patch({
				status: newStatus,
			});
			if (res.data?.success) {
				toast.success("Presensi pertemuan berhasil diperbarui");
				await fetchData();
			} else {
				toast.error(res.data?.message || "Gagal memperbarui status");
			}
		} catch {
			toast.error("Terjadi kesalahan sistem");
		}
	};

	// Open dialog to edit full meeting details (status, scores, notes)
	const handleOpenMeetingModal = (courseId: number, m: any) => {
		const mId = m.id || m.meetingId;
		setMeetingModal({
			isOpen: true,
			courseId,
			meetingId: mId,
			meetingNumber: m.meetingNumber ?? 1,
			meetingLabel: m.meetingLabel || `Pertemuan ${m.meetingNumber || 1}`,
			meetingDate: m.meetingDate || m.session?.sessionDate || null,
			status: m.status || "hadir",
			theoryScore:
				m.theoryScore !== null && m.theoryScore !== undefined
					? m.theoryScore
					: "",
			practicalScore:
				m.practicalScore !== null && m.practicalScore !== undefined
					? m.practicalScore
					: "",
			notes: m.notes || "",
		});
	};

	const handleSaveMeetingModal = async () => {
		setIsSavingMeeting(true);
		try {
			const payload: any = {
				status: meetingModal.status,
				notes: meetingModal.notes || null,
				theoryScore:
					meetingModal.theoryScore !== ""
						? Number(meetingModal.theoryScore)
						: null,
				practicalScore:
					meetingModal.practicalScore !== ""
						? Number(meetingModal.practicalScore)
						: null,
			};

			const res = await (api as any).attendance.mahasiswa[studentId][
				"mata-kuliah-meeting"
			][meetingModal.courseId][meetingModal.meetingId].patch(payload);

			if (res.data?.success) {
				toast.success("Catatan & penilaian sesi perkuliahan berhasil disimpan");
				setMeetingModal((prev) => ({ ...prev, isOpen: false }));
				await fetchData();
			} else {
				toast.error(res.data?.message || "Gagal menyimpan rincian sesi");
			}
		} catch {
			toast.error("Terjadi kesalahan sistem saat menyimpan catatan sesi");
		} finally {
			setIsSavingMeeting(false);
		}
	};

	// Helper for attitude badge styling
	const getAttitudeBadge = (attitudeNote: string | null | undefined) => {
		if (!attitudeNote || attitudeNote.trim() === "") {
			return (
				<Badge
					variant="outline"
					className="text-[10px] text-slate-500 bg-slate-50 border-slate-200"
				>
					Sikap: Belum Dinilai
				</Badge>
			);
		}

		const lower = attitudeNote.toLowerCase();
		let color = "bg-emerald-50 text-emerald-700 border-emerald-200";
		if (
			lower.includes("kurang") ||
			lower.includes("buruk") ||
			lower.includes("tidak")
		) {
			color = "bg-rose-50 text-rose-700 border-rose-200";
		} else if (lower.includes("cukup") || lower.includes("perhatian")) {
			color = "bg-amber-50 text-amber-700 border-amber-200";
		}

		return (
			<Badge className={cn("text-[11px] font-semibold border gap-1", color)}>
				<Sparkles className="w-3 h-3" />
				<span>Sikap: {attitudeNote}</span>
			</Badge>
		);
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
				<Loader2 className="w-6 h-6 animate-spin text-[#0517B0]" />
				<span className="text-xs font-medium text-slate-500">
					Memuat presensi & penilaian mata kuliah dari database...
				</span>
			</div>
		);
	}

	const visibleGrades = data?.grades
		? user?.role === "dosen"
			? data.grades.filter((g: any) => g.dosenId === user.id)
			: data.grades
		: [];

	if (!data || visibleGrades.length === 0) {
		return (
			<div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
				<div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0517B0] flex items-center justify-center mx-auto mb-3 shadow-2xs">
					<GraduationCap className="w-6 h-6" />
				</div>
				<h3 className="text-sm font-bold text-slate-800">
					Belum Ada Data Mata Kuliah
				</h3>
				<p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
					{user?.role === "dosen"
						? "Mahasiswa ini belum terdaftar pada mata kuliah yang Anda ampu."
						: "Belum ada kurikulum atau mata kuliah aktif yang terdistribusi untuk mahasiswa ini di database."}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{visibleGrades.map((g: any, index: number) => {
				const isExpanded = expandedCourse === g.id;
				const isEditing = editingCourse === g.id;

				const rate =
					g.totalMeetings > 0
						? Math.round((g.attendancePresent / g.totalMeetings) * 100)
						: 0;
				const isGood = rate >= 80;
				const isMedium = rate >= 60 && rate < 80;

				// Display actual letter grade from database
				const displayGradeLetter = g.grade || "-";

				const courseRecords = (data.records || []).filter(
					(r: any) => r.session?.subject === g.courseName,
				);

				return (
					<Collapsible
						key={g.id}
						open={isExpanded}
						onOpenChange={() => setExpandedCourse(isExpanded ? null : g.id)}
						className="border border-slate-200/90 rounded-2xl bg-white shadow-2xs overflow-hidden transition-all hover:border-slate-300"
					>
						<div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
							{/* Course Main Info */}
							<div className="flex items-start gap-3.5 flex-1 min-w-0">
								<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
									#{index + 1}
								</div>
								<div className="space-y-2 flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">
											{g.courseName}
										</h4>
										<Badge
											variant="outline"
											className="font-mono text-[10px] text-slate-600 bg-slate-50 border-slate-200"
										>
											{g.courseCode || "MK"}
										</Badge>
										{g.dosen?.fullName && (
											<span className="text-xs text-slate-500 font-medium">
												• Dosen: {g.dosen.fullName}
											</span>
										)}
										{g.isAcc && (
											<Badge
												variant="secondary"
												className="bg-amber-50 text-amber-700 text-[10px] font-semibold flex items-center gap-1"
											>
												<Lock className="w-2.5 h-2.5" />
												<span>Terkunci (ACC)</span>
											</Badge>
										)}
									</div>

									{/* Real-time Meta Chips from Database */}
									<div className="flex flex-wrap items-center gap-2 text-xs">
										{/* Presensi rate chip */}
										<div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80">
											<span className="text-slate-500 font-medium">
												Presensi:
											</span>
											<span
												className={cn(
													"font-bold",
													isGood
														? "text-emerald-700"
														: isMedium
															? "text-amber-700"
															: "text-rose-700",
												)}
											>
												{rate}% ({g.attendancePresent}/{g.totalMeetings || 16}{" "}
												Sesi)
											</span>
											{isGood ? (
												<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
											) : (
												<AlertCircle className="w-3.5 h-3.5 text-rose-500" />
											)}
										</div>

										{/* Nilai Akhir dari Database */}
										<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200/70 text-[#0517B0]">
											<Award className="w-3.5 h-3.5 text-amber-500" />
											<span className="font-medium text-slate-700">
												Nilai Akhir:
											</span>
											<span className="font-black text-sm">
												{displayGradeLetter}
											</span>
										</div>

										{/* Komponen Nilai Teori & Praktik */}
										<div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 font-medium">
											<span>
												Praktik:{" "}
												<strong className="text-slate-800">
													{g.practicalScore ?? "-"}
												</strong>
											</span>
											<span className="text-slate-300">•</span>
											<span>
												Teori:{" "}
												<strong className="text-slate-800">
													{g.theoryScore ?? "-"}
												</strong>
											</span>
										</div>

										{/* Attitude note chip */}
										{getAttitudeBadge(g.attitudeNote)}
									</div>
								</div>
							</div>

							{/* Actions & Chevron Trigger */}
							<div className="flex items-center gap-2 self-stretch lg:self-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
								{canEdit && !g.isAcc && (
									<Button
										variant="outline"
										size="sm"
										onClick={(e) => {
											e.stopPropagation();
											if (isEditing) {
												setEditingCourse(null);
											} else {
												handleEditClick(g);
												if (!isExpanded) setExpandedCourse(g.id);
											}
										}}
										className="h-8 text-xs text-[#0517B0] border-blue-200 hover:bg-blue-50 font-semibold gap-1.5"
									>
										{isEditing ? (
											<X className="w-3.5 h-3.5" />
										) : (
											<Edit2 className="w-3.5 h-3.5" />
										)}
										<span>
											{isEditing ? "Tutup Form" : "Koreksi Hadir & Nilai"}
										</span>
									</Button>
								)}

								<CollapsibleTrigger
									className={cn(
										buttonVariants({ variant: "ghost", size: "sm" }),
										"h-8 text-xs text-slate-600 hover:text-slate-900 font-semibold gap-1 cursor-pointer",
									)}
								>
									<span>{isExpanded ? "Tutup Sesi" : "Lihat 16 Sesi"}</span>
									{isExpanded ? (
										<ChevronUp className="w-3.5 h-3.5" />
									) : (
										<ChevronDown className="w-3.5 h-3.5" />
									)}
								</CollapsibleTrigger>
							</div>
						</div>

						{/* Expanded Content */}
						<CollapsibleContent className="bg-slate-50/50 border-t border-slate-100 p-4 sm:p-5 space-y-4">
							{/* Form Edit Nilai & Sikap Mata Kuliah (Direct Database Update) */}
							{isEditing && (
								<div className="p-4 sm:p-5 bg-white rounded-2xl border border-blue-200 shadow-xs space-y-4 animate-in fade-in-50 duration-150">
									<div className="flex items-center justify-between border-b border-slate-100 pb-3">
										<div className="flex items-center gap-2">
											<Sparkles className="w-4 h-4 text-[#0517B0]" />
											<h5 className="text-xs sm:text-sm font-bold text-slate-800">
												Koreksi Presensi, Nilai Vokasi & Catatan Sikap
											</h5>
										</div>
										<Badge variant="outline" className="text-[10px] font-mono">
											Update Real-time ke Database
										</Badge>
									</div>

									<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
										<div className="space-y-1">
											<Label className="text-xs font-semibold text-slate-700">
												Total Hadir
											</Label>
											<Input
												type="number"
												className="h-9 text-xs bg-white font-bold"
												value={editForm.attendancePresent}
												onChange={(e) =>
													setEditForm((p) => ({
														...p,
														attendancePresent:
															parseInt(e.target.value, 10) || 0,
													}))
												}
												min={0}
											/>
										</div>

										<div className="space-y-1">
											<Label className="text-xs font-semibold text-slate-700">
												Total Sesi
											</Label>
											<Input
												type="number"
												className="h-9 text-xs bg-white font-bold"
												value={editForm.totalMeetings}
												onChange={(e) =>
													setEditForm((p) => ({
														...p,
														totalMeetings: parseInt(e.target.value, 10) || 16,
													}))
												}
												min={1}
											/>
										</div>

										<div className="space-y-1">
											<Label className="text-xs font-semibold text-slate-700">
												Nilai Praktik (80%)
											</Label>
											<Input
												type="number"
												className="h-9 text-xs bg-white font-bold text-blue-700"
												value={editForm.practicalScore}
												onChange={(e) =>
													setEditForm((p) => ({
														...p,
														practicalScore: parseInt(e.target.value, 10) || 0,
													}))
												}
												min={0}
												max={100}
											/>
										</div>

										<div className="space-y-1">
											<Label className="text-xs font-semibold text-slate-700">
												Nilai Teori (20%)
											</Label>
											<Input
												type="number"
												className="h-9 text-xs bg-white font-bold text-indigo-700"
												value={editForm.theoryScore}
												onChange={(e) =>
													setEditForm((p) => ({
														...p,
														theoryScore: parseInt(e.target.value, 10) || 0,
													}))
												}
												min={0}
												max={100}
											/>
										</div>

										<div className="space-y-1">
											<Label className="text-xs font-semibold text-slate-700">
												Nilai Huruf (Opsional)
											</Label>
											<Input
												className="h-9 text-xs bg-white font-bold uppercase text-center"
												placeholder="Auto"
												value={editForm.grade}
												onChange={(e) =>
													setEditForm((p) => ({
														...p,
														grade: e.target.value.toUpperCase(),
													}))
												}
												maxLength={2}
											/>
										</div>

										<div className="space-y-1 col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col justify-end">
											<Button
												size="sm"
												onClick={() => handleSaveEdit(g.id)}
												disabled={isSaving}
												className="h-9 text-xs text-white bg-[#0517B0] hover:bg-blue-800 font-semibold gap-1.5 shadow-2xs w-full"
											>
												{isSaving ? (
													<Loader2 className="w-3.5 h-3.5 animate-spin" />
												) : (
													<Save className="w-3.5 h-3.5" />
												)}
												<span>Simpan Nilai</span>
											</Button>
										</div>
									</div>

									<div className="space-y-1.5 pt-1">
										<Label className="text-xs font-semibold text-slate-700">
											Catatan Sikap & Kedisiplinan Mahasiswa
										</Label>
										<div className="flex gap-2">
											<Input
												placeholder="Contoh: Sikap perkuliahan sangat baik dan aktif dalam praktikum..."
												value={editForm.attitudeNote}
												onChange={(e) =>
													setEditForm((p) => ({
														...p,
														attitudeNote: e.target.value,
													}))
												}
												className="h-9 text-xs flex-1"
											/>
											<div className="flex items-center gap-1 shrink-0">
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														setEditForm((p) => ({
															...p,
															attitudeNote: "Sangat Baik",
														}))
													}
													className="h-9 text-[11px] px-2.5 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
												>
													Sangat Baik
												</Button>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														setEditForm((p) => ({
															...p,
															attitudeNote: "Baik",
														}))
													}
													className="h-9 text-[11px] px-2.5 text-blue-700 hover:bg-blue-50 border-blue-200"
												>
													Baik
												</Button>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														setEditForm((p) => ({
															...p,
															attitudeNote: "Cukup",
														}))
													}
													className="h-9 text-[11px] px-2.5 text-amber-700 hover:bg-amber-50 border-amber-200"
												>
													Cukup
												</Button>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Session List */}
							<div className="space-y-3">
								{(() => {
									const officialMeetings = (
										g.meetings && g.meetings.length > 0
											? g.meetings
											: courseRecords
									).filter(
										(m: any) => m.meetingNumber >= 1 && m.meetingNumber <= 16,
									);

									return (
										<>
											<div className="flex items-center justify-between">
												<h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
													<BookOpen className="w-3.5 h-3.5 text-[#0517B0]" />
													<span>
														Rincian Sesi Perkuliahan (16 Pertemuan Silabus)
													</span>
												</h5>
												<span className="text-[11px] text-slate-500 font-medium">
													{officialMeetings.length} Sesi Terjadwal di Database
												</span>
											</div>

											{officialMeetings.length === 0 ? (
												<div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80">
													<BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
													<p className="text-xs font-semibold text-slate-600">
														Belum ada jadwal sesi pertemuan untuk mata kuliah
														ini
													</p>
													<p className="text-[11px] text-slate-400 mt-0.5">
														Sesi dapat di-generate melalui modul Manajemen Mata
														Kuliah.
													</p>
												</div>
											) : (
												<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
													{officialMeetings.map((m: any, mIdx: number) => {
														const meetingId = m.id || m.meetingId;
														const mNumber = m.meetingNumber ?? mIdx + 1;
														const isExam =
															m.meetingType === "uts" ||
															m.meetingType === "uas" ||
															mNumber === 8 ||
															mNumber === 16;
														const label =
															m.meetingLabel ||
															(mNumber === 8
																? "Ujian Tengah Semester (UTS)"
																: mNumber === 16
																	? "Ujian Akhir Semester (UAS)"
																	: `Pertemuan ${mNumber}`);

														const status = (m.status || "").toLowerCase();
														const isHadir = status === "hadir";
														const isIzin = status === "izin";
														const isSakit = status === "sakit";
														const isAlpha =
															status === "alpha" || status === "alpa";

														const dateDisplay =
															m.meetingDate || m.session?.sessionDate;

														return (
															<div
																key={meetingId || mIdx}
																className={cn(
																	"p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 shadow-2xs bg-white",
																	isExam
																		? "border-amber-300/80 bg-amber-50/20 shadow-xs"
																		: "border-slate-200/80 hover:border-slate-300",
																)}
															>
																<div className="space-y-1.5">
																	<div className="flex items-center justify-between gap-1">
																		<span
																			className={cn(
																				"text-[10px] font-bold px-2 py-0.5 rounded-md",
																				isExam
																					? "bg-amber-100 text-amber-900 font-black border border-amber-300"
																					: "bg-blue-50 text-[#0517B0] border border-blue-100",
																			)}
																		>
																			{mNumber === 8
																				? "P8 (UTS)"
																				: mNumber === 16
																					? "P16 (UAS)"
																					: `Pertemuan ${mNumber}`}
																		</span>

																		<Badge
																			variant="outline"
																			className={cn(
																				"text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide",
																				isHadir &&
																					"bg-emerald-50 text-emerald-700 border-emerald-200",
																				isIzin &&
																					"bg-blue-50 text-blue-700 border-blue-200",
																				isSakit &&
																					"bg-purple-50 text-purple-700 border-purple-200",
																				isAlpha &&
																					"bg-rose-50 text-rose-700 border-rose-200",
																				!isHadir &&
																					!isIzin &&
																					!isSakit &&
																					!isAlpha &&
																					"bg-slate-50 text-slate-400 border-slate-200",
																			)}
																		>
																			{isHadir
																				? "HADIR"
																				: isIzin
																					? "IZIN"
																					: isSakit
																						? "SAKIT"
																						: isAlpha
																							? "ALPHA"
																							: "BELUM DIISI"}
																		</Badge>
																	</div>

																	<p
																		className="text-xs font-bold text-slate-900 truncate"
																		title={label}
																	>
																		{label}
																	</p>

																	{/* Tanggal Pertemuan */}
																	<div className="flex items-center gap-1.5 text-[11px] text-slate-500">
																		<Clock className="w-3 h-3 text-slate-400" />
																		<span>
																			{dateDisplay
																				? new Date(
																						dateDisplay,
																					).toLocaleDateString("id-ID", {
																						day: "numeric",
																						month: "short",
																						year: "numeric",
																					})
																				: "Tanggal belum diset"}
																		</span>
																	</div>

																	{/* Nilai Sesi / Ujian (Jika Ada) */}
																	{((m.theoryScore !== null &&
																		m.theoryScore !== undefined) ||
																		(m.practicalScore !== null &&
																			m.practicalScore !== undefined)) && (
																		<div className="flex items-center gap-2 text-[10px] font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
																			{m.theoryScore !== null &&
																				m.theoryScore !== undefined && (
																					<span>
																						Nilai Ujian:{" "}
																						<strong className="text-indigo-700">
																							{m.theoryScore}
																						</strong>
																					</span>
																				)}
																			{m.practicalScore !== null &&
																				m.practicalScore !== undefined && (
																					<span>
																						Praktik:{" "}
																						<strong className="text-blue-700">
																							{m.practicalScore}
																						</strong>
																					</span>
																				)}
																		</div>
																	)}

																	{/* Catatan Sesi / Izin / Keterangan dari Database */}
																	{m.notes && m.notes.trim() !== "" && (
																		<div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-amber-50/60 border border-amber-200/70 text-[10px] text-amber-900">
																			<MessageSquare className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
																			<span className="line-clamp-2 italic">
																				"{m.notes}"
																			</span>
																		</div>
																	)}
																</div>

																{/* Quick status selector & detail dialog trigger */}
																{canEdit && !g.isAcc && (
																	<div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
																		<div className="flex items-center gap-1">
																			<button
																				type="button"
																				title="Tandai Hadir"
																				onClick={() =>
																					handleQuickMeetingStatusChange(
																						g.courseId,
																						meetingId,
																						"hadir",
																					)
																				}
																				className={cn(
																					"text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer",
																					isHadir
																						? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
																						: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
																				)}
																			>
																				H
																			</button>
																			<button
																				type="button"
																				title="Tandai Izin"
																				onClick={() =>
																					handleQuickMeetingStatusChange(
																						g.courseId,
																						meetingId,
																						"izin",
																					)
																				}
																				className={cn(
																					"text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer",
																					isIzin
																						? "bg-blue-600 text-white border-blue-600 shadow-2xs"
																						: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
																				)}
																			>
																				I
																			</button>
																			<button
																				type="button"
																				title="Tandai Sakit"
																				onClick={() =>
																					handleQuickMeetingStatusChange(
																						g.courseId,
																						meetingId,
																						"sakit",
																					)
																				}
																				className={cn(
																					"text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer",
																					isSakit
																						? "bg-purple-600 text-white border-purple-600 shadow-2xs"
																						: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
																				)}
																			>
																				S
																			</button>
																			<button
																				type="button"
																				title="Tandai Alpha"
																				onClick={() =>
																					handleQuickMeetingStatusChange(
																						g.courseId,
																						meetingId,
																						"alpha",
																					)
																				}
																				className={cn(
																					"text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer",
																					isAlpha
																						? "bg-rose-600 text-white border-rose-600 shadow-2xs"
																						: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
																				)}
																			>
																				A
																			</button>
																		</div>

																		<Button
																			type="button"
																			variant="ghost"
																			size="sm"
																			onClick={() =>
																				handleOpenMeetingModal(g.courseId, m)
																			}
																			className="h-6 px-1.5 text-[10px] text-slate-500 hover:text-[#0517B0] hover:bg-blue-50 rounded-lg gap-1"
																			title="Edit Catatan & Nilai Sesi"
																		>
																			<Pencil className="w-2.5 h-2.5" />
																			<span>Catatan</span>
																		</Button>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											)}
										</>
									);
								})()}
							</div>
						</CollapsibleContent>
					</Collapsible>
				);
			})}

			{/* DIALOG EDIT CATATAN & DETAIL SESI PERTEMUAN */}
			<Dialog
				open={meetingModal.isOpen}
				onOpenChange={(open) =>
					setMeetingModal((prev) => ({ ...prev, isOpen: open }))
				}
			>
				<DialogContent className="max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<FileText className="w-5 h-5 text-[#0517B0]" />
							Detail & Catatan Sesi Pertemuan
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							{meetingModal.meetingLabel} • Mahasiswa:{" "}
							<span className="font-semibold text-slate-800">
								{data?.student?.name || "Mahasiswa"}
							</span>
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Status Kehadiran */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Status Kehadiran Pertemuan
							</Label>
							<Select
								value={meetingModal.status}
								onValueChange={(val: any) =>
									setMeetingModal((p) => ({ ...p, status: val || "hadir" }))
								}
							>
								<SelectTrigger className="h-9 text-xs rounded-xl font-semibold">
									<SelectValue placeholder="Pilih status..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="hadir">Hadir</SelectItem>
									<SelectItem value="izin">Izin</SelectItem>
									<SelectItem value="sakit">Sakit</SelectItem>
									<SelectItem value="alpha">Alpha (Tidak Hadir)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Nilai Teori & Praktik Sesi */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Nilai Ujian / Teori (0-100)
								</Label>
								<Input
									type="number"
									min={0}
									max={100}
									placeholder="Belum ada nilai"
									value={meetingModal.theoryScore}
									onChange={(e) =>
										setMeetingModal((p) => ({
											...p,
											theoryScore:
												e.target.value === "" ? "" : Number(e.target.value),
										}))
									}
									className="h-9 text-xs rounded-xl font-bold"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Nilai Praktik (0-100)
								</Label>
								<Input
									type="number"
									min={0}
									max={100}
									placeholder="Belum ada nilai"
									value={meetingModal.practicalScore}
									onChange={(e) =>
										setMeetingModal((p) => ({
											...p,
											practicalScore:
												e.target.value === "" ? "" : Number(e.target.value),
										}))
									}
									className="h-9 text-xs rounded-xl font-bold"
								/>
							</div>
						</div>

						{/* Catatan Sesi / Surat Izin / Keterangan */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Catatan Sesi / Keterangan Khusus
							</Label>
							<Textarea
								placeholder="Tuliskan catatan dosen, alasan izin/sakit, nomor surat dokter, atau evaluasi tugas..."
								value={meetingModal.notes}
								onChange={(e) =>
									setMeetingModal((p) => ({ ...p, notes: e.target.value }))
								}
								rows={3}
								className="text-xs rounded-xl resize-none"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={() =>
								setMeetingModal((prev) => ({ ...prev, isOpen: false }))
							}
							className="rounded-xl text-xs"
						>
							Batal
						</Button>
						<Button
							onClick={handleSaveMeetingModal}
							disabled={isSavingMeeting}
							className="bg-[#0517B0] hover:bg-blue-800 text-white rounded-xl text-xs font-semibold gap-1.5"
						>
							{isSavingMeeting ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Save className="w-3.5 h-3.5" />
							)}
							Simpan Catatan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
