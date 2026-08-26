"use client";

import {
	ArrowLeft,
	Building2,
	ChevronRight,
	Download,
	GraduationCap,
	Loader2,
	MessageCircle,
	Phone,
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

export function PADetailView({ paId }: Props) {
	const router = useRouter();
	const [pa, setPa] = useState<PAUser | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [cohortFilter, setCohortFilter] = useState("all");
	const [isExporting, setIsExporting] = useState(false);

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
		fetchData();
	}, [fetchData]);

	// Unique cohorts present in the student list
	const availableCohorts = useMemo(() => {
		const unique = Array.from(new Set(students.map((s) => s.cohort))).filter(
			Boolean,
		);
		return unique.sort((a, b) => b - a);
	}, [students]);

	// Filtered students
	const filtered = useMemo(() => {
		return students.filter((s) => {
			if (cohortFilter !== "all" && s.cohort !== Number(cohortFilter)) {
				return false;
			}
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matchName = s.name.toLowerCase().includes(q);
				const matchNim = s.nim?.toLowerCase().includes(q) ?? false;
				const matchProgram = (s.subProgram || s.program)
					.toLowerCase()
					.includes(q);
				return matchName || matchNim || matchProgram;
			}
			return true;
		});
	}, [students, cohortFilter, searchQuery]);

	// Excel Export
	const handleExport = async () => {
		if (filtered.length === 0) return;
		setIsExporting(true);
		try {
			const XLSX = await import("xlsx");
			const data = filtered.map((s, idx) => ({
				No: idx + 1,
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
				`Bimbingan_${(pa?.fullName ?? "PA").replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
			);
			toast.success("Data berhasil diexport ke Excel");
		} catch {
			toast.error("Gagal mengexport data Excel");
		} finally {
			setIsExporting(false);
		}
	};

	const paInitials = getInitials(pa?.fullName ?? "");

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-10">
			{/* Breadcrumb & Navigation Bar */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/dashboard/akademik/pa")}
						className="h-8 px-2.5 text-xs text-slate-600 hover:text-[#0517B0] hover:bg-blue-50/80 gap-1.5 transition-colors"
					>
						<ArrowLeft className="w-3.5 h-3.5" />
						<span>Kembali ke Manajemen PA</span>
					</Button>
					<span className="text-slate-300">/</span>
					<span className="text-xs font-semibold text-slate-500">
						Detail Pembimbing
					</span>
				</div>

				{/* Quick Export CTA */}
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

			{/* Executive Profile & Metric Card (Consolidated) */}
			<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
				<CardContent className="p-5 sm:p-6">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
						{/* Left: PA Identity */}
						<div className="flex items-start sm:items-center gap-4">
							<div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 shadow-sm ring-4 ring-blue-50">
								{paInitials}
							</div>
							<div className="space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
										{pa?.fullName ?? (isLoading ? "Memuat..." : "Detail PA")}
									</h1>
									<Badge
										variant="secondary"
										className="bg-blue-50 text-[#0517B0] border border-blue-200/60 font-semibold text-[11px] px-2.5 py-0.5"
									>
										Pembimbing Akademik
									</Badge>
								</div>
								<p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
									<span>Divisi Akademik</span>
									<span className="text-slate-300">•</span>
									<span>Monitoring & Konseling Mahasiswa</span>
								</p>
							</div>
						</div>

						{/* Right: Metric Chips Box */}
						<div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
							<div className="px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-3 min-w-[150px]">
								<div className="w-9 h-9 rounded-lg bg-blue-100/70 text-[#0517B0] flex items-center justify-center shrink-0">
									<Users className="w-4 h-4" />
								</div>
								<div>
									<p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
										Mahasiswa
									</p>
									<p className="text-lg font-bold text-slate-900 leading-tight">
										{students.length}{" "}
										<span className="text-xs font-normal text-slate-500">
											Orang
										</span>
									</p>
								</div>
							</div>

							<div className="px-4 py-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center gap-3 min-w-[150px]">
								<div className="w-9 h-9 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
									<GraduationCap className="w-4 h-4" />
								</div>
								<div>
									<p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
										Angkatan
									</p>
									<p className="text-lg font-bold text-slate-900 leading-tight">
										{availableCohorts.length > 0
											? availableCohorts.join(", ")
											: "-"}
									</p>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Content: Student Table & Filters */}
			<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
				{/* Table Header & Interactive Toolbar */}
				<div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white">
					{/* Title & Count Badge */}
					<div className="flex items-center gap-2.5">
						<div className="w-2 h-5 rounded-full bg-[#0517B0]" />
						<h2 className="text-sm sm:text-base font-bold text-slate-800">
							Daftar Mahasiswa Bimbingan
						</h2>
						<Badge
							variant="secondary"
							className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full"
						>
							{filtered.length} dari {students.length} Mahasiswa
						</Badge>
					</div>

					{/* Search & Filter Controls */}
					<div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
						{/* Cohort Select Filter */}
						<div className="w-40 sm:w-44">
							<Select
								value={cohortFilter}
								onValueChange={(v) => setCohortFilter(v ?? "all")}
							>
								<SelectTrigger className="h-9 text-xs bg-slate-50/70 border-slate-200 focus:ring-[#0517B0]/20">
									<SelectValue placeholder="Pilih Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{availableCohorts.map((c) => (
										<SelectItem key={c} value={String(c)}>
											Angkatan {c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Search Bar with clear button */}
						<div className="relative flex-1 sm:w-60">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
							<Input
								placeholder="Cari nama, NIM, peminatan..."
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

						{/* Reset Filter Button if active */}
						{(cohortFilter !== "all" || searchQuery) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setCohortFilter("all");
									setSearchQuery("");
								}}
								className="h-9 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
							>
								Reset Filter
							</Button>
						)}
					</div>
				</div>

				{/* Table Body */}
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
							<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
							<span className="text-xs font-medium text-slate-500">
								Memuat daftar mahasiswa bimbingan...
							</span>
						</div>
					) : filtered.length === 0 ? (
						<div className="text-center py-16 px-4">
							<div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
								<Users className="w-6 h-6" />
							</div>
							<p className="text-sm font-semibold text-slate-800">
								Tidak ada mahasiswa ditemukan
							</p>
							<p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
								{searchQuery || cohortFilter !== "all"
									? "Coba ubah kata kunci pencarian atau reset filter angkatan."
									: "Belum ada mahasiswa yang ditugaskan ke Dosen Pembimbing Akademik ini."}
							</p>
							{(searchQuery || cohortFilter !== "all") && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setCohortFilter("all");
										setSearchQuery("");
									}}
									className="mt-4 text-xs h-8"
								>
									Reset Semua Filter
								</Button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="bg-slate-50/75 border-b border-slate-200/80">
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 pl-6 min-w-[220px]">
											Mahasiswa
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 min-w-[180px]">
											Peminatan & Negara
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 text-center min-w-[110px]">
											Angkatan
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 min-w-[180px]">
											Kontak WhatsApp
										</TableHead>
										<TableHead className="text-xs font-semibold text-slate-600 py-3.5 text-right pr-6 min-w-[130px]">
											Aksi Monitoring
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtered.map((s) => {
										const initials = getInitials(s.name);
										const cleanPhone = s.phone
											? s.phone.replace(/\D/g, "")
											: null;
										const waUrl = cleanPhone
											? `https://wa.me/${cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone}`
											: null;

										const targetUrl = `/dashboard/akademik/pa/${paId}/mahasiswa/${s.id}?name=${encodeURIComponent(s.name)}&nim=${s.nim ?? ""}&program=${encodeURIComponent(s.subProgram ?? s.program)}&cohort=${s.cohort}`;

										return (
											<TableRow
												key={s.id}
												onClick={() => router.push(targetUrl)}
												className="hover:bg-blue-50/30 transition-colors cursor-pointer group border-b border-slate-100"
											>
												{/* Mahasiswa Info (Avatar + Name + NIM) */}
												<TableCell className="py-3.5 pl-6">
													<div className="flex items-center gap-3">
														<div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 group-hover:bg-blue-100/80 group-hover:text-[#0517B0] group-hover:border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
															{initials}
														</div>
														<div>
															<div className="font-semibold text-slate-900 text-sm group-hover:text-[#0517B0] transition-colors leading-tight">
																{s.name}
															</div>
															<div className="text-xs font-mono text-slate-400 mt-0.5">
																NIM: {s.nim || "-"}
															</div>
														</div>
													</div>
												</TableCell>

												{/* Peminatan Badge */}
												<TableCell className="py-3.5">
													<PeminatanBadge
														subProgram={s.subProgram}
														program={s.program}
														variant="subtle"
														size="sm"
													/>
												</TableCell>

												{/* Angkatan */}
												<TableCell className="py-3.5 text-center">
													<Badge
														variant="outline"
														className="bg-slate-50 text-slate-700 border-slate-200/90 text-xs font-semibold px-2.5 py-0.5 rounded-lg"
													>
														Angkatan {s.cohort}
													</Badge>
												</TableCell>

												{/* No WhatsApp */}
												<TableCell
													className="py-3.5"
													onClick={(e) => {
														// Prevent row click if clicking direct WhatsApp link
														if (waUrl) e.stopPropagation();
													}}
												>
													{waUrl ? (
														<a
															href={waUrl}
															target="_blank"
															rel="noreferrer"
															className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all shadow-2xs group/wa"
														>
															<MessageCircle className="w-3.5 h-3.5 text-emerald-600 group-hover/wa:scale-110 transition-transform" />
															<span>{s.phone}</span>
														</a>
													) : (
														<span className="text-xs text-slate-400 italic">
															- Belum ada -
														</span>
													)}
												</TableCell>

												{/* Action Button */}
												<TableCell className="py-3.5 text-right pr-6">
													<Button
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															router.push(targetUrl);
														}}
														className="h-8 px-3 text-xs gap-1 font-semibold text-[#0517B0] bg-blue-50/80 hover:bg-[#0517B0] hover:text-white border border-blue-200/80 rounded-lg transition-all shadow-2xs group-hover:bg-[#0517B0] group-hover:text-white"
													>
														<span>Detail</span>
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

				{/* Table Footer */}
				{!isLoading && filtered.length > 0 && (
					<div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
						<span>
							Menampilkan{" "}
							<strong className="font-semibold text-slate-700">
								{filtered.length}
							</strong>{" "}
							mahasiswa bimbingan
						</span>
						<span className="text-slate-400">
							Klik pada baris atau tombol Detail untuk membuka monitoring
							lengkap
						</span>
					</div>
				)}
			</Card>
		</div>
	);
}
