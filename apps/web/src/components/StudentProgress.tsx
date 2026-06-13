"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/eden";
import { Progress } from "@/components/ui/progress";

export function StudentProgress({ studentId }: { studentId: number }) {
	const [total, setTotal] = useState(0);
	const [completed, setCompleted] = useState(0);

	useEffect(() => {
		const fetchStatus = async () => {
			const res = await api.students[studentId.toString()].status.get();
			if (res.data?.success && res.data.data) {
				setTotal(res.data.data.totalIndicators);
				setCompleted(res.data.data.totalCompleted);
			}
		};

		fetchStatus();
		const interval = setInterval(fetchStatus, 30000);
		return () => clearInterval(interval);
	}, [studentId]);

	if (total === 0) {
		return (
			<div className="w-full md:w-64 shrink-0 bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-pulse">
				<div className="h-4 bg-slate-200 rounded w-2/3 mb-3"></div>
				<div className="h-2 bg-slate-200 rounded w-full"></div>
			</div>
		);
	}

	const progressPercent = Math.round((completed / total) * 100);

	return (
		<div className="w-full md:w-64 shrink-0 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
			<div className="flex justify-between items-center mb-2">
				<span className="text-xs font-medium text-slate-700">
					Total Progress Checklist
				</span>
				<span className="text-xs text-slate-500">
					{completed} / {total}
				</span>
			</div>
			<Progress
				value={progressPercent}
				className="h-2 bg-slate-100"
				indicatorClassName="bg-[#0517B0]"
			/>
		</div>
	);
}
