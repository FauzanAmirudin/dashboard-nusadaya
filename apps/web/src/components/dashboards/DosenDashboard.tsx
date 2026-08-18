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
			{/* Welcome Banner */}
			<div className="bg-gradient-to-r from-[#0517B0] via-blue-700 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="space-y-1.5">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
							<GraduationCap className="w-3.5 h-3.5" />
							Panel Dosen Pengajar
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
							Selamat Datang, {user?.fullName || user?.username}!
						</h1>
						<p className="text-blue-100 text-xs sm:text-sm max-w-xl">
							Kelola kelas perkuliahan, isi presensi kehadiran pertemuan, dan
							pantau rekapitulasi penilaian mahasiswa Anda.
						</p>
					</div>
					<div className="flex flex-wrap gap-2.5 shrink-0">
						<Link href="/dashboard/mata-kuliah">
							<Button
								variant="secondary"
								className="bg-white text-[#0517B0] hover:bg-blue-50 font-bold text-xs sm:text-sm h-10 px-4 shadow-sm"
							>
								<BookOpen className="w-4 h-4 mr-2" />
								Mata Kuliah
							</Button>
						</Link>
						<Link href="/dashboard/mata-kuliah/rekap">
							<Button
								variant="outline"
								className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-bold text-xs sm:text-sm h-10 px-4"
							>
								<CheckSquare className="w-4 h-4 mr-2" />
								Rekap Nilai
							</Button>
						</Link>
					</div>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="border-slate-200 shadow-xs bg-white">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0">
							<BookOpen className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Mata Kuliah Diampu
							</p>
							<p className="text-2xl font-bold text-slate-900 mt-0.5">
								{courses.length}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200 shadow-xs bg-white">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
							<Layers className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Kelas Teori
							</p>
							<p className="text-2xl font-bold text-slate-900 mt-0.5">
								{totalTeori} Kelas
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200 shadow-xs bg-white">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
							<CheckCircle2 className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
								Kelas Praktik
							</p>
							<p className="text-2xl font-bold text-slate-900 mt-0.5">
								{totalPraktik} Kelas
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Course List Section */}
			<Card className="border-slate-200 shadow-sm bg-white">
				<CardHeader className="border-b border-slate-100 pb-4">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
								<BookOpen className="w-5 h-5 text-[#0517B0]" />
								Daftar Mata Kuliah Saya
							</CardTitle>
							<CardDescription className="text-xs text-slate-500">
								Pilih mata kuliah untuk melihat detail pertemuan, mengisi
								presensi, atau menginput nilai.
							</CardDescription>
						</div>

						{/* Search Bar */}
						<div className="relative w-full sm:w-72">
							<Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
							<Input
								placeholder="Cari mata kuliah..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
							/>
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
									className="border border-slate-200/80 hover:border-[#0517B0]/40 rounded-xl p-5 bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
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
												<span className="text-xs text-slate-500 font-medium">
													Angkatan {course.cohort}
												</span>
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
