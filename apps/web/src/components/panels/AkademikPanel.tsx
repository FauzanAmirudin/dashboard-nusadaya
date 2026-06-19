"use client";

import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Eye,
	Loader2,
	Trash2,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface DocFile {
	id: number;
	documentKey: string;
	fileName: string;
	fileUrl: string;
	isVerified: boolean;
	uploadedAt: string;
	verifiedAt?: string;
	uploadedBy?: { fullName: string };
	verifiedBy?: { fullName: string };
}

interface AkademikPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function AkademikPanel({ studentId, onUpdate }: AkademikPanelProps) {
	const { user } = useAuthStore();
	const isAkademikAdmin =
		user?.role === "akademik" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const canEdit = isAkademikAdmin || isSuperadmin;

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [acadState, setAcadState] = useState<any>(null);
	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [isLoading, setIsLoading] = useState(true);

	const [localChecks, setLocalChecks] = useState({
		pddiktiInput: false,
		utsPassed: false,
		uasPassed: false,
		attitudeIndicator: false,
		assignmentsCompleted: false,
		academicCommunication: false,
	});

	const [attendance, setAttendance] = useState<Record<string, number | string>>(
		{
			attendanceTotal: 0,
			attendancePresent: 0,
			attendanceAlphaNote: "",
		},
	);

	const [notes, setNotes] = useState("");
	const [loadingItem, setLoadingItem] = useState<string | null>(null);
	const [isSavingAttendance, setIsSavingAttendance] = useState(false);
	const [isSavingNotes, setIsSavingNotes] = useState(false);

	const fetchAcademicData = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].academic.get();
			if (!error && data?.success) {
				setAcadState(data.data);
			}
		} catch (err) {
			console.error("Failed to fetch academic data", err);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDocuments = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].academic.documents.get();
			if (!error && data?.success) {
				setDocuments(data.data as Record<string, DocFile[]>);
			}
		} catch (err) {
			console.error("Failed to fetch documents", err);
		}
	};

	useEffect(() => {
		fetchAcademicData();
		fetchDocuments();
	}, [studentId]);

	useEffect(() => {
		if (acadState) {
			setLocalChecks({
				pddiktiInput: !!acadState.pddiktiInput,
				utsPassed: !!acadState.utsPassed,
				uasPassed: !!acadState.uasPassed,
				attitudeIndicator: !!acadState.attitudeIndicator,
				assignmentsCompleted: !!acadState.assignmentsCompleted,
				academicCommunication: !!acadState.academicCommunication,
			});
			setAttendance({
				attendanceTotal: acadState.attendanceTotal || 0,
				attendancePresent: acadState.attendancePresent || 0,
				attendanceAlphaNote: acadState.attendanceAlphaNote || "",
			});
			setNotes(acadState.notes || "");
		}
	}, [acadState]);

	const attTotal = Number(attendance.attendanceTotal) || 0;
	const attPresent = Number(attendance.attendancePresent) || 0;
	const attendancePercentage =
		attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

	const isAttendancePassed = attendancePercentage >= 70;

	const checklist = [
		{
			id: "pddiktiInput",
			label: "Validasi Input PDDIKTI",
			desc: "Data akademik terdaftar di sistem PDDIKTI",
			checked: localChecks.pddiktiInput,
			auto: false,
			documentKey: "pddikti_input",
		},
		{
			id: "attendancePassed",
			label: "Kehadiran >= 70%",
			desc: `Kehadiran kelas: ${attendancePercentage}% (${attendance.attendancePresent} dari ${attendance.attendanceTotal} pertemuan)`,
			checked: isAttendancePassed,
			auto: true,
			documentKey: null,
		},
		{
			id: "utsPassed",
			label: "Nilai UTS Lulus",
			desc: "Semua mata kuliah UTS memenuhi standar minimal",
			checked: localChecks.utsPassed,
			auto: false,
			documentKey: "uts_passed",
		},
		{
			id: "uasPassed",
			label: "Nilai UAS Lulus",
			desc: "Semua mata kuliah UAS memenuhi standar minimal",
			checked: localChecks.uasPassed,
			auto: false,
			documentKey: "uas_passed",
		},
		{
			id: "attitudeIndicator",
			label: "Indikator Sikap",
			desc: "Sikap dan etika dinilai baik oleh Dosen & PA",
			checked: localChecks.attitudeIndicator,
			auto: false,
			documentKey: "attitude_indicator",
		},
		{
			id: "assignmentsCompleted",
			label: "Penyelesaian Tugas",
			desc: "Tugas perkuliahan utama telah diselesaikan",
			checked: localChecks.assignmentsCompleted,
			auto: false,
			documentKey: "assignments_completed",
		},
		{
			id: "academicCommunication",
			label: "Komunikasi Akademik",
			desc: "Komunikasi mahasiswa dengan dosen/PA aktif",
			checked: localChecks.academicCommunication,
			auto: false,
			documentKey: "academic_communication",
		},
	];

	const completedCount = checklist.filter((item) => item.checked).length;
	const isReadyForProcess = completedCount === 7;

	let statusBadge = (
		<Badge className="bg-rose-50 text-rose-600 border-rose-200">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (isReadyForProcess) {
		statusBadge = (
			<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
				🟢 AMAN
			</Badge>
		);
	} else if (completedCount >= 4) {
		statusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;
		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked }));
		setLoadingItem(id);

		try {
			const { error } = await api.students[studentId.toString()].academic.patch(
				{ [id]: checked },
			);
			if (!error) {
				toast.success("Berhasil disimpan");
				fetchAcademicData();
				onUpdate();
			} else {
				setLocalChecks(prevState);
				toast.error("Gagal menyimpan perubahan");
			}
		} catch (e) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan");
		} finally {
			setLoadingItem(null);
		}
	};

	const handleSaveAttendance = async () => {
		if (!canEdit) return;
		setIsSavingAttendance(true);

		try {
			const { error } = await api.students[studentId.toString()].academic.patch(
				{
					attendanceTotal: Number(attendance.attendanceTotal) || 0,
					attendancePresent: Number(attendance.attendancePresent) || 0,
					attendanceAlphaNote: attendance.attendanceAlphaNote as string,
				},
			);
			if (!error) {
				toast.success("Data kehadiran berhasil disimpan");
				fetchAcademicData();
				onUpdate();
			} else {
				toast.error("Gagal menyimpan kehadiran");
			}
		} catch {
			toast.error("Gagal menyimpan kehadiran");
		} finally {
			setIsSavingAttendance(false);
		}
	};

	const handleSaveNotes = async () => {
		if (!canEdit) return;
		setIsSavingNotes(true);
		try {
			const { error } = await api.students[studentId.toString()].academic.patch(
				{ notes },
			);
			if (!error) {
				toast.success("Catatan akademik disimpan");
				fetchAcademicData();
				onUpdate();
			} else {
				toast.error("Gagal menyimpan catatan");
			}
		} catch {
			toast.error("Gagal menyimpan catatan");
		} finally {
			setIsSavingNotes(false);
		}
	};

	const handleAcc = async () => {
		if (!isAkademikAdmin && !isSuperadmin) return;
		try {
			const { error } = await api.students[
				studentId.toString()
			].academic.acc.post({});
			if (!error) {
				toast.success("ACC Akademik berhasil dicatat");
				fetchAcademicData();
				onUpdate();
			} else {
				toast.error("Gagal memberikan ACC");
			}
		} catch {
			toast.error("Gagal memberikan ACC");
		}
	};

	const handleCancelAcc = async () => {
		if (!isAkademikAdmin && !isSuperadmin) return;
		setIsSavingNotes(true);
		try {
			const { error } =
				await api.students[studentId.toString()].academic.acc.delete();
			if (error) throw new Error("Gagal membatalkan ACC");
			toast.success("ACC Akademik berhasil dibatalkan");
			fetchAcademicData();
			onUpdate();
		} catch {
			toast.error("Gagal membatalkan ACC");
		} finally {
			setIsSavingNotes(false);
		}
	};

	const handleViewDocument = (docId: number) => {
		window.open(
			`${API_URL}/students/${studentId}/academic/documents/${docId}/download`,
			"_blank",
		);
	};

	const handleVerifyDocument = async (docId: number) => {
		if (!canEdit) return;
		try {
			const { error } = await api.students[
				studentId.toString()
			].academic.documents[docId.toString()].verify.patch({});
			if (!error) {
				toast.success("Dokumen ditandai terverifikasi");
				fetchDocuments();
			} else {
				toast.error("Gagal memverifikasi dokumen");
			}
		} catch {
			toast.error("Gagal memverifikasi dokumen");
		}
	};

	const handleDeleteDocument = async (docId: number) => {
		if (!canEdit) return;
		if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;
		try {
			const { error } =
				await api.students[studentId.toString()].academic.documents[
					docId.toString()
				].delete();
			if (!error) {
				toast.success("Dokumen berhasil dihapus");
				fetchDocuments();
			} else {
				toast.error("Gagal menghapus dokumen");
			}
		} catch {
			toast.error("Gagal menghapus dokumen");
		}
	};

	const getGpaGrade = (gpaScaled: number) => {
		const gpa = gpaScaled / 100;
		if (gpa >= 3.7) return "A";
		if (gpa >= 3.3) return "B+";
		if (gpa >= 3.0) return "B";
		if (gpa >= 2.7) return "C+";
		if (gpa >= 2.0) return "C";
		return "D";
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center p-12">
				<Loader2 className="w-8 h-8 animate-spin text-slate-400" />
			</div>
		);
	}

	const pddiktiOk = !!acadState?.pddiktiInput;
	const gpa = acadState?.gpa || 0;
	const gpaDisplay = (gpa / 100).toFixed(2);
	const gpaGrade = getGpaGrade(gpa);

	return (
		<div className="space-y-6">
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="border-b border-slate-200 pb-4">
					<div className="flex justify-between items-center">
						<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
							<span className="text-xl">🎓</span> Akademik — Kepatuhan Akademik
							<span className="ml-2 text-sm font-normal text-slate-500">
								[{completedCount}/7]
							</span>
						</CardTitle>
						<div className="flex items-center gap-3">
							<Badge
								variant="outline"
								className="border-slate-200 text-slate-500 bg-white"
							>
								Dikelola oleh: Admin Akademik
							</Badge>
							{statusBadge}
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-6">
					{/* SUMMARY */}
					<div className="mb-8">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							INDIKATOR KEPATUHAN UTAMA
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div
								className={`p-4 rounded-xl border ${pddiktiOk ? "bg-emerald-950/10 border-emerald-500/30" : "bg-rose-950/10 border-rose-500/30"}`}
							>
								<p className="text-xs font-bold text-slate-500 uppercase mb-1">
									PDDIKTI Input
								</p>
								<h4
									className={`text-lg font-bold mb-1 ${pddiktiOk ? "text-emerald-700" : "text-rose-700"}`}
								>
									{pddiktiOk ? "✅ SELESAI" : "❌ BELUM"}
								</h4>
								<p
									className={`text-sm font-semibold ${pddiktiOk ? "text-emerald-700" : "text-rose-700"}`}
								>
									Sinkronisasi Data
								</p>
							</div>

							<div
								className={`p-4 rounded-xl border ${isAttendancePassed ? "bg-emerald-950/10 border-emerald-500/30" : attendancePercentage > 50 ? "bg-amber-950/10 border-amber-500/30" : "bg-rose-950/10 border-rose-500/30"}`}
							>
								<p className="text-xs font-bold text-slate-500 uppercase mb-1">
									Kehadiran Kelas
								</p>
								<h4
									className={`text-lg font-bold mb-1 ${isAttendancePassed ? "text-emerald-700" : attendancePercentage > 50 ? "text-amber-700" : "text-rose-700"}`}
								>
									{attendancePercentage}%{" "}
									{isAttendancePassed ? "▲ AMAN" : "▼ KURANG"}
								</h4>
								<p
									className={`text-sm font-semibold ${isAttendancePassed ? "text-emerald-700" : attendancePercentage > 50 ? "text-amber-700" : "text-rose-700"}`}
								>
									Min. 70%
								</p>
							</div>

							<div className="p-4 rounded-xl border bg-blue-950/10 border-blue-500/30">
								<p className="text-xs font-bold text-slate-500 uppercase mb-1">
									Nilai Rata-rata
								</p>
								<h4 className="text-lg font-bold mb-1 text-blue-700">
									{gpaGrade} ({gpaDisplay})
								</h4>
								<p className="text-sm font-semibold text-blue-700">
									Dari Dosen
								</p>
							</div>
						</div>
					</div>

					{/* DETAIL KEHADIRAN */}
					<div className="mb-8 border-t border-slate-200 pt-6">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							DETAIL KEHADIRAN
						</h3>
						<div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="flex flex-col gap-4">
									<div className="flex gap-4">
										<div className="flex-1">
											<label className="text-xs font-semibold text-slate-500 mb-1 block">
												Total Pertemuan
											</label>
											<Input
												type="number"
												value={attendance.attendanceTotal}
												onChange={(e) =>
													setAttendance({
														...attendance,
														attendanceTotal:
															e.target.value === ""
																? ""
																: Number(e.target.value),
													})
												}
												disabled={!canEdit}
												className="font-bold text-slate-700 bg-white"
											/>
										</div>
										<div className="flex-1">
											<label className="text-xs font-semibold text-slate-500 mb-1 block">
												Hadir
											</label>
											<Input
												type="number"
												value={attendance.attendancePresent}
												onChange={(e) =>
													setAttendance({
														...attendance,
														attendancePresent:
															e.target.value === ""
																? ""
																: Number(e.target.value),
													})
												}
												disabled={!canEdit}
												className="font-bold text-slate-700 bg-white"
											/>
										</div>
									</div>
									<div>
										<div className="flex justify-between items-center mb-1">
											<label className="text-xs font-semibold text-slate-500">
												Persentase
											</label>
											<span
												className={`text-sm font-bold ${isAttendancePassed ? "text-emerald-600" : "text-rose-600"}`}
											>
												{attendancePercentage}%
											</span>
										</div>
										<Progress
											value={attendancePercentage}
											className="h-3 bg-slate-200"
											indicatorClassName={
												isAttendancePassed ? "bg-emerald-500" : "bg-rose-500"
											}
										/>
										<p className="text-xs text-slate-400 mt-1">
											{isAttendancePassed
												? "Memenuhi syarat min. 70%"
												: "Belum memenuhi syarat min. 70%"}
										</p>
									</div>
								</div>
								<div className="flex flex-col">
									<label className="text-xs font-semibold text-slate-500 mb-1 block">
										Keterangan Alpha / Izin
									</label>
									<Textarea
										placeholder="Catat keterangan absensi jika diperlukan..."
										value={attendance.attendanceAlphaNote}
										onChange={(e) =>
											setAttendance({
												...attendance,
												attendanceAlphaNote: e.target.value,
											})
										}
										disabled={!canEdit}
										className="flex-1 resize-none bg-white"
									/>
								</div>
							</div>
							{canEdit && (
								<div className="mt-4 flex justify-end">
									<Button
										variant="secondary"
										onClick={handleSaveAttendance}
										disabled={isSavingAttendance}
										className="text-[#0517B0] bg-[#0517B0]/10 hover:bg-[#0517B0]/20"
									>
										{isSavingAttendance && (
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										)}
										Simpan Kehadiran
									</Button>
								</div>
							)}
						</div>
					</div>

					{/* CHECKLIST */}
					<div className="mb-8 border-t border-slate-200 pt-6">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							CHECKLIST AKADEMIK
						</h3>
						<div className="space-y-4">
							{checklist.map((item) => {
								const itemDocs = documents[item.documentKey as string] || [];
								return (
									<div
										key={item.id}
										className="flex flex-col bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
									>
										<div
											className={`flex items-center gap-4 p-4 transition-colors ${
												item.checked
													? "bg-emerald-50/50"
													: item.auto
														? "bg-slate-50"
														: "bg-white hover:bg-slate-50/50"
											}`}
										>
											<Checkbox
												id={item.id}
												checked={item.checked}
												onCheckedChange={(c) =>
													!item.auto &&
													handleCheckboxChange(item.id, c as boolean)
												}
												disabled={
													!canEdit || item.auto || loadingItem === item.id
												}
												className={`w-6 h-6 rounded-md transition-all ${
													item.checked
														? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
														: ""
												}`}
											/>
											<label
												htmlFor={item.id}
												className={`flex-1 cursor-pointer block ${item.auto ? "cursor-default pointer-events-none" : ""}`}
											>
												<div
													className={`text-base font-semibold flex items-center ${
														item.checked ? "text-emerald-900" : "text-slate-700"
													}`}
												>
													{item.label}
													{item.auto && (
														<Badge
															variant="outline"
															className="ml-2 text-[10px] text-slate-500 border-slate-300"
														>
															⚡ Otomatis
														</Badge>
													)}
													{loadingItem === item.id && (
														<Loader2 className="w-4 h-4 text-emerald-600 animate-spin ml-2" />
													)}
												</div>
												<p
													className={`text-sm ${
														item.checked
															? "text-emerald-700/80"
															: "text-slate-500"
													}`}
												>
													{item.desc}
												</p>
											</label>
											<div>
												{item.checked ? (
													<CheckCircle className="w-6 h-6 text-emerald-500" />
												) : item.auto ? (
													<XCircle className="w-6 h-6 text-rose-400" />
												) : (
													<div className="w-6 h-6 rounded-full border-2 border-slate-300" />
												)}
											</div>
										</div>

										{/* Area Dokumen */}
										{item.documentKey && (
											<div className="p-4 bg-white border-t border-slate-100">
												<div className="flex items-center justify-between mb-2">
													<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
														Lampiran Dokumen
													</span>
												</div>
												<DocumentUpload
													studentId={studentId}
													panel="akademik"
													documentKey={item.documentKey as string}
													canEdit={canEdit}
												/>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* CATATAN */}
					<div className="border-t border-slate-200 pt-6">
						<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
							CATATAN AKADEMIK
						</h3>
						<Textarea
							placeholder="Tambahkan catatan khusus terkait akademik mahasiswa ini..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							disabled={!canEdit}
							className="min-h-[100px] bg-slate-50 resize-y mb-4"
						/>
						{canEdit && (
							<div className="flex justify-end">
								<Button
									onClick={handleSaveNotes}
									disabled={isSavingNotes}
									className="bg-slate-800 hover:bg-slate-700 text-white"
								>
									{isSavingNotes && (
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									)}
									Simpan Catatan
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Status ACC Card */}
			<Card className="bg-slate-50 border-slate-200 shadow-sm overflow-hidden">
				<CardContent className="p-0">
					<div className="flex flex-col sm:flex-row items-center justify-between p-6">
						<div className="flex flex-1 items-center gap-4 mb-4 sm:mb-0 w-full">
							{acadState?.isAcc ? (
								<div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
											<CheckCircle className="w-6 h-6 text-emerald-600" />
										</div>
										<div>
											<h4 className="text-emerald-700 font-bold text-lg">
												✅ ACC Akademik Diberikan
											</h4>
											<p className="text-sm text-slate-600">
												Oleh{" "}
												<span className="font-semibold">
													{acadState?.accBy?.fullName || "Admin Akademik"}
												</span>{" "}
												pada{" "}
												{acadState?.accAt
													? new Date(acadState.accAt).toLocaleString("id-ID", {
															dateStyle: "medium",
															timeStyle: "short",
														})
													: "Waktu tidak diketahui"}{" "}
												WIB
											</p>
										</div>
									</div>
									{(isAkademikAdmin || isSuperadmin) && (
										<AlertDialog>
											<AlertDialogTrigger
												render={
													<Button
														variant="outline"
														className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
														disabled={isSavingNotes}
													>
														{isSavingNotes ? "Membatalkan..." : "Batalkan ACC"}
													</Button>
												}
											/>
											<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
												<AlertDialogTitle>
													Konfirmasi Pembatalan ACC Akademik
												</AlertDialogTitle>
												<AlertDialogDescription className="text-slate-500">
													Apakah Anda yakin ingin membatalkan status ACC untuk
													panel Akademik ini? Status mahasiswa akan kembali ke
													tahap proses.
												</AlertDialogDescription>
												<div className="flex justify-end gap-3 mt-4">
													<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50">
														Batal
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={handleCancelAcc}
														className="bg-rose-600 hover:bg-rose-700 text-white"
													>
														Ya, Batalkan ACC
													</AlertDialogAction>
												</div>
											</AlertDialogContent>
										</AlertDialog>
									)}
								</div>
							) : (
								<>
									<div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
										<Clock className="w-6 h-6 text-slate-500" />
									</div>
									<div>
										<h4 className="text-slate-700 font-bold text-lg">
											{isReadyForProcess
												? "⏳ Menunggu ACC Akademik"
												: `⏳ Menunggu ACC Akademik (${7 - completedCount} item belum selesai)`}
										</h4>
										<p className="text-sm text-slate-500 max-w-md">
											{isReadyForProcess
												? "Status aman, siap untuk memberikan persetujuan."
												: `Diharapkan semua persyaratan akademik terpenuhi sebelum memberikan ACC.`}
										</p>
									</div>
								</>
							)}
						</div>

						{canEdit && !acadState?.isAcc && (
							<Tooltip>
								<TooltipTrigger render={<span className="inline-block" />}>
									<span>
										<AlertDialog>
											<AlertDialogTrigger
												disabled={!isReadyForProcess}
												className="w-full sm:w-auto bg-[#0517B0] hover:bg-blue-800 text-white font-bold px-8 py-2 rounded-md shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												✔ ACC Akademik →
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogTitle>
													Konfirmasi ACC Akademik
												</AlertDialogTitle>
												<AlertDialogDescription>
													<span className="mt-2 text-slate-600 block">
														Anda akan memberikan persetujuan final untuk status
														akademik mahasiswa ini. Pastikan semua data absensi
														dan kelulusan valid.
													</span>
												</AlertDialogDescription>
												<div className="flex justify-end gap-3 mt-4">
													<AlertDialogCancel className="border-slate-200">
														Batal
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={handleAcc}
														className="bg-[#0517B0] hover:bg-blue-800 text-white"
													>
														Ya, Lanjut ACC
													</AlertDialogAction>
												</div>
											</AlertDialogContent>
										</AlertDialog>
									</span>
								</TooltipTrigger>
								{!isReadyForProcess && (
									<TooltipContent>
										Selesaikan semua persyaratan akademik terlebih dahulu
									</TooltipContent>
								)}
							</Tooltip>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
