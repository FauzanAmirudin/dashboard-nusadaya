"use client";

import {
	BookOpen,
	CheckSquare,
	GraduationCap,
	Loader2,
	RotateCcw,
	Search,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

type CourseData = {
	id: number;
	code: string;
	name: string;
	dosenId: number;
	dosen: { id: number; fullName: string };
	peminatan: string | null;
	cohort: number;
	type: "teori" | "praktik";
};

export default function RekapNilaiListPage() {
	const { user, hasHydrated } = useAuthStore();
	const [courses, setCourses] = useState<CourseData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [filterCohort, setFilterCohort] = useState<string>("all");
	const [filterType, setFilterType] = useState<string>("all");
	const [filterPeminatan, setFilterPeminatan] = useState<string>("all");

	const fetchCourses = async () => {
		try {
			const { data, error } = await api.courses.get({
				$query: {
					...(filterCohort !== "all" && { cohort: filterCohort }),
					...(filterType !== "all" && { type: filterType }),
					...(filterPeminatan !== "all" && { peminatan: filterPeminatan }),
				},
			});
			if (error) throw error;
			if (data?.success) {
				let courseList = data.data as unknown as CourseData[];
				if (user?.role === "dosen") {
					courseList = courseList.filter(
						(c) => c.dosenId === user.id || c.dosen?.id === user.id,
					);
				}
				setCourses(courseList);
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal memuat daftar mata kuliah");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (hasHydrated && user) {
			setIsLoading(true);
			fetchCourses();
		}
	}, [hasHydrated, user, filterCohort, filterType, filterPeminatan]);

	const availableCohorts = useMemo(() => {
		const fromData = courses.map((c) => c.cohort).filter(Boolean);
		return Array.from(new Set(fromData)).sort((a, b) => Number(b) - Number(a));
	}, [courses]);

	const uniquePeminatan = useMemo(() => {
		return Array.from(
			new Set(courses.map((c) => c.peminatan).filter(Boolean)),
		) as string[];
	}, [courses]);

	const filteredCourses = useMemo(() => {
		return courses.filter((c) => {
			if (
				user?.role === "dosen" &&
				c.dosenId !== user.id &&
				c.dosen?.id !== user.id
			) {
				return false;
			}
			if (!searchQuery) return true;
			const query = searchQuery.toLowerCase();
			return (
				c.name.toLowerCase().includes(query) ||
				c.code.toLowerCase().includes(query) ||
				c.dosen?.fullName?.toLowerCase().includes(query) ||
				(c.peminatan && c.peminatan.toLowerCase().includes(query))
			);
		});
	}, [courses, searchQuery, user]);

	const isFilterActive =
		searchQuery.trim() !== "" ||
		filterCohort !== "all" ||
		filterType !== "all" ||
		filterPeminatan !== "all";

	const resetFilters = () => {
		setSearchQuery("");
		setFilterCohort("all");
		setFilterType("all");
		setFilterPeminatan("all");
	};

	if (!hasHydrated) return null;

	return (
		<div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
						<CheckSquare className="w-6 h-6" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold text-slate-900">
								Rekap Nilai & Presensi Perkuliahan
							</h1>
							<Badge className="bg-blue-50 text-[#0517B0] border-blue-200 text-xs">
								{user?.role === "dosen" ? "Dosen" : "Akademik"}
							</Badge>
						</div>
						<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
							{user?.role === "dosen"
								? `Pilih mata kuliah yang Anda ampu (${user.fullName || user.username}) untuk melihat rekapitulasi nilai harian 16 pertemuan, presensi, dan transkrip akhir.`
								: "Pilih mata kuliah untuk melihat dan mengekspor laporan rekapitulasi presensi dan nilai mahasiswa."}
						</p>
					</div>
				</div>
			</div>

			{/* Main Table Card */}
			<Card className="bg-white border-slate-200 shadow-xs overflow-hidden rounded-xl">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<CheckSquare className="w-4 h-4 text-[#0517B0]" />
							Daftar Rekap Mata Kuliah
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Gunakan kolom pencarian dan filter di bawah untuk memfilter
							berdasarkan angkatan, jenis, atau peminatan.
						</p>
					</div>

					{/* Search & Filter Bar */}
					<div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
						{/* Search Bar */}
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari mata kuliah, kode, atau dosen..."
								className="pl-9 h-9 text-xs bg-white border-slate-200 w-full"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>

						{/* Dropdown Filters & Reset Button */}
						<div className="flex flex-wrap items-center gap-2">
							{/* Filter Angkatan */}
							<Select
								value={filterCohort}
								onValueChange={(val) => setFilterCohort(val || "all")}
							>
								<SelectTrigger className="w-full sm:w-[150px] bg-white h-9 text-xs border-slate-200">
									<SelectValue placeholder="Angkatan">
										{filterCohort === "all"
											? "Semua Angkatan"
											: `Angkatan ${filterCohort}`}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all" className="text-xs">
										Semua Angkatan
									</SelectItem>
									{availableCohorts.map((cohort) => (
										<SelectItem
											key={cohort}
											value={cohort.toString()}
											className="text-xs"
										>
											Angkatan {cohort}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Filter Jenis */}
							<Select
								value={filterType}
								onValueChange={(val) => setFilterType(val || "all")}
							>
								<SelectTrigger className="w-full sm:w-[135px] bg-white h-9 text-xs border-slate-200">
									<SelectValue placeholder="Jenis MK">
										{filterType === "all"
											? "Semua Jenis"
											: filterType === "teori"
												? "Kelas Teori"
												: "Kelas Praktik"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all" className="text-xs">
										Semua Jenis
									</SelectItem>
									<SelectItem value="teori" className="text-xs">
										Kelas Teori
									</SelectItem>
									<SelectItem value="praktik" className="text-xs">
										Kelas Praktik
									</SelectItem>
								</SelectContent>
							</Select>

							{/* Filter Peminatan */}
							{uniquePeminatan.length > 0 && (
								<Select
									value={filterPeminatan}
									onValueChange={(val) => setFilterPeminatan(val || "all")}
								>
									<SelectTrigger className="w-full sm:w-[165px] bg-white h-9 text-xs border-slate-200">
										<SelectValue placeholder="Peminatan">
											{filterPeminatan === "all"
												? "Semua Peminatan"
												: `Peminatan: ${filterPeminatan}`}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all" className="text-xs">
											Semua Peminatan
										</SelectItem>
										{uniquePeminatan.map((p, i) => (
											<SelectItem key={i} value={p} className="text-xs">
												{p}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							{/* Reset Button Inline */}
							{isFilterActive && (
								<Button
									variant="outline"
									size="sm"
									onClick={resetFilters}
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
					<div className="overflow-x-auto min-w-full">
						<Table className="w-full">
							<TableHeader>
								<TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 w-28 text-xs">
										Kode
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[200px] text-xs">
										Nama Mata Kuliah
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[170px] text-xs">
										Dosen Pengampu
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[160px] text-xs">
										Peminatan
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-center w-28 text-xs">
										Angkatan
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-center w-24 text-xs">
										Jenis
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-right min-w-[160px] text-xs">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-12">
											<Loader2 className="h-6 w-6 animate-spin mx-auto text-[#0517B0] mb-2" />
											<p className="text-xs text-slate-400">
												Memuat daftar rekap mata kuliah...
											</p>
										</TableCell>
									</TableRow>
								) : filteredCourses.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="text-center py-12 text-slate-500"
										>
											<CheckSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
											<p className="font-medium text-slate-600 text-sm">
												Tidak ada data mata kuliah
											</p>
											<p className="text-xs text-slate-400 mt-0.5">
												{isFilterActive
													? "Coba ubah filter atau kata kunci pencarian."
													: "Belum ada mata kuliah yang terdaftar."}
											</p>
											{isFilterActive && (
												<Button
													variant="outline"
													size="sm"
													onClick={resetFilters}
													className="mt-3 text-xs"
												>
													Reset Filter
												</Button>
											)}
										</TableCell>
									</TableRow>
								) : (
									filteredCourses.map((c) => (
										<TableRow
											key={c.id}
											className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
										>
											<TableCell className="py-3.5 px-4">
												<span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
													{c.code}
												</span>
											</TableCell>
											<TableCell className="py-3.5 px-4 font-bold text-slate-900 text-sm">
												<Link
													href={`/dashboard/mata-kuliah/rekap/${c.id}`}
													className="hover:text-[#0517B0] hover:underline"
												>
													{c.name}
												</Link>
											</TableCell>
											<TableCell className="py-3.5 px-4 text-slate-700 text-xs">
												<div className="flex items-center gap-1.5">
													<GraduationCap className="w-3.5 h-3.5 text-[#0517B0] shrink-0" />
													<span>{c.dosen?.fullName || "Belum Ditugaskan"}</span>
												</div>
											</TableCell>
											<TableCell className="py-3.5 px-4">
												{c.peminatan ? (
													<PeminatanBadge subProgram={c.peminatan} size="sm" />
												) : (
													<span className="text-slate-400 text-xs">-</span>
												)}
											</TableCell>
											<TableCell className="text-center py-3.5 px-4">
												<Badge
													variant="outline"
													className="bg-slate-50 border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-0.5"
												>
													Angkatan {c.cohort}
												</Badge>
											</TableCell>
											<TableCell className="text-center py-3.5 px-4">
												<Badge
													className={cn(
														"text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider",
														c.type === "praktik"
															? "bg-emerald-50 text-emerald-700 border-emerald-200"
															: "bg-blue-50 text-blue-700 border-blue-200",
													)}
												>
													{c.type}
												</Badge>
											</TableCell>
											<TableCell className="text-right py-3.5 px-4">
												<div className="flex items-center justify-end gap-1.5">
													<Link href={`/dashboard/mata-kuliah/rekap/${c.id}`}>
														<Button
															size="sm"
															className="h-8 px-3 gap-1.5 font-bold text-xs bg-[#0517B0] hover:bg-blue-800 text-white shadow-2xs"
															title="Buka Rekapitulasi Nilai & Presensi"
														>
															<CheckSquare className="h-3.5 w-3.5" />
															<span>Rekap Nilai</span>
														</Button>
													</Link>
													<Link href={`/dashboard/mata-kuliah/${c.id}`}>
														<Button
															variant="outline"
															size="sm"
															className="h-8 px-2 text-slate-700 border-slate-200 hover:bg-slate-50 text-xs"
															title="Kelola Mata Kuliah & Sesi Pertemuan"
														>
															<Settings className="h-3.5 w-3.5" />
														</Button>
													</Link>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Summary Counter Footer */}
					{!isLoading && filteredCourses.length > 0 && (
						<div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
							<span>
								Menampilkan{" "}
								<strong className="text-slate-700">
									{filteredCourses.length}
								</strong>{" "}
								dari{" "}
								<strong className="text-slate-700">{courses.length}</strong>{" "}
								mata kuliah
							</span>
							{isFilterActive && (
								<span className="text-[#0517B0] font-medium">Filter aktif</span>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
