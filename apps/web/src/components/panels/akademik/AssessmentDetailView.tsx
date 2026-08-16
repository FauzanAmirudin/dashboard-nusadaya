"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	CalendarDays,
	Download,
	GraduationCap,
	Hash,
	Loader2,
	User,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssessmentFormCard } from "@/components/panels/akademik/assessment/AssessmentFormCard";
import type { AssessmentRecord } from "@/components/panels/akademik/assessment/AssessmentFormCard";
import { API_URL, getToken } from "@/lib/eden";
import { useAuthStore } from "@/store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudentInfo {
	id: number;
	name: string;
	nim: string | null;
	program: string;
	subProgram: string | null;
	cohort: number;
	academicYear: string | null;
	period: string | null;
	phone: string | null;
	email: string | null;
}

interface AssessmentDetailViewProps {
	studentId: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type AssessmentStatus = AssessmentRecord["status"];

const STATUS_CONFIG: Record<
	AssessmentStatus,
	{ label: string; className: string }
> = {
	belum_dimulai: {
		label: "Belum Dimulai",
		className: "bg-slate-100 text-slate-600 border-slate-200",
	},
	nilai_diisi: {
		label: "Nilai Diisi",
		className: "bg-amber-100 text-amber-700 border-amber-200",
	},
	pdf_diunggah: {
		label: "PDF Diunggah",
		className: "bg-blue-100 text-blue-700 border-blue-200",
	},
	selesai: {
		label: "Selesai",
		className: "bg-emerald-100 text-emerald-700 border-emerald-200",
	},
};

function formatDateTime(dateStr: string | null): string {
	if (!dateStr) return "-";
	try {
		return new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(dateStr));
	} catch {
		return dateStr;
	}
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.slice(0, 2)
		.map((n) => n[0])
		.join("")
		.toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AssessmentDetailView({ studentId }: AssessmentDetailViewProps) {
	const router = useRouter();
	const { user, token } = useAuthStore();
	const canEdit = user?.role === "akademik" || user?.role === "superadmin";
	const printRef = useRef<HTMLDivElement>(null);

	const [isLoading, setIsLoading] = useState(true);
	const [student, setStudent] = useState<StudentInfo | null>(null);
	const [assessment, setAssessment] = useState<AssessmentRecord | null>(null);
	const [isExportingPdf, setIsExportingPdf] = useState(false);

	// ── Data Fetch ────────────────────────────────────────────────────────────

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/departure-assessment`,
				{ headers: { Authorization: `Bearer ${getToken()}` } },
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			setStudent(json.data?.student ?? null);
			setAssessment(json.data?.assessment ?? null);
		} catch (err) {
			console.error("Assessment detail fetch error:", err);
			toast.error("Gagal memuat data assessment");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	// ── Export PDF ────────────────────────────────────────────────────────────

	const handleExportPdf = async () => {
		if (!printRef.current || !student) return;
		setIsExportingPdf(true);
		try {
			const { toCanvas } = await import("html-to-image");
			const { default: JsPDF } = await import("jspdf");
			const canvas = await toCanvas(printRef.current, {
				backgroundColor: "#ffffff",
			});
			const imgData = canvas.toDataURL("image/png");
			const pageWidth = 210;
			const imgHeight = (canvas.height * pageWidth) / canvas.width;
			const a4Height = 297;
			const pdf = new JsPDF({
				orientation: "portrait",
				unit: "mm",
				format: "a4",
			});
			if (imgHeight <= a4Height) {
				pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
			} else {
				let yOffset = 0;
				while (yOffset < imgHeight) {
					if (yOffset > 0) pdf.addPage();
					pdf.addImage(imgData, "PNG", 0, -yOffset, pageWidth, imgHeight);
					yOffset += a4Height;
				}
			}
			pdf.save(`Assessment_${student.name}_${student.nim ?? "no-nim"}.pdf`);
		} catch (err) {
			console.error("Export PDF error:", err);
			toast.error("Gagal mengekspor PDF");
		} finally {
			setIsExportingPdf(false);
		}
	};

	// ── Loading / Empty ───────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-24">
				<Loader2
					className="w-8 h-8 animate-spin"
					style={{ color: "#0517B0" }}
				/>
			</div>
		);
	}

	if (!student) {
		return (
			<div className="text-center py-24 text-slate-500">
				Data mahasiswa tidak ditemukan.
			</div>
		);
	}

	const currentStatus: AssessmentStatus = assessment?.status ?? "belum_dimulai";
	const statusCfg = STATUS_CONFIG[currentStatus];

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6 pb-12">
			{/* ── Page Header ─────────────────────────────────────────────── */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						className="border-slate-200 text-slate-600 hover:bg-slate-50"
						onClick={() => router.push("/dashboard/akademik/assessment")}
					>
						<ArrowLeft className="w-4 h-4 mr-1.5" />
						Kembali
					</Button>
					<div>
						<h1 className="text-xl font-bold text-slate-900 leading-none">
							Detail Assessment
						</h1>
						<p className="text-xs text-slate-500 mt-0.5">
							Pra-keberangkatan
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Badge className={`${statusCfg.className} border text-xs px-2.5 py-1`}>
						{statusCfg.label}
					</Badge>
					<Button
						variant="outline"
						size="sm"
						className="border-slate-200 text-slate-600 hover:bg-slate-50"
						onClick={handleExportPdf}
						disabled={isExportingPdf}
					>
						{isExportingPdf ? (
							<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
						) : (
<Download className="w-4 h-4 mr-1.5" />
						)}
						Export PDF
					</Button>
				</div>
			</div>

			{/* ── Printable Area ───────────────────────────────────────────── */}
			<div ref={printRef} className="space-y-5">
				{/* Student Profile Card */}
				<Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
					<CardContent className="p-0">
						{/* Blue accent bar */}
						<div
							className="h-1.5 w-full"
							style={{ backgroundColor: "#0517B0" }}
						/>
						<div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
							{/* Avatar */}
							<div
								className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
								style={{ backgroundColor: "#0517B0" }}
							>
								{getInitials(student.name)}
							</div>

							{/* Info grid */}
							<div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
								<div className="flex items-start gap-2">
									<User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
									<div className="min-w-0">
										<p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
											Nama
										</p>
										<p className="text-sm font-semibold text-slate-800 truncate">
											{student.name}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-2">
									<Hash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
									<div>
										<p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
											NIM
										</p>
										<p className="text-sm font-medium text-slate-700">
											{student.nim ?? "-"}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-2">
									<GraduationCap className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
									<div className="min-w-0">
										<p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
											Program
										</p>
										<p className="text-sm text-slate-700 truncate">
											{student.program}
											{student.subProgram && (
												<span className="text-slate-500">
													{" "}
													/ {student.subProgram}
												</span>
											)}
										</p>
									</div>
								</div>
								<div className="flex items-start gap-2">
									<CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
									<div>
										<p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
											Angkatan
										</p>
										<p className="text-sm text-slate-700">
											{student.cohort}
											{student.academicYear && (
												<span className="text-slate-500">
													{" "}
													/ {student.academicYear}
												</span>
											)}
										</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Assessment Form — score + PDF + notes */}
				<AssessmentFormCard
					studentId={studentId}
					assessment={assessment}
					canEdit={canEdit}
					token={token}
					onRefresh={fetchData}
				/>

				{/* Audit Info */}
				{assessment && (
					<div className="flex flex-wrap gap-x-8 gap-y-2 px-1 text-xs text-slate-500">
						<span>
							<span className="font-medium text-slate-600">Dinilai oleh:</span>{" "}
							{assessment.assessedByUser?.fullName ??
								assessment.assessedByUser?.username ??
								"-"}
						</span>
						<span>
							<span className="font-medium text-slate-600">
								Waktu penilaian:
							</span>{" "}
							{formatDateTime(assessment.assessedAt)}
						</span>
						<span>
							<span className="font-medium text-slate-600">Diperbarui:</span>{" "}
							{formatDateTime(assessment.updatedAt)}
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
