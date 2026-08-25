"use client";

import type React from "react";
import type { ReactNode } from "react";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PanelHeaderProps {
	/** Icon element (e.g. <PhoneCall className="w-5 h-5" />) */
	icon: ReactNode;
	/** Main title of the panel */
	title: ReactNode;
	/** Optional subtitle/description text */
	subtitle?: ReactNode;
	/** Optional progress tag e.g. "[0/8]" or "Progres: 10/14" */
	progressTag?: ReactNode;
	/** Optional badge element on the right (e.g. <PanelStatusBadge />) */
	badge?: ReactNode;
	/** Optional action buttons or controls on the right */
	actions?: ReactNode;
	/** Optional content below the title/actions row (e.g. Progress bar) */
	children?: ReactNode;
	/** Optional additional className */
	className?: string;
}

/**
 * Premium Neumorphic (Soft UI) Panel Header Component
 *
 * Implements Doppelrand double-bezel shell with tactile lighting
 * and concentric rounded squircles.
 */
export function PanelHeader({
	icon,
	title,
	subtitle,
	progressTag,
	badge,
	actions,
	children,
	className,
}: PanelHeaderProps) {
	return (
		<div
			className={cn(
				"relative rounded-2xl p-[3px] transition-all duration-500 mb-6 select-none",
				className,
			)}
			style={{
				background:
					"linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(226, 232, 240, 0.7) 100%)",
				boxShadow:
					"8px 8px 20px rgba(163, 177, 198, 0.45), -8px -8px 20px rgba(255, 255, 255, 0.95), 0 1px 3px rgba(0, 0, 0, 0.03)",
			}}
		>
			<div
				className="rounded-[calc(1rem-2px)] p-4 sm:p-5 relative overflow-hidden"
				style={{
					backgroundColor: "#f4f7fb",
					boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.95)",
				}}
			>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					{/* Left: Inset Icon & Title/Subtitle */}
					<div className="flex items-center gap-3.5 min-w-0">
						{/* Neumorphic Inset (Concave) Icon Box */}
						<div
							className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl shrink-0 flex items-center justify-center text-[#0517B0]"
							style={{
								backgroundColor: "#f0f4f9",
								boxShadow:
									"inset 3px 3px 6px rgba(163, 177, 198, 0.45), inset -3px -3px 6px rgba(255, 255, 255, 0.95)",
							}}
						>
							{icon}
						</div>

						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<CardTitle className="text-slate-800 text-base sm:text-lg font-bold tracking-tight">
									{title}
								</CardTitle>
								{progressTag && (
									<div className="inline-flex items-center">{progressTag}</div>
								)}
							</div>
							{subtitle && (
								<p className="text-xs sm:text-sm text-slate-500 mt-0.5">
									{subtitle}
								</p>
							)}
						</div>
					</div>

					{/* Right: Badges & Action Buttons */}
					{(badge || actions) && (
						<div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
							{actions}
							{badge}
						</div>
					)}
				</div>

				{/* Optional Bottom Area (e.g. Progress Bars) */}
				{children && (
					<div className="mt-4 pt-3.5 border-t border-slate-200/70">
						{children}
					</div>
				)}
			</div>
		</div>
	);
}
