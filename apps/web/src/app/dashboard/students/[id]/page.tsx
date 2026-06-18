"use client";

import {
	ArrowLeft,
	CheckCircle,
	Clock,
	Download,
	FileText,
	Printer,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AkademikPanel } from "@/components/panels/AkademikPanel";
import { CatatanPanel } from "@/components/panels/CatatanPanel";
import { CrmPanel } from "@/components/panels/CrmPanel";
import { DosenPanel } from "@/components/panels/DosenPanel";
import { FinalDecisionPanel } from "@/components/panels/FinalDecisionPanel";
import { FinancePanel } from "@/components/panels/FinancePanel";
import { InternshipPanel } from "@/components/panels/InternshipPanel";
import { PaPanel } from "@/components/panels/PaPanel";
import { PmbPanel } from "@/components/panels/PmbPanel";
import { StatusPanel } from "@/components/panels/StatusPanel";
import { StudentProgress } from "@/components/StudentProgress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

type StudentDetail = {
	student: {
		id: number;
		nim: string;
		name: string;
		cohort: number;
		program: string;
		overallStatus: string | null;
	};
	pmb: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
	} | null;
	crm: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
	} | null;
	finance: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
	} | null;
	academic: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
	} | null;
	internship: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
	} | null;
	decision: { isApprovedByDirector: boolean | null } | null;
	courseGrades?: any[];
	pa?: {
		status: string | null;
		isAcc?: boolean | null;
		accAt?: string | Date | null;
	} | null;
};

const STATUS_COLORS = {
	AMAN: {
		bg: "bg-emerald-500/10",
		text: "text-emerald-500",
		border: "border-emerald-500/20",
		icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
	},
	PERLU_PERHATIAN: {
		bg: "bg-amber-500/10",
		text: "text-amber-500",
		border: "border-amber-500/20",
		icon: <Clock className="w-5 h-5 text-amber-500" />,
	},
	TIDAK_AMAN: {
		bg: "bg-rose-500/10",
		text: "text-rose-500",
		border: "border-rose-500/20",
		icon: <XCircle className="w-5 h-5 text-rose-500" />,
	},
};

const NAV_LINKS = [
	{ id: "pmb", label: "PMB", roles: ["superadmin", "pmb"] },
	{ id: "crm", label: "CRM", roles: ["superadmin", "crm"] },
	{ id: "finance", label: "Finance", roles: ["superadmin", "finance"] },
	{ id: "akademik", label: "Akademik", roles: ["superadmin", "akademik"] },
	{ id: "dosen", label: "Dosen per MK", roles: ["superadmin", "dosen"] },
	{ id: "pa", label: "PA", roles: ["superadmin", "pa"] },
	{ id: "magang", label: "Tim Magang", roles: ["superadmin", "magang"] },
	{ id: "status", label: "Status Akhir", roles: ["superadmin"] },
	{
		id: "final-decision",
		label: "Keputusan Final",
		roles: ["superadmin", "evaluator"],
	},
	{
		id: "catatan",
		label: "Catatan Internal",
		roles: [
			"superadmin",
			"akademik",
			"pa",
			"pmb",
			"crm",
			"finance",
			"magang",
			"evaluator",
		],
	},
];

export default function StudentDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { isAuthenticated, user, hasHydrated } = useAuthStore();
	const [data, setData] = useState<StudentDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("");
	const [mounted, setMounted] = useState(false);
	const [updateTrigger, setUpdateTrigger] = useState(0);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!hasHydrated) return;
		if (!isAuthenticated) {
			router.push("/login");
			return;
		}

		const fetchStudent = async () => {
			const { data: resData, error } =
				await api.students[params.id as string].get();
			if (!error && resData?.data) {
				setData(resData.data as unknown as StudentDetail);
			}
			setIsLoading(false);
		};

		fetchStudent();
	}, [params.id, isAuthenticated, hasHydrated, router]);

	const refetchStudent = async () => {
		const { data: resData, error } =
			await api.students[params.id as string].get();
		if (!error && resData?.data) {
			setData(resData.data as unknown as StudentDetail);
			setUpdateTrigger((prev) => prev + 1);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full text-slate-500">
				Memuat profil mahasiswa...
			</div>
		);
	}

	if (!data) {
		return (
			<div className="text-center py-20 text-rose-400">
				Data mahasiswa tidak ditemukan.
			</div>
		);
	}

	const s = data.student;
	const sColor = s.overallStatus
		? STATUS_COLORS[s.overallStatus as keyof typeof STATUS_COLORS]
		: STATUS_COLORS.PERLU_PERHATIAN;

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.substring(0, 2)
			.toUpperCase();
	};

	const visibleLinks = NAV_LINKS.filter(
		(link) => mounted && user?.role && link.roles.includes(user.role),
	);

	const scrollToAnchor = (id: string) => {
		setActiveTab(id);
	};

	const renderStamp = (title: string, isAcc: boolean, date?: string) => (
		<div className="flex flex-col items-center p-3 border border-slate-200 rounded-md bg-slate-50 min-w-[120px]">
			<span className="text-xs font-semibold text-slate-500 mb-2">{title}</span>
			{isAcc ? (
				<>
					<CheckCircle className="w-6 h-6 text-emerald-500 mb-1" />
					<span className="text-[10px] text-emerald-400">ACC</span>
					{date && (
						<span className="text-[10px] text-slate-500 mt-1">{date}</span>
					)}
				</>
			) : (
				<>
					<Clock className="w-6 h-6 text-slate-600 mb-1" />
					<span className="text-[10px] text-slate-500">Pending</span>
				</>
			)}
		</div>
	);

	return (
		<div className="pb-20 relative">
			{/* Top Actions */}
			<div className="flex justify-between items-center mb-6">
				<Link
					href={
						user?.role === "superadmin" ? "/dashboard/students" : "/dashboard"
					}
					className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
				>
					<ArrowLeft className="w-4 h-4" />
					Kembali ke Daftar
				</Link>
				<div className="flex gap-3">
					<Button
						variant="outline"
						className="bg-transparent border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
					>
						<Printer className="w-4 h-4 mr-2" />
						Cetak
					</Button>
					<Button
						variant="outline"
						className="bg-transparent border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
					>
						<Download className="w-4 h-4 mr-2" />
						Export
					</Button>
				</div>
			</div>

			{/* HEADER DETAIL MAHASISWA */}
			<div className="bg-white pb-4 pt-2 -mx-6 px-6 border-b border-slate-200">
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
					{/* Profile Info */}
					<div className="flex items-start gap-5">
						<Avatar className="w-16 h-16 border-2 border-[#0517B0]/30">
							<AvatarFallback className="bg-gradient-to-br from-[#0517B0] to-blue-600 text-white text-xl font-bold">
								{getInitials(s.name)}
							</AvatarFallback>
						</Avatar>
						<div>
							<div className="flex items-center gap-3 mb-1">
								<h1 className="text-2xl font-bold text-slate-900">{s.name}</h1>
								{user?.role === "superadmin" && (
									<Badge
										className={`${sColor.bg} ${sColor.text} ${sColor.border} border uppercase px-2 py-0.5`}
									>
										<span className="mr-1.5">
											{s.overallStatus === "AMAN"
												? "🟢"
												: s.overallStatus === "TIDAK_AMAN"
													? "🔴"
													: "🟡"}
										</span>
										{s.overallStatus?.replace("_", " ")}
									</Badge>
								)}
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm text-slate-600">
								<div>
									<span className="text-slate-500">NIM:</span> {s.nim}
								</div>
								<div>
									<span className="text-slate-500">Angkatan:</span> {s.cohort}
								</div>
								<div>
									<span className="text-slate-500">Program:</span> {s.program}
								</div>
								<div>
									<span className="text-slate-500">HP:</span> 08123456789
								</div>
								<div className="col-span-2">
									<span className="text-slate-500">Orang Tua:</span> Bapak Fauzi
								</div>
								<div className="col-span-2">
									<span className="text-slate-500">PA:</span> Ibu Rini
								</div>
							</div>
						</div>
					</div>

					{/* Progress Overview */}
					<StudentProgress studentId={s.id} updateTrigger={updateTrigger} />
				</div>

				{/* Anchor Navigation */}
				<div className="flex overflow-x-auto gap-1 mt-6 pb-2 hide-scrollbar">
					{mounted &&
						visibleLinks.map((link) => (
							<button
								type="button"
								key={link.id}
								onClick={() => scrollToAnchor(link.id)}
								className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
									(activeTab || visibleLinks[0]?.id) === link.id
										? "bg-blue-50 text-[#0517B0]"
										: "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
								}`}
							>
								{link.label}
							</button>
						))}
				</div>
			</div>

			{/* PANELS CONTENT */}
			<div className="mt-8 space-y-6">
				{mounted &&
					(() => {
						const currentLink = visibleLinks.find(
							(l) => l.id === (activeTab || visibleLinks[0]?.id),
						);
						if (!currentLink) return null;

						return (
							<div
								id={`panel-${currentLink.id}`}
								key={currentLink.id}
								className="animate-in fade-in duration-300"
							>
								{currentLink.id === "pmb" ? (
									<PmbPanel
										studentId={s.id}
										pmbData={data.pmb}
										onUpdate={refetchStudent}
									/>
								) : currentLink.id === "crm" ? (
									<CrmPanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "finance" ? (
									<FinancePanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "akademik" ? (
									<AkademikPanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "dosen" ? (
									<DosenPanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "pa" ? (
									<PaPanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "magang" ? (
									<InternshipPanel studentId={s.id} onUpdate={refetchStudent} />
								) : currentLink.id === "status" ? (
									<StatusPanel
										studentId={s.id}
										onNavigate={(tab) => {
											setActiveTab(tab);
										}}
									/>
								) : currentLink.id === "final-decision" ? (
									<FinalDecisionPanel
										studentId={s.id}
										onUpdate={refetchStudent}
										userRole={user?.role || ""}
									/>
								) : currentLink.id === "catatan" ? (
									<CatatanPanel studentId={s.id} />
								) : (
									<Card className="bg-white border-slate-200 shadow-sm">
										<CardHeader className="border-b border-slate-200 pb-4">
											<div className="flex justify-between items-center">
												<CardTitle className="text-slate-800 text-lg flex items-center gap-2">
													Panel {currentLink.label}
												</CardTitle>
												<Badge
													variant="outline"
													className="border-slate-200 text-slate-500"
												>
													Dikelola oleh Admin {currentLink.label}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="py-12 flex flex-col items-center justify-center text-slate-400">
											<FileText className="w-12 h-12 mb-3 opacity-20" />
											<p>
												Konten Panel {currentLink.label} akan di-inject di sini.
											</p>
										</CardContent>
									</Card>
								)}
							</div>
						);
					})()}
			</div>

			{user?.role === "superadmin" && (
				<>
					<Separator className="my-10 bg-slate-200" />

					{/* DIGITAL STAMP FOOTER */}
					<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
						<div className="absolute top-0 right-0 w-32 h-32 bg-[#0517B0]/5 rounded-full blur-3xl" />
						<h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
							<CheckCircle className="w-5 h-5 text-[#0517B0]" />
							Jejak Persetujuan Digital
						</h3>

						<div className="flex flex-wrap gap-4 mb-8">
							{renderStamp(
								"PMB",
								!!data.pmb?.isAcc,
								data.pmb?.accAt
									? new Date(data.pmb.accAt).toLocaleDateString("id-ID")
									: undefined,
							)}
							{renderStamp(
								"CRM",
								!!data.crm?.isAcc,
								data.crm?.accAt
									? new Date(data.crm.accAt).toLocaleDateString("id-ID")
									: undefined,
							)}
							{renderStamp(
								"Finance",
								!!data.finance?.isAcc,
								data.finance?.accAt
									? new Date(data.finance.accAt).toLocaleDateString("id-ID")
									: undefined,
							)}
							{renderStamp(
								"Akademik",
								!!data.academic?.isAcc,
								data.academic?.accAt
									? new Date(data.academic.accAt).toLocaleDateString("id-ID")
									: undefined,
							)}
							{renderStamp("Dosen", false)}
							{renderStamp(
								"PA",
								!!data.pa?.isAcc,
								data.pa?.accAt
									? new Date(data.pa.accAt).toLocaleDateString("id-ID")
									: undefined,
							)}
							{renderStamp(
								"Magang",
								!!data.internship?.isAcc,
								data.internship?.accAt
									? new Date(data.internship.accAt).toLocaleDateString("id-ID")
									: undefined,
							)}
						</div>

						<div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
							<div>
								<h4 className="text-amber-700 font-bold flex items-center gap-2">
									🔐 Persetujuan Akhir (Direktur)
								</h4>
								<p className="text-sm text-amber-600/80 mt-1">
									Tersedia setelah semua divisi memberikan ACC.
								</p>
							</div>
							<Button
								disabled={true} // Logic will be implemented later
								className="bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:bg-slate-200 disabled:text-slate-400 w-full sm:w-auto"
							>
								Berikan Keputusan Final
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
