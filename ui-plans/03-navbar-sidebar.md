# UI Plan: Navbar & Sidebar (Layout Utama Dashboard)
# Dashboard Progress Mahasiswa Nusadaya Academy

## Tujuan Komponen
Layout permanen yang membungkus semua halaman dashboard. Terdiri dari **Top Navbar** dan **Left Sidebar**. Keduanya harus selalu accessible, informatif, dan tidak memakan banyak ruang layar.

---

## A. Top Navbar

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│ [≡ Sidebar Toggle]  Nusadaya Academy   [🔔 3] [Role Chip] [👤▼]│
└──────────────────────────────────────────────────────────────┘
```

### Elemen

**Kiri:**
- Tombol toggle sidebar (hamburger/X icon, lucide `Menu`)
- Logo teks: "Nusadaya" bold + "Academy" light weight, dengan dot aksen indigo

**Tengah (hanya desktop):**
- Breadcrumb navigasi: `Dashboard > Mahasiswa > Detail` (untuk page tertentu)

**Kanan:**
- **Notification Bell** (`Bell` icon dari lucide): Badge merah dengan angka (jika ada update dari divisi lain)
- **Role Chip:** Pill kecil menampilkan role user yang sedang login, warna sesuai role:
  - `superadmin` → indigo
  - `pmb` → blue
  - `crm` → violet
  - `finance` → green
  - `akademik` → amber
  - `dosen` → orange
  - `pa` → teal
  - `magang` → sky
  - `evaluator` → rose
- **User Avatar Dropdown:**
  - Avatar inisial (dua huruf nama, background indigo)
  - Nama lengkap user
  - Dropdown item: "Profil Saya", "Pengaturan", "---", "Keluar"

### Style
```css
.navbar {
  height: 64px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 50;
}
```

---

## B. Left Sidebar

### Layout
```
┌────────────────┐
│ 🏛️  Nusadaya  │  ← Logo area (collapsed: ikon saja)
├────────────────┤
│ 📊 Dashboard   │  ← Overview (Superadmin)
│ 👥 Mahasiswa   │  ← Daftar mahasiswa
├────────────────┤
│  MODUL         │
│ 📋 PMB         │
│ 📞 CRM         │
│ 💰 Finance     │
│ 🎓 Akademik    │
│ 📚 Dosen       │
│ 🤝 PA          │
│ ✈️ Magang      │
│ ⚖️ Evaluator   │
├────────────────┤
│ ⚙️ Pengaturan  │
│ 🚪 Keluar      │
└────────────────┘
```

### Dua Mode

**Expanded (default desktop):** lebar `240px`, menampilkan ikon + label teks
**Collapsed (mobile/toggle):** lebar `64px`, hanya ikon dengan tooltip pada hover

### Menu Items — Detail

Setiap item sidebar:
```tsx
interface SidebarItem {
  icon: LucideIcon
  label: string
  href: string
  roles: string[]      // hanya tampil jika role user termasuk di sini
  badge?: number       // angka badge notifikasi opsional
}
```

**Daftar Menu & Akses per Role:**
| Menu | Icon (Lucide) | Role yang dapat melihat |
|------|--------------|------------------------|
| Dashboard Overview | `LayoutDashboard` | superadmin |
| Semua Mahasiswa | `Users` | superadmin, akademik, evaluator |
| Panel PMB | `ClipboardList` | superadmin, pmb |
| Panel CRM | `PhoneCall` | superadmin, crm |
| Panel Finance | `Wallet` | superadmin, finance |
| Panel Akademik | `GraduationCap` | superadmin, akademik |
| Panel Dosen | `BookOpen` | superadmin, dosen |
| Panel PA | `HeartHandshake` | superadmin, pa |
| Panel Magang | `Plane` | superadmin, magang |
| Panel Evaluator | `CheckSquare` | superadmin, evaluator |
| Pengaturan | `Settings` | superadmin |
| Keluar | `LogOut` | all |

### Active State
- Item aktif: background `rgba(99, 102, 241, 0.15)`, border-left `3px solid #0517B0`, teks `#A5B4FC`
- Item hover: background `rgba(255,255,255,0.04)`
- Transisi: `transition: all 150ms ease`

### Style
```css
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: #FFFFFF;
  border-right: 1px solid #E2E8F0;
  transition: width 300ms ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #475569;
  padding: 0 16px;
  margin: 16px 0 4px;
}
```

---

## C. Footer (Global)

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│ © 2026 Nusadaya Academy · Sistem Internal · v1.0.0         │
│                                    Last update: 08 Jun 2026 │
└──────────────────────────────────────────────────────────────┘
```

- Background: `#F8FAFF`
- Border-top: `1px solid #FFFFFF`
- Teks: `text-xs text-slate-500`
- Posisi: di bawah konten, `sticky` hanya jika konten pendek

---

## D. Layout Shell (Root)

```tsx
// apps/web/src/app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
```

---

## Responsif

| Breakpoint | Sidebar | Navbar |
|---|---|---|
| Mobile (`< 768px`) | Hidden, drawer overlay saat toggle | Full width |
| Tablet (`768-1024px`) | Collapsed (64px) default | Full width |
| Desktop (`> 1024px`) | Expanded (240px) default | Full width |

---

## Komponen shadcn/ui yang Digunakan
- `Button` (toggle, logout)
- `DropdownMenu` (user avatar dropdown)
- `Tooltip` (sidebar item saat collapsed)
- `Badge` (notifikasi, role chip)
- `Separator` (divider antar section)

## File yang Perlu Dibuat
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Footer.tsx`
- `src/app/dashboard/layout.tsx` ← shell utama
