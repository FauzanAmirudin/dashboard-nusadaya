"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasRole, useAuthStore } from "@/store";

export function VocationalBudgetTab() {
	const { user, token } = useAuthStore();
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const canEdit = hasRole(user, "finance");

	const [requests, setRequests] = useState<any[]>([]);
	const [leftovers, setLeftovers] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Form State for new request
	const [className, setClassName] = useState("");
	const [subject, setSubject] = useState("");
	const [weekNumber, setWeekNumber] = useState<number | "">("");
	const [requestDate, setRequestDate] = useState("");
	const [notes, setNotes] = useState("");
	const [materials, setMaterials] = useState<
		{ name: string; qty: number; unit: string; estPrice: number }[]
	>([{ name: "", qty: 1, unit: "pcs", estPrice: 0 }]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Form State for Leftover Materials
	const [loClassName, setLoClassName] = useState("");
	const [loSubject, setLoSubject] = useState("");
	const [loReportDate, setLoReportDate] = useState("");
	const [loMaterialName, setLoMaterialName] = useState("");
	const [loQty, setLoQty] = useState("");
	const [loUnit, setLoUnit] = useState("Kg");
	const [loCondition, setLoCondition] = useState("Layak Pakai");
	const [loNotes, setLoNotes] = useState("");
	const [isSubmittingLo, setIsSubmittingLo] = useState(false);

	const fetchRequests = async () => {
		try {
			const res = await fetch(`${API_URL}/vocational/budget-requests`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success) {
				setRequests(data.data);
			}
		} catch (error) {
			console.error("Failed to fetch requests", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchLeftovers = async () => {
		try {
			const res = await fetch(`${API_URL}/vocational/leftovers`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success) {
				setLeftovers(data.data);
			}
		} catch (error) {
			console.error("Failed to fetch leftovers", error);
		}
	};

	useEffect(() => {
		fetchRequests();
		fetchLeftovers();
	}, []);

	const handleAddMaterial = () => {
		setMaterials([
			...materials,
			{ name: "", qty: 1, unit: "pcs", estPrice: 0 },
		]);
	};

	const handleRemoveMaterial = (index: number) => {
		setMaterials(materials.filter((_, i) => i !== index));
	};

	const handleMaterialChange = (
		index: number,
		field: string,
		value: string | number,
	) => {
		const newMaterials = [...materials];
		newMaterials[index] = { ...newMaterials[index], [field]: value };
		setMaterials(newMaterials);
	};

	const totalEstimate = materials.reduce(
		(acc, curr) => acc + Number(curr.qty) * Number(curr.estPrice),
		0,
	);

	const handleSubmit = async () => {
		if (!className || !subject || !weekNumber || !requestDate) {
			toast.error(
				"Mohon lengkapi data kelas, mata praktik, minggu ke, dan tanggal pengajuan",
			);
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`${API_URL}/vocational/budget-requests`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					className,
					subject,
					weekNumber: Number(weekNumber),
					requestDate,
					materials,
					totalEstimate,
					notes,
				}),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Pengajuan anggaran berhasil dikirim");
				fetchRequests();
				// Reset form
				setClassName("");
				setSubject("");
				setWeekNumber("");
				setRequestDate("");
				setNotes("");
				setMaterials([{ name: "", qty: 1, unit: "pcs", estPrice: 0 }]);
			} else {
				toast.error("Gagal mengajukan anggaran");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLeftoverSubmit = async () => {
		if (
			!loClassName ||
			!loSubject ||
			!loReportDate ||
			!loMaterialName ||
			!loQty
		) {
			toast.error(
				"Mohon lengkapi data kelas, mata praktik, tanggal, bahan, dan qty",
			);
			return;
		}

		setIsSubmittingLo(true);
		try {
			const res = await fetch(`${API_URL}/vocational/leftovers`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					className: loClassName,
					subject: loSubject,
					reportDate: loReportDate,
					materialName: loMaterialName,
					qty: Number(loQty),
					unit: loUnit,
					condition: loCondition,
					notes: loNotes,
				}),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Sisa bahan berhasil dilaporkan");
				fetchLeftovers();
				// Reset form
				setLoClassName("");
				setLoSubject("");
				setLoReportDate("");
				setLoMaterialName("");
				setLoQty("");
				setLoUnit("Kg");
				setLoCondition("Layak Pakai");
				setLoNotes("");
			} else {
				toast.error("Gagal melaporkan sisa bahan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsSubmittingLo(false);
		}
	};

	const handleUpdateStatus = async (id: number, status: string) => {
		if (!canEdit) return;
		try {
			const res = await fetch(`${API_URL}/vocational/budget-requests/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ status }),
			});
			const data = await res.json();
			if (data.success) {
				toast.success(`Status berhasil diubah menjadi ${status}`);
				fetchRequests();
			} else {
				toast.error("Gagal mengubah status");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const formatRupiah = (val: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	};

	return (
		<div className="space-y-8">
			{/* Form Pengajuan Mingguan */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						📝 Pengajuan Anggaran Praktik Mingguan
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<div>
							<label className="text-xs font-semibold block mb-1 text-slate-600">
								Nama Kelas / Rombongan
							</label>
							<Input
								placeholder="Contoh: Kelas A - Robotika"
								value={className}
								onChange={(e) => setClassName(e.target.value)}
							/>
						</div>
						<div>
							<label className="text-xs font-semibold block mb-1 text-slate-600">
								Mata Praktik
							</label>
							<Input
								placeholder="Contoh: Merakit Robot"
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
							/>
						</div>
						<div>
							<label className="text-xs font-semibold block mb-1 text-slate-600">
								Minggu Ke-
							</label>
							<Input
								type="number"
								placeholder="1"
								value={weekNumber}
								onChange={(e) =>
									setWeekNumber(e.target.value ? Number(e.target.value) : "")
								}
							/>
						</div>
						<div>
							<label className="text-xs font-semibold block mb-1 text-slate-600">
								Tanggal Pengajuan
							</label>
							<Input
								type="date"
								value={requestDate}
								onChange={(e) => setRequestDate(e.target.value)}
							/>
						</div>
					</div>

					<div className="mb-4 overflow-x-auto">
						<div className="flex justify-between items-center mb-2">
							<label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
								Daftar Bahan Baku
							</label>
							<Button
								variant="outline"
								size="sm"
								onClick={handleAddMaterial}
								className="text-xs h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
							>
								<Plus className="w-3 h-3 mr-1" /> Tambah Bahan
							</Button>
						</div>
						<div className="border border-slate-200 rounded-md overflow-hidden min-w-[600px]">
							<table className="w-full text-sm text-left">
								<thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200">
									<tr>
										<th className="px-4 py-2">Nama Bahan</th>
										<th className="px-4 py-2 w-20">Qty</th>
										<th className="px-4 py-2 w-24">Satuan</th>
										<th className="px-4 py-2 w-40">Est. Harga Satuan</th>
										<th className="px-4 py-2 w-40">Subtotal</th>
										<th className="px-4 py-2 w-10"></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{materials.map((item, idx) => (
										<tr key={idx}>
											<td className="p-2">
												<Input
													className="h-8 text-sm"
													value={item.name}
													onChange={(e) =>
														handleMaterialChange(idx, "name", e.target.value)
													}
												/>
											</td>
											<td className="p-2">
												<Input
													type="number"
													className="h-8 text-sm"
													placeholder="0"
													value={item.qty === 0 || !item.qty ? "" : item.qty}
													onChange={(e) =>
														handleMaterialChange(
															idx,
															"qty",
															e.target.value === ""
																? 0
																: Number(e.target.value),
														)
													}
												/>
											</td>
											<td className="p-2">
												<Input
													className="h-8 text-sm"
													placeholder="Satuan"
													value={item.unit}
													onChange={(e) =>
														handleMaterialChange(idx, "unit", e.target.value)
													}
												/>
											</td>
											<td className="p-2">
												<Input
													type="number"
													className="h-8 text-sm"
													placeholder="0"
													value={
														item.estPrice === 0 || !item.estPrice
															? ""
															: item.estPrice
													}
													onChange={(e) =>
														handleMaterialChange(
															idx,
															"estPrice",
															e.target.value === ""
																? 0
																: Number(e.target.value),
														)
													}
												/>
											</td>
											<td className="p-2 font-medium text-slate-700">
												{formatRupiah(item.qty * item.estPrice)}
											</td>
											<td className="p-2">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"
													onClick={() => handleRemoveMaterial(idx)}
												>
													<Trash2 className="w-4 h-4" />
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
						<div className="w-full md:w-1/2 mb-4 md:mb-0">
							<Input
								placeholder="Catatan tambahan (opsional)..."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								className="bg-white"
							/>
						</div>
						<div className="flex items-center gap-4">
							<div className="text-right">
								<p className="text-xs text-slate-500 font-semibold uppercase">
									Total Estimasi Anggaran
								</p>
								<p className="text-xl font-bold text-[#0517B0]">
									{formatRupiah(totalEstimate)}
								</p>
							</div>
							<Button
								onClick={handleSubmit}
								disabled={isSubmitting}
								className="bg-[#0517B0] hover:bg-blue-800 text-white shadow-md"
							>
								{isSubmitting && (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								)}
								Ajukan Anggaran
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Daftar Riwayat Pengajuan */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						📊 Riwayat Pengajuan Anggaran Praktik
					</h3>
				</div>
				<div className="p-5 overflow-x-auto">
					{isLoading ? (
						<div className="flex justify-center p-8">
							<Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
						</div>
					) : requests.length === 0 ? (
						<p className="text-center text-slate-500 italic p-4">
							Belum ada riwayat pengajuan anggaran.
						</p>
					) : (
						<table className="w-full text-sm text-left border-collapse min-w-[800px]">
							<thead className="bg-slate-100 text-xs text-slate-600 font-bold uppercase border-y border-slate-200">
								<tr>
									<th className="px-4 py-3">Tanggal & Kelas</th>
									<th className="px-4 py-3">Mata Praktik</th>
									<th className="px-4 py-3 w-64">Daftar Bahan</th>
									<th className="px-4 py-3">Total Estimasi</th>
									<th className="px-4 py-3">Status</th>
									{canEdit && (
										<th className="px-4 py-3 text-right">Aksi Finance</th>
									)}
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{requests.map((req) => (
									<tr key={req.id} className="hover:bg-slate-50">
										<td className="px-4 py-3">
											<div className="font-semibold text-slate-800">
												{req.className} (Mg. {req.weekNumber})
											</div>
											<div className="text-xs text-slate-500">
												{new Date(req.requestDate).toLocaleDateString("id-ID")}
											</div>
										</td>
										<td className="px-4 py-3 text-slate-700">{req.subject}</td>
										<td className="px-4 py-3">
											{req.materials &&
											Array.isArray(req.materials) &&
											req.materials.length > 0 ? (
												<ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
													{req.materials.map((m: any, i: number) => (
														<li key={i}>
															{m.name}{" "}
															<span className="text-slate-400">
																({m.qty} {m.unit})
															</span>
														</li>
													))}
												</ul>
											) : (
												<span className="text-xs text-slate-400 italic">-</span>
											)}
										</td>
										<td className="px-4 py-3 font-semibold text-slate-700">
											{formatRupiah(Number(req.totalEstimate))}
										</td>
										<td className="px-4 py-3">
											{req.status === "pending" && (
												<span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-semibold">
													Menunggu
												</span>
											)}
											{req.status === "approved" && (
												<span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold">
													Disetujui
												</span>
											)}
											{req.status === "rejected" && (
												<span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-semibold">
													Ditolak
												</span>
											)}
										</td>
										{canEdit && (
											<td className="px-4 py-3 text-right">
												{req.status === "pending" && (
													<div className="flex justify-end gap-2">
														<Button
															size="sm"
															variant="outline"
															className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
															onClick={() =>
																handleUpdateStatus(req.id, "approved")
															}
														>
															Setujui
														</Button>
														<Button
															size="sm"
															variant="outline"
															className="h-7 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
															onClick={() =>
																handleUpdateStatus(req.id, "rejected")
															}
														>
															Tolak
														</Button>
													</div>
												)}
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>

			{/* Pelaporan Sisa Bahan (Inventory) */}
			<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-8">
				<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
					<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
						📦 Laporan Sisa Bahan Praktik (Storage)
					</h3>
				</div>
				<div className="p-5">
					<div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5 mb-6">
						<h4 className="text-sm font-bold text-blue-800 mb-4 uppercase">
							Form Pelaporan Sisa Bahan
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
							<div>
								<label className="text-xs font-semibold text-slate-600 block mb-1">
									Kelas
								</label>
								<Input
									className="bg-white h-9 text-sm"
									placeholder="Contoh: Barista (Mg. 2)"
									value={loClassName}
									onChange={(e) => setLoClassName(e.target.value)}
								/>
							</div>
							<div>
								<label className="text-xs font-semibold text-slate-600 block mb-1">
									Mata Praktik
								</label>
								<Input
									className="bg-white h-9 text-sm"
									placeholder="Contoh: Barista"
									value={loSubject}
									onChange={(e) => setLoSubject(e.target.value)}
								/>
							</div>
							<div>
								<label className="text-xs font-semibold text-slate-600 block mb-1">
									Tanggal Laporan
								</label>
								<Input
									type="date"
									className="bg-white h-9 text-sm"
									value={loReportDate}
									onChange={(e) => setLoReportDate(e.target.value)}
								/>
							</div>
							<div>
								<label className="text-xs font-semibold text-slate-600 block mb-1">
									Kondisi Barang
								</label>
								<select
									className="w-full text-sm border-slate-200 rounded-md h-9 px-3 bg-white"
									value={loCondition}
									onChange={(e) => setLoCondition(e.target.value)}
								>
									<option value="Layak Pakai">
										Layak Pakai (Masuk Gudang)
									</option>
									<option value="Rusak/Kadaluarsa">Rusak / Kadaluarsa</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
							<div className="md:col-span-5">
								<label className="text-xs font-semibold text-slate-600 block mb-1">
									Nama Bahan Baku
								</label>
								<Input
									className="bg-white h-9 text-sm"
									placeholder="Contoh: Biji Kopi Arabika"
									value={loMaterialName}
									onChange={(e) => setLoMaterialName(e.target.value)}
								/>
							</div>
							<div className="md:col-span-3">
								<label className="text-xs font-semibold text-slate-600 block mb-1">
									Jumlah (Qty)
								</label>
								<Input
									type="number"
									step="0.01"
									className="bg-white h-9 text-sm"
									placeholder="0"
									value={loQty === "0" || !loQty ? "" : loQty}
									onChange={(e) => setLoQty(e.target.value)}
								/>
							</div>
							<div className="md:col-span-4">
								<label className="text-xs font-semibold text-slate-600 block mb-1">
									Satuan
								</label>
								<Input
									className="bg-white h-9 text-sm"
									placeholder="Kg / Ltr / Pcs"
									value={loUnit}
									onChange={(e) => setLoUnit(e.target.value)}
								/>
							</div>
						</div>

						<div className="flex flex-col md:flex-row gap-4 items-end">
							<div className="flex-1">
								<label className="text-xs font-semibold text-slate-600 block mb-1">
									Catatan Tambahan (Opsional)
								</label>
								<Input
									className="bg-white h-9 text-sm"
									placeholder="Contoh: Sisa 1/2 bungkus, masih tersegel rapi"
									value={loNotes}
									onChange={(e) => setLoNotes(e.target.value)}
								/>
							</div>
							<Button
								onClick={handleLeftoverSubmit}
								disabled={isSubmittingLo}
								className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-9 px-6"
							>
								{isSubmittingLo && (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								)}
								Laporkan Sisa Bahan
							</Button>
						</div>
					</div>

					{/* Tabel Riwayat Sisa Bahan */}
					<h4 className="text-sm font-bold text-slate-700 mb-3 uppercase flex items-center">
						📋 Daftar Inventaris Sisa Bahan
					</h4>
					<div className="overflow-x-auto border border-slate-200 rounded-md">
						<table className="w-full text-sm text-left">
							<thead className="bg-slate-100 text-xs text-slate-600 font-bold uppercase border-b border-slate-200">
								<tr>
									<th className="px-4 py-3">Tanggal & Kelas</th>
									<th className="px-4 py-3">Bahan Baku</th>
									<th className="px-4 py-3">Sisa / Qty</th>
									<th className="px-4 py-3">Kondisi</th>
									<th className="px-4 py-3">Catatan</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{leftovers.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="text-center text-slate-500 italic p-6"
										>
											Belum ada riwayat laporan sisa bahan.
										</td>
									</tr>
								) : (
									leftovers.map((lo, idx) => (
										<tr key={idx} className="hover:bg-slate-50">
											<td className="px-4 py-3">
												<div className="font-semibold text-slate-800">
													{lo.className}
												</div>
												<div className="text-xs text-slate-500">
													{new Date(lo.reportDate).toLocaleDateString("id-ID")}
												</div>
											</td>
											<td className="px-4 py-3 font-medium text-slate-700">
												{lo.materialName}
											</td>
											<td className="px-4 py-3 font-bold text-slate-800">
												{lo.qty}{" "}
												<span className="text-slate-500 font-normal text-xs">
													{lo.unit}
												</span>
											</td>
											<td className="px-4 py-3">
												{lo.condition === "Layak Pakai" ? (
													<span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-semibold">
														Layak Pakai
													</span>
												) : (
													<span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-semibold">
														Rusak
													</span>
												)}
											</td>
											<td className="px-4 py-3 text-slate-600 text-xs">
												{lo.notes || "-"}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
