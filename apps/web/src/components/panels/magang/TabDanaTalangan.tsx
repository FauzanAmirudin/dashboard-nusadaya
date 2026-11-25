import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { FilePreviewDialog } from "@/components/panels/finance/FilePreviewDialog";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { API_URL, getToken } from "@/lib/eden";
import { openDocumentReview } from "@/utils/document-review";
import { formatDate } from "@/utils/format";
import { getAgencyPaymentTermsSummary } from "@/utils/panel-logic";

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
	data,
	pmbPaymentData,
}: TabDanaTalanganProps) {
	const [financeDetail, setFinanceDetail] = useState<any>(null);
	const [previewModal, setPreviewModal] = useState<{
		open: boolean;
		fileUrl: string | null;
		title: string;
	}>({ open: false, fileUrl: null, title: "" });

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
				}
			}
		} catch (error) {
			console.error("Failed to fetch finance tracking data", error);
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
	const lowerDest = destCountry.toLowerCase();
	const penempatanLabel = lowerDest.includes("malaysia")
		? "Keberangkatan Magang (D3 Malaysia)"
		: lowerDest.includes("taiwan")
			? "Keberangkatan Magang (Taiwan)"
			: "Keberangkatan Magang";

	interface StageItemProps {
		title: string;
		nominal: number;
		/** Hanya diisi bila ada aturan/angka yang tak terwakili judul. */
		desc?: string;
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

		const fmtDate = (d: string) =>
			new Date(d).toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
		const pill = isLunas
			? {
					text: statusBadgeLabel || "Lunas",
					cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
				}
			: isSebagian
				? {
						text:
							statusBadgeLabel || `Sebagian (${progress?.percentage ?? 0}%)`,
						cls: "border-amber-200 bg-amber-50 text-amber-800",
					}
				: {
						text: statusBadgeLabel || "Belum lunas",
						cls: "border-slate-200 bg-white text-slate-600",
					};
		const buktiButton = (url: string, label: string, fileTitle: string) => (
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => openDocumentReview(studentId, url, fileTitle)}
				className="-mx-2 min-h-11 px-2 text-xs font-semibold text-[#0517B0] hover:bg-blue-50"
			>
				{label}
			</Button>
		);

		return (
			<div className="space-y-2.5 py-4 first:pt-0 last:pb-0">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h4 className="text-sm font-semibold text-slate-900">{title}</h4>
						{(desc || (paidDate && isLunas)) && (
							<p className="mt-0.5 text-xs text-slate-500">
								{[
									desc,
									paidDate && isLunas ? `dibayar ${fmtDate(paidDate)}` : null,
								]
									.filter(Boolean)
									.join(" · ")}
							</p>
						)}
					</div>
					<div className="flex shrink-0 flex-col items-end gap-1">
						<p className="text-sm font-semibold tabular-nums text-slate-900">
							{formatRupiah(nominal)}
						</p>
						<span
							className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pill.cls}`}
						>
							{pill.text}
						</span>
					</div>
				</div>

				{(buktiBayarUrl || secondaryBuktiUrl) && (
					<div className="flex flex-wrap gap-2">
						{buktiBayarUrl &&
							buktiButton(
								buktiBayarUrl,
								"Lihat Bukti",
								`Bukti Pembayaran — ${title}.pdf`,
							)}
						{secondaryBuktiUrl &&
							buktiButton(
								secondaryBuktiUrl,
								secondaryBuktiLabel || "Bukti Dokumen",
								`Bukti ${secondaryBuktiLabel || "Dokumen"} — ${title}.pdf`,
							)}
					</div>
				)}

				{/* Realisasi cicilan */}
				{progress && (isSebagian || (progress.paid > 0 && !isLunas)) && (
					<div>
						<p className="mb-1 text-xs text-slate-600">
							Terbayar{" "}
							<span className="font-semibold tabular-nums text-slate-800">
								{formatRupiah(progress.paid)}
							</span>{" "}
							dari {formatRupiah(progress.total)}
						</p>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
							<div
								className="h-full rounded-full bg-amber-500"
								style={{
									width: `${Math.min(100, Math.max(0, progress.percentage))}%`,
								}}
							/>
						</div>
					</div>
				)}

				{/* Cicilan yang sudah terbayar */}
				{subDetails && subDetails.length > 0 && (
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-slate-600">
							Cicilan terbayar ({subDetails.length})
						</p>
						<ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
							{subDetails.map((sub, idx) => (
								<li
									key={idx}
									className="flex items-center justify-between gap-2 px-3 py-2 text-xs"
								>
									<span className="min-w-0">
										<span className="font-semibold text-slate-800">
											{sub.label}
										</span>
										<span className="text-slate-400"> · </span>
										<span className="font-semibold tabular-nums text-emerald-700">
											{formatRupiah(sub.nominal)}
										</span>
										{sub.paidDate && (
											<span className="text-slate-500">
												{" "}
												· {fmtDate(sub.paidDate)}
											</span>
										)}
									</span>
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
											className="min-h-11 shrink-0 px-2 text-xs font-semibold text-[#0517B0] hover:bg-blue-50"
										>
											Bukti
										</Button>
									)}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		);
	};

	const metodeLabel =
		financeState?.metodePembayaran === "mandiri"
			? "Dana Mandiri"
			: financeState?.metodePembayaran === "dana_talangan"
				? financeState?.talanganTipe === "1_tahap"
					? "Dana Talangan (1 Tahap)"
					: "Dana Talangan (2 Tahap)"
				: "Belum ditentukan";

	return (
		<div className="space-y-6">
			{/* Konteks pengajuan dari PMB (hanya baca) */}
			{pmbPaymentData?.pengajuanDanaTalangan && (
				<Collapsible className="overflow-hidden rounded-xl border border-slate-200 bg-white">
					<CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0517B0]/40 sm:px-6">
						<span className="text-sm font-semibold text-slate-700">
							Pengajuan Dana Talangan dari PMB
						</span>
						<ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform group-data-[panel-open]:rotate-180" />
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="border-t border-slate-200 p-4 sm:p-6">
							<p className="whitespace-pre-wrap text-sm text-slate-800">
								{pmbPaymentData.pengajuanDanaTalangan}
							</p>
							<p className="mt-2 text-xs text-slate-600">
								Total biaya PMB: Rp{" "}
								{pmbPaymentData.totalBiaya?.toLocaleString("id-ID") || 0} ·
								Total DP: Rp{" "}
								{(
									pmbPaymentData.totalDp || pmbPaymentData.pendaftaranDp
								)?.toLocaleString("id-ID") || 0}
							</p>
						</div>
					</CollapsibleContent>
				</Collapsible>
			)}

			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
					<div className="min-w-0">
						<h3 className="text-sm sm:text-base font-bold text-slate-900">
							Pembayaran Lanjutan
						</h3>
						<p className="mt-0.5 text-xs text-slate-500">
							Data dari Panel Finance, hanya baca.
						</p>
					</div>
				</div>

				<div className="space-y-6 p-4 sm:p-6">
					{/* Registrasi awal */}
					<div>
						<h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
							Registrasi Awal
						</h4>
						{renderStage({
							title: "Biaya Registrasi Pendaftaran",
							nominal:
								financeState?.termin1?.nominal ??
								(financeState?.registrasiNominal || 0),
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

					{/* Metode pembayaran lanjutan */}
					<div>
						<div className="mb-1 flex flex-wrap items-center justify-between gap-2">
							<h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">
								Metode Pembayaran
							</h4>
							<span className="text-xs font-semibold text-slate-700">
								{metodeLabel}
							</span>
						</div>

						<div className="divide-y divide-slate-100">
							{!financeState?.metodePembayaran ? (
								<div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-500">
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
													? String(i.installmentMonth)
															.toLowerCase()
															.startsWith("cicilan")
														? String(i.installmentMonth)
														: `Cicilan ${i.installmentMonth}`
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
											desc: "Dibayar bulanan.",
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
												desc: "100% plafon.",
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
													desc: "Tahap 1 dari 2.",
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
													desc: "Tahap 2 dari 2.",
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

			{/* Pembayaran kampus ke agensi mitra (dicatat Finance, hanya baca) */}
			{(() => {
				const agencyTerms = getAgencyPaymentTermsSummary(data, destCountry);
				const done = agencyTerms.filter((t) => t.paid).length;
				return (
					<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
							<div className="min-w-0">
								<h3 className="text-sm sm:text-base font-bold text-slate-900">
									Pembayaran Kampus ke Agensi
								</h3>
								<p className="mt-0.5 text-xs text-slate-500">
									Data dari Panel Finance, hanya baca.
								</p>
							</div>
							<span
								className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
									done >= agencyTerms.length
										? "bg-emerald-100 text-emerald-800"
										: "bg-amber-100 text-amber-800"
								}`}
							>
								{done} / {agencyTerms.length} lunas
							</span>
						</div>

						<div className="divide-y divide-slate-100 p-4 sm:p-6">
							{agencyTerms.map((term) => {
								const docKey = term.key === "dp" ? "agen_dp" : "agen_pelunasan";
								const pill = term.paid
									? {
											text: "Lunas",
											cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
										}
									: term.isOverdue
										? {
												text: "Perlu Dibayar",
												cls: "border-amber-200 bg-amber-50 text-amber-800",
											}
										: {
												text: "Menunggu Pemicu",
												cls: "border-slate-200 bg-white text-slate-600",
											};

								return (
									<div
										key={term.key}
										className="space-y-3 py-4 first:pt-0 last:pb-0"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<h4 className="text-sm font-semibold text-slate-900">
													{term.label}
												</h4>
												<p className="mt-0.5 text-xs text-slate-500">
													Pemicu: {term.triggerLabel}
												</p>
												{term.reminderText && (
													<p
														role="status"
														className="mt-1 text-xs font-medium text-amber-800"
													>
														{term.reminderText}
													</p>
												)}
											</div>
											<span
												className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pill.cls}`}
											>
												{pill.text}
											</span>
										</div>

										<div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 text-xs sm:grid-cols-2">
											<div>
												<span className="block text-slate-500">Nominal</span>
												<span className="font-semibold tabular-nums text-slate-900">
													{term.nominal !== null
														? formatRupiah(term.nominal)
														: "Belum diisi"}
												</span>
											</div>
											<div>
												<span className="block text-slate-500">
													Tanggal Bayar
												</span>
												<span className="font-medium text-slate-900">
													{term.paidDate ? formatDate(term.paidDate) : "-"}
												</span>
											</div>
										</div>

										<div>
											<p className="text-xs font-medium text-slate-600">
												Bukti Pembayaran (Finance)
											</p>
											<DocumentUpload
												studentId={studentId}
												panel="finance"
												documentKey={docKey}
												canEdit={false}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</section>
				);
			})()}

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
