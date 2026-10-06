# Unit Test Implementation Plan — Nusadaya Dashboard

> Dokumen ini adalah panduan implementasi unit test untuk seluruh panel dashboard Nusadaya.
> Setiap task bersifat mandiri dan dapat dikerjakan secara terpisah per panel.
> Urutan pengerjaan mengikuti lapisan dependency: utility -> business logic -> panel logic -> API routes.

---

## Prinsip Dasar

- Jangan uji database langsung - gunakan mock/stub untuk repository layer
- Fokus pada business logic - bukan rendering UI atau CSS
- Pola AAA - Arrange, Act, Assert pada setiap test case
- Edge case wajib diuji - bukan hanya happy path
- Tool utama: bun:test untuk backend dan frontend utility
- Struktur folder test:

```
apps/
├── api/src/__tests__/unit/
├── api/src/__tests__/integration/
└── web/src/__tests__/unit/
```

---

## Tahap 0 — Setup dan Foundation

### Task 0.1 — Konfigurasi Test Runner Backend
- Pastikan bun:test tersedia di apps/api
- Buat script test di apps/api/package.json yang menjalankan bun test
- Buat folder apps/api/src/__tests__/unit/ dan integration/
- Buat file apps/api/src/__tests__/setup.ts untuk global test setup
- Verifikasi dengan satu test dummy yang menghasilkan PASS

### Task 0.2 — Konfigurasi Test Runner Frontend
- Pastikan bun:test tersedia di apps/web
- Buat script test di apps/web/package.json yang menjalankan bun test
- Buat folder apps/web/src/__tests__/unit/ dan utils/
- Verifikasi dengan satu test dummy yang menghasilkan PASS

### Task 0.3 — Buat Helper dan Mock Factory
- Buat mockUser.ts untuk membuat objek user palsu berdasarkan role
- Buat mockDb.ts untuk stub/mock repository Drizzle ORM
- Buat mockStore.ts untuk mock Zustand store di frontend

---

## Tahap 1 — Utility dan Validation Layer (Frontend)

### Panel Target: Semua panel (digunakan global)
### File: apps/web/src/utils/form-validators.ts

---

#### Task 1.1 — filterNumeric()

Tujuan: Memastikan fungsi hanya menerima karakter angka dan memotong sesuai maxLength.

Sub-task:
- Uji: input berupa angka murni -> dikembalikan apa adanya
- Uji: input mengandung huruf -> huruf dihapus, hanya angka tersisa
- Uji: input melebihi maxLength -> dipotong tepat di batas maxLength
- Uji: input campuran angka + simbol -> simbol dihapus
- Uji: input string kosong -> kembalikan string kosong
- Uji: input tanpa maxLength -> tidak ada pemotongan
- Edge case: input hanya spasi -> kembalikan string kosong

---

#### Task 1.2 — filterPhone()

Tujuan: Memastikan fungsi hanya menerima digit dan '+' di posisi awal.

Sub-task:
- Uji: nomor valid dengan +62 di awal -> dikembalikan utuh
- Uji: '+' di tengah string -> '+' di tengah dihapus
- Uji: huruf di tengah -> dihapus
- Uji: melebihi maxLength default 15 -> dipotong
- Uji: input hanya '+' -> dikembalikan '+'
- Uji: input kosong -> dikembalikan string kosong

---

#### Task 1.3 — filterAlphaNumeric()

Tujuan: Memastikan hanya huruf, angka, dan underscore yang lolos.

Sub-task:
- Uji: input valid dengan underscore -> dikembalikan utuh
- Uji: input mengandung spasi -> spasi dihapus
- Uji: input mengandung simbol @ dan # -> dihapus
- Uji: allowUnderscore = false -> underscore juga dihapus
- Uji: melebihi maxLength -> dipotong

---

#### Task 1.4 — isValidEmail()

Tujuan: Memastikan validasi format email bekerja benar.

Sub-task:
- Uji: email valid user@example.com -> true
- Uji: email tanpa domain user@ -> false
- Uji: email tanpa TLD user@example -> false
- Uji: email dengan spasi -> false
- Uji: string kosong -> false
- Uji: email dengan subdomain user@mail.example.co.id -> true

---

#### Task 1.5 — validateIntegerRange()

Tujuan: Memastikan validasi rentang angka benar untuk semua kasus.

Sub-task:
- Uji: nilai dalam rentang -> isValid: true
- Uji: nilai di bawah min -> isValid: false, message berisi info min
- Uji: nilai di atas max -> isValid: false, message berisi info max
- Uji: nilai persis di min -> isValid: true
- Uji: nilai persis di max -> isValid: true
- Uji: input berupa string angka valid -> isValid: true
- Uji: input bukan angka 'abc' -> isValid: false

---

#### Task 1.6 — filterFinanceInteger()

Tujuan: Memastikan konversi ke integer bersih untuk panel keuangan.

Sub-task:
- Uji: input angka dengan pemisah ribuan '1.000.000' -> 1000000
- Uji: input angka bersih '999999' -> 999999
- Uji: melebihi 9 digit -> dipotong ke 9 digit pertama
- Uji: input kosong atau undefined -> kembalikan 0
- Uji: input hanya karakter non-digit -> kembalikan 0

---

### File: apps/web/src/utils/status.ts

---

#### Task 1.7 — calculateProgressStatus()

Tujuan: Memastikan penentuan status berdasarkan progres checklist benar.

Sub-task:
- Uji: isAcc = true -> selalu 'ACC' terlepas dari completed/total
- Uji: completed >= total dan tidak ACC -> 'AMAN'
- Uji: total = 0 -> 'AMAN' (edge case tidak ada item)
- Uji: completed/total * 100 > 30 -> 'PROSES'
- Uji: completed/total * 100 <= 30 -> 'BUTUH_PERHATIAN'
- Uji: completed = 0 dan total = 10 -> 'BUTUH_PERHATIAN'
- Uji: completed = 4 dan total = 10 yaitu 40 persen -> 'PROSES'

---

#### Task 1.8 — normalizeStatus()

Tujuan: Memastikan mapping status legacy/database ke kategori standar benar.

Sub-task:
- Uji: isAcc = true -> 'ACC'
- Uji: rawStatus = 'AMAN' -> 'AMAN'
- Uji: rawStatus = 'ACC' -> 'ACC'
- Uji: rawStatus = 'PROSES' -> 'PROSES'
- Uji: rawStatus = 'PERLU_PERHATIAN' -> 'PROSES' (alias legacy)
- Uji: rawStatus = 'TIDAK_AMAN' -> 'BUTUH_PERHATIAN'
- Uji: rawStatus = 'BLOCKING' -> 'BUTUH_PERHATIAN'
- Uji: rawStatus = 'KENDALA' -> 'BUTUH_PERHATIAN'
- Uji: rawStatus = null atau undefined -> 'BUTUH_PERHATIAN'
- Uji: rawStatus = nilai tidak dikenal -> 'PROSES' (default fallback)

---

#### Task 1.9 — calculateOverallStatus()

Tujuan: Memastikan kalkulasi status keseluruhan dari array modul benar dengan aturan prioritas.

Sub-task:
- Uji: semua modul 'ACC' -> 'ACC'
- Uji: ada satu modul 'BUTUH_PERHATIAN' -> 'BUTUH_PERHATIAN' (prioritas tertinggi)
- Uji: ada satu modul 'PROSES' sisanya 'ACC' -> 'PROSES'
- Uji: kombinasi 'AMAN' dan 'ACC' -> 'AMAN'
- Uji: array kosong -> 'AMAN'
- Uji: modul berupa objek dengan isAcc: true -> diperlakukan sebagai 'ACC'
- Uji: modul berupa objek dengan status: 'PROSES' -> diperlakukan sebagai 'PROSES'

---

## Tahap 2 — Authorization dan Permission Layer (Backend)

### Panel Target: Semua panel (security-critical)
### File: apps/api/src/lib/permissions.ts

---

#### Task 2.1 — getUserRoles()

Tujuan: Memastikan pengumpulan semua role dari user object benar.

Sub-task:
- Uji: user dengan role 'crm' -> kembalikan array ['crm']
- Uji: user dengan roles array ['pmb', 'crm'] -> kembalikan keduanya
- Uji: user dengan role duplikat di roles -> hanya muncul sekali karena Set dedup
- Uji: user null -> kembalikan array kosong
- Uji: user dengan role huruf besar 'CRM' -> dinormalisasi ke lowercase 'crm'

---

#### Task 2.2 — hasRole() — SECURITY CRITICAL

Tujuan: Memastikan pemeriksaan role untuk otorisasi benar.

Sub-task:
- Uji: superadmin selalu mendapat akses ke role apapun -> true
- Uji: user role 'crm' mengakses resource role 'crm' -> true
- Uji: user role 'crm' mengakses resource role 'pmb' -> false
- Uji: user null -> selalu false
- Uji: user dengan roles array mengandung role yang dicek -> true
- Uji: pengecekan multi-role hasRole(user, 'crm', 'pmb') user punya 'crm' -> true
- Uji: pengecekan case-insensitive role 'CRM' vs required 'crm' -> true

---

## Tahap 3 — Panel Business Logic

---

### Panel: CRM (CrmPanel.tsx)

---

#### Task 3.1 — CRM Checklist Completion Count

Tujuan: Memastikan kalkulasi completedCount dari 10 indikator CRM benar.

CATATAN: Ekstrak logic ini ke pure function sebelum membuat test.

Sub-task:
- Uji: semua 10 indikator true -> completedCount = 10
- Uji: tidak ada indikator aktif -> completedCount = 0
- Uji: isMonitoringParent = true sisanya false -> completedCount = 1
- Uji: ODS menggunakan fallback dari odsList[n].isDone jika isOdsNReport = false -> dihitung
- Uji: ODS flag isOds1Report dan odsList[0].isDone sama-sama true -> hanya dihitung 1 tidak dobel
- Uji: partial completion 5 dari 10 -> completedCount = 5

---

#### Task 3.2 — CRM handleUpdateCrmField()

Tujuan: Memastikan immutable update pada state CRM benar.

Sub-task:
- Uji: update field yang ada -> field diperbarui, field lain tidak berubah
- Uji: update field baru yang belum ada -> field baru ditambahkan
- Uji: state null sebelum update -> state tetap null tidak crash
- Uji: update field dengan value false -> field diset ke false bukan dihapus

---

### Panel: PMB (PmbPanel.tsx)

---

#### Task 3.3 — PMB Checklist Completion Count (16 Item Wajib)

Tujuan: Memastikan kalkulasi totalRequiredCompleted16 dari 4 checklist utama ditambah 12 dokumen wajib benar.

CATATAN: Ekstrak logic ini ke pure function sebelum membuat test.

Sub-task:
- Uji: formReceived, documentsComplete, dataInputted, initialFollowUp semua true -> mainCompletedCount = 4
- Uji: semua 12 dokumen wajib true -> requiredDocsCompletedCount = 12
- Uji: kombinasi lengkap -> totalRequiredCompleted16 = 16, isAllChecklistDone = true
- Uji: hanya 15 dari 16 yang selesai -> isAllChecklistDone = false
- Uji: tidak ada yang selesai -> totalRequiredCompleted16 = 0
- Edge case: pmbData = null atau undefined -> totalRequiredCompleted16 = 0, tidak crash

---

#### Task 3.4 — PMB isAllChecklistDone ACC Gate

Tujuan: Memastikan ACC hanya bisa diberikan jika 16/16 item selesai.

Sub-task:
- Uji: 16/16 selesai -> isAllChecklistDone = true -> tombol ACC aktif
- Uji: 15/16 selesai -> isAllChecklistDone = false -> tombol ACC disabled
- Uji: 0/16 selesai -> isAllChecklistDone = false

---

### Panel: Finance (FinancePanel.tsx)

---

#### Task 3.5 — Finance Checklist Metode Pembayaran Talangan vs Mandiri

Tujuan: Memastikan logic penentuan item checklist berdasarkan metodePembayaran benar.

CATATAN: Ekstrak logic isTalangan, isSemesterDone, isInterviewDone, isKeberangkatanDone ke pure function.

Sub-task:
- Uji: metodePembayaran = 'dana_talangan' -> isTalangan = true
- Uji: metodePembayaran = 'mandiri' -> isTalangan = false
- Uji: talangan -> isSemesterDone menggunakan t1SemesterStatus ATAU mandiriSemesterStatus
- Uji: mandiri -> isSemesterDone hanya menggunakan mandiriSemesterStatus
- Uji: talangan -> isInterviewDone menggunakan t1InterviewStatus
- Uji: mandiri -> isInterviewDone menggunakan mandiriInterviewStatus
- Uji: talangan -> isKeberangkatanDone menggunakan t2KeberangkatanStatus
- Uji: mandiri -> isKeberangkatanDone menggunakan mandiriKeberangkatanStatus

---

#### Task 3.6 — Finance Checklist Completion Count (6 Item)

Tujuan: Memastikan kalkulasi dari 6 item tagihan pokok benar.

Sub-task:
- Uji: semua 6 item lunas -> completedCount = 6, isFinanceReady = true
- Uji: registrasi belum lunas -> isFinanceReady = false
- Uji: TOEIC dan paspor saja yang belum -> completedCount = 4
- Uji: tidak ada yang lunas -> completedCount = 0
- Edge case: finState = null -> completedCount = 0, tidak crash

---

### Panel: Akademik (AkademikPanel.tsx)

---

#### Task 3.7 — Akademik Checklist Base vs Taiwan Cohort

Tujuan: Memastikan checklist akademik ditambah item Taiwan ketika taiwanCohort = true.

CATATAN: Ekstrak logic penyusunan checklist ke pure function sebelum test.

Sub-task:
- Uji: taiwanCohort = false -> checklist hanya berisi 7 item base
- Uji: taiwanCohort = true -> checklist berisi 7 ditambah 12 = 19 item
- Uji: taiwanLoaChecked hanya bisa di-check setelah taiwanLolChecked = true yaitu forceDisabled
- Uji: taiwanSuhhanChecked hanya bisa di-check setelah taiwanLoaChecked = true yaitu forceDisabled
- Uji: taiwanLolChecked = false -> taiwanLoaChecked memiliki forceDisabled = true

---

#### Task 3.8 — Akademik getGpaGrade()

Tujuan: Memastikan konversi GPA scaled ke grade huruf benar.

Sub-task:
- Uji: gpaScaled = 370 yaitu GPA 3.70 -> grade 'A'
- Uji: gpaScaled = 350 yaitu GPA 3.50 -> grade 'B+'
- Uji: gpaScaled = 310 yaitu GPA 3.10 -> grade 'B'
- Uji: gpaScaled = 280 yaitu GPA 2.80 -> grade 'C+'
- Uji: gpaScaled = 250 yaitu GPA 2.50 -> grade 'C'
- Uji: gpaScaled = 150 yaitu GPA 1.50 -> grade 'D'
- Edge case: gpaScaled = 0 -> grade 'D'
- Edge case: gpaScaled = 400 yaitu GPA 4.00 -> grade 'A'
- Boundary: nilai persis 370 scaled -> grade 'A'
- Boundary: nilai 369 scaled yaitu 3.69 -> grade 'B+'

---

#### Task 3.9 — Akademik Status Badge Logic

Tujuan: Memastikan badge status AMAN, PERLU PERHATIAN, TIDAK AMAN benar berdasarkan persentase checklist.

Sub-task:
- Uji: completedCount sama dengan checklist.length -> status 'AMAN'
- Uji: completedCount >= floor(checklist.length / 2) tapi tidak 100 persen -> 'PERLU PERHATIAN'
- Uji: completedCount < floor(checklist.length / 2) -> 'TIDAK AMAN'
- Uji: completedCount = 0 -> 'TIDAK AMAN'

---

### Panel: PA Pembimbing Akademik (PaPanel.tsx)

---

#### Task 3.10 — PA Checklist Completion Count (3 Item)

Tujuan: Memastikan kalkulasi dari 3 indikator PA benar.

Sub-task:
- Uji: counselingDone = true, mentalStable = true, disciplineGood = true -> completedCount = 3, isAllChecksDone = true
- Uji: hanya counselingDone = true -> completedCount = 1, isAllChecksDone = false
- Uji: semua false -> completedCount = 0
- Edge case: paData = null -> completedCount = 0, tidak crash

---

#### Task 3.11 — PA Role Permission

Tujuan: Memastikan izin edit PA hanya untuk role 'pa', 'akademik', dan 'superadmin'.

Sub-task:
- Uji: user role 'pa' -> canEdit = true
- Uji: user role 'akademik' -> canEdit = true
- Uji: user role 'superadmin' -> canEdit = true
- Uji: user role 'crm' -> canEdit = false
- Uji: user role 'finance' -> canEdit = false
- Uji: user null -> canEdit = false

---

### Panel: Internship Magang (InternshipPanel.tsx)

---

#### Task 3.12 — Internship Pra-Paspor Checklist (16 Item)

Tujuan: Memastikan kalkulasi kelengkapan dokumen pra-paspor benar.

Sub-task:
- Uji: semua 16 item pra-paspor true -> praPasporCompleted = 16
- Uji: tidak ada item -> praPasporCompleted = 0
- Uji: partial 10 dari 16 item -> praPasporCompleted = 10
- Edge case: internshipData = null -> tidak crash, praPasporCompleted = 0

---

#### Task 3.13 — Internship Main Flow Checklist

Tujuan: Memastikan kalkulasi tahap utama magang (passport, interview, LOL, LOA, MOA, contract, MCU, visa, tiket) benar.

Sub-task:
- Uji: passportReady = true -> dihitung sebagai completed
- Uji: interviewReady = true dan interviewResult ada -> dihitung
- Uji: lolReady = true -> dihitung
- Uji: loaConfirmed = true -> dihitung
- Uji: visaReady = true -> dihitung
- Uji: ticketReady = true -> dihitung
- Uji: semua tahap utama selesai -> isInternshipReady = true

---

### Panel: Status Overview (StatusPanel.tsx)

---

#### Task 3.14 — Status Panel Overall Status Aggregation

Tujuan: Memastikan status keseluruhan mahasiswa dihitung berdasarkan status semua panel dengan benar.

Sub-task:
- Uji: semua panel isAcc = true -> overall 'ACC'
- Uji: satu panel 'BUTUH_PERHATIAN' -> overall 'BUTUH_PERHATIAN'
- Uji: satu panel 'PROSES' sisanya 'ACC' -> overall 'PROSES'
- Uji: semua panel 'AMAN' -> overall 'AMAN'
- Uji: campuran 'AMAN' dan 'ACC' -> overall 'AMAN'

---

### Panel: Final Decision (FinalDecisionPanel.tsx)

---

#### Task 3.15 — Final Decision Keputusan Config Mapping

Tujuan: Memastikan mapping evaluatorDecision ke konfigurasi tampilan benar.

Sub-task:
- Uji: evaluatorDecision = 'menunggu' -> label 'Menunggu Evaluasi', color 'slate'
- Uji: evaluatorDecision = 'lanjut_interview' -> label berisi kata interview
- Uji: evaluatorDecision = 'ttd_kontrak' -> label berisi kata kontrak
- Uji: evaluatorDecision = 'layak_berangkat' -> label berisi kata berangkat
- Uji: evaluatorDecision = 'remedial' -> label berisi kata remedial
- Uji: evaluatorDecision = null -> tidak crash, fallback ke state 'menunggu'

---

#### Task 3.16 — Final Decision ACC Gate dari Semua Panel

Tujuan: Memastikan Final Decision hanya bisa diproses jika semua panel sudah di-ACC.

Sub-task:
- Uji: pmbAcc, crmAcc, financeAcc, academicAcc, paAcc, internshipAcc semua isAcc = true -> dapat berikan keputusan
- Uji: salah satu panel belum ACC -> keputusan final di-block
- Uji: dosenAcc.isAcc belum -> block jika berlaku pada alur direktur
- Uji: isApprovedByDirector = false -> keputusan belum final

---

## Tahap 4 — API Route Logic (Backend)

---

### File: apps/api/src/lib/auth-rate-limit.ts

---

#### Task 4.1 — Rate Limiter Logic

Tujuan: Memastikan logic rate limiting mencegah request berlebih dalam window waktu tertentu.

Sub-task:
- Uji: request pertama dalam window -> diizinkan
- Uji: request ke-N tepat di batas -> diizinkan
- Uji: request melebihi batas dalam window -> ditolak
- Uji: setelah window time reset -> request kembali diizinkan
- Uji: IP yang berbeda -> counter terpisah, tidak saling mempengaruhi

---

#### Task 4.2 — Session Logic

Tujuan: Memastikan pembuatan dan validasi session benar.

Sub-task:
- Uji: session valid dengan user yang benar -> token diterima
- Uji: session expired -> ditolak
- Uji: session tidak ada di store -> ditolak
- Uji: token dari user lain -> tidak bisa digunakan untuk user berbeda

---

### File: apps/api/src/routes/mahasiswa.ts

---

#### Task 4.3 — Mahasiswa Route Validasi Input

Tujuan: Memastikan input validation menolak data tidak valid.

Sub-task:
- Uji: NIM kosong -> 400 Bad Request
- Uji: email format tidak valid -> 400 Bad Request
- Uji: NIM melebihi panjang maksimal -> 400 Bad Request
- Uji: studentStatus mengandung nilai di luar enum -> 400 Bad Request
- Uji: input valid lengkap -> diteruskan ke service tanpa error

---

#### Task 4.4 — Mahasiswa Route Authorization Guard

Tujuan: Memastikan hanya user dengan role yang tepat yang bisa mengakses endpoint.

Sub-task:
- Uji: request tanpa token -> 401 Unauthorized
- Uji: request dengan token expired -> 401 Unauthorized
- Uji: user 'crm' mengakses endpoint khusus 'akademik' -> 403 Forbidden
- Uji: superadmin mengakses semua endpoint -> 200 OK
- Uji: user dengan role yang benar -> 200 OK

---

#### Task 4.5 — GET /students/:id/academic

Tujuan: Memastikan respons data akademik mahasiswa benar.

Sub-task:
- Uji: studentId valid dan mahasiswa ada -> data dikembalikan dengan format benar
- Uji: studentId tidak ada di database -> 404 Not Found
- Uji: studentId bukan angka -> 400 Bad Request

---

#### Task 4.6 — POST /students/:id/academic/acc

Tujuan: Memastikan ACC hanya bisa diberikan oleh role yang tepat.

Sub-task:
- Uji: user bukan 'akademik' atau 'superadmin' -> 403 Forbidden
- Uji: user 'akademik' -> 200 OK, status isAcc berubah true
- Uji: ACC sudah ada -> respons idempotent atau 409 Conflict

---

### File: apps/api/src/routes/attendance.ts

---

#### Task 4.7 — Attendance Perhitungan Persentase Kehadiran

Tujuan: Memastikan kalkulasi persentase kehadiran benar.

CATATAN: Ekstrak logic kalkulasi ke pure function.

Sub-task:
- Uji: 10 hadir dari 10 pertemuan -> 100 persen
- Uji: 0 hadir dari 10 pertemuan -> 0 persen
- Uji: 5 hadir dari 10 pertemuan -> 50 persen
- Uji: status 'izin' dan 'sakit' -> sesuaikan dengan business rule apakah dihitung hadir
- Uji: totalMeetings = 0 -> 0 persen atau default value, tidak crash karena division by zero

---

#### Task 4.8 — Attendance Validasi Input Absensi

Tujuan: Memastikan status kehadiran hanya menerima nilai enum yang valid.

Sub-task:
- Uji: status 'hadir' -> valid
- Uji: status 'izin' -> valid
- Uji: status 'sakit' -> valid
- Uji: status 'alpa' -> valid
- Uji: status 'bolos' tidak ada di enum -> ditolak
- Uji: status kosong -> ditolak

---

### File: apps/api/src/routes/finance.ts

---

#### Task 4.9 — Finance Validasi Metode Pembayaran

Tujuan: Memastikan validasi skema pembayaran benar.

Sub-task:
- Uji: metodePembayaran = 'dana_talangan' -> valid
- Uji: metodePembayaran = 'mandiri' -> valid
- Uji: metodePembayaran = 'cicilan' tidak terdaftar -> ditolak
- Uji: nilai kosong -> ditolak

---

#### Task 4.10 — Finance Kalkulasi Status Tagihan

Tujuan: Memastikan status tagihan lunas dievaluasi berdasarkan payment method.

Sub-task:
- Uji: talangan + t1SemesterStatus = true -> semester dianggap lunas
- Uji: mandiri + mandiriSemesterStatus = false -> semester belum lunas
- Uji: registrasiStatus = true -> registrasi dianggap selesai
- Uji: semua 6 tagihan pokok lunas -> isFinanceReady = true

---

### File: apps/api/src/routes/courses.ts

---

#### Task 4.11 — Courses Kalkulasi Nilai Akhir Mata Kuliah

Tujuan: Memastikan kalkulasi nilai akhir dari komponen UTS + UAS + tugas benar sesuai bobot.

Sub-task:
- Uji: UTS 80 + UAS 90 + Tugas 85 dengan bobot standar -> nilai akhir sesuai formula
- Uji: salah satu komponen nol -> kalkulasi tetap benar
- Uji: semua komponen 100 -> nilai sempurna
- Uji: semua komponen 0 -> nilai 0

---

## Tahap 5 — Zustand Store (Frontend State)

### File: apps/web/src/store/index.ts

---

#### Task 5.1 — Auth Store Initial State

Tujuan: Memastikan state awal auth store benar sebelum ada aksi apapun.

Sub-task:
- Uji: initial state -> user = null, token = null

---

#### Task 5.2 — Auth Store setUser() dan logout()

Tujuan: Memastikan update user dan proses logout mengubah state dengan benar.

Sub-task:
- Uji: setUser(userData, token) -> user dan token diperbarui
- Uji: logout() -> user = null, token = null
- Uji: logout() setelah setUser() -> state kembali ke initial

---

#### Task 5.3 — hasRole() Frontend Version

Tujuan: Memastikan pemeriksaan role di store konsisten dengan backend.

Sub-task:
- Uji: user superadmin -> hasRole(user, 'crm') = true
- Uji: user crm -> hasRole(user, 'crm') = true
- Uji: user crm -> hasRole(user, 'akademik') = false
- Uji: user null -> hasRole(null, 'crm') = false

---

## Tahap 6 — Integration Tests

Integration test menggunakan test database terpisah bukan production.
Buat DATABASE_URL_TEST di .env.test yang mengarah ke database test.
Reset data antar suite dengan beforeEach dan afterEach.

---

#### Task 6.1 — Integration POST /students + Database

Tujuan: Memastikan alur lengkap pembuatan mahasiswa baru dari API ke database benar.

Sub-task:
- Setup: gunakan test database yang di-reset setiap suite
- Uji: POST /students dengan body valid -> record tersimpan di DB -> 201 Created
- Uji: POST /students dengan NIM duplikat -> 409 Conflict
- Uji: GET /students/:id setelah POST -> data yang dikembalikan sesuai

---

#### Task 6.2 — Integration Academic ACC Flow

Tujuan: Memastikan alur ACC Akademik end-to-end dari API hingga perubahan state DB.

Sub-task:
- Uji: POST /students/:id/academic/acc -> isAcc = true tersimpan di DB
- Uji: DELETE /students/:id/academic/acc -> isAcc kembali ke false
- Uji: GET /students/:id/academic setelah ACC -> response mencerminkan perubahan

---

#### Task 6.3 — Integration Finance Checklist Complete ACC

Tujuan: Memastikan ACC finance hanya bisa diberikan jika 6/6 item lunas.

Sub-task:
- Setup: buat mahasiswa dengan 5/6 tagihan lunas
- Uji: POST /students/:id/finance/acc -> ditolak karena belum 6/6
- Update: lunaskan tagihan ke-6
- Uji: POST /students/:id/finance/acc -> berhasil 200 OK

---

#### Task 6.4 — Integration CRM Progress Sync

Tujuan: Memastikan progress CRM tersinkronisasi setelah update field.

Sub-task:
- Uji: update salah satu field CRM -> progress count berubah di response berikutnya
- Uji: GET /students/:id/crm -> field yang baru diupdate tercermin dalam data

---

## Tahap 7 — Regression dan Edge Case Tests

---

#### Task 7.1 — Null dan Undefined Safety

Tujuan: Memastikan semua function tidak crash ketika menerima data null dari API.

Sub-task:
- Uji: calculateProgressStatus(0, 0, null) -> tidak crash, kembalikan 'AMAN'
- Uji: normalizeStatus(null) -> tidak crash, kembalikan 'BUTUH_PERHATIAN'
- Uji: filterNumeric dengan input undefined -> tidak crash
- Uji: filterPhone dengan input null -> tidak crash

---

#### Task 7.2 — Boundary Value Tests Finance

Tujuan: Memastikan nilai batas keuangan diproses dengan benar.

Sub-task:
- Uji: nilai finance 999999999 yaitu maksimal 9 digit -> tersimpan benar
- Uji: nilai finance 1000000000 yaitu melebihi 9 digit -> dipotong atau ditolak
- Uji: nilai finance 0 -> dianggap belum lunas
- Uji: nilai finance negatif -> ditolak

---

#### Task 7.3 — Concurrent ACC Prevention

Tujuan: Memastikan tidak ada race condition saat dua admin mengirim ACC bersamaan.

Sub-task:
- Uji: dua request ACC bersamaan untuk mahasiswa yang sama -> hanya satu yang berhasil
- Uji: request kedua mengembalikan respons yang tepat bukan error 500

---

## Checklist Progress

| Tahap | Nama | Status |
|-------|------|--------|
| 0 | Setup dan Foundation | Belum |
| 1 | Utility dan Validation Frontend | Belum |
| 2 | Authorization dan Permission Backend | Belum |
| 3 | Panel Business Logic | Belum |
| 4 | API Route Logic Backend | Belum |
| 5 | Zustand Store Frontend | Belum |
| 6 | Integration Tests | Belum |
| 7 | Regression dan Edge Case | Belum |

---

## Catatan Implementasi

### Prinsip Ekstraksi Logic

Banyak business logic saat ini embedded langsung di component React (completedCount, isAllChecksDone, dsb).
Sebelum membuat test, ekstrak logic tersebut ke file utility/helper terpisah sehingga bisa diuji tanpa me-render component.

Pola refactoring yang disarankan:

  SEBELUM (tidak bisa diuji):
    Logic ada di dalam component CrmPanel atau FinancePanel secara langsung

  SESUDAH (bisa diuji):
    Logic dipindah ke apps/web/src/utils/crm-logic.ts
    Test ada di apps/web/src/__tests__/utils/crm-logic.test.ts

### Mock Strategy

- API calls (fetch, api.students...) — mock dengan Bun mock spy
- Zustand store — buat instance store baru di setiap test dengan beforeEach
- Database Drizzle — mock query menggunakan factory object, bukan database sungguhan
- toast dari sonner — mock agar tidak mengganggu output test dan tidak perlu DOM

### Target Coverage Priority

1. WAJIB: calculateProgressStatus, normalizeStatus, calculateOverallStatus, hasRole, getGpaGrade, semua validator di form-validators.ts
2. PENTING: Logic checklist per panel yaitu completedCount, isAllChecksDone, isTalangan
3. DIREKOMENDASIKAN: API route validation, rate limiter, session logic
4. OPSIONAL: Integration dan regression test setelah unit selesai
