"use client";

import { useQueryClient } from "@tanstack/react-query";
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
import { useStudentDetail } from "@/hooks/useStudentsList";
import { api } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { formatDeviceDateTime } from "@/utils/format";
import {
	calculateFinanceChecklist,
	type FinanceCheckKey,
} from "@/utils/panel-logic";
import { TabFeeSharing } from "./finance/TabFeeSharing";
import { TabKeuangan } from "./finance/TabKeuangan";

interface FinancePanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function FinancePanel({ studentId, onUpdate }: FinancePanelProps) {
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const { data: studentDetail } = useStudentDetail(studentId);
	const isFinanceAdmin = hasRole(user, "finance", "superadmin");
	const canEdit = isFinanceAdmin;

	const [finState, setFinState] = useState<any>(null);
	const [pmbState, setPmbState] = useState<any>(null);
	const [customFields, setCustomFields] = useState<any[]>([]);
	const [student, setStudent] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isAccSaving, setIsAccSaving] = useState(false);
	const fetchData = async (silent = false) => {
		try {
			if (!silent && !finState) {
				setIsLoading(true);
			}
			const { data, error } =
				await api.finance.student[studentId.toString()].get();
			if (!error && data?.success) {
				setFinState(data?.data?.finance);
				setStudent(data?.data?.student);
				setPmbState({
					rumahJuang: data?.data?.rumahJuangAktif,
					pmbDp: (data?.data as any)?.pmbDp,
					totalDp:
						(data?.data as any)?.pmbDp ??
						(data?.data as any)?.paymentPlan?.totalDp,
					pendaftaranDp:
						(data?.data as any)?.pmbDp ??
						(data?.data as any)?.paymentPlan?.pendaftaranDp,
					paymentPlan: (data?.data as any)?.paymentPlan,
				});
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
		fetchData(true);
	};

	const {
		completedCount,
		totalChecks,
		isFinanceReady,
		items: financeChecklistItems,
	} = calculateFinanceChecklist(finState);

	// Tandai pos tagihan yang tidak berlaku bagi mahasiswa ini (dilewati saat ACC)
	const [naSavingKey, setNaSavingKey] = useState<string | null>(null);
	const handleToggleNotApplicable = async (
		key: FinanceCheckKey,
		notApplicable: boolean,
	) => {
		if (notApplicable) {
			const note = window.prompt(
				"Alasan pos ini tidak berlaku bagi mahasiswa ini:",
				"",
			);
			if (note === null) return;
			if (!note.trim()) {
				toast.error("Alasan wajib diisi");
				return;
			}
			setNaSavingKey(key);
			const { error } = await api.students[studentId.toString()].finance[
				"tidak-berlaku"
			].put({ key, notApplicable: true, note: note.trim() });
			setNaSavingKey(null);
			if (error) {
				toast.error("Gagal menandai pos tidak berlaku");
				return;
			}
			toast.success("Pos ditandai tidak berlaku");
		} else {
			setNaSavingKey(key);
			const { error } = await api.students[studentId.toString()].finance[
				"tidak-berlaku"
			].put({ key, notApplicable: false });
			setNaSavingKey(null);
			if (error) {
				toast.error("Gagal membatalkan penandaan");
				return;
			}
			toast.success("Pos kembali dihitung sebagai tagihan");
		}
		refreshData();
	};

	const handleAcc = async () => {
		setIsAccSaving(true);
		try {
			const res = await api.students[studentId.toString()].finance.acc.post();
			if (res.data?.success) {
				toast.success("Panel Keuangan berhasil disetujui (ACC)!");
				fetchData();
				onUpdate();
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
				queryClient.invalidateQueries({ queryKey: ["students-list"] });
				queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
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
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
				queryClient.invalidateQueries({ queryKey: ["students-list"] });
				queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
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

				{/* Syarat ACC Keuangan: pos yang tidak berlaku bisa ditandai agar
				    tidak perlu diisi nominal dummy lalu "dilunasi". */}
				<section className="rounded-xl border border-slate-200 bg-white">
					<div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
						<h3 className="text-sm sm:text-base font-bold text-slate-900">
							Syarat ACC Keuangan
						</h3>
						<span
							className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
								isFinanceReady
									? "bg-emerald-100 text-emerald-800"
									: "bg-amber-100 text-amber-800"
							}`}
						>
							{completedCount} / {totalChecks} lunas
						</span>
					</div>
					<ul className="divide-y divide-slate-100">
						{financeChecklistItems.map((item) => (
							<li
								key={item.key ?? item.name}
								className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
									item.notApplicable
										? "bg-slate-50"
										: item.done
											? "bg-emerald-50/50"
											: "bg-white"
								}`}
							>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-slate-900">
										{item.name}
									</p>
									<p className="mt-0.5 text-xs text-slate-600">
										{item.notApplicable
											? `Tidak berlaku${item.note ? ` — ${item.note}` : ""}`
											: item.done
												? "Lunas"
												: "Belum lunas"}
									</p>
								</div>
								{canEdit && item.key && (
									<Button
										variant="outline"
										size="sm"
										disabled={naSavingKey === item.key}
										onClick={() =>
											handleToggleNotApplicable(
												item.key as FinanceCheckKey,
												!item.notApplicable,
											)
										}
										className="h-9 shrink-0 self-start px-3 text-xs font-semibold border-slate-200 text-slate-700 sm:self-auto"
									>
										{item.notApplicable
											? "Jadikan tagihan"
											: "Tandai tidak berlaku"}
									</Button>
								)}
							</li>
						))}
					</ul>
				</section>

				<Tabs defaultValue="keuangan" className="w-full space-y-4">
					<TabsList className="w-full grid grid-cols-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 h-10">
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
					</TabsList>

					<TabsContent value="keuangan">
						<TabKeuangan
							studentId={studentId}
							finState={finState}
							pmbState={pmbState}
							internshipState={studentDetail?.internship ?? null}
							customFields={customFields}
							canEdit={canEdit}
							destinationCountry={student?.destinationCountry}
							onUpdate={refreshData}
						/>
					</TabsContent>

					<TabsContent value="fee-sharing">
						<TabFeeSharing studentId={studentId} canEdit={canEdit} />
					</TabsContent>
				</Tabs>

				{/* Status ACC Panel Finance Card (Persistent across all tabs) */}
				<AccPanelStatusCard
					isAcc={Boolean(finState?.isAcc)}
					accByUser={finState?.accBy?.fullName || "Tim Keuangan"}
					accAt={finState?.accAt}
					isReadyForAcc={isFinanceReady}
					title="ACC Panel Keuangan"
					pendingTitle={
						!isFinanceReady
							? `Menunggu Pelunasan Tagihan Wajib (${completedCount}/${totalChecks} lunas)`
							: "ACC Panel Keuangan (Finance)"
					}
					pendingDescription="Seluruh tagihan pokok harus lunas sebelum ACC. Pos yang tidak berlaku bagi mahasiswa ini dapat ditandai pada daftar Syarat ACC Keuangan di atas."
					readyDescription="Seluruh tagihan yang berlaku telah lunas dan diverifikasi. Anda dapat memberikan persetujuan ACC resmi sekarang."
					canEdit={canEdit}
					isSaving={isAccSaving}
					onAcc={handleAcc}
					onCancelAcc={handleCancelAcc}
					cancelDialogTitle="Konfirmasi Pembatalan ACC Keuangan"
					cancelDialogDescription="Apakah Anda yakin ingin membatalkan status ACC untuk panel Keuangan mahasiswa ini? Status Keuangan akan kembali ke tahap berproses."
					disabledReason="Semua tagihan yang berlaku harus lunas sebelum ACC"
				/>
			</div>
		</TooltipProvider>
	);
}
