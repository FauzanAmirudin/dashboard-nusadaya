import {
	Activity,
	CheckCircle2,
	CreditCard,
	Lock,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL, getToken } from "@/lib/eden";

interface TabDanaTalanganProps {
	studentId: number;
	data: any;
	pmbPaymentData: any;
	canEdit: boolean;
	handleToggleField: (field: string, value: any) => void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => void;
}

export function TabDanaTalangan({
	studentId,
	pmbPaymentData,
}: TabDanaTalanganProps) {
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
				}
			}
		} catch (error) {
			console.error("Failed to fetch finance tracking data", error);
		}
	};

	useEffect(() => {
		fetchFinanceData();

		// Add event listener to fetch on focus just like PMB panel
		const handleFocus = () => {
			fetchFinanceData();
		};

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [studentId]);

	const formatRupiah = (num: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(num || 0);
	};

	const financeState = financeDetail?.finance || {};
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

	return (
		<div className="space-y-6">
			{/* Konteks PMB Read-Only */}
			{pmbPaymentData && (
				<div className="bg-slate-50 border-b border-slate-200 p-4 rounded-lg border">
					<h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
						Konteks Pengajuan PMB (Read-Only)
					</h4>

					{pmbPaymentData.pengajuanDanaTalangan ? (
						<div className="bg-amber-50 border border-amber-200 rounded-md p-3">
							<div className="flex items-center gap-2 text-amber-700 mb-1">
								<Activity className="w-4 h-4" />
								<span className="text-xs font-bold uppercase tracking-wider">
									Ada Pengajuan Dana Talangan
								</span>
							</div>
							<p className="text-sm text-amber-900 whitespace-pre-wrap">
								{pmbPaymentData.pengajuanDanaTalangan}
							</p>
							<div className="mt-3 text-xs text-amber-800 font-medium">
								<span className="mr-4">
									Total Biaya PMB: Rp{" "}
									{pmbPaymentData.totalBiaya?.toLocaleString("id-ID") || 0}
								</span>
								<span>
									Total DP: Rp{" "}
									{pmbPaymentData.totalDp?.toLocaleString("id-ID") || 0}
								</span>
							</div>
						</div>
					) : (
						<div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-center gap-2 text-emerald-700">
							<CheckCircle2 className="w-4 h-4" />
							<span className="text-xs font-bold uppercase tracking-wider">
								Tidak Ada Pengajuan Dana Talangan dari PMB
							</span>
						</div>
					)}
				</div>
			)}

			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<div className="flex items-center gap-2">
						<Activity className="w-4 h-4 text-emerald-600" />
						<div>
							<CardTitle className="text-sm font-bold text-slate-800">
								Rincian Alokasi Biaya Pendidikan & Metode Pembayaran Lanjutan
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
									<Activity className="w-4 h-4" />
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
		</div>
	);
}
