# UI Plan: Panel Finance (Keuangan)
# Panel 03 dari 10

## Tujuan Panel
Admin Finance memvalidasi status pembayaran mahasiswa. Ini adalah salah satu panel **blocking** paling kritis — mahasiswa tidak akan bisa lanjut proses jika ada tunggakan.

---

## Akses Role
- ✅ `finance` — Edit penuh
- ✅ `superadmin` — Read-only
- ❌ Role lain — Tidak dapat melihat detail keuangan (GDPR/privasi data)

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  💰 Finance — Status Keuangan               [🔴 TIDAK AMAN] │
│  Dikelola oleh: Admin Finance                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RINGKASAN STATUS PEMBAYARAN                                │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ Registrasi   │ │ Semester     │ │ Dana Talangan│       │
│  │ Awal         │ │              │ │              │       │
│  │ ✅ LUNAS     │ │ ❌ BELUM     │ │ ⏳ PROSES    │       │
│  │ Rp 2.500.000 │ │ Rp 8.000.000 │ │ Rp 1.500.000 │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
│  DETAIL ITEM KEUANGAN                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✅  Registrasi Awal Lunas                        ✅  │  │
│  │     Dibayar: 01 Jan 2024 — Rp 2.500.000            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ❌  Semester Lunas                               ❌  │  │
│  │     Tagihan: Rp 8.000.000 · Belum dibayar           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⏳  Dana Talangan                                🟡  │  │
│  │     Cicilan aktif: Rp 500.000/bulan                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ❌  Tunggakan Bersih                             ❌  │  │
│  │     Total tunggakan: Rp 8.000.000                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ❌  Layak Lanjut Proses                          ❌  │  │
│  │     Tidak layak — ada tunggakan aktif               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  CATATAN KEUANGAN                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Textarea: catatan admin finance...]                │  │
│  └──────────────────────────────────────────────────────┘  │
│                            [Simpan Catatan]                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ❌ ACC Finance belum dapat diberikan (ada tunggakan)       │
│  [🔒 ACC FINANCE — Tidak Aktif]                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Summary Cards (3 kartu atas)

Tiga kartu ringkasan yang menampilkan status 3 kategori pembayaran utama:
- **Registrasi Awal** — lunas/belum
- **Semester** — lunas/belum + nominal
- **Dana Talangan** — status cicilan

**Style kartu:**
- ✅ LUNAS: border hijau, teks hijau, background `emerald-950/30`
- ❌ BELUM: border merah, teks merah, background `red-950/30`
- ⏳ PROSES: border kuning, teks kuning, background `amber-950/30`

---

### Checklist Items Detail (5 item)
1. Registrasi Awal Lunas
2. Semester Lunas
3. Dana Talangan (lunas/cicilan aktif)
4. Tunggakan Bersih (tidak ada tunggakan)
5. Layak Lanjut Proses (auto dari 1-4)

**Item ke-5 (Layak Lanjut Proses) bersifat auto-calculated:**
- Jika item 1, 2, 3, 4 semuanya ✅ → otomatis ✅
- Tidak bisa dicentang manual

---

### Kolom Nominal (Opsional Input)

Untuk item yang memiliki nilai rupiah, Admin Finance dapat menginput nominal:
```
┌─────────────────────────────────────────────────────────┐
│  Jumlah Tagihan:  [Rp ____________]                     │
│  Jumlah Dibayar:  [Rp ____________]                     │
│  Tanggal Bayar:   [DD/MM/YYYY    ]                     │
└─────────────────────────────────────────────────────────┘
```
- Menggunakan `shadcn/ui Input` dengan prefix "Rp"
- Format angka otomatis (1.000.000 format Indonesia)

---

### Tombol ACC Finance

**Aturan khusus:**
- ACC FINANCE hanya bisa diberikan jika item "Layak Lanjut Proses" = ✅
- Jika ada tunggakan → tombol disabled + pesan penjelasan merah
- Jika semua lunas → tombol aktif indigo

**Pesan saat disabled:**
```
🔒 ACC Finance tidak dapat diberikan.
Alasan: Masih ada tunggakan sebesar Rp 8.000.000
Selesaikan pembayaran terlebih dahulu.
```

---

## Data yang Di-fetch
- `GET /api/students/:id/finance` → status 5 item + nominal + catatan + ACC

## Data yang Di-submit
- `PATCH /api/students/:id/finance` → update per item + nominal
- `PATCH /api/students/:id/finance/note` → update catatan
- `POST /api/students/:id/finance/acc` → ACC Finance

---

## Komponen shadcn/ui
- `Card`, `CardHeader`, `CardContent`
- `Checkbox`
- `Badge`
- `Input` (nominal rupiah)
- `Textarea` (catatan)
- `Button`
- `AlertDialog`
- `Alert` (pesan warning tunggakan)
