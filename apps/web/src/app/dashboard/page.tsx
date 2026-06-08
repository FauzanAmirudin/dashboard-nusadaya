"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function DashboardPage() {
	const router = useRouter();
	const { user, isAuthenticated, logout } = useAuthStore();

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, router]);

	const handleLogout = async () => {
		await api.auth.logout.post();
		logout();
		router.push("/login");
	};

	if (!isAuthenticated || !user) {
		return null; // Will redirect in useEffect
	}

	return (
		<div className="min-h-screen bg-gray-100">
			<nav className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-bold text-gray-900">
								Nusadaya Dashboard
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-500">
								Logged in as{" "}
								<strong className="text-gray-900">{user.username}</strong> (
								{user.role})
							</span>
							<button
								type="button"
								onClick={handleLogout}
								className="text-sm text-red-600 hover:text-red-900 font-medium"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</nav>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center bg-white">
						<div className="text-center">
							<h2 className="text-2xl font-semibold text-gray-700">
								Welcome to {user.role} Module
							</h2>
							<p className="mt-2 text-gray-500">
								This is the central integrated tracking system dashboard.
							</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
