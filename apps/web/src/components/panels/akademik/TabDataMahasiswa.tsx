"use client";

import {
	BookUser,
	CheckCircle2,
	Hash,
	Loader2,
	Lock,
	Save,
	User,
	Users2,
	XCircle,
} from "lucide-react";
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
import { DEFAULT_ROMBEL_OPTIONS } from "@/constants/rooms";
import { API_URL, api, getToken } from "@/lib/eden";
import { filterNumeric, preventNonNumericKey } from "@/utils/form-validators";

interface TabDataMahasiswaProps {
	studentId: number;
	studentData?: {
		nim?: string | null;
		studentStatus?: string | null;
		paId?: number | null;
		rombel?: string | null;
	};
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
];

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

export function TabDataMahasiswa({
	studentId,
	studentData,
	canEdit,
	onUpdate,
}: TabDataMahasiswaProps) {
	// ── 1. Status Mahasiswa ──────────────────────────────
	const [selectedStatus, setSelectedStatus] = useState<string>(
		studentData?.studentStatus || "aktif",
	);
	const [isSavingStatus, setIsSavingStatus] = useState(false);

	// ── 2. NIM ───────────────────────────────────────────
	const [nim, setNim] = useState<string>(studentData?.nim || "");
	const [isSavingNim, setIsSavingNim] = useState(false);
	const [clearanceStatus, setClearanceStatus] = useState<{
		pmbCleared: boolean;
		financeCleared: boolean;
		canReleaseNim: boolean;
	}>({
		pmbCleared: false,
		financeCleared: false,
		canReleaseNim: false,
	});
	const [isLoadingClearance, setIsLoadingClearance] = useState(true);

	const fetchClearance = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/clearance-status`,
				{
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success && json.data) {
					setClearanceStatus(json.data);
				}
			}
		} catch (err) {
			console.error("Gagal mengambil status clearance", err);
		} finally {
			setIsLoadingClearance(false);
		}
	};

	useEffect(() => {
		fetchClearance();
	}, [studentId, studentData?.studentStatus, studentData?.nim]);

	// ── 3. PA (Pembimbing Akademik) ──────────────────────
	const [paList, setPaList] = useState<{ id: number; fullName: string }[]>([]);
	const [selectedPaId, setSelectedPaId] = useState<string>(
		studentData?.paId ? String(studentData.paId) : "",
	);
	const [isSavingPa, setIsSavingPa] = useState(false);

	// ── 4. Rombel (Rombongan Belajar) ───────────────────
	const [selectedRombel, setSelectedRombel] = useState<string>(
		studentData?.rombel || "Kelas A",
	);
	const [isSavingRombel, setIsSavingRombel] = useState(false);

	// Real-time synchronization from props
	useEffect(() => {
		setSelectedStatus(studentData?.studentStatus || "aktif");
		setNim(studentData?.nim || "");
		setSelectedPaId(studentData?.paId ? String(studentData.paId) : "");
		setSelectedRombel(studentData?.rombel || "Kelas A");
	}, [
		studentData?.studentStatus,
		studentData?.nim,
		studentData?.paId,
		studentData?.rombel,
	]);

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

	// Has NIM already been assigned?
	const isAlreadyHasNim = Boolean(studentData?.nim);
	// Can edit NIM: if clearance passed OR student already has NIM (to allow updating)
	const canEditNim =
		canEdit && (clearanceStatus.canReleaseNim || isAlreadyHasNim);

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
				fetchClearance();
			}
		} catch (err) {
			toast.error("Terjadi kesalahan jaringan saat menyimpan status");
		} finally {
			setIsSavingStatus(false);
		}
	};

	const handleSaveNim = async () => {
		if (!canEditNim) return;
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
				fetchClearance();
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

	const currentStatusConfig = getStatusConfig(
		studentData?.studentStatus || selectedStatus,
	);

	const handleSaveRombel = async () => {
		if (!canEdit) return;
		setIsSavingRombel(true);
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/rombel`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
				body: JSON.stringify({ rombel: selectedRombel.trim() }),
			});
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Rombel mahasiswa berhasil diperbarui");
				onUpdate();
			} else {
				toast.error(json?.message || "Gagal memperbarui rombel");
			}
		} catch {
			toast.error("Terjadi kesalahan jaringan saat menyimpan rombel");
		} finally {
			setIsSavingRombel(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Responsive 2-Cards Per Row Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
				{/* ── CARD 1: Status Mahasiswa ────────────────────────── */}
				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-all border-l-4 border-l-[#0517B0] flex flex-col justify-between h-full bg-white rounded-2xl overflow-hidden">
					<CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/40">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
								<div className="p-2 bg-blue-50 text-[#0517B0] rounded-xl border border-blue-100/80 shadow-2xs">
									<User className="w-4 h-4" />
								</div>
								<span>Status Mahasiswa</span>
							</CardTitle>
							<Badge
								className={`${currentStatusConfig.color} border text-xs font-semibold px-2.5 py-0.5`}
							>
								<span
									className={`w-2 h-2 rounded-full ${currentStatusConfig.dot} mr-1.5`}
								/>
								{currentStatusConfig.label}
							</Badge>
						</div>
					</CardHeader>

					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						{/* Current Status Box */}
						<div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
							<span className="text-xs font-medium text-slate-500">
								Status Saat Ini:
							</span>
							<Badge
								className={`${currentStatusConfig.color} border text-xs font-bold px-3 py-1 shadow-2xs`}
							>
								<span
									className={`w-2 h-2 rounded-full ${currentStatusConfig.dot} mr-1.5`}
								/>
								{currentStatusConfig.label}
							</Badge>
						</div>

						{/* Form Control */}
						<div className="space-y-2 flex-1 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								Pilih Status Mahasiswa
							</Label>
							<Select
								value={selectedStatus}
								onValueChange={(v) => setSelectedStatus(v || "aktif")}
								disabled={!canEdit}
							>
								<SelectTrigger className="h-10 text-xs sm:text-sm font-medium bg-white border-slate-200 rounded-xl">
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
							<p className="text-[11px] text-slate-400">
								Perubahan status akan mempengaruhi hak akses sistem dan absensi
								mahasiswa.
							</p>
						</div>

						{/* Action Button */}
						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveStatus}
								disabled={isSavingStatus}
								className="w-full bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-10 font-bold rounded-xl shadow-2xs transition-all mt-2"
							>
								{isSavingStatus ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								Simpan Status
							</Button>
						)}
					</CardContent>
				</Card>

				{/* ── CARD 2: NIM & Syarat Clearance ─────────────────── */}
				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-all border-l-4 border-l-violet-600 flex flex-col justify-between h-full bg-white rounded-2xl overflow-hidden">
					<CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/40">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
								<div className="p-2 bg-violet-50 text-violet-600 rounded-xl border border-violet-100/80 shadow-2xs">
									<Hash className="w-4 h-4" />
								</div>
								<span>NIM (Nomor Induk Mahasiswa)</span>
							</CardTitle>
							{isAlreadyHasNim ? (
								<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
									✓ Terdaftar
								</Badge>
							) : clearanceStatus.canReleaseNim ? (
								<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
									Siap Rilis
								</Badge>
							) : (
								<Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold px-2.5 py-0.5">
									Terkunci
								</Badge>
							)}
						</div>
					</CardHeader>

					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						{/* Current NIM Box */}
						<div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
							<span className="text-xs font-medium text-slate-500">
								NIM Terdaftar:
							</span>
							<span className="text-sm font-mono font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
								{studentData?.nim || (
									<span className="text-slate-400 italic font-sans font-normal text-xs">
										Belum Terbit
									</span>
								)}
							</span>
						</div>

						{/* Clearance Indicator Gatekeeper */}
						<div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 text-xs">
							<div className="flex items-center justify-between">
								<span className="font-semibold text-slate-700">
									Alur Syarat Rilis NIM (Clearance):
								</span>
								{isAlreadyHasNim ? (
									<span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
										<CheckCircle2 className="w-3.5 h-3.5" /> NIM Aktif
									</span>
								) : clearanceStatus.canReleaseNim ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold">
										Siap Rilis
									</Badge>
								) : (
									<Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] font-bold">
										Terkunci
									</Badge>
								)}
							</div>

							<div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
								<div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-[11px]">
									<span className="text-slate-600 font-medium">PMB:</span>
									{clearanceStatus.pmbCleared ? (
										<span className="text-emerald-600 font-bold flex items-center gap-1">
											<CheckCircle2 className="w-3 h-3" /> ACC
										</span>
									) : (
										<span className="text-rose-600 font-bold flex items-center gap-1">
											<XCircle className="w-3 h-3" /> Belum ACC
										</span>
									)}
								</div>

								<div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 text-[11px]">
									<span className="text-slate-600 font-medium">Finance:</span>
									{clearanceStatus.financeCleared ? (
										<span className="text-emerald-600 font-bold flex items-center gap-1">
											<CheckCircle2 className="w-3 h-3" /> Lunas
										</span>
									) : (
										<span className="text-rose-600 font-bold flex items-center gap-1">
											<XCircle className="w-3 h-3" /> Belum Lunas
										</span>
									)}
								</div>
							</div>

							{!isAlreadyHasNim && !clearanceStatus.canReleaseNim && (
								<p className="text-[10px] text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
									Selesaikan clearance PMB & Finance sebelum NIM baru dapat
									dirilis.
								</p>
							)}
						</div>

						{/* Form Control */}
						<div className="space-y-1.5 flex-1 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								{isAlreadyHasNim ? "Perbarui NIM" : "Masukkan NIM Baru"}
							</Label>
							<Input
								placeholder={
									canEditNim
										? "Contoh: 250001"
										: "NIM terkunci (menunggu clearance PMB & Finance)"
								}
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
								disabled={!canEditNim}
								className={`h-10 text-xs sm:text-sm font-mono bg-white border-slate-200 rounded-xl ${
									!canEditNim
										? "bg-slate-100 text-slate-400 cursor-not-allowed"
										: ""
								}`}
							/>
						</div>

						{/* Action Button */}
						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveNim}
								disabled={isSavingNim || !canEditNim}
								className={`w-full text-xs h-10 font-bold rounded-xl shadow-2xs transition-all mt-2 ${
									canEditNim
										? "bg-violet-600 hover:bg-violet-700 text-white"
										: "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"
								}`}
							>
								{isSavingNim ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : !canEditNim ? (
									<Lock className="w-3.5 h-3.5 mr-1.5" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								{canEditNim
									? isAlreadyHasNim
										? "Simpan Pembaruan NIM"
										: "Rilis & Simpan NIM"
									: "NIM Terkunci (Belum Clearance)"}
							</Button>
						)}
					</CardContent>
				</Card>

				{/* ── CARD 3: Dosen Pembimbing Akademik (PA) ─────────── */}
				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-all border-l-4 border-l-amber-600 flex flex-col justify-between h-full bg-white rounded-2xl overflow-hidden">
					<CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/40">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
								<div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/80 shadow-2xs">
									<BookUser className="w-4 h-4" />
								</div>
								<span>Dosen Pembimbing Akademik (PA)</span>
							</CardTitle>
							{currentPa ? (
								<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold px-2.5 py-0.5">
									Ditugaskan
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="text-slate-400 border-slate-200 text-xs"
								>
									Belum Ada
								</Badge>
							)}
						</div>
					</CardHeader>

					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						{/* Current PA Box */}
						<div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
							<span className="text-xs font-medium text-slate-500">
								PA Ditugaskan:
							</span>
							{currentPa ? (
								<div className="flex items-center gap-2 bg-amber-100/80 border border-amber-200 px-3 py-1 rounded-lg text-xs font-bold text-amber-900 shadow-2xs">
									<div className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
										{currentPa.fullName
											? currentPa.fullName.charAt(0).toUpperCase()
											: "P"}
									</div>
									<span className="truncate max-w-[200px]">
										{currentPa.fullName}
									</span>
								</div>
							) : (
								<Badge
									variant="outline"
									className="text-slate-400 border-slate-200 text-xs px-2.5 py-1"
								>
									Belum Ditentukan
								</Badge>
							)}
						</div>

						{/* Form Control */}
						<div className="space-y-2 flex-1 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								Pilih Dosen PA
							</Label>
							<Select
								value={selectedPaId || "none"}
								onValueChange={(v) =>
									setSelectedPaId(v === "none" ? "" : (v ?? ""))
								}
								disabled={!canEdit}
							>
								<SelectTrigger className="h-10 text-xs sm:text-sm font-medium bg-white border-slate-200 rounded-xl">
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
							<p className="text-[11px] text-slate-400">
								PA dapat memberikan bimbingan, verifikasi absensi, dan catatan
								karakter.
							</p>
						</div>

						{/* Action Button */}
						{canEdit && (
							<Button
								size="sm"
								onClick={handleSavePa}
								disabled={isSavingPa}
								className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-10 font-bold rounded-xl shadow-2xs transition-all mt-2"
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

				{/* ── CARD 4: Rombongan Belajar (Rombel) ─────────────── */}
				<Card className="border-slate-200/90 shadow-2xs hover:shadow-xs transition-all border-l-4 border-l-blue-600 flex flex-col justify-between h-full bg-white rounded-2xl overflow-hidden">
					<CardHeader className="pb-3.5 border-b border-slate-100 bg-slate-50/40">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
								<div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/80 shadow-2xs">
									<Users2 className="w-4 h-4" />
								</div>
								<span>Rombongan Belajar (Rombel)</span>
							</CardTitle>
							<Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-2.5 py-0.5">
								<Users2 className="w-3 h-3 mr-1" />
								{studentData?.rombel || "Kelas A"}
							</Badge>
						</div>
					</CardHeader>

					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						{/* Current Rombel Box */}
						<div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
							<span className="text-xs font-medium text-slate-500">
								Rombel Saat Ini:
							</span>
							<Badge className="bg-blue-100/80 text-blue-800 border-blue-200 text-xs font-bold px-3 py-1 shadow-2xs">
								<Users2 className="w-3 h-3 mr-1.5 text-blue-600" />
								{studentData?.rombel || "Kelas A"}
							</Badge>
						</div>

						{/* Form Control */}
						<div className="space-y-2 flex-1 flex flex-col justify-center">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-semibold text-slate-700">
									Nama Rombel
								</Label>
								<span className="text-[10px] text-slate-400">
									Kustom dinamis
								</span>
							</div>
							<Input
								value={selectedRombel}
								onChange={(e) => setSelectedRombel(e.target.value)}
								placeholder="Cth: Kelas A, Kelas B..."
								disabled={!canEdit}
								className="h-10 text-xs sm:text-sm font-medium bg-white border-slate-200 rounded-xl"
							/>
							{/* Quick preset pills */}
							<div className="flex flex-wrap items-center gap-1.5 pt-1">
								<span className="text-[11px] text-slate-400 mr-1">Preset:</span>
								{DEFAULT_ROMBEL_OPTIONS.map((opt) => (
									<button
										key={opt}
										type="button"
										onClick={() => setSelectedRombel(opt)}
										disabled={!canEdit}
										className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all shadow-2xs ${
											selectedRombel === opt
												? "bg-[#0517B0] text-white"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
										}`}
									>
										{opt}
									</button>
								))}
							</div>
						</div>

						{/* Action Button */}
						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveRombel}
								disabled={isSavingRombel}
								className="w-full bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-10 font-bold rounded-xl shadow-2xs transition-all mt-2"
							>
								{isSavingRombel ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								Simpan Rombel
							</Button>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
