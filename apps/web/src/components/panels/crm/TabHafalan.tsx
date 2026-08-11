"use client";

import { CheckCircle, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/eden";

interface TabHafalanProps {
	studentId: number;
	paData: any;
	vocabLogs: any[];
	crmState: any;
	canEdit: boolean;
	fetchCrmData: () => void;
	onUpdate: () => void;
}

export function TabHafalan({
	studentId,
	paData,
	vocabLogs,
	crmState,
	canEdit,
	fetchCrmData,
	onUpdate,
}: TabHafalanProps) {
	const crm = crmState?.crm;
	const [isVocabComplete, setIsVocabComplete] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (crm) {
			setIsVocabComplete(!!crm.isVocabComplete);
		}
	}, [crm]);

	const targetVocab = paData?.vocabTarget || 500;
	const totalVocab = vocabLogs.reduce((acc, log) => acc + log.addedWords, 0);
	const vocabProgress = Math.min(
		Math.round((totalVocab / targetVocab) * 100),
		100,
	);
	const isVocabDone = vocabProgress >= 100;
	const vocabProgressColor =
		vocabProgress >= 80
			? "bg-emerald-500"
			: vocabProgress >= 50
				? "bg-amber-500"
				: "bg-rose-500";

	const handleSetujuiHafalan = async () => {
		if (!canEdit) return;
		setIsLoading(true);
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				isVocabComplete: true,
			});
			if (error) throw new Error("Gagal menyetujui hafalan");

			toast.success("Hafalan berhasil disetujui");
			setIsVocabComplete(true);
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal menyetujui hafalan");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<Card className="border border-slate-200 shadow-sm">
				<CardHeader className="bg-slate-50 border-b border-slate-100 py-3.5 px-4 flex flex-row items-center justify-between">
					<CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
						<FileText className="w-4 h-4 text-indigo-600" />
						Monitoring Setoran Vocabulary (Hafalan)
					</CardTitle>
				</CardHeader>
				<CardContent className="p-5 flex flex-col md:flex-row gap-6">
					{/* Left: Progress */}
					<div className="w-full md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-6">
						<p className="text-slate-500 font-bold mb-4">PROGRESS VOCABULARY</p>
						<div className="w-full flex justify-between text-sm text-slate-600 mb-2 font-medium">
							<span>Target: {targetVocab} kata</span>
							<span>Tercapai: {totalVocab} kata</span>
						</div>
						<div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
							<Progress
								value={vocabProgress}
								className="h-full bg-slate-100"
								indicatorClassName={vocabProgressColor}
							/>
						</div>
						<p className="mt-2 text-xl font-bold text-slate-800">
							{vocabProgress}%
						</p>

						<div className="mt-6 w-full pt-6 border-t border-slate-200 text-center">
							{isVocabComplete ? (
								<div className="flex flex-col items-center gap-2">
									<CheckCircle className="w-10 h-10 text-emerald-500" />
									<p className="text-sm font-bold text-emerald-600">
										Hafalan Telah Disetujui
									</p>
								</div>
							) : (
								<Button
									disabled={!isVocabDone || !canEdit || isLoading}
									onClick={handleSetujuiHafalan}
									className="w-full bg-[#0517B0] hover:bg-blue-800 text-white font-bold disabled:opacity-50"
								>
									{isLoading ? "Menyimpan..." : "Setujui Hafalan"}
								</Button>
							)}
							{!isVocabDone && !isVocabComplete && (
								<p className="text-xs text-slate-400 mt-2">
									*Persetujuan dapat dilakukan jika hafalan mencapai 100%
								</p>
							)}
						</div>
					</div>

					{/* Right: Logs */}
					<div className="w-full md:w-2/3">
						<h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
							Riwayat Setoran
						</h4>
						<ScrollArea className="h-[250px] pr-4">
							<div className="space-y-3">
								{vocabLogs.map((log: any) => (
									<div
										key={log.id}
										className="p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all bg-white flex justify-between items-start"
									>
										<div>
											<div className="flex items-center gap-2 mb-1">
												<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold">
													+{log.addedWords} kata
												</Badge>
												<span className="text-xs text-slate-500 font-medium">
													{new Date(log.date).toLocaleDateString("id-ID", {
														day: "numeric",
														month: "long",
														year: "numeric",
													})}
												</span>
											</div>
											{log.notes && (
												<p className="text-sm text-slate-600 mt-1 italic">
													"{log.notes}"
												</p>
											)}
										</div>
									</div>
								))}
								{vocabLogs.length === 0 && (
									<div className="text-center text-slate-400 text-sm py-8 border-2 border-dashed border-slate-200 rounded-lg">
										Belum ada riwayat setoran hafalan vocab.
									</div>
								)}
							</div>
						</ScrollArea>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
