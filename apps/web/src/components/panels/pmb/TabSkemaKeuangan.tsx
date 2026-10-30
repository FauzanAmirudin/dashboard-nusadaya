"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Activity,
	AlertCircle,
	Building,
	CheckCircle2,
	Clock,
	CreditCard,
	DollarSign,
	Edit2,
	Eye,
	FileText,
	Globe,
	GraduationCap,
	HeartPulse,
	Home,
	Info,
	Languages,
	Loader2,
	Lock,
	Plane,
	RefreshCw,
	Save,
	ShieldCheck,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FilePreviewDialog } from "@/components/panels/finance/FilePreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL, getToken } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";

interface TabSkemaKeuanganProps {
	studentId: number;
	pmbData: any;
	canEdit: boolean;
	onUpdate: () => void;
}

export function TabSkemaKeuangan({
	studentId,
	pmbData,
	canEdit,
	onUpdate,
}: TabSkemaKeuanganProps) {
	const queryClient = useQueryClient();
	const [isSaving, setIsSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [inputWarning, setInputWarning] = useState<string | null>(null);

	const initialTotalBiaya =
		pmbData?.paymentPlan?.totalBiaya && pmbData.paymentPlan.totalBiaya > 0
			? pmbData.paymentPlan.totalBiaya
			: pmbData?.finance?.totalBiayaPendidikan &&
					pmbData.finance.totalBiayaPendidikan > 0
				? pmbData.finance.totalBiayaPendidikan
				: (pmbData?.paymentPlan?.totalBiaya ??
					pmbData?.finance?.totalBiayaPendidikan ??
					0);

	const initialPendaftaranDp =
		pmbData?.paymentPlan?.totalDp && pmbData.paymentPlan.totalDp > 0
			? pmbData.paymentPlan.totalDp
			: pmbData?.paymentPlan?.pendaftaranDp &&
					pmbData.paymentPlan.pendaftaranDp > 0
				? pmbData.paymentPlan.pendaftaranDp
				: (pmbData?.finance?.registrasiNominal ?? 0);

	const [totalBiaya, setTotalBiaya] = useState<number>(initialTotalBiaya);
	const [pendaftaranDp, setPendaftaranDp] =
		useState<number>(initialPendaftaranDp);
	const [dpWarning, setDpWarning] = useState<string | null>(null);
	const [financeDetail, setFinanceDetail] = useState<any>(null);
	const [programDefaults, setProgramDefaults] = useState<any[]>([]);
	const [isRefreshingFinance, setIsRefreshingFinance] = useState(false);
	const [previewModal, setPreviewModal] = useState<{
		open: boolean;
		fileUrl: string | null;
		title: string;
	}>({ open: false, fileUrl: null, title: "" });

	const fetchProgramDefaults = async () => {
		try {
			const res = await fetch(`${API_URL}/settings/program-fee-defaults`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success) setProgramDefaults(json.data || []);
			}
		} catch (e) {
			console.error("Failed to fetch program defaults", e);
		}
	};

	const fetchFinanceData = async (showToast = false) => {
		setIsRefreshingFinance(true);
		try {
			const res = await fetch(`${API_URL}/finance/student/${studentId}`, {
				headers: { Authorization: `Bearer ${getToken()}` },
				cache: "no-store",
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success && json.data) {
					setFinanceDetail(json.data);
					if (json.data.finance?.totalBiayaPendidikan > 0) {
						setTotalBiaya((prev) =>
							prev === 0 ? json.data.finance.totalBiayaPendidikan : prev,
						);
					}
					const incomingDp =
						json.data.paymentPlan?.totalDp ??
						json.data.paymentPlan?.pendaftaranDp ??
						json.data.finance?.registrasiNominal ??
						json.data.pmbDp;
					if (incomingDp !== undefined && incomingDp !== null) {
						setPendaftaranDp((prev) =>
							prev === 0 ? Number(incomingDp) || 0 : prev,
						);
					}
					if (showToast) {
						toast.success("Data pembayaran Finance berhasil diperbarui");
					}
				}
			}
		} catch (error) {
			console.error("Failed to fetch finance tracking data", error);
			if (showToast) {
				toast.error("Gagal memperbarui data dari Finance");
			}
		} finally {
			setIsRefreshingFinance(false);
		}
	};

	useEffect(() => {
		fetchFinanceData();
		fetchProgramDefaults();

		// Menambahkan event listener agar otomatis fetch saat user kembali ke tab browser ini
		const handleFocus = () => {
			fetchFinanceData();
		};

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [studentId]);

	const handleTotalBiayaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;
		// Hanya ambil digit angka 0-9
		const digitsOnly = rawValue.replace(/[^0-9]/g, "");

		if (digitsOnly.length > 9) {
			toast.warning("Maksimal 9 digit angka (maks. Rp 999.999.999)");
			setInputWarning("Input dibatasi maksimal 9 digit (maks. Rp 999.999.999)");
			const trimmed = digitsOnly.slice(0, 9);
			setTotalBiaya(Number(trimmed) || 0);
			return;
		}

		if (rawValue !== digitsOnly && /[^0-9]/.test(rawValue)) {
			toast.warning("Hanya angka (bilangan bulat) yang diperbolehkan");
			setInputWarning("Hanya menerima input angka bilangan bulat (integer)");
		} else {
			setInputWarning(null);
		}

		if (digitsOnly === "") {
			setTotalBiaya(0);
		} else {
			setTotalBiaya(parseInt(digitsOnly, 10) || 0);
		}
	};
	const handleDpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;
		const digitsOnly = rawValue.replace(/[^0-9]/g, "");

		if (digitsOnly.length > 9) {
			toast.warning("Maksimal 9 digit angka (maks. Rp 999.999.999)");
			setDpWarning("Input dibatasi maksimal 9 digit (maks. Rp 999.999.999)");
			const trimmed = digitsOnly.slice(0, 9);
			setPendaftaranDp(Number(trimmed) || 0);
			return;
		}

		if (rawValue !== digitsOnly && /[^0-9]/.test(rawValue)) {
			toast.warning("Hanya angka (bilangan bulat) yang diperbolehkan");
			setDpWarning("Hanya menerima input angka bilangan bulat (integer)");
		} else {
			setDpWarning(null);
		}

		if (digitsOnly === "") {
			setPendaftaranDp(0);
		} else {
			setPendaftaranDp(parseInt(digitsOnly, 10) || 0);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (
			e.key === "-" ||
			e.key === "+" ||
			e.key === "e" ||
			e.key === "E" ||
			e.key === "." ||
			e.key === ","
		) {
			e.preventDefault();
			toast.warning(
				"Hanya angka (integer) tanpa titik/koma/minus yang diperbolehkan",
			);
			setInputWarning(
				"Hanya angka bilangan bulat tanpa minus, titik, atau koma",
			);
		}
	};

	const handleSaveTotalBiaya = async () => {
		if (!canEdit) return;
		if (!Number.isInteger(Number(totalBiaya)) || totalBiaya < 0) {
			toast.error(
				"Total Biaya Pendidikan harus berupa bilangan bulat (integer)",
			);
			return;
		}
		if (totalBiaya > 999_999_999) {
			toast.error("Total Biaya Pendidikan maksimal 9 digit (Rp 999.999.999)");
			return;
		}
		if (!Number.isInteger(Number(pendaftaranDp)) || pendaftaranDp < 0) {
			toast.error(
				"Nominal DP Pendaftaran harus berupa bilangan bulat (integer)",
			);
			return;
		}
		if (pendaftaranDp > 999_999_999) {
			toast.error("Nominal DP Pendaftaran maksimal 9 digit (Rp 999.999.999)");
			return;
		}
		if (totalBiaya > 0 && pendaftaranDp > totalBiaya) {
			toast.error(
				`Nominal DP Pendaftaran (${formatRupiah(pendaftaranDp)}) tidak boleh melebihi Total Biaya Pendidikan (${formatRupiah(totalBiaya)}).`,
				{ duration: 5000 },
			);
			return;
		}
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/payment-plan`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						totalBiaya: Math.max(0, Math.floor(Number(totalBiaya)) || 0),
						pendaftaranDp: Math.max(0, Math.floor(Number(pendaftaranDp)) || 0),
						totalDp: Math.max(0, Math.floor(Number(pendaftaranDp)) || 0),
					}),
				},
			);
			if (res.ok) {
				toast.success(
					"Total Biaya & DP Pendaftaran berhasil disimpan & tersinkronisasi ke Panel Finance",
				);
				setIsEditing(false);
				setInputWarning(null);
				fetchFinanceData();
				onUpdate();
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] });
				queryClient.invalidateQueries({ queryKey: ["students-list"] });
				queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
			} else {
				const json = await res.json().catch(() => null);
				toast.error(json?.message || "Gagal menyimpan Total Biaya Pendidikan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancelEdit = () => {
		setTotalBiaya(initialTotalBiaya);
		setPendaftaranDp(initialPendaftaranDp);
		setInputWarning(null);
		setDpWarning(null);
		setIsEditing(false);
	};

	const formatRupiah = (num: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(num || 0);
	};

	const financeState = financeDetail?.finance || {};
	const customFields = financeDetail?.customFields || [];
	// Gunakan pmbData dari parent sebagai Single Source of Truth agar reaktif saat diubah di Tab Data Tambahan
	const rumahJuangAktif =
		pmbData?.rumahJuang ?? financeDetail?.rumahJuangAktif ?? false;

	const isDanaTalangan = financeState?.metodePembayaran === "dana_talangan";
	const isDanaMandiri = financeState?.metodePembayaran === "mandiri";

	interface StageItemProps {
		title: string;
		nominal: number;
		desc: string;
		status: "LUNAS" | "SEBAGIAN" | "BELUM_BAYAR" | boolean;
		statusBadgeLabel?: string;
		paidDate?: string | null;
		buktiBayarUrl?: string | null;
		secondaryBuktiUrl?: string | null;
		secondaryBuktiLabel?: string;
		progress?: {
			paid: number;
			total: number;
			percentage: number;
		};
		subDetails?: Array<{
			label: string;
			nominal: number;
			paidDate?: string | null;
			buktiBayarUrl?: string | null;
		}>;
	}

	const renderStage = ({
		title,
		nominal,
		desc,
		status,
		statusBadgeLabel,
		paidDate,
		buktiBayarUrl,
		secondaryBuktiUrl,
		secondaryBuktiLabel,
		progress,
		subDetails,
	}: StageItemProps) => {
		const isLunas = status === "LUNAS" || status === true;
		const isSebagian = status === "SEBAGIAN";

		return (
			<div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-1.5 flex-wrap">
							<h4 className="text-xs font-bold text-slate-800">{title}</h4>
						</div>
						<p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
						<div className="mt-1 font-mono text-xs font-semibold text-slate-700">
							{formatRupiah(nominal)}
						</div>
					</div>

					<div className="text-right flex flex-col items-end gap-1.5 shrink-0">
						{isLunas ? (
							<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] font-bold">
								<CheckCircle2 className="w-3 h-3 mr-1" />
								{statusBadgeLabel || "Lunas"}
							</Badge>
						) : isSebagian ? (
							<Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 text-[10px] font-bold">
								<Clock className="w-3 h-3 mr-1" />
								{statusBadgeLabel || `Sebagian (${progress?.percentage ?? 0}%)`}
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 border-slate-300 text-[10px] font-bold bg-white"
							>
								<XCircle className="w-3 h-3 mr-1" />
								{statusBadgeLabel || "Belum Lunas"}
							</Badge>
						)}

						{/* Tombol Bukti Pembayaran */}
						<div className="flex flex-wrap items-center justify-end gap-1 mt-0.5">
							{buktiBayarUrl && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										openDocumentReview(
											studentId,
											buktiBayarUrl,
											`Bukti Pembayaran — ${title}.pdf`,
										)
									}
									className="h-6 px-2 text-[10px] font-semibold text-[#0517B0] border-[#0517B0]/30 hover:bg-blue-50/80 gap-1 shadow-2xs cursor-pointer"
								>
									<Eye className="w-3 h-3" />
									Lihat Bukti
								</Button>
							)}

							{secondaryBuktiUrl && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										openDocumentReview(
											studentId,
											secondaryBuktiUrl,
											`Bukti ${secondaryBuktiLabel || "Dokumen"} — ${title}.pdf`,
										)
									}
									className="h-6 px-2 text-[10px] font-semibold text-[#0517B0] border-[#0517B0]/30 hover:bg-blue-50/80 gap-1 shadow-2xs cursor-pointer"
								>
									<Eye className="w-3 h-3" />
									{secondaryBuktiLabel || "Bukti Dokumen"}
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* Progress bar realisasi cicilan */}
				{progress && (isSebagian || (progress.paid > 0 && !isLunas)) && (
					<div className="pt-1 border-t border-slate-200/60">
						<div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
							<span>
								Realisasi:{" "}
								<strong className="text-amber-700 font-mono">
									{formatRupiah(progress.paid)}
								</strong>{" "}
								/ {formatRupiah(progress.total)}
							</span>
							<span className="font-bold text-amber-700">
								{progress.percentage}%
							</span>
						</div>
						<div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
							<div
								className="bg-amber-500 h-full rounded-full transition-all duration-300"
								style={{
									width: `${Math.min(100, Math.max(0, progress.percentage))}%`,
								}}
							/>
						</div>
					</div>
				)}

				{/* Subdetails: Daftar cicilan bulanan yang sudah terbayar */}
				{subDetails && subDetails.length > 0 && (
					<div className="pt-2 border-t border-slate-200/60 space-y-1.5">
						<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
							Cicilan Terbayar ({subDetails.length}):
						</span>
						<div className="grid gap-1">
							{subDetails.map((sub, idx) => (
								<div
									key={idx}
									className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]"
								>
									<div className="flex items-center gap-2 min-w-0">
										<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
										<div className="min-w-0 truncate">
											<span className="font-semibold text-slate-800">
												{sub.label}
											</span>
											<span className="text-slate-400 mx-1">•</span>
											<span className="font-mono font-bold text-emerald-700">
												{formatRupiah(sub.nominal)}
											</span>
											{sub.paidDate && (
												<span className="text-[10px] text-slate-400 block sm:inline sm:ml-1">
													(
													{new Date(sub.paidDate).toLocaleDateString("id-ID", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})}
													)
												</span>
											)}
										</div>
									</div>

									{sub.buktiBayarUrl && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												openDocumentReview(
													studentId,
													sub.buktiBayarUrl!,
													`Bukti Pembayaran — ${sub.label}.pdf`,
												)
											}
											className="h-5 px-1.5 text-[10px] font-semibold text-[#0517B0] hover:bg-blue-50 gap-1 shrink-0 cursor-pointer"
										>
											<Eye className="w-3 h-3" />
											Bukti
										</Button>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		);
	};

	const renderTambahan = (
		icon: React.ReactNode,
		title: string,
		nominal: number,
		isPaid: boolean,
	) => (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-slate-200 rounded-lg bg-white shadow-sm gap-4">
			<div className="flex items-start gap-3.5">
				<div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-600">
					{icon}
				</div>
				<div>
					<h4 className="text-sm font-bold text-slate-800">{title}</h4>
					<div className="mt-1 font-mono text-[13px] font-semibold text-slate-600">
						{formatRupiah(nominal)}
					</div>
				</div>
			</div>
			<div>
				{isPaid ? (
					<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs font-bold w-full sm:w-auto justify-center px-3 py-1">
						<CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
						Lunas
					</Badge>
				) : (
					<Badge
						variant="outline"
						className="text-slate-500 border-slate-300 text-xs font-bold bg-slate-50 w-full sm:w-auto justify-center px-3 py-1"
					>
						<XCircle className="w-3.5 h-3.5 mr-1.5" />
						Belum Lunas
					</Badge>
				)}
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			{/* Section 1: Input Total Biaya Pendidikan Global */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
						<Globe className="w-4 h-4 text-indigo-600" />
						Input Total Biaya Pendidikan
					</CardTitle>
					{canEdit && (
						<div className="flex items-center gap-2">
							{!isEditing ? (
								<Button
									onClick={() => setIsEditing(true)}
									size="sm"
									className="bg-[#0517B0] hover:bg-[#04128d] text-white text-xs gap-1.5 h-8"
								>
									<Edit2 className="w-3.5 h-3.5" />
									Edit Biaya
								</Button>
							) : (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={handleCancelEdit}
										disabled={isSaving}
										className="text-xs h-8"
									>
										Batal
									</Button>
									<Button
										onClick={handleSaveTotalBiaya}
										disabled={isSaving}
										size="sm"
										className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-8"
									>
										{isSaving ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Save className="w-3.5 h-3.5" />
										)}
										Simpan Biaya Pendidikan
									</Button>
								</>
							)}
						</div>
					)}
				</CardHeader>
				<CardContent className="p-5 space-y-4">
					<div className="max-w-xl p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3">
						<div>
							{(() => {
								const currentSubProgram = pmbData?.subProgram || "";
								const defaultFeeObj = programDefaults.find(
									(p) =>
										p.subProgram?.toLowerCase() ===
										currentSubProgram.toLowerCase(),
								);
								const defaultTotalBiaya = defaultFeeObj?.defaultTotalBiaya ?? 0;
								const hasMismatch =
									totalBiaya > 0 &&
									defaultTotalBiaya > 0 &&
									totalBiaya !== defaultTotalBiaya;

								return (
									<>
										<div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
											<Label className="text-xs font-bold text-indigo-950 block">
												Total Biaya Pendidikan Keseluruhan (Rp) *
											</Label>
											{defaultTotalBiaya > 0 && (
												<Badge
													variant="outline"
													className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
												>
													Pagu Default: {formatRupiah(defaultTotalBiaya)}
												</Badge>
											)}
										</div>

										<div className="relative">
											<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
												Rp
											</span>
											<Input
												type="text"
												inputMode="numeric"
												pattern="[0-9]*"
												maxLength={9}
												disabled={!isEditing || !canEdit}
												value={
													totalBiaya === 0 || !totalBiaya ? "" : totalBiaya
												}
												onKeyDown={handleKeyDown}
												onChange={handleTotalBiayaChange}
												className={`pl-9 font-bold text-base bg-white h-10 border-indigo-200 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-700 ${
													inputWarning
														? "border-amber-400 ring-1 ring-amber-300"
														: ""
												}`}
												placeholder="Belum diinputkan (Contoh: 25000000)"
											/>
										</div>

										{hasMismatch && (
											<div className="flex items-center justify-between text-xs font-medium text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
												<div className="flex items-center gap-1.5">
													<AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
													<span>
														Nilai berbeda dari pagu standar program (
														{formatRupiah(defaultTotalBiaya)})
													</span>
												</div>
												{isEditing && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => setTotalBiaya(defaultTotalBiaya)}
														className="h-6 text-[11px] text-amber-900 underline hover:bg-amber-100 font-semibold"
													>
														Gunakan Standar
													</Button>
												)}
											</div>
										)}
									</>
								);
							})()}

							{inputWarning && (
								<div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5 animate-in fade-in">
									<AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
									<span>{inputWarning}</span>
								</div>
							)}

							<span className="text-xs font-semibold text-indigo-700 mt-1.5 block">
								Terbilang:{" "}
								{totalBiaya > 0
									? formatRupiah(totalBiaya)
									: "Belum ada biaya terinput"}
							</span>
							{/* Input Nominal DP Pendaftaran (Poin 10) */}
							<div className="pt-3 border-t border-indigo-100">
								<div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
									<Label className="text-xs font-bold text-indigo-950 flex items-center gap-2">
										<span>Nominal Uang Muka / DP Pendaftaran (Rp)</span>
										<span className="text-muted-foreground text-[10px] font-normal">
											(Disepakati PMB)
										</span>
									</Label>
									{financeState?.registrasiStatus ||
									pmbData?.paymentPlan?.statusDp ? (
										<Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-[10px] font-bold gap-1">
											<CheckCircle2 className="w-3 h-3 text-emerald-600" />
											Lunas DP
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-amber-800 border-amber-300 bg-amber-50 text-[10px] font-bold gap-1"
										>
											<AlertCircle className="w-3 h-3 text-amber-600" />
											Belum Lunas
										</Badge>
									)}
								</div>

								<div className="relative">
									<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
										Rp
									</span>
									<Input
										type="text"
										inputMode="numeric"
										pattern="[0-9]*"
										maxLength={9}
										disabled={!isEditing || !canEdit}
										value={
											pendaftaranDp === 0 || !pendaftaranDp ? "" : pendaftaranDp
										}
										onKeyDown={handleKeyDown}
										onChange={handleDpChange}
										className={`pl-9 font-bold text-base bg-white h-10 border-indigo-200 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-700 ${
											dpWarning ? "border-amber-400 ring-1 ring-amber-300" : ""
										}`}
										placeholder="Nominal DP (Contoh: 3000000)"
									/>
								</div>

								{dpWarning && (
									<div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5 animate-in fade-in">
										<AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
										<span>{dpWarning}</span>
									</div>
								)}

								{totalBiaya > 0 && pendaftaranDp > totalBiaya && (
									<div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1.5 animate-in fade-in">
										<AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
										<span>
											Peringatan: DP Pendaftaran ({formatRupiah(pendaftaranDp)})
											melebihi Total Biaya ({formatRupiah(totalBiaya)})
										</span>
									</div>
								)}

								<span className="text-xs font-semibold text-indigo-700 mt-1.5 block">
									Terbilang:{" "}
									{pendaftaranDp > 0
										? formatRupiah(pendaftaranDp)
										: "Belum ada DP ditentukan"}
								</span>
							</div>
						</div>

						<div className="flex items-start gap-2 pt-1 text-xs text-indigo-900/80">
							<Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
							<p className="text-[11px] leading-relaxed">
								Tim PMB hanya menginput{" "}
								<strong>satu nilai total keseluruhan</strong> di awal. Sistem
								OneData secara otomatis menghubungkan nilai ini ke{" "}
								<strong>Panel Finance</strong> untuk pengelolaan skema cicilan &
								pencatatan transaksi lebih lanjut.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Section 2: Rincian Alokasi Biaya Pendidikan */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<Activity className="w-4 h-4 text-emerald-600" />
						<div>
							<CardTitle className="text-sm font-bold text-slate-800">
								Rincian Alokasi Biaya Pendidikan
							</CardTitle>
							<p className="text-[11px] text-slate-500">
								Monitoring real-time dari Panel Finance
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => fetchFinanceData(true)}
							disabled={isRefreshingFinance}
							className="h-7 px-2.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200 bg-white shadow-2xs gap-1.5 cursor-pointer"
							title="Segarkan data terbaru dari Finance"
						>
							<RefreshCw
								className={`w-3.5 h-3.5 text-indigo-600 ${
									isRefreshingFinance ? "animate-spin" : ""
								}`}
							/>
							<span className="hidden sm:inline">Segarkan Data</span>
						</Button>
						<Badge
							variant="outline"
							className="text-slate-400 bg-white text-[10px]"
						>
							<Lock className="w-3 h-3 mr-1" />
							Read Only
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
						{/* Kiri: Registrasi Awal */}
						<div className="p-5 space-y-4">
							<div className="flex items-center gap-2 mb-2">
								<div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
									<FileText className="w-4 h-4" />
								</div>
								<h3 className="font-bold text-sm text-slate-800">
									Status Registrasi Awal
								</h3>
							</div>
							{renderStage({
								title: "1. Registrasi Awal (DP Masuk)",
								nominal:
									financeState?.termin1?.nominal ??
									(financeState?.registrasiNominal || 0),
								desc: "Pendaftaran masuk awal & syarat clearance NIM",
								status: Boolean(
									financeState?.termin1?.status ??
										financeState?.registrasiStatus,
								),
								paidDate:
									financeState?.termin1?.paidDate ??
									financeState?.registrasiPaidDate,
								buktiBayarUrl:
									financeState?.termin1?.buktiBayarUrl ??
									financeState?.registrasiBuktiBayarUrl,
							})}
						</div>

						{/* Kanan: Metode Pembayaran Lanjutan */}
						<div className="p-5 space-y-4 bg-slate-50/30">
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
										<CreditCard className="w-4 h-4" />
									</div>
									<h3 className="font-bold text-sm text-slate-800">
										Metode Pembayaran Lanjutan
									</h3>
								</div>
								<Badge className="bg-[#0517B0]/10 text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/20 font-bold text-xs">
									{financeState?.metodePembayaran === "mandiri"
										? "Dana Mandiri"
										: financeState?.metodePembayaran === "dana_talangan"
											? financeState?.talanganTipe === "1_tahap"
												? "Dana Talangan (1 Tahap)"
												: "Dana Talangan (2 Tahap)"
											: "Belum Ditentukan"}
								</Badge>
							</div>

							<div className="space-y-3">
								{!financeState?.metodePembayaran ? (
									<div className="text-sm text-slate-500 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
										Metode pembayaran lanjutan belum dipilih oleh Finance.
									</div>
								) : isDanaMandiri ? (
									<>
										{/* 2. SPP Semester 1 */}
										{(() => {
											const t2 = financeState?.termin2;
											const sem1Installments =
												t2?.installments ||
												financeDetail?.semesters?.find(
													(s: any) => s.semesterNumber === 1,
												)?.installments ||
												[];
											const sem1PaidList = sem1Installments
												.filter(
													(i: any) =>
														i.status === "LUNAS" ||
														(i.nominalPaid && i.nominalPaid > 0),
												)
												.map((i: any) => ({
													label: i.installmentMonth
														? `Cicilan ${i.installmentMonth}`
														: `Cicilan Ke-${i.installmentNumber}`,
													nominal: i.nominalPaid || 0,
													paidDate: i.paymentDate,
													buktiBayarUrl: i.buktiBayarUrl,
												}));

											const totalPaid =
												t2?.totalPaid ??
												sem1PaidList.reduce(
													(sum: number, i: any) => sum + i.nominal,
													0,
												);
											const nominal =
												t2?.nominal ??
												(financeState?.mandiriSemesterNominal || 0);
											const percentage =
												nominal > 0
													? Math.round((totalPaid / nominal) * 100)
													: 0;
											const statusString =
												t2?.statusString ??
												(financeState?.mandiriSemesterStatus
													? "LUNAS"
													: totalPaid > 0
														? "SEBAGIAN"
														: "BELUM_BAYAR");

											return renderStage({
												title: "2. SPP Semester 1",
												nominal,
												desc: "Biaya perkuliahan berjalan (cicilan bulanan)",
												status: statusString,
												statusBadgeLabel:
													statusString === "SEBAGIAN"
														? `Sebagian (${percentage}%)`
														: undefined,
												buktiBayarUrl:
													t2?.buktiBayarUrl ??
													financeState?.mandiriSemesterBuktiBayarUrl,
												progress: {
													paid: totalPaid,
													total: nominal,
													percentage,
												},
												subDetails: sem1PaidList,
											});
										})()}

										{/* 3. Kontrak Magang / Suhan */}
										{(() => {
											const t3 = financeState?.termin3;
											const isKontrak = Boolean(
												t3?.kontrakStatus ??
													financeState?.kontrakMagangStatus ??
													financeState?.mandiriInterviewStatus,
											);
											const isSuhan = Boolean(
												t3?.suhanStatus ?? financeState?.suhanStatus,
											);
											const isAllPaid = Boolean(
												t3?.isLunas ?? (isKontrak && isSuhan),
											);

											let statusStr: "LUNAS" | "SEBAGIAN" | "BELUM_BAYAR" =
												"BELUM_BAYAR";
											let badgeLabel: string | undefined;
											if (isAllPaid) {
												statusStr = "LUNAS";
											} else if (isKontrak && !isSuhan) {
												statusStr = "SEBAGIAN";
												badgeLabel = "Kontrak Siap";
											} else if (isSuhan && !isKontrak) {
												statusStr = "SEBAGIAN";
												badgeLabel = "Suhan Siap";
											}

											return renderStage({
												title: "3. Kontrak Magang / Suhan",
												nominal:
													t3?.nominal ??
													(financeState?.mandiriInterviewNominal || 0),
												desc: "Biaya turun kontrak kerja & izin Suhan",
												status: statusStr,
												statusBadgeLabel: badgeLabel,
												buktiBayarUrl:
													t3?.kontrakBuktiBayarUrl ??
													t3?.buktiBayarUrl ??
													financeState?.kontrakMagangBuktiBayarUrl ??
													financeState?.mandiriInterviewBuktiBayarUrl,
												secondaryBuktiUrl:
													t3?.suhanBuktiBayarUrl ??
													financeState?.suhanBuktiBayarUrl,
												secondaryBuktiLabel: "Bukti Suhan",
											});
										})()}

										{/* 4. Penempatan Magang / Keberangkatan */}
										{(() => {
											const t4 = financeState?.termin4;
											const isPaid = Boolean(
												t4?.status ?? financeState?.mandiriKeberangkatanStatus,
											);
											return renderStage({
												title: "4. Penempatan Magang / Keberangkatan",
												nominal:
													t4?.nominal ??
													(financeState?.mandiriKeberangkatanNominal || 0),
												desc: "Tahap akhir penempatan & visa magang",
												status: isPaid ? "LUNAS" : "BELUM_BAYAR",
												buktiBayarUrl:
													t4?.buktiBayarUrl ??
													financeState?.mandiriKeberangkatanBuktiBayarUrl,
												paidDate:
													t4?.paidDate ??
													financeState?.mandiriKeberangkatanPaidDate,
											});
										})()}
									</>
								) : isDanaTalangan ? (
									<>
										{(() => {
											const isTalanganSatuTahap =
												financeState?.talanganTipe === "1_tahap";
											if (isTalanganSatuTahap) {
												const t2Status = Boolean(
													financeState?.t2KeberangkatanStatus,
												);
												const t2Nominal =
													financeState?.talanganTotalPengajuan ||
													financeState?.t2KeberangkatanNominal ||
													0;
												return renderStage({
													title:
														"Tahap Akad Tunggal — Penempatan Magang / Keberangkatan",
													nominal: t2Nominal,
													desc: "Talangan penuh visa & penempatan keberangkatan magang (100% plafon)",
													status: t2Status ? "LUNAS" : "BELUM_BAYAR",
													buktiBayarUrl:
														financeState?.t2KeberangkatanBuktiBayarUrl,
												});
											}

											const t1Status = Boolean(
												financeState?.t1SemesterStatus &&
													financeState?.t1InterviewStatus,
											);
											const t1Partial = Boolean(
												financeState?.t1SemesterStatus ||
													financeState?.t1InterviewStatus,
											);
											const t2Status = Boolean(
												financeState?.t2KeberangkatanStatus,
											);

											return (
												<>
													{renderStage({
														title: "Tahap 1 — SPP Semester & Kontrak/Suhan",
														nominal:
															financeState.t1SemesterNominalTotal ||
															financeState.t1InterviewNominal ||
															0,
														desc: "Talangan perkuliahan & kontrak kerja magang",
														status: t1Status
															? "LUNAS"
															: t1Partial
																? "SEBAGIAN"
																: "BELUM_BAYAR",
														statusBadgeLabel:
															t1Partial && !t1Status ? "Sebagian" : undefined,
														buktiBayarUrl:
															financeState?.t1SemesterBuktiBayarUrl ??
															financeState?.t1InterviewBuktiBayarUrl,
													})}
													{renderStage({
														title:
															"Tahap 2 — Penempatan Magang / Keberangkatan",
														nominal: financeState.t2KeberangkatanNominal || 0,
														desc: "Talangan visa & tiket keberangkatan magang",
														status: t2Status ? "LUNAS" : "BELUM_BAYAR",
														buktiBayarUrl:
															financeState?.t2KeberangkatanBuktiBayarUrl,
													})}
												</>
											);
										})()}
									</>
								) : null}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Section 3: Rincian Biaya Tambahan */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<DollarSign className="w-4 h-4 text-emerald-600" />
						<div>
							<CardTitle className="text-sm font-bold text-slate-800">
								Rincian Biaya Tambahan
							</CardTitle>
							<p className="text-[11px] text-slate-500">
								Monitoring read-only dari Panel Finance
							</p>
						</div>
					</div>
					<Badge
						variant="outline"
						className="text-slate-400 bg-white text-[10px]"
					>
						<Lock className="w-3 h-3 mr-1" />
						Read Only
					</Badge>
				</CardHeader>
				<CardContent className="p-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Biaya Tambahan Tetap */}
						{isDanaTalangan &&
							renderTambahan(
								<Building className="w-5 h-5" />,
								"Administrasi Dana Talangan",
								financeState?.adminTalaganNominal || 0,
								!!financeState?.adminTalaganStatus,
							)}

						{renderTambahan(
							<Languages className="w-5 h-5" />,
							"Sertifikasi Bahasa",
							financeState?.toeicNominal || 0,
							!!financeState?.toeicStatus,
						)}

						{renderTambahan(
							<Plane className="w-5 h-5" />,
							"Passport",
							financeState?.pasporNominal || 0,
							!!financeState?.pasporStatus,
						)}

						{rumahJuangAktif &&
							renderTambahan(
								<Home className="w-5 h-5" />,
								"Rumah Juang",
								financeState?.rumahJuangNominal || 0,
								!!financeState?.rumahJuangStatus,
							)}

						{/* Custom Fields (Biaya Tambahan Dinamis) */}
						{customFields
							.filter((cf: any) => cf.fieldType === "biaya_tambahan")
							.map((cf: any, i: number) => (
								<div key={cf.id || i}>
									{renderTambahan(
										<FileText className="w-5 h-5" />,
										cf.label,
										cf.nominal || 0,
										!!cf.status,
									)}
								</div>
							))}
					</div>
					{!isDanaTalangan && !rumahJuangAktif && customFields.length === 0 && (
						<p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 mt-4">
							Hanya biaya Sertifikasi Bahasa dan Passport yang aktif.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Modal Pratinjau Bukti Pembayaran */}
			<FilePreviewDialog
				open={previewModal.open}
				onOpenChange={(open) => setPreviewModal((prev) => ({ ...prev, open }))}
				fileUrl={previewModal.fileUrl}
				title={previewModal.title}
			/>
		</div>
	);
}
