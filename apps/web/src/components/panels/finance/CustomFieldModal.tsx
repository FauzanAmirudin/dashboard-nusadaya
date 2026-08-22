"use client";

import { Loader2, Plus, Sparkles } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomFieldModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	fieldType: string;
	fieldLabel: string;
	setFieldLabel: (val: string) => void;
	isAdding: boolean;
	onConfirm: () => void;
}

export function CustomFieldModal({
	open,
	onOpenChange,
	fieldType,
	fieldLabel,
	setFieldLabel,
	isAdding,
	onConfirm,
}: CustomFieldModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-slate-900">
						<Sparkles className="w-5 h-5 text-indigo-600" />
						Tambah Pos Biaya Tambahan Baru
					</DialogTitle>
					<DialogDescription className="text-xs text-slate-500">
						Masukkan nama pos biaya yang ingin ditambahkan ke daftar biaya
						mahasiswa.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div>
						<Label className="text-xs font-semibold text-slate-700">
							Nama / Label Pos Biaya <span className="text-rose-500">*</span>
						</Label>
						<Input
							value={fieldLabel}
							onChange={(e) => setFieldLabel(e.target.value)}
							placeholder="Contoh: Asuransi Tambahan, MCU Lanjutan, Visa Khusus"
							className="mt-1 text-sm font-medium"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									onConfirm();
								}
							}}
						/>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						disabled={isAdding}
						className="text-xs"
					>
						Batal
					</Button>
					<Button
						size="sm"
						onClick={onConfirm}
						disabled={isAdding || !fieldLabel.trim()}
						className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
					>
						{isAdding ? (
							<Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
						) : (
							<Plus className="w-3.5 h-3.5 mr-1.5" />
						)}
						Tambah Pos Biaya
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
