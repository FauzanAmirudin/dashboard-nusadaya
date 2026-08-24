import { Skeleton } from "./skeleton";

export function StudentsTableSkeleton({ rows = 10 }: { rows?: number }) {
	return (
		<div className="w-full space-y-4 animate-in fade-in-50 duration-300">
			{/* Filter Header Skeleton */}
			<div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
				<div className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
					<Skeleton className="h-9 w-full rounded-lg" />
				</div>
				<div className="flex gap-2 w-full sm:w-auto">
					<Skeleton className="h-9 w-28 rounded-lg" />
					<Skeleton className="h-9 w-28 rounded-lg" />
					<Skeleton className="h-9 w-24 rounded-lg" />
				</div>
			</div>

			{/* Table Container Skeleton */}
			<div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
				<div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
					<Skeleton className="h-5 w-48 rounded" />
					<Skeleton className="h-5 w-24 rounded" />
				</div>
				<div className="divide-y divide-slate-100">
					{Array.from({ length: rows }).map((_, i) => (
						<div
							key={i}
							className="p-4 flex items-center justify-between gap-4"
						>
							{/* Student Info */}
							<div className="flex items-center gap-3 min-w-[200px] flex-1">
								<Skeleton className="h-10 w-10 rounded-full shrink-0" />
								<div className="space-y-1.5 flex-1">
									<Skeleton className="h-4 w-3/4 rounded" />
									<Skeleton className="h-3 w-1/2 rounded" />
								</div>
							</div>
							{/* Cohort & Badge */}
							<div className="hidden sm:flex items-center gap-2 w-28 justify-center">
								<Skeleton className="h-6 w-20 rounded-full" />
							</div>
							{/* Program */}
							<div className="hidden md:flex items-center gap-2 w-36">
								<Skeleton className="h-6 w-28 rounded-full" />
							</div>
							{/* Status Pills */}
							<div className="flex items-center gap-2 justify-center w-36">
								<Skeleton className="h-6 w-24 rounded-full" />
							</div>
							{/* Actions */}
							<div className="flex items-center gap-2 justify-end w-20">
								<Skeleton className="h-8 w-16 rounded-lg" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
