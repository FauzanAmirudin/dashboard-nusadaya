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
	createdAt: string;
	updatedAt?: string;
	createdByUser?: { fullName: string; username: string } | null;
}

export interface HafalanFormState {
	language: string;
	languageCustom: string;
	vocabCount: number | string;
	sentenceCount: number | string;
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
