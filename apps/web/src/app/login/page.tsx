"use client";

import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	Clock,
	Eye,
	EyeOff,
	KeyRound,
	Lock,
	Mail,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

interface CredentialsFormProps {
	email: string;
	setEmail: (v: string) => void;
	password: string;
	setPassword: (v: string) => void;
	showPassword: boolean;
	setShowPassword: (v: boolean) => void;
	isLoading: boolean;
	onSubmit: (e: React.FormEvent) => void;
}

function CredentialsForm({
	email,
	setEmail,
	password,
	setPassword,
	showPassword,
	setShowPassword,
	isLoading,
	onSubmit,
}: CredentialsFormProps) {
	return (
		<form
			onSubmit={onSubmit}
			className="space-y-5 animate-in fade-in duration-300"
		>
			<div className="space-y-2">
				<Label
					htmlFor="email"
					className="text-slate-700 font-semibold ml-1 text-sm"
				>
					Email / Akun Gmail
				</Label>
				<div className="relative group">
					<Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500 z-10 pointer-events-none group-focus-within:text-[#0517B0] transition-colors" />
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="onedatanusadaya@gmail.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="pl-11 bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#0517B0] focus-visible:border-[#0517B0] focus:bg-white h-12 rounded-xl transition-all"
						autoComplete="email"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label
					htmlFor="password"
					className="text-slate-700 font-semibold ml-1 text-sm"
				>
					Password
				</Label>
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
						<span>Lanjut ke Verifikasi</span>
						<ArrowRight className="h-4 w-4" />
					</div>
				)}
			</Button>
		</form>
	);
}

interface OtpVerificationFormProps {
	maskedEmail: string;
	otpCode: string;
	setOtpCode: (v: string) => void;
	cooldown: number;
	isResending: boolean;
	isLoading: boolean;
	onSubmit: (e: React.FormEvent) => void;
	onResend: () => void;
	onBack: () => void;
}

function OtpVerificationForm({
	maskedEmail,
	otpCode,
	setOtpCode,
	cooldown,
	isResending,
	isLoading,
	onSubmit,
	onResend,
	onBack,
}: OtpVerificationFormProps) {
	return (
		<form
			onSubmit={onSubmit}
			className="space-y-5 animate-in fade-in duration-300"
		>
			<div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-3.5">
				<div className="p-2 bg-[#0517B0]/10 rounded-xl text-[#0517B0] shrink-0 mt-0.5">
					<ShieldCheck className="h-5 w-5" />
				</div>
				<div className="text-xs text-slate-600 leading-relaxed">
					Kode 6-digit telah dikirim ke email:
					<div className="font-semibold text-slate-900 mt-0.5 break-all">
						{maskedEmail || "email terdaftar"}
					</div>
					<span className="text-slate-400 block mt-1">
						Masa berlaku kode: 5 menit.
					</span>
				</div>
			</div>

			<div className="space-y-2">
				<Label
					htmlFor="otpCode"
					className="text-slate-700 font-semibold ml-1 text-sm"
				>
					Kode OTP (6 Digit)
				</Label>
				<div className="relative group">
					<KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-[#0517B0] transition-colors" />
					<Input
						id="otpCode"
						type="text"
						inputMode="numeric"
						maxLength={6}
						autoFocus
						placeholder="000000"
						value={otpCode}
						onChange={(e) => {
							const val = e.target.value.replace(/\D/g, "").slice(0, 6);
							setOtpCode(val);
						}}
						required
						className="pl-11 font-mono tracking-[0.4em] text-center text-xl font-bold bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm text-slate-900 placeholder:text-slate-300 focus-visible:ring-[#0517B0] focus-visible:border-[#0517B0] focus:bg-white h-12 rounded-xl transition-all"
						autoComplete="one-time-code"
					/>
				</div>
			</div>

			<Button
				type="submit"
				disabled={isLoading || otpCode.length < 6}
				className="w-full h-12 bg-gradient-to-r from-[#0517B0] to-blue-700 hover:from-blue-800 hover:to-blue-900 text-white font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(5,23,176,0.4)] hover:shadow-[0_12px_25px_-4px_rgba(5,23,176,0.5)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
			>
				{isLoading ? (
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
						<span>Memverifikasi Kode...</span>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<span>Verifikasi & Masuk</span>
						<ArrowRight className="h-4 w-4" />
					</div>
				)}
			</Button>

			<div className="flex items-center justify-between text-xs pt-1 px-1">
				<span className="text-slate-500">Tidak menerima email?</span>
				{cooldown > 0 ? (
					<span className="text-slate-400 font-medium flex items-center gap-1.5">
						<Clock className="h-3.5 w-3.5 text-slate-400" />
						Kirim ulang ({cooldown}d)
					</span>
				) : (
					<button
						type="button"
						onClick={onResend}
						disabled={isResending}
						className="text-[#0517B0] hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors hover:underline"
					>
						<RefreshCw
							className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`}
						/>
						{isResending ? "Mengirim..." : "Kirim Ulang Kode"}
					</button>
				)}
			</div>

			<div className="pt-2 text-center">
				<button
					type="button"
					onClick={onBack}
					className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1.5 transition-colors"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					<span>Ganti Akun / Kembali ke Login</span>
				</button>
			</div>
		</form>
	);
}

function LoginForm() {
	const [step, setStep] = useState<"credentials" | "otp">("credentials");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	// OTP state disimpan di memori React saja (tidak di localStorage)
	const [tempToken, setTempToken] = useState("");
	const [maskedEmail, setMaskedEmail] = useState("");
	const [otpCode, setOtpCode] = useState("");
	const [cooldown, setCooldown] = useState(0);
	const [isResending, setIsResending] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");

	const [error, setError] = useState("");
	const [isLocked, setIsLocked] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const searchParams = useSearchParams();
	const reason = searchParams.get("reason");

	const router = useRouter();
	const login = useAuthStore((state) => state.login);

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setInterval(() => {
			setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, [cooldown]);

	const handleCredentialsSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccessMessage("");
		setIsLocked(false);

		const cleanEmail = email.trim();
		if (!cleanEmail) {
			setError("Silakan masukkan alamat email atau Gmail Anda.");
			return;
		}
		if (!cleanEmail.includes("@")) {
			setError(
				"Alamat email tidak valid. Login harus menggunakan email (contoh: user@gmail.com), bukan username.",
			);
			return;
		}

		setIsLoading(true);

		try {
			const res = await api.auth.login.post({
				email: cleanEmail,
				username: cleanEmail,
				password,
			} as any);

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

			if (
				res.status === 403 &&
				resData?.code === "EMAIL_VERIFICATION_REQUIRED"
			) {
				setError(resData.message);
				return;
			}

			if (res.error || !resData?.success) {
				const rawMsg = resError?.message || resData?.message;
				let displayMsg = "Email atau password salah.";
				if (typeof rawMsg === "string") {
					if (rawMsg.trim().startsWith("{")) {
						try {
							const parsed = JSON.parse(rawMsg);
							displayMsg =
								parsed?.summary ||
								parsed?.message ||
								"Format data login tidak valid.";
						} catch {
							displayMsg = rawMsg;
						}
					} else {
						displayMsg = rawMsg;
					}
				}
				setError(displayMsg);
				return;
			}

			if (resData.requiresOtp) {
				setTempToken(resData.tempToken);
				setMaskedEmail(resData.maskedEmail);
				setStep("otp");
				setCooldown(60);
				setOtpCode("");
				return;
			}

			if (resData.user) {
				const rawToken = resData.token as string | undefined;
				login(resData.user, rawToken || "");
				if (resData.user.role === "mahasiswa") {
					router.push("/mahasiswa/dashboard");
				} else {
					router.push("/dashboard");
				}
			}
		} catch (_err) {
			setError("Terjadi kesalahan sistem. Silakan coba lagi.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!otpCode || otpCode.trim().length < 6) {
			setError("Masukkan 6 digit kode verifikasi dengan lengkap.");
			return;
		}

		setError("");
		setSuccessMessage("");
		setIsLoading(true);

		try {
			const res = await api.auth["verify-otp"].post({
				tempToken,
				otp: otpCode.trim(),
			});

			const resData = res.data as any;
			const resError = (res.error?.value as any) || resData;

			if (res.error || !resData?.success || !resData?.user) {
				setError(
					resError?.message ||
						resData?.message ||
						"Kode verifikasi salah atau sudah kadaluarsa.",
				);
				if (
					resData?.code === "MAX_ATTEMPTS_EXCEEDED" ||
					resData?.code === "OTP_EXPIRED"
				) {
					setTimeout(() => {
						setStep("credentials");
						setTempToken("");
						setError("Sesi verifikasi telah berakhir. Silakan login kembali.");
					}, 2500);
				}
				return;
			}

			const rawToken = resData.token as string | undefined;
			login(resData.user, rawToken || "");
			if (resData.user.role === "mahasiswa") {
				router.push("/mahasiswa/dashboard");
			} else {
				router.push("/dashboard");
			}
		} catch (_err) {
			setError("Gagal memverifikasi OTP. Silakan coba lagi.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendOtp = async () => {
		if (cooldown > 0 || isResending) return;
		setError("");
		setSuccessMessage("");
		setIsResending(true);

		try {
			const res = await api.auth["resend-otp"].post({
				tempToken,
			});

			const resData = res.data as any;
			const resError = (res.error?.value as any) || resData;

			if (res.error || !resData?.success) {
				setError(
					resError?.message ||
						resData?.message ||
						"Gagal mengirim ulang kode verifikasi.",
				);
				return;
			}

			setCooldown(resData.cooldownSeconds || 60);
			setSuccessMessage(
				resData.message || "Kode verifikasi baru telah dikirimkan ke email.",
			);
		} catch (_err) {
			setError("Gagal menghubungi server untuk kirim ulang OTP.");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans p-4 sm:p-8 relative overflow-hidden">
			{/* Decorative Background Elements */}
			<div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0517B0] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse" />
			<div
				className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"
				style={{ animationDelay: "2s" }}
			/>

			{/* Background Grid */}
			<div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#0517B012_1px,transparent_1px),linear-gradient(to_bottom,#0517B012_1px,transparent_1px)] bg-[size:32px_32px]" />

			{/* Glassmorphism Card */}
			<div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(5,23,176,0.15)] border border-white/60 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-500 ease-out ring-1 ring-slate-900/5">
				{/* Header / Logo */}
				<div className="flex flex-col items-center text-center mb-7">
					<div className="w-20 h-20 flex items-center justify-center mb-4">
						<Image
							src="/logonusadaya.png"
							alt="Logo Nusadaya"
							width={80}
							height={80}
							className="object-contain"
							priority
						/>
					</div>
					<h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
						Nusadaya Academy
					</h1>
					<p className="text-sm font-medium text-slate-500">
						{step === "credentials"
							? "Sistem Terpadu Validasi Mahasiswa"
							: "Verifikasi Keamanan Akun (2FA)"}
					</p>
				</div>

				{/* Idle Timeout Alert Banner */}
				{reason === "idle" && step === "credentials" && (
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

				{/* Success Alert */}
				{successMessage && (
					<Alert className="mb-5 bg-emerald-50/90 border-emerald-200 text-emerald-800 shadow-sm rounded-xl animate-in fade-in duration-300">
						<CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
						<div className="ml-2">
							<AlertTitle className="font-bold text-xs">Berhasil</AlertTitle>
							<AlertDescription className="text-xs mt-0.5 leading-relaxed">
								{successMessage}
							</AlertDescription>
						</div>
					</Alert>
				)}

				{/* Error / Lockout Alert */}
				{error && (
					<Alert
						variant="destructive"
						className={`mb-5 backdrop-blur-sm shadow-sm rounded-xl animate-in fade-in duration-300 ${
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
								{isLocked ? "Akun Dikunci Sementara" : "Perhatian"}
							</AlertTitle>
							<AlertDescription className="text-xs mt-0.5 leading-relaxed">
								{error}
							</AlertDescription>
						</div>
					</Alert>
				)}

				{/* STEP 1: Form Login Email & Password */}
				{step === "credentials" ? (
					<CredentialsForm
						email={email}
						setEmail={setEmail}
						password={password}
						setPassword={setPassword}
						showPassword={showPassword}
						setShowPassword={setShowPassword}
						isLoading={isLoading}
						onSubmit={handleCredentialsSubmit}
					/>
				) : (
					/* STEP 2: Form Verifikasi Kode OTP */
					<OtpVerificationForm
						maskedEmail={maskedEmail}
						otpCode={otpCode}
						setOtpCode={setOtpCode}
						cooldown={cooldown}
						isResending={isResending}
						isLoading={isLoading}
						onSubmit={handleOtpSubmit}
						onResend={handleResendOtp}
						onBack={() => {
							setStep("credentials");
							setTempToken("");
							setError("");
							setSuccessMessage("");
						}}
					/>
				)}

				{/* Footer */}
				<div className="mt-8 text-center text-xs font-medium text-slate-400/80">
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
