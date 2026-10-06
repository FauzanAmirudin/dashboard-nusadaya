"use client";

import { Home, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/eden";

interface TabDataTambahanProps {
	studentId: number;
	pmbData: any;
	canEdit: boolean;
	onUpdate: () => void;
}

export function TabDataTambahan({
	studentId,
	pmbData,
	canEdit,
	onUpdate,
}: TabDataTambahanProps) {
	// Fasilitas Rumah Juang
	const [rumahJuang, setRumahJuang] = useState<boolean>(!!pmbData?.rumahJuang);
	const [isSavingRumahJuang, setIsSavingRumahJuang] = useState(false);

	useEffect(() => {
		setRumahJuang(!!pmbData?.rumahJuang);
	}, [pmbData?.rumahJuang]);

	const handleSaveRumahJuang = async () => {
		if (!canEdit) return;
		setIsSavingRumahJuang(true);
		try {
			const res = await api.students[studentId.toString()].pmb[
				"rumah-juang"
			].patch({
				rumahJuang: rumahJuang,
			});
			if (res.error) {
				toast.error("Gagal memperbarui status Rumah Juang");
			} else {
				toast.success(
					rumahJuang
						? "Status Fasilitas Rumah Juang: Aktif (Peserta)"
						: "Status Fasilitas Rumah Juang: Tidak Aktif (Bukan Peserta)",
				);
				onUpdate();
			}
		} catch (err) {
			toast.error("Terjadi kesalahan jaringan saat menyimpan Rumah Juang");
		} finally {
			setIsSavingRumahJuang(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="max-w-xl">
				{/* Fasilitas Rumah Juang */}
				<Card className="border-slate-200 shadow-sm border-l-4 border-l-rose-600 flex flex-col justify-between bg-white">
					<CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
						<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
							<div className="p-1.5 bg-rose-50 text-rose-600 rounded-md border border-rose-100">
								<Home className="w-4 h-4" />
							</div>
							Fasilitas Rumah Juang
						</CardTitle>
					</CardHeader>
					<CardContent className="p-5 flex flex-col justify-between space-y-4">
						<div className="h-12 flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
							<span className="text-xs text-slate-500 font-medium">
								Status Saat Ini:
							</span>
							{pmbData?.rumahJuang ? (
								<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
									Aktif (Peserta)
								</Badge>
							) : (
								<Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium px-2.5 py-0.5">
									Tidak Aktif
								</Badge>
							)}
						</div>

						<div className="space-y-1.5 flex flex-col justify-center">
							<Label className="text-xs font-semibold text-slate-700">
								Pilih Status Fasilitas Rumah Juang
							</Label>
							<Select
								value={rumahJuang ? "aktif" : "tidak_aktif"}
								onValueChange={(v) => setRumahJuang(v === "aktif")}
								disabled={!canEdit}
							>
								<SelectTrigger className="h-9 text-xs sm:text-sm font-medium bg-white border-slate-200">
									<span className="flex items-center gap-2 truncate text-slate-800">
										<span
											className={`w-2 h-2 rounded-full ${
												rumahJuang ? "bg-emerald-500" : "bg-slate-400"
											}`}
										/>
										{rumahJuang
											? "Aktif (Peserta Rumah Juang)"
											: "Tidak Aktif (Bukan Peserta)"}
									</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="aktif">
										<span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-emerald-700">
											<span className="w-2 h-2 rounded-full bg-emerald-500" />
											Aktif (Peserta Rumah Juang)
										</span>
									</SelectItem>
									<SelectItem value="tidak_aktif">
										<span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600">
											<span className="w-2 h-2 rounded-full bg-slate-400" />
											Tidak Aktif (Bukan Peserta)
										</span>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{canEdit && (
							<Button
								size="sm"
								onClick={handleSaveRumahJuang}
								disabled={isSavingRumahJuang}
								className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 font-bold shadow-sm"
							>
								{isSavingRumahJuang ? (
									<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5 mr-1.5" />
								)}
								Simpan Status Rumah Juang
							</Button>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
