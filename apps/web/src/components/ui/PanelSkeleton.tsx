import { Skeleton } from "./skeleton";

export function PanelSkeleton({ title }: { title?: string }) {
	return (
		<div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in-50 duration-200">
			{/* Header Skeleton */}
			<div className="flex justify-between items-center border-b border-slate-100 pb-4">
				<div className="space-y-2">
					<Skeleton className="h-6 w-48 rounded" />
					<Skeleton className="h-4 w-72 rounded" />
				</div>
				<Skeleton className="h-9 w-28 rounded-lg" />
			</div>

			{/* Form / Content Grid Skeleton */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24 rounded" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-24 rounded" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-24 rounded" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-24 rounded" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
			</div>

			{/* Checklist Items Skeleton */}
			<div className="space-y-3 pt-2">
				<Skeleton className="h-5 w-40 rounded" />
				<div className="space-y-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="p-3 bg-slate-50 rounded-lg flex items-center justify-between"
						>
							<div className="flex items-center gap-3">
								<Skeleton className="h-5 w-5 rounded" />
								<Skeleton className="h-4 w-48 rounded" />
							</div>
							<Skeleton className="h-6 w-20 rounded-full" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
