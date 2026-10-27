"use client";

import {
	Building2,
	CheckCircle,
	CreditCard,
	Edit,
	Globe2,
	GraduationCap,
	Sparkles,
	Target,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { StreamItem } from "@/hooks/useFinanceProjections";

export function formatRupiah(num: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num || 0);
}

interface FinanceStreamCardsProps {
	streams: StreamItem[];
	total: {
		target: number;
		realisasi: number;
		percentage: number;
		sisa: number;
		surplus: number;
	};
	selectedCohort: string;
	canEdit: boolean;
	onOpenEditModal: () => void;
	isLoading?: boolean;
}

const STREAM_ICONS: Record<string, React.ReactNode> = {
	pmb: <GraduationCap className="w-5 h-5 text-sky-600" />,
	spp_taiwan: <Building2 className="w-5 h-5 text-indigo-600" />,
	spp_malaysia: <Globe2 className="w-5 h-5 text-emerald-600" />,
};

const STREAM_GRADIENTS: Record<
	string,
	{ bg: string; border: string; bar: string }
> = {
	pmb: {
		bg: "from-sky-50/70 via-sky-50/20 to-white",
		border: "border-sky-200/80",
		bar: "bg-linear-to-r from-sky-500 to-blue-600",
	},
	spp_taiwan: {
		bg: "from-indigo-50/70 via-indigo-50/20 to-white",
		border: "border-indigo-200/80",
		bar: "bg-linear-to-r from-indigo-500 to-[#0517B0]",
	},
	spp_malaysia: {
		bg: "from-emerald-50/70 via-emerald-50/20 to-white",
		border: "border-emerald-200/80",
		bar: "bg-linear-to-r from-teal-500 to-emerald-600",
	},
};

export function FinanceStreamCards({
	streams,
	total,
	selectedCohort,
	canEdit,
	onOpenEditModal,
	isLoading = false,
}: FinanceStreamCardsProps) {
	return (
		<div className="space-y-3">
			{/* Header bar of projection cards */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
				<div>
					<h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
						<TrendingUp className="w-4 h-4 text-[#0517B0]" />
						Pagu Target vs Realisasi Uang Masuk per Sumber
					</h3>
					<p className="text-xs text-slate-500 mt-0.5">
						Rincian capaian keuangan per sumber penerimaan resmi (PMB, SPP
						Taiwan, SPP Malaysia) untuk{" "}
						<span className="font-semibold text-slate-700">
							{selectedCohort === "all"
								? "Semua Angkatan"
								: `Angkatan ${selectedCohort}`}
						</span>
					</p>
				</div>

				{canEdit && (
					<Button
						variant="outline"
						size="sm"
						onClick={onOpenEditModal}
						className="h-8 text-xs font-semibold border-blue-200 text-[#0517B0] hover:bg-blue-50 gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
					>
						<Edit className="w-3.5 h-3.5" />
						Ubah Pagu Target
					</Button>
				)}
			</div>

			{/* 4 Cards Grid: 3 Streams + 1 Total Agregat */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
				{streams.map((stream) => {
					const styling = STREAM_GRADIENTS[stream.category] || {
						bg: "from-slate-50 to-white",
						border: "border-slate-200",
						bar: "bg-[#0517B0]",
					};
					const icon = STREAM_ICONS[stream.category] || (
						<Wallet className="w-5 h-5 text-slate-600" />
					);

					return (
						<Card
							key={stream.category}
							className={`bg-linear-to-br ${styling.bg} ${styling.border} shadow-2xs rounded-xl overflow-hidden flex flex-col justify-between`}
						>
							<CardContent className="p-4 space-y-3">
								{/* Row 1: Icon + Title + Capaian Badge */}
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-center gap-2.5">
										<div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
											{icon}
										</div>
										<div>
											<h4 className="text-xs font-bold text-slate-900 leading-tight">
												{stream.label}
											</h4>
											<p className="text-[10px] text-slate-500 line-clamp-1">
												{stream.subLabel}
											</p>
										</div>
									</div>
									<Badge
										className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${
											stream.percentage >= 100
												? "bg-emerald-100 text-emerald-800 border-emerald-200"
												: stream.percentage >= 50
													? "bg-blue-100 text-[#0517B0] border-blue-200"
													: "bg-amber-100 text-amber-800 border-amber-200"
										}`}
									>
										{stream.percentage}%
									</Badge>
								</div>

								{/* Row 2: Realisasi vs Target */}
								<div className="space-y-1">
									<div className="flex items-baseline justify-between">
										<span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
											Realisasi:
										</span>
										<span className="text-base font-black text-slate-900 font-mono tracking-tight">
											{formatRupiah(stream.realisasi)}
										</span>
									</div>
									<div className="flex items-baseline justify-between text-xs">
										<span className="text-[11px] text-slate-400">
											Target Pagu:
										</span>
										<span className="text-xs font-bold text-slate-600 font-mono">
											{formatRupiah(stream.target)}
										</span>
									</div>
								</div>

								{/* Row 3: Progress Bar */}
								<div className="space-y-1">
									<div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden p-0.5">
										<div
											className={`h-full rounded-full transition-all duration-500 ${styling.bar}`}
											style={{
												width: `${Math.min(100, stream.percentage)}%`,
											}}
										/>
									</div>
									<div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
										<span>
											{stream.realisasi >= stream.target ? (
												<span className="text-emerald-600 font-bold">
													✓ Target Terpenuhi
												</span>
											) : (
												<span>Sisa: {formatRupiah(stream.sisa)}</span>
											)}
										</span>
										{stream.surplus > 0 && (
											<span className="text-blue-600 font-bold">
												+{formatRupiah(stream.surplus)}
											</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}

				{/* Card 4: Total Agregat Eksekutif */}
				<Card className="bg-linear-to-br from-blue-100/60 via-indigo-50/40 to-white border-blue-200 shadow-2xs rounded-xl overflow-hidden flex flex-col justify-between">
					<CardContent className="p-4 space-y-3">
						<div className="flex items-start justify-between gap-2">
							<div className="flex items-center gap-2.5">
								<div className="p-2 bg-white rounded-lg border border-blue-200 shadow-2xs">
									<Wallet className="w-5 h-5 text-[#0517B0]" />
								</div>
								<div>
									<h4 className="text-xs font-bold text-slate-900 leading-tight">
										Total Agregat Eksekutif
									</h4>
									<p className="text-[10px] text-slate-500 line-clamp-1">
										Akumulasi kas 3 sumber pendapatan
									</p>
								</div>
							</div>
							<Badge className="bg-[#0517B0] text-white text-[10px] font-black px-2 py-0.5 shadow-2xs">
								{total.percentage}%
							</Badge>
						</div>

						<div className="space-y-1">
							<div className="flex items-baseline justify-between">
								<span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">
									Total Masuk:
								</span>
								<span className="text-base font-black text-[#0517B0] font-mono tracking-tight">
									{formatRupiah(total.realisasi)}
								</span>
							</div>
							<div className="flex items-baseline justify-between text-xs">
								<span className="text-[11px] text-slate-500">
									Total Target:
								</span>
								<span className="text-xs font-bold text-slate-700 font-mono">
									{formatRupiah(total.target)}
								</span>
							</div>
						</div>

						<div className="space-y-1">
							<div className="w-full h-2 bg-blue-200/60 rounded-full overflow-hidden p-0.5">
								<div
									className="h-full rounded-full transition-all duration-500 bg-linear-to-r from-blue-600 to-[#0517B0]"
									style={{
										width: `${Math.min(100, total.percentage)}%`,
									}}
								/>
							</div>
							<div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
								<span>
									{total.realisasi >= total.target ? (
										<span className="text-emerald-700 font-bold">
											✓ Pagu Surplus
										</span>
									) : (
										<span>Defisit: {formatRupiah(total.sisa)}</span>
									)}
								</span>
								<span className="text-[#0517B0] font-bold">
									{selectedCohort === "all"
										? "Seluruh Angkatan"
										: `Angkatan ${selectedCohort}`}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
