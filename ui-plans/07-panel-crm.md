# UI Plan: Panel CRM (Customer Relationship Management)
# Panel 02 dari 10

## Tujuan Panel
Admin CRM bertanggung jawab atas hubungan dengan orang tua dan pemantauan mahasiswa selama masa **Orientasi Dasar Sikap (ODS)**. Panel ini memvalidasi kesiapan relasional dan kehadiran praktik awal mahasiswa.

---

## Akses Role
- ✅ `crm` — Edit penuh
- ✅ `superadmin` — Read-only
- ❌ Role lain — Tidak dapat melihat/mengedit

---

## Layout Panel

```
┌─────────────────────────────────────────────────────────────┐
│  📞 CRM — Customer Relationship Management  [🟡 PROSES 3/5]│
│  Dikelola oleh: Admin CRM                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STATUS ODS & MONITORING                                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✅  ODS Aktif                                    ✅  │  │
│  │     Mahasiswa sedang mengikuti program ODS           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✅  Monitoring Mahasiswa                         ✅  │  │
│  │     Pemantauan rutin mahasiswa berjalan              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⏳  Follow Up Orang Tua                         🟡  │  │
│  │     Komunikasi & update progress ke orang tua        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⏳  Update Kehadiran Praktik                    🟡  │  │
│  │     Kehadiran praktik harian terdokumentasi          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ❌  Dokumentasi ODS                             ❌  │  │
│  │     Foto/video dokumentasi ODS tersedia              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  LOG KOMUNIKASI ORANG TUA                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📅 05 Jun 2026 — "Sudah dihubungi via WhatsApp,     │  │
│  │     orang tua menyetujui program magang" — CRM Admin  │  │
│  │  📅 01 Jun 2026 — "Kirim progress report bulan ini"  │  │
│  │  [+ Tambah Log Komunikasi]                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⏳ Menunggu ACC CRM — Belum ada persetujuan               │
│                               [✔ ACC CRM →]               │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponen & Interaksi

### Checklist Items (5 item)
1. ODS Aktif
2. Monitoring Mahasiswa
3. Follow Up Orang Tua
4. Update Kehadiran Praktik
5. Dokumentasi ODS

Pola checklist sama dengan Panel PMB (lihat `06-panel-pmb.md`).

**Kalkulasi Status:**
```
5/5 → 🟢 AMAN
3-4/5 → 🟡 PERLU PERHATIAN
0-2/5 → 🔴 TIDAK AMAN
```

---

### Log Komunikasi Orang Tua

**Komponen Log:**
```
Timeline vertikal dari bawah ke atas (terbaru di atas):
┌─────────────────────────────────────────────────┐
│ 📅 05 Jun 2026, 10:00 WIB                       │
│ "Sudah dihubungi via WhatsApp, orang tua..."    │
│ — oleh: Admin CRM (Rini Wulandari)              │
└─────────────────────────────────────────────────┘
```

**Form tambah log:**
```
┌─────────────────────────────────────────────────┐
│  [Textarea: "Tambah catatan komunikasi..."]      │
│                          [+ Tambah Log]          │
└─────────────────────────────────────────────────┘
```

- Hanya role `crm` yang dapat menambah log
- Setiap log menyimpan: teks, tanggal, nama admin
- Maksimal tampil 5 log terbaru, ada tombol "Lihat Semua"
- Style: timeline dengan garis vertikal, dot kiri indigo

---

### Kehadiran Praktik (Sub-komponen Kecil)
Jika "Update Kehadiran Praktik" dicentang, muncul field tambahan:

```
Kehadiran Praktik:   [____]  dari  [____]  hari
                      Hadir         Total
                     
Persentase: 85% ████████████░░░░
```

- `shadcn/ui Slider` atau `Input` untuk input angka
- Progress bar visual persentase

---

### Tombol ACC CRM
Pola sama dengan ACC PMB (konfirmasi dialog, timestamp).

---

## Data yang Di-fetch
- `GET /api/students/:id/crm` → 5 checklist + log komunikasi + ACC status

## Data yang Di-submit
- `PATCH /api/students/:id/crm` → update checklist
- `POST /api/students/:id/crm/log` → tambah log komunikasi
- `POST /api/students/:id/crm/acc` → ACC CRM

---

## Komponen shadcn/ui
- `Card`, `CardHeader`, `CardContent`
- `Checkbox`
- `Badge`
- `Textarea`
- `Button`
- `AlertDialog` (konfirmasi ACC)
- `ScrollArea` (log timeline)
- `Separator`
