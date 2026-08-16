"use client";

import {
	CheckCircle,
	Clock,
	Download,
	LayoutDashboard,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

export function CrmDashboard({ data, searchQuery, setSearchQuery, user }: any) {
	const router = useRouter();

	const totalStudents = data.length;
	const countAman = data.filter((s: any) => s.crm?.status === "AMAN").length;
	const countPerhatian = data.filter(
		(s: any) => s.crm?.status === "PERLU_PERHATIAN" || !s.crm?.status,
	).length;
	const countTidakAman = data.filter(
		(s: any) => s.crm?.status === "TIDAK_AMAN",
	).length;

	const handleExport = () => {
		const exportData = data.map((s: any) => ({
			NIM: s.student.nim,
			"Nama Mahasiswa": s.student.name,
			"Monitoring Ortu": s.crm?.isMonitoringParent ? "Selesai" : "Belum",
			"Monitoring Industri": s.crm?.isMonitoringIndustry ? "Selesai" : "Belum",
			"Kendali Vocab": s.crm?.isVocabComplete ? "Selesai" : "Belum",
			"Surat Izin Belajar": s.crm?.hasStudyPermit ? "Ada" : "Tidak",
			"Rekap Kehadiran": s.crm?.practiceAttendance ? "Selesai" : "Belum",
			"Hari Hadir Praktik": s.crm?.practiceDaysPresent || 0,
			"Total Hari Praktik": s.crm?.practiceDaysTotal || 0,
			"Laporan ODS": s.crm?.isOdsReport ? "Selesai" : "Belum",
			"Dokumentasi ODS": s.crm?.odsDocumentation ? "Selesai" : "Belum",
			"Laporan Pramagang": s.crm?.isPrammagangReport ? "Selesai" : "Belum",
			"Dokumentasi Pramagang": s.crm?.isPrammagangDocumentation
				? "Selesai"
				: "Belum",
			"Ada Kasus/Masalah": s.crm?.hasActiveCase ? "Ya" : "Tidak",
			"Status CRM":
				s.crm?.status === "AMAN"
					? "Aman"
					: s.crm?.status === "TIDAK_AMAN"
						? "Tidak Aman"
						: "Perlu Perhatian",
			"Disetujui Admin CRM": s.crm?.isAcc ? "Sudah ACC" : "Belum",
		}));
		exportToCSV(
			exportData,
			`Data_CRM_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const filteredData = data.filter(
		(s: any) =>
			s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.student.nim.includes(searchQuery),
	);

	const renderProgressBadge = (crm: any) => {
		const items = [
			crm?.isMonitoringParent,
			crm?.isMonitoringIndustry,
			crm?.isVocabComplete,
			crm?.hasStudyPermit,
			crm?.practiceAttendance,
			crm?.isOdsReport,
			crm?.odsDocumentation,
			crm?.isPrammagangReport,
			crm?.isPrammagangDocumentation,
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

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Divisi CRM
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {user?.username}. Berikut ringkasan data relasi dan
						kontrak mahasiswa.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleExport}
						className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
					>
						<Download className="h-4 w-4" />
						Export Data CRM
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
								Data CRM Lengkap (Aman)
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
								CRM Proses (Perhatian)
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
							<p className="text-slate-500 text-sm font-medium">Kendala CRM</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countTidakAman}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="mt-6">
				{/* List Mahasiswa dengan Kendala */}
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<CardTitle className="text-slate-800 text-lg">
								Tabel Kelengkapan Mahasiswa
							</CardTitle>
							<div className="relative w-full md:w-72">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
								<Input
									placeholder="Cari NIM atau Nama Mahasiswa..."
									className="pl-9 bg-white"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-4 sm:p-6">
						<div className="overflow-y-auto max-h-[300px] border border-slate-200 rounded-md">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
									<TableRow className="border-slate-200 hover:bg-slate-50">
										<TableHead className="text-slate-500 font-semibold py-3 min-w-[100px]">
											NIM
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 min-w-[150px]">
											Nama
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 whitespace-nowrap">
											Angkatan
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 whitespace-nowrap">
											Tahun Ajar
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 min-w-[180px]">
											Program Studi & Peminatan
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 whitespace-nowrap">
											No WA
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-center py-3 whitespace-nowrap">
											Progress Panel
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
											<TableCell className="font-medium text-slate-700">
												{s.student.nim || "-"}
											</TableCell>
											<TableCell className="text-slate-900 font-semibold">
												{s.student.name || "-"}
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-200"
												>
													{s.student.cohort || "-"}
												</Badge>
											</TableCell>
											<TableCell className="text-slate-600">
												{s.student.academicYear || "-"}
											</TableCell>
											<TableCell className="text-slate-600">
												{s.student.program || "-"}
												{s.student.subProgram
													? ` - ${s.student.subProgram}`
													: ""}
											</TableCell>
											<TableCell className="text-slate-600">
												{s.student.phone || "-"}
											</TableCell>
											<TableCell className="text-center">
												{renderProgressBadge(s.crm)}
											</TableCell>
											<TableCell className="text-right pr-4">
												<button
													type="button"
													onClick={() =>
														router.push(
															`/dashboard/students/${s.student.id}?context=crm`,
														)
													}
													className="text-[#0517B0] hover:text-blue-800 hover:underline text-sm font-medium"
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
