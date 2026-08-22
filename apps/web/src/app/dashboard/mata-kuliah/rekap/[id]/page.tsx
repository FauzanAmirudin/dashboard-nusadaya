"use client";

import {
	ArrowLeft,
	BookOpen,
	CheckCircle,
	CheckSquare,
	ChevronDown,
	Download,
	Eye,
	FileText,
	GraduationCap,
	Layers,
	Loader2,
	Printer,
	Search,
	Settings,
	Sparkles,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { useAuthStore } from "@/store";

type CourseDetail = {
	id: number;
	code: string;
	name: string;
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

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [filterGrade, setFilterGrade] = useState<string>("all");
	const [filterStatus, setFilterStatus] = useState<string>("all");

	const fetchData = async () => {
		setIsLoading(true);
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

			// 2. Get meetings with attendances
			const { data: mData, error: mErr } =
				await api.courses[courseId].meetings.get();
			if (!mErr && mData?.success) {
				const meets = (mData.data as any[]) || [];
				// Sort: PKKMB (-1), Beginning (0), 1..16
				meets.sort((a, b) => (a.meetingNumber ?? 0) - (b.meetingNumber ?? 0));
				setMeetings(meets);
			}

			// 3. Get students in cohort
			if (courseInfo?.cohort) {
				const { data: sData, error: sErr } = await api.students.get({
					$query: {
						cohort: courseInfo.cohort.toString(),
						all: "true",
					},
				});
				if (!sErr && sData?.data) {
					const sList = (sData.data as any[]).map((item) => item.student);
					sList.sort((a, b) => a.name.localeCompare(b.name));
					setStudents(sList);
				}
			}
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

	// Process calculations
	const studentRecaps = useMemo(() => {
		if (!course || students.length === 0) return [];

		return students.map((student) => {
			let presentCount = 0;
			let permitCount = 0;
			let sickCount = 0;
			let alphaCount = 0;
			let unassignedCount = 0;

			const validTheoryScores: number[] = [];
			const validPracticalScores: number[] = [];

			const meetingResults: Record<
				number,
				{
					status: string | null;
					theoryScore: number | null;
					practicalScore: number | null;
					notes: string | null;
				}
			> = {};

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

				if (theoryScore !== null) validTheoryScores.push(theoryScore);
				if (practicalScore !== null) validPracticalScores.push(practicalScore);
			});

			const totalMeetings = meetings.length || 18;
			const attendanceRate = Math.min(
				100,
				Math.round((presentCount / totalMeetings) * 100),
			);

			const avgTheory =
				validTheoryScores.length > 0
					? Math.round(
							validTheoryScores.reduce((acc, curr) => acc + curr, 0) /
								validTheoryScores.length,
						)
					: 0;

			const avgPractical =
				validPracticalScores.length > 0
					? Math.round(
							validPracticalScores.reduce((acc, curr) => acc + curr, 0) /
								validPracticalScores.length,
						)
					: 0;

			const isPracticalCourse = course.type === "praktik";
			const finalScore = isPracticalCourse
				? Math.round(avgPractical * 0.8 + avgTheory * 0.2)
				: avgTheory;

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
						: "TIDAK_AMAN";

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
			if (filterGrade !== "all" && item.grade !== filterGrade) return false;
			if (filterStatus !== "all" && item.status !== filterStatus) return false;
			return true;
		});
	}, [studentRecaps, searchQuery, filterGrade, filterStatus]);

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
					m.meetingType === "pkkmb"
						? "PKKMB"
						: m.meetingType === "beginning"
							? "Beginning Class"
							: m.meetingType === "uts"
								? "UTS (P8)"
								: m.meetingType === "uas"
									? "UAS (P16)"
									: `P${m.meetingNumber}`;

				const statusText = mRes?.status ? mRes.status.toUpperCase() : "-";
				const tScore = mRes?.theoryScore !== null ? mRes?.theoryScore : "-";
				const pScore =
					mRes?.practicalScore !== null ? mRes?.practicalScore : "-";

				row[`${label} (Presensi)`] = statusText;
				if (m.sessionType === "teori" || m.sessionType === "keduanya") {
					row[`${label} (Teori)`] = tScore;
				}
				if (m.sessionType === "praktik" || m.sessionType === "keduanya") {
					row[`${label} (Praktik)`] = pScore;
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
						onClick={() => window.print()}
						className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9"
					>
						<Printer className="mr-2 h-4 w-4 text-slate-600" /> Cetak
					</Button>
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
					<div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
						<div className="relative w-full sm:w-80">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Cari NIM atau Nama Mahasiswa..."
								className="pl-9 bg-white border-slate-200 h-9 text-sm"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<div className="flex items-center gap-2 w-full sm:w-auto">
							<Select
								value={filterGrade}
								onValueChange={(val) => setFilterGrade(val || "all")}
							>
								<SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-200 h-9 text-sm">
									<SelectValue placeholder="Semua Grade" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Grade</SelectItem>
									<SelectItem value="A">Grade A (≥ 85)</SelectItem>
									<SelectItem value="B">Grade B (75–84)</SelectItem>
									<SelectItem value="C">Grade C (65–74)</SelectItem>
									<SelectItem value="D">Grade D (50–64)</SelectItem>
									<SelectItem value="E">Grade E (&lt; 50)</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={filterStatus}
								onValueChange={(val) => setFilterStatus(val || "all")}
							>
								<SelectTrigger className="w-full sm:w-[160px] bg-white border-slate-200 h-9 text-sm">
									<SelectValue placeholder="Semua Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Status</SelectItem>
									<SelectItem value="AMAN">AMAN (≥ 90%)</SelectItem>
									<SelectItem value="PERLU_PERHATIAN">
										PERHATIAN (75-89%)
									</SelectItem>
									<SelectItem value="TIDAK_AMAN">KRITIS (&lt; 75%)</SelectItem>
								</SelectContent>
							</Select>
						</div>
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
							Matriks Lengkap (18 Sesi & Nilai)
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

					<div className="text-xs text-slate-500 font-medium">
						Menampilkan <strong>{filteredRecaps.length}</strong> dari{" "}
						{studentRecaps.length} Mahasiswa
					</div>
				</div>

				{/* TAB 1: FULL MATRIX (18 MEETINGS + SCORES) */}
				<TabsContent value="matrix" className="space-y-4">
					<Card className="border-slate-200 shadow-xs overflow-hidden">
						<CardHeader className="bg-slate-50/70 border-b border-slate-200 p-4">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
								<div>
									<CardTitle className="text-base font-bold text-slate-800">
										Matriks Presensi & Nilai Harian Per Pertemuan
									</CardTitle>
									<CardDescription className="text-xs text-slate-500">
										Kolom menampilkan status kehadiran serta nilai teori dan
										praktik per pertemuan
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="bg-white border-slate-200 text-slate-700 text-xs"
									>
										⚪ Hadir:{" "}
										<span className="font-bold text-emerald-600 ml-1">H</span> |
										Izin:{" "}
										<span className="font-bold text-amber-600 ml-1">I</span> |
										Sakit:{" "}
										<span className="font-bold text-blue-600 ml-1">S</span> |
										Alpha:{" "}
										<span className="font-bold text-rose-600 ml-1">A</span>
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
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table className="w-full border-collapse text-xs">
									<TableHeader>
										<TableRow className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
											<TableHead className="w-12 text-center font-bold sticky left-0 bg-slate-100 z-10">
												No
											</TableHead>
											<TableHead className="w-28 font-bold sticky left-12 bg-slate-100 z-10">
												NIM
											</TableHead>
											<TableHead className="min-w-[180px] font-bold sticky left-40 bg-slate-100 z-10">
												Nama Mahasiswa
											</TableHead>

											{/* Meeting Headers */}
											{meetings.map((m) => {
												const isPkkmb =
													m.meetingType === "pkkmb" || m.meetingNumber === -1;
												const isBc =
													m.meetingType === "beginning" ||
													m.meetingNumber === 0;
												const isUts =
													m.meetingType === "uts" || m.meetingNumber === 8;
												const isUas =
													m.meetingType === "uas" || m.meetingNumber === 16;

												const badgeColor = isPkkmb
													? "bg-indigo-100 text-indigo-800 border-indigo-200"
													: isBc
														? "bg-teal-100 text-teal-800 border-teal-200"
														: isUts
															? "bg-amber-100 text-amber-800 border-amber-300"
															: isUas
																? "bg-purple-100 text-purple-800 border-purple-300"
																: "bg-blue-50 text-blue-700 border-blue-200";

												const shortLabel = isPkkmb
													? "PKKMB"
													: isBc
														? "BC"
														: isUts
															? "UTS"
															: isUas
																? "UAS"
																: `P${m.meetingNumber}`;

												return (
													<TableHead
														key={m.id}
														className="text-center font-semibold border-l border-slate-200 px-2 min-w-[70px]"
														title={m.meetingLabel}
													>
														<div className="flex flex-col items-center gap-0.5">
															<span
																className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${badgeColor}`}
															>
																{shortLabel}
															</span>
															<span className="text-[9px] text-slate-400">
																{m.sessionType
																	? m.sessionType[0].toUpperCase()
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
													<TableCell className="text-center font-medium sticky left-0 bg-white z-10">
														{idx + 1}
													</TableCell>
													<TableCell className="font-mono text-slate-600 font-medium sticky left-12 bg-white z-10">
														{item.student.nim}
													</TableCell>
													<TableCell className="font-semibold text-slate-800 sticky left-40 bg-white z-10 whitespace-nowrap">
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
																className="text-center p-1.5 border-l border-slate-100"
															>
																<div className="flex flex-col items-center gap-0.5">
																	<span
																		className={`text-[10px] ${statusClass}`}
																	>
																		{statusBadge}
																	</span>
																	{(tScore !== null || pScore !== null) && (
																		<span className="text-[9px] text-slate-600 font-semibold font-mono">
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
																	: "KRITIS"}
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
										Format rekapitulasi nilai akhir perkuliahan siap cetak /
										arsip akademik
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
										mahasiswa di 18 sesi perkuliahan
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
																	: "KRITIS (< 75%)"}
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
