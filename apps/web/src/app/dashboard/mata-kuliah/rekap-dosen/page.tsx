"use client";

import {
	ArrowLeft,
	BookOpen,
	Calendar,
	Check,
	CheckCircle2,
	ChevronDown,
	Edit,
	FileText,
	GraduationCap,
	Loader2,
	RotateCcw,
	Save,
	Sparkles,
	UserCheck,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { API_URL, getToken } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

type CourseOption = {
	id: number;
	code: string;
	name: string;
	sks: number;
	rombel: string;
	cohort: number;
	type: "teori" | "praktik";
	dosenId: number;
	dosen: { id: number; fullName: string };
	dosenPendampingId: number | null;
	dosenPendamping: { id: number; fullName: string } | null;
};

type MeetingItem = {
	id: number;
	meetingNumber: number;
	meetingType: string;
	meetingLabel: string;
	sessionType: "teori" | "praktik" | "keduanya" | null;
	meetingDate: string | null;
	description: string | null;
	dosenPengajarId: number | null;
	attendedDosenIds: number[] | null;
	isTeamTeachingAttended: boolean | null;
	teachingStatus: string | null;
	teachingNotes: string | null;
	dosenPengajar?: { id: number; fullName: string } | null;
};

export default function PresensiMengajarDosenPage() {
	const { user, hasHydrated } = useAuthStore();

	const [coursesList, setCoursesList] = useState<CourseOption[]>([]);
	const [isLoadingCourses, setIsLoadingCourses] = useState(false);
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

	const [courseMeetings, setCourseMeetings] = useState<MeetingItem[]>([]);
	const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);

	// Modal Edit / Input Absen Pertemuan
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isSavingMeeting, setIsSavingMeeting] = useState(false);
	const [selectedMeetingItem, setSelectedMeetingItem] =
		useState<MeetingItem | null>(null);

	const [meetingForm, setMeetingForm] = useState({
		meetingId: 0,
		meetingNumber: 1,
		meetingLabel: "",
		date: "",
		sessionType: "teori" as "teori" | "praktik" | "keduanya",
		teachingStatus: "terlaksana" as
			| "terlaksana"
			| "jadwal_ulang"
			| "dibatalkan",
		description: "",
		teachingNotes: "",
	});

	const fetchApi = async (url: string, options: RequestInit = {}) => {
		const token = getToken();
		const headers: HeadersInit = { "Content-Type": "application/json" };
		if (token) headers["Authorization"] = `Bearer ${token}`;
		const res = await fetch(`${API_URL}${url}`, {
			...options,
			headers: { ...headers, ...(options.headers || {}) },
		});
		return res;
	};

	// Selected course object
	const selectedCourse = useMemo(() => {
		return coursesList.find((c) => c.id === selectedCourseId) || null;
	}, [coursesList, selectedCourseId]);

	// Fetch courses for Lecturer
	const fetchCourses = async () => {
		setIsLoadingCourses(true);
		try {
			const res = await fetchApi("/courses");
			const json = await res.json();
			if (res.ok && json.success) {
				const list: CourseOption[] = json.data || [];
				setCoursesList(list);
				if (list.length > 0 && !selectedCourseId) {
					setSelectedCourseId(list[0].id);
				}
			} else {
				toast.error(json.message || "Gagal memuat mata kuliah");
			}
		} catch (err: any) {
			toast.error("Gagal memuat daftar mata kuliah");
		} finally {
			setIsLoadingCourses(false);
		}
	};

	// Select meeting and populate form
	const selectMeetingForEdit = (
		meet: MeetingItem,
		courseObj?: CourseOption | null,
	) => {
		const targetCourse = courseObj || selectedCourse;
		setSelectedMeetingItem(meet);

		setMeetingForm({
			meetingId: meet.id,
			meetingNumber: meet.meetingNumber,
			meetingLabel: meet.meetingLabel,
			date: meet.meetingDate ? meet.meetingDate.split("T")[0] : "",
			sessionType: (meet.sessionType || targetCourse?.type || "teori") as any,
			teachingStatus: (meet.teachingStatus as any) || "terlaksana",
			description: meet.description || "",
			teachingNotes: meet.teachingNotes || "",
		});
	};

	// Open modal for editing session attendance
	const handleOpenEditModal = (meet: MeetingItem) => {
		selectMeetingForEdit(meet);
		setIsEditModalOpen(true);
	};

	// Fetch meetings for selected course
	const fetchMeetings = async (courseId: number) => {
		setIsLoadingMeetings(true);
		try {
			const res = await fetchApi(`/courses/${courseId}/meetings`);
			const json = await res.json();
			if (res.ok && json.success) {
				const meets: MeetingItem[] = (json.data || []).filter(
					(m: any) => m.meetingNumber >= 1 && m.meetingNumber <= 16,
				);
				meets.sort((a, b) => a.meetingNumber - b.meetingNumber);
				setCourseMeetings(meets);
			} else {
				toast.error(json.message || "Gagal memuat jadwal pertemuan");
			}
		} catch {
			toast.error("Gagal memuat rincian sesi pertemuan");
		} finally {
			setIsLoadingMeetings(false);
		}
	};

	// When course changes, fetch its meetings
	useEffect(() => {
		if (selectedCourseId) {
			fetchMeetings(selectedCourseId);
		}
	}, [selectedCourseId]);

	// Real-time synchronization listener across tabs/panels
	useEffect(() => {
		const handleAttendanceSync = () => {
			if (selectedCourseId) {
				fetchMeetings(selectedCourseId);
			}
		};

		window.addEventListener("attendance-updated", handleAttendanceSync);
		return () => {
			window.removeEventListener("attendance-updated", handleAttendanceSync);
		};
	}, [selectedCourseId]);

	// Initial data loading
	useEffect(() => {
		if (hasHydrated && user) {
			fetchCourses();
		}
	}, [hasHydrated, user]);

	// Save Absensi Sesi inside Modal (otomatis sesuai akun dosen yang login)
	const handleSaveAttendance = async () => {
		if (!selectedCourse || !meetingForm.meetingId) {
			toast.error("Pilih pertemuan yang akan diabsen terlebih dahulu");
			return;
		}

		setIsSavingMeeting(true);
		try {
			const patchPayload = {
				meetingLabel: meetingForm.meetingLabel,
				sessionType: meetingForm.sessionType || null,
				meetingDate: meetingForm.date || undefined,
				description: meetingForm.description || null,
				teachingStatus: meetingForm.teachingStatus || "terlaksana",
				teachingNotes: meetingForm.teachingNotes || null,
			};

			const res = await fetchApi(
				`/courses/${selectedCourse.id}/meetings/${meetingForm.meetingId}`,
				{
					method: "PATCH",
					body: JSON.stringify(patchPayload),
				},
			);
			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.message || "Gagal menyimpan absensi dosen");
			}

			toast.success(
				`Presensi mengajar Pertemuan ${meetingForm.meetingNumber} berhasil disimpan!`,
			);

			// Close modal
			setIsEditModalOpen(false);

			// Refresh meetings
			await fetchMeetings(selectedCourse.id);

			// Dispatch real-time event for other panels
			window.dispatchEvent(
				new CustomEvent("attendance-updated", {
					detail: {
						courseId: selectedCourse.id,
						meetingId: meetingForm.meetingId,
					},
				}),
			);
		} catch (err: any) {
			toast.error(err.message || "Gagal menyimpan absensi dosen");
		} finally {
			setIsSavingMeeting(false);
		}
	};

	// Statistics for active selected course
	const courseStats = useMemo(() => {
		if (!courseMeetings.length) {
			return { terlaksana: 0, tunggal: 0, teamTeaching: 0, kehadiranSaya: 0 };
		}
		const currentUserId = user?.id ? Number(user.id) : null;
		const terlaksana = courseMeetings.filter(
			(m) =>
				m.teachingStatus === "terlaksana" ||
				Boolean(m.dosenPengajarId) ||
				(Array.isArray(m.attendedDosenIds) && m.attendedDosenIds.length > 0),
		).length;
		const teamTeaching = courseMeetings.filter(
			(m) =>
				Boolean(m.isTeamTeachingAttended) ||
				(Array.isArray(m.attendedDosenIds) && m.attendedDosenIds.length > 1),
		).length;
		const tunggal = Math.max(0, terlaksana - teamTeaching);

		const kehadiranSaya = courseMeetings.filter((m) => {
			const attended =
				Array.isArray(m.attendedDosenIds) && m.attendedDosenIds.length > 0
					? m.attendedDosenIds
					: m.dosenPengajarId
						? [m.dosenPengajarId]
						: [];
			return currentUserId ? attended.includes(currentUserId) : false;
		}).length;

		return { terlaksana, tunggal, teamTeaching, kehadiranSaya };
	}, [courseMeetings, user]);

	return (
		<div className="space-y-6 max-w-7xl mx-auto pb-12">
			{/* Top Header Navigation */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
				<div>
					<div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
						<Link
							href="/dashboard/mata-kuliah"
							className="hover:text-blue-600 transition flex items-center gap-1"
						>
							<BookOpen className="w-3.5 h-3.5" /> Mata Kuliah
						</Link>
						<span>/</span>
						<span className="font-semibold text-slate-800">
							Presensi Mengajar
						</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
						Presensi Mengajar Perkuliahan
						<Badge className="bg-purple-100 text-purple-800 border-purple-300 font-bold px-2.5 py-0.5 text-xs shadow-2xs">
							<Users className="w-3.5 h-3.5 mr-1 inline" /> Team Teaching &
							Mandiri
						</Badge>
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						Pencatatan kehadiran mengajar mandiri (Tunggal & Team Teaching)
						serta pengisian jurnal materi perkuliahan per sesi.
					</p>
				</div>

				<div className="flex items-center gap-2.5 flex-wrap">
					{/* Link to Academic Absensi Dosen for staff if accessible */}
					{(user?.roles?.includes("akademik") ||
						user?.roles?.includes("superadmin")) && (
						<Link href="/dashboard/akademik/absensi-dosen">
							<Button
								variant="outline"
								size="sm"
								className="h-9 border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-purple-800 text-xs gap-1.5 font-semibold shadow-xs"
							>
								<UserCheck className="w-3.5 h-3.5 text-purple-600" />
								Monitoring Absensi Dosen →
							</Button>
						</Link>
					)}
					<Link href="/dashboard/mata-kuliah">
						<Button
							variant="outline"
							size="sm"
							className="h-9 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-xs"
						>
							<ArrowLeft className="w-4 h-4 mr-1.5" /> Silabus & Nilai Mahasiswa
						</Button>
					</Link>
				</div>
			</div>

			{/* Course Selector & Info Card */}
			<Card className="border-slate-200 shadow-xs bg-white">
				<CardContent className="p-5 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
						<div className="md:col-span-2 space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Mata Kuliah Diampu
							</Label>
							<Select
								value={selectedCourseId ? selectedCourseId.toString() : ""}
								onValueChange={(val) => setSelectedCourseId(Number(val))}
								disabled={isLoadingCourses || coursesList.length === 0}
							>
								<SelectTrigger className="h-10 border-slate-300 bg-white font-semibold text-slate-800 text-sm">
									<SelectValue placeholder="Pilih mata kuliah...">
										{selectedCourse
											? `[${selectedCourse.code}] ${selectedCourse.name} - ${selectedCourse.rombel || "Semua Rombel"} (${selectedCourse.sks} SKS, Angk. ${selectedCourse.cohort})`
											: "Pilih mata kuliah..."}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className="max-h-80">
									{coursesList.map((c) => (
										<SelectItem key={c.id} value={c.id.toString()}>
											<div className="flex items-center gap-2 py-0.5 text-left">
												<span className="font-bold text-blue-700">
													[{c.code}]
												</span>
												<span className="font-semibold text-slate-900">
													{c.name}
												</span>
												<span className="text-slate-500 text-xs">
													- {c.rombel || "Semua Rombel"} ({c.sks} SKS, Angk.{" "}
													{c.cohort})
												</span>
												{c.dosenPendamping && (
													<span className="ml-1 px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[10px] font-semibold border border-purple-200">
														Team Teaching
													</span>
												)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Direct link to Course details for syllabus / student grades */}
						{selectedCourse && (
							<div className="flex flex-col justify-end pt-2 sm:pt-5">
								<Link
									href={`/dashboard/mata-kuliah/${selectedCourse.id}`}
									className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition shadow-2xs"
								>
									<BookOpen className="w-3.5 h-3.5" />
									Buka Silabus & Nilai Mahasiswa →
								</Link>
							</div>
						)}
					</div>

					{/* Course Details Compact Banner */}
					{selectedCourse && (
						<div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div className="space-y-1">
								<div className="flex items-center gap-2 flex-wrap">
									<span className="font-bold text-base text-slate-900">
										{selectedCourse.name}
									</span>
									<Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs">
										{selectedCourse.code}
									</Badge>
									<Badge
										variant="outline"
										className="border-slate-300 text-slate-700 font-semibold text-xs"
									>
										{selectedCourse.sks} SKS
									</Badge>
									<Badge
										variant="outline"
										className="border-purple-200 bg-purple-50 text-purple-700 font-semibold text-xs"
									>
										{selectedCourse.rombel}
									</Badge>
								</div>
								<div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
									<span>Dosen Utama:</span>
									<span className="font-semibold text-slate-800">
										{selectedCourse.dosen?.fullName || "-"}
									</span>
									{selectedCourse.dosenPendamping && (
										<>
											<span className="text-slate-300">•</span>
											<span>Dosen Pendamping:</span>
											<span className="font-bold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200 text-xs">
												👥 {selectedCourse.dosenPendamping.fullName} (Team
												Teaching)
											</span>
										</>
									)}
								</div>
							</div>

							{/* Progress stats */}
							<div className="flex items-center gap-3 shrink-0 text-xs flex-wrap">
								<div className="bg-white border border-slate-200 px-3.5 py-2 rounded-lg text-center shadow-2xs">
									<span className="text-slate-500 block text-2xs uppercase font-semibold">
										Total Terlaksana
									</span>
									<span className="font-extrabold text-emerald-700 text-sm">
										{courseStats.terlaksana} / 16 Sesi
									</span>
								</div>
								<div className="bg-white border border-blue-200 px-3.5 py-2 rounded-lg text-center shadow-2xs">
									<span className="text-blue-600 block text-2xs uppercase font-semibold">
										Kehadiran Anda
									</span>
									<span className="font-extrabold text-blue-700 text-sm">
										{courseStats.kehadiranSaya} Sesi
									</span>
								</div>
								{selectedCourse.dosenPendamping && (
									<div className="bg-white border border-purple-200 px-3.5 py-2 rounded-lg text-center shadow-2xs">
										<span className="text-purple-600 block text-2xs uppercase font-semibold">
											Team Teaching
										</span>
										<span className="font-extrabold text-purple-800 text-sm">
											{courseStats.teamTeaching} Sesi
										</span>
									</div>
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Tabel Daftar 16 Sesi & Jurnal Mengajar */}
			<Card className="border-slate-200 shadow-xs bg-white">
				<CardHeader className="p-4 pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<div>
						<CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
							<FileText className="w-4 h-4 text-blue-600" />
							Daftar 16 Pertemuan Perkuliahan
						</CardTitle>
						<CardDescription className="text-xs text-slate-500">
							Klik tombol <strong>"Isi Absen"</strong> atau{" "}
							<strong>"Edit"</strong> pada sesi pertemuan untuk mencatat
							kehadiran mengajar & jurnal materi.
						</CardDescription>
					</div>
					<Badge
						variant="outline"
						className="border-slate-300 text-slate-700 font-semibold text-xs self-start sm:self-auto"
					>
						16 Sesi Lengkap • UTS (P8) • UAS (P16)
					</Badge>
				</CardHeader>
				<CardContent className="p-0">
					{isLoadingMeetings ? (
						<div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
							<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
							<p className="text-xs">Memuat daftar pertemuan...</p>
						</div>
					) : courseMeetings.length === 0 ? (
						<div className="py-12 text-center text-slate-400 text-sm">
							Tidak ada sesi pertemuan yang ditemukan untuk mata kuliah ini.
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-slate-50/70 text-xs">
									<TableRow>
										<TableHead className="w-16 text-center font-bold">
											Sesi
										</TableHead>
										<TableHead className="min-w-40 font-bold">
											Label Pertemuan
										</TableHead>
										<TableHead className="min-w-28 font-bold">
											Tanggal
										</TableHead>
										<TableHead className="min-w-24 font-bold">
											Jenis Sesi
										</TableHead>
										<TableHead className="min-w-44 font-bold">
											Dosen Pengajar
										</TableHead>
										<TableHead className="min-w-28 font-bold">
											Status Perkuliahan
										</TableHead>
										<TableHead className="min-w-56 font-bold">
											Materi & Catatan Jurnal
										</TableHead>
										<TableHead className="w-28 text-right font-bold pr-5">
											Aksi
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody className="text-xs divide-y divide-slate-100">
									{courseMeetings.map((meet) => {
										const isUts = meet.meetingNumber === 8;
										const isUas = meet.meetingNumber === 16;
										const isAttended =
											meet.teachingStatus === "terlaksana" ||
											Boolean(meet.dosenPengajarId);

										return (
											<TableRow
												key={meet.id}
												className="hover:bg-slate-50/70 transition-colors"
											>
												<TableCell className="text-center">
													<span className="font-extrabold text-slate-800 text-sm">
														P{meet.meetingNumber}
													</span>
													{isUts && (
														<span className="block text-[9px] font-bold text-amber-800 bg-amber-100 rounded px-1 mt-0.5">
															UTS
														</span>
													)}
													{isUas && (
														<span className="block text-[9px] font-bold text-rose-800 bg-rose-100 rounded px-1 mt-0.5">
															UAS
														</span>
													)}
												</TableCell>
												<TableCell className="font-semibold text-slate-800">
													{meet.meetingLabel}
												</TableCell>
												<TableCell className="text-slate-600">
													{meet.meetingDate ? (
														new Date(meet.meetingDate).toLocaleDateString(
															"id-ID",
															{
																day: "numeric",
																month: "short",
																year: "numeric",
															},
														)
													) : (
														<span className="text-slate-400 italic">
															Belum diatur
														</span>
													)}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={`capitalize text-2xs px-2 py-0.5 ${
															meet.sessionType === "praktik"
																? "bg-amber-50 text-amber-800 border-amber-300"
																: "bg-blue-50 text-blue-800 border-blue-300"
														}`}
													>
														{meet.sessionType || "teori"}
													</Badge>
												</TableCell>
												<TableCell>
													{(() => {
														const attendedIds: number[] =
															Array.isArray(meet.attendedDosenIds) &&
															meet.attendedDosenIds.length > 0
																? meet.attendedDosenIds
																: meet.dosenPengajarId
																	? [meet.dosenPengajarId]
																	: [];

														const currentUserId = user?.id
															? Number(user.id)
															: null;
														const isTeamTeaching =
															Boolean(meet.isTeamTeachingAttended) ||
															attendedIds.length > 1;
														const isAttendedByMe = currentUserId
															? attendedIds.includes(currentUserId)
															: false;

														const mainDosenId =
															selectedCourse?.dosenId ||
															selectedCourse?.dosen?.id;
														const coDosenId =
															selectedCourse?.dosenPendampingId ||
															selectedCourse?.dosenPendamping?.id;

														const isUserMain = currentUserId === mainDosenId;
														const partnerId = isUserMain
															? coDosenId
															: mainDosenId;
														const partnerName = isUserMain
															? selectedCourse?.dosenPendamping?.fullName ||
																"Dosen Pendamping"
															: selectedCourse?.dosen?.fullName ||
																"Dosen Utama";

														const isPartnerAttended = partnerId
															? attendedIds.includes(partnerId)
															: false;

														if (isTeamTeaching) {
															return (
																<Badge className="bg-purple-100 text-purple-900 border-purple-300 text-2xs font-bold py-0.5 px-2 shadow-2xs">
																	<Users className="w-3 h-3 mr-1 inline text-purple-700" />{" "}
																	Keduanya Hadir (Team Teaching)
																</Badge>
															);
														}

														if (attendedIds.length > 0) {
															if (isAttendedByMe) {
																return (
																	<Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-2xs font-semibold py-0.5 px-2">
																		<Check className="w-3 h-3 mr-1 inline text-emerald-600" />{" "}
																		Anda (Tunggal)
																	</Badge>
																);
															}
															if (isPartnerAttended) {
																return (
																	<Badge className="bg-sky-50 text-sky-800 border-sky-300 text-2xs font-medium py-0.5 px-2">
																		<UserCheck className="w-3 h-3 mr-1 inline text-sky-600" />{" "}
																		{partnerName} (Tunggal)
																	</Badge>
																);
															}
															const fallbackName =
																meet.dosenPengajar?.fullName ||
																(mainDosenId &&
																attendedIds.includes(mainDosenId)
																	? selectedCourse?.dosen?.fullName
																	: selectedCourse?.dosenPendamping
																			?.fullName) ||
																"Dosen Pengajar";
															return (
																<span className="font-semibold text-slate-800 text-xs">
																	{fallbackName} (Tunggal)
																</span>
															);
														}

														return (
															<span className="text-slate-400 italic text-xs">
																Belum ada absensi
															</span>
														);
													})()}
												</TableCell>
												<TableCell>
													<Badge
														className={cn(
															"text-2xs font-semibold px-2 py-0.5 capitalize",
															meet.teachingStatus === "terlaksana"
																? "bg-emerald-100 text-emerald-800 border-emerald-200"
																: meet.teachingStatus === "jadwal_ulang"
																	? "bg-amber-100 text-amber-800 border-amber-200"
																	: meet.teachingStatus === "dibatalkan"
																		? "bg-rose-100 text-rose-800 border-rose-200"
																		: "bg-slate-100 text-slate-600 border-slate-200",
														)}
													>
														{meet.teachingStatus || "Belum Diisi"}
													</Badge>
												</TableCell>
												<TableCell className="text-slate-600 max-w-xs">
													{meet.description ? (
														<p className="font-medium text-slate-800 line-clamp-1">
															{meet.description}
														</p>
													) : null}
													{meet.teachingNotes ? (
														<p className="text-2xs text-slate-500 italic line-clamp-1 mt-0.5">
															{meet.teachingNotes}
														</p>
													) : !meet.description ? (
														<span className="text-slate-400 italic">-</span>
													) : null}
												</TableCell>
												<TableCell className="text-right pr-5">
													{(() => {
														const attendedIds: number[] =
															Array.isArray(meet.attendedDosenIds) &&
															meet.attendedDosenIds.length > 0
																? meet.attendedDosenIds
																: meet.dosenPengajarId
																	? [meet.dosenPengajarId]
																	: [];
														const currentUserId = user?.id
															? Number(user.id)
															: null;
														const isAttendedByMe = currentUserId
															? attendedIds.includes(currentUserId)
															: false;
														const isUserMain =
															currentUserId ===
															(selectedCourse?.dosenId ||
																selectedCourse?.dosen?.id);
														const partnerId = isUserMain
															? selectedCourse?.dosenPendampingId ||
																selectedCourse?.dosenPendamping?.id
															: selectedCourse?.dosenId ||
																selectedCourse?.dosen?.id;
														const isPartnerAttended = partnerId
															? attendedIds.includes(partnerId)
															: false;

														if (isAttendedByMe) {
															return (
																<Button
																	variant="outline"
																	size="sm"
																	className="h-8 text-xs border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-semibold shadow-2xs"
																	onClick={() => handleOpenEditModal(meet)}
																>
																	<Edit className="w-3.5 h-3.5 mr-1 text-blue-600" />{" "}
																	Edit Absensi
																</Button>
															);
														}

														if (isPartnerAttended) {
															return (
																<Button
																	size="sm"
																	className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs gap-1"
																	onClick={() => handleOpenEditModal(meet)}
																>
																	<Users className="w-3.5 h-3.5" /> Ikut Hadir
																</Button>
															);
														}

														return (
															<Button
																size="sm"
																className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs"
																onClick={() => handleOpenEditModal(meet)}
															>
																<UserCheck className="w-3.5 h-3.5 mr-1" /> Isi
																Absen
															</Button>
														);
													})()}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Modal Dialog Input/Edit Absensi Pertemuan */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader className="border-b border-slate-100 pb-3">
						<div className="flex items-center gap-2">
							<Badge className="bg-blue-600 text-white font-bold text-xs">
								Pertemuan {meetingForm.meetingNumber}
							</Badge>
							<DialogTitle className="text-lg font-bold text-slate-900">
								{meetingForm.meetingLabel ||
									`Pertemuan ${meetingForm.meetingNumber}`}
							</DialogTitle>
						</div>
						{selectedCourse && (
							<DialogDescription className="text-xs text-slate-500 mt-1">
								Mata Kuliah:{" "}
								<strong>
									[{selectedCourse.code}] {selectedCourse.name}
								</strong>{" "}
								• Kelas {selectedCourse.rombel} ({selectedCourse.sks} SKS)
							</DialogDescription>
						)}
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{/* Tanggal Pelaksanaan */}
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Tanggal Pelaksanaan Mengajar
								</Label>
								<Input
									type="date"
									className="h-9 border-slate-300 bg-white text-sm"
									value={meetingForm.date}
									onChange={(e) =>
										setMeetingForm({ ...meetingForm, date: e.target.value })
									}
								/>
							</div>

							{/* Jenis Sesi */}
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-slate-700">
									Jenis Sesi Perkuliahan
								</Label>
								<Select
									value={meetingForm.sessionType}
									onValueChange={(val: any) =>
										setMeetingForm({ ...meetingForm, sessionType: val })
									}
								>
									<SelectTrigger className="h-9 border-slate-300 bg-white text-sm">
										<SelectValue placeholder="Pilih jenis sesi">
											{meetingForm.sessionType === "praktik"
												? "Praktik"
												: meetingForm.sessionType === "keduanya"
													? "Teori & Praktik"
													: "Teori"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="teori">Teori</SelectItem>
										<SelectItem value="praktik">Praktik</SelectItem>
										<SelectItem value="keduanya">Teori & Praktik</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Info Akun Pengajar (Login Otomatis) & Status Hadir Bersama */}
						{(() => {
							const currentUserId = user?.id ? Number(user.id) : null;
							const mainDosenId =
								selectedCourse?.dosenId || selectedCourse?.dosen?.id;
							const coDosenId =
								selectedCourse?.dosenPendampingId ||
								selectedCourse?.dosenPendamping?.id;

							const isUserMain = currentUserId === mainDosenId;
							const isUserCo = currentUserId === coDosenId;

							const hasPartner = Boolean(coDosenId);
							const partner = isUserMain
								? selectedCourse?.dosenPendamping
								: selectedCourse?.dosen;
							const partnerId = partner?.id;
							const partnerName = partner?.fullName || "Mitra Dosen";

							const attendedIds: number[] =
								Array.isArray(selectedMeetingItem?.attendedDosenIds) &&
								selectedMeetingItem.attendedDosenIds.length > 0
									? selectedMeetingItem.attendedDosenIds
									: selectedMeetingItem?.dosenPengajarId
										? [selectedMeetingItem.dosenPengajarId]
										: [];

							const isAttendedByMe = currentUserId
								? attendedIds.includes(currentUserId)
								: false;
							const isPartnerAttended = partnerId
								? attendedIds.includes(partnerId)
								: false;
							const isTeamTeachingActive =
								Boolean(selectedMeetingItem?.isTeamTeachingAttended) ||
								attendedIds.length > 1;

							return (
								<div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-4 space-y-3">
									<div className="flex items-center justify-between flex-wrap gap-2">
										<div className="flex items-center gap-2.5">
											<div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs ring-2 ring-white">
												{user?.fullName?.charAt(0) ||
													user?.username?.charAt(0) ||
													"D"}
											</div>
											<div>
												<p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
													Dosen Pengajar (Akun Login)
												</p>
												<p className="text-sm font-bold text-slate-900 leading-tight">
													{user?.fullName || user?.username || "Dosen Pengajar"}
												</p>
											</div>
										</div>
										<Badge
											variant="outline"
											className={cn(
												"text-xs font-semibold px-2.5 py-0.5",
												isUserCo
													? "bg-purple-50 text-purple-800 border-purple-200"
													: "bg-blue-50 text-blue-800 border-blue-200",
											)}
										>
											{isUserCo
												? "Dosen Pendamping"
												: isUserMain
													? "Dosen Utama"
													: "Dosen Pengajar"}
										</Badge>
									</div>

									<p className="text-xs text-slate-600 leading-relaxed">
										Sistem secara otomatis merekam absensi perkuliahan sesuai
										dengan akun dosen yang login. Masing-masing dosen hanya
										menginput presensi untuk dirinya sendiri.
									</p>

									{/* Banner Status Hadir Bersama / Mitra Team Teaching */}
									{hasPartner && partner && (
										<div className="pt-2.5 border-t border-slate-200/80">
											{isTeamTeachingActive ? (
												<div className="flex items-start gap-2.5 text-xs font-semibold text-purple-950 bg-purple-100/80 rounded-lg p-2.5 border border-purple-300 shadow-2xs">
													<Users className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
													<div>
														<p className="font-bold text-purple-900">
															Sesi Hadir Bersama (Team Teaching)
														</p>
														<p className="text-[11px] font-normal text-purple-800 mt-0.5">
															Pertemuan ini tercatat dihadiri bersama oleh Anda
															dan <strong>{partnerName}</strong>. Honorarium &
															rekap kehadiran tercatat ke kedua dosen.
														</p>
													</div>
												</div>
											) : isPartnerAttended && !isAttendedByMe ? (
												<div className="flex items-start gap-2.5 text-xs text-purple-950 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-3 border border-purple-300 shadow-2xs">
													<Sparkles className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
													<div>
														<p className="font-bold text-purple-900">
															Mitra Anda ({partnerName}) Sudah Mengisi Presensi
															Sesi Ini!
														</p>
														<p className="text-[11px] text-purple-800 mt-1">
															Jika Anda juga mengajar pada sesi ini, klik simpan
															presensi di bawah untuk mencatat kehadiran Anda.
															Sistem otomatis menggabungkan kedua input dan
															menampilkan{" "}
															<strong>
																Keduanya Hadir Bersama (Team Teaching)
															</strong>
															.
														</p>
													</div>
												</div>
											) : isAttendedByMe && !isPartnerAttended ? (
												<div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white/90 rounded-lg p-2.5 border border-slate-200">
													<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
													<span>
														Saat ini baru Anda yang tercatat hadir (
														<strong>Tunggal</strong>). Jika mitra dosen (
														<strong>{partnerName}</strong>) nantinya juga
														menginput absensi di sesi ini, sistem akan otomatis
														menjadikannya{" "}
														<strong>Hadir Bersama (Team Teaching)</strong>.
													</span>
												</div>
											) : (
												<div className="flex items-center gap-2 text-xs text-slate-600 bg-white/70 rounded-lg p-2 border border-slate-200/70">
													<Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
													<span>
														Mitra Team Teaching: <strong>{partnerName}</strong>{" "}
														({isUserMain ? "Pendamping" : "Utama"}).
													</span>
												</div>
											)}
										</div>
									)}
								</div>
							);
						})()}

						{/* Status Perkuliahan */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Status Perkuliahan
							</Label>
							<Select
								value={meetingForm.teachingStatus}
								onValueChange={(val: any) =>
									setMeetingForm({ ...meetingForm, teachingStatus: val })
								}
							>
								<SelectTrigger className="h-9 border-slate-300 bg-white text-sm">
									<SelectValue placeholder="Pilih status">
										{meetingForm.teachingStatus === "terlaksana"
											? "Terlaksana Sesuai Jadwal"
											: meetingForm.teachingStatus === "jadwal_ulang"
												? "Kuliah Pengganti (Reschedule)"
												: "Dibatalkan / Izin"}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="terlaksana">
										Terlaksana Sesuai Jadwal
									</SelectItem>
									<SelectItem value="jadwal_ulang">
										Kuliah Pengganti (Reschedule)
									</SelectItem>
									<SelectItem value="dibatalkan">Dibatalkan / Izin</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Topik / Silabus Materi Kuliah */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700">
								Topik / Materi Pembelajaran yang Diajarkan
							</Label>
							<Input
								className="h-9 border-slate-300 bg-white text-sm"
								placeholder="Misal: Konsep Front Office System, Penerimaan Tamu VIP..."
								value={meetingForm.description}
								onChange={(e) =>
									setMeetingForm({
										...meetingForm,
										description: e.target.value,
									})
								}
							/>
						</div>

						{/* Jurnal Perkuliahan & Catatan Dosen */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
								<FileText className="w-3.5 h-3.5 text-indigo-600" />
								Jurnal Perkuliahan / Catatan Kegiatan Belajar Mengajar
							</Label>
							<Textarea
								rows={3}
								className="border-slate-300 bg-white text-sm"
								placeholder="Tuliskan resume materi yang selesai dibahas, keaktifan mahasiswa di kelas, atau kendala/tugas yang diberikan..."
								value={meetingForm.teachingNotes}
								onChange={(e) =>
									setMeetingForm({
										...meetingForm,
										teachingNotes: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<DialogFooter className="border-t border-slate-100 pt-3 flex items-center justify-between sm:justify-between w-full">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsEditModalOpen(false)}
							className="text-slate-600"
						>
							Batal
						</Button>
						<Button
							onClick={handleSaveAttendance}
							disabled={isSavingMeeting || isLoadingMeetings || !selectedCourse}
							className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 shadow-sm"
						>
							{isSavingMeeting ? (
								<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
							) : (
								<Save className="w-3.5 h-3.5 mr-1.5" />
							)}
							Simpan Absensi Mengajar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
