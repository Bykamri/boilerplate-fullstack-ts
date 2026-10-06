# 5. Tutorial: mengupdate fitur yang sudah ada

**Tujuan:** menambah **prioritas** (`low` / `medium` / `high`) ke setiap todo.

**Hasil akhir:**
- Form tambah todo memiliki dropdown prioritas.
- Setiap todo di daftar menampilkan badge prioritas berwarna.
- API menerima dan memvalidasi field `priority`.

Tutorial ini menyentuh semua lapisan dengan urutan yang sama seperti saat mengubah fitur apa pun: **database → types → backend → frontend**.

| # | File | Perubahan |
| --- | --- | --- |
| 1 | `backend/database/schema.sql` | Kolom `priority` |
| 2 | `backend/src/types/todo.ts` | Type `TodoPriority`, field `priority` |
| 3 | `backend/src/modules/todos/todos.validation.ts` | Validasi `priority` |
| 4 | `backend/src/modules/todos/todos.repository.ts` | Kolom di `SELECT`, `INSERT`, `UPDATE` |
| 5 | `frontend/src/types/todo.ts` | Sama dengan langkah 2 |
| 6 | `frontend/src/constants.ts` | Label & warna badge |
| 7 | `frontend/src/hooks/useTodos.ts` | `add()` menerima object |
| 8 | `frontend/src/hooks/useTodoForm.ts` | State `priority` |
| 9 | `frontend/src/components/TodoForm.tsx` | Dropdown |
| 10 | `frontend/src/components/TodoList.tsx` | Badge |

---

## Langkah 1: database

Di `backend/database/schema.sql`, tambahkan baris `priority` di bawah `completed`:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  priority    VARCHAR(10)  NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
```

`CHECK (...)` membuat database ikut menolak nilai selain ketiga pilihan, sebagai pengaman terakhir di samping validasi backend.

Lalu terapkan ke database. Pilih salah satu:

- **Docker, data boleh hilang:** `npm run db:reset` (di folder `backend`).
- **Data ingin dipertahankan** (Docker / Laragon / pgAdmin): jalankan perintah ini di HeidiSQL / pgAdmin / psql:

  ```sql
  ALTER TABLE todos
    ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high'));
  ```

  Semua todo lama otomatis mendapat prioritas `medium`.

## Langkah 2: types backend

Ganti seluruh isi `backend/src/types/todo.ts`:

```ts
/** Allowed values for the `priority` column. */
export type TodoPriority = 'low' | 'medium' | 'high';

/** A row from the `todos` table, as returned by the API. */
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: TodoPriority;
  createdAt: Date;
  updatedAt: Date;
}

/** Body for POST /api/todos */
export interface CreateTodoInput {
  title: string;
  priority?: TodoPriority;
}

/** Body for PATCH /api/todos/:id (send at least one field) */
export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  priority?: TodoPriority;
}
```

`priority?` (dengan tanda tanya) artinya opsional. Jika tidak dikirim, database memakai default `medium`.

## Langkah 3: validasi

Di `backend/src/modules/todos/todos.validation.ts`:

**a.** Tambahkan `TodoPriority` ke import:

```ts
import type { CreateTodoInput, TodoPriority, UpdateTodoInput } from '../../types/todo.js';
```

**b.** Di bawah `export const TITLE_MAX_LENGTH = 200;`, tambahkan daftar pilihan dan fungsi validasinya:

```ts
const PRIORITIES: TodoPriority[] = ['low', 'medium', 'high'];

/** Returns the priority if it is one of PRIORITIES, otherwise records an error. */
function validatePriority(value: unknown, errors: FieldError[]): TodoPriority | undefined {
  if (typeof value === 'string' && PRIORITIES.includes(value as TodoPriority)) {
    return value as TodoPriority;
  }
  errors.push({ field: 'priority', message: `Priority must be one of: ${PRIORITIES.join(', ')}` });
  return undefined;
}
```

**c.** Ganti fungsi `validateCreateTodo`:

```ts
/** Body for POST /api/todos: `{ title: string, priority?: TodoPriority }` */
export function validateCreateTodo(body: unknown): CreateTodoInput {
  const data = requireObject(body);
  const errors: FieldError[] = [];

  const title = validateTitle(data.title, errors);
  const priority =
    data.priority === undefined ? undefined : validatePriority(data.priority, errors);

  assertNoErrors(errors);
  // Safe: if title were missing or invalid, assertNoErrors would have thrown.
  return { title: title as string, priority };
}
```

**d.** Ganti fungsi `validateUpdateTodo`:

```ts
/** Body for PATCH /api/todos/:id: `{ title?, completed?, priority? }` (at least one). */
export function validateUpdateTodo(body: unknown): UpdateTodoInput {
  const data = requireObject(body);
  const errors: FieldError[] = [];
  const input: UpdateTodoInput = {};

  if (data.title === undefined && data.completed === undefined && data.priority === undefined) {
    errors.push({
      field: 'body',
      message: 'Provide at least one field to update: title, completed or priority',
    });
  }

  if (data.title !== undefined) {
    input.title = validateTitle(data.title, errors);
  }

  if (data.completed !== undefined) {
    if (typeof data.completed === 'boolean') {
      input.completed = data.completed;
    } else {
      errors.push({ field: 'completed', message: 'Completed must be true or false' });
    }
  }

  if (data.priority !== undefined) {
    input.priority = validatePriority(data.priority, errors);
  }

  assertNoErrors(errors);
  return input;
}
```

## Langkah 4: repository

Di `backend/src/modules/todos/todos.repository.ts`, ada tiga perubahan.

**a.** Tambahkan `priority` ke `COLUMNS`, supaya ikut dikirim di setiap response:

```ts
const COLUMNS = `id, title, completed, priority, created_at AS "createdAt", updated_at AS "updatedAt"`;
```

**b.** Ganti method `create`:

```ts
  async create(input: CreateTodoInput): Promise<Todo> {
    const { rows } = await pool.query<Todo>(
      `INSERT INTO todos (title, priority) VALUES ($1, $2) RETURNING ${COLUMNS}`,
      [input.title, input.priority ?? 'medium'],
    );
    return rows[0];
  },
```

**c.** Ganti method `update`:

```ts
  async update(id: number, input: UpdateTodoInput): Promise<Todo | null> {
    const { rows } = await pool.query<Todo>(
      `UPDATE todos
          SET title      = COALESCE($2, title),
              completed  = COALESCE($3, completed),
              priority   = COALESCE($4, priority),
              updated_at = now()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id, input.title ?? null, input.completed ?? null, input.priority ?? null],
    );
    return rows[0] ?? null;
  },
```

`COALESCE($4, priority)` artinya: pakai nilai baru jika dikirim, jika `null` pertahankan nilai lama. Inilah yang membuat PATCH bisa mengubah sebagian field saja.

### Cek backend

Server dev restart otomatis. Coba (Git Bash; untuk PowerShell lihat [Menguji API](03-backend.md#menguji-api)):

```bash
curl -X POST http://localhost:4000/api/todos -H "Content-Type: application/json" -d '{"title":"Urgent","priority":"high"}'
```

Hasilnya `201` dengan `"priority":"high"`.

```bash
curl -X POST http://localhost:4000/api/todos -H "Content-Type: application/json" -d '{"title":"Salah","priority":"urgent"}'
```

Hasilnya `400` dengan pesan `Priority must be one of: low, medium, high`.

```bash
curl -X PATCH http://localhost:4000/api/todos/1 -H "Content-Type: application/json" -d '{"priority":"low"}'
```

Hasilnya `200`, dan hanya `priority` yang berubah.

## Langkah 5: types frontend

Ganti seluruh isi `frontend/src/types/todo.ts`. Bedanya dengan backend hanya tipe tanggal (`string`) dan adanya `TodoFilter`:

```ts
/**
 * Same shape as backend/src/types/todo.ts.
 * Dates arrive as ISO strings because JSON has no Date type.
 */

/** Allowed values for the `priority` column. */
export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: TodoPriority;
  createdAt: string;
  updatedAt: string;
}

/** Body for POST /api/todos */
export interface CreateTodoInput {
  title: string;
  priority?: TodoPriority;
}

/** Body for PATCH /api/todos/:id (send at least one field) */
export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
  priority?: TodoPriority;
}

/** Which todos are shown in the list (UI only, not sent to the API). */
export type TodoFilter = 'all' | 'active' | 'completed';
```

## Langkah 6: label & warna

Di `frontend/src/constants.ts`, tambahkan `TodoPriority` ke import:

```ts
import type { HealthStatus, TodoFilter, TodoPriority } from './types';
```

Lalu tambahkan di bawah `TODO_FILTERS`:

```ts
/** `badge` is a Bootstrap class: https://getbootstrap.com/docs/5.3/components/badge/ */
export const PRIORITY_OPTIONS: ReadonlyArray<{
  value: TodoPriority;
  label: string;
  badge: string;
}> = [
  { value: 'low', label: 'Low', badge: 'text-bg-secondary' },
  { value: 'medium', label: 'Medium', badge: 'text-bg-primary' },
  { value: 'high', label: 'High', badge: 'text-bg-danger' },
];
```

Satu daftar ini dipakai dua kali: untuk `<option>` di dropdown dan untuk badge di daftar.

## Langkah 7: `useTodos`

Di `frontend/src/hooks/useTodos.ts`, `add()` sekarang menerima object `{ title, priority }`, bukan string saja.

Ubah import types:

```ts
import type { CreateTodoInput, Todo, TodoFilter } from '../types';
```

Ganti fungsi `add`:

```ts
  const add = useCallback(async (input: CreateTodoInput): Promise<boolean> => {
    try {
      const todo = await api.todos.create({ ...input, title: input.title.trim() });
      setTodos((prev) => [todo, ...prev]);
      setError(null);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  }, []);
```

## Langkah 8: `useTodoForm`

Ganti seluruh isi `frontend/src/hooks/useTodoForm.ts`:

```ts
import { useState, type FormEvent } from 'react';
import type { CreateTodoInput, TodoPriority } from '../types';

/** Controlled "new todo" form state. */
export function useTodoForm(onAdd: (input: CreateTodoInput) => Promise<boolean>) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onAdd({ title, priority });
    setSubmitting(false);
    if (ok) {
      setTitle('');
      setPriority('medium');
    }
  }

  return {
    title,
    setTitle,
    priority,
    setPriority,
    submitting,
    canSubmit: title.trim().length > 0,
    handleSubmit,
  };
}
```

## Langkah 9: dropdown di form

Ganti seluruh isi `frontend/src/components/TodoForm.tsx`. Yang baru hanya `<select>` di dalam `input-group`:

```tsx
import { PRIORITY_OPTIONS } from '../constants';
import { useTodoForm } from '../hooks/useTodoForm';
import type { CreateTodoInput, TodoPriority } from '../types';

export function TodoForm({ onAdd }: { onAdd: (input: CreateTodoInput) => Promise<boolean> }) {
  const { title, setTitle, priority, setPriority, submitting, canSubmit, handleSubmit } =
    useTodoForm(onAdd);

  return (
    <form className="p-3" onSubmit={handleSubmit}>
      <label htmlFor="new-todo" className="visually-hidden">
        New todo
      </label>
      <div className="input-group">
        <input
          id="new-todo"
          className="form-control"
          placeholder="What needs to be done?"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          autoComplete="off"
        />
        <select
          className="form-select"
          style={{ maxWidth: 120 }}
          aria-label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TodoPriority)}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="btn btn-primary px-4" type="submit" disabled={!canSubmit || submitting}>
          {submitting && (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          )}
          Add
        </button>
      </div>
    </form>
  );
}
```

`TodosPanel.tsx` tidak perlu diubah: ia tetap meneruskan `todos.add` ke `onAdd`, dan TypeScript memastikan tipenya cocok.

## Langkah 10: badge di daftar

Di `frontend/src/components/TodoList.tsx`:

**a.** Tambahkan import di baris paling atas:

```tsx
import { PRIORITY_OPTIONS } from '../constants';
```

**b.** Tambahkan komponen kecil ini di **paling bawah** file:

```tsx
function PriorityBadge({ priority }: { priority: Todo['priority'] }) {
  const option = PRIORITY_OPTIONS.find((item) => item.value === priority);
  if (!option) return null;
  return <span className={`badge rounded-pill ${option.badge}`}>{option.label}</span>;
}
```

**c.** Pakai di dalam `<li>`, tepat **sebelum** tombol Delete:

```tsx
          </div>
          <PriorityBadge priority={todo.priority} />
          <button
            className="btn btn-sm btn-outline-danger todo-delete"
```

## Selesai: cek di browser

1. Buka http://localhost:5173.
2. Ketik judul, pilih **High**, klik **Add**.
3. Todo baru muncul dengan badge merah **High**. Todo lama menampilkan **Medium**.

Jika ada error TypeScript di editor atau terminal, biasanya ada satu file yang terlewat. Jalankan `npm run typecheck` di `backend` dan `frontend` untuk melihat file dan barisnya.

## Latihan

1. **Ubah prioritas dari daftar.** Ganti badge dengan `<select className="form-select form-select-sm">`. Saat berubah, panggil `api.todos.update(todo.id, { priority })` lewat fungsi baru di `useTodos`. Backend tidak perlu diubah.
2. **Urutkan berdasarkan prioritas.** Di `findAll`, ubah `ORDER BY` menjadi `ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC`.
3. **Filter prioritas.** Tambahkan filter "High only" di `FilterBar`, dengan memperluas `TodoFilter` dan `visibleTodos` di `useTodos`.
4. **Tanggal tenggat.** Ulangi semua langkah untuk kolom `due_date DATE` (opsional, boleh `NULL`). Di frontend gunakan `<input type="date" className="form-control">`.
