"use client";

import {
	AlertTriangle,
	ArrowRight,
	Clock,
	Download,
	LayoutDashboard,
	PlaneTakeoff,
	Search,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";
import { useAuthStore } from "@/store";

interface DashboardData {
	kpi: {
		totalStudents: number;
		readyToDepart: number;
		processing: number;
		actionNeeded: number;
	};
	students: Array<{
		id: number;
		nim: string;
		name: string;
		program: string;
		subProgram: string | null;
		cohort: number;
		academicYear: string | null;
		phone: string | null;
		destinationCity: string;
		internshipCompany: string;
		estDepartureDate?: string;
		passportReady?: boolean;
		visaReady?: boolean;
		mcuReady?: boolean;
		completedDocs: number;
		totalDocs?: number;
		status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	}>;
}

export function MagangDashboard({
	hideHeader = false,
}: {
	hideHeader?: boolean;
} = {}) {
	const router = useRouter();
	const { user } = useAuthStore();
	const [data, setData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedSubProgram, setSelectedSubProgram] = useState<string>("all");

	useEffect(() => {
		const fetchDashboard = async () => {
			setIsLoading(true);
			// Currently not implementing search on backend for simplicity in this iteration,
			// but we will filter on the frontend for now or just fetch all.
			// Let's assume frontend filtering for small data size.
			const { data: res, error } = await api.magang.dashboard.get();
			if (!error && res?.data) {
				setData(res.data as unknown as DashboardData);
			}
			setIsLoading(false);
		};

		fetchDashboard();
	}, []);

	const handleExport = async () => {
		const { data: resData } = await api.students.get();
		if (resData?.data) {
			const exportData = (resData.data as any[]).map((s: any) => ({
				NIM: s.student.nim,
				"Nama Mahasiswa": s.student.name,
				Paspor: s.internship?.passportReady ? "Selesai" : "Belum",
				Visa: s.internship?.visaReady ? "Selesai" : "Belum",
				MCU: s.internship?.mcuReady ? "Selesai" : "Belum",
				Tiket: s.internship?.ticketReady ? "Selesai" : "Belum",
				LoA: s.internship?.loaConfirmed ? "Selesai" : "Belum",
				"Kontrak Kerja": s.internship?.contractReady ? "Selesai" : "Belum",
				Interview: s.internship?.interviewReady ? "Selesai" : "Belum",
				"Hotel/Perusahaan": s.internship?.internshipCompany || "-",
				"Estimasi Keberangkatan": s.internship?.estDepartureDate
					? new Date(s.internship.estDepartureDate).toLocaleDateString()
					: s.decision?.departureDate
						? new Date(s.decision.departureDate).toLocaleDateString()
						: "-",
				"Disetujui Admin Magang": s.internship?.isAcc ? "Sudah ACC" : "Belum",
			}));
			exportToCSV(
				exportData,
				`Data_Magang_${new Date().toISOString().split("T")[0]}`,
			);
		}
	};

	if (isLoading && !data) {
		return (
			<div className="flex justify-center items-center h-64 text-slate-500">
				Memuat dashboard Magang...
			</div>
		);
	}

	if (!data) return null;

	const cohorts = Array.from(
		new Set(data.students.map((s) => s.cohort).filter(Boolean)),
	).sort((a, b) => b - a);

	// Peminatan sudah ditetapkan, jadi kita gunakan daftar tetap (hardcoded)
	const subPrograms = [
		{ value: "Malaysia-Hospitality", flag: "https://flagcdn.com/w20/my.png" },
		{ value: "Taiwan-Hospitality", flag: "https://flagcdn.com/w20/tw.png" },
		{ value: "Timur tengah-Barista", flag: "https://flagcdn.com/w20/sa.png" },
		{ value: "Indonesia-Reguler", flag: "https://flagcdn.com/w20/id.png" },
	];

	const filteredStudents = data.students.filter((s) => {
		const matchSearch =
			s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.nim.toLowerCase().includes(searchQuery.toLowerCase());
		const matchCohort =
			selectedCohort === "all" || s.cohort?.toString() === selectedCohort;
		const matchSubProgram =
			selectedSubProgram === "all" || s.subProgram === selectedSubProgram;
		return matchSearch && matchCohort && matchSubProgram;
	});

	const computedKpi = {
		totalStudents: filteredStudents.length,
		readyToDepart: filteredStudents.filter((s) => s.status === "AMAN").length,
		processing: filteredStudents.filter((s) => s.status === "PERLU_PERHATIAN")
			.length,
		actionNeeded: filteredStudents.filter((s) => s.status === "TIDAK_AMAN")
			.length,
	};

	return (
		<div className="space-y-6 pb-10">
			{!hideHeader && (
				<>
					{/* Header */}
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Dashboard Tim Magang Internasional
							</h1>
							<p className="text-slate-500 mt-1 text-sm">
								Selamat datang, {(user as any)?.fullName || user?.username}.
								Pantau progres dokumen keberangkatan mahasiswa.
							</p>
						</div>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={handleExport}
								className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
							>
								<Download className="h-4 w-4" />
								Export Data Magang
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
										{computedKpi.totalStudents}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
							<CardContent className="p-5 flex items-start gap-4">
								<div className="mt-0.5 text-emerald-500">
									<PlaneTakeoff className="h-6 w-6" />
								</div>
								<div>
									<p className="text-slate-500 text-sm font-medium">
										Siap Berangkat (Aman)
									</p>
									<p className="text-3xl font-bold text-slate-900 mt-1">
										{computedKpi.readyToDepart}
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
										Sedang Proses (Perhatian)
									</p>
									<p className="text-3xl font-bold text-slate-900 mt-1">
										{computedKpi.processing}
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
							<CardContent className="p-5 flex items-start gap-4">
								<div className="mt-0.5 text-rose-500">
									<AlertTriangle className="h-6 w-6" />
								</div>
								<div>
									<p className="text-slate-500 text-sm font-medium">
										Perlu Tindakan (Tdk Aman)
									</p>
									<p className="text-3xl font-bold text-slate-900 mt-1">
										{computedKpi.actionNeeded}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</>
			)}

			{/* Main Content */}
			<div className="grid grid-cols-1 gap-6">
				{/* Table */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1 overflow-hidden">
					<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<CardTitle className="text-slate-800 text-lg">
								Daftar Kesiapan Dokumen Mahasiswa
							</CardTitle>
							<div className="flex flex-col sm:flex-row items-center gap-3">
								<Select
									value={selectedCohort}
									onValueChange={(val) => setSelectedCohort(val || "all")}
								>
									<SelectTrigger className="w-full sm:w-[160px] bg-white">
										<SelectValue placeholder="Angkatan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Semua Angkatan</SelectItem>
										{cohorts.map((c) => (
											<SelectItem key={c} value={c.toString()}>
												Angkatan {c}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select
									value={selectedSubProgram}
									onValueChange={(val) => setSelectedSubProgram(val || "all")}
								>
									<SelectTrigger className="w-full sm:w-[180px] bg-white">
										<SelectValue placeholder="Peminatan" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Semua Peminatan</SelectItem>
										{subPrograms.map((p) => (
											<SelectItem key={p.value} value={p.value}>
												<div className="flex items-center gap-2">
													{/* biome-ignore lint/performance/noImgElement: <explanation> */}
													<img
														src={p.flag}
														alt="flag"
														className="w-4 h-3 object-cover"
													/>
													{p.value}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<div className="relative w-full sm:w-64">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
									<Input
										placeholder="Cari NIM atau Nama..."
										className="pl-9 bg-white"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader className="bg-slate-50">
								<TableRow>
									<TableHead className="font-semibold text-slate-600">
										Nama
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										Angkatan
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										Tahun Ajaran
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										Program Studi/Peminatan
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										No HP
									</TableHead>
									<TableHead className="font-semibold text-slate-600">
										Progres Panel
									</TableHead>
									<TableHead className="text-right font-semibold text-slate-600">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredStudents.length > 0 ? (
									filteredStudents.map((s) => (
										<TableRow key={s.id} className="hover:bg-slate-50/50">
											<TableCell>
												<div className="font-medium text-slate-900">
													{s.name}
												</div>
												<div className="text-xs text-slate-500">{s.nim}</div>
											</TableCell>
											<TableCell className="text-slate-600">
												{s.cohort}
											</TableCell>
											<TableCell className="text-slate-600">
												{s.academicYear || "-"}
											</TableCell>
											<TableCell className="text-slate-600">
												<div>{s.program}</div>
												{s.subProgram && (
													<div className="text-xs text-slate-500">
														{s.subProgram}
													</div>
												)}
											</TableCell>
											<TableCell className="text-slate-600">
												{s.phone || "-"}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium text-slate-700">
														{s.completedDocs}/{s.totalDocs || 23}
													</span>
													<div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
														<div
															className={`h-full rounded-full ${s.completedDocs === (s.totalDocs || 23) ? "bg-emerald-500" : "bg-blue-500"}`}
															style={{
																width: `${(s.completedDocs / (s.totalDocs || 23)) * 100}%`,
															}}
														/>
													</div>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<button
													type="button"
													className="text-[#0517B0] hover:text-blue-800 hover:underline text-sm font-medium"
													onClick={() =>
														router.push(
															`/dashboard/students/${s.id}?context=magang`,
														)
													}
												>
													Periksa
												</button>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-32 text-center text-slate-500"
										>
											Tidak ada mahasiswa ditemukan.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
