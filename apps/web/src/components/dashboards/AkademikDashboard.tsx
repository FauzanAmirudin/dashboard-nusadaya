"use client";

import {
	CheckCircle,
	ChevronRight,
	ClipboardList,
	Clock,
	Download,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { exportToCSV } from "@/lib/export";



interface CourseGrade {
	id: string;
	totalMeetings?: number;
	attendancePresent?: number;
}

interface Academic {
	status?: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN" | string | null;
	pddiktiInput?: boolean;
	attendancePresent?: number;
	attendanceTotal?: number;
	utsPassed?: boolean;
	uasPassed?: boolean;
	assignmentsCompleted?: boolean;
	attitudeIndicator?: string;
	academicCommunication?: string;
	isAcc?: boolean;
	taiwanCohort?: boolean;
	gpa?: number;
}

interface AkademikStudent {
	id: number | string;
	nim: string;
	name: string;
}

interface AkademikStudentData {
	student: AkademikStudent;
	academic?: Academic | null;
	courseGrades?: CourseGrade[];
}

interface AkademikUser {
	username?: string;
}

interface AkademikDashboardProps {
	data: AkademikStudentData[];
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	user?: AkademikUser | null;
}

export function AkademikDashboard({
	data,
	searchQuery,
	setSearchQuery,
	user,
}: AkademikDashboardProps) {
	const router = useRouter();
	const [filterTaiwan, setFilterTaiwan] = useState(false);

	const totalStudents = data.length;
	const countAman = data.filter(
		(s) => s.academic?.status === "AMAN",
	).length;
	const countPerhatian = data.filter(
		(s) => s.academic?.status === "PERLU_PERHATIAN" || !s.academic?.status,
	).length;
	const countTidakAman = data.filter(
		(s) => s.academic?.status === "TIDAK_AMAN",
	).length;

	const handleExport = () => {
		const exportData = data.map((s) => ({
			NIM: s.student.nim,
			"Nama Mahasiswa": s.student.name,
			"Input PDDIKTI": s.academic?.pddiktiInput ? "Sudah" : "Belum",
			"Total Kehadiran (Hadir)": s.academic?.attendancePresent || 0,
			"Total Pertemuan (Target)": s.academic?.attendanceTotal || 0,
			"Lulus UTS": s.academic?.utsPassed ? "Ya" : "Tidak",
			"Lulus UAS": s.academic?.uasPassed ? "Ya" : "Tidak",
			"Tugas Selesai": s.academic?.assignmentsCompleted ? "Ya" : "Tidak",
			"Indikator Sikap": s.academic?.attitudeIndicator || "-",
			"Komunikasi Akademik": s.academic?.academicCommunication || "-",
			"Status Akademik":
				s.academic?.status === "AMAN"
					? "Aman"
					: s.academic?.status === "TIDAK_AMAN"
						? "Tidak Aman"
						: "Perlu Perhatian",
			"Disetujui Admin Akademik": s.academic?.isAcc ? "Sudah ACC" : "Belum",
		}));
		exportToCSV(
			exportData,
			`Data_Akademik_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const filteredData = data.filter((s) => {
		const matchSearch =
			s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.student.nim.includes(searchQuery);
		const matchTaiwan = filterTaiwan ? s.academic?.taiwanCohort : true;
		return matchSearch && matchTaiwan;
	});

	const renderProgressBadge = (academic?: Academic | null, courseGrades: CourseGrade[] = []) => {
		let totalPertemuan = 0;
		let totalHadir = 0;
		courseGrades.forEach(c => {
			totalPertemuan += (c.totalMeetings || 16);
			totalHadir += (c.attendancePresent || 0);
		});

		const attendanceOk =
			totalPertemuan > 0 &&
			totalHadir / totalPertemuan >= 0.8;
		const items = [
			academic?.pddiktiInput,
			attendanceOk,
			academic?.utsPassed,
			academic?.uasPassed,
			academic?.attitudeIndicator,
			academic?.assignmentsCompleted,
			academic?.academicCommunication,
		];
		const completedCount = items.filter(Boolean).length;
		const total = items.length;

		return (
			<div className="flex items-center gap-2 justify-center">
				<span className="text-sm font-medium text-slate-700">
					{completedCount}/{total}
				</span>
				<div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
					<div
						className={`h-full rounded-full ${completedCount === total ? "bg-emerald-500" : "bg-blue-500"}`}
						style={{
							width: `${(completedCount / total) * 100}%`,
						}}
					/>
				</div>
			</div>
		);
	};

	const getGpaGrade = (gpaScaled: number) => {
		const gpa = gpaScaled / 100;
		if (gpa >= 3.7) return "A";
		if (gpa >= 3.3) return "B+";
		if (gpa >= 3.0) return "B";
		if (gpa >= 2.7) return "C+";
		if (gpa >= 2.0) return "C";
		return "D";
	};

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Divisi Akademik
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {user?.username}. Berikut ringkasan status akademik
						dan kehadiran mahasiswa.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleExport}
						className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
					>
						<Download className="h-4 w-4" />
						Export Data Akademik
					</button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-[#0517B0]">
							<Users className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Total Mahasiswa
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{totalStudents}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-emerald-500">
							<CheckCircle className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Kepatuhan Akademik (Aman)
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countAman}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-amber-500">
							<Clock className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Akademik Proses (Perhatian)
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countPerhatian}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-rose-500">
							<XCircle className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Masalah Akademik
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countTidakAman}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Access — Assessment */}
			<div
				role="button"
				tabIndex={0}
				onClick={() => router.push("/dashboard/akademik/assessment")}
				onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/akademik/assessment")}
				className="cursor-pointer"
			>
				<Card className="bg-gradient-to-r from-[#0517B0]/5 to-blue-50 border-[#0517B0]/20 shadow-sm hover:shadow-md transition-shadow">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="w-10 h-10 rounded-lg bg-[#0517B0]/10 flex items-center justify-center shrink-0">
							<ClipboardList className="h-5 w-5 text-[#0517B0]" />
						</div>
						<div className="flex-1">
							<p className="font-semibold text-slate-800 text-sm">
								Assessment Pra-keberangkatan
							</p>
							<p className="text-xs text-slate-500 mt-0.5">
								Kelola nilai, dokumen PDF, dan progres assessment seluruh mahasiswa
							</p>
						</div>
						<ChevronRight className="h-5 w-5 text-[#0517B0] shrink-0" />
					</CardContent>
				</Card>
			</div>

			<div className="flex flex-col gap-6">
				{/* List Mahasiswa dengan Kendala */}
				<Card className="bg-white border-slate-200 shadow-sm w-full">
					<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<CardTitle className="text-slate-800 text-lg">
								Tabel Status Akademik Mahasiswa
							</CardTitle>
							<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
								<div className="relative w-full md:w-72">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
									<Input
										placeholder="Cari NIM atau Nama..."
										className="pl-9 bg-white"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
								<button
									onClick={() => setFilterTaiwan(!filterTaiwan)}
									className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${filterTaiwan ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
								>
									{filterTaiwan ? "Hanya Taiwan" : "Semua Angkatan"}
								</button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-4 sm:p-6">
						<div className="overflow-y-auto max-h-75 border border-slate-200 rounded-md">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
									<TableRow className="border-slate-200 hover:bg-slate-50">
										<TableHead className="text-slate-500 font-semibold py-3">
											NIM
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3">
											Nama Lengkap
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 text-center">
											Kehadiran
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 text-center">
											IPK Vokasi
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-center py-3">
											Status
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-right py-3 pr-4">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredData.map((s) => {
										const attendanceTotal = s.academic?.attendanceTotal || 0;
										const attendancePresent =
											s.academic?.attendancePresent || 0;
										const attPct =
											attendanceTotal > 0
												? Math.round(
														(attendancePresent / attendanceTotal) * 100,
													)
												: 0;
										const isPassed = attPct >= 90;

										const gpa = s.academic?.gpa || 0;
										const gpaStr = (gpa / 100).toFixed(2);
										const grade = getGpaGrade(gpa);

										return (
											<TableRow
												key={s.student.id}
												className="border-slate-200 hover:bg-blue-50/50 transition-colors"
											>
												<TableCell className="font-medium text-slate-700">
													{s.student.nim}
												</TableCell>
												<TableCell className="text-slate-900 font-semibold">
													{s.student.name}
													{s.academic?.taiwanCohort && (
														<Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-1.5 h-5 text-[10px]">
															Taiwan
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-center">
													{attendanceTotal > 0 ? (
														<span
															className={`text-sm font-bold ${isPassed ? "text-emerald-600" : "text-rose-600"}`}
														>
															{attPct}%
														</span>
													) : (
														<span className="text-xs text-slate-400">-</span>
													)}
												</TableCell>
												<TableCell className="text-center">
													{gpa > 0 ? (
														<span className="text-sm font-semibold text-blue-700">
															{gpaStr} ({grade})
														</span>
													) : (
														<span className="text-xs text-slate-400">-</span>
													)}
												</TableCell>
												<TableCell className="text-center">
													{renderProgressBadge(s.academic, s.courseGrades)}
												</TableCell>
												<TableCell className="text-right pr-4">
													<button
														type="button"
														onClick={() =>
															router.push(
																`/dashboard/students/${s.student.id}?context=akademik`,
															)
														}
														className="text-[#0517B0] hover:text-blue-800 hover:underline text-sm font-medium"
													>
														Periksa
													</button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
							{filteredData.length === 0 && (
								<div className="text-center py-8 text-slate-500">
									Tidak ada data mahasiswa ditemukan.
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
