"use client";

import {
	BookUser,
	GraduationCap,
	Hash,
	Home,
	Loader2,
	Save,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
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
		color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
	},
	{
		value: "cuti",
		label: "Cuti",
		color: "bg-amber-500/10 text-amber-600 border-amber-200",
	},
	{
		value: "dropout",
		label: "Drop Out",
		color: "bg-rose-500/10 text-rose-600 border-rose-200",
	},
	{
		value: "mengundurkan_diri",
		label: "Mengundurkan Diri",
		color: "bg-orange-500/10 text-orange-600 border-orange-200",
	},
	{
		value: "lulus",
		label: "Lulus",
		color: "bg-blue-500/10 text-blue-600 border-blue-200",
	},
];

function getStatusConfig(val: string | null | undefined) {
	return STATUS_OPTIONS.find((o) => o.value === val) ?? STATUS_OPTIONS[0];
}

export function TabDataTambahan({
	studentId,
	studentData,
	pmbData,
	canEdit,
	onUpdate,
}: TabDataTambahanProps) {
	// ── Status ──────────────────────────────────────────
	const [selectedStatus, setSelectedStatus] = useState(
		studentData?.studentStatus || "aktif",
	);
	const [isSavingStatus, setIsSavingStatus] = useState(false);

	// ── NIM ────────────────────────────────────────────
	const [nim, setNim] = useState(studentData?.nim || "");
	const [isSavingNim, setIsSavingNim] = useState(false);

	// ── PA ─────────────────────────────────────────────
	const [paList, setPaList] = useState<{ id: number; fullName: string }[]>([]);
	const [selectedPaId, setSelectedPaId] = useState<string>(
		studentData?.paId ? String(studentData.paId) : "",
	);
	const [isSavingPa, setIsSavingPa] = useState(false);

	// ── Rumah Juang ────────────────────────────────────
	const [rumahJuang, setRumahJuang] = useState<boolean>(!!pmbData?.rumahJuang);
	const [isSavingRumahJuang, setIsSavingRumahJuang] = useState(false);

	// Sync from parent props
	useEffect(() => {
		setSelectedStatus(studentData?.studentStatus || "aktif");
		setNim(studentData?.nim || "");
		setSelectedPaId(studentData?.paId ? String(studentData.paId) : "");
	}, [studentData]);

	useEffect(() => {
		setRumahJuang(!!pmbData?.rumahJuang);
	}, [pmbData]);

	// Fetch PA list
	useEffect(() => {
		const fetchPaList = async () => {
			const res = await api.students["pa-list"].get();
			if (res.data?.success && res.data.data) {
				setPaList(res.data.data as { id: number; fullName: string }[]);
			}
		};
		fetchPaList();
	}, []);

	// ── Handlers ──────────────────────────────────────
	const handleSaveStatus = async () => {
		if (!canEdit) return;
		setIsSavingStatus(true);
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
		setIsSavingStatus(false);
	};

	const handleSaveNim = async () => {
		if (!canEdit) return;
		setIsSavingNim(true);
		const res = await api.students[studentId.toString()].nim.patch({ nim });
		if (res.error) {
			const msg = (res.error as any)?.value?.message ?? "Gagal memperbarui NIM";
			toast.error(msg);
		} else {
			toast.success("NIM berhasil diperbarui");
			onUpdate();
		}
		setIsSavingNim(false);
	};

	const handleSavePa = async () => {
		if (!canEdit) return;
		setIsSavingPa(true);
		const paId = selectedPaId ? parseInt(selectedPaId, 10) : null;
		const res = await api.students[studentId.toString()].pa.patch({ paId });
		if (res.error) {
			toast.error("Gagal memperbarui PA mahasiswa");
		} else {
			toast.success("PA mahasiswa berhasil diperbarui");
			onUpdate();
		}
		setIsSavingPa(false);
	};

	const handleToggleRumahJuang = async (val: boolean) => {
		if (!canEdit) return;
		setIsSavingRumahJuang(true);
		const prevVal = rumahJuang;
		setRumahJuang(val);
		const res = await api.students[studentId.toString()].pmb[
			"rumah-juang"
		].patch({
			rumahJuang: val,
		});
		if (res.error) {
			setRumahJuang(prevVal);
			toast.error("Gagal memperbarui status Rumah Juang");
		} else {
			toast.success(
				val
					? "Status Rumah Juang diaktifkan"
					: "Status Rumah Juang dinonaktifkan",
			);
			onUpdate();
		}
		setIsSavingRumahJuang(false);
	};

	const currentStatusConfig = getStatusConfig(selectedStatus);

	return (
		<div className="space-y-4">
			{/* Grid 2 kolom di md ke atas */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* 1. Status Mahasiswa */}
				<Card className="border-slate-200 shadow-sm">
					<CardHeader className="pb-3 border-b border-slate-100">
						<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
							<div className="p-1.5 bg-blue-50 rounded-md">
								<User className="w-4 h-4 text-[#0517B0]" />
							</div>
							Status Mahasiswa
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs text-slate-500">Status saat ini:</span>
							<Badge
								className={`${currentStatusConfig.color} border text-xs font-medium`}
							>
								{currentStatusConfig.label}
							</Badge>
						</div>
						<div className="space-y-2">
							<Label className="text-xs text-slate-600">Ubah Status</Label>
							<Select
								value={selectedStatus}
								onValueChange={(v) => setSelectedStatus(v || "aktif")}
								disabled={!canEdit}
							>
								<SelectTrigger className="h-9 text-sm">
									<SelectValue placeholder="Pilih status..." />
								</SelectTrigger>
								<SelectContent>
									{STATUS_OPTIONS.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											<span className="flex items-center gap-2">
												<span
													className={`w-2 h-2 rounded-full ${opt.color.split(" ")[0].replace("/10", "").replace("bg-", "bg-")}`}
												/>
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
								className="w-full bg-[#0517B0] hover:bg-[#04128A] text-white text-xs h-8"
							>
								{isSavingStatus ? (
									<Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3 h-3 mr-1.5" />
								)}
								Simpan Status
							</Button>
						)}
					</CardContent>
				</Card>

				{/* 2. NIM */}
				<Card className="border-slate-200 shadow-sm">
					<CardHeader className="pb-3 border-b border-slate-100">
						<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
							<div className="p-1.5 bg-violet-50 rounded-md">
								<Hash className="w-4 h-4 text-violet-600" />
							</div>
							NIM (Nomor Induk Mahasiswa)
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs text-slate-500">NIM saat ini:</span>
							<span className="text-xs font-mono font-semibold text-slate-700">
								{studentData?.nim || (
									<span className="text-slate-400 italic">Belum diisi</span>
								)}
							</span>
						</div>
						<div className="space-y-2">
							<Label className="text-xs text-slate-600">
								{studentData?.nim ? "Ubah NIM" : "Isi NIM"}
							</Label>
							<Input
								placeholder="Contoh: 24001"
								value={nim}
								onChange={(e) => setNim(e.target.value)}
								disabled={!canEdit}
								className="h-9 text-sm font-mono"
							/>
						</div>
						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveNim}
								disabled={isSavingNim}
								className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
							>
								{isSavingNim ? (
									<Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3 h-3 mr-1.5" />
								)}
								Simpan NIM
							</Button>
						)}
					</CardContent>
				</Card>

				{/* 3. PA */}
				<Card className="border-slate-200 shadow-sm">
					<CardHeader className="pb-3 border-b border-slate-100">
						<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
							<div className="p-1.5 bg-amber-50 rounded-md">
								<BookUser className="w-4 h-4 text-amber-600" />
							</div>
							PA (Pembimbing Akademik)
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs text-slate-500">PA Aktif:</span>
							<span className="text-xs font-semibold text-slate-700">
								{paList.find((p) => p.id === studentData?.paId)?.fullName || (
									<span className="text-slate-400 italic">
										Belum ditentukan
									</span>
								)}
							</span>
						</div>
						<div className="space-y-2">
							<Label className="text-xs text-slate-600">Pilih PA</Label>
							<Select
								value={selectedPaId}
								onValueChange={(v) =>
									setSelectedPaId(v === "none" ? "" : (v ?? ""))
								}
								disabled={!canEdit}
							>
								<SelectTrigger className="h-9 text-sm">
									<SelectValue placeholder="Pilih Pembimbing Akademik..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										<span className="text-slate-400 italic">
											— Belum ditentukan —
										</span>
									</SelectItem>
									{paList.map((pa) => (
										<SelectItem key={pa.id} value={String(pa.id)}>
											{pa.fullName}
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
								className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
							>
								{isSavingPa ? (
									<Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3 h-3 mr-1.5" />
								)}
								Simpan PA
							</Button>
						)}
					</CardContent>
				</Card>

				{/* 4. Rumah Juang */}
				<Card className="border-slate-200 shadow-sm">
					<CardHeader className="pb-3 border-b border-slate-100">
						<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
							<div className="p-1.5 bg-rose-50 rounded-md">
								<Home className="w-4 h-4 text-rose-600" />
							</div>
							Rumah Juang
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4 space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-xs text-slate-500">Status saat ini:</span>
							{rumahJuang ? (
								<Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 text-xs">
									🏠 Aktif
								</Badge>
							) : (
								<Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-xs">
									Tidak Aktif
								</Badge>
							)}
						</div>
						{canEdit && (
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleToggleRumahJuang(true)}
									disabled={isSavingRumahJuang || rumahJuang}
									className={`flex-1 text-xs h-8 disabled:opacity-40 transition-colors ${
										!rumahJuang
											? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
											: "border-emerald-200 text-emerald-700 bg-emerald-50/50"
									}`}
								>
									{isSavingRumahJuang && !rumahJuang ? (
										<Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
									) : (
										<GraduationCap className="w-3 h-3 mr-1.5" />
									)}
									Aktifkan
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleToggleRumahJuang(false)}
									disabled={isSavingRumahJuang || !rumahJuang}
									className={`flex-1 text-xs h-8 disabled:opacity-40 transition-colors ${
										rumahJuang
											? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600"
											: "border-rose-200 text-rose-700 bg-rose-50/50"
									}`}
								>
									{isSavingRumahJuang && rumahJuang ? (
										<Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
									) : null}
									Nonaktifkan
								</Button>
							</div>
						)}
						<p className="text-[11px] text-slate-400 leading-relaxed">
							Aktifkan jika mahasiswa merupakan peserta program Rumah Juang.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
