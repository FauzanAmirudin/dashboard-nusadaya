"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	Building,
	CheckCircle2,
	ChevronDown,
	Eye,
	FileText,
	GraduationCap,
	HeartPulse,
	Home,
	Languages,
	Loader2,
	Plane,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FilePreviewDialog } from "@/components/panels/finance/FilePreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

	const fetchFinanceData = async () => {
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
				}
			}
		} catch (error) {
			console.error("Failed to fetch finance tracking data", error);
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

		const pill = isLunas
			? {
					cls: "bg-emerald-100 text-emerald-800",
					text: statusBadgeLabel || "Lunas",
				}
			: isSebagian
				? {
						cls: "bg-amber-100 text-amber-800",
						text:
							statusBadgeLabel || `Sebagian (${progress?.percentage ?? 0}%)`,
					}
				: {
						cls: "bg-slate-100 text-slate-700",
						text: statusBadgeLabel || "Belum lunas",
					};

		return (
			<div
				className={`rounded-lg border p-4 space-y-3 ${isLunas ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"}`}
			>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0 flex-1">
						<h4 className="text-sm font-semibold text-slate-900">{title}</h4>
						<p className="text-xs text-slate-500 mt-0.5">{desc}</p>
						<p className="mt-1.5 font-mono text-base font-bold text-slate-900">
							{formatRupiah(nominal)}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
						<span
							className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${pill.cls}`}
						>
							{pill.text}
						</span>
						<div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
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
									className="h-9 px-3 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1.5 cursor-pointer"
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
									className="h-9 px-3 text-xs font-semibold text-[#0517B0] border-blue-200 hover:bg-blue-50 gap-1.5 cursor-pointer"
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
					<div>
						<div className="flex items-center justify-between text-xs text-slate-600 mb-1">
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
						<div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden">
							<div
								className="bg-amber-500 h-full rounded-full transition-all duration-300"
								style={{
									width: `${Math.min(100, Math.max(0, progress.percentage))}%`,
								}}
							/>
						</div>
					</div>
				)}

				{/* Riwayat cicilan: tertutup secara default */}
				{subDetails && subDetails.length > 0 && (
					<Collapsible>
						<CollapsibleTrigger className="group inline-flex min-h-9 items-center gap-1.5 rounded-md text-xs font-semibold text-[#0517B0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40">
							Lihat riwayat cicilan ({subDetails.length})
							<ChevronDown className="w-3.5 h-3.5 transition-transform group-data-[panel-open]:rotate-180" />
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="mt-2 grid gap-1.5">
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
														{new Date(sub.paidDate).toLocaleDateString(
															"id-ID",
															{
																day: "numeric",
																month: "short",
																year: "numeric",
															},
														)}
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
						</CollapsibleContent>
					</Collapsible>
				)}
			</div>
		);
	};

	const renderTambahan = (
		_icon: React.ReactNode,
		title: string,
		nominal: number,
		isPaid: boolean,
	) => (
		<div
			className={`flex items-center justify-between gap-3 rounded-lg border p-4 ${isPaid ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"}`}
		>
			<div className="min-w-0">
				<h4 className="text-sm font-semibold text-slate-900">{title}</h4>
				<p className="mt-0.5 font-mono text-sm font-bold text-slate-700">
					{formatRupiah(nominal)}
				</p>
			</div>
			<span
				className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}
			>
				{isPaid ? "Lunas" : "Belum lunas"}
			</span>
		</div>
	);

	return (
		<div className="w-full space-y-6">
			{/* 1. Biaya & DP pendaftaran (diisi PMB) */}
			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
					<div className="min-w-0">
						<h3 className="text-sm sm:text-base font-bold text-slate-900">
							Biaya pendidikan & DP pendaftaran
						</h3>
						<p className="text-xs text-slate-500 mt-0.5">
							Diisi PMB, otomatis tersambung ke Panel Finance.
						</p>
					</div>
					{canEdit && (
						<div className="flex items-center gap-2">
							{!isEditing ? (
								<Button
									onClick={() => setIsEditing(true)}
									variant="outline"
									className="h-10 border-blue-200 text-[#0517B0] hover:bg-blue-50 text-sm font-semibold"
								>
									Edit biaya
								</Button>
							) : (
								<>
									<Button
										variant="outline"
										onClick={handleCancelEdit}
										disabled={isSaving}
										className="h-10 text-sm"
									>
										Batal
									</Button>
									<Button
										onClick={handleSaveTotalBiaya}
										disabled={isSaving}
										className="h-10 bg-[#0517B0] hover:bg-blue-800 text-white text-sm font-semibold gap-1.5"
									>
										{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
										Simpan
									</Button>
								</>
							)}
						</div>
					)}
				</div>
				<div className="grid gap-6 p-4 sm:p-6 md:grid-cols-2">
					{/* Total biaya */}
					<div className="space-y-2">
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
										<Label className="text-xs font-bold text-slate-800 block">
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
										<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
											Rp
										</span>
										<Input
											type="text"
											inputMode="numeric"
											pattern="[0-9]*"
											maxLength={9}
											disabled={!isEditing || !canEdit}
											value={totalBiaya === 0 || !totalBiaya ? "" : totalBiaya}
											onKeyDown={handleKeyDown}
											onChange={handleTotalBiayaChange}
											className={`pl-9 font-bold text-base bg-white h-11 border-slate-300 focus:border-[#0517B0] disabled:bg-slate-100 disabled:text-slate-700 ${
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
						<p className="text-xs text-slate-500">
							Terbilang:{" "}
							{totalBiaya > 0
								? formatRupiah(totalBiaya)
								: "Belum ada biaya terinput"}
						</p>
					</div>

					{/* DP pendaftaran */}
					<div className="space-y-2">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<Label className="text-xs font-bold text-slate-800">
								Nominal DP pendaftaran (Rp)
							</Label>
							{financeState?.registrasiStatus ||
							pmbData?.paymentPlan?.statusDp ? (
								<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
									Lunas
								</span>
							) : (
								<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
									Menunggu verifikasi Finance
								</span>
							)}
						</div>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
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
								className={`pl-9 font-bold text-base bg-white h-11 border-slate-300 focus:border-[#0517B0] disabled:bg-slate-100 disabled:text-slate-700 ${
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
						<p className="text-xs text-slate-500">
							Terbilang:{" "}
							{pendaftaranDp > 0
								? formatRupiah(pendaftaranDp)
								: "Belum ada DP ditentukan"}
						</p>
					</div>
				</div>
			</section>

			{/* 2. Rincian pembayaran (hanya baca, dari Finance) */}
			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
					<div className="min-w-0">
						<h3 className="text-sm sm:text-base font-bold text-slate-900">
							Rincian pembayaran
						</h3>
						<p className="text-xs text-slate-500 mt-0.5">
							Data dari Panel Finance (hanya baca).
						</p>
					</div>
				</div>
				<div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2">
					<div className="space-y-3">
						<h4 className="text-sm font-bold text-slate-700">
							Registrasi awal
						</h4>
						{renderStage({
							title: "1. Registrasi Awal (DP Masuk)",
							nominal:
								financeState?.termin1?.nominal ??
								(financeState?.registrasiNominal || 0),
							desc: "Pendaftaran masuk awal & syarat clearance NIM",
							status: Boolean(
								financeState?.termin1?.status ?? financeState?.registrasiStatus,
							),
							paidDate:
								financeState?.termin1?.paidDate ??
								financeState?.registrasiPaidDate,
							buktiBayarUrl:
								financeState?.termin1?.buktiBayarUrl ??
								financeState?.registrasiBuktiBayarUrl,
						})}
					</div>

					<div className="space-y-3">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<h4 className="text-sm font-bold text-slate-700">
								Pembayaran lanjutan
							</h4>
							<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-[#0517B0]">
								{financeState?.metodePembayaran === "mandiri"
									? "Dana Mandiri"
									: financeState?.metodePembayaran === "dana_talangan"
										? financeState?.talanganTipe === "1_tahap"
											? "Dana Talangan (1 Tahap)"
											: "Dana Talangan (2 Tahap)"
										: "Belum ditentukan"}
							</span>
						</div>
						<div className="space-y-3">
							{!financeState?.metodePembayaran ? (
								<div className="text-sm text-slate-600 text-center py-6 rounded-lg bg-slate-50 border border-dashed border-slate-300">
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
											nominal > 0 ? Math.round((totalPaid / nominal) * 100) : 0;
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
													title: "Tahap 2 — Penempatan Magang / Keberangkatan",
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
			</section>

			{/* 3. Biaya tambahan (hanya baca) */}
			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
					<div className="min-w-0">
						<h3 className="text-sm sm:text-base font-bold text-slate-900">
							Biaya tambahan
						</h3>
						<p className="text-xs text-slate-500 mt-0.5">
							Data dari Panel Finance (hanya baca).
						</p>
					</div>
				</div>
				<div className="p-4 sm:p-6">
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
						<p className="text-xs text-slate-500 mt-3">
							Hanya biaya Sertifikasi Bahasa dan Passport yang aktif.
						</p>
					)}
				</div>
			</section>

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
