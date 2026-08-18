"use client";

import {
	CheckCircle,
	Clock,
	CreditCard,
	Edit2,
	Eye,
	Loader2,
	UploadCloud,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_URL, api, getToken } from "@/lib/eden";
import { formatRupiah } from "@/utils/format";

interface TabFeeSharingProps {
	studentId: number;
	canEdit: boolean;
}

export function TabFeeSharing({ studentId, canEdit }: TabFeeSharingProps) {
	const [recipients, setRecipients] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [uploadingId, setUploadingId] = useState<number | null>(null);

	const fetchRecipients = async () => {
		try {
			const { data, error } =
				await api.finance["fee-sharing"][studentId.toString()].get();
			if (!error && data?.success) {
				setRecipients(data.data?.recipients || []);
			}
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRecipients();
	}, [studentId]);

	const handleUpdateFee = async (id: number, nominal: number) => {
		if (!canEdit) return;
		try {
			const res = await fetch(
				`${API_URL}/finance/fee-sharing/recipients/${id}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						nominalFee: Math.max(0, Number(nominal) || 0),
					}),
				},
			);
			const json = await res.json();
			if (res.ok && !json.error) {
				toast.success("Nominal fee berhasil diperbarui");
				fetchRecipients();
			} else {
				toast.error("Gagal memperbarui fee");
			}
		} catch (e) {
			toast.error("Gagal memperbarui fee");
		}
	};

	const handleUpdateStatus = async (id: number, isPaid: boolean) => {
		if (!canEdit) return;
		try {
			const res = await fetch(
				`${API_URL}/finance/fee-sharing/recipients/${id}`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						statusPencairan: isPaid ? "sudah_dibayarkan" : "belum_dibayarkan",
						tanggalCair: isPaid ? new Date().toISOString() : null,
					}),
				},
			);
			const json = await res.json();
			if (res.ok && (json.success || !json.error)) {
				toast.success(
					isPaid
						? "Status pencairan berhasil ditandai Cair"
						: "Status pencairan berhasil dibatalkan",
				);
				fetchRecipients();
			} else {
				toast.error(json.message || "Gagal memperbarui status");
			}
		} catch (e) {
			console.error("Error updating status:", e);
			toast.error("Gagal memperbarui status");
		}
	};

	const handleInvoiceUpload = async (recipientId: number, file: File) => {
		if (!canEdit) return;
		if (file.type !== "application/pdf") {
			toast.error("File invoice harus berformat PDF");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Ukuran file maksimal 5MB");
			return;
		}

		setUploadingId(recipientId);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/fee-share-recipients/${recipientId}/upload-invoice`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${getToken()}` },
					body: formData,
				},
			);
			if (res.ok) {
				toast.success("File invoice berhasil diunggah");
				fetchRecipients();
			} else {
				toast.error("Gagal mengunggah file invoice");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setUploadingId(null);
		}
	};

	const totalFee = recipients.reduce(
		(acc, curr) => acc + (curr.nominalFee || 0),
		0,
	);

	return (
		<div className="space-y-6">
			{/* Total Distribusi Fee Card */}
			<Card className="bg-slate-50 border-slate-200 shadow-sm">
				<CardHeader className="py-4 px-5">
					<div className="flex items-center justify-between">
						<CardTitle className="text-slate-800 text-sm font-bold flex items-center gap-2">
							<Users className="w-4 h-4 text-amber-600" />
							Total Distribusi Fee
						</CardTitle>
						<Badge
							variant="outline"
							className="bg-white text-sm font-bold px-3 py-1 border-slate-300 text-slate-800"
						>
							{formatRupiah(totalFee)}
						</Badge>
					</div>
				</CardHeader>
			</Card>

			{/* Daftar Penerima Fee Table */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-200 py-3.5 px-4 flex flex-row items-center justify-between">
					<CardTitle className="text-xs uppercase tracking-wider font-bold text-slate-800">
						Daftar Penerima Fee
					</CardTitle>
					{canEdit && (
						<div>
							{!isEditing ? (
								<Button
									onClick={() => setIsEditing(true)}
									size="sm"
									className="bg-[#0517B0] hover:bg-[#04128d] text-white text-xs gap-1.5 h-8"
								>
									<Edit2 className="w-3.5 h-3.5" />
									Edit
								</Button>
							) : (
								<Button
									onClick={() => setIsEditing(false)}
									variant="outline"
									size="sm"
									className="text-xs h-8 bg-white border-slate-300"
								>
									Selesai Edit
								</Button>
							)}
						</div>
					)}
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-8 flex justify-center">
							<Loader2 className="w-6 h-6 animate-spin text-slate-400" />
						</div>
					) : recipients.length === 0 ? (
						<div className="p-8 text-center text-xs text-slate-500">
							Belum ada penerima fee yang ditambahkan dari pihak PMB.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50/70">
									<TableHead className="text-xs font-bold text-slate-700">
										Penerima
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-700">
										Nama
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-700">
										No. HP
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-700">
										Fee (Nominal)
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-700">
										Invoice (PDF)
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-700">
										Status
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-700 text-right">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{recipients.map((r) => (
									<TableRow key={r.id} className="hover:bg-slate-50/50">
										<TableCell>
											<Badge
												variant="outline"
												className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-semibold"
											>
												{r.kategori}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="font-semibold text-slate-800 text-xs">
												{r.namaReferral}
											</div>
											{(r.namaBank || r.noRekening) && (
												<div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
													<CreditCard className="w-3 h-3" />
													{r.namaBank || "Bank"} - {r.noRekening || "-"}
												</div>
											)}
										</TableCell>
										<TableCell className="text-xs text-slate-600 font-medium">
											{r.noHp}
										</TableCell>
										<TableCell>
											{isEditing ? (
												<Input
													type="number"
													min={0}
													placeholder="0"
													defaultValue={r.nominalFee || ""}
													onKeyDown={(e) => {
														if (e.key === "-" || e.key === "e" || e.key === "E")
															e.preventDefault();
													}}
													onBlur={(e) =>
														handleUpdateFee(
															r.id,
															Math.max(0, Number(e.target.value) || 0),
														)
													}
													disabled={
														!canEdit || r.statusPencairan === "sudah_dibayarkan"
													}
													className="w-32 h-8 text-xs font-semibold bg-white"
												/>
											) : (
												<div className="font-semibold text-xs text-slate-800">
													{formatRupiah(r.nominalFee || 0)}
												</div>
											)}
										</TableCell>
										<TableCell>
											{r.invoiceFileUrl ? (
												<a
													href={`${API_URL}/students/${studentId}/pmb/fee-share-recipients/${r.id}/invoice`}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-1 text-xs text-[#0517B0] hover:underline font-semibold"
												>
													<Eye className="w-3.5 h-3.5" />
													Lihat Invoice
												</a>
											) : canEdit && isEditing ? (
												<label className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 cursor-pointer border border-dashed border-slate-300 rounded px-2 py-1 bg-slate-50 hover:bg-amber-50/50 transition-colors">
													{uploadingId === r.id ? (
														<Loader2 className="w-3 h-3 animate-spin" />
													) : (
														<UploadCloud className="w-3 h-3" />
													)}
													<span className="text-[11px]">Upload PDF</span>
													<input
														type="file"
														accept="application/pdf"
														className="hidden"
														onChange={(e) => {
															const file = e.target.files?.[0];
															if (file) handleInvoiceUpload(r.id, file);
														}}
													/>
												</label>
											) : (
												<span className="text-xs text-slate-400 font-medium">
													Belum ada
												</span>
											)}
										</TableCell>
										<TableCell>
											{r.statusPencairan === "sudah_dibayarkan" ? (
												<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px]">
													<CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />{" "}
													Cair
												</Badge>
											) : (
												<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px]">
													<Clock className="w-3 h-3 mr-1 text-amber-600" />{" "}
													Pending
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											{canEdit && (
												<Button
													variant={
														r.statusPencairan === "sudah_dibayarkan"
															? "outline"
															: "default"
													}
													size="sm"
													disabled={!isEditing}
													onClick={() =>
														handleUpdateStatus(
															r.id,
															r.statusPencairan !== "sudah_dibayarkan",
														)
													}
													className={`h-7 text-xs ${
														r.statusPencairan === "sudah_dibayarkan"
															? "border-slate-300 text-slate-600"
															: "bg-[#0517B0] hover:bg-[#04128d] text-white"
													}`}
												>
													{r.statusPencairan === "sudah_dibayarkan"
														? "Batalkan Cair"
														: "Tandai Cair"}
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
