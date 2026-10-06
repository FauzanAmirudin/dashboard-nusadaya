# Audit Log — Implementation Plan
## Nusadaya Akademi Dashboard

> **Filosofi**: Audit log bukan application log. Tujuannya satu: menjawab pertanyaan _"Siapa melakukan apa, kapan, pada data mana, dan perubahannya seperti apa?"_ Audit log bersifat **immutable** — tidak boleh diedit atau dihapus oleh siapapun, termasuk superadmin.

---

## Konteks & Status Awal

Saat ini `auditLogs` table sudah ada di schema (`shared.ts`) dengan kolom dasar:

- `id`, `userId`, `action`, `entity`, `entityId`, `details` (JSON), `createdAt`

Dan sudah digunakan secara terbatas di:
- `index.ts` → `auth.login_success`, `auth.login_failed`, `auth.lockout_triggered`

**Masalah yang ada:**
- Skema terlalu sederhana — tidak ada `ipAddress`, `userAgent`, `oldValue`, `newValue`, `module`
- Tidak ada service/helper terpusat — setiap tempat yang butuh audit harus menulis raw SQL sendiri
- Tidak ada coverage untuk operasi CRUD di hampir semua panel
- Tidak ada UI untuk melihat audit log

---

## Fase 1 — Fondasi (Schema & Service)

> Harus selesai sebelum mengerjakan panel manapun. Semua task di Fase 2 bergantung pada Fase 1.

---

### TASK 1.1 — Upgrade Schema `audit_logs`

**File:** `apps/api/src/db/schema/shared.ts`

Upgrade kolom tabel `audit_logs` dengan menambahkan field yang dibutuhkan:

| Kolom baru | Tipe | Keterangan |
|---|---|---|
| `module` | `text` | Panel asal: `auth`, `student`, `pmb`, `finance`, `akademik`, `kehadiran`, `pa`, `magang`, `crm`, `courses`, `scheduling`, `users`, `settings`, `file` |
| `resourceType` | `text` | Jenis resource spesifik: `student`, `payment`, `attendance`, `course`, dst |
| `resourceId` | `text` | ID resource (diubah dari integer ke text agar fleksibel untuk ULID & integer) |
| `oldValue` | `jsonb` | Snapshot data **sebelum** perubahan (null untuk CREATE) |
| `newValue` | `jsonb` | Snapshot data **sesudah** perubahan (null untuk DELETE) |
| `ipAddress` | `text` | IP address user |
| `userAgent` | `text` | Browser/client user agent |
| `requestId` | `text` | Correlation ID per request (untuk tracing) |
| `sessionId` | `text` | Session ID dari Redis |

Kolom yang sudah ada (`entity`, `entityId`) dipertahankan untuk kompatibilitas, atau di-rename saat migration agar tidak breaking:
- `entity` → tetap (akan di-populate sama dengan `module`)
- `entityId` → tetap (di-populate integer entityId, `resourceId` untuk non-integer)

Tambahkan index baru:
- `idx_audit_logs_module` pada kolom `module`
- `idx_audit_logs_created_at` pada kolom `createdAt`
- `idx_audit_logs_resource` pada kolom (`resourceType`, `resourceId`)
- `idx_audit_logs_request_id` pada kolom `requestId`

---

### TASK 1.2 — Buat Migration Drizzle

**File:** `apps/api/src/db/` (migration baru)

Buat file migration Drizzle untuk menambahkan kolom baru ke tabel `audit_logs` yang sudah ada di production.

Pastikan migration bersifat **additive** (hanya `ADD COLUMN`) — jangan drop atau rename kolom yang sudah ada agar data historis tidak hilang.

Semua kolom baru harus `nullable` karena data lama tidak memiliki nilai tersebut.

---

### TASK 1.3 — Buat Audit Service (`auditService`)

**File baru:** `apps/api/src/lib/audit.ts`

Buat satu fungsi terpusat sebagai abstraction layer:

```
auditService.log({
  userId,
  action,
  module,
  resourceType,
  resourceId,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
  requestId,
  sessionId,
  details,
})
```

**Perilaku yang harus diimplementasi:**

1. **Non-blocking** — log harus ditulis secara fire-and-forget (Promise tanpa await di route) sehingga tidak menghambat response ke user. Gunakan `.catch(console.error)` untuk handle error tanpa crash.
2. **Sanitization** — sebelum menyimpan `oldValue`/`newValue`, strip field sensitif: `passwordHash`, `password`, `token`, `secret`, `refreshToken`.
3. **Field capping** — `userAgent` dipotong maksimal 500 karakter. `details` JSON dibatasi kedalaman 3 level untuk menghindari storage membengkak.
4. **Type-safe action constants** — definisikan `AuditAction` sebagai union type atau object konstanta untuk semua action yang valid, agar tidak typo saat memanggil dari route.

---

### TASK 1.4 — Buat `AuditAction` Constants

**File baru:** `apps/api/src/lib/audit-actions.ts`

Definisikan semua action string sebagai konstanta yang dikelompokkan per modul. Contoh struktur:

```
AUTH.*        → auth.login_success, auth.login_failed, auth.logout, auth.lockout_triggered
STUDENT.*     → student.created, student.updated, student.deleted, student.status_changed, student.archived
PMB.*         → pmb.status_changed, pmb.score_updated, pmb.document_verified
FINANCE.*     → finance.payment_added, finance.payment_updated, finance.payment_deleted, finance.document_verified
AKADEMIK.*    → akademik.score_updated, akademik.grade_finalized, akademik.note_added
ATTENDANCE.*  → attendance.created, attendance.updated, attendance.deleted, attendance.bulk_created
PA.*          → pa.note_added, pa.consultation_logged, pa.student_assigned
MAGANG.*      → magang.status_changed, magang.document_uploaded
CRM.*         → crm.stage_changed, crm.note_added, crm.contact_updated
COURSES.*     → courses.created, courses.updated, courses.deleted
SCHEDULING.*  → scheduling.created, scheduling.updated, scheduling.deleted
USERS.*       → users.created, users.updated, users.deleted, users.password_changed, users.role_changed
SETTINGS.*    → settings.updated
FILE.*        → file.uploaded, file.deleted, file.verified
```

---

### TASK 1.5 — Buat Helper `extractRequestMeta`

**File baru:** `apps/api/src/lib/request-meta.ts`

Buat utility function yang menerima Elysia `request` object dan menghasilkan:

```
{
  ipAddress: string,
  userAgent: string,
  requestId: string   // generated UUID/nanoid per request
}
```

IP diambil dari header `x-forwarded-for` → `x-real-ip` → fallback `"127.0.0.1"`.

`requestId` dibuat sekali per request dan bisa digunakan di log maupun sebagai response header (`X-Request-ID`) untuk debugging lintas sistem.

---

## Fase 2 — Coverage per Panel

> Setiap task di bawah = satu sesi kerja fokus. Kerjakan per panel secara berurutan setelah Fase 1 selesai.

---

## Panel: AUTH

### TASK 2.1 — Refactor Audit di Auth Routes (`index.ts`)

**File:** `apps/api/src/index.ts`

Saat ini audit di auth routes menulis raw `db.insert(auditLogs)`. Refactor untuk menggunakan `auditService.log()`.

**Events yang harus di-cover:**

| Event | Action Constant | Level |
|---|---|---|
| Login berhasil | `AUTH.LOGIN_SUCCESS` | INFO |
| Login gagal (credential salah) | `AUTH.LOGIN_FAILED` | WARN |
| Login gagal → akun dikunci | `AUTH.LOCKOUT_TRIGGERED` | WARN |
| Logout | `AUTH.LOGOUT` | INFO |

**Field wajib untuk setiap auth event:**
- `userId` (null jika user tidak ditemukan)
- `ipAddress` (dari `extractRequestMeta`)
- `userAgent`
- `requestId`
- `sessionId` (jika tersedia)

**Yang TIDAK boleh disimpan di `details`:** password, token JWT, passwordHash

---

## Panel: STUDENT CORE (Data Mahasiswa)

### TASK 2.2 — Audit pada Route `mahasiswa.ts` — CREATE

**File:** `apps/api/src/routes/mahasiswa.ts`

Identifikasi semua endpoint yang membuat data mahasiswa baru (pendaftaran manual, import, dll).

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Mahasiswa baru dibuat | `STUDENT.CREATED` | `newValue` = data mahasiswa (tanpa field sensitif) |

**Field `details` yang dicatat:**
- `studentId`, `name`, `nim`, `cohort`, `program`, `subProgram`

---

### TASK 2.3 — Audit pada Route `mahasiswa.ts` — UPDATE Data Inti

**File:** `apps/api/src/routes/mahasiswa.ts`

Identifikasi endpoint update data mahasiswa (profil, data pribadi, data orang tua).

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Data mahasiswa diupdate | `STUDENT.UPDATED` | `oldValue` = snapshot sebelum update, `newValue` = data baru |

**Cara ambil `oldValue`:** lakukan query `findFirst` sebelum melakukan update, simpan hasilnya. Setelah update berhasil, baru panggil `auditService.log()` dengan `oldValue` dan `newValue`.

**Field yang TIDAK perlu disimpan di oldValue/newValue:** `passwordHash`, kolom-kolom yang bukan data inti mahasiswa.

---

### TASK 2.4 — Audit pada Route `mahasiswa.ts` — STATUS CHANGE

**File:** `apps/api/src/routes/mahasiswa.ts`

Perubahan `studentStatus` (aktif → cuti → alumni → keluar → dropout → lulus) adalah operasi paling sensitif di panel ini.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Status mahasiswa berubah | `STUDENT.STATUS_CHANGED` | `oldValue.studentStatus`, `newValue.studentStatus` |
| Mahasiswa diarsipkan | `STUDENT.ARCHIVED` | `details.isArchived = true` |

---

### TASK 2.5 — Audit pada Route `mahasiswa.ts` — DELETE

**File:** `apps/api/src/routes/mahasiswa.ts`

Jika ada endpoint delete mahasiswa (hard delete atau soft delete).

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Mahasiswa dihapus | `STUDENT.DELETED` | `oldValue` = snapshot lengkap sebelum hapus |

---

### TASK 2.6 — Audit Internal Notes

**File:** Route internal-notes yang relevan

Internal notes merupakan catatan sensitif per mahasiswa.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Note dibuat | `STUDENT.NOTE_ADDED` | `details.noteType`, `details.studentId` |
| Note diupdate | `STUDENT.NOTE_UPDATED` | `oldValue.note`, `newValue.note` |
| Note dihapus | `STUDENT.NOTE_DELETED` | `oldValue` = note yang dihapus |

---

## Panel: PMB (Penerimaan Mahasiswa Baru)

### TASK 2.7 — Audit PMB Status & Score

**File:** `apps/api/src/routes/student/pmb.ts`

PMB adalah panel intake mahasiswa baru. Perubahan status dan nilai ujian harus dicatat.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Status PMB berubah | `PMB.STATUS_CHANGED` | `oldValue.status`, `newValue.status` |
| Nilai assessment diupdate | `PMB.SCORE_UPDATED` | `oldValue.scores`, `newValue.scores` |
| Keputusan PMB dibuat (lulus/tidak) | `PMB.DECISION_MADE` | `details.decision`, `details.notes` |
| Data PMB diupdate | `PMB.DATA_UPDATED` | `oldValue`, `newValue` |

---

### TASK 2.8 — Audit PMB Document Verification

**File:** `apps/api/src/routes/student/pmb.ts`

Verifikasi dokumen oleh admin harus dicatat karena ini tindakan formal.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Dokumen diverifikasi | `PMB.DOCUMENT_VERIFIED` | `details.documentKey`, `details.studentId` |
| Dokumen ditolak | `PMB.DOCUMENT_REJECTED` | `details.documentKey`, `details.reason` |

---

## Panel: FINANCE (Keuangan)

### TASK 2.9 — Audit Pembayaran (Payment Records)

**File:** `apps/api/src/routes/finance.ts`

Data keuangan adalah data paling sensitif di sistem — setiap perubahan **wajib** tercatat.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Tagihan/payment baru dibuat | `FINANCE.PAYMENT_ADDED` | `newValue` = data payment |
| Data payment diupdate | `FINANCE.PAYMENT_UPDATED` | `oldValue`, `newValue` |
| Data payment dihapus | `FINANCE.PAYMENT_DELETED` | `oldValue` = snapshot sebelum hapus |
| Status pembayaran berubah | `FINANCE.PAYMENT_STATUS_CHANGED` | `oldValue.status`, `newValue.status` |
| Finance data diupdate (total biaya, cicilan, dll) | `FINANCE.DATA_UPDATED` | `oldValue`, `newValue` |

---

### TASK 2.10 — Audit Verifikasi Dokumen Finance

**File:** `apps/api/src/routes/finance.ts`

Saat dokumen keuangan (bukti bayar, kontrak, dll) diverifikasi admin.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Dokumen finance diverifikasi | `FINANCE.DOCUMENT_VERIFIED` | `details.documentKey`, `details.verifiedBy` |

---

## Panel: AKADEMIK

### TASK 2.11 — Audit Nilai & Kelulusan

**File:** `apps/api/src/routes/student/academic.ts`

Perubahan nilai akademik adalah operasi kritis dan harus dicatat dengan `oldValue`/`newValue`.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Nilai teori/praktik diinput | `AKADEMIK.SCORE_UPDATED` | `oldValue.scores`, `newValue.scores`, `details.courseId` |
| Nilai difinalisasi (grade final) | `AKADEMIK.GRADE_FINALIZED` | `details.studentId`, `details.courseId`, `details.finalGrade` |
| Status akademik berubah | `AKADEMIK.STATUS_CHANGED` | `oldValue.status`, `newValue.status` |
| Catatan akademik ditambah | `AKADEMIK.NOTE_ADDED` | `details.note`, `details.courseId` |

---

### TASK 2.12 — Audit Finalisasi & Evaluasi

**File:** `apps/api/src/routes/student/final-decision.ts`

Keputusan akhir kelayakan keberangkatan mahasiswa.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Keputusan evaluator dibuat | `AKADEMIK.EVALUATOR_DECISION` | `details.decision`, `details.evaluatorId` |
| Status finalisasi berubah | `AKADEMIK.FINALIZATION_CHANGED` | `oldValue`, `newValue` |

---

## Panel: KEHADIRAN (Attendance)

### TASK 2.13 — Audit Absensi Individual

**File:** `apps/api/src/routes/attendance.ts`

Perubahan data kehadiran oleh dosen/admin harus dicatat, terutama perubahan setelah submit awal.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Absensi dibuat | `ATTENDANCE.CREATED` | `details.studentId`, `details.meetingId`, `details.status` |
| Absensi diupdate | `ATTENDANCE.UPDATED` | `oldValue.status`, `newValue.status`, `details.reason` |
| Absensi dihapus | `ATTENDANCE.DELETED` | `oldValue` = snapshot |

---

### TASK 2.14 — Audit Bulk Attendance

**File:** `apps/api/src/routes/attendance.ts`

Operasi bulk input absensi (satu pertemuan, banyak mahasiswa).

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Bulk absensi dibuat | `ATTENDANCE.BULK_CREATED` | `details.meetingId`, `details.count`, `details.courseId` |
| Bulk absensi diupdate | `ATTENDANCE.BULK_UPDATED` | `details.meetingId`, `details.count` |

> **Catatan:** Untuk bulk, jangan simpan `oldValue`/`newValue` per-mahasiswa (terlalu besar). Cukup simpan ringkasan: meetingId, courseId, jumlah record yang terpengaruh, dan userId yang melakukan.

---

## Panel: PA (Pembimbing Akademik)

### TASK 2.15 — Audit Konsultasi & Catatan PA

**File:** `apps/api/src/routes/student/pa.ts`

Catatan konsultasi antara PA dan mahasiswa.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Catatan konsultasi ditambah | `PA.CONSULTATION_ADDED` | `details.studentId`, `details.consultationId` |
| Catatan konsultasi diupdate | `PA.CONSULTATION_UPDATED` | `oldValue.notes`, `newValue.notes` |
| Catatan konsultasi dihapus | `PA.CONSULTATION_DELETED` | `oldValue` = snapshot |
| Mahasiswa di-assign ke PA | `PA.STUDENT_ASSIGNED` | `details.studentId`, `details.paUserId` |
| Assignment PA diubah | `PA.ASSIGNMENT_CHANGED` | `oldValue.paId`, `newValue.paId` |

---

## Panel: MAGANG (Internship)

### TASK 2.16 — Audit Status & Data Magang

**File:** `apps/api/src/routes/magang.ts`

Status magang (misal: mendaftar → proses → aktif → selesai) adalah milestone penting.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Status magang berubah | `MAGANG.STATUS_CHANGED` | `oldValue.status`, `newValue.status` |
| Data magang diupdate | `MAGANG.DATA_UPDATED` | `oldValue`, `newValue` |
| Dokumen magang diupload | `MAGANG.DOCUMENT_UPLOADED` | `details.documentKey`, `details.fileId` |
| Assessment keberangkatan diupdate | `MAGANG.ASSESSMENT_UPDATED` | `oldValue`, `newValue` |

---

## Panel: CRM

### TASK 2.17 — Audit CRM Stage & Catatan

**File:** Route CRM yang relevan di `mahasiswa.ts` atau handler CRM

CRM digunakan untuk tracking pipeline calon mahasiswa.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Stage CRM berubah | `CRM.STAGE_CHANGED` | `oldValue.stage`, `newValue.stage` |
| Catatan CRM ditambah | `CRM.NOTE_ADDED` | `details.leadId`, ringkasan note |
| Data kontak CRM diupdate | `CRM.CONTACT_UPDATED` | `oldValue`, `newValue` |
| Lead CRM dikonversi menjadi mahasiswa | `CRM.CONVERTED_TO_STUDENT` | `details.leadId`, `details.studentId` |

---

## Panel: MATA KULIAH

### TASK 2.18 — Audit CRUD Mata Kuliah

**File:** `apps/api/src/routes/courses.ts`

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Mata kuliah dibuat | `COURSES.CREATED` | `newValue` = data course |
| Mata kuliah diupdate | `COURSES.UPDATED` | `oldValue`, `newValue` |
| Mata kuliah dihapus | `COURSES.DELETED` | `oldValue` = snapshot |

---

## Panel: PENJADWALAN (Scheduling)

### TASK 2.19 — Audit CRUD Jadwal

**File:** `apps/api/src/routes/scheduling.ts`

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Jadwal dibuat | `SCHEDULING.CREATED` | `newValue` = data jadwal |
| Jadwal diupdate | `SCHEDULING.UPDATED` | `oldValue`, `newValue` |
| Jadwal dihapus | `SCHEDULING.DELETED` | `oldValue` = snapshot |
| Pertemuan (meeting) ditambahkan | `SCHEDULING.MEETING_CREATED` | `details.scheduleId`, `details.meetingId` |
| Pertemuan dihapus | `SCHEDULING.MEETING_DELETED` | `oldValue` = snapshot |

---

## Panel: USERS (Manajemen Pengguna)

### TASK 2.20 — Audit CRUD Users

**File:** `apps/api/src/routes/users.ts`

Manajemen akun pengguna sistem (admin, dosen, staf) adalah operasi sangat sensitif.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| User baru dibuat | `USERS.CREATED` | `newValue` = data user (TANPA `passwordHash`) |
| Data user diupdate | `USERS.UPDATED` | `oldValue`, `newValue` (keduanya TANPA `passwordHash`) |
| User dihapus | `USERS.DELETED` | `oldValue` = snapshot (TANPA `passwordHash`) |
| Role/permission user berubah | `USERS.ROLE_CHANGED` | `oldValue.role`, `newValue.role`, `oldValue.roles`, `newValue.roles` |
| Password user direset/diubah | `USERS.PASSWORD_CHANGED` | `details.changedBy` saja — JANGAN simpan password lama/baru |

---

## Panel: SETTINGS

### TASK 2.21 — Audit Perubahan Pengaturan Sistem

**File:** `apps/api/src/routes/settings.ts`

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| Pengaturan sistem diubah | `SETTINGS.UPDATED` | `oldValue.settingKey`, `newValue.settingValue` |

---

## Panel: FILE UPLOAD

### TASK 2.22 — Audit Upload & Delete File

**File:** `apps/api/src/modules/file/` (service dan route handler)

File adalah aset digital mahasiswa — setiap operasi harus tercatat.

**Events:**

| Event | Action | Keterangan |
|---|---|---|
| File berhasil diupload | `FILE.UPLOADED` | `details.fileId`, `details.panel`, `details.documentKey`, `details.mimeType`, `details.size` |
| File dihapus | `FILE.DELETED` | `details.fileId`, `details.originalName`, `details.panel` |
| File diverifikasi | `FILE.VERIFIED` | `details.fileId`, `details.verifiedBy` |
| File ditolak verifikasi | `FILE.REJECTED` | `details.fileId`, `details.reason` |

> **Larangan ketat:** Jangan pernah menyimpan isi file, path lengkap storage internal, atau checksum detail di `newValue`. Cukup simpan metadata identifikasi.

---

## Fase 3 — API Route Audit Log (Baca & Filter)

### TASK 3.1 — Endpoint GET `/api/audit-logs`

**File baru:** `apps/api/src/routes/audit-logs.ts`

Buat endpoint untuk membaca audit log dengan fitur filtering:

**Query params yang didukung:**
- `module` — filter by panel
- `action` — filter by action string
- `userId` — filter by who did the action
- `resourceType` + `resourceId` — filter by resource
- `dateFrom`, `dateTo` — filter by date range
- `page`, `limit` — pagination (default limit 50, max 200)

**Akses:** Hanya `superadmin` dan role yang relevan per modul.

---

### TASK 3.2 — Endpoint GET `/api/audit-logs/:resourceType/:resourceId`

**File:** `apps/api/src/routes/audit-logs.ts`

Endpoint untuk melihat history lengkap satu resource tertentu.

Contoh use case:
- `GET /api/audit-logs/student/123` → semua perubahan pada mahasiswa id 123
- `GET /api/audit-logs/payment/456` → semua perubahan pada payment id 456

Respons diurutkan `createdAt DESC` dan disertai informasi `fullName` user yang melakukan aksi (JOIN dengan tabel `users`).

---

## Fase 4 — UI Viewer (Frontend)

### TASK 4.1 — Komponen `AuditLogTable`

**File baru:** `apps/web/src/components/audit/AuditLogTable.tsx`

Komponen tabel reusable untuk menampilkan audit log dengan kolom:

| Kolom | Keterangan |
|---|---|
| Waktu | Format: `DD MMM YYYY, HH:mm:ss` |
| Dilakukan oleh | `fullName` + role (dari relasi `userId`) |
| Aksi | Badge berwarna berdasarkan jenis aksi (CREATE = hijau, UPDATE = kuning, DELETE = merah, AUTH = biru) |
| Modul | Badge modul/panel |
| Resource | `resourceType` + `resourceId` sebagai clickable link |
| Detail | Expandable row untuk menampilkan `oldValue` vs `newValue` diff |

---

### TASK 4.2 — Komponen `AuditLogDiff`

**File baru:** `apps/web/src/components/audit/AuditLogDiff.tsx`

Komponen untuk menampilkan perbandingan `oldValue` vs `newValue` secara visual.

- Tampilkan dalam format key-value
- Field yang berubah di-highlight (warna berbeda untuk value lama dan value baru)
- Field yang tidak berubah ditampilkan abu-abu/redup
- Untuk DELETE, tampilkan semua field dari `oldValue` dengan warna merah
- Untuk CREATE, tampilkan semua field dari `newValue` dengan warna hijau

---

### TASK 4.3 — Halaman Audit Log Global (`/dashboard/audit-log`)

**File baru:** `apps/web/src/app/dashboard/audit-log/page.tsx`

Halaman khusus audit log yang hanya dapat diakses oleh `superadmin`.

Fitur:
- Filter by modul, action, user, date range
- Tabel `AuditLogTable` dengan pagination
- Export ke CSV (opsional, bisa dijadikan task tersendiri)

---

### TASK 4.4 — Tab Audit Log di Detail Mahasiswa

**Lokasi:** Di halaman/panel detail mahasiswa (students detail page/drawer)

Tambahkan tab "Riwayat Perubahan" yang memanggil endpoint `GET /api/audit-logs/student/:studentId` dan menampilkan `AuditLogTable` yang sudah difilter.

Ini memungkinkan admin/staf melihat siapa yang mengubah data mahasiswa tertentu tanpa harus ke halaman audit log global.

---

### TASK 4.5 — Widget Audit Terbaru di Dashboard Superadmin

**File:** `apps/web/src/app/dashboard/page.tsx` atau komponen dashboard

Widget kecil yang menampilkan 10 aktivitas audit terbaru, sebagai ringkasan aktivitas sistem real-time.

---

## Aturan & Prinsip yang Harus Dijaga

### Data Sensitif — DILARANG MASUK AUDIT LOG

```
Tidak boleh di-log:
- password
- passwordHash
- JWT token / access token / refresh token
- API key / secret
- Isi lengkap dokumen atau file
- Data pribadi mahasiswa yang tidak relevan dengan perubahan
```

### Cara Aman Menyimpan oldValue/newValue

Sebelum menyimpan, selalu gunakan sanitization helper dari `auditService` yang secara otomatis strip field sensitif.

Jangan pernah menyimpan seluruh object tanpa filter — hanya simpan field yang relevan dengan perubahan.

### Audit Log Bersifat Immutable

- Tidak ada endpoint DELETE atau UPDATE untuk `audit_logs`
- Tidak ada soft delete pada tabel ini
- Superadmin pun tidak boleh menghapus audit log melalui aplikasi
- Retensi data: minimal 1 tahun, dapat dikonfigurasi

### Audit Harus Non-Blocking

Setiap pemanggilan `auditService.log()` harus dijalankan secara fire-and-forget. Response ke user tidak boleh tertunda karena proses audit gagal.

```
// BENAR — non-blocking
auditService.log({ ... }).catch(console.error);

// SALAH — blocking, jika audit gagal maka operasi utama juga gagal
await auditService.log({ ... });
```

---

## Urutan Pengerjaan yang Disarankan

```
Fase 1 (Fondasi) — selesaikan semua task 1.1 s/d 1.5 dulu

   ↓

Fase 2, urutan prioritas tinggi → rendah:
  AUTH (2.1)       — sudah ada, hanya refactor
  FINANCE (2.9, 2.10)     — data paling sensitif
  STUDENT CORE (2.2 s/d 2.6) — volume perubahan terbesar
  USERS (2.20)     — operasi keamanan
  PMB (2.7, 2.8)
  AKADEMIK (2.11, 2.12)
  ATTENDANCE (2.13, 2.14)
  PA (2.15)
  MAGANG (2.16)
  FILE (2.22)
  CRM (2.17)
  COURSES (2.18)
  SCHEDULING (2.19)
  SETTINGS (2.21)

   ↓

Fase 3 (API Read) — Task 3.1 dan 3.2

   ↓

Fase 4 (UI) — Task 4.1 s/d 4.5
```

---

## Checklist Verifikasi per Panel

Setelah setiap task Fase 2, verifikasi dengan checklist ini:

- [ ] Semua endpoint CRUD di panel tersebut sudah memanggil `auditService.log()`
- [ ] `oldValue` diambil sebelum operasi update/delete
- [ ] Field sensitif sudah di-strip dari `oldValue`/`newValue`
- [ ] `auditService.log()` dipanggil secara non-blocking (fire-and-forget)
- [ ] Action string menggunakan konstanta dari `audit-actions.ts` (bukan hardcoded string)
- [ ] `module` dan `resourceType` diisi dengan benar
- [ ] `ipAddress` dan `userAgent` diisi dari `extractRequestMeta()`
- [ ] Bisa diverifikasi di DB: `SELECT * FROM audit_logs WHERE module = '...' ORDER BY created_at DESC LIMIT 10`

---

## Catatan Tambahan

**Tentang `requestId`:**
Untuk implementasi awal, `requestId` bisa di-generate di dalam `auditService.log()` menggunakan `crypto.randomUUID()` jika tidak disediakan dari luar. Nanti bisa dikembangkan agar `requestId` dibuat di middleware HTTP dan di-propagate ke semua layer.

**Tentang `oldValue` pada bulk operation:**
Untuk operasi bulk (misal: bulk attendance), tidak praktis menyimpan snapshot per-record. Cukup simpan ringkasan operasi: berapa record yang terpengaruh, pada meeting apa, oleh siapa. Detail per-record bisa direkonstruksi dari data attendance itu sendiri.

**Tentang retensi:**
Untuk saat ini, tidak perlu implementasi auto-delete. Cukup dicatat dalam dokumentasi bahwa tabel `audit_logs` direncanakan untuk di-archive setelah 1 tahun ke cold storage atau dipartisi per tahun.
