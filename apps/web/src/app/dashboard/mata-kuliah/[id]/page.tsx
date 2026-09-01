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
	Info,
	Layers,
	Loader2,
	Paperclip,
	Plus,
	Save,
	Search,
	Sparkles,
	Trash2,
	UserCheck,
	UserPlus,
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
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
import { API_URL, api, getToken } from "@/lib/eden";
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
	cohort?: number;
	program?: string;
	subProgram?: string | null;
	studentStatus?: string;
};

type CustomEnrollment = {
	id: number;
	courseId: number;
	studentId: number;
	notes: string | null;
	createdAt: string;
	student: {
		id: number;
		nim: string;
		name: string;
		cohort: number;
		program: string;
		subProgram: string | null;
		studentStatus: string;
	};
	addedBy: {
		id: number;
		fullName: string;
		username: string;
	} | null;
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
	const [cohortStudents, setCohortStudents] = useState<StudentRecord[]>([]);
	const [enrollments, setEnrollments] = useState<CustomEnrollment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Controlled Tab state (stay on active tab when updating/adding students)
	const [activeTab, setActiveTab] = useState<string>("jadwal");

	// Participant Search in Peserta Tab
	const [pesertaQuery, setPesertaQuery] = useState("");

	// Enrollment Modal State (Multi-Select)
	const [isAddEnrollOpen, setIsAddEnrollOpen] = useState(false);
	const [enrollSearchQuery, setEnrollSearchQuery] = useState("");
	const [candidateStudents, setCandidateStudents] = useState<any[]>([]);
	const [selectedCandidates, setSelectedCandidates] = useState<any[]>([]);
	const [enrollNotes, setEnrollNotes] = useState("");
	const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
	const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);

	// Delete Enrollment State
	const [deleteEnrollConfirmOpen, setDeleteEnrollConfirmOpen] = useState(false);
	const [enrollToDelete, setEnrollToDelete] = useState<CustomEnrollment | null>(
		null,
	);
	const [isDeletingEnroll, setIsDeletingEnroll] = useState(false);

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

	const fetchApi = (endpoint: string, options: RequestInit = {}) => {
		const token = getToken();
		const headers = new Headers(options.headers || {});
		if (token) headers.set("Authorization", `Bearer ${token}`);
		if (
			options.body &&
			!(options.body instanceof FormData) &&
			!headers.has("Content-Type")
		) {
			headers.set("Content-Type", "application/json");
		}
		return fetch(`${API_URL}${endpoint}`, { ...options, headers });
	};

	const fetchData = async () => {
		setIsLoading(true);
		try {
			// 1. Get course info
			const { data: cData, error: cErr } = await api.courses[courseId].get();
			if (cErr) {
				toast.error("Gagal memuat mata kuliah");
				if ((cErr as any).status === 403) router.push("/dashboard/mata-kuliah");
				return;
			}
			const courseInfo = cData?.data as any;
			setCourse(courseInfo);

			// 2. Get meetings
			const { data: mData, error: mErr } =
				await api.courses[courseId].meetings.get();
			if (!mErr && mData?.success) {
				const meets = (mData.data as any[]) || [];
				meets.sort((a, b) => (a.meetingNumber ?? 0) - (b.meetingNumber ?? 0));
				setMeetings(meets);

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

			// 3. Get students in this cohort
			let cohortList: StudentRecord[] = [];
			if (courseInfo?.cohort) {
				const { data: sData, error: sErr } = await api.students.get({
					$query: { cohort: courseInfo.cohort.toString(), all: "true" },
				});
				if (!sErr && sData?.data) {
					cohortList = (sData.data as any[]).map((item) => item.student);
					cohortList.sort((a, b) => a.name.localeCompare(b.name));
					setCohortStudents(cohortList);
				}
			}

			// 4. Get custom enrollments (lintas angkatan)
			let customList: CustomEnrollment[] = [];
			const res = await fetchApi(`/courses/${courseId}/enrollments`);
			if (res.ok) {
				const json = await res.json();
				if (json.success && Array.isArray(json.data)) {
					customList = json.data;
					setEnrollments(customList);
				}
			}

			// 5. Combine students from cohort + custom enrollments (de-duplicate by studentId)
			const studentMap = new Map<number, StudentRecord>();
			for (const s of cohortList) {
				studentMap.set(s.id, {
					id: s.id,
					nim: s.nim || "-",
					name: s.name,
					cohort: s.cohort,
					subProgram: s.subProgram,
					studentStatus: s.studentStatus,
				});
			}
			for (const e of customList) {
				if (e.student) {
					studentMap.set(e.student.id, {
						id: e.student.id,
						nim: e.student.nim || "-",
						name: e.student.name,
						cohort: e.student.cohort,
						subProgram: e.student.subProgram,
						studentStatus: e.student.studentStatus,
					});
				}
			}

			const combined = Array.from(studentMap.values()).sort((a, b) =>
				a.name.localeCompare(b.name),
			);
			setStudents(combined);
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

	// Search candidate students for manual enrollment
	const searchCandidates = async (query: string) => {
		setIsSearchingCandidates(true);
		try {
			const res = await fetchApi(
				`/courses/${courseId}/enrollments/search?q=${encodeURIComponent(query)}`,
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success && Array.isArray(json.data)) {
					const existingIds = new Set(students.map((s) => s.id));
					const eligible = json.data.filter(
						(cand: any) => !existingIds.has(cand.id),
					);
					setCandidateStudents(eligible);
				}
			}
		} catch (err) {
			console.error("Gagal mencari mahasiswa:", err);
		} finally {
			setIsSearchingCandidates(false);
		}
	};

	// Toggle individual student candidate selection
	const toggleCandidate = (cand: any) => {
		setSelectedCandidates((prev) => {
			const exists = prev.some((c) => c.id === cand.id);
			if (exists) {
				return prev.filter((c) => c.id !== cand.id);
			} else {
				return [...prev, cand];
			}
		});
	};

	// Toggle Select All / Unselect All
	const toggleSelectAllCandidates = () => {
		if (candidateStudents.length === 0) return;
		const allSelected = candidateStudents.every((c) =>
			selectedCandidates.some((sc) => sc.id === c.id),
		);
		if (allSelected) {
			const candidateIds = new Set(candidateStudents.map((c) => c.id));
			setSelectedCandidates((prev) =>
				prev.filter((sc) => !candidateIds.has(sc.id)),
			);
		} else {
			const newMap = new Map<number, any>();
			for (const sc of selectedCandidates) newMap.set(sc.id, sc);
			for (const c of candidateStudents) newMap.set(c.id, c);
			setSelectedCandidates(Array.from(newMap.values()));
		}
	};

	// Add manual enrollment (batch multi-student)
	const handleAddEnrollment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedCandidates.length === 0) {
			toast.error("Silakan pilih minimal satu mahasiswa");
			return;
		}

		setIsSubmittingEnroll(true);
		try {
			const res = await fetchApi(`/courses/${courseId}/enrollments`, {
				method: "POST",
				body: JSON.stringify({
					studentIds: selectedCandidates.map((c) => c.id),
					notes: enrollNotes.trim() || undefined,
				}),
			});
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success(
					`${selectedCandidates.length} mahasiswa berhasil ditambahkan ke mata kuliah!`,
				);
				setIsAddEnrollOpen(false);
				setSelectedCandidates([]);
				setEnrollNotes("");
				setEnrollSearchQuery("");
				setCandidateStudents([]);
				fetchData();
			} else {
				toast.error(json.message || "Gagal menambahkan mahasiswa");
			}
		} catch (err: any) {
			toast.error(err.message || "Terjadi kesalahan sistem");
		} finally {
			setIsSubmittingEnroll(false);
		}
	};

	// Delete manual enrollment
	const handleDeleteEnrollment = async () => {
		if (!enrollToDelete) return;
		setIsDeletingEnroll(true);
		try {
			const res = await fetchApi(
				`/courses/${courseId}/enrollments/${enrollToDelete.id}`,
				{ method: "DELETE" },
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success(
					"Pendaftaran mahasiswa berhasil dihapus dari mata kuliah",
				);
				setDeleteEnrollConfirmOpen(false);
				setEnrollToDelete(null);
				fetchData();
			} else {
				toast.error(json.message || "Gagal menghapus pendaftaran");
			}
		} catch (err: any) {
			toast.error(err.message || "Terjadi kesalahan sistem");
		} finally {
			setIsDeletingEnroll(false);
		}
	};

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
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="mb-4 bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap h-auto gap-1">
					<TabsTrigger
						value="jadwal"
						className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-sm px-5 py-2"
					>
						<Calendar className="w-4 h-4 mr-2 text-blue-600 inline" />
						Jadwal & Input Nilai
					</TabsTrigger>
					<TabsTrigger
						value="peserta"
						className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-sm px-5 py-2"
					>
						<Users className="w-4 h-4 mr-2 text-purple-600 inline" />
						Daftar Peserta Kelas ({students.length})
						{enrollments.length > 0 && (
							<Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0 px-1.5 font-bold">
								+{enrollments.length} Tambahan
							</Badge>
						)}
					</TabsTrigger>
					{course.type === "praktik" && (
						<TabsTrigger
							value="anggaran"
							className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold text-sm px-5 py-2"
						>
							<Wrench className="w-4 h-4 mr-2 text-emerald-600 inline" />
							Anggaran Praktik
						</TabsTrigger>
					)}
				</TabsList>

				{/* TAB 1: JADWAL & PRESENSI */}
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

									// Only count 'hadir' for students currently enrolled in the course
									const presentCount = students.filter(
										(s) => attendanceData[meet.id]?.[s.id]?.status === "hadir",
									).length;

									return (
										<AccordionItem
											value={`meet-${meet.id}`}
											key={meet.id}
											className="border border-slate-200 rounded-xl px-4 py-1.5 bg-white data-[state=open]:border-blue-300 data-[state=open]:shadow-md transition-all"
										>
											<AccordionTrigger className="hover:no-underline py-2.5">
												<div className="flex items-center gap-3 w-full justify-between pr-4">
													<div className="text-left">
														<div className="flex items-center gap-2 flex-wrap">
															<p className="font-bold text-slate-800 text-base">
																{meet.meetingLabel}
															</p>
															{getSessionTypeBadge(meet.sessionType)}
														</div>
														<p className="text-xs text-slate-500 font-normal mt-0.5">
															{meet.meetingDate
																? new Date(meet.meetingDate).toLocaleDateString(
																		"id-ID",
																		{
																			weekday: "long",
																			day: "numeric",
																			month: "long",
																			year: "numeric",
																		},
																	)
																: "Tanggal perkuliahan belum diatur"}
														</p>
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
																	Deskripsi / Rencana Pembelajaran Sesi Ini
																</Label>
																<Textarea
																	className="border-slate-300 bg-white text-sm"
																	rows={2}
																	placeholder="Topik materi, modul, atau tugas..."
																	value={meetingForm.desc}
																	onChange={(e) =>
																		setMeetingForm({
																			...meetingForm,
																			desc: e.target.value,
																		})
																	}
																/>
															</div>
														</div>
													) : (
														<p className="text-xs text-slate-600 italic bg-white p-3 rounded-lg border border-slate-200">
															{meet.description ||
																"Belum ada deskripsi materi untuk sesi perkuliahan ini."}
														</p>
													)}
												</div>

												{/* Presensi & Input Nilai Card */}
												<div className="space-y-3">
													<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
														<div>
															<h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
																<ClipboardCheck className="w-4 h-4 text-blue-600" />
																Presensi Kehadiran & Nilai Mahasiswa Sesi Ini
															</h4>
															<p className="text-xs text-slate-500">
																{meet.sessionType === "praktik"
																	? "Fokus input Nilai Praktik (0-100)"
																	: meet.sessionType === "keduanya"
																		? "Input Nilai Teori & Praktik (0-100)"
																		: "Fokus input Nilai Teori (0-100)"}
															</p>
														</div>
														<Button
															size="sm"
															className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs shadow-sm"
															disabled={isSavingAttendance === meet.id}
															onClick={() => saveAttendances(meet.id)}
														>
															{isSavingAttendance === meet.id ? (
																<Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
															) : (
																<Save className="h-3.5 w-3.5 mr-1.5" />
															)}
															Simpan Presensi & Nilai
														</Button>
													</div>

													{students.length === 0 ? (
														<div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
															<Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
															<p className="text-sm font-semibold text-slate-600">
																Belum ada mahasiswa terdaftar
															</p>
															<p className="text-xs text-slate-400 mt-0.5">
																Mahasiswa angkatan {course.cohort} atau
																mahasiswa tambahan akan tampil di sini.
															</p>
														</div>
													) : (
														<div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
															<Table>
																<TableHeader className="bg-slate-100">
																	<TableRow>
																		<TableHead className="w-12 text-center text-xs font-bold text-slate-700">
																			No
																		</TableHead>
																		<TableHead className="w-28 text-xs font-bold text-slate-700">
																			NIM
																		</TableHead>
																		<TableHead className="text-xs font-bold text-slate-700">
																			Nama Mahasiswa
																		</TableHead>
																		<TableHead className="w-40 text-xs font-bold text-slate-700">
																			Kehadiran
																		</TableHead>
																		{(!meet.sessionType ||
																			meet.sessionType === "teori" ||
																			meet.sessionType === "keduanya") && (
																			<TableHead className="w-28 text-xs font-bold text-slate-700">
																				Nilai Teori
																			</TableHead>
																		)}
																		{(!meet.sessionType ||
																			meet.sessionType === "praktik" ||
																			meet.sessionType === "keduanya") && (
																			<TableHead className="w-28 text-xs font-bold text-slate-700">
																				Nilai Praktik
																			</TableHead>
																		)}
																		<TableHead className="text-xs font-bold text-slate-700">
																			Catatan
																		</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody className="divide-y divide-slate-100">
																	{students.map((s, idx) => {
																		const currentEntry = attendanceData[
																			meet.id
																		]?.[s.id] || {
																			status: null,
																			theoryScore: "",
																			practicalScore: "",
																			notes: "",
																		};

																		return (
																			<TableRow
																				key={s.id}
																				className="hover:bg-slate-50/70"
																			>
																				<TableCell className="text-center text-xs font-medium text-slate-500">
																					{idx + 1}
																				</TableCell>
																				<TableCell className="text-xs font-mono font-medium text-slate-600">
																					{s.nim || "-"}
																				</TableCell>
																				<TableCell className="text-xs font-bold text-slate-900">
																					<div className="flex items-center gap-2">
																						<span>{s.name}</span>
																						{s.cohort &&
																							s.cohort !== course.cohort && (
																								<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-medium">
																									Angkatan {s.cohort}
																								</Badge>
																							)}
																					</div>
																				</TableCell>
																				<TableCell>
																					<Select
																						value={
																							currentEntry.status ||
																							"unselected"
																						}
																						onValueChange={(val) => {
																							const realVal =
																								val === "unselected"
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
																											status: realVal,
																										},
																									},
																								};
																							});
																						}}
																					>
																						<SelectTrigger
																							className={`h-8 text-xs border ${
																								currentEntry.status === "hadir"
																									? "border-emerald-300 bg-emerald-50/70 text-emerald-800 font-bold"
																									: currentEntry.status ===
																											"izin"
																										? "border-blue-300 bg-blue-50/70 text-blue-800 font-bold"
																										: currentEntry.status ===
																												"sakit"
																											? "border-amber-300 bg-amber-50/70 text-amber-800 font-bold"
																											: currentEntry.status ===
																													"alpha"
																												? "border-red-300 bg-red-50/70 text-red-800 font-bold"
																												: "border-slate-300 bg-white text-slate-400"
																							}`}
																						>
																							<SelectValue placeholder="Pilih status" />
																						</SelectTrigger>
																						<SelectContent>
																							<SelectItem
																								value="unselected"
																								className="text-slate-400 text-xs"
																							>
																								- Belum Diisi -
																							</SelectItem>
																							<SelectItem
																								value="hadir"
																								className="text-emerald-700 font-bold text-xs"
																							>
																								✓ Hadir
																							</SelectItem>
																							<SelectItem
																								value="izin"
																								className="text-blue-700 font-bold text-xs"
																							>
																								ℹ Izin
																							</SelectItem>
																							<SelectItem
																								value="sakit"
																								className="text-amber-700 font-bold text-xs"
																							>
																								✚ Sakit
																							</SelectItem>
																							<SelectItem
																								value="alpha"
																								className="text-red-700 font-bold text-xs"
																							>
																								✕ Alpha
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
																							className="border-slate-300 bg-white h-8 text-xs w-24 font-mono font-semibold text-blue-700"
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

				{/* TAB 2: DAFTAR PESERTA KELAS */}
				<TabsContent value="peserta" className="space-y-6">
					{/* Header Peserta & Actions */}
					<Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
						<CardHeader className="bg-slate-50/70 border-b border-slate-200 p-5">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div>
									<CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
										<Users className="w-5 h-5 text-[#0517B0]" />
										Peserta Mata Kuliah: {course.name}
									</CardTitle>
									<CardDescription className="text-xs sm:text-sm text-slate-500 mt-1">
										Daftar seluruh mahasiswa yang terdaftar di kelas ini.
									</CardDescription>
								</div>
								{(user?.role === "superadmin" ||
									user?.role === "akademik" ||
									user?.role === "dosen") && (
									<Button
										onClick={() => {
											setSelectedCandidates([]);
											setEnrollNotes("");
											setEnrollSearchQuery("");
											setCandidateStudents([]);
											setIsAddEnrollOpen(true);
											searchCandidates("");
										}}
										className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs gap-1.5 h-9 shadow-xs shrink-0"
									>
										<UserPlus className="w-4 h-4" />
										Tambah Mahasiswa
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent className="p-5 space-y-6">
							{/* Stat Mini Cards */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
									<div className="p-2.5 rounded-lg bg-blue-600 text-white">
										<Users className="w-5 h-5" />
									</div>
									<div>
										<p className="text-xs text-blue-700 font-semibold">
											Total Seluruh Peserta
										</p>
										<p className="text-xl font-bold text-slate-900">
											{students.length}{" "}
											<span className="text-xs font-normal text-slate-500">
												Mahasiswa
											</span>
										</p>
									</div>
								</div>

								<div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
									<div className="p-2.5 rounded-lg bg-emerald-600 text-white">
										<GraduationCap className="w-5 h-5" />
									</div>
									<div>
										<p className="text-xs text-emerald-700 font-semibold">
											Peserta Reguler (Angkatan {course.cohort})
										</p>
										<p className="text-xl font-bold text-slate-900">
											{cohortStudents.length}{" "}
											<span className="text-xs font-normal text-slate-500">
												Mahasiswa
											</span>
										</p>
									</div>
								</div>

								<div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center gap-3">
									<div className="p-2.5 rounded-lg bg-amber-600 text-white">
										<Sparkles className="w-5 h-5" />
									</div>
									<div>
										<p className="text-xs text-amber-700 font-semibold">
											Mahasiswa Tambahan
										</p>
										<p className="text-xl font-bold text-slate-900">
											{enrollments.length}{" "}
											<span className="text-xs font-normal text-slate-500">
												Mahasiswa
											</span>
										</p>
									</div>
								</div>
							</div>

							{/* Section 1: Peserta Tambahan */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
										<Sparkles className="w-4 h-4 text-amber-600" />
										Mahasiswa Tambahan ({enrollments.length})
									</h3>
								</div>

								{enrollments.length === 0 ? (
									<div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
										<UserCheck className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
										<p className="text-xs font-semibold text-slate-600">
											Belum ada mahasiswa tambahan yang didaftarkan secara
											manual
										</p>
										<p className="text-[11px] text-slate-400 mt-0.5">
											Klik tombol "+ Tambah Mahasiswa" di atas untuk menambahkan
											mahasiswa ke kelas ini.
										</p>
									</div>
								) : (
									<div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/20 shadow-2xs">
										<Table>
											<TableHeader className="bg-amber-50/80">
												<TableRow>
													<TableHead className="w-12 text-center text-xs font-bold text-slate-700">
														No
													</TableHead>
													<TableHead className="w-32 text-xs font-bold text-slate-700">
														NIM
													</TableHead>
													<TableHead className="text-xs font-bold text-slate-700">
														Nama Mahasiswa
													</TableHead>
													<TableHead className="w-28 text-xs font-bold text-slate-700">
														Angkatan
													</TableHead>
													<TableHead className="w-36 text-xs font-bold text-slate-700">
														Peminatan
													</TableHead>
													<TableHead className="text-xs font-bold text-slate-700">
														Catatan / Keterangan
													</TableHead>
													<TableHead className="w-36 text-xs font-bold text-slate-700">
														Didaftarkan Oleh
													</TableHead>
													<TableHead className="w-16 text-right text-xs font-bold text-slate-700">
														Aksi
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody className="divide-y divide-amber-100 bg-white">
												{enrollments.map((enr, idx) => (
													<TableRow
														key={enr.id}
														className="hover:bg-amber-50/40"
													>
														<TableCell className="text-center text-xs font-medium text-slate-500">
															{idx + 1}
														</TableCell>
														<TableCell className="text-xs font-mono font-medium text-slate-700">
															{enr.student?.nim || "-"}
														</TableCell>
														<TableCell className="text-xs font-bold text-slate-900">
															<div className="flex items-center gap-2">
																<span>{enr.student?.name}</span>
																<Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-1.5 py-0 font-semibold">
																	Peserta Tambahan
																</Badge>
															</div>
														</TableCell>
														<TableCell className="text-xs font-semibold text-slate-700">
															Angkatan {enr.student?.cohort}
														</TableCell>
														<TableCell>
															{enr.student?.subProgram ? (
																<PeminatanBadge
																	subProgram={enr.student.subProgram}
																	size="xs"
																/>
															) : (
																<span className="text-slate-400 text-xs">
																	-
																</span>
															)}
														</TableCell>
														<TableCell className="text-xs text-slate-600 italic">
															{enr.notes || "-"}
														</TableCell>
														<TableCell className="text-xs text-slate-600">
															<span className="font-medium text-slate-800">
																{enr.addedBy?.fullName ||
																	enr.addedBy?.username ||
																	"Admin"}
															</span>
															<span className="block text-[10px] text-slate-400">
																{new Date(enr.createdAt).toLocaleDateString(
																	"id-ID",
																	{
																		day: "numeric",
																		month: "short",
																		year: "numeric",
																	},
																)}
															</span>
														</TableCell>
														<TableCell className="text-right">
															{(user?.role === "superadmin" ||
																user?.role === "akademik" ||
																user?.role === "dosen") && (
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => {
																		setEnrollToDelete(enr);
																		setDeleteEnrollConfirmOpen(true);
																	}}
																	className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
																	title="Hapus Mahasiswa dari Mata Kuliah Ini"
																>
																	<Trash2 className="w-3.5 h-3.5" />
																</Button>
															)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</div>

							{/* Section 2: Peserta Reguler Angkatan Kohort */}
							<div className="space-y-3 pt-4 border-t border-slate-200">
								<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
									<h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
										<GraduationCap className="w-4 h-4 text-emerald-600" />
										Daftar Peserta Reguler (Angkatan {course.cohort})
									</h3>
									<div className="relative w-full sm:w-64">
										<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
										<Input
											placeholder="Cari nama atau NIM..."
											value={pesertaQuery}
											onChange={(e) => setPesertaQuery(e.target.value)}
											className="pl-8 h-8 text-xs border-slate-200 bg-slate-50/60 focus:bg-white"
										/>
									</div>
								</div>

								<div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
									<Table>
										<TableHeader className="bg-slate-50">
											<TableRow>
												<TableHead className="w-12 text-center text-xs font-bold text-slate-700">
													No
												</TableHead>
												<TableHead className="w-32 text-xs font-bold text-slate-700">
													NIM
												</TableHead>
												<TableHead className="text-xs font-bold text-slate-700">
													Nama Mahasiswa
												</TableHead>
												<TableHead className="w-36 text-xs font-bold text-slate-700">
													Peminatan
												</TableHead>
												<TableHead className="w-28 text-center text-xs font-bold text-slate-700">
													Status
												</TableHead>
												<TableHead className="w-44 text-xs font-bold text-slate-700">
													Tipe Keikutsertaan
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody className="divide-y divide-slate-100">
											{cohortStudents
												.filter((s) => {
													if (!pesertaQuery) return true;
													const q = pesertaQuery.toLowerCase();
													return (
														s.name.toLowerCase().includes(q) ||
														(s.nim && s.nim.toLowerCase().includes(q))
													);
												})
												.map((s, idx) => (
													<TableRow key={s.id} className="hover:bg-slate-50/70">
														<TableCell className="text-center text-xs font-medium text-slate-500">
															{idx + 1}
														</TableCell>
														<TableCell className="text-xs font-mono font-medium text-slate-700">
															{s.nim || "-"}
														</TableCell>
														<TableCell className="text-xs font-bold text-slate-900">
															{s.name}
														</TableCell>
														<TableCell>
															{s.subProgram ? (
																<PeminatanBadge
																	subProgram={s.subProgram}
																	size="xs"
																/>
															) : (
																<span className="text-slate-400 text-xs">
																	-
																</span>
															)}
														</TableCell>
														<TableCell className="text-center">
															<Badge
																variant="outline"
																className="text-[10px] capitalize px-2 py-0 border-slate-200 text-slate-600 bg-slate-50 font-medium"
															>
																{s.studentStatus || "Aktif"}
															</Badge>
														</TableCell>
														<TableCell>
															<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5 font-medium">
																Reguler Angkatan {course.cohort}
															</Badge>
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* TAB 3: ANGGARAN PRAKTIK */}
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

			{/* Modal Dialog: Tambah Mahasiswa (Multi-Select) */}
			<Dialog open={isAddEnrollOpen} onOpenChange={setIsAddEnrollOpen}>
				<DialogContent className="sm:max-w-[650px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg text-slate-900">
							<UserPlus className="w-5 h-5 text-[#0517B0]" />
							Tambah Mahasiswa ke Kelas
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Pilih satu atau lebih mahasiswa untuk ditambahkan ke mata kuliah{" "}
							<strong>
								{course.name} ({course.code})
							</strong>
							. Mahasiswa yang dipilih akan otomatis masuk ke daftar presensi
							dan penilaian.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleAddEnrollment} className="space-y-4 pt-2">
						{/* Search Input */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Cari Mahasiswa (Nama, NIM, atau Angkatan)
							</Label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
								<Input
									placeholder="Ketik nama mahasiswa atau NIM..."
									className="pl-9 h-9 text-xs border-slate-200 bg-white"
									value={enrollSearchQuery}
									onChange={(e) => {
										const val = e.target.value;
										setEnrollSearchQuery(val);
										searchCandidates(val);
									}}
								/>
							</div>
						</div>

						{/* Candidate List Box with Select All Header */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-semibold text-slate-700">
									Daftar Mahasiswa ({candidateStudents.length} Ditemukan)
								</Label>
								{candidateStudents.length > 0 && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={toggleSelectAllCandidates}
										className="h-6 px-2 text-[11px] font-bold text-[#0517B0] hover:bg-blue-50"
									>
										{candidateStudents.every((c) =>
											selectedCandidates.some((sc) => sc.id === c.id),
										)
											? "Batalkan Semua"
											: "Pilih Semua Hasil"}
									</Button>
								)}
							</div>
							<div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
								{isSearchingCandidates ? (
									<div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
										<Loader2 className="w-4 h-4 animate-spin text-[#0517B0]" />
										Mencari data mahasiswa...
									</div>
								) : candidateStudents.length === 0 ? (
									<div className="p-6 text-center text-xs text-slate-400">
										{enrollSearchQuery
											? "Tidak ada mahasiswa ditemukan yang cocok."
											: "Ketik kata kunci pencarian untuk menampilkan mahasiswa."}
									</div>
								) : (
									candidateStudents.map((cand) => {
										const isSelected = selectedCandidates.some(
											(c) => c.id === cand.id,
										);
										return (
											<div
												key={cand.id}
												onClick={() => toggleCandidate(cand)}
												className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
													isSelected
														? "bg-blue-50/90 border-l-4 border-[#0517B0]"
														: "hover:bg-white"
												}`}
											>
												<div className="flex items-center gap-2.5">
													<div
														className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
															isSelected
																? "border-[#0517B0] bg-[#0517B0] text-white"
																: "border-slate-300 bg-white"
														}`}
													>
														{isSelected && (
															<Check className="w-3 h-3 stroke-[3]" />
														)}
													</div>
													<div>
														<p className="text-xs font-bold text-slate-900">
															{cand.name}
														</p>
														<p className="text-[11px] text-slate-500 font-mono">
															{cand.nim || "Tanpa NIM"}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Badge
														variant="outline"
														className="text-[10px] font-bold border-slate-200 bg-white text-slate-700"
													>
														Angkatan {cand.cohort}
													</Badge>
													{cand.subProgram && (
														<PeminatanBadge
															subProgram={cand.subProgram}
															size="xs"
														/>
													)}
												</div>
											</div>
										);
									})
								)}
							</div>
						</div>

						{/* Selected Candidates Tags & Clear button */}
						{selectedCandidates.length > 0 && (
							<div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
								<div className="flex items-center justify-between text-xs">
									<span className="font-bold text-blue-900 flex items-center gap-1.5">
										<UserCheck className="w-4 h-4 text-[#0517B0]" />
										{selectedCandidates.length} Mahasiswa Terpilih:
									</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setSelectedCandidates([])}
										className="h-5 px-1.5 text-[11px] text-slate-500 hover:text-red-600"
									>
										Hapus Semua
									</Button>
								</div>
								<div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
									{selectedCandidates.map((cand) => (
										<span
											key={cand.id}
											className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-200 text-blue-900 rounded-md text-[11px] font-medium shadow-2xs"
										>
											{cand.name} (A-{cand.cohort})
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													toggleCandidate(cand);
												}}
												className="text-slate-400 hover:text-red-600 ml-0.5"
											>
												<X className="w-3 h-3" />
											</button>
										</span>
									))}
								</div>
							</div>
						)}

						{/* Notes Input */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Catatan / Keterangan (Opsional)
							</Label>
							<Input
								placeholder="Cth: Mengulang mata kuliah, transfer kredit, dll."
								className="border-slate-200 bg-white h-9 text-xs"
								value={enrollNotes}
								onChange={(e) => setEnrollNotes(e.target.value)}
							/>
						</div>

						{/* Footer Actions */}
						<DialogFooter className="pt-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsAddEnrollOpen(false)}
							>
								Batal
							</Button>
							<Button
								type="submit"
								disabled={selectedCandidates.length === 0 || isSubmittingEnroll}
								className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold"
							>
								{isSubmittingEnroll ? (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								) : (
									<UserPlus className="w-4 h-4 mr-2" />
								)}
								Daftarkan{" "}
								{selectedCandidates.length > 0
									? `${selectedCandidates.length} `
									: ""}
								Mahasiswa
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* AlertDialog: Hapus Mahasiswa dari Mata Kuliah */}
			<AlertDialog
				open={deleteEnrollConfirmOpen}
				onOpenChange={setDeleteEnrollConfirmOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Hapus Mahasiswa dari Mata Kuliah?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus{" "}
							<strong className="text-slate-800 font-bold">
								{enrollToDelete?.student?.name}
							</strong>{" "}
							(Angkatan {enrollToDelete?.student?.cohort}) dari peserta mata
							kuliah <strong>{course.name}</strong>?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeletingEnroll}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteEnrollment}
							disabled={isDeletingEnroll}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{isDeletingEnroll ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : null}
							Ya, Hapus Mahasiswa
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
