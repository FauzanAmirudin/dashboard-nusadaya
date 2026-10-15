# 📑 Panduan Pengujian Manual (Manual UAT Test Cases)

**Sistem**: Dashboard Nusadaya Academy (One Data Nusadaya)
**Cakupan**: Formulir PMB Mandiri, Sistem Revisi Bertarget (Centang Merah), Gatekeeper NIM Akademik, Integrasi Fee Sharing Finance, & Standarisasi Berkas
**Dasar Acuan**: Hasil Notulensi & Rekaman Rapat Resmi Nusadaya (7 Oktober 2026)
**Status**: Siap Diuji (Ready for Testing)

---

## 📌 Ringkasan Skenario Ideal Sesuai Diskusi Rapat

1. **Formulir Pendaftaran Siswa Publik (`/form/[TOKEN]`)**:
   - Tautan pendaftaran satu kali pakai per calon mahasiswa (dibagikan via WhatsApp).
   - Data kesehatan dasar murni (Tinggi Badan, Berat Badan, Golongan Darah, Ukuran Baju, Riwayat Penyakit & Alergi).
   - Validasi fleksibel kontak orang tua (nomor HP hanya wajib jika masih hidup, opsional jika status Ayah/Ibu *"Meninggal"*).
   - Pelacakan sumber pendaftar / referral terstruktur (*Sekolah/SMK, Lembaga BKK, Pendamping, Rekan/Alumni, Media Sosial*).
   - Input kontak darurat keluarga (untuk penanganan insiden darurat di kampus).
   - Kewajiban mengisi **5 kontak kawan/rekan aktif (fixed 5 slot)** format nomor HP Indonesia sebelum formulir dapat dikirim.
2. **Sistem Revisi Mandiri Bertarget (Centang Merah)**:
   - Jika formulir ditolak admin PMB, tautan formulir **tidak hangus**.
   - Admin PMB memilih tab-tab spesifik yang salah (misal: salah unggah ijazah MA vs Dinas).
   - Pendaftar membuka tautan perbaikan (`?tab=N`) dan langsung diarahkan ke tab yang salah dengan **lingkaran silang merah (X)** pada stepper, tanpa perlu mengisi ulang dari nol.
3. **Integrasi PMB ➔ Finance (Fee Sharing & Pagu Biaya)**:
   - Data referral pendaftar otomatis masuk ke daftar Fee Sharing Finance dengan nominal awal Rp 0 dan badge *"Baru dari PMB"*.
   - Admin Finance mengelola penetapan nominal fee, pencairan bertahap, dan unggah bukti transfer.
   - Sinkronisasi master tarif default 4 sub-program (*Reguler, Fast Track, Dual Degree, Alih Jenjang*).
4. **Integrasi PMB ➔ Akademik (Clearance Gatekeeper NIM & Role)**:
   - Restriksi role: wewenang mengubah status mahasiswa (*Aktif, Cuti, Drop Out, Mengundurkan Diri*) dan penunjukan Dosen PA dipindahkan sepenuhnya ke panel Akademik.
   - Gatekeeper NIM: Nomor Induk Mahasiswa (NIM) terkunci dan hanya dapat dirilis jika mahasiswa memenuhi **Clearance 2 Arah**:
     - 🟢 **Clearance PMB**: Berkas pendaftaran telah di-ACC.
     - 🟢 **Clearance Finance**: Biaya Registrasi Awal telah Lunas.
5. **CRM Leads dari Rekomendasi Kawan**:
   - Visualisasi asal referral terstruktur di CRM.
   - Tabel dinamis 3–5 kontak kawan prospek dengan aksi pembaruan status follow-up real-time (*Belum Dihubungi, Sudah Dihubungi, Tertarik, Tidak Tertarik*).
6. **Standarisasi Berkas Dokumen (Pra-MCU, MCU Full, SLA, BPJS, Paspor)**:
   - Pembedaan tahapan MCU: Berkas **Pra-MCU** di pendaftaran PMB dan **MCU Full** di Magang sebelum keberangkatan.
   - Dokumen **SLA (*Service Level Agreement*)**: Berkas kesepakatan wajib di awal PMB mencakup izin penggunaan foto/video mahasiswa untuk materi promosi.
   - Dokumen **BPJS Kesehatan**: Bersifat **Opsional / Tidak Wajib (Tanpa Bintang)** di PMB agar tidak memblokir proses pendaftaran.
   - Dokumen Paspor: Tidak boleh mengunci alur PMB jika calon mahasiswa belum memiliki paspor.

---

## 🛠️ Prasyarat Pengujian & Kredensial Akun

1. **Aplikasi Berjalan di Lokal**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`
2. **Kredensial Akun Resmi (Database Lokal)**:
   - *Password seluruh akun demo default*: **`password`**
   - **Superadmin**: `onedatanusadaya@gmail.com`
   - **Divisi PMB**: `pmb@nusadaya.ac.id`
   - **Divisi Finance**: `finance@nusadaya.ac.id`
   - **Divisi Akademik**: `akademik@nusadaya.ac.id`
   - **Divisi CRM**: `crm@nusadaya.ac.id`
   - **Tim Magang**: `magang@nusadaya.ac.id`
3. **Fitur OTP Lokal**:
   - Setiap login, kode 6 digit OTP **langsung dicetak di jendela terminal console** tempat `bun run dev` berjalan (di lokal pengiriman email Resend otomatis di-bypass sehingga pengujian berlangsung cepat tanpa kuota habis).

---

## 🧪 MODUL 1: Form Pendaftaran Mandiri Siswa Publik (8 Tab)

### TC-PMB-01: Validasi Field Baru di Form Pendaftaran Siswa

| Atribut                | Keterangan                                                                                                                                |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **ID Test Case** | `TC-PMB-01`                                                                                                                             |
| **Deskripsi**    | Menguji kelancaran pengisian 8 tab, data kesehatan dasar, kontak ortu fleksibel, referral, kontak darurat, dan wajib langsung isi 5 kawan |
| **Halaman Uji**  | `/form/[TOKEN]`                                                                                                                         |

#### Langkah-langkah Pengujian:

1. Login sebagai Admin PMB (`pmb@nusadaya.ac.id`), buka menu **PMB ➔ Tab Token Formulir**.
2. Klik tombol **"Buat Token Baru"**, lalu klik ikon salin tautan formulir pendaftaran.
3. Buka tautan tersebut di jendela browser baru / Incognito: `http://localhost:3000/form/[TOKEN]`.
4. Isi **Tab 1 (Data Mahasiswa)** dan **Tab 2 (Pendidikan)** dengan data diri yang valid.
5. Masuk ke **Tab 3 (Keterangan Kesehatan)**:
   - Pilih Golongan Darah dan Ukuran Baju.
   - Masukkan Tinggi Badan (cm) dan Berat Badan (kg).
   - Masukkan Riwayat Penyakit dan Penyakit Bawaan (atau ketik *"Tidak ada"*).
   - Klik tombol **"Lanjut ke Data Ayah"**.
   - 👉 **Ekspektasi**: Navigasi ke Tab 4 berhasil tanpa ada form tes buta warna/operasi yang memblokir.
6. Masuk ke **Tab 4 (Data Ayah)** dan **Tab 5 (Data Ibu)**:
   - Pada Tab 4, pilih keadaan Ayah: `Meninggal`.
   - Kosongkan nomor HP Ayah.
   - 👉 **Ekspektasi**: Form mengizinkan lanjut ke tab berikutnya tanpa memicu error validasi nomor HP.
7. Masuk ke **Tab 7 (Informasi PMB & Referensi)**:
   - **Uji Negatif**: Kosongkan salah satu field referensi (misal: belum memilih Kategori Referral atau mengosongkan Koordinator), lalu klik **"Lanjut ke Kontak & Darurat"**.
   - 👉 **Ekspektasi**: Muncul peringatan error spesifik dan perpindahan tab tertahan (seluruh kolom wajib diisi, tidak boleh ada yang kosong).
   - Isi seluruh kolom referensi:
     - Kategori Referral: `Sekolah / SMK`
     - Nama Institusi / Lembaga: `SMK Bina Informatika Surabaya`
     - Nama Kontak / PIC: `Bpk. Rahmat Hidayat`
     - Nomor WhatsApp PIC: `081234567890` (wajib format valid)
     - Periode Keberangkatan: `2026/2027 Batch 1`
     - Rekomendasi: `MoU Sekolah`
     - Tim Visit: `Tim Visit Surabaya` (atau `-`)
     - Tim Sosialisasi: `Tim Sosialisasi Jatim` (atau `-`)
     - RO Referral: `Bpk. Agus Santoso` (atau `-`)
     - Mitra Sponsor: `Mitra Edukasi` (atau `-`)
     - Koordinator: `Ibu Ratna` (atau `-`)
   - Klik lanjut ke Tab 8.
   - 👉 **Ekspektasi**: Navigasi ke Tab 8 berhasil dengan mulus.
8. Masuk ke **Tab 8 (Kontak & Darurat)**:
   - Isi Kontak Darurat Keluarga:
     - Nama: `Siti Aminah`
     - Hubungan: `Bibi / Wali`
     - No WA: `085678901234`
   - Pada daftar Rekan Kawan (Wajib Langsung Isi 5 Kontak):
     - Form langsung menyajikan 5 slot kawan tetap (1 s/d 5) tanpa tombol tambah/hapus.
     - **Uji Negatif**: Kosongkan salah satu kawan (misal kawan ke-5 dikosongkan), lalu klik **"Kirim Pendaftaran"**.
     - 👉 **Ekspektasi**: Muncul peringatan spesifik: *"Nama kawan ke-5 wajib diisi"* / *"Nomor WhatsApp kawan ke-5 wajib diisi"*.
     - **Uji Negatif**: Masukkan nomor HP kawan dengan format salah (misal: `12345`).
     - 👉 **Ekspektasi**: Muncul pesan format nomor WhatsApp kawan tidak valid.
     - Lengkapi seluruh 5 kontak kawan ke format nomor valid (`081298765431`, `085211223342`, `087788990013`, `081344556677`, `085677889900`).
     - Klik tombol **"Kirim Pendaftaran"**.

- **Hasil yang Diharapkan**:
  - Formulir berhasil disubmit, token tercatat terpakai, dan status menjadi `SUBMITTED`.

---

## 🧪 MODUL 2: Review Admin PMB & Alur Revisi Bertarget (Centang Merah)

### TC-PMB-02: Penolakan Bertarget oleh Admin PMB

| Atribut                | Keterangan                                                                                |
| :--------------------- | :---------------------------------------------------------------------------------------- |
| **ID Test Case** | `TC-PMB-02`                                                                             |
| **Deskripsi**    | Admin PMB menolak formulir dengan memilih tab spesifik yang salah tanpa membatalkan token |
| **Halaman Uji**  | `/dashboard/pmb/responses/[id]`                                                         |

#### Langkah-langkah Pengujian:

1. Login sebagai Admin PMB (`pmb@nusadaya.ac.id`), buka menu **PMB ➔ Tab Respons Formulir**.
2. Klik tombol detail (ikon mata) pada respons pendaftar dari `TC-PMB-01`.
3. Periksa tampilan review data pendaftar:
   - Card **Keterangan Kesehatan** menampilkan data kesehatan dasar bersih.
   - Card **Informasi PMB & Referensi** menampilkan kategori referral, nama institusi, dan PIC.
   - Card **Kontak Kawan & Darurat** menampilkan kontak darurat dan tabel 3 kontak kawan.
4. Klik tombol merah **"Tolak / Minta Revisi"**:
   - **Uji Negatif**: Kosongkan semua checklist tab, lalu klik "Kirim Penolakan".
   - 👉 **Ekspektasi**: Muncul pesan validasi: *"Pilih minimal 1 tab yang perlu diperbaiki"*.
   - Centang **Tab 2: Keterangan Pendidikan** dan **Tab 7: Informasi PMB & Referensi**.
   - Masukkan Catatan Revisi: *"Mohon upload ulang ijazah dinas (bukan MA) dan perbarui nomor kontak sekolah rujukan."*
   - Klik tombol **"Kirim Penolakan"**.

- **Hasil yang Diharapkan**:
  - Status formulir berubah menjadi **REJECTED (Perlu Revisi)**.
  - Muncul banner merah di atas halaman detail pendaftar dengan badge tab yang ditolak (`Tab 2`, `Tab 7`).

---

### TC-PMB-03: Akses Tautan Revisi & Stepper Centang Merah

| Atribut                | Keterangan                                                                                    |
| :--------------------- | :-------------------------------------------------------------------------------------------- |
| **ID Test Case** | `TC-PMB-03`                                                                                 |
| **Deskripsi**    | Siswa membuka tautan yang sama, otomatis melompat ke tab yang salah dengan tanda silang merah |
| **Halaman Uji**  | `/form/[TOKEN]?tab=1`                                                                       |

#### Langkah-langkah Pengujian:

1. Di dashboard PMB (Tab Token Formulir), klik tombol **"Salin Tautan"** pada token pendaftar tersebut.
2. Periksa URL: terdapat query string deep-link otomatis, contoh: `http://localhost:3000/form/[TOKEN]?tab=1`.
3. Buka tautan tersebut di browser (Incognito / tab baru):
   - 👉 **Ekspektasi**:
     - Halaman formulir terbuka kembali (tidak hangus dan tidak perlu mengisi dari awal).
     - Stepper di bagian atas menandai **Tab 2** dan **Tab 7** dengan **lingkaran silang merah (X)**.
     - Form otomatis berada di tab pertama yang ditolak (Tab 2).
     - Banner alert merah di atas menampilkan catatan revisi dari admin.
4. Perbaiki data pada Tab 2 dan Tab 7.
5. Klik navigasi sampai Tab 8, lalu klik tombol **"Kirim Revisi Pendaftaran"**.

- **Hasil yang Diharapkan**:
  - Formulir berhasil terkirim ulang dan status respons kembali menjadi `PENDING` untuk ditinjau ulang oleh admin.

---

## 🧪 MODUL 3: Integrasi PMB ➔ Finance (Fee Sharing & Pagu Biaya)

### TC-FIN-01: Auto-Populate Referral ke Fee Sharing Finance

| Atribut                | Keterangan                                                                                |
| :--------------------- | :---------------------------------------------------------------------------------------- |
| **ID Test Case** | `TC-FIN-01`                                                                             |
| **Deskripsi**    | Approval pendaftar di PMB otomatis meneruskan data referral ke daftar Fee Sharing Finance |
| **Halaman Uji**  | `/dashboard/pmb/responses/[id]` ➔ `/dashboard/finance`                               |

#### Langkah-langkah Pengujian:

1. Di detail respons pendaftar PMB (`/dashboard/pmb/responses/[id]`), klik tombol hijau **"Setujui Pendaftaran"**.
2. Konfirmasi pembuatan data mahasiswa baru.
3. Login sebagai Admin Finance (`finance@nusadaya.ac.id`), buka menu **Finance ➔ Tab Fee Sharing**.
4. Periksa tabel penerima fee sharing:
   - 👉 **Ekspektasi**:
     - Terdapat baris baru dengan nama PIC yang tadi diisi di form referral.
     - Kolom Institusi menampilkan nama sekolah/BKK rujukan.
     - Terdapat badge biru **"Baru dari PMB"**.
     - Nominal fee awal terisi **Rp 0** (menunggu ketetapan admin Finance).
5. Klik tombol **Edit** pada penerima tersebut, masukkan nominal fee (misal: `Rp 500.000`), lalu simpan.

- **Hasil yang Diharapkan**:
  - Besaran nominal fee sharing tersimpan di modul Finance.

---

### TC-FIN-02: Sinkronisasi Master Pagu Tarif Default Program

| Atribut                | Keterangan                                                                     |
| :--------------------- | :----------------------------------------------------------------------------- |
| **ID Test Case** | `TC-FIN-02`                                                                  |
| **Deskripsi**    | Konfigurasi tarif default 4 sub-program dan sinkronisasi di skema keuangan PMB |
| **Halaman Uji**  | `/dashboard/settings/program-fees` & `/dashboard/pmb` (Tab Skema Keuangan) |

#### Langkah-langkah Pengujian:

1. Login sebagai Superadmin (`onedatanusadaya@gmail.com`), buka menu Sidebar **Settings ➔ Tarif Default Program**.
2. Periksa 4 sub-program (*Reguler, Fast Track, Dual Degree, Alih Jenjang*).
3. Ubah total biaya default salah satu program, lalu simpan.
4. Buka menu **PMB ➔ Tab Skema Keuangan** pada mahasiswa terkait.
   - 👉 **Ekspektasi**: Tampil informasi nominal acuan standar program dan tombol **"Gunakan Standar"** untuk menyelaraskan nominal secara otomatis.

- **Hasil yang Diharapkan**:
  - Total biaya pendidikan di PMB selaras dengan ketentuan standar program.

---

## 🧪 MODUL 4: Integrasi PMB ➔ Akademik (Clearance Gatekeeper NIM & Role)

### TC-AKD-01: Gatekeeper NIM Terkunci Saat Belum Clearance

| Atribut                | Keterangan                                                                           |
| :--------------------- | :----------------------------------------------------------------------------------- |
| **ID Test Case** | `TC-AKD-01`                                                                        |
| **Deskripsi**    | Input NIM dan tombol Simpan NIM terkunci selama salah satu clearance belum terpenuhi |
| **Halaman Uji**  | `/dashboard/akademik` (Tab Data Mahasiswa)                                         |

#### Langkah-langkah Pengujian:

1. Login sebagai Admin Akademik (`akademik@nusadaya.ac.id`), buka **Akademik ➔ Tab Data Mahasiswa**.
2. Pilih mahasiswa yang baru dibuat (belum di-ACC PMB atau Biaya Registrasinya di Finance belum lunas).
3. Gulir ke bagian kartu **Nomor Induk Mahasiswa (NIM)**:
   - Periksa **Card Indikator Clearance**:
     - Indikator PMB: Berwarna **🔴 Merah (Belum ACC PMB)** atau **🟢 Hijau (Sudah ACC)**.
     - Indikator Finance: Berwarna **🔴 Merah (Belum Lunas Registrasi Awal)**.
   - Periksa kontrol input NIM:
     - 👉 **Ekspektasi**: Field input NIM berstatus `disabled`.
     - Tombol **"Simpan NIM"** berstatus `disabled` (warna abu-abu).
     - Hover kursor pada tombol Simpan NIM: muncul tooltip *"NIM terkunci. Memerlukan clearance PMB (ACC) dan Finance (Registrasi lunas)"*.

- **Hasil yang Diharapkan**:
  - Sistem secara ketat mengamankan rilis NIM dari penerbitan prematur.

---

### TC-AKD-02: Pelepasan Kunci NIM Setelah Clearance 2 Arah Lengkap

| Atribut                | Keterangan                                                                                      |
| :--------------------- | :---------------------------------------------------------------------------------------------- |
| **ID Test Case** | `TC-AKD-02`                                                                                   |
| **Deskripsi**    | Kunci NIM otomatis terbuka ketika status PMB sudah ACC dan Biaya Registrasi Finance sudah lunas |
| **Halaman Uji**  | `/dashboard/akademik` (Tab Data Mahasiswa)                                                    |

#### Langkah-langkah Pengujian:

1. Di panel PMB: Pastikan mahasiswa telah di-ACC PMB (`isAcc = true`).
2. Di panel Finance: Centang status pembayaran registrasi awal menjadi Lunas (`registrasiStatus = true`).
3. Kembali ke panel Akademik (`akademik@nusadaya.ac.id`) ➔ Tab Data Mahasiswa:
   - 👉 **Ekspektasi**:
     - Kedua indikator clearance kini berwarna **🟢 Hijau (Clearance Lengkap)**.
     - Input NIM kini aktif dan dapat diketik.
     - Tombol **"Simpan NIM"** aktif (berwarna biru).
4. Ketikkan NIM baru (misal: `2026101088`), klik tombol **"Simpan NIM"**.

- **Hasil yang Diharapkan**:
  - Muncul notifikasi toast hijau sukses, NIM tersimpan permanen di database.

---

### TC-AKD-03: Restriksi Hak Akses Status Mahasiswa & Dosen PA

| Atribut                | Keterangan                                                                  |
| :--------------------- | :-------------------------------------------------------------------------- |
| **ID Test Case** | `TC-AKD-03`                                                               |
| **Deskripsi**    | Memastikan role PMB dilarang mengubah status keaktifan mahasiswa & dosen PA |
| **Halaman Uji**  | `/dashboard/students/[id]/profile`                                        |

#### Langkah-langkah Pengujian:

1. Login dengan akun **PMB** (`pmb@nusadaya.ac.id`), buka halaman profil mahasiswa (`/dashboard/students/[id]/profile`).
2. Periksa dropdown **Status Mahasiswa** dan **Dosen Pembimbing Akademik (PA)**:
   - 👉 **Ekspektasi**: Kedua kontrol berstatus `disabled` (read-only) dengan catatan wewenang hanya untuk Akademik.
3. Login ulang dengan akun **Akademik** (`akademik@nusadaya.ac.id`) atau **Superadmin**:
   - 👉 **Ekspektasi**: Kontrol aktif dan dapat diubah.

- **Hasil yang Diharapkan**:
  - Pemisahan ranah wewenang PMB vs Akademik terjaga sesuai kesepakatan rapat.

---

## 🧪 MODUL 5: CRM Leads dari Rekomendasi Kawan

### TC-CRM-01: Monitoring Asal Referral & Update Status Follow-Up Kawan

| Atribut                | Keterangan                                                                                |
| :--------------------- | :---------------------------------------------------------------------------------------- |
| **ID Test Case** | `TC-CRM-01`                                                                             |
| **Deskripsi**    | 3–5 kontak kawan pendaftar muncul di CRM dan status follow-up dapat diperbarui real-time |
| **Halaman Uji**  | `/dashboard/crm` (Profil Mahasiswa ➔ Tab Registrasi Awal)                              |

#### Langkah-langkah Pengujian:

1. Login sebagai Admin CRM (`crm@nusadaya.ac.id`), buka profil mahasiswa ➔ **Tab Registrasi Awal**.
2. Periksa seksi **Data Akuisisi & Asal Referral**:
   - Rincian kategori referral, institusi, dan PIC tampil jelas.
3. Gulir ke tabel **Daftar Rekan / Kontak Kawan Prospek**:
   - Menampilkan 3–5 nama rekan kawan dan nomor WhatsApp yang diisi pendaftar.
   - Terdapat dropdown status follow-up per baris (*Belum Dihubungi, Sudah Dihubungi, Tertarik, Tidak Tertarik*).
4. Ubah salah satu status kawan dari `Belum Dihubungi` menjadi `Tertarik`.
   - 👉 **Ekspektasi**: Notifikasi sukses muncul, status langsung ter-update di database tanpa perlu reload halaman.

- **Hasil yang Diharapkan**:
  - Tim CRM dapat langsung memprospek kontak kawan calon mahasiswa untuk angkatan berikutnya.

---

## 🧪 MODUL 6: Standarisasi Dokumen Berkas (Pra-MCU, MCU Full, SLA, BPJS, Paspor)

### TC-DOC-01: Verifikasi Berkas SLA & BPJS Opsional di PMB

| Atribut                | Keterangan                                                                                        |
| :--------------------- | :------------------------------------------------------------------------------------------------ |
| **ID Test Case** | `TC-DOC-01`                                                                                     |
| **Deskripsi**    | Memastikan berkas SLA wajib di awal dan berkas BPJS bersifat opsional tidak memblokir pendaftaran |
| **Halaman Uji**  | `/dashboard/pmb` (Tab Checklist Berkas Mahasiswa)                                               |

#### Langkah-langkah Pengujian:

1. Login sebagai Admin PMB (`pmb@nusadaya.ac.id`), buka mahasiswa terkait di **Tab Checklist Berkas**.
2. Periksa daftar dokumen tambahan:
   - **Service Level Agreement (SLA)**: Tercantum sebagai dokumen wajib di awal (mencakup izin penggunaan dokumentasi foto/video untuk promosi).
   - **BPJS / Asuransi Kesehatan**: Tercantum dengan badge **"Opsional"** (tidak membatalkan kelulusan/ACC jika belum diunggah).
   - **Paspor**: Tercantum tanpa memblokir alur dasar PMB jika calon mahasiswa belum memiliki paspor.
3. Coba upload file PDF untuk salah satu berkas dan beri centang checklist.

- **Hasil yang Diharapkan**:
  - Berkas berhasil terunggah dan status checklist tersimpan normal.

---

### TC-DOC-02: Pembedaan Berkas Pra-MCU (PMB) vs MCU Full (Magang)

| Atribut                | Keterangan                                                             |
| :--------------------- | :--------------------------------------------------------------------- |
| **ID Test Case** | `TC-DOC-02`                                                          |
| **Deskripsi**    | Memastikan dokumen MCU terpisah: Pra-MCU di PMB dan MCU Full di Magang |
| **Halaman Uji**  | Panel PMB (`TabChecklist`) & Panel Magang (`TabDokumen`)           |

#### Langkah-langkah Pengujian:

1. Di **Panel PMB ➔ Tab Checklist Berkas**:
   - Pastikan terdapat item berkas **Pre-Medical Check Up (Pra-MCU Skrining Awal)**.
   - Terdapat banner informatif: *Ketentuan SLA Pra-MCU wajib diselesaikan maksimal 14 hari kerja setelah pendaftar dinyatakan ACC PMB.*
2. Buka menu **Magang ➔ Tab Dokumen Keberangkatan** (`/dashboard/magang`):
   - Pastikan terdapat item berkas terpisah: **Medical Check Up (MCU Full)** resmi laboratorium/RS menjelang keberangkatan.

- **Hasil yang Diharapkan**:
  - Alur medis terstruktur jelas: skrining awal di PMB dan MCU lengkap sebelum terbang di Magang.

---

## 📋 Lembar Matriks Eksekusi UAT (Sign-off Sheet)

| ID Test Case  | Modul / Skenario Pengujian                                         | Hasil Aktual |         Status         | Tester | Tanggal |
| :------------ | :----------------------------------------------------------------- | :----------- | :---------------------: | :----: | :-----: |
| `TC-PMB-01` | Form Publik 8 Tab (Kesehatan Murni, Ortu Fleksibel, Wajib 5 Kawan) |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-PMB-02` | Penolakan Bertarget Admin PMB (Wajib Pilih Tab)                    |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-PMB-03` | Tautan Revisi (`?tab=N`) & Stepper Silang Merah                  |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-FIN-01` | Auto-Populate Referral ke Fee Sharing Finance                      |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-FIN-02` | Master Pagu Tarif Default 4 Sub-Program                            |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-AKD-01` | Gatekeeper NIM Terkunci Saat Belum Clearance                       |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-AKD-02` | Buka Kunci NIM Setelah PMB ACC & Biaya Lunas                       |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-AKD-03` | Restriksi Hak Akses Role Status & Dosen PA                         |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-CRM-01` | Monitoring Referral & Update Follow-up Rekan CRM                   |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-DOC-01` | Berkas SLA Promosi & BPJS Opsional di PMB                          |              | `[ ] PASS / [ ] FAIL` |        |        |
| `TC-DOC-02` | Pemisahan Berkas Pra-MCU (PMB) vs MCU Full (Magang)                |              | `[ ] PASS / [ ] FAIL` |        |        |
