"use client";

import { Check } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormProgressProps {
	steps: string[];
	current: number;
	onSelect: (index: number) => void;
	/** Indeks langkah yang perlu diperbaiki (revisi PMB). */
	flagged?: number[];
}

/** Progres tenang: "Langkah X dari N" + bilah tipis + menu pilih langkah. */
export function FormProgress({
	steps,
	current,
	onSelect,
	flagged = [],
}: FormProgressProps) {
	const [open, setOpen] = useState(false);
	const total = steps.length;
	return (
		<div className="mb-6">
			<div className="flex items-end justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs text-slate-500">
						Langkah {current + 1} dari {total}
					</p>
					<h2 className="truncate text-lg font-semibold text-slate-900">
						{steps[current]}
					</h2>
				</div>
				<Button
					type="button"
					variant="ghost"
					onClick={() => setOpen(true)}
					className="h-11 shrink-0 px-3 text-sm font-medium text-[#0517B0] hover:bg-blue-50 cursor-pointer"
				>
					Pilih langkah
				</Button>
			</div>
			<div
				className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200"
				role="progressbar"
				aria-valuemin={1}
				aria-valuemax={total}
				aria-valuenow={current + 1}
			>
				<div
					className="h-full rounded-full bg-[#0517B0] transition-all duration-300"
					style={{ width: `${((current + 1) / total) * 100}%` }}
				/>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="top-auto bottom-0 left-0 w-full max-w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-xl p-4 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
					<DialogHeader>
						<DialogTitle>Pilih langkah</DialogTitle>
					</DialogHeader>
					<ul className="max-h-[60vh] space-y-1 overflow-y-auto">
						{steps.map((name, idx) => {
							const isFlagged = flagged.includes(idx);
							return (
								<li key={name}>
									<button
										type="button"
										onClick={() => {
											setOpen(false);
											onSelect(idx);
										}}
										className={cn(
											"flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm transition-colors cursor-pointer hover:bg-slate-100",
											idx === current
												? "bg-blue-50 font-semibold text-[#0517B0]"
												: "text-slate-700",
										)}
									>
										<span className="min-w-0 truncate">
											{idx + 1}. {name}
										</span>
										{isFlagged && (
											<span className="shrink-0 text-xs font-medium text-rose-600">
												Perlu diperbaiki
											</span>
										)}
									</button>
								</li>
							);
						})}
					</ul>
				</DialogContent>
			</Dialog>
		</div>
	);
}

interface FormNavProps {
	isFirst: boolean;
	isLast: boolean;
	loading?: boolean;
	onBack: () => void;
	onNext: () => void;
	onSubmit: () => void;
	submitLabel: string;
}

/** Navigasi bawah: satu tombol utama, mudah dijangkau ibu jari di mobile. */
export function FormNav({
	isFirst,
	isLast,
	loading,
	onBack,
	onNext,
	onSubmit,
	submitLabel,
}: FormNavProps) {
	return (
		<div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-slate-200 bg-white px-4 py-3 sm:mx-0 sm:rounded-b-xl">
			<div className="flex items-center gap-3">
				{!isFirst && (
					<Button
						type="button"
						variant="outline"
						onClick={onBack}
						disabled={loading}
						className="h-12 px-5 cursor-pointer"
					>
						Kembali
					</Button>
				)}
				{isLast ? (
					<Button
						type="button"
						onClick={onSubmit}
						disabled={loading}
						className="h-12 flex-1 bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700 sm:ml-auto sm:flex-none sm:min-w-48 cursor-pointer"
					>
						{loading ? "Memproses..." : submitLabel}
					</Button>
				) : (
					<Button
						type="button"
						onClick={onNext}
						className="h-12 flex-1 bg-[#0517B0] text-base font-semibold text-white hover:bg-blue-800 sm:ml-auto sm:flex-none sm:min-w-48 cursor-pointer"
					>
						Lanjut
					</Button>
				)}
			</div>
		</div>
	);
}

interface FormMessageScreenProps {
	title: string;
	/** "success" menambahkan satu tanda centang kecil di judul. */
	tone?: "success" | "neutral";
	children?: ReactNode;
	actions?: ReactNode;
}

/** Layar penutup form (berhasil, ditolak, disetujui, tautan tidak valid) dengan kerangka yang sama dengan form. */
export function FormMessageScreen({
	title,
	tone = "neutral",
	children,
	actions,
}: FormMessageScreenProps) {
	return (
		<div className="min-h-screen bg-slate-50 px-4 sm:px-6">
			<div className="mx-auto max-w-md">
				<header className="flex items-center gap-2.5 py-5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/icon.svg" alt="" className="h-7 w-7 object-contain" />
					<span className="text-lg font-semibold tracking-tight text-slate-900">
						OneData <span className="font-light text-[#0517B0]">Nusadaya</span>
					</span>
				</header>
				<div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
					<h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
						{tone === "success" && (
							<Check className="h-5 w-5 shrink-0 text-emerald-600" />
						)}
						{title}
					</h1>
					{children && (
						<div className="mt-2 text-sm leading-relaxed text-slate-600">
							{children}
						</div>
					)}
					{actions && <div className="mt-6 space-y-2">{actions}</div>}
				</div>
			</div>
		</div>
	);
}
