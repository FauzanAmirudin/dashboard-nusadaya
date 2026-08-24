"use client";

import {
	CheckCircle,
	CheckCircle2,
	ClipboardList,
	Clock,
	DollarSign,
	Users,
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
import { API_URL, api, getToken } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { formatDeviceDateTime } from "@/utils/format";

import { TabChecklist } from "./pmb/TabChecklist";
import { TabDataTambahan } from "./pmb/TabDataTambahan";
import { TabFeeSharing } from "./pmb/TabFeeSharing";
import { TabSkemaKeuangan } from "./pmb/TabSkemaKeuangan";

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

interface PmbPanelProps {
	studentId: number;
	pmbData?: any;
	studentData?: any;
	onUpdate: () => void;
}

export function PmbPanel({
	studentId,
	pmbData: initialPmbData,
	studentData,
	onUpdate,
}: PmbPanelProps) {
	const { user } = useAuthStore();
	const isPmbAdmin = hasRole(user, "pmb", "superadmin");
	const canEdit = isPmbAdmin;

	const [pmbData, setPmbData] = useState<any>(initialPmbData || null);
	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [activeTab, setActiveTab] = useState("data-tambahan");
	const [isLoading, setIsLoading] = useState(!initialPmbData);
	const [isAccSaving, setIsAccSaving] = useState(false);

	useEffect(() => {
		if (initialPmbData) {
			setPmbData(initialPmbData);
		}
	}, [initialPmbData]);

	const fetchPmbData = async () => {
		try {
			const res = await api.students[studentId.toString()].pmb.get();
			if (res.data?.success && res.data.data) {
				setPmbData(res.data.data);
			}
		} catch (err) {
			console.error("Gagal memuat data PMB:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDataUpdate = async () => {
		await fetchPmbData();
		onUpdate();
	};

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
		fetchPmbData();
		fetchDocuments();
	}, [studentId]);

	const mainChecklist = [
		pmbData?.formReceived,
		pmbData?.documentsComplete,
		pmbData?.dataInputted,
		pmbData?.initialFollowUp,
	];

	const docsChecklist = [
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
	];

	const mainCompletedCount = mainChecklist.filter(Boolean).length;
	const docsCompletedCount = docsChecklist.filter(Boolean).length;
	const totalCompleted14 = mainCompletedCount + docsCompletedCount;
	const isAllChecklistDone = totalCompleted14 === 14;

	const handleAcc = async () => {
		setIsAccSaving(true);
		try {
			const res = await api.students[studentId.toString()].pmb.acc.post();
			if (res.data?.success) {
				toast.success("Panel PMB berhasil disetujui (ACC)!");
				fetchPmbData();
				onUpdate();
			} else {
				toast.error((res.data as any)?.message || "Gagal memberikan ACC PMB");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat memberikan ACC PMB");
		} finally {
			setIsAccSaving(false);
		}
	};

	const handleCancelAcc = async () => {
		setIsAccSaving(true);
		try {
			const res =
				await api.students[studentId.toString()].pmb["cancel-acc"].post();
			if (res.data?.success) {
				toast.success("Status ACC PMB berhasil dibatalkan");
				fetchPmbData();
				onUpdate();
			} else {
				toast.error((res.data as any)?.message || "Gagal membatalkan ACC PMB");
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem saat membatalkan ACC PMB");
		} finally {
			setIsAccSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="border-b border-slate-200 pb-4 mb-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
							<Users className="w-5 h-5 text-[#0517B0]" /> Panel PMB (Penerimaan
							Mahasiswa Baru)
							<span className="ml-2 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
								Progres: {totalCompleted14}/14 Checklist ({mainCompletedCount}/4
								Utama • {docsCompletedCount}/10 Dokumen)
							</span>
						</CardTitle>
						<p className="text-sm text-slate-500 mt-1">
							Dikelola oleh: Admin PMB & Superadmin
						</p>
					</div>
					<div className="flex items-center gap-3">
						<PanelStatusBadge
							isAcc={pmbData?.isAcc}
							completed={totalCompleted14}
							total={14}
							size="lg"
						/>
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
						onUpdate={handleDataUpdate}
					/>
				</TabsContent>

				<TabsContent value="finance">
					<TabSkemaKeuangan
						studentId={studentId}
						pmbData={pmbData}
						canEdit={canEdit}
						onUpdate={handleDataUpdate}
					/>
				</TabsContent>

				<TabsContent value="fee-sharing">
					<TabFeeSharing
						studentId={studentId}
						canEdit={canEdit}
						onUpdate={handleDataUpdate}
					/>
				</TabsContent>

				<TabsContent value="data-tambahan">
					<TabDataTambahan
						studentId={studentId}
						studentData={studentData ?? {}}
						pmbData={pmbData}
						canEdit={canEdit}
						onUpdate={handleDataUpdate}
					/>
				</TabsContent>
			</Tabs>

			{/* Status ACC Panel PMB Card (Persistent across all tabs) */}
			<Card
				className={`border shadow-sm overflow-hidden ${
					pmbData?.isAcc
						? "bg-slate-50 border-slate-200"
						: "bg-blue-50/50 border-blue-200"
				}`}
			>
				<CardContent className="p-0">
					<div className="flex flex-col sm:flex-row items-center justify-between p-6">
						<div className="flex items-center gap-4 mb-4 sm:mb-0">
							{pmbData?.isAcc ? (
								<>
									<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
										<CheckCircle className="w-6 h-6 text-emerald-600" />
									</div>
									<div>
										<h4 className="text-slate-900 font-bold text-base sm:text-lg">
											Disetujui (ACC PMB) oleh{" "}
											{pmbData.accByUser?.fullName ||
												pmbData.accBy ||
												"Admin PMB"}
										</h4>
										<p className="text-xs sm:text-sm text-slate-600 mt-0.5">
											Pada {formatDeviceDateTime(pmbData.accAt)}
										</p>
									</div>
								</>
							) : (
								<>
									<div
										className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
											isAllChecklistDone
												? "bg-blue-100 text-[#0517B0]"
												: "bg-amber-100 text-amber-600"
										}`}
									>
										{isAllChecklistDone ? (
											<CheckCircle2 className="w-6 h-6 text-[#0517B0]" />
										) : (
											<Clock className="w-6 h-6 text-amber-600" />
										)}
									</div>
									<div>
										<h4 className="text-slate-900 font-bold text-base sm:text-lg">
											{!isAllChecklistDone
												? `Menunggu Kelengkapan Berkas (${14 - totalCompleted14} item belum selesai)`
												: "ACC Panel PMB (Penerimaan Mahasiswa Baru)"}
										</h4>
										<p className="text-xs sm:text-sm text-slate-600 max-w-lg mt-0.5">
											{!isAllChecklistDone
												? "Selesaikan semua 4 checklist berkas utama dan 10 dokumen tambahan sebelum memberikan ACC PMB."
												: "Semua 14 berkas PMB telah lengkap dan tervalidasi. Anda dapat memberikan persetujuan ACC resmi sekarang."}
										</p>
									</div>
								</>
							)}
						</div>

						{canEdit && pmbData?.isAcc && (
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="outline"
											className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0 font-semibold text-xs h-9 cursor-pointer"
											disabled={isAccSaving}
										>
											{isAccSaving ? "Membatalkan..." : "Batalkan ACC PMB"}
										</Button>
									}
								/>
								<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
									<AlertDialogHeader>
										<AlertDialogTitle>
											Konfirmasi Pembatalan ACC PMB
										</AlertDialogTitle>
										<AlertDialogDescription className="text-slate-500 text-xs sm:text-sm">
											Apakah Anda yakin ingin membatalkan status ACC untuk panel
											PMB mahasiswa ini? Status PMB akan kembali ke tahap
											berproses.
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

						{canEdit && !pmbData?.isAcc && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger render={<span className="inline-block" />}>
										<span>
											<AlertDialog>
												<AlertDialogTrigger
													render={
														<Button
															disabled={!isAllChecklistDone || isAccSaving}
															className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs h-9 min-w-[130px] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
														>
															{isAccSaving ? "Menyimpan..." : "Berikan ACC PMB"}
														</Button>
													}
												/>
												<AlertDialogContent className="bg-white border-slate-200">
													<AlertDialogHeader>
														<AlertDialogTitle>
															Konfirmasi ACC Panel PMB
														</AlertDialogTitle>
														<AlertDialogDescription className="text-slate-600 text-xs sm:text-sm">
															Apakah Anda yakin ingin memberikan persetujuan
															(ACC) untuk Panel PMB mahasiswa ini? Ini
															menandakan bahwa seluruh berkas dan dokumen
															registrasi telah diverifikasi lengkap dan sah.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<div className="flex justify-end gap-3 mt-4">
														<AlertDialogCancel>Batal</AlertDialogCancel>
														<AlertDialogAction
															onClick={handleAcc}
															className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold"
														>
															Ya, Berikan ACC PMB
														</AlertDialogAction>
													</div>
												</AlertDialogContent>
											</AlertDialog>
										</span>
									</TooltipTrigger>
									{!isAllChecklistDone && (
										<TooltipContent>
											<p className="text-xs">
												Harus menyelesaikan 14/14 checklist berkas PMB sebelum
												ACC
											</p>
										</TooltipContent>
									)}
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
