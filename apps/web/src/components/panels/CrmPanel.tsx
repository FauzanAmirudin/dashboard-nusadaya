"use client";

import {
	BookOpen,
	Briefcase,
	CalendarDays,
	CheckCircle,
	CheckCircle2,
	Clock,
	CreditCard,
	Loader2,
	PhoneCall,
	Search,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AccPanelStatusCard } from "@/components/ui/AccPanelStatusCard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { formatDeviceDateTime } from "@/utils/format";
import { calculateCrmChecklist, updateCrmField } from "@/utils/panel-logic";
import { TabHafalan } from "./crm/TabHafalan";
import { TabKehadiran } from "./crm/TabKehadiran";
import { TabMonitoring } from "./crm/TabMonitoring";
import { TabOds } from "./crm/TabOds";
import { TabPraMagang } from "./crm/TabPraMagang";
import { TabRegistrasiAwal } from "./crm/TabRegistrasiAwal";

interface CrmPanelProps {
	studentId: number;
	onUpdate: () => void;
	onProgressChange?: (completed: number, total: number) => void;
}

export function CrmPanel({
	studentId,
	onUpdate,
	onProgressChange,
}: CrmPanelProps) {
	const { user, token } = useAuthStore();
	const isCrmAdmin = hasRole(user, "crm", "superadmin");
	const canEdit = isCrmAdmin;

	const [crmState, setCrmState] = useState<{
		crm: any;
		logs: any[];
		finance?: any;
		pmb?: any;
		pa?: any;
		hafalanSessions?: any[];
		vocabLogs?: any[];
	} | null>(null);

	const [paState, setPaState] = useState<{
		data?: any;
		pa?: any;
		vocabLogs?: any[];
		hafalanSessions?: any[];
	} | null>(null);

	const [kehadiranState, setKehadiranState] = useState<{
		academic: any;
		courses: any[];
		crm: any;
	} | null>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [isAccSaving, setIsAccSaving] = useState(false);

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const handleUpdateCrmField = useCallback((field: string, value: any) => {
		setCrmState((prev: any) => updateCrmField(prev, field, value));
	}, []);

	const fetchCrmData = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm?_t=${Date.now()}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Cache-Control": "no-cache",
					},
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success && json.data) {
					setCrmState(json.data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch CRM data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchPaData = async () => {
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/pa`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success && json.data) {
					setPaState({
						data: json.data.data,
						pa: json.data.data,
						vocabLogs: json.data.vocabLogs || [],
						hafalanSessions: json.data.hafalanSessions || [],
					});
				}
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

	const crm = crmState?.crm;
	const { completedCount, totalChecks, isAllChecksDone } =
		calculateCrmChecklist(crm);

	const onProgressChangeRef = useRef(onProgressChange);
	useEffect(() => {
		onProgressChangeRef.current = onProgressChange;
	}, [onProgressChange]);

	const lastProgressRef = useRef<{ completed: number; total: number } | null>(
		null,
	);

	useEffect(() => {
		if (crmState?.crm) {
			if (
				lastProgressRef.current?.completed === completedCount &&
				lastProgressRef.current?.total === totalChecks
			) {
				return;
			}
			lastProgressRef.current = {
				completed: completedCount,
				total: totalChecks,
			};
			onProgressChangeRef.current?.(completedCount, totalChecks);
			if (typeof window !== "undefined") {
				window.dispatchEvent(
					new CustomEvent("crm-progress-sync", {
						detail: {
							studentId,
							completed: completedCount,
							total: totalChecks,
						},
					}),
				);
			}
		}
	}, [completedCount, totalChecks, studentId, Boolean(crmState?.crm)]);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-48 text-slate-400">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	const handleAcc = async () => {
		setIsAccSaving(true);
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/crm/acc`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok && data.success) {
				toast.success("Panel CRM berhasil disetujui (ACC)!");
				await fetchCrmData();
				onUpdate();
			} else {
				toast.error(data.message || "Gagal memberikan ACC CRM");
			}
		} catch (err: any) {
			toast.error(
				err?.message || "Terjadi kesalahan sistem saat memberikan ACC CRM",
			);
		} finally {
			setIsAccSaving(false);
		}
	};

	const handleCancelAcc = async () => {
		setIsAccSaving(true);
		try {
			let res = await fetch(`${API_URL}/students/${studentId}/crm/acc`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			let data = await res.json().catch(() => ({}));
			if (!res.ok) {
				res = await fetch(`${API_URL}/students/${studentId}/crm/cancel-acc`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				data = await res.json().catch(() => ({}));
			}
			if (res.ok && data.success) {
				toast.success("Status ACC CRM berhasil dibatalkan");
				await fetchCrmData();
				onUpdate();
			} else {
				toast.error(data.message || "Gagal membatalkan ACC CRM");
			}
		} catch (err: any) {
			toast.error(
				err?.message || "Terjadi kesalahan sistem saat membatalkan ACC CRM",
			);
		} finally {
			setIsAccSaving(false);
		}
	};

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<PanelHeader
					icon={<PhoneCall className="w-5 h-5 text-[#0517B0]" />}
					title="CRM — Customer Relationship Management"
					subtitle="Dikelola oleh: Admin CRM & Superadmin"
					progressTag={
						<span className="text-xs font-bold text-slate-700 bg-slate-200/70 px-2.5 py-0.5 rounded-full border border-slate-300/40">
							Progres: {completedCount}/{totalChecks}
						</span>
					}
					badge={
						<PanelStatusBadge
							isAcc={crm?.isAcc}
							completed={completedCount}
							total={totalChecks}
							size="lg"
						/>
					}
				/>

				<Tabs defaultValue="registrasi-awal" className="w-full">
					<TabsList className="mb-6 grid w-full grid-cols-6 bg-slate-100 p-1 rounded-lg">
						<TabsTrigger
							value="registrasi-awal"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<CreditCard className="w-4 h-4" /> Registrasi Awal
						</TabsTrigger>
						<TabsTrigger
							value="hafalan"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<BookOpen className="w-4 h-4" /> Hafalan
						</TabsTrigger>
						<TabsTrigger
							value="kehadiran"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<CalendarDays className="w-4 h-4" /> Kehadiran
						</TabsTrigger>
						<TabsTrigger
							value="ods"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<Zap className="w-4 h-4" /> ODS
						</TabsTrigger>
						<TabsTrigger
							value="pramagang"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<Briefcase className="w-4 h-4" /> Pra Magang
						</TabsTrigger>
						<TabsTrigger
							value="monitoring"
							className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
						>
							<Search className="w-4 h-4" /> Monitoring
						</TabsTrigger>
					</TabsList>

					<TabsContent value="registrasi-awal" className="space-y-6">
						<TabRegistrasiAwal
							studentId={studentId}
							crmState={crmState}
							canEdit={canEdit}
							onUpdate={fetchCrmData}
							API_URL={API_URL}
						/>
					</TabsContent>

					<TabsContent value="hafalan" className="space-y-6">
						<TabHafalan
							studentId={studentId}
							paData={paState?.data || paState?.pa || crmState?.pa}
							hafalanSessions={
								paState?.hafalanSessions && paState.hafalanSessions.length > 0
									? paState.hafalanSessions
									: crmState?.hafalanSessions || []
							}
							vocabLogs={
								paState?.vocabLogs && paState.vocabLogs.length > 0
									? paState.vocabLogs
									: crmState?.vocabLogs || []
							}
							crmState={crmState}
							canEdit={canEdit}
							fetchCrmData={fetchCrmData}
							fetchPaData={fetchPaData}
							onUpdate={onUpdate}
							onUpdateField={handleUpdateCrmField}
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
							onUpdateField={handleUpdateCrmField}
						/>
					</TabsContent>

					<TabsContent value="ods" className="space-y-6">
						<TabOds
							studentId={studentId}
							crmState={crmState}
							canEdit={canEdit}
							fetchCrmData={fetchCrmData}
							onUpdate={onUpdate}
							onUpdateField={handleUpdateCrmField}
						/>
					</TabsContent>

					<TabsContent value="pramagang" className="space-y-6">
						<TabPraMagang
							studentId={studentId}
							crmState={crmState}
							fetchCrmData={fetchCrmData}
							canEdit={canEdit}
							onUpdate={onUpdate}
							onUpdateField={handleUpdateCrmField}
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
							onUpdateField={handleUpdateCrmField}
						/>
					</TabsContent>
				</Tabs>

				{/* Status ACC Panel CRM Card (Persistent across all tabs) */}
				<AccPanelStatusCard
					isAcc={Boolean(crm?.isAcc)}
					accByUser={crm?.accBy?.fullName || "Admin CRM"}
					accAt={crm?.accAt}
					isReadyForAcc={isAllChecksDone}
					title="ACC Divisi CRM"
					pendingTitle={
						!isAllChecksDone
							? `Menunggu Kelengkapan Checklist (${totalChecks - completedCount} item belum selesai)`
							: "ACC Panel CRM (Customer Relationship Management)"
					}
					pendingDescription="Selesaikan semua 10 indikator monitoring CRM sebelum memberikan persetujuan ACC."
					readyDescription="Seluruh 10 checklist CRM telah lengkap. Anda dapat memberikan persetujuan ACC resmi sekarang."
					canEdit={canEdit}
					isSaving={isAccSaving}
					onAcc={handleAcc}
					onCancelAcc={handleCancelAcc}
					cancelDialogTitle="Konfirmasi Pembatalan ACC CRM"
					cancelDialogDescription="Apakah Anda yakin ingin membatalkan status ACC untuk panel CRM mahasiswa ini? Status CRM akan kembali ke tahap berproses."
					disabledReason="Harus menyelesaikan 10/10 checklist CRM sebelum ACC"
				/>
			</div>
		</TooltipProvider>
	);
}
