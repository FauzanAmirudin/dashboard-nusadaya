"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
	currentPage?: number;
	page?: number;
	totalItems?: number;
	totalCount?: number;
	pageSize?: number;
	onPageChange: (page: number) => void;
	onPageSizeChange?: (size: number) => void;
	pageSizeOptions?: number[];
	itemName?: string;
}

export function TablePagination({
	currentPage,
	page,
	totalItems,
	totalCount,
	pageSize = 20,
	onPageChange,
	onPageSizeChange,
	pageSizeOptions,
	itemName = "Data",
}: TablePaginationProps) {
	const activePage = Math.max(1, currentPage ?? page ?? 1);
	const count = Math.max(0, totalItems ?? totalCount ?? 0);
	const size = Math.max(1, pageSize);
	const totalPages = Math.max(1, Math.ceil(count / size));

	if (count <= 0) return null;

	const startItem = Math.max(1, (activePage - 1) * size + 1);
	const endItem = Math.min(activePage * size, count);

	// Generate visible page numbers
	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			if (activePage <= 3) {
				pages.push(1, 2, 3, 4, "...", totalPages);
			} else if (activePage >= totalPages - 2) {
				pages.push(
					1,
					"...",
					totalPages - 3,
					totalPages - 2,
					totalPages - 1,
					totalPages,
				);
			} else {
				pages.push(
					1,
					"...",
					activePage - 1,
					activePage,
					activePage + 1,
					"...",
					totalPages,
				);
			}
		}
		return pages;
	};

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white/80">
			<div className="text-xs text-slate-500 font-medium">
				Menampilkan{" "}
				<span className="font-bold text-slate-700">{startItem}</span> -{" "}
				<span className="font-bold text-slate-700">{endItem}</span> dari{" "}
				<span className="font-bold text-slate-900">{count}</span> {itemName}
			</div>

			<div className="flex items-center gap-1.5">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(activePage - 1)}
					disabled={activePage <= 1}
					className="h-8 px-2.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40"
				>
					<ChevronLeft className="w-3.5 h-3.5 mr-1" />
					Sebelumnya
				</Button>

				<div className="hidden sm:flex items-center gap-1">
					{getPageNumbers().map((p, idx) =>
						p === "..." ? (
							<span
								key={`ellipsis-${idx}`}
								className="px-2 text-xs text-slate-400 font-bold"
							>
								...
							</span>
						) : (
							<Button
								key={`page-${p}`}
								variant={activePage === p ? "default" : "outline"}
								size="sm"
								onClick={() => onPageChange(Number(p))}
								className={`h-8 w-8 p-0 text-xs font-semibold ${
									activePage === p
										? "bg-[#0517B0] hover:bg-blue-800 text-white"
										: "text-slate-600 border-slate-200 hover:bg-slate-50"
								}`}
							>
								{p}
							</Button>
						),
					)}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(activePage + 1)}
					disabled={activePage >= totalPages}
					className="h-8 px-2.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40"
				>
					Selanjutnya
					<ChevronRight className="w-3.5 h-3.5 ml-1" />
				</Button>
			</div>
		</div>
	);
}
