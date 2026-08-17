"use client";

import { CheckCircle2, ClipboardList, DollarSign, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, getToken } from "@/lib/eden";
import { useAuthStore } from "@/store";

import { TabChecklist } from "./pmb/TabChecklist";
import { TabDataTambahan } from "./pmb/TabDataTambahan";
import { TabFeeSharing } from "./pmb/TabFeeSharing";
import { TabSkemaKeuangan } from "./pmb/TabSkemaKeuangan";

interface PmbPanelProps {
	studentId: number;
	pmbData: any;
	studentData?: {
		nim?: string | null;
		studentStatus?: string | null;
		paId?: number | null;
	};
	onUpdate: () => void;
}

interface DocFile {
	id: number;
	documentKey: string;
	fileName: string;
	fileUrl: string;
	isVerified: boolean;
	uploadedAt: string;
	uploadedByUser?: { fullName: string } | null;
	verifiedByUser?: { fullName: string } | null;
}

export function PmbPanel({
	studentId,
	pmbData,
	studentData,
	onUpdate,
}: PmbPanelProps) {
	const { user } = useAuthStore();
	const isPmbAdmin = user?.role === "pmb" || user?.role === "superadmin";
	const canEdit = isPmbAdmin;

	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [activeTab, setActiveTab] = useState("data-tambahan");

	const fetchDocuments = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/documents`,
				{
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					setDocuments(json.data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch PMB documents", error);
		}
	};

	useEffect(() => {
		fetchDocuments();
	}, [studentId]);

	const mainCompletedCount = [
		pmbData?.formReceived,
		pmbData?.documentsComplete,
		pmbData?.dataInputted,
		pmbData?.initialFollowUp,
	].filter(Boolean).length;

	const docsCompletedCount = [
		pmbData?.docKtp,
		pmbData?.docKk,
		pmbData?.docCv,
		pmbData?.docIjazah,
		pmbData?.docTranskrip,
		pmbData?.docPassportDepan,
		pmbData?.docPassportVisa,
		pmbData?.docSkbm,
		pmbData?.docMcu,
		pmbData?.docSertifikasiBahasa,
	].filter(Boolean).length;

	const totalCompleted14 = mainCompletedCount + docsCompletedCount;

	let statusBadge = (
		<Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (totalCompleted14 === 14) {
		statusBadge = (
			<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
				🟢 AMAN
			</Badge>
		);
	} else if (totalCompleted14 >= 7) {
		statusBadge = (
			<Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="border-b border-slate-200 pb-4 mb-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
							<span className="text-xl">👥</span> Panel PMB (Penerimaan
							Mahasiswa Baru)
							<span className="ml-2 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
								Progres: {totalCompleted14}/14 Checklist ({mainCompletedCount}/4
								Utama • {docsCompletedCount}/10 Dokumen)
							</span>
						</CardTitle>
						<p className="text-sm text-slate-500 mt-1">
							Dikelola oleh: Admin PMB
						</p>
					</div>
					<div className="flex items-center gap-3">
						{user?.role === "superadmin" && !isPmbAdmin && (
							<Badge
								variant="outline"
								className="text-slate-400 border-slate-300"
							>
								👁 Mode Lihat Saja
							</Badge>
						)}
						{statusBadge}
					</div>
				</div>
			</div>

			{/* Tabs Container */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full space-y-4"
			>
				<TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200 h-auto gap-1">
					<TabsTrigger
						value="data-tambahan"
						className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<ClipboardList className="w-4 h-4 text-rose-600" />
						Data Tambahan
					</TabsTrigger>
					<TabsTrigger
						value="checklist"
						className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<CheckCircle2 className="w-4 h-4 text-emerald-600" />
						<span>Dokumen Mahasiswa</span>
						<span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
							{totalCompleted14}/14
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="finance"
						className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<DollarSign className="w-4 h-4 text-indigo-600" />
						Skema Keuangan
					</TabsTrigger>
					<TabsTrigger
						value="fee-sharing"
						className="flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<Users className="w-4 h-4 text-amber-600" />
						Fee Sharing
					</TabsTrigger>
				</TabsList>

				<TabsContent value="checklist">
					<TabChecklist
						studentId={studentId}
						pmbData={pmbData}
						canEdit={canEdit}
						documents={documents}
						fetchDocuments={fetchDocuments}
						onUpdate={onUpdate}
					/>
				</TabsContent>

				<TabsContent value="finance">
					<TabSkemaKeuangan
						studentId={studentId}
						pmbData={pmbData}
						canEdit={canEdit}
						onUpdate={onUpdate}
					/>
				</TabsContent>

				<TabsContent value="fee-sharing">
					<TabFeeSharing
						studentId={studentId}
						canEdit={canEdit}
						onUpdate={onUpdate}
					/>
				</TabsContent>

				<TabsContent value="data-tambahan">
					<TabDataTambahan
						studentId={studentId}
						studentData={studentData ?? {}}
						pmbData={pmbData}
						canEdit={canEdit}
						onUpdate={onUpdate}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
