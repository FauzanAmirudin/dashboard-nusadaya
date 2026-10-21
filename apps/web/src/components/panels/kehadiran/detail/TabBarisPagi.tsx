import {
	AlertCircle,
	Calendar,
	Camera,
	CheckCircle2,
	Clock,
	Info,
	Loader2,
	MapPin,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import {
	SelfieDetailModal,
	type SelfieRecordDetail,
} from "../SelfieDetailModal";

interface MorningAssemblyRecord {
	id: number;
	sessionId: number;
	studentId: number;
	status: "hadir" | "terlambat" | "izin" | "sakit" | "alpha";
	arrivalTime: string | null;
	minutesLate: number | null;
	notes: string | null;
	recordedAt: string;
	checkinMethod?: string;
	selfieUrl?: string | null;
	locationName?: string | null;
	distanceFromCheckpoint?: number | null;
	isWithinRadius?: boolean;
	verificationStatus?: string;
	latitude?: number;
	longitude?: number;
	gpsAccuracy?: number;
	session?: {
		id: number;
		sessionDate: string;
		targetTime: string;
		location: string;
		rombel: string;
		notes: string | null;
	};
	recorder?: {
		fullName: string | null;
	};
}

interface BarisPagiData {
	records: MorningAssemblyRecord[];
	summary: {
		total: number;
		tepatWaktu: number;
		terlambat: number;
		izin: number;
		sakit: number;
		alpha: number;
		complianceRate: number;
	};
}

export function TabBarisPagi({ studentId }: { studentId: number }) {
	const [data, setData] = useState<BarisPagiData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedRecord, setSelectedRecord] =
		useState<SelfieRecordDetail | null>(null);
	const { user } = useAuthStore();

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const res = await (api as any).attendance.mahasiswa[studentId][
				"baris-pagi"
			].get();
			if (res.data?.success) {
				setData(res.data.data);
			} else {
				toast.error("Gagal memuat rekap baris pagi mahasiswa");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan memuat data baris pagi");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
				<Loader2 className="w-6 h-6 animate-spin text-[#0517B0]" />
				<span className="text-xs font-medium text-slate-500">
					Memuat kepatuhan baris pagi mingguan...
				</span>
			</div>
		);
	}

	const records = data?.records || [];

	const getStatusBadge = (status: string, minutesLate?: number | null) => {
		switch (status) {
			case "hadir":
				return (
					<Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-semibold gap-1 text-[11px]">
						<CheckCircle2 className="w-3.5 h-3.5" />
						Tepat Waktu (≤ 06.22)
					</Badge>
				);
			case "terlambat":
				return (
					<Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 font-semibold gap-1 text-[11px]">
						<Clock className="w-3.5 h-3.5" />
						Terlambat {minutesLate ? `(+${minutesLate} mnt)` : ""}
					</Badge>
				);
			case "izin":
				return (
					<Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 font-semibold gap-1 text-[11px]">
						<Info className="w-3.5 h-3.5" />
						Izin
					</Badge>
				);
			case "sakit":
				return (
					<Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 font-semibold gap-1 text-[11px]">
						<AlertCircle className="w-3.5 h-3.5" />
						Sakit
					</Badge>
				);
			case "alpha":
				return (
					<Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 font-semibold gap-1 text-[11px]">
						<XCircle className="w-3.5 h-3.5" />
						Alpha
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="text-slate-500 text-[11px]">
						{status}
					</Badge>
				);
		}
	};

	return (
		<div className="space-y-6">
			{/* History Table Card */}
			<div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
				<div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
					<div>
						<h4 className="text-sm sm:text-base font-bold text-slate-900">
							Riwayat Presensi Baris Pagi
						</h4>
						<p className="text-xs text-slate-500">
							Pencatatan sesi baris mingguan dengan jam kedatangan aktual
							mahasiswa
						</p>
					</div>
					<Badge variant="outline" className="text-xs font-mono">
						Total {records.length} Catatan
					</Badge>
				</div>

				{records.length === 0 ? (
					<div className="p-12 text-center space-y-3">
						<div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
							<Clock className="w-6 h-6" />
						</div>
						<div className="space-y-1">
							<h5 className="text-sm font-semibold text-slate-800">
								Belum Ada Riwayat Baris Pagi
							</h5>
							<p className="text-xs text-slate-500 max-w-md mx-auto">
								Mahasiswa ini belum memiliki riwayat presensi baris pagi.
								Presensi dapat diinput oleh staf akademik melalui menu Kepatuhan
								Baris Pagi.
							</p>
						</div>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
									<th className="py-3 px-4">Tanggal Sesi</th>
									<th className="py-3 px-4">Lokasi & Rombel</th>
									<th className="py-3 px-4">Target Waktu</th>
									<th className="py-3 px-4">Jam Kedatangan</th>
									<th className="py-3 px-4">Status & Disiplin</th>
									<th className="py-3 px-4">Metode & Bukti</th>
									<th className="py-3 px-4">Catatan</th>
									<th className="py-3 px-4">Pencatat</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 font-normal">
								{records.map((rec) => {
									const isLate = rec.status === "terlambat";
									return (
										<tr
											key={rec.id}
											className={cn(
												"hover:bg-slate-50/60 transition-colors",
												isLate && "bg-amber-50/20",
											)}
										>
											<td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
												<div className="flex items-center gap-2">
													<Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
													<span>
														{rec.session?.sessionDate || "Tidak tercatat"}
													</span>
												</div>
											</td>
											<td className="py-3 px-4 text-slate-600 whitespace-nowrap">
												<div className="flex items-center gap-1.5">
													<MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
													<span>
														{rec.session?.location || "Lapangan Utama"}
													</span>
													{rec.session?.rombel && (
														<Badge
															variant="secondary"
															className="text-[10px] font-mono px-1.5 py-0"
														>
															{rec.session.rombel}
														</Badge>
													)}
												</div>
											</td>
											<td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
												{rec.session?.targetTime || "06:22"} WIB
											</td>
											<td className="py-3 px-4 whitespace-nowrap">
												{rec.arrivalTime ? (
													<span
														className={cn(
															"font-mono font-bold text-xs px-2 py-0.5 rounded-md",
															isLate
																? "bg-amber-100 text-amber-800"
																: "bg-emerald-100 text-emerald-800",
														)}
													>
														{rec.arrivalTime} WIB
													</span>
												) : (
													<span className="text-slate-400 italic">
														- Tidak tercatat -
													</span>
												)}
											</td>
											<td className="py-3 px-4 whitespace-nowrap">
												{getStatusBadge(rec.status, rec.minutesLate)}
											</td>
											<td className="py-3 px-4 whitespace-nowrap">
												{rec.selfieUrl ? (
													<button
														type="button"
														onClick={() =>
															setSelectedRecord({
																id: rec.id,
																attendanceType: "baris_pagi",
																title: `Baris Pagi - ${rec.session?.sessionDate || ""}`,
																student: {
																	id: studentId,
																	name: "Mahasiswa",
																	nim: "",
																},
																status: rec.status,
																selfieUrl: rec.selfieUrl,
																latitude: rec.latitude,
																longitude: rec.longitude,
																gpsAccuracy: rec.gpsAccuracy,
																locationName: rec.locationName || undefined,
																distanceFromCheckpoint:
																	rec.distanceFromCheckpoint || undefined,
																isWithinRadius: rec.isWithinRadius,
																selfieTakenAt: rec.recordedAt,
																verificationStatus:
																	rec.verificationStatus || "auto_approved",
															})
														}
														className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group text-left"
														title="Klik untuk melihat foto & peta lokasi"
													>
														<div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-300 group-hover:border-blue-500 shrink-0">
															<img
																src={rec.selfieUrl}
																alt="Bukti Selfie"
																className="w-full h-full object-cover"
															/>
														</div>
														<div>
															<span className="font-semibold text-[11px] text-blue-600 group-hover:underline flex items-center gap-1">
																<Camera className="w-3 h-3" />
																Selfie GPS
															</span>
															<span className="text-[10px] text-slate-400 block">
																{rec.isWithinRadius
																	? "Dalam Area"
																	: "Luar Area"}
															</span>
														</div>
													</button>
												) : (
													<Badge
														variant="outline"
														className="text-[10px] text-slate-500 border-slate-200"
													>
														{rec.checkinMethod === "self"
															? "Mandiri Web"
															: "Petugas BAAK"}
													</Badge>
												)}
											</td>
											<td className="py-3 px-4 text-slate-600 max-w-xs truncate">
												{rec.notes || "-"}
											</td>
											<td className="py-3 px-4 text-slate-500 whitespace-nowrap">
												{rec.recorder?.fullName || "Petugas Staf"}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Modal Detail Selfie */}
			{selectedRecord && (
				<SelfieDetailModal
					record={selectedRecord}
					isOpen={!!selectedRecord}
					onClose={() => setSelectedRecord(null)}
					onVerified={fetchData}
				/>
			)}
		</div>
	);
}
