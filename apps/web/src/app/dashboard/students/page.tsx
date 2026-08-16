"use client";

import { CheckCircle, CheckSquare, Clock, Download, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { useAuthStore } from "@/store";

type StudentData = {
	student: {
		id: number;
		nim: string;
		name: string;
		cohort: number;
		program: string;
		phone?: string;
		overallStatus: string | null;
	};
	pmb: { status: string | null; isAcc: boolean | null } | null;
	crm: { status: string | null; isAcc: boolean | null } | null;
	finance: { status: string | null; isAcc: boolean | null } | null;
	academic: { status: string | null; isAcc: boolean | null } | null;
	pa: { status: string | null; isAcc: boolean | null } | null;
	internship: { status: string | null; isAcc: boolean | null } | null;
	decision: { isApprovedByDirector: boolean | null } | null;
};

const STATUS_COLORS = {
	AMAN: {
		bg: "bg-emerald-500/10",
		text: "text-emerald-500",
		border: "border-emerald-500/20",
	},
	PERLU_PERHATIAN: {
		bg: "bg-amber-500/10",
		text: "text-amber-500",
		border: "border-amber-500/20",
	},
	TIDAK_AMAN: {
		bg: "bg-rose-500/10",
		text: "text-rose-500",
		border: "border-rose-500/20",
	},
};

import { MagangDashboard } from "@/components/dashboards/MagangDashboard";

export default function StudentsPage() {
	const { user } = useAuthStore();
	if (user?.role === "magang") {
		return <MagangDashboard hideHeader={true} />;
	}
	return <StudentsMaster />;
}

function StudentsMaster() {
	const router = useRouter();
	const { isAuthenticated, hasHydrated, user } = useAuthStore();

	const [data, setData] = useState<StudentData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		const fetchStudents = async () => {
			const { data: resData, error } = await api.students.get();
			if (!error && resData?.data) {
				setData(resData.data as unknown as StudentData[]);
			}
			setIsLoading(false);
		};

		fetchStudents();
		const interval = setInterval(fetchStudents, 15000);
		return () => clearInterval(interval);
	}, [isAuthenticated, hasHydrated, router]);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full text-slate-400">
				Memuat data...
			</div>
		);
	}

	const getRealtimeOverallStatus = (s: any) => {
		const panels = [
			s.pmb?.isAcc ? "AMAN" : s.pmb?.status || "PERLU_PERHATIAN",
			s.crm?.isAcc ? "AMAN" : s.crm?.status || "PERLU_PERHATIAN",
			s.finance?.isAcc ? "AMAN" : s.finance?.status || "PERLU_PERHATIAN",
			s.academic?.isAcc ? "AMAN" : s.academic?.status || "PERLU_PERHATIAN",
			s.pa?.isAcc ? "AMAN" : s.pa?.status || "PERLU_PERHATIAN",
			s.internship?.isAcc ? "AMAN" : s.internship?.status || "PERLU_PERHATIAN",
		];

		if (panels.includes("TIDAK_AMAN")) return "TIDAK_AMAN";
		if (panels.includes("PERLU_PERHATIAN")) return "PERLU_PERHATIAN";
		return "AMAN";
	};

	const calculateProgress = (s: any, currentRole: string | undefined) => {
		if (currentRole === "superadmin" || currentRole === "evaluator") {
			let totalCompleted = 0;
			let totalIndicators = 0;
			
			const pmbItems = [s.pmb?.formReceived, s.pmb?.documentsComplete, s.pmb?.dataInputted, s.pmb?.initialFollowUp];
			totalCompleted += pmbItems.filter(Boolean).length; totalIndicators += 4;
			
			const crmItems = [s.crm?.odsActive, s.crm?.studentMonitoring, s.crm?.parentFollowUp, s.crm?.practiceAttendance, s.crm?.odsDocumentation];
			totalCompleted += crmItems.filter(Boolean).length; totalIndicators += 5;
			
			const financeItems = [s.finance?.registrasiStatus, s.finance?.mandiriSemesterStatus || s.finance?.t1SemesterStatus, s.finance?.toeicStatus, s.finance?.pasporStatus];
			totalCompleted += financeItems.filter(Boolean).length; totalIndicators += 4;
			
			let totalPertemuan = 0;
			let totalHadir = 0;
			if (s.courseGrades) {
				s.courseGrades.forEach((c: any) => {
					totalPertemuan += (c.totalMeetings || 16);
					totalHadir += (c.attendancePresent || 0);
				});
			}
			const attendanceOk = totalPertemuan > 0 && (totalHadir / totalPertemuan) >= 0.8;
			const academicItems = [s.academic?.pddiktiInput, attendanceOk, s.academic?.utsPassed, s.academic?.uasPassed, s.academic?.attitudeIndicator, s.academic?.assignmentsCompleted, s.academic?.academicCommunication];
			totalCompleted += academicItems.filter(Boolean).length; totalIndicators += 7;
			
			const paItems = [s.pa?.interview1Completed, s.pa?.interview2Completed, s.pa?.interview3Completed, s.pa?.tripartiteMeetingCompleted];
			totalCompleted += paItems.filter(Boolean).length; totalIndicators += 4;
			
			const internshipItems = [s.internship?.pembekalanStatus, s.internship?.cvStatus, s.internship?.penempatanStatus, s.internship?.dokumenLengkap];
			totalCompleted += internshipItems.filter(Boolean).length; totalIndicators += 4;
			
			return { completed: totalCompleted, total: totalIndicators, label: "Progress Keseluruhan" };
		}
		
		if (currentRole === "pmb") {
			const items = [s.pmb?.formReceived, s.pmb?.documentsComplete, s.pmb?.dataInputted, s.pmb?.initialFollowUp];
			return { completed: items.filter(Boolean).length, total: 4, label: "Progress PMB" };
		}
		if (currentRole === "crm") {
			const items = [s.crm?.odsActive, s.crm?.studentMonitoring, s.crm?.parentFollowUp, s.crm?.practiceAttendance, s.crm?.odsDocumentation];
			return { completed: items.filter(Boolean).length, total: 5, label: "Progress CRM" };
		}
		if (currentRole === "finance") {
			const items = [s.finance?.registrasiStatus, s.finance?.mandiriSemesterStatus || s.finance?.t1SemesterStatus, s.finance?.toeicStatus, s.finance?.pasporStatus];
			return { completed: items.filter(Boolean).length, total: 4, label: "Progress Finance" };
		}
		if (currentRole === "akademik") {
			let totalPertemuan = 0;
			let totalHadir = 0;
			if (s.courseGrades) {
				s.courseGrades.forEach((c: any) => {
					totalPertemuan += (c.totalMeetings || 16);
					totalHadir += (c.attendancePresent || 0);
				});
			}
			const attendanceOk = totalPertemuan > 0 && (totalHadir / totalPertemuan) >= 0.8;
			
			const items = [s.academic?.pddiktiInput, attendanceOk, s.academic?.utsPassed, s.academic?.uasPassed, s.academic?.attitudeIndicator, s.academic?.assignmentsCompleted, s.academic?.academicCommunication];
			return { completed: items.filter(Boolean).length, total: 7, label: "Progress Akademik" };
		}
		if (currentRole === "pa") {
			const items = [s.pa?.interview1Completed, s.pa?.interview2Completed, s.pa?.interview3Completed, s.pa?.tripartiteMeetingCompleted];
			return { completed: items.filter(Boolean).length, total: 4, label: "Progress PA" };
		}
		if (currentRole === "magang") {
			const items = [s.internship?.pembekalanStatus, s.internship?.cvStatus, s.internship?.penempatanStatus, s.internship?.dokumenLengkap];
			return { completed: items.filter(Boolean).length, total: 4, label: "Progress Magang" };
		}
		
		return { completed: 0, total: 0, label: "Progress" };
	};

	const handleExport = () => {
		const exportData = data.map((s: any) => {
			const rtStatus = getRealtimeOverallStatus(s);
			return {
				NIM: s.student.nim,
				"Nama Mahasiswa": s.student.name,
				"Status Keseluruhan":
					rtStatus === "AMAN"
						? "Aman"
						: rtStatus === "TIDAK_AMAN"
							? "Tidak Aman"
							: "Perlu Perhatian",
				"Status PMB": s.pmb?.status || "-",
				"Status CRM": s.crm?.status || "-",
				"Status Finance": s.finance?.status || "-",
				"Status Akademik": s.academic?.status || "-",
				"Status PA": s.pa?.status || "-",
				"Status Magang": s.internship?.status || "-",
				"Disetujui Direktur": s.decision?.isApprovedByDirector ? "Ya" : "Belum",
			};
		});
		exportToCSV(
			exportData,
			`Data_Semua_Mahasiswa_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const filteredData = data.filter(
		(s) =>
			s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.student.nim.includes(searchQuery),
	);

	const renderStatusIcon = (status: string | null | undefined) => {
		if (status === "AMAN")
			return <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />;
		if (status === "TIDAK_AMAN")
			return <XCircle className="h-4 w-4 text-rose-500 mx-auto" />;
		return <Clock className="h-4 w-4 text-amber-500 mx-auto" />;
	};

	const role = useAuthStore.getState().user?.role;
	const isSuperOrEvaluator = role === "superadmin" || role === "evaluator";

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Semua Mahasiswa</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Daftar lengkap seluruh mahasiswa beserta status tiap panel.
					</p>
				</div>
				<div className="flex items-center gap-3">
					{(useAuthStore.getState().user?.role === "superadmin" ||
						useAuthStore.getState().user?.role === "pmb") && (
						<Link
							href="/dashboard/students/archive"
							className="bg-amber-100 hover:bg-amber-200 text-amber-800 shadow-sm transition-all gap-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background h-10 px-4 py-2"
						>
							Lihat Arsip
						</Link>
					)}
					{useAuthStore.getState().user?.role === "superadmin" && (
						<>
							<Link
								href="/dashboard/students/add"
								className="bg-[#0517B0] hover:bg-blue-800 text-white shadow-md transition-all gap-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background h-10 px-4 py-2"
							>
								<span className="text-lg leading-none mb-0.5">+</span>
								Tambah Mahasiswa
							</Link>
							<button
								type="button"
								onClick={handleExport}
								className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
							>
								<Download className="h-4 w-4" />
								Export Data
							</button>
						</>
					)}
				</div>
			</div>

			{/* Master Table */}
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<CardTitle className="text-slate-800">
						Tabel Master Mahasiswa
					</CardTitle>
					<div className="flex items-center gap-2 w-full sm:w-auto relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<Input
							placeholder="Cari NIM atau Nama..."
							className="bg-white border-slate-200 text-slate-900 w-full sm:w-[250px] pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<Table>
						<TableHeader className="border-slate-200">
							<TableRow className="border-slate-200 hover:bg-transparent">
								<TableHead className="text-slate-500">Nama Lengkap</TableHead>
								<TableHead className="text-slate-500 text-center">Angkatan</TableHead>
								<TableHead className="text-slate-500">Peminatan</TableHead>
								<TableHead className="text-slate-500">No HP</TableHead>
								<TableHead className="text-slate-500 min-w-[200px]">Progress Validasi</TableHead>
								<TableHead className="text-slate-500 text-right">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredData.map((s) => {
								const { completed, total, label } = calculateProgress(s, role);
								return (
									<TableRow
										key={s.student.id}
										className="border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
										onClick={() =>
											router.push(`/dashboard/students/${s.student.id}`)
										}
									>
										<TableCell className="text-slate-900 font-semibold">
											<div>{s.student.name}</div>
											<div className="text-xs text-slate-500 font-normal mt-0.5">{s.student.nim}</div>
										</TableCell>
										<TableCell className="text-center">
											<Badge
												variant="outline"
												className="text-slate-500 border-slate-200"
											>
												{s.student.cohort}
											</Badge>
										</TableCell>
										<TableCell className="text-slate-700">
											{s.student.program || "-"}
										</TableCell>
										<TableCell className="text-slate-700">
											{s.student.phone || "-"}
										</TableCell>
										<TableCell>
											{(() => {
												const isDone = completed === (total || 1);
												const colorClass = isDone 
													? "bg-emerald-50 text-emerald-600 border-emerald-200" 
													: completed > 0 
														? "bg-amber-50 text-amber-600 border-amber-200"
														: "bg-slate-50 text-slate-500 border-slate-200";
												return (
													<div className="flex flex-col gap-1 w-full pr-4">
														<div className="text-[11px] text-slate-500 font-medium">{label}</div>
														<Badge variant="outline" className={`w-fit flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border rounded-full shadow-sm ${colorClass}`}>
															<CheckSquare className="w-3.5 h-3.5" />
															{completed}/{total || 1} Selesai
														</Badge>
													</div>
												);
											})()}
										</TableCell>
										<TableCell className="text-right">
											<button
												type="button"
												className="text-[#0517B0] hover:text-blue-800 text-sm font-medium transition-colors"
											>
												Detail
											</button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>

					{filteredData.length === 0 && (
						<div className="text-center py-12 text-slate-500">
							Tidak ada data mahasiswa ditemukan.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
