"use client";

import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Eye,
	GraduationCap,
	Loader2,
	Trash2,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TabMataKuliah } from "@/components/panels/kehadiran/detail/TabMataKuliah";
import { AccPanelStatusCard } from "@/components/ui/AccPanelStatusCard";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PanelHeader } from "@/components/ui/PanelHeader";
import { PanelStatusBadge } from "@/components/ui/PanelStatusBadge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api, getToken } from "@/lib/eden";
import { hasRole, useAuthStore } from "@/store";
import { formatDeviceDateTime } from "@/utils/format";
import type { AssessmentRecord } from "./akademik/assessment/AssessmentFormCard";
import { AssessmentFormCard } from "./akademik/assessment/AssessmentFormCard";
import { TabManajemenMahasiswa } from "./akademik/TabManajemenMahasiswa";

interface DocFile {
	id: number;
	name: string;
	url: string;
	type: string;
	isVerified: boolean;
	verifiedAt?: string | null;
	verifiedBy?: number | null;
	verifierName?: string | null;
}

interface AkademikPanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function AkademikPanel({ studentId, onUpdate }: AkademikPanelProps) {
	const { user, token } = useAuthStore();
	const isAkademikAdmin = hasRole(user, "akademik");
	const isSuperadmin = hasRole(user, "superadmin");
	const canEdit = isAkademikAdmin || isSuperadmin;

	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [acadState, setAcadState] = useState<any>(null);
	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("dokumen");
	const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);

	const [isDeleteDocOpen, setIsDeleteDocOpen] = useState(false);
	const [selectedDocToDelete, setSelectedDocToDelete] = useState<number | null>(
		null,
	);
	const [isSavingNotes, setIsSavingNotes] = useState(false);

	const fetchAssessment = async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment`,
				{ headers: { Authorization: `Bearer ${getToken()}` } },
			);
			if (res.ok) {
				const json = await res.json();
				setAssessment(json.data?.assessment ?? null);
			}
		} catch (_) {}
	};

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

	const fetchDocuments = useCallback(async () => {
		try {
			const { data, error } =
				await api.students[studentId.toString()].academic.documents.get();
			if (!error && data?.success) {
				setDocuments(data.data as Record<string, DocFile[]>);
			}
		} catch (err) {
			console.error("Failed to fetch documents", err);
		}
	}, [studentId]);

	useEffect(() => {
		fetchAcademicData();
		fetchDocuments();
		fetchAssessment();
	}, [studentId, fetchDocuments]);

	// Status perhitungan sekarang berdasarkan acadState langsung

	const baseChecklist = [
		{
			id: "pddiktiInput",
			label: "Validasi Input PDDIKTI",
			desc: "Data akademik terdaftar di sistem PDDIKTI",
			checked: !!acadState?.pddiktiInput,
			auto: false,
			documentKey: "pddikti_input",
		},
		{
			id: "utsPassed",
			label: "Nilai UTS Lulus",
			desc: "Semua mata kuliah UTS memenuhi standar minimal",
			checked: !!acadState?.utsPassed,
			auto: false,
			documentKey: "uts_passed",
		},
		{
			id: "uasPassed",
			label: "Nilai UAS Lulus",
			desc: "Semua mata kuliah UAS memenuhi standar minimal",
			checked: !!acadState?.uasPassed,
			auto: false,
			documentKey: "uas_passed",
		},
		{
			id: "attitudeIndicator",
			label: "Indikator Sikap",
			desc: "Sikap dan etika dinilai baik oleh Dosen & PA",
			checked: !!acadState?.attitudeIndicator,
			auto: false,
			documentKey: "attitude_indicator",
		},
		{
			id: "assignmentsCompleted",
			label: "Penyelesaian Tugas",
			desc: "Tugas perkuliahan utama telah diselesaikan",
			checked: !!acadState?.assignmentsCompleted,
			auto: false,
			documentKey: "assignments_completed",
		},
		{
			id: "academicCommunication",
			label: "Komunikasi Akademik",
			desc: "Komunikasi mahasiswa dengan dosen/PA aktif",
			checked: !!acadState?.academicCommunication,
			auto: false,
			documentKey: "academic_communication",
		},
		{
			id: "assessmentCompleted",
			label: "Asesmen Pra-keberangkatan",
			desc: "Hasil asesmen kesiapan keberangkatan",
			checked: !!acadState?.assessmentCompleted,
			auto: false,
			documentKey: "pre_departure_assessment",
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
				forceDisabled = !acadState?.taiwanLolChecked;
			if (doc.id === "taiwanSuhhanChecked")
				forceDisabled = !acadState?.taiwanLoaChecked;

			checklist.push({
				id: doc.id,
				label: `[Taiwan] ${doc.label}`,
				desc:
					"Syarat wajib dokumen kohort Taiwan" +
					(forceDisabled ? " (Terkunci)" : ""),
				checked: acadState?.[doc.id] || false,
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
			TIDAK AMAN
		</Badge>
	);
	if (isReadyForProcess) {
		statusBadge = (
			<Badge className="bg-emerald-50 text-emerald-600 border-emerald-200">
				AMAN
			</Badge>
		);
	} else if (completedCount >= Math.floor(checklist.length / 2)) {
		statusBadge = (
			<Badge className="bg-amber-50 text-amber-600 border-amber-200">
				PERLU PERHATIAN
			</Badge>
		);
	}

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

	const confirmDeleteDocument = (docId: number) => {
		if (!canEdit) return;
		setSelectedDocToDelete(docId);
		setIsDeleteDocOpen(true);
	};

	const handleDeleteDocument = async () => {
		if (!canEdit || !selectedDocToDelete) return;
		try {
			const { error } =
				await api.students[studentId.toString()].academic.documents[
					selectedDocToDelete.toString()
				].delete();
			if (!error) {
				toast.success("Dokumen dihapus");
				setIsDeleteDocOpen(false);
				setSelectedDocToDelete(null);
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
				<PanelHeader
					icon={<GraduationCap className="w-5 h-5 text-[#0517B0]" />}
					title="Akademik — Kepatuhan Akademik"
					subtitle="Dikelola oleh: Admin Akademik"
					progressTag={
						<span className="text-xs font-bold text-slate-700 bg-slate-200/70 px-2.5 py-0.5 rounded-full border border-slate-300/40">
							Progres: {completedCount}/{checklist.length}
						</span>
					}
					actions={
						isSuperadmin && !isAkademikAdmin ? (
							<Badge
								variant="outline"
								className="text-slate-400 border-slate-300"
							>
								Mode Lihat Saja
							</Badge>
						) : undefined
					}
					badge={
						<PanelStatusBadge
							isAcc={acadState?.isAcc}
							completed={completedCount}
							total={checklist.length}
							size="lg"
						/>
					}
				/>

				{/* TABS NAVIGATION */}
				<div className="flex space-x-2 border-b border-slate-200 mb-6">
					<button
						onClick={() => setActiveTab("dokumen")}
						className={`px-4 py-2 font-medium text-sm ${activeTab === "dokumen" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Manajemen Mahasiswa
					</button>
					<button
						onClick={() => setActiveTab("penilaian")}
						className={`px-4 py-2 font-medium text-sm ${activeTab === "penilaian" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Penilaian Vokasi & Dosen
					</button>

					<button
						onClick={() => setActiveTab("assessment")}
						className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${activeTab === "assessment" ? "border-b-2 border-[#0517B0] text-[#0517B0]" : "text-slate-500 hover:text-slate-700"}`}
					>
						Assessment Pra-keberangkatan
					</button>
				</div>

				{activeTab === "dokumen" && (
					<div className="space-y-6">
						<TabManajemenMahasiswa
							studentId={studentId}
							canEdit={canEdit}
							acadState={acadState}
							onRefresh={fetchAcademicData}
						/>
					</div>
				)}

				{activeTab === "penilaian" && (
					<div className="mt-2">
						<h3 className="text-xl font-bold text-slate-800 mb-4 px-1 border-l-4 border-[#0517B0] pl-3">
							Rekap Nilai & Kehadiran Mata Kuliah
						</h3>
						<TabMataKuliah studentId={studentId} />
					</div>
				)}

				{activeTab === "assessment" && (
					<div className="mt-2 space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#0517B0] pl-3">
								Assessment Pra-keberangkatan
							</h3>
						</div>
						<AssessmentFormCard
							studentId={studentId}
							assessment={assessment}
							canEdit={canEdit}
							token={token}
							onRefresh={async () => {
								try {
									const res = await fetch(
										`${API_URL}/students/${studentId}/departure-assessment`,
										{ headers: { Authorization: `Bearer ${getToken()}` } },
									);
									if (res.ok) {
										const json = await res.json();
										setAssessment(json.data?.assessment ?? null);
									}
								} catch (_) {}
							}}
						/>
					</div>
				)}

				{/* Status ACC Card (Persistent across all tabs) */}
				<AccPanelStatusCard
					isAcc={Boolean(acadState?.isAcc)}
					accByUser={acadState?.accBy?.fullName || "Admin Akademik"}
					accAt={acadState?.accAt}
					isReadyForAcc={isReadyForProcess}
					title="ACC Akademik"
					pendingTitle={
						isReadyForProcess
							? "Menunggu ACC Akademik"
							: `Menunggu ACC Akademik (${checklist.length - completedCount} item belum selesai)`
					}
					pendingDescription="Diharapkan semua persyaratan akademik dan kelengkapan nilai/absensi terpenuhi sebelum memberikan ACC."
					readyDescription="Seluruh persyaratan akademik telah valid dan tuntas. Anda dapat memberikan persetujuan ACC resmi sekarang."
					canEdit={canEdit}
					isSaving={isSavingNotes}
					onAcc={handleAcc}
					onCancelAcc={handleCancelAcc}
					cancelDialogTitle="Konfirmasi Pembatalan ACC Akademik"
					cancelDialogDescription="Apakah Anda yakin ingin membatalkan status ACC untuk panel Akademik ini? Status mahasiswa akan kembali ke tahap proses."
					disabledReason="Selesaikan semua persyaratan akademik terlebih dahulu sebelum ACC"
				/>
			</div>

			<Dialog open={isDeleteDocOpen} onOpenChange={setIsDeleteDocOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Konfirmasi Hapus</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<p className="text-slate-600">
							Apakah Anda yakin ingin menghapus dokumen ini?
						</p>
						<div className="flex justify-end gap-3 pt-4">
							<Button
								variant="outline"
								onClick={() => setIsDeleteDocOpen(false)}
							>
								Batal
							</Button>
							<Button variant="destructive" onClick={handleDeleteDocument}>
								Hapus Dokumen
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
