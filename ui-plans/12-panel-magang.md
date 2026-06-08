# UI Plan: Panel Tim Magang Internasional
# Panel 07 dari 10

## Tujuan Panel
Tim Magang memantau dan mengupdate status kesiapan dokumen keberangkatan mahasiswa ke luar negeri. Panel ini adalah tahap paling operasional — checklist dokumen fisik dan legalitas.

---

## Akses Role
- ✅ `magang` — Edit penuh
- ✅ `superadmin` — Read-only
- ❌ Role lain — Tidak tampil

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  ✈️ Tim Magang Internasional              [🟡 5/8 PROSES]  │
│  Dikelola oleh: Tim Magang               Tujuan: Taiwan     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STATUS DOKUMEN KEBERANGKATAN                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✅  Paspor                                       ✅  │  │
│  │     No. Paspor: A1234567 | Exp: Jan 2030             │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Interview (Lulus)                            ✅  │  │
│  │     Tanggal interview: 15 Mei 2026 — Lulus           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  LoA (Letter of Acceptance)                   ✅  │  │
│  │     Diterima dari: Grand Hyatt Taipei                │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Kontrak Magang (TTD)                         ✅  │  │
│  │     Kontrak ditandatangani: 01 Jun 2026              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  MCU (Medical Check-Up)                       ✅  │  │
│  │     MCU di: RS Siloam | Tanggal: 20 Mei 2026        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⏳  Visa                                         🟡  │  │
│  │     Status: Sedang diproses di kedutaan              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ❌  Tiket Pesawat (PP)                           ❌  │  │
│  │     Belum dibooking                                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ❌  PDT (Pembekalan Pra-Keberangkatan)           ❌  │  │
│  │     Belum dilaksanakan                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  JADWAL KEBERANGKATAN                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Estimasi Keberangkatan:  [01 Agustus 2026]          │  │
│  │  Kota Tujuan:             Taipei, Taiwan              │  │
│  │  Durasi Magang:           6 Bulan                    │  │
│  │  Hotel/Perusahaan:        Grand Hyatt Taipei          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  CATATAN TIM MAGANG                                         │
│  [Textarea: kendala dokumen, jadwal menyusul, dll...]      │
│                                [Simpan Catatan]            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⏳ ACC Tim Magang — Menunggu 3 dokumen tersisa             │
│                              [✔ ACC TIM MAGANG →]         │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Checklist Dokumen (8 item)

Setiap item memiliki field tambahan yang muncul **setelah dicentang**:

**1. Paspor:**
```
Nomor Paspor: [__________]
Tanggal Kadaluarsa: [DD/MM/YYYY]
```

**2. Interview:**
```
Tanggal Interview: [DD/MM/YYYY]
Hasil: [Lulus / Tidak Lulus / Pending]
```

**3. LoA (Letter of Acceptance):**
```
Nama Perusahaan/Hotel: [___________________]
Posisi: [___________________]
```

**4. Kontrak Magang:**
```
Tanggal TTD: [DD/MM/YYYY]
[Upload dokumen — fase 2]
```

**5. MCU (Medical Check-Up):**
```
Tempat MCU: [___________________]
Tanggal: [DD/MM/YYYY]
Hasil: [Lulus / Tidak Lulus]
```

**6. Visa:**
```
Jenis Visa: [___________________]
Status: [Proses / Approved / Ditolak]
Nomor Visa: [___________________ ] (jika sudah approved)
```

**7. Tiket Pesawat:**
```
Maskapai: [___________________]
Tanggal Berangkat: [DD/MM/YYYY]
No. Penerbangan: [___________]
```

**8. PDT (Pembekalan Pra-Keberangkatan):**
```
Tanggal PDT: [DD/MM/YYYY]
Tempat: [___________________]
```

---

### Style Expandable Item

Setiap item checklist yang dicentang → animasi expand ke bawah menampilkan form field tambahan:
```
[Collapse/Expand menggunakan CSS max-height transition]
```

---

### Jadwal Keberangkatan

Card form dengan 4 field:
- Date picker untuk estimasi keberangkatan
- Kota tujuan (text)
- Durasi (select: 3 bulan, 6 bulan, 1 tahun)
- Hotel/perusahaan (text)

---

### Kalkulasi Status Panel

```
8/8 dokumen ✅ → 🟢 AMAN
4-7/8 ✅ → 🟡 PERLU PERHATIAN
0-3/8 ✅ → 🔴 TIDAK AMAN
```

Khusus: jika Visa atau Paspor ❌ → langsung 🔴 (blocking dokumen kritis)

---

### Tombol ACC Tim Magang

Bisa diberikan kapan saja, dengan konfirmasi dialog dan peringatan jika dokumen belum lengkap.

---

## Data yang Di-fetch
- `GET /api/students/:id/internship` → 8 item + detail per item + jadwal + ACC

## Data yang Di-submit
- `PATCH /api/students/:id/internship` → update checklist + detail dokumen
- `PATCH /api/students/:id/internship/schedule` → update jadwal
- `POST /api/students/:id/internship/acc` → ACC Tim Magang

---

## Komponen shadcn/ui
- `Card`
- `Checkbox`
- `Badge`
- `Input`, `Textarea`
- `Select`
- `DatePicker` / `Calendar` + `Popover`
- `Button`
- `AlertDialog`
- `Collapsible` (expand form per item)
