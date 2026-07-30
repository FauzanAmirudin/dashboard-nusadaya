"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
		<div className="space-y-6">
			{/* Panel Header */}
			<div className="border-b border-slate-200 pb-4 mb-6">
				<div className="flex justify-between items-center">
					<h2 className="text-slate-800 text-xl font-bold flex items-center gap-2">
						<span>💰</span> Panel Keuangan Mahasiswa
					</h2>
					<div className="flex items-center gap-3">
						<Badge
							variant="outline"
							className="border-slate-200 text-slate-500 bg-white"
						>
							Dikelola oleh: Finance
						</Badge>
					</div>
				</div>
			</div>

			<Tabs defaultValue="keuangan" className="w-full">
				<TabsList className="mb-6 grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
					<TabsTrigger
						value="keuangan"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all"
					>
						1. Keuangan Mahasiswa
					</TabsTrigger>
					<TabsTrigger
						value="fee-sharing"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all"
					>
						2. Distribusi Fee (Sharing)
					</TabsTrigger>
					<TabsTrigger
						value="anggaran"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all"
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
