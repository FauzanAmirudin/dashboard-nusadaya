"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RegistrationFormDocument } from "@/components/common/RegistrationFormDocument";
import { authFetch } from "@/lib/eden";

export default function ResponseDocumentPage() {
	const { id } = useParams<{ id: string }>();
	const [data, setData] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let alive = true;
		authFetch(`/pmb/form-responses/${id}`)
			.then((r) => r.json())
			.then((res) => {
				if (!alive) return;
				if (res.success) setData(res.data);
				else setError(res.message || "Data pendaftar tidak ditemukan.");
			})
			.catch(() => alive && setError("Gagal memuat data."));
		return () => {
			alive = false;
		};
	}, [id]);

	if (error) {
		return <p className="p-6 text-center text-sm text-slate-600">{error}</p>;
	}
	if (!data) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#0517B0]" />
			</div>
		);
	}
	return <RegistrationFormDocument data={data} />;
}
