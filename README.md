# OneData Nusadaya Academy — Sistem Informasi Manajemen Terpadu Progres Mahasiswa

[![Bun](https://img.shields.io/badge/Bun-v1.2+-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Next.js](https://img.shields.io/badge/Next.js-15_(App_Router)-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![ElysiaJS](https://img.shields.io/badge/ElysiaJS-v1.4+-black?style=for-the-badge&logo=elysia&logoColor=white)](https://elysiajs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Redis](https://img.shields.io/badge/Redis-Cache_%26_Lock-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**OneData Nusadaya Academy** adalah platform sistem informasi manajemen terintegrasi (*Integrated Student Progress & Internship Tracking Platform*) yang dirancang khusus untuk memonitor, memvalidasi, dan mengelola perjalanan mahasiswa dari hulu ke hilir: mulai dari registrasi calon mahasiswa baru (PMB & CRM), masa perkuliahan akademik dan pembimbingan dosen, penataan skema keuangan dan anggaran, hingga penempatan magang/internship industri ke luar negeri (Taiwan, Malaysia, Timur Tengah, dan Indonesia).

---

## 📑 Daftar Isi

- [Arsitektur & Tech Stack](#-arsitektur--tech-stack)
- [Fitur Utama & Pilar Sistem](#-fitur-utama--pilar-sistem)
- [Struktur Monorepo](#-struktur-monorepo)
- [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
- [Daftar Akun Demo & Matriks RBAC](#-daftar-akun-demo--matriks-rbac)
- [Pengujian & Verifikasi Kualitas Kode](#-pengujian--verifikasi-kualitas-kode)
- [Panduan Deployment (Produksi)](#-panduan-deployment-produksi)
- [Dokumentasi Teknis](#-dokumentasi-teknis)

---

## 🛠️ Arsitektur & Tech Stack

Sistem dibangun menggunakan arsitektur **Monorepo** berbasis Bun workspaces dengan pembagian tugas yang modular dan terisolasi antara backend dan frontend:

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

### 1. Backend (`apps/api`)
- **Runtime:** [Bun](https://bun.sh/) — JavaScript & TypeScript runtime berkinerja tinggi.
- **Framework:** [ElysiaJS](https://elysiajs.com/) — Web framework ultra-cepat dengan validasi skema berbasis TypeBox.
- **ORM & Database:** [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL 16.
- **Caching & Rate Limiting:** [Redis](https://redis.io/) via `ioredis`.
- **Keamanan & Autentikasi:** JSON Web Token (JWT) + Verifikasi OTP 6-Digit (2FA) + Role-Based Access Control (RBAC).
- **Utilitas:** Archiver (ZIP Export Dokumen Massal), Resend (Pengiriman Email OTP), ULID / Nanoid.

### 2. Frontend (`apps/web`)
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router Architecture) & React 19.
- **API Client:** [Elysia Eden Treaty](https://elysiajs.com/eden/overview.html) — Menjamin *end-to-end type safety* otomatis antara API dan Frontend.
- **Desain & UI:** Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), Radix UI Primitives, Lucide Icons, tw-animate-css.
- **State Management & Query:** [Zustand](https://zustand-demo.pmnd.rs/) + [TanStack React Query](https://tanstack.com/query).
- **Visualisasi Data & Interaktivitas:** [Recharts](https://recharts.org/) (Grafik Proyeksi Keuangan & Demografi).
- **Peninjau Dokumen:** `openDocumentReview` Universal Viewer (In-App PDF & Image Preview dengan otentikasi token otomatis).
- **Editor & Export:** [Tiptap](https://tiptap.dev/) Rich Text Editor, jsPDF + html-to-image.

---

## 🌟 Fitur Utama & Pilar Sistem

Sistem ini memfasilitasi 6 pintu evaluasi utama menuju keberangkatan magang mahasiswa, ditambah portal mandiri mahasiswa dan dashboard eksekutif:

### 1. Divisi PMB (Penerimaan Mahasiswa Baru)
- **Formulir Pendaftaran & Validasi 14 Berkas Wajib:** Pengelolaan data pribadi, sekolah asal, wali, pilihan peminatan, serta kelengkapan dokumen pendaftaran.
- **Skema Biaya Pendidikan & DP Registrasi Awal:** Penentuan skema reguler/beasiswa dan nominal uang pangkal (DP) yang terintegrasi secara *two-way sync* dengan modul Finance.
- **Manajemen Fee Sharing Mitra & Referral:** Pencatatan komisi referral/mitra asal siswa dengan pelacakan pencairan bertahap.

### 2. Divisi CRM (Customer Relationship Management)
- **Monitoring Komitmen & Kesiapan:** Pemantauan wawancara orang tua/wali, komitmen studi luar negeri, penguasaan kosakata bahasa asing (Taiwan/Mandarin, Malaysia, Arab/Timur Tengah), dan kesiapan mental industri.
- **Gerbang ACC CRM:** Checklist berkas pra-pembelajaran dan izin studi.

### 3. Divisi Akademik & Dosen
- **Manajemen Kurikulum & Rombel:** Pengaturan paket semester, kurikulum mata kuliah teori vs praktik, pembagian rombongan belajar (rombel), dan alokasi ruangan kuliah.
- **Sistem Presensi Pintar Geofencing:** Presensi kehadiran berbasis GPS dengan radius ketat (Kampus Bandar Lampung) untuk mencegah pemalsuan absensi.
- **Modul Dosen & Pengajuan Anggaran Praktik (Segmen 13):**
  - Khusus mata kuliah praktik: Dosen pengampu dapat mengajukan kebutuhan dan rincian anggaran bahan praktik secara terperinci.
  - Alur persetujuan terintegrasi ke Finance (Wewenang ACC atau Tolak disertai alasan tertulis).
  - Pelaporan rekapitulasi sisa bahan praktik pasca-pelaksanaan kuliah.

### 4. Dosen Pembimbing Akademik (PA)
- **Portal Perwalian & Logbook:** Supervisi perkembangan mahasiswa perwalian, pencatatan logbook pembimbingan, dan evaluasi 6 pilar kualifikasi sebelum memberikan ACC PA.

### 5. Divisi Finance (Standardisasi FIN-01 & FIN-02)
- **Standardisasi 4 Termin Baku:**
  1. *Termin 1 (Registrasi Awal / DP)*: Sinkron otomatis dengan data PMB.
  2. *Termin 2 (Pelunasan Sebelum Kuliah / Semester 1)*: Mendukung skema pelunasan langsung maupun cicilan bulanan fleksibel.
  3. *Termin 3 (Paspor & Medical)*: Sinkronisasi kebutuhan pra-magang.
  4. *Termin 4 (Sebelum Terbang)*: Pelunasan akhir sebelum keberangkatan industri.
- **Cicilan Fleksibel Semester 1:** Penyesuaian jadwal jatuh tempo per bulan, nominal fleksibel, status pembayaran, dan pencegahan input melebihi pagu total biaya pendidikan.
- **Skema Fleksibel Dana Talangan:** Pilihan skema pembayaran talangan (1 Tahap vs 2 Tahap) dan pelacakan pembayaran bertahap talangan.
- **Proyeksi Target & Realisasi Eksekutif (4 Jurusan):** Dashboard visualisasi target keuangan vs realisasi uang masuk per program peminatan (Taiwan, Malaysia, Timur Tengah, dan Indonesia) dengan kalkulasi *real-time*.
- **Pencairan Bertahap Fee Sharing (Multi-Termin):** Fleksibilitas pencairan fee per termin, validasi batas nominal, pengunggahan bukti transfer bank per termin, dan sinkronisasi status ke PMB.
- **Verifikasi Anggaran Praktik:** Menyetujui atau menolak pengajuan dana bahan praktik dosen, mengunggah bukti pencairan/penyerahan dana ke dosen, serta opsi pengembalian status ke Menunggu.
- **Desain Bebas Alert Bawaan Browser:** Seluruh validasi dan aksi destruktif menggunakan custom modal `AlertDialog` yang elegan, konsisten, dan aman dari salah klik.

### 6. Divisi Magang & Hubungan Luar Negeri (Internship)
- **16 Indikator Kelayakan Pra-Paspor/Visa:** Verifikasi berkas legalitas, paspor, medical check-up (MCU), kontrak kerja (Suhan), Letter of Acceptance (LoA), dan visa kerja.
- **Monitoring Penempatan Industri:** Pelacakan status kesiapan tiket penerbangan dan keberangkatan ke negara tujuan.

### 7. Final Decision & Portal Mahasiswa
- **Gatekeeping Keputusan Akhir:** Panel agregasi lintas divisi yang memverifikasi bahwa mahasiswa telah mendapatkan status ACC dari semua pilar wajib sebelum status *Layak Berangkat* atau *Tandatangan Kontrak* diterbitkan.
- **Portal Mandiri Mahasiswa (`/mahasiswa/dashboard`):** Akses transparansi bagi mahasiswa untuk memantau status 6 pintu, jadwal perkuliahan, absensi harian, rincian tagihan keuangan, dan catatan dosen PA.

### 8. Universal Document Reviewer (`openDocumentReview`)
- Antarmuka peninjau berkas in-app terpadu untuk dokumen PDF, gambar JPEG/PNG, bukti transfer bank, hingga laporan bahan praktik dengan penyematan token autentikasi Eden/Bearer secara otomatis.

---

## 📁 Struktur Monorepo

```text
dashboard-nusadaya/
├── apps/
│   ├── api/                              # Backend Service (ElysiaJS & Bun)
│   │   ├── src/
│   │   │   ├── db/                       # Schema Drizzle ORM, Migrasi & Koneksi Database
│   │   │   │   ├── schema/               # Definisi tabel (auth, students, finance, courses, dll)
│   │   │   │   └── index.ts              # Inisialisasi Postgres & Drizzle
│   │   │   ├── routes/                   # Handler API per divisi & resource
│   │   │   │   ├── auth.ts               # Autentikasi, Login, OTP 2FA
│   │   │   │   ├── finance.ts            # Proyeksi keuangan, fee sharing, anggaran praktik
│   │   │   │   ├── courses.ts            # Mata kuliah, rombel, presensi geofencing
│   │   │   │   └── student/              # Endpoint modul spesifik per mahasiswa
│   │   │   ├── middleware/               # RBAC, audit log, rate limiter
│   │   │   └── index.ts                  # Entry point server ElysiaJS
│   │   ├── test/                         # Unit & integration test backend (bun test)
│   │   ├── seed.ts                       # Skrip seeding data awal
│   │   └── package.json
│   │
│   └── web/                              # Frontend Client (Next.js 15 App Router)
│       ├── public/                       # Aset statis & logo
│       ├── src/
│       │   ├── app/                      # App router halaman dashboard & portal
│       │   ├── components/               # Komponen UI modular
│       │   │   ├── dashboards/           # Tampilan dashboard per divisi
│       │   │   ├── panels/               # Komponen panel (PMB, CRM, Finance, Magang, dll)
│       │   │   └── ui/                   # Komponen primitif shadcn/ui & Radix
│       │   ├── hooks/                    # Custom hooks (proyeksi keuangan, query, dll)
│       │   ├── lib/                      # Eden treaty API client, auth helper
│       │   ├── store/                    # Zustand state management
│       │   └── utils/                    # Helper format rupiah, validator, document review
│       ├── __tests__/                    # Unit test frontend logic
│       └── package.json
│
├── docs/                                 # Dokumentasi teknis, arsitektur, dan changelog
├── docker-compose.yml                    # Konfigurasi containerized database & cache
├── package.json                          # Root monorepo configuration
├── biome.json                            # Konfigurasi code formatting & linting
└── README.md                             # Dokumentasi utama proyek
```

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### 1. Persyaratan Sistem (Prerequisites)
Pastikan perangkat Anda telah terpasang:
- **[Bun](https://bun.sh/)** (v1.2.0 atau lebih baru)
- **[Docker & Docker Compose](https://www.docker.com/)**
- **Git**

### 2. Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/FauzanAmirudin/dashboard-nusadaya.git
cd dashboard-nusadaya

# Instal seluruh dependensi monorepo
bun install
```

### 3. Konfigurasi Environment Variables
Buat berkas `.env` pada subdirektori backend dan frontend:

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

### 4. Menjalankan Layanan Database & Redis
Jalankan kontainer PostgreSQL dan Redis melalui Docker:
```bash
docker-compose up -d db redis
```

### 5. Migrasi Skema & Seeding Data Awal
Terapkan struktur skema tabel ke database PostgreSQL dan masukkan data akun demo serta mahasiswa awal:
```bash
cd apps/api

# Push skema tabel Drizzle ke PostgreSQL
bun run db:push

# Masukkan akun pengguna, master program, mata kuliah, dan data mahasiswa dummy
bun run seed
```

### 6. Menjalankan Development Server
Kembali ke root direktori dan jalankan kedua aplikasi (API dan Web) secara bersamaan:
```bash
cd ../../
bun run dev
```

Aplikasi siap diakses pada URL berikut:
- **Web Frontend:** [`http://localhost:3000`](http://localhost:3000)
- **API Server:** [`http://localhost:3001`](http://localhost:3001)
- **Dokumentasi Swagger API:** [`http://localhost:3001/swagger`](http://localhost:3001/swagger)

---

## 🔑 Daftar Akun Demo & Matriks RBAC

Sistem mengimplementasikan pengamanan **Role-Based Access Control (RBAC)** dan verifikasi **OTP 2FA**. 

> [!NOTE]
> **Kebijakan Pengujian Akun Demo:**
> - Semua akun demo menggunakan password default: **`password`**.
> - Anda dapat login menggunakan **Username** atau **Email terdaftar**.
> - Selama tahap pengujian/development, kode OTP 6-digit otomatis dikirimkan ke email terdaftar **dan** ditampilkan langsung di bawah input formulir OTP untuk mempercepat pengujian.

### 1. Akun Divisi Operasional & Manajemen
| Divisi / Peran | Username | Email Login | Password | Cakupan Hak Akses Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Superadmin** | `superadmin` | `onedatanusadaya@gmail.com` | `password` | Akses penuh seluruh modul, manajemen pengguna, konfigurasi global, audit log, dan backup. |
| **Divisi PMB** | `pmb` | `pmb@nusadaya.ac.id` | `password` | Manajemen calon mahasiswa baru, 14 berkas pendaftaran, formulir PMB, dan ACC PMB. |
| **Divisi CRM** | `crm` | `crm@nusadaya.ac.id` | `password` | Validasi komitmen wali, kosakata asing, izin studi, kesiapan industri, dan ACC CRM. |
| **Divisi Finance** | `finance` | `finance@nusadaya.ac.id` | `password` | Billing 4 termin (FIN-02), cicilan semester 1, dana talangan, fee sharing, ACC anggaran praktik, dan ACC Finance. |
| **Divisi Akademik** | `akademik` | `akademik@nusadaya.ac.id` | `password` | Kurikulum, rombel, ruangan, presensi geofencing, asesmen pilar, rekap sisa bahan, dan ACC Akademik. |
| **Tim Magang** | `magang` | `magang@nusadaya.ac.id` | `password` | 16 berkas pra-paspor/visa, kesiapan LoL/LoA, kontrak suhan, penempatan industri luar negeri, dan ACC Magang. |
| **Koordinator PA** | `pa` | `pa@nusadaya.ac.id` | `password` | Supervisi umum perwalian dan bimbingan akademik mahasiswa. |
| **Dosen Umum** | `dosen` | `dosen@nusadaya.ac.id` | `password` | Akses perkuliahan, absensi kelas, penilaian, dan pengajuan anggaran praktik dosen. |

### 2. Akun Dosen Pembimbing Akademik (PA)
| Username | Nama Lengkap Dosen PA | Email Login | Password | Peran Tambahan |
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
| NIM | Nama Mahasiswa | Username | Email Login | Password | Program / Peminatan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `250001` | Aditya Pratama | `mahasiswa1` | `mhs1@student.nusadaya.ac.id` | `password` | Hospitality (Malaysia) |
| `250002` | Bella Safitri | `mahasiswa2` | `mhs2@student.nusadaya.ac.id` | `password` | Culinary (Taiwan) |
| `250003` | Dimas Anggara | `mahasiswa3` | `mhs3@student.nusadaya.ac.id` | `password` | Barista (Timur Tengah) |
| `250004` | Eka Putri Rahayu | `mahasiswa4` | `mhs4@student.nusadaya.ac.id` | `password` | Front Office (Malaysia) |
| `2500051` | Faris Maulana | `mahasiswa5` | `mhs5@student.nusadaya.ac.id` | `password` | Housekeeping (Taiwan) |
| `250006` | Gita Gutawa | `mahasiswa6` | `mhs6@student.nusadaya.ac.id` | `password` | Hospitality (Indonesia) |

---

## 🧪 Pengujian & Verifikasi Kualitas Kode

Sistem telah dilengkapi dengan pengujian unit otomatis komprehensif pada level logika bisnis backend dan panel frontend:

```bash
# 1. Menjalankan pengujian FIN-02 termin biaya, DP sync, & proyeksi target (Backend)
bun test apps/api/test/fin02_backend_endpoints.test.ts

# 2. Menjalankan pengujian alur pengajuan & persetujuan anggaran praktik dosen (Backend)
bun test apps/api/test/anggaran_praktik_dosen.test.ts

# 3. Menjalankan pengujian logika bisnis panel & validator form (Frontend)
bun test apps/web/src/__tests__/unit/panel-logic.test.ts

# 4. Melakukan audit pengecekan tipe data TypeScript menyeluruh
bunx --cwd apps/web tsc --noEmit
bunx --cwd apps/api tsc --noEmit

# 5. Format & linter kode menggunakan Biome
bunx biome check --write
```

---

## 🚢 Panduan Deployment (Produksi)

Untuk deployment di server produksi atau VPS *(Virtual Private Server)*:

1. **Unduh kode terbaru:**
   ```bash
   git pull origin main
   ```
2. **Build dan jalankan kontainer Docker:**
   ```bash
   docker compose up -d --build
   ```
3. **Migrasi struktur database bila terdapat pembaruan:**
   ```bash
   docker compose exec api bun run db:push
   ```
4. **Konfigurasi Reverse Proxy Nginx & SSL Certbot** untuk memetakan domain ke port `3000` (Frontend) dan port `3001` (API).

---

## 📚 Dokumentasi Teknis

Dokumentasi arsitektur terperinci, alur data tiap divisi, serta catatan rilis lengkap dapat ditemukan pada direktori [`docs/`](docs/):
- [Arsitektur & Struktur Sistem](docs/01-arsitektur-dan-struktur-sistem.md)
- [Alur Data & Logika Bisnis Divisi](docs/02-alur-data-dan-logika-bisnis.md)
- [Changelog Redesign Neumorphism, CRM Sync, & Modul Finance](docs/changelog_25-08-2026_neumorphism_redesign_crm_finance_sync.md)
- [Changelog Optimasi Database, Performa, & Caching Layer](docs/changelog_24-08-2026_refactor_and_optimization_fase1-4.md)

---

&copy; 2026 **OneData Nusadaya Academy**. All rights reserved.
