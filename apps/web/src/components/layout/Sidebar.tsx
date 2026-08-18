"use client";

import {
	BookOpen,
	CalendarDays,
	CheckSquare,
	ChevronDown,
	ClipboardCheck,
	ClipboardList,
	DatabaseBackup,
	GraduationCap,
	HeartHandshake,
	LayoutDashboard,
	LogOut,
	PhoneCall,
	Plane,
	Settings,
	ShieldCheck,
	UserCog,
	Users,
	Wallet,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

interface SidebarSubItem {
	label: string;
	href: string;
	roles: string[];
	icon?: React.ElementType;
}

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
		],
	},
	{
		icon: Users,
		label: "Semua Mahasiswa",
		href: "/dashboard/students",
		roles: ["superadmin", "pmb", "crm", "finance", "akademik", "pa", "magang"],
	},
	{
		icon: ClipboardList,
		label: "Panel PMB",
		href: "/dashboard/pmb",
		roles: ["superadmin"],
	},
	{
		icon: PhoneCall,
		label: "Panel CRM",
		href: "/dashboard/crm",
		roles: ["superadmin"],
	},
	{
		icon: Wallet,
		label: "Panel Finance",
		href: "/dashboard/finance",
		roles: ["superadmin"],
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
				label: "Penjadwalan & Info",
				href: "/dashboard/penjadwalan",
				roles: ["superadmin", "akademik"],
				icon: CalendarDays,
			},
			{
				label: "Manajemen Kehadiran",
				href: "/dashboard/kehadiran",
				roles: ["superadmin", "akademik"],
				icon: ClipboardCheck,
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
		roles: ["superadmin"],
	},
	{
		icon: Plane,
		label: "Panel Magang",
		href: "/dashboard/magang",
		roles: ["superadmin"],
	},
	{
		icon: ShieldCheck,
		label: "Panel Keputusan Final",
		href: "/dashboard/evaluator",
		roles: ["superadmin"],
	},
	{
		icon: UserCog,
		label: "Pengelolaan Pengguna",
		href: "/dashboard/users",
		roles: ["superadmin", "akademik"],
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
	const context = searchParams.get("context");
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

	const visibleItems: SidebarItem[] = [];
	if (mounted && user?.role) {
		SIDEBAR_ITEMS.forEach((item) => {
			if (user.role === "superadmin") {
				if (item.roles.includes(user.role)) visibleItems.push(item);
			} else {
				if (item.subItems) {
					const allowed = item.subItems.filter((sub) =>
						sub.roles.includes(user.role!),
					);
					allowed.forEach((sub) => {
						visibleItems.push({
							icon: sub.icon || item.icon,
							label: sub.label,
							href: sub.href,
							roles: sub.roles,
						});
					});
				} else {
					if (item.roles.includes(user.role)) visibleItems.push(item);
				}
			}
		});
	}

	const moduleItems = visibleItems.filter(
		(item) =>
			!["Dashboard", "Semua Mahasiswa", "Pengaturan"].includes(item.label),
	);
	const mainItems = visibleItems.filter((item) =>
		["Dashboard", "Semua Mahasiswa"].includes(item.label),
	);
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
					collapsed ? "w-16" : "w-60",
					// Mobile: slide in from left
					mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
				)}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 shrink-0">
					{!collapsed && (
						<span className="font-bold text-lg text-slate-900 tracking-tight">
							Nusadaya<span className="font-light text-[#0517B0]">Academy</span>
						</span>
					)}
					{collapsed && (
						<div className="w-8 h-8 rounded-lg bg-[#0517B0] flex items-center justify-center mx-auto">
							<span className="font-bold text-white text-sm">N</span>
						</div>
					)}
					{/* Mobile Close Button */}
					{mobileOpen && !collapsed && (
						<button
							type="button"
							onClick={onClose}
							className="lg:hidden text-slate-500 hover:text-slate-900"
						>
							<X className="h-5 w-5" />
						</button>
					)}
				</div>

				{/* Nav Items */}
				<div className="flex-1 overflow-y-auto py-4 space-y-1 px-2 flex flex-col">
					{/* Main items */}
					{mainItems.length > 0 && (
						<>
							{!collapsed && (
								<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-2 mb-2">
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
								/>
							))}
						</>
					)}

					{/* Module items */}
					{moduleItems.length > 0 && (
						<>
							{!collapsed && (
								<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-2 mb-2 mt-4">
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
								/>
							))}
						</>
					)}
				</div>

				{/* Footer Nav */}
				<div className="border-t border-slate-200 py-3 px-2 space-y-1 shrink-0">
					{settingsItem && (
						<NavItem
							item={settingsItem}
							pathname={pathname}
							context={context}
							collapsed={collapsed}
						/>
					)}
					<button
						type="button"
						className={cn(
							"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150",
							collapsed && "justify-center",
						)}
						onClick={handleLogout}
					>
						<LogOut className="h-5 w-5 shrink-0" />
						{!collapsed && <span className="text-sm font-medium">Keluar</span>}
					</button>
				</div>
			</aside>
		</>
	);
}

function checkItemActive(
	href: string | undefined,
	pathname: string,
	context: string | null,
): boolean {
	if (!href) return false;

	if (context && pathname.startsWith("/dashboard/students/")) {
		if (href === "/dashboard/students") {
			return false;
		}
		if (href === `/dashboard/${context}`) {
			return true;
		}
		if (
			context === "final-decision" &&
			(href === "/dashboard/evaluator" || href === "/dashboard/finalisasi")
		) {
			return true;
		}
		return false;
	}

	if (href === "/dashboard") {
		return pathname === "/dashboard";
	}

	if (href === "/dashboard/mata-kuliah") {
		return (
			(pathname === "/dashboard/mata-kuliah" ||
				pathname.startsWith("/dashboard/mata-kuliah/")) &&
			!pathname.startsWith("/dashboard/mata-kuliah/rekap")
		);
	}

	if (href === "/dashboard/akademik") {
		return (
			(pathname === "/dashboard/akademik" ||
				pathname.startsWith("/dashboard/akademik/")) &&
			!pathname.startsWith("/dashboard/akademik/pa")
		);
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
	item,
	pathname,
	context,
	collapsed,
}: {
	item: SidebarItem;
	pathname: string;
	context: string | null;
	collapsed: boolean;
}) {
	const { user } = useAuthStore();
	const [isOpen, setIsOpen] = useState(false);

	const isSubActive = item.subItems?.some((sub) =>
		checkItemActive(sub.href, pathname, context),
	);

	useEffect(() => {
		if (isSubActive) setIsOpen(true);
	}, [isSubActive]);

	const isActive = checkItemActive(item.href, pathname, context);

	const Icon = item.icon;

	if (item.subItems) {
		const visibleSubItems = item.subItems.filter(
			(sub) => user?.role && sub.roles.includes(user.role),
		);
		if (visibleSubItems.length === 0) return null;

		return (
			<div className="flex flex-col space-y-1">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className={cn(
						"flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-150 group",
						isSubActive
							? "bg-blue-50/50 text-[#0517B0] font-medium"
							: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
						collapsed && "justify-center px-0",
					)}
				>
					<div className="flex items-center gap-3">
						<Icon
							className={cn(
								"h-5 w-5 shrink-0",
								isSubActive ? "text-[#0517B0]" : "",
							)}
						/>
						{!collapsed && (
							<span className="text-sm font-medium">{item.label}</span>
						)}
					</div>
					{!collapsed && (
						<ChevronDown
							className={cn(
								"w-4 h-4 transition-transform duration-200 text-slate-400",
								isOpen ? "rotate-180" : "",
							)}
						/>
					)}
				</button>

				{!collapsed && isOpen && (
					<div className="pl-9 pr-2 space-y-1 mt-1">
						{visibleSubItems.map((sub) => {
							const isSubItemActive = checkItemActive(
								sub.href,
								pathname,
								context,
							);
							return (
								<Link
									key={sub.href}
									href={sub.href}
									className={cn(
										"block w-full text-sm px-3 py-2 rounded-md transition-all duration-150",
										isSubItemActive
											? "bg-blue-50 text-[#0517B0] font-medium border-l-[3px] border-[#0517B0] pl-[9px]"
											: "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
									)}
								>
									{sub.label}
								</Link>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	return (
		<Link
			href={item.href!}
			className={cn(
				"flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
				isActive
					? "bg-blue-50 text-[#0517B0] border-l-[3px] border-[#0517B0] pl-[9px]"
					: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
				collapsed && "justify-center",
			)}
		>
			<Icon className="h-5 w-5 shrink-0" />
			{!collapsed && <span className="text-sm font-medium">{item.label}</span>}
		</Link>
	);
}
