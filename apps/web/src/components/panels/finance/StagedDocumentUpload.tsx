"use client";

import { Eye, FileText, Paperclip, Trash2, UploadCloud } from "lucide-react";
import React, { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/eden";

export interface StagedDocUploadProps {
	docKey: string;
	isEditing: boolean;
	canEdit: boolean;
	existingDocs?: any[];
	stagedFile?: File | null;
	isDeleted?: boolean;
	onStageFile: (file: File) => void;
	onRemoveStagedFile: () => void;
	onDeleteExistingDoc: () => void;
	onRestoreExistingDoc: () => void;
}

export function StagedDocumentUpload({
	isEditing,
	canEdit,
	existingDocs,
	stagedFile,
	isDeleted,
	onStageFile,
	onRemoveStagedFile,
	onDeleteExistingDoc,
	onRestoreExistingDoc,
}: StagedDocUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const latestDoc =
		existingDocs && existingDocs.length > 0 ? existingDocs[0] : null;

	if (stagedFile) {
		return (
			<div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
				<div className="flex items-center gap-2 text-xs font-medium text-emerald-800 truncate">
					<Paperclip className="w-4 h-4 text-emerald-600 flex-shrink-0" />
					<span className="truncate font-semibold">{stagedFile.name}</span>
					<span className="text-[10px] text-emerald-600">
						({(stagedFile.size / 1024).toFixed(1)} KB)
					</span>
					<Badge className="bg-emerald-200/80 text-emerald-800 border-0 text-[9px] py-0 px-1.5 h-4 font-semibold">
						Draft Baru
					</Badge>
				</div>
				{isEditing && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
						onClick={onRemoveStagedFile}
					>
						<Trash2 className="w-3.5 h-3.5 mr-1" /> Batalkan
					</Button>
				)}
			</div>
		);
	}

	if (isDeleted) {
		return (
			<div className="flex items-center justify-between p-3 bg-rose-50/70 border border-dashed border-rose-200 rounded-lg">
				<div className="flex items-center gap-2 text-xs font-medium text-rose-700">
					<Trash2 className="w-4 h-4 flex-shrink-0" />
					<span className="italic">Berkas ditandai untuk dihapus (Draft)</span>
				</div>
				{isEditing && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-100"
						onClick={onRestoreExistingDoc}
					>
						Batalkan Hapus
					</Button>
				)}
			</div>
		);
	}

	if (latestDoc) {
		return (
			<div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
				<div className="flex items-center gap-2 text-xs font-medium text-slate-700 truncate">
					<FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
					<span className="truncate font-medium">
						{latestDoc.fileName || "Berkas Terlampir"}
					</span>
					{latestDoc.fileSize && (
						<span className="text-[10px] text-slate-400">
							({(latestDoc.fileSize / 1024).toFixed(1)} KB)
						</span>
					)}
				</div>
				<div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
					<a
						href={`${API_URL}${latestDoc.fileUrl.startsWith("/") ? "" : "/"}${latestDoc.fileUrl}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
					>
						<Eye className="w-3.5 h-3.5" /> Lihat Berkas
					</a>
					{isEditing && canEdit && (
						<>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100"
								onClick={() => fileInputRef.current?.click()}
							>
								Ganti
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
								onClick={onDeleteExistingDoc}
							>
								<Trash2 className="w-3.5 h-3.5" />
							</Button>
							<input
								ref={fileInputRef}
								type="file"
								accept="application/pdf,image/*"
								className="hidden"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) onStageFile(f);
								}}
							/>
						</>
					)}
				</div>
			</div>
		);
	}

	if (!isEditing) {
		return (
			<div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400 italic">
				Belum ada berkas terunggah
			</div>
		);
	}

	return (
		<div>
			<input
				ref={fileInputRef}
				type="file"
				accept="application/pdf,image/*"
				className="hidden"
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) onStageFile(f);
				}}
			/>
			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 rounded-lg transition-colors text-xs font-medium text-slate-600 hover:text-blue-700 cursor-pointer"
			>
				<UploadCloud className="w-4 h-4 text-slate-400" />
				<span>Pilih Berkas (PDF / Gambar)</span>
			</button>
		</div>
	);
}
