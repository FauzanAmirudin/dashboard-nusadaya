"use client";

import {
	BookOpen,
	CalendarDays,
	CheckCircle2,
	CheckSquare,
	ChevronRight,
	Clock,
	GraduationCap,
	Layers,
	Loader2,
	RotateCcw,
	Search,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { NeumorphicStatCard } from "@/components/ui/NeumorphicStatCard";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import type { User } from "@/store";

type CourseData = {
	id: number;
	code: string;
	name: string;
	dosenId: number;
	dosen?: { id: number; fullName: string };
	peminatan: string | null;
	cohort: number;
	type: "teori" | "praktik";
};

interface DosenDashboardProps {
	user?: User | null;
}

export function DosenDashboard({ user }: DosenDashboardProps) {
	const [courses, setCourses] = useState<CourseData[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterCohort, setFilterCohort] = useState<string>("all");
	const [filterType, setFilterType] = useState<string>("all");
	const [filterPeminatan, setFilterPeminatan] = useState<string>("all");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchMyCourses = async () => {
			try {
				setIsLoading(true);
				const { data, error } = await api.courses.get();
				if (error) throw error;
				if (data?.success) {
					const allCourses = data.data as unknown as CourseData[];
					// Filter courses where this dosen is assigned
					const myCourses = allCourses.filter(
						(c) => c.dosenId === user?.id || c.dosen?.id === user?.id,
					);
					setCourses(myCourses);
				}
			} catch (err: any) {
				console.error("Failed fetching dosen courses", err);
				toast.error("Gagal memuat daftar mata kuliah");
			} finally {
				setIsLoading(false);
			}
		};

		if (user) {
			fetchMyCourses();
		}
	}, [user]);

	// Standard + Dynamic Cohorts list
	const availableCohorts = useMemo(() => {
		const fromData = courses.map((c) => c.cohort).filter(Boolean);
		const set = new Set([...fromData, 16, 15, 14, 13, 12, 11, 10]);
		return Array.from(set).sort((a, b) => b - a);
	}, [courses]);

	// Unique peminatan
	const uniquePeminatan = useMemo(() => {
		return Array.from(
			new Set(courses.map((c) => c.peminatan).filter(Boolean)),
		) as string[];
	}, [courses]);

	const filteredCourses = useMemo(() => {
		return courses.filter((c) => {
			const matchSearch =
				!searchQuery ||
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(c.peminatan &&
					c.peminatan.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchCohort =
				filterCohort === "all" || c.cohort.toString() === filterCohort;

			const matchType = filterType === "all" || c.type === filterType;

			const matchPeminatan =
				filterPeminatan === "all" || c.peminatan === filterPeminatan;

			return matchSearch && matchCohort && matchType && matchPeminatan;
		});
	}, [courses, searchQuery, filterCohort, filterType, filterPeminatan]);

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

	const totalTeori = courses.filter((c) => c.type === "teori").length;
	const totalPraktik = courses.filter((c) => c.type === "praktik").length;

	if (isLoading) {
		return (
			<div className="flex flex-col justify-center items-center h-80 gap-3 text-slate-500">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-sm font-semibold">Memuat dashboard pengajar...</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-12">
			{/* Top Header */}
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<div>
					<div className="flex items-center gap-3">
						<div className="p-2.5 bg-blue-50 text-[#0517B0] rounded-lg border border-blue-100">
							<GraduationCap className="w-6 h-6" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-2xl font-bold text-slate-900">
									Dashboard Dosen Pengajar
								</h1>
								<Badge className="bg-blue-50 text-[#0517B0] border-blue-200 text-xs">
									Dosen
								</Badge>
							</div>
							<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
								Selamat datang, {user?.fullName || user?.username}! Kelola
								perkuliahan, presensi, dan rekap penilaian mahasiswa.
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Link href="/dashboard/mata-kuliah">
						<Button
							variant="outline"
							size="sm"
							className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs gap-1.5 h-9 font-medium"
						>
							<BookOpen className="w-3.5 h-3.5 text-[#0517B0]" />
							Mata Kuliah
						</Button>
					</Link>
					<Link href="/dashboard/mata-kuliah/rekap">
						<Button
							variant="outline"
							size="sm"
							className="border-blue-200 text-[#0517B0] hover:bg-blue-50 text-xs gap-1.5 h-9 font-bold"
						>
							<CheckSquare className="w-3.5 h-3.5" />
							Rekap Nilai
						</Button>
					</Link>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
				<NeumorphicStatCard
					label="Mata Kuliah Diampu"
					value={courses.length}
					icon={<BookOpen className="h-5 w-5" />}
					color="blue"
				/>
				<NeumorphicStatCard
					label="Kelas Teori"
					value={`${totalTeori} Kelas`}
					icon={<Layers className="h-5 w-5" />}
					color="indigo"
				/>
				<NeumorphicStatCard
					label="Kelas Praktik"
					value={`${totalPraktik} Kelas`}
					icon={<CheckCircle2 className="h-5 w-5" />}
					color="green"
				/>
			</div>

			{/* Course List Section */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-xl">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-[#0517B0]" />
							Daftar Mata Kuliah Saya
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Pilih mata kuliah untuk melihat detail sesi pertemuan, presensi,
							atau rekap nilai.
						</p>
					</div>

					{/* Search & Filter Bar */}
					<div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
						{/* Search Bar */}
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari mata kuliah, kode, peminatan..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 text-xs bg-white border-slate-200 w-full"
							/>
						</div>

						{/* Dropdown Filters & Reset Button */}
						<div className="flex flex-wrap items-center gap-2">
							{/* Filter Angkatan */}
							<Select
								value={filterCohort}
								onValueChange={(v) => setFilterCohort(v || "all")}
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
									{availableCohorts.map((c) => (
										<SelectItem
											key={c}
											value={c.toString()}
											className="text-xs"
										>
											Angkatan {c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{/* Filter Jenis */}
							<Select
								value={filterType}
								onValueChange={(v) => setFilterType(v || "all")}
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
									onValueChange={(v) => setFilterPeminatan(v || "all")}
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

				<CardContent className="p-6">
					{filteredCourses.length === 0 ? (
						<div className="text-center py-12 text-slate-400">
							<BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-300" />
							<p className="text-sm font-medium text-slate-600">
								{courses.length === 0
									? "Belum ada mata kuliah yang ditugaskan kepada Anda."
									: "Tidak ada mata kuliah yang cocok dengan filter pencarian."}
							</p>
							<p className="text-xs text-slate-400 mt-1">
								{courses.length === 0
									? "Hubungi Admin Akademik jika ada jadwal mata kuliah yang belum muncul."
									: "Coba ubah filter angkatan, jenis, atau kata kunci pencarian."}
							</p>
							{isFilterActive && (
								<Button
									variant="outline"
									size="sm"
									onClick={resetFilters}
									className="mt-4 text-xs"
								>
									Reset Semua Filter
								</Button>
							)}
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{filteredCourses.map((course) => (
									<div
										key={course.id}
										className="border border-slate-200 hover:border-[#0517B0]/40 rounded-xl p-5 bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
									>
										<div className="space-y-3">
											<div className="flex items-start justify-between gap-2">
												<span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
													{course.code}
												</span>
												<Badge
													className={cn(
														"text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider",
														course.type === "praktik"
															? "bg-emerald-50 text-emerald-700 border-emerald-200"
															: "bg-blue-50 text-blue-700 border-blue-200",
													)}
												>
													{course.type}
												</Badge>
											</div>

											<div>
												<h3 className="font-bold text-slate-900 text-base group-hover:text-[#0517B0] transition-colors leading-snug">
													{course.name}
												</h3>
												<div className="flex flex-wrap items-center gap-2 mt-2.5">
													<Badge
														variant="outline"
														className="text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 px-2 py-0.5"
													>
														Angkatan {course.cohort}
													</Badge>
													{course.peminatan && (
														<PeminatanBadge
															subProgram={course.peminatan}
															size="sm"
														/>
													)}
												</div>
											</div>
										</div>

										<div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
											<Link
												href={`/dashboard/mata-kuliah/${course.id}`}
												className="flex-1"
											>
												<Button
													size="sm"
													className="w-full bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs h-9 shadow-xs"
												>
													Sesi & Presensi
													<ChevronRight className="w-3.5 h-3.5 ml-1" />
												</Button>
											</Link>
											<Link href={`/dashboard/mata-kuliah/rekap/${course.id}`}>
												<Button
													size="sm"
													variant="outline"
													className="border-slate-200 hover:bg-slate-50 text-[#0517B0] text-xs h-9 px-3 font-semibold"
													title="Rekap Nilai & Presensi"
												>
													<CheckSquare className="w-4 h-4 mr-1" />
													Rekap
												</Button>
											</Link>
										</div>
									</div>
								))}
							</div>

							{/* Summary Counter Footer */}
							<div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
									<span className="text-[#0517B0] font-medium">
										Filter aktif
									</span>
								)}
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
