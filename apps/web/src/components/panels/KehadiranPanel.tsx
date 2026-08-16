"use client";

import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabMataKuliah } from "@/components/panels/kehadiran/detail/TabMataKuliah";
import { TabPiket } from "@/components/panels/kehadiran/detail/TabPiket";
import { TabODS } from "@/components/panels/kehadiran/detail/TabODS";
import { TabPramagang } from "@/components/panels/kehadiran/detail/TabPramagang";

interface KehadiranPanelProps {
	studentId: number;
}

export function KehadiranPanel({ studentId }: KehadiranPanelProps) {
	return (
		<div className="space-y-6">
			<div>
				<div className="border-b border-slate-200 pb-4 mb-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
								<span className="text-xl">📋</span> Kehadiran — Absensi Sesi & Acara
							</CardTitle>
							<p className="text-sm text-slate-500 mt-1">
								Dikelola oleh: Akademik
							</p>
						</div>
						<div className="flex items-center gap-3">
						</div>
					</div>
				</div>
			</div>

			<Tabs defaultValue="mata-kuliah" className="w-full">
				<TabsList className="mb-6 grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
					<TabsTrigger 
						value="mata-kuliah"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<span>📚</span> Mata Kuliah
					</TabsTrigger>
					<TabsTrigger 
						value="piket"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<span>🧹</span> Piket
					</TabsTrigger>
					<TabsTrigger 
						value="ods"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<span>🎪</span> One Day Service
					</TabsTrigger>
					<TabsTrigger 
						value="pramagang"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<span>💼</span> Pra Magang
					</TabsTrigger>
				</TabsList>

				<TabsContent value="mata-kuliah" className="animate-in fade-in duration-300">
					<TabMataKuliah studentId={studentId} />
				</TabsContent>

				<TabsContent value="piket" className="animate-in fade-in duration-300">
					<TabPiket studentId={studentId} />
				</TabsContent>

				<TabsContent value="ods" className="animate-in fade-in duration-300">
					<TabODS studentId={studentId} />
				</TabsContent>

				<TabsContent value="pramagang" className="animate-in fade-in duration-300">
					<TabPramagang studentId={studentId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
