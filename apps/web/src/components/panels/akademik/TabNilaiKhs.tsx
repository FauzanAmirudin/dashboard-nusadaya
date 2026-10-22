"use client";

import {
	AlertCircle,
	Award,
	BookOpen,
	Calculator,
	CheckCircle,
	CheckCircle2,
	Download,
	ExternalLink,
	FileCheck,
	FileText,
	GraduationCap,
	Layers,
	Loader2,
	Printer,
	RefreshCw,
	Send,
	ShieldCheck,
	Sparkles,
	Upload,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { getToken } from "@/lib/eden";

interface TabNilaiKhsProps {
	studentId: number;
	canEdit: boolean;
	studentData?: any;
	acadState?: any;
	onRefresh: () => void;
}

export function TabNilaiKhs({
	studentId,
	canEdit,
	studentData,
	acadState,
	onRefresh,
}: TabNilaiKhsProps) {
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	const [isLoading, setIsLoading] = useState(true);
	const [isUpdatingPddikti, setIsUpdatingPddikti] = useState(false);

	const [selectedSemester, setSelectedSemester] = useState<number>(1);
	const [summaryData, setSummaryData] = useState<any>(null);

	// Modals
	const [isPddiktiModalOpen, setIsPddiktiModalOpen] = useState(false);
	const [pddiktiRegNo, setPddiktiRegNo] = useState("");

	const fetchKhsData = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/academic/khs?semester=${selectedSemester}&_t=${Date.now()}`,
				{
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Cache-Control": "no-cache",
						Pragma: "no-cache",
					},
					cache: "no-store",
				},
			);
			const json = await res.json();
			if (json.success && json.data) {
				setSummaryData(json.data);
				if (json.data.pddiktiRegNo) {
					setPddiktiRegNo(json.data.pddiktiRegNo);
				}
			}
		} catch (err) {
			console.error("Gagal memuat KHS:", err);
			toast.error("Gagal mengambil data KHS mahasiswa");
		} finally {
			setIsLoading(false);
		}
	}, [API_URL, studentId, selectedSemester]);

	useEffect(() => {
		fetchKhsData();
	}, [fetchKhsData]);

	// 4. Update Status Pelaporan PDDIKTI (Segmen 14)
	const handleSavePddiktiReport = async () => {
		setIsUpdatingPddikti(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/academic/pddikti-report`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						isReported: true,
						regNo: pddiktiRegNo,
					}),
				},
			);
			const json = await res.json();
			if (json.success) {
				toast.success("Status pelaporan PDDIKTI berhasil diperbarui");
				setIsPddiktiModalOpen(false);
				await fetchKhsData();
				onRefresh();
			} else {
				toast.error(json.message || "Gagal menyimpan status PDDIKTI");
			}
		} catch (err) {
			toast.error("Gagal menghubungi server");
		} finally {
			setIsUpdatingPddikti(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-xl border border-slate-200">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
				<p className="text-xs text-slate-500 font-medium">
					Memuat rincian nilai perkuliahan & KHS mahasiswa...
				</p>
			</div>
		);
	}

	const grades = summaryData?.grades || [];
	const gpaDisplay = summaryData?.gpaDisplay || "0.00";
	const gpaNum = Number(gpaDisplay) || 0;
	const totalSksTaken = summaryData?.totalSksTaken || 0;
	const totalSksPassed = summaryData?.totalSksPassed || 0;
	const isKhsPublished = summaryData?.khsPublished ?? false;
	const isSyncedMagang = summaryData?.syncedToMagang ?? false;
	const isPddiktiReported = summaryData?.pddiktiReported ?? false;

	return (
		<div className="space-y-6">
			{/* Top Action Bar & Control Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="p-2 bg-blue-50 text-[#0517B0] rounded-lg">
							<GraduationCap className="w-5 h-5" />
						</span>
						<div>
							<h3 className="text-base font-bold text-slate-900">
								Perhitungan Nilai Otomatis & Dokumen KHS/KRS (AKD-06)
							</h3>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-1.5 mr-2">
						<span className="text-xs font-semibold text-slate-600">
							Semester:
						</span>
						<Select
							value={selectedSemester.toString()}
							onValueChange={(val) => setSelectedSemester(Number(val))}
						>
							<SelectTrigger className="w-32 h-9 text-xs bg-slate-50 border-slate-200 font-medium">
								<SelectValue placeholder="Semester" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">Semester 1</SelectItem>
								<SelectItem value="2">Semester 2</SelectItem>
								<SelectItem value="3">Semester 3</SelectItem>
								<SelectItem value="4">Semester 4</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => fetchKhsData()}
						disabled={isLoading}
						className="h-9 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
						title="Perbarui data nilai langsung secara real-time dari database"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${
								isLoading ? "animate-spin text-[#0517B0]" : "text-slate-600"
							}`}
						/>
						<span>Perbarui</span>
					</Button>

					<Link
						href={`/dashboard/students/${studentId}/khs?semester=${selectedSemester}`}
						target="_blank"
					>
						<Button
							variant="outline"
							size="sm"
							className="h-9 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
						>
							<Printer className="w-3.5 h-3.5 text-slate-600" />
							Cetak KHS
						</Button>
					</Link>

					<Link
						href={`/dashboard/students/${studentId}/transkrip`}
						target="_blank"
					>
						<Button
							variant="outline"
							size="sm"
							className="h-9 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
						>
							<Award className="w-3.5 h-3.5 text-amber-600" />
							Transkrip Nilai
						</Button>
					</Link>
				</div>
			</div>

			{/* KPI Performance Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{/* IPK / GPA */}
				<div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/40 rounded-2xl border border-indigo-100 flex flex-col justify-between">
					<p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
						IPK Kumulatif
					</p>
					<div className="my-2">
						<span className="text-3xl font-black text-indigo-950 font-mono">
							{gpaDisplay}
						</span>
						<span className="text-xs text-indigo-600 font-semibold ml-1">
							/ 4.00
						</span>
					</div>
					<Progress
						value={(gpaNum / 4) * 100}
						className="h-1.5 bg-indigo-200/50 rounded-full"
					/>
				</div>

				{/* SKS Lulus */}
				<div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-col justify-between">
					<p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
						SKS Lulus
					</p>
					<div className="my-2">
						<span className="text-3xl font-black text-emerald-950 font-mono">
							{totalSksPassed}
						</span>
						<span className="text-xs text-emerald-700 font-semibold ml-1">
							/ {totalSksTaken} SKS
						</span>
					</div>
					<p className="text-[11px] text-emerald-700 font-medium">
						{totalSksPassed === totalSksTaken && totalSksTaken > 0
							? "100% SKS Terpenuhi"
							: `${totalSksTaken - totalSksPassed} SKS Belum Lulus`}
					</p>
				</div>

				{/* Status UTS & UAS */}
				<div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex flex-col justify-between">
					<p className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">
						Evaluasi UTS & UAS
					</p>
					<div className="my-1.5 space-y-1">
						<div className="flex items-center justify-between text-xs font-semibold">
							<span className="text-slate-600">UTS:</span>
							{summaryData?.allUtsPassed ? (
								<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] py-0">
									Lulus
								</Badge>
							) : (
								<Badge className="bg-rose-100 text-rose-800 border-0 text-[10px] py-0">
									Remedial
								</Badge>
							)}
						</div>
						<div className="flex items-center justify-between text-xs font-semibold">
							<span className="text-slate-600">UAS:</span>
							{summaryData?.allUasPassed ? (
								<Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px] py-0">
									Lulus
								</Badge>
							) : (
								<Badge className="bg-rose-100 text-rose-800 border-0 text-[10px] py-0">
									Remedial
								</Badge>
							)}
						</div>
					</div>
					<p className="text-[10px] text-sky-700 italic">Standar Min. 60</p>
				</div>

				{/* Feeder PDDIKTI (Segmen 14) */}
				<div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col justify-between">
					<p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
						Feeder PDDIKTI
					</p>
					<div className="my-1.5">
						{isPddiktiReported ? (
							<Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold gap-1 text-[11px]">
								<FileCheck className="w-3 h-3 text-indigo-600" />
								Terlapor Dikti
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="text-slate-500 border-slate-200 text-[11px]"
							>
								Belum Terlapor
							</Badge>
						)}
					</div>
					{canEdit && (
						<Button
							size="sm"
							variant="outline"
							onClick={() => setIsPddiktiModalOpen(true)}
							className="h-7 text-[11px] w-full mt-1 border-slate-200 text-slate-700 hover:bg-slate-50"
						>
							Input No. Dikti
						</Button>
					)}
				</div>
			</div>

			{/* Main Table: Rincian Komponen Nilai Perkuliahan */}
			<Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-2xl">
				<CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<BookOpen className="w-4 h-4 text-[#0517B0]" />
							Rincian Gabungan Komponen Nilai per Mata Kuliah
						</CardTitle>
						<p className="text-xs text-slate-500 mt-0.5">
							Semester {selectedSemester} • Terdaftar {grades.length} mata
							kuliah ({totalSksTaken} Total SKS)
						</p>
					</div>

					<div className="flex items-center gap-2">
						<span className="text-xs text-slate-500 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
							Bobot: P (10-15%) | T (20-25%) | Prak (40%) | UTS (15-30%) | UAS
							(15-30%)
						</span>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{grades.length === 0 ? (
						<div className="p-10 text-center space-y-2">
							<AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
							<p className="text-sm font-semibold text-slate-700">
								Belum ada mata kuliah yang terdaftar untuk mahasiswa ini
							</p>
							<p className="text-xs text-slate-500 max-w-sm mx-auto">
								Pastikan kurikulum dan jadwal mata kuliah untuk Kohort{" "}
								{summaryData?.cohort} telah dibuka.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50/90 text-xs">
									<TableRow>
										<TableHead className="w-12 text-center font-bold">
											No
										</TableHead>
										<TableHead className="w-24 font-bold">Kode</TableHead>
										<TableHead className="font-bold min-w-[200px]">
											Mata Kuliah
										</TableHead>
										<TableHead className="text-center font-bold w-14">
											SKS
										</TableHead>
										<TableHead className="text-center font-bold w-20">
											Presensi
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											Teori
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											Praktik
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											UTS
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											UAS
										</TableHead>
										<TableHead className="text-center font-bold w-20 bg-blue-50/50 text-[#0517B0]">
											Nilai Akhir
										</TableHead>
										<TableHead className="text-center font-bold w-16 bg-blue-50/50 text-[#0517B0]">
											Grade
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											Bobot
										</TableHead>
										<TableHead className="text-center font-bold w-16">
											Mutu
										</TableHead>
										<TableHead className="text-center font-bold w-24">
											Status
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{grades.map((item: any, idx: number) => {
										const isA = item.grade?.startsWith("A");
										const isB = item.grade?.startsWith("B");
										const isC = item.grade?.startsWith("C");
										const isFail = item.grade === "D" || item.grade === "E";

										return (
											<TableRow
												key={item.courseId || idx}
												className="hover:bg-slate-50/80 text-xs"
											>
												<TableCell className="text-center font-mono text-slate-500">
													{idx + 1}
												</TableCell>
												<TableCell className="font-mono font-bold text-slate-700">
													{item.code}
												</TableCell>
												<TableCell>
													<div className="font-semibold text-slate-900">
														{item.name}
													</div>
													<div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
														<span className="capitalize text-slate-600">
															{item.type}
														</span>
														<span>•</span>
														<span>{item.dosenName}</span>
													</div>
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-slate-800">
													{item.sks}
												</TableCell>
												<TableCell className="text-center font-mono">
													<span
														className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
															item.attendanceRate >= 80
																? "text-emerald-700 bg-emerald-50"
																: "text-rose-700 bg-rose-50"
														}`}
													>
														{item.attendanceRate}%
													</span>
													<div className="text-[10px] text-slate-400 mt-0.5">
														{item.attendancePresent}/16
													</div>
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700">
													{item.theoryScore || "-"}
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700">
													{item.practicalScore || "-"}
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700">
													{item.utsScore || "-"}
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700">
													{item.uasScore || "-"}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-sm bg-blue-50/30 text-blue-950">
													{item.finalScore}
												</TableCell>
												<TableCell className="text-center bg-blue-50/30">
													<Badge
														className={`font-black text-xs px-2 py-0.5 ${
															isA
																? "bg-emerald-100 text-emerald-800 border-emerald-300"
																: isB
																	? "bg-blue-100 text-blue-800 border-blue-300"
																	: isC
																		? "bg-amber-100 text-amber-800 border-amber-300"
																		: "bg-rose-100 text-rose-800 border-rose-300"
														}`}
													>
														{item.grade}
													</Badge>
												</TableCell>
												<TableCell className="text-center font-mono text-slate-700 font-semibold">
													{((item.gradePoint || 0) / 100).toFixed(2)}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-slate-900">
													{item.qualityScore?.toFixed(2) || "0.00"}
												</TableCell>
												<TableCell className="text-center">
													{item.isPassed ? (
														<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
															Lulus
														</Badge>
													) : (
														<Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
															Tidak Lulus
														</Badge>
													)}
												</TableCell>
											</TableRow>
										);
									})}

									{/* Total & Rata-rata Footer */}
									<TableRow className="bg-slate-100/90 font-bold text-xs border-t-2 border-slate-300">
										<TableCell
											colSpan={3}
											className="text-right uppercase tracking-wider text-slate-800"
										>
											Total SKS & Nilai Mutu Semester {selectedSemester}:
										</TableCell>
										<TableCell className="text-center font-mono text-blue-950 text-sm">
											{totalSksTaken} SKS
										</TableCell>
										<TableCell
											colSpan={8}
											className="text-right text-slate-700"
										>
											Total Bobot x SKS:{" "}
											<span className="font-mono text-slate-950">
												{summaryData?.qualityScoreTotal?.toFixed(2) || "0.00"}
											</span>
										</TableCell>
										<TableCell className="text-center font-mono font-bold text-sm text-[#0517B0]">
											IPS: {gpaDisplay}
										</TableCell>
										<TableCell />
									</TableRow>
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* DIALOG 3: Input Nomor Registrasi PDDIKTI */}
			<Dialog open={isPddiktiModalOpen} onOpenChange={setIsPddiktiModalOpen}>
				<DialogContent className="max-w-md bg-white p-6">
					<DialogHeader>
						<DialogTitle className="text-base font-bold flex items-center gap-2">
							<FileCheck className="w-5 h-5 text-indigo-600" />
							Pelaporan Feeder PDDIKTI Mahasiswa
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-3 text-xs">
						<div className="space-y-1.5">
							<label className="font-semibold text-slate-700">
								Nomor Registrasi / NIM PDDIKTI:
							</label>
							<Input
								placeholder="Contoh: DIKTI-2026-00492"
								value={pddiktiRegNo}
								onChange={(e) => setPddiktiRegNo(e.target.value)}
								className="text-xs h-9 bg-slate-50 font-mono"
							/>
						</div>
					</div>

					<DialogFooter className="flex justify-end gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsPddiktiModalOpen(false)}
						>
							Batal
						</Button>
						<Button
							size="sm"
							onClick={handleSavePddiktiReport}
							disabled={isUpdatingPddikti}
							className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold"
						>
							{isUpdatingPddikti ? "Menyimpan..." : "Tandai Terlapor"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
