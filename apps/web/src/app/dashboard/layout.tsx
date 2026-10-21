"use client";

import { Suspense, useState } from "react";
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
		<div className="flex h-screen bg-[#F8FAFF] overflow-hidden print:h-auto print:overflow-visible print:block print:bg-white">
			<div className="print:hidden">
				<Suspense fallback={<div className="w-60 h-screen bg-white" />}>
					<Sidebar
						collapsed={collapsed}
						mobileOpen={mobileOpen}
						onClose={() => setMobileOpen(false)}
					/>
				</Suspense>
			</div>
			<div className="flex flex-col flex-1 overflow-hidden min-w-0 print:h-auto print:overflow-visible print:block">
				<div className="print:hidden">
					<Navbar onToggleSidebar={handleToggleSidebar} />
				</div>
				<main className="flex-1 overflow-y-auto p-6 print:p-0 print:m-0 print:overflow-visible print:block">
					{children}
				</main>
			</div>
		</div>
	);
}
