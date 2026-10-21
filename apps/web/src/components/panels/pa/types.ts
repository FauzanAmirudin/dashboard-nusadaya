"use client";

export interface PaData {
	counselingDone: boolean;
	mentalStable: boolean;
	disciplineGood: boolean;
	vocabTarget: number;
	disciplineNotes: string | null;
	status: "AMAN" | "PERLU_PERHATIAN" | "TIDAK_AMAN";
	isAcc: boolean;
	accAt: string | null;
	accBy: { fullName: string } | null;
	updatedAt?: string;
}

export interface HafalanSession {
	id: number;
	language: string;
	languageCustom: string | null;
	vocabCount: number;
	sentenceCount: number;
	vocabList?: string[];
	sentenceList?: string[];
	notes?: string | null;
	date?: string;
	createdAt: string;
	updatedAt?: string;
	createdByUser?: { fullName: string; username: string } | null;
}

export interface HafalanFormState {
	language: string;
	languageCustom: string;
	vocabCount: number | string;
	sentenceCount: number | string;
	vocabList?: string[];
	sentenceList?: string[];
	notes?: string;
	date?: string;
}

export interface VocabLog {
	id: number;
	date: string;
	addedWords: number;
	notes: string | null;
}

export interface CounselingLog {
	id: number;
	type?: string;
	date: string;
	notes: string;
	condition: string;
	createdAt?: string;
}

export interface TripartiteLog {
	id: number;
	contactType: string;
	contactName: string | null;
	contactDate: string;
	summary: string;
	result: string | null;
	createdAt?: string;
}

export interface InterviewLog {
	id: number;
	interviewDate: string;
	companyName: string;
	country: string | null;
	result: string;
	notes: string | null;
	createdAt?: string;
}

export interface StudentNote {
	id: number;
	type: string;
	content: string;
	date?: string;
	category?: string;
	createdAt: string;
	updatedAt?: string;
	createdByUser?: { fullName: string; username: string } | null;
}

export interface CounselingFormState {
	type?: string;
	date: string;
	condition: string;
	notes: string;
}

export interface TripartiteFormState {
	contactType: string;
	contactName: string;
	contactDate: string;
	summary: string;
	result: string;
}

export interface InterviewFormState {
	interviewDate: string;
	companyName: string;
	country: string;
	result: string;
	notes: string;
}

export const DISCIPLINE_CATEGORIES: Record<
	string,
	{ label: string; badgeClass: string; iconDesc: string }
> = {
	pelanggaran_ringan: {
		label: "Pelanggaran Ringan",
		badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
		iconDesc: "⚠️ Terlambat, Seragam, Ketidaktertiban",
	},
	pelanggaran_sedang: {
		label: "Pelanggaran Sedang",
		badgeClass: "bg-orange-50 text-orange-800 border-orange-300",
		iconDesc: "⛔ Mangkir, Pelanggaran Jam Malam",
	},
	pelanggaran_berat: {
		label: "Pelanggaran Berat",
		badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
		iconDesc: "🚨 Indisipliner Serius / Etika",
	},
	pembinaan: {
		label: "Peringatan & Pembinaan",
		badgeClass: "bg-blue-50 text-blue-800 border-blue-300",
		iconDesc: "📋 Pembinaan Khusus / SP",
	},
	apresiasi: {
		label: "Apresiasi & Keteladanan",
		badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
		iconDesc: "⭐ Keteladanan & Prestasi Sikap",
	},
	umum: {
		label: "Catatan Umum",
		badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
		iconDesc: "📝 Catatan Harian / Pemantauan",
	},
};

export function getDisciplineCategoryConfig(category?: string | null) {
	if (!category) return DISCIPLINE_CATEGORIES.umum;
	return (
		DISCIPLINE_CATEGORIES[category] || {
			label: category.replace(/_/g, " "),
			badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
			iconDesc: "",
		}
	);
}
