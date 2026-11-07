# OneData Nusadaya Academy — Sistem Informasi Manajemen Terpadu Progres Mahasiswa

[![Bun](https://img.shields.io/badge/Bun-v1.2+-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-v1.4+-black?style=for-the-badge&logo=elysia&logoColor=white)](https://elysiajs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Redis](https://img.shields.io/badge/Redis-Cache_%26_Lock-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**OneData Nusadaya Academy** adalah platform sistem informasi manajemen terintegrasi (*Integrated Enterprise Resource Planning / ERP Student Progress & Internship Tracking Platform*) yang dirancang khusus untuk memonitor, memvalidasi, dan mengelola perjalanan mahasiswa secara *end-to-end* (hulu ke hilir): mulai dari registrasi calon mahasiswa baru (PMB), monitoring hubungan orang tua dan setoran hafalan bahasa asing (CRM), kurikulum akademik, perkuliahan 16 sesi dan anggaran praktik dosen (Akademik & PA), struktur 4 termin pembayaran dan proyeksi eksekutif (Finance), hingga penempatan magang internasional (Taiwan, Malaysia, Timur Tengah, dan Indonesia) dengan standarisasi alur dokumen baku, kelayakan imigrasi, dan sertifikasi kelulusan akhir.

Platform ini dikembangkan untuk memastikan kepatuhan tata kelola, transparansi operasional, serta pemenuhan standar kualifikasi audit dan kelayakan penyelenggaraan pendidikan vokasi / LPK dari **KP2LN**.

---

## 📑 Daftar Isi

- [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
- [Pilar Sistem & Alur Modul Terintegrasi](#-pilar-sistem--alur-modul-terintegrasi)
  - [1. Divisi PMB (Penerimaan Mahasiswa Baru)](#1-divisi-pmb-penerimaan-mahasiswa-baru)
  - [2. Divisi CRM (Customer Relationship Management)](#2-divisi-crm-customer-relationship-management)
  - [3. Divisi Akademik & Pengajaran](#3-divisi-akademik--pengajaran)
  - [4. Pembimbing Akademik (PA)](#4-pembimbing-akademik-pa)
  - [5. Divisi Finance (Standardisasi FIN-01 & FIN-02)](#5-divisi-finance-standardisasi-fin-01--fin-02)
  - [6. Divisi Magang & Hubungan Luar Negeri (Internship)](#6-divisi-magang--hubungan-luar-negeri-internship)
  - [7. Evaluasi Finalisasi & Gatekeeping ACC](#7-evaluasi-finalisasi--gatekeeping-acc)
  - [8. Portal Mandiri Mahasiswa](#8-portal-mandiri-mahasiswa)
- [Struktur Monorepo](#-struktur-monorepo)
- [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
- [Daftar Akun Demo & Matriks Hak Akses (RBAC)](#-daftar-akun-demo--matriks-hak-akses-rbac)
- [Pengujian & Verifikasi Kualitas Kode](#-pengujian--verifikasi-kualitas-kode)
- [Panduan Deployment (Produksi)](#-panduan-deployment-produksi)
- [Dokumentasi Teknis](#-dokumentasi-teknis)

---

## 🛠️ Arsitektur & Tech Stack

Sistem dibangun menggunakan pola **Monorepo** berbasis Bun workspaces yang memisahkan ranah komputasi API server dan antarmuka web secara modular namun terikat kontrak tipe data yang ketat:

```
┌────────────────────────────────────────────────────────┐
│               OneData Nusadaya Platform                │
└────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────┐                 ┌──────────────────┐
│    apps/web      │  Elysia Eden    │    apps/api      │
│  (Next.js 15)    │◄───────────────►│   (ElysiaJS)     │
│ React 19 Client  │  Type-Safe API  │   Bun Runtime    │
└──────────────────┘                 └──────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────┐                 ┌──────────────────┐
│   Tailwind v4    │                 │  PostgreSQL 16   │
│   shadcn/ui      │                 │  + Drizzle ORM   │
│   Radix Prims    │                 │  Redis (Cache)   │
└──────────────────┘                 └──────────────────┘
```

### 1. Backend Service (`apps/api`)
- **Runtime:** [Bun](https://bun.sh/) (v1.2+) — Runtime JavaScript/TypeScript dengan kecepatan eksekusi tinggi dan konsumsi memori efisien.
- **Framework:** [ElysiaJS](https://elysiajs.com/) — Web framework ultra-ringan dengan validasi skema bertipe data statis (TypeBox).
- **ORM & Database:** [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL 16 (Relational DB dengan integritas referensial dan indeks multi-kolom).
- **Caching & Lock Layer:** [Redis](https://redis.io/) via `ioredis` — Invalidation pattern reaktif, rate limiting multi-lapis, dan distributed session locks.
- **Keamanan & Autentikasi:** JSON Web Token (JWT) + Verifikasi OTP 2FA 6-digit + Multi-Role Role-Based Access Control (RBAC).
- **Background Workers:** Worker antrean mandiri untuk pencadangan basis data berkala (*Database Backup*), kompresi berkas dokumen massal (*Archiver*), serta kompilasi PDF laporan.

### 2. Frontend Client (`apps/web`)
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router Architecture) & React 19.
- **Type-Safe RPC:** [Elysia Eden Treaty](https://elysiajs.com/eden/overview.html) — Menjamin sinkronisasi tipe data dari rute backend ke komponen antarmuka tanpa pembentukan kode perantara (*Zero-Codegen Type Safety*).
- **Desain & UI:** Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), Radix UI Primitives, Lucide Icons, tw-animate-css.
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (Persistent Auth & Filter Store) + [TanStack React Query v5](https://tanstack.com/query) (Server State Caching).
- **Visualisasi & Analitik:** [Recharts](https://recharts.org/) (Grafik Proyeksi Keuangan, Capaian Target, dan Demografi Pendaftar).
- **Pemeriksa Berkas In-App:** `openDocumentReview` Universal Viewer (Pratinjau PDF dan Gambar tanpa unduh paksa, dilengkapi autentikasi Bearer otomatis).

---

## 🌟 Pilar Sistem & Alur Modul Terintegrasi

OneData Nusadaya mengintegrasikan 6 divisi operasional kampus ke dalam alur kerja sistematis berstandar ERP:

```mermaid
flowchart LR
    PMB[1. PMB: Registrasi] --> CRM[2. CRM: Hafalan & Ortu]
    CRM --> AKD[3. Akademik: 16 Sesi & Nilai]
    AKD --> PA[4. PA: Bimbingan & Sikap]
    PA --> FIN[5. Finance: 4 Termin & Talangan]
    FIN --> MAG[6. Magang: Taiwan Pipeline & Penempatan]
    MAG --> FINDEC[7. Final Decision: ACC Mandiri]
```

---

### 1. Divisi PMB (Penerimaan Mahasiswa Baru)
- **Registrasi Mandiri & Tautan Revisi Berbasis Centang Merah (Segmen 3):** Calon mahasiswa dapat mengisi formulir mandiri melalui tautan khusus. Jika berkas ditolak/perlu perbaikan, tautan dapat dibuka kembali untuk memperbaiki field yang ditandai revisi saja tanpa harus mengulang formulir dari awal.
- **Pelacakan Sumber Pendaftar & Fee Sharing (Segmen 3 & 4):** Formulir pendaftaran merekam sumber asal calon mahasiswa (pendamping, sekolah, BKK, teman) untuk transparansi *closing* pendaftar yang terhubung langsung ke modul Finance.
- **Kontak Darurat & Rekomendasi Rekan (Segmen 4 & 5):** Validasi wajib pengisian kontak darurat keluarga serta minimal 3–5 nomor rekomendasi rekan aktif sebelum pengiriman formulir.
- **SLA & Persetujuan Dokumentasi Awal (Segmen 6):** Kesepakatan awal *Service Level Agreement (SLA)* dan izin pemanfaatan dokumentasi kegiatan promosi.
- **Sinkronisasi Uang Pangkal (DP) ke Finance (Segmen 7):** Pembagian biaya total pendidikan diinput oleh tim PMB, sedangkan status pembayaran DP Registrasi Awal disinkronkan secara dua arah (*two-way sync*) dengan Finance.
- **Gating Penerbitan NIM (Segmen 5 & 12):** Nomor Induk Mahasiswa (NIM) terkunci secara otomatis dan baru dapat diterbitkan setelah pembayaran Registrasi Awal dinyatakan valid oleh Finance.

---

### 2. Divisi CRM (Customer Relationship Management)
- **Monitoring Hafalan Bahasa Asing (Segmen 7 & 8):** Memantau setoran hafalan kosakata (*vocabulary*) dan kalimat (*sentences*) bahasa asing (Mandarin Taiwan, Melayu Malaysia, Arab) yang diinput langsung oleh Dosen PA saat sesi setoran berlangsung.
- **Ekspor Rekap Kehadiran PDF untuk Orang Tua (Segmen 8):** Penyediaan fitur unduh dan ekspor rekapitulasi kehadiran mahasiswa ke format PDF resmi bertandatangan institusi untuk pelaporan langsung kepada orang tua/wali.
- **Pelaporan & Validasi Kegiatan ODS (One Day Service - Segmen 8, 9, 10):**
  - Mahasiswa wajib menempuh 5 kali pengabdian/kunjungan ODS.
  - Formulir laporan dipisahkan per pelaksanaan ODS agar tombol verifikasi dan tinjauan berkas beroperasi secara modular.
  - Integrasi Tri Dharma Perguruan Tinggi: Akomodasi pengabdian masyarakat dosen dan mahasiswa, baik ke sekolah mitra maupun desa binaan.
- **Dokumentasi Pra-Magang & Unggah Konten Bulanan (Segmen 9):**
  - Kewajiban mahasiswa menyetorkan tautan video konten dokumentasi kegiatan setiap bulan melalui portal akun mahasiswa.
  - Staf internal bertindak sebagai peninjau (*reviewer*) berkas dan video yang disetor.
- **Log Catatan Komunikasi Wali & Industri (Segmen 10):** Pencatatan riwayat penanganan isu mahasiswa bersama wali dan mitra industri luar negeri.

---

### 3. Divisi Akademik & Pengajaran
- **Pemisahan Batasan Ranah PMB vs Akademik (Segmen 5):** Pengelolaan status keaktifan mahasiswa (Aktif, Cuti, Drop Out, Mengundurkan Diri) dan penunjukan Dosen PA dipusatkan seutuhnya di modul Akademik.
- **Standarisasi 16 Sesi Pertemuan Kuliah (Segmen 16):**
  - Penjadwalan mata kuliah terbagi strictly ke dalam 16 sesi (Pertemuan 1–7 Teori/Praktik, Pertemuan 8 UTS, Pertemuan 9–15 Teori/Praktik, dan Pertemuan 16 UAS).
  - Input presensi kehadiran (Hadir, Izin, Sakit, Alpa) dan nilai praktik secara langsung per sesi pertemuan.
- **Sistem Presensi Geofencing & Absensi Selfie Pintar (Segmen 14 & 18):**
  - Validasi lokasi presensi mandiri terkunci berbasis koordinat GPS radius kampus Nusadaya (Bandar Lampung) untuk mencegah manipulasi lokasi.
  - Presensi foto selfie dengan kompresi gambar otomatis (*client-side auto-compress*) guna mencegah lonjakan beban penyimpanan server.
- **Sistem Baris Pagi Hybrid & Piket Kedisiplinan (Segmen 15 & 16):**
  - Rekapitulasi kepatuhan kehadiran baris pagi mingguan dan piket kebersihan kampus.
  - Fitur reschedule sesi, penyesuaian dispensasi tugas, dan live attendance monitoring.
- **Modul Dosen Pengampu & Pengajuan Anggaran Praktik (Segmen 13):**
  - Khusus mata kuliah berbobot praktik: Dosen pengampu mengajukan Rencana Anggaran Biaya (RAB) dan rincian bahan praktik per semester.
  - Integrasi persetujuan ke modul Finance: Finance memiliki wewenang memberikan ACC atau menolak dengan alasan tertulis.
  - Pelaporan rekapitulasi sisa bahan praktik pasca-kegiatan kuliah.
- **Perhitungan Nilai Akhir Otomatis & KHS/Transkrip (Segmen 14):**
  - Kalkulasi otomatis nilai akhir (gabungan kehadiran, tugas, nilai praktik, UTS, UAS, dan sikap) menjadi nilai huruf (*grade*) dan mutu SKS.
  - Penerbitan KHS dan Transkrip Nilai Akademik ber-nomor dokumen resmi dan QR-code verifikasi.

---

### 4. Pembimbing Akademik (PA)
- **Dashboard Supervisi Perwalian (Segmen 17):** Dosen PA memonitor perkembangan akademik mahasiswa bimbingan, rekapan presensi kuliah, dan keluhan mahasiswa.
- **Disiplin Input Setoran Hafalan (Segmen 7 & 8):** Dosen PA menginput tanggal, bahasa, dan jumlah capaian kata/kalimat secara berkala agar progres mahasiswa di CRM selalu terbarui secara *real-time*.
- **3 Indikator Evaluasi Utama PA:**
  1. *Konseling Selesai* (`counselingDone`)
  2. *Kondisi Mental Stabil & Siap Industri* (`mentalStable`)
  3. *Kedisiplinan Baik* (`disciplineGood`)
- **Pemberian ACC PA:** Hak akses persetujuan akhir Dosen PA sebelum mahasiswa melangkah ke tahap seleksi magang internasional.

---

### 5. Divisi Finance (Standardisasi FIN-01 & FIN-02)
- **Struktur 4 Termin Biaya Pendidikan Baku (Segmen 11, 12, 24):**
  1. **Termin 1 (Registrasi Awal / Uang Pangkal):** Sinkronisasi otomatis status DP dari pendaftaran PMB.
  2. **Termin 2 (Pembayaran SPP Semester 1):** Mendukung pelunasan penuh maupun pembagian jadwal cicilan bulanan yang fleksibel dan dinamis (Agustus, September, Oktober, dst.).
  3. **Termin 3 (Kontrak Magang / Suhan):** Pembiayaan proses pengurusan dokumen kontrak kerja dan penerbitan izin Suhan ke instansi berwenang Taiwan/Malaysia.
  4. **Termin 4 (Penempatan Magang Taiwan / Keberangkatan):** Pelunasan tahap akhir sebelum mahasiswa diberangkatkan ke negara penempatan.
- **Skema Fleksibel Dana Talangan (Segmen 12):**
  - Akomodasi pembiayaan mandiri vs dana talangan lembaga mitra perbankan (Bank BTN, dsb.).
  - Pilihan termin talangan fleksibel: **1 Tahap** (pencairan penuh saat keberangkatan) atau **2 Tahap** (Tahap I SPP/Kontrak dan Tahap II Visa/Keberangkatan).
- **Proyeksi Target & Realisasi Eksekutif (Segmen 10 & 11):**
  - Dashboard eksekutif yang merinci target pendapatan tahunan dan bulanan per sumber peminatan (SPP Taiwan, SPP Malaysia, PMB Baru, Angkatan 15 & 16, Timur Tengah, dan Indonesia).
  - Tampilan persentase capaian realisasi kas masuk terhadap pagu target secara *real-time*.
- **Pencairan Bertahap Fee Sharing Mitra (Segmen 3 & 13):**
  - Data mitra sponsor dari PMB otomatis mengalir ke Finance.
  - Finance dapat mencairkan komisi secara bertahap (misal termin 1 sebesar 50%) disertai bukti transfer bank per termin.
- **Wewenang Verifikasi Anggaran Praktik Dosen (Segmen 13):** Form verifikasi untuk meninjau pengajuan bahan praktik dosen, menyetujui (ACC), atau menolak disertai catatan penolakan resmi.

---

### 6. Divisi Magang & Hubungan Luar Negeri (Internship)

Modul Magang Internasional telah dirancang ulang menjadi **arsitektur 6 tab mandiri** guna memastikan kelancaran administrasi dan audit KP2LN:

```mermaid
flowchart TD
    subgraph TabStructure [Struktur 6 Tab Panel Magang]
        T1[Tab 1: Kelayakan Pra-Paspor]
        T2[Tab 2: KHS & Transkrip Akademik]
        T3[Tab 3: Penempatan Magang]
        T4[Tab 4: Dokumen Terbang]
        T5[Tab 5: Pembayaran Lanjutan]
        T6[Tab 6: Syarat Akhir / Post-Internship]
    end
```

#### Tab 1: Kelayakan Pra-Paspor (Segmen 19)
- Verifikasi 11 berkas legalitas awal: Pas Foto, KTM, Scan e-KTP, Kartu Keluarga (KK), Akta Kelahiran, Surat Izin Orang Tua/Wali, dan Surat Rekomendasi Disdik.
- **Dokumen Bersyarat Mitra (Segmen 19):**
  - **Surat Pernyataan Usia >21 Tahun (SL-21):** Prasyarat khusus seleksi dan visa untuk mahasiswa yang diberangkatkan via mitra **Hong Ta (Taiwan)**.
  - **Surat Keterangan Riwayat Gap Year:** Prasyarat khusus verifikasi aktivitas dan lulusan masa gap year untuk mitra **Flamboyan (Taiwan)**.
- **Dokumen Wajib Institusi:** **Letter of Student (LOS / SKMA Aktif)** bertandatangan resmi pimpinan kampus sebagai syarat verifikasi imigrasi pembuatan paspor dan seleksi industri luar negeri.
- **Pemisahan Berkas:** Kolom unggahan Ijazah pendidikan terakhir dipisahkan secara tegas dari Transkrip Nilai Akademik.

#### Tab 2: Rekapitulasi KHS & Transkrip Akademik (Segmen 19)
- **Pemisahan Mandiri dari Pra-Paspor:** Modul akademik mahasiswa dipisahkan ke dalam tab tersendiri agar staf magang dapat meninjau performa akademik secara komprehensif.
- **Integrasi Nilai Real-Time dari BAAK Akademik:**
  - Tampilan IPK Kumulatif (skala 4.00), Total SKS Lulus, dan Status Kelulusan Ujian UTS/UAS.
  - Evaluasi Kriteria Wawancara Industri (IPK $\ge 2.75 \rightarrow$ *Memenuhi Syarat Seleksi Industri*).
  - Tabel rincian komponen nilai perkuliahan (Kode, Mata Kuliah, SKS, Tipe Teori/Praktik, Nilai Angka, Nilai Huruf/Grade, dan Status Kelulusan).
  - Tombol **"Sinkronkan Nilai dari Akademik"**: Memicu pembaruan data nilai secara atomik dan mencentang indikator KHS/Transkrip di sistem secara otomatis.
  - Tombol unduh langsung dokumen resmi: **Unduh Dokumen KHS PDF** dan **Unduh Transkrip PDF**.
  - Slot arsip berkas fisik KHS dan Transkrip nilai legalisir.

#### Tab 3: Penempatan Magang & Mitra Industri (Segmen 21)
- **Standarisasi Istilah 'Mitra Penempatan':** Istilah agensi sponsor distandarisasi resmi menjadi **Mitra Penempatan** (Hong Ta Taiwan, Flamboyan Taiwan, Prince International Malaysia, MBM Malaysia, dll.).
- **Form Data Penempatan Industri:** Nama Hotel / Perusahaan Tempat Magang, Kota Tujuan, Negara Penempatan, dan Durasi Masa Magang (6 Bulan s/d 24 Bulan).
- **Penguncian 5 Departemen Utama Perhotelan (Segmen 21):**
  1. **HK** — *Housekeeping (Tata Graha)*
  2. **FBS** — *Food & Beverage Service (Layanan Restoran)*
  3. **FBP** — *Food & Beverage Product (Tata Boga & Dapur)*
  4. **FO** — *Front Office (Kantor Depan & Tamu)*
  5. **Barista** — *Spesialis Kopi & Minuman*
- **Slot Dokumen Tambahan Mitra Penempatan:** Wadah unggah berkas opsional untuk mengakomodasi dokumen khusus yang diminta spesifik oleh agensi sebelum pengajuan visa (seperti Surat Keterangan Tunda Wisuda / *Postpone Graduation Letter*, *Landing Permit* / LG Izin Terbang).
- Verifikasi kesiapan penempatan industri (`agenReady`).

#### Tab 4: Dokumen Terbang & Alur Berkas Taiwan (Segmen 20 & 22)
- **Penghapusan Berkas Redundan LOL:** Berkas *Letter of Offer (LOL)* dihapus sepenuhnya dari alur sistem karena fungsinya sama dengan LOA.
- **Standarisasi 6 Urutan Berkas Baku Taiwan:**
  1. **MOU Kampus & Hotel Mitra:** Nota kesepahaman kerjasama institusi kampus dengan hotel penempatan.
  2. **Letter of Acceptance (LOA):** Surat penerimaan dan konfirmasi penempatan resmi dari industri mitra.
  3. **Kontrak Kerja Magang:** Kontrak kerja yang ditandatangani mahasiswa dan pihak industri luar negeri.
  4. **Suhan — Izin Magang Taiwan:** Surat persetujuan resmi magang mahasiswa WNI di Taiwan dari Biro Kepariwisataan / instansi berwenang Taiwan.
  5. **Medical Check Up (MCU) Full:** Pemeriksaan kesehatan menyeluruh standar penempatan dan penerbangan internasional di rumah sakit rujukan.
  6. **Visa Kerja / Magang:** Penerbitan visa tinggal resmi sesuai regulasi negara penempatan.
- **Kesiapan Penerbangan:** Tiket Pesawat Resmi & Rute Penerbangan.
- **Restrukturisasi Asesmen Keberangkatan (PDT) 2-Slot (Segmen 20 & 22):**
  - Istilah diubah dari *Pelatihan Pra-Keberangkatan (PDT)* menjadi **"Asesmen dan Pengarahan Keberangkatan"**.
  - Menyediakan 2 slot unggahan dokumen terpisah:
    - *Slot 1:* Hasil Asesmen Kompetensi & Pengarahan.
    - *Slot 2:* Surat Pernyataan Keberangkatan Mahasiswa.
- **Dokumentasi Pelepasan & Bandara:** Dokumentasi serah terima dan foto pelepasan di bandara.
- **Sertifikasi Bahasa Asing:** Pengujian kelayakan bahasa kerja (TOEIC / JLPT / TOCFL).

#### Tab 5: Pembayaran Lanjutan & Dana Talangan (Segmen 24)
- Sinkronisasi status pelunasan 4 termin dari modul Finance secara *live*.
- Penegasan status pelunasan keberangkatan dengan label resmi **"Keberangkatan Magang"**.
- Visualisasi skema pembiayaan mandiri vs akad talangan 1 tahap / 2 tahap.

#### Tab 6: Syarat Akhir / Post-Internship (Segmen 25)
- Pemantauan kelulusan dan kepulangan magang melalui validasi 3 luaran wajib:
  1. **Logbook Harian Kerja Industri** (ditandatangani supervisor hotel).
  2. **Laporan Akhir Magang** (disetujui pembimbing kampus).
  3. **Video Portofolio & Dokumentasi Magang** (tautan video kegiatan kerja).

---

### 7. Evaluasi Finalisasi & Gatekeeping ACC
- **Gatekeeping Keputusan Akhir:** Panel agregasi lintas divisi yang memverifikasi bahwa mahasiswa telah mendapatkan status ACC resmi dari seluruh divisi terkait (PMB, CRM, Finance, Akademik, PA, dan Magang) sebelum status *Layak Berangkat* atau *Tandatangan Kontrak* diterbitkan.
- **Proteksi Status ACC Magang:** Tombol persetujuan akhir (*ACC Divisi Magang*) terkunci secara ketat oleh sistem dan baru dapat diaktifkan jika seluruh indikator kelengkapan berkas telah tuntas (100%).

---

### 8. Portal Mandiri Mahasiswa
- **Akses Transparan Mahasiswa (`/mahasiswa/dashboard`):** Mahasiswa dapat melihat progres kesiapan keberangkatan, jadwal perkuliahan, rincian biaya dan tagihan cicilan, serta catatan perwalian Dosen PA.
- **Portal Magang Siswa (`/mahasiswa/panel/magang`):** Tampilan responsif mobile (iOS dan Android) yang menyajikan status 6 dokumen alur Taiwan, checklist kesiapan pra-paspor, jadwal asesmen, dan rincian penempatan industri.

---

## 📁 Struktur Monorepo

```text
dashboard-nusadaya/
├── apps/
│   ├── api/                              # Backend Service (ElysiaJS & Bun)
│   │   ├── src/
│   │   │   ├── db/                       # Schema Drizzle ORM, Migrasi & Koneksi Database
│   │   │   │   ├── schema/               # Definisi tabel (internship, finance, courses, students, dll)
│   │   │   │   ├── migrate_magang_suhan_asesmen.ts # Migrasi SQL untuk Suhan, MOU, Asesmen & Penempatan
│   │   │   │   ├── migrate_fin02_termin_biaya.ts   # Migrasi SQL 4 termin finance & skema talangan
│   │   │   │   └── index.ts              # Inisialisasi Postgres & Drizzle
│   │   │   ├── routes/                   # Handler API per divisi & resource
│   │   │   │   ├── auth.ts               # Autentikasi, Login, OTP 2FA
│   │   │   │   ├── finance.ts            # Proyeksi keuangan, fee sharing, anggaran praktik
│   │   │   │   ├── courses.ts            # Mata kuliah, rombel, presensi geofencing
│   │   │   │   └── student/              # Endpoint spesifik mahasiswa
│   │   │   │       ├── internship.ts     # Rute data magang, passport clearance, alur Taiwan & ACC
│   │   │   │       ├── academic.ts       # Rute KHS, transkrip, dan sync-to-magang
│   │   │   │       ├── finance.ts        # Rute 4 termin finance & cicilan fleksibel
│   │   │   │       └── crm.ts            # Rute hafalan, presensi PDF, ODS & video bulanan
│   │   │   ├── modules/                  # Service layer (GradeCalculationService, fileService, dll)
│   │   │   ├── middleware/               # RBAC, audit log, rate limiter
│   │   │   └── index.ts                  # Entry point server ElysiaJS
│   │   ├── test/                         # Unit & integration test backend (bun test)
│   │   │   ├── magang_suhan_asesmen_taiwan.test.ts # Test alur 6 Dokumen Taiwan & Asesmen
│   │   │   ├── fin02_backend_endpoints.test.ts     # Test 4 termin finance & talangan
│   │   │   └── anggaran_praktik_dosen.test.ts      # Test pengajuan & ACC anggaran praktik
│   │   ├── seed.ts                       # Skrip seeding data awal
│   │   └── package.json
│   │
│   └── web/                              # Frontend Client (Next.js 15 App Router)
│       ├── public/                       # Aset statis & logo
│       ├── src/
│       │   ├── app/                      # App router halaman dashboard & portal
│       │   │   ├── dashboard/            # Antarmuka dashboard staf per divisi
│       │   │   │   ├── students/[id]/    # Halaman detail mahasiswa lintas divisi
│       │   │   │   └── magang/           # Dashboard monitoring keberangkatan magang
│       │   │   └── mahasiswa/            # Portal mandiri mahasiswa
│       │   ├── components/               # Komponen UI modular
│       │   │   ├── dashboards/           # Dasbor KPI (MagangDashboard, FinanceDashboard, dll)
│       │   │   ├── panels/               # Komponen panel utama per divisi
│       │   │   │   ├── InternshipPanel.tsx # Panel Magang multi-tab (6 Tab terpadu)
│       │   │   │   └── magang/           # Sub-komponen tab Magang
│       │   │   │       ├── TabPraPaspor.tsx    # Tab 1: Dokumen Identitas & Syarat Bersyarat
│       │   │   │       ├── TabKhsTranskrip.tsx  # Tab 2: Rekap KHS & Transkrip Real-Time BAAK
│       │   │   │       ├── TabPenempatan.tsx   # Tab 3: Mitra Penempatan & 5 Departemen Utama
│       │   │   │       ├── TabDokumen.tsx      # Tab 4: Alur 6 Berkas Taiwan & Asesmen 2-Slot
│       │   │   │       ├── TabDanaTalangan.tsx  # Tab 5: Tracking 4 Termin Biaya Finance
│       │   │   │       └── TabSyaratAkhir.tsx   # Tab 6: Logbook, Laporan Akhir & Portofolio
│       │   │   └── ui/                   # Komponen primitif shadcn/ui & Radix
│       │   ├── hooks/                    # Custom hooks (proyeksi keuangan, data fetchers)
│       │   ├── lib/                      # Eden treaty API client, auth helper
│       │   ├── store/                    # Zustand state management
│       │   └── utils/                    # Helper format rupiah, validator, panel logic
│       ├── __tests__/                    # Unit test frontend logic (panel-logic.test.ts)
│       └── package.json
│
├── docs/                                 # Dokumentasi teknis, arsitektur, dan changelog
├── Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf # Berkas transkrip audio resmi rapat institusi
├── docker-compose.yml                    # Konfigurasi containerized database & cache
├── package.json                          # Root monorepo configuration
├── biome.json                            # Konfigurasi code formatting & linting
└── README.md                             # Dokumentasi utama platform
```

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### 1. Persyaratan Sistem
Pastikan perangkat Anda telah terpasang:
- **[Bun](https://bun.sh/)** (v1.2.0 atau lebih baru)
- **[Docker & Docker Compose](https://www.docker.com/)**
- **Git**
- **Node.js** (v20+ opsional untuk kompatibilitas tooling)

### 2. Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/FauzanAmirudin/dashboard-nusadaya.git
cd dashboard-nusadaya

# Instal seluruh dependensi monorepo
bun install
```

### 3. Konfigurasi Environment Variables
Pastikan berkas konfigurasi lingkungan telah disiapkan:

**Backend (`apps/api/.env`):**
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nusadaya
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5454
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5454/nusadaya

REDIS_URL=redis://127.0.0.1:6380

JWT_SECRET=super_secret_jwt_key_nusadaya_2026
FRONTEND_URL=http://localhost:3000
```

**Frontend (`apps/web/.env` atau `apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
```

### 4. Menjalankan Layanan PostgreSQL & Redis
Jalankan kontainer PostgreSQL dan Redis melalui Docker:
```bash
docker compose up -d db redis
```

### 5. Eksekusi Migrasi Basis Data & Seeding
Terapkan struktur tabel terbaru dan masukkan data awal:
```bash
cd apps/api

# Push skema tabel Drizzle ke PostgreSQL
bun run db:push

# Jalankan migrasi alur dokumen Magang & Finance
bun run src/db/migrate_magang_suhan_asesmen.ts
bun run src/db/migrate_fin02_termin_biaya.ts

# Masukkan master data pengguna, program studi, dan mahasiswa demo
bun run seed
```

### 6. Menjalankan Development Server
Kembali ke root direktori dan jalankan kedua aplikasi (API dan Web) secara paralel:
```bash
cd ../../
bun run dev
```

Aplikasi siap diakses pada URL berikut:
- **Web Frontend:** [`http://localhost:3000`](http://localhost:3000)
- **API Server:** [`http://localhost:3001`](http://localhost:3001)
- **Dokumentasi Swagger API:** [`http://localhost:3001/swagger`](http://localhost:3001/swagger)

---

## 🔑 Daftar Akun Demo & Matriks Hak Akses (RBAC)

Sistem mengimplementasikan pengamanan **Multi-Role Role-Based Access Control (RBAC)** dan autentikasi dua faktor **OTP 2FA**. 

> [!NOTE]
> **Kebijakan Pengujian Akun Demo:**
> - Seluruh akun demo menggunakan kata sandi bawaan: **`password`**.
> - Anda dapat login menggunakan **Username** atau **Email terdaftar**.
> - Selama tahap pengembangan, kode OTP 6-digit otomatis ditampilkan langsung di bawah kotak isian formulir OTP untuk mempercepat pengujian.

### 1. Akun Divisi Operasional & Manajemen
| Divisi / Peran | Username | Email Login | Password | Cakupan Hak Akses Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Superadmin** | `superadmin` | `onedatanusadaya@gmail.com` | `password` | Akses penuh seluruh modul, manajemen pengguna, multi-role assignment, konfigurasi global, audit log, dan cadangan ERP. |
| **Divisi PMB** | `pmb` | `pmb@nusadaya.ac.id` | `password` | Formulir pendaftaran, tautan revisi pendaftar, referral fee sharing, verifikasi berkas awal, dan ACC PMB. |
| **Divisi CRM** | `crm` | `crm@nusadaya.ac.id` | `password` | Monitoring hafalan kata/kalimat, ekspor presensi PDF ke orang tua, review laporan 5 sesi ODS, video bulanan siswa, dan ACC CRM. |
| **Divisi Finance** | `finance` | `finance@nusadaya.ac.id` | `password` | Billing 4 termin baku, cicilan fleksibel semester 1, pencairan bertahap fee sharing, approval anggaran praktik dosen, proyeksi eksekutif, dan ACC Finance. |
| **Divisi Akademik** | `akademik` | `akademik@nusadaya.ac.id` | `password` | Kurikulum, rombel, 16 sesi kuliah, presensi geofencing radius kampus, penerbitan KHS/Transkrip, rekap sisa bahan, dan ACC Akademik. |
| **Tim Magang** | `magang` | `magang@nusadaya.ac.id` | `password` | 6 tab modul magang (pra-paspor, KHS/transkrip BAAK, penempatan 5 departemen, 6 dokumen Taiwan, pembayaran lanjutan, syarat akhir), dan ACC Magang. |
| **Koordinator PA** | `pa` | `pa@nusadaya.ac.id` | `password` | Supervisi perwalian, evaluasi 3 indikator inti (konseling, mental, disiplin), input setoran hafalan, dan ACC PA. |
| **Dosen Pengampu** | `dosen` | `dosen@nusadaya.ac.id` | `password` | Presensi sesi perkuliahan, penilaian mahasiswa, pengajuan anggaran bahan praktik dosen, dan laporan sisa bahan. |

### 2. Akun Dosen Pembimbing Akademik (PA)
| Username | Nama Lengkap Dosen PA | Email Login | Password | Penugasan Role Ganda |
| :--- | :--- | :--- | :--- | :--- |
| `pa1` | Dr. Maya Indah Permata, M.Pd. | `pa1@nusadaya.ac.id` | `password` | Dosen PA |
| `pa2` | Bambang Wijaya, S.Pd., M.Ed. | `pa2@nusadaya.ac.id` | `password` | Dosen PA |
| `pa3` | dr. Ratna Sari, M.Biomed. | `pa3@nusadaya.ac.id` | `password` | Dosen PA |
| `pa4` | Drs. Joko Purwanto, M.M. | `pa4@nusadaya.ac.id` | `password` | Dosen PA |
| `pa5` | Sri Wahyuni, S.Pd., M.Pd. | `pa5@nusadaya.ac.id` | `password` | Dosen PA |
| `pa6` | Ahmad Ridwan, S.T., M.Sc. | `pa6@nusadaya.ac.id` | `password` | Dosen PA |
| `pa7` | Fitri Handayani, S.Par., M.Par. | `pa7@nusadaya.ac.id` | `password` | Dosen PA |
| `pa8` | Hadi Pranoto, S.T., M.Kom. | `pa8@nusadaya.ac.id` | `password` | Dosen PA |
| `pa9` | Yuliana Dewi, S.Si., M.Si. | `pa9@nusadaya.ac.id` | `password` | Dosen PA & CRM |
| `pa10` | Rizky Firmansyah, S.Pd., M.Pd. | `pa10@nusadaya.ac.id` | `password` | Dosen PA & Akademik |

### 3. Akun Portal Mahasiswa
| NIM | Nama Mahasiswa | Username | Email Login | Password | Peminatan Industri |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `250001` | Aditya Pratama | `mahasiswa1` | `mhs1@student.nusadaya.ac.id` | `password` | Hospitality (Malaysia) |
| `250002` | Bella Safitri | `mahasiswa2` | `mhs2@student.nusadaya.ac.id` | `password` | Culinary (Taiwan) |
| `250003` | Dimas Anggara | `mahasiswa3` | `mhs3@student.nusadaya.ac.id` | `password` | Barista (Timur Tengah) |
| `250004` | Eka Putri Rahayu | `mahasiswa4` | `mhs4@student.nusadaya.ac.id` | `password` | Front Office (Malaysia) |
| `2500051` | Faris Maulana | `mahasiswa5` | `mhs5@student.nusadaya.ac.id` | `password` | Housekeeping (Taiwan) |
| `250006` | Gita Gutawa | `mahasiswa6` | `mhs6@student.nusadaya.ac.id` | `password` | Hospitality (Indonesia) |

---

## 🧪 Pengujian & Verifikasi Kualitas Kode

Sistem dilengkapi pengujian unit dan integrasi otomatis menyeluruh:

```bash
# 1. Menjalankan pengujian alur 6 Dokumen Taiwan, Suhan, & Asesmen Magang (Backend)
bun test apps/api/test/magang_suhan_asesmen_taiwan.test.ts

# 2. Menjalankan pengujian 4 termin finance, DP sync, & proyeksi target (Backend)
bun test apps/api/test/fin02_backend_endpoints.test.ts

# 3. Menjalankan pengujian alur pengajuan & persetujuan anggaran praktik dosen (Backend)
bun test apps/api/test/anggaran_praktik_dosen.test.ts

# 4. Menjalankan pengujian logika bisnis panel & validator form (Frontend)
bun test apps/web/src/test apps/web/src/__tests__/unit

# 5. Format & linter kode menggunakan Biome
bunx biome check --write

# 6. Kompilasi build Next.js (Production Build Verification)
bun run build
```

---

## 🚢 Panduan Deployment (Produksi)

Untuk penyebaran (*deployment*) pada server produksi atau VPS:

1. **Unduh kode terbaru dari branch utama:**
   ```bash
   git pull origin main
   ```
2. **Build dan jalankan kontainer aplikasi via Docker Compose:**
   ```bash
   docker compose up -d --build
   ```
3. **Eksekusi migrasi basis data:**
   ```bash
   docker compose exec api bun run src/db/migrate_magang_suhan_asesmen.ts
   docker compose exec api bun run src/db/migrate_fin02_termin_biaya.ts
   ```
4. **Konfigurasi Reverse Proxy Nginx & SSL:**
   - Memetakan port `3000` ke domain web aplikasi (misal: `https://dashboard.nusadaya.ac.id`).
   - Memetakan port `3001` ke subdomain API (misal: `https://api-dashboard.nusadaya.ac.id`).

---

## 📚 Dokumentasi Teknis & Catatan Rilis

Dokumentasi arsitektur terperinci, alur data tiap divisi, serta rekaman notulensi rapat tersedia pada direktori [`docs/`](docs/):
- **[Transkrip Catatan Rapat Nusadaya (1 Sep 2026)](Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf)** — Notulensi audio rapat pleno 25 segmen persiapan kelayakan One Data Nusadaya & KP2LN.
- [Arsitektur & Struktur Sistem ERP](docs/01-arsitektur-dan-struktur-sistem.md)
- [Alur Data & Logika Bisnis Divisi](docs/02-alur-data-dan-logika-bisnis.md)
- [Changelog Pembaruan Anggaran Praktik, Hafalan PA & CRM](docs/changelog_01-09-2026_anggaran_praktik_pmb_crm_hafalan_and_dosen.md)
- [Changelog Sinkronisasi Panel PA & Perbaikan ACC Magang](docs/changelog_27-08-2026_pa_sync_internal_notes_magang_acc_and_runtime_fixes.md)
- [Changelog Standarisasi FIN-02 & Proyeksi Eksekutif](docs/changelog_10-08-2026_finance.md)

---

&copy; 2026 **OneData Nusadaya Academy**. All rights reserved.
