"use client";

import {
	CheckCircle,
	CheckCircle2,
	Clock,
	Loader2,
	Wallet,
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
import { TabAnggaran } from "./finance/TabAnggaran";
import { TabFeeSharing } from "./finance/TabFeeSharing";
import { TabKeuangan } from "./finance/TabKeuangan";

interface FinancePanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function FinancePanel({ studentId, onUpdate }: FinancePanelProps) {
	const { user } = useAuthStore();
	const isFinanceAdmin = hasRole(user, "finance", "superadmin");
	const canEdit = isFinanceAdmin;

	const [finState, setFinState] = useState<any>(null);
	const [pmbState, setPmbState] = useState<any>(null);
	const [customFields, setCustomFields] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isAccSaving, setIsAccSaving] = useState(false);

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const { data, error } =
				await api.finance.student[studentId.toString()].get();
			if (!error && data?.success) {
				setFinState(data?.data?.finance);
				setPmbState({ rumahJuang: data?.data?.rumahJuangAktif });
				setCustomFields(data?.data?.customFields || []);
			}
		} catch (err) {
			console.error("Failed to fetch finance data", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	const refreshData = () => {
		fetchData();
		onUpdate();
	};

	const isTalangan = finState?.metodePembayaran === "dana_talangan";
	const isSemesterDone = isTalangan
		? Boolean(finState?.t1SemesterStatus || finState?.mandiriSemesterStatus)
		: Boolean(finState?.mandiriSemesterStatus);
	const isInterviewDone = isTalangan
		? Boolean(finState?.t1InterviewStatus)
		: Boolean(finState?.mandiriInterviewStatus);
	const isKeberangkatanDone = isTalangan
		? Boolean(finState?.t2KeberangkatanStatus)
		: Boolean(finState?.mandiriKeberangkatanStatus);

	const financeChecklistItems = [
		{
			name: "Registrasi / Pendaftaran",
			done: Boolean(finState?.registrasiStatus || finState?.registrationPaid),
		},
		{
			name: isTalangan
				? "Perkuliahan Semester (Talangan)"
				: "Perkuliahan 6 Semester",
			done: isSemesterDone,
		},
		{
			name: isTalangan ? "Interview Magang (Tahap 1)" : "Interview Magang",
			done: isInterviewDone,
		},
		{
			name: isTalangan ? "Keberangkatan (Tahap 2)" : "Keberangkatan",
			done: isKeberangkatanDone,
		},
		{
			name: "Sertifikasi Bahasa (TOEIC)",
			done: Boolean(finState?.toeicStatus),
		},
		{ name: "Paspor & Dokumen", done: Boolean(finState?.pasporStatus) },
	];

	const completedCount = financeChecklistItems.filter((i) => i.done).length;
	const totalChecks = 6;
	const isFinanceReady = completedCount === totalChecks;

	const handleAcc = async () => {
		setIsAccSaving(true);
		try {
			const res = await api.students[studentId.toString()].finance.acc.post();
			if (res.data?.success) {
				toast.success("Panel Keuangan berhasil disetujui (ACC)!");
				fetchData();
				onUpdate();
			} else {
				toast.error(
					(res.data as any)?.message || "Gagal memberikan ACC Keuangan",
				);
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat memberikan ACC Keuangan");
		} finally {
			setIsAccSaving(false);
		}
	};

	const handleCancelAcc = async () => {
		setIsAccSaving(true);
		try {
			const res = await api.students[studentId.toString()].finance.acc.delete();
			if (res.data?.success) {
				toast.success("Status ACC Keuangan berhasil dibatalkan");
				fetchData();
				onUpdate();
			} else {
				toast.error(
					(res.data as any)?.message || "Gagal membatalkan ACC Keuangan",
				);
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat membatalkan ACC Keuangan");
		} finally {
			setIsAccSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center p-10">
				<Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-5">
				<PanelHeader
					icon={<Wallet className="w-5 h-5 text-[#0517B0]" />}
					title="Panel Keuangan Mahasiswa"
					subtitle="Pengelolaan partisi biaya pendidikan, transaksi pembayaran, fee sharing, dan anggaran."
					progressTag={
						<Badge className="bg-[#0517B0]/10 text-[#0517B0] border-[#0517B0]/20 text-[10px] font-bold px-2 py-0.5">
							Divisi Finance
						</Badge>
					}
					badge={
						<PanelStatusBadge
							isAcc={finState?.isAcc}
							completed={completedCount}
							total={totalChecks}
							size="lg"
						/>
					}
				/>

				<Tabs defaultValue="keuangan" className="w-full space-y-4">
					<TabsList className="w-full grid grid-cols-3 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 h-10">
						<TabsTrigger
							value="keuangan"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-lg text-xs transition-all"
						>
							1. Keuangan Mahasiswa
						</TabsTrigger>
						<TabsTrigger
							value="fee-sharing"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-lg text-xs transition-all"
						>
							2. Distribusi Fee (Sharing)
						</TabsTrigger>
						<TabsTrigger
							value="anggaran"
							className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-lg text-xs transition-all"
						>
							3. Anggaran Praktik
						</TabsTrigger>
					</TabsList>

					<TabsContent value="keuangan">
						<TabKeuangan
							studentId={studentId}
							finState={finState}
							pmbState={pmbState}
							customFields={customFields}
							canEdit={canEdit}
							onUpdate={refreshData}
						/>
					</TabsContent>

					<TabsContent value="fee-sharing">
						<TabFeeSharing studentId={studentId} canEdit={canEdit} />
					</TabsContent>

					<TabsContent value="anggaran">
						<TabAnggaran canEdit={canEdit} />
					</TabsContent>
				</Tabs>

				{/* Status ACC Panel Finance Card (Persistent across all tabs) */}
				<AccPanelStatusCard
					isAcc={Boolean(finState?.isAcc)}
					accByUser={finState?.accBy?.fullName || "Admin Finance"}
					accAt={finState?.accAt}
					isReadyForAcc={isFinanceReady}
					title="ACC Panel Keuangan"
					pendingTitle={
						!isFinanceReady
							? "Menunggu Pelunasan Tagihan Wajib (6 Item)"
							: "ACC Panel Keuangan (Finance)"
					}
					pendingDescription="Seluruh tagihan pokok (Registrasi, Semester, Interview, Keberangkatan, TOEIC, Paspor) harus lunas atau tidak ada tunggakan sebelum ACC."
					readyDescription="Seluruh tagihan pokok (6 item) mahasiswa telah lunas dan diverifikasi. Anda dapat memberikan persetujuan ACC resmi sekarang."
					canEdit={canEdit}
					isSaving={isAccSaving}
					onAcc={handleAcc}
					onCancelAcc={handleCancelAcc}
					cancelDialogTitle="Konfirmasi Pembatalan ACC Keuangan"
					cancelDialogDescription="Apakah Anda yakin ingin membatalkan status ACC untuk panel Keuangan mahasiswa ini? Status Keuangan akan kembali ke tahap berproses."
					disabledReason="Semua tagihan (Registrasi, Semester, Interview, Keberangkatan, TOEIC, dan Paspor) harus lunas sebelum ACC"
				/>
			</div>
		</TooltipProvider>
	);
}
