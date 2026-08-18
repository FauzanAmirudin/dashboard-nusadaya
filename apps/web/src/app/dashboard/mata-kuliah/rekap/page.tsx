"use client";

import {
	BookOpen,
	CheckSquare,
	Download,
	Eye,
	FileSpreadsheet,
	FileText,
	GraduationCap,
	Loader2,
	Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { exportToCSV } from "@/lib/export";
import { useAuthStore } from "@/store";

function getPeminatanBadge(peminatan: string | null) {
	if (!peminatan) return <span className="text-slate-400 text-xs">-</span>;

	const lower = peminatan.toLowerCase();
	let flagUrl = "https://flagcdn.com/w20/id.png";
	let countryAlt = "ID";

	if (lower.includes("malaysia")) {
		flagUrl = "https://flagcdn.com/w20/my.png";
		countryAlt = "MY";
	} else if (lower.includes("taiwan")) {
		flagUrl = "https://flagcdn.com/w20/tw.png";
		countryAlt = "TW";
	} else if (
		lower.includes("timur tengah") ||
		lower.includes("saudi") ||
		lower.includes("barista")
	) {
		flagUrl = "https://flagcdn.com/w20/sa.png";
		countryAlt = "SA";
	} else if (lower.includes("jepang") || lower.includes("japan")) {
		flagUrl = "https://flagcdn.com/w20/jp.png";
		countryAlt = "JP";
	} else if (lower.includes("indonesia") || lower.includes("reguler")) {
		flagUrl = "https://flagcdn.com/w20/id.png";
		countryAlt = "ID";
	}

	return (
		<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200/80 text-slate-700 whitespace-nowrap shadow-2xs">
			<img
				src={flagUrl}
				alt={countryAlt}
				className="w-4 h-2.5 object-cover rounded-[1px] shadow-2xs"
			/>
			<span>{peminatan}</span>
		</span>
	);
}

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

	const filteredCourses = courses.filter((c) => {
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
			c.dosen?.fullName?.toLowerCase().includes(query)
		);
	});

	const uniquePeminatan = Array.from(
		new Set(courses.map((c) => c.peminatan).filter(Boolean)),
	);

	const handleExport = () => {
		if (filteredCourses.length === 0) return;
		const exportData = filteredCourses.map((c) => ({
			"Kode MK": c.code,
			"Nama Mata Kuliah": c.name,
			"Dosen Pengampu": c.dosen?.fullName || "-",
			Peminatan: c.peminatan || "-",
			Angkatan: c.cohort,
			Jenis: c.type === "teori" ? "Teori" : "Praktik",
		}));
		exportToCSV(
			exportData,
			`Daftar_Mata_Kuliah_Rekap_${new Date().toISOString().split("T")[0]}`,
		);
	};

	if (!hasHydrated) return null;

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
						<CheckSquare className="h-6 w-6 text-emerald-600" />
						Rekap Nilai & Presensi Perkuliahan
					</h1>
					<p className="text-slate-500 text-sm mt-1">
						{user?.role === "dosen"
							? `Pilih mata kuliah yang Anda ampu (${user.fullName || user.username}) untuk melihat rekapitulasi nilai harian 18 pertemuan, presensi, dan transkrip akhir`
							: "Pilih mata kuliah untuk melihat laporan rekapitulasi presensi dan nilai mahasiswa"}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" /> Export Excel
					</Button>
				</div>
			</div>

			{/* Filter Card */}
			<Card className="shadow-xs border-slate-200 overflow-hidden">
				<CardHeader className="bg-slate-50/50 border-b border-slate-200 p-4">
					<div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
						<div className="relative w-full md:w-80">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder="Cari mata kuliah, kode, atau dosen..."
								className="pl-9 bg-white h-9 text-sm"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className="flex flex-wrap gap-2 w-full md:w-auto">
							<Select
								value={filterCohort}
								onValueChange={(v) => setFilterCohort(v || "all")}
							>
								<SelectTrigger className="w-full sm:w-[150px] bg-white h-9 text-sm">
									<SelectValue placeholder="Semua Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{Array.from(
										{ length: new Date().getFullYear() - 2022 + 2 },
										(_, i) => new Date().getFullYear() + 1 - i,
									).map((c) => (
										<SelectItem key={c} value={c.toString()}>
											Angkatan {c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filterType}
								onValueChange={(v) => setFilterType(v || "all")}
							>
								<SelectTrigger className="w-full sm:w-[130px] bg-white h-9 text-sm">
									<SelectValue placeholder="Semua Jenis">
										{filterType === "all"
											? "Semua Jenis"
											: filterType === "teori"
												? "Teori"
												: "Praktik"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Jenis</SelectItem>
									<SelectItem value="teori">Teori</SelectItem>
									<SelectItem value="praktik">Praktik</SelectItem>
								</SelectContent>
							</Select>
							{uniquePeminatan.length > 0 && (
								<Select
									value={filterPeminatan}
									onValueChange={(v) => setFilterPeminatan(v || "all")}
								>
									<SelectTrigger className="w-full sm:w-[170px] bg-white h-9 text-sm">
										<SelectValue placeholder="Semua Peminatan">
											{filterPeminatan === "all"
												? "Semua Peminatan"
												: filterPeminatan}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Semua Peminatan</SelectItem>
										{uniquePeminatan.map((p, i) => (
											<SelectItem key={i} value={p as string}>
												{p}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto min-w-full">
						<Table className="w-full">
							<TableHeader>
								<TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 w-28">
										Kode
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[200px]">
										Nama Mata Kuliah
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[170px]">
										Dosen Pengampu
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 min-w-[180px]">
										Peminatan
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-center w-28">
										Angkatan
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-center w-24">
										Jenis
									</TableHead>
									<TableHead className="font-semibold text-slate-700 py-3.5 px-4 text-right min-w-[130px]">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center py-12">
											<Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
											<p className="text-xs text-slate-400">
												Memuat daftar mata kuliah...
											</p>
										</TableCell>
									</TableRow>
								) : filteredCourses.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="text-center py-12 text-slate-500"
										>
											<CheckSquare className="h-10 w-10 mx-auto text-slate-300 mb-2" />
											<p className="font-medium text-slate-600">
												Tidak ada mata kuliah yang ditemukan
											</p>
											<p className="text-xs text-slate-400 mt-1">
												Sesuaikan kata kunci pencarian atau filter di atas.
											</p>
										</TableCell>
									</TableRow>
								) : (
									filteredCourses.map((c) => (
										<TableRow
											key={c.id}
											className="hover:bg-slate-50/80 border-b border-slate-200 transition-colors"
										>
											<TableCell className="font-mono font-bold text-slate-900 py-3 px-4">
												{c.code}
											</TableCell>
											<TableCell className="py-3 px-4 font-semibold text-slate-800">
												<Link
													href={`/dashboard/mata-kuliah/rekap/${c.id}`}
													className="hover:text-emerald-700 hover:underline"
												>
													{c.name}
												</Link>
											</TableCell>
											<TableCell className="py-3 px-4 text-slate-600 text-sm">
												{c.dosen?.fullName || (
													<span className="text-slate-400 italic">
														Belum Ditugaskan
													</span>
												)}
											</TableCell>
											<TableCell className="py-3 px-4">
												{getPeminatanBadge(c.peminatan)}
											</TableCell>
											<TableCell className="text-center py-3 px-4">
												<Badge
													variant="outline"
													className="bg-slate-50 text-slate-700 font-medium"
												>
													Angkatan {c.cohort}
												</Badge>
											</TableCell>
											<TableCell className="text-center py-3 px-4">
												<Badge
													variant={c.type === "teori" ? "secondary" : "default"}
													className={
														c.type === "teori"
															? "bg-blue-50 text-blue-700 border-blue-200/60 hover:bg-blue-100 text-xs"
															: "bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100 text-xs"
													}
												>
													{c.type === "teori" ? "Teori" : "Praktik"}
												</Badge>
											</TableCell>
											<TableCell className="text-right py-3 px-4">
												<div className="flex items-center justify-end gap-1.5">
													<Link href={`/dashboard/mata-kuliah/rekap/${c.id}`}>
														<Button
															variant="outline"
															size="sm"
															className="h-8 px-3 gap-1.5 font-medium text-emerald-700 bg-emerald-50/90 border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-2xs cursor-pointer"
															title="Buka Rekapitulasi Nilai & Presensi"
														>
															<CheckSquare className="h-3.5 w-3.5" />
															<span>Lihat Rekap</span>
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
				</CardContent>
			</Card>
		</div>
	);
}
