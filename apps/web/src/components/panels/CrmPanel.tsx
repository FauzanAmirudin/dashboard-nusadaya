"use client";

import {
	CheckCircle,
	Clock,
	Eye,
	FileText,
	Loader2,
	Trash2,
	UploadCloud,
	User,
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
	uploadedByUser?: { fullName: string } | null;
	verifiedByUser?: { fullName: string } | null;
}

interface CrmPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function CrmPanel({ studentId, onUpdate }: CrmPanelProps) {
	const { user, token } = useAuthStore();
	const isCrmAdmin = user?.role === "crm" || user?.role === "superadmin";
	const isSuperadmin = user?.role === "superadmin";
	const canEdit = isCrmAdmin;

	const [isSavingLog, setIsSavingLog] = useState(false);
	const [logText, setLogText] = useState("");

	const [crmState, setCrmState] = useState<{ crm: any; logs: any[] } | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const crm = crmState?.crm;
	const logs = crmState?.logs || [];

	const [attendancePresent, setAttendancePresent] = useState<number | string>(
		0,
	);
	const [attendanceTotal, setAttendanceTotal] = useState<number | string>(0);

	const [localChecks, setLocalChecks] = useState({
		odsActive: false,
		studentMonitoring: false,
		parentFollowUp: false,
		practiceAttendance: false,
		odsDocumentation: false,
	});

	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [uploadingKey, setUploadingKey] = useState<string | null>(null);
	const [viewingDocId, setViewingDocId] = useState<number | null>(null);

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [showAllLogs, setShowAllLogs] = useState(false);

	const fetchCrmData = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].crm.get();
			if (!error && data?.success) {
				setCrmState(data.data as any);
			}
		} catch (error) {
			console.error("Failed to fetch CRM data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchDocuments = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/documents`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					setDocuments(json.data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch CRM documents", error);
		}
	};

	useEffect(() => {
		fetchCrmData();
		fetchDocuments();
	}, [studentId, token]);

	useEffect(() => {
		if (crm) {
			setLocalChecks({
				odsActive: !!crm.odsActive,
				studentMonitoring: !!crm.studentMonitoring,
				parentFollowUp: !!crm.parentFollowUp,
				practiceAttendance: !!crm.practiceAttendance,
				odsDocumentation: !!crm.odsDocumentation,
			});
			setAttendancePresent(crm.practiceDaysPresent || 0);
			setAttendanceTotal(crm.practiceDaysTotal || 0);
		}
	}, [crm]);

	const handleShowAllLogs = async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].crm.logs.get();
			if (!error && data?.success) {
				setCrmState((prev) =>
					prev ? { ...prev, logs: data.data as any } : null,
				);
				setShowAllLogs(true);
			} else {
				toast.error("Gagal mengambil seluruh log komunikasi.");
			}
		} catch (error) {
			console.error("Failed to fetch all logs:", error);
			toast.error("Gagal mengambil seluruh log komunikasi.");
		}
	};

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;

		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked }));
		setLoadingItem(id);

		const payload = { [id]: checked };

		try {
			const { error } =
				await api.students[studentId.toString()].crm.patch(payload);

			if (error) {
				throw new Error("Gagal menyimpan perubahan");
			}

			toast.success("Berhasil disimpan");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan");
		} finally {
			setLoadingItem(null);
		}
	};

	const handleAttendanceSave = async () => {
		if (!canEdit) return;
		const payload = {
			practiceDaysPresent: Number(attendancePresent) || 0,
			practiceDaysTotal: Number(attendanceTotal) || 0,
		};

		try {
			const { error } =
				await api.students[studentId.toString()].crm.patch(payload);

			if (error) {
				throw new Error("Gagal menyimpan kehadiran");
			}

			toast.success("Data kehadiran berhasil disimpan");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal menyimpan kehadiran");
		}
	};

	const handleFileUpload = async (
		documentKey: string,
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploadingKey(documentKey);
		const formData = new FormData();
		formData.append("file", file);

		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/upload/${documentKey}`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: formData,
				},
			);
			const json = await res.json();
			if (res.ok && json.success) {
				toast.success("File berhasil diupload");
				fetchDocuments();
			} else {
				toast.error(json.message || "Gagal mengupload file");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
		setUploadingKey(null);

		// Reset file input
		e.target.value = "";
	};

	const handleViewDocument = (docId: number) => {
		window.open(
			`/api/students/${studentId}/crm/documents/${docId}/download`,
			"_blank",
		);
	};

	const handleVerifyDocument = async (docId: number) => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/documents/${docId}/verify`,
				{
					method: "PATCH",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				toast.success("Dokumen ditandai terverifikasi");
				fetchDocuments();
			} else {
				toast.error("Gagal memverifikasi dokumen");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const handleDeleteDocument = async (docId: number) => {
		if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;

		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/documents/${docId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (res.ok) {
				toast.success("Dokumen berhasil dihapus");
				fetchDocuments();
			} else {
				toast.error("Gagal menghapus dokumen");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const handleSaveLog = async () => {
		if (!logText.trim() || !canEdit) return;
		setIsSavingLog(true);

		try {
			const { error } = await api.students[studentId.toString()].crm.log.post({
				logText,
			});

			if (error) {
				throw new Error("Gagal menambah log");
			}

			toast.success("Log komunikasi berhasil ditambahkan");
			setLogText("");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal menambah log");
		} finally {
			setIsSavingLog(false);
		}
	};

	const handleAcc = async () => {
		if (!isCrmAdmin) return;
		try {
			const { error } = await api.students[studentId.toString()].crm.acc.post();

			if (error) {
				throw new Error("Gagal memberikan ACC");
			}

			toast.success("ACC CRM berhasil dicatat");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal memberikan ACC");
		}
	};

	const handleCancelAcc = async () => {
		if (!isCrmAdmin) return;
		setIsSavingLog(true);
		try {
			const { error } =
				await api.students[studentId.toString()].crm.acc.delete();
			if (error) throw new Error("Gagal membatalkan ACC");
			toast.success("ACC CRM berhasil dibatalkan");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal membatalkan ACC");
		} finally {
			setIsSavingLog(false);
		}
	};

	const checklist = [
		{
			id: "odsActive",
			label: "ODS Aktif",
			desc: "Mahasiswa sedang mengikuti program ODS",
			checked: localChecks.odsActive,
		},
		{
			id: "studentMonitoring",
			label: "Monitoring Mahasiswa",
			desc: "Pemantauan rutin mahasiswa berjalan",
			checked: localChecks.studentMonitoring,
		},
		{
			id: "parentFollowUp",
			label: "Follow Up Orang Tua",
			desc: "Komunikasi & update progress ke orang tua",
			checked: localChecks.parentFollowUp,
		},
		{
			id: "practiceAttendance",
			label: "Update Kehadiran Praktik",
			desc: "Kehadiran praktik harian terdokumentasi",
			checked: localChecks.practiceAttendance,
		},
		{
			id: "odsDocumentation",
			label: "Dokumentasi ODS",
			desc: "Foto/video dokumentasi ODS tersedia",
			checked: localChecks.odsDocumentation,
		},
	];

	const completedCount = checklist.filter((item) => item.checked).length;
	let statusBadge = (
		<Badge className="bg-rose-50 text-rose-600 border-rose-200">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (completedCount === 5) {
		statusBadge = (
			<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
				🟢 AMAN
			</Badge>
		);
	} else if (completedCount >= 3) {
		statusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	const attTotal = Number(attendanceTotal) || 0;
	const attPresent = Number(attendancePresent) || 0;
	const attendancePercentage =
		attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-48 text-slate-400">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-6">
				<Card className="bg-white border-slate-200 shadow-sm">
					<CardHeader className="border-b border-slate-200 pb-4">
						<div className="flex justify-between items-center">
							<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
								<span className="text-xl">📞</span> CRM — Customer Relationship
								Management
								<span className="ml-2 text-sm font-normal text-slate-500">
									[{completedCount}/5]
								</span>
							</CardTitle>
							<div className="flex items-center gap-3">
								{isSuperadmin && !isCrmAdmin && (
									<Badge
										variant="outline"
										className="text-slate-400 border-slate-300"
									>
										👁 Mode Lihat Saja
									</Badge>
								)}
								<Badge
									variant="outline"
									className="border-slate-200 text-slate-500 bg-white"
								>
									Dikelola oleh: Admin CRM
								</Badge>
								{statusBadge}
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="mb-6">
							<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
								STATUS ODS & MONITORING
							</h3>
							<div className="space-y-3">
								{checklist.map((item) => (
									<div
										key={item.id}
										className="flex flex-col rounded-lg border bg-white overflow-hidden border-slate-200 mb-3"
									>
										<div
											className={`flex items-center gap-4 p-4 transition-colors ${
												item.checked
													? "bg-emerald-50 border-b border-emerald-200"
													: "bg-slate-50 border-b border-slate-200"
											}`}
										>
											<Checkbox
												id={item.id}
												checked={item.checked}
												onCheckedChange={(c) =>
													handleCheckboxChange(item.id, c === true)
												}
												disabled={!canEdit || loadingItem === item.id}
												className={`w-6 h-6 rounded-md ${
													item.checked
														? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
														: ""
												}`}
											/>
											<label
												htmlFor={item.id}
												className="flex-1 cursor-pointer block"
											>
												<div
													className={`text-base font-semibold block ${
														item.checked ? "text-emerald-900" : "text-slate-700"
													}`}
												>
													{item.label}
													{loadingItem === item.id && (
														<Loader2 className="w-3 h-3 text-emerald-600 animate-spin ml-2 inline" />
													)}
												</div>
												<p
													className={`text-sm mt-1 ${
														item.checked ? "text-emerald-700" : "text-slate-500"
													}`}
												>
													{item.desc}
												</p>
											</label>
											<div>
												{item.checked ? (
													<CheckCircle className="w-6 h-6 text-emerald-500" />
												) : (
													<div className="w-6 h-6 rounded-full border-2 border-slate-300" />
												)}
											</div>
										</div>

										{/* Sub-component for Kehadiran Praktik */}
										{item.id === "practiceAttendance" && item.checked && (
											<div className="p-4 bg-white border-b border-slate-100">
												<div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
													<div>
														<label className="text-xs font-semibold text-slate-500 mb-1 block">
															Hadir
														</label>
														<Input
															type="number"
															value={attendancePresent}
															onChange={(e) =>
																setAttendancePresent(
																	e.target.value === ""
																		? ""
																		: Number(e.target.value),
																)
															}
															disabled={!canEdit}
															className="w-24 text-center font-bold text-slate-700"
														/>
													</div>
													<div className="text-slate-400 font-medium pb-2">
														dari
													</div>
													<div>
														<label className="text-xs font-semibold text-slate-500 mb-1 block">
															Total Hari
														</label>
														<Input
															type="number"
															value={attendanceTotal}
															onChange={(e) =>
																setAttendanceTotal(
																	e.target.value === ""
																		? ""
																		: Number(e.target.value),
																)
															}
															disabled={!canEdit}
															className="w-24 text-center font-bold text-slate-700"
														/>
													</div>
													{canEdit && (
														<Button
															variant="secondary"
															onClick={handleAttendanceSave}
															className="ml-auto text-blue-700 bg-blue-50 hover:bg-blue-100"
														>
															Simpan
														</Button>
													)}
												</div>
												<div className="flex items-center gap-3 mt-2">
													<span className="text-sm font-semibold text-slate-600 min-w-[100px]">
														Persentase: {attendancePercentage}%
													</span>
													<Progress
														value={attendancePercentage}
														className="h-2.5 bg-slate-100 flex-1"
														indicatorClassName="bg-blue-600"
													/>
												</div>
											</div>
										)}

										{/* Area Dokumen CRM */}
										<div className="p-4 bg-white border-t border-slate-100 last:border-0">
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
													Lampiran Dokumen CRM
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="crm"
												documentKey={item.id}
												canEdit={canEdit}
											/>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="mt-8 border-t border-slate-200 pt-6">
							<h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
								LOG KOMUNIKASI ORANG TUA
							</h3>

							{canEdit && !crm?.isAcc && (
								<div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
									<Textarea
										placeholder="Tambah catatan komunikasi..."
										value={logText}
										onChange={(e) => setLogText(e.target.value)}
										className="min-h-[80px] bg-white resize-none mb-3 border-slate-200 focus-visible:ring-blue-500"
									/>
									<div className="flex justify-end">
										<Button
											onClick={handleSaveLog}
											disabled={isSavingLog || !logText.trim()}
											className="bg-[#0517B0] hover:bg-blue-800 text-white"
										>
											{isSavingLog && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											+ Tambah Log
										</Button>
									</div>
								</div>
							)}

							<div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
								{logs.length === 0 ? (
									<p className="text-slate-500 text-sm italic">
										Belum ada log komunikasi.
									</p>
								) : (
									logs.map((log: any) => (
										<div key={log.id} className="relative">
											<div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-[3px] border-white ring-1 ring-slate-200" />
											<div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-2">
												<span>
													📅{" "}
													{new Date(log.createdAt).toLocaleString("id-ID", {
														dateStyle: "medium",
														timeStyle: "short",
													})}{" "}
													WIB
												</span>
											</div>
											<p className="text-slate-700 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
												"{log.logText}"
											</p>
											<div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
												<User className="w-3 h-3" />
												oleh:{" "}
												<span className="font-medium text-slate-600">
													{log.author?.fullName || "Admin CRM"}
												</span>
											</div>
										</div>
									))
								)}
								{!showAllLogs && logs.length >= 5 && (
									<button
										onClick={handleShowAllLogs}
										className="text-[#0517B0] text-sm mt-4 hover:underline font-medium relative -left-6 bg-white px-2"
									>
										Lihat Semua Log ↓
									</button>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Status ACC Card */}
				<Card className="bg-slate-50 border-slate-200 shadow-sm overflow-hidden">
					<CardContent className="p-0">
						<div className="flex flex-col sm:flex-row items-center justify-between p-6">
							<div className="flex flex-1 items-center gap-4 mb-4 sm:mb-0 w-full">
								{crm?.isAcc ? (
									<div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
										<div className="flex items-center gap-4">
											<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
												<CheckCircle className="w-6 h-6 text-emerald-600" />
											</div>
											<div>
												<h4 className="text-emerald-700 font-bold text-lg">
													✅ ACC CRM Diberikan
												</h4>
												<p className="text-sm text-slate-600">
													Oleh{" "}
													<span className="font-semibold">
														{crm?.accBy?.fullName || "Admin CRM"}
													</span>{" "}
													pada{" "}
													{new Date(crm.accAt).toLocaleString("id-ID", {
														dateStyle: "medium",
														timeStyle: "short",
													})}{" "}
													WIB
												</p>
											</div>
										</div>
										{isCrmAdmin && (
											<AlertDialog>
												<AlertDialogTrigger
													render={
														<Button
															variant="outline"
															className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
															disabled={isSavingLog}
														>
															{isSavingLog ? "Membatalkan..." : "Batalkan ACC"}
														</Button>
													}
												/>
												<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
													<AlertDialogTitle>
														Konfirmasi Pembatalan ACC CRM
													</AlertDialogTitle>
													<AlertDialogDescription className="text-slate-500">
														Apakah Anda yakin ingin membatalkan status ACC untuk
														panel CRM ini? Status mahasiswa akan kembali ke
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
												⏳ Menunggu ACC CRM
											</h4>
											<p className="text-sm text-slate-500">
												Belum ada persetujuan. Selesaikan semua checklist untuk
												memberikan ACC.
											</p>
										</div>
									</>
								)}
							</div>

							{isCrmAdmin && !crm?.isAcc && (
								<Tooltip>
									<TooltipTrigger render={<span className="inline-block" />}>
										<span>
											<AlertDialog>
												<AlertDialogTrigger
													disabled={completedCount < 5}
													className="w-full sm:w-auto bg-[#0517B0] hover:bg-blue-800 text-white font-bold px-8 py-2 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
												>
													✔ ACC CRM →
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogTitle>
														Konfirmasi ACC CRM
													</AlertDialogTitle>
													<AlertDialogDescription>
														Anda akan memberikan persetujuan final untuk tahap
														CRM mahasiswa ini. Tindakan ini akan dicatat beserta
														nama dan waktu persetujuan Anda. Pastikan semua data
														sudah valid.
													</AlertDialogDescription>
													<div className="flex justify-end gap-3 mt-4">
														<AlertDialogCancel className="border-slate-200">
															Batal
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={handleAcc}
															className="bg-[#0517B0] hover:bg-blue-800 text-white"
														>
															Ya, ACC Sekarang
														</AlertDialogAction>
													</div>
												</AlertDialogContent>
											</AlertDialog>
										</span>
									</TooltipTrigger>
									{completedCount < 5 && (
										<TooltipContent>
											Lengkapi semua {5 - completedCount} checklist terlebih
											dahulu
										</TooltipContent>
									)}
								</Tooltip>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</TooltipProvider>
	);
}
