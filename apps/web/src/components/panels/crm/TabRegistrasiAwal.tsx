"use client";

import { CheckCircle, DollarSign, FileText, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { formatRupiah } from "@/utils/format";

interface TabRegistrasiAwalProps {
	studentId: number;
	crmState: any;
	canEdit?: boolean;
	onUpdate?: () => void;
	API_URL?: string;
}

export function TabRegistrasiAwal({
	studentId,
	crmState,
	canEdit = false,
	onUpdate,
	API_URL,
}: TabRegistrasiAwalProps) {
	return (
		<div className="space-y-6">
			{/* Status Pelunasan Registrasi Awal (Finance Real-Time) */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
						<DollarSign className="w-4 h-4 text-emerald-600" />
						Status Pelunasan Registrasi Awal (Sinkronisasi Finance)
					</CardTitle>
					{crmState?.finance?.registrasiStatus ? (
						<Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold gap-1">
							<CheckCircle className="w-3.5 h-3.5" />
							LUNAS REGISTRASI
						</Badge>
					) : (
						<Badge variant="destructive" className="text-xs font-bold gap-1">
							<XCircle className="w-3.5 h-3.5" />
							BELUM LUNAS
						</Badge>
					)}
				</CardHeader>
				<CardContent className="p-5 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
							<span className="text-[11px] font-semibold text-slate-500 block uppercase">
								Nominal Pembayaran Registrasi
							</span>
							<span className="text-base font-bold text-slate-800 mt-1 block">
								{formatRupiah(crmState?.finance?.registrasiNominal || 0)}
							</span>
						</div>
						<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
							<span className="text-[11px] font-semibold text-slate-500 block uppercase">
								Tanggal Pembayaran Registrasi
							</span>
							<span className="text-sm font-bold text-slate-800 mt-1 block">
								{crmState?.finance?.registrasiPaidDate
									? new Date(
											crmState.finance.registrasiPaidDate,
										).toLocaleDateString("id-ID", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})
									: "Belum dibayar"}
							</span>
						</div>
						<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2 lg:col-span-1 flex flex-col justify-between">
							<div className="flex items-center justify-between mb-1">
								<span className="text-[11px] font-semibold text-slate-500 block uppercase">
									Bukti Pembayaran Registrasi (PDF)
								</span>
								<Badge
									variant="outline"
									className="text-[10px] bg-white text-slate-500 border-slate-200 font-medium"
								>
									Monitoring Finance
								</Badge>
							</div>
							<DocumentUpload
								studentId={studentId}
								panel="finance"
								documentKey="registrasi"
								canEdit={false}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Checklist Berkas & ACC PMB */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
						<FileText className="w-4 h-4 text-indigo-600" />
						Checklist Berkas & ACC PMB (Registrasi Awal)
					</CardTitle>
					<PanelStatusBadge
						isAcc={crmState?.pmb?.isAcc}
						status={crmState?.pmb?.status}
						size="sm"
					/>
				</CardHeader>
				<CardContent className="p-5 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
						<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
							<div>
								<span className="text-xs font-bold text-slate-800 block">
									Formulir Masuk
								</span>
								<span className="text-[11px] text-slate-500">
									Pendaftaran Awal
								</span>
							</div>
							{crmState?.pmb?.formReceived ? (
								<Badge className="bg-emerald-500 text-white text-[10px]">
									Selesai
								</Badge>
							) : (
								<Badge variant="outline" className="text-slate-400 text-[10px]">
									Belum
								</Badge>
							)}
						</div>

						<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
							<div>
								<span className="text-xs font-bold text-slate-800 block">
									Berkas Lengkap
								</span>
								<span className="text-[11px] text-slate-500">Fisik Berkas</span>
							</div>
							{crmState?.pmb?.documentsComplete ? (
								<Badge className="bg-emerald-500 text-white text-[10px]">
									Selesai
								</Badge>
							) : (
								<Badge variant="outline" className="text-slate-400 text-[10px]">
									Belum
								</Badge>
							)}
						</div>

						<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
							<div>
								<span className="text-xs font-bold text-slate-800 block">
									Input Data Awal
								</span>
								<span className="text-[11px] text-slate-500">Entri Sistem</span>
							</div>
							{crmState?.pmb?.dataInputted ? (
								<Badge className="bg-emerald-500 text-white text-[10px]">
									Selesai
								</Badge>
							) : (
								<Badge variant="outline" className="text-slate-400 text-[10px]">
									Belum
								</Badge>
							)}
						</div>

						<div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
							<div>
								<span className="text-xs font-bold text-slate-800 block">
									Follow Up Awal
								</span>
								<span className="text-[11px] text-slate-500">Kontak Awal</span>
							</div>
							{crmState?.pmb?.initialFollowUp ? (
								<Badge className="bg-emerald-500 text-white text-[10px]">
									Selesai
								</Badge>
							) : (
								<Badge variant="outline" className="text-slate-400 text-[10px]">
									Belum
								</Badge>
							)}
						</div>
					</div>

					{/* Data Akuisisi & Referral info */}
					<div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
						<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
							<span className="text-[11px] font-bold text-indigo-900 block">
								Jalur Rekomendasi / Referral
							</span>
							<span className="text-xs font-semibold text-indigo-700 mt-0.5 block">
								{crmState?.pmb?.rekomendasi || "-"}
							</span>
						</div>
						<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
							<span className="text-[11px] font-bold text-indigo-900 block">
								Tim Visit / Sosialisasi
							</span>
							<span className="text-xs font-semibold text-indigo-700 mt-0.5 block">
								{crmState?.pmb?.timVisit ||
									crmState?.pmb?.timSosialisasi ||
									"-"}
							</span>
						</div>
						<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
							<span className="text-[11px] font-bold text-indigo-900 block">
								RO Referral / Koordinator
							</span>
							<span className="text-xs font-semibold text-indigo-700 mt-0.5 block">
								{crmState?.pmb?.roReferral || crmState?.pmb?.koordinator || "-"}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
