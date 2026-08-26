"use client";

import {
	ArrowLeft,
	BookMarked,
	BookOpen,
	Calendar,
	ClipboardCheck,
	GraduationCap,
	User,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TabHafalan } from "@/components/panels/akademik/pa/tabs/TabHafalan";
import { TabKehadiran } from "@/components/panels/akademik/pa/tabs/TabKehadiran";
import { TabKonseling } from "@/components/panels/akademik/pa/tabs/TabKonseling";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
	paId: number;
	studentId: number;
}

type ActiveTab = "kehadiran" | "konseling" | "hafalan";

const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
	{ id: "kehadiran", label: "Monitoring Kehadiran", icon: ClipboardCheck },
	{ id: "konseling", label: "Konseling & Catatan", icon: BookOpen },
	{ id: "hafalan", label: "Setoran Hafalan", icon: BookMarked },
];

function getInitials(name: string): string {
	if (!name) return "M";
	const parts = name
		.replace(/^(Drs\.|Dr\.|Prof\.|Ir\.|H\.|Hj\.)\s+/i, "")
		.split(" ")
		.filter(Boolean);
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PAStudentDetailView({ paId, studentId }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuthStore();
	const [activeTab, setActiveTab] = useState<ActiveTab>("kehadiran");

	const studentName = searchParams.get("name") ?? "Mahasiswa";
	const studentNim = searchParams.get("nim") ?? "";
	const studentProgram = searchParams.get("program") ?? "-";
	const studentCohort = searchParams.get("cohort") ?? "-";

	const canEdit =
		user?.role === "akademik" ||
		user?.role === "superadmin" ||
		user?.role === "pa";

	const initials = getInitials(studentName);

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			{/* Breadcrumb & Navigation */}
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push(`/dashboard/akademik/pa/${paId}`)}
					className="h-8 px-2.5 text-xs text-slate-600 hover:text-[#0517B0] hover:bg-blue-50/80 gap-1.5 transition-colors"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					<span>Kembali ke Daftar Mahasiswa</span>
				</Button>
				<span className="text-slate-300">/</span>
				<span className="text-xs font-semibold text-slate-500 truncate max-w-xs">
					{studentName}
				</span>
			</div>

			{/* Student Hero Profile Card */}
			<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
				<CardContent className="p-5 sm:p-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
						<div className="flex items-center gap-4">
							<div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#0517B0] to-blue-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 shadow-sm ring-4 ring-blue-50">
								{initials}
							</div>
							<div className="space-y-1.5">
								<div className="flex flex-wrap items-center gap-2">
									<h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
										{studentName}
									</h1>
									{studentNim && (
										<Badge
											variant="outline"
											className="font-mono text-xs text-slate-600 bg-slate-50 border-slate-200"
										>
											NIM: {studentNim}
										</Badge>
									)}
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<PeminatanBadge
										peminatan={studentProgram}
										variant="subtle"
										size="sm"
									/>
									{studentCohort !== "-" && (
										<Badge
											variant="secondary"
											className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-lg"
										>
											Angkatan {studentCohort}
										</Badge>
									)}
								</div>
							</div>
						</div>

						{/* Quick Meta Badge */}
						<div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 self-stretch sm:self-auto justify-center sm:justify-start">
							<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
							<span className="font-medium text-slate-700">
								Status Aktif Bimbingan
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Main Segmented Tab Navigation */}
			<div className="bg-slate-100/90 p-1.5 rounded-2xl flex gap-1.5 overflow-x-auto shadow-2xs border border-slate-200/60">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 min-w-fit cursor-pointer",
								isActive
									? "bg-white text-[#0517B0] shadow-xs ring-1 ring-black/5"
									: "text-slate-600 hover:text-slate-900 hover:bg-white/50",
							)}
						>
							<Icon
								className={cn(
									"w-4 h-4 shrink-0 transition-colors",
									isActive ? "text-[#0517B0]" : "text-slate-400",
								)}
							/>
							<span>{tab.label}</span>
						</button>
					);
				})}
			</div>

			{/* Tab Content Container */}
			<div className="space-y-6">
				{activeTab === "kehadiran" && <TabKehadiran studentId={studentId} />}
				{activeTab === "konseling" && (
					<TabKonseling studentId={studentId} canEdit={canEdit} />
				)}
				{activeTab === "hafalan" && (
					<TabHafalan studentId={studentId} canEdit={canEdit} />
				)}
			</div>
		</div>
	);
}
