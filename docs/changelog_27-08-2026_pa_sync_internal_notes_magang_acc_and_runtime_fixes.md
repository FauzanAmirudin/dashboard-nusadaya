# Changelog: Sinkronisasi Panel PA, Validasi Catatan Internal, Perbaikan ACC Magang & Proteksi Runtime React

**Tanggal:** 27 Agustus 2026  
**Fokus:** Sinkronisasi Indikator PA, Validasi Tanggal Catatan Internal, Perbaikan ACC Divisi Magang, Penanganan Invalidasi Cache, dan Resolusi Runtime Crash React Child Object

---

## 1. Ringkasan Perubahan

Sesi pembaruan ini menyelesaikan empat isu utama integrasi dan stabilitas sistem dashboard Nusadaya Academy:
1. **Sinkronisasi Menyeluruh Indikator & Progres PA:** Standarisasi 3 Indikator Evaluasi Utama (`counselingDone`, `mentalStable`, `disciplineGood`) pada seluruh modul (Panel PA, Daftar Mahasiswa, dan Dashboard Evaluasi Finalisasi).
2. **Validasi Tanggal pada Catatan Internal:** Mencegah input tanggal mundur (lampau) dan memastikan `Tanggal Mulai <= Tanggal Berakhir` baik di sisi frontend maupun validasi server backend.
3. **Perbaikan Fitur ACC Divisi Magang & Sinkronisasi Lintas Panel:** Menyelaraskan 24/25 checklist indikator riil antara frontend dan backend, memastikan penyimpanan status `ACC` ke database, penambahan role permission, dan invalidasi cache otomatis.
4. **Resolusi Runtime Error Fatal React (`Objects are not valid as a React child: {fullName}`):** Penanganan safe string resolution pada `AccPanelStatusCard`, `PmbPanel`, `FinalDecisionPanel`, dan `renderStamp` digital footer.

---

## 2. Rincian Perubahan Berdasarkan Modul

### A. Modul Pendamping Akademik (PA)
1. **Standarisasi 3 Indikator Inti:**
   - **`apps/web/src/components/panels/PaPanel.tsx`**:
     - Mengubah formula progres dari 4 item menjadi **3 Indikator Inti** (`completedCount / 3 * 100%`).
     - Menyinkronkan badge status header `PanelStatusBadge` dengan `completed={completedCount}`, `total={3}`, `status={paData?.status}`, `isAcc={paData?.isAcc}`.
     - Memperbarui ringkasan progres informatif: `{completedCount}/3 Checklist Selesai ({totalVocab} Kosakata • {totalSentence} Kalimat • {counselingLogs.length} Sesi Konseling)`.
2. **Pembersihan Field Fiktif:**
   - **`apps/web/src/app/dashboard/students/page.tsx` & `apps/web/src/components/dashboards/EvaluasiFinalisasiDashboard.tsx`**:
     - Mengganti referensi field `session1Done..session4Done` dengan kolom riil database: `counselingDone`, `mentalStable`, dan `disciplineGood`.
     - Memperbarui label dari `Progress PA (4)` menjadi `Progress PA (3)`.
3. **Invalidasi Cache Real-Time:**
   - **`apps/api/src/routes/student/pa.ts`**:
     - Menambahkan pembersihan cache multi-pola (`cacheDel(cache:student:${id})`, `cacheInvalidatePattern("cache:students:*")`, `cacheInvalidatePattern("cache:mahasiswa:*")`, `cacheInvalidatePattern("cache:dashboard:*")`) pada seluruh endpoint mutasi PA (`POST /:id/pa/acc`, `DELETE /:id/pa/acc`, counseling, hafalan, student-notes, tripartite, interview, vocabulary).
4. **Dashboard Interaktif PA:**
   - **`apps/web/src/components/dashboards/PaDashboard.tsx` & `SharedDashboardLoader.tsx`**:
     - Menambahkan tombol **Refresh** reaktif dan badge indikator status real-time.

---

### B. Modul Catatan Internal Mahasiswa
1. **Validasi Frontend (`apps/web/src/components/panels/CatatanPanel.tsx`):**
   - Menambahkan atribut `min={todayStr}` pada input `Mulai Tanggal` untuk menonaktifkan pemilihan tanggal lampau di Date Picker.
   - Menambahkan atribut `min={formValidFrom || todayStr}` pada input `Hingga Tanggal`.
   - Validasi JavaScript sebelum submit:
     - Menolak tanggal mulai < hari ini: *"Tanggal mulai tidak boleh tanggal lampau (mundur)"*.
     - Menolak tanggal berakhir < hari ini: *"Tanggal berakhir tidak boleh tanggal lampau (mundur)"*.
     - Menolak tanggal mulai > tanggal berakhir: *"Tanggal mulai tidak boleh lebih dari tanggal berakhir"*.
   - Peringatan visual interaktif jika terdeteksi tanggal mulai melebihi tanggal berakhir.
2. **Validasi Backend API (`apps/api/src/routes/student/internal-notes.ts`):**
   - Menerapkan pengecekan `validFrom >= today`, `validUntil >= today`, dan `validFrom <= validUntil` pada rute `POST /:id/internal-notes` dan `PATCH /:id/internal-notes/:noteId`, mengembalikan `400 Bad Request` jika tidak valid.

---

### C. Modul Divisi Magang & Penempatan Internasional
1. **Penyelarasan Checklist & Backend ACC (`apps/api/src/routes/student/internship.ts`):**
   - Mengoreksi array `requiredReadyFields` yang sebelumnya salah mewajibkan `praPasporPddikti` (input milik Akademik) dan `loaReady` (frontend menggunakan `loaConfirmed`, `lolReady`, dan `moaReady`).
   - Menerapkan helper `getInternshipChecks` yang secara akurat memverifikasi seluruh 24/25 item checklist riil:
     - **Pra-Paspor (9/10 item):** Pas Foto, KTM, KTP, KK, Akta, SL-21, SKMA, Rekomendasi Disdik, CV (+ Gap Year jika berlaku).
     - **Dokumen Terbang (12 item):** Paspor, Interview, LoL, LoA, MoA, Kontrak, MCU, Visa, Tiket, PDT, Dokumentasi, Agen.
     - **Syarat Akhir (3 item):** Logbook, Laporan Akhir, Video Dokumentasi.
   - Menyimpan `isAcc: true`, `accAt: new Date()`, `accBy: userId`, dan `status: "ACC"` ke database `internship_data`.
   - Menambahkan role authorization `hasRole(user, "magang", "internship", "superadmin")`.
   - Menerapkan invalidasi cache otomatis pada seluruh rute mutasi Magang.
2. **Penyempurnaan Frontend Panel ([InternshipPanel.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/InternshipPanel.tsx)):**
   - Memperbaiki `handleAcc` dan `handleCancelAcc` untuk menangani respons dan menampilkan toast pesan error informatif dari server jika ada item yang belum selesai.
   - Menghubungkan badge status `PanelStatusBadge` pada header dengan `status={data?.status}` dan `isAcc={data?.isAcc}`.
3. **Integrasi Dashboard & Aggregated Status:**
   - **`MagangDashboard.tsx` & `SharedDashboardLoader.tsx`**: Menambahkan tombol **Refresh** reaktif dan badge indikator real-time.
   - **`apps/api/src/routes/student/status.ts`**: Menyelaraskan verifikasi indikator LoA (`loaConfirmed || loaReady || lolReady || moaReady`).

---

### D. Resolusi Runtime Error React (`Objects are not valid as a React child`)
1. **Analisis Masalah:**
   - Drizzle ORM me-return relasi user sebagai objek: `accBy: { fullName: string }`.
   - Di [PmbPanel.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/PmbPanel.tsx), prop diteruskan sebagai `accByUser={pmbData?.accByUser?.fullName || pmbData?.accBy}`.
   - Karena `pmbData.accByUser` bernilai `undefined`, fallback mengambil objek `pmbData.accBy`. Saat di-render ke JSX di `AccPanelStatusCard`, React langsung crash dengan error `Objects are not valid as a React child (found: object with keys {fullName})`, menyebabkan mahasiswa yang sudah di-ACC tidak bisa diakses/diperiksa lagi.
2. **Solusi & Implementasi:**
   - **`apps/web/src/components/ui/AccPanelStatusCard.tsx`**:
     - Menambahkan parser otomatis `resolvedAccUser` yang aman menangani tipe `string | { fullName?: string } | null | undefined`.
   - **`apps/web/src/components/panels/PmbPanel.tsx`**:
     - Memperbaiki prop: `accByUser={pmbData?.accBy?.fullName || pmbData?.accByUser?.fullName || (typeof pmbData?.accBy === "string" ? pmbData?.accBy : "Tim PMB")}`.
   - **`apps/web/src/app/dashboard/students/[id]/page.tsx`**:
     - Memperbarui fungsi `renderStamp` dan seluruh pemanggilan digital stamps untuk PMB, CRM, Finance, Akademik, PA, dan Magang.
   - **`apps/web/src/components/panels/FinalDecisionPanel.tsx`**:
     - Menambahkan safe navigation pada pemotongan nama validator `accBy`.

---

## 3. Berkas yang Dimodifikasi & Dibuat

### Backend (`apps/api`)
1. `src/routes/student/pa.ts` — Standarisasi invalidasi cache pada seluruh mutasi PA.
2. `src/routes/student/internal-notes.ts` — Validasi tanggal server-side (anti tanggal mundur & range tanggal).
3. `src/routes/student/internship.ts` — Penyelarasan checklist ACC Magang, role permission, status persistence, dan cache invalidation.
4. `src/routes/student/status.ts` — Perbaikan indikator LoA untuk agregasi status progres.

### Frontend (`apps/web`)
1. `src/components/panels/PaPanel.tsx` — Sinkronisasi progres 3 indikator dan badge header.
2. `src/components/dashboards/PaDashboard.tsx` — Tombol Refresh dan badge live sync.
3. `src/components/panels/CatatanPanel.tsx` — Validasi tanggal input form (anti mundur & range validasi).
4. `src/components/panels/InternshipPanel.tsx` — Perbaikan handler ACC dan badge status header.
5. `src/components/dashboards/MagangDashboard.tsx` — Tombol Refresh dan badge live sync.
6. `src/components/dashboards/SharedDashboardLoader.tsx` — Integrasi callback `onUpdate` untuk Dashboard PA dan Magang.
7. `src/components/dashboards/EvaluasiFinalisasiDashboard.tsx` — Penyelarasan checklist PA dari data riil DB.
8. `src/app/dashboard/students/page.tsx` — Penyelarasan checklist PA pada daftar mahasiswa.
9. `src/components/ui/AccPanelStatusCard.tsx` — Safe user string resolution untuk proteksi React child object.
10. `src/components/panels/PmbPanel.tsx` — Koreksi prop `accByUser`.
11. `src/app/dashboard/students/[id]/page.tsx` — Proteksi `renderStamp` digital stamps footer.
12. `src/components/panels/FinalDecisionPanel.tsx` — Proteksi pemotongan nama validator `accBy`.

---

## 4. Hasil Verifikasi & Validasi

- **Next.js Production Build (`bun --filter web build`):**
  - **Status: 100% SUKSES (Exit Code 0)**
  - Seluruh 39 rute static dan dynamic berhasil di-generate tanpa peringatan maupun compiler error.
- **Halaman Detail Mahasiswa (`/dashboard/students/[id]`):**
  - Tombol **Periksa** dapat dibuka dengan normal pada mahasiswa yang telah memiliki data ACC di berbagai divisi.
  - Button ACC di Divisi Magang dapat diklik, diverifikasi kelengkapannya, dan tersimpan permanen di database.
