"use client";

import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
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

export function TabRespons() {
	const [responses, setResponses] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const [selectedData, setSelectedData] = useState<any>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const [rejectionNotes, setRejectionNotes] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);

	const fetchResponses = async () => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/pmb/form-responses`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				},
			);
			const data = await res.json();
			if (data.success) {
				setResponses(data.data);
			}
		} catch (error) {
			console.error("Failed to fetch responses", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchResponses();
	}, []);

	const handleApprove = async (id: number) => {
		if (
			!confirm(
				"Apakah Anda yakin ingin menyetujui data ini? Mahasiswa baru akan otomatis ditambahkan ke sistem.",
			)
		)
			return;
		setIsProcessing(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/pmb/form-responses/${id}/approve`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				},
			);
			const data = await res.json();
			if (data.success) {
				toast.success("Data pendaftar berhasil disetujui!");
				fetchResponses();
				setIsDetailOpen(false);
			} else {
				toast.error(data.message || "Gagal menyetujui data");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleRejectSubmit = async () => {
		if (!rejectionNotes.trim()) {
			toast.error("Catatan penolakan harus diisi!");
			return;
		}

		setIsProcessing(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/pmb/form-responses/${selectedData.id}/reject`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
					body: JSON.stringify({ rejectionNotes }),
				},
			);
			const data = await res.json();
			if (data.success) {
				toast.success("Data pendaftar berhasil ditolak");
				fetchResponses();
				setIsRejectOpen(false);
				setIsDetailOpen(false);
				setRejectionNotes("");
			} else {
				toast.error(data.message || "Gagal menolak data");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-lg font-semibold text-slate-800">
						Menunggu Persetujuan
					</h3>
					<p className="text-sm text-slate-500">
						Tinjau dan setujui data pendaftar baru.
					</p>
				</div>
			</div>

			<div className="border border-slate-200 rounded-md bg-white">
				<Table>
					<TableHeader className="bg-slate-50">
						<TableRow>
							<TableHead>Nama Pendaftar</TableHead>
							<TableHead>No. HP / WhatsApp</TableHead>
							<TableHead>Asal Sekolah</TableHead>
							<TableHead>Program Diminati</TableHead>
							<TableHead>Waktu Submit</TableHead>
							<TableHead className="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8">
									Memuat data...
								</TableCell>
							</TableRow>
						) : responses.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center py-8 text-slate-500"
								>
									Belum ada data pendaftar baru.
								</TableCell>
							</TableRow>
						) : (
							responses.map((r) => (
								<TableRow key={r.id}>
									<TableCell className="font-medium text-slate-900">
										{r.name}
									</TableCell>
									<TableCell>{r.phone || "-"}</TableCell>
									<TableCell>{r.schoolOrigin || "-"}</TableCell>
									<TableCell>
										{r.program || "-"} {r.subProgram ? `(${r.subProgram})` : ""}
									</TableCell>
									<TableCell>
										{new Date(r.submittedAt).toLocaleDateString("id-ID", {
											day: "numeric",
											month: "short",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setSelectedData(r);
													setIsDetailOpen(true);
												}}
												className="border-slate-200 hover:bg-slate-50"
											>
												<Eye className="w-4 h-4 mr-2" />
												Lihat Detail
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Modal Detail */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Detail Data Pendaftar</DialogTitle>
					</DialogHeader>

					{selectedData && (
						<div className="space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-4">
									<h4 className="font-semibold border-b pb-2">
										Data Mahasiswa
									</h4>
									<div className="grid grid-cols-3 gap-2 text-sm">
										<span className="text-slate-500">Nama Lengkap</span>
										<span className="col-span-2 font-medium">
											{selectedData.name}
										</span>

										<span className="text-slate-500">Tempat, Tgl Lahir</span>
										<span className="col-span-2 font-medium">
											{selectedData.birthPlace},{" "}
											{selectedData.birthDate
												? new Date(selectedData.birthDate).toLocaleDateString(
														"id-ID",
													)
												: "-"}
										</span>

										<span className="text-slate-500">No. HP</span>
										<span className="col-span-2 font-medium">
											{selectedData.phone}
										</span>

										<span className="text-slate-500">Alamat Lengkap</span>
										<span className="col-span-2 font-medium">
											{selectedData.addressStreet} No. {selectedData.addressNo}{" "}
											RT {selectedData.addressRt}/RW {selectedData.addressRw},{" "}
											{selectedData.addressVillage},{" "}
											{selectedData.addressDistrict}, {selectedData.addressCity}
											, {selectedData.addressProvince}
										</span>
									</div>
								</div>

								<div className="space-y-4">
									<h4 className="font-semibold border-b pb-2">
										Data Pendidikan
									</h4>
									<div className="grid grid-cols-3 gap-2 text-sm">
										<span className="text-slate-500">Asal Sekolah</span>
										<span className="col-span-2 font-medium">
											{selectedData.schoolOrigin}
										</span>

										<span className="text-slate-500">Jurusan</span>
										<span className="col-span-2 font-medium">
											{selectedData.schoolMajor}
										</span>

										<span className="text-slate-500">Tahun Lulus</span>
										<span className="col-span-2 font-medium">
											{selectedData.graduationYear}
										</span>

										<span className="text-slate-500">Program Diminati</span>
										<span className="col-span-2 font-medium">
											{selectedData.program} - {selectedData.subProgram}
										</span>
									</div>
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-4 border-t">
								<Button
									variant="outline"
									className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
									onClick={() => setIsRejectOpen(true)}
								>
									<XCircle className="w-4 h-4 mr-2" />
									Tolak Data
								</Button>
								<Button
									className="bg-emerald-600 hover:bg-emerald-700 text-white"
									onClick={() => handleApprove(selectedData.id)}
									disabled={isProcessing}
								>
									{isProcessing ? (
										"Memproses..."
									) : (
										<>
											<CheckCircle2 className="w-4 h-4 mr-2" />
											Setujui & Daftarkan
										</>
									)}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Modal Tolak */}
			<Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tolak Data Pendaftar</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">
								Catatan Penolakan <span className="text-rose-500">*</span>
							</label>
							<Textarea
								placeholder="Berikan alasan mengapa data ini ditolak..."
								value={rejectionNotes}
								onChange={(e) => setRejectionNotes(e.target.value)}
							/>
						</div>
						<div className="flex justify-end gap-3 pt-4">
							<Button variant="outline" onClick={() => setIsRejectOpen(false)}>
								Batal
							</Button>
							<Button
								variant="destructive"
								onClick={handleRejectSubmit}
								disabled={isProcessing}
							>
								Konfirmasi Tolak
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
