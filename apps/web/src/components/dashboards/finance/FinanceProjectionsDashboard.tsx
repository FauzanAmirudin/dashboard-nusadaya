"use client";

import { Calendar, SlidersHorizontal, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type StreamItem,
	useFinanceProjections,
} from "@/hooks/useFinanceProjections";
import { useAuthStore } from "@/store";
import { EditProjectionTargetModal } from "./EditProjectionTargetModal";
import { FinanceComparisonChart } from "./FinanceComparisonChart";
import { FinanceProjectionTable } from "./FinanceProjectionTable";
import { FinanceStreamCards } from "./FinanceStreamCards";

type DatePreset =
	| "this_month"
	| "last_month"
	| "last_3_months"
	| "this_year"
	| "all"
	| "custom";

const datePresetButtons: { key: DatePreset; label: string }[] = [
	{ key: "this_month", label: "Bulan Ini" },
	{ key: "last_month", label: "Bulan Lalu" },
	{ key: "last_3_months", label: "3 Bulan" },
	{ key: "this_year", label: "Tahun Ini" },
	{ key: "all", label: "Semua Waktu" },
	{ key: "custom", label: "Kustom" },
];

export function FinanceProjectionsDashboard() {
	const { user } = useAuthStore();
	const canEditTarget = Boolean(
		user && (user.role === "finance" || user.role === "superadmin"),
	);

	const [selectedCohort, setSelectedCohort] = useState<string>("all");
	const [selectedYear, setSelectedYear] = useState<number>(2026);
	const [datePreset, setDatePreset] = useState<DatePreset>("this_year");
	const [customStartDate, setCustomStartDate] = useState<string>(() => {
		const now = new Date();
		return new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
	});
	const [customEndDate, setCustomEndDate] = useState<string>(() => {
		const now = new Date();
		return new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0];
	});

	const [isEditTargetModalOpen, setIsEditTargetModalOpen] = useState(false);

	// Calculate active date range
	const activeDateRange = useMemo(() => {
		const now = new Date();
		if (datePreset === "this_month") {
			const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
			const end = new Date(
				now.getFullYear(),
				now.getMonth() + 1,
				0,
				23,
				59,
				59,
				999,
			);
			const label = start.toLocaleDateString("id-ID", {
				month: "long",
				year: "numeric",
			});
			return { start, end, label: `Bulan Ini (${label})` };
		}
		if (datePreset === "last_month") {
			const start = new Date(
				now.getFullYear(),
				now.getMonth() - 1,
				1,
				0,
				0,
				0,
				0,
			);
			const end = new Date(
				now.getFullYear(),
				now.getMonth(),
				0,
				23,
				59,
				59,
				999,
			);
			const label = start.toLocaleDateString("id-ID", {
				month: "long",
				year: "numeric",
			});
			return { start, end, label: `Bulan Lalu (${label})` };
		}
		if (datePreset === "last_3_months") {
			const start = new Date(
				now.getFullYear(),
				now.getMonth() - 2,
				1,
				0,
				0,
				0,
				0,
			);
			const end = new Date(
				now.getFullYear(),
				now.getMonth() + 1,
				0,
				23,
				59,
				59,
				999,
			);
			return { start, end, label: "3 Bulan Terakhir" };
		}
		if (datePreset === "this_year") {
			const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
			const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
			return { start, end, label: `Tahun Ini (${now.getFullYear()})` };
		}
		if (datePreset === "custom" && customStartDate && customEndDate) {
			const start = new Date(`${customStartDate}T00:00:00`);
			const end = new Date(`${customEndDate}T23:59:59`);
			const startStr = start.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
			const endStr = end.toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
			return { start, end, label: `${startStr} - ${endStr}` };
		}
		// All time
		const start = new Date(2020, 0, 1);
		const end = new Date(2035, 11, 31);
		return { start, end, label: "Semua Waktu" };
	}, [datePreset, customStartDate, customEndDate]);

	// Fetch projection data from server API
	const {
		data: projectionsData,
		isLoading,
		refetch,
	} = useFinanceProjections({
		cohort: selectedCohort,
		year: selectedYear,
		startDate:
			datePreset === "all"
				? undefined
				: activeDateRange.start.toISOString().split("T")[0],
		endDate:
			datePreset === "all"
				? undefined
				: activeDateRange.end.toISOString().split("T")[0],
	});

	// Sinkronisasi Real-Time multi-panel & multi-tab
	useEffect(() => {
		const handleSyncEvent = () => {
			refetch();
		};
		window.addEventListener("student-updated", handleSyncEvent);
		window.addEventListener("pmb-progress-sync", handleSyncEvent);

		let channel: BroadcastChannel | null = null;
		try {
			if (typeof BroadcastChannel !== "undefined") {
				channel = new BroadcastChannel("dashboard-realtime-sync");
				channel.onmessage = () => {
					refetch();
				};
			}
		} catch {}

		return () => {
			window.removeEventListener("student-updated", handleSyncEvent);
			window.removeEventListener("pmb-progress-sync", handleSyncEvent);
			if (channel) channel.close();
		};
	}, [refetch]);

	// Default fallback streams if loading
	const streams: StreamItem[] = useMemo(() => {
		if (projectionsData?.streams && projectionsData.streams.length > 0) {
			return projectionsData.streams;
		}
		return [
			{
				category: "pmb",
				label: "PMB (Registrasi Awal)",
				subLabel: "Biaya masuk / daftar ulang mahasiswa baru",
				target: 75_000_000,
				realisasi: 0,
				percentage: 0,
				sisa: 75_000_000,
				surplus: 0,
			},
			{
				category: "spp_taiwan",
				label: "SPP Taiwan",
				subLabel: "Program persiapan kuliah & vokasi Taiwan",
				target: 150_000_000,
				realisasi: 0,
				percentage: 0,
				sisa: 150_000_000,
				surplus: 0,
			},
			{
				category: "spp_malaysia",
				label: "SPP D3 Malaysia",
				subLabel: "Program diploma 3 Malaysia & praktikum",
				target: 90_000_000,
				realisasi: 0,
				percentage: 0,
				sisa: 90_000_000,
				surplus: 0,
			},
		];
	}, [projectionsData]);

	const totalProjection = useMemo(() => {
		if (projectionsData?.total) {
			return projectionsData.total;
		}
		const tTarget = streams.reduce((acc, s) => acc + s.target, 0);
		const tReal = streams.reduce((acc, s) => acc + s.realisasi, 0);
		const pct = tTarget > 0 ? Number(((tReal / tTarget) * 100).toFixed(1)) : 0;
		return {
			target: tTarget,
			targetSemester: Math.round(tTarget / 2),
			targetBulanan: Math.round(tTarget / 12),
			realisasi: tReal,
			percentage: pct,
			sisa: Math.max(0, tTarget - tReal),
			surplus: Math.max(0, tReal - tTarget),
		};
	}, [projectionsData, streams]);

	const cohortBreakdown = useMemo(() => {
		return projectionsData?.cohortBreakdown || [];
	}, [projectionsData]);

	const availableCohorts = useMemo(() => {
		const raw = projectionsData?.availableCohorts || [18, 17, 16, 15, 14];
		// Filter ketat: Angkatan hanya format nomor urut (1..99), bukan format tahun 4 digit
		const set = new Set<number>(raw.filter((c) => c > 0 && c < 100));
		[18, 17, 16, 15, 14].forEach((c) => set.add(c));
		return Array.from(set).sort((a, b) => b - a);
	}, [projectionsData]);

	return (
		<div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
			{/* ─── 1. TOP EXECUTIVE HEADER ─── */}
			<div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
				<div className="flex items-center gap-3.5">
					<div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100/80 flex items-center justify-center shadow-xs shrink-0">
						<TrendingUp className="w-6 h-6" />
					</div>
					<div>
						<h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
							Proyeksi Target & Realisasi Pendapatan
						</h1>
					</div>
				</div>
			</div>

			{/* ─── 2. BARIS KONTROL FILTER (ANGKATAN & PRESET TANGGAL) ─── */}
			<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
				{/* Pilihan Angkatan & Tahun Ajaran */}
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<SlidersHorizontal className="w-4 h-4 text-[#0517B0]" />
						<span className="text-xs font-bold text-slate-700">Angkatan:</span>
					</div>
					<Select
						value={selectedCohort}
						onValueChange={(val) => setSelectedCohort(val || "all")}
					>
						<SelectTrigger className="w-[160px] h-9 text-xs bg-white border-slate-300 font-bold text-slate-800 shadow-2xs rounded-lg">
							<SelectValue placeholder="Semua Angkatan">
								{selectedCohort === "all"
									? "Semua Angkatan (Global)"
									: `Angkatan ${selectedCohort}`}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Angkatan (Global)</SelectItem>
							{availableCohorts.map((cohort) => (
								<SelectItem key={cohort} value={cohort.toString()}>
									Angkatan {cohort}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Selector Tahun Ajaran */}
					<div className="flex items-center gap-1.5 ml-1">
						<Calendar className="w-4 h-4 text-[#0517B0]" />
						<span className="text-xs font-bold text-slate-700">T.A:</span>
					</div>
					<Select
						value={selectedYear.toString()}
						onValueChange={(val) => {
							if (val) setSelectedYear(Number(val));
						}}
					>
						<SelectTrigger className="w-[160px] h-9 text-xs bg-white border-slate-300 font-bold text-slate-800 shadow-2xs rounded-lg">
							<SelectValue placeholder="Pilih T.A.">
								{`${selectedYear}/${selectedYear + 1}`}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="2026">2026/2027 (Aktif)</SelectItem>
							<SelectItem value="2025">2025/2026</SelectItem>
							<SelectItem value="2024">2024/2025</SelectItem>
							<SelectItem value="2027">2027/2028</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Pilihan Rentang Waktu */}
				<div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
					<div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200 shadow-2xs">
						{datePresetButtons.map((btn) => (
							<button
								key={btn.key}
								type="button"
								onClick={() => setDatePreset(btn.key)}
								className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
									datePreset === btn.key
										? "bg-[#0517B0] text-white shadow-xs font-bold"
										: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
								}`}
							>
								{btn.label}
							</button>
						))}
					</div>

					{datePreset === "custom" && (
						<div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
							<Calendar className="w-3.5 h-3.5 text-[#0517B0] shrink-0" />
							<div className="flex items-center gap-1.5 text-xs">
								<input
									type="date"
									value={customStartDate}
									onChange={(e) => setCustomStartDate(e.target.value)}
									className="bg-transparent text-xs text-slate-800 font-semibold outline-hidden cursor-pointer"
								/>
								<span className="text-slate-400 font-medium">s/d</span>
								<input
									type="date"
									value={customEndDate}
									onChange={(e) => setCustomEndDate(e.target.value)}
									className="bg-transparent text-xs text-slate-800 font-semibold outline-hidden cursor-pointer"
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* ─── 3. 4 KARTU METRIK SUMBER PENDAPATAN (PMB, SPP TAIWAN, SPP MALAYSIA, TOTAL) ─── */}
			<FinanceStreamCards
				streams={streams}
				total={totalProjection}
				selectedCohort={selectedCohort}
				canEdit={canEditTarget}
				onOpenEditModal={() => setIsEditTargetModalOpen(true)}
				isLoading={isLoading}
			/>

			{/* ─── 4. GRAFIK KOMPARASI RECHARTS (TARGET VS REALISASI & ANTAR-ANGKATAN) ─── */}
			<FinanceComparisonChart
				streams={streams}
				total={totalProjection}
				cohortBreakdown={cohortBreakdown}
				selectedCohort={selectedCohort}
			/>

			{/* ─── 5. TABEL MATRIKS BREAKDOWN RINCIAN EKSEKUTIF ─── */}
			<FinanceProjectionTable
				streams={streams}
				total={totalProjection}
				selectedCohort={selectedCohort}
				canEdit={canEditTarget}
				onOpenEditModal={() => setIsEditTargetModalOpen(true)}
			/>

			{/* ─── 6. MODAL DIALOG UBAH PAGU TARGET ─── */}
			<EditProjectionTargetModal
				isOpen={isEditTargetModalOpen}
				onClose={() => setIsEditTargetModalOpen(false)}
				streams={streams}
				selectedCohort={selectedCohort}
				availableCohorts={availableCohorts}
				year={selectedYear}
			/>
		</div>
	);
}
