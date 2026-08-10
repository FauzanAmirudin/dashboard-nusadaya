# Dokumentasi Pembaruan Sistem Pembayaran & Dana Talangan (Finance)
**Dashboard Nusadaya (v2.1)**

Sistem pembayaran administrasi mahasiswa di Dashboard Nusadaya telah mengalami perombakan besar untuk meningkatkan fleksibilitas kasir (Finance) dan mengakomodasi skenario pembayaran yang kompleks, termasuk pelunasan multi-semester dan penundaan via Dana Talangan.

---

## 1. Perombakan Arsitektur Pembayaran (Global vs Per-Semester)

Pada versi sebelumnya, fitur pembayaran sangat kaku karena mengusung konsep "Cicilan" yang dibatasi maksimal 6 kali per-semester. Pendekatan ini diubah total menjadi lebih global dan luwes.

### A. Terminologi "Pembayaran" (Bukan Cicilan)
Istilah "Cicilan" telah dihapus secara komprehensif dari seluruh UI maupun pesan error/sukses (Toast). 
- Mahasiswa mungkin tidak mencicil, melainkan langsung membayar lunas (Mandiri). Penggunaan istilah **"Pembayaran"** memberikan konteks yang lebih tepat secara akuntansi.

### B. Penghapusan Limitasi Sistem
Sistem logika yang mengunci maksimal 6 kali transaksi telah dihapus sepenuhnya di sisi Backend API (`finance.ts`) maupun Frontend (`TabKeuangan.tsx`). 
- Finance kini dapat memasukkan riwayat pembayaran sebanyak apapun yang dibutuhkan mahasiswa hingga total tagihan terpenuhi.

---

## 2. Fitur Baru: Pembayaran Multi-Semester (Otomatis)

Untuk mempermudah Finance saat mahasiswa membayar dalam nominal yang sangat besar (lebih dari total tagihan 1 semester), fitur **Pembayaran Multi-Semester** telah ditambahkan.

### A. UI Pembayaran Sekaligus
Terdapat tombol baru **`+ Pembayaran Multi-Semester`** di bagian header "Pembayaran 6 Semester".
Tombol ini akan membuka modal khusus di mana Finance cukup memasukkan satu total nominal besar (misalnya: Rp 15.000.000).

### B. Otomatisasi Distribusi (Cascading Allocation)
Sistem (Backend API `bulk-payment`) akan mendistribusikan uang tersebut secara otomatis dengan algoritma _waterfall_:
1. Sistem menarik data seluruh 6 semester milik mahasiswa, diurutkan dari Semester 1 ke Semester 6.
2. Uang dialokasikan untuk melunasi tagihan Semester 1 terlebih dahulu.
3. Sistem secara otomatis mencatatkan baris transaksi ke dalam Riwayat Pembayaran Semester 1 dengan keterangan otomatis _"Pembayaran Multi-Semester"_.
4. Jika ada kembalian/sisa (sisa nominal > 0), sisa tersebut akan diturunkan untuk melunasi Semester 2, kemudian ke Semester 3, dan seterusnya sampai nominal habis.
5. Status tiap semester akan terhitung dan diperbarui secara *real-time* menjadi `LUNAS`, `SEBAGIAN`, atau `BELUM_BAYAR`.

---

## 3. Mekanisme Baru Dana Talangan

Skema "Dana Talangan" juga disederhanakan dari yang sebelumnya ada di dalam form cicilan per baris transaksi, menjadi **Label Status di tingkat Semester**.

### A. Toggle Talangan per Semester
Di UI setiap *Card* Semester, terdapat *toggle switch* bertuliskan **"Ubah Menjadi Dana Talangan"**.
- Jika diaktifkan, Semester tersebut akan dilabeli dengan lencana ungu **"Menunggu Talangan"** (`isTalangan = true` di database).
- Riwayat pembayaran di dalamnya **tidak dikunci**. Hal ini memungkinkan pihak Finance untuk memasukkan uang pembayaran secara fisik ke dalam semester tersebut ketika dana dari pihak sponsor/talangan sudah cair.

### B. Intersepsi Otomatis (Pembatalan Talangan)
Dalam fitur *Pembayaran Multi-Semester*, jika sistem mendistribusikan aliran dana mahasiswa (Mandiri) dan dana tersebut mengenai Semester yang sedang berstatus **Menunggu Talangan**, maka:
- Uang tersebut tetap dipakai untuk melunasi semester tersebut.
- Sistem secara cerdas akan **mematikan** status talangannya (`isTalangan` dikembalikan ke `false`), mengartikan bahwa mahasiswa telah melunasi tagihan tersebut secara mandiri sebelum dana talangan cair.

---

## 4. Keamanan & Hak Akses (Role Based Access)

Seluruh logika operasi perubahan data, penambahan pembayaran tunggal, maupun distribusi multi-semester dienkapsulasi dengan ketat:
- Akses dan visibilitas tombol dibatasi hanya untuk *Role* **`finance`** dan **`superadmin`**.
- Sistem me- *render* tampilan *(View Only)* bagi *Role* lain (misalnya staf akademik) untuk mencegah kesalahan entri keuangan.

---

**Tanggal Perubahan:** 10 Agustus 2026
**Area Terdampak:** `apps/api/src/routes/student/finance.ts`, `apps/web/src/components/panels/finance/TabKeuangan.tsx`.
