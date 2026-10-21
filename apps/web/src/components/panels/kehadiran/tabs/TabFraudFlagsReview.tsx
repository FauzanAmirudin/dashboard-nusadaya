"use client";

import {
	AlertTriangle,
	Check,
	CheckCircle2,
	Compass,
	Eye,
	Filter,
	Loader2,
	MapPin,
	RefreshCw,
	ShieldAlert,
	User,
	XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_URL, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";

interface FraudFlagItem {
	id: number;
	attendanceType: string;
	attendanceRecordId: number;
	studentId: number;
	flagReason: string;
	flagDetail: any;
	isDismissed: boolean;
	reviewedAt?: string;
	createdAt: string;
	student?: {
		id: number;
		name: string;
		nim: string;
		cohort: number;
		rombel: string;
	};
	reviewer?: {
		id: number;
		fullName: string;
	};
}

export function TabFraudFlagsReview() {
	const [flags, setFlags] = useState<FraudFlagItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [typeFilter, setTypeFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("pending");

	const fetchFlags = async () => {
		setIsLoading(true);
		try {
			const token = getToken();
			if (!token) return;

			let url = `${API_URL}/attendance/selfie/fraud-flags?`;
			if (typeFilter !== "all") url += `attendanceType=${typeFilter}&`;
			if (statusFilter !== "all") {
				url += `isDismissed=${statusFilter === "dismissed"}&`;
			}

			const res = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.success && Array.isArray(json.data)) {
				setFlags(json.data);
			}
		} catch (err) {
			console.error("Gagal memuat fraud flags:", err);
			toast.error("Gagal memuat data potensi pelanggaran");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchFlags();
	}, [typeFilter, statusFilter]);

	const handleDismiss = async (flagId: number, isDismissed: boolean) => {
		try {
			const token = getToken();
			const res = await fetch(
				`${API_URL}/attendance/selfie/fraud-flags/${flagId}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ isDismissed }),
				},
			);
			const json = await res.json();
			if (json.success) {
				toast.success(
					isDismissed
						? "Flag berhasil di-dismiss (dianggap wajar)"
						: "Flag dibuka kembali",
				);
				fetchFlags();
			} else {
				toast.error(json.message || "Gagal memperbarui status flag");
			}
		} catch {
			toast.error("Kesalahan jaringan");
		}
	};

	const formatReason = (reason: string) => {
		switch (reason) {
			case "outside_radius":
				return "Di Luar Radius Checkpoint";
			case "gps_accuracy_too_low":
				return "Akurasi GPS Sangat Rendah";
			case "gps_spoofing_suspected":
				return "Dugaan Manipulasi GPS";
			case "virtual_camera_suspected":
				return "Dugaan Virtual Camera";
			case "duplicate_submission":
				return "Pengiriman Ganda";
			default:
				return reason;
		}
	};

	return (
		<div className="space-y-4">
			{/* Header info */}
			<div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
						<ShieldAlert className="w-5 h-5" />
					</div>
					<div>
						<h3 className="font-extrabold text-sm text-slate-900">
							Audit Kecurangan & Anomali Presensi (Fraud Flags)
						</h3>
						<p className="text-xs text-slate-600">
							Tinjau presensi mahasiswa yang terdeteksi di luar radius lokasi
							atau memiliki anomali koordinat satelit GPS.
						</p>
					</div>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={fetchFlags}
					className="h-9 rounded-xl text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-white shrink-0"
				>
					<RefreshCw className="w-3.5 h-3.5" />
					<span>Segarkan Data</span>
				</Button>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
				<Select value={typeFilter} onValueChange={setTypeFilter}>
					<SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 font-medium w-40">
						<SelectValue placeholder="Layanan" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Semua Layanan</SelectItem>
						<SelectItem value="baris_pagi">Baris Pagi</SelectItem>
						<SelectItem value="kuliah">Kuliah</SelectItem>
						<SelectItem value="piket">Piket</SelectItem>
						<SelectItem value="ods">ODS</SelectItem>
					</SelectContent>
				</Select>

				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 font-medium w-44">
						<SelectValue placeholder="Status Review" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Semua Status</SelectItem>
						<SelectItem value="pending">Belum Di-review</SelectItem>
						<SelectItem value="dismissed">Telah Di-dismiss</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Table of Flags */}
			<Card className="rounded-2xl border-slate-200 overflow-hidden shadow-2xs bg-white">
				{isLoading ? (
					<div className="p-16 text-center flex flex-col items-center justify-center gap-3">
						<Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
						<span className="text-xs text-slate-500 font-medium">
							Memuat data fraud flags...
						</span>
					</div>
				) : flags.length === 0 ? (
					<div className="p-12 text-center space-y-2">
						<CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
						<h4 className="font-bold text-sm text-slate-800">
							Tidak Ada Flag Pelanggaran
						</h4>
						<p className="text-xs text-slate-500">
							Semua presensi selfie saat ini berada dalam radius aman dan tidak
							terdeteksi kecurangan.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50/70 border-b border-slate-100">
								<TableRow>
									<TableHead className="text-xs font-bold text-slate-600">
										Mahasiswa
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-600">
										Layanan
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-600">
										Alasan Flag
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-600">
										Rincian Teknis
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-600">
										Waktu Rekam
									</TableHead>
									<TableHead className="text-xs font-bold text-slate-600 text-right">
										Aksi Staff
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{flags.map((flag) => {
									const isDismissed = flag.isDismissed;
									const detail = flag.flagDetail || {};

									return (
										<TableRow
											key={flag.id}
											className={cn(
												"transition-colors",
												isDismissed
													? "opacity-60 bg-slate-50/30"
													: "hover:bg-rose-50/20",
											)}
										>
											<TableCell className="font-medium text-xs">
												<p className="font-bold text-slate-900">
													{flag.student?.name}
												</p>
												<p className="text-[11px] text-slate-500 font-mono">
													NIM: {flag.student?.nim} • Angk.{" "}
													{flag.student?.cohort}
												</p>
											</TableCell>

											<TableCell className="text-xs">
												<Badge
													className={cn(
														"text-[10px] font-bold border-0 px-2 py-0.5",
														flag.attendanceType === "baris_pagi"
															? "bg-amber-600 text-white"
															: flag.attendanceType === "kuliah"
																? "bg-blue-600 text-white"
																: flag.attendanceType === "piket"
																	? "bg-teal-600 text-white"
																	: "bg-purple-600 text-white",
													)}
												>
													{flag.attendanceType.toUpperCase()}
												</Badge>
											</TableCell>

											<TableCell className="text-xs">
												<div className="flex items-center gap-1.5 text-rose-700 font-semibold">
													<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
													<span>{formatReason(flag.flagReason)}</span>
												</div>
											</TableCell>

											<TableCell className="text-[11px] text-slate-600 max-w-xs">
												{detail.distanceFromCheckpoint !== undefined && (
													<p>
														Jarak:{" "}
														<span className="font-bold text-rose-700 font-mono">
															{detail.distanceFromCheckpoint}m
														</span>{" "}
														(Batas: {detail.radiusMeters || 100}m)
													</p>
												)}
												{detail.gpsAccuracy && (
													<p className="text-slate-500">
														Akurasi Sensor: ±{detail.gpsAccuracy}m
													</p>
												)}
											</TableCell>

											<TableCell className="text-[11px] font-mono text-slate-500">
												{new Date(flag.createdAt).toLocaleString("id-ID", {
													timeZone: "Asia/Jakarta",
													dateStyle: "short",
													timeStyle: "short",
												})}{" "}
												WIB
											</TableCell>

											<TableCell className="text-right">
												{isDismissed ? (
													<span className="text-[11px] text-slate-400 font-medium">
														Di-dismiss oleh {flag.reviewer?.fullName || "Staff"}
													</span>
												) : (
													<div className="flex items-center justify-end gap-1.5">
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleDismiss(flag.id, true)}
															className="h-8 text-xs font-semibold rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
														>
															<Check className="w-3.5 h-3.5 mr-1" />
															Dismiss (Wajar)
														</Button>
													</div>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}
			</Card>
		</div>
	);
}
