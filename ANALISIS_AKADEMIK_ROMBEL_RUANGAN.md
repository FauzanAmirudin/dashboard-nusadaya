# ANALISIS MENDALAM PANEL AKADEMIK & PENJADWALAN
## Evaluasi Kesenjangan Sistem Berjalan vs Catatan Rapat Stakeholder
### Fokus: Pemisahan Rombel (Kelas A & B), Mata Kuliah Multi-Kelas Paralel, dan Standarisasi Ruangan

> **Dokumen Rujukan:** GA-NUSADAYA-AKADEMIK-2026-10-15  
> **Fokus Bahasan:** Khusus **Panel Akademik & Penjadwalan Perkuliahan** (Catatan Revisi Segmen 17 serta Segmen 14–19)  
> **Dokumen Sumber Rapat:** [Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf](file:///c:/.PROJECT/dashboard-nusadaya/Transkrip_Catatan_Rapat_Nusadaya_5Menit.pdf)  
> **Basis Kode Teranalisis:**  
> - Skema Database: [`academic.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/academic.ts), [`courses.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts), [`scheduling.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/scheduling.ts), [`shared.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/shared.ts)  
> - Backend API: [`scheduling.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts), [`courses.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/courses.ts), [`attendance.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/attendance.ts)  
> - Frontend UI: [`TabJadwalKelas.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx), [`TabJadwalPraktikum.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalPraktikum.tsx), [`MataKuliahPage`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/page.tsx), [`MataKuliahDetailPage`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/%5Bid%5D/page.tsx), [`AkademikDashboard.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/dashboards/AkademikDashboard.tsx)  

---

## 1. Ringkasan Eksekutif Kebutuhan Stakeholder

Pada rapat evaluasi platform *One Data Nusadaya* dan catatan perbaikan teknis, pimpinan institusi (Pak Refly) dan tim akademik menyampaikan instruksi khusus mengenai operasional perkuliahan:

> *"Panel Akademik, Pemisahan Rombel (Kelas A & B) & Standarisasi Ruang: Pembagian rombongan belajar (Kelas A dan Kelas B) per angkatan untuk menghindari bentrok jadwal; sistem siap untuk satu mata kuliah multi-kelas paralel; standarisasi nama ruangan (Lantai 4 Rapat Utama, Lantai 2 Asosiasi Barista) (Segmen 17)."*

Tujuan utama dari penyesuaian ini adalah:
1. **Menghilangkan Potensi Bentrok Jadwal Siswa**: Jumlah mahasiswa per angkatan (misal Angkatan 15 dan 16) yang mencapai puluhan/ratusan orang tidak mungkin belajar dalam satu ruangan secara bersamaan. Mahasiswa harus dipecah ke dalam Rombongan Belajar (**Kelas A** dan **Kelas B**).
2. **Kesiapan Multi-Kelas Paralel**: Satu mata kuliah (contoh: *Grooming*, *Bahasa Asing*, atau *Food & Beverage*) harus dapat dibuka untuk beberapa kelas paralel pada hari/jam yang berbeda dengan pengampu yang sama atau berbeda.
3. **Standarisasi Ruang Fisik**: Mencegah kegagalan algoritma deteksi bentrok ruangan akibat variasi penulisan manual (*typo*) oleh admin, serta memetakan jadwal ke fasilitas riil kampus (seperti Lab Barista di Lantai 2 atau Ruang Rapat Utama di Lantai 4).
4. **Kesiapan Team Teaching & Presensi Dosen**: Mengakomodasi mata kuliah dengan 2 dosen pengampu dan merekap jam mengajar dosen secara bulanan (Segmen 18).
5. **Migrasi Data Riil via Excel**: Fasilitas import data mahasiswa lama (Angkatan 15 & 16) secara massal agar jadwal dan presensi dapat langsung digunakan dengan data nyata (Segmen 18).

---

## 2. Audit Mendalam: Kondisi Sistem Saat Ini vs Kebutuhan Stakeholder

### 2.1. PILAR 1: Pembagian Rombongan Belajar (Kelas A & Kelas B)

#### A. Kondisi Sistem Berjalan Saat Ini (Codebase Audit)
1. **Tabel Mahasiswa ([`students`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/shared.ts#L31-L101))**:
   - Kolom yang tersedia saat ini: `cohort` (Angkatan), `program`, `subProgram`, `classType` (Online-LMS / Offline), `batch`, `academicYear`.
   - **TIDAK ADA** kolom penanda rombongan belajar, seperti `rombel` atau `classGroup` (`"A"` | `"B"`).
2. **Tabel Jadwal Perkuliahan ([`class_schedules`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/scheduling.ts#L18-L40))**:
   - Kolom yang tersedia: `subject`, `dosenId`, `cohort`, `room`, `dayOfWeek`, `sessionDate`, `startTime`, `endTime`.
   - **TIDAK ADA** kolom `rombel`. Jadwal yang dibuat saat ini diperlakukan berlaku umum untuk seluruh mahasiswa di satu angkatan (`cohort`).
3. **Komponen Pengambilan Mahasiswa di Detail Mata Kuliah ([`[id]/page.tsx:L278-L286`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/%5Bid%5D/page.tsx#L278-L286))**:
   ```ts
   // apps/web/src/app/dashboard/mata-kuliah/[id]/page.tsx
   const { data: sData, error: sErr } = await api.students.get({
       $query: { cohort: courseInfo.cohort.toString(), all: "true" },
   });
   if (!sErr && sData?.data) {
       cohortList = (sData.data as any[]).map((item) => item.student);
       setCohortStudents(cohortList);
   }
   ```
   **Bukti Kritis:** Sistem langsung menarik **SEMUA mahasiswa satu angkatan** ke dalam daftar peserta mata kuliah. Jika Angkatan 16 memiliki 80 mahasiswa, maka ke-80 mahasiswa tersebut masuk ke satu lembar presensi yang sama tanpa ada pemisahan Kelas A atau Kelas B.

#### B. Celah / Masalah yang Ditimbulkan
- Mahasiswa Kelas A dan Kelas B tercampur aduk. Dosen tidak dapat memilah presensi mahasiswa per sesi tatap muka.
- Mahasiswa Kelas B yang jadwalnya di hari lain akan tercatat *alpha* atau tidak hadir pada pertemuan Kelas A, merusak kalkulasi persentase kehadiran riil.
- Admin PMB / Akademik tidak memiliki antarmuka untuk membagi mahasiswa ke Kelas A atau Kelas B saat registrasi/pembagian kelas awal semester.

---

### 2.2. PILAR 2: Kesiapan Satu Mata Kuliah untuk Multi-Kelas Paralel

#### A. Kondisi Sistem Berjalan Saat Ini (Codebase Audit)
1. **Constraint Unik pada Kode Mata Kuliah ([`courses.ts:L20`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts#L20))**:
   ```ts
   export const courses = pgTable("courses", {
       id: serial("id").primaryKey(),
       code: text("code").unique().notNull(), // <-- CONSTRAINT UNIQUE GLOBAL
       name: text("name").notNull(),
       dosenId: integer("dosen_id").references(() => users.id).notNull(),
       peminatan: text("peminatan"),
       cohort: integer("cohort").notNull(),
       type: courseTypeEnum("type").default("teori").notNull(),
       // ...
   });
   ```
   - Kolom `code` bersifat unik secara absolut di seluruh tabel.
   - Jika admin ingin membuat mata kuliah "Bahasa Jepang Bisnis I" untuk Kelas A dan Kelas B pada angkatan yang sama, sistem akan menolak pembuatan kelas kedua dengan pesan error `Kode mata kuliah sudah ada` jika kode dasarnya sama.
2. **Relasi Dosen Tunggal per Mata Kuliah**:
   - Kolom `dosenId` hanya menampung satu ID pengguna. Jika satu mata kuliah paralel Kelas A diajar oleh Dosen X, dan Kelas B diajar oleh Dosen Y, sistem tidak memiliki struktur untuk menghubungkan kedua rombel ini di bawah silabus kurikulum mata kuliah yang sama.
3. **Form Pembuatan Mata Kuliah ([`mata-kuliah/page.tsx:L97-L105`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/page.tsx#L97-L105))**:
   - Form input hanya memiliki field: `code`, `name`, `dosenId`, `cohort`, `type`, `peminatan`.
   - Tidak ada pilihan rombel/seksi kelas (`Kelas A`, `Kelas B`, atau `Multi-Kelas`).

#### B. Celah / Masalah yang Ditimbulkan
- Kurikulum tidak dapat dipetakan secara rapi. Admin terpaksa membuat trik manipulasi kode (misal `MK01` dan `MK01B`) yang merusak standarisasi transkrip akademik dan pelaporan PDDikti.
- Sesi pertemuan (Pertemuan 1 hingga 16) yang di-*generate* otomatis terikat pada entitas `courseId` tunggal, sehingga nilai UTS, UAS, dan materi per kelas paralel tidak dapat dipisahkan secara independen.

---

### 2.3. PILAR 3: Standarisasi Nama Ruangan & Engine Deteksi Bentrok

#### A. Kondisi Sistem Berjalan Saat Ini (Codebase Audit)
1. **Input Ruangan Bebas / Free Text di Frontend**:
   - Di [`TabJadwalKelas.tsx:L703-L711`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx#L703-L711):
     ```tsx
     <Label className="text-xs font-semibold text-slate-700">Ruangan</Label>
     <Input
         value={form.room}
         onChange={(e) => setForm({ ...form, room: e.target.value })}
         placeholder="Contoh: Ruang Teori 2"
         className="h-9 text-xs rounded-xl"
     />
     ```
   - Di [`TabJadwalPraktikum.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalPraktikum.tsx), field ruangan juga menggunakan `<Input>` bebas.
2. **Kelemahan Engine Deteksi Bentrok ([`scheduling.ts:L74-L104`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts#L74-L104))**:
   ```ts
   // apps/api/src/routes/scheduling.ts
   const allRoomSchedules = [
       ...existingClass,
       ...existingPracticum,
       ...existingDuty,
   ].filter(
       (s) =>
           s.room === payload.room && // <-- PERBANDINGAN STRING SENSITIF
           (!payload.sessionDate || !s.sessionDate || payload.sessionDate === s.sessionDate)
   );

   for (const s of allRoomSchedules) {
       if (s.startTime && s.endTime && isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)) {
           set.status = 400;
           return {
               success: false,
               message: `Konflik Ruangan: Ruang ${payload.room} sudah terpakai pada rentang waktu ini.`,
           };
       }
   }
   ```
3. **Tidak Adanya Validasi Bentrok Siswa / Rombel**:
   - Mesin penjadwalan hanya mengecek dua hal:
     1. Apakah Ruangan bentrok (`s.room === payload.room`)
     2. Apakah Dosen bentrok (`s.dosenId === payload.dosenId`)
   - **TIDAK ADA pengecekan apakah Mahasiswa/Rombel bentrok**: Jika Kelas A Angkatan 16 dijadwalkan kuliah di Ruang Teori 1 pada Senin 08:00–10:00 dengan Dosen A, lalu admin menjadwalkan Kelas A Angkatan 16 kuliah di Lab Komputer pada Senin 08:00–10:00 dengan Dosen B, **sistem akan meloloskannya tanpa peringatan apa pun!**

#### B. Celah / Masalah yang Ditimbulkan
- **Kasus Ruangan Ganda**: Admin 1 menginput `"Lantai 4 Rapat Utama"`, admin 2 menginput `"Lt 4 Ruang Rapat"`. Deteksi `s.room === payload.room` menghasilkan `false`. Dua mata kuliah berbeda dijadwalkan di ruangan fisik yang sama pada jam yang sama, memicu kericuhan di lokasi kampus.
- **Kasus Siswa Terbelah**: Rombel Kelas A dijadwalkan dua mata kuliah berbeda di jam yang sama karena sistem tidak memiliki memori rombel siswa.

---

### 2.4. Isu Pelengkap Terkait Panel Akademik (Segmen 15, 18, 19)

| Isu Akademik | Segmen | Kondisi Saat Ini | Kebutuhan Stakeholder |
| :--- | :--- | :--- | :--- |
| **Team Teaching (Dosen Ganda)** | Segmen 18 | Tabel [`courses`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts) hanya menyimpan satu `dosen_id`. | Satu mata kuliah dapat memiliki 2 dosen pengampu (*team teaching*) dan sistem mencatat rekap berapa kali masing-masing dosen mengajar per bulan. |
| **Rekap Presensi Mengajar Dosen** | Segmen 18 | Belum ada tabel & antarmuka rekap kehadiran dosen per bulan di dashboard dosen/akademik. | Monitoring keaktifan dosen pengampu: jumlah pertemuan yang telah dipenuhi per bulan untuk keperluan operasional & payroll. |
| **Cetak & Ekspor Jadwal Kelas** | Segmen 15 | Tidak ada tombol cetak atau ekspor di [`TabJadwalKelas.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx). | Tombol cetak langsung (*print preview*) atau ekspor jadwal perkuliahan terformat per rombel/angkatan. |
| **Import Massal Data Mahasiswa via Excel** | Segmen 18 | Input mahasiswa baru hanya bisa per satu mahasiswa lewat formulir PMB / registrasi. | Fitur upload template Excel standar untuk memasukkan data induk mahasiswa lama Angkatan 15 & 16 secara massal ke basis data. |
| **Standarisasi Bobot SKS** | Segmen 15 | Tabel [`courses`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts) belum memiliki kolom `sks: integer("sks")`. | Penambahan bobot SKS resmi per mata kuliah sebagai syarat pelaporan PDDikti dan perhitungan IPK. |

---

## 3. Matriks Kesenjangan Komparatif Panel Akademik

| Komponen Sistem | Status Kode Eksisting | Spesifikasi Kebutuhan Rapat | Status Kesenjangan | File yang Terdampak |
| :--- | :--- | :--- | :--- | :--- |
| **Atribut Rombel Siswa** | Tidak ada kolom rombel di DB | Nilai rombel `"A"` atau `"B"` per angkatan | **Kritis (Belum Ada)** | [`shared.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/shared.ts), [`TabDataMahasiswa.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/akademik/TabDataMahasiswa.tsx) |
| **Atribut Rombel Jadwal** | Hanya menyimpan `cohort` | Kolom `rombel` (`"A"` \| `"B"` \| `"Semua"`) wajib diisi | **Kritis (Belum Ada)** | [`scheduling.ts (schema)`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/scheduling.ts), [`TabJadwalKelas.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx) |
| **Deteksi Bentrok Rombel** | Cek `room` & `dosenId` saja | Cek bentrok jadwal `cohort + rombel + time` | **Kritis (Logika Kurang)** | [`scheduling.ts (route)`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts) |
| **Master Ruangan Kampus** | Input text bebas | Dropdown master nama ruangan terstandarisasi | **Kritis (Rawan Typo)** | [`TabJadwalKelas.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx), [`TabJadwalPraktikum.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalPraktikum.tsx) |
| **Mata Kuliah Multi-Kelas** | `courses.code` unique global | Dukungan kelas paralel (Kelas A & B) per kode matkul | **Kritis (Terkunci Unique)** | [`courses.ts (schema)`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts), [`courses.ts (route)`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/courses.ts) |
| **Peserta Kelas Perkuliahan** | Menarik 100% siswa satu angkatan | Menarik siswa sesuai rombel kelas terkait | **Kritis (Siswa Campur)** | [`[id]/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/%5Bid%5D/page.tsx) |
| **Team Teaching Dosen** | Single `dosenId` di tabel `courses` | Mendukung 2 dosen pengampu per matkul | **Belum Ada** | [`courses.ts (schema)`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts), [`courses.ts (route)`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/courses.ts) |
| **Presensi Mengajar Dosen** | Hanya ada presensi siswa | Rekap kehadiran dosen per bulan | **Belum Ada** | [`attendance.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/attendance.ts), [`dosen.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/dosen.ts) |
| **Cetak Jadwal Kelas** | Tidak ada tombol cetak/ekspor | Ekspor PDF / Print preview jadwal per rombel | **Belum Ada** | [`TabJadwalKelas.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx) |
| **Import Excel Mahasiswa** | Input satuan via form | Upload file Excel (.xlsx) data Angkatan 15 & 16 | **Belum Ada** | [`mahasiswa.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/mahasiswa.ts) |

---

## 4. Blueprint Solusi Teknis & Rencana Perbaikan Arsitektur

Berikut rancangan teknis konkret untuk menyelesaikan kesenjangan di atas:

### 4.1. Modifikasi Skema Basis Data (Database Refactoring)

#### 1. Perubahan pada Tabel Mahasiswa ([`shared.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/shared.ts))
Tambahkan kolom rombel:
```ts
// apps/api/src/db/schema/shared.ts -> students
export const students = pgTable("students", {
    // ...
    rombel: text("rombel").default("A").notNull(), // "A" | "B"
    // ...
});
```

#### 2. Perubahan pada Tabel Penjadwalan ([`scheduling.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/scheduling.ts))
Tambahkan kolom rombel pada `class_schedules` dan `practicum_schedules`:
```ts
// apps/api/src/db/schema/scheduling.ts
export const classSchedules = pgTable("class_schedules", {
    // ...
    subject: text("subject").notNull(),
    dosenId: integer("dosen_id").references(() => users.id),
    secondaryDosenId: integer("secondary_dosen_id").references(() => users.id), // Dukungan Team Teaching
    cohort: integer("cohort").notNull(),
    rombel: text("rombel").notNull().default("A"), // "A" | "B" | "Gabungan"
    room: text("room").notNull(),
    // ...
});
```

#### 3. Perubahan pada Tabel Mata Kuliah ([`courses.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/db/schema/courses.ts))
Ubah constraint unik kode dan tambahkan rombel serta SKS:
```ts
// apps/api/src/db/schema/courses.ts
export const courses = pgTable("courses", {
    id: serial("id").primaryKey(),
    code: text("code").notNull(), // Hapus .unique() global
    name: text("name").notNull(),
    sks: integer("sks").default(2).notNull(), // Tambah SKS
    dosenId: integer("dosen_id").references(() => users.id).notNull(),
    secondaryDosenId: integer("secondary_dosen_id").references(() => users.id), // Team Teaching
    peminatan: text("peminatan"),
    cohort: integer("cohort").notNull(),
    rombel: text("rombel").default("A").notNull(), // "A" | "B" | "Semua"
    type: courseTypeEnum("type").default("teori").notNull(),
    // ...
}, (t) => [
    // Unique komposit: kode mata kuliah unik per angkatan dan per rombel
    unique("uq_course_cohort_rombel").on(t.code, t.cohort, t.rombel),
]);
```

---

### 4.2. Standarisasi Master Ruangan Kampus

Buat konstanta master data ruangan resmi Nusadaya Academy:
```ts
// packages/shared atau apps/web/src/constants/rooms.ts
export const STANDARDIZED_CAMPUS_ROOMS = [
    { id: "lt4_rapat_utama", name: "Lantai 4 Rapat Utama", capacity: 60, floor: 4 },
    { id: "lt2_barista", name: "Lantai 2 Asosiasi Barista", capacity: 35, floor: 2 },
    { id: "lt2_lab_fnb", name: "Lantai 2 Lab Barista & F&B", capacity: 40, floor: 2 },
    { id: "lt3_teori_1", name: "Lantai 3 Ruang Teori 1", capacity: 45, floor: 3 },
    { id: "lt3_teori_2", name: "Lantai 3 Ruang Teori 2", capacity: 45, floor: 3 },
    { id: "lt1_front_office", name: "Lantai 1 Front Office Simulation", capacity: 30, floor: 1 },
    { id: "lt1_serbaguna", name: "Lantai 1 Ruang Serbaguna", capacity: 100, floor: 1 },
] as const;
```

Di frontend [`TabJadwalKelas.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx) dan [`TabJadwalPraktikum.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalPraktikum.tsx), ubah form input menjadi `<Select>` berbasis master ruangan di atas.

---

### 4.3. Penyempurnaan Mesin Deteksi Bentrok Jadwal

Perbarui validasi jadwal di [`apps/api/src/routes/scheduling.ts`](file:///c:/.PROJECT/dashboard-nusadaya/apps/api/src/routes/scheduling.ts) agar mengecek 3 lapis bentrok:

```ts
// 1. Validasi Bentrok Ruangan Fisik (Exact Match dengan Master Ruangan)
const roomConflict = allRoomSchedules.find((s) =>
    s.room === payload.room &&
    isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)
);
if (roomConflict) {
    set.status = 400;
    return {
        success: false,
        message: `Konflik Ruangan: ${payload.room} sudah terpakai pada rentang waktu ini.`,
    };
}

// 2. Validasi Bentrok Dosen (Utama & Pendamping)
if (payload.dosenId) {
    const dosenConflict = allDosenSchedules.find((s) =>
        (s.dosenId === payload.dosenId || s.secondaryDosenId === payload.dosenId) &&
        isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)
    );
    if (dosenConflict) {
        set.status = 400;
        return {
            success: false,
            message: `Konflik Dosen: Dosen pengampu telah memiliki jadwal mengajar lain pada waktu ini.`,
        };
    }
}

// 3. VALIDASI BARU: Bentrok Jadwal Mahasiswa per Rombel
const rombelConflict = existingClass.find((s) =>
    s.cohort === payload.cohort &&
    (s.rombel === payload.rombel || s.rombel === "Semua" || payload.rombel === "Semua") &&
    isTimeOverlap(payload.startTime, payload.endTime, s.startTime, s.endTime)
);
if (rombelConflict) {
    set.status = 400;
    return {
        success: false,
        message: `Konflik Rombel: Angkatan ${payload.cohort} Kelas ${payload.rombel} sudah memiliki perkuliahan '${rombelConflict.subject}' pada jam ini.`,
    };
}
```

---

### 4.4. Penyesuaian Antarmuka Frontend (UI/UX)

1. **Komponen Pembagian Rombel Mahasiswa ([`TabDataMahasiswa.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/akademik/TabDataMahasiswa.tsx))**:
   - Tambahkan Card/Select pengaturan Rombel mahasiswa (`Kelas A` vs `Kelas B`) di samping Status Mahasiswa dan NIM.
2. **Halaman Jadwal Kelas ([`TabJadwalKelas.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/components/panels/penjadwalan/TabJadwalKelas.tsx))**:
   - Filter bar: Tambah filter **Rombel (Semua / Kelas A / Kelas B)**.
   - Badge visual pada tabel: Beri label penanda rombel dengan styling tegas (`Kelas A` berwarna Indigo, `Kelas B` berwarna Emerald).
   - Tombol Aksi: Tambah tombol **"Cetak / Ekspor Jadwal"** (mendukung print layout rapi per rombel).
3. **Halaman Detail Mata Kuliah ([`[id]/page.tsx`](file:///c:/.PROJECT/dashboard-nusadaya/apps/web/src/app/dashboard/mata-kuliah/%5Bid%5D/page.tsx))**:
   - Query pengambilan peserta `cohortList` disesuaikan agar hanya mengambil mahasiswa yang `rombel === course.rombel` (kecuali jika diset kelas gabungan/semua).
   - Di tab "Daftar Pertemuan", dosen hanya melihat presensi mahasiswa kelas yang sedang diajarnya.

---

## 5. Rencana Aksi Eksekusi Bertahap (Action Plan)

| Tahap | Aktivitas Eksekusi | PIC | Tingkat Prioritas |
| :--- | :--- | :--- | :--- |
| **Tahap 1** | **Migrasi Skema DB**: Tambahkan `rombel` pada `students`, `class_schedules`, `practicum_schedules`, dan sesuaikan `courses` (rombel, SKS, `secondaryDosenId`). | Fauzan | **P0 (Kritis)** |
| **Tahap 2** | **Standarisasi Ruangan**: Buat master data ruangan kampus (`Lantai 4 Rapat Utama`, `Lantai 2 Asosiasi Barista`, dll.) dan perbarui form modal jadwal. | Andri | **P0 (Kritis)** |
| **Tahap 3** | **Upgrade Mesin Bentrok**: Implementasikan deteksi bentrok per rombel dan per dosen ganda di backend API scheduling. | Fauzan | **P0 (Kritis)** |
| **Tahap 4** | **Filter Peserta per Rombel**: Sesuaikan halaman detail mata kuliah agar absensi mahasiswa terisolasi per rombel Kelas A & B. | Andri & Fauzan | **P0 (Kritis)** |
| **Tahap 5** | **Fitur Cetak & Ekspor Jadwal**: Tambahkan ekspor PDF / Print layout pada panel penjadwalan. | Andri | **P1 (Tinggi)** |
| **Tahap 6** | **Template & Fitur Import Excel**: Implementasikan fitur import massal data mahasiswa lama Angkatan 15 & 16. | Fauzan | **P1 (Tinggi)** |
| **Tahap 7** | **Rekap Presensi Mengajar Dosen**: Buat rekap bulanan jam mengajar per dosen (termasuk *team teaching*). | Fauzan & Andri | **P1 (Tinggi)** |

---
*Analisis ini memetakan secara presisi perbaikan yang dibutuhkan pada modul Akademik & Penjadwalan agar sistem One Data Nusadaya beroperasi tanpa bentrok jadwal dan siap mendukung pembagian kelas paralel di lapangan.*
