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
- **Backend API:** ✅ Aktif (`http://localhost:3001`)
- **Frontend Web:** ✅ Aktif (`http://localhost:3000`)
- **Database:** ✅ PostgreSQL aktif pada `localhost:5432` dengan database `nusadaya`
- **Dev Server Process:** Berjalan di latar belakang via `bun run dev`.

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
### [2026-08-26]
- ✅ Memperbaiki dan merestrukturisasi urutan sub-navigasi menu **Akademik** pada Sidebar menjadi alur kerja logis & terkelompok (Overview & Validasi -> Kalender & Agenda -> Mata Kuliah & Nilai -> Monitoring Presensi & Piket -> Bimbingan PA):
  1. **Panel Akademik** (`/dashboard/akademik`) — Pusat kontrol validasi & overview akademik mahasiswa.
  2. **Kalender Akademik** (`/dashboard/kalender-akademik`) — Master agenda & timeline 18 minggu perkuliahan.
  3. **Penjadwalan & Info** (`/dashboard/penjadwalan`) — Jadwal kelas, praktikum, piket, dan pengumuman akademik.
  4. **Manajemen Mata Kuliah** (`/dashboard/mata-kuliah`) — Kurikulum, silabus, dan daftar mata kuliah.
  5. **Rekap Nilai & Presensi** (`/dashboard/mata-kuliah/rekap`) — Rekapitulasi nilai dan presensi perkuliahan per MK.
  6. **Manajemen Kehadiran** (`/dashboard/kehadiran`) — Monitoring kehadiran terpadu mahasiswa multi-aktivitas.
  7. **Kehadiran Piket** (`/dashboard/kehadiran-piket`) — Presensi piket harian mahasiswa.
  8. **Manajemen PA** (`/dashboard/akademik/pa`) — Monitoring bimbingan, konseling psikologis, dan setoran hafalan mahasiswa.

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
- ✅ Overhaul UI/UX Menyeluruh Halaman Penjadwalan & Pengumuman Serta Seluruh Sub-Tab & Detail Modal (`/dashboard/penjadwalan` & `/components/panels/penjadwalan/`):
  - **Executive Header Banner (`PenjadwalanDashboard.tsx`):**
    - Monogram icon box `CalendarDays` dengan gradien Royal Blue `#0517B0` ring-4, badge Panel Akademik, dan deskripsi ringkas yang elegan.
    - Segmented Sub-tab Navigation dengan Lucide Icons (`BookOpen`, `Clock`, `CalendarDays`, `Megaphone`), active pill shadow-xs, dan transisi fluid fade-in.
  - **Sub-Tab 1: Jadwal Kelas (`TabJadwalKelas.tsx`):**
    - Toolbar terintegrasi dengan monogram `BookOpen`, counter badge, tombol CTA "+ Tambah Jadwal Kelas" (Royal Blue `#0517B0`), search bar terintegrasi tombol clear `✕`, filter dinamis angkatan & hari, dan tombol reset filter cepat.
    - Tabel Master Jadwal Kelas berdesain modern dengan badge tematik hari perkuliahan, rentang waktu berikon jam, dosen dengan avatar inisial, badge angkatan monospace, badge ruangan elegan, dan tombol aksi edit/hapus.
    - Dialog Modal Tambah/Edit Jadwal Kelas yang lapang dan terstruktur.
  - **Sub-Tab 2: Jadwal Praktikum (`TabJadwalPraktikum.tsx`):**
    - Toolbar modern berikon `FlaskConical`, counter badge, tombol CTA "+ Tambah Jadwal Praktikum", search bar interaktif, dan filter cerdas.
    - Tabel Jadwal Praktikum dengan penanda hari tematik, alokasi waktu, nama praktikum berbobot, instruktur pengampu, badge laboratorium ungu lembut, dan aksi cepat.
    - Dialog Modal Tambah/Edit Praktikum dengan panduan input yang bersih.
  - **Sub-Tab 3: Jadwal Piket Mahasiswa (`TabJadwalPiket.tsx`):**
    - Toolbar berikon `Users` dengan tombol CTA "+ Tambah Kelompok Piket", search bar, dan filter angkatan/hari.
    - Tabel Kelompok Piket dengan rincian nama kelompok, badge angkatan, daftar tag chip anggota kelompok terdistribusi, area penugasan piket amber lembut, dan aksi cepat.
    - Dialog Modal Input Kelompok Piket dengan smart search dropdown mahasiswa 5 baris berkemampuan scroll vertikal, proteksi lock mahasiswa yang sudah terjadwal di kelompok lain, dan chip anggota interaktif.
  - **Sub-Tab 4: Pengumuman Akademik (`TabPengumuman.tsx`):**
    - Toolbar berikon `Megaphone` dengan tombol CTA "+ Buat Pengumuman", search bar, dan filter sasaran angkatan.
    - Tabel Pengumuman dengan tanggal publish rapi, judul & cuplikan ringkasan teks bersih (*stripped HTML*), badge target sasaran (Angkatan tertentu vs Semua Angkatan), info pembuat, tombol CTA "Baca" bernuansa lembut, dan aksi edit/hapus.
    - Dialog Modal Detail Pembaca Pengumuman dengan layout typography modern dan metadata chips.
    - Dialog Modal Buat/Edit Pengumuman dengan Tiptap Editor terintegrasi.
- ✅ Overhaul UI/UX Menyeluruh Halaman Kalender Akademik & Detail Kalender (`/dashboard/kalender-akademik` & `KalenderAkademikDashboard.tsx`):
  - **List View (Executive Master Banner & 3 KPI Metric Cards):**
    - Header banner modern beraksen Royal Blue `#0517B0` ring-4, badge Panel Akademik, dan tombol aksi "+ Buat Kalender Baru".
    - 3 Top KPI Cards (Total Kalender Terdaftar, Angkatan Terdata, dan Standar 18 Minggu Perkuliahan).
    - Smart Toolbar dengan search bar terintegrasi tombol clear `✕`, filter dinamis angkatan, dan tombol reset cepat.
    - Tabel Master Kalender ergonomis dengan monogram avatar `TA`, badge angkatan monospace, rentang tanggal rapi berikon kalender, tombol CTA `Detail →`, dan konfirmasi hapus modal modern.
  - **Create View (Form Master Kalender):**
    - Form card elegan (`rounded-2xl`, shadow-2xs) dengan navigasi kembali, input Tahun Ajaran, Angkatan, dan Date Range yang lapang.
  - **Detail View (Struktur 18 Minggu Perkuliahan & Acara Tambahan):**
    - Header banner eksekutif dengan metadata chips (Periode Kalender, Total Sesi 18 Minggu) dan tombol Export PDF berstatus loading.
    - Layout 2-Kolom Simetris:
      - **Kolom Kiri (18-Week Timeline):** Kartu timeline modern dengan monogram penomoran `#1` s/d `#18`, badge jenis agenda (PKKMB, Beginning Class, Perkuliahan, UTS, UAS), date range, deskripsi catatan khusus, dan tombol aksi edit penyesuaian.
      - **Kolom Kanan (Kegiatan & Acara Tambahan):** Daftar kartu event khusus di luar 18 minggu dengan tombol aksi "+ Tambah Acara", tanggal pelaksanaan, deskripsi lengkap, dan aksi hapus.
    - Dialog Modal Edit Periode dan Tambah Acara yang modern dan terstruktur.
- ✅ Overhaul UI/UX Menyeluruh Tampilan Detail Kehadiran Mahasiswa & Seluruh Sub-Tab (`KehadiranPanel.tsx` & `/components/panels/kehadiran/detail/`):
  - **Executive Header Banner (`KehadiranPanel.tsx`):**
    - Judul modern dengan icon box `ClipboardCheck` bergradien Royal Blue `#0517B0` ring-4, badge Panel Akademik, dan deskripsi ringkas.
    - Segmented Sub-tab Navigation dengan Lucide Icons (`GraduationCap`, `CalendarDays`, `Briefcase`, `Compass`), active pill shadow-xs, dan transisi fluid.
  - **Sub-Tab 1: Mata Kuliah (`TabMataKuliah.tsx`):**
    - Desain Kartu Mata Kuliah modern dengan monogram index, badge kode MK monospace, badge status terkunci, dan chip indikator presensi ber-dot indicator (🟢 *≥80%*, 🟡 *60-79%*, 🔴 *<60%*).
    - Grid riwayat sesi perkuliahan responsif dengan badge status kehadiran (Hadir, Izin, Sakit, Alpa) dan modal/form koreksi manual presensi yang rapi.
    - State kosong (*empty state*) berikon `GraduationCap` dengan tipografi informatif.
  - **Sub-Tab 2: Piket Harian (`TabPiket.tsx`):**
    - 3 Top KPI Cards (Kelompok Piket, Sesi Kehadiran Hadir/Total, dan Rasio Kepatuhan %).
    - Section Jadwal Terdaftar dengan pill hari piket, info waktu & ruang, serta daftar anggota kelompok yang rapi.
    - Riwayat Presensi Aktual Piket dengan tombol aksi "+ Catat Kehadiran" (Royal Blue `#0517B0`), status chips, dan dialog modal input absensi terstruktur.
  - **Sub-Tab 3: One Day Service (`TabODS.tsx`):**
    - Header banner dengan counter penyelesaian ODS (X/5 Selesai) dan badge verifikasi CRM.
    - Visual 5-Tahap Pelaksanaan ODS dengan status kartu aktif, nama mitra industri, tanggal pelaksanaan, dan badge selesai.
    - Riwayat catatan presensi ODS dengan informasi pencatat dan badge status.
  - **Sub-Tab 4: Pra-Magang (`TabPramagang.tsx`):**
    - Header banner integrasi CRM dan status laporan pra-magang.
    - 3 Kartu Metadata Industri (Mitra Perusahaan, Masa Pra-Magang, dan Video Dokumentasi interaktif).
    - Riwayat presensi pra-magang dengan informasi detail dan badge status.
- ✅ Overhaul UI/UX Menyeluruh Halaman Manajemen Kehadiran (`/dashboard/kehadiran` & `KehadiranDashboard.tsx`):
  - **Executive Header Banner:** Judul beraksen Royal Blue `#0517B0`, monogram logo dengan ring lembut, badge Panel Akademik, dan tombol aksi cepat Export Excel berstatus loading.
  - **4 Top KPI Metric Cards:** Total Mahasiswa (dengan info angkatan), Rata-rata Presensi Perkuliahan (dengan mini progress bar hijau), Presensi Piket Harian (dengan progress bar amber), dan Mahasiswa Aktif ODS/Magang (sinkronisasi CRM).
  - **Smart Toolbar & Filter Interaktif:** Dropdown filter angkatan dinamis (*"Semua Angkatan"*, *"Angkatan 16"*, dst.), search bar terintegrasi dengan tombol reset `✕` dan tombol Reset cepat, serta pill counter data real-time.
  - **Tabel Data Mahasiswa yang Modern & Ergonomis:**
    - Monogram Avatar inisial bergradien lembut untuk setiap mahasiswa.
    - Kolom Mahasiswa dengan nama bold dan badge NIM monospace.
    - Komponen `PeminatanBadge` lengkap dengan bendera negara.
    - Dosen PA dengan indikator visual `UserCheck` atau pill *"Belum Ditentukan"*.
    - Visual Progress Bar tingkat kehadiran kuliah per mahasiswa lengkap dengan persentase dan counter hadir (`X/16 Hadir`).
    - Kolom Angkatan & Tahun Ajaran yang ringkas.
    - Tombol CTA `Detail` dengan animasi panah mikro dan baris tabel yang dapat diklik langsung (*whole row clickable*).
- ✅ Overhaul UI/UX Menyeluruh Tampilan Detail Mahasiswa Panel Akademik — Manajemen PA (`/dashboard/akademik/pa/[paId]/mahasiswa/[studentId]`):
  - **Header & Profile Banner Eksekutif (`PAStudentDetailView.tsx`):**
    - Navigasi breadcrumb halus (`← Kembali ke Daftar Mahasiswa / [Nama Mahasiswa]`).
    - Hero Profile Card modern (`rounded-2xl`, soft border `border-slate-200/90`, dan shadow halus) dengan avatar inisial bergradien Royal Blue `#0517B0` ring 4px, judul nama bold, badge NIM monospace, `PeminatanBadge` dengan bendera negara, badge angkatan, dan indikator status aktif bimbingan.
    - Main Segmented Tab Navigation dengan tab pills bersudut halus, active shadow-xs, dan ikon yang responsif.
  - **Tab 1: Monitoring Kehadiran (`TabKehadiran.tsx`):**
    - Sub-tab segmented pill bar dengan ikon representatif (*Mata Kuliah*, *Piket Harian*, *ODS*, *Pra-Magang*) dan transisi fade-in yang halus.
  - **Tab 2: Konseling & Catatan (`TabKonseling.tsx`):**
    - Menghilangkan nesting kartu bertumpuk (*card within card syndrome*) dan merombak 4 section utama (*Konseling & Bimbingan Psikologis*, *Komunikasi & Konseling Tripartit*, *Pendampingan Interview*, dan *Catatan Kedisiplinan/Internal*) menjadi 2-kolom grid yang lapang dan simetris.
    - Menghilangkan box warna mentah pada form dan menggantinya dengan form input berfokus bersih, date picker, selector kondisi ber-emoji status, dan tombol simpan berbobot.
    - Log riwayat berdesain timeline cards modern dengan badge kondisi ber-dot indicator (*Stabil*, *Perlu Perhatian*, *Kritis*), hasil interview (*Lulus*, *Tidak Lulus*, *Menunggu*), dan tombol aksi hapus dengan konfirmasi dialog.
  - **Tab 3: Setoran Hafalan (`TabHafalan.tsx`):**
    - Menyelaraskan 3 Top Metric Cards (*Total Sesi*, *Total Kosakata*, *Total Kalimat*) dengan rounded-2xl radii, ikon berlatar badge warna lembut, dan tipografi ringkas tanpa border tebal 4px.
    - Main card header terintegrasi dengan tombol aksi "+ Tambah Hafalan" dan tabel riwayat interaktif dengan tag chips kata & kalimat serta pop-up preview rincian lengkap.
- ✅ Redesain & Harmonisasi Tampilan Index Manajemen PA (`/dashboard/akademik/pa` & `PAListView.tsx`):
  - Menyelaraskan 2 KPI cards utama (Total Dosen PA dan Total Mahasiswa Terdistribusi) dengan rounded-2xl modern radii dan soft border.
  - Memperbarui tabel daftar Dosen PA dengan monogram avatar, username monospace, badge jumlah mahasiswa bimbingan, dan tombol aksi "Lihat Bimbingan".
- ✅ Mengembalikan status edit normal pada pertemuan PKKMB dan Beginning Class di Manajemen Mata Kuliah (`/dashboard/mata-kuliah/[id]`) dan Rekap Presensi agar dapat disesuaikan fleksibel oleh dosen/akademik seperti pertemuan reguler lainnya.
- ✅ Mengimplementasikan Fitur Catatan Tag Setoran Hafalan (Kosakata per Kata & Kalimat per Kalimat):
  - Menambahkan kolom `vocab_list` (JSONB), `sentence_list` (JSONB), dan `notes` (TEXT) pada skema database PostgreSQL dan Drizzle ORM (`paHafalanSessions`).
  - Memperbarui endpoint API `POST` & `PATCH /students/:id/pa/hafalan` untuk menyimpan dan memvalidasi daftar tag kata, kalimat, serta catatan evaluasi.
  - Membangun antarmuka interaktif Input Tag pada Tab Setoran Hafalan (`TabHafalan.tsx` di panel Akademik dan PA):
    - **Kosakata (Per Kata):** Input tag interaktif dengan pemisahan otomatis via tombol `Enter` / koma `,`, badge chip kata dengan tombol hapus `✕`, serta counter otomatis.
    - **Kalimat (Per Kalimat):** Input tag kalimat berpenomoran otomatis (`#1`, `#2`, dst.) dengan pemisahan via `Enter`, chip kalimat lapang, dan tombol hapus `✕`.
    - **Catatan Evaluasi:** Input catatan/keterangan tambahan untuk intonasi, kelancaran, atau catatan khusus pembimbing.
    - **Tabel & Modal Peninjauan Detail:** Menampilkan preview tag langsung pada baris tabel riwayat serta modal pop-up rincian lengkap untuk melihat seluruh kata & kalimat yang telah dihafal mahasiswa.
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
- ✅ Implementasi Modul & View Manajemen Kehadiran Piket (`/dashboard/kehadiran-piket`):
  - **Endpoint API Backend (`attendance.ts`):**
    - `GET /attendance/piket/daily-board`: Mengambil daftar kelompok piket yang bertugas pada tanggal tertentu beserta status presensi real-time seluruh anggota dan ringkasan metrik statistik harian.
    - `POST /attendance/piket/daily-board/save`: Batch upsert presensi piket per kelompok (Hadir, Izin, Sakit, Alpha + catatan) dengan auto-sinkronisasi agregat kehadiran piket mahasiswa ke tabel `academicData`.
    - `GET /attendance/piket/rekap-history`: Menampilkan riwayat histori sesi presensi piket dengan filter rentang tanggal, angkatan, dan kata kunci pencarian.
    - `GET /attendance/piket/student-summary`: Menghitung kepatuhan presensi piket per mahasiswa lengkap dengan persentase kepatuhan dan status (AMAN $\ge 85\%$, PERLU_PERHATIAN $70-84\%$, TIDAK_AMAN $< 70\%$).
  - **Frontend UI/UX (`KehadiranPiketDashboard.tsx` & `page.tsx`):**
    - **Header Eksekutif & Date Controller:** Kontrol tanggal pintar (Hari Ini, Kemarin, Besok, date picker), filter angkatan, toggle "Tampilkan Semua Hari", dan tombol Export CSV.
    - **6 Kartu Metrik KPI:** Kelompok Bertugas, Total Mahasiswa Terjadwal, Hadir, Izin/Sakit, Alpha/Belum, dan Persentase Kepatuhan Hari Ini.
    - **Tab 1 — Presensi Harian Kelompok (Live Attendance Board):** Redesain kartu kelompok menjadi tampilan eksekutif yang bersih, ringkas, dan modern (nama kelompok, ruangan, jam, progress bar ketercapaian, preview badge anggota dengan status dot) bebas dari tumpukan input inline.
    - **Modal Input & Kelola Presensi Kelompok (`GroupAttendanceDialog`):** Memindahkan form input detail kehadiran ke dalam modal dialog terdedikasi yang elegan dan mudah digunakan, dilengkapi tombol cepat *"⚡ Tandai Semua Hadir"*, segmented toggle status berwarna cerah (*Hadir 🟢, Izin 🟡, Sakit 🔵, Alpha 🔴*), input keterangan, catatan evaluasi kebersihan kelompok, dan tombol *"Simpan Presensi"*.
    - **Tab 2 — Riwayat & Rekap Presensi Piket:** Tabel rekapitulasi sesi piket per tanggal, rincian hadir/izin/sakit/alpha, persentase kepatuhan, modal peninjauan detail sesi, dan export data CSV.
    - **Tab 3 — Monitoring Kepatuhan Mahasiswa:** Tabel kepatuhan per mahasiswa dengan progress bar visual, filter status cepat, tautan WhatsApp interaktif, dan navigasi detail mahasiswa.
  - **Navigasi Sidebar:** Menambahkan sub-item *"Kehadiran Piket"* pada menu dropdown **Akademik** di `Sidebar.tsx`.
- ✅ Penguncian Otoritas Input ODS & Pra-Magang Khusus Divisi CRM (Mode Monitoring untuk Akademik):
  - **Backend Endpoints (`apps/api/src/routes/attendance.ts` & `apps/api/src/routes/student/crm.ts`):** Mengunci hak akses `POST` dan `PATCH` untuk One Day Service (`/mahasiswa/:studentId/ods`) dan Pra Magang (`/mahasiswa/:studentId/pramagang`) hanya untuk role `crm` dan `superadmin` (`hasRole(user, "crm")`), mengembalikan status 403 Forbidden bagi role lain.
  - **Panel Akademik (`TabManajemenMahasiswa.tsx`):** Menghapus input form manual presensi ODS & Pra Magang, menggantinya dengan tampilan monitoring eksekutif read-only yang menampilkan status 5 milestone pelaksanaan ODS, kelengkapan laporan akhir ODS/Pra-Magang, nama mitra industri, masa pra-magang, link video dokumentasi, dan riwayat catatan presensi langsung dari CRM.
  - **Komponen Detail Kehadiran (`TabODS.tsx` & `TabPramagang.tsx` & `TabManajemenMahasiswa.tsx`):** Menghapus seluruh tombol input kehadiran (`+ Input Kehadiran ODS` / `+ Input Kehadiran`), aksi edit baris, modal dialog, serta teks deskripsi panjang (*"Mode Monitoring: Data kehadiran..."*), menghasilkan antarmuka monitoring yang jauh lebih bersih, ringkas, dan fokus pada ringkasan milestone dan riwayat presensi. Seluruh input/pengelolaan data ODS dan Pra-Magang kini terpusat secara eksklusif pada **Panel CRM** (`TabOds.tsx` & `TabPraMagang.tsx`).
- ✅ Pengembalian Sesi PKKMB & Beginning Class Menjadi Fully-Editable (Manajemen Mata Kuliah):
  - **Frontend UI/UX (`apps/web/src/app/dashboard/mata-kuliah/[id]/page.tsx` & `rekap/[id]/page.tsx`):**
    - Sesi PKKMB (P-1) dan Beginning Class (P0) dikembalikan fungsinya agar dapat diedit sepenuhnya sama seperti pertemuan lainnya (P1–P16).
    - Tombol *"Edit Sesi"* aktif untuk mengubah Judul, Jenis Sesi (Teori / Praktik / Keduanya), Tanggal, dan Deskripsi/Materi Pokok.
    - Tombol *"Simpan Presensi & Nilai"* aktif untuk menyimpan data presensi dan penilaian harian.
    - Dropdown status kehadiran (*Hadir, Izin, Sakit, Alpha, Belum Diisi*), input nilai teori, input nilai praktik, dan input catatan dosen berfungsi normal.
    - Kalkulasi rekap kehadiran dan nilai pada halaman rekap perkuliahan disinkronkan berdasarkan input riil.
  - **Backend API (`apps/api/src/routes/courses.ts`):** Membuka kembali hak akses `PATCH /:id/meetings/:meetingId` dan `POST /:id/meetings/:meetingId/attendances` untuk sesi PKKMB dan Beginning Class bagi Dosen pengampu dan Akademik.
