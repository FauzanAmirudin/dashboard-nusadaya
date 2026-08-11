# Dokumentasi Pembaruan Sistem CRM (Customer Relationship Management) & Dosen Panel
**Dashboard Nusadaya (v2.2)**

Sistem CRM mahasiswa di Dashboard Nusadaya telah mengalami perombakan besar-besaran untuk mengelompokkan dan memonitor berbagai jenis data spesifik ke dalam _tab_ yang lebih terstruktur. Selain itu, terdapat peningkatan fitur unggah _file_, komponen _Rich-Text_, serta penyesuaian hak akses pada panel Dosen.

---

## 1. Perombakan Arsitektur Panel CRM (Multi-Tab)

Pada versi sebelumnya, fitur CRM sangat kaku dan hanya menampung log catatan umum. Kini antarmuka CRM (CrmPanel) telah dibagi menjadi beberapa modul khusus untuk memudahkan operasional.

### A. Tab Baru di CRM
Modul CRM sekarang memiliki beberapa _tab_ spesifik:
- **Kehadiran**: Menampilkan riwayat kehadiran mahasiswa secara ringkas.
- **Hafalan**: Melacak progres hafalan dan _review_ hafalan mahasiswa.
- **ODS**: Menangani data ODS (_On the Job Training Data System_) beserta fitur _upload_ khusus.
- **Pra Magang**: Menangani data masa Pra-Magang, nama industri, _upload_ laporan PDF, dan tautan video dokumentasi.
- **Monitoring (Orang Tua & Industri)**: Menangani catatan spesifik/masalah terkait orang tua atau industri.

### B. Otomatisasi & Penyimpanan Data
Data baru seperti Pra-Magang dan ODS tidak membuat tabel baru, melainkan disimpan secara dinamis ke dalam format `JSONB` pada skema tabel `crmData`. Hal ini memastikan kinerja dan _maintainability database_ yang lebih efisien di sisi _backend_ Elysia.

---

## 2. Fitur Baru: Monitoring Log (Rich Text & Multi-Image)

Fungsionalitas pembuatan catatan CRM telah ditingkatkan secara signifikan pada Tab Monitoring.

### A. Editor WYSIWYG (Tiptap)
Penulisan _log_ kini memanfaatkan editor *Rich-Text* canggih dari **Tiptap**. Staf/admin dapat mengetik deskripsi masalah dengan struktur teks tebal (_bold_), miring (_italic_), _bullet list_, hingga kutipan (_quote_) untuk keterbacaan laporan yang lebih baik.

### B. Multi-Image Upload (Otomatis & Aman)
- Komponen `MultiImageUpload` baru diciptakan untuk memfasilitasi _upload_ banyak gambar (maksimal 1MB) secara bersamaan ke _server_.
- Gambar tidak dimasukkan secara _base64_ ke dalam database, melainkan dikelola dengan sangat baik oleh `fileService` ke dalam _folder_ `storage` (*local filesystem*), sedangkan *database* hanya menyimpan *metadata* ID lampirannya saja.

### C. Fitur Hapus Catatan dengan Pembersihan Berkas Fisik
Kini log CRM dapat dihapus melalui _endpoint_ khusus (`DELETE /:id/crm/log/:logId`).
- Jika log tersebut dihapus melalui konfirmasi *AlertDialog* di Frontend, **sistem tidak akan meninggalkan "file yatim piatu" (*orphaned files*)**. 
- _Backend_ akan melakukan pembersihan (menghapus secara fisik) semua foto yang melampirinya terlebih dahulu, sebelum menghapus catatan teks dari tabel *database*.

---

## 3. Penyesuaian Tampilan Dasbor & Hak Akses (Role Based Access)

Selain peningkatan pada panel individu, tampilan global dan akses panel Dosen juga disempurnakan.

### A. Perombakan Dasbor CRM Global
Tabel daftar mahasiswa pada antarmuka Dasbor CRM (`CrmDashboard.tsx`) telah dilengkapi kolom baru yang sangat penting bagi operasional, meliputi:
- Tahun Ajar
- Program Studi & Peminatan
- Nomor WhatsApp (No WA)

Informasi "Tidak Aman" pada baris atas ringkasan dasbor dihapus untuk menyederhanakan _header_.

### B. Penambahan Hak Akses Akademik pada Panel Dosen
Pada modul `DosenPanel.tsx`, staf dengan peranan (`role`) **Akademik** kini telah diberikan hak akses layaknya Dosen/Superadmin.
- Staf akademik kini bisa menekan _Acc_ tugas, melihat fitur _edit_, serta memperbarui data _grade_ atau nilai mata kuliah secara menyeluruh untuk mempercepat operasional validasi.

---

**Tanggal Perubahan:** 11 Agustus 2026
**Area Terdampak:**
- `apps/api/src/routes/student/crm.ts` (Seluruh logika _Backend_ CRM)
- `apps/api/src/db/schema.ts` (Penyesuaian Skema Database)
- `apps/web/src/components/panels/CrmPanel.tsx` dan `apps/web/src/components/panels/crm/*` (Komponen Tab UI)
- `apps/web/src/components/ui/*` (Komponen _RichTextEditor_ & _MultiImageUpload_)
- `apps/web/src/components/panels/DosenPanel.tsx` & `CrmDashboard.tsx` (Perubahan Akses dan Daftar Kolom UI)
