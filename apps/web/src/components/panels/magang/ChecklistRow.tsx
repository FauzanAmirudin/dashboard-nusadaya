"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import type React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Pola baris checklist Panel PMB (pmb/TabChecklist.tsx), dipakai bersama tab Magang.

export function ChecklistGroup({
	title,
	done,
	total,
	children,
}: {
	title: string;
	done: number;
	total: number;
	children: React.ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
			<div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
				<h3 className="text-sm sm:text-base font-bold text-slate-900">
					{title}
				</h3>
				<span
					className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
						done >= total
							? "bg-emerald-100 text-emerald-800"
							: "bg-amber-100 text-amber-800"
					}`}
				>
					{done} / {total} selesai
				</span>
			</div>
			<ul className="divide-y divide-slate-100">{children}</ul>
		</section>
	);
}

/** Grup lipat untuk item yang tidak mempengaruhi ACC. */
export function OptionalGroup({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Collapsible className="overflow-hidden rounded-xl border border-slate-200 bg-white">
			<CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between gap-3 bg-slate-50 px-4 sm:px-6 text-left hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0517B0]/40">
				<span className="text-sm font-semibold text-slate-700">
					{title}
					<span className="ml-2 font-normal text-slate-500">
						tidak mempengaruhi ACC
					</span>
				</span>
				<ChevronDown className="w-4 h-4 shrink-0 text-slate-500 transition-transform group-data-[panel-open]:rotate-180" />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<ul className="divide-y divide-slate-100 border-t border-slate-200">
					{children}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}

/** Satu baris: checkbox + label + deskripsi + field detail (children) + unggah berkas. */
export function ChecklistRow({
	id,
	label,
	step,
	desc,
	tag,
	warning,
	checked,
	loading,
	disabled,
	onCheckedChange,
	upload,
	children,
}: {
	id: string;
	label: string;
	/** Nomor urut langkah, ditampilkan tenang di depan judul. */
	step?: number;
	desc?: string;
	tag?: string;
	/** Peringatan non-blokir, mis. urutan langkah belum sesuai. */
	warning?: string;
	checked: boolean;
	loading?: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
	upload?: React.ReactNode;
	children?: React.ReactNode;
}) {
	return (
		<li
			className={`px-4 py-4 sm:px-6 transition-colors ${checked ? "bg-emerald-50/60" : "bg-white"}`}
		>
			<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] md:items-start md:gap-6">
				<div className="flex min-w-0 items-start gap-1">
					{/* Area sentuh 44x44px (WCAG target size) di sekeliling checkbox 20px */}
					<span className="-ml-2.5 flex size-11 shrink-0 items-center justify-center">
						<Checkbox
							id={`chk-${id}`}
							checked={checked}
							disabled={disabled || loading}
							onCheckedChange={(v) => onCheckedChange(!!v)}
							className="size-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 focus-visible:ring-2 focus-visible:ring-[#0517B0]/40"
						/>
					</span>
					<div className="min-w-0 flex-1 pt-2.5">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<label
								htmlFor={`chk-${id}`}
								className="text-sm font-semibold text-slate-900 cursor-pointer [overflow-wrap:anywhere]"
							>
								{step !== undefined && (
									<span className="mr-1.5 font-normal tabular-nums text-slate-400">
										{step}
									</span>
								)}
								{label}
							</label>
							{tag && (
								<span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-600">
									{tag}
								</span>
							)}
							{loading && (
								<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" />
							)}
						</div>
						{desc && (
							<p
								className="mt-0.5 text-xs text-slate-500 line-clamp-2"
								title={desc}
							>
								{desc}
							</p>
						)}
						{warning && (
							<p
								role="status"
								className="mt-1 text-xs font-medium text-amber-800"
							>
								{warning}
							</p>
						)}
						{children &&
							(checked ? (
								/* Langkah selesai: detailnya jadi sekunder, dilipat agar
								   daftar tetap ringkas. Belum selesai: tetap terbuka. */
								<Collapsible defaultOpen={false} className="mt-2">
									<CollapsibleTrigger className="group inline-flex min-h-11 items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40 rounded-md">
										Lihat detail
										<ChevronDown className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
									</CollapsibleTrigger>
									<CollapsibleContent>
										<div className="pb-1">{children}</div>
									</CollapsibleContent>
								</Collapsible>
							) : (
								<div className="mt-3">{children}</div>
							))}
					</div>
				</div>
				{upload && (
					<div className="min-w-0 space-y-3 pl-9 md:pl-0">{upload}</div>
				)}
			</div>
		</li>
	);
}

/** Label + kontrol untuk field detail di dalam baris. */
export function RowField({
	label,
	htmlFor,
	children,
}: {
	label: string;
	htmlFor?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="min-w-0 space-y-1">
			<label
				htmlFor={htmlFor}
				className="block text-xs font-medium text-slate-600"
			>
				{label}
			</label>
			{children}
		</div>
	);
}

export const rowInputClass = "h-9 text-sm bg-white";

/** Nilai input type=date dari string tanggal ISO/DB. */
export const toDateInput = (v: unknown) =>
	v ? new Date(v as string).toISOString().split("T")[0] : "";
