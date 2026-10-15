# DOKUMEN ANALISIS KESENJANGAN SISTEM (GAP ANALYSIS)
## Evaluasi Keberjalanan One Data Nusadaya vs Notulensi Rapat Stakeholder & Catatan Revisi

> **Nomor Dokumen:** GA-NUSADAYA-2026-10-01  
> **Tanggal Analisis:** 15 Oktober 2026  
> **Dasar Rujukan:**  
> 1. Notulensi Rapat & Transkrip Audio Resmi: *1 September 2026 / 7 Oktober 2026 (Durasi: 121:41, 25 Segmen)*  
> 2. Dokumen Sumber: [Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf](file:///c:/.PROJECT/dashboard-nusadaya/Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf)  
> 3. Catatan Revisi Utama: **Panel Akademik, Pemisahan Rombel (Kelas A & B) & Standarisasi Ruang** (Segmen 17)  
> **Lead Developer / PIC:** Fauzan & Andri  
> **Pimpinan & Stakeholder Rapat:** Pak Refly, Desti (Finance), Tim Akademik, Tim PMB, Tim CRM, Tim Magang  

---

## 1. Ringkasan Eksekutif & Konteks Analisis

Sistem **One Data Nusadaya** dikembangkan sebagai platform *Enterprise Resource Planning* (ERP) terintegrasi untuk menyatukan 5 modul inti operasional:
1. **PMB (Penerimaan Mahasiswa Baru)** & Registrasi Mandiri Siswa
2. **CRM & Relasi Wali/Mahasiswa** (Monitoring Hafalan, Presensi, ODS, Tri Dharma)
3. **Finance (Keuangan)** (4 Termin Biaya, Cicilan Dinamis, Fee Sharing Bertahap, RAB Praktik Dosen)
4. **Akademik & Penjadwalan** (Manajemen Matkul, Rombel Kelas A/B, Ruangan, Team Teaching, Presensi Dosen & Import Excel)
5. **Magang Luar Negeri (Taiwan & Malaysia)** (Pra-Paspor, Dokumen Suhan/Kontrak/LOA/MOU, Penempatan, Asesmen & Ahli Waris)

Hasil audit mendalam terhadap basis kode aktif (`apps/api` dan `apps/web`) dibandingkan dengan 25 segmen transkrip rapat menunjukkan bahwa arsitektur fondasi sistem telah berjalan baik pada sebagian besar alur. Namun demikian, **ditemukan sejumlah kesenjangan fungsional material (gaps)** yang belum terakomodasi atau masih menggunakan asumsi lama sebelum rapat diadakan.

---

## 2. Matriks Evaluasi Kesenjangan Per Modul (Gap Analysis Matrix)

| Modul | Segmen Rapat | Fitur / Komponen | Status di Sistem Berjalan Saat Ini | Kebutuhan Stakeholder (Rapat & Revisi) | Status Gap | Tingkat Urgensi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Akademik** | Segmen 17 | **Pemisahan Rombongan Belajar (Kelas A & B)** | Tabel `students`, `courses`, dan `classSchedules` belum memiliki kolom `rombel` / `classGroup`. Siswa satu angkatan masih tergabung secara umum. | Pembagian rombel resmi (Kelas A dan Kelas B) per angkatan untuk mencegah bentrok jadwal perkuliahan. | **Kritis (Belum Ada)** | **P0 (Urgent)** |
| **Akademik** | Segmen 17 | **Mata Kuliah Multi-Kelas Paralel** | Tabel `courses` memiliki *unique constraint* pada `code`, dan satu mata kuliah hanya terikat pada 1 dosen & 1 jadwal umum. | Satu kode mata kuliah harus siap dibuka untuk multi-kelas paralel (Kelas A & B) dengan pengampu atau jadwal terpisah. | **Kritis (Belum Ada)** | **P0 (Urgent)** |
| **Akademik** | Segmen 17 | **Standarisasi Nama Ruang Kampus** | Ruangan pada form penjadwalan masih berupa *free-text input* (`<Input placeholder="Contoh: Ruang Teori 2" />`). Rawan *typo*. | Standarisasi baku nama ruangan: `Lantai 4 Rapat Utama`, `Lantai 2 Asosiasi Barista`, `Lab Komputer`, dsb. berbasis master/dropdown. | **Kritis (Input Bebas)** | **P0 (Urgent)** |
| **Akademik** | Segmen 15 | **Deteksi Bentrok Jadwal Berbasis Rombel** | Algoritma deteksi bentrok hanya mengecek `room` dan `dosenId`. Belum mengecek bentrok jadwal siswa per rombel. | Sistem otomatis menolak jadwal jika Rombel (misal: Angkatan 16 Kelas A) dijadwalkan pada 2 matkul bersamaan. | **Kesenjangan Logika** | **P0 (Urgent)** |
| **Akademik** | Segmen 15 | **Cetak & Ekspor Jadwal Kelas** | Belum ada tombol atau fungsi ekspor PDF / Print jadwal kelas di frontend penjadwalan. | Penambahan tombol cetak/ekspor jadwal perkuliahan per angkatan dan per kelas langsung dari sistem. | **Belum Tersedia** | **P1 (High)** |
| **Akademik** | Segmen 18 | **Team Teaching & Rekap Presensi Dosen** | Tabel `courses` hanya menyimpan single `dosenId`. Belum ada pencatatan kehadiran mengajar dosen per pertemuan/bulan. | Rekapitulasi kehadiran dosen per bulan di dashboard akademik & dosen; dukungan 2 dosen pengampu per mata kuliah (*team teaching*). | **Belum Tersedia** | **P1 (High)** |
| **Akademik** | Segmen 18 | **Import Massal Data Mahasiswa via Excel** | Hanya ada input perorangan lewat PMB/admin. Tidak ada endpoint/form import batch. | Template Excel standar untuk mengimpor data induk mahasiswa lama (Angkatan 15 & 16) secara massal ke database. | **Belum Tersedia** | **P1 (High)** |
| **PMB** | Segmen 2, 3 | **Tautan Revisi Mandiri Berbasis Centang Merah** | Token form publik sudah mendukung `rejectedFields` dan `rejectedTabs` ketika di-reject oleh admin PMB. | Siswa dapat membuka kembali link pendaftaran tanpa hangus, dan langsung tertuju pada kolom bertanda centang merah saja. | **Sebagian Selesai** | **P1 (Polish)** |
| **PMB** | Segmen 3, 4 | **Pelacakan Sumber Pendaftar & Double Validation** | Field sumber/referral sudah ada di schema dan form siswa (termasuk "Siapa yang merekomendasikan Anda?"). | Memastikan integrasi data pendaftar langsung mengalir ke perhitungan fee sharing Finance tanpa jeda. | **Selesai di Form** | **P2 (Normal)** |
| **PMB** | Segmen 4, 5 | **Kontak Darurat & Rekomendasi Kawan (3–5)** | Form publik sudah mewajibkan kontak darurat keluarga & 3-5 nomor kawan aktif di Tab 8. | Validasi form mencegah submit jika nomor kontak darurat dan kawan aktif (<3) belum terisi lengkap. | **Selesai di Form** | **P2 (Normal)** |
| **PMB** | Segmen 5 | **Pemisahan Wewenang Status Siswa & PA** | Status mahasiswa (`aktif`, `cuti`, `dropout`, dll.) dan Penunjukan PA telah dipindahkan ke modul Akademik. | PMB murni untuk administrasi penerimaan; status mahasiswa dan PA dikelola di Akademik. | **Selesai Dipindah** | **P2 (Normal)** |
| **PMB** | Segmen 5 | **Pemberian NIM Berbasis Clearance DP Finance** | Komponen `TabDataMahasiswa` di Akademik sudah menerapkan gatekeeper `clearanceStatus.canReleaseNim`. | NIM hanya dapat di-assign setelah verifikasi pembayaran DP oleh Finance. | **Selesai Dibuat** | **P2 (Normal)** |
| **PMB** | Segmen 6 | **SLA & Izin Promosi di Awal Pendaftaran** | Field `docSla` baru ada di tabel `pmbData`, namun **belum ada persetujuan SLA & hak promosi** di form publik `form/[token]`. | Penambahan persetujuan SLA dan persetujuan hak penggunaan foto/video promosi institusi di tahap registrasi awal. | **Belum Terpasang** | **P1 (High)** |
| **PMB** | Segmen 6 | **Dua Tahap MCU & BPJS Kesehatan Opsional** | Field BPJS sudah bersifat opsional; Pra-MCU sudah dipisahkan dari MCU Full di Magang. | Pendaftar tanpa paspor & tanpa BPJS tidak boleh diblokir untuk menyelesaikan pendaftaran. | **Selesai** | **P2 (Normal)** |
| **Finance** | Segmen 10, 11 | **Target Proyeksi Keuangan Rinci per Sumber Pendapatan** | `FinanceDashboard` hanya memiliki 1 input manual target total (`targetNominal`) yang disimpan di `localStorage`. | Target proyeksi harus dirinci per sumber pendapatan (SPP Taiwan, SPP Malaysia, PMB) dan per angkatan dengan persentase realisasi. | **Kritis (Belum Ada)** | **P0 (Urgent)** |
| **Finance** | Segmen 11, 24 | **Struktur 4 Tahap Biaya Pendidikan Baku** | Masih menggunakan istilah "Perkuliahan 6 Semester" dan "Interview Magang" pada beberapa checklist dan tampilan. | Standarisasi 4 Termin: (1) Registrasi Awal, (2) SPP Semester 1 (Cicilan Dinamis), (3) Kontrak Magang / Suhan, (4) Penempatan Magang Taiwan. | **Perlu Penyesuaian** | **P1 (High)** |
| **Finance** | Segmen 11, 12 | **Fleksibilitas Cicilan Bulanan Semester 1 Dinamis** | Ada tabel `finance_semester_installments`, namun form input cicilan per bulan dinamis (Agustus, September, dst.) belum leluasa dibuat admin. | Admin Finance dapat menambahkan baris tagihan cicilan per bulan secara dinamis sesuai kesepakatan mahasiswa. | **Perlu Perbaikan UI** | **P1 (High)** |
| **Finance** | Segmen 12 | **Dana Talangan Fleksibel 1 Tahap vs 2 Tahap** | Form talangan telah memiliki field Tahap 1 & 2, tetapi belum ada tombol pemilihan opsi 1 tahap (keberangkatan) vs 2 tahap (interview + visa). | Fitur pilihan skema talangan: 1 tahap (langsung keberangkatan) atau 2 tahap (tahap 1 & tahap 2) dengan nominal fleksibel sesuai akad. | **Perlu Penyempurnaan** | **P1 (High)** |
| **Finance** | Segmen 13 | **Pencairan Fee Sharing Bertahap & Multi-Bukti** | Tabel `fee_share_recipients` hanya menyimpan 1 `nominalFee`, 1 `statusPencairan`, dan 1 `invoiceFileUrl`. | Dukungan pencairan bertahap (misal: termin 1 cair 50% lalu termin 2 sisanya) dengan upload bukti transfer per termin pencairan. | **Kritis (Belum Ada)** | **P0 (Urgent)** |
| **Finance** | Segmen 13 | **Alur Anggaran Praktik Dosen & Tombol ACC/Tolak** | Sudah ada tabel `practicesBudgetRequests` dan halaman `/anggaran-praktik`, namun dilaporkan sempat terdapat bug pada form submit dan aksi ACC/Tolak. | Memastikan dosen dapat mengajukan RAB bahan per matkul, dan Finance dapat menyetujui (ACC) atau menolak dengan catatan tertulis tanpa error. | **Perlu Pengujian Bug** | **P1 (High)** |
| **CRM** | Segmen 7, 8 | **Monitoring Hafalan Kosakata & Kalimat oleh PA** | Fitur hafalan sudah ada di tab PA dan CRM (`pa_hafalan_sessions`), Dosen PA menginput tanggal, bahasa, jumlah kata/kalimat. | Memastikan input setoran hafalan mudah digunakan oleh dosen PA dan terupdate secara *real-time* di tab CRM. | **Sudah Tersedia** | **P2 (Normal)** |
| **CRM** | Segmen 8 | **Ekspor Rekap Kehadiran Siswa ke PDF untuk Orang Tua** | `TabKehadiran.tsx` di CRM hanya menampilkan metrik dan persentase di layar, belum ada tombol ekspor/cetak laporan PDF. | Tombol ekspor rekap presensi mahasiswa berformat PDF resmi agar staf CRM dapat langsung mengirimkan laporan ke orang tua siswa. | **Belum Tersedia** | **P1 (High)** |
| **CRM** | Segmen 9, 10 | **Struktur 5 Sesi ODS & Opsi Desa vs Sekolah** | Mahasiswa wajib 5 kali ODS. Form di CRM sudah mendukung 5 laporan, namun opsi kategori lokasi (`Sekolah Mitra` vs `Desa Binaan`) belum ada. | Penambahan pemilihan kategori lokasi pelaksanaan (Sekolah vs Desa) serta integrasi Tri Dharma (PKM/Penelitian dosen). | **Sebagian Ada** | **P1 (High)** |
| **CRM / Portal Siswa** | Segmen 9 | **Unggah Tautan Video Konten Bulanan Mahasiswa** | Portal mahasiswa di CRM hanya menyediakan unggah laporan pra-magang PDF, belum ada form input link video konten bulanan. | Mahasiswa wajib menginput 1 tautan video konten setiap bulan melalui portal akun mahasiswa secara mandiri. | **Belum Tersedia** | **P1 (High)** |
| **Magang** | Segmen 19 | **Integrasi Nilai KHS & Transkrip Digital ke Magang** | Modul pra-paspor magang masih mengharuskan upload scan KHS dan Transkrip secara manual. | Rekap KHS dan transkrip nilai akademik otomatis terintegrasi/muncul di tab Magang dari nilai perkuliahan akademik. | **Belum Terintegrasi** | **P1 (High)** |
| **Magang** | Segmen 19 | **Pemisahan Slot Berkas Ijazah & Transkrip** | Pada `TabPraPaspor.tsx` sudah dipisahkan antara slot Ijazah (item 13) dan Transkrip (item 12). | Pemisahan tegas antara dokumen Ijazah pendidikan terakhir dan Transkrip nilai agar tidak tertukar. | **Selesai** | **P2 (Normal)** |
| **Magang** | Segmen 20 | **Hapus Istilah "LOL" & Standarisasi 6 Urutan Berkas** | Di `TabDokumen.tsx` dan schema masih terdapat `lolReady`, `moaReady`. Suhan belum masuk daftar checklist dokumen utama. | Hapus istilah LOL. Terapkan 6 urutan baku: (1) MOU Kampus & Hotel, (2) LOA, (3) Kontrak Magang, (4) Suhan Taiwan, (5) MCU Full, (6) Visa. | **Kritis (Perlu Refactor)** | **P0 (Urgent)** |
| **Magang** | Segmen 20, 22 | **Standarisasi Istilah "Suhan" & Penamaan Asesmen** | Label Suhan belum terstandarisasi lengkap; istilah pelatihan pra-keberangkatan (PDT) belum diubah. | Penamaan resmi: *'Suhan - Surat Persetujuan Magang Mahasiswa WNI di Taiwan'* & *'Asesmen dan Pengarahan Keberangkatan'* (2 unggahan berkas). | **Perlu Penyesuaian** | **P1 (High)** |
| **Magang** | Segmen 21 | **Form Penempatan & 5 Departemen Perhotelan** | Form penempatan masih menggunakan label umum agen sponsor. | Standarisasi istilah 'Mitra Penempatan'; form penempatan mencakup Hotel, Kota, Durasi, Mitra, & 5 Departemen: HK, FBS, FBP, FO, Barista. | **Perlu Penyesuaian** | **P1 (High)** |
| **Magang** | Segmen 21 | **Slot Dokumen Tambahan Mitra Penempatan** | Belum ada slot unggahan dokumen tambahan yang fleksibel sebelum tahap visa. | Slot dokumen tambahan opsional sebelum visa untuk syarat spesifik agensi (e.g. *postpone graduation*, *landing permit*). | **Belum Tersedia** | **P1 (High)** |
| **Magang** | Segmen 22, 23 | **Pencatatan Asuransi & Data Ahli Waris Sah** | Sistem belum mencatat identitas dan relasi ahli waris sah mahasiswa magang secara terpusat untuk keperluan santunan. | Form pencatatan data ahli waris (nama, hubungan, kontak, berkas KK/akta) untuk mempermudah penyaluran klaim asuransi jika musibah terjadi. | **Belum Tersedia** | **P1 (High)** |
| **Arsitektur ERP** | Segmen 25 | **Manajemen Multi-Role User** | Field `users.roles` (jsonb) sudah ada dan `Sidebar.tsx` sudah menggunakan `hasRole(user, ...roles)`. | Satu akun staf/dosen dapat memegang beberapa peran sekaligus (misal Dosen + PA) tanpa perlu banyak akun/password. | **Sudah Berjalan** | **P2 (Normal)** |
| **Arsitektur ERP** | Segmen 18, 24 | **Presensi GPS & Responsivitas Mobile** | Belum ada validasi koordinat GPS kampus pada form presensi. Tampilan web telah responsif namun aplikasi native mobile belum ada. | Geotagging GPS disepakati bertahap; antarmuka web mobile responsif (iOS/Android) dipastikan lancar. | **Roadmap Bertahap** | **P2 (Roadmap)** |
| **Arsitektur ERP** | Segmen 25 | **Backup Database Otomatis** | Tabel `backup_jobs` dan worker `backup.worker.ts` telah ada, namun belum memiliki jadwal *cron* otomatis terkonfigurasi di server. | Mekanisme pencadangan data otomatis harian/mingguan untuk menjamin keamanan arsip institusi. | **Perlu Aktivasi Cron** | **P1 (High)** |

---

## 3. Analisis Mendalam Kebutuhan Khusus: Panel Akademik, Pemisahan Rombel & Standarisasi Ruang (Segmen 17)

Catatan perbaikan stakeholder memberikan penekanan spesifik pada **Segmen 17**:
> *"Panel Akademik, Pemisahan Rombel (Kelas A & B) & Standarisasi Ruang: Pembagian rombongan belajar (Kelas A dan Kelas B) per angkatan untuk menghindari bentrok jadwal; sistem siap untuk satu mata kuliah multi-kelas paralel; standarisasi nama ruangan (Lantai 4 Rapat Utama, Lantai 2 Asosiasi Barista)."*

Berikut perincian masalah teknis dan rencana implementasinya:

### 3.1. Masalah yang Terjadi pada Sistem Saat Ini
1. **Entitas Rombel Tidak Ada di Database**:
   - Di tabel `students` ([apps/api/src/db/schema/shared.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/shared.ts)), hanya terdapat atribut `cohort` (Angkatan), `program`, dan `classType` (Online/Offline). Tidak ada kolom penanda rombel seperti `classGroup` atau `rombel` (`"A"` | `"B"`).
   - Di tabel `classSchedules` ([apps/api/src/db/schema/scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/scheduling.ts)), hanya tersimpan `cohort: integer("cohort")`. Tidak ada informasi jadwal tersebut ditujukan untuk Kelas A atau Kelas B.
2. **Keterbatasan Mata Kuliah Multi-Kelas Paralel**:
   - Di tabel `courses` ([apps/api/src/db/schema/courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts)), kolom `code` didefinisikan dengan `.unique().notNull()`. Hal ini menyebabkan admin tidak dapat membuat mata kuliah yang sama untuk dua kelas berbeda jika menggunakan kode yang sama (misal `HTL101-A` dan `HTL101-B` tidak didukung skema otomatisnya).
   - Setiap mata kuliah hanya memiliki relasi tunggal ke satu `dosenId`.
3. **Celah Deteksi Bentrok Jadwal (Conflict Engine Flaw)**:
   - Pada file [apps/api/src/routes/scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts), sistem hanya mengecek:
     - Apakah **Ruangan** bentrok pada waktu yang sama.
     - Apakah **Dosen** bentrok pada waktu yang sama.
   - **Sistem TIDAK mengecek bentrok jadwal siswa per rombel**: Jika Kelas A dijadwalkan kuliah Bahasa Jepang pada hari Senin pukul 08:00–10:00, sistem saat ini memperbolehkan Kelas A dijadwalkan kuliah Pengantar Perhotelan pada jam yang sama di ruangan lain dengan dosen berbeda!
4. **Input Ruangan Tidak Terstandarisasi**:
   - Pada komponen antarmuka [TabJadwalKelas.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx#L703-L711) dan [TabJadwalPraktikum.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalPraktikum.tsx), field ruangan berupa `<Input placeholder="Contoh: Ruang Teori 2" />`.
   - Hal ini menyebabkan ketidakkonsistenan penulisan ruangan (misal: `"Lantai 4 Rapat Utama"`, `"Lt. 4 Rapat"`, `"R. Rapat Utama Lt 4"`), sehingga deteksi bentrok ruangan berbasis string equality (`s.room === payload.room`) **gagal mendeteksi bentrok jika teksnya berbeda sedikit**.

### 3.2. Solusi & Perubahan Teknis yang Harus Dilakukan
1. **Pembaruan Skema Basis Data (Database Schema Refactoring)**:
   - Tambahkan kolom `rombel` pada tabel `students`:
     ```ts
     // apps/api/src/db/schema/shared.ts
     rombel: text("rombel").default("A"), // "A" | "B" | "Reguler" | "Karyawan"
     ```
   - Tambahkan kolom `rombel` pada tabel `class_schedules` dan `practicum_schedules`:
     ```ts
     // apps/api/src/db/schema/scheduling.ts
     rombel: text("rombel").notNull().default("A"), // "A" | "B" | "Gabungan"
     ```
   - Ubah constraint unik pada tabel `courses`:
     Alih-alih `code` unik global, buat composite unique `(code, rombel, cohort)` atau sediakan tabel relasi seksi kelas paralel (`course_sections`).
2. **Standarisasi Master Ruangan Kampus**:
   - Buat konstanta atau master data ruangan baku Nusadaya Academy:
     ```ts
     export const STANDARDIZED_ROOMS = [
       "Lantai 4 Rapat Utama",
       "Lantai 2 Asosiasi Barista",
       "Lantai 2 Lab Barista & F&B",
       "Lantai 3 Ruang Teori 1",
       "Lantai 3 Ruang Teori 2",
       "Lantai 1 Front Office Simulation",
       "Lantai 1 Ruang Serbaguna",
     ] as const;
     ```
   - Ubah `<Input>` pada form jadwal menjadi `<Select>` dengan opsi terstandarisasi, dengan opsi "Lainnya (Custom)" jika ada ruangan insidental.
3. **Penyempurnaan Algoritma Deteksi Bentrok Jadwal**:
   - Di [apps/api/src/routes/scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts), tambahkan validasi bentrok rombel:
     ```ts
     // Check Rombel Cohort Conflict
     const rombelConflict = existingClass.find((s) =>
       s.cohort === payload.cohort &&
       s.rombel === payload.rombel &&
       isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)
     );
     if (rombelConflict) {
       return {
         success: false,
         message: `Konflik Jadwal: Angkatan ${payload.cohort} Kelas ${payload.rombel} sudah memiliki jadwal lain pada jam tersebut.`,
       };
     }
     ```
4. **Penyelarasan Tampilan Jadwal Perkuliahan**:
   - Filter jadwal di frontend [TabJadwalKelas.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx) ditambahkan pilihan: Filter Angkatan + **Filter Rombel (Semua / Kelas A / Kelas B)**.
   - Badge visual berwarna pembeda antara Kelas A (misal: Indigo) dan Kelas B (misal: Emerald).

---

## 4. Analisis Mendalam Modul Finance & Keuangan

Berdasarkan Segmen 10, 11, 12, 13, dan 24, tim Finance (Pak Refly & Desti) menyampaikan arahan spesifik:

### 4.1. Dashboard Target Pendapatan per Sumber (Segmen 10 & 11)
- **Kondisi Saat Ini**: Komponen [FinanceDashboard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx#L404-L430) hanya memiliki satu variabel input `targetNominal` yang disimpan dalam `localStorage`.
- **Kebutuhan Stakeholder**:
  - Target pendapatan tidak boleh berupa 1 angka global acak, melainkan dirinci per **Sumber Pendapatan**:
    1. SPP Mahasiswa Taiwan
    2. SPP Mahasiswa Malaysia
    3. Biaya PMB / Pendaftaran Awal Mahasiswa Baru
    4. Pembayaran Angkatan 15 / Angkatan 16
  - Setiap sumber pendapatan memiliki target rupiah tersendiri, nominal realisasi aktual yang masuk, dan persentase capaian target (`realisasi / target * 100%`).
- **Solusi**: Buat tabel konfigurasi target pendapatan di database (`finance_revenue_targets`) per tahun/bulan, dan tampilkan breakdown card di bagian atas Finance Dashboard.

### 4.2. Standarisasi 4 Termin Pembayaran Kuliah (Segmen 11 & 24)
- **Kondisi Saat Ini**: Di beberapa komponen masih tertulis "Perkuliahan 6 Semester" dan "Interview Magang" atau "Barista".
- **Kebutuhan Stakeholder**:
  Desti dan Pak Refly secara eksplisit meluruskan 4 termin biaya:
  1. **Registrasi Awal** (Administrasi Awal)
  2. **SPP Semester 1** (Cicilan bulanan fleksibel e.g. Agustus, September, Oktober)
  3. **Kontrak Magang / Suhan** (Ditulis jelas kontrak atau suhan)
  4. **Penempatan Magang Taiwan / Keberangkatan** (Bukan barista, tapi Keberangkatan/Penempatan Magang)
- **Solusi**: Update penamaan label dan tab pada [FinanceDashboard.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/FinanceDashboard.tsx) dan [TabKeuangan.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/finance/TabKeuangan.tsx) agar 100% konsisten dengan termin baku institusi.

### 4.3. Pencairan Fee Sharing Bertahap (Segmen 13)
- **Kondisi Saat Ini**: Tabel `fee_share_recipients` ([apps/api/src/db/schema/finance.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/finance.ts#L205-L227)) hanya memiliki kolom tunggal `nominalFee`, `statusPencairan`, dan `invoiceFileUrl`.
- **Kebutuhan Stakeholder**: Desti menjelaskan bahwa fee sharing mitra sering kali dicairkan secara bertahap (misal komitmen total 5 juta: tahap 1 dicairkan 2,5 juta, tahap 2 dicairkan 2,5 juta berikutnya, masing-masing dengan bukti transfer tersendiri).
- **Solusi**: Buat tabel relasi riwayat pencairan fee:
  ```ts
  export const feeDisbursementLogs = pgTable("fee_disbursement_logs", {
    id: serial("id").primaryKey(),
    recipientId: integer("recipient_id").references(() => feeShareRecipients.id),
    terminNumber: integer("termin_number").notNull(),
    amount: integer("amount").notNull(),
    transferProofUrl: text("transfer_proof_url"),
    disbursedAt: timestamp("disbursed_at").defaultNow(),
    disbursedBy: integer("disbursed_by").references(() => users.id),
  });
  ```

### 4.4. Bug Form Pengajuan Anggaran Praktik Dosen (Segmen 13)
- **Kondisi Saat Ini**: Endpoint pengajuan anggaran di [apps/api/src/routes/courses.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/courses.ts#L901-L913) mewajibkan tipe data tertentu pada `daftarKebutuhan` (`namaItem`, `jumlah`, `satuan`, `satuanHarga`). Jika salah satu field kosong atau tipe string/number tidak sinkron, request akan gagal (400 validation error).
- **Kebutuhan Stakeholder**: Form pengajuan anggaran dosen dan tombol persetujuan (ACC) / penolakan dengan alasan tertulis oleh Finance harus berfungsi tanpa error.
- **Solusi**: Pastikan sanitasi tipe data numerik dan fallback string pada form pengajuan dosen, serta verifikasi kelancaran tombol Tolak dengan popup alasan penolakan.

---

## 5. Analisis Mendalam Modul Magang Taiwan & Keberangkatan

Berdasarkan Segmen 19 sampai 25, restrukturisasi berkas magang menjadi salah satu agenda utama:

### 5.1. Koreksi Istilah & Standarisasi 6 Urutan Berkas Magang Taiwan (Segmen 20)
- **Kondisi Saat Ini**: Tabel `internship_data` ([apps/api/src/db/schema/internship.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/internship.ts#L88-L97)) masih memuat `lolReady` (Letter of Offer) dan `moaReady`.
- **Kebutuhan Stakeholder**:
  1. Istilah **LOL (Letter of Offer) DIHAPUS** karena fungsinya sama dengan LOA.
  2. Alur baku 6 urutan berkas legalitas magang disepakati:
     - **Berkas 1:** MOU Kampus & Hotel (Perjanjian kerja sama institusi & industri)
     - **Berkas 2:** LOA (*Letter of Acceptance* / Bukti Penerimaan)
     - **Berkas 3:** Kontrak Magang Resmi
     - **Berkas 4:** Suhan — *Surat Persetujuan Magang Mahasiswa WNI di Taiwan* (dari Biro Pariwisata Taiwan)
     - **Berkas 5:** MCU Full (Medical Check-up penempatan berstandar penerbangan di Jakarta)
     - **Berkas 6:** Visa Magang Resmi
- **Solusi**: Migrasi schema `internship_data`: hapus kolom `lol_*`, ganti `moa_*` menjadi `mou_*`, dan tambahkan kolom status dan tanggal `suhanReady`, `suhanDate`, `suhanFileUrl`.

### 5.2. Asesmen dan Pengarahan Keberangkatan (Segmen 20 & 22)
- **Kondisi Saat Ini**: Masih menggunakan istilah lama "PDT" (*Pre-Departure Training*).
- **Kebutuhan Stakeholder**:
  - Istilah diganti menjadi **"Asesmen dan Pengarahan Keberangkatan"**.
  - Menyediakan **2 slot unggahan dokumen**:
    1. Hasil asesmen kompetensi mahasiswa
    2. Surat pernyataan kesiapan keberangkatan mahasiswa

### 5.3. Form Informasi Penempatan & Spesifikasi Departemen (Segmen 21)
- **Kondisi Saat Ini**: Field penempatan belum memiliki kolom terstruktur untuk detail departemen dan agensi.
- **Kebutuhan Stakeholder**:
  - Ganti istilah "Agen Sponsor" menjadi **"Mitra Penempatan"**.
  - Form data penempatan: Nama Hotel, Kota Tujuan, Durasi Magang, Nama Mitra Penempatan.
  - Peminatan Hospitality diarahkan ke **5 Departemen Utama**:
    1. *Housekeeping (HK)*
    2. *Food & Beverage Service (FBS)*
    3. *Food & Beverage Product (FBP)*
    4. *Front Office (FO)*
    5. *Barista*
  - Slot dokumen tambahan agensi/mitra opsional sebelum tahap visa (e.g. *Postpone Graduation*, *Landing Permit / Izin Terbang*).

### 5.4. Pencatatan Ahli Waris & Asuransi (Segmen 22 & 23)
- **Kondisi Saat Ini**: Belum ada perekaman identitas ahli waris resmi di modul Magang.
- **Kebutuhan Stakeholder**:
  - Pak Refly menegaskan tanggung jawab moral institusi: jika terjadi musibah di luar negeri, pihak asuransi luar negeri atau mitra sering menyalurkan dana santunan melalui kampus untuk diteruskan kepada keluarga di Indonesia.
  - Sistem wajib mencatat **Ahli Waris Sah**: Nama Ahli Waris, Hubungan Keluarga (mengacu Akta Kelahiran/KK), Nomor Kontak Darurat, dan Rekening Bank Ahli Waris.

---

## 6. Analisis Modul CRM, ODS & Portal Mahasiswa

### 6.1. Ekspor Rekap Kehadiran PDF untuk Orang Tua (Segmen 8)
- **Kondisi Saat Ini**: Data kehadiran di [TabKehadiran.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/crm/TabKehadiran.tsx) hanya berupa komponen tampilan web.
- **Kebutuhan Stakeholder**: Staf CRM membutuhkan tombol **"Ekspor Rekap Kehadiran (PDF)"** agar dapat langsung mengunduh rapor/rekap absensi perkuliahan mahasiswa untuk dikirimkan melalui WhatsApp kepada orang tua mahasiswa.
- **Solusi**: Buat fungsi client-side PDF export (atau server-side endpoint) yang mengompilasi rekapitulasi sesi perkuliahan, persentase kehadiran, izin/sakit/alpha dengan kop resmi Nusadaya Academy.

### 6.2. Format Pelaksanaan 5 Sesi ODS & Tri Dharma (Segmen 9 & 10)
- **Kondisi Saat Ini**: Form ODS di CRM sudah mendukung 5 slot, namun belum memfasilitasi pilihan kategori lokasi.
- **Kebutuhan Stakeholder**:
  - Kategori pelaksanaan ODS: Pilihan antara **Sekolah Mitra** atau **Desa Binaan**.
  - Akomodasi kegiatan Pengabdian kepada Masyarakat (PKM) dan penelitian dosen sebagai bagian dari implementasi Tri Dharma Perguruan Tinggi.

### 6.3. Unggah Mandiri Tautan Konten Bulanan oleh Mahasiswa (Segmen 9)
- **Kondisi Saat Ini**: Mahasiswa belum memiliki kolom setor link video konten bulanan di portal mahasiswa [apps/web/src/app/mahasiswa/panel/crm/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/mahasiswa/panel/crm/page.tsx).
- **Kebutuhan Stakeholder**: Mahasiswa diwajibkan mengunggah 1 link video konten dokumentasi setiap bulan secara mandiri melalui portal akun mereka, agar staf admin tidak perlu menginput ratusan berkas secara manual.

---

## 7. Analisis Modul PMB (Penerimaan Mahasiswa Baru)

### 7.1. Fitur SLA di Formulir Pendaftaran Mandiri (Segmen 6)
- **Kondisi Saat Ini**: Field `docSla` baru tersimpan di tabel internal admin `pmbData`, namun belum ada di form publik [apps/web/src/app/form/[token]/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/form/%5Btoken%5D/page.tsx).
- **Kebutuhan Stakeholder**: Di awal pendaftaran calon mahasiswa, wajib terdapat persetujuan *Service Level Agreement* (SLA) dan klausul izin penggunaan dokumentasi promosi (foto/video pendaftar) oleh institusi.

### 7.2. Mekanisme Tautan Revisi Berbasis Centang Merah (Segmen 3)
- **Kondisi Saat Ini**:
  - Di backend [apps/api/src/routes/form-register.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/form-register.ts) dan tabel `pmbFormResponses`, fitur `rejectedFields` dan `rejectedTabs` telah dibuat.
  - Token tidak hangus saat ditolak; form publik [page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/form/%5Btoken%5D/page.tsx) dapat dibuka kembali dan menyorot kolom yang ditolak dengan border merah dan badge alert.
- **Rekomendasi Polish**: Pastikan saat siswa membuka link revisi, navigasi form otomatis membuka tab pertama yang berisi field ditolak (*auto-focus on first rejected field*) agar siswa tidak bingung mencari bagian yang perlu diperbaiki.

---

## 8. Prioritas & Roadmap Rencana Perbaikan (Action Plan)

Berdasarkan tingkat urgensi operasional dan dampak terhadap kelancaran perkuliahan dan audit KP2LN, rencana perbaikan dibagi menjadi 3 fase:

```mermaid
graph TD
    subgraph Fase 1: P0 - Urgent (Fondasi Akademik & Keuangan)
        A1[Pemisahan Rombel Kelas A & B] --> A2[Standarisasi Ruang Kampus Dropdown]
        A2 --> A3[Deteksi Bentrok Jadwal Berbasis Rombel]
        A3 --> A4[Mata Kuliah Multi-Kelas Paralel]
        A4 --> F1[Pencairan Fee Sharing Bertahap]
        F1 --> F2[Dashboard Target Rinci per Sumber]
    end

    subgraph Fase 2: P1 - High (Restrukturisasi Berkas & Fitur Kerja)
        M1[Hapus LOL & Standarisasi 6 Berkas Magang Taiwan] --> M2[Form Penempatan 5 Departemen & Suhan]
        M2 --> M3[Pencatatan Ahli Waris Magang]
        M3 --> AK1[Import Data Massal Excel Angkatan 15 & 16]
        AK1 --> AK2[Cetak Jadwal Kelas & Ekspor PDF Presensi CRM]
        AK2 --> PMB1[Persetujuan SLA di Form Pendaftaran PMB]
        PMB1 --> FN1[Standarisasi Label 4 Termin Biaya Finance]
    end

    subgraph Fase 3: P2 - Enhancements & Integrasi Lanjutan
        P1[Input Tautan Konten Bulanan di Portal Mahasiswa] --> P2[Integrasi Digital KHS/Transkrip ke Magang]
        P2 --> P3[Pencatatan Team Teaching & Presensi Dosen]
        P3 --> P4[Opsi Lokasi ODS Desa vs Sekolah & Tri Dharma]
        P4 --> P5[Aktivasi Jadwal Otomatis Cron Backup ERP]
    end

    Fase 1 --> Fase 2
    Fase 2 --> Fase 3
```

### Rincian Pembagian Tugas (Action Items PIC)

1. **PIC: Fauzan (Backend & Database Architecture)**
   - Menambahkan kolom `rombel` pada `students`, `class_schedules`, dan `practicum_schedules`.
   - Mengubah logika deteksi bentrok pada [apps/api/src/routes/scheduling.ts](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts) agar memvalidasi bentrok per rombel dan per dosen/ruang terstandarisasi.
   - Merestrukturisasi skema magang Taiwan: menghapus kolom `lol`, menambahkan dukungan `suhan`, dan relasi `feeDisbursementLogs`.
   - Mengimplementasikan endpoint import data massal mahasiswa berbasis file Excel (`.xlsx`).

2. **PIC: Andri (Frontend & Form Integration)**
   - Menambahkan selektor Rombel (Kelas A / Kelas B) dan dropdown master ruangan pada [TabJadwalKelas.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx).
   - Menambahkan fitur ekspor / cetak jadwal kelas perkuliahan.
   - Menambahkan persetujuan SLA dan hak dokumentasi promosi pada formulir registrasi mandiri [form/[token]/page.tsx](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/form/%5Btoken%5D/page.tsx).
   - Memperbarui label 4 termin biaya pada panel Finance dan menyempurnakan form cicilan bulanan dinamis.
   - Menambahkan tombol Ekspor PDF Rekap Kehadiran pada tab CRM untuk pelaporan ke orang tua.

3. **PIC: Desti & Pak Refly (Finance & Regulasi Kebijakan)**
   - Menetapkan pagu target rupiah per sumber pendapatan (SPP Taiwan, SPP Malaysia, PMB) per angkatan.
   - Mengonfirmasi format template Excel data mahasiswa lama angkatan 15 dan 16.
   - Mengonfirmasi mekanisme klaim asuransi penempatan dan pencatatan ahli waris bersama mitra penempatan luar negeri.

---
*Dokumen ini disusun untuk menjadi panduan eksekusi teknis pengembangan sistem One Data Nusadaya demi mencapai standarisasi ERP perguruan tinggi dan kelayakan audit KP2LN.*
