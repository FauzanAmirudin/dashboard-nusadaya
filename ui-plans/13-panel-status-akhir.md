# UI Plan: Panel Status Akhir (Auto-calculated)
# Panel 08 dari 10

## Tujuan Panel
Panel ini adalah **ringkasan otomatis** yang menghitung dan menampilkan status dari seluruh 42 indikator di 7 panel sebelumnya. Tidak ada input manual di sini — semua dikalkulasi oleh sistem secara real-time.

---

## Akses Role
- ✅ Semua role — Read-only (tidak ada editing)

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Status Akhir — Kalkulasi Otomatis                        │
│  Terakhir diperbarui: 08 Jun 2026, 15:45 WIB               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              STATUS KESELURUHAN                             │
│                                                             │
│         ╔═══════════════════════════════╗                   │
│         ║                               ║                   │
│         ║    🟡  PERLU PERHATIAN        ║                   │
│         ║                               ║                   │
│         ║    38 / 42 indikator ✅       ║                   │
│         ║    4 indikator belum selesai  ║                   │
│         ╚═══════════════════════════════╝                   │
│                                                             │
│  RINGKASAN PER PANEL                                        │
│                                                             │
│  Panel          │ Selesai │ Total │ Status                  │
│  ─────────────  │ ─────── │ ───── │ ───────                 │
│  PMB            │  4/4    │  4    │ 🟢 Aman                 │
│  CRM            │  5/5    │  5    │ 🟢 Aman                 │
│  Finance        │  3/5    │  5    │ 🔴 Tidak Aman           │
│  Akademik       │  6/7    │  7    │ 🟡 Perlu Perhatian      │
│  Dosen per MK   │  10/12  │  12   │ 🟡 Perlu Perhatian      │
│  PA             │  3/3    │  3    │ 🟢 Aman                 │
│  Tim Magang     │  5/8    │  8    │ 🟡 Perlu Perhatian      │
│  ─────────────  │ ─────── │ ───── │ ───────                 │
│  TOTAL          │  36/44  │  44   │ 🟡 PERLU PERHATIAN      │
│                                                             │
│  INDIKATOR YANG BELUM SELESAI                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  🔴 Finance — Semester Belum Lunas                   │  │
│  │  🔴 Finance — Tunggakan Aktif                        │  │
│  │  🟡 Akademik — Nilai UAS (2 MK tersisa)              │  │
│  │  🟡 Magang — Visa (Sedang diproses)                  │  │
│  │  🟡 Magang — Tiket (Belum dibooking)                 │  │
│  │  🟡 Magang — PDT (Belum terlaksana)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Status Banner Utama

Kotak besar di tengah yang menampilkan status keseluruhan:

```tsx
const statusConfig = {
  AMAN: {
    bg: "bg-emerald-950/40",
    border: "border-emerald-500",
    icon: "🟢",
    label: "AMAN",
    description: "Mahasiswa siap untuk lanjut proses",
    glow: "shadow-emerald-500/20"
  },
  PERLU_PERHATIAN: {
    bg: "bg-amber-950/40",
    border: "border-amber-500",
    icon: "🟡",
    label: "PERLU PERHATIAN",
    description: "Beberapa indikator perlu segera diselesaikan",
    glow: "shadow-amber-500/20"
  },
  TIDAK_AMAN: {
    bg: "bg-red-950/40",
    border: "border-red-500",
    icon: "🔴",
    label: "TIDAK AMAN",
    description: "Ada kendala kritis yang harus diselesaikan",
    glow: "shadow-red-500/20"
  }
}
```

Banner memiliki glow effect `box-shadow` sesuai warna status, animasi subtle pulse pada status 🔴.

---

### Tabel Ringkasan per Panel

Tabel sederhana 4 kolom:
- **Panel** — nama panel dengan ikon
- **Selesai** — `X/Y` format
- **Total** — angka total indikator
- **Status** — badge warna

Row yang status 🔴 mendapat background `red-950/20`.
Row yang status 🟡 mendapat background `amber-950/20`.

---

### Daftar Indikator Belum Selesai

Alert list yang menampilkan semua indikator yang status ❌ atau ⏳:
- Ikon merah untuk ❌ blocking kritis
- Ikon kuning untuk ⏳ sedang diproses
- Link ke panel terkait (klik langsung scroll ke panel PMB/Finance/dll.)
- Tombol "Perbarui" kecil di kanan setiap item

---

### Logika Kalkulasi Status Keseluruhan

```
Jika ada ≥1 indikator 🔴 → Status Akhir = 🔴 TIDAK AMAN
Jika semua ✅ tapi ada ≥1 🟡 → Status Akhir = 🟡 PERLU PERHATIAN
Jika semua 42 indikator ✅ → Status Akhir = 🟢 AMAN & LANJUT PROSES
```

Kalkulasi dilakukan **server-side** dan dikembalikan sebagai field `overallStatus` pada mahasiswa.

---

### Auto-refresh

Panel ini memiliki auto-refresh ringan:
- Polling setiap 30 detik via `useEffect` + `setInterval`
- Atau menggunakan **SWR** / **React Query** dengan `revalidateOnFocus: true`

---

## Data yang Di-fetch
- `GET /api/students/:id/status` → summary per panel + list indikator belum selesai + overall status

## Komponen shadcn/ui
- `Card`
- `Badge`
- `Table`
- `Alert`
- `Separator`
- `Progress`
