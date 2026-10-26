# Rencana Implementasi Pembaruan Skema Keuangan & Penataan Dokumen PMB vs Magang (Poin 10 - 12)
**Dokumen Referensi**: `Catatan_Update_PMB_Nusadaya_Developer.pdf` (Bagian 3.1 & 3.2)  
**Target Modul**: Panel PMB (`TabSkemaKeuangan.tsx`, `TabChecklist.tsx`), Panel Magang (`TabDokumen.tsx`), dan Endpoint ACC PMB  
**Status**: Selesai Diimplementasikan (100%)  

---

## 1. Ringkasan Eksekutif & Analisis Kebutuhan

Berdasarkan hasil uji coba dan evaluasi alur kerja pendaftaran mahasiswa baru di OneData Nusadaya, ditemukan hambatan operasional kritis pada proses persetujuan (ACC PMB) dan pencatatan keuangan awal:
1. **Poin 10 – Skema Keuangan (Input Nominal DP Pendaftaran oleh PMB)**:
   - Staf PMB saat ini hanya dapat mengisi satu nilai global (*Total Biaya Pendidikan*).
   - Staf PMB membutuhkan kolom isian khusus untuk mencatat **Nominal Uang Muka / DP Pendaftaran** yang disepakati calon mahasiswa.
   - Diperlukan indikator status yang jelas apakah pembayaran DP tersebut sudah lunas (*Lunas DP* vs *Belum Lunas*) yang terhubung ke pencatatan registrasi di bagian Finance.
2. **Poin 11 – Dokumen PMB (Paspor Halaman Visa Diubah Menjadi Opsional)**:
   - Saat ini berkas lembar catatan visa paspor berstatus wajib di sistem.
   - Calon mahasiswa baru yang baru masuk semester 1 belum memiliki visa magang kerja luar negeri (karena visa baru diurus di semester akhir menjelang keberangkatan).
   - Akibatnya, calon mahasiswa baru selalu berstatus *Belum Lengkap* dan tidak pernah dapat disetujui (*ACC*) oleh tim PMB.
   - Status berkas paspor halaman visa harus diubah menjadi opsional pada modul checklist dan backend API ACC PMB.
3. **Poin 12 – Dokumen Magang (Pemisahan Berkas Masuk PMB vs Berkas Berangkat Magang)**:
   - Berkas **Medical Check Up Lengkap (MCU Full)** dan **Sertifikasi Bahasa Asing (TOEIC / JLPT)** saat ini keliru masuk dalam daftar wajib PMB.
   - MCU Full memiliki masa berlaku klinis terbatas (3–6 bulan) dan sertifikasi bahasa baru diajarkan/diujikan selama perkuliahan berjalan, sehingga mustahil dipenuhi di awal pendaftaran.
   - Pada tahap masuk PMB, pemeriksaan kesehatan cukup berupa **Pre-MCU (Skrining Awal Fisik)**.
   - Berkas **MCU Full** dan **Sertifikasi Bahasa Asing** dipisahkan dari syarat wajib PMB dan dikelola secara terpusat pada **Panel Magang** menjelang keberangkatan kerja ke luar negeri.

---

## 2. Analisis Dampak Arsitektur Sistem

### 2.1. Lapisan Basis Data (PostgreSQL & Drizzle ORM)
- **Tabel `pmb_payment_plan`**:
  - Kolom `pendaftaran_dp` (nominal DP), `total_dp`, dan `status_dp` sudah tersedia di skema basis data, sehingga tidak memerlukan penambahan tabel atau migrasi baru.
- **Tabel `internship_data` & `internship_documents`**:
  - Tabel magang sudah memiliki field untuk MCU (`mcu_ready`, `mcu_place`, `mcu_date`, `mcu_result`).
  - Berkas sertifikasi bahasa dapat dikelola sebagai dokumen pendukung keberangkatan pada sistem penyimpanan dokumen magang (`internship_documents` dengan kategori dokumen magang).

### 2.2. Lapisan Backend API (Elysia.js)
- **Endpoint Skema Keuangan (`PUT /students/:id/pmb/payment-plan`)**:
  - Handler backend sudah siap memproses field `pendaftaranDp` dan `statusDp`. Diperlukan penjaminan sanitasi angka (integer positif, maksimal 9 digit).
- **Endpoint Persetujuan PMB (`POST /students/:id/pmb/acc`)**:
  - Array validasi kelengkapan (`requiredChecks`) saat ini memeriksa 17 indikator, termasuk `docPassportVisa`, `docMcu`, dan `docSertifikasiBahasa`.
  - Ketiga field tersebut harus dilepaskan dari syarat wajib ACC PMB, sehingga target kelulusan ACC PMB disesuaikan menjadi **14 indikator** (5 checklist utama + 9 dokumen wajib pendaftaran).

### 2.3. Lapisan Antarmuka Frontend (Next.js & React)
- **Tab Skema Keuangan PMB (`apps/web/src/components/panels/pmb/TabSkemaKeuangan.tsx`)**:
  - Penambahan input Nominal DP Pendaftaran dengan masking rupiah, validasi integer, dan integrasi tombol simpan.
  - Penambahan visualisasi badge status pelunasan DP (*Lunas DP* vs *Belum Lunas*).
- **Tab Dokumen Checklist PMB (`apps/web/src/components/panels/pmb/TabChecklist.tsx`)**:
  - Pengubahan status `passport_visa` menjadi opsional.
  - Penghapusan kewajiban `mcu` dan `sertifikasi_bahasa` dari indikator kelengkapan PMB, disertai pengalihan catatan operasional bahwa kedua dokumen tersebut dikelola di Panel Magang.
  - Penyesuaian kalkulasi progress bar dan event sinkronisasi real-time (`pmb-progress-sync`) menjadi total 14 indikator.
- **Modul Logika Bisnis Panel (`apps/web/src/utils/panel-logic.ts`)**:
  - Pembaruan konstanta `PMB_REQUIRED_DOC_KEYS` dengan mengeluarkan `docPassportVisa`, `docMcu`, dan `docSertifikasiBahasa`.
  - Penyesuaian fungsi `calculatePmbChecklist()` dan `canGivePmbAcc()`.
- **Tab Dokumen Keberangkatan Magang (`apps/web/src/components/panels/magang/TabDokumen.tsx`)**:
  - Memastikan alur pemeriksaan MCU Full keberangkatan terkelola dengan baik.
  - Mengintegrasikan pengelolaan berkas Sertifikasi Bahasa (TOEIC/JLPT) untuk kesiapan mahasiswa magang ke luar negeri.

---

## 3. Rencana Kerja Implementasi (Breakdown Tasks)

### FASE 1: Penyesuaian Logika Bisnis & Backend API
- [x] **Task 1.1**: Penyesuaian Konstanta Dokumen Wajib PMB pada `panel-logic.ts`
  - Memperbarui daftar kunci dokumen wajib PMB dengan menghapus `docPassportVisa`, `docMcu`, dan `docSertifikasiBahasa`.
  - Memastikan hanya 9 dokumen pendaftaran awal yang menjadi syarat wajib: KTP, KK, CV, Ijazah, Transkrip/SKL, Paspor Depan, SKBM/SKCK, Pre-MCU, dan SLA.
- [x] **Task 1.2**: Penyesuaian Fungsi Kalkulasi Kelengkapan PMB (`calculatePmbChecklist`)
  - Memperbarui formula perhitungan jumlah dokumen wajib selesai sehingga total target berubah dari 17 menjadi 14 indikator.
  - Memperbarui logika fungsi penentu kelayakan ACC (`canGivePmbAcc`).
- [x] **Task 1.3**: Pembaruan Validasi ACC PMB pada Backend API (`POST /:id/pmb/acc`)
  - Mengeluarkan `docPassportVisa`, `docMcu`, dan `docSertifikasiBahasa` dari daftar pemeriksaan syarat wajib (`requiredChecks`) pada endpoint ACC PMB di backend.
  - Memperbarui pesan error validasi agar mencerminkan standar kelengkapan 14 indikator baru.
- [x] **Task 1.4**: Verifikasi Endpoint Skema Keuangan (`PUT /:id/pmb/payment-plan`)
  - Memastikan endpoint dapat menerima dan memperbarui nilai `pendaftaranDp` ke dalam tabel `pmb_payment_plan` dengan validasi rentang nilai yang aman.
---

### FASE 2: Implementasi Antarmuka Tab Skema Keuangan PMB (Poin 10)
- [x] **Task 2.1**: Penambahan State dan Kontrol Input Nominal DP Pendaftaran
  - Menambahkan state `pendaftaranDp` pada komponen `TabSkemaKeuangan.tsx` dengan nilai awal membaca dari data payment plan mahasiswa.
  - Membuat elemen input "Nominal Uang Muka / DP Pendaftaran (Rp)" pada kartu utama skema keuangan.
  - Menerapkan format visual mata uang Rupiah dan proteksi input hanya angka bilangan bulat (maksimal 9 digit).
- [x] **Task 2.2**: Integrasi Handler Penyimpanan Skema Keuangan
  - Memperbarui fungsi simpan biaya agar menyertakan nilai `pendaftaranDp` bersama `totalBiaya` dalam satu payload pengiriman ke API `PUT /students/:id/pmb/payment-plan`.
  - Menangani aksi pembatalan edit agar mengembalikan nilai input DP ke data awal.
- [x] **Task 2.3**: Visualisasi Status Pelunasan DP Pendaftaran
  - Menampilkan badge status pelunasan DP di samping input:
    - Badge hijau bertanda centang ("Lunas DP") jika pembayaran DP pendaftaran telah dilunasi di Finance.
    - Badge kuning/abu-abu ("Belum Lunas") jika DP belum dibayar.
  - Menghubungkan indikator status ini dengan data registrasi awal dari panel Finance.
---

### FASE 3: Penataan Dokumen Masuk pada Tab Checklist PMB (Poin 11 & 12)
- [x] **Task 3.1**: Pengubahan Status Paspor Halaman Visa Menjadi Opsional (Poin 11)
  - Mengubah properti `isOptional` pada entri `passport_visa` di `TabChecklist.tsx` menjadi bernilai `true`.
  - Menambahkan label "(Opsional)" dan keterangan bahwa paspor visa tidak mengunci kelulusan ACC PMB.
- [x] **Task 3.2**: Pemisahan Berkas MCU Full dan Sertifikat Bahasa dari Checklist Wajib PMB (Poin 12)
  - Memastikan Pre-MCU (Skrining Awal Fisik) tetap menjadi syarat wajib pemeriksaan kesehatan di tahap PMB.
  - Mengubah status MCU Full dan Sertifikasi Bahasa menjadi opsional pada checklist PMB, atau menambahkan penanda visual bahwa kedua dokumen ini diverifikasi pada tahap keberangkatan di Panel Magang.
- [x] **Task 3.3**: Pembaruan Indikator Progress Kelengkapan PMB
  - Mengubah kalkulasi jumlah berkas wajib selesai pada header checklist dari penyebut 17 menjadi 14.
  - Memperbarui payload event sinkronisasi real-time (`pmb-progress-sync`) agar menyiarkan total target 14 indikator ke seluruh panel dashboard.
---

### FASE 4: Penataan Dokumen Keberangkatan pada Panel Magang (Poin 12)
- [x] **Task 4.1**: Verifikasi Pengelolaan Berkas MCU Full di Panel Magang
  - Memastikan kartu dokumen ke-7 (Medical Check Up) pada `TabDokumen.tsx` di Panel Magang tetap berfungsi penuh untuk mencatat tempat MCU, tanggal MCU, status FIT/UNFIT, serta upload hasil lab MCU Full.
- [x] **Task 4.2**: Integrasi Pengelolaan Dokumen Sertifikasi Bahasa di Panel Magang
  - Menambahkan bagian pengelolaan dokumen Sertifikasi Bahasa (TOEIC / JLPT / Topik) pada kartu kesiapan keberangkatan magang.
  - Menyediakan input tanggal tes, skor/hasil kelulusan, dan komponen pengunggahan sertifikat bahasa resmi.
---

### FASE 5: Penyelarasan Unit Test & Verifikasi Kualitas (QA)
- [x] **Task 5.1**: Pembaruan Unit Test Logika Panel (`panel-logic.test.ts`)
  - Menyesuaikan pengujian unit PMB agar menguji skenario kelulusan ACC dengan 14 indikator (bukan 17).
  - Memverifikasi bahwa calon mahasiswa yang belum mengunggah paspor visa, MCU full, dan sertifikat bahasa tetap dinyatakan lolos kelayakan ACC PMB jika 14 dokumen wajib lainnya terpenuhi.
- [x] **Task 5.2**: Pengujian Alur Input DP Pendaftaran & Sinkronisasi Finance
  - Menguji pengisian nominal DP oleh staf PMB dan memverifikasi data tersimpan di tabel `pmb_payment_plan`.
  - Memverifikasi status pelunasan DP berganti dari "Belum Lunas" menjadi "Lunas DP" saat tim Finance mengonfirmasi pembayaran registrasi awal.
- [x] **Task 5.3**: Pengujian End-to-End Tombol ACC PMB
  - Menguji tombol ACC PMB pada mahasiswa baru yang hanya memiliki 14 indikator pendaftaran wajib untuk memastikan status ACC berhasil diberikan tanpa terganjal visa, MCU full, maupun sertifikasi bahasa.
