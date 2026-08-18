"use client";

import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	CheckCircle2,
	Clock,
	Download,
	Edit3,
	FileCheck,
	FileText,
	GraduationCap,
	HeartHandshake,
	HelpCircle,
	Layers,
	Plane,
	Printer,
	RefreshCw,
	Search,
	ShieldAlert,
	ShieldCheck,
	UserCheck,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { exportToCSV } from "@/lib/export";

interface EvaluasiFinalisasiDashboardProps {
	data: any[];
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	user: any;
	onUpdate?: () => void;
}

export function EvaluasiFinalisasiDashboard({
	data,
	searchQuery,
	setSearchQuery,
	user,
	onUpdate,
}: EvaluasiFinalisasiDashboardProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialTab =
		searchParams.get("tab") === "finalisasi" ? "finalisasi" : "evaluasi";

	const [activeTab, setActiveTab] = useState<string>(initialTab);
	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedDecisionFilter, setSelectedDecisionFilter] =
		useState<string>("all");
	const [selectedStatusFilter, setSelectedStatusFilter] =
		useState<string>("all");
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

	// Quick Decision Modal State
	const [decisionModalOpen, setDecisionModalOpen] = useState(false);
	const [activeStudent, setActiveStudent] = useState<any | null>(null);
	const [selectedDecision, setSelectedDecision] = useState<string>("menunggu");
	const [decisionNotes, setDecisionNotes] = useState<string>("");
	const [isSavingDecision, setIsSavingDecision] = useState(false);

	// Departure Setting Modal State
	const [departureModalOpen, setDepartureModalOpen] = useState(false);
	const [departureStudent, setDepartureStudent] = useState<any | null>(null);
	const [departureDate, setDepartureDate] = useState<string>("");
	const [directorNotes, setDirectorNotes] = useState<string>("");
	const [confidentialNotes, setConfidentialNotes] = useState<string>("");
	const [isSavingDeparture, setIsSavingDeparture] = useState(false);

	// Cohort generation starting from 2022 downwards
	const cohortYears = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from(
			{ length: currentYear - 2022 + 2 },
			(_, i) => currentYear + 1 - i,
		);
	}, []);

	// Helper for calculating 7-module progress
	const getModuleBreakdown = (s: any) => {
		const isDosenAcc =
			s.courseGrades &&
			s.courseGrades.length > 0 &&
			s.courseGrades.every((g: any) => g.isAcc);

		const modules = [
			{
				name: "PMB",
				isAcc: Boolean(s.pmb?.isAcc),
				status: s.pmb?.status || "MENUNGGU",
			},
			{
				name: "CRM",
				isAcc: Boolean(s.crm?.isAcc),
				status: s.crm?.status || "MENUNGGU",
			},
			{
				name: "Finance",
				isAcc: Boolean(s.finance?.isAcc),
				status: s.finance?.status || "MENUNGGU",
			},
			{
				name: "Akademik",
				isAcc: Boolean(s.academic?.isAcc),
				status: s.academic?.status || "MENUNGGU",
			},
			{
				name: "Dosen MK",
				isAcc: Boolean(isDosenAcc),
				status: isDosenAcc ? "AMAN" : "BELUM_LENGKAP",
			},
			{
				name: "PA",
				isAcc: Boolean(s.pa?.isAcc),
				status: s.pa?.status || "MENUNGGU",
			},
			{
				name: "Magang",
				isAcc: Boolean(s.internship?.isAcc),
				status: s.internship?.status || "MENUNGGU",
			},
		];

		const accCount = modules.filter((m) => m.isAcc).length;
		return { modules, accCount, isAllAcc: accCount === 7 };
	};

	// Filtered Data
	const filteredData = useMemo(() => {
		if (!data) return [];
		return data.filter((s: any) => {
			// Search query
			const matchSearch =
				!searchQuery ||
				s.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.student?.nim?.toLowerCase().includes(searchQuery.toLowerCase());

			// Cohort filter
			const matchCohort =
				selectedCohort === "all" ||
				s.student?.cohort?.toString() === selectedCohort;

			// Decision filter
			const studentDecision = s.decision?.evaluatorDecision || "menunggu";
			const matchDecision =
				selectedDecisionFilter === "all" ||
				studentDecision === selectedDecisionFilter;

			// Status filter
			const { isAllAcc } = getModuleBreakdown(s);
			const isAman = s.student?.overallStatus === "AMAN";
			let matchStatus = true;
			if (selectedStatusFilter === "acc_lengkap") matchStatus = isAllAcc;
			if (selectedStatusFilter === "belum_lengkap") matchStatus = !isAllAcc;
			if (selectedStatusFilter === "aman") matchStatus = isAman;
			if (selectedStatusFilter === "blocking") matchStatus = !isAman;

			return matchSearch && matchCohort && matchDecision && matchStatus;
		});
	}, [
		data,
		searchQuery,
		selectedCohort,
		selectedDecisionFilter,
		selectedStatusFilter,
	]);

	// Filtered for Candidates Tab (Layak Berangkat or Approved)
	const candidatesData = useMemo(() => {
		return filteredData.filter(
			(s: any) =>
				s.decision?.evaluatorDecision === "layak_berangkat" ||
				s.decision?.isApprovedByDirector === true,
		);
	}, [filteredData]);

	const cohortData = useMemo(() => {
		if (!data) return [];
		if (selectedCohort === "all") return data;
		return data.filter(
			(s: any) => s.student?.cohort?.toString() === selectedCohort,
		);
	}, [data, selectedCohort]);

	// KPI Stats based on selected cohort
	const totalStudents = cohortData.length;
	const countAccLengkap = cohortData.filter(
		(s: any) => getModuleBreakdown(s).isAllAcc,
	).length;
	const countLayak = cohortData.filter(
		(s: any) => s.decision?.evaluatorDecision === "layak_berangkat",
	).length;
	const countTTD = cohortData.filter(
		(s: any) => s.decision?.evaluatorDecision === "ttd_kontrak",
	).length;
	const countLanjut = cohortData.filter(
		(s: any) => s.decision?.evaluatorDecision === "lanjut_interview",
	).length;
	const countRemedial = cohortData.filter(
		(s: any) => s.decision?.evaluatorDecision === "remedial",
	).length;
	const countDisetujuiDirektur = cohortData.filter(
		(s: any) => s.decision?.isApprovedByDirector,
	).length;

	// Handle Quick Decision Modal open
	const handleOpenDecision = (studentItem: any) => {
		setActiveStudent(studentItem);
		setSelectedDecision(studentItem.decision?.evaluatorDecision || "menunggu");
		setDecisionNotes(studentItem.decision?.evaluatorNotes || "");
		setDecisionModalOpen(true);
	};

	// Save Quick Decision
	const handleSaveDecision = async () => {
		if (!activeStudent) return;
		setIsSavingDecision(true);
		try {
			const res = await api.students[activeStudent.student.id.toString()][
				"final-decision"
			].patch({
				evaluatorDecision: selectedDecision,
				evaluatorNotes: decisionNotes || undefined,
			});

			if (res.data?.success) {
				toast.success(
					`Keputusan untuk ${activeStudent.student.name} berhasil disimpan`,
				);
				setDecisionModalOpen(false);
				onUpdate?.();
			} else {
				toast.error(res.data?.message || "Gagal menyimpan keputusan");
			}
		} catch (err: any) {
			toast.error(err?.message || "Terjadi kesalahan");
		} finally {
			setIsSavingDecision(false);
		}
	};

	// Handle Open Departure Setting
	const handleOpenDeparture = (studentItem: any) => {
		setDepartureStudent(studentItem);
		setDepartureDate(
			studentItem.decision?.departureDate
				? new Date(studentItem.decision.departureDate)
						.toISOString()
						.split("T")[0]
				: "",
		);
		setDirectorNotes(studentItem.decision?.notes || "");
		setConfidentialNotes(studentItem.decision?.confidentialNotes || "");
		setDepartureModalOpen(true);
	};

	// Save Departure & Director Approval
	const handleSaveDeparture = async (isApproved: boolean) => {
		if (!departureStudent) return;
		setIsSavingDeparture(true);
		try {
			const res = await api.students[departureStudent.student.id][
				"final-decision"
			]["director-approval"].patch({
				isApproved,
				departureDate: departureDate || undefined,
				notes: directorNotes || undefined,
			});

			if (confidentialNotes) {
				await api.students[departureStudent.student.id]["final-decision"][
					"confidential-notes"
				].patch({
					confidentialNotes,
				});
			}

			if (res.data?.success) {
				toast.success(
					isApproved
						? `Persetujuan & Jadwal ${departureStudent.student.name} berhasil disimpan`
						: "Persetujuan dicabut",
				);
				setDepartureModalOpen(false);
				onUpdate?.();
			} else {
				toast.error(res.data?.message || "Gagal memproses data");
			}
		} catch (err: any) {
			toast.error(err?.message || "Terjadi kesalahan saat menyimpan");
		} finally {
			setIsSavingDeparture(false);
		}
	};

	// Export CSV handler
	const handleExport = (tab: "evaluasi" | "finalisasi") => {
		if (tab === "evaluasi") {
			const exportData = filteredData.map((s: any) => {
				const { accCount } = getModuleBreakdown(s);
				return {
					NIM: s.student.nim,
					"Nama Mahasiswa": s.student.name,
					Angkatan: s.student.cohort,
					Program: s.student.program,
					"Progress ACC": `${accCount}/7 Modul`,
					"Status Sistem":
						s.student.overallStatus === "AMAN" ? "Aman" : "Blocking",
					"Keputusan Final":
						s.decision?.evaluatorDecision === "layak_berangkat"
							? "Layak Berangkat"
							: s.decision?.evaluatorDecision === "ttd_kontrak"
								? "TTD Kontrak"
								: s.decision?.evaluatorDecision === "lanjut_interview"
									? "Lanjut Interview"
									: s.decision?.evaluatorDecision === "remedial"
										? "Remedial / Tunda"
										: "Menunggu Evaluasi",
					"Catatan Evaluator": s.decision?.evaluatorNotes || "-",
				};
			});
			exportToCSV(
				exportData,
				`Data_Evaluasi_Progres_${new Date().toISOString().split("T")[0]}`,
			);
		} else {
			const exportData = candidatesData.map((s: any) => ({
				NIM: s.student.nim,
				"Nama Mahasiswa": s.student.name,
				Angkatan: s.student.cohort,
				Program: s.student.program,
				"Tgl Keberangkatan": s.decision?.departureDate
					? new Date(s.decision.departureDate).toLocaleDateString("id-ID")
					: "Belum Diatur",
				"Persetujuan Direktur": s.decision?.isApprovedByDirector
					? "Disetujui"
					: "Menunggu",
				"Catatan Direktur": s.decision?.notes || "-",
			}));
			exportToCSV(
				exportData,
				`Data_Kandidat_Keberangkatan_${new Date().toISOString().split("T")[0]}`,
			);
		}
	};

	const renderDecisionBadge = (decision: string | null | undefined) => {
		switch (decision) {
			case "layak_berangkat":
				return (
					<Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold gap-1">
						<CheckCircle className="w-3 h-3 text-emerald-600" />
						Layak Berangkat
					</Badge>
				);
			case "ttd_kontrak":
				return (
					<Badge className="bg-blue-50 text-blue-700 border-blue-300 font-semibold gap-1">
						<FileCheck className="w-3 h-3 text-blue-600" />
						TTD Kontrak
					</Badge>
				);
			case "lanjut_interview":
				return (
					<Badge className="bg-amber-50 text-amber-700 border-amber-300 font-semibold gap-1">
						<Clock className="w-3 h-3 text-amber-600" />
						Lanjut Interview
					</Badge>
				);
			case "remedial":
				return (
					<Badge className="bg-rose-50 text-rose-700 border-rose-300 font-semibold gap-1">
						<XCircle className="w-3 h-3 text-rose-600" />
						Remedial
					</Badge>
				);
			default:
				return (
					<Badge className="bg-slate-100 text-slate-600 border-slate-300 font-medium">
						Menunggu Evaluasi
					</Badge>
				);
		}
	};

	return (
		<div className="space-y-6 pb-12">
			{/* Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
							<ShieldCheck className="w-6 h-6" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								Panel Keputusan Final & SK
							</h1>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Pusat evaluasi progres real-time antar divisi dan penetapan
								keputusan kelayakan keberangkatan mahasiswa.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
						Terhubung Real-Time
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setIsRefreshing(true);
							onUpdate?.();
							setTimeout(() => setIsRefreshing(false), 600);
						}}
						disabled={isRefreshing}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0517B0]" : ""}`}
						/>
						Refresh
					</Button>
					<Button
						size="sm"
						onClick={() => handleExport(activeTab as any)}
						className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 h-9"
					>
						<Download className="w-3.5 h-3.5" />
						Export CSV ({activeTab === "evaluasi" ? "Evaluasi" : "Finalisasi"})
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
								Layak Berangkat
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countLayak}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-blue-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-blue-50 text-blue-500 mt-0.5">
							<FileCheck className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								TTD / Interview
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countTTD + countLanjut}
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
								Remedial / Tunda
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countRemedial}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
					<CardContent className="p-4 flex items-start gap-3">
						<div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5">
							<GraduationCap className="h-5 w-5" />
						</div>
						<div>
							<p className="text-slate-500 text-xs font-semibold">
								Disetujui Direktur
							</p>
							<p className="text-2xl font-black text-slate-900 mt-0.5">
								{countDisetujuiDirektur}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Tabs Container */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<div className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
						<TabsList className="bg-slate-200/80 p-1 rounded-lg">
							<TabsTrigger
								value="evaluasi"
								className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold gap-2 px-4 py-2"
							>
								<UserCheck className="w-4 h-4" />
								1. Evaluasi & Progres Real-Time
								<Badge
									variant="secondary"
									className="ml-1 text-[11px] bg-blue-100 text-[#0517B0] px-1.5 py-0.2"
								>
									{filteredData.length}
								</Badge>
							</TabsTrigger>
							<TabsTrigger
								value="finalisasi"
								className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm text-xs sm:text-sm font-bold gap-2 px-4 py-2"
							>
								<ShieldCheck className="w-4 h-4" />
								2. Finalisasi Keberangkatan & SK
								<Badge
									variant="secondary"
									className="ml-1 text-[11px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2"
								>
									{candidatesData.length}
								</Badge>
							</TabsTrigger>
						</TabsList>

						{/* Search & Filter Bar */}
						<div className="flex flex-wrap items-center gap-2 pb-3 md:pb-0">
							<div className="relative w-full sm:w-56">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
								<Input
									placeholder="Cari NIM atau Nama..."
									className="pl-9 h-9 text-xs bg-white border-slate-200"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>

							<Select
								value={selectedCohort}
								onValueChange={(val) => setSelectedCohort(val || "all")}
							>
								<SelectTrigger className="w-[120px] h-9 text-xs bg-white border-slate-200">
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

							{activeTab === "evaluasi" && (
								<>
									<Select
										value={selectedDecisionFilter}
										onValueChange={(val) =>
											setSelectedDecisionFilter(val || "all")
										}
									>
										<SelectTrigger className="w-[140px] h-9 text-xs bg-white border-slate-200">
											<SelectValue placeholder="Keputusan" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Semua Keputusan</SelectItem>
											<SelectItem value="layak_berangkat">
												Layak Berangkat
											</SelectItem>
											<SelectItem value="ttd_kontrak">TTD Kontrak</SelectItem>
											<SelectItem value="lanjut_interview">
												Lanjut Interview
											</SelectItem>
											<SelectItem value="remedial">Remedial / Tunda</SelectItem>
											<SelectItem value="menunggu">Menunggu</SelectItem>
										</SelectContent>
									</Select>

									<Select
										value={selectedStatusFilter}
										onValueChange={(val) =>
											setSelectedStatusFilter(val || "all")
										}
									>
										<SelectTrigger className="w-[130px] h-9 text-xs bg-white border-slate-200">
											<SelectValue placeholder="Status Modul" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Semua Modul</SelectItem>
											<SelectItem value="acc_lengkap">
												ACC Lengkap (7/7)
											</SelectItem>
											<SelectItem value="belum_lengkap">
												Belum Lengkap
											</SelectItem>
											<SelectItem value="aman">Aman</SelectItem>
											<SelectItem value="blocking">Blocking</SelectItem>
										</SelectContent>
									</Select>
								</>
							)}
						</div>
					</div>

					{/* TAB 1: Evaluasi & Progres Real-Time */}
					<TabsContent value="evaluasi" className="p-0 m-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10">
									<TableRow className="border-slate-200">
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs w-28">
											NIM
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
											Mahasiswa & Program
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
											Progress 7 Modul
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-48">
											Status per Divisi
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-28">
											Kondisi
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-40">
											Keputusan Evaluasi
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-36">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredData.map((s: any) => {
										const { modules, accCount, isAllAcc } =
											getModuleBreakdown(s);
										const isAman = s.student.overallStatus === "AMAN";

										return (
											<TableRow
												key={s.student.id}
												className="border-slate-100 hover:bg-blue-50/40 transition-colors"
											>
												<TableCell className="font-mono text-xs font-bold text-slate-700">
													{s.student.nim}
												</TableCell>
												<TableCell>
													<div className="font-bold text-slate-900 text-sm">
														{s.student.name}
													</div>
													<div className="flex flex-wrap items-center gap-1.5 mt-0.5">
														<Badge
															variant="outline"
															className="text-[10px] px-1.5 py-0 text-slate-500 border-slate-200"
														>
															Angkatan {s.student.cohort}
														</Badge>
														<PeminatanBadge
															subProgram={s.student.subProgram}
															destinationCountry={s.student.destinationCountry}
															program={s.student.program}
														/>
													</div>
												</TableCell>

												{/* Progress Bar with Tooltip */}
												<TableCell className="text-center">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger className="w-full">
																<div className="flex flex-col items-center gap-1.5">
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
																	<div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
																		<div
																			className={`h-full rounded-full transition-all duration-300 ${
																				isAllAcc
																					? "bg-emerald-500"
																					: accCount >= 5
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

												{/* Blocking/Aman Status */}
												<TableCell className="text-center">
													{isAman ? (
														<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
															✅ Aman
														</Badge>
													) : (
														<Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">
															⛔ Blocking
														</Badge>
													)}
												</TableCell>

												{/* Decision Badge */}
												<TableCell className="text-center">
													{renderDecisionBadge(s.decision?.evaluatorDecision)}
												</TableCell>

												{/* Actions */}
												<TableCell className="text-right pr-6">
													<div className="flex items-center justify-end gap-1.5">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleOpenDecision(s)}
															className="h-8 text-xs font-semibold border-blue-200 text-[#0517B0] hover:bg-blue-50 gap-1 px-2.5"
															title="Beri Keputusan Evaluator Cepat"
														>
															<Edit3 className="w-3.5 h-3.5" />
															Beri Keputusan
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																router.push(
																	`/dashboard/students/${s.student.id}?context=final-decision`,
																)
															}
															className="h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2"
															title="Periksa Detail Lengkap Mahasiswa"
														>
															Detail
														</Button>
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
					</TabsContent>

					{/* TAB 2: Finalisasi Keberangkatan & SK */}
					<TabsContent value="finalisasi" className="p-0 m-0">
						<div className="p-4 bg-emerald-50/60 border-b border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
								<span>
									Halaman ini menampilkan mahasiswa yang telah berstatus{" "}
									<strong>Layak Berangkat</strong> untuk penetapan jadwal,
									catatan resmi, dan penerbitan{" "}
									<strong>Surat Keputusan (SK)</strong>.
								</span>
							</div>
							<Badge className="bg-emerald-600 text-white font-bold">
								{candidatesData.length} Kandidat Siap Berangkat
							</Badge>
						</div>

						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50 sticky top-0 z-10">
									<TableRow className="border-slate-200">
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs w-28">
											NIM
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
											Nama Kandidat
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs">
											Program & Angkatan
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
											Tgl Keberangkatan
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-center w-36">
											Status Persetujuan
										</TableHead>
										<TableHead className="py-3.5 font-bold text-slate-700 text-xs text-right pr-6 w-56">
											Dokumen & Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{candidatesData.map((s: any) => {
										const isApproved =
											s.decision?.isApprovedByDirector === true;
										const hasDeparture = Boolean(s.decision?.departureDate);

										return (
											<TableRow
												key={s.student.id}
												className="border-slate-100 hover:bg-emerald-50/30 transition-colors"
											>
												<TableCell className="font-mono text-xs font-bold text-slate-700">
													{s.student.nim}
												</TableCell>
												<TableCell>
													<div className="font-bold text-slate-900 text-sm">
														{s.student.name}
													</div>
													{s.decision?.notes && (
														<div className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-xs">
															&ldquo;{s.decision.notes}&rdquo;
														</div>
													)}
												</TableCell>
												<TableCell>
													<div className="flex flex-wrap items-center gap-1.5">
														<Badge
															variant="outline"
															className="text-[10px] px-1.5 py-0 text-slate-500 border-slate-200"
														>
															Angkatan {s.student.cohort}
														</Badge>
														<PeminatanBadge
															subProgram={s.student.subProgram}
															destinationCountry={s.student.destinationCountry}
															program={s.student.program}
														/>
													</div>
												</TableCell>
												<TableCell className="text-center font-medium">
													{s.decision?.departureDate ? (
														<div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#0517B0] rounded-md font-semibold text-xs border border-blue-100">
															<Calendar className="w-3.5 h-3.5 text-[#0517B0]" />
															{new Date(
																s.decision.departureDate,
															).toLocaleDateString("id-ID", {
																day: "2-digit",
																month: "short",
																year: "numeric",
															})}
														</div>
													) : (
														<span className="text-slate-400 italic text-xs">
															Belum Diatur
														</span>
													)}
												</TableCell>
												<TableCell className="text-center">
													{isApproved ? (
														<Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs gap-1">
															<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
															Disetujui
														</Badge>
													) : (
														<Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-xs gap-1">
															<Clock className="w-3.5 h-3.5 text-amber-600" />
															Menunggu
														</Badge>
													)}
												</TableCell>
												<TableCell className="text-right pr-6">
													<div className="flex items-center justify-end gap-1.5">
														{/* Data PDF Button */}
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																router.push(
																	`/dashboard/finalisasi/${s.student.id}/data`,
																)
															}
															className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1 px-2"
															title="Cetak Data Rekap Finalisasi (PDF)"
														>
															<FileText className="w-3.5 h-3.5 text-slate-500" />
															Data PDF
														</Button>

														{/* Departure & Approval Settings Modal */}
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleOpenDeparture(s)}
															className="h-8 text-xs font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1 px-2"
														>
															<Calendar className="w-3.5 h-3.5" />
															Atur Jadwal
														</Button>

														{/* Cetak SK Button */}
														<Button
															size="sm"
															disabled={!hasDeparture}
															onClick={() =>
																router.push(
																	`/dashboard/finalisasi/${s.student.id}/sk`,
																)
															}
															className={`h-8 text-xs font-bold gap-1.5 px-3 ${
																hasDeparture
																	? "bg-[#0517B0] hover:bg-blue-800 text-white shadow-sm"
																	: "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
															}`}
															title={
																!hasDeparture
																	? "Harap atur tanggal keberangkatan terlebih dahulu"
																	: "Cetak SK Resmi"
															}
														>
															<Printer className="w-3.5 h-3.5" />
															Cetak SK
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>

							{candidatesData.length === 0 && (
								<div className="text-center py-12 text-slate-500">
									<HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
									<p className="text-sm font-semibold">
										Belum ada kandidat keberangkatan.
									</p>
									<p className="text-xs text-slate-400 mt-0.5">
										Tetapkan keputusan <strong>Layak Berangkat</strong> pada tab
										Evaluasi untuk memasukkan mahasiswa ke dalam daftar ini.
									</p>
								</div>
							)}
						</div>
					</TabsContent>
				</Tabs>
			</Card>

			{/* QUICK DECISION MODAL */}
			<Dialog open={decisionModalOpen} onOpenChange={setDecisionModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
							<Edit3 className="w-5 h-5 text-[#0517B0]" />
							Beri Keputusan Evaluasi Mahasiswa
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Tetapkan status kelayakan untuk{" "}
							<strong>{activeStudent?.student?.name}</strong> (
							{activeStudent?.student?.nim}).
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label className="text-xs font-bold text-slate-700">
								Pilih Keputusan:
							</Label>
							<RadioGroup
								value={selectedDecision}
								onValueChange={(val) => setSelectedDecision(val || "menunggu")}
								className="space-y-2"
							>
								<div className="flex items-center space-x-2 p-2.5 rounded-lg border border-emerald-200 hover:bg-emerald-50/50 cursor-pointer">
									<RadioGroupItem value="layak_berangkat" id="d-layak" />
									<Label
										htmlFor="d-layak"
										className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 cursor-pointer flex-1"
									>
										🟢 Layak Berangkat (Memenuhi syarat & masuk daftar SK)
									</Label>
								</div>
								<div className="flex items-center space-x-2 p-2.5 rounded-lg border border-blue-200 hover:bg-blue-50/50 cursor-pointer">
									<RadioGroupItem value="ttd_kontrak" id="d-ttd" />
									<Label
										htmlFor="d-ttd"
										className="text-xs font-bold text-blue-800 flex items-center gap-1.5 cursor-pointer flex-1"
									>
										🔵 TTD Kontrak (Siap penandatanganan kerja sama)
									</Label>
								</div>
								<div className="flex items-center space-x-2 p-2.5 rounded-lg border border-amber-200 hover:bg-amber-50/50 cursor-pointer">
									<RadioGroupItem value="lanjut_interview" id="d-interview" />
									<Label
										htmlFor="d-interview"
										className="text-xs font-bold text-amber-800 flex items-center gap-1.5 cursor-pointer flex-1"
									>
										🟡 Lanjut Interview (Perlu wawancara tambahan)
									</Label>
								</div>
								<div className="flex items-center space-x-2 p-2.5 rounded-lg border border-rose-200 hover:bg-rose-50/50 cursor-pointer">
									<RadioGroupItem value="remedial" id="d-remedial" />
									<Label
										htmlFor="d-remedial"
										className="text-xs font-bold text-rose-800 flex items-center gap-1.5 cursor-pointer flex-1"
									>
										🔴 Remedial / Tunda (Perlu perbaikan modul/nilai)
									</Label>
								</div>
								<div className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
									<RadioGroupItem value="menunggu" id="d-menunggu" />
									<Label
										htmlFor="d-menunggu"
										className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer flex-1"
									>
										⚪ Menunggu (Belum diputuskan)
									</Label>
								</div>
							</RadioGroup>
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="evaluator-notes"
								className="text-xs font-bold text-slate-700"
							>
								Catatan Evaluasi (Opsional):
							</Label>
							<Textarea
								id="evaluator-notes"
								placeholder="Tambahkan catatan evaluasi untuk mahasiswa ini..."
								value={decisionNotes}
								onChange={(e) => setDecisionNotes(e.target.value)}
								className="text-xs border-slate-200 min-h-[75px]"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDecisionModalOpen(false)}
							className="text-xs border-slate-200"
						>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleSaveDecision}
							disabled={isSavingDecision}
							className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-bold gap-1.5"
						>
							{isSavingDecision && (
								<RefreshCw className="w-3.5 h-3.5 animate-spin" />
							)}
							Simpan Keputusan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* DEPARTURE & APPROVAL MODAL */}
			<Dialog open={departureModalOpen} onOpenChange={setDepartureModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-slate-900 text-lg">
							<Plane className="w-5 h-5 text-emerald-600" />
							Atur Jadwal & Persetujuan Keberangkatan
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Atur jadwal keberangkatan dan persetujuan SK untuk{" "}
							<strong>{departureStudent?.student?.name}</strong>.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label
								htmlFor="departure-date"
								className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
							>
								<Calendar className="w-3.5 h-3.5 text-[#0517B0]" />
								Tanggal Keberangkatan:
							</Label>
							<Input
								id="departure-date"
								type="date"
								value={departureDate}
								onChange={(e) => setDepartureDate(e.target.value)}
								className="text-xs border-slate-200"
							/>
						</div>

						<div className="space-y-1.5">
							<Label
								htmlFor="director-notes"
								className="text-xs font-bold text-slate-700"
							>
								Catatan Direktur / Superadmin (Opsional):
							</Label>
							<Textarea
								id="director-notes"
								placeholder="Catatan resmi dari Direktur..."
								value={directorNotes}
								onChange={(e) => setDirectorNotes(e.target.value)}
								className="text-xs border-slate-200 min-h-[70px]"
							/>
						</div>

						<div className="space-y-1.5 pt-1">
							<Label
								htmlFor="confidential-notes"
								className="text-xs font-bold text-rose-700 flex items-center gap-1"
							>
								<ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
								Catatan Rahasia Manajemen (Terenkripsi):
							</Label>
							<Textarea
								id="confidential-notes"
								placeholder="Instruksi rahasia khusus pimpinan/admin..."
								value={confidentialNotes}
								onChange={(e) => setConfidentialNotes(e.target.value)}
								className="text-xs border-rose-200 bg-rose-50/20 min-h-[60px]"
							/>
						</div>
					</div>

					<DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-100">
						{departureStudent?.decision?.isApprovedByDirector ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleSaveDeparture(false)}
								disabled={isSavingDeparture}
								className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold mr-auto"
							>
								Cabut Persetujuan
							</Button>
						) : (
							<div />
						)}
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setDepartureModalOpen(false)}
								className="text-xs border-slate-200"
							>
								Tutup
							</Button>
							<Button
								size="sm"
								onClick={() => handleSaveDeparture(true)}
								disabled={isSavingDeparture}
								className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm"
							>
								{isSavingDeparture && (
									<RefreshCw className="w-3.5 h-3.5 animate-spin" />
								)}
								Setujui & Simpan
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
