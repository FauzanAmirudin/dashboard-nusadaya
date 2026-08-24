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
	const isCrmAdmin = hasRole(user, "crm", "superadmin");
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
	const [isAccSaving, setIsAccSaving] = useState(false);

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
	const isAllChecksDone = completedCount === totalChecks;

	const handleAcc = async () => {
		setIsAccSaving(true);
		try {
			const res = await api.students[studentId.toString()].crm.acc.post();
			if (res.data?.success) {
				toast.success("Panel CRM berhasil disetujui (ACC)!");
				fetchCrmData();
				onUpdate();
			} else {
				toast.error((res.data as any)?.message || "Gagal memberikan ACC CRM");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat memberikan ACC CRM");
		} finally {
			setIsAccSaving(false);
		}
	};

	const handleCancelAcc = async () => {
		setIsAccSaving(true);
		try {
			const res = await api.students[studentId.toString()].crm.acc.delete();
			if (res.data?.success) {
				toast.success("Status ACC CRM berhasil dibatalkan");
				fetchCrmData();
				onUpdate();
			} else {
				toast.error((res.data as any)?.message || "Gagal membatalkan ACC CRM");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat membatalkan ACC CRM");
		} finally {
			setIsAccSaving(false);
		}
	};

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<div>
					<div className="border-b border-slate-200 pb-4 mb-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div>
								<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
									<PhoneCall className="w-5 h-5 text-[#0517B0]" /> CRM —
									Customer Relationship Management
									<span className="ml-2 text-sm font-normal text-slate-500">
										[{completedCount}/{totalChecks}]
									</span>
								</CardTitle>
								<p className="text-sm text-slate-500 mt-1">
									Dikelola oleh: Admin CRM & Superadmin
								</p>
							</div>
							<div className="flex items-center gap-3">
								<PanelStatusBadge
									isAcc={crm?.isAcc}
									completed={completedCount}
									total={totalChecks}
									size="lg"
								/>
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

				{/* Status ACC Panel CRM Card (Persistent across all tabs) */}
				<Card
					className={`border shadow-sm overflow-hidden ${
						crm?.isAcc
							? "bg-slate-50 border-slate-200"
							: "bg-blue-50/50 border-blue-200"
					}`}
				>
					<CardContent className="p-0">
						<div className="flex flex-col sm:flex-row items-center justify-between p-6">
							<div className="flex items-center gap-4 mb-4 sm:mb-0">
								{crm?.isAcc ? (
									<>
										<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
											<CheckCircle className="w-6 h-6 text-emerald-600" />
										</div>
										<div>
											<h4 className="text-slate-900 font-bold text-base sm:text-lg">
												Disetujui (ACC CRM) oleh{" "}
												{crm.accBy?.fullName || "Admin CRM"}
											</h4>
											<p className="text-xs sm:text-sm text-slate-600 mt-0.5">
												Pada {formatDeviceDateTime(crm.accAt)}
											</p>
										</div>
									</>
								) : (
									<>
										<div
											className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
												isAllChecksDone
													? "bg-blue-100 text-[#0517B0]"
													: "bg-amber-100 text-amber-600"
											}`}
										>
											{isAllChecksDone ? (
												<CheckCircle2 className="w-6 h-6 text-[#0517B0]" />
											) : (
												<Clock className="w-6 h-6 text-amber-600" />
											)}
										</div>
										<div>
											<h4 className="text-slate-900 font-bold text-base sm:text-lg">
												{!isAllChecksDone
													? `Menunggu Kelengkapan Checklist (${totalChecks - completedCount} item belum selesai)`
													: "ACC Panel CRM (Customer Relationship Management)"}
											</h4>
											<p className="text-xs sm:text-sm text-slate-600 max-w-lg mt-0.5">
												{!isAllChecksDone
													? "Selesaikan semua 8 indikator monitoring CRM sebelum memberikan persetujuan ACC."
													: "Seluruh 8 checklist CRM telah lengkap. Anda dapat memberikan persetujuan ACC resmi sekarang."}
											</p>
										</div>
									</>
								)}
							</div>

							{canEdit && crm?.isAcc && (
								<AlertDialog>
									<AlertDialogTrigger
										render={
											<Button
												variant="outline"
												className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0 font-semibold text-xs h-9 cursor-pointer"
												disabled={isAccSaving}
											>
												{isAccSaving ? "Membatalkan..." : "Batalkan ACC CRM"}
											</Button>
										}
									/>
									<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
										<AlertDialogHeader>
											<AlertDialogTitle>
												Konfirmasi Pembatalan ACC CRM
											</AlertDialogTitle>
											<AlertDialogDescription className="text-slate-500 text-xs sm:text-sm">
												Apakah Anda yakin ingin membatalkan status ACC untuk
												panel CRM mahasiswa ini? Status CRM akan kembali ke
												tahap berproses.
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

							{canEdit && !crm?.isAcc && (
								<Tooltip>
									<TooltipTrigger render={<span className="inline-block" />}>
										<span>
											<AlertDialog>
												<AlertDialogTrigger
													render={
														<Button
															disabled={!isAllChecksDone || isAccSaving}
															className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs h-9 min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
														>
															{isAccSaving ? "Menyimpan..." : "Berikan ACC CRM"}
														</Button>
													}
												/>
												<AlertDialogContent className="bg-white border-slate-200">
													<AlertDialogHeader>
														<AlertDialogTitle>
															Konfirmasi ACC Panel CRM
														</AlertDialogTitle>
														<AlertDialogDescription className="text-slate-600 text-xs sm:text-sm">
															Apakah Anda yakin ingin memberikan persetujuan
															(ACC) untuk Panel CRM mahasiswa ini? Ini
															menandakan seluruh monitoring pembinaan, hafalan,
															kehadiran, dan persiapan pra-magang telah selesai.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<div className="flex justify-end gap-3 mt-4">
														<AlertDialogCancel>Batal</AlertDialogCancel>
														<AlertDialogAction
															onClick={handleAcc}
															className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold"
														>
															Ya, Berikan ACC CRM
														</AlertDialogAction>
													</div>
												</AlertDialogContent>
											</AlertDialog>
										</span>
									</TooltipTrigger>
									{!isAllChecksDone && (
										<TooltipContent>
											<p className="text-xs">
												Harus menyelesaikan 8/8 checklist CRM sebelum ACC
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
