"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { PAStudentDetailView } from "@/components/panels/akademik/pa/PAStudentDetailView";
import { Loader2 } from "lucide-react";

function Inner() {
	const params = useParams();
	const paId = Number(params.paId);
	const studentId = Number(params.studentId);
	return <PAStudentDetailView paId={paId} studentId={studentId} />;
}

export default function AkademikPAStudentPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center py-24 gap-2 text-slate-400">
					<Loader2 className="w-5 h-5 animate-spin" />
					<span className="text-sm">Memuat...</span>
				</div>
			}
		>
			<Inner />
		</Suspense>
	);
}
