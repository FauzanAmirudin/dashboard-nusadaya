"use client";

import { Briefcase, CalendarDays, Compass, GraduationCap } from "lucide-react";
import { useState } from "react";
import { TabMataKuliah } from "@/components/panels/kehadiran/detail/TabMataKuliah";
import { TabODS } from "@/components/panels/kehadiran/detail/TabODS";
import { TabPiket } from "@/components/panels/kehadiran/detail/TabPiket";
import { TabPramagang } from "@/components/panels/kehadiran/detail/TabPramagang";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
	studentId: number;
}

type SubTab = "mata-kuliah" | "piket" | "ods" | "pramagang";

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
	{ id: "mata-kuliah", label: "Mata Kuliah", icon: GraduationCap },
	{ id: "piket", label: "Piket Harian", icon: CalendarDays },
	{ id: "ods", label: "ODS (One Day Service)", icon: Briefcase },
	{ id: "pramagang", label: "Pra-Magang", icon: Compass },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TabKehadiran({ studentId }: Props) {
	const [subTab, setSubTab] = useState<SubTab>("mata-kuliah");

	return (
		<div className="space-y-5">
			{/* Sub-tab navigation */}
			<div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 overflow-x-auto shadow-2xs">
				{SUB_TABS.map((t) => {
					const Icon = t.icon;
					const isActive = subTab === t.id;
					return (
						<button
							key={t.id}
							type="button"
							onClick={() => setSubTab(t.id)}
							className={cn(
								"flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer",
								isActive
									? "bg-white text-[#0517B0] shadow-xs ring-1 ring-black/5"
									: "text-slate-600 hover:text-slate-900 hover:bg-white/50",
							)}
						>
							<Icon
								className={cn(
									"w-3.5 h-3.5",
									isActive ? "text-[#0517B0]" : "text-slate-400",
								)}
							/>
							<span>{t.label}</span>
						</button>
					);
				})}
			</div>

			{/* Sub-tab content */}
			<div className="animate-in fade-in-50 duration-200">
				{subTab === "mata-kuliah" && <TabMataKuliah studentId={studentId} />}
				{subTab === "piket" && <TabPiket studentId={studentId} />}
				{subTab === "ods" && <TabODS studentId={studentId} />}
				{subTab === "pramagang" && <TabPramagang studentId={studentId} />}
			</div>
		</div>
	);
}
