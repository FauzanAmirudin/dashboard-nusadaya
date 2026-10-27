# Rencana Implementasi FIN-02: Struktur Baku 4 Termin Biaya & Penyelarasan Istilah
Rujukan: Catatan Perubahan FIN-02 & Notulensi Rapat ([Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf](file:///c:/.PROJECT/dashboard-nusadaya/Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf), Segmen 11, 12, & 24)

---

## 1. Ikhtisar & Tujuan Pelaksanaan
Rencana kerja ini menyusun seluruh tahapan penerapan standardisasi struktur baku 4 termin biaya dan penyelarasan istilah (FIN-02) ke dalam task-task terukur, terperinci, dan granular tanpa menyertakan kode program.

### 4 Termin Biaya Baku:
1. **Termin 1: Registrasi Awal** (Biaya pendaftaran awal & masuk pendaftar baru).
2. **Termin 2: Pembayaran SPP Semester 1** (Biaya perkuliahan semester berjalan dengan cicilan bulanan fleksibel selama kuliah persiapan di kampus, menggantikan penetapan kaku 6 semester di muka).
3. **Termin 3: Kontrak Magang / Suhan** (Penghapusan istilah lama *"Interview Magang"*, serta pemisahan alur dokumen Kontrak Magang kerja industri dan Surat Suhan izin resmi magang Taiwan).
4. **Termin 4: Penempatan Magang Taiwan / Keberangkatan** (Biaya akhir penempatan magang, visa, tiket penerbangan; menghapus nama program non-standar seperti Barista; dinamis mengikuti negara tujuan mahasiswa).

---

## 2. Bagian I: Backend & Database (Sisi Server)

### Fase B1: Penyelarasan Skema Database & Migrasi Data
- [x] **Task B1.1: Pemetaan Semantik & Kolom Baru Skema Database (`finance_data`)**
  - Mengonfigurasi pemetaan semantik pada tabel `finance_data` untuk mendukung 4 termin baru secara transparan:
    - Memetakan field Termin 3 ke Kontrak Magang dan Surat Suhan.
    - Memetakan field Termin 4 ke Penempatan Magang / Keberangkatan.
  - Menambahkan kolom pendukung pemisahan dokumen resmi pada tabel `finance_data`:
    - Kolom status dan URL bukti dokumen Kontrak Magang (`kontrakMagangStatus`, `kontrakMagangBuktiBayarUrl`, `kontrakMagangPaidDate`).
    - Kolom status dan URL bukti dokumen Surat Suhan (`suhanStatus`, `suhanBuktiBayarUrl`, `suhanPaidDate`).
  - Menambahkan kolom label periode/bulan cicilan (`installmentMonth` / `periodNotes`) pada tabel `finance_semester_installments` untuk mengakomodasi pencatatan cicilan bulanan yang fleksibel (Agustus, September, dst.).

- [x] **Task B1.2: Eksekusi Migrasi Database PostgreSQL**
  - Membuat berkas migrasi database Drizzle / SQL untuk penambahan kolom pemisahan berkas Kontrak vs Suhan dan label bulan cicilan.
  - Menjalankan migrasi database ke PostgreSQL server pengembang dan memvalidasi keutuhan struktur tabel serta indeks yang ada.

- [x] **Task B1.3: Pembaruan Relasi Tabel & Definisi Tipe Data**
  - Memperbarui berkas definisi relasi tabel pada schema ORM backend untuk menjamin sinkronisasi relasi dokumen keuangan mahasiswa dengan entitas pengguna dan mahasiswa.

---

### Fase B2: Logika Bisnis & Endpoint API
- [x] **Task B2.1: Penyelarasan Endpoint Data Keuangan Mahasiswa (`GET` & `PATCH /students/:id/finance`)**
  - Menyesuaikan penanganan data pada endpoint keuangan per mahasiswa:
    - Mengakomodasi pembaruan data nominal, status pelunasan, tanggal bayar, dan URL bukti bayar untuk Termin 3 (Kontrak Magang & Surat Suhan) dan Termin 4 (Penempatan Magang Taiwan / Keberangkatan).
    - Memastikan kompatibilitas mundur (*backward compatibility*) dengan kolom legacy sehingga data yang telah terisi sebelumnya tidak hilang.
    - Menerapkan validasi hak akses berbasis peran (Finance, PMB, Magang, Superadmin).

- [x] **Task B2.2: Penyelarasan Endpoint Cicilan Semester (`/students/:id/finance/semesters/:semesterId/installments`)**
  - Memperluas payload pencatatan cicilan agar menerima label bulan cicilan yang dinamis (contoh: "Cicilan Bulan Agustus", "Cicilan Bulan September").
  - Memastikan pencatatan cicilan pada SPP Semester 1 dapat bertambah secara fleksibel sesuai kesepakatan pembayaran mahasiswa.

- [x] **Task B2.3: Pembaruan Endpoint Unggah Dokumen Keuangan (`/students/:id/finance/documents/:docKey`)**
  - Menambahkan dukungan penanganan berkas unggahan baru:
    - Kunci dokumen `kontrak_magang` untuk berkas perjanjian kerja magang industri.
    - Kunci dokumen `suhan` untuk berkas Surat Persetujuan Magang Mahasiswa WNI di Taiwan dari instansi berwenang.
    - Kunci dokumen `penempatan_keberangkatan` untuk berkas penempatan magang, visa, dan tiket penerbangan.
  - Menjamin berkas yang diunggah dengan kunci lama (`mandiri_interview`, `mandiri_keberangkatan`) tetap dapat diakses dan diunduh secara normal.

- [x] **Task B2.4: Penyelarasan Endpoint Tracking Magang (`GET /finance/student/:id`)**
  - Memastikan payload data keuangan yang dikonsumsi oleh panel Magang dan CRM memuat struktur 4 termin biaya baku terstandarisasi.

- [x] **Task B2.5: Pengujian Fungsional API Backend**
  - Menguji endpoint dengan payload data skema Dana Mandiri dan skema Dana Talangan.
  - Memverifikasi tidak ada eror tipe data dengan menjalankan pemeriksaan kompilasi TypeScript di backend.

---

## 3. Bagian II: Frontend & Antarmuka Pengguna (Sisi Klien)

### Fase F1: Penyelarasan Komponen Partisi Biaya Pendidikan
- [x] **Task F1.1: Pembaruan Modal Pengaturan Partisi (`PartitionModal.tsx`)**
  - Mengubah label Pos 2 dari *"2. 6 Semester"* menjadi **"2. Pembayaran SPP Semester 1"**, dengan deskripsi *"Biaya perkuliahan berjalan Semester 1 (cicilan bulanan persiapan)"*.
  - Menghapus rumus perkalian otomatis $6 \times \text{semester}$ pada saat mengisi pagu perkuliahan, sehingga admin Finance leluasa menentukan pagu biaya SPP Semester 1 sesuai kebijakan program.
  - Mengubah label Pos 3 dari *"3. Interview Magang"* menjadi **"3. Kontrak Magang / Suhan"**, dengan deskripsi *"Biaya proses turun kontrak kerja & surat izin Suhan Taiwan"*.
  - Mengubah label Pos 4 dari *"4. Keberangkatan"* menjadi **"4. Penempatan Magang Taiwan / Keberangkatan"**, dengan deskripsi *"Biaya penempatan magang, visa, dan tiket penerbangan"*.
  - Menyelaraskan teks ringkasan alokasi dan notifikasi kecocokan partisi dengan nama 4 termin baru.

- [x] **Task F1.2: Pembaruan Kartu Ringkasan Partisi Biaya (`PartisiBiayaCard.tsx`)**
  - Memperbarui 4 chip mini dan bar visualisasi alokasi biaya:
    - Chip 1: `1. Registrasi` (Biru Langit)
    - Chip 2: `2. SPP Semester 1` (Indigo)
    - Chip 3: `3. Kontrak Magang / Suhan` (Amber)
    - Chip 4: `4. Penempatan Magang Taiwan / Keberangkatan` (Emerald)
  - Menghapus penyebutan lama *"Perkuliahan 6 Semester"* dan *"Interview Magang"*.
  - Menampilkan status pelunasan atau progres cicilan pada tiap termin.

---

### Fase F2: Penyelarasan Formulir Pembayaran Utama & Cicilan Fleksibel
- [x] **Task F2.1: Pembaruan Seksi Pembayaran Utama (`PembayaranUtamaSection.tsx`)**
  - Memperbarui judul seksi perkuliahan menjadi **"Pembayaran SPP Semester 1 (Cicilan Bulanan)"**.
  - Pada blok rincian skema Dana Mandiri:
    - Mengganti judul blok dari *"Interview & Keberangkatan"* menjadi **"Kontrak Magang / Suhan & Penempatan Magang"**.
    - Mengganti kartu *"Interview Magang"* menjadi **"Kontrak Magang / Suhan"** dengan penanda status pelunasan dan pratinjau bukti bayar.
    - Mengganti kartu *"Keberangkatan"* menjadi **"Penempatan Magang Taiwan / Keberangkatan"**.

- [x] **Task F2.2: Pembedaan Alur Dokumen Kontrak Magang vs Surat Suhan pada Termin 3**
  - Sesuai arahan rapat Segmen 11 (*"kontrak beda, suhan beda"*) dan Segmen 20:
    - Menyediakan pemisahan penandaan atau slot berkas pada kartu Termin 3:
      - Slot A: Dokumen Kontrak Magang (Perjanjian Kerja Hotel/Industri).
      - Slot B: Dokumen Surat Suhan (Surat Persetujuan Izin Magang Resmi Taiwan).
    - Menampilkan informasi alur bahwa dokumen Kontrak Magang diterbitkan lebih dahulu, disusul oleh penerbitan Surat Suhan.

- [x] **Task F2.3: Fleksibilitas Label Cicilan Bulanan pada Modal Cicilan (`InstallmentModal.tsx`)**
  - Menambahkan kolom input pemilihan/pengisian label periode cicilan (contoh: "Cicilan Bulan Agustus", "Cicilan Bulan September") pada saat Finance menginput cicilan pembayaran SPP Semester 1.
  - Menampilkan label bulan cicilan pada tabel daftar riwayat pembayaran cicilan mahasiswa.

- [x] **Task F2.4: Penyesuaian Seksi Skema Dana Talangan (`DanaTalanganSection.tsx`)**
  - Mengubah judul Card Tahap 1 dari *"Interview Magang & Semester Ditalangi"* menjadi **"Tahap 1: SPP Semester 1 & Kontrak Magang/Suhan Ditalangi"**.
  - Mengubah judul Card Tahap 2 dari *"Keberangkatan"* menjadi **"Tahap 2: Penempatan Magang Taiwan / Keberangkatan"**.
  - Memperbarui narasi dan deskripsi plafon pinjaman talangan agar selaras dengan 4 termin baku.

---

### Fase F3: Penyelarasan Lintas Panel & Portal Mahasiswa
- [x] **Task F3.1: Pembaruan Panel Magang (`TabDanaTalangan.tsx`)**
  - Menyelaraskan kartu monitoring read-only keuangan pada panel Magang:
    - Termin 1: `Biaya Registrasi Pendaftaran`
    - Termin 2: `SPP Semester 1` (bukan Tahap 1 Semester Lunas)
    - Termin 3: `Kontrak Magang / Suhan` (bukan Tahap 2 Interview Magang)
    - Termin 4: `Penempatan Magang Taiwan / Keberangkatan` (bukan Tahap 3 Keberangkatan)
  - Memastikan tidak ada lagi istilah program non-standar seperti Barista pada status pembayaran keberangkatan.

- [x] **Task F3.2: Pembaruan Portal Mahasiswa Modul Keuangan (`page.tsx`)**
  - Menyelaraskan daftar tagihan dan riwayat pembayaran di portal akun mahasiswa agar menampilkan 4 termin baku yang sama persis dengan yang dilihat oleh tim Finance.

- [x] **Task F3.3: Pembaruan Logika Checklist Finance (`panel-logic.ts` & Dashboard Eksekutif)**
  - Memperbarui fungsi `calculateFinanceChecklist` di `panel-logic.ts` agar menampilkan nama resmi:
    - Item 2: *"Pembayaran SPP Semester 1"*
    - Item 3: *"Kontrak Magang / Suhan"*
    - Item 4: *"Penempatan Magang Taiwan / Keberangkatan"*
  - Menyelaraskan tooltip dan rekap checklist pada tabel monitoring utama Finance ([FinanceDashboard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx)) dan Evaluasi Finalisasi ([EvaluasiFinalisasiDashboard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/EvaluasiFinalisasiDashboard.tsx)).

- [x] **Task F3.4: Dinamika Penyesuaian Nama Negara Penempatan**
  - Memasang utilitas label cerdas:
    - Jika mahasiswa terdaftar pada program tujuan **Taiwan** $\to$ *"Penempatan Magang Taiwan / Keberangkatan"*.
    - Jika mahasiswa terdaftar pada program tujuan **Malaysia** $\to$ *"Penempatan Magang D3 Malaysia / Keberangkatan"*.

---

## 4. Bagian III: Verifikasi, Integrasi, & Validasi Sistem

### Fase V1: Pengujian End-to-End & Validasi Kualitas Kode
- [x] **Task V1.1: Pemeriksaan Tipe Data & Kompilasi TypeScript**
  - Menjalankan uji kompilasi pada direktori `apps/api` untuk memastikan validitas kontrak API backend.
  - Menjalankan uji kompilasi pada direktori `apps/web` untuk memastikan keutuhan props antarmuka frontend bebas dari eror tipe data (*0 errors*).

- [x] **Task V1.2: Pengujian Alur Transaksi & Sinkronisasi Lintas Modul**
  - Melakukan simulasi pengisian dan penyimpanan partisi biaya pendidikan di [PartitionModal.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/PartitionModal.tsx).
  - Melakukan simulasi pencatatan cicilan bulanan fleksibel pada SPP Semester 1 di [InstallmentModal.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/InstallmentModal.tsx).
  - Melakukan simulasi pengunggahan berkas Kontrak Magang dan Surat Suhan secara terpisah.
  - Melakukan simulasi pelunasan tahap Penempatan Magang / Keberangkatan.
  - Memverifikasi keselarasan tampilan data di Panel Finance, Panel PMB, Panel Magang, dan Dashboard Monitoring Mahasiswa.
