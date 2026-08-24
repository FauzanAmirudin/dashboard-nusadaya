"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

export function LiveClock() {
	const [timeString, setTimeString] = useState<string>("");
	const [dateString, setDateString] = useState<string>("");
	const [timeZoneString, setTimeZoneString] = useState<string>("");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		const updateClock = () => {
			const now = new Date();

			// Format jam: 14:05:30
			const timeFormatted = now.toLocaleTimeString("id-ID", {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false,
			});

			// Format tanggal: Min, 23 Agu 2026
			const dateFormatted = now.toLocaleDateString("id-ID", {
				weekday: "short",
				day: "numeric",
				month: "short",
				year: "numeric",
			});

			// Ambil nama/singkatan zona waktu perangkat user
			let tz = "";
			try {
				const parts = new Intl.DateTimeFormat("id-ID", {
					timeZoneName: "short",
				}).formatToParts(now);
				const tzPart = parts.find((p) => p.type === "timeZoneName");
				tz = tzPart ? tzPart.value : "";
			} catch {
				tz = "";
			}

			setTimeString(timeFormatted);
			setDateString(dateFormatted);
			setTimeZoneString(tz);
		};

		updateClock();
		const interval = setInterval(updateClock, 1000);
		return () => clearInterval(interval);
	}, []);

	if (!mounted || !timeString) {
		return (
			<div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-400 text-xs font-mono animate-pulse">
				<Clock className="w-3.5 h-3.5" />
				<span>--:--:--</span>
			</div>
		);
	}

	return (
		<div
			className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg text-slate-700 text-xs transition-colors"
			title={`Waktu perangkat lokal Anda: ${dateString} ${timeString} ${timeZoneString}`}
		>
			<Clock className="w-3.5 h-3.5 text-[#0517B0] shrink-0" />
			<div className="flex items-center gap-1.5 font-mono font-semibold">
				<span className="text-slate-900">{timeString}</span>
				{timeZoneString && (
					<span className="text-[10px] font-sans font-bold px-1 py-0.2 bg-blue-50 text-[#0517B0] rounded border border-blue-200/60">
						{timeZoneString}
					</span>
				)}
			</div>
			<span className="hidden xl:inline-block text-slate-400 text-[11px] font-sans border-l border-slate-200 pl-2">
				{dateString}
			</span>
		</div>
	);
}
