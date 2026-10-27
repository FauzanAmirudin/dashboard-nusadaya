# Temuan Analisis FIN-01: Executive Financial Dashboard Proyeksi Target & Realisasi
Rujukan: Catatan Revisi FIN-01 & Notulensi Rapat ([Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf](file:///c:/.PROJECT/dashboard-nusadaya/Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf), Segmen 10 & 11)

---

## 1. Temuan Perbedaan & Kesenjangan (Gaps)

| Parameter | Kebutuhan FIN-01 & Rapat (Segmen 10 & 11) | Kondisi Sistem Berjalan Sekarang |
| :--- | :--- | :--- |
| **Penyimpanan Target** | Disimpan permanen di database server per angkatan & per periode tahun/bulan. | Disimpan di browser `localStorage` client ([FinanceDashboard.tsx:L404-428](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx#L404-L428)). Jika ganti laptop/hapus cache, target hilang. |
| **Sumber Pendapatan** | Dirinci per 3 sumber: **PMB (Registrasi Awal)**, **SPP Taiwan**, dan **SPP D3 Malaysia**. | Hanya 1 target nominal global skalar (`targetNominal = 50_000_000`). Tidak ada pemisahan sumber. |
| **Kalkulasi Realisasi** | Realisasi uang masuk dipilah per kategori sumber dan angkatan. | Semua jenis uang masuk (registrasi, semester, talangan, TOEIC, paspor, dsb.) dicampur jadi satu total ([FinanceDashboard.tsx:L180-293](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx#L180-L293)). |
| **Persentase Capaian** | Ditampilkan per sumber pendapatan (`% Capaian = Realisasi / Target`) dan per angkatan. | Hanya ada 1 persentase ketercapaian total global di dashboard. |
| **Visualisasi Grafik** | Grafik batang komparasi (*Target vs Realisasi*) dan perbandingan lintas angkatan. | **Tidak ada grafik sama sekali**. Hanya 4 kartu angka dan 1 progress bar biasa. |
| **Rincian Eksekutif** | Tampilan besar di atas, rincian tabel matriks per pos & angkatan di bawahnya. | Langsung melompat ke tabel daftar mahasiswa perorangan tanpa tabel proyeksi. |
| **Backend & DB** | Ada tabel database dan API endpoint untuk read/write target. | Tidak ada tabel target di schema dan tidak ada endpoint proyeksi di API. |

---

## 2. Apa yang Sudah Ada (Existing System)

1. **Frontend Dashboard Finance ([FinanceDashboard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx)):**
   - Filter Angkatan (`selectedCohort`) dan Filter Status Pembayaran.
   - Preset rentang tanggal transaksi (`this_month`, `last_month`, `last_3_months`, `this_year`, `custom`).
   - 6 Kartu KPI status mahasiswa (Total Mahasiswa, Aman, Sedang Proses, Menunggak, ACC Finance, Lunas Registrasi).
   - Perhitungan uang masuk riil berbasis tanggal pembayaran (`calculateTransactionsInDateRange`).
   - Ekspor data CSV dan tabel daftar kelengkapan pembayaran mahasiswa.
2. **Data Mahasiswa & Pembagian Program ([shared.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/shared.ts)):**
   - Kolom `cohort` (angkatan 15, 16, dst.), `program`, `subProgram` (`Taiwan-Hospitality`, `Malaysia-Hospitality`), dan `destinationCountry`.
   - Data cicilan semester (`finance_semester_installments`) dan registrasi awal (`registrasiNominal`, `registrasiStatus`).
3. **Pustaka Grafis:**
   - Package `recharts` (^3.8.1) sudah terpasang di [package.json](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/package.json) dan sudah digunakan di dashboard utama.

---

## 3. Apa yang Harus Dimodifikasi

1. **[FinanceDashboard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx):**
   - **Hapus `localStorage`:** Ganti `useState(targetNominal)` berbasis browser storage dengan data proyeksi dari server API.
   - **Pecah Logika Realisasi:** Modifikasi `calculateTransactionsInDateRange` agar mengelompokkan uang masuk ke 3 pos:
     - *Realisasi PMB:* `registrasiNominal` yang lunas.
     - *Realisasi SPP Taiwan:* Cicilan semester 1 mahasiswa dengan `subProgram` / `destinationCountry` mengandung "Taiwan".
     - *Realisasi SPP D3 Malaysia:* Cicilan semester mahasiswa dengan `subProgram` / `destinationCountry` mengandung "Malaysia".
   - **Ganti Kartu Proyeksi Tunggal:** Ubah 1 widget global menjadi **3 Kartu Metrik Sumber Pendapatan** (PMB, SPP Taiwan, SPP Malaysia) dengan target, realisasi, persentase capaian, dan defisit/surplus masing-masing.
2. **[apps/api/src/routes/finance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/finance.ts):**
   - Tambahkan fungsi agregasi penerimaan kas per kategori dan per angkatan pada layer backend agar kalkulasi tidak membebani browser client.

---

## 4. Apa yang Harus Ditambahkan

1. **Database Schema Baru (`finance_projection_targets` di [finance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/finance.ts)):**
   - Kolom: `id`, `cohort` (15, 16, dst.), `category` (`pmb`, `spp_taiwan`, `spp_malaysia`), `year`, `month`, `targetNominal` (bigint/integer), `updatedBy`, `updatedAt`.
2. **API Routes Baru ([apps/api/src/routes/finance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/finance.ts)):**
   - `GET /finance/projections`: Mengambil target dan kalkulasi realisasi riil per sumber dan angkatan.
   - `POST /finance/projections/batch-update`: Menyimpan/memperbarui nominal target (otorisasi role `finance` dan `superadmin`).
3. **Komponen Grafik Recharts (`FinanceComparisonChart.tsx`):**
   - **Grafik Batang Komparatif (Grouped Bar Chart):** Membandingkan batang **Target (Rp)** vs **Realisasi (Rp)** untuk PMB, SPP Taiwan, dan SPP Malaysia.
   - **Grafik Komparasi Antar-Angkatan:** Membandingkan performa capaian Angkatan 15 vs Angkatan 16.
4. **Tabel Matriks Proyeksi Eksekutif (`FinanceProjectionTable.tsx`):**
   - Tabel ringkasan di bawah grafik:
     `Sumber Pendapatan | Angkatan | Target (Rp) | Realisasi (Rp) | Selisih (Rp) | % Capaian | Status KPI | Aksi (Edit Target)`
5. **Modal Input/Edit Target (`EditProjectionTargetModal.tsx`):**
   - Dialog form bagi tim Finance (Desti) untuk menginput atau mengubah pagu target per pos pendapatan dan per angkatan.
