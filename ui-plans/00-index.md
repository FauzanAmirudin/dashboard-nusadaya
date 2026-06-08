# UI Plan: INDEX — Seluruh Rencana UI
# Dashboard Progress Mahasiswa Nusadaya Academy
# Tech Stack: Next.js + Tailwind CSS + shadcn/ui

---

## Design System Global

### Warna Utama
| Token | Hex | Fungsi |
|---|---|---|
| Primary BG | `#0F172A` | Background halaman utama |
| Surface | `#1E293B` | Card, panel, sidebar |
| Border | `#334155` | Border semua elemen |
| Accent | `#6366F1` | Button CTA, active state, highlight |
| Accent Hover | `#4F46E5` | Hover button |
| Text Primary | `#F1F5F9` | Teks utama |
| Text Muted | `#94A3B8` | Teks sekunder, label |
| **🟢 Aman** | `#10B981` | Status Aman |
| **🟡 Perhatian** | `#F59E0B` | Status Perlu Perhatian |
| **🔴 Tidak Aman** | `#EF4444` | Status Tidak Aman |

### Tipografi
- **Font:** Inter (Google Fonts)
- **Hero/H1:** 56px, font-bold, tracking-tight
- **H2/Section:** 30px, font-semibold
- **H3/Panel Header:** 18px, font-semibold
- **Body:** 14-16px, line-height 1.6
- **Caption/Label:** 12px, text-muted

### Spacing
- **Panel gap:** 16px (`gap-4`)
- **Card padding:** 24px (`p-6`)
- **Section margin:** 32px (`mb-8`)

### Border Radius
- **Card/Panel:** 12px (`rounded-xl`)
- **Button:** 8px (`rounded-lg`)
- **Badge/Pill:** 9999px (`rounded-full`)
- **Input:** 8px (`rounded-lg`)

---

## Daftar File Plan

| No. | File | Halaman/Panel | Prioritas |
|-----|------|---------------|-----------|
| 01 | [01-home-landing.md](./01-home-landing.md) | 🏠 Home (Sebelum Login) | Sprint 2 |
| 02 | [02-login.md](./02-login.md) | 🔐 Halaman Login | Sprint 1 |
| 03 | [03-navbar-sidebar.md](./03-navbar-sidebar.md) | 🗂️ Navbar + Sidebar + Footer | Sprint 1 |
| 04 | [04-dashboard-overview.md](./04-dashboard-overview.md) | 📊 Dashboard Overview (Superadmin) | Sprint 2 |
| 05 | [05-student-detail.md](./05-student-detail.md) | 👤 Halaman Detail Mahasiswa (Shell) | Sprint 2 |
| 06 | [06-panel-pmb.md](./06-panel-pmb.md) | 📋 Panel PMB (4 checklist) | Sprint 2 |
| 07 | [07-panel-crm.md](./07-panel-crm.md) | 📞 Panel CRM (5 checklist + log) | Sprint 2 |
| 08 | [08-panel-finance.md](./08-panel-finance.md) | 💰 Panel Finance (5 item + nominal) | Sprint 2 |
| 09 | [09-panel-akademik.md](./09-panel-akademik.md) | 🎓 Panel Akademik (7 checklist) | Sprint 2 |
| 10 | [10-panel-dosen.md](./10-panel-dosen.md) | 📚 Panel Dosen per MK (tabel) | Sprint 2 |
| 11 | [11-panel-pa.md](./11-panel-pa.md) | 🤝 Panel PA (vocabulary + konseling) | Sprint 2 |
| 12 | [12-panel-magang.md](./12-panel-magang.md) | ✈️ Panel Magang (8 dokumen) | Sprint 2 |
| 13 | [13-panel-status-akhir.md](./13-panel-status-akhir.md) | ⚡ Panel Status Akhir (auto-calc) | Sprint 2 |
| 14 | [14-panel-keputusan-final.md](./14-panel-keputusan-final.md) | ⚖️ Panel Keputusan Final (evaluator) | Sprint 2 |
| 15 | [15-panel-catatan-internal.md](./15-panel-catatan-internal.md) | 📝 Panel Catatan Internal | Sprint 3 |

---

## Routing Map Next.js

```
/                           → Home Landing (jika belum login)
/login                      → Halaman Login
/dashboard                  → Overview Superadmin / Default per role
/dashboard/students         → Daftar Semua Mahasiswa
/dashboard/students/[id]    → Detail Mahasiswa (semua 10 panel)
/dashboard/pmb              → Daftar mahasiswa view PMB
/dashboard/crm              → Daftar mahasiswa view CRM
/dashboard/finance          → Daftar mahasiswa view Finance
/dashboard/akademik         → Daftar mahasiswa view Akademik
/dashboard/dosen            → Daftar mahasiswa + MK view Dosen
/dashboard/pa               → Daftar mahasiswa view PA
/dashboard/magang           → Daftar mahasiswa view Tim Magang
/dashboard/evaluator        → Daftar mahasiswa view Evaluator
```

---

## Komponen Reusable yang Perlu Dibuat

| Komponen | Dipakai di |
|---|---|
| `<StatusBadge status />` | Semua panel (🟢🟡🔴) |
| `<ChecklistItem item onToggle />` | PMB, CRM, Finance, Akademik, PA |
| `<AccButton divisi onAcc />` | Semua panel |
| `<AccStamp divisi timestamp admin />` | Footer detail mahasiswa |
| `<PanelCard title divisi />` | Semua 10 panel |
| `<TimelineLog entries />` | CRM, PA, Catatan Internal |
| `<KPICard label value icon color />` | Dashboard Overview |

---

## Prinsip UX

1. **Zero Konfusion Role** — setiap user hanya melihat panel dan tombol yang relevan dengan role-nya
2. **Optimistic Updates** — checkbox langsung berubah visual sebelum konfirmasi server
3. **Visual Feedback** — loading spinner, success toast, error alert untuk setiap aksi
4. **Audit Transparency** — setiap perubahan statusditampilkan timestamp + nama actor
5. **Mobile Responsive** — semua panel dapat dibaca di tablet/mobile untuk akses lapangan
