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

export function Entrepreneurship({
	studentId,
	courseGrades,
	onUpdate,
}: {
	studentId: number;
	courseGrades: any[];
	onUpdate?: () => void;
}) {
	const { user } = useAuthStore();
	const [logs, setLogs] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [open, setOpen] = useState(false);

	const [form, setForm] = useState({
		courseGradeId: "",
		businessType: "bakery",
		productionQty: "",
		revenueTotal: "",
		weekDate: new Date().toISOString().split("T")[0],
		notes: "",
	});

	const fetchLogs = async () => {
		const { data, error } =
			await api.students[studentId.toString()].entrepreneurship.get();
		if (!error && data?.success) {
			setLogs(data.data as any[]);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		fetchLogs();
	}, [studentId]);

	const handleSubmit = async () => {
		if (!form.courseGradeId)
			return toast.error("Pilih mata kuliah terlebih dahulu");
		setIsSubmitting(true);
		const { error } = await api.students[
			studentId.toString()
		].entrepreneurship.post({
			...form,
			productionQty: Number(form.productionQty),
			revenueTotal: Number(form.revenueTotal),
		});
		setIsSubmitting(false);
		if (error) {
			toast.error("Gagal menyimpan rekam bisnis");
		} else {
			toast.success("Rekam bisnis berhasil disimpan");
			setOpen(false);
			fetchLogs();
			if (onUpdate) onUpdate();
		}
	};

	const canAdd = user?.role === "dosen" || user?.role === "superadmin";

	return (
		<Card className="mt-6 border-slate-200 shadow-sm">
			<CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
				<CardTitle className="text-lg font-bold text-slate-800">
					Proyek Kewirausahaan (Weekly)
				</CardTitle>
				{canAdd && (
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-[#0517B0] text-primary-foreground shadow-sm hover:bg-blue-800 px-4 h-8">
							+ Tambah Rekor
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Tambah Rekor Kewirausahaan</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-1">
									<label className="text-sm font-semibold">Mata Kuliah</label>
									<Select
										value={form.courseGradeId}
										onValueChange={(v) =>
											setForm({ ...form, courseGradeId: v || "" })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih MK..." />
										</SelectTrigger>
										<SelectContent>
											{courseGrades
												.filter(
													(c) =>
														c.hasKwu &&
														(c.dosenId === user?.id ||
															user?.role === "superadmin"),
												)
												.map((c) => (
													<SelectItem key={c.id} value={c.id.toString()}>
														{c.courseName}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-1">
										<label className="text-sm font-semibold">Tipe Bisnis</label>
										<Select
											value={form.businessType}
											onValueChange={(v) =>
												setForm({ ...form, businessType: v || "" })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="bakery">Bakery</SelectItem>
												<SelectItem value="barista">Barista</SelectItem>
												<SelectItem value="hk">Housekeeping</SelectItem>
												<SelectItem value="ghost_kitchen">
													Ghost Kitchen
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1">
										<label className="text-sm font-semibold">
											Tanggal (Minggu ke-)
										</label>
										<Input
											type="date"
											value={form.weekDate}
											onChange={(e) =>
												setForm({ ...form, weekDate: e.target.value })
											}
										/>
									</div>
									<div className="space-y-1">
										<label className="text-sm font-semibold">
											Qty Produksi / Layanan
										</label>
										<Input
											type="number"
											placeholder="0"
											value={
												form.productionQty === "0" || !form.productionQty
													? ""
													: form.productionQty
											}
											onChange={(e) =>
												setForm({ ...form, productionQty: e.target.value })
											}
										/>
									</div>
									<div className="space-y-1">
										<label className="text-sm font-semibold">
											Total Omset (Rp)
										</label>
										<Input
											type="number"
											placeholder="0"
											value={
												form.revenueTotal === "0" || !form.revenueTotal
													? ""
													: form.revenueTotal
											}
											onChange={(e) =>
												setForm({ ...form, revenueTotal: e.target.value })
											}
										/>
									</div>
								</div>
								<div className="space-y-1">
									<label className="text-sm font-semibold">Catatan</label>
									<Textarea
										value={form.notes}
										onChange={(e) =>
											setForm({ ...form, notes: e.target.value })
										}
									/>
								</div>
								<Button
									className="w-full bg-[#0517B0] text-white"
									onClick={handleSubmit}
									disabled={isSubmitting}
								>
									{isSubmitting ? "Menyimpan..." : "Simpan Rekor"}
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
							<TableHead className="text-right">Qty</TableHead>
							<TableHead className="text-right">Omset (Rp)</TableHead>
							<TableHead className="text-right text-emerald-600">
								Bagi Hasil Mahasiswa (Rp)
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{logs.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-slate-500 py-6"
								>
									Belum ada rekam kewirausahaan.
								</TableCell>
							</TableRow>
						) : (
							logs.map((log) => (
								<TableRow key={log.id}>
									<TableCell>
										{new Date(log.weekDate).toLocaleDateString("id-ID")}
									</TableCell>
									<TableCell className="capitalize">
										{log.businessType.replace("_", " ")}
									</TableCell>
									<TableCell className="text-right">
										{log.productionQty}
									</TableCell>
									<TableCell className="text-right font-bold">
										{(log.revenueTotal || 0).toLocaleString()}
									</TableCell>
									<TableCell className="text-right font-bold text-emerald-600">
										{(log.profitSharingStudent || 0).toLocaleString()}
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
