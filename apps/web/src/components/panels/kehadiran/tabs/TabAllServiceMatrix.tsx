"use client";

import { ChevronRight, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function DynamicProgressBar({
	rate,
	pillar,
}: {
	rate: number;
	pillar: "kuliah" | "piket" | "baris";
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

function getRateTextColor(rate: number, pillar: "kuliah" | "piket" | "baris") {
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
						Menghitung akumulasi kehadiran mahasiswa dari database...
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
								<TableHead className="min-w-[150px]">Kuliah</TableHead>
								<TableHead className="min-w-[150px]">Piket</TableHead>
								<TableHead className="min-w-[150px]">Baris Pagi</TableHead>
								<TableHead className="min-w-[140px] text-center">
									Akumulasi
								</TableHead>
								<TableHead className="text-center pr-5 w-[110px]">
									Aksi
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{allServiceList.map((item) => {
								const initials = getInitials(item.name);

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
											<div className="space-y-1.5 max-w-[130px]">
												<div className="flex items-center justify-between text-[11px]">
													<span
														className={cn(
															"font-bold",
															getRateTextColor(item.kuliah.rate, "kuliah"),
														)}
													>
														{item.kuliah.rate}%
													</span>
													<span className="text-slate-400 text-[10px]">
														{item.kuliah.presentCount}/
														{item.kuliah.totalMeetings} Sesi
													</span>
												</div>
												<DynamicProgressBar
													rate={item.kuliah.rate}
													pillar="kuliah"
												/>
											</div>
										</TableCell>

										{/* Pilar 2: Piket */}
										<TableCell className="py-3.5">
											<div className="space-y-1.5 max-w-[130px]">
												<div className="flex items-center justify-between text-[11px]">
													<span
														className={cn(
															"font-bold",
															getRateTextColor(item.piket.rate, "piket"),
														)}
													>
														{item.piket.rate}%
													</span>
													<span className="text-slate-400 text-[10px]">
														{item.piket.presentCount}/{item.piket.totalSessions}{" "}
														Piket
													</span>
												</div>
												<DynamicProgressBar
													rate={item.piket.rate}
													pillar="piket"
												/>
											</div>
										</TableCell>

										{/* Pilar 3: Baris Pagi (06.22) */}
										<TableCell className="py-3.5">
											<div className="space-y-1.5 max-w-[140px]">
												<div className="flex items-center justify-between text-[11px]">
													<span
														className={cn(
															"font-bold",
															getRateTextColor(item.barisPagi.rate, "baris"),
														)}
													>
														{item.barisPagi.rate}%
													</span>
													<span className="text-slate-400 text-[10px]">
														{item.barisPagi.tepatWaktuCount}/
														{item.barisPagi.totalSessions} Apel
													</span>
												</div>
												<DynamicProgressBar
													rate={item.barisPagi.rate}
													pillar="baris"
												/>
												{item.barisPagi.terlambatCount > 0 && (
													<div className="text-[10px] text-amber-700 font-medium">
														Terlambat: {item.barisPagi.terlambatCount}x
													</div>
												)}
											</div>
										</TableCell>

										{/* Indeks All-Service (Murni tanpa keterangan) */}
										<TableCell className="py-3.5 text-center">
											<span className="text-base font-black text-slate-900 tracking-tight">
												{item.allServiceScore}%
											</span>
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
