# UI Plan: Panel Akademik
# Panel 04 dari 10

## Tujuan Panel
Admin Akademik memvalidasi kepatuhan akademik mahasiswa meliputi: input PDDIKTI, kehadiran minimum 70%, nilai UTS/UAS, dan indikator sikap/komunikasi. Panel ini langsung berkaitan dengan kelaikan akademis mahasiswa.

---

## Akses Role
- ✅ `akademik` — Edit penuh
- ✅ `superadmin` — Read-only
- ❌ Role lain — Tidak dapat mengedit

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  🎓 Akademik — Kepatuhan Akademik         [🟡 PERLU PERHATIAN│
│  Dikelola oleh: Admin Akademik                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INDIKATOR KEPATUHAN UTAMA                                  │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   PDDIKTI    │ │  Kehadiran   │ │   Nilai      │       │
│  │   Input      │ │  Kelas       │ │   Rata-rata  │       │
│  │   ✅ Selesai │ │  72% ▲ Aman  │ │  B+ (3.3)    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
│  CHECKLIST AKADEMIK                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✅  Validasi Input PDDIKTI                       ✅  │  │
│  │     Data akademik terdaftar di sistem PDDIKTI        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Kehadiran >= 70%                             ✅  │  │
│  │     Kehadiran kelas: 72% (36 dari 50 pertemuan)      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Nilai UTS Lulus                              ✅  │  │
│  │     Semua mata kuliah UTS ≥ nilai minimum            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⏳  Nilai UAS Lulus                              🟡  │  │
│  │     UAS belum semua selesai (2 MK tersisa)           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Indikator Sikap                              ✅  │  │
│  │     Sikap dan etika dinilai baik oleh PA             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⏳  Penyelesaian Tugas                           🟡  │  │
│  │     Masih ada 3 tugas yang belum dikumpulkan         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Komunikasi Akademik                          ✅  │  │
│  │     Komunikasi mahasiswa dengan dosen aktif           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  DETAIL KEHADIRAN                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Total Pertemuan:  [50  ]                            │  │
│  │  Hadir:            [36  ]                            │  │
│  │  Keterangan Alpha: [____] (catatan izin/alpha)       │  │
│  │  Persentase: ████████████░░░░  72%                   │  │
│  │  Status: 🟢 Aman (>= 70%)                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  CATATAN AKADEMIK                                           │
│  [Textarea catatan khusus dari admin akademik]             │
│                             [Simpan Catatan]               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⏳ Menunggu ACC Akademik (2 item belum selesai)            │
│                                  [✔ ACC AKADEMIK →]        │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Summary Cards (3 indikator utama)

**PDDIKTI Card:**
- Boolean ✅/❌, dicentang admin akademik

**Kehadiran Card:**
- Menampilkan persentase langsung
- Warna dinamis: ≥ 70% → hijau, 60-69% → kuning, < 60% → merah
- Tooltip hover: "Minimal 70% kehadiran untuk lanjut proses"

**Nilai Rata-rata Card:**
- Menampilkan nilai huruf (A, B+, B, C+, dll.) dan angka
- Dikalkulasi dari data Panel Dosen per MK (read-only di sini)

---

### Checklist Akademik (7 item)
1. Validasi Input PDDIKTI
2. Kehadiran ≥ 70% *(auto dari input Hadir/Total)*
3. Nilai UTS Lulus
4. Nilai UAS Lulus
5. Indikator Sikap
6. Penyelesaian Tugas
7. Komunikasi Akademik

**Item ke-2 (Kehadiran) bersifat semi-auto:**
- Dihitung dari input Hadir / Total di bagian Detail Kehadiran
- Jika ≥ 70% → otomatis ✅, jika < 70% → otomatis ❌
- Admin akademik masih bisa input keterangan

---

### Detail Kehadiran

Form input:
- Total Pertemuan: `Input number`
- Hadir: `Input number`
- Persentase: kalkulasi otomatis `(Hadir / Total * 100)`
- Progress bar visual dengan warna dinamis
- Keterangan alpha: `Textarea` untuk mencatat izin/sakit/alpha

---

### Catatan Akademik

`Textarea` bebas untuk admin akademik + tombol simpan.

---

### Tombol ACC Akademik

Dapat di-klik kapan saja oleh admin akademik (tidak ada hard-blocking seperti Finance). Namun sistem akan menampilkan **peringatan** jika masih ada item yang belum ✅:

```
⚠️ Masih ada 2 item yang belum selesai.
Apakah Anda yakin ingin memberikan ACC?
[Batal] [Ya, lanjut ACC]
```

---

## Data yang Di-fetch
- `GET /api/students/:id/academic` → 7 checklist + detail kehadiran + catatan + ACC

## Data yang Di-submit
- `PATCH /api/students/:id/academic` → update checklist + kehadiran
- `POST /api/students/:id/academic/acc` → ACC Akademik

---

## Komponen shadcn/ui
- `Card`
- `Checkbox`
- `Badge`
- `Input`
- `Progress`
- `Textarea`
- `Button`
- `AlertDialog`
- `Alert` (peringatan item belum selesai)
- `Tooltip`
