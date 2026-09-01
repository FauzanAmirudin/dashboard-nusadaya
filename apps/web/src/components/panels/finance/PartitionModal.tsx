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
						Atur proporsi pembagian total biaya pendidikan ke 4 pos pembayaran
						utama secara akurat.
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
										onKeyDown={preventFinanceIntegerKey}
										value={registrasi || ""}
										onChange={(e) =>
											setRegistrasi(filterFinanceInteger(e.target.value))
										}
										className="pl-9 h-10 text-sm font-semibold font-mono rounded-xl"
										placeholder="Nominal registrasi"
									/>
								</div>
							</div>
							<div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-semibold font-mono flex items-center justify-between">
								<span className="text-[11px] text-slate-400 font-normal">
									Nominal:
								</span>
								<span>{formatRupiah(registrasi)}</span>
							</div>
						</div>

						{/* 2. Perkuliahan 6 Semester */}
						<div className="p-4 sm:p-4.5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between shadow-2xs">
							<div>
								<div className="flex items-center justify-between gap-1 mb-1">
									<label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
										<GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
										<span className="truncate">2. 6 Semester</span>
									</label>
									<span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full shrink-0 font-mono">
										{totalBiaya > 0
											? Math.round((semesterTotal / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2.5">
									Per semester (@6 semester)
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
										onKeyDown={preventFinanceIntegerKey}
										value={semesterPerSem || ""}
										onChange={(e) => {
											const val = filterFinanceInteger(e.target.value);
											setSemesterPerSem(val);
											setSemesterTotal(filterFinanceInteger(val * 6));
										}}
										className="pl-9 h-10 text-sm font-semibold font-mono rounded-xl"
										placeholder="Nominal per semester"
									/>
								</div>
							</div>
							<div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 font-semibold font-mono flex items-center justify-between">
								<span className="text-[11px] text-slate-400 font-normal">
									Total 6 Smt:
								</span>
								<span className="text-indigo-900 font-bold">
									{formatRupiah(semesterTotal)}
								</span>
							</div>
						</div>

						{/* 3. Interview Magang */}
						<div className="p-4 sm:p-4.5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between shadow-2xs">
							<div>
								<div className="flex items-center justify-between gap-1 mb-1">
									<label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
										<Building className="w-4 h-4 text-amber-600 shrink-0" />
										<span className="truncate">3. Interview Magang</span>
									</label>
									<span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full shrink-0 font-mono">
										{totalBiaya > 0
											? Math.round((interview / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2.5">
									Seleksi mitra luar negeri
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
										onKeyDown={preventFinanceIntegerKey}
										value={interview || ""}
										onChange={(e) =>
											setInterview(filterFinanceInteger(e.target.value))
										}
										className="pl-9 h-10 text-sm font-semibold font-mono rounded-xl"
										placeholder="Nominal interview"
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

						{/* 4. Keberangkatan */}
						<div className="p-4 sm:p-4.5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between shadow-2xs">
							<div>
								<div className="flex items-center justify-between gap-1 mb-1">
									<label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
										<Plane className="w-4 h-4 text-emerald-600 shrink-0" />
										<span className="truncate">4. Keberangkatan</span>
									</label>
									<span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0 font-mono">
										{totalBiaya > 0
											? Math.round((keberangkatan / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2.5">
									Visa, tiket & keberangkatan
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
										onKeyDown={preventFinanceIntegerKey}
										value={keberangkatan || ""}
										onChange={(e) =>
											setKeberangkatan(filterFinanceInteger(e.target.value))
										}
										className="pl-9 h-10 text-sm font-semibold font-mono rounded-xl"
										placeholder="Nominal keberangkatan"
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
								onClick={() => {
									const other =
										Number(registrasi || 0) +
										Number(semesterTotal || 0) +
										Number(interview || 0);
									const rem = Math.max(0, Number(totalBiaya || 0) - other);
									setKeberangkatan(rem);
								}}
								className="h-8 text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg shadow-2xs font-medium"
							>
								Sisa ke Keberangkatan
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									const other =
										Number(registrasi || 0) +
										Number(interview || 0) +
										Number(keberangkatan || 0);
									const rem = Math.max(0, Number(totalBiaya || 0) - other);
									setSemesterTotal(rem);
									setSemesterPerSem(Math.round(rem / 6));
								}}
								className="h-8 text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg shadow-2xs font-medium"
							>
								Sisa ke Semester (Bagi 6)
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									const total = Number(totalBiaya || 0);
									if (total > 0) {
										const reg = Math.round((total * 0.1) / 100000) * 100000;
										const semTot = Math.round((total * 0.5) / 600000) * 600000;
										const intv = Math.round((total * 0.15) / 100000) * 100000;
										const keb = total - (reg + semTot + intv);
										setRegistrasi(reg);
										setSemesterTotal(semTot);
										setSemesterPerSem(Math.round(semTot / 6));
										setInterview(intv);
										setKeberangkatan(keb > 0 ? keb : 0);
									}
								}}
								className="h-8 text-xs bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg shadow-2xs font-medium"
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
						disabled={saving}
						className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 rounded-xl h-10 px-5 shadow-xs"
					>
						{saving ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Save className="w-4 h-4" />
						)}
						Terapkan & Simpan Pembagian
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
