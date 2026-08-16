"use client";

import { useCallback, useEffect, useState } from "react";
import {
	AlertTriangle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Clock,
	MessageCircle,
	MessageSquare,
	Loader2,
	Plus,
	Save,
	Trash2,
	Users,
	X,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_URL, getToken } from "@/lib/eden";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CounselingLog {
	id: number;
	type: string;
	date: string;
	notes: string;
	condition: string;
	createdAt: string;
}

interface TripartiteLog {
	id: number;
	contactType: string;
	contactName: string | null;
	contactDate: string;
	summary: string;
	result: string | null;
	createdAt: string;
}

interface InterviewLog {
	id: number;
	interviewDate: string;
	companyName: string;
	country: string | null;
	result: string;
	notes: string | null;
	createdAt: string;
}

interface StudentNote {
	id: number;
	type: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

interface PAData {
	counselingLogs: CounselingLog[];
	tripartiteLogs: TripartiteLog[];
	interviewLogs: InterviewLog[];
	studentNotes: StudentNote[];
}

interface Props {
	studentId: number;
	canEdit: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
	try {
		return new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		}).format(new Date(dateStr));
	} catch {
		return dateStr;
	}
}

const CONDITION_CONFIG: Record<
	string,
	{ label: string; className: string; icon: React.ElementType }
> = {
	Stabil: {
		label: "Stabil",
		className: "bg-emerald-100 text-emerald-700 border-emerald-200",
		icon: CheckCircle,
	},
	"Perlu Perhatian": {
		label: "Perlu Perhatian",
		className: "bg-amber-100 text-amber-700 border-amber-200",
		icon: AlertTriangle,
	},
	Kritis: {
		label: "Kritis",
		className: "bg-rose-100 text-rose-700 border-rose-200",
		icon: AlertTriangle,
	},
};

const RESULT_CONFIG: Record<string, string> = {
	Lulus: "bg-emerald-100 text-emerald-700 border-emerald-200",
	"Tidak Lulus": "bg-rose-100 text-rose-700 border-rose-200",
	Menunggu: "bg-amber-100 text-amber-700 border-amber-200",
};

// ── Sub-component: Section Container ─────────────────────────────────────────

function SectionCard({
	title,
	icon: Icon,
	accentColor,
	count,
	children,
	defaultOpen = false,
}: {
	title: string;
	icon: React.ElementType;
	accentColor: string;
	count: number;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Card className="bg-white border-slate-200 shadow-sm">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="w-full text-left"
			>
				<CardHeader className="pb-3 border-b border-slate-100">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
							<span
								className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
								style={{ backgroundColor: `${accentColor}20` }}
							>
								<Icon
									className="w-3.5 h-3.5"
									style={{ color: accentColor }}
								/>
							</span>
							{title}
							{count > 0 && (
								<span
									className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
									style={{ backgroundColor: accentColor }}
								>
									{count}
								</span>
							)}
						</CardTitle>
						{open ? (
							<ChevronUp className="w-4 h-4 text-slate-400" />
						) : (
							<ChevronDown className="w-4 h-4 text-slate-400" />
						)}
					</div>
				</CardHeader>
			</button>
			{open && <CardContent className="p-5">{children}</CardContent>}
		</Card>
	);
}

// ── Sub-component: Counseling Section ────────────────────────────────────────

function CounselingSection({
	studentId,
	type,
	title,
	icon: Icon,
	accentColor,
	logs,
	canEdit,
	onRefresh,
}: {
	studentId: number;
	type: "konseling" | "konseling_mental";
	title: string;
	icon: React.ElementType;
	accentColor: string;
	logs: CounselingLog[];
	canEdit: boolean;
	onRefresh: () => void;
}) {
	const [showForm, setShowForm] = useState(false);
	const [formDate, setFormDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [formCondition, setFormCondition] = useState("Stabil");
	const [formNotes, setFormNotes] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const handleAdd = async () => {
		if (!formNotes.trim()) {
			toast.error("Catatan tidak boleh kosong");
			return;
		}
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/counseling`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						type,
						date: new Date(formDate).toISOString(),
						condition: formCondition,
						notes: formNotes,
					}),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Sesi berhasil ditambahkan");
			setShowForm(false);
			setFormNotes("");
			onRefresh();
		} catch {
			toast.error("Gagal menyimpan sesi");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async (id: number) => {
		setDeletingId(id);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/counseling/${id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Sesi dihapus");
			onRefresh();
		} catch {
			toast.error("Gagal menghapus sesi");
		} finally {
			setDeletingId(null);
		}
	};

	const condCfg = CONDITION_CONFIG[formCondition] ?? CONDITION_CONFIG.Stabil;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
					<Icon className="w-4 h-4" style={{ color: accentColor }} />
					{title}
					{logs.length > 0 && (
						<span
							className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
							style={{ backgroundColor: accentColor }}
						>
							{logs.length}
						</span>
					)}
				</h4>
			</div>
			<div className="space-y-4">
				{/* Add form */}
				{canEdit && showForm && (
					<div
						className="rounded-xl border p-4 space-y-3"
						style={{
							borderColor: `${accentColor}40`,
							backgroundColor: `${accentColor}08`,
						}}
					>
						<p className="text-xs font-semibold text-slate-600">
							Tambah Sesi Baru
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
									Tanggal
								</Label>
								<Input
									type="date"
									value={formDate}
									onChange={(e) => setFormDate(e.target.value)}
									className="h-9 text-sm"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
									Kondisi
								</Label>
								<Select
									value={formCondition}
									onValueChange={(v) => setFormCondition(v ?? "Stabil")}
								>
									<SelectTrigger className="h-9 text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Stabil">Stabil</SelectItem>
										<SelectItem value="Perlu Perhatian">
											Perlu Perhatian
										</SelectItem>
										<SelectItem value="Kritis">Kritis</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-600">
								Catatan
							</Label>
							<Textarea
								placeholder="Catatan hasil sesi konseling..."
								value={formNotes}
								onChange={(e) => setFormNotes(e.target.value)}
								rows={3}
								className="resize-none text-sm"
							/>
						</div>
						<div className="flex justify-between items-center gap-2">
							<Badge
								className={`${condCfg.className} border text-xs`}
							>
								{condCfg.label}
							</Badge>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setShowForm(false);
										setFormNotes("");
									}}
									className="h-8 text-xs gap-1"
								>
									<X className="w-3.5 h-3.5" />
									Batal
								</Button>
								<Button
									size="sm"
									onClick={handleAdd}
									disabled={isSaving}
									className="h-8 text-xs gap-1.5 text-white"
									style={{ backgroundColor: accentColor }}
								>
									{isSaving ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										<Save className="w-3.5 h-3.5" />
									)}
									Simpan
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* List */}
				{logs.length === 0 && !showForm ? (
					<div className="text-center py-6 text-slate-400">
						<MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
						<p className="text-sm">Belum ada sesi {title.toLowerCase()}</p>
					</div>
				) : (
					<div className="space-y-2">
						{logs.map((log) => {
							const cfg =
								CONDITION_CONFIG[log.condition] ??
								CONDITION_CONFIG.Stabil;
							const CondIcon = cfg.icon;
							return (
								<div
									key={log.id}
									className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150 group"
								>
									<CondIcon
										className={`w-4 h-4 shrink-0 mt-0.5 ${log.condition === "Stabil" ? "text-emerald-500" : log.condition === "Kritis" ? "text-rose-500" : "text-amber-500"}`}
									/>
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<div>
												<div className="flex items-center gap-2 flex-wrap">
													<span className="text-xs font-medium text-slate-500 flex items-center gap-1">
														<Clock className="w-3 h-3" />
														{formatDate(log.date)}
													</span>
													<Badge
														className={`${cfg.className} border text-[10px] px-1.5 py-0`}
													>
														{cfg.label}
													</Badge>
												</div>
												<p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
													{log.notes}
												</p>
											</div>
											{canEdit && (
												<button
													type="button"
													onClick={() => handleDelete(log.id)}
													disabled={deletingId === log.id}
													className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all disabled:opacity-50"
												>
													{deletingId === log.id ? (
														<Loader2 className="w-3.5 h-3.5 animate-spin" />
													) : (
														<Trash2 className="w-3.5 h-3.5" />
													)}
												</button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* Add button at bottom */}
				{canEdit && !showForm && (
					<button
						type="button"
						onClick={() => setShowForm(true)}
						className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
					>
						<Plus className="w-3.5 h-3.5" />
						Tambah Sesi
					</button>
				)}
			</div>
		</div>
	);
}

// ── Sub-component: Tripartite Section ────────────────────────────────────────

function TripartiteSection({
	studentId,
	sectionLabel,
	filterType,
	logs,
	canEdit,
	onRefresh,
}: {
	studentId: number;
	sectionLabel: string;
	filterType: "orang-tua" | "lapangan";
	logs: TripartiteLog[];
	canEdit: boolean;
	onRefresh: () => void;
}) {
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState({
		contactType:
			filterType === "orang-tua" ? "Orang Tua" : "Mitra PJTKI",
		contactName: "",
		contactDate: new Date().toISOString().split("T")[0],
		summary: "",
		result: "",
	});
	const [isSaving, setIsSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const handleAdd = async () => {
		if (!formData.summary.trim()) {
			toast.error("Topik/ringkasan tidak boleh kosong");
			return;
		}
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/tripartite`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						contactDate: new Date(formData.contactDate).toISOString(),
						contactMethod: formData.contactType,
						parentName: formData.contactName || null,
						topic: formData.summary,
						result: formData.result || null,
					}),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Log berhasil ditambahkan");
			setShowForm(false);
			setFormData((prev) => ({
				...prev,
				contactName: "",
				summary: "",
				result: "",
			}));
			onRefresh();
		} catch {
			toast.error("Gagal menyimpan log");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async (id: number) => {
		setDeletingId(id);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/tripartite/${id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Log dihapus");
			onRefresh();
		} catch {
			toast.error("Gagal menghapus log");
		} finally {
			setDeletingId(null);
		}
	};

	const accentColor = filterType === "orang-tua" ? "#0517B0" : "#d97706";

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
					<Users className="w-4 h-4" style={{ color: accentColor }} />
					{sectionLabel}
					{logs.length > 0 && (
						<span
							className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
							style={{ backgroundColor: accentColor }}
						>
							{logs.length}
						</span>
					)}
				</h4>
			</div>
			<div className="space-y-4">
				{canEdit && showForm && (
					<div
						className="rounded-xl border p-4 space-y-3"
						style={{
							borderColor: `${accentColor}40`,
							backgroundColor: `${accentColor}08`,
						}}
					>
						<p className="text-xs font-semibold text-slate-600">
							Tambah Log
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{filterType === "lapangan" && (
								<div className="space-y-1.5">
									<Label className="text-xs font-medium text-slate-600">
										Jenis Kontak
									</Label>
									<Select
										value={formData.contactType}
										onValueChange={(v) =>
											setFormData((p) => ({
												...p,
												contactType: v ?? "Mitra PJTKI",
											}))
										}
									>
										<SelectTrigger className="h-9 text-sm">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Mitra PJTKI">
												Mitra PJTKI
											</SelectItem>
											<SelectItem value="Koordinator Lapangan">
												Koordinator Lapangan
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
									Nama Kontak
								</Label>
								<Input
									placeholder="Nama..."
									value={formData.contactName}
									onChange={(e) =>
										setFormData((p) => ({
											...p,
											contactName: e.target.value,
										}))
									}
									className="h-9 text-sm"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
									Tanggal
								</Label>
								<Input
									type="date"
									value={formData.contactDate}
									onChange={(e) =>
										setFormData((p) => ({
											...p,
											contactDate: e.target.value,
										}))
									}
									className="h-9 text-sm"
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-600">
								Topik / Ringkasan
							</Label>
							<Textarea
								placeholder="Ringkasan komunikasi..."
								value={formData.summary}
								onChange={(e) =>
									setFormData((p) => ({
										...p,
										summary: e.target.value,
									}))
								}
								rows={3}
								className="resize-none text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-600">
								Hasil (opsional)
							</Label>
							<Input
								placeholder="Hasil/tindak lanjut..."
								value={formData.result}
								onChange={(e) =>
									setFormData((p) => ({
										...p,
										result: e.target.value,
									}))
								}
								className="h-9 text-sm"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => setShowForm(false)}
								className="h-8 text-xs gap-1"
							>
								<X className="w-3.5 h-3.5" />
								Batal
							</Button>
							<Button
								size="sm"
								onClick={handleAdd}
								disabled={isSaving}
								className="h-8 text-xs gap-1.5 text-white"
								style={{ backgroundColor: accentColor }}
							>
								{isSaving ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5" />
								)}
								Simpan
							</Button>
						</div>
					</div>
				)}

				{logs.length === 0 && !showForm ? (
					<div className="text-center py-6 text-slate-400">
						<Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
						<p className="text-sm">Belum ada log komunikasi</p>
					</div>
				) : (
					<div className="space-y-2">
						{logs.map((log) => (
							<div
								key={log.id}
								className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150 group"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2 mb-1.5">
											<Badge className="bg-slate-100 text-slate-600 border-slate-200 border text-[10px]">
												{log.contactType}
											</Badge>
											{log.contactName && (
												<span className="text-xs text-slate-500 font-medium">
													{log.contactName}
												</span>
											)}
											<span className="text-xs text-slate-400 flex items-center gap-1">
												<Clock className="w-3 h-3" />
												{formatDate(log.contactDate)}
											</span>
										</div>
										<p className="text-sm text-slate-700 leading-relaxed">
											{log.summary}
										</p>
										{log.result && (
											<p className="text-xs text-slate-500 mt-1">
												<span className="font-medium">Hasil:</span>{" "}
												{log.result}
											</p>
										)}
									</div>
									{canEdit && (
										<button
											type="button"
											onClick={() => handleDelete(log.id)}
											disabled={deletingId === log.id}
											className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all disabled:opacity-50"
										>
											{deletingId === log.id ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<Trash2 className="w-3.5 h-3.5" />
											)}
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				{canEdit && !showForm && (
					<button
						type="button"
						onClick={() => setShowForm(true)}
						className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
					>
						<Plus className="w-3.5 h-3.5" />
						Tambah Log
					</button>
				)}
			</div>
		</div>
	);
}

// ── Sub-component: Interview Section ─────────────────────────────────────────

function InterviewSection({
	studentId,
	logs,
	canEdit,
	onRefresh,
}: {
	studentId: number;
	logs: InterviewLog[];
	canEdit: boolean;
	onRefresh: () => void;
}) {
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState({
		interviewDate: new Date().toISOString().split("T")[0],
		companyName: "",
		country: "",
		result: "Menunggu",
		notes: "",
	});
	const [isSaving, setIsSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const handleAdd = async () => {
		if (!formData.companyName.trim()) {
			toast.error("Nama perusahaan tidak boleh kosong");
			return;
		}
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/interview`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						interviewDate: new Date(formData.interviewDate).toISOString(),
						companyName: formData.companyName,
						country: formData.country || null,
						result: formData.result,
						notes: formData.notes || null,
					}),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Log interview ditambahkan");
			setShowForm(false);
			setFormData((p) => ({
				...p,
				companyName: "",
				country: "",
				notes: "",
				result: "Menunggu",
			}));
			onRefresh();
		} catch {
			toast.error("Gagal menyimpan log interview");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async (id: number) => {
		setDeletingId(id);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/interview/${id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Log dihapus");
			onRefresh();
		} catch {
			toast.error("Gagal menghapus log");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="space-y-4">
				{canEdit && showForm && (
					<div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-3">
						<p className="text-xs font-semibold text-slate-600">
							Tambah Log Interview
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
									Tanggal Interview
								</Label>
								<Input
									type="date"
									value={formData.interviewDate}
									onChange={(e) =>
										setFormData((p) => ({
											...p,
											interviewDate: e.target.value,
										}))
									}
									className="h-9 text-sm"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
									Nama Perusahaan
								</Label>
								<Input
									placeholder="Nama perusahaan..."
									value={formData.companyName}
									onChange={(e) =>
										setFormData((p) => ({
											...p,
											companyName: e.target.value,
										}))
									}
									className="h-9 text-sm"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
									Negara (opsional)
								</Label>
								<Input
									placeholder="Negara tujuan..."
									value={formData.country}
									onChange={(e) =>
										setFormData((p) => ({
											...p,
											country: e.target.value,
										}))
									}
									className="h-9 text-sm"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-medium text-slate-600">
									Hasil
								</Label>
								<Select
									value={formData.result}
									onValueChange={(v) =>
										setFormData((p) => ({ ...p, result: v ?? "Menunggu" }))
									}
								>
									<SelectTrigger className="h-9 text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Menunggu">Menunggu</SelectItem>
										<SelectItem value="Lulus">Lulus</SelectItem>
										<SelectItem value="Tidak Lulus">Tidak Lulus</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-medium text-slate-600">
								Catatan (opsional)
							</Label>
							<Textarea
								placeholder="Catatan hasil pendampingan..."
								value={formData.notes}
								onChange={(e) =>
									setFormData((p) => ({ ...p, notes: e.target.value }))
								}
								rows={2}
								className="resize-none text-sm"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => setShowForm(false)}
								className="h-8 text-xs gap-1"
							>
								<X className="w-3.5 h-3.5" />
								Batal
							</Button>
							<Button
								size="sm"
								onClick={handleAdd}
								disabled={isSaving}
								className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
							>
								{isSaving ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Save className="w-3.5 h-3.5" />
								)}
								Simpan
							</Button>
						</div>
					</div>
				)}

				{logs.length === 0 && !showForm ? (
					<div className="text-center py-6 text-slate-400">
						<MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
						<p className="text-sm">Belum ada log pendampingan interview</p>
					</div>
				) : (
					<div className="space-y-2">
						{logs.map((log) => (
							<div
								key={log.id}
								className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150 group"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2 mb-1.5">
											<span className="text-sm font-semibold text-slate-800">
												{log.companyName}
											</span>
											{log.country && (
												<span className="text-xs text-slate-500">
													· {log.country}
												</span>
											)}
											<span className="text-xs text-slate-400 flex items-center gap-1">
												<Clock className="w-3 h-3" />
												{formatDate(log.interviewDate)}
											</span>
											<Badge
												className={`${RESULT_CONFIG[log.result] ?? "bg-slate-100 text-slate-600 border-slate-200"} border text-[10px] px-1.5 py-0`}
											>
												{log.result}
											</Badge>
										</div>
										{log.notes && (
											<p className="text-sm text-slate-600 leading-relaxed">
												{log.notes}
											</p>
										)}
									</div>
									{canEdit && (
										<button
											type="button"
											onClick={() => handleDelete(log.id)}
											disabled={deletingId === log.id}
											className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all disabled:opacity-50"
										>
											{deletingId === log.id ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : (
												<Trash2 className="w-3.5 h-3.5" />
											)}
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				{canEdit && !showForm && (
					<button
						type="button"
						onClick={() => setShowForm(true)}
						className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
					>
						<Plus className="w-3.5 h-3.5" />
						Tambah Log Interview
					</button>
				)}
			</div>
	);
}

// ── Sub-component: Student Notes Section ─────────────────────────────────────

function StudentNotesSection({
	studentId,
	noteType,
	title,
	accentColor,
	notes,
	canEdit,
	onRefresh,
}: {
	studentId: number;
	noteType: "kedisiplinan" | "internal";
	title: string;
	accentColor: string;
	notes: StudentNote[];
	canEdit: boolean;
	onRefresh: () => void;
}) {
	const [showForm, setShowForm] = useState(false);
	const [formContent, setFormContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

	const handleAdd = async () => {
		if (!formContent.trim()) {
			toast.error("Catatan tidak boleh kosong");
			return;
		}
		setIsSaving(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/student-notes`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${getToken()}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ type: noteType, content: formContent }),
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Catatan ditambahkan");
			setShowForm(false);
			setFormContent("");
			onRefresh();
		} catch {
			toast.error("Gagal menyimpan catatan");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!pendingDeleteId) return;
		setDeletingId(pendingDeleteId);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa/student-notes/${pendingDeleteId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${getToken()}` },
				},
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Catatan dihapus");
			setShowDeleteDialog(false);
			setPendingDeleteId(null);
			onRefresh();
		} catch {
			toast.error("Gagal menghapus catatan");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<>
			<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
					<AlertTriangle className="w-4 h-4" style={{ color: accentColor }} />
					{title}
					{notes.length > 0 && (
						<span
							className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
							style={{ backgroundColor: accentColor }}
						>
							{notes.length}
						</span>
					)}
				</h4>
			</div>
			<div className="space-y-4">
					{canEdit && showForm && (
						<div
							className="rounded-xl border p-4 space-y-3"
							style={{
								borderColor: `${accentColor}40`,
								backgroundColor: `${accentColor}08`,
							}}
						>
							<Textarea
								placeholder={`Isi catatan ${title.toLowerCase()}...`}
								value={formContent}
								onChange={(e) => setFormContent(e.target.value)}
								rows={3}
								className="resize-none text-sm"
								autoFocus
							/>
							<div className="flex justify-between items-center">
								<span className="text-[11px] text-slate-400">
									{formContent.length} karakter
								</span>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setShowForm(false);
											setFormContent("");
										}}
										className="h-8 text-xs gap-1"
									>
										<X className="w-3.5 h-3.5" />
										Batal
									</Button>
									<Button
										size="sm"
										onClick={handleAdd}
										disabled={isSaving || !formContent.trim()}
										className="h-8 text-xs gap-1.5 text-white"
										style={{ backgroundColor: accentColor }}
									>
										{isSaving ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Save className="w-3.5 h-3.5" />
										)}
										Simpan
									</Button>
								</div>
							</div>
						</div>
					)}

					{notes.length === 0 && !showForm ? (
						<div className="text-center py-6 text-slate-400">
							<MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
							<p className="text-sm">Belum ada catatan</p>
						</div>
					) : (
						<div className="space-y-2">
							{notes.map((note) => (
								<div
									key={note.id}
									className="group relative p-3.5 pl-5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150"
								>
									<div
										className="absolute left-3 top-3 bottom-3 w-0.5 rounded-full"
										style={{ backgroundColor: accentColor }}
									/>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
												{note.content}
											</p>
											<p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
												<Clock className="w-3 h-3" />
												{formatDate(note.createdAt)}
											</p>
										</div>
										{canEdit && (
											<button
												type="button"
												onClick={() => {
													setPendingDeleteId(note.id);
													setShowDeleteDialog(true);
												}}
												disabled={deletingId === note.id}
												className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all disabled:opacity-50"
											>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										)}
									</div>
								</div>
							))}
						</div>
					)}

					{canEdit && !showForm && (
						<button
							type="button"
							onClick={() => setShowForm(true)}
							className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
						>
							<Plus className="w-3.5 h-3.5" />
							Tambah Catatan
						</button>
					)}
				</div>
			</div>

			<AlertDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
						<AlertDialogDescription>
							Catatan ini akan dihapus permanen dan tidak dapat dipulihkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={!!deletingId}>
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={!!deletingId}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							{deletingId && (
								<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
							)}
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TabKonseling({ studentId, canEdit }: Props) {
	const [paData, setPaData] = useState<PAData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch(
				`${API_URL}/students/${studentId}/pa`,
				{ headers: { Authorization: `Bearer ${getToken()}` } },
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			const d = json.data;
			setPaData({
				counselingLogs: d.counselingLogs ?? [],
				tripartiteLogs: d.tripartiteLogs ?? [],
				interviewLogs: d.interviewLogs ?? [],
				studentNotes: d.studentNotes ?? [],
			});
		} catch {
			toast.error("Gagal memuat data konseling");
		} finally {
			setIsLoading(false);
		}
	}, [studentId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchData();
	}, [fetchData]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16 gap-2 text-slate-400">
				<Loader2 className="w-5 h-5 animate-spin" />
				<span className="text-sm">Memuat data konseling...</span>
			</div>
		);
	}

	if (!paData) return null;

	const konselingLogs = paData.counselingLogs.filter(
		(l) => l.type === "konseling",
	);
	const konselingMentalLogs = paData.counselingLogs.filter(
		(l) => l.type === "konseling_mental",
	);
	const tripartiteOrangTua = paData.tripartiteLogs.filter(
		(l) => l.contactType === "Orang Tua",
	);
	const tripartiteLapangan = paData.tripartiteLogs.filter(
		(l) => l.contactType !== "Orang Tua",
	);
	const kedisiplinanNotes = paData.studentNotes.filter(
		(n) => n.type === "kedisiplinan",
	);
	const internalNotes = paData.studentNotes.filter(
		(n) => n.type === "internal",
	);

	return (
		<div className="space-y-6">
			{/* 1. Konseling Section */}
			<SectionCard
				title="Konseling"
				icon={MessageCircle}
				accentColor="#0517B0"
				count={konselingLogs.length + konselingMentalLogs.length}
				defaultOpen
			>
				<div className="flex flex-col space-y-4">
					<div className="p-4 border border-slate-200 rounded-xl bg-white">
						<CounselingSection
							studentId={studentId}
							type="konseling"
							title="Sesi Konseling"
							icon={MessageCircle}
							accentColor="#0517B0"
							logs={konselingLogs}
							canEdit={canEdit}
							onRefresh={fetchData}
						/>
					</div>
					<div className="p-4 border border-slate-200 rounded-xl bg-white">
						<CounselingSection
							studentId={studentId}
							type="konseling_mental"
							title="Konseling Mental"
							icon={MessageCircle}
							accentColor="#7c3aed"
							logs={konselingMentalLogs}
							canEdit={canEdit}
							onRefresh={fetchData}
						/>
					</div>
				</div>
			</SectionCard>

			{/* 2. Konseling Tripartit Section */}
			<SectionCard
				title="Konseling Tripartit"
				icon={Users}
				accentColor="#7c3aed"
				count={tripartiteOrangTua.length + tripartiteLapangan.length}
				defaultOpen
			>
				<div className="flex flex-col space-y-4">
					<div className="p-4 border border-slate-200 rounded-xl bg-white">
						<TripartiteSection
							studentId={studentId}
							sectionLabel="Orang Tua"
							filterType="orang-tua"
							logs={tripartiteOrangTua}
							canEdit={canEdit}
							onRefresh={fetchData}
						/>
					</div>
					<div className="p-4 border border-slate-200 rounded-xl bg-white">
						<TripartiteSection
							studentId={studentId}
							sectionLabel="Pihak Lapangan"
							filterType="lapangan"
							logs={tripartiteLapangan}
							canEdit={canEdit}
							onRefresh={fetchData}
						/>
					</div>
				</div>
			</SectionCard>

			{/* 3. Log Pendampingan Interview Section */}
			<SectionCard
				title="Log Pendampingan Interview"
				icon={MessageSquare}
				accentColor="#0517B0"
				count={paData.interviewLogs.length}
				defaultOpen
			>
				<div className="p-4 border border-slate-200 rounded-xl bg-white mt-2">
					<InterviewSection
						studentId={studentId}
						logs={paData.interviewLogs}
						canEdit={canEdit}
						onRefresh={fetchData}
					/>
				</div>
			</SectionCard>

			{/* 4. Catatan Section */}
			<SectionCard
				title="Catatan"
				icon={AlertTriangle}
				accentColor="#f59e0b"
				count={kedisiplinanNotes.length + internalNotes.length}
				defaultOpen
			>
				<div className="flex flex-col space-y-4">
					<div className="p-4 border border-slate-200 rounded-xl bg-white">
						<StudentNotesSection
							studentId={studentId}
							noteType="kedisiplinan"
							title="Catatan Kedisiplinan Mahasiswa"
							accentColor="#f59e0b"
							notes={kedisiplinanNotes}
							canEdit={canEdit}
							onRefresh={fetchData}
						/>
					</div>
					<div className="p-4 border border-slate-200 rounded-xl bg-white">
						<StudentNotesSection
							studentId={studentId}
							noteType="internal"
							title="Catatan Internal"
							accentColor="#64748b"
							notes={internalNotes}
							canEdit={canEdit}
							onRefresh={fetchData}
						/>
					</div>
				</div>
			</SectionCard>
		</div>
	);
}
