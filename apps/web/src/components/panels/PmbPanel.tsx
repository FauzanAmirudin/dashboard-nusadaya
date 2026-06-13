"use client";

import { CheckCircle, Clock, FileText, XCircle, Loader2, UploadCloud, Eye, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface PmbPanelProps {
	studentId: number;
	pmbData: any;
	onUpdate: () => void;
}

interface DocFile {
	id: number;
	documentKey: string;
	fileName: string;
	fileUrl: string;
	isVerified: boolean;
	uploadedAt: string;
	uploadedByUser?: { fullName: string } | null;
	verifiedByUser?: { fullName: string } | null;
}

export function PmbPanel({ studentId, pmbData, onUpdate }: PmbPanelProps) {
	const { user } = useAuthStore();
	const isPmbAdmin = user?.role === "pmb";
	const isSuperadmin = user?.role === "superadmin";
	const canEdit = isPmbAdmin || isSuperadmin;

	const [isSaving, setIsSaving] = useState(false);
	const [notes, setNotes] = useState(pmbData?.notes || "");
	const [loadingItem, setLoadingItem] = useState<string | null>(null);

	const [localChecks, setLocalChecks] = useState({
		formReceived: !!pmbData?.formReceived,
		documentsComplete: !!pmbData?.documentsComplete,
		dataInputted: !!pmbData?.dataInputted,
		initialFollowUp: !!pmbData?.initialFollowUp,
	});

	const [documents, setDocuments] = useState<Record<string, DocFile[]>>({});
	const [uploadingKey, setUploadingKey] = useState<string | null>(null);
	const [viewingDocId, setViewingDocId] = useState<number | null>(null);
	
	const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

	useEffect(() => {
		setLocalChecks({
			formReceived: !!pmbData?.formReceived,
			documentsComplete: !!pmbData?.documentsComplete,
			dataInputted: !!pmbData?.dataInputted,
			initialFollowUp: !!pmbData?.initialFollowUp,
		});
		setNotes(pmbData?.notes || "");
	}, [pmbData]);

	const fetchDocuments = async () => {
		try {
			const res = await fetch(`${API_URL}/students/${studentId}/pmb/documents`, {
				headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
			});
			if (res.ok) {
				const json = await res.json();
				if (json.success) {
					setDocuments(json.data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch PMB documents", error);
		}
	};

	useEffect(() => {
		fetchDocuments();
	}, [studentId]);

	const checklistMapping: Record<string, string> = {
		formReceived: "form_received",
		documentsComplete: "documents_complete",
		dataInputted: "data_inputted",
		initialFollowUp: "initial_follow_up",
	};

	const checklist = [
		{
			id: "formReceived",
			docKey: "form_received",
			label: "Formulir Masuk",
			desc: "Formulir pendaftaran telah diterima",
			checked: localChecks.formReceived,
		},
		{
			id: "documentsComplete",
			docKey: "documents_complete",
			label: "Berkas Lengkap",
			desc: "Semua dokumen fisik tersedia",
			checked: localChecks.documentsComplete,
		},
		{
			id: "dataInputted",
			docKey: "data_inputted",
			label: "Input Data Awal",
			desc: "Data mahasiswa telah diinput ke sistem",
			checked: localChecks.dataInputted,
		},
		{
			id: "initialFollowUp",
			docKey: "initial_follow_up",
			label: "Follow Up Awal",
			desc: "Kontak awal dengan mahasiswa/orang tua selesai",
			checked: localChecks.initialFollowUp,
		},
	];

	const completedCount = Object.values(localChecks).filter(Boolean).length;
	let statusBadge = (
		<Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
			🔴 TIDAK AMAN
		</Badge>
	);
	if (completedCount === 4) {
		statusBadge = (
			<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
				🟢 AMAN
			</Badge>
		);
	} else if (completedCount >= 2) {
		statusBadge = (
			<Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
				🟡 PERLU PERHATIAN
			</Badge>
		);
	}

	const handleCheckboxChange = async (id: string, checked: boolean) => {
		if (!canEdit) return;

		const prevState = { ...localChecks };
		setLocalChecks((prev) => ({ ...prev, [id]: checked }));
		setLoadingItem(id);

		const payload = {
			...prevState,
			[id]: checked,
			notes: notes,
		};

		const { error } = await api.students[studentId.toString()].pmb.put(payload);
		if (error) {
			setLocalChecks(prevState);
			toast.error("Gagal menyimpan perubahan");
		} else {
			toast.success("Berhasil disimpan");
			onUpdate();
		}
		setLoadingItem(null);
	};

	const saveNotes = async () => {
		if (!canEdit) return;
		setIsSaving(true);
		const payload = {
			...localChecks,
			notes: notes,
		};
		const { error } = await api.students[studentId.toString()].pmb.put(payload);
		if (error) {
			toast.error("Gagal menyimpan catatan");
		} else {
			toast.success("Catatan berhasil disimpan");
			onUpdate();
		}
		setIsSaving(false);
	};

	const handleAcc = async () => {
		if (!isPmbAdmin) return;
		const { error } = await api.students[studentId.toString()].pmb.acc.post({});
		if (error) {
			toast.error("Gagal memberikan ACC");
		} else {
			toast.success("ACC PMB berhasil dicatat");
			onUpdate();
		}
	};

	const handleViewDocument = (docId: number) => {
		// Buka halaman review baru di tab baru
		window.open(`/dashboard/students/${studentId}/documents/${docId}`, '_blank');
	};

	const handleVerifyDocument = async (docId: number) => {
		try {
			const token = useAuthStore.getState().token;
			const res = await fetch(`${API_URL}/students/${studentId}/pmb/documents/${docId}/verify`, {
				method: "PATCH",
				headers: { Authorization: `Bearer ${token}` }
			});
			if (res.ok) {
				toast.success("Dokumen ditandai terverifikasi");
				fetchDocuments();
			} else {
				toast.error("Gagal memverifikasi dokumen");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	const handleDeleteDocument = async (docId: number) => {
		if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;
		
		try {
			const token = useAuthStore.getState().token;
			const res = await fetch(`${API_URL}/students/${studentId}/pmb/documents/${docId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` }
			});
			if (res.ok) {
				toast.success("Dokumen berhasil dihapus");
				fetchDocuments();
			} else {
				toast.error("Gagal menghapus dokumen");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan jaringan");
		}
	};

	return (
		<TooltipProvider>
			<Card className="bg-white border-slate-200 shadow-sm">
				<CardHeader className="border-b border-slate-200 pb-4">
					<div className="flex justify-between items-center">
						<div>
							<div className="flex items-center gap-3">
								<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
									<FileText className="w-5 h-5 text-[#0517B0]" />
									PMB — Penerimaan Mahasiswa Baru
								</CardTitle>
								{isSuperadmin && !isPmbAdmin && (
									<Badge variant="outline" className="text-slate-400 border-slate-300">
										👁 Mode Lihat Saja
									</Badge>
								)}
							</div>
							<p className="text-sm text-slate-500 mt-1">
								Dikelola oleh: Admin PMB
							</p>
						</div>
						<div className="flex items-center gap-3">
							<span className="text-sm font-medium text-slate-500">
								{completedCount}/4
							</span>
							{statusBadge}
						</div>
					</div>
				</CardHeader>
				<CardContent className="py-6 space-y-6">
					<div>
						<h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
							Checklist Kelengkapan Awal
						</h3>
						<div className="space-y-4">
							{checklist.map((item) => {
								const docs = documents[item.docKey] || [];
								
								return (
									<div key={item.id} className="flex flex-col rounded-lg border bg-white overflow-hidden border-slate-200">
										<div
											className={`flex items-center justify-between p-4 transition-colors ${
												item.checked
													? "bg-emerald-50 border-b border-emerald-200"
													: "bg-slate-50 border-b border-slate-200"
											}`}
										>
											<div className="flex items-center gap-4">
												<Checkbox
													id={item.id}
													checked={item.checked}
													onCheckedChange={(checked) =>
														handleCheckboxChange(item.id, checked === true)
													}
													disabled={!canEdit || loadingItem === item.id}
													className="w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 border-slate-300"
												/>
												<div>
													<label
														htmlFor={item.id}
														className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2"
													>
														{item.label}
														{loadingItem === item.id && (
															<Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
														)}
													</label>
													<p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
												</div>
											</div>
											<div>
												{item.checked ? (
													<Tooltip>
														<TooltipTrigger>
															<CheckCircle className="w-5 h-5 text-emerald-500" />
														</TooltipTrigger>
														<TooltipContent>
															Terakhir diperbarui: {pmbData?.updatedAt ? new Date(pmbData.updatedAt).toLocaleString("id-ID") : "-"}
														</TooltipContent>
													</Tooltip>
												) : (
													<Clock className="w-5 h-5 text-slate-400" />
												)}
											</div>
										</div>
										
										{/* Area Dokumen */}
										<div className="p-4 bg-white border-b border-slate-100 last:border-0">
											<div className="flex items-center justify-between mb-3">
												<span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Lampiran Dokumen</span>
											</div>
											
											{docs.length > 0 ? (
												<div className="space-y-2">
													{docs.map(doc => (
														<div key={doc.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-md border border-slate-200">
															<div className="flex items-center gap-3 overflow-hidden">
																<div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-slate-200 shrink-0">
																	<FileText className="w-4 h-4 text-[#0517B0]" />
																</div>
																<div className="min-w-0">
																	<p className="text-sm font-medium text-slate-700 truncate">{doc.fileName}</p>
																	<div className="flex items-center gap-2 mt-0.5">
																		{doc.isVerified ? (
																			<Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 px-1.5 py-0 text-[10px]">✅ Terverifikasi</Badge>
																		) : (
																			<Badge className="bg-amber-100 hover:bg-amber-100 text-amber-700 px-1.5 py-0 text-[10px]">⏳ Belum Diperiksa</Badge>
																		)}
																		<span className="text-[10px] text-slate-400">
																			{new Date(doc.uploadedAt).toLocaleDateString("id-ID")}
																		</span>
																	</div>
																</div>
															</div>
															<div className="flex items-center gap-1.5 ml-4 shrink-0">
																<Button 
																	variant="outline" 
																	size="sm" 
																	className="h-8 text-xs font-medium text-[#0517B0] border-[#0517B0]/20 hover:bg-[#0517B0]/10 gap-1.5"
																	onClick={() => handleViewDocument(doc.id)}
																	disabled={viewingDocId === doc.id}
																>
																	{viewingDocId === doc.id ? (
																		<Loader2 className="w-3.5 h-3.5 animate-spin" />
																	) : (
																		<Eye className="w-3.5 h-3.5" />
																	)}
																	Review
																</Button>
																{canEdit && !doc.isVerified && (
																	<Button 
																		variant="ghost" 
																		size="sm" 
																		className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600"
																		onClick={() => handleVerifyDocument(doc.id)}
																	>
																		<CheckCircle className="w-4 h-4" />
																	</Button>
																)}
																{canEdit && (
																	<Button 
																		variant="ghost" 
																		size="sm" 
																		className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600"
																		onClick={() => handleDeleteDocument(doc.id)}
																	>
																		<Trash2 className="w-4 h-4" />
																	</Button>
																)}
															</div>
														</div>
													))}
												</div>
											) : (
												<div className="text-center py-4 bg-slate-50 rounded border border-dashed border-slate-300">
													<p className="text-xs text-slate-500">Belum ada dokumen yang diunggah.</p>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div className="pt-2">
						<h3 className="text-sm font-semibold text-slate-700 mb-2">
							Catatan PMB:
						</h3>
						<Textarea
							placeholder="Tambahkan catatan terkait penerimaan mahasiswa ini..."
							className="min-h-[100px] bg-slate-50 border-slate-200 text-slate-800 resize-none focus-visible:ring-[#0517B0]"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							readOnly={!canEdit}
						/>
						{canEdit && (
							<div className="flex justify-end mt-3">
								<Button
									variant="outline"
									onClick={saveNotes}
									disabled={isSaving || notes === (pmbData?.notes || "")}
									className="bg-blue-50 border-[#0517B0]/30 text-[#0517B0] hover:bg-blue-100 hover:text-blue-800"
								>
									{isSaving ? "Menyimpan..." : "Simpan Catatan"}
								</Button>
							</div>
						)}
					</div>

					<div className="pt-4 mt-6 border-t border-slate-200">
						{pmbData?.isAcc ? (
							<div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
								<CheckCircle className="w-5 h-5 text-emerald-500" />
								<span className="text-sm font-medium text-emerald-400">
									ACC PMB — {pmbData.accByUser?.fullName ? `${pmbData.accByUser.fullName} · ` : ""}{new Date(pmbData.accAt).toLocaleString("id-ID")} WIB
								</span>
							</div>
						) : isPmbAdmin ? (
							<AlertDialog>
								<Tooltip>
									<TooltipTrigger render={<span className="inline-block" />}>
										<AlertDialogTrigger render={
											<Button
												disabled={completedCount < 4}
												className="bg-[#0517B0] hover:bg-blue-800 text-white w-full sm:w-auto"
											>
												✔ ACC PMB →
											</Button>
										} />
									</TooltipTrigger>
									{completedCount < 4 && (
										<TooltipContent>
											Lengkapi semua {4 - completedCount} checklist terlebih dahulu
										</TooltipContent>
									)}
								</Tooltip>
								<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
									<AlertDialogTitle>Konfirmasi ACC PMB</AlertDialogTitle>
									<AlertDialogDescription className="text-slate-500">
										Anda akan memberikan persetujuan untuk panel PMB mahasiswa
										ini. Tindakan ini akan dicatat beserta timestamp Anda.
									</AlertDialogDescription>
									<div className="flex justify-end gap-3 mt-4">
										<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50">
											Batal
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleAcc}
											className="bg-[#0517B0] hover:bg-blue-800"
										>
											Ya, ACC Sekarang
										</AlertDialogAction>
									</div>
								</AlertDialogContent>
							</AlertDialog>
						) : null}
					</div>
				</CardContent>
			</Card>
		</TooltipProvider>
	);
}
