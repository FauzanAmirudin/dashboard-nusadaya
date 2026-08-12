"use client";

import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/eden";

interface TabSyaratAkhirProps {
	studentId: number;
	data: any;
	postInternshipDocs: any[];
	canEditPostInternship: boolean;
	setPostInternshipDocs: (docs: any[]) => void;
	handleToggleField: (field: string, value: any) => void;
	handleLocalChange: (field: string, value: any) => void;
	handleBlurField: (field: string) => void;
}

export function TabSyaratAkhir({
	studentId,
	data,
	postInternshipDocs,
	canEditPostInternship,
	setPostInternshipDocs,
	handleToggleField,
	handleLocalChange,
	handleBlurField,
}: TabSyaratAkhirProps) {
	const [isEditMode, setIsEditMode] = useState(false);

	const fetchDocs = () => {
		api.students[studentId.toString()]["post-internship"].documents
			.get()
			.then((res) => {
				if (res.data?.success) setPostInternshipDocs(res.data.data as any[]);
			});
	};

	return (
		<div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
			<div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
				<h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
					DOKUMEN SYARAT KELULUSAN AKHIR (POST-INTERNSHIP)
				</h3>
				<Button
					variant={isEditMode ? "default" : "outline"}
					size="sm"
					onClick={() => setIsEditMode(!isEditMode)}
					className={
						isEditMode ? "bg-[#0517B0] hover:bg-blue-800 text-white" : ""
					}
					disabled={!canEditPostInternship}
				>
					{isEditMode ? "Tutup Mode Edit" : "Edit Dokumen"}
				</Button>
			</div>

			<div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* 1. Logbook */}
				<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEditPostInternship && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField("logbookReady", !data?.logbookReady)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.logbookReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.logbookReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${
									data?.logbookReady ? "text-slate-800" : "text-slate-600"
								}`}
							>
								Buku Harian Magang (Logbook)
							</h4>
						</div>
						<p className="text-xs text-slate-500 mb-4">
							PDF, disahkan pembimbing lapangan.
						</p>
					</div>

					<div className="mt-auto pt-4 border-t border-slate-200/60">
						<div className="flex items-center justify-between mb-3">
							<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
								File Dokumen
							</span>
							{postInternshipDocs.some((d) => d.documentKey === "logbook") ? (
								<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px]">
									Tersimpan
								</Badge>
							) : (
								<Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 border-none text-[10px]">
									Belum Ada
								</Badge>
							)}
						</div>
						<DocumentUpload
							studentId={studentId}
							panel="post-internship"
							documentKey="logbook"
							canEdit={canEditPostInternship && isEditMode}
							onUploadSuccess={fetchDocs}
						/>
					</div>
				</div>

				{/* 2. Laporan Akhir */}
				<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEditPostInternship && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField(
												"laporanAkhirReady",
												!data?.laporanAkhirReady,
											)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.laporanAkhirReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.laporanAkhirReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${
									data?.laporanAkhirReady ? "text-slate-800" : "text-slate-600"
								}`}
							>
								Laporan Akhir Magang
							</h4>
						</div>
						<p className="text-xs text-slate-500 mb-4">
							Laporan komprehensif akhir dalam format PDF.
						</p>
					</div>

					<div className="mt-auto pt-4 border-t border-slate-200/60">
						<div className="flex items-center justify-between mb-3">
							<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
								File Dokumen
							</span>
							{postInternshipDocs.some(
								(d) => d.documentKey === "laporan_akhir",
							) ? (
								<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px]">
									Tersimpan
								</Badge>
							) : (
								<Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 border-none text-[10px]">
									Belum Ada
								</Badge>
							)}
						</div>
						<DocumentUpload
							studentId={studentId}
							panel="post-internship"
							documentKey="laporan_akhir"
							canEdit={canEditPostInternship && isEditMode}
							onUploadSuccess={fetchDocs}
						/>
					</div>
				</div>

				{/* 3. Video Dokumentasi */}
				<div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-3 mb-3 border-b pb-2">
							<div className="shrink-0 flex items-center">
								{canEditPostInternship && isEditMode ? (
									<button
										onClick={() =>
											handleToggleField(
												"videoDokumentasiReady",
												!data?.videoDokumentasiReady,
											)
										}
										className="focus:outline-none hover:scale-110 transition-transform"
									>
										{data?.videoDokumentasiReady ? (
											<CheckCircle className="w-5 h-5 text-emerald-500" />
										) : (
											<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white hover:border-[#0517B0] transition-colors" />
										)}
									</button>
								) : data?.videoDokumentasiReady ? (
									<CheckCircle className="w-5 h-5 text-emerald-500" />
								) : (
									<div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
								)}
							</div>
							<h4
								className={`text-sm font-bold ${
									data?.videoDokumentasiReady
										? "text-slate-800"
										: "text-slate-600"
								}`}
							>
								Video Dokumentasi Magang
							</h4>
						</div>

						<div className="space-y-3 mb-4">
							<div className="space-y-1">
								<label className="text-xs font-medium text-slate-500">
									Tautan Video
								</label>
								{!canEditPostInternship || !isEditMode ? (
									<div className="h-8 flex items-center bg-slate-50 border-transparent px-3 rounded-md">
										{data?.videoDokumentasiLink ? (
											<a
												href={data.videoDokumentasiLink}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm font-semibold text-blue-600 hover:underline truncate"
											>
												{data.videoDokumentasiLink}
											</a>
										) : (
											<span className="text-sm font-semibold text-slate-800">
												-
											</span>
										)}
									</div>
								) : (
									<Input
										disabled={!canEditPostInternship || !isEditMode}
										type="url"
										value={data?.videoDokumentasiLink || ""}
										onChange={(e) =>
											handleLocalChange("videoDokumentasiLink", e.target.value)
										}
										onBlur={() => handleBlurField("videoDokumentasiLink")}
										className="bg-white h-8 text-sm"
										placeholder="https://youtube.com/..."
									/>
								)}
							</div>
						</div>
					</div>

					<div className="mt-auto pt-4 border-t border-slate-200/60">
						<div className="flex items-center justify-between mb-3">
							<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
								Lampiran Dokumen / Foto
							</span>
							{postInternshipDocs.some(
								(d) => d.documentKey === "video_dokumentasi",
							) ? (
								<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px]">
									Tersimpan
								</Badge>
							) : (
								<Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 border-none text-[10px]">
									Belum Ada
								</Badge>
							)}
						</div>
						<DocumentUpload
							studentId={studentId}
							panel="post-internship"
							documentKey="video_dokumentasi"
							canEdit={canEditPostInternship && isEditMode}
							onUploadSuccess={fetchDocs}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
