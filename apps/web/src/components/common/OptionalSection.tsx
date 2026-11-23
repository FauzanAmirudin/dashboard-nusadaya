"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OptionalSectionProps {
	title: string;
	/** Jumlah isian yang sudah terisi; > 0 membuka bagian ini secara default. */
	filledCount: number;
	children: ReactNode;
}

/** Bagian lipat untuk isian sekunder. Terbuka otomatis bila sudah ada isinya. */
export function OptionalSection({
	title,
	filledCount,
	children,
}: OptionalSectionProps) {
	// Terbuka otomatis hanya saat pertama dirender. Setelah itu kendali ada di
	// pengguna, supaya bagian yang sudah ditutup tidak membuka sendiri saat mengetik.
	const [open, setOpen] = useState(filledCount > 0);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="group flex w-full min-h-11 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40">
				<span className="flex min-w-0 flex-wrap items-center gap-2">
					{title}
					<span className="text-xs font-normal text-slate-500">(opsional)</span>
					{filledCount > 0 && (
						<span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#0517B0]">
							{filledCount} terisi
						</span>
					)}
				</span>
				<ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-data-[panel-open]:rotate-180" />
			</CollapsibleTrigger>
			<CollapsibleContent className="pt-4">{children}</CollapsibleContent>
		</Collapsible>
	);
}
