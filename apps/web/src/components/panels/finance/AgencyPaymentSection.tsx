"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	Building2,
	CheckCircle2,
	Clock,
	Loader2,
	Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { API_URL, getToken } from "@/lib/eden";
import {
	filterFinanceIntegerString,
	preventFinanceIntegerKey,
} from "@/utils/form-validators";
import { formatDate, formatRupiah } from "@/utils/format";
import {
	type AgencyPaymentInternshipLike,
	getAgencyPaymentTermsSummary,
} from "@/utils/panel-logic";

interface AgencyPaymentSectionProps {
	studentId: number;
	internshipState?: AgencyPaymentInternshipLike | null;
	destinationCountry?: string | null;
	canEdit: boolean;
	onUpdate: () => void;
}

interface TermFormState {
	paid: boolean;
	date: string;
	nominal: string;
}

interface AgencyPaymentFormState {
	dp: TermFormState;
	pelunasan: TermFormState;
}

function toDateInputValue(value: string | Date | null | undefined): string {
	if (!value) return "";
	const parsed = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(parsed.getTime())) return "";
	return parsed.toISOString().split("T")[0];
}

function buildFormState(
	internshipState?: AgencyPaymentInternshipLike | null,
): AgencyPaymentFormState {
	return {
		dp: {
			paid: Boolean(internshipState?.agenDpPaid),
			date: toDateInputValue(internshipState?.agenDpDate),
			nominal:
				typeof internshipState?.agenDpNominal === "number" &&
				internshipState.agenDpNominal > 0
					? String(internshipState.agenDpNominal)
					: "",
		},
		pelunasan: {
			paid: Boolean(internshipState?.agenPelunasanPaid),
			date: toDateInputValue(internshipState?.agenPelunasanDate),
			nominal:
				typeof internshipState?.agenPelunasanNominal === "number" &&
				internshipState.agenPelunasanNominal > 0
					? String(internshipState.agenPelunasanNominal)
					: "",
		},
	};
}

export function AgencyPaymentSection({
	studentId,
	internshipState,
	destinationCountry,
	canEdit,
	onUpdate,
}: AgencyPaymentSectionProps) {
	const queryClient = useQueryClient();
	const [form, setForm] = useState<AgencyPaymentFormState>(() =>
		buildFormState(internshipState),
	);
	const [savingTerm, setSavingTerm] = useState<"dp" | "pelunasan" | null>(null);

	useEffect(() => {
		setForm(buildFormState(internshipState));
	}, [internshipState]);

	const agencyTerms = getAgencyPaymentTermsSummary(
		internshipState,
		destinationCountry,
	);

	const handleTogglePaid = (termKey: "dp" | "pelunasan", checked: boolean) => {
		const today = new Date().toISOString().split("T")[0];
		setForm((prev) => ({
			...prev,
			[termKey]: {
				...prev[termKey],
				paid: checked,
				date: checked && !prev[termKey].date ? today : prev[termKey].date,
			},
		}));
	};

	const handleDateChange = (termKey: "dp" | "pelunasan", date: string) => {
		setForm((prev) => ({
			...prev,
			[termKey]: {
				...prev[termKey],
				date,
			},
		}));
	};

	const handleNominalChange = (
		termKey: "dp" | "pelunasan",
		rawValue: string,
	) => {
		const cleaned = rawValue === "" ? "" : filterFinanceIntegerString(rawValue);
		setForm((prev) => ({
			...prev,
			[termKey]: {
				...prev[termKey],
				nominal: cleaned,
			},
		}));
	};

	const handleSaveTerm = async (termKey: "dp" | "pelunasan") => {
		if (!canEdit) return;
		const termState = form[termKey];
		const nominalValue =
			termState.nominal === "" ? null : Number(termState.nominal);
		const dateValue = termState.date === "" ? null : termState.date;

		const payload =
			termKey === "dp"
				? {
						agenDpPaid: termState.paid,
						agenDpDate: dateValue,
						agenDpNominal: nominalValue,
					}
				: {
						agenPelunasanPaid: termState.paid,
						agenPelunasanDate: dateValue,
						agenPelunasanNominal: nominalValue,
					};

		setSavingTerm(termKey);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/finance/agency-payments`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${getToken()}`,
					},
					body: JSON.stringify(payload),
				},
			);
			const json = (await res.json()) as {
				success?: boolean;
				message?: string;
			};

			if (!res.ok || !json.success) {
				toast.error(json.message || "Gagal menyimpan pembayaran agensi");
				return;
			}

			toast.success(
				termKey === "dp"
					? "Data DP ke agensi berhasil disimpan"
					: "Data pelunasan agensi berhasil disimpan",
			);

			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["student", String(studentId)],
				}),
				queryClient.invalidateQueries({ queryKey: ["students-list"] }),
				queryClient.invalidateQueries({ queryKey: ["finance-projections"] }),
				queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
			]);
			onUpdate();
		} catch (error) {
			console.error("Failed to save agency payment", error);
			toast.error(
				"Terjadi kesalahan jaringan saat menyimpan pembayaran agensi",
			);
		} finally {
			setSavingTerm(null);
		}
	};

	return (
		<section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
				<div>
					<div className="flex items-center gap-2">
						<Building2 className="w-4 h-4 text-[#0517B0]" />
						<h3 className="text-sm sm:text-base font-bold text-slate-900">
							Pembayaran ke Agensi Mitra
						</h3>
					</div>
					<p className="text-xs text-slate-500 mt-0.5">
						Pemicu dari Divisi Magang · Dicatat oleh Finance
					</p>
				</div>
				<Badge
					variant="outline"
					className="w-fit text-[11px] font-medium text-slate-700 bg-white border-slate-200"
				>
					Dicatat oleh Finance
				</Badge>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6">
				{agencyTerms.map((term) => {
					const termState = form[term.key];
					const docKey = term.key === "dp" ? "agen_dp" : "agen_pelunasan";
					const isSaving = savingTerm === term.key;

					const statusBadge = term.paid ? (
						<Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1">
							<CheckCircle2 className="w-3 h-3" />
							Lunas
						</Badge>
					) : term.isOverdue ? (
						<Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[11px] gap-1">
							<AlertCircle className="w-3 h-3" />
							Perlu Dibayar
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="bg-slate-50 text-slate-600 border-slate-200 text-[11px] gap-1"
						>
							<Clock className="w-3 h-3" />
							Menunggu Pemicu
						</Badge>
					);

					return (
						<div
							key={term.key}
							className={`rounded-lg border p-4 space-y-3 ${
								term.paid
									? "border-emerald-200/80 bg-emerald-50/30"
									: term.isOverdue
										? "border-amber-200 bg-amber-50/40"
										: "border-slate-200 bg-slate-50/40"
							}`}
						>
							<div className="flex items-start justify-between gap-2">
								<div>
									<p className="text-sm font-semibold text-slate-900">
										{term.label}
									</p>
									<p className="text-xs text-slate-500">
										Pemicu: {term.triggerLabel}
									</p>
								</div>
								{statusBadge}
							</div>

							{term.reminderText && (
								<p className="text-xs font-medium text-amber-800">
									{term.reminderText}
								</p>
							)}

							{canEdit ? (
								<div className="space-y-3 pt-2 border-t border-slate-200/70">
									<div className="flex items-center gap-2.5">
										<Checkbox
											id={`chk-agency-${term.key}`}
											checked={termState.paid}
											disabled={isSaving}
											onCheckedChange={(checked) =>
												handleTogglePaid(term.key, Boolean(checked))
											}
											className="size-4.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
										/>
										<label
											htmlFor={`chk-agency-${term.key}`}
											className="text-xs font-semibold text-slate-800 cursor-pointer"
										>
											Tandai sudah dibayar (Lunas)
										</label>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div className="space-y-1">
											<label
												htmlFor={`agency-date-${term.key}`}
												className="block text-xs font-medium text-slate-600"
											>
												Tanggal Bayar
											</label>
											<Input
												id={`agency-date-${term.key}`}
												type="date"
												value={termState.date}
												disabled={isSaving}
												onChange={(e) =>
													handleDateChange(term.key, e.target.value)
												}
												className="h-9 text-xs bg-white"
											/>
										</div>
										<div className="space-y-1">
											<label
												htmlFor={`agency-nominal-${term.key}`}
												className="block text-xs font-medium text-slate-600"
											>
												Nominal (Rp)
											</label>
											<Input
												id={`agency-nominal-${term.key}`}
												type="number"
												inputMode="numeric"
												min={0}
												step={1}
												placeholder="0"
												value={termState.nominal}
												disabled={isSaving}
												onKeyDown={(e) => preventFinanceIntegerKey(e)}
												onChange={(e) =>
													handleNominalChange(term.key, e.target.value)
												}
												className="h-9 text-xs bg-white font-mono"
											/>
										</div>
									</div>

									<div className="flex justify-end">
										<Button
											type="button"
											size="sm"
											disabled={isSaving}
											onClick={() => handleSaveTerm(term.key)}
											className="h-8 text-xs font-semibold bg-[#0517B0] hover:bg-blue-800 text-white gap-1.5"
										>
											{isSaving ? (
												<>
													<Loader2 className="w-3.5 h-3.5 animate-spin" />
													Menyimpan...
												</>
											) : (
												<>
													<Save className="w-3.5 h-3.5" />
													Simpan
												</>
											)}
										</Button>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/70 text-xs">
									<div>
										<span className="text-slate-500 block">Nominal</span>
										<span className="font-mono font-semibold text-slate-900">
											{term.nominal !== null
												? formatRupiah(term.nominal)
												: "Belum diisi"}
										</span>
									</div>
									<div>
										<span className="text-slate-500 block">Tanggal Bayar</span>
										<span className="font-medium text-slate-900">
											{term.paidDate ? formatDate(term.paidDate) : "-"}
										</span>
									</div>
								</div>
							)}

							<div className="pt-2 border-t border-slate-200/70">
								<p className="text-xs font-medium text-slate-600">
									Bukti Pembayaran (PDF)
								</p>
								<DocumentUpload
									studentId={studentId}
									panel="finance"
									documentKey={docKey}
									canEdit={canEdit}
									onUpdate={onUpdate}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
