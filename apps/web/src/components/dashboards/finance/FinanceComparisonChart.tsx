"use client";

import {
	Activity,
	BarChart3,
	Check,
	Coins,
	Eye,
	Layers,
	LineChart,
	PieChart as PieChartIcon,
	RotateCcw,
	Sparkles,
	Target,
	TrendingUp,
} from "lucide-react";
import React, { useMemo } from "react";
import {
	Area,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
	CohortBreakdownItem,
	StreamItem,
} from "@/hooks/useFinanceProjections";
import {
	type FinanceChartViewMode,
	useFinanceChartStore,
} from "@/store/financeChartStore";
import { formatRupiah } from "./FinanceStreamCards";

interface FinanceComparisonChartProps {
	streams: StreamItem[];
	total: {
		target: number;
		realisasi: number;
		percentage: number;
		sisa: number;
		surplus: number;
	};
	cohortBreakdown: CohortBreakdownItem[];
	selectedCohort: string;
}

function formatCompactRupiah(num: number): string {
	if (num >= 1_000_000_000) {
		return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} M`;
	}
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(0)} Jt`;
	}
	if (num >= 1_000) {
		return `${(num / 1_000).toFixed(0)} Rb`;
	}
	return num.toString();
}

const RADIAL_COLORS = ["#0284c7", "#4f46e5", "#10b981", "#0517B0"];

export function FinanceComparisonChart({
	streams,
	total,
	cohortBreakdown,
	selectedCohort,
}: FinanceComparisonChartProps) {
	// Zustand Store State
	const {
		viewMode,
		setViewMode,
		showTarget,
		showRealisasi,
		showPercentageLine,
		toggleTarget,
		toggleRealisasi,
		togglePercentageLine,
		scaleFormat,
		setScaleFormat,
		resetPreferences,
	} = useFinanceChartStore();

	// Format formatter depending on Zustand scaleFormat
	const yAxisFormatter = (val: number) => {
		if (scaleFormat === "full") return formatRupiah(val);
		return formatCompactRupiah(val);
	};

	// Chart Data 1: Target vs Realisasi per Stream
	const streamChartData = useMemo(() => {
		const items: Array<{
			name: string;
			kategori: string;
			Target: number;
			Realisasi: number;
			persentase: number;
			sisa: number;
			surplus: number;
		}> = streams.map((s) => ({
			name: s.label.replace(" (Registrasi Awal)", ""),
			kategori: s.category,
			Target: s.target,
			Realisasi: s.realisasi,
			persentase: s.percentage,
			sisa: s.sisa,
			surplus: s.surplus,
		}));

		// Append Total
		items.push({
			name: "Total Keseluruhan",
			kategori: "total",
			Target: total.target,
			Realisasi: total.realisasi,
			persentase: total.percentage,
			sisa: total.sisa,
			surplus: total.surplus,
		});

		return items;
	}, [streams, total]);

	// Chart Data 2: Breakdown per Cohort (Angkatan 15 vs 16, dst.)
	const cohortChartData = useMemo(() => {
		if (!cohortBreakdown || cohortBreakdown.length === 0) return [];
		return cohortBreakdown.map((c) => ({
			name: `Angkatan ${c.cohort}`,
			PMB: c.pmb,
			"SPP Taiwan": c.spp_taiwan,
			"SPP Malaysia": c.spp_malaysia,
			Total: c.total,
		}));
	}, [cohortBreakdown]);

	// Chart Data 3: Radial / Donut Capaian Percentage Data
	const radialChartData = useMemo(() => {
		return [
			{
				name: "PMB",
				value: streams.find((s) => s.category === "pmb")?.realisasi || 0,
				target: streams.find((s) => s.category === "pmb")?.target || 0,
				percentage: streams.find((s) => s.category === "pmb")?.percentage || 0,
				color: "#0284c7",
			},
			{
				name: "SPP Taiwan",
				value: streams.find((s) => s.category === "spp_taiwan")?.realisasi || 0,
				target: streams.find((s) => s.category === "spp_taiwan")?.target || 0,
				percentage:
					streams.find((s) => s.category === "spp_taiwan")?.percentage || 0,
				color: "#4f46e5",
			},
			{
				name: "SPP Malaysia",
				value:
					streams.find((s) => s.category === "spp_malaysia")?.realisasi || 0,
				target: streams.find((s) => s.category === "spp_malaysia")?.target || 0,
				percentage:
					streams.find((s) => s.category === "spp_malaysia")?.percentage || 0,
				color: "#10b981",
			},
		];
	}, [streams]);

	// Custom Tooltip for Stream Comparison & Composed View
	const CustomStreamTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			const dataItem = payload[0]?.payload;
			const targetVal = dataItem?.Target || 0;
			const realVal = dataItem?.Realisasi || 0;
			const pct =
				dataItem?.persentase ??
				(targetVal > 0 ? ((realVal / targetVal) * 100).toFixed(1) : 0);

			return (
				<div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-xl space-y-2 text-xs min-w-[220px]">
					<div className="flex items-center justify-between border-b border-slate-100 pb-2">
						<span className="font-bold text-slate-900 text-sm">{label}</span>
						<Badge
							className={`text-[10px] font-bold px-2 py-0.5 ${
								Number(pct) >= 100
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: Number(pct) >= 50
										? "bg-blue-50 text-[#0517B0] border-blue-200"
										: "bg-amber-50 text-amber-700 border-amber-200"
							}`}
						>
							{Number(pct) >= 100 ? "Tercapai" : `${pct}% Capaian`}
						</Badge>
					</div>

					<div className="space-y-1.5 pt-0.5">
						<div className="flex items-center justify-between gap-4">
							<span className="text-slate-500 flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 rounded-xs bg-slate-400" /> Target
								Pagu:
							</span>
							<span className="font-bold text-slate-700 font-mono">
								{formatRupiah(targetVal)}
							</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-slate-500 flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 rounded-xs bg-[#0517B0]" />{" "}
								Realisasi Masuk:
							</span>
							<span className="font-black text-[#0517B0] font-mono">
								{formatRupiah(realVal)}
							</span>
						</div>
						{dataItem?.surplus > 0 ? (
							<div className="flex items-center justify-between gap-4 text-emerald-700 font-semibold pt-1 border-t border-slate-100">
								<span>Surplus Kas:</span>
								<span className="font-mono">
									+{formatRupiah(dataItem.surplus)}
								</span>
							</div>
						) : (
							<div className="flex items-center justify-between gap-4 text-slate-600 font-medium pt-1 border-t border-slate-100">
								<span>Sisa Target:</span>
								<span className="font-mono text-amber-700 font-bold">
									{formatRupiah(dataItem?.sisa || 0)}
								</span>
							</div>
						)}
					</div>
				</div>
			);
		}
		return null;
	};

	// Custom Tooltip for Cohort Comparison
	const CustomCohortTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			const totalVal = payload.reduce(
				(sum: number, p: any) => sum + (p.value || 0),
				0,
			);

			return (
				<div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-xl space-y-2 text-xs min-w-[220px]">
					<p className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-1.5">
						{label}
					</p>
					<div className="space-y-1.5">
						{payload.map((entry: any, index: number) => (
							<div
								key={`item-${index}`}
								className="flex items-center justify-between gap-4"
							>
								<span className="text-slate-500 flex items-center gap-1.5">
									<span
										className="w-2.5 h-2.5 rounded-xs"
										style={{ backgroundColor: entry.color }}
									/>
									{entry.name}:
								</span>
								<span className="font-bold text-slate-800 font-mono">
									{formatRupiah(entry.value)}
								</span>
							</div>
						))}
						<div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-4 font-bold text-slate-900">
							<span>Total Realisasi:</span>
							<span className="font-mono text-[#0517B0]">
								{formatRupiah(totalVal)}
							</span>
						</div>
					</div>
				</div>
			);
		}
		return null;
	};

	return (
		<Card className="bg-white border-slate-200/90 shadow-2xs overflow-hidden rounded-2xl transition-all">
			{/* ─── HEADER DENGAN ZUSTAND CONTROLS ─── */}
			<CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-white">
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
					<div className="flex items-center gap-2.5">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-xl border border-blue-200/60 shadow-xs">
							<BarChart3 className="w-4 h-4" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<CardTitle className="text-base font-bold text-slate-900 tracking-tight">
									Grafik Analisis Proyeksi & Realisasi
								</CardTitle>
								<Badge className="bg-blue-100/80 text-[#0517B0] border-blue-200 text-[10px] font-bold px-2 py-0.5">
									Zustand Reactive Store
								</Badge>
							</div>
							<p className="text-xs text-slate-500 mt-0.5">
								Visualisasi dinamis target pagu vs realisasi kas masuk riil per
								sumber dan angkatan.
							</p>
						</div>
					</div>

					{/* 4 Mode Tab Switcher (State Terpusat di Zustand) */}
					<div className="flex items-center bg-slate-100/90 rounded-xl p-1 border border-slate-200 shadow-2xs self-start lg:self-auto overflow-x-auto max-w-full">
						<button
							type="button"
							onClick={() => setViewMode("target_vs_realisasi")}
							className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
								viewMode === "target_vs_realisasi"
									? "bg-[#0517B0] text-white shadow-xs font-black"
									: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
							}`}
						>
							<BarChart3 className="w-3.5 h-3.5" />
							Bar Komparasi
						</button>
						<button
							type="button"
							onClick={() => setViewMode("trend_composed")}
							className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
								viewMode === "trend_composed"
									? "bg-[#0517B0] text-white shadow-xs font-black"
									: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
							}`}
						>
							<LineChart className="w-3.5 h-3.5" />
							Trend & Garis %
						</button>
						<button
							type="button"
							onClick={() => setViewMode("radial_capaian")}
							className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
								viewMode === "radial_capaian"
									? "bg-[#0517B0] text-white shadow-xs font-black"
									: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
							}`}
						>
							<PieChartIcon className="w-3.5 h-3.5" />
							Distribusi Donut
						</button>
						<button
							type="button"
							onClick={() => setViewMode("cohort_comparison")}
							className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
								viewMode === "cohort_comparison"
									? "bg-[#0517B0] text-white shadow-xs font-black"
									: "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
							}`}
						>
							<Layers className="w-3.5 h-3.5" />
							Komparasi Angkatan
						</button>
					</div>
				</div>

				{/* ─── ZUSTAND INTERACTIVE METRIC TOGGLES & SCALE ─── */}
				{(viewMode === "target_vs_realisasi" ||
					viewMode === "trend_composed") && (
					<div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 mt-2 border-t border-slate-100">
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
								Metrik Aktif:
							</span>
							<button
								type="button"
								onClick={toggleTarget}
								className={`px-2.5 py-1 text-xs rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
									showTarget
										? "bg-slate-100 border-slate-300 text-slate-800 shadow-2xs"
										: "bg-white border-dashed border-slate-200 text-slate-400 line-through"
								}`}
							>
								<span className="w-2.5 h-2.5 rounded-xs bg-slate-400" />
								Target Pagu
								{showTarget && <Check className="w-3 h-3 text-slate-600" />}
							</button>

							<button
								type="button"
								onClick={toggleRealisasi}
								className={`px-2.5 py-1 text-xs rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
									showRealisasi
										? "bg-blue-50 border-blue-300 text-[#0517B0] shadow-2xs"
										: "bg-white border-dashed border-slate-200 text-slate-400 line-through"
								}`}
							>
								<span className="w-2.5 h-2.5 rounded-xs bg-[#0517B0]" />
								Realisasi Masuk
								{showRealisasi && <Check className="w-3 h-3 text-[#0517B0]" />}
							</button>

							{viewMode === "trend_composed" && (
								<button
									type="button"
									onClick={togglePercentageLine}
									className={`px-2.5 py-1 text-xs rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
										showPercentageLine
											? "bg-amber-50 border-amber-300 text-amber-800 shadow-2xs"
											: "bg-white border-dashed border-slate-200 text-slate-400 line-through"
									}`}
								>
									<span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
									Garis Capaian (%)
									{showPercentageLine && (
										<Check className="w-3 h-3 text-amber-600" />
									)}
								</button>
							)}
						</div>

						<div className="flex items-center gap-2">
							<span className="text-[11px] font-bold text-slate-500">
								Skala Y:
							</span>
							<button
								type="button"
								onClick={() =>
									setScaleFormat(scaleFormat === "compact" ? "full" : "compact")
								}
								className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
							>
								{scaleFormat === "compact"
									? "Ringkas (Jt/M)"
									: "Rupiah Lengkap"}
							</button>
						</div>
					</div>
				)}
			</CardHeader>

			<CardContent className="p-4 sm:p-5">
				{/* ─── VIEW 1: TARGET VS REALISASI (GROUPED BAR CHART) ─── */}
				{viewMode === "target_vs_realisasi" && (
					<div className="space-y-3">
						<div className="h-[300px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={streamChartData}
									margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
								>
									<defs>
										{/* Gradient Realisasi */}
										<linearGradient
											id="gradientRealisasi"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="0%"
												stopColor="#0517B0"
												stopOpacity={0.95}
											/>
											<stop
												offset="100%"
												stopColor="#2563eb"
												stopOpacity={0.75}
											/>
										</linearGradient>
										{/* Gradient Target */}
										<linearGradient
											id="gradientTarget"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="0%"
												stopColor="#94a3b8"
												stopOpacity={0.85}
											/>
											<stop
												offset="100%"
												stopColor="#cbd5e1"
												stopOpacity={0.5}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										stroke="#f1f5f9"
									/>
									<XAxis
										dataKey="name"
										stroke="#64748b"
										fontSize={11}
										fontWeight={600}
										tickLine={false}
										axisLine={{ stroke: "#e2e8f0" }}
									/>
									<YAxis
										stroke="#64748b"
										fontSize={11}
										tickLine={false}
										axisLine={{ stroke: "#e2e8f0" }}
										tickFormatter={yAxisFormatter}
									/>
									<Tooltip content={<CustomStreamTooltip />} />
									<Legend
										wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
										iconType="circle"
									/>
									{showTarget && (
										<Bar
											dataKey="Target"
											name="Pagu Target"
											fill="url(#gradientTarget)"
											stroke="#64748b"
											strokeWidth={1}
											radius={[6, 6, 0, 0]}
											maxBarSize={45}
											animationDuration={700}
										/>
									)}
									{showRealisasi && (
										<Bar
											dataKey="Realisasi"
											name="Realisasi Masuk"
											fill="url(#gradientRealisasi)"
											stroke="#0517B0"
											strokeWidth={1}
											radius={[6, 6, 0, 0]}
											maxBarSize={45}
											animationDuration={850}
										/>
									)}
								</BarChart>
							</ResponsiveContainer>
						</div>

						<div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 px-1 gap-2">
							<span className="flex items-center gap-1.5 font-medium">
								<span className="w-2.5 h-2.5 rounded-full bg-[#0517B0]" />
								Biru Royal: Realisasi Kas Riil Terkumpul
							</span>
							<span className="flex items-center gap-1.5 font-medium">
								<span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
								Abu-abu: Pagu Target Proyeksi Resmi
							</span>
							<span className="text-[11px] text-slate-400 font-mono">
								Total Capaian:{" "}
								<strong className="text-slate-700">{total.percentage}%</strong>
							</span>
						</div>
					</div>
				)}

				{/* ─── VIEW 2: TREND & GARIS % (COMPOSED AREA & LINE) ─── */}
				{viewMode === "trend_composed" && (
					<div className="space-y-3">
						<div className="h-[300px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<ComposedChart
									data={streamChartData}
									margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
								>
									<defs>
										<linearGradient id="areaTarget" x1="0" y1="0" x2="0" y2="1">
											<stop
												offset="5%"
												stopColor="#94a3b8"
												stopOpacity={0.25}
											/>
											<stop
												offset="95%"
												stopColor="#94a3b8"
												stopOpacity={0.0}
											/>
										</linearGradient>
										<linearGradient
											id="barRealisasiComposed"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop offset="0%" stopColor="#0517B0" stopOpacity={0.9} />
											<stop
												offset="100%"
												stopColor="#3b82f6"
												stopOpacity={0.7}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										vertical={false}
										stroke="#f1f5f9"
									/>
									<XAxis
										dataKey="name"
										stroke="#64748b"
										fontSize={11}
										fontWeight={600}
										tickLine={false}
										axisLine={{ stroke: "#e2e8f0" }}
									/>
									<YAxis
										yAxisId="left"
										stroke="#64748b"
										fontSize={11}
										tickLine={false}
										axisLine={{ stroke: "#e2e8f0" }}
										tickFormatter={yAxisFormatter}
									/>
									<YAxis
										yAxisId="right"
										orientation="right"
										stroke="#d97706"
										fontSize={11}
										tickLine={false}
										axisLine={false}
										unit="%"
									/>
									<Tooltip content={<CustomStreamTooltip />} />
									<Legend
										wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
										iconType="circle"
									/>
									{showTarget && (
										<Area
											yAxisId="left"
											type="monotone"
											dataKey="Target"
											name="Area Target Pagu"
											fill="url(#areaTarget)"
											stroke="#94a3b8"
											strokeWidth={2}
										/>
									)}
									{showRealisasi && (
										<Bar
											yAxisId="left"
											dataKey="Realisasi"
											name="Batang Realisasi"
											fill="url(#barRealisasiComposed)"
											radius={[6, 6, 0, 0]}
											maxBarSize={38}
										/>
									)}
									{showPercentageLine && (
										<Line
											yAxisId="right"
											type="monotone"
											dataKey="persentase"
											name="Kurva Capaian (%)"
											stroke="#d97706"
											strokeWidth={3}
											dot={{
												r: 4,
												fill: "#d97706",
												strokeWidth: 2,
												stroke: "#fff",
											}}
											activeDot={{ r: 6 }}
										/>
									)}
								</ComposedChart>
							</ResponsiveContainer>
						</div>

						<div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 px-1 gap-2">
							<span className="flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
								Garis Amber: Persentase Ketercapaian Pagu (%)
							</span>
							<span className="font-semibold text-slate-700">
								Analitik Gabungan Area & Kurva
							</span>
						</div>
					</div>
				)}

				{/* ─── VIEW 3: RADIAL / DONUT DISTRIBUSI REALISASI ─── */}
				{viewMode === "radial_capaian" && (
					<div className="space-y-3">
						<div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 py-2">
							<div className="h-[270px] w-full relative flex items-center justify-center">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={radialChartData}
											cx="50%"
											cy="50%"
											innerRadius={65}
											outerRadius={95}
											paddingAngle={5}
											dataKey="value"
											animationDuration={800}
										>
											{radialChartData.map((entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={entry.color}
													stroke="#fff"
													strokeWidth={2}
												/>
											))}
										</Pie>
										<Tooltip
											formatter={(val: any, name: any, item: any) => [
												`${formatRupiah(Number(val))} (${item.payload.percentage}%)`,
												name,
											]}
										/>
									</PieChart>
								</ResponsiveContainer>
								{/* Center Label */}
								<div className="absolute flex flex-col items-center justify-center pointer-events-none">
									<span className="text-2xl font-black text-[#0517B0] tracking-tight">
										{total.percentage}%
									</span>
									<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
										Total Capaian
									</span>
								</div>
							</div>

							{/* Legend Cards */}
							<div className="space-y-2.5">
								<h4 className="text-xs font-bold text-slate-700 mb-2">
									Porsi Realisasi per Sumber:
								</h4>
								{radialChartData.map((item) => (
									<div
										key={item.name}
										className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between"
									>
										<div className="flex items-center gap-2.5">
											<div
												className="w-3.5 h-3.5 rounded-lg shrink-0 shadow-2xs"
												style={{ backgroundColor: item.color }}
											/>
											<div>
												<span className="text-xs font-bold text-slate-800 block">
													{item.name}
												</span>
												<span className="text-[11px] text-slate-500 font-mono">
													Target: {formatCompactRupiah(item.target)}
												</span>
											</div>
										</div>
										<div className="text-right">
											<span className="text-xs font-black text-slate-900 block font-mono">
												{formatRupiah(item.value)}
											</span>
											<span
												className={`text-[11px] font-bold ${
													item.percentage >= 100
														? "text-emerald-700"
														: item.percentage >= 50
															? "text-blue-700"
															: "text-amber-700"
												}`}
											>
												{item.percentage}% Capaian
											</span>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 px-1">
							<span>
								Distribusi kontribusi kas masuk riil antar 3 lumbung utama
							</span>
							<span className="font-bold text-[#0517B0]">
								Total Masuk: {formatRupiah(total.realisasi)}
							</span>
						</div>
					</div>
				)}

				{/* ─── VIEW 4: KOMPARASI ANGKATAN (MULTI-COHORT) ─── */}
				{viewMode === "cohort_comparison" && (
					<div className="space-y-3">
						{cohortChartData.length === 0 ? (
							<div className="h-[280px] flex items-center justify-center text-xs text-slate-400">
								Belum ada data transaksi mahasiswa lintas angkatan untuk
								dibandingkan.
							</div>
						) : (
							<div className="h-[300px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={cohortChartData}
										margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
									>
										<defs>
											<linearGradient id="gradPmb" x1="0" y1="0" x2="0" y2="1">
												<stop
													offset="0%"
													stopColor="#0284c7"
													stopOpacity={0.9}
												/>
												<stop
													offset="100%"
													stopColor="#38bdf8"
													stopOpacity={0.7}
												/>
											</linearGradient>
											<linearGradient
												id="gradTaiwan"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="0%"
													stopColor="#4f46e5"
													stopOpacity={0.9}
												/>
												<stop
													offset="100%"
													stopColor="#818cf8"
													stopOpacity={0.7}
												/>
											</linearGradient>
											<linearGradient
												id="gradMalaysia"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="0%"
													stopColor="#10b981"
													stopOpacity={0.9}
												/>
												<stop
													offset="100%"
													stopColor="#34d399"
													stopOpacity={0.7}
												/>
											</linearGradient>
										</defs>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											stroke="#f1f5f9"
										/>
										<XAxis
											dataKey="name"
											stroke="#64748b"
											fontSize={11}
											fontWeight={600}
											tickLine={false}
											axisLine={{ stroke: "#e2e8f0" }}
										/>
										<YAxis
											stroke="#64748b"
											fontSize={11}
											tickLine={false}
											axisLine={{ stroke: "#e2e8f0" }}
											tickFormatter={yAxisFormatter}
										/>
										<Tooltip content={<CustomCohortTooltip />} />
										<Legend
											wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
											iconType="circle"
										/>
										<Bar
											dataKey="PMB"
											name="PMB (Registrasi)"
											fill="url(#gradPmb)"
											radius={[5, 5, 0, 0]}
											maxBarSize={32}
										/>
										<Bar
											dataKey="SPP Taiwan"
											name="SPP Taiwan"
											fill="url(#gradTaiwan)"
											radius={[5, 5, 0, 0]}
											maxBarSize={32}
										/>
										<Bar
											dataKey="SPP Malaysia"
											name="SPP D3 Malaysia"
											fill="url(#gradMalaysia)"
											radius={[5, 5, 0, 0]}
											maxBarSize={32}
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						)}

						<div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 px-1">
							<span>
								Perbandingan volume uang masuk riil mahasiswa lintas angkatan
								(Segmen 10 & 11)
							</span>
							<span className="font-semibold text-slate-700">
								Multi-Cohort Benchmarking
							</span>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
