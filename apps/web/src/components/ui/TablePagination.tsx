"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
	currentPage: number;
	totalItems: number;
	pageSize?: number;
	onPageChange: (page: number) => void;
	itemName?: string;
}

export function TablePagination({
	currentPage,
	totalItems,
	pageSize = 20,
	onPageChange,
	itemName = "Mahasiswa",
}: TablePaginationProps) {
	const totalPages = Math.ceil(totalItems / pageSize) || 1;

	if (totalItems <= 0) return null;

	const startItem = (currentPage - 1) * pageSize + 1;
	const endItem = Math.min(currentPage * pageSize, totalItems);

	// Generate visible page numbers
	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		if (totalPages <= 5) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			if (currentPage <= 3) {
				pages.push(1, 2, 3, 4, "...", totalPages);
			} else if (currentPage >= totalPages - 2) {
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
					currentPage - 1,
					currentPage,
					currentPage + 1,
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
				<span className="font-bold text-slate-900">{totalItems}</span>{" "}
				{itemName}
			</div>

			<div className="flex items-center gap-1.5">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage <= 1}
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
								variant={currentPage === p ? "default" : "outline"}
								size="sm"
								onClick={() => onPageChange(Number(p))}
								className={`h-8 w-8 p-0 text-xs font-semibold ${
									currentPage === p
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
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
					className="h-8 px-2.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40"
				>
					Selanjutnya
					<ChevronRight className="w-3.5 h-3.5 ml-1" />
				</Button>
			</div>
		</div>
	);
}
