# UI Plan: Panel Dosen per Mata Kuliah
# Panel 05 dari 10

## Tujuan Panel
Dosen menginput data kehadiran, nilai, dan catatan sikap **per mata kuliah** yang mereka ampu. Panel ini bersifat tabular — satu baris per mata kuliah.

---

## Akses Role
- ✅ `dosen` — Edit hanya pada mata kuliah yang diampu
- ✅ `akademik` — Read-only semua MK
- ✅ `superadmin` — Read-only semua MK
- ❌ Role lain — Tidak tampil

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  📚 Dosen — Nilai & Kehadiran per Mata Kuliah  [🟡 4/6 OK] │
│  Dikelola oleh: Dosen Mata Kuliah                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TABEL MATA KULIAH                                          │
│                                                             │
│  Mata Kuliah     │ Kehadiran │ Grade │ Catatan │ Status     │
│  ─────────────── │ ───────── │ ───── │ ─────── │ ────────   │
│  Front Office    │  85%  ✅  │  A    │  Baik   │  🟢       │
│  Housekeeping    │  72%  ✅  │  B+   │  Baik   │  🟢       │
│  Food & Beverage │  65%  🟡  │  B    │  Cukup  │  🟡       │
│  Bahasa Inggris  │  90%  ✅  │  A    │  Baik   │  🟢       │
│  Etika Profesi   │  45%  ❌  │  C+   │  Buruk  │  🔴       │
│  Grooming        │  78%  ✅  │  B+   │  Baik   │  🟢       │
│                                                             │
│  [+ Tambah Mata Kuliah]  (hanya superadmin/akademik)       │
│                                                             │
│  RINGKASAN NILAI                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  GPA Estimasi: 3.25 (B+)                          │   │
│  │  MK Tidak Aman: 1 (Etika Profesi — 45% kehadiran) │   │
│  │  Catatan Buruk: 1                                  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⏳ ACC Dosen belum diberikan                               │
│                                    [✔ ACC DOSEN →]        │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Tabel Mata Kuliah

**Kolom tabel:**
| Kolom | Tipe | Detail |
|---|---|---|
| Mata Kuliah | text | Nama MK |
| Kehadiran | number input + progress | `%`, `>= 70` = ✅ |
| Grade Nilai | select | A, A-, B+, B, B-, C+, C, D, E |
| Catatan Sikap | select | Baik, Cukup, Buruk |
| Status | auto badge | 🟢🟡🔴 (dikalkulasi) |
| Aksi | button | Edit (hanya dosen pengampu) |

**Kalkulasi status per MK:**
```
Kehadiran >= 70% AND Grade >= B AND Catatan = Baik → 🟢 AMAN
Kehadiran >= 60% OR Grade = B- → 🟡 PERLU PERHATIAN
Kehadiran < 60% OR Grade <= C → 🔴 TIDAK AMAN
```

**Edit Mode per Baris:**
- Klik tombol edit (ikon pensil) → baris berubah jadi form inline
- Field kehadiran: `Input number` range 0-100
- Field grade: `Select` dropdown (A, A-, B+, B, B-, C+, C, D, E)
- Field catatan: `Select` dropdown (Baik, Cukup, Buruk)
- Tombol `Simpan` dan `Batal` muncul di akhir baris

**Batasan Akses per Baris:**
- Dosen hanya bisa edit MK yang terassign ke dirinya
- Row MK milik dosen lain → disabled/read-only
- Superadmin/akademik → semua read-only

---

### Baris Tabel — Style Detail

```tsx
// Warna background baris berdasarkan status
const rowBgColor = {
  AMAN: "bg-emerald-950/20 hover:bg-emerald-950/30",
  PERLU_PERHATIAN: "bg-amber-950/20 hover:bg-amber-950/30",
  TIDAK_AMAN: "bg-red-950/20 hover:bg-red-950/30",
}
```

---

### Ringkasan Nilai

Card ringkasan di bawah tabel:
- **GPA Estimasi:** dikalkulasi rata-rata dari semua nilai huruf
- **MK Tidak Aman:** count + list nama MK yang status 🔴
- **MK Catatan Buruk:** count
- Visualisasi mini: bar chart sederhana per MK (opsional fase 2)

---

### Kalkulasi Status Panel Dosen

```
Semua MK = 🟢 → Panel 🟢 AMAN
Ada 1+ MK = 🔴 → Panel 🔴 TIDAK AMAN
Ada MK = 🟡, tidak ada 🔴 → Panel 🟡 PERLU PERHATIAN
```

---

### Tombol ACC Dosen

**Aturan khusus:**
- Dosen hanya bisa ACC pada MK yang ia ampu
- Jika ada lebih dari 1 dosen → masing-masing memberikan ACC per MK
- ACC panel keseluruhan = semua dosen sudah ACC semua MK-nya

---

## Data yang Di-fetch
- `GET /api/students/:id/course-grades` → semua baris MK + nilai + kehadiran

## Data yang Di-submit
- `PATCH /api/students/:id/course-grades/:courseId` → update per MK
- `POST /api/students/:id/course-grades/:courseId/acc` → ACC per MK

---

## Komponen shadcn/ui
- `Table`, `TableHeader`, `TableRow`, `TableCell`
- `Badge`
- `Select`, `SelectItem`
- `Input`
- `Button` (edit, simpan, batal)
- `Card`
- `AlertDialog` (konfirmasi ACC)
- `Tooltip` (info MK tidak aman)
