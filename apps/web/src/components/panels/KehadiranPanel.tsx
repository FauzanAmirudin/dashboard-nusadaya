"use client";

import {
	BookOpen,
	Briefcase,
	CalendarDays,
	CheckSquare,
	Zap,
} from "lucide-react";
import { TabMataKuliah } from "@/components/panels/kehadiran/detail/TabMataKuliah";
import { TabODS } from "@/components/panels/kehadiran/detail/TabODS";
import { TabPiket } from "@/components/panels/kehadiran/detail/TabPiket";
import { TabPramagang } from "@/components/panels/kehadiran/detail/TabPramagang";
import { Badge } from "@/components/ui/badge";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KehadiranPanelProps {
	studentId: number;
}

export function KehadiranPanel({ studentId }: KehadiranPanelProps) {
	return (
		<div className="space-y-6">
			<PanelHeader
				icon={<CalendarDays className="w-5 h-5 text-[#0517B0]" />}
				title="Kehadiran — Absensi Sesi & Acara"
				subtitle="Dikelola oleh: Akademik"
			/>

			<Tabs defaultValue="mata-kuliah" className="w-full">
				<TabsList className="mb-6 grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
					<TabsTrigger
						value="mata-kuliah"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<BookOpen className="w-4 h-4" /> Mata Kuliah
					</TabsTrigger>
					<TabsTrigger
						value="piket"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<CheckSquare className="w-4 h-4" /> Piket
					</TabsTrigger>
					<TabsTrigger
						value="ods"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<Zap className="w-4 h-4" /> One Day Service
					</TabsTrigger>
					<TabsTrigger
						value="pramagang"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<Briefcase className="w-4 h-4" /> Pra Magang
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="mata-kuliah"
					className="animate-in fade-in duration-300"
				>
					<TabMataKuliah studentId={studentId} />
				</TabsContent>

				<TabsContent value="piket" className="animate-in fade-in duration-300">
					<TabPiket studentId={studentId} />
				</TabsContent>

				<TabsContent value="ods" className="animate-in fade-in duration-300">
					<TabODS studentId={studentId} />
				</TabsContent>

				<TabsContent
					value="pramagang"
					className="animate-in fade-in duration-300"
				>
					<TabPramagang studentId={studentId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
