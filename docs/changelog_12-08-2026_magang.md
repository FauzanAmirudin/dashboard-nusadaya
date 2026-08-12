# Dokumentasi Pembaruan Sistem Panel Magang (Internasional)
**Dashboard Nusadaya**

Sistem operasional dan antarmuka untuk tim Magang Internasional telah menerima perombakan tata letak dan penyempurnaan alur kerja. Pembaruan ini difokuskan pada pengelompokan data spesifik ke dalam sistem _tab_, penghapusan fitur yang tidak digunakan, serta otomatisasi status progres berbasis ceklist.

---

## 1. Perombakan Arsitektur Panel Magang (Multi-Tab)

Antarmuka Panel Magang (`InternshipPanel`) yang sebelumnya menyatu dalam satu halaman panjang kini telah dipecah menjadi beberapa modul khusus untuk memudahkan operasional.

### A. Tab Baru di Panel Magang
Modul Magang kini memiliki 4 _tab_ utama:
- **Kelayakan Pra-Paspor**: Menangani data tahap awal kesiapan dokumen paspor.
- **Dokumen Keberangkatan**: Mengelola seluruh detail dokumen teknis (Paspor, LoA, MCU, Visa, Tiket, Pembekalan, Dokumentasi Kegiatan, dan Dokumen Agen).
- **Dana Talangan**: Mengelola catatan dan pencairan Dana Talangan (Tahap 1 & 2) yang tersinkronisasi langsung dengan sistem validasi PMB.
- **Syarat Akhir**: Memantau syarat kelulusan magang seperti pengumpulan Logbook, Laporan Akhir, dan Video Dokumentasi.

### B. Penyederhanaan Antarmuka
- Pada bagian _Tab_ Kelayakan Pra-Paspor, tombol **Surat Rekomendasi Disdik** (Sidik Paspor) telah dihapus dari antarmuka karena fungsinya sudah dinilai tidak relevan/berguna oleh tim operasional.
- Seluruh antarmuka penyimpanan _file_ dan _input_ form telah diseragamkan desainnya tanpa memerlukan tombol _Edit_ terpisah untuk sekadar menekan _ceklist_.

---

## 2. Parameter Penyelesaian & Logika Proses "ACC" (Approval)

Sistem telah dirombak agar terintegrasi penuh antara tindakan fisik (mengklik ceklist) dengan sistem validasi akhir untuk perhitungan dasbor.

### A. Validasi Syarat Berbasis Ceklist
- Penyelesaian suatu tugas (contoh: Dokumen Agen, Logbook, Dokumentasi) kini 100% bergantung pada status **Ceklist (Progres)** di antarmuka. Jika belum diceklist, tugas tersebut akan dihitung belum selesai.
- Proses pemberian **ACC** (Approval final) dari tim Magang ke mahasiswa kini terkunci oleh sistem. Sistem tidak akan mengizinkan pemberian ACC apabila masih ada progres (ceklist) di _tab_ mana pun yang belum terselesaikan.

### B. Perbaikan Bug Penyimpanan (Upsert & Duplicate Route)
- **Root Cause Fix:** Telah diperbaiki masalah di mana _input_ teks dan _ceklist_ baru (seperti pada Dokumentasi Kegiatan dan Dokumen Agen) tidak bisa tersimpan ke dalam _database_. 
- _Backend_ (Elysia) telah diperbarui dengan pola **Upsert** (Insert or Update), serta penghapusan _endpoint API duplicate_ versi lama yang memblokir/menyaring (_strip_) masuknya kolom-kolom data baru. Sekarang penyimpanan data beroperasi seketika secara _real-time_.

---

## 3. Sinkronisasi Tampilan Dasbor & Tabel Master Data

Sebelumnya, staf Magang melihat daftar tabel yang memiliki susunan berbeda saat membuka halaman Dasbor utama dengan saat menekan menu "Semua Mahasiswa".

- Tabel di `/dashboard/students` (Master Data) untuk staf ber-hak akses `magang` kini telah **sepenuhnya disamakan** dengan desain tabel di Dasbor Magang (`MagangDashboard.tsx`).
- Kolom penting seperti Angkatan, Tahun Ajaran, Peminatan, dan Progres Panel kini muncul langsung.
- Penyamakan tabel ini dilakukan secara mulus tanpa menampilkan elemen _header_ (Kartu KPI Dasbor) sehingga pengalaman navigasi tetap natural sebagai layar _Master List_.

---

## 4. Penghapusan Fitur Monitoring Berkala

Fitur **Monitoring Berkala** dan pengisian riwayat lognya secara penuh telah dihapus dari sistem (_deprecated_).
- Seluruh komponen _frontend_ UI untuk riwayat monitoring dihapus.
- _Endpoint_ API _backend_ (GET, POST, PATCH) terkait jadwal monitoring magang dicabut.
- Skema data `internshipMonitoringSchedule` dihapuskan untuk merampingkan _database_.

---

**Tanggal Perubahan:** 12 Agustus 2026
**Area Terdampak:**
- `apps/api/src/db/schema.ts` (Penambahan kolom ceklist baru & penghapusan tabel _monitoring_)
- `apps/api/src/routes/student/internship.ts` (Implementasi pola _Upsert_, penghapusan duplikasi _endpoint_, & validasi ceklist)
- `apps/api/src/routes/magang.ts` (Penghapusan API _monitoring_)
- `apps/web/src/components/panels/InternshipPanel.tsx` (Perombakan UI menjadi _multi-tab_)
- `apps/web/src/components/panels/magang/*` (Komponen UI _Tab_ terpisah)
- `apps/web/src/app/dashboard/students/page.tsx` & `MagangDashboard.tsx` (Penyesuaian kolom & implementasi fitur sembunyikan _header_)
