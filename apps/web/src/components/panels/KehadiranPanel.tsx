"use client";

import {
	Briefcase,
	CalendarDays,
	ClipboardCheck,
	Compass,
	GraduationCap,
} from "lucide-react";
import { TabMataKuliah } from "@/components/panels/kehadiran/detail/TabMataKuliah";
import { TabODS } from "@/components/panels/kehadiran/detail/TabODS";
import { TabPiket } from "@/components/panels/kehadiran/detail/TabPiket";
import { TabPramagang } from "@/components/panels/kehadiran/detail/TabPramagang";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KehadiranPanelProps {
	studentId: number;
}

export function KehadiranPanel({ studentId }: KehadiranPanelProps) {
	return (
		<div className="space-y-6">
			{/* Executive Header Banner */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
				<div className="flex items-center gap-3.5">
					<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center shadow-2xs ring-4 ring-blue-50 shrink-0">
						<ClipboardCheck className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
								Kehadiran & Absensi Sesi
							</h2>
							<Badge
								variant="secondary"
								className="bg-blue-50 text-[#0517B0] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200/60"
							>
								Panel Akademik
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							Monitoring presensi perkuliahan, piket harian, ODS, dan pra-magang
						</p>
					</div>
				</div>
			</div>

			{/* Subtab Segmented Navigation */}
			<Tabs defaultValue="mata-kuliah" className="w-full space-y-5">
				<TabsList className="w-full bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
					<TabsTrigger
						value="mata-kuliah"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						<GraduationCap className="w-4 h-4 shrink-0" />
						<span>Mata Kuliah</span>
					</TabsTrigger>
					<TabsTrigger
						value="piket"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						<CalendarDays className="w-4 h-4 shrink-0" />
						<span>Piket Harian</span>
					</TabsTrigger>
					<TabsTrigger
						value="ods"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						<Briefcase className="w-4 h-4 shrink-0" />
						<span>One Day Service</span>
					</TabsTrigger>
					<TabsTrigger
						value="pramagang"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						<Compass className="w-4 h-4 shrink-0" />
						<span>Pra-Magang</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="mata-kuliah"
					className="animate-in fade-in-50 duration-200"
				>
					<TabMataKuliah studentId={studentId} />
				</TabsContent>

				<TabsContent
					value="piket"
					className="animate-in fade-in-50 duration-200"
				>
					<TabPiket studentId={studentId} />
				</TabsContent>

				<TabsContent value="ods" className="animate-in fade-in-50 duration-200">
					<TabODS studentId={studentId} />
				</TabsContent>

				<TabsContent
					value="pramagang"
					className="animate-in fade-in-50 duration-200"
				>
					<TabPramagang studentId={studentId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
