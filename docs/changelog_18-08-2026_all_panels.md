# Dokumentasi Pembaruan Sistem Standardisasi Panel Dashboard, Isolasi Hak Akses & Visual Peminatan
**Dashboard Nusadaya**

Sistem operasional Dashboard Nusadaya telah menerima serangkaian pembaruan besar yang berfokus pada standardisasi tata letak tabel di seluruh dashboard divisi, pembatasan tampilan awal 20 mahasiswa per halaman dengan integrasi pagination cerdas, isolasi progres antardivisi pada halaman Semua Mahasiswa, penerapan visual bendera negara pada seluruh peminatan, modernisasi sistem ceklist panel magang mengikuti standar PMB, serta penyempurnaan fitur CRUD pada modul Pembimbing Akademik (PA).

---

## 1. Standardisasi Tabel Dashboard Divisi & Pagination 20 Mahasiswa

Seluruh tabel dasbor divisi telah distandarisasi untuk menyajikan informasi yang konsisten, rapi, dan mudah dibaca oleh staf operasional.

### A. Format 7 Kolom Baku
Setiap tabel pada dashboard divisi (`PMB`, `CRM`, `Akademik`, `Finance`, `Magang`, `PA`) kini memiliki struktur kolom baku:
1. **Nama Mahasiswa & NIM**: Menampilkan nama lengkap tebal (*font-bold*) disertai nomor NIM (*font-mono*) dan nama panggilan (*nickname*) di baris bawahnya.
2. **Angkatan**: Ditampilkan dalam bentuk *Badge* terstruktur (`Angkatan {cohort}`).
3. **Tahun Ajaran**: Menampilkan tahun ajaran resmi mahasiswa (contoh: `2024/2025` atau periode pendaftaran).
4. **Peminatan**: Menggunakan komponen `<PeminatanBadge>` yang dilengkapi dengan **ikon bendera negara** destinasi dan label peminatan/sub-program.
5. **No. WhatsApp / HP**: Dilengkapi tombol tautan hijau WhatsApp aktif (`https://wa.me/62...`) yang dapat diklik langsung untuk mempermudah komunikasi ke mahasiswa, beserta nomor kontak dalam format monospaced.
6. **Progress Panel Divisi**: *Progress bar* persentase visual disertai penghitung item checklist (`X/Total`) dan *hover tooltip* rincian item checklist spesifik untuk divisi tersebut.
7. **Aksi**: Tombol navigasi cepat **Periksa** untuk langsung membuka panel detail mahasiswa pada konteks divisi terkait.

### B. Komponen Pagination Cerdas (`TablePagination`)
- Telah dibuat komponen *reusable* `apps/web/src/components/ui/TablePagination.tsx`.
- Menetapkan **default 20 data mahasiswa per halaman** pada seluruh dashboard divisi dan halaman master mahasiswa.
- Dilengkapi indikator teks dinamis: *"Menampilkan 1 - 20 dari [Total] Mahasiswa"*.
- Tombol navigasi **Sebelumnya**, **Nomor Halaman (1, 2, 3...)**, dan **Selanjutnya** dengan algoritma *smart ellipsis* saat data berjumlah banyak.
- Sinkronisasi otomatis (*auto-reset* ke halaman 1) setiap kali pengguna mengubah kata kunci pencarian, filter angkatan, atau filter status.

---

## 2. Isolasi Hak Akses & Tampilan Unik Per-Role di Halaman Semua Mahasiswa

Halaman **Semua Mahasiswa** (`/dashboard/students`) telah dirombak total agar dapat diakses oleh semua *role* pengguna dengan menjaga batasan privasi dan keamanan data antar-divisi (*data isolation*).

### A. Tampilan Berbasis Peran (*Role-Based Isolation*)
- **Super Admin & Direktur (`superadmin`, `director`)**:
  - Memiliki akses *Master View* komprehensif.
  - Menampilkan ringkasan KPI 7 modul kelulusan (*P C F A D PA M*), kondisi keseluruhan (*Aman / Perlu Perhatian / Blocking*), serta status Keputusan Final (*Layak Berangkat / Remedial / Kontrak*).
  - Dilengkapi fitur ekspor CSV Master Data, tombol Tambah Mahasiswa, dan navigasi Arsip.
- **Divisi Non-Superadmin (`pmb`, `crm`, `akademik`, `finance`, `magang`, `dosen`)**:
  - Menampilkan seluruh mahasiswa terdaftar dengan kolom yang **terisolasi unik untuk divisinya**.
  - Setiap divisi **hanya dapat melihat progres checklist divisinya sendiri** dan tidak dapat melihat rincian progres panel divisi lain.
  - Tombol aksi **Periksa** secara otomatis mengarahkan langsung ke konteks tab divisi yang bersangkutan (`?context=[role]`).
- **Dosen Pembimbing Akademik (`pa`)**:
  - Secara ketat hanya menampilkan **daftar mahasiswa yang dibimbing oleh dosen PA tersebut** (`student.paId === user.id`).
  - Menampilkan progres 4 sesi bimbingan PA (*Adaptasi, Monitoring, Karir/Magang, Evaluasi Final*).

---

## 3. Standardisasi Visual Icon Bendera Negara untuk Seluruh Peminatan

Untuk meningkatkan kejelasan visual dan estetika profesional, seluruh elemen antarmuka yang memuat peminatan/negara tujuan kini dilengkapi dengan bendera negara resmi.

### A. Library Pemetaan Peminatan (`lib/peminatan.ts`)
- Dibuat pustaka helper terpusat `apps/web/src/lib/peminatan.ts` yang memetakan nama program, sub-program, atau negara tujuan ke kode ISO negara 2-huruf (contoh: Taiwan $\rightarrow$ `tw`, Jepang $\rightarrow$ `jp`, Jerman $\rightarrow$ `de`, Australia $\rightarrow$ `au`, Korea $\rightarrow$ `kr`, Malaysia $\rightarrow$ `my`, dll.).
- Menyediakan palet warna styling tema khusus per-negara (Taiwan bernuansa emerald, Jepang bernuansa rose, Jerman bernuansa amber, dsb.).

### B. Komponen `<PeminatanBadge>` (`components/ui/PeminatanBadge.tsx`)
- Komponen *badge* modern yang merender gambar bendera SVG FlagCDN w40 berkualitas tinggi dengan *rounded border* halus dan rasio aspek akurat.
- Dilengkapi *fallback icon* Globe (`Globe2`) untuk program umum/domestik serta *tooltip* nama negara resmi.
- Diintegrasikan di seluruh form pendaftaran publik (`/form/[token]`), form tambah mahasiswa (`/dashboard/students/add`), form edit mahasiswa, halaman profil, detail mahasiswa, arsip, evaluasi & finalisasi, presensi kehadiran, serta modul PMB.

---

## 4. Modernisasi Antarmuka & Interaksi Ceklist Panel Magang (PMB-Style UX)

Panel Magang (`InternshipPanel`) telah dirombak untuk menyamakan gaya antarmuka (*UI/UX*) dengan Panel PMB yang interaktif dan responsif.

### A. Interaksi Checklist Seketika
- **Komponen Checkbox Shadcn**: Menggantikan tombol *toggle edit* kaku dengan kotak centang interaktif yang dapat langsung diklik pada label maupun kotaknya.
- **Indikator Status & Loading**: Dilengkapi badge status hijau `✓ Selesai` dan abu-abu `Belum`, serta *spinner loading* seketika per-item saat proses update data berlangsung.
- **Uploader Berkas Terintegrasi**: Setiap item checklist dilengkapi tombol unggah berkas langsung dengan *preview* dokumen dan status kelengkapan.

### B. Struktur Tab Magang
- **Tab Kelayakan Pra-Paspor**: Checklist kelayakan dokumen awal paspor.
- **Tab Dokumen Keberangkatan**: 12 kartu checklist dokumen teknis keberangkatan (Paspor, Visa, MCU, Tiket, LoA, Kontrak Kerja Industri, Pembekalan, Dokumen Agen, dll.).
- **Tab Syarat Akhir**: 3 kartu checklist kelulusan pasca-magang (Logbook, Laporan Akhir, Video Dokumentasi).
- **Header Ringkasan & ACC Magang**: Menampilkan *overall progress bar* magang dan dialog konfirmasi ACC yang terkunci otomatis jika dokumen belum lengkap.

---

## 5. Penyempurnaan CRUD Panel Pembimbing Akademik (PA) & Log Konseling

Fungsi operasional untuk Dosen Pembimbing Akademik (PA) telah diperbaiki dan diaktifkan kembali secara penuh.

### A. Perbaikan Fitur CRUD Dosen PA
- Dosen PA dan tim Akademik kini memiliki hak akses penuh untuk membuat, memperbarui, dan menghapus (*CRUD*) data bimbingan pada panel PA.
- **Setoran Hafalan**: Penambahan input kalimat hafalan, surat/ayat, pemilihan tanggal setoran, status kelulusan, dan catatan evaluasi.
- **Log Konseling**: Penghapusan batasan kaku minimal 50 kata pada ringkasan konseling agar dosen PA dapat mencatat poin-poin konseling secara ringkas dan fleksibel.
- **Persistensi Database**: Seluruh sesi bimbingan, log konseling, dan riwayat hafalan tersimpan dan tersinkronisasi secara *real-time* ke database backend (`apps/api/src/routes/student/pa.ts`).

---

## 6. Integrasi Dashboard Khusus Dosen & Evaluator

- Pembuatan komponen `DosenDashboard.tsx` khusus untuk peran Dosen pengampu yang menampilkan daftar mata kuliah aktif, jadwal kelas, tautan presensi pertemuan, dan rekapitulasi nilai.
- Pembuatan dan integrasi `EvaluatorDashboard.tsx` bagi tim penilai kelayakan akhir mahasiswa.
- Pencegahan kebocoran tampilan dashboard superadmin (*fallback guard*) bagi pengguna non-superadmin.

---

## 7. Perbaikan Menyeluruh Sistem Backup Otomatis & Manual

Sistem pencadangan (*backup*) data dan berkas mahasiswa telah disempurnakan agar berjalan andal baik di lingkungan lokal maupun kontainer server (*Docker*).

### A. Perbaikan Fitur Backup Manual & Perhitungan Progres
- **Koreksi Kalkulasi Persentase**: Memperbaiki logika penghitungan progres di `apps/api/src/lib/job.ts` sehingga proses pencadangan yang memiliki 0 berkas fisik (hanya struktur dan metadata) langsung mencapai status `completed` dengan persentase `100%` tanpa tertahan di `0%`.
- **Penyempurnaan Eksekusi Worker**: `backup.service.ts` kini langsung memfinalisasi berkas `manifest.json`, mencatat riwayat ke database, dan memperbarui cache status secara akurat.
- **Kompresi ZIP Portabel**: Mengganti pemanggilan binary OS (`zip` / `powershell`) dengan library JavaScript murni `archiver` pada endpoint `/backups/:id/download`, menjamin proses unduh berkas ZIP berjalan 100% sukses di lingkungan kontainer Docker/Linux tanpa dependensi eksternal.
- **Kejelasan Antarmuka Web**: `BackupManualForm.tsx` kini menyajikan status dan catatan informatif saat pencadangan selesai.

### B. Otomatisasi Backup Terjadwal (Scheduled Worker)
- **Resolusi ID Superadmin Dinamis**: Menghapus `userId: 1` hardcoded pada `scheduled.worker.ts` dan menggantinya dengan query dinamis ke tabel pengguna untuk mencari akun Superadmin aktif.
- **Mekanisme Retry Otomatis**: Menambahkan *retry loop* hingga 3 kali percobaan dengan jeda 5 detik saat inisialisasi awal server/Docker jika Redis atau database belum sepenuhnya siap (*race condition mitigation*).
- **Exponential Backoff Worker**: Mencegah *log flooding* pada `backup.worker.ts` saat koneksi Redis terputus dengan jeda bertingkat (*exponential backoff* hingga 30 detik).

---

## 8. Pengelolaan Pengguna (Manage Users) & Dukungan Multi-Role

Pembaruan pada manajemen pengguna untuk mendukung penugasan multi-peran (*multi-role assignment*) dan perbaikan query database:
- **Perbaikan Query SQL Drizzle**: Memperbaiki filter pengecualian peran mahasiswa pada endpoint `GET /manage-users` (`ne(users.role, "mahasiswa")`) sehingga data seluruh staf dan dosen dapat diambil tanpa error syntax database.
- **Kolom `roles` Multi-Peran**: Penambahan kolom `roles` (array JSON/text) pada tabel `users` di database backend untuk menyimpan seluruh peran yang dimiliki pengguna (contoh: seorang staf dapat memiliki peran `pa` sekaligus `crm` atau `akademik`).
- **Modal Tambah & Edit Pengguna**: Formulir pengguna kini dilengkapi dengan pemilih peran utama dan peran tambahan (*checkbox multi-role*).
- **Sinkronisasi JWT & Sesi Login**: Payload token autentikasi JWT dan state Zustand menyertakan array `roles` lengkap pengguna.

---

## 9. Halaman Profil Pengguna Mandiri & Ganti Password (`/dashboard/profile`)

Disediakan halaman profil mandiri yang dapat diakses oleh seluruh pengguna untuk mengelola data akun pribadi:
- **Pengubahan Biodata**: Pembaruan Nama Lengkap, Email, Nomor Telepon, dan Username secara mandiri.
- **Unggah Foto Profil**: Fitur *upload* foto profil dengan kompresi dan integrasi layanan berkas server.
- **Konfigurasi Ganti Password**: Keamanan pergantian password terproteksi dengan validasi Password Lama, Password Baru minimal 6 karakter, Konfirmasi Password Baru, serta visibilitas password (*eye toggle*).
- **Backend API**: Penyediaan endpoint `PUT /auth/profile` dan `PUT /auth/change-password` dengan hashing aman `Bun.password`.

---

## 10. Perbaikan Menyeluruh Role-Based Access Control (RBAC) & Kepatuhan React Rules of Hooks

Audit dan penyempurnaan keamanan otorisasi di seluruh layer aplikasi:
- **Koreksi Logika Inti `hasRole`**: Memperbaiki bug pada fungsi `hasRole` di frontend (`store/index.ts`) dan backend (`lib/permissions.ts`) yang sebelumnya menyebabkan pengguna non-superadmin (seperti `crm`, `dosen`) dianggap superadmin akibat evaluasi ekspresi string `r === "superadmin"`.
- **Isolasi Sidebar & Panel Modul**: Sidebar kini memfilter item menu secara ketat:
  - Role `crm`: Hanya melihat **Dashboard**, **Semua Mahasiswa**, dan **Panel CRM**.
  - Role `pmb`: Hanya melihat **Dashboard**, **Semua Mahasiswa**, dan **Panel PMB**.
  - Role `dosen`: Hanya melihat **Dashboard**, **Manajemen Mata Kuliah**, dan **Rekap Nilai**.
  - Role multi-role (misal `pa` + `crm`): Menampilkan kombinasi menu yang sesuai dengan kedua peran tersebut.
- **Proteksi Rute Langsung (`SharedDashboardLoader`)**: Mencegah akses ilegal via URL langsung ke modul divisi lain dengan menyajikan tampilan **"Akses Ditolak"**.
- **Proteksi Pengaturan & Master Data**: Penguncian `/dashboard/settings/backup` khusus untuk `superadmin`, dan `/dashboard/settings/master-akademik` untuk `superadmin` dan `akademik`.
- **Kepatuhan Aturan React Hooks (`Rules of Hooks`)**: Memperbaiki urutan eksekusi hook pada `StudentDetailContent` (`/dashboard/students/[id]/page.tsx`) dengan memindahkan `visibleLinks` dan `useEffect` ke bagian paling atas komponen sebelum pernyataan *early return* bersyarat, menghilangkan error runtime *"Rendered more hooks than during the previous render"*.

---

**Tanggal Perubahan:** 18 Agustus 2026  
**Area Terdampak:**
- `apps/web/src/store/index.ts` (Perbaikan logika fungsi helper `hasRole` & `getUserRoles`)
- `apps/api/src/lib/permissions.ts` (Perbaikan logika fungsi helper `hasRole` backend)
- `apps/api/src/routes/users.ts` (Perbaikan endpoint `manage-users` & dukungan kolom `roles`)
- `apps/api/src/index.ts` (Penyertaan array `roles` pada payload login JWT)
- `apps/web/src/app/dashboard/profile/page.tsx` *(BARU)* (Halaman profil mandiri & ganti password)
- `apps/web/src/components/dashboards/DosenDashboard.tsx` *(BARU)* (Dashboard khusus dosen pengampu)
- `apps/web/src/components/layout/Sidebar.tsx` (Penyaringan ketat menu sidebar berbasis peran & multi-role)
- `apps/web/src/components/dashboards/SharedDashboardLoader.tsx` (Proteksi akses URL langsung modul & tampilan Akses Ditolak)
- `apps/web/src/app/dashboard/page.tsx` (Routing role dashboard, DosenDashboard, EvaluatorDashboard, dan superadmin guard)
- `apps/web/src/app/dashboard/students/[id]/page.tsx` (Penyelesaian React Rules of Hooks, filter tab per-role, & proteksi aksi)
- `apps/web/src/app/dashboard/settings/backup/page.tsx` (Guard superadmin pada pengaturan backup)
- `apps/web/src/app/dashboard/settings/master-akademik/page.tsx` (Guard superadmin & akademik pada master data)
- `apps/api/src/routes/student/*` (`pmb.ts`, `internship.ts`, `finance.ts`, `crm.ts`, `core.ts`, `academic.ts`, `final-decision.ts`, `internal-notes.ts`, `departure-assessment.ts`)
- `apps/api/src/routes/finance.ts` & `magang.ts` (Penyelarasan pengecekan peran backend dengan `hasRole`)
- `apps/api/src/lib/job.ts` (Perbaikan formula persentase progress job Redis)
- `apps/api/src/modules/backup/service/backup.service.ts` (Penanganan backup 0 berkas & sinkronisasi manifest)
- `apps/api/src/modules/backup/routes/backup.routes.ts` (Kompresi zip streaming dengan archiver & guard superadmin)
- `apps/api/src/workers/backup.worker.ts` (Exponential backoff & error recovery)
- `apps/api/src/workers/scheduled.worker.ts` (Lookup superadmin dinamis & retry backup harian)
- `apps/web/src/components/backup/BackupManualForm.tsx` (Penyempurnaan feedback UI backup manual)
- `apps/web/src/components/ui/TablePagination.tsx` *(BARU)* (Komponen reusable pagination tabel dasbor)
- `apps/web/src/lib/peminatan.ts` *(BARU)* (Pustaka pemetaan negara, bendera, dan styling peminatan)
- `apps/web/src/components/ui/PeminatanBadge.tsx` *(BARU)* (Komponen visual badge bendera negara)
- `apps/web/src/app/dashboard/students/page.tsx` (Perombakan halaman Semua Mahasiswa dengan isolasi per-role & pagination)
- `apps/web/src/components/dashboards/PmbDashboard.tsx` (Standardisasi 7 kolom, link WhatsApp, dan pagination 20)
- `apps/web/src/components/dashboards/CrmDashboard.tsx` (Standardisasi 7 kolom, link WhatsApp, dan pagination 20)
- `apps/web/src/components/dashboards/AkademikDashboard.tsx` (Standardisasi 7 kolom, link WhatsApp, dan pagination 20)
- `apps/web/src/components/dashboards/FinanceDashboard.tsx` (Standardisasi 7 kolom, link WhatsApp, dan pagination 20)
- `apps/web/src/components/dashboards/MagangDashboard.tsx` (Standardisasi 7 kolom, link WhatsApp, dan pagination 20)
- `apps/web/src/components/dashboards/PaDashboard.tsx` (Standardisasi 7 kolom, filter bimbingan PA, dan pagination 20)
- `apps/web/src/components/panels/InternshipPanel.tsx` (Modernisasi checklist PMB style, progress bar, & ACC dialog)
- `apps/web/src/components/panels/magang/*` (`TabDokumen.tsx`, `TabPraPaspor.tsx`, `TabSyaratAkhir.tsx`)
- `apps/web/src/components/panels/PaPanel.tsx` & `apps/web/src/components/panels/akademik/pa/*` (Aktivasi CRUD PA, input tanggal hafalan, fleksibilitas log konseling)
- `apps/api/src/routes/student/pa.ts` (Backend API CRUD hafalan & konseling PA)
- `apps/web/src/app/dashboard/students/add/page.tsx` & `[id]/edit/page.tsx` (Integrasi PeminatanBadge)
- `apps/web/src/app/form/[token]/page.tsx` (Integrasi PeminatanBadge form pendaftaran publik)
- `apps/web/src/app/dashboard/students/archive/page.tsx` & `profile/page.tsx` (Integrasi PeminatanBadge)
- `apps/web/src/components/panels/kehadiran/KehadiranDashboard.tsx` (Integrasi PeminatanBadge)
- `apps/web/src/components/dashboards/pmb/TabRespons.tsx` (Integrasi PeminatanBadge)

