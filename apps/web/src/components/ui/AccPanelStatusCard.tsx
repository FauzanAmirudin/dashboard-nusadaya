"use client";

import { CheckCircle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import type React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDeviceDateTime } from "@/utils/format";

export interface AccPanelStatusCardProps {
	isAcc: boolean;
	accByUser?: string | null;
	accAt?: string | Date | null;
	isReadyForAcc: boolean;
	title: string;
	pendingTitle?: string;
	pendingDescription?: string;
	readyDescription?: string;
	canEdit: boolean;
	isSaving?: boolean;
	onAcc: () => void;
	onCancelAcc: () => void;
	cancelDialogTitle?: string;
	cancelDialogDescription?: string;
	disabledReason?: string;
	className?: string;
}

/**
 * Premium Neumorphic (Soft UI) ACC Panel Status Card
 *
 * Provides a high-end tactile container for division approval workflows
 * with double-bezel geometry, smooth ambient glow, and micro-interactions.
 */
export function AccPanelStatusCard({
	isAcc,
	accByUser,
	accAt,
	isReadyForAcc,
	title,
	pendingTitle,
	pendingDescription,
	readyDescription,
	canEdit,
	isSaving = false,
	onAcc,
	onCancelAcc,
	cancelDialogTitle = "Konfirmasi Pembatalan ACC",
	cancelDialogDescription = "Apakah Anda yakin ingin membatalkan status ACC untuk panel ini? Status akan kembali ke tahap berproses.",
	disabledReason,
	className,
}: AccPanelStatusCardProps) {
	return (
		<div
			className={cn(
				"relative rounded-2xl p-[3px] transition-all duration-500 select-none mt-6",
				className,
			)}
			style={{
				background:
					"linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(226, 232, 240, 0.7) 100%)",
				boxShadow:
					"8px 8px 20px rgba(163, 177, 198, 0.45), -8px -8px 20px rgba(255, 255, 255, 0.95), 0 1px 3px rgba(0, 0, 0, 0.03)",
			}}
		>
			<div
				className="rounded-[calc(1rem-2px)] p-4 sm:p-5 relative overflow-hidden"
				style={{
					backgroundColor: "#f4f7fb",
					boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.95)",
				}}
			>
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Left: Icon & Description */}
					<div className="flex items-start gap-4 min-w-0 flex-1">
						{/* Inset Icon Box */}
						<div
							className={cn(
								"w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-all duration-500",
								isAcc
									? "text-emerald-600"
									: isReadyForAcc
										? "text-[#0517B0]"
										: "text-amber-600",
							)}
							style={{
								backgroundColor: "#f0f4f9",
								boxShadow:
									"inset 3px 3px 6px rgba(163, 177, 198, 0.45), inset -3px -3px 6px rgba(255, 255, 255, 0.95)",
							}}
						>
							{isAcc ? (
								<CheckCircle className="w-6 h-6 text-emerald-600" />
							) : isReadyForAcc ? (
								<CheckCircle2 className="w-6 h-6 text-[#0517B0]" />
							) : (
								<Clock className="w-6 h-6 text-amber-600" />
							)}
						</div>

						<div className="min-w-0 flex-1">
							{isAcc ? (
								<>
									<h4 className="text-slate-900 font-bold text-base sm:text-lg tracking-tight">
										Disetujui ({title}) oleh {accByUser || "Admin"}
									</h4>
									<p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
										Pada {formatDeviceDateTime(accAt)}
									</p>
								</>
							) : (
								<>
									<h4 className="text-slate-900 font-bold text-base sm:text-lg tracking-tight">
										{pendingTitle ||
											(!isReadyForAcc ? "Menunggu Kelengkapan Syarat" : title)}
									</h4>
									<p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
										{!isReadyForAcc
											? pendingDescription ||
												"Selesaikan seluruh indikator dan checklist sebelum memberikan ACC resmi."
											: readyDescription ||
												"Seluruh indikator telah terpenuhi. Anda dapat memberikan persetujuan ACC resmi sekarang."}
									</p>
								</>
							)}
						</div>
					</div>

					{/* Right: Actions */}
					<div className="shrink-0 flex items-center gap-3">
						{canEdit && isAcc && (
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="outline"
											className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs h-9 px-4 cursor-pointer shadow-2xs"
											disabled={isSaving}
										>
											{isSaving ? "Membatalkan..." : "Batalkan ACC"}
										</Button>
									}
								/>
								<AlertDialogContent className="bg-white border-slate-200 text-slate-800">
									<AlertDialogHeader>
										<AlertDialogTitle>{cancelDialogTitle}</AlertDialogTitle>
										<AlertDialogDescription className="text-slate-500 text-xs sm:text-sm">
											{cancelDialogDescription}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<div className="flex justify-end gap-3 mt-4">
										<AlertDialogCancel className="bg-transparent border-slate-200 hover:bg-slate-50">
											Batal
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={onCancelAcc}
											className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
										>
											Ya, Batalkan ACC
										</AlertDialogAction>
									</div>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{canEdit && !isAcc && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger render={<span className="inline-block" />}>
										<span>
											<Button
												onClick={onAcc}
												disabled={!isReadyForAcc || isSaving}
												className="bg-[#0517B0] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm h-10 px-5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<ShieldCheck className="w-4 h-4 mr-2" />
												{isSaving ? "Menyimpan ACC..." : `Beri ${title}`}
											</Button>
										</span>
									</TooltipTrigger>
									{!isReadyForAcc && disabledReason && (
										<TooltipContent className="bg-slate-900 text-white text-xs max-w-xs p-2">
											{disabledReason}
										</TooltipContent>
									)}
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
