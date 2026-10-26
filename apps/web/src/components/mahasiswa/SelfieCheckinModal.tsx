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

// Helper Haversine formula untuk menghitung jarak GPS ke kampus (dalam meter)
function calculateDistanceMeters(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371000;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Math.round(R * c);
}

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
	const [checkpoint, setCheckpoint] = useState<{
		latitude: number;
		longitude: number;
		radiusMeters: number;
		label: string;
		address: string;
	}>({
		latitude: -5.40145,
		longitude: 105.2114,
		radiusMeters: 150,
		label: "Kampus Nusadaya Academy Bandar Lampung",
		address:
			"Jl. Raden Imba Kusuma Ratu, Langkapura, Kec. Langkapura, Kota Bandar Lampung, Lampung 35116",
	});
	const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
	const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
	const [coords, setCoords] = useState<{
		latitude: number;
		longitude: number;
		accuracy: number;
		sourceLabel?: string;
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
	const activeCameraSessionRef = useRef<number>(0);

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
	const stopCamera = () => {
		activeCameraSessionRef.current++;
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			try {
				videoRef.current.pause();
			} catch {}
			videoRef.current.srcObject = null;
		}
	};

	const startCamera = async () => {
		const sessionId = ++activeCameraSessionRef.current;
		setCameraError(null);

		// Hentikan stream lama jika masih ada
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}

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

			// Batalkan jika sesi sudah berganti (misal dialog ditutup atau stopCamera dipanggil)
			if (activeCameraSessionRef.current !== sessionId) {
				stream.getTracks().forEach((track) => track.stop());
				return;
			}

			streamRef.current = stream;

			if (videoRef.current) {
				const video = videoRef.current;
				video.srcObject = stream;

				const playPromise = video.play();
				if (playPromise !== undefined) {
					playPromise.catch((playErr: any) => {
						// AbortError dan NotAllowedError tidak boleh dianggap sebagai fatal camera error
						if (playErr?.name === "AbortError") {
							console.info(
								"[Camera] Play request dihentikan oleh transisi media/lifecycle (normal).",
							);
							return;
						}
						if (playErr?.name === "NotAllowedError") {
							console.warn(
								"[Camera] Autoplay dibatasi browser, menunggu interaksi pengguna.",
							);
							return;
						}
						console.warn("[Camera] Video playback warning:", playErr);
					});
				}
			}
		} catch (err: any) {
			// Jika sesi sudah tidak aktif atau AbortError, abaikan
			if (
				activeCameraSessionRef.current !== sessionId ||
				err?.name === "AbortError"
			) {
				return;
			}

			console.error("[Camera] Camera access error:", err);
			let errorMsg =
				"Izin akses kamera ditolak. Harap izinkan kamera di pengaturan browser Anda.";
			if (
				err?.name === "NotAllowedError" ||
				err?.name === "PermissionDeniedError"
			) {
				errorMsg =
					"Izin akses kamera diblokir oleh browser. Klik ikon kamera atau gembok di URL browser untuk mengizinkan kamera.";
			} else if (
				err?.name === "NotFoundError" ||
				err?.name === "DevicesNotFoundError"
			) {
				errorMsg =
					"Perangkat kamera (webcam) tidak ditemukan pada komputer/HP Anda.";
			} else if (
				err?.name === "NotReadableError" ||
				err?.name === "TrackStartError"
			) {
				errorMsg =
					"Kamera sedang dipakai oleh aplikasi lain (Zoom, Google Meet, OBS, atau tab browser lain). Tutup aplikasi tersebut lalu klik Coba Buka Kamera Lagi.";
			} else if (err?.message) {
				errorMsg = err.message;
			}

			setCameraError(errorMsg);
		}
	};

	// 1. Muat checkpoint aktif kampus
	const loadActiveCheckpoint = async () => {
		try {
			const token = getToken();
			const res = await fetch(
				`${API_URL}/attendance/checkpoint-config/active?type=${attendanceType || "baris_pagi"}`,
				{
					headers: token ? { Authorization: `Bearer ${token}` } : {},
				},
			);
			const json = await res.json();
			if (json?.success && json?.data?.latitude && json?.data?.longitude) {
				const cp = {
					latitude: Number(json.data.latitude),
					longitude: Number(json.data.longitude),
					radiusMeters: Number(json.data.radiusMeters || 150),
					label: json.data.label || "Kampus Nusadaya Academy Bandar Lampung",
					address:
						json.data.notes ||
						"Jl. Raden Imba Kusuma Ratu, Langkapura, Kec. Langkapura, Kota Bandar Lampung, Lampung 35116",
				};
				setCheckpoint(cp);
				return cp;
			}
		} catch (e) {
			console.info("[GPS] Checkpoint load info:", e);
		}
		return checkpoint;
	};

	// 2. Geolocation Request dari Perangkat Pengguna
	const fetchGPS = async () => {
		setGpsStatus("loading");
		setGpsErrorMsg(null);
		setDistanceMeters(null);
		setIsWithinRadius(null);

		const activeCp = (await loadActiveCheckpoint()) || checkpoint;

		// Cek ketersediaan navigator.geolocation
		if (typeof window === "undefined" || !navigator.geolocation) {
			setGpsStatus("error");
			setGpsErrorMsg(
				"Perangkat Anda tidak mendukung fitur Geolocation GPS. Harap buka melalui browser modern di smartphone/laptop Anda.",
			);
			return;
		}

		// Cek koneksi secure context (HTTPS / localhost)
		if (
			!window.isSecureContext &&
			window.location.hostname !== "localhost" &&
			window.location.hostname !== "127.0.0.1"
		) {
			setGpsStatus("error");
			setGpsErrorMsg(
				"Browser membatasi sensor GPS pada koneksi non-HTTPS. Akses sistem melalui HTTPS untuk membaca lokasi.",
			);
			return;
		}

		const queryPosition = (
			opts: PositionOptions,
		): Promise<GeolocationPosition> => {
			return new Promise((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, opts);
			});
		};

		// Cek permission jika didukung browser
		if (navigator.permissions && navigator.permissions.query) {
			try {
				const pStatus = await navigator.permissions.query({
					name: "geolocation",
				});
				if (pStatus.state === "denied") {
					setGpsStatus("error");
					setGpsErrorMsg(
						"Izin lokasi diblokir oleh browser. Klik ikon gembok/setelan situs di samping link URL browser untuk mengizinkan akses Lokasi perangkat Anda.",
					);
					return;
				}
			} catch {
				// Permissions query optional
			}
		}

		try {
			// Tier 1: Coba High Accuracy (Satelit GPS perangkat)
			let pos: GeolocationPosition;
			try {
				pos = await queryPosition({
					enableHighAccuracy: true,
					timeout: 8000,
					maximumAge: 10000,
				});
			} catch (tier1Err: any) {
				if (tier1Err?.code === 1) throw tier1Err;
				// Tier 2: Standard Network / Wi-Fi
				pos = await queryPosition({
					enableHighAccuracy: false,
					timeout: 10000,
					maximumAge: 30000,
				});
			}

			const lat = pos.coords.latitude;
			const lon = pos.coords.longitude;
			const acc = Math.round(pos.coords.accuracy || 15);
			const dist = calculateDistanceMeters(
				lat,
				lon,
				activeCp.latitude,
				activeCp.longitude,
			);
			const inside = dist <= activeCp.radiusMeters;

			setCoords({
				latitude: lat,
				longitude: lon,
				accuracy: acc,
				sourceLabel: "GPS Perangkat Aktif",
			});
			setDistanceMeters(dist);
			setIsWithinRadius(inside);
			setGpsStatus("success");
			setGpsErrorMsg(null);

			if (!inside) {
				toast.error(
					`Perangkat Anda berada di luar radius kampus (${dist} meter dari kampus, batas maksimal ${activeCp.radiusMeters} meter). Presensi hanya dapat dilakukan di dalam area kampus.`,
				);
			}
		} catch (err: any) {
			const errCode = err?.code;
			setGpsStatus("error");
			if (errCode === 1) {
				setGpsErrorMsg(
					"Izin lokasi ditolak oleh browser. Mohon izinkan akses lokasi pada pengaturan browser/perangkat Anda agar sistem dapat membaca posisi Anda.",
				);
			} else if (errCode === 2) {
				setGpsErrorMsg(
					"Sensor lokasi perangkat tidak dapat mendeteksi posisi Anda. Pastikan GPS/Location service pada smartphone/perangkat Anda sudah dinyalakan.",
				);
			} else if (errCode === 3) {
				setGpsErrorMsg(
					"Waktu pencarian sinyal GPS habis. Silakan coba klik Segarkan GPS di area yang tidak terhalang sinyal.",
				);
			} else {
				setGpsErrorMsg("Gagal membaca posisi GPS perangkat Anda.");
			}
		}
	};

	// 3. Capture Snapshot & Generate Watermark via HTML5 Canvas
	const handleCapture = () => {
		if (!videoRef.current || !coords) return;

		// Blokir jika perangkat berada di luar radius kampus
		if (isWithinRadius === false) {
			toast.error(
				`Presensi tidak dapat dilakukan: Posisi perangkat Anda di luar radius kampus (${distanceMeters}m dari kampus, batas maksimal ${checkpoint.radiusMeters}m).`,
			);
			return;
		}

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
			"NUSADAYA ACADEMY BANDAR LAMPUNG — PRESENSI TERVERIFIKASI",
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

		// Baris 5: Anti-spoofing security tag & verifikasi radius kampus
		ctx.font = "12px sans-serif";
		ctx.fillStyle = "#22C55E";
		ctx.fillText(
			`● Terverifikasi di Lingkungan Kampus Bandar Lampung (${distanceMeters ?? 0}m dari titik pusat)`,
			24,
			boxY + 135,
		);

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

		// Validasi ketat geofencing: Blokir pengiriman jika di luar radius kampus
		if (isWithinRadius === false) {
			toast.error(
				`Presensi ditolak: Posisi perangkat Anda berada di luar radius kampus (${distanceMeters}m dari kampus, batas maksimal ${checkpoint.radiusMeters}m).`,
			);
			return;
		}

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
								{subtitle ||
									"Arahkan wajah ke kamera dan pastikan GPS aktif di kampus"}
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
							{/* Target Campus Checkpoint Info */}
							<div className="p-3 rounded-xl border border-blue-100 bg-blue-50/70 flex items-start gap-2.5 text-xs">
								<div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
									<MapPin className="w-4 h-4" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<h5 className="font-bold text-slate-800 text-[11px] truncate">
											{checkpoint.label}
										</h5>
										<Badge
											variant="outline"
											className="text-[9px] px-1.5 py-0 bg-white border-blue-200 text-blue-700 font-semibold shrink-0"
										>
											Radius Maks. {checkpoint.radiusMeters}m
										</Badge>
									</div>
									<p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
										{checkpoint.address}
									</p>
								</div>
							</div>

							{/* Container Video Webcam - Tetap ter-mount di DOM agar tidak memicu AbortError */}
							<div className="relative aspect-3/4 sm:aspect-4/3 w-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
								{/* Live Video Element */}
								<video
									ref={videoRef}
									playsInline
									autoPlay
									muted
									className={cn(
										"w-full h-full object-cover transform -scale-x-100",
										cameraError ? "invisible pointer-events-none" : "block",
									)}
								/>

								{/* Overlay Error Kamera jika gagal */}
								{cameraError && (
									<div className="absolute inset-0 p-6 text-center flex flex-col items-center justify-center bg-rose-50/95 border border-rose-200 text-rose-800 space-y-3 z-20">
										<VideoOff className="w-10 h-10 mx-auto text-rose-500 stroke-[1.5]" />
										<h4 className="font-bold text-sm">
											Kamera Tidak Dapat Diakses
										</h4>
										<p className="text-xs text-rose-600 leading-relaxed max-w-xs mx-auto">
											{cameraError}
										</p>
										<Button
											type="button"
											onClick={() => startCamera()}
											size="sm"
											className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-1.5"
										>
											<RefreshCw className="w-3.5 h-3.5" />
											Coba Buka Kamera Lagi
										</Button>
									</div>
								)}

								{/* Shutter flash overlay */}
								{isShutterActive && !cameraError && (
									<div className="absolute inset-0 bg-white opacity-80 transition-opacity duration-300 pointer-events-none" />
								)}

								{/* Oval Facial Guide */}
								{!cameraError && (
									<div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
										<div className="w-48 h-64 sm:w-56 sm:h-72 border-2 border-dashed border-white/60 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex items-center justify-center">
											<div className="w-full h-full border border-blue-400/40 rounded-full animate-pulse" />
										</div>
										<p className="mt-3 text-[11px] font-semibold text-white/90 bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
											Posisikan wajah Anda di dalam lingkaran
										</p>
									</div>
								)}

								{/* Top Live Badge */}
								{!cameraError && (
									<div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
										<span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
										<span>LIVE WEBCAM</span>
									</div>
								)}
							</div>

							{/* GPS Status Card */}
							<div
								className={cn(
									"p-3.5 rounded-xl border flex flex-col gap-2.5 text-xs transition-colors",
									gpsStatus === "success"
										? isWithinRadius
											? "border-emerald-200 bg-emerald-50/80"
											: "border-rose-300 bg-rose-50/90"
										: gpsStatus === "loading"
											? "border-slate-200 bg-slate-50/90"
											: "border-rose-200 bg-rose-50/80",
								)}
							>
								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-2.5 min-w-0">
										<div
											className={cn(
												"w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
												gpsStatus === "success"
													? isWithinRadius
														? "bg-emerald-100 text-emerald-700"
														: "bg-rose-100 text-rose-700"
													: gpsStatus === "loading"
														? "bg-blue-100 text-blue-700"
														: "bg-rose-100 text-rose-700",
											)}
										>
											{gpsStatus === "loading" ? (
												<Loader2 className="w-4 h-4 animate-spin" />
											) : isWithinRadius ? (
												<CheckCircle2 className="w-4 h-4" />
											) : (
												<AlertTriangle className="w-4 h-4" />
											)}
										</div>
										<div className="min-w-0">
											<div className="flex items-center gap-1.5 flex-wrap">
												<p
													className={cn(
														"font-bold text-xs truncate",
														gpsStatus === "success"
															? isWithinRadius
																? "text-emerald-900"
																: "text-rose-900"
															: "text-slate-800",
													)}
												>
													{gpsStatus === "success"
														? isWithinRadius
															? "Lokasi Valid di Kampus"
															: "Di Luar Radius Kampus"
														: gpsStatus === "loading"
															? "Membaca Lokasi Perangkat..."
															: "Lokasi Belum Terdeteksi"}
												</p>
												{gpsStatus === "success" && (
													<Badge
														variant="outline"
														className={cn(
															"text-[9px] px-1.5 py-0 font-bold",
															isWithinRadius
																? "bg-emerald-100 text-emerald-800 border-emerald-300"
																: "bg-rose-100 text-rose-800 border-rose-300",
														)}
													>
														{isWithinRadius
															? `${distanceMeters}m (Dalam Area)`
															: `${distanceMeters}m (Di Luar Radius)`}
													</Badge>
												)}
											</div>
											<p className="text-[11px] text-slate-600 truncate mt-0.5">
												{gpsStatus === "success" && coords
													? `GPS HP: Lat ${coords.latitude.toFixed(4)}, Long ${coords.longitude.toFixed(4)} (±${coords.accuracy}m)`
													: gpsErrorMsg ||
														"Membaca sensor lokasi GPS perangkat..."}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-1.5 shrink-0">
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => fetchGPS()}
											title="Segarkan posisi GPS perangkat"
											className="h-7 text-[11px] px-2.5 rounded-lg border-slate-300 gap-1"
										>
											<RefreshCw className="w-3 h-3" />
											Segarkan
										</Button>
									</div>
								</div>

								{/* Warning jika berada di luar radius kampus */}
								{gpsStatus === "success" && !isWithinRadius && (
									<div className="p-2.5 rounded-lg bg-rose-100/80 border border-rose-300 text-[11px] text-rose-900 flex items-start gap-2">
										<AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
										<div className="flex-1 space-y-1">
											<p className="font-bold">
												Presensi Tidak Dapat Dilakukan di Luar Kampus!
											</p>
											<p className="leading-relaxed">
												Perangkat Anda saat ini terdeteksi berada{" "}
												<strong>{distanceMeters} meter</strong> dari kampus
												(Batas radius maksimal diperbolehkan:{" "}
												<strong>{checkpoint.radiusMeters} meter</strong>).
												Presensi wajib dilakukan secara langsung di lingkungan
												Kampus Nusadaya Academy Bandar Lampung.
											</p>
										</div>
									</div>
								)}

								{/* Error jika GPS gagal dibaca */}
								{gpsStatus === "error" && gpsErrorMsg && (
									<div className="p-2.5 rounded-lg bg-rose-50/90 border border-rose-200/80 text-[11px] text-rose-800 flex items-start gap-2">
										<AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
										<div className="flex-1 space-y-1">
											<p className="font-medium leading-relaxed">
												{gpsErrorMsg}
											</p>
											<p className="text-slate-600">
												Pastikan GPS perangkat Anda aktif dan Anda telah
												mengizinkan akses lokasi pada browser untuk melanjutkan
												presensi.
											</p>
										</div>
									</div>
								)}
							</div>

							{/* Action Shutter Button */}
							<div className="pt-1">
								<Button
									onClick={handleCapture}
									disabled={
										!!cameraError ||
										gpsStatus !== "success" ||
										!coords ||
										isWithinRadius === false
									}
									className={cn(
										"w-full h-12 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm",
										isWithinRadius === false
											? "bg-rose-100 text-rose-700 hover:bg-rose-100 border border-rose-300 cursor-not-allowed opacity-90"
											: "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50",
									)}
								>
									<Camera className="w-4 h-4" />
									<span>
										{isWithinRadius === false
											? "Presensi Diblokir (Di Luar Radius Kampus)"
											: gpsStatus === "loading"
												? "Membaca Lokasi Perangkat..."
												: "Ambil Foto Selfie & Terverifikasi"}
									</span>
								</Button>
								{gpsStatus !== "success" && (
									<p className="text-center text-[11px] text-amber-600 mt-1.5 flex items-center justify-center gap-1 font-medium">
										<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
										Menunggu titik koordinat GPS sebelum foto dapat diambil
									</p>
								)}
								{gpsStatus === "success" && isWithinRadius === false && (
									<p className="text-center text-[11px] text-rose-600 mt-1.5 flex items-center justify-center gap-1 font-semibold">
										<AlertTriangle className="w-3.5 h-3.5 shrink-0" />
										Anda harus berada di lingkungan kampus untuk mengambil foto
										absen
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
									Lokasi Kampus:{" "}
									<span className="font-semibold">{checkpoint.label}</span>
								</p>
								<p className="text-slate-600 pl-6">
									GPS Perangkat:{" "}
									<span className="font-semibold">
										{coords?.latitude.toFixed(6)},{" "}
										{coords?.longitude.toFixed(6)}
									</span>{" "}
									(Akurasi ±{coords?.accuracy}m)
								</p>
								<p className="text-slate-600 pl-6">
									Jarak ke Kampus:{" "}
									<span className="font-semibold text-emerald-700">
										{distanceMeters} meter
									</span>{" "}
									(Memenuhi radius batas ≤ {checkpoint.radiusMeters}m)
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
									disabled={isWithinRadius === false}
									className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
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
