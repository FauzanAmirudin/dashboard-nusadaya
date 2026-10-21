"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { LeafletMapProps } from "./LeafletMap";

const DynamicLeafletMap = dynamic(() => import("./LeafletMap"), {
	ssr: false,
	loading: () => (
		<div className="w-full h-72 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200 animate-pulse">
			<div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
			<span className="text-xs font-medium">Memuat peta lokasi...</span>
		</div>
	),
});

export function DynamicMap(props: LeafletMapProps) {
	return <DynamicLeafletMap {...props} />;
}
