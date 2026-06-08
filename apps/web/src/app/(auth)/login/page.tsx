"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/eden";
import { useAuthStore } from "@/store";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const router = useRouter();
	const login = useAuthStore((state) => state.login);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			const { data, error: apiError } = await api.auth.login.post({
				username,
				password,
			});

			if (apiError || !data?.success) {
				setError("Login failed. Please check your credentials.");
				return;
			}

			login(data.user);
			router.push("/dashboard");
		} catch (_err) {
			setError("An unexpected error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
				<div className="text-center mb-8">
					<h1 className="text-2xl font-bold text-gray-900">
						Dashboard Nusadaya
					</h1>
					<p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
				</div>

				{error && (
					<div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="username"
							className="block text-sm font-medium text-gray-700"
						>
							Username
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							required
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
					>
						{isLoading ? "Signing in..." : "Sign in"}
					</button>
				</form>

				<div className="mt-6 text-xs text-gray-500 text-center">
					Available roles for testing: superadmin, pmb, crm, finance, akademik,
					dosen, pa, magang, evaluator
				</div>
			</div>
		</div>
	);
}
