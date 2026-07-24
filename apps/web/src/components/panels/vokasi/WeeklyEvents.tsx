"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export function WeeklyEvents({ studentId }: { studentId: number }) {
	const { user } = useAuthStore();
	const [logs, setLogs] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [open, setOpen] = useState(false);

	const [form, setForm] = useState({
		eventType: "mice",
		eventDate: new Date().toISOString().split("T")[0],
		description: "",
		documentUrl: "",
	});

	const fetchLogs = async () => {
		const { data, error } =
			await api.students[studentId.toString()]["weekly-events"].get();
		if (!error && data?.success) {
			setLogs(data.data as any[]);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		fetchLogs();
	}, [studentId]);

	const handleSubmit = async () => {
		setIsSubmitting(true);
		const { error } =
			await api.students[studentId.toString()]["weekly-events"].post(form);
		setIsSubmitting(false);
		if (error) {
			toast.error("Gagal menyimpan rekam event");
		} else {
			toast.success("Rekam event berhasil disimpan");
			setOpen(false);
			fetchLogs();
		}
	};

	const canAdd =
		user?.role === "dosen" ||
		user?.role === "superadmin" ||
		user?.role === "akademik";

	return (
		<Card className="mt-6 border-slate-200 shadow-sm">
			<CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
				<CardTitle className="text-lg font-bold text-slate-800">
					Weekly Events (MICE / Praktek Lapangan)
				</CardTitle>
				{canAdd && (
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-[#0517B0] text-primary-foreground shadow-sm hover:bg-blue-800 px-4 h-8">
							+ Tambah Event
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Tambah Rekor Event</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<label className="text-sm font-semibold">Tipe Event</label>
										<Select
											value={form.eventType}
											onValueChange={(v) =>
												setForm({ ...form, eventType: v || "" })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="mice">MICE / Event Besar</SelectItem>
												<SelectItem value="demo">Demo Memasak</SelectItem>
												<SelectItem value="pameran">Pameran / Bazar</SelectItem>
												<SelectItem value="lainnya">Lainnya</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1">
										<label className="text-sm font-semibold">
											Tanggal Event
										</label>
										<Input
											type="date"
											value={form.eventDate}
											onChange={(e) =>
												setForm({ ...form, eventDate: e.target.value })
											}
										/>
									</div>
								</div>
								<div className="space-y-1">
									<label className="text-sm font-semibold">
										Deskripsi Singkat
									</label>
									<Textarea
										placeholder="Lokasi, peran mahasiswa, hasil..."
										value={form.description}
										onChange={(e) =>
											setForm({ ...form, description: e.target.value })
										}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-sm font-semibold">
										URL Dokumentasi (Foto/Drive)
									</label>
									<Input
										placeholder="https://..."
										value={form.documentUrl}
										onChange={(e) =>
											setForm({ ...form, documentUrl: e.target.value })
										}
									/>
								</div>
								<Button
									className="w-full bg-[#0517B0] text-white"
									onClick={handleSubmit}
									disabled={isSubmitting}
								>
									{isSubmitting ? "Menyimpan..." : "Simpan Event"}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				)}
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader className="bg-slate-50">
						<TableRow>
							<TableHead>Tanggal</TableHead>
							<TableHead>Tipe</TableHead>
							<TableHead>Deskripsi</TableHead>
							<TableHead>Dokumentasi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{logs.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center text-slate-500 py-6"
								>
									Belum ada rekam event.
								</TableCell>
							</TableRow>
						) : (
							logs.map((log) => (
								<TableRow key={log.id}>
									<TableCell>
										{new Date(log.eventDate).toLocaleDateString("id-ID")}
									</TableCell>
									<TableCell className="capitalize">{log.eventType}</TableCell>
									<TableCell className="max-w-xs">
										{log.description || "-"}
									</TableCell>
									<TableCell>
										{log.documentUrl ? (
											<a
												href={log.documentUrl}
												target="_blank"
												rel="noreferrer"
												className="text-blue-600 hover:underline"
											>
												Lihat Foto
											</a>
										) : (
											"-"
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
