"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

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

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans p-4 sm:p-8">
			{/* Animated Background Mesh (subtle) */}
			<div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#0517B012_1px,transparent_1px),linear-gradient(to_bottom,#0517B012_1px,transparent_1px)] bg-[size:32px_32px]" />

			<div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-700 ease-out">
				{/* Logo Header */}
				<div className="flex flex-col items-center text-center mb-8">
					<div className="w-12 h-12 rounded-xl bg-[#0517B0] flex items-center justify-center shadow-[0_4px_14px_rgba(5,23,176,0.2)] mb-5">
						<span className="font-bold text-white text-xl">N</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
						Nusadaya Academy
					</h1>
					<p className="text-sm text-slate-500">
						Sistem Terpadu Validasi Mahasiswa
					</p>
				</div>

				{/* Error Alert */}
				{error && (
					<Alert
						variant="destructive"
						className="mb-6 bg-rose-50 border-rose-200 text-rose-800"
					>
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Login Gagal</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Login Form */}
				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="username" className="text-slate-700 font-medium">
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
								className="pl-10 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0517B0] h-11"
								autoComplete="username"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password" className="text-slate-700 font-medium">
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
								className="pl-10 pr-10 bg-slate-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0517B0] h-11"
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
						className="w-full h-11 mt-4 bg-[#0517B0] hover:bg-blue-800 text-white font-medium shadow-[0_4px_14px_0_rgba(5,23,176,0.25)] hover:shadow-[0_6px_20px_rgba(5,23,176,0.15)] transition-all"
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
				
				{/* Footer */}
				<div className="mt-8 text-center text-xs text-slate-400">
					&copy; 2026 Nusadaya Academy. Sistem Internal.
				</div>
			</div>
		</div>
	);
}
