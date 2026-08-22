"use client";

import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	Lock,
	PieChart,
	SlidersHorizontal,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/utils/format";

interface PartisiBiayaCardProps {
	totalBiaya: number;
	formData: any;
	sisaAlokasi: number;
	isMatched: boolean;
	canEdit: boolean;
	openPartitionModal: () => void;
	regPct: number;
	semPct: number;
	intPct: number;
	kebPct: number;
	curRegistrasi: number;
	curSemestersTotal: number;
	curInterview: number;
	curKeberangkatan: number;
	isRegistrasiLunas: boolean;
	semestersLunasCount: number;
	isInterviewLunas: boolean;
	isKeberangkatanLunas: boolean;
}

export function PartisiBiayaCard({
	totalBiaya,
	formData,
	sisaAlokasi,
	isMatched,
	canEdit,
	openPartitionModal,
	regPct,
	semPct,
	intPct,
	kebPct,
	curRegistrasi,
	curSemestersTotal,
	curInterview,
	curKeberangkatan,
	isRegistrasiLunas,
	semestersLunasCount,
	isInterviewLunas,
	isKeberangkatanLunas,
}: PartisiBiayaCardProps) {
	return (
		<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="p-2.5 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100/80 shadow-2xs">
						<PieChart className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
								Partisi Biaya Pendidikan
							</h3>
							<Badge
								variant="outline"
								className="text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-700 px-2 py-0.5"
							>
								{formData?.metodePembayaran === "dana_talangan"
									? "Skema Talangan"
									: "Skema Mandiri"}
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							Alokasi resmi dari total biaya pendidikan ke 4 pos pembayaran
							utama
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					{/* Total Tagihan PMB Badge */}
					<div className="bg-blue-50/80 border border-blue-100 text-[#0517B0] px-3 py-1.5 rounded-lg flex items-center gap-2">
						<Lock className="w-3.5 h-3.5 text-[#0517B0]" />
						<div className="flex flex-col">
							<span className="text-[9px] font-bold uppercase tracking-wider text-blue-800">
								Total Biaya (PMB)
							</span>
							<span className="text-sm font-black text-[#0517B0] leading-none">
								{formatRupiah(totalBiaya)}
							</span>
						</div>
					</div>

					{/* Status Alokasi Pill */}
					{totalBiaya > 0 ? (
						isMatched ? (
							<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
								<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
								Alokasi Pas 100%
							</Badge>
						) : sisaAlokasi > 0 ? (
							<Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
								<AlertCircle className="w-3.5 h-3.5 text-amber-600" />
								Sisa: {formatRupiah(sisaAlokasi)}
							</Badge>
						) : (
							<Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50 px-2.5 py-1.5 text-xs font-semibold gap-1.5">
								<AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
								Lebih: {formatRupiah(Math.abs(sisaAlokasi))}
							</Badge>
						)
					) : (
						<Badge
							variant="outline"
							className="text-slate-400 border-slate-200 text-xs"
						>
							Belum Ditentukan
						</Badge>
					)}

					{canEdit && (
						<Button
							onClick={openPartitionModal}
							size="sm"
							className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs gap-1.5 font-semibold shadow-2xs h-8.5 rounded-lg"
						>
							<SlidersHorizontal className="w-3.5 h-3.5" />
							Atur Pembagian
						</Button>
					)}
				</div>
			</div>

			{/* Allocation Progress Bar & 4 Compact Metric Boxes */}
			{totalBiaya > 0 && (
				<div className="space-y-2.5 pt-2 border-t border-slate-100">
					{/* Multi-segment bar */}
					<div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/80">
						{regPct > 0 && (
							<div
								style={{ width: `${regPct}%` }}
								className="h-full bg-sky-500 rounded-xs transition-all duration-500"
								title={`Registrasi Awal: ${regPct}% (${formatRupiah(curRegistrasi)})`}
							/>
						)}
						{semPct > 0 && (
							<div
								style={{ width: `${semPct}%` }}
								className="h-full bg-indigo-500 rounded-xs transition-all duration-500"
								title={`Perkuliahan 6 Semester: ${semPct}% (${formatRupiah(curSemestersTotal)})`}
							/>
						)}
						{intPct > 0 && (
							<div
								style={{ width: `${intPct}%` }}
								className="h-full bg-amber-500 rounded-xs transition-all duration-500"
								title={`Interview Magang: ${intPct}% (${formatRupiah(curInterview)})`}
							/>
						)}
						{kebPct > 0 && (
							<div
								style={{ width: `${kebPct}%` }}
								className="h-full bg-emerald-500 rounded-xs transition-all duration-500"
								title={`Keberangkatan: ${kebPct}% (${formatRupiah(curKeberangkatan)})`}
							/>
						)}
					</div>

					{/* 4 Compact Inline Chips */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										1. Registrasi ({regPct}%)
									</p>
									<p className="text-xs font-bold text-slate-800 font-mono">
										{formatRupiah(curRegistrasi)}
									</p>
								</div>
							</div>
							{isRegistrasiLunas ? (
								<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold">
									Lunas
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-slate-400 border-slate-200 text-[9px] px-1.5 py-0"
								>
									Belum
								</Badge>
							)}
						</div>

						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										2. 6 Semester ({semPct}%)
									</p>
									<p className="text-xs font-bold text-slate-800 font-mono">
										{formatRupiah(curSemestersTotal)}
									</p>
								</div>
							</div>
							<Badge
								className={
									semestersLunasCount === 6
										? "bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold"
										: "bg-indigo-50 text-indigo-700 border-0 text-[9px] px-1.5 py-0 font-bold"
								}
							>
								{semestersLunasCount}/6 Smt
							</Badge>
						</div>

						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										3. Interview ({intPct}%)
									</p>
									<p className="text-xs font-bold text-slate-800 font-mono">
										{formatRupiah(curInterview)}
									</p>
								</div>
							</div>
							{isInterviewLunas ? (
								<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold">
									Lunas
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-slate-400 border-slate-200 text-[9px] px-1.5 py-0"
								>
									Belum
								</Badge>
							)}
						</div>

						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										4. Berangkat ({kebPct}%)
									</p>
									<p className="text-xs font-bold text-slate-800 font-mono">
										{formatRupiah(curKeberangkatan)}
									</p>
								</div>
							</div>
							{isKeberangkatanLunas ? (
								<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold">
									Lunas
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-slate-400 border-slate-200 text-[9px] px-1.5 py-0"
								>
									Belum
								</Badge>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
