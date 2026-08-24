"use client";

import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL, getToken } from "@/lib/eden";

interface TabRumahJuangProps {
	studentId: number;
	pmbData: any;
	canEdit: boolean;
	onUpdate: () => void;
}

export function TabRumahJuang({
	studentId,
	pmbData,
	canEdit,
	onUpdate,
}: TabRumahJuangProps) {
	const [rumahJuang, setRumahJuang] = useState<boolean>(!!pmbData?.rumahJuang);
	const [isSavingRumahJuang, setIsSavingRumahJuang] = useState(false);

	useEffect(() => {
		setRumahJuang(!!pmbData?.rumahJuang);
	}, [pmbData]);

	const handleToggleRumahJuang = async (val: boolean) => {
		if (!canEdit) return;
		setIsSavingRumahJuang(true);
		setRumahJuang(val);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/rumah-juang`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ rumahJuang: val }),
				},
			);
			if (res.ok) {
				toast.success(
					val
						? "Status Rumah Juang diaktifkan"
						: "Status Rumah Juang dinonaktifkan",
				);
				onUpdate();
			} else {
				setRumahJuang(!val);
				toast.error("Gagal memperbarui status Rumah Juang");
			}
		} catch (error) {
			setRumahJuang(!val);
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setIsSavingRumahJuang(false);
		}
	};

	return (
		<Card className="border border-slate-200 shadow-sm">
			<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4">
				<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
					<Home className="w-4 h-4 text-rose-600" />
					Status Fasilitas Rumah Juang
				</CardTitle>
			</CardHeader>
			<CardContent className="p-6 space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<h4 className="font-bold text-slate-800 text-sm">
								Status Keaktifan Rumah Juang
							</h4>
							{rumahJuang ? (
								<Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold">
									AKTIF
								</Badge>
							) : (
								<Badge className="bg-slate-200 text-slate-600 border-slate-300 text-xs font-semibold">
									NON-AKTIF
								</Badge>
							)}
						</div>
						<p className="text-xs text-slate-500">
							{rumahJuang
								? "Mahasiswa ini terdaftar dan aktif menggunakan fasilitas Rumah Juang. Tagihan & fitur upload berkas di Panel Finance akan diaktifkan."
								: "Mahasiswa ini tidak memilih/menggunakan fasilitas Rumah Juang. Fitur upload berkas di Panel Finance akan dinonaktifkan."}
						</p>
					</div>

					{canEdit && (
						<div className="flex items-center gap-3">
							<span className="text-xs font-semibold text-slate-600">
								{rumahJuang ? "Aktif" : "Non-Aktif"}
							</span>
							<button
								type="button"
								disabled={isSavingRumahJuang}
								onClick={() => handleToggleRumahJuang(!rumahJuang)}
								className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
									rumahJuang ? "bg-emerald-600" : "bg-slate-300"
								}`}
							>
								<span
									className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
										rumahJuang ? "translate-x-5" : "translate-x-0"
									}`}
								/>
							</button>
						</div>
					)}
				</div>

				<div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-800 space-y-1">
					<span className="font-bold block">Catatan Penting:</span>
					<p>
						Penentuan status Rumah Juang ini berdampak langsung pada Panel
						Keuangan (Finance Dashboard). Apabila berstatus{" "}
						<strong>Non-Aktif</strong>, opsi upload berkas PDF bukti pembayaran
						Rumah Juang pada Panel Finance akan terkunci secara otomatis.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
