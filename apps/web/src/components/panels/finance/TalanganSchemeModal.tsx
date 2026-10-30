"use client";

import {
	AlertCircle,
	Banknote,
	Building,
	CheckCircle2,
	Coins,
	FileText,
	Info,
	Layers,
	Loader2,
	Plane,
	Save,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { API_URL, getToken } from "@/lib/eden";
import { filterNumeric, preventNonNumericKey } from "@/utils/form-validators";
import { formatRupiah } from "@/utils/format";

interface TalanganSchemeModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	studentId: number;
	currentScheme: {
		talanganTipe?: string;
		talanganTotalPengajuan?: number;
		talanganLembaga?: string;
		talanganNotes?: string;
		t1Nominal?: number;
		t2Nominal?: number;
		totalBiayaPendidikan?: number;
	};
	onSuccess: () => void;
}

export function TalanganSchemeModal({
	open,
	onOpenChange,
	studentId,
	currentScheme,
	onSuccess,
}: TalanganSchemeModalProps) {
	const [tipe, setTipe] = useState<"1_tahap" | "2_tahap">("2_tahap");
	const [totalPengajuan, setTotalPengajuan] = useState<string>("");
	const [tahap1Nominal, setTahap1Nominal] = useState<string>("");
	const [tahap2Nominal, setTahap2Nominal] = useState<string>("");
	const [lembaga, setLembaga] = useState<string>("");
	const [notes, setNotes] = useState<string>("");
	const [isSaving, setIsSaving] = useState(false);

	// Sinkronisasi data saat modal dibuka
	useEffect(() => {
		if (open) {
			const initialTipe =
				currentScheme?.talanganTipe === "1_tahap" ? "1_tahap" : "2_tahap";
			setTipe(initialTipe);

			const currentTotal =
				Number(currentScheme?.talanganTotalPengajuan) ||
				Number(currentScheme?.t1Nominal || 0) +
					Number(currentScheme?.t2Nominal || 0);

			setTotalPengajuan(currentTotal > 0 ? currentTotal.toString() : "");
			setLembaga(currentScheme?.talanganLembaga || "");
			setNotes(currentScheme?.talanganNotes || "");

			if (initialTipe === "1_tahap") {
				setTahap1Nominal("");
				setTahap2Nominal(currentTotal > 0 ? currentTotal.toString() : "");
			} else {
				const t1 = Number(currentScheme?.t1Nominal) || 0;
				const t2 = Number(currentScheme?.t2Nominal) || 0;
				setTahap1Nominal(t1 > 0 ? t1.toString() : "");
				setTahap2Nominal(t2 > 0 ? t2.toString() : "");
			}
		}
	}, [open, currentScheme]);

	// Alokasi otomatis saat beralih skema
	const handleSelectTipe = (nextTipe: "1_tahap" | "2_tahap") => {
		setTipe(nextTipe);
		const total = Number(totalPengajuan) || 0;
		if (nextTipe === "1_tahap") {
			setTahap1Nominal("");
			setTahap2Nominal(total > 0 ? total.toString() : "");
		} else {
			if ((!tahap1Nominal || Number(tahap1Nominal) === 0) && total > 0) {
				const half = Math.floor(total / 2);
				setTahap1Nominal(half.toString());
				setTahap2Nominal((total - half).toString());
			}
		}
	};

	const numTotal = Number(totalPengajuan) || 0;
	const numT1 = Number(tahap1Nominal) || 0;
	const numT2 = Number(tahap2Nominal) || 0;
	const sumTahap = numT1 + numT2;
	const selisih = numTotal - sumTahap;
	const isExceedingTotal = Boolean(
		currentScheme?.totalBiayaPendidikan &&
			currentScheme.totalBiayaPendidikan > 0 &&
			numTotal > currentScheme.totalBiayaPendidikan,
	);

	const handleTotalChange = (val: string) => {
		const filtered = filterNumeric(val, 10);
		setTotalPengajuan(filtered);
		const newTotal = Number(filtered) || 0;
		if (tipe === "1_tahap") {
			setTahap1Nominal("");
			setTahap2Nominal(newTotal > 0 ? newTotal.toString() : "");
		}
	};

	const handleBagiRata = () => {
		if (numTotal <= 0) return;
		const half = Math.floor(numTotal / 2);
		setTahap1Nominal(half.toString());
		setTahap2Nominal((numTotal - half).toString());
	};

	const handleIsiSisaKeT2 = () => {
		const sisa = Math.max(0, numTotal - numT1);
		setTahap2Nominal(sisa > 0 ? sisa.toString() : "");
	};

	const handleSave = async () => {
		if (isExceedingTotal && currentScheme?.totalBiayaPendidikan) {
			toast.error(
				`Total pengajuan dana talangan (${formatRupiah(numTotal)}) tidak boleh melebihi Total Biaya Pendidikan (${formatRupiah(currentScheme.totalBiayaPendidikan)}). Kelebihan: ${formatRupiah(numTotal - currentScheme.totalBiayaPendidikan)}.`,
				{ duration: 5000 },
			);
			return;
		}

		if (tipe === "2_tahap" && numTotal > 0 && selisih !== 0) {
			toast.error(
				`Pembagian per tahap belum sesuai total pengajuan. Selisih: ${formatRupiah(Math.abs(selisih))}. Pastikan Tahap 1 + Tahap 2 = Total Pengajuan.`,
			);
			return;
		}

		setIsSaving(true);
		try {
			const token = getToken();
			const payload: Record<string, any> = {
				talanganTipe: tipe,
				talanganTotalPengajuan: numTotal,
				talanganLembaga: lembaga.trim() || null,
				talanganNotes: notes.trim() || null,
			};

			if (tipe === "1_tahap") {
				payload.t1SemesterNominalTotal = 0;
				payload.t1InterviewNominal = 0;
				payload.t2KeberangkatanNominal = numTotal;
			} else {
				payload.t1InterviewNominal = numT1;
				payload.t2KeberangkatanNominal = numT2;
			}

			const res = await fetch(`${API_URL}/students/${studentId}/finance`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message || "Gagal menyimpan skema dana talangan");
			}

			toast.success("Skema dan pembagian dana talangan berhasil disimpan!");
			onOpenChange(false);
			onSuccess();
		} catch (e: any) {
			toast.error(e.message || "Terjadi kesalahan saat menyimpan skema");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
				<DialogHeader className="pb-3 border-b border-slate-100">
					<DialogTitle className="text-slate-900 text-lg sm:text-xl font-bold">
						Atur Skema & Pembagian Dana Talangan
					</DialogTitle>
					<DialogDescription className="sr-only">
						Atur skema termin dan pembagian dana talangan
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5 py-3">
					{/* 1. Pilihan Skema Termin (1 Tahap vs 2 Tahap) */}
					<div className="space-y-2.5">
						<Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
							<Layers className="w-3.5 h-3.5 text-emerald-600" />
							Pilihan Termin Akad Dana Talangan{" "}
							<span className="text-rose-500">*</span>
						</Label>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
							{/* Card 1 Tahap */}
							<div
								onClick={() => handleSelectTipe("1_tahap")}
								className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
									tipe === "1_tahap"
										? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
										: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
								}`}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div
										className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
											tipe === "1_tahap"
												? "bg-emerald-100 text-emerald-800"
												: "bg-slate-100 text-slate-600"
										}`}
									>
										<Plane className="w-4.5 h-4.5 text-emerald-600" />
									</div>
									<div className="min-w-0">
										<div className="font-bold text-sm text-slate-900 leading-snug">
											1 Tahap (Keberangkatan)
										</div>
									</div>
								</div>
								{tipe === "1_tahap" ? (
									<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
								) : (
									<div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
								)}
							</div>

							{/* Card 2 Tahap */}
							<div
								onClick={() => handleSelectTipe("2_tahap")}
								className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
									tipe === "2_tahap"
										? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
										: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
								}`}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div
										className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
											tipe === "2_tahap"
												? "bg-amber-100 text-amber-800"
												: "bg-slate-100 text-slate-600"
										}`}
									>
										<Coins className="w-4.5 h-4.5 text-amber-600" />
									</div>
									<div className="min-w-0">
										<div className="font-bold text-sm text-slate-900 leading-snug">
											2 Tahap (Bertahap)
										</div>
									</div>
								</div>
								{tipe === "2_tahap" ? (
									<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
								) : (
									<div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
								)}
							</div>
						</div>
					</div>

					{/* 2. Total Pengajuan Dana Talangan */}
					<div className="p-4 sm:p-5 bg-slate-50/80 border border-slate-200/90 rounded-xl space-y-4">
						<div>
							<Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
								Total Pengajuan Dana Talangan (Rp){" "}
								<span className="text-rose-500">*</span>
							</Label>
							<div className="relative">
								<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
									Rp
								</span>
								<Input
									type="text"
									inputMode="numeric"
									maxLength={10}
									onKeyDown={preventNonNumericKey}
									value={totalPengajuan}
									onChange={(e) => handleTotalChange(e.target.value)}
									placeholder="0"
									className="pl-9 h-10 text-sm font-bold font-mono bg-white"
								/>
							</div>
							<div className="flex items-center justify-between text-xs mt-1.5 px-1">
								{numTotal > 0 ? (
									<span className="text-slate-500">
										Terbilang:{" "}
										<strong className="text-emerald-800 font-mono">
											{formatRupiah(numTotal)}
										</strong>
									</span>
								) : (
									<span className="text-[11px] text-slate-400 italic">
										Masukkan total nominal pengajuan
									</span>
								)}
								{currentScheme?.totalBiayaPendidikan &&
								currentScheme.totalBiayaPendidikan > 0 ? (
									<button
										type="button"
										onClick={() =>
											handleTotalChange(
												currentScheme.totalBiayaPendidikan!.toString(),
											)
										}
										className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
									>
										Set dari Total Biaya (
										{formatRupiah(currentScheme.totalBiayaPendidikan)})
									</button>
								) : null}
							</div>
							{isExceedingTotal && (
								<div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 mt-2">
									<AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
									<div>
										<span className="font-bold block">
											Peringatan: Pengajuan Melebihi Total Biaya!
										</span>
										<span>
											Total pengajuan ({formatRupiah(numTotal)}) melebihi Total
											Biaya Pendidikan dari PMB (
											{formatRupiah(currentScheme?.totalBiayaPendidikan || 0)})
											sebesar{" "}
											<strong>
												{formatRupiah(
													numTotal - (currentScheme?.totalBiayaPendidikan || 0),
												)}
											</strong>
											.
										</span>
									</div>
								</div>
							)}
						</div>

						{/* Lembaga & Catatan */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/70">
							<div>
								<Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
									<Building className="w-3.5 h-3.5 text-slate-400" />
									Lembaga Pembiayaan / Mitra
								</Label>
								<Input
									type="text"
									value={lembaga}
									onChange={(e) => setLembaga(e.target.value)}
									placeholder="Contoh: Bank BTN / Hong Ta"
									className="h-9 text-xs bg-white"
								/>
							</div>
							<div>
								<Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
									<FileText className="w-3.5 h-3.5 text-slate-400" />
									Nomor / Catatan Akad
								</Label>
								<Input
									type="text"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder="Contoh: No. Akad TLG-2026-081"
									className="h-9 text-xs bg-white"
								/>
							</div>
						</div>
					</div>

					{/* 3. Pembagian Nominal Per Termin */}
					{tipe === "2_tahap" ? (
						<div className="p-4 sm:p-5 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-amber-200/60 pb-2.5">
								<h5 className="font-bold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
									<Coins className="w-4 h-4 text-amber-600" />
									Pembagian 2 Tahap
								</h5>
								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleBagiRata}
										disabled={numTotal <= 0}
										className="h-7 text-[11px] px-2.5 bg-white border-amber-300 text-amber-900 hover:bg-amber-100/70 cursor-pointer shadow-2xs"
									>
										Bagi 50 : 50
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleIsiSisaKeT2}
										disabled={numTotal <= 0}
										className="h-7 text-[11px] px-2.5 bg-white border-amber-300 text-amber-900 hover:bg-amber-100/70 cursor-pointer shadow-2xs"
									>
										Sisa ke Tahap 2
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Tahap 1 Input */}
								<div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-bold text-amber-800">
											Tahap 1 (SPP & Kontrak/Suhan)
										</Label>
										<span className="text-[10px] text-slate-400 font-mono">
											{numTotal > 0
												? `${Math.round((numT1 / numTotal) * 100)}%`
												: "0%"}
										</span>
									</div>
									<div className="relative">
										<span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
											Rp
										</span>
										<Input
											type="text"
											inputMode="numeric"
											maxLength={10}
											onKeyDown={preventNonNumericKey}
											value={tahap1Nominal}
											onChange={(e) =>
												setTahap1Nominal(filterNumeric(e.target.value, 10))
											}
											placeholder="0"
											className="pl-8 h-8 text-xs font-mono font-bold"
										/>
									</div>
								</div>

								{/* Tahap 2 Input */}
								<div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
									<div className="flex items-center justify-between">
										<Label className="text-xs font-bold text-emerald-800">
											Tahap 2 (Visa & Keberangkatan)
										</Label>
										<span className="text-[10px] text-slate-400 font-mono">
											{numTotal > 0
												? `${Math.round((numT2 / numTotal) * 100)}%`
												: "0%"}
										</span>
									</div>
									<div className="relative">
										<span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
											Rp
										</span>
										<Input
											type="text"
											inputMode="numeric"
											maxLength={10}
											onKeyDown={preventNonNumericKey}
											value={tahap2Nominal}
											onChange={(e) =>
												setTahap2Nominal(filterNumeric(e.target.value, 10))
											}
											placeholder="0"
											className="pl-8 h-8 text-xs font-mono font-bold"
										/>
									</div>
								</div>
							</div>

							{/* Calculation validation banner */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white border border-amber-200 text-xs gap-2">
								<div className="flex items-center gap-2">
									{selisih === 0 ? (
										<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
									) : (
										<AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
									)}
									<span className="text-slate-700">
										Total Alokasi Tahap 1 + Tahap 2:{" "}
										<strong className="font-mono text-slate-900">
											{formatRupiah(sumTahap)}
										</strong>
									</span>
								</div>
								{selisih === 0 ? (
									<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold shrink-0 self-start sm:self-auto">
										Alokasi Pas (100%)
									</Badge>
								) : selisih > 0 ? (
									<Badge className="bg-amber-100 text-amber-800 border-0 text-[10px] font-bold shrink-0 self-start sm:self-auto">
										Kurang: {formatRupiah(selisih)}
									</Badge>
								) : (
									<Badge className="bg-rose-100 text-rose-800 border-0 text-[10px] font-bold shrink-0 self-start sm:self-auto">
										Lebih: {formatRupiah(Math.abs(selisih))}
									</Badge>
								)}
							</div>
						</div>
					) : (
						<div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-3">
							<div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wider">
								<Info className="w-4 h-4 text-emerald-600 shrink-0" />
								<span>Skema 1 Tahap (Pencairan di Keberangkatan)</span>
							</div>

							<div className="grid grid-cols-2 gap-3 text-xs">
								<div className="p-2.5 rounded-lg bg-white/90 border border-emerald-100">
									<span className="text-[10px] text-slate-500 uppercase block font-semibold">
										Tahap 1 (Interview & SPP)
									</span>
									<span className="font-bold text-slate-400 font-mono">
										Rp 0
									</span>
								</div>
								<div className="p-2.5 rounded-lg bg-white/90 border border-emerald-100">
									<span className="text-[10px] text-emerald-700 uppercase block font-semibold">
										Tahap 2 (Keberangkatan)
									</span>
									<span className="font-bold text-emerald-800 font-mono">
										{formatRupiah(numTotal)}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
						className="text-xs h-9 px-4 cursor-pointer"
					>
						Batal
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={handleSave}
						disabled={
							isSaving ||
							isExceedingTotal ||
							(tipe === "2_tahap" && numTotal > 0 && selisih !== 0)
						}
						className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSaving ? (
							<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
						) : (
							<Save className="w-3.5 h-3.5 mr-1.5" />
						)}
						{isExceedingTotal
							? "Pengajuan Melebihi Total Biaya"
							: tipe === "2_tahap" && numTotal > 0 && selisih !== 0
								? "Pembagian Belum Sesuai"
								: "Simpan Skema Talangan"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
