"use client";

import {
	AlertTriangle,
	Camera,
	CheckCircle2,
	Compass,
	Eye,
	HelpCircle,
	Loader2,
	MapPin,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	VideoOff,
	X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { API_URL, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";

export interface SelfieCheckinModalProps {
	isOpen: boolean;
	onClose: () => void;
	attendanceType: "baris_pagi" | "kuliah" | "piket" | "ods";
	title?: string;
	subtitle?: string;
	sessionId?: number;
	scheduleId?: number;
	dutyScheduleId?: number;
	studentName?: string;
	studentNim?: string;
	onSuccess?: (data: any) => void;
}

type Step = "CAMERA" | "REVIEW" | "SUBMITTING" | "RESULT";

export function SelfieCheckinModal({
	isOpen,
	onClose,
	attendanceType,
	title,
	subtitle,
	sessionId,
	scheduleId,
	dutyScheduleId,
	studentName = "Mahasiswa",
	studentNim = "-",
	onSuccess,
}: SelfieCheckinModalProps) {
	const [step, setStep] = useState<Step>("CAMERA");
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [gpsStatus, setGpsStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);
	const [coords, setCoords] = useState<{
		latitude: number;
		longitude: number;
		accuracy: number;
	} | null>(null);
	const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
	const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
	const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
	const [isShutterActive, setIsShutterActive] = useState(false);
	const [submissionResult, setSubmissionResult] = useState<any>(null);
	const [liveClock, setLiveClock] = useState("");

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	// Clock timer WIB
	useEffect(() => {
		const update = () => {
			const now = new Date();
			const timeStr = new Intl.DateTimeFormat("id-ID", {
				timeZone: "Asia/Jakarta",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			}).format(now);
			setLiveClock(timeStr.replace(/\./g, ":"));
		};
		update();
		const interval = setInterval(update, 1000);
		return () => clearInterval(interval);
	}, []);

	// Reset state when modal opens
	useEffect(() => {
		if (isOpen) {
			setStep("CAMERA");
			setCameraError(null);
			setGpsStatus("loading");
			setCoords(null);
			setGpsErrorMsg(null);
			setCapturedImageBlob(null);
			setCapturedImageUrl(null);
			setSubmissionResult(null);

			startCamera();
			fetchGPS();
		} else {
			stopCamera();
		}
		return () => {
			stopCamera();
		};
	}, [isOpen]);

	// 1. Camera Initialization
	const startCamera = async () => {
		setCameraError(null);
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error(
					"Browser Anda tidak mendukung akses kamera. Silakan buka melalui Chrome atau Safari.",
				);
			}

			// Coba kamera depan (user facing mode)
			let stream: MediaStream;
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: "user",
						width: { ideal: 1280 },
						height: { ideal: 720 },
					},
					audio: false,
				});
			} catch (frontErr) {
				// Fallback ke kamera default apapun jika facingMode 'user' ditolak
				stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: false,
				});
			}

			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}
		} catch (err: any) {
			console.error("Camera access error:", err);
			setCameraError(
				err?.message ||
					"Izin akses kamera ditolak. Harap izinkan kamera di pengaturan browser Anda.",
			);
		}
	};

	const stopCamera = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	};

	// 2. Geolocation Request
	const fetchGPS = () => {
		setGpsStatus("loading");
		setGpsErrorMsg(null);

		if (!navigator.geolocation) {
			setGpsStatus("error");
			setGpsErrorMsg("Perangkat Anda tidak mendukung fitur Geolocation GPS.");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setCoords({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					accuracy: Math.round(position.coords.accuracy || 10),
				});
				setGpsStatus("success");
			},
			(err) => {
				console.warn("GPS error:", err);
				setGpsStatus("error");
				let msg = "Gagal mendapatkan lokasi GPS.";
				if (err.code === err.PERMISSION_DENIED) {
					msg =
						"Izin lokasi GPS ditolak. Aktifkan GPS/Lokasi di HP Anda lalu izinkan di browser.";
				} else if (err.code === err.TIMEOUT) {
					msg =
						"Waktu pencarian GPS habis. Pastikan Anda berada di area terbuka.";
				}
				setGpsErrorMsg(msg);
			},
			{
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 0,
			},
		);
	};

	// 3. Capture Snapshot & Generate Watermark via HTML5 Canvas
	const handleCapture = () => {
		if (!videoRef.current || !coords) return;

		// Efek shutter flash
		setIsShutterActive(true);
		setTimeout(() => setIsShutterActive(false), 300);

		const video = videoRef.current;
		const canvas = document.createElement("canvas");
		const targetWidth = video.videoWidth || 1280;
		const targetHeight = video.videoHeight || 720;

		canvas.width = targetWidth;
		canvas.height = targetHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// 1. Gambar frame video langsung
		ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

		// 2. Render watermark container di sudut kiri bawah
		const boxHeight = 160;
		const boxY = targetHeight - boxHeight;

		// Gradient overlay gelap
		const gradient = ctx.createLinearGradient(0, boxY - 30, 0, targetHeight);
		gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
		gradient.addColorStop(0.3, "rgba(10, 15, 30, 0.75)");
		gradient.addColorStop(1, "rgba(10, 15, 30, 0.95)");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, boxY - 30, targetWidth, boxHeight + 30);

		// Garis aksen biru/emas Nusadaya
		ctx.fillStyle = "#3B82F6";
		ctx.fillRect(0, targetHeight - 6, targetWidth, 6);

		// Format tanggal & jam
		const now = new Date();
		const dateFormatted = new Intl.DateTimeFormat("id-ID", {
			timeZone: "Asia/Jakarta",
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(now);

		const timeFormatted = new Intl.DateTimeFormat("id-ID", {
			timeZone: "Asia/Jakarta",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		})
			.format(now)
			.replace(/\./g, ":");

		const latStr = coords.latitude.toFixed(6);
		const lonStr = coords.longitude.toFixed(6);

		// Teks Watermark
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";

		// Baris 1: Brand & Sistem
		ctx.font = "bold 20px sans-serif";
		ctx.fillStyle = "#F8FAFC";
		ctx.fillText(
			"NUSADAYA ACADEMY — SISTEM PRESENSI TERVERIFIKASI",
			24,
			boxY + 20,
		);

		// Baris 2: Mahasiswa & NIM
		ctx.font = "600 17px sans-serif";
		ctx.fillStyle = "#60A5FA";
		ctx.fillText(
			`Mahasiswa: ${studentName}  |  NIM: ${studentNim}`,
			24,
			boxY + 50,
		);

		// Baris 3: Waktu WIB
		ctx.font = "15px sans-serif";
		ctx.fillStyle = "#E2E8F0";
		ctx.fillText(
			`Waktu: ${dateFormatted} pukul ${timeFormatted} WIB`,
			24,
			boxY + 80,
		);

		// Baris 4: Koordinat GPS & Akurasi
		ctx.font = "14px monospace";
		ctx.fillStyle = "#94A3B8";
		ctx.fillText(
			`GPS: Lat ${latStr}, Long ${lonStr}  (Akurasi: ±${coords.accuracy}m)`,
			24,
			boxY + 110,
		);

		// Baris 5: Anti-spoofing security tag
		ctx.font = "12px sans-serif";
		ctx.fillStyle = "#22C55E";
		ctx.fillText(`● Validated Device Timestamp: ${Date.now()}`, 24, boxY + 135);

		// 3. Export to Blob (image/jpeg quality 0.85)
		canvas.toBlob(
			(blob) => {
				if (blob) {
					setCapturedImageBlob(blob);
					const previewUrl = URL.createObjectURL(blob);
					setCapturedImageUrl(previewUrl);
					setStep("REVIEW");
					stopCamera();
				}
			},
			"image/jpeg",
			0.85,
		);
	};

	// 4. Retake Photo
	const handleRetake = () => {
		setCapturedImageBlob(null);
		setCapturedImageUrl(null);
		setStep("CAMERA");
		startCamera();
	};

	// 5. Submit Selfie & Location to Server
	const handleSubmit = async () => {
		if (!capturedImageBlob || !coords) return;

		setStep("SUBMITTING");
		const token = getToken();

		try {
			const formData = new FormData();
			formData.append("photo", capturedImageBlob, `selfie_${Date.now()}.jpg`);
			formData.append("latitude", coords.latitude.toString());
			formData.append("longitude", coords.longitude.toString());
			formData.append("accuracy", coords.accuracy.toString());
			formData.append("clientTimestamp", Date.now().toString());

			let endpoint = "";
			if (attendanceType === "baris_pagi") {
				endpoint = `${API_URL}/attendance/baris-pagi/selfie-checkin`;
				if (sessionId) formData.append("sessionId", sessionId.toString());
			} else if (attendanceType === "kuliah") {
				endpoint = `${API_URL}/attendance/kuliah/selfie-checkin`;
				if (scheduleId) formData.append("scheduleId", scheduleId.toString());
			} else if (attendanceType === "piket") {
				endpoint = `${API_URL}/attendance/piket/selfie-checkin`;
				if (dutyScheduleId)
					formData.append("dutyScheduleId", dutyScheduleId.toString());
			} else if (attendanceType === "ods") {
				endpoint = `${API_URL}/attendance/ods/selfie-checkin`;
			}

			const res = await fetch(endpoint, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			const json = await res.json();

			if (res.ok && json.success) {
				toast.success(json.message);
				setSubmissionResult(json);
				setStep("RESULT");
				if (onSuccess) {
					onSuccess(json.data);
				}
			} else {
				setStep("REVIEW");
				toast.error(json.message || "Presensi gagal diproses");
			}
		} catch (err: any) {
			setStep("REVIEW");
			console.error("Submission error:", err);
			toast.error("Gagal mengirim presensi. Periksa koneksi internet Anda.");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className="w-full max-w-lg p-0 overflow-hidden rounded-2xl border-slate-200/90 shadow-2xl bg-white max-h-[92vh] flex flex-col"
				aria-describedby="selfie-checkin-desc"
			>
				{/* Header */}
				<div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
					<div className="flex items-center gap-2.5">
						<div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
							<Camera className="w-5 h-5" />
						</div>
						<div>
							<DialogTitle className="text-sm font-bold text-slate-800">
								{title || "Presensi Selfie & Lokasi GPS"}
							</DialogTitle>
							<p
								id="selfie-checkin-desc"
								className="text-[11px] text-slate-500 font-medium"
							>
								{subtitle || "Arahkan wajah ke kamera dan pastikan GPS aktif"}
							</p>
						</div>
					</div>
					<Badge
						variant="outline"
						className="text-[10px] font-semibold bg-white border-slate-200 text-slate-600 px-2 py-0.5"
					>
						{liveClock} WIB
					</Badge>
				</div>

				{/* Body Content */}
				<div className="p-4 flex-1 overflow-y-auto">
					{/* STEP 1: CAMERA STREAM */}
					{step === "CAMERA" && (
						<div className="space-y-3">
							{cameraError ? (
								<div className="p-6 text-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
									<VideoOff className="w-10 h-10 mx-auto text-rose-500 stroke-[1.5]" />
									<h4 className="font-bold text-sm">
										Kamera Tidak Dapat Diakses
									</h4>
									<p className="text-xs text-rose-600 leading-relaxed max-w-xs mx-auto">
										{cameraError}
									</p>
									<Button
										onClick={startCamera}
										size="sm"
										className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-1.5"
									>
										<RefreshCw className="w-3.5 h-3.5" />
										Coba Buka Kamera Lagi
									</Button>
								</div>
							) : (
								<div className="relative aspect-3/4 sm:aspect-4/3 w-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
									{/* Live Video Element */}
									<video
										ref={videoRef}
										playsInline
										autoPlay
										muted
										className="w-full h-full object-cover transform -scale-x-100"
									/>

									{/* Shutter flash overlay */}
									{isShutterActive && (
										<div className="absolute inset-0 bg-white opacity-80 transition-opacity duration-300 pointer-events-none" />
									)}

									{/* Oval Facial Guide */}
									<div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
										<div className="w-48 h-64 sm:w-56 sm:h-72 border-2 border-dashed border-white/60 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-center justify-center">
											<div className="w-full h-full border border-blue-400/40 rounded-full animate-pulse" />
										</div>
										<p className="mt-3 text-[11px] font-semibold text-white/90 bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
											Posisikan wajah Anda di dalam lingkaran
										</p>
									</div>

									{/* Top Live Badge */}
									<div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
										<span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
										<span>LIVE WEBCAM</span>
									</div>
								</div>
							)}

							{/* GPS Status Card */}
							<div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 text-xs">
								<div className="flex items-center gap-2.5 min-w-0">
									<div
										className={cn(
											"w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
											gpsStatus === "success"
												? "bg-emerald-100 text-emerald-700"
												: gpsStatus === "loading"
													? "bg-amber-100 text-amber-700"
													: "bg-rose-100 text-rose-700",
										)}
									>
										{gpsStatus === "loading" ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<MapPin className="w-4 h-4" />
										)}
									</div>
									<div className="min-w-0">
										<p className="font-semibold text-slate-800 text-xs truncate">
											{gpsStatus === "success"
												? "Lokasi GPS Terkunci"
												: gpsStatus === "loading"
													? "Mencari Titik GPS Satelit..."
													: "GPS Belum Terdeteksi"}
										</p>
										<p className="text-[11px] text-slate-500 truncate">
											{gpsStatus === "success" && coords
												? `Lat: ${coords.latitude.toFixed(4)}, Long: ${coords.longitude.toFixed(4)} (±${coords.accuracy}m)`
												: gpsErrorMsg || "Pastikan lokasi perangkat aktif"}
										</p>
									</div>
								</div>

								{gpsStatus === "error" && (
									<Button
										size="sm"
										variant="outline"
										onClick={fetchGPS}
										className="h-7 text-[11px] px-2 rounded-lg border-slate-300 shrink-0"
									>
										Refresh
									</Button>
								)}
							</div>

							{/* Action Shutter Button */}
							<div className="pt-1">
								<Button
									onClick={handleCapture}
									disabled={!!cameraError || gpsStatus !== "success" || !coords}
									className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
								>
									<Camera className="w-4 h-4" />
									<span>Ambil Foto Selfie & Terverifikasi</span>
								</Button>
								{gpsStatus !== "success" && (
									<p className="text-center text-[11px] text-amber-600 mt-1.5 flex items-center justify-center gap-1 font-medium">
										<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
										Menunggu titik koordinat GPS sebelum foto dapat diambil
									</p>
								)}
							</div>
						</div>
					)}

					{/* STEP 2: PHOTO REVIEW */}
					{step === "REVIEW" && capturedImageUrl && (
						<div className="space-y-4">
							<div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black">
								<img
									src={capturedImageUrl}
									alt="Preview Selfie Absensi"
									className="w-full h-auto object-cover max-h-[380px]"
								/>
								<div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
									<ShieldCheck className="w-3.5 h-3.5" />
									<span>Watermark Terpasang</span>
								</div>
							</div>

							<div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1 text-slate-700">
								<div className="flex items-center gap-2 font-bold text-blue-900">
									<Sparkles className="w-4 h-4 text-blue-600" />
									<span>Data Tersemat Pada Foto:</span>
								</div>
								<p className="text-slate-600 pl-6">
									Mahasiswa:{" "}
									<span className="font-semibold">{studentName}</span> (
									{studentNim})
								</p>
								<p className="text-slate-600 pl-6">
									GPS:{" "}
									<span className="font-semibold">
										{coords?.latitude.toFixed(6)},{" "}
										{coords?.longitude.toFixed(6)}
									</span>{" "}
									(Akurasi ±{coords?.accuracy}m)
								</p>
								<p className="text-slate-600 pl-6">
									Waktu Server:{" "}
									<span className="font-semibold">{liveClock} WIB</span>
								</p>
							</div>

							<div className="grid grid-cols-2 gap-2.5 pt-1">
								<Button
									type="button"
									variant="outline"
									onClick={handleRetake}
									className="h-11 rounded-xl text-slate-700 font-semibold border-slate-300 text-xs"
								>
									Ambil Ulang Foto
								</Button>
								<Button
									type="button"
									onClick={handleSubmit}
									className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
								>
									Kirim Presensi Sekarang
								</Button>
							</div>
						</div>
					)}

					{/* STEP 3: SUBMITTING */}
					{step === "SUBMITTING" && (
						<div className="py-16 text-center space-y-4">
							<div className="relative w-16 h-16 mx-auto flex items-center justify-center">
								<div className="absolute inset-0 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin" />
								<Camera className="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<h4 className="font-bold text-base text-slate-800">
									Mengunggah Bukti Presensi...
								</h4>
								<p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
									Sistem memverifikasi integritas foto, koordinat geolokasi, dan
									mencatat kehadiran Anda.
								</p>
							</div>
						</div>
					)}

					{/* STEP 4: RESULT */}
					{step === "RESULT" && submissionResult && (
						<div className="py-6 text-center space-y-4">
							<div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
								<CheckCircle2 className="w-10 h-10" />
							</div>

							<div className="space-y-1.5">
								<h3 className="font-bold text-lg text-slate-800">
									Presensi Berhasil Dikirim!
								</h3>
								<p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
									{submissionResult.message}
								</p>
							</div>

							{submissionResult.data?.distance !== undefined && (
								<div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold">
									<MapPin className="w-3.5 h-3.5 text-blue-600" />
									<span>
										Jarak ke Titik: {submissionResult.data.distance} meter
									</span>
									{submissionResult.data.isWithinRadius ? (
										<span className="text-emerald-600">(Dalam Area)</span>
									) : (
										<span className="text-amber-600 font-bold">
											(Menunggu Verifikasi)
										</span>
									)}
								</div>
							)}

							<div className="pt-4">
								<Button
									onClick={onClose}
									className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
								>
									Selesai & Tutup
								</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
