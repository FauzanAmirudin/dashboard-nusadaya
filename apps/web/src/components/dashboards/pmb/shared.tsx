"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const fmtDateTime = (v?: string | Date | null) =>
	v
		? new Date(v).toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: "-";

/** Nama tab form tautan (urutan baru; indeks sama dengan nomor tab yang ditolak). */
export const FORM_TAB_NAMES = [
	"Mahasiswa",
	"Pendidikan",
	"Kesehatan",
	"Wali",
	"Ayah",
	"Ibu",
	"Informasi PMB",
];

export const tabNames = (indices: number[]) =>
	indices.map((i) => FORM_TAB_NAMES[i] ?? `Tab ${i + 1}`).join(", ");

export type ResponseState = "EMPTY" | "PENDING" | "REJECTED" | "APPROVED";

const STATE_STYLE: Record<ResponseState, { label: string; cls: string }> = {
	EMPTY: { label: "Belum diisi", cls: "bg-slate-100 text-slate-600" },
	PENDING: { label: "Menunggu review", cls: "bg-blue-100 text-blue-700" },
	REJECTED: { label: "Perlu revisi", cls: "bg-amber-100 text-amber-700" },
	APPROVED: {
		label: "Selesai (di-ACC)",
		cls: "bg-emerald-100 text-emerald-700",
	},
};

export function StateBadge({ state }: { state: ResponseState }) {
	const s = STATE_STYLE[state];
	return <Badge className={`${s.cls} border-none`}>{s.label}</Badge>;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<div className="space-y-3" aria-busy="true" aria-live="polite">
			{Array.from({ length: rows }, (_, i) => (
				<div
					key={i}
					className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
				>
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-3 w-2/3" />
					<Skeleton className="h-3 w-1/2" />
				</div>
			))}
		</div>
	);
}

export function EmptyState({
	title,
	hint,
	action,
}: {
	title: string;
	hint?: string;
	action?: ReactNode;
}) {
	return (
		<div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
			<p className="text-sm font-semibold text-slate-700">{title}</p>
			{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
			{action && <div className="mt-4 flex justify-center">{action}</div>}
		</div>
	);
}
