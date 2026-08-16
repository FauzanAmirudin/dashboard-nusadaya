"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/eden";
import { toast } from "sonner";
import { Loader2, Edit2, Plus, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/store";

export function TabODS({ studentId }: { studentId: number }) {
	const [records, setRecords] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const { user } = useAuthStore();
	const canEdit = user?.role === "superadmin" || user?.role === "akademik";

	const [isAdding, setIsAdding] = useState(false);
	const [editingRecord, setEditingRecord] = useState<number | null>(null);
	
	const [form, setForm] = useState({ date: "", status: "hadir", notes: "" });
	const [isSaving, setIsSaving] = useState(false);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const res = await (api as any).attendance.mahasiswa[studentId].ods.get();
			if (res.data?.success) {
				setRecords(res.data.data);
			}
		} catch (error) {
			toast.error("Terjadi kesalahan koneksi");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [studentId]);

	const handleAddClick = () => {
		const today = new Date().toISOString().split('T')[0];
		setForm({ date: today, status: "hadir", notes: "" });
		setIsAdding(true);
	};

	const handleEditClick = (record: any) => {
		setForm({
			date: record.date.split('T')[0],
			status: record.status,
			notes: record.notes || "",
		});
		setEditingRecord(record.id);
	};

	const handleSubmit = async () => {
		if (!form.date || !form.status) {
			toast.error("Tanggal dan status harus diisi");
			return;
		}

		setIsSaving(true);
		try {
			let res;
			if (editingRecord) {
				res = await (api as any).attendance.mahasiswa[studentId].ods[editingRecord].patch(form);
			} else {
				res = await (api as any).attendance.mahasiswa[studentId].ods.post(form);
			}

			if (res.data?.success) {
				toast.success(editingRecord ? "Berhasil diperbarui" : "Berhasil ditambahkan");
				setIsAdding(false);
				setEditingRecord(null);
				fetchData();
			} else {
				toast.error("Gagal menyimpan data");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
				<div>
					<h3 className="font-semibold text-blue-900">Orientasi Dasar Studi (ODS)</h3>
					<p className="text-sm text-blue-700">Data kehadiran ODS diinput oleh Akademik</p>
				</div>
				{canEdit && (
					<Button onClick={handleAddClick} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
						<Plus className="w-4 h-4 mr-2" />
						Input Kehadiran ODS
					</Button>
				)}
			</div>

			{records.length === 0 ? (
				<div className="text-center py-8 text-slate-500 border rounded-lg border-dashed">Belum ada riwayat ODS terinput.</div>
			) : (
				<div className="space-y-2">
					{records.map((r: any) => (
						<div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-lg border border-slate-200 gap-3">
							<div>
								<div className="font-medium text-slate-800">
									{new Date(r.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
								</div>
								<div className="text-xs text-slate-500">
									Diinput oleh: {r.recorder?.fullName || "-"}
								</div>
								{r.notes && (
									<div className="text-sm text-slate-600 mt-1 italic">
										Catatan: {r.notes}
									</div>
								)}
							</div>
							
							<div className="flex items-center gap-3 w-full sm:w-auto">
								<Badge variant={r.status === 'hadir' ? 'default' : r.status === 'izin' || r.status === 'sakit' ? 'secondary' : 'destructive'} 
									className={r.status === 'hadir' ? 'bg-emerald-500' : ''}>
									{r.status.toUpperCase()}
								</Badge>
								{canEdit && (
									<Button variant="ghost" size="icon" onClick={() => handleEditClick(r)}>
										<Edit2 className="w-4 h-4 text-slate-500" />
									</Button>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			<Dialog open={isAdding || editingRecord !== null} onOpenChange={(o) => {
				if (!o) {
					setIsAdding(false);
					setEditingRecord(null);
				}
			}}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{editingRecord ? "Edit Kehadiran ODS" : "Input Kehadiran ODS"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div>
							<label className="text-sm font-medium mb-1 block">Tanggal ODS</label>
							<Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
						</div>
						<div>
							<label className="text-sm font-medium mb-1 block">Status</label>
							<Select value={form.status || ""} onValueChange={v => setForm({...form, status: v || ""})}>
								<SelectTrigger>
									<SelectValue placeholder="Pilih status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="hadir">Hadir</SelectItem>
									<SelectItem value="izin">Izin</SelectItem>
									<SelectItem value="sakit">Sakit</SelectItem>
									<SelectItem value="alpha">Alpha</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<label className="text-sm font-medium mb-1 block">Catatan (Opsional)</label>
							<Input placeholder="Alasan izin dll..." value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} />
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => { setIsAdding(false); setEditingRecord(null); }}>Batal</Button>
						<Button onClick={handleSubmit} disabled={isSaving}>
							{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Simpan
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
