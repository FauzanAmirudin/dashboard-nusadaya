# UI Plan: Panel Catatan Internal
# Panel 10 dari 10

## Tujuan Panel
Sistem log pengecualian dan catatan kolaboratif antar divisi. Panel ini berfungsi sebagai **rule-based engine context** — misalnya mencatat bahwa mahasiswa sedang ODS sehingga tidak dihitung alpha, atau ada izin resmi yang perlu diakui sistem.

---

## Akses Role
- ✅ `superadmin` — Baca + tulis semua catatan
- ✅ `akademik` — Baca + tulis catatan akademik
- ✅ `pa` — Baca + tulis catatan PA
- ✅ `pmb`, `crm`, `finance`, `magang`, `evaluator` — Hanya baca catatan relevan
- ❌ `dosen` — Tidak tampil

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Catatan Internal & Log Pengecualian                     │
│  Semua divisi dapat membaca, beberapa dapat menulis         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [+ Tambah Catatan Internal]         [Filter: Semua ▼]     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📌 08 Jun 2026 | 14:30 WIB | Admin Akademik         │  │
│  │                                                      │  │
│  │  Tipe: ⚠️ PENGECUALIAN AKADEMIK                      │  │
│  │                                                      │  │
│  │  "Mahasiswa sedang menjalani program ODS selama 2    │  │
│  │  minggu (5-19 Jun 2026). Ketidakhadiran selama ODS  │  │
│  │  tidak dihitung sebagai alpha sesuai kebijakan       │  │
│  │  akademik internal Nusadaya."                        │  │
│  │                                                      │  │
│  │  Ditandatangani: Admin Akademik (Budi S.)           │  │
│  │  [✏️ Edit] [🗑️ Hapus]                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📌 01 Jun 2026 | 09:00 WIB | Admin CRM              │  │
│  │                                                      │  │
│  │  Tipe: ℹ️ INFORMASI UMUM                             │  │
│  │                                                      │  │
│  │  "Orang tua menghubungi dan meminta update           │  │
│  │  perkembangan mahasiswa melalui WhatsApp.            │  │
│  │  Sudah direspon dan dikirimkan laporan progress."    │  │
│  │                                                      │  │
│  │  Ditandatangani: Admin CRM (Rini W.)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Tampilkan 3 catatan lagi...]                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Form Tambah Catatan Internal

Muncul saat klik tombol `+ Tambah Catatan Internal`:

```
┌─────────────────────────────────────────────────────────────┐
│  Tambah Catatan Internal                              [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tipe Catatan:                                              │
│  ● Pengecualian Akademik    ○ Izin Resmi                   │
│  ○ Sedang ODS               ○ Praktik Luar                  │
│  ○ Informasi Umum           ○ Lainnya                       │
│                                                             │
│  Catatan:                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Textarea — deskripsi lengkap catatan...]           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Periode berlaku (opsional):                               │
│  Dari: [DD/MM/YYYY]    Sampai: [DD/MM/YYYY]                │
│                                                             │
│  Notifikasi divisi terkait:                                │
│  [✅ Akademik] [✅ PA] [☐ Finance] [☐ Magang]             │
│                                                             │
│                [Batal]        [Simpan Catatan]             │
└─────────────────────────────────────────────────────────────┘
```

---

### Tipe Catatan & Warna

| Tipe | Warna Badge | Ikon |
|---|---|---|
| Pengecualian Akademik | amber | ⚠️ |
| Izin Resmi | blue | 📄 |
| Sedang ODS | purple | 🏫 |
| Praktik Luar | teal | 🔧 |
| Informasi Umum | slate | ℹ️ |
| Lainnya | gray | 📝 |

---

### Filter & Sort

Dropdown filter di atas list:
- **Semua** — tampilkan semua catatan
- **Pengecualian** — hanya pengecualian akademik
- **Izin** — hanya izin resmi
- **Divisi saya** — hanya catatan dari divisi user yang login

Sort default: terbaru di atas.

---

### Card Catatan

Setiap catatan ditampilkan dalam card dengan:
- **Header:** tanggal-jam | nama divisi/penulis
- **Badge tipe** catatan
- **Teks catatan** (maks 3 baris, tombol "Baca selengkapnya" jika lebih)
- **Periode berlaku** (jika ada): `05 Jun - 19 Jun 2026`
- **Tombol Edit/Hapus** (hanya terlihat untuk penulis catatan dan superadmin)

---

### Rule Engine Context (Backend Note)

Catatan bertipe "Pengecualian Akademik" dan "Sedang ODS" memiliki pengaruh terhadap kalkulasi kehadiran:
- Backend membaca catatan aktif (dalam periode berlaku) sebelum kalkulasi kehadiran
- Jika ada pengecualian aktif → kehadiran dikalkulasi tanpa hari ODS tersebut
- Tampilkan info ini dalam panel Akademik: `"⚠️ Ada 2 hari pengecualian ODS aktif"`

---

## Data yang Di-fetch
- `GET /api/students/:id/internal-notes` → semua catatan (dengan filter opsional)

## Data yang Di-submit
- `POST /api/students/:id/internal-notes` → tambah catatan
- `PATCH /api/students/:id/internal-notes/:noteId` → edit catatan
- `DELETE /api/students/:id/internal-notes/:noteId` → hapus catatan

---

## Komponen shadcn/ui
- `Card`
- `Badge`
- `Textarea`
- `Input`
- `Select`, `RadioGroup`
- `Checkbox` (notifikasi divisi)
- `Button`
- `Dialog` (form tambah catatan)
- `ScrollArea`
- `DatePicker`
