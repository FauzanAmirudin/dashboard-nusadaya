# Temuan Analisis FIN-02: Struktur Baku 4 Termin Biaya & Penyelarasan Istilah
Rujukan: Catatan Revisi FIN-02 & Notulensi Rapat ([Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf](file:///c:/.PROJECT/dashboard-nusadaya/Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf), Segmen 11, 12, & 24)

---

## 1. Temuan Perbedaan & Kesenjangan (Gaps)

| Termin Biaya | Kebutuhan FIN-02 & Rapat (Segmen 11, 12, 24) | Kondisi Sistem Berjalan Sekarang |
| :--- | :--- | :--- |
| **Termin 1** | **Registrasi Awal:** Biaya masuk / pendaftaran awal calon mahasiswa baru. | **Sudah sesuai:** Tercatat di `registrasiNominal`, `registrasiStatus`, dan dilabeli "Registrasi Awal". |
| **Termin 2** | **Pembayaran SPP Semester 1:** Bukan mematok 6 semester sekaligus, melainkan fokus biaya kuliah Semester 1 dengan cicilan bulanan yang fleksibel (Agustus, September, dst.) selama persiapan di kampus. | **Tidak Sesuai:** Masih dilabeli **"Biaya Perkuliahan (6 Semester)"** / `2. 6 Semester` di kartu partisi dan modal partisi, serta mengalikan nominal per semester dengan 6 (`val * 6`). Menuntut pelunasan 6 semester di muka. |
| **Termin 3** | **Kontrak Magang / Suhan:** Menggantikan istilah lama "Interview Magang". Rapat (Pak Refly & Desti) menegaskan istilah Kontrak dan Suhan harus **ditulis terpisah** sesuai alur dokumen resmi (Kontrak kerja industri $\to$ Surat Suhan dari Biro Pariwisata Taiwan). | **Tidak Sesuai & Menggunakan Istilah Usang:** Masih menggunakan istilah **"Interview Magang"** di seluruh tabel, schema, modal partisi, kartu partisi, dan checklist ACC Finance. Belum ada pemisahan alur berkas antara Kontrak Magang dan Surat Suhan. |
| **Termin 4** | **Penempatan Magang Taiwan / Keberangkatan:** Biaya tahap akhir (visa, tiket, penempatan magang). Desti menegaskan status pembayaran ini **bukan nama program lain (seperti Barista)**, melainkan baku sebagai "Keberangkatan Magang" atau "Penempatan Magang Taiwan / Keberangkatan". | **Tidak Lengkap:** Hanya tertulis **"Keberangkatan"** secara generik atau "Tahap 3 Keberangkatan", dan di beberapa tempat kode lama masih terdapat sisa label program non-standar. |
| **Skema Talangan** | **Fleksibilitas 1 atau 2 Tahap:** Mendukung talangan hanya tahap akhir (Keberangkatan) atau 2 tahap (Tahap 1: SPP Semester 1 & Kontrak/Suhan; Tahap 2: Keberangkatan). | Di UI Dana Talangan masih tertulis: *"Tahap 1: Interview Magang & Semester Ditalangi"*, belum diselaraskan ke Kontrak/Suhan. |
| **Panel Magang** | **Tracking Keuangan Magang:** Modul magang ([TabDanaTalangan.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/magang/TabDanaTalangan.tsx)) harus menampilkan tracking read-only dengan 4 termin yang selaras. | Masih menampilkan: *"Tahap 2 - Interview Magang"* dan *"Tahap 3 - Keberangkatan"*. |

---

## 2. Apa yang Sudah Ada (Existing System)

1. **Kolom Data di Schema PostgreSQL ([apps/api/src/db/schema/finance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/finance.ts)):**
   - Termin 1: `registrasiNominal`, `registrasiStatus`, `registrasiPaidDate`, `registrasiBuktiBayarUrl`.
   - Termin 2 (Legacy & Multi-Semester): `mandiriSemesterNominal`, `mandiriSemesterStatus`, tabel `finance_semesters` dan `finance_semester_installments`.
   - Termin 3: `mandiriInterviewNominal`, `mandiriInterviewStatus`, `t1InterviewNominal`, `t1InterviewStatus`.
   - Termin 4: `mandiriKeberangkatanNominal`, `mandiriKeberangkatanStatus`, `t2KeberangkatanNominal`, `t2KeberangkatanStatus`.
   - Dana Talangan: `adminTalaganNominal`, `adminTalaganStatus`, `t1SemesterNominalTotal`, `t2KeberangkatanNominal`, dsb.
2. **Komponen Pengaturan & Partisi Keuangan:**
   - [PartisiBiayaCard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/PartisiBiayaCard.tsx): Kartu visualisasi persentase 4 alokasi pos biaya.
   - [PartitionModal.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/PartitionModal.tsx): Modal formulir penginputan nominal partisi biaya.
   - [PembayaranUtamaSection.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/PembayaranUtamaSection.tsx): Formulir rincian pembayaran utama (Mandiri & Talangan).
   - [DanaTalanganSection.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/DanaTalanganSection.tsx): Rincian pengajuan dan cicilan dana talangan 2 tahap.
3. **Penyelarasan Sebagian di Modul PMB:**
   - [TabSkemaKeuangan.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/pmb/TabSkemaKeuangan.tsx) (L640-656) telah mulai menggunakan label:
     - `2. SPP Semester 1`
     - `3. Kontrak Magang / Suhan`
     - `4. Penempatan Magang / Keberangkatan`

---

## 3. Apa yang Harus Dimodifikasi

1. **[PartisiBiayaCard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/PartisiBiayaCard.tsx):**
   - Ubah label chip & bar progress:
     - Pos 2: dari `2. 6 Semester` $\to$ **`2. SPP Semester 1`**.
     - Pos 3: dari `3. Interview` $\to$ **`3. Kontrak Magang / Suhan`**.
     - Pos 4: dari `4. Berangkat` $\to$ **`4. Penempatan Magang Taiwan / Keberangkatan`**.
2. **[PartitionModal.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/PartitionModal.tsx):**
   - Modifikasi Input Pos 2: Ubah label menjadi **"2. Pembayaran SPP Semester 1"**, hilangkan penguncian perkalian kaku 6 semester (`val * 6`), dan arahkan ke total pagu SPP Semester 1 yang dapat dicicil bulanan.
   - Modifikasi Input Pos 3: Ubah label dari *"3. Interview Magang"* menjadi **"3. Kontrak Magang / Suhan"**, dengan sublabel *"Biaya turun kontrak kerja industri & surat izin Suhan Taiwan"*.
   - Modifikasi Input Pos 4: Ubah label dari *"4. Keberangkatan"* menjadi **"4. Penempatan Magang Taiwan / Keberangkatan"**, dengan sublabel *"Biaya penempatan magang, visa, tiket penerbangan"*.
3. **[PembayaranUtamaSection.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/PembayaranUtamaSection.tsx):**
   - Selaraskan judul blok pembayaran perkuliahan menjadi **"Pembayaran SPP Semester 1 (Cicilan Bulanan)"**.
   - Pada blok skema Mandiri:
     - Ganti pos *"Interview Magang"* $\to$ **"Kontrak Magang / Suhan"**.
     - Ganti pos *"Keberangkatan"* $\to$ **"Penempatan Magang Taiwan / Keberangkatan"**.
4. **[DanaTalanganSection.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/DanaTalanganSection.tsx):**
   - Ubah judul Card Tahap 1 dari *"Interview Magang & Semester Ditalangi"* menjadi **"Tahap 1: SPP Semester 1 & Kontrak Magang/Suhan"**.
   - Ubah judul Card Tahap 2 dari *"Keberangkatan"* menjadi **"Tahap 2: Penempatan Magang Taiwan / Keberangkatan"**.
5. **[TabDanaTalangan.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/magang/TabDanaTalangan.tsx) (Panel Magang) & [page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/mahasiswa/panel/finance/page.tsx) (Portal Mahasiswa):**
   - Perbarui label tahapan read-only agar persis mengikuti 4 termin standar baku di atas.
6. **[panel-logic.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/utils/panel-logic.ts) & [FinanceDashboard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx):**
   - Selaraskan item nama pada fungsi `calculateFinanceChecklist` dan tooltip daftar mahasiswa agar menggunakan 4 termin resmi.

---

## 4. Apa yang Harus Ditambahkan

1. **Pembedaan Alur Dokumen Kontrak Magang vs Surat Suhan:**
   - Sesuai arahan Pak Refly di Segmen 11 (*"Tulis kontrak atau suhan... dua: kontrak beda, suhan beda"*) dan Segmen 20:
     - Tambahkan pemisahan sub-status atau slot berkas pada Termin 3:
       - **(a) Berkas Kontrak Magang:** Dokumen kontrak kerja sama antara mahasiswa dan industri/hotel mitra.
       - **(b) Berkas Surat Suhan:** Surat persetujuan resmi izin magang mahasiswa WNI di Taiwan dari Biro Pariwisata/Kementerian Taiwan.
2. **Keterangan Penempatan Dinamis Berdasarkan Negara Tujuan Mahasiswa:**
   - Pada Termin 4, sistem mendeteksi negara tujuan mahasiswa (`students.destinationCountry` / `subProgram`):
     - Jika tujuan **Taiwan** $\to$ *"Penempatan Magang Taiwan / Keberangkatan"*.
     - Jika tujuan **Malaysia** $\to$ *"Penempatan Magang D3 Malaysia / Keberangkatan"*.
3. **Fleksibilitas Label Cicilan Bulanan SPP Semester 1:**
   - Fitur pemberian label/catatan bulan cicilan (misal: "Cicilan Bulan Agustus", "Cicilan Bulan September") pada saat Finance menginput cicilan di [InstallmentModal.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/InstallmentModal.tsx), sesuai permintaan Desti di Segmen 11.
