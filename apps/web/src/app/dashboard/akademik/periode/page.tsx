"use client";

import {
	AlertCircle,
	ArrowRight,
	Calendar,
	CheckCircle2,
	Clock,
	History,
	Loader2,
	Lock,
	Play,
	Plus,
	RotateCcw,
	ShieldAlert,
	Sparkles,
	Unlock,
} from "lucide-react";
import type React from "react";
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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { API_URL, getToken } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function AcademicPeriodPage() {
	const { user } = useAuthStore();
	const isSuperadmin = user?.role === "superadmin";

	const [terms, setTerms] = useState<any[]>([]);
	const [activeTerm, setActiveTerm] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Create / Edit Term State
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formTerm, setFormTerm] = useState({
		academicYear: "2026/2027",
		semesterType: "ganjil",
		startDate: "2026-08-01",
		endDate: "2027-01-31",
		krsStartDate: "2026-08-01",
		krsEndDate: "2026-08-31",
		gradeLockDate: "2027-01-31",
		status: "draft",
		isActive: false,
	});

	// Rollover State
	const [isRolloverOpen, setIsRolloverOpen] = useState(false);
	const [targetTermId, setTargetTermId] = useState<string>("");
	const [rolloverPreview, setRolloverPreview] = useState<any>(null);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);
	const [isExecutingRollover, setIsExecutingRollover] = useState(false);
	const [isConfirmRolloverOpen, setIsConfirmRolloverOpen] = useState(false);

	// Confirmation Dialog for Activate Term
	const [termToActivate, setTermToActivate] = useState<any | null>(null);
	const [isActivating, setIsActivating] = useState(false);

	// Reopen Term State
	const [reopenTermId, setReopenTermId] = useState<number | null>(null);
	const [reopenReason, setReopenReason] = useState("");
	const [isReopening, setIsReopening] = useState(false);

	const fetchTerms = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`${API_URL}/academic-terms`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					setTerms(json.data || []);
					const currentActive = json.data?.find((t: any) => t.isActive);
					setActiveTerm(currentActive || null);
				}
			}
		} catch (e) {
			console.error("Gagal memuat periode akademik", e);
			toast.error("Gagal memuat data periode akademik");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTerms();
	}, []);

	const handleCreateTerm = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			const res = await fetch(`${API_URL}/academic-terms`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
				body: JSON.stringify(formTerm),
			});
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Periode akademik berhasil dibuat");
				setIsCreateOpen(false);
				fetchTerms();
			} else {
				toast.error(json.message || "Gagal membuat periode");
			}
		} catch (err: any) {
			toast.error(err.message || "Kesalahan jaringan");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleConfirmActivateTerm = async () => {
		if (!termToActivate) return;
		setIsActivating(true);
		try {
			const res = await fetch(
				`${API_URL}/academic-terms/${termToActivate.id}/activate`,
				{
					method: "PATCH",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Periode akademik berhasil diaktifkan");
				setTermToActivate(null);
				fetchTerms();
			} else {
				toast.error(json.message || "Gagal mengaktifkan periode");
			}
		} catch {
			toast.error("Kesalahan jaringan");
		} finally {
			setIsActivating(false);
		}
	};

	const handleLoadRolloverPreview = async () => {
		if (!activeTerm || !targetTermId) return;
		setIsLoadingPreview(true);
		try {
			const res = await fetch(`${API_URL}/academic-rollover/preview`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
				body: JSON.stringify({
					sourceTermId: activeTerm.id,
					targetTermId: parseInt(targetTermId, 10),
				}),
			});
			const json = await res.json();
			if (res.ok && json.success) {
				setRolloverPreview(json.data);
			} else {
				toast.error(json.message || "Gagal memuat pratinjau rollover");
			}
		} catch {
			toast.error("Gagal terhubung ke server");
		} finally {
			setIsLoadingPreview(false);
		}
	};

	const handleExecuteRollover = async () => {
		if (!activeTerm || !targetTermId) return;
		setIsExecutingRollover(true);
		try {
			const res = await fetch(`${API_URL}/academic-rollover/execute`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
				body: JSON.stringify({
					sourceTermId: activeTerm.id,
					targetTermId: parseInt(targetTermId, 10),
				}),
			});
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success(
					`Rollover berhasil! ${json.data.promotedStudentsCount} mahasiswa naik semester.`,
				);
				setIsConfirmRolloverOpen(false);
				setIsRolloverOpen(false);
				setRolloverPreview(null);
				fetchTerms();
			} else {
				toast.error(json.message || "Gagal menjalankan rollover");
			}
		} catch {
			toast.error("Kesalahan saat mengeksekusi rollover");
		} finally {
			setIsExecutingRollover(false);
		}
	};

	const handleReopenTerm = async () => {
		if (!reopenTermId || !reopenReason.trim()) {
			toast.error("Alasan pembukaan kembali wajib diisi");
			return;
		}
		setIsReopening(true);
		try {
			const res = await fetch(
				`${API_URL}/academic-terms/${reopenTermId}/reopen`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${getToken()}`,
					},
					body: JSON.stringify({ reason: reopenReason }),
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("Periode berhasil dibuka kembali");
				setReopenTermId(null);
				setReopenReason("");
				fetchTerms();
			} else {
				toast.error(json.message || "Gagal membuka periode");
			}
		} catch {
			toast.error("Kesalahan jaringan");
		} finally {
			setIsReopening(false);
		}
	};

	const selectedTargetTerm = terms.find(
		(t) => t.id.toString() === targetTermId,
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
				<div>
					<h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
						<Calendar className="w-5 h-5 text-[#0517B0]" />
						Periode Akademik & Pergantian Semester
					</h1>
					<p className="text-xs text-slate-500 mt-1">
						Pengelolaan siklus semester perkuliahan (Ganjil & Genap), penutupan
						nilai, dan kenaikan semester otomatis
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						onClick={() => setIsCreateOpen(true)}
						size="sm"
						className="bg-[#0517B0] hover:bg-blue-800 text-white font-semibold text-xs gap-1.5 h-9"
					>
						<Plus className="w-4 h-4" /> Tambah Periode Baru
					</Button>
					{isSuperadmin && activeTerm && (
						<Button
							onClick={() => {
								setIsRolloverOpen(true);
								setRolloverPreview(null);
								setTargetTermId("");
							}}
							size="sm"
							variant="outline"
							className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs gap-1.5 h-9"
						>
							<RotateCcw className="w-4 h-4 text-indigo-600" /> Pergantian
							Semester
						</Button>
					)}
				</div>
			</div>

			{/* Active Term Summary Card */}
			{activeTerm && (
				<Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/40 shadow-xs">
					<CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<Badge className="bg-emerald-600 text-white text-[10px] font-bold">
									Periode Aktif Berjalan
								</Badge>
								<span className="text-xs font-semibold text-slate-500">
									Status:{" "}
									<strong className="uppercase text-slate-800">
										{activeTerm.status}
									</strong>
								</span>
							</div>
							<h2 className="text-lg font-bold text-indigo-950">
								{activeTerm.name} ({activeTerm.academicYear} - Semester{" "}
								{activeTerm.semesterType.toUpperCase()})
							</h2>
							<p className="text-xs text-slate-600 flex items-center gap-3">
								<span>
									Tanggal Mulai: <strong>{activeTerm.startDate}</strong>
								</span>
								<span>•</span>
								<span>
									Tanggal Selesai: <strong>{activeTerm.endDate}</strong>
								</span>
								<span>•</span>
								<span>
									Batas Nilai:{" "}
									<strong>{activeTerm.gradeLockDate || "-"}</strong>
								</span>
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="text-xs py-1.5 px-3 border-indigo-200 bg-white font-mono font-bold text-indigo-700"
							>
								Jendela KRS: {activeTerm.krsStartDate || "Aktif"} s.d.{" "}
								{activeTerm.krsEndDate || "-"}
							</Badge>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Daftar Periode Akademik */}
			<Card className="border border-slate-200 shadow-xs">
				<CardHeader className="bg-slate-50/80 border-b border-slate-100 py-4 px-6">
					<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
						<Clock className="w-4 h-4 text-indigo-600" />
						Daftar Riwayat & Agenda Periode Akademik
					</CardTitle>
					<CardDescription className="text-xs text-slate-500">
						Setiap periode mencatat batas waktu perkuliahan, registrasi KRS, dan
						penguncian nilai resmi
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
							<Loader2 className="w-4 h-4 animate-spin" /> Memuat data
							periode...
						</div>
					) : terms.length === 0 ? (
						<div className="p-8 text-center text-slate-400 text-xs">
							Belum ada periode akademik terdaftar. Silakan tambahkan periode
							baru.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50 text-[11px] font-bold text-slate-600">
									<TableHead>Nama Periode</TableHead>
									<TableHead>Tahun Ajaran</TableHead>
									<TableHead>Semester</TableHead>
									<TableHead>Rentang Waktu</TableHead>
									<TableHead>Status Siklus</TableHead>
									<TableHead>Status Aktif</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{terms.map((t) => (
									<TableRow key={t.id} className="text-xs hover:bg-slate-50/60">
										<TableCell className="font-bold text-slate-900">
											{t.name}
										</TableCell>
										<TableCell>{t.academicYear}</TableCell>
										<TableCell className="capitalize">
											{t.semesterType}
										</TableCell>
										<TableCell className="text-slate-600">
											{t.startDate} s.d. {t.endDate}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={`text-[10px] font-bold uppercase ${
													t.status === "ditutup"
														? "bg-slate-100 text-slate-600 border-slate-300"
														: t.status === "berjalan"
															? "bg-emerald-50 text-emerald-700 border-emerald-300"
															: "bg-blue-50 text-blue-700 border-blue-200"
												}`}
											>
												{t.status === "ditutup" ? (
													<span className="flex items-center gap-1">
														<Lock className="w-3 h-3" /> Ditutup
													</span>
												) : (
													t.status
												)}
											</Badge>
										</TableCell>
										<TableCell>
											{t.isActive ? (
												<Badge className="bg-emerald-600 text-white text-[10px] font-bold">
													Aktif
												</Badge>
											) : (
												<span className="text-slate-400 text-xs">-</span>
											)}
										</TableCell>
										<TableCell className="text-right space-x-2">
											{!t.isActive && t.status !== "ditutup" && (
												<Button
													size="sm"
													variant="outline"
													onClick={() => setTermToActivate(t)}
													className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
												>
													Aktifkan
												</Button>
											)}
											{t.status === "ditutup" && isSuperadmin && (
												<Button
													size="sm"
													variant="ghost"
													onClick={() => {
														setReopenTermId(t.id);
														setReopenReason("");
													}}
													className="h-7 text-xs text-amber-700 hover:bg-amber-50 gap-1"
												>
													<Unlock className="w-3 h-3" /> Buka Kembali
												</Button>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* DIALOG 1: Tambah Periode Baru */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900">
							Tambah Periode Akademik Baru
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Tentukan tahun ajaran dan jenis semester perkuliahan
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreateTerm} className="space-y-4 pt-2">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs">Tahun Ajaran</Label>
								<Input
									placeholder="2026/2027"
									value={formTerm.academicYear}
									onChange={(e) =>
										setFormTerm({ ...formTerm, academicYear: e.target.value })
									}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Jenis Semester</Label>
								<Select
									value={formTerm.semesterType}
									onValueChange={(val) =>
										setFormTerm({ ...formTerm, semesterType: val || "ganjil" })
									}
								>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ganjil">Ganjil (Sem 1, 3, 5)</SelectItem>
										<SelectItem value="genap">Genap (Sem 2, 4, 6)</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs">Tanggal Mulai</Label>
								<Input
									type="date"
									value={formTerm.startDate}
									onChange={(e) =>
										setFormTerm({ ...formTerm, startDate: e.target.value })
									}
									required
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Tanggal Selesai</Label>
								<Input
									type="date"
									value={formTerm.endDate}
									onChange={(e) =>
										setFormTerm({ ...formTerm, endDate: e.target.value })
									}
									required
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs">Jendela Mulai KRS</Label>
								<Input
									type="date"
									value={formTerm.krsStartDate}
									onChange={(e) =>
										setFormTerm({ ...formTerm, krsStartDate: e.target.value })
									}
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Jendela Selesai KRS</Label>
								<Input
									type="date"
									value={formTerm.krsEndDate}
									onChange={(e) =>
										setFormTerm({ ...formTerm, krsEndDate: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Tanggal Penguncian Nilai</Label>
							<Input
								type="date"
								value={formTerm.gradeLockDate}
								onChange={(e) =>
									setFormTerm({ ...formTerm, gradeLockDate: e.target.value })
								}
							/>
						</div>
						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsCreateOpen(false)}
							>
								Batal
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={isSubmitting}
								className="bg-[#0517B0] text-white"
							>
								{isSubmitting ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
								) : null}
								Simpan Periode
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* DIALOG 2: Pergantian Semester (Rollover) */}
			<Dialog open={isRolloverOpen} onOpenChange={setIsRolloverOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<RotateCcw className="w-5 h-5 text-indigo-600" />
							Pergantian Semester (Rollover)
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Menutup periode aktif saat ini ({activeTerm?.name}) dan memajukan
							mahasiswa ke semester berikutnya
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 pt-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">
								Pilih Periode Akademik Tujuan (Semester Baru)
							</Label>
							<Select
								value={targetTermId}
								onValueChange={(val) => {
									setTargetTermId(val || "");
									setRolloverPreview(null);
								}}
							>
								<SelectTrigger className="h-10 text-xs">
									<SelectValue placeholder="-- Pilih Periode Akademik Tujuan --">
										{selectedTargetTerm
											? `${selectedTargetTerm.name} (${selectedTargetTerm.academicYear} - Semester ${selectedTargetTerm.semesterType.toUpperCase()})`
											: "-- Pilih Periode Akademik Tujuan --"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{terms
										.filter(
											(t) => t.id !== activeTerm?.id && t.status !== "ditutup",
										)
										.map((t) => (
											<SelectItem key={t.id} value={t.id.toString()}>
												<div className="flex flex-col text-left py-0.5">
													<span className="font-semibold text-slate-900">
														{t.name} ({t.academicYear} - Semester{" "}
														{t.semesterType.toUpperCase()})
													</span>
													<span className="text-[11px] text-slate-500">
														Rentang Waktu: {t.startDate} s.d. {t.endDate}
													</span>
												</div>
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						{selectedTargetTerm && (
							<div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs space-y-1 text-slate-700">
								<div className="font-bold text-indigo-950 flex items-center gap-1.5">
									<Calendar className="w-3.5 h-3.5 text-indigo-600" />
									Detail Periode Tujuan Terpilih:
								</div>
								<div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-0.5">
									<div>
										Nama:{" "}
										<strong className="text-slate-900">
											{selectedTargetTerm.name}
										</strong>
									</div>
									<div>
										Tahun Ajaran:{" "}
										<strong className="text-slate-900">
											{selectedTargetTerm.academicYear}
										</strong>
									</div>
									<div>
										Jenis Semester:{" "}
										<strong className="text-slate-900 capitalize">
											{selectedTargetTerm.semesterType}
										</strong>
									</div>
									<div>
										Jadwal Perkuliahan:{" "}
										<strong className="text-slate-900">
											{selectedTargetTerm.startDate} s.d.{" "}
											{selectedTargetTerm.endDate}
										</strong>
									</div>
								</div>
							</div>
						)}

						{targetTermId && !rolloverPreview && (
							<Button
								type="button"
								onClick={handleLoadRolloverPreview}
								disabled={isLoadingPreview}
								size="sm"
								className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
							>
								{isLoadingPreview ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Play className="w-3.5 h-3.5" />
								)}
								Jalankan Pratinjau Kenaikan Semester (Dry-Run)
							</Button>
						)}

						{rolloverPreview && (
							<div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3 animate-in fade-in">
								<h4 className="text-xs font-bold text-indigo-950 flex items-center justify-between">
									<span>Hasil Pratinjau Rollover</span>
									<Badge className="bg-indigo-600 text-white text-[10px]">
										{rolloverPreview.totalStudentsToPromote} Mahasiswa
									</Badge>
								</h4>
								<div className="space-y-1 text-xs text-slate-700">
									<p>
										Dari Periode:{" "}
										<strong>{rolloverPreview.sourceTerm?.name}</strong>
									</p>
									<p>
										Ke Periode Baru:{" "}
										<strong>{rolloverPreview.targetTerm?.name}</strong>
									</p>
								</div>

								{/* Rincian Promosi Angkatan */}
								<div className="pt-2 border-t border-indigo-100 space-y-1 text-xs">
									<p className="font-semibold text-slate-800">
										Proyeksi Kenaikan Semester:
									</p>
									{Object.entries(rolloverPreview.promotionSummary || {}).map(
										([key, item]: any) => (
											<div
												key={key}
												className="flex justify-between items-center text-[11px] text-slate-600 bg-white p-2 rounded border border-indigo-50"
											>
												<span>{key}</span>
												<span className="font-bold text-indigo-700">
													{item.count} mhs
												</span>
											</div>
										),
									)}
								</div>

								{rolloverPreview.unassignedGradesCount > 0 && (
									<div className="flex items-center gap-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
										<AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
										<span>
											Masih ada{" "}
											<strong>{rolloverPreview.unassignedGradesCount}</strong>{" "}
											nilai belum terisi di semester aktif. Nilai ini akan
											terkunci otomatis jika semester ditutup.
										</span>
									</div>
								)}

								<DialogFooter className="pt-3 border-t border-indigo-100">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setRolloverPreview(null)}
										disabled={isExecutingRollover}
									>
										Ulangi Pilihan
									</Button>
									<Button
										type="button"
										size="sm"
										onClick={() => setIsConfirmRolloverOpen(true)}
										disabled={isExecutingRollover}
										className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
									>
										<CheckCircle2 className="w-3.5 h-3.5" />
										Konfirmasi & Jalankan Kenaikan Semester
									</Button>
								</DialogFooter>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* DIALOG 3: Buka Kembali Periode Ditutup (Superadmin Only) */}
			<Dialog
				open={reopenTermId !== null}
				onOpenChange={(open) => !open && setReopenTermId(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-amber-900 flex items-center gap-2">
							<ShieldAlert className="w-5 h-5 text-amber-600" />
							Buka Kembali Periode Tertutup
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Fitur berisiko tinggi khusus Superadmin. Alasan pembukaan kembali
							wajib dicatat untuk audit resmi.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 pt-2">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">
								Alasan Pembukaan Kembali *
							</Label>
							<Textarea
								placeholder="Tuliskan alasan resmi pembukaan kembali penilaian..."
								value={reopenReason}
								onChange={(e) => setReopenReason(e.target.value)}
								className="text-xs"
								rows={3}
							/>
						</div>
						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setReopenTermId(null)}
							>
								Batal
							</Button>
							<Button
								type="button"
								size="sm"
								disabled={isReopening || !reopenReason.trim()}
								onClick={handleReopenTerm}
								className="bg-amber-600 hover:bg-amber-700 text-white"
							>
								{isReopening ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
								) : null}
								Buka Kembali
							</Button>
						</DialogFooter>
					</div>
				</DialogContent>
			</Dialog>

			{/* ALERT DIALOG: Konfirmasi Aktivasi Periode */}
			<AlertDialog
				open={termToActivate !== null}
				onOpenChange={(open) => !open && setTermToActivate(null)}
			>
				<AlertDialogContent className="rounded-2xl max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<CheckCircle2 className="w-5 h-5 text-emerald-600" />
							Aktifkan Periode Akademik?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-600 text-left">
							Apakah Anda yakin ingin mengaktifkan periode{" "}
							<strong>
								{termToActivate?.name} ({termToActivate?.academicYear} -
								Semester {termToActivate?.semesterType?.toUpperCase()})
							</strong>{" "}
							sebagai periode aktif berjalan? Periode berjalan saat ini akan
							dinonaktifkan secara otomatis.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={isActivating}
							className="rounded-xl text-xs"
						>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmActivateTerm}
							disabled={isActivating}
							className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
						>
							{isActivating ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
							) : null}
							Ya, Aktifkan Periode
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ALERT DIALOG: Konfirmasi Eksekusi Pergantian Semester (Rollover) */}
			<AlertDialog
				open={isConfirmRolloverOpen}
				onOpenChange={setIsConfirmRolloverOpen}
			>
				<AlertDialogContent className="rounded-2xl max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-amber-600" />
							Konfirmasi Pergantian Semester
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs text-slate-600 space-y-2 text-left">
							<span>
								Anda akan menutup periode <strong>{activeTerm?.name}</strong>{" "}
								dan memajukan mahasiswa ke semester baru pada periode{" "}
								<strong>{selectedTargetTerm?.name}</strong>.
							</span>
							<span className="block p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-relaxed">
								<strong>Peringatan:</strong> Pengisian nilai pada semester aktif
								saat ini akan dikunci secara resmi dan seluruh mahasiswa aktif
								akan dinaikkan 1 semester.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={isExecutingRollover}
							className="rounded-xl text-xs"
						>
							Kembali
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleExecuteRollover}
							disabled={isExecutingRollover}
							className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs"
						>
							{isExecutingRollover ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
							) : null}
							Ya, Jalankan Pergantian Semester
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
