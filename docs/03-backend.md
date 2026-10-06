# 3. Panduan backend

Semua path di halaman ini relatif terhadap folder `backend/`.

## Anatomi satu modul

Setiap fitur punya satu folder di `src/modules/` berisi tiga file, plus satu file types:

```
src/
├── types/todo.ts                      ← bentuk data (Todo, CreateTodoInput, UpdateTodoInput)
└── modules/todos/
    ├── todos.routes.ts                ← URL & HTTP method → memanggil validation & repository
    ├── todos.validation.ts            ← memeriksa input dari client
    └── todos.repository.ts            ← query SQL ke database
```

Aturannya:

- **Routes** tidak menulis SQL dan tidak memeriksa input secara manual. Tugasnya hanya menghubungkan.
- **Validation** tidak tahu apa-apa tentang database.
- **Repository** tidak tahu apa-apa tentang HTTP (`req`, `res`, status code).

Dengan pembagian ini, saat ada bug kita tahu harus melihat ke mana: input salah → validation, data salah → repository, URL/status salah → routes.

## Routes

```ts
// src/modules/todos/todos.routes.ts
todosRouter.post('/', async (req, res) => {
  const input = validateCreateTodo(req.body); // 1. periksa input
  const todo = await todosRepository.create(input); // 2. simpan ke database
  res.status(201).json(todo); // 3. kirim hasil
});
```

- Router didaftarkan di `src/app.ts` dengan prefix, misalnya `app.use('/api/todos', todosRouter)`. Jadi `'/'` di router berarti `/api/todos`, dan `'/:id'` berarti `/api/todos/123`.
- Handler boleh `async`. **Tidak perlu `try/catch`**: Express 5 otomatis meneruskan error ke error handler.
- Untuk mengirim error, cukup `throw new HttpError(status, message)`.

| Status | Kapan dipakai | Contoh di kode |
| --- | --- | --- |
| `200` | Berhasil, ada data | `res.json(todo)` |
| `201` | Berhasil membuat data baru | `res.status(201).json(todo)` |
| `204` | Berhasil, tanpa isi (biasanya DELETE) | `res.status(204).end()` |
| `400` | Input dari client salah | dilempar oleh fungsi validasi |
| `404` | Data atau URL tidak ditemukan | `throw new HttpError(404, 'Todo not found')` |
| `500` | Bug / error tak terduga di server | otomatis dari error handler |

> **Urutan route penting.** Express mencocokkan route dari atas ke bawah. Route spesifik seperti `GET /stats` harus ditulis **sebelum** `GET /:id`, karena jika tidak, `/stats` akan dianggap sebagai `:id = "stats"`.

## Validasi

Validasi ditulis manual, tanpa library. Helper yang dipakai bersama ada di `src/lib/validation.ts`:

| Helper | Fungsi |
| --- | --- |
| `requireObject(body)` | Memastikan body berupa object JSON `{ ... }`. Jika bukan, melempar 400. |
| `assertNoErrors(errors)` | Jika array `errors` tidak kosong, melempar **satu** error 400 berisi semua kesalahan. |
| `parseId(value, label)` | Mengubah `req.params.id` menjadi angka. Hanya bilangan bulat positif yang diterima. |

Pola setiap fungsi validasi selalu sama:

```ts
export function validateSesuatu(body: unknown): SesuatuInput {
  const data = requireObject(body); // 1. pastikan object
  const errors: FieldError[] = []; // 2. tampung semua kesalahan

  // 3. periksa setiap field, push ke `errors` jika salah
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (name.length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  assertNoErrors(errors); // 4. lempar 400 jika ada kesalahan
  return { name }; // 5. kembalikan data yang sudah bersih
}
```

Kenapa kesalahan dikumpulkan dulu, tidak langsung dilempar? Supaya client menerima **semua** kesalahan sekaligus, tidak satu per satu.

### Aturan validasi todo saat ini

Lihat `src/modules/todos/todos.validation.ts`:

| Aturan | Pesan error |
| --- | --- |
| Body harus object JSON | `Request body must be a JSON object` |
| `title` wajib, string, tidak kosong setelah di-trim | `Title is required` / `Title must be a string` |
| `title` maksimal 200 karakter | `Title must be at most 200 characters` |
| `completed` harus boolean | `Completed must be true or false` |
| PATCH minimal berisi `title` atau `completed` | `Provide at least one field to update: title or completed` |
| `:id` harus bilangan bulat positif | `Todo id must be a positive integer` |
| Body bukan JSON yang valid | `Invalid JSON body` (dari error handler) |

Contoh response `400` ketika ada dua kesalahan sekaligus:

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

### Contoh: mengubah batas panjang title

Misalnya title todo maksimal 100 karakter, bukan 200:

1. `src/modules/todos/todos.validation.ts`: ubah `TITLE_MAX_LENGTH = 200` menjadi `100`.
2. `database/schema.sql`: ubah `VARCHAR(200)` menjadi `VARCHAR(100)`, lalu terapkan ke database (lihat [Mengubah database](#mengubah-database-tanpa-migrasi)).
3. `frontend/src/components/TodoForm.tsx`: ubah `maxLength={200}` menjadi `maxLength={100}`.

Langkah 1 sudah cukup untuk keamanan. Langkah 2 dan 3 menjaga agar database dan tampilan konsisten.

### Cek tipe yang sering dipakai

| Ingin memastikan | Kode |
| --- | --- |
| String tidak kosong | `typeof v === 'string' && v.trim().length > 0` |
| Boolean | `typeof v === 'boolean'` |
| Angka bulat | `typeof v === 'number' && Number.isInteger(v)` |
| Angka dalam rentang | `typeof v === 'number' && v >= 1 && v <= 5` |
| Salah satu dari pilihan | `['low', 'medium', 'high'].includes(v as string)` |
| Format email (sederhana) | `typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)` |
| Field opsional | periksa hanya jika `v !== undefined` |

## Repository (query SQL)

Semua query memakai `pool.query(sql, params)` dari `src/db/pool.ts`.

```ts
const { rows } = await pool.query<Todo>(
  `SELECT ${COLUMNS} FROM todos WHERE id = $1`,
  [id], // $1 diganti nilai ini secara aman
);
```

**Selalu gunakan placeholder `$1`, `$2`, …** untuk nilai dari client. Jangan pernah menyambung string seperti `` `WHERE id = ${id}` ``, karena itu membuka celah **SQL injection**.

| Kebutuhan | Pola | Hasil |
| --- | --- | --- |
| Ambil banyak baris | `SELECT ... ORDER BY ...` | `rows` |
| Ambil satu baris | `SELECT ... WHERE id = $1` | `rows[0] ?? null` |
| Tambah | `INSERT ... RETURNING ${COLUMNS}` | `rows[0]` |
| Ubah | `UPDATE ... WHERE id = $1 RETURNING ${COLUMNS}` | `rows[0] ?? null` (null = tidak ditemukan) |
| Ubah sebagian (PATCH) | `SET kolom = COALESCE($2, kolom)` lalu kirim `null` untuk field yang tidak diubah | |
| Hapus | `DELETE ... WHERE id = $1` | `rowCount > 0` (false = tidak ditemukan) |

`COLUMNS` berisi daftar kolom plus alias `snake_case → camelCase`, supaya hasil query langsung cocok dengan type TypeScript:

```ts
const COLUMNS = `id, title, completed, created_at AS "createdAt", updated_at AS "updatedAt"`;
```

Tanda kutip ganda pada `"createdAt"` wajib. Tanpa kutip, PostgreSQL mengubahnya menjadi huruf kecil `createdat`.

## Error

| Mau | Caranya |
| --- | --- |
| Mengirim error dengan status tertentu | `throw new HttpError(404, 'Todo not found')` |
| Mengirim error beserta detail | `throw new HttpError(400, 'Pesan', [{ field, message }])` |
| Error tak terduga (bug, database mati) | Biarkan saja. Error handler mengirim `500`; pesan aslinya hanya ditampilkan saat `NODE_ENV=development`. |

Semua error dikirim dengan bentuk `ErrorResponse` (`src/types/api.ts`):

```json
{ "error": { "message": "Todo not found" } }
```

## Menambah endpoint di modul yang sudah ada

Contoh: `GET /api/todos/:id` untuk mengambil satu todo.

**1. Repository**: tambahkan method di `todosRepository`:

```ts
  async findById(id: number): Promise<Todo | null> {
    const { rows } = await pool.query<Todo>(`SELECT ${COLUMNS} FROM todos WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },
```

**2. Route**: tambahkan di `todos.routes.ts`:

```ts
todosRouter.get('/:id', async (req, res) => {
  const id = parseTodoId(req.params.id);
  const todo = await todosRepository.findById(id);
  if (!todo) throw new HttpError(404, 'Todo not found');
  res.json(todo);
});
```

**3. Coba**: buka http://localhost:4000/api/todos/1 di browser.

**4. (Opsional) Frontend**: tambahkan `get: (id: number) => request<Todo>(`/todos/${id}`)` di `api.todos` pada `frontend/src/lib/api.ts`.

## Mengubah database tanpa migrasi

Proyek ini **tidak memakai migrasi**. Aturannya sederhana:

> `database/schema.sql` selalu berisi struktur **terbaru dan lengkap** semua tabel.

Setelah mengubah `schema.sql`, terapkan perubahannya ke database dengan salah satu cara:

| Cara | Data lama | Langkah |
| --- | --- | --- |
| **Reset** | Hilang | Docker: `npm run db:reset`. Laragon/pgAdmin: `DROP TABLE nama_tabel;` lalu jalankan ulang `schema.sql` dan `seed.sql`. |
| **ALTER TABLE** | Tetap ada | Jalankan perintah `ALTER TABLE` yang sesuai di HeidiSQL / pgAdmin / psql. |

Untuk praktikum, **reset** biasanya paling mudah. Gunakan `ALTER TABLE` jika data yang sudah ada perlu dipertahankan.

Perintah `ALTER TABLE` yang sering dipakai:

```sql
-- Tambah kolom (DEFAULT wajib jika NOT NULL dan tabel sudah berisi data)
ALTER TABLE todos ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium';

-- Hapus kolom
ALTER TABLE todos DROP COLUMN priority;

-- Ganti nama kolom
ALTER TABLE todos RENAME COLUMN title TO name;

-- Ganti tipe / panjang kolom
ALTER TABLE todos ALTER COLUMN title TYPE VARCHAR(100);
```

Untuk tabel baru, cukup jalankan perintah `CREATE TABLE`-nya saja (bagian yang baru ditambahkan ke `schema.sql`).

### Checklist setelah mengubah kolom

- [ ] `database/schema.sql` diperbarui
- [ ] Perubahan diterapkan ke database (reset atau `ALTER TABLE`)
- [ ] `src/types/<fitur>.ts` diperbarui
- [ ] `COLUMNS`, `INSERT`, dan `UPDATE` di repository diperbarui
- [ ] Fungsi validasi diperbarui (jika kolom bisa diisi oleh client)
- [ ] `frontend/src/types/<fitur>.ts` diperbarui dengan field yang sama
- [ ] Tampilan frontend diperbarui

Contoh lengkapnya ada di [Tutorial 05: mengupdate fitur](05-tutorial-update-fitur.md).

## Menambah environment variable

Contoh: `APP_NAME`.

1. Tambahkan ke `.env.example` (supaya orang lain tahu variabel ini ada) dan ke `.env`:

   ```
   APP_NAME=Todo App
   ```

2. Baca di `src/config/env.ts`, lalu masukkan ke object `env`:

   ```ts
   const appName = process.env.APP_NAME || 'Todo App';

   export const env = {
     // ...yang sudah ada
     APP_NAME: appName,
   };
   ```

3. Pakai di mana saja dengan `import { env } from '../config/env.js'` lalu `env.APP_NAME`.

Jangan membaca `process.env` langsung di file lain. Selalu lewat `env`, supaya semua pengecekan ada di satu tempat.

## Menguji API

Backend bisa diuji tanpa frontend.

**Browser**: untuk request `GET`, cukup buka URL-nya, misalnya http://localhost:4000/api/todos.

**REST client**: ekstensi VS Code *Thunder Client* / *REST Client*, atau aplikasi Postman / Insomnia. Isi method, URL, dan body JSON, lalu set header `Content-Type: application/json`.

**Git Bash / macOS / Linux (curl)**

```bash
curl http://localhost:4000/api/todos
```

```bash
curl -X POST http://localhost:4000/api/todos -H "Content-Type: application/json" -d '{"title":"Belajar Express"}'
```

```bash
curl -X PATCH http://localhost:4000/api/todos/1 -H "Content-Type: application/json" -d '{"completed":true}'
```

```bash
curl -X DELETE http://localhost:4000/api/todos/1
```

**PowerShell**: di Windows PowerShell, `curl` adalah alias perintah lain. Gunakan `Invoke-RestMethod`:

```powershell
Invoke-RestMethod http://localhost:4000/api/todos
```

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/todos -ContentType 'application/json' -Body '{"title":"Belajar Express"}'
```

Terminal backend menampilkan log setiap request (dari `morgan`), misalnya `POST /api/todos 201 12.345 ms`.

## Checklist: menambah fitur baru di backend

- [ ] `CREATE TABLE` di `database/schema.sql` dan diterapkan ke database
- [ ] `src/types/<fitur>.ts`
- [ ] `src/modules/<fitur>/<fitur>.validation.ts`
- [ ] `src/modules/<fitur>/<fitur>.repository.ts`
- [ ] `src/modules/<fitur>/<fitur>.routes.ts`
- [ ] Router didaftarkan di `src/app.ts`
- [ ] Diuji dengan browser / curl / REST client

Contoh lengkapnya ada di [Tutorial 06: menambah fitur baru](06-tutorial-fitur-baru.md).
