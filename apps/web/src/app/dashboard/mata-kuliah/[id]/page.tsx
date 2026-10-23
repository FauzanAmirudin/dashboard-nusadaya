"use client";

import {
	ArrowLeft,
	BookOpen,
	Calendar,
	Camera,
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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	SelfieDetailModal,
	type SelfieRecordDetail,
} from "@/components/panels/kehadiran/SelfieDetailModal";
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
	sks?: number;
	rombel?: string;
	peminatan: string | null;
	cohort: number;
	type: string;
	dosenId?: number;
	dosen: { id: number; fullName: string };
	dosenPendampingId?: number | null;
	dosenPendamping?: { id: number; fullName: string } | null;
};

type MeetingData = {
	id: number;
	meetingNumber: number;
	meetingType: "pkkmb" | "beginning" | "regular" | "uts" | "uas";
	sessionType: "teori" | "praktik" | "keduanya" | null;
	meetingLabel: string;
	description: string | null;
	meetingDate: string | null;
	dosenPengajarId?: number | null;
	attendedDosenIds?: number[] | null;
	isTeamTeachingAttended?: boolean | null;
	teachingStatus?: string | null;
	teachingNotes?: string | null;
	dosenPengajar?: { id: number; fullName: string; username: string } | null;
	activities: any[];
	attendances: {
		id?: number;
		studentId: number;
		status: string | null;
		theoryScore?: number | null;
		practicalScore?: number | null;
		notes: string | null;
		student: { name: string; nim: string };
		selfieUrl?: string | null;
		latitude?: number | null;
		longitude?: number | null;
		gpsAccuracy?: number | null;
		locationName?: string | null;
		distanceFromCheckpoint?: number | null;
		isWithinRadius?: boolean | null;
		selfieTakenAt?: string | null;
		verificationStatus?: string | null;
	}[];
};

type StudentRecord = {
	id: number;
	nim: string;
	name: string;
	cohort?: number;
	rombel?: string | null;
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
		teachingLecturerOption: "utama" as "utama" | "pendamping" | "keduanya",
		teachingStatus: "terlaksana",
		teachingNotes: "",
	});

	// Attendance State: Record<meetingId, Record<studentId, StudentAttendanceInput>>
	const [attendanceData, setAttendanceData] = useState<
		Record<number, Record<number, StudentAttendanceInput>>
	>({});
	const [isSavingAttendance, setIsSavingAttendance] = useState<number | null>(
		null,
	);
	const [isSavingInfo, setIsSavingInfo] = useState<number | null>(null);
	const [selectedSelfieRecord, setSelectedSelfieRecord] =
		useState<SelfieRecordDetail | null>(null);

	// Generate Dates Modal State
	const [isGenerateDatesOpen, setIsGenerateDatesOpen] = useState(false);
	const [generateStartDate, setGenerateStartDate] = useState("");
	const [isGeneratingDates, setIsGeneratingDates] = useState(false);

	// Hitung berapa sesi dari 16 pertemuan yang sudah bertanggal
	const sessionsWithDateCount = useMemo(() => {
		return meetings.filter(
			(m) =>
				m.meetingNumber >= 1 && m.meetingNumber <= 16 && Boolean(m.meetingDate),
		).length;
	}, [meetings]);

	// Pratinjau kalkulasi tanggal untuk dialog
	const previewDates = useMemo(() => {
		if (!generateStartDate) return [];
		const items: { label: string; date: string }[] = [];

		for (let i = 1; i <= 16; i++) {
			const d = new Date(generateStartDate + "T00:00:00Z");
			d.setUTCDate(d.getUTCDate() + (i - 1) * 7);
			const tag = i === 8 ? " (UTS)" : i === 16 ? " (UAS)" : "";
			items.push({
				label: `Pertemuan ${i}${tag}`,
				date: d.toISOString().split("T")[0],
			});
		}
		return items;
	}, [generateStartDate]);

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

	const fetchData = async (isSilent = false) => {
		if (!isSilent) setIsLoading(true);
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
			let meets: any[] = [];
			const { data: mData, error: mErr } =
				await api.courses[courseId].meetings.get();
			if (!mErr && mData?.success) {
				meets = ((mData.data as any[]) || []).filter(
					(m: any) => m.meetingNumber >= 1 && m.meetingNumber <= 16,
				);
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
				setAttendanceData((prev) => ({
					...prev,
					...attState,
				}));
			}

			// 3. Get students in this cohort
			let cohortList: StudentRecord[] = [];
			if (courseInfo?.cohort) {
				const { data: sData, error: sErr } = await api.students.get({
					$query: { cohort: courseInfo.cohort.toString(), all: "true" },
				});
				if (!sErr && sData?.data) {
					cohortList = (sData.data as any[]).map((item) => item.student);
					// Filter students by rombel if course is for a specific rombel
					if (
						courseInfo.rombel &&
						courseInfo.rombel.trim().toLowerCase() !== "gabungan"
					) {
						const targetRombel = courseInfo.rombel.trim().toLowerCase();
						cohortList = cohortList.filter(
							(s) =>
								!s.rombel || s.rombel.trim().toLowerCase() === targetRombel,
						);
					}
					// Filter students by peminatan if course is for a specific peminatan
					if (
						courseInfo.peminatan &&
						courseInfo.peminatan.trim().toLowerCase() !== "umum" &&
						courseInfo.peminatan.trim().toLowerCase() !== "semua"
					) {
						const targetPem = courseInfo.peminatan.trim().toLowerCase();
						cohortList = cohortList.filter(
							(s) =>
								s.subProgram && s.subProgram.trim().toLowerCase() === targetPem,
						);
					}
					cohortList.sort((a, b) => a.name.localeCompare(b.name));
					setCohortStudents(cohortList);
				}
			}

			// 4. Get custom enrollments (peserta tambahan lintas angkatan/rombel)
			let customList: CustomEnrollment[] = [];
			const res = await fetchApi(`/courses/${courseId}/enrollments`);
			if (res.ok) {
				const json = await res.json();
				if (json.success && Array.isArray(json.data)) {
					customList = json.data;
					setEnrollments(customList);
				}
			}

			// 5. Combine students from cohort + custom enrollments + meeting attendees (de-duplicate by studentId)
			const studentMap = new Map<number, StudentRecord>();
			for (const s of cohortList) {
				studentMap.set(s.id, {
					id: s.id,
					nim: s.nim || "-",
					name: s.name,
					cohort: s.cohort,
					rombel: s.rombel,
					program: s.program,
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
						rombel: (e.student as any).rombel || null,
						program: e.student.program,
						subProgram: e.student.subProgram,
						studentStatus: e.student.studentStatus,
					});
				}
			}

			// Daftar peserta kelas murni gabungan sah antara peserta reguler (cohortStudents) dan mahasiswa tambahan (enrollments)
			const combined = Array.from(studentMap.values()).sort((a, b) =>
				a.name.localeCompare(b.name),
			);
			setStudents(combined);
		} catch (err) {
			console.error(err);
		} finally {
			if (!isSilent) setIsLoading(false);
		}
	};

	useEffect(() => {
		if (hasHydrated && user) {
			fetchData();
		}

		// Realtime sync via BroadcastChannel and window events
		let bc: BroadcastChannel | null = null;
		try {
			bc = new BroadcastChannel("dashboard-realtime-sync");
			bc.onmessage = (event) => {
				const data = event.data;
				if (
					data &&
					(data.type === "academic-data-updated" ||
						data.type === "course-attendance-updated" ||
						data.type === "course-enrollment-updated" ||
						data.type === "course-updated")
				) {
					if (
						!data.courseId ||
						data.courseId.toString() === courseId.toString()
					) {
						fetchData(true);
					}
				}
			};
		} catch {}

		const handleRealtimeEvent = (e: any) => {
			const detail = e?.detail;
			if (
				!detail?.courseId ||
				detail.courseId.toString() === courseId.toString()
			) {
				fetchData(true);
			}
		};

		window.addEventListener("academic-data-updated", handleRealtimeEvent);
		window.addEventListener("course-attendance-updated", handleRealtimeEvent);
		window.addEventListener("course-enrollment-updated", handleRealtimeEvent);

		const handleFocus = () => {
			fetchData(true);
		};
		window.addEventListener("focus", handleFocus);

		return () => {
			if (bc) bc.close();
			window.removeEventListener("academic-data-updated", handleRealtimeEvent);
			window.removeEventListener(
				"course-attendance-updated",
				handleRealtimeEvent,
			);
			window.removeEventListener(
				"course-enrollment-updated",
				handleRealtimeEvent,
			);
			window.removeEventListener("focus", handleFocus);
		};
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

	const broadcastAcademicSync = (studentIds?: number[]) => {
		if (typeof window !== "undefined") {
			window.dispatchEvent(
				new CustomEvent("academic-data-updated", {
					detail: { studentIds, courseId },
				}),
			);
			window.dispatchEvent(
				new CustomEvent("course-attendance-updated", {
					detail: { studentIds, courseId },
				}),
			);
			window.dispatchEvent(
				new CustomEvent("course-enrollment-updated", {
					detail: { studentIds, courseId },
				}),
			);
			try {
				const ch = new BroadcastChannel("dashboard-realtime-sync");
				ch.postMessage({ type: "academic-data-updated", studentIds, courseId });
				ch.postMessage({ type: "course-attendance-updated", courseId });
				ch.postMessage({
					type: "course-enrollment-updated",
					studentIds,
					courseId,
				});
				ch.close();
			} catch {}
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
				const candidateIds = selectedCandidates.map((c) => c.id);
				setIsAddEnrollOpen(false);
				setSelectedCandidates([]);
				setEnrollNotes("");
				setEnrollSearchQuery("");
				setCandidateStudents([]);
				fetchData();
				broadcastAcademicSync(candidateIds);
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
		const targetStudentId = enrollToDelete.studentId;
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
				broadcastAcademicSync(targetStudentId ? [targetStudentId] : undefined);
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
			const patchPayload = {
				meetingLabel: meetingForm.label,
				sessionType: meetingForm.sessionType || null,
				meetingDate: meetingForm.date || undefined,
				description: meetingForm.desc,
			};

			const res = await fetchApi(`/courses/${courseId}/meetings/${meetingId}`, {
				method: "PATCH",
				body: JSON.stringify(patchPayload),
			});
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.message || "Gagal menyimpan info pertemuan");
			}

			toast.success("Informasi sesi perkuliahan berhasil disimpan");
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
			toast.error(err.message || "Gagal menyimpan info pertemuan");
		} finally {
			setIsSavingInfo(null);
		}
	};

	// Save Attendances & Scores
	const saveAttendances = async (meetingId: number) => {
		setIsSavingAttendance(meetingId);
		try {
			const targetMeet = meetings.find((m) => m.id === meetingId);
			const isExamMeet =
				targetMeet?.meetingNumber === 8 || targetMeet?.meetingNumber === 16;

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
					practicalScore: isExamMeet
						? null
						: entry?.practicalScore !== undefined &&
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
			broadcastAcademicSync();
		} catch (err) {
			toast.error("Gagal menyimpan presensi");
		} finally {
			setIsSavingAttendance(null);
		}
	};

	const handleGenerateDatesSubmit = async () => {
		if (!generateStartDate) {
			toast.error("Silakan tentukan tanggal sesi pertama perkuliahan");
			return;
		}
		setIsGeneratingDates(true);
		try {
			const res = await fetchApi(
				`/courses/${courseId}/meetings/generate-dates`,
				{
					method: "POST",
					body: JSON.stringify({
						startDate: generateStartDate,
					}),
				},
			);
			const result = await res.json();
			if (res.ok && result.success) {
				toast.success(
					result.message || "Tanggal 16 sesi perkuliahan berhasil digenerate!",
				);
				setIsGenerateDatesOpen(false);
				await fetchData();
			} else {
				toast.error(
					result.message || "Gagal generate tanggal sesi perkuliahan",
				);
			}
		} catch {
			toast.error("Terjadi kesalahan saat memproses tanggal sesi");
		} finally {
			setIsGeneratingDates(false);
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

			const isUts = m.meetingNumber === 8;
			const isUas = m.meetingNumber === 16;
			const isExam = isUts || isUas;

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
						...(isExam
							? {
									[isUts ? "Nilai UTS" : "Nilai UAS"]:
										att?.theoryScore !== null && att?.theoryScore !== undefined
											? att.theoryScore
											: "-",
								}
							: {
									"Nilai Teori":
										att?.theoryScore !== null && att?.theoryScore !== undefined
											? att.theoryScore
											: "-",
									"Nilai Praktik":
										att?.practicalScore !== null &&
										att?.practicalScore !== undefined
											? att.practicalScore
											: "-",
								}),
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
							<Badge
								variant="outline"
								className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold"
							>
								{course.sks || 2} SKS
							</Badge>
							<Badge
								variant="outline"
								className="bg-purple-50 text-purple-700 border-purple-200 font-semibold"
							>
								{course.rombel || "Kelas A"}
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
						<p className="text-sm text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
							<span>Dosen Pengampu:</span>
							<span className="font-semibold text-slate-700">
								{course.dosen.fullName}
							</span>
							{course.dosenPendamping && (
								<>
									<span className="text-slate-400">•</span>
									<span>Dosen Pendamping:</span>
									<span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60 text-xs">
										+ {course.dosenPendamping.fullName}
									</span>
								</>
							)}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						onClick={() => setIsGenerateDatesOpen(true)}
						className="border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 shadow-sm"
					>
						<Calendar className="mr-2 h-4 w-4 text-blue-600" />
						Generate Tanggal Sesi
					</Button>
					<Button
						variant="outline"
						onClick={handleExportDetail}
						className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
					>
						<Download className="mr-2 h-4 w-4 text-blue-600" /> Export Rekap &
						Nilai
					</Button>
				</div>
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
							Jadwal Sesi 1–16
						</p>
						<p className="text-xl font-bold text-slate-800">
							{sessionsWithDateCount} / 16 Sesi
						</p>
						<span
							className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
								sessionsWithDateCount === 16
									? "bg-emerald-50 text-emerald-700"
									: sessionsWithDateCount > 0
										? "bg-amber-50 text-amber-700"
										: "bg-slate-100 text-slate-500"
							}`}
						>
							{sessionsWithDateCount === 16
								? "Lengkap Bertanggal"
								: `${16 - sessionsWithDateCount} sesi belum diatur`}
						</span>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(val) => {
					setActiveTab(val);
					if (val === "jadwal" || val === "peserta") {
						fetchData(true);
					}
				}}
				className="w-full"
			>
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
									Pertemuan 1–16 • UTS (P8) • UAS (P16)
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="p-4">
							<Accordion type="single" collapsible className="w-full space-y-3">
								{meetings.map((meet) => {
									const isEditingInfo = editingMeeting === meet.id;
									const isUts = meet.meetingNumber === 8;
									const isUas = meet.meetingNumber === 16;
									const isExam = isUts || isUas;

									// Only count 'hadir' / 'mengikuti ujian' for students currently enrolled in the course
									const presentCount = students.filter((s) => {
										const st = attendanceData[meet.id]?.[s.id]?.status;
										return st === "hadir" || st === "susulan";
									}).length;

									const examScoreCount = students.filter((s) => {
										const att = attendanceData[meet.id]?.[s.id];
										return (
											att?.theoryScore !== undefined &&
											att?.theoryScore !== null &&
											att?.theoryScore !== ""
										);
									}).length;

									return (
										<AccordionItem
											value={`meet-${meet.id}`}
											key={meet.id}
											className={`rounded-xl px-4 py-1.5 transition-all ${
												isUts
													? "border-2 border-amber-300 bg-amber-50/20 data-[state=open]:border-amber-500 data-[state=open]:shadow-md"
													: isUas
														? "border-2 border-rose-300 bg-rose-50/20 data-[state=open]:border-rose-500 data-[state=open]:shadow-md"
														: "border border-slate-200 bg-white data-[state=open]:border-blue-300 data-[state=open]:shadow-md"
											}`}
										>
											<AccordionTrigger className="hover:no-underline py-2.5">
												<div className="flex items-center gap-3 w-full justify-between pr-4">
													<div className="text-left">
														<div className="flex items-center gap-2 flex-wrap">
															<p
																className={`font-bold text-base ${
																	isUts
																		? "text-amber-950 font-extrabold"
																		: isUas
																			? "text-rose-950 font-extrabold"
																			: "text-slate-800"
																}`}
															>
																{meet.meetingLabel}
															</p>
															{isUts ? (
																<Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold px-2.5 py-0.5 text-xs shadow-2xs">
																	<GraduationCap className="w-3.5 h-3.5 mr-1 inline" />
																	UJIAN TENGAH SEMESTER (UTS)
																</Badge>
															) : isUas ? (
																<Badge className="bg-rose-100 text-rose-900 border-rose-300 font-bold px-2.5 py-0.5 text-xs shadow-2xs">
																	<GraduationCap className="w-3.5 h-3.5 mr-1 inline" />
																	UJIAN AKHIR SEMESTER (UAS)
																</Badge>
															) : (
																getSessionTypeBadge(meet.sessionType)
															)}

															{/* Indikator Dosen Pengajar / Team Teaching (DSN-01) */}
															{meet.isTeamTeachingAttended ? (
																<Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold px-2 py-0.5 text-xs shadow-2xs">
																	<Users className="w-3 h-3 mr-1 inline" /> Team
																	Teaching
																</Badge>
															) : course?.dosenPendampingId &&
																meet.dosenPengajarId ===
																	course.dosenPendampingId ? (
																<Badge className="bg-sky-100 text-sky-800 border-sky-300 font-medium px-2 py-0.5 text-xs">
																	<UserCheck className="w-3 h-3 mr-1 inline" />{" "}
																	{course.dosenPendamping?.fullName?.split(
																		" ",
																	)[0] || "Dosen Pendamping"}
																</Badge>
															) : course?.dosenPendampingId &&
																meet.dosenPengajarId === course.dosenId ? (
																<Badge className="bg-slate-100 text-slate-700 border-slate-200 font-medium px-2 py-0.5 text-xs">
																	<UserCheck className="w-3 h-3 mr-1 inline" />{" "}
																	{course.dosen?.fullName?.split(" ")[0] ||
																		"Dosen Utama"}
																</Badge>
															) : null}
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
														{isExam ? (
															<Badge
																variant="secondary"
																className={`font-semibold text-xs px-2.5 py-1 ${
																	examScoreCount === students.length &&
																	students.length > 0
																		? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
																		: examScoreCount > 0
																			? "bg-amber-50 text-amber-800 border border-amber-300 font-bold"
																			: "bg-slate-100 text-slate-600"
																}`}
															>
																{examScoreCount} / {students.length} Nilai
																Terisi
															</Badge>
														) : (
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
														)}
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
																		teachingLecturerOption: "utama",
																		teachingStatus: "terlaksana",
																		teachingNotes: "",
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
																	(Silabus)
																</Label>
																<Input
																	className="border-slate-300 bg-white h-9 text-sm"
																	placeholder="Topik materi kuliah, capaian pembelajaran, atau silabus..."
																	value={meetingForm.desc}
																	onChange={(e) =>
																		setMeetingForm({
																			...meetingForm,
																			desc: e.target.value,
																		})
																	}
																/>
															</div>

															<div className="sm:col-span-3 bg-purple-50/70 border border-purple-200/80 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
																<div className="flex items-center gap-2 text-purple-900 font-medium">
																	<UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
																	<span>
																		Absensi mengajar dosen & jurnal perkuliahan
																		dipusatkan di menu{" "}
																		<strong>
																			{user?.role === "dosen"
																				? "Presensi"
																				: "Absensi Dosen"}
																		</strong>
																		.
																	</span>
																</div>
																<Link
																	href={
																		user?.role === "dosen"
																			? "/dashboard/mata-kuliah/rekap-dosen"
																			: "/dashboard/akademik/absensi-dosen"
																	}
																	className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 shrink-0 underline"
																>
																	{user?.role === "dosen"
																		? "Buka Presensi Mengajar →"
																		: "Monitoring Absensi Dosen →"}
																</Link>
															</div>
														</div>
													) : (
														<div className="space-y-2">
															<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
																<div className="flex items-center gap-2">
																	<span className="font-semibold text-slate-700">
																		Topik Silabus:
																	</span>
																	<span className="italic text-slate-600">
																		{meet.description ||
																			"Belum ada rincian materi silabus untuk sesi ini."}
																	</span>
																</div>
																<Link
																	href={
																		user?.role === "dosen"
																			? "/dashboard/mata-kuliah/rekap-dosen"
																			: "/dashboard/akademik/absensi-dosen"
																	}
																	className="text-[11px] text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded border border-purple-200/70 transition-colors"
																>
																	<UserCheck className="w-3.5 h-3.5 text-purple-600" />
																	<span>
																		Status Mengajar:{" "}
																		<strong className="capitalize">
																			{meet.isTeamTeachingAttended
																				? "Team Teaching"
																				: meet.teachingStatus || "Belum Diisi"}
																		</strong>
																	</span>
																	<span className="underline font-bold ml-1">
																		{user?.role === "dosen"
																			? "Buka Presensi →"
																			: "Monitoring →"}
																	</span>
																</Link>
															</div>
														</div>
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
																{isUts
																	? "Fokus input Nilai Ujian Tengah Semester (0-100)"
																	: isUas
																		? "Fokus input Nilai Ujian Akhir Semester (0-100)"
																		: meet.sessionType === "praktik"
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

													{isExam && (
														<div
															className={`p-3.5 rounded-xl border flex items-start gap-3 ${
																isUts
																	? "bg-amber-50/80 border-amber-200 text-amber-900"
																	: "bg-rose-50/80 border-rose-200 text-rose-900"
															}`}
														>
															<GraduationCap
																className={`w-5 h-5 shrink-0 mt-0.5 ${
																	isUts ? "text-amber-700" : "text-rose-700"
																}`}
															/>
															<div className="text-xs">
																<p className="font-bold text-sm">
																	{isUts
																		? "Sesi Evaluasi Ujian Tengah Semester (UTS)"
																		: "Sesi Evaluasi Ujian Akhir Semester (UAS)"}
																</p>
																<p className="mt-0.5 opacity-90">
																	Sesi ini merupakan agenda evaluasi formal
																	perkuliahan. Input nilai ujian mahasiswa
																	(0–100) dan verifikasi status kehadiran ujian.
																	Mahasiswa yang berhalangan dapat ditandai
																	dengan status <strong>Ujian Susulan</strong>.
																</p>
															</div>
														</div>
													)}

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
																		<TableHead className="w-44 text-xs font-bold text-slate-700">
																			{isExam ? "Kehadiran Ujian" : "Kehadiran"}
																		</TableHead>
																		<TableHead className="w-36 text-center text-xs font-bold text-slate-700">
																			Bukti Kehadiran
																		</TableHead>
																		{isExam ? (
																			<TableHead className="w-32 text-xs font-bold text-slate-700">
																				{isUts ? "Nilai UTS" : "Nilai UAS"}
																			</TableHead>
																		) : (
																			<>
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
																			</>
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
																						{enrollments.some(
																							(e) => e.studentId === s.id,
																						) ? (
																							<Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-1.5 py-0 font-semibold">
																								Peserta Tambahan
																								{s.cohort &&
																								s.cohort !== course.cohort
																									? ` • Angkatan ${s.cohort}`
																									: ""}
																							</Badge>
																						) : s.cohort &&
																							s.cohort !== course.cohort ? (
																							<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-medium">
																								Angkatan {s.cohort}
																							</Badge>
																						) : null}
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
																											"susulan"
																										? "border-amber-300 bg-amber-50/70 text-amber-800 font-bold"
																										: currentEntry.status ===
																												"izin"
																											? "border-blue-300 bg-blue-50/70 text-blue-800 font-bold"
																											: currentEntry.status ===
																													"sakit"
																												? "border-purple-300 bg-purple-50/70 text-purple-800 font-bold"
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
																							{isExam ? (
																								<>
																									<SelectItem
																										value="hadir"
																										className="text-emerald-700 font-bold text-xs"
																									>
																										✓ Mengikuti Ujian
																									</SelectItem>
																									<SelectItem
																										value="susulan"
																										className="text-amber-700 font-bold text-xs"
																									>
																										⏳ Ujian Susulan
																									</SelectItem>
																									<SelectItem
																										value="izin"
																										className="text-blue-700 font-bold text-xs"
																									>
																										ℹ Izin
																									</SelectItem>
																									<SelectItem
																										value="sakit"
																										className="text-purple-700 font-bold text-xs"
																									>
																										✚ Sakit
																									</SelectItem>
																									<SelectItem
																										value="alpha"
																										className="text-red-700 font-bold text-xs"
																									>
																										✕ Tidak Hadir
																									</SelectItem>
																								</>
																							) : (
																								<>
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
																								</>
																							)}
																						</SelectContent>
																					</Select>
																				</TableCell>

																				{/* Kolom Bukti Kehadiran (Selfie GPS) */}
																				<TableCell className="text-center">
																					{(() => {
																						const att = (
																							meet.attendances || []
																						).find(
																							(a: any) => a.studentId === s.id,
																						);
																						if (!att?.selfieUrl) {
																							return (
																								<span className="text-[11px] text-slate-400 italic">
																									Tanpa Bukti
																								</span>
																							);
																						}
																						return (
																							<Button
																								type="button"
																								variant="outline"
																								size="sm"
																								onClick={() =>
																									setSelectedSelfieRecord({
																										id: att.id || 0,
																										attendanceType: "kuliah",
																										title: `${course.name} - ${meet.meetingLabel}`,
																										student: {
																											id: s.id,
																											name: s.name,
																											nim: s.nim,
																											cohort: s.cohort,
																										},
																										status:
																											currentEntry.status ||
																											att.status ||
																											"hadir",
																										selfieUrl:
																											att.selfieUrl ||
																											undefined,
																										latitude:
																											att.latitude || undefined,
																										longitude:
																											att.longitude ||
																											undefined,
																										gpsAccuracy:
																											att.gpsAccuracy ||
																											undefined,
																										locationName:
																											att.locationName ||
																											undefined,
																										distanceFromCheckpoint:
																											att.distanceFromCheckpoint ||
																											undefined,
																										isWithinRadius:
																											att.isWithinRadius ??
																											true,
																										selfieTakenAt:
																											att.selfieTakenAt ||
																											undefined,
																										verificationStatus:
																											att.verificationStatus ||
																											"auto_approved",
																									})
																								}
																								className="h-7 px-2.5 text-xs text-blue-700 border-blue-200 bg-blue-50/70 hover:bg-blue-100 font-semibold gap-1.5 rounded-lg shadow-2xs inline-flex items-center cursor-pointer"
																								title="Lihat foto selfie & peta lokasi GPS mahasiswa"
																							>
																								<Camera className="w-3.5 h-3.5 text-blue-600" />
																								<span>Lihat Bukti</span>
																							</Button>
																						);
																					})()}
																				</TableCell>

																				{isExam ? (
																					<TableCell>
																						<Input
																							type="number"
																							min={0}
																							max={100}
																							placeholder="0 - 100"
																							className={`border-slate-300 bg-white h-8 text-xs w-28 font-mono font-bold ${
																								isUts
																									? "text-amber-800 focus:border-amber-500"
																									: "text-rose-800 focus:border-rose-500"
																							}`}
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
																												practicalScore: "",
																											},
																										},
																									};
																								});
																							}}
																						/>
																					</TableCell>
																				) : (
																					<>
																						{(!meet.sessionType ||
																							meet.sessionType === "teori" ||
																							meet.sessionType ===
																								"keduanya") && (
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
																										setAttendanceData(
																											(prev) => {
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
																											},
																										);
																									}}
																								/>
																							</TableCell>
																						)}

																						{(!meet.sessionType ||
																							meet.sessionType === "praktik" ||
																							meet.sessionType ===
																								"keduanya") && (
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
																										setAttendanceData(
																											(prev) => {
																												const meetMap =
																													prev[meet.id] || {};
																												return {
																													...prev,
																													[meet.id]: {
																														...meetMap,
																														[s.id]: {
																															...currentEntry,
																															practicalScore:
																																val,
																														},
																													},
																												};
																											},
																										);
																									}}
																								/>
																							</TableCell>
																						)}
																					</>
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
							Mata kuliah: {course.name} ({course.code})
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

			{/* Dialog Modal: Generate Tanggal Perkuliahan Otomatis */}
			<Dialog open={isGenerateDatesOpen} onOpenChange={setIsGenerateDatesOpen}>
				<DialogContent className="max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<Calendar className="w-5 h-5 text-blue-600" />
							Generate Tanggal Perkuliahan Otomatis
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
							<p>
								<strong>Mata Kuliah:</strong> {course.name} ({course.code})
							</p>
							<p>
								<strong>Angkatan / Rombel:</strong> Angkatan {course.cohort} •{" "}
								{course.rombel || "Kelas A"}
							</p>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Tanggal Pertemuan Pertama (Sesi 1){" "}
								<span className="text-red-500">*</span>
							</Label>
							<Input
								type="date"
								value={generateStartDate}
								onChange={(e) => setGenerateStartDate(e.target.value)}
								className="h-9 text-xs rounded-xl border-slate-300"
							/>
							<p className="text-[11px] text-slate-500">
								Pilih tanggal perkuliahan pertama dimulai pada kalender
								akademik.
							</p>
						</div>

						{generateStartDate && (
							<div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-xs space-y-2">
								<p className="font-semibold text-slate-700 flex items-center justify-between">
									<span>Pratinjau Jadwal Perkuliahan:</span>
									<span className="text-[10px] text-blue-600 font-mono font-normal">
										16 Pertemuan
									</span>
								</p>
								<div className="max-h-44 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
									{previewDates.map((p, i) => (
										<div
											key={i}
											className={`flex justify-between py-1 px-1.5 rounded border-b border-slate-100 last:border-none ${
												p.label.includes("UTS")
													? "bg-amber-100/60 font-bold text-amber-900"
													: p.label.includes("UAS")
														? "bg-rose-100/60 font-bold text-rose-900"
														: ""
											}`}
										>
											<span className="text-slate-600">{p.label}:</span>
											<span className="font-semibold text-slate-800">
												{p.date}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<DialogFooter className="gap-2 pt-2 border-t border-slate-100">
						<Button
							variant="outline"
							onClick={() => setIsGenerateDatesOpen(false)}
							disabled={isGeneratingDates}
							className="rounded-xl text-xs"
						>
							Batal
						</Button>
						<Button
							onClick={handleGenerateDatesSubmit}
							disabled={isGeneratingDates || !generateStartDate}
							className="bg-[#0517B0] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold"
						>
							{isGeneratingDates && (
								<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
							)}
							Terapkan Tanggal Sesi
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal Detail & Verifikasi Foto Selfie GPS Mahasiswa */}
			{selectedSelfieRecord && (
				<SelfieDetailModal
					record={selectedSelfieRecord}
					onClose={() => setSelectedSelfieRecord(null)}
					onVerifySuccess={() => {
						fetchData();
					}}
				/>
			)}
		</div>
	);
}
