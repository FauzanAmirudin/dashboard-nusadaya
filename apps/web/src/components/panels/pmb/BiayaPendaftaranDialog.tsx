"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL, getToken } from "@/lib/eden";
import { formatRupiah } from "@/utils/format";

/** Default DP pendaftaran untuk pendaftar baru (Rp 10 juta), tetap bisa diedit PMB. */
export const DEFAULT_DP_PENDAFTARAN = 10_000_000;

const MAX_NOMINAL = 999_999_999;

interface ProgramFeeDefault {
	subProgram: string;
	defaultTotalBiaya: number | null;
}

interface BiayaPendaftaranDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Dipanggil saat PMB menekan tombol konfirmasi dengan nominal yang sudah valid. */
	onConfirm: (totalBiaya: number, pendaftaranDp: number) => void;
	loading?: boolean;
	/** Peminatan mahasiswa, dipakai untuk mengambil pagu biaya program (bila ada). */
	subProgram?: string | null;
	title?: string;
	description?: string;
	confirmLabel?: string;
}

/** Hanya terima digit, buang awalan nol, batasi 9 digit. */
const sanitizeNominal = (raw: string): number => {
	const digits = raw.replace(/\D/g, "").slice(0, 9);
	if (!digits) return 0;
	return Number.parseInt(digits, 10);
};

export function BiayaPendaftaranDialog({
	open,
	onOpenChange,
	loading = false,
	title = "Biaya Pendidikan & DP Pendaftaran",
	description = "Nominal ini otomatis menjadi tagihan DP di Panel Finance dan tersimpan pada data mahasiswa.",
	confirmLabel = "Konfirmasi Setujui",
	...rest
}: BiayaPendaftaranDialogProps) {
	return (
		<Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
			<DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{/* Isi dipasang ulang tiap modal dibuka, jadi nominal selalu mulai dari default. */}
				{open && (
					<BiayaPendaftaranForm
						{...rest}
						loading={loading}
						confirmLabel={confirmLabel}
						onCancel={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

interface BiayaPendaftaranFormProps {
	onConfirm: (totalBiaya: number, pendaftaranDp: number) => void;
	onCancel: () => void;
	loading: boolean;
	confirmLabel: string;
	subProgram?: string | null;
}

function BiayaPendaftaranForm({
	onConfirm,
	onCancel,
	loading,
	confirmLabel,
	subProgram,
}: BiayaPendaftaranFormProps) {
	const totalId = useId();
	const dpId = useId();

	const [totalBiaya, setTotalBiaya] = useState(0);
	const [pendaftaranDp, setPendaftaranDp] = useState(DEFAULT_DP_PENDAFTARAN);
	const [paguTotalBiaya, setPaguTotalBiaya] = useState(0);

	// Pagu program hanya pengisi awal Total Biaya (bila peminatan punya pagu > 0).
	useEffect(() => {
		let aktif = true;
		const ambilPagu = async () => {
			if (!subProgram) return;
			try {
				const token = getToken();
				const res = await fetch(`${API_URL}/settings/program-fee-defaults`, {
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				});
				const json = await res.json();
				if (!aktif || !json?.success || !Array.isArray(json.data)) return;
				const cocok = (json.data as ProgramFeeDefault[]).find(
					(p) =>
						(p.subProgram || "").toLowerCase() === subProgram.toLowerCase(),
				);
				const pagu = cocok?.defaultTotalBiaya ?? 0;
				if (pagu > 0) {
					setPaguTotalBiaya(pagu);
					setTotalBiaya(pagu);
				}
			} catch {
				// Pagu hanya pengisi awal: gagal ambil bukan error fatal, PMB tetap bisa mengetik manual.
			}
		};
		ambilPagu();
		return () => {
			aktif = false;
		};
	}, [subProgram]);

	const totalError =
		totalBiaya <= 0
			? "Total Biaya Pendidikan wajib diisi."
			: totalBiaya > MAX_NOMINAL
				? "Maksimal Rp 999.999.999."
				: null;

	const dpError =
		pendaftaranDp > MAX_NOMINAL
			? "Maksimal Rp 999.999.999."
			: totalBiaya > 0 && pendaftaranDp > totalBiaya
				? `DP Pendaftaran (${formatRupiah(pendaftaranDp)}) tidak boleh melebihi Total Biaya Pendidikan (${formatRupiah(totalBiaya)}).`
				: null;

	const isValid = !totalError && !dpError;

	const handleConfirm = () => {
		if (!isValid || loading) return;
		onConfirm(totalBiaya, pendaftaranDp);
	};

	return (
		<>
			<div className="grid gap-5 pt-2 sm:grid-cols-2">
				{/* Total Biaya Pendidikan */}
				<div className="space-y-2">
					<div className="flex flex-wrap items-center justify-between gap-1">
						<Label
							htmlFor={totalId}
							className="text-xs font-bold text-slate-800"
						>
							Total Biaya Pendidikan (Rp) *
						</Label>
						{paguTotalBiaya > 0 && (
							<Badge
								variant="outline"
								className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
							>
								Pagu program
							</Badge>
						)}
					</div>
					<div className="relative">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
							Rp
						</span>
						<Input
							id={totalId}
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							maxLength={9}
							disabled={loading}
							value={totalBiaya === 0 ? "" : totalBiaya}
							onChange={(e) => setTotalBiaya(sanitizeNominal(e.target.value))}
							aria-invalid={Boolean(totalError)}
							aria-describedby={`${totalId}-help`}
							className={`pl-9 h-11 bg-white text-base font-bold border-slate-300 focus:border-[#0517B0] ${
								totalError ? "border-rose-300 ring-1 ring-rose-200" : ""
							}`}
							placeholder="Contoh: 25000000"
						/>
					</div>
					<p
						id={`${totalId}-help`}
						className={`text-xs ${totalError ? "text-rose-600" : "text-slate-500"}`}
					>
						{totalError ? totalError : `Terbilang: ${formatRupiah(totalBiaya)}`}
					</p>
				</div>

				{/* DP Pendaftaran */}
				<div className="space-y-2">
					<Label htmlFor={dpId} className="text-xs font-bold text-slate-800">
						Nominal DP Pendaftaran (Rp) *
					</Label>
					<div className="relative">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
							Rp
						</span>
						<Input
							id={dpId}
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							maxLength={9}
							disabled={loading}
							value={pendaftaranDp === 0 ? "" : pendaftaranDp}
							onChange={(e) =>
								setPendaftaranDp(sanitizeNominal(e.target.value))
							}
							aria-invalid={Boolean(dpError)}
							aria-describedby={`${dpId}-help`}
							className={`pl-9 h-11 bg-white text-base font-bold border-slate-300 focus:border-[#0517B0] ${
								dpError ? "border-rose-300 ring-1 ring-rose-200" : ""
							}`}
							placeholder="Contoh: 10000000"
						/>
					</div>
					<p
						id={`${dpId}-help`}
						className={`text-xs ${dpError ? "text-rose-600" : "text-slate-500"}`}
					>
						{dpError ? dpError : `Terbilang: ${formatRupiah(pendaftaranDp)}`}
					</p>
				</div>
			</div>

			{dpError && (
				<div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-medium text-amber-800">
					<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
					<span>
						Isi Total Biaya Pendidikan minimal sebesar DP sebelum melanjutkan.
					</span>
				</div>
			)}

			<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					disabled={loading}
					onClick={onCancel}
					className="h-11 cursor-pointer sm:h-10"
				>
					Batal
				</Button>
				<Button
					onClick={handleConfirm}
					disabled={!isValid || loading}
					className="h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer sm:h-10"
				>
					{loading && <Loader2 className="h-4 w-4 animate-spin" />}
					{loading ? "Memproses..." : confirmLabel}
				</Button>
			</div>
		</>
	);
}
