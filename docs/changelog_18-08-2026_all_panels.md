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

## 6. Konsolidasi Modul Dosen & Pembersihan Struktur

- Menghapus rute dan komponen redundan (`DosenDashboard.tsx`, `DosenPanel.tsx`, `/dashboard/dosen/page.tsx`) untuk mengintegrasikan alur kerja dosen pengampu langsung ke dalam Modul Mata Kuliah, Presensi Kehadiran Kelas, dan Penilaian Akademik.
- Pembaruan skrip automasi database batch seeding akun dan penyesuaian jadwal pertemuan mata kuliah.

---

**Tanggal Perubahan:** 18 Agustus 2026  
**Area Terdampak:**
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
