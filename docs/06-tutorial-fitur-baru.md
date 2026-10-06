# 6. Tutorial: menambah fitur baru

**Tujuan:** membuat fitur **Notes** (catatan) dari nol, dengan CRUD lengkap: lihat, tambah, edit, hapus.

**Hasil akhir:**
- Endpoint baru `/api/notes`.
- Halaman memiliki tab **Todos** dan **Notes**.
- Di tab Notes, pengguna bisa menambah catatan, mengedit, dan menghapusnya.

| Method | Endpoint | Body | Response |
| --- | --- | --- | --- |
| GET | `/api/notes` | – | `200 Note[]` |
| GET | `/api/notes/:id` | – | `200 Note` / `404` |
| POST | `/api/notes` | `{ title, content? }` | `201 Note` |
| PUT | `/api/notes/:id` | `{ title, content? }` | `200 Note` / `404` |
| DELETE | `/api/notes/:id` | – | `204` / `404` |

> Todo memakai **PATCH** (ubah sebagian field). Notes memakai **PUT** (kirim semua field setiap kali menyimpan), supaya validasinya cukup satu fungsi untuk tambah dan edit.

File yang dibuat atau diubah:

```
backend/
├── database/schema.sql                    ← ubah: tabel notes
└── src/
    ├── types/note.ts                      ← baru
    ├── modules/notes/
    │   ├── notes.validation.ts            ← baru
    │   ├── notes.repository.ts            ← baru
    │   └── notes.routes.ts                ← baru
    └── app.ts                             ← ubah: daftarkan router
frontend/src/
├── types/note.ts                          ← baru
├── types/index.ts                         ← ubah: export
├── lib/api.ts                             ← ubah: api.notes
├── hooks/useNotes.ts                      ← baru
├── components/NoteForm.tsx                ← baru
├── components/NoteList.tsx                ← baru
├── components/NotesPanel.tsx              ← baru
└── App.tsx                                ← ubah: tab
```

---

# Bagian A: backend

Semua path di bagian ini relatif terhadap folder `backend/`.

## Langkah 1: tabel

Tambahkan di **paling bawah** `database/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS notes (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(100) NOT NULL,
  content     TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
```

Lalu terapkan ke database:

- **Docker:** `npm run db:reset` (data todo kembali ke data contoh), **atau**
- **Docker / Laragon / pgAdmin:** jalankan perintah `CREATE TABLE` di atas saja lewat HeidiSQL / pgAdmin / psql. Data todo tetap aman.

## Langkah 2: types

Buat `src/types/note.ts`:

```ts
/** A row from the `notes` table, as returned by the API. */
export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Body for POST /api/notes and PUT /api/notes/:id */
export interface NoteInput {
  title: string;
  content: string;
}
```

## Langkah 3: validasi

Buat folder `src/modules/notes/`, lalu file `src/modules/notes/notes.validation.ts`:

```ts
import { assertNoErrors, parseId, requireObject } from '../../lib/validation.js';
import type { FieldError } from '../../types/api.js';
import type { NoteInput } from '../../types/note.js';

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 5000;

export function parseNoteId(value: unknown): number {
  return parseId(value, 'Note id');
}

/** Body for POST and PUT: `{ title: string, content?: string }` */
export function validateNote(body: unknown): NoteInput {
  const data = requireObject(body);
  const errors: FieldError[] = [];

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (title.length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.push({
      field: 'title',
      message: `Title must be at most ${TITLE_MAX_LENGTH} characters`,
    });
  }

  // `content` is optional and defaults to an empty string.
  const content = data.content ?? '';
  if (typeof content !== 'string') {
    errors.push({ field: 'content', message: 'Content must be a string' });
  } else if (content.length > CONTENT_MAX_LENGTH) {
    errors.push({
      field: 'content',
      message: `Content must be at most ${CONTENT_MAX_LENGTH} characters`,
    });
  }

  assertNoErrors(errors);
  return { title, content: content as string };
}
```

`requireObject`, `assertNoErrors`, dan `parseId` berasal dari `src/lib/validation.ts`. Helper ini dipakai bersama semua modul, jadi tidak perlu ditulis ulang.

## Langkah 4: repository

Buat `src/modules/notes/notes.repository.ts`:

```ts
import { pool } from '../../db/pool.js';
import type { Note, NoteInput } from '../../types/note.js';

const COLUMNS = `id, title, content, created_at AS "createdAt", updated_at AS "updatedAt"`;

export const notesRepository = {
  async findAll(): Promise<Note[]> {
    const { rows } = await pool.query<Note>(
      `SELECT ${COLUMNS} FROM notes ORDER BY updated_at DESC, id DESC`,
    );
    return rows;
  },

  async findById(id: number): Promise<Note | null> {
    const { rows } = await pool.query<Note>(`SELECT ${COLUMNS} FROM notes WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async create(input: NoteInput): Promise<Note> {
    const { rows } = await pool.query<Note>(
      `INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING ${COLUMNS}`,
      [input.title, input.content],
    );
    return rows[0];
  },

  async update(id: number, input: NoteInput): Promise<Note | null> {
    const { rows } = await pool.query<Note>(
      `UPDATE notes
          SET title = $2, content = $3, updated_at = now()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id, input.title, input.content],
    );
    return rows[0] ?? null;
  },

  async remove(id: number): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
```

## Langkah 5: routes

Buat `src/modules/notes/notes.routes.ts`:

```ts
import { Router } from 'express';
import { HttpError } from '../../lib/http-error.js';
import { notesRepository } from './notes.repository.js';
import { parseNoteId, validateNote } from './notes.validation.js';

export const notesRouter = Router();

// GET /api/notes
notesRouter.get('/', async (_req, res) => {
  res.json(await notesRepository.findAll());
});

// GET /api/notes/:id
notesRouter.get('/:id', async (req, res) => {
  const id = parseNoteId(req.params.id);
  const note = await notesRepository.findById(id);
  if (!note) throw new HttpError(404, 'Note not found');
  res.json(note);
});

// POST /api/notes
notesRouter.post('/', async (req, res) => {
  const input = validateNote(req.body);
  const note = await notesRepository.create(input);
  res.status(201).json(note);
});

// PUT /api/notes/:id
notesRouter.put('/:id', async (req, res) => {
  const id = parseNoteId(req.params.id);
  const input = validateNote(req.body);
  const note = await notesRepository.update(id, input);
  if (!note) throw new HttpError(404, 'Note not found');
  res.json(note);
});

// DELETE /api/notes/:id
notesRouter.delete('/:id', async (req, res) => {
  const id = parseNoteId(req.params.id);
  const deleted = await notesRepository.remove(id);
  if (!deleted) throw new HttpError(404, 'Note not found');
  res.status(204).end();
});
```

Lalu daftarkan di `src/app.ts`. Tambahkan import:

```ts
import { notesRouter } from './modules/notes/notes.routes.js';
```

dan satu baris di bawah router todos:

```ts
  app.use('/api/todos', todosRouter);
  app.use('/api/notes', notesRouter);
```

### Cek backend

Buka http://localhost:4000/api/notes di browser. Hasilnya `[]` (array kosong).

Coba tambah dan ubah data (Git Bash; untuk PowerShell lihat [Menguji API](03-backend.md#menguji-api)):

```bash
curl -X POST http://localhost:4000/api/notes -H "Content-Type: application/json" -d '{"title":"Catatan pertama","content":"Halo"}'
```

```bash
curl -X PUT http://localhost:4000/api/notes/1 -H "Content-Type: application/json" -d '{"title":"Sudah diedit","content":"Isi baru"}'
```

```bash
curl -X POST http://localhost:4000/api/notes -H "Content-Type: application/json" -d '{"title":"","content":5}'
```

Request terakhir menghasilkan `400` dengan pesan `Title is required, Content must be a string`.

**Backend selesai.** Frontend bisa dikerjakan oleh orang lain secara paralel, cukup dengan berpegang pada tabel endpoint dan types di atas.

---

# Bagian B: frontend

Semua path di bagian ini relatif terhadap folder `frontend/`.

## Langkah 6: types & API

Buat `src/types/note.ts`. Field-nya sama dengan backend, hanya tanggal bertipe `string`:

```ts
/** Same shape as backend/src/types/note.ts (dates arrive as ISO strings). */
export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Body for POST /api/notes and PUT /api/notes/:id */
export interface NoteInput {
  title: string;
  content: string;
}
```

Tambahkan baris ini di **paling bawah** `src/types/index.ts`:

```ts
export * from './note';
```

Di `src/lib/api.ts`, tambahkan `Note` dan `NoteInput` ke import di bagian atas:

```ts
import type {
  CreateTodoInput,
  ErrorResponse,
  FieldError,
  HealthResponse,
  Note,
  NoteInput,
  Todo,
  UpdateTodoInput,
} from '../types';
```

Lalu tambahkan `notes` di dalam object `api`, setelah `todos: { ... },`:

```ts
  notes: {
    list: () => request<Note[]>('/notes'),
    create: (input: NoteInput) =>
      request<Note>('/notes', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: number, input: NoteInput) =>
      request<Note>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    remove: (id: number) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
  },
```

## Langkah 7: hook

Buat `src/hooks/useNotes.ts`. Hook ini menyimpan daftar notes dan menyediakan aksi `save` dan `remove`:

```ts
import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../lib/api';
import type { Note, NoteInput } from '../types';

/** State + actions for the notes feature. */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all notes once, when the component first appears.
  useEffect(() => {
    api.notes
      .list()
      .then(setNotes)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  /** Creates a note, or updates one when `id` is given. Returns true on success. */
  async function save(input: NoteInput, id?: number): Promise<boolean> {
    try {
      if (id === undefined) {
        const created = await api.notes.create(input);
        setNotes((prev) => [created, ...prev]);
      } else {
        const updated = await api.notes.update(id, input);
        setNotes((prev) => [updated, ...prev.filter((note) => note.id !== id)]);
      }
      setError(null);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  }

  async function remove(id: number) {
    try {
      await api.notes.remove(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return { notes, loading, error, dismissError: () => setError(null), save, remove };
}
```

Note yang baru diedit dipindah ke paling atas, sama dengan urutan dari backend (`ORDER BY updated_at DESC`).

## Langkah 8: komponen

### `src/components/NoteForm.tsx`

Satu form untuk dua keperluan: menambah (saat `editing` bernilai `null`) dan mengedit.

```tsx
import { useState, type FormEvent } from 'react';
import type { Note, NoteInput } from '../types';

interface NoteFormProps {
  /** The note being edited, or null when adding a new one. */
  editing: Note | null;
  onSave: (input: NoteInput) => Promise<boolean>;
  onCancel: () => void;
}

export function NoteForm({ editing, onSave, onCancel }: NoteFormProps) {
  // The initial values come from `editing`. The parent passes a `key` so this
  // component starts fresh every time a different note is selected.
  const [title, setTitle] = useState(editing?.title ?? '');
  const [content, setContent] = useState(editing?.content ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const ok = await onSave({ title, content });
    setSaving(false);
    if (ok && !editing) {
      setTitle('');
      setContent('');
    }
  }

  return (
    <form className="p-3 border-bottom" onSubmit={handleSubmit}>
      <input
        className="form-control mb-2"
        placeholder="Title"
        aria-label="Note title"
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="form-control mb-2"
        placeholder="Write something…"
        aria-label="Note content"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="d-flex justify-content-end gap-2">
        {editing && (
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
          {editing ? 'Save changes' : 'Add note'}
        </button>
      </div>
    </form>
  );
}
```

### `src/components/NoteList.tsx`

```tsx
import type { Note } from '../types';

interface NoteListProps {
  notes: Note[];
  loading: boolean;
  onEdit: (note: Note) => void;
  onRemove: (id: number) => void;
}

export function NoteList({ notes, loading, onEdit, onRemove }: NoteListProps) {
  if (loading) {
    return <p className="py-5 mb-0 text-center text-body-secondary">Loading…</p>;
  }

  if (notes.length === 0) {
    return <p className="py-5 mb-0 text-center text-body-secondary">No notes yet.</p>;
  }

  return (
    <ul className="list-group list-group-flush">
      {notes.map((note) => (
        <li key={note.id} className="list-group-item d-flex align-items-start gap-3 px-3 py-3">
          <div className="flex-grow-1 text-break">
            <h2 className="h6 mb-1">{note.title}</h2>
            {note.content && (
              <p className="small text-body-secondary mb-1" style={{ whiteSpace: 'pre-line' }}>
                {note.content}
              </p>
            )}
            <small className="text-body-tertiary">
              Updated {new Date(note.updatedAt).toLocaleString()}
            </small>
          </div>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary" onClick={() => onEdit(note)}>
              Edit
            </button>
            <button className="btn btn-outline-danger" onClick={() => onRemove(note.id)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

### `src/components/NotesPanel.tsx`

Menggabungkan hook dan kedua komponen, sama seperti `TodosPanel.tsx` untuk fitur todo:

```tsx
import { useState } from 'react';
import { useNotes } from '../hooks/useNotes';
import type { Note, NoteInput } from '../types';
import { NoteForm } from './NoteForm';
import { NoteList } from './NoteList';

/** The whole notes feature: form, error message, and list. */
export function NotesPanel() {
  const { notes, loading, error, dismissError, save, remove } = useNotes();
  const [editing, setEditing] = useState<Note | null>(null);

  async function handleSave(input: NoteInput) {
    const ok = await save(input, editing?.id);
    if (ok) setEditing(null);
    return ok;
  }

  return (
    <>
      <NoteForm
        key={editing?.id ?? 'new'}
        editing={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />

      {error && (
        <div className="alert alert-danger alert-dismissible small py-2 m-3" role="alert">
          {error}
          <button
            type="button"
            className="btn-close py-2"
            aria-label="Dismiss"
            onClick={dismissError}
          />
        </div>
      )}

      <NoteList notes={notes} loading={loading} onEdit={setEditing} onRemove={remove} />
    </>
  );
}
```

**Kenapa ada `key={editing?.id ?? 'new'}`?** `NoteForm` mengambil nilai awal input dari `editing` hanya saat pertama kali dibuat. Dengan `key` yang berubah setiap kali note lain dipilih, React membuat ulang form itu, sehingga isinya ikut berganti. Ini cara standar React untuk "mereset" komponen.

## Langkah 9: tampilkan di App dengan tab

Ganti seluruh isi `src/App.tsx`. Tab dibuat dengan class Bootstrap `nav nav-pills` dan state React, tanpa JavaScript Bootstrap:

```tsx
import { useState } from 'react';
import { NotesPanel } from './components/NotesPanel';
import { StatusBadge } from './components/StatusBadge';
import { TodosPanel } from './components/TodosPanel';
import { useHealth } from './hooks/useHealth';

const TABS = [
  { id: 'todos', label: 'Todos' },
  { id: 'notes', label: 'Notes' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const health = useHealth();
  const [tab, setTab] = useState<TabId>('todos');

  return (
    <div className="container py-5" style={{ maxWidth: 672 }}>
      <header className="d-flex flex-column flex-sm-row align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Todo App</h1>
          <p className="text-body-secondary small mb-0">React · Node.js · PostgreSQL — Bootstrap</p>
        </div>
        <StatusBadge status={health} />
      </header>

      <ul className="nav nav-pills mb-3">
        {TABS.map((item) => (
          <li key={item.id} className="nav-item">
            <button
              type="button"
              className={`nav-link ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <main className="card shadow-sm overflow-hidden">
        {tab === 'todos' && <TodosPanel />}
        {tab === 'notes' && <NotesPanel />}
      </main>

      <footer className="mt-4 text-center small text-body-secondary">
        Edit <code>src/App.tsx</code> to get started.
      </footer>
    </div>
  );
}
```

Untuk fitur ketiga dan seterusnya, cukup tambah satu item di `TABS` dan satu baris `{tab === '...' && <XxxPanel />}`.

## Selesai: cek di browser

1. Buka http://localhost:5173, lalu klik tab **Notes**.
2. Isi judul dan isi, klik **Add note**. Note muncul di daftar.
3. Klik **Edit**. Form terisi, tombol berubah menjadi **Save changes** dan muncul **Cancel**.
4. Ubah judul, klik **Save changes**. Note berpindah ke paling atas dengan waktu "Updated" yang baru.
5. Klik **Delete**. Note hilang.
6. Refresh halaman. Data tetap ada karena tersimpan di database.

Jika ada error, jalankan `npm run typecheck` di `backend` dan `frontend` untuk melihat file yang bermasalah.

## Latihan

1. **Konfirmasi hapus.** Sebelum menghapus, tampilkan `window.confirm('Delete this note?')` dan batalkan jika pengguna memilih *Cancel*.
2. **Error per field.** Tampilkan pesan validasi di bawah input judul memakai `getFieldErrors` dan class `is-invalid` (lihat [Panduan frontend](04-frontend.md#menampilkan-error-per-field)).
3. **Pencarian.** Tambahkan endpoint `GET /api/notes?search=kata` dengan `WHERE title ILIKE $1` dan nilai `` `%${search}%` ``. Di frontend, tambahkan input pencarian di atas daftar.
4. **Relasi.** Tambahkan kolom `todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE` supaya setiap note bisa dikaitkan dengan satu todo.
5. **Fitur sendiri.** Buat fitur baru (misalnya `contacts`: nama, email, telepon) dengan mengikuti tutorial ini dari langkah 1 sampai 9.
