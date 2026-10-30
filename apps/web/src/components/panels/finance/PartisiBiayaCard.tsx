"use client";

import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	Info,
	Lock,
	PieChart,
	SlidersHorizontal,
	Sparkles,
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
	destinationCountry?: string | null;
	pmbDp?: number;
	// Dana Talangan specific props
	hasAdminTalanganDoc?: boolean;
	adminTalaganNominal?: number;
	totalTahap1Nominal?: number;
	totalTahap2Nominal?: number;
	t1Paid?: number;
	t2Paid?: number;
	isTahap1Lunas?: boolean;
	isTahap2Lunas?: boolean;
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
	destinationCountry,
	pmbDp = 0,
	hasAdminTalanganDoc = false,
	adminTalaganNominal = 0,
	totalTahap1Nominal = 0,
	totalTahap2Nominal = 0,
	t1Paid = 0,
	t2Paid = 0,
	isTahap1Lunas = false,
	isTahap2Lunas = false,
}: PartisiBiayaCardProps) {
	const destination = formData?.destinationCountry || destinationCountry;
	const isMalaysia = (destination || "").toLowerCase().includes("malaysia");
	const penempatanLabel = isMalaysia
		? "Penempatan Magang D3 Malaysia / Keberangkatan"
		: "Penempatan Magang Taiwan / Keberangkatan";
	const penempatanShortLabel = isMalaysia
		? `4. Penempatan Malaysia (${kebPct}%)`
		: `4. Penempatan Taiwan (${kebPct}%)`;
	const isTalangan = formData?.metodePembayaran === "dana_talangan";
	const isTalanganSatuTahap =
		isTalangan && formData?.talanganTipe === "1_tahap";

	const t1Pct =
		totalBiaya > 0
			? Math.min(100, Math.round((totalTahap1Nominal / totalBiaya) * 100))
			: 0;
	const t2Pct =
		totalBiaya > 0
			? Math.min(100, Math.round((totalTahap2Nominal / totalBiaya) * 100))
			: 0;
	const adminPct =
		totalBiaya > 0
			? Math.min(100, Math.round((adminTalaganNominal / totalBiaya) * 100))
			: 0;

	const isAdminLunas = Boolean(
		formData?.adminTalaganStatus || hasAdminTalanganDoc,
	);

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
								{isTalangan
									? "Tahapan & Plafon Dana Talangan"
									: "Partisi Biaya Pendidikan"}
							</h3>
							<Badge
								variant="outline"
								className="text-[10px] font-bold bg-slate-50 border-slate-200 text-slate-700 px-2 py-0.5"
							>
								{isTalangan
									? isTalanganSatuTahap
										? "Skema Talangan (1 Tahap — Keberangkatan)"
										: "Skema Talangan (2 Tahap — Bertahap)"
									: "Skema Mandiri (4 Partisi)"}
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							{isTalangan
								? "Plafon pembiayaan bertahap melalui lembaga keuangan dan registrasi"
								: "Alokasi resmi dari total biaya pendidikan ke 4 pos pembayaran utama"}
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

			{/* Info Banner when Total Biaya is 0 / not determined yet by PMB */}
			{totalBiaya === 0 && (
				<div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-950 shadow-2xs">
					<Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
					<div className="space-y-0.5">
						<p className="font-bold text-amber-950">
							Skema Biaya Belum Ditentukan (Pos Keuangan Bernilai Rp 0)
						</p>
						<p className="text-amber-800 leading-relaxed">
							Total biaya pendidikan dan uang muka (DP) mahasiswa ini belum
							ditentukan oleh PMB sehingga seluruh pos tagihan saat ini bernilai{" "}
							<strong>Rp 0</strong>. Nominal akan otomatis muncul setelah
							diinput oleh PMB di{" "}
							<strong>Panel PMB &gt; Tab Skema Keuangan</strong>. Selanjutnya,
							rincian pembagian termin (SPP Semester 1, Kontrak Magang/Suhan,
							dan Penempatan) dapat diatur dan didetailkan oleh Tim Keuangan.
						</p>
					</div>
				</div>
			)}

			{/* Allocation Progress Bar & Method-specific Metric Boxes */}
			<div className="space-y-2.5 pt-2 border-t border-slate-100">
				{/* Multi-segment bar */}
				<div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200/80">
					{totalBiaya > 0 ? (
						<>
							{regPct > 0 && (
								<div
									style={{ width: `${regPct}%` }}
									className="h-full bg-sky-500 rounded-xs transition-all duration-500"
									title={`Registrasi Awal: ${regPct}% (${formatRupiah(curRegistrasi)})`}
								/>
							)}
							{isTalangan ? (
								<>
									{adminPct > 0 && (
										<div
											style={{ width: `${adminPct}%` }}
											className="h-full bg-violet-500 rounded-xs transition-all duration-500"
											title={`Administrasi Talangan: ${adminPct}% (${formatRupiah(adminTalaganNominal)})`}
										/>
									)}
									{!isTalanganSatuTahap && t1Pct > 0 && (
										<div
											style={{ width: `${t1Pct}%` }}
											className="h-full bg-amber-500 rounded-xs transition-all duration-500"
											title={`Talangan Tahap 1: ${t1Pct}% (${formatRupiah(totalTahap1Nominal)})`}
										/>
									)}
									{t2Pct > 0 && (
										<div
											style={{ width: `${t2Pct}%` }}
											className="h-full bg-emerald-500 rounded-xs transition-all duration-500"
											title={`${isTalanganSatuTahap ? "Talangan Keberangkatan" : "Talangan Tahap 2"}: ${t2Pct}% (${formatRupiah(totalTahap2Nominal)})`}
										/>
									)}
								</>
							) : (
								<>
									{semPct > 0 && (
										<div
											style={{ width: `${semPct}%` }}
											className="h-full bg-indigo-500 rounded-xs transition-all duration-500"
											title={`SPP Semester 1: ${semPct}% (${formatRupiah(curSemestersTotal)})`}
										/>
									)}
									{intPct > 0 && (
										<div
											style={{ width: `${intPct}%` }}
											className="h-full bg-amber-500 rounded-xs transition-all duration-500"
											title={`Kontrak Magang / Suhan: ${intPct}% (${formatRupiah(curInterview)})`}
										/>
									)}
									{kebPct > 0 && (
										<div
											style={{ width: `${kebPct}%` }}
											className="h-full bg-emerald-500 rounded-xs transition-all duration-500"
											title={`${penempatanLabel}: ${kebPct}% (${formatRupiah(curKeberangkatan)})`}
										/>
									)}
								</>
							)}
						</>
					) : (
						<div
							className="h-full w-full bg-slate-200/50 rounded-xs"
							title="Total Biaya Belum Ditentukan (Rp 0)"
						/>
					)}
				</div>

				{/* 4 Method-Specific Inline Chips */}
				{isTalangan ? (
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
						{/* 1. Registrasi */}
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
									{curRegistrasi === 0 && pmbDp > 0 && (
										<span className="text-[9px] text-sky-700 bg-sky-100/70 px-1 rounded font-semibold block mt-0.5">
											PMB DP: {formatRupiah(pmbDp)}
										</span>
									)}
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

						{/* 2. Administrasi Talangan */}
						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										2. Admin Talangan
									</p>
									<p className="text-xs font-bold text-slate-800 font-mono">
										{formatRupiah(adminTalaganNominal)}
									</p>
								</div>
							</div>
							{isAdminLunas ? (
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

						{/* 3. Talangan Tahap 1 / Status 1 Tahap */}
						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span
									className={`w-2.5 h-2.5 rounded-full ${
										isTalanganSatuTahap ? "bg-slate-300" : "bg-amber-500"
									} shrink-0`}
								/>
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										{isTalanganSatuTahap
											? "3. Tahap 1 (Di-skip)"
											: "3. Talangan Tahap 1"}
									</p>
									<p className="text-xs font-bold text-slate-800 font-mono">
										{isTalanganSatuTahap
											? "Rp 0"
											: formatRupiah(totalTahap1Nominal)}
									</p>
								</div>
							</div>
							{isTalanganSatuTahap ? (
								<Badge
									variant="outline"
									className="text-slate-400 border-slate-200 text-[9px] px-1.5 py-0"
								>
									1 Tahap
								</Badge>
							) : isTahap1Lunas ? (
								<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold">
									Lunas
								</Badge>
							) : t1Paid > 0 ? (
								<Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] px-1.5 py-0 font-bold">
									{totalTahap1Nominal > 0
										? `${Math.round((t1Paid / totalTahap1Nominal) * 100)}%`
										: "Cicil"}
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

						{/* 4. Talangan Tahap 2 / Keberangkatan */}
						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										{isTalanganSatuTahap
											? "4. Talangan Keberangkatan"
											: "4. Talangan Tahap 2"}
									</p>
									<p className="text-xs font-bold text-slate-800 font-mono">
										{formatRupiah(totalTahap2Nominal)}
									</p>
								</div>
							</div>
							{isTahap2Lunas ? (
								<Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold">
									Lunas
								</Badge>
							) : t2Paid > 0 ? (
								<Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] px-1.5 py-0 font-bold">
									{totalTahap2Nominal > 0
										? `${Math.round((t2Paid / totalTahap2Nominal) * 100)}%`
										: "Cicil"}
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
				) : (
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
						{/* 1. Registrasi */}
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
									{curRegistrasi === 0 && pmbDp > 0 && (
										<span className="text-[9px] text-sky-700 bg-sky-100/70 px-1 rounded font-semibold block mt-0.5">
											PMB DP: {formatRupiah(pmbDp)}
										</span>
									)}
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

						{/* 2. SPP Semester 1 */}
						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										2. SPP Semester 1 ({semPct}%)
									</p>
									<p className="text-xs font-bold text-slate-800 font-mono">
										{formatRupiah(curSemestersTotal)}
									</p>
								</div>
							</div>
							<Badge
								className={
									semestersLunasCount >= 1
										? "bg-emerald-100 text-emerald-700 border-0 text-[9px] px-1.5 py-0 font-bold"
										: "bg-indigo-50 text-indigo-700 border-0 text-[9px] px-1.5 py-0 font-bold"
								}
							>
								{semestersLunasCount >= 1 ? "Lunas" : "Belum"}
							</Badge>
						</div>

						{/* 3. Kontrak Magang / Suhan */}
						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										3. Kontrak / Suhan ({intPct}%)
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

						{/* 4. Penempatan Magang / Keberangkatan */}
						<div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">
										{penempatanShortLabel}
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
				)}
			</div>
		</div>
	);
}
