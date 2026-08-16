"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { AssessmentDetailView } from "@/components/panels/akademik/AssessmentDetailView";

function AssessmentDetailContent() {
	const params = useParams();
	const studentId = Number(params.studentId);
	return <AssessmentDetailView studentId={studentId} />;
}

export default function AssessmentDetailPage() {
	return (
		<Suspense
			fallback={
				<div className="p-10 text-center text-slate-500 text-sm">
					Memuat data assessment...
				</div>
			}
		>
			<AssessmentDetailContent />
		</Suspense>
	);
}
