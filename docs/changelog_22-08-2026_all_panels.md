# Dokumentasi Pembaruan Perbaikan Runtime Dashboard, Penyelarasan Data Panel Mahasiswa & Sanitasi Eden Treaty API Client
**Dashboard Nusadaya**

Sistem operasional Dashboard Nusadaya telah menerima serangkaian pembaruan penting yang berfokus pada resolusi kendala *runtime ReferenceError* pada komponen panel divisi, penyelarasan pemetaan kolom checklist antarmuka dengan skema database PostgreSQL, penambahan field rute API backend, serta perbaikan kritis pada serialisasi query string Eden Treaty client yang sebelumnya menyebabkan data mahasiswa tampil 0 di seluruh panel.

---

## 1. Resolusi Runtime ReferenceError (`isLoading is not defined`)

Telah dilakukan perbaikan pada sejumlah komponen panel dashboard divisi yang sebelumnya mengalami *crash* saat dirender akibat pemanggilan variabel `isLoading` yang tidak terdefinisi di dalam lingkup komponen lokal.

### A. Penghapusan Blok Kondisional Loading Berulang
- **Komponen Terdampak**:
  - `apps/web/src/components/dashboards/MagangDashboard.tsx`
  - `apps/web/src/components/dashboards/FinanceDashboard.tsx`
  - `apps/web/src/components/dashboards/PaDashboard.tsx`
- **Penyebab & Solusi**:
  - State *loading* dan *error handling* untuk seluruh modul divisi telah dipusatkan dan dikelola sepenuhnya oleh pembungkus `<SharedDashboardLoader />` sebelum komponen panel anak dirender.
  - Blok `if (isLoading)` di dalam masing-masing file panel telah dihapus sehingga komponen langsung menerima prop `data` mahasiswa dan merender antarmuka tanpa terjadi `ReferenceError` pada runtime Next.js.

---

## 2. Penyelarasan Pemetaan Data Panel dengan Skema Database (Database Field Alignment)

Dilakukan audit menyeluruh terhadap field-field yang diakses oleh dashboard divisi agar selaras 100% dengan skema tabel database (`apps/api/src/db/schema.ts`) dan payload response backend.

### A. Dashboard Pembimbing Akademik (`PaDashboard.tsx`)
- **Koreksi Checklist & Indikator PA**: Mengganti pemanggilan field non-skema (`interview1Completed`, `interview2Completed`, `interview3Completed`, `tripartiteMeetingCompleted`) dengan field valid dari tabel `pa_data`:
  - `counselingDone` (Konseling Selesai)
  - `mentalStable` (Kondisi Mental Stabil)
  - `disciplineGood` (Tingkat Disiplin Baik)
- **Koreksi Kartu KPI**: Mengganti KPI *"Wawancara 1-3 Selesai"* menjadi kartu metrik *"Konseling Selesai"* (`countKonselingSelesai`) yang menghitung mahasiswa dengan `pa.counselingDone = true`.
- **Pembaruan Ekspor CSV**: Penyesuaian kolom ekspor data bimbingan PA (*Konseling Selesai*, *Mental Stabil*, *Disiplin Baik*, *Catatan Disiplin*).
- **Header Tabel**: Standardisasi label kolom progress checklist menjadi **Indikator PA (3)**.

### B. Dashboard Divisi Akademik (`AkademikDashboard.tsx`)
- **Koreksi Kalkulasi Presensi Kehadiran**: Memperbaiki logika metrik KPI `countAttendanceOk` dan fungsi `getAcademicChecklist` agar langsung membaca kolom `academic.attendancePresent` dan `academic.attendanceTotal` dari tabel `academic_data`.
- Menghilangkan ketergantungan pada array `courseGrades` yang dikosongkan pada query daftar mahasiswa cepat, sehingga persentase kehadiran (syarat $\ge 80\%$) dan KPI presensi langsung tampil akurat.

### C. Dashboard Divisi Magang & Hublu (`MagangDashboard.tsx`)
- **Koreksi Checklist Pembekalan & CV**: Mengganti field `pembekalanStatus` / `cvStatus` yang tidak ada di skema menjadi field resmi `internship.praPasporCv` dari tabel `internship_data`.
- **Integrasi State Machine Kontrak**: Checklist LoA & Kontrak Kerja kini membaca field valid `loaConfirmed` dan `contractReady`.

### D. Perluasan SELECT Query Rute Backend (`apps/api/src/routes/student/core.ts`)
- Menambahkan field tabel `internship_data` yang sebelumnya terlewat dari SELECT query endpoint `GET /students`:
  - `loaConfirmed` (Konfirmasi LoA)
  - `internshipCompany` (Nama Hotel / Mitra Industri Penempatan)
  - `estDepartureDate` (Estimasi Tanggal Keberangkatan)

---

## 3. Resolusi Masalah Kritis "0 Mahasiswa" (Eden Treaty Query Sanitization)

Ditemukan dan diperbaiki anomali kritis di mana dashboard menampilkan *"0 dari 0 mahasiswa"* padahal data mahasiswa lengkap tersedia di database PostgreSQL.

### A. Analisis Akar Masalah (Root Cause Analysis)
1. **Serialisasi Eden Treaty**: Library `@elysiajs/eden` (`edenTreaty`) secara default merubah properti objek bernilai `undefined` menjadi literal string `"undefined"` pada parameter URL (contoh: `GET /students?page=1&limit=50&cohort=undefined&status=undefined&search=undefined`).
2. **Kueri Pencarian SQL**: Backend menerima `query.search = "undefined"` dan menjalankan filter `WHERE LOWER(name) LIKE '%undefined%' OR LOWER(nim) LIKE '%undefined%'`. Karena tidak ada mahasiswa bernama "undefined", database mengembalikan 0 record (`total: 0`), yang kemudian sempat tersimpan di Redis/L1 cache.

### B. Implementasi Perbaikan Menyeluruh (End-to-End Fix)
1. **Sanitasi URL pada Fetcher Eden (`apps/web/src/lib/eden.ts`)**:
   - Dibuat fungsi utilitas `cleanUrl(rawUrl)` yang mem-parsing `URLSearchParams` dan otomatis membuang parameter yang bernilai `"undefined"`, `"null"`, atau string kosong `""` sebelum HTTP fetch dikirim ke server.
2. **Pembersihan Payload pada Hook Data (`useStudentsList.ts` & `useDashboardSummary.ts`)**:
   - Konstruksi `$query` object kini dibangun secara dinamis (`Record<string, string>`) dan hanya menyisipkan atribut yang terdefinisi dengan nilai valid.
3. **Defensive Parameter Parsing di Backend (`apps/api/src/routes/student/core.ts` & `dashboard.ts`)**:
   - Backend menambahkan guard validasi: string `"undefined"`, `"null"`, `"all"`, dan `""` pada parameter `cohort`, `status`, dan `search` otomatis dikonversi menjadi `undefined`.
4. **Invalidasi Cache Menyeluruh**:
   - Cache L1 (In-Memory RAM) dan L2 (Redis) untuk pola `cache:students:*` dan `cache:dashboard:*` telah di-flush dan di-refresh dengan data termutakhir.

---

## 4. Pembersihan Lingkungan & Berkas Pengujian (Cleanup)

- Telah dilakukan pembersihan berkas-berkas pengujian dan skrip diagnostik sementara dari repositori:
  - Penghapusan berkas `api_test.json`.
  - Penghapusan direktori `scratch/` beserta seluruh file pengujian sementara di dalamnya.

---

**Tanggal Perubahan:** 22 Agustus 2026  
**Area Terdampak:**
- `apps/web/src/components/dashboards/MagangDashboard.tsx` (Penghapusan runtime `isLoading`, koreksi checklist `praPasporCv`)
- `apps/web/src/components/dashboards/FinanceDashboard.tsx` (Penghapusan runtime `isLoading`)
- `apps/web/src/components/dashboards/PaDashboard.tsx` (Penghapusan runtime `isLoading`, sinkronisasi 3 indikator PA, KPI konseling, ekspor CSV)
- `apps/web/src/components/dashboards/AkademikDashboard.tsx` (Koreksi kalkulasi presensi dari `academic.attendancePresent/attendanceTotal`)
- `apps/api/src/routes/student/core.ts` (Penambahan field `loaConfirmed`, `internshipCompany`, `estDepartureDate` pada SELECT query & sanitasi parameter query)
- `apps/api/src/routes/dashboard.ts` (Defensive parsing parameter `cohort` pada dashboard summary)
- `apps/web/src/lib/eden.ts` (Implementasi `cleanUrl` filter query string pada custom fetcher Eden Treaty)
- `apps/web/src/hooks/useStudentsList.ts` (Konstruksi dinamis query object tanpa atribut `undefined`)
- `apps/web/src/hooks/useDashboardSummary.ts` (Konstruksi dinamis query object)
- `api_test.json` & `scratch/` *(DIHAPUS)* (Pembersihan file pengujian)
