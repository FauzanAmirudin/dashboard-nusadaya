# Rencana Implementasi: Periode Akademik, Kurikulum Paket Semester, KRS & Pergantian Semester
**Target Modul**: Akademik, Mata Kuliah, Penjadwalan, KHS/KRS/Transkrip, Portal Mahasiswa, Dosen, PA  
**Pendekatan**: Model Hibrida — Paket Semester per Rombel sebagai default otomatis + penyesuaian per mata kuliah untuk kasus khusus  
**Status**: Selesai Diimplementasikan (100%)

---

## 1. Latar Belakang & Tujuan

### 1.1. Masalah yang Dilaporkan
1. Perkuliahan memiliki semester ganjil dan genap yang terus berganti, tetapi sistem belum punya tempat untuk **mengatur, menyimpan, maupun mereset/menutup** semester.
2. Saat semester berganti, mata kuliah yang diambil setiap mahasiswa ikut berganti, tetapi belum ada mekanisme **menyimpan riwayat semester lama dan memindahkan mahasiswa ke semester + kelas baru**.
3. Belum ada pengaturan **mata kuliah X diambil di semester berapa dan kapan (ganjil/genap, periode berapa)**.

### 1.2. Tujuan Akhir
- Data mata kuliah yang diampu setiap mahasiswa **terstruktur, selalu ada, dan rapi** (riwayat semester tidak pernah hilang/tertimpa).
- Mata kuliah yang diambil **tidak bentrok** (ruang, dosen, rombel, maupun jadwal pribadi mahasiswa).
- Data **ter-update otomatis seiring kemajuan semester** lewat satu alur pergantian semester yang terkontrol.

### 1.3. Kriteria Keberhasilan (terukur)
| No | Kriteria | Cara Verifikasi |
|---|---|---|
| 1 | Setiap mahasiswa aktif memiliki daftar mata kuliah eksplisit per periode (bukan hasil tebakan angkatan/rombel) | Laporan: jumlah mahasiswa aktif tanpa enrollment pada periode aktif = 0 |
| 2 | KHS semester lama tidak berubah setelah semester ditutup | Bandingkan snapshot KHS sebelum/sesudah rollover |
| 3 | Mata kuliah semester 2 tidak muncul di KHS semester 1 | Uji data nyata satu angkatan |
| 4 | Pergantian semester satu angkatan selesai dalam satu alur (< beberapa menit) tanpa input manual per mahasiswa | Uji rollover di staging |
| 5 | Tidak ada jadwal bentrok pada paket reguler, dan bentrok pada kasus mengulang/tambahan terdeteksi sebelum disimpan | Uji skenario bentrok |
| 6 | IPS (per semester) dan IPK (kumulatif) terhitung terpisah dan akurat | Uji hitung vs baseline manual |

---

## 2. Temuan Kondisi Saat Ini (hasil analisis kode)

| Area | Kondisi Saat Ini | Dampak |
|---|---|---|
| **Tabel mata kuliah** ([courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts)) | Satu tabel menyatukan "katalog mata kuliah" dan "kelas yang berjalan": ada kode (unik global), SKS, dosen, angkatan, rombel, peminatan, tipe. **Tidak ada kolom semester maupun periode.** | Tidak bisa membedakan "Tata Hidang 1" sebagai kurikulum vs kelasnya di semester ganjil 2026/2027. Kode unik global menghalangi pemakaian ulang kode pada periode berikutnya. |
| **Penentuan mata kuliah mahasiswa** ([grade-calculation.service.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/modules/academic/grade-calculation.service.ts), [attendance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/attendance.ts)) | Mata kuliah reguler mahasiswa **ditebak** dari kecocokan angkatan + rombel + peminatan (logika yang sama diduplikasi di beberapa tempat). Tabel pendaftaran hanya dipakai untuk peserta tambahan. | Begitu mata kuliah semester baru dibuat untuk angkatan yang sama, otomatis langsung "menempel" ke semua mahasiswa angkatan itu di KHS semester berjalan. |
| **Parameter semester pada perhitungan nilai** | Fungsi hitung nilai menerima nomor semester tetapi **tidak memakainya untuk memilih mata kuliah**; hanya menstempelkan nomor itu ke semua baris nilai. Beberapa pemanggil (mis. transkrip, sinkronisasi presensi, rekap kelas) memanggil dengan semester tetap 1. | Stempel semester pada riwayat nilai tidak dapat dipercaya; risiko riwayat tercampur/tertimpa saat ada semester kedua. |
| **IPS vs IPK** | Nilai "gpa" dihitung dari seluruh mata kuliah relevan saat itu, tanpa pembeda IPS (per semester) dan IPK (kumulatif). | KHS per semester dan transkrip kumulatif tidak punya dasar hitung yang tegas. |
| **Posisi semester mahasiswa** ([shared.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/shared.ts)) | Tabel mahasiswa tidak menyimpan semester berjalan. Hanya modul Finance yang punya konsep nomor semester 1–6 per mahasiswa ([finance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/finance.ts)). | Tidak ada satu sumber kebenaran "mahasiswa X sedang di semester berapa pada periode apa". |
| **Kalender akademik** ([academic-calendar.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/academic-calendar.ts)) | Ada kalender per tahun ajaran + angkatan (status active/draft/archived) dan terhubung ke jadwal, tetapi **tidak mengenal ganjil/genap** dan tidak mengendalikan data mata kuliah/nilai. | Kalender sudah bisa dijadikan fondasi, namun belum menjadi "periode akademik" global. |
| **Jadwal** ([scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts)) | Validasi bentrok sudah ada untuk ruangan, dosen, dosen pendamping, dan rombel. Namun jadwal menyimpan **mata kuliah sebagai teks bebas** (bukan relasi ke kelas), cakupan cek hanya hari/tanggal tanpa batas periode, dan tidak ada cek di level mahasiswa individu. | Mahasiswa yang mengulang/menambah mata kuliah lintas rombel tidak terlindungi dari bentrok. |
| **Pembuatan kelas** ([courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/courses.ts)) | Setiap kelas dibuat satu per satu (otomatis 16 pertemuan). Tidak ada pembukaan kelas massal dari paket kurikulum. | Beban kerja manual tinggi dan rawan terlewat setiap pergantian semester. |
| **Antarmuka** | Halaman mata kuliah memfilter peserta di sisi klien berdasarkan angkatan/rombel; belum ada selector periode, halaman kurikulum, maupun pengaturan pergantian semester. | Tidak ada tempat bagi Akademik untuk mengelola siklus semester. |

> Catatan verifikasi: daftar konsumen logika mata kuliah/nilai dikumpulkan lewat pencarian kode (graph tracing tidak dapat me-resolve nama metode statis). Task 0.2 mengulang inventarisasi secara menyeluruh sebelum pengerjaan.

---

## 3. Prinsip Desain

1. **Pisahkan 4 lapisan**: (1) Master mata kuliah & kurikulum (statis) → (2) Periode akademik (waktu) → (3) Kelas yang dibuka pada periode (offering) → (4) KRS & KHS mahasiswa (riwayat).
2. **Keanggotaan harus eksplisit**: setiap mahasiswa memiliki baris pendaftaran per mata kuliah per periode. Tidak ada lagi penentuan peserta lewat tebakan angkatan/rombel.
3. **Paket sebagai default, penyesuaian sebagai pengecualian**: 95% mahasiswa terdaftar otomatis lewat paket semester; mengulang/pindahan/dispensasi dilakukan per mata kuliah.
4. **Riwayat bersifat immutable**: setelah periode ditutup, nilai, presensi, dan pendaftaran terkunci. Koreksi hanya lewat jalur khusus ber-audit.
5. **"Reset semester" berarti arsip + buka baru, bukan menghapus data.**
6. **Perubahan bertahap tanpa mengganggu sistem berjalan**: skema diperluas (kolom baru nullable), data diisi (backfill), baru perilaku dialihkan lewat feature flag.
7. **Satu pintu logika**: satu layanan penentu "mata kuliah mahasiswa pada periode X" dipakai semua modul.

---

## 4. Gambaran Model Data Target

| Entitas | Fungsi | Status | Relasi Utama |
|---|---|---|---|
| **Master Mata Kuliah** | Katalog mata kuliah: kode, nama, SKS, tipe teori/praktik, deskripsi, status aktif | **Baru** | Dipakai kurikulum & kelas |
| **Periode Akademik** | Tahun ajaran + jenis semester (ganjil/genap), tanggal mulai/selesai, jendela registrasi/KRS, status siklus, penanda periode aktif | **Baru** | Induk kalender, kelas, registrasi |
| **Kurikulum** | Susunan mata kuliah per program studi + peminatan + rentang angkatan berlaku | **Baru** | Berisi paket per semester |
| **Paket Kurikulum (item)** | Menyatakan mata kuliah X berada di semester 1–6 (wajib/pilihan, urutan) | **Baru** | Kurikulum ↔ Master Mata Kuliah |
| **Kelas (Course Offering)** | Mata kuliah yang dibuka pada satu periode untuk angkatan + rombel + dosen tertentu | **Perluasan tabel mata kuliah yang ada** | Master, Periode, jadwal, pertemuan |
| **Registrasi Semester Mahasiswa** | Satu baris per mahasiswa per periode: nomor semester, status (aktif/cuti/lulus/dll.), status KRS, IPS, IPK, SKS | **Baru** | Mahasiswa ↔ Periode |
| **Pendaftaran Mata Kuliah (KRS item)** | Mahasiswa ↔ kelas, sumber (paket/manual/mengulang/konversi), status | **Perluasan tabel pendaftaran yang ada** | Mahasiswa, Kelas, Periode |
| **Nilai Mata Kuliah** | Nilai per mahasiswa per kelas dengan penanda periode, percobaan ke-n, status terkunci | **Perluasan tabel nilai yang ada** | Pendaftaran, Kelas |
| **Jadwal** | Jadwal kelas/praktikum dengan relasi ke kelas dan periode | **Perluasan** | Kelas, Periode, Kalender |
| **Log Pergantian Semester** | Catatan setiap eksekusi pratinjau/rollover: tahap, hasil, operator, waktu | **Baru** | Periode |

**Keputusan arsitektur penting**: tabel mata kuliah yang sudah ada **diperluas menjadi "kelas"**, bukan diganti nama/tabel baru, agar belasan konsumen yang ada (pertemuan, presensi, selfie attendance, anggaran praktik, rekap dosen) tidak perlu dimigrasi sekaligus.

---

## 5. Aturan Bisnis Utama

| Kode | Aturan |
|---|---|
| B1 | Semester ganjil = semester 1, 3, 5; genap = 2, 4, 6. Kelas semester ganjil hanya boleh dibuka pada periode ganjil dan sebaliknya. |
| B2 | Pada satu waktu hanya ada **satu periode aktif**. |
| B3 | Siklus status periode: Draft → Registrasi/KRS → Berjalan → Penilaian → Ditutup (arsip). |
| B4 | Kurikulum ditentukan oleh program studi + peminatan + rentang angkatan; satu mata kuliah hanya sekali dalam satu kurikulum. |
| B5 | Nomor semester mahasiswa pada suatu periode disimpan eksplisit di registrasi semester; penghitungan dari angkatan hanya dipakai sebagai nilai awal/usulan. |
| B6 | Paket otomatis mendaftarkan seluruh mahasiswa aktif rombel ke seluruh mata kuliah paket semester mereka pada periode berjalan. |
| B7 | Mahasiswa cuti tidak dinaikkan semester dan tidak didaftarkan otomatis; mahasiswa lulus dikeluarkan dari alur otomatis. |
| B8 | Mengulang/tambahan/dispensasi dilakukan per mata kuliah oleh Akademik (atau role yang disepakati), selalu dicek bentroknya dan dicatat alasannya. |
| B9 | Setelah periode ditutup: nilai, presensi, pendaftaran, dan KHS periode itu terkunci. Pembukaan kembali hanya oleh Superadmin dengan alasan dan jejak audit. |
| B10 | IPS dihitung dari mata kuliah pada satu periode; IPK dari seluruh riwayat sesuai kebijakan nilai ulang (lihat keputusan K2). |
| B11 | Bentrok ruang, dosen, dan rombel diblokir; bentrok jadwal pribadi mahasiswa pada pendaftaran manual diblokir kecuali override ber-alasan (lihat K9). |
| B12 | Proses pergantian semester harus dapat dipratinjau, idempoten (aman diulang), dan tercatat penuh. |

---

## 6. Keputusan yang Perlu Dikonfirmasi

Plan ini memakai **asumsi bawaan** di bawah agar pengerjaan tidak tertahan. Mohon dikonfirmasi pada Task 0.1; jika berbeda, task terkait disesuaikan.

| Kode | Pertanyaan | Asumsi Bawaan | Task Terdampak |
|---|---|---|---|
| K1 | Struktur studi dan peran semester 5–6 (magang) | 6 semester; semester 5–6 boleh punya mata kuliah/penilaian tetapi paketnya bisa kosong atau khusus magang | 1.3, 5.8, 7.6 |
| K2 | Kebijakan nilai bila mata kuliah diulang | Nilai terbaik dipakai untuk IPK; semua percobaan tetap tampil di riwayat | 3.4, 6.10 |
| K3 | Rombel selama studi | Tetap sama sepanjang studi, bisa diubah manual per mahasiswa | 5.4, 5.5 |
| K4 | Batas maksimum SKS per semester | Dikonfigurasi per kurikulum (nilai ditetapkan Akademik) | 1.3, 3.6 |
| K5 | Siapa yang boleh mengubah KRS | Akademik & Superadmin mengubah; PA dan Dosen hanya melihat; mahasiswa hanya melihat | 3.10, 6.8 |
| K6 | Apakah mahasiswa mengisi KRS sendiri | Tidak; paket otomatis, perubahan lewat Akademik | 6.8, 7.3 |
| K7 | Hubungan periode global dengan kalender per angkatan | Periode bersifat global; kalender per angkatan tetap ada di bawah periode | 1.2, 7.5 |
| K8 | Cara menentukan semester berjalan angkatan lama saat migrasi | Dihitung dari tahun mulai angkatan (pola 2010 + nomor angkatan yang sudah dipakai form pendaftaran) lalu divalidasi Akademik | 0.3, 2.4 |
| K9 | Kebijakan bentrok jadwal pribadi mahasiswa | Diblokir; Superadmin dapat override dengan alasan | 4.3, 4.5 |
| K10 | Siapa boleh mengoreksi nilai setelah periode ditutup | Hanya Superadmin lewat jalur buka-kembali ber-audit | 3.8, 5.7 |
| K11 | Apakah tagihan Finance per semester perlu otomatis terbentuk saat naik semester | Tidak diubah pada fase ini; hanya sinkron nomor semester (read-only) | 7.6 |

---

## 7. Peta Fase & Ketergantungan

| Fase | Fokus | Bergantung pada |
|---|---|---|
| 0 | Keputusan, audit data, baseline regresi | — |
| 1 | Fondasi skema data | 0 |
| 2 | Pengisian data awal (backfill) & paritas | 1 |
| 3 | Layanan inti backend & refactor perhitungan | 1, 2 |
| 4 | Anti-bentrok jadwal | 1, 3 |
| 5 | Pergantian semester (rollover) | 3, 4 |
| 6 | Antarmuka Admin/Akademik | 3, 4, 5 |
| 7 | Penyesuaian modul terkait (KHS, portal, dosen, PA, Finance) | 3, 6 |
| 8 | Cutover bertahap & pemantauan | 2–7 |
| 9 | QA, regresi, dokumentasi (berjalan paralel sejak fase 1) | seluruh fase |

---

## 8. Rincian Task per Fase

Format tiap task: **Tujuan → Pekerjaan → Area terdampak → Dependensi → Hasil (Definition of Done)**.

---

### FASE 0 — Keputusan, Audit Data & Baseline

#### Task 0.1 — Konfirmasi Keputusan Kebijakan Akademik
- **Tujuan**: Menetapkan aturan yang belum pasti (K1–K11) sebelum desain dikunci.
- **Pekerjaan**:
  - Presentasikan tabel keputusan di bagian 6 kepada Akademik/pimpinan.
  - Catat jawaban final dan revisi bagian 5 (aturan bisnis) bila perlu.
  - Tetapkan penanggung jawab keputusan dan tanggal.
- **Area terdampak**: Dokumen plan ini.
- **Dependensi**: —
- **Hasil**: Seluruh K1–K11 berstatus final; plan direvisi bila ada perbedaan dengan asumsi bawaan.

#### Task 0.2 — Audit Data & Inventarisasi Konsumen (Read-Only)
- **Tujuan**: Mengetahui kondisi data nyata dan seluruh titik kode yang terdampak.
- **Pekerjaan**:
  - Buat laporan read-only: jumlah mata kuliah per angkatan/rombel/peminatan, pola kode, mata kuliah kembar antar rombel, kelas tanpa dosen.
  - Laporkan distribusi nomor semester pada riwayat nilai (terutama dugaan semua bernilai 1), nilai duplikat per mahasiswa-mata kuliah, dan mahasiswa tanpa rombel.
  - Laporkan jadwal yang nama mata kuliahnya tidak cocok dengan mata kuliah mana pun.
  - Inventarisasi seluruh pemanggil logika mata kuliah/nilai di API, skrip, tes, dan frontend (termasuk selfie attendance, anggaran praktik, rekap dosen, dashboard).
- **Area terdampak**: Basis data (read-only), seluruh repo.
- **Dependensi**: —
- **Hasil**: Dokumen temuan audit + daftar konsumen final; daftar anomali data yang harus dibereskan sebelum backfill.

#### Task 0.3 — Penetapan Pemetaan Angkatan → Semester Berjalan & Periode Awal
- **Tujuan**: Menetapkan titik awal sistem periode.
- **Pekerjaan**:
  - Tentukan periode aktif saat ini (tahun ajaran + ganjil/genap) bersama Akademik.
  - Buat tabel referensi angkatan → semester berjalan untuk semua angkatan aktif, termasuk pengecualian (cuti, mengulang, tertunda).
  - Setujui tabel tersebut secara tertulis.
- **Area terdampak**: Data referensi migrasi.
- **Dependensi**: 0.1, 0.2
- **Hasil**: Tabel referensi disetujui; menjadi input Task 2.2 dan 2.4.

#### Task 0.4 — Baseline Regresi (Golden Dataset)
- **Tujuan**: Punya pembanding objektif agar migrasi terbukti tidak mengubah hasil.
- **Pekerjaan**:
  - Simpan snapshot untuk sampel representatif (mis. satu angkatan per peminatan): daftar mata kuliah per mahasiswa, nilai akhir, IPK, jumlah SKS, jadwal.
  - Pilih juga kasus tepi (peserta tambahan, rombel gabungan, peminatan campuran).
- **Area terdampak**: Skrip/berkas snapshot di luar kode aplikasi.
- **Dependensi**: 0.2
- **Hasil**: Berkas baseline tersimpan dan dapat dibandingkan otomatis pada Task 2.8 dan 8.3.

#### Task 0.5 — Backup & Lingkungan Staging
- **Tujuan**: Keamanan data dan tempat uji yang realistis.
- **Pekerjaan**:
  - Pastikan backup basis data penuh terjadwal dan teruji dipulihkan.
  - Siapkan staging berisi salinan data produksi (data pribadi dimasking bila diperlukan).
  - Dokumentasikan prosedur pemulihan.
- **Area terdampak**: Infrastruktur.
- **Dependensi**: —
- **Hasil**: Backup terverifikasi dapat direstore; staging siap.

---

### FASE 1 — Fondasi Skema Data

Prinsip: semua kolom/tabel baru ditambahkan **nullable/tanpa memutus fitur berjalan**; pengetatan (NOT NULL/unik) dilakukan di Task 2.8 setelah data terisi.

#### Task 1.1 — Tabel Master Mata Kuliah
- **Tujuan**: Memisahkan katalog mata kuliah dari kelas.
- **Pekerjaan**:
  - Definisikan atribut: kode, nama, SKS, tipe (teori/praktik), deskripsi, status aktif, penanda dibuat oleh.
  - Kode master bersifat unik; satu master dapat melahirkan banyak kelas.
  - Tambahkan indeks pencarian nama/kode.
- **Area terdampak**: [courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts), relasi skema.
- **Dependensi**: 0.1
- **Hasil**: Tabel tersedia di skema dan basis data; belum memengaruhi fitur lain.

#### Task 1.2 — Tabel Periode Akademik & Tautan ke Kalender
- **Tujuan**: Menyediakan entitas "semester ganjil/genap tahun ajaran X" yang global.
- **Pekerjaan**:
  - Atribut: tahun ajaran, jenis semester, tanggal mulai/selesai, jendela registrasi/KRS, tanggal penguncian nilai, status siklus (draft/registrasi/berjalan/penilaian/ditutup), penanda periode aktif.
  - Kombinasi tahun ajaran + jenis semester unik.
  - Pastikan hanya satu periode dapat berstatus aktif (aturan di layanan dan penjaga di basis data bila memungkinkan).
  - Tambahkan relasi opsional dari kalender akademik ke periode (kalender per angkatan tetap ada di bawah periode — K7).
- **Area terdampak**: [academic-calendar.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/academic-calendar.ts), skema baru.
- **Dependensi**: 0.1
- **Hasil**: Tabel periode ada; kalender dapat ditautkan tanpa memutus data lama.

#### Task 1.3 — Tabel Kurikulum & Paket Semester
- **Tujuan**: Menyimpan "mata kuliah X di semester berapa" secara resmi.
- **Pekerjaan**:
  - Kurikulum: nama/versi, program studi, peminatan (kosong = umum), rentang angkatan berlaku, batas SKS per semester (K4), status aktif.
  - Item paket: relasi kurikulum ↔ master mata kuliah, nomor semester 1–6, sifat wajib/pilihan, urutan tampil.
  - Satu master hanya satu kali per kurikulum; nomor semester dibatasi 1–6.
  - Sediakan dukungan semester 5–6 yang boleh kosong (K1).
- **Area terdampak**: Skema baru.
- **Dependensi**: 1.1, 0.1
- **Hasil**: Struktur kurikulum tersimpan lengkap; validasi unik dan rentang terpenuhi.

#### Task 1.4 — Perluasan Tabel Mata Kuliah Menjadi Kelas per Periode
- **Tujuan**: Menjadikan setiap baris mata kuliah sebagai kelas yang terikat periode dan master.
- **Pekerjaan**:
  - Tambahkan: relasi ke master, relasi ke periode, nomor semester paket, status kelas (draft/dibuka/ditutup), catatan.
  - Rencanakan perubahan aturan keunikan kode (dari unik global menjadi unik per kombinasi periode + angkatan + rombel + master) — penerapan akhir di Task 2.8.
  - Pertahankan seluruh kolom lama agar konsumen lama tetap jalan.
- **Area terdampak**: [courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts).
- **Dependensi**: 1.1, 1.2
- **Hasil**: Kolom baru tersedia (nullable); fitur lama tidak terpengaruh.

#### Task 1.5 — Registrasi Semester Mahasiswa & Posisi Semester Saat Ini
- **Tujuan**: Satu sumber kebenaran "mahasiswa X, periode Y, semester ke-N, status Z".
- **Pekerjaan**:
  - Tabel registrasi: mahasiswa, periode, nomor semester, status (aktif/cuti/lulus/keluar), status KRS (draft/disetujui/terkunci), IPS, IPK pada akhir periode, SKS diambil/lulus, penanda penyetuju + waktu.
  - Kombinasi mahasiswa + periode unik.
  - Tambahkan kolom ringkas "semester saat ini" pada mahasiswa sebagai cache baca cepat (sumber kebenaran tetap registrasi).
- **Area terdampak**: [shared.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/shared.ts), skema baru.
- **Dependensi**: 1.2
- **Hasil**: Struktur ada; belum terisi (diisi di Task 2.4).

#### Task 1.6 — Perluasan Pendaftaran Mata Kuliah Menjadi KRS Kanonik
- **Tujuan**: Setiap mata kuliah mahasiswa pada suatu periode tercatat eksplisit.
- **Pekerjaan**:
  - Tambahkan: periode, sumber (paket/manual/mengulang/konversi), status (aktif/dibatalkan), alasan perubahan, penanda dibuat/diubah oleh.
  - Pertahankan keunikan mahasiswa + kelas.
  - Tabel ini kini mencakup **semua** peserta (bukan hanya peserta tambahan).
- **Area terdampak**: [courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts).
- **Dependensi**: 1.4, 1.5
- **Hasil**: Kolom baru tersedia; data lama tetap valid sebagai sumber "manual".

#### Task 1.7 — Perluasan Tabel Nilai (Periode, Percobaan, Penguncian)
- **Tujuan**: Riwayat nilai tidak tertimpa dan dapat dikunci.
- **Pekerjaan**:
  - Tambahkan: periode, relasi ke pendaftaran, percobaan ke-n, penanda terkunci + waktu + oleh.
  - Rencanakan keunikan mahasiswa + kelas (penerapan di 2.8 setelah pembersihan duplikat).
  - Pertahankan kolom semester lama selaras dengan registrasi.
- **Area terdampak**: [academic.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/academic.ts).
- **Dependensi**: 1.4, 1.6
- **Hasil**: Kolom baru tersedia tanpa mengubah perilaku perhitungan lama.

#### Task 1.8 — Relasi Jadwal ke Kelas & Periode
- **Tujuan**: Jadwal terhubung ke kelas nyata agar konflik dapat dihitung sampai level mahasiswa.
- **Pekerjaan**:
  - Tambahkan relasi ke kelas dan periode pada jadwal kelas dan jadwal praktikum (nullable).
  - Pertahankan kolom teks "mata kuliah" untuk kompatibilitas selama masa transisi.
- **Area terdampak**: [scheduling.ts (skema)](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/scheduling.ts).
- **Dependensi**: 1.4
- **Hasil**: Kolom relasi tersedia; jadwal lama tetap tampil.

#### Task 1.9 — Log Pergantian Semester & Audit Perubahan Akademik
- **Tujuan**: Jejak penuh setiap pratinjau, eksekusi, buka-kembali, dan koreksi.
- **Pekerjaan**:
  - Tabel log eksekusi: periode asal/tujuan, jenis aksi (pratinjau/tutup/promosi/buka/buka-kembali), tahap, status, ringkasan jumlah, operator, waktu, pesan kesalahan.
  - Catatan audit untuk perubahan KRS dan koreksi nilai pada periode terkunci (alasan wajib).
- **Area terdampak**: Skema baru.
- **Dependensi**: 1.2
- **Hasil**: Tabel log tersedia untuk dipakai fase 3 dan 5.

#### Task 1.10 — Relasi ORM, Indeks, dan Sinkronisasi Skema
- **Tujuan**: Menyatukan seluruh perubahan skema ke dalam relasi dan indeks yang efisien.
- **Pekerjaan**:
  - Perbarui definisi relasi ([relations.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/relations.ts)) untuk semua entitas baru.
  - Tambahkan indeks pada kolom yang sering difilter (periode, semester, mahasiswa+periode, kelas+periode).
  - Terapkan sinkronisasi skema ke staging lalu produksi lewat prosedur yang sudah ada.
- **Area terdampak**: Skema, relasi.
- **Dependensi**: 1.1–1.9
- **Hasil**: Skema final fase 1 teraplikasi di staging; aplikasi lama tetap berjalan normal (smoke test lulus).

---

### FASE 2 — Pengisian Data Awal (Backfill) & Paritas

Seluruh skrip: **mode dry-run dulu**, bisa diulang aman (idempoten), menghasilkan laporan sebelum menulis.

#### Task 2.1 — Backfill Master Mata Kuliah
- **Tujuan**: Membentuk katalog dari mata kuliah yang sudah ada.
- **Pekerjaan**:
  - Kelompokkan mata kuliah lama yang sebenarnya sama (nama/SKS/tipe sama, kode berbeda antar rombel) menjadi satu master.
  - Hasilkan laporan kandidat penggabungan untuk ditinjau Akademik; tunggu persetujuan sebelum menulis.
  - Tautkan setiap kelas lama ke master-nya.
- **Area terdampak**: Skrip migrasi, tabel master & kelas.
- **Dependensi**: 1.10, 0.2
- **Hasil**: Setiap kelas lama memiliki master; laporan penggabungan disetujui.

#### Task 2.2 — Backfill Periode Akademik Awal & Tautan Kalender
- **Tujuan**: Membuat periode aktif awal.
- **Pekerjaan**:
  - Buat periode sesuai Task 0.3 (dan periode historis yang diperlukan bila datanya ada).
  - Tautkan kalender akademik yang ada ke periode yang sesuai.
  - Tautkan semua kelas lama ke periode aktif awal (atau periode historis bila dapat dibuktikan dari tanggal pertemuan).
- **Area terdampak**: Skrip migrasi.
- **Dependensi**: 0.3, 1.10
- **Hasil**: Periode aktif tunggal terbentuk; kelas dan kalender terhubung.

#### Task 2.3 — Penetapan Kurikulum Awal & Nomor Semester pada Kelas
- **Tujuan**: Mengisi "mata kuliah di semester berapa".
- **Pekerjaan**:
  - Ekspor lembar pemetaan (master × peminatan) untuk diisi Akademik: semester berapa tiap mata kuliah.
  - Impor lembar yang sudah diisi menjadi kurikulum + paket semester; validasi aturan B1 dan B4.
  - Isi nomor semester pada kelas lama berdasarkan pemetaan dan periode.
- **Area terdampak**: Skrip impor, tabel kurikulum/paket/kelas.
- **Dependensi**: 2.1, 2.2
- **Hasil**: Kurikulum awal per peminatan terbentuk; setiap kelas aktif memiliki nomor semester.

#### Task 2.4 — Backfill Registrasi Semester Mahasiswa
- **Tujuan**: Menetapkan posisi semester mahasiswa pada periode aktif.
- **Pekerjaan**:
  - Gunakan tabel referensi Task 0.3 (K8) untuk menghitung nomor semester; tandai pengecualian untuk review manual.
  - Buat registrasi periode aktif untuk setiap mahasiswa berstatus aktif; status lain sesuai data (cuti, lulus, dll.).
  - Isi kolom "semester saat ini" pada mahasiswa.
- **Area terdampak**: Skrip migrasi.
- **Dependensi**: 0.3, 2.2
- **Hasil**: Semua mahasiswa aktif punya registrasi periode aktif; daftar pengecualian terselesaikan.

#### Task 2.5 — Materialisasi Keanggotaan Implisit Menjadi Pendaftaran Eksplisit
- **Tujuan**: Mengubah "tebakan angkatan/rombel/peminatan" menjadi baris pendaftaran nyata **tanpa mengubah hasil yang terlihat pengguna**.
- **Pekerjaan**:
  - Jalankan logika penentuan lama (angkatan + rombel + peminatan + peserta tambahan) satu kali sebagai generator.
  - Buat pendaftaran eksplisit dengan sumber "paket" (reguler) atau "manual" (peserta tambahan lama).
  - Bandingkan jumlah per mahasiswa dengan hasil logika lama; laporkan selisih.
- **Area terdampak**: Skrip migrasi, tabel pendaftaran.
- **Dependensi**: 2.3, 2.4
- **Hasil**: Daftar mata kuliah setiap mahasiswa pada pendaftaran eksplisit identik dengan hasil logika lama (selisih = 0 atau terdokumentasi).

#### Task 2.6 — Perbaikan Riwayat Nilai (Periode, Semester, Pendaftaran, Duplikat)
- **Tujuan**: Membersihkan stempel semester dan duplikat.
- **Pekerjaan**:
  - Tautkan setiap nilai ke periode, pendaftaran, dan nomor semester yang benar sesuai pemetaan.
  - Perbaiki stempel semester yang keliru (mis. semua bernilai 1).
  - Tangani duplikat mahasiswa-kelas (pilih satu, arsipkan sisanya, catat laporan).
- **Area terdampak**: Skrip migrasi, tabel nilai.
- **Dependensi**: 2.5
- **Hasil**: Setiap nilai punya periode + semester + pendaftaran; tidak ada duplikat mahasiswa-kelas.

#### Task 2.7 — Tautkan Jadwal ke Kelas
- **Tujuan**: Menghubungkan jadwal teks bebas ke kelas nyata.
- **Pekerjaan**:
  - Cocokkan nama mata kuliah pada jadwal dengan kelas pada angkatan + rombel + periode.
  - Hasilkan antrean review manual untuk jadwal yang tidak cocok/ambigu; sediakan cara menyelesaikan massal.
  - Isi relasi kelas dan periode pada jadwal yang cocok.
- **Area terdampak**: Skrip migrasi, tabel jadwal.
- **Dependensi**: 2.2, 2.3
- **Hasil**: Persentase jadwal tertaut diketahui; sisanya masuk antrean review dengan pemilik tugas.

#### Task 2.8 — Verifikasi Paritas & Pengetatan Constraint
- **Tujuan**: Membuktikan migrasi aman, lalu mengunci integritas data.
- **Pekerjaan**:
  - Bandingkan hasil dengan baseline Task 0.4 (daftar mata kuliah, nilai, IPK, SKS) untuk seluruh sampel.
  - Setelah paritas lulus, terapkan: kolom wajib (periode/master pada kelas, periode pada pendaftaran dan nilai), keunikan kode kelas baru, keunikan mahasiswa-kelas pada nilai.
  - Dokumentasikan hasil verifikasi.
- **Area terdampak**: Skema, laporan verifikasi.
- **Dependensi**: 2.1–2.7, 0.4
- **Hasil**: Laporan paritas bersih; constraint aktif di staging tanpa pelanggaran.

---

### FASE 3 — Layanan Inti Backend

#### Task 3.1 — Layanan Periode Akademik
- **Tujuan**: Mengelola siklus periode dengan aturan yang ketat.
- **Pekerjaan**:
  - Buat/ubah/hapus (draft saja) periode; aktivasi periode (menonaktifkan periode sebelumnya secara atomik).
  - Mesin status: transisi sah saja (mis. tidak bisa menutup periode yang belum melewati tahap penilaian).
  - Penyedia "periode aktif saat ini" yang dipakai seluruh modul (dengan cache pendek).
  - Validasi tanggal tidak tumpang-tindih dan jenis semester sesuai tahun ajaran.
- **Area terdampak**: Layanan & rute baru, [academic-calendar.ts (rute)](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/academic-calendar.ts).
- **Dependensi**: 1.10
- **Hasil**: Endpoint periode berfungsi dengan aturan B2 dan B3 terjamin.

#### Task 3.2 — Layanan Master Mata Kuliah, Kurikulum & Paket
- **Tujuan**: Mengelola katalog dan paket semester.
- **Pekerjaan**:
  - CRUD master mata kuliah (nonaktifkan, bukan hapus, bila sudah dipakai).
  - CRUD kurikulum dan item paket dengan validasi: nomor semester 1–6, tanpa duplikat, total SKS per semester terhadap batas (K4) berupa peringatan.
  - Pratinjau "paket semester N untuk angkatan A peminatan P".
- **Area terdampak**: Rute/layanan baru.
- **Dependensi**: 1.10
- **Hasil**: Akademik dapat menyusun kurikulum lewat API; validasi B4 tegak.

#### Task 3.3 — Layanan Penentu Mata Kuliah Mahasiswa (Satu Pintu)
- **Tujuan**: Menghapus duplikasi logika "mata kuliah mahasiswa" yang tersebar.
- **Pekerjaan**:
  - Layanan tunggal: ambil mata kuliah mahasiswa pada periode tertentu dari pendaftaran eksplisit (default periode aktif).
  - Sediakan varian: daftar periode yang pernah ditempuh, seluruh riwayat, daftar peserta suatu kelas.
  - Bawa fallback terukur (feature flag) ke logika lama selama masa cutover.
- **Area terdampak**: Layanan baru; menggantikan logika di [grade-calculation.service.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/modules/academic/grade-calculation.service.ts) dan [attendance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/attendance.ts).
- **Dependensi**: 2.5
- **Hasil**: Satu fungsi baca dipakai semua modul; tes paritas terhadap logika lama lulus.

#### Task 3.4 — Refactor Perhitungan Nilai, KHS & Transkrip
- **Tujuan**: Perhitungan menghormati periode; riwayat tidak tertimpa.
- **Pekerjaan**:
  - Hitung nilai **per mahasiswa per periode**; pemilihan mata kuliah dari Task 3.3 (bukan tebakan).
  - Hapus perilaku penghapusan/penimpaan lintas semester; pertahankan hanya pembersihan yang aman dalam periode yang sama dan belum terkunci.
  - Pisahkan **IPS** (per periode) dan **IPK** (kumulatif) sesuai kebijakan nilai ulang (K2); simpan hasilnya di registrasi semester saat periode ditutup.
  - Transkrip menggabungkan seluruh periode tanpa memicu penghitungan ulang berstempel semester 1.
  - Pertahankan seluruh rumus bobot yang berlaku (teori/praktik, normalisasi komponen) tanpa perubahan.
  - Kurangi pola kueri berulang per mata kuliah dengan pengambilan massal agar rollover skala angkatan tetap cepat.
- **Area terdampak**: [grade-calculation.service.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/modules/academic/grade-calculation.service.ts), [student/academic.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/student/academic.ts), [academic-grades.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/academic-grades.ts).
- **Dependensi**: 3.3, 1.7
- **Hasil**: KHS semester N hanya berisi mata kuliah semester N; IPK kumulatif benar; hasil identik dengan baseline untuk periode aktif.

#### Task 3.5 — Alihkan Seluruh Konsumen ke Layanan Satu Pintu
- **Tujuan**: Tidak ada modul lagi yang menebak keanggotaan sendiri.
- **Pekerjaan**:
  - Perbarui [courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/courses.ts) (daftar, peserta, pendaftaran tambahan, pemicu hitung ulang yang memakai semester tetap 1).
  - Perbarui [attendance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/attendance.ts) (daftar mata kuliah mahasiswa, pembuatan baris nilai otomatis, pemicu hitung ulang).
  - Perbarui [mahasiswa.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/mahasiswa.ts) (portal mahasiswa) dan modul selfie attendance bila terdampak.
  - Perbarui skrip pemeliharaan yang memakai logika lama (mis. skrip sinkronisasi dan perbaikan pertemuan).
- **Area terdampak**: Rute API & skrip di atas, hasil inventaris Task 0.2.
- **Dependensi**: 3.3, 3.4
- **Hasil**: Pencarian kode tidak lagi menemukan logika penentuan keanggotaan berbasis angkatan/rombel di luar layanan satu pintu.

#### Task 3.6 — Layanan KRS & Registrasi Semester
- **Tujuan**: Mengelola paket otomatis dan penyesuaian per mata kuliah.
- **Pekerjaan**:
  - Ambil KRS mahasiswa per periode (paket + tambahan, dengan penanda sumber).
  - Tambah/batalkan mata kuliah: validasi periode masih dalam jendela perubahan, belum terkunci, tidak duplikat, kelas sesuai jenis semester, total SKS terhadap batas (K4), mata kuliah belum lulus untuk kasus mengulang.
  - Wajib mencatat alasan perubahan; cek bentrok pribadi (terhubung ke Fase 4).
  - Tindakan massal: daftarkan satu rombel ke paket.
  - Alur status KRS: draft → disetujui → terkunci.
- **Area terdampak**: Layanan & rute baru.
- **Dependensi**: 3.3, 4.3
- **Hasil**: KRS dapat dikelola lengkap lewat API dengan seluruh validasi aturan B6–B8.

#### Task 3.7 — Layanan Pembukaan Kelas dari Paket
- **Tujuan**: Menggantikan pembuatan kelas satu per satu setiap semester.
- **Pekerjaan**:
  - Untuk periode + angkatan (+ peminatan + rombel), buat kelas dari paket semester yang sesuai; lewati yang sudah ada (idempoten).
  - Gunakan kembali logika pembuatan pertemuan 1–16 (dan pertemuan khusus yang saat ini ditambah lewat skrip terpisah) sebagai fungsi bersama agar identik dengan pembuatan manual.
  - Dosen pengampu: usulkan dari periode sebelumnya; kelas berstatus draft sampai dosen terisi.
  - Hasilkan ringkasan: kelas dibuat/dilewati/butuh dosen.
- **Area terdampak**: [courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/courses.ts), layanan baru.
- **Dependensi**: 3.2, 3.1
- **Hasil**: Satu perintah membuka semua kelas satu angkatan untuk semester baru; hasil identik secara struktur dengan kelas manual.

#### Task 3.8 — Layanan Penguncian & Arsip Periode
- **Tujuan**: Menjadikan riwayat tidak dapat berubah.
- **Pekerjaan**:
  - Kunci nilai, presensi, pendaftaran, dan status KRS untuk periode yang ditutup.
  - Simpan snapshot KHS resmi per mahasiswa per periode (memanfaatkan tabel KHS/transkrip yang sudah ada dengan tambahan penanda periode).
  - Jalur buka-kembali & koreksi khusus Superadmin dengan alasan wajib dan jejak audit (K10).
- **Area terdampak**: Layanan baru, [academic.ts (skema KHS)](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/academic.ts).
- **Dependensi**: 3.4, 1.9
- **Hasil**: Setelah ditutup, perubahan pada periode itu ditolak di semua jalur kecuali jalur koreksi audit.

#### Task 3.9 — Penjaga "Periode Terkunci" pada Endpoint Penulisan
- **Tujuan**: Menjamin penguncian tidak bisa dilewati.
- **Pekerjaan**:
  - Terapkan penjaga terpusat pada endpoint yang menulis nilai, presensi/pertemuan, pendaftaran, dan jadwal.
  - Pesan kesalahan jelas ("Periode X sudah ditutup").
  - Pengecualian hanya untuk jalur koreksi.
- **Area terdampak**: [courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/courses.ts), [attendance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/attendance.ts), [scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts), [student/academic.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/student/academic.ts).
- **Dependensi**: 3.8
- **Hasil**: Uji tulis ke periode ditutup selalu ditolak.

#### Task 3.10 — Hak Akses & Audit
- **Tujuan**: Hanya peran yang tepat dapat mengubah data akademik.
- **Pekerjaan**:
  - Terapkan matriks peran sesuai K5: Akademik & Superadmin kelola; PA/Dosen/Mahasiswa baca sesuai cakupan (mahasiswa hanya data sendiri, dosen hanya kelas sendiri).
  - Catat audit untuk perubahan kurikulum, periode, KRS, dan rollover.
- **Area terdampak**: Middleware peran yang sudah ada, rute baru.
- **Dependensi**: 3.1–3.8
- **Hasil**: Uji akses per peran lulus; audit tercatat.

#### Task 3.11 — Cache & Sinkronisasi Realtime
- **Tujuan**: Tampilan seluruh panel langsung konsisten setelah perubahan periode/KRS.
- **Pekerjaan**:
  - Invalidasi cache terkait (mahasiswa, daftar mahasiswa, kelas) setiap perubahan KRS, periode, dan rollover memakai pola yang sudah ada.
  - Tambah jenis kejadian realtime baru (periode berubah, KRS berubah) pada saluran sinkronisasi yang ada.
- **Area terdampak**: Layanan cache, saluran realtime frontend.
- **Dependensi**: 3.6–3.8
- **Hasil**: Perubahan terlihat di panel lain tanpa muat ulang manual.

---

### FASE 4 — Anti-Bentrok Jadwal

#### Task 4.1 — Batasi Cakupan Konflik per Periode
- **Tujuan**: Konflik hanya dihitung dalam periode yang sama, bukan seluruh sejarah.
- **Pekerjaan**:
  - Kerjakan cek ruang/dosen/dosen pendamping/rombel hanya pada jadwal satu periode (atau kalender yang sama).
  - Pastikan semantik jadwal berulang (mingguan) vs tanggal khusus konsisten; jadwal periode lama tidak lagi memicu konflik palsu.
- **Area terdampak**: [scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts).
- **Dependensi**: 1.8, 3.1
- **Hasil**: Tidak ada konflik palsu antar periode; konflik nyata tetap terdeteksi.

#### Task 4.2 — Jadwal Terikat ke Kelas
- **Tujuan**: Menghilangkan teks bebas sebagai identitas mata kuliah pada jadwal.
- **Pekerjaan**:
  - Pembuatan jadwal memilih kelas; dosen, angkatan, rombel, dan periode diturunkan otomatis dari kelas.
  - Pertahankan jalur lama sementara selama transisi dengan penanda "belum tertaut".
- **Area terdampak**: [scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts), [TabJadwalKelas.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx).
- **Dependensi**: 1.8, 2.7
- **Hasil**: Jadwal baru selalu tertaut ke kelas; data identitas konsisten.

#### Task 4.3 — Cek Bentrok Level Mahasiswa
- **Tujuan**: Mahasiswa yang mengulang/menambah mata kuliah lintas rombel tidak mengalami jadwal ganda.
- **Pekerjaan**:
  - Layanan yang menggabungkan seluruh jadwal mahasiswa pada periode (paket + tambahan) lalu mendeteksi tumpang-tindih waktu.
  - Dipakai saat menambah/mengubah KRS (blokir sesuai K9, override ber-alasan oleh Superadmin).
  - Kembalikan detail konflik (mata kuliah, hari, jam, ruang) untuk ditampilkan di UI.
- **Area terdampak**: Layanan baru, terhubung ke Task 3.6.
- **Dependensi**: 4.2, 3.3
- **Hasil**: Penambahan mata kuliah yang bentrok ditolak dengan penjelasan lengkap.

#### Task 4.4 — Analisis Dampak Saat Jadwal Diubah
- **Tujuan**: Mengubah/menambah jadwal tidak diam-diam membuat mahasiswa bentrok.
- **Pekerjaan**:
  - Sebelum menyimpan jadwal baru/ubahan, periksa dampaknya terhadap seluruh mahasiswa terdaftar kelas itu (khususnya yang punya pendaftaran tambahan).
  - Tampilkan daftar mahasiswa terdampak; blokir atau minta konfirmasi sesuai kebijakan.
- **Area terdampak**: [scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts).
- **Dependensi**: 4.3
- **Hasil**: Perubahan jadwal yang menimbulkan bentrok mahasiswa terdeteksi sebelum disimpan.

#### Task 4.5 — Laporan & Kebijakan Bentrok
- **Tujuan**: Memantau bentrok yang lolos (data lama/override) dan mengaudit override.
- **Pekerjaan**:
  - Endpoint/halaman laporan bentrok per periode (ruang, dosen, rombel, mahasiswa).
  - Catat setiap override beserta alasan dan pelakunya.
- **Area terdampak**: Layanan & UI laporan.
- **Dependensi**: 4.3, 4.4
- **Hasil**: Akademik dapat melihat dan menyelesaikan seluruh bentrok tersisa.

---

### FASE 5 — Pergantian Semester (Rollover)

#### Task 5.1 — Definisi Alur & Daftar Prasyarat
- **Tujuan**: Menetapkan urutan tahap dan syarat sebelum semester boleh ditutup.
- **Pekerjaan**:
  - Tahapan: Pratinjau → Validasi → Tutup & kunci → Promosi mahasiswa → Buka periode baru → Buka kelas & daftarkan paket → Ringkasan.
  - Syarat tutup (dapat dikonfigurasi): seluruh nilai terisi, KHS terbit, tidak ada bentrok tersisa, periode tujuan sudah dibuat.
  - Tentukan mana syarat yang memblokir dan mana yang berupa peringatan.
- **Area terdampak**: Dokumen alur; layanan di 5.2–5.6.
- **Dependensi**: 0.1, 3.8
- **Hasil**: Spesifikasi alur disetujui Akademik.

#### Task 5.2 — Mode Pratinjau (Dry-Run)
- **Tujuan**: Melihat dampak sebelum eksekusi.
- **Pekerjaan**:
  - Hitung tanpa menulis: jumlah mahasiswa naik/cuti/lulus/bermasalah, kelas yang akan dibuka, pendaftaran yang akan dibuat, nilai kosong, bentrok, dosen kosong.
  - Tampilkan daftar pengecualian yang butuh keputusan manual.
- **Area terdampak**: Layanan rollover.
- **Dependensi**: 3.7, 5.1
- **Hasil**: Pratinjau akurat dan dapat diulang; tidak mengubah data.

#### Task 5.3 — Tahap Tutup Semester
- **Tujuan**: Mengarsipkan semester lama.
- **Pekerjaan**:
  - Validasi prasyarat; hitung final IPS/IPK; simpan di registrasi semester.
  - Terbitkan snapshot KHS resmi; kunci nilai/presensi/pendaftaran; ubah status periode menjadi ditutup.
- **Area terdampak**: Layanan rollover, layanan penguncian.
- **Dependensi**: 3.8, 5.1
- **Hasil**: Periode lama read-only dengan KHS ter-snapshot.

#### Task 5.4 — Tahap Kenaikan Semester Mahasiswa
- **Tujuan**: Memajukan posisi semester seluruh mahasiswa dengan aturan yang benar.
- **Pekerjaan**:
  - Aktif → semester +1 dan registrasi periode baru dibuat.
  - Cuti → tetap di semester yang sama sesuai kebijakan; kembali aktif menyiapkan registrasi.
  - Selesai semester terakhir → status lulus/alumni sesuai aturan (terhubung dengan alur status mahasiswa yang sudah ada).
  - Rombel mengikuti K3; hasil dicatat per mahasiswa.
- **Area terdampak**: Layanan rollover, status mahasiswa ([student/status.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/student/status.ts)).
- **Dependensi**: 5.3
- **Hasil**: Semua mahasiswa memiliki registrasi periode baru dengan semester yang benar.

#### Task 5.5 — Tahap Buka Periode Baru, Buka Kelas & Daftarkan Paket
- **Tujuan**: Menyiapkan semester baru sampai mahasiswa memiliki KRS.
- **Pekerjaan**:
  - Aktifkan periode tujuan; buat kalender angkatan pada periode itu bila belum ada.
  - Panggil pembukaan kelas dari paket (Task 3.7) untuk semua angkatan/peminatan/rombel aktif.
  - Daftarkan mahasiswa ke paket semester barunya (sumber "paket"); lewati cuti/lulus.
  - Tandai kelas yang masih butuh dosen dan jadwal.
- **Area terdampak**: Layanan rollover.
- **Dependensi**: 5.4, 3.7, 3.6
- **Hasil**: Tidak ada mahasiswa aktif tanpa KRS paket; kelas baru siap dijadwalkan.

#### Task 5.6 — Idempotensi, Transaksi, dan Pemulihan Kegagalan
- **Tujuan**: Rollover aman diulang dan tidak meninggalkan data setengah jadi.
- **Pekerjaan**:
  - Setiap tahap tercatat di log; menjalankan ulang melanjutkan dari tahap yang gagal tanpa duplikasi.
  - Penulisan data tiap tahap dalam transaksi; kegagalan membatalkan tahap tersebut.
  - Kunci eksekusi agar dua operator tidak menjalankan bersamaan.
- **Area terdampak**: Layanan rollover, log (Task 1.9).
- **Dependensi**: 5.2–5.5
- **Hasil**: Uji kegagalan di tengah proses dan pengulangan tidak menyisakan duplikasi/inkonsistensi.

#### Task 5.7 — Buka Kembali Periode (Terbatas)
- **Tujuan**: Menyediakan jalan koreksi aman bila terjadi kesalahan.
- **Pekerjaan**:
  - Buka-kembali hanya Superadmin, dengan alasan wajib dan batas kondisi (mis. selama periode berikutnya belum aktif/berjalan).
  - Semua tindakan tercatat; penutupan ulang menghitung ulang IPS/IPK dan menerbitkan snapshot baru.
- **Area terdampak**: Layanan penguncian.
- **Dependensi**: 3.8, 5.3
- **Hasil**: Koreksi dapat dilakukan tanpa merusak riwayat; jejak audit lengkap (K10).

#### Task 5.8 — Penanganan Kasus Khusus
- **Tujuan**: Alur tidak patah pada kondisi nyata di luar jalur normal.
- **Pekerjaan**:
  - Mahasiswa pindahan/konversi: pendaftaran bersumber "konversi" dengan nilai konversi.
  - Mahasiswa mengulang: pendaftaran bersumber "mengulang" pada kelas periode berjalan dengan cek bentrok.
  - Cuti lalu kembali di tengah studi; mengundurkan diri/keluar/DO.
  - Semester 5–6 sesuai K1 (paket kosong/khusus magang) dan keterkaitan dengan modul Magang.
- **Area terdampak**: Layanan KRS & rollover.
- **Dependensi**: 3.6, 5.4
- **Hasil**: Setiap kasus memiliki aturan tertulis dan uji yang lulus.

#### Task 5.9 — Ringkasan & Notifikasi Hasil
- **Tujuan**: Operator dan stakeholder tahu hasil rollover.
- **Pekerjaan**:
  - Ringkasan hasil per tahap dan daftar pengecualian yang butuh tindak lanjut (dosen belum diisi, jadwal belum dibuat, KRS bermasalah).
  - Notifikasi/pengumuman ke Akademik, PA, dan dosen terkait sesuai sistem pengumuman yang ada.
- **Area terdampak**: Layanan rollover, pengumuman.
- **Dependensi**: 5.5
- **Hasil**: Laporan hasil dapat diunduh dan notifikasi terkirim.

---

### FASE 6 — Antarmuka Admin/Akademik

#### Task 6.1 — Navigasi & Hak Akses Menu
- **Tujuan**: Memberi pintu masuk fitur baru sesuai peran.
- **Pekerjaan**:
  - Tambah menu: Periode Akademik, Master Mata Kuliah, Kurikulum & Paket Semester (Akademik & Superadmin).
  - Selector periode global pada header modul akademik dengan default periode aktif.
- **Area terdampak**: Navigasi dashboard, store sesi.
- **Dependensi**: 3.10
- **Hasil**: Menu tampil sesuai peran; periode terpilih konsisten antarhalaman.

#### Task 6.2 — Halaman Periode Akademik
- **Tujuan**: Tempat mengatur, melihat, dan mengarsipkan periode.
- **Pekerjaan**:
  - Daftar periode (badge aktif/ditutup, status siklus), form buat/ubah, aksi ubah status, tautan ke kalender angkatan.
  - Panel ringkasan periode aktif: jumlah kelas, mahasiswa terdaftar, nilai terisi, bentrok.
- **Area terdampak**: Halaman baru di modul akademik.
- **Dependensi**: 3.1, 6.1
- **Hasil**: Akademik dapat mengelola periode tanpa bantuan developer.

#### Task 6.3 — Wizard Pergantian Semester
- **Tujuan**: Menjalankan rollover dengan aman dan terpandu.
- **Pekerjaan**:
  - Langkah: pilih periode tujuan → pratinjau → tinjau pengecualian → konfirmasi (ketik konfirmasi) → eksekusi per tahap dengan progres → ringkasan.
  - Tampilkan log eksekusi dan opsi lanjut/ulang saat gagal.
- **Area terdampak**: Halaman baru.
- **Dependensi**: 5.2–5.9, 6.2
- **Hasil**: Rollover dapat dijalankan end-to-end dari UI di staging.

#### Task 6.4 — Halaman Master Mata Kuliah
- **Tujuan**: Mengelola katalog.
- **Pekerjaan**:
  - Daftar/cari/tambah/ubah/nonaktifkan master; tampilkan pemakaian (kurikulum dan kelas terkait).
- **Area terdampak**: Halaman baru.
- **Dependensi**: 3.2, 6.1
- **Hasil**: Katalog dapat dikelola; master terpakai tidak dapat dihapus.

#### Task 6.5 — Halaman Kurikulum & Paket Semester
- **Tujuan**: Tempat menetapkan "mata kuliah X di semester berapa".
- **Pekerjaan**:
  - Pilih program + peminatan + kurikulum; tampilkan 6 kolom semester (ganjil/genap diberi label) berisi mata kuliah.
  - Tambah/pindah/hapus mata kuliah antar-semester; total SKS per semester dengan peringatan batas (K4); validasi duplikasi.
  - Duplikat kurikulum untuk versi/angkatan baru.
- **Area terdampak**: Halaman baru.
- **Dependensi**: 3.2, 6.4
- **Hasil**: Akademik menyusun dan memverifikasi paket seluruh peminatan dari UI.

#### Task 6.6 — Penyesuaian Halaman Daftar Mata Kuliah
- **Tujuan**: Daftar kelas sadar periode.
- **Pekerjaan**:
  - Filter periode (default aktif), badge nomor semester & status kelas, sembunyikan periode ditutup secara default.
  - Aksi "Buka Kelas dari Paket" (angkatan/peminatan/rombel) dengan pratinjau jumlah kelas.
  - Form tambah kelas manual memilih master (bukan mengetik kode/nama bebas).
- **Area terdampak**: [mata-kuliah/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/page.tsx).
- **Dependensi**: 3.7, 6.1
- **Hasil**: Akademik membuka kelas semester baru dalam beberapa klik.

#### Task 6.7 — Penyesuaian Detail Kelas & Tab Peserta
- **Tujuan**: Peserta berasal dari pendaftaran eksplisit.
- **Pekerjaan**:
  - Hapus penentuan peserta sisi klien berdasarkan angkatan/rombel; tampilkan peserta dari pendaftaran dengan badge sumber (paket/manual/mengulang/konversi).
  - Tambah/keluarkan peserta dengan umpan balik bentrok dan alasan wajib.
  - Tampilkan penanda periode ditutup (read-only).
- **Area terdampak**: [mata-kuliah/[id]/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/%5Bid%5D/page.tsx).
- **Dependensi**: 3.6, 3.9
- **Hasil**: Daftar peserta konsisten dengan KRS; periode terkunci tidak dapat diedit.

#### Task 6.8 — KRS per Mahasiswa
- **Tujuan**: Tempat mengelola mata kuliah satu mahasiswa.
- **Pekerjaan**:
  - Tab/halaman KRS pada profil mahasiswa: pilih periode, daftar mata kuliah (paket & tambahan), total SKS vs batas, status KRS.
  - Aksi tambah/batalkan mata kuliah dengan pratinjau bentrok langsung (hasil Task 4.3) dan alasan wajib.
  - Aksi setujui/kunci KRS sesuai K5.
- **Area terdampak**: Halaman profil mahasiswa ([profile/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/%5Bid%5D/profile/page.tsx)) atau halaman KRS ([krs/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/%5Bid%5D/krs/page.tsx)).
- **Dependensi**: 3.6, 4.3
- **Hasil**: Kasus mengulang/pindahan dapat ditangani tanpa bantuan developer.

#### Task 6.9 — Penyesuaian Halaman Jadwal
- **Tujuan**: Penjadwalan sadar periode dan kelas.
- **Pekerjaan**:
  - Selector periode; form jadwal memilih kelas (dropdown) menggantikan teks bebas.
  - Tampilkan pesan konflik terperinci (termasuk mahasiswa terdampak) dan indikator jadwal yang belum tertaut ke kelas.
- **Area terdampak**: [TabJadwalKelas.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx), [TabJadwalPraktikum.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalPraktikum.tsx).
- **Dependensi**: 4.2, 4.4
- **Hasil**: Jadwal baru selalu tertaut ke kelas; konflik jelas bagi pengguna.

#### Task 6.10 — Riwayat Semester pada Profil Mahasiswa
- **Tujuan**: Memperlihatkan jejak studi lengkap.
- **Pekerjaan**:
  - Tabel riwayat: periode, semester ke-, status, SKS, IPS, IPK, tautan ke KHS/KRS periode.
  - Tampilkan semester saat ini dan status (aktif/cuti/lulus).
  - Tandai mata kuliah yang diulang sesuai K2.
- **Area terdampak**: Halaman profil mahasiswa.
- **Dependensi**: 3.4
- **Hasil**: Riwayat semester tampil lengkap dan akurat.

---

### FASE 7 — Penyesuaian Modul Terkait

#### Task 7.1 — KHS, KRS & Transkrip Sadar Semester
- **Tujuan**: Dokumen akademik menampilkan data periode yang benar.
- **Pekerjaan**:
  - Selector semester berdasarkan riwayat registrasi (bukan angka bebas); label "Arsip" untuk periode ditutup memakai snapshot.
  - Transkrip menampilkan seluruh periode terurut dengan IPK kumulatif; nilai diulang sesuai K2.
  - Pastikan nomor dokumen dan tahun ajaran mengikuti periode (bukan tahun berjalan saat cetak).
- **Area terdampak**: [khs/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/%5Bid%5D/khs/page.tsx), [krs/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/%5Bid%5D/krs/page.tsx), [transkrip/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/students/%5Bid%5D/transkrip/page.tsx).
- **Dependensi**: 3.4, 3.8
- **Hasil**: KHS semester lama tidak berubah; KHS baru hanya berisi mata kuliah semesternya.

#### Task 7.2 — Panel Akademik & PA
- **Tujuan**: Panel kerja akademik menunjukkan konteks periode.
- **Pekerjaan**:
  - Tab nilai/KHS pada panel akademik mengikuti selector periode.
  - Banner periode aktif dan peringatan (KRS belum ada, nilai belum terkunci, periode hampir berakhir).
  - Tampilan PA menampilkan KRS dan riwayat mahasiswa bimbingan secara read-only.
- **Area terdampak**: [AkademikPanel.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/AkademikPanel.tsx), [TabNilaiKhs.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/akademik/TabNilaiKhs.tsx), panel PA.
- **Dependensi**: 7.1
- **Hasil**: Konteks periode konsisten di semua tab akademik/PA.

#### Task 7.3 — Portal Mahasiswa
- **Tujuan**: Mahasiswa melihat data semester berjalan dan riwayatnya.
- **Pekerjaan**:
  - Tampilkan KRS/jadwal periode aktif (read-only), riwayat KHS per semester.
  - Halaman absen kuliah hanya menampilkan kelas periode berjalan milik mahasiswa.
- **Area terdampak**: [absen/kuliah/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/mahasiswa/absen/kuliah/page.tsx), halaman portal terkait.
- **Dependensi**: 3.5, 6.8
- **Hasil**: Mahasiswa hanya melihat data yang relevan dan benar.

#### Task 7.4 — Dosen: Dashboard, Rekap & Absensi
- **Tujuan**: Beban dan rekap dosen dipisah per periode.
- **Pekerjaan**:
  - Dashboard dosen menampilkan kelas periode aktif; rekap dan absensi dosen mendapat filter periode (default aktif).
  - Riwayat kelas periode lama tetap dapat dilihat (read-only).
- **Area terdampak**: [DosenDashboard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/DosenDashboard.tsx), [rekap](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/rekap/page.tsx), [rekap-dosen](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/rekap-dosen/page.tsx), [absensi-dosen](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/akademik/absensi-dosen/page.tsx).
- **Dependensi**: 3.5
- **Hasil**: Rekap per periode akurat; tidak bercampur lintas semester.

#### Task 7.5 — Kalender Akademik Terhubung ke Periode
- **Tujuan**: Kalender per angkatan berada di bawah periode.
- **Pekerjaan**:
  - Form kalender memilih periode; validasi tanggal dalam rentang periode.
  - Ikut ke wizard rollover (kalender angkatan dibuat pada tahap buka periode).
- **Area terdampak**: [academic-calendar.ts (rute)](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/academic-calendar.ts), halaman kalender.
- **Dependensi**: 3.1
- **Hasil**: Kalender dan periode selalu selaras.

#### Task 7.6 — Sinkronisasi dengan Finance & Magang
- **Tujuan**: Nomor semester konsisten antar modul tanpa mengubah logika tagihan (K11).
- **Pekerjaan**:
  - Hubungkan nomor semester registrasi dengan modul Finance secara read-only (menampilkan/validasi, bukan membuat tagihan).
  - Tentukan titik temu dengan modul Magang untuk semester 5–6 (K1) dan sinkronisasi KHS ke magang yang sudah ada.
  - Dokumentasikan keputusan dan ketergantungan.
- **Area terdampak**: [finance.ts (skema)](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/finance.ts), alur sinkronisasi ke magang.
- **Dependensi**: 3.4, 0.1
- **Hasil**: Tidak ada ketidaksesuaian nomor semester antar modul; perilaku Finance tidak berubah.

#### Task 7.7 — Ekspor & Laporan per Periode
- **Tujuan**: Laporan resmi mengikuti periode.
- **Pekerjaan**:
  - Ekspor data PDDIKTI dan rekap nilai/kehadiran per periode.
  - Laporan kelengkapan KRS dan nilai per angkatan.
- **Area terdampak**: [academic-grades.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/academic-grades.ts), layanan ekspor.
- **Dependensi**: 3.4
- **Hasil**: Laporan per periode akurat dan dapat diunduh.

---

### FASE 8 — Cutover Bertahap & Pemantauan

#### Task 8.1 — Feature Flag & Strategi Rilis
- **Tujuan**: Peralihan dari logika lama ke logika baru dapat dibalik.
- **Pekerjaan**:
  - Flag terpisah untuk: pembacaan dari pendaftaran eksplisit, penguncian periode, UI baru.
  - Urutan rilis: skema → backfill → baca ganda (bandingkan hasil lama vs baru dengan log selisih) → alihkan baca → aktifkan penguncian → buka UI.
- **Area terdampak**: Konfigurasi aplikasi, layanan satu pintu.
- **Dependensi**: 3.3, 3.5
- **Hasil**: Rencana rilis tertulis; flag berfungsi dan teruji dua arah.

#### Task 8.2 — Gladi Resik di Staging & UAT
- **Tujuan**: Membuktikan seluruh alur pada data realistis.
- **Pekerjaan**:
  - Jalankan keseluruhan migrasi dan satu siklus rollover pada salinan data produksi.
  - UAT bersama Akademik, PA, dan Dosen memakai skenario Task 9.5.
  - Catat temuan dan perbaikan sebelum jadwal produksi.
- **Area terdampak**: Staging.
- **Dependensi**: Fase 2–7
- **Hasil**: UAT ditandatangani; daftar temuan kritis nol.

#### Task 8.3 — Jendela Cutover Produksi
- **Tujuan**: Peralihan produksi terkontrol.
- **Pekerjaan**:
  - Tetapkan jendela bebas input akademik; backup penuh sebelum mulai.
  - Eksekusi urutan Task 8.1; jalankan perbandingan baseline (0.4) dan ambil keputusan lanjut/batal pada titik pemeriksaan.
- **Area terdampak**: Produksi.
- **Dependensi**: 8.2, 0.5
- **Hasil**: Produksi berjalan pada logika baru dengan paritas terbukti.

#### Task 8.4 — Rencana Rollback
- **Tujuan**: Cara kembali yang jelas bila terjadi masalah.
- **Pekerjaan**:
  - Dokumentasikan langkah balik per tahap (matikan flag, pulihkan backup bila perlu), batas waktu pengambilan keputusan, dan penanggung jawab.
  - Uji rollback di staging.
- **Area terdampak**: Prosedur operasional.
- **Dependensi**: 8.1
- **Hasil**: Rollback teruji dan didokumentasikan.

#### Task 8.5 — Pemantauan Pasca-Rilis
- **Tujuan**: Mendeteksi masalah dini.
- **Pekerjaan**:
  - Pantau selama beberapa minggu: error penulisan ke periode terkunci, selisih hasil baca ganda, mahasiswa tanpa KRS, bentrok baru, kinerja kueri.
  - Hapus logika lama dan flag setelah stabil.
- **Area terdampak**: Log, dashboard operasional.
- **Dependensi**: 8.3
- **Hasil**: Tidak ada insiden terbuka; kode lama dibersihkan.

---

### FASE 9 — QA, Regresi & Dokumentasi

#### Task 9.1 — Tes Unit Aturan Inti
- **Tujuan**: Aturan bisnis terlindungi otomatis.
- **Pekerjaan**:
  - Uji: aturan ganjil/genap (B1), siklus status periode, satu periode aktif, penentu mata kuliah mahasiswa, validasi KRS (duplikat, batas SKS, jenis semester), perhitungan IPS/IPK termasuk nilai ulang, penjaga periode terkunci.
- **Area terdampak**: Tes API.
- **Dependensi**: Fase 3
- **Hasil**: Seluruh aturan B1–B12 yang relevan memiliki tes lulus.

#### Task 9.2 — Tes Integrasi Rollover End-to-End
- **Tujuan**: Alur lengkap terbukti pada data uji.
- **Pekerjaan**:
  - Dataset uji multi-angkatan/peminatan/rombel termasuk cuti, mengulang, pindahan, lulus.
  - Uji pratinjau, eksekusi penuh, kegagalan di tengah + lanjut ulang, idempotensi, buka-kembali.
  - Verifikasi: KHS lama tidak berubah, KRS baru benar, semester naik benar.
- **Area terdampak**: Tes integrasi API.
- **Dependensi**: Fase 5
- **Hasil**: Skenario rollover otomatis lulus berulang kali.

#### Task 9.3 — Pembaruan Tes Regresi yang Ada
- **Tujuan**: Tes lama sesuai dengan perilaku baru.
- **Pekerjaan**:
  - Perbarui tes yang menyentuh mata kuliah, nilai, presensi 16 sesi, dan logika rute (mis. tes presensi AKD-05, tes helper, tes logika rute, tes logika panel).
  - Tambah tes pembanding paritas dengan baseline.
- **Area terdampak**: Tes di [apps/api](file:///c:/.PROJECT/dashboard-nusadaya/apps/api) dan [apps/web](file:///c:/.PROJECT/dashboard-nusadaya/apps/web).
- **Dependensi**: Fase 3
- **Hasil**: Seluruh rangkaian tes hijau.

#### Task 9.4 — Uji Performa & Beban
- **Tujuan**: Rollover dan layar utama tetap cepat pada skala nyata.
- **Pekerjaan**:
  - Ukur waktu pratinjau/eksekusi untuk volume mahasiswa produksi dan proyeksi 2–3 kali lipat.
  - Periksa kueri berulang dan indeks; optimalkan seperlunya.
- **Area terdampak**: Layanan rollover & perhitungan nilai.
- **Dependensi**: Fase 5
- **Hasil**: Waktu eksekusi terdokumentasi dan dapat diterima.

#### Task 9.5 — Skenario UAT
- **Tujuan**: Daftar uji manual untuk pengguna akhir.
- **Pekerjaan**: Siapkan skenario berikut dan jalankan di Task 8.2:
  1. Menyusun kurikulum satu peminatan dan memverifikasi paket 6 semester.
  2. Membuat periode baru dan menjalankan pratinjau rollover.
  3. Menjalankan rollover satu angkatan; memeriksa KHS lama tidak berubah dan KRS baru benar.
  4. Menambahkan mata kuliah mengulang yang bentrok → ditolak; yang tidak bentrok → diterima.
  5. Mencoba mengubah nilai pada periode ditutup → ditolak; koreksi lewat Superadmin → tercatat audit.
  6. Mahasiswa cuti tidak naik semester dan tidak terdaftar otomatis.
  7. Mengubah jadwal yang membuat mahasiswa bentrok → terdeteksi sebelum disimpan.
  8. Memeriksa portal mahasiswa, panel dosen, dan panel PA pada periode baru.
- **Dependensi**: Fase 6–7
- **Hasil**: Checklist UAT lengkap dan ditandatangani.

#### Task 9.6 — Dokumentasi & SOP
- **Tujuan**: Pengetahuan operasional tidak bergantung pada developer.
- **Pekerjaan**:
  - Perbarui dokumen arsitektur dan alur data bisnis di folder [docs](file:///c:/.PROJECT/dashboard-nusadaya/docs).
  - Tulis changelog sesuai konvensi file changelog yang sudah ada.
  - Tulis panduan pengguna: menyusun kurikulum, membuka periode, SOP pergantian semester langkah demi langkah, menangani mahasiswa mengulang/cuti/pindahan.
  - Dokumentasikan keputusan K1–K11 final.
- **Area terdampak**: Folder docs.
- **Dependensi**: Seluruh fase
- **Hasil**: Dokumen terbit dan direview Akademik.

---

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data historis tidak konsisten (stempel semester keliru, duplikat, kode kembar) | Backfill salah, KHS lama berubah | Audit 0.2, skrip dry-run, review manual, paritas 2.8 dengan baseline 0.4 |
| Pemetaan "mata kuliah di semester berapa" tidak lengkap | Paket salah → KRS salah | Lembar pemetaan dibuat Akademik (2.3), validasi B1/B4, pratinjau paket sebelum rollover |
| Banyak konsumen lama memakai logika implisit | Ada modul terlewat dan menampilkan data campur | Inventaris 0.2, pencarian kode di 3.5, mode baca ganda dengan log selisih (8.1) |
| Rollover gagal di tengah | Data setengah jadi | Transaksi per tahap, idempotensi, log, lanjut-ulang (5.6) |
| Kesalahan menutup semester | Data terkunci keliru | Pratinjau wajib, konfirmasi eksplisit, buka-kembali terbatas ber-audit (5.7) |
| Perubahan skema memengaruhi sistem berjalan | Gangguan layanan | Kolom nullable dulu, constraint diperketat belakangan, feature flag, staging |
| Performa perhitungan nilai (pola kueri berulang) | Rollover lambat | Pengambilan massal (3.4), uji beban (9.4) |
| Aturan akademik belum disepakati | Pengerjaan ulang | Keputusan K1–K11 dikunci di 0.1 sebelum desain final |
| Perbedaan konsep semester antara Akademik dan Finance | Data tidak sinkron | Sinkron read-only dan keputusan K11 (7.6) |

---

## 10. Definisi Selesai Global

- Seluruh kriteria keberhasilan di bagian 1.3 terpenuhi dan terdokumentasi.
- Tidak ada logika penentuan keanggotaan berbasis angkatan/rombel di luar layanan satu pintu.
- Satu siklus rollover penuh berhasil di staging dan produksi tanpa mengubah KHS semester lama.
- Rangkaian tes (unit, integrasi, regresi) hijau; UAT ditandatangani Akademik.
- Dokumentasi, SOP, dan changelog terbit; keputusan K1–K11 tercatat.
