"use client";

import {
	AlertCircle,
	ArrowLeft,
	Briefcase,
	Calendar,
	Camera,
	CheckCircle2,
	Clock,
	Compass,
	Loader2,
	MapPin,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { SelfieCheckinModal } from "@/components/mahasiswa/SelfieCheckinModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

export default function AbsenOdsPage() {
	const { user } = useAuthStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [hasCheckedIn, setHasCheckedIn] = useState(false);
	const [checkinDetails, setCheckinDetails] = useState<any>(null);

	return (
		<div className="max-w-3xl mx-auto space-y-5 pb-12">
			{/* Top Bar Navigation */}
			<div className="flex items-center justify-between gap-3">
				<Link
					href="/mahasiswa/dashboard"
					className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Kembali ke Dashboard</span>
				</Link>

				<Badge className="bg-purple-600 text-white text-[11px] font-bold px-3 py-1">
					PRESENSI ON-DUTY SERVICE (ODS)
				</Badge>
			</div>

			{/* Hero Banner Header */}
			<div className="rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-800 to-purple-950 text-white p-6 shadow-md relative overflow-hidden">
				<div className="relative z-10 space-y-1.5">
					<div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-purple-100">
						<Briefcase className="w-3.5 h-3.5 text-purple-200" />
						<span>Program Vokasi & Pengalaman Kerja Nyata</span>
					</div>
					<h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
						Presensi On-Duty Service (ODS)
					</h1>
					<p className="text-xs sm:text-sm text-purple-100/90 max-w-xl">
						Lakukan absensi saat bertugas di unit bisnis dan layanan operasional
						Nusadaya Academy untuk pencatatan jam kerja nyata Anda.
					</p>
				</div>
				<Briefcase className="absolute -bottom-6 -right-6 w-40 h-40 text-white/5 pointer-events-none" />
			</div>

			{/* Main Card */}
			<Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
				<CardHeader className="bg-slate-50/60 border-b border-slate-100 p-5">
					<div className="flex items-start justify-between gap-3">
						<div>
							<Badge className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 mb-1.5">
								SESI ODS AKTIF
							</Badge>
							<CardTitle className="text-lg font-extrabold text-slate-900">
								Penugasan On-Duty Service Mahasiswa
							</CardTitle>
							<p className="text-xs text-slate-500 mt-0.5">
								Unit Bisnis & Layanan Nusadaya
							</p>
						</div>

						<div className="text-right">
							<p className="font-mono font-bold text-sm text-slate-800">
								Shift Operasional
							</p>
							<p className="text-[11px] text-slate-500 font-medium">Hari Ini</p>
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-6 space-y-5">
					{/* Petunjuk & Syarat */}
					<div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 text-xs text-purple-950 space-y-2">
						<h4 className="font-bold flex items-center gap-1.5 text-purple-900">
							<Sparkles className="w-4 h-4 text-purple-600" />
							Petunjuk Presensi ODS:
						</h4>
						<ul className="list-disc pl-5 space-y-1 text-slate-700">
							<li>Pastikan Anda telah berada di lokasi penugasan ODS.</li>
							<li>
								Ambil foto selfie di tempat penugasan dengan pakaian kerja rapi.
							</li>
							<li>
								Sistem otomatis merekam geotag koordinat GPS dan menyematkannya
								ke foto.
							</li>
						</ul>
					</div>

					{/* Status Presensi */}
					{hasCheckedIn ? (
						<div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-4">
							<CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
							<div className="text-xs space-y-1 flex-1">
								<p className="font-bold text-sm text-emerald-950">
									Presensi ODS Anda Berhasil Tercatat
								</p>
								<p className="text-emerald-800">
									{checkinDetails?.message ||
										"Data kehadiran ODS telah tersimpan dan masuk ke penilaian rekap vokasi."}
								</p>
								{checkinDetails?.data?.locationName && (
									<p className="text-slate-600 flex items-center gap-1 text-[11px]">
										<MapPin className="w-3 h-3 text-slate-400" />
										<span>Lokasi: {checkinDetails.data.locationName}</span>
									</p>
								)}
							</div>
						</div>
					) : (
						<div className="pt-2">
							<Button
								size="lg"
								onClick={() => setIsModalOpen(true)}
								className="w-full h-13 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all gap-2"
							>
								<Camera className="w-5 h-5" />
								<span>Buka Kamera & Absen Selfie ODS</span>
							</Button>
							<p className="text-center text-[11px] text-slate-400 mt-2">
								Peramban akan meminta izin akses kamera dan lokasi GPS Anda
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Modal Selfie */}
			<SelfieCheckinModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				attendanceType="ods"
				title="Presensi Selfie On-Duty Service"
				subtitle={`Mahasiswa: ${user?.fullName || "Mahasiswa"} • Unit Bisnis`}
				studentName={user?.fullName || "Mahasiswa"}
				studentNim={user?.username || "-"}
				onSuccess={(data) => {
					setHasCheckedIn(true);
					setCheckinDetails(data);
				}}
			/>
		</div>
	);
}
