# UI Plan: Panel PA (Pendamping Akademik)
# Panel 06 dari 10

## Tujuan Panel
Admin PA (Pendamping Akademik) adalah konselor yang memonitor kondisi mental, progress vocabulary, dan kedisiplinan harian mahasiswa. Panel ini bersifat kualitatif dan naratif.

---

## Akses Role
- ✅ `pa` — Edit penuh
- ✅ `superadmin` — Read-only
- ❌ Role lain — Tidak tampil

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  🤝 PA — Pendamping Akademik                [🟢 AMAN 3/3]  │
│  Dikelola oleh: Admin PA  |  PA Pendamping: Ibu Rini        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CHECKLIST PA                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✅  Sesi Konseling (min. 3 sesi)                 ✅  │  │
│  │     3 sesi telah terlaksana                          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Kondisi Mental Stabil                        ✅  │  │
│  │     Tidak ada indikasi masalah psikologis            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Kedisiplinan Baik                            ✅  │  │
│  │     Tidak ada catatan pelanggaran disiplin           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  SETORAN VOCABULARY                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Target: 500 kata        Tercapai: 420 kata          │  │
│  │  ████████████████░░░░░░░  84%                        │  │
│  │                                                      │  │
│  │  [+ Update Setoran Vocabulary]                       │  │
│  │                                                      │  │
│  │  Riwayat Setoran:                                    │  │
│  │  ● 08 Jun 2026 — 50 kata (Total: 420)               │  │
│  │  ● 01 Jun 2026 — 80 kata (Total: 370)               │  │
│  │  ● 25 Mei 2026 — 60 kata (Total: 290)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  LOG SESI KONSELING                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Sesi #3 — 07 Jun 2026                              │  │
│  │  "Mahasiswa menunjukkan semangat tinggi dan tidak    │  │
│  │  ada indikasi kecemasan terhadap program magang"     │  │
│  │  Status kondisi: 🟢 Stabil                          │  │
│  │                                                      │  │
│  │  Sesi #2 — 30 Mei 2026                              │  │
│  │  "Sedikit cemas tentang program bahasa, sudah        │  │
│  │  diberikan motivasi dan target kosakata"             │  │
│  │  Status kondisi: 🟡 Perlu Perhatian                 │  │
│  │                                                      │  │
│  │  [+ Tambah Log Sesi Konseling]                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  CATATAN KEDISIPLINAN                                       │
│  [Textarea: catatan pelanggaran atau penghargaan]          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ✅ ACC PA — Rini Wulandari · 08 Jun 2026, 11:00 WIB       │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Checklist PA (3 item)
1. Sesi Konseling (minimal 3 sesi tercapai) — *semi-auto dari jumlah log konseling*
2. Kondisi Mental Stabil
3. Kedisiplinan Baik

**Item ke-1 (Sesi Konseling) semi-auto:**
- Dihitung dari jumlah log konseling yang tersimpan
- Jika ≥ 3 log → otomatis ✅
- Admin PA tetap bisa override secara manual jika ada sesi tatap muka non-digital

---

### Setoran Vocabulary

**Widget progress:**
- Target (default: 500 kata) — bisa diatur oleh PA
- Tercapai: total dari semua riwayat setoran
- Progress bar dengan warna: ≥ 80% hijau, 50-79% kuning, < 50% merah
- Persentase teks di kanan

**Form tambah setoran:**
```
┌─────────────────────────────────────────────────────────┐
│  Jumlah kata baru:  [___]                               │
│  Tanggal setoran:   [DD/MM/YYYY]                        │
│  Catatan:           [opsional...]                       │
│                                         [+ Tambah]     │
└─────────────────────────────────────────────────────────┘
```

**Riwayat setoran:**
- Timeline list dengan tanggal, jumlah kata, dan total kumulatif
- Maksimal 5 tampil, tombol "Lihat Semua"

---

### Log Sesi Konseling

**Form tambah sesi:**
```
┌─────────────────────────────────────────────────────────┐
│  Tanggal sesi:  [DD/MM/YYYY]                            │
│  Catatan sesi:  [Textarea...]                           │
│  Kondisi:       [Stabil / Perlu Perhatian / Kritis]     │
│                                         [Simpan Sesi]  │
└─────────────────────────────────────────────────────────┘
```

**Tampilan setiap sesi:**
- Nomor sesi, tanggal
- Teks catatan (dipotong 150 karakter, ada tombol "Baca Selengkapnya")
- Badge kondisi: 🟢 Stabil / 🟡 Perlu Perhatian / 🔴 Kritis

---

### Catatan Kedisiplinan

`Textarea` bebas untuk mencatat pelanggaran atau penghargaan kedisiplinan. Tersimpan dengan timestamp.

---

## Data yang Di-fetch
- `GET /api/students/:id/pa` → 3 checklist + setoran vocabulary + log konseling + ACC

## Data yang Di-submit
- `PATCH /api/students/:id/pa` → update checklist
- `POST /api/students/:id/pa/vocabulary` → tambah setoran
- `POST /api/students/:id/pa/counseling` → tambah log sesi
- `POST /api/students/:id/pa/acc` → ACC PA

---

## Komponen shadcn/ui
- `Card`, `CardHeader`, `CardContent`
- `Checkbox`
- `Badge`
- `Progress`
- `Input`, `Textarea`
- `Button`
- `AlertDialog`
- `ScrollArea` (log riwayat)
- `Select` (kondisi mental)
