"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
	BookOpen, 
	Users, 
	Clock, 
	AlertTriangle, 
	Search, 
	ArrowRight,
	Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-64 text-slate-400 gap-4">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
				Memuat dashboard dosen...
			</div>
		);
	}

	if (!data) {
		return (
			<div className="p-8 text-center text-rose-500">
				Gagal memuat data dashboard.
			</div>
		);
	}

	const filteredGrades = data.courseGrades.filter(g => 
		g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		g.studentNim.toLowerCase().includes(searchQuery.toLowerCase()) ||
		g.courseName.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const studentsMap = new Map<number, {
		id: number,
		name: string,
		nim: string,
		courses: CourseGradeRow[],
		status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN"
	}>();

	filteredGrades.forEach(g => {
		if (!studentsMap.has(g.studentId)) {
			studentsMap.set(g.studentId, {
				id: g.studentId,
				name: g.studentName,
				nim: g.studentNim,
				courses: [],
				status: "AMAN"
			});
		}
		const student = studentsMap.get(g.studentId)!;
		student.courses.push(g);
	});

	Array.from(studentsMap.values()).forEach(student => {
		let badGrades = 0;
		let attentionGrades = 0;
		student.courses.forEach(c => {
			if (c.status === "TIDAK_AMAN") badGrades++;
			if (c.status === "PERLU_PERHATIAN") attentionGrades++;
		});

		if (badGrades > 0) student.status = "TIDAK_AMAN";
		else if (attentionGrades > 0) student.status = "PERLU_PERHATIAN";
		else student.status = "AMAN";
	});

	const groupedStudents = Array.from(studentsMap.values());

	const renderStatusBadge = (status: string) => {
		if (status === "AMAN") {
			return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10">🟢 Aman</Badge>;
		}
		if (status === "TIDAK_AMAN") {
			return <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10">🔴 Tdk Aman</Badge>;
		}
		return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10">🟡 Perhatian</Badge>;
	};

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Dosen
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {user.fullName || user.username}. Berikut ringkasan mata kuliah yang Anda ampu.
					</p>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-[#0517B0]">
							<BookOpen className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">Total Kelas / MK</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">{data.kpi.totalCourses}</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-indigo-500">
							<Users className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">Total Mahasiswa</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">{data.kpi.totalStudents}</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-amber-500">
							<Clock className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">Menunggu ACC</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">{data.kpi.pendingAcc}</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-rose-500">
							<AlertTriangle className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">Kehadiran &lt; 70%</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">{data.kpi.lowAttendance}</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Data Table Section */}
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="border-b border-slate-100 pb-4">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<CardTitle className="text-slate-800">
							Tabel Status Mahasiswa
						</CardTitle>
						<div className="relative w-full md:w-72">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Cari NIM atau Nama Mahasiswa..."
								className="pl-9 bg-white border-slate-200 text-slate-900"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto max-h-[400px]">
						<Table>
							<TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
								<TableRow className="border-slate-200 hover:bg-slate-50">
									<TableHead className="text-slate-500 font-semibold py-3 pl-6">NIM</TableHead>
									<TableHead className="text-slate-500 font-semibold py-3">Nama Mahasiswa</TableHead>
									<TableHead className="text-slate-500 font-semibold py-3 text-center">Jumlah MK Diambil</TableHead>
									<TableHead className="text-slate-500 font-semibold py-3 text-center">Status Keseluruhan</TableHead>
									<TableHead className="text-slate-500 font-semibold text-right py-3 pr-6">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{groupedStudents.map((s) => (
									<TableRow key={s.id} className="border-slate-200 hover:bg-blue-50/50 transition-colors">
										<TableCell className="pl-6 font-medium text-slate-700">
											{s.nim}
										</TableCell>
										<TableCell>
											<div className="text-slate-900 font-semibold">{s.name}</div>
										</TableCell>
										<TableCell className="text-center">
											<span className="font-bold text-slate-700">{s.courses.length} Mata Kuliah</span>
										</TableCell>
										<TableCell className="text-center">
											{renderStatusBadge(s.status)}
										</TableCell>
										<TableCell className="text-right pr-6">
											<button 
												type="button"
												className="text-[#0517B0] hover:text-blue-800 hover:underline text-sm font-medium"
												onClick={() => router.push(`/dashboard/students/${s.id}#panel-dosen`)}
											>
												Periksa Detail
											</button>
										</TableCell>
									</TableRow>
								))}
								{groupedStudents.length === 0 && (
									<TableRow>
										<TableCell colSpan={5} className="h-32 text-center text-slate-500">
											{searchQuery ? "Tidak ada mahasiswa yang cocok dengan pencarian." : "Belum ada mahasiswa yang ditugaskan ke Anda."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
