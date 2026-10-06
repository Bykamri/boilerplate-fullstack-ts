# Dokumentasi

Panduan memakai, mengubah, dan menambah fitur pada boilerplate ini. Baca berurutan jika baru pertama kali.

| # | Dokumen | Isi |
| --- | --- | --- |
| 1 | [Menjalankan proyek](01-menjalankan.md) | Instalasi, database (Docker / Laragon / PostgreSQL biasa), menjalankan backend & frontend, troubleshooting |
| 2 | [Cara kerja](02-cara-kerja.md) | Alur data dari klik tombol sampai ke database, peran setiap folder |
| 3 | [Panduan backend](03-backend.md) | Pola modul, validasi, query SQL, error, mengubah tabel tanpa migrasi, menguji API |
| 4 | [Panduan frontend](04-frontend.md) | Pola komponen–hook–API, memakai Bootstrap, menampilkan error |
| 5 | [Tutorial: mengupdate fitur](05-tutorial-update-fitur.md) | Menambah kolom `priority` ke todo, dari database sampai tampilan |
| 6 | [Tutorial: menambah fitur baru](06-tutorial-fitur-baru.md) | Membuat fitur `notes` (CRUD lengkap) dari nol |

## Mau melakukan apa?

| Saya ingin… | Buka |
| --- | --- |
| Menjalankan proyek untuk pertama kali | [01 – Menjalankan](01-menjalankan.md) |
| Memakai database dari Laragon | [01 – Opsi B: Laragon](01-menjalankan.md#opsi-b-laragon) |
| Mengerti file mana yang dipanggil saat tombol diklik | [02 – Cara kerja](02-cara-kerja.md#alur-satu-request) |
| Mengubah aturan validasi | [03 – Validasi](03-backend.md#validasi) |
| Menambah / mengubah kolom tabel | [03 – Mengubah database](03-backend.md#mengubah-database-tanpa-migrasi) lalu [Tutorial 05](05-tutorial-update-fitur.md) |
| Menambah endpoint di fitur yang sudah ada | [03 – Menambah endpoint](03-backend.md#menambah-endpoint-di-modul-yang-sudah-ada) |
| Membuat fitur baru (tabel + API + halaman) | [Tutorial 06](06-tutorial-fitur-baru.md) |
| Mengubah tampilan | [04 – Bootstrap](04-frontend.md#styling-dengan-bootstrap) |
| Menampilkan pesan error validasi per field | [04 – Error per field](04-frontend.md#menampilkan-error-per-field) |
| Mencoba API tanpa frontend | [03 – Menguji API](03-backend.md#menguji-api) |

## Aturan singkat

1. **Database adalah sumber kebenaran.** Struktur tabel ada di `backend/database/schema.sql`. Tidak ada migrasi.
2. **Types adalah kontrak.** Setiap bentuk data didefinisikan di `backend/src/types/` dan disalin ke `frontend/src/types/` dengan field yang sama.
3. **Satu fitur = satu folder modul** di backend (`routes`, `validation`, `repository`) dan **satu panel** di frontend (`XxxPanel`, `useXxx`, komponen-komponennya).
4. **Validasi selalu di backend.** Validasi di frontend (misalnya tombol disabled) hanya untuk kenyamanan, bukan keamanan.
5. **Tampilan memakai class Bootstrap.** Tulis CSS sendiri di `frontend/src/index.css` hanya jika tidak ada class Bootstrap yang cocok.
