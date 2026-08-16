"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { TabHafalan } from "./crm/TabHafalan";
import { TabKehadiran } from "./crm/TabKehadiran";
import { TabMonitoring } from "./crm/TabMonitoring";
import { TabOds } from "./crm/TabOds";
import { TabPraMagang } from "./crm/TabPraMagang";
import { TabRegistrasiAwal } from "./crm/TabRegistrasiAwal";

interface CrmPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function CrmPanel({ studentId, onUpdate }: CrmPanelProps) {
	const { user, token } = useAuthStore();
	const isCrmAdmin = user?.role === "crm" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const canEdit = isCrmAdmin;

	const [crmState, setCrmState] = useState<{
		crm: any;
		logs: any[];
		finance?: any;
		pmb?: any;
	} | null>(null);

	const [paState, setPaState] = useState<{
		pa: any;
		vocabLogs: any[];
	} | null>(null);

	const [kehadiranState, setKehadiranState] = useState<{
		academic: any;
		courses: any[];
		crm: any;
	} | null>(null);

	const [isLoading, setIsLoading] = useState(true);

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const fetchCrmData = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].crm.get();
			if (!error && data?.success) {
				setCrmState(data.data as any);
			}
		} catch (error) {
			console.error("Failed to fetch CRM data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchPaData = async () => {
		try {
			const { data, error } = await api.students[studentId.toString()].pa.get();
			if (!error && data?.success) {
				setPaState(data.data as any);
			}
		} catch (error) {
			console.error("Failed to fetch PA data:", error);
		}
	};

	const fetchKehadiranData = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/kehadiran`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					setKehadiranState(json.data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch kehadiran data:", error);
		}
	};

	useEffect(() => {
		fetchCrmData();
		fetchPaData();
		fetchKehadiranData();
	}, [studentId, token]);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-48 text-slate-400">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	const crm = crmState?.crm;
	const completedCount = [
		crm?.isMonitoringParent,
		crm?.isMonitoringIndustry,
		crm?.isVocabComplete,
		crm?.practiceAttendance,
		crm?.isOdsReport,
		crm?.odsDocumentation,
		crm?.isPrammagangReport,
		crm?.isPrammagangDocumentation,
	].filter(Boolean).length;
	const totalChecks = 8;

	let statusBadge = (
		<Badge className="bg-rose-50 text-rose-600 border-rose-200">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (completedCount === totalChecks) {
		statusBadge = (
			<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
				🟢 AMAN
			</Badge>
		);
	} else if (completedCount >= 4) {
		statusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<div>
					<div className="border-b border-slate-200 pb-4 mb-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div>
								<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
									<span className="text-xl">📞</span> CRM — Customer Relationship Management
									<span className="ml-2 text-sm font-normal text-slate-500">
										[{completedCount}/{totalChecks}]
									</span>
								</CardTitle>
								<p className="text-sm text-slate-500 mt-1">
									Dikelola oleh: Admin CRM
								</p>
							</div>
							<div className="flex items-center gap-3">
								{isSuperadmin && !isCrmAdmin && (
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
				</div>

				<Tabs defaultValue="registrasi-awal" className="w-full">
					<TabsList className="mb-6 grid w-full grid-cols-6 bg-slate-100 p-1 rounded-lg">
						<TabsTrigger
							value="registrasi-awal"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<span>💳</span> Registrasi Awal
						</TabsTrigger>
						<TabsTrigger
							value="hafalan"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<span>📖</span> Hafalan
						</TabsTrigger>
						<TabsTrigger
							value="kehadiran"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<span>📋</span> Kehadiran
						</TabsTrigger>
						<TabsTrigger
							value="ods"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<span>⚡</span> ODS
						</TabsTrigger>
						<TabsTrigger
							value="pramagang"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<span>💼</span> Pra Magang
						</TabsTrigger>
						<TabsTrigger
							value="monitoring"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<span>🔍</span> Monitoring
						</TabsTrigger>
					</TabsList>

					<TabsContent value="registrasi-awal" className="space-y-6">
						<TabRegistrasiAwal crmState={crmState} API_URL={API_URL} />
					</TabsContent>

					<TabsContent value="hafalan" className="space-y-6">
						<TabHafalan
							studentId={studentId}
							paData={paState?.pa}
							vocabLogs={paState?.vocabLogs || []}
							crmState={crmState}
							canEdit={canEdit}
							fetchCrmData={fetchCrmData}
							onUpdate={onUpdate}
						/>
					</TabsContent>

					<TabsContent value="kehadiran" className="space-y-6">
						<TabKehadiran
							studentId={studentId}
							crmState={crmState}
							kehadiranState={kehadiranState}
							canEdit={canEdit}
							fetchCrmData={fetchCrmData}
							onUpdate={onUpdate}
						/>
					</TabsContent>

					<TabsContent value="ods" className="space-y-6">
						<TabOds
							studentId={studentId}
							crmState={crmState}
							canEdit={canEdit}
							fetchCrmData={fetchCrmData}
							onUpdate={onUpdate}
						/>
					</TabsContent>

					<TabsContent value="pramagang" className="space-y-6">
						<TabPraMagang
							studentId={studentId}
							crmState={crmState}
							fetchCrmData={fetchCrmData}
							canEdit={canEdit}
							onUpdate={onUpdate}
						/>
					</TabsContent>

					<TabsContent value="monitoring" className="space-y-6">
						<TabMonitoring
							studentId={studentId}
							crmState={crmState}
							fetchCrmData={fetchCrmData}
							canEdit={canEdit}
							API_URL={API_URL}
							token={token as string}
							onUpdate={onUpdate}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</TooltipProvider>
	);
}
