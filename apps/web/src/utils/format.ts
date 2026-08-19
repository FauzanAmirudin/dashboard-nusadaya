export const formatRupiah = (angka: number) => {
	return "Rp " + new Intl.NumberFormat("id-ID").format(angka || 0);
};

export const formatDate = (date: string | Date | null | undefined) => {
	if (!date) return "-";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "-";
	return new Intl.DateTimeFormat("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(d);
};
