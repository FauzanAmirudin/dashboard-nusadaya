"use client";

import { Loader2, Printer } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { API_URL, getToken } from "@/lib/eden";

interface CourseGradeItem {
	courseId: number;
	code: string;
	name: string;
	sks: number;
	type: "teori" | "praktik";
	dosenName?: string;
	attendancePresent: number;
	totalMeetings: number;
	attendanceRate: number;
	theoryScore: number | null;
	practicalScore: number | null;
	utsScore: number | null;
	uasScore: number | null;
	finalScore: number;
	grade: string;
	gradePoint: number;
	qualityScore: number;
	status: string;
	isPassed: boolean;
	isCustomEnrollment?: boolean;
	enrollmentNotes?: string | null;
}

interface AcademicSummaryData {
	studentId: number;
	nim: string;
	name: string;
	studentName?: string;
	cohort: number;
	semester: number;
	gpaDisplay: string;
	totalCourses: number;
	totalSksTaken: number;
	totalSksPassed: number;
	allUtsPassed: boolean;
	allUasPassed: boolean;
	utsStatus: string;
	uasStatus: string;
	evaluatedUtsCount: number;
	evaluatedUasCount: number;
	grades: CourseGradeItem[];
}

interface TabKhsTranskripProps {
	studentId: number;
}

export function TabKhsTranskrip({ studentId }: TabKhsTranskripProps) {
	const [selectedSemester, setSelectedSemester] = useState<number>(1);
	const [summaryData, setSummaryData] = useState<AcademicSummaryData | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);

	const fetchKhsData = useCallback(
		async (isSilent = false) => {
			if (!isSilent) setIsLoading(true);
			try {
				const res = await fetch(
					`${API_URL}/students/${studentId}/academic/khs?semester=${selectedSemester}&_t=${Date.now()}`,
					{
						headers: {
							Authorization: `Bearer ${getToken()}`,
							"Cache-Control": "no-cache",
							Pragma: "no-cache",
						},
						cache: "no-store",
					},
				);
				const json = await res.json();
				if (json.success && json.data) {
					setSummaryData(json.data as AcademicSummaryData);
				}
			} catch (err) {
				console.error("Gagal memuat KHS:", err);
				if (!isSilent) toast.error("Gagal mengambil data KHS mahasiswa");
			} finally {
				if (!isSilent) setIsLoading(false);
			}
		},
		[studentId, selectedSemester],
	);

	useEffect(() => {
		fetchKhsData();

		// Realtime cross-panel listener identik dengan Panel Akademik
		const handleSync = (e: Event) => {
			const customEvent = e as CustomEvent<{
				studentId?: number;
				studentIds?: number[];
			}>;
			const targetId = customEvent.detail?.studentId;
			const targetIds = customEvent.detail?.studentIds;
			if (
				(!targetId && !targetIds) ||
				targetId === studentId ||
				(Array.isArray(targetIds) && targetIds.includes(studentId))
			) {
				fetchKhsData(true);
			}
		};

		window.addEventListener("academic-data-updated", handleSync);
		window.addEventListener("student-updated", handleSync);
		window.addEventListener("course-updated", handleSync);
		window.addEventListener("course-attendance-updated", handleSync);

		let bc: BroadcastChannel | null = null;
		try {
			bc = new BroadcastChannel("dashboard-realtime-sync");
			bc.onmessage = (msg) => {
				const type = msg.data?.type;
				const targetStudentId = msg.data?.studentId;
				const targetStudentIds = msg.data?.studentIds;
				if (
					type === "academic-data-updated" ||
					type === "student-updated" ||
					type === "course-updated" ||
					type === "course-attendance-updated"
				) {
					if (
						(!targetStudentId && !targetStudentIds) ||
						targetStudentId === studentId ||
						(Array.isArray(targetStudentIds) &&
							targetStudentIds.includes(studentId))
					) {
						fetchKhsData(true);
					}
				}
			};
		} catch {}

		const handleFocus = () => {
			if (document.visibilityState === "visible") {
				fetchKhsData(true);
			}
		};
		document.addEventListener("visibilitychange", handleFocus);
		window.addEventListener("focus", handleFocus);

		return () => {
			window.removeEventListener("academic-data-updated", handleSync);
			window.removeEventListener("student-updated", handleSync);
			window.removeEventListener("course-updated", handleSync);
			window.removeEventListener("course-attendance-updated", handleSync);
			document.removeEventListener("visibilitychange", handleFocus);
			window.removeEventListener("focus", handleFocus);
			if (bc) bc.close();
		};
	}, [fetchKhsData, studentId]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-xl border border-slate-200">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-sm text-slate-500">
					Memuat rincian nilai perkuliahan & KHS mahasiswa...
				</p>
			</div>
		);
	}

	const grades = summaryData?.grades || [];
	const gpaDisplay = summaryData?.gpaDisplay || "0.00";
	const gpaNum = Number(gpaDisplay) || 0;
	const totalSksTaken = summaryData?.totalSksTaken || 0;
	const totalSksPassed = summaryData?.totalSksPassed || 0;

	const examStatus = (status?: string, count?: number, passed?: boolean) =>
		status === "BELUM_ADA_NILAI" || count === 0
			? { text: "Belum ada nilai", cls: "text-slate-500" }
			: passed
				? { text: "Lulus", cls: "text-emerald-700" }
				: { text: "Remedial", cls: "text-rose-700" };
	const uts = examStatus(
		summaryData?.utsStatus,
		summaryData?.evaluatedUtsCount,
		summaryData?.allUtsPassed,
	);
	const uas = examStatus(
		summaryData?.uasStatus,
		summaryData?.evaluatedUasCount,
		summaryData?.allUasPassed,
	);
	const isEligible = gpaNum >= 2.75;

	const tiles = [
		{
			label: "IPK Kumulatif",
			value: gpaDisplay,
			sub: "dari 4.00",
			tone: "text-[#0517B0]",
		},
		{
			label: "SKS Lulus",
			value: `${totalSksPassed}/${totalSksTaken}`,
			sub:
				totalSksPassed === totalSksTaken && totalSksTaken > 0
					? "Semua SKS terpenuhi"
					: `${totalSksTaken - totalSksPassed} SKS belum lulus`,
			tone: "text-slate-900",
		},
		{
			label: "Seleksi Magang",
			value: isEligible ? "Layak" : "Perlu evaluasi",
			sub: "Standar IPK ≥ 2.75",
			tone: isEligible ? "text-emerald-700" : "text-amber-700",
		},
	];

	const gradeTone = (grade: string) =>
		grade.startsWith("A")
			? "bg-emerald-50 text-emerald-800 border-emerald-200"
			: grade.startsWith("B")
				? "bg-blue-50 text-blue-800 border-blue-200"
				: grade.startsWith("C")
					? "bg-amber-50 text-amber-800 border-amber-200"
					: "bg-rose-50 text-rose-800 border-rose-200";
	const score = (v: number | null | undefined) =>
		v !== null && v !== undefined ? v : "–";

	return (
		<div className="space-y-6">
			{/* Ringkasan: status sinkron BAAK + tombol cetak */}
			<section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div className="min-w-0">
						<h3 className="text-sm sm:text-base font-bold text-slate-900">
							Nilai Akademik
						</h3>
						<p className="mt-0.5 text-xs text-slate-500">
							Nilai dari BAAK Akademik untuk seleksi wawancara industri. Berkas
							KHS, KRS & Transkrip diperiksa di tab Pra-Paspor.
						</p>
					</div>

					<div className="grid grid-cols-3 gap-2 md:flex md:shrink-0">
						<Select
							value={selectedSemester.toString()}
							onValueChange={(val) => setSelectedSemester(Number(val))}
						>
							<SelectTrigger
								aria-label="Pilih semester"
								className="w-full md:w-36 h-10 text-sm bg-white border-slate-200"
							>
								<SelectValue placeholder="Semester" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">Semester 1</SelectItem>
								<SelectItem value="2">Semester 2</SelectItem>
								<SelectItem value="3">Semester 3</SelectItem>
								<SelectItem value="4">Semester 4</SelectItem>
							</SelectContent>
						</Select>
						<Link
							href={`/dashboard/students/${studentId}/khs?semester=${selectedSemester}`}
							target="_blank"
						>
							<Button
								variant="outline"
								className="w-full h-10 text-sm gap-1.5 border-slate-200 text-slate-700 font-semibold"
								title="Buka / cetak KHS format A4"
							>
								<Printer className="w-4 h-4" />
								KHS
							</Button>
						</Link>
						<Link
							href={`/dashboard/students/${studentId}/transkrip`}
							target="_blank"
						>
							<Button
								variant="outline"
								className="w-full h-10 text-sm gap-1.5 border-slate-200 text-slate-700 font-semibold"
								title="Buka / cetak transkrip format A4"
							>
								<Printer className="w-4 h-4" />
								Transkrip
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Ringkasan nilai */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{tiles.map((t) => (
					<div
						key={t.label}
						className="rounded-xl border border-slate-200 bg-white p-4"
					>
						<p className="text-xs font-medium text-slate-600">{t.label}</p>
						<p
							className={`mt-1 text-xl sm:text-2xl font-bold tabular-nums leading-tight ${t.tone}`}
						>
							{t.value}
						</p>
						<p className="mt-1 text-xs text-slate-500">{t.sub}</p>
					</div>
				))}
				<div className="rounded-xl border border-slate-200 bg-white p-4">
					<p className="text-xs font-medium text-slate-600">UTS & UAS</p>
					<dl className="mt-1 space-y-0.5 text-sm">
						<div className="flex justify-between gap-2">
							<dt className="text-slate-600">UTS</dt>
							<dd className={`font-semibold ${uts.cls}`}>{uts.text}</dd>
						</div>
						<div className="flex justify-between gap-2">
							<dt className="text-slate-600">UAS</dt>
							<dd className={`font-semibold ${uas.cls}`}>{uas.text}</dd>
						</div>
					</dl>
					<p className="mt-1 text-xs text-slate-500">Standar minimal 60</p>
				</div>
			</div>

			{/* Rincian nilai per mata kuliah */}
			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
				<div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
					<h3 className="text-sm sm:text-base font-bold text-slate-900">
						Nilai per Mata Kuliah
					</h3>
					<p className="mt-0.5 text-xs text-slate-500">
						Semester {selectedSemester} · {grades.length} mata kuliah ·{" "}
						{totalSksTaken} SKS · Bobot: Presensi 10–15%, Teori 20–25%, Praktik
						40%, UTS 15–30%, UAS 15–30%
					</p>
				</div>

				{grades.length === 0 ? (
					<div className="px-4 py-12 text-center">
						<p className="text-sm font-semibold text-slate-700">
							Belum ada mata kuliah terdaftar di semester ini.
						</p>
						<p className="mt-1 text-sm text-slate-500">
							Pastikan kurikulum Kohort {summaryData?.cohort} sudah dibuka oleh
							Akademik.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-100/80">
								<TableRow className="border-slate-200 hover:bg-transparent">
									<TableHead className="py-3 pl-4 sm:pl-6 text-xs font-semibold text-slate-600 min-w-[220px]">
										Mata Kuliah
									</TableHead>
									<TableHead className="py-3 text-center text-xs font-semibold text-slate-600">
										SKS
									</TableHead>
									<TableHead className="py-3 text-center text-xs font-semibold text-slate-600">
										Presensi
									</TableHead>
									<TableHead className="py-3 text-center text-xs font-semibold text-slate-600">
										Teori
									</TableHead>
									<TableHead className="py-3 text-center text-xs font-semibold text-slate-600">
										Praktik
									</TableHead>
									<TableHead className="py-3 text-center text-xs font-semibold text-slate-600">
										UTS
									</TableHead>
									<TableHead className="py-3 text-center text-xs font-semibold text-slate-600">
										UAS
									</TableHead>
									<TableHead className="py-3 text-center text-xs font-semibold text-slate-600">
										Akhir
									</TableHead>
									<TableHead className="py-3 pr-4 sm:pr-6 text-center text-xs font-semibold text-slate-600">
										Grade
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{grades.map((item, idx) => {
									const graded =
										item.grade &&
										item.grade !== "-" &&
										item.status !== "BELUM_DINILAI";
									return (
										<TableRow
											key={item.courseId || idx}
											className="border-slate-100 text-sm"
										>
											<TableCell className="py-3 pl-4 sm:pl-6 whitespace-normal">
												<div className="font-semibold text-slate-900">
													{item.name}
													{item.isCustomEnrollment && (
														<span className="ml-2 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">
															Peserta tambahan
														</span>
													)}
												</div>
												<div className="mt-0.5 text-xs text-slate-500">
													<span className="font-mono">{item.code}</span> ·{" "}
													<span className="capitalize">{item.type}</span> ·{" "}
													{item.dosenName || "Dosen pengampu"}
													{item.enrollmentNotes && ` (${item.enrollmentNotes})`}
												</div>
											</TableCell>
											<TableCell className="text-center tabular-nums">
												{item.sks}
											</TableCell>
											<TableCell className="text-center tabular-nums">
												<span
													className={
														item.attendanceRate >= 80
															? "text-emerald-700"
															: "font-semibold text-rose-700"
													}
												>
													{item.attendanceRate}%
												</span>
												<div className="text-xs text-slate-500">
													{item.attendancePresent}/16
												</div>
											</TableCell>
											<TableCell className="text-center tabular-nums text-slate-700">
												{score(item.theoryScore)}
											</TableCell>
											<TableCell className="text-center tabular-nums text-slate-700">
												{score(item.practicalScore)}
											</TableCell>
											<TableCell className="text-center tabular-nums text-slate-700">
												{score(item.utsScore)}
											</TableCell>
											<TableCell className="text-center tabular-nums text-slate-700">
												{score(item.uasScore)}
											</TableCell>
											<TableCell className="text-center font-semibold tabular-nums text-slate-900">
												{graded ? item.finalScore : "–"}
											</TableCell>
											<TableCell className="pr-4 sm:pr-6 text-center">
												{graded ? (
													<>
														<span
															className={`inline-flex min-w-9 justify-center rounded-md border px-1.5 py-0.5 text-xs font-bold ${gradeTone(item.grade)}`}
														>
															{item.grade}
														</span>
														{!item.isPassed && (
															<div className="mt-0.5 text-xs font-semibold text-rose-700">
																Remedial
															</div>
														)}
													</>
												) : (
													<span className="text-slate-400">–</span>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}
			</section>
		</div>
	);
}
