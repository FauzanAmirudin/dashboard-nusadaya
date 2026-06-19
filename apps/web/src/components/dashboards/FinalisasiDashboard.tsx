"use client";

import {
	CheckCircle,
	Clock,
	Download,
	LayoutDashboard,
	Printer,
	Search,
	ShieldCheck,
	Users,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { exportToCSV } from "@/lib/export";

export function FinalisasiDashboard({
	data,
	searchQuery,
	setSearchQuery,
	user,
	onUpdate,
}: any) {
	const router = useRouter();

	const [isBulkApproving, setIsBulkApproving] = useState(false);
	const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
	const [departureDate, setDepartureDate] = useState<string>("");
	const [notes, setNotes] = useState<string>("");

	const totalKandidat = data?.length || 0;
	const countDisetujui =
		data?.filter(
			(s: any) =>
				s.decision?.isApprovedByDirector || s.student.overallStatus === "AMAN",
		).length || 0;
	const countMenunggu =
		data?.filter(
			(s: any) =>
				!s.decision?.isApprovedByDirector && s.student.overallStatus !== "AMAN",
		).length || 0;
	const countPerluPerhatian =
		data?.filter((s: any) => s.student.overallStatus !== "AMAN").length || 0;

	// Export function removed - using PDF instead

	const filteredData =
		data?.filter(
			(s: any) =>
				s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.student.nim.includes(searchQuery),
		) || [];

	const handleBulkApprove = async () => {
		setIsBulkApproving(true);
		let successCount = 0;
		const eligibleStudents = data.filter(
			(s: any) =>
				!s.decision?.isApprovedByDirector && s.student.overallStatus === "AMAN",
		);

		for (const student of eligibleStudents) {
			try {
				await api.students[student.student.id]["final-decision"][
					"director-approval"
				].patch({
					isApproved: true,
					notes: "Bulk approval oleh Direktur",
				});
				successCount++;
			} catch (e) {
				console.error(e);
			}
		}

		setIsBulkApproving(false);
		toast.success(`${successCount} mahasiswa berhasil disetujui`);
		onUpdate();
	};

	const handleSingleApprove = async (id: number, isApproved: boolean) => {
		try {
			const res = await api.students[id]["final-decision"][
				"director-approval"
			].patch({
				isApproved,
				departureDate: departureDate || undefined,
				notes: notes || undefined,
			});
			if (res.data?.success) {
				toast.success(
					isApproved ? "Mahasiswa disetujui" : "Persetujuan dicabut",
				);
				setActiveStudentId(null);
				setDepartureDate("");
				setNotes("");
				onUpdate();
			} else {
				toast.error(res.data?.message || "Gagal memproses");
			}
		} catch (e) {
			toast.error("Terjadi kesalahan");
		}
	};

	return (
		<div className="space-y-6 pb-10">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Dashboard Panel Finalisasi
					</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Selamat datang, {user?.username || "Direktur"}. Berikut daftar
						kandidat yang menunggu approval akhir.
					</p>
				</div>
				<div className="flex items-center gap-3">
					{/* Bulk Approve removed since it is now automatic */}
					{/* Global export removed per user request */}
				</div>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-[#0517B0]">
							<Users className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Total Kandidat
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{totalKandidat}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-amber-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-amber-500">
							<Clock className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Menunggu Approval
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countMenunggu}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-emerald-500">
							<ShieldCheck className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Disetujui Direktur
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countDisetujui}
							</p>
						</div>
					</CardContent>
				</Card>
				<Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-rose-500">
					<CardContent className="p-5 flex items-start gap-4">
						<div className="mt-0.5 text-rose-500">
							<XCircle className="h-6 w-6" />
						</div>
						<div>
							<p className="text-slate-500 text-sm font-medium">
								Perlu Perhatian / Tidak Aman
							</p>
							<p className="text-3xl font-bold text-slate-900 mt-1">
								{countPerluPerhatian}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* List Mahasiswa dengan Keputusan */}
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="border-b border-slate-200 pb-4 bg-slate-50/50">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<CardTitle className="text-slate-800 text-lg">
							Daftar Kandidat Keberangkatan
						</CardTitle>
						<div className="relative w-full md:w-72">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari NIM atau Nama Mahasiswa..."
								className="pl-9 bg-white"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-4 sm:p-6">
					<div className="overflow-x-auto border border-slate-200 rounded-md">
						<Table>
							<TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
								<TableRow className="border-slate-200 hover:bg-slate-50">
									<TableHead className="text-slate-500 font-semibold py-3">
										NIM
									</TableHead>
									<TableHead className="text-slate-500 font-semibold py-3">
										Nama Lengkap
									</TableHead>
									<TableHead className="text-slate-500 font-semibold py-3">
										Program
									</TableHead>
									<TableHead className="text-slate-500 font-semibold text-center py-3">
										Status Sistem
									</TableHead>
									<TableHead className="text-slate-500 font-semibold text-center py-3">
										Persetujuan Direktur
									</TableHead>
									<TableHead className="text-slate-500 font-semibold text-right py-3 pr-4">
										Aksi
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredData.map((s: any) => (
									<TableRow
										key={s.student.id}
										className="border-slate-200 hover:bg-blue-50/50 transition-colors"
									>
										<TableCell className="font-medium text-slate-700">
											{s.student.nim}
										</TableCell>
										<TableCell className="text-slate-900 font-semibold">
											{s.student.name}
										</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Badge
													variant="outline"
													className="text-slate-500 border-slate-200"
												>
													{s.student.cohort}
												</Badge>
												<span className="text-sm text-slate-600">
													{s.student.program}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-center">
											{s.student.overallStatus === "AMAN" ? (
												<Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
													🟢 Aman
												</Badge>
											) : (
												<Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20">
													🟡 Perhatian
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-center">
											{s.decision?.isApprovedByDirector ||
											s.student.overallStatus === "AMAN" ? (
												<Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
													<ShieldCheck className="w-3 h-3 mr-1" /> Diterima
												</Badge>
											) : (
												<Badge className="bg-slate-500/10 text-slate-600 border border-slate-500/20">
													<Clock className="w-3 h-3 mr-1" /> Menunggu
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-right pr-4">
											<div className="flex justify-end gap-2 items-center">
												<Button
													variant="outline"
													size="sm"
													className="h-8 text-slate-600 border-slate-200 hover:bg-slate-50 gap-1.5 px-2"
													onClick={() =>
														router.push(
															`/dashboard/finalisasi/${s.student.id}/data`,
														)
													}
													title="Cetak Data Finalisasi (PDF)"
												>
													<Printer className="h-3.5 w-3.5" />
													<span className="hidden sm:inline">Data PDF</span>
												</Button>
												{s.decision?.isApprovedByDirector ||
												s.student.overallStatus === "AMAN" ? (
													<>
														<AlertDialog>
															<AlertDialogTrigger
																render={(props: any) => (
																	<Button
																		{...props}
																		variant="outline"
																		size="sm"
																		className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
																		onClick={() => {
																			setDepartureDate(
																				s.decision?.departureDate
																					? new Date(s.decision.departureDate)
																							.toISOString()
																							.split("T")[0]
																					: "",
																			);
																			setNotes(s.decision?.notes || "");
																		}}
																	>
																		Atur Keberangkatan
																	</Button>
																)}
															/>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Atur Jadwal & Catatan {s.student.name}
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Lengkapi tanggal keberangkatan dan catatan
																		untuk keperluan SK.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<div className="grid gap-4 py-4">
																	<div className="grid gap-2">
																		<Label htmlFor="departure">
																			Tanggal Keberangkatan
																		</Label>
																		<Input
																			id="departure"
																			type="date"
																			value={departureDate}
																			onChange={(e) =>
																				setDepartureDate(e.target.value)
																			}
																		/>
																	</div>
																	<div className="grid gap-2">
																		<Label htmlFor="notes">
																			Catatan Tambahan (Opsional)
																		</Label>
																		<Textarea
																			id="notes"
																			placeholder="Catatan dari Direktur..."
																			value={notes}
																			onChange={(e) => setNotes(e.target.value)}
																		/>
																	</div>
																</div>
																<AlertDialogFooter>
																	<AlertDialogCancel>Batal</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			handleSingleApprove(s.student.id, true)
																		}
																		className="bg-[#0517B0] hover:bg-blue-800 text-white"
																	>
																		Simpan Data
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
														<Button
															size="sm"
															className="h-8 bg-[#0517B0] hover:bg-blue-800 text-white gap-2"
															onClick={() =>
																router.push(
																	`/dashboard/finalisasi/${s.student.id}/sk`,
																)
															}
														>
															<Printer className="h-3 w-3" />
															Cetak SK
														</Button>
													</>
												) : (
													<Badge
														variant="outline"
														className="text-slate-400 border-slate-200"
													>
														Menunggu Divisi
													</Badge>
												)}
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						{filteredData.length === 0 && (
							<div className="text-center py-8 text-slate-500">
								Tidak ada data kandidat.
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
