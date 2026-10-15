"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authFetch } from "@/lib/eden";
import { TabFormulir } from "./TabFormulir";
import { TabRespons } from "./TabRespons";
import { TabRiwayatRespons } from "./TabRiwayatRespons";

export function FormMahasiswaModule() {
	const [activeTab, setActiveTab] = useState("formulir");
	const [pendingCount, setPendingCount] = useState<number | null>(null);

	const fetchPendingCount = async () => {
		try {
			const res = await authFetch("/pmb/form-responses");
			const data = await res.json();
			if (data.success && Array.isArray(data.data)) {
				setPendingCount(data.data.length);
			}
		} catch {}
	};

	useEffect(() => {
		fetchPendingCount();
	}, [activeTab]);

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200">
					<TabsTrigger
						value="formulir"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-md px-6"
					>
						Formulir
					</TabsTrigger>
					<TabsTrigger
						value="respons"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-md px-6 flex items-center gap-1.5"
					>
						<span>Respons</span>
						{pendingCount !== null && pendingCount > 0 && (
							<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#0517B0]">
								{pendingCount}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger
						value="riwayat"
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-md px-6"
					>
						Riwayat Respons
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent
						value="formulir"
						className="m-0 border-none p-0 outline-none"
					>
						<TabFormulir />
					</TabsContent>
					<TabsContent
						value="respons"
						className="m-0 border-none p-0 outline-none"
					>
						<TabRespons />
					</TabsContent>
					<TabsContent
						value="riwayat"
						className="m-0 border-none p-0 outline-none"
					>
						<TabRiwayatRespons />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
