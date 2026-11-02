"use client";

import {
	Building2,
	Calendar,
	Compass,
	Globe2,
	GraduationCap,
	Info,
	Loader2,
	Save,
	Sparkles,
	Target,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
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
import { API_URL, getToken } from "@/lib/eden";
import { formatRupiah } from "./FinanceStreamCards";

interface EditProjectionTargetModalProps {
	isOpen: boolean;
	onClose: () => void;
	streams: StreamItem[];
	selectedCohort: string;
	availableCohorts: number[];
	year: number;
	academicYear?: string;
}

const ACADEMIC_YEARS = [
	{ year: 2026, label: "2026/2027 (T.A. Aktif)" },
	{ year: 2025, label: "2025/2026" },
	{ year: 2024, label: "2024/2025" },
	{ year: 2027, label: "2027/2028 (Mendatang)" },
];

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
	const [selectedYear, setSelectedYear] = useState<number>(year || 2026);
	const [targetPmb, setTargetPmb] = useState<number>(0);
	const [targetTaiwan, setTargetTaiwan] = useState<number>(0);
	const [targetMalaysia, setTargetMalaysia] = useState<number>(0);
	const [targetIndonesia, setTargetIndonesia] = useState<number>(0);
	const [targetTimurTengah, setTargetTimurTengah] = useState<number>(0);
	const [isLoadingTargets, setIsLoadingTargets] = useState<boolean>(false);

	const sanitizedCohorts = useMemo(() => {
		const raw = availableCohorts || [18, 17, 16, 15, 14];
		const set = new Set<number>(raw.filter((c) => c > 0 && c < 100));
		[18, 17, 16, 15, 14].forEach((c) => set.add(c));
		return Array.from(set).sort((a, b) => b - a);
	}, [availableCohorts]);

	const updateMutation = useUpdateProjectionTargets();

	// Fetch target secara dinamis ketika modal buka, angkatan berubah, atau tahun ajaran berubah
	useEffect(() => {
		if (!isOpen) return;

		let isMounted = true;
		const fetchTargets = async () => {
			try {
				setIsLoadingTargets(true);
				const token = getToken();
				const res = await fetch(
					`${API_URL}/finance/projections?cohort=${activeCohort}&year=${selectedYear}&month=0`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					},
				);
				if (res.ok) {
					const json = await res.json();
					if (json.success && json.data?.streams && isMounted) {
						const pmb =
							json.data.streams.find((s: any) => s.category === "pmb")
								?.target || 0;
						const tw =
							json.data.streams.find((s: any) => s.category === "spp_taiwan")
								?.target || 0;
						const my =
							json.data.streams.find((s: any) => s.category === "spp_malaysia")
								?.target || 0;
						const idn =
							json.data.streams.find((s: any) => s.category === "spp_indonesia")
								?.target || 0;
						const me =
							json.data.streams.find(
								(s: any) => s.category === "spp_timur_tengah",
							)?.target || 0;

						setTargetPmb(pmb);
						setTargetTaiwan(tw);
						setTargetMalaysia(my);
						setTargetIndonesia(idn);
						setTargetTimurTengah(me);
						return;
					}
				}
			} catch {
				// Fallback to prop
			} finally {
				if (isMounted) setIsLoadingTargets(false);
			}

			if (isMounted) {
				const pmb = streams.find((s) => s.category === "pmb")?.target || 0;
				const tw =
					streams.find((s) => s.category === "spp_taiwan")?.target || 0;
				const my =
					streams.find((s) => s.category === "spp_malaysia")?.target || 0;
				const idn =
					streams.find((s) => s.category === "spp_indonesia")?.target || 0;
				const me =
					streams.find((s) => s.category === "spp_timur_tengah")?.target || 0;

				setTargetPmb(pmb);
				setTargetTaiwan(tw);
				setTargetMalaysia(my);
				setTargetIndonesia(idn);
				setTargetTimurTengah(me);
			}
		};

		fetchTargets();

		return () => {
			isMounted = false;
		};
	}, [isOpen, activeCohort, selectedYear]);

	const totalTarget =
		targetPmb +
		targetTaiwan +
		targetMalaysia +
		targetIndonesia +
		targetTimurTengah;

	const handleSave = async () => {
		const cohortNum = activeCohort === "all" ? 0 : Number(activeCohort) || 0;
		await updateMutation.mutateAsync({
			cohort: cohortNum,
			year: selectedYear,
			academicYear: `${selectedYear}/${selectedYear + 1}`,
			targets: [
				{ category: "pmb", targetNominal: targetPmb },
				{ category: "spp_taiwan", targetNominal: targetTaiwan },
				{ category: "spp_malaysia", targetNominal: targetMalaysia },
				{ category: "spp_indonesia", targetNominal: targetIndonesia },
				{ category: "spp_timur_tengah", targetNominal: targetTimurTengah },
			],
		});
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[580px] w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200">
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
					{/* Pilihan Kontrol: Angkatan & Tahun Ajaran */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
						{/* Pilihan Angkatan */}
						<div className="space-y-1">
							<label className="text-xs font-bold text-slate-800 block">
								Pilih Angkatan Target:
							</label>
							<Select
								value={activeCohort}
								onValueChange={(val) => {
									if (val) setActiveCohort(val);
								}}
							>
								<SelectTrigger className="w-full h-9 text-xs bg-white font-bold border-slate-300 rounded-lg shadow-2xs">
									<SelectValue placeholder="Pilih Angkatan">
										{activeCohort === "all"
											? "Semua Angkatan (Global)"
											: `Angkatan ${activeCohort}`}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan (Global)</SelectItem>
									{sanitizedCohorts.map((c) => (
										<SelectItem key={c} value={c.toString()}>
											Angkatan {c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Pilihan Tahun Ajaran */}
						<div className="space-y-1">
							<label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
								<Calendar className="w-3.5 h-3.5 text-[#0517B0]" />
								Tahun Ajaran (Target Utama):
							</label>
							<Select
								value={selectedYear.toString()}
								onValueChange={(val) => {
									if (val) setSelectedYear(Number(val));
								}}
							>
								<SelectTrigger className="w-full h-9 text-xs bg-white font-bold border-slate-300 rounded-lg shadow-2xs">
									<SelectValue placeholder="Pilih Tahun Ajaran">
										{`${selectedYear}/${selectedYear + 1}`}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{ACADEMIC_YEARS.map((ay) => (
										<SelectItem key={ay.year} value={ay.year.toString()}>
											{ay.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Banner Informative Pembagian Otomatis */}
					<div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-3 flex items-start gap-2.5">
						<Info className="w-4 h-4 text-[#0517B0] mt-0.5 shrink-0" />
						<div className="text-xs text-blue-950 space-y-0.5">
							<p className="font-bold">
								Target 1 Tahun Ajaran ({selectedYear}/{selectedYear + 1})
							</p>
							<p className="text-[11px] text-blue-900/80 leading-relaxed">
								Nilai yang Anda input di bawah ini adalah{" "}
								<strong>Target Total 1 Tahun Ajaran</strong>. Sistem secara
								otomatis membagi ke <strong>2 Semester</strong> (target ÷ 2) dan{" "}
								<strong>12 Bulan</strong> (target ÷ 12) per jurusan dan total
								agregat.
							</p>
						</div>
					</div>

					{isLoadingTargets && (
						<div className="flex items-center justify-center gap-2 py-1 text-xs text-blue-600 font-semibold animate-pulse">
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
							<span>Memuat pagu target tersimpan...</span>
						</div>
					)}

					{/* 1. Pos PMB */}
					<div className="space-y-2 p-3.5 bg-sky-50/50 rounded-xl border border-sky-200/80">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
								<GraduationCap className="w-4 h-4 text-sky-600" />
								1. Pendaftaran Mahasiswa Baru (PMB)
							</label>
							<span className="text-xs font-mono font-black text-sky-900">
								{formatRupiah(targetPmb)} / T.A.
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
						{/* Pembagian Otomatis */}
						<div className="grid grid-cols-2 gap-2 pt-1 border-t border-sky-200/60 mt-1">
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-sky-200/60 flex items-center justify-between">
								<span className="text-[10px] text-sky-800/80 font-medium">
									Per Semester (2x):
								</span>
								<span className="text-xs font-bold font-mono text-sky-950">
									{formatRupiah(Math.round(targetPmb / 2))}
								</span>
							</div>
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-sky-200/60 flex items-center justify-between">
								<span className="text-[10px] text-sky-800/80 font-medium">
									Per Bulan (12x):
								</span>
								<span className="text-xs font-bold font-mono text-sky-950">
									{formatRupiah(Math.round(targetPmb / 12))}
								</span>
							</div>
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
								{formatRupiah(targetTaiwan)} / T.A.
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
						{/* Pembagian Otomatis */}
						<div className="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-200/60 mt-1">
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-indigo-200/60 flex items-center justify-between">
								<span className="text-[10px] text-indigo-800/80 font-medium">
									Per Semester (2x):
								</span>
								<span className="text-xs font-bold font-mono text-indigo-950">
									{formatRupiah(Math.round(targetTaiwan / 2))}
								</span>
							</div>
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-indigo-200/60 flex items-center justify-between">
								<span className="text-[10px] text-indigo-800/80 font-medium">
									Per Bulan (12x):
								</span>
								<span className="text-xs font-bold font-mono text-indigo-950">
									{formatRupiah(Math.round(targetTaiwan / 12))}
								</span>
							</div>
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
								{formatRupiah(targetMalaysia)} / T.A.
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
						{/* Pembagian Otomatis */}
						<div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 mt-1">
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-emerald-200/60 flex items-center justify-between">
								<span className="text-[10px] text-emerald-800/80 font-medium">
									Per Semester (2x):
								</span>
								<span className="text-xs font-bold font-mono text-emerald-950">
									{formatRupiah(Math.round(targetMalaysia / 2))}
								</span>
							</div>
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-emerald-200/60 flex items-center justify-between">
								<span className="text-[10px] text-emerald-800/80 font-medium">
									Per Bulan (12x):
								</span>
								<span className="text-xs font-bold font-mono text-emerald-950">
									{formatRupiah(Math.round(targetMalaysia / 12))}
								</span>
							</div>
						</div>
					</div>

					{/* 4. Pos SPP D3 Indonesia */}
					<div className="space-y-2 p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/80">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
								<Compass className="w-4 h-4 text-rose-600" />
								4. SPP D3 Indonesia
							</label>
							<span className="text-xs font-mono font-black text-rose-900">
								{formatRupiah(targetIndonesia)} / T.A.
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
								value={targetIndonesia || ""}
								onChange={(e) =>
									setTargetIndonesia(Math.max(0, Number(e.target.value) || 0))
								}
								placeholder="0"
								className="pl-9 h-9 text-xs sm:text-sm font-bold bg-white border-slate-300 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
							<span className="text-[10px] text-rose-800/80 font-medium mr-1">
								Preset:
							</span>
							{[
								30_000_000, 60_000_000, 90_000_000, 120_000_000, 150_000_000,
							].map((preset) => {
								const isSelected = targetIndonesia === preset;
								return (
									<button
										key={preset}
										type="button"
										onClick={() => setTargetIndonesia(preset)}
										className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
											isSelected
												? "bg-rose-600 text-white border-rose-600 shadow-2xs"
												: "bg-white text-rose-700 border-rose-200 hover:bg-rose-100/60"
										}`}
									>
										{preset / 1_000_000} Jt
									</button>
								);
							})}
						</div>
						{/* Pembagian Otomatis */}
						<div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-200/60 mt-1">
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-rose-200/60 flex items-center justify-between">
								<span className="text-[10px] text-rose-800/80 font-medium">
									Per Semester (2x):
								</span>
								<span className="text-xs font-bold font-mono text-rose-950">
									{formatRupiah(Math.round(targetIndonesia / 2))}
								</span>
							</div>
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-rose-200/60 flex items-center justify-between">
								<span className="text-[10px] text-rose-800/80 font-medium">
									Per Bulan (12x):
								</span>
								<span className="text-xs font-bold font-mono text-rose-950">
									{formatRupiah(Math.round(targetIndonesia / 12))}
								</span>
							</div>
						</div>
					</div>

					{/* 5. Pos SPP Timur Tengah */}
					<div className="space-y-2 p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80">
						<div className="flex items-center justify-between">
							<label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
								<Sparkles className="w-4 h-4 text-amber-600" />
								5. SPP Timur Tengah
							</label>
							<span className="text-xs font-mono font-black text-amber-900">
								{formatRupiah(targetTimurTengah)} / T.A.
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
								value={targetTimurTengah || ""}
								onChange={(e) =>
									setTargetTimurTengah(Math.max(0, Number(e.target.value) || 0))
								}
								placeholder="0"
								className="pl-9 h-9 text-xs sm:text-sm font-bold bg-white border-slate-300 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-1.5 pt-0.5">
							<span className="text-[10px] text-amber-800/80 font-medium mr-1">
								Preset:
							</span>
							{[
								20_000_000, 40_000_000, 60_000_000, 80_000_000, 100_000_000,
							].map((preset) => {
								const isSelected = targetTimurTengah === preset;
								return (
									<button
										key={preset}
										type="button"
										onClick={() => setTargetTimurTengah(preset)}
										className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
											isSelected
												? "bg-amber-600 text-white border-amber-600 shadow-2xs"
												: "bg-white text-amber-700 border-amber-200 hover:bg-amber-100/60"
										}`}
									>
										{preset / 1_000_000} Jt
									</button>
								);
							})}
						</div>
						{/* Pembagian Otomatis */}
						<div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 mt-1">
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-amber-200/60 flex items-center justify-between">
								<span className="text-[10px] text-amber-800/80 font-medium">
									Per Semester (2x):
								</span>
								<span className="text-xs font-bold font-mono text-amber-950">
									{formatRupiah(Math.round(targetTimurTengah / 2))}
								</span>
							</div>
							<div className="bg-white/80 rounded-lg px-2.5 py-1 border border-amber-200/60 flex items-center justify-between">
								<span className="text-[10px] text-amber-800/80 font-medium">
									Per Bulan (12x):
								</span>
								<span className="text-xs font-bold font-mono text-amber-950">
									{formatRupiah(Math.round(targetTimurTengah / 12))}
								</span>
							</div>
						</div>
					</div>

					{/* Akumulasi Total Target Eksekutif */}
					<div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs space-y-2.5">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
									Total Target 1 Tahun Ajaran:
								</span>
								<span className="text-[11px] text-slate-400">
									{activeCohort === "all"
										? "Semua Angkatan"
										: `Angkatan ${activeCohort}`}{" "}
									• T.A. {selectedYear}/{selectedYear + 1}
								</span>
							</div>
							<span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
								{formatRupiah(totalTarget)}
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
							<div className="bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700/60 flex items-center justify-between">
								<span className="text-[10px] text-slate-400">
									Total / Semester:
								</span>
								<span className="text-xs font-bold font-mono text-slate-200">
									{formatRupiah(Math.round(totalTarget / 2))}
								</span>
							</div>
							<div className="bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-700/60 flex items-center justify-between">
								<span className="text-[10px] text-slate-400">
									Total / Bulan:
								</span>
								<span className="text-xs font-bold font-mono text-emerald-300">
									{formatRupiah(Math.round(totalTarget / 12))}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* ─── 3. FIXED FOOTER ─── */}
				<DialogFooter className="m-0 mb-0 mx-0 px-6 py-4 bg-slate-50/95 border-t border-slate-200/80 shrink-0 flex flex-row items-center justify-end gap-3 sm:gap-4">
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
