"use client";

import {
	CheckCircle,
	CheckCircle2,
	Edit2,
	Loader2,
	RotateCcw,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { formatRupiah } from "@/utils/format";

interface TabAnggaranProps {
	canEdit: boolean;
}

export function TabAnggaran({ canEdit }: TabAnggaranProps) {
	const [requests, setRequests] = useState<any[]>([]);
	const [reports, setReports] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [rejectId, setRejectId] = useState<number | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [editStatusReq, setEditStatusReq] = useState<any | null>(null);

	const fetchData = async () => {
		try {
			const { data: reqData } = await api.finance["anggaran-praktik"].get();
			if (reqData?.success) setRequests(reqData.data || []);

			const { data: repData } = await api.finance["laporan-sisa-bahan"].get();
			if (repData?.success) setReports(repData.data || []);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleApprove = async (id: number) => {
		if (!canEdit) return;
		try {
			const { error } =
				await api.finance["anggaran-praktik"][id.toString()].approve.patch();
			if (!error) {
				toast.success("Anggaran disetujui");
				fetchData();
			} else toast.error("Gagal menyetujui anggaran");
		} catch (e) {
			toast.error("Gagal menyetujui anggaran");
		}
	};

	const handleReject = async () => {
		if (!canEdit || !rejectId || !rejectReason) return;
		try {
			const { error } = await api.finance["anggaran-praktik"][
				rejectId.toString()
			].reject.patch({ catatanFinance: rejectReason });
			if (!error) {
				toast.success("Anggaran ditolak");
				setRejectId(null);
				setRejectReason("");
				fetchData();
			} else toast.error("Gagal menolak anggaran");
		} catch (e) {
			toast.error("Gagal menolak anggaran");
		}
	};

	const handleResetStatus = async (id: number) => {
		if (!canEdit) return;
		try {
			const { error } =
				await api.finance["anggaran-praktik"][id.toString()].reset.patch();
			if (!error) {
				toast.success("Status anggaran dikembalikan ke Menunggu");
				fetchData();
			} else toast.error("Gagal mereset status anggaran");
		} catch (e) {
			toast.error("Gagal mereset status anggaran");
		}
	};

	return (
		<div className="space-y-6">
			{/* Pengajuan Anggaran */}
			<Card>
				<CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
					<CardTitle className="text-sm uppercase tracking-wider text-slate-800">
						Pengajuan Anggaran Praktik
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-8 flex justify-center">
							<Loader2 className="w-6 h-6 animate-spin text-slate-400" />
						</div>
					) : requests.length === 0 ? (
						<div className="p-8 text-center text-slate-500">
							Belum ada pengajuan anggaran dari Dosen.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50">
									<TableHead>Mata Kuliah</TableHead>
									<TableHead>Kebutuhan</TableHead>
									<TableHead>Total Nominal</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{requests.map((r) => (
									<TableRow key={r.id}>
										<TableCell className="font-medium">
											{r.mataKuliah}
											{r.namaKelas && (
												<div className="text-xs text-indigo-600 font-semibold">
													Kelas: {r.namaKelas}
												</div>
											)}
											<div className="text-xs text-slate-500">
												Oleh: Dosen ID {r.dosenId}
											</div>
										</TableCell>
										<TableCell>
											<ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5">
												{(r.daftarKebutuhan || []).map((k: any, i: number) => {
													const itemName = k.namaItem || k.name || "Item";
													const qty = k.jumlah ?? k.qty ?? 1;
													const unit = k.satuan || k.unit || "pcs";
													const price = k.satuanHarga
														? ` @ ${formatRupiah(k.satuanHarga)}`
														: "";
													return (
														<li key={i}>
															<span className="font-semibold">{itemName}</span>{" "}
															({qty} {unit}){price}
														</li>
													);
												})}
											</ul>
										</TableCell>
										<TableCell className="font-bold">
											{formatRupiah(r.totalNominal)}
										</TableCell>
										<TableCell>
											{r.status === "menunggu" && (
												<Badge
													variant="outline"
													className="text-amber-600 border-amber-200 bg-amber-50"
												>
													Menunggu
												</Badge>
											)}
											{r.status === "disetujui" && (
												<Badge
													variant="outline"
													className="text-emerald-600 border-emerald-200 bg-emerald-50"
												>
													Disetujui
												</Badge>
											)}
											{r.status === "ditolak" && (
												<Badge
													variant="outline"
													className="text-rose-600 border-rose-200 bg-rose-50"
												>
													Ditolak
												</Badge>
											)}
											{r.catatanFinance && (
												<div className="text-xs text-rose-500 mt-1">
													Catatan: {r.catatanFinance}
												</div>
											)}
										</TableCell>
										<TableCell>
											{canEdit && (
												<div className="flex items-center gap-2">
													{r.status === "menunggu" ? (
														<>
															<Button
																size="sm"
																className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
																onClick={() => handleApprove(r.id)}
															>
																Setujui
															</Button>
															<Button
																size="sm"
																variant="destructive"
																className="text-xs h-8"
																onClick={() => setRejectId(r.id)}
															>
																Tolak
															</Button>
														</>
													) : (
														<Button
															size="sm"
															variant="outline"
															className="text-xs h-8 gap-1.5 border-slate-300 hover:bg-slate-100 font-semibold text-slate-700"
															onClick={() => setEditStatusReq(r)}
														>
															<Edit2 className="w-3.5 h-3.5 text-slate-600" />
															Ubah Status
														</Button>
													)}
												</div>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Laporan Sisa Bahan */}
			<Card>
				<CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
					<CardTitle className="text-sm uppercase tracking-wider text-slate-800">
						Laporan Sisa Bahan (Read Only)
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-8 flex justify-center">
							<Loader2 className="w-6 h-6 animate-spin text-slate-400" />
						</div>
					) : reports.length === 0 ? (
						<div className="p-8 text-center text-slate-500">
							Belum ada laporan sisa bahan dari Dosen.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50">
									<TableHead>Terkait Pengajuan ID</TableHead>
									<TableHead>Sisa Bahan</TableHead>
									<TableHead>Catatan Dosen</TableHead>
									<TableHead>Lampiran</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{reports.map((r) => (
									<TableRow key={r.id}>
										<TableCell>#{r.budgetRequestId}</TableCell>
										<TableCell>
											<ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5">
												{(r.daftarSisaBahan || []).map((k: any, i: number) => {
													const itemName = k.namaItem || k.name || "Material";
													const qty = k.jumlahSisa ?? k.jumlah ?? k.qty ?? 0;
													const unit = k.satuan || k.unit || "pcs";
													const condition = k.kondisi || k.condition || "Baik";
													return (
														<li key={i}>
															<span className="font-semibold">{itemName}</span>{" "}
															({qty} {unit}) -{" "}
															<span className="italic text-slate-500">
																{condition}
															</span>
														</li>
													);
												})}
											</ul>
										</TableCell>
										<TableCell className="text-xs">
											{r.catatanDosen || "-"}
										</TableCell>
										<TableCell>
											{r.fileUrl && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => window.open(r.fileUrl, "_blank")}
												>
													Lihat File
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

			{/* Reject Dialog */}
			<Dialog
				open={rejectId !== null}
				onOpenChange={(open) => !open && setRejectId(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tolak Pengajuan Anggaran</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<label className="text-sm font-semibold mb-2 block">
							Catatan Penolakan (Wajib)
						</label>
						<Textarea
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							placeholder="Jelaskan alasan penolakan agar dosen dapat merevisi..."
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRejectId(null)}>
							Batal
						</Button>
						<Button
							variant="destructive"
							onClick={handleReject}
							disabled={!rejectReason}
						>
							Tolak Pengajuan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Status Dialog */}
			<Dialog
				open={editStatusReq !== null}
				onOpenChange={(open) => !open && setEditStatusReq(null)}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
							<Edit2 className="w-4 h-4 text-indigo-600" />
							Ubah Status Pengajuan Anggaran
						</DialogTitle>
					</DialogHeader>

					{editStatusReq && (
						<div className="space-y-4 py-2">
							<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
								<div className="text-xs text-slate-500 font-medium">
									Mata Kuliah / Kelas:
								</div>
								<div className="text-sm font-bold text-slate-800">
									{editStatusReq.mataKuliah}{" "}
									{editStatusReq.namaKelas
										? `(${editStatusReq.namaKelas})`
										: ""}
								</div>
								<div className="text-xs text-slate-500">
									Total Nominal:{" "}
									<span className="font-bold text-indigo-700">
										{formatRupiah(editStatusReq.totalNominal)}
									</span>
								</div>
								<div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
									Status Saat Ini:
									<Badge
										variant="outline"
										className={
											editStatusReq.status === "disetujui"
												? "bg-emerald-50 text-emerald-700 border-emerald-200"
												: editStatusReq.status === "ditolak"
													? "bg-rose-50 text-rose-700 border-rose-200"
													: "bg-amber-50 text-amber-700 border-amber-200"
										}
									>
										{editStatusReq.status === "disetujui"
											? "Disetujui"
											: editStatusReq.status === "ditolak"
												? "Ditolak"
												: "Menunggu"}
									</Badge>
								</div>
							</div>

							<div className="space-y-2 pt-1">
								<span className="text-xs font-bold text-slate-700 block">
									Pilih Aksi Perbaikan Status:
								</span>

								{editStatusReq.status !== "disetujui" && (
									<Button
										type="button"
										onClick={() => {
											const id = editStatusReq.id;
											setEditStatusReq(null);
											handleApprove(id);
										}}
										className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 justify-start px-4 gap-2"
									>
										<CheckCircle2 className="w-4 h-4" />
										Setujui Anggaran Ini
									</Button>
								)}

								{editStatusReq.status !== "ditolak" && (
									<Button
										type="button"
										onClick={() => {
											const id = editStatusReq.id;
											setEditStatusReq(null);
											setRejectId(id);
										}}
										className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 justify-start px-4 gap-2"
									>
										<XCircle className="w-4 h-4" />
										Tolak & Minta Revisi
									</Button>
								)}

								<Button
									type="button"
									variant="outline"
									onClick={() => {
										const id = editStatusReq.id;
										setEditStatusReq(null);
										handleResetStatus(id);
									}}
									className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 text-xs h-9 justify-start px-4 gap-2"
								>
									<RotateCcw className="w-4 h-4 text-slate-500" />
									Kembalikan ke Status &quot;Menunggu&quot;
								</Button>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditStatusReq(null)}
							className="text-xs h-8"
						>
							Batal
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
