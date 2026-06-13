"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowRight,
	CheckCircle,
	Eye,
	EyeOff,
	Lock,
	User,
	XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

const DEMO_ROLES = [
	"superadmin",
	"pmb",
	"crm",
	"finance",
	"akademik",
	"dosen",
	"pa",
	"magang",
	"evaluator",
];

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const router = useRouter();
	const login = useAuthStore((state) => state.login);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const { data, error: apiError } = await api.auth.login.post({
				username,
				password,
			});

			if (apiError || !data?.success || !data.user) {
				setError(apiError?.value?.message || "Username atau password salah.");
				return;
			}

			// Save both user info and the raw JWT token
			// The token is needed for cross-origin API calls (Authorization: Bearer)
			const rawToken = data.token as string | undefined;
			login(data.user, rawToken || "");
			router.push("/dashboard");
		} catch (_err) {
			setError("Terjadi kesalahan sistem. Silakan coba lagi.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleRoleClick = (role: string) => {
		setUsername(role);
		setPassword("password"); // Default demo password
	};

	return (
		<div className="min-h-screen flex bg-white text-slate-900 font-sans">
			{/* Left Panel - Branding (Hidden on mobile) */}
			<div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-[#0517B0] to-blue-700 overflow-hidden">
				{/* Animated Mesh Grid Overlay */}
				<div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />

				<div className="relative z-10">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
							<span className="font-bold text-[#0517B0] text-xl">N</span>
						</div>
						<span className="font-bold text-2xl tracking-tight text-white">
							Nusadaya
							<span className="font-light text-blue-200">Academy</span>
						</span>
					</div>
					<p className="text-blue-100 text-lg max-w-md">
						Integrated Student Tracking System. Pantau kesiapan mahasiswa dengan
						akurat dan real-time.
					</p>
				</div>

				{/* Mock visual panel */}
				<div className="relative z-10 bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-xl shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500 max-w-md mx-auto my-auto w-full">
					<div className="flex items-center gap-4 border-b border-white/20 pb-4 mb-4">
						<div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
							<User className="w-6 h-6 text-white" />
						</div>
						<div>
							<h3 className="font-bold text-lg text-white">Ahmad Fauzan</h3>
							<p className="text-sm text-blue-200">NIM: 20261001 • Prog: IT</p>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
							<div className="flex items-center gap-2">
								<CheckCircle className="w-4 h-4 text-emerald-500" />
								<span className="text-sm font-medium text-emerald-100">
									Status Keuangan
								</span>
							</div>
							<span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
								Aman
							</span>
						</div>
						<div className="flex items-center justify-between p-3 rounded-lg bg-amber-950/20 border border-amber-900/30">
							<div className="flex items-center gap-2">
								<AlertTriangle className="w-4 h-4 text-amber-500" />
								<span className="text-sm font-medium text-amber-100">
									Dokumen Magang
								</span>
							</div>
							<span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
								Perlu Perhatian
							</span>
						</div>
						<div className="flex items-center justify-between p-3 rounded-lg bg-rose-950/20 border border-rose-900/30">
							<div className="flex items-center gap-2">
								<XCircle className="w-4 h-4 text-rose-500" />
								<span className="text-sm font-medium text-rose-100">
									IPK Minimum
								</span>
							</div>
							<span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-full">
								Tidak Aman
							</span>
						</div>
					</div>

					<div className="mt-6 pt-4 border-t border-white/20">
						<div className="flex justify-between text-xs text-blue-100 mb-2">
							<span>Overall Progress</span>
							<span>24/42 Items Valid</span>
						</div>
						<div className="w-full bg-black/20 rounded-full h-2">
							<div
								className="bg-white h-2 rounded-full"
								style={{ width: "57%" }}
							/>
						</div>
					</div>
				</div>

				<div className="relative z-10 text-xs text-blue-200">
					© 2026 Nusadaya Academy. Sistem Internal Tertutup.
				</div>
			</div>

			{/* Right Panel - Login Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 animate-in fade-in slide-in-from-right-4 duration-700 ease-out">
				<div className="max-w-md w-full space-y-8">
					{/* Mobile Header (Hidden on Desktop) */}
					<div className="lg:hidden flex items-center justify-center gap-2 mb-8">
						<div className="w-8 h-8 rounded-lg bg-[#0517B0] flex items-center justify-center shadow-[0_0_15px_rgba(5,23,176,0.3)]">
							<span className="font-bold text-white text-md">N</span>
						</div>
						<span className="font-bold text-xl text-slate-900">Nusadaya</span>
					</div>

					<div>
						<h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
							Selamat Datang Kembali
						</h1>
						<p className="text-slate-500">
							Masuk ke akun Anda untuk melanjutkan monitoring validasi
							mahasiswa.
						</p>
					</div>

					{error && (
						<Alert
							variant="destructive"
							className="bg-rose-50 border-rose-200 text-rose-800"
						>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Login Gagal</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="username" className="text-slate-700">
								Username
							</Label>
							<div className="relative">
								<User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
								<Input
									id="username"
									type="text"
									placeholder="Masukkan username Anda..."
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
									className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0517B0] h-11"
									autoComplete="username"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password" className="text-slate-700">
									Password
								</Label>
							</div>
							<div className="relative">
								<Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className="pl-10 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0517B0] h-11"
									autoComplete="current-password"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full h-11 bg-[#0517B0] hover:bg-blue-800 text-white font-medium shadow-[0_4px_14px_0_rgba(5,23,176,0.39)] hover:shadow-[0_6px_20px_rgba(5,23,176,0.23)] transition-all"
						>
							{isLoading ? (
								<div className="flex items-center gap-2">
									<div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
									<span>Memverifikasi...</span>
								</div>
							) : (
								<div className="flex items-center gap-2">
									<span>Masuk ke Dashboard</span>
									<ArrowRight className="h-4 w-4" />
								</div>
							)}
						</Button>
					</form>

					{/* Development / Demo Hint */}
					<div className="mt-10 pt-6 border-t border-slate-200">
						<p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">
							Demo Role Accounts
						</p>
						<div className="flex flex-wrap gap-2">
							{DEMO_ROLES.map((role) => (
								<button
									key={role}
									type="button"
									onClick={() => handleRoleClick(role)}
									className="text-xs px-2.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-[#0517B0] hover:border-[#0517B0]/30 transition-colors"
								>
									{role}
								</button>
							))}
						</div>
						<p className="text-xs text-slate-500 mt-2 italic">
							Klik pill di atas untuk auto-fill form (Password: 'password')
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
