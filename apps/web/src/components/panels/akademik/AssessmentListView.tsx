"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	AlertCircle,
	CheckCircle2,
	ClipboardList,
	Clock,
	Download,
	Search,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { API_URL, getToken } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DepartureAssessment {
	id: number;
	studentId: number;
	score: number | null;
	notes: string | null;
	resultFileUrl: string | null;
	resultFileName: string | null;
	resultFileSize: number | null;
	status: "belum_dimulai" | "nilai_diisi" | "pdf_diunggah" | "selesai";
	assessedBy: number | null;
	assessedAt: string | null;
	updatedAt: string;
	createdAt: string;
}

interface StudentWithAssessment {
	id: number;
	name: string;
	nim: string | null;
	program: string;
	subProgram: string | null;
	cohort: number;
	academicYear: string | null;
	period: string | null;
	departureAssessment: DepartureAssessment | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type AssessmentStatus = DepartureAssessment["status"];

const STATUS_LABEL: Record<AssessmentStatus, string> = {
	belum_dimulai: "Belum Dimulai",
	nilai_diisi: "Nilai Diisi",
	pdf_diunggah: "PDF Diunggah",
	selesai: "Selesai",
};

const STATUS_BADGE_CLASS: Record<AssessmentStatus, string> = {
	belum_dimulai: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100",
	nilai_diisi: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
	pdf_diunggah: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
	selesai: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
};

function getEffectiveStatus(s: StudentWithAssessment): AssessmentStatus {
	return s.departureAssessment?.status ?? "belum_dimulai";
}

const PAGE_SIZE = 20;

// ── Component ─────────────────────────────────────────────────────────────────

export function AssessmentListView() {
	const router = useRouter();

	const [students, setStudents] = useState<StudentWithAssessment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const [search, setSearch] = useState("");
	const [programFilter, setProgramFilter] = useState("all");
	const [cohortFilter, setCohortFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);

	// ── Data Fetch ────────────────────────────────────────────────────────────

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`${API_URL}/students/departure-assessments`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			setStudents(json.data ?? []);
		} catch (err) {
			console.error("Assessment fetch error:", err);
			toast.error("Gagal memuat data assessment");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// Reset page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [search, programFilter, cohortFilter, statusFilter]);

	// ── Derived Values ────────────────────────────────────────────────────────

	const programs = Array.from(new Set(students.map((s) => s.program))).sort();
	const cohorts = Array.from(new Set(students.map((s) => s.cohort))).sort(
		(a, b) => b - a,
	);

	const filteredData = students.filter((s) => {
		const effectiveStatus = getEffectiveStatus(s);

		if (search) {
			const q = search.toLowerCase();
			const matchName = s.name.toLowerCase().includes(q);
			const matchNim = s.nim?.toLowerCase().includes(q) ?? false;
			if (!matchName && !matchNim) return false;
		}
		if (programFilter !== "all" && s.program !== programFilter) return false;
		if (cohortFilter !== "all" && s.cohort !== Number(cohortFilter)) return false;
		if (statusFilter !== "all") {
			if (statusFilter === "dalam_proses") {
				if (effectiveStatus !== "nilai_diisi" && effectiveStatus !== "pdf_diunggah")
					return false;
			} else if (effectiveStatus !== statusFilter) {
				return false;
			}
		}
		return true;
	});

	const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
	const safePage = Math.min(currentPage, totalPages);
	const startIdx = (safePage - 1) * PAGE_SIZE;
	const paginatedData = filteredData.slice(startIdx, startIdx + PAGE_SIZE);

	// KPI counts (always from full student list, not filtered)
	const kpiTotal = students.length;
	const kpiSelesai = students.filter((s) => getEffectiveStatus(s) === "selesai").length;
	const kpiDalamProses = students.filter((s) => {
		const st = getEffectiveStatus(s);
		return st === "nilai_diisi" || st === "pdf_diunggah";
	}).length;
	const kpiBelumDimulai = students.filter(
		(s) => getEffectiveStatus(s) === "belum_dimulai",
	).length;

	// ── Export CSV ────────────────────────────────────────────────────────────

	const handleExport = () => {
		if (filteredData.length === 0) {
			toast.error("Tidak ada data untuk diekspor");
			return;
		}
		const exportData = filteredData.map((s) => ({
			Nama: s.name,
			NIM: s.nim ?? "-",
			Program: s.program,
			"Sub Program": s.subProgram ?? "-",
			Angkatan: s.cohort,
			"Tahun Ajaran": s.academicYear ?? "-",
			Periode: s.period ?? "-",
			Nilai: s.departureAssessment?.score ?? "-",
			Status: STATUS_LABEL[getEffectiveStatus(s)],
		}));
		exportToCSV(
			exportData,
			`Assessment_Pra-keberangkatan_${new Date().toISOString().split("T")[0]}`,
		);
		toast.success("Data berhasil diekspor ke CSV");
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="flex items-center gap-3">
					<div
						className="p-2 rounded-lg text-white flex-shrink-0"
						style={{ backgroundColor: "#0517B0" }}
					>
						<ClipboardList className="w-6 h-6" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-slate-900">
							Assessment Pra-keberangkatan
						</h1>
						<p className="text-slate-500 text-sm">
							Monitoring nilai dan status assessment mahasiswa sebelum keberangkatan
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					onClick={handleExport}
					disabled={isLoading || filteredData.length === 0}
				>
					<Download className="w-4 h-4 mr-2" />
					Export CSV
				</Button>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardContent className="p-4 flex items-center gap-3">
						<div
							className="p-2 rounded-lg text-white flex-shrink-0"
							style={{ backgroundColor: "#0517B0" }}
						>
							<Users className="w-5 h-5" />
						</div>
						<div>
							<p className="text-xs text-slate-500">Total Mahasiswa</p>
							<p className="text-2xl font-bold text-slate-900">{kpiTotal}</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardContent className="p-4 flex items-center gap-3">
						<div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
							<CheckCircle2 className="w-5 h-5" />
						</div>
						<div>
							<p className="text-xs text-slate-500">Selesai</p>
							<p className="text-2xl font-bold text-slate-900">{kpiSelesai}</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardContent className="p-4 flex items-center gap-3">
						<div className="p-2 rounded-lg bg-amber-100 text-amber-600 flex-shrink-0">
							<Clock className="w-5 h-5" />
						</div>
						<div>
							<p className="text-xs text-slate-500">Dalam Proses</p>
							<p className="text-2xl font-bold text-slate-900">{kpiDalamProses}</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardContent className="p-4 flex items-center gap-3">
						<div className="p-2 rounded-lg bg-rose-100 text-rose-600 flex-shrink-0">
							<AlertCircle className="w-5 h-5" />
						</div>
						<div>
							<p className="text-xs text-slate-500">Belum Dimulai</p>
							<p className="text-2xl font-bold text-slate-900">{kpiBelumDimulai}</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter Bar */}
			<div className="bg-white rounded-xl border border-slate-200 p-4">
				<div className="flex flex-col sm:flex-row gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
						<Input
							placeholder="Cari nama atau NIM..."
							className="pl-9"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<Select
						value={programFilter}
						onValueChange={(v) => {
							if (v) setProgramFilter(v);
						}}
					>
						<SelectTrigger className="sm:w-52">
							<SelectValue placeholder="Semua Program" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Program</SelectItem>
							{programs.map((p) => (
								<SelectItem key={p} value={p}>
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={cohortFilter}
						onValueChange={(v) => {
							if (v) setCohortFilter(v);
						}}
					>
						<SelectTrigger className="sm:w-40">
							<SelectValue placeholder="Semua Angkatan" />
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
						value={statusFilter}
						onValueChange={(v) => {
							if (v) setStatusFilter(v);
						}}
					>
						<SelectTrigger className="sm:w-44">
							<SelectValue placeholder="Semua Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Status</SelectItem>
							<SelectItem value="belum_dimulai">Belum Dimulai</SelectItem>
							<SelectItem value="dalam_proses">Dalam Proses</SelectItem>
							<SelectItem value="selesai">Selesai</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
				{isLoading ? (
					<div className="flex justify-center items-center py-16 text-slate-400">
						<span className="text-sm">Memuat data...</span>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-slate-50 hover:bg-slate-50">
										<TableHead className="w-10">No</TableHead>
										<TableHead>Nama</TableHead>
										<TableHead>NIM</TableHead>
										<TableHead>Program</TableHead>
										<TableHead>Angkatan</TableHead>
										<TableHead>Tahun Ajaran</TableHead>
										<TableHead className="text-center w-20">Nilai</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Aksi</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedData.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={9}
												className="text-center py-12 text-slate-500"
											>
												{students.length === 0
													? "Belum ada data mahasiswa"
													: "Tidak ada data yang cocok dengan filter"}
											</TableCell>
										</TableRow>
									) : (
										paginatedData.map((s, idx) => {
											const status = getEffectiveStatus(s);
											const score = s.departureAssessment?.score;
											return (
												<TableRow key={s.id} className="hover:bg-blue-50/50">
													<TableCell className="text-slate-400 text-sm">
														{startIdx + idx + 1}
													</TableCell>
													<TableCell className="font-medium text-slate-900">
														{s.name}
													</TableCell>
													<TableCell className="text-slate-600 text-sm">
														{s.nim ?? "-"}
													</TableCell>
													<TableCell>
														<div className="text-sm text-slate-700">{s.program}</div>
														{s.subProgram && (
															<div className="text-xs text-slate-500">{s.subProgram}</div>
														)}
													</TableCell>
													<TableCell className="text-sm text-slate-700">
														{s.cohort}
													</TableCell>
													<TableCell className="text-sm text-slate-600">
														{s.academicYear ?? "-"}
													</TableCell>
													<TableCell className="text-center text-sm font-semibold text-slate-900">
														{score !== null && score !== undefined ? score : "-"}
													</TableCell>
													<TableCell>
														<Badge className={STATUS_BADGE_CLASS[status]}>
															{STATUS_LABEL[status]}
														</Badge>
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																router.push(
																	`/dashboard/akademik/assessment/${s.id}`,
																)
															}
														>
															Detail
														</Button>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>

						{/* Pagination */}
						{filteredData.length > PAGE_SIZE && (
							<div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
								<p className="text-sm text-slate-500">
									Menampilkan{" "}
									<span className="font-medium text-slate-700">
										{startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filteredData.length)}
									</span>{" "}
									dari{" "}
									<span className="font-medium text-slate-700">{filteredData.length}</span>{" "}
									data
								</p>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={safePage <= 1}
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									>
										Prev
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={safePage >= totalPages}
										onClick={() =>
											setCurrentPage((p) => Math.min(totalPages, p + 1))
										}
									>
										Next
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
