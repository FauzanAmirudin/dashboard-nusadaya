import { create } from "zustand";

export type FinanceChartViewMode =
	| "target_vs_realisasi"
	| "trend_composed"
	| "radial_capaian"
	| "cohort_comparison";

export interface FinanceChartState {
	// Mode Tampilan Grafik
	viewMode: FinanceChartViewMode;
	setViewMode: (mode: FinanceChartViewMode) => void;

	// Toggle Metrik Visibilitas
	showTarget: boolean;
	showRealisasi: boolean;
	showPercentageLine: boolean;
	toggleTarget: () => void;
	toggleRealisasi: () => void;
	togglePercentageLine: () => void;

	// Interactive Highlight & Hover
	hoveredCategory: string | null;
	setHoveredCategory: (category: string | null) => void;

	// Format Skala Angka
	scaleFormat: "compact" | "full";
	setScaleFormat: (format: "compact" | "full") => void;

	// Reset ke default
	resetPreferences: () => void;
}

export const useFinanceChartStore = create<FinanceChartState>((set) => ({
	viewMode: "target_vs_realisasi",
	setViewMode: (viewMode) => set({ viewMode }),

	showTarget: true,
	showRealisasi: true,
	showPercentageLine: true,
	toggleTarget: () => set((state) => ({ showTarget: !state.showTarget })),
	toggleRealisasi: () =>
		set((state) => ({ showRealisasi: !state.showRealisasi })),
	togglePercentageLine: () =>
		set((state) => ({ showPercentageLine: !state.showPercentageLine })),

	hoveredCategory: null,
	setHoveredCategory: (hoveredCategory) => set({ hoveredCategory }),

	scaleFormat: "compact",
	setScaleFormat: (scaleFormat) => set({ scaleFormat }),

	resetPreferences: () =>
		set({
			viewMode: "target_vs_realisasi",
			showTarget: true,
			showRealisasi: true,
			showPercentageLine: true,
			hoveredCategory: null,
			scaleFormat: "compact",
		}),
}));
