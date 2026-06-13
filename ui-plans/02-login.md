# UI Plan: Halaman Login
# Dashboard Progress Mahasiswa Nusadaya Academy

## Tujuan Halaman
Pintu masuk aman untuk semua 9 role pengguna. Desain harus meyakinkan, clean, dan fokus — tanpa gangguan visual. Satu-satunya aksi di halaman ini adalah **login**.

---

## Layout

### Struktur Halaman
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [Kiri: Ilustrasi / Branding Panel]  │  [Kanan: Form]    │
│                                        │                   │
│   ● Logo Nusadaya Academy             │  Selamat Datang   │
│   ● Tagline                           │  Kembali           │
│   ● Preview visual                    │                   │
│     3 status indicator pills:         │  [Username/Email] │
│     ● Aman                            │  [Password]       │
│     ● Perlu Perhatian                 │  [Login Button]   │
│     ● Tidak Aman                      │                   │
│                                        │  Role yang tersedia│
│                                        │  (hint)           │
└─────────────────────────────────────────────────────────────┘
```

**Responsif:**
- Desktop: 2-kolom (50% / 50%)
- Mobile: 1-kolom, panel branding disembunyikan → hanya form

---

## Panel Kiri (Branding)

### Konten
- **Background:** Gradient gelap `#F8FAFF` → `#FFFFFF` dengan mesh grid animasi tipis
- **Logo:** Teks "Nusadaya Academy" + subtitle "Integrated Student Tracking System"
- **Visual utama:** Mock mini-dashboard card transparan yang menampilkan:
  - Nama mahasiswa contoh (fiktif)
  - 3 pill indicator: 🟢 Aman, 🟡 Perlu Perhatian, 🔴 Tidak Aman
  - Progress bar 42/42 items
- **Footer branding:** `© 2026 Nusadaya Academy. Sistem Internal.`

### Style
```css
background: linear-gradient(135deg, #F8FAFF 0%, #FFFFFF 60%, #F8FAFF 100%);
border-right: 1px solid #E2E8F0;
```

---

## Panel Kanan (Form Login)

### Komponen
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Selamat Datang Kembali          │  │
│  │  Masuk ke akun Anda untuk        │  │
│  │  melanjutkan monitoring.         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Username                               │
│  ┌──────────────────────────────────┐  │
│  │  [👤]  masukkan username...      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Password                               │
│  ┌──────────────────────────────────┐  │
│  │  [🔒]  ●●●●●●●●            [👁️] │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │      Masuk ke Dashboard    [→]   │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ───────────────────────────────────── │
│  Login sebagai:                         │
│  [superadmin] [pmb] [crm] [finance]    │
│  [akademik] [dosen] [pa] [magang]      │
│  [evaluator]                            │
└─────────────────────────────────────────┘
```

### Detail Elemen

**Heading:**
- `h1`: "Selamat Datang Kembali" — `text-2xl font-bold text-slate-100`
- `p`: Sub-heading muted — `text-sm text-slate-500`

**Input Username:**
- Komponen: `shadcn/ui Input`
- Ikon lucide `User` di sisi kiri (prefix icon)
- Focus ring: `ring-2 ring-[#0517B0]500`
- Placeholder: `"superadmin, pmb, akademik..."`

**Input Password:**
- Komponen: `shadcn/ui Input` type password
- Ikon lucide `Lock` di kiri, `Eye`/`EyeOff` di kanan (toggle visibility)

**Tombol Login:**
- Komponen: `shadcn/ui Button` variant `default`
- Full width, height `h-11`
- Background: `#0517B0`, hover: `#04128A`
- Loading state: spinner animasi + teks "Memverifikasi..."
- Ikon `ArrowRight` di kanan

**Role Hint Chips (untuk development/testing):**
- Baris pill kecil clickable yang auto-fill username field
- Style: `text-xs bg-slate-800 text-slate-500 rounded-full px-2 py-1 hover:bg-blue-900`
- Hanya tampil di environment non-production

---

## State & Feedback

| State | Visual |
|---|---|
| Default | Form kosong, tombol normal |
| Loading | Tombol disabled + spinner |
| Error | Alert merah di atas form: "Username atau password salah." |
| Success | Fade-out form → redirect ke `/dashboard` |

**Error Alert:**
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Login Gagal</AlertTitle>
  <AlertDescription>Username atau password tidak valid.</AlertDescription>
</Alert>
```

---

## Animasi
- Panel kiri: fade-in dari kiri (`translateX(-20px)` → `0`, duration 600ms)
- Panel kanan/form: fade-in dari kanan (`translateX(20px)` → `0`, duration 600ms, delay 100ms)
- Input focus: smooth border glow transition `transition: all 200ms ease`
- Tombol hover: scale `1.01` + shadow glow

---

## Aksesibilitas
- Label eksplisit pada setiap input (`htmlFor`)
- `aria-invalid` pada input saat error
- `aria-live="polite"` pada error message container
- Keyboard navigation: Tab → Username → Password → Submit

---

## Komponen shadcn/ui yang Digunakan
- `Input`
- `Button`
- `Alert`, `AlertTitle`, `AlertDescription`
- `Label`

## Route Next.js
- **Path:** `/login`
- **Auth Guard:** Jika sudah login → redirect ke `/dashboard`
