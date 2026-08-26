"use client";

import {
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Clock,
	FileText,
	Globe,
	GraduationCap,
	HeartHandshake,
	Loader2,
	MessageCircle,
	MessageSquare,
	Plus,
	Save,
	Sparkles,
	Trash2,
	User,
	Users,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
	{
		label: string;
		className: string;
		dotClass: string;
		icon: React.ElementType;
	}
> = {
	Stabil: {
		label: "Stabil",
		className:
			"bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold",
		dotClass: "bg-emerald-500",
		icon: CheckCircle,
	},
	"Perlu Perhatian": {
		label: "Perlu Perhatian",
		className: "bg-amber-50 text-amber-800 border-amber-200/80 font-semibold",
		dotClass: "bg-amber-500",
		icon: AlertTriangle,
	},
	Kritis: {
		label: "Kritis",
		className: "bg-rose-50 text-rose-700 border-rose-200/80 font-semibold",
		dotClass: "bg-rose-500",
		icon: AlertTriangle,
	},
};

const RESULT_CONFIG: Record<string, { label: string; className: string }> = {
	Lulus: {
		label: "Lulus",
		className:
			"bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold",
	},
	"Tidak Lulus": {
		label: "Tidak Lulus",
		className: "bg-rose-50 text-rose-700 border-rose-200/80 font-semibold",
	},
	Menunggu: {
		label: "Menunggu",
		className: "bg-amber-50 text-amber-800 border-amber-200/80 font-semibold",
	},
};

// ── Sub-component: Section Container ─────────────────────────────────────────

function SectionCard({
	title,
	subtitle,
	icon: Icon,
	accentColor = "#0517B0",
	count = 0,
	children,
	defaultOpen = true,
}: {
	title: string;
	subtitle?: string;
	icon: React.ElementType;
	accentColor?: string;
	count?: number;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Card className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden transition-all">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors border-b border-slate-100"
			>
				<div className="flex items-center gap-3">
					<div
						className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
						style={{
							backgroundColor: `${accentColor}12`,
							color: accentColor,
						}}
					>
						<Icon className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h3 className="text-sm sm:text-base font-bold text-slate-800">
								{title}
							</h3>
							{count > 0 && (
								<Badge
									variant="secondary"
									className="text-[11px] font-bold px-2 py-0.5 rounded-full"
									style={{
										backgroundColor: `${accentColor}15`,
										color: accentColor,
									}}
								>
									{count} Catatan
								</Badge>
							)}
						</div>
						{subtitle && (
							<p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
						)}
					</div>
				</div>
				<div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
					{open ? (
						<ChevronUp className="w-4 h-4" />
					) : (
						<ChevronDown className="w-4 h-4" />
					)}
				</div>
			</button>
			{open && (
				<CardContent className="p-4 sm:p-6 bg-slate-50/30">
					{children}
				</CardContent>
			)}
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

	return (
		<div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
			{/* Section Header */}
			<div className="flex items-center justify-between pb-2 border-b border-slate-100">
				<div className="flex items-center gap-2">
					<Icon className="w-4 h-4" style={{ color: accentColor }} />
					<h4 className="text-xs sm:text-sm font-bold text-slate-800">
						{title}
					</h4>
					<Badge
						variant="secondary"
						className="text-[10px] font-semibold px-2 py-0.2 rounded-full"
						style={{
							backgroundColor: `${accentColor}12`,
							color: accentColor,
						}}
					>
						{logs.length}
					</Badge>
				</div>
				{canEdit && !showForm && (
					<Button
						size="sm"
						variant="outline"
						onClick={() => setShowForm(true)}
						className="h-7 text-xs px-2.5 gap-1 border-slate-200 hover:bg-slate-50"
					>
						<Plus className="w-3.5 h-3.5" />
						<span>Tambah Sesi</span>
					</Button>
				)}
			</div>

			{/* Add Form */}
			{canEdit && showForm && (
				<div
					className="rounded-xl border p-4 space-y-3.5 animate-in fade-in-50 duration-150"
					style={{
						borderColor: `${accentColor}30`,
						backgroundColor: `${accentColor}06`,
					}}
				>
					<div className="flex items-center justify-between">
						<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
							<Sparkles
								className="w-3.5 h-3.5"
								style={{ color: accentColor }}
							/>
							Input Sesi Konseling Baru
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Konseling *
							</Label>
							<Input
								type="date"
								value={formDate}
								onChange={(e) => setFormDate(e.target.value)}
								className="h-9 text-xs bg-white"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-700">
								Kondisi Mahasiswa *
							</Label>
							<Select
								value={formCondition}
								onValueChange={(v) => setFormCondition(v ?? "Stabil")}
							>
								<SelectTrigger className="h-9 text-xs bg-white">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Stabil">🟢 Stabil</SelectItem>
									<SelectItem value="Perlu Perhatian">
										🟡 Perlu Perhatian
									</SelectItem>
									<SelectItem value="Kritis">🔴 Kritis</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-700">
							Catatan Hasil Konseling *
						</Label>
						<Textarea
							placeholder="Tuliskan poin hasil konseling, arahan, dan komitmen mahasiswa..."
							value={formNotes}
							onChange={(e) => setFormNotes(e.target.value)}
							rows={3}
							className="resize-none text-xs bg-white"
						/>
					</div>

					<div className="flex justify-end items-center gap-2 pt-1">
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
							disabled={isSaving || !formNotes.trim()}
							className="h-8 text-xs gap-1.5 text-white shadow-2xs font-semibold"
							style={{ backgroundColor: accentColor }}
						>
							{isSaving ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Save className="w-3.5 h-3.5" />
							)}
							Simpan Sesi
						</Button>
					</div>
				</div>
			)}

			{/* Log List */}
			{logs.length === 0 && !showForm ? (
				<div className="text-center py-8 text-slate-400">
					<MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
					<p className="text-xs font-medium text-slate-500">
						Belum ada riwayat {title.toLowerCase()}
					</p>
				</div>
			) : (
				<div className="space-y-2.5">
					{logs.map((log) => {
						const cfg =
							CONDITION_CONFIG[log.condition] ?? CONDITION_CONFIG.Stabil;
						return (
							<div
								key={log.id}
								className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-150 group"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="space-y-1.5 flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-xs font-medium text-slate-500 flex items-center gap-1">
												<Clock className="w-3 h-3 text-slate-400" />
												{formatDate(log.date)}
											</span>
											<Badge
												variant="outline"
												className={`${cfg.className} text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1`}
											>
												<span
													className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`}
												/>
												<span>{cfg.label}</span>
											</Badge>
										</div>
										<p className="text-xs text-slate-700 leading-relaxed">
											{log.notes}
										</p>
									</div>

									{canEdit && (
										<button
											type="button"
											onClick={() => handleDelete(log.id)}
											disabled={deletingId === log.id}
											className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all disabled:opacity-50"
											title="Hapus sesi"
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
						);
					})}
				</div>
			)}
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
		contactType: filterType === "orang-tua" ? "Orang Tua" : "Mitra PJTKI",
		contactName: "",
		contactDate: new Date().toISOString().split("T")[0],
		summary: "",
		result: "",
	});
	const [isSaving, setIsSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const accentColor = filterType === "orang-tua" ? "#0517B0" : "#d97706";

	const handleAdd = async () => {
		if (!formData.summary.trim()) {
			toast.error("Topik / ringkasan komunikasi tidak boleh kosong");
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
			toast.success("Log tripartit berhasil ditambahkan");
			setShowForm(false);
			setFormData((prev) => ({
				...prev,
				contactName: "",
				summary: "",
				result: "",
			}));
			onRefresh();
		} catch {
			toast.error("Gagal menyimpan log tripartit");
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

	return (
		<div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
			<div className="flex items-center justify-between pb-2 border-b border-slate-100">
				<div className="flex items-center gap-2">
					<Users className="w-4 h-4" style={{ color: accentColor }} />
					<h4 className="text-xs sm:text-sm font-bold text-slate-800">
						{sectionLabel}
					</h4>
					<Badge
						variant="secondary"
						className="text-[10px] font-semibold px-2 py-0.2 rounded-full"
						style={{
							backgroundColor: `${accentColor}12`,
							color: accentColor,
						}}
					>
						{logs.length}
					</Badge>
				</div>
				{canEdit && !showForm && (
					<Button
						size="sm"
						variant="outline"
						onClick={() => setShowForm(true)}
						className="h-7 text-xs px-2.5 gap-1 border-slate-200 hover:bg-slate-50"
					>
						<Plus className="w-3.5 h-3.5" />
						<span>Tambah Log</span>
					</Button>
				)}
			</div>

			{/* Form */}
			{canEdit && showForm && (
				<div
					className="rounded-xl border p-4 space-y-3.5 animate-in fade-in-50 duration-150"
					style={{
						borderColor: `${accentColor}30`,
						backgroundColor: `${accentColor}06`,
					}}
				>
					<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
						<Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
						Input Log Komunikasi Tripartit
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{filterType === "lapangan" && (
							<div className="space-y-1 sm:col-span-2">
								<Label className="text-xs font-medium text-slate-700">
									Jenis Pihak Kontak *
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
									<SelectTrigger className="h-9 text-xs bg-white">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Mitra PJTKI">Mitra PJTKI</SelectItem>
										<SelectItem value="Koordinator Lapangan">
											Koordinator Lapangan
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-700">
								Nama Kontak / Wali *
							</Label>
							<Input
								placeholder="Contoh: Bpk. Bambang..."
								value={formData.contactName}
								onChange={(e) =>
									setFormData((p) => ({
										...p,
										contactName: e.target.value,
									}))
								}
								className="h-9 text-xs bg-white"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Komunikasi *
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
								className="h-9 text-xs bg-white"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-700">
							Topik / Ringkasan Pembicaraan *
						</Label>
						<Textarea
							placeholder="Ringkasan hasil komunikasi..."
							value={formData.summary}
							onChange={(e) =>
								setFormData((p) => ({
									...p,
									summary: e.target.value,
								}))
							}
							rows={3}
							className="resize-none text-xs bg-white"
						/>
					</div>

					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-700">
							Hasil / Kesepakatan (Opsional)
						</Label>
						<Input
							placeholder="Hasil atau tindak lanjut..."
							value={formData.result}
							onChange={(e) =>
								setFormData((p) => ({
									...p,
									result: e.target.value,
								}))
							}
							className="h-9 text-xs bg-white"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-1">
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
							disabled={isSaving || !formData.summary.trim()}
							className="h-8 text-xs gap-1.5 text-white shadow-2xs font-semibold"
							style={{ backgroundColor: accentColor }}
						>
							{isSaving ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Save className="w-3.5 h-3.5" />
							)}
							Simpan Log
						</Button>
					</div>
				</div>
			)}

			{/* Logs */}
			{logs.length === 0 && !showForm ? (
				<div className="text-center py-8 text-slate-400">
					<Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
					<p className="text-xs font-medium text-slate-500">
						Belum ada log komunikasi {sectionLabel.toLowerCase()}
					</p>
				</div>
			) : (
				<div className="space-y-2.5">
					{logs.map((log) => (
						<div
							key={log.id}
							className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-150 group"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="space-y-1 flex-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<Badge
											variant="outline"
											className="bg-white text-slate-700 border-slate-200 text-[10px] font-semibold"
										>
											{log.contactType}
										</Badge>
										{log.contactName && (
											<span className="text-xs font-bold text-slate-800">
												{log.contactName}
											</span>
										)}
										<span className="text-xs text-slate-400 flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{formatDate(log.contactDate)}
										</span>
									</div>
									<p className="text-xs text-slate-700 leading-relaxed">
										{log.summary}
									</p>
									{log.result && (
										<div className="text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 rounded-md p-1.5 font-medium">
											<span className="font-bold">Hasil:</span> {log.result}
										</div>
									)}
								</div>
								{canEdit && (
									<button
										type="button"
										onClick={() => handleDelete(log.id)}
										disabled={deletingId === log.id}
										className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all disabled:opacity-50"
										title="Hapus log"
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
			const res = await fetch(`${API_URL}/students/${studentId}/pa/interview`, {
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
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toast.success("Log interview berhasil disimpan");
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
		<div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
			<div className="flex items-center justify-between pb-2 border-b border-slate-100">
				<div className="flex items-center gap-2">
					<Building2 className="w-4 h-4 text-[#0517B0]" />
					<h4 className="text-xs sm:text-sm font-bold text-slate-800">
						Pendampingan Interview Magang
					</h4>
					<Badge
						variant="secondary"
						className="bg-blue-50 text-[#0517B0] text-[10px] font-semibold px-2 py-0.2 rounded-full"
					>
						{logs.length}
					</Badge>
				</div>
				{canEdit && !showForm && (
					<Button
						size="sm"
						variant="outline"
						onClick={() => setShowForm(true)}
						className="h-7 text-xs px-2.5 gap-1 border-slate-200 hover:bg-slate-50"
					>
						<Plus className="w-3.5 h-3.5" />
						<span>Tambah Log Interview</span>
					</Button>
				)}
			</div>

			{/* Form */}
			{canEdit && showForm && (
				<div className="rounded-xl border border-blue-200/80 bg-blue-50/30 p-4 space-y-3.5 animate-in fade-in-50 duration-150">
					<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
						<Sparkles className="w-3.5 h-3.5 text-[#0517B0]" />
						Input Log Pendampingan Interview
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-700">
								Tanggal Interview *
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
								className="h-9 text-xs bg-white"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-700">
								Nama Perusahaan *
							</Label>
							<Input
								placeholder="Contoh: Hilton Hotel..."
								value={formData.companyName}
								onChange={(e) =>
									setFormData((p) => ({
										...p,
										companyName: e.target.value,
									}))
								}
								className="h-9 text-xs bg-white"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-700">
								Negara Tujuan (Opsional)
							</Label>
							<Input
								placeholder="Contoh: Jepang, Malaysia..."
								value={formData.country}
								onChange={(e) =>
									setFormData((p) => ({
										...p,
										country: e.target.value,
									}))
								}
								className="h-9 text-xs bg-white"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-700">
								Hasil Interview *
							</Label>
							<Select
								value={formData.result}
								onValueChange={(v) =>
									setFormData((p) => ({ ...p, result: v ?? "Menunggu" }))
								}
							>
								<SelectTrigger className="h-9 text-xs bg-white">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Menunggu">🟡 Menunggu</SelectItem>
									<SelectItem value="Lulus">🟢 Lulus</SelectItem>
									<SelectItem value="Tidak Lulus">🔴 Tidak Lulus</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-700">
							Catatan Pendampingan (Opsional)
						</Label>
						<Textarea
							placeholder="Catatan evaluasi jalannya interview..."
							value={formData.notes}
							onChange={(e) =>
								setFormData((p) => ({ ...p, notes: e.target.value }))
							}
							rows={2}
							className="resize-none text-xs bg-white"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-1">
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
							disabled={isSaving || !formData.companyName.trim()}
							className="h-8 text-xs gap-1.5 text-white bg-[#0517B0] hover:bg-[#0517B0]/90 shadow-2xs font-semibold"
						>
							{isSaving ? (
								<Loader2 className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Save className="w-3.5 h-3.5" />
							)}
							Simpan Interview
						</Button>
					</div>
				</div>
			)}

			{/* Logs */}
			{logs.length === 0 && !showForm ? (
				<div className="text-center py-8 text-slate-400">
					<Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
					<p className="text-xs font-medium text-slate-500">
						Belum ada riwayat pendampingan interview
					</p>
				</div>
			) : (
				<div className="space-y-2.5">
					{logs.map((log) => {
						const resCfg = RESULT_CONFIG[log.result] ?? RESULT_CONFIG.Menunggu;
						return (
							<div
								key={log.id}
								className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-150 group"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="space-y-1 flex-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<span className="text-xs font-bold text-slate-900">
												{log.companyName}
											</span>
											{log.country && (
												<span className="text-xs text-slate-500 font-medium">
													· {log.country}
												</span>
											)}
											<span className="text-xs text-slate-400 flex items-center gap-1">
												<Clock className="w-3 h-3" />
												{formatDate(log.interviewDate)}
											</span>
											<Badge
												variant="outline"
												className={`${resCfg.className} text-[10px] px-2 py-0.5 rounded-md`}
											>
												{resCfg.label}
											</Badge>
										</div>
										{log.notes && (
											<p className="text-xs text-slate-600 leading-relaxed">
												{log.notes}
											</p>
										)}
									</div>
									{canEdit && (
										<button
											type="button"
											onClick={() => handleDelete(log.id)}
											disabled={deletingId === log.id}
											className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all disabled:opacity-50"
											title="Hapus log"
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
						);
					})}
				</div>
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
			<div className="space-y-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
				<div className="flex items-center justify-between pb-2 border-b border-slate-100">
					<div className="flex items-center gap-2">
						<FileText className="w-4 h-4" style={{ color: accentColor }} />
						<h4 className="text-xs sm:text-sm font-bold text-slate-800">
							{title}
						</h4>
						<Badge
							variant="secondary"
							className="text-[10px] font-semibold px-2 py-0.2 rounded-full"
							style={{
								backgroundColor: `${accentColor}12`,
								color: accentColor,
							}}
						>
							{notes.length}
						</Badge>
					</div>
					{canEdit && !showForm && (
						<Button
							size="sm"
							variant="outline"
							onClick={() => setShowForm(true)}
							className="h-7 text-xs px-2.5 gap-1 border-slate-200 hover:bg-slate-50"
						>
							<Plus className="w-3.5 h-3.5" />
							<span>Tambah Catatan</span>
						</Button>
					)}
				</div>

				{/* Form */}
				{canEdit && showForm && (
					<div
						className="rounded-xl border p-4 space-y-3.5 animate-in fade-in-50 duration-150"
						style={{
							borderColor: `${accentColor}30`,
							backgroundColor: `${accentColor}06`,
						}}
					>
						<p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
							<Sparkles
								className="w-3.5 h-3.5"
								style={{ color: accentColor }}
							/>
							Input {title}
						</p>

						<Textarea
							placeholder={`Tuliskan isi ${title.toLowerCase()}...`}
							value={formContent}
							onChange={(e) => setFormContent(e.target.value)}
							rows={3}
							className="resize-none text-xs bg-white"
							autoFocus
						/>

						<div className="flex justify-between items-center pt-1">
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
									className="h-8 text-xs gap-1.5 text-white shadow-2xs font-semibold"
									style={{ backgroundColor: accentColor }}
								>
									{isSaving ? (
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
									) : (
										<Save className="w-3.5 h-3.5" />
									)}
									Simpan Catatan
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* List */}
				{notes.length === 0 && !showForm ? (
					<div className="text-center py-8 text-slate-400">
						<FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
						<p className="text-xs font-medium text-slate-500">
							Belum ada {title.toLowerCase()}
						</p>
					</div>
				) : (
					<div className="space-y-2.5">
						{notes.map((note) => (
							<div
								key={note.id}
								className="group relative p-3.5 pl-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-150"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="space-y-1 flex-1 min-w-0">
										<p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
											{note.content}
										</p>
										<p className="text-[10px] text-slate-400 flex items-center gap-1">
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
											className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all disabled:opacity-50"
											title="Hapus catatan"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
						<AlertDialogDescription>
							Catatan ini akan dihapus permanen dan tidak dapat dipulihkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={!!deletingId}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={!!deletingId}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							{deletingId && (
								<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
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
			const res = await fetch(`${API_URL}/students/${studentId}/pa`, {
				headers: { Authorization: `Bearer ${getToken()}` },
			});
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
		fetchData();
	}, [fetchData]);

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
				<Loader2 className="w-7 h-7 animate-spin text-[#0517B0]" />
				<span className="text-xs font-medium text-slate-500">
					Memuat data konseling & catatan...
				</span>
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
				title="Konseling & Bimbingan Psikologis"
				subtitle="Catatan sesi konseling berkala dan pemantauan kondisi mental mahasiswa"
				icon={MessageCircle}
				accentColor="#0517B0"
				count={konselingLogs.length + konselingMentalLogs.length}
				defaultOpen
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					<CounselingSection
						studentId={studentId}
						type="konseling"
						title="Sesi Konseling Akademik & Perkembangan"
						icon={MessageCircle}
						accentColor="#0517B0"
						logs={konselingLogs}
						canEdit={canEdit}
						onRefresh={fetchData}
					/>
					<CounselingSection
						studentId={studentId}
						type="konseling_mental"
						title="Konseling Kesiapan Mental & Emosional"
						icon={HeartHandshake}
						accentColor="#7c3aed"
						logs={konselingMentalLogs}
						canEdit={canEdit}
						onRefresh={fetchData}
					/>
				</div>
			</SectionCard>

			{/* 2. Konseling Tripartit Section */}
			<SectionCard
				title="Komunikasi & Konseling Tripartit"
				subtitle="Koordinasi intensif antara kampus, orang tua/wali, dan koordinator lapangan"
				icon={Users}
				accentColor="#7c3aed"
				count={tripartiteOrangTua.length + tripartiteLapangan.length}
				defaultOpen
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					<TripartiteSection
						studentId={studentId}
						sectionLabel="Komunikasi Orang Tua / Wali"
						filterType="orang-tua"
						logs={tripartiteOrangTua}
						canEdit={canEdit}
						onRefresh={fetchData}
					/>
					<TripartiteSection
						studentId={studentId}
						sectionLabel="Koordinasi Pihak Lapangan / Mitra"
						filterType="lapangan"
						logs={tripartiteLapangan}
						canEdit={canEdit}
						onRefresh={fetchData}
					/>
				</div>
			</SectionCard>

			{/* 3. Log Pendampingan Interview Section */}
			<SectionCard
				title="Pendampingan Interview Magang Luar Negeri"
				subtitle="Riwayat wawancara kerja, proses seleksi mitra luar negeri, dan hasil pendampingan"
				icon={Building2}
				accentColor="#0517B0"
				count={paData.interviewLogs.length}
				defaultOpen
			>
				<InterviewSection
					studentId={studentId}
					logs={paData.interviewLogs}
					canEdit={canEdit}
					onRefresh={fetchData}
				/>
			</SectionCard>

			{/* 4. Catatan Kedisiplinan & Internal */}
			<SectionCard
				title="Catatan Kedisiplinan & Evaluasi Khusus"
				subtitle="Catatan perilaku kedisiplinan dan catatan internal tim pembimbing"
				icon={FileText}
				accentColor="#d97706"
				count={kedisiplinanNotes.length + internalNotes.length}
				defaultOpen
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					<StudentNotesSection
						studentId={studentId}
						noteType="kedisiplinan"
						title="Catatan Kedisiplinan Mahasiswa"
						accentColor="#d97706"
						notes={kedisiplinanNotes}
						canEdit={canEdit}
						onRefresh={fetchData}
					/>
					<StudentNotesSection
						studentId={studentId}
						noteType="internal"
						title="Catatan Evaluasi Internal"
						accentColor="#475569"
						notes={internalNotes}
						canEdit={canEdit}
						onRefresh={fetchData}
					/>
				</div>
			</SectionCard>
		</div>
	);
}
