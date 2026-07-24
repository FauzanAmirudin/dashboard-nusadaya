"use client";

import {
	AlertCircle,
	CheckCircle,
	Clock,
	DollarSign,
	Download,
	Eye,
	FileText,
	Loader2,
	Save,
	Trash2,
	UploadCloud,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { VocationalBudgetTab } from "./VocationalBudgetTab";

interface DocFile {
	id: number;
	documentKey: string;
	fileName: string;
	fileUrl: string;
	uploadedAt: string;
	isVerified: boolean;
	verifiedAt: string | null;
}

interface FinancePanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function FinancePanel({ studentId, onUpdate }: FinancePanelProps) {
	const { user, token } = useAuthStore();
	const isFinanceAdmin =
		user?.role === "finance" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const isMagang = user?.role === "magang";
	const canEdit = isFinanceAdmin || isSuperadmin;

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [finState, setFinState] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});

	const [notes, setNotes] = useState("");
	const [isSavingNotes, setIsSavingNotes] = useState(false);
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const [activeTab, setActiveTab] = useState<
		"keuangan" | "dana-talangan" | "fee-mitra" | "anggaran-vokasi"
	>("keuangan");

	const [localChecks, setLocalChecks] = useState({
		registrationPaid: false,
		semesterPaid: false,
		installmentCleared: false,
		arrearsCleared: false,
	});

	const [amounts, setAmounts] = useState<Record<string, number | string>>({
		registrationAmount: 0,
		semesterAmount: 0,
		installmentAmount: 0,
		arrearsAmount: 0,
	});

	const [dates, setDates] = useState({
		registrationDate: "",
		semesterDate: "",
		installmentDate: "",
	});

	// V Mitra & V Koordinator
	const [vMitra, setVMitra] = useState(0);
	const [vKoordinator, setVKoordinator] = useState(0);

	// Dana Talangan 2-Tahap
	const [danaForm, setDanaForm] = useState({
		danaTalaganProvider: "",
		danaTalaganProviderType: "dalam_negeri",
		danaT1Amount: 0,
		danaT1Date: "",
		danaT1Notes: "",
		isDanaT1Disbursed: false,
		danaT2Amount: 0,
		danaT2Date: "",
		danaT2Notes: "",
		isDanaT2Disbursed: false,
	});
	const [visaReady, setVisaReady] = useState(false);
	const [pmbPaymentData, setPmbPaymentData] = useState<any>(null);

	const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

	const fetchInternshipStatus = async () => {
		try {
			const { data } =
				await api.students[studentId.toString()].internship.get();
			if (data?.success) setVisaReady(data.data?.visaReady || false);
		} catch (e) {
			console.error("Failed to fetch internship status");
		}
	};

	const fetchPmbData = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].pmb.get();
			if (!error && data?.success) {
				setPmbPaymentData(data.data?.paymentPlan || null);
			}
		} catch (err) {
			console.error("Failed to fetch PMB data", err);
		}
	};

	const fetchFinanceData = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].finance.get();
			if (!error && data?.success) {
				setFinState(data.data);
			}
		} catch (err) {
			console.error("Failed to fetch finance data", err);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDocuments = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].finance.documents.get();
			if (!error && data?.success) {
				setDocuments(data.data as any);
			}
		} catch (err) {
			console.error("Failed to fetch documents", err);
		}
	};

	useEffect(() => {
		fetchFinanceData();
		fetchDocuments();
		fetchInternshipStatus();
		fetchPmbData();
	}, [studentId]);

	useEffect(() => {
		if (finState) {
			setLocalChecks({
				registrationPaid: !!finState.registrationPaid,
				semesterPaid: !!finState.semesterPaid,
				installmentCleared: !!finState.installmentCleared,
				arrearsCleared: !!finState.arrearsCleared,
			});
			setNotes(finState.notes || "");
			setAmounts({
				registrationAmount: finState.registrationAmount || 0,
				semesterAmount: finState.semesterAmount || 0,
				installmentAmount: finState.installmentAmount || 0,
				arrearsAmount: finState.arrearsAmount || 0,
			});
			setDates({
				registrationDate: finState.registrationDate
					? new Date(finState.registrationDate).toISOString().split("T")[0]
					: "",
				semesterDate: finState.semesterDate
					? new Date(finState.semesterDate).toISOString().split("T")[0]
					: "",
				installmentDate: finState.installmentDate
					? new Date(finState.installmentDate).toISOString().split("T")[0]
					: "",
			});
			setVMitra(finState.vMitra || 0);
			setVKoordinator(finState.vKoordinator || 0);
			setDanaForm({
				danaTalaganProvider: finState.danaTalaganProvider || "",
				danaTalaganProviderType:
					finState.danaTalaganProviderType || "dalam_negeri",
				danaT1Amount: finState.danaT1Amount || 0,
				danaT1Date: finState.danaT1Date
					? new Date(finState.danaT1Date).toISOString().split("T")[0]
					: "",
				danaT1Notes: finState.danaT1Notes || "",
				isDanaT1Disbursed: !!finState.isDanaT1Disbursed,
				danaT2Amount: finState.danaT2Amount || 0,
				danaT2Date: finState.danaT2Date
					? new Date(finState.danaT2Date).toISOString().split("T")[0]
					: "",
				danaT2Notes: finState.danaT2Notes || "",
				isDanaT2Disbursed: !!finState.isDanaT2Disbursed,
			});
		}
	}, [finState]);

	const formatRupiah = (val: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	};

	const checklist = [
		{
			id: "registrationPaid",
			label: "Registrasi Awal Lunas",
			desc: "Pembayaran registrasi awal terpenuhi",
			checked: localChecks.registrationPaid,
			hasAmount: true,
			amountKey: "registrationAmount",
			dateKey: "registrationDate",
		},
		{
			id: "semesterPaid",
			label: "Semester Lunas",
			desc: "Tagihan semester berjalan lunas",
			checked: localChecks.semesterPaid,
			hasAmount: true,
			amountKey: "semesterAmount",
			dateKey: "semesterDate",
		},
		{
			id: "installmentCleared",
			label: "Dana Talangan (Lunas/Aktif)",
			desc: "Tidak ada masalah dengan cicilan dana talangan",
			checked: localChecks.installmentCleared,
			hasAmount: true,
			amountKey: "installmentAmount",
			dateKey: "installmentDate",
		},
		{
			id: "arrearsCleared",
			label: "Tunggakan Bersih",
			desc: "Tidak ada tunggakan aktif sama sekali",
			checked: localChecks.arrearsCleared,
			hasAmount: true,
			amountKey: "arrearsAmount",
			dateKey: null,
		},
	];

	const isReadyForProcess = checklist.every((c) => c.checked);

	let statusBadge = (
		<Badge className="bg-rose-50 text-rose-600 border-rose-200">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (isReadyForProcess) {
		statusBadge = (
			<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
				🟢 AMAN
			</Badge>
		);
	} else if (localChecks.registrationPaid || localChecks.semesterPaid) {
		statusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;

		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked })); // optimistic
		setLoadingItem(id);

		try {
			const { error } = await api.students[studentId.toString()].finance.patch({
				[id]: checked,
			});
			if (!error) {
				toast.success("Berhasil disimpan");
				fetchFinanceData();
				onUpdate();
			} else {
				setLocalChecks(prevState);
				toast.error("Gagal menyimpan perubahan");
			}
		} catch (e) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan");
		} finally {
			setLoadingItem(null);
		}
	};

	const handleSaveAmountDate = async (id: string) => {
		if (!canEdit) return;

		const item = checklist.find((c) => c.id === id);
		if (!item) return;

		const payload: Record<string, any> = {};
		if (item.amountKey)
			payload[item.amountKey] =
				Number(amounts[item.amountKey as keyof typeof amounts]) || 0;
		if (item.dateKey && dates[item.dateKey as keyof typeof dates]) {
			payload[item.dateKey] = new Date(
				dates[item.dateKey as keyof typeof dates],
			).toISOString();
		}

		try {
			const { error } =
				await api.students[studentId.toString()].finance.patch(payload);
			if (!error) {
				toast.success("Data keuangan berhasil disimpan");
				fetchFinanceData();
				onUpdate();
			} else {
				toast.error("Gagal menyimpan data");
			}
		} catch (e) {
			toast.error("Gagal menyimpan data");
		}
	};

	const handleSaveNotes = async () => {
		if (!canEdit) return;
		setIsSavingNotes(true);
		try {
			const { error } = await api.students[studentId.toString()].finance.patch({
				notes,
			});
			if (!error) {
				toast.success("Catatan keuangan disimpan");
				fetchFinanceData();
				onUpdate();
			} else {
				toast.error("Gagal menyimpan catatan");
			}
		} catch (e) {
			toast.error("Gagal menyimpan catatan");
		} finally {
			setIsSavingNotes(false);
		}
	};

	const handleSaveFeeSharing = async () => {
		if (!canEdit) return;
		try {
			const { error } = await api.students[studentId.toString()].finance.patch({
				vMitra,
				vKoordinator,
			});
			if (!error) {
				toast.success("Data fee sharing berhasil disimpan");
				fetchFinanceData();
			} else toast.error("Gagal menyimpan fee sharing");
		} catch (e) {
			toast.error("Gagal menyimpan fee sharing");
		}
	};

	const handleSaveDanaTalangan = async () => {
		if (!canEdit && !isMagang) return;
		const payload: any = { ...danaForm };

		if (danaForm.danaT1Date) {
			payload.danaT1Date = new Date(danaForm.danaT1Date).toISOString();
		} else {
			payload.danaT1Date = null;
		}

		if (danaForm.danaT2Date) {
			payload.danaT2Date = new Date(danaForm.danaT2Date).toISOString();
		} else {
			payload.danaT2Date = null;
		}

		try {
			const { error } =
				await api.students[studentId.toString()].finance.patch(payload);
			if (!error) {
				toast.success("Data Dana Talangan berhasil disimpan");
				fetchFinanceData();
			} else toast.error("Gagal menyimpan Dana Talangan");
		} catch (e) {
			toast.error("Gagal menyimpan Dana Talangan");
		}
	};

	const handleDownloadInvoice = () => {
		window.open(
			`${API_URL}/students/${studentId}/finance/invoice/download`,
			"_blank",
		);
	};

	const handleDeleteInvoice = async () => {
		if (!confirm("Hapus invoice ini?")) return;
		try {
			const { error } =
				await api.students[studentId.toString()].finance.invoice.delete();
			if (!error) {
				toast.success("Invoice berhasil dihapus");
				fetchFinanceData();
			} else toast.error("Gagal menghapus invoice");
		} catch (e) {
			toast.error("Gagal menghapus invoice");
		}
	};

	const handleAcc = async () => {
		if (!isFinanceAdmin) return;
		try {
			const { error } =
				await api.students[studentId.toString()].finance.acc.post();
			if (!error) {
				toast.success("ACC Finance berhasil dicatat");
				fetchFinanceData();
				onUpdate();
			} else {
				toast.error("Gagal memberikan ACC");
			}
		} catch (e) {
			toast.error("Gagal memberikan ACC");
		}
	};

	const handleCancelAcc = async () => {
		if (!isFinanceAdmin) return;
		setIsSavingNotes(true);
		try {
			const { error } =
				await api.students[studentId.toString()].finance.acc.delete();
			if (error) throw new Error("Gagal membatalkan ACC");
			toast.success("ACC Finance berhasil dibatalkan");
			fetchFinanceData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal membatalkan ACC");
		} finally {
			setIsSavingNotes(false);
		}
	};

	const handleViewDocument = (docId: number) => {
		window.open(
			`${API_URL}/students/${studentId}/finance/documents/${docId}/download`,
			"_blank",
		);
	};

	const handleVerifyDocument = async (docId: number) => {
		if (!canEdit) return;
		try {
			const { error } =
				await api.students[studentId.toString()].finance.documents[
					docId.toString()
				].verify.patch();
			if (!error) {
				toast.success("Dokumen ditandai terverifikasi");
				fetchDocuments();
			} else {
				toast.error("Gagal memverifikasi dokumen");
			}
		} catch (e) {
			toast.error("Gagal memverifikasi dokumen");
		}
	};

	const handleDeleteDocument = async (docId: number) => {
		if (!canEdit) return;
		if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;
		try {
			const { error } =
				await api.students[studentId.toString()].finance.documents[
					docId.toString()
				].delete();
			if (!error) {
				toast.success("Dokumen berhasil dihapus");
				fetchDocuments();
			} else {
				toast.error("Gagal menghapus dokumen");
			}
		} catch (e) {
			toast.error("Gagal menghapus dokumen");
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<div className="border-b border-slate-200 pb-4 mb-6">
					<div className="flex justify-between items-center">
						<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
							<span className="text-xl">💰</span> Finance — Status Keuangan
						</CardTitle>
						<div className="flex items-center gap-3">
							<Badge
								variant="outline"
								className="border-slate-200 text-slate-500 bg-white"
							>
								Dikelola oleh: Admin Finance
							</Badge>
							{statusBadge}
						</div>
					</div>
					<div className="mt-3">
						{(() => {
							const completedCount =
								Object.values(localChecks).filter(Boolean).length;
							const progressPercent = (completedCount / 4) * 100;
							return (
								<>
									<div className="flex justify-between text-xs text-slate-500 mb-1">
										<span>Total Progress Kelengkapan Keuangan</span>
										<span className="font-semibold">
											{completedCount}/4 Item ({progressPercent.toFixed(0)}%)
										</span>
									</div>
									<div className="w-full bg-slate-200 rounded-full h-2">
										<div
											className={`h-2 rounded-full transition-all duration-500 ${
												progressPercent === 100
													? "bg-emerald-500"
													: progressPercent >= 50
														? "bg-amber-400"
														: "bg-rose-400"
											}`}
											style={{ width: `${progressPercent}%` }}
										/>
									</div>
								</>
							);
						})()}
					</div>
				</div>

				{/* TAB NAVIGATION */}
				<div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
					<Button
						variant={activeTab === "keuangan" ? "default" : "outline"}
						className={
							activeTab === "keuangan"
								? "bg-slate-800 text-white hover:bg-slate-700"
								: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
						}
						onClick={() => setActiveTab("keuangan")}
					>
						Keuangan Mahasiswa
					</Button>

					<Button
						variant={activeTab === "dana-talangan" ? "default" : "outline"}
						className={
							activeTab === "dana-talangan"
								? "bg-slate-800 text-white hover:bg-slate-700"
								: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
						}
						onClick={() => setActiveTab("dana-talangan")}
					>
						Dana Talangan
					</Button>

					<Button
						variant={activeTab === "fee-mitra" ? "default" : "outline"}
						className={
							activeTab === "fee-mitra"
								? "bg-slate-800 text-white hover:bg-slate-700"
								: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
						}
						onClick={() => setActiveTab("fee-mitra")}
					>
						Fee Mitra & Invoice
					</Button>

					<Button
						variant={activeTab === "anggaran-vokasi" ? "default" : "outline"}
						className={
							activeTab === "anggaran-vokasi"
								? "bg-slate-800 text-white hover:bg-slate-700"
								: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
						}
						onClick={() => setActiveTab("anggaran-vokasi")}
					>
						Anggaran Praktik Vokasi
					</Button>
				</div>

				<div>
					{/* TAB 1: KEUANGAN MAHASISWA */}
					{activeTab === "keuangan" && (
						<>
							{/* FEE SHARING SECTION (Moved to Tab 3) */}

							<div className="mb-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
								<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
										DETAIL ITEM KEUANGAN
									</h3>
								</div>
								<div className="p-5 space-y-4">
									{checklist.map((item) => (
										<div
											key={item.id}
											className="flex flex-col rounded-lg border bg-white overflow-hidden border-slate-200 mb-4"
										>
											<div
												className={`flex items-center gap-4 p-4 transition-colors border-b ${
													item.checked
														? "bg-emerald-50 border-emerald-200"
														: "bg-slate-50 border-slate-200"
												}`}
											>
												<Checkbox
													id={item.id}
													checked={item.checked}
													onCheckedChange={(c) =>
														handleCheckboxChange(item.id, c as boolean)
													}
													disabled={!canEdit || loadingItem === item.id}
													className={`w-6 h-6 rounded-md ${
														item.checked
															? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
															: ""
													}`}
												/>
												<label
													htmlFor={item.id}
													className="flex-1 cursor-pointer block"
												>
													<div
														className={`text-base font-semibold block ${
															item.checked
																? "text-emerald-900"
																: "text-slate-700"
														}`}
													>
														{item.label}
														{loadingItem === item.id && (
															<Loader2 className="w-3 h-3 text-emerald-600 animate-spin ml-2 inline" />
														)}
													</div>
													<p
														className={`text-sm ${
															item.checked
																? "text-emerald-700/80"
																: "text-slate-500"
														}`}
													>
														{item.desc}
													</p>
												</label>
												<div>
													{item.checked ? (
														<CheckCircle className="w-6 h-6 text-emerald-500" />
													) : (
														<div className="w-6 h-6 rounded-full border-2 border-slate-300" />
													)}
												</div>
											</div>
											<div className="p-4 bg-white border-t border-slate-100">
												<div className="flex items-center justify-between mb-2">
													<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
														<FileText className="w-4 h-4" />
														Lampiran Bukti Pembayaran
													</span>
												</div>
												<DocumentUpload
													studentId={studentId}
													panel="finance"
													documentKey={item.id}
													canEdit={canEdit}
												/>
											</div>
										</div>
									))}

									{/* Auto-calculated 5th item */}
									<div
										className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 border ${
											isReadyForProcess
												? "bg-blue-50 border-blue-200"
												: "bg-rose-50 border-rose-200"
										}`}
									>
										<div className="w-6 h-6 flex items-center justify-center">
											{isReadyForProcess ? (
												<CheckCircle className="w-6 h-6 text-[#0517B0]" />
											) : (
												<XCircle className="w-6 h-6 text-rose-500" />
											)}
										</div>
										<div className="flex-1">
											<label
												className={`text-base font-bold block ${isReadyForProcess ? "text-[#0517B0]" : "text-rose-700"}`}
											>
												Layak Lanjut Proses
											</label>
											<p
												className={`text-sm ${isReadyForProcess ? "text-blue-700/80" : "text-rose-500"}`}
											>
												{isReadyForProcess
													? "Semua persyaratan keuangan telah terpenuhi"
													: "Tidak layak — masih ada tunggakan atau tagihan aktif"}
											</p>
										</div>
									</div>
								</div>
							</div>

							<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
								<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
										CATATAN KEUANGAN
									</h3>
								</div>
								<div className="p-5">
									<Textarea
										placeholder="Tambahkan catatan khusus terkait keuangan mahasiswa ini..."
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										disabled={!canEdit || finState?.isAcc}
										className="min-h-[100px] bg-slate-50 resize-y mb-4"
									/>
									{canEdit && !finState?.isAcc && (
										<div className="flex justify-end">
											<Button
												onClick={handleSaveNotes}
												disabled={isSavingNotes}
												className="bg-slate-800 hover:bg-slate-700 text-white"
											>
												{isSavingNotes && (
													<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												)}
												Simpan Catatan
											</Button>
										</div>
									)}
								</div>
							</div>

							{/* Status ACC Card */}
							<div className="mt-8">
								<Card className="bg-slate-50 border-slate-200 shadow-sm overflow-hidden">
									<CardContent className="p-0">
										<div className="flex flex-col sm:flex-row items-center justify-between p-6">
											<div className="flex flex-1 items-center gap-4 mb-4 sm:mb-0 w-full">
												{finState?.isAcc ? (
													<div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
														<div className="flex items-center gap-4">
															<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
																<CheckCircle className="w-6 h-6 text-emerald-600" />
															</div>
															<div>
																<h4 className="text-emerald-700 font-bold text-lg">
																	✅ ACC Finance Diberikan
																</h4>
																<p className="text-sm text-slate-600">
																	Oleh{" "}
																	<span className="font-semibold">
																		{finState?.accBy?.fullName ||
																			"Admin Finance"}
																	</span>{" "}
																	pada{" "}
																	{new Date(finState.accAt).toLocaleString(
																		"id-ID",
																		{
																			dateStyle: "medium",
																			timeStyle: "short",
																		},
																	)}{" "}
																	WIB
																</p>
															</div>
														</div>
														{isFinanceAdmin && (
															<AlertDialog>
																<AlertDialogTrigger
																	render={
																		<Button
																			variant="outline"
																			className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
																			disabled={isSavingNotes}
																		>
																			{isSavingNotes
																				? "Membatalkan..."
																				: "Batalkan ACC"}
																		</Button>
																	}
																/>
																<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
																	<AlertDialogTitle>
																		Konfirmasi Pembatalan ACC Finance
																	</AlertDialogTitle>
																	<AlertDialogDescription className="text-slate-500">
																		Apakah Anda yakin ingin membatalkan status
																		ACC untuk panel Finance ini? Status
																		mahasiswa akan kembali ke tahap proses.
																	</AlertDialogDescription>
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
													</div>
												) : (
													<>
														<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
															<Clock className="w-6 h-6 text-slate-500" />
														</div>
														<div>
															<h4 className="text-slate-700 font-bold text-lg">
																{isReadyForProcess
																	? "⏳ Menunggu ACC Finance"
																	: "🔒 ACC Finance Terkunci"}
															</h4>
															<p className="text-sm text-slate-500 max-w-md">
																{isReadyForProcess
																	? "Status aman, siap untuk memberikan persetujuan."
																	: `Masih ada tunggakan aktif atau pembayaran belum lunas. Selesaikan semua pembayaran terlebih dahulu.`}
															</p>
														</div>
													</>
												)}
											</div>

											{canEdit && !finState?.isAcc && (
												<Tooltip>
													<TooltipTrigger
														render={<span className="inline-block" />}
													>
														<span>
															<AlertDialog>
																<AlertDialogTrigger
																	disabled={!isReadyForProcess}
																	className="w-full sm:w-auto bg-[#0517B0] hover:bg-blue-800 text-white font-bold px-8 py-2 rounded-md shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
																>
																	✔ ACC Finance →
																</AlertDialogTrigger>
																<AlertDialogContent>
																	<AlertDialogTitle>
																		Konfirmasi ACC Finance
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		<span className="mt-2 text-slate-600 block">
																			Anda akan memberikan persetujuan final
																			untuk status keuangan mahasiswa ini.
																			Pastikan semua bukti pembayaran telah
																			divalidasi.
																		</span>
																	</AlertDialogDescription>
																	<div className="flex justify-end gap-3 mt-4">
																		<AlertDialogCancel className="border-slate-200">
																			Batal
																		</AlertDialogCancel>
																		<AlertDialogAction
																			onClick={handleAcc}
																			className="bg-[#0517B0] hover:bg-blue-800 text-white"
																		>
																			Ya, Lanjut ACC
																		</AlertDialogAction>
																	</div>
																</AlertDialogContent>
															</AlertDialog>
														</span>
													</TooltipTrigger>
													{!isReadyForProcess && (
														<TooltipContent>
															Selesaikan semua pembayaran/tunggakan terlebih
															dahulu
														</TooltipContent>
													)}
												</Tooltip>
											)}
										</div>
									</CardContent>
								</Card>
							</div>
						</>
					)}

					{/* TAB 2: DANA TALANGAN */}
					{activeTab === "dana-talangan" && (
						<>
							{/* DANA TALANGAN 2-TAHAP */}

							<div className="mb-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
								<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
										🏦 Dana Talangan — Sinkronisasi 2 Tahap
									</h3>
								</div>

								{pmbPaymentData && (
									<div className="bg-slate-50 border-b border-slate-200 p-4 mx-5 mt-5 rounded-lg border">
										<h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
											📋 Konteks PMB — Skema Keuangan Awal (Read-Only)
										</h4>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
											<div>
												<span className="text-[10px] text-slate-500 block">
													Total Biaya
												</span>
												<span className="text-sm font-bold">
													{formatRupiah(pmbPaymentData.totalBiaya || 0)}
												</span>
											</div>
											<div>
												<span className="text-[10px] text-slate-500 block">
													Total DP
												</span>
												<span className="text-sm font-bold">
													{formatRupiah(pmbPaymentData.totalDp || 0)}
												</span>
											</div>
											<div>
												<span className="text-[10px] text-slate-500 block">
													Termin 2 (
													{pmbPaymentData.janjiTahap2
														? new Date(
																pmbPaymentData.janjiTahap2,
															).toLocaleDateString("id-ID", {
																day: "numeric",
																month: "short",
															})
														: "-"}
													)
												</span>
												<span className="text-sm font-bold">
													{formatRupiah(pmbPaymentData.janjiTahap2Nominal || 0)}
												</span>
											</div>
											<div>
												<span className="text-[10px] text-slate-500 block">
													Termin 3 (
													{pmbPaymentData.janjiTahap3
														? new Date(
																pmbPaymentData.janjiTahap3,
															).toLocaleDateString("id-ID", {
																day: "numeric",
																month: "short",
															})
														: "-"}
													)
												</span>
												<span className="text-sm font-bold">
													{formatRupiah(pmbPaymentData.janjiTahap3Nominal || 0)}
												</span>
											</div>
										</div>

										{pmbPaymentData.pengajuanDanaTalangan ? (
											<div className="bg-amber-50 border border-amber-200 rounded-md p-3">
												<div className="flex items-center gap-2 text-amber-700 mb-1">
													<AlertCircle className="w-4 h-4" />
													<span className="text-xs font-bold uppercase tracking-wider">
														Ada Pengajuan Dana Talangan dari PMB
													</span>
												</div>
												<p className="text-sm text-amber-900 whitespace-pre-wrap">
													{pmbPaymentData.pengajuanDanaTalangan}
												</p>
											</div>
										) : (
											<div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-center gap-2 text-emerald-700">
												<CheckCircle className="w-4 h-4" />
												<span className="text-xs font-bold uppercase tracking-wider">
													Tidak Ada Pengajuan Dana Talangan di PMB
												</span>
											</div>
										)}
									</div>
								)}

								{/* SUMMARY KEUANGAN DANA TALANGAN (READ-ONLY) */}
								<div className="bg-blue-50/30 border border-blue-200 p-4 mx-5 mt-5 rounded-lg">
									<h4 className="text-[11px] font-bold text-blue-700 uppercase mb-3">
										💳 Ringkasan Dana Talangan Tersimpan (Read-Only)
									</h4>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div>
											<span className="text-[10px] text-blue-500 block uppercase font-bold tracking-wider mb-0.5">
												Total Dana Terpakai
											</span>
											<span className="text-sm font-bold text-slate-800">
												{formatRupiah(
													(finState?.danaT1Amount || 0) +
														(finState?.danaT2Amount || 0),
												)}
											</span>
										</div>
										<div>
											<span className="text-[10px] text-blue-500 block uppercase font-bold tracking-wider mb-0.5">
												Penyedia Dana
											</span>
											<span className="text-sm font-bold text-slate-800">
												{finState?.danaTalaganProvider || "-"}
											</span>
										</div>
										<div>
											<span className="text-[10px] text-blue-500 block uppercase font-bold tracking-wider mb-0.5">
												Tahap 1 (Pendidikan)
											</span>
											<div className="flex items-center gap-1.5 mt-0.5">
												<span className="text-sm font-bold text-slate-800">
													{formatRupiah(finState?.danaT1Amount || 0)}
												</span>
												{finState?.isDanaT1Disbursed ? (
													<Badge className="bg-emerald-100 text-emerald-700 text-[10px] py-0 px-1.5 border-0 rounded">
														Cair
													</Badge>
												) : (
													<Badge className="bg-amber-100 text-amber-700 text-[10px] py-0 px-1.5 border-0 rounded">
														Pending
													</Badge>
												)}
											</div>
										</div>
										<div>
											<span className="text-[10px] text-blue-500 block uppercase font-bold tracking-wider mb-0.5">
												Tahap 2 (Pemagangan)
											</span>
											<div className="flex items-center gap-1.5 mt-0.5">
												<span className="text-sm font-bold text-slate-800">
													{formatRupiah(finState?.danaT2Amount || 0)}
												</span>
												{finState?.isDanaT2Disbursed ? (
													<Badge className="bg-emerald-100 text-emerald-700 text-[10px] py-0 px-1.5 border-0 rounded">
														Cair
													</Badge>
												) : (
													<Badge className="bg-amber-100 text-amber-700 text-[10px] py-0 px-1.5 border-0 rounded">
														Pending
													</Badge>
												)}
											</div>
										</div>
									</div>
								</div>

								<div className="p-5 space-y-5">
									{/* Penyedia */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="text-xs font-semibold block mb-1">
												Penyedia Dana Talangan
											</label>
											<select
												className="w-full text-sm border-slate-200 rounded-md p-2 bg-slate-50"
												value={danaForm.danaTalaganProvider}
												onChange={(e) =>
													setDanaForm({
														...danaForm,
														danaTalaganProvider: e.target.value,
													})
												}
												disabled={!canEdit && !isMagang}
											>
												<option value="">Pilih Penyedia...</option>
												<option value="Bank Tara">Bank Tara</option>
												<option value="Bengtara">Bengtara</option>
												<option value="Dana LN">Dana LN</option>
												<option value="Lainnya">Lainnya</option>
											</select>
										</div>
										<div>
											<label className="text-xs font-semibold block mb-1">
												Tipe Penyedia
											</label>
											<select
												className="w-full text-sm border-slate-200 rounded-md p-2 bg-slate-50"
												value={danaForm.danaTalaganProviderType}
												onChange={(e) =>
													setDanaForm({
														...danaForm,
														danaTalaganProviderType: e.target.value,
													})
												}
												disabled={!canEdit && !isMagang}
											>
												<option value="dalam_negeri">🇮🇩 Dalam Negeri</option>
												<option value="luar_negeri">🌏 Luar Negeri</option>
											</select>
										</div>
									</div>

									{/* Tahap 1 */}
									<div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
										<div className="flex items-center gap-2 mb-3">
											<span className="text-sm font-bold text-blue-800">
												Tahap I — Biaya Pendidikan Kampus
											</span>
											<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
												Selalu Tersedia
											</Badge>
										</div>
										<div className="grid grid-cols-2 gap-3">
											<div>
												<label className="text-xs font-semibold text-blue-600 block mb-1">
													Nominal (Rp)
												</label>
												<Input
													type="number"
													value={danaForm.danaT1Amount}
													onChange={(e) =>
														setDanaForm({
															...danaForm,
															danaT1Amount: Number(e.target.value),
														})
													}
													disabled={!canEdit && !isMagang}
													className="bg-white"
												/>
											</div>
											<div>
												<label className="text-xs font-semibold text-blue-600 block mb-1">
													Tanggal Pencairan
												</label>
												<Input
													type="date"
													value={danaForm.danaT1Date}
													onChange={(e) =>
														setDanaForm({
															...danaForm,
															danaT1Date: e.target.value,
														})
													}
													disabled={!canEdit && !isMagang}
													className="bg-white"
												/>
											</div>
											<div className="col-span-2">
												<label className="text-xs font-semibold text-blue-600 block mb-1">
													Catatan
												</label>
												<Input
													value={danaForm.danaT1Notes}
													onChange={(e) =>
														setDanaForm({
															...danaForm,
															danaT1Notes: e.target.value,
														})
													}
													placeholder="Catatan pencairan (opsional)..."
													disabled={!canEdit && !isMagang}
													className="bg-white"
												/>
											</div>
											<div className="col-span-2 flex items-center gap-2 mt-1">
												<Checkbox
													checked={danaForm.isDanaT1Disbursed}
													onCheckedChange={(c) =>
														setDanaForm({
															...danaForm,
															isDanaT1Disbursed: c as boolean,
														})
													}
													disabled={!canEdit && !isMagang}
												/>
												<label className="text-sm font-semibold text-blue-800">
													Tahap I Sudah Dicairkan
												</label>
											</div>
										</div>
									</div>

									{/* Tahap 2 */}
									<div
										className={`p-4 rounded-xl border transition-all ${
											visaReady
												? "bg-emerald-50 border-emerald-200"
												: "bg-slate-100 border-slate-200"
										}`}
									>
										<div className="flex flex-wrap items-center gap-2 mb-3">
											<span
												className={`text-sm font-bold ${visaReady ? "text-emerald-800" : "text-slate-500"}`}
											>
												Tahap II — Biaya Pemagangan
											</span>
											{!visaReady ? (
												<Badge className="bg-rose-100 hover:bg-rose-100 text-rose-600 text-xs">
													🔒 Terkunci — Visa Belum Turun
												</Badge>
											) : (
												<Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 text-xs">
													✅ Terbuka — Visa Sudah Turun
												</Badge>
											)}
										</div>
										{!visaReady && (
											<p className="text-xs text-slate-400 mb-3 italic">
												Field ini hanya dapat diisi setelah status Visa di Panel
												Magang dinyatakan "Turun".
											</p>
										)}
										<div className="grid grid-cols-2 gap-3">
											<div>
												<label className="text-xs font-semibold block mb-1">
													Nominal (Rp)
												</label>
												<Input
													type="number"
													value={danaForm.danaT2Amount}
													onChange={(e) =>
														setDanaForm({
															...danaForm,
															danaT2Amount: Number(e.target.value),
														})
													}
													disabled={!visaReady || (!canEdit && !isMagang)}
													className="bg-white"
												/>
											</div>
											<div>
												<label className="text-xs font-semibold block mb-1">
													Tanggal Pencairan
												</label>
												<Input
													type="date"
													value={danaForm.danaT2Date}
													onChange={(e) =>
														setDanaForm({
															...danaForm,
															danaT2Date: e.target.value,
														})
													}
													disabled={!visaReady || (!canEdit && !isMagang)}
													className="bg-white"
												/>
											</div>
											<div className="col-span-2">
												<Input
													value={danaForm.danaT2Notes}
													onChange={(e) =>
														setDanaForm({
															...danaForm,
															danaT2Notes: e.target.value,
														})
													}
													placeholder="Catatan pencairan tahap 2..."
													disabled={!visaReady || (!canEdit && !isMagang)}
													className="bg-white"
												/>
											</div>
											<div className="col-span-2 flex items-center gap-2 mt-1">
												<Checkbox
													checked={danaForm.isDanaT2Disbursed}
													onCheckedChange={(c) =>
														setDanaForm({
															...danaForm,
															isDanaT2Disbursed: c as boolean,
														})
													}
													disabled={!visaReady || (!canEdit && !isMagang)}
												/>
												<label className="text-sm font-semibold">
													Tahap II Sudah Dicairkan
												</label>
											</div>
										</div>
									</div>

									{(canEdit || isMagang) && (
										<div className="flex justify-end">
											<Button
												onClick={handleSaveDanaTalangan}
												className="bg-teal-600 hover:bg-teal-700 text-white"
											>
												Simpan Data Dana Talangan
											</Button>
										</div>
									)}
								</div>
							</div>
						</>
					)}

					{/* TAB 3: FEE MITRA */}
					{activeTab === "fee-mitra" && (
						<>
							<div className="mb-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
								<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
										💼 Fee Sharing — Biaya Mitra & Koordinator
									</h3>
								</div>
								<div className="p-5">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
										<div>
											<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
												V Mitra (Biaya Reseller)
											</label>
											<Input
												type="number"
												placeholder="0"
												value={vMitra}
												onChange={(e) => setVMitra(Number(e.target.value))}
												disabled={!canEdit}
												className="bg-slate-50"
											/>
											<p className="text-xs text-slate-400 mt-1">
												{formatRupiah(vMitra)}
											</p>
										</div>
										<div>
											<label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
												V Koordinator
											</label>
											<Input
												type="number"
												placeholder="0"
												value={vKoordinator}
												onChange={(e) =>
													setVKoordinator(Number(e.target.value))
												}
												disabled={!canEdit}
												className="bg-slate-50"
											/>
											<p className="text-xs text-slate-400 mt-1">
												{formatRupiah(vKoordinator)}
											</p>
										</div>
									</div>
									{canEdit && (
										<div className="flex justify-end">
											<Button
												size="sm"
												onClick={handleSaveFeeSharing}
												className="bg-slate-800 hover:bg-slate-700 text-white"
											>
												Simpan Fee Sharing
											</Button>
										</div>
									)}
								</div>
							</div>

							{/* INVOICE PMB SECTION */}
							<div className="mb-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
								<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
									<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
										📄 Invoice Pembayaran Mitra / Koordinator
									</h3>
								</div>
								<div className="p-5">
									{finState?.invoiceFileName ? (
										<div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-4 gap-4">
											<div className="flex items-center gap-3">
												<FileText className="w-8 h-8 text-emerald-600" />
												<div>
													<p className="text-sm font-bold text-emerald-800">
														{finState.invoiceFileName}
													</p>
													<p className="text-xs text-slate-500">
														Diunggah:{" "}
														{finState.invoiceUploadedAt
															? new Date(
																	finState.invoiceUploadedAt,
																).toLocaleDateString("id-ID")
															: "-"}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Button
													onClick={handleDownloadInvoice}
													variant="outline"
													size="sm"
													className="bg-white"
												>
													<Download className="w-4 h-4 mr-2" /> Unduh
												</Button>
												{canEdit && (
													<Button
														onClick={handleDeleteInvoice}
														variant="outline"
														size="sm"
														className="border-rose-200 text-rose-600 hover:bg-rose-50 bg-white"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												)}
											</div>
										</div>
									) : (
										<p className="text-sm text-slate-500 italic mb-4">
											Invoice belum diunggah.
										</p>
									)}

									{canEdit && !finState?.invoiceFileName && (
										<div className="p-4 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center text-center">
											<UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
											<label className="text-sm font-semibold text-slate-600 mb-2 block">
												Upload File Invoice (PDF)
											</label>
											<input
												type="file"
												accept=".pdf"
												className="text-sm w-full max-w-xs cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
												onChange={async (e) => {
													const file = e.target.files?.[0];
													if (!file) return;
													const formData = new FormData();
													formData.append("file", file);
													setIsUploadingInvoice(true);
													try {
														const res = await fetch(
															`${API_URL}/students/${studentId}/finance/invoice`,
															{
																method: "POST",
																headers: { Authorization: `Bearer ${token}` },
																body: formData,
															},
														);
														if (res.ok) {
															toast.success("Invoice berhasil diunggah");
															fetchFinanceData();
														} else toast.error("Gagal mengupload invoice");
													} catch {
														toast.error("Gagal mengupload invoice");
													} finally {
														setIsUploadingInvoice(false);
													}
												}}
											/>
											{isUploadingInvoice && (
												<Loader2 className="w-5 h-5 animate-spin mt-3 text-blue-600" />
											)}
										</div>
									)}
								</div>
							</div>
						</>
					)}

					{/* TAB 4: ANGGARAN VOKASI */}
					{activeTab === "anggaran-vokasi" && <VocationalBudgetTab />}
				</div>
			</div>
		</div>
	);
}
