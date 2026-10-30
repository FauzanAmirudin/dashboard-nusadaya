"use client";

import {
	AlertCircle,
	AlertTriangle,
	Building,
	CheckCircle2,
	CreditCard,
	GraduationCap,
	Loader2,
	Lock,
	PieChart,
	Plane,
	Save,
	Sparkles,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	filterFinanceInteger,
	preventFinanceIntegerKey,
} from "@/utils/form-validators";
import { formatRupiah } from "@/utils/format";

interface PartitionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	saving: boolean;
	totalBiaya: number;
	pmbDp?: number;
	registrasi: number;
	setRegistrasi: (val: number) => void;
	semesterPerSem: number;
	setSemesterPerSem: (val: number) => void;
	semesterTotal: number;
	setSemesterTotal: (val: number) => void;
	interview: number;
	setInterview: (val: number) => void;
	keberangkatan: number;
	setKeberangkatan: (val: number) => void;
	onSave: () => void;
	preventMinus: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function PartitionModal({
	open,
	onOpenChange,
	saving,
	totalBiaya,
	pmbDp = 0,
	registrasi,
	setRegistrasi,
	semesterPerSem,
	setSemesterPerSem,
	semesterTotal,
	setSemesterTotal,
	interview,
	setInterview,
	keberangkatan,
	setKeberangkatan,
	onSave,
	preventMinus,
}: PartitionModalProps) {
	const modalTotalAllocated =
		Number(registrasi || 0) +
		Number(semesterTotal || 0) +
		Number(interview || 0) +
		Number(keberangkatan || 0);
	const modalDiff = Number(totalBiaya || 0) - modalTotalAllocated;
	const modalIsMatched = Number(totalBiaya || 0) > 0 && modalDiff === 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-full sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto p-5 sm:p-7">
				<DialogHeader className="border-b pb-4 border-slate-100">
					<DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
						<PieChart className="w-6 h-6 text-[#0517B0]" />
						Atur Pembagian & Partisi Biaya Pendidikan
					</DialogTitle>
					<DialogDescription className="text-xs sm:text-sm text-slate-500 mt-1">
						Atur proporsi pembagian total biaya pendidikan ke 4 termin biaya
						baku (Registrasi, SPP Semester 1, Kontrak Magang/Suhan,
						Penempatan/Keberangkatan).
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-2">
					{/* Header Top Summary */}
					<div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/40 border border-slate-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
						<div className="flex items-center gap-3.5">
							<div className="p-3.5 bg-blue-100/80 text-[#0517B0] rounded-xl font-bold shrink-0 shadow-xs">
								<Lock className="w-5 h-5" />
							</div>
							<div>
								<span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
									Total Biaya Pendidikan (Terkunci oleh PMB)
								</span>
								<div className="text-2xl sm:text-3xl font-black text-[#0517B0] font-mono mt-0.5 tracking-tight">
									{formatRupiah(totalBiaya)}
								</div>
							</div>
						</div>

						<div className="text-left md:text-right border-t md:border-t-0 md:border-l md:pl-5 border-slate-200/80 pt-3 md:pt-0">
							<span className="text-xs font-semibold text-slate-500 block">
								Kewenangan Edit Total
							</span>
							<span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md inline-block mt-1 shadow-2xs">
								Khusus Divisi PMB / Superadmin
							</span>
						</div>
					</div>

					{/* Warning Alert when Total Biaya is 0 / not determined yet by PMB */}
					{totalBiaya <= 0 && (
						<div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs text-amber-950 shadow-xs">
							<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-bold text-sm text-amber-950">
									Total Biaya Belum Ditentukan oleh PMB (Rp 0)
								</p>
								<p className="text-amber-800 leading-relaxed">
									Tim PMB harus menginput Total Biaya Pendidikan dan uang muka
									(DP) terlebih dahulu melalui{" "}
									<strong>Panel PMB &gt; Tab Skema Keuangan</strong>. Setelah
									total biaya terisi, Tim Keuangan dapat merincikan pembagian
									termin di sini dan menyimpannya.
								</p>
							</div>
						</div>
					)}

					{/* Warning Alert when Partition Total Exceeds PMB Total */}
					{totalBiaya > 0 && modalDiff < 0 && (
						<div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3.5 text-xs text-rose-950 shadow-sm animate-pulse-once">
							<div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
								<AlertTriangle className="w-5 h-5 text-rose-600" />
							</div>
							<div className="space-y-1.5 flex-1">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="font-extrabold text-sm text-rose-900">
										Peringatan: Total Pembagian Melebihi Total Biaya Pendidikan!
									</p>
									<span className="font-mono font-black text-rose-700 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full text-xs">
										Kelebihan: +{formatRupiah(Math.abs(modalDiff))}
									</span>
								</div>
								<p className="text-rose-800 leading-relaxed">
									Jumlah alokasi 4 termin saat ini (
									<strong className="font-mono font-bold text-rose-950">
										{formatRupiah(modalTotalAllocated)}
									</strong>
									) melebihi batas Total Biaya Pendidikan yang telah ditetapkan
									PMB (
									<strong className="font-mono font-bold text-slate-900">
										{formatRupiah(totalBiaya)}
									</strong>
									). Mohon kurangi nominal pada termin sebelum menyimpan.
								</p>
							</div>
						</div>
					)}

					{/* 4 Partition Inputs Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
						{/* 1. Registrasi Awal */}
						<div className="p-4 sm:p-4.5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 hover:border-sky-300 hover:shadow-sm transition-all flex flex-col justify-between shadow-2xs">
							<div>
								<div className="flex items-center justify-between gap-1 mb-1">
									<label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
										<CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
										<span className="truncate">1. Registrasi Awal</span>
									</label>
									<span className="text-xs font-extrabold text-sky-700 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded-full shrink-0 font-mono">
										{totalBiaya > 0
											? Math.round((registrasi / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2.5">
									Biaya masuk & registrasi awal
								</p>
								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										max={999999999}
										maxLength={9}
										disabled={totalBiaya <= 0}
										onKeyDown={preventFinanceIntegerKey}
										value={registrasi || ""}
										onChange={(e) =>
											setRegistrasi(filterFinanceInteger(e.target.value))
										}
										className="pl-9 h-10 text-sm font-semibold font-mono rounded-xl disabled:bg-slate-100 disabled:text-slate-400"
										placeholder={
											totalBiaya <= 0
												? "Menunggu input PMB"
												: "Nominal registrasi"
										}
									/>
								</div>
								{totalBiaya > 0 && pmbDp > 0 && registrasi !== pmbDp && (
									<button
										type="button"
										onClick={() => setRegistrasi(pmbDp)}
										className="mt-2 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-1 rounded-md font-medium text-left flex items-center justify-between w-full transition-colors cursor-pointer"
										title="Klik untuk menyelaraskan dengan DP PMB"
									>
										<span>Sesuai DP PMB:</span>
										<span className="font-bold font-mono">
											{formatRupiah(pmbDp)}
										</span>
									</button>
								)}
							</div>
							<div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-semibold font-mono flex items-center justify-between">
								<span className="text-[11px] text-slate-400 font-normal">
									Nominal:
								</span>
								<span>{formatRupiah(registrasi)}</span>
							</div>
						</div>

						{/* 2. Pembayaran SPP Semester 1 */}
						<div className="p-4 sm:p-4.5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between shadow-2xs">
							<div>
								<div className="flex items-center justify-between gap-1 mb-1">
									<label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
										<GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
										<span className="truncate">
											2. Pembayaran SPP Semester 1
										</span>
									</label>
									<span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full shrink-0 font-mono">
										{totalBiaya > 0
											? Math.round((semesterTotal / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2.5">
									Biaya perkuliahan berjalan Semester 1 (cicilan bulanan
									persiapan)
								</p>
								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										max={999999999}
										maxLength={9}
										disabled={totalBiaya <= 0}
										onKeyDown={preventFinanceIntegerKey}
										value={semesterTotal || ""}
										onChange={(e) => {
											const val = filterFinanceInteger(e.target.value);
											setSemesterTotal(val);
											setSemesterPerSem(val);
										}}
										className="pl-9 h-10 text-sm font-semibold font-mono rounded-xl disabled:bg-slate-100 disabled:text-slate-400"
										placeholder={
											totalBiaya <= 0
												? "Menunggu input PMB"
												: "Pagu SPP Semester 1"
										}
									/>
								</div>
							</div>
							<div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-semibold font-mono flex items-center justify-between">
								<span className="text-[11px] text-slate-400 font-normal">
									Total SPP Smt 1:
								</span>
								<span className="text-indigo-900 font-bold">
									{formatRupiah(semesterTotal)}
								</span>
							</div>
						</div>

						{/* 3. Kontrak Magang / Suhan */}
						<div className="p-4 sm:p-4.5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between shadow-2xs">
							<div>
								<div className="flex items-center justify-between gap-1 mb-1">
									<label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
										<Building className="w-4 h-4 text-amber-600 shrink-0" />
										<span className="truncate">3. Kontrak Magang / Suhan</span>
									</label>
									<span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full shrink-0 font-mono">
										{totalBiaya > 0
											? Math.round((interview / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2.5">
									Biaya proses turun kontrak kerja & surat izin Suhan Taiwan
								</p>
								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										max={999999999}
										maxLength={9}
										disabled={totalBiaya <= 0}
										onKeyDown={preventFinanceIntegerKey}
										value={interview || ""}
										onChange={(e) =>
											setInterview(filterFinanceInteger(e.target.value))
										}
										className="pl-9 h-10 text-sm font-semibold font-mono rounded-xl disabled:bg-slate-100 disabled:text-slate-400"
										placeholder={
											totalBiaya <= 0
												? "Menunggu input PMB"
												: "Nominal kontrak / suhan"
										}
									/>
								</div>
							</div>
							<div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-semibold font-mono flex items-center justify-between">
								<span className="text-[11px] text-slate-400 font-normal">
									Nominal:
								</span>
								<span>{formatRupiah(interview)}</span>
							</div>
						</div>

						{/* 4. Penempatan Magang Taiwan / Keberangkatan */}
						<div className="p-4 sm:p-4.5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between shadow-2xs">
							<div>
								<div className="flex items-center justify-between gap-1 mb-1">
									<label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
										<Plane className="w-4 h-4 text-emerald-600 shrink-0" />
										<span className="truncate">
											4. Penempatan Magang Taiwan / Keberangkatan
										</span>
									</label>
									<span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0 font-mono">
										{totalBiaya > 0
											? Math.round((keberangkatan / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2.5">
									Biaya penempatan magang, visa, dan tiket penerbangan
								</p>
								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										max={999999999}
										maxLength={9}
										disabled={totalBiaya <= 0}
										onKeyDown={preventFinanceIntegerKey}
										value={keberangkatan || ""}
										onChange={(e) =>
											setKeberangkatan(filterFinanceInteger(e.target.value))
										}
										className="pl-9 h-10 text-sm font-semibold font-mono rounded-xl disabled:bg-slate-100 disabled:text-slate-400"
										placeholder={
											totalBiaya <= 0
												? "Menunggu input PMB"
												: "Nominal penempatan / keberangkatan"
										}
									/>
								</div>
							</div>
							<div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-semibold font-mono flex items-center justify-between">
								<span className="text-[11px] text-slate-400 font-normal">
									Nominal:
								</span>
								<span>{formatRupiah(keberangkatan)}</span>
							</div>
						</div>
					</div>

					{/* Quick Helpers & Preset Buttons */}
					<div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3">
						<span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
							<Sparkles className="w-4 h-4 text-amber-500" /> Bantuan Cepat
							Pembagian:
						</span>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={totalBiaya <= 0}
								onClick={() => {
									const other =
										Number(registrasi || 0) +
										Number(semesterTotal || 0) +
										Number(interview || 0);
									const rem = Math.max(0, Number(totalBiaya || 0) - other);
									setKeberangkatan(rem);
								}}
								className="h-8 text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg shadow-2xs font-medium disabled:opacity-50"
							>
								Sisa ke Penempatan
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={totalBiaya <= 0}
								onClick={() => {
									const other =
										Number(registrasi || 0) +
										Number(interview || 0) +
										Number(keberangkatan || 0);
									const rem = Math.max(0, Number(totalBiaya || 0) - other);
									setSemesterTotal(rem);
									setSemesterPerSem(rem);
								}}
								className="h-8 text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg shadow-2xs font-medium disabled:opacity-50"
							>
								Sisa ke SPP Semester 1
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={totalBiaya <= 0}
								onClick={() => {
									const total = Number(totalBiaya || 0);
									if (total > 0) {
										const reg = Math.round((total * 0.1) / 100000) * 100000;
										const semTot = Math.round((total * 0.5) / 600000) * 600000;
										const intv = Math.round((total * 0.15) / 100000) * 100000;
										const keb = total - (reg + semTot + intv);
										setRegistrasi(reg);
										setSemesterTotal(semTot);
										setSemesterPerSem(semTot);
										setInterview(intv);
										setKeberangkatan(keb > 0 ? keb : 0);
									}
								}}
								className="h-8 text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg shadow-2xs font-medium disabled:opacity-50"
							>
								Bagi Proporsional (10:50:15:25)
							</Button>
						</div>
					</div>

					{/* Live Allocation Summary Box */}
					<div
						className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
							modalIsMatched
								? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
								: modalDiff > 0
									? "bg-amber-50/80 border-amber-200 text-amber-950"
									: "bg-rose-50/80 border-rose-200 text-rose-950"
						}`}
					>
						<div>
							<div className="flex items-center gap-2">
								{modalIsMatched ? (
									<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
								) : modalDiff > 0 ? (
									<AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
								) : (
									<AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
								)}
								<span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
									{modalIsMatched
										? "Status: Alokasi Pas 100%"
										: modalDiff > 0
											? "Status: Terdapat Sisa Belum Teralokasi"
											: "Status: Total Partisi Melebihi Target"}
								</span>
							</div>
							<p className="text-xs sm:text-sm mt-1.5 opacity-90">
								Total Terbagi:{" "}
								<span className="font-bold font-mono">
									{formatRupiah(modalTotalAllocated)}
								</span>{" "}
								dari{" "}
								<span className="font-bold font-mono">
									{formatRupiah(totalBiaya)}
								</span>
							</p>
						</div>

						<div className="text-left sm:text-right sm:border-l sm:pl-5 border-current/20 shrink-0">
							<span className="text-[11px] block opacity-80 uppercase font-semibold">
								{modalDiff >= 0 ? "Sisa Selisih" : "Kelebihan"}
							</span>
							<span className="text-base sm:text-lg font-black font-mono">
								{formatRupiah(Math.abs(modalDiff))}
							</span>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={saving}
						className="text-xs rounded-xl h-10 px-4"
					>
						Batal
					</Button>
					<Button
						onClick={onSave}
						disabled={saving || totalBiaya <= 0 || !modalIsMatched}
						className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 rounded-xl h-10 px-5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Save className="w-4 h-4" />
						)}
						{totalBiaya <= 0
							? "Menunggu Total Biaya dari PMB"
							: modalDiff < 0
								? "Pembagian Melebihi Total Biaya"
								: modalDiff > 0
									? "Pembagian Belum Pas 100%"
									: "Terapkan & Simpan Pembagian"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
