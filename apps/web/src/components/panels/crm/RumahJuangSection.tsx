"use client";

import { Home, Loader2, Lock, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

interface RumahJuangSectionProps {
	studentId: number;
	/** Status mahasiswa; waiting list (belum lunas DP) = terkunci */
	studentStatus?: string | null;
	canEdit: boolean;
}

/**
 * Fasilitas Rumah Juang dikelola CRM setelah pembayaran awal (DP)
 * diverifikasi Finance. Data disimpan di pmb_data.rumah_juang dan
 * tetap dibaca Finance untuk penagihan.
 */
export function RumahJuangSection({
	studentId,
	studentStatus,
	canEdit,
}: RumahJuangSectionProps) {
	const [savedValue, setSavedValue] = useState(false);
	const [rumahJuang, setRumahJuang] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const isLocked = studentStatus === "menunggu_pembayaran";
	const editable = canEdit && !isLocked;

	const load = useCallback(async () => {
		try {
			const res: any = await api.students[studentId.toString()].pmb.get();
			const value = Boolean(res?.data?.data?.rumahJuang);
			setSavedValue(value);
			setRumahJuang(value);
		} catch {
			// biarkan nilai default (Tidak Aktif)
		}
	}, [studentId]);

	useEffect(() => {
		load();
	}, [load]);

	const handleSave = async () => {
		if (!editable) return;
		setIsSaving(true);
		try {
			const res: any = await api.students[studentId.toString()].pmb[
				"rumah-juang"
			].patch({ rumahJuang });
			if (res.error) {
				toast.error(
					res.error?.value?.message || "Gagal memperbarui status Rumah Juang",
				);
				return;
			}
			setSavedValue(rumahJuang);
			toast.success(
				rumahJuang
					? "Fasilitas Rumah Juang: Aktif (Peserta)"
					: "Fasilitas Rumah Juang: Tidak Aktif",
			);
		} catch {
			toast.error("Terjadi kesalahan jaringan saat menyimpan Rumah Juang");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card className="border border-slate-200 shadow-sm">
			<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between gap-3">
				<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
					<Home className="w-4 h-4 text-rose-600" />
					Fasilitas Rumah Juang
				</CardTitle>
				{savedValue ? (
					<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
						Aktif (Peserta)
					</Badge>
				) : (
					<Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium">
						Tidak Aktif
					</Badge>
				)}
			</CardHeader>
			<CardContent className="p-4 sm:p-5">
				{isLocked ? (
					<p className="flex items-start gap-2 text-sm text-slate-600">
						<Lock className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
						Tersedia setelah pembayaran awal (DP) diverifikasi Finance.
					</p>
				) : (
					<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
						<div className="flex-1 space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Status Fasilitas Rumah Juang
							</Label>
							<Select
								value={rumahJuang ? "aktif" : "tidak_aktif"}
								onValueChange={(v) => setRumahJuang(v === "aktif")}
								disabled={!editable}
							>
								<SelectTrigger className="h-10 text-sm bg-white border-slate-200">
									<SelectValue>
										{rumahJuang
											? "Aktif (Peserta Rumah Juang)"
											: "Tidak Aktif (Bukan Peserta)"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="aktif">
										Aktif (Peserta Rumah Juang)
									</SelectItem>
									<SelectItem value="tidak_aktif">
										Tidak Aktif (Bukan Peserta)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{editable && (
							<Button
								onClick={handleSave}
								disabled={isSaving || rumahJuang === savedValue}
								className="h-10 bg-[#0517B0] hover:bg-blue-800 text-white text-sm font-semibold gap-1.5"
							>
								{isSaving ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Save className="w-4 h-4" />
								)}
								Simpan
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
