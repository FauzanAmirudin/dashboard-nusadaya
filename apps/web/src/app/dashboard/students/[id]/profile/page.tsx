"use client";

import { ArrowLeft, Edit, FileText, User } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function StudentProfilePage() {
	const router = useRouter();
	const { id } = useParams();
	const { user } = useAuthStore();
	const [isLoading, setIsLoading] = useState(true);

	const [student, setStudent] = useState<any>(null);
	const [pmb, setPmb] = useState<any>(null);
	const [health, setHealth] = useState<any>(null);
	const [parents, setParents] = useState<any[]>([]);

	useEffect(() => {
		if (user && user.role !== "superadmin" && user.role !== "pmb") {
			toast.error("Anda tidak memiliki akses ke halaman ini.");
			router.push("/dashboard");
		}
	}, [user, router]);

	useEffect(() => {
		const fetchData = async () => {
			if (!id) return;
			try {
				const [studentRes, healthRes, parentsRes] = await Promise.all([
					api.students[id as string].get(),
					api.students[id as string].health.get(),
					api.students[id as string].parents.get(),
				]);

				if (studentRes.data?.success && studentRes.data.data?.student) {
					setStudent(studentRes.data.data.student);
					setPmb(studentRes.data.data.pmb || null);
					setHealth(healthRes.data?.data || null);
					setParents(parentsRes.data?.data || []);
				} else {
					toast.error("Gagal memuat profil mahasiswa");
				}
			} catch (e) {
				console.error(e);
				toast.error("Gagal memuat profil mahasiswa");
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [id]);

	if (isLoading) {
		return (
			<div className="p-8 flex items-center justify-center min-h-[400px]">
				<div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
			</div>
		);
	}

	if (!student) {
		return (
			<div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
				<h2 className="text-xl font-bold mb-4">Data tidak ditemukan</h2>
				<Button variant="outline" onClick={() => router.back()}>
					Kembali
				</Button>
			</div>
		);
	}

	const ayah = parents.find((p: any) => p.type === "ayah") || null;
	const ibu = parents.find((p: any) => p.type === "ibu") || null;
	const wali = parents.find((p: any) => p.type === "wali") || null;

	const DataRow = ({
		label,
		value,
	}: {
		label: string;
		value?: string | null;
	}) => (
		<div className="grid grid-cols-3 py-2 border-b last:border-0 text-sm">
			<div className="text-slate-500 font-medium">{label}</div>
			<div className="col-span-2 font-semibold text-slate-800">
				{value || "-"}
			</div>
		</div>
	);

	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						size="icon"
						onClick={() => router.push(`/dashboard/students/${id}`)}
					>
						<ArrowLeft className="w-4 h-4" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">Detail Profil Mahasiswa</h1>
						<p className="text-sm text-slate-500">
							Menampilkan data lengkap hasil pendaftaran awal
						</p>
					</div>
				</div>
				<Link href={`/dashboard/students/${id}/edit`}>
					<Button className="gap-2 shadow-md">
						<Edit className="w-4 h-4" /> Edit Profil
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Sidebar Profile Card */}
				<Card className="md:col-span-1 h-fit shadow-sm">
					<CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
						<Avatar className="w-32 h-32 border-4 border-slate-100 shadow-sm">
							<AvatarImage
								src={
									student.profilePhotoUrl
										? student.profilePhotoUrl.startsWith("http")
											? student.profilePhotoUrl
											: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${student.profilePhotoUrl}`
										: ""
								}
							/>
							<AvatarFallback className="text-3xl bg-primary/10 text-primary">
								{student.name.charAt(0)}
							</AvatarFallback>
						</Avatar>
						<div>
							<h3 className="font-bold text-xl">{student.name}</h3>
							<p className="text-slate-500 text-sm mb-2">
								{student.nim || "NIM belum diatur"}
							</p>
							<Badge
								variant="secondary"
								className="bg-primary/10 text-primary hover:bg-primary/20"
							>
								{student.program} - Cohort {student.cohort}
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* Main Details */}
				<div className="md:col-span-2 space-y-6">
					{/* Data Diri */}
					<Card className="shadow-sm">
						<CardHeader className="pb-3 border-b bg-slate-50/50">
							<CardTitle className="text-lg flex items-center gap-2">
								<User className="w-5 h-5 text-primary" /> Data Pribadi
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4">
							<DataRow label="Nama Lengkap" value={student.name} />
							<DataRow label="Nama Panggilan" value={student.nickname} />
							<DataRow label="Jenis Kelamin" value={student.gender} />
							<DataRow
								label="Tempat, Tanggal Lahir"
								value={`${student.birthPlace || "-"}, ${student.birthDate ? new Date(student.birthDate).toLocaleDateString("id-ID") : "-"}`}
							/>
							<DataRow label="Agama" value={student.religion} />
							<DataRow label="Kewarganegaraan" value={student.nationality} />
							<DataRow
								label="Alamat Lengkap"
								value={`${student.addressStreet || "-"}, RT ${student.addressRt || "-"}/RW ${student.addressRw || "-"}, No. ${student.addressNo || "-"}`}
							/>
							<DataRow label="Desa/Kelurahan" value={student.addressVillage} />
							<DataRow label="Kecamatan" value={student.addressDistrict} />
							<DataRow label="Kabupaten/Kota" value={student.addressCity} />
							<DataRow label="Provinsi" value={student.addressProvince} />
							<DataRow label="Tinggal Bersama" value={student.livingWith} />
							<DataRow label="No. Handphone (WA)" value={student.phone} />
							<DataRow label="Email" value={student.email} />
						</CardContent>
					</Card>

					{/* Data Pendidikan */}
					<Card className="shadow-sm">
						<CardHeader className="pb-3 border-b bg-slate-50/50">
							<CardTitle className="text-lg flex items-center gap-2">
								<FileText className="w-5 h-5 text-primary" /> Riwayat Pendidikan
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4">
							<DataRow label="Asal Sekolah" value={student.schoolOrigin} />
							<DataRow label="Alamat Sekolah" value={student.schoolAddress} />
							<DataRow label="Jurusan" value={student.schoolMajor} />
							<DataRow
								label="Tahun Lulus"
								value={student.graduationYear?.toString()}
							/>
							<DataRow label="Program Pilihan" value={student.program} />
							<div className="grid grid-cols-3 py-2 border-b last:border-0 text-sm">
								<div className="text-slate-500 font-medium">
									Sub Program / Peminatan
								</div>
								<div className="col-span-2">
									<PeminatanBadge
										subProgram={student.subProgram}
										destinationCountry={student.destinationCountry}
										program={student.program}
									/>
								</div>
							</div>
							<DataRow label="Tipe Kelas" value={student.classType} />
						</CardContent>
					</Card>

					{/* Data Akademik Tambahan & PMB */}
					<Card className="shadow-sm">
						<CardHeader className="pb-3 border-b bg-slate-50/50">
							<CardTitle className="text-lg flex items-center gap-2">
								<FileText className="w-5 h-5 text-primary" /> Informasi PMB &
								Akademik
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4">
							<DataRow label="Status Mahasiswa" value={student.studentStatus} />
							<div className="grid grid-cols-3 py-2 border-b last:border-0 text-sm">
								<div className="text-slate-500 font-medium">Negara Tujuan</div>
								<div className="col-span-2">
									<PeminatanBadge
										subProgram={student.subProgram}
										destinationCountry={student.destinationCountry}
										showCountryOnly={true}
									/>
								</div>
							</div>
							<DataRow label="Periode Keberangkatan" value={student.period} />
							<DataRow label="Rekomendasi" value={pmb?.rekomendasi} />
							<DataRow label="Tim Visit" value={pmb?.timVisit} />
							<DataRow label="Tim Sosialisasi" value={pmb?.timSosialisasi} />
							<DataRow label="RO Referral" value={pmb?.roReferral} />
							<DataRow label="Mitra Sponsor" value={pmb?.mitraSponsor} />
							<DataRow label="Koordinator" value={pmb?.koordinator} />
						</CardContent>
					</Card>

					{/* Data Kesehatan */}
					<Card className="shadow-sm">
						<CardHeader className="pb-3 border-b bg-slate-50/50">
							<CardTitle className="text-lg flex items-center gap-2">
								<FileText className="w-5 h-5 text-primary" /> Keterangan
								Kesehatan
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4">
							<DataRow label="Golongan Darah" value={health?.bloodType} />
							<DataRow
								label="Tinggi Badan (cm)"
								value={health?.height?.toString()}
							/>
							<DataRow
								label="Berat Badan (kg)"
								value={health?.weight?.toString()}
							/>
							<DataRow
								label="Riwayat Penyakit"
								value={health?.diseaseHistory}
							/>
							<DataRow
								label="Penyakit Bawaan"
								value={health?.congenitalDisease}
							/>
							<DataRow label="Ukuran Baju" value={health?.clothingSize} />
						</CardContent>
					</Card>

					{/* Data Orang Tua */}
					<Card className="shadow-sm">
						<CardHeader className="pb-3 border-b bg-slate-50/50">
							<CardTitle className="text-lg flex items-center gap-2">
								<User className="w-5 h-5 text-primary" /> Data Orang Tua & Wali
							</CardTitle>
						</CardHeader>
						<CardContent className="pt-4 space-y-6">
							<div>
								<h4 className="font-bold text-slate-800 mb-2">Ayah Kandung</h4>
								<div className="border rounded-lg p-4 bg-slate-50/50">
									{ayah ? (
										<>
											<DataRow label="Nama" value={ayah.name} />
											<DataRow
												label="Tempat, Tgl Lahir"
												value={`${ayah.birthPlace || "-"}, ${ayah.birthDate ? new Date(ayah.birthDate).toLocaleDateString("id-ID") : "-"}`}
											/>
											<DataRow label="Agama" value={ayah.religion} />
											<DataRow
												label="Kewarganegaraan"
												value={ayah.nationality}
											/>
											<DataRow
												label="Pendidikan Terakhir"
												value={ayah.education}
											/>
											<DataRow label="Pekerjaan" value={ayah.job} />
											<DataRow label="No. Handphone" value={ayah.phone} />
											<DataRow label="Email" value={ayah.email} />
											<DataRow label="Alamat" value={ayah.address} />
											<DataRow label="Status" value={ayah.status} />
										</>
									) : (
										<p className="text-sm text-slate-500 italic">
											Data ayah tidak diisi
										</p>
									)}
								</div>
							</div>
							<div>
								<h4 className="font-bold text-slate-800 mb-2">Ibu Kandung</h4>
								<div className="border rounded-lg p-4 bg-slate-50/50">
									{ibu ? (
										<>
											<DataRow label="Nama" value={ibu.name} />
											<DataRow
												label="Tempat, Tgl Lahir"
												value={`${ibu.birthPlace || "-"}, ${ibu.birthDate ? new Date(ibu.birthDate).toLocaleDateString("id-ID") : "-"}`}
											/>
											<DataRow label="Agama" value={ibu.religion} />
											<DataRow
												label="Kewarganegaraan"
												value={ibu.nationality}
											/>
											<DataRow
												label="Pendidikan Terakhir"
												value={ibu.education}
											/>
											<DataRow label="Pekerjaan" value={ibu.job} />
											<DataRow label="No. Handphone" value={ibu.phone} />
											<DataRow label="Email" value={ibu.email} />
											<DataRow label="Alamat" value={ibu.address} />
											<DataRow label="Status" value={ibu.status} />
										</>
									) : (
										<p className="text-sm text-slate-500 italic">
											Data ibu tidak diisi
										</p>
									)}
								</div>
							</div>
							<div>
								<h4 className="font-bold text-slate-800 mb-2">Wali</h4>
								<div className="border rounded-lg p-4 bg-slate-50/50">
									{wali ? (
										<>
											<DataRow label="Nama" value={wali.name} />
											<DataRow label="Hubungan" value={wali.guardianRelation} />
											<DataRow
												label="Tempat, Tgl Lahir"
												value={`${wali.birthPlace || "-"}, ${wali.birthDate ? new Date(wali.birthDate).toLocaleDateString("id-ID") : "-"}`}
											/>
											<DataRow label="Agama" value={wali.religion} />
											<DataRow
												label="Kewarganegaraan"
												value={wali.nationality}
											/>
											<DataRow
												label="Pendidikan Terakhir"
												value={wali.education}
											/>
											<DataRow label="Pekerjaan" value={wali.job} />
											<DataRow label="No. Handphone" value={wali.phone} />
											<DataRow label="Email" value={wali.email} />
											<DataRow label="Alamat" value={wali.address} />
										</>
									) : (
										<p className="text-sm text-slate-500 italic">
											Data wali tidak diisi
										</p>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
