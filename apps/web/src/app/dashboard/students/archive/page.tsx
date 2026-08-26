"use client";

import {
	ArrowLeft,
	CheckCircle,
	Clock,
	RotateCcw,
	Search,
	User,
	XCircle,
} from "lucide-react";
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
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useStudentsList } from "@/hooks/useStudentsList";
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
		batch?: number | null;
		academicYear?: string | null;
		subProgram?: string | null;
		phone?: string | null;
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
	const [searchQuery, setSearchQuery] = useState("");
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const {
		data: studentsResult,
		isLoading,
		refetch,
	} = useStudentsList({
		archived: true,
		all: true,
	});

	const data = (studentsResult?.data || []) as unknown as StudentData[];

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
		}
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
			refetch();
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
			const res = await api.students[selectedId].delete();
			if (res.error || !res.data?.success) {
				toast.error(
					(res.data as any)?.message ||
						(res.error?.value as any)?.message ||
						"Gagal menghapus mahasiswa.",
				);
				return;
			}
			toast.success("Mahasiswa berhasil dihapus permanen.");
			refetch();
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
					<div className="flex items-center gap-2 w-full sm:w-auto">
						<div className="relative w-full sm:w-[250px]">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<Input
								placeholder="Cari NIM atau Nama..."
								className="bg-white border-slate-200 text-slate-900 w-full pl-9 h-9 text-xs"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						{searchQuery.trim() !== "" && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setSearchQuery("")}
								className="h-9 px-3 text-xs border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 font-medium transition-colors"
							>
								<RotateCcw className="w-3.5 h-3.5 text-slate-500" />
								Reset
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<Table>
						<TableHeader className="border-slate-200">
							<TableRow className="border-slate-200 hover:bg-transparent">
								<TableHead className="text-slate-500">Nama</TableHead>
								<TableHead className="text-slate-500">Batch</TableHead>
								<TableHead className="text-slate-500">Tahun Ajaran</TableHead>
								<TableHead className="text-slate-500">Program Studi</TableHead>
								<TableHead className="text-slate-500">Peminatan</TableHead>
								<TableHead className="text-slate-500">
									No. HP/WhatsApp
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
										<TableCell className="text-slate-900 font-semibold">
											{s.student.name}
										</TableCell>
										<TableCell>
											{s.student.batch ? `Batch ${s.student.batch}` : "-"}
										</TableCell>
										<TableCell>{s.student.program || "-"}</TableCell>
										<TableCell>
											<PeminatanBadge
												subProgram={s.student.subProgram}
												program={s.student.program}
											/>
										</TableCell>
										<TableCell>{s.student.phone || "-"}</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-1.5">
												{(useAuthStore.getState().user?.role === "superadmin" ||
													useAuthStore.getState().user?.role === "pmb") && (
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															router.push(
																`/dashboard/students/${s.student.id}/profile`,
															);
														}}
														className="h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 gap-1 px-2.5 shadow-2xs cursor-pointer"
														title="Lihat Detail Profil Mahasiswa"
													>
														<User className="w-3.5 h-3.5 text-[#0517B0]" />
														Lihat
													</Button>
												)}
												<Button
													variant="outline"
													size="sm"
													disabled={isProcessing}
													onClick={(e) => handleRestore(e, s.student.id)}
													className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 h-8 text-xs px-2.5 font-medium cursor-pointer"
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
														className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 h-8 text-xs px-2.5 font-medium cursor-pointer"
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
