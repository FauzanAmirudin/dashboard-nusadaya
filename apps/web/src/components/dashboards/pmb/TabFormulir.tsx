"use client";

import { Check, Copy, Eye, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authFetch } from "@/lib/eden";
import {
	EmptyState,
	fmtDateTime,
	ListSkeleton,
	type ResponseState,
	StateBadge,
	tabNames,
} from "./shared";

const shortToken = (t: string) =>
	t.length > 14 ? `${t.slice(0, 8)}…${t.slice(-4)}` : t;

export function TabFormulir() {
	const router = useRouter();
	const [tokens, setTokens] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [copiedId, setCopiedId] = useState<number | null>(null);

	const fetchTokens = async () => {
		setIsLoading(true);
		try {
			const res = await authFetch("/pmb/form-tokens");
			const data = await res.json();
			if (data.success) {
				setTokens(data.data || []);
			} else {
				toast.error(data.message || "Gagal memuat data formulir");
			}
		} catch (error) {
			console.error("Failed to fetch tokens", error);
			toast.error("Terjadi kesalahan jaringan saat memuat tautan");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTokens();
	}, []);

	const generateToken = async () => {
		setIsCreating(true);
		try {
			const res = await authFetch("/pmb/form-tokens", { method: "POST" });
			const data = await res.json();
			if (data.success) {
				toast.success("Tautan formulir berhasil dibuat");
				fetchTokens();
			} else {
				toast.error(data.message || "Gagal membuat tautan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsCreating(false);
		}
	};

	const copyLink = (id: number, token: string, rejectedTabs?: number[]) => {
		let url = `${window.location.origin}/form/${token}`;
		if (rejectedTabs && rejectedTabs.length > 0) {
			url += `?tab=${Math.min(...rejectedTabs)}`;
		}
		navigator.clipboard.writeText(url);
		toast.success("Tautan berhasil disalin!");
		setCopiedId(id);
		setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
	};

	const rows = tokens.map((t) => {
		const state: ResponseState =
			t.isUsed || t.response?.status === "APPROVED"
				? "APPROVED"
				: t.response?.status === "PENDING"
					? "PENDING"
					: t.response?.status === "REJECTED"
						? "REJECTED"
						: "EMPTY";
		const rejectedTabs: number[] = Array.isArray(t.response?.rejectedTabs)
			? t.response.rejectedTabs
			: [];
		return { t, state, rejectedTabs };
	});

	const StatusCell = ({
		state,
		rejectedTabs,
	}: {
		state: ResponseState;
		rejectedTabs: number[];
	}) => (
		<div className="flex flex-col items-start gap-1">
			<StateBadge state={state} />
			{state === "REJECTED" && rejectedTabs.length > 0 && (
				<span className="text-[11px] font-medium text-rose-600 [overflow-wrap:anywhere]">
					Perbaiki: {tabNames(rejectedTabs)}
				</span>
			)}
		</div>
	);

	const Actions = ({ r }: { r: (typeof rows)[number] }) => {
		// Tautan dimatikan backend begitu pendaftaran di-ACC
		// (lihat routes/form-register.ts), jadi tombol salin tidak lagi relevan.
		const isApproved = r.state === "APPROVED";
		const canView = Boolean(r.t.response?.id);

		if (isApproved && !canView) {
			return <span className="text-xs text-slate-400">—</span>;
		}

		return (
			<div className="flex flex-wrap items-center gap-2">
				{canView && (
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							router.push(`/dashboard/pmb/responses/${r.t.response.id}`)
						}
						className="h-11 md:h-9 flex-1 md:flex-none gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold cursor-pointer"
					>
						<Eye className="w-3.5 h-3.5" />
						Lihat
					</Button>
				)}
				{!isApproved && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => copyLink(r.t.id, r.t.token, r.rejectedTabs)}
						className="h-11 md:h-9 flex-1 md:flex-none gap-1.5 border-blue-200 text-[#0517B0] hover:bg-blue-50 text-xs font-semibold cursor-pointer"
					>
						{copiedId === r.t.id ? (
							<>
								<Check className="w-3.5 h-3.5" />
								Tersalin
							</>
						) : (
							<>
								<Copy className="w-3.5 h-3.5" />
								Salin Tautan
							</>
						)}
					</Button>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<h3 className="text-lg font-semibold text-slate-800">
						Manajemen Tautan Formulir
					</h3>
					<p className="text-sm text-slate-500">
						Buat dan kelola tautan pendaftaran untuk mahasiswa baru.
					</p>
				</div>
				<div className="grid gap-2 sm:flex sm:items-center">
					<Button
						onClick={generateToken}
						disabled={isCreating}
						className="h-11 sm:h-9 gap-1.5 bg-[#0517B0] hover:bg-blue-800 text-xs cursor-pointer"
					>
						<Plus className="w-4 h-4" />
						{isCreating ? "Membuat..." : "Buat Tautan Baru"}
					</Button>
				</div>
			</div>

			{isLoading && tokens.length === 0 ? (
				<ListSkeleton />
			) : rows.length === 0 ? (
				<EmptyState
					title="Belum ada tautan formulir."
					hint="Klik Buat Tautan Baru, lalu bagikan tautannya ke calon mahasiswa."
				/>
			) : (
				<>
					{/* Desktop / tablet: tabel */}
					<div className="hidden md:block border border-slate-200 rounded-md bg-white">
						<Table>
							<TableHeader className="bg-slate-50">
								<TableRow>
									<TableHead>Tautan</TableHead>
									<TableHead>Pendaftar</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Dibuat</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((r) => (
									<TableRow key={r.t.id}>
										<TableCell
											className="font-mono text-xs text-slate-500"
											title={r.t.token}
										>
											{shortToken(r.t.token)}
										</TableCell>
										<TableCell className="font-medium text-slate-800">
											{r.t.response?.name || (
												<span className="text-slate-400 italic font-normal text-xs">
													Belum ada data
												</span>
											)}
										</TableCell>
										<TableCell className="whitespace-normal">
											<StatusCell
												state={r.state}
												rejectedTabs={r.rejectedTabs}
											/>
										</TableCell>
										<TableCell className="text-xs text-slate-600">
											<div>{fmtDateTime(r.t.createdAt)}</div>
											<div className="text-slate-400">
												{r.t.creator?.fullName || "-"}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end">
												<Actions r={r} />
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Mobile: kartu */}
					<ul className="space-y-3 md:hidden">
						{rows.map((r) => (
							<li
								key={r.t.id}
								className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
							>
								<div className="flex items-start justify-between gap-3">
									<p className="min-w-0 font-semibold text-slate-900 [overflow-wrap:anywhere]">
										{r.t.response?.name || (
											<span className="text-slate-400 italic font-normal text-sm">
												Belum ada data
											</span>
										)}
									</p>
									<StatusCell state={r.state} rejectedTabs={r.rejectedTabs} />
								</div>
								<p className="text-xs text-slate-500">
									{fmtDateTime(r.t.createdAt)} · {r.t.creator?.fullName || "-"}
								</p>
								<p className="font-mono text-[11px] text-slate-400">
									{shortToken(r.t.token)}
								</p>
								<Actions r={r} />
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
