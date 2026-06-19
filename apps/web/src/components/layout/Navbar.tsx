"use client";

import { Bell, ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

const ROLE_COLORS: Record<string, string> = {
	superadmin: "bg-blue-100 text-[#0517B0] border-[#0517B0]/30",
	pmb: "bg-sky-100 text-sky-700 border-sky-500/30",
	crm: "bg-violet-100 text-violet-700 border-violet-500/30",
	finance: "bg-emerald-100 text-emerald-700 border-emerald-500/30",
	akademik: "bg-amber-100 text-amber-700 border-amber-500/30",
	dosen: "bg-orange-100 text-orange-700 border-orange-500/30",
	pa: "bg-teal-100 text-teal-700 border-teal-500/30",
	magang: "bg-cyan-100 text-cyan-700 border-cyan-500/30",
	evaluator: "bg-rose-100 text-rose-700 border-rose-500/30",
};

function getInitials(name: string) {
	return name
		.split(" ")
		.slice(0, 2)
		.map((n) => n[0])
		.join("")
		.toUpperCase();
}

interface NavbarProps {
	onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
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

	const roleColorClass =
		mounted && user?.role
			? (ROLE_COLORS[user.role] ?? ROLE_COLORS.superadmin)
			: "";
	const initials =
		mounted && user?.username ? getInitials(user.username) : "NA";

	return (
		<header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 shrink-0">
			{/* Left: Hamburger + Logo */}
			<div className="flex items-center gap-3">
				{onToggleSidebar && (
					<Button
						variant="ghost"
						size="icon"
						type="button"
						onClick={onToggleSidebar}
						className="text-slate-500 hover:text-slate-900 hover:bg-slate-100"
					>
						<Menu className="h-5 w-5" />
					</Button>
				)}
				<span className="font-bold text-lg text-slate-900 tracking-tight hidden sm:block">
					Nusadaya<span className="font-light text-[#0517B0]">Academy</span>
				</span>
			</div>

			{/* Right: Bell + Role Chip + Avatar Dropdown */}
			<div className="flex items-center gap-3">
				{/* Notification Bell Removed */}

				{/* Role Chip */}
				{mounted && user?.role && (
					<span
						className={cn(
							"hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
							roleColorClass,
						)}
					>
						{user.role}
					</span>
				)}

				{/* User Dropdown */}
				<DropdownMenu>
					<DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors outline-none">
						<div className="w-8 h-8 rounded-full bg-[#0517B0] flex items-center justify-center text-white text-xs font-bold shrink-0">
							{initials}
						</div>
						<span className="hidden md:block text-sm text-slate-700 font-medium max-w-[120px] truncate">
							{user?.username}
						</span>
						<ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-48 bg-white border-slate-200 text-slate-800"
					>
						<div className="px-3 py-2">
							<p className="text-sm font-medium text-slate-900 truncate">
								{user?.username}
							</p>
							<p className="text-xs text-slate-500 truncate">{user?.role}</p>
						</div>
						<DropdownMenuSeparator className="bg-slate-200" />
						<DropdownMenuItem className="hover:bg-slate-50 cursor-pointer">
							<User className="mr-2 h-4 w-4" />
							Profil Saya
						</DropdownMenuItem>
						<DropdownMenuSeparator className="bg-slate-200" />
						<DropdownMenuItem
							className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
							onClick={handleLogout}
						>
							<LogOut className="mr-2 h-4 w-4" />
							Keluar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
