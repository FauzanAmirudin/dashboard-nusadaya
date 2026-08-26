"use client";

import {
	AlertCircle,
	Calendar,
	CalendarDays,
	CheckCircle2,
	Clock,
	Edit2,
	Loader2,
	MapPin,
	Plus,
	Save,
	Sparkles,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { cn } from "@/lib/utils";
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
				toast.success("Status piket berhasil diperbarui");
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
			<div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
				<Loader2 className="w-6 h-6 animate-spin text-[#0517B0]" />
				<span className="text-xs font-medium text-slate-500">
					Memuat data piket...
				</span>
			</div>
		);
	}

	// Calculate summary
	const totalPiket = records.length;
	const hadirPiket = records.filter((r) => r.status === "hadir").length;
	const complianceRate =
		totalPiket > 0 ? Math.round((hadirPiket / totalPiket) * 100) : 100;

	return (
		<div className="space-y-6">
			{/* Top 3 KPI Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0517B0] flex items-center justify-center shrink-0">
							<Users className="w-5 h-5" />
						</div>
						<div>
							<span className="text-xs font-medium text-slate-500 block">
								Kelompok Piket
							</span>
							<span className="text-sm font-bold text-slate-800">
								{schedules.length > 0
									? schedules[0].groupName
									: "Belum Ditentukan"}
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
							<CheckCircle2 className="w-5 h-5" />
						</div>
						<div>
							<span className="text-xs font-medium text-slate-500 block">
								Kehadiran Piket
							</span>
							<span className="text-sm font-bold text-slate-800">
								{hadirPiket} / {totalPiket} Sesi Hadir
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
							<Sparkles className="w-5 h-5" />
						</div>
						<div>
							<span className="text-xs font-medium text-slate-500 block">
								Tingkat Kepatuhan
							</span>
							<span className="text-sm font-bold text-slate-800">
								{complianceRate}% Kepatuhan
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Jadwal Piket Section */}
			<div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
				<div className="flex items-center gap-2">
					<CalendarDays className="w-4 h-4 text-[#0517B0]" />
					<h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
						Jadwal Terdaftar Mahasiswa
					</h3>
				</div>

				{schedules.length === 0 ? (
					<div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
						<Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
						<p className="text-xs font-medium text-slate-500">
							Mahasiswa ini belum dimasukkan ke dalam kelompok piket harian.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-3">
						{schedules.map((s: any) => (
							<div
								key={s.id}
								className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
							>
								<div className="space-y-2">
									<div className="flex items-center gap-2 flex-wrap">
										<Badge className="bg-[#0517B0] hover:bg-[#0517B0]/90 text-white font-semibold text-xs px-2.5 py-0.5 rounded-lg">
											{s.dayOfWeek}
										</Badge>
										<span className="font-bold text-slate-800 text-sm">
											{s.groupName}
										</span>
									</div>

									<div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
										<div className="flex items-center gap-1">
											<Clock className="w-3.5 h-3.5 text-slate-400" />
											<span>
												{s.startTime && s.endTime
													? `${s.startTime} - ${s.endTime}`
													: "Fleksibel"}
											</span>
										</div>
										<span>•</span>
										<div className="flex items-center gap-1">
											<MapPin className="w-3.5 h-3.5 text-slate-400" />
											<span>Ruang: {s.room || "Area Kampus"}</span>
										</div>
									</div>

									{s.notes && (
										<p className="text-xs text-slate-500 italic">
											Catatan: {s.notes}
										</p>
									)}
								</div>

								{/* Members chips */}
								<div className="bg-white border border-slate-200/80 p-3 rounded-xl w-full md:w-auto shadow-2xs">
									<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
										Rekan Anggota Kelompok
									</span>
									<div className="flex flex-wrap gap-1.5 max-w-md">
										{s.members?.map((m: any, i: number) => (
											<Badge
												key={i}
												variant={m.id === studentId ? "default" : "secondary"}
												className={cn(
													"text-[11px] font-medium rounded-md px-2 py-0.5",
													m.id === studentId
														? "bg-blue-50 text-[#0517B0] border border-blue-200 font-bold"
														: "bg-slate-100 text-slate-600 border-none",
												)}
											>
												{m.name}
											</Badge>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Riwayat Kehadiran Piket Section */}
			<div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Clock className="w-4 h-4 text-[#0517B0]" />
						<h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
							Riwayat Presensi Aktual Piket
						</h3>
					</div>
					{canEdit && (
						<Button
							size="sm"
							onClick={() => setIsAddOpen(true)}
							className="h-8 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90 font-semibold gap-1.5 shadow-2xs"
						>
							<Plus className="w-3.5 h-3.5" />
							<span>Catat Kehadiran</span>
						</Button>
					)}
				</div>

				{records.length === 0 ? (
					<div className="text-center py-10 text-slate-400 bg-slate-50/60 rounded-xl border border-slate-200/80">
						<Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
						<p className="text-xs font-medium text-slate-500">
							Belum ada riwayat catatan absensi aktual piket.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-2.5">
						{records.map((r: any) => {
							const isEditing = editingRecord === r.id;

							return (
								<div
									key={r.id}
									className="border border-slate-200/80 rounded-xl p-3.5 bg-white shadow-2xs hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
								>
									<div className="space-y-1">
										<div className="text-xs font-bold text-slate-800">
											{r.session?.sessionDate
												? new Date(r.session.sessionDate).toLocaleDateString(
														"id-ID",
														{
															weekday: "long",
															year: "numeric",
															month: "short",
															day: "numeric",
														},
													)
												: "-"}
										</div>
										<p className="text-[11px] text-slate-500">
											{r.session?.startTime
												? `${r.session.startTime} - ${r.session.endTime}`
												: "Waktu fleksibel"}{" "}
											• Ruang: {r.session?.room || "Area Kampus"}
										</p>
										{!isEditing && r.notes && (
											<p className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 italic">
												Catatan: {r.notes}
											</p>
										)}
									</div>

									<div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
										{isEditing ? (
											<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
												<Select
													value={editForm.status || ""}
													onValueChange={(v) =>
														setEditForm({ ...editForm, status: v || "" })
													}
												>
													<SelectTrigger className="h-8 text-xs w-28 bg-white">
														<SelectValue placeholder="Status" />
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
													className="h-8 text-xs bg-white w-40"
												/>
												<div className="flex gap-1.5">
													<Button
														variant="outline"
														size="sm"
														onClick={() => setEditingRecord(null)}
														className="h-8 text-xs"
													>
														Batal
													</Button>
													<Button
														size="sm"
														onClick={() => handleSaveEdit(r.id)}
														disabled={isSaving}
														className="h-8 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90"
													>
														{isSaving ? (
															<Loader2 className="w-3.5 h-3.5 animate-spin" />
														) : (
															<Save className="w-3.5 h-3.5" />
														)}
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
													className={cn(
														"text-[10px] font-semibold px-2.5 py-0.5 rounded-md",
														r.status === "hadir" &&
															"bg-emerald-50 text-emerald-700 border border-emerald-200/80",
														(r.status === "izin" || r.status === "sakit") &&
															"bg-amber-50 text-amber-800 border border-amber-200/80",
														r.status === "alpha" &&
															"bg-rose-50 text-rose-700 border border-rose-200/80",
													)}
												>
													{(r.status || "HADIR").toUpperCase()}
												</Badge>
												{canEdit && (
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleEditClick(r)}
														className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
													>
														<Edit2 className="w-3.5 h-3.5" />
													</Button>
												)}
											</>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Modal Tambah Kehadiran Piket */}
			<Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
				<DialogContent className="sm:max-w-md rounded-2xl p-6">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-[#0517B0]" />
							<span>Catat Kehadiran Piket</span>
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Input riwayat presensi piket harian mahasiswa
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3.5 py-2">
						{schedules.length > 0 && (
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-700">
									Kelompok Jadwal <span className="text-rose-500">*</span>
								</Label>
								<Select
									value={addForm.scheduleId}
									onValueChange={(v) =>
										setAddForm({ ...addForm, scheduleId: v || "" })
									}
								>
									<SelectTrigger className="h-9 text-xs bg-white">
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
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Sesi <span className="text-rose-500">*</span>
							</Label>
							<Input
								type="date"
								className="h-9 text-xs bg-white"
								value={addForm.date}
								onChange={(e) =>
									setAddForm({ ...addForm, date: e.target.value })
								}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Status Kehadiran <span className="text-rose-500">*</span>
							</Label>
							<Select
								value={addForm.status}
								onValueChange={(v) =>
									setAddForm({ ...addForm, status: v || "hadir" })
								}
							>
								<SelectTrigger className="h-9 text-xs bg-white">
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
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-700">
								Catatan Tambahan (Opsional)
							</Label>
							<Input
								placeholder="Tulis alasan jika berhalangan..."
								className="h-9 text-xs bg-white"
								value={addForm.notes}
								onChange={(e) =>
									setAddForm({ ...addForm, notes: e.target.value })
								}
							/>
						</div>
					</div>
					<DialogFooter className="gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => setIsAddOpen(false)}
							disabled={isAdding}
							className="h-9 text-xs"
						>
							Batal
						</Button>
						<Button
							onClick={handleAddSubmit}
							disabled={isAdding}
							className="h-9 text-xs text-white bg-[#0517B0] hover:bg-[#0517B0]/90 font-semibold shadow-2xs gap-1.5"
						>
							{isAdding ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Save className="w-3.5 h-3.5" />
							)}
							<span>Simpan Presensi</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
