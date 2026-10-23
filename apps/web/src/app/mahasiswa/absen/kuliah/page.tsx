"use client";

import {
	AlertCircle,
	ArrowLeft,
	BookOpen,
	Calendar,
	Camera,
	CheckCircle2,
	Clock,
	GraduationCap,
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

interface ClassSchedule {
	id: number;
	subject: string;
	room: string;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	cohort: number;
	rombel: string;
	notes?: string;
}

export default function AbsenKuliahPage() {
	const { user } = useAuthStore();
	const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
	const [selectedSchedule, setSelectedSchedule] =
		useState<ClassSchedule | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [checkedInIds, setCheckedInIds] = useState<number[]>([]);

	const fetchSchedules = async () => {
		setIsLoading(true);
		try {
			const token = getToken();
			if (!token) return;

			const res = await fetch(`${API_URL}/scheduling/class-schedules`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await res.json();
			if (json.success && Array.isArray(json.data)) {
				const userCohort = (user as any)?.cohort;
				const filtered = userCohort
					? json.data.filter((s: ClassSchedule) => s.cohort === userCohort)
					: json.data;
				setSchedules(filtered);
				if (filtered.length > 0) {
					setSelectedSchedule(filtered[0]);
				}
			}
		} catch (err) {
			console.error("Gagal memuat jadwal kuliah:", err);
			toast.error("Gagal memuat jadwal kuliah");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchSchedules();
	}, [user]);

	return (
		<div className="max-w-4xl mx-auto space-y-5 pb-12">
			{/* Top Bar Navigation */}
			<div className="flex items-center justify-between gap-3">
				<Link
					href="/mahasiswa/dashboard"
					className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
				>
					<ArrowLeft className="w-4 h-4" />
					<span>Kembali ke Dashboard</span>
				</Link>

				<Badge className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1">
					PRESENSI PERKULIAHAN
				</Badge>
			</div>

			{/* Hero Banner Header */}
			<div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 shadow-md relative overflow-hidden">
				<div className="relative z-10 space-y-1.5">
					<div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-100">
						<GraduationCap className="w-3.5 h-3.5 text-blue-200" />
						<span>Sistem Absensi Selfie & Geotagging GPS</span>
					</div>
					<h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
						Presensi Kuliah Mandiri
					</h1>
					<p className="text-xs sm:text-sm text-blue-100/90 max-w-xl">
						Pilih mata kuliah yang sedang berlangsung, pastikan Anda berada di
						ruang kelas, lalu ambil foto selfie ber-watermark.
					</p>
				</div>
				<BookOpen className="absolute -bottom-6 -right-6 w-40 h-40 text-white/5 pointer-events-none" />
			</div>

			{isLoading ? (
				<div className="p-12 text-center flex flex-col items-center justify-center gap-3">
					<Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
					<span className="text-xs text-slate-500 font-medium">
						Memuat daftar mata kuliah...
					</span>
				</div>
			) : schedules.length === 0 ? (
				<Card className="rounded-2xl border-slate-200/90 p-8 text-center bg-white space-y-3">
					<Calendar className="w-12 h-12 text-slate-300 mx-auto" />
					<h3 className="font-bold text-slate-800 text-base">
						Tidak Ada Jadwal Kuliah Ditemukan
					</h3>
					<p className="text-xs text-slate-500 max-w-sm mx-auto">
						Belum ada jadwal perkuliahan aktif untuk angkatan Anda hari ini.
						Silakan hubungi bagian akademik jika jadwal belum muncul.
					</p>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					{/* Daftar Matkul */}
					<div className="md:col-span-1 space-y-2.5">
						<h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
							Pilih Mata Kuliah
						</h3>
						<div className="space-y-2">
							{schedules.map((schedule) => {
								const isSelected = selectedSchedule?.id === schedule.id;
								const isDone = checkedInIds.includes(schedule.id);

								return (
									<button
										type="button"
										key={schedule.id}
										onClick={() => setSelectedSchedule(schedule)}
										className={cn(
											"w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5",
											isSelected
												? "border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20"
												: "border-slate-200 bg-white hover:border-slate-300",
										)}
									>
										<div className="flex items-center justify-between gap-2">
											<span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
												{schedule.subject}
											</span>
											{isDone ? (
												<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
											) : (
												<Badge
													variant="outline"
													className="text-[10px] text-blue-600 border-blue-200"
												>
													{schedule.rombel}
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-3 text-[11px] text-slate-500">
											<span className="flex items-center gap-1 font-mono">
												<Clock className="w-3 h-3 text-slate-400" />
												{schedule.startTime} - {schedule.endTime}
											</span>
											<span className="flex items-center gap-1">
												<MapPin className="w-3 h-3 text-slate-400" />
												{schedule.room}
											</span>
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* Detail Sesi & Trigger Selfie */}
					<div className="md:col-span-2">
						{selectedSchedule ? (
							<Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
								<CardHeader className="bg-slate-50/60 border-b border-slate-100 p-5">
									<div className="flex items-start justify-between gap-3">
										<div>
											<Badge className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 mb-1.5">
												SESI KELAS AKTIF
											</Badge>
											<CardTitle className="text-lg font-extrabold text-slate-900">
												{selectedSchedule.subject}
											</CardTitle>
											<p className="text-xs text-slate-500 mt-0.5">
												{selectedSchedule.rombel} • Angkatan{" "}
												{selectedSchedule.cohort}
											</p>
										</div>

										<div className="text-right">
											<p className="font-mono font-bold text-sm text-slate-800">
												{selectedSchedule.startTime} -{" "}
												{selectedSchedule.endTime}
											</p>
											<p className="text-[11px] text-slate-500 font-medium">
												Ruang {selectedSchedule.room}
											</p>
										</div>
									</div>
								</CardHeader>

								<CardContent className="p-6 space-y-5">
									{/* Informasi Persyaratan */}
									<div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 space-y-2">
										<h4 className="font-bold flex items-center gap-1.5">
											<Sparkles className="w-4 h-4 text-blue-600" />
											Petunjuk Presensi Kuliah:
										</h4>
										<ul className="list-disc pl-5 space-y-1 text-slate-700">
											<li>
												Presensi dilakukan saat perkuliahan berlangsung di dalam
												ruangan kelas.
											</li>
											<li>
												Wajib menggunakan kamera selfie browser (webcam)
												langsung.
											</li>
											<li>
												Sistem mencatat posisi koordinat GPS presisi dan jarak
												dari titik kampus.
											</li>
										</ul>
									</div>

									{/* Status & CTA Button */}
									{checkedInIds.includes(selectedSchedule.id) ? (
										<div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
											<CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
											<div className="text-xs">
												<p className="font-bold text-sm">
													Presensi Anda Berhasil Tercatat
												</p>
												<p className="text-emerald-700 mt-0.5">
													Data kehadiran dan foto selfie telah tersimpan di
													sistem akademik.
												</p>
											</div>
										</div>
									) : (
										<div className="pt-2">
											<Button
												size="lg"
												onClick={() => setIsModalOpen(true)}
												className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all gap-2"
											>
												<Camera className="w-5 h-5" />
												<span>Buka Kamera & Absen Selfie Kuliah</span>
											</Button>
											<p className="text-center text-[11px] text-slate-400 mt-2">
												Memerlukan izin akses kamera dan lokasi pada peramban
												Anda
											</p>
										</div>
									)}
								</CardContent>
							</Card>
						) : null}
					</div>
				</div>
			)}

			{/* Selfie Modal */}
			{selectedSchedule && (
				<SelfieCheckinModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					attendanceType="kuliah"
					title={`Presensi Kuliah: ${selectedSchedule.subject}`}
					subtitle={`Ruang ${selectedSchedule.room} • ${selectedSchedule.startTime}-${selectedSchedule.endTime} WIB`}
					scheduleId={selectedSchedule.id}
					studentName={user?.fullName || "Mahasiswa"}
					studentNim={user?.username || "-"}
					onSuccess={() => {
						setCheckedInIds((prev) => [...prev, selectedSchedule.id]);
					}}
				/>
			)}
		</div>
	);
}
