"use client";

import {
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Compass,
	ExternalLink,
	Loader2,
	PlayCircle,
	Sparkles,
	Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";

export function TabPramagang({ studentId }: { studentId: number }) {
	const [records, setRecords] = useState<any[]>([]);
	const [crmData, setCrmData] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const [pramagangRes, crmRes] = await Promise.all([
				(api as any).attendance.mahasiswa[studentId].pramagang.get(),
				api.students[studentId.toString()].crm.get(),
			]);

			if (pramagangRes.data?.success) {
				setRecords(pramagangRes.data.data);
			}
			if (crmRes.data?.success && (crmRes.data.data as any)?.crm) {
				setCrmData((crmRes.data.data as any).crm);
			}
		} catch (error) {
			console.error("Failed to fetch Pra-Magang data:", error);
			toast.error("Terjadi kesalahan mengambil data Pra-Magang");
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
					Memuat data Pra-Magang...
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Top Header Banner */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs gap-4">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0">
						<Compass className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="font-bold text-slate-900 text-sm sm:text-base">
								Program Pra-Magang
							</h3>
							<Badge
								variant="outline"
								className="bg-blue-50/70 text-[#0517B0] border-blue-200/80 text-[10px] font-semibold"
							>
								Divisi CRM
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							Monitoring kesiapan kerja industri dan riwayat sesi pra-magang
						</p>
					</div>
				</div>

				<Badge
					className={cn(
						"text-xs font-semibold px-3 py-1 rounded-xl shadow-2xs",
						crmData?.isPrammagangReport
							? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
							: "bg-slate-100 text-slate-600 border border-slate-200",
					)}
				>
					{crmData?.isPrammagangReport
						? "✓ Laporan Terverifikasi CRM"
						: "Laporan Belum Selesai"}
				</Badge>
			</div>

			{/* Informasi Industri & Pelaksanaan */}
			<div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
				<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
					Informasi Industri & Pelaksanaan
				</h4>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
					<div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
						<span className="text-slate-400 block text-[11px] font-medium">
							Mitra Industri / Perusahaan
						</span>
						<div className="flex items-center gap-2">
							<Building2 className="w-4 h-4 text-[#0517B0] shrink-0" />
							<span className="font-bold text-slate-800 text-sm truncate">
								{crmData?.pramagangIndustry || "Belum ditentukan"}
							</span>
						</div>
					</div>

					<div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
						<span className="text-slate-400 block text-[11px] font-medium">
							Masa Pra-Magang
						</span>
						<div className="flex items-center gap-2">
							<Calendar className="w-4 h-4 text-[#0517B0] shrink-0" />
							<span className="font-semibold text-slate-800 text-xs truncate">
								{crmData?.pramagangStartDate && crmData?.pramagangEndDate
									? `${crmData.pramagangStartDate} s/d ${crmData.pramagangEndDate}`
									: "Belum ditentukan"}
							</span>
						</div>
					</div>

					<div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
						<span className="text-slate-400 block text-[11px] font-medium">
							Video Dokumentasi
						</span>
						{crmData?.pramagangVideoLink ? (
							<a
								href={crmData.pramagangVideoLink}
								target="_blank"
								rel="noreferrer"
								className="font-semibold text-[#0517B0] hover:underline flex items-center gap-1.5 text-xs pt-0.5"
							>
								<PlayCircle className="w-4 h-4 text-[#0517B0]" />
								<span>Tonton Video Dokumentasi</span>
								<ExternalLink className="w-3 h-3 ml-0.5 text-slate-400" />
							</a>
						) : (
							<div className="flex items-center gap-1.5 text-slate-400 text-xs pt-0.5">
								<Video className="w-4 h-4" />
								<span>Belum ada link video</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Riwayat Absensi Pra-Magang */}
			<div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
				<div className="flex items-center gap-2">
					<Clock className="w-4 h-4 text-[#0517B0]" />
					<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
						Riwayat Catatan Presensi Pra-Magang ({records.length} Sesi Terdata)
					</h4>
				</div>

				{records.length === 0 ? (
					<div className="text-center py-10 text-slate-400 bg-slate-50/60 rounded-xl border border-slate-200/80">
						<Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
						<p className="text-xs font-medium text-slate-500">
							Belum ada riwayat presensi pra-magang yang diinput melalui Panel
							CRM.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-2.5">
						{records.map((r: any) => (
							<div
								key={r.id}
								className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors gap-3"
							>
								<div className="space-y-1">
									<div className="font-bold text-slate-800 text-xs">
										{new Date(r.date).toLocaleDateString("id-ID", {
											weekday: "long",
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</div>
									<p className="text-[11px] text-slate-500">
										Diinput oleh: {r.recorder?.fullName || "Divisi CRM"}
									</p>
									{r.notes && (
										<p className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 italic">
											Catatan: {r.notes}
										</p>
									)}
								</div>

								<Badge
									variant={
										r.status === "hadir"
											? "default"
											: r.status === "izin" || r.status === "sakit"
												? "secondary"
												: "destructive"
									}
									className={cn(
										"text-[10px] font-semibold px-2.5 py-0.5 rounded-md",
										r.status === "hadir" &&
											"bg-emerald-50 text-emerald-700 border border-emerald-200/80",
										(r.status === "izin" || r.status === "sakit") &&
											"bg-amber-50 text-amber-800 border border-amber-200/80",
										r.status === "alpa" &&
											"bg-rose-50 text-rose-700 border border-rose-200/80",
									)}
								>
									{(r.status || "HADIR").toUpperCase()}
								</Badge>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
