"use client";

import {
	Building2,
	CheckCircle,
	Clock,
	Edit,
	Globe2,
	GraduationCap,
	Sparkles,
	Table as TableIcon,
	TrendingUp,
	Wallet,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { StreamItem } from "@/hooks/useFinanceProjections";
import { formatRupiah } from "./FinanceStreamCards";

interface FinanceProjectionTableProps {
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
}

const STREAM_ICONS: Record<string, React.ReactNode> = {
	pmb: <GraduationCap className="w-4 h-4 text-sky-600" />,
	spp_taiwan: <Building2 className="w-4 h-4 text-indigo-600" />,
	spp_malaysia: <Globe2 className="w-4 h-4 text-emerald-600" />,
};

export function FinanceProjectionTable({
	streams,
	total,
	selectedCohort,
	canEdit,
	onOpenEditModal,
}: FinanceProjectionTableProps) {
	return (
		<Card className="bg-white border-slate-200/90 shadow-2xs overflow-hidden rounded-xl">
			<CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 bg-white">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-2.5">
						<div className="p-2 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-200/60 shadow-2xs">
							<TableIcon className="w-4 h-4" />
						</div>
						<div>
							<CardTitle className="text-base font-bold text-slate-900 tracking-tight">
								Matriks Rincian Target & Realisasi per Sumber
							</CardTitle>
							<p className="text-xs text-slate-500 mt-0.5">
								Tabel rincian kinerja penerimaan kas, sisa target, dan
								persentase capaian institusi.
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 self-start sm:self-auto">
						<Badge
							variant="outline"
							className="text-xs font-semibold bg-slate-50 text-slate-700 border-slate-200 px-2.5 py-1"
						>
							Filter:{" "}
							{selectedCohort === "all"
								? "Semua Angkatan"
								: `Angkatan ${selectedCohort}`}
						</Badge>
						{canEdit && (
							<Button
								variant="outline"
								size="sm"
								onClick={onOpenEditModal}
								className="h-8 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs cursor-pointer"
							>
								<Edit className="w-3.5 h-3.5 text-slate-500" />
								Ubah Target
							</Button>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader className="bg-slate-50/80">
							<TableRow className="border-b border-slate-200/80">
								<TableHead className="w-[280px] text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 px-4">
									Sumber Pendapatan
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 px-4 text-center">
									Angkatan
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 px-4 text-right">
									Pagu Target (Rp)
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 px-4 text-right">
									Realisasi Masuk (Rp)
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 px-4 text-right">
									Sisa / Surplus (Rp)
								</TableHead>
								<TableHead className="w-[180px] text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 px-4">
									% Ketercapaian
								</TableHead>
								<TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider py-3.5 px-4 text-center">
									Status KPI
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{streams.map((stream) => {
								const icon = STREAM_ICONS[stream.category] || (
									<Wallet className="w-4 h-4 text-slate-600" />
								);
								const isReached = stream.realisasi >= stream.target;

								return (
									<TableRow
										key={stream.category}
										className="hover:bg-blue-50/20 transition-colors border-b border-slate-100"
									>
										<TableCell className="py-3 px-4">
											<div className="flex items-center gap-2.5">
												<div className="p-1.5 bg-slate-100 rounded-md shrink-0">
													{icon}
												</div>
												<div>
													<p className="text-xs font-bold text-slate-900">
														{stream.label}
													</p>
													<p className="text-[11px] text-slate-500">
														{stream.subLabel}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell className="py-3 px-4 text-center">
											<span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
												{selectedCohort === "all"
													? "Semua"
													: `Angkatan ${selectedCohort}`}
											</span>
										</TableCell>
										<TableCell className="py-3 px-4 text-right font-mono text-xs font-bold text-slate-700">
											{formatRupiah(stream.target)}
										</TableCell>
										<TableCell className="py-3 px-4 text-right font-mono text-xs font-black text-slate-900">
											{formatRupiah(stream.realisasi)}
										</TableCell>
										<TableCell className="py-3 px-4 text-right font-mono text-xs font-bold">
											{isReached ? (
												<span className="text-emerald-700">
													+{formatRupiah(stream.surplus)}
												</span>
											) : (
												<span className="text-rose-600">
													-{formatRupiah(stream.sisa)}
												</span>
											)}
										</TableCell>
										<TableCell className="py-3 px-4">
											<div className="space-y-1">
												<div className="flex items-center justify-between text-[11px] font-bold">
													<span className="font-mono text-slate-700">
														{stream.percentage}%
													</span>
												</div>
												<div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
													<div
														className={`h-full rounded-full transition-all duration-500 ${
															stream.percentage >= 100
																? "bg-emerald-500"
																: stream.percentage >= 50
																	? "bg-[#0517B0]"
																	: "bg-amber-500"
														}`}
														style={{
															width: `${Math.min(100, stream.percentage)}%`,
														}}
													/>
												</div>
											</div>
										</TableCell>
										<TableCell className="py-3 px-4 text-center">
											<Badge
												className={`text-[10px] font-bold px-2 py-0.5 ${
													stream.percentage >= 100
														? "bg-emerald-100 text-emerald-800 border-emerald-200"
														: stream.percentage >= 50
															? "bg-blue-100 text-[#0517B0] border-blue-200"
															: "bg-amber-100 text-amber-800 border-amber-200"
												}`}
											>
												{stream.percentage >= 100
													? "✓ Tercapai"
													: stream.percentage >= 50
														? "Berjalan Baik"
														: "Perlu Dikejar"}
											</Badge>
										</TableCell>
									</TableRow>
								);
							})}

							{/* Summary Row (Total Agregat) */}
							<TableRow className="bg-slate-50/90 font-black border-t-2 border-slate-300">
								<TableCell className="py-3.5 px-4">
									<div className="flex items-center gap-2">
										<Wallet className="w-4 h-4 text-[#0517B0]" />
										<span className="text-xs font-black text-slate-900 uppercase tracking-wide">
											Total Agregat Institusi
										</span>
									</div>
								</TableCell>
								<TableCell className="py-3.5 px-4 text-center">
									<span className="text-xs font-extrabold text-[#0517B0]">
										{selectedCohort === "all"
											? "Seluruh"
											: `Angk. ${selectedCohort}`}
									</span>
								</TableCell>
								<TableCell className="py-3.5 px-4 text-right font-mono text-xs font-black text-slate-900">
									{formatRupiah(total.target)}
								</TableCell>
								<TableCell className="py-3.5 px-4 text-right font-mono text-sm font-black text-[#0517B0]">
									{formatRupiah(total.realisasi)}
								</TableCell>
								<TableCell className="py-3.5 px-4 text-right font-mono text-xs font-black">
									{total.realisasi >= total.target ? (
										<span className="text-emerald-700">
											+{formatRupiah(total.surplus)}
										</span>
									) : (
										<span className="text-rose-600">
											-{formatRupiah(total.sisa)}
										</span>
									)}
								</TableCell>
								<TableCell className="py-3.5 px-4">
									<div className="space-y-1">
										<div className="flex items-center justify-between text-[11px] font-black text-slate-900">
											<span>{total.percentage}%</span>
										</div>
										<div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5">
											<div
												className="h-full rounded-full bg-linear-to-r from-blue-600 to-[#0517B0]"
												style={{
													width: `${Math.min(100, total.percentage)}%`,
												}}
											/>
										</div>
									</div>
								</TableCell>
								<TableCell className="py-3.5 px-4 text-center">
									<Badge className="bg-[#0517B0] text-white text-[10px] font-black px-2 py-0.5">
										{total.percentage >= 100 ? "Surplus" : "Aktif Dikejar"}
									</Badge>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
