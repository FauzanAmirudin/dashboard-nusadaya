import {
	Activity,
	ArrowRight,
	CheckCircle,
	Database,
	Lock,
	Palette,
	Target,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function Home() {
	const cookieStore = await cookies();
	const token = cookieStore.get("auth");

	if (token) {
		redirect("/dashboard");
	}

	return (
		<div className="min-h-screen bg-[#F8FAFF] text-slate-900 font-sans selection:bg-[#0517B0]/20">
			{/* Background Mesh/Grid */}
			<div className="fixed inset-0 z-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#0517B012_1px,transparent_1px),linear-gradient(to_bottom,#0517B012_1px,transparent_1px)] bg-[size:24px_24px]" />

			{/* Navbar (Landing) */}
			<nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-200/50 backdrop-blur-md bg-white/80">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-lg bg-[#0517B0] flex items-center justify-center">
						<span className="font-bold text-white text-lg">N</span>
					</div>
					<span className="font-bold text-xl tracking-tight text-slate-900">
						Nusadaya<span className="font-light text-[#0517B0]">Academy</span>
					</span>
				</div>
				<div>
					<Link href="/login">
						<Button
							variant="ghost"
							className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
						>
							Masuk
						</Button>
					</Link>
				</div>
			</nav>

			{/* Section 1: Hero */}
			<section className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
				<Badge
					variant="outline"
					className="mb-6 bg-blue-100/50 text-[#0517B0] border-[#0517B0]/30 rounded-full px-4 py-1.5 backdrop-blur-sm"
				>
					✦ Sistem Terpadu
				</Badge>

				<h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-[#0517B0] via-blue-700 to-blue-500">
					Dashboard Progress <br className="hidden md:block" />
					Mahasiswa Nusadaya
				</h1>

				<p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
					Pantau 42 indikator kesiapan mahasiswa dari 10 divisi berbeda dalam
					satu platform terpusat yang aman, transparan, dan real-time.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 mb-20">
					<Link href="/login">
						<Button className="h-12 px-8 rounded-full bg-[#0517B0] hover:bg-blue-800 text-white shadow-[0_4px_14px_0_rgba(5,23,176,0.39)] hover:shadow-[0_6px_20px_rgba(5,23,176,0.23)] transition-all">
							Masuk ke Dashboard
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
					<Button
						variant="outline"
						className="h-12 px-8 rounded-full border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-white"
					>
						Pelajari Lebih
					</Button>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
					<div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200/50 shadow-sm backdrop-blur-sm">
						<span className="text-4xl font-bold text-[#0517B0] mb-2">1,200+</span>
						<span className="text-sm text-slate-500 font-medium">
							Mahasiswa Aktif
						</span>
					</div>
					<div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200/50 shadow-sm backdrop-blur-sm">
						<span className="text-4xl font-bold text-[#0517B0] mb-2">10</span>
						<span className="text-sm text-slate-500 font-medium">
							Divisi Terintegrasi
						</span>
					</div>
					<div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200/50 shadow-sm backdrop-blur-sm">
						<span className="text-4xl font-bold text-[#0517B0] mb-2">42</span>
						<span className="text-sm text-slate-500 font-medium">
							Indikator Kesiapan
						</span>
					</div>
				</div>
			</section>

			{/* Section 2: Features Grid */}
			<section className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto">
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
						Kenapa Nusadaya Dashboard?
					</h2>
					<p className="text-slate-600 max-w-2xl mx-auto">
						Sistem yang dirancang khusus untuk mengatasi miskomunikasi dan
						mempercepat keputusan kelayakan mahasiswa secara digital.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[
						{
							icon: <Target className="h-6 w-6 text-[#0517B0]" />,
							title: "Terpusat",
							desc: "Single source of truth dari 10 divisi berbeda tanpa data yang tersebar.",
						},
						{
							icon: <Activity className="h-6 w-6 text-[#0517B0]" />,
							title: "Real-time",
							desc: "Update status mahasiswa seketika, mengurangi waktu koordinasi manual.",
						},
						{
							icon: <Lock className="h-6 w-6 text-[#0517B0]" />,
							title: "Aman",
							desc: "Role-Based Access Control (RBAC) ketat. Divisi hanya mengedit otoritasnya.",
						},
						{
							icon: <Palette className="h-6 w-6 text-[#0517B0]" />,
							title: "Indikator Warna",
							desc: "Kalkulasi otomatis 42 item menjadi indikator visual (Hijau, Kuning, Merah).",
						},
						{
							icon: <Database className="h-6 w-6 text-[#0517B0]" />,
							title: "Audit Trail",
							desc: "Jejak aktivitas terekam. Setiap klik persetujuan menyimpan data aktor & waktu.",
						},
						{
							icon: <CheckCircle className="h-6 w-6 text-[#0517B0]" />,
							title: "Approval Digital",
							desc: "Hilangkan pergeseran berkas kertas. Persetujuan direktur cukup 1 klik.",
						},
					].map((feature) => (
						<Card
							key={feature.title}
							className="bg-white border-slate-200/50 backdrop-blur-xl p-6 hover:translate-y-[-4px] transition-transform duration-300 hover:border-[#0517B0]/50 hover:shadow-[0_8px_24px_-12px_rgba(5,23,176,0.2)]"
						>
							<div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 border border-[#0517B0]/20">
								{feature.icon}
							</div>
							<h3 className="text-lg font-bold text-slate-900 mb-2">
								{feature.title}
							</h3>
							<p className="text-sm text-slate-600 leading-relaxed">
								{feature.desc}
							</p>
						</Card>
					))}
				</div>
			</section>

			{/* Section 4: Alur Kerja */}
			<section className="relative z-10 py-24 px-6 border-y border-slate-200/30 bg-slate-50/50">
				<div className="max-w-5xl mx-auto text-center">
					<h2 className="text-3xl font-bold mb-16 text-slate-900">
						Alur Validasi yang Efisien
					</h2>

					<div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
						{/* Connecting Line (Desktop) */}
						<div className="hidden md:block absolute top-6 left-12 right-12 h-0.5 bg-gradient-to-r from-slate-200 via-[#0517B0]/50 to-slate-200 z-0" />

						{[
							{ step: 1, title: "PMB", desc: "Input Data Awal" },
							{ step: 2, title: "Paralel", desc: "Proses 6 Divisi" },
							{ step: 3, title: "Akademik", desc: "Validasi Lulus" },
							{ step: 4, title: "Magang", desc: "Dokumen Ready" },
							{ step: 5, title: "Direktur", desc: "Approval Final" },
						].map((s) => (
							<div
								key={s.step}
								className="relative z-10 flex flex-col items-center bg-transparent md:bg-[#F8FAFF] px-4"
							>
								<div className="w-12 h-12 rounded-full bg-white border-2 border-[#0517B0] flex items-center justify-center font-bold text-[#0517B0] mb-4 shadow-[0_0_12px_rgba(5,23,176,0.2)]">
									{s.step}
								</div>
								<h4 className="font-bold text-slate-900 mb-1">{s.title}</h4>
								<span className="text-xs text-slate-500">{s.desc}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Section 5: CTA Footer */}
			<section className="relative z-10 py-32 px-6 text-center">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,23,176,0.08),transparent_50%)]" />
				<div className="relative z-10 max-w-2xl mx-auto">
					<h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
						Siap Digitalisasi Proses Validasi Mahasiswa?
					</h2>
					<p className="text-slate-600 mb-10">
						Akses dashboard Anda sekarang untuk mulai memantau progress
						mahasiswa dengan lebih cepat dan akurat.
					</p>
					<Link href="/login">
						<Button className="h-14 px-10 text-lg rounded-full bg-[#0517B0] hover:bg-blue-800 text-white shadow-[0_4px_14px_0_rgba(5,23,176,0.39)] hover:shadow-[0_6px_20px_rgba(5,23,176,0.23)]">
							Masuk ke Dashboard
						</Button>
					</Link>
				</div>
			</section>

			{/* Global Footer */}
			<footer className="relative z-10 border-t border-[#334155]/50 py-8 text-center text-slate-500 text-sm">
				<p>© 2026 Nusadaya Academy · Sistem Internal · v1.0.0</p>
			</footer>
		</div>
	);
}
