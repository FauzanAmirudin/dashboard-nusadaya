"use client";

import { CheckCircle2, ClipboardList, DollarSign, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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

	const completedCount = [
		pmbData?.formReceived,
		pmbData?.documentsComplete,
		pmbData?.dataInputted,
		pmbData?.initialFollowUp,
	].filter(Boolean).length;

	let statusBadge = (
		<Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (completedCount === 4) {
		statusBadge = (
			<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
				🟢 AMAN
			</Badge>
		);
	} else if (completedCount >= 2) {
		statusBadge = (
			<Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-[#0517B0]/10 rounded-lg text-[#0517B0]">
						<Users className="w-5 h-5" />
					</div>
					<div>
						<h3 className="font-bold text-slate-800 text-base">
							Panel PMB (Penerimaan Mahasiswa Baru)
						</h3>
						<p className="text-xs text-slate-500">
							Kelola checklist pendaftaran, skema biaya, penerima fee sharing,
							dan data tambahan mahasiswa
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-xs font-medium text-slate-500">
						Status PMB:
					</span>
					{statusBadge}
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
						Dokumen Mahasiswa
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
