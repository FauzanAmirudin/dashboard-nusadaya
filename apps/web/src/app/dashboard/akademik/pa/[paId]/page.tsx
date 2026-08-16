"use client";

import { useParams } from "next/navigation";
import { PADetailView } from "@/components/panels/akademik/pa/PADetailView";

export default function AkademikPADetailPage() {
	const params = useParams();
	const paId = Number(params.paId);
	return <PADetailView paId={paId} />;
}
