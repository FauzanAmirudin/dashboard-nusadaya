"use client";

import {
	BookOpen,
	CheckCircle,
	CheckCircle2,
	Clock,
	Eye,
	GraduationCap,
	HelpCircle,
	Loader2,
	Search,
	ShieldAlert,
	ShieldCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { api } from "@/lib/eden";

interface DosenDashboardProps {
	user: { id: number; username: string; role: string; fullName?: string };
}

interface CourseGradeRow {
	id: number;
	studentId: number;
	studentName: string;
	studentNim: string;
	studentCohort?: number;
	courseCode: string;
	courseName: string;
	grade: string | null;
	attendanceRate: number | null;
	isAcc: boolean;
	status: string;
}

interface DashboardData {
	kpi: {
		totalCourses: number;
		totalStudents: number;
		pendingAcc: number;
		lowAttendance: number;
	};
	courseGrades: CourseGradeRow[];
}

export function DosenDashboard({ user }: DosenDashboardProps) {
	const router = useRouter();
	const [data, setData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");

	// Cohort years starting from 2022
	const cohortYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from(
			{ length: currentYear - 2022 + 2 },
			(_, i) => currentYear + 1 - i,
		);
	}, []);

	useEffect(() => {
		const fetchDashboard = async () => {
			const { data: res, error } = await api.dosen.dashboard.get();
			if (!error && res?.success) {
				setData(res.data as DashboardData);
			}
			setIsLoading(false);
		};

		fetchDashboard();
	}, []);

	// Filter by cohort for reactive stats
	const cohortGrades = useMemo(() => {
		if (!data?.courseGrades) return [];
		if (selectedCohort === "all") return data.courseGrades;
		return data.courseGrades.filter(
			(g) => g.studentCohort?.toString() === selectedCohort,
		);
	}, [data, selectedCohort]);

	// KPI Metrics based on cohortGrades
	const totalGrades = cohortGrades.length;
	const countAcc = cohortGrades.filter((g) => g.isAcc).length;
	const countPending = cohortGrades.filter((g) => !g.isAcc).length;
	const countLowAttendance = cohortGrades.filter(
		(g) => (g.attendanceRate || 0) < 80,
	).length;
	const totalCourses = data?.kpi?.totalCourses || 0;

	// Filtered for table
	const filteredGrades = useMemo(() => {
		const q = searchQuery.toLowerCase();
		return cohortGrades.filter((g) => {
			const matchSearch =
				!q ||
				g.studentName.toLowerCase().includes(q) ||
				g.studentNim.toLowerCase().includes(q) ||
				g.courseName.toLowerCase().includes(q) ||
				g.courseCode.toLowerCase().includes(q);

			let matchStatus = true;
			if (selectedStatus === "aman") matchStatus = g.status === "AMAN";
			if (selectedStatus === "perhatian")
				matchStatus = g.status === "PERLU_PERHATIAN";
			if (selectedStatus === "tidak_aman")
				matchStatus = g.status === "TIDAK_AMAN";
			if (selectedStatus === "acc") matchStatus = g.isAcc;

			return matchSearch && matchStatus;
		});
	}, [cohortGrades, searchQuery, selectedStatus]);

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-80 gap-3 text-slate-500">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-sm font-semibold">Memuat dashboard dosen...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-12">
			{/* Top Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
							<BookOpen className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Dashboard Dosen Pengampu
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Selamat datang, {user?.fullName || user?.username}. Monitoring
								kelas, rekap nilai UTS/UAS, dan presensi.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Select
						value={selectedCohort}
						onValueChange={(val) => setSelectedCohort(val || "all")}
					>
						<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200 font-semibold text-slate-800">
							<SelectValue placeholder="Filter Angkatan" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Angkatan</SelectItem>
							{cohortYears.map((year) => (
								<SelectItem key={year} value={year.toString()}>
									Angkatan {year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						onClick={() => router.push("/dashboard/mata-kuliah")}
						className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-9 font-bold shadow-sm"
					>
						<BookOpen className="w-3.5 h-3.5" />
						Kelola Mata Kuliah
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-blue-50 text-[#0517B0] mt-0.5">
							<BookOpen className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Total Kelas Diampu
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{totalCourses}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-sky-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-sky-50 text-sky-600 mt-0.5">
							<Users className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Total Nilai Mahasiswa
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{totalGrades}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-600">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
							<ShieldCheck className="h-5 w-5" />
						</div>
						<div>
							<p className="text-emerald-700 text-xs font-bold">
								Sudah di-ACC Dosen
							</p>
							<p className="text-2xl font-black text-emerald-900 mt-0.5">
								{countAcc}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-amber-50 text-amber-600 mt-0.5">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								🟡 Menunggu ACC
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countPending}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-rose-50 text-rose-600 mt-0.5">
							<XCircle className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								⛔ Absen &lt; 80%
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countLowAttendance}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Master Table */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<GraduationCap className="w-4 h-4 text-[#0517B0]" />
							Daftar Nilai & Kehadiran Mahasiswa
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Menampilkan {filteredGrades.length} dari {totalGrades} entri nilai
							mahasiswa.
						</p>
					</div>

					{/* Search & Filter */}
					<div className="flex flex-wrap items-center gap-2.5">
						<div className="relative w-full sm:w-60">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari Mahasiswa / MK..."
								className="pl-9 h-9 text-xs bg-white border-slate-200"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<Select
							value={selectedStatus}
							onValueChange={(val) => setSelectedStatus(val || "all")}
						>
							<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Status Nilai" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="aman">🟢 Aman</SelectItem>
								<SelectItem value="perhatian">🟡 Perlu Perhatian</SelectItem>
								<SelectItem value="tidak_aman">🔴 Tidak Aman</SelectItem>
								<SelectItem value="acc">🛡️ Sudah ACC</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50 sticky top-0 z-10">
								<TableRow className="border-slate-200">
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs w-28">
										NIM
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
										Nama Mahasiswa
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
										Mata Kuliah
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										Kehadiran
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-24">
										Nilai
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										Status
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										ACC Dosen
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-28">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredGrades.map((g) => (
									<TableRow
										key={g.id}
										className="border-slate-100 hover:bg-blue-50/40 transition-colors"
									>
										<TableCell className="font-mono text-xs font-bold text-slate-700">
											{g.studentNim}
										</TableCell>
										<TableCell>
											<div className="font-bold text-slate-900 text-sm">
												{g.studentName}
											</div>
										</TableCell>
										<TableCell>
											<div className="text-xs font-semibold text-slate-800">
												{g.courseName}
											</div>
											<div className="text-[11px] font-mono text-slate-400">
												{g.courseCode}
											</div>
										</TableCell>

										<TableCell className="text-center">
											<Badge
												variant="outline"
												className={`text-xs font-semibold ${
													(g.attendanceRate || 0) >= 80
														? "bg-emerald-50 text-emerald-700 border-emerald-200"
														: "bg-rose-50 text-rose-700 border-rose-200"
												}`}
											>
												{g.attendanceRate || 0}%
											</Badge>
										</TableCell>

										<TableCell className="text-center font-bold text-sm text-slate-800">
											{g.grade || "-"}
										</TableCell>

										<TableCell className="text-center">
											{g.status === "AMAN" ? (
												<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
													🟢 Aman
												</Badge>
											) : g.status === "PERLU_PERHATIAN" ? (
												<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
													🟡 Perhatian
												</Badge>
											) : (
												<Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">
													⛔ Tidak Aman
												</Badge>
											)}
										</TableCell>

										<TableCell className="text-center">
											{g.isAcc ? (
												<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
													✓ ACC
												</Badge>
											) : (
												<span className="text-xs text-slate-400 italic">
													Belum
												</span>
											)}
										</TableCell>

										<TableCell className="text-right pr-6">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													router.push(`/dashboard/students/${g.studentId}`)
												}
												className="h-8 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1 px-2.5"
											>
												<Eye className="w-3.5 h-3.5" />
												Periksa
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{filteredGrades.length === 0 && (
							<div className="text-center py-12 text-slate-500">
								<HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
								<p className="text-sm font-semibold">
									Tidak ada data nilai mahasiswa ditemukan.
								</p>
								<p className="text-xs text-slate-400 mt-0.5">
									Coba ubah kata kunci pencarian atau filter status yang
									digunakan.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
