"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";

interface PanelSummary {
	id: string;
	name: string;
	completed: number;
	total: number;
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
}

interface IncompleteIndicator {
	panel: string;
	name: string;
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	link: string;
}

interface StatusData {
	overallStatus: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	totalCompleted: number;
	totalIndicators: number;
	panels: PanelSummary[];
	incompleteIndicators: IncompleteIndicator[];
}

export function StatusPanel({ studentId, onNavigate }: { studentId: number; onNavigate?: (tab: string) => void }) {
	const [data, setData] = useState<StatusData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const fetchStatus = async () => {
		setIsLoading(true);
		const res = await api.students[studentId.toString()].status.get();
		if (res.data?.success && res.data.data) {
			setData(res.data.data as StatusData);
			setLastUpdated(new Date());
		}
		setIsLoading(false);
	};

	useEffect(() => {
		fetchStatus();
		const interval = setInterval(fetchStatus, 30000); // Polling setiap 30 detik
		return () => clearInterval(interval);
	}, [studentId]);

	if (isLoading && !data) {
		return <div className="p-8 text-center text-slate-500">Mengkalkulasi status keseluruhan...</div>;
	}

	if (!data) return null;

	const statusConfig = {
		AMAN: {
			bg: "bg-emerald-50",
			border: "border-emerald-200",
			text: "text-emerald-700",
			icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
			label: "AMAN & SIAP LANJUT",
			desc: "Seluruh proses telah terselesaikan tanpa kendala.",
		},
		PERLU_PERHATIAN: {
			bg: "bg-amber-50",
			border: "border-amber-200",
			text: "text-amber-700",
			icon: <Clock className="w-12 h-12 text-amber-500" />,
			label: "PERLU PERHATIAN",
			desc: "Masih ada proses yang tertunda atau sedang dikerjakan.",
		},
		TIDAK_AMAN: {
			bg: "bg-rose-50",
			border: "border-rose-200",
			text: "text-rose-700",
			icon: <ShieldAlert className="w-12 h-12 text-rose-500" />,
			label: "TIDAK AMAN (BLOCKING)",
			desc: "Ditemukan kendala kritis yang menghalangi kelanjutan proses.",
		},
	};

	const conf = statusConfig[data.overallStatus];

	return (
		<div className="space-y-6">
			{/* BANNER UTAMA */}
			<div className={`p-8 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all duration-500 ${conf.bg} ${conf.border}`}>
				<div className="mb-4">
					{conf.icon}
				</div>
				<h2 className={`text-3xl font-black tracking-tight mb-2 ${conf.text}`}>
					{conf.label}
				</h2>
				<p className="text-slate-600 font-medium mb-6">
					{conf.desc}
				</p>
				<div className="w-full max-w-md bg-white/60 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
					<div className="flex justify-between items-center text-sm">
						<span className="font-semibold text-slate-700">Total Progress</span>
						<span className="font-bold text-[#0517B0]">{data.totalCompleted} / {data.totalIndicators}</span>
					</div>
					<Progress 
						value={data.totalIndicators > 0 ? (data.totalCompleted / data.totalIndicators) * 100 : 0} 
						className="h-2.5 bg-slate-200" 
						indicatorClassName="bg-[#0517B0]"
					/>
				</div>
				{lastUpdated && (
					<p className="text-xs text-slate-400 mt-6">
						Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
					</p>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* TABEL RINGKASAN PANEL */}
				<Card className="border-slate-200 shadow-sm">
					<CardHeader className="border-b border-slate-100 pb-4">
						<CardTitle className="text-slate-800 text-base">Ringkasan per Modul</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader className="bg-slate-50/50">
								<TableRow>
									<TableHead className="font-semibold text-slate-600">Modul</TableHead>
									<TableHead className="text-center font-semibold text-slate-600">Selesai</TableHead>
									<TableHead className="font-semibold text-slate-600">Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.panels.map((p) => (
									<TableRow key={p.id} className={p.status === 'TIDAK_AMAN' ? 'bg-rose-50/30' : p.status === 'PERLU_PERHATIAN' ? 'bg-amber-50/30' : ''}>
										<TableCell className="font-medium text-slate-700">{p.name}</TableCell>
										<TableCell className="text-center text-slate-600">
											{p.completed} / {p.total}
										</TableCell>
										<TableCell>
											{p.status === "AMAN" && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Aman</Badge>}
											{p.status === "PERLU_PERHATIAN" && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Proses</Badge>}
											{p.status === "TIDAK_AMAN" && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">Kendala</Badge>}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* LIST INDIKATOR BELUM SELESAI */}
				<Card className="border-slate-200 shadow-sm flex flex-col">
					<CardHeader className="border-b border-slate-100 pb-4">
						<CardTitle className="text-slate-800 text-base flex items-center justify-between">
							<span>Tindakan Diperlukan</span>
							<Badge variant="outline" className="text-slate-500 font-normal">{data.incompleteIndicators.length} Item</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0 flex-1 bg-slate-50/30 max-h-[400px] overflow-y-auto">
						{data.incompleteIndicators.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
								<CheckCircle2 className="w-12 h-12 mb-3 text-slate-300" />
								<p>Semua tindakan telah diselesaikan.</p>
							</div>
						) : (
							<div className="divide-y divide-slate-100">
								{data.incompleteIndicators.map((ind, i) => (
									<div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
										<div className="flex items-start gap-3">
											{ind.status === 'TIDAK_AMAN' ? (
												<AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
											) : (
												<Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
											)}
											<div>
												<p className="text-sm font-semibold text-slate-800">{ind.name}</p>
												<p className="text-xs text-slate-500 mt-0.5">Modul: {ind.panel}</p>
											</div>
										</div>
										{onNavigate && (
											<button 
												onClick={() => onNavigate(ind.link)}
												className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
											>
												Perbarui <ChevronRight className="w-3 h-3" />
											</button>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
