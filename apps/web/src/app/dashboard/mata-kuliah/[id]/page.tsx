"use client";

import {
	ArrowLeft,
	BookOpen,
	Calendar,
	Check,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ClipboardCheck,
	Download,
	Edit,
	FileText,
	GraduationCap,
	Layers,
	Loader2,
	Paperclip,
	Plus,
	Save,
	Sparkles,
	Users,
	Wrench,
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
	meetingType: "pkkmb" | "beginning" | "regular" | "uts" | "uas";
	sessionType: "teori" | "praktik" | "keduanya" | null;
	meetingLabel: string;
	description: string | null;
	meetingDate: string | null;
	activities: any[];
	attendances: {
		studentId: number;
		status: string | null;
		theoryScore?: number | null;
		practicalScore?: number | null;
		notes: string | null;
		student: { name: string; nim: string };
	}[];
};

type StudentRecord = {
	id: number;
	nim: string;
	name: string;
};

interface StudentAttendanceInput {
	status: string | null;
	theoryScore: string | number;
	practicalScore: string | number;
	notes: string;
}

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
		sessionType: "" as "teori" | "praktik" | "keduanya" | "",
		date: "",
		desc: "",
	});

	// Attendance State: Record<meetingId, Record<studentId, StudentAttendanceInput>>
	const [attendanceData, setAttendanceData] = useState<
		Record<number, Record<number, StudentAttendanceInput>>
	>({});
	const [isSavingAttendance, setIsSavingAttendance] = useState<number | null>(
		null,
	);
	const [isSavingInfo, setIsSavingInfo] = useState<number | null>(null);

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
				const meets = (mData.data as any[]) || [];
				// Sort by meetingNumber ascending
				meets.sort((a, b) => (a.meetingNumber ?? 0) - (b.meetingNumber ?? 0));
				setMeetings(meets);

				// Prepare attendance state
				const attState: Record<
					number,
					Record<number, StudentAttendanceInput>
				> = {};
				meets.forEach((m) => {
					attState[m.id] = {};
					if (m.attendances && Array.isArray(m.attendances)) {
						m.attendances.forEach((a: any) => {
							attState[m.id][a.studentId] = {
								status: a.status || null,
								theoryScore:
									a.theoryScore !== null && a.theoryScore !== undefined
										? a.theoryScore
										: "",
								practicalScore:
									a.practicalScore !== null && a.practicalScore !== undefined
										? a.practicalScore
										: "",
								notes: a.notes || "",
							};
						});
					}
				});
				setAttendanceData(attState);
			}

			// Get students in this cohort
			if (courseInfo?.cohort) {
				const { data: sData, error: sErr } = await api.students.get({
					$query: { cohort: courseInfo.cohort.toString(), all: "true" },
				});
				if (!sErr && sData?.data) {
					const sList = (sData.data as any[]).map((item) => item.student);
					// Sort students by name
					sList.sort((a, b) => a.name.localeCompare(b.name));
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

	// Save Meeting Info & Session Type
	const saveMeetingInfo = async (meetingId: number) => {
		setIsSavingInfo(meetingId);
		try {
			const { error } = await api.courses[courseId].meetings[
				meetingId.toString()
			].patch({
				meetingLabel: meetingForm.label,
				sessionType: meetingForm.sessionType || null,
				meetingDate: meetingForm.date || undefined,
				description: meetingForm.desc,
			});
			if (error) throw error;
			toast.success("Informasi pertemuan & jenis sesi berhasil disimpan");
			setEditingMeeting(null);

			// Update local state
			setMeetings((prev) =>
				prev.map((m) =>
					m.id === meetingId
						? {
								...m,
								meetingLabel: meetingForm.label,
								sessionType: (meetingForm.sessionType as any) || null,
								meetingDate: meetingForm.date || null,
								description: meetingForm.desc,
							}
						: m,
				),
			);
		} catch (err: any) {
			toast.error("Gagal menyimpan info pertemuan");
		} finally {
			setIsSavingInfo(null);
		}
	};

	// Save Attendances & Scores
	const saveAttendances = async (meetingId: number) => {
		setIsSavingAttendance(meetingId);
		try {
			const meetingAtt = attendanceData[meetingId] || {};
			const payload = students.map((s) => {
				const entry = meetingAtt[s.id];
				return {
					studentId: s.id,
					status: entry?.status || null,
					theoryScore:
						entry?.theoryScore !== undefined &&
						entry?.theoryScore !== null &&
						entry?.theoryScore !== ""
							? Math.max(0, Math.min(100, Number(entry.theoryScore) || 0))
							: null,
					practicalScore:
						entry?.practicalScore !== undefined &&
						entry?.practicalScore !== null &&
						entry?.practicalScore !== ""
							? Math.max(0, Math.min(100, Number(entry.practicalScore) || 0))
							: null,
					notes: entry?.notes || null,
				};
			});

			const { error } = await api.courses[courseId].meetings[
				meetingId.toString()
			].attendances.post({
				attendances: payload,
			});
			if (error) throw error;
			toast.success(
				"Presensi dan nilai harian berhasil disimpan & disinkronisasi!",
			);
			fetchData();
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
				"Jenis Sesi":
					m.sessionType === "teori"
						? "Teori"
						: m.sessionType === "praktik"
							? "Praktik"
							: m.sessionType === "keduanya"
								? "Teori & Praktik"
								: "-",
				Tanggal: m.meetingDate || "-",
				Deskripsi: m.description || "-",
			};

			if (students.length === 0) {
				exportData.push(baseRow);
			} else {
				students.forEach((s) => {
					const att = m.attendances?.find((a) => a.studentId === s.id);
					exportData.push({
						...baseRow,
						NIM: s.nim,
						Mahasiswa: s.name,
						Kehadiran: att?.status ? att.status.toUpperCase() : "BELUM DIISI",
						"Nilai Teori":
							att?.theoryScore !== null && att?.theoryScore !== undefined
								? att.theoryScore
								: "-",
						"Nilai Praktik":
							att?.practicalScore !== null && att?.practicalScore !== undefined
								? att.practicalScore
								: "-",
						"Catatan Kehadiran": att?.notes || "-",
					});
				});
			}
		});

		exportToCSV(
			exportData,
			`Rekap_Nilai_Presensi_${course.code}_${course.name.replace(/\s+/g, "_")}`,
		);
	};

	const getSessionTypeBadge = (type: string | null | undefined) => {
		switch (type) {
			case "teori":
				return (
					<Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium">
						<BookOpen className="w-3 h-3 mr-1 inline" /> Teori
					</Badge>
				);
			case "praktik":
				return (
					<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium">
						<Wrench className="w-3 h-3 mr-1 inline" /> Praktik
					</Badge>
				);
			case "keduanya":
				return (
					<Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 font-medium">
						<Layers className="w-3 h-3 mr-1 inline" /> Teori & Praktik
					</Badge>
				);
			default:
				return (
					<Badge
						variant="outline"
						className="text-slate-400 border-slate-300 font-normal"
					>
						Sesi Belum Diatur
					</Badge>
				);
		}
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
			<div className="p-6 text-center text-red-500 font-medium">
				Mata kuliah tidak ditemukan
			</div>
		);

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="icon"
						onClick={() => router.push("/dashboard/mata-kuliah")}
						className="h-10 w-10 border-slate-200 text-slate-600 hover:bg-slate-50"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold text-slate-800">
								{course.name}
							</h1>
							<Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
								{course.code}
							</Badge>
							{course.peminatan && (
								<Badge
									variant="secondary"
									className="bg-slate-100 text-slate-700"
								>
									{course.peminatan}
								</Badge>
							)}
						</div>
						<p className="text-sm text-slate-500 mt-0.5">
							Dosen Pengampu:{" "}
							<span className="font-semibold text-slate-700">
								{course.dosen.fullName}
							</span>
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					onClick={handleExportDetail}
					className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
				>
					<Download className="mr-2 h-4 w-4 text-blue-600" /> Export Rekap &
					Nilai
				</Button>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
					<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
						<div className="p-2.5 rounded-full bg-blue-50 text-blue-600 mb-1">
							<GraduationCap className="h-5 w-5" />
						</div>
						<p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
							Angkatan
						</p>
						<p className="text-xl font-bold text-slate-800">{course.cohort}</p>
					</CardContent>
				</Card>
				<Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
					<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
						<div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 mb-1">
							<BookOpen className="h-5 w-5" />
						</div>
						<p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
							Kategori MK
						</p>
						<p className="text-xl font-bold text-slate-800 capitalize">
							{course.type}
						</p>
					</CardContent>
				</Card>
				<Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
					<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
						<div className="p-2.5 rounded-full bg-purple-50 text-purple-600 mb-1">
							<Users className="h-5 w-5" />
						</div>
						<p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
							Peserta Aktif
						</p>
						<p className="text-xl font-bold text-slate-800">
							{students.length} Mahasiswa
						</p>
					</CardContent>
				</Card>
				<Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
					<CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
						<div className="p-2.5 rounded-full bg-amber-50 text-amber-600 mb-1">
							<Calendar className="h-5 w-5" />
						</div>
						<p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
							Total Sesi
						</p>
						<p className="text-xl font-bold text-slate-800">
							{meetings.length} Sesi Pertemuan
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs */}
			<Tabs defaultValue="jadwal" className="w-full">
				<TabsList className="mb-4 bg-slate-100 p-1 rounded-xl border border-slate-200">
					<TabsTrigger
						value="jadwal"
						className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-sm px-6"
					>
						Jadwal Pertemuan & Input Nilai Harian
					</TabsTrigger>
					{course.type === "praktik" && (
						<TabsTrigger
							value="anggaran"
							className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-sm px-6"
						>
							Anggaran Praktik
						</TabsTrigger>
					)}
				</TabsList>

				<TabsContent value="jadwal">
					<Card className="border-slate-200 shadow-sm">
						<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
								<div>
									<CardTitle className="text-xl text-slate-800">
										Manajemen Perkuliahan & Penilaian Per Pertemuan
									</CardTitle>
									<CardDescription className="text-slate-500">
										Tentukan jenis sesi (Teori/Praktik/Keduanya), input presensi
										kehadiran, dan nilai harian mahasiswa. Nilai agregat akan
										dihitung secara otomatis.
									</CardDescription>
								</div>
								<Badge
									variant="outline"
									className="bg-white border-blue-200 text-blue-700 self-start md:self-auto font-medium"
								>
									PKKMB • Beginning Class • Pertemuan 1–16 • UTS (P8) • UAS
									(P16)
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-4">
							<Accordion type="single" collapsible className="w-full space-y-3">
								{meetings.map((meet) => {
									const isEditingInfo = editingMeeting === meet.id;
									const isPkkmb =
										meet.meetingType === "pkkmb" || meet.meetingNumber === -1;
									const isBeginning =
										meet.meetingType === "beginning" ||
										meet.meetingNumber === 0;
									const isUts =
										meet.meetingNumber === 8 || meet.meetingType === "uts";
									const isUas =
										meet.meetingNumber === 16 || meet.meetingType === "uas";

									const meetAtt = attendanceData[meet.id] || {};
									const filledAttendances = Object.values(meetAtt).filter(
										(a) => a.status !== null && a.status !== "",
									);
									const presentCount = filledAttendances.filter(
										(a) => a.status === "hadir",
									).length;

									return (
										<AccordionItem
											value={`meet-${meet.id}`}
											key={meet.id}
											className="border border-slate-200 rounded-xl px-4 py-1.5 bg-white data-[state=open]:border-blue-300 data-[state=open]:shadow-md transition-all"
										>
											<AccordionTrigger className="hover:no-underline py-2.5">
												<div className="flex items-center gap-3 w-full justify-between pr-4">
													<div className="flex items-center gap-3.5 text-left">
														<div
															className={`min-w-12 h-10 px-2 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
																isPkkmb
																	? "bg-indigo-100 text-indigo-800 border border-indigo-300"
																	: isBeginning
																		? "bg-teal-100 text-teal-800 border border-teal-300"
																		: isUts
																			? "bg-amber-100 text-amber-800 border border-amber-300"
																			: isUas
																				? "bg-purple-100 text-purple-800 border border-purple-300"
																				: "bg-blue-50 text-blue-700 border border-blue-200"
															}`}
														>
															{isPkkmb
																? "PKKMB"
																: isBeginning
																	? "BC"
																	: isUts
																		? "UTS"
																		: isUas
																			? "UAS"
																			: `P${meet.meetingNumber}`}
														</div>
														<div>
															<div className="flex items-center gap-2 flex-wrap">
																<p className="font-bold text-slate-800 text-base">
																	{meet.meetingLabel}
																</p>
																{getSessionTypeBadge(meet.sessionType)}
															</div>
															<p className="text-xs text-slate-500 font-normal mt-0.5">
																{meet.meetingDate
																	? new Date(
																			meet.meetingDate,
																		).toLocaleDateString("id-ID", {
																			weekday: "long",
																			day: "numeric",
																			month: "long",
																			year: "numeric",
																		})
																	: "Tanggal perkuliahan belum diatur"}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-2 shrink-0">
														<Badge
															variant="secondary"
															className={`font-semibold text-xs px-2.5 py-1 ${
																presentCount > 0
																	? "bg-emerald-50 text-emerald-700 border border-emerald-200"
																	: "bg-slate-100 text-slate-600"
															}`}
														>
															{presentCount} / {students.length} Hadir
														</Badge>
													</div>
												</div>
											</AccordionTrigger>

											<AccordionContent className="pt-3 pb-4 space-y-6">
												{/* Info Pertemuan & Jenis Sesi Card */}
												<div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
													<div className="flex justify-between items-center border-b border-slate-200 pb-3">
														<div className="flex items-center gap-2">
															<span className="font-bold text-slate-700 text-sm">
																Informasi & Pengaturan Sesi Pertemuan
															</span>
															{meet.sessionType &&
																getSessionTypeBadge(meet.sessionType)}
														</div>
														{!isEditingInfo ? (
															<Button
																variant="outline"
																size="sm"
																className="h-8 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
																onClick={() => {
																	setMeetingForm({
																		label: meet.meetingLabel,
																		sessionType: meet.sessionType || "",
																		date: meet.meetingDate
																			? meet.meetingDate.split("T")[0]
																			: "",
																		desc: meet.description || "",
																	});
																	setEditingMeeting(meet.id);
																}}
															>
																<Edit className="h-3.5 w-3.5 mr-1.5 text-blue-600" />{" "}
																Edit Sesi
															</Button>
														) : (
															<div className="flex gap-2">
																<Button
																	variant="ghost"
																	size="sm"
																	className="h-8 text-slate-600"
																	onClick={() => setEditingMeeting(null)}
																>
																	Batal
																</Button>
																<Button
																	size="sm"
																	className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
																	disabled={isSavingInfo === meet.id}
																	onClick={() => saveMeetingInfo(meet.id)}
																>
																	{isSavingInfo === meet.id ? (
																		<Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
																	) : (
																		<Save className="h-3.5 w-3.5 mr-1.5" />
																	)}
																	Simpan Sesi
																</Button>
															</div>
														)}
													</div>

													{isEditingInfo ? (
														<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
															<div className="space-y-1.5">
																<Label className="text-xs font-semibold text-slate-700">
																	Judul / Label Pertemuan
																</Label>
																<Input
																	className="border-slate-300 bg-white h-9 text-sm"
																	value={meetingForm.label}
																	onChange={(e) =>
																		setMeetingForm({
																			...meetingForm,
																			label: e.target.value,
																		})
																	}
																/>
															</div>
															<div className="space-y-1.5">
																<Label className="text-xs font-semibold text-slate-700">
																	Jenis Sesi Pembelajaran
																</Label>
																<Select
																	value={meetingForm.sessionType || "teori"}
																	onValueChange={(val: any) =>
																		setMeetingForm({
																			...meetingForm,
																			sessionType: val,
																		})
																	}
																>
																	<SelectTrigger className="border-slate-300 bg-white h-9 text-sm">
																		<SelectValue placeholder="Pilih jenis sesi..." />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="teori">Teori</SelectItem>
																		<SelectItem value="praktik">
																			Praktik
																		</SelectItem>
																		<SelectItem value="keduanya">
																			Teori & Praktik
																		</SelectItem>
																	</SelectContent>
																</Select>
															</div>
															<div className="space-y-1.5">
																<Label className="text-xs font-semibold text-slate-700">
																	Tanggal Perkuliahan
																</Label>
																<Input
																	type="date"
																	className="border-slate-300 bg-white h-9 text-sm"
																	value={meetingForm.date}
																	onChange={(e) =>
																		setMeetingForm({
																			...meetingForm,
																			date: e.target.value,
																		})
																	}
																/>
															</div>
															<div className="space-y-1.5 sm:col-span-3">
																<Label className="text-xs font-semibold text-slate-700">
																	Deskripsi / Materi Pokok Perkuliahan
																</Label>
																<Textarea
																	className="border-slate-300 bg-white min-h-[60px] text-sm"
																	value={meetingForm.desc}
																	placeholder="Masukkan pokok bahasan atau materi..."
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
														<div className="text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
															<div>
																<span className="font-semibold text-slate-700">
																	Jenis Sesi:
																</span>{" "}
																{meet.sessionType
																	? meet.sessionType.toUpperCase()
																	: "Belum ditentukan (default: Teori & Praktik)"}
															</div>
															<div>
																<span className="font-semibold text-slate-700">
																	Materi Pokok:
																</span>{" "}
																{meet.description || (
																	<span className="italic text-slate-400">
																		Belum ada deskripsi materi
																	</span>
																)}
															</div>
														</div>
													)}
												</div>

												{/* Presensi & Input Nilai Harian Mahasiswa */}
												<div className="space-y-3">
													<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
														<div>
															<h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
																<ClipboardCheck className="w-4 h-4 text-[#0517B0]" />{" "}
																Presensi Kehadiran & Penilaian Harian
															</h3>
															<p className="text-xs text-slate-500 mt-0.5">
																Isi kehadiran dan nilai harian per mahasiswa.
																Nilai tersimpan langsung dan otomatis
																memperbarui nilai agregat mahasiswa.
															</p>
														</div>
														<Button
															size="sm"
															onClick={() => saveAttendances(meet.id)}
															disabled={isSavingAttendance === meet.id}
															className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm h-9 px-4"
														>
															{isSavingAttendance === meet.id ? (
																<Loader2 className="h-4 w-4 animate-spin mr-2" />
															) : (
																<Save className="h-4 w-4 mr-2" />
															)}
															Simpan Presensi & Nilai
														</Button>
													</div>

													{students.length === 0 ? (
														<div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
															Tidak ada mahasiswa aktif di angkatan{" "}
															{course.cohort}
														</div>
													) : (
														<div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
															<Table>
																<TableHeader>
																	<TableRow className="bg-slate-50/90 text-slate-700">
																		<TableHead className="w-[110px] font-bold">
																			NIM
																		</TableHead>
																		<TableHead className="min-w-[180px] font-bold">
																			Nama Mahasiswa
																		</TableHead>
																		<TableHead className="w-[160px] font-bold">
																			Status Kehadiran
																		</TableHead>
																		{(!meet.sessionType ||
																			meet.sessionType === "teori" ||
																			meet.sessionType === "keduanya") && (
																			<TableHead className="w-[120px] font-bold">
																				Nilai Teori
																			</TableHead>
																		)}
																		{(!meet.sessionType ||
																			meet.sessionType === "praktik" ||
																			meet.sessionType === "keduanya") && (
																			<TableHead className="w-[120px] font-bold">
																				Nilai Praktik
																			</TableHead>
																		)}
																		<TableHead className="min-w-[200px] font-bold">
																			Catatan Dosen
																		</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{students.map((s) => {
																		const currentEntry: StudentAttendanceInput =
																			attendanceData[meet.id]?.[s.id] || {
																				status: null,
																				theoryScore: "",
																				practicalScore: "",
																				notes: "",
																			};

																		return (
																			<TableRow
																				key={s.id}
																				className="hover:bg-slate-50/60 transition-colors"
																			>
																				<TableCell className="font-mono text-xs font-semibold text-slate-600">
																					{s.nim || "-"}
																				</TableCell>
																				<TableCell className="font-medium text-slate-800 text-sm">
																					{s.name}
																				</TableCell>
																				<TableCell>
																					<Select
																						value={
																							currentEntry.status ||
																							"unassigned"
																						}
																						onValueChange={(val) => {
																							const finalStatus =
																								val === "unassigned"
																									? null
																									: val;
																							setAttendanceData((prev) => {
																								const meetMap =
																									prev[meet.id] || {};
																								return {
																									...prev,
																									[meet.id]: {
																										...meetMap,
																										[s.id]: {
																											...currentEntry,
																											status: finalStatus,
																										},
																									},
																								};
																							});
																						}}
																					>
																						<SelectTrigger
																							className={`border-slate-300 h-8 text-xs font-medium ${
																								currentEntry.status === "hadir"
																									? "bg-emerald-50 text-emerald-800 border-emerald-300"
																									: currentEntry.status ===
																											"izin"
																										? "bg-amber-50 text-amber-800 border-amber-300"
																										: currentEntry.status ===
																												"sakit"
																											? "bg-blue-50 text-blue-800 border-blue-300"
																											: currentEntry.status ===
																													"alpha"
																												? "bg-rose-50 text-rose-800 border-rose-300"
																												: "bg-white text-slate-500"
																							}`}
																						>
																							<SelectValue />
																						</SelectTrigger>
																						<SelectContent>
																							<SelectItem value="unassigned">
																								- Belum Diisi -
																							</SelectItem>
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

																				{(!meet.sessionType ||
																					meet.sessionType === "teori" ||
																					meet.sessionType === "keduanya") && (
																					<TableCell>
																						<Input
																							type="number"
																							min={0}
																							max={100}
																							placeholder="0 - 100"
																							className="border-slate-300 bg-white h-8 text-xs w-24 font-mono font-semibold"
																							value={
																								currentEntry.theoryScore !==
																									undefined &&
																								currentEntry.theoryScore !==
																									null
																									? currentEntry.theoryScore
																									: ""
																							}
																							onKeyDown={(e) => {
																								if (
																									e.key === "-" ||
																									e.key === "e" ||
																									e.key === "E"
																								)
																									e.preventDefault();
																							}}
																							onChange={(e) => {
																								const val =
																									e.target.value === ""
																										? ""
																										: Math.max(
																												0,
																												Math.min(
																													100,
																													Number(
																														e.target.value,
																													) || 0,
																												),
																											);
																								setAttendanceData((prev) => {
																									const meetMap =
																										prev[meet.id] || {};
																									return {
																										...prev,
																										[meet.id]: {
																											...meetMap,
																											[s.id]: {
																												...currentEntry,
																												theoryScore: val,
																											},
																										},
																									};
																								});
																							}}
																						/>
																					</TableCell>
																				)}

																				{(!meet.sessionType ||
																					meet.sessionType === "praktik" ||
																					meet.sessionType === "keduanya") && (
																					<TableCell>
																						<Input
																							type="number"
																							min={0}
																							max={100}
																							placeholder="0 - 100"
																							className="border-slate-300 bg-white h-8 text-xs w-24 font-mono font-semibold text-emerald-700"
																							value={
																								currentEntry.practicalScore !==
																									undefined &&
																								currentEntry.practicalScore !==
																									null
																									? currentEntry.practicalScore
																									: ""
																							}
																							onKeyDown={(e) => {
																								if (
																									e.key === "-" ||
																									e.key === "e" ||
																									e.key === "E"
																								)
																									e.preventDefault();
																							}}
																							onChange={(e) => {
																								const val =
																									e.target.value === ""
																										? ""
																										: Math.max(
																												0,
																												Math.min(
																													100,
																													Number(
																														e.target.value,
																													) || 0,
																												),
																											);
																								setAttendanceData((prev) => {
																									const meetMap =
																										prev[meet.id] || {};
																									return {
																										...prev,
																										[meet.id]: {
																											...meetMap,
																											[s.id]: {
																												...currentEntry,
																												practicalScore: val,
																											},
																										},
																									};
																								});
																							}}
																						/>
																					</TableCell>
																				)}

																				<TableCell>
																					<Input
																						placeholder="Catatan keaktifan/kinerja..."
																						className="border-slate-300 bg-white h-8 text-xs"
																						value={currentEntry.notes || ""}
																						onChange={(e) => {
																							const noteVal = e.target.value;
																							setAttendanceData((prev) => {
																								const meetMap =
																									prev[meet.id] || {};
																								return {
																									...prev,
																									[meet.id]: {
																										...meetMap,
																										[s.id]: {
																											...currentEntry,
																											notes: noteVal,
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
							currentCourse={course}
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
