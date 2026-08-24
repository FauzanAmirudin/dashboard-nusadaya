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
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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

	const completedCount = [
		finState?.registrasiStatus,
		finState?.mandiriSemesterStatus || finState?.t1SemesterStatus,
		finState?.toeicStatus,
		finState?.pasporStatus,
	].filter(Boolean).length;
	const totalChecks = 4;
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
				{/* Panel Header */}
				<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100/80 shadow-2xs">
								<Wallet className="w-5 h-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<CardTitle className="text-lg font-bold text-slate-900 tracking-tight">
										Panel Keuangan Mahasiswa
									</CardTitle>
									<Badge className="bg-[#0517B0]/10 text-[#0517B0] border-[#0517B0]/20 text-[10px] font-bold px-2 py-0.5">
										Divisi Finance
									</Badge>
								</div>
								<p className="text-xs text-slate-500 mt-0.5">
									Pengelolaan partisi biaya pendidikan, transaksi pembayaran,
									fee sharing, dan anggaran.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<PanelStatusBadge
								isAcc={finState?.isAcc}
								completed={completedCount}
								total={totalChecks}
								size="lg"
							/>
						</div>
					</div>
				</div>

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
				<Card
					className={`border shadow-sm overflow-hidden ${
						finState?.isAcc
							? "bg-slate-50 border-slate-200"
							: "bg-blue-50/50 border-blue-200"
					}`}
				>
					<CardContent className="p-0">
						<div className="flex flex-col sm:flex-row items-center justify-between p-6">
							<div className="flex items-center gap-4 mb-4 sm:mb-0">
								{finState?.isAcc ? (
									<>
										<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
											<CheckCircle className="w-6 h-6 text-emerald-600" />
										</div>
										<div>
											<h4 className="text-slate-900 font-bold text-base sm:text-lg">
												Disetujui (ACC Keuangan) oleh{" "}
												{finState.accBy?.fullName || "Admin Finance"}
											</h4>
											<p className="text-xs sm:text-sm text-slate-600 mt-0.5">
												Pada {formatDeviceDateTime(finState.accAt)}
											</p>
										</div>
									</>
								) : (
									<>
										<div
											className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
												isFinanceReady
													? "bg-blue-100 text-[#0517B0]"
													: "bg-amber-100 text-amber-600"
											}`}
										>
											{isFinanceReady ? (
												<CheckCircle2 className="w-6 h-6 text-[#0517B0]" />
											) : (
												<Clock className="w-6 h-6 text-amber-600" />
											)}
										</div>
										<div>
											<h4 className="text-slate-900 font-bold text-base sm:text-lg">
												{!isFinanceReady
													? "Menunggu Pelunasan Tagihan Wajib"
													: "ACC Panel Keuangan (Finance)"}
											</h4>
											<p className="text-xs sm:text-sm text-slate-600 max-w-lg mt-0.5">
												{!isFinanceReady
													? "Seluruh tagihan pokok (Registrasi, Semester, TOEIC, Paspor) harus lunas atau tidak ada tunggakan sebelum ACC."
													: "Seluruh tagihan pokok mahasiswa telah lunas dan diverifikasi. Anda dapat memberikan persetujuan ACC resmi sekarang."}
											</p>
										</div>
									</>
								)}
							</div>

							{canEdit && finState?.isAcc && (
								<AlertDialog>
									<AlertDialogTrigger
										render={
											<Button
												variant="outline"
												className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0 font-semibold text-xs h-9 cursor-pointer"
												disabled={isAccSaving}
											>
												{isAccSaving
													? "Membatalkan..."
													: "Batalkan ACC Finance"}
											</Button>
										}
									/>
									<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
										<AlertDialogHeader>
											<AlertDialogTitle>
												Konfirmasi Pembatalan ACC Keuangan
											</AlertDialogTitle>
											<AlertDialogDescription className="text-slate-500 text-xs sm:text-sm">
												Apakah Anda yakin ingin membatalkan status ACC untuk
												panel Keuangan mahasiswa ini? Status Keuangan akan
												kembali ke tahap berproses.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<div className="flex justify-end gap-3 mt-4">
											<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50">
												Batal
											</AlertDialogCancel>
											<AlertDialogAction
												onClick={handleCancelAcc}
												className="bg-rose-600 hover:bg-rose-700 text-white"
											>
												Ya, Batalkan ACC
											</AlertDialogAction>
										</div>
									</AlertDialogContent>
								</AlertDialog>
							)}

							{canEdit && !finState?.isAcc && (
								<Tooltip>
									<TooltipTrigger render={<span className="inline-block" />}>
										<span>
											<AlertDialog>
												<AlertDialogTrigger
													render={
														<Button
															disabled={!isFinanceReady || isAccSaving}
															className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs h-9 min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
														>
															{isAccSaving
																? "Menyimpan..."
																: "Berikan ACC Finance"}
														</Button>
													}
												/>
												<AlertDialogContent className="bg-white border-slate-200">
													<AlertDialogHeader>
														<AlertDialogTitle>
															Konfirmasi ACC Panel Keuangan
														</AlertDialogTitle>
														<AlertDialogDescription className="text-slate-600 text-xs sm:text-sm">
															Apakah Anda yakin ingin memberikan persetujuan
															(ACC) untuk Panel Keuangan mahasiswa ini? Ini
															menandakan bahwa seluruh tagihan wajib dan
															pembayaran pendidikan telah diselesaikan.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<div className="flex justify-end gap-3 mt-4">
														<AlertDialogCancel>Batal</AlertDialogCancel>
														<AlertDialogAction
															onClick={handleAcc}
															className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold"
														>
															Ya, Berikan ACC Finance
														</AlertDialogAction>
													</div>
												</AlertDialogContent>
											</AlertDialog>
										</span>
									</TooltipTrigger>
									{!isFinanceReady && (
										<TooltipContent>
											<p className="text-xs">
												Tagihan Registrasi, Semester, TOEIC, dan Paspor harus
												lunas sebelum ACC
											</p>
										</TooltipContent>
									)}
								</Tooltip>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</TooltipProvider>
	);
}
