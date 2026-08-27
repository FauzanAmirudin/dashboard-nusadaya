"use client";

import {
	AlertTriangle,
	Clock,
	LogOut,
	RefreshCw,
	ShieldAlert,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { useAuthStore } from "@/store";

export function IdleTimeoutProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isAuthenticated } = useAuthStore();
	const {
		isWarningOpen,
		remainingSeconds,
		isRefreshing,
		stayLoggedIn,
		logout,
	} = useIdleTimer();

	// Format remaining seconds into MM:SS
	const minutes = Math.floor(remainingSeconds / 60);
	const seconds = remainingSeconds % 60;
	const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

	// Percentage of 120s remaining
	const progressPercent = Math.min(
		100,
		Math.max(0, (remainingSeconds / 120) * 100),
	);

	return (
		<>
			{children}

			{/* Modal Peringatan Sesi Idle */}
			{isAuthenticated && isWarningOpen && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
					<div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in zoom-in-95 duration-200 text-slate-900">
						{/* Header with Warning Badge */}
						<div className="flex items-center gap-3 mb-4">
							<div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
								<Clock className="w-6 h-6 animate-pulse" />
							</div>
							<div>
								<h3 className="text-lg font-bold text-slate-900 tracking-tight">
									Sesi Anda Segera Berakhir
								</h3>
								<p className="text-xs text-slate-500 font-medium">
									Tidak ada aktivitas terdeteksi pada akun Anda
								</p>
							</div>
						</div>

						{/* Countdown Display */}
						<div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
							<span className="text-xs uppercase tracking-wider font-semibold text-slate-500 block mb-1">
								Sesi akan otomatis ditutup dalam:
							</span>
							<div className="text-3xl font-extrabold text-amber-600 font-mono tracking-wider mb-2">
								{formattedTime}
							</div>

							{/* Progress Bar */}
							<div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000 ease-linear rounded-full"
									style={{ width: `${progressPercent}%` }}
								/>
							</div>
						</div>

						<p className="text-xs text-slate-600 mb-6 leading-relaxed">
							Untuk menjaga keamanan data internal kampus, sistem akan melakukan
							logout otomatis jika tidak ada konfirmasi aktivitas. Klik{" "}
							<strong>Tetap Masuk</strong> untuk melanjutkan pekerjaan Anda.
						</p>

						{/* Action Buttons */}
						<div className="flex flex-col-reverse sm:flex-row items-center gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={logout}
								className="w-full sm:w-1/2 h-11 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-xs rounded-xl gap-2"
							>
								<LogOut className="w-4 h-4" />
								Logout Sekarang
							</Button>
							<Button
								type="button"
								onClick={stayLoggedIn}
								disabled={isRefreshing}
								className="w-full sm:w-1/2 h-11 bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md gap-2"
							>
								{isRefreshing ? (
									<>
										<RefreshCw className="w-4 h-4 animate-spin" />
										Menyambung...
									</>
								) : (
									<>
										<RefreshCw className="w-4 h-4" />
										Tetap Masuk
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
