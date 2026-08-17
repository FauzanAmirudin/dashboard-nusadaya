"use client";

import {
	Archive,
	Calendar,
	CheckCircle,
	CheckCircle2,
	CheckSquare,
	Clock,
	Download,
	Edit,
	Eye,
	FileText,
	Filter,
	GraduationCap,
	HeartHandshake,
	HelpCircle,
	Layers,
	LayoutDashboard,
	Phone,
	Plane,
	Plus,
	RefreshCw,
	Search,
	ShieldAlert,
	ShieldCheck,
	UserCheck,
	UserPlus,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MagangDashboard } from "@/components/dashboards/MagangDashboard";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
		studentStatus?: string | null;
	};
	pmb: { status: string | null; isAcc: boolean | null } | null;
	crm: { status: string | null; isAcc: boolean | null } | null;
	finance: { status: string | null; isAcc: boolean | null } | null;
	academic: { status: string | null; isAcc: boolean | null } | null;
	pa: { status: string | null; isAcc: boolean | null } | null;
	internship: { status: string | null; isAcc: boolean | null } | null;
	decision: {
		isApprovedByDirector: boolean | null;
		evaluatorDecision?: string | null;
		departureDate?: string | null;
		notes?: string | null;
	} | null;
	courseGrades?: Array<{
		id: number | string;
		isAcc?: boolean;
		attendancePresent?: number;
		totalMeetings?: number;
	}>;
};

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
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");

	// Cohort years starting from 2022 downwards
	const cohortYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from(
			{ length: currentYear - 2022 + 2 },
			(_, i) => currentYear + 1 - i,
		);
	}, []);

	const fetchStudents = async () => {
		try {
			const { data: resData, error } = await api.students.get();
			if (!error && resData?.data) {
				setData(resData.data as unknown as StudentData[]);
			}
		} catch (err) {
			console.error("Failed to load students", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		fetchStudents();
		const interval = setInterval(fetchStudents, 15000);
		return () => clearInterval(interval);
	}, [isAuthenticated, hasHydrated, router]);

	// Helper for calculating accurate overall real-time status
	const getRealtimeOverallStatus = (s: StudentData) => {
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

	// Helper for checking module ACC details
	const getStudentAccDetails = (s: StudentData) => {
		const isDosenAcc =
			s.courseGrades &&
			s.courseGrades.length > 0 &&
			s.courseGrades.every((g) => g.isAcc);

		const modules = [
			{
				key: "pmb",
				name: "PMB",
				isAcc: Boolean(s.pmb?.isAcc),
				status: s.pmb?.status || "PERLU_PERHATIAN",
			},
			{
				key: "crm",
				name: "CRM",
				isAcc: Boolean(s.crm?.isAcc),
				status: s.crm?.status || "PERLU_PERHATIAN",
			},
			{
				key: "finance",
				name: "Finance",
				isAcc: Boolean(s.finance?.isAcc),
				status: s.finance?.status || "PERLU_PERHATIAN",
			},
			{
				key: "academic",
				name: "Akademik",
				isAcc: Boolean(s.academic?.isAcc),
				status: s.academic?.status || "PERLU_PERHATIAN",
			},
			{
				key: "dosen",
				name: "Dosen MK",
				isAcc: Boolean(isDosenAcc),
				status: isDosenAcc ? "AMAN" : "PERLU_PERHATIAN",
			},
			{
				key: "pa",
				name: "PA",
				isAcc: Boolean(s.pa?.isAcc),
				status: s.pa?.status || "PERLU_PERHATIAN",
			},
			{
				key: "internship",
				name: "Magang",
				isAcc: Boolean(s.internship?.isAcc),
				status: s.internship?.status || "PERLU_PERHATIAN",
			},
		];

		const accCount = modules.filter((m) => m.isAcc).length;
		return { modules, accCount, isAllAcc: accCount === 7 };
	};

	// Filtered students by Cohort, Status, and Search
	const filteredData = useMemo(() => {
		return data.filter((s) => {
			const matchSearch =
				!searchQuery ||
				s.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.student?.nim?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.student?.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.student?.program?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchCohort =
				selectedCohort === "all" ||
				s.student?.cohort?.toString() === selectedCohort;

			const rtStatus = getRealtimeOverallStatus(s);
			const { isAllAcc } = getStudentAccDetails(s);
			let matchStatus = true;
			if (selectedStatus === "aman") matchStatus = rtStatus === "AMAN";
			if (selectedStatus === "perhatian")
				matchStatus = rtStatus === "PERLU_PERHATIAN";
			if (selectedStatus === "tidak_aman")
				matchStatus = rtStatus === "TIDAK_AMAN";
			if (selectedStatus === "acc_lengkap") matchStatus = isAllAcc;
			if (selectedStatus === "layak_berangkat")
				matchStatus =
					s.decision?.evaluatorDecision === "layak_berangkat" ||
					s.decision?.isApprovedByDirector === true;

			return matchSearch && matchCohort && matchStatus;
		});
	}, [data, searchQuery, selectedCohort, selectedStatus]);

	const cohortData = useMemo(() => {
		if (selectedCohort === "all") return data;
		return data.filter((s) => s.student?.cohort?.toString() === selectedCohort);
	}, [data, selectedCohort]);

	// KPI Stats based on selected cohort
	const totalStudents = cohortData.length;
	const countAman = cohortData.filter(
		(s) => getRealtimeOverallStatus(s) === "AMAN",
	).length;
	const countPerhatian = cohortData.filter(
		(s) => getRealtimeOverallStatus(s) === "PERLU_PERHATIAN",
	).length;
	const countTidakAman = cohortData.filter(
		(s) => getRealtimeOverallStatus(s) === "TIDAK_AMAN",
	).length;
	const countAccLengkap = cohortData.filter(
		(s) => getStudentAccDetails(s).isAllAcc,
	).length;
	const countLayakBerangkat = cohortData.filter(
		(s) =>
			s.decision?.evaluatorDecision === "layak_berangkat" ||
			s.decision?.isApprovedByDirector === true,
	).length;

	const handleExport = () => {
		if (data.length > 0) {
			const exportData = filteredData.map((s) => {
				const { accCount } = getStudentAccDetails(s);
				return {
					NIM: s.student.nim,
					"Nama Mahasiswa": s.student.name,
					"Program Studi": s.student.program,
					Angkatan: s.student.cohort,
					"No HP": s.student.phone || "-",
					"Progress ACC": `${accCount}/7 Modul`,
					"Status PMB": s.pmb?.status || "-",
					"Status CRM": s.crm?.status || "-",
					"Status Finance": s.finance?.status || "-",
					"Status Akademik": s.academic?.status || "-",
					"Status PA": s.pa?.status || "-",
					"Status Magang": s.internship?.status || "-",
					"Status Keseluruhan": getRealtimeOverallStatus(s),
					"Keputusan Evaluator": s.decision?.evaluatorDecision || "menunggu",
					"Disetujui Direktur": s.decision?.isApprovedByDirector
						? "Ya"
						: "Belum",
					"Tgl Keberangkatan": s.decision?.departureDate
						? new Date(s.decision.departureDate).toLocaleDateString("id-ID")
						: "-",
				};
			});
			exportToCSV(
				exportData,
				`Data_Semua_Mahasiswa_${new Date().toISOString().split("T")[0]}`,
			);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-80 gap-3 text-slate-500">
				<RefreshCw className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-sm font-semibold">Memuat data mahasiswa...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-12">
			{/* Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
							<Users className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Semua Mahasiswa
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Pusat data master mahasiswa, status kelengkapan 7 divisi, dan
								manajemen akun.
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

					{(user?.role === "superadmin" || user?.role === "pmb") && (
						<Link href="/dashboard/students/archive">
							<Button
								variant="outline"
								size="sm"
								className="border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100 text-xs gap-1.5 h-9 font-semibold"
							>
								<Archive className="w-3.5 h-3.5 text-amber-700" />
								Arsip
							</Button>
						</Link>
					)}

					{(user?.role === "superadmin" || user?.role === "pmb") && (
						<Link href="/dashboard/students/add">
							<Button
								size="sm"
								className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-9 font-bold shadow-sm"
							>
								<UserPlus className="w-3.5 h-3.5" />
								Tambah Mahasiswa
							</Button>
						</Link>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
					>
						<Download className="w-3.5 h-3.5" />
						Export CSV
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-blue-50 text-[#0517B0] mt-0.5">
							<Users className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Total Mahasiswa
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{totalStudents}
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
								ACC Lengkap 7/7
							</p>
							<p className="text-2xl font-black text-emerald-900 mt-0.5">
								{countAccLengkap}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-emerald-50 text-emerald-500 mt-0.5">
							<CheckCircle className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								🟢 Status Aman
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countAman}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-amber-50 text-amber-500 mt-0.5">
							<Clock className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								🟡 Perlu Perhatian
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countPerhatian}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-rose-50 text-rose-500 mt-0.5">
							<XCircle className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								⛔ Tidak Aman
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countTidakAman}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-indigo-600">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
							<Plane className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Layak Berangkat
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countLayakBerangkat}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Master Table Card */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<Users className="w-4 h-4 text-[#0517B0]" />
							Daftar Master Mahasiswa
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Menampilkan {filteredData.length} dari {totalStudents} mahasiswa
							terdaftar.
						</p>
					</div>

					{/* Filters & Search */}
					<div className="flex flex-wrap items-center gap-2.5">
						<div className="relative w-full sm:w-60">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari NIM, Nama, No HP..."
								className="pl-9 h-9 text-xs bg-white border-slate-200"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						<Select
							value={selectedCohort}
							onValueChange={(val) => setSelectedCohort(val || "all")}
						>
							<SelectTrigger className="w-[125px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Angkatan" />
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

						<Select
							value={selectedStatus}
							onValueChange={(val) => setSelectedStatus(val || "all")}
						>
							<SelectTrigger className="w-[135px] h-9 text-xs bg-white border-slate-200">
								<SelectValue placeholder="Status Filter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Status</SelectItem>
								<SelectItem value="aman">🟢 Aman</SelectItem>
								<SelectItem value="perhatian">🟡 Perlu Perhatian</SelectItem>
								<SelectItem value="tidak_aman">🔴 Tidak Aman</SelectItem>
								<SelectItem value="acc_lengkap">🛡️ ACC Lengkap (7/7)</SelectItem>
								<SelectItem value="layak_berangkat">
									✈️ Layak Berangkat
								</SelectItem>
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
										Nama Lengkap & Program
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
										Kontak (No HP)
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
										Progress 7 Modul
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-48">
										Status Divisi (P C F A D PA M)
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
										Kondisi
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
										Keputusan Final
									</TableHead>
									<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-36">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredData.map((s) => {
									const { modules, accCount, isAllAcc } =
										getStudentAccDetails(s);
									const rtStatus = getRealtimeOverallStatus(s);

									return (
										<TableRow
											key={s.student.id}
											className="border-slate-100 hover:bg-blue-50/40 transition-colors"
										>
											<TableCell className="font-mono text-xs font-bold text-slate-700">
												{s.student.nim || "-"}
											</TableCell>
											<TableCell>
												<div className="font-bold text-slate-900 text-sm">
													{s.student.name}
												</div>
												<div className="flex items-center gap-2 mt-0.5">
													<Badge
														variant="outline"
														className="text-[10px] px-1.5 py-0 text-slate-500 border-slate-200"
													>
														Angkatan {s.student.cohort}
													</Badge>
													<span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
														{s.student.program || "-"}
													</span>
												</div>
											</TableCell>

											<TableCell className="text-xs text-slate-600 font-mono">
												{s.student.phone ? (
													<span className="inline-flex items-center gap-1.5 text-slate-700">
														<Phone className="w-3 h-3 text-slate-400" />
														{s.student.phone}
													</span>
												) : (
													<span className="text-slate-400 italic">-</span>
												)}
											</TableCell>

											{/* Progress Bar with Enhanced Tooltip */}
											<TableCell className="text-center">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger className="w-full">
															<div className="flex flex-col items-center gap-1">
																<div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 px-1">
																	<span>{accCount}/7 ACC</span>
																	<span
																		className={
																			isAllAcc
																				? "text-emerald-600"
																				: "text-slate-500"
																		}
																	>
																		{Math.round((accCount / 7) * 100)}%
																	</span>
																</div>
																<div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
																	<div
																		className={`h-full rounded-full transition-all duration-300 ${
																			isAllAcc
																				? "bg-emerald-500"
																				: accCount >= 4
																					? "bg-blue-500"
																					: "bg-amber-500"
																		}`}
																		style={{
																			width: `${(accCount / 7) * 100}%`,
																		}}
																	/>
																</div>
															</div>
														</TooltipTrigger>
														<TooltipContent className="w-64 p-3.5 bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-800 text-xs flex flex-col space-y-2 z-50">
															<div className="flex items-center justify-between border-b border-slate-800 pb-1.5 w-full">
																<span className="font-bold text-slate-100 text-xs">
																	Rincian ACC 7 Divisi:
																</span>
																<span className="text-[11px] font-mono text-emerald-400 font-bold">
																	{accCount}/7 ACC
																</span>
															</div>
															<div className="flex flex-col space-y-1.5 w-full">
																{modules.map((m) => (
																	<div
																		key={m.name}
																		className="flex items-center justify-between text-[11px] w-full"
																	>
																		<span className="text-slate-300 font-medium">
																			{m.name}
																		</span>
																		<span
																			className={`font-semibold ${
																				m.isAcc
																					? "text-emerald-400"
																					: "text-slate-500"
																			}`}
																		>
																			{m.isAcc ? "✓ ACC" : "Belum ACC"}
																		</span>
																	</div>
																))}
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>

											{/* Mini Module Indicators */}
											<TableCell className="text-center">
												<div className="flex items-center justify-center gap-1">
													{modules.map((m) => (
														<TooltipProvider key={m.name}>
															<Tooltip>
																<TooltipTrigger>
																	<span
																		className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black ${
																			m.isAcc
																				? "bg-emerald-100 text-emerald-800 border border-emerald-300"
																				: "bg-slate-100 text-slate-400 border border-slate-200"
																		}`}
																	>
																		{m.name[0]}
																	</span>
																</TooltipTrigger>
																<TooltipContent className="text-xs">
																	<p className="font-semibold">{m.name}</p>
																	<p className="text-[11px] text-slate-300">
																		{m.isAcc ? "Sudah di-ACC" : "Belum ACC"}
																	</p>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													))}
												</div>
											</TableCell>

											{/* Condition Badge */}
											<TableCell className="text-center">
												{rtStatus === "AMAN" ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
														🟢 Aman
													</Badge>
												) : rtStatus === "PERLU_PERHATIAN" ? (
													<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
														🟡 Perhatian
													</Badge>
												) : (
													<Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">
														⛔ Blocking
													</Badge>
												)}
											</TableCell>

											{/* Final Decision Badge */}
											<TableCell className="text-center">
												{s.decision?.evaluatorDecision === "layak_berangkat" ? (
													<Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
														🟢 Layak
													</Badge>
												) : s.decision?.evaluatorDecision === "ttd_kontrak" ? (
													<Badge className="bg-blue-50 text-blue-700 border-blue-300 font-semibold text-xs">
														🔵 Kontrak
													</Badge>
												) : s.decision?.evaluatorDecision ===
													"lanjut_interview" ? (
													<Badge className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs">
														🟡 Interview
													</Badge>
												) : s.decision?.evaluatorDecision === "remedial" ? (
													<Badge className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs">
														🔴 Remedial
													</Badge>
												) : (
													<span className="text-xs text-slate-400 italic">
														Menunggu
													</span>
												)}
											</TableCell>

											{/* Actions */}
											<TableCell className="text-right pr-6">
												<div className="flex items-center justify-end gap-1.5">
													<Button
														size="sm"
														variant="outline"
														onClick={() =>
															router.push(`/dashboard/students/${s.student.id}`)
														}
														className="h-8 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1 px-2.5"
													>
														<Eye className="w-3.5 h-3.5" />
														Periksa
													</Button>
													{(user?.role === "superadmin" ||
														user?.role === "pmb") && (
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																router.push(
																	`/dashboard/students/${s.student.id}/edit`,
																)
															}
															className="h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2"
															title="Edit Data Mahasiswa"
														>
															<Edit className="w-3.5 h-3.5" />
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>

						{filteredData.length === 0 && (
							<div className="text-center py-12 text-slate-500">
								<HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
								<p className="text-sm font-semibold">
									Tidak ada data mahasiswa ditemukan.
								</p>
								<p className="text-xs text-slate-400 mt-0.5">
									Coba ubah kata kunci pencarian atau filter yang digunakan.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
