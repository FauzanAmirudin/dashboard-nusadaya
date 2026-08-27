"use client";

import {
	BookMarked,
	Briefcase,
	CheckCircle,
	CheckCircle2,
	CheckSquare,
	Clock,
	HeartHandshake,
	Loader2,
	MessageCircle,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { API_URL, api, getToken } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { formatDeviceDateTime } from "@/utils/format";

import { TabChecklistPa } from "./pa/TabChecklistPa";
import { TabHafalan } from "./pa/TabHafalan";
import { TabInterview } from "./pa/TabInterview";
import { TabKonseling } from "./pa/TabKonseling";
import { TabTripartit } from "./pa/TabTripartit";
import type {
	CounselingFormState,
	CounselingLog,
	HafalanFormState,
	HafalanSession,
	InterviewFormState,
	InterviewLog,
	PaData,
	TripartiteFormState,
	TripartiteLog,
} from "./pa/types";

interface PaPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function PaPanel({ studentId, onUpdate }: PaPanelProps) {
	const { user } = useAuthStore();
	const isPa = hasRole(user, "pa", "akademik", "superadmin");
	const isSuperadmin = hasRole(user, "superadmin");

	const [paData, setPaData] = useState<PaData | null>(null);
	const [hafalanSessions, setHafalanSessions] = useState<HafalanSession[]>([]);
	const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
	const [tripartiteLogs, setTripartiteLogs] = useState<TripartiteLog[]>([]);
	const [interviewLogs, setInterviewLogs] = useState<InterviewLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [loadingItem, setLoadingItem] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState("checklist");

	const isCounselingDone = Boolean(paData?.counselingDone);
	const isMentalStable = Boolean(paData?.mentalStable);
	const isDisciplineGood = Boolean(paData?.disciplineGood);
	const completedCount = [
		isCounselingDone,
		isMentalStable,
		isDisciplineGood,
	].filter(Boolean).length;
	const isAllChecksDone = completedCount === 3;

	// Role PA, Akademik, and Superadmin have full CRUD permissions to manage hafalan, counseling, tripartite, interview, etc.
	const canEdit = isPa;

	const fetchPaData = async () => {
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/pa`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			const d = json.data;
			if (d) {
				setPaData(d.data as unknown as PaData);
				setHafalanSessions(d.hafalanSessions || []);
				setCounselingLogs(d.counselingLogs || []);
				setTripartiteLogs(d.tripartiteLogs || []);
				setInterviewLogs(d.interviewLogs || []);
			}
		} catch (err) {
			console.error("Gagal memuat data PA:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchPaData();
	}, [studentId]);

	// Checklist Change Handler
	const handleChecklistChange = async (field: string, value: boolean) => {
		if (!canEdit) return;
		setLoadingItem(field);
		await api.students[studentId.toString()].pa.patch({ [field]: value });
		await fetchPaData();
		onUpdate();
		setLoadingItem(null);
	};

	// Save Discipline Notes
	const handleSaveNotes = async (notes: string) => {
		setIsSaving(true);
		await api.students[studentId.toString()].pa.patch({
			disciplineNotes: notes,
		});
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	// Hafalan Handlers (Kosakata & Kalimat)
	const handleAddHafalan = async (form: HafalanFormState) => {
		setIsSaving(true);
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/pa/hafalan`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${getToken()}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					language: form.language,
					languageCustom:
						form.language === "lainnya" ? form.languageCustom.trim() : null,
					vocabCount: Number(form.vocabCount) || 0,
					sentenceCount: Number(form.sentenceCount) || 0,
					vocabList: form.vocabList || [],
					sentenceList: form.sentenceList || [],
					notes: form.notes ? form.notes.trim() : null,
					date: form.date
						? new Date(form.date).toISOString()
						: new Date().toISOString(),
				}),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Setoran hafalan berhasil disimpan");
			await fetchPaData();
			onUpdate();
		} catch {
			toast.error("Gagal menyimpan setoran hafalan");
		} finally {
			setIsSaving(false);
		}
	};

	const handleEditHafalan = async (logId: number, form: HafalanFormState) => {
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/hafalan/${logId}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						language: form.language,
						languageCustom:
							form.language === "lainnya" ? form.languageCustom.trim() : null,
						vocabCount: Number(form.vocabCount) || 0,
						sentenceCount: Number(form.sentenceCount) || 0,
						vocabList: form.vocabList || [],
						sentenceList: form.sentenceList || [],
						notes: form.notes ? form.notes.trim() : null,
						date: form.date ? new Date(form.date).toISOString() : undefined,
					}),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Setoran hafalan berhasil diperbarui");
			await fetchPaData();
			onUpdate();
		} catch {
			toast.error("Gagal memperbarui setoran hafalan");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteHafalan = async (logId: number) => {
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/hafalan/${logId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Setoran hafalan berhasil dihapus");
			await fetchPaData();
			onUpdate();
		} catch {
			toast.error("Gagal menghapus setoran hafalan");
		} finally {
			setIsSaving(false);
		}
	};

	// Counseling Handlers
	const handleAddCounseling = async (form: CounselingFormState) => {
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/counseling`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						type: form.type || "konseling",
						date: new Date(form.date).toISOString(),
						condition: form.condition,
						notes: form.notes,
					}),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Log konseling berhasil disimpan");
			await fetchPaData();
			onUpdate();
		} catch {
			toast.error("Gagal menyimpan log konseling");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteCounseling = async (logId: number) => {
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/counseling/${logId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Log konseling berhasil dihapus");
			await fetchPaData();
			onUpdate();
		} catch {
			toast.error("Gagal menghapus log konseling");
		} finally {
			setIsSaving(false);
		}
	};

	// Tripartite Handlers
	const handleAddTripartite = async (form: TripartiteFormState) => {
		setIsSaving(true);
		const { error } = await (
			api.students[studentId.toString()].pa as any
		).tripartite.post(form);

		if (error) {
			toast.error(error.value?.message || "Gagal menyimpan log tripartit");
		} else {
			toast.success("Log tripartit berhasil disimpan");
			await fetchPaData();
			onUpdate();
		}
		setIsSaving(false);
	};

	const handleDeleteTripartite = async (logId: number) => {
		setIsSaving(true);
		const { error } = await (
			api.students[studentId.toString()].pa as any
		).tripartite[logId.toString()].delete();
		if (error) {
			toast.error(error.value?.message || "Gagal menghapus log tripartit");
		} else {
			toast.success("Log tripartit berhasil dihapus");
			await fetchPaData();
			onUpdate();
		}
		setIsSaving(false);
	};

	// Interview Handlers
	const handleAddInterview = async (form: InterviewFormState) => {
		setIsSaving(true);
		const { error } = await (
			api.students[studentId.toString()].pa as any
		).interview.post(form);

		if (error) {
			toast.error(error.value?.message || "Gagal menyimpan log interview");
		} else {
			toast.success("Log interview berhasil disimpan");
			await fetchPaData();
			onUpdate();
		}
		setIsSaving(false);
	};

	const handleDeleteInterview = async (logId: number) => {
		setIsSaving(true);
		const { error } = await (
			api.students[studentId.toString()].pa as any
		).interview[logId.toString()].delete();
		if (error) {
			toast.error(error.value?.message || "Gagal menghapus log interview");
		} else {
			toast.success("Log interview berhasil dihapus");
			await fetchPaData();
			onUpdate();
		}
		setIsSaving(false);
	};

	// ACC Handlers
	const handleAcc = async () => {
		setIsSaving(true);
		await api.students[studentId.toString()].pa.acc.post();
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	const handleCancelAcc = async () => {
		setIsSaving(true);
		await api.students[studentId.toString()].pa.acc.delete();
		await fetchPaData();
		onUpdate();
		setIsSaving(false);
	};

	// Progress Calculations (Standard 3 PA Checklist Indicators)
	const totalVocab = hafalanSessions.reduce((acc, s) => acc + s.vocabCount, 0);
	const totalSentence = hafalanSessions.reduce(
		(acc, s) => acc + s.sentenceCount,
		0,
	);

	const completedChecklistCount = completedCount;
	const totalChecklistProgress = Math.round(
		(completedChecklistCount / 3) * 100,
	);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-20 text-slate-500">
				<Loader2 className="w-6 h-6 animate-spin mr-2" />
				Memuat data PA...
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PanelHeader
				icon={<HeartHandshake className="w-5 h-5 text-[#0517B0]" />}
				title="PA — Pendamping Akademik"
				subtitle="Dikelola oleh: Admin PA & Pendamping Akademik"
				progressTag={
					<span className="text-xs font-bold text-slate-700 bg-slate-200/70 px-2.5 py-0.5 rounded-full border border-slate-300/40">
						Progres: {completedChecklistCount}/3 Checklist Selesai ({totalVocab}{" "}
						Kosakata • {totalSentence} Kalimat • {counselingLogs.length} Sesi
						Konseling)
					</span>
				}
				actions={
					isSuperadmin && !isPa ? (
						<Badge
							variant="outline"
							className="text-slate-400 border-slate-300"
						>
							Mode Lihat Saja
						</Badge>
					) : undefined
				}
				badge={
					<PanelStatusBadge
						status={paData?.status}
						isAcc={paData?.isAcc}
						completed={completedChecklistCount}
						total={3}
						size="lg"
					/>
				}
			>
				<div className="flex items-center gap-4">
					<span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
						Total Progress:
					</span>
					<Progress
						value={totalChecklistProgress}
						className="h-2 flex-1 bg-slate-200/60"
						indicatorClassName={
							totalChecklistProgress === 100 ? "bg-emerald-500" : "bg-blue-600"
						}
					/>
					<span className="text-xs font-bold text-slate-700">
						{totalChecklistProgress}%
					</span>
				</div>
			</PanelHeader>

			{/* Tabs Container */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full space-y-4"
			>
				<TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 h-auto gap-1">
					<TabsTrigger
						value="checklist"
						className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
						<span>Checklist PA</span>
						<span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
							{completedChecklistCount}/3
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="hafalan"
						className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<BookMarked className="w-4 h-4 text-blue-600 shrink-0" />
						<span>Setoran Hafalan</span>
						<span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
							{totalVocab}k • {totalSentence}s
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="konseling"
						className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<MessageCircle className="w-4 h-4 text-amber-600 shrink-0" />
						<span>Log Konseling</span>
						<span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
							{counselingLogs.length}
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="tripartit"
						className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<Users className="w-4 h-4 text-indigo-600 shrink-0" />
						<span>Log Tripartit</span>
						<span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
							{tripartiteLogs.length}
						</span>
					</TabsTrigger>
					<TabsTrigger
						value="interview"
						className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm transition-all"
					>
						<Briefcase className="w-4 h-4 text-teal-600 shrink-0" />
						<span>Log Interview</span>
						<span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
							{interviewLogs.length}
						</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="checklist" className="mt-4">
					<TabChecklistPa
						studentId={studentId}
						paData={paData}
						counselingLogsCount={counselingLogs.length}
						isPa={isPa}
						canEdit={canEdit}
						isSaving={isSaving}
						loadingItem={loadingItem}
						onChecklistChange={handleChecklistChange}
						onSaveNotes={handleSaveNotes}
						onAcc={handleAcc}
						onCancelAcc={handleCancelAcc}
					/>
				</TabsContent>

				<TabsContent value="hafalan" className="mt-4">
					<TabHafalan
						studentId={studentId}
						hafalanSessions={hafalanSessions}
						canEdit={canEdit}
						isSaving={isSaving}
						onAddHafalan={handleAddHafalan}
						onEditHafalan={handleEditHafalan}
						onDeleteHafalan={handleDeleteHafalan}
					/>
				</TabsContent>

				<TabsContent value="konseling" className="mt-4">
					<TabKonseling
						studentId={studentId}
						counselingLogs={counselingLogs}
						canEdit={canEdit}
						isSaving={isSaving}
						onAddCounseling={handleAddCounseling}
						onDeleteCounseling={handleDeleteCounseling}
					/>
				</TabsContent>

				<TabsContent value="tripartit" className="mt-4">
					<TabTripartit
						studentId={studentId}
						tripartiteLogs={tripartiteLogs}
						canEdit={canEdit}
						isSaving={isSaving}
						onAddTripartite={handleAddTripartite}
						onDeleteTripartite={handleDeleteTripartite}
					/>
				</TabsContent>

				<TabsContent value="interview" className="mt-4">
					<TabInterview
						studentId={studentId}
						interviewLogs={interviewLogs}
						canEdit={canEdit}
						isSaving={isSaving}
						onAddInterview={handleAddInterview}
						onDeleteInterview={handleDeleteInterview}
					/>
				</TabsContent>
			</Tabs>

			{/* Status ACC Panel Card (Persistent across all tabs) */}
			<AccPanelStatusCard
				isAcc={Boolean(paData?.isAcc)}
				accByUser={paData?.accBy?.fullName || "PA"}
				accAt={paData?.accAt}
				isReadyForAcc={isAllChecksDone}
				title="ACC Panel PA"
				pendingTitle={
					!isAllChecksDone
						? `Menunggu ACC PA (${3 - completedCount} item belum selesai)`
						: "ACC Panel Pendamping Akademik (PA)"
				}
				pendingDescription="Selesaikan semua checklist pendampingan (Akademik, Vocab, Konseling) sebelum memberikan ACC."
				readyDescription="Seluruh progres pendampingan mahasiswa telah selesai. Anda dapat memberikan persetujuan ACC resmi sekarang."
				canEdit={isPa}
				isSaving={isSaving}
				onAcc={handleAcc}
				onCancelAcc={handleCancelAcc}
				cancelDialogTitle="Konfirmasi Pembatalan ACC PA"
				cancelDialogDescription="Apakah Anda yakin ingin membatalkan status ACC untuk panel Pendamping Akademik ini? Status mahasiswa akan kembali ke tahap proses."
				disabledReason="Selesaikan 3/3 checklist pendampingan sebelum ACC"
			/>
		</div>
	);
}
