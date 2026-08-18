"use client";

import {
	BookMarked,
	Briefcase,
	CheckSquare,
	Loader2,
	MessageCircle,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_URL, api, getToken } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";

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
	const isPa = hasRole(user, "pa", "akademik");
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

	// Role PA, Akademik, and Superadmin have full CRUD permissions to manage hafalan, counseling, tripartite, interview, etc.
	const canEdit = isPa || isSuperadmin;

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

	// Progress Calculations
	const totalVocab = hafalanSessions.reduce((acc, s) => acc + s.vocabCount, 0);
	const totalSentence = hafalanSessions.reduce(
		(acc, s) => acc + s.sentenceCount,
		0,
	);
	const targetVocab = paData?.vocabTarget || 500;
	const isVocabDone = totalVocab >= targetVocab;

	const completedChecklistCount = [
		paData?.counselingDone,
		paData?.mentalStable,
		paData?.disciplineGood,
	].filter(Boolean).length;

	const totalProgressItems = completedChecklistCount + (isVocabDone ? 1 : 0);
	const totalChecklistProgress = Math.round((totalProgressItems / 4) * 100);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-20 text-slate-500">
				<Loader2 className="w-6 h-6 animate-spin mr-2" />
				Memuat data PA...
			</div>
		);
	}

	let panelStatusBadge = (
		<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
			🟢 AMAN
		</Badge>
	);
	if (paData?.status === "TIDAK_AMAN") {
		panelStatusBadge = (
			<Badge className="bg-rose-50 text-rose-600 border-rose-200">
				🔴 TIDAK AMAN
			</Badge>
		);
	} else if (paData?.status === "PERLU_PERHATIAN") {
		panelStatusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
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
							<span className="text-xl">🤝</span> PA — Pendamping Akademik
							<span className="ml-2 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
								Progres: {totalProgressItems}/4 Item ({completedChecklistCount}
								/3 Checklist • {totalVocab} Kosakata • {totalSentence} Kalimat)
							</span>
						</CardTitle>
						<p className="text-sm text-slate-500 mt-1">
							Dikelola oleh: Admin PA & Pendamping Akademik
						</p>
					</div>
					<div className="flex items-center gap-3">
						{isSuperadmin && !isPa && (
							<Badge
								variant="outline"
								className="text-slate-400 border-slate-300"
							>
								👁 Mode Lihat Saja
							</Badge>
						)}
						{panelStatusBadge}
					</div>
				</div>
				<div className="mt-4 flex items-center gap-4">
					<span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
						Total Progress:
					</span>
					<Progress
						value={totalChecklistProgress}
						className="h-2 flex-1"
						indicatorClassName={
							totalChecklistProgress === 100 ? "bg-emerald-500" : "bg-blue-500"
						}
					/>
					<span className="text-sm font-bold text-slate-700">
						{totalChecklistProgress}%
					</span>
				</div>
			</div>

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
		</div>
	);
}
