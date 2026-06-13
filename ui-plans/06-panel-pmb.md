# UI Plan: Panel PMB (Penerimaan Mahasiswa Baru)
# Panel 01 dari 10

## Tujuan Panel
Modul pertama dalam alur sistem. Admin PMB bertanggung jawab menginput dan memverifikasi kelengkapan data awal penerimaan mahasiswa. Panel ini adalah "pintu masuk" pertama seorang mahasiswa ke dalam sistem.

---

## Akses Role
- ✅ `pmb` — Edit penuh
- ✅ `superadmin` — Read-only + lihat status
- ❌ Role lain — Panel disembunyikan atau read-only

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  📋 PMB — Penerimaan Mahasiswa Baru      [🟢 AMAN / 4/4]   │
│  Dikelola oleh: Admin PMB                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CHECKLIST KELENGKAPAN AWAL                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅  Formulir Masuk                              ✅  │   │
│  │     Formulir pendaftaran telah diterima             │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✅  Berkas Lengkap                              ✅  │   │
│  │     Semua dokumen fisik tersedia                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✅  Input Data Awal                             ✅  │   │
│  │     Data mahasiswa telah diinput ke sistem          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ✅  Follow Up Awal                              ✅  │   │
│  │     Kontak awal dengan mahasiswa/orang tua selesai  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Catatan PMB:                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [text area — catatan bebas dari admin PMB]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                      [Simpan Catatan]      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ✅ ACC PMB — Ahmad (Admin PMB) · 07 Jun 2026, 09:15 WIB   │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Checklist Items (4 item)

**Setiap item checklist:**
```tsx
interface ChecklistItem {
  id: string
  label: string         // "Formulir Masuk"
  description: string   // "Formulir pendaftaran telah diterima"
  checked: boolean
  updatedAt?: string
  updatedBy?: string
}
```

**Visual per item:**
- Container: `flex items-center gap-4 p-4 rounded-lg`
- Background idle: `bg-slate-50`
- Background checked: `bg-emerald-50 border-emerald-200`
- **Checkbox:** shadcn `Checkbox` component, size lebih besar, warna hijau saat checked
- **Label:** teks utama bold, deskripsi kecil muted
- **Icon kanan:** ✅ green / ⏳ kuning / ❌ merah (berdasarkan state)

**Interaksi:**
- Klik checkbox → langsung save via API (optimistic update)
- Hanya `pmb` role yang bisa toggle
- Saat non-pmb, checkbox disabled tapi tetap terlihat
- Animasi: smooth `transition` dari unchecked ke checked (skala + warna)

---

### Kalkulasi Status Panel

```
4 item checklist:
- 4/4 ✅ → Badge "🟢 AMAN"
- 2-3/4 ✅ → Badge "🟡 PERLU PERHATIAN"  
- 0-1/4 ✅ → Badge "🔴 TIDAK AMAN"
```

Badge status di header panel update otomatis saat checkbox berubah.

---

### Catatan PMB

- `shadcn/ui Textarea` — bisa diisi admin PMB
- Tombol `Simpan Catatan` — hanya terlihat untuk role pmb
- Catatan yang tersimpan muncul dalam card abu-abu dengan timestamp dan nama pembuat

---

### Tombol ACC PMB

**State 1 — Belum ACC (role pmb):**
```
[✔ ACC PMB →]  — solid blue, enabled
```

**State 2 — Sudah ACC:**
```
✅ ACC PMB — Ahmad Fauzi · 07 Jun 2026, 09:15 WIB
```
Disabled, tampilan stamp, teks hijau, tidak bisa di-klik.

**State 3 — Role lain (non-pmb):**
Tombol tidak tampil sama sekali.

**Konfirmasi sebelum ACC:**
```tsx
<AlertDialog>
  <AlertDialogTrigger>ACC PMB</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Konfirmasi ACC PMB</AlertDialogTitle>
    <AlertDialogDescription>
      Anda akan memberikan persetujuan untuk panel PMB mahasiswa ini.
      Tindakan ini akan dicatat beserta timestamp Anda.
    </AlertDialogDescription>
    <AlertDialogCancel>Batal</AlertDialogCancel>
    <AlertDialogAction>Ya, ACC Sekarang</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

---

## Data yang Di-fetch
- `GET /api/students/:id/pmb` → status 4 checklist + catatan + status ACC

## Data yang Di-submit
- `PATCH /api/students/:id/pmb` → update per item checklist
- `PATCH /api/students/:id/pmb/note` → update catatan
- `POST /api/students/:id/pmb/acc` → berikan ACC PMB

---

## Komponen shadcn/ui
- `Card`, `CardHeader`, `CardContent`
- `Checkbox`
- `Badge`
- `Textarea`
- `Button`
- `AlertDialog`
- `Tooltip` (untuk menampilkan info updatedAt/by per item)
