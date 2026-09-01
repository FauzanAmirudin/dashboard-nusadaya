"use client";

import {
	Activity,
	AlertCircle,
	ArrowLeft,
	Award,
	BookOpen,
	CheckCircle,
	CheckCircle2,
	Clock,
	ExternalLink,
	FileText,
	GraduationCap,
	Layers,
	MapPin,
	Percent,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	UserCheck,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function AcademicPanelMahasiswa() {
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [mounted, setMounted] = useState(false);
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setMounted(true);
		if (hasHydrated && isAuthenticated && user?.role === "mahasiswa") {
			fetchData();
		}
	}, [user, hasHydrated, isAuthenticated]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const res = await api.mahasiswa.panel.akademik.get();
			if (res.data?.success) {
				setData(res.data.data);
			}
		} catch (err) {
			console.error("Gagal memuat data Akademik:", err);
		} finally {
			setLoading(false);
		}
	};

	if (!mounted) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[50vh]">
				<RefreshCw className="w-8 h-8 text-[#0517B0] animate-spin" />
			</div>
		);
	}

	const formatDate = (dateString: string | null | undefined) => {
		if (!dateString) return "-";
		return new Date(dateString).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	const renderChecklistItem = (label: string, isChecked: boolean) => (
		<div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl transition-colors hover:bg-slate-100/60">
			<span className="font-medium text-slate-700 flex items-center gap-2.5 text-sm">
				<ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
				{label}
			</span>
			{isChecked ? (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="text-slate-400 bg-white border-slate-200 text-xs"
				>
					<Clock className="w-3 h-3 mr-1" /> Belum
				</Badge>
			)}
		</div>
	);

	const completedCount = [
		data?.pddiktiInput,
		data?.utsPassed,
		data?.uasPassed,
		data?.assignmentsCompleted,
		data?.attitudeIndicator,
		data?.academicCommunication,
	].filter(Boolean).length;
	const checklistPercentage = (completedCount / 6) * 100;

	const present = data?.attendancePresent || 0;
	const total = data?.attendanceTotal || 0;
	const attendancePercent = total > 0 ? (present / total) * 100 : 0;

	// Kehadiran Tambahan
	const piketPresent = data?.attendancePiketPresent || 0;
	const piketTotal = data?.attendancePiketTotal || 0;
	const piketPercent = piketTotal > 0 ? (piketPresent / piketTotal) * 100 : 0;

	const odsPresent = data?.attendanceOdsPresent || 0;
	const odsTotal = data?.attendanceOdsTotal || 0;
	const odsPercent = odsTotal > 0 ? (odsPresent / odsTotal) * 100 : 0;

	const pramagangPresent = data?.attendancePramagangPresent || 0;
	const pramagangTotal = data?.attendancePramagangTotal || 0;
	const pramagangPercent =
		pramagangTotal > 0 ? (pramagangPresent / pramagangTotal) * 100 : 0;

	return (
		<div className="max-w-4xl mx-auto space-y-6 pb-12">
			<Link
				href="/mahasiswa/dashboard"
				className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard
			</Link>

			<Card className="border-slate-200/90 shadow-sm overflow-hidden rounded-2xl">
				<div className="h-2 w-full bg-[#0517B0]"></div>
				<CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
						<div>
							<CardTitle className="text-2xl text-slate-900 flex items-center gap-2 font-bold tracking-tight">
								Panel Akademik
							</CardTitle>
							<CardDescription className="mt-1 text-sm text-slate-500">
								Indeks Prestasi, Nilai Mata Kuliah Vokasi, Syarat Kelulusan &
								Assessment
							</CardDescription>
						</div>
						{data?.isAcc ? (
							<div className="flex flex-col items-end gap-1">
								<Badge className="bg-emerald-500 text-white px-3.5 py-1.5 text-sm rounded-full shadow-sm font-semibold">
									<CheckCircle className="w-4 h-4 mr-1.5" /> Telah di-ACC
									Akademik
								</Badge>
								{data?.accAt && (
									<span className="text-[11px] text-slate-500 font-medium">
										Disetujui: {formatDate(data.accAt)}
									</span>
								)}
							</div>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 px-3.5 py-1.5 text-sm rounded-full bg-white border-slate-200 font-medium"
							>
								<Clock className="w-4 h-4 mr-1.5 text-amber-500" /> Dalam Proses
							</Badge>
						)}
					</div>
				</CardHeader>
				<CardContent className="p-6 sm:p-8 space-y-8">
					{/* Section 1: Ringkasan Metrik Akademik */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-between items-center text-center">
							<p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
								Indeks Prestasi Kumulatif (IPK)
							</p>
							<div className="text-3xl sm:text-4xl font-extrabold text-indigo-950 font-mono mb-2">
								{(data?.gpa / 100 || 0).toFixed(2)}
							</div>
							<Progress
								value={(data?.gpa / 400) * 100}
								className="h-2 w-full bg-indigo-200/50 rounded-full"
							/>
							<p className="text-[11px] text-indigo-600 mt-2 font-medium">
								Skala 4.00
							</p>
						</div>

						<div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col justify-between items-center text-center">
							<p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
								Total SKS Diselesaikan
							</p>
							<div className="text-3xl sm:text-4xl font-extrabold text-blue-950 font-mono mb-2">
								{data?.creditsCompleted || 0}
							</div>
							<p className="text-xs text-blue-700 font-medium mt-auto">
								SKS Telah Diakui
							</p>
						</div>

						<div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex flex-col justify-between items-center text-center">
							<p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
								Kehadiran Perkuliahan Utama
							</p>
							<div className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-mono mb-2">
								{Math.round(attendancePercent)}%
							</div>
							<p className="text-xs text-emerald-700 font-medium mt-auto">
								{present} dari {total} total pertemuan
							</p>
						</div>
					</div>

					{/* Section Tambahan: Kehadiran Piket, ODS, Pra-Magang */}
					{(piketTotal > 0 || odsTotal > 0 || pramagangTotal > 0) && (
						<div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
							<h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
								<Activity className="w-4 h-4 text-indigo-600" />
								Kehadiran Program Khusus & Pembiasaan
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div className="p-3.5 bg-white rounded-xl border border-slate-100 space-y-1.5">
									<div className="flex justify-between items-center text-xs">
										<span className="font-semibold text-slate-700">
											Piket Kampus
										</span>
										<span className="font-bold text-indigo-700 font-mono">
											{piketPresent}/{piketTotal} ({Math.round(piketPercent)}%)
										</span>
									</div>
									<Progress
										value={piketPercent}
										className="h-1.5 bg-slate-100 rounded-full"
									/>
								</div>
								<div className="p-3.5 bg-white rounded-xl border border-slate-100 space-y-1.5">
									<div className="flex justify-between items-center text-xs">
										<span className="font-semibold text-slate-700">
											Praktik ODS
										</span>
										<span className="font-bold text-emerald-700 font-mono">
											{odsPresent}/{odsTotal} ({Math.round(odsPercent)}%)
										</span>
									</div>
									<Progress
										value={odsPercent}
										className="h-1.5 bg-slate-100 rounded-full"
									/>
								</div>
								<div className="p-3.5 bg-white rounded-xl border border-slate-100 space-y-1.5">
									<div className="flex justify-between items-center text-xs">
										<span className="font-semibold text-slate-700">
											Pra-Magang
										</span>
										<span className="font-bold text-blue-700 font-mono">
											{pramagangPresent}/{pramagangTotal} (
											{Math.round(pramagangPercent)}%)
										</span>
									</div>
									<Progress
										value={pramagangPercent}
										className="h-1.5 bg-slate-100 rounded-full"
									/>
								</div>
							</div>
						</div>
					)}

					{data?.attendanceAlphaNote && (
						<div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
							<span className="font-semibold text-slate-800">
								Catatan Ketidakhadiran dari BAAK:
							</span>{" "}
							{data.attendanceAlphaNote}
						</div>
					)}

					{/* Section 2: Checklist Akademik Dasar */}
					<div>
						<div className="flex justify-between items-end mb-3">
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
								<BookOpen className="w-4 h-4 text-[#0517B0]" />
								Checklist Evaluasi Akademik Dasar
							</h3>
							<span className="text-base font-extrabold text-[#0517B0]">
								{Math.round(checklistPercentage)}%
							</span>
						</div>
						<Progress
							value={checklistPercentage}
							className="h-3 bg-slate-100 mb-4 rounded-full"
						/>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{renderChecklistItem("Terdaftar PDDIKTI", data?.pddiktiInput)}
							{renderChecklistItem("Lulus Evaluasi UTS", data?.utsPassed)}
							{renderChecklistItem("Lulus Evaluasi UAS", data?.uasPassed)}
							{renderChecklistItem(
								"Tugas Perkuliahan Selesai Semua",
								data?.assignmentsCompleted,
							)}
							{renderChecklistItem(
								"Indikator Sikap & Etika Baik",
								data?.attitudeIndicator,
							)}
							{renderChecklistItem(
								"Komunikasi Akademik Lancar",
								data?.academicCommunication,
							)}
						</div>
					</div>

					{/* Section 3: Tabel Nilai Mata Kuliah */}
					<div className="pt-6 border-t border-slate-100 space-y-4">
						<div className="flex items-center gap-2">
							<GraduationCap className="w-5 h-5 text-indigo-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Transkrip Nilai Mata Kuliah & Praktik
							</h3>
						</div>

						{data?.grades && data.grades.length > 0 ? (
							<div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
								<Table>
									<TableHeader className="bg-slate-50/80">
										<TableRow>
											<TableHead className="w-20 text-xs font-bold uppercase">
												Kode
											</TableHead>
											<TableHead className="text-xs font-bold uppercase">
												Mata Kuliah
											</TableHead>
											<TableHead className="text-center text-xs font-bold uppercase w-16">
												Grade
											</TableHead>
											<TableHead className="text-center text-xs font-bold uppercase w-20">
												Praktik
											</TableHead>
											<TableHead className="text-center text-xs font-bold uppercase w-20">
												Teori
											</TableHead>
											<TableHead className="text-center text-xs font-bold uppercase w-20">
												KWU
											</TableHead>
											<TableHead className="text-center text-xs font-bold uppercase w-24">
												Status
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.grades.map((g: any) => (
											<TableRow key={g.id} className="hover:bg-slate-50/60">
												<TableCell className="font-mono text-xs text-slate-500 font-semibold">
													{g.courseCode}
												</TableCell>
												<TableCell className="text-xs">
													<p className="font-semibold text-slate-800">
														{g.courseName}
													</p>
													{g.attitudeNote && (
														<p className="text-[11px] text-slate-500 mt-0.5 italic">
															Catatan: {g.attitudeNote}
														</p>
													)}
												</TableCell>
												<TableCell className="text-center font-bold text-xs">
													<span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
														{g.grade || "-"}
													</span>
												</TableCell>
												<TableCell className="text-center font-mono text-xs text-slate-700">
													{g.practicalScore ?? "-"}
												</TableCell>
												<TableCell className="text-center font-mono text-xs text-slate-700">
													{g.theoryScore ?? "-"}
												</TableCell>
												<TableCell className="text-center font-mono text-xs text-slate-700">
													{g.kwuScore ?? g.entrepreneurScore ?? "-"}
												</TableCell>
												<TableCell className="text-center">
													{g.isAcc ? (
														<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
															Lulus
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="text-slate-500 text-[10px]"
														>
															Proses
														</Badge>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
								Belum ada rincian nilai mata kuliah yang diinput.
							</div>
						)}
					</div>

					{/* Section 4: Assessment Pra-Keberangkatan */}
					{data?.assessment && (
						<div className="pt-6 border-t border-slate-100 space-y-3">
							<div className="flex items-center gap-2">
								<Award className="w-5 h-5 text-amber-600" />
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
									Hasil Assessment Pra-Keberangkatan
								</h3>
							</div>

							<div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/70 space-y-3">
								<div className="flex justify-between items-center">
									<div>
										<span className="text-xs text-amber-800 font-semibold uppercase tracking-wider block">
											Skor Evaluasi Terpadu
										</span>
										<p className="text-2xl font-extrabold text-amber-950 font-mono mt-0.5">
											{data.assessment.score ?? "Dalam Penilaian"}
											{data.assessment.score ? " / 100" : ""}
										</p>
									</div>
									<Badge className="bg-amber-100 text-amber-900 border-0 text-xs uppercase font-bold">
										Status: {data.assessment.status || "Belum Dimulai"}
									</Badge>
								</div>
								{data.assessment.notes && (
									<p className="text-xs text-amber-900 leading-relaxed pt-2 border-t border-amber-200/50">
										<span className="font-semibold">
											Catatan Tim Evaluator:
										</span>{" "}
										{data.assessment.notes}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Section 5: Berkas Khusus Taiwan (Jika Taiwan) */}
					{data?.taiwanCohort && (
						<div className="pt-6 border-t border-slate-100 space-y-4">
							<div className="flex items-center gap-2">
								<MapPin className="w-5 h-5 text-rose-600" />
								<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
									Kelengkapan Persyaratan Keberangkatan Taiwan
								</h3>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{renderChecklistItem(
									"Pas Foto 4x6 (2 Lembar)",
									data?.taiwanPasFotoChecked,
								)}
								{renderChecklistItem(
									"Formulir Pendaftaran & CV",
									data?.taiwanCvChecked,
								)}
								{renderChecklistItem("Fotokopi KTM", data?.taiwanKtmChecked)}
								{renderChecklistItem("Fotokopi KHS", data?.taiwanKhsChecked)}
								{renderChecklistItem(
									"Bukti Lulus SL21",
									data?.taiwanSl21Checked,
								)}
								{renderChecklistItem(
									"Surat Aktif Kuliah",
									data?.taiwanAktifChecked,
								)}
								{renderChecklistItem(
									"Screenshot PDDIKTI Aktif",
									data?.taiwanPddiktiChecked,
								)}
								{renderChecklistItem("Surat LoL", data?.taiwanLolChecked)}
								{renderChecklistItem("Surat LoA Resmi", data?.taiwanLoaChecked)}
								{renderChecklistItem(
									"Surat Kuasa Suhhan",
									data?.taiwanSuhhanChecked,
								)}
							</div>
						</div>
					)}

					{/* Section 6: Dokumen Akademik */}
					<div className="pt-6 border-t border-slate-100">
						<div className="flex items-center gap-2 mb-4">
							<ShieldCheck className="w-5 h-5 text-emerald-600" />
							<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
								Dokumen & Berkas Akademik
							</h3>
						</div>
						{data?.documents && data.documents.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{data.documents.map((doc: any, i: number) => (
									<div
										key={i}
										className="flex items-center justify-between p-3.5 border border-slate-200/80 rounded-xl bg-white shadow-xs"
									>
										<div className="flex items-center gap-3 overflow-hidden">
											<FileText className="w-5 h-5 text-slate-400 shrink-0" />
											<div className="truncate">
												<p className="text-sm font-semibold text-slate-700 truncate">
													{doc.documentKey.replace(/_/g, " ").toUpperCase()}
												</p>
												<p className="text-xs text-slate-500 truncate">
													{doc.fileName}
												</p>
											</div>
										</div>
										<div className="shrink-0 ml-2 flex items-center gap-1.5">
											{doc.isVerified ? (
												<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-2 py-0.5 text-[10px] border-0">
													Terverifikasi
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="text-slate-500 px-2 py-0.5 text-[10px] bg-white"
												>
													Menunggu
												</Badge>
											)}
											{doc.fileUrl && (
												<a
													href={doc.fileUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
													title="Buka Dokumen"
												>
													<ExternalLink className="w-3.5 h-3.5" />
												</a>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
								<p className="text-sm text-slate-500">
									Belum ada dokumen akademik yang diunggah.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
