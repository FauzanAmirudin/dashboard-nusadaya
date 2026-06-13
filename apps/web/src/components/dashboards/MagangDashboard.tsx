"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, AlertTriangle, PlaneTakeoff, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/store";
import { api } from "@/lib/eden";

interface DashboardData {
	kpi: {
		totalStudents: number;
		readyToDepart: number;
		processing: number;
		actionNeeded: number;
	};
	students: Array<{
		id: number;
		nim: string;
		name: string;
		program: string;
		destinationCity: string;
		completedDocs: number;
		status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	}>;
}

export function MagangDashboard() {
	const router = useRouter();
	const { user } = useAuthStore();
	const [data, setData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const fetchDashboard = async () => {
			setIsLoading(true);
			// Currently not implementing search on backend for simplicity in this iteration, 
			// but we will filter on the frontend for now or just fetch all.
			// Let's assume frontend filtering for small data size.
			const { data: res, error } = await api.magang.dashboard.get();
			if (!error && res?.data) {
				setData(res.data as unknown as DashboardData);
			}
			setIsLoading(false);
		};

		fetchDashboard();
	}, []);

	if (isLoading && !data) {
		return (
			<div className="flex justify-center items-center h-64 text-slate-500">
				Memuat dashboard Magang...
			</div>
		);
	}

	if (!data) return null;

	const renderStatusBadge = (status: string, label?: string) => {
		if (status === "AMAN") {
			return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10">{label || "🟢 Aman"}</Badge>;
		}
		if (status === "TIDAK_AMAN") {
			return <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10">{label || "🔴 Tdk Aman"}</Badge>;
		}
		return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10">{label || "🟡 Perhatian"}</Badge>;
	};

	const filteredStudents = data.students.filter(
		s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
			 s.nim.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Tim Magang Internasional
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {(user as any)?.fullName || user?.username}. Pantau progres dokumen keberangkatan mahasiswa.
					</p>
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardContent className="p-6">
						<div className="flex justify-between items-start">
							<div>
								<p className="text-sm font-medium text-slate-500 mb-1">Total Mahasiswa</p>
								<h3 className="text-3xl font-bold text-slate-900">{data.kpi.totalStudents}</h3>
							</div>
							<div className="p-3 bg-blue-50 rounded-lg">
								<Users className="w-5 h-5 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-emerald-200 shadow-sm">
					<CardContent className="p-6">
						<div className="flex justify-between items-start">
							<div>
								<p className="text-sm font-medium text-emerald-600 mb-1">Siap Berangkat</p>
								<h3 className="text-3xl font-bold text-emerald-700">{data.kpi.readyToDepart}</h3>
							</div>
							<div className="p-3 bg-emerald-50 rounded-lg">
								<PlaneTakeoff className="w-5 h-5 text-emerald-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-amber-200 shadow-sm">
					<CardContent className="p-6">
						<div className="flex justify-between items-start">
							<div>
								<p className="text-sm font-medium text-amber-600 mb-1">Sedang Proses</p>
								<h3 className="text-3xl font-bold text-amber-700">{data.kpi.processing}</h3>
							</div>
							<div className="p-3 bg-amber-50 rounded-lg">
								<Clock className="w-5 h-5 text-amber-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-white border-rose-200 shadow-sm">
					<CardContent className="p-6">
						<div className="flex justify-between items-start">
							<div>
								<p className="text-sm font-medium text-rose-600 mb-1">Perlu Tindakan</p>
								<h3 className="text-3xl font-bold text-rose-700">{data.kpi.actionNeeded}</h3>
							</div>
							<div className="p-3 bg-rose-50 rounded-lg">
								<AlertTriangle className="w-5 h-5 text-rose-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<CardTitle className="text-slate-800 text-lg">Daftar Kesiapan Dokumen Mahasiswa</CardTitle>
						<div className="relative w-full md:w-72">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input 
								placeholder="Cari NIM atau Nama..." 
								className="pl-9 bg-white"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader className="bg-slate-50">
							<TableRow>
								<TableHead className="font-semibold text-slate-600">NIM / Nama</TableHead>
								<TableHead className="font-semibold text-slate-600">Program</TableHead>
								<TableHead className="font-semibold text-slate-600">Tujuan</TableHead>
								<TableHead className="font-semibold text-slate-600">Progres Dokumen</TableHead>
								<TableHead className="font-semibold text-slate-600">Status</TableHead>
								<TableHead className="text-right font-semibold text-slate-600">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredStudents.length > 0 ? (
								filteredStudents.map((s) => (
									<TableRow key={s.id} className="hover:bg-slate-50/50">
										<TableCell>
											<div className="font-medium text-slate-900">{s.name}</div>
											<div className="text-xs text-slate-500">{s.nim}</div>
										</TableCell>
										<TableCell className="text-slate-600">{s.program}</TableCell>
										<TableCell className="text-slate-600">{s.destinationCity || "-"}</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-slate-700">{s.completedDocs}/8</span>
												<div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
													<div 
														className={`h-full rounded-full ${s.completedDocs === 8 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
														style={{ width: `${(s.completedDocs / 8) * 100}%` }}
													/>
												</div>
											</div>
										</TableCell>
										<TableCell>
											{renderStatusBadge(s.status)}
										</TableCell>
										<TableCell className="text-right">
											<Button 
												variant="ghost" 
												size="sm"
												className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
												onClick={() => router.push(`/dashboard/students/${s.id}#panel-magang`)}
											>
												Detail <ArrowRight className="w-4 h-4 ml-1" />
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} className="h-32 text-center text-slate-500">
										Tidak ada mahasiswa ditemukan.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
