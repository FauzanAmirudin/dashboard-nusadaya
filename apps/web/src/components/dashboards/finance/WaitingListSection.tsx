"use client";

import { Archive, CheckCircle2, Clock, Receipt } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface WaitingRow {
	id: number;
	name: string;
	program: string | null;
	subProgram: string | null;
	cohort: number | null;
	pendaftaranDp: number | null;
	billingType: string | null;
	billingNumber: string | null;
	billingBankName: string | null;
	billingAccountHolder: string | null;
	isOverdue: boolean;
	daysLeft: number | null;
}

const rupiah = (n: number | null | undefined) =>
	`Rp ${(n ?? 0).toLocaleString("id-ID")}`;

export function WaitingListSection() {
	const [rows, setRows] = useState<WaitingRow[]>([]);
	const [archived, setArchived] = useState(false);
	const [loading, setLoading] = useState(true);
	const [target, setTarget] = useState<WaitingRow | null>(null);
	const [billingType, setBillingType] = useState<"va" | "rekening">("va");
	const [billingNumber, setBillingNumber] = useState("");
	const [bankName, setBankName] = useState("");
	const [holder, setHolder] = useState("");
	const [nominal, setNominal] = useState("");
	const [saving, setSaving] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await authFetch(`/finance/waiting-list?archived=${archived}`);
			const json = await res.json();
			setRows(json?.success ? json.data : []);
		} catch {
			setRows([]);
		} finally {
			setLoading(false);
		}
	}, [archived]);

	useEffect(() => {
		load();
	}, [load]);

	const openBilling = (r: WaitingRow) => {
		setTarget(r);
		setBillingType(r.billingType === "rekening" ? "rekening" : "va");
		setBillingNumber(r.billingNumber ?? "");
		setBankName(r.billingBankName ?? "");
		setHolder(r.billingAccountHolder ?? "");
		setNominal(r.pendaftaranDp ? String(r.pendaftaranDp) : "");
	};

	const submitBilling = async () => {
		if (!target) return;
		const nominalNum = Number(nominal.replace(/\D/g, ""));
		const isVa = billingType === "va";
		if (!billingNumber.trim()) {
			toast.error(isVa ? "Nomor VA wajib diisi" : "Nomor rekening wajib diisi");
			return;
		}
		if (!isVa && (!bankName.trim() || !holder.trim() || !nominalNum)) {
			toast.error("Nama bank, atas nama, dan nominal wajib diisi");
			return;
		}
		setSaving(true);
		try {
			const res = await authFetch(
				`/finance/waiting-list/${target.id}/billing`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						billingType,
						billingNumber: billingNumber.trim(),
						billingBankName: isVa ? undefined : bankName.trim(),
						billingAccountHolder: isVa ? undefined : holder.trim(),
						nominal: isVa ? undefined : nominalNum,
					}),
				},
			);
			const json = await res.json();
			if (!res.ok || !json?.success) {
				toast.error(json?.message || "Gagal menerbitkan tagihan");
				return;
			}
			toast.success("Tagihan DP diterbitkan (batas bayar 2 hari)");
			setTarget(null);
			load();
		} finally {
			setSaving(false);
		}
	};

	const approvePaid = async (r: WaitingRow) => {
		if (
			!window.confirm(
				`Verifikasi pembayaran DP ${r.name} sudah lunas? Mahasiswa akan menjadi Aktif dan NIM diterbitkan.`,
			)
		)
			return;
		const res = await authFetch(`/finance/student/${r.id}/registrasi`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ registrasiStatus: true }),
		});
		const json = await res.json();
		if (!res.ok || !json?.success) {
			toast.error(json?.message || "Gagal memverifikasi pembayaran");
			return;
		}
		toast.success(
			json.nimIssued
				? `${r.name} aktif. NIM ${json.nimIssued} diterbitkan`
				: `${r.name} kini Mahasiswa Aktif`,
		);
		load();
	};

	return (
		<Card className="bg-white border-slate-200/90 shadow-2xs overflow-hidden rounded-xl">
			<CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
					<Receipt className="w-4 h-4 text-[#0517B0]" />
					Antrean Tagihan DP (Waiting List)
					<Badge variant="outline" className="text-[10px]">
						{rows.length}
					</Badge>
				</CardTitle>
				<div className="flex gap-2">
					<Button
						size="sm"
						variant={archived ? "outline" : "default"}
						onClick={() => setArchived(false)}
					>
						<Clock className="w-3.5 h-3.5 mr-1.5" />
						Aktif
					</Button>
					<Button
						size="sm"
						variant={archived ? "default" : "outline"}
						onClick={() => setArchived(true)}
					>
						<Archive className="w-3.5 h-3.5 mr-1.5" />
						Arsip (Terlambat)
					</Button>
				</div>
			</CardHeader>
			<CardContent className="p-0 overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Calon Mahasiswa</TableHead>
							<TableHead>Program</TableHead>
							<TableHead>Tagihan</TableHead>
							<TableHead>Nominal DP</TableHead>
							<TableHead>Batas Bayar</TableHead>
							<TableHead className="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center text-xs py-8">
									Memuat...
								</TableCell>
							</TableRow>
						) : rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center text-xs py-8 text-slate-500"
								>
									{archived
										? "Tidak ada tagihan yang diarsipkan."
										: "Tidak ada calon mahasiswa yang menunggu pembayaran."}
								</TableCell>
							</TableRow>
						) : (
							rows.map((r) => (
								<TableRow key={r.id}>
									<TableCell className="font-medium text-xs">
										{r.name}
									</TableCell>
									<TableCell className="text-xs">
										{r.subProgram || r.program || "-"}
									</TableCell>
									<TableCell className="text-xs">
										{r.billingNumber ? (
											<span>
												<span className="uppercase font-semibold">
													{r.billingType === "rekening" ? "Rek" : "VA"}
												</span>{" "}
												{r.billingBankName ? `${r.billingBankName} · ` : ""}
												{r.billingNumber}
											</span>
										) : (
											<span className="text-slate-400">Belum ditagih</span>
										)}
									</TableCell>
									<TableCell className="text-xs">
										{rupiah(r.pendaftaranDp)}
									</TableCell>
									<TableCell className="text-xs">
										{r.daysLeft === null ? (
											<span className="text-slate-400">Belum ditagih</span>
										) : r.isOverdue ? (
											<Badge className="bg-rose-50 text-rose-700 border-rose-200">
												Terlambat
											</Badge>
										) : (
											<span>{Math.max(r.daysLeft ?? 0, 0)} hari lagi</span>
										)}
									</TableCell>
									<TableCell className="text-right space-x-2 whitespace-nowrap">
										<Button
											size="sm"
											variant="outline"
											onClick={() => openBilling(r)}
										>
											{r.billingNumber ? "Ubah Tagihan" : "Terbitkan Tagihan"}
										</Button>
										<Button
											size="sm"
											disabled={!r.billingNumber}
											onClick={() => approvePaid(r)}
										>
											<CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
											Setujui Lunas
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>

			<Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Terbitkan Tagihan DP — {target?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label className="text-xs">Bentuk Tagihan</Label>
							<Select
								value={billingType}
								onValueChange={(v) => setBillingType(v as "va" | "rekening")}
							>
								<SelectTrigger className="h-9 text-xs mt-1">
									<SelectValue>
										{billingType === "va"
											? "Virtual Account (VA)"
											: "Nomor Rekening"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="va">Virtual Account (VA)</SelectItem>
									<SelectItem value="rekening">Nomor Rekening</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="text-xs">
								{billingType === "va" ? "Nomor VA" : "Nomor Rekening"}
							</Label>
							<Input
								className="h-9 text-xs mt-1"
								value={billingNumber}
								onChange={(e) => setBillingNumber(e.target.value)}
								inputMode="numeric"
							/>
						</div>
						{billingType === "rekening" && (
							<>
								<div>
									<Label className="text-xs">Nama Bank</Label>
									<Input
										className="h-9 text-xs mt-1"
										value={bankName}
										onChange={(e) => setBankName(e.target.value)}
									/>
								</div>
								<div>
									<Label className="text-xs">Atas Nama</Label>
									<Input
										className="h-9 text-xs mt-1"
										value={holder}
										onChange={(e) => setHolder(e.target.value)}
									/>
								</div>
								<div>
									<Label className="text-xs">Nominal DP (Rp)</Label>
									<Input
										className="h-9 text-xs mt-1"
										value={nominal}
										onChange={(e) => setNominal(e.target.value)}
										inputMode="numeric"
									/>
								</div>
							</>
						)}
						<p className="text-[10px] text-slate-500">
							Batas bayar otomatis 2 hari sejak tagihan diterbitkan.
						</p>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setTarget(null)}>
							Batal
						</Button>
						<Button onClick={submitBilling} disabled={saving}>
							{saving ? "Menyimpan..." : "Terbitkan"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
