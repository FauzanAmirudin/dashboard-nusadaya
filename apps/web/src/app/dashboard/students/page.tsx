"use client";

import { CheckCircle, Clock, Download, Search, XCircle } from "lucide-react";
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

export default function StudentsPage() {
	const router = useRouter();
	const { isAuthenticated, hasHydrated } = useAuthStore();
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

	const handleExport = () => {
		const exportData = data.map((s: any) => ({
			NIM: s.student.nim,
			"Nama Mahasiswa": s.student.name,
			"Status Keseluruhan":
				s.student.overallStatus === "AMAN"
					? "Aman"
					: s.student.overallStatus === "TIDAK_AMAN"
						? "Tidak Aman"
						: "Perlu Perhatian",
			"Status PMB": s.pmb?.status || "-",
			"Status CRM": s.crm?.status || "-",
			"Status Finance": s.finance?.status || "-",
			"Status Akademik": s.academic?.status || "-",
			"Status PA": s.pa?.status || "-",
			"Status Magang": s.internship?.status || "-",
			"Disetujui Direktur": s.decision?.isApprovedByDirector ? "Ya" : "Belum",
		}));
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
								<TableHead className="text-slate-500">NIM</TableHead>
								<TableHead className="text-slate-500">Nama Lengkap</TableHead>
								<TableHead className="text-slate-500">Angkatan</TableHead>
								<TableHead className="text-slate-500 text-center">
									Status
								</TableHead>
								{(isSuperOrEvaluator || role === "pmb") && (
									<TableHead className="text-slate-500 text-center">
										PMB
									</TableHead>
								)}
								{(isSuperOrEvaluator || role === "crm") && (
									<TableHead className="text-slate-500 text-center">
										CRM
									</TableHead>
								)}
								{(isSuperOrEvaluator || role === "finance") && (
									<TableHead className="text-slate-500 text-center">
										Finance
									</TableHead>
								)}
								{(isSuperOrEvaluator || role === "akademik") && (
									<TableHead className="text-slate-500 text-center">
										Akademik
									</TableHead>
								)}
								{(isSuperOrEvaluator || role === "pa") && (
									<TableHead className="text-slate-500 text-center">
										PA
									</TableHead>
								)}
								{(isSuperOrEvaluator || role === "magang") && (
									<TableHead className="text-slate-500 text-center">
										Magang
									</TableHead>
								)}
								{isSuperOrEvaluator && (
									<TableHead className="text-slate-500 text-center">
										Direktur
									</TableHead>
								)}
								<TableHead className="text-slate-500 text-right">
									Aksi
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredData.map((s) => {
								const sColor = s.student.overallStatus
									? STATUS_COLORS[
											s.student.overallStatus as keyof typeof STATUS_COLORS
										]
									: STATUS_COLORS.PERLU_PERHATIAN;

								return (
									<TableRow
										key={s.student.id}
										className="border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
										onClick={() =>
											router.push(`/dashboard/students/${s.student.id}`)
										}
									>
										<TableCell className="font-medium text-slate-700">
											{s.student.nim}
										</TableCell>
										<TableCell className="text-slate-900 font-semibold">
											{s.student.name}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className="text-slate-500 border-slate-200"
											>
												{s.student.cohort}
											</Badge>
										</TableCell>
										<TableCell className="text-center">
											<Badge
												className={`${sColor.bg} ${sColor.text} ${sColor.border} border hover:bg-transparent`}
											>
												{s.student.overallStatus === "AMAN"
													? "🟢 Aman"
													: s.student.overallStatus === "TIDAK_AMAN"
														? "🔴 Tdk Aman"
														: "🟡 Perhatian"}
											</Badge>
										</TableCell>
										{(isSuperOrEvaluator || role === "pmb") && (
											<TableCell>
												{renderStatusIcon(
													s.pmb?.isAcc ? "AMAN" : s.pmb?.status,
												)}
											</TableCell>
										)}
										{(isSuperOrEvaluator || role === "crm") && (
											<TableCell>
												{renderStatusIcon(
													s.crm?.isAcc ? "AMAN" : s.crm?.status,
												)}
											</TableCell>
										)}
										{(isSuperOrEvaluator || role === "finance") && (
											<TableCell>
												{renderStatusIcon(
													s.finance?.isAcc ? "AMAN" : s.finance?.status,
												)}
											</TableCell>
										)}
										{(isSuperOrEvaluator || role === "akademik") && (
											<TableCell>
												{renderStatusIcon(
													s.academic?.isAcc ? "AMAN" : s.academic?.status,
												)}
											</TableCell>
										)}
										{(isSuperOrEvaluator || role === "pa") && (
											<TableCell>
												{renderStatusIcon(s.pa?.isAcc ? "AMAN" : s.pa?.status)}
											</TableCell>
										)}
										{(isSuperOrEvaluator || role === "magang") && (
											<TableCell>
												{renderStatusIcon(
													s.internship?.isAcc ? "AMAN" : s.internship?.status,
												)}
											</TableCell>
										)}
										{isSuperOrEvaluator && (
											<TableCell className="text-center">
												{s.decision?.isApprovedByDirector ? (
													<Badge className="bg-blue-100 text-[#0517B0] hover:bg-blue-100">
														Sudah
													</Badge>
												) : (
													<span className="text-xs text-slate-500">Belum</span>
												)}
											</TableCell>
										)}
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
