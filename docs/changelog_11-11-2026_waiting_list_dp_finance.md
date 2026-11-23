# Changelog 11-11-2026 — Waiting List Pembayaran DP & Aktivasi oleh Finance

Sumber: catatan rapat PMB/Finance (Skema Status Mahasiswa & Integrasi Tagihan Finance).

## Alur
```
PMB approve / input manual → menunggu_pembayaran
→ Finance terbitkan tagihan (VA default / rekening + nominal), batas bayar 2 hari sejak tagihan terbit
→ Finance setujui lunas → aktif + NIM terbit
Belum ditagih: TIDAK pernah diarsipkan (timer belum jalan). Sudah ditagih & lewat 2 hari: ditandai Terlambat + diarsip otomatis; bayar & disetujui → keluar arsip & aktif.
Lunas dibatalkan Finance (true→false): kembali menunggu_pembayaran, NIM tetap, audit log.
```

## Database (aditif, `apps/api/src/db/migrate_waiting_list.sql`)
- Enum `student_status` + `menunggu_pembayaran`.
- `pmb_payment_plan` + `billing_type`, `billing_number`, `billing_bank_name`, `billing_account_holder`, `billing_issued_at`, `billing_due_date`, `billing_issued_by`.
- Diterapkan via SQL langsung (bukan `db:push`, karena push mengusulkan perubahan tak terkait di `master_courses`).

## Backend
- `form-register.ts` & `student/core.ts` (`createStudentPipeline`): default status `menunggu_pembayaran`.
- `lib/student-activation.ts`: `applyDpVerification` (satu pintu aktivasi/revert), `checkWaitingStatusChange` (blokir aktivasi manual sebelum lunas, kecuali superadmin).
- `lib/waiting-list.ts` + worker (`scheduled.worker.ts`, tiap 6 jam): arsip otomatis hanya yang sudah ditagih dan lewat 2 hari.
- `routes/finance.ts`: `GET /finance/waiting-list`, `PATCH /finance/waiting-list/:studentId/billing`; `/student/:id/registrasi` memanggil helper.
- `student/pmb.ts`: perubahan `statusDp` hanya oleh Finance/superadmin.
- `student/core.ts` PUT update: tanpa `studentStatus` di body, status lama dipertahankan (sebelumnya default `aktif`).
- `GET /students`: waiting list tidak tampil di daftar panel mana pun (param `includeWaiting=true` untuk menampilkan); KPI total dashboard juga mengecualikannya.
- `dashboard.ts`: hitungan `menungguPembayaran`; `mahasiswa.ts`: data tagihan untuk portal.

## Frontend
- `WaitingListSection` di `FinanceDashboard` (terbitkan tagihan, setujui lunas, tab arsip).
- Form tambah mahasiswa default `menunggu_pembayaran`; opsi/label status baru; instruksi bayar di portal mahasiswa.

## Test
- `apps/api/test/waiting_list_dp.test.ts` (5 tes). Regresi: 104 tes terkait lulus.

## Belum dikerjakan / catatan
- Query yang tidak memfilter `studentStatus` (attendance.ts, courses.ts, grade-calculation, akademik-pa) belum diaudit satu per satu.
- Kartu hitungan "Menunggu Pembayaran" belum ditampilkan di dashboard web (data sudah tersedia di API).

## Lanjutan — Penyesuaian hasil diskusi PMB (transkrip "ONEDATA PMB V2")
- Formulir tautan: Nomor Rumah opsional; data Ayah/Ibu cukup Nama, Keadaan, Kewarganegaraan (lainnya opsional, format HP/email tetap divalidasi bila diisi).
- Checklist "Berkas Lengkap" dihapus: total wajib 13 (4 berkas utama + 9 dokumen). Satu sumber aturan `PMB_REQUIRED_DOC_FIELDS` (api/src/lib/pmb-acc-requirements.ts) dipakai ACC, status otomatis, batal ACC, progres portal. Perbaikan bug: ACC tidak lagi direset saat dokumen OPSIONAL belum dicentang.
- Label "Kawan" → "Teman / Rekan" (teks tampilan; nilai pilihan rekomendasi "Teman / Kawan" tetap karena tersimpan di data).
- MCU Full dihapus dari PMB (dikelola di Panel Magang).
- CRM melihat waiting list (pill "Menunggu Pembayaran" + filter); semua perubahan data CRM ditolak server sampai DP diverifikasi Finance; Panel CRM terkunci dengan banner.
- Cetak formulir pendaftaran (A4, ≤2 lembar, kop placeholder) di /dashboard/students/:id/formulir; tautan di baris "Formulir Masuk" untuk unggah hasil bertanda tangan.
- Tes: crm_waiting_guard.test.ts (baru), pmb_poin_10_12 & panel-logic unit test disesuaikan ke 13.
