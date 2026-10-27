"use client";

import {
	Building2,
	Globe2,
	GraduationCap,
	Loader2,
	Save,
	Target,
	X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type StreamItem,
	useUpdateProjectionTargets,
} from "@/hooks/useFinanceProjections";
import { formatRupiah } from "./FinanceStreamCards";

interface EditProjectionTargetModalProps {
	isOpen: boolean;
	onClose: () => void;
	streams: StreamItem[];
	selectedCohort: string;
	availableCohorts: number[];
	year: number;
}

export function EditProjectionTargetModal({
	isOpen,
	onClose,
	streams,
	selectedCohort,
	availableCohorts,
	year,
}: EditProjectionTargetModalProps) {
	const [activeCohort, setActiveCohort] = useState<string>(
		selectedCohort === "all" ? "16" : selectedCohort,
	);
	const [targetPmb, setTargetPmb] = useState<number>(0);
	const [targetTaiwan, setTargetTaiwan] = useState<number>(0);
	const [targetMalaysia, setTargetMalaysia] = useState<number>(0);

	const updateMutation = useUpdateProjectionTargets();

	// Initialize inputs when modal opens or streams change
	useEffect(() => {
		if (isOpen) {
			const pmb = streams.find((s) => s.category === "pmb")?.target || 0;
			const tw = streams.find((s) => s.category === "spp_taiwan")?.target || 0;
			const my =
				streams.find((s) => s.category === "spp_malaysia")?.target || 0;

			setTargetPmb(pmb);
			setTargetTaiwan(tw);
			setTargetMalaysia(my);
			setActiveCohort(selectedCohort === "all" ? "16" : selectedCohort);
		}
	}, [isOpen, streams, selectedCohort]);

	const totalTarget = targetPmb + targetTaiwan + targetMalaysia;

	const handleSave = async () => {
		const cohortNum = activeCohort === "all" ? 0 : Number(activeCohort) || 0;
		await updateMutation.mutateAsync({
			cohort: cohortNum,
			year,
			targets: [
				{ category: "pmb", targetNominal: targetPmb },
				{ category: "spp_taiwan", targetNominal: targetTaiwan },
				{ category: "spp_malaysia", targetNominal: targetMalaysia },
			],
		});
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[560px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
				{/* ─── 1. FIXED HEADER ─── */}
				<DialogHeader className="p-5 pb-3.5 border-b border-slate-100 bg-white shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="p-2 bg-blue-50 text-[#0517B0] rounded-xl border border-blue-200/60 shadow-xs shrink-0">
							<Target className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
								Pagu Target Proyeksi Pendapatan (FIN-01)
							</DialogTitle>
							<DialogDescription className="text-xs text-slate-500 mt-0.5">
								Tentukan pagu target pendapatan per pos resmi untuk monitoring
								eksekutif.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* ─── 2. SCROLLABLE BODY ─── */}
				<div className="flex-1 overflow-y-auto p-5 space-y-3.5">
					{/* Pilihan Angkatan */}
					<div className="flex items-center justify-between bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
						<div>
							<label className="text-xs font-bold text-slate-800 block">
								Pilih Angkatan Target:
							</label>
							<span className="text-[11px] text-slate-500">
								Pagu akan tersimpan permanen di database untuk angkatan ini.
							</span>
						</div>
						<Select
							value={activeCohort}
							onValueChange={(val) => {
								if (val) setActiveCohort(val);
							}}
						>
							<SelectTrigger className="w-[160px] h-9 text-xs bg-white font-bold border-slate-300 rounded-lg shadow-2xs">
								<SelectValue placeholder="Pilih Angkatan" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Angkatan (Global)</SelectItem>
								{availableCohorts.map((c) => (
									<SelectItem key={c} value={c.toString()}>
										Angkatan {c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 1. Pos PMB */}
					<div className="space-y-2 p-3.5 bg-sky-50/50 rounded-xl border border-sky-200/80">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
								<GraduationCap className="w-4 h-4 text-sky-600" />
								1. Pendaftaran Mahasiswa Baru (PMB)
							</label>
							<span className="text-xs font-mono font-black text-sky-900">
								{formatRupiah(targetPmb)}
							</span>
						</div>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
								Rp
							</span>
							<Input
								type="number"
								min={0}
								step={1000000}
								value={targetPmb || ""}
								onChange={(e) =>
									setTargetPmb(Math.max(0, Number(e.target.value) || 0))
								}
								placeholder="0"
								className="pl-9 h-9 text-xs sm:text-sm font-bold bg-white border-slate-300 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
							<span className="text-[10px] text-sky-800/80 font-medium mr-1">
								Preset:
							</span>
							{[
								25_000_000, 50_000_000, 75_000_000, 100_000_000, 125_000_000,
							].map((preset) => {
								const isSelected = targetPmb === preset;
								return (
									<button
										key={preset}
										type="button"
										onClick={() => setTargetPmb(preset)}
										className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
											isSelected
												? "bg-sky-600 text-white border-sky-600 shadow-2xs"
												: "bg-white text-sky-700 border-sky-200 hover:bg-sky-100/60"
										}`}
									>
										{preset / 1_000_000} Jt
									</button>
								);
							})}
						</div>
					</div>

					{/* 2. Pos SPP Taiwan */}
					<div className="space-y-2 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/80">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
								<Building2 className="w-4 h-4 text-indigo-600" />
								2. SPP Persiapan Taiwan
							</label>
							<span className="text-xs font-mono font-black text-indigo-900">
								{formatRupiah(targetTaiwan)}
							</span>
						</div>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
								Rp
							</span>
							<Input
								type="number"
								min={0}
								step={1000000}
								value={targetTaiwan || ""}
								onChange={(e) =>
									setTargetTaiwan(Math.max(0, Number(e.target.value) || 0))
								}
								placeholder="0"
								className="pl-9 h-9 text-xs sm:text-sm font-bold bg-white border-slate-300 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
							<span className="text-[10px] text-indigo-800/80 font-medium mr-1">
								Preset:
							</span>
							{[
								50_000_000, 100_000_000, 150_000_000, 200_000_000, 250_000_000,
							].map((preset) => {
								const isSelected = targetTaiwan === preset;
								return (
									<button
										key={preset}
										type="button"
										onClick={() => setTargetTaiwan(preset)}
										className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
											isSelected
												? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
												: "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100/60"
										}`}
									>
										{preset / 1_000_000} Jt
									</button>
								);
							})}
						</div>
					</div>

					{/* 3. Pos SPP D3 Malaysia */}
					<div className="space-y-2 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
								<Globe2 className="w-4 h-4 text-emerald-600" />
								3. SPP D3 Malaysia
							</label>
							<span className="text-xs font-mono font-black text-emerald-900">
								{formatRupiah(targetMalaysia)}
							</span>
						</div>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
								Rp
							</span>
							<Input
								type="number"
								min={0}
								step={1000000}
								value={targetMalaysia || ""}
								onChange={(e) =>
									setTargetMalaysia(Math.max(0, Number(e.target.value) || 0))
								}
								placeholder="0"
								className="pl-9 h-9 text-xs sm:text-sm font-bold bg-white border-slate-300 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
							<span className="text-[10px] text-emerald-800/80 font-medium mr-1">
								Preset:
							</span>
							{[
								30_000_000, 60_000_000, 90_000_000, 120_000_000, 150_000_000,
							].map((preset) => {
								const isSelected = targetMalaysia === preset;
								return (
									<button
										key={preset}
										type="button"
										onClick={() => setTargetMalaysia(preset)}
										className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
											isSelected
												? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
												: "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100/60"
										}`}
									>
										{preset / 1_000_000} Jt
									</button>
								);
							})}
						</div>
					</div>

					{/* Akumulasi Total Target */}
					<div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-xl shadow-xs">
						<div>
							<span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
								Total Target Gabungan:
							</span>
							<span className="text-[11px] text-slate-400">
								{activeCohort === "all"
									? "Semua Angkatan"
									: `Angkatan ${activeCohort}`}{" "}
								({year})
							</span>
						</div>
						<span className="text-base sm:text-lg font-black font-mono text-emerald-400">
							{formatRupiah(totalTarget)}
						</span>
					</div>
				</div>

				{/* ─── 3. FIXED FOOTER ─── */}
				<DialogFooter className="m-0 mb-0 mx-0 px-6 py-5 bg-slate-50/95 border-t border-slate-200/80 shrink-0 flex flex-row items-center justify-end gap-4 sm:gap-5">
					<Button
						variant="outline"
						type="button"
						onClick={onClose}
						disabled={updateMutation.isPending}
						className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
					>
						Batal
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={updateMutation.isPending}
						className="h-10 px-6 bg-[#0517B0] hover:bg-blue-800 text-white text-xs sm:text-sm font-bold gap-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
					>
						{updateMutation.isPending ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Menyimpan...
							</>
						) : (
							<>
								<Save className="w-4 h-4" />
								Simpan Target ke Database
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
