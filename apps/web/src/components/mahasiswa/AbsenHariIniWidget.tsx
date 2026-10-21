"use client";

import {
	AlertCircle,
	BookOpen,
	Briefcase,
	Calendar,
	Camera,
	CheckCircle2,
	ChevronRight,
	Clock,
	Compass,
	MapPin,
	Sparkles,
	Sunrise,
	Users,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { SelfieCheckinModal } from "./SelfieCheckinModal";

interface AbsenItem {
	type: "baris_pagi" | "kuliah" | "piket" | "ods";
	title: string;
	time: string;
	location: string;
	status: "hadir" | "terlambat" | "belum" | "tidak_ada";
	link: string;
	sessionId?: number;
	scheduleId?: number;
	dutyScheduleId?: number;
	details?: string;
	selfieUrl?: string;
}

export function AbsenHariIniWidget() {
	const { user } = useAuthStore();
	const [items, setItems] = useState<AbsenItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeModal, setActiveModal] = useState<{
		type: "baris_pagi" | "kuliah" | "piket" | "ods";
		title: string;
		subtitle: string;
		sessionId?: number;
		scheduleId?: number;
		dutyScheduleId?: number;
	} | null>(null);

	const fetchTodayStatus = async () => {
		try {
			const token = getToken();
			if (!token) return;

			// Fetch Baris Pagi
			const bpRes = await fetch(`${API_URL}/attendance/baris-pagi/today`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const bpJson = await bpRes.json();

			const newItems: AbsenItem[] = [];

			// 1. Baris Pagi
			if (bpJson.success && bpJson.data?.hasSession) {
				const bpData = bpJson.data;
				const checkin = bpData.studentCheckin;
				newItems.push({
					type: "baris_pagi",
					title: "Apel Baris Pagi",
					time: `${bpData.session?.checkInWindowStart} - ${bpData.session?.checkInWindowEnd} WIB`,
					location: bpData.session?.location || "Lapangan Utama",
					status: checkin ? checkin.status : "belum",
					link: "/mahasiswa/panel/akademik",
					sessionId: bpData.session?.id,
					details: `Target tepat waktu: ${bpData.session?.targetTime} WIB`,
					selfieUrl: checkin?.selfieUrl,
				});
			} else {
				newItems.push({
					type: "baris_pagi",
					title: "Apel Baris Pagi",
					time: "06:00 - 07:00 WIB",
					location: "Lapangan Utama",
					status: "tidak_ada",
					link: "/mahasiswa/panel/akademik",
					details: "Tidak ada jadwal apel pagi hari ini",
				});
			}

			// 2. Kuliah
			newItems.push({
				type: "kuliah",
				title: "Presensi Perkuliahan",
				time: "Sesuai Jadwal Kelas",
				location: "Ruang Kelas & Lab",
				status: "belum",
				link: "/mahasiswa/absen/kuliah",
				details: "Presensi mandiri ruang kelas & praktikum",
			});

			// 3. Piket
			newItems.push({
				type: "piket",
				title: "Presensi Piket Kampus",
				time: "Pagi / Sore",
				location: "Gedung & Area Kampus",
				status: "belum",
				link: "/mahasiswa/absen/piket",
				details: "Presensi kebersihan & piket harian",
			});

			// 4. ODS
			newItems.push({
				type: "ods",
				title: "Presensi On-Duty Service (ODS)",
				time: "Shift Kerja",
				location: "Unit Usaha / ODS",
				status: "belum",
				link: "/mahasiswa/absen/ods",
				details: "Presensi program vokasi & unit usaha",
			});

			setItems(newItems);
		} catch (err) {
			console.error("Gagal memuat status absensi hari ini:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTodayStatus();
	}, []);

	const handleOpenSelfie = (item: AbsenItem) => {
		setActiveModal({
			type: item.type,
			title: `Presensi Selfie ${item.title}`,
			subtitle: `${item.location} • ${item.time}`,
			sessionId: item.sessionId,
			scheduleId: item.scheduleId,
			dutyScheduleId: item.dutyScheduleId,
		});
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
						<Camera className="w-4 h-4" />
					</div>
					<div>
						<h3 className="text-base font-extrabold text-slate-900">
							Presensi Terintegrasi Hari Ini
						</h3>
						<p className="text-xs text-slate-500">
							Sistem presensi GPS & selfie mandiri mahasiswa (Kuliah, Piket,
							Apel Pagi, ODS)
						</p>
					</div>
				</div>
			</div>

			{/* Grid Cards 4 Layanan */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
				{items.map((item) => {
					const isHadir =
						item.status === "hadir" || item.status === "terlambat";
					const isBelum = item.status === "belum";

					return (
						<div
							key={item.type}
							className={cn(
								"p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between",
								isHadir
									? "bg-emerald-50/50 border-emerald-200/90"
									: isBelum
										? "bg-white border-blue-200/90 shadow-sm hover:shadow-md"
										: "bg-slate-50/70 border-slate-200/80 opacity-80",
							)}
						>
							<div className="space-y-2.5">
								<div className="flex items-start justify-between gap-2">
									<div
										className={cn(
											"w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
											item.type === "baris_pagi"
												? "bg-amber-100 text-amber-700"
												: item.type === "kuliah"
													? "bg-blue-100 text-blue-700"
													: item.type === "piket"
														? "bg-teal-100 text-teal-700"
														: "bg-purple-100 text-purple-700",
										)}
									>
										{item.type === "baris_pagi" && (
											<Sunrise className="w-4 h-4" />
										)}
										{item.type === "kuliah" && <BookOpen className="w-4 h-4" />}
										{item.type === "piket" && <Users className="w-4 h-4" />}
										{item.type === "ods" && <Briefcase className="w-4 h-4" />}
									</div>

									{isHadir ? (
										<Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 border-0">
											HADIR
										</Badge>
									) : isBelum ? (
										<Badge className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 animate-pulse border-0">
											BELUM ABSEN
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-[10px] text-slate-400 border-slate-200"
										>
											TIDAK ADA
										</Badge>
									)}
								</div>

								<div>
									<h4 className="font-bold text-slate-800 text-sm leading-snug">
										{item.title}
									</h4>
									<p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
										<Clock className="w-3 h-3 text-slate-400 shrink-0" />
										<span className="truncate">{item.time}</span>
									</p>
									<p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
										<MapPin className="w-3 h-3 text-slate-400 shrink-0" />
										<span className="truncate">{item.location}</span>
									</p>
								</div>
							</div>

							<div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
								{isHadir ? (
									<div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
										<CheckCircle2 className="w-3.5 h-3.5" />
										<span>Tercatat Hadir</span>
									</div>
								) : isBelum ? (
									<Button
										size="sm"
										onClick={() => handleOpenSelfie(item)}
										className="w-full h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs gap-1"
									>
										<Camera className="w-3 h-3" />
										<span>Absen Sekarang</span>
									</Button>
								) : (
									<span className="text-[11px] text-slate-400 italic">
										Tidak dijadwalkan
									</span>
								)}

								<Link
									href={item.link}
									className="text-slate-400 hover:text-slate-600 transition-colors p-1"
									title="Detail Halaman"
								>
									<ChevronRight className="w-4 h-4" />
								</Link>
							</div>
						</div>
					);
				})}
			</div>

			{/* Modal Selfie Launcher */}
			{activeModal && (
				<SelfieCheckinModal
					isOpen={!!activeModal}
					onClose={() => setActiveModal(null)}
					attendanceType={activeModal.type}
					title={activeModal.title}
					subtitle={activeModal.subtitle}
					sessionId={activeModal.sessionId}
					scheduleId={activeModal.scheduleId}
					dutyScheduleId={activeModal.dutyScheduleId}
					studentName={user?.fullName || "Mahasiswa"}
					studentNim={user?.username || "-"}
					onSuccess={() => {
						fetchTodayStatus();
					}}
				/>
			)}
		</div>
	);
}
