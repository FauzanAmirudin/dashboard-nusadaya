"use client";

import {
	BookOpen,
	CalendarDays,
	CheckSquare,
	ChevronDown,
	ClipboardCheck,
	ClipboardList,
	Coins,
	DatabaseBackup,
	GraduationCap,
	HeartHandshake,
	LayoutDashboard,
	LogOut,
	PhoneCall,
	Plane,
	Settings,
	ShieldCheck,
	Sparkles,
	TrendingUp,
	UserCheck,
	UserCog,
	Users,
	Wallet,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, authFetch } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { getUserRoles, hasRole, useAuthStore } from "@/store";

interface SidebarSubItem {
	label: string;
	href: string;
	roles: string[];
	icon?: React.ElementType;
	badge?: "pmbPendingForms";
}

type SidebarBadges = Partial<Record<"pmbPendingForms", number>>;

interface SidebarItem {
	icon: React.ElementType;
	label: string;
	href?: string;
	roles: string[];
	subItems?: SidebarSubItem[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
	{
		icon: LayoutDashboard,
		label: "Dashboard",
		href: "/dashboard",
		roles: [
			"superadmin",
			"pmb",
			"crm",
			"finance",
			"akademik",
			"dosen",
			"pa",
			"magang",
			"evaluator",
		],
	},
	{
		icon: Users,
		label: "Semua Mahasiswa",
		href: "/dashboard/students",
		roles: [
			"superadmin",
			"pmb",
			"crm",
			"finance",
			"akademik",
			"pa",
			"magang",
			"evaluator",
		],
	},
	{
		icon: ClipboardList,
		label: "Panel PMB",
		roles: ["superadmin", "pmb"],
		subItems: [
			{
				label: "Daftar Mahasiswa",
				href: "/dashboard/pmb",
				roles: ["superadmin", "pmb"],
			},
			{
				label: "Formulir Registrasi",
				href: "/dashboard/pmb/formulir",
				roles: ["superadmin", "pmb"],
				badge: "pmbPendingForms",
			},
		],
	},
	{
		icon: PhoneCall,
		label: "Panel CRM",
		href: "/dashboard/crm",
		roles: ["superadmin", "crm"],
	},
	{
		icon: Wallet,
		label: "Panel Finance",
		roles: ["superadmin", "finance"],
		subItems: [
			{
				label: "Monitoring Mahasiswa",
				href: "/dashboard/finance",
				roles: ["superadmin", "finance"],
				icon: Wallet,
			},
			{
				label: "Proyeksi Target & Realisasi",
				href: "/dashboard/finance/proyeksi",
				roles: ["superadmin", "finance"],
				icon: TrendingUp,
			},
			{
				label: "Anggaran Praktik",
				href: "/dashboard/finance/anggaran-praktik",
				roles: ["superadmin", "finance"],
				icon: Wallet,
			},
		],
	},
	{
		icon: GraduationCap,
		label: "Akademik",
		roles: ["superadmin", "akademik", "dosen"],
		subItems: [
			{
				label: "Panel Akademik",
				href: "/dashboard/akademik",
				roles: ["superadmin", "akademik"],
				icon: GraduationCap,
			},
			{
				label: "Kalender Akademik",
				href: "/dashboard/kalender-akademik",
				roles: ["superadmin", "akademik"],
				icon: CalendarDays,
			},
			{
				label: "Periode Akademik",
				href: "/dashboard/akademik/periode",
				roles: ["superadmin", "akademik"],
				icon: CalendarDays,
			},
			{
				label: "Kurikulum & Master MK",
				href: "/dashboard/akademik/kurikulum",
				roles: ["superadmin", "akademik"],
				icon: BookOpen,
			},
			{
				label: "Penjadwalan & Info",
				href: "/dashboard/penjadwalan",
				roles: ["superadmin", "akademik"],
				icon: CalendarDays,
			},
			{
				label: "Manajemen Mata Kuliah",
				href: "/dashboard/mata-kuliah",
				roles: ["superadmin", "akademik", "dosen"],
				icon: BookOpen,
			},
			{
				label: "Rekap Nilai & Presensi",
				href: "/dashboard/mata-kuliah/rekap",
				roles: ["superadmin", "akademik", "dosen"],
				icon: CheckSquare,
			},
			{
				label: "Presensi",
				href: "/dashboard/mata-kuliah/rekap-dosen",
				roles: ["dosen"],
				icon: UserCheck,
			},
			{
				label: "Absensi Dosen",
				href: "/dashboard/akademik/absensi-dosen",
				roles: ["superadmin", "akademik", "finance"],
				icon: UserCheck,
			},
			{
				label: "Manajemen Kehadiran",
				href: "/dashboard/kehadiran",
				roles: ["superadmin", "akademik"],
				icon: ClipboardCheck,
			},
			{
				label: "Manajemen PA",
				href: "/dashboard/akademik/pa",
				roles: ["superadmin", "akademik"],
				icon: GraduationCap,
			},
		],
	},
	{
		icon: HeartHandshake,
		label: "Panel PA",
		href: "/dashboard/pa",
		roles: ["pa"],
	},
	{
		icon: Plane,
		label: "Panel Magang",
		href: "/dashboard/magang",
		roles: ["superadmin", "magang"],
	},
	{
		icon: ShieldCheck,
		label: "Finalisasi",
		href: "/dashboard/evaluator",
		roles: ["superadmin", "evaluator"],
	},
	{
		icon: UserCog,
		label: "Pengelolaan Pengguna",
		href: "/dashboard/users",
		roles: ["superadmin", "akademik"],
	},
	{
		icon: Coins,
		label: "Standar Biaya Program",
		href: "/dashboard/settings/program-fees",
		roles: ["superadmin"],
	},
	{
		icon: DatabaseBackup,
		label: "Backup & Sistem",
		href: "/dashboard/settings/backup",
		roles: ["superadmin"],
	},
];

interface SidebarProps {
	collapsed: boolean;
	mobileOpen: boolean;
	onClose: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onClose }: SidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const context = searchParams.get("tab") || searchParams.get("context");
	const { user, logout } = useAuthStore();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleLogout = async () => {
		await api.auth.logout.post();
		logout();
		router.push("/login");
	};

	const userRoles = getUserRoles(user);
	const isSuperadmin = hasRole(user, "superadmin");
	const canSeePmb = hasRole(user, "superadmin", "pmb");
	const visibleItems: SidebarItem[] = [];

	// Jumlah antrean formulir registrasi online untuk badge submenu PMB
	const [badges, setBadges] = useState<SidebarBadges>({});
	useEffect(() => {
		if (!mounted || !canSeePmb) return;
		let cancelled = false;
		authFetch("/pmb/form-responses")
			.then((res) => res.json())
			.then((data) => {
				if (!cancelled && data.success && Array.isArray(data.data)) {
					setBadges({ pmbPendingForms: data.data.length });
				}
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [mounted, canSeePmb, pathname]);

	if (mounted && user) {
		SIDEBAR_ITEMS.forEach((item) => {
			if (isSuperadmin) {
				if (item.roles.includes("superadmin")) {
					visibleItems.push(item);
				}
			} else {
				if (item.subItems) {
					const allowed = item.subItems.filter((sub) =>
						sub.roles.some((r) => userRoles.includes(r)),
					);
					if (allowed.length > 0) {
						visibleItems.push({
							...item,
							subItems: allowed,
						});
					}
				} else {
					if (item.roles.some((r) => userRoles.includes(r))) {
						if (!visibleItems.some((v) => v.href === item.href)) {
							visibleItems.push(item);
						}
					}
				}
			}
		});
	}

	const moduleItems = visibleItems.filter(
		(item) =>
			!["Dashboard", "Semua Mahasiswa", "Pengaturan"].includes(item.label),
	);
	const mainItems = isSuperadmin
		? visibleItems.filter((item) =>
				["Dashboard", "Semua Mahasiswa"].includes(item.label),
			)
		: [];
	const settingsItem = visibleItems.find((item) => item.label === "Pengaturan");

	return (
		<>
			{/* Mobile Overlay */}
			{mobileOpen && (
				<button
					type="button"
					aria-label="Tutup menu"
					className="fixed inset-0 bg-black/50 z-40 lg:hidden w-full cursor-default"
					onClick={onClose}
				/>
			)}

			<aside
				className={cn(
					"fixed lg:relative z-50 flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out",
					collapsed ? "w-16" : "w-72 lg:w-64",
					// Mobile: slide in from left
					mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 shrink-0">
					<Link
						href={
							user?.role === "mahasiswa" ? "/mahasiswa/dashboard" : "/dashboard"
						}
						className="flex items-center gap-2.5 hover:opacity-85 transition-opacity group cursor-pointer"
						title="Menuju ke Halaman Dashboard"
					>
						<Image
							src="/icon.svg"
							alt="Logo OneData Nusadaya"
							width={28}
							height={28}
							className="object-contain shrink-0 group-hover:scale-105 transition-transform"
						/>
						{!collapsed && (
							<span className="font-bold text-lg text-slate-900 tracking-tight flex items-center">
								OneData
								<span className="font-light text-[#0517B0] ml-1">Nusadaya</span>
							</span>
						)}
					</Link>
					{/* Mobile Close Button */}
					{mobileOpen && !collapsed && (
						<button
							type="button"
							onClick={onClose}
							aria-label="Tutup menu"
							className={cn(
								"lg:hidden inline-flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer",
								FOCUS_RING,
							)}
						>
							<X className="h-5 w-5" />
						</button>
					)}
				</div>

				{/* Nav Items */}
				<nav
					aria-label="Menu utama"
					className="flex flex-1 flex-col space-y-1 overflow-y-auto px-3 py-4"
				>
					{/* Main items */}
					{mainItems.length > 0 && (
						<>
							{!collapsed && (
								<p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
									Utama
								</p>
							)}
							{mainItems.map((item) => (
								<NavItem
									key={item.href || item.label}
									item={item}
									pathname={pathname}
									context={context}
									collapsed={collapsed}
									badges={badges}
									onNavigate={mobileOpen ? onClose : undefined}
								/>
							))}
						</>
					)}

					{/* Module items */}
					{moduleItems.length > 0 && (
						<>
							{!collapsed && (
								<p className="mb-1.5 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
									Modul
								</p>
							)}
							{collapsed && <div className="my-3 border-t border-slate-200" />}
							{moduleItems.map((item) => (
								<NavItem
									key={item.href || item.label}
									item={item}
									pathname={pathname}
									context={context}
									collapsed={collapsed}
									badges={badges}
									onNavigate={mobileOpen ? onClose : undefined}
								/>
							))}
						</>
					)}
				</nav>

				{/* Footer Nav */}
				<div className="shrink-0 space-y-1 border-t border-slate-200 px-3 py-3">
					{settingsItem && (
						<NavItem
							item={settingsItem}
							pathname={pathname}
							context={context}
							collapsed={collapsed}
							badges={badges}
							onNavigate={mobileOpen ? onClose : undefined}
						/>
					)}
					<button
						type="button"
						className={cn(
							"flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600",
							FOCUS_RING,
							collapsed && "justify-center px-0",
						)}
						aria-label={collapsed ? "Keluar" : undefined}
						title={collapsed ? "Keluar" : undefined}
						onClick={handleLogout}
					>
						<LogOut className="h-5 w-5 shrink-0" />
						{!collapsed && <span>Keluar</span>}
					</button>
				</div>
			</aside>
		</>
	);
}

function checkItemActive(
	href: string | undefined,
	pathname: string,
	rawContext: string | null,
): boolean {
	if (!href) return false;

	if (rawContext && pathname.startsWith("/dashboard/students/")) {
		const context = rawContext.toLowerCase();
		if (href === "/dashboard/students") {
			return false;
		}
		if (
			href === `/dashboard/${context}` ||
			((context === "akademik" || context === "academic") &&
				href === "/dashboard/akademik") ||
			((context === "finance" || context === "keuangan") &&
				href === "/dashboard/finance") ||
			((context === "magang" || context === "internship") &&
				href === "/dashboard/magang") ||
			(context === "pmb" && href === "/dashboard/pmb") ||
			(context === "crm" && href === "/dashboard/crm") ||
			(context === "pa" && href === "/dashboard/pa") ||
			(context === "kehadiran" && href === "/dashboard/kehadiran")
		) {
			return true;
		}
		if (
			(context === "final-decision" ||
				context === "status" ||
				context === "evaluator" ||
				context === "finalisasi") &&
			(href === "/dashboard/evaluator" || href === "/dashboard/finalisasi")
		) {
			return true;
		}
		return false;
	}

	if (href === "/dashboard") {
		return pathname === "/dashboard";
	}

	if (href === "/dashboard/pmb") {
		return pathname === "/dashboard/pmb";
	}

	if (href === "/dashboard/pmb/formulir") {
		return (
			pathname.startsWith("/dashboard/pmb/formulir") ||
			pathname.startsWith("/dashboard/pmb/responses/")
		);
	}

	if (href === "/dashboard/finance") {
		return (
			pathname === "/dashboard/finance" ||
			(pathname.startsWith("/dashboard/finance/") &&
				!pathname.startsWith("/dashboard/finance/anggaran-praktik") &&
				!pathname.startsWith("/dashboard/finance/proyeksi"))
		);
	}

	if (href === "/dashboard/finance/proyeksi") {
		return (
			pathname === "/dashboard/finance/proyeksi" ||
			pathname.startsWith("/dashboard/finance/proyeksi/")
		);
	}

	if (href === "/dashboard/finance/anggaran-praktik") {
		return (
			pathname === "/dashboard/finance/anggaran-praktik" ||
			pathname.startsWith("/dashboard/finance/anggaran-praktik/")
		);
	}

	if (href === "/dashboard/mata-kuliah") {
		return (
			(pathname === "/dashboard/mata-kuliah" ||
				pathname.startsWith("/dashboard/mata-kuliah/")) &&
			!pathname.startsWith("/dashboard/mata-kuliah/rekap")
		);
	}

	if (href === "/dashboard/mata-kuliah/rekap") {
		return (
			pathname === "/dashboard/mata-kuliah/rekap" ||
			pathname.startsWith("/dashboard/mata-kuliah/rekap/")
		);
	}

	if (href === "/dashboard/mata-kuliah/rekap-dosen") {
		return (
			pathname === "/dashboard/mata-kuliah/rekap-dosen" ||
			pathname.startsWith("/dashboard/mata-kuliah/rekap-dosen/")
		);
	}

	if (href === "/dashboard/akademik") {
		return (
			pathname === "/dashboard/akademik" ||
			(pathname.startsWith("/dashboard/akademik/") &&
				!pathname.startsWith("/dashboard/akademik/periode") &&
				!pathname.startsWith("/dashboard/akademik/kurikulum") &&
				!pathname.startsWith("/dashboard/akademik/absensi-dosen") &&
				!pathname.startsWith("/dashboard/akademik/pa"))
		);
	}

	if (href === "/dashboard/akademik/periode") {
		return (
			pathname === "/dashboard/akademik/periode" ||
			pathname.startsWith("/dashboard/akademik/periode/")
		);
	}

	if (href === "/dashboard/akademik/kurikulum") {
		return (
			pathname === "/dashboard/akademik/kurikulum" ||
			pathname.startsWith("/dashboard/akademik/kurikulum/")
		);
	}

	if (href === "/dashboard/akademik/absensi-dosen") {
		return (
			pathname === "/dashboard/akademik/absensi-dosen" ||
			pathname.startsWith("/dashboard/akademik/absensi-dosen/")
		);
	}

	if (href === "/dashboard/akademik/pa") {
		return (
			pathname === "/dashboard/akademik/pa" ||
			pathname.startsWith("/dashboard/akademik/pa/")
		);
	}

	if (href === "/dashboard/kehadiran") {
		return (
			pathname === "/dashboard/kehadiran" ||
			pathname.startsWith("/dashboard/kehadiran/")
		);
	}

	if (href === "/dashboard/penjadwalan") {
		return (
			pathname === "/dashboard/penjadwalan" ||
			pathname.startsWith("/dashboard/penjadwalan/")
		);
	}

	if (href === "/dashboard/kalender-akademik") {
		return (
			pathname === "/dashboard/kalender-akademik" ||
			pathname.startsWith("/dashboard/kalender-akademik/")
		);
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

const FOCUS_RING =
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0517B0]/40";

function NavItem({
	item,
	pathname,
	context,
	collapsed,
	badges,
	onNavigate,
}: {
	item: SidebarItem;
	pathname: string;
	context: string | null;
	collapsed: boolean;
	badges?: SidebarBadges;
	onNavigate?: () => void;
}) {
	const { user } = useAuthStore();
	const router = useRouter();
	// Non-superadmin: dropdown terbuka secara default; superadmin: tertutup.
	const [isOpen, setIsOpen] = useState(() => !hasRole(user, "superadmin"));

	const isSubActive = item.subItems?.some((sub) =>
		checkItemActive(sub.href, pathname, context),
	);

	useEffect(() => {
		if (isSubActive) setIsOpen(true);
	}, [isSubActive]);

	const isActive = checkItemActive(item.href, pathname, context);

	const Icon = item.icon;

	if (item.subItems) {
		const userRoles = getUserRoles(user);
		const visibleSubItems = item.subItems.filter(
			(sub) =>
				user?.role === "superadmin" ||
				userRoles.includes("superadmin") ||
				sub.roles.some((r) => userRoles.includes(r)),
		);
		if (visibleSubItems.length === 0) return null;

		const badgeOf = (sub: SidebarSubItem) =>
			sub.badge && (badges?.[sub.badge] ?? 0) > 0 ? badges?.[sub.badge] : null;

		// Sidebar diciutkan: ikon grup membuka menu kecil di samping
		if (collapsed) {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger
						aria-label={item.label}
						title={item.label}
						className={cn(
							"flex min-h-11 w-full items-center justify-center rounded-lg transition-colors",
							FOCUS_RING,
							isSubActive
								? "bg-blue-50 text-[#0517B0]"
								: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
						)}
					>
						<Icon className="h-5 w-5 shrink-0" />
					</DropdownMenuTrigger>
					<DropdownMenuContent side="right" align="start" className="min-w-56">
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-xs font-semibold text-slate-500">
								{item.label}
							</DropdownMenuLabel>
							{visibleSubItems.map((sub) => {
								const active = checkItemActive(sub.href, pathname, context);
								const count = badgeOf(sub);
								return (
									<DropdownMenuItem
										key={sub.href}
										onClick={() => {
											router.push(sub.href);
											onNavigate?.();
										}}
										className={cn(
											"min-h-10 justify-between gap-2 text-sm",
											active && "font-semibold text-[#0517B0]",
										)}
									>
										<span>{sub.label}</span>
										{count ? (
											<span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-800">
												{count}
											</span>
										) : null}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		}

		return (
			<div>
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					aria-expanded={isOpen}
					className={cn(
						"flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors",
						FOCUS_RING,
						isSubActive
							? "font-semibold text-slate-900"
							: "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900",
					)}
				>
					<Icon
						className={cn("h-5 w-5 shrink-0", isSubActive && "text-[#0517B0]")}
					/>
					<span className="flex-1 truncate text-left">{item.label}</span>
					<ChevronDown
						className={cn(
							"h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
							isOpen && "rotate-180",
						)}
					/>
				</button>

				{isOpen && (
					<ul className="mt-1 space-y-1">
						{visibleSubItems.map((sub) => {
							const isSubItemActive = checkItemActive(
								sub.href,
								pathname,
								context,
							);
							const count = badgeOf(sub);
							return (
								<li key={sub.href}>
									<Link
										href={sub.href}
										onClick={onNavigate}
										aria-current={isSubItemActive ? "page" : undefined}
										className={cn(
											// pl-11 = padding 12px + ikon 20px + jarak 12px → teks sejajar label grup
											"flex min-h-11 items-center justify-between gap-2 rounded-lg pl-11 pr-3 text-sm transition-colors",
											FOCUS_RING,
											isSubItemActive
												? "bg-blue-50 font-semibold text-[#0517B0]"
												: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
										)}
									>
										<span className="truncate">{sub.label}</span>
										{count ? (
											<span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-800">
												{count}
											</span>
										) : null}
									</Link>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		);
	}

	return (
		<Link
			href={item.href!}
			onClick={onNavigate}
			aria-current={isActive ? "page" : undefined}
			aria-label={collapsed ? item.label : undefined}
			title={collapsed ? item.label : undefined}
			className={cn(
				"flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
				FOCUS_RING,
				isActive
					? "bg-blue-50 font-semibold text-[#0517B0]"
					: "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900",
				collapsed && "justify-center px-0",
			)}
		>
			<Icon className="h-5 w-5 shrink-0" />
			{!collapsed && <span className="truncate">{item.label}</span>}
		</Link>
	);
}
