# UI Plan: Dashboard Overview (Superadmin / Direktur)
# Panel 00 — Master Overview

## Tujuan Panel
Halaman utama setelah login untuk **Superadmin/Direktur**. Menyajikan ringkasan menyeluruh dari seluruh mahasiswa, statistik real-time, dan notifikasi kritis — dalam satu pandangan (bird's eye view).

---

## Akses Role
- ✅ `superadmin` / Direktur

---

## Layout Halaman

```
┌──────────────────────────────────────────────────────────────┐
│  [Selamat datang, Direktur]        [Export Data] [Filter ▼] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Total   │  │  🟢 Aman │  │ 🟡 Perlu │  │ 🔴 Tidak │  │
│  │ Mahasiswa│  │   XXX    │  │Perhatian │  │  Aman    │  │
│  │   XXX    │  │          │  │   XXX    │  │   XXX    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                              │
├───────────────────────────────┬──────────────────────────────┤
│ 📊 Distribusi Status          │ 🚨 Alert Kritis              │
│                               │                              │
│   [Donut Chart]               │  ● Ahmad - Finance Tunggak  │
│   Hijau: 68%                  │  ● Budi - Kehadiran < 70%   │
│   Kuning: 22%                 │  ● Cici - Paspor Belum Ada  │
│   Merah: 10%                  │  ● Dina - Nilai C+ (3 MK)   │
│                               │                              │
├───────────────────────────────┴──────────────────────────────┤
│ Progress Divisi (Completion Rate per Panel)                  │
│                                                              │
│  PMB    ████████████░░░░  75%                               │
│  CRM    ██████████░░░░░░  62%                               │
│  Finance████████████████  95%                               │
│  Akademik███████████░░░░  70%                               │
│  ...                                                         │
├──────────────────────────────────────────────────────────────┤
│ 📋 Tabel Semua Mahasiswa                                     │
│                                                              │
│  [Search...] [Filter Status ▼] [Filter Angkatan ▼]          │
│                                                              │
│  NIM    | Nama       | Status  | PMB | CRM | Finance | ...  │
│  -------|------------|---------|-----|-----|---------|----  │
│  240001 | Ahmad      | 🔴      | ✅  | ✅  | ❌      | ...  │
│  240002 | Budi       | 🟡      | ✅  | ❌  | ✅      | ...  │
│  240003 | Cici       | 🟢      | ✅  | ✅  | ✅      | ...  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Komponen Detail

### 1. Header Halaman
- Greeting: `"Selamat Datang, [Nama Direktur]"` — `text-2xl font-bold`
- Sub-heading: `"Sistem Pemantauan Mahasiswa Nusadaya Academy — Update: [tanggal jam]"` — `text-sm text-muted`
- Tombol **Export Data** (icon `Download`): export ke PDF/Excel (placeholder Sprint 3)
- Dropdown **Filter Angkatan**: `select` dengan opsi angkatan 2023, 2024, dst.

---

### 2. KPI Cards (4 kartu sejajar)

**Setiap kartu:**
```tsx
interface KPICard {
  label: string         // "Total Mahasiswa"
  value: number         // 156
  icon: LucideIcon      // Users
  color: string         // border-left dan icon color
  trend?: string        // "+12 dari bulan lalu"
}
```

**Style:**
- Background: `#FFFFFF`
- Border: `1px solid #E2E8F0`
- Border-left: `4px solid [warna status]` — aksen visual
- Padding: `p-5`
- Nilai: `text-3xl font-bold`
- Trend teks: `text-xs text-green-400` atau `text-red-400`

---

### 3. Distribusi Status — Donut Chart
- **Library:** Recharts atau Chart.js (sudah di Next.js)
- Chart donut 3 segmen: Hijau, Kuning, Merah
- Legenda di bawah chart: warna + label + persentase
- Center text: "XX / YY Mahasiswa Aman"

---

### 4. Alert Kritis
- Card dengan background `rgba(239, 68, 68, 0.08)`, border `1px solid rgba(239, 68, 68, 0.2)`
- Setiap baris alert: ikon merah, nama mahasiswa, dan deskripsi masalah
- Link ke halaman detail mahasiswa
- Tombol "Lihat Semua Peringatan" di bagian bawah card

---

### 5. Progress Bar Divisi
- Setiap baris: label divisi + progress bar + persentase
- Progress bar: background `#E2E8F0`, fill `#0517B0`
- Kode warna fill berubah jika < 50% → merah, 50-80% → kuning, > 80% → hijau

---

### 6. Tabel Mahasiswa (Master Table)

**Kolom:**
| Kolom | Tipe | Keterangan |
|---|---|---|
| NIM | text | Nomor Induk Mahasiswa |
| Nama | text + link | Klik → halaman detail |
| Angkatan | badge | 2023, 2024 |
| Status | color badge | 🟢🟡🔴 |
| PMB | icon ✅/❌/⏳ | |
| CRM | icon ✅/❌/⏳ | |
| Finance | icon ✅/❌/⏳ | |
| Akademik | icon ✅/❌/⏳ | |
| Magang | icon ✅/❌/⏳ | |
| ACC Direktur | badge khusus | `Sudah / Belum` |
| Aksi | button | "Lihat Detail" |

**Fitur Tabel:**
- Search realtime (filter nama/NIM)
- Sort per kolom (klik header)
- Pagination (10/25/50 per halaman)
- Row click → navigasi ke `/dashboard/students/[id]`

**Komponen:** `shadcn/ui Table` dengan custom style

---

## Komponen shadcn/ui
- `Card`
- `Table`, `TableHead`, `TableRow`, `TableCell`
- `Badge`
- `Input` (search)
- `Select` (filter)
- `Button`
- `Progress`

## Route Next.js
- **Path:** `/dashboard` (default setelah login untuk superadmin)
- **Data:** Fetch dari `GET /api/students` (dengan semua divisi join)
