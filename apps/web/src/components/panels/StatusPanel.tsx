"use client";

import {
	AlertCircle,
	CheckCircle2,
	ChevronRight,
	Clock,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/eden";
import { formatDeviceTime } from "@/utils/format";
import {
	normalizeStatus,
	PANEL_STATUS_CONFIG,
	type PanelStatusType,
} from "@/utils/status";

interface PanelSummary {
	id: string;
	name: string;
	completed: number;
	total: number;
	status: PanelStatusType | string;
	isAcc?: boolean;
}

interface IncompleteIndicator {
	panel: string;
	name: string;
	status: PanelStatusType | string;
	link: string;
}

interface StatusData {
	overallStatus: PanelStatusType | string;
	totalCompleted: number;
	totalIndicators: number;
	panels: PanelSummary[];
	incompleteIndicators: IncompleteIndicator[];
}

export function StatusPanel({
	studentId,
	onNavigate,
}: {
	studentId: number;
	onNavigate?: (tab: string) => void;
}) {
	const [data, setData] = useState<StatusData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const fetchStatus = async () => {
		setIsLoading(true);
		const res = await api.students[studentId.toString()].progress.get();
		if (res.data?.success && res.data.data) {
			setData(res.data.data as unknown as StatusData);
			setLastUpdated(new Date());
		}
		setIsLoading(false);
	};

	useEffect(() => {
		fetchStatus();
	}, [studentId]);

	if (isLoading && !data) {
		return (
			<div className="p-8 text-center text-slate-500">
				Mengkalkulasi status keseluruhan...
			</div>
		);
	}

	if (!data) return null;

	const normalizedOverall = normalizeStatus(data.overallStatus);

	const statusBannerConfig: Record<
		PanelStatusType,
		{
			bg: string;
			border: string;
			text: string;
			icon: React.ReactNode;
			label: string;
			desc: string;
		}
	> = {
		ACC: {
			bg: "bg-emerald-50/80",
			border: "border-emerald-300",
			text: "text-emerald-800",
			icon: <ShieldCheck className="w-12 h-12 text-emerald-600" />,
			label: "TELAH DI-ACC ADMIN (LENGKAP)",
			desc: "Seluruh tahapan proses dan dokumen telah disetujui penuh oleh admin panel.",
		},
		AMAN: {
			bg: "bg-green-50/80",
			border: "border-green-300",
			text: "text-green-800",
			icon: <CheckCircle2 className="w-12 h-12 text-green-600" />,
			label: "AMAN & SIAP LANJUT",
			desc: "Seluruh indikator selesai, siap untuk proses validasi ACC.",
		},
		PROSES: {
			bg: "bg-amber-50/80",
			border: "border-amber-300",
			text: "text-amber-800",
			icon: <Clock className="w-12 h-12 text-amber-600" />,
			label: "SEDANG BERPROSES",
			desc: "Mahasiswa sedang dalam proses pengerjaan dan perkembangan berjalan aktif.",
		},
		BUTUH_PERHATIAN: {
			bg: "bg-rose-50/80",
			border: "border-rose-300",
			text: "text-rose-800",
			icon: <ShieldAlert className="w-12 h-12 text-rose-600" />,
			label: "BUTUH PERHATIAN",
			desc: "Progres mahasiswa minim atau ada item krusial yang belum diselesaikan.",
		},
	};

	const conf = statusBannerConfig[normalizedOverall];

	return (
		<div className="space-y-6">
			{/* BANNER UTAMA */}
			<div
				className={`p-8 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all duration-500 ${conf.bg} ${conf.border}`}
			>
				<div className="mb-4">{conf.icon}</div>
				<h2
					className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${conf.text}`}
				>
					{conf.label}
				</h2>
				<p className="text-slate-600 font-medium text-xs sm:text-sm mb-6 max-w-lg">
					{conf.desc}
				</p>
				<div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2">
					<div className="flex justify-between items-center text-sm">
						<span className="font-semibold text-slate-700">
							Total Progres 7 Modul
						</span>
						<span className="font-bold text-[#0517B0]">
							{data.totalCompleted} / {data.totalIndicators} Item
						</span>
					</div>
					<Progress
						value={
							data.totalIndicators > 0
								? (data.totalCompleted / data.totalIndicators) * 100
								: 0
						}
						className="h-2.5 bg-slate-200"
						indicatorClassName="bg-[#0517B0]"
					/>
				</div>
				{lastUpdated && (
					<p className="text-xs text-slate-400 mt-6">
						Terakhir diperbarui: {formatDeviceTime(lastUpdated)}
					</p>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* TABEL RINGKASAN PANEL */}
				<Card className="bg-white border-slate-200 shadow-sm col-span-1 md:col-span-2">
					<CardHeader className="bg-slate-50/50 border-b border-slate-200">
						<CardTitle className="text-slate-800 text-lg">
							Ringkasan per Modul
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader className="bg-slate-50">
								<TableRow>
									<TableHead className="font-semibold text-slate-600">
										Modul
									</TableHead>
									<TableHead className="font-semibold text-slate-600 text-center">
										Selesai
									</TableHead>
									<TableHead className="font-semibold text-slate-600 text-center">
										Kondisi Status
									</TableHead>
									<TableHead className="font-semibold text-slate-600 text-center">
										Stamp ACC
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.panels.map((panel) => {
									const isAcc = Boolean(panel.isAcc);
									const currentStatus = isAcc
										? "ACC"
										: normalizeStatus(panel.status);

									return (
										<TableRow key={panel.id} className="hover:bg-slate-50/50">
											<TableCell className="font-medium text-slate-700">
												{panel.name}
											</TableCell>
											<TableCell className="text-center text-slate-600">
												<span className="font-semibold text-slate-700">
													{panel.completed}
												</span>
												<span className="text-slate-400"> / {panel.total}</span>
											</TableCell>
											<TableCell className="text-center">
												<PanelStatusBadge status={currentStatus} size="sm" />
											</TableCell>
											<TableCell className="text-center">
												{isAcc ? (
													<Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 gap-1 font-semibold text-xs">
														<ShieldCheck className="w-3 h-3 text-emerald-600" />
														ACC
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="bg-slate-50 text-slate-500 border border-slate-200 text-xs"
													>
														Belum
													</Badge>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* LIST INDIKATOR BELUM SELESAI */}
				<Card className="border-slate-200 shadow-sm flex flex-col col-span-1 md:col-span-2">
					<CardHeader className="border-b border-slate-100 pb-4">
						<CardTitle className="text-slate-800 text-base flex items-center justify-between">
							<span>Tindakan Diperlukan</span>
							<Badge variant="outline" className="text-slate-500 font-normal">
								{data.incompleteIndicators.length} Item
							</Badge>
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
								{data.incompleteIndicators.map((ind) => {
									const indStatus = normalizeStatus(ind.status);
									return (
										<div
											key={`${ind.panel}-${ind.name}`}
											className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
										>
											<div className="flex items-start gap-3">
												{indStatus === "BUTUH_PERHATIAN" ? (
													<AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
												) : (
													<Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
												)}
												<div>
													<p className="text-sm font-semibold text-slate-800">
														{ind.name}
													</p>
													<p className="text-xs text-slate-500 mt-0.5">
														Modul: {ind.panel}
													</p>
												</div>
											</div>
											{onNavigate && (
												<button
													type="button"
													onClick={() => onNavigate(ind.link)}
													className="text-xs font-medium text-[#0517B0] bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
												>
													Perbarui <ChevronRight className="w-3 h-3" />
												</button>
											)}
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
