"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function MasterAkademikSettings() {
	const { user } = useAuthStore();
	const isSuperadmin = user?.role === "superadmin";

	const [events, setEvents] = useState<any[]>([]);
	const [businessParams, setBusinessParams] = useState<any[]>([]);
	const [services, setServices] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Forms
	const [newEvent, setNewEvent] = useState({ configKey: "", eventName: "" });
	const [newBusiness, setNewBusiness] = useState({
		businessUnitId: "",
		parameterName: "",
		formulaValue: "",
		description: "",
	});
	const [newService, setNewService] = useState({
		serviceId: "",
		categoryName: "",
	});

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<{ id: number; type: string } | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const [eventsRes, businessRes, servicesRes] = await Promise.all([
				api.settings["master-events"].get(),
				api.settings["master-business"].get(),
				api.settings["master-services"].get(),
			]);

			if (!eventsRes.error && eventsRes.data?.success)
				setEvents(eventsRes.data.data);
			if (!businessRes.error && businessRes.data?.success)
				setBusinessParams(businessRes.data.data);
			if (!servicesRes.error && servicesRes.data?.success)
				setServices(servicesRes.data.data);
		} catch (error) {
			console.error("Failed to fetch settings", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleAddEvent = async () => {
		if (!newEvent.configKey || !newEvent.eventName)
			return toast.error("Isi semua field");
		const { error } = await api.settings["master-events"].post(newEvent);
		if (!error) {
			toast.success("Event type ditambahkan");
			setNewEvent({ configKey: "", eventName: "" });
			fetchData();
		} else toast.error("Gagal menambah event type");
	};

	const confirmDelete = (id: number, type: string) => {
		setItemToDelete({ id, type });
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteEvent = async (id: number) => {
		const { error } =
			await api.settings["master-events"][id.toString()].delete();
		if (!error) {
			toast.success("Event type dihapus");
			fetchData();
		} else toast.error("Gagal menghapus");
	};

	const handleAddBusiness = async () => {
		if (
			!newBusiness.businessUnitId ||
			!newBusiness.parameterName ||
			!newBusiness.formulaValue
		)
			return toast.error("Isi semua field wajib");
		const { error } = await api.settings["master-business"].post(newBusiness);
		if (!error) {
			toast.success("Business parameter ditambahkan");
			setNewBusiness({
				businessUnitId: "",
				parameterName: "",
				formulaValue: "",
				description: "",
			});
			fetchData();
		} else toast.error("Gagal menambah business parameter");
	};

	const handleDeleteBusiness = async (id: number) => {
		const { error } =
			await api.settings["master-business"][id.toString()].delete();
		if (!error) {
			toast.success("Business parameter dihapus");
			fetchData();
		} else toast.error("Gagal menghapus");
	};

	const handleAddService = async () => {
		if (!newService.serviceId || !newService.categoryName)
			return toast.error("Isi semua field");
		const { error } = await api.settings["master-services"].post(newService);
		if (!error) {
			toast.success("Service tag ditambahkan");
			setNewService({ serviceId: "", categoryName: "" });
			fetchData();
		} else toast.error("Gagal menambah service tag");
	};

	const handleDeleteService = async (id: number) => {
		const { error } =
			await api.settings["master-services"][id.toString()].delete();
		if (!error) {
			toast.success("Service tag dihapus");
			fetchData();
		} else toast.error("Gagal menghapus");
	};

	const executeDelete = () => {
		if (!itemToDelete) return;
		if (itemToDelete.type === "event") handleDeleteEvent(itemToDelete.id);
		if (itemToDelete.type === "business") handleDeleteBusiness(itemToDelete.id);
		if (itemToDelete.type === "service") handleDeleteService(itemToDelete.id);
		setIsDeleteDialogOpen(false);
		setItemToDelete(null);
	};

	if (isLoading) {
		return (
			<div className="p-8 text-center">
				<Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-5xl">
			<div>
				<h1 className="text-2xl font-bold text-slate-800">
					Master Konfigurasi Akademik & Vokasi
				</h1>
				<p className="text-sm text-slate-500">
					Atur tipe event mingguan, parameter bagi hasil, dan layanan.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Master Event Types</CardTitle>
					<CardDescription>
						Tipe acara untuk Weekly Events (contoh: seminar, bootcamp).
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Config Key</TableHead>
								<TableHead>Event Name</TableHead>
								<TableHead>Status</TableHead>
								{isSuperadmin && (
									<TableHead className="w-[100px]">Aksi</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{events.map((ev) => (
								<TableRow key={ev.id}>
									<TableCell>{ev.configKey}</TableCell>
									<TableCell>{ev.eventName}</TableCell>
									<TableCell>{ev.isActive ? "Aktif" : "Non-aktif"}</TableCell>
									{isSuperadmin && (
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => confirmDelete(ev.id, "event")}
											>
												<Trash2 className="w-4 h-4 text-rose-500" />
											</Button>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>

					{isSuperadmin && (
						<div className="mt-4 flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
							<Input
								placeholder="Config Key (ex: seminar_ti)"
								value={newEvent.configKey}
								onChange={(e) =>
									setNewEvent({ ...newEvent, configKey: e.target.value })
								}
							/>
							<Input
								placeholder="Event Name (ex: Seminar TI)"
								value={newEvent.eventName}
								onChange={(e) =>
									setNewEvent({ ...newEvent, eventName: e.target.value })
								}
							/>
							<Button
								onClick={handleAddEvent}
								className="shrink-0 bg-[#0517B0] hover:bg-blue-800 text-white"
							>
								<Plus className="w-4 h-4 mr-2" /> Tambah
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Master Business Parameters (Kewirausahaan)</CardTitle>
					<CardDescription>
						Parameter bagi hasil usaha mahasiswa vokasi.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Unit Usaha ID</TableHead>
								<TableHead>Nama Parameter</TableHead>
								<TableHead>Nilai/Formula</TableHead>
								<TableHead>Deskripsi</TableHead>
								{isSuperadmin && (
									<TableHead className="w-[100px]">Aksi</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{businessParams.map((bp) => (
								<TableRow key={bp.id}>
									<TableCell>{bp.businessUnitId}</TableCell>
									<TableCell>{bp.parameterName}</TableCell>
									<TableCell>{bp.formulaValue}</TableCell>
									<TableCell>{bp.description}</TableCell>
									{isSuperadmin && (
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => confirmDelete(bp.id, "business")}
											>
												<Trash2 className="w-4 h-4 text-rose-500" />
											</Button>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>

					{isSuperadmin && (
						<div className="mt-4 flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 flex-wrap sm:flex-nowrap">
							<Input
								placeholder="Unit ID (ex: BAKERY_01)"
								value={newBusiness.businessUnitId}
								onChange={(e) =>
									setNewBusiness({
										...newBusiness,
										businessUnitId: e.target.value,
									})
								}
							/>
							<Input
								placeholder="Parameter (ex: SHARING_STUDENT)"
								value={newBusiness.parameterName}
								onChange={(e) =>
									setNewBusiness({
										...newBusiness,
										parameterName: e.target.value,
									})
								}
							/>
							<Input
								placeholder="Formula (ex: 40%)"
								value={newBusiness.formulaValue}
								onChange={(e) =>
									setNewBusiness({
										...newBusiness,
										formulaValue: e.target.value,
									})
								}
							/>
							<Input
								placeholder="Deskripsi"
								value={newBusiness.description}
								onChange={(e) =>
									setNewBusiness({
										...newBusiness,
										description: e.target.value,
									})
								}
							/>
							<Button
								onClick={handleAddBusiness}
								className="shrink-0 bg-[#0517B0] hover:bg-blue-800 text-white"
							>
								<Plus className="w-4 h-4 mr-2" /> Tambah
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Master Service Tags</CardTitle>
					<CardDescription>
						Tag layanan untuk aktivitas mahasiswa.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Service ID</TableHead>
								<TableHead>Category Name</TableHead>
								<TableHead>Status</TableHead>
								{isSuperadmin && (
									<TableHead className="w-[100px]">Aksi</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{services.map((sv) => (
								<TableRow key={sv.id}>
									<TableCell>{sv.serviceId}</TableCell>
									<TableCell>{sv.categoryName}</TableCell>
									<TableCell>{sv.isEnabled ? "Aktif" : "Non-aktif"}</TableCell>
									{isSuperadmin && (
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => confirmDelete(sv.id, "service")}
											>
												<Trash2 className="w-4 h-4 text-rose-500" />
											</Button>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>

					{isSuperadmin && (
						<div className="mt-4 flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
							<Input
								placeholder="Service ID (ex: JASA_01)"
								value={newService.serviceId}
								onChange={(e) =>
									setNewService({ ...newService, serviceId: e.target.value })
								}
							/>
							<Input
								placeholder="Category Name (ex: Design Grafis)"
								value={newService.categoryName}
								onChange={(e) =>
									setNewService({ ...newService, categoryName: e.target.value })
								}
							/>
							<Button
								onClick={handleAddService}
								className="shrink-0 bg-[#0517B0] hover:bg-blue-800 text-white"
							>
								<Plus className="w-4 h-4 mr-2" /> Tambah
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Konfirmasi Hapus</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<p className="text-slate-600">
							Apakah Anda yakin ingin menghapus data ini?
						</p>
						<div className="flex justify-end gap-3 pt-4">
							<Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
								Batal
							</Button>
							<Button
								variant="destructive"
								onClick={executeDelete}
							>
								Hapus
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
