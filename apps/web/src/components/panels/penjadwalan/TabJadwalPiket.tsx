"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/eden";

const DAYS_OF_WEEK = [
	"Senin",
	"Selasa",
	"Rabu",
	"Kamis",
	"Jumat",
	"Sabtu",
	"Minggu",
];

export function TabJadwalPiket({ canEdit }: { canEdit: boolean }) {
	const [schedules, setSchedules] = useState<any[]>([]);
	const [students, setStudents] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filters
	const [cohortFilter, setCohortFilter] = useState("all");
	const [dayFilter, setDayFilter] = useState("all");

	// Modal states
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSchedule, setEditingSchedule] = useState<any>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);

	const fetchSchedules = async () => {
		setIsLoading(true);
		try {
			const query: any = {};
			if (cohortFilter !== "all") query.cohort = cohortFilter;
			if (dayFilter !== "all") query.dayOfWeek = dayFilter;

			const { data, error } = await (api as any).scheduling[
				"duty-schedules"
			].get({
				$query: query,
			});
			if (!error && data?.success) {
				setSchedules(data.data || []);
			}
		} catch {
			toast.error("Gagal memuat jadwal piket");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchStudents = async () => {
		try {
			const { data, error } = await api.students.get();
			if (!error && data?.data) {
				setStudents(data.data.map((item: any) => item.student));
			}
		} catch (error) {
			console.error("Error fetching students:", error);
		}
	};

	useEffect(() => {
		fetchStudents();
	}, []);

	useEffect(() => {
		fetchSchedules();
	}, [cohortFilter, dayFilter]);

	const handleDeleteConfirm = async () => {
		if (!deleteId) return;
		try {
			const { error } = await (api as any).scheduling["duty-schedules"][
				deleteId.toString()
			].delete();
			if (!error) {
				toast.success("Jadwal piket berhasil dihapus");
				fetchSchedules();
			} else {
				toast.error("Gagal menghapus jadwal");
			}
		} catch {
			toast.error("Gagal menghapus jadwal");
		} finally {
			setDeleteId(null);
		}
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<CardTitle>Jadwal Piket Mahasiswa</CardTitle>
					{canEdit && (
						<Button
							onClick={() => {
								setEditingSchedule(null);
								setIsModalOpen(true);
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							Tambah Jadwal Piket
						</Button>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-4">
						<div className="w-full sm:w-[200px]">
							<Select
								value={cohortFilter}
								onValueChange={(val) => setCohortFilter(val || "all")}
							>
								<SelectTrigger>
									<SelectValue placeholder="Semua Angkatan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Angkatan</SelectItem>
									{[...Array(5)].map((_, i) => {
										const num = 13 + i;
										return (
											<SelectItem key={num} value={num.toString()}>
												Angkatan {num}
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>
						<div className="w-full sm:w-[200px]">
							<Select
								value={dayFilter}
								onValueChange={(val) => setDayFilter(val || "all")}
							>
								<SelectTrigger>
									<SelectValue placeholder="Semua Hari" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Hari</SelectItem>
									{DAYS_OF_WEEK.map((day) => (
										<SelectItem key={day} value={day}>
											{day}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{isLoading ? (
						<div className="flex justify-center p-8">
							<Loader2 className="w-6 h-6 animate-spin text-primary" />
						</div>
					) : schedules.length === 0 ? (
						<div className="text-center py-8 text-slate-500">
							Tidak ada jadwal piket ditemukan.
						</div>
					) : (
						<div className="rounded-md border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Hari / Tanggal</TableHead>
										<TableHead>Waktu</TableHead>
										<TableHead>Kelompok & Angkatan</TableHead>
										<TableHead>Anggota (Mahasiswa)</TableHead>
										<TableHead>Area / Ruangan</TableHead>
										{canEdit && (
											<TableHead className="text-right">Aksi</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{schedules.map((s) => (
										<TableRow key={s.id}>
											<TableCell>
												<span className="font-semibold">{s.dayOfWeek}</span>
												{s.sessionDate && (
													<div className="text-xs text-slate-500">
														{new Date(s.sessionDate).toLocaleDateString(
															"id-ID",
															{
																day: "numeric",
																month: "long",
																year: "numeric",
															},
														)}
													</div>
												)}
											</TableCell>
											<TableCell>
												{s.startTime && s.endTime
													? `${s.startTime} - ${s.endTime}`
													: "-"}
											</TableCell>
											<TableCell>
												<div className="font-medium">{s.groupName}</div>
												<div className="text-xs text-slate-500">
													Angkatan {s.cohort}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{Array.isArray(s.members) &&
														s.members.map((m: any, i: number) => (
															<Badge
																key={i}
																variant="secondary"
																className="font-normal text-xs"
															>
																{m.name}
															</Badge>
														))}
												</div>
											</TableCell>
											<TableCell>{s.room}</TableCell>
											{canEdit && (
												<TableCell className="text-right space-x-2">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => {
															setEditingSchedule(s);
															setIsModalOpen(true);
														}}
													>
														<Pencil className="w-4 h-4 text-slate-600" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-red-600"
														onClick={() => setDeleteId(s.id)}
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</TableCell>
											)}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{isModalOpen && (
				<DutyScheduleDialog
					students={students}
					schedule={editingSchedule}
					onClose={() => setIsModalOpen(false)}
					onSuccess={() => {
						setIsModalOpen(false);
						fetchSchedules();
					}}
				/>
			)}

			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => !open && setDeleteId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Jadwal Piket</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus jadwal piket ini?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-red-600"
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function DutyScheduleDialog({
	students,
	schedule,
	onClose,
	onSuccess,
}: {
	students: any[];
	schedule: any;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState({
		cohort: schedule?.cohort?.toString() || "",
		groupName: schedule?.groupName || "",
		room: schedule?.room || "",
		dayOfWeek: schedule?.dayOfWeek || "Senin",
		sessionDate: schedule?.sessionDate || "",
		startTime: schedule?.startTime || "",
		endTime: schedule?.endTime || "",
	});

	const [selectedMembers, setSelectedMembers] = useState<any[]>(
		schedule?.members || [],
	);
	const [studentSearch, setStudentSearch] = useState("");

	const filteredStudents = students
		.filter(
			(s) =>
				(form.cohort ? s.cohort === parseInt(form.cohort, 10) : true) &&
				(s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
					(s.nim && s.nim.includes(studentSearch))) &&
				!selectedMembers.find((m) => m.id === s.id),
		)
		.slice(0, 10); // Show max 10 suggestions

	const handleAddMember = (student: any) => {
		setSelectedMembers([
			...selectedMembers,
			{ id: student.id, name: student.name, nim: student.nim },
		]);
		setStudentSearch("");
	};

	const handleRemoveMember = (id: number) => {
		setSelectedMembers(selectedMembers.filter((m) => m.id !== id));
	};

	const handleSave = async () => {
		if (
			!form.cohort ||
			!form.groupName ||
			!form.room ||
			selectedMembers.length === 0
		) {
			toast.error(
				"Mohon lengkapi Angkatan, Nama Kelompok, Ruangan, dan setidaknya 1 Anggota",
			);
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				...form,
				sessionDate: form.sessionDate || undefined,
				startTime: form.startTime || undefined,
				endTime: form.endTime || undefined,
				members: selectedMembers,
			};

			let error;
			if (schedule?.id) {
				const res = await (api as any).scheduling["duty-schedules"][
					schedule.id.toString()
				].patch(payload);
				error = res.error;
			} else {
				const res = await (api as any).scheduling["duty-schedules"].post(
					payload,
				);
				error = res.error;

				if (error) {
					const msg =
						typeof error.value === "object" && (error.value as any)?.message
							? (error.value as any).message
							: typeof error.value === "string"
								? error.value
								: "Terjadi kesalahan saat menyimpan jadwal";
					toast.error(msg);
					setIsSaving(false);
					return;
				}
			}

			if (!error) {
				toast.success(
					schedule ? "Jadwal diperbarui" : "Jadwal berhasil ditambahkan",
				);
				onSuccess();
			} else {
				toast.error(
					schedule ? "Gagal memperbarui jadwal" : "Gagal menambahkan jadwal",
				);
			}
		} catch (err: any) {
			toast.error(err?.message || "Terjadi kesalahan");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{schedule ? "Edit Jadwal Piket" : "Tambah Jadwal Piket"}
					</DialogTitle>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-4 py-4">
					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>
							Angkatan <span className="text-red-500">*</span>
						</Label>
						<Input
							type="number"
							value={form.cohort}
							onChange={(e) => {
								setForm({ ...form, cohort: e.target.value });
								// Reset members if cohort changes to prevent mismatch
								if (form.cohort !== e.target.value) setSelectedMembers([]);
							}}
							placeholder="Contoh: 2025"
						/>
						<p className="text-[10px] text-slate-500">
							Angkatan diperlukan untuk memfilter daftar mahasiswa
						</p>
					</div>
					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>
							Nama Kelompok <span className="text-red-500">*</span>
						</Label>
						<Input
							value={form.groupName}
							onChange={(e) => setForm({ ...form, groupName: e.target.value })}
							placeholder="Contoh: Kelompok A"
						/>
					</div>

					<div className="space-y-2 col-span-2">
						<Label>
							Anggota Mahasiswa <span className="text-red-500">*</span>
						</Label>
						<div className="border rounded-md p-3 space-y-3 bg-slate-50">
							<div className="flex flex-wrap gap-2">
								{selectedMembers.map((m) => (
									<Badge
										key={m.id}
										className="pl-2 pr-1 py-1 flex items-center gap-1"
									>
										{m.name}
										<button
											onClick={() => handleRemoveMember(m.id)}
											className="hover:bg-primary-foreground/20 rounded-full p-0.5"
										>
											<X className="w-3 h-3" />
										</button>
									</Badge>
								))}
								{selectedMembers.length === 0 && (
									<span className="text-xs text-slate-500 italic">
										Belum ada anggota dipilih
									</span>
								)}
							</div>

							<div className="relative">
								<Input
									placeholder={
										form.cohort
											? "Cari nama mahasiswa..."
											: "Isi angkatan terlebih dahulu..."
									}
									value={studentSearch}
									onChange={(e) => setStudentSearch(e.target.value)}
									disabled={!form.cohort}
								/>
								{studentSearch && (
									<div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
										{filteredStudents.length > 0 ? (
											filteredStudents.map((s) => (
												<div
													key={s.id}
													className="p-2 text-sm cursor-pointer hover:bg-slate-100 flex justify-between"
													onClick={() => handleAddMember(s)}
												>
													<span>{s.name}</span>
													<span className="text-slate-400 text-xs">
														{s.nim || "-"}
													</span>
												</div>
											))
										) : (
											<div className="p-2 text-sm text-slate-500 text-center">
												Tidak ditemukan
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>
							Ruangan / Area <span className="text-red-500">*</span>
						</Label>
						<Input
							value={form.room}
							onChange={(e) => setForm({ ...form, room: e.target.value })}
							placeholder="Contoh: Lab Komputer"
						/>
					</div>

					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>
							Hari <span className="text-red-500">*</span>
						</Label>
						<Select
							value={form.dayOfWeek}
							onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{DAYS_OF_WEEK.map((day) => (
									<SelectItem key={day} value={day}>
										{day}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>Tanggal Spesifik (Opsional)</Label>
						<Input
							type="date"
							value={form.sessionDate}
							onChange={(e) =>
								setForm({ ...form, sessionDate: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2 col-span-2 sm:col-span-1">
						{/* Spacer */}
					</div>

					<div className="space-y-2 col-span-1">
						<Label>Jam Mulai (Opsional)</Label>
						<Input
							type="time"
							value={form.startTime}
							onChange={(e) => setForm({ ...form, startTime: e.target.value })}
						/>
					</div>
					<div className="space-y-2 col-span-1">
						<Label>Jam Selesai (Opsional)</Label>
						<Input
							type="time"
							value={form.endTime}
							onChange={(e) => setForm({ ...form, endTime: e.target.value })}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={isSaving}>
						Batal
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : null}
						Simpan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
