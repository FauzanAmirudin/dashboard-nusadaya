"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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

export function TabJadwalPraktikum({ canEdit }: { canEdit: boolean }) {
	const [schedules, setSchedules] = useState<any[]>([]);
	const [dosens, setDosens] = useState<any[]>([]);
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
				"practicum-schedules"
			].get({
				$query: query,
			});
			if (!error && data?.success) {
				setSchedules(data.data || []);
			}
		} catch {
			toast.error("Gagal memuat jadwal praktikum");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDosens = async () => {
		try {
			const { data, error } = await (api as any).users.get({
				$query: { role: "dosen" },
			});
			if (!error && data?.data) {
				setDosens(data.data);
			}
		} catch (error) {
			console.error("Error fetching dosens:", error);
		}
	};

	useEffect(() => {
		fetchDosens();
	}, []);

	useEffect(() => {
		fetchSchedules();
	}, [cohortFilter, dayFilter]);

	const handleDeleteConfirm = async () => {
		if (!deleteId) return;
		try {
			const { error } = await (api as any).scheduling["practicum-schedules"][
				deleteId.toString()
			].delete();
			if (!error) {
				toast.success("Jadwal praktikum berhasil dihapus");
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
					<CardTitle>Jadwal Praktikum</CardTitle>
					{canEdit && (
						<Button
							onClick={() => {
								setEditingSchedule(null);
								setIsModalOpen(true);
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							Tambah Jadwal
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
							Tidak ada jadwal praktikum ditemukan.
						</div>
					) : (
						<div className="rounded-md border overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Hari / Tanggal</TableHead>
										<TableHead>Waktu</TableHead>
										<TableHead>Mata Kuliah Praktikum</TableHead>
										<TableHead>Dosen/Instruktur</TableHead>
										<TableHead>Angkatan</TableHead>
										<TableHead>Ruangan</TableHead>
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
												{s.startTime} - {s.endTime}
											</TableCell>
											<TableCell>{s.subject}</TableCell>
											<TableCell>
												{s.dosen?.fullName || s.dosen?.name || "-"}
											</TableCell>
											<TableCell>Angkatan {s.cohort}</TableCell>
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
				<PracticumScheduleDialog
					dosens={dosens}
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
						<AlertDialogTitle>Hapus Jadwal Praktikum</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin menghapus jadwal ini?
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

function PracticumScheduleDialog({
	dosens,
	schedule,
	onClose,
	onSuccess,
}: {
	dosens: any[];
	schedule: any;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState({
		subject: schedule?.subject || "",
		dosenId: schedule?.dosenId?.toString() || "",
		cohort: schedule?.cohort?.toString() || "",
		room: schedule?.room || "",
		dayOfWeek: schedule?.dayOfWeek || "Senin",
		sessionDate: schedule?.sessionDate || "",
		startTime: schedule?.startTime || "",
		endTime: schedule?.endTime || "",
		notes: schedule?.notes || "",
	});

	const handleSave = async () => {
		if (
			!form.subject ||
			!form.cohort ||
			!form.room ||
			!form.startTime ||
			!form.endTime
		) {
			toast.error(
				"Mohon lengkapi data wajib (Mata Kuliah, Angkatan, Ruangan, Waktu)",
			);
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				...form,
				dosenId: form.dosenId ? parseInt(form.dosenId, 10) : undefined,
				sessionDate: form.sessionDate || undefined,
			};

			let error;
			if (schedule?.id) {
				const res = await (api as any).scheduling["practicum-schedules"][
					schedule.id.toString()
				].patch(payload);
				error = res.error;
			} else {
				const res = await (api as any).scheduling["practicum-schedules"].post(
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
						{schedule ? "Edit Jadwal Praktikum" : "Tambah Jadwal Praktikum"}
					</DialogTitle>
				</DialogHeader>
				<div className="grid grid-cols-2 gap-4 py-4">
					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>
							Mata Kuliah Praktik <span className="text-red-500">*</span>
						</Label>
						<Input
							value={form.subject}
							onChange={(e) => setForm({ ...form, subject: e.target.value })}
							placeholder="Nama mata kuliah praktik"
						/>
					</div>
					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>Dosen / Instruktur</Label>
						<Select
							value={form.dosenId}
							onValueChange={(v) => setForm({ ...form, dosenId: v })}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih Instruktur">
									{form.dosenId
										? dosens.find((d) => d.id.toString() === form.dosenId)
												?.fullName ||
											schedule?.dosen?.fullName ||
											"Memuat..."
										: undefined}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{dosens.map((d) => (
									<SelectItem key={d.id} value={d.id.toString()}>
										{d.fullName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>
							Angkatan <span className="text-red-500">*</span>
						</Label>
						<Input
							type="number"
							value={form.cohort}
							onChange={(e) => setForm({ ...form, cohort: e.target.value })}
							placeholder="Contoh: 2025"
						/>
					</div>
					<div className="space-y-2 col-span-2 sm:col-span-1">
						<Label>
							Ruangan <span className="text-red-500">*</span>
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

					<div className="space-y-2 col-span-1">
						<Label>
							Jam Mulai <span className="text-red-500">*</span>
						</Label>
						<Input
							type="time"
							value={form.startTime}
							onChange={(e) => setForm({ ...form, startTime: e.target.value })}
						/>
					</div>
					<div className="space-y-2 col-span-1">
						<Label>
							Jam Selesai <span className="text-red-500">*</span>
						</Label>
						<Input
							type="time"
							value={form.endTime}
							onChange={(e) => setForm({ ...form, endTime: e.target.value })}
						/>
					</div>

					<div className="space-y-2 col-span-2">
						<Label>Catatan Tambahan</Label>
						<Textarea
							value={form.notes}
							onChange={(e) => setForm({ ...form, notes: e.target.value })}
							rows={2}
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
