# 🚀 Dokumentasi Pembaruan Panel PMB (Penerimaan Mahasiswa Baru) & Formulir Pendaftaran

Dokumen ini mendokumentasikan secara menyeluruh seluruh perubahan, penyesuaian logika bisnis, skema database, backend API, dan antarmuka frontend yang telah diimplementasikan pada modul **PMB (Penerimaan Mahasiswa Baru)** di sistem **Dashboard Nusadaya Akademi**.

---

## 📋 Ringkasan Perubahan Utama

| Kategori | Fitur / Komponen | Rangkuman Penyesuaian |
| :--- | :--- | :--- |
| **Penyelarasan Berkas** | **Pas Foto (Standar Visa / Formal)** | Ditambahkan sebagai item wajib kelengkapan berkas PMB (ke-17) di database, backend, panel admin, dashboard, dan panel mahasiswa. |
| **Real-time Synchronization** | **Progress Bar Dashboard PMB** | Invalidation cache server (`cache:dashboard:*`), query client React Query, dispatch custom events 0ms, dan cross-tab broadcast sync. |
| **Validasi Formulir Online** | **Kontak Rekan & Rekomendasi (Tab 8)** | Dinamis minimal 3 dan maksimal 5 kontak, kolom awal 3 form, serta penambahan pelacakan field *Siapa yang merekomendasikan Anda*. |
| **UX & Antarmuka** | **Modal Penolakan Respon PMB** | Penambahan label dan konfirmasi yang jelas pada tombol aksi tolak formulir pendaftaran. |
| **Auto-check Upload** | **Dokumen Kelengkapan Berkas** | Checklist berkas otomatis tercentang dan tersimpan ke backend saat dokumen pas foto atau berkas pendukung berhasil diunggah. |

---

## 🛠️ Rincian Pembaruan Teknis

### 1. Integrasi Pas Foto Standar Visa / Formal (17 Item Checklist)
- **Database Schema:**
  - `pmb_data`: Kolom `pas_foto` (`boolean`, default: `false`).
  - `pmb_form_responses`: Kolom `pas_foto_url` untuk menampung pas foto berlatar formal/visa dari pendaftar.
- **Backend API:**
  - `apps/api/src/routes/student/core.ts`: Menambahkan `pasFoto: pmbData.pasFoto` ke dalam query select `GET /students` sehingga data terkirim lengkap ke frontend.
  - `apps/api/src/routes/student/status.ts`: Menambahkan indikator `Pas Foto (Standar Visa / Formal)` ke dalam endpoint `GET /students/:id/progress` (basis 17 indikator PMB).
  - `apps/api/src/routes/mahasiswa.ts`: Menambahkan `pmb?.pasFoto` ke `pmbChecklist` mahasiswa (`pmbTotal = 17`).
  - `apps/api/src/routes/student/pmb.ts`: Menghitung status PMB (`AMAN`, `PROSES`, `BUTUH_PERHATIAN`) berdasarkan 17 checkbox wajib.
- **Frontend:**
  - `apps/web/src/utils/panel-logic.ts`: Memperbarui fungsi `calculatePmbChecklist` dengan 17 item wajib (5 utama + 12 dokumen kelengkapan).
  - `apps/web/src/components/dashboards/PmbDashboard.tsx`:
    - Menambahkan `Pas Foto (Standar Visa / Formal)` ke `getPmbChecklist`.
    - Memperbarui label header tabel menjadi **Progress (17)**.
    - Memperbarui filter dropdown status menjadi **Checklist Lengkap (17)**.
  - `apps/web/src/components/dashboards/EvaluasiFinalisasiDashboard.tsx` & `apps/web/src/app/dashboard/students/page.tsx`: Sinkronisasi perhitungan checklist PMB 17 item.
  - `apps/web/src/app/mahasiswa/panel/pmb/page.tsx`: Menambahkan baris Pas Foto ke `mainChecklist` panel mahasiswa.

---

### 2. Real-Time Synchronization Progress Bar di Dashboard PMB
- **Backend Cache Invalidation:**
  - `apps/api/src/routes/student/pmb.ts`: Fungsi `invalidatePmbCache` kini menghapus pola `cache:dashboard:*`, `cache:students:*`, `cache:student:${studentId}`, dan `cache:mahasiswa:*`.
  - `apps/api/src/routes/student/documents.ts`: Saat dokumen PMB diunggah atau dihapus melalui `/:id/:panel/documents`, sistem otomatis mengupdate field status checklist terkait di `pmbData` dan memanggil `invalidatePmbCache(studentId)`.
- **Frontend Query Cache & Event Dispatch:**
  - `apps/web/src/components/panels/pmb/TabChecklist.tsx`:
    - Menggunakan `useQueryClient` dari `@tanstack/react-query` untuk meng-invalidate query key: `["students-list"]`, `["dashboard-summary"]`, `["student", studentId]`, dan `["student-detail", studentId]`.
    - Mengirim custom events `pmb-progress-sync` dan `student-updated`.
    - Mengirim pesan `BroadcastChannel("dashboard-realtime-sync")` agar seluruh tab browser lain langsung ter-update seketika tanpa perlu refresh browser.
    - Pada `DocumentUpload`, callback `onUploadSuccess` secara otomatis memanggil `handleCheckboxChange` sehingga berkas yang baru diunggah langsung berstatus centang hijau (✓ Selesai).
  - `apps/web/src/components/panels/PmbPanel.tsx`:
    - Memicu invalidasi query cache dan broadcast sync saat aksi ACC atau Batal ACC disetujui.
  - `apps/web/src/components/StudentProgress.tsx`:
    - Menambahkan listener `pmb-progress-sync` sehingga progress bar pada header detail mahasiswa responsif 0ms (langsung berubah seketika).
  - `apps/web/src/components/dashboards/SharedDashboardLoader.tsx`:
    - Menambahkan listener `useEffect` untuk event `student-updated`, `pmb-progress-sync`, `crm-progress-sync`, `focus` window, dan `BroadcastChannel` yang memicu `refetch()`.
    - Meneruskan prop `onUpdate={() => refetch()}` ke komponen `PmbDashboard`.

---

### 3. Modifikasi Formulir Pendaftaran Online (`/form/[token]`)
- **Kontak Rekan & Rekomendasi (Tab 8):**
  - Mengubah ketentuan kontak rekan dari statis 5 kontak menjadi **fleksibel minimal 3 dan maksimal 5 kontak**.
  - Tampilan form awal otomatis merender 3 slot isian. Pengguna dapat menambah slot hingga maksimal 5 kontak melalui tombol *"Tambah Kontak Rekan"*.
  - Menghapus badge informasi *"3 / 5 Kontak (Min. 3)"* yang tidak diperlukan.
  - Memperketat validasi kelayakan data kontak (nama lengkap, nomor HP valid, dan hubungan/kategori kontak).
- **Pertanyaan Rekomendasi Akuisisi:**
  - Menambahkan isian field *"Siapa yang merekomendasikan Anda?"* pada data referensi pendaftaran.
  - Menyimpan nilai rekomendasi langsung ke kolom `pmb_form_responses.rekomendasi` dan `pmb_data.rekomendasi`.

---

### 4. Perbaikan Modal Penolakan Respon Pendaftar PMB
- Pada halaman detail respon formulir PMB (`/dashboard/pmb/responses/[id]`):
  - Memperbaiki tombol aksi penolakan berwarna merah yang sebelumnya tidak memiliki label keterangan yang jelas.
  - Memberikan teks tombol deskriptif, ikon penolakan, serta dialog konfirmasi alasan penolakan beserta tab formulir yang wajib diperbaiki oleh calon mahasiswa.

---

## 🧪 Hasil Verifikasi & Pengujian
- **Automated Unit Tests:** `82 passed, 0 failed` (`src/__tests__/unit/panel-logic.test.ts`).
- **Backend TypeScript Compilation:** `bun x tsc --noEmit` (Exit code 0, 0 error).
- **Frontend TypeScript Compilation:** `bun x tsc --noEmit` (Exit code 0, 0 error).
- **Development Server:** Berjalan normal tanpa runtime warning/error.
