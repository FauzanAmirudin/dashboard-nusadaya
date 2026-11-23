import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface DetailSectionProps {
	title: string;
	/** Ringkasan kecil di sisi kanan judul (mis. "3 kontak"). */
	summary?: ReactNode;
	defaultOpen?: boolean;
	children: ReactNode;
}

/** Bagian lipat (native <details>): judul teks saja, isi dibuka sesuai kebutuhan. */
export function DetailSection({
	title,
	summary,
	defaultOpen,
	children,
}: DetailSectionProps) {
	return (
		<details
			open={defaultOpen}
			className="group rounded-xl border border-slate-200 bg-white"
		>
			<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40 sm:px-6 [&::-webkit-details-marker]:hidden">
				<span className="text-base font-semibold text-slate-900">{title}</span>
				<span className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
					{summary}
					<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
				</span>
			</summary>
			<div className="space-y-4 border-t border-slate-100 px-4 py-4 sm:px-6">
				{children}
			</div>
		</details>
	);
}
