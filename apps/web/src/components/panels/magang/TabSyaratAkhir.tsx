"use client";

import {
	BookOpen,
	CheckCircle,
	CheckCircle2,
	Clock,
	FileCheck,
	GraduationCap,
	Link2,
	Loader2,
	Video,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";

interface TabSyaratAkhirProps {
	studentId: number;
	data: any;
	postInternshipDocs: any[];
	canEditPostInternship: boolean;
	loadingItem?: string | null;
	setPostInternshipDocs: (docs: any[]) => void;
	handleToggleField: (field: string, value: any) => Promise<void> | void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => Promise<void> | void;
}

export function TabSyaratAkhir({
	studentId,
	data,
	postInternshipDocs,
	canEditPostInternship,
	loadingItem = null,
	setPostInternshipDocs,
	handleToggleField,
	handleLocalChange,
	handleBlurField,
}: TabSyaratAkhirProps) {
	const fetchDocs = () => {
		api.students[studentId.toString()]["post-internship"].documents
			.get()
			.then((res) => {
				if (res.data?.success) setPostInternshipDocs(res.data.data as any[]);
			});
	};

	const completedCount = [
		data?.logbookReady,
		data?.laporanAkhirReady,
		data?.videoDokumentasiReady,
	].filter(Boolean).length;

	const isAllCompleted = completedCount === 3;

	return (
		<div className="space-y-6">
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<GraduationCap className="w-4 h-4 text-[#0517B0]" />
							Dokumen Syarat Kelulusan Akhir / Post-Internship (3)
						</CardTitle>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Verifikasi laporan, logbook, dan bukti luaran portofolio pasca
							masa magang selesai
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							className={`text-xs font-bold px-2.5 py-0.5 ${
								isAllCompleted
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: "bg-blue-50 text-[#0517B0] border-blue-200"
							}`}
						>
							{completedCount}/3 Selesai
						</Badge>
					</div>
				</CardHeader>

				<CardContent className="p-4 sm:p-5 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* 1. Logbook */}
						<div
							className={`p-4 rounded-xl border transition-colors flex flex-col justify-between space-y-3 ${
								data?.logbookReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div>
								<div className="flex items-start justify-between gap-3 mb-2">
									<div className="flex items-start gap-3">
										<Checkbox
											id="chk-logbookReady"
											checked={!!data?.logbookReady}
											disabled={
												!canEditPostInternship || loadingItem === "logbookReady"
											}
											onCheckedChange={(checked) =>
												handleToggleField("logbookReady", !!checked)
											}
											className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
										/>
										<div>
											<label
												htmlFor="chk-logbookReady"
												className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
											>
												1. Logbook Harian Magang
											</label>
											<p className="text-[11px] text-slate-500 mt-0.5">
												Buku harian yang telah ditandatangani supervisor
												industri
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										{loadingItem === "logbookReady" ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
										) : data?.logbookReady ? (
											<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
												✓ Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 border-slate-200 text-[10px]"
											>
												Belum
											</Badge>
										)}
									</div>
								</div>
							</div>

							<div className="pt-3 border-t border-slate-100 mt-auto">
								<DocumentUpload
									studentId={studentId}
									panel="post-internship"
									documentKey="logbook"
									canEdit={canEditPostInternship}
									onUploadSuccess={fetchDocs}
								/>
							</div>
						</div>

						{/* 2. Laporan Akhir Magang */}
						<div
							className={`p-4 rounded-xl border transition-colors flex flex-col justify-between space-y-3 ${
								data?.laporanAkhirReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div>
								<div className="flex items-start justify-between gap-3 mb-2">
									<div className="flex items-start gap-3">
										<Checkbox
											id="chk-laporanAkhirReady"
											checked={!!data?.laporanAkhirReady}
											disabled={
												!canEditPostInternship ||
												loadingItem === "laporanAkhirReady"
											}
											onCheckedChange={(checked) =>
												handleToggleField("laporanAkhirReady", !!checked)
											}
											className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
										/>
										<div>
											<label
												htmlFor="chk-laporanAkhirReady"
												className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
											>
												2. Laporan Akhir Magang
											</label>
											<p className="text-[11px] text-slate-500 mt-0.5">
												Laporan komprehensif pelaksanaan magang format PDF
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										{loadingItem === "laporanAkhirReady" ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
										) : data?.laporanAkhirReady ? (
											<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
												✓ Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 border-slate-200 text-[10px]"
											>
												Belum
											</Badge>
										)}
									</div>
								</div>
							</div>

							<div className="pt-3 border-t border-slate-100 mt-auto">
								<DocumentUpload
									studentId={studentId}
									panel="post-internship"
									documentKey="laporan_akhir"
									canEdit={canEditPostInternship}
									onUploadSuccess={fetchDocs}
								/>
							</div>
						</div>

						{/* 3. Video Dokumentasi & Portofolio */}
						<div
							className={`p-4 rounded-xl border transition-colors flex flex-col justify-between space-y-3 ${
								data?.videoDokumentasiReady
									? "border-emerald-200 bg-emerald-50/20 shadow-xs"
									: "border-slate-200 bg-white shadow-xs"
							}`}
						>
							<div>
								<div className="flex items-start justify-between gap-3 mb-2">
									<div className="flex items-start gap-3">
										<Checkbox
											id="chk-videoDokumentasiReady"
											checked={!!data?.videoDokumentasiReady}
											disabled={
												!canEditPostInternship ||
												loadingItem === "videoDokumentasiReady"
											}
											onCheckedChange={(checked) =>
												handleToggleField("videoDokumentasiReady", !!checked)
											}
											className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
										/>
										<div>
											<label
												htmlFor="chk-videoDokumentasiReady"
												className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer block hover:text-[#0517B0] transition-colors"
											>
												3. Video Portofolio / Luaran
											</label>
											<p className="text-[11px] text-slate-500 mt-0.5">
												Video dokumentasi recap pengalaman kerja dan hasil
												luaran
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										{loadingItem === "videoDokumentasiReady" ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
										) : data?.videoDokumentasiReady ? (
											<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
												✓ Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 border-slate-200 text-[10px]"
											>
												Belum
											</Badge>
										)}
									</div>
								</div>

								<div className="space-y-1 my-2">
									<Label className="text-[11px] font-semibold text-slate-600">
										Link Video Portofolio
									</Label>
									<Input
										placeholder="https://youtube.com/... atau Drive"
										className="h-8 text-xs bg-white"
										value={data?.videoDokumentasiLink || ""}
										disabled={!canEditPostInternship}
										onChange={(e) =>
											handleLocalChange("videoDokumentasiLink", e.target.value)
										}
										onBlur={() => handleBlurField("videoDokumentasiLink")}
									/>
								</div>
							</div>

							<div className="pt-3 border-t border-slate-100 mt-auto">
								<DocumentUpload
									studentId={studentId}
									panel="post-internship"
									documentKey="video_portofolio"
									canEdit={canEditPostInternship}
									onUploadSuccess={fetchDocs}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
