# Akun Demo Dashboard Nusadaya

Berikut adalah daftar akun demo yang tersedia untuk menguji sistem sesuai dengan *Role-Based Access Control* (RBAC) per divisi.

| Nama / Divisi | Username | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Demo Superadmin** | `superadmin` | `password` | Memiliki akses penuh (read-only) ke semua panel, dan *edit* pada fitur global. |
| **Divisi PMB** | `pmb` | `password` | Hanya bisa mengedit form & melakukan *ACC* pada Panel PMB. |
| **Divisi CRM** | `crm` | `password` | Hanya bisa mengedit form & melakukan *ACC* pada Panel CRM. |
| **Divisi Finance** | `finance` | `password` | Hanya bisa mengedit form & melakukan *ACC* pada Panel Finance. |
| **Divisi Akademik** | `akademik` | `password` | Akses ke panel akademik. |
| **Dosen Pengajar** | `dosen` | `password` | Akses dosen. |
| **Pembimbing Akademik** | `pa` | `password` | Akses PA. |
| **Tim Magang** | `magang` | `password` | Akses divisi penyaluran magang. |
| **Tim Evaluator** | `evaluator` | `password` | Hanya bisa memantau evaluasi akhir mahasiswa. |

---

**Cara Penggunaan:**
Silakan masuk ke halaman Login (`/login`) dan gunakan kombinasi `username` dan `password` di atas untuk melihat bagaimana tampilan dan *permission* panel (*Dashboard* / *Student Detail*) berubah menyesuaikan role Anda.
