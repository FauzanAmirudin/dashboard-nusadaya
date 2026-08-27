# Bagian 1: Arsitektur Sistem, Ekosistem Teknologi & Struktur Berkas

Dokumen ini merupakan **Bagian 1** dari dokumentasi teknis sistem **Dashboard Nusadaya**, yang membedah arsitektur monorepo, ekosistem teknologi, struktur direktori dan berkas secara menyeluruh, desain skema database terpusat, serta sistem penyimpanan berkas dan worker latar belakang.

---

## 1. Gambaran Umum & Prinsip Arsitektur

Dashboard Nusadaya adalah platform manajemen institusi pendidikan vokasi terintegrasi yang memantau perjalanan mahasiswa dari pendaftaran mahasiswa baru (PMB), perkuliahan akademik, monitoring CRM, bimbingan akademik (PA), keuangan & fee sharing, hingga magang industri dan evaluasi akhir keberangkatan.

Sistem dibangun menggunakan model **Monorepo (Bun Workspaces)** dengan pemisahan tegas antara layer Backend API dan Frontend Web Application:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POSTGRESQL DATABASE                               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (postgres.js Connection Pool)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                  DRIZZLE ORM (apps/api/src/db/schema.ts)                    │
│      • Centralized Schema  • Relational Queries  • Transactions & SQL Builder │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                   BACKEND LAYER (Elysia.js + Bun Runtime)                   │
│  • JWT & Cookie Auth (.derive)   • RBAC Middleware   • File Streaming       │
│  • 2-Tier Cache: L1 (Bun RAM Map <0.1ms) ◄► L2 (Redis Cache 120s)           │
│  • Background Workers (BullMQ/Redis: Backup, Export, PDF, Scheduled)        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (HTTP REST / JSON / FormData)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    API CLIENT (apps/web/src/lib/eden.ts)                    │
│        • Eden Treaty (@elysiajs/eden)  • Auto Bearer Token Injection        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                  FRONTEND CLIENT (Next.js 16 + React 19)                    │
│  • Zustand v5 (Persisted Auth Session)  • TanStack React Query v5 (Server)   │
│  • Business Logic: Status Normalizer (ACC, AMAN, PROSES, BUTUH_PERHATIAN)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                     USER INTERFACE (Presentation Layer)                     │
│  • Tailwind CSS v4  • Shadcn/UI (Radix Primitives)  • Recharts  • Sonner    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Rincian Ekosistem & Stack Teknologi

| Komponen | Teknologi | Keterangan & Peran |
| :--- | :--- | :--- |
| **Monorepo Runtime** | **Bun** | Package manager dan JavaScript/TypeScript runtime ultra-cepat untuk backend dan script build. |
| **Database** | **PostgreSQL** | Database relasional utama untuk seluruh data operasional institusi. |
| **Database ORM** | **Drizzle ORM** (`drizzle-orm/postgres-js`) | ORM type-safe tanpa overhead query generator berat. Mengelola relasi tabel, schema push, dan query SQL. |
| **Caching Layer** | **L1 In-Memory RAM + L2 Redis** | L1 RAM Map instan di memori Bun (<0.1ms) + L2 Redis untuk caching query terdistribusi dan worker queue. |
| **Backend Framework**| **Elysia.js** | Framework modern performa tinggi dengan plugin `@elysiajs/jwt`, `@elysiajs/cors`, `@elysiajs/cookie`, dan `@elysiajs/swagger`. |
| **API Client** | **Eden Treaty** (`@elysiajs/eden`) | Client HTTP yang mewarisi tipe data TypeScript secara otomatis dari backend (`App`). |
| **Frontend Framework**| **Next.js 16 (App Router)** + **React 19** | Rendering komponen dinamis berbasis client-side (`"use client"`). |
| **State Management** | **Zustand v5** + **TanStack React Query v5**| Zustand untuk persisted session (token, user), React Query untuk caching data server, pagination buffer, dan deduplikasi request. |
| **UI Components** | **Shadcn/UI** + **Tailwind CSS v4** | Komponen UI atomik berbasis Radix UI (Table, Dialog, Tabs, Select, Badge, Card, Progress). |
| **Notifikasi & Toast**| **Sonner** | Feedback interaktif non-blocking (`toast.success`, `toast.error`). |
| **Visualisasi Data** | **Recharts** | Rendering grafik performa mahasiswa, statistik keuangan, dan rekapitulasi divisi. |
| **Linter / Formatter**| **Biome** | Tooling linting dan pemformatan kode cepat terpusat (`biome.json`). |

---

## 3. Struktur Direktori & Berkas Lengkap

Berikut adalah pemetaan seluruh berkas dan direktori dalam workspace:

```
dashboard-nusadaya/
├── apps/
│   ├── api/                          # BACKEND SERVICE (Elysia.js + Bun)
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── index.ts          # Inisialisasi pool koneksi Drizzle & auto schema migration
│   │   │   │   └── schema.ts         # Definisi seluruh tabel PostgreSQL, Enum, dan Relasi (Terpusat)
│   │   │   ├── lib/
│   │   │   │   ├── cache.ts          # L1 In-Memory + L2 Redis Cache Manager & Invalidation Logic
│   │   │   │   ├── permissions.ts    # RBAC Permission Matrix & helper hasRole()
│   │   │   │   ├── redis.ts          # Inisialisasi koneksi Redis client
│   │   │   │   └── storage.ts        # Helper manipulasi path direktori berkas lokal
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # Middleware verifikasi token JWT
│   │   │   │   └── rbac.ts           # Route guard berbasis role pengguna
│   │   │   ├── modules/
│   │   │   │   ├── backup/           # Modul pencadangan data (database dump & compression)
│   │   │   │   ├── export/           # Modul ekspor arsip mahasiswa & laporan ZIP
│   │   │   │   └── file/             # Modul manajemen berkas (upload, MIME check, streaming download)
│   │   │   ├── routes/
│   │   │   │   ├── student/          # Modul spesifik mahasiswa
│   │   │   │   │   ├── index.ts      # Aggregator sub-router mahasiswa
│   │   │   │   │   ├── core.ts       # CRUD utama mahasiswa, pagination query, dan join 6 panel
│   │   │   │   │   ├── pmb.ts        # Endpoint panel PMB (akuisisi, berkas, skema biaya, referral)
│   │   │   │   │   ├── finance.ts    # Endpoint panel Finance (semester, cicilan, fee sharing)
│   │   │   │   │   ├── academic.ts   # Endpoint panel Akademik (nilai mata kuliah, attitude, absensi)
│   │   │   │   │   ├── crm.ts        # Endpoint panel CRM (monitoring orang tua & industri, ODS)
│   │   │   │   │   ├── pa.ts         # Endpoint panel Pembimbing Akademik (konseling, tripartite, vocab)
│   │   │   │   │   ├── internship.ts # Endpoint panel Magang (dokumen visa, paspor, LoA, kontrak)
│   │   │   │   │   ├── status.ts     # Endpoint kalkulasi agregat status progress mahasiswa
│   │   │   │   │   ├── documents.ts  # Endpoint upload/download berkas generik per panel
│   │   │   │   │   ├── internal-notes.ts # Endpoint catatan internal antar divisi
│   │   │   │   │   └── final-decision.ts # Endpoint evaluasi akhir keberangkatan magang
│   │   │   │   ├── dashboard.ts      # Endpoint statistik agregat dashboard utama
│   │   │   │   ├── courses.ts        # Master data kurikulum & mata kuliah
│   │   │   │   ├── attendance.ts     # Presensi harian, piket, dan perkuliahan
│   │   │   │   ├── scheduling.ts     # Penjadwalan kelas dan ujian
│   │   │   │   ├── users.ts          # Manajemen akun staff & hak akses
│   │   │   │   └── health.ts         # Health check endpoint
│   │   │   ├── workers/              # Background Task Handlers
│   │   │   │   ├── backup.worker.ts  # Worker proses backup database berkala
│   │   │   │   ├── export.worker.ts  # Worker generate bundle ekspor ZIP
│   │   │   │   ├── file.worker.ts    # Worker pembersihan file sampah / temporary
│   │   │   │   ├── pdf.worker.ts     # Worker generator dokumen PDF
│   │   │   │   └── scheduled.worker.ts # Cron runner jadwal backup harian
│   │   │   └── index.ts              # Entry point Elysia API, Global Middleware, JWT Derive, & Listen
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # FRONTEND APPLICATION (Next.js 16 + React 19)
│       ├── src/
│       │   ├── app/                  # Next.js App Router (Halaman & Rute)
│       │   │   ├── (auth)/login/     # Halaman login staff & mahasiswa
│       │   │   ├── dashboard/        # Area dashboard terproteksi
│       │   │   │   ├── page.tsx      # Dashboard ringkasan eksekutif (KPI, chart, log aktivitas)
│       │   │   │   ├── students/     # Manajemen data seluruh mahasiswa (Tabel Utama)
│       │   │   │   │   ├── page.tsx  # Halaman tabel mahasiswa (Filter, Search, Status Badges)
│       │   │   │   │   └── [id]/     # Halaman detail & multi-panel mahasiswa
│       │   │   │   ├── pmb/          # Dashboard khusus divisi PMB
│       │   │   │   ├── finance/      # Dashboard khusus divisi Keuangan
│       │   │   │   ├── crm/          # Dashboard khusus divisi CRM
│       │   │   │   ├── akademik/     # Dashboard khusus divisi Akademik
│       │   │   │   ├── pa/           # Dashboard khusus Pembimbing Akademik
│       │   │   │   ├── magang/       # Dashboard khusus divisi Penempatan Magang
│       │   │   │   ├── evaluator/    # Dashboard penentu kelayakan keberangkatan
│       │   │   │   ├── kehadiran/    # Dashboard monitoring presensi
│       │   │   │   ├── mata-kuliah/  # Manajemen mata kuliah
│       │   │   │   ├── penjadwalan/  # Manajemen jadwal kuliah
│       │   │   │   └── users/        # Manajemen akun user (Superadmin)
│       │   │   ├── form/             # Formulir pendaftaran mahasiswa baru (Publik)
│       │   │   ├── layout.tsx        # Root HTML Layout & Font Setup
│       │   │   └── globals.css       # Konfigurasi Tailwind CSS v4 & Theme Variables
│       │   ├── components/
│       │   │   ├── ui/               # Komponen Atomik Shadcn/UI (Button, Table, Card, Dialog, dll.)
│       │   │   │   ├── DocumentUpload.tsx   # Reusable PDF uploader & viewer streaming
│       │   │   │   ├── PanelStatusBadge.tsx # Badge status warna (ACC, AMAN, PROSES, BUTUH_PERHATIAN)
│       │   │   │   ├── TablePagination.tsx  # Kontrol paginasi tabel data
│       │   │   │   └── ...
│       │   │   ├── panels/           # Komponen Panel Tab Detail Mahasiswa
│       │   │   │   ├── StatusPanel.tsx      # Tab ringkasan indikator keseluruhan
│       │   │   │   ├── PmbPanel.tsx         # Container Tab PMB
│       │   │   │   │   └── pmb/             # Sub-tab PMB (Checklist, Skema, Fee Sharing, Rumah Juang)
│       │   │   │   ├── FinancePanel.tsx     # Container Tab Finance
│       │   │   │   │   └── finance/         # Sub-tab Finance (Tagihan Semester, Talangan, Distribusi Fee)
│       │   │   │   ├── AkademikPanel.tsx    # Container Tab Akademik (Transkrip, Sikap, Presensi)
│       │   │   │   ├── CrmPanel.tsx         # Container Tab CRM (Komunikasi Ortu/Industri, Kasus)
│       │   │   │   ├── PaPanel.tsx          # Container Tab PA (Konseling, Catatan Disiplin, Vocab)
│       │   │   │   ├── InternshipPanel.tsx  # Container Tab Magang (Paspor, Visa, LoA, Kontrak)
│       │   │   │   └── FinalDecisionPanel.tsx # Tab Keputusan Keberangkatan Direksi
│       │   │   ├── dashboards/       # Komponen statistik per divisi
│       │   │   └── layout/           # Sidebar, Navbar, Breadcrumb, Theme Switcher
│       │   ├── hooks/
│       │   │   └── useStudentsList.ts# Custom hook React Query untuk fetching data mahasiswa
│       │   ├── lib/
│       │   │   ├── eden.ts           # Inisialisasi Eden Treaty API Client & Token Interceptor
│       │   │   ├── export.ts         # Helper ekspor data tabel ke CSV/Excel
│       │   │   └── utils.ts          # Utility Tailwind Classnames (cn)
│       │   ├── store/
│       │   │   └── index.ts          # Zustand Store (Auth State, User Roles, Token Storage)
│       │   └── utils/
│       │       ├── format.ts         # Helper format Rupiah (IDR), format tanggal, format nomor WhatsApp
│       │       └── status.ts         # Logika kalkulasi status 4 kategori & normalisasi status
│       ├── package.json
│       └── tsconfig.json
│
├── storage/                          # Direktori penyimpanan fisik berkas upload & backup lokal
├── backups/                          # File dump database otomatis
├── biome.json                        # Konfigurasi linter & code formatter (Biome)
├── package.json                      # Workspace Root Configuration
└── README.md
```

---

## 4. Desain Database & Skema Terpusat (Drizzle ORM)

Seluruh definisi skema database PostgreSQL dikonsolidasikan dalam satu berkas tunggal: `apps/api/src/db/schema.ts`.

### 4.1 Entitas Utama Mahasiswa (`students`) & Akun Login (`users`)
- **Tabel `users`**: Menyimpan identitas staff dan mahasiswa, hash password bcrypt/Bun, peran utama (`role`), serta array multi-role (`roles` bertipe `jsonb`).
- **Tabel `students`**: Menyimpan data identitas pribadi mahasiswa (NIM, Nama, Batch, Cohort, Program Studi, Negara Tujuan, Tempat/Tgl Lahir, Alamat lengkap, Status Mahasiswa `aktif`/`cuti`/`keluar`, dan relasi akun `studentUserId`).

### 4.2 Entitas Panel Divisi (Relasi 1-to-1 dengan `students`)
1. **`pmbData` & `pmbPaymentPlan`**: Menyimpan status PMB, 4 checklist awal (KTP, KK, Ijazah, CV), dokumen kesehatan/bahasa, data akuisisi (referral, tim visit, mitra), dan status fasilitas *Rumah Juang*.
2. **`financeData` & `financeSemesters`**: Menyimpan total tagihan pendidikan, biaya pendaftaran, data cicilan per semester (1-6), skema dana talangan, serta pencatatan custom fields biaya tambahan.
3. **`academicData` & `courseGrades`**: Menyimpan IPK, SKS lulus, catatan sikap/attitude, rekap presensi kelas/piket/ODS, serta transkrip nilai mata kuliah.
4. **`crmData` & `crmLogs`**: Menyimpan monitoring orang tua, monitoring industri, log kasus kendala mahasiswa, rekap ODS & pra-magang.
5. **`paData`, `counselingLogs`, `paTripartiteLogs`**: Menyimpan rekam bimbingan konseling, rapat tripartite bersama orang tua, penguasaan kosakata (vocab), dan catatan kedisiplinan.
6. **`internshipData` & `postInternshipDocs`**: Menyimpan 11 checklist berkas pra-paspor, kesiapan paspor, jadwal & hasil interview, konfirmasi LoA, kontrak kerja magang, MCU, serta pengurusan visa.
7. **`finalDecision`**: Menyimpan keputusan akhir evaluator kelayakan berangkat, persetujuan direktur, dan SK keberangkatan.

### 4.3 Entitas Pendukung & Audit
- **`studentParents`**: Data Ayah, Ibu, dan Wali murid (pekerjaan, pendidikan, kontak).
- **`studentHealth`**: Riwayat penyakit, golongan darah, tinggi/berat badan, ukuran seragam.
- **`feeShareRecipients`**: Penerima bagi hasil referral/mitra sponsor beserta invoice PDF.
- **`auditLogs`**: Log audit transaksi yang mencatat setiap aksi (`CREATE_STUDENT`, `UPDATE_STUDENT`, `ACC_PANEL`, dll.), `userId` pelaku, dan snapshot detail perubahan.

---

## 5. Sistem Penyimpanan Berkas & Background Workers

### 5.1 Modul Penyimpanan Berkas (`apps/api/src/modules/file/`)
- Menggunakan database table `files` untuk mencatat metadata: nama asli, nama storage terenkripsi/timestamped, ukuran berkas, MIME type, kategori, panel pemilik, dan relasi `studentId`.
- Berkas fisik disimpan terorganisir di `./storage/uploads/<category>/`.
- Pengunduhan dan *preview* berkas dilakukan via **streaming terotentikasi** di `GET /files/:id/download`, menjamin dokumen sensitif (KTP, Ijazah, Slip Bayar) tidak bisa diakses publik tanpa izin.

### 5.2 Background Workers (`apps/api/src/workers/`)
API menjalankan background workers non-blocking di runtime Bun:
1. **`file.worker.ts`**: Menjalankan pembersihan berkas temporary yang tidak terpakai setiap 1 jam.
2. **`backup.worker.ts`**: Memproses antrean pencadangan basis data PostgreSQL ke folder `./backups/`.
3. **`export.worker.ts`**: Menghasilkan berkas arsip ZIP saat admin mengekspor data batch mahasiswa.
4. **`pdf.worker.ts`**: Memproses pembuatan dokumen PDF dinamis (SK, invoice, form evaluasi).
5. **`scheduled.worker.ts`**: Menjalankan jadwal backup otomatis harian setiap tengah malam (*daily midnight cron*).

---

## 6. Hardening Keamanan: Rate Limiting Login & Auto-Logout Sesi Idle

Untuk melindungi integritas sistem dari serangan brute force dan mencegah kebocoran sesi di perangkat bersama, sistem menerapkan mekanisme proteksi terintegrasi antara backend dan frontend:

### 6.1 Proteksi Brute Force & Rate Limiting Backend (`apps/api/src/lib/auth-rate-limit.ts`)
- **Batas Percobaan Gagal**: Maksimal **7 kali** percobaan gagal dalam jendela 7 menit per kombinasi `(IP + username)`.
- **Lockout Sesi**: Setelah 7 kegagalan berturut-turut, request login ke kombinasi tersebut diblokir instan selama **7 menit (420 detik)** sebelum request mencapai database (memitigasi timing attack dan beban PostgreSQL).
- **Reset Counter**: Counter kegagalan di Redis otomatis dihapus tepat setelah login berhasil.
- **Global IP Rate Limit**: Maksimal 15 request login per menit per IP untuk mencegah credential stuffing / enumerasi username.
- **Audit Logging**: Setiap kegagalan login dan pemicu lockout dicatat ke tabel `audit_logs` (`auth.login_failed`, `auth.lockout_triggered`).

### 6.2 Server-side Session Tracking & Idle Timeout (`apps/api/src/lib/session.ts`)
- **Server Session di Redis**: Setiap login menghasilkan `sessionId` unik yang dicatat di Redis (`session:{sessionId}`) dan disematkan dalam payload JWT.
- **Batas Idle 30 Menit**: Request dengan sesi yang tidak memiliki aktivitas selama > 30 menit (1800 detik) otomatis ditolak dengan kode status 401 dan response code `IDLE_TIMEOUT`.
- **Throttled Activity Touch**: Pembaruan timestamp `lastActivity` di Redis dibatasi maksimal sekali per 10 detik per sesi untuk menjaga efisiensi I/O.
- **Server-side Session Revocation**: Logout manual maupun auto-logout langsung menghapus sesi dari Redis, memastikan token tidak bisa disalahgunakan lagi.

### 6.3 Deteksi Idle & Sinkronisasi Multi-Tab Frontend (`apps/web/src/providers/IdleTimeoutProvider.tsx`)
- **Activity Monitoring**: Mendeteksi event `mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`, dan `visibilitychange`.
- **Warning Countdown Modal**: 2 menit sebelum batas waktu (menit ke-28), muncul modal interaktif dengan timer countdown dan opsi **Tetap Masuk** (merefresh sesi via `POST /auth/touch`) atau **Logout Sekarang**.
- **Multi-Tab Synchronization**: Memanfaatkan `BroadcastChannel` (`nusadaya_session_channel`) dan `storage` event sehingga aktivitas, perpanjangan sesi, atau logout di satu tab langsung tersinkronisasi di seluruh tab browser yang terbuka.

---

> Lanjutkan membaca detail alur data, mekanisme caching, komunikasi API, dan logika bisnis pada **[Bagian 2: Alur Data, Logika Bisnis & Presentasi UI](file:///c:/.PROJECT/dashboard-nusadaya/docs/02-alur-data-dan-logika-bisnis.md)**.

