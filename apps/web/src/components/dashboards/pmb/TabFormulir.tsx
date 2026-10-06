"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
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
import { API_URL, getToken } from "@/lib/eden";

export function TabFormulir() {
	const [tokens, setTokens] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchTokens = async () => {
		try {
			const token = getToken();
			const headers: Record<string, string> = {};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
			const res = await fetch(`${API_URL}/pmb/form-tokens`, {
				headers,
				credentials: "include",
			});
			const data = await res.json();
			if (data.success) {
				setTokens(data.data || []);
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
			const token = getToken();
			const headers: Record<string, string> = {};
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
			const res = await fetch(`${API_URL}/pmb/form-tokens`, {
				method: "POST",
				headers,
				credentials: "include",
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

	const copyLink = (token: string) => {
		const url = `${window.location.origin}/form/${token}`;
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
				<Button
					onClick={generateToken}
					className="bg-[#0517B0] hover:bg-blue-800"
				>
					<Plus className="w-4 h-4 mr-2" />
					Buat Tautan Baru
				</Button>
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
											{isApproved ? (
												<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
													Selesai (Di-ACC)
												</Badge>
											) : isPending ? (
												<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
													Menunggu Review
												</Badge>
											) : isRejected ? (
												<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
													Perlu Revisi
												</Badge>
											) : (
												<Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none">
													Belum Diisi
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="outline"
												size="sm"
												onClick={() => copyLink(t.token)}
												className="border-blue-200 text-[#0517B0] hover:bg-blue-50"
											>
												<Copy className="w-4 h-4 mr-2" />
												Salin Tautan
											</Button>
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
