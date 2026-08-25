# Dokumentasi Redesign Neumorphism (Soft UI), Sinkronisasi Real-Time CRM & Standardisasi Modul Finance
**Dashboard Nusadaya — 25 Agustus 2026**

---

## Ringkasan Eksekutif

Pada tanggal **25 Agustus 2026**, sistem **Dashboard Nusadaya** telah menerima pembaruan desain antarmuka berskala besar dengan mengadopsi estetika **Neumorphism (Soft UI) & Double-Bezel Tactile Design**, serta penyempurnaan alur bisnis dan sinkronisasi data real-time pada modul **CRM (Customer Relationship Management)** dan **Finance (Keuangan Mahasiswa)**:

1. **Aesthetic Redesign (Neumorphism / Soft UI & Double-Bezel)**: Merombak seluruh jajaran KPI Stat Cards Header pada 10 halaman dashboard, panel headers, kartu status persetujuan ACC, dan header profil mahasiswa menjadi tampilan 3D tactile yang elegan, berkedalaman halus (*subtle depth*), memiliki highlight specular, dan efek cekung (*concave inset*) pada ikon.
2. **Sinkronisasi Dokumen & Progress CRM Real-Time**: Menerapkan deteksi fisik keberadaan berkas secara otomatis di backend dan frontend. Sistem secara otomatis menambah (+1/8) atau mengurangi (-1/8) poin progress saat dokumen diunggah atau dihapus, mereset flag database jika tidak ada file aktif, serta merombak checklist One Day Service (ODS) ala PMB dengan validasi ketat 5/5 sesi sebelum dapat dinyatakan selesai.
3. **Standardisasi 6 Indikator Finance & Multi-Domain Cache Invalidation**: Menyeragamkan perhitungan progress keuangan menjadi 6 indikator pokok yang konsisten antara Detail Panel, Dashboard Finance, Monitoring Mahasiswa, dan Endpoint Status, serta menerapkan pembersihan cache otomatis (*cache busting*) lintas domain secara instan pada setiap mutasi data keuangan.

---

## 1. Redesign Neumorphism (Soft UI) & Double-Bezel Visual Aesthetics Upgrade

Mengikuti arahan desain antarmuka modern dan implementasi skill visual tingkat tinggi (*Taste Skill & High-End Visual Design*), seluruh kartu ringkasan statistik (KPI Stat Cards) dan panel header ditingkatkan dari tampilan *flat card* biasa menjadi **Neumorphic Soft UI** dengan konstruksi **Double-Bezel**.

```
┌──────────────────────────────────────────────────────────────────┐
│  OUTER BEZEL (Raised 3D Surface - Subtle Dual Shadow)           │
│  linear-gradient(135deg, rgba(255,255,255,0.95), #e2e8f0)       │
│  box-shadow: 8px 8px 20px rgba(163,177,198,0.45), -8px -8px 20px │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  INNER CORE SURFACE (Card Body)                            │  │
│  │  bg: #f4f7fb | inset top highlight: rgba(255,255,255,0.95)  │  │
│  │  ┌──────────────┐                                          │  │
│  │  │ CONCAVE ICON │   Metric Value (text-2xl font-black)     │  │
│  │  │ Inset Shadow │   Label (text-xs font-semibold)          │  │
│  │  └──────────────┘   Status Badge & Category Trend          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### A. Filosofi Desain & Token Visual CSS

1. **Outer Raised Bezel**: Menggunakan kombinasi bayangan luar (*outer dual shadows*) dengan kontras lembut:
   - *Drop shadow gelap*: `8px 8px 20px rgba(163, 177, 198, 0.45)`
   - *Specular highlight terang*: `-8px -8px 20px rgba(255, 255, 255, 0.95)`
   - *Gradient ring*: `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(226, 232, 240, 0.7) 100%)`
2. **Inner Core Surface**: Permukaan kartu bagian dalam berwarna `#f4f7fb` dengan border radius `rounded-[calc(1rem-2px)]` dan bayangan inset halus di bagian atas `inset 0 1px 1px rgba(255, 255, 255, 0.95)` untuk efek pantulan cahaya 3D.
3. **Concave Inset Icon Box**: Kotak ikon menggunakan bayangan dalam (*inner concave shadow*):
   - `inset 3px 3px 6px rgba(163, 177, 198, 0.45), inset -3px -3px 6px rgba(255, 255, 255, 0.95)`
   - Memberikan ilusi visual bahwa kotak ikon tertekan ke dalam permukaan kartu.
4. **Spring Physics & Micro-Interactions**: Ditambahkan efek hover interaktif dengan transisi `transform: translateY(-2px) scale(1.008)` dan animasi glow yang responsif.

---

### B. Komponen Baru & Pembaruan Arsitektur UI

#### 1. `apps/web/src/components/ui/NeumorphicStatCard.tsx`
Komponen universal untuk seluruh KPI Stat Cards di dashboard:
- Mendukung varian warna: `blue`, `emerald`, `amber`, `rose`, `indigo`, `sky`, `purple`, `slate`.
- Fitur: Vertical left accent bar, concave inset icon container, typography scale tebal (`font-black`), progress bar opsional, dan badge status mini.

#### 2. `apps/web/src/components/ui/PanelHeader.tsx`
Header utama untuk setiap halaman panel mahasiswa:
- Memadukan ikon bergaya soft-elevation, judul panel, subjudul deskriptif, tag divisi, serta badge kelengkapan indikator (`PanelStatusBadge`).

#### 3. `apps/web/src/components/ui/AccPanelStatusCard.tsx`
Komponen persisten kartu status persetujuan ACC di bagian bawah setiap panel detail:
- Desain double-bezel dengan background status adaptif (Emerald saat ACC disetujui, Amber saat masih berproses).
- Tombol aksi ACC resmi beranimasi, modal konfirmasi pembatalan ACC, serta penampil nama validator dan tanggal validasi resmi.

---

### C. Distribusi Penerapan pada Dashboard & Panel

| Modul / Halaman | Lokasi Berkas | Elemen yang Diberikan Neumorphism |
| :--- | :--- | :--- |
| **Main Dashboard** | [`/dashboard/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/page.tsx) | 6 KPI Header Cards (Total Mahasiswa, PMB ACC, Aman, Perhatian, Tidak Aman, Layak Berangkat) |
| **Direktori Mahasiswa** | [`/dashboard/students/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/page.tsx) | 6 KPI Header Cards & Header Panel Filter |
| **Evaluasi & Finalisasi** | [`EvaluasiFinalisasiDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/EvaluasiFinalisasiDashboard.tsx) | 6 KPI Summary Cards & Filter Controller |
| **PMB Dashboard** | [`PmbDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/PmbDashboard.tsx) | 6 KPI Stat Cards & Target Registrasi |
| **CRM Dashboard** | [`CrmDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/CrmDashboard.tsx) | 6 KPI Stat Cards & Monitoring Sesi ODS |
| **Finance Dashboard** | [`FinanceDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx) | 6 KPI Stat Cards & Realisasi Pendapatan |
| **Akademik Dashboard** | [`AkademikDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/AkademikDashboard.tsx) | 6 KPI Stat Cards & Presensi Perkuliahan |
| **PA Dashboard** | [`PaDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/PaDashboard.tsx) | 6 KPI Stat Cards & Rekap Bimbingan PA |
| **Magang Dashboard** | [`MagangDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/MagangDashboard.tsx) | 6 KPI Stat Cards & Kesiapan Paspor/Visa |
| **Dosen Dashboard** | [`DosenDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/DosenDashboard.tsx) | 3 KPI Stat Cards Mata Kuliah Diampu |
| **Detail Mahasiswa Header** | [`/dashboard/students/[id]/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/[id]/page.tsx) | Profile Header Card, Avatar Inset, Status Pill |
| **7 Panel Divisi Mahasiswa** | `PmbPanel.tsx`, `CrmPanel.tsx`, `FinancePanel.tsx`, `AkademikPanel.tsx`, `PaPanel.tsx`, `InternshipPanel.tsx`, `CatatanPanel.tsx` | PanelHeader & Persistent AccPanelStatusCard |

---

## 2. Peningkatan Modul CRM, Deteksi Fisik Dokumen & Validasi ODS

### A. Sinkronisasi Logika Upload & Hapus Dokumen terhadap Progress
- **Masalah Sebelumnya**: Saat berkas laporan ODS atau Pra-Magang diunggah, progress bertambah (+1/8 poin). Namun ketika berkas dihapus dari tabel, status progress tidak berkurang dan sistem tetap mengingat berkas seolah-olah masih ada.
- **Solusi Backend (`apps/api/src/routes/student/crm.ts`)**:
  - Endpoint `DELETE /:id/crm/documents/:docId` diperbarui untuk memeriksa sisa berkas dengan `documentKey` terkait (`ods_report`, `ods_documentation`, `pramagang_report`, `pramagang_documentation`).
  - Jika jumlah berkas tersisa bernilai `0`, kolom boolean di database (`isOdsReport` / `isPrammagangReport`) otomatis di-reset menjadi `false`, dan seluruh cache terkait langsung diinvalidasi (`invalidateCrmCaches`).

### B. Verifikasi Keberadaan Dokumen Fisik & Database Auto-Sync
- Endpoint `GET /:id/crm` kini memeriksa tabel `crmDocuments` secara fisik pada setiap kueri:
  ```typescript
  const docs = await db.query.crmDocuments.findMany({
      where: eq(crmDocuments.studentId, id),
  });
  const hasOdsReport = docs.some((d) => d.documentKey === "ods_report");
  const hasPrammagangReport = docs.some((d) => d.documentKey === "pramagang_report");

  if (crm && (crm.isOdsReport !== hasOdsReport || crm.isPrammagangReport !== hasPrammagangReport)) {
      await db.update(crmData).set({
          isOdsReport: hasOdsReport,
          isPrammagangReport: hasPrammagangReport,
          updatedAt: new Date(),
      }).where(eq(crmData.studentId, id));
      crm.isOdsReport = hasOdsReport;
      crm.isPrammagangReport = hasPrammagangReport;
  }
  ```
- Endpoint perhitungan progress mahasiswa (`apps/api/src/routes/student/status.ts`) juga memeriksa tabel `crmDocuments` secara langsung sehingga nilai progress selalu akurat 100%.

### C. Deteksi Dinamis UI & Badge Status Berkas
- **`DocumentUpload.tsx`**: Ditambahkan callback `onDocumentsLoaded`, `onDeleteSuccess`, dan `onUploadSuccess`.
- **`TabOds.tsx` & `TabPraMagang.tsx`**: Badge status di header kotak upload dievaluasi secara dinamis:
  - Jika berkas kosong (`documents.length === 0`): Status menampilkan badge Amber **`Belum Diunggah`** dan memicu sinkronisasi state.
  - Jika berkas ada (`documents.length > 0`): Status menampilkan badge Emerald **`✓ Terunggah (Lengkap)`**.

### D. Redesign Checklist 5 Sesi ODS Ala Dokumen PMB & Validasi Ketat 5/5
- **Tampilan Ala PMB (`TabOds.tsx`)**:
  - Mengganti checklist lama menjadi kartu grid interaktif dengan *left border accent*, badge `X/5 Selesai`, transisi `border-emerald-200 bg-emerald-50/20` saat selesai, serta input Tanggal Pelaksanaan dan Nama Industri per sesi.
- **Validasi Ketat 5/5**:
  - Tombol *"Tandai ODS Selesai"* dinonaktifkan (*disabled*) dengan tooltip peringatan jika sesi yang selesai masih `< 5`.
  - Status indikator `odsDocumentation` hanya dapat bernilai `true` jika seluruh 5 sesi (1 s.d. 5) berstatus selesai.
  - Jika salah satu sesi di-uncheck, status indikator otomatis kembali ke belum selesai.

---

## 3. Standardisasi Modul Finance, 6 Indikator Pokok & Integrasi Real-Time

### A. Standardisasi 6 Indikator Pokok Keuangan (100% Seragam)
Sebelumnya terdapat inkonsistensi di mana Detail Panel (`FinancePanel.tsx`) hanya menghitung 4 item (tanpa Interview & Keberangkatan), sementara Dashboard Finance dan Status Mahasiswa menghitung 6 item. Seluruh sistem kini diseragamkan menghitung **6 indikator pokok**:

1. **Registrasi Awal / Pendaftaran**: `registrasiStatus` (Lunas Registrasi)
2. **Perkuliahan Semester**: `mandiriSemesterStatus` (Mandiri) atau `t1SemesterStatus` (Talangan)
3. **Interview Magang**: `mandiriInterviewStatus` (Mandiri) atau `t1InterviewStatus` (Talangan)
4. **Keberangkatan**: `mandiriKeberangkatanStatus` (Mandiri) atau `t2KeberangkatanStatus` (Talangan)
5. **Sertifikasi Bahasa (TOEIC)**: `toeicStatus`
6. **Paspor & Dokumen**: `pasporStatus`

Penyelarasan diterapkan pada:
- [`FinancePanel.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/FinancePanel.tsx) (`completedCount` / `totalChecks = 6`)
- [`FinanceDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx) (`getFinanceChecklist`)
- [`EvaluasiFinalisasiDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/EvaluasiFinalisasiDashboard.tsx) (`getFinanceChecklist`)
- [`/dashboard/students/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/page.tsx) (`getFinanceChecklist`)
- [`apps/api/src/routes/student/status.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/student/status.ts) (`financeItems`)
- [`apps/api/src/routes/student/finance.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/student/finance.ts) (`PATCH /:id/finance` & `POST /:id/finance/acc`)

---

### B. Multi-Domain Cache Invalidation Terpadu (`invalidateFinanceCaches`)

Untuk menjamin perubahan pembayaran, cicilan, dan partisi langsung tampil seketika di dashboard tanpa jeda cache:
```typescript
async function invalidateFinanceCaches(studentId: number) {
    await Promise.all([
        cacheDel(`cache:student:${studentId}`),
        cacheInvalidatePattern("cache:students:*"),
        cacheInvalidatePattern("cache:mahasiswa:*"),
        cacheInvalidatePattern("cache:dashboard:*"),
    ]);
}
```
Fungsi ini dipanggil pada seluruh mutasi keuangan:
- `PATCH /:id/finance` (Update pembayaran, partisi, status tagihan)
- `POST /:id/finance/acc` & `DELETE /:id/finance/acc` (Persetujuan & Pembatalan ACC)
- `PATCH /:id/finance/semesters/:semesterId` (Update tagihan semester)
- `POST /:id/finance/semesters/bulk-payment` (Pembayaran multi-semester)
- `POST /:id/finance/semesters/:semesterId/installments` (Tambah cicilan semester)
- `PATCH` & `DELETE` cicilan semester
- `POST`, `PATCH`, `DELETE` cicilan dana talangan (`talangan-installments`)

---

### C. Resolusi Masalah Skema & Perbaikan Sintaks Backend
1. **Pembersihan Referensi Properti Tak Dikenal**:
   - Menghapus referensi `registrationPaid` pada `finance.ts` dan beralih sepenuhnya ke kolom skema resmi `registrasiStatus`.
2. **Perbaikan Syntax Chaining Bracket**:
   - Menghapus penutup blok ganda `})` yang memutus rantai *Elysia routing* pada `finance.ts`.
3. **Penyelarasan Format Kode**:
   - Menjalankan `bun x biome check --write` untuk memastikan kepatuhan standar format.

---

## 4. Tabel Komparasi Before vs After

| Aspek / Fitur | Kondisi Sebelumnya | Kondisi Setelah Pembaruan |
| :--- | :--- | :--- |
| **Gaya Visual Stat Cards Header** | Flat card biasa dengan border abu-abu | **Neumorphic Soft UI** dengan double-bezel, 3D raised surface, dan concave inset icon |
| **Card Status ACC Panel** | Komponen lokal sederhana, styling dasar | **`AccPanelStatusCard` universal**, double-bezel, transisi status dinamis, dan dialog konfirmasi |
| **Hapus Berkas Dokumen CRM** | Progress tidak berkurang, sistem tetap mengingat file | **Auto-decrement (-1/8)**, status database otomatis `false` jika sisa berkas = 0 |
| **Deteksi Berkas Kosong CRM** | Menampilkan "✓ Terunggah" karena membaca boolean DB | **Verifikasi fisik berkas**, otomatis menampilkan "Belum Diunggah" jika file fisik kosong |
| **Checklist ODS di Panel CRM** | Checklist checkbox sederhana | **Layout kartu grid ala PMB**, counter `X/5`, dan validasi ketat 5/5 sebelum ACC |
| **Jumlah Indikator Progress Finance** | Berbeda (Panel: 4 item, Dashboard: 6 item) | **100% Seragam (6 Item)** di Panel, Dashboard, List Mahasiswa, dan Status Calculation |
| **Cache Invalidation Finance** | Hanya `cache:students:list:*` (Dashboard tidak real-time) | **`invalidateFinanceCaches` multi-domain** (Detail, List, Mahasiswa, Dashboard real-time) |
| **Validasi ACC Panel Finance** | Memeriksa 4 tagihan | **Memeriksa seluruh 6 tagihan pokok** (Registrasi, Semester, Interview, Keberangkatan, TOEIC, Paspor) |
| **Status Build & Kompilasi** | - | **100% Bersih (Exit Code: 0)** pada seluruh 37 rute Next.js & Elysia API |

---

## 5. Daftar Berkas Baru & Berkas Terdampak

### A. Komponen Baru
1. [`apps/web/src/components/ui/NeumorphicStatCard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/ui/NeumorphicStatCard.tsx) — Komponen KPI Stat Card bergaya Neumorphism (Soft UI).
2. [`apps/web/src/components/ui/PanelHeader.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/ui/PanelHeader.tsx) — Komponen header panel mahasiswa dengan elevated icon & status badge.
3. [`apps/web/src/components/ui/AccPanelStatusCard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/ui/AccPanelStatusCard.tsx) — Komponen kartu status persetujuan ACC persisten untuk seluruh 7 panel divisi.

### B. Berkas Frontend yang Dimodifikasi
1. [`apps/web/src/components/ui/DocumentUpload.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/ui/DocumentUpload.tsx) — Handler `onDocumentsLoaded`, `onDeleteSuccess`, dan `onUpdate`.
2. [`apps/web/src/components/panels/crm/TabOds.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/crm/TabOds.tsx) — Redesign ODS checklist ala PMB, deteksi fisik upload, validasi ketat 5/5.
3. [`apps/web/src/components/panels/crm/TabPraMagang.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/crm/TabPraMagang.tsx) — Deteksi fisik upload laporan Pra-Magang dan sinkronisasi badge.
4. [`apps/web/src/components/panels/FinancePanel.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/FinancePanel.tsx) — Standardisasi 6 indikator finance & integrasi `AccPanelStatusCard`.
5. [`apps/web/src/components/panels/PmbPanel.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/PmbPanel.tsx) — Integrasi `PanelHeader` & `AccPanelStatusCard`.
6. [`apps/web/src/components/panels/CrmPanel.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/CrmPanel.tsx) — Integrasi `PanelHeader` & `AccPanelStatusCard`.
7. [`apps/web/src/components/panels/AkademikPanel.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/AkademikPanel.tsx) — Integrasi `PanelHeader` & `AccPanelStatusCard`.
8. [`apps/web/src/components/panels/PaPanel.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/PaPanel.tsx) — Integrasi `PanelHeader` & `AccPanelStatusCard`.
9. [`apps/web/src/components/panels/InternshipPanel.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/InternshipPanel.tsx) — Integrasi `PanelHeader` & `AccPanelStatusCard`.
10. [`apps/web/src/app/dashboard/students/[id]/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/[id]/page.tsx) — Upgrade Neumorphic Profile Header Card.
11. [`apps/web/src/app/dashboard/students/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/page.tsx) — Neumorphic KPI Cards & standardisasi `getFinanceChecklist`.
12. [`apps/web/src/components/dashboards/FinanceDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx) — Neumorphic KPI Cards & sinkronisasi checklist finance.
13. [`apps/web/src/components/dashboards/EvaluasiFinalisasiDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/EvaluasiFinalisasiDashboard.tsx) — Standardisasi `getFinanceChecklist`.
14. [`apps/web/src/app/dashboard/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/page.tsx) — Neumorphic KPI Summary Cards.
15. [`apps/web/src/components/dashboards/PmbDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/PmbDashboard.tsx) — Neumorphic KPI Summary Cards.
16. [`apps/web/src/components/dashboards/CrmDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/CrmDashboard.tsx) — Neumorphic KPI Summary Cards.
17. [`apps/web/src/components/dashboards/AkademikDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/AkademikDashboard.tsx) — Neumorphic KPI Summary Cards.
18. [`apps/web/src/components/dashboards/PaDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/PaDashboard.tsx) — Neumorphic KPI Summary Cards.
19. [`apps/web/src/components/dashboards/MagangDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/MagangDashboard.tsx) — Neumorphic KPI Summary Cards.
20. [`apps/web/src/components/dashboards/DosenDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/DosenDashboard.tsx) — Neumorphic KPI Summary Cards.

### C. Berkas Backend yang Dimodifikasi
1. [`apps/api/src/routes/student/finance.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/student/finance.ts) — Implementasi `invalidateFinanceCaches`, standardisasi 6 indikator, perbaikan sintaks & skema.
2. [`apps/api/src/routes/student/crm.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/student/crm.ts) — Auto-decrement progress pada delete berkas & verifikasi fisik berkas pada `GET /:id/crm`.
3. [`apps/api/src/routes/student/status.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/student/status.ts) — Perhitungan progress CRM berdasarkan berkas fisik di `crmDocuments` & 6 indikator finance.

---

## 6. Verifikasi & Build Status

- **Next.js Production Build**: `bun run build` sukses (**Exit Code: 0**) pada seluruh 37 rute aplikasi.
- **Code Linter & Formatter**: `bun x biome check` bersih tanpa error (**Exit Code: 0**).
- **TypeScript Typecheck**: 0 error tipe data pada seluruh modul frontend dan backend.
