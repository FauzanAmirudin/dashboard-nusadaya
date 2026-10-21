"use client";

import { ChevronRight, Loader2, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getInitials } from "../types";

function DynamicProgressBar({
	rate,
	pillar = "kuliah",
}: {
	rate: number;
	pillar?: "kuliah" | "piket" | "baris";
}) {
	const validRate = Number.isFinite(rate)
		? Math.min(Math.max(rate, 0), 100)
		: 0;

	let barColor = "bg-rose-500";
	if (validRate >= 85) {
		barColor =
			pillar === "kuliah"
				? "bg-[#0517B0]"
				: pillar === "piket"
					? "bg-emerald-600"
					: "bg-amber-600";
	} else if (validRate >= 70) {
		barColor = "bg-amber-500";
	} else if (validRate > 0) {
		barColor = "bg-rose-500";
	} else {
		barColor = "bg-transparent";
	}

	return (
		<div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
			<div
				className={cn(
					"h-full rounded-full transition-all duration-300",
					barColor,
				)}
				style={{ width: `${validRate}%` }}
			/>
		</div>
	);
}

function getRateTextColor(
	rate: number,
	pillar: "kuliah" | "piket" | "baris" = "kuliah",
) {
	if (rate === 0) return "text-slate-500";
	if (rate >= 85) {
		return pillar === "kuliah"
			? "text-[#0517B0]"
			: pillar === "piket"
				? "text-emerald-700"
				: "text-amber-700";
	}
	if (rate >= 70) return "text-amber-600";
	return "text-rose-600";
}

interface TabPresensiKuliahProps {
	students: any[];
	isLoading: boolean;
}

export function TabPresensiKuliah({
	students,
	isLoading,
}: TabPresensiKuliahProps) {
	const router = useRouter();

	return (
		<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
					<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
					<span className="text-xs font-medium text-slate-500">
						Memuat data presensi perkuliahan dari database...
					</span>
				</div>
			) : students.length === 0 ? (
				<div className="text-center py-16 px-4 text-slate-400">
					<Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
					<p className="text-sm font-bold text-slate-700">
						Tidak ada data mahasiswa ditemukan
					</p>
					<p className="text-xs text-slate-400 mt-1">
						Coba sesuaikan filter angkatan, rombel, atau kata kunci pencarian.
					</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-slate-50/75 hover:bg-slate-50/75 border-b border-slate-200">
								<TableHead className="text-xs font-semibold text-slate-700 pl-5 min-w-[200px]">
									Mahasiswa
								</TableHead>
								<TableHead className="text-xs font-semibold text-slate-700 min-w-[150px]">
									Peminatan
								</TableHead>
								<TableHead className="text-xs font-semibold text-slate-700 min-w-[140px]">
									Dosen (PA)
								</TableHead>
								<TableHead className="text-xs font-semibold text-slate-700 min-w-[160px]">
									Presensi Kuliah
								</TableHead>
								<TableHead className="text-xs font-semibold text-slate-700 min-w-[130px]">
									Angkatan / T.A.
								</TableHead>
								<TableHead className="text-xs font-semibold text-slate-700 text-center pr-5 w-[110px]">
									Aksi
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{students.map((item: any) => {
								const s = item.student;
								const currentYear = new Date().getFullYear();
								const ta = `${currentYear}/${currentYear + 1}`;
								const initials = getInitials(s.name);

								// Calculate student attendance from syllabus sessions
								const courses = item.courseGrades || [];
								let studentMeetings = 0;
								let studentPresent = 0;
								courses.forEach((c: any) => {
									studentMeetings += c.totalMeetings || 16;
									studentPresent += c.attendancePresent || 0;
								});
								const studentRate =
									studentMeetings > 0
										? Math.round((studentPresent / studentMeetings) * 100)
										: 0;

								return (
									<TableRow
										key={s.id}
										onClick={() =>
											router.push(
												`/dashboard/students/${s.id}?context=kehadiran`,
											)
										}
										className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
									>
										{/* Mahasiswa Info */}
										<TableCell className="pl-5 py-3.5">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/60 text-[#0517B0] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
													{initials}
												</div>
												<div className="space-y-0.5 min-w-0">
													<p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#0517B0] transition-colors truncate">
														{s.name}
													</p>
													<div className="flex items-center gap-1.5 flex-wrap">
														{s.nim ? (
															<span className="font-mono text-[11px] text-slate-500 font-medium">
																{s.nim}
															</span>
														) : (
															<span className="text-[11px] text-slate-400 italic">
																NIM Belum Ada
															</span>
														)}
														{(item.hasSelfie ||
															courses.some(
																(c: any) =>
																	c.hasSelfie ||
																	(c.meetings &&
																		c.meetings.some((m: any) => m.selfieUrl)),
															)) && (
															<Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-1.5 py-0 font-semibold">
																📸 Selfie
															</Badge>
														)}
													</div>
												</div>
											</div>
										</TableCell>

										{/* Peminatan Badge */}
										<TableCell className="py-3.5">
											<PeminatanBadge
												peminatan={s.subProgram || s.program}
												variant="subtle"
												size="sm"
											/>
										</TableCell>

										{/* Dosen PA */}
										<TableCell className="py-3.5">
											{s.paName ? (
												<div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
													<UserCheck className="w-3.5 h-3.5 text-[#0517B0] shrink-0" />
													<span
														className="truncate max-w-[130px]"
														title={s.paName}
													>
														{s.paName}
													</span>
												</div>
											) : (
												<span className="text-xs text-slate-400 italic">
													Belum Ditentukan
												</span>
											)}
										</TableCell>

										{/* Presensi Kuliah Progress */}
										<TableCell className="py-3.5">
											<div
												className="space-y-1.5 max-w-[130px]"
												title={
													courses.length > 0
														? `${courses.length} Mata Kuliah (${studentMeetings} Sesi)`
														: undefined
												}
											>
												<div className="flex items-center justify-between text-[11px]">
													<span
														className={cn(
															"font-bold",
															getRateTextColor(studentRate, "kuliah"),
														)}
													>
														{studentRate}%
													</span>
													<span className="text-slate-400 text-[10px]">
														{studentPresent}/{studentMeetings} Sesi
													</span>
												</div>
												<DynamicProgressBar
													rate={studentRate}
													pillar="kuliah"
												/>
											</div>
										</TableCell>

										{/* Angkatan & Tahun Ajaran */}
										<TableCell className="py-3.5">
											<div className="space-y-1">
												<Badge
													variant="secondary"
													className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md"
												>
													Angkatan {s.cohort}
												</Badge>
												<p className="text-[10px] text-slate-400 font-medium pl-0.5">
													T.A. {ta}
												</p>
											</div>
										</TableCell>

										{/* CTA Aksi */}
										<TableCell className="pr-5 py-3.5 text-center">
											<Link
												href={`/dashboard/students/${s.id}?context=kehadiran`}
												onClick={(e) => e.stopPropagation()}
											>
												<Button
													size="sm"
													className="h-8 px-3 text-xs bg-slate-50 hover:bg-[#0517B0] text-slate-700 hover:text-white border border-slate-200 hover:border-[#0517B0] font-semibold gap-1 rounded-xl transition-all shadow-2xs group-hover:bg-[#0517B0] group-hover:text-white group-hover:border-[#0517B0]"
												>
													<span>Detail</span>
													<ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
												</Button>
											</Link>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}
		</Card>
	);
}
