# Changelog: Manajemen Anggaran Praktik, Pelaporan Sisa Bahan Vokasi, Sinkronisasi Hafalan CRM-PA, Perbaikan PMB, Panel Finance, Manajemen Mata Kuliah & Pendaftaran Mahasiswa Kelas

**Tanggal:** 1 September 2026  
**Fokus:** Pelaporan Sisa Bahan Praktik, Sinkronisasi Real-Time Hafalan PA ke CRM, Validasi Tanggal Pra-Magang, Restriksi Hapus Mahasiswa PMB, Perbaikan Upload PDF & Limitasi Digit Finance, Checklist Interaktif Status Pembayaran Tanpa Reload, Dropdown Dosen & Peminatan Akademik, Fitur Batch Pendaftaran Mahasiswa ke Mata Kuliah (*Multi-Select, Controlled Tab, Anti-Duplikasi & Sinkronisasi Presensi*), Bun Upgrade v1.4.0, dan Panduan Version Control GitHub.

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
5. **Pembaruan & Perbaikan Modul Keuangan (Panel Finance):**
   - **Upload & Manajemen Berkas PDF:** Perbaikan upload bukti pembayaran utama agar validasi hanya menerima file PDF (`application/pdf`) dengan antarmuka review dan hapus file yang konsisten.
   - **Limitasi Input Nominal (Maksimal 9 Digit):** Pembatasan seluruh input integer/angka di modul Finance (Partisi Biaya, Pembayaran Utama, Dana Talangan, Biaya Tambahan, dan Modal Partisi) maksimal 9 digit (`<= 999.999.999`) untuk mencegah overflow data.
   - **Checklist Manual Status Pembayaran & Toggle Tanpa Refresh:** Penambahan tombol toggle checklist keterangan lunas/belum pada setiap progres pembayaran yang dapat diubah manual oleh admin tanpa memicu reload halaman (*optimistic state updates*).
   - **Progres Finansial Dinamis (Mandiri vs Talangan):** Penyesuaian tahapan progress bar dan ringkasan pembayaran di header serta dashboard sesuai metode yang dipilih mahasiswa (Mandiri 4 tahap vs Dana Talangan 2 tahap awal).
6. **Peningkatan Panel Akademik & Detail Mata Kuliah:**
   - **Dropdown Dosen & Peminatan Berbasis Nama & Bendera:** Modal edit mata kuliah kini menampilkan nama lengkap dosen pengampu (bukan ID angka) dan dropdown 4 peminatan resmi (Jepang, Jerman, Korea Selatan, Australia/Selandia Baru) lengkap dengan ikon bendera resolusi tinggi.
   - **Fitur Pendaftaran Mahasiswa Tambahan (*Multi-Select Batch Enrollment*):** Fitur penambahan mahasiswa ke mata kuliah tertentu dengan dukungan memilih banyak mahasiswa sekaligus (*checkbox* & *Select All*), tombol `+ Tambah Mahasiswa`, dan navigasi tab yang terkunci tetap berada di tab *"Daftar Peserta Kelas"*.
   - **Multi-Layer Proteksi Anti-Duplikasi:** Mencegah mahasiswa terdaftar ganda di mata kuliah yang sama melalui proteksi di level database PostgreSQL, filter pencarian API, validasi backend, dan deduplikasi di UI frontend.
   - **Sinkronisasi Presensi & Perbaikan Badge Kehadiran:** Perhitungan badge kehadiran pertemuan (`presentCount`) disinkronkan secara presisi dengan daftar mahasiswa aktif terdaftar di kelas (mencegah anomali seperti `9 / 7 Hadir`).
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

### B. Modul Keuangan & Panel Finance

1. **Perbaikan Upload & Validasi PDF Pembayaran Utama (`PembayaranUtamaSection.tsx`):**
   - Menangani pengunggahan bukti pembayaran dengan validasi tipe berkas hanya PDF (`.pdf`, `application/pdf`).
   - Menyediakan tombol pratinjau (*review*) berkas dan opsi hapus berkas bukti pembayaran.

2. **Limitasi 9 Digit Input Nominal di Seluruh Panel Keuangan:**
   - Membatasi input angka pada komponen `PartisiBiayaCard.tsx`, `PembayaranUtamaSection.tsx`, `DanaTalanganSection.tsx`, `BiayaTambahanSection.tsx`, dan `PartitionModal.tsx` dengan batas maksimal 9 digit (`max={999999999}`, `maxLength={9}`).
   - Mencegah kesalahan pengetikan nominal di luar batas wajar dan menjaga konsistensi database integer.

3. **Tombol Checklist Interaktif Status Pembayaran Tanpa Reload Halaman:**
   - Menambahkan tombol checklist toggle pada setiap tahapan progres pembayaran (Mandiri & Dana Talangan).
   - Menghapus ketergantungan pada `router.refresh()` dan beralih ke *optimistic local state update* sehingga halaman tidak otomatis ter-refresh saat status pembayaran dicentang/diubah.

4. **Kustomisasi Tampilan Progres Pembayaran Berdasarkan Skema (Mandiri vs Talangan):**
   - Menyesuaikan progres tahapan di header dan card utama:
     - **Skema Mandiri:** Menampilkan 4 tahapan pembayaran (Pembayaran 1, 2, 3, dan Pelunasan).
     - **Skema Dana Talangan:** Menampilkan 2 tahapan awal yang menjadi kewajiban mahasiswa sebelum talangan dicairkan.

---

### C. Modul Akademik, Mata Kuliah & Pendaftaran Mahasiswa Kelas

1. **Penyempurnaan Modal Edit Mata Kuliah (`mata-kuliah/page.tsx`):**
   - **Dropdown Dosen Pengampu:** Menampilkan nama lengkap dosen (`dosen.fullName` atau `dosen.username`) menggantikan ID numerik.
   - **Dropdown 4 Peminatan Resmi:** Menggunakan daftar peminatan standar Nusadaya (*Jepang, Jerman, Korea Selatan, Australia / Selandia Baru, dan Semua Peminatan*) lengkap dengan ikon bendera SVG.

2. **Sistem Pendaftaran Mahasiswa Tambahan ke Kelas (`apps/api` & `apps/web`):**
   - **Skema Database (`course_enrollments`):** Menyimpan relasi `courseId`, `studentId`, `addedBy`, `notes`, dan timestamp dengan index serta `UNIQUE(course_id, student_id)`.
   - **REST API Endpoints (`apps/api/src/routes/courses.ts`):**
     - `GET /courses/:id/enrollments`: Mengambil seluruh mahasiswa tambahan terdaftar.
     - `GET /courses/:id/enrollments/search`: Pencarian kandidat mahasiswa aktif dengan otomatis mengecualikan mahasiswa yang sudah terdaftar.
     - `POST /courses/:id/enrollments`: Pendaftaran batch mahasiswa (`studentIds: number[]`) dengan validasi hak akses dan anti-duplikasi.
     - `DELETE /courses/:id/enrollments/:enrollId`: Menghapus pendaftaran mahasiswa tambahan dari kelas.

3. **Antarmuka Peserta Kelas & Multi-Select Batch Enrollment (`mata-kuliah/[id]/page.tsx`):**
   - **Tab "Daftar Peserta Kelas":** Dilengkapi kartu ringkasan (Total Peserta, Peserta Reguler, Mahasiswa Tambahan), tabel Mahasiswa Tambahan dengan tombol hapus, dan tabel Peserta Reguler dengan fitur pencarian cepat.
   - **Modal Multi-Select:** Fitur pemilihan banyak mahasiswa sekaligus menggunakan checkbox, tombol *"Pilih Semua Hasil"*, dan panel chips mahasiswa terpilih yang dapat dibatalkan secara individu atau dihapus semua.
   - **Controlled Tab Persistence:** Menggunakan state `activeTab` sehingga antarmuka tetap bertahan di tab "Daftar Peserta Kelas" setelah mahasiswa ditambahkan atau dihapus (tanpa kembali ke tab jadwal).
   - **Penyederhanaan Label:** Mengubah tombol menjadi **`+ Tambah Mahasiswa`** dan menggunakan label bersih **"Mahasiswa Tambahan"**.

4. **Multi-Layer Proteksi Duplikasi Mahasiswa:**
   - **Layer 1 (Database Constraint):** `UNIQUE(course_id, student_id)` mencegah duplikasi fisik.
   - **Layer 2 (API Search Filtering):** Endpoint search otomatis mengecualikan mahasiswa angkatan reguler mata kuliah (`student.cohort === course.cohort`) dan mahasiswa yang sudah terdaftar di `course_enrollments`.
   - **Layer 3 (Backend Batch Validation):** Backend memfilter ulang daftar `studentIds` sebelum insert dan menolak pendaftaran jika seluruh kandidat sudah terdaftar.
   - **Layer 4 (Frontend Reaktif):** Antarmuka web memfilter kandidat terhadap data peserta kelas yang sedang aktif ditampilkan di layar.

5. **Perbaikan Sinkronisasi Badge Kehadiran Mahasiswa:**
   - Mengubah perhitungan kehadiran pertemuan (`presentCount`) dari membaca seluruh raw object database menjadi filter langsung terhadap mahasiswa terdaftar (`students.filter(...)`).
   - Mencegah anomali badge kehadiran (contoh: `9 / 7 Hadir`), memastikan angka hadir selalu presisi (`0 <= hadir <= total mahasiswa`).

---

### D. Modul CRM & Pendamping Akademik (PA)

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

### E. Modul Penerimaan Mahasiswa Baru (PMB) & Catatan Internal

1. **Restriksi Fitur Hapus Mahasiswa:**
   - **`apps/web/src/components/panels/pmb/TabDataTambahan.tsx` & `archive/page.tsx`**:
     - Membatasi tombol *"Hapus Mahasiswa"* hanya dapat dilihat dan dieksekusi oleh role `superadmin`.
     - Staf PMB tidak lagi memiliki hak akses penghapusan permanen data pendaftar.

2. **Checklist Manual PDF PMB:**
   - **`apps/web/src/components/panels/pmb/TabChecklist.tsx`**:
     - Menghapus otomatisasi centang checklist saat file PDF diunggah.
     - Checklist verifikasi dokumen tetap bersifat manual untuk memastikan verifikator memeriksa fisik/konten dokumen secara teliti.

3. **Standardisasi Status PMB & Navigasi Catatan Internal:**
   - Menyelaraskan penghitungan progres 14 checklist PMB pada KPI cards di `PmbDashboard.tsx`.
   - Memperbaiki tombol *"Kembali ke Dashboard"* pada `CatatanPanel.tsx` dan merapikan filter dropdown dengan Title Case.

---

### F. Infrastruktur, Media Storage & Version Control

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
1. `src/db/schema/courses.ts` — Definisi tabel `courseEnrollments` dan unique constraint.
2. `src/db/schema/relations.ts` — Relasi foreign key untuk `courseEnrollmentsRelations` dan `coursesRelations`.
3. `src/db/index.ts` — Auto-migration `ensureDatabaseSchema` untuk tabel `course_enrollments`.
4. `src/routes/courses.ts` — Implementasi endpoint `GET`, `POST`, `DELETE /courses/:id/enrollments` dan search filter anti-duplikasi.
5. `src/routes/dosen.ts` — Implementasi rute `GET`, `POST`, `PUT`, `DELETE /dosen/laporan-sisa-bahan` dan integrasi `fileService`.
6. `src/routes/student/crm.ts` — Integrasi data sesi hafalan PA dan sanitasi reset timestamp pra-magang.
7. `src/routes/student/pa.ts` — Otorisasi role superadmin pada endpoint hafalan dan pembersihan cache.
8. `src/modules/file/routes/download.ts` — Dukungan akses publik untuk avatar dan unduhan dokumen laporan.

### Frontend (`apps/web`)
1. `src/app/dashboard/mata-kuliah/[id]/page.tsx` — Tab Peserta Kelas, Modal Multi-Select Tambah Mahasiswa, sinkronisasi token Bearer API, controlled tab, dan sinkronisasi badge kehadiran.
2. `src/app/dashboard/mata-kuliah/page.tsx` — Dropdown Dosen pengampu berbasis nama dan dropdown 4 peminatan resmi dengan bendera.
3. `src/app/dashboard/mata-kuliah/[id]/TabAnggaranPraktik.tsx` — Pelaporan sisa bahan, selector nama barang asli, selektor kondisi bahan, dan badge status.
4. `src/components/panels/finance/PembayaranUtamaSection.tsx` — Validasi upload berkas khusus PDF dan limitasi 9 digit.
5. `src/components/panels/finance/PartisiBiayaCard.tsx` — Limitasi nominal 9 digit dan checklist manual progres pembayaran tanpa reload.
6. `src/components/panels/finance/DanaTalanganSection.tsx` — Limitasi nominal 9 digit dan checklist status talangan.
7. `src/components/panels/finance/BiayaTambahanSection.tsx` — Limitasi nominal 9 digit pada biaya tambahan.
8. `src/components/panels/finance/PartitionModal.tsx` — Limitasi nominal 9 digit pada modal partisi.
9. `src/components/panels/crm/TabHafalan.tsx` — Integrasi live data hafalan PA, metrik KPI, dan approval action.
10. `src/components/panels/crm/TabPraMagang.tsx` — Validasi anti tanggal mundur dan tombol reset tanggal.
11. `src/components/panels/CrmPanel.tsx` — Penyelarasan state types untuk data PA hafalan.
12. `src/components/panels/CatatanPanel.tsx` — Navigasi tombol kembali dan perapian label filter dropdown.
13. `src/components/panels/pmb/TabChecklist.tsx` — Penonaktifan auto-check saat upload PDF.
14. `src/components/panels/pmb/TabDataTambahan.tsx` — Restriksi tombol hapus mahasiswa khusus superadmin.
15. `src/components/dashboards/PmbDashboard.tsx` — Standarisasi kalkulasi status 14 item checklist PMB.
16. `package.json` — Pembaruan dependensi `@types/bun: "^1.4.0"`.

---

## 4. Hasil Verifikasi & Validasi

- **Verifikasi Panel Keuangan (Finance):**
  - Berkas pembayaran utama hanya dapat diunggah dengan format PDF dan dapat ditinjau/dihapus dengan lancar.
  - Semua field nominal menolak input angka di atas 9 digit.
  - Status checklist pembayaran dapat dicentang/diedit tanpa memicu refresh halaman secara otomatis.
- **Verifikasi Modul Akademik & Mata Kuliah:**
  - Dropdown dosen pengampu menampilkan nama lengkap dan peminatan menampilkan bendera negara yang sesuai.
  - Pendaftaran mahasiswa ke kelas dapat dilakukan secara batch (*multi-select*), tidak memicu pergantian tab, dan terlindungi dari input ganda (*anti-duplikasi*).
  - Badge kehadiran per pertemuan menghitung jumlah mahasiswa hadir secara akurat (`presentCount <= total enrolled`).
- **Verifikasi Alur Pelaporan Sisa Bahan Dosen:**
  - Form modal berhasil memuat data pengajuan dengan nama bahan asli dan nominal.
  - Pilihan kondisi bahan (*Baik, Rusak, Kedaluwarsa, Perlu Penanganan, Habis*) tersimpan dengan benar ke database.
- **Verifikasi Sinkronisasi CRM & PA:**
  - Data hafalan yang diinput di akun PA langsung tampil secara real-time pada tab Hafalan di panel CRM.
  - Tanggal pra-magang tidak dapat dipilih mundur dari hari ini, dan tombol reset berfungsi mengembalikan status ke tanggal awal.
- **Integritas PMB & Catatan Internal:**
  - Tombol hapus mahasiswa terlindungi dari staf non-superadmin.
  - Navigasi tombol kembali pada Catatan Internal berhasil mengembalikan pengguna ke dashboard yang valid.
- **Kompilasi TypeScript:**
  - `apps/api` lulus kompilasi dengan `exit code 0`.
  - Seluruh komponen terkait di `apps/web` bebas dari error TypeScript.

