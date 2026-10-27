# Rencana Implementasi FIN-01: Executive Financial Dashboard Proyeksi Target & Realisasi
Rujukan: Catatan Perubahan FIN-01 & Notulensi Rapat ([Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf](file:///c:/.PROJECT/dashboard-nusadaya/Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf), Segmen 10 & 11)

---

## 1. Ikhtisar & Tujuan Pelaksanaan
Rencana kerja ini menyusun seluruh tahapan penerapan fitur FIN-01 ke dalam task-task terukur dan granular tanpa kode. Sasaran utamanya adalah menyediakan dashboard eksekutif keuangan yang menampilkan proyeksi target dan realisasi uang masuk yang dirinci ke dalam 3 sumber pendapatan pokok (**PMB/Registrasi Awal**, **SPP Taiwan**, dan **SPP D3 Malaysia**) serta dapat disaring dan dibandingkan **per angkatan** dengan visualisasi grafik komparasi dan tabel matriks.

---

## 2. Bagian I: Backend & Database (Sisi Server)

### Fase B1: Skema Database & Migrasi Data
- [x] **Task B1.1: Perancangan Skema Tabel Target Proyeksi (`finance_projection_targets`)**
  - Menetapkan struktur kolom tabel untuk menyimpan target:
    - ID unik (*Primary Key*)
    - Nomor angkatan / cohort (contoh: 15, 16, dst.)
    - Kategori sumber pendapatan (`pmb`, `spp_taiwan`, `spp_malaysia`)
    - Tahun periode target (contoh: 2026)
    - Bulan periode target (opsional, untuk target bulanan)
    - Tipe periode (`monthly`, `yearly`, `academic_cycle`)
    - Pagu nominal target (tipe data angka besar / bigint)
    - Catatan / memo tambahan
    - ID pengguna pembuat dan pengubah data (*audit trail*)
    - Timestamp pembuatan dan waktu pembaruan terakhir
  - Menetapkan constraint unik (*composite unique index*) pada kombinasi kolom `cohort`, `category`, `year`, dan `month` untuk mencegah penggandaan data target pada periode yang sama.

- [x] **Task B1.2: Pendaftaran Relasi Tabel Database**
  - Menghubungkan relasi antara tabel target proyeksi dengan tabel pengguna (*users*) di layer relasi ORM untuk mencatat identitas staf finance atau superadmin yang melakukan pembaruan target.

- [x] **Task B1.3: Eksekusi Migrasi Database**
  - Membuat berkas migrasi database baru.
  - Menjalankan proses migrasi ke database PostgreSQL development dan memvalidasi struktur tabel yang terbentuk.

- [x] **Task B1.4: Penyusunan Data Awal (Seeder Target Default)**
  - Menyiapkan skrip data awal (*seed data*) target proyeksi default untuk Angkatan 15 dan Angkatan 16 pada pos PMB, SPP Taiwan, dan SPP Malaysia agar antarmuka tidak kosong pada saat pertama kali dibuka.

---

### Fase B2: Logika Bisnis & Endpoint API
- [x] **Task B2.1: Perancangan Endpoint Pengambilan Data Proyeksi (`GET /finance/projections`)**
  - Menyusun penanganan parameter query filter: angkatan (*cohort*), tahun (*year*), bulan (*month*), dan rentang tanggal kustom (*date range*).
  - Mengimplementasikan query penarikan data target resmi dari tabel target proyeksi sesuai parameter filter.
  - Mengimplementasikan query kalkulasi realisasi penerimaan uang masuk riil dari data mahasiswa dengan kriteria:
    - Akumulasi pembayaran registrasi awal mahasiswa baru untuk pos PMB.
    - Akumulasi cicilan semester mahasiswa dengan peminatan atau tujuan Taiwan untuk pos SPP Taiwan.
    - Akumulasi cicilan semester mahasiswa dengan peminatan atau tujuan Malaysia untuk pos SPP D3 Malaysia.
  - Menghitung nilai kalkulasi turunan di server:
    - Persentase capaian target (`(Realisasi / Target) * 100%`) per pos pendapatan.
    - Sisa nominal yang harus dikejar jika realisasi masih di bawah target.
    - Surplus nominal jika realisasi telah melampaui target.
    - Total agregat keseluruhan sumber pendapatan (total target, total realisasi, total capaian, dan total selisih).
  - Menyusun struktur payload respons JSON yang rapi, terstandarisasi, dan mudah dikonsumsi oleh frontend.

- [x] **Task B2.2: Perancangan Endpoint Pembaruan Target (`POST /finance/projections/batch-update`)**
  - Menyusun penanganan payload input pembaruan target multi-pos dalam satu request (mencakup angkatan, tahun, bulan, serta daftar target nominal per kategori sumber).
  - Menerapkan validasi data masukan: pengecekan nilai angka positif, keabsahan nama kategori sumber, dan batasan tahun/angkatan.
  - Menerapkan mekanisme penyimpanan berbasis *upsert* (menambahkan baris baru jika target pada periode tersebut belum ada, atau memperbarui nominal jika target sudah ada).
  - Menyimpan ID user yang sedang login ke kolom riwayat pembaruan target.

- [x] **Task B2.3: Proteksi Hak Akses & Keamanan Endpoint (RBAC)**
  - Menerapkan middleware otorisasi pada endpoint pembaruan target: hanya memperbolehkan akun dengan peran `finance` dan `superadmin`.
  - Menerapkan izin akses *read-only* bagi peran pimpinan eksekutif untuk melihat data proyeksi tanpa hak mengubah angka target.

- [x] **Task B2.4: Mekanisme Invalidation Cache Real-Time**
  - Menghubungkan fungsi pembersihan cache data dashboard keuangan setiap kali terjadi penyimpanan target baru atau verifikasi pembayaran mahasiswa baru, memastikan angka yang disajikan selalu termutakhir.

- [x] **Task B2.5: Pengujian Fungsional API Backend**
  - Menguji keakuratan perhitungan realisasi kas masuk dengan berbagai variasi filter angkatan dan rentang tanggal.
  - Menguji skenario pengisian target baru dan pembaruan target eksisting.
  - Menguji proteksi keamanan sistem terhadap upaya pengubahan target oleh akun tanpa wewenang (*unauthorized test*).

---

## 3. Bagian II: Frontend & Visualisasi Antarmuka (Sisi Klien)

### Fase F1: Data Fetching & State Management
- [x] **Task F1.1: Pembuatan Custom Hook Proyeksi Finansial (`useFinanceProjections`)**
  - Mengimplementasikan query React Query untuk mengambil data dari endpoint proyeksi backend.
  - Menghubungkan parameter query dengan state filter aktif di dashboard (angkatan terpilih, preset rentang waktu, dan tanggal kustom).
  - Menangani siklus data: state saat memuat (*loading spinner*), penanganan saat terjadi kendala koneksi (*error boundary*), dan caching hasil respons.

- [x] **Task F1.2: Pembuatan Hook Mutasi Pembaruan Target (`useUpdateProjectionTargets`)**
  - Mengimplementasikan fungsi mutasi untuk mengirimkan data pembaruan target ke server.
  - Menambahkan feedback status berupa notifikasi toast interaktif (notifikasi sukses saat tersimpan, notifikasi peringatan jika gagal).
  - Mengatur invalidasi otomatis terhadap cache query data proyeksi agar tampilan dashboard langsung ter-refresh seketika tanpa memuat ulang peramban.

- [x] **Task F1.3: Pembersihan Ketergantungan LocalStorage**
  - Menghapus penggunaan `localStorage` untuk target proyeksi pada modul dashboard keuangan.
  - Memastikan seluruh angka target dan realisasi bersumber murni dari data server.

---

### Fase F2: Pembuatan Komponen Visual & Antarmuka Baru
- [x] **Task F2.1: Pembuatan Komponen Kartu Metrik 3 Lumbung Pendapatan (`FinanceStreamCards.tsx`)**
  - Merancang 3 kartu ringkasan visual untuk:
    1. Pos Pendaftaran Mahasiswa Baru (PMB)
    2. Pos SPP Persiapan Taiwan
    3. Pos SPP D3 Malaysia
  - Menampilkan elemen informasi pada setiap kartu:
    - Ikon identitas pos pendapatan dan label nama program.
    - Nominal uang masuk riil (*Realisasi Terkumpul*).
    - Nominal pagu proyeksi (*Target Resmi*).
    - Persentase capaian target dengan badge status visual dinamis (Tercapai / Berjalan Baik / Perlu Dikejar).
    - Informasi selisih nominal (sisa target yang harus dipenuhi atau surplus kas).
    - Batang progres mini (*mini progress bar*) visual per pos pendapatan.
  - Menyediakan 1 kartu ringkasan eksekutif untuk akumulasi total keseluruhan penerimaan institusi.

- [x] **Task F2.2: Pembuatan Komponen Grafik Batang Komparatif Recharts (`FinanceComparisonChart.tsx`)**
  - Membangun antarmuka grafik berbasis pustaka `recharts` yang responsif terhadap ukuran kontainer layar.
  - Mengonfigurasi tampilan grafik batang ganda (*Grouped Bar Chart*):
    - Sumbu X: Kategori Pendapatan (PMB, SPP Taiwan, SPP Malaysia, dan Total Keseluruhan).
    - Batang Kolom 1: Pagu Target Proyeksi.
    - Batang Kolom 2: Realisasi Uang Masuk Riil.
  - Menambahkan kartu ringkasan informasi saat kursor mengarah ke grafik (*Custom Currency Tooltip* format Rupiah).
  - Menyediakan kontrol tab pemilihan mode grafik:
    - Mode A: Komparasi Target vs Realisasi per Sumber Pendapatan.
    - Mode B: Komparasi Realisasi Lintas Angkatan (Angkatan 15 vs Angkatan 16 vs Angkatan Baru).

- [x] **Task F2.3: Pembuatan Komponen Tabel Matriks Proyeksi Eksekutif (`FinanceProjectionTable.tsx`)**
  - Merancang tabel data hierarkis di bawah grafik visual untuk menyajikan rincian lengkap:
    - Kolom 1: Nama Pos Sumber Pendapatan (disertai penanda warna program).
    - Kolom 2: Angkatan Terkait.
    - Kolom 3: Target Proyeksi (Rupiah).
    - Kolom 4: Realisasi Riil Terkumpul (Rupiah).
    - Kolom 5: Sisa Target / Surplus (Rupiah).
    - Kolom 6: Persentase Capaian beserta progress bar mini.
    - Kolom 7: Status Performa KPI.
    - Kolom 8: Tombol Aksi "Ubah Target" (hanya muncul bagi staf Finance dan Superadmin).
  - Menyertakan baris akumulasi total pada baris paling bawah tabel.

- [x] **Task F2.4: Pembuatan Komponen Modal Dialog Edit Target (`EditProjectionTargetModal.tsx`)**
  - Merancang dialog pop-up yang bersih dan terproteksi untuk mengubah pagu target.
  - Menyediakan form input nominal terpisah untuk pos PMB, SPP Taiwan, dan SPP Malaysia.
  - Menerapkan format pengetikan mata uang Rupiah otomatis pada field input untuk mencegah kesalahan pengetikan digit nol.
  - Menyajikan kalkulasi otomatis total target gabungan secara langsung di dalam modal sebelum tombol simpan ditekan.
  - Menyediakan tombol "Simpan Target" dengan indikator loading dan tombol "Batal".

---

### Fase F3: Perakitan (Assembly) Dashboard & Integrasi Filter
- [x] **Task F3.1: Reorganisasi Layout Halaman Dashboard Finance (`FinanceDashboard.tsx`)**
  - Menyusun ulang struktur hierarki tampilan dashboard dari atas ke bawah:
    1. Header Bar Eksekutif: Judul panel, pemilih angkatan (*cohort selector*), pemilih rentang tanggal transaksi, dan tombol aksi ekspor CSV.
    2. Baris Kartu Metrik Ringkasan: 3 Kartu Metrik Sumber Pendapatan + 1 Kartu Total Eksekutif.
    3. Baris Visualisasi Grafik: Komponen grafik komparasi Recharts.
    4. Baris Matriks Data: Tabel proyeksi rincian eksekutif.
    5. Baris Tabel Operasional: Tabel pemantauan data per mahasiswa (fitur yang sudah berjalan).

- [x] **Task F3.2: Integrasi Reaktif Filter Angkatan & Periode Waktu**
  - Menghubungkan dropdown pemilih angkatan agar saat diganti, seluruh kartu metrik, grafik, dan tabel proyeksi langsung memuat data angkatan tersebut.
  - Menghubungkan kontrol preset waktu (Bulan Ini, Bulan Lalu, 3 Bulan, Tahun Ini, Tanggal Kustom) agar kalkulasi realisasi uang masuk langsung terhitung ulang sesuai tanggal pembayaran transaksi.

- [x] **Task F3.3: Penyesuaian Responsivitas Antarmuka (Mobile & Tablet)**
  - Mengatur grid kartu metrik agar tersusun rapi menjadi 1 kolom di layar ponsel, 2 kolom di tablet, dan 4 kolom di desktop.
  - Memastikan komponen grafik Recharts menyusut secara fleksibel tanpa horizontal scrollbar yang merusak layout layar smartphone (sesuai arahan uji perangkat mobile di Segmen 24 rapat).

---

## 4. Bagian III: Pengujian, Validasi, & UAT (Finalisasi)

- [x] **Task V1.1: Pengujian Validasi Skenario Hak Akses (RBAC Testing)**
  - Uji Akun Finance (Desti): Memastikan modal ubah target dapat dibuka, disimpan, dan berhasil memperbarui database.
  - Uji Akun Superadmin: Memastikan kontrol penuh atas target proyeksi seluruh angkatan.
  - Uji Akun Non-Finance / Dosen: Memastikan dashboard hanya menampilkan data (*read-only*) dan tombol aksi ubah target disembunyikan.

- [x] **Task V1.2: Uji Rekonsiliasi & Akurasi Angka Keuangan**
  - Membandingkan hasil penjumlahan transaksi di tabel mahasiswa dengan angka realisasi yang tampil pada kartu metrik dan grafik. Memastikan tidak ada perbedaan nilai nominal uang masuk.
  - Memvalidasi pemilahan transaksi: memastikan pembayaran mahasiswa program Taiwan masuk ke pos SPP Taiwan, pembayaran mahasiswa program Malaysia masuk ke pos SPP Malaysia, dan registrasi pendaftaran masuk ke pos PMB.

- [x] **Task V1.3: Uji Stabilitas Antarmuka & Performa Rendering**
  - Memastikan tidak ada *re-render* berulang (*lagging*) saat pengguna berpindah-pindah filter tanggal atau angkatan.
  - Memastikan seluruh modal dialog tertutup dengan mulus dan data langsung terbarui secara reaktif tanpa perlu refresh browser penuh (*full reload*).
