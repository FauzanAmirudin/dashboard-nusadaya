"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";

interface TabOdsProps {
	studentId: number;
	crmState: any;
	canEdit: boolean;
	fetchCrmData: () => void;
	onUpdate: () => void;
}

export function TabOds({
	studentId,
	crmState,
	canEdit,
	fetchCrmData,
	onUpdate,
}: TabOdsProps) {
	const crm = crmState?.crm;
	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const defaultOds = Array(5).fill({ date: "", industry: "", isDone: false });
	const [odsData, setOdsData] = useState<any[]>(defaultOds);

	useEffect(() => {
		if (crm?.odsDetails) {
			try {
				let parsed = crm.odsDetails;
				if (typeof parsed === "string") {
					parsed = JSON.parse(parsed);
				}
				if (Array.isArray(parsed) && parsed.length > 0) {
					// Ensure there are 5 items
					const populated = [...parsed];
					while (populated.length < 5) {
						populated.push({ date: "", industry: "", isDone: false });
					}
					setOdsData(populated.slice(0, 5));
				}
			} catch (e) {
				console.error("Failed to parse odsDetails", e);
			}
		}
	}, [crm]);

	const handleSaveOds = async () => {
		if (!canEdit) return;
		setIsLoading(true);
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				odsDetails: odsData,
			});
			if (error) throw new Error("Gagal menyimpan ODS");
			toast.success("Data Pelaksanaan ODS berhasil disimpan");
			setIsEditing(false);
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Terjadi kesalahan saat menyimpan ODS");
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateField = (index: number, field: string, value: any) => {
		const newData = [...odsData];
		newData[index] = { ...newData[index], [field]: value };
		setOdsData(newData);
	};

	const handleUploadSuccess = async () => {
		// Auto check the isOdsReport checkbox in DB
		if (!crm?.isOdsReport) {
			try {
				await api.students[studentId.toString()].crm.patch({
					isOdsReport: true,
				});
				fetchCrmData();
				onUpdate();
			} catch (error) {
				console.error("Gagal auto-check ods report", error);
			}
		}
	};

	return (
		<div className="space-y-6">
			{/* Pelaksanaan Section */}
			<Card className="border border-slate-200 shadow-sm overflow-hidden">
				<div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
					<h3 className="font-bold text-slate-800 flex items-center gap-2">
						<span className="text-xl">🏢</span> Pelaksanaan One Day Service
					</h3>
					{canEdit && !isEditing && (
						<Button
							onClick={() => setIsEditing(true)}
							variant="outline"
							size="sm"
							className="text-[#0517B0] border-blue-200 hover:bg-blue-50"
						>
							Edit Pelaksanaan
						</Button>
					)}
				</div>
				<CardContent className="p-6">
					<div className="space-y-6">
						{odsData.map((ods, index) => (
							<div
								key={index}
								className="flex flex-col sm:flex-row gap-4 p-4 border border-slate-100 rounded-lg bg-slate-50/50"
							>
								<div className="flex items-center sm:w-32 shrink-0">
									<Label className="font-bold text-slate-800 text-lg">
										ODS {index + 1}
									</Label>
								</div>

								<div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<Label className="text-xs text-slate-500">
											Tanggal Pelaksanaan
										</Label>
										{isEditing ? (
											<Input
												type="date"
												value={ods.date || ""}
												onChange={(e) =>
													handleUpdateField(index, "date", e.target.value)
												}
												disabled={!canEdit || isLoading}
												className="bg-white"
											/>
										) : (
											<div className="text-sm font-semibold text-slate-700 bg-white px-3 py-2 rounded-md border border-slate-200 shadow-sm min-h-[38px] flex items-center">
												{ods.date ? (
													new Date(ods.date).toLocaleDateString("id-ID", {
														day: "numeric",
														month: "long",
														year: "numeric",
													})
												) : (
													<span className="text-slate-400 font-normal">
														Belum ditentukan
													</span>
												)}
											</div>
										)}
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs text-slate-500">
											Nama Industri
										</Label>
										{isEditing ? (
											<Input
												type="text"
												placeholder="Contoh: Hotel Mulia Senayan"
												value={ods.industry || ""}
												onChange={(e) =>
													handleUpdateField(index, "industry", e.target.value)
												}
												disabled={!canEdit || isLoading}
												className="bg-white"
											/>
										) : (
											<div className="text-sm font-semibold text-slate-700 bg-white px-3 py-2 rounded-md border border-slate-200 shadow-sm min-h-[38px] flex items-center">
												{ods.industry || (
													<span className="text-slate-400 font-normal">
														Belum ditentukan
													</span>
												)}
											</div>
										)}
									</div>
								</div>

								<div className="flex items-center sm:pl-4 shrink-0">
									<label className="flex items-center gap-2 cursor-pointer">
										<Checkbox
											checked={ods.isDone || false}
											onCheckedChange={(val) =>
												handleUpdateField(index, "isDone", !!val)
											}
											disabled={!canEdit || !isEditing || isLoading}
											className={
												!isEditing
													? "opacity-100 disabled:opacity-100 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 data-[state=checked]:text-white"
													: ""
											}
										/>
										<span
											className={`text-sm font-bold ${ods.isDone ? "text-emerald-700" : "text-slate-500"}`}
										>
											{ods.isDone ? "Selesai" : "Belum"}
										</span>
									</label>
								</div>
							</div>
						))}
					</div>

					{canEdit && isEditing && (
						<div className="mt-6 flex justify-end gap-3">
							<Button
								variant="outline"
								onClick={() => {
									setIsEditing(false);
									// Revert data by re-running effect
									fetchCrmData();
								}}
								disabled={isLoading}
							>
								Batal
							</Button>
							<Button
								onClick={handleSaveOds}
								disabled={isLoading}
								className="bg-[#0517B0] hover:bg-blue-800 text-white px-8"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Menyimpan...
									</>
								) : (
									"Simpan Pelaksanaan"
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
						<span className="text-xl">📄</span> Upload Dokumen Laporan
					</h3>
				</div>
				<CardContent className="p-6">
					<div className="flex flex-col w-full">
						<p className="text-sm text-slate-600 mb-4">
							Silakan unggah dokumen laporan akhir One Day Service yang telah
							ditandatangani.
						</p>
						<DocumentUpload
							studentId={studentId}
							panel="crm"
							documentKey="ods_report"
							canEdit={canEdit}
							onUploadSuccess={handleUploadSuccess}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
