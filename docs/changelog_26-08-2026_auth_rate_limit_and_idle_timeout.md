# Changelog: Hardening Keamanan — Rate Limiting Login (7x/7m) & Auto-Logout Sesi Idle (30m)

**Tanggal:** 26 Agustus 2026  
**Fokus:** Keamanan Autentikasi, Proteksi Brute Force, Server-side Session Management di Redis, Auto-Logout & Sinkronisasi Multi-Tab

---

## 1. Ringkasan Perubahan

Sesuai dengan `login-timeout-plan.md` dan kebijakan yang telah disepakati:
- **Batas Percobaan Gagal:** 7 kali per kombinasi IP + username.
- **Durasi Lockout:** 7 menit (420 detik) lockout tetap setelah batas 7 kali kegagalan tercapai.
- **Global IP Rate Limit:** 15 request per menit per IP untuk mencegah enumerasi akun / brute-force flood.
- **Idle Session Timeout:** 30 menit (1800 detik) untuk seluruh role pengguna, tersimpan di Redis.
- **Peringatan Auto-Logout:** Muncul modal countdown interaktif di menit ke-28 (2 menit sebelum timeout) dengan opsi "Tetap Masuk" atau "Logout Sekarang".
- **Sinkronisasi Multi-Tab:** Menggunakan `BroadcastChannel` dan `storage` event sehingga logout atau perpanjangan sesi di satu tab langsung sinkron ke semua tab terbuka.

---

## 2. Berkas yang Dibuat & Dimodifikasi

### Backend (`apps/api`)
1. **`src/lib/auth-rate-limit.ts` (BARU)**
   - `checkLoginLockout(ip, username)`: Cek status lockout sebelum query database.
   - `recordFailedLogin(ip, username)`: Mencatat kegagalan, memicu lockout 7 menit jika >= 7 kali.
   - `resetLoginAttempts(ip, username)`: Reset counter di Redis saat login sukses.
   - `checkLoginIpRateLimit(ip)`: Membatasi request login per IP (15 req/menit).

2. **`src/lib/session.ts` (BARU)**
   - `createSession(user, metadata)`: Menyimpan data sesi di Redis (`session:{sessionId}`) dengan TTL 7 hari.
   - `validateAndTouchSession(sessionId)`: Memvalidasi umur sesi dan idle timeout 30 menit, mengupdate `lastActivity` secara ter-throttle (10 detik).
   - `invalidateSession(sessionId, userId, reason)`: Menghapus sesi dari Redis dan mencatat audit log.

3. **`src/middleware/auth.ts` & `src/middleware/rbac.ts`**
   - Integrasi validasi `sessionId` ke Redis di middleware auth `.derive()`.
   - Mengembalikan response 401 khusus dengan kode `IDLE_TIMEOUT` saat sesi terdeteksi idle.

4. **`src/index.ts`**
   - Update `POST /auth/login`: Pengecekan IP rate limit, pengecekan lockout pra-DB, audit logging, penanaman `sessionId` di JWT payload, dan reset counter.
   - Update `POST /auth/logout`: Menghapus sesi di Redis dan mencatat ke `auditLogs`.
   - Tambah `POST /auth/touch`: Endpoint heartbeat untuk memperbarui sesi saat tombol "Tetap Masuk" ditekan.

5. **`scripts/test_auth_timeout.ts` (BARU)**
   - Test suite otomasi backend yang menguji 7x percobaan gagal, lockout 7 menit, lockout check pra-DB, reset counter, pembuatan sesi di Redis, dan idle timeout rejection (100% pass).

### Frontend (`apps/web`)
1. **`src/hooks/useIdleTimer.ts` (BARU)**
   - Mendeteksi interaksi pengguna (`mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`, `visibilitychange`).
   - Sinkronisasi aktivitas dan status sesi antar-tab menggunakan `BroadcastChannel` dan `localStorage`.

2. **`src/providers/IdleTimeoutProvider.tsx` (BARU)**
   - Modal dialog countdown interaktif 2 menit sebelum batas 30 menit tercapai.
   - Tombol "Tetap Masuk" yang memanggil `POST /auth/touch` dan tombol "Logout Sekarang".

3. **`src/lib/eden.ts`**
   - Interceptor status 401: Jika menerima `code === "IDLE_TIMEOUT"`, otomatis membersihkan store auth dan mengarahkan pengguna ke `/login?reason=idle`.

4. **`src/app/(auth)/login/page.tsx`**
   - Membaca parameter `?reason=idle` dan menampilkan banner informasi yang jelas.
   - Menampilkan notifikasi lockout dan sisa waktu tunggu jika terkena rate limit 429.

5. **`src/app/layout.tsx`**
   - Memasang `<IdleTimeoutProvider />` di level root aplikasi sehingga aktif di seluruh dashboard.

---

## 3. Hasil Pengujian

- **Automated Test Suite:** `bun run scripts/test_auth_timeout.ts` -> **100% PASS**
  - Lockout pada percobaan ke-7 terverifikasi aktif selama 420 detik.
  - Sesi idle > 30 menit otomatis ditolak dan di-invalidate dari Redis.
  - Audit logging tercatat dengan benar.
- **Git Status:** Perubahan tersimpan secara lokal dan **tidak di-push ke GitHub** sesuai instruksi.
