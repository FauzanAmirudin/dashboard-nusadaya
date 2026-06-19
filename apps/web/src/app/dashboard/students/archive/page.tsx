"use client";

import { ArrowLeft, CheckCircle, Clock, Search, XCircle } from "lucide-react";
import Link from "next/link";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type StudentData = {
	student: {
		id: number;
		nim: string;
		name: string;
		cohort: number;
		program: string;
		overallStatus: string | null;
	};
	pmb: { status: string | null; isAcc: boolean | null } | null;
	crm: { status: string | null; isAcc: boolean | null } | null;
	finance: { status: string | null; isAcc: boolean | null } | null;
	academic: { status: string | null; isAcc: boolean | null } | null;
	pa: { status: string | null; isAcc: boolean | null } | null;
	internship: { status: string | null; isAcc: boolean | null } | null;
	decision: { isApprovedByDirector: boolean | null } | null;
};

const STATUS_COLORS = {
	AMAN: {
		bg: "bg-emerald-500/10",
		text: "text-emerald-500",
		border: "border-emerald-500/20",
	},
	PERLU_PERHATIAN: {
		bg: "bg-amber-500/10",
		text: "text-amber-500",
		border: "border-amber-500/20",
	},
	TIDAK_AMAN: {
		bg: "bg-rose-500/10",
		text: "text-rose-500",
		border: "border-rose-500/20",
	},
};

export default function StudentsPage() {
	const router = useRouter();
	const { isAuthenticated, hasHydrated } = useAuthStore();
	const [data, setData] = useState<StudentData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		const fetchStudents = async () => {
			const { data: resData, error } = await api.students.get({
				$query: { archived: "true" },
			});
			if (!error && resData?.data) {
				setData(resData.data as unknown as StudentData[]);
			}
			setIsLoading(false);
		};

		fetchStudents();
		const interval = setInterval(fetchStudents, 15000);
		return () => clearInterval(interval);
	}, [isAuthenticated, hasHydrated, router]);

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full text-slate-400">
				Memuat data arsip...
			</div>
		);
	}

	const handleRestore = async (e: React.MouseEvent, id: number) => {
		e.stopPropagation();
		setIsProcessing(true);
		try {
			const { error } = await api.students[id].unarchive.patch();
			if (error) {
				toast.error("Gagal memulihkan mahasiswa.");
				return;
			}
			toast.success("Mahasiswa berhasil dipulihkan.");
			setData((prev) => prev.filter((s) => s.student.id !== id));
		} catch (err) {
			toast.error("Terjadi kesalahan sistem.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedId) return;
		setIsProcessing(true);
		try {
			const { error } = await api.students[selectedId].delete();
			if (error) {
				toast.error(
					"Gagal menghapus mahasiswa. Anda mungkin tidak memiliki izin.",
				);
				return;
			}
			toast.success("Mahasiswa berhasil dihapus permanen.");
			setData((prev) => prev.filter((s) => s.student.id !== selectedId));
			setShowDeleteDialog(false);
		} catch (err) {
			toast.error("Terjadi kesalahan sistem.");
		} finally {
			setIsProcessing(false);
		}
	};

	const filteredData = data.filter(
		(s) =>
			s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.student.nim.includes(searchQuery),
	);

	const renderStatusIcon = (status: string | null | undefined) => {
		if (status === "AMAN")
			return <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />;
		if (status === "TIDAK_AMAN")
			return <XCircle className="h-4 w-4 text-rose-500 mx-auto" />;
		return <Clock className="h-4 w-4 text-amber-500 mx-auto" />;
	};

	return (
		<div className="space-y-6 pb-10">
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Apakah Anda yakin ingin menghapus?
						</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini tidak dapat dibatalkan. Menghapus mahasiswa ini akan
							secara permanen menghapus semua data yang berkaitan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							disabled={isProcessing}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{isProcessing ? "Menghapus..." : "Ya, Hapus Permanen"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Arsip Mahasiswa</h1>
					<p className="text-slate-500 mt-1 text-sm">
						Daftar mahasiswa yang telah diarsipkan dari tabel master.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Link
						href="/dashboard/students"
						className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium mr-4"
					>
						<ArrowLeft className="w-4 h-4" />
						Kembali ke Daftar Master
					</Link>
				</div>
			</div>

			{/* Master Table */}
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<CardTitle className="text-slate-800">
						Tabel Master Mahasiswa
					</CardTitle>
					<div className="flex items-center gap-2 w-full sm:w-auto relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<Input
							placeholder="Cari NIM atau Nama..."
							className="bg-white border-slate-200 text-slate-900 w-full sm:w-[250px] pl-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<Table>
						<TableHeader className="border-slate-200">
							<TableRow className="border-slate-200 hover:bg-transparent">
								<TableHead className="text-slate-500">NIM</TableHead>
								<TableHead className="text-slate-500">Nama Lengkap</TableHead>
								<TableHead className="text-slate-500">Angkatan</TableHead>
								<TableHead className="text-slate-500 text-center">
									Status
								</TableHead>
								<TableHead className="text-slate-500 text-center">
									PMB
								</TableHead>
								<TableHead className="text-slate-500 text-center">
									CRM
								</TableHead>
								<TableHead className="text-slate-500 text-center">
									Finance
								</TableHead>
								<TableHead className="text-slate-500 text-center">
									Akademik
								</TableHead>
								<TableHead className="text-slate-500 text-center">PA</TableHead>
								<TableHead className="text-slate-500 text-center">
									Magang
								</TableHead>
								<TableHead className="text-slate-500 text-center">
									Direktur
								</TableHead>
								<TableHead className="text-slate-500 text-right">
									Aksi
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredData.map((s) => {
								const sColor = s.student.overallStatus
									? STATUS_COLORS[
											s.student.overallStatus as keyof typeof STATUS_COLORS
										]
									: STATUS_COLORS.PERLU_PERHATIAN;

								return (
									<TableRow
										key={s.student.id}
										className="border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
										onClick={() =>
											router.push(`/dashboard/students/${s.student.id}`)
										}
									>
										<TableCell className="font-medium text-slate-700">
											{s.student.nim}
										</TableCell>
										<TableCell className="text-slate-900 font-semibold">
											{s.student.name}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className="text-slate-500 border-slate-200"
											>
												{s.student.cohort}
											</Badge>
										</TableCell>
										<TableCell className="text-center">
											<Badge
												className={`${sColor.bg} ${sColor.text} ${sColor.border} border hover:bg-transparent`}
											>
												{s.student.overallStatus === "AMAN"
													? "🟢 Aman"
													: s.student.overallStatus === "TIDAK_AMAN"
														? "🔴 Tdk Aman"
														: "🟡 Perhatian"}
											</Badge>
										</TableCell>
										<TableCell>
											{renderStatusIcon(s.pmb?.isAcc ? "AMAN" : s.pmb?.status)}
										</TableCell>
										<TableCell>
											{renderStatusIcon(s.crm?.isAcc ? "AMAN" : s.crm?.status)}
										</TableCell>
										<TableCell>
											{renderStatusIcon(
												s.finance?.isAcc ? "AMAN" : s.finance?.status,
											)}
										</TableCell>
										<TableCell>
											{renderStatusIcon(
												s.academic?.isAcc ? "AMAN" : s.academic?.status,
											)}
										</TableCell>
										<TableCell>
											{renderStatusIcon(s.pa?.isAcc ? "AMAN" : s.pa?.status)}
										</TableCell>
										<TableCell>
											{renderStatusIcon(
												s.internship?.isAcc ? "AMAN" : s.internship?.status,
											)}
										</TableCell>
										<TableCell className="text-center">
											{s.decision?.isApprovedByDirector ? (
												<Badge className="bg-blue-100 text-[#0517B0] hover:bg-blue-100">
													Sudah
												</Badge>
											) : (
												<span className="text-xs text-slate-500">Belum</span>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													disabled={isProcessing}
													onClick={(e) => handleRestore(e, s.student.id)}
													className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 h-8 text-xs px-2"
												>
													Kembalikan
												</Button>
												{(useAuthStore.getState().user?.role === "superadmin" ||
													useAuthStore.getState().user?.role === "pmb") && (
													<Button
														variant="outline"
														size="sm"
														disabled={isProcessing}
														onClick={(e) => {
															e.stopPropagation();
															setSelectedId(s.student.id);
															setShowDeleteDialog(true);
														}}
														className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 h-8 text-xs px-2"
													>
														Hapus
													</Button>
												)}
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>

					{filteredData.length === 0 && (
						<div className="text-center py-12 text-slate-500">
							Tidak ada data mahasiswa ditemukan.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
