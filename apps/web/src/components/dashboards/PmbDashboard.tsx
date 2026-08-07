"use client";

import {
	CheckCircle,
	Clock,
	Download,
	LayoutDashboard,
	Plus,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { exportToCSV } from "@/lib/export";

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

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export function PmbDashboard({ data, searchQuery, setSearchQuery, user }: any) {
	const router = useRouter();

	const totalStudents = data.length;
	const countAman = data.filter((s: any) => s.pmb?.status === "AMAN").length;
	const countPerhatian = data.filter(
		(s: any) => s.pmb?.status === "PERLU_PERHATIAN" || !s.pmb?.status,
	).length;
	const countTidakAman = data.filter(
		(s: any) => s.pmb?.status === "TIDAK_AMAN",
	).length;

	const [progressFilter, setProgressFilter] = useState("ALL");

	const handleExport = () => {
		const exportData = data.map((s: any) => ({
			NIM: s.student.nim,
			"Nama Mahasiswa": s.student.name,
			"Formulir Masuk": s.pmb?.formReceived ? "Sudah" : "Belum",
			"Dokumen Lengkap": s.pmb?.documentsComplete ? "Sudah" : "Belum",
			"Data Terinput": s.pmb?.dataInputted ? "Sudah" : "Belum",
			"Follow Up Awal": s.pmb?.initialFollowUp ? "Sudah" : "Belum",
			"Status Checklist PMB":
				s.pmb?.status === "AMAN"
					? "Aman"
					: s.pmb?.status === "TIDAK_AMAN"
						? "Tidak Aman"
						: "Perlu Perhatian",
			Rekomendasi: s.pmb?.rekomendasi || "-",
			"Fee Mitra": s.finance?.vMitra || 0,
			"Fee Koord": s.finance?.vKoordinator || 0,
			"Disetujui Admin PMB": s.pmb?.isAcc ? "Sudah ACC" : "Belum",
		}));
		exportToCSV(
			exportData,
			`Data_PMB_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const renderProgressBadge = (pmb: any) => {
		const completedCount = [
			pmb?.formReceived,
			pmb?.documentsComplete,
			pmb?.dataInputted,
			pmb?.initialFollowUp,
		].filter(Boolean).length;
		const total = 4;

		if (completedCount === total) {
			return (
				<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">
					✅ {completedCount}/{total} Selesai
				</Badge>
			);
		} else if (completedCount > 0) {
			return (
				<Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10">
					⏳ {completedCount}/{total} Proses
				</Badge>
			);
		}
		return (
			<Badge className="bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-100">
				❌ 0/{total} Belum
			</Badge>
		);
	};

	const renderPeminatan = (
		program: string | null,
		subProgram: string | null,
	) => {
		if (!program && !subProgram) return "-";

		let flagUrl = "";
		if (subProgram) {
			const spLower = subProgram.toLowerCase();
			if (spLower.includes("malaysia"))
				flagUrl = "https://flagcdn.com/w20/my.png";
			else if (spLower.includes("taiwan"))
				flagUrl = "https://flagcdn.com/w20/tw.png";
			else if (spLower.includes("timur tengah"))
				flagUrl = "https://flagcdn.com/w20/sa.png";
			else if (spLower.includes("indonesia"))
				flagUrl = "https://flagcdn.com/w20/id.png";
		}

		return (
			<div className="flex items-center gap-2">
				<span className="text-sm">{program || "-"}</span>
				{subProgram && (
					<span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
						{flagUrl && (
							<img
								src={flagUrl}
								alt="flag"
								className="w-3.5 h-2.5 object-cover rounded-[1px]"
							/>
						)}
						<span className="text-xs">{subProgram}</span>
					</span>
				)}
			</div>
		);
	};

	const getProgressStatus = (pmb: any) => {
		const completedCount = [
			pmb?.formReceived,
			pmb?.documentsComplete,
			pmb?.dataInputted,
			pmb?.initialFollowUp,
		].filter(Boolean).length;
		if (completedCount === 4) return "SELESAI";
		if (completedCount > 0) return "PROSES";
		return "BELUM";
	};

	const filteredData = data.filter((s: any) => {
		const matchSearch =
			(s.student?.name || "")
				.toLowerCase()
				.includes(searchQuery.toLowerCase()) ||
			(s.student?.nim || "").toLowerCase().includes(searchQuery.toLowerCase());

		if (progressFilter === "ALL") return matchSearch;
		return matchSearch && getProgressStatus(s.pmb) === progressFilter;
	});

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Divisi PMB
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {user?.username}. Berikut ringkasan data penerimaan
						mahasiswa.
					</p>
				</div>
				<div className="flex items-center gap-3">
					{(user?.role === "pmb" || user?.role === "superadmin") && (
						<Link
							href="/dashboard/students/add"
							className="bg-[#0517B0] hover:bg-blue-800 text-white shadow-md transition-all gap-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background h-10 px-4 py-2"
						>
							<Plus className="w-4 h-4" />
							Tambah Mahasiswa
						</Link>
					)}
					<button
						type="button"
						onClick={handleExport}
						className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
					>
						<Download className="h-4 w-4" />
						Export Data PMB
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
								Data PMB Lengkap (Aman)
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
								PMB Proses (Perhatian)
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
							<p className="text-slate-500 text-sm font-medium">Kendala PMB</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countTidakAman}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="mt-6">
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<CardTitle className="text-slate-800 text-lg">
								Data Mahasiswa
							</CardTitle>
							<div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
								<Select
									value={progressFilter}
									onValueChange={(val) => setProgressFilter(val || "ALL")}
								>
									<SelectTrigger className="w-full sm:w-[180px] bg-white">
										<SelectValue placeholder="Filter Progress" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">Semua Progress</SelectItem>
										<SelectItem value="SELESAI">Selesai (4/4)</SelectItem>
										<SelectItem value="PROSES">Proses</SelectItem>
										<SelectItem value="BELUM">Belum (0/4)</SelectItem>
									</SelectContent>
								</Select>
								<div className="relative w-full sm:w-72">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
									<Input
										placeholder="Cari Nama atau NIM..."
										className="pl-9 bg-white"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-4 sm:p-6">
						<div className="overflow-y-auto max-h-[500px] border border-slate-200 rounded-md">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
									<TableRow className="border-slate-200 hover:bg-slate-50">
										<TableHead className="text-slate-500 font-semibold py-3 min-w-[200px]">
											Nama Mahasiswa
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3">
											Batch
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3">
											Tahun Ajaran
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 min-w-[200px]">
											Program Studi & Peminatan
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3">
											No. HP
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-center py-3">
											Progress PMB
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-right py-3 pr-4">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredData.map((s: any) => (
										<TableRow
											key={s.student.id}
											className="border-slate-200 hover:bg-blue-50/50 transition-colors"
										>
											<TableCell className="font-semibold text-slate-900">
												<div className="flex flex-col">
													<span>{s.student.name}</span>
													<span className="text-xs text-slate-500 font-normal">
														NIM: {s.student.nim || "-"}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-200"
												>
													{s.student.batch || "-"}
												</Badge>
											</TableCell>
											<TableCell className="text-slate-600 font-medium">
												{s.student.academicYear || "-"}
											</TableCell>
											<TableCell className="text-slate-600">
												{renderPeminatan(
													s.student.program,
													s.student.subProgram,
												)}
											</TableCell>
											<TableCell className="text-slate-600 text-sm">
												{s.student.phone || "-"}
											</TableCell>
											<TableCell className="text-center">
												{renderProgressBadge(s.pmb)}
											</TableCell>
											<TableCell className="text-right pr-4">
												<button
													type="button"
													onClick={() =>
														router.push(
															`/dashboard/students/${s.student.id}?context=pmb`,
														)
													}
													className="bg-blue-50 text-[#0517B0] hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
												>
													Periksa
												</button>
											</TableCell>
										</TableRow>
									))}
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
