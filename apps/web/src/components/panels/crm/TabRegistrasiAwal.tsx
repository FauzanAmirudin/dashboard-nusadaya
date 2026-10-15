"use client";

import {
	Building2,
	CheckCircle,
	DollarSign,
	FileText,
	Loader2,
	MessageCircle,
	Phone,
	User,
	Users,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { API_URL as DEFAULT_API_URL, getToken } from "@/lib/eden";
import { formatReferralCategory } from "@/lib/referral";
import { formatRupiah } from "@/utils/format";

interface TabRegistrasiAwalProps {
	studentId: number;
	crmState: any;
	canEdit?: boolean;
	onUpdate?: () => void;
	API_URL?: string;
}

const FOLLOW_UP_OPTIONS = [
	{
		value: "Belum Dihubungi",
		label: "Belum Dihubungi",
		color: "text-slate-600 bg-slate-100",
	},
	{
		value: "Sudah Dihubungi",
		label: "Sudah Dihubungi",
		color: "text-blue-700 bg-blue-50",
	},
	{
		value: "Tertarik",
		label: "Tertarik",
		color: "text-emerald-700 bg-emerald-50",
	},
	{
		value: "Tidak Tertarik",
		label: "Tidak Tertarik",
		color: "text-rose-700 bg-rose-50",
	},
];

export function TabRegistrasiAwal({
	studentId,
	crmState,
	canEdit = false,
	onUpdate,
	API_URL = DEFAULT_API_URL,
}: TabRegistrasiAwalProps) {
	const [friendContacts, setFriendContacts] = useState<any[]>([]);
	const [isLoadingFriends, setIsLoadingFriends] = useState(true);
	const [updatingContactId, setUpdatingContactId] = useState<number | null>(
		null,
	);

	const fetchFriends = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/friend-contacts`,
				{
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					setFriendContacts(json.data || []);
				}
			}
		} catch (e) {
			console.error("Gagal memuat kontak kawan", e);
		} finally {
			setIsLoadingFriends(false);
		}
	};

	useEffect(() => {
		fetchFriends();
	}, [studentId]);

	const handleUpdateFollowUp = async (contactId: number, status: string) => {
		setUpdatingContactId(contactId);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/friend-contacts/${contactId}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ followUpStatus: status }),
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Status follow-up berhasil diperbarui");
				setFriendContacts((prev) =>
					prev.map((c) =>
						c.id === contactId ? { ...c, followUpStatus: status } : c,
					),
				);
			} else {
				toast.error(json.message || "Gagal memperbarui status follow-up");
			}
		} catch (e) {
			toast.error("Terjadi kesalahan sistem saat memperbarui status");
		} finally {
			setUpdatingContactId(null);
		}
	};

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

					{/* Data Akuisisi & Referral Terstruktur (Task P-1) */}
					<div className="pt-3 border-t border-slate-200/60 space-y-3">
						<h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
							<Building2 className="w-3.5 h-3.5 text-[#0517B0]" />
							Data Akuisisi & Asal Referral Terstruktur
						</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
							<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
								<span className="text-[10px] font-bold text-indigo-900 block uppercase">
									Kategori Referral
								</span>
								<span className="text-xs font-semibold text-indigo-800 mt-0.5 block">
									{crmState?.pmb?.referralCategory
										? formatReferralCategory(crmState.pmb.referralCategory)
										: crmState?.pmb?.rekomendasi || "-"}
								</span>
							</div>

							<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
								<span className="text-[10px] font-bold text-indigo-900 block uppercase">
									Nama Institusi / Sekolah
								</span>
								<span className="text-xs font-semibold text-indigo-800 mt-0.5 block">
									{crmState?.pmb?.referralInstitutionName || "-"}
								</span>
							</div>

							<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
								<span className="text-[10px] font-bold text-indigo-900 block uppercase">
									Nama PIC Referral
								</span>
								<span className="text-xs font-semibold text-indigo-800 mt-0.5 block">
									{crmState?.pmb?.referralContactName ||
										crmState?.pmb?.roReferral ||
										crmState?.pmb?.koordinator ||
										"-"}
								</span>
							</div>

							<div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100">
								<span className="text-[10px] font-bold text-indigo-900 block uppercase">
									No. WhatsApp PIC
								</span>
								{crmState?.pmb?.referralContactPhone ? (
									<a
										href={`https://wa.me/${crmState.pmb.referralContactPhone.replace(/[^0-9]/g, "")}`}
										target="_blank"
										rel="noreferrer"
										className="text-xs font-bold text-emerald-700 hover:underline mt-0.5 inline-flex items-center gap-1"
									>
										<MessageCircle className="w-3 h-3 text-emerald-600" />
										{crmState.pmb.referralContactPhone}
									</a>
								) : (
									<span className="text-xs text-slate-400 mt-0.5 block">-</span>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Kontak Kawan Prospek (Leads Follow-Up CRM) - Task P-2 & P-3 */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<Users className="w-4 h-4 text-[#0517B0]" />
							Daftar Kontak Kawan Prospek (Leads CRM)
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Kontak rekan rekomendasi dari pendaftar untuk prospek calon
							mahasiswa angkatan berikutnya.
						</p>
					</div>
					<Badge
						variant="outline"
						className="text-slate-600 bg-white text-xs font-bold"
					>
						{friendContacts.length} Kontak
					</Badge>
				</CardHeader>
				<CardContent className="p-0">
					{isLoadingFriends ? (
						<div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
							<Loader2 className="w-5 h-5 animate-spin text-[#0517B0]" />
							<span className="text-xs">Memuat kontak prospek...</span>
						</div>
					) : friendContacts.length === 0 ? (
						<div className="p-8 text-center text-slate-400 text-xs">
							Belum ada daftar kontak kawan yang tercatat untuk mahasiswa ini.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead className="bg-slate-50/70 border-b border-slate-200 text-slate-700 text-[11px] font-semibold">
									<tr>
										<th className="py-2.5 px-4 text-left">No</th>
										<th className="py-2.5 px-4 text-left">Nama Kawan</th>
										<th className="py-2.5 px-4 text-left">Nomor WhatsApp</th>
										<th className="py-2.5 px-4 text-left">
											Asal Sekolah / Hubungan
										</th>
										<th className="py-2.5 px-4 text-left">
											Status Follow-Up CRM
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-slate-800">
									{friendContacts.map((contact, index) => {
										const isUpdating = updatingContactId === contact.id;
										const cleanPhone = contact.phone
											? contact.phone.replace(/[^0-9]/g, "")
											: "";

										return (
											<tr
												key={contact.id || index}
												className="hover:bg-slate-50/50"
											>
												<td className="py-3 px-4 font-mono text-slate-400">
													{index + 1}
												</td>
												<td className="py-3 px-4 font-bold text-slate-900">
													{contact.name || "-"}
												</td>
												<td className="py-3 px-4 font-mono">
													{contact.phone ? (
														<a
															href={`https://wa.me/${cleanPhone}`}
															target="_blank"
															rel="noreferrer"
															className="inline-flex items-center gap-1.5 text-[#0517B0] hover:text-emerald-700 font-semibold"
														>
															<MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
															{contact.phone}
														</a>
													) : (
														"-"
													)}
												</td>
												<td className="py-3 px-4 text-slate-600">
													{contact.schoolOrRelation || "-"}
												</td>
												<td className="py-3 px-4">
													<div className="flex items-center gap-2">
														<Select
															value={
																contact.followUpStatus || "Belum Dihubungi"
															}
															onValueChange={(val) =>
																handleUpdateFollowUp(contact.id, val)
															}
															disabled={isUpdating}
														>
															<SelectTrigger className="h-8 text-xs w-[160px] bg-white border-slate-200">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{FOLLOW_UP_OPTIONS.map((opt) => (
																	<SelectItem key={opt.value} value={opt.value}>
																		<span className="text-xs">{opt.label}</span>
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														{isUpdating && (
															<Loader2 className="w-3.5 h-3.5 animate-spin text-[#0517B0]" />
														)}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
