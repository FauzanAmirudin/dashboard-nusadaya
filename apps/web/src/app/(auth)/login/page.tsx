"use client";

import {
	AlertCircle,
	ArrowRight,
	Clock,
	Eye,
	EyeOff,
	Lock,
	ShieldAlert,
	User,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

function LoginForm() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isLocked, setIsLocked] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const searchParams = useSearchParams();
	const reason = searchParams.get("reason");

	const router = useRouter();
	const login = useAuthStore((state) => state.login);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLocked(false);
		setIsLoading(true);

		try {
			const res = await api.auth.login.post({
				username,
				password,
			});

			const resData = res.data as any;
			const resError = (res.error?.value as any) || resData;

			if (
				res.status === 429 ||
				resError?.code === "ACCOUNT_LOCKED" ||
				resData?.code === "ACCOUNT_LOCKED"
			) {
				setIsLocked(true);
				setError(
					resError?.message ||
						resData?.message ||
						"Terlalu banyak percobaan gagal. Akun dikunci sementara.",
				);
				return;
			}

			if (res.error || !resData?.success || !resData?.user) {
				setError(
					resError?.message ||
						resData?.message ||
						"Username atau password salah.",
				);
				return;
			}

			// Save user info and raw JWT token
			const rawToken = resData.token as string | undefined;
			login(resData.user, rawToken || "");
			if (resData.user.role === "mahasiswa") {
				router.push("/mahasiswa/dashboard");
			} else {
				router.push("/dashboard");
			}
		} catch (_err) {
			setError("Terjadi kesalahan sistem. Silakan coba lagi.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans p-4 sm:p-8 relative overflow-hidden">
			{/* Premium Decorative Background Elements */}
			<div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0517B0] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse" />
			<div
				className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"
				style={{ animationDelay: "2s" }}
			/>

			{/* Animated Background Mesh (subtle) */}
			<div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#0517B012_1px,transparent_1px),linear-gradient(to_bottom,#0517B012_1px,transparent_1px)] bg-[size:32px_32px]" />

			{/* Enhanced Glassmorphism Card */}
			<div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(5,23,176,0.15)] border border-white/60 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-700 ease-out ring-1 ring-slate-900/5">
				{/* Logo Header */}
				<div className="flex flex-col items-center text-center mb-8">
					<div className="w-20 h-20 flex items-center justify-center mb-5">
						<Image
							src="/logonusadaya.png"
							alt="Logo Nusadaya"
							width={80}
							height={80}
							className="object-contain"
							priority
						/>
					</div>
					<h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-2">
						Nusadaya Academy
					</h1>
					<p className="text-sm font-medium text-slate-500">
						Sistem Terpadu Validasi Mahasiswa
					</p>
				</div>

				{/* Idle Timeout Alert Banner */}
				{reason === "idle" && (
					<Alert className="mb-6 bg-amber-50/90 backdrop-blur-sm border-amber-200 text-amber-900 shadow-sm rounded-xl">
						<Clock className="h-4 w-4 text-amber-600 shrink-0" />
						<div className="ml-2">
							<AlertTitle className="font-bold text-amber-900 text-xs">
								Sesi Berakhir Otomatis
							</AlertTitle>
							<AlertDescription className="text-xs mt-0.5 text-amber-700 leading-relaxed">
								Sesi Anda telah diakhiri karena tidak ada aktivitas selama 30
								menit. Silakan login kembali untuk melanjutkan.
							</AlertDescription>
						</div>
					</Alert>
				)}

				{/* Error / Lockout Alert */}
				{error && (
					<Alert
						variant="destructive"
						className={`mb-6 backdrop-blur-sm shadow-sm rounded-xl ${
							isLocked
								? "bg-amber-50/90 border-amber-300 text-amber-900"
								: "bg-rose-50/80 border-rose-200 text-rose-800"
						}`}
					>
						{isLocked ? (
							<ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
						) : (
							<AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
						)}
						<div className="ml-2">
							<AlertTitle className="font-bold text-xs">
								{isLocked ? "Akun Dikunci Sementara" : "Login Gagal"}
							</AlertTitle>
							<AlertDescription className="text-xs mt-0.5 leading-relaxed">
								{error}
							</AlertDescription>
						</div>
					</Alert>
				)}

				{/* Login Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2.5">
						<Label
							htmlFor="username"
							className="text-slate-700 font-semibold ml-1"
						>
							Username
						</Label>
						<div className="relative group">
							<User className="absolute left-3.5 top-3.5 h-5 w-5 text-black z-10 pointer-events-none group-focus-within:text-[#0517B0] transition-colors" />
							<Input
								id="username"
								type="text"
								placeholder="Masukkan username Anda..."
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								className="pl-11 bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0517B0] focus-visible:border-[#0517B0] focus:bg-white h-12 rounded-xl transition-all"
								autoComplete="username"
							/>
						</div>
					</div>

					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<Label
								htmlFor="password"
								className="text-slate-700 font-semibold ml-1"
							>
								Password
							</Label>
						</div>
						<div className="relative group">
							<Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-black z-10 pointer-events-none group-focus-within:text-[#0517B0] transition-colors" />
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="pl-11 pr-11 bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0517B0] focus-visible:border-[#0517B0] focus:bg-white h-12 rounded-xl transition-all"
								autoComplete="current-password"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3.5 top-3.5 text-black hover:text-black/70 focus:outline-none transition-colors"
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
						className="w-full h-12 mt-6 bg-gradient-to-r from-[#0517B0] to-blue-700 hover:from-blue-800 hover:to-blue-900 text-white font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(5,23,176,0.4)] hover:shadow-[0_12px_25px_-4px_rgba(5,23,176,0.5)] transition-all hover:-translate-y-0.5 active:translate-y-0"
					>
						{isLoading ? (
							<div className="flex items-center gap-2">
								<div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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

				{/* Footer */}
				<div className="mt-10 text-center text-xs font-medium text-slate-400/80">
					&copy; 2026 Nusadaya Academy. Sistem Internal.
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-slate-50 flex items-center justify-center">
					Memuat...
				</div>
			}
		>
			<LoginForm />
		</Suspense>
	);
}
