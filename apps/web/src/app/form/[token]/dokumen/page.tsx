"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RegistrationFormDocument } from "@/components/common/RegistrationFormDocument";
import { API_URL } from "@/lib/eden";

export default function FormDocumentPage() {
	const { token } = useParams<{ token: string }>();
	const [state, setState] = useState<
		| { status: "loading" }
		| { status: "error"; message: string }
		| { status: "ready"; data: Record<string, unknown> }
	>({ status: "loading" });

	useEffect(() => {
		let alive = true;
		fetch(`${API_URL}/form/${token}`)
			.then((r) => r.json())
			.then((res) => {
				if (!alive) return;
				if (res.valid && res.existingData) {
					setState({ status: "ready", data: res.existingData });
				} else {
					setState({
						status: "error",
						message:
							res.message ||
							"Formulir belum dikirim atau tautan sudah tidak aktif.",
					});
				}
			})
			.catch(() => {
				if (alive)
					setState({ status: "error", message: "Gagal memuat formulir." });
			});
		return () => {
			alive = false;
		};
	}, [token]);

	if (state.status === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#0517B0]" />
			</div>
		);
	}
	if (state.status === "error") {
		return (
			<div className="flex min-h-screen items-center justify-center p-6 text-center">
				<p className="max-w-sm text-sm text-slate-600">{state.message}</p>
			</div>
		);
	}
	return <RegistrationFormDocument data={state.data} />;
}
