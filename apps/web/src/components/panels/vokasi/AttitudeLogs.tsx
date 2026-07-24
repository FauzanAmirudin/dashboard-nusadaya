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

export function AttitudeLogs({
	studentId,
	courseGrades,
}: {
	studentId: number;
	courseGrades: any[];
}) {
	const { user } = useAuthStore();
	const [logs, setLogs] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [open, setOpen] = useState(false);

	const [form, setForm] = useState({
		courseGradeId: "",
		disciplineScore: "3",
		activenessScore: "3",
		date: new Date().toISOString().split("T")[0],
		notes: "",
	});

	const fetchLogs = async () => {
		const { data, error } =
			await api.students[studentId.toString()]["attitude-logs"].get();
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
		const { error } =
			await api.students[studentId.toString()]["attitude-logs"].post(form);
		setIsSubmitting(false);
		if (error) {
			toast.error("Gagal menyimpan log sikap");
		} else {
			toast.success("Log sikap berhasil disimpan");
			setOpen(false);
			fetchLogs();
		}
	};

	const canAdd = user?.role === "dosen" || user?.role === "superadmin";

	return (
		<Card className="mt-6 border-slate-200 shadow-sm">
			<CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
				<CardTitle className="text-lg font-bold text-slate-800">
					Log Penilaian Sikap (Harian)
				</CardTitle>
				{canAdd && (
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-[#0517B0] text-primary-foreground shadow-sm hover:bg-blue-800 px-4 h-8">
							+ Tambah Log
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Tambah Log Penilaian Sikap</DialogTitle>
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
														c.dosenId === user?.id ||
														user?.role === "superadmin",
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
										<label className="text-sm font-semibold">Tanggal</label>
										<Input
											type="date"
											value={form.date}
											onChange={(e) =>
												setForm({ ...form, date: e.target.value })
											}
										/>
									</div>
									<div className="space-y-1">
										<label className="text-sm font-semibold">
											Kedisiplinan (1-5)
										</label>
										<Select
											value={form.disciplineScore}
											onValueChange={(v) =>
												setForm({ ...form, disciplineScore: v || "" })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{[1, 2, 3, 4, 5].map((v) => (
													<SelectItem key={v} value={v.toString()}>
														{v}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1">
										<label className="text-sm font-semibold">
											Keaktifan (1-5)
										</label>
										<Select
											value={form.activenessScore}
											onValueChange={(v) =>
												setForm({ ...form, activenessScore: v || "" })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{[1, 2, 3, 4, 5].map((v) => (
													<SelectItem key={v} value={v.toString()}>
														{v}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
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
									{isSubmitting ? "Menyimpan..." : "Simpan Log"}
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
							<TableHead>Dosen</TableHead>
							<TableHead className="text-center">Disiplin</TableHead>
							<TableHead className="text-center">Aktif</TableHead>
							<TableHead>Catatan</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{logs.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-slate-500 py-6"
								>
									Belum ada log penilaian sikap.
								</TableCell>
							</TableRow>
						) : (
							logs.map((log) => (
								<TableRow key={log.id}>
									<TableCell>
										{new Date(log.date).toLocaleDateString("id-ID")}
									</TableCell>
									<TableCell>{log.dosenId?.fullName}</TableCell>
									<TableCell className="text-center font-bold text-slate-700">
										{log.disciplineScore}
									</TableCell>
									<TableCell className="text-center font-bold text-slate-700">
										{log.activenessScore}
									</TableCell>
									<TableCell className="max-w-xs truncate" title={log.notes}>
										{log.notes || "-"}
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
