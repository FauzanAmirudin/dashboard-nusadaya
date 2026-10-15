"use client";

import { Eye, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authFetch } from "@/lib/eden";
import { formatReferralCategory } from "@/lib/referral";

export function TabRespons() {
	const router = useRouter();
	const [responses, setResponses] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchResponses = async () => {
		setIsLoading(true);
		try {
			const res = await authFetch("/pmb/form-responses");
			const data = await res.json();
			if (data.success) {
				setResponses(data.data || []);
			} else {
				toast.error(data.message || "Gagal memuat data antrean respons");
			}
		} catch (error) {
			console.error("Failed to fetch responses", error);
			toast.error("Terjadi kesalahan jaringan saat memuat respons");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchResponses();
	}, []);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div>
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-semibold text-slate-800">
							Menunggu Persetujuan
						</h3>
						{!isLoading && responses.length > 0 && (
							<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#0517B0]">
								{responses.length} Antrean
							</span>
						)}
					</div>
					<p className="text-sm text-slate-500">
						Tinjau dan setujui data pendaftar baru yang telah dikirim melalui
						tautan formulir.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={fetchResponses}
					disabled={isLoading}
					className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9"
				>
					<RotateCw
						className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
					/>
					Refresh Data
				</Button>
			</div>

			<div className="border border-slate-200 rounded-md bg-white">
				<Table>
					<TableHeader className="bg-slate-50">
						<TableRow>
							<TableHead>Nama Pendaftar</TableHead>
							<TableHead>No. HP / WhatsApp</TableHead>
							<TableHead>Asal Sekolah</TableHead>
							<TableHead>Asal Referral</TableHead>
							<TableHead>Program Diminati</TableHead>
							<TableHead>Waktu Submit</TableHead>
							<TableHead className="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-8">
									Memuat data...
								</TableCell>
							</TableRow>
						) : responses.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-8 text-slate-500"
								>
									Belum ada data pendaftar baru.
								</TableCell>
							</TableRow>
						) : (
							responses.map((r) => (
								<TableRow key={r.id}>
									<TableCell className="font-medium text-slate-900">
										{r.name}
									</TableCell>
									<TableCell>{r.phone || "-"}</TableCell>
									<TableCell>{r.schoolOrigin || "-"}</TableCell>
									<TableCell>
										{r.referralInstitutionName ? (
											<div>
												<span className="font-medium text-slate-800 block text-xs truncate max-w-[150px]">
													{r.referralInstitutionName}
												</span>
												<span className="text-[10px] text-slate-500">
													{formatReferralCategory(r.referralCategory)}
												</span>
											</div>
										) : r.referralCategory ? (
											<span className="text-xs text-slate-600">
												{formatReferralCategory(r.referralCategory)}
											</span>
										) : (
											<span className="text-slate-400 text-xs">-</span>
										)}
									</TableCell>
									<TableCell>
										<PeminatanBadge
											subProgram={r.subProgram}
											program={r.program}
										/>
									</TableCell>
									<TableCell>
										{new Date(r.submittedAt).toLocaleDateString("id-ID", {
											day: "numeric",
											month: "short",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													router.push(`/dashboard/pmb/responses/${r.id}`)
												}
												className="border-slate-200 hover:bg-slate-50"
											>
												<Eye className="w-4 h-4 mr-2" />
												Lihat Detail
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
