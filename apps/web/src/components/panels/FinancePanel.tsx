"use client";

import {
	AlertCircle,
	CheckCircle,
	Clock,
	DollarSign,
	Eye,
	FileText,
	Loader2,
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
	const canEdit = isFinanceAdmin || isSuperadmin;

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [finState, setFinState] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});

	const [notes, setNotes] = useState("");
	const [isSavingNotes, setIsSavingNotes] = useState(false);
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

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

	const renderSummaryCard = (title: string, isOk: boolean, amount: number) => {
		const bg = isOk
			? "bg-emerald-950/10 border-emerald-500/30"
			: "bg-rose-950/10 border-rose-500/30";
		const text = isOk ? "text-emerald-700" : "text-rose-700";
		const icon = isOk ? "✅ LUNAS" : "❌ BELUM";

		return (
			<div className={`p-4 rounded-xl border ${bg}`}>
				<p className="text-xs font-bold text-slate-500 uppercase mb-1">
					{title}
				</p>
				<h4 className={`text-lg font-bold mb-1 ${text}`}>{icon}</h4>
				<p className={`text-sm font-semibold ${text}`}>
					{formatRupiah(amount)}
				</p>
			</div>
		);
	};

	return (
		<div className="space-y-6">
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="border-b border-slate-200 pb-4">
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
				</CardHeader>
				<CardContent className="pt-6">
					{/* SUMMARY */}
					<div className="mb-8">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							RINGKASAN STATUS PEMBAYARAN
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{renderSummaryCard(
								"Registrasi Awal",
								localChecks.registrationPaid,
								Number(amounts.registrationAmount) || 0,
							)}
							{renderSummaryCard(
								"Semester",
								localChecks.semesterPaid,
								Number(amounts.semesterAmount) || 0,
							)}
							<div
								className={`p-4 rounded-xl border ${localChecks.installmentCleared ? "bg-emerald-950/10 border-emerald-500/30" : "bg-amber-950/10 border-amber-500/30"}`}
							>
								<p className="text-xs font-bold text-slate-500 uppercase mb-1">
									Dana Talangan
								</p>
								<h4
									className={`text-lg font-bold mb-1 ${localChecks.installmentCleared ? "text-emerald-700" : "text-amber-700"}`}
								>
									{localChecks.installmentCleared ? "✅ AMAN" : "⏳ PROSES"}
								</h4>
								<p
									className={`text-sm font-semibold ${localChecks.installmentCleared ? "text-emerald-700" : "text-amber-700"}`}
								>
									{formatRupiah(Number(amounts.installmentAmount) || 0)}
								</p>
							</div>
						</div>
					</div>

					<div className="mb-8 border-t border-slate-200 pt-6">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							DETAIL ITEM KEUANGAN
						</h3>
						<div className="space-y-4">
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
													item.checked ? "text-emerald-900" : "text-slate-700"
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

					<div className="border-t border-slate-200 pt-6">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							CATATAN KEUANGAN
						</h3>
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
				</CardContent>
			</Card>

			{/* Status ACC Card */}
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
													{finState?.accBy?.fullName || "Admin Finance"}
												</span>{" "}
												pada{" "}
												{new Date(finState.accAt).toLocaleString("id-ID", {
													dateStyle: "medium",
													timeStyle: "short",
												})}{" "}
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
														{isSavingNotes ? "Membatalkan..." : "Batalkan ACC"}
													</Button>
												}
											/>
											<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
												<AlertDialogTitle>
													Konfirmasi Pembatalan ACC Finance
												</AlertDialogTitle>
												<AlertDialogDescription className="text-slate-500">
													Apakah Anda yakin ingin membatalkan status ACC untuk
													panel Finance ini? Status mahasiswa akan kembali ke
													tahap proses.
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
								<TooltipTrigger render={<span className="inline-block" />}>
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
														Anda akan memberikan persetujuan final untuk status
														keuangan mahasiswa ini. Pastikan semua bukti
														pembayaran telah divalidasi.
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
										Selesaikan semua pembayaran/tunggakan terlebih dahulu
									</TooltipContent>
								)}
							</Tooltip>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
