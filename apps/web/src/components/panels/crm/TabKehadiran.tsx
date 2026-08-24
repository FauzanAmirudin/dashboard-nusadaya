"use client";

import { Activity, AlertTriangle, BookOpen, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/eden";

interface TabKehadiranProps {
	studentId: number;
	crmState: any;
	kehadiranState: any;
	canEdit: boolean;
	fetchCrmData: () => void;
	onUpdate: () => void;
}

export function TabKehadiran({
	studentId,
	crmState,
	kehadiranState,
	canEdit,
	fetchCrmData,
	onUpdate,
}: TabKehadiranProps) {
	const crm = crmState?.crm;
	const [isApproved, setIsApproved] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (crm) {
			setIsApproved(!!crm.practiceAttendance);
		}
	}, [crm]);

	const courses = kehadiranState?.courses || [];

	const attTotal = courses.reduce(
		(acc: number, course: any) => acc + (course.totalMeetings || 16),
		0,
	);

	const attPresent = courses.reduce(
		(acc: number, course: any) => acc + (course.attendancePresent || 0),
		0,
	);

	const attPercent =
		attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;
	const isEligible = attPercent >= 90;

	const handleToggleApproval = async (approved: boolean) => {
		if (!canEdit) return;
		setIsLoading(true);
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				practiceAttendance: approved,
			});
			if (error) throw new Error("Gagal mengubah persetujuan kehadiran");

			toast.success(
				approved
					? "Kehadiran praktik disetujui"
					: "Persetujuan kehadiran dibatalkan",
			);
			setIsApproved(approved);
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Gagal memproses persetujuan");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Ringkasan Akademik */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 p-4">
					<h3 className="font-bold text-slate-800 flex items-center gap-2">
						<Activity className="w-5 h-5 text-[#0517B0]" /> Ringkasan Kehadiran
						Akademik
					</h3>
				</div>
				<CardContent className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						<div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
							<p className="text-sm font-semibold text-slate-500 mb-1">
								Total Pertemuan
							</p>
							<p className="text-3xl font-bold text-slate-800">{attTotal}</p>
						</div>
						<div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
							<p className="text-sm font-semibold text-slate-500 mb-1">
								Total Hadir
							</p>
							<p className="text-3xl font-bold text-slate-800">{attPresent}</p>
						</div>
						<div
							className={`rounded-lg p-4 text-center border ${
								isEligible
									? "bg-emerald-50 border-emerald-100"
									: "bg-rose-50 border-rose-100"
							}`}
						>
							<p
								className={`text-sm font-semibold mb-1 ${
									isEligible ? "text-emerald-600" : "text-rose-600"
								}`}
							>
								Persentase
							</p>
							<p
								className={`text-3xl font-bold ${
									isEligible ? "text-emerald-700" : "text-rose-700"
								}`}
							>
								{attPercent}%
							</p>
						</div>
					</div>
					<div className="mb-4">
						<div className="flex justify-between items-center mb-2">
							<span className="text-sm font-semibold text-slate-600">
								Progres Kehadiran
							</span>
							<span
								className={`text-sm font-bold ${
									isEligible ? "text-emerald-600" : "text-rose-600"
								}`}
							>
								{attPercent}% / 90% (Syarat)
							</span>
						</div>
						<Progress
							value={attPercent}
							className={`h-3 ${isEligible ? "bg-emerald-500" : "bg-rose-500"}`}
						/>
					</div>
					{kehadiranState?.academic?.attendanceAlphaNote && (
						<div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
							<p className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
								<AlertTriangle className="w-4 h-4 text-amber-600 inline" />{" "}
								Catatan Ketidakhadiran (Alpha):
							</p>
							<p className="text-sm text-amber-700">
								{kehadiranState.academic.attendanceAlphaNote}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Data Kehadiran Per Mata Kuliah */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 p-4">
					<h3 className="font-bold text-slate-800 flex items-center gap-2">
						<BookOpen className="w-5 h-5 text-[#0517B0]" /> Kehadiran Per Mata
						Kuliah (Dari Dosen)
					</h3>
				</div>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm text-slate-600">
							<thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-xs">
								<tr>
									<th className="px-6 py-4 font-semibold">Mata Kuliah</th>
									<th className="px-6 py-4 font-semibold">Dosen</th>
									<th className="px-6 py-4 font-semibold text-center">
										Pertemuan
									</th>
									<th className="px-6 py-4 font-semibold text-center">Hadir</th>
									<th className="px-6 py-4 font-semibold text-center">
										% Kehadiran
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{courses.map((course: any, idx: number) => {
									const mkTotal = course.totalMeetings || 16;
									const mkPresent = course.attendancePresent || 0;
									const mkPercent =
										mkTotal > 0 ? Math.round((mkPresent / mkTotal) * 100) : 0;
									const isMkEligible = mkPercent >= 90;

									return (
										<tr
											key={idx}
											className="hover:bg-slate-50 transition-colors"
										>
											<td className="px-6 py-4 font-medium text-slate-800">
												{course.courseName}{" "}
												<span className="text-xs text-slate-400 font-normal ml-1">
													({course.courseCode})
												</span>
											</td>
											<td className="px-6 py-4">
												{course.dosen?.fullName || "-"}
											</td>
											<td className="px-6 py-4 text-center">{mkTotal}</td>
											<td className="px-6 py-4 text-center">{mkPresent}</td>
											<td className="px-6 py-4 text-center">
												<Badge
													variant="outline"
													className={
														isMkEligible
															? "bg-emerald-50 text-emerald-600 border-emerald-200"
															: "bg-rose-50 text-rose-600 border-rose-200"
													}
												>
													{mkPercent}%
												</Badge>
											</td>
										</tr>
									);
								})}
								{courses.length === 0 && (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-8 text-center text-slate-400"
										>
											Belum ada data kehadiran per mata kuliah.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* Section Persetujuan (Approval) */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 p-4">
					<h3 className="font-bold text-slate-800 flex items-center gap-2">
						<span className="text-xl"></span> Validasi Julmah Absensi
					</h3>
				</div>
				<CardContent className="p-6">
					{isApproved ? (
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
									<CheckCircle className="w-6 h-6 text-emerald-600" />
								</div>
								<div>
									<h4 className="text-emerald-700 font-bold text-lg">
										Telah Memenuhi Minimal Jumlah Kehadiran
									</h4>
									<p className="text-sm text-slate-600 mt-1">
										Checklist kehadiran pada modul CRM telah berhasil ditandai
										selesai.
									</p>
								</div>
							</div>
							{canEdit && (
								<Button
									variant="outline"
									className="border-rose-200 text-rose-600 hover:bg-rose-50 w-full sm:w-auto"
									onClick={() => handleToggleApproval(false)}
									disabled={isLoading}
								>
									{isLoading ? "Memproses..." : "Batalkan Finalisasi"}
								</Button>
							)}
						</div>
					) : (
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
									<AlertTriangle className="w-6 h-6 text-slate-400" />
								</div>
								<div>
									<h4 className="text-slate-800 font-bold text-lg">
										Menunggu Validasi
									</h4>
									<p className="text-sm text-slate-500 mt-1">
										Minimum kehadiran (Keseluruhan) adalah 90% untuk dapat
										disetujui.
									</p>
								</div>
							</div>
							{canEdit && (
								<AlertDialog>
									<AlertDialogTrigger
										className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold px-8 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										disabled={!isEligible || isLoading}
									>
										Memenuhi Minimal Jumlah Kehadiran
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogTitle>
											Konfirmasi Persetujuan Kehadiran
										</AlertDialogTitle>
										<AlertDialogDescription>
											Anda akan menyetujui kehadiran mahasiswa ini. Aksi ini
											akan menandai checklist <b>Kehadiran Praktik</b> sebagai
											selesai di panel CRM.
										</AlertDialogDescription>
										<div className="flex justify-end gap-3 mt-4">
											<AlertDialogCancel>Batal</AlertDialogCancel>
											<AlertDialogAction
												className="bg-[#0517B0] hover:bg-blue-800 text-white"
												onClick={() => handleToggleApproval(true)}
											>
												Ya, Setujui
											</AlertDialogAction>
										</div>
									</AlertDialogContent>
								</AlertDialog>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
