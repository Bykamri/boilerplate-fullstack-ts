# Boilerplate Full-Stack: React + Node.js + PostgreSQL

Boilerplate full-stack dengan **TypeScript** di frontend dan backend. Backend dan frontend adalah **proyek terpisah** (bukan monorepo): masing-masing punya `package.json`, `node_modules`, dan script sendiri, jadi bisa dipindah ke repo lain atau di-deploy sendiri-sendiri.

Styling frontend memakai **Bootstrap 5.3** (CSS saja, tanpa jQuery dan tanpa `react-bootstrap`), jadi class yang dipakai sama persis dengan [dokumentasi Bootstrap](https://getbootstrap.com/docs/5.3/). Light/dark mode mengikuti setting OS.

## Dokumentasi

Panduan lengkap ada di folder [`docs/`](docs/README.md):

| # | Dokumen | Isi |
| --- | --- | --- |
| 1 | [Menjalankan proyek](docs/01-menjalankan.md) | Instalasi, database (Docker / Laragon / PostgreSQL biasa), troubleshooting |
| 2 | [Cara kerja](docs/02-cara-kerja.md) | Alur data dari klik tombol sampai database, peran setiap folder |
| 3 | [Panduan backend](docs/03-backend.md) | Pola modul, validasi, query SQL, error, mengubah tabel, menguji API |
| 4 | [Panduan frontend](docs/04-frontend.md) | Pola komponen–hook–API, Bootstrap, menampilkan error |
| 5 | [Tutorial: mengupdate fitur](docs/05-tutorial-update-fitur.md) | Menambah kolom `priority` ke todo |
| 6 | [Tutorial: menambah fitur baru](docs/06-tutorial-fitur-baru.md) | Membuat fitur `notes` (CRUD) dari nol |

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 7, Bootstrap 5.3
- **Backend:** Node.js, Express 5, TypeScript, validasi manual tanpa library
- **Database:** PostgreSQL, driver `pg`, skema dalam file SQL biasa (tanpa migrasi)

## Struktur folder

```
boilerplate-fs/
├── docs/                       # Dokumentasi
├── backend/                    # REST API (proyek mandiri)
│   ├── database/
│   │   ├── schema.sql          # Struktur semua tabel (CREATE TABLE)
│   │   └── seed.sql            # Data contoh
│   ├── src/
│   │   ├── types/              # ★ Bentuk data: todo.ts, api.ts
│   │   ├── modules/            # 1 folder per fitur
│   │   │   ├── health/         #   GET /api/health
│   │   │   └── todos/          #   *.routes.ts, *.validation.ts, *.repository.ts
│   │   ├── lib/                # http-error.ts, validation.ts (helper bersama)
│   │   ├── middleware/         # Error handler & 404
│   │   ├── config/env.ts       # Validasi environment variable
│   │   ├── db/pool.ts          # Koneksi PostgreSQL
│   │   ├── app.ts              # Middleware + daftar router
│   │   └── index.ts            # Entry point
│   ├── docker-compose.yml      # PostgreSQL (otomatis menjalankan database/*.sql)
│   └── package.json
└── frontend/                   # React + Bootstrap (proyek mandiri)
    ├── src/
    │   ├── types/              # ★ Bentuk data, sama dengan backend/src/types
    │   ├── lib/api.ts          # Semua pemanggilan API
    │   ├── hooks/              # useTodos, useTodoForm, useHealth
    │   ├── components/         # TodosPanel + TodoForm, TodoList, FilterBar, StatusBadge
    │   ├── constants.ts        # Label & pilihan untuk tampilan
    │   ├── index.css           # CSS tambahan di atas Bootstrap
    │   ├── App.tsx             # Layout halaman
    │   └── main.tsx            # Import CSS Bootstrap + dark mode
    ├── vite.config.ts          # Port 5173 + proxy /api ke backend
    └── package.json
```

## Mulai cepat

Prasyarat: Node.js **20.19+** dan PostgreSQL (lewat Docker, Laragon, atau instalasi biasa). Detail setiap opsi database ada di [docs/01-menjalankan.md](docs/01-menjalankan.md).

**Terminal 1: backend**

```bash
cd backend
npm install
cp .env.example .env
npm run db:up      # Docker: start PostgreSQL, tabel & data contoh dibuat otomatis
npm run dev        # http://localhost:4000/api
```

Tanpa Docker: lewati `npm run db:up`, jalankan `database/schema.sql` dan `database/seed.sql` di database Anda (HeidiSQL / pgAdmin / psql), lalu sesuaikan `DATABASE_URL` di `.env`.

**Terminal 2: frontend**

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Jika badge di kanan atas halaman bertuliskan **API & DB online**, semuanya sudah tersambung.

## Script

| Backend (`cd backend`) | Fungsi |
| --- | --- |
| `npm run dev` | API dengan hot reload |
| `npm run db:up` / `db:down` | Start / stop PostgreSQL (Docker) |
| `npm run db:reset` | Hapus database lalu buat ulang dari `schema.sql` + `seed.sql` (Docker) |
| `npm run db:logs` | Log PostgreSQL (Docker) |
| `npm run build` / `npm start` | Build ke `dist/` lalu jalankan versi production |
| `npm run typecheck` / `npm run format` | Cek tipe / format dengan Prettier |

| Frontend (`cd frontend`) | Fungsi |
| --- | --- |
| `npm run dev` | Dev server Vite |
| `npm run build` / `npm run preview` | Build ke `dist/` / preview hasil build |
| `npm run typecheck` / `npm run format` | Cek tipe / format dengan Prettier |

## API

Semua error berbentuk `{ "error": { "message": string, "details"?: FieldError[] } }`.

| Method | Endpoint | Body | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | – | `200 HealthResponse` / `503` jika DB mati |
| GET | `/api/todos` | – | `200 Todo[]` |
| POST | `/api/todos` | `CreateTodoInput` | `201 Todo` |
| PATCH | `/api/todos/:id` | `UpdateTodoInput` | `200 Todo` |
| DELETE | `/api/todos/:id` | – | `204` |

Aturan validasi dan contoh response error ada di [docs/03-backend.md](docs/03-backend.md#validasi).

## Build production

- **Backend:** `npm run build` lalu `npm start`. Set environment variable dan pastikan `schema.sql` sudah dijalankan di database server.
- **Frontend:** `npm run build` menghasilkan file statis di `dist/` yang bisa di-deploy ke hosting statis mana pun. Set `VITE_API_URL` saat build jika API berada di domain lain, atau arahkan `/api` ke backend lewat reverse proxy.
