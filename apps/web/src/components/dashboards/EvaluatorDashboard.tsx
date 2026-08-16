"use client";

import {
	CheckCircle,
	Clock,
	Download,
	LayoutDashboard,
	Search,
	ShieldCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { exportToCSV } from "@/lib/export";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#64748b"];

export function EvaluatorDashboard({
	data,
	searchQuery,
	setSearchQuery,
	user,
}: any) {
	const router = useRouter();

	const totalStudents = data?.length || 0;
	const countLayak =
		data?.filter(
			(s: any) => s.decision?.evaluatorDecision === "layak_berangkat",
		).length || 0;
	const countLanjut =
		data?.filter(
			(s: any) => s.decision?.evaluatorDecision === "lanjut_interview",
		).length || 0;
	const countTTD =
		data?.filter((s: any) => s.decision?.evaluatorDecision === "ttd_kontrak")
			.length || 0;
	const countRemedial =
		data?.filter((s: any) => s.decision?.evaluatorDecision === "remedial")
			.length || 0;
	const countMenunggu =
		data?.filter(
			(s: any) =>
				s.decision?.evaluatorDecision === "menunggu" ||
				!s.decision?.evaluatorDecision,
		).length || 0;

	// Calculate ACC Lengkap
	const countAccLengkap =
		data?.filter((s: any) => {
			const isDosenAcc =
				s.courseGrades &&
				s.courseGrades.length > 0 &&
				s.courseGrades.every((g: any) => g.isAcc);
			return (
				s.pmb?.isAcc &&
				s.crm?.isAcc &&
				s.finance?.isAcc &&
				s.academic?.isAcc &&
				isDosenAcc &&
				s.pa?.isAcc &&
				s.internship?.isAcc
			);
		}).length || 0;

	const handleExport = () => {
		const exportData = data.map((s: any) => ({
			NIM: s.student.nim,
			"Nama Mahasiswa": s.student.name,
			"Keputusan Evaluator":
				s.decision?.evaluatorDecision === "layak_berangkat"
					? "Layak Berangkat"
					: s.decision?.evaluatorDecision === "remedial"
						? "Remedial/Tunda"
						: s.decision?.evaluatorDecision === "ttd_kontrak"
							? "TTD Kontrak"
							: s.decision?.evaluatorDecision === "lanjut_interview"
								? "Lanjut Interview"
								: "Menunggu Evaluasi",
		}));
		exportToCSV(
			exportData,
			`Data_Evaluator_${new Date().toISOString().split("T")[0]}`,
		);
	};

	const pieData = [
		{ name: "Layak Berangkat", value: countLayak },
		{ name: "TTD Kontrak", value: countTTD },
		{ name: "Lanjut Interview", value: countLanjut },
		{ name: "Remedial", value: countRemedial },
		{ name: "Menunggu", value: countMenunggu },
	];

	const filteredData =
		data?.filter(
			(s: any) =>
				s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.student.nim.includes(searchQuery),
		) || [];

	const renderStatusBadge = (status: string | null | undefined) => {
		switch (status) {
			case "layak_berangkat":
				return (
					<Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10">
						🟢 Layak Berangkat
					</Badge>
				);
			case "ttd_kontrak":
				return (
					<Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/10">
						🔵 TTD Kontrak
					</Badge>
				);
			case "lanjut_interview":
				return (
					<Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10">
						🟡 Lanjut Interview
					</Badge>
				);
			case "remedial":
				return (
					<Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10">
						🔴 Remedial
					</Badge>
				);
			default:
				return (
					<Badge className="bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/10">
						⚪ Menunggu
					</Badge>
				);
		}
	};

	const calculateProgress = (s: any) => {
		let accCount = 0;
		if (s.pmb?.isAcc) accCount++;
		if (s.crm?.isAcc) accCount++;
		if (s.finance?.isAcc) accCount++;
		if (s.academic?.isAcc) accCount++;
		if (s.pa?.isAcc) accCount++;
		if (s.internship?.isAcc) accCount++;
		if (
			s.courseGrades &&
			s.courseGrades.length > 0 &&
			s.courseGrades.every((g: any) => g.isAcc)
		)
			accCount++;
		return accCount;
	};

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Panel Evaluator
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {user?.username || "Evaluator"}. Berikut ringkasan
						keputusan akhir mahasiswa.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleExport}
						className="flex items-center gap-2 bg-[#0517B0] hover:bg-blue-800 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
					>
						<Download className="h-4 w-4" />
						Export Data Evaluator
					</button>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
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
				<Card className="bg-emerald-50 border-emerald-200 shadow-sm border-l-4 border-l-emerald-600">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-emerald-600">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<div>
							<p className="text-emerald-700 text-sm font-bold">ACC Lengkap</p>
							<p className="text-3xl font-bold text-emerald-900 mt-1">
								{countAccLengkap}
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
								Layak Berangkat
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countLayak}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-blue-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-blue-500">
							<CheckCircle className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">TTD Kontrak</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countTTD}
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
								Lanjut Interview
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countLanjut}
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
							<p className="text-slate-500 text-sm font-medium">Remedial</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countRemedial}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex flex-col gap-6">
				{/* List Mahasiswa dengan Keputusan */}
				<Card className="bg-white border-slate-200 shadow-sm w-full">
					<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
						<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<CardTitle className="text-slate-800 text-lg">
								Tabel Keputusan Mahasiswa
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
										<TableHead className="text-slate-500 font-semibold py-3">
											NIM
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3">
											Nama Lengkap
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3">
											Angkatan
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 text-center">
											Progress
										</TableHead>
										<TableHead className="text-slate-500 font-semibold py-3 text-center">
											Blocking
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-center py-3">
											Keputusan
										</TableHead>
										<TableHead className="text-slate-500 font-semibold text-right py-3 pr-4">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredData.map((s: any) => {
										const accCount = calculateProgress(s);
										const isAman = s.student.overallStatus === "AMAN";
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
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className="text-slate-500 border-slate-200"
													>
														{s.student.cohort}
													</Badge>
												</TableCell>
												<TableCell className="text-center w-32">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger className="w-full">
																<div className="flex items-center gap-2 justify-center">
																	<span className="text-sm font-medium text-slate-700">
																		{accCount}/7
																	</span>
																	<div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
																		<div
																			className={`h-full rounded-full ${accCount === 7 ? "bg-emerald-500" : "bg-blue-500"}`}
																			style={{
																				width: `${(accCount / 7) * 100}%`,
																			}}
																		/>
																	</div>
																</div>
															</TooltipTrigger>
															<TooltipContent>
																<p>Progress ACC: {accCount} dari 7 Modul</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</TableCell>
												<TableCell className="text-center">
													{isAman ? (
														<Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200">
															✅ Aman
														</Badge>
													) : (
														<Badge className="bg-rose-50 text-rose-600 border border-rose-200">
															⛔ Blocking
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-center">
													{renderStatusBadge(s.decision?.evaluatorDecision)}
												</TableCell>
												<TableCell className="text-right pr-4">
													<button
														type="button"
														onClick={() =>
															router.push(
																`/dashboard/students/${s.student.id}?context=final-decision`,
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
