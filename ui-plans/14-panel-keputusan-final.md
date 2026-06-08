# UI Plan: Panel Keputusan Final (Evaluator)
# Panel 09 dari 10

## Tujuan Panel
Evaluator memberikan keputusan teknis final mengenai kelayakan mahasiswa. Ini adalah panel terakhir sebelum persetujuan Direktur. Keputusan dibagi dalam 4 kategori terstruktur.

---

## Akses Role
- ✅ `evaluator` — Edit penuh
- ✅ `superadmin` — Read-only + bisa melihat semua keputusan
- ❌ Role lain — Tidak tampil

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  ⚖️ Keputusan Final — Evaluator              [🟡 MENUNGGU]  │
│  Dikelola oleh: Tim Evaluator                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STATUS SAAT INI                                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Keputusan Aktif:                                   │  │
│  │  🟡  LANJUT INTERVIEW                              │  │
│  │  Ditetapkan: 06 Jun 2026 oleh Tim Evaluator         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  UBAH KEPUTUSAN                                             │
│                                                             │
│  ○  ✅ Lanjut Interview                                    │
│        Mahasiswa diizinkan mengikuti sesi interview         │
│                                                             │
│  ○  ✅ Boleh TTD Kontrak                                   │
│        Mahasiswa diizinkan menandatangani kontrak magang    │
│                                                             │
│  ○  ✅ Layak Berangkat                                     │
│        Mahasiswa dinyatakan layak untuk berangkat           │
│                                                             │
│  ○  ❌ Remedial                                            │
│        Mahasiswa perlu perbaikan sebelum lanjut             │
│                                                             │
│                    [Tetapkan Keputusan →]                  │
│                                                             │
│  RIWAYAT PERUBAHAN KEPUTUSAN                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  08 Jun 2026 — Lanjut Interview → Boleh TTD Kontrak │  │
│  │  06 Jun 2026 — (Awal) → Lanjut Interview            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ALASAN / CATATAN EVALUASI                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  [Textarea: Catatan alasan keputusan evaluator...]  │  │
│  └─────────────────────────────────────────────────────┘  │
│                              [Simpan Catatan]              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⚖️ Keputusan aktif: LANJUT INTERVIEW                       │
│                           [Konfirmasi Keputusan Final →]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Status Banner Keputusan Aktif

Menampilkan keputusan yang sedang aktif saat ini:
```tsx
const keputusanConfig = {
  "lanjut_interview": {
    icon: "🎤",
    label: "Lanjut Interview",
    color: "amber",
    description: "Mahasiswa diizinkan mengikuti sesi interview"
  },
  "ttd_kontrak": {
    icon: "✍️",
    label: "Boleh TTD Kontrak",
    color: "blue",
    description: "Mahasiswa diizinkan menandatangani kontrak"
  },
  "layak_berangkat": {
    icon: "✈️",
    label: "Layak Berangkat",
    color: "green",
    description: "Mahasiswa dinyatakan layak untuk berangkat"
  },
  "remedial": {
    icon: "🔄",
    label: "Remedial",
    color: "red",
    description: "Mahasiswa perlu perbaikan sebelum lanjut"
  }
}
```

---

### Radio Group Keputusan

`shadcn/ui RadioGroup` dengan 4 opsi:

**Setiap opsi radio:**
- Radio button di kiri
- Ikon status + teks keputusan bold
- Deskripsi singkat di bawah
- Background berubah saat dipilih (highlight sesuai warna keputusan)

**Urutan hierarki (berurutan):**
1. Lanjut Interview
2. Boleh TTD Kontrak  
3. Layak Berangkat
4. Remedial

**Catatan:** Keputusan "Remedial" memiliki style visual menonjol berbeda (merah) karena implikasinya signifikan.

---

### Validasi Keputusan

**Aturan bisnis:**
- Evaluator tidak bisa memilih "Layak Berangkat" jika Status Akhir masih 🔴 TIDAK AMAN
- Sistem menampilkan peringatan jika ada inkonsistensi antara Status Akhir dan keputusan

```
⚠️ Perhatian: Status Akhir mahasiswa masih TIDAK AMAN.
Keputusan "Layak Berangkat" tidak disarankan dalam kondisi ini.
Apakah Anda yakin ingin melanjutkan?
```

---

### Konfirmasi Keputusan Final

Dialog konfirmasi ketat sebelum keputusan disimpan:
```
╔══════════════════════════════════════════════╗
║  Konfirmasi Keputusan Final                  ║
║                                              ║
║  Anda akan menetapkan keputusan:             ║
║  "LAYAK BERANGKAT"                           ║
║  untuk: Ahmad Fauzi (NIM: 240001)            ║
║                                              ║
║  Tindakan ini akan tercatat di audit trail.  ║
║                                              ║
║  [Batal]           [Ya, Tetapkan Keputusan]  ║
╚══════════════════════════════════════════════╝
```

---

### Riwayat Perubahan

Timeline riwayat perubahan keputusan:
- Timestamp + nama evaluator + perubahan dari → ke
- Semua tersimpan di audit_logs database

---

## Data yang Di-fetch
- `GET /api/students/:id/final-decision` → keputusan aktif + riwayat + catatan

## Data yang Di-submit
- `PATCH /api/students/:id/final-decision` → update keputusan + catatan

---

## Komponen shadcn/ui
- `Card`
- `RadioGroup`, `RadioGroupItem`
- `Badge`
- `Textarea`
- `Button`
- `AlertDialog` (konfirmasi + peringatan)
- `ScrollArea` (riwayat)
- `Alert` (warning inkonsistensi)
- `Label`
