"use client";

import { Eye, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PeminatanBadge } from "@/components/ui/PeminatanBadge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authFetch } from "@/lib/eden";
import { formatReferralCategory } from "@/lib/referral";
import { EmptyState, fmtDateTime, ListSkeleton } from "./shared";

const WAIT_WARN_MS = 48 * 60 * 60 * 1000;

/** Field yang dipakai kolom "Asal" pada tabel respons. */
interface AsalRespons {
	schoolOrigin?: string | null;
	referralInstitutionName?: string | null;
	referralCategory?: string | null;
}

export function TabRespons() {
	const router = useRouter();
	const [responses, setResponses] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [query, setQuery] = useState("");

	const fetchResponses = async () => {
		setIsLoading(true);
		try {
			const res = await authFetch("/pmb/form-responses");
			const data = await res.json();
			if (data.success) {
				setResponses(data.data || []);
			} else {
				toast.error(data.message || "Gagal memuat data antrean respons");
			}
		} catch (error) {
			console.error("Failed to fetch responses", error);
			toast.error("Terjadi kesalahan jaringan saat memuat respons");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchResponses();
	}, []);

	// Terbaru di atas; cari berdasarkan nama / nomor HP / sekolah.
	const rows = useMemo(() => {
		const q = query.trim().toLowerCase();
		return [...responses]
			.sort(
				(a, b) =>
					new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
			)
			.filter(
				(r) =>
					!q ||
					(r.name || "").toLowerCase().includes(q) ||
					(r.phone || "").includes(q) ||
					(r.schoolOrigin || "").toLowerCase().includes(q),
			);
	}, [responses, query]);

	const isLongWait = (r: any) =>
		Date.now() - new Date(r.submittedAt).getTime() > WAIT_WARN_MS;

	// Kolom "Asal" sudah menampilkan nama sekolah, jadi baris referral hanya
	// ditampilkan bila benar-benar menambah informasi: institusi yang berbeda
	// dari sekolah, atau kategori selain "Asal Sekolah".
	const isSameAsSchool = (r: AsalRespons) => {
		const institution = (r.referralInstitutionName || "").trim().toLowerCase();
		const school = (r.schoolOrigin || "").trim().toLowerCase();
		return Boolean(institution) && institution === school;
	};

	const isAsalSekolah = (r: AsalRespons) =>
		formatReferralCategory(r.referralCategory) === "Asal Sekolah";

	const Referral = ({ r }: { r: any }) => {
		if (r.referralInstitutionName && !isSameAsSchool(r)) {
			return (
				<div className="min-w-0">
					<span className="block text-xs font-medium text-slate-800 [overflow-wrap:anywhere]">
						{r.referralInstitutionName}
					</span>
					<span className="text-[10px] text-slate-500">
						{formatReferralCategory(r.referralCategory)}
					</span>
				</div>
			);
		}
		// Label "Asal Sekolah" hanya mengulang judul kolom — tidak perlu ditulis.
		if (isAsalSekolah(r) || isSameAsSchool(r)) return null;
		if (r.referralCategory) {
			return (
				<span className="text-xs text-slate-600">
					{formatReferralCategory(r.referralCategory)}
				</span>
			);
		}
		return <span className="text-xs text-slate-400">-</span>;
	};

	const Waiting = ({ r }: { r: any }) => (
		<span
			className={`text-xs ${isLongWait(r) ? "font-semibold text-amber-600" : "text-slate-500"}`}
		>
			{fmtDateTime(r.submittedAt)}
			{isLongWait(r) && " · menunggu > 2 hari"}
		</span>
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-lg font-semibold text-slate-800">
							Menunggu Persetujuan
						</h3>
						{!isLoading && responses.length > 0 && (
							<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#0517B0]">
								{responses.length} Antrean
							</span>
						)}
					</div>
					<p className="text-sm text-slate-500">
						Tinjau dan setujui data pendaftar baru yang telah dikirim melalui
						tautan formulir.
					</p>
				</div>
			</div>

			{responses.length > 0 && (
				<div className="relative sm:max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<Input
						placeholder="Cari nama, nomor HP, atau sekolah..."
						className="pl-9 h-11 sm:h-9 bg-white"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
			)}

			{isLoading && responses.length === 0 ? (
				<ListSkeleton />
			) : responses.length === 0 ? (
				<EmptyState
					title="Belum ada pendaftar baru yang menunggu."
					hint="Respons akan muncul di sini setelah calon mahasiswa mengirim formulir."
				/>
			) : rows.length === 0 ? (
				<EmptyState
					title="Tidak ada hasil yang cocok."
					hint="Coba kata kunci lain."
				/>
			) : (
				<>
					<div className="hidden md:block border border-slate-200 rounded-md bg-white">
						<Table>
							<TableHeader className="bg-slate-50">
								<TableRow>
									<TableHead>Pendaftar</TableHead>
									<TableHead>Asal</TableHead>
									<TableHead>Program</TableHead>
									<TableHead>Waktu Kirim</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((r) => (
									<TableRow key={r.id}>
										<TableCell>
											<div className="font-medium text-slate-900">{r.name}</div>
											<div className="text-xs text-slate-500">
												{r.phone || "-"}
											</div>
										</TableCell>
										<TableCell className="whitespace-normal max-w-[220px]">
											<div className="text-xs text-slate-700 [overflow-wrap:anywhere]">
												{r.schoolOrigin || "-"}
											</div>
											<Referral r={r} />
										</TableCell>
										<TableCell>
											<PeminatanBadge
												subProgram={r.subProgram}
												program={r.program}
											/>
										</TableCell>
										<TableCell className="whitespace-normal">
											<Waiting r={r} />
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													router.push(`/dashboard/pmb/responses/${r.id}`)
												}
												className="gap-1.5 border-[#0517B0]/30 text-[#0517B0] hover:bg-blue-50 cursor-pointer"
											>
												<Eye className="w-4 h-4" />
												Tinjau
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<ul className="space-y-3 md:hidden">
						{rows.map((r) => (
							<li
								key={r.id}
								className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
							>
								<div className="min-w-0">
									<p className="font-semibold text-slate-900 [overflow-wrap:anywhere]">
										{r.name}
									</p>
									{r.phone ? (
										<a
											href={`tel:${r.phone}`}
											className="text-sm text-[#0517B0]"
										>
											{r.phone}
										</a>
									) : (
										<span className="text-sm text-slate-400">-</span>
									)}
								</div>
								<div className="space-y-1.5">
									<PeminatanBadge
										subProgram={r.subProgram}
										program={r.program}
									/>
									<p className="text-xs text-slate-600 [overflow-wrap:anywhere]">
										{r.schoolOrigin || "-"}
									</p>
									<Referral r={r} />
								</div>
								<Waiting r={r} />
								<Button
									onClick={() =>
										router.push(`/dashboard/pmb/responses/${r.id}`)
									}
									className="h-11 w-full gap-2 bg-[#0517B0] hover:bg-blue-800 cursor-pointer"
								>
									<Eye className="w-4 h-4" />
									Tinjau
								</Button>
							</li>
						))}
					</ul>
				</>
			)}
		</div>
	);
}
