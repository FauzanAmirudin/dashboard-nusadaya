"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { TabAnggaran } from "./finance/TabAnggaran";
import { TabFeeSharing } from "./finance/TabFeeSharing";
import { TabKeuangan } from "./finance/TabKeuangan";

interface FinancePanelProps {
	studentId: number;
	onUpdate: () => void;
}

export function FinancePanel({ studentId, onUpdate }: FinancePanelProps) {
	const { user } = useAuthStore();
	const isFinanceAdmin =
		user?.role === "finance" || user?.role === "superadmin";
	const canEdit = isFinanceAdmin;

	const [finState, setFinState] = useState<any>(null);
	const [pmbState, setPmbState] = useState<any>(null);
	const [customFields, setCustomFields] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const { data, error } =
				await api.finance.student[studentId.toString()].get();
			if (!error && data?.success) {
				setFinState(data?.data?.finance);
				setPmbState({ rumahJuang: data?.data?.rumahJuangAktif });
				setCustomFields(data?.data?.customFields || []);
			}
		} catch (err) {
			console.error("Failed to fetch finance data", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	const refreshData = () => {
		fetchData();
		onUpdate();
	};

	if (isLoading) {
		return (
			<div className="flex justify-center p-10">
				<Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{/* Panel Header */}
			<div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="p-2.5 rounded-xl bg-blue-50 text-[#0517B0] border border-blue-100/80 shadow-2xs">
							<span className="text-lg">💰</span>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<CardTitle className="text-lg font-bold text-slate-900 tracking-tight">
									Panel Keuangan Mahasiswa
								</CardTitle>
								<Badge className="bg-[#0517B0]/10 text-[#0517B0] border-[#0517B0]/20 text-[10px] font-bold px-2 py-0.5">
									Divisi Finance
								</Badge>
							</div>
							<p className="text-xs text-slate-500 mt-0.5">
								Pengelolaan partisi biaya pendidikan, transaksi pembayaran, fee
								sharing, dan anggaran.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{user?.role === "superadmin" && !isFinanceAdmin && (
							<Badge
								variant="outline"
								className="text-slate-500 border-slate-200 bg-slate-50 text-xs px-2.5 py-1"
							>
								👁 Mode Lihat Saja
							</Badge>
						)}
					</div>
				</div>
			</div>

			<Tabs defaultValue="keuangan" className="w-full space-y-4">
				<TabsList className="w-full grid grid-cols-3 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 h-10">
					<TabsTrigger
						value="keuangan"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-lg text-xs transition-all"
					>
						1. Keuangan Mahasiswa
					</TabsTrigger>
					<TabsTrigger
						value="fee-sharing"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-lg text-xs transition-all"
					>
						2. Distribusi Fee (Sharing)
					</TabsTrigger>
					<TabsTrigger
						value="anggaran"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:font-bold data-[state=active]:shadow-xs rounded-lg text-xs transition-all"
					>
						3. Anggaran Praktik
					</TabsTrigger>
				</TabsList>

				<TabsContent value="keuangan">
					<TabKeuangan
						studentId={studentId}
						finState={finState}
						pmbState={pmbState}
						customFields={customFields}
						canEdit={canEdit}
						onUpdate={refreshData}
					/>
				</TabsContent>

				<TabsContent value="fee-sharing">
					<TabFeeSharing studentId={studentId} canEdit={canEdit} />
				</TabsContent>

				<TabsContent value="anggaran">
					<TabAnggaran canEdit={canEdit} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
