"use client";

import {
	ArrowLeft,
	ChevronRight,
	Download,
	Loader2,
	RotateCcw,
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
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
}

interface Student {
	id: number;
	name: string;
	nim: string | null;
	program: string;
	subProgram: string | null;
	cohort: number;
	phone: string | null;
}

interface Props {
	paId: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PADetailView({ paId }: Props) {
	const router = useRouter();
	const [pa, setPa] = useState<PAUser | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [cohortFilter, setCohortFilter] = useState("all");

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`${API_URL}/akademik/pa/users/${paId}/students`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			setPa(json.data?.pa ?? null);
			setStudents(json.data?.students ?? []);
		} catch {
			toast.error("Gagal memuat data mahasiswa bimbingan");
		} finally {
			setIsLoading(false);
		}
	}, [paId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchData();
	}, [fetchData]);

	const cohorts = Array.from(
		{ length: new Date().getFullYear() - 2022 + 2 },
		(_, i) => new Date().getFullYear() + 1 - i,
	);

	const filtered = students.filter((s) => {
		if (cohortFilter !== "all" && s.cohort !== Number(cohortFilter))
			return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			return (
				s.name.toLowerCase().includes(q) ||
				(s.nim?.toLowerCase().includes(q) ?? false)
			);
		}
		return true;
	});

	const handleExport = async () => {
		if (filtered.length === 0) return;
		const XLSX = await import("xlsx");
		const data = filtered.map((s) => ({
			Nama: s.name,
			NIM: s.nim ?? "-",
			Peminatan: s.subProgram ?? s.program,
			Angkatan: s.cohort,
			"No WhatsApp": s.phone ?? "-",
		}));
		const ws = XLSX.utils.json_to_sheet(data);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Mahasiswa Bimbingan");
		XLSX.writeFile(
			wb,
			`Bimbingan_${pa?.fullName ?? "PA"}_${new Date().toISOString().split("T")[0]}.xlsx`,
		);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push("/dashboard/akademik/pa")}
						className="border-slate-200 text-slate-600 hover:bg-slate-50"
					>
						<ArrowLeft className="w-4 h-4 mr-1.5" />
						Kembali
					</Button>
					<div>
						<h1 className="text-xl font-bold text-slate-900">
							{pa?.fullName ?? "Detail PA"}
						</h1>
						<p className="text-sm text-slate-500 mt-0.5">
							Daftar Mahasiswa Bimbingan
						</p>
					</div>
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
			<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
				<CardContent className="p-5 flex items-center gap-4">
					<div className="w-10 h-10 rounded-lg bg-[#0517B0]/10 flex items-center justify-center shrink-0">
						<Users className="w-5 h-5 text-[#0517B0]" />
					</div>
					<div>
						<p className="text-xs text-slate-500 font-medium">
							Total Mahasiswa Bimbingan
						</p>
						<p className="text-2xl font-bold text-slate-900">
							{students.length}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Table */}
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="pb-3 border-b border-slate-100">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
						<CardTitle className="text-sm font-semibold text-slate-700">
							Mahasiswa ({filtered.length})
						</CardTitle>
						<div className="flex flex-wrap items-center gap-2 sm:ml-auto">
							<Select
								value={cohortFilter}
								onValueChange={(v) => setCohortFilter(v ?? "all")}
							>
								<SelectTrigger className="h-9 w-40 text-xs">
									<SelectValue placeholder="Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{cohorts.map((c) => (
										<SelectItem key={c} value={String(c)}>
											Angkatan {c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
								<Input
									placeholder="Cari mahasiswa..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9 h-9 w-52 text-sm"
								/>
							</div>
							{(searchQuery.trim() !== "" || cohortFilter !== "all") && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setSearchQuery("");
										setCohortFilter("all");
									}}
									className="h-9 px-3 text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 font-medium transition-colors"
								>
									<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
									Reset
								</Button>
							)}
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
							<Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
							<p className="text-sm">Tidak ada mahasiswa ditemukan</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50/60">
									<TableHead className="text-xs font-semibold text-slate-600">
										Nama
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600">
										Peminatan
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600 text-center">
										Angkatan
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600">
										No WhatsApp
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-600 text-center">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtered.map((s) => (
									<TableRow
										key={s.id}
										className="hover:bg-slate-50/60 transition-colors"
									>
										<TableCell>
											<div className="font-medium text-slate-800">{s.name}</div>
											<div className="text-xs text-slate-400">
												{s.nim ?? "-"}
											</div>
										</TableCell>
										<TableCell className="text-sm">
											<PeminatanBadge
												subProgram={s.subProgram}
												program={s.program}
											/>
										</TableCell>
										<TableCell className="text-center">
											<Badge className="bg-slate-100 text-slate-600 border-slate-200 border text-xs">
												{s.cohort}
											</Badge>
										</TableCell>
										<TableCell>
											{s.phone ? (
												<a
													href={`https://wa.me/${s.phone.replace(/\D/g, "")}`}
													target="_blank"
													rel="noreferrer"
													className="text-sm text-[#0517B0] hover:underline"
												>
													{s.phone}
												</a>
											) : (
												<span className="text-xs text-slate-400">-</span>
											)}
										</TableCell>
										<TableCell className="text-center">
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													router.push(
														`/dashboard/akademik/pa/${paId}/mahasiswa/${s.id}?name=${encodeURIComponent(s.name)}&nim=${s.nim ?? ""}&program=${encodeURIComponent(s.subProgram ?? s.program)}&cohort=${s.cohort}`,
													)
												}
												className="h-8 text-xs gap-1.5 border-[#0517B0]/20 text-[#0517B0] hover:bg-[#0517B0]/5"
											>
												Detail
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
