
Tentu. **Logging** adalah salah satu bagian yang sebaiknya mulai kamu bangun sejak project masih berkembang, bukan baru ketika production sudah bermasalah.

Untuk **Nusadaya Akademi**, saya menyarankan kamu membayangkan logging sebagai **“black box recorder” aplikasi**: ketika terjadi sesuatu, kamu punya jejak yang cukup untuk mengetahui **apa yang terjadi, kapan, pada bagian mana, dan mengapa**.

## 1. Apa sebenarnya yang dilakukan logging?

Misalnya ada user melapor:

> "Saya sudah upload PDF assessment, tapi statusnya tidak berubah."

Tanpa logging, kamu mungkin harus menebak:

```text
Frontend?
   ↓
API?
   ↓
Validation?
   ↓
Database?
   ↓
File storage?
   ↓
Transaction?
```

Dengan logging:

```text
18:32:01 INFO  assessment.upload.started
18:32:01 INFO  file.validation.success
18:32:02 INFO  storage.upload.success
18:32:02 ERROR assessment.update.failed
18:32:02 ERROR database.timeout
```

Kamu langsung punya titik awal investigasi.

---

# 2. Jangan menggunakan `console.log()` sebagai sistem logging utama

Saat development, ini:

```typescript
console.log("student created");
```

memang berguna.

Tetapi production sebaiknya menggunakan **structured logging**.

Contohnya:

```json
{
  "level": "info",
  "event": "student.created",
  "studentId": "123",
  "userId": "456",
  "timestamp": "2026-09-04T18:32:01Z"
}
```

Keuntungannya adalah log dapat dicari dan difilter berdasarkan field.

Misalnya:

```text
event = "student.created"
userId = "456"
studentId = "123"
```

---

# 3. Bedakan level logging

Minimal kamu perlu memahami:

```text
DEBUG
INFO
WARN
ERROR
FATAL
```

### DEBUG

Informasi detail untuk development/troubleshooting.

```text
DEBUG student.service.findById
```

Biasanya tidak perlu aktif secara berlebihan di production.

### INFO

Peristiwa normal yang penting.

```text
INFO user.login.success
INFO student.created
INFO assessment.submitted
```

### WARN

Sesuatu yang tidak ideal tetapi aplikasi masih bisa berjalan.

```text
WARN cache.miss
WARN slow.database.query
WARN failed.login.attempt
```

### ERROR

Operasi gagal.

```text
ERROR assessment.upload.failed
ERROR database.query.failed
ERROR email.send.failed
```

### FATAL

Masalah serius yang membuat service tidak dapat berjalan normal.

```text
FATAL database.connection.unavailable
```

---

# 4. Apa saja yang sebaiknya di-log?

Tidak semua aktivitas perlu dicatat.

Untuk Nusadaya Akademi, saya akan membaginya menjadi beberapa kategori.

## Authentication

```text
user.login.success
user.login.failed
user.logout
password.reset.requested
password.reset.completed
```

Misalnya:

```json
{
  "level": "info",
  "event": "user.login.success",
  "userId": "123",
  "role": "admin"
}
```

---

## Authorization

Ini sangat penting.

Misalnya mahasiswa mencoba mengakses data yang bukan miliknya:

```text
authorization.denied
```

Log:

```json
{
  "level": "warn",
  "event": "authorization.denied",
  "userId": "123",
  "resource": "student:456",
  "action": "read"
}
```

Ini bisa membantu mendeteksi kesalahan permission maupun aktivitas mencurigakan.

---

# 5. Student Management

Misalnya:

```text
student.created
student.updated
student.deleted
student.status.changed
```

Contoh:

```json
{
  "level": "info",
  "event": "student.status.changed",
  "userId": "10",
  "studentId": "123",
  "from": "active",
  "to": "inactive"
}
```

Ini juga bisa menjadi **audit trail**, tetapi perlu dibedakan dari application log biasa.

---

# 6. Attendance

Misalnya:

```text
attendance.created
attendance.updated
attendance.deleted
attendance.bulk_created
```

Contoh:

```json
{
  "level": "info",
  "event": "attendance.created",
  "userId": "55",
  "studentId": "123",
  "status": "present"
}
```

---

# 7. Assessment

Karena assessment merupakan bagian penting dari sistemmu:

```text
assessment.created
assessment.updated
assessment.submitted
assessment.approved
assessment.rejected
assessment.file_uploaded
```

Misalnya:

```json
{
  "level": "info",
  "event": "assessment.submitted",
  "userId": "123",
  "assessmentId": "456"
}
```

---

# 8. File Upload

Ini juga sangat penting karena Nusadaya Akademi memiliki banyak PDF.

Log:

```text
file.upload.started
file.validation.failed
file.upload.success
file.upload.failed
file.deleted
```

Tetapi **jangan memasukkan isi file ke log**.

Cukup:

```json
{
  "level": "info",
  "event": "file.upload.success",
  "userId": "123",
  "fileType": "application/pdf",
  "fileSize": 2450000,
  "module": "assessment"
}
```

---

# 9. Database

Tidak perlu mencatat setiap query database.

Kalau kamu melakukan:

```text
SELECT * FROM students
```

ribuan kali dan semuanya dicatat, log malah menjadi beban.

Yang lebih berguna adalah mencatat kondisi abnormal.

Contohnya:

```text
database.query.slow
database.query.failed
database.connection.failed
database.transaction.rollback
```

Misalnya:

```json
{
  "level": "warn",
  "event": "database.query.slow",
  "durationMs": 2300,
  "operation": "student.list"
}
```

Kemudian kamu bisa mencari:

> "Kenapa halaman mahasiswa lambat?"

dan menemukan bahwa query tertentu membutuhkan 2,3 detik.

---

# 10. Request Logging

Ini salah satu logging paling penting untuk API.

Setiap request dapat memiliki informasi seperti:

```text
HTTP Method
URL
Status Code
Duration
User
Request ID
```

Contoh:

```text
GET /api/students
status=200
duration=180ms
user=123
requestId=req_abc123
```

Atau:

```json
{
  "level": "info",
  "event": "http.request.completed",
  "requestId": "req_abc123",
  "method": "GET",
  "path": "/api/students",
  "status": 200,
  "durationMs": 180
}
```

---

# 11. Request ID / Correlation ID

Ini konsep yang **sangat saya rekomendasikan** untuk project kamu.

Misalnya user melakukan:

```text
POST /api/assessment/submit
```

Request tersebut mendapatkan:

```text
requestId = req_8f91ab
```

Kemudian semua proses yang berkaitan menggunakan ID tersebut:

```text
req_8f91ab
   │
   ├── API request
   ├── validation
   ├── assessment service
   ├── file upload
   ├── database transaction
   └── response
```

Kalau terjadi error:

```text
requestId=req_8f91ab
```

kamu bisa mencari semua log yang berkaitan dengan satu request.

Ini akan menjadi sangat berharga ketika aplikasi sudah besar.

---

# 12. Arsitektur logging yang saya rekomendasikan

Untuk Nusadaya Akademi, kira-kira:

```text
                    USER
                     │
                     ▼
                  Next.js
                     │
                     ▼
                  Elysia
                     │
              ┌──────┴──────┐
              │             │
          Request Log    Error Log
              │             │
              └──────┬──────┘
                     ▼
                  Service
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Database    Storage     External API
          │          │          │
          └──────────┼──────────┘
                     ▼
                  Logger
                     │
                     ▼
              Log Destination
```

Log destination bisa berupa:

```text
Local file
Docker logs
Cloud logging service
Log aggregation platform
```

---

# 13. Logger sebaiknya dibuat sebagai abstraction

Jangan setiap service melakukan:

```typescript
console.log(...)
console.error(...)
```

Lebih baik memiliki:

```text
logger
```

yang digunakan bersama.

Misalnya secara konsep:

```typescript
logger.info("student.created", {
  studentId,
  userId,
});
```

atau:

```typescript
logger.error("assessment.upload.failed", {
  assessmentId,
  userId,
  error,
});
```

Kemudian kalau suatu hari kamu mengganti sistem logging, service tidak perlu diubah satu per satu.

---

# 14. Logging ≠ Audit Log

Ini perbedaan yang cukup penting.

### Application Log

Digunakan untuk mengetahui kondisi aplikasi.

```text
database connection failed
API request completed
cache miss
service error
```

### Audit Log

Digunakan untuk mengetahui **siapa melakukan tindakan apa**.

Misalnya:

```text
Admin Fauzan
09:32
mengubah status mahasiswa 123
dari "Aktif" menjadi "Tidak Aktif"
```

Audit log sangat penting untuk aplikasi akademik.

Saya bahkan menyarankan Nusadaya Akademi memiliki:

```text
application_logs
```

dan:

```text
audit_logs
```

sebagai konsep yang berbeda.

---

# 15. Audit log untuk Nusadaya Akademi

Misalnya:

```text
audit_logs
```

memiliki:

```text
id
user_id
action
module
resource_type
resource_id
old_value
new_value
ip_address
user_agent
created_at
```

Contoh:

```json
{
  "userId": 10,
  "action": "UPDATE",
  "module": "student",
  "resourceType": "student",
  "resourceId": 123,
  "oldValue": {
    "status": "active"
  },
  "newValue": {
    "status": "inactive"
  }
}
```

Dengan ini kamu bisa menjawab:

> Siapa yang mengubah data mahasiswa ini?

---

# 16. Jangan memasukkan data sensitif ke log

Ini sangat penting.

**Jangan log:**

```text
password
JWT
access token
refresh token
API key
secret
full authentication credential
```

Juga hati-hati dengan data pribadi mahasiswa.

Jangan melakukan:

```typescript
logger.info("student", student);
```

karena `student` mungkin berisi banyak data pribadi.

Lebih baik:

```typescript
logger.info("student.updated", {
  studentId,
  userId,
});
```

**Log harus berisi informasi yang diperlukan untuk diagnosis, bukan salinan seluruh data aplikasi.**

---

# 17. Logging di Development vs Production

### Development

Bisa lebih verbose:

```text
DEBUG
INFO
WARN
ERROR
```

### Production

Biasanya lebih selektif:

```text
INFO
WARN
ERROR
FATAL
```

Dengan environment:

```text
LOG_LEVEL=debug
```

development.

Sedangkan production:

```text
LOG_LEVEL=info
```

---

# 18. Jangan lupa log rotation

Kalau kamu menyimpan:

```text
app.log
```

dan aplikasi berjalan selama 2 tahun, file bisa menjadi sangat besar.

Maka perlu:

```text
Log Rotation
```

Misalnya:

```text
app-2026-09-01.log
app-2026-09-02.log
app-2026-09-03.log
...
```

dan retention:

```text
7 hari
30 hari
90 hari
```

sesuai kebutuhan.

---

# 19. Logging + Docker

Karena stack Nusadaya Akademi menggunakan Docker, arsitekturnya bisa seperti:

```text
Docker
 ├── web
 ├── api
 └── postgres
```

API menghasilkan:

```text
stdout/stderr
```

kemudian Docker/runtime menangani output tersebut.

Untuk tahap awal, ini sudah cukup:

```text
API
 ↓
Structured Logger
 ↓
stdout
 ↓
Docker logs
```

Nanti ketika production semakin serius:

```text
API
 ↓
Structured Logger
 ↓
Log Collector
 ↓
Centralized Logging
 ↓
Dashboard / Search
```

---

# 20. Logging bukan berarti "semakin banyak semakin bagus"

Ini kesalahan yang sering terjadi.

Jangan sampai:

```text
function A started
function A ended
function B started
function B ended
query started
query ended
variable x = ...
variable y = ...
...
```

setiap detik.

Hasilnya:

```text
1 hari
↓
jutaan log
↓
sulit dicari
↓
storage membengkak
↓
biaya naik
```

Prinsipnya:

> **Log sesuatu yang membantu menjawab pertanyaan operasional atau debugging.**

---

# 21. Implementasi bertahap untuk Nusadaya

Saya akan menerapkannya dalam beberapa tahap.

### Tahap 1 — Basic Logger

Buat:

```text
logger.info()
logger.warn()
logger.error()
logger.debug()
```

Kemudian ganti logging penting yang masih menggunakan `console.log`.

---

### Tahap 2 — HTTP Logging

Tambahkan:

```text
requestId
method
path
status
duration
userId
```

---

### Tahap 3 — Error Logging

Pastikan setiap error penting memiliki:

```text
error
stack
requestId
userId
module
operation
```

---

### Tahap 4 — Business Event

Tambahkan event penting:

```text
student.created
student.updated
student.deleted

attendance.created
attendance.updated

assessment.submitted
assessment.approved
assessment.rejected

file.upload.success
file.upload.failed
```

---

### Tahap 5 — Audit Log

Buat audit trail untuk operasi sensitif:

```text
create
update
delete
status change
permission change
score change
finance change
```

---

### Tahap 6 — Centralized Logging

Ketika production sudah berjalan serius:

```text
Application
     ↓
Structured Logs
     ↓
Centralized Log System
     ↓
Search / Dashboard / Alert
```

---

# 22. Hubungannya dengan debugging

Sekarang kembali ke pertanyaan awalmu tentang debugging.

Tanpa logging:

```text
BUG
 ↓
"Coba cek source code."
 ↓
Cari-cari
 ↓
Pasang console.log
 ↓
Deploy lagi
 ↓
Tunggu error muncul
```

Dengan logging:

```text
BUG
 ↓
Cari requestId / error event
 ↓
Lihat timeline
 ↓
Temukan service yang gagal
 ↓
Lihat error
 ↓
Reproduce
 ↓
Debug
 ↓
Fix
 ↓
Unit test
 ↓
Deploy
```

Inilah kenapa **logging + testing + monitoring** sebaiknya dibangun bersama.

---

## Standar yang saya sarankan untuk Nusadaya

Kalau saya membuat baseline engineering untuk projectmu, saya akan menggunakan:

```text
                 NUSADAYA AKADEMI
                        │
       ┌────────────────┼────────────────┐
       │                │                │
    Testing          Logging         Security
       │                │                │
   Unit Test       App Logging       Auth
 Integration       Audit Log         RBAC
     E2E            Request ID       Validation
       │                │                │
       └────────────────┼────────────────┘
                        │
                   Observability
                        │
              ┌─────────┴─────────┐
              │                   │
            Metrics              Tracing
              │                   │
              └─────────┬─────────┘
                        │
                     CI/CD
                        │
                   Production
                        │
              ┌─────────┴─────────┐
              │                   │
            Backup            Monitoring
```

**Kalau baru mulai sekarang, jangan langsung memasang sistem logging yang kompleks.** Mulai dari **structured logger + request ID + error logging + audit log untuk aktivitas penting**. Itu sudah memberikan fondasi yang sangat kuat, dan nantinya bisa dikembangkan ke centralized logging, metrics, tracing, dan alerting tanpa harus membongkar architecture aplikasi.
