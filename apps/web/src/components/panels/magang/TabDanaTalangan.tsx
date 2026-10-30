import {
	Activity,
	CheckCircle2,
	Clock,
	CreditCard,
	Eye,
	Lock,
	RefreshCw,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FilePreviewDialog } from "@/components/panels/finance/FilePreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL, getToken } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";

interface TabDanaTalanganProps {
	studentId: number;
	data: any;
	pmbPaymentData: any;
	canEdit: boolean;
	handleToggleField: (field: string, value: any) => void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => void;
}

export function TabDanaTalangan({
	studentId,
	pmbPaymentData,
}: TabDanaTalanganProps) {
	const [financeDetail, setFinanceDetail] = useState<any>(null);
	const [isRefreshingFinance, setIsRefreshingFinance] = useState(false);
	const [previewModal, setPreviewModal] = useState<{
		open: boolean;
		fileUrl: string | null;
		title: string;
	}>({ open: false, fileUrl: null, title: "" });

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

		// Add event listener to fetch on focus just like PMB panel
		const handleFocus = () => {
			fetchFinanceData();
		};

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [studentId]);

	const formatRupiah = (num: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(num || 0);
	};

	const financeState = financeDetail?.finance || {};
	const isDanaTalangan = financeState?.metodePembayaran === "dana_talangan";
	const isDanaMandiri = financeState?.metodePembayaran === "mandiri";
	const destCountry = financeDetail?.student?.destinationCountry || "";
	const isMalaysia = destCountry.toLowerCase().includes("malaysia");
	const penempatanLabel = isMalaysia
		? "Penempatan Magang D3 Malaysia / Keberangkatan"
		: "Penempatan Magang Taiwan / Keberangkatan";

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

	return (
		<div className="space-y-6">
			{/* Konteks PMB Read-Only */}
			{pmbPaymentData && (
				<div className="bg-slate-50 border-b border-slate-200 p-4 rounded-lg border">
					<h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
						Konteks Pengajuan PMB (Read-Only)
					</h4>

					{pmbPaymentData.pengajuanDanaTalangan ? (
						<div className="bg-amber-50 border border-amber-200 rounded-md p-3">
							<div className="flex items-center gap-2 text-amber-700 mb-1">
								<Activity className="w-4 h-4" />
								<span className="text-xs font-bold uppercase tracking-wider">
									Ada Pengajuan Dana Talangan
								</span>
							</div>
							<p className="text-sm text-amber-900 whitespace-pre-wrap">
								{pmbPaymentData.pengajuanDanaTalangan}
							</p>
							<div className="mt-3 text-xs text-amber-800 font-medium">
								<span className="mr-4">
									Total Biaya PMB: Rp{" "}
									{pmbPaymentData.totalBiaya?.toLocaleString("id-ID") || 0}
								</span>
								<span>
									Total DP: Rp{" "}
									{(
										pmbPaymentData.totalDp || pmbPaymentData.pendaftaranDp
									)?.toLocaleString("id-ID") || 0}
								</span>
							</div>
						</div>
					) : (
						<div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-center gap-2 text-emerald-700">
							<CheckCircle2 className="w-4 h-4" />
							<span className="text-xs font-bold uppercase tracking-wider">
								Tidak Ada Pengajuan Dana Talangan dari PMB
							</span>
						</div>
					)}
				</div>
			)}

			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<Activity className="w-4 h-4 text-emerald-600" />
						<div>
							<CardTitle className="text-sm font-bold text-slate-800">
								Rincian Alokasi Biaya Pendidikan & Metode Pembayaran Lanjutan
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
									<Activity className="w-4 h-4" />
								</div>
								<h3 className="font-bold text-sm text-slate-800">
									Status Registrasi Awal
								</h3>
							</div>
							{renderStage({
								title: "Biaya Registrasi Pendaftaran",
								nominal:
									financeState?.termin1?.nominal ??
									(financeState?.registrasiNominal || 0),
								desc: "Pendaftaran masuk pertama",
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
												desc: "Biaya perkuliahan berjalan Semester 1 (cicilan bulanan)",
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
												desc: "Biaya proses turun kontrak kerja & izin Suhan",
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
												title: `4. ${penempatanLabel}`,
												nominal:
													t4?.nominal ??
													(financeState?.mandiriKeberangkatanNominal || 0),
												desc: "Tahap akhir penempatan magang & visa",
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
													title: `Tahap Akad Tunggal — ${penempatanLabel}`,
													nominal: t2Nominal,
													desc: "Plafon talangan penuh visa & penempatan keberangkatan magang (100% plafon)",
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
														title:
															"Tahap 1 — SPP Semester 1 & Kontrak Magang/Suhan",
														nominal:
															financeState.t1SemesterNominalTotal ||
															financeState.t1InterviewNominal ||
															0,
														desc: "Plafon talangan SPP Semester 1 & Kontrak/Suhan",
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
														title: `Tahap 2 — ${penempatanLabel}`,
														nominal: financeState.t2KeberangkatanNominal || 0,
														desc: "Plafon talangan penempatan keberangkatan magang",
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
