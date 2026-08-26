"use client";

import {
	AlertCircle,
	BookOpen,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Edit2,
	GraduationCap,
	Loader2,
	Lock,
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

export function TabMataKuliah({ studentId }: { studentId: number }) {
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
	const { user } = useAuthStore();
	const canEdit = user?.role === "superadmin" || user?.role === "akademik";

	const [editingCourse, setEditingCourse] = useState<number | null>(null);
	const [editForm, setEditForm] = useState({
		attendancePresent: 0,
		totalMeetings: 0,
	});
	const [isSaving, setIsSaving] = useState(false);

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
			toast.error("Terjadi kesalahan koneksi");
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
			totalMeetings: course.totalMeetings || 0,
		});
	};

	const handleSaveEdit = async (courseId: number) => {
		setIsSaving(true);
		try {
			const res = await (api as any).attendance.mahasiswa[studentId][
				"mata-kuliah"
			][courseId].patch(editForm);
			if (res.data?.success) {
				toast.success("Berhasil memperbarui kehadiran mata kuliah");
				setEditingCourse(null);
				fetchData();
			} else {
				toast.error("Gagal menyimpan perubahan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
				<Loader2 className="w-6 h-6 animate-spin text-[#0517B0]" />
				<span className="text-xs font-medium text-slate-500">
					Memuat presensi mata kuliah...
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
						: "Belum ada kurikulum atau mata kuliah aktif yang terdistribusi untuk mahasiswa ini."}
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
								<div className="space-y-1.5 flex-1 min-w-0">
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
										{g.isAcc && (
											<Badge
												variant="secondary"
												className="bg-amber-50 text-amber-700 text-[10px] font-semibold flex items-center gap-1"
											>
												<Lock className="w-2.5 h-2.5" />
												<span>Terkunci</span>
											</Badge>
										)}
									</div>

									{/* Quick Meta Chips */}
									<div className="flex flex-wrap items-center gap-2 text-xs">
										{/* Attendance rate chip */}
										<div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
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

										{/* Final Score chip */}
										<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-100 text-[#0517B0]">
											<span className="font-medium text-slate-600">Nilai:</span>
											<span className="font-bold">{finalScoreString}</span>
										</div>

										{/* Attitude note chip */}
										{g.attitudeNote && (
											<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
												<span className="text-slate-500 font-medium">
													Sikap:
												</span>
												<span
													className={cn(
														"font-semibold",
														g.attitudeNote === "Baik"
															? "text-emerald-700"
															: g.attitudeNote === "Cukup"
																? "text-amber-700"
																: "text-rose-700",
													)}
												>
													{g.attitudeNote}
												</span>
											</div>
										)}
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
										<span>{isEditing ? "Batal" : "Koreksi Hadir"}</span>
									</Button>
								)}

								<CollapsibleTrigger
									className={cn(
										buttonVariants({ variant: "ghost", size: "sm" }),
										"h-8 text-xs text-slate-600 hover:text-slate-900 font-semibold gap-1 cursor-pointer",
									)}
								>
									<span>{isExpanded ? "Tutup" : "Lihat Sesi"}</span>
									{isExpanded ? (
										<ChevronUp className="w-3.5 h-3.5" />
									) : (
										<ChevronDown className="w-3.5 h-3.5" />
									)}
								</CollapsibleTrigger>
							</div>
						</div>

						{/* Expanded Content */}
						<CollapsibleContent className="bg-slate-50/50 border-t border-slate-100 p-4 sm:p-5">
							{/* Edit Form */}
							{isEditing && (
								<div className="p-4 bg-white rounded-xl border border-blue-200/80 shadow-2xs space-y-3 mb-4 animate-in fade-in-50 duration-150">
									<div className="flex items-center gap-2">
										<Sparkles className="w-4 h-4 text-[#0517B0]" />
										<h5 className="text-xs font-bold text-slate-800">
											Koreksi Manual Agregat Presensi Mata Kuliah
										</h5>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
										<div className="space-y-1">
											<label className="text-xs font-medium text-slate-700">
												Total Hadir
											</label>
											<Input
												type="number"
												className="h-9 text-xs bg-white"
												placeholder="0"
												value={
													editForm.attendancePresent === 0
														? ""
														: editForm.attendancePresent
												}
												onChange={(e) =>
													setEditForm({
														...editForm,
														attendancePresent:
															e.target.value === ""
																? 0
																: parseInt(e.target.value) || 0,
													})
												}
												min={0}
											/>
										</div>
										<div className="space-y-1">
											<label className="text-xs font-medium text-slate-700">
												Total Pertemuan
											</label>
											<Input
												type="number"
												className="h-9 text-xs bg-white"
												placeholder="0"
												value={
													editForm.totalMeetings === 0
														? ""
														: editForm.totalMeetings
												}
												onChange={(e) =>
													setEditForm({
														...editForm,
														totalMeetings:
															e.target.value === ""
																? 0
																: parseInt(e.target.value) || 0,
													})
												}
												min={1}
											/>
										</div>
										<Button
											size="sm"
											onClick={() => handleSaveEdit(g.id)}
											disabled={isSaving}
											className="h-9 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90 font-semibold gap-1.5 shadow-2xs"
										>
											{isSaving ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<Save className="w-3.5 h-3.5" />
											)}
											<span>Simpan Perubahan</span>
										</Button>
									</div>
								</div>
							)}

							{/* Session List */}
							<div className="space-y-3">
								<h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
									Riwayat Sesi Pertemuan Kelas
								</h5>
								{courseRecords.length === 0 ? (
									<div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200/80">
										<BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
										<p className="text-xs font-medium text-slate-500">
											Belum ada log rincian sesi pertemuan
										</p>
									</div>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
										{courseRecords.map((r: any) => (
											<div
												key={r.id}
												className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors"
											>
												<div className="space-y-0.5 min-w-0">
													<div className="text-xs font-bold text-slate-800">
														{r.session?.sessionDate
															? new Date(
																	r.session.sessionDate,
																).toLocaleDateString("id-ID", {
																	day: "numeric",
																	month: "short",
																	year: "numeric",
																})
															: "Sesi Pertemuan"}
													</div>
													<p className="text-[11px] text-slate-500">
														{r.session?.startTime || "08:00"} -{" "}
														{r.session?.endTime || "10:00"} • Ruang:{" "}
														{r.session?.room || "Kelas"}
													</p>
												</div>
												<Badge
													variant={
														r.status === "hadir"
															? "default"
															: r.status === "izin" || r.status === "sakit"
																? "secondary"
																: "destructive"
													}
													className={cn(
														"text-[10px] font-semibold px-2 py-0.5 rounded-md",
														r.status === "hadir" &&
															"bg-emerald-50 text-emerald-700 border border-emerald-200/80",
														(r.status === "izin" || r.status === "sakit") &&
															"bg-amber-50 text-amber-800 border border-amber-200/80",
														r.status === "alpa" &&
															"bg-rose-50 text-rose-700 border border-rose-200/80",
													)}
												>
													{(r.status || "HADIR").toUpperCase()}
												</Badge>
											</div>
										))}
									</div>
								)}
							</div>
						</CollapsibleContent>
					</Collapsible>
				);
			})}
		</div>
	);
}
