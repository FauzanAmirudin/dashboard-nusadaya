# UI Plan: Halaman Detail Mahasiswa (Student Profile Page)
# Panel Global — Header Identitas + 10 Panel Modul

## Tujuan Halaman
Halaman inti sistem. Menampilkan **profil lengkap satu mahasiswa** beserta **seluruh 10 panel modul** dalam satu halaman yang ter-scroll secara vertikal. Setiap divisi hanya dapat berinteraksi dengan panel miliknya.

---

## Akses Role
- ✅ Semua role (konten & edit permission berbeda per panel)

---

## Layout Keseluruhan

```
┌──────────────────────────────────────────────────────────────┐
│  ← Kembali ke Daftar                     [Cetak] [Export]   │
├──────────────────────────────────────────────────────────────┤
│  [HEADER IDENTITAS MAHASISWA — Sticky Top]                   │
│  Nama | NIM | Angkatan | Status 🟢                          │
│  [Donut Progress] [42/42 items ✅]                           │
├──────────────────────────────────────────────────────────────┤
│  [Tab Navigation / Anchor Links]                             │
│  PMB | CRM | Finance | Akademik | Dosen | PA | Magang | ... │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Panel PMB]                                                 │
│  [Panel CRM]                                                 │
│  [Panel Finance]                                             │
│  [Panel Akademik]                                            │
│  [Panel Dosen per MK]                                        │
│  [Panel PA]                                                  │
│  [Panel Tim Magang]                                          │
│  [Panel Status Akhir — Auto]                                 │
│  [Panel Keputusan Final]                                     │
│  [Panel Catatan Internal]                                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [FOOTER APPROVAL STAMP — Digital]                           │
│  PMB✅ | CRM✅ | Finance✅ | Akademik✅ | ... | DIREKTUR 🔐  │
└──────────────────────────────────────────────────────────────┘
```

---

## A. Header Identitas Mahasiswa (Sticky / Global)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar Inisial]  Ahmad Fauzi                   🟢 AMAN   │
│                    NIM: 240001 | Angkatan: 2024             │
│                    Program: Hospitality Int'l | HP: 08xxx   │
│  Orang Tua: Bapak Fauzi  |  PA: Ibu Rini                  │
├─────────────────────────────────────────────────────────────┤
│  [Donut Chart kecil]   Selesai: 38  Proses: 3  Belum: 1   │
│  ████████████████░░░░░                    38 / 42 items     │
└─────────────────────────────────────────────────────────────┘
```

**Elemen:**
- **Avatar:** Lingkaran 48px, inisial 2 huruf, background gradient indigo-purple
- **Nama:** `text-xl font-bold text-slate-100`
- **Badge Status:** Pill besar dengan warna dinamis → `🟢 AMAN` / `🟡 PERLU PERHATIAN` / `🔴 TIDAK AMAN`
- **Info grid:** NIM, Angkatan, Program, No HP dalam 2×2 grid label-value
- **Info bawah:** Nama Orang Tua, PA Pendamping, Negara Tujuan, Semester
- **Progress ring:** Donut mini + angka "38/42 items selesai"
- **Progress bar horizontal:** Gradient hijau-kuning-merah

**Sticky behavior:** Header tetap di atas saat scroll (z-index tinggi, backdrop-blur)

---

## B. Tab / Anchor Navigation

```
[PMB] [CRM] [Finance] [Akademik] [Dosen] [PA] [Magang] [Status] [Final] [Catatan]
```

- Sticky di bawah header identitas
- Klik → scroll ke panel yang relevan (smooth scroll)
- Active tab: underline indigo `border-b-2 border-blue-500`
- Setiap tab menampilkan ikon status mini: ✅ ❌ ⏳

---

## C. Struktur Umum Setiap Panel Modul

```
┌─────────────────────────────────────────────────────────────┐
│  [Ikon] [Nama Panel]              [Badge Status: 🟢 AMAN]   │
│  Dikelola oleh: Admin PMB                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Konten spesifik panel — checklist / tabel / form]         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [🕒 Update: 07 Jun 2026 14:30] │
│                              [Tombol ACC {NAMA DIVISI}  →]  │
└─────────────────────────────────────────────────────────────┘
```

**Style setiap panel card:**
```css
.panel-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  scroll-margin-top: 180px;  /* offset sticky header */
}
```

**Tombol ACC:**
- Jika role sesuai dan belum ACC → solid blue `"ACC [Divisi] →"`
- Jika sudah ACC → disabled abu-abu dengan timestamp `"✅ ACC PMB — 07 Jun 2026 14:30"`
- Jika role tidak sesuai → tombol disembunyikan total

---

## D. Footer Approval Stamp (Digital)

```
┌─────────────────────────────────────────────────────────────┐
│  JEJAK PERSETUJUAN DIGITAL                                  │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│ PMB      │ CRM      │ Finance  │ Akademik │ PA             │
│ ✅ Amin  │ ✅ Rini  │ ❌       │ ✅ Budi  │ ⏳ Pending     │
│ 07/06/26 │ 07/06/26 │ Belum    │ 07/06/26 │                │
├──────────┴──────────┴──────────┴──────────┴────────────────┤
│            DOSEN ✅  |  MAGANG ✅  |  EVALUATOR ✅          │
├─────────────────────────────────────────────────────────────┤
│  🔐 ACC DIREKTUR    [Berikan Persetujuan Akhir]             │
│     Tersedia setelah semua 7 divisi memberikan ACC          │
└─────────────────────────────────────────────────────────────┘
```

**Detail:**
- Grid stamp per divisi (7 kolom)
- Setiap stamp: nama divisi, nama admin, tanggal/jam, status visual
- Tombol "ACC Direktur": hanya aktif jika 7/7 divisi sudah ACC
- Tombol Direktur: background emas `#F59E0B`, sangat menonjol

---

## Komponen shadcn/ui
- `Card`, `CardHeader`, `CardContent`
- `Badge`
- `Progress`
- `Tabs`
- `Button`
- `Avatar`
- `Separator`
- `Tooltip` (untuk timestamp stamp)

## Route Next.js
- **Path:** `/dashboard/students/[id]`
- **Data:** `GET /api/students/:id` (dengan semua join data panel)
