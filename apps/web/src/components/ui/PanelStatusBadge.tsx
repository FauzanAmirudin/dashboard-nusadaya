"use client";

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	calculateProgressStatus,
	normalizeStatus,
	PANEL_STATUS_CONFIG,
	type PanelStatusType,
} from "@/utils/status";

export interface PanelStatusBadgeProps {
	status?: PanelStatusType | string | null;
	isAcc?: boolean | null;
	completed?: number;
	total?: number;
	size?: "sm" | "md" | "lg";
	showIcon?: boolean;
	useShortLabel?: boolean;
	className?: string;
}

export function PanelStatusBadge({
	status,
	isAcc,
	completed,
	total,
	size = "md",
	showIcon = true,
	useShortLabel = false,
	className,
}: PanelStatusBadgeProps) {
	let normalized: PanelStatusType;

	if (completed !== undefined && total !== undefined) {
		normalized = calculateProgressStatus(completed, total, isAcc);
	} else if (isAcc) {
		normalized = "ACC";
	} else {
		normalized = normalizeStatus(status);
	}

	const config = PANEL_STATUS_CONFIG[normalized];

	const sizeClasses = {
		sm: "text-[10px] px-2 py-0.2 gap-1 font-semibold",
		md: "text-xs px-2.5 py-0.5 gap-1.5 font-semibold",
		lg: "text-sm px-3 py-1 gap-2 font-bold",
	};

	const dotSizes = {
		sm: "w-1.5 h-1.5",
		md: "w-2 h-2",
		lg: "w-2.5 h-2.5",
	};

	const iconSizes = {
		sm: "w-3 h-3",
		md: "w-3.5 h-3.5",
		lg: "w-4 h-4",
	};

	const label = useShortLabel ? config.shortLabel : config.label;

	return (
		<Badge
			variant="outline"
			className={cn(
				"inline-flex items-center rounded-full border shadow-2xs transition-colors",
				config.bg,
				config.text,
				config.border,
				sizeClasses[size],
				className,
			)}
		>
			{showIcon && normalized === "ACC" && (
				<ShieldCheck
					className={cn("shrink-0 text-emerald-700", iconSizes[size])}
				/>
			)}
			{showIcon && normalized !== "ACC" && (
				<span
					className={cn(
						"rounded-full shrink-0 animate-pulse",
						config.dot,
						dotSizes[size],
					)}
				/>
			)}
			<span>{label}</span>
		</Badge>
	);
}
