"use client";

import {
	AlertCircle,
	AlertTriangle,
	Award,
	Calendar,
	CheckCircle2,
	Clock,
	Info,
	Loader2,
	MapPin,
	ShieldAlert,
	ShieldCheck,
	UserCheck,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

interface MorningAssemblyRecord {
	id: number;
	sessionId: number;
	studentId: number;
	status: "hadir" | "terlambat" | "izin" | "sakit" | "alpha";
	arrivalTime: string | null;
	minutesLate: number | null;
	notes: string | null;
	recordedAt: string;
	session?: {
		id: number;
		sessionDate: string;
		targetTime: string;
		location: string;
		rombel: string;
		notes: string | null;
	};
	recorder?: {
		fullName: string | null;
	};
}

interface BarisPagiData {
	records: MorningAssemblyRecord[];
	summary: {
		total: number;
		tepatWaktu: number;
		terlambat: number;
		izin: number;
		sakit: number;
		alpha: number;
		complianceRate: number;
	};
}

export function TabBarisPagi({ studentId }: { studentId: number }) {
	const [data, setData] = useState<BarisPagiData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { user } = useAuthStore();

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const res = await (api as any).attendance.mahasiswa[studentId][
				"baris-pagi"
			].get();
			if (res.data?.success) {
				setData(res.data.data);
			} else {
				toast.error("Gagal memuat rekap baris pagi mahasiswa");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan memuat data baris pagi");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
				<Loader2 className="w-6 h-6 animate-spin text-[#0517B0]" />
				<span className="text-xs font-medium text-slate-500">
					Memuat kepatuhan baris pagi mingguan...
				</span>
			</div>
		);
	}

	const summary = data?.summary || {
		total: 0,
		tepatWaktu: 0,
		terlambat: 0,
		izin: 0,
		sakit: 0,
		alpha: 0,
		complianceRate: 100,
	};
	const records = data?.records || [];

	const getStatusBadge = (status: string, minutesLate?: number | null) => {
		switch (status) {
			case "hadir":
				return (
					<Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-semibold gap-1 text-[11px]">
						<CheckCircle2 className="w-3.5 h-3.5" />
						Tepat Waktu (≤ 06.22)
					</Badge>
				);
			case "terlambat":
				return (
					<Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 font-semibold gap-1 text-[11px]">
						<Clock className="w-3.5 h-3.5" />
						Terlambat {minutesLate ? `(+${minutesLate} mnt)` : ""}
					</Badge>
				);
			case "izin":
				return (
					<Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 font-semibold gap-1 text-[11px]">
						<Info className="w-3.5 h-3.5" />
						Izin
					</Badge>
				);
			case "sakit":
				return (
					<Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 font-semibold gap-1 text-[11px]">
						<AlertCircle className="w-3.5 h-3.5" />
						Sakit
					</Badge>
				);
			case "alpha":
				return (
					<Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 font-semibold gap-1 text-[11px]">
						<XCircle className="w-3.5 h-3.5" />
						Alpha
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="text-slate-500 text-[11px]">
						{status}
					</Badge>
				);
		}
	};

	let disciplineGrade = {
		label: "DISIPLIN TINGGI",
		color: "text-emerald-700 bg-emerald-50 border-emerald-200",
		icon: ShieldCheck,
		desc: "Kepatuhan kedatangan apel pagi sangat konsisten memenuhi standar jam 06.22.",
	};
	if (summary.total > 0) {
		if (summary.complianceRate < 70) {
			disciplineGrade = {
				label: "STATUS KRITIS",
				color: "text-rose-700 bg-rose-50 border-rose-200",
				icon: ShieldAlert,
				desc: "Tingkat keterlambatan / ketidakhadiran apel pagi melebihi ambang batas toleransi institusi (< 70%).",
			};
		} else if (summary.complianceRate < 85) {
			disciplineGrade = {
				label: "PERLU PEMBINAAN",
				color: "text-amber-700 bg-amber-50 border-amber-200",
				icon: AlertTriangle,
				desc: "Perlu bimbingan kedisiplinan dan pembinaan wali kelas/akademik (70% - 84%).",
			};
		}
	}

	const DisciplineIcon = disciplineGrade.icon;

	return (
		<div className="space-y-6">
			{/* Rule & Compliance Callout */}
			<div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-800/40 relative overflow-hidden">
				<div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
					<div className="space-y-1.5">
						<div className="flex items-center gap-2">
							<span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold tracking-wide border border-blue-400/30">
								STANDAR KEDISIPLINAN NUSADAYA
							</span>
							<span className="text-xs text-blue-300 font-mono">
								THRESHOLD: 06.22 WIB
							</span>
						</div>
						<h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
							<Award className="w-5 h-5 text-amber-400 shrink-0" />
							Kepatuhan Apel & Baris Pagi Mingguan
						</h3>
						<p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
							Standar batas kedatangan baris pagi ditetapkan tepat pukul{" "}
							<span className="text-amber-300 font-bold underline underline-offset-2">
								06.22 WIB
							</span>
							. Mahasiswa hadir setelah pukul 06.22 otomatis dicatat sebagai{" "}
							<span className="text-amber-300 font-bold">Terlambat</span>{" "}
							beserta hitungan menit keterlambatannya untuk evaluasi
							All-Service.
						</p>
					</div>

					<div
						className={cn(
							"px-4 py-2.5 rounded-xl border flex items-center gap-2.5 shrink-0 shadow-xs",
							disciplineGrade.color,
						)}
					>
						<DisciplineIcon className="w-5 h-5 shrink-0" />
						<div>
							<div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
								Status Kedisiplinan
							</div>
							<div className="text-xs font-black tracking-tight">
								{disciplineGrade.label}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* KPI Metric Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
					<CardContent className="p-4 space-y-2">
						<div className="flex items-center justify-between text-slate-500">
							<span className="text-xs font-medium">Total Sesi Diikuti</span>
							<Calendar className="w-4 h-4 text-slate-400" />
						</div>
						<div className="text-2xl font-black text-slate-900 tracking-tight">
							{summary.total}
						</div>
						<div className="text-[11px] text-slate-500">
							Sesi apel baris pagi
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
					<CardContent className="p-4 space-y-2">
						<div className="flex items-center justify-between text-emerald-600">
							<span className="text-xs font-medium">Tepat Waktu</span>
							<CheckCircle2 className="w-4 h-4 text-emerald-500" />
						</div>
						<div className="text-2xl font-black text-emerald-700 tracking-tight">
							{summary.tepatWaktu}
						</div>
						<div className="text-[11px] text-emerald-600 font-medium">
							Tiba ≤ 06.22 WIB
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
					<CardContent className="p-4 space-y-2">
						<div className="flex items-center justify-between text-amber-600">
							<span className="text-xs font-medium">Terlambat</span>
							<Clock className="w-4 h-4 text-amber-500" />
						</div>
						<div className="text-2xl font-black text-amber-700 tracking-tight">
							{summary.terlambat}
						</div>
						<div className="text-[11px] text-amber-600 font-medium">
							Tiba &gt; 06.22 WIB
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
					<CardContent className="p-4 space-y-2">
						<div className="flex items-center justify-between text-blue-600">
							<span className="text-xs font-medium">Izin / Sakit / Alpha</span>
							<UserCheck className="w-4 h-4 text-blue-500" />
						</div>
						<div className="text-2xl font-black text-slate-900 tracking-tight">
							{summary.izin + summary.sakit + summary.alpha}
						</div>
						<div className="text-[11px] text-slate-500">
							Izin: {summary.izin} | Sakit: {summary.sakit} | A: {summary.alpha}
						</div>
					</CardContent>
				</Card>

				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow col-span-2 lg:col-span-1">
					<CardContent className="p-4 space-y-2">
						<div className="flex items-center justify-between text-indigo-600">
							<span className="text-xs font-medium">Kepatuhan Kedatangan</span>
							<Award className="w-4 h-4 text-indigo-500" />
						</div>
						<div className="text-2xl font-black text-indigo-900 tracking-tight">
							{summary.complianceRate}%
						</div>
						<Progress
							value={summary.complianceRate}
							className="h-1.5 bg-slate-100"
						/>
					</CardContent>
				</Card>
			</div>

			{/* History Table Card */}
			<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
				<div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
					<div>
						<h4 className="text-sm sm:text-base font-bold text-slate-900">
							Riwayat Presensi Baris Pagi
						</h4>
						<p className="text-xs text-slate-500">
							Pencatatan sesi baris mingguan dengan jam kedatangan aktual
							mahasiswa
						</p>
					</div>
					<Badge variant="outline" className="text-xs font-mono">
						Total {records.length} Catatan
					</Badge>
				</div>

				{records.length === 0 ? (
					<div className="p-12 text-center space-y-3">
						<div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
							<Clock className="w-6 h-6" />
						</div>
						<div className="space-y-1">
							<h5 className="text-sm font-semibold text-slate-800">
								Belum Ada Riwayat Baris Pagi
							</h5>
							<p className="text-xs text-slate-500 max-w-md mx-auto">
								Mahasiswa ini belum memiliki riwayat presensi baris pagi.
								Presensi dapat diinput oleh staf akademik melalui menu Kepatuhan
								Baris Pagi.
							</p>
						</div>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
									<th className="py-3 px-4">Tanggal Sesi</th>
									<th className="py-3 px-4">Lokasi & Rombel</th>
									<th className="py-3 px-4">Target Waktu</th>
									<th className="py-3 px-4">Jam Kedatangan</th>
									<th className="py-3 px-4">Status & Disiplin</th>
									<th className="py-3 px-4">Catatan</th>
									<th className="py-3 px-4">Pencatat</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 font-normal">
								{records.map((rec) => {
									const isLate = rec.status === "terlambat";
									return (
										<tr
											key={rec.id}
											className={cn(
												"hover:bg-slate-50/60 transition-colors",
												isLate && "bg-amber-50/20",
											)}
										>
											<td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
													<span>
														{rec.session?.sessionDate || "Tidak tercatat"}
													</span>
												</div>
											</td>
											<td className="py-3 px-4 text-slate-600 whitespace-nowrap">
												<div className="flex items-center gap-1.5">
													<MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
													<span>
														{rec.session?.location || "Lapangan Utama"}
													</span>
													{rec.session?.rombel && (
														<Badge
															variant="secondary"
															className="text-[10px] font-mono px-1.5 py-0"
														>
															{rec.session.rombel}
														</Badge>
													)}
												</div>
											</td>
											<td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
												{rec.session?.targetTime || "06:22"} WIB
											</td>
											<td className="py-3 px-4 whitespace-nowrap">
												{rec.arrivalTime ? (
													<span
														className={cn(
															"font-mono font-bold text-xs px-2 py-0.5 rounded-md",
															isLate
																? "bg-amber-100 text-amber-800"
																: "bg-emerald-100 text-emerald-800",
														)}
													>
														{rec.arrivalTime} WIB
													</span>
												) : (
													<span className="text-slate-400 italic">
														- Tidak tercatat -
													</span>
												)}
											</td>
											<td className="py-3 px-4 whitespace-nowrap">
												{getStatusBadge(rec.status, rec.minutesLate)}
											</td>
											<td className="py-3 px-4 text-slate-600 max-w-xs truncate">
												{rec.notes || "-"}
											</td>
											<td className="py-3 px-4 text-slate-500 whitespace-nowrap">
												{rec.recorder?.fullName || "Petugas Staf"}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
