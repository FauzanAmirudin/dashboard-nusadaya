"use client";

import {
	ArrowLeft,
	BookOpen,
	Calendar,
	Check,
	CheckCircle,
	ChevronDown,
	Download,
	Edit,
	FileText,
	GraduationCap,
	Loader2,
	Paperclip,
	Plus,
	Save,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { useAuthStore } from "@/store";
import { TabAnggaranPraktik } from "./TabAnggaranPraktik";

type CourseDetail = {
	id: number;
	code: string;
	name: string;
	peminatan: string | null;
	cohort: number;
	type: string;
	dosen: { id: number; fullName: string };
};

type MeetingData = {
	id: number;
	meetingNumber: number;
	meetingType: string;
	meetingLabel: string;
	description: string | null;
	meetingDate: string | null;
	activities: any[];
	attendances: {
		studentId: number;
		status: string;
		notes: string | null;
		student: { name: string; nim: string };
	}[];
};

type StudentRecord = {
	id: number;
	nim: string;
	name: string;
};

export default function MataKuliahDetailPage() {
	const params = useParams();
	const router = useRouter();
	const courseId = params.id as string;
	const { user, hasHydrated } = useAuthStore();

	const [course, setCourse] = useState<CourseDetail | null>(null);
	const [meetings, setMeetings] = useState<MeetingData[]>([]);
	const [students, setStudents] = useState<StudentRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Inline editing state for Meetings
	const [editingMeeting, setEditingMeeting] = useState<number | null>(null);
	const [meetingForm, setMeetingForm] = useState({
		label: "",
		date: "",
		desc: "",
	});

	// Inline editing state for Activities
	const [editingActivity, setEditingActivity] = useState<{
		meetingId: number;
		type: string;
		actId?: number;
	} | null>(null);
	const [activityForm, setActivityForm] = useState<{
		activityType: "teori" | "tugas" | "praktik" | "ujian";
		score?: number;
		notes?: string;
		documentUrl?: string;
		documentName?: string;
		file?: File | null;
	}>({ activityType: "teori" });

	// Attendance State
	const [attendanceData, setAttendanceData] = useState<
		Record<number, Record<number, { status: string; notes: string }>>
	>({});
	const [isSavingAttendance, setIsSavingAttendance] = useState<number | null>(
		null,
	);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			// Get course info
			const { data: cData, error: cErr } = await api.courses[courseId].get();
			if (cErr) {
				toast.error("Gagal memuat mata kuliah");
				if ((cErr as any).status === 403) router.push("/dashboard/mata-kuliah");
				return;
			}
			const courseInfo = cData?.data as any;
			setCourse(courseInfo);

			// Get meetings
			const { data: mData, error: mErr } =
				await api.courses[courseId].meetings.get();
			if (!mErr && mData?.success) {
				const meets = mData.data as any[];
				setMeetings(meets);

				// Prepare attendance state
				const attState: Record<
					number,
					Record<number, { status: string; notes: string }>
				> = {};
				meets.forEach((m) => {
					attState[m.id] = {};
					m.attendances.forEach((a: any) => {
						attState[m.id][a.studentId] = {
							status: a.status,
							notes: a.notes || "",
						};
					});
				});
				setAttendanceData(attState);
			}

			// Get students in this cohort
			if (courseInfo?.cohort) {
				const { data: sData, error: sErr } = await api.students.get({
					$query: { cohort: courseInfo.cohort.toString(), isArchived: "false" },
				});
				if (!sErr && sData?.data) {
					// map students data from eden
					const sList = (sData.data as any[]).map((item) => item.student);
					setStudents(sList);
				}
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (hasHydrated && user) {
			fetchData();
		}
	}, [hasHydrated, user, courseId]);

	// Save Meeting Info
	const saveMeetingInfo = async (meetingId: number) => {
		try {
			const { error } = await api.courses[courseId].meetings[
				meetingId.toString()
			].patch({
				meetingLabel: meetingForm.label,
				meetingDate: meetingForm.date || undefined,
				description: meetingForm.desc,
			});
			if (error) throw error;
			toast.success("Info pertemuan tersimpan");
			setEditingMeeting(null);

			// Update local state without refetching all
			setMeetings((prev) =>
				prev.map((m) =>
					m.id === meetingId
						? {
								...m,
								meetingLabel: meetingForm.label,
								meetingDate: meetingForm.date || null,
								description: meetingForm.desc,
							}
						: m,
				),
			);
		} catch (err: any) {
			toast.error("Gagal menyimpan info pertemuan");
		}
	};

	// Save Activity
	const saveActivity = async (
		meetingId: number,
		actType: string,
		actId?: number,
	) => {
		try {
			let docUrl = activityForm.documentUrl;
			let docName = activityForm.documentName;

			if (activityForm.file) {
				const formData = new FormData();
				formData.append("file", activityForm.file);
				formData.append("category", "academic");
				const uploadRes = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/files/upload`,
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`,
						},
						body: formData,
					},
				);
				const uploadData = await uploadRes.json();
				if (!uploadRes.ok) throw new Error("Gagal upload file");
				docUrl = uploadData.data.fileUrl;
				docName = uploadData.data.originalName;
			}

			const payload = {
				activityType: actType as any,
				score: activityForm.score,
				notes: activityForm.notes,
				documentUrl: docUrl,
				documentName: docName,
			};

			if (actId) {
				const { error } =
					await api.courses[courseId].meetings[meetingId.toString()].activities[
						actId.toString()
					].patch(payload);
				if (error) throw error;
			} else {
				const { error } =
					await api.courses[courseId].meetings[
						meetingId.toString()
					].activities.post(payload);
				if (error) throw error;
			}
			toast.success("Data kegiatan tersimpan");
			setEditingActivity(null);
			fetchData();
		} catch (err) {
			toast.error("Gagal menyimpan kegiatan");
		}
	};

	// Save Attendances
	const saveAttendances = async (meetingId: number) => {
		setIsSavingAttendance(meetingId);
		try {
			const meetingAtt = attendanceData[meetingId] || {};
			const payload = Object.keys(meetingAtt).map((sId) => ({
				studentId: parseInt(sId, 10),
				status: meetingAtt[parseInt(sId, 10)].status,
				notes: meetingAtt[parseInt(sId, 10)].notes,
			}));

			const { error } = await api.courses[courseId].meetings[
				meetingId.toString()
			].attendances.post({
				attendances: payload,
			});
			if (error) throw error;
			toast.success("Presensi berhasil disimpan");
		} catch (err) {
			toast.error("Gagal menyimpan presensi");
		} finally {
			setIsSavingAttendance(null);
		}
	};

	const handleExportDetail = () => {
		if (!course) return;

		const exportData: any[] = [];

		meetings.forEach((m) => {
			const baseRow = {
				Pertemuan: m.meetingLabel,
				Tanggal: m.meetingDate || "-",
				Deskripsi: m.description || "-",
			};

			if (students.length === 0) {
				exportData.push(baseRow);
			} else {
				students.forEach((s) => {
					const att = m.attendances.find((a) => a.studentId === s.id);
					exportData.push({
						...baseRow,
						NIM: s.nim,
						Mahasiswa: s.name,
						Kehadiran: att ? att.status : "-",
						"Catatan Kehadiran": att?.notes || "-",
					});
				});
			}
		});

		exportToCSV(
			exportData,
			`Rekap_${course.code}_${course.name.replace(/\s+/g, "_")}`,
		);
	};

	if (!hasHydrated || isLoading) {
		return (
			<div className="flex justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!course)
		return (
			<div className="p-6 text-center text-red-500">
				Mata kuliah tidak ditemukan
			</div>
		);

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold">{course.name}</h1>
							<Badge variant="outline" className="bg-slate-50">
								{course.code}
							</Badge>
						</div>
						<p className="text-slate-500">
							Dosen Pengampu: {course.dosen.fullName}
						</p>
					</div>
				</div>
				<Button variant="outline" onClick={handleExportDetail}>
					<Download className="mr-2 h-4 w-4" /> Export Rekap
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
						<GraduationCap className="h-6 w-6 text-slate-400 mb-1" />
						<p className="text-sm text-slate-500 font-medium">Angkatan</p>
						<p className="text-lg font-bold">{course.cohort}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
						<BookOpen className="h-6 w-6 text-slate-400 mb-1" />
						<p className="text-sm text-slate-500 font-medium">Jenis</p>
						<p className="text-lg font-bold capitalize">{course.type}</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
						<Users className="h-6 w-6 text-slate-400 mb-1" />
						<p className="text-sm text-slate-500 font-medium">Mahasiswa</p>
						<p className="text-lg font-bold">{students.length} Orang</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
						<Calendar className="h-6 w-6 text-slate-400 mb-1" />
						<p className="text-sm text-slate-500 font-medium">
							Total Pertemuan
						</p>
						<p className="text-lg font-bold">18 Sesi</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="jadwal" className="w-full">
				<TabsList className="mb-4">
					<TabsTrigger value="jadwal">Jadwal Mengajar</TabsTrigger>
					{course.type === "praktik" && (
						<TabsTrigger value="anggaran">Anggaran Praktik</TabsTrigger>
					)}
				</TabsList>

				<TabsContent value="jadwal">
					<Card>
						<CardHeader className="pb-3 border-b">
							<CardTitle className="text-xl">
								Jadwal Mengajar & Jurnal Perkuliahan
							</CardTitle>
							<CardDescription>
								Pilih pertemuan untuk mengisi presensi, materi, dan nilai
							</CardDescription>
						</CardHeader>
						<CardContent className="p-4">
							<Accordion type="single" collapsible className="w-full space-y-2">
								{meetings.map((meet) => {
									const isEditingInfo = editingMeeting === meet.id;
									const isUtsUas =
										meet.meetingType === "uts" || meet.meetingType === "uas";

									return (
										<AccordionItem
											value={`meet-${meet.id}`}
											key={meet.id}
											className="border rounded-lg px-4 py-2 bg-white data-[state=open]:border-blue-200 data-[state=open]:shadow-sm transition-all"
										>
											<AccordionTrigger className="hover:no-underline py-2">
												<div className="flex items-center gap-3 w-full justify-between pr-4">
													<div className="flex items-center gap-3 text-left">
														<div
															className={`p-2 rounded-full ${isUtsUas ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}
														>
															{isUtsUas ? (
																<FileText className="h-4 w-4" />
															) : (
																<BookOpen className="h-4 w-4" />
															)}
														</div>
														<div>
															<p className="font-semibold">
																{meet.meetingLabel}
															</p>
															<p className="text-sm text-slate-500 font-normal">
																{meet.meetingDate
																	? new Date(
																			meet.meetingDate,
																		).toLocaleDateString("id-ID", {
																			weekday: "long",
																			day: "numeric",
																			month: "long",
																			year: "numeric",
																		})
																	: "Tanggal belum diatur"}
															</p>
														</div>
													</div>
													<Badge
														variant="secondary"
														className="font-normal shrink-0"
													>
														{
															Object.keys(attendanceData[meet.id] || {}).filter(
																(k) =>
																	attendanceData[meet.id][parseInt(k)]
																		.status === "hadir",
															).length
														}{" "}
														Hadir
													</Badge>
												</div>
											</AccordionTrigger>

											<AccordionContent className="pt-4 pb-4 space-y-6">
												{/* Info Pertemuan */}
												<div className="bg-slate-50 p-4 rounded-md border border-slate-100 space-y-3">
													<div className="flex justify-between items-center">
														<h3 className="font-semibold text-slate-700 flex items-center gap-2">
															Info Pertemuan
														</h3>
														{!isEditingInfo ? (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setMeetingForm({
																		label: meet.meetingLabel,
																		date: meet.meetingDate
																			? meet.meetingDate.split("T")[0]
																			: "",
																		desc: meet.description || "",
																	});
																	setEditingMeeting(meet.id);
																}}
															>
																<Edit className="h-4 w-4 mr-2" /> Edit Info
															</Button>
														) : (
															<div className="flex gap-2">
																<Button
																	variant="ghost"
																	size="sm"
																	onClick={() => setEditingMeeting(null)}
																>
																	Batal
																</Button>
																<Button
																	size="sm"
																	onClick={() => saveMeetingInfo(meet.id)}
																>
																	<Save className="h-4 w-4 mr-2" /> Simpan
																</Button>
															</div>
														)}
													</div>

													{isEditingInfo ? (
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
															<div className="space-y-2">
																<Label>Judul / Label Pertemuan</Label>
																<Input
																	className="border-2 border-slate-200"
																	value={meetingForm.label}
																	onChange={(e) =>
																		setMeetingForm({
																			...meetingForm,
																			label: e.target.value,
																		})
																	}
																/>
															</div>
															<div className="space-y-2">
																<Label>Tanggal Pertemuan</Label>
																<Input
																	type="date"
																	className="border-2 border-slate-200"
																	value={meetingForm.date}
																	onChange={(e) =>
																		setMeetingForm({
																			...meetingForm,
																			date: e.target.value,
																		})
																	}
																/>
															</div>
															<div className="space-y-2 md:col-span-2">
																<Label>Deskripsi / Materi / Topik</Label>
																<Textarea
																	className="border-2 border-slate-200"
																	value={meetingForm.desc}
																	onChange={(e) =>
																		setMeetingForm({
																			...meetingForm,
																			desc: e.target.value,
																		})
																	}
																	rows={2}
																/>
															</div>
														</div>
													) : (
														<div className="text-sm text-slate-600 space-y-1">
															<p>
																<strong>Topik / Deskripsi:</strong>{" "}
																{meet.description || (
																	<span className="italic text-slate-400">
																		Belum ada deskripsi
																	</span>
																)}
															</p>
														</div>
													)}
												</div>

												{/* Kegiatan Pembelajaran & Ujian */}
												<div className="space-y-3">
													<h3 className="font-semibold text-slate-700 flex items-center gap-2 border-b pb-2">
														{isUtsUas ? "Hasil Ujian" : "Kegiatan Pembelajaran"}
													</h3>

													<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
														{isUtsUas ? (
															<ActivityCard
																title="Ujian"
																type="ujian"
																meet={meet}
																editingState={editingActivity}
																setEditing={setEditingActivity}
																form={activityForm}
																setForm={setActivityForm}
																onSave={(actId?: number) =>
																	saveActivity(meet.id, "ujian", actId)
																}
															/>
														) : (
															<>
																<ActivityCard
																	title="Teori"
																	type="teori"
																	meet={meet}
																	editingState={editingActivity}
																	setEditing={setEditingActivity}
																	form={activityForm}
																	setForm={setActivityForm}
																	onSave={(actId?: number) =>
																		saveActivity(meet.id, "teori", actId)
																	}
																/>
																<ActivityCard
																	title="Praktik"
																	type="praktik"
																	meet={meet}
																	editingState={editingActivity}
																	setEditing={setEditingActivity}
																	form={activityForm}
																	setForm={setActivityForm}
																	onSave={(actId?: number) =>
																		saveActivity(meet.id, "praktik", actId)
																	}
																/>
																<ActivityCard
																	title="Tugas"
																	type="tugas"
																	meet={meet}
																	editingState={editingActivity}
																	setEditing={setEditingActivity}
																	form={activityForm}
																	setForm={setActivityForm}
																	onSave={(actId?: number) =>
																		saveActivity(meet.id, "tugas", actId)
																	}
																/>
															</>
														)}
													</div>
												</div>

												{/* Presensi Mahasiswa */}
												<div className="space-y-3 pt-2">
													<div className="flex justify-between items-center border-b pb-2">
														<h3 className="font-semibold text-slate-700">
															Presensi Kelas
														</h3>
														<Button
															size="sm"
															onClick={() => saveAttendances(meet.id)}
															disabled={isSavingAttendance === meet.id}
														>
															{isSavingAttendance === meet.id ? (
																<Loader2 className="h-4 w-4 animate-spin mr-2" />
															) : (
																<Save className="h-4 w-4 mr-2" />
															)}
															Simpan Presensi
														</Button>
													</div>

													{students.length === 0 ? (
														<div className="text-center py-6 text-slate-500 text-sm bg-slate-50 rounded-md border border-dashed">
															Tidak ada mahasiswa aktif di angkatan{" "}
															{course.cohort}
														</div>
													) : (
														<div className="border rounded-md overflow-x-auto">
															<Table>
																<TableHeader>
																	<TableRow className="bg-slate-50">
																		<TableHead className="w-[100px]">
																			NIM
																		</TableHead>
																		<TableHead>Nama Mahasiswa</TableHead>
																		<TableHead className="w-[180px]">
																			Status
																		</TableHead>
																		<TableHead>Catatan</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{students.map((s) => {
																		const att = attendanceData[meet.id]?.[
																			s.id
																		] || { status: "hadir", notes: "" };
																		return (
																			<TableRow key={s.id}>
																				<TableCell className="font-medium text-slate-500">
																					{s.nim}
																				</TableCell>
																				<TableCell>{s.name}</TableCell>
																				<TableCell>
																					<Select
																						value={att.status || "hadir"}
																						onValueChange={(val) => {
																							setAttendanceData((prev) => {
																								const meetData =
																									prev[meet.id] || {};
																								return {
																									...prev,
																									[meet.id]: {
																										...meetData,
																										[s.id]: {
																											...att,
																											status: val || "hadir",
																										},
																									},
																								};
																							});
																						}}
																					>
																						<SelectTrigger className="border-2 border-slate-200 h-8 text-xs">
																							<SelectValue />
																						</SelectTrigger>
																						<SelectContent>
																							<SelectItem value="hadir">
																								Hadir
																							</SelectItem>
																							<SelectItem value="izin">
																								Izin
																							</SelectItem>
																							<SelectItem value="sakit">
																								Sakit
																							</SelectItem>
																							<SelectItem value="alpha">
																								Alpha
																							</SelectItem>
																						</SelectContent>
																					</Select>
																				</TableCell>
																				<TableCell>
																					<Input
																						placeholder="Opsional..."
																						className="border-2 border-slate-200 h-8 text-xs"
																						value={att.notes || ""}
																						onChange={(e) => {
																							setAttendanceData((prev) => {
																								const meetData =
																									prev[meet.id] || {};
																								return {
																									...prev,
																									[meet.id]: {
																										...meetData,
																										[s.id]: {
																											...att,
																											notes: e.target.value,
																										},
																									},
																								};
																							});
																						}}
																					/>
																				</TableCell>
																			</TableRow>
																		);
																	})}
																</TableBody>
															</Table>
														</div>
													)}
												</div>
											</AccordionContent>
										</AccordionItem>
									);
								})}
							</Accordion>
						</CardContent>
					</Card>
				</TabsContent>

				{course.type === "praktik" && (
					<TabsContent value="anggaran">
						<TabAnggaranPraktik
							courseId={courseId}
							canEdit={
								user?.role === "dosen" ||
								user?.role === "akademik" ||
								user?.role === "superadmin"
							}
						/>
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
}

// Helper Component for Activity Card
function ActivityCard({
	title,
	type,
	meet,
	editingState,
	setEditing,
	form,
	setForm,
	onSave,
}: any) {
	const act = meet.activities.find((a: any) => a.activityType === type);
	const isEditing =
		editingState?.meetingId === meet.id && editingState?.type === type;

	return (
		<div className="border rounded-md p-3 space-y-2 bg-white relative">
			<div className="flex justify-between items-center mb-1">
				<span className="font-medium text-sm text-slate-700">{title}</span>
				{!isEditing ? (
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => {
							setForm({
								score: act?.score?.toString() || "",
								notes: act?.notes || "",
								documentUrl: act?.documentUrl,
								documentName: act?.documentName,
								file: null,
							});
							setEditing({ meetingId: meet.id, type, actId: act?.id });
						}}
					>
						<Edit className="h-3 w-3" />
					</Button>
				) : null}
			</div>

			{isEditing ? (
				<div className="space-y-2">
					<Input
						type="number"
						placeholder="Nilai (0-100)"
						className="border-2 border-slate-200 h-8 text-sm"
						value={form.score}
						onChange={(e) => setForm({ ...form, score: e.target.value })}
					/>
					<Textarea
						placeholder="Catatan..."
						className="border-2 border-slate-200 min-h-[60px] text-sm"
						value={form.notes}
						onChange={(e) => setForm({ ...form, notes: e.target.value })}
					/>
					<div>
						<Label className="text-xs">Dokumen Lampiran</Label>
						{form.documentUrl && !form.file && (
							<div className="flex items-center gap-2 p-2 bg-slate-50 border rounded-md text-xs mb-1">
								<Paperclip className="h-3 w-3 text-blue-500" />
								<span className="flex-1 truncate">
									{form.documentName || "Dokumen tersimpan"}
								</span>
								<Button
									variant="ghost"
									size="sm"
									className="h-5 w-5 p-0"
									onClick={() =>
										setForm((prev: any) => ({
											...prev,
											documentUrl: undefined,
											documentName: undefined,
										}))
									}
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						)}
						<Input
							type="file"
							className="h-8 text-xs p-1"
							onChange={(e) =>
								setForm({ ...form, file: e.target.files?.[0] || null })
							}
						/>
					</div>
					<div className="flex gap-1 justify-end pt-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs px-2"
							onClick={() => setEditing(null)}
						>
							Batal
						</Button>
						<Button
							size="sm"
							className="h-7 text-xs px-2"
							onClick={() => onSave(act?.id)}
						>
							Simpan
						</Button>
					</div>
				</div>
			) : (
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-xs text-slate-500">Nilai:</span>
						<Badge
							variant="outline"
							className={
								act?.score ? "font-bold" : "text-slate-400 font-normal"
							}
						>
							{act?.score !== null && act?.score !== undefined
								? act.score
								: "-"}
						</Badge>
					</div>
					<div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 min-h-[40px]">
						{act?.notes || (
							<span className="italic text-slate-400">Belum ada catatan</span>
						)}
					</div>
					{act?.documentUrl && (
						<div className="mt-2">
							<a
								href={act.documentUrl}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
							>
								<Paperclip className="h-3 w-3 mr-1" />
								{act.documentName || "Dokumen Lampiran"}
							</a>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
