"use client";

import {
	ChevronRight,
	Download,
	GraduationCap,
	Loader2,
	Search,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// ── Component ─────────────────────────────────────────────────────────────────

export function PAListView() {
	const router = useRouter();
	const [pas, setPas] = useState<PAUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

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
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchPAs();
	}, [fetchPAs]);

	const filtered = pas.filter(
		(p) =>
			p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.username.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleExport = async () => {
		if (filtered.length === 0) return;
		const XLSX = await import("xlsx");
		const data = filtered.map((p) => ({
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
	};

	const totalMahasiswa = pas.reduce((acc, p) => acc + p.studentCount, 0);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-xl font-bold text-slate-900">Manajemen PA</h1>
					<p className="text-sm text-slate-500 mt-0.5">
						Daftar Dosen Pembimbing Akademik
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleExport}
					disabled={filtered.length === 0}
					className="gap-1.5 text-xs"
				>
					<Download className="w-3.5 h-3.5" />
					Export Excel
				</Button>
			</div>

			{/* KPI */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="w-10 h-10 rounded-lg bg-[#0517B0]/10 flex items-center justify-center shrink-0">
							<GraduationCap className="w-5 h-5 text-[#0517B0]" />
						</div>
						<div>
							<p className="text-xs text-slate-500 font-medium">Total PA</p>
							<p className="text-2xl font-bold text-slate-900">{pas.length}</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
							<Users className="w-5 h-5 text-emerald-600" />
						</div>
						<div>
							<p className="text-xs text-slate-500 font-medium">
								Total Mahasiswa Terdaftar
							</p>
							<p className="text-2xl font-bold text-slate-900">
								{totalMahasiswa}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Table */}
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="pb-3 border-b border-slate-100">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
						<CardTitle className="text-sm font-semibold text-slate-700">
							Daftar PA ({filtered.length})
						</CardTitle>
						<div className="relative sm:ml-auto">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari nama PA..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 w-64 text-sm"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center py-16 gap-2 text-slate-400">
							<Loader2 className="w-5 h-5 animate-spin" />
							<span className="text-sm">Memuat data...</span>
						</div>
					) : filtered.length === 0 ? (
						<div className="text-center py-16 text-slate-400">
							<GraduationCap className="w-10 h-10 mx-auto mb-3 text-slate-300" />
							<p className="text-sm">Tidak ada PA ditemukan</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50/60">
									<TableHead className="text-xs font-semibold text-slate-600">
										Nama PA
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600">
										Username
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600 text-center">
										Mahasiswa Bimbingan
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600 text-center">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((pa) => (
									<TableRow
										key={pa.id}
										className="hover:bg-slate-50/60 transition-colors"
									>
										<TableCell className="font-medium text-slate-800">
											{pa.fullName}
										</TableCell>
										<TableCell className="text-slate-500 text-sm">
											{pa.username}
										</TableCell>
										<TableCell className="text-center">
											<Badge className="bg-blue-50 text-[#0517B0] border-blue-200 border text-xs">
												{pa.studentCount} mahasiswa
											</Badge>
										</TableCell>
										<TableCell className="text-center">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													router.push(`/dashboard/akademik/pa/${pa.id}`)
												}
												className="h-8 text-xs gap-1.5 border-[#0517B0]/20 text-[#0517B0] hover:bg-[#0517B0]/5"
											>
												Lihat Detail
												<ChevronRight className="w-3.5 h-3.5" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
