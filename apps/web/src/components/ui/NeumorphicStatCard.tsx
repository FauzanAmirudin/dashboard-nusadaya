"use client";

import type { LucideIcon } from "lucide-react";
import React, { type ElementType, isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatCardColor =
	| "blue"
	| "emerald"
	| "green"
	| "amber"
	| "rose"
	| "indigo"
	| "sky"
	| "violet";

export interface NeumorphicStatCardProps {
	/** Title/label of the metric */
	label: string;
	/** Main numerical or text value */
	value: number | string;
	/** Icon component (Lucide) or ReactNode */
	icon: LucideIcon | ReactNode | ElementType;
	/** Color accent scheme for left border and icon */
	color?: StatCardColor | string;
	/** Optional custom text color for value */
	valueColor?: string;
	/** Optional subtext / description */
	subtext?: string;
	/** Optional click handler */
	onClick?: () => void;
	/** Optional additional className */
	className?: string;
}

const COLOR_MAP: Record<
	string,
	{
		accentGradient: string;
		accentBar: string;
		iconColor: string;
		iconGlow: string;
		valueColor: string;
		lightBg: string;
		hoverGlow: string;
	}
> = {
	blue: {
		accentGradient: "from-blue-600 to-indigo-700",
		accentBar: "bg-[#0517B0]",
		iconColor: "text-[#0517B0]",
		iconGlow: "rgba(5, 23, 176, 0.15)",
		valueColor: "text-slate-900",
		lightBg: "bg-blue-50/70",
		hoverGlow: "group-hover:shadow-[0_12px_28px_-6px_rgba(5,23,176,0.18)]",
	},
	emerald: {
		accentGradient: "from-emerald-500 to-teal-600",
		accentBar: "bg-emerald-500",
		iconColor: "text-emerald-600",
		iconGlow: "rgba(16, 185, 129, 0.18)",
		valueColor: "text-emerald-950",
		lightBg: "bg-emerald-50/70",
		hoverGlow: "group-hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.18)]",
	},
	green: {
		accentGradient: "from-green-500 to-emerald-600",
		accentBar: "bg-emerald-500",
		iconColor: "text-emerald-600",
		iconGlow: "rgba(16, 185, 129, 0.18)",
		valueColor: "text-slate-900",
		lightBg: "bg-emerald-50/70",
		hoverGlow: "group-hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.18)]",
	},
	amber: {
		accentGradient: "from-amber-500 to-orange-500",
		accentBar: "bg-amber-500",
		iconColor: "text-amber-600",
		iconGlow: "rgba(245, 158, 11, 0.18)",
		valueColor: "text-slate-900",
		lightBg: "bg-amber-50/70",
		hoverGlow: "group-hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.18)]",
	},
	rose: {
		accentGradient: "from-rose-500 to-red-600",
		accentBar: "bg-rose-500",
		iconColor: "text-rose-600",
		iconGlow: "rgba(244, 63, 94, 0.18)",
		valueColor: "text-slate-900",
		lightBg: "bg-rose-50/70",
		hoverGlow: "group-hover:shadow-[0_12px_28px_-6px_rgba(244,63,94,0.18)]",
	},
	indigo: {
		accentGradient: "from-indigo-600 to-violet-700",
		accentBar: "bg-indigo-600",
		iconColor: "text-indigo-600",
		iconGlow: "rgba(99, 102, 241, 0.18)",
		valueColor: "text-slate-900",
		lightBg: "bg-indigo-50/70",
		hoverGlow: "group-hover:shadow-[0_12px_28px_-6px_rgba(99,102,241,0.18)]",
	},
	sky: {
		accentGradient: "from-sky-500 to-cyan-600",
		accentBar: "bg-sky-500",
		iconColor: "text-sky-600",
		iconGlow: "rgba(14, 165, 233, 0.18)",
		valueColor: "text-sky-950",
		lightBg: "bg-sky-50/70",
		hoverGlow: "group-hover:shadow-[0_12px_28px_-6px_rgba(14,165,233,0.18)]",
	},
	violet: {
		accentGradient: "from-violet-600 to-purple-700",
		accentBar: "bg-violet-600",
		iconColor: "text-violet-600",
		iconGlow: "rgba(139, 92, 246, 0.18)",
		valueColor: "text-slate-900",
		lightBg: "bg-violet-50/70",
		hoverGlow: "group-hover:shadow-[0_12px_28px_-6px_rgba(139,92,246,0.18)]",
	},
};

/**
 * Premium Neumorphic (Soft UI) Stat Card
 *
 * Implements High-End Agency & Taste Skill Architecture:
 * - "Double-Bezel" (Doppelrand) nested structure with concentric radii
 * - Dual-layer ambient lighting with crisp top specular highlights
 * - Tactile concave inset squircle for icons with micro-kinetic spring physics
 * - Smooth cubic-bezier transitions with active haptic push feedback
 */
export function NeumorphicStatCard({
	label,
	value,
	icon,
	color = "blue",
	valueColor,
	subtext,
	onClick,
	className,
}: NeumorphicStatCardProps) {
	const theme = COLOR_MAP[color] || COLOR_MAP.blue;

	const renderIcon = () => {
		if (!icon) return null;
		if (isValidElement(icon)) {
			return icon;
		}
		const Component = icon as unknown as ElementType;
		return <Component className="w-5 h-5" />;
	};

	return (
		<div
			onClick={onClick}
			className={cn(
				"group relative rounded-2xl p-[3px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] select-none",
				"hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]",
				theme.hoverGlow,
				onClick && "cursor-pointer",
				className,
			)}
			style={{
				background:
					"linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(226, 232, 240, 0.7) 100%)",
				boxShadow:
					"7px 7px 18px rgba(163, 177, 198, 0.45), -7px -7px 18px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(0, 0, 0, 0.04)",
			}}
		>
			{/* Inner Core Surface */}
			<div
				className="relative overflow-hidden rounded-[calc(1rem-2px)] p-3.5 sm:p-4 flex items-center gap-3.5 transition-colors duration-300"
				style={{
					backgroundColor: "#f4f7fb",
					boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.9)",
				}}
			>
				{/* Sleek Vertical Accent Bar with Gradient Pill */}
				<div
					className={cn(
						"absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-gradient-to-b transition-all duration-300 group-hover:w-2",
						theme.accentGradient,
					)}
				/>

				{/* Tactile Inset Squircle for Icon */}
				<div
					className={cn(
						"relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0 flex items-center justify-center ml-1",
						"transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
						"group-hover:scale-105 group-hover:rotate-1",
						theme.iconColor,
					)}
					style={{
						backgroundColor: "#f0f4f9",
						boxShadow:
							"inset 3px 3px 6px rgba(163, 177, 198, 0.45), inset -3px -3px 6px rgba(255, 255, 255, 0.95)",
					}}
				>
					{/* Micro-glow on hover */}
					<div
						className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
						style={{
							background: `radial-gradient(circle at center, ${theme.iconGlow} 0%, transparent 70%)`,
						}}
					/>
					<div className="relative z-10">{renderIcon()}</div>
				</div>

				{/* Text Content */}
				<div className="min-w-0 flex-1 pl-0.5">
					<p className="text-slate-500 text-[11px] sm:text-xs font-semibold leading-tight line-clamp-1 tracking-tight group-hover:text-slate-700 transition-colors">
						{label}
					</p>
					<p
						className={cn(
							"text-xl sm:text-2xl font-black mt-0.5 tracking-tight leading-none",
							valueColor || theme.valueColor,
						)}
					>
						{value}
					</p>
					{subtext && (
						<p className="text-[10px] text-slate-400 mt-1 leading-none font-medium">
							{subtext}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
