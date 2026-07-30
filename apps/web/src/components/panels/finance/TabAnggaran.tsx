"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
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
											<div className="text-xs text-slate-500">
												Oleh: Dosen ID {r.dosenId}
											</div>
										</TableCell>
										<TableCell>
											<ul className="list-disc pl-4 text-xs text-slate-600">
												{(r.daftarKebutuhan || []).map((k: any, i: number) => (
													<li key={i}>
														{k.name} ({k.qty} {k.unit})
													</li>
												))}
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
												<div className="text-xs text-rose-500 mt-1 mt-1">
													Catatan: {r.catatanFinance}
												</div>
											)}
										</TableCell>
										<TableCell>
											{canEdit && r.status === "menunggu" && (
												<div className="flex gap-2">
													<Button
														size="sm"
														className="bg-emerald-600 hover:bg-emerald-700"
														onClick={() => handleApprove(r.id)}
													>
														Setujui
													</Button>
													<Button
														size="sm"
														variant="destructive"
														onClick={() => setRejectId(r.id)}
													>
														Tolak
													</Button>
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
											<ul className="list-disc pl-4 text-xs text-slate-600">
												{(r.daftarSisaBahan || []).map((k: any, i: number) => (
													<li key={i}>
														{k.name} ({k.qty} {k.unit}) - {k.condition}
													</li>
												))}
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
							placeholder="Jelaskan alasan penolakan..."
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
		</div>
	);
}
