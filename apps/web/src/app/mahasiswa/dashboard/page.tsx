"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	ExternalLink,
	FileText,
	RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function MahasiswaDashboard() {
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const [mounted, setMounted] = useState(false);
	const [student, setStudent] = useState<any>(null);
	const [progress, setProgress] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setMounted(true);
		if (hasHydrated && isAuthenticated && user?.role === "mahasiswa") {
			fetchData();
		}
	}, [user, hasHydrated, isAuthenticated]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const [meRes, progressRes] = await Promise.all([
				api.mahasiswa.me.get(),
				api.mahasiswa.progress.get(),
			]);

			if (meRes.data?.success) setStudent(meRes.data.data);
			if (progressRes.data?.success) setProgress(progressRes.data.data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	if (!mounted) return null;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[50vh]">
				<RefreshCw className="w-8 h-8 text-[#0517B0] animate-spin" />
			</div>
		);
	}

	const renderStatus = (
		isAcc: boolean | undefined | null,
		status: string | undefined | null,
	) => {
		if (isAcc)
			return (
				<Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
				</Badge>
			);
		if (status === "AMAN")
			return (
				<Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">
					<CheckCircle2 className="w-3 h-3 mr-1" /> Aman
				</Badge>
			);
		if (status === "TIDAK_AMAN")
			return (
				<Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
					<AlertCircle className="w-3 h-3 mr-1" /> Tidak Aman
				</Badge>
			);
		if (status === "PERLU_PERHATIAN")
			return (
				<Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
					<Clock className="w-3 h-3 mr-1" /> Proses
				</Badge>
			);
		return (
			<Badge variant="outline" className="text-slate-400">
				Belum diproses
			</Badge>
		);
	};

	const panels = [
		{ name: "PMB", key: "pmb", path: "pmb", desc: "Pendaftaran & Akuisisi" },
		{ name: "CRM", key: "crm", path: "crm", desc: "Kontrak & Persetujuan" },
		{
			name: "Finance",
			key: "finance",
			path: "finance",
			desc: "Administrasi Keuangan",
		},
		{
			name: "Akademik",
			key: "academic",
			path: "akademik",
			desc: "Nilai & Berkas",
		},
		{ name: "PA", key: "pa", path: "pa", desc: "Evaluasi Pembimbing" },
		{
			name: "Magang",
			key: "internship",
			path: "magang",
			desc: "Rekomendasi Magang",
		},
	];

	return (
		<div className="space-y-6">
			{/* HERO SECTION */}
			<Card className="border-0 shadow-md bg-gradient-to-br from-[#0517B0] to-blue-600 text-white overflow-hidden relative">
				<div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
				<CardContent className="p-8 relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
					<div>
						<h1 className="text-2xl font-bold mb-2">
							Halo, {student?.name}! 👋
						</h1>
						<p className="text-blue-100 mb-6">
							Selamat datang di Portal Mahasiswa Nusadaya.
						</p>
						<div className="flex flex-wrap gap-3">
							<div className="bg-black/20 rounded-lg px-4 py-2 border border-white/10">
								<p className="text-xs text-blue-200">Program</p>
								<p className="font-semibold">
									{student?.program}{" "}
									{student?.subProgram ? `- ${student.subProgram}` : ""}
								</p>
							</div>
							<div className="bg-black/20 rounded-lg px-4 py-2 border border-white/10">
								<p className="text-xs text-blue-200">Angkatan</p>
								<p className="font-semibold">{student?.cohort}</p>
							</div>
							<div className="bg-black/20 rounded-lg px-4 py-2 border border-white/10">
								<p className="text-xs text-blue-200">Negara Tujuan</p>
								<p className="font-semibold">
									{student?.destinationCountry || "-"}
								</p>
							</div>
						</div>
					</div>
					<div className="flex flex-col items-center md:items-end gap-2">
						<span className="text-sm font-medium text-blue-200">
							Status Keseluruhan
						</span>
						{student?.overallStatus === "AMAN" ? (
							<div className="bg-emerald-400 text-emerald-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg">
								<CheckCircle2 className="w-5 h-5" />
								AMAN & SIAP
							</div>
						) : student?.overallStatus === "TIDAK_AMAN" ? (
							<div className="bg-rose-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg">
								<AlertCircle className="w-5 h-5" />
								TIDAK AMAN
							</div>
						) : (
							<div className="bg-amber-400 text-amber-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg">
								<Clock className="w-5 h-5" />
								PROSES PENGERJAAN
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<h2 className="text-lg font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
				<FileText className="w-5 h-5 text-[#0517B0]" />
				Progress Tracking (Divisi)
			</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{panels.map((panel, idx) => {
					const panelData = progress?.[panel.key];
					const isAcc = panelData?.isAcc;
					const status = panelData?.status;

					return (
						<Card
							key={panel.key}
							className="border-slate-200 shadow-sm transition-all hover:shadow-md"
						>
							<CardContent className="p-5 flex flex-col h-full">
								<div className="flex justify-between items-start mb-4">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-[#0517B0] text-white">
											{idx + 1}
										</div>
										<div>
											<h3 className="font-semibold text-slate-800">
												{panel.name}
											</h3>
											<p className="text-xs text-slate-500">{panel.desc}</p>
										</div>
									</div>
								</div>

								<div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<span className="text-xs font-medium text-slate-500">
											Status:
										</span>
										{renderStatus(isAcc, status)}
									</div>
									<Link
										href={`/mahasiswa/panel/${panel.path}`}
										className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border h-9 px-3 w-full text-[#0517B0] bg-transparent hover:bg-blue-50 border-blue-100"
									>
										Lihat Detail <ExternalLink className="w-3 h-3 ml-1" />
									</Link>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* KEPUTUSAN FINAL */}
			<Card className="border-slate-200 shadow-sm mt-8 border-t-4 border-t-[#0517B0]">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg text-slate-800">
						Tahap Finalisasi (Evaluator & Direktur)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
						<div className="flex-1">
							<p className="text-sm text-slate-500 mb-1">Keputusan Evaluator</p>
							{progress?.finalDecision?.evaluatorDecision ===
							"layak_berangkat" ? (
								<p className="font-bold text-emerald-600 flex items-center gap-2">
									<CheckCircle2 className="w-5 h-5" /> Layak Berangkat
								</p>
							) : progress?.finalDecision?.evaluatorDecision ? (
								<p className="font-semibold text-amber-600 capitalize">
									{progress.finalDecision.evaluatorDecision.replace("_", " ")}
								</p>
							) : (
								<p className="font-medium text-slate-400">Menunggu Review</p>
							)}
						</div>

						<div className="hidden md:block w-px bg-slate-200"></div>

						<div className="flex-1">
							<p className="text-sm text-slate-500 mb-1">
								SK & Persetujuan Direktur
							</p>
							{progress?.finalDecision?.isApprovedByDirector ? (
								<p className="font-bold text-emerald-600 flex items-center gap-2">
									<CheckCircle2 className="w-5 h-5" /> SK Telah Diterbitkan
								</p>
							) : (
								<p className="font-medium text-slate-400">Belum Terbit</p>
							)}
						</div>
					</div>
					<p className="text-sm text-slate-500 mt-4 text-center italic">
						* Pastikan seluruh 6 panel divisi sebelumnya (PMB - Magang) telah
						berstatus{" "}
						<span className="font-semibold text-emerald-600">
							Selesai (ACC)
						</span>{" "}
						agar proses finalisasi dapat diproses.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
