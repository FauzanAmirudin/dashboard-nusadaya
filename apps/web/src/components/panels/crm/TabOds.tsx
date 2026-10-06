"use client";

import { Building, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/ui/DocumentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface TabOdsProps {
	studentId: number;
	crmState: any;
	canEdit: boolean;
	fetchCrmData: () => void;
	onUpdate: () => void;
	onUpdateField?: (field: string, value: any) => void;
}

export function TabOds({
	studentId,
	crmState,
	canEdit,
	fetchCrmData,
	onUpdate,
	onUpdateField,
}: TabOdsProps) {
	const { token } = useAuthStore();
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
	const crm = crmState?.crm;
	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const defaultOds = Array(5).fill({ date: "", industry: "", isDone: false });
	const [odsData, setOdsData] = useState<any[]>(defaultOds);

	// Real-time tracking of uploaded reports per session (1..5)
	const [reportsCountMap, setReportsCountMap] = useState<
		Record<number, number>
	>({
		1: crm?.isOds1Report ? 1 : 0,
		2: crm?.isOds2Report ? 1 : 0,
		3: crm?.isOds3Report ? 1 : 0,
		4: crm?.isOds4Report ? 1 : 0,
		5: crm?.isOds5Report ? 1 : 0,
	});

	useEffect(() => {
		if (crm?.odsDetails) {
			try {
				let parsed = crm.odsDetails;
				if (typeof parsed === "string") {
					parsed = JSON.parse(parsed);
				}
				if (Array.isArray(parsed) && parsed.length > 0) {
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

	const completedOdsCount = odsData.filter((o: any) =>
		Boolean(o.isDone),
	).length;
	const isAllOdsDone = completedOdsCount === 5;

	const handleSaveOds = async () => {
		if (!canEdit) return;
		setIsLoading(true);
		try {
			for (let i = 0; i < 5; i++) {
				const isDone = Boolean(odsData[i]?.isDone);
				onUpdateField?.(`isOds${i + 1}Report`, isDone);
			}
			onUpdateField?.("odsDetails", odsData);

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

	const handleQuickToggleDone = async (index: number, isChecked: boolean) => {
		if (!canEdit) return;
		const updated = [...odsData];
		updated[index] = { ...updated[index], isDone: isChecked };
		setOdsData(updated);

		const sessionNum = index + 1;
		onUpdateField?.(`isOds${sessionNum}Report`, isChecked);
		onUpdateField?.("odsDetails", updated);

		try {
			await api.students[studentId.toString()].crm.patch({
				odsDetails: updated,
			});
			fetchCrmData();
			onUpdate();
		} catch (e) {
			console.error("Gagal update status ODS", e);
		}
	};

	const handleUpdateField = (index: number, field: string, value: any) => {
		const newData = [...odsData];
		newData[index] = { ...newData[index], [field]: value };
		setOdsData(newData);
	};

	// Direct fetch of real CRM documents from database
	const fetchOdsDocsCount = useCallback(async () => {
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/crm/documents`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);
			if (res.ok) {
				const json = await res.json();
				if (json.success && Array.isArray(json.data)) {
					const docs = json.data;
					const newMap: Record<number, number> = {};
					for (let i = 1; i <= 5; i++) {
						const count = docs.filter((d: any) => {
							if (
								d.documentKey === `ods_${i}_report` ||
								d.documentKey === `ods_${i}`
							)
								return true;
							if (i === 1 && d.documentKey === "ods_report") return true;
							return false;
						}).length;
						newMap[i] = count;
					}
					setReportsCountMap(newMap);
				}
			}
		} catch (err) {
			console.error("Failed to fetch ODS documents count:", err);
		}
	}, [studentId, token, API_URL]);

	useEffect(() => {
		fetchOdsDocsCount();
	}, [fetchOdsDocsCount]);

	// Update reportsCountMap if crmState changes from parent
	useEffect(() => {
		if (crm) {
			setReportsCountMap((prev) => ({
				1: prev[1] ?? (crm.isOds1Report ? 1 : 0),
				2: prev[2] ?? (crm.isOds2Report ? 1 : 0),
				3: prev[3] ?? (crm.isOds3Report ? 1 : 0),
				4: prev[4] ?? (crm.isOds4Report ? 1 : 0),
				5: prev[5] ?? (crm.isOds5Report ? 1 : 0),
			}));
		}
	}, [crm]);

	const handleDocsLoaded = (sessionNum: number, count: number) => {
		setReportsCountMap((prev) => {
			if (prev[sessionNum] === count) return prev;
			return { ...prev, [sessionNum]: count };
		});
	};

	const handleDocUploaded = (sessionNum: number) => {
		setReportsCountMap((prev) => ({
			...prev,
			[sessionNum]: (prev[sessionNum] || 0) + 1,
		}));
		fetchCrmData();
		onUpdate();
	};

	const handleDocDeleted = (sessionNum: number) => {
		const newCount = Math.max(0, (reportsCountMap[sessionNum] || 1) - 1);
		setReportsCountMap((prev) => ({
			...prev,
			[sessionNum]: newCount,
		}));
		fetchCrmData();
		onUpdate();
	};

	const reportedOdsCount = [1, 2, 3, 4, 5].filter(
		(sessionNum) => (reportsCountMap[sessionNum] || 0) > 0,
	).length;
	const isAllOdsReportUploaded = reportedOdsCount === 5;

	return (
		<div className="space-y-6">
			{/* ─── 1. CHECKLIST PELAKSANAAN ODS (PMB STYLE GRID) ─── */}
			<Card className="border border-slate-200 shadow-sm border-l-4 border-l-[#0517B0]">
				<CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<Building className="w-4 h-4 text-[#0517B0]" />
							Checklist Pelaksanaan One Day Service (5 Sesi)
						</CardTitle>
						<p className="text-[11px] text-slate-500 mt-0.5">
							Pencatatan tanggal pelaksanaan dan nama industri per sesi ODS
						</p>
					</div>

					<div className="flex items-center gap-2.5">
						<Badge
							className={`text-xs font-bold px-2.5 py-0.5 ${
								isAllOdsDone
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: completedOdsCount >= 3
										? "bg-indigo-50 text-indigo-700 border-indigo-200"
										: "bg-amber-50 text-amber-700 border-amber-200"
							}`}
						>
							{completedOdsCount}/5 Sesi Diisi
						</Badge>

						<Badge
							className={`text-xs font-bold px-2.5 py-0.5 ${
								isAllOdsReportUploaded
									? "bg-emerald-50 text-emerald-700 border-emerald-200"
									: reportedOdsCount >= 3
										? "bg-indigo-50 text-indigo-700 border-indigo-200"
										: "bg-amber-50 text-amber-700 border-amber-200"
							}`}
						>
							{reportedOdsCount}/5 Laporan Diunggah
						</Badge>

						{canEdit && !isEditing && (
							<Button
								onClick={() => setIsEditing(true)}
								variant="outline"
								size="sm"
								className="text-[#0517B0] border-blue-200 hover:bg-blue-50 text-xs font-semibold h-8"
							>
								Edit Data Sesi
							</Button>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-4 sm:p-5 space-y-3.5">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
						{odsData.map((ods, index) => {
							const isDone = Boolean(ods.isDone);

							return (
								<div
									key={index}
									className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
										isDone
											? "border-emerald-200 bg-emerald-50/20 shadow-2xs"
											: "border-slate-200 bg-white"
									}`}
								>
									{/* Item Header */}
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-2.5">
											<Checkbox
												id={`ods-check-${index}`}
												checked={isDone}
												disabled={!canEdit || isLoading}
												onCheckedChange={(checked) => {
													if (isEditing) {
														handleUpdateField(index, "isDone", !!checked);
													} else {
														handleQuickToggleDone(index, !!checked);
													}
												}}
												className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
											/>
											<label
												htmlFor={`ods-check-${index}`}
												className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer"
											>
												Sesi ODS {index + 1}
											</label>
										</div>

										{isDone ? (
											<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
												✓ Selesai
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-slate-400 border-slate-200 text-[10px]"
											>
												Belum Selesai
											</Badge>
										)}
									</div>

									{/* Content Fields */}
									<div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
										<div>
											<Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
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
													className="bg-white text-xs h-8"
												/>
											) : (
												<div className="text-xs font-semibold text-slate-700 bg-slate-50/80 px-2.5 py-1.5 rounded-md border border-slate-200/70 min-h-[30px] flex items-center">
													{ods.date ? (
														new Date(ods.date).toLocaleDateString("id-ID", {
															day: "numeric",
															month: "long",
															year: "numeric",
														})
													) : (
														<span className="text-slate-400 font-normal italic">
															Belum ditentukan
														</span>
													)}
												</div>
											)}
										</div>

										<div>
											<Label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
												Nama Industri / Tempat ODS
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
													className="bg-white text-xs h-8"
												/>
											) : (
												<div className="text-xs font-semibold text-slate-700 bg-slate-50/80 px-2.5 py-1.5 rounded-md border border-slate-200/70 min-h-[30px] flex items-center truncate">
													{ods.industry || (
														<span className="text-slate-400 font-normal italic">
															Belum ditentukan
														</span>
													)}
												</div>
											)}
										</div>

										{/* Upload Laporan Per ODS */}
										<div className="pt-2.5 border-t border-slate-100">
											<div className="flex items-center justify-between mb-1.5">
												<Label className="text-[10px] uppercase font-bold text-slate-500 block">
													Laporan ODS {index + 1} (PDF)
												</Label>
												<span className="text-[10px] text-slate-400 font-normal">
													Mendukung &gt;1 file
												</span>
											</div>
											<DocumentUpload
												studentId={studentId}
												panel="crm"
												documentKey={`ods_${index + 1}_report`}
												canEdit={canEdit}
												onDocumentsLoaded={(docs) =>
													handleDocsLoaded(index + 1, docs.length)
												}
												onUploadSuccess={() => handleDocUploaded(index + 1)}
												onDeleteSuccess={() => handleDocDeleted(index + 1)}
												onUpdate={() => {
													fetchOdsDocsCount();
													fetchCrmData();
													onUpdate();
												}}
											/>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{canEdit && isEditing && (
						<div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-3">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setIsEditing(false);
									fetchCrmData();
								}}
								disabled={isLoading}
								className="text-xs"
							>
								Batal
							</Button>
							<Button
								size="sm"
								onClick={handleSaveOds}
								disabled={isLoading}
								className="bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-bold px-6"
							>
								{isLoading ? (
									<>
										<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
										Menyimpan...
									</>
								) : (
									"Simpan Data ODS"
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
