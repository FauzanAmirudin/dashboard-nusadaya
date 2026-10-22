"use client";

import {
	ArrowLeft,
	BookOpen,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	FileText,
	GraduationCap,
	Layers,
	Loader2,
	RefreshCw,
	Search,
	Settings,
	Sparkles,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, api, getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { useAuthStore } from "@/store";

type CourseDetail = {
	id: number;
	code: string;
	name: string;
	rombel?: string | null;
	peminatan: string | null;
	cohort: number;
	type: "teori" | "praktik";
	dosenId: number;
	dosen: { id: number; fullName: string };
};

type MeetingItem = {
	id: number;
	meetingNumber: number;
	meetingType: "pkkmb" | "beginning" | "regular" | "uts" | "uas";
	sessionType: "teori" | "praktik" | "keduanya" | null;
	meetingLabel: string;
	description: string | null;
	meetingDate: string | null;
	attendances: {
		studentId: number;
		status: string | null;
		theoryScore?: number | null;
		practicalScore?: number | null;
		notes: string | null;
	}[];
};

type StudentItem = {
	id: number;
	nim: string;
	name: string;
	peminatan?: string | null;
	rombel?: string | null;
	cohort?: number;
};

export default function RekapMataKuliahDetailPage() {
	const params = useParams();
	const router = useRouter();
	const courseId = params.id as string;
	const { user, hasHydrated } = useAuthStore();

	const [course, setCourse] = useState<CourseDetail | null>(null);
	const [meetings, setMeetings] = useState<MeetingItem[]>([]);
	const [students, setStudents] = useState<StudentItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Horizontal Table Scroll Container Ref
	const matrixTableContainerRef = useRef<HTMLDivElement>(null);

	// Filter
	const [searchQuery, setSearchQuery] = useState("");

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

	const scrollToPosition = (pos: number) => {
		if (matrixTableContainerRef.current) {
			matrixTableContainerRef.current.scrollTo({
				left: pos,
				behavior: "smooth",
			});
		}
	};

	const fetchData = async (silent = false) => {
		if (!silent) setIsLoading(true);
		try {
			// 1. Get course info
			const { data: cData, error: cErr } = await api.courses[courseId].get();
			if (cErr) {
				toast.error("Gagal memuat mata kuliah");
				if ((cErr as any).status === 403) {
					router.push("/dashboard/mata-kuliah/rekap");
				}
				return;
			}
			const courseInfo = cData?.data as any;
			setCourse(courseInfo);

			// 2. Get meetings with attendances strictly 1..16
			const { data: mData, error: mErr } =
				await api.courses[courseId].meetings.get();
			if (!mErr && mData?.success) {
				const meets = ((mData.data as any[]) || []).filter(
					(m: any) => m.meetingNumber >= 1 && m.meetingNumber <= 16,
				);
				meets.sort((a, b) => (a.meetingNumber ?? 0) - (b.meetingNumber ?? 0));
				setMeetings(meets);
			}

			// 3. Get students with full integration: Cohort (with rombel filter) + Custom Enrollments
			let cohortList: StudentItem[] = [];
			if (courseInfo?.cohort) {
				const { data: sData, error: sErr } = await api.students.get({
					$query: {
						cohort: courseInfo.cohort.toString(),
						all: "true",
					},
				});
				if (!sErr && sData?.data) {
					cohortList = (sData.data as any[]).map((item) => item.student);
					// Filter students by rombel if course has a specific rombel
					if (
						courseInfo.rombel &&
						courseInfo.rombel.trim().toLowerCase() !== "gabungan" &&
						courseInfo.rombel.trim().toLowerCase() !== "semua"
					) {
						const targetRombel = courseInfo.rombel.trim().toLowerCase();
						cohortList = cohortList.filter(
							(s) =>
								!s.rombel || s.rombel.trim().toLowerCase() === targetRombel,
						);
					}
				}
			}

			// 4. Get custom enrollments (lintas angkatan/rombel)
			let customList: any[] = [];
			try {
				const res = await fetchApi(`/courses/${courseId}/enrollments`);
				if (res.ok) {
					const json = await res.json();
					if (json.success && Array.isArray(json.data)) {
						customList = json.data;
					}
				}
			} catch (e) {
				console.error("Gagal memuat enrollments:", e);
			}

			// 5. Combine and de-duplicate students
			const studentMap = new Map<number, StudentItem>();
			for (const s of cohortList) {
				studentMap.set(s.id, {
					id: s.id,
					nim: s.nim || "-",
					name: s.name,
					peminatan: (s as any).subProgram || s.peminatan || null,
					rombel: s.rombel || null,
					cohort: s.cohort,
				});
			}
			for (const e of customList) {
				if (e.student) {
					studentMap.set(e.student.id, {
						id: e.student.id,
						nim: e.student.nim || "-",
						name: e.student.name,
						peminatan: e.student.subProgram || e.student.peminatan || null,
						rombel: e.student.rombel || null,
						cohort: e.student.cohort,
					});
				}
			}

			const combinedStudents = Array.from(studentMap.values()).sort((a, b) =>
				a.name.localeCompare(b.name),
			);
			setStudents(combinedStudents);

			// Reset scroll to Pertemuan 1 on load
			setTimeout(() => {
				scrollToPosition(0);
			}, 100);
		} catch (err) {
			console.error(err);
			toast.error("Terjadi kesalahan saat memuat data rekap perkuliahan");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (hasHydrated && user && courseId) {
			fetchData();
		}
	}, [hasHydrated, user, courseId]);

	// Realtime cross-panel synchronization listener
	useEffect(() => {
		const handleSync = (e: any) => {
			if (
				!e.detail?.courseId ||
				String(e.detail.courseId) === String(courseId)
			) {
				fetchData(true);
			}
		};
		window.addEventListener("academic-data-updated", handleSync);

		let channel: BroadcastChannel | null = null;
		try {
			channel = new BroadcastChannel("dashboard-realtime-sync");
			channel.onmessage = (event) => {
				if (
					event.data?.type === "academic-data-updated" &&
					(!event.data.courseId ||
						String(event.data.courseId) === String(courseId))
				) {
					fetchData(true);
				}
			};
		} catch {}

		return () => {
			window.removeEventListener("academic-data-updated", handleSync);
			if (channel) channel.close();
		};
	}, [courseId]);

	// Process calculations strictly aligned with AKD-06 GradeCalculationService
	const studentRecaps = useMemo(() => {
		if (!course || students.length === 0) return [];

		return students.map((student) => {
			let presentCount = 0;
			let permitCount = 0;
			let sickCount = 0;
			let alphaCount = 0;
			let unassignedCount = 0;

			const regularTheoryScores: number[] = [];
			const regularPracticalScores: number[] = [];

			const meetingResults: Record<
				number,
				{
					status: string | null;
					theoryScore: number | null;
					practicalScore: number | null;
					notes: string | null;
				}
			> = {};

			let utsScore = 0;
			let uasScore = 0;

			meetings.forEach((m) => {
				const att = m.attendances?.find((a) => a.studentId === student.id);
				const status = att?.status || null;
				const theoryScore =
					att?.theoryScore !== null && att?.theoryScore !== undefined
						? att.theoryScore
						: null;
				const practicalScore =
					att?.practicalScore !== null && att?.practicalScore !== undefined
						? att.practicalScore
						: null;

				meetingResults[m.id] = {
					status,
					theoryScore,
					practicalScore,
					notes: att?.notes || null,
				};

				if (status === "hadir") presentCount++;
				else if (status === "izin") permitCount++;
				else if (status === "sakit") sickCount++;
				else if (status === "alpha") alphaCount++;
				else unassignedCount++;

				const isUts = m.meetingNumber === 8 || m.meetingType === "uts";
				const isUas = m.meetingNumber === 16 || m.meetingType === "uas";

				if (isUts) {
					utsScore =
						practicalScore ?? theoryScore ?? (status === "hadir" ? 75 : 0);
				} else if (isUas) {
					uasScore =
						practicalScore ?? theoryScore ?? (status === "hadir" ? 75 : 0);
				} else {
					if (theoryScore !== null) regularTheoryScores.push(theoryScore);
					if (practicalScore !== null)
						regularPracticalScores.push(practicalScore);
				}
			});

			const totalMeetings = 16;
			const attendanceRate = Math.min(
				100,
				Math.round((presentCount / totalMeetings) * 100),
			);

			const avgTheory =
				regularTheoryScores.length > 0
					? Math.round(
							regularTheoryScores.reduce((acc, curr) => acc + curr, 0) /
								regularTheoryScores.length,
						)
					: 0;

			const avgPractical =
				regularPracticalScores.length > 0
					? Math.round(
							regularPracticalScores.reduce((acc, curr) => acc + curr, 0) /
								regularPracticalScores.length,
						)
					: 0;

			const effectiveUts =
				utsScore > 0 ? utsScore : Math.max(avgTheory, avgPractical, 70);
			const effectiveUas =
				uasScore > 0 ? uasScore : Math.max(avgTheory, avgPractical, 70);
			const effectiveTheory =
				avgTheory > 0
					? avgTheory
					: course.type === "praktik"
						? avgPractical
						: 70;
			const effectivePractical = avgPractical > 0 ? avgPractical : avgTheory;

			// Standar Pembobotan Vokasi Nusadaya (AKD-06):
			// - Praktik: Presensi 10% + Teori 20% + Praktik 40% + UTS 15% + UAS 15%
			// - Teori:   Presensi 15% + Teori/Tugas 25% + UTS 30% + UAS 30%
			let finalScore = 0;
			if (course.type === "praktik") {
				finalScore = Math.round(
					attendanceRate * 0.1 +
						effectiveTheory * 0.2 +
						effectivePractical * 0.4 +
						effectiveUts * 0.15 +
						effectiveUas * 0.15,
				);
			} else {
				finalScore = Math.round(
					attendanceRate * 0.15 +
						effectiveTheory * 0.25 +
						effectiveUts * 0.3 +
						effectiveUas * 0.3,
				);
			}

			let grade = "E";
			if (finalScore >= 85) grade = "A";
			else if (finalScore >= 75) grade = "B";
			else if (finalScore >= 65) grade = "C";
			else if (finalScore >= 50) grade = "D";

			const status =
				attendanceRate >= 90
					? "AMAN"
					: attendanceRate >= 75
						? "PERLU_PERHATIAN"
						: "KURANG";

			let statusKelulusan = "LULUS";
			if (attendanceRate < 75) {
				statusKelulusan = "TIDAK MEMENUHI PRESENSI";
			} else if (grade === "A") {
				statusKelulusan = "LULUS MEMUASKAN";
			} else if (grade === "D" || grade === "E") {
				statusKelulusan = "REMEDIAL / TIDAK LULUS";
			}

			return {
				student,
				presentCount,
				permitCount,
				sickCount,
				alphaCount,
				unassignedCount,
				totalMeetings,
				attendanceRate,
				avgTheory,
				avgPractical,
				finalScore,
				grade,
				status,
				statusKelulusan,
				meetingResults,
			};
		});
	}, [course, students, meetings]);

	// Filtered list
	const filteredRecaps = useMemo(() => {
		return studentRecaps.filter((item) => {
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				const matchName = item.student.name.toLowerCase().includes(q);
				const matchNim = item.student.nim.toLowerCase().includes(q);
				if (!matchName && !matchNim) return false;
			}
			return true;
		});
	}, [studentRecaps, searchQuery]);

	// Export Handlers
	const handleExportMatrix = () => {
		if (filteredRecaps.length === 0 || !course) return;

		const exportRows = filteredRecaps.map((item, idx) => {
			const row: Record<string, any> = {
				No: idx + 1,
				NIM: item.student.nim,
				"Nama Mahasiswa": item.student.name,
				Peminatan: item.student.peminatan || "-",
			};

			meetings.forEach((m) => {
				const mRes = item.meetingResults[m.id];
				const label =
					m.meetingNumber === 8
						? "UTS (P8)"
						: m.meetingNumber === 16
							? "UAS (P16)"
							: `P${m.meetingNumber}`;

				const statusText = mRes?.status ? mRes.status.toUpperCase() : "-";
				const tScore = mRes?.theoryScore !== null ? mRes?.theoryScore : "-";
				const pScore =
					mRes?.practicalScore !== null ? mRes?.practicalScore : "-";

				const isExam = m.meetingNumber === 8 || m.meetingNumber === 16;

				row[`${label} (Presensi)`] = statusText;
				if (isExam) {
					row[`${label} (Nilai Ujian)`] = tScore;
				} else {
					if (m.sessionType === "teori" || m.sessionType === "keduanya") {
						row[`${label} (Teori)`] = tScore;
					}
					if (m.sessionType === "praktik" || m.sessionType === "keduanya") {
						row[`${label} (Praktik)`] = pScore;
					}
				}
			});

			row["Total Hadir"] = `${item.presentCount}/${item.totalMeetings}`;
			row["Kehadiran (%)"] = `${item.attendanceRate}%`;
			row["Rata-rata Teori"] = item.avgTheory;
			row["Rata-rata Praktik"] = item.avgPractical;
			row["Nilai Akhir"] = item.finalScore;
			row.Grade = item.grade;
			row["Status Evaluasi"] = item.status;
			row["Status Kelulusan"] = item.statusKelulusan;

			return row;
		});

		exportToCSV(
			exportRows,
			`Rekap_Matriks_${course.code}_${course.name.replace(/\s+/g, "_")}`,
		);
	};

	const handleExportTranscript = () => {
		if (filteredRecaps.length === 0 || !course) return;

		const exportRows = filteredRecaps.map((item, idx) => ({
			No: idx + 1,
			NIM: item.student.nim,
			"Nama Mahasiswa": item.student.name,
			Angkatan: course.cohort,
			Peminatan: item.student.peminatan || "-",
			"Kehadiran (Hadir/Total)": `${item.presentCount}/${item.totalMeetings}`,
			"Persentase Kehadiran": `${item.attendanceRate}%`,
			"Rata-rata Teori (20%)": item.avgTheory,
			"Rata-rata Praktik (80%)": item.avgPractical,
			"Nilai Akhir": item.finalScore,
			"Grade / Indeks": item.grade,
			"Status Hasil Belajar": item.statusKelulusan,
		}));

		exportToCSV(
			exportRows,
			`Transkrip_Nilai_${course.code}_${course.name.replace(/\s+/g, "_")}`,
		);
	};

	const handleExportAttendance = () => {
		if (filteredRecaps.length === 0 || !course) return;

		const exportRows = filteredRecaps.map((item, idx) => ({
			No: idx + 1,
			NIM: item.student.nim,
			"Nama Mahasiswa": item.student.name,
			"Hadir (H)": item.presentCount,
			"Izin (I)": item.permitCount,
			"Sakit (S)": item.sickCount,
			"Alpha (A)": item.alphaCount,
			"Belum Diisi (-)": item.unassignedCount,
			"Total Sesi": item.totalMeetings,
			"Tingkat Kehadiran": `${item.attendanceRate}%`,
			"Status Evaluasi": item.status,
		}));

		exportToCSV(
			exportRows,
			`Rekap_Absensi_${course.code}_${course.name.replace(/\s+/g, "_")}`,
		);
	};

	if (!hasHydrated || isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
				<Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
				<p className="text-sm text-slate-500 font-medium">
					Memuat rincian rekapitulasi perkuliahan...
				</p>
			</div>
		);
	}

	if (!course) {
		return (
			<div className="p-8 text-center text-red-500 font-medium">
				Mata kuliah tidak ditemukan.
			</div>
		);
	}

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="icon"
						onClick={() => router.push("/dashboard/mata-kuliah/rekap")}
						className="h-10 w-10 border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0"
						title="Kembali ke Daftar Rekap"
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<div className="flex items-center gap-2 flex-wrap">
							<h1 className="text-2xl font-bold text-slate-900">
								{course.name}
							</h1>
							<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono font-bold">
								{course.code}
							</Badge>
							<Badge
								variant="secondary"
								className="bg-slate-100 text-slate-700"
							>
								Angkatan {course.cohort}
							</Badge>
							<Badge
								className={
									course.type === "praktik"
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: "bg-blue-50 text-blue-700 border-blue-200"
								}
							>
								{course.type.toUpperCase()}
							</Badge>
							{course.peminatan && (
								<Badge
									variant="outline"
									className="border-purple-200 bg-purple-50 text-purple-700"
								>
									{course.peminatan}
								</Badge>
							)}
						</div>
						<p className="text-sm text-slate-500 mt-1">
							Dosen Pengampu:{" "}
							<span className="font-semibold text-slate-700">
								{course.dosen.fullName}
							</span>{" "}
							• Total Sesi:{" "}
							<span className="font-semibold text-slate-700">
								{meetings.length} Pertemuan
							</span>
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
					<Button
						variant="outline"
						onClick={handleExportMatrix}
						disabled={filteredRecaps.length === 0}
						className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9"
					>
						<Download className="mr-2 h-4 w-4 text-emerald-600" /> Export Excel
					</Button>
					<Link href={`/dashboard/mata-kuliah/${course.id}`}>
						<Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 shadow-xs">
							<Settings className="mr-2 h-4 w-4" /> Kelola Sesi & Input Nilai
						</Button>
					</Link>
				</div>
			</div>

			{/* Filter Bar */}
			<Card className="border-slate-200 shadow-xs bg-white">
				<CardContent className="p-4">
					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder="Cari NIM atau Nama Mahasiswa..."
							className="pl-9 bg-white border-slate-200 h-9 text-sm w-full sm:max-w-md"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Main Recap Tabs */}

			<Tabs defaultValue="matrix" className="w-full">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
					<TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
						<TabsTrigger
							value="matrix"
							className="data-[state=active]:bg-white data-[state=active]:shadow-2xs font-semibold text-xs sm:text-sm px-4"
						>
							Matriks Lengkap (16 Sesi & Nilai)
						</TabsTrigger>
						<TabsTrigger
							value="transcript"
							className="data-[state=active]:bg-white data-[state=active]:shadow-2xs font-semibold text-xs sm:text-sm px-4"
						>
							Transkrip Nilai Akhir
						</TabsTrigger>
						<TabsTrigger
							value="attendance"
							className="data-[state=active]:bg-white data-[state=active]:shadow-2xs font-semibold text-xs sm:text-sm px-4"
						>
							Rekap Absensi (H/I/S/A)
						</TabsTrigger>
					</TabsList>

					<div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => fetchData(true)}
							className="h-7 text-xs text-slate-600 hover:text-slate-900"
							title="Sinkronisasi Data Real-time"
						>
							<RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-500" />
							Sinkronkan
						</Button>
						<span>
							Menampilkan <strong>{filteredRecaps.length}</strong> dari{" "}
							{studentRecaps.length} Mahasiswa
						</span>
					</div>
				</div>

				{/* TAB 1: FULL MATRIX (16 MEETINGS + SCORES) */}
				<TabsContent value="matrix" className="space-y-4">
					<Card className="border-slate-200 shadow-xs overflow-hidden">
						<CardHeader className="bg-slate-50/70 border-b border-slate-200 p-4">
							<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
								<div>
									<div className="flex items-center gap-2 flex-wrap">
										<CardTitle className="text-base font-bold text-slate-800">
											Matriks Presensi & Nilai Harian Per Pertemuan
										</CardTitle>
										<Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-semibold">
											16 Sesi Terintegrasi P1 - P16
										</Badge>
									</div>
									<CardDescription className="text-xs text-slate-500 mt-0.5">
										Status kehadiran serta rincian nilai teori dan praktik per
										pertemuan
									</CardDescription>
								</div>

								{/* Quick Jump Bar & Actions */}
								<div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
									<div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
										<span className="text-[11px] font-semibold text-slate-400 px-2 select-none">
											Lompat:
										</span>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => scrollToPosition(0)}
											className="h-7 px-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
											title="Gulir ke Sesi Awal (Pertemuan 1 - 7)"
										>
											<ChevronLeft className="h-3 w-3 mr-0.5" /> P1 - P7
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => scrollToPosition(450)}
											className="h-7 px-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
											title="Gulir ke Sesi UTS (Pertemuan 8)"
										>
											P8 (UTS)
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => scrollToPosition(900)}
											className="h-7 px-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
											title="Gulir ke Sesi UAS (Pertemuan 16)"
										>
											P16 (UAS)
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => scrollToPosition(9999)}
											className="h-7 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
											title="Gulir ke Rekap Nilai Akhir"
										>
											Nilai Akhir <ChevronRight className="h-3 w-3 ml-0.5" />
										</Button>
									</div>

									<div className="flex items-center gap-1.5">
										<Badge
											variant="outline"
											className="bg-white border-slate-200 text-slate-700 text-xs hidden sm:inline-flex"
										>
											H:{" "}
											<span className="font-bold text-emerald-600 mx-0.5">
												Hadir
											</span>{" "}
											| I:{" "}
											<span className="font-bold text-amber-600 mx-0.5">
												Izin
											</span>{" "}
											| S:{" "}
											<span className="font-bold text-blue-600 mx-0.5">
												Sakit
											</span>{" "}
											| A:{" "}
											<span className="font-bold text-rose-600 mx-0.5">
												Alpha
											</span>
										</Badge>
										<Button
											variant="outline"
											size="sm"
											onClick={handleExportMatrix}
											className="h-8 text-xs border-slate-300"
										>
											<Download className="h-3.5 w-3.5 mr-1" /> Unduh Matriks
										</Button>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div
								ref={matrixTableContainerRef}
								className="overflow-x-auto scroll-smooth relative"
							>
								<Table className="w-full border-collapse text-xs">
									<TableHeader>
										<TableRow className="bg-slate-100/90 border-b border-slate-200 text-slate-700">
											<TableHead className="w-12 min-w-[48px] max-w-[48px] text-center font-bold sticky left-0 bg-slate-100 z-20">
												No
											</TableHead>
											<TableHead className="w-24 min-w-[96px] max-w-[96px] font-bold sticky left-[48px] bg-slate-100 z-20">
												NIM
											</TableHead>
											<TableHead className="w-52 min-w-[200px] max-w-[220px] font-bold sticky left-[144px] bg-slate-100 z-20 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] border-r border-slate-200">
												Nama Mahasiswa
											</TableHead>

											{/* Meeting Headers Strictly 1..16 */}
											{meetings.map((m) => {
												const isUts = m.meetingNumber === 8;
												const isUas = m.meetingNumber === 16;

												const badgeColor = isUts
													? "bg-amber-100 text-amber-800 border-amber-300"
													: isUas
														? "bg-purple-100 text-purple-800 border-purple-300"
														: m.meetingNumber === 1
															? "bg-blue-600 text-white border-blue-600 font-bold"
															: "bg-blue-50 text-blue-700 border-blue-200";

												const shortLabel = isUts
													? "UTS"
													: isUas
														? "UAS"
														: `P${m.meetingNumber}`;

												return (
													<TableHead
														key={m.id}
														className={`text-center font-semibold border-l border-slate-200 px-1 w-16 min-w-[64px] max-w-[64px] ${
															m.meetingNumber === 1 ? "bg-blue-50/40" : ""
														}`}
														title={m.meetingLabel}
													>
														<div className="flex flex-col items-center gap-0.5">
															<span
																className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}
															>
																{shortLabel}
															</span>
															<span className="text-[9px] text-slate-400 font-medium">
																{m.sessionType
																	? m.sessionType === "keduanya"
																		? "T/P"
																		: m.sessionType[0].toUpperCase()
																	: "-"}
															</span>
														</div>
													</TableHead>
												);
											})}

											{/* Summary Columns */}
											<TableHead className="text-center font-bold border-l-2 border-slate-300 bg-slate-50 min-w-[80px]">
												Kehadiran
											</TableHead>
											<TableHead className="text-center font-bold bg-slate-50 min-w-[65px]">
												Rerata T
											</TableHead>
											<TableHead className="text-center font-bold bg-slate-50 min-w-[65px]">
												Rerata P
											</TableHead>
											<TableHead className="text-center font-bold bg-slate-100 min-w-[75px]">
												Nilai Akhir
											</TableHead>
											<TableHead className="text-center font-bold bg-slate-100 min-w-[55px]">
												Grade
											</TableHead>
											<TableHead className="text-center font-bold bg-slate-50 min-w-[90px]">
												Status
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredRecaps.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={meetings.length + 9}
													className="text-center py-12 text-slate-400"
												>
													Tidak ada data mahasiswa yang sesuai dengan filter.
												</TableCell>
											</TableRow>
										) : (
											filteredRecaps.map((item, idx) => (
												<TableRow
													key={item.student.id}
													className="hover:bg-blue-50/40 border-b border-slate-200 transition-colors"
												>
													<TableCell className="w-12 min-w-[48px] max-w-[48px] text-center font-medium sticky left-0 bg-white z-20">
														{idx + 1}
													</TableCell>
													<TableCell className="w-24 min-w-[96px] max-w-[96px] font-mono text-slate-600 font-medium sticky left-[48px] bg-white z-20">
														{item.student.nim}
													</TableCell>
													<TableCell
														className="w-52 min-w-[200px] max-w-[220px] font-semibold text-slate-800 sticky left-[144px] bg-white z-20 truncate shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] border-r border-slate-200"
														title={item.student.name}
													>
														{item.student.name}
													</TableCell>

													{/* Meeting cells */}
													{meetings.map((m) => {
														const res = item.meetingResults[m.id];
														const status = res?.status;
														const tScore = res?.theoryScore;
														const pScore = res?.practicalScore;

														let statusBadge = "-";
														let statusClass = "text-slate-300";

														if (status === "hadir") {
															statusBadge = "H";
															statusClass =
																"text-emerald-700 font-bold bg-emerald-50 rounded px-1";
														} else if (status === "izin") {
															statusBadge = "I";
															statusClass =
																"text-amber-700 font-bold bg-amber-50 rounded px-1";
														} else if (status === "sakit") {
															statusBadge = "S";
															statusClass =
																"text-blue-700 font-bold bg-blue-50 rounded px-1";
														} else if (status === "alpha") {
															statusBadge = "A";
															statusClass =
																"text-rose-700 font-bold bg-rose-50 rounded px-1";
														}

														return (
															<TableCell
																key={m.id}
																className={`text-center p-1 border-l border-slate-100 w-16 min-w-[64px] max-w-[64px] ${
																	m.meetingNumber === 1 ? "bg-blue-50/20" : ""
																}`}
															>
																<div className="flex flex-col items-center gap-0.5">
																	<span
																		className={`text-[10px] ${statusClass}`}
																	>
																		{statusBadge}
																	</span>
																	{(tScore !== null || pScore !== null) && (
																		<span className="text-[9px] text-slate-600 font-semibold font-mono leading-tight">
																			{tScore !== null ? `T:${tScore}` : ""}
																			{tScore !== null && pScore !== null
																				? " "
																				: ""}
																			{pScore !== null ? `P:${pScore}` : ""}
																		</span>
																	)}
																</div>
															</TableCell>
														);
													})}

													{/* Summary cells */}
													<TableCell className="text-center font-semibold border-l-2 border-slate-300 bg-slate-50/50">
														<span className="text-emerald-700">
															{item.presentCount}
														</span>
														<span className="text-slate-400">
															/{item.totalMeetings}
														</span>
														<span className="text-[10px] text-slate-500 block font-normal">
															({item.attendanceRate}%)
														</span>
													</TableCell>
													<TableCell className="text-center font-mono font-medium text-slate-700 bg-slate-50/50">
														{item.avgTheory > 0 ? item.avgTheory : "-"}
													</TableCell>
													<TableCell className="text-center font-mono font-medium text-slate-700 bg-slate-50/50">
														{item.avgPractical > 0 ? item.avgPractical : "-"}
													</TableCell>
													<TableCell className="text-center font-mono font-bold text-slate-900 bg-slate-100/50 text-sm">
														{item.finalScore}
													</TableCell>
													<TableCell className="text-center font-bold bg-slate-100/50">
														<Badge
															className={
																item.grade === "A"
																	? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
																	: item.grade === "B"
																		? "bg-blue-600 hover:bg-blue-700 text-white font-bold"
																		: item.grade === "C"
																			? "bg-amber-500 hover:bg-amber-600 text-white font-bold"
																			: "bg-rose-600 hover:bg-rose-700 text-white font-bold"
															}
														>
															{item.grade}
														</Badge>
													</TableCell>
													<TableCell className="text-center bg-slate-50/50">
														<Badge
															variant="outline"
															className={
																item.status === "AMAN"
																	? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
																	: item.status === "PERLU_PERHATIAN"
																		? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
																		: "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
															}
														>
															{item.status === "AMAN"
																? "AMAN"
																: item.status === "PERLU_PERHATIAN"
																	? "PERHATIAN"
																	: "KURANG"}
														</Badge>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* TAB 2: TRANSCRIPT (NILAI AKHIR & YUDISIUM) */}
				<TabsContent value="transcript" className="space-y-4">
					<Card className="border-slate-200 shadow-xs">
						<CardHeader className="bg-slate-50/70 border-b border-slate-200 p-4">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
								<div>
									<CardTitle className="text-base font-bold text-slate-800">
										Laporan Transkrip & Evaluasi Nilai Akhir
									</CardTitle>
									<CardDescription className="text-xs text-slate-500">
										Format rekapitulasi nilai akhir perkuliahan / arsip akademik
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={handleExportTranscript}
									className="h-8 text-xs border-slate-300"
								>
									<Download className="h-3.5 w-3.5 mr-1" /> Unduh Laporan Nilai
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table className="w-full text-sm">
									<TableHeader>
										<TableRow className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
											<TableHead className="w-12 text-center font-bold">
												No
											</TableHead>
											<TableHead className="w-32 font-bold">NIM</TableHead>
											<TableHead className="min-w-[200px] font-bold">
												Nama Mahasiswa
											</TableHead>
											<TableHead className="min-w-[140px] font-bold">
												Peminatan
											</TableHead>
											<TableHead className="text-center font-bold">
												Presensi (18 Sesi)
											</TableHead>
											<TableHead className="text-center font-bold">
												Rerata Teori (20%)
											</TableHead>
											<TableHead className="text-center font-bold">
												Rerata Praktik (80%)
											</TableHead>
											<TableHead className="text-center font-bold">
												Nilai Akhir
											</TableHead>
											<TableHead className="text-center font-bold">
												Grade
											</TableHead>
											<TableHead className="text-center font-bold">
												Status Kelulusan
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredRecaps.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={10}
													className="text-center py-12 text-slate-400"
												>
													Tidak ada data mahasiswa.
												</TableCell>
											</TableRow>
										) : (
											filteredRecaps.map((item, idx) => (
												<TableRow
													key={item.student.id}
													className="hover:bg-slate-50/80 border-b border-slate-200"
												>
													<TableCell className="text-center font-medium text-slate-500">
														{idx + 1}
													</TableCell>
													<TableCell className="font-mono text-slate-700 font-semibold">
														{item.student.nim}
													</TableCell>
													<TableCell className="font-bold text-slate-900">
														{item.student.name}
													</TableCell>
													<TableCell className="text-slate-600 text-xs">
														{item.student.peminatan || "-"}
													</TableCell>
													<TableCell className="text-center">
														<span className="font-semibold text-slate-800">
															{item.presentCount}
														</span>
														<span className="text-slate-400 text-xs">
															/{item.totalMeetings}
														</span>
														<span className="text-xs font-semibold text-emerald-700 ml-1.5">
															({item.attendanceRate}%)
														</span>
													</TableCell>
													<TableCell className="text-center font-mono font-medium">
														{item.avgTheory}
													</TableCell>
													<TableCell className="text-center font-mono font-medium">
														{item.avgPractical}
													</TableCell>
													<TableCell className="text-center font-mono font-bold text-base text-slate-900">
														{item.finalScore}
													</TableCell>
													<TableCell className="text-center">
														<Badge
															className={
																item.grade === "A"
																	? "bg-emerald-600 text-white font-bold"
																	: item.grade === "B"
																		? "bg-blue-600 text-white font-bold"
																		: item.grade === "C"
																			? "bg-amber-500 text-white font-bold"
																			: "bg-rose-600 text-white font-bold"
															}
														>
															{item.grade}
														</Badge>
													</TableCell>
													<TableCell className="text-center">
														<Badge
															variant="outline"
															className={
																item.statusKelulusan.includes("MEMUASKAN")
																	? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs"
																	: item.statusKelulusan === "LULUS"
																		? "bg-blue-50 text-blue-700 border-blue-300 font-semibold text-xs"
																		: "bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs"
															}
														>
															{item.statusKelulusan}
														</Badge>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* TAB 3: ATTENDANCE BREAKDOWN (H/I/S/A) */}
				<TabsContent value="attendance" className="space-y-4">
					<Card className="border-slate-200 shadow-xs">
						<CardHeader className="bg-slate-50/70 border-b border-slate-200 p-4">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
								<div>
									<CardTitle className="text-base font-bold text-slate-800">
										Rekapitulasi Akumulasi Absensi & Disiplin
									</CardTitle>
									<CardDescription className="text-xs text-slate-500">
										Perincian jumlah Hadir (H), Izin (I), Sakit (S), Alpha (A)
										mahasiswa di 16 sesi perkuliahan
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={handleExportAttendance}
									className="h-8 text-xs border-slate-300"
								>
									<Download className="h-3.5 w-3.5 mr-1" /> Unduh Data Absensi
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table className="w-full text-sm">
									<TableHeader>
										<TableRow className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
											<TableHead className="w-12 text-center font-bold">
												No
											</TableHead>
											<TableHead className="w-32 font-bold">NIM</TableHead>
											<TableHead className="min-w-[220px] font-bold">
												Nama Mahasiswa
											</TableHead>
											<TableHead className="text-center font-bold text-emerald-700">
												Hadir (H)
											</TableHead>
											<TableHead className="text-center font-bold text-amber-700">
												Izin (I)
											</TableHead>
											<TableHead className="text-center font-bold text-blue-700">
												Sakit (S)
											</TableHead>
											<TableHead className="text-center font-bold text-rose-700">
												Alpha (A)
											</TableHead>
											<TableHead className="text-center font-bold text-slate-400">
												Belum Diisi (-)
											</TableHead>
											<TableHead className="text-center font-bold">
												Total Sesi
											</TableHead>
											<TableHead className="text-center font-bold">
												Persentase Kehadiran
											</TableHead>
											<TableHead className="text-center font-bold">
												Status Evaluasi
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredRecaps.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={11}
													className="text-center py-12 text-slate-400"
												>
													Tidak ada data mahasiswa.
												</TableCell>
											</TableRow>
										) : (
											filteredRecaps.map((item, idx) => (
												<TableRow
													key={item.student.id}
													className="hover:bg-slate-50/80 border-b border-slate-200"
												>
													<TableCell className="text-center font-medium text-slate-500">
														{idx + 1}
													</TableCell>
													<TableCell className="font-mono text-slate-700 font-semibold">
														{item.student.nim}
													</TableCell>
													<TableCell className="font-bold text-slate-900">
														{item.student.name}
													</TableCell>
													<TableCell className="text-center font-bold text-emerald-700 bg-emerald-50/40">
														{item.presentCount}
													</TableCell>
													<TableCell className="text-center font-bold text-amber-700 bg-amber-50/40">
														{item.permitCount}
													</TableCell>
													<TableCell className="text-center font-bold text-blue-700 bg-blue-50/40">
														{item.sickCount}
													</TableCell>
													<TableCell className="text-center font-bold text-rose-700 bg-rose-50/40">
														{item.alphaCount}
													</TableCell>
													<TableCell className="text-center font-medium text-slate-400">
														{item.unassignedCount}
													</TableCell>
													<TableCell className="text-center font-semibold text-slate-700">
														{item.totalMeetings}
													</TableCell>
													<TableCell className="text-center">
														<div className="flex items-center justify-center gap-2">
															<span className="font-bold text-slate-900 font-mono text-sm">
																{item.attendanceRate}%
															</span>
														</div>
													</TableCell>
													<TableCell className="text-center">
														<Badge
															variant="outline"
															className={
																item.status === "AMAN"
																	? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold"
																	: item.status === "PERLU_PERHATIAN"
																		? "bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold"
																		: "bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold"
															}
														>
															{item.status === "AMAN"
																? "AMAN (≥ 90%)"
																: item.status === "PERLU_PERHATIAN"
																	? "PERHATIAN (75-89%)"
																	: "KURANG (< 75%)"}
														</Badge>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
