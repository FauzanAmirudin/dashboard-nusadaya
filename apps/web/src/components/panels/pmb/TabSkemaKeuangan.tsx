"use client";

import {
	Activity,
	Building,
	CheckCircle2,
	CreditCard,
	DollarSign,
	Edit2,
	FileText,
	Globe,
	GraduationCap,
	HeartPulse,
	Home,
	Info,
	Languages,
	Loader2,
	Lock,
	Plane,
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
	const [financeDetail, setFinanceDetail] = useState<any>(null);

	const fetchFinanceData = async () => {
		try {
			const res = await fetch(`${API_URL}/finance/student/${studentId}`, {
				headers: { Authorization: `Bearer ${getToken()}` },
				cache: "no-store",
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success && json.data) {
					setFinanceDetail(json.data);
					if (json.data.finance?.totalBiayaPendidikan > 0) {
						setTotalBiaya((prev) =>
							prev === 0 ? json.data.finance.totalBiayaPendidikan : prev,
						);
					}
				}
			}
		} catch (error) {
			console.error("Failed to fetch finance tracking data", error);
		}
	};

	useEffect(() => {
		fetchFinanceData();

		// Menambahkan event listener agar otomatis fetch saat user kembali ke tab browser ini
		const handleFocus = () => {
			fetchFinanceData();
		};

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [studentId]);

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

	const financeState = financeDetail?.finance || {};
	const customFields = financeDetail?.customFields || [];
	// Gunakan pmbData dari parent sebagai Single Source of Truth agar reaktif saat diubah di Tab Data Tambahan
	const rumahJuangAktif =
		pmbData?.rumahJuang ?? financeDetail?.rumahJuangAktif ?? false;

	const isDanaTalangan = financeState?.metodePembayaran === "dana_talangan";
	const isDanaMandiri = financeState?.metodePembayaran === "mandiri";

	const renderStage = (
		title: string,
		nominal: number,
		isPaid: boolean,
		desc: string,
	) => (
		<div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
			<div>
				<h4 className="text-xs font-bold text-slate-800">{title}</h4>
				<p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
				<div className="mt-1.5 font-mono text-xs font-semibold text-slate-700">
					{formatRupiah(nominal)}
				</div>
			</div>
			<div className="text-right flex flex-col items-end gap-1.5">
				{isPaid ? (
					<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] font-bold">
						<CheckCircle2 className="w-3 h-3 mr-1" />
						Lunas
					</Badge>
				) : (
					<Badge
						variant="outline"
						className="text-slate-500 border-slate-300 text-[10px] font-bold bg-white"
					>
						<XCircle className="w-3 h-3 mr-1" />
						Belum Lunas
					</Badge>
				)}
			</div>
		</div>
	);

	const renderTambahan = (
		icon: React.ReactNode,
		title: string,
		nominal: number,
		isPaid: boolean,
	) => (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-slate-200 rounded-lg bg-white shadow-sm gap-4">
			<div className="flex items-start gap-3.5">
				<div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-600">
					{icon}
				</div>
				<div>
					<h4 className="text-sm font-bold text-slate-800">{title}</h4>
					<div className="mt-1 font-mono text-[13px] font-semibold text-slate-600">
						{formatRupiah(nominal)}
					</div>
				</div>
			</div>
			<div>
				{isPaid ? (
					<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs font-bold w-full sm:w-auto justify-center px-3 py-1">
						<CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
						Lunas
					</Badge>
				) : (
					<Badge
						variant="outline"
						className="text-slate-500 border-slate-300 text-xs font-bold bg-slate-50 w-full sm:w-auto justify-center px-3 py-1"
					>
						<XCircle className="w-3.5 h-3.5 mr-1.5" />
						Belum Lunas
					</Badge>
				)}
			</div>
		</div>
	);

	return (
		<div className="space-y-6">
			{/* Section 1: Input Total Biaya Pendidikan Global */}
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
									value={totalBiaya === 0 || !totalBiaya ? "" : totalBiaya}
									onKeyDown={(e) => {
										if (e.key === "-" || e.key === "e" || e.key === "E")
											e.preventDefault();
									}}
									onChange={(e) =>
										setTotalBiaya(
											e.target.value === ""
												? 0
												: Math.max(0, Number(e.target.value) || 0),
										)
									}
									className="pl-9 font-bold text-base bg-white h-10 border-indigo-200 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-700"
									placeholder="Belum diinputkan (Contoh: 25000000)"
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

			{/* Section 2: Rincian Alokasi Biaya Pendidikan */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<Activity className="w-4 h-4 text-emerald-600" />
						<div>
							<CardTitle className="text-sm font-bold text-slate-800">
								Rincian Alokasi Biaya Pendidikan
							</CardTitle>
							<p className="text-[11px] text-slate-500">
								Monitoring read-only dari Panel Finance
							</p>
						</div>
					</div>
					<Badge
						variant="outline"
						className="text-slate-400 bg-white text-[10px]"
					>
						<Lock className="w-3 h-3 mr-1" />
						Read Only
					</Badge>
				</CardHeader>
				<CardContent className="p-0">
					<div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
						{/* Kiri: Registrasi Awal */}
						<div className="p-5 space-y-4">
							<div className="flex items-center gap-2 mb-2">
								<div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
									<FileText className="w-4 h-4" />
								</div>
								<h3 className="font-bold text-sm text-slate-800">
									Status Registrasi Awal
								</h3>
							</div>
							{renderStage(
								"Biaya Registrasi Pendaftaran",
								financeState?.registrasiNominal || 0,
								!!financeState?.registrasiStatus,
								"Pendaftaran masuk pertama",
							)}
						</div>

						{/* Kanan: Metode Pembayaran Lanjutan */}
						<div className="p-5 space-y-4 bg-slate-50/30">
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
										<CreditCard className="w-4 h-4" />
									</div>
									<h3 className="font-bold text-sm text-slate-800">
										Metode Pembayaran Lanjutan
									</h3>
								</div>
								<Badge className="bg-[#0517B0]/10 text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/20 font-bold capitalize text-xs">
									{financeState?.metodePembayaran
										? financeState.metodePembayaran.replace("_", " ")
										: "Belum Ditentukan"}
								</Badge>
							</div>

							<div className="space-y-3">
								{!financeState?.metodePembayaran ? (
									<div className="text-sm text-slate-500 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
										Metode pembayaran lanjutan belum dipilih oleh Finance.
									</div>
								) : isDanaMandiri ? (
									<>
										{renderStage(
											"Tahap 1 - Semester Lunas",
											financeState.mandiriSemesterNominal || 0,
											!!financeState.mandiriSemesterStatus,
											"Biaya perkuliahan berjalan",
										)}
										{renderStage(
											"Tahap 2 - Interview Magang",
											financeState.mandiriInterviewNominal || 0,
											!!financeState.mandiriInterviewStatus,
											"Persiapan magang industri",
										)}
										{renderStage(
											"Tahap 3 - Keberangkatan",
											financeState.mandiriKeberangkatanNominal || 0,
											!!financeState.mandiriKeberangkatanStatus,
											"Tahap akhir keberangkatan",
										)}
									</>
								) : isDanaTalangan ? (
									<>
										{renderStage(
											"Tahap 1 - Semester & Interview",
											financeState.t1SemesterNominalTotal || 0,
											!!financeState.t1SemesterStatus &&
												!!financeState.t1InterviewStatus,
											"Talangan semester & interview",
										)}
										{renderStage(
											"Tahap 2 - Keberangkatan",
											financeState.t2KeberangkatanNominal || 0,
											!!financeState.t2KeberangkatanStatus,
											"Talangan keberangkatan magang",
										)}
									</>
								) : null}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Section 3: Rincian Biaya Tambahan */}
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<DollarSign className="w-4 h-4 text-emerald-600" />
						<div>
							<CardTitle className="text-sm font-bold text-slate-800">
								Rincian Biaya Tambahan
							</CardTitle>
							<p className="text-[11px] text-slate-500">
								Monitoring read-only dari Panel Finance
							</p>
						</div>
					</div>
					<Badge
						variant="outline"
						className="text-slate-400 bg-white text-[10px]"
					>
						<Lock className="w-3 h-3 mr-1" />
						Read Only
					</Badge>
				</CardHeader>
				<CardContent className="p-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Biaya Tambahan Tetap */}
						{isDanaTalangan &&
							renderTambahan(
								<Building className="w-5 h-5" />,
								"Administrasi Dana Talangan",
								financeState?.adminTalaganNominal || 0,
								!!financeState?.adminTalaganStatus,
							)}

						{renderTambahan(
							<Languages className="w-5 h-5" />,
							"Sertifikasi Bahasa",
							financeState?.toeicNominal || 0,
							!!financeState?.toeicStatus,
						)}

						{renderTambahan(
							<Plane className="w-5 h-5" />,
							"Passport",
							financeState?.pasporNominal || 0,
							!!financeState?.pasporStatus,
						)}

						{rumahJuangAktif &&
							renderTambahan(
								<Home className="w-5 h-5" />,
								"Rumah Juang",
								financeState?.rumahJuangNominal || 0,
								!!financeState?.rumahJuangStatus,
							)}

						{/* Custom Fields (Biaya Tambahan Dinamis) */}
						{customFields
							.filter((cf: any) => cf.fieldType === "biaya_tambahan")
							.map((cf: any, i: number) => (
								<div key={cf.id || i}>
									{renderTambahan(
										<FileText className="w-5 h-5" />,
										cf.label,
										cf.nominal || 0,
										!!cf.status,
									)}
								</div>
							))}
					</div>
					{!isDanaTalangan && !rumahJuangAktif && customFields.length === 0 && (
						<p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 mt-4">
							Hanya biaya Sertifikasi Bahasa dan Passport yang aktif.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
