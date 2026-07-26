"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MahasiswaHeader } from "@/components/mahasiswa/MahasiswaHeader";
import { useAuthStore } from "@/store";

export default function MahasiswaLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, isAuthenticated, hasHydrated } = useAuthStore();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		if (!hasHydrated) return;

		if (!isAuthenticated) {
			router.push("/login");
		} else if (user?.role !== "mahasiswa") {
			router.push("/dashboard");
		}
	}, [user, router, hasHydrated, isAuthenticated]);

	if (
		!mounted ||
		!hasHydrated ||
		!isAuthenticated ||
		user?.role !== "mahasiswa"
	) {
		return (
			<div className="h-screen bg-[#F8FAFF] flex items-center justify-center">
				Memuat portal...
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F8FAFF]">
			<MahasiswaHeader />
			<main className="container mx-auto px-4 py-8 max-w-5xl">{children}</main>
		</div>
	);
}
