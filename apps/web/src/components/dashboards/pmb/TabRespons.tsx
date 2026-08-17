"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getToken } from "@/lib/eden";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function TabRespons() {
	const router = useRouter();
	const [responses, setResponses] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchResponses = async () => {
		try {
			const res = await fetch(`${API_URL}/pmb/form-responses`, {
				headers: {
					Authorization: `Bearer ${getToken()}`,
				},
			});
			const data = await res.json();
			if (data.success) {
				setResponses(data.data);
			}
		} catch (error) {
			console.error("Failed to fetch responses", error);
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
					<h3 className="text-lg font-semibold text-slate-800">
						Menunggu Persetujuan
					</h3>
					<p className="text-sm text-slate-500">
						Tinjau dan setujui data pendaftar baru.
					</p>
				</div>
			</div>

			<div className="border border-slate-200 rounded-md bg-white">
				<Table>
					<TableHeader className="bg-slate-50">
						<TableRow>
							<TableHead>Nama Pendaftar</TableHead>
							<TableHead>No. HP / WhatsApp</TableHead>
							<TableHead>Asal Sekolah</TableHead>
							<TableHead>Program Diminati</TableHead>
							<TableHead>Waktu Submit</TableHead>
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
						) : responses.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
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
										{r.program || "-"} {r.subProgram ? `(${r.subProgram})` : ""}
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
