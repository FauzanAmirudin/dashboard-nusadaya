"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/eden";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Download, ClipboardCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";
import Link from "next/link";
import { useAuthStore } from "@/store";
import { Badge } from "@/components/ui/badge";

export function KehadiranDashboard() {
	const { user } = useAuthStore();
	const [students, setStudents] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [cohortFilter, setCohortFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const fetchStudents = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await api.students.get();
			if (!error && data?.data) {
				setStudents(data.data);
			} else {
				toast.error("Gagal memuat daftar mahasiswa");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchStudents();
	}, []);

	const filteredStudents = students.filter((item: any) => {
		const s = item.student;
		if (cohortFilter !== "all" && s.cohort !== parseInt(cohortFilter, 10)) return false;
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			if (!s.name.toLowerCase().includes(query) && !(s.nim && s.nim.toLowerCase().includes(query))) {
				return false;
			}
		}
		return true;
	});

	const cohorts = Array.from(new Set(students.map((item: any) => item.student.cohort))).sort((a: any, b: any) => b - a);

	const handleExport = () => {
		// Prepare data for Perkuliahan
		const dataPerkuliahan = filteredStudents.map((item: any) => {
			const s = item.student;
			const courses = item.courseGrades || [];
			
			let totalPertemuan = 0;
			let totalHadir = 0;

			courses.forEach((c: any) => {
				totalPertemuan += (c.totalMeetings || 16);
				totalHadir += (c.attendancePresent || 0);
			});

			const rate = totalPertemuan > 0 ? Math.round((totalHadir / totalPertemuan) * 100) : 0;
			return {
				NIM: s.nim || "-",
				Nama: s.name,
				Angkatan: s.cohort,
				"Total Pertemuan": totalPertemuan,
				"Total Hadir": totalHadir,
				"Persentase (%)": `${rate}%`,
			};
		});

		// Prepare data for Piket
		const dataPiket = filteredStudents.map((item: any) => {
			const s = item.student;
			const acad = item.academic || {};
			const rate = acad.attendancePiketTotal > 0 ? Math.round((acad.attendancePiketPresent / acad.attendancePiketTotal) * 100) : 0;
			return {
				NIM: s.nim || "-",
				Nama: s.name,
				Angkatan: s.cohort,
				"Total Pertemuan": acad.attendancePiketTotal || 0,
				"Total Hadir": acad.attendancePiketPresent || 0,
				"Persentase (%)": `${rate}%`,
			};
		});

		// Prepare data for ODS
		const dataOds = filteredStudents.map((item: any) => {
			const s = item.student;
			const acad = item.academic || {};
			const rate = acad.attendanceOdsTotal > 0 ? Math.round((acad.attendanceOdsPresent / acad.attendanceOdsTotal) * 100) : 0;
			return {
				NIM: s.nim || "-",
				Nama: s.name,
				Angkatan: s.cohort,
				"Total Pertemuan": acad.attendanceOdsTotal || 0,
				"Total Hadir": acad.attendanceOdsPresent || 0,
				"Persentase (%)": `${rate}%`,
			};
		});

		// Prepare data for Pra Magang
		const dataPraMagang = filteredStudents.map((item: any) => {
			const s = item.student;
			const acad = item.academic || {};
			const rate = acad.attendancePramagangTotal > 0 ? Math.round((acad.attendancePramagangPresent / acad.attendancePramagangTotal) * 100) : 0;
			return {
				NIM: s.nim || "-",
				Nama: s.name,
				Angkatan: s.cohort,
				"Total Pertemuan": acad.attendancePramagangTotal || 0,
				"Total Hadir": acad.attendancePramagangPresent || 0,
				"Persentase (%)": `${rate}%`,
			};
		});

		// Dynamic import to avoid SSR issues and heavy bundle size load if not used
		import("xlsx").then((XLSX) => {
			const wb = XLSX.utils.book_new();

			const wsPerkuliahan = XLSX.utils.json_to_sheet(dataPerkuliahan);
			const wsPiket = XLSX.utils.json_to_sheet(dataPiket);
			const wsOds = XLSX.utils.json_to_sheet(dataOds);
			const wsPraMagang = XLSX.utils.json_to_sheet(dataPraMagang);

			XLSX.utils.book_append_sheet(wb, wsPerkuliahan, "Perkuliahan");
			XLSX.utils.book_append_sheet(wb, wsPiket, "Piket");
			XLSX.utils.book_append_sheet(wb, wsOds, "ODS");
			XLSX.utils.book_append_sheet(wb, wsPraMagang, "Pra Magang");

			const fileName = `Rekap_Kehadiran_Angkatan_${cohortFilter === "all" ? "Semua" : cohortFilter}_${new Date().toISOString().split("T")[0]}.xlsx`;
			XLSX.writeFile(wb, fileName);
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-primary/10 text-primary rounded-lg">
						<ClipboardCheck className="w-6 h-6" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-slate-800">Manajemen Kehadiran</h1>
						<p className="text-slate-500 text-sm">Monitoring kehadiran mahasiswa di berbagai sesi dan acara.</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Badge variant="outline" className="bg-white">
						Akses Monitoring
					</Badge>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
				<div className="flex flex-col sm:flex-row gap-4 flex-1">
					<div className="w-full sm:w-48">
						<Select value={cohortFilter} onValueChange={(v) => setCohortFilter(v || "all")}>
							<SelectTrigger>
								<SelectValue placeholder="Semua Angkatan" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Semua Angkatan</SelectItem>
								{cohorts.map((c: any) => (
									<SelectItem key={c} value={c.toString()}>Angkatan {c}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="relative flex-1">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
						<Input 
							placeholder="Cari nama atau NIM mahasiswa..." 
							className="pl-9"
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
				<Button variant="outline" className="shrink-0" onClick={handleExport} disabled={filteredStudents.length === 0}>
					<Download className="w-4 h-4 mr-2" />
					Export Excel
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center p-12 bg-white rounded-xl border border-slate-200">
					<Loader2 className="w-8 h-8 animate-spin text-primary" />
				</div>
			) : (
				<div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50 hover:bg-slate-50">
									<TableHead>Nama Mahasiswa</TableHead>
									<TableHead>Dosen (PA)</TableHead>
									<TableHead>Peminatan</TableHead>
									<TableHead>Angkatan</TableHead>
									<TableHead>Tahun Ajaran</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredStudents.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-8 text-slate-500">
											Tidak ada data mahasiswa ditemukan
										</TableCell>
									</TableRow>
								) : (
									filteredStudents.map((item: any) => {
										const s = item.student;
										const currentYear = new Date().getFullYear();
										const ta = `${currentYear}/${currentYear + 1}`; 

										return (
											<TableRow key={s.id}>
												<TableCell>
													<div className="font-medium">{s.name}</div>
													<div className="text-xs text-slate-500">{s.nim || "-"}</div>
												</TableCell>
												<TableCell>
													<div className="text-sm text-slate-700">{s.paName || "-"}</div>
												</TableCell>
												<TableCell>
													<div className="text-sm">{s.program || "-"}</div>
													<div className="text-xs text-slate-500">{s.subProgram || ""}</div>
												</TableCell>
												<TableCell>Angkatan {s.cohort}</TableCell>
												<TableCell>{ta}</TableCell>
												<TableCell className="text-right">
													<Link href={`/dashboard/students/${s.id}?context=kehadiran`}>
														<Button variant="outline" size="sm">
															Lihat Detail
														</Button>
													</Link>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
		</div>
	);
}
