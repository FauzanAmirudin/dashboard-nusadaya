"use client";

import { Copy, Eye, Plus, RotateCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

export function TabFormulir() {
	const router = useRouter();
	const [tokens, setTokens] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchTokens = async () => {
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
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTokens();
	}, []);

	const generateToken = async () => {
		try {
			const res = await authFetch("/pmb/form-tokens", {
				method: "POST",
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Tautan formulir berhasil dibuat");
				fetchTokens();
			} else {
				toast.error(data.message || "Gagal membuat tautan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		}
	};

	const copyLink = (token: string, rejectedTabs?: number[]) => {
		let url = `${window.location.origin}/form/${token}`;
		if (rejectedTabs && rejectedTabs.length > 0) {
			const firstTab = Math.min(...rejectedTabs);
			url += `?tab=${firstTab}`;
		}
		navigator.clipboard.writeText(url);
		toast.success("Tautan berhasil disalin!");
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-lg font-semibold text-slate-800">
						Manajemen Tautan Formulir
					</h3>
					<p className="text-sm text-slate-500">
						Buat dan kelola tautan pendaftaran untuk mahasiswa baru.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={fetchTokens}
						disabled={isLoading}
						className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9"
					>
						<RotateCw
							className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					<Button
						onClick={generateToken}
						className="bg-[#0517B0] hover:bg-blue-800 h-9 text-xs"
					>
						<Plus className="w-4 h-4 mr-1.5" />
						Buat Tautan Baru
					</Button>
				</div>
			</div>

			<div className="border border-slate-200 rounded-md bg-white">
				<Table>
					<TableHeader className="bg-slate-50">
						<TableRow>
							<TableHead className="w-[260px]">Tautan (Token)</TableHead>
							<TableHead>Pendaftar</TableHead>
							<TableHead>Dibuat Oleh</TableHead>
							<TableHead>Tanggal Dibuat</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8">
									Memuat data...
								</TableCell>
							</TableRow>
						) : tokens.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center py-8 text-slate-500"
								>
									Belum ada tautan formulir yang dibuat.
								</TableCell>
							</TableRow>
						) : (
							tokens.map((t) => {
								const isApproved =
									t.isUsed || t.response?.status === "APPROVED";
								const isPending = !t.isUsed && t.response?.status === "PENDING";
								const isRejected =
									!t.isUsed && t.response?.status === "REJECTED";
								const rejectedTabs: number[] = Array.isArray(
									t.response?.rejectedTabs,
								)
									? t.response.rejectedTabs
									: [];

								return (
									<TableRow key={t.id}>
										<TableCell className="font-mono text-sm text-slate-600 truncate max-w-[200px]">
											{t.token}
										</TableCell>
										<TableCell className="font-medium text-slate-800">
											{t.response?.name || (
												<span className="text-slate-400 italic font-normal text-xs">
													Belum ada data
												</span>
											)}
										</TableCell>
										<TableCell>{t.creator?.fullName || "-"}</TableCell>
										<TableCell>
											{new Date(t.createdAt).toLocaleDateString("id-ID", {
												day: "numeric",
												month: "short",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</TableCell>
										<TableCell>
											<div className="flex flex-col gap-1 items-start">
												{isApproved ? (
													<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
														Selesai (Di-ACC)
													</Badge>
												) : isPending ? (
													<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
														Menunggu Review
													</Badge>
												) : isRejected ? (
													<>
														<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
															Perlu Revisi
														</Badge>
														{rejectedTabs.length > 0 && (
															<span className="text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
																Tab: {rejectedTabs.map((i) => i + 1).join(", ")}
															</span>
														)}
													</>
												) : (
													<Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none">
														Belum Diisi
													</Badge>
												)}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												{t.response?.id && (
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															router.push(
																`/dashboard/pmb/responses/${t.response.id}`,
															)
														}
														className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold gap-1"
														title="Buka & Tinjau Data Respons Formulir Pendaftar"
													>
														<Eye className="w-3.5 h-3.5" />
														Lihat Respons
													</Button>
												)}
												<Button
													variant="outline"
													size="sm"
													onClick={() => copyLink(t.token, rejectedTabs)}
													className="border-blue-200 text-[#0517B0] hover:bg-blue-50 text-xs"
												>
													<Copy className="w-3.5 h-3.5 mr-1.5" />
													Salin Tautan
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
