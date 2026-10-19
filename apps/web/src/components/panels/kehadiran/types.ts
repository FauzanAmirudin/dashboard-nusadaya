export type KehadiranTabKey = "all-service" | "kuliah" | "piket" | "baris-pagi";

export interface AllServiceStudentItem {
	id: number;
	nim: string;
	name: string;
	cohort: number;
	rombel: string;
	program: string;
	subProgram: string;
	kuliah: {
		totalMeetings: number;
		presentCount: number;
		rate: number;
	};
	piket: {
		totalSessions: number;
		presentCount: number;
		rate: number;
	};
	barisPagi: {
		totalSessions: number;
		tepatWaktuCount: number;
		terlambatCount: number;
		rate: number;
	};
	allServiceScore: number;
	allServiceStatus: "DISIPLIN" | "PERLU_PEMBINAAN" | "KRITIS";
}

export function getInitials(name: string): string {
	if (!name) return "M";
	const parts = name
		.replace(/^(Drs\.|Dr\.|Prof\.|Ir\.|H\.|Hj\.)\s+/i, "")
		.split(" ")
		.filter(Boolean);
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}
