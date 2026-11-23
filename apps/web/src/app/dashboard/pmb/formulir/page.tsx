"use client";

import { FormMahasiswaModule } from "@/components/dashboards/pmb/FormMahasiswaModule";
import { hasRole, useAuthStore } from "@/store";

export default function PmbFormulirPage() {
	const { user, hasHydrated } = useAuthStore();

	if (!hasHydrated) return null;

	if (!hasRole(user, "superadmin", "pmb")) {
		return (
			<div className="max-w-md mx-auto my-12 p-6 text-center bg-white rounded-xl border border-slate-200">
				<h2 className="text-lg font-bold text-slate-900">Akses Ditolak</h2>
				<p className="text-sm text-slate-500 mt-1">
					Akun Anda tidak memiliki izin untuk mengakses Panel PMB.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-12">
			<div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
				<h1 className="text-2xl font-bold text-slate-900">
					Formulir Registrasi Online
				</h1>
				<p className="text-slate-500 text-xs sm:text-sm mt-0.5">
					Kelola formulir pendaftaran, tinjau respons calon mahasiswa, dan
					riwayat respons.
				</p>
			</div>
			<FormMahasiswaModule />
		</div>
	);
}
