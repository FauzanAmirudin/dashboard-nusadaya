"use client";

import {
	BookUser,
	CheckCircle2,
	Hash,
	Loader2,
	Lock,
	Save,
	ShieldAlert,
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
	}, [studentId]);

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
			{/* Responsive 4-card grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-stretch">
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
								Simpan Status
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

						{/* Clearance Indicator Gatekeeper */}
						<div className="p-3 bg-slate-50 border rounded-lg space-y-2 text-xs">
							<div className="flex items-center justify-between">
								<span className="font-semibold text-slate-700 flex items-center gap-1.5">
									Syarat Rilis NIM (Clearance)
								</span>
								{clearanceStatus.canReleaseNim ? (
									<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold">
										Siap Rilis
									</Badge>
								) : (
									<Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] font-bold">
										Terkunci
									</Badge>
								)}
							</div>

							<div className="space-y-1 pt-1 border-t border-slate-200/60">
								<div className="flex items-center justify-between text-[11px]">
									<span className="text-slate-600">PMB (Berkas & ACC):</span>
									{clearanceStatus.pmbCleared ? (
										<span className="text-emerald-600 font-bold flex items-center gap-1">
											<CheckCircle2 className="w-3.5 h-3.5" /> ACC
										</span>
									) : (
										<span className="text-rose-600 font-bold flex items-center gap-1">
											<XCircle className="w-3.5 h-3.5" /> Belum ACC
										</span>
									)}
								</div>

								<div className="flex items-center justify-between text-[11px]">
									<span className="text-slate-600">
										Finance (Registrasi Awal):
									</span>
									{clearanceStatus.financeCleared ? (
										<span className="text-emerald-600 font-bold flex items-center gap-1">
											<CheckCircle2 className="w-3.5 h-3.5" /> Lunas
										</span>
									) : (
										<span className="text-rose-600 font-bold flex items-center gap-1">
											<XCircle className="w-3.5 h-3.5" /> Belum Lunas
										</span>
									)}
								</div>
							</div>

							{!clearanceStatus.canReleaseNim && (
								<p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
									Selesaikan clearance PMB & Finance sebelum NIM dapat dirilis.
								</p>
							)}
						</div>

						<div className="space-y-1.5 flex-1 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								{studentData?.nim ? "Perbarui NIM" : "Masukkan NIM"}
							</Label>
							<Input
								placeholder={
									clearanceStatus.canReleaseNim
										? "Contoh: 202401001"
										: "NIM terkunci (menunggu clearance)"
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
								disabled={!canEdit || !clearanceStatus.canReleaseNim}
								className={`h-9 text-xs sm:text-sm font-mono bg-white border-slate-200 ${
									!clearanceStatus.canReleaseNim
										? "bg-slate-100 text-slate-400 cursor-not-allowed"
										: ""
								}`}
							/>
						</div>

						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveNim}
								disabled={isSavingNim || !clearanceStatus.canReleaseNim}
								title={
									!clearanceStatus.canReleaseNim
										? "NIM terkunci hingga PMB (ACC) dan Finance (Registrasi) selesai"
										: ""
								}
								className={`w-full text-xs h-9 font-bold shadow-sm transition-all ${
									clearanceStatus.canReleaseNim
										? "bg-violet-600 hover:bg-violet-700 text-white"
										: "bg-slate-200 text-slate-400 cursor-not-allowed hover:bg-slate-200"
								}`}
							>
								{isSavingNim ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : !clearanceStatus.canReleaseNim ? (
									<Lock className="w-3.5 h-3.5 mr-1.5" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								{clearanceStatus.canReleaseNim
									? "Simpan NIM"
									: "NIM Terkunci (Belum Clearance)"}
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
								<div className="flex items-center gap-1.5 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold text-amber-900 truncate max-w-[180px]">
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
								Pilih Dosen PA
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

				{/* 4. Rombongan Belajar (Rombel) */}
				<Card className="border-slate-200 shadow-sm border-l-4 border-l-purple-600 flex flex-col justify-between h-full bg-white">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<div className="p-1.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
								<Users2 className="w-4 h-4" />
							</div>
							Rombongan Belajar (Rombel)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
						<div className="h-12 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
							<span className="text-xs text-slate-500 font-medium">
								Rombel Saat Ini:
							</span>
							<Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold px-2.5 py-0.5">
								<Users2 className="w-3 h-3 mr-1" />
								{studentData?.rombel || "Kelas A"}
							</Badge>
						</div>

						<div className="space-y-1.5 flex-1 flex flex-col justify-center">
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
								className="h-9 text-xs sm:text-sm font-medium bg-white border-slate-200"
							/>
							{/* Quick preset pills */}
							<div className="flex flex-wrap gap-1 pt-1">
								{DEFAULT_ROMBEL_OPTIONS.map((opt) => (
									<button
										key={opt}
										type="button"
										onClick={() => setSelectedRombel(opt)}
										disabled={!canEdit}
										className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
											selectedRombel === opt
												? "bg-[#0517B0] text-white"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200"
										}`}
									>
										{opt}
									</button>
								))}
							</div>
						</div>

						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveRombel}
								disabled={isSavingRombel}
								className="w-full bg-[#0517B0] hover:bg-blue-800 text-white text-xs h-9 font-bold shadow-sm"
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
