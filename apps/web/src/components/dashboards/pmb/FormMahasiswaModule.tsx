"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabFormulir } from "./TabFormulir";
import { TabRespons } from "./TabRespons";
import { TabRiwayatRespons } from "./TabRiwayatRespons";

export function FormMahasiswaModule() {
	const [activeTab, setActiveTab] = useState("formulir");

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
						className="data-[state=active]:bg-white data-[state=active]:text-[#0517B0] data-[state=active]:shadow-sm rounded-md px-6"
					>
						Respons
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
