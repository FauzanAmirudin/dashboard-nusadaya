"use client";

import {
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	Image as ImageIcon,
	Loader2,
	ShieldCheck,
	Trash2,
	Users,
} from "lucide-react";
import { useState } from "react";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/eden";

interface TabMonitoringProps {
	studentId: number;
	crmState: any;
	fetchCrmData: () => void;
	canEdit: boolean;
	API_URL: string;
	token: string;
	onUpdate: () => void;
}

export function TabMonitoring({
	studentId,
	crmState,
	fetchCrmData,
	canEdit,
	API_URL,
	token,
	onUpdate,
}: TabMonitoringProps) {
	const logs = crmState?.logs || [];
	const crm = crmState?.crm;

	const handleToggleStatus = async (
		field: "isMonitoringParent" | "isMonitoringIndustry",
		value: boolean,
	) => {
		if (!canEdit) return;
		try {
			const { error } = await api.students[studentId.toString()].crm.patch({
				[field]: value,
			});
			if (error) throw new Error("Gagal mengubah status monitoring");
			toast.success(
				value
					? "Status monitoring ditandai selesai"
					: "Status monitoring dibatalkan",
			);
			fetchCrmData();
			onUpdate();
		} catch (e) {
			toast.error("Terjadi kesalahan saat mengubah status monitoring");
		}
	};

	return (
		<div className="space-y-6">
			<Tabs defaultValue="orang-tua" className="w-full">
				<TabsList className="mb-6 grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
					<TabsTrigger
						value="orang-tua"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<Users className="w-4 h-4" /> Monitoring Orang Tua
						{crm?.isMonitoringParent ? (
							<span className="w-2 h-2 rounded-full bg-emerald-500" />
						) : (
							<span className="w-2 h-2 rounded-full bg-slate-300" />
						)}
					</TabsTrigger>
					<TabsTrigger
						value="industri"
						className="data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm rounded-md py-2 transition-all flex items-center justify-center gap-2 font-bold"
					>
						<Building2 className="w-4 h-4" /> Monitoring Industri
						{crm?.isMonitoringIndustry ? (
							<span className="w-2 h-2 rounded-full bg-emerald-500" />
						) : (
							<span className="w-2 h-2 rounded-full bg-slate-300" />
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="orang-tua" className="space-y-6">
					{/* Status Checklist Banner Orang Tua */}
					<Card className="border border-slate-200 shadow-2xs bg-white overflow-hidden">
						<CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<div
									className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
										crm?.isMonitoringParent
											? "bg-emerald-100 text-emerald-700"
											: "bg-amber-100 text-amber-700"
									}`}
								>
									{crm?.isMonitoringParent ? (
										<CheckCircle2 className="w-5 h-5" />
									) : (
										<Clock className="w-5 h-5" />
									)}
								</div>
								<div>
									<div className="flex items-center gap-2">
										<h4 className="font-bold text-slate-800 text-sm">
											Indikator: Monitoring Orang Tua
										</h4>
										{crm?.isMonitoringParent ? (
											<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs font-semibold">
												Selesai (Terpenuhi)
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-amber-700 bg-amber-50 border-amber-200 text-xs font-medium"
											>
												Belum Terpenuhi
											</Badge>
										)}
									</div>
									<p className="text-xs text-slate-500 mt-0.5">
										{crm?.isMonitoringParent
											? "Monitoring orang tua telah selesai dan tercatat di sistem."
											: "Catat komunikasi / masalah orang tua atau tandai selesai."}
									</p>
								</div>
							</div>

							{canEdit && (
								<Button
									size="sm"
									variant={crm?.isMonitoringParent ? "outline" : "default"}
									onClick={() =>
										handleToggleStatus(
											"isMonitoringParent",
											!crm?.isMonitoringParent,
										)
									}
									className={
										crm?.isMonitoringParent
											? "border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
											: "bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-bold"
									}
								>
									{crm?.isMonitoringParent
										? "Batalkan Status Selesai"
										: "Tandai Monitoring Selesai"}
								</Button>
							)}
						</CardContent>
					</Card>

					<MonitoringForm
						title="Catatan Orang Tua"
						studentId={studentId}
						typeOptions={[
							{ value: "orang_tua_masalah", label: "Masalah" },
							{ value: "orang_tua_komunikasi", label: "Komunikasi" },
						]}
						fetchCrmData={fetchCrmData}
						canEdit={canEdit}
						API_URL={API_URL}
						token={token}
						onUpdate={onUpdate}
						logs={logs.filter(
							(l: any) =>
								l.logType === "orang_tua_masalah" ||
								l.logType === "orang_tua_komunikasi",
						)}
					/>
				</TabsContent>

				<TabsContent value="industri" className="space-y-6">
					{/* Status Checklist Banner Industri */}
					<Card className="border border-slate-200 shadow-2xs bg-white overflow-hidden">
						<CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<div
									className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
										crm?.isMonitoringIndustry
											? "bg-emerald-100 text-emerald-700"
											: "bg-amber-100 text-amber-700"
									}`}
								>
									{crm?.isMonitoringIndustry ? (
										<CheckCircle2 className="w-5 h-5" />
									) : (
										<Clock className="w-5 h-5" />
									)}
								</div>
								<div>
									<div className="flex items-center gap-2">
										<h4 className="font-bold text-slate-800 text-sm">
											Indikator: Monitoring Industri
										</h4>
										{crm?.isMonitoringIndustry ? (
											<Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs font-semibold">
												Selesai (Terpenuhi)
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="text-amber-700 bg-amber-50 border-amber-200 text-xs font-medium"
											>
												Belum Terpenuhi
											</Badge>
										)}
									</div>
									<p className="text-xs text-slate-500 mt-0.5">
										{crm?.isMonitoringIndustry
											? "Monitoring industri telah selesai dan tercatat di sistem."
											: "Catat komunikasi / kunjungan industri atau tandai selesai."}
									</p>
								</div>
							</div>

							{canEdit && (
								<Button
									size="sm"
									variant={crm?.isMonitoringIndustry ? "outline" : "default"}
									onClick={() =>
										handleToggleStatus(
											"isMonitoringIndustry",
											!crm?.isMonitoringIndustry,
										)
									}
									className={
										crm?.isMonitoringIndustry
											? "border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
											: "bg-[#0517B0] hover:bg-blue-800 text-white text-xs font-bold"
									}
								>
									{crm?.isMonitoringIndustry
										? "Batalkan Status Selesai"
										: "Tandai Monitoring Selesai"}
								</Button>
							)}
						</CardContent>
					</Card>

					<MonitoringForm
						title="Catatan Industri"
						studentId={studentId}
						typeOptions={[{ value: "industri_masalah", label: "Masalah" }]}
						fetchCrmData={fetchCrmData}
						canEdit={canEdit}
						API_URL={API_URL}
						token={token}
						onUpdate={onUpdate}
						logs={logs.filter((l: any) => l.logType === "industri_masalah")}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

interface MonitoringFormProps {
	title: string;
	studentId: number;
	typeOptions: { value: string; label: string }[];
	fetchCrmData: () => void;
	canEdit: boolean;
	API_URL: string;
	token: string;
	onUpdate: () => void;
	logs: any[];
}

function MonitoringForm({
	title,
	studentId,
	typeOptions,
	fetchCrmData,
	canEdit,
	API_URL,
	token,
	onUpdate,
	logs,
}: MonitoringFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const [topic, setTopic] = useState("");
	const [logType, setLogType] = useState(typeOptions[0].value);
	const [logText, setLogText] = useState("");
	const [attachments, setAttachments] = useState<any[]>([]);

	const handleSave = async () => {
		if (!topic.trim()) {
			toast.error("Judul tidak boleh kosong");
			return;
		}
		if (!logText.trim() || logText === "<p></p>") {
			toast.error("Deskripsi tidak boleh kosong");
			return;
		}

		setIsLoading(true);
		try {
			const { error } = await api.students[studentId.toString()].crm.log.post({
				topic,
				logType,
				logText,
				attachments,
			});

			if (error) throw new Error("Gagal menyimpan log");

			toast.success("Catatan berhasil disimpan");
			setIsEditing(false);

			// Reset Form
			setTopic("");
			setLogType(typeOptions[0].value);
			setLogText("");
			setAttachments([]);

			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Terjadi kesalahan saat menyimpan catatan");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteLog = async (logId: number) => {
		setIsLoading(true);
		try {
			const { error } =
				await api.students[studentId.toString()].crm.log[
					logId.toString()
				].delete();

			if (error) throw new Error("Gagal menghapus log");

			toast.success("Catatan berhasil dihapus");
			fetchCrmData();
			onUpdate();
		} catch (error) {
			toast.error("Terjadi kesalahan saat menghapus catatan");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Formulir Catatan Baru */}
			{canEdit && (
				<Card className="border border-slate-200 shadow-sm overflow-hidden">
					<div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
						<h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
							<FileText className="w-5 h-5 text-blue-600" />
							{title}
						</h3>
						{!isEditing && (
							<Button
								variant="outline"
								onClick={() => setIsEditing(true)}
								className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
							>
								+ Tambah Catatan Baru
							</Button>
						)}
					</div>

					{isEditing && (
						<CardContent className="p-6 space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Judul & Tipe */}
								<div className="space-y-4">
									<div className="space-y-2">
										<Label className="text-slate-600 font-semibold">
											Tipe Catatan
										</Label>
										{typeOptions.length > 1 ? (
											<Select
												value={logType}
												onValueChange={(val) => val && setLogType(val)}
												disabled={isLoading}
											>
												<SelectTrigger className="bg-white">
													{typeOptions.find((opt) => opt.value === logType)
														?.label || "Pilih Tipe Catatan"}
												</SelectTrigger>
												<SelectContent>
													{typeOptions.map((opt) => (
														<SelectItem key={opt.value} value={opt.value}>
															{opt.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : (
											<div className="p-2.5 bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium cursor-not-allowed">
												{typeOptions[0].label}
											</div>
										)}
									</div>
									<div className="space-y-2">
										<Label className="text-slate-600 font-semibold">
											Judul / Topik
										</Label>
										<Input
											placeholder="Contoh: Diskusi dengan orang tua..."
											value={topic}
											onChange={(e) => setTopic(e.target.value)}
											disabled={isLoading}
											className="bg-white"
										/>
									</div>
								</div>

								{/* Upload Foto */}
								<div className="space-y-2">
									<Label className="text-slate-600 font-semibold flex items-center gap-2">
										<ImageIcon className="w-4 h-4" />
										Upload Foto (Opsional)
									</Label>
									<MultiImageUpload
										studentId={studentId}
										token={token}
										API_URL={API_URL}
										onUpload={setAttachments}
										disabled={isLoading}
									/>
								</div>
							</div>

							{/* Deskripsi WYSIWYG */}
							<div className="space-y-2">
								<Label className="text-slate-600 font-semibold">
									Deskripsi / Detail Catatan
								</Label>
								<RichTextEditor
									content={logText}
									onChange={setLogText}
									disabled={isLoading}
								/>
							</div>

							<div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
								<Button
									variant="ghost"
									onClick={() => {
										setIsEditing(false);
										setTopic("");
										setLogText("");
										setAttachments([]);
									}}
									disabled={isLoading}
								>
									Batal
								</Button>
								<Button
									onClick={handleSave}
									disabled={isLoading}
									className="bg-blue-600 hover:bg-blue-700 text-white px-8"
								>
									{isLoading ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Menyimpan...
										</>
									) : (
										"Simpan Catatan"
									)}
								</Button>
							</div>
						</CardContent>
					)}
				</Card>
			)}

			{/* Daftar Riwayat Catatan */}
			<div className="space-y-4 mt-8">
				<h4 className="font-bold text-slate-700 flex items-center gap-2">
					<Calendar className="w-4 h-4 text-slate-500" />
					Riwayat {title} ({logs.length})
				</h4>

				{logs.length === 0 ? (
					<div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
						<FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
						<p className="text-slate-500 font-medium">
							Belum ada riwayat catatan
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{logs.map((log: any) => {
							const typeLabel =
								typeOptions.find((t) => t.value === log.logType)?.label ||
								"Catatan";
							const isMasalah = log.logType.includes("masalah");

							return (
								<Card
									key={log.id}
									className="border border-slate-200 shadow-sm overflow-hidden"
								>
									<div
										className={`p-4 border-b flex justify-between items-start ${isMasalah ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-200"}`}
									>
										<div>
											<div className="flex items-center gap-2 mb-1">
												<span
													className={`text-xs font-bold px-2 py-0.5 rounded-full ${isMasalah ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
												>
													{typeLabel}
												</span>
												<span className="text-sm text-slate-500 font-medium">
													{new Date(log.createdAt).toLocaleString("id-ID", {
														day: "numeric",
														month: "long",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>
											<h5 className="font-bold text-lg text-slate-800">
												{log.topic}
											</h5>
										</div>
										<div className="text-right flex flex-col items-end gap-2">
											<p className="text-sm font-medium text-slate-600">
												Oleh: {log.author?.fullName || "Sistem"}
											</p>
											{canEdit && (
												<AlertDialog>
													<AlertDialogTrigger
														className="h-8 px-3 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors text-red-500 hover:text-red-700 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50"
														disabled={isLoading}
													>
														<Trash2 className="w-4 h-4 mr-1" />
														Hapus
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Hapus Catatan?
															</AlertDialogTitle>
															<AlertDialogDescription>
																Apakah Anda yakin ingin menghapus catatan "
																{log.topic}"? Data yang sudah dihapus tidak
																dapat dikembalikan.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Batal</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => handleDeleteLog(log.id)}
																className="bg-red-600 hover:bg-red-700 text-white"
															>
																Ya, Hapus
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											)}
										</div>
									</div>
									<CardContent className="p-5">
										{/* Render HTML content safely */}
										<div
											className="prose prose-sm max-w-none text-slate-700 mb-6"
											// biome-ignore lint/security/noDangerouslySetInnerHtml: Trusted HTML from Tiptap
											dangerouslySetInnerHTML={{ __html: log.logText }}
										/>

										{/* Photos */}
										{log.attachments &&
											Array.isArray(log.attachments) &&
											log.attachments.length > 0 && (
												<div className="mt-4 pt-4 border-t border-slate-100">
													<h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
														Lampiran Foto ({log.attachments.length})
													</h6>
													<div className="flex flex-wrap gap-3">
														{log.attachments.map((photo: any, i: number) => (
															<a
																key={i}
																href={`${API_URL}${photo.url}?token=${token}`}
																target="_blank"
																rel="noopener noreferrer"
																className="block border border-slate-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors bg-slate-50"
															>
																{/* biome-ignore lint/performance/noImgElement: Native img is fine for user uploads */}
																<img
																	src={`${API_URL}${photo.url}?token=${token}`}
																	alt={photo.name}
																	className="h-24 w-24 object-cover"
																/>
															</a>
														))}
													</div>
												</div>
											)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
