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
			<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
				<DialogHeader className="border-b pb-3 border-slate-100">
					<DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
						<PieChart className="w-5 h-5 text-[#0517B0]" />
						Atur Pembagian & Partisi Biaya Pendidikan
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Atur proporsi pembagian total biaya pendidikan ke 4 pos pembayaran
						utama secara akurat.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5 py-4">
					{/* Header Top Summary */}
					<div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="p-3 bg-blue-100/70 text-[#0517B0] rounded-xl font-bold">
								<Lock className="w-5 h-5" />
							</div>
							<div>
								<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
									Total Biaya Pendidikan (Terkunci oleh PMB)
								</span>
								<div className="text-2xl font-black text-[#0517B0] font-mono mt-0.5">
									{formatRupiah(totalBiaya)}
								</div>
							</div>
						</div>

						<div className="text-left md:text-right border-t md:border-t-0 md:border-l md:pl-4 border-slate-200 pt-2 md:pt-0">
							<span className="text-xs font-semibold text-slate-500 block">
								Kewenangan Edit Total
							</span>
							<span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded inline-block mt-1">
								Khusus Divisi PMB / Superadmin
							</span>
						</div>
					</div>

					{/* 4 Partition Inputs Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{/* 1. Registrasi Awal */}
						<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
										<CreditCard className="w-4 h-4 text-sky-600" />
										1. Registrasi Awal
									</label>
									<span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
										{totalBiaya > 0
											? Math.round((registrasi / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2">
									Biaya masuk & registrasi awal
								</p>
								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										onKeyDown={preventMinus}
										value={registrasi || ""}
										onChange={(e) => setRegistrasi(Number(e.target.value) || 0)}
										className="pl-9 h-10 text-sm font-semibold"
										placeholder="Nominal registrasi"
									/>
								</div>
							</div>
							<div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
								{formatRupiah(registrasi)}
							</div>
						</div>

						{/* 2. Perkuliahan 6 Semester */}
						<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
										<GraduationCap className="w-4 h-4 text-indigo-600" />
										2. 6 Semester
									</label>
									<span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
										{totalBiaya > 0
											? Math.round((semesterTotal / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2">
									Per semester (@6 semester)
								</p>
								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										onKeyDown={preventMinus}
										value={semesterPerSem || ""}
										onChange={(e) => {
											const val = Number(e.target.value) || 0;
											setSemesterPerSem(val);
											setSemesterTotal(val * 6);
										}}
										className="pl-9 h-10 text-sm font-semibold"
										placeholder="Nominal per semester"
									/>
								</div>
							</div>
							<div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
								Total 6 Smt:{" "}
								<span className="font-bold text-indigo-900">
									{formatRupiah(semesterTotal)}
								</span>
							</div>
						</div>

						{/* 3. Interview Magang */}
						<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
										<Building className="w-4 h-4 text-amber-600" />
										3. Interview Magang
									</label>
									<span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
										{totalBiaya > 0
											? Math.round((interview / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2">
									Seleksi mitra luar negeri
								</p>
								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										onKeyDown={preventMinus}
										value={interview || ""}
										onChange={(e) => setInterview(Number(e.target.value) || 0)}
										className="pl-9 h-10 text-sm font-semibold"
										placeholder="Nominal interview"
									/>
								</div>
							</div>
							<div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
								{formatRupiah(interview)}
							</div>
						</div>

						{/* 4. Keberangkatan */}
						<div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-1">
									<label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
										<Plane className="w-4 h-4 text-emerald-600" />
										4. Keberangkatan
									</label>
									<span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
										{totalBiaya > 0
											? Math.round((keberangkatan / totalBiaya) * 100)
											: 0}
										%
									</span>
								</div>
								<p className="text-[11px] text-slate-400 mb-2">
									Visa, tiket & keberangkatan
								</p>
								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="number"
										min={0}
										onKeyDown={preventMinus}
										value={keberangkatan || ""}
										onChange={(e) =>
											setKeberangkatan(Number(e.target.value) || 0)
										}
										className="pl-9 h-10 text-sm font-semibold"
										placeholder="Nominal keberangkatan"
									/>
								</div>
							</div>
							<div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
								{formatRupiah(keberangkatan)}
							</div>
						</div>
					</div>

					{/* Quick Helpers & Preset Buttons */}
					<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
						<span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
							<Sparkles className="w-3.5 h-3.5 text-amber-500" /> Bantuan Cepat:
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
								className="h-7 text-[11px] bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
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
								className="h-7 text-[11px] bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
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
								className="h-7 text-[11px] bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
							>
								Bagi Proporsional (10:50:15:25)
							</Button>
						</div>
					</div>

					{/* Live Allocation Summary Box */}
					<div
						className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
							modalIsMatched
								? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
								: modalDiff > 0
									? "bg-amber-50/70 border-amber-200 text-amber-900"
									: "bg-rose-50/70 border-rose-200 text-rose-900"
						}`}
					>
						<div>
							<div className="flex items-center gap-2">
								{modalIsMatched ? (
									<CheckCircle2 className="w-4 h-4 text-emerald-600" />
								) : modalDiff > 0 ? (
									<AlertCircle className="w-4 h-4 text-amber-600" />
								) : (
									<AlertTriangle className="w-4 h-4 text-rose-600" />
								)}
								<span className="text-xs font-bold uppercase tracking-wider">
									{modalIsMatched
										? "Status: Alokasi Pas 100%"
										: modalDiff > 0
											? "Status: Terdapat Sisa Belum Teralokasi"
											: "Status: Total Partisi Melebihi Target"}
								</span>
							</div>
							<p className="text-xs mt-1 opacity-90">
								Total Terbagi:{" "}
								<span className="font-bold">
									{formatRupiah(modalTotalAllocated)}
								</span>{" "}
								dari{" "}
								<span className="font-bold">{formatRupiah(totalBiaya)}</span>
							</p>
						</div>

						<div className="text-right sm:border-l sm:pl-4 border-current/20">
							<span className="text-[11px] block opacity-80 uppercase font-semibold">
								{modalDiff >= 0 ? "Sisa Selisih" : "Kelebihan"}
							</span>
							<span className="text-sm font-black">
								{formatRupiah(Math.abs(modalDiff))}
							</span>
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={saving}
						className="text-xs"
					>
						Batal
					</Button>
					<Button
						onClick={onSave}
						disabled={saving}
						className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
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
