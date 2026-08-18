"use client";

import {
	ArrowLeft,
	CheckCircle2,
	FileText,
	Loader2,
	User,
	XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { Textarea } from "@/components/ui/textarea";
import { getToken } from "@/lib/eden";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ResponseDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params?.id as string;

	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [isApproveOpen, setIsApproveOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const [rejectionNotes, setRejectionNotes] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);

	const fetchData = async () => {
		try {
			const res = await fetch(`${API_URL}/pmb/form-responses/${id}`, {
				headers: {
					Authorization: `Bearer ${getToken()}`,
				},
			});
			const result = await res.json();
			if (result.success) {
				setData(result.data);
			} else {
				toast.error("Data pendaftar tidak ditemukan.");
				router.push("/dashboard/pmb");
			}
		} catch (error) {
			console.error(error);
			toast.error("Gagal mengambil data.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (id) {
			fetchData();
		}
	}, [id]);

	const handleApprove = async () => {
		setIsProcessing(true);
		try {
			const res = await fetch(`${API_URL}/pmb/form-responses/${id}/approve`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
			});
			const result = await res.json();
			if (result.success) {
				toast.success("Data pendaftar berhasil disetujui!");
				setIsApproveOpen(false);
				fetchData(); // reload data
			} else {
				toast.error(result.message || "Gagal menyetujui data");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleRejectSubmit = async () => {
		if (!rejectionNotes.trim()) {
			toast.error("Catatan penolakan harus diisi!");
			return;
		}

		setIsProcessing(true);
		try {
			const res = await fetch(`${API_URL}/pmb/form-responses/${id}/reject`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${getToken()}`,
				},
				body: JSON.stringify({ rejectionNotes }),
			});
			const result = await res.json();
			if (result.success) {
				toast.success("Data pendaftar berhasil ditolak");
				setIsRejectOpen(false);
				fetchData(); // reload data
			} else {
				toast.error(result.message || "Gagal menolak data");
			}
		} catch (error) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsProcessing(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen pb-20">
				<Loader2 className="w-8 h-8 animate-spin text-[#0517B0]" />
			</div>
		);
	}

	if (!data) return null;

	const isPending = data.status === "PENDING";

	return (
		<div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
			{/* Header */}
			<div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="text-slate-500"
						onClick={() => router.push("/dashboard/pmb")}
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Kembali
					</Button>
					<div>
						<h1 className="text-xl font-bold text-slate-800">
							Detail Pendaftar: {data.name}
						</h1>
						<p className="text-sm text-slate-500 flex items-center gap-2">
							<FileText className="w-4 h-4" />
							ID Form: #{data.id} &bull;{" "}
							{new Date(data.submittedAt).toLocaleDateString("id-ID", {
								day: "numeric",
								month: "long",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					</div>
				</div>
				<div>
					{data.status === "APPROVED" ? (
						<Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 text-sm">
							Disetujui
						</Badge>
					) : data.status === "REJECTED" ? (
						<Badge className="bg-rose-100 text-rose-700 border-none px-3 py-1 text-sm">
							Ditolak
						</Badge>
					) : (
						<Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1 text-sm">
							Menunggu Review
						</Badge>
					)}
				</div>
			</div>

			{/* Rejection Alert */}
			{data.status === "REJECTED" && data.rejectionNotes && (
				<div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start">
					<XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
					<div>
						<h4 className="font-semibold text-rose-800">Alasan Penolakan</h4>
						<p className="text-sm text-rose-700 mt-1">{data.rejectionNotes}</p>
					</div>
				</div>
			)}

			{/* Approval Note */}
			{data.status === "APPROVED" && data.processor && (
				<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 items-start">
					<CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
					<div>
						<h4 className="font-semibold text-emerald-800">Telah Disetujui</h4>
						<p className="text-sm text-emerald-700 mt-1">
							Disetujui oleh: {data.processor.fullName} pada{" "}
							{new Date(data.processedAt).toLocaleString("id-ID")}
						</p>
					</div>
				</div>
			)}

			{/* Main Content Layout */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Tab 1: Keterangan Mahasiswa */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						<User className="w-5 h-5" /> Keterangan Mahasiswa
					</h3>
					{data.profilePhotoUrl && (
						<div className="flex justify-center py-4">
							{/* biome-ignore lint/performance/noImgElement: External dynamic image */}
							<img
								src={data.profilePhotoUrl}
								alt="Foto Profil"
								className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-sm"
							/>
						</div>
					)}
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Nama Lengkap</span>
						<span className="col-span-2 font-medium">{data.name}</span>
						<span className="text-slate-500">Nama Panggilan</span>
						<span className="col-span-2 font-medium">
							{data.nickname || "-"}
						</span>
						<span className="text-slate-500">Email</span>
						<span className="col-span-2 font-medium">{data.email || "-"}</span>
						<span className="text-slate-500">No. HP</span>
						<span className="col-span-2 font-medium">{data.phone || "-"}</span>
						<span className="text-slate-500">Kewarganegaraan</span>
						<span className="col-span-2 font-medium">
							{data.nationality || "-"}
						</span>
						<span className="text-slate-500">Tempat, Tgl Lahir</span>
						<span className="col-span-2 font-medium">
							{data.birthPlace},{" "}
							{data.birthDate
								? new Date(data.birthDate).toLocaleDateString("id-ID")
								: "-"}
						</span>
						<span className="text-slate-500">Jenis Kelamin</span>
						<span className="col-span-2 font-medium">{data.gender || "-"}</span>
						<span className="text-slate-500">Agama</span>
						<span className="col-span-2 font-medium">
							{data.religion || "-"}
						</span>
						<span className="text-slate-500">Tinggal Dengan</span>
						<span className="col-span-2 font-medium">
							{data.livingWith || "-"}
						</span>
						<span className="text-slate-500">Alamat Lengkap</span>
						<span className="col-span-2 font-medium">
							{data.addressStreet} No. {data.addressNo} RT {data.addressRt}/RW{" "}
							{data.addressRw}, {data.addressVillage}, {data.addressDistrict},{" "}
							{data.addressCity}, {data.addressProvince}
						</span>
					</div>
				</div>

				{/* Tab 2: Pendidikan */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Pendidikan
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Asal Sekolah</span>
						<span className="col-span-2 font-medium">
							{data.schoolOrigin || "-"}
						</span>
						<span className="text-slate-500">Jurusan Sekolah</span>
						<span className="col-span-2 font-medium">
							{data.schoolMajor || "-"}
						</span>
						<span className="text-slate-500">Tahun Lulus</span>
						<span className="col-span-2 font-medium">
							{data.graduationYear || "-"}
						</span>
						<span className="text-slate-500">Alamat Sekolah</span>
						<span className="col-span-2 font-medium">
							{data.schoolAddress || "-"}
						</span>

						<div className="col-span-3 border-t my-2" />

						<span className="text-slate-500">Program Diminati</span>
						<span className="col-span-2 font-medium">
							{data.program || "-"}
						</span>
						<span className="text-slate-500">Peminatan</span>
						<div className="col-span-2">
							<PeminatanBadge
								subProgram={data.subProgram}
								program={data.program}
							/>
						</div>
						<span className="text-slate-500">Pilihan Kelas</span>
						<span className="col-span-2 font-medium">
							{data.classType || "-"}
						</span>
						<span className="text-slate-500">Angkatan</span>
						<span className="col-span-2 font-medium">{data.cohort || "-"}</span>
						<span className="text-slate-500">Batch</span>
						<span className="col-span-2 font-medium">{data.batch || "-"}</span>
						<span className="text-slate-500">Tahun Ajaran</span>
						<span className="col-span-2 font-medium">
							{data.academicYear || "-"}
						</span>
					</div>
				</div>

				{/* Tab 3: Kesehatan */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Kesehatan
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Golongan Darah</span>
						<span className="col-span-2 font-medium">
							{data.bloodType || "-"}
						</span>
						<span className="text-slate-500">Tinggi Badan</span>
						<span className="col-span-2 font-medium">
							{data.height ? `${data.height} cm` : "-"}
						</span>
						<span className="text-slate-500">Berat Badan</span>
						<span className="col-span-2 font-medium">
							{data.weight ? `${data.weight} kg` : "-"}
						</span>
						<span className="text-slate-500">Ukuran Baju</span>
						<span className="col-span-2 font-medium">
							{data.clothingSize || "-"}
						</span>
						<span className="text-slate-500">Riwayat Penyakit</span>
						<span className="col-span-2 font-medium">
							{data.diseaseHistory || "-"}
						</span>
						<span className="text-slate-500">Penyakit Bawaan</span>
						<span className="col-span-2 font-medium">
							{data.congenitalDisease || "-"}
						</span>
					</div>
				</div>

				{/* Tab 4: Ayah */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Ayah Kandung
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Nama Ayah</span>
						<span className="col-span-2 font-medium">
							{data.ayahName || "-"}
						</span>
						<span className="text-slate-500">Keadaan</span>
						<span className="col-span-2 font-medium">
							{data.ayahStatus || "-"}
						</span>
						<span className="text-slate-500">Kewarganegaraan</span>
						<span className="col-span-2 font-medium">
							{data.ayahNationality || "-"}
						</span>
						<span className="text-slate-500">Tempat, Tgl Lahir</span>
						<span className="col-span-2 font-medium">
							{data.ayahBirthPlace || "-"},{" "}
							{data.ayahBirthDate
								? new Date(data.ayahBirthDate).toLocaleDateString("id-ID")
								: "-"}
						</span>
						<span className="text-slate-500">Agama</span>
						<span className="col-span-2 font-medium">
							{data.ayahReligion || "-"}
						</span>
						<span className="text-slate-500">Pendidikan Terakhir</span>
						<span className="col-span-2 font-medium">
							{data.ayahEducation || "-"}
						</span>
						<span className="text-slate-500">Pekerjaan</span>
						<span className="col-span-2 font-medium">
							{data.ayahJob || "-"}
						</span>
						<span className="text-slate-500">No. HP</span>
						<span className="col-span-2 font-medium">
							{data.ayahPhone || "-"}
						</span>
						<span className="text-slate-500">Email</span>
						<span className="col-span-2 font-medium">
							{data.ayahEmail || "-"}
						</span>
						<span className="text-slate-500">Alamat Lengkap</span>
						<span className="col-span-2 font-medium">
							{data.ayahAddress || "-"}
						</span>
					</div>
				</div>

				{/* Tab 5: Ibu */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Ibu Kandung
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Nama Ibu</span>
						<span className="col-span-2 font-medium">
							{data.ibuName || "-"}
						</span>
						<span className="text-slate-500">Keadaan</span>
						<span className="col-span-2 font-medium">
							{data.ibuStatus || "-"}
						</span>
						<span className="text-slate-500">Kewarganegaraan</span>
						<span className="col-span-2 font-medium">
							{data.ibuNationality || "-"}
						</span>
						<span className="text-slate-500">Tempat, Tgl Lahir</span>
						<span className="col-span-2 font-medium">
							{data.ibuBirthPlace || "-"},{" "}
							{data.ibuBirthDate
								? new Date(data.ibuBirthDate).toLocaleDateString("id-ID")
								: "-"}
						</span>
						<span className="text-slate-500">Agama</span>
						<span className="col-span-2 font-medium">
							{data.ibuReligion || "-"}
						</span>
						<span className="text-slate-500">Pendidikan Terakhir</span>
						<span className="col-span-2 font-medium">
							{data.ibuEducation || "-"}
						</span>
						<span className="text-slate-500">Pekerjaan</span>
						<span className="col-span-2 font-medium">{data.ibuJob || "-"}</span>
						<span className="text-slate-500">No. HP</span>
						<span className="col-span-2 font-medium">
							{data.ibuPhone || "-"}
						</span>
						<span className="text-slate-500">Email</span>
						<span className="col-span-2 font-medium">
							{data.ibuEmail || "-"}
						</span>
						<span className="text-slate-500">Alamat Lengkap</span>
						<span className="col-span-2 font-medium">
							{data.ibuAddress || "-"}
						</span>
					</div>
				</div>

				{/* Tab 6: Wali */}
				<div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
					<h3 className="font-semibold text-lg text-[#0517B0] flex items-center gap-2 border-b pb-2">
						Keterangan Wali
					</h3>
					<div className="grid grid-cols-3 gap-y-3 text-sm">
						<span className="text-slate-500">Nama Wali</span>
						<span className="col-span-2 font-medium">
							{data.waliName || "-"}
						</span>
						<span className="text-slate-500">Hubungan</span>
						<span className="col-span-2 font-medium">
							{data.waliGuardianRelation || "-"}
						</span>
						<span className="text-slate-500">Kewarganegaraan</span>
						<span className="col-span-2 font-medium">
							{data.waliNationality || "-"}
						</span>
						<span className="text-slate-500">Tempat, Tgl Lahir</span>
						<span className="col-span-2 font-medium">
							{data.waliBirthPlace || "-"},{" "}
							{data.waliBirthDate
								? new Date(data.waliBirthDate).toLocaleDateString("id-ID")
								: "-"}
						</span>
						<span className="text-slate-500">Agama</span>
						<span className="col-span-2 font-medium">
							{data.waliReligion || "-"}
						</span>
						<span className="text-slate-500">Pendidikan Terakhir</span>
						<span className="col-span-2 font-medium">
							{data.waliEducation || "-"}
						</span>
						<span className="text-slate-500">Pekerjaan</span>
						<span className="col-span-2 font-medium">
							{data.waliJob || "-"}
						</span>
						<span className="text-slate-500">No. HP</span>
						<span className="col-span-2 font-medium">
							{data.waliPhone || "-"}
						</span>
						<span className="text-slate-500">Email</span>
						<span className="col-span-2 font-medium">
							{data.waliEmail || "-"}
						</span>
						<span className="text-slate-500">Alamat Lengkap</span>
						<span className="col-span-2 font-medium">
							{data.waliAddress || "-"}
						</span>
					</div>
				</div>
			</div>

			{/* Actions for PENDING status */}
			{isPending && (
				<div className="bg-white border rounded-xl p-6 shadow-sm sticky bottom-6 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
					<div>
						<h4 className="font-semibold">Tinjau Data Pendaftar</h4>
						<p className="text-sm text-slate-500">
							Pastikan data lengkap sebelum disetujui.
						</p>
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-11 px-6"
							onClick={() => setIsRejectOpen(true)}
						>
							<XCircle className="w-5 h-5 mr-2" />
							Tolak
						</Button>
						<Button
							className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 shadow-md"
							onClick={() => setIsApproveOpen(true)}
							disabled={isProcessing}
						>
							{isProcessing ? (
								<>
									<Loader2 className="w-5 h-5 mr-2 animate-spin" />
									Memproses...
								</>
							) : (
								<>
									<CheckCircle2 className="w-5 h-5 mr-2" />
									Setujui & Daftarkan
								</>
							)}
						</Button>
					</div>
				</div>
			)}

			{/* Modal Setuju */}
			<Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Setujui Pendaftar</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<p className="text-slate-600">
							Apakah Anda yakin ingin menyetujui data ini? Mahasiswa baru akan
							otomatis ditambahkan ke sistem akademik.
						</p>
						<div className="flex justify-end gap-3 pt-4">
							<Button variant="outline" onClick={() => setIsApproveOpen(false)}>
								Batal
							</Button>
							<Button
								className="bg-emerald-600 hover:bg-emerald-700 text-white"
								onClick={handleApprove}
								disabled={isProcessing}
							>
								{isProcessing ? "Memproses..." : "Konfirmasi Setujui"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Modal Tolak */}
			<Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tolak Data Pendaftar</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">
								Catatan Penolakan <span className="text-rose-500">*</span>
							</label>
							<Textarea
								placeholder="Berikan alasan mengapa data ini ditolak..."
								value={rejectionNotes}
								onChange={(e) => setRejectionNotes(e.target.value)}
							/>
						</div>
						<div className="flex justify-end gap-3 pt-4">
							<Button variant="outline" onClick={() => setIsRejectOpen(false)}>
								Batal
							</Button>
							<Button
								variant="destructive"
								onClick={handleRejectSubmit}
								disabled={isProcessing}
							>
								Konfirmasi Tolak
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
