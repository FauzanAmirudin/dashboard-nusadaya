# Dokumentasi Universal Filter Reset, Optimasi Query Role, & Standarisasi UI/UX
**Dashboard Nusadaya — 26 Agustus 2026**

---

## Ringkasan Eksekutif

Pada tanggal **26 Agustus 2026**, sistem **Dashboard Nusadaya** telah diperbarui dengan serangkaian peningkatan performa, standarisasi antarmuka (UI/UX), dan fitur produktivitas filter di seluruh modul:

1. **Universal One-Click Filter Reset (`RotateCcw`)**: Menerapkan tombol reset filter interaktif secara serentak di seluruh modul dashboard (Executive, Dosen, PMB, CRM, Finance, Akademik, PA, Magang, Evaluasi & Finalisasi, Jadwal & Presensi, Mahasiswa Master & Arsip, Manajemen Pengguna). Tombol reset hanya muncul secara kontekstual saat filter atau pencarian aktif dan mengembalikan kondisi filter ke *state* awal dalam 1 klik.
2. **Optimasi Performa Query & Role Guarding (`enabled` Hook)**: Menambahkan parameter `enabled` pada hooks utama (`useDashboardSummary` dan `useStudentsList`). Dashboard eksekutif kini secara cerdas menghentikan eksekusi query latar belakang saat pengguna yang login adalah dosen atau staf divisi, menghemat *network bandwidth*, mengurangi beban database, serta mencegah *unnecessary re-renders*.
3. **Penyempurnaan Modul Mata Kuliah & Rekap Nilai**: Menyeragamkan hierarki tombol aksi (*Sesi & Presensi*, *Rekap Nilai*), visual badge (Peminatan & Angkatan), info dosen pengampu dengan ikon `GraduationCap`, serta menambahkan counter ringkasan data (*"Menampilkan X dari Y mata kuliah"*) di bagian footer tabel.
4. **Normalisasi Multi-Role Router**: Memperkuat deteksi peran majemuk (*multi-role*) menggunakan utilitas `getUserRoles(user)` pada root dashboard page `/dashboard` agar transisi antar panel peran berjalan mulus tanpa *flash of unauthorized content* atau konflik pengalihan.

---

## 1. Rincian Pembaruan Fitur & Komponen

### A. Universal One-Click Filter Reset

Di seluruh antarmuka yang memiliki kontrol pencarian (*Search*) dan penyaringan (*Select Filter: Angkatan, Status, Divisi, Role, Hari*), ditambahkan tombol inline **Reset** dengan ikon `RotateCcw`:

- **Prinsip Tampilan Kontekstual**: Tombol hanya dirender jika ada setidaknya satu filter aktif (`searchQuery !== ""` atau `selectedCohort !== "all"`, dll).
- **Aksi Instan**: Mereset seluruh input pencarian dan dropdown ke nilai *default* (`"all"` / `""`) secara serentak tanpa perlu reload halaman.
- **Konsistensi Gaya Visual**: Menggunakan `variant="outline"` dengan border halus, transisi hover slate, dan ikon berputar `RotateCcw` berukuran 14px (`w-3.5 h-3.5`).

#### Modul & Komponen yang Diperbarui:
| No | Modul / Halaman | Komponen / Berkas | Filter yang Direset |
|---|---|---|---|
| 1 | Master Executive Dashboard | `apps/web/src/app/dashboard/page.tsx` | Search, Angkatan, Status (Aman/Perhatian/Tidak Aman) |
| 2 | Dosen Dashboard | `DosenDashboard.tsx` | Search, Angkatan, Jenis MK (Teori/Praktik), Peminatan |
| 3 | Mata Kuliah List | `apps/web/src/app/dashboard/mata-kuliah/page.tsx` | Search, Angkatan, Jenis MK |
| 4 | Rekap Nilai List | `apps/web/src/app/dashboard/mata-kuliah/rekap/page.tsx` | Search, Angkatan, Jenis MK |
| 5 | Master Mahasiswa | `apps/web/src/app/dashboard/students/page.tsx` | Search, Angkatan, Filter Status Divisi/Superadmin |
| 6 | Arsip Mahasiswa | `apps/web/src/app/dashboard/students/archive/page.tsx` | Search NIM/Nama |
| 7 | Manajemen Pengguna | `apps/web/src/app/dashboard/users/page.tsx` | Search Nama/Username, Role Filter |
| 8 | PMB Dashboard | `PmbDashboard.tsx` & `TabRiwayatRespons.tsx` | Search, Angkatan, Status Verifikasi |
| 9 | CRM Dashboard | `CrmDashboard.tsx` | Search, Angkatan, Status Validasi Dokumen |
| 10 | Akademik Dashboard | `AkademikDashboard.tsx` & `AssessmentListView.tsx` | Search, Angkatan, Status Evaluasi |
| 11 | Kalender Akademik | `KalenderAkademikDashboard.tsx` | Search Agenda, Filter Tipe/Bulan |
| 12 | PA (Pembimbing Akademik) | `PaDashboard.tsx`, `PAListView.tsx`, `PADetailView.tsx` | Search, Angkatan, Status Bimbingan |
| 13 | Magang Dashboard | `MagangDashboard.tsx` | Search, Angkatan, Status Kesiapan Magang |
| 14 | Finance Dashboard | `FinanceDashboard.tsx` | Search, Sort By, Angkatan, Status Pembayaran |
| 15 | Evaluasi & Finalisasi | `EvaluasiFinalisasiDashboard.tsx`, `FinalisasiDashboard.tsx` | Search, Angkatan, Status Kelayakan, Keputusan Akhir |
| 16 | Presensi Kehadiran | `KehadiranDashboard.tsx` | Search NIM/Nama, Filter Angkatan |
| 17 | Penjadwalan & Pengumuman | `TabJadwalKelas.tsx`, `TabJadwalPiket.tsx`, `TabJadwalPraktikum.tsx`, `TabPengumuman.tsx` | Filter Hari, Angkatan, Search Kata Kunci |

---

### B. Optimasi Query & Role Guarding di Frontend

#### 1. Hook `useDashboardSummary` (`apps/web/src/hooks/useDashboardSummary.ts`)
- Menambahkan parameter opsi `enabled?: boolean` pada hook query.
- Pada halaman utama `/dashboard`, query hanya dijalankan jika `isExecutive` bernilai `true` (pengguna dengan peran `superadmin`, `director`, atau `direktur`).
- Mencegah *polling* 30 detik yang tidak perlu ketika antarmuka yang aktif adalah modul Dosen atau Staf Divisi.

#### 2. Hook `useStudentsList` (`apps/web/src/hooks/useStudentsList.ts`)
- Menambahkan kontrol `enabled` pada query server-side pagination daftar mahasiswa.
- Mengurangi panggilan endpoint `/api/students` saat render dashboard yang tidak memerlukan tabel eksekutif.

#### 3. Multi-Role Router Guard di `apps/web/src/app/dashboard/page.tsx`
- Menggunakan `getUserRoles(user)` untuk mengevaluasi peran tunggal maupun majemuk (*role array*).
- Menghilangkan *redundant redirect logic* ke `/dashboard/mata-kuliah` yang sebelumnya dapat menyebabkan *render mismatch* bagi dosen. Komponen `DosenDashboard` kini dirender langsung secara native di dalam `/dashboard`.

---

### C. Refinement Antarmuka Mata Kuliah & Rekap Nilai

1. **Standarisasi Aksi Tabel**:
   - Tombol utama berwarna *Corporate Blue* (`bg-[#0517B0] hover:bg-blue-800 text-white`) untuk navigasi langsung ke pengelolaan sesi dan presensi.
   - Tombol sekunder dengan varian `outline` untuk membuka rekapitulasi nilai dan presensi.
2. **Peningkatan Tampilan Identitas Dosen**:
   - Penambahan ikon `GraduationCap` dengan teks informatif bila dosen pengampu belum ditugaskan.
3. **PeminatanBadge & Tag Angkatan**:
   - Integrasi komponen `PeminatanBadge` seragam dengan badge bertuliskan `"Angkatan X"` yang tegas dan mudah dibaca.
4. **Summary Footer**:
   - Menambahkan ringkasan jumlah baris yang tampil vs total mata kuliah terdaftar beserta indikator `"Filter aktif"`.

---

## 2. Validasi & Pengujian Sistem

Sebelum dilakukan *commit* dan *push* ke repositori remote, seluruh kode telah melalui verifikasi otomatis:

1. **Build Test (`bun run build`)**:
   - **Status**: PASSED (Exit Code: 0)
   - Seluruh 37 rute aplikasi Next.js (App Router) berhasil di-compile dan di-generate tanpa *type error* maupun *syntax error*.
2. **Typecheck Test (`bun x tsc --noEmit`)**:
   - **Status**: PASSED (0 Errors)
   - Seluruh kontrak tipe data TypeScript pada komponen, hooks, dan halaman valid.

---

## 3. Daftar Berkas yang Dimodifikasi

```text
apps/web/src/app/dashboard/mata-kuliah/page.tsx
apps/web/src/app/dashboard/mata-kuliah/rekap/page.tsx
apps/web/src/app/dashboard/page.tsx
apps/web/src/app/dashboard/students/archive/page.tsx
apps/web/src/app/dashboard/students/page.tsx
apps/web/src/app/dashboard/users/page.tsx
apps/web/src/components/dashboards/AkademikDashboard.tsx
apps/web/src/components/dashboards/CrmDashboard.tsx
apps/web/src/components/dashboards/DosenDashboard.tsx
apps/web/src/components/dashboards/EvaluasiFinalisasiDashboard.tsx
apps/web/src/components/dashboards/FinalisasiDashboard.tsx
apps/web/src/components/dashboards/FinanceDashboard.tsx
apps/web/src/components/dashboards/MagangDashboard.tsx
apps/web/src/components/dashboards/PaDashboard.tsx
apps/web/src/components/dashboards/PmbDashboard.tsx
apps/web/src/components/dashboards/pmb/TabRiwayatRespons.tsx
apps/web/src/components/panels/akademik/AssessmentListView.tsx
apps/web/src/components/panels/akademik/KalenderAkademikDashboard.tsx
apps/web/src/components/panels/akademik/pa/PADetailView.tsx
apps/web/src/components/panels/akademik/pa/PAListView.tsx
apps/web/src/components/panels/kehadiran/KehadiranDashboard.tsx
apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx
apps/web/src/components/panels/penjadwalan/TabJadwalPiket.tsx
apps/web/src/components/panels/penjadwalan/TabJadwalPraktikum.tsx
apps/web/src/components/panels/penjadwalan/TabPengumuman.tsx
apps/web/src/hooks/useDashboardSummary.ts
apps/web/src/hooks/useStudentsList.ts
docs/changelog_26-08-2026_universal_filter_reset_performance_and_ui_polish.md
```
