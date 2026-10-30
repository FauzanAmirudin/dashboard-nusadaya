"use client";

import {
	AlertCircle,
	Calendar,
	Clock,
	FileText,
	GraduationCap,
	Loader2,
	Save,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { filterNumeric, preventNonNumericKey } from "@/utils/form-validators";
import { formatRupiah } from "@/utils/format";

const SEMESTER_1_MONTHS = [
	"Agustus",
	"September",
	"Oktober",
	"November",
	"Desember",
	"Januari",
];

const OTHER_MONTHS = ["Februari", "Maret", "April", "Mei", "Juni", "Juli"];

interface InstallmentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	activeSemester: any;
	activeInstallment: any;
	scheduleForm: {
		nominalScheduled: string;
		dueDate: string;
		notes: string;
		installmentMonth: string;
		periodNotes?: string;
	};
	setScheduleForm: React.Dispatch<
		React.SetStateAction<{
			nominalScheduled: string;
			dueDate: string;
			notes: string;
			installmentMonth: string;
			periodNotes?: string;
		}>
	>;
	saving: boolean;
	onSave: () => void;
	preventMinus: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	totalBilled?: number;
	totalScheduled?: number;
	remainingUnscheduled?: number;
}

export function InstallmentModal({
	open,
	onOpenChange,
	activeSemester,
	activeInstallment,
	scheduleForm,
	setScheduleForm,
	saving,
	onSave,
	preventMinus,
	totalBilled = 0,
	totalScheduled = 0,
	remainingUnscheduled = 0,
}: InstallmentModalProps) {
	const [showOtherMonths, setShowOtherMonths] = useState(false);

	const maxAllowedCapacity =
		totalBilled > 0
			? remainingUnscheduled +
				(activeInstallment
					? Number(activeInstallment.nominalScheduled || 0)
					: 0)
			: 0;
	const isExceedingCapacity =
		totalBilled > 0 &&
		maxAllowedCapacity > 0 &&
		Number(scheduleForm.nominalScheduled || 0) > maxAllowedCapacity;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[95vw] sm:max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl bg-white">
				<DialogHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 shrink-0 bg-white pr-12">
					<DialogTitle className="flex items-center gap-2 text-slate-900 text-base sm:text-lg font-bold">
						<Calendar className="w-5 h-5 text-[#0517B0] shrink-0" />
						<span className="truncate">
							{activeInstallment
								? `Edit Jadwal Cicilan — Semester ${activeSemester?.semesterNumber || 1}`
								: `Tambah Jadwal Cicilan — Semester ${activeSemester?.semesterNumber || 1}`}
						</span>
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500 mt-0.5">
						Tentukan rencana bulan, tanggal jatuh tempo, dan nominal tagihan
						cicilan SPP.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
					{/* Status Tagihan SPP & Kapasitas Penjadwalan */}
					<div className="p-3 sm:p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-indigo-200/80 rounded-xl space-y-2 text-xs">
						<div className="flex items-center justify-between">
							<span className="text-slate-500 font-medium">
								Pagu SPP Semester 1:
							</span>
							<span className="font-bold font-mono text-slate-900 text-sm">
								{formatRupiah(totalBilled)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-slate-500 font-medium">
								Sudah Terjadwal:
							</span>
							<span className="font-semibold font-mono text-indigo-700">
								{formatRupiah(totalScheduled)}
							</span>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-indigo-200/60">
							<div>
								<span className="text-slate-500 font-medium block text-[11px]">
									Sisa Belum Dijadwalkan:
								</span>
								<div className="font-bold font-mono text-indigo-900 text-sm sm:text-base">
									{formatRupiah(remainingUnscheduled)}
								</div>
							</div>
							{remainingUnscheduled > 0 && !activeInstallment && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										setScheduleForm((prev) => ({
											...prev,
											nominalScheduled: remainingUnscheduled.toString(),
										}))
									}
									className="h-7 text-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold self-start sm:self-auto shrink-0 cursor-pointer shadow-2xs"
								>
									Gunakan Sisa Belum Terjadwal
								</Button>
							)}
						</div>
					</div>

					{/* 1. Bulan / Periode Cicilan */}
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Bulan / Periode Cicilan <span className="text-rose-500">*</span>
							</Label>
							<span className="text-[11px] text-slate-400 font-medium">
								Pilih cepat atau ketik
							</span>
						</div>

						{/* Quick Selector Pills */}
						<div className="space-y-1.5 mb-2">
							<div className="text-[11px] text-slate-500 font-medium">
								Pilihan Cepat Semester 1:
							</div>
							<div className="flex flex-wrap gap-1.5">
								{SEMESTER_1_MONTHS.map((m) => {
									const label = `Cicilan Bulan ${m}`;
									const isSelected =
										scheduleForm.installmentMonth === label ||
										scheduleForm.installmentMonth === m;
									return (
										<button
											key={m}
											type="button"
											onClick={() =>
												setScheduleForm((prev) => ({
													...prev,
													installmentMonth: label,
												}))
											}
											className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
												isSelected
													? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold"
													: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
											}`}
										>
											{m}
										</button>
									);
								})}
							</div>

							<div className="pt-1">
								<button
									type="button"
									onClick={() => setShowOtherMonths(!showOtherMonths)}
									className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 cursor-pointer"
								>
									{showOtherMonths
										? "— Sembunyikan bulan lainnya"
										: "+ Tampilkan bulan lainnya (Februari - Juli)"}
								</button>
								{showOtherMonths && (
									<div className="flex flex-wrap gap-1.5 mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80">
										{OTHER_MONTHS.map((m) => {
											const label = `Cicilan Bulan ${m}`;
											const isSelected =
												scheduleForm.installmentMonth === label ||
												scheduleForm.installmentMonth === m;
											return (
												<button
													key={m}
													type="button"
													onClick={() =>
														setScheduleForm((prev) => ({
															...prev,
															installmentMonth: label,
														}))
													}
													className={`text-xs px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer ${
														isSelected
															? "bg-indigo-600 text-white border-indigo-600 font-bold"
															: "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
													}`}
												>
													{m}
												</button>
											);
										})}
									</div>
								)}
							</div>
						</div>

						<Input
							type="text"
							list="schedule-months-list"
							value={scheduleForm.installmentMonth}
							onChange={(e) =>
								setScheduleForm((prev) => ({
									...prev,
									installmentMonth: e.target.value,
								}))
							}
							placeholder="Atau ketik custom: contoh Cicilan Bulan Agustus"
							className="mt-1 text-xs"
						/>
						<datalist id="schedule-months-list">
							{[...SEMESTER_1_MONTHS, ...OTHER_MONTHS].map((m) => (
								<option key={m} value={`Cicilan Bulan ${m}`} />
							))}
						</datalist>
					</div>

					{/* 2. Tanggal Jatuh Tempo */}
					<div>
						<Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
							Tanggal Jatuh Tempo (Rencana Bayar){" "}
							<span className="text-rose-500">*</span>
						</Label>
						<Input
							type="date"
							value={scheduleForm.dueDate}
							onChange={(e) =>
								setScheduleForm((prev) => ({
									...prev,
									dueDate: e.target.value,
								}))
							}
							className="text-xs"
						/>
						<p className="text-[11px] text-slate-400 mt-1">
							Batas tanggal jadwal pembayaran mahasiswa untuk periode ini.
						</p>
					</div>

					{/* 3. Nominal Tagihan Cicilan */}
					<div>
						<Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
							Nominal Tagihan Cicilan (Rp){" "}
							<span className="text-rose-500">*</span>
						</Label>
						<Input
							type="text"
							inputMode="numeric"
							maxLength={9}
							onKeyDown={preventMinus}
							value={scheduleForm.nominalScheduled}
							onFocus={(e) => {
								if (e.target.value === "0") {
									e.target.select();
								}
							}}
							onChange={(e) =>
								setScheduleForm((prev) => ({
									...prev,
									nominalScheduled: filterNumeric(
										e.target.value,
										9,
										"Nominal tagihan maksimal 9 digit",
									),
								}))
							}
							placeholder="0"
							className="font-mono text-sm"
						/>
						<p className="text-[11px] text-slate-400 mt-1">
							Besaran tagihan yang direncanakan harus dibayar pada tanggal jatuh
							tempo ini.
						</p>
						{isExceedingCapacity && (
							<div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800 mt-2">
								<AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
								<div>
									<span className="font-bold block">
										Peringatan: Nominal Melebihi Sisa Pagu SPP!
									</span>
									<span>
										Nominal tagihan (
										{formatRupiah(Number(scheduleForm.nominalScheduled))})
										melebihi kapasitas sisa pagu SPP Semester 1 yang tersedia (
										{formatRupiah(maxAllowedCapacity)}).
									</span>
								</div>
							</div>
						)}
					</div>

					{/* 4. Catatan / Keterangan Jadwal */}
					<div>
						<Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
							Catatan / Keterangan Jadwal
						</Label>
						<Textarea
							value={scheduleForm.notes}
							onChange={(e) =>
								setScheduleForm((prev) => ({
									...prev,
									notes: e.target.value,
								}))
							}
							placeholder="Contoh: Cicilan ke-1 sebelum pelaksanaan perkuliahan dimulai"
							rows={2}
							className="text-xs"
						/>
					</div>
				</div>

				<DialogFooter className="m-0 p-4 sm:p-5 pt-3.5 sm:pt-4 pb-5 sm:pb-6 border-t border-slate-100 bg-slate-50/90 shrink-0 flex flex-row items-center justify-end gap-3">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						disabled={saving}
						className="text-xs h-9.5 px-4 rounded-xl border-slate-200 hover:bg-slate-100 cursor-pointer"
					>
						Batal
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={onSave}
						disabled={saving || isExceedingCapacity}
						className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-semibold h-9.5 px-5 rounded-xl shadow-2xs cursor-pointer gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Save className="w-3.5 h-3.5" />
						)}
						{isExceedingCapacity ? "Nominal Melebihi Pagu" : "Simpan Jadwal"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
