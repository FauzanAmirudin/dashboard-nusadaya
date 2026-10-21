"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Compass,
	ExternalLink,
	Eye,
	MapPin,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
	User,
	X,
	XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { DynamicMap } from "@/components/common/DynamicMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";

export interface SelfieRecordDetail {
	id: number;
	attendanceType: "baris_pagi" | "kuliah" | "piket" | "ods" | string;
	title?: string;
	student?: {
		id: number;
		name: string;
		nim: string;
		cohort?: number;
		rombel?: string;
	};
	status: string;
	selfieUrl?: string;
	latitude?: number;
	longitude?: number;
	gpsAccuracy?: number;
	locationName?: string;
	distanceFromCheckpoint?: number;
	isWithinRadius?: boolean;
	selfieTakenAt?: string;
	verificationStatus?:
		| "auto_approved"
		| "pending_review"
		| "approved"
		| "rejected"
		| string;
	rejectionReason?: string;
	verifier?: {
		fullName?: string;
	};
	session?: {
		sessionDate?: string;
		location?: string;
	};
}

export interface SelfieDetailModalProps {
	record: SelfieRecordDetail | null;
	isOpen?: boolean;
	onClose: () => void;
	onVerified?: () => void;
	onVerifySuccess?: () => void;
}

export function SelfieDetailModal({
	record,
	isOpen = true,
	onClose,
	onVerified,
	onVerifySuccess,
}: SelfieDetailModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");

	if (!record) return null;

	const studentCoords =
		record.latitude && record.longitude
			? { latitude: record.latitude, longitude: record.longitude }
			: { latitude: -8.6705, longitude: 115.2126 };

	// Default Nusadaya Campus checkpoint
	const checkpointCoords = { latitude: -8.6705, longitude: 115.2126 };

	const handleAction = async (action: "approve" | "reject") => {
		if (action === "reject" && !rejectionReason.trim()) {
			toast.error("Alasan penolakan wajib diisi");
			return;
		}

		setIsSubmitting(true);
		try {
			const token = getToken();
			const res = await fetch(
				`${API_URL}/attendance/selfie/${record.id}/verify`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						action,
						attendanceType: record.attendanceType,
						rejectionReason: action === "reject" ? rejectionReason : undefined,
					}),
				},
			);
			const json = await res.json();
			if (json.success) {
				toast.success(json.message);
				setIsRejectOpen(false);
				setRejectionReason("");
				if (onVerified) onVerified();
				if (onVerifySuccess) onVerifySuccess();
				onClose();
			} else {
				toast.error(json.message || "Gagal memproses verifikasi");
			}
		} catch (err) {
			console.error("Verification error:", err);
			toast.error("Kesalahan jaringan saat verifikasi");
		} finally {
			setIsSubmitting(false);
		}
	};

	const formattedTime = record.selfieTakenAt
		? new Intl.DateTimeFormat("id-ID", {
				timeZone: "Asia/Jakarta",
				day: "numeric",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			}).format(new Date(record.selfieTakenAt))
		: "-";

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className="w-full max-w-4xl p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl bg-white max-h-[92vh] flex flex-col"
				aria-describedby="selfie-detail-desc"
			>
				{/* Header */}
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
							<ShieldCheck className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-base font-bold text-slate-900">
								Verifikasi Foto Selfie & Geolokasi
							</DialogTitle>
							<p
								id="selfie-detail-desc"
								className="text-xs text-slate-500 font-medium"
							>
								{record.title || "Presensi Kehadiran"} • Mahasiswa:{" "}
								<span className="font-semibold text-slate-700">
									{record.student?.name}
								</span>{" "}
								({record.student?.nim})
							</p>
						</div>
					</div>

					<Badge
						className={cn(
							"text-xs font-bold px-3 py-1",
							record.verificationStatus === "approved" ||
								record.verificationStatus === "auto_approved"
								? "bg-emerald-600 text-white"
								: record.verificationStatus === "rejected"
									? "bg-rose-600 text-white"
									: "bg-amber-500 text-white animate-pulse",
						)}
					>
						{record.verificationStatus === "pending_review"
							? "MENUNGGU VERIFIKASI"
							: record.verificationStatus?.toUpperCase()}
					</Badge>
				</div>

				{/* Two-Column Grid Body */}
				<div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Left: Watermarked Photo */}
					<div className="space-y-3">
						<h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
							Foto Selfie Ber-Watermark
						</h4>

						<div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md group">
							{record.selfieUrl ? (
								<img
									src={record.selfieUrl}
									alt="Foto Selfie Presensi"
									className="w-full h-auto object-contain max-h-[420px] transition-transform duration-300 group-hover:scale-102"
								/>
							) : (
								<div className="w-full h-72 flex flex-col items-center justify-center text-slate-400 gap-2">
									<User className="w-12 h-12 stroke-[1.5]" />
									<span className="text-xs">Foto tidak tersedia</span>
								</div>
							)}

							<div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1.5">
								<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
								<span>WATERMARKED SNAPSHOT</span>
							</div>
						</div>

						{/* Detail Info Card */}
						<div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
							<div className="flex items-center justify-between text-slate-600">
								<span>Waktu Diterima Server:</span>
								<span className="font-mono font-bold text-slate-800">
									{formattedTime} WIB
								</span>
							</div>
							<div className="flex items-center justify-between text-slate-600">
								<span>Status Kehadiran:</span>
								<Badge
									variant="outline"
									className={cn(
										"text-[10px] font-bold",
										record.status === "hadir"
											? "text-emerald-700 border-emerald-300 bg-emerald-50"
											: "text-amber-700 border-amber-300 bg-amber-50",
									)}
								>
									{record.status?.toUpperCase()}
								</Badge>
							</div>
							{record.rejectionReason && (
								<div className="pt-1 text-rose-700 border-t border-rose-200/60 mt-1">
									<span className="font-bold">Alasan Ditolak: </span>
									<span>{record.rejectionReason}</span>
								</div>
							)}
						</div>
					</div>

					{/* Right: Interactive Leaflet Map */}
					<div className="space-y-3 flex flex-col">
						<div className="flex items-center justify-between">
							<h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
								Posisi Satelit GPS & Jarak Kampus
							</h4>
							<span
								className={cn(
									"text-[11px] font-bold px-2 py-0.5 rounded-md",
									record.isWithinRadius
										? "text-emerald-700 bg-emerald-100"
										: "text-rose-700 bg-rose-100",
								)}
							>
								{record.isWithinRadius
									? "DALAM RADIUS KAMPUS"
									: "DI LUAR RADIUS"}
							</span>
						</div>

						{/* Map Container */}
						<div className="flex-1 min-h-[260px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
							<DynamicMap
								studentCoords={studentCoords}
								checkpointCoords={checkpointCoords}
								radiusMeters={150}
								studentName={record.student?.name || "Mahasiswa"}
								checkpointLabel="Titik Kampus Nusadaya"
								height="280px"
							/>
						</div>

						{/* Location Metrics Grid */}
						<div className="grid grid-cols-2 gap-2 text-xs">
							<div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl space-y-0.5">
								<span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
									<Compass className="w-3.5 h-3.5" />
									Jarak ke Kampus
								</span>
								<p className="text-base font-extrabold text-blue-950 font-mono">
									{record.distanceFromCheckpoint !== undefined &&
									record.distanceFromCheckpoint !== null
										? `${record.distanceFromCheckpoint} meter`
										: "Terhitung dalam radius"}
								</p>
							</div>

							<div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
								<span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
									<MapPin className="w-3.5 h-3.5 text-slate-400" />
									Akurasi Sensor GPS
								</span>
								<p className="text-base font-extrabold text-slate-800 font-mono">
									±{record.gpsAccuracy || 10} m
								</p>
							</div>
						</div>

						{/* Reverse Geocode Address */}
						{record.locationName && (
							<div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-start gap-2 text-slate-700">
								<MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
								<div>
									<span className="font-semibold text-slate-800">
										Alamat Terdeteksi:
									</span>
									<p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
										{record.locationName}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Footer Verification Action Buttons */}
				<div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						className="rounded-xl text-xs font-semibold border-slate-300 text-slate-600"
					>
						Tutup
					</Button>

					{isRejectOpen ? (
						<div className="flex items-center gap-2 flex-1 max-w-md justify-end">
							<Input
								placeholder="Tuliskan alasan penolakan presensi..."
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								className="h-9 text-xs bg-white border-rose-300"
							/>
							<Button
								size="sm"
								disabled={isSubmitting || !rejectionReason.trim()}
								onClick={() => handleAction("reject")}
								className="h-9 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shrink-0 gap-1.5"
							>
								{isSubmitting && (
									<RefreshCw className="w-3.5 h-3.5 animate-spin" />
								)}
								<span>Konfirmasi Tolak</span>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsRejectOpen(false)}
								className="h-9 text-xs text-slate-500"
							>
								Batal
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-2.5 justify-end">
							<Button
								variant="outline"
								size="sm"
								disabled={isSubmitting}
								onClick={() => setIsRejectOpen(true)}
								className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 gap-1.5 px-4"
							>
								<XCircle className="w-4 h-4" />
								<span>Tolak Presensi</span>
							</Button>

							<Button
								size="sm"
								disabled={isSubmitting}
								onClick={() => handleAction("approve")}
								className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-1.5 px-5"
							>
								{isSubmitting ? (
									<RefreshCw className="w-4 h-4 animate-spin" />
								) : (
									<CheckCircle2 className="w-4 h-4" />
								)}
								<span>Setujui (Approve)</span>
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
