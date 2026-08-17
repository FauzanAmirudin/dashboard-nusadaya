"use client";

import { Edit2, Loader2, Plus, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export function TabPiket({ studentId }: { studentId: number }) {
	const [records, setRecords] = useState<any[]>([]);
	const [schedules, setSchedules] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { user } = useAuthStore();
	const canEdit = user?.role === "superadmin" || user?.role === "akademik";

	const [editingRecord, setEditingRecord] = useState<number | null>(null);
	const [editForm, setEditForm] = useState({ status: "", notes: "" });
	const [isSaving, setIsSaving] = useState(false);

	// Add Form State
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addForm, setAddForm] = useState({
		date: new Date().toISOString().split("T")[0],
		status: "hadir",
		notes: "",
		scheduleId: "",
	});
	const [isAdding, setIsAdding] = useState(false);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const res = await (api as any).attendance.mahasiswa[
				studentId
			].piket.get();
			if (res.data?.success) {
				setRecords(res.data.data.records || []);
				const scheds = res.data.data.schedules || [];
				setSchedules(scheds);
				// Default to first schedule if available
				if (scheds.length > 0 && !addForm.scheduleId) {
					setAddForm((prev) => ({
						...prev,
						scheduleId: scheds[0].id.toString(),
					}));
				}
			}
		} catch (error) {
			toast.error("Terjadi kesalahan koneksi");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	const handleEditClick = (record: any) => {
		setEditingRecord(record.id);
		setEditForm({
			status: record.status,
			notes: record.notes || "",
		});
	};

	const handleSaveEdit = async (recordId: number) => {
		setIsSaving(true);
		try {
			const res = await (api as any).attendance.mahasiswa[studentId].piket[
				recordId
			].patch(editForm);
			if (res.data?.success) {
				toast.success("Status piket diperbarui");
				setEditingRecord(null);
				fetchData();
			} else {
				toast.error("Gagal menyimpan perubahan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsSaving(false);
		}
	};

	const handleAddSubmit = async () => {
		if (!addForm.date || !addForm.status) {
			toast.error("Lengkapi tanggal dan status");
			return;
		}
		if (schedules.length > 0 && !addForm.scheduleId) {
			toast.error("Pilih kelompok piket terlebih dahulu");
			return;
		}

		setIsAdding(true);
		try {
			const res = await (api as any).attendance.mahasiswa[studentId].piket.post(
				addForm,
			);
			if (res.data?.success) {
				toast.success("Catatan kehadiran piket ditambahkan");
				setIsAddOpen(false);
				setAddForm((prev) => ({
					...prev,
					date: new Date().toISOString().split("T")[0],
					status: "hadir",
					notes: "",
				}));
				fetchData();
			} else {
				toast.error(res.data?.error || "Gagal menambah catatan piket");
			}
		} catch (error: any) {
			toast.error("Terjadi kesalahan sistem: " + (error?.message || ""));
		} finally {
			setIsAdding(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="w-6 h-6 animate-spin text-slate-400" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Jadwal Piket Section */}
			<div className="space-y-3">
				<h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-2">
					Jadwal Terdaftar
				</h3>
				{schedules.length === 0 ? (
					<div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
						Mahasiswa ini belum dimasukkan ke dalam kelompok piket apapun.
					</div>
				) : (
					schedules.map((s: any) => (
						<div
							key={s.id}
							className="border border-blue-100 rounded-lg p-4 bg-blue-50/30"
						>
							<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
								<div>
									<div className="flex items-center gap-2 mb-1">
										<Badge className="bg-blue-600 hover:bg-blue-700">
											{s.dayOfWeek}
										</Badge>
										{s.sessionDate && (
											<span className="text-xs font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
												{new Date(s.sessionDate).toLocaleDateString("id-ID", {
													year: "numeric",
													month: "long",
													day: "numeric",
												})}
											</span>
										)}
									</div>
									<div className="font-bold text-slate-800 mt-2">
										{s.groupName}
									</div>
									<div className="text-sm text-slate-600 mt-1">
										<span className="font-medium text-slate-700">Waktu:</span>{" "}
										{s.startTime && s.endTime
											? `${s.startTime} - ${s.endTime}`
											: "Belum ditentukan"}{" "}
										•
										<span className="font-medium text-slate-700 ml-1">
											Ruang:
										</span>{" "}
										{s.room || "-"}
									</div>
									{s.notes && (
										<div className="text-xs text-slate-500 mt-2 italic">
											Catatan: {s.notes}
										</div>
									)}
								</div>
								<div className="bg-white border border-slate-200 p-3 rounded-md w-full md:w-auto shadow-sm">
									<div className="text-xs font-semibold text-slate-500 mb-2">
										ANGGOTA KELOMPOK
									</div>
									<div className="flex flex-wrap gap-1">
										{s.members?.map((m: any, i: number) => (
											<Badge
												key={i}
												variant={m.id === studentId ? "default" : "secondary"}
												className={
													m.id === studentId
														? "bg-blue-600"
														: "font-normal text-xs"
												}
											>
												{m.name}
											</Badge>
										))}
									</div>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Riwayat Kehadiran Piket Section */}
			<div className="space-y-3">
				<div className="flex items-center justify-between mt-4 pt-4 border-t">
					<h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">
						Riwayat Kehadiran Aktual
					</h3>
					{canEdit && (
						<Button size="sm" onClick={() => setIsAddOpen(true)}>
							<Plus className="w-4 h-4 mr-2" />
							Catat Kehadiran
						</Button>
					)}
				</div>

				{records.length === 0 ? (
					<div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
						Belum ada catatan kehadiran aktual untuk piket.
					</div>
				) : (
					records.map((r: any) => {
						const isEditing = editingRecord === r.id;

						return (
							<div
								key={r.id}
								className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:shadow transition-shadow"
							>
								<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
									<div>
										<div className="font-semibold text-slate-800">
											{r.session?.sessionDate
												? new Date(r.session.sessionDate).toLocaleDateString(
														"id-ID",
														{
															weekday: "long",
															year: "numeric",
															month: "long",
															day: "numeric",
														},
													)
												: "-"}
										</div>
										<div className="text-sm text-slate-500 mt-1">
											{r.session?.startTime
												? `${r.session.startTime} - ${r.session.endTime}`
												: "Waktu fleksibel"}{" "}
											• Ruang: {r.session?.room || "-"}
										</div>
										{!isEditing && r.notes && (
											<div className="text-sm text-slate-600 mt-2 bg-slate-50 border border-slate-100 p-2 rounded italic">
												Catatan: {r.notes}
											</div>
										)}
									</div>

									<div className="flex items-center gap-3 w-full md:w-auto">
										{isEditing ? (
											<div className="flex-1 md:w-64 space-y-2">
												<Select
													value={editForm.status || ""}
													onValueChange={(v) =>
														setEditForm({ ...editForm, status: v || "" })
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Pilih status" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="hadir">Hadir</SelectItem>
														<SelectItem value="izin">Izin</SelectItem>
														<SelectItem value="sakit">Sakit</SelectItem>
														<SelectItem value="alpha">Alpha</SelectItem>
													</SelectContent>
												</Select>
												<Input
													placeholder="Catatan..."
													value={editForm.notes || ""}
													onChange={(e) =>
														setEditForm({ ...editForm, notes: e.target.value })
													}
												/>
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => setEditingRecord(null)}
													>
														Batal
													</Button>
													<Button
														size="sm"
														onClick={() => handleSaveEdit(r.id)}
														disabled={isSaving}
														className="bg-blue-600 hover:bg-blue-700"
													>
														{isSaving && (
															<Loader2 className="w-4 h-4 mr-2 animate-spin" />
														)}
														Simpan
													</Button>
												</div>
											</div>
										) : (
											<>
												<Badge
													variant={
														r.status === "hadir"
															? "default"
															: r.status === "izin" || r.status === "sakit"
																? "secondary"
																: "destructive"
													}
													className={
														r.status === "hadir"
															? "bg-emerald-500 text-white font-medium"
															: "font-medium"
													}
												>
													{r.status.toUpperCase()}
												</Badge>
												{canEdit && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleEditClick(r)}
														className="hover:bg-slate-100"
													>
														<Edit2 className="w-4 h-4 text-slate-500" />
													</Button>
												)}
											</>
										)}
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>

			{/* Modal Tambah Kehadiran Piket */}
			<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Catat Kehadiran Piket</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						{schedules.length > 0 && (
							<div className="space-y-2">
								<Label>
									Kelompok Jadwal <span className="text-red-500">*</span>
								</Label>
								<Select
									value={addForm.scheduleId}
									onValueChange={(v) =>
										setAddForm({ ...addForm, scheduleId: v || "" })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pilih kelompok jadwal" />
									</SelectTrigger>
									<SelectContent>
										{schedules.map((s) => (
											<SelectItem key={s.id} value={s.id.toString()}>
												{s.groupName} - {s.dayOfWeek} ({s.startTime || "-"} s/d{" "}
												{s.endTime || "-"})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="space-y-2">
							<Label>
								Tanggal <span className="text-red-500">*</span>
							</Label>
							<Input
								type="date"
								value={addForm.date}
								onChange={(e) =>
									setAddForm({ ...addForm, date: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>
								Status Kehadiran <span className="text-red-500">*</span>
							</Label>
							<Select
								value={addForm.status}
								onValueChange={(v) =>
									setAddForm({ ...addForm, status: v || "hadir" })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Pilih status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="hadir">Hadir</SelectItem>
									<SelectItem value="izin">Izin</SelectItem>
									<SelectItem value="sakit">Sakit</SelectItem>
									<SelectItem value="alpha">Alpha</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Catatan Tambahan (Opsional)</Label>
							<Input
								placeholder="Tulis alasan jika tidak hadir..."
								value={addForm.notes}
								onChange={(e) =>
									setAddForm({ ...addForm, notes: e.target.value })
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsAddOpen(false)}
							disabled={isAdding}
						>
							Batal
						</Button>
						<Button
							onClick={handleAddSubmit}
							disabled={isAdding}
							className="bg-blue-600 hover:bg-blue-700"
						>
							{isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Simpan Catatan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
