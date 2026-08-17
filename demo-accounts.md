# Akun Demo Dashboard Nusadaya

Berikut adalah daftar akun demo yang tersedia untuk menguji sistem sesuai dengan *Role-Based Access Control* (RBAC) per divisi.

| Nama / Divisi | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Demo Superadmin** | `superadmin` | `password` | Memiliki akses penuh (read-only) ke semua panel, dan *edit* pada fitur global. |
| **Divisi PMB** | `pmb` | `password` | Hanya bisa mengedit form & melakukan *ACC* pada Panel PMB. |
| **Divisi CRM** | `crm` | `password` | Hanya bisa mengedit form & melakukan *ACC* pada Panel CRM. |
| **Divisi Finance** | `finance` | `password` | Hanya bisa mengedit form & melakukan *ACC* pada Panel Finance. |
| **Divisi Akademik** | `akademik` | `password` | Akses ke panel akademik. |
| **Dosen Pengajar** | `dosen` / `dosen1` - `dosen10` | `password` | Akses dosen pengajar. |
| **Pembimbing Akademik** | `pa` / `pa1` - `pa10` | `password` | Akses dosen pembimbing akademik (PA). |
| **Mahasiswa** | `mahasiswa1` - `mahasiswa10` | `password` | Akun portal mahasiswa. |
| **Tim Magang** | `magang` | `password` | Akses divisi penyaluran magang. |
| **Tim Evaluator** | `evaluator` | `password` | Hanya bisa memantau evaluasi akhir mahasiswa. |

---

### 🎓 Daftar 10 Mahasiswa & Distribusi Dosen PA Pembimbing:

| NIM | Nama Mahasiswa | Username | Password | Pembimbing Akademik (PA) |
| :--- | :--- | :--- | :--- | :--- |
| `250001` | Aditya Pratama | `mahasiswa1` | `password` | Dr. Maya Indah Permata, M.Pd. (`pa1`) |
| `250002` | Bella Safitri | `mahasiswa2` | `password` | Bambang Wijaya, S.Pd., M.Ed. (`pa2`) |
| `250003` | Dimas Anggara | `mahasiswa3` | `password` | dr. Ratna Sari, M.Biomed. (`pa3`) |
| `250004` | Eka Putri Rahayu | `mahasiswa4` | `password` | Drs. Joko Purwanto, M.M. (`pa4`) |
| `250005` | Faris Maulana | `mahasiswa5` | `password` | Sri Wahyuni, S.Pd., M.Pd. (`pa5`) |
| `250006` | Gita Gutawa | `mahasiswa6` | `password` | Ahmad Ridwan, S.T., M.Sc. (`pa6`) |
| `250007` | Hilman Syahputra | `mahasiswa7` | `password` | Fitri Handayani, S.Par., M.Par. (`pa7`) |
| `250008` | Intan Permata | `mahasiswa8` | `password` | Hadi Pranoto, S.T., M.Kom. (`pa8`) |
| `250009` | Julian Alamsyah | `mahasiswa9` | `password` | Yuliana Dewi, S.Si., M.Si. (`pa9`) |
| `250010` | Karin Novilda | `mahasiswa10` | `password` | Rizky Firmansyah, S.Pd., M.Pd. (`pa10`) |

---

**Cara Penggunaan:**
Silakan masuk ke halaman Login (`/login`) dan gunakan kombinasi `username` dan `password` di atas untuk melihat bagaimana tampilan dan *permission* panel (*Dashboard* / *Student Detail*) berubah menyesuaikan role Anda.
