"use client";

import {
	Activity,
	AlertCircle,
	AlertTriangle,
	Award,
	BookOpen,
	Briefcase,
	CalendarDays,
	Check,
	CheckCircle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	Compass,
	ExternalLink,
	GraduationCap,
	Info,
	Layers,
	Loader2,
	RefreshCw,
	Search,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
	UserCheck,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";

interface TabKehadiranProps {
	studentId: number;
	crmState: any;
	kehadiranState: any;
	canEdit: boolean;
	fetchCrmData: () => void;
	fetchKehadiranData?: () => void;
	onUpdate: () => void;
	onUpdateField?: (field: string, value: any) => void;
}

export function TabKehadiran({
	studentId,
	crmState,
	kehadiranState,
	canEdit,
	fetchCrmData,
	fetchKehadiranData,
	onUpdate,
	onUpdateField,
}: TabKehadiranProps) {
	const crm = crmState?.crm;
	const [isApproved, setIsApproved] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [searchCourse, setSearchCourse] = useState("");
	const [activeDetailTab, setActiveDetailTab] = useState<
		"courses" | "programs"
	>("courses");

	useEffect(() => {
		if (crm) {
			setIsApproved(Boolean(crm.practiceAttendance));
		}
	}, [crm]);

	const academic = kehadiranState?.academic;
	const summary = kehadiranState?.summary;
	const courses: any[] = kehadiranState?.courses || [];

	// Agregasi Perkuliahan
	const attTotal = useMemo(() => {
		if (summary?.lectureTotal !== undefined) return summary.lectureTotal;
		return courses.reduce(
			(acc: number, course: any) => acc + (course.totalMeetings || 16),
			0,
		);
	}, [summary, courses]);

	const attPresent = useMemo(() => {
		if (summary?.lecturePresent !== undefined) return summary.lecturePresent;
		return courses.reduce(
			(acc: number, course: any) => acc + (course.attendancePresent || 0),
			0,
		);
	}, [summary, courses]);

	const attPercent = useMemo(() => {
		if (summary?.lectureRate !== undefined) return summary.lectureRate;
		return attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;
	}, [summary, attTotal, attPresent]);

	const isEligible = attPercent >= 90;

	// Metrik Program Khusus & Pembiasaan
	const piketTotal = summary?.piketTotal ?? academic?.attendancePiketTotal ?? 0;
	const piketPresent =
		summary?.piketPresent ?? academic?.attendancePiketPresent ?? 0;
	const piketRate =
		summary?.piketRate ??
		(piketTotal > 0 ? Math.round((piketPresent / piketTotal) * 100) : 0);

	const barisTotal = summary?.barisTotal ?? academic?.attendanceBarisTotal ?? 0;
	const barisPresent =
		summary?.barisPresent ?? academic?.attendanceBarisPresent ?? 0;
	const barisLate = summary?.barisLate ?? academic?.attendanceBarisLate ?? 0;
	const barisRate =
		summary?.barisRate ??
		(barisTotal > 0 ? Math.round((barisPresent / barisTotal) * 100) : 100);

	const odsTotal = summary?.odsTotal ?? academic?.attendanceOdsTotal ?? 0;
	const odsPresent = summary?.odsPresent ?? academic?.attendanceOdsPresent ?? 0;
	const odsRate =
		summary?.odsRate ??
		(odsTotal > 0 ? Math.round((odsPresent / odsTotal) * 100) : 0);

	const pramagangTotal =
		summary?.pramagangTotal ?? academic?.attendancePramagangTotal ?? 0;
	const pramagangPresent =
		summary?.pramagangPresent ?? academic?.attendancePramagangPresent ?? 0;
	const pramagangRate =
		summary?.pramagangRate ??
		(pramagangTotal > 0
			? Math.round((pramagangPresent / pramagangTotal) * 100)
			: 0);

	const practiceDaysTotal =
		summary?.practiceDaysTotal ??
		crm?.practiceDaysTotal ??
		odsTotal + pramagangTotal;
	const practiceDaysPresent =
		summary?.practiceDaysPresent ??
		crm?.practiceDaysPresent ??
		odsPresent + pramagangPresent;
	const practiceDaysRate =
		practiceDaysTotal > 0
			? Math.round((practiceDaysPresent / practiceDaysTotal) * 100)
			: 0;

	// Broadcast sinkronisasi agar semua tab & panel langsung terupdate
	const broadcastAttendanceSync = () => {
		if (typeof window !== "undefined") {
			window.dispatchEvent(
				new CustomEvent("student-crm-kehadiran-synced", {
					detail: { studentId },
				}),
			);
			window.dispatchEvent(
				new CustomEvent("academic-data-updated", {
					detail: { studentId },
				}),
			);
			window.dispatchEvent(
				new CustomEvent("student-updated", {
					detail: { studentId },
				}),
			);
			try {
				const ch = new BroadcastChannel("dashboard-realtime-sync");
				ch.postMessage({
					type: "student-crm-kehadiran-synced",
					studentId,
				});
				ch.close();
			} catch {}
		}
	};

	// Tombol sinkronkan data langsung dari database Akademik
	const handleSyncFromAcademic = async () => {
		setIsSyncing(true);
		try {
			const res = await fetch(
				`http://localhost:3001/students/${studentId}/crm/kehadiran/sync`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
			if (!res.ok) throw new Error("Gagal sinkronisasi data presensi");

			toast.success("Data kehadiran berhasil disinkronkan dengan Akademik");
			fetchKehadiranData?.();
			fetchCrmData();
			onUpdate();
			broadcastAttendanceSync();
		} catch (error) {
			console.error("Sync error:", error);
			toast.error("Terjadi kesalahan saat menyinkronkan data presensi");
		} finally {
			setIsSyncing(false);
		}
	};

	// Toggle ACC kehadiran oleh CRM officer
	const handleToggleApproval = async (approved: boolean) => {
		if (!canEdit) return;
		onUpdateField?.("practiceAttendance", approved);
		setIsApproved(approved);
		setIsLoading(true);
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				practiceAttendance: approved,
			});
			if (error) throw new Error("Gagal mengubah persetujuan kehadiran");

			toast.success(
				approved
					? "Kehadiran praktik & perkuliahan disetujui (ACC)"
					: "Persetujuan kehadiran dibatalkan",
			);
			fetchCrmData();
			fetchKehadiranData?.();
			onUpdate();
			broadcastAttendanceSync();
		} catch (error) {
			onUpdateField?.("practiceAttendance", !approved);
			setIsApproved(!approved);
			toast.error("Gagal memproses persetujuan kehadiran");
		} finally {
			setIsLoading(false);
		}
	};

	// Filter mata kuliah
	const filteredCourses = useMemo(() => {
		if (!searchCourse.trim()) return courses;
		const query = searchCourse.toLowerCase();
		return courses.filter(
			(c) =>
				c.courseName?.toLowerCase().includes(query) ||
				c.courseCode?.toLowerCase().includes(query) ||
				c.dosen?.fullName?.toLowerCase().includes(query),
		);
	}, [courses, searchCourse]);

	return (
		<div className="space-y-6">
			{/* Header Banner Real-Time Sync */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
				<div className="flex items-center gap-3.5">
					<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center shadow-2xs ring-4 ring-blue-50 shrink-0">
						<Activity className="w-5 h-5" />
					</div>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
								Monitoring Presensi &amp; Kehadiran Mahasiswa
							</h2>
							<Badge
								variant="secondary"
								className="bg-blue-50 text-[#0517B0] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200/60 flex items-center gap-1"
							>
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
								Terintegrasi Akademik
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							Sinkronisasi realtime perkuliahan dosen, piket kampus, baris pagi
							(06.22), ODS, dan pra-magang.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto">
					<Button
						variant="outline"
						size="sm"
						onClick={handleSyncFromAcademic}
						disabled={isSyncing}
						className="border-slate-200 text-slate-700 hover:text-[#0517B0] hover:bg-blue-50/50 rounded-xl text-xs font-semibold h-9 px-3.5 gap-1.5 w-full sm:w-auto transition-all cursor-pointer"
					>
						<RefreshCw
							className={cn(
								"w-3.5 h-3.5",
								isSyncing && "animate-spin text-[#0517B0]",
							)}
						/>
						{isSyncing ? "Menyinkronkan..." : "Sinkronkan Data Akademik"}
					</Button>
				</div>
			</div>

			{/* Bento 3-Card Metrics Section */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Bento 1: Perkuliahan Utama (Mata Kuliah) */}
				<Card className="rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between">
					<div className="p-5 space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
								<GraduationCap className="w-4 h-4 text-[#0517B0]" />
								Perkuliahan Utama
							</span>
							<Badge
								variant="outline"
								className={cn(
									"text-[11px] font-bold px-2 py-0.5 rounded-full border",
									isEligible
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: "bg-amber-50 text-amber-700 border-amber-200",
								)}
							>
								{isEligible ? "Syarat Terpenuhi" : "Di Bawah Target"}
							</Badge>
						</div>

						<div className="flex items-baseline justify-between">
							<div>
								<div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
									{attPercent}%
								</div>
								<p className="text-xs text-slate-500 font-medium mt-1">
									{attPresent} dari {attTotal} total pertemuan perkuliahan
								</p>
							</div>
							<div className="text-right">
								<span className="text-[11px] font-semibold text-slate-400 block">
									Syarat Minimal
								</span>
								<span className="text-sm font-bold text-slate-700">≥ 90%</span>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex justify-between items-center text-[11px] text-slate-500">
								<span>Progres Kehadiran Kuliah</span>
								<span className="font-semibold">{attPercent}% / 90%</span>
							</div>
							<Progress
								value={Math.min(attPercent, 100)}
								className={cn(
									"h-2.5 rounded-full bg-slate-100",
									isEligible
										? "[&>div]:bg-emerald-600"
										: "[&>div]:bg-amber-500",
								)}
							/>
						</div>
					</div>

					<div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
						<span>Total Beban: {courses.length} Mata Kuliah</span>
						<span className="text-slate-400">•</span>
						<span>{courses.reduce((acc, c) => acc + (c.sks || 2), 0)} SKS</span>
					</div>
				</Card>

				{/* Bento 2: Program Khusus & Pembiasaan (4 Pilar) */}
				<Card className="rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between">
					<div className="p-5 space-y-3.5">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
								<Briefcase className="w-4 h-4 text-indigo-600" />
								Praktik &amp; Pembiasaan
							</span>
							<Badge
								variant="secondary"
								className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-200/60"
							>
								4 Pilar Lapangan
							</Badge>
						</div>

						{/* 2x2 Micro Grid */}
						<div className="grid grid-cols-2 gap-2.5">
							<div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
								<div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
									<CalendarDays className="w-3.5 h-3.5 text-blue-600" />
									<span>Piket Kampus</span>
								</div>
								<div className="mt-1 flex items-baseline justify-between">
									<span className="text-sm font-bold text-slate-800">
										{piketPresent}/{piketTotal}
									</span>
									<span className="text-[10px] font-bold text-blue-600">
										{piketRate}%
									</span>
								</div>
							</div>

							<div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
								<div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
									<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
									<span>Baris Pagi (06.22)</span>
								</div>
								<div className="mt-1 flex items-baseline justify-between">
									<span className="text-sm font-bold text-slate-800">
										{barisPresent} Tepat
									</span>
									<span
										className={cn(
											"text-[10px] font-bold",
											barisLate > 0 ? "text-amber-600" : "text-emerald-600",
										)}
									>
										{barisLate > 0 ? `${barisLate} Telat` : "Disiplin"}
									</span>
								</div>
							</div>

							<div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
								<div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
									<Briefcase className="w-3.5 h-3.5 text-amber-600" />
									<span>Praktik ODS</span>
								</div>
								<div className="mt-1 flex items-baseline justify-between">
									<span className="text-sm font-bold text-slate-800">
										{odsPresent}/{odsTotal}
									</span>
									<span className="text-[10px] font-bold text-amber-600">
										{odsRate}%
									</span>
								</div>
							</div>

							<div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
								<div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
									<Compass className="w-3.5 h-3.5 text-purple-600" />
									<span>Pra-Magang</span>
								</div>
								<div className="mt-1 flex items-baseline justify-between">
									<span className="text-sm font-bold text-slate-800">
										{pramagangPresent}/{pramagangTotal}
									</span>
									<span className="text-[10px] font-bold text-purple-600">
										{pramagangRate}%
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
						<span>Hari Praktik CRM:</span>
						<span className="font-bold text-slate-800">
							{practiceDaysPresent} dari {practiceDaysTotal} hari (
							{practiceDaysRate}%)
						</span>
					</div>
				</Card>

				{/* Bento 3: Status Validasi CRM (Checklist Presensi Keberangkatan) */}
				<Card
					className={cn(
						"rounded-2xl border shadow-2xs hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between",
						isApproved
							? "bg-emerald-50/40 border-emerald-200/80"
							: "bg-amber-50/30 border-amber-200/80",
					)}
				>
					<div className="p-5 space-y-3.5">
						<div className="flex items-center justify-between">
							<span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
								<UserCheck className="w-4 h-4 text-[#0517B0]" />
								Validasi Presensi CRM
							</span>
							<Badge
								variant="outline"
								className={cn(
									"text-[11px] font-bold px-2 py-0.5 rounded-full border",
									isApproved
										? "bg-emerald-100/80 text-emerald-800 border-emerald-300"
										: "bg-amber-100/80 text-amber-800 border-amber-300",
								)}
							>
								{isApproved ? "ACC Diberikan" : "Menunggu ACC"}
							</Badge>
						</div>

						<div className="flex items-start gap-3">
							<div
								className={cn(
									"w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
									isApproved
										? "bg-emerald-600 text-white"
										: "bg-amber-500 text-white",
								)}
							>
								{isApproved ? (
									<CheckCircle2 className="w-5 h-5" />
								) : (
									<AlertTriangle className="w-5 h-5" />
								)}
							</div>
							<div>
								<h4 className="text-sm font-bold text-slate-900 leading-snug">
									{isApproved
										? "Syarat Kehadiran Memenuhi Target"
										: "Belum Memenuhi Validasi CRM"}
								</h4>
								<p className="text-xs text-slate-600 mt-1 leading-relaxed">
									{isApproved
										? "Checklist Presensi Praktik & Perkuliahan telah diverifikasi dan disetujui untuk izin magang."
										: isEligible
											? "Kehadiran kuliah telah ≥ 90%. Siap untuk disetujui (ACC) oleh staf CRM."
											: "Rekomendasi syarat: kehadiran kuliah ≥ 90% dan pembiasaan lapangan tuntas."}
								</p>
							</div>
						</div>
					</div>

					<div className="p-4 bg-white/80 border-t border-slate-100/80 flex items-center justify-between gap-2">
						{isApproved
							? canEdit && (
									<AlertDialog>
										<AlertDialogTrigger
											className={cn(
												buttonVariants({ variant: "outline", size: "sm" }),
												"border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold h-8 w-full cursor-pointer",
											)}
											disabled={isLoading}
										>
											{isLoading
												? "Memproses..."
												: "Batalkan Persetujuan (ACC)"}
										</AlertDialogTrigger>
										<AlertDialogContent className="rounded-2xl">
											<AlertDialogTitle>
												Batalkan ACC Kehadiran?
											</AlertDialogTitle>
											<AlertDialogDescription className="text-xs text-slate-600">
												Membatalkan persetujuan kehadiran akan menghapus centang
												checklist <b>Presensi / Kehadiran Praktik ODS</b> pada
												modul CRM mahasiswa ini.
											</AlertDialogDescription>
											<div className="flex justify-end gap-2 mt-4">
												<AlertDialogCancel className="rounded-xl text-xs">
													Batal
												</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => handleToggleApproval(false)}
													className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
												>
													Ya, Batalkan ACC
												</AlertDialogAction>
											</div>
										</AlertDialogContent>
									</AlertDialog>
								)
							: canEdit && (
									<AlertDialog>
										<AlertDialogTrigger
											className={cn(
												buttonVariants({ size: "sm" }),
												"bg-[#0517B0] hover:bg-[#0517B0]/90 text-white rounded-xl text-xs font-semibold h-8 w-full shadow-2xs cursor-pointer",
											)}
											disabled={isLoading}
										>
											{isLoading
												? "Memproses..."
												: "Setujui Kehadiran Mahasiswa"}
										</AlertDialogTrigger>
										<AlertDialogContent className="rounded-2xl">
											<AlertDialogTitle>
												Setujui Kehadiran Mahasiswa
											</AlertDialogTitle>
											<AlertDialogDescription className="text-xs text-slate-600 space-y-2">
												<div>
													Anda akan menyetujui kriteria kehadiran mahasiswa ini.
													Aksi ini akan mencentang checklist{" "}
													<b>Presensi / Kehadiran Praktik ODS</b> pada modul
													CRM.
												</div>
												{!isEligible && (
													<div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
														<strong>Catatan:</strong> Persentase perkuliahan
														saat ini ({attPercent}%) masih berada di bawah
														target standar (90%). Persetujuan ini akan dicatat
														sebagai diskresi khusus CRM.
													</div>
												)}
											</AlertDialogDescription>
											<div className="flex justify-end gap-2 mt-4">
												<AlertDialogCancel className="rounded-xl text-xs">
													Batal
												</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => handleToggleApproval(true)}
													className="bg-[#0517B0] hover:bg-blue-800 text-white rounded-xl text-xs font-semibold"
												>
													Ya, Berikan ACC
												</AlertDialogAction>
											</div>
										</AlertDialogContent>
									</AlertDialog>
								)}
					</div>
				</Card>
			</div>

			{/* Catatan Ketidakhadiran BAAK / Akademik jika ada */}
			{academic?.attendanceAlphaNote && (
				<div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-3 shadow-2xs">
					<AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					<div className="space-y-1">
						<h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
							Catatan Ketidakhadiran Resmi dari BAAK / Akademik:
						</h4>
						<p className="text-xs text-amber-800 leading-relaxed">
							{academic.attendanceAlphaNote}
						</p>
					</div>
				</div>
			)}

			{/* Detailed View Segment (Mata Kuliah vs Pembiasaan) */}
			<div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
				{/* Sub-header with search & segment tabs */}
				<div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Tabs
							value={activeDetailTab}
							onValueChange={(v) => setActiveDetailTab(v as any)}
							className="w-auto"
						>
							<TabsList className="bg-slate-100 p-1 rounded-xl h-auto">
								<TabsTrigger
									value="courses"
									className="rounded-lg text-xs font-semibold py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-2xs cursor-pointer flex items-center gap-1.5"
								>
									<BookOpen className="w-3.5 h-3.5" />
									<span>Per Mata Kuliah ({courses.length})</span>
								</TabsTrigger>
								<TabsTrigger
									value="programs"
									className="rounded-lg text-xs font-semibold py-1.5 px-3 data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-2xs cursor-pointer flex items-center gap-1.5"
								>
									<Layers className="w-3.5 h-3.5" />
									<span>Rincian Pembiasaan (4 Pilar)</span>
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{activeDetailTab === "courses" && (
						<div className="relative w-full sm:w-64">
							<Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder="Cari mata kuliah atau dosen..."
								value={searchCourse}
								onChange={(e) => setSearchCourse(e.target.value)}
								className="pl-8 h-8 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white"
							/>
						</div>
					)}
				</div>

				{/* Detail Tab 1: Daftar Mata Kuliah */}
				{activeDetailTab === "courses" && (
					<div>
						{/* Desktop Table View */}
						<div className="hidden md:block overflow-x-auto">
							<table className="w-full text-left text-xs text-slate-600">
								<thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px] tracking-wider">
									<tr>
										<th className="px-5 py-3.5">Mata Kuliah &amp; Kode</th>
										<th className="px-5 py-3.5">Dosen Pengampu</th>
										<th className="px-5 py-3.5 text-center">SKS</th>
										<th className="px-5 py-3.5 text-center">Pertemuan</th>
										<th className="px-5 py-3.5 text-center">Hadir</th>
										<th className="px-5 py-3.5 text-center">% Kehadiran</th>
										<th className="px-5 py-3.5">Catatan Dosen / Sikap</th>
										<th className="px-5 py-3.5 text-center">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredCourses.map((course, idx) => {
										const mkTotal = course.totalMeetings || 16;
										const mkPresent = course.attendancePresent || 0;
										const mkPercent =
											course.attendanceRate ||
											(mkTotal > 0
												? Math.round((mkPresent / mkTotal) * 100)
												: 0);
										const isMkEligible = mkPercent >= 90;

										return (
											<tr
												key={course.id || idx}
												className="hover:bg-blue-50/30 transition-colors"
											>
												<td className="px-5 py-3.5 font-medium text-slate-800">
													<div className="font-semibold text-slate-900">
														{course.courseName}
													</div>
													<div className="text-[11px] text-slate-400 font-mono">
														{course.courseCode}
													</div>
												</td>
												<td className="px-5 py-3.5 text-slate-600">
													{course.dosen?.fullName || "-"}
												</td>
												<td className="px-5 py-3.5 text-center font-semibold text-slate-700">
													{course.sks || 2} SKS
												</td>
												<td className="px-5 py-3.5 text-center font-mono">
													{mkTotal}
												</td>
												<td className="px-5 py-3.5 text-center font-mono font-bold text-slate-800">
													{mkPresent}
												</td>
												<td className="px-5 py-3.5 text-center">
													<Badge
														variant="outline"
														className={cn(
															"text-[11px] font-bold px-2 py-0.5 rounded-full border",
															isMkEligible
																? "bg-emerald-50 text-emerald-700 border-emerald-200"
																: "bg-rose-50 text-rose-700 border-rose-200",
														)}
													>
														{mkPercent}%
													</Badge>
												</td>
												<td className="px-5 py-3.5 max-w-[200px] truncate text-slate-500 italic">
													{course.attitudeNote || "-"}
												</td>
												<td className="px-5 py-3.5 text-center">
													<span
														className={cn(
															"inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
															isMkEligible
																? "bg-emerald-50 text-emerald-700"
																: "bg-amber-50 text-amber-700",
														)}
													>
														{isMkEligible ? (
															<>
																<Check className="w-3 h-3 text-emerald-600" />
																Aman
															</>
														) : (
															<>
																<AlertCircle className="w-3 h-3 text-amber-600" />
																Perlu Perhatian
															</>
														)}
													</span>
												</td>
											</tr>
										);
									})}
									{filteredCourses.length === 0 && (
										<tr>
											<td
												colSpan={8}
												className="px-6 py-10 text-center text-slate-400 text-xs"
											>
												Tidak ada mata kuliah yang cocok dengan kata kunci
												pencarian.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						{/* Mobile Card List View */}
						<div className="md:hidden divide-y divide-slate-100">
							{filteredCourses.map((course, idx) => {
								const mkTotal = course.totalMeetings || 16;
								const mkPresent = course.attendancePresent || 0;
								const mkPercent =
									course.attendanceRate ||
									(mkTotal > 0 ? Math.round((mkPresent / mkTotal) * 100) : 0);
								const isMkEligible = mkPercent >= 90;

								return (
									<div key={course.id || idx} className="p-4 space-y-2.5">
										<div className="flex items-start justify-between gap-2">
											<div>
												<h5 className="text-xs font-bold text-slate-900 leading-tight">
													{course.courseName}
												</h5>
												<span className="text-[10px] text-slate-400 font-mono">
													{course.courseCode} • {course.sks || 2} SKS
												</span>
											</div>
											<Badge
												variant="outline"
												className={cn(
													"text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 border",
													isMkEligible
														? "bg-emerald-50 text-emerald-700 border-emerald-200"
														: "bg-rose-50 text-rose-700 border-rose-200",
												)}
											>
												{mkPercent}% Hadir
											</Badge>
										</div>

										<div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
											<span className="text-[11px] text-slate-500 truncate max-w-[180px]">
												{course.dosen?.fullName || "Dosen Pengampu"}
											</span>
											<span className="font-mono font-semibold text-slate-800">
												{mkPresent} / {mkTotal} sesi
											</span>
										</div>

										{course.attitudeNote && (
											<p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
												&ldquo;{course.attitudeNote}&rdquo;
											</p>
										)}
									</div>
								);
							})}
							{filteredCourses.length === 0 && (
								<div className="p-6 text-center text-slate-400 text-xs">
									Tidak ada data mata kuliah.
								</div>
							)}
						</div>
					</div>
				)}

				{/* Detail Tab 2: Rincian Pembiasaan (Piket, Baris Pagi, ODS, Pra-magang) */}
				{activeDetailTab === "programs" && (
					<div className="p-5 space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Piket Detail */}
							<div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<CalendarDays className="w-4 h-4 text-blue-600" />
										1. Piket Kampus Harian
									</h4>
									<Badge
										variant="outline"
										className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
									>
										{piketRate}% Kehadiran
									</Badge>
								</div>
								<p className="text-xs text-slate-600">
									Total tercatat:{" "}
									<span className="font-bold text-slate-800">
										{piketPresent} sesi hadir
									</span>{" "}
									dari total {piketTotal} jadwal penugasan piket kebersihan.
								</p>
								<div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
									<span>
										Status Sesi:{" "}
										{piketPresent > 0 ? "Aktif Berjalan" : "Belum Ada Sesi"}
									</span>
									<span className="text-emerald-600 font-semibold flex items-center gap-1">
										<CheckCircle2 className="w-3 h-3" />
										Terverifikasi
									</span>
								</div>
							</div>

							{/* Baris Pagi Detail */}
							<div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<ShieldCheck className="w-4 h-4 text-emerald-600" />
										2. Apel Baris Pagi (06.22)
									</h4>
									<Badge
										variant="outline"
										className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
									>
										Disiplin Waktu
									</Badge>
								</div>
								<p className="text-xs text-slate-600">
									Tepat waktu:{" "}
									<span className="font-bold text-emerald-700">
										{barisPresent} kali
									</span>{" "}
									(≤ 06.22 WITA), Terlambat:{" "}
									<span className="font-bold text-amber-700">
										{barisLate} kali
									</span>{" "}
									(&gt; 06.22 WITA).
								</p>
								<div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
									<span>Tingkat Kepatuhan: {barisRate}%</span>
									<span
										className={cn(
											"font-semibold text-xs",
											barisLate === 0 ? "text-emerald-600" : "text-amber-600",
										)}
									>
										{barisLate === 0 ? "Sempurna" : "Ada Keterlambatan"}
									</span>
								</div>
							</div>

							{/* ODS Detail */}
							<div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<Briefcase className="w-4 h-4 text-amber-600" />
										3. Praktik One Day Service (ODS)
									</h4>
									<Badge
										variant="outline"
										className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
									>
										{odsRate}% Selesai
									</Badge>
								</div>
								<p className="text-xs text-slate-600">
									Terselesaikan:{" "}
									<span className="font-bold text-slate-800">
										{odsPresent} shift
									</span>{" "}
									dari kewajiban {odsTotal} shift praktik industri kampus.
								</p>
								<div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
									<span>Bukti Presensi: Selfie &amp; Geotagging</span>
									<span className="text-indigo-600 font-semibold">
										Tercatat di CRM
									</span>
								</div>
							</div>

							{/* Pra-Magang Detail */}
							<div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<Compass className="w-4 h-4 text-purple-600" />
										4. Pra-Magang Industri
									</h4>
									<Badge
										variant="outline"
										className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]"
									>
										{pramagangRate}% Berjalan
									</Badge>
								</div>
								<p className="text-xs text-slate-600">
									Kehadiran pra-magang:{" "}
									<span className="font-bold text-slate-800">
										{pramagangPresent} hari
									</span>{" "}
									dari total {pramagangTotal} hari masa persiapan magang.
								</p>
								<div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
									<span>
										Penempatan: {crm?.pramagangIndustry || "Belum Ditetapkan"}
									</span>
									<span className="text-slate-500 font-medium">
										Panel Magang
									</span>
								</div>
							</div>
						</div>

						{/* Link to Academic Panel */}
						<div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
							<div className="flex items-center gap-2 text-slate-700">
								<Info className="w-4 h-4 text-[#0517B0] shrink-0" />
								<span>
									Untuk memeriksa foto presensi selfie, koordinat GPS
									checkpoint, dan jadwal harian secara mendalam, buka{" "}
									<b>Panel Akademik</b>.
								</span>
							</div>
							<Link
								href={`/dashboard/students/${studentId}?tab=akademik&subtab=kehadiran`}
								className="inline-flex items-center gap-1 text-[#0517B0] hover:text-blue-800 font-bold hover:underline shrink-0"
							>
								<span>Buka Panel Akademik</span>
								<ExternalLink className="w-3.5 h-3.5" />
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
