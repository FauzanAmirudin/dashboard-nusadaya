"use client";

import React from "react";
import { getPeminatanInfo } from "@/lib/peminatan";

interface PeminatanBadgeProps {
	subProgram?: string | null;
	destinationCountry?: string | null;
	program?: string | null;
	peminatan?: string | null;
	variant?: "badge" | "inline" | "pill" | "subtle";
	size?: "xs" | "sm" | "md" | "lg";
	showCountryOnly?: boolean;
	showProgramFallback?: boolean;
	className?: string;
}

export function PeminatanBadge({
	subProgram,
	destinationCountry,
	program,
	peminatan,
	variant = "badge",
	size = "sm",
	showCountryOnly = false,
	showProgramFallback = true,
	className = "",
}: PeminatanBadgeProps) {
	const info = getPeminatanInfo(
		peminatan || subProgram,
		destinationCountry,
		program,
	);

	// Tentukan teks yang akan ditampilkan
	let displayText = info.label;
	if (showCountryOnly) {
		displayText = info.countryName;
	} else if (!info.hasCustomSubProgram && showProgramFallback && program) {
		displayText = `${info.label} (${program})`;
	}

	if (displayText === "-" && !subProgram && !destinationCountry) {
		return <span className="text-slate-400 text-xs italic">-</span>;
	}

	// Size configurations
	const sizeStyles = {
		xs: {
			badge: "px-1.5 py-0.5 text-[10px] gap-1",
			flag: "w-3.5 h-2.5 rounded-[1px]",
		},
		sm: {
			badge: "px-2 py-0.5 text-[11px] gap-1.5 font-medium",
			flag: "w-4 h-2.5 rounded-[1.5px]",
		},
		md: {
			badge: "px-2.5 py-1 text-xs gap-1.5 font-semibold",
			flag: "w-4.5 h-3 rounded-[2px]",
		},
		lg: {
			badge: "px-3 py-1.5 text-sm gap-2 font-semibold",
			flag: "w-5 h-3.5 rounded-[2px]",
		},
	}[size];

	// Variant configurations
	if (variant === "inline") {
		return (
			<span
				className={`inline-flex items-center gap-1.5 text-slate-700 font-medium ${className}`}
			>
				<img
					src={info.flag}
					alt={info.alt}
					className={`${sizeStyles.flag} object-cover shrink-0 shadow-xs border border-slate-200/80`}
					loading="lazy"
				/>
				<span className="truncate">{displayText}</span>
			</span>
		);
	}

	if (variant === "pill") {
		return (
			<span
				className={`inline-flex items-center ${sizeStyles.badge} rounded-full bg-slate-100/90 text-slate-800 border border-slate-200/90 shadow-xs ${className}`}
			>
				<img
					src={info.flag}
					alt={info.alt}
					className={`${sizeStyles.flag} object-cover shrink-0 shadow-xs border border-black/10`}
					loading="lazy"
				/>
				<span className="truncate">{displayText}</span>
			</span>
		);
	}

	if (variant === "subtle") {
		return (
			<span
				className={`inline-flex items-center ${sizeStyles.badge} rounded-md bg-blue-50/70 text-blue-900 border border-blue-100/90 ${className}`}
			>
				<img
					src={info.flag}
					alt={info.alt}
					className={`${sizeStyles.flag} object-cover shrink-0 shadow-xs border border-blue-200/60`}
					loading="lazy"
				/>
				<span className="truncate font-semibold">{displayText}</span>
			</span>
		);
	}

	// Default "badge"
	return (
		<span
			className={`inline-flex items-center ${sizeStyles.badge} rounded-md bg-white text-slate-800 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors ${className}`}
		>
			<img
				src={info.flag}
				alt={info.alt}
				className={`${sizeStyles.flag} object-cover shrink-0 shadow-xs border border-slate-200/90`}
				loading="lazy"
			/>
			<span className="truncate font-medium">{displayText}</span>
		</span>
	);
}
