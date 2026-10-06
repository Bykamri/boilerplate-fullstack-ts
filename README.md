# Boilerplate Full-Stack: React + Node.js + PostgreSQL

Boilerplate full-stack dengan **TypeScript** di frontend dan backend. Backend dan frontend adalah **proyek terpisah** (bukan monorepo): masing-masing punya `package.json`, `node_modules`, dan script sendiri, jadi bisa dipindah ke repo lain atau di-deploy sendiri-sendiri.

Styling frontend memakai **Bootstrap 5.3** (CSS saja, tanpa jQuery dan tanpa `react-bootstrap`), jadi class yang dipakai sama persis dengan [dokumentasi Bootstrap](https://getbootstrap.com/docs/5.3/). Light/dark mode mengikuti setting OS lewat `data-bs-theme`.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite 7, Bootstrap 5.3
- **Backend:** Node.js, Express 5, TypeScript, validasi manual tanpa library
- **Database:** PostgreSQL 17 (via Docker Compose), driver `pg`, skema dalam file SQL biasa

## Struktur folder

```
boilerplate-fs/
├── backend/                    # REST API (proyek mandiri)
│   ├── database/
│   │   ├── schema.sql          # CREATE TABLE
│   │   └── seed.sql            # Data contoh
│   ├── src/
│   │   ├── types/              # ★ Bentuk data (interface/type)
│   │   │   ├── todo.ts         #   Todo, CreateTodoInput, UpdateTodoInput
│   │   │   └── api.ts          #   ErrorResponse, FieldError, HealthResponse
│   │   ├── config/env.ts       # Validasi environment variable
│   │   ├── db/pool.ts          # Koneksi PostgreSQL
│   │   ├── lib/http-error.ts   # Class HttpError
│   │   ├── middleware/         # Error handler & 404
│   │   ├── modules/            # 1 folder per fitur
│   │   │   ├── health/         #   GET /api/health
│   │   │   └── todos/          #   routes, validation, repository
│   │   ├── app.ts              # Setup Express
│   │   └── index.ts            # Entry point
│   ├── docker-compose.yml      # PostgreSQL (otomatis menjalankan database/*.sql)
│   └── package.json
└── frontend/                   # React + Bootstrap (proyek mandiri)
    ├── src/
    │   ├── types/              # ★ Bentuk data, sama dengan backend/src/types
    │   │   ├── todo.ts         #   Todo, CreateTodoInput, UpdateTodoInput, TodoFilter
    │   │   ├── api.ts          #   ErrorResponse, FieldError, HealthResponse, HealthStatus
    │   │   └── index.ts        #   Re-export, jadi cukup `import type { Todo } from '../types'`
    │   ├── components/         # StatusBadge, TodoForm, TodoList, FilterBar
    │   ├── hooks/              # useTodos, useTodoForm, useHealth
    │   ├── lib/api.ts          # Fetch wrapper + endpoint API
    │   ├── constants.ts        # Label filter & status
    │   ├── index.css           # Override kecil di atas Bootstrap
    │   ├── App.tsx
    │   └── main.tsx            # Import CSS Bootstrap + dark mode
    ├── vite.config.ts          # Port 5173 + proxy /api ke backend
    └── package.json
```

## Prasyarat

- Node.js **20.19+** (disarankan 22 atau 24)
- Docker Desktop, **atau** PostgreSQL yang sudah terpasang di komputer

## Mulai cepat

Butuh 2 terminal: satu untuk backend, satu untuk frontend.

**Terminal 1: backend**

```bash
cd backend
npm install
cp .env.example .env
npm run db:up      # start PostgreSQL; tabel & data contoh dibuat otomatis
npm run dev        # http://localhost:4000/api
```

**Terminal 2: frontend**

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Saat development, Vite mem-proxy `/api/*` ke `http://localhost:4000`, jadi frontend tidak perlu konfigurasi URL atau CORS.

## Database

Tidak ada sistem migrasi. Struktur tabel cukup ditulis di `backend/database/schema.sql`, dan data contoh di `backend/database/seed.sql`.

**Dengan Docker:** kedua file dijalankan otomatis saat container PostgreSQL **pertama kali** dibuat. Setelah mengubah `schema.sql`, buat ulang database (semua data akan terhapus):

```bash
npm run db:reset
```

**Tanpa Docker:** buat database `app`, sesuaikan `DATABASE_URL` di `backend/.env`, lalu jalankan kedua file SQL lewat pgAdmin (Query Tool) atau `psql`:

```bash
psql -U postgres -d app -f database/schema.sql
```

```bash
psql -U postgres -d app -f database/seed.sql
```

## Types

Semua bentuk data didefinisikan di folder `types/`, terpisah dari logika:

| Backend | Frontend | Isi |
| --- | --- | --- |
| `backend/src/types/todo.ts` | `frontend/src/types/todo.ts` | Data todo dan body request-nya |
| `backend/src/types/api.ts` | `frontend/src/types/api.ts` | Bentuk response error & health check |

Nama dan field di kedua sisi sama, sehingga kontrak API terlihat di satu tempat. Satu-satunya perbedaan: tanggal (`createdAt`, `updatedAt`) bertipe `Date` di backend dan `string` di frontend, karena JSON tidak punya tipe tanggal.

Jika mengubah kolom tabel, ubah juga type di **kedua** sisi.

## Script

**Backend** (`cd backend`)

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Jalankan API dengan hot reload (`tsx watch`) |
| `npm run db:up` / `db:down` | Start / stop container PostgreSQL |
| `npm run db:reset` | Hapus database lalu buat ulang dari `schema.sql` + `seed.sql` |
| `npm run db:logs` | Lihat log PostgreSQL |
| `npm run build` / `npm start` | Build ke `dist/` lalu jalankan versi production |
| `npm run typecheck` / `npm run format` | Cek tipe / format dengan Prettier |

**Frontend** (`cd frontend`)

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Dev server Vite |
| `npm run build` | Typecheck + build ke `dist/` |
| `npm run preview` | Preview hasil build |
| `npm run typecheck` / `npm run format` | Cek tipe / format dengan Prettier |

## API

Semua response error berbentuk `ErrorResponse`: `{ "error": { "message": string, "details"?: FieldError[] } }`.

| Method | Endpoint | Body | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | – | `200 HealthResponse` / `503` jika DB mati |
| GET | `/api/todos` | – | `200 Todo[]` |
| POST | `/api/todos` | `CreateTodoInput` | `201 Todo` |
| PATCH | `/api/todos/:id` | `UpdateTodoInput` | `200 Todo` |
| DELETE | `/api/todos/:id` | – | `204` |

## Validasi

Validasi ditulis manual dengan fungsi TypeScript biasa, tanpa library, supaya alurnya mudah diikuti:

- **Request:** `backend/src/modules/todos/todos.validation.ts`. Setiap fungsi menerima input mentah (`req.body` / `req.params`), memeriksanya, lalu mengembalikan data yang sudah bersih atau melempar `HttpError` 400.
- **Environment variable:** `backend/src/config/env.ts`. Server langsung berhenti dengan pesan jelas jika ada env yang salah.

| Aturan | Pesan error |
| --- | --- |
| Body harus object JSON | `Request body must be a JSON object` |
| `title` wajib, string, tidak kosong setelah di-trim | `Title is required` / `Title must be a string` |
| `title` maksimal 200 karakter | `Title must be at most 200 characters` |
| `completed` harus boolean | `Completed must be true or false` |
| PATCH minimal berisi `title` atau `completed` | `Provide at least one field to update: title or completed` |
| `:id` harus bilangan bulat positif | `Todo id must be a positive integer` |

Semua kesalahan pada satu request dikumpulkan sekaligus. Contoh response `400`:

```json
{
  "error": {
    "message": "Title is required, Completed must be true or false",
    "details": [
      { "field": "title", "message": "Title is required" },
      { "field": "completed", "message": "Completed must be true or false" }
    ]
  }
}
```

## Environment variable

**`backend/.env`**

| Variabel | Default | Keterangan |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `PORT` | `4000` | Port API |
| `DATABASE_URL` | – (wajib) | Connection string PostgreSQL |
| `CORS_ORIGIN` | `http://localhost:5173` | Daftar origin frontend, dipisah koma |

**`frontend/.env`** (opsional)

| Variabel | Keterangan |
| --- | --- |
| `VITE_API_URL` | URL API jika berbeda origin, mis. `https://api.example.com/api`. Kosongkan untuk memakai `/api`. |

## Menambah fitur

Contoh: menambah fitur `users`.

1. **Tabel:** tambahkan `CREATE TABLE users (...)` di `backend/database/schema.sql`, lalu `npm run db:reset` (atau jalankan perintah SQL-nya langsung lewat pgAdmin/psql).
2. **Types:** buat `backend/src/types/user.ts` dan `frontend/src/types/user.ts` dengan bentuk data yang sama. Di frontend, tambahkan `export * from './user';` ke `src/types/index.ts`.
3. **Backend:** salin pola `backend/src/modules/todos/`:
   - `users.validation.ts` untuk validasi input (fungsi biasa yang melempar `HttpError(400, ...)`)
   - `users.repository.ts` untuk query SQL
   - `users.routes.ts` untuk router Express

   Lalu daftarkan router-nya di `backend/src/app.ts`.
4. **Frontend:** tambahkan method di `src/lib/api.ts`, hook di `src/hooks/`, dan komponen di `src/components/`. Untuk tampilan, gunakan class Bootstrap langsung di JSX; tambahkan CSS sendiri di `src/index.css` hanya jika tidak ada utility Bootstrap yang cocok.

Jika port frontend diubah (di `frontend/vite.config.ts`), sesuaikan juga `CORS_ORIGIN` di `backend/.env`.

## Build production

- **Backend:** `npm run build` lalu `npm start` (set env dan pastikan `schema.sql` sudah dijalankan di database server).
- **Frontend:** `npm run build` menghasilkan file statis di `dist/` yang bisa di-deploy ke hosting statis mana pun (Nginx, Vercel, Netlify, dll.). Set `VITE_API_URL` saat build jika API berada di domain lain, atau arahkan `/api` ke backend lewat reverse proxy.
