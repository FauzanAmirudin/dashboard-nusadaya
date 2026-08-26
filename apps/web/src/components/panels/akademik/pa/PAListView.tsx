"use client";

import {
	ChevronRight,
	Download,
	GraduationCap,
	Loader2,
	Search,
	Sparkles,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_URL, getToken } from "@/lib/eden";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PAUser {
	id: number;
	fullName: string;
	username: string;
	studentCount: number;
}

function getInitials(name: string): string {
	if (!name) return "PA";
	const parts = name
		.replace(/^(Drs\.|Dr\.|Prof\.|Ir\.|H\.|Hj\.)\s+/i, "")
		.split(" ")
		.filter(Boolean);
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PAListView() {
	const router = useRouter();
	const [pas, setPas] = useState<PAUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isExporting, setIsExporting] = useState(false);

	const fetchPAs = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`${API_URL}/akademik/pa/users`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			setPas(json.data ?? []);
		} catch {
			toast.error("Gagal memuat daftar PA");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPAs();
	}, [fetchPAs]);

	const filtered = useMemo(() => {
		if (!searchQuery.trim()) return pas;
		const q = searchQuery.toLowerCase().trim();
		return pas.filter(
			(p) =>
				p.fullName.toLowerCase().includes(q) ||
				p.username.toLowerCase().includes(q),
		);
	}, [pas, searchQuery]);

	const handleExport = async () => {
		if (filtered.length === 0) return;
		setIsExporting(true);
		try {
			const XLSX = await import("xlsx");
			const data = filtered.map((p, idx) => ({
				No: idx + 1,
				"Nama PA": p.fullName,
				Username: p.username,
				"Jumlah Mahasiswa Bimbingan": p.studentCount,
			}));
			const ws = XLSX.utils.json_to_sheet(data);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Daftar PA");
			XLSX.writeFile(
				wb,
				`Daftar_PA_${new Date().toISOString().split("T")[0]}.xlsx`,
			);
			toast.success("Data berhasil diexport ke Excel");
		} catch {
			toast.error("Gagal mengexport data Excel");
		} finally {
			setIsExporting(false);
		}
	};

	const totalMahasiswa = pas.reduce((acc, p) => acc + p.studentCount, 0);

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<div className="w-2 h-5 rounded-full bg-[#0517B0]" />
						<h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
							Manajemen Pembimbing Akademik
						</h1>
					</div>
					<p className="text-xs sm:text-sm text-slate-500 pl-4">
						Daftar Dosen Pembimbing Akademik & Distribusi Mahasiswa Bimbingan
					</p>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={handleExport}
					disabled={filtered.length === 0 || isExporting}
					className="h-8 text-xs gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs self-end sm:self-auto"
				>
					{isExporting ? (
						<Loader2 className="w-3.5 h-3.5 animate-spin" />
					) : (
						<Download className="w-3.5 h-3.5 text-slate-500" />
					)}
					<span>Export Excel</span>
				</Button>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl">
					<CardContent className="p-4 sm:p-5 flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
							<GraduationCap className="w-6 h-6 text-[#0517B0]" />
						</div>
						<div>
							<p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
								Total Dosen PA
							</p>
							<p className="text-2xl font-bold text-slate-900 mt-0.5">
								{pas.length}{" "}
								<span className="text-xs font-normal text-slate-500">
									Dosen
								</span>
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl">
					<CardContent className="p-4 sm:p-5 flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
							<Users className="w-6 h-6 text-emerald-600" />
						</div>
						<div>
							<p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
								Total Mahasiswa Terdistribusi
							</p>
							<p className="text-2xl font-bold text-slate-900 mt-0.5">
								{totalMahasiswa}{" "}
								<span className="text-xs font-normal text-slate-500">
									Mahasiswa
								</span>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Table Card */}
			<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
				<div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
					<div className="flex items-center gap-2">
						<h2 className="text-sm sm:text-base font-bold text-slate-800">
							Daftar Dosen PA
						</h2>
						<Badge
							variant="secondary"
							className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full"
						>
							{filtered.length} Dosen
						</Badge>
					</div>

					<div className="relative w-full sm:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
						<Input
							placeholder="Cari nama atau username..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8.5 pr-8 h-9 text-xs bg-slate-50/70 border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#0517B0]/20 transition-all"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>
				</div>

				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
							<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
							<span className="text-xs font-medium text-slate-500">
								Memuat data Dosen PA...
							</span>
						</div>
					) : filtered.length === 0 ? (
						<div className="text-center py-16 px-4">
							<GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-300" />
							<p className="text-sm font-semibold text-slate-700">
								Tidak ada Dosen PA ditemukan
							</p>
							<p className="text-xs text-slate-400 mt-1">
								{searchQuery
									? "Coba ubah kata kunci pencarian."
									: "Belum ada akun Dosen PA yang terdaftar."}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-slate-50/75 border-b border-slate-200/80">
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 pl-6 min-w-[220px]">
											Dosen Pembimbing
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 min-w-[140px]">
											Username / Akun
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 text-center min-w-[160px]">
											Mahasiswa Bimbingan
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 text-right pr-6 min-w-[130px]">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.map((pa) => {
										const initials = getInitials(pa.fullName);
										return (
											<TableRow
												key={pa.id}
												onClick={() =>
													router.push(`/dashboard/akademik/pa/${pa.id}`)
												}
												className="hover:bg-blue-50/30 transition-colors cursor-pointer group border-b border-slate-100"
											>
												<TableCell className="py-3.5 pl-6">
													<div className="flex items-center gap-3">
														<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
															{initials}
														</div>
														<div>
															<div className="font-semibold text-slate-900 text-sm group-hover:text-[#0517B0] transition-colors leading-tight">
																{pa.fullName}
															</div>
															<div className="text-xs text-slate-400 mt-0.5">
																Dosen PA
															</div>
														</div>
													</div>
												</TableCell>

												<TableCell className="py-3.5 text-slate-600 text-xs font-mono">
													@{pa.username}
												</TableCell>

												<TableCell className="py-3.5 text-center">
													<Badge
														variant="secondary"
														className="bg-blue-50 text-[#0517B0] border border-blue-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-lg"
													>
														{pa.studentCount} Mahasiswa
													</Badge>
												</TableCell>

												<TableCell className="py-3.5 text-right pr-6">
													<Button
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															router.push(`/dashboard/akademik/pa/${pa.id}`);
														}}
														className="h-8 px-3 text-xs gap-1 font-semibold text-[#0517B0] bg-blue-50/80 hover:bg-[#0517B0] hover:text-white border border-blue-200/80 rounded-lg transition-all shadow-2xs group-hover:bg-[#0517B0] group-hover:text-white"
													>
														<span>Lihat Bimbingan</span>
														<ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
