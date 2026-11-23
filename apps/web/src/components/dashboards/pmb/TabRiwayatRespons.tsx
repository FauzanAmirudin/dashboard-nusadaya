"use client";

import { Eye, RotateCcw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authFetch } from "@/lib/eden";
import { EmptyState, fmtDateTime, ListSkeleton } from "./shared";

const MONTHS = [
	{ value: "1", label: "Januari" },
	{ value: "2", label: "Februari" },
	{ value: "3", label: "Maret" },
	{ value: "4", label: "April" },
	{ value: "5", label: "Mei" },
	{ value: "6", label: "Juni" },
	{ value: "7", label: "Juli" },
	{ value: "8", label: "Agustus" },
	{ value: "9", label: "September" },
	{ value: "10", label: "Oktober" },
	{ value: "11", label: "November" },
	{ value: "12", label: "Desember" },
];

export function TabRiwayatRespons() {
	const router = useRouter();
	const [history, setHistory] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const [searchQuery, setSearchQuery] = useState("");
	const [filterMonth, setFilterMonth] = useState("");
	const [filterYear, setFilterYear] = useState("");

	const fetchHistory = async () => {
		setIsLoading(true);
		try {
			const query = new URLSearchParams();
			if (filterMonth) query.append("month", filterMonth);
			if (filterYear) query.append("year", filterYear);

			const res = await authFetch(
				`/pmb/form-responses/history?${query.toString()}`,
			);
			const data = await res.json();
			if (data.success) {
				setHistory(data.data || []);
			} else {
				toast.error(data.message || "Gagal memuat riwayat respons");
			}
		} catch (error) {
			console.error("Failed to fetch history", error);
			toast.error("Terjadi kesalahan jaringan saat memuat riwayat");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchHistory();
	}, [filterMonth, filterYear]);

	const filteredData = history.filter(
		(h) =>
			h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(h.phone && h.phone.includes(searchQuery)),
	);

	const isActive = (v: string) => v !== "" && v !== "ALL";
	const hasFilter =
		searchQuery.trim() !== "" || isActive(filterMonth) || isActive(filterYear);

	const StatusBadge = ({ status }: { status: string }) =>
		status === "APPROVED" ? (
			<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
				Disetujui
			</Badge>
		) : status === "REJECTED" ? (
			<Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
				Ditolak
			</Badge>
		) : (
			<Badge variant="outline">{status}</Badge>
		);

	return (
		<div className="space-y-4">
			<div className="min-w-0">
				<h3 className="text-lg font-semibold text-slate-800">
					Riwayat Respons
				</h3>
				<p className="text-sm text-slate-500">
					Lihat histori pendaftar yang telah disetujui atau ditolak.
				</p>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative sm:w-64">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<Input
						placeholder="Cari nama atau nomor HP..."
						className="pl-9 h-11 sm:h-9 bg-white"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<div className="grid grid-cols-2 gap-2 sm:flex">
					<Select
						value={filterMonth}
						onValueChange={(val) => setFilterMonth(val || "")}
					>
						<SelectTrigger className="h-11 sm:h-9 w-full sm:w-[130px] bg-white">
							<SelectValue placeholder="Bulan" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Bulan</SelectItem>
							{MONTHS.map((m) => (
								<SelectItem key={m.value} value={m.value}>
									{m.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={filterYear}
						onValueChange={(val) => setFilterYear(val || "")}
					>
						<SelectTrigger className="h-11 sm:h-9 w-full sm:w-[110px] bg-white">
							<SelectValue placeholder="Tahun" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Tahun</SelectItem>
							<SelectItem value="2026">2026</SelectItem>
							<SelectItem value="2025">2025</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{hasFilter && (
					<Button
						variant="outline"
						onClick={() => {
							setSearchQuery("");
							setFilterMonth("ALL");
							setFilterYear("ALL");
						}}
						className="h-11 sm:h-9 gap-1.5 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium cursor-pointer"
					>
						<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
						Reset
					</Button>
				)}
			</div>

			{isLoading && history.length === 0 ? (
				<ListSkeleton />
			) : filteredData.length === 0 ? (
				<EmptyState
					title={
						hasFilter
							? "Tidak ada riwayat yang cocok."
							: "Belum ada riwayat pendaftaran."
					}
					hint={
						hasFilter
							? "Coba ubah atau reset filter."
							: "Pendaftar yang disetujui atau ditolak akan muncul di sini."
					}
				/>
			) : (
				<>
					<div className="hidden md:block border border-slate-200 rounded-md bg-white">
						<Table>
							<TableHeader className="bg-slate-50">
								<TableRow>
									<TableHead>Pendaftar</TableHead>
									<TableHead>Waktu Proses</TableHead>
									<TableHead>Diproses Oleh</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredData.map((h) => (
									<TableRow key={h.id}>
										<TableCell>
											<div className="font-medium text-slate-900">{h.name}</div>
											<div className="text-xs text-slate-500">
												{h.phone || "-"}
											</div>
										</TableCell>
										<TableCell className="text-xs text-slate-600">
											{fmtDateTime(h.processedAt)}
										</TableCell>
										<TableCell className="text-sm">
											{h.processor?.fullName || "-"}
										</TableCell>
										<TableCell>
											<StatusBadge status={h.status} />
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													router.push(`/dashboard/pmb/responses/${h.id}`)
												}
												className="gap-1.5 text-[#0517B0] border-[#0517B0]/30 hover:bg-blue-50 cursor-pointer"
											>
												<Eye className="w-4 h-4" />
												Detail
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<ul className="space-y-3 md:hidden">
						{filteredData.map((h) => (
							<li
								key={h.id}
								className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="font-semibold text-slate-900 [overflow-wrap:anywhere]">
											{h.name}
										</p>
										<p className="text-sm text-slate-500">{h.phone || "-"}</p>
									</div>
									<StatusBadge status={h.status} />
								</div>
								<p className="text-xs text-slate-500">
									{fmtDateTime(h.processedAt)} · {h.processor?.fullName || "-"}
								</p>
								<Button
									variant="outline"
									onClick={() =>
										router.push(`/dashboard/pmb/responses/${h.id}`)
									}
									className="h-11 w-full gap-2 text-[#0517B0] border-[#0517B0]/30 hover:bg-blue-50 cursor-pointer"
								>
									<Eye className="w-4 h-4" />
									Lihat Detail
								</Button>
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
