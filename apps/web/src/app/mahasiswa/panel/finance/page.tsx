"use client";

import {
	AlertCircle,
	ArrowLeft,
	Banknote,
	Calendar,
	CheckCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Coins,
	CreditCard,
	DollarSign,
	Download,
	ExternalLink,
	Eye,
	FileText,
	GraduationCap,
	HelpCircle,
	Landmark,
	Plane,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	Wallet,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { formatRupiah } from "@/utils/format";

export default function FinancePanelMahasiswa() {
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [mounted, setMounted] = useState(false);
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [expandedSemesters, setExpandedSemesters] = useState<number[]>([]);

	useEffect(() => {
		setMounted(true);
		if (hasHydrated && isAuthenticated && user?.role === "mahasiswa") {
			fetchData();
		}
	}, [user, hasHydrated, isAuthenticated]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const res = await api.mahasiswa.panel.finance.get();
			if (res.data?.success) {
				setData(res.data.data);
			}
		} catch (err) {
			console.error("Gagal memuat data Finance:", err);
		} finally {
			setLoading(false);
		}
	};

	if (!mounted) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[50vh]">
				<RefreshCw className="w-8 h-8 text-[#0517B0] animate-spin" />
			</div>
		);
	}

	const toggleSemester = (semNum: number) => {
		setExpandedSemesters((prev) =>
			prev.includes(semNum)
				? prev.filter((s) => s !== semNum)
				: [...prev, semNum],
		);
	};

	const isTalangan = data?.metodePembayaran === "dana_talangan";

	// Kalkulasi Tahapan/Partisi & Progress Terpadu
	const defaultItems = isTalangan
		? [
				{
					key: "registrasi",
					label: "1. Registrasi Awal",
					desc: "Pembayaran biaya registrasi awal masuk kuliah",
					status: Boolean(data?.registrasiStatus),
					paidDate: data?.registrasiPaidDate,
					nominal: data?.registrasiNominal || 0,
					badge: "Partisi 1",
				},
				{
					key: "admin_talangan",
					label: "2. Administrasi Talangan",
					desc: "Biaya administrasi perjanjian notaris & lembaga keuangan",
					status: Boolean(data?.adminTalaganStatus),
					paidDate: data?.adminTalaganPaidDate,
					nominal: data?.adminTalaganNominal || 0,
					badge: "Biaya Admin",
				},
				{
					key: "tahap_1",
					label: "3. Dana Talangan Tahap 1",
					desc: "Plafon perkuliahan semester & interview magang ditalangi",
					status: Boolean(data?.t1InterviewStatus || data?.t1SemesterStatus),
					paidDate: data?.t1InterviewPaidDate || data?.t1SemesterPaidDate,
					nominal:
						(data?.t1SemesterNominalTotal || 0) +
						(data?.t1InterviewNominal || 0),
					badge: "Talangan Tahap 1",
				},
				{
					key: "tahap_2",
					label: "4. Dana Talangan Tahap 2",
					desc: "Plafon biaya visa, tiket pesawat & keberangkatan magang",
					status: Boolean(data?.t2KeberangkatanStatus),
					paidDate: data?.t2KeberangkatanPaidDate,
					nominal: data?.t2KeberangkatanNominal || 0,
					badge: "Talangan Tahap 2",
				},
			]
		: [
				{
					key: "registrasi",
					label: "1. Registrasi Awal",
					desc: "Pembayaran biaya registrasi awal masuk kuliah",
					status: Boolean(data?.registrasiStatus),
					paidDate: data?.registrasiPaidDate,
					nominal: data?.registrasiNominal || 0,
					badge: "Partisi 1",
				},
				{
					key: "semester",
					label: "2. Perkuliahan 6 Semester",
					desc: "Biaya perkuliahan semester 1 s.d semester 6",
					status: Boolean(data?.mandiriSemesterStatus),
					paidDate: data?.mandiriSemesterPaidDate,
					nominal: data?.mandiriSemesterNominal || 0,
					badge: "Partisi 2",
				},
				{
					key: "interview",
					label: "3. Biaya Interview Magang",
					desc: "Biaya pelaksanaan wawancara kerja magang luar negeri",
					status: Boolean(data?.mandiriInterviewStatus),
					paidDate: data?.mandiriInterviewPaidDate,
					nominal: data?.mandiriInterviewNominal || 0,
					badge: "Partisi 3",
				},
				{
					key: "keberangkatan",
					label: "4. Biaya Keberangkatan",
					desc: "Biaya visa kerja, asuransi & tiket penerbangan ke negara tujuan",
					status: Boolean(data?.mandiriKeberangkatanStatus),
					paidDate: data?.mandiriKeberangkatanPaidDate,
					nominal: data?.mandiriKeberangkatanNominal || 0,
					badge: "Partisi 4",
				},
			];

	const progress = data?.progress || {
		items: defaultItems,
		completedItems: defaultItems.filter((i) => i.status).length,
		totalItems: defaultItems.length,
		completedPartitions: defaultItems.filter((i) => i.status).length,
		totalPartitions: defaultItems.length,
		progressPercent: Math.round(
			(defaultItems.filter((i) => i.status).length / defaultItems.length) * 100,
		),
		totalBiayaPendidikan: data?.totalBiayaPendidikan || 0,
		totalTerbayar: 0,
		sisaTagihan: data?.totalBiayaPendidikan || 0,
		nominalPercent: 0,
		registrasiStatus: Boolean(data?.registrasiStatus),
		semesterStatus: Boolean(
			isTalangan ? data?.t1SemesterStatus : data?.mandiriSemesterStatus,
		),
		interviewStatus: Boolean(
			isTalangan ? data?.t1InterviewStatus : data?.mandiriInterviewStatus,
		),
		keberangkatanStatus: Boolean(
			isTalangan
				? data?.t2KeberangkatanStatus
				: data?.mandiriKeberangkatanStatus,
		),
		adminTalaganStatus: Boolean(data?.adminTalaganStatus),
	};

	const totalBiayaPendidikan =
		progress.totalBiayaPendidikan || data?.totalBiayaPendidikan || 0;
	const regNominal = data?.registrasiNominal || 0;
	const semNominal = isTalangan
		? data?.t1SemesterNominalTotal || 0
		: data?.mandiriSemesterNominal || 0;
	const intNominal = isTalangan
		? data?.t1InterviewNominal || 0
		: data?.mandiriInterviewNominal || 0;
	const kebNominal = isTalangan
		? data?.t2KeberangkatanNominal || 0
		: data?.mandiriKeberangkatanNominal || 0;

	const totalAlokasi = regNominal + semNominal + intNominal + kebNominal;

	// Helper milestone status badge
	const renderMilestoneStatus = (isLunas: boolean, label = "Lunas") => {
		if (isLunas) {
			return (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs font-semibold">
					<CheckCircle2 className="w-3 h-3 mr-1" /> {label}
				</Badge>
			);
		}
		return (
			<Badge
				variant="outline"
				className="text-amber-700 bg-amber-50/50 border-amber-200 text-xs font-medium"
			>
				<Clock className="w-3 h-3 mr-1" /> Belum Lunas
			</Badge>
		);
	};

	const renderChecklistItem = (
		label: string,
		isChecked: boolean,
		note?: string,
	) => (
		<div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl transition-colors hover:bg-slate-100/60">
			<div className="min-w-0 pr-2">
				<span className="font-medium text-slate-700 flex items-center gap-2.5 text-sm">
					<ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
					<span className="truncate">{label}</span>
				</span>
				{note && (
					<p className="text-[11px] text-slate-400 pl-6.5 mt-0.5 truncate">
						{note}
					</p>
				)}
			</div>
			{isChecked ? (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs font-semibold shrink-0">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Lunas / Selesai
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="text-amber-700 bg-amber-50/50 border-amber-200 text-xs font-medium shrink-0"
				>
					<Clock className="w-3 h-3 mr-1" /> Proses
				</Badge>
			)}
		</div>
	);

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	// Hitung cicilan talangan
	const t1Installments = (data?.talanganInstallments || []).filter(
		(ti: any) => ti.stage === "tahap_1",
	);
	const t2Installments = (data?.talanganInstallments || []).filter(
		(ti: any) => ti.stage === "tahap_2",
	);

	const t1Paid = t1Installments.reduce(
		(acc: number, cur: any) => acc + (cur.nominalPaid || 0),
		0,
	);
	const t2Paid = t2Installments.reduce(
		(acc: number, cur: any) => acc + (cur.nominalPaid || 0),
		0,
	);

	const t1TotalBill =
		(data?.t1SemesterNominalTotal || 0) + (data?.t1InterviewNominal || 0);
	const t2TotalBill = data?.t2KeberangkatanNominal || 0;

	return (
		<div className="max-w-4xl mx-auto space-y-6 pb-12">
			<Link
				href="/mahasiswa/dashboard"
				className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard
			</Link>

			<Card className="border-slate-200/90 shadow-sm overflow-hidden rounded-2xl">
				<div className="h-2 w-full bg-[#0517B0]"></div>
				<CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
						<div>
							<CardTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
								Panel Finance (Keuangan Mahasiswa)
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-slate-500">
								Transparansi Tagihan, Partisi Biaya Pendidikan, Pembayaran
								Perkuliahan & Dana Talangan
							</CardDescription>
						</div>
						{data?.isAcc ? (
							<div className="flex flex-col items-end gap-1">
								<Badge className="bg-emerald-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold">
									<CheckCircle className="w-4 h-4 mr-1.5" /> Telah di-ACC
									Finance
								</Badge>
								{data?.accAt && (
									<span className="text-[11px] text-slate-500 font-medium">
										Disetujui: {formatDate(data.accAt)}
									</span>
								)}
							</div>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 px-3.5 py-1.5 text-sm rounded-full bg-white border-slate-200 font-medium"
							>
								<Clock className="w-4 h-4 mr-1.5 text-amber-500" /> Dalam Proses
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-6 sm:p-8 space-y-8">
					{/* Section 0: Progres Pemenuhan Finansial & Partisi Biaya */}
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
							<div>
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
									<Coins className="w-4 h-4 text-[#0517B0]" />
									{isTalangan
										? "Progres Tahapan Pembiayaan Dana Talangan"
										: "Progres Pemenuhan Partisi Biaya Mandiri"}
								</h3>
								<p className="text-xs text-slate-500 mt-0.5">
									{progress.completedItems ?? progress.completedPartitions} dari{" "}
									{progress.totalItems ?? progress.totalPartitions}{" "}
									{isTalangan
										? "tahapan kewajiban talangan"
										: "partisi biaya mandiri"}{" "}
									telah terpenuhi
								</p>
							</div>
							<span className="text-base font-extrabold text-[#0517B0] font-mono">
								{progress.progressPercent}%
							</span>
						</div>

						<Progress
							value={progress.progressPercent}
							className="h-3 bg-slate-100 rounded-full"
						/>

						{/* Method-Aware Checklist Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
							{isTalangan ? (
								<>
									{renderChecklistItem(
										"1. Registrasi Awal (DP)",
										progress.registrasiStatus,
										data?.registrasiPaidDate
											? `Lunas pada ${formatDate(data.registrasiPaidDate)}`
											: "Kewajiban awal pendaftaran langsung",
									)}
									{renderChecklistItem(
										"2. Administrasi Talangan",
										Boolean(data?.adminTalaganStatus),
										data?.adminTalaganPaidDate
											? `Lunas pada ${formatDate(data.adminTalaganPaidDate)}`
											: "Biaya administrasi perjanjian lembaga keuangan",
									)}
									{renderChecklistItem(
										"3. Dana Talangan Tahap 1",
										Boolean(
											data?.t1InterviewStatus ||
												data?.t1SemesterStatus ||
												(t1TotalBill > 0 && t1Paid >= t1TotalBill),
										),
										t1TotalBill > 0
											? `Plafon: ${formatRupiah(t1TotalBill)}${t1Paid > 0 ? ` • Terbayar: ${formatRupiah(t1Paid)}` : ""}`
											: "Plafon perkuliahan semester & interview magang",
									)}
									{renderChecklistItem(
										"4. Dana Talangan Tahap 2",
										Boolean(
											data?.t2KeberangkatanStatus ||
												(t2TotalBill > 0 && t2Paid >= t2TotalBill),
										),
										t2TotalBill > 0
											? `Plafon: ${formatRupiah(t2TotalBill)}${t2Paid > 0 ? ` • Terbayar: ${formatRupiah(t2Paid)}` : ""}`
											: "Plafon tiket pesawat, visa & keberangkatan",
									)}
								</>
							) : (
								<>
									{renderChecklistItem(
										"1. Registrasi Awal (DP)",
										progress.registrasiStatus,
										data?.registrasiPaidDate
											? `Lunas pada ${formatDate(data.registrasiPaidDate)}`
											: "Kewajiban awal pendaftaran langsung",
									)}
									{renderChecklistItem(
										"2. Perkuliahan 6 Semester",
										progress.semesterStatus,
										data?.mandiriSemesterPaidDate
											? `Lunas pada ${formatDate(data.mandiriSemesterPaidDate)}`
											: "Pelunasan perkuliahan semester 1 s.d 6",
									)}
									{renderChecklistItem(
										"3. Biaya Interview Magang",
										progress.interviewStatus,
										data?.mandiriInterviewPaidDate
											? `Lunas pada ${formatDate(data.mandiriInterviewPaidDate)}`
											: "Wawancara kerja user luar negeri",
									)}
									{renderChecklistItem(
										"4. Biaya Keberangkatan",
										progress.keberangkatanStatus,
										data?.mandiriKeberangkatanPaidDate
											? `Lunas pada ${formatDate(data.mandiriKeberangkatanPaidDate)}`
											: "Visa kerja, asuransi & tiket penerbangan",
									)}
								</>
							)}
						</div>
					</div>

					{/* Section 1: Top Partisi Biaya Pendidikan */}
					<div className="bg-gradient-to-br from-slate-900 via-[#07135e] to-[#0517B0] text-white p-6 rounded-2xl shadow-md space-y-5">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/15 pb-4">
							<div>
								<span className="text-xs text-blue-200 font-semibold uppercase tracking-wider block">
									Plafon Biaya Pendidikan
								</span>
								<p className="text-2xl sm:text-3xl font-extrabold font-mono mt-1">
									{formatRupiah(totalBiayaPendidikan)}
								</p>
							</div>
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
								<Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs font-semibold px-3 py-1">
									Metode: {isTalangan ? "Dana Talangan" : "Dana Mandiri"}
								</Badge>
							</div>
						</div>

						{/* Realisasi Keuangan Banner */}
						{totalBiayaPendidikan > 0 && (
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 pb-2 border-b border-white/10">
								<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
									<span className="text-[11px] text-emerald-300 block font-medium">
										Total Terbayar / Terpenuhi
									</span>
									<p className="text-base font-extrabold font-mono mt-0.5 text-emerald-200">
										{formatRupiah(progress.totalTerbayar)}
									</p>
								</div>
								<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
									<span className="text-[11px] text-amber-300 block font-medium">
										Sisa Kewajiban Tagihan
									</span>
									<p className="text-base font-extrabold font-mono mt-0.5 text-amber-200">
										{formatRupiah(progress.sisaTagihan)}
									</p>
								</div>
								<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 flex flex-col justify-between">
									<div className="flex justify-between items-center">
										<span className="text-[11px] text-blue-200 block font-medium">
											Realisasi Finansial
										</span>
										<span className="text-xs font-bold font-mono text-white">
											{progress.nominalPercent}%
										</span>
									</div>
									<Progress
										value={progress.nominalPercent}
										className="h-2 bg-white/20 rounded-full mt-2"
									/>
								</div>
							</div>
						)}

						{/* 4 Mini Cards Partisi */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
								<span className="text-[11px] text-blue-200 block">
									Registrasi Awal
								</span>
								<p className="text-sm font-bold font-mono mt-0.5">
									{formatRupiah(regNominal)}
								</p>
								<div className="mt-2 flex items-center justify-between">
									{data?.registrasiStatus ? (
										<span className="text-[10px] bg-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
											Lunas
										</span>
									) : (
										<span className="text-[10px] bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
											Pending
										</span>
									)}
									{data?.registrasiPaidDate && (
										<span className="text-[10px] text-blue-200">
											{formatDate(data.registrasiPaidDate)}
										</span>
									)}
								</div>
							</div>

							<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
								<span className="text-[11px] text-blue-200 block">
									6 Semester Kuliah
								</span>
								<p className="text-sm font-bold font-mono mt-0.5">
									{formatRupiah(semNominal)}
								</p>
								<div className="mt-2">
									{isTalangan ? (
										<span className="text-[10px] bg-indigo-400/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
											Ditalangi
										</span>
									) : data?.mandiriSemesterStatus ? (
										<span className="text-[10px] bg-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
											Lunas
										</span>
									) : (
										<span className="text-[10px] bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
											Proses
										</span>
									)}
								</div>
							</div>

							<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
								<span className="text-[11px] text-blue-200 block">
									Interview Magang
								</span>
								<p className="text-sm font-bold font-mono mt-0.5">
									{formatRupiah(intNominal)}
								</p>
								<div className="mt-2">
									{(
										isTalangan
											? data?.t1InterviewStatus
											: data?.mandiriInterviewStatus
									) ? (
										<span className="text-[10px] bg-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
											Lunas
										</span>
									) : (
										<span className="text-[10px] bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
											Pending
										</span>
									)}
								</div>
							</div>

							<div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
								<span className="text-[11px] text-blue-200 block">
									Keberangkatan
								</span>
								<p className="text-sm font-bold font-mono mt-0.5">
									{formatRupiah(kebNominal)}
								</p>
								<div className="mt-2">
									{(
										isTalangan
											? data?.t2KeberangkatanStatus
											: data?.mandiriKeberangkatanStatus
									) ? (
										<span className="text-[10px] bg-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
											Lunas
										</span>
									) : (
										<span className="text-[10px] bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full font-bold">
											Pending
										</span>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Section 2: Rincian Pembayaran 6 Semester */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<GraduationCap className="w-4 h-4 text-[#0517B0]" />
								Rincian Biaya Perkuliahan (6 Semester)
							</h3>
						</div>

						{data?.semesters && data.semesters.length > 0 ? (
							<div className="space-y-3">
								{data.semesters.map((sem: any) => {
									const isExpanded = expandedSemesters.includes(
										sem.semesterNumber,
									);
									const totalTerbayar = (sem.installments || []).reduce(
										(acc: number, cur: any) => acc + (cur.nominalPaid || 0),
										0,
									);
									const semPercentage =
										sem.totalBilled > 0
											? Math.min((totalTerbayar / sem.totalBilled) * 100, 100)
											: 0;

									return (
										<div
											key={sem.id}
											className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-xs"
										>
											<div
												onClick={() => toggleSemester(sem.semesterNumber)}
												className="p-4 bg-slate-50/70 hover:bg-slate-100/60 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors"
											>
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-lg bg-[#0517B0]/10 text-[#0517B0] flex items-center justify-center font-bold text-xs">
														S{sem.semesterNumber}
													</div>
													<div>
														<h4 className="font-bold text-slate-800 text-sm">
															Semester {sem.semesterNumber}
														</h4>
														<p className="text-xs text-slate-500 font-mono mt-0.5">
															Tagihan: {formatRupiah(sem.totalBilled || 0)}
														</p>
													</div>
												</div>

												<div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
													<div className="text-right">
														<span className="text-xs font-bold text-slate-700 font-mono block">
															Terbayar: {formatRupiah(totalTerbayar)}
														</span>
														<span className="text-[10px] text-slate-500">
															{Math.round(semPercentage)}% terpenuhi
														</span>
													</div>

													{sem.isTalangan ? (
														<Badge className="bg-indigo-100 text-indigo-800 border-0 text-xs">
															Dana Talangan
														</Badge>
													) : sem.status === "LUNAS" ? (
														<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">
															Lunas
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-amber-700 border-amber-300 text-xs"
														>
															{sem.status === "SEBAGIAN"
																? "Sebagian"
																: "Belum Lunas"}
														</Badge>
													)}

													{isExpanded ? (
														<ChevronUp className="w-4 h-4 text-slate-400" />
													) : (
														<ChevronDown className="w-4 h-4 text-slate-400" />
													)}
												</div>
											</div>

											{/* Detail Cicilan Accordion */}
											{isExpanded && (
												<div className="p-4 border-t border-slate-100 bg-white space-y-3">
													{sem.installments && sem.installments.length > 0 ? (
														<div className="space-y-2">
															<span className="text-xs font-semibold text-slate-500 block">
																Riwayat Pembayaran Cicilan:
															</span>
															{sem.installments.map((ins: any, idx: number) => (
																<div
																	key={ins.id}
																	className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-100"
																>
																	<div className="flex items-center gap-2">
																		<span className="font-bold text-slate-700">
																			Cicilan #
																			{ins.installmentNumber || idx + 1}
																		</span>
																		<span className="text-slate-400">•</span>
																		<span className="text-slate-500 font-mono">
																			{formatRupiah(ins.nominalPaid)}
																		</span>
																	</div>
																	<span className="text-slate-400">
																		{formatDate(ins.paymentDate)}
																	</span>
																</div>
															))}
														</div>
													) : (
														<p className="text-xs text-slate-400 italic py-1">
															Belum ada catatan pembayaran cicilan untuk
															semester ini.
														</p>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
								Rincian tagihan per semester belum dikonfigurasi.
							</div>
						)}
					</div>

					{/* Section 3: Dana Talangan (Jika Metode Talangan) */}
					{isTalangan && (
						<div className="pt-6 border-t border-slate-100 space-y-4">
							<div className="flex items-center gap-2">
								<Wallet className="w-5 h-5 text-indigo-600" />
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
									Informasi Pengajuan & Cicilan Dana Talangan
								</h3>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Tahap 1 Card */}
								<div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
									<div className="flex justify-between items-start">
										<div>
											<span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
												Dana Talangan Tahap 1
											</span>
											<p className="text-xs text-indigo-600 mt-0.5">
												Akumulasi Perkuliahan + Interview Magang
											</p>
										</div>
										<Badge className="bg-indigo-100 text-indigo-900 border-0 text-xs">
											Plafon: {formatRupiah(t1TotalBill)}
										</Badge>
									</div>

									<div className="space-y-1.5">
										<div className="flex justify-between text-xs font-semibold text-indigo-950">
											<span>Sudah Dicicil</span>
											<span className="font-mono">{formatRupiah(t1Paid)}</span>
										</div>
										<Progress
											value={t1TotalBill > 0 ? (t1Paid / t1TotalBill) * 100 : 0}
											className="h-2 bg-indigo-200/50 rounded-full"
										/>
										<div className="flex justify-between text-[11px] text-indigo-700">
											<span>Sisa Tagihan</span>
											<span className="font-mono font-bold">
												{formatRupiah(Math.max(0, t1TotalBill - t1Paid))}
											</span>
										</div>
									</div>

									{/* List Cicilan T1 */}
									{t1Installments.length > 0 && (
										<div className="pt-3 border-t border-indigo-200/50 space-y-1.5">
											<span className="text-[11px] font-semibold text-indigo-800 block">
												Riwayat Cicilan Tahap 1:
											</span>
											{t1Installments.map((ti: any, i: number) => (
												<div
													key={ti.id}
													className="p-2 bg-white/70 rounded-lg flex justify-between items-center text-xs border border-indigo-100"
												>
													<span className="text-indigo-900 font-medium">
														Cicilan #{ti.installmentNumber || i + 1}
													</span>
													<span className="font-mono font-bold text-indigo-950">
														{formatRupiah(ti.nominalPaid)}
													</span>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Tahap 2 Card */}
								<div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
									<div className="flex justify-between items-start">
										<div>
											<span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
												Dana Talangan Tahap 2
											</span>
											<p className="text-xs text-indigo-600 mt-0.5">
												Biaya Pemberangkatan Magang Luar Negeri
											</p>
										</div>
										<Badge className="bg-indigo-100 text-indigo-900 border-0 text-xs">
											Plafon: {formatRupiah(t2TotalBill)}
										</Badge>
									</div>

									<div className="space-y-1.5">
										<div className="flex justify-between text-xs font-semibold text-indigo-950">
											<span>Sudah Dicicil</span>
											<span className="font-mono">{formatRupiah(t2Paid)}</span>
										</div>
										<Progress
											value={t2TotalBill > 0 ? (t2Paid / t2TotalBill) * 100 : 0}
											className="h-2 bg-indigo-200/50 rounded-full"
										/>
										<div className="flex justify-between text-[11px] text-indigo-700">
											<span>Sisa Tagihan</span>
											<span className="font-mono font-bold">
												{formatRupiah(Math.max(0, t2TotalBill - t2Paid))}
											</span>
										</div>
									</div>

									{/* List Cicilan T2 */}
									{t2Installments.length > 0 && (
										<div className="pt-3 border-t border-indigo-200/50 space-y-1.5">
											<span className="text-[11px] font-semibold text-indigo-800 block">
												Riwayat Cicilan Tahap 2:
											</span>
											{t2Installments.map((ti: any, i: number) => (
												<div
													key={ti.id}
													className="p-2 bg-white/70 rounded-lg flex justify-between items-center text-xs border border-indigo-100"
												>
													<span className="text-indigo-900 font-medium">
														Cicilan #{ti.installmentNumber || i + 1}
													</span>
													<span className="font-mono font-bold text-indigo-950">
														{formatRupiah(ti.nominalPaid)}
													</span>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Section 4: Biaya Tambahan Lainnya */}
					<div className="pt-6 border-t border-slate-100 space-y-4">
						<div className="flex items-center gap-2">
							<Coins className="w-5 h-5 text-amber-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Biaya Tambahan & Administrasi
							</h3>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
								<span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
									Sertifikasi Bahasa (TOEIC)
								</span>
								<p className="text-base font-bold text-slate-800 font-mono mt-1">
									{formatRupiah(data?.toeicNominal || 0)}
								</p>
								<div className="mt-2">
									{renderMilestoneStatus(data?.toeicStatus)}
								</div>
							</div>

							<div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
								<span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
									Pembuatan Paspor
								</span>
								<p className="text-base font-bold text-slate-800 font-mono mt-1">
									{formatRupiah(data?.pasporNominal || 0)}
								</p>
								<div className="mt-2">
									{renderMilestoneStatus(data?.pasporStatus)}
								</div>
							</div>

							{isTalangan ? (
								<div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
									<span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
										Administrasi Talangan
									</span>
									<p className="text-base font-bold text-slate-800 font-mono mt-1">
										{formatRupiah(data?.adminTalaganNominal || 0)}
									</p>
									<div className="mt-2">
										{renderMilestoneStatus(data?.adminTalaganStatus)}
									</div>
								</div>
							) : data?.rumahJuangAktif ? (
								<div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
									<span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
										Iuran Rumah Juang
									</span>
									<p className="text-base font-bold text-slate-800 font-mono mt-1">
										{formatRupiah(data?.rumahJuangNominal || 0)}
									</p>
									<div className="mt-2">
										{renderMilestoneStatus(data?.rumahJuangStatus)}
									</div>
								</div>
							) : null}
						</div>

						{/* Custom Fields jika ada */}
						{data?.customFields && data.customFields.length > 0 && (
							<div className="pt-3 space-y-2">
								<span className="text-xs font-semibold text-slate-500 block">
									Item Biaya Kustom Lainnya:
								</span>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{data.customFields.map((cf: any) => (
										<div
											key={cf.id}
											className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
										>
											<div>
												<span className="text-xs font-bold text-slate-800 block">
													{cf.label}
												</span>
												<span className="text-xs text-slate-600 font-mono font-semibold mt-0.5 block">
													{formatRupiah(cf.nominal || 0)}
												</span>
											</div>
											<div>{renderMilestoneStatus(cf.status)}</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Section 5: Dokumen & Berkas Finance */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Bukti Pembayaran & Berkas Finance
							</h3>
						</div>
						{data?.documents && data.documents.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{data.documents.map((doc: any, i: number) => (
									<div
										key={i}
										className="flex items-center justify-between p-3.5 border border-slate-200/80 rounded-xl bg-white shadow-xs"
									>
										<div className="flex items-center gap-3 overflow-hidden">
											<FileText className="w-5 h-5 text-slate-400 shrink-0" />
											<div className="truncate">
												<p className="text-sm font-semibold text-slate-700 truncate">
													{doc.documentKey.replace(/_/g, " ").toUpperCase()}
												</p>
												<p className="text-xs text-slate-500 truncate">
													{doc.fileName}
												</p>
											</div>
										</div>
										<div className="shrink-0 ml-2 flex items-center gap-1.5">
											{doc.isVerified ? (
												<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-2 py-0.5 text-[10px] border-0">
													Terverifikasi
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-500 px-2 py-0.5 text-[10px] bg-white"
												>
													Menunggu
												</Badge>
											)}
											{doc.fileUrl && (
												<a
													href={doc.fileUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
													title="Buka Dokumen"
												>
													<ExternalLink className="w-3.5 h-3.5" />
												</a>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
								<p className="text-sm text-slate-500">
									Belum ada dokumen bukti bayar yang diunggah.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
