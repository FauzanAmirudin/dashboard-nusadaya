"use client";

import { ArrowLeft, BookMarked, BookOpen, ClipboardCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TabHafalan } from "@/components/panels/akademik/pa/tabs/TabHafalan";
import { TabKehadiran } from "@/components/panels/akademik/pa/tabs/TabKehadiran";
import { TabKonseling } from "@/components/panels/akademik/pa/tabs/TabKonseling";
import { Button } from "@/components/ui/button";
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

// ── Component ─────────────────────────────────────────────────────────────────

export function PAStudentDetailView({ paId, studentId }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useAuthStore();
	const [activeTab, setActiveTab] = useState<ActiveTab>("kehadiran");

	const studentName = searchParams.get("name") ?? "Mahasiswa";
	const studentNim = searchParams.get("nim") ?? "-";
	const studentProgram = searchParams.get("program") ?? "-";
	const studentCohort = searchParams.get("cohort") ?? "-";

	const canEdit =
		user?.role === "akademik" ||
		user?.role === "superadmin" ||
		user?.role === "pa";

	const initials = studentName
		.split(" ")
		.slice(0, 2)
		.map((n) => n[0])
		.join("")
		.toUpperCase();

	return (
		<div className="space-y-5 pb-12">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.push(`/dashboard/akademik/pa/${paId}`)}
					className="border-slate-200 text-slate-600 hover:bg-slate-50"
				>
					<ArrowLeft className="w-4 h-4 mr-1.5" />
					Kembali
				</Button>
				<div>
					<h1 className="text-xl font-bold text-slate-900">Detail Mahasiswa</h1>
					<p className="text-sm text-slate-500 mt-0.5">
						Panel Akademik — Manajemen PA
					</p>
				</div>
			</div>

			{/* Student Info Card */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="h-1.5 w-full" style={{ backgroundColor: "#0517B0" }} />
				<div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
					<div
						className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
						style={{ backgroundColor: "#0517B0" }}
					>
						{initials}
					</div>
					<div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2">
						<div>
							<p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
								Nama
							</p>
							<p className="text-sm font-semibold text-slate-800">
								{studentName}
							</p>
						</div>
						<div>
							<p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
								NIM
							</p>
							<p className="text-sm text-slate-700">{studentNim || "-"}</p>
						</div>
						<div>
							<p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium mb-1">
								Peminatan
							</p>
							<PeminatanBadge peminatan={studentProgram} size="sm" />
						</div>
						<div>
							<p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
								Angkatan
							</p>
							<p className="text-sm text-slate-700">{studentCohort}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="flex gap-1 bg-slate-100/80 rounded-xl p-1 overflow-x-auto">
				{TABS.map((tab) => {
					const Icon = tab.icon;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 min-w-fit",
								activeTab === tab.id
									? "bg-white text-[#0517B0] shadow-sm border border-slate-200"
									: "text-slate-500 hover:text-slate-700 hover:bg-white/60",
							)}
						>
							<Icon className="w-4 h-4 shrink-0" />
							<span>{tab.label}</span>
						</button>
					);
				})}
			</div>

			{/* Tab Content */}
			<div>
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
