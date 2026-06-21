# Dashboard Progress Mahasiswa - Nusadaya Academy

Sistem Terpadu Validasi Mahasiswa (Integrated Student Tracking System) untuk Nusadaya Academy. Platform ini dibangun khusus untuk memantau, memvalidasi, dan mengelola progres setiap mahasiswa dari awal masuk hingga siap diberangkatkan magang ke luar negeri melalui 10 pintu validasi/divisi berbeda.

## 🚀 Fitur Utama

- **Role-Based Access Control (RBAC):** Akses khusus yang berbeda untuk 10 peran: `Superadmin`, `Direktur`, `PMB`, `CRM`, `Finance`, `Akademik`, `PA`, `Magang`, `Evaluator`, dan `Dosen`.
- **End-to-End Type Safety:** Sinkronisasi tipe data otomatis antara backend dan frontend menggunakan **Elysia Eden**.
- **Real-Time Monitoring:** Panel ringkasan status progres tiap mahasiswa (Aman, Perlu Perhatian, Tidak Aman).
- **PDF Generator:** Fitur *export* dan *download* data progres mahasiswa ke format dokumen PDF dengan resolusi tinggi.
- **Integrated Storage:** Manajemen unggah dokumen persyaratam magang.

---

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan arsitektur **Monorepo** dengan Bun workspaces, memisahkan logika ke dalam dua sub-proyek utama (`api` dan `web`).

**Backend (API):**
- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [ElysiaJS](https://elysiajs.com/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** PostgreSQL

**Frontend (Web):**
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **API Client:** Elysia Eden
- **PDF Engine:** html-to-image + jsPDF

**Tooling:**
- **Linter/Formatter:** [Biome](https://biomejs.dev/)
- **Deployment:** Docker & Docker Compose

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
Gandakan file pengaturan *environment* pada `apps/api`:
```bash
cp apps/api/.env.example apps/api/.env
```
*(Sesuaikan isi `.env` dengan kredensial database lokal Anda)*.

### 3. Menjalankan Database
Aplikasi ini sudah dilengkapi konfigurasi Docker Compose. Cukup nyalakan service `db`:
```bash
docker-compose up -d
```

### 4. Setup Tabel & Data Dummy
Jalankan migrasi agar struktur tabel Drizzle tersinkronisasi ke PostgreSQL, kemudian masukkan data contoh ke dalam *database*.
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
- *(Untuk divisi lain, samakan username dengan singkatan nama divisi)*
- **Password (Semua Akun):** `password`

---

## 🚢 Panduan Deployment (Production)

Deployment di VPS *(Virtual Private Server)* direkomendasikan menggunakan `docker-compose` penuh.

1. Tarik pembaruan di server: `git pull origin main`
2. Jalankan docker container: `sudo docker compose up -d --build`
3. Push tabel baru ke database via exec: `sudo docker compose exec api bun run db:push`

*(Opsional: Konfigurasi Reverse Proxy Nginx untuk menghubungkan aplikasi dengan Domain via Port 3000)*.

---

## 👨‍💻 Kontributor / Linter
Jika Anda ikut mengembangkan project ini, pastikan sebelum melakukan *commit* menjalankan linter dari Biome untuk merapikan kode:
```bash
bunx biome check --write --unsafe
```
