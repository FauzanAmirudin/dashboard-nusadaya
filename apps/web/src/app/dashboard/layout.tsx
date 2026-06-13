"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	const { user } = useAuthStore();
	const isSuperadmin = user?.role === "superadmin";

	const handleToggleSidebar = () => {
		// On mobile, toggle mobileOpen; on desktop toggle collapse
		if (window.innerWidth < 1024) {
			setMobileOpen((prev) => !prev);
		} else {
			setCollapsed((prev) => !prev);
		}
	};

	return (
		<div className="flex h-screen bg-[#F8FAFF] overflow-hidden">
			<Sidebar
				collapsed={collapsed}
				mobileOpen={mobileOpen}
				onClose={() => setMobileOpen(false)}
			/>
			<div className="flex flex-col flex-1 overflow-hidden min-w-0">
				<Navbar onToggleSidebar={handleToggleSidebar} />
				<main className="flex-1 overflow-y-auto p-6">{children}</main>
			</div>
		</div>
	);
}
