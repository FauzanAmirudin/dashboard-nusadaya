"use client";

import {
	CheckCircle2,
	Compass,
	Edit2,
	Loader2,
	MapPin,
	Plus,
	RefreshCw,
	Save,
	Trash2,
	X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DynamicMap } from "@/components/common/DynamicMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
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
import { API_URL, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";

interface CheckpointItem {
	id: number;
	type: string;
	label: string;
	latitude: number;
	longitude: number;
	radiusMeters: number;
	isActive: boolean;
	cohort?: number | null;
	notes?: string | null;
	updatedAt: string;
	creator?: {
		fullName: string;
	};
}

export function TabCheckpointConfig() {
	const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Form state
	const [editingId, setEditingId] = useState<number | null>(null);
	const [formType, setFormType] = useState("baris_pagi");
	const [formLabel, setFormLabel] = useState("");
	const [formLat, setFormLat] = useState("-5.40145");
	const [formLon, setFormLon] = useState("105.2114");
	const [formRadius, setFormRadius] = useState("150");
	const [formCohort, setFormCohort] = useState<string>("all");
	const [formNotes, setFormNotes] = useState("");

	const fetchCheckpoints = async () => {
		setIsLoading(true);
		try {
			const token = getToken();
			if (!token) return;

			const res = await fetch(`${API_URL}/attendance/checkpoint-config`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.success && Array.isArray(json.data)) {
				setCheckpoints(json.data);
			}
		} catch (err) {
			console.error("Gagal memuat checkpoint:", err);
			toast.error("Gagal memuat daftar checkpoint");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCheckpoints();
	}, []);

	const handleOpenCreate = () => {
		setEditingId(null);
		setFormType("baris_pagi");
		setFormLabel("Kampus Nusadaya Academy Bandar Lampung");
		setFormLat("-5.40145");
		setFormLon("105.2114");
		setFormRadius("150");
		setFormCohort("all");
		setFormNotes(
			"Jl. Raden Imba Kusuma Ratu, Langkapura, Kec. Langkapura, Kota Bandar Lampung, Lampung 35116",
		);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (item: CheckpointItem) => {
		setEditingId(item.id);
		setFormType(item.type);
		setFormLabel(item.label);
		setFormLat(item.latitude.toString());
		setFormLon(item.longitude.toString());
		setFormRadius(item.radiusMeters.toString());
		setFormCohort(item.cohort ? item.cohort.toString() : "all");
		setFormNotes(item.notes || "");
		setIsModalOpen(true);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		const lat = parseFloat(formLat);
		const lon = parseFloat(formLon);
		const radius = parseInt(formRadius, 10);

		if (
			Number.isNaN(lat) ||
			Number.isNaN(lon) ||
			Number.isNaN(radius) ||
			radius <= 0
		) {
			toast.error("Koordinat atau radius tidak valid");
			return;
		}

		setIsSubmitting(true);
		try {
			const token = getToken();
			const payload = {
				type: formType,
				label: formLabel,
				latitude: lat,
				longitude: lon,
				radiusMeters: radius,
				cohort: formCohort === "all" ? null : parseInt(formCohort, 10),
				notes: formNotes || null,
			};

			const url = editingId
				? `${API_URL}/attendance/checkpoint-config/${editingId}`
				: `${API_URL}/attendance/checkpoint-config`;

			const res = await fetch(url, {
				method: editingId ? "PATCH" : "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});

			const json = await res.json();
			if (json.success) {
				toast.success(json.message);
				setIsModalOpen(false);
				fetchCheckpoints();
			} else {
				toast.error(json.message || "Gagal menyimpan checkpoint");
			}
		} catch {
			toast.error("Kesalahan jaringan saat menyimpan");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Apakah Anda yakin ingin menghapus checkpoint ini?")) return;
		try {
			const token = getToken();
			const res = await fetch(`${API_URL}/attendance/checkpoint-config/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.success) {
				toast.success("Checkpoint berhasil dihapus");
				fetchCheckpoints();
			} else {
				toast.error(json.message || "Gagal menghapus");
			}
		} catch {
			toast.error("Gagal menghapus checkpoint");
		}
	};

	return (
		<div className="space-y-4">
			{/* Top Header */}
			<div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
						<MapPin className="w-5 h-5" />
					</div>
					<div>
						<h3 className="font-extrabold text-sm text-slate-900">
							Konfigurasi Titik Checkpoint Kampus & Radius Toleransi
						</h3>
						<p className="text-xs text-slate-500">
							Atur titik koordinat GPS pusat kampus dan radius meter batas
							absensi sah untuk setiap layanan (Kuliah, Piket, Baris Pagi, ODS).
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={fetchCheckpoints}
						className="h-9 rounded-xl text-xs font-semibold gap-1.5 border-slate-200"
					>
						<RefreshCw className="w-3.5 h-3.5" />
						<span>Refresh</span>
					</Button>
					<Button
						size="sm"
						onClick={handleOpenCreate}
						className="h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm"
					>
						<Plus className="w-4 h-4" />
						<span>Tambah Checkpoint</span>
					</Button>
				</div>
			</div>

			{/* Checkpoint Cards List */}
			{isLoading ? (
				<div className="p-16 text-center flex flex-col items-center justify-center gap-3">
					<Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
					<span className="text-xs text-slate-500 font-medium">
						Memuat konfigurasi checkpoint...
					</span>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{checkpoints.map((cp) => (
						<Card
							key={cp.id}
							className="rounded-2xl border-slate-200 overflow-hidden shadow-2xs bg-white flex flex-col justify-between"
						>
							<div className="p-5 space-y-3">
								<div className="flex items-start justify-between gap-2">
									<div>
										<Badge
											className={cn(
												"text-[10px] font-bold border-0 px-2 py-0.5 mb-1.5",
												cp.type === "baris_pagi"
													? "bg-amber-600 text-white"
													: cp.type === "kuliah"
														? "bg-blue-600 text-white"
														: cp.type === "piket"
															? "bg-teal-600 text-white"
															: "bg-purple-600 text-white",
											)}
										>
											{cp.type === "baris_pagi"
												? "BARIS PAGI"
												: cp.type.toUpperCase()}
										</Badge>
										<h4 className="font-extrabold text-base text-slate-900 leading-snug">
											{cp.label}
										</h4>
										<p className="text-xs text-slate-500">
											{cp.cohort
												? `Berlaku khusus Angkatan ${cp.cohort}`
												: "Berlaku untuk semua angkatan"}
										</p>
									</div>

									<div className="text-right">
										<span className="text-[11px] text-slate-400 font-medium block">
											Radius Batas
										</span>
										<span className="text-base font-extrabold font-mono text-blue-700">
											{cp.radiusMeters} m
										</span>
									</div>
								</div>

								{/* Live Map Preview for this checkpoint */}
								<div className="h-44 rounded-xl overflow-hidden border border-slate-200">
									<DynamicMap
										studentCoords={{
											latitude: cp.latitude,
											longitude: cp.longitude,
										}}
										checkpointCoords={{
											latitude: cp.latitude,
											longitude: cp.longitude,
										}}
										radiusMeters={cp.radiusMeters}
										checkpointLabel={cp.label}
										height="176px"
									/>
								</div>

								<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
									<span>Lat: {cp.latitude.toFixed(6)}</span>
									<span>Long: {cp.longitude.toFixed(6)}</span>
								</div>
							</div>

							<div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
								<span className="text-slate-400 text-[11px]">
									Dibuat oleh: {cp.creator?.fullName || "Admin"}
								</span>
								<div className="flex items-center gap-1.5">
									<Button
										size="sm"
										variant="ghost"
										onClick={() => handleOpenEdit(cp)}
										className="h-8 text-xs font-semibold text-slate-700 hover:text-blue-600 gap-1"
									>
										<Edit2 className="w-3.5 h-3.5" />
										<span>Edit</span>
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => handleDelete(cp.id)}
										className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
									>
										<Trash2 className="w-3.5 h-3.5" />
										<span>Hapus</span>
									</Button>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

			{/* Modal Form Tambah / Edit */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="w-full max-w-lg rounded-2xl p-6 bg-white shadow-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900">
							{editingId ? "Edit Checkpoint Lokasi" : "Tambah Checkpoint Baru"}
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSave} className="space-y-4 pt-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700">
								Jenis Layanan Absensi
							</Label>
							<Select
								value={formType}
								onValueChange={(val) => setFormType(val || "baris_pagi")}
							>
								<SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200">
									<SelectValue placeholder="Pilih Jenis" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="baris_pagi">Apel Baris Pagi</SelectItem>
									<SelectItem value="kuliah">Kuliah / Kelas</SelectItem>
									<SelectItem value="piket">Piket Kampus</SelectItem>
									<SelectItem value="ods">On-Duty Service (ODS)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700">
								Nama / Label Lokasi Checkpoint
							</Label>
							<Input
								required
								value={formLabel}
								onChange={(e) => setFormLabel(e.target.value)}
								placeholder="contoh: Kampus Nusadaya Academy Bandar Lampung"
								className="h-9 text-xs"
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-bold text-slate-700">
									Latitude (Lintang)
								</Label>
								<Input
									required
									value={formLat}
									onChange={(e) => setFormLat(e.target.value)}
									placeholder="-5.40145"
									className="h-9 text-xs font-mono"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-bold text-slate-700">
									Longitude (Bujur)
								</Label>
								<Input
									required
									value={formLon}
									onChange={(e) => setFormLon(e.target.value)}
									placeholder="105.2114"
									className="h-9 text-xs font-mono"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-bold text-slate-700">
									Radius Toleransi (Meter)
								</Label>
								<Input
									required
									type="number"
									min="10"
									max="5000"
									value={formRadius}
									onChange={(e) => setFormRadius(e.target.value)}
									className="h-9 text-xs font-mono"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-bold text-slate-700">
									Angkatan Khusus (Opsional)
								</Label>
								<Select
									value={formCohort}
									onValueChange={(val) => setFormCohort(val || "all")}
								>
									<SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200">
										<SelectValue placeholder="Semua" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Semua Angkatan</SelectItem>
										<SelectItem value="13">Angkatan 13</SelectItem>
										<SelectItem value="14">Angkatan 14</SelectItem>
										<SelectItem value="15">Angkatan 15</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-bold text-slate-700">
								Catatan Tambahan (Opsional)
							</Label>
							<Input
								value={formNotes}
								onChange={(e) => setFormNotes(e.target.value)}
								placeholder="contoh: Checkpoint utama gedung kampus timur"
								className="h-9 text-xs"
							/>
						</div>

						<div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsModalOpen(false)}
								className="h-9 rounded-xl text-xs font-semibold"
							>
								Batal
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting}
								className="h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
							>
								{isSubmitting && (
									<RefreshCw className="w-3.5 h-3.5 animate-spin" />
								)}
								<span>Simpan Checkpoint</span>
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
