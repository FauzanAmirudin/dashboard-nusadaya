# Akun Demo Dashboard Nusadaya

Berikut adalah daftar akun demo yang tersedia untuk menguji sistem OneData Nusadaya Academy sesuai dengan *Role-Based Access Control* (RBAC) per divisi, modul akademik, dan portal mahasiswa.

> [!NOTE]
> **Kebijakan Login & OTP 2FA:**
> - Login dapat menggunakan **Username** atau **Email terdaftar**.
> - Semua akun demo menggunakan password default: **`password`**.
> - Sistem dilengkapi verifikasi OTP 6-digit. Selama masa uji coba/pengembangan, kode OTP dikirimkan ke email terdaftar **dan** otomatis ditampilkan di bawah form input OTP untuk kemudahan pengujian.

---

## 🏢 1. Akun Divisi Manajemen & Staf Operasional

| Divisi / Peran | Username | Email Login | Password | Hak Akses & Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Superadmin** | `superadmin` | `onedatanusadaya@gmail.com` | `password` | Akses penuh seluruh panel, konfigurasi global, manajemen pengguna, backup, dan pengaturan biaya. |
| **Divisi PMB** | `pmb` | `pmb@nusadaya.ac.id` | `password` | Manajemen calon mahasiswa, validasi berkas pendaftaran, formulir PMB, dan pemberian ACC PMB. |
| **Divisi CRM** | `crm` | `crm@nusadaya.ac.id` | `password` | Monitoring komitmen orang tua & industri, kelengkapan kosakata, izin studi, dan ACC CRM. |
| **Divisi Finance** | `finance` | `finance@nusadaya.ac.id` | `password` | Billing pembayaran, skema cicilan, verifikasi pelunasan, pencairan fee sharing, dan ACC Finance. |
| **Divisi Akademik** | `akademik` | `akademik@nusadaya.ac.id` | `password` | Penjadwalan kuliah, master akademik, rombel/kelas, manajemen kehadiran, asesmen pilar, dan ACC Akademik. |
| **Tim Magang** | `magang` | `magang@nusadaya.ac.id` | `password` | Kelengkapan pra-paspor/visa, kesiapan LoL, penempatan industri luar negeri, dan ACC Magang. |
| **Koordinator PA** | `pa` | `pa@nusadaya.ac.id` | `password` | Akun umum pembimbing akademik untuk supervisi bimbingan mahasiswa. |
| **Dosen Umum** | `dosen` | `dosen@nusadaya.ac.id` | `password` | Akun umum pengajar perkuliahan. |

---

## 👨‍🏫 2. Akun Dosen Pembimbing Akademik (PA)

Setiap dosen PA memiliki akses ke panel pembimbing akademik untuk memvalidasi logbook, memberikan bimbingan perwalian, dan memberikan ACC PA mahasiswa binaannya:

| Username | Nama Lengkap Dosen PA | Email Login | Password | Peran Tambahan |
| :--- | :--- | :--- | :--- | :--- |
| `pa1` | Dr. Maya Indah Permata, M.Pd. | `pa1@nusadaya.ac.id` | `password` | PA |
| `pa2` | Bambang Wijaya, S.Pd., M.Ed. | `pa2@nusadaya.ac.id` | `password` | PA |
| `pa3` | dr. Ratna Sari, M.Biomed. | `pa3@nusadaya.ac.id` | `password` | PA |
| `pa4` | Drs. Joko Purwanto, M.M. | `pa4@nusadaya.ac.id` | `password` | PA |
| `pa5` | Sri Wahyuni, S.Pd., M.Pd. | `pa5@nusadaya.ac.id` | `password` | PA |
| `pa6` | Ahmad Ridwan, S.T., M.Sc. | `pa6@nusadaya.ac.id` | `password` | PA |
| `pa7` | Fitri Handayani, S.Par., M.Par. | `pa7@nusadaya.ac.id` | `password` | PA |
| `pa8` | Hadi Pranoto, S.T., M.Kom. | `pa8@nusadaya.ac.id` | `password` | PA |
| `pa9` | Yuliana Dewi, S.Si., M.Si. | `pa9@nusadaya.ac.id` | `password` | PA & CRM |
| `pa10` | Rizky Firmansyah, S.Pd., M.Pd. | `pa10@nusadaya.ac.id` | `password` | PA & Akademik |

---

## 📚 3. Akun Dosen Pengajar Mata Kuliah

Dosen pengajar memiliki akses ke modul perkuliahan, absensi kelas harian, dan penilaian akademik mahasiswa:

| Username | Nama Dosen Pengajar | Email Login | Password |
| :--- | :--- | :--- | :--- |
| `dosen1` | Dr. Hendra Gunawan, M.Pd. | `dosen1@nusadaya.ac.id` | `password` |
| `dosen2` | Siti Rahmawati, S.E., M.M. | `dosen2@nusadaya.ac.id` | `password` |
| `dosen3` | Budi Prasetyo, S.Kom., M.Kom. | `dosen3@nusadaya.ac.id` | `password` |
| `dosen4` | Dewi Lestari, S.Par., M.Par. | `dosen4@nusadaya.ac.id` | `password` |
| `dosen5` | Agus Setiawan, S.T., M.Sc. | `dosen5@nusadaya.ac.id` | `password` |
| `dosen6` | Nurul Hidayah, S.Pd., M.Pd. | `dosen6@nusadaya.ac.id` | `password` |
| `dosen7` | Eko Saputra, S.S., M.Hum. | `dosen7@nusadaya.ac.id` | `password` |
| `dosen8` | Rina Kusuma, S.Si., M.Si. | `dosen8@nusadaya.ac.id` | `password` |
| `dosen9` | Fajar Pratama, S.Kom., M.Kom. | `dosen9@nusadaya.ac.id` | `password` |
| `dosen10` | Anisa Wulandari, S.E., M.M. | `dosen10@nusadaya.ac.id` | `password` |

---

## 🎓 4. Akun Portal Mahasiswa & Distribusi Dosen PA

Mahasiswa dapat login ke portal mahasiswa (`/mahasiswa/dashboard`) untuk melihat status 6 pintu verifikasi, jadwal perkuliahan, absensi, tagihan keuangan, dan bimbingan PA:

| NIM | Nama Mahasiswa | Username | Email Login | Password | Program / Peminatan | Dosen PA Pembimbing |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `250001` | Aditya Pratama | `mahasiswa1` | `mhs1@student.nusadaya.ac.id` | `password` | Hospitality (Malaysia) | Dr. Maya Indah Permata, M.Pd. (`pa1`) |
| `250002` | Bella Safitri | `mahasiswa2` | `mhs2@student.nusadaya.ac.id` | `password` | Culinary (Taiwan) | Bambang Wijaya, S.Pd., M.Ed. (`pa2`) |
| `250003` | Dimas Anggara | `mahasiswa3` | `mhs3@student.nusadaya.ac.id` | `password` | Barista (Timur Tengah) | dr. Ratna Sari, M.Biomed. (`pa3`) |
| `250004` | Eka Putri Rahayu | `mahasiswa4` | `mhs4@student.nusadaya.ac.id` | `password` | Front Office (Malaysia) | Drs. Joko Purwanto, M.M. (`pa4`) |
| `2500051` | Faris Maulana Gaming | `mahasiswa5` | `mhs5@student.nusadaya.ac.id` | `password` | Housekeeping (Taiwan) | Bambang Wijaya, S.Pd., M.Ed. (`pa2`) |
| `250006` | Gita Gutawa | `mahasiswa6` | `mhs6@student.nusadaya.ac.id` | `password` | Hospitality (Indonesia) | Ahmad Ridwan, S.T., M.Sc. (`pa6`) |
| `250007` | Hilman Syahputra | `mahasiswa7` | `mhs7@student.nusadaya.ac.id` | `password` | Culinary (Malaysia) | Fitri Handayani, S.Par., M.Par. (`pa7`) |
| `250008` | Intan Permata | `mahasiswa8` | `mhs8@student.nusadaya.ac.id` | `password` | Barista (Timur Tengah) | Hadi Pranoto, S.T., M.Kom. (`pa8`) |
| `250009` | Julian Alamsyah | `mahasiswa9` | `mhs9@student.nusadaya.ac.id` | `password` | Front Office (Taiwan) | Yuliana Dewi, S.Si., M.Si. (`pa9`) |
| `250010` | Karin Novilda | `mahasiswa10` | `mhs10@student.nusadaya.ac.id` | `password` | Hospitality (Malaysia) | Rizky Firmansyah, S.Pd., M.Pd. (`pa10`) |

---

## 💡 Petunjuk Penggunaan Login
1. Buka halaman Login pada alamat: [`http://localhost:3000/login`](http://localhost:3000/login) (atau domain produksi).
2. Masukkan **Username** atau **Email** dari tabel di atas beserta kata sandi `password`.
3. Pada halaman verifikasi OTP:
   - Kode OTP 6 digit akan terkirim ke email akun yang bersangkutan.
   - Untuk kemudahan pengujian, kode OTP juga tercantum langsung di bawah kolom isian OTP.
4. Klik **Verifikasi & Masuk** untuk dialihkan ke panel dashboard sesuai hak akses role masing-masing.
