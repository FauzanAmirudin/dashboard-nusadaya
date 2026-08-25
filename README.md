# Dashboard Progress Mahasiswa - Nusadaya Academy

Sistem Terpadu Validasi Mahasiswa (Integrated Student Tracking System) untuk Nusadaya Academy. Platform ini dibangun khusus untuk memantau, memvalidasi, dan mengelola progres setiap mahasiswa dari awal masuk hingga siap diberangkatkan magang ke luar negeri melalui 10 pintu validasi/divisi berbeda.

## 🚀 Fitur Utama

- **Role-Based Access Control (RBAC):** Akses khusus yang berbeda untuk 10 peran: `Superadmin`, `Direktur`, `PMB`, `CRM`, `Finance`, `Akademik`, `PA`, `Magang`, `Evaluator`, dan `Dosen`.
- **End-to-End Type Safety:** Sinkronisasi tipe data otomatis antara backend dan frontend menggunakan **Elysia Eden**.
- **Real-Time Monitoring:** Panel ringkasan status progres tiap mahasiswa (Aman, Perlu Perhatian, Tidak Aman).
- **Interactive Data Visualization:** Grafik dan metrik analitik dashboard yang interaktif terintegrasi dengan Recharts.
- **Modern UI & Rich Text Editing:** Pengalaman pengguna modern dengan dukungan Dark/Light mode, animasi, toast notifications (Sonner), dan editor teks kaya (Tiptap).
- **PDF Generator:** Fitur _export_ dan _download_ data progres mahasiswa ke format dokumen PDF dengan resolusi tinggi.
- **Bulk Document Export & Backup (.ZIP):** Pengunduhan banyak dokumen sekaligus dan sistem _backup/recovery_ data terpadu menggunakan kompresi ZIP.
- **Centralized Storage & Caching:** Manajemen file persisten yang lebih aman dan optimasi performa _backend_ dengan integrasi **Redis**.

---

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan arsitektur **Monorepo** dengan Bun workspaces, memisahkan logika ke dalam dua sub-proyek utama (`api` dan `web`).

**Backend (API):**

- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [ElysiaJS](https://elysiajs.com/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** PostgreSQL
- **Caching & Queue:** [Redis](https://redis.io/) (via ioredis)
- **Utilities:** Archiver (ZIP Generator), ULID

**Frontend (Web):**

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/)
- **UI & Animation:** next-themes (Dark Mode), tw-animate-css, Sonner (Toast)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **API Client:** Elysia Eden
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Rich Text Editor:** [Tiptap](https://tiptap.dev/)
- **PDF Engine:** html-to-image + jsPDF

**Tooling:**

- **Linter/Formatter:** [Biome](https://biomejs.dev/) & ESLint
- **Deployment:** Docker & Docker Compose (dengan Persistent Volumes)

---

## 📁 Struktur Folder

```text
dashboard-nusadaya/
├── apps/
│   ├── api/                 # Aplikasi Backend (ElysiaJS)
│   │   ├── src/
│   │   │   ├── db/          # Konfigurasi Drizzle & Schema Database
│   │   │   ├── routes/      # Endpoint API per divisi
│   │   │   └── index.ts     # Entry point server
│   │   ├── uploads/         # Direktori penyimpanan file unggahan
│   │   └── seed.ts          # Skrip pengisian data dummy awal
│   │
│   └── web/                 # Aplikasi Frontend (Next.js)
│       ├── public/          # Aset statis (Logo, Icon, dll)
│       └── src/
│           ├── app/         # Pages & Routing App Router
│           ├── components/  # Reusable UI & Layout Components
│           ├── lib/         # Utility functions (Eden, export, dll)
│           └── store/       # Zustand store (State management)
│
├── package.json             # Root monorepo configuration
├── docker-compose.yml       # Konfigurasi containerized deployment
├── biome.json               # Konfigurasi linter Biome
└── README.md
```

---

## ⚙️ Persyaratan Sistem (Prerequisites)

Sebelum menjalankan aplikasi di mesin lokal, pastikan Anda telah menginstal:

- **[Bun](https://bun.sh/):** `curl -fsSL https://bun.sh/install | bash`
- **[Docker](https://www.docker.com/):** (Sangat disarankan untuk kemudahan instalasi Database dan Deployment)
- **Git**

---

## 💻 Cara Instalasi & Menjalankan (Local Development)

### 1. Kloning Repositori & Instal Dependensi

```bash
git clone https://github.com/USERNAME/dashboard-nusadaya.git
cd dashboard-nusadaya

# Instal semua dependensi untuk monorepo
bun install
```

### 2. Konfigurasi Environment Variables

Gandakan file pengaturan _environment_ pada `apps/api`:

```bash
cp apps/api/.env.example apps/api/.env
```

_(Sesuaikan isi `.env` dengan kredensial database lokal Anda)_.

### 3. Menjalankan Layanan Infrastruktur (Database & Redis)

Aplikasi ini sudah dilengkapi konfigurasi Docker Compose untuk PostgreSQL dan Redis. Cukup nyalakan _services_ melalui docker:

```bash
docker-compose up -d db redis
```

_(Catatan: Anda juga bisa menjalankan `docker-compose up -d` tanpa nama service untuk langsung menjalankan seluruh stack termasuk API dan Web via Docker)._

### 4. Setup Tabel & Data Dummy

Jalankan migrasi agar struktur tabel Drizzle tersinkronisasi ke PostgreSQL, kemudian masukkan data contoh ke dalam _database_.

```bash
cd apps/api

# Push struktur skema tabel ke Database
bun run db:push

# Memasukkan Akun Divisi dan Mahasiswa Dummy
bun run seed
```

### 5. Jalankan Development Server

Kembali ke root directory dan jalankan script utama:

```bash
cd ../../
bun run dev
```

Aplikasi siap diakses:

- **Frontend (Web):** `http://localhost:3000`
- **Backend (API Swagger UI):** `http://localhost:3001/swagger`

---

## 🔑 Akun Demo (Testing)

Bila Anda menggunakan `bun run seed`, Anda bisa masuk menggunakan kredensial standar berikut:

- **Superadmin:** `superadmin`
- **Direktur:** `direktur`
- **Divisi PMB:** `pmb`
- _(Untuk divisi lain, samakan username dengan singkatan nama divisi)_
- **Password (Semua Akun):** `password`

---

## 🚢 Panduan Deployment (Production)

Deployment di VPS _(Virtual Private Server)_ direkomendasikan menggunakan `docker-compose` penuh.

1. Tarik pembaruan di server: `git pull origin main`
2. Jalankan docker container: `sudo docker compose up -d --build`
3. Push tabel baru ke database via exec: `sudo docker compose exec api bun run db:push`

_(Opsional: Konfigurasi Reverse Proxy Nginx untuk menghubungkan aplikasi dengan Domain via Port 3000)_.

---

## 👨‍💻 Kontributor / Linter

Jika Anda ikut mengembangkan project ini, pastikan sebelum melakukan _commit_ menjalankan linter dari Biome untuk merapikan kode:

```bash
bunx biome check --write --unsafe
```

---

## 📚 Dokumentasi Teknis & Catatan Perubahan

Dokumentasi arsitektur, alur data bisnis, panduan modul, dan catatan rilis/optimasi terdokumentasi lengkap di direktori `docs/`:

- [Dokumentasi Redesign Neumorphism (Soft UI), Sinkronisasi Real-Time CRM & Standardisasi Modul Finance (25 Agustus 2026)](docs/changelog_25-08-2026_neumorphism_redesign_crm_finance_sync.md)
- [Dokumentasi Refactoring Modular Database, Optimasi Performa Menyeluruh (Fase 1–4), Caching Layer & Security Hardening (24 Agustus 2026)](docs/changelog_24-08-2026_refactor_and_optimization_fase1-4.md)
- [Arsitektur & Struktur Sistem](docs/01-arsitektur-dan-struktur-sistem.md)
- [Alur Data & Logika Bisnis 10 Divisi](docs/02-alur-data-dan-logika-bisnis.md)

