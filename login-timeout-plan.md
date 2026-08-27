# Rencana Keamanan: Rate Limiting Login & Auto-Logout (Idle Session Timeout)

> Dokumen ini melengkapi rangkaian rencana sebelumnya, fokus khusus pada dua hal: (1) melindungi endpoint login dari brute force/serangan otomatis, dan (2) menerapkan auto-logout ketika admin/staff tidak aktif dalam jangka waktu tertentu. Selaras dengan Task 4.1 (Hardening Keamanan) pada rencana optimasi performa, dan bisa dikerjakan independen tanpa menunggu fase lain selesai.

---

## 1. Tujuan

1. Endpoint login tidak bisa dibrute-force — percobaan login berulang dalam waktu singkat harus diperlambat/diblokir secara otomatis, tanpa mengganggu pengguna sah yang salah ketik password sesekali.
2. Sesi yang tidak aktif (tidak ada interaksi) dalam jangka waktu tertentu otomatis logout, untuk mencegah risiko sesi tertinggal terbuka di komputer bersama/publik.
3. Perubahan tidak mengubah alur login yang sudah ada secara drastis dari sisi pengguna — hanya menambah lapisan proteksi dan mekanisme timeout, tanpa mengubah cara staff login sehari-hari.
4. Semua percobaan gagal dan event auto-logout tercatat di `auditLogs`, konsisten dengan pola audit logging yang sudah ada di sistem.

## 2. Prinsip Kerja untuk AI Agent

- Kerjakan **Fase A (rate limiting) lebih dulu**, karena berdiri sendiri di backend dan tidak bergantung pada perubahan frontend.
- **Fase B (kebijakan idle timeout di backend)** dan **Fase C (deteksi idle di frontend)** saling terkait erat — backend menyediakan mekanisme validasi/pemendekan umur token, frontend yang mendeteksi idle dan memicu logout. Kerjakan B sebelum C.
- Gunakan Redis yang sudah ada di stack (dipakai untuk L2 cache & BullMQ) sebagai penyimpan counter rate limit dan status sesi — jangan menambah dependency database/storage baru.
- Jangan mengubah struktur payload JWT yang sudah ada kecuali benar-benar diperlukan (misal menambah `iat`/waktu aktivitas terakhir) — perubahan struktur token berdampak ke seluruh sistem auth.
- Setelah setiap fase, jalankan `bun run tsc --noEmit` di `apps/api` dan `apps/web`, dan uji alur login/logout secara manual.

---

## Fase A — Rate Limiting & Brute Force Protection (Backend)

**Task A.1 — Tentukan kebijakan rate limit login**

- Deskripsi: Tetapkan aturan konkret, misalnya maksimal 5 percobaan gagal dalam 15 menit per kombinasi (IP + username), dengan lockout progresif (semakin sering gagal, jeda semakin lama) atau lockout tetap untuk periode tertentu setelah batas tercapai.
- Kriteria selesai: Kebijakan tertulis jelas — jumlah percobaan, jendela waktu, durasi lockout, dan apakah dihitung per-IP, per-username, atau kombinasi keduanya (kombinasi lebih disarankan agar satu IP kantor dengan banyak staff tidak saling mengunci).

**Task A.2 — Simpan counter percobaan login di Redis**

- Deskripsi: Gunakan Redis (bukan database utama) untuk menyimpan jumlah percobaan gagal per key (kombinasi IP+username), dengan TTL otomatis sesuai jendela waktu yang ditentukan di Task A.1 — pendekatan ini ringan dan tidak membebani PostgreSQL untuk data yang sifatnya sementara.
- Kriteria selesai: Counter bertambah setiap percobaan login gagal, otomatis hilang/reset sendiri setelah TTL habis, dan tervalidasi konsisten meski request datang paralel.

**Task A.3 — Terapkan pengecekan lockout sebelum proses verifikasi password**

- Deskripsi: Sebelum endpoint login memverifikasi password ke database, cek dulu apakah key tersebut sedang dalam status lockout. Jika ya, tolak request lebih awal tanpa perlu query database sama sekali (lebih efisien dan mengurangi permukaan serangan timing attack).
- Kriteria selesai: Saat status lockout aktif, request login ditolak instan dengan pesan yang jelas namun tidak membocorkan detail berlebihan (lihat Task A.6 soal pesan error).

**Task A.4 — Reset counter otomatis saat login berhasil**

- Deskripsi: Setelah login berhasil dengan kredensial benar, hapus counter percobaan gagal untuk key tersebut, agar staff yang sempat salah ketik beberapa kali lalu berhasil login tidak tetap "terekam" mendekati batas.
- Kriteria selesai: Counter di Redis terbukti terhapus/reset tepat setelah login sukses.

**Task A.5 — Tambahkan rate limiting umum di level endpoint (selain penghitung kegagalan)**

- Deskripsi: Selain lockout berbasis kegagalan berulang, tambahkan batas jumlah total request ke endpoint login per IP dalam periode singkat (misal maksimal N request/menit) untuk mencegah pola serangan yang mencoba banyak username berbeda sekaligus (username enumeration/credential stuffing).
- Kriteria selesai: Endpoint login memiliki dua lapis perlindungan yang saling melengkapi: rate limit umum per IP, dan lockout spesifik per kombinasi IP+username.

**Task A.6 — Standarisasi pesan error yang tidak membocorkan informasi**

- Deskripsi: Pastikan pesan error untuk "username tidak ditemukan", "password salah", dan "akun sedang lockout" tidak memberi petunjuk berlebihan ke penyerang (idealnya pesan generik seperti "kredensial tidak valid" untuk dua kasus pertama, namun boleh menyebutkan sisa waktu lockout untuk kasus ketiga karena itu membantu pengguna sah).
- Kriteria selesai: Respons error login sudah diaudit dan tidak membocorkan apakah suatu username terdaftar di sistem atau tidak.

**Task A.7 — Catat setiap percobaan login gagal & event lockout ke audit log**

- Deskripsi: Tambahkan entri di `auditLogs` untuk setiap percobaan login gagal (dengan metadata IP, username yang dicoba, waktu) dan saat lockout terpicu, agar tim bisa mendeteksi pola serangan atau akun yang sedang ditarget.
- Kriteria selesai: Percobaan login gagal dan event lockout muncul di audit log dengan informasi yang cukup untuk investigasi.

**Task A.8 — Pertimbangkan notifikasi ke admin saat lockout terjadi berulang**

- Deskripsi: Evaluasi apakah perlu mekanisme notifikasi (email/log khusus yang dipantau) saat satu akun mengalami lockout berkali-kali dalam periode singkat, sebagai indikasi kemungkinan akun sedang ditarget serius.
- Kriteria selesai: Keputusan didokumentasikan; jika diterapkan, notifikasi teruji terkirim/tercatat saat kondisi tersebut terjadi.

---

## Fase B — Kebijakan Idle Timeout & Manajemen Sesi (Backend)

**Task B.1 — Tentukan definisi "idle" dan durasi timeout**

- Deskripsi: Sepakati jangka waktu tidak aktif yang memicu auto-logout (contoh: 15–30 menit tanpa interaksi), serta apakah durasi ini sama untuk semua role atau dibedakan (misal role dengan akses data sensitif seperti Finance mendapat waktu idle lebih pendek).
- Kriteria selesai: Durasi idle timeout per role (atau seragam) tertulis jelas sebagai acuan implementasi.

**Task B.2 — Tentukan mekanisme pelacakan aktivitas: token pendek + refresh, atau server-side session tracking**

- Deskripsi: Evaluasi dua pendekatan — (a) JWT dengan umur pendek (misal 15 menit) yang diperpanjang otomatis lewat mekanisme refresh token setiap ada aktivitas, atau (b) menyimpan waktu aktivitas terakhir di Redis per sesi (terikat pada `jti`/session id di token) dan memvalidasi apakah sesi sudah melewati batas idle setiap request masuk. Pilih pendekatan yang paling selaras dengan arsitektur JWT stateless yang sudah ada.
- Kriteria selesai: Pendekatan dipilih dengan alasan jelas (trade-off: opsi (a) tetap stateless tapi butuh endpoint refresh baru; opsi (b) butuh Redis lookup tiap request tapi lebih presisi mengontrol idle time actual).

**Task B.3 — Implementasikan pembaruan "waktu aktivitas terakhir" di setiap request terautentikasi**

- Deskripsi: Setiap kali request yang lolos autentikasi masuk ke server, perbarui timestamp aktivitas terakhir untuk sesi tersebut (di Redis jika memakai pendekatan B.2(b), atau melalui refresh token jika memakai pendekatan B.2(a)).
- Kriteria selesai: Timestamp aktivitas terakhir terbukti terus diperbarui selama pengguna aktif menggunakan sistem (memuat halaman, melakukan aksi, dll).

**Task B.4 — Validasi idle timeout di middleware autentikasi**

- Deskripsi: Pada `.derive()` yang menangani verifikasi JWT & RBAC, tambahkan pengecekan apakah sesi sudah melewati batas idle yang ditentukan Task B.1. Jika iya, tolak request dengan status yang jelas menandakan "sesi berakhir karena tidak aktif" (berbeda dari sekadar token invalid biasa), agar frontend bisa menampilkan pesan yang sesuai.
- Kriteria selesai: Request dengan token valid namun sudah melewati batas idle ditolak dengan kode/pesan error yang bisa dibedakan frontend dari kasus token invalid/expired biasa.

**Task B.5 — Sediakan mekanisme invalidasi sesi sisi server (opsional namun disarankan)**

- Deskripsi: Karena JWT stateless secara default tidak bisa "dicabut" sebelum masa berlakunya habis, pertimbangkan mekanisme daftar sesi aktif/blacklist token di Redis, agar saat auto-logout terjadi (atau admin logout manual, atau akun di-nonaktifkan), token yang sama tidak bisa dipakai lagi walau secara teknis belum expired.
- Kriteria selesai: Token yang sudah di-invalidasi (baik lewat logout manual maupun idle timeout) terbukti ditolak jika dicoba dipakai kembali.

**Task B.6 — Catat event auto-logout karena idle ke audit log**

- Deskripsi: Setiap kali sesi diakhiri karena idle timeout, catat ke `auditLogs` (userId, waktu mulai idle, waktu logout otomatis terpicu).
- Kriteria selesai: Event idle logout tercatat lengkap dan bisa ditelusuri.

---

## Fase C — Deteksi Idle & UX Auto-Logout (Frontend)

**Task C.1 — Tentukan sinyal aktivitas yang dipantau di sisi client**

- Deskripsi: Tetapkan interaksi apa saja yang dianggap "aktif" (gerakan mouse, klik, penekanan tombol keyboard, scroll, perpindahan tab/fokus halaman), agar timer idle direset dengan tepat tanpa terlalu sensitif (misal auto-refresh background tidak dianggap aktivitas pengguna).
- Kriteria selesai: Daftar event yang memicu reset timer idle terdokumentasi dan konsisten diterapkan di seluruh halaman dashboard.

**Task C.2 — Bangun mekanisme idle timer terpusat**

- Deskripsi: Buat mekanisme terpusat (bukan per-halaman) yang memantau waktu sejak interaksi terakhir, aktif di seluruh area setelah login (di layout dashboard), sehingga tidak perlu dipasang berulang di tiap halaman.
- Kriteria selesai: Timer idle berjalan konsisten di seluruh halaman dashboard tanpa perlu konfigurasi ulang per halaman.

**Task C.3 — Tampilkan peringatan sebelum auto-logout benar-benar terjadi**

- Deskripsi: Beberapa menit sebelum batas idle tercapai, tampilkan modal/notifikasi peringatan ("Sesi Anda akan berakhir dalam X menit karena tidak ada aktivitas") dengan opsi "Tetap Masuk" yang mereset timer, agar staff yang sedang membaca sesuatu tanpa berinteraksi tidak tiba-tiba ter-logout tanpa peringatan.
- Kriteria selesai: Peringatan muncul pada waktu yang tepat sebelum timeout, dan tombol "Tetap Masuk" terbukti berhasil mereset status idle baik di client maupun server (memicu Task B.3).

**Task C.4 — Terapkan auto-logout otomatis saat batas idle tercapai**

- Deskripsi: Jika peringatan Task C.3 tidak direspons hingga batas waktu habis, hapus token dari Zustand store, redirect ke halaman login, dan tampilkan pesan yang jelas ("Anda logout otomatis karena tidak aktif") — bukan pesan error generik yang membingungkan.
- Kriteria selesai: Sesi benar-benar berakhir (state auth bersih, tidak bisa mengakses halaman dashboard tanpa login ulang) dan pesan yang ditampilkan sesuai konteks.

**Task C.5 — Sinkronisasi logout antar tab browser**

- Deskripsi: Jika staff membuka dashboard di beberapa tab sekaligus, pastikan auto-logout di satu tab (atau logout manual) juga menghapus sesi di tab-tab lain, memanfaatkan mekanisme storage event dari `localStorage`/Zustand persisted store yang sudah dipakai.
- Kriteria selesai: Logout di satu tab terbukti langsung mempengaruhi tab lain yang sedang terbuka (tidak perlu refresh manual untuk ikut ter-logout).

**Task C.6 — Tangani respons "sesi berakhir karena idle" dari backend (Task B.4) secara konsisten**

- Deskripsi: Pastikan interceptor/fetcher Eden Treaty menangani kode error khusus idle-timeout dari backend dengan menampilkan pesan yang sama seperti Task C.4 (bukan pesan error API generik), meskipun auto-logout dipicu duluan oleh server (misal karena tab sempat idle lalu tiba-tiba ada request tertunda).
- Kriteria selesai: Pengguna selalu mendapat pesan yang konsisten dan jelas kapan pun sesi berakhir karena idle, tidak peduli dipicu dari client atau terdeteksi oleh server lebih dulu.

---

## Fase D — Pengujian & Validasi

**Task D.1 — Uji skenario brute force login**

- Deskripsi: Simulasikan percobaan login gagal berulang melebihi batas yang ditentukan Task A.1, pastikan lockout benar-benar terpicu, pesan error sesuai, dan reset otomatis setelah TTL habis.
- Kriteria selesai: Seluruh skenario (percobaan gagal biasa, mencapai batas, dalam periode lockout, setelah lockout berakhir, login berhasil me-reset counter) berjalan sesuai kebijakan.

**Task D.2 — Uji skenario idle timeout end-to-end**

- Deskripsi: Biarkan sesi tidak aktif melewati batas waktu, pastikan peringatan muncul tepat waktu, "Tetap Masuk" berfungsi mereset, dan auto-logout benar-benar terjadi jika diabaikan — baik dalam kondisi satu tab maupun banyak tab terbuka.
- Kriteria selesai: Seluruh skenario idle timeout (termasuk multi-tab) berjalan sesuai desain Fase B dan C.

**Task D.3 — Uji bahwa staff aktif tidak pernah ter-logout tidak semestinya**

- Deskripsi: Pastikan staff yang terus berinteraksi dengan sistem (mengisi form panjang, membaca dokumen, dsb.) tidak pernah ter-logout otomatis selama benar-benar aktif, untuk menghindari gangguan pekerjaan yang tidak perlu.
- Kriteria selesai: Sesi tetap bertahan selama ada aktivitas berkelanjutan, walau melewati durasi lebih lama dari batas idle.

**Task D.4 — Regression check alur login/logout normal**

- Deskripsi: Pastikan alur login manual, logout manual, dan seluruh fitur yang bergantung pada status autentikasi (RBAC per halaman, dsb.) tidak terganggu oleh perubahan Fase A–C.
- Kriteria selesai: Tidak ada fitur auth yang rusak dibanding sebelum perubahan diterapkan.

**Task D.5 — Jalankan `bun run tsc --noEmit` di `apps/api` dan `apps/web`**

- Deskripsi: Pastikan seluruh perubahan middleware, endpoint, dan komponen frontend tidak merusak type-safety.
- Kriteria selesai: Tidak ada error TypeScript baru.

**Task D.6 — Perbarui dokumentasi arsitektur & keamanan**

- Deskripsi: Tambahkan bagian baru pada dokumentasi arsitektur/keamanan yang menjelaskan kebijakan rate limiting login dan idle timeout yang berlaku, sebagai rujukan tim ke depan.
- Kriteria selesai: Dokumentasi mencerminkan kebijakan final yang diterapkan (durasi, batas percobaan, dsb).

---

## 3. Ringkasan Kebijakan yang Perlu Disepakati Sebelum Eksekusi

| Parameter                                   | Perlu Ditentukan Di |
| :------------------------------------------ | :------------------ |
| Batas percobaan gagal & jendela waktu       | Task A.1            |
| Durasi lockout                              | Task A.1            |
| Batas rate limit umum endpoint login        | Task A.5            |
| Durasi idle timeout (per role atau seragam) | Task B.1            |
| Durasi peringatan sebelum auto-logout       | Task C.3            |

> Rekomendasikan menyepakati angka-angka di atas dengan pemilik produk/pengguna sistem terlebih dahulu sebelum eksekusi, karena ini keputusan kebijakan bisnis (seberapa ketat vs seberapa nyaman), bukan murni keputusan teknis.
