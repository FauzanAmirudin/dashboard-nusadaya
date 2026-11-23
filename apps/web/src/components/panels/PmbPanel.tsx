"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ClipboardList, Clock, Loader2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { calculatePmbChecklist } from "@/utils/panel-logic";

import { TabChecklist } from "./pmb/TabChecklist";
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
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const isPmbAdmin = hasRole(user, "pmb", "superadmin");
	const canEdit = isPmbAdmin;

	const [pmbData, setPmbData] = useState<any>(initialPmbData || null);
	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [activeTab, setActiveTab] = useState("checklist");
	const [isLoading, setIsLoading] = useState(!initialPmbData);
	const [isAccSaving, setIsAccSaving] = useState(false);

	useEffect(() => {
		if (initialPmbData) {
			setPmbData(initialPmbData);
		}
	}, [initialPmbData]);

	// Syarat ACC per tab (sumber: server, aturan yang sama dengan validasi ACC)
	const [accReq, setAccReq] = useState<{
		dokumen: { ok: boolean; done: number; total: number };
		keuangan: { ok: boolean };
		feeSharing: { ok: boolean; paid: number; total: number };
		ok: boolean;
		missing: string[];
	} | null>(null);

	const fetchAccRequirements = async () => {
		try {
			const res: any =
				await api.students[studentId.toString()].pmb["acc-requirements"].get();
			if (res?.data?.success) setAccReq(res.data.data);
		} catch {
			// biarkan null: tombol ACC tetap nonaktif
		}
	};

	const fetchPmbData = async () => {
		try {
			const res = await api.students[studentId.toString()].pmb.get();
			if (res.data?.success && res.data.data) {
				setPmbData(res.data.data);
			}
			await fetchAccRequirements();
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

	const {
		mainCompletedCount,
		requiredDocsCompletedCount,
		totalRequiredCompleted16,
	} = calculatePmbChecklist(pmbData);

	const handleAcc = async () => {
		setIsAccSaving(true);
		try {
			const res = await api.students[studentId.toString()].pmb.acc.post();
			if (res.data?.success) {
				toast.success("Panel PMB berhasil disetujui (ACC)!");
				queryClient.invalidateQueries({ queryKey: ["students-list"] });
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
				queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
				queryClient.invalidateQueries({
					queryKey: ["student", studentId.toString()],
				});
				queryClient.invalidateQueries({
					queryKey: ["student-detail", studentId.toString()],
				});
				window.dispatchEvent(
					new CustomEvent("student-updated", { detail: { studentId } }),
				);
				window.dispatchEvent(
					new CustomEvent("pmb-progress-sync", { detail: { studentId } }),
				);
				try {
					if (typeof BroadcastChannel !== "undefined") {
						const channel = new BroadcastChannel("dashboard-realtime-sync");
						channel.postMessage({ type: "pmb-acc", studentId });
						channel.close();
					}
				} catch {}
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
				queryClient.invalidateQueries({ queryKey: ["students-list"] });
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
				queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
				queryClient.invalidateQueries({
					queryKey: ["student", studentId.toString()],
				});
				queryClient.invalidateQueries({
					queryKey: ["student-detail", studentId.toString()],
				});
				window.dispatchEvent(
					new CustomEvent("student-updated", { detail: { studentId } }),
				);
				window.dispatchEvent(
					new CustomEvent("pmb-progress-sync", { detail: { studentId } }),
				);
				try {
					if (typeof BroadcastChannel !== "undefined") {
						const channel = new BroadcastChannel("dashboard-realtime-sync");
						channel.postMessage({ type: "pmb-cancel-acc", studentId });
						channel.close();
					}
				} catch {}
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

	// Aturan ACC: 5 berkas utama + 9 dokumen wajib = 14 (lihat calculatePmbChecklist)
	const PMB_REQUIRED_TOTAL = 13;
	const completed = totalRequiredCompleted16;
	const isAcc = Boolean(pmbData?.isAcc);
	const accByName =
		pmbData?.accBy?.fullName ||
		pmbData?.accByUser?.fullName ||
		(typeof pmbData?.accBy === "string" ? pmbData?.accBy : "Tim PMB");

	const reqOk = Boolean(accReq?.ok);
	const nextStep = !accReq
		? "Memuat syarat ACC..."
		: !accReq.dokumen.ok
			? "Lengkapi Dokumen"
			: !accReq.keuangan.ok
				? "Lengkapi Skema Keuangan"
				: accReq.feeSharing.total === 0
					? "Tambah penerima fee"
					: "Menunggu pembayaran fee oleh Finance";

	const handleNextStepClick = () => {
		if (reqOk) {
			handleAcc();
			return;
		}
		if (!accReq?.dokumen.ok) {
			setActiveTab("checklist");
		} else if (!accReq?.keuangan.ok) {
			setActiveTab("finance");
		} else if (!accReq?.feeSharing.ok) {
			setActiveTab("fee-sharing");
		}
	};

	const accButton = (extraClass = "") => {
		if (reqOk) {
			return (
				<Button
					onClick={handleAcc}
					disabled={isAccSaving}
					className={`bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer shadow-2xs transition-all ${extraClass}`}
				>
					{isAccSaving ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin mr-1.5" />
							Memproses...
						</>
					) : (
						"✓ Beri ACC PMB"
					)}
				</Button>
			);
		}

		return (
			<Button
				onClick={handleNextStepClick}
				disabled={isAccSaving}
				className={`bg-[#0517B0] hover:bg-blue-800 text-white text-sm font-semibold cursor-pointer shadow-2xs transition-all ${extraClass}`}
				title="Klik untuk membuka tab yang belum lengkap"
			>
				{isAccSaving ? (
					<>
						<Loader2 className="w-4 h-4 animate-spin mr-1.5" />
						Memproses...
					</>
				) : (
					<span className="truncate">{nextStep} →</span>
				)}
			</Button>
		);
	};

	const requirementRows = [
		{
			key: "dokumen",
			label: "Dokumen",
			ok: Boolean(accReq?.dokumen.ok),
			detail: `${accReq?.dokumen.done ?? completed}/${accReq?.dokumen.total ?? PMB_REQUIRED_TOTAL} berkas wajib`,
		},
		{
			key: "keuangan",
			label: "Skema Keuangan",
			ok: Boolean(accReq?.keuangan.ok),
			detail: accReq?.keuangan.ok
				? "Total biaya & DP terisi"
				: "Total biaya & DP belum diisi",
		},
		{
			key: "fee",
			label: "Fee Sharing",
			ok: Boolean(accReq?.feeSharing.ok),
			detail:
				!accReq || accReq.feeSharing.total === 0
					? "Belum ada penerima"
					: `${accReq.feeSharing.paid}/${accReq.feeSharing.total} penerima sudah dibayarkan`,
		},
	];

	// Ponsel: titik status (hemat ruang, tab tetap 1 baris); tablet/desktop: badge teks
	const tabBadge = (ok: boolean, text: string) => (
		<>
			<span
				aria-hidden="true"
				className={`size-2 shrink-0 rounded-full sm:hidden ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
			/>
			<span
				aria-hidden="true"
				className={`hidden sm:inline-flex ml-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
			>
				{text}
			</span>
			<span className="sr-only">
				{ok ? "(lengkap)" : `(belum lengkap: ${text})`}
			</span>
		</>
	);

	return (
		<div className="space-y-6">
			{/* Ringkasan: syarat ACC PMB dan tombol aksi dengan layout grid sejajar & proporsional */}
			<section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
				<div className="space-y-3.5">
					<div>
						<h2 className="text-base font-bold text-slate-900">
							Syarat ACC PMB
						</h2>
						<p className="mt-0.5 text-sm text-slate-700">
							{isAcc ? (
								<>
									<span className="font-semibold text-emerald-700">
										Sudah ACC
									</span>{" "}
									oleh {accByName}
									{pmbData?.accAt
										? ` · ${formatDeviceDateTime(pmbData.accAt)}`
										: ""}
								</>
							) : reqOk ? (
								<span className="font-medium text-emerald-700">
									Semua syarat terpenuhi. Siap diberi ACC.
								</span>
							) : (
								"ACC bisa diberikan setelah ketiga tab di bawah lengkap."
							)}
						</p>
					</div>

					<div
						className={`grid gap-3 ${
							canEdit
								? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
								: "grid-cols-1 sm:grid-cols-3"
						} items-stretch`}
					>
						{requirementRows.map((r) => (
							<div
								key={r.key}
								className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 shadow-2xs transition-all ${
									r.ok
										? "border-emerald-200 bg-emerald-50/70"
										: "border-amber-200 bg-white"
								}`}
							>
								<span
									aria-hidden="true"
									className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
										r.ok
											? "bg-emerald-500 text-white"
											: "bg-amber-100 text-amber-700"
									}`}
								>
									{r.ok ? "✓" : "!"}
								</span>
								<div className="min-w-0 flex-1">
									<span className="block text-sm font-semibold text-slate-900 leading-tight">
										{r.label}
										<span className="sr-only">
											{r.ok ? " (lengkap)" : " (belum lengkap)"}
										</span>
									</span>
									<span className="block text-xs text-slate-600 mt-1 leading-tight truncate">
										{r.detail}
									</span>
								</div>
							</div>
						))}

						{canEdit && (
							<div className="flex">
								{isAcc ? (
									<AlertDialog>
										<AlertDialogTrigger
											render={
												<Button
													variant="outline"
													disabled={isAccSaving}
													className="w-full h-full min-h-[58px] rounded-xl border-rose-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-700 text-sm font-semibold shadow-2xs transition-all"
												/>
											}
										>
											Batalkan ACC
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Konfirmasi Pembatalan ACC PMB
												</AlertDialogTitle>
												<AlertDialogDescription>
													Apakah Anda yakin ingin membatalkan status ACC untuk
													panel PMB mahasiswa ini? Status PMB akan kembali ke
													tahap berproses.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<div className="flex justify-end gap-2">
												<AlertDialogCancel>Batal</AlertDialogCancel>
												<AlertDialogAction onClick={handleCancelAcc}>
													Ya, batalkan ACC
												</AlertDialogAction>
											</div>
										</AlertDialogContent>
									</AlertDialog>
								) : (
									accButton("w-full h-full min-h-[58px] rounded-xl")
								)}
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Sub-tab bergaya tombol segmen: jelas bisa diklik, tab aktif menonjol */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full space-y-6"
			>
				<TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 sm:inline-flex sm:w-auto">
					<TabsTrigger
						value="checklist"
						className="min-h-11 h-auto min-w-0 sm:flex-none gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-1.5 sm:px-5 py-2 text-center text-[13px] sm:text-[15px] font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900 data-active:border-slate-200 data-active:bg-white data-active:text-[#0517B0] data-active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40"
					>
						Dokumen
						{tabBadge(
							Boolean(accReq?.dokumen.ok),
							`${accReq?.dokumen.done ?? completed}/${accReq?.dokumen.total ?? PMB_REQUIRED_TOTAL}`,
						)}
					</TabsTrigger>
					<TabsTrigger
						value="finance"
						className="min-h-11 h-auto min-w-0 sm:flex-none gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-1.5 sm:px-5 py-2 text-center text-[13px] sm:text-[15px] font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900 data-active:border-slate-200 data-active:bg-white data-active:text-[#0517B0] data-active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40"
					>
						<span className="sm:hidden">Keuangan</span>
						<span className="hidden sm:inline">Skema Keuangan</span>
						{tabBadge(
							Boolean(accReq?.keuangan.ok),
							accReq?.keuangan.ok ? "✓" : "Belum",
						)}
					</TabsTrigger>
					<TabsTrigger
						value="fee-sharing"
						className="min-h-11 h-auto min-w-0 sm:flex-none gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-1.5 sm:px-5 py-2 text-center text-[13px] sm:text-[15px] font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900 data-active:border-slate-200 data-active:bg-white data-active:text-[#0517B0] data-active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40"
					>
						Fee Sharing
						{tabBadge(
							Boolean(accReq?.feeSharing.ok),
							!accReq || accReq.feeSharing.total === 0
								? "Belum"
								: `${accReq.feeSharing.paid}/${accReq.feeSharing.total}`,
						)}
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
			</Tabs>

			{/* Ponsel: aksi utama menempel di bawah, dalam jangkauan ibu jari */}
			{canEdit && !isAcc && (
				<div className="sm:hidden sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
					{accButton("w-full")}
				</div>
			)}
		</div>
	);
}
