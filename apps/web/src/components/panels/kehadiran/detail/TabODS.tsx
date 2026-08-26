"use client";

import {
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	Info,
	Loader2,
	Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";

export function TabODS({ studentId }: { studentId: number }) {
	const [records, setRecords] = useState<any[]>([]);
	const [crmData, setCrmData] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const [odsRes, crmRes] = await Promise.all([
				(api as any).attendance.mahasiswa[studentId].ods.get(),
				api.students[studentId.toString()].crm.get(),
			]);

			if (odsRes.data?.success) {
				setRecords(odsRes.data.data);
			}
			if (crmRes.data?.success && (crmRes.data.data as any)?.crm) {
				setCrmData((crmRes.data.data as any).crm);
			}
		} catch (error) {
			console.error("Failed to fetch ODS data:", error);
			toast.error("Terjadi kesalahan mengambil data ODS");
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
					Memuat data One Day Service...
				</span>
			</div>
		);
	}

	let odsList: any[] = [];
	try {
		let parsed = crmData?.odsDetails;
		if (typeof parsed === "string") parsed = JSON.parse(parsed);
		if (Array.isArray(parsed)) odsList = parsed;
	} catch (e) {}

	const completedOdsCount = odsList.filter((item) => !!item.isDone).length;

	return (
		<div className="space-y-6">
			{/* Top Header Banner */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs gap-4">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0">
						<Sparkles className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="font-bold text-slate-900 text-sm sm:text-base">
								One Day Service (ODS)
							</h3>
							<Badge
								variant="outline"
								className="bg-blue-50/70 text-[#0517B0] border-blue-200/80 text-[10px] font-semibold"
							>
								Divisi CRM
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							{completedOdsCount} dari 5 Sesi ODS Telah Selesai Dijalani
						</p>
					</div>
				</div>

				<Badge
					className={cn(
						"text-xs font-semibold px-3 py-1 rounded-xl shadow-2xs",
						crmData?.isOdsReport
							? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
							: "bg-slate-100 text-slate-600 border border-slate-200",
					)}
				>
					{crmData?.isOdsReport
						? "✓ Laporan Terverifikasi CRM"
						: "Laporan Belum Selesai"}
				</Badge>
			</div>

			{/* 5 Tahap Pelaksanaan ODS */}
			<div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
						5 Tahap Pelaksanaan One Day Service
					</h4>
					<span className="text-xs font-semibold text-slate-500">
						Progress: {completedOdsCount}/5 Selesai
					</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
					{[1, 2, 3, 4, 5].map((num, idx) => {
						const item = odsList[idx] || {};
						const isDone = !!item.isDone;
						return (
							<div
								key={num}
								className={cn(
									"p-3.5 rounded-xl border text-xs space-y-2 transition-all shadow-2xs",
									isDone
										? "bg-emerald-50/50 border-emerald-200/80"
										: "bg-slate-50/70 border-slate-200/80",
								)}
							>
								<div className="flex justify-between items-center">
									<span className="font-bold text-slate-800 text-xs">
										ODS #{num}
									</span>
									{isDone ? (
										<Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 font-semibold">
											✓ Selesai
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="bg-white text-slate-400 text-[10px] px-1.5 py-0 h-4 border-slate-200"
										>
											Belum
										</Badge>
									)}
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-1.5 text-slate-700 min-w-0">
										<Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
										<span
											className="font-medium text-xs truncate"
											title={item.industry || "Tempat belum diisi"}
										>
											{item.industry || "Belum ditentukan"}
										</span>
									</div>
									<div className="flex items-center gap-1.5 text-[11px] text-slate-500">
										<Calendar className="w-3 h-3 text-slate-400 shrink-0" />
										<span>{item.date || "-"}</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Riwayat Absensi ODS */}
			<div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
				<div className="flex items-center gap-2">
					<Clock className="w-4 h-4 text-[#0517B0]" />
					<h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
						Riwayat Catatan Presensi ODS ({records.length} Sesi Terdata)
					</h4>
				</div>

				{records.length === 0 ? (
					<div className="text-center py-10 text-slate-400 bg-slate-50/60 rounded-xl border border-slate-200/80">
						<Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
						<p className="text-xs font-medium text-slate-500">
							Belum ada riwayat presensi ODS yang diinput melalui Panel CRM.
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
