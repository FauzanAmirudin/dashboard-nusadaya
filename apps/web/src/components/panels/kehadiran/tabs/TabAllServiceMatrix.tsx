"use client";

import { ChevronRight, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { type AllServiceStudentItem, getInitials } from "../types";

interface TabAllServiceMatrixProps {
	allServiceList: AllServiceStudentItem[];
	isLoading: boolean;
}

export function TabAllServiceMatrix({
	allServiceList,
	isLoading,
}: TabAllServiceMatrixProps) {
	const router = useRouter();

	return (
		<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden">
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
					<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
					<span className="text-xs font-medium text-slate-500">
						Menghitung indeks All-Service mahasiswa dari database...
					</span>
				</div>
			) : allServiceList.length === 0 ? (
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
							<TableRow className="bg-slate-50/75 hover:bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
								<TableHead className="pl-5 min-w-[200px]">Mahasiswa</TableHead>
								<TableHead className="min-w-[130px]">
									Angkatan & Rombel
								</TableHead>
								<TableHead className="min-w-[150px]">1. Kuliah (50%)</TableHead>
								<TableHead className="min-w-[150px]">2. Piket (25%)</TableHead>
								<TableHead className="min-w-[160px]">
									3. Baris 06.22 (25%)
								</TableHead>
								<TableHead className="min-w-[140px] text-center">
									Indeks All-Service
								</TableHead>
								<TableHead className="text-center pr-5 w-[110px]">
									Aksi
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{allServiceList.map((item) => {
								const initials = getInitials(item.name);
								let badgeColor =
									"bg-emerald-50 text-emerald-700 border-emerald-200";
								let statusLabel = "DISIPLIN";
								if (item.allServiceStatus === "PERLU_PEMBINAAN") {
									badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
									statusLabel = "PEMBINAAN";
								} else if (item.allServiceStatus === "KRITIS") {
									badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
									statusLabel = "KRITIS";
								}

								return (
									<TableRow
										key={item.id}
										onClick={() =>
											router.push(
												`/dashboard/students/${item.id}?context=kehadiran`,
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
														{item.name}
													</p>
													<div className="flex items-center gap-1.5">
														<span className="font-mono text-[11px] text-slate-500 font-medium">
															{item.nim}
														</span>
														<span className="text-slate-300">•</span>
														<span className="text-[11px] text-slate-500 truncate max-w-[120px]">
															{item.subProgram || item.program}
														</span>
													</div>
												</div>
											</div>
										</TableCell>

										{/* Angkatan & Rombel */}
										<TableCell className="py-3.5">
											<div className="space-y-0.5">
												<Badge
													variant="secondary"
													className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
												>
													Angkatan {item.cohort}
												</Badge>
												<div className="text-[11px] font-mono font-medium text-slate-600 pl-0.5">
													{item.rombel}
												</div>
											</div>
										</TableCell>

										{/* Pilar 1: Perkuliahan */}
										<TableCell className="py-3.5">
											<div className="space-y-1 max-w-[130px]">
												<div className="flex items-center justify-between text-[11px]">
													<span className="font-bold text-slate-800">
														{item.kuliah.rate}%
													</span>
													<span className="text-slate-400 text-[10px]">
														{item.kuliah.presentCount}/
														{item.kuliah.totalMeetings} Sesi
													</span>
												</div>
												<Progress
													value={item.kuliah.rate}
													className="h-1.5 bg-slate-100 [&>div]:bg-[#0517B0]"
												/>
											</div>
										</TableCell>

										{/* Pilar 2: Piket */}
										<TableCell className="py-3.5">
											<div className="space-y-1 max-w-[130px]">
												<div className="flex items-center justify-between text-[11px]">
													<span className="font-bold text-emerald-700">
														{item.piket.rate}%
													</span>
													<span className="text-slate-400 text-[10px]">
														{item.piket.presentCount}/{item.piket.totalSessions}{" "}
														Piket
													</span>
												</div>
												<Progress
													value={item.piket.rate}
													className="h-1.5 bg-slate-100 [&>div]:bg-emerald-600"
												/>
											</div>
										</TableCell>

										{/* Pilar 3: Baris Pagi (06.22) */}
										<TableCell className="py-3.5">
											<div className="space-y-1 max-w-[140px]">
												<div className="flex items-center justify-between text-[11px]">
													<span className="font-bold text-amber-700">
														{item.barisPagi.rate}%
													</span>
													<span className="text-slate-400 text-[10px]">
														{item.barisPagi.tepatWaktuCount}/
														{item.barisPagi.totalSessions} Apel
													</span>
												</div>
												<Progress
													value={item.barisPagi.rate}
													className="h-1.5 bg-slate-100 [&>div]:bg-amber-600"
												/>
												{item.barisPagi.terlambatCount > 0 && (
													<div className="text-[10px] text-amber-700 font-medium">
														Terlambat: {item.barisPagi.terlambatCount}x
													</div>
												)}
											</div>
										</TableCell>

										{/* Indeks All-Service */}
										<TableCell className="py-3.5 text-center">
											<div className="space-y-1">
												<span className="text-base font-black text-slate-900 tracking-tight">
													{item.allServiceScore}%
												</span>
												<div>
													<Badge
														className={cn(
															"text-[10px] font-bold border",
															badgeColor,
														)}
													>
														{statusLabel}
													</Badge>
												</div>
											</div>
										</TableCell>

										{/* Action */}
										<TableCell className="pr-5 py-3.5 text-center">
											<Link
												href={`/dashboard/students/${item.id}?context=kehadiran`}
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
