"use client";

import {
	AlertTriangle,
	Calendar,
	Camera,
	CheckCircle2,
	Clock,
	Compass,
	Filter,
	Loader2,
	MapPin,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
	User,
	Users,
	XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { API_URL, getFileUrl, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";
import {
	SelfieDetailModal,
	type SelfieRecordDetail,
} from "../SelfieDetailModal";

export function TabSelfieLiveFeed() {
	const [records, setRecords] = useState<SelfieRecordDetail[]>([]);
	const [summary, setSummary] = useState<any>(null);
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [isLoading, setIsLoading] = useState(true);
	const [isPolling, setIsPolling] = useState(true);
	const [selectedRecord, setSelectedRecord] =
		useState<SelfieRecordDetail | null>(null);

	const prevCountRef = useRef<number>(0);

	const fetchRecords = async (isBackground = false) => {
		if (!isBackground) setIsLoading(true);
		try {
			const token = getToken();
			if (!token) return;

			let url = `${API_URL}/attendance/selfie/records?limit=60`;
			if (typeFilter !== "all") url += `&type=${typeFilter}`;
			if (statusFilter !== "all") url += `&verificationStatus=${statusFilter}`;

			const [recRes, sumRes] = await Promise.all([
				fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
				fetch(
					`${API_URL}/attendance/selfie/summary?type=${typeFilter === "all" ? "baris_pagi" : typeFilter}`,
					{ headers: { Authorization: `Bearer ${token}` } },
				),
			]);

			const recJson = await recRes.json();
			const sumJson = await sumRes.json();

			if (recJson.success && Array.isArray(recJson.data)) {
				// Toast if new records arrived during polling
				if (
					isBackground &&
					prevCountRef.current > 0 &&
					recJson.data.length > prevCountRef.current
				) {
					const diff = recJson.data.length - prevCountRef.current;
					toast.info(`${diff} presensi selfie baru masuk`);
				}
				prevCountRef.current = recJson.data.length;
				setRecords(recJson.data);
			}

			if (sumJson.success) {
				setSummary(sumJson.data);
			}
		} catch (err) {
			console.error("Gagal memuat feed selfie:", err);
		} finally {
			if (!isBackground) setIsLoading(false);
		}
	};

	// Initial fetch & filter changes
	useEffect(() => {
		fetchRecords(false);
	}, [typeFilter, statusFilter]);

	// Automatic polling every 20 seconds (Task 3.4)
	useEffect(() => {
		if (!isPolling) return;
		const interval = setInterval(() => {
			fetchRecords(true);
		}, 20000);
		return () => clearInterval(interval);
	}, [isPolling, typeFilter, statusFilter]);

	return (
		<div className="space-y-5">
			{/* Real-time Summary Cards (Task 3.1) */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
				<Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white p-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
							<Camera className="w-5 h-5" />
						</div>
						<div>
							<span className="text-[11px] font-medium text-slate-500">
								Total Masuk Hari Ini
							</span>
							<p className="text-xl font-extrabold text-slate-900">
								{records.length}
							</p>
						</div>
					</div>
				</Card>

				<Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white p-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
							<CheckCircle2 className="w-5 h-5" />
						</div>
						<div>
							<span className="text-[11px] font-medium text-slate-500">
								Tepat Waktu / Hadir
							</span>
							<p className="text-xl font-extrabold text-emerald-700">
								{records.filter((r) => r.status === "hadir").length}
							</p>
						</div>
					</div>
				</Card>

				<Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white p-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
							<Clock className="w-5 h-5" />
						</div>
						<div>
							<span className="text-[11px] font-medium text-slate-500">
								Menunggu Review
							</span>
							<p className="text-xl font-extrabold text-amber-700">
								{
									records.filter(
										(r) => r.verificationStatus === "pending_review",
									).length
								}
							</p>
						</div>
					</div>
				</Card>

				<Card className="rounded-2xl border-slate-200/90 shadow-2xs bg-white p-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
							<ShieldAlert className="w-5 h-5" />
						</div>
						<div>
							<span className="text-[11px] font-medium text-slate-500">
								Di Luar Radius (Flagged)
							</span>
							<p className="text-xl font-extrabold text-rose-700">
								{records.filter((r) => r.isWithinRadius === false).length}
							</p>
						</div>
					</div>
				</Card>
			</div>

			{/* Filter & Live Status Bar */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
				<div className="flex items-center gap-2.5 flex-wrap">
					<Select
						value={typeFilter}
						onValueChange={(val) => setTypeFilter(val || "all")}
					>
						<SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 font-medium w-40">
							<SelectValue placeholder="Tipe Absensi" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Tipe</SelectItem>
							<SelectItem value="baris_pagi">Apel Baris Pagi</SelectItem>
							<SelectItem value="kuliah">Kuliah / Kelas</SelectItem>
							<SelectItem value="piket">Piket Kampus</SelectItem>
							<SelectItem value="ods">On-Duty Service (ODS)</SelectItem>
						</SelectContent>
					</Select>

					<Select
						value={statusFilter}
						onValueChange={(val) => setStatusFilter(val || "all")}
					>
						<SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 font-medium w-44">
							<SelectValue placeholder="Status Verifikasi" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Semua Status</SelectItem>
							<SelectItem value="pending_review">
								Perlu Review (Kuning)
							</SelectItem>
							<SelectItem value="auto_approved">Auto Approved</SelectItem>
							<SelectItem value="approved">Approved Manual</SelectItem>
							<SelectItem value="rejected">Ditolak</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-center gap-2 justify-end">
					<div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
						<span
							className={cn(
								"w-2 h-2 rounded-full",
								isPolling ? "bg-emerald-500 animate-pulse" : "bg-slate-400",
							)}
						/>
						<span>Polling Live 20s</span>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => fetchRecords(false)}
						className="h-9 rounded-xl text-xs font-bold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
					>
						<RefreshCw className="w-3.5 h-3.5" />
						<span>Refresh</span>
					</Button>
				</div>
			</div>

			{/* Grid Cards of Selfie Records */}
			{isLoading ? (
				<div className="py-20 text-center flex flex-col items-center justify-center gap-3">
					<Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
					<span className="text-xs text-slate-500 font-medium">
						Memuat rekaman absensi selfie...
					</span>
				</div>
			) : records.length === 0 ? (
				<Card className="rounded-2xl border-slate-200/90 p-12 text-center bg-white space-y-3">
					<Camera className="w-12 h-12 text-slate-300 mx-auto" />
					<h3 className="font-bold text-slate-800 text-base">
						Belum Ada Presensi Selfie
					</h3>
					<p className="text-xs text-slate-500 max-w-sm mx-auto">
						Belum ada rekaman foto selfie masuk untuk filter yang dipilih. Data
						akan muncul secara real-time saat mahasiswa melakukan check-in.
					</p>
				</Card>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{records.map((item) => {
						const isPending = item.verificationStatus === "pending_review";
						const isOutside = item.isWithinRadius === false;

						return (
							<Card
								key={`${item.attendanceType}-${item.id}`}
								className={cn(
									"rounded-2xl border transition-all overflow-hidden flex flex-col justify-between hover:shadow-md",
									isPending
										? "border-amber-300 bg-amber-50/20"
										: "border-slate-200 bg-white",
								)}
							>
								{/* Thumbnail Foto Selfie Ber-watermark */}
								<div
									onClick={() => setSelectedRecord(item)}
									className="relative aspect-4/3 w-full bg-slate-900 cursor-pointer overflow-hidden group"
								>
									{item.selfieUrl ? (
										<img
											src={getFileUrl(item.selfieUrl)}
											alt={`Selfie ${item.student?.name}`}
											className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center text-slate-500">
											<User className="w-10 h-10" />
										</div>
									)}

									{/* Badges on image */}
									<div className="absolute top-2 left-2 flex items-center gap-1">
										<Badge
											className={cn(
												"text-[10px] font-bold px-2 py-0.5 border-0 shadow-sm",
												item.attendanceType === "baris_pagi"
													? "bg-amber-600 text-white"
													: item.attendanceType === "kuliah"
														? "bg-blue-600 text-white"
														: item.attendanceType === "piket"
															? "bg-teal-600 text-white"
															: "bg-purple-600 text-white",
											)}
										>
											{item.attendanceType === "baris_pagi"
												? "BARIS PAGI"
												: item.attendanceType?.toUpperCase()}
										</Badge>
									</div>

									<div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-white flex items-center gap-1">
										<Clock className="w-3 h-3 text-emerald-400" />
										<span>
											{item.selfieTakenAt
												? new Date(item.selfieTakenAt).toLocaleTimeString(
														"id-ID",
														{
															hour: "2-digit",
															minute: "2-digit",
															timeZone: "Asia/Jakarta",
														},
													)
												: "-"}{" "}
											WIB
										</span>
									</div>
								</div>

								{/* Card Content Details */}
								<div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
									<div className="space-y-1">
										<div className="flex items-start justify-between gap-2">
											<h4 className="font-extrabold text-slate-900 text-sm truncate">
												{item.student?.name || "Mahasiswa"}
											</h4>
											<span className="font-mono text-[11px] text-slate-400 shrink-0">
												{item.student?.nim}
											</span>
										</div>

										<p className="text-[11px] text-slate-500 truncate">
											{item.title}
										</p>
									</div>

									{/* Location & Radius Badges */}
									<div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
										<div className="flex items-center justify-between text-[11px]">
											<span className="text-slate-500 flex items-center gap-1 truncate">
												<MapPin className="w-3 h-3 text-slate-400 shrink-0" />
												<span className="truncate">
													{item.locationName || "Area Kampus"}
												</span>
											</span>
											<span
												className={cn(
													"font-bold shrink-0 ml-2 font-mono",
													isOutside ? "text-rose-600" : "text-emerald-700",
												)}
											>
												{item.distanceFromCheckpoint !== undefined &&
												item.distanceFromCheckpoint !== null
													? `${item.distanceFromCheckpoint}m`
													: "Dalam Radius"}
											</span>
										</div>

										<div className="flex items-center justify-between pt-1">
											<Badge
												variant="outline"
												className={cn(
													"text-[10px] font-bold px-1.5 py-0",
													item.status === "hadir"
														? "text-emerald-700 border-emerald-200 bg-emerald-50"
														: "text-amber-700 border-amber-200 bg-amber-50",
												)}
											>
												{item.status?.toUpperCase()}
											</Badge>

											<Badge
												className={cn(
													"text-[10px] font-semibold border-0",
													isPending
														? "bg-amber-500 text-white animate-pulse"
														: item.verificationStatus === "approved" ||
																item.verificationStatus === "auto_approved"
															? "bg-emerald-600 text-white"
															: "bg-rose-600 text-white",
												)}
											>
												{isPending
													? "REVIEW"
													: item.verificationStatus === "approved"
														? "ACC"
														: item.verificationStatus?.toUpperCase()}
											</Badge>
										</div>
									</div>

									{/* Action Button */}
									<div className="pt-2">
										<Button
											size="sm"
											onClick={() => setSelectedRecord(item)}
											className="w-full h-8 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
										>
											Lihat Foto & Peta
										</Button>
									</div>
								</div>
							</Card>
						);
					})}
				</div>
			)}

			{/* Modal Detail & Leaflet Map */}
			{selectedRecord && (
				<SelfieDetailModal
					record={selectedRecord}
					isOpen={!!selectedRecord}
					onClose={() => setSelectedRecord(null)}
					onVerified={() => {
						fetchRecords(false);
					}}
				/>
			)}
		</div>
	);
}
