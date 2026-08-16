# Dokumentasi Pembaruan Sistem Panel Akademik & Database
**Dashboard Nusadaya**

Sistem operasional untuk tim Akademik dan infrastruktur _database_ telah menerima pembaruan masif. Pembaruan ini difokuskan pada penambahan modul Manajemen Mata Kuliah, Manajemen Pengguna, serta perombakan besar (refactoring) struktur _database_ untuk menjaga integritas relasi dan efisiensi penyimpanan data/dokumen.

---

## 1. Modul Baru: Manajemen Mata Kuliah & Jadwal Mengajar

Modul Akademik kini dilengkapi dengan antarmuka dan sistem _backend_ terdedikasi untuk mengelola Mata Kuliah dan Rencana Pembelajaran secara otomatis dan dinamis.

### A. Fitur Manajemen Mata Kuliah
- **CRUD Mata Kuliah**: Menambahkan antarmuka tabel (`/dashboard/mata-kuliah`) yang menampilkan Kode Mata Kuliah, Nama, Dosen Pengampu, Peminatan, Angkatan, Jenis (Praktik/Teori), dan Aksi.
- Terdapat fungsi penambahan mata kuliah, pencarian data, penyaringan (_filter_) spesifik untuk semua data atau hanya yang diampu, serta fungsi _Export_ data ke Excel.

### B. Otomatisasi 18 Pertemuan
- Saat mata kuliah baru didaftarkan, sistem secara otomatis _meng-generate_ 18 sesi jadwal mengajar yang berurutan.
- Sesi tersebut meliputi: **PKKMB**, **Beginning Class**, dilanjut dengan Pertemuan 1 hingga 16 (dengan Pertemuan 8 otomatis dikonfigurasi sebagai UTS, dan Pertemuan 16 sebagai UAS).
- Setiap halaman detail pertemuan reguler dilengkapi _tab_ untuk Presensi dan Kegiatan Pembelajaran (terbagi menjadi 3 segmen: Teori, Tugas, Praktik dengan Penilaian & Catatan).
- **Penyimpanan Dokumen**: Pada bagian Tugas, Praktik, dan Teori, kini telah disediakan integrasi unggah dokumen (PDF) tersinkronisasi untuk mempermudah admin/dosen membagikan referensi berkas.

---

## 2. Modul Baru: Manajemen Pengguna & Penyesuaian UI

- **Manajemen Pengguna (Users)**: Menambahkan modul CRUD khusus (`/dashboard/users`) untuk mengelola akses pengguna, pengaturan hak akses (Role), dan pengaturan _default password_ bagi pendaftar baru. 
- **Penyesuaian Antarmuka (UI)**: Desain _modal edit_ dan _input form_ telah dipertajam ketebalan bordernya (`border-2 border-slate-200`) agar lebih menonjol dan kontras, serta form pengisian kata sandi yang disesuaikan labelnya.

---

## 3. Refactoring Arsitektur Database & Relasi API

Berdasarkan analisis performa struktur database yang ada (berisi 68 tabel), serangkaian _refactoring_ telah dieksekusi secara bertahap untuk mencegah data rongsok (_hardcoded_) dan desinkronisasi.

### A. Perbaikan Relasi `course_grades` (Masalah A)
- Mengubah tabel `course_grades` yang tadinya menggunakan teks statis (`courseCode` dan `courseName`) menjadi menggunakan _Foreign Key_ `course_id`.
- Migrasi baris data terdahulu berhasil diterapkan, sehingga semua perubahan dari _master table_ Mata Kuliah akan otomatis terwariskan pada nilai mahasiswa tanpa terjadinya isu disinkronisasi nama.

### B. Persiapan Unifikasi Dokumen (Masalah B)
- **Tabel Sentral `files`**: Menginjeksi metadata fungsional (_isVerified_, _verifiedAt_, _verifiedBy_) langsung ke dalam tabel _master_ `files`.
- Skema ini memungkinkan peleburan (penggabungan) tabel-tabel spesifik divisi yang berlebihan (seperti `pmb_documents`, `crm_documents`, dll) menjadi satu titik pusat, menyederhanakan kueri dan ruang penyimpanan di pembaruan sistem mendatang.

### C. Pembersihan Data Hardcoded Taiwan (Masalah D)
- **Root Cause Fix:** Menghapus sepenuhnya belasan kolom statis berbasis _checklist_ (seperti `taiwan_loa_checked`, `taiwan_cv_checked`) yang mengotori tabel utama `academic_data`.
- Telah dibuat tabel baru `overseas_program_checklists` (Relasi ke _Students_) untuk mengelola data per-negara. Sistem kini siap menangani program pemberangkatan ke luar negeri mana pun (tidak hanya terbatas di Taiwan) tanpa perlu menambah kolom panjang setiap tahunnya.

---

**Tanggal Perubahan:** 16 Agustus 2026
**Area Terdampak:**
- `apps/api/src/db/schema.ts` (Modifikasi relasi mata kuliah, unifikasi metadata `files`, pembuatan entitas `overseas_program_checklists`)
- `apps/api/src/routes/courses.ts` & `users.ts` (_Endpoint_ backend operasional baru)
- `apps/api/src/routes/student/academic.ts` & `mahasiswa.ts` (Penulisan ulang _logic_ API untuk mengadopsi struktur _database_ termigrasi)
- `apps/web/src/app/dashboard/mata-kuliah/*` & `users/*` (Pengadaan struktur rute UI _frontend_ baru)
- `apps/web/src/components/dashboards/*` & `panels/*` (Perombakan elemen dasbor spesifik per-peran)
