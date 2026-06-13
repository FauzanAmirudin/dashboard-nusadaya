# UI Plan: Halaman Home (Landing Page)
# Dashboard Progress Mahasiswa Nusadaya Academy

## Tujuan Halaman
Halaman pertama yang dilihat pengunjung sebelum login. Memberikan kesan profesional, terpercaya, dan modern tentang platform **Nusadaya Academy**. Halaman ini berfungsi sebagai **gerbang utama** yang memotivasi admin/staf untuk login.

---

## Design System

### Warna
| Token | Hex | Penggunaan |
|---|---|---|
| `--color-primary` | `#F8FAFF` | Background utama (dark navy) |
| `--color-surface` | `#FFFFFF` | Card/panel background |
| `--color-accent` | `#0517B0` | CTA button, highlight (indigo) |
| `--color-accent-glow` | `#818CF8` | Hover state, glow effect |
| `--color-green` | `#10B981` | Status Aman |
| `--color-yellow` | `#F59E0B` | Status Perlu Perhatian |
| `--color-red` | `#EF4444` | Status Tidak Aman |
| `--color-text-primary` | `#0F172A` | Teks utama |
| `--color-text-muted` | `#94A3B8` | Teks sekunder |
| `--color-border` | `#E2E8F0` | Border card |

### Tipografi
- **Font Family:** `Inter` (dari Google Fonts)
- **Hero Heading:** `text-5xl font-bold` (56px, tracking-tight)
- **Section Heading:** `text-3xl font-semibold` (36px)
- **Body:** `text-base` (16px, line-height: 1.7)
- **Caption/Label:** `text-sm text-muted` (14px)

---

## Layout & Sections

### Section 1: Hero (Full Viewport)
```
┌─────────────────────────────────────────────────────────────┐
│  [NAVBAR]                                                   │
│                                                             │
│  ✦ Sistem Terpadu                                           │
│  Dashboard Progress                                         │
│  Mahasiswa Nusadaya                                         │
│                                                             │
│  Pantau 42 indikator kesiapan mahasiswa dari               │
│  10 divisi dalam satu platform terpusat.                    │
│                                                             │
│  [Masuk ke Dashboard →]   [Pelajari Lebih →]               │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │  1200+  │  │  10     │  │  42     │                    │
│  │Mahasiswa│  │ Divisi  │  │Indikator│                    │
│  └─────────┘  └─────────┘  └─────────┘                    │
│                                                             │
│  [Animated background: subtle particle/grid dark pattern]  │
└─────────────────────────────────────────────────────────────┘
```

**Detail Komponen:**
- Background: Dark gradient (`#F8FAFF` → `#FFFFFF`) + subtle animated mesh grid
- Teks "Dashboard Progress Mahasiswa Nusadaya" dengan gradient text (indigo ke purple)
- Badge kecil "✦ Sistem Terpadu" di atas heading (pill shape, glass effect)
- Tombol CTA utama: solid blue dengan shadow glow `box-shadow: 0 0 24px #0517B040`
- Tombol sekunder: ghost/outline style
- 3 stat counter: angka counter animasi (framer motion / CSS counter)

---

### Section 2: Fitur Utama (Feature Grid)
```
┌─────────────────────────────────────────────────────────────┐
│                    Kenapa Nusadaya Dashboard?               │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ 🎯 Terpusat│  │ ⚡ Real-time│  │ 🔒 Aman    │           │
│  │            │  │            │  │            │           │
│  │Single      │  │Update data │  │RBAC ketat  │           │
│  │source of   │  │langsung    │  │per divisi  │           │
│  │truth dari  │  │tanpa delay │  │            │           │
│  │10 divisi   │  │            │  │            │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ 🌈 Indikator│ │ 📋 Audit   │  │ ✅ Approval │           │
│  │   Warna    │  │   Trail    │  │  Digital   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**Detail Komponen:**
- Grid 3×2 dengan card glassmorphism (`backdrop-filter: blur(12px)`, border `1px solid rgba(255,255,255,0.08)`)
- Setiap card: ikon emoji/lucide, heading bold, deskripsi singkat
- Hover state: card terangkat (`transform: translateY(-4px)`), border glow indigo

---

### Section 3: Preview Dashboard (Screenshot Mockup)
```
┌─────────────────────────────────────────────────────────────┐
│  ← Lihat Bagaimana Platform Bekerja →                      │
│                                                             │
│  [Gambar/Mockup UI dashboard dengan overlay blur]          │
│  [Tooltip kecil menunjuk ke elemen: "42 Indikator",        │
│   "Status Warna", "Approval Digital"]                       │
└─────────────────────────────────────────────────────────────┘
```

---

### Section 4: Alur Kerja (Process Steps)
```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5
 PMB      Paralel   Akademik  Magang   Direktur
Input     Proses    Validasi  Ready     ACC
```
Horizontal step indicator dengan garis konektor, setiap step memiliki nomor dalam lingkaran indigo.

---

### Section 5: CTA Footer Section
```
┌─────────────────────────────────────────────────────────────┐
│        Siap Digitalisasi Proses Validasi Mahasiswa?        │
│                                                             │
│   [Masuk ke Dashboard →]                                   │
└─────────────────────────────────────────────────────────────┘
```
Background: gradient indigo gelap dengan subtle glow radial.

---

## Animasi & Micro-interactions
- Hero text: fade-in + slide-up (staggered per baris, 150ms delay)
- Stat counter: count-up animation dari 0 ke nilai target saat masuk viewport
- Feature cards: fade-in stagger saat scroll (`IntersectionObserver`)
- CTA button: pulse glow saat idle, scale-up saat hover

## Komponen yang Dibutuhkan (shadcn/ui)
- `Button` (primary & ghost)
- `Badge` (untuk label "Sistem Terpadu")
- `Card` (untuk feature grid)

## Route Next.js
- **Path:** `/` → me-render halaman ini jika user **belum login**
- Jika sudah login, redirect ke `/dashboard`
