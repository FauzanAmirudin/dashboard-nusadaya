# AGENTS.md - Project Memory & System Overview

## 📌 Project Overview
**Dashboard Progress Mahasiswa - Nusadaya Academy**
Sistem Terpadu Validasi Mahasiswa untuk memantau, memvalidasi, dan mengelola progres setiap mahasiswa dari awal masuk hingga siap diberangkatkan magang ke luar negeri melalui 10 pintu validasi/divisi berbeda.

---

## 🛠️ Stack Teknologi & Environment (macOS Optimized)
- **OS / Arsitektur:** macOS (Apple Silicon arm64)
- **Shell:** `zsh`
- **Runtime:** Bun v1.3.14 (`~/.bun/bin/bun`)
- **Package Manager / Tools:** Homebrew (`/Users/andrichadeamitra/homebrew/bin`)
- **Database:** PostgreSQL 15 (Local via Homebrew: `localhost:5432/nusadaya`)
- **Backend (`apps/api`):** ElysiaJS, Drizzle ORM, Eden Treaty, Archiver, ioredis
- **Frontend (`apps/web`):** Next.js 16 (Turbopack, App Router), React 19, Tailwind CSS v4, shadcn/ui, Zustand, Recharts, Sonner

---

## 🚀 Status Layanan Lokal Saat Ini
- **Backend API:** `http://localhost:3001` (Swagger docs: `http://localhost:3001/docs`)
- **Frontend Web:** `http://localhost:3000`
- **Database:** PostgreSQL aktif pada `localhost:5432` dengan database `nusadaya`
- **Dev Server Process:** Berjalan otomatis via monorepo script `bun run dev` (melayani `apps/api` & `apps/web` secara bersamaan).

---

## 🔑 Akun Demo (Testing)
Semua akun demo di-seed dengan password: `password`
- **Superadmin:** `superadmin`
- **Direktur:** `direktur`
- **PMB:** `pmb`
- **CRM:** `crm`
- **Finance:** `finance`
- **Akademik:** `akademik`
- **Dosen:** `dosen`
- **PA (Pembimbing Akademik):** `pa`
- **Magang:** `magang`
- **Evaluator:** `evaluator`

---

## 📝 Log Pengerjaan
### [2026-08-17]
- ✅ Mengidentifikasi konfigurasi lingkungan lokal macOS (Homebrew PostgreSQL 15 & Bun).
- ✅ Menyalakan service PostgreSQL lokal dan melakukan inisialisasi skema database penuh (69 tabel) via Drizzle.
- ✅ Menjalankan seeding data demo akun divisi dan dummy mahasiswa.
- ✅ Memperbaiki konfigurasi `apps/web/.env.local` agar mengarah langsung ke `http://localhost:3001`.
- ✅ Menginstal dependensi workspace dan menjalankan server `apps/api` serta `apps/web` menggunakan `bun run dev`.
- ✅ Memverifikasi konektivitas API dan otentikasi login lokal.
- ✅ Menambahkan Card Partisi & Pembagian Biaya Pendidikan pada Tab Keuangan Mahasiswa (Registrasi Awal, 6 Semester, Interview Magang, Keberangkatan) lengkap dengan visual progress bar proporsi alokasi dan modal interaktif "Atur Pembagian".
- ✅ Mengunci otorisasi edit Total Biaya Pendidikan khusus untuk Divisi PMB (Read-Only di Finance dengan indikator badge & proteksi API endpoint).
- ✅ Menghubungkan dan menyinkronkan 4 pos partisi langsung ke section Pembayaran Utama (Registrasi Awal, 6 Semester, Interview Magang, Keberangkatan) secara real-time.
- ✅ Memperlebar tampilan Modal Atur Pembagian Biaya Pendidikan menjadi `max-w-5xl` dengan grid 4 kolom luas, input yang lebih lapang, dan responsive layout.
- ✅ Memperbaiki validasi endpoint `PATCH /students/:id/finance` agar pengaturan nominal/partisi Keberangkatan (Tahap 2) dapat disimpan tanpa terblokir validasi visa (validasi visa hanya berlaku saat status pencairan/pelunasan `t2KeberangkatanStatus: true`).
- ✅ Menyesuaikan visibilitas aksi & opsi Dana Talangan: opsi "Ubah Menjadi Dana Talangan" di kartu semester dan checkbox "Gunakan Dana Talangan" di modal tambah pembayaran kini hanya ditampilkan saat metode pembayaran lanjutan dipilih "Dana Talangan" (disembunyikan saat "Dana Mandiri").
- ✅ Mengimplementasikan mekanisme otomatis Forward-Cascading Dana Talangan Semester: pengalihan status semester ke Dana Talangan (misal Semester 3) otomatis mengubah semester seterusnya (Semester 3, 4, 5, dan 6) menjadi Dana Talangan, menutup/menyembunyikan tombol "Tambah Pembayaran" pada semester yang ditalangi, serta mengakumulasikan seluruh nominal semester talangan ke pos Tahap 1 secara real-time.
- ✅ Menghapus section redundant "Pengaturan Tagihan Semester" pada form Pembayaran Utama karena konfigurasi tagihan per semester telah terintegrasi terpusat pada Card & Modal Partisi Biaya Pendidikan.
- ✅ Menambahkan Section "Biaya Perkuliahan (6 Semester)" di bawah Registrasi Awal lengkap dengan total tagihan, status pelunasan (checkbox tandai lunas & badge status), dan ringkasan total terbayar.
- ✅ Memindahkan accordion "Pembayaran 6 Semester" ke bawah Biaya Perkuliahan (di atas Metode Pembayaran Lanjutan).
- ✅ Menerapkan kuncian mode Edit Data pada opsi pengalihan Dana Talangan per semester: status talangan semester hanya dapat diubah saat tombol "Edit Data" aktif, tidak langsung tersimpan otomatis ke database, dan baru disimpan permanen ketika tombol "Simpan" diklik (serta dibatalkan utuh jika menekan tombol "Batal").
- ✅ Memindahkan upload Bukti Pembayaran Perkuliahan / Semester (PDF) dari ringkasan global ke masing-masing item pembayaran per semester: input upload berkas PDF/gambar terpasang langsung pada modal "Tambah / Edit Pembayaran — Semester X" dan tautan unduh/lihat bukti bayar ditampilkan pada setiap baris riwayat pembayaran semester.
- ✅ Mengunci aksi transaksi pembayaran perkuliahan / semester (tombol "+ Tambah Pembayaran", "Pembayaran Multi-Semester", aksi Edit, dan Hapus riwayat pembayaran) agar hanya dapat diakses dan dilakukan ketika tombol "Edit Data" pada Pembayaran Utama dalam keadaan aktif.
- ✅ Menerapkan sistem Staged Draft State & Batch Save terpusat: penambahan pembayaran, pengeditan cicilan, penghapusan cicilan, pengalihan dana talangan, dan upload berkas bukti bayar beroperasi secara lokal pada state draft (tidak langsung menembak API/tersimpan ke DB), dan seluruh perubahan baru akan disimpan permanen secara serempak saat tombol "Simpan" pada Pembayaran Utama diklik (serta dibatalkan utuh kembali ke data database saat tombol "Batal" diklik).
- ✅ Menghapus aksi dan modal "Pembayaran Multi-Semester" dari card Pembayaran 6 Semester agar pembayaran fokus dicatat secara spesifik per semester masing-masing.
- ✅ Mengubah state default accordion Pembayaran 6 Semester menjadi tertutup semua (`expandedSemesters = []`) saat halaman dimuat/direload sehingga tampilan awal selalu rapi dan ringkas.
- ✅ Mengubah seluruh input nominal pos utama (Registrasi Awal, Interview Magang, Keberangkatan) menjadi Read-Only yang tersinkronisasi langsung dari Partisi Biaya Pendidikan.
- ✅ Menghapus seluruh checkbox manual "Tandai Lunas" pada Pembayaran Utama & menggantinya dengan validasi status otomatis real-time:
  - **Registrasi Awal:** Otomatis Lunas saat berkas Bukti Pembayaran Registrasi (PDF) diunggah.
  - **Biaya Perkuliahan (6 Semester):** Otomatis Lunas saat seluruh 6 semester telah selesai terbayar atau dialihkan ke Dana Talangan.
  - **Interview Magang (Dana Mandiri / Tahap 1):** Otomatis Lunas saat berkas Bukti Bayar Interview Magang diunggah.
  - **Keberangkatan (Dana Mandiri / Tahap 2):** Otomatis Lunas saat berkas Bukti Bayar Keberangkatan diunggah.
  - **Biaya Administrasi Talangan:** Otomatis Lunas saat bukti bayar administrasi diunggah.
- ✅ Menerapkan sistem Staged Documents (Upload Draft State) pada seluruh pos dokumen (Registrasi Awal, Interview Magang, Keberangkatan, Administrasi Talangan, Custom Fields): pemilihan/penggantian/penghapusan berkas hanya disimpan ke state draft lokal dan tidak langsung diunggah ke server sampai tombol "Simpan" pada Pembayaran Utama diklik (serta dibatalkan utuh jika tombol "Batal" diklik).
- ✅ Mengintegrasikan dan menyatukan seluruh komponen Tahap 1 Dana Talangan ke dalam 1 Card terpadu: menampilkan Total Biaya Pinjaman Tahap 1 (Akumulasi Semester Ditalangi + Biaya Interview Magang) dengan rincian breakdown 2-kolom terstruktur dan upload berkas dokumen Tahap 1.
- ✅ Menyelaraskan dan menyamakan layout visual antara Card Tahap 1 dan Card Tahap 2 secara simetris, modern, dan informatif.
- ✅ Memperbaiki interaksi input form nominal (Biaya Administrasi Talangan, Item Tambahan, Rumah Juang, dan Custom Fields) agar angka `0` default otomatis hilang saat pengguna mulai mengetik nominal baru (menggunakan placeholder `0` dan sanitasi string kosong yang bersih tanpa angka 0 di depan).
- ✅ Memperbarui dan menyelaraskan visual section "Biaya Tambahan Lainnya" dengan desain modern (kartu elegan dengan ikon, judul deskriptif, status pelunasan otomatis berbasis bukti bayar/dokumen, input nominal yang tetap editable, dan upload staged draft berkas PDF).
- ✅ Mengubah label "Ujian TOEIC" menjadi "Sertifikasi Bahasa" secara konsisten pada antarmuka Tab Keuangan dan Dashboard Finance.
- ✅ Memperbaiki Modal "Tambah / Edit Penerima Fee Sharing" pada Tab PMB: menghapus input duplikat (Rekening & Bank yang muncul dua kali), serta menghapus input Nominal Fee & Status Pencairan dari form PMB (karena nominal fee, status pencairan, dan upload invoice dikelola khusus oleh Divisi Finance).
- ✅ Memperbaiki peringatan Base UI (*uncontrolled to controlled InputPrimitive switching*) pada tabel Fee Sharing Panel Finance dengan mengubah input nominal menjadi fully-controlled component.
- ✅ Mengimplementasikan Spesifikasi Teknis Pembaruan Dashboard Finance - OneData:
  - **Fitur Proyeksi Pendapatan Bulanan (Komponen 2):** Input manual target proyeksi (dengan persistent storage per cohort & tombol preset cepat), kalkulasi otomatis realisasi riil dari seluruh uang masuk pembayaran mahasiswa pada rentang tanggal terpilih, kalkulasi persentase ketercapaian real-time `(Realisasi / Target) * 100%`, indikator surplus/sisa target, serta filter periode tanggal dinamis (Bulan Ini, Bulan Lalu, 3 Bulan, Tahun Ini, Kustom date range).
  - **Tabel Kelengkapan Finance (Komponen 1):** Urutan dinamis default berdasarkan data mahasiswa yang paling baru diperbarui (`updatedAt` descending), kolom Total Pembayaran yang Diinput (akumulasi riil uang masuk), kolom Status Pembayaran (Lunas/Aman, Sedang Proses, Menunggak, ACC), Program Studi & Peminatan berikon bendera negara, No. HP/WhatsApp interaktif, Quick Status Filter Tabs untuk mengisolasi mahasiswa menunggak dengan 1 klik, serta integrasi data lintas panel.
- ✅ Melakukan overhaul UI/UX Dashboard Finance agar seragam, rapi, dan menarik: memoles Header Card dengan gradient accent & ikon berbobot, menyeragamkan 6 KPI Cards dengan layout/padding/border-left/hover efek identik (data-driven rendering), merapikan Card Proyeksi Pendapatan dengan metric cards simetris, glassmorphism hover, live indicator, dan date preset tabs yang lebih halus, memperbarui Tabel Kelengkapan Finance dengan zebra-striping, header uppercase tracking, spacing seragam, micro-hover animasi, tombol filter status dengan transisi smooth, loading spinner modern, empty state terpusat, dan progress bar yang lebih presisi.
- ✅ Memperbaiki bug kritis kalkulasi `status` otomatis pada endpoint `PATCH /students/:id/finance`: mengganti placeholder TODO (`checked = 0` yang menyebabkan semua mahasiswa selalu berstatus `TIDAK_AMAN`) dengan logika kalkulasi riil berdasarkan 4 milestone keuangan (Registrasi, Semester, Interview Magang, Keberangkatan) yang mendukung kedua metode pembayaran (Dana Mandiri & Dana Talangan). Status sekarang dihitung akurat: `AMAN` (4/4), `PERLU_PERHATIAN` (2-3/4), `TIDAK_AMAN` (0-1/4), dengan auto-revoke `isAcc` jika milestone belum lengkap.
- ✅ Penyelarasan Tema UI/UX Dashboard Finance (1 Tema Utuh Nusadaya Light Theme):
  - **Identifikasi Masalah:** Card Proyeksi Pendapatan sebelumnya menggunakan tema gelap (`bg-slate-900 / dark mode`) yang bertabrakan (tidak 1 tema) dengan keseluruhan aplikasi Nusadaya Academy (Sidebar, Header, KPI Cards, dan Tabel berbasis Light Theme). Tampilan dropdown filter angkatan juga sempat memunculkan nilai mentah `"all"`.
  - **Solusi & Hasil:** Mengubah Card Proyeksi & Realisasi Pendapatan ke tema terang yang elegan (`bg-white` dengan soft gradient header `emerald-50/40` dan 4 kartu metrik bergradien lembut yang selaras), menyempurnakan pill filter tanggal, tombol preset target, bar progres realisasi, serta memperbaiki label dropdown angkatan menjadi `"Semua Angkatan"`. Seluruh halaman kini 100% harmonis, seragam, rapi, dan menyatu.
- ✅ Menyelaraskan Dominasi Warna Section Proyeksi & Realisasi Pendapatan: Mengubah aksen dominan dari hijau/emerald menjadi palet Royal Blue khas Nusadaya Academy (`#0517B0`, `blue-600`, `indigo-50`, `sky-500`) pada header card, live tracking badge, button preset tanggal aktif, metric box Realisasi Uang Masuk, badge ketercapaian, serta linear gradient progress bar.
- ✅ Memperbaiki Urutan Sorting Default Tabel Finance (Terbaru Selalu di Paling Atas): Menambahkan fungsi helper `getStudentLatestTimestamp` yang mengevaluasi seluruh aktivitas waktu terkini (update finance, cicilan semester, custom fields, status milestone bayar, dan update student), menerapkan sorting descending yang ketat (`timeB - timeA`) dengan tie-breaker `id DESC`, serta menambahkan `orderBy(desc(students.updatedAt), desc(students.id))` pada endpoint query `GET /students` di API.
- ✅ Redesain & Simplifikasi Toolbar Header Tabel Finance: Menghapus badge/teks deskripsi panjang yang bising, menata ulang layout menjadi 2 baris bersih & intuitif (Baris 1: Judul Data Mahasiswa + Badge Jumlah Mahasiswa di kiri, Search Bar ringkas & Sort Dropdown rapi di kanan; Baris 2: Segmented Pill Tabs filter status lengkap dengan counter badge minimalis).
- ✅ Overhaul & Streamlining Layout Dashboard Finance Menyeluruh (Simple, Bersih & Compact):
  - **Header Ringkas:** Mengurangi padding berlebih, memadatkan teks deskripsi, dan menyelaraskan dropdown filter angkatan + tombol Export CSV.
  - **KPI Cards Modern & Proporsional:** Menghilangkan border kiri 4px yang tebal/kaku, mengubah menjadi 6 kartu metrik kompak (`p-3 sm:p-3.5`) dengan visual ikon halus dan typography tegas yang hemat ruang vertikal.
  - **Widget Proyeksi Ringkas & Bebas Teks Redundan:** Menghilangkan teks formula/keterangan yang berulang, menyatukan 4 kartu metrik inti dan progress bar terintegrasi yang bersih.
- ✅ Overhaul & Simplifikasi View Detail Finance (`TabKeuangan.tsx` & `FinancePanel.tsx`):
  - **Header Panel & Navigasi Tab:** Memperbarui `FinancePanel.tsx` dengan header compact bergaya modern dan tab segmented pills dengan active accent Royal Blue `#0517B0`.
  - **Penyatuan Card Partisi Biaya Pendidikan:** Mengeliminasi 4 kartu nested berukuran raksasa yang redundant dan menggabungkannya ke dalam 1 Top Executive Card yang ringkas (Total Biaya PMB, status alokasi, progress bar proporsi alokasi, dan 4 mini inline metric chips).
  - **Penyelarasan Desain Card Pembayaran Utama & Biaya Tambahan:** Memperbarui Card Pembayaran Utama dan Card Biaya Tambahan dengan tema terang elegan, border halus `border-slate-200/90`, badge status real-time, dan tombol aksi "Edit Data" / "Simpan" / "Batal" yang responsif dan konsisten.
  - **Accordion 6 Semester yang Lebih Rapih:** Menampilkan badge status pelunasan langsung di baris header semester accordion dengan progress bar persentase pembayaran yang presisi.
- ✅ Redesain & Penyederhanaan Header Profil Mahasiswa (`students/[id]/page.tsx`):
  - **Profile Summary Eksekutif:** Mengganti tumpukan 14 baris data mentah yang memenuhi setengah layar dengan 1 Executive Card ringkas (Avatar dengan inisial 2 huruf bersih, status mahasiswa, NIM, program studi dengan bendera negara, kontak WhatsApp, dan progress checklist).
  - **Drawer Biodata Lengkap (Collapsible):** Menyimpan rincian latar belakang (NIK, NISN, TTL, jenis kelamin, alamat lengkap, sekolah asal, dan info orang tua) ke dalam drawer accordion *"Lihat Biodata Lengkap"* yang dapat dibuka/tutup dengan 1 klik sehingga tidak mengganggu alur kerja utama divisi.
  - **Pembersihan Aksi Header Atas:** Menghapus tombol redundant "Lihat Detail Profil" dari action bar atas.
- ✅ Penyempurnaan Filter Tanggal Proyeksi Pendapatan (Finance Dashboard):
  - Mengunci posisi date selector agar selalu rata kanan (`items-end` & `self-end`).
  - Menambahkan animasi transisi halus *Slide Down* (`animate-slide-down` dengan `@keyframes slideDownFade`) saat opsi rentang tanggal "Kustom" dipilih.
- ✅ Implementasi Sistem Partisi & Alokasi Biaya Promosi dan Iklan (Fee Sharing):
  - **Ubah Total Distribusi Fee menjadi Total Biaya Promosi & Iklan:** Menyelaraskan konsep plafon anggaran promosi per mahasiswa yang dapat diinput dan diatur nominalnya langsung oleh Divisi Finance.
  - **Modal Atur Total Anggaran:** Menambahkan modal interaktif "Atur Biaya Promosi" dengan input terformat Rupiah, tombol preset cepat, live preview estimasi alokasi, dan sinkronisasi ke database.
  - **Visual Progress Bar & Status Alokasi Real-Time:** Menampilkan multi-segment progress bar proporsi alokasi fee ke penerima, badge status alokasi (Alokasi Pas 100%, Sisa Alokasi, Melebihi Anggaran), serta 4 kartu ringkasan metrik (Plafon Anggaran, Fee Dialokasikan, Sudah Dicairkan, Belum Dicairkan).
  - **Tabel Daftar Penerima Fee Modern:** Kolom kategori berbadge warna-warni, nama & detail rekening, WhatsApp link interaktif, proporsi persentase alokasi, input nominal ter-sanitize tanpa leading zero, upload/view invoice PDF, dan aksi pencairan fee.
- ✅ Penambahan Bendera Negara pada Peminatan Header Profil Mahasiswa (`students/[id]/page.tsx`):
  - Menampilkan ikon bendera negara dinamis (*misal: bendera Malaysia 🇲🇾 untuk peminatan Malaysia-Hospitality, Taiwan 🇹🇼, Jepang 🇯🇵, dll.*) langsung di samping teks peminatan/sub-program dengan badge rapi dan proporsional.
- ✅ Penyesuaian Tooltip Khusus Kolom Status Pembayaran (`FinanceDashboard.tsx`):
  - **Jika Status Aman / Lunas:** Tooltip **tidak muncul** agar tampilan tetap bersih dan tidak redundan.
  - **Jika Status Menunggak / Sedang Proses:** Menampilkan tooltip khusus berwarna gelap beraksen rose yang secara spesifik merinci **pos-pos pembayaran mana saja yang belum lunas / menunggak** (*misal: Registrasi, Cicilan Semester, Sertifikasi Bahasa, atau Paspor*).
- ✅ Perbaikan Sinkronisasi Evaluasi Milestone Keuangan & Progres Dashboard (`FinanceDashboard.tsx`, `finance.ts`, `status.ts`):
  - **Kalkulasi Akurat & Reset Flag:** Mengupdate kalkulasi status menjadi strictly method-aware (6 pos riil) dan mereset status Ahmad Fauzan menjadi status riil Menunggak (3/6 Pos Selesai).
- ✅ Implementasi Sistem Pembayaran Cicilan Berganda & Input Nominal Dana Talangan (Tahap 1 & Tahap 2):
  - **Skema Database & API Baru:** Membuat tabel `finance_talangan_installments` di PostgreSQL dan endpoints CRUD lengkap (`GET`, `POST`, `PATCH`, `DELETE /students/:id/finance/talangan-installments`) untuk mencatat riwayat cicilan pinjaman Tahap 1 (Interview & Talangan Perkuliahan) dan Tahap 2 (Keberangkatan).
  - **Dukungan Pembayaran Bertahap & Input Nominal Dinamis:** Card Tahap 1 dan Card Tahap 2 kini dapat mencatat lebih dari 1 kali pembayaran dengan nominal custom bebas/bertahap, tanggal pembayaran, catatan, dan upload bukti bayar PDF/gambar.
  - **UI/UX Executive Modern:**
    - **Header & Badge Status Otomatis:** Menampilkan badge `Lunas`, `Cicilan Sebagian (X%)`, atau `Belum Lunas` yang terevaluasi otomatis berdasarkan akumulasi riil pembayaran terhadap plafon tagihan.
    - **3 Metric Chips Box:** Total Tagihan Plafon, Sudah Terbayar, dan Sisa Tagihan dengan visual linear progress bar.
    - **Tabel Riwayat Pembayaran:** Menampilkan nomor urut pembayaran (`#1`, `#2`, dst.), tanggal terformat, keterangan, nominal berfont mono tebal, tautan lihat bukti bayar / badge draf, serta tombol Edit dan Hapus saat mode `Edit Data` aktif.
    - **Modal Dialog "Tambah / Edit Pembayaran":** Input nominal terformat bersih tanpa leading zero, date picker, catatan metode bayar, dan staged file upload preview.
  - **Staged Draft State & Batch Save Terpusat:** Seluruh penambahan, pengeditan, penghapusan cicilan, dan berkas bukti bayar beroperasi secara aman pada draft lokal dan disimpan permanen serempak saat tombol "Simpan" diklik (serta dibatalkan utuh jika menekan "Batal").
  - **Sinkronisasi Otomatis ke Dashboard Finance:** Kalkulasi realisasi uang masuk dan total pembayaran mahasiswa pada Dashboard Finance langsung mengakumulasikan transaksi cicilan Dana Talangan secara akurat.
- ✅ Penyelesaian Merge Conflicts PR & Harmonisasi Penuh Fitur Finance (`feat/finance-module-enhancements` -> `main`):
  - Menggabungkan seluruh inovasi modul Finance (Proyeksi Pendapatan OneData, Multi-Cicilan Talangan, Partisi Biaya Pendidikan, dan Biaya Promosi) dengan fitur terbaru di branch `main` (`hasRole` RBAC helper, `TablePagination`, `PeminatanBadge`, and dynamic context tabs) tanpa menghilangkan logika atau menyebabkan error.
  - Memperbaiki sinkronisasi skema database PostgreSQL lokal (kolom `total_biaya_promosi` & tabel `finance_talangan_installments`) sehingga seluruh 13 data mahasiswa tampil normal dengan status HTTP 200.
- ✅ Penyesuaian Navigasi Sidebar Superadmin (`Sidebar.tsx`):
  - Menghapus item navigasi "Panel PA" (`/dashboard/pa`) dari menu Superadmin sehingga hanya tampil khusus untuk role Pembimbing Akademik (`roles: ["pa"]`). Superadmin tetap dapat mengelola PA melalui menu "Manajemen PA" di bawah menu Akademik.
<<<<<<< Updated upstream
=======
- ✅ Pemisahan Tab Anggaran Praktik ke Sub-Navigasi Panel Finance (`/dashboard/finance/anggaran-praktik`):
  - Mengeluarkan tab "Anggaran Praktik" dari view detail per mahasiswa (`FinancePanel.tsx`) sehingga halaman detail mahasiswa terfokus pada urusan personal (Pembayaran & Tagihan dan Biaya Promosi / Fee Sharing).
  - Menjadikan menu "Panel Finance" pada `Sidebar.tsx` sebagai grup menu dengan 2 sub-navigasi: **Monitoring Mahasiswa** (`/dashboard/finance`) dan **Anggaran Praktik** (`/dashboard/finance/anggaran-praktik`).
  - Membangun antarmuka index baru `AnggaranPraktikDashboard.tsx` dengan 4 kartu metrik KPI (Total Pengajuan, Menunggu Approval, Disetujui, Laporan Sisa Bahan), Segmented Tab Controller, Filter Status Cepat, Pencarian Instan Dosen/Mata Kuliah, dan format tabel modern.
  - Membangun Modal Peninjauan Detail Pengajuan Anggaran (`ReviewBudgetModal`) yang menyajikan rincian kebutuhan per item (Nama bahan, Qty, Satuan, Estimasi Harga, Subtotal), total keseluruhan, serta panel aksi persetujuan (*Approve*), penolakan (*Reject* dengan catatan revisi wajib), dan perbaikan status (*Reset ke Menunggu*).
  - Membangun Modal Detail Laporan Sisa Bahan (`ViewMaterialReportModal`) yang menampilkan rekap inventaris material sisa pasca-praktik dosen, kondisi bahan, catatan, dan akses tautan berkas lampiran.
  - Memperkaya endpoint API `GET /finance/anggaran-praktik` dan `GET /finance/laporan-sisa-bahan` untuk memuat relasi relasional Drizzle lengkap (`course`, `dosen`, `approvedBy`, `materialReports`).
  - Merancang ulang Modal Peninjauan Detail Anggaran (`ReviewBudgetModal`) dan Modal Sisa Bahan (`ViewMaterialReportModal`) menjadi lapang (`lg:max-w-4xl`), tidak terpotong (bebas clipping), banner info 3 kolom rapi, tabel kebutuhan bahan dengan kolom terstruktur proporsional, serta footer bar aksi yang bersih dan responsif.
  - Menambahkan Fitur Upload & Manajemen Bukti Pencairan / Penyerahan Anggaran ke Dosen:
    - Menambahkan kolom `bukti_pencairan_url`, `bukti_pencairan_file_name`, dan `tanggal_pencairan` pada tabel `practices_budget_requests` di database PostgreSQL dan skema Drizzle ORM.
    - Menambahkan endpoints `POST /finance/anggaran-praktik/:requestId/upload-bukti` dan `DELETE /finance/anggaran-praktik/:requestId/bukti` yang terintegrasi dengan `FileService`.
    - Menambahkan card manajemen Bukti Pencairan di `ReviewBudgetModal` (upload berkas slip transfer, preview/lihat berkas, ganti berkas, hapus) serta indikator badge `✓ Bukti Ada` / `Belum Ada Bukti` pada tabel pengajuan.
    - Menambahkan tampilan Bukti Pencairan pada antarmuka Dosen (`TabAnggaranPraktik.tsx`) sehingga Dosen dapat langsung mengunduh/melihat slip transfer jika anggaran telah dicairkan oleh Finance.
  - Memperbaiki Foreign Key Constraint Error pada Approval & Upload Bukti Anggaran Praktik:
    - Menambahkan helper `getValidUserId(user)` pada `permissions.ts` untuk memverifikasi dan mencocokkan ID user secara dinamis terhadap tabel `users` database PostgreSQL.
    - Menangani fallback user ID dan non-student file metadata pada `FileService.uploadFile` dan endpoint `approve` sehingga proses approval dan upload berkas berjalan lancar tanpa error query.


>>>>>>> Stashed changes
