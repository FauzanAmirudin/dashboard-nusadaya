"use client";

import { LogOut, User, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export function MahasiswaHeader() {
	const { user, logout } = useAuthStore();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	const [studentData, setStudentData] = useState<any>(null);
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	useEffect(() => {
		setMounted(true);

		const fetchMe = async () => {
			if (user?.role === "mahasiswa") {
				const res = await api.mahasiswa.me.get();
				if (res.data?.success) {
					setStudentData(res.data.data);
				}
			}
		};
		fetchMe();
	}, [user]);

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await api.auth.logout.post();
			logout();
			router.push("/login");
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoggingOut(false);
			setShowLogoutDialog(false);
		}
	};

	if (!mounted) return null;

	return (
		<>
			<header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-8">
						<Link
							href="/mahasiswa/dashboard"
							className="flex items-center gap-2"
						>
							<Image
								src="/logonusadaya.png"
								alt="Nusadaya Logo"
								width={32}
								height={32}
							/>
							<span className="font-bold text-slate-800 hidden sm:inline-block">
								Nusadaya Portal
							</span>
						</Link>
					</div>

					<div className="flex items-center gap-4">
						{studentData && (
							<DropdownMenu>
								<DropdownMenuTrigger className="flex items-center gap-3 mr-2 outline-none hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
									<div className="hidden sm:block text-right">
										<p className="text-sm font-semibold text-slate-800 leading-tight">
											{studentData.name}
										</p>
										<p className="text-xs text-slate-500">{studentData.nim}</p>
									</div>
									<Avatar className="h-9 w-9 border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity">
										<AvatarImage
											src={
												studentData.profilePhotoUrl
													? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${studentData.profilePhotoUrl}`
													: ""
											}
										/>
										<AvatarFallback className="bg-blue-50 text-[#0517B0]">
											<User className="h-4 w-4" />
										</AvatarFallback>
									</Avatar>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuGroup>
										<DropdownMenuLabel>Akun Mahasiswa</DropdownMenuLabel>
									</DropdownMenuGroup>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => router.push("/mahasiswa/profil")}
									>
										<UserCircle className="w-4 h-4 mr-2 text-slate-500" />
										Profil & Pengaturan
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-rose-600 focus:text-rose-700 cursor-pointer"
										onClick={() => setShowLogoutDialog(true)}
									>
										<LogOut className="w-4 h-4 mr-2" />
										Keluar
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</div>
			</header>

			{/* LOGOUT CONFIRMATION DIALOG */}
			<AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
						<AlertDialogDescription>
							Apakah Anda yakin ingin keluar dari portal? Anda harus memasukkan
							kredensial login Anda lagi untuk mengakses aplikasi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoggingOut}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleLogout();
							}}
							disabled={isLoggingOut}
							className="bg-rose-600 hover:bg-rose-700 text-white"
						>
							{isLoggingOut ? "Keluar..." : "Ya, Keluar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
