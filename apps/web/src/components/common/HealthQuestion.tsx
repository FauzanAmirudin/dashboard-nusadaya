"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type YesNoValue = "" | "ada" | "tidak";

interface YesNoToggleProps {
	value: YesNoValue;
	onChange: (next: "ada" | "tidak") => void;
	noLabel?: string;
	yesLabel?: string;
	ariaLabel: string;
	className?: string;
}

/** Tombol dua segmen (Tidak / Ya). Target sentuh 44px di mobile. */
export function YesNoToggle({
	value,
	onChange,
	noLabel = "Tidak ada",
	yesLabel = "Ada",
	ariaLabel,
	className,
}: YesNoToggleProps) {
	const option = (key: "tidak" | "ada", label: string) => {
		const selected = value === key;
		return (
			<button
				type="button"
				aria-pressed={selected}
				onClick={() => onChange(key)}
				className={cn(
					"min-h-11 rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40",
					selected
						? "bg-white text-[#0517B0] shadow-sm ring-1 ring-blue-200"
						: "text-slate-600 hover:bg-white/60",
				)}
			>
				{label}
			</button>
		);
	};

	return (
		<fieldset
			aria-label={ariaLabel}
			className={cn(
				"grid grid-flow-col auto-cols-fr gap-1 min-w-0 m-0 rounded-lg border border-slate-200 bg-slate-100 p-1 w-full @md:w-auto @md:min-w-56 shrink-0",
				className,
			)}
		>
			{option("tidak", noLabel)}
			{option("ada", yesLabel)}
		</fieldset>
	);
}

interface HealthQuestionProps {
	label: ReactNode;
	value: YesNoValue;
	onChange: (next: "ada" | "tidak") => void;
	noLabel?: string;
	yesLabel?: string;
	/** Isian lanjutan; tampil hanya bila jawabannya "ada". */
	children?: ReactNode;
}

/** Satu baris pertanyaan: label di kiri, pilihan di kanan, isian lanjutan di bawah. */
export function HealthQuestion({
	label,
	value,
	onChange,
	noLabel,
	yesLabel,
	children,
}: HealthQuestionProps) {
	return (
		<div className="@container py-4">
			<div className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
				<Label className="min-w-0 text-sm font-medium text-slate-800 [overflow-wrap:anywhere]">
					{label}
				</Label>
				<YesNoToggle
					value={value}
					onChange={onChange}
					noLabel={noLabel}
					yesLabel={yesLabel}
					ariaLabel={typeof label === "string" ? label : "Pilihan"}
				/>
			</div>
			{value === "ada" && children && (
				<div className="mt-3 border-l-2 border-blue-200 pl-4">{children}</div>
			)}
		</div>
	);
}
