"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TabMataKuliah } from "@/components/panels/kehadiran/detail/TabMataKuliah";
import { TabODS } from "@/components/panels/kehadiran/detail/TabODS";
import { TabPiket } from "@/components/panels/kehadiran/detail/TabPiket";
import { TabPramagang } from "@/components/panels/kehadiran/detail/TabPramagang";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
	studentId: number;
}

type SubTab = "mata-kuliah" | "piket" | "ods" | "pramagang";

const SUB_TABS: { id: SubTab; label: string }[] = [
	{ id: "mata-kuliah", label: "Mata Kuliah" },
	{ id: "piket", label: "Piket" },
	{ id: "ods", label: "ODS" },
	{ id: "pramagang", label: "Pra-Magang" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TabKehadiran({ studentId }: Props) {
	const [subTab, setSubTab] = useState<SubTab>("mata-kuliah");

	return (
		<div className="space-y-4">
			{/* Sub-tab navigation */}
			<div className="flex gap-2 overflow-x-auto pb-1">
				{SUB_TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setSubTab(t.id)}
						className={cn(
							"px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150",
							subTab === t.id
								? "bg-[#0517B0] text-white shadow-sm"
								: "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
						)}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* Sub-tab content — reuse komponen kehadiran yang sudah ada */}
			{subTab === "mata-kuliah" && (
				<TabMataKuliah studentId={studentId} />
			)}
			{subTab === "piket" && <TabPiket studentId={studentId} />}
			{subTab === "ods" && <TabODS studentId={studentId} />}
			{subTab === "pramagang" && <TabPramagang studentId={studentId} />}
		</div>
	);
}
