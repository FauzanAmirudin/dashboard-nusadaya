# Rencana Implementasi Pembaruan Formulir PMB & Superadmin (Poin 1 - 9)
**Dokumen Referensi**: `Catatan_Update_PMB_Nusadaya_Developer.pdf`  
**Target Modul**: Panel PMB & Superadmin (Formulir Tambah & Edit Mahasiswa Baru)  
**Status**: Selesai Diimplementasikan (100%)  

---

## 1. Ringkasan Eksekutif & Analisis Kebutuhan

Berdasarkan hasil evaluasi operasional pendaftaran mahasiswa baru di sistem OneData Nusadaya, formulir pendaftaran saat ini memiliki beberapa kendala yang menghambat kecepatan staf PMB dalam memasukkan data. Beberapa isian mewajibkan data yang belum tentu dimiliki calon mahasiswa di awal, beberapa pilihan wilayah dan angkatan masih diketik manual sehingga rentan terjadi kesalahan input (*human error*), serta riwayat kesehatan fisik belum terakomodasi secara terperinci.

Pembaruan ini mencakup 9 poin utama pada antarmuka formulir:
1. **Nomor Rumah (Alamat Domisili)**: Dihapus dari kewajiban pengisian (bersifat opsional) karena banyak pendaftar berasal dari wilayah pedesaan/perumahan tanpa nomor rumah resmi.
2. **Wilayah Domisili (Provinsi > Kota > Kecamatan > Kelurahan)**: Diganti dari input teks bebas menjadi dropdown bertingkat (*cascading*) berurutan alfabetis (A–Z) guna mencegah variasi salah ketik.
3. **Pilihan Kelas**: Ditambahkan opsi `"Blended Learning (Online & Offline)"` melengkapi opsi *Offline* dan *Online-LMS*.
4. **Angkatan & Tahun Ajaran**: Disediakan dropdown otomatis yang menghitung angkatan aktif dan angkatan berikutnya secara dinamis berdasarkan tahun kalender berjalan (contoh: Angkatan 17 untuk 2025/2026, Angkatan 18 untuk 2026/2027) tanpa perlu diubah manual setiap tahun.
5. **Jurusan Sekolah Asal**: Dihapus dari kewajiban pengisian (bersifat opsional) untuk memfasilitasi lulusan sekolah non-formal atau program paket kesetaraan.
6. **Golongan Darah**: Ditambahkan opsi `"Belum Diketahui"` bagi calon mahasiswa yang belum sempat menjalani cek golongan darah saat pendaftaran awal.
7. **Riwayat Kesehatan (Patah Tulang & Operasi)**: Ditambahkan pertanyaan biner (Ya / Tidak):
   - Jika pernah patah tulang: wajib mengisi bagian tubuh mana yang patah dan tahun berapa kejadiannya.
   - Jika pernah menjalani operasi: wajib mengisi jenis operasi dan tahun berapa dioperasi.
8. **Penyederhanaan Data Orang Tua**: Dipangkas sehingga hanya mewajibkan 3 atribut utama per orang tua: **(1) Nama Lengkap**, **(2) Keadaan (Hidup / Meninggal)**, dan **(3) Kewarganegaraan**. Field lainnya (tempat/tanggal lahir, agama, pekerjaan, pendidikan, alamat, telepon, email) menjadi opsional.
9. **Penataan Alur Pengisian Wali**: Diawali dengan pertanyaan penentu peran wali: `[Ayah Kandung | Ibu Kandung | Wali Lainnya]`. Jika memilih Ayah atau Ibu, data wali langsung terisi otomatis dari data orang tua tanpa input ulang. Jika memilih Wali Lainnya, form isian wali mandiri baru ditampilkan.

---

## 2. Analisis Dampak Arsitektur Sistem

### 2.1. Lapisan Basis Data (PostgreSQL & Drizzle ORM)
- **Tabel `student_health`**:
  - Saat ini hanya memiliki kolom dasar (`blood_type`, `disease_history`, `congenital_disease`, `height`, `weight`, `clothing_size`).
  - Perlu penambahan kolom baru:
    - Status patah tulang (`has_bone_fracture`)
    - Lokasi patah tulang (`bone_fracture_location`)
    - Tahun kejadian patah tulang (`bone_fracture_year`)
    - Status pernah operasi (`has_surgery`)
    - Jenis/deskripsi operasi (`surgery_type`)
    - Tahun operasi (`surgery_year`)
- **Tabel `students` & `student_parents`**:
  - Kolom alamat, nomor rumah, jurusan sekolah, dan data orang tua sudah mendukung nilai *nullable* di basis data sehingga tidak memerlukan alterasi struktur tabel.

### 2.2. Lapisan Backend API (Elysia.js)
- **Modul `apps/api/src/routes/student/core.ts`**:
  - Fungsi pipeline pendaftaran mahasiswa (`createStudentPipeline`) perlu disesuaikan untuk membaca dan menyimpan data riwayat patah tulang dan operasi ke tabel `student_health`.
  - Endpoint pembaruan data mahasiswa (`PUT /students/:id`) perlu memperbarui record `student_health` yang bersangkutan.
  - Skema respon detail mahasiswa (`GET /students/:id` dan `/students/:id/health`) harus menyertakan field baru tersebut.

### 2.3. Lapisan Antarmuka Frontend (Next.js & React)
- **Formulir Pendaftaran Mahasiswa Baru (`apps/web/src/app/dashboard/students/add/page.tsx`)**:
  - Merupakan pusat implementasi utama dari poin 1 sampai 9.
  - Perlu restrukturisasi validasi per tab (`validateTab`), penyesuaian state `formData`, dan perbaikan pada payload pengiriman data.
- **Formulir Edit Mahasiswa (`apps/web/src/app/dashboard/students/[id]/edit/page.tsx`)**:
  - Harus diselaraskan secara penuh dengan form penambahan agar konsistensi skema input terjaga saat pengubahan data.
- **Tampilan Detail Mahasiswa (`apps/web/src/app/dashboard/students/[id]/profile/page.tsx`)**:
  - Perlu menampilkan status patah tulang (bagian tubuh dan tahun) serta riwayat operasi (jenis dan tahun) pada tab/kartu Keterangan Kesehatan.

---

## 3. Rencana Kerja Implementasi (Breakdown Tasks)

### FASE 1: Skema Basis Data & Sinkronisasi ORM
- [x] **Task 1.1**: Definisi Kolom Kesehatan Baru pada Skema Drizzle
  - Memperbarui file skema basis data bersama untuk menambahkan kolom status patah tulang, lokasi patah tulang, tahun patah tulang, status operasi, jenis operasi, dan tahun operasi pada tabel kesehatan mahasiswa.
- [x] **Task 1.2**: Eksekusi Sinkronisasi Skema Basis Data
  - Menjalankan perintah migrasi skema (*drizzle-kit push*) ke basis data PostgreSQL agar kolom baru tersedia di sistem.
- [x] **Task 1.3**: Verifikasi Struktur Tabel Basis Data
  - Memastikan kolom baru pada tabel kesehatan mahasiswa telah terdefinisi dengan tipe data dan aturan *nullability* yang sesuai.

---

### FASE 2: Penyesuaian Endpoint Backend API
- [x] **Task 2.1**: Pembaruan Pipeline Pembuatan Mahasiswa (`createStudentPipeline`)
  - Memperluas pemetaan payload data kesehatan saat insert mahasiswa baru agar kolom riwayat patah tulang (termasuk tahun kejadian) dan riwayat operasi (termasuk tahun operasi) tersimpan dengan benar.
- [x] **Task 2.2**: Pembaruan Handler Pembaruan Data Mahasiswa (`PUT /students/:id`)
  - Menyelaraskan logika update entitas kesehatan mahasiswa saat staf mengedit profil mahasiswa dari dashboard.
- [x] **Task 2.3**: Penyesuaian Endpoint Pengambilan Data Detail & Kesehatan
  - Memastikan endpoint pembacaan detail data mahasiswa mengembalikan seluruh properti riwayat kesehatan baru untuk kebutuhan tampilan dashboard dan form edit.

---

### FASE 3: Modul & Utilitas Pendukung Frontend
- [x] **Task 3.1**: Modul Data Wilayah Administratif Indonesia Bertingkat
  - Menyediakan pustaka pembantu data wilayah Indonesia (Provinsi, Kabupaten/Kota, Kecamatan, dan Kelurahan/Desa) yang terurut alfabetis (A–Z).
  - Menyediakan fungsi pemanggilan data berjenjang di mana pemilihan provinsi mengambil daftar kota/kabupaten terkait, dan seterusnya.
- [x] **Task 3.2**: Modul Generator Angkatan & Tahun Ajaran Dinamis
  - Membuat fungsi kalkulasi otomatis yang menentukan nomor angkatan dan rentang tahun ajaran berdasarkan kalender akademik tahun berjalan (misal: Angkatan 17 untuk 2025/2026 dan Angkatan 18 untuk 2026/2027).
  - Memastikan logika dapat bergeser maju secara mandiri di masa mendatang tanpa perlu intervensi hardcode developer.

---

### FASE 4: Pembaruan Formulir Tambah Mahasiswa (`students/add/page.tsx`)
- [x] **Task 4.1**: Tab 1 (Alamat Domisili) – Nomor Rumah Opsional (Poin 1)
  - Menghapus tanda bintang merah (*) pada label No. Rumah.
  - Menghapus field nomor rumah dari daftar isian wajib pada fungsi validasi tab keterangan mahasiswa.
- [x] **Task 4.2**: Tab 1 (Alamat Domisili) – Dropdown Wilayah Bertingkat (Poin 2)
  - Mengganti input teks manual pada Provinsi, Kabupaten/Kota, Kecamatan, dan Kelurahan/Desa dengan menu pilihan bertingkat.
  - Mengimplementasikan pengurutan alfabetis A–Z pada setiap level wilayah.
  - Memasang logika reset otomatis pada field anak ketika field induk diubah (contoh: mengubah provinsi otomatis mengosongkan kota, kecamatan, dan kelurahan).
- [x] **Task 4.3**: Tab 2 (Pendidikan) – Penambahan Opsi Blended Learning (Poin 3)
  - Menambahkan opsi "Blended Learning (Online & Offline)" pada komponen dropdown tipe kelas.
- [x] **Task 4.4**: Tab 2 (Pendidikan) – Pemilihan Angkatan & Tahun Ajaran Otomatis (Poin 4)
  - Mengganti input manual angkatan dan tahun ajaran dengan menu dropdown terpadu bersumber dari utilitas generator dinamis.
  - Memastikan pemilihan opsi angkatan secara otomatis mengisi nilai nomor angkatan dan format tahun ajaran pada state form.
- [x] **Task 4.5**: Tab 2 (Pendidikan) – Jurusan Sekolah Asal Opsional (Poin 5)
  - Menghapus tanda bintang merah (*) pada label Jurusan Sekolah.
  - Mengeluarkan kolom jurusan sekolah dari daftar validasi wajib tab pendidikan.
- [x] **Task 4.6**: Tab 3 (Kesehatan) – Pilihan Golongan Darah 'Belum Diketahui' (Poin 6)
  - Menambahkan pilihan "Belum Diketahui" pada dropdown golongan darah.
- [x] **Task 4.7**: Tab 3 (Kesehatan) – Form Kondisional Patah Tulang & Operasi (Poin 7)
  - Menambahkan elemen pilihan Ya/Tidak untuk pertanyaan "Pernah patah tulang?".
  - Menampilkan input wajib bagian tubuh dan tahun kejadian hanya jika jawaban adalah "Ya".
  - Menambahkan elemen pilihan Ya/Tidak untuk pertanyaan "Pernah menjalani operasi?".
  - Menampilkan input wajib jenis operasi dan tahun operasi hanya jika jawaban adalah "Ya".
  - Memperbarui fungsi validasi tab kesehatan agar memvalidasi kelengkapan rincian dan tahun sesuai kondisi jawaban.
- [x] **Task 4.8**: Tab 4 & 5 (Orang Tua) – Penyederhanaan Data Ayah & Ibu (Poin 8)
  - Menyesuaikan form Ayah Kandung: hanya memberi tanda wajib (*) pada Nama, Status/Keadaan, dan Kewarganegaraan.
  - Menyesuaikan form Ibu Kandung: hanya memberi tanda wajib (*) pada Nama, Status/Keadaan, dan Kewarganegaraan.
  - Memperbarui fungsi validasi tab Ayah dan Ibu agar hanya mewajibkan 3 field utama, serta melakukan pemeriksaan format email dan panjang nomor telepon hanya jika diisi oleh staf.
- [x] **Task 4.9**: Tab 6 (Wali) – Alur Pemilihan Wali Terpadu (Poin 9)
  - Menempatkan selektor peran wali di awal tab: Ayah Kandung, Ibu Kandung, atau Wali Lainnya.
  - Menerapkan logika sinkronisasi otomatis: jika Ayah Kandung atau Ibu Kandung dipilih, data wali langsung diambil dari form orang tua terkait dan ditampilkan dalam bentuk ringkasan terkonfirmasi.
  - Menampilkan formulir input data wali mandiri hanya jika memilih opsi "Wali Lainnya".
  - Menyesuaikan validasi tab wali agar langsung terpenuhi bila wali merujuk pada orang tua yang sudah lengkap.
- [x] **Task 4.10**: Perakitan Payload Submit Formulir Tambah Mahasiswa
  - Memperbarui struktur objek payload pada handler pengiriman form untuk menyertakan seluruh field baru (riwayat kesehatan beserta tahun, tipe kelas, dan data wali tersinkronisasi) ke backend API.

---

### FASE 5: Penyelarasan Halaman Edit & Tampilan Detail
- [x] **Task 5.1**: Penerapan Penyesuaian pada Formulir Edit Mahasiswa (`students/[id]/edit/page.tsx`)
  - Mengimplementasikan seluruh penyesuaian Poin 1 s.d. 9 (nomor rumah opsional, wilayah bertingkat, tipe kelas blended, pemilihan angkatan, jurusan opsional, golongan darah belum diketahui, patah tulang & operasi beserta tahun, penyederhanaan ortu, dan alur wali) pada form edit mahasiswa.
  - Memastikan data lama terpetakan secara presisi saat halaman edit dimuat.
- [x] **Task 5.2**: Pembaruan Halaman Profil Mahasiswa (`students/[id]/profile/page.tsx`)
  - Menambahkan baris informasi status patah tulang (termasuk lokasi dan tahun) serta riwayat operasi (termasuk jenis dan tahun) pada panel Keterangan Kesehatan.

---

### FASE 6: Pengujian & Validasi Kualitas (Quality Assurance)
- [x] **Task 6.1**: Pengujian Kasus Isian Opsional
  - Menguji pengiriman form dengan mengosongkan nomor rumah dan jurusan sekolah untuk memastikan proses pendaftaran tetap berhasil.
- [x] **Task 6.2**: Pengujian Validasi Kondisional Kesehatan
  - Menguji pilihan "Tidak" pada patah tulang dan operasi (form dapat lanjut tanpa mengisi rincian).
  - Menguji pilihan "Ya" pada patah tulang dan operasi tanpa mengisi rincian/tahun (sistem memunculkan pesan peringatan validasi).
  - Menguji pilihan "Ya" dengan rincian dan tahun lengkap (form berhasil lolos).
- [x] **Task 6.3**: Pengujian Penyederhanaan Data Orang Tua
  - Menguji pengisian form dengan hanya mengisi Nama, Keadaan, dan Kewarganegaraan orang tua, memastikan tidak ada hambatan validasi pada kolom opsional lainnya.
- [x] **Task 6.4**: Pengujian Alur Sinkronisasi Wali
  - Menguji pemilihan wali Ayah Kandung dan Ibu Kandung untuk memastikan data wali tersimpan identik dengan data orang tua di database.
  - Menguji pemilihan Wali Lainnya dengan memasukkan data wali mandiri.
- [x] **Task 6.5**: Pengujian Pemilihan Wilayah Bertingkat & Angkatan Otomatis
  - Memastikan opsi wilayah berurutan dari A sampai Z dan filter bertingkat berfungsi tanpa lag.
  - Memastikan opsi angkatan dan tahun ajaran terhitung akurat sesuai kalender akademik aktif.
