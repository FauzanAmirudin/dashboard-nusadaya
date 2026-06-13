"use client";

import { useEffect, useState } from "react";
import {
	BookOpen,
	CheckSquare,
	ClipboardList,
	GraduationCap,
	HeartHandshake,
	LayoutDashboard,
	LogOut,
	PhoneCall,
	Plane,
	Settings,
	Users,
	Wallet,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

interface SidebarItem {
	icon: React.ElementType;
	label: string;
	href: string;
	roles: string[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
	{
		icon: LayoutDashboard,
		label: "Dashboard",
		href: "/dashboard",
		roles: ["superadmin", "pmb", "crm", "finance", "akademik", "dosen", "pa", "magang", "evaluator"],
	},
	{
		icon: Users,
		label: "Semua Mahasiswa",
		href: "/dashboard/students",
		roles: ["superadmin", "pmb", "crm", "finance", "akademik", "dosen", "pa", "magang", "evaluator"],
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
		label: "Panel Akademik",
		href: "/dashboard/akademik",
		roles: ["superadmin"],
	},
	{
		icon: BookOpen,
		label: "Panel Dosen",
		href: "/dashboard/dosen",
		roles: ["superadmin"],
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
		icon: CheckSquare,
		label: "Panel Evaluator",
		href: "/dashboard/evaluator",
		roles: ["superadmin"],
	},
	{
		icon: Settings,
		label: "Pengaturan",
		href: "/dashboard/settings",
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

	const visibleItems = SIDEBAR_ITEMS.filter(
		(item) => mounted && user?.role && item.roles.includes(user.role),
	);

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
							Nusadaya<span className="font-light text-[#0517B0]">.</span>
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
				<TooltipProvider delay={0}>
					<nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
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
										key={item.href}
										item={item}
										pathname={pathname}
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
								{collapsed && (
									<div className="my-3 border-t border-slate-200" />
								)}
								{moduleItems.map((item) => (
									<NavItem
										key={item.href}
										item={item}
										pathname={pathname}
										collapsed={collapsed}
									/>
								))}
							</>
						)}
					</nav>

					{/* Footer Nav */}
					<div className="border-t border-slate-200 py-3 px-2 space-y-1 shrink-0">
						{settingsItem && (
							<NavItem
								item={settingsItem}
								pathname={pathname}
								collapsed={collapsed}
							/>
						)}
						<Tooltip>
							<TooltipTrigger
								render={<button type="button" />}
								className={cn(
									"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-150",
									collapsed && "justify-center",
								)}
								onClick={handleLogout}
							>
								<LogOut className="h-5 w-5 shrink-0" />
								{!collapsed && (
									<span className="text-sm font-medium">Keluar</span>
								)}
							</TooltipTrigger>
							{collapsed && (
								<TooltipContent side="right">Keluar</TooltipContent>
							)}
						</Tooltip>
					</div>
				</TooltipProvider>
			</aside>
		</>
	);
}

function NavItem({
	item,
	pathname,
	collapsed,
}: {
	item: SidebarItem;
	pathname: string;
	collapsed: boolean;
}) {
	const isActive =
		item.href === "/dashboard"
			? pathname === "/dashboard"
			: pathname === item.href || pathname.startsWith(`${item.href}/`);
	const Icon = item.icon;

	return (
		<Tooltip>
			<TooltipTrigger
				render={<Link href={item.href} />}
				className={cn(
					"flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
					isActive
						? "bg-blue-50 text-[#0517B0] border-l-[3px] border-[#0517B0] pl-[9px]"
						: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
					collapsed && "justify-center",
				)}
			>
				<Icon className="h-5 w-5 shrink-0" />
				{!collapsed && (
					<span className="text-sm font-medium">{item.label}</span>
				)}
			</TooltipTrigger>
			{collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
		</Tooltip>
	);
}
