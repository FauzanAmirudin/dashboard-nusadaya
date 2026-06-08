Bertindaklah sebagai Senior Fullstack TypeScript Developer. Saya membutuhkan bantuan Anda untuk melakukan inisiasi dan _setup_ awal untuk proyek pengembangan **Dashboard Progress Mahasiswa Nusadaya Academy**.

Sistem ini berfungsi sebagai _Integrated Student Tracking System_ yang akan memproses pemantauan dari 10 divisi berbeda ke dalam satu platform terpusat.

Tumpukan teknologi (_tech stack_) wajib yang harus digunakan adalah:

- **Runtime & Tooling:** Bun
- **Backend (API):** ElysiaJS + Eden (Elysia Client)
- **Database & ORM:** PostgreSQL + Drizzle ORM
- **Caching:** Redis
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Zustand

Mengingat tenggat waktu _Sprint_ 1 yang sangat singkat untuk menyelesaikan struktur _database_ dan _modul login_ 10 _role_, tolong berikan panduan _setup_ dengan urutan berikut:

### 1. Perintah CLI (Terminal)

Berikan perintah `bun` yang tepat untuk menginisiasi proyek _frontend_ dan _backend_. Saya lebih memilih arsitektur _monorepo_ sederhana menggunakan _workspace_ Bun jika memungkinkan, atau pisahkan dalam dua direktori jika itu lebih aman dan cepat.

### 2. Struktur Folder Standar Industri

Berikan rekomendasi struktur direktori untuk _backend_ (Elysia) dan _frontend_ (Next.js). Pastikan struktur _backend_ memfasilitasi pemisahan _routing_ dan logika untuk 10 modul divisi yang berbeda agar kode tetap rapi.

### 3. Boilerplate Backend (Elysia + Drizzle)

Berikan contoh kode awal (file `index.ts` atau `setup.ts`) untuk membangun server dasar ElysiaJS yang terhubung dengan PostgreSQL menggunakan Drizzle ORM.

### 4. Boilerplate Frontend (Next.js + Eden)

Berikan contoh kode bagaimana mengonfigurasi klien Eden di Next.js agar _frontend_ dapat memproses dan mengenali tipe data dari API ElysiaJS secara otomatis (_end-to-end type safety_).

> **Catatan Tambahan untuk AI:** Tolong berikan kode yang efisien, aman, dan tanpa penjelasan yang bertele-tele. Fokus pada perintah teknis dan _script_ inisiasi yang siap pakai.
