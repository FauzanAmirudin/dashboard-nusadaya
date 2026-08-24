"use client";

import {
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Edit2,
	Loader2,
	Lock,
	Save,
	X,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";
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
				toast.success("Berhasil memperbarui data");
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
			<div className="flex justify-center p-8">
				<Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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
			<div className="text-center py-8 text-slate-500">
				{user?.role === "dosen"
					? "Mahasiswa ini tidak mengambil mata kuliah yang Anda ampu."
					: "Belum ada data mata kuliah yang terdaftar."}
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
				const isDanger = rate < 90 && g.totalMeetings > 0;

				const rowBgColor = !isDanger
					? "bg-emerald-50 border-emerald-200"
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

				const courseRecords = data.records.filter(
					(r: any) => r.session.subject === g.courseName,
				);

				return (
					<Collapsible
						key={g.id}
						open={isExpanded}
						onOpenChange={() => setExpandedCourse(isExpanded ? null : g.id)}
						className={`border rounded-lg bg-white shadow-sm overflow-hidden transition-all ${
							isExpanded ? "ring-1 ring-blue-100" : ""
						}`}
					>
						<div
							className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 transition-colors border-b border-transparent ${
								isExpanded ? "bg-slate-50/80 border-slate-100" : rowBgColor
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
										<h4 className="font-bold text-slate-800">{g.courseName}</h4>
										<Badge
											variant="outline"
											className="text-[10px] h-5 bg-white"
										>
											{g.courseCode || "MK"}
										</Badge>
										{g.isAcc && (
											<Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 border-none h-5 px-1.5 text-[10px] flex items-center gap-1">
												<Lock className="w-2.5 h-2.5 inline" /> Terkunci
											</Badge>
										)}
									</div>
									<div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
										<div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-slate-100/50">
											<span className="text-slate-500">Kehadiran:</span>
											<span className="font-semibold">
												{rate}% ({g.attendancePresent}/{g.totalMeetings || 16})
											</span>
											{!isDanger ? (
												<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
											) : (
												<XCircle className="w-3.5 h-3.5 text-rose-500" />
											)}
										</div>
										<div className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-slate-100/50">
											<span className="text-slate-500">Nilai Akhir:</span>
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
										className="h-8 text-blue-600 bg-white border-blue-100 hover:bg-blue-50 flex-1 lg:flex-none"
									>
										{isEditing ? (
											<X className="w-3.5 h-3.5 mr-1.5" />
										) : (
											<Edit2 className="w-3.5 h-3.5 mr-1.5" />
										)}
										{isEditing ? "Batal" : "Koreksi Hadir"}
									</Button>
								)}
								<CollapsibleTrigger className="h-8 flex-1 lg:flex-none bg-white border border-slate-200 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 px-3 shadow-sm">
									{isExpanded ? "Tutup" : "Lihat Detail"}
								</CollapsibleTrigger>
							</div>
						</div>
						<CollapsibleContent className="bg-white">
							{isEditing && (
								<div className="p-4 bg-blue-50/50 border-b border-blue-100">
									<h4 className="text-xs font-bold text-blue-800 uppercase mb-3">
										Koreksi Manual Agregat Kehadiran
									</h4>
									<div className="flex items-end gap-4">
										<div>
											<label className="text-xs font-medium text-slate-500 mb-1 block">
												Total Hadir
											</label>
											<Input
												type="number"
												className="w-24 bg-white h-9"
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
										<div>
											<label className="text-xs font-medium text-slate-500 mb-1 block">
												Total Pertemuan
											</label>
											<Input
												type="number"
												className="w-24 bg-white h-9"
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
											className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
										>
											{isSaving ? (
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											) : (
												<Save className="w-4 h-4 mr-2" />
											)}
											Simpan
										</Button>
									</div>
								</div>
							)}

							{!isEditing && (
								<div className="p-4 bg-slate-50">
									<h4 className="text-sm font-medium mb-3 text-slate-700">
										Riwayat Sesi Terdaftar
									</h4>
									{courseRecords.length === 0 ? (
										<div className="text-sm text-slate-500">
											Tidak ada riwayat sesi detail.
										</div>
									) : (
										<div className="space-y-2">
											{courseRecords.map((r: any) => (
												<div
													key={r.id}
													className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-200 text-sm shadow-sm"
												>
													<div>
														<div className="font-medium text-slate-800">
															{r.session.sessionDate
																? new Date(
																		r.session.sessionDate,
																	).toLocaleDateString("id-ID")
																: "-"}
														</div>
														<div className="text-xs text-slate-500">
															{r.session.startTime} - {r.session.endTime} •
															Ruang: {r.session.room}
														</div>
													</div>
													<Badge
														variant={
															r.status === "hadir"
																? "default"
																: r.status === "izin" || r.status === "sakit"
																	? "secondary"
																	: "destructive"
														}
														className={
															r.status === "hadir"
																? "bg-emerald-500 text-white"
																: ""
														}
													>
														{r.status.toUpperCase()}
													</Badge>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</CollapsibleContent>
					</Collapsible>
				);
			})}
		</div>
	);
}
