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
	Search,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

	const filteredCourses = courses.filter(
		(c) =>
			c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(c.peminatan &&
				c.peminatan.toLowerCase().includes(searchQuery.toLowerCase())),
	);

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
							<BookOpen className="w-3.5 h-3.5" />
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
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-[#0517B0]" />
							Daftar Mata Kuliah Saya
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Pilih mata kuliah untuk melihat detail sesi pertemuan, presensi,
							atau nilai.
						</p>
					</div>

					{/* Search Bar */}
					<div className="relative w-full sm:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<Input
							placeholder="Cari mata kuliah, kode..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 h-9 text-xs bg-white border-slate-200"
						/>
					</div>
				</CardHeader>

				<CardContent className="p-6">
					{filteredCourses.length === 0 ? (
						<div className="text-center py-12 text-slate-400">
							<BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-300" />
							<p className="text-sm font-medium text-slate-600">
								{courses.length === 0
									? "Belum ada mata kuliah yang ditugaskan kepada Anda."
									: "Tidak ada mata kuliah yang cocok dengan pencarian."}
							</p>
							<p className="text-xs text-slate-400 mt-1">
								Hubungi Admin Akademik jika ada jadwal mata kuliah yang belum
								muncul.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filteredCourses.map((course) => (
								<div
									key={course.id}
									className="border border-slate-200 hover:border-[#0517B0]/40 rounded-xl p-5 bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
								>
									<div className="space-y-3">
										<div className="flex items-start justify-between gap-2">
											<Badge
												variant="secondary"
												className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-200"
											>
												{course.code}
											</Badge>
											<Badge
												className={cn(
													"text-[10px] font-bold px-2 py-0.5 uppercase",
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
											<div className="flex flex-wrap items-center gap-2 mt-2">
												<Badge
													variant="outline"
													className="text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 px-2 py-0.5"
												>
													Angkatan {course.cohort}
												</Badge>
												{course.peminatan && (
													<PeminatanBadge
														subProgram={course.peminatan}
														className="text-[10px] py-0 px-2"
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
												className="w-full bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs h-9"
											>
												Sesi & Presensi
												<ChevronRight className="w-3.5 h-3.5 ml-1" />
											</Button>
										</Link>
										<Link href={`/dashboard/mata-kuliah/rekap/${course.id}`}>
											<Button
												size="sm"
												variant="outline"
												className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs h-9 px-3"
												title="Rekap Nilai & Presensi"
											>
												<CheckSquare className="w-4 h-4" />
											</Button>
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
