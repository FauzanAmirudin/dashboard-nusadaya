"use client";

import { BookUser, Hash, Home, Loader2, Save, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { filterNumeric, preventNonNumericKey } from "@/utils/form-validators";

interface TabDataTambahanProps {
	studentId: number;
	studentData: {
		nim?: string | null;
		studentStatus?: string | null;
		paId?: number | null;
	};
	pmbData: any;
	canEdit: boolean;
	onUpdate: () => void;
}

const STATUS_OPTIONS = [
	{
		value: "aktif",
		label: "Aktif",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200",
		dot: "bg-emerald-500",
	},
	{
		value: "cuti",
		label: "Cuti",
		color: "bg-amber-50 text-amber-700 border-amber-200",
		dot: "bg-amber-500",
	},
	{
		value: "dropout",
		label: "Drop Out",
		color: "bg-rose-50 text-rose-700 border-rose-200",
		dot: "bg-rose-500",
	},
	{
		value: "mengundurkan_diri",
		label: "Mengundurkan Diri",
		color: "bg-orange-50 text-orange-700 border-orange-200",
		dot: "bg-orange-500",
	},
	{
		value: "lulus",
		label: "Lulus",
		color: "bg-blue-50 text-blue-700 border-blue-200",
		dot: "bg-blue-500",
	},
	{
		value: "calon_mahasiswa",
		label: "Calon Mahasiswa",
		color: "bg-sky-50 text-sky-700 border-sky-200",
		dot: "bg-sky-500",
	},
	{
		value: "non_aktif",
		label: "Non-Aktif",
		color: "bg-slate-100 text-slate-700 border-slate-200",
		dot: "bg-slate-500",
	},
];

// Helper to format string into Title Case (Huruf Kapital di Depan)
function formatToTitleCase(str: string | null | undefined): string {
	if (!str) return "Aktif";
	return str
		.replace(/_/g, " ")
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

function getStatusConfig(val: string | null | undefined) {
	const normalized = (val || "aktif").toLowerCase();
	const found = STATUS_OPTIONS.find((o) => o.value === normalized);
	if (found) return found;

	return {
		value: normalized,
		label: formatToTitleCase(val),
		color: "bg-slate-100 text-slate-700 border-slate-200",
		dot: "bg-slate-500",
	};
}

export function TabDataTambahan({
	studentId,
	studentData,
	pmbData,
	canEdit,
	onUpdate,
}: TabDataTambahanProps) {
	// ── 1. Status Mahasiswa ──────────────────────────────
	const [selectedStatus, setSelectedStatus] = useState<string>(
		studentData?.studentStatus || "aktif",
	);
	const [isSavingStatus, setIsSavingStatus] = useState(false);

	// ── 2. NIM ───────────────────────────────────────────
	const [nim, setNim] = useState<string>(studentData?.nim || "");
	const [isSavingNim, setIsSavingNim] = useState(false);

	// ── 3. PA (Pembimbing Akademik) ──────────────────────
	const [paList, setPaList] = useState<{ id: number; fullName: string }[]>([]);
	const [selectedPaId, setSelectedPaId] = useState<string>(
		studentData?.paId ? String(studentData.paId) : "",
	);
	const [isSavingPa, setIsSavingPa] = useState(false);

	// ── 4. Rumah Juang ───────────────────────────────────
	const [rumahJuang, setRumahJuang] = useState<boolean>(!!pmbData?.rumahJuang);
	const [isSavingRumahJuang, setIsSavingRumahJuang] = useState(false);

	// Real-time synchronization from props whenever database data changes
	useEffect(() => {
		setSelectedStatus(studentData?.studentStatus || "aktif");
		setNim(studentData?.nim || "");
		setSelectedPaId(studentData?.paId ? String(studentData.paId) : "");
	}, [studentData?.studentStatus, studentData?.nim, studentData?.paId]);

	useEffect(() => {
		setRumahJuang(!!pmbData?.rumahJuang);
	}, [pmbData?.rumahJuang]);

	// Fetch PA list
	useEffect(() => {
		const fetchPaList = async () => {
			try {
				const res = await api.students["pa-list"].get();
				if (res.data?.success && res.data.data) {
					setPaList(res.data.data as { id: number; fullName: string }[]);
				}
			} catch (err) {
				console.error("Failed fetching PA list", err);
			}
		};
		fetchPaList();
	}, []);

	// Look up active PA name
	const currentPa = useMemo(() => {
		const targetId = studentData?.paId;
		if (!targetId) return null;
		return paList.find((p) => p.id === targetId) || null;
	}, [paList, studentData?.paId]);

	// ── Save Handlers ─────────────────────────────────────
	const handleSaveStatus = async () => {
		if (!canEdit) return;
		setIsSavingStatus(true);
		try {
			const res = await api.students[studentId.toString()][
				"student-status"
			].patch({
				studentStatus: selectedStatus,
			});
			if (res.error) {
				toast.error("Gagal memperbarui status mahasiswa");
			} else {
				toast.success("Status mahasiswa berhasil diperbarui");
				onUpdate();
			}
		} catch (err) {
			toast.error("Terjadi kesalahan jaringan saat menyimpan status");
		} finally {
			setIsSavingStatus(false);
		}
	};

	const handleSaveNim = async () => {
		if (!canEdit) return;
		setIsSavingNim(true);
		try {
			const res = await api.students[studentId.toString()].nim.patch({ nim });
			if (res.error) {
				const msg =
					(res.error as any)?.value?.message ?? "Gagal memperbarui NIM";
				toast.error(msg);
			} else {
				toast.success("NIM berhasil diperbarui");
				onUpdate();
			}
		} catch (err) {
			toast.error("Terjadi kesalahan jaringan saat menyimpan NIM");
		} finally {
			setIsSavingNim(false);
		}
	};

	const handleSavePa = async () => {
		if (!canEdit) return;
		setIsSavingPa(true);
		try {
			const paId =
				selectedPaId && selectedPaId !== "none"
					? parseInt(selectedPaId, 10)
					: null;
			const res = await api.students[studentId.toString()].pa.patch({ paId });
			if (res.error) {
				toast.error("Gagal memperbarui Pembimbing Akademik");
			} else {
				toast.success("Pembimbing Akademik berhasil diperbarui");
				onUpdate();
			}
		} catch (err) {
			toast.error("Terjadi kesalahan jaringan saat menyimpan PA");
		} finally {
			setIsSavingPa(false);
		}
	};

	const handleSaveRumahJuang = async () => {
		if (!canEdit) return;
		setIsSavingRumahJuang(true);
		try {
			const res = await api.students[studentId.toString()].pmb[
				"rumah-juang"
			].patch({
				rumahJuang: rumahJuang,
			});
			if (res.error) {
				toast.error("Gagal memperbarui status Rumah Juang");
			} else {
				toast.success(
					rumahJuang
						? "Status Fasilitas Rumah Juang: Aktif (Peserta)"
						: "Status Fasilitas Rumah Juang: Tidak Aktif (Bukan Peserta)",
				);
				onUpdate();
			}
		} catch (err) {
			toast.error("Terjadi kesalahan jaringan saat menyimpan Rumah Juang");
		} finally {
			setIsSavingRumahJuang(false);
		}
	};

	const currentStatusConfig = getStatusConfig(
		studentData?.studentStatus || selectedStatus,
	);

	return (
		<div className="space-y-6">
			{/* Responsive 2-column grid with equal height cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 items-stretch">
				{/* 1. Status Mahasiswa */}
				<Card className="border-slate-200 shadow-sm border-l-4 border-l-[#0517B0] flex flex-col justify-between h-full bg-white">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<div className="p-1.5 bg-blue-50 text-[#0517B0] rounded-md border border-blue-100">
								<User className="w-4 h-4" />
							</div>
							Status Mahasiswa
						</CardTitle>
					</CardHeader>
					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						<div className="h-12 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
							<span className="text-xs text-slate-500 font-medium">
								Status Saat Ini:
							</span>
							<Badge
								className={`${currentStatusConfig.color} border text-xs font-semibold px-2.5 py-0.5`}
							>
								<span
									className={`w-2 h-2 rounded-full ${currentStatusConfig.dot} mr-1.5`}
								/>
								{currentStatusConfig.label}
							</Badge>
						</div>

						<div className="space-y-1.5 flex-1 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								Pilih Status Mahasiswa
							</Label>
							<Select
								value={selectedStatus}
								onValueChange={(v) => setSelectedStatus(v || "aktif")}
								disabled={!canEdit}
							>
								<SelectTrigger className="h-9 text-xs sm:text-sm font-medium bg-white border-slate-200">
									<span className="flex items-center gap-2 truncate text-slate-800">
										<span
											className={`w-2 h-2 rounded-full ${getStatusConfig(selectedStatus).dot}`}
										/>
										{getStatusConfig(selectedStatus).label}
									</span>
								</SelectTrigger>
								<SelectContent>
									{STATUS_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											<span className="flex items-center gap-2 text-xs sm:text-sm font-medium">
												<span className={`w-2 h-2 rounded-full ${opt.dot}`} />
												{opt.label}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveStatus}
								disabled={isSavingStatus}
								className="w-full bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-9 font-bold shadow-sm"
							>
								{isSavingStatus ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								Simpan Status Mahasiswa
							</Button>
						)}
					</CardContent>
				</Card>

				{/* 2. NIM */}
				<Card className="border-slate-200 shadow-sm border-l-4 border-l-violet-600 flex flex-col justify-between h-full bg-white">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<div className="p-1.5 bg-violet-50 text-violet-600 rounded-md border border-violet-100">
								<Hash className="w-4 h-4" />
							</div>
							NIM (Nomor Induk Mahasiswa)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						<div className="h-12 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
							<span className="text-xs text-slate-500 font-medium">
								NIM Terdaftar:
							</span>
							<span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
								{studentData?.nim || (
									<span className="text-slate-400 italic font-sans font-normal">
										Belum Diisi
									</span>
								)}
							</span>
						</div>

						<div className="space-y-1.5 flex-1 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								{studentData?.nim ? "Perbarui NIM" : "Masukkan NIM"}
							</Label>
							<Input
								placeholder="Contoh: 202401001"
								value={nim}
								onKeyDown={preventNonNumericKey}
								onChange={(e) =>
									setNim(
										filterNumeric(
											e.target.value,
											20,
											"NIM hanya boleh berupa angka numerik",
										),
									)
								}
								disabled={!canEdit}
								className="h-9 text-xs sm:text-sm font-mono bg-white border-slate-200"
							/>
						</div>

						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveNim}
								disabled={isSavingNim}
								className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-9 font-bold shadow-sm"
							>
								{isSavingNim ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								Simpan NIM
							</Button>
						)}
					</CardContent>
				</Card>

				{/* 3. Pembimbing Akademik (PA) */}
				<Card className="border-slate-200 shadow-sm border-l-4 border-l-amber-600 flex flex-col justify-between h-full bg-white">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<div className="p-1.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100">
								<BookUser className="w-4 h-4" />
							</div>
							Dosen Pembimbing Akademik (PA)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						<div className="h-12 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
							<span className="text-xs text-slate-500 font-medium">
								PA Ditugaskan:
							</span>
							{currentPa ? (
								<div className="flex items-center gap-1.5 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold text-amber-900 truncate max-w-[200px]">
									<div className="w-4 h-4 rounded-full bg-amber-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
										{currentPa.fullName
											? currentPa.fullName.charAt(0).toUpperCase()
											: "P"}
									</div>
									<span className="truncate">{currentPa.fullName}</span>
								</div>
							) : (
								<Badge
									variant="outline"
									className="text-slate-400 border-slate-200 text-xs"
								>
									Belum Ditentukan
								</Badge>
							)}
						</div>

						<div className="space-y-1.5 flex-1 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								Pilih Dosen Pembimbing Akademik
							</Label>
							<Select
								value={selectedPaId || "none"}
								onValueChange={(v) =>
									setSelectedPaId(v === "none" ? "" : (v ?? ""))
								}
								disabled={!canEdit}
							>
								<SelectTrigger className="h-9 text-xs sm:text-sm font-medium bg-white border-slate-200">
									<span className="truncate text-slate-800">
										{selectedPaId && selectedPaId !== "none"
											? paList.find((p) => String(p.id) === selectedPaId)
													?.fullName ||
												(currentPa?.fullName ?? "Pilih Dosen PA...")
											: "— Belum Ditentukan —"}
									</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										<span className="text-slate-400 italic">
											— Belum Ditentukan —
										</span>
									</SelectItem>
									{paList.map((pa) => (
										<SelectItem key={pa.id} value={String(pa.id)}>
											<span className="font-medium text-slate-800">
												{pa.fullName}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{canEdit && (
							<Button
								size="sm"
								onClick={handleSavePa}
								disabled={isSavingPa}
								className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 font-bold shadow-sm"
							>
								{isSavingPa ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								Simpan Dosen PA
							</Button>
						)}
					</CardContent>
				</Card>

				{/* 4. Fasilitas Rumah Juang */}
				<Card className="border-slate-200 shadow-sm border-l-4 border-l-rose-600 flex flex-col justify-between h-full bg-white">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<div className="p-1.5 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
								<Home className="w-4 h-4" />
							</div>
							Fasilitas Rumah Juang
						</CardTitle>
					</CardHeader>
					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						<div className="h-12 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
							<span className="text-xs text-slate-500 font-medium">
								Status Saat Ini:
							</span>
							{pmbData?.rumahJuang ? (
								<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
									Aktif (Peserta)
								</Badge>
							) : (
								<Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium px-2.5 py-0.5">
									Tidak Aktif
								</Badge>
							)}
						</div>

						<div className="space-y-1.5 flex-1 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								Pilih Status Fasilitas Rumah Juang
							</Label>
							<Select
								value={rumahJuang ? "aktif" : "tidak_aktif"}
								onValueChange={(v) => setRumahJuang(v === "aktif")}
								disabled={!canEdit}
							>
								<SelectTrigger className="h-9 text-xs sm:text-sm font-medium bg-white border-slate-200">
									<span className="flex items-center gap-2 truncate text-slate-800">
										<span
											className={`w-2 h-2 rounded-full ${
												rumahJuang ? "bg-emerald-500" : "bg-slate-400"
											}`}
										/>
										{rumahJuang
											? "Aktif (Peserta Rumah Juang)"
											: "Tidak Aktif (Bukan Peserta)"}
									</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="aktif">
										<span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-700">
											<span className="w-2 h-2 rounded-full bg-emerald-500" />
											Aktif (Peserta Rumah Juang)
										</span>
									</SelectItem>
									<SelectItem value="tidak_aktif">
										<span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600">
											<span className="w-2 h-2 rounded-full bg-slate-400" />
											Tidak Aktif (Bukan Peserta)
										</span>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveRumahJuang}
								disabled={isSavingRumahJuang}
								className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 font-bold shadow-sm"
							>
								{isSavingRumahJuang ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								Simpan Status Rumah Juang
							</Button>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
