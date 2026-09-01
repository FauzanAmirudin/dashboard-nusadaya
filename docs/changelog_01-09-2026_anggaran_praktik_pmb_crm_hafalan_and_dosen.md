# Changelog: Manajemen Anggaran Praktik, Laporan Sisa Bahan Vokasi, Sinkronisasi Hafalan CRM-PA, Perbaikan PMB & Clean Up Panel Dosen

**Tanggal:** 1 September 2026  
**Fokus:** Pelaporan Sisa Bahan Praktik, Sinkronisasi Real-Time Hafalan PA ke CRM, Validasi Tanggal Pra-Magang, Restriksi Hapus Mahasiswa PMB, Checklist Manual PDF PMB, Perbaikan Navigasi & Filter Catatan Internal, Clean Up Badge Pertemuan Dosen, Bun Upgrade v1.4.0, dan Panduan Version Control GitHub.

---

## 1. Ringkasan Perubahan

Sesi pembaruan ini menghadirkan perbaikan menyeluruh pada alur kerja operasional akademik, keuangan vokasi, dan integrasi lintas divisi:

1. **Modul Anggaran Praktik & Pelaporan Sisa Bahan (Vocational Leftover Materials):**
   - Implementasi penuh siklus pelaporan sisa bahan pasca-praktik dari sisi Dosen hingga monitoring Keuangan (*Finance*).
   - Penambahan endpoint REST API backend (`GET`, `POST`, `PUT`, `DELETE /dosen/laporan-sisa-bahan`) dengan dukungan upload berkas laporan resmi (PDF/Excel) via `fileService`.
   - Penyempurnaan modal input: menampilkan ringkasan nama barang/material asli (`getItemsSummary`) pada dropdown pengajuan, serta penambahan kolom dan selektor **Kondisi Bahan** (*Baik/Layak, Rusak/Cacat, Kedaluwarsa, Perlu Penanganan, Habis Terpakai*).
2. **Penyelarasan & Sinkronisasi Hafalan Real-Time CRM ➔ PA:**
   - Menghubungkan tabel data `pa_hafalan_sessions` ke endpoint CRM backend (`GET /:id/crm`) dan komponen `TabHafalan.tsx`.
   - Menampilkan metrik KPI hafalan, ringkasan jumlah kosakata & kalimat, tanggal setor terakhir, serta tombol sinkronisasi instan.
3. **Validasi Tanggal Pra-Magang & Reset Timestamp:**
   - Pencegahan pemilihan tanggal lampau/mundur pada form masa pra-magang di `TabPraMagang.tsx`.
   - Penambahan tombol **Reset Tanggal** dan sanitasi string kosong (`""` ➔ `null`) pada backend PostgreSQL timestamp.
4. **Peningkatan Keamanan PMB & Integritas Checklist:**
   - Membatasi fitur penghapusan mahasiswa di panel PMB khusus untuk role `superadmin`.
   - Memastikan proses checklist verifikasi berkas PDF di PMB tetap manual (tidak tercentang otomatis saat file diunggah).
5. **Perbaikan Navigasi & UI Label Catatan Internal:**
   - Memperbaiki tombol *"Kembali ke Dashboard"* dari Catatan Internal agar mengarah ke dashboard sesuai role pengguna.
   - Merapikan label filter dropdown dengan Title Case yang bersih dan ikon kategori.
6. **Clean Up Tampilan Panel Dosen:**
   - Menghapus badge kotak representasi pertemuan (`PKKMB`, `BC`, `P1`, `UTS`, `UAS`) pada halaman Detail Mata Kuliah agar daftar sesi perkuliahan lebih ringkas dan elegan.
7. **Pembaruan Infrastruktur & Panduan Version Control:**
   - Upgrade runtime Bun ke versi `1.4.0`.
   - Pembuatan dokumen panduan rilis versi `update-version.md` untuk manajemen Git Tags, GitHub Releases, dan prosedur rollback server.

---

## 2. Rincian Perubahan Berdasarkan Modul

### A. Modul Dosen & Anggaran Praktik Vokasi

1. **Backend API Rute Laporan Sisa Bahan (`apps/api/src/routes/dosen.ts`):**
   - **`GET /dosen/laporan-sisa-bahan`**: Mengambil daftar seluruh riwayat laporan sisa bahan yang berelasi dengan Dosen pengampu dan data Pengajuan Anggaran Praktik.
   - **`POST /dosen/laporan-sisa-bahan`**: Menerima multipart `FormData` atau JSON payload, mem-parsing array `daftarSisaBahan`, mengunggah berkas lampiran (PDF/Excel) ke sistem storage via `fileService`, dan menyimpannya ke tabel `practices_material_reports`.
   - **`PUT /dosen/laporan-sisa-bahan/:id`**: Memperbarui rincian sisa material, catatan dosen, dan berkas lampiran yang telah tersimpan.
   - **`DELETE /dosen/laporan-sisa-bahan/:id`**: Menghapus data laporan sisa bahan beserta relasinya.

2. **Frontend Tab Anggaran Praktik (`apps/web/src/app/dashboard/mata-kuliah/[id]/TabAnggaranPraktik.tsx`):**
   - **Pemanggilan Data Otomatis:** Memasukkan `fetchReports()` ke dalam `useEffect` saat halaman pertama kali dimuat.
   - **Selektor Dropdown Berbasis Nama Barang Asli:** Menggunakan helper `getItemsSummary(req)` untuk menampilkan daftar material asli (contoh: *"Tepung Terigu, Mentega, Telur (+2 bahan lainnya)"*) disertai badge total nominal dan jumlah item bahan, menggantikan ID mentah.
   - **Selektor Kondisi Bahan pada Form Modal:** Menambahkan kolom **Kondisi Bahan** (*Baik / Layak, Rusak / Cacat, Kedaluwarsa, Perlu Penanganan, Habis Terpakai*) pada setiap baris item sisa material saat Dosen mengunggah atau mengedit laporan.
   - **Visualisasi Badge Kondisi:** Menyelaraskan pewarnaan badge kondisi pada tabel riwayat laporan Dosen dan detail laporan di Dashboard Keuangan (*Finance*).
   - **Sinkronisasi Link Unduhan Berkas:** Memformat URL unduhan berkas laporan (`/download/:fileId`) agar dapat dibuka/diunduh langsung.

3. **Clean Up Detail Mata Kuliah (`apps/web/src/app/dashboard/mata-kuliah/[id]/page.tsx`):**
   - Menghapus badge kotak pertemuan (`PKKMB`, `BC`, `P1`, `UTS`, `UAS`) di sisi kiri baris accordion trigger.
   - Membersihkan variabel tak terpakai (`isPkkmb`, `isBeginning`, `isUts`, `isUas`) untuk menjaga performa rendering.

---

### B. Modul CRM & Pendamping Akademik (PA)

1. **Sinkronisasi Real-Time Hafalan PA ➔ CRM:**
   - **`apps/api/src/routes/student/crm.ts`**: Menambahkan relasi data `paData`, `paHafalanSessions`, dan `vocabLogs` pada respons `GET /:id/crm`.
   - **`apps/api/src/routes/student/pa.ts`**: Mengizinkan akses role `superadmin` pada endpoint hafalan dan menerapkan invalidasi cache otomatis.
   - **`apps/web/src/components/panels/crm/TabHafalan.tsx`**: Menampilkan ringkasan metrik live (Total Kosakata, Total Kalimat, Terakhir Setor), daftar riwayat hafalan dengan badge bahasa (Arab/Inggris/Jepang), nama penilai, catatan evaluasi, tombol sinkronisasi manual, dan toggle ACC.

2. **Validasi & Proteksi Masa Pra-Magang:**
   - **`apps/api/src/routes/student/crm.ts`**: Sanitasi input `pramagangStartDate` dan `pramagangEndDate` agar string kosong (`""`) diubah menjadi `null` sebelum update query ke PostgreSQL.
   - **`apps/web/src/components/panels/crm/TabPraMagang.tsx`**:
     - Menambahkan batasan `min={today}` pada tanggal mulai dan `min={startDate}` pada tanggal berakhir.
     - Validasi toast error jika terdeteksi pengisian tanggal mundur.
     - Menambahkan tombol **Reset Tanggal** untuk mengosongkan tanggal masa pra-magang dengan aman.

---

### C. Modul Penerimaan Mahasiswa Baru (PMB)

1. **Restriksi Fitur Hapus Mahasiswa:**
   - **`apps/web/src/components/panels/pmb/TabDataTambahan.tsx` & `archive/page.tsx`**:
     - Membatasi tombol *"Hapus Mahasiswa"* hanya dapat dilihat dan dieksekusi oleh role `superadmin`.
     - Staf PMB tidak lagi memiliki hak akses penghapusan permanen data pendaftar.

2. **Checklist Manual PDF PMB:**
   - **`apps/web/src/components/panels/pmb/TabChecklist.tsx`**:
     - Menghapus otomatisasi centang checklist saat file PDF diunggah.
     - Checklist verifikasi dokumen tetap bersifat manual untuk memastikan verifikator memeriksa fisik/konten dokumen secara teliti.

3. **Standardisasi Status PMB:**
   - Menyelaraskan penghitungan progres 14 checklist PMB pada KPI cards di `PmbDashboard.tsx`.

---

### D. Modul Catatan Internal Mahasiswa

1. **Navigasi Tombol Kembali:**
   - **`apps/web/src/components/panels/CatatanPanel.tsx`**:
     - Mengganti path statis `/dashboard/catatan` dengan pemetaan dinamis `VALID_PANEL_DASHBOARDS` yang mengarahkan pengguna kembali ke dashboard divisi masing-masing.

2. **Pembersihan Tampilan Filter Dropdown:**
   - Mengubah tampilan key mentah (seperti `izin_resmi`, `pengecualian_akademik`) menjadi teks Title Case yang rapi (*"Izin Resmi"*, *"Pengecualian Akademik"*) dilengkapi ikon visual kategori.

---

### E. Infrastruktur, Media Storage & Version Control

1. **Upgrade Runtime Bun:**
   - Upgrade Bun global ke versi `1.4.0` dan dependensi `@types/bun: "^1.4.0"` pada `apps/web/package.json`.

2. **Akses Media & Foto Profil Publik:**
   - **`apps/api/src/modules/file/routes/download.ts`**: Membuka akses unduhan avatar/foto profil publik tanpa terblokir autentikasi token.
   - Menyinkronkan pembaruan foto profil mahasiswa ke tabel `users` yang terhubung.

3. **Panduan Version Control (`update-version.md`):**
   - Membuat file panduan komprehensif mengenai Semantic Versioning, pembuatan Git Tag, publikasi GitHub Release, dan perintah rollback server instan.

---

## 3. Berkas yang Dimodifikasi & Dibuat

### Berkas Baru (`NEW`)
1. `docs/changelog_01-09-2026_anggaran_praktik_pmb_crm_hafalan_and_dosen.md` — Dokumentasi lengkap changelog sistem per 1 September 2026.
2. `update-version.md` — Panduan operasional Git Tag, GitHub Releases, dan Server Rollback.

### Backend (`apps/api`)
1. `src/routes/dosen.ts` — Implementasi rute `GET`, `POST`, `PUT`, `DELETE /dosen/laporan-sisa-bahan` dan integrasi `fileService`.
2. `src/routes/student/crm.ts` — Integrasi data sesi hafalan PA dan sanitasi reset timestamp pra-magang.
3. `src/routes/student/pa.ts` — Otorisasi role superadmin pada endpoint hafalan dan pembersihan cache.
4. `src/modules/file/routes/download.ts` — Dukungan akses publik untuk avatar dan unduhan dokumen laporan.

### Frontend (`apps/web`)
1. `src/app/dashboard/mata-kuliah/[id]/TabAnggaranPraktik.tsx` — Perbaikan pelaporan sisa bahan, selector nama barang asli, selektor kondisi bahan, dan badge status.
2. `src/app/dashboard/mata-kuliah/[id]/page.tsx` — Pembersihan badge representasi pertemuan pada accordion trigger.
3. `src/components/panels/crm/TabHafalan.tsx` — Integrasi live data hafalan PA, metrik KPI, dan approval action.
4. `src/components/panels/crm/TabPraMagang.tsx` — Validasi anti tanggal mundur dan tombol reset tanggal.
5. `src/components/panels/CrmPanel.tsx` — Penyelarasan state types untuk data PA hafalan.
6. `src/components/panels/CatatanPanel.tsx` — Navigasi tombol kembali dan perapian label filter dropdown.
7. `src/components/panels/pmb/TabChecklist.tsx` — Penonaktifan auto-check saat upload PDF.
8. `src/components/panels/pmb/TabDataTambahan.tsx` — Restriksi tombol hapus mahasiswa khusus superadmin.
9. `src/components/dashboards/PmbDashboard.tsx` — Standarisasi kalkulasi status 14 item checklist PMB.
10. `package.json` — Pembaruan dependensi `@types/bun: "^1.4.0"`.

---

## 4. Hasil Verifikasi & Validasi

- **Verifikasi Alur Pelaporan Sisa Bahan:**
  - Form modal berhasil memuat data pengajuan dengan nama bahan asli dan nominal.
  - Pilihan kondisi bahan (*Baik, Rusak, Kedaluwarsa, Perlu Penanganan, Habis*) tersimpan dengan benar ke database.
  - Berkas lampiran laporan dapat diunggah dan diunduh kembali via server storage.
- **Verifikasi Sinkronisasi CRM & PA:**
  - Data hafalan yang diinput di akun PA langsung tampil secara real-time pada tab Hafalan di panel CRM.
  - Tanggal pra-magang tidak dapat dipilih mundur dari hari ini, dan tombol reset berfungsi mengembalikan status ke tanggal awal.
- **Integritas PMB & Catatan Internal:**
  - Tombol hapus mahasiswa terlindungi dari staf non-superadmin.
  - Navigasi tombol kembali pada Catatan Internal berhasil mengembalikan pengguna ke dashboard yang valid.
