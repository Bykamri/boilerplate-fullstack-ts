# 1. Menjalankan proyek

## Prasyarat

| Kebutuhan | Versi | Cek dengan |
| --- | --- | --- |
| Node.js | 20.19 atau lebih baru (disarankan 22/24) | `node -v` |
| npm | ikut terpasang bersama Node.js | `npm -v` |
| PostgreSQL | 14 atau lebih baru | lewat Docker, Laragon, atau instalasi biasa |

> **Penting:** backend ini memakai **PostgreSQL**, bukan MySQL. Jika memakai Laragon, pastikan yang dijalankan adalah PostgreSQL (lihat [Opsi B](#opsi-b-laragon)).

## Langkah 1: install dependency

Backend dan frontend adalah proyek terpisah, jadi `npm install` dijalankan di masing-masing folder:

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

## Langkah 2: siapkan database

Pilih **salah satu** opsi di bawah. Hasil akhirnya sama: ada database berisi tabel `todos`.

### Opsi A: Docker

Paling cepat jika Docker Desktop sudah terpasang dan sedang berjalan.

```bash
cd backend
npm run db:up
```

Perintah ini menjalankan PostgreSQL di container. Saat container dibuat **pertama kali**, `database/schema.sql` dan `database/seed.sql` dijalankan otomatis.

| Setting | Nilai |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| User / password | `app` / `app` |
| Database | `app` |

Perintah lain: `npm run db:down` (stop), `npm run db:reset` (hapus semua data lalu buat ulang dari file SQL), `npm run db:logs` (lihat log).

### Opsi B: Laragon

Laragon secara default menjalankan MySQL. PostgreSQL perlu ditambahkan dulu. Nama menu bisa sedikit berbeda antar versi Laragon:

1. **Tambahkan PostgreSQL** lewat menu Laragon → *Tools* → *Quick add* → *postgresql*, atau pasang PostgreSQL secara terpisah.
2. Klik **Start All** dan pastikan PostgreSQL berjalan (port default `5432`).
3. Buka **HeidiSQL** (tombol *Database* di Laragon), buat session baru:
   - *Network type*: **PostgreSQL (TCP/IP)**
   - *Hostname*: `127.0.0.1`, *Port*: `5432`
   - *User*: biasanya `postgres`; *Password*: kosong atau sesuai yang diatur saat instalasi
4. Buat database baru bernama `app` (klik kanan pada koneksi → *Create new* → *Database*).
5. Pilih database `app`, buka tab **Query**, lalu tempel dan jalankan (F9) isi file berikut secara berurutan:
   1. `backend/database/schema.sql`
   2. `backend/database/seed.sql` (opsional, hanya data contoh)

Lalu di `backend/.env` (lihat langkah 3), sesuaikan `DATABASE_URL` dengan user dan password Laragon:

```
# dengan password
DATABASE_URL=postgres://postgres:password_anda@localhost:5432/app

# tanpa password
DATABASE_URL=postgres://postgres@localhost:5432/app
```

> Jangan jalankan PostgreSQL Laragon dan PostgreSQL Docker bersamaan: keduanya memakai port `5432`.

### Opsi C: PostgreSQL biasa (pgAdmin / psql)

1. Buat database `app` (lewat pgAdmin: klik kanan *Databases* → *Create* → *Database*).
2. Jalankan `schema.sql` lalu `seed.sql`, lewat **pgAdmin → Query Tool** atau terminal:

   ```bash
   psql -U postgres -d app -f database/schema.sql
   ```

   ```bash
   psql -U postgres -d app -f database/seed.sql
   ```

3. Sesuaikan `DATABASE_URL` di `backend/.env` seperti contoh di Opsi B.

## Langkah 3: buat file `.env` backend

```bash
cd backend
cp .env.example .env
```

Di Windows tanpa Git Bash, salin file `.env.example` lalu ganti namanya menjadi `.env`.

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `PORT` | `4000` | Port API |
| `DATABASE_URL` | – (wajib) | `postgres://USER:PASSWORD@HOST:PORT/NAMA_DATABASE` |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin frontend yang boleh memanggil API, dipisah koma |

Frontend tidak wajib punya `.env`. Lihat [Panduan frontend](04-frontend.md#environment-variable) jika API berada di domain lain.

## Langkah 4: jalankan

Butuh **2 terminal** yang berjalan bersamaan.

**Terminal 1: backend**

```bash
cd backend
npm run dev
```

Jika berhasil, muncul `API ready at http://localhost:4000/api (development)`. Setiap file di `src/` disimpan, server restart otomatis.

**Terminal 2: frontend**

```bash
cd frontend
npm run dev
```

Buka **http://localhost:5173**. Perubahan file di `src/` langsung terlihat di browser tanpa reload.

## Langkah 5: pastikan semuanya tersambung

- Badge di kanan atas halaman bertuliskan **API & DB online** (hijau).
- Daftar todo menampilkan 3 data contoh (jika `seed.sql` dijalankan).
- Membuka http://localhost:4000/api/health di browser menampilkan `{"status":"ok","database":"up",...}`.

## Troubleshooting

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| `Invalid environment variable: DATABASE_URL is required` | File `backend/.env` belum dibuat | Kerjakan [langkah 3](#langkah-3-buat-file-env-backend) |
| Badge **API offline** | Backend belum jalan, atau crash | Cek terminal backend; jalankan `npm run dev` |
| Badge **Database down** | PostgreSQL belum jalan atau `DATABASE_URL` salah | Start PostgreSQL; cek host, port, user, password, nama database |
| Error `relation "todos" does not exist` | `schema.sql` belum dijalankan di database itu | Jalankan `schema.sql` (atau `npm run db:reset` untuk Docker) |
| Error `password authentication failed` | User/password di `DATABASE_URL` salah | Samakan dengan setting PostgreSQL / Laragon |
| Error `database "app" does not exist` | Database belum dibuat | Buat database `app`, atau ganti nama di `DATABASE_URL` |
| `EADDRINUSE: address already in use :::4000` | Port 4000 dipakai program lain | Tutup program itu, atau ubah `PORT` di `.env` **dan** target proxy di `frontend/vite.config.ts` |
| `Port 5173 is in use` | Dev server frontend lain masih jalan | Tutup terminal lama, atau ubah port di `vite.config.ts` **dan** `CORS_ORIGIN` |
| `failed to connect to the docker API` | Docker Desktop belum dibuka | Buka Docker Desktop, tunggu sampai *running*, ulangi `npm run db:up` |
| Perubahan `schema.sql` tidak muncul (Docker) | File SQL hanya dijalankan saat database pertama kali dibuat | `npm run db:reset` (data terhapus), atau jalankan `ALTER TABLE` manual (lihat [Panduan backend](03-backend.md#mengubah-database-tanpa-migrasi)) |
