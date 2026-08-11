"use client";

import { Calendar, Link as LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";

interface TabPraMagangProps {
	studentId: number;
	crmState: any;
	fetchCrmData: () => void;
	canEdit: boolean;
	onUpdate: () => void;
}

export function TabPraMagang({
	studentId,
	crmState,
	fetchCrmData,
	canEdit,
	onUpdate,
}: TabPraMagangProps) {
	const crm = crmState?.crm;
	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	// Form state
	const [startDate, setStartDate] = useState(crm?.pramagangStartDate || "");
	const [endDate, setEndDate] = useState(crm?.pramagangEndDate || "");
	const [industry, setIndustry] = useState(crm?.pramagangIndustry || "");
	const [videoLink, setVideoLink] = useState(crm?.pramagangVideoLink || "");

	const handleSave = async () => {
		setIsLoading(true);
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				pramagangStartDate: startDate,
				pramagangEndDate: endDate,
				pramagangIndustry: industry,
				pramagangVideoLink: videoLink,
			});

			if (error) throw new Error("Gagal menyimpan data Pra Magang");

			toast.success("Data Laporan Pra Magang berhasil disimpan");
			setIsEditing(false);
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Terjadi kesalahan saat menyimpan data");
		} finally {
			setIsLoading(false);
		}
	};

	const handleUploadSuccess = async () => {
		if (!crm?.isPrammagangReport) {
			try {
				await api.students[studentId.toString()].crm.patch({
					isPrammagangReport: true,
				});
				fetchCrmData();
				onUpdate();
			} catch (error) {
				console.error("Gagal auto-check pramagang report", error);
			}
		}
	};

	return (
		<div className="space-y-6">
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
					<h3 className="font-bold text-slate-800 text-lg">
						Laporan Pra Magang
					</h3>
					{canEdit && !isEditing && (
						<Button
							variant="outline"
							onClick={() => setIsEditing(true)}
							className="bg-white"
						>
							Edit Data
						</Button>
					)}
				</div>
				<CardContent className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Masa Pra Magang */}
						<div className="space-y-3">
							<Label className="text-slate-600 font-semibold">
								Masa Pra Magang
							</Label>
							{!isEditing ? (
								<div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md shadow-sm">
									<Calendar className="w-4 h-4 text-slate-400 shrink-0" />
									<span className="text-slate-700 font-medium truncate">
										{startDate || endDate ? (
											`${startDate ? new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "..."} s/d ${endDate ? new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "..."}`
										) : (
											<span className="text-slate-400 italic">
												Belum ditentukan
											</span>
										)}
									</span>
								</div>
							) : (
								<div className="flex items-center gap-2">
									<Input
										type="date"
										value={startDate ? startDate.split("T")[0] : ""}
										onChange={(e) => setStartDate(e.target.value)}
										disabled={isLoading}
										className="w-full"
									/>
									<span className="text-slate-400 font-medium">s.d.</span>
									<Input
										type="date"
										value={endDate ? endDate.split("T")[0] : ""}
										onChange={(e) => setEndDate(e.target.value)}
										disabled={isLoading}
										className="w-full"
									/>
								</div>
							)}
						</div>

						{/* Nama Industri */}
						<div className="space-y-3">
							<Label className="text-slate-600 font-semibold">
								Nama Industri
							</Label>
							{!isEditing ? (
								<div className="p-3 bg-white border border-slate-200 rounded-md shadow-sm">
									<span className="text-slate-700 font-medium">
										{industry || (
											<span className="text-slate-400 italic">
												Belum ditentukan
											</span>
										)}
									</span>
								</div>
							) : (
								<Input
									placeholder="Masukkan nama industri..."
									value={industry}
									onChange={(e) => setIndustry(e.target.value)}
									disabled={isLoading}
									className="bg-white"
								/>
							)}
						</div>

						{/* Tautan Video Dokumentasi */}
						<div className="space-y-3 md:col-span-2">
							<Label className="text-slate-600 font-semibold">
								Upload Tautan Video Dokumentasi
							</Label>
							{!isEditing ? (
								<div className="p-3 bg-white border border-slate-200 rounded-md shadow-sm flex items-center gap-3">
									<LinkIcon className="w-4 h-4 text-blue-500 shrink-0" />
									{videoLink ? (
										<a
											href={videoLink}
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate"
										>
											{videoLink}
										</a>
									) : (
										<span className="text-slate-400 italic">
											Belum ada tautan video
										</span>
									)}
								</div>
							) : (
								<Input
									type="url"
									placeholder="https://youtube.com/..."
									value={videoLink}
									onChange={(e) => setVideoLink(e.target.value)}
									disabled={isLoading}
									className="bg-white"
								/>
							)}
						</div>
					</div>

					{isEditing && (
						<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
							<Button
								variant="outline"
								onClick={() => {
									setIsEditing(false);
									// Revert values
									setStartDate(crm?.pramagangStartDate || "");
									setEndDate(crm?.pramagangEndDate || "");
									setIndustry(crm?.pramagangIndustry || "");
									setVideoLink(crm?.pramagangVideoLink || "");
								}}
								disabled={isLoading}
							>
								Batal
							</Button>
							<Button
								onClick={handleSave}
								disabled={isLoading}
								className="bg-[#0517B0] hover:bg-blue-800 text-white px-8"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Menyimpan...
									</>
								) : (
									"Simpan Perubahan"
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Upload Dokumen Section */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 p-4">
					<h3 className="font-bold text-slate-800 flex items-center gap-2">
						<span className="text-xl">📄</span> Unggah Dokumen Laporan
					</h3>
				</div>
				<CardContent className="p-6">
					<div className="flex flex-col w-full">
						<p className="text-sm text-slate-600 mb-4">
							Silakan unggah dokumen laporan akhir Pra Magang yang telah
							disetujui.
						</p>
						<DocumentUpload
							studentId={studentId}
							panel="crm"
							documentKey="pramagang_report"
							canEdit={canEdit}
							onUploadSuccess={handleUploadSuccess}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
