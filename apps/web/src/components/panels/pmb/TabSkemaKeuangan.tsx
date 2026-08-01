"use client";

import {
	Activity,
	CheckCircle2,
	Edit2,
	Globe,
	Info,
	Loader2,
	Lock,
	Save,
	ShieldCheck,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_URL, getToken } from "@/lib/eden";

interface TabSkemaKeuanganProps {
	studentId: number;
	pmbData: any;
	canEdit: boolean;
	onUpdate: () => void;
}

export function TabSkemaKeuangan({
	studentId,
	pmbData,
	canEdit,
	onUpdate,
}: TabSkemaKeuanganProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const initialTotalBiaya =
		pmbData?.paymentPlan?.totalBiaya && pmbData.paymentPlan.totalBiaya > 0
			? pmbData.paymentPlan.totalBiaya
			: pmbData?.finance?.totalBiayaPendidikan &&
					pmbData.finance.totalBiayaPendidikan > 0
				? pmbData.finance.totalBiayaPendidikan
				: (pmbData?.paymentPlan?.totalBiaya ??
					pmbData?.finance?.totalBiayaPendidikan ??
					0);

	const [totalBiaya, setTotalBiaya] = useState<number>(initialTotalBiaya);
	const [financeState, setFinanceState] = useState<any>(
		pmbData?.finance || null,
	);

	const fetchFinanceData = async () => {
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/finance`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success && json.data) {
					setFinanceState(json.data);
					if (json.data.totalBiayaPendidikan > 0) {
						setTotalBiaya((prev) =>
							prev === 0 ? json.data.totalBiayaPendidikan : prev,
						);
					}
				}
			}
		} catch (error) {
			console.error("Failed to fetch finance tracking data", error);
		}
	};

	useEffect(() => {
		const planVal = pmbData?.paymentPlan?.totalBiaya;
		const finVal = pmbData?.finance?.totalBiayaPendidikan;
		const stateVal = financeState?.totalBiayaPendidikan;

		if (planVal && planVal > 0) {
			setTotalBiaya(planVal);
		} else if (finVal && finVal > 0) {
			setTotalBiaya(finVal);
		} else if (stateVal && stateVal > 0) {
			setTotalBiaya(stateVal);
		} else if (planVal !== undefined) {
			setTotalBiaya(planVal);
		}

		if (pmbData?.finance) {
			setFinanceState(pmbData.finance);
		} else {
			fetchFinanceData();
		}
	}, [pmbData, studentId]);

	const handleSaveTotalBiaya = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pmb/payment-plan`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						totalBiaya: Math.max(0, Number(totalBiaya) || 0),
					}),
				},
			);
			if (res.ok) {
				toast.success(
					"Total Biaya Pendidikan berhasil disimpan & terhubung ke Finance",
				);
				setIsEditing(false);
				fetchFinanceData();
				onUpdate();
			} else {
				toast.error("Gagal menyimpan Total Biaya Pendidikan");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancelEdit = () => {
		setTotalBiaya(initialTotalBiaya);
		setIsEditing(false);
	};

	const formatRupiah = (num: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(num || 0);
	};

	// Determine status for the 4 main payment stages from Finance Data
	const isDanaTalangan = financeState?.metodePembayaran === "dana_talangan";

	const stages = [
		{
			id: "registrasi",
			number: "1",
			title: "Registrasi Awal",
			desc: "Pembayaran pendaftaran masuk pertama",
			isPaid: !!financeState?.registrasiStatus,
		},
		{
			id: "semester",
			number: "2",
			title: "Semester Lunas",
			desc: "Pembayaran biaya perkuliahan berjalan",
			isPaid: isDanaTalangan
				? !!financeState?.t1SemesterStatus
				: !!financeState?.mandiriSemesterStatus,
		},
		{
			id: "interview",
			number: "3",
			title: "Interview Magang Industri",
			desc: "Tahap persiapan magang industri",
			isPaid: isDanaTalangan
				? !!financeState?.t1InterviewStatus
				: !!financeState?.mandiriInterviewStatus,
		},
		{
			id: "keberangkatan",
			number: "4",
			title: "Keberangkatan Magang Taiwan",
			desc: "Tahap akhir keberangkatan magang",
			isPaid: isDanaTalangan
				? !!financeState?.t2KeberangkatanStatus
				: !!financeState?.mandiriKeberangkatanStatus,
		},
	];

	const lunasCount = stages.filter((s) => s.isPaid).length;

	return (
		<div className="space-y-6">
			{/* Input Total Biaya Pendidikan Global */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
						<Globe className="w-4 h-4 text-indigo-600" />
						Input Total Biaya Pendidikan
					</CardTitle>
					{canEdit && (
						<div className="flex items-center gap-2">
							{!isEditing ? (
								<Button
									onClick={() => setIsEditing(true)}
									size="sm"
									className="bg-[#0517B0] hover:bg-[#04128d] text-white text-xs gap-1.5 h-8"
								>
									<Edit2 className="w-3.5 h-3.5" />
									Edit Biaya
								</Button>
							) : (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={handleCancelEdit}
										disabled={isSaving}
										className="text-xs h-8"
									>
										Batal
									</Button>
									<Button
										onClick={handleSaveTotalBiaya}
										disabled={isSaving}
										size="sm"
										className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-8"
									>
										{isSaving ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Save className="w-3.5 h-3.5" />
										)}
										Simpan Biaya Pendidikan
									</Button>
								</>
							)}
						</div>
					)}
				</CardHeader>
				<CardContent className="p-5 space-y-4">
					<div className="max-w-xl p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3">
						<div>
							<Label className="text-xs font-bold text-indigo-950 block mb-1">
								Total Biaya Pendidikan Keseluruhan (Rp) *
							</Label>
							<div className="relative">
								<span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
									Rp
								</span>
								<Input
									type="number"
									min={0}
									disabled={!isEditing || !canEdit}
									value={totalBiaya === 0 && !isEditing ? "" : totalBiaya}
									onKeyDown={(e) => {
										if (e.key === "-" || e.key === "e" || e.key === "E")
											e.preventDefault();
									}}
									onChange={(e) =>
										setTotalBiaya(Math.max(0, Number(e.target.value) || 0))
									}
									className="pl-9 font-bold text-base bg-white h-10 border-indigo-200 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-700"
									placeholder="Belum diinputkan"
								/>
							</div>
							<span className="text-xs font-semibold text-indigo-700 mt-1.5 block">
								Terbilang:{" "}
								{totalBiaya > 0
									? formatRupiah(totalBiaya)
									: "Belum ada biaya terinput"}
							</span>
						</div>

						<div className="flex items-start gap-2 pt-1 text-xs text-indigo-900/80">
							<Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
							<p className="text-[11px] leading-relaxed">
								Tim PMB hanya menginput{" "}
								<strong>satu nilai total keseluruhan</strong> di awal. Sistem
								OneData secara otomatis menghubungkan nilai ini ke{" "}
								<strong>Panel Finance</strong> untuk pengelolaan skema cicilan &
								pencatatan transaksi lebih lanjut.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Monitoring Status Pembayaran Utama (Biaya Pendidikan) */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<Activity className="w-4 h-4 text-emerald-600" />
						<div>
							<CardTitle className="text-sm font-bold text-slate-800">
								Monitoring Status Pembayaran Utama (Biaya Pendidikan)
							</CardTitle>
							<p className="text-[11px] text-slate-500">
								Pelacakan 4 tahapan pembayaran utama secara real-time dari Panel
								Finance
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-5 space-y-5">
					{/* Progress Summary Header */}
					<div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
						<div className="flex items-center gap-2.5">
							<ShieldCheck className="w-5 h-5 text-[#0517B0]" />
							<div>
								<span className="text-xs font-bold text-slate-800 block">
									Ringkasan Kelayakan Finansial Mahasiswa
								</span>
								<span className="text-[11px] text-slate-500">
									Metode Pembayaran:{" "}
									<strong className="capitalize text-slate-700">
										{financeState?.metodePembayaran
											? financeState.metodePembayaran.replace("_", " ")
											: "Belum Ditentukan"}
									</strong>
								</span>
							</div>
						</div>
						<div className="text-right">
							<span className="text-xs font-bold text-slate-700 block">
								{lunasCount} dari 4 Tahap Lunas
							</span>
							<span className="text-[10px] text-slate-400">
								Sinkronisasi Real-Time Finance
							</span>
						</div>
					</div>

					{/* 4 Tahapan Pembayaran Utama */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{stages.map((stage) => (
							<div
								key={stage.id}
								className={`p-4 rounded-xl border transition-all space-y-3 ${
									stage.isPaid
										? "bg-emerald-50/40 border-emerald-200"
										: "bg-rose-50/30 border-rose-200"
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
										{stage.number}
									</span>
									{stage.isPaid ? (
										<Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] font-bold gap-1">
											<CheckCircle2 className="w-3 h-3" />
											Sudah Lunas
										</Badge>
									) : (
										<Badge
											variant="destructive"
											className="text-[10px] font-bold gap-1"
										>
											<XCircle className="w-3 h-3" />
											Belum Lunas
										</Badge>
									)}
								</div>

								<div>
									<h4 className="font-bold text-slate-800 text-xs">
										{stage.title}
									</h4>
									<p className="text-[11px] text-slate-500 mt-0.5">
										{stage.desc}
									</p>
								</div>

								<div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
									<span>Status Finance</span>
									<span className="font-semibold text-slate-600 flex items-center gap-1">
										<Lock className="w-2.5 h-2.5" />
										Auto Sync
									</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
