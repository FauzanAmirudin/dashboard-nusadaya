export const formatRupiah = (angka: number) => {
	return "Rp " + new Intl.NumberFormat("id-ID").format(angka || 0);
};
