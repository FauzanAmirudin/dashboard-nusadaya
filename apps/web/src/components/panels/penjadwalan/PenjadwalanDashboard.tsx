"use client";

import { useAuthStore } from "@/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, BookOpen, Clock, Megaphone } from "lucide-react";

import { TabJadwalKelas } from "@/components/panels/penjadwalan/TabJadwalKelas";
import { TabJadwalPraktikum } from "@/components/panels/penjadwalan/TabJadwalPraktikum";
import { TabJadwalPiket } from "@/components/panels/penjadwalan/TabJadwalPiket";
import { TabPengumuman } from "@/components/panels/penjadwalan/TabPengumuman";

export function PenjadwalanDashboard() {
	const { user } = useAuthStore();
	const canEdit = user?.role === "superadmin" || user?.role === "akademik";

	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
					<CalendarDays className="w-8 h-8 text-primary" />
					Penjadwalan & Pengumuman
				</h1>
			</div>

			<Tabs defaultValue="kelas" className="w-full">
				<TabsList className="w-full flex flex-wrap justify-start border-b rounded-none bg-transparent p-0 h-auto gap-4">
					<TabsTrigger
						value="kelas"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2 font-medium"
					>
						<BookOpen className="w-4 h-4 mr-2" />
						Jadwal Kelas
					</TabsTrigger>
					<TabsTrigger
						value="praktikum"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2 font-medium"
					>
						<Clock className="w-4 h-4 mr-2" />
						Jadwal Praktikum
					</TabsTrigger>
					<TabsTrigger
						value="piket"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2 font-medium"
					>
						<CalendarDays className="w-4 h-4 mr-2" />
						Jadwal Piket
					</TabsTrigger>
					<TabsTrigger
						value="pengumuman"
						className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2 font-medium"
					>
						<Megaphone className="w-4 h-4 mr-2" />
						Pengumuman
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="kelas">
						<TabJadwalKelas canEdit={canEdit} />
					</TabsContent>
					<TabsContent value="praktikum">
						<TabJadwalPraktikum canEdit={canEdit} />
					</TabsContent>
					<TabsContent value="piket">
						<TabJadwalPiket canEdit={canEdit} />
					</TabsContent>
					<TabsContent value="pengumuman">
						<TabPengumuman canEdit={canEdit} user={user} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
