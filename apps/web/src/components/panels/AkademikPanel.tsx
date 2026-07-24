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
import { DosenPanel } from "@/components/panels/DosenPanel";
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
	const [activeTab, setActiveTab] = useState("dokumen");

	const [localChecks, setLocalChecks] = useState({
		pddiktiInput: false,
		utsPassed: false,
		uasPassed: false,
		attitudeIndicator: false,
		assignmentsCompleted: false,
		academicCommunication: false,
		taiwanPasFotoChecked: false,
		taiwanCvChecked: false,
		taiwanKtmChecked: false,
		taiwanKhsChecked: false,
		taiwanSl21Checked: false,
		taiwanAktifChecked: false,
		taiwanGapYearChecked: false,
		taiwanPddiktiChecked: false,
		taiwanPribadiChecked: false,
		taiwanLolChecked: false,
		taiwanLoaChecked: false,
		taiwanSuhhanChecked: false,
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
				taiwanPasFotoChecked: !!acadState.taiwanPasFotoChecked,
				taiwanCvChecked: !!acadState.taiwanCvChecked,
				taiwanKtmChecked: !!acadState.taiwanKtmChecked,
				taiwanKhsChecked: !!acadState.taiwanKhsChecked,
				taiwanSl21Checked: !!acadState.taiwanSl21Checked,
				taiwanAktifChecked: !!acadState.taiwanAktifChecked,
				taiwanGapYearChecked: !!acadState.taiwanGapYearChecked,
				taiwanPddiktiChecked: !!acadState.taiwanPddiktiChecked,
				taiwanPribadiChecked: !!acadState.taiwanPribadiChecked,
				taiwanLolChecked: !!acadState.taiwanLolChecked,
				taiwanLoaChecked: !!acadState.taiwanLoaChecked,
				taiwanSuhhanChecked: !!acadState.taiwanSuhhanChecked,
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

	const isAttendancePassed = attendancePercentage >= 90;

	const baseChecklist = [
		{
			id: "pddiktiInput",
			label: "Validasi Input PDDIKTI",
			desc: "Data akademik terdaftar di sistem PDDIKTI",
			checked: localChecks.pddiktiInput,
			auto: false,
			documentKey: "pddikti_input",
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

	const taiwanDocs = [
		{ id: "taiwanPasFotoChecked", label: "Pas Foto", key: "taiwan_pas_foto" },
		{ id: "taiwanCvChecked", label: "CV Akademik", key: "taiwan_cv" },
		{ id: "taiwanKtmChecked", label: "KTM", key: "taiwan_ktm" },
		{ id: "taiwanKhsChecked", label: "KHS", key: "taiwan_khs" },
		{
			id: "taiwanSl21Checked",
			label: "Statement Letter SL21",
			key: "taiwan_sl21",
		},
		{
			id: "taiwanAktifChecked",
			label: "Surat Mahasiswa Aktif",
			key: "taiwan_aktif",
		},
		{
			id: "taiwanGapYearChecked",
			label: "Surat Gap Year",
			key: "taiwan_gap_year",
		},
		{
			id: "taiwanPddiktiChecked",
			label: "NIM PD Dikti",
			key: "taiwan_pddikti",
		},
		{
			id: "taiwanPribadiChecked",
			label: "Dokumen Pribadi (KTP/KK)",
			key: "taiwan_pribadi",
		},
		{
			id: "taiwanLolChecked",
			label: "Letter of Offer (LoL)",
			key: "taiwan_lol",
		},
		{
			id: "taiwanLoaChecked",
			label: "Letter of Acceptance (LoA)",
			key: "taiwan_loa",
		},
		{
			id: "taiwanSuhhanChecked",
			label: "Dokumen Suhhan",
			key: "taiwan_suhhan",
		},
	];

	const checklist = [...baseChecklist];
	if (acadState?.taiwanCohort) {
		taiwanDocs.forEach((doc) => {
			let forceDisabled = false;
			if (doc.id === "taiwanLoaChecked")
				forceDisabled = !localChecks.taiwanLolChecked;
			if (doc.id === "taiwanSuhhanChecked")
				forceDisabled = !localChecks.taiwanLoaChecked;

			checklist.push({
				id: doc.id,
				label: `[Taiwan] ${doc.label}`,
				desc:
					"Syarat wajib dokumen kohort Taiwan" +
					(forceDisabled ? " (Terkunci)" : ""),
				checked: (localChecks as any)[doc.id] || false,
				auto: false,
				documentKey: doc.key,
				forceDisabled,
			} as any);
		});
	}

	const completedCount = checklist.filter((item) => item.checked).length;
	const isReadyForProcess = completedCount === checklist.length;

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
	} else if (completedCount >= Math.floor(checklist.length / 2)) {
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
			<div>
				<div className="border-b border-slate-200 pb-4 mb-6">
					<div className="flex justify-between items-center">
						<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
							<span className="text-xl">🎓</span> Akademik — Kepatuhan Akademik
							<span className="ml-2 text-sm font-normal text-slate-500">
								[{completedCount}/{checklist.length}]
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
				</div>

				{/* TABS NAVIGATION */}
				<div className="flex space-x-2 border-b border-slate-200 mb-6">
					<button
						onClick={() => setActiveTab("dokumen")}
						className={`px-4 py-2 font-medium text-sm ${activeTab === "dokumen" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Berkas & Kelayakan
					</button>
					<button
						onClick={() => setActiveTab("penilaian")}
						className={`px-4 py-2 font-medium text-sm ${activeTab === "penilaian" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Penilaian Vokasi & Dosen
					</button>
				</div>

				{activeTab === "dokumen" && (
					<div className="space-y-6">
						{/* CHECKLIST */}
						<div className="mb-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
							<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
									CHECKLIST AKADEMIK
								</h3>
							</div>
							<div className="p-5 space-y-4">
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
														!canEdit ||
														item.auto ||
														loadingItem === item.id ||
														(item as any).forceDisabled
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
															item.checked
																? "text-emerald-900"
																: "text-slate-700"
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
						<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
							<div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
									CATATAN AKADEMIK
								</h3>
							</div>
							<div className="p-5">
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
						</div>

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
																? new Date(acadState.accAt).toLocaleString(
																		"id-ID",
																		{
																			dateStyle: "medium",
																			timeStyle: "short",
																		},
																	)
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
																	{isSavingNotes
																		? "Membatalkan..."
																		: "Batalkan ACC"}
																</Button>
															}
														/>
														<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
															<AlertDialogTitle>
																Konfirmasi Pembatalan ACC Akademik
															</AlertDialogTitle>
															<AlertDialogDescription className="text-slate-500">
																Apakah Anda yakin ingin membatalkan status ACC
																untuk panel Akademik ini? Status mahasiswa akan
																kembali ke tahap proses.
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
															: `⏳ Menunggu ACC Akademik (${checklist.length - completedCount} item belum selesai)`}
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
											<TooltipTrigger
												render={<span className="inline-block" />}
											>
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
																	Anda akan memberikan persetujuan final untuk
																	status akademik mahasiswa ini. Pastikan semua
																	data absensi dan kelulusan valid.
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
				)}

				{activeTab === "penilaian" && (
					<div className="mt-2">
						<h3 className="text-xl font-bold text-slate-800 mb-4 px-1 border-l-4 border-[#0517B0] pl-3">
							Modul Vokasi & Penilaian Dosen
						</h3>
						<DosenPanel studentId={studentId} onUpdate={onUpdate} />
					</div>
				)}
			</div>
		</div>
	);
}
