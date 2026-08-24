# Dokumentasi Arsitektur & Alur Data Sistem Dashboard Nusadaya

Dokumentasi teknis menyeluruh mengenai sistem **Dashboard Nusadaya** telah dipecah menjadi **dua bagian terstruktur** agar memudahkan navigasi, penelaahan, dan pemeliharaan:

---

## 📑 Daftar Isi Dokumentasi

### 📘 [Bagian 1: Arsitektur Sistem, Ekosistem Teknologi & Struktur Berkas](file:///c:/.PROJECT/dashboard-nusadaya/docs/01-arsitektur-dan-struktur-sistem.md)
Dokumen ini membahas fondasi arsitektur, infrastruktur, dan rancangan basis data:
1. **Gambaran Umum & Prinsip Arsitektur Monorepo** (Bun Workspaces).
2. **Ekosistem & Stack Teknologi Lengkap** (PostgreSQL, Drizzle ORM, Elysia.js, Next.js 16, React 19, Tailwind CSS v4, Shadcn/UI, Recharts).
3. **Struktur Direktori & Berkas Menyeluruh** (Pemetaan seluruh modul API, rute mahasiswa, workers, halaman web, komponen panel, dan utilitas).
4. **Desain Database & Skema Terpusat** (`schema.ts`, relasi tabel 6 panel divisi, entitas mahasiswa, multi-role RBAC, dan audit logs).
5. **Sistem Penyimpanan Berkas & Background Workers** (Modul File Service, antrean pencadangan otomatis, ekspor ZIP, dan PDF generator).

---

### 📗 [Bagian 2: Alur Data, Logika Bisnis & Presentasi UI](file:///c:/.PROJECT/dashboard-nusadaya/docs/02-alur-data-dan-logika-bisnis.md)
Dokumen ini membahas alur kerja operasional data, optimasi performa, dan logika antarmuka:
1. **Alur Pengambilan Data End-to-End (*Data Fetching Flow*)** (Diagram urutan dari Browser $\rightarrow$ React Query $\rightarrow$ Eden Treaty $\rightarrow$ Elysia API $\rightarrow$ Cache $\rightarrow$ Drizzle PostgreSQL).
2. **Mekanisme Caching Dua Lapis (*Two-Tier Cache*)** (L1 In-Memory RAM Bun `<0.1ms` + L2 Redis Cache `120s`, serta strategi invalidasi otomatis).
3. **Komunikasi Client-Server & Kontrak Type-Safe** (Eden Treaty, injeksi token Bearer otomatis, sanitasi URL, dan caching state di TanStack React Query).
4. **Logika Bisnis & Standarisasi Status 4 Kategori** (`ACC`, `AMAN`, `PROSES`, `BUTUH_PERHATIAN`, serta kalkulasi agregat status global).
5. **Alur Siklus Mutasi Data & Invalidation** (Alur Create/Update/Delete, transaksi database atomik, hard delete + file cleanup, audit logging).
6. **Presentasi UI & Komponen Dinamis** (Komponen Client Next.js 16, arsitektur multi-panel modular, streaming dokumen PDF `DocumentUpload`, formatters, dan grafik Recharts).
7. **Rangkuman Best Practices & Pedoman Pengembangan Kode**.

---

*Silakan klik salah satu tautan di atas untuk membaca dokumen bagian yang diinginkan.*
