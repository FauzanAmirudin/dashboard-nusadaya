"use client";

import { BookOpen, CalendarDays, Clock, Megaphone } from "lucide-react";
import { TabJadwalKelas } from "@/components/panels/penjadwalan/TabJadwalKelas";
import { TabJadwalPiket } from "@/components/panels/penjadwalan/TabJadwalPiket";
import { TabJadwalPraktikum } from "@/components/panels/penjadwalan/TabJadwalPraktikum";
import { TabPengumuman } from "@/components/panels/penjadwalan/TabPengumuman";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store";

export function PenjadwalanDashboard() {
	const { user } = useAuthStore();
	const canEdit = user?.role === "superadmin" || user?.role === "akademik";

	return (
		<div className="space-y-6">
			{/* Executive Header Banner */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
				<div className="flex items-center gap-3.5">
					<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center shadow-2xs ring-4 ring-blue-50 shrink-0">
						<CalendarDays className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
								Penjadwalan & Pengumuman
							</h1>
							<Badge
								variant="secondary"
								className="bg-blue-50 text-[#0517B0] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200/60"
							>
								Panel Akademik
							</Badge>
						</div>
						<p className="text-xs text-slate-500 mt-0.5">
							Pusat tata kelola jadwal kelas, praktikum, piket harian mahasiswa,
							dan siaran pengumuman
						</p>
					</div>
				</div>
			</div>

			{/* Subtab Segmented Navigation */}
			<Tabs defaultValue="kelas" className="w-full space-y-6">
				<TabsList className="w-full bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
					<TabsTrigger
						value="kelas"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						<BookOpen className="w-4 h-4 shrink-0" />
						<span>Jadwal Kelas</span>
					</TabsTrigger>
					<TabsTrigger
						value="praktikum"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						<Clock className="w-4 h-4 shrink-0" />
						<span>Jadwal Praktikum</span>
					</TabsTrigger>
					<TabsTrigger
						value="piket"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						<CalendarDays className="w-4 h-4 shrink-0" />
						<span>Jadwal Piket</span>
					</TabsTrigger>
					<TabsTrigger
						value="pengumuman"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-xs rounded-xl py-2.5 px-3 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer"
					>
						<Megaphone className="w-4 h-4 shrink-0" />
						<span>Pengumuman</span>
					</TabsTrigger>
				</TabsList>

				<div>
					<TabsContent
						value="kelas"
						className="animate-in fade-in-50 duration-200"
					>
						<TabJadwalKelas canEdit={canEdit} />
					</TabsContent>
					<TabsContent
						value="praktikum"
						className="animate-in fade-in-50 duration-200"
					>
						<TabJadwalPraktikum canEdit={canEdit} />
					</TabsContent>
					<TabsContent
						value="piket"
						className="animate-in fade-in-50 duration-200"
					>
						<TabJadwalPiket canEdit={canEdit} />
					</TabsContent>
					<TabsContent
						value="pengumuman"
						className="animate-in fade-in-50 duration-200"
					>
						<TabPengumuman canEdit={canEdit} user={user} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
