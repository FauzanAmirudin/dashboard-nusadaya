"use client";

import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Compass,
	Download,
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
import React, { useEffect, useState } from "react";
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
import { API_URL, getFileUrl, getToken } from "@/lib/eden";
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
	const [imgError, setImgError] = useState(false);

	const resolvedPhotoUrl = record?.selfieUrl
		? getFileUrl(record.selfieUrl)
		: null;

	useEffect(() => {
		setImgError(false);
	}, [record?.selfieUrl]);

	if (!record) return null;

	const studentCoords =
		record.latitude && record.longitude
			? { latitude: record.latitude, longitude: record.longitude }
			: { latitude: -5.40145, longitude: 105.2114 };

	// Default Nusadaya Campus Bandar Lampung checkpoint
	const checkpointCoords = { latitude: -5.40145, longitude: 105.2114 };

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

	const getVerificationBadge = () => {
		switch (record.verificationStatus) {
			case "approved":
				return { label: "Disetujui", className: "bg-emerald-600 text-white" };
			case "auto_approved":
				return {
					label: "Auto Approved",
					className: "bg-emerald-600 text-white",
				};
			case "rejected":
				return { label: "Ditolak", className: "bg-rose-600 text-white" };
			case "pending_review":
			default:
				return {
					label: "Perlu Verifikasi",
					className: "bg-amber-500 text-white animate-pulse",
				};
		}
	};

	const vBadge = getVerificationBadge();

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className="w-full max-w-3xl sm:max-w-4xl p-0 overflow-hidden rounded-2xl border-slate-200 shadow-2xl bg-white max-h-[90vh] flex flex-col"
				aria-describedby="selfie-detail-desc"
			>
				{/* Header Modal Ringkas & Informatif */}
				<div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
					<div className="flex items-center gap-2.5">
						<div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
							<ShieldCheck className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-sm sm:text-base font-bold text-slate-900">
								Verifikasi Bukti Presensi
							</DialogTitle>
							<p
								id="selfie-detail-desc"
								className="text-xs text-slate-500 font-medium truncate max-w-md"
							>
								{record.title || "Presensi"} •{" "}
								{record.student?.name || "Mahasiswa"}
								{record.student?.nim ? ` (${record.student.nim})` : ""}
							</p>
						</div>
					</div>

					<Badge
						className={cn(
							"text-[11px] font-bold px-2.5 py-0.5",
							vBadge.className,
						)}
					>
						{vBadge.label}
					</Badge>
				</div>

				{/* Two-Column Grid Body Pas & Proporsional */}
				<div className="p-4 sm:p-5 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
					{/* Left: Foto Selfie */}
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
								Foto Selfie
							</h4>
							{resolvedPhotoUrl && (
								<a
									href={resolvedPhotoUrl}
									target="_blank"
									rel="noreferrer"
									className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
									title="Buka foto ukuran penuh di tab baru"
								>
									<ExternalLink className="w-3 h-3" />
									<span>Buka Penuh</span>
								</a>
							)}
						</div>

						<div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs group h-[210px] sm:h-[220px] flex items-center justify-center">
							{resolvedPhotoUrl && !imgError ? (
								<img
									src={resolvedPhotoUrl}
									alt="Foto Selfie Presensi"
									onError={() => setImgError(true)}
									className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-102"
								/>
							) : imgError ? (
								<div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
									<AlertTriangle className="w-7 h-7 text-amber-500" />
									<span className="text-xs text-slate-300 font-medium">
										Gagal memuat preview foto
									</span>
									{resolvedPhotoUrl && (
										<a
											href={resolvedPhotoUrl}
											target="_blank"
											rel="noreferrer"
											className="text-xs text-blue-400 underline mt-1"
										>
											Buka foto langsung
										</a>
									)}
								</div>
							) : (
								<div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
									<User className="w-10 h-10 stroke-[1.5]" />
									<span className="text-xs">Foto tidak tersedia</span>
								</div>
							)}

							{resolvedPhotoUrl && !imgError && (
								<div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-white flex items-center gap-1">
									<ShieldCheck className="w-3 h-3 text-emerald-400" />
									<span>Tervalidasi Sistem</span>
								</div>
							)}
						</div>

						{/* Detail Info Card */}
						<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
							<div className="flex items-center justify-between text-slate-600">
								<span>Waktu Server:</span>
								<span className="font-mono font-bold text-slate-800">
									{formattedTime} WIB
								</span>
							</div>
							<div className="flex items-center justify-between text-slate-600">
								<span>Status Presensi:</span>
								<Badge
									variant="outline"
									className={cn(
										"text-[10px] font-bold px-2 py-0.5",
										record.status === "hadir"
											? "text-emerald-700 border-emerald-300 bg-emerald-50"
											: "text-amber-700 border-amber-300 bg-amber-50",
									)}
								>
									{record.status?.toUpperCase()}
								</Badge>
							</div>
							{record.rejectionReason && (
								<div className="pt-1 text-rose-700 border-t border-rose-200/60 mt-1 text-[11px]">
									<span className="font-bold">Alasan Ditolak: </span>
									<span>{record.rejectionReason}</span>
								</div>
							)}
						</div>
					</div>

					{/* Right: Geolokasi & Peta Leaflet */}
					<div className="space-y-2.5 flex flex-col">
						<div className="flex items-center justify-between">
							<h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
								Geolokasi GPS
							</h4>
							<span
								className={cn(
									"text-[11px] font-bold px-2 py-0.5 rounded-md",
									record.isWithinRadius
										? "text-emerald-700 bg-emerald-100"
										: "text-rose-700 bg-rose-100",
								)}
							>
								{record.isWithinRadius ? "Dalam Radius" : "Luar Radius"}
							</span>
						</div>

						{/* Map Container Compact & Proporsional */}
						<div className="h-[210px] sm:h-[220px] rounded-xl overflow-hidden border border-slate-200 shadow-xs relative">
							<DynamicMap
								studentCoords={studentCoords}
								checkpointCoords={checkpointCoords}
								radiusMeters={150}
								studentName={record.student?.name || "Mahasiswa"}
								checkpointLabel="Titik Kampus"
								className="w-full h-full"
								height="210px"
							/>
						</div>

						{/* Location Metrics Grid */}
						<div className="grid grid-cols-2 gap-2 text-xs">
							<div className="p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl space-y-0.5">
								<span className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
									<Compass className="w-3.5 h-3.5" />
									Jarak Kampus
								</span>
								<p className="text-sm font-extrabold text-blue-950 font-mono">
									{record.distanceFromCheckpoint !== undefined &&
									record.distanceFromCheckpoint !== null
										? `${record.distanceFromCheckpoint} meter`
										: "Dalam radius"}
								</p>
							</div>

							<div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
								<span className="text-[10px] text-slate-600 font-semibold flex items-center gap-1">
									<MapPin className="w-3.5 h-3.5 text-slate-400" />
									Akurasi GPS
								</span>
								<p className="text-sm font-extrabold text-slate-800 font-mono">
									±{record.gpsAccuracy || 10} m
								</p>
							</div>
						</div>

						{/* Reverse Geocode Address */}
						{record.locationName && (
							<div className="p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-[11px] flex items-center gap-1.5 text-slate-700">
								<MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
								<p className="truncate text-slate-600">
									<strong className="text-slate-800">Alamat:</strong>{" "}
									{record.locationName}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Footer Verification Action Buttons Ramping */}
				<div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={onClose}
							className="h-8 rounded-lg text-xs font-semibold border-slate-300 text-slate-600 px-3"
						>
							Tutup
						</Button>

						{resolvedPhotoUrl && (
							<Button
								variant="outline"
								size="sm"
								type="button"
								onClick={() => {
									const a = document.createElement("a");
									a.href = resolvedPhotoUrl;
									a.download = `bukti_selfie_${record.student?.nim || record.id}.jpg`;
									a.target = "_blank";
									a.click();
								}}
								className="h-8 rounded-lg text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5 px-3"
							>
								<Download className="w-3.5 h-3.5" />
								<span>Unduh Foto</span>
							</Button>
						)}
					</div>

					{isRejectOpen ? (
						<div className="flex items-center gap-2 flex-1 max-w-md justify-end">
							<Input
								placeholder="Alasan penolakan presensi..."
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								className="h-8 text-xs bg-white border-rose-300"
							/>
							<Button
								size="sm"
								disabled={isSubmitting || !rejectionReason.trim()}
								onClick={() => handleAction("reject")}
								className="h-8 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shrink-0 gap-1 px-3"
							>
								{isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
								<span>Konfirmasi Tolak</span>
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsRejectOpen(false)}
								className="h-8 text-xs text-slate-500 px-2.5"
							>
								Batal
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-2 justify-end">
							<Button
								variant="outline"
								size="sm"
								disabled={isSubmitting}
								onClick={() => setIsRejectOpen(true)}
								className="h-8 rounded-lg text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 gap-1.5 px-3.5"
							>
								<XCircle className="w-3.5 h-3.5" />
								<span>Tolak Presensi</span>
							</Button>

							<Button
								size="sm"
								disabled={isSubmitting}
								onClick={() => handleAction("approve")}
								className="h-8 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 px-4"
							>
								{isSubmitting ? (
									<RefreshCw className="w-3.5 h-3.5 animate-spin" />
								) : (
									<CheckCircle2 className="w-3.5 h-3.5" />
								)}
								<span>Setujui</span>
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
