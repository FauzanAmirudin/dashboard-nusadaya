"use client";

import { Eye, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const MONTHS = [
	{ value: "1", label: "Januari" },
	{ value: "2", label: "Februari" },
	{ value: "3", label: "Maret" },
	{ value: "4", label: "April" },
	{ value: "5", label: "Mei" },
	{ value: "6", label: "Juni" },
	{ value: "7", label: "Juli" },
	{ value: "8", label: "Agustus" },
	{ value: "9", label: "September" },
	{ value: "10", label: "Oktober" },
	{ value: "11", label: "November" },
	{ value: "12", label: "Desember" },
];

export function TabRiwayatRespons() {
	const [history, setHistory] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const [searchQuery, setSearchQuery] = useState("");
	const [filterMonth, setFilterMonth] = useState("");
	const [filterYear, setFilterYear] = useState("");

	const [selectedData, setSelectedData] = useState<any>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const fetchHistory = async () => {
		setIsLoading(true);
		try {
			const query = new URLSearchParams();
			if (filterMonth) query.append("month", filterMonth);
			if (filterYear) query.append("year", filterYear);

			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/pmb/form-responses/history?${query.toString()}`,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				},
			);
			const data = await res.json();
			if (data.success) {
				setHistory(data.data);
			}
		} catch (error) {
			console.error("Failed to fetch history", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchHistory();
	}, [filterMonth, filterYear]);

	const filteredData = history.filter(
		(h) =>
			h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(h.phone && h.phone.includes(searchQuery)),
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h3 className="text-lg font-semibold text-slate-800">
						Riwayat Respons
					</h3>
					<p className="text-sm text-slate-500">
						Lihat histori pendaftar yang telah disetujui atau ditolak.
					</p>
				</div>
				<div className="flex gap-2 w-full sm:w-auto">
					<Select
						value={filterMonth}
						onValueChange={(val) => setFilterMonth(val || "")}
					>
						<SelectTrigger className="w-[120px] bg-white">
							<SelectValue placeholder="Bulan" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua Bulan</SelectItem>
							{MONTHS.map((m) => (
								<SelectItem key={m.value} value={m.value}>
									{m.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={filterYear}
						onValueChange={(val) => setFilterYear(val || "")}
					>
						<SelectTrigger className="w-[100px] bg-white">
							<SelectValue placeholder="Tahun" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Semua</SelectItem>
							<SelectItem value="2026">2026</SelectItem>
							<SelectItem value="2025">2025</SelectItem>
						</SelectContent>
					</Select>
					<div className="relative flex-1 sm:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<Input
							placeholder="Cari Nama atau No HP..."
							className="pl-9 bg-white"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			<div className="border border-slate-200 rounded-md bg-white">
				<Table>
					<TableHeader className="bg-slate-50">
						<TableRow>
							<TableHead>Nama Pendaftar</TableHead>
							<TableHead>No. HP / WhatsApp</TableHead>
							<TableHead>Waktu Proses</TableHead>
							<TableHead>Diproses Oleh</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Detail</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8">
									Memuat data...
								</TableCell>
							</TableRow>
						) : filteredData.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center py-8 text-slate-500"
								>
									Belum ada riwayat pendaftaran.
								</TableCell>
							</TableRow>
						) : (
							filteredData.map((h) => (
								<TableRow key={h.id}>
									<TableCell className="font-medium text-slate-900">
										{h.name}
									</TableCell>
									<TableCell>{h.phone || "-"}</TableCell>
									<TableCell>
										{h.processedAt
											? new Date(h.processedAt).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "short",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})
											: "-"}
									</TableCell>
									<TableCell>{h.processor?.fullName || "-"}</TableCell>
									<TableCell>
										{h.status === "APPROVED" ? (
											<Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
												Disetujui
											</Badge>
										) : h.status === "REJECTED" ? (
											<Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
												Ditolak
											</Badge>
										) : (
											<Badge variant="outline">{h.status}</Badge>
										)}
									</TableCell>
									<TableCell className="text-right">
										<button
											type="button"
											className="text-[#0517B0] hover:bg-blue-50 p-2 rounded-md transition-colors"
											onClick={() => {
												setSelectedData(h);
												setIsDetailOpen(true);
											}}
										>
											<Eye className="w-5 h-5" />
										</button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Modal Detail */}
			<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Detail Riwayat Pendaftaran</DialogTitle>
					</DialogHeader>

					{selectedData && (
						<div className="space-y-6">
							{selectedData.status === "REJECTED" && (
								<div className="bg-rose-50 border border-rose-200 rounded-md p-4 space-y-1">
									<p className="text-sm font-semibold text-rose-800">
										Alasan Penolakan:
									</p>
									<p className="text-sm text-rose-700">
										{selectedData.rejectionNotes}
									</p>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-4">
									<h4 className="font-semibold border-b pb-2">
										Data Mahasiswa
									</h4>
									<div className="grid grid-cols-3 gap-2 text-sm">
										<span className="text-slate-500">Nama Lengkap</span>
										<span className="col-span-2 font-medium">
											{selectedData.name}
										</span>

										<span className="text-slate-500">Tempat, Tgl Lahir</span>
										<span className="col-span-2 font-medium">
											{selectedData.birthPlace},{" "}
											{selectedData.birthDate
												? new Date(selectedData.birthDate).toLocaleDateString(
														"id-ID",
													)
												: "-"}
										</span>

										<span className="text-slate-500">No. HP</span>
										<span className="col-span-2 font-medium">
											{selectedData.phone}
										</span>

										<span className="text-slate-500">Alamat Lengkap</span>
										<span className="col-span-2 font-medium">
											{selectedData.addressStreet} No. {selectedData.addressNo}{" "}
											RT {selectedData.addressRt}/RW {selectedData.addressRw},{" "}
											{selectedData.addressVillage},{" "}
											{selectedData.addressDistrict}, {selectedData.addressCity}
											, {selectedData.addressProvince}
										</span>
									</div>
								</div>

								<div className="space-y-4">
									<h4 className="font-semibold border-b pb-2">
										Data Pendidikan
									</h4>
									<div className="grid grid-cols-3 gap-2 text-sm">
										<span className="text-slate-500">Asal Sekolah</span>
										<span className="col-span-2 font-medium">
											{selectedData.schoolOrigin}
										</span>

										<span className="text-slate-500">Jurusan</span>
										<span className="col-span-2 font-medium">
											{selectedData.schoolMajor}
										</span>

										<span className="text-slate-500">Tahun Lulus</span>
										<span className="col-span-2 font-medium">
											{selectedData.graduationYear}
										</span>

										<span className="text-slate-500">Program Diminati</span>
										<span className="col-span-2 font-medium">
											{selectedData.program} - {selectedData.subProgram}
										</span>
									</div>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
