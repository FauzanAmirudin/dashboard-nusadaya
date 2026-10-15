"use client";

import { Coins, Loader2, Save, ShieldAlert } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL, getToken } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { formatRupiah } from "@/utils/format";

interface ProgramFeeDefault {
	id: number;
	subProgram: string;
	defaultTotalBiaya: number;
	defaultRegistrasi: number;
	defaultPerSemester: number;
	defaultInterview: number;
	defaultKeberangkatan: number;
	updatedAt: string;
}

export default function ProgramFeesSettingsPage() {
	const { user, hasHydrated } = useAuthStore();
	const isSuperadmin = hasRole(user, "superadmin");

	const [defaults, setDefaults] = useState<ProgramFeeDefault[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [savingSubProgram, setSavingSubProgram] = useState<string | null>(null);

	const fetchDefaults = async () => {
		try {
			const res = await fetch(`${API_URL}/settings/program-fee-defaults`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success) setDefaults(json.data || []);
			}
		} catch (error) {
			console.error("Gagal memuat standar biaya program:", error);
			toast.error("Gagal memuat standar biaya program");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchDefaults();
	}, []);

	const handleValueChange = (
		subProgram: string,
		field: keyof ProgramFeeDefault,
		value: number,
	) => {
		setDefaults((prev) =>
			prev.map((item) =>
				item.subProgram === subProgram ? { ...item, [field]: value } : item,
			),
		);
	};

	const handleSave = async (item: ProgramFeeDefault) => {
		setSavingSubProgram(item.subProgram);
		try {
			const res = await fetch(
				`${API_URL}/settings/program-fee-defaults/${encodeURIComponent(item.subProgram)}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						defaultTotalBiaya: item.defaultTotalBiaya,
						defaultRegistrasi: item.defaultRegistrasi,
						defaultPerSemester: item.defaultPerSemester,
						defaultInterview: item.defaultInterview,
						defaultKeberangkatan: item.defaultKeberangkatan,
					}),
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success(
					`Standar biaya program ${item.subProgram} berhasil diperbarui`,
				);
				fetchDefaults();
			} else {
				toast.error(json.message || "Gagal memperbarui standar biaya");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem saat menyimpan");
		} finally {
			setSavingSubProgram(null);
		}
	};

	if (!hasHydrated || isLoading) {
		return (
			<div className="flex justify-center items-center h-screen pb-20">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
			</div>
		);
	}

	if (!isSuperadmin) {
		return (
			<div className="p-8 max-w-4xl mx-auto">
				<div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl flex items-center gap-4">
					<ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />
					<div>
						<h3 className="font-bold text-lg">Akses Ditolak</h3>
						<p className="text-sm">
							Halaman pengaturan standar biaya program hanya dapat diakses oleh
							Superadmin.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-20 max-w-6xl mx-auto px-4 sm:px-6 pt-6">
			{/* Header */}
			<div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-3 bg-blue-50 text-[#0517B0] rounded-xl border border-blue-100">
						<Coins className="w-6 h-6" />
					</div>
					<div>
						<h1 className="text-xl font-bold text-slate-900">
							Standar Biaya Peminatan Program (PMB ➔ Finance)
						</h1>
						<p className="text-xs text-slate-500 mt-0.5">
							Pagu tarif default yang otomatis diterapkan saat formulir
							pendaftar PMB disetujui.
						</p>
					</div>
				</div>
				<Badge className="bg-blue-50 text-[#0517B0] border border-blue-200 font-semibold px-3 py-1">
					Superadmin Only
				</Badge>
			</div>

			{/* Cards List per Program */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{defaults.map((item) => {
					const isSaving = savingSubProgram === item.subProgram;
					return (
						<Card
							key={item.subProgram}
							className="border-slate-200 shadow-sm overflow-hidden"
						>
							<CardHeader className="bg-slate-50/80 border-b border-slate-200 py-3.5 px-5 flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base font-bold text-slate-900">
										{item.subProgram}
									</CardTitle>
									<CardDescription className="text-xs text-slate-500 mt-0.5">
										Total Pagu Default:{" "}
										<strong className="text-[#0517B0]">
											{formatRupiah(item.defaultTotalBiaya)}
										</strong>
									</CardDescription>
								</div>
								<Button
									size="sm"
									disabled={isSaving}
									onClick={() => handleSave(item)}
									className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-8 gap-1.5 font-semibold"
								>
									{isSaving ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										<Save className="w-3.5 h-3.5" />
									)}
									Simpan
								</Button>
							</CardHeader>
							<CardContent className="p-5 space-y-4">
								<div className="space-y-1.5">
									<Label className="text-xs font-semibold text-slate-700">
										Total Biaya Keseluruhan (Rp)
									</Label>
									<Input
										type="number"
										min={0}
										value={item.defaultTotalBiaya || ""}
										onChange={(e) =>
											handleValueChange(
												item.subProgram,
												"defaultTotalBiaya",
												Math.max(0, Number(e.target.value) || 0),
											)
										}
										className="font-bold text-sm bg-slate-50/50"
										placeholder="0"
									/>
									<span className="text-[11px] text-slate-500 block">
										{formatRupiah(item.defaultTotalBiaya)}
									</span>
								</div>

								<div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-slate-700">
											Biaya Registrasi Awal (Rp)
										</Label>
										<Input
											type="number"
											min={0}
											value={item.defaultRegistrasi || ""}
											onChange={(e) =>
												handleValueChange(
													item.subProgram,
													"defaultRegistrasi",
													Math.max(0, Number(e.target.value) || 0),
												)
											}
											className="text-xs"
											placeholder="0"
										/>
									</div>

									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-slate-700">
											Biaya Per Semester (Rp)
										</Label>
										<Input
											type="number"
											min={0}
											value={item.defaultPerSemester || ""}
											onChange={(e) =>
												handleValueChange(
													item.subProgram,
													"defaultPerSemester",
													Math.max(0, Number(e.target.value) || 0),
												)
											}
											className="text-xs"
											placeholder="0"
										/>
									</div>

									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-slate-700">
											Biaya Interview (Rp)
										</Label>
										<Input
											type="number"
											min={0}
											value={item.defaultInterview || ""}
											onChange={(e) =>
												handleValueChange(
													item.subProgram,
													"defaultInterview",
													Math.max(0, Number(e.target.value) || 0),
												)
											}
											className="text-xs"
											placeholder="0"
										/>
									</div>

									<div className="space-y-1.5">
										<Label className="text-xs font-semibold text-slate-700">
											Biaya Keberangkatan (Rp)
										</Label>
										<Input
											type="number"
											min={0}
											value={item.defaultKeberangkatan || ""}
											onChange={(e) =>
												handleValueChange(
													item.subProgram,
													"defaultKeberangkatan",
													Math.max(0, Number(e.target.value) || 0),
												)
											}
											className="text-xs"
											placeholder="0"
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
