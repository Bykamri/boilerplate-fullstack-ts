# 4. Panduan frontend

Semua path di halaman ini relatif terhadap folder `frontend/`.

## Pola: komponen → hook → API

Setiap fitur dibagi menjadi beberapa lapisan:

```
App.tsx                         ← layout halaman: header + panel
└── components/TodosPanel.tsx   ← satu fitur: memanggil hook, menyusun komponen
    ├── hooks/useTodos.ts       ← state (data, loading, error) + aksi (add, toggle, remove)
    │   └── lib/api.ts          ← fetch ke backend
    ├── components/TodoForm.tsx ← tampilan form
    ├── components/TodoList.tsx ← tampilan daftar
    └── components/FilterBar.tsx
```

| Lapisan | Boleh | Jangan |
| --- | --- | --- |
| `lib/api.ts` | `fetch`, URL, method | `useState`, JSX |
| `hooks/useXxx.ts` | `useState`, `useEffect`, memanggil `api` | JSX |
| `components/Xxx.tsx` | JSX, class Bootstrap, menerima data lewat props | memanggil `fetch` langsung |
| `components/XxxPanel.tsx` | memanggil hook, meneruskan data/aksi ke komponen | logika rumit |

Dengan pola ini, komponen tampilan hanya menerima **props** dan memanggil **callback**. Komponen itu tidak tahu dari mana datanya berasal, sehingga mudah diubah tampilannya.

## Types

Semua types ada di `src/types/` dan di-export lewat `src/types/index.ts`:

```ts
import type { Todo, CreateTodoInput } from '../types';
```

Bentuk data harus **sama** dengan `backend/src/types/`. Satu-satunya perbedaan: tanggal bertipe `string` di frontend (JSON tidak punya tipe tanggal). Untuk menampilkannya: `new Date(todo.createdAt).toLocaleString()`.

Saat membuat file types baru (misalnya `src/types/note.ts`), tambahkan baris `export * from './note';` ke `src/types/index.ts`.

Label dan pilihan tetap untuk tampilan (bukan types) disimpan di `src/constants.ts`, misalnya `TODO_FILTERS`.

## Memanggil API (`src/lib/api.ts`)

Semua endpoint dikumpulkan di object `api`:

```ts
export const api = {
  health: () => request<HealthResponse>('/health'),
  todos: {
    list: () => request<Todo[]>('/todos'),
    create: (input: CreateTodoInput) =>
      request<Todo>('/todos', { method: 'POST', body: JSON.stringify(input) }),
    // ...
  },
};
```

- `request<T>(path, options)` menambahkan prefix `/api`, mengirim header JSON, lalu mengembalikan body bertipe `T`.
- Jika status bukan 2xx, `request` melempar `ApiError` yang berisi `message`, `status`, dan `details` dari backend.

| Helper | Hasil |
| --- | --- |
| `getErrorMessage(err)` | Pesan yang siap ditampilkan, misalnya `"Title is required"` atau `"Cannot reach the API. Is the backend running?"` |
| `getFieldErrors(err)` | Object per field, misalnya `{ title: "Title is required" }` |

Menambah endpoint baru cukup dengan satu baris. Contoh `GET /api/todos/:id`:

```ts
  todos: {
    // ...yang sudah ada
    get: (id: number) => request<Todo>(`/todos/${id}`),
  },
```

## Hooks

Hook menyimpan state dan menyediakan aksi untuk satu fitur. Ada dua gaya di proyek ini:

**Sederhana** (`useNotes` di [Tutorial 06](06-tutorial-fitur-baru.md)): fungsi biasa di dalam hook. Disarankan untuk fitur baru.

```ts
async function remove(id: number) {
  try {
    await api.notes.remove(id);
    setNotes((prev) => prev.filter((note) => note.id !== id));
  } catch (err) {
    setError(getErrorMessage(err));
  }
}
```

**Teroptimasi** (`useTodos`): memakai `useCallback`/`useMemo` dan *optimistic update* (tampilan diubah dulu, dibatalkan jika request gagal). Lihat fungsi `toggle` di `src/hooks/useTodos.ts`.

Aturan penting saat mengubah state berupa array: **jangan ubah array lama, buat array baru.**

| Aksi | Kode |
| --- | --- |
| Tambah di depan | `setItems((prev) => [item, ...prev])` |
| Ganti satu | `setItems((prev) => prev.map((x) => (x.id === item.id ? item : x)))` |
| Hapus satu | `setItems((prev) => prev.filter((x) => x.id !== id))` |

## Styling dengan Bootstrap

CSS Bootstrap di-import sekali di `src/main.tsx`. Setelah itu, cukup tulis class Bootstrap di atribut `className`.

| Kebutuhan | Class yang dipakai di proyek | Dokumentasi |
| --- | --- | --- |
| Lebar halaman | `container` | [Containers](https://getbootstrap.com/docs/5.3/layout/containers/) |
| Jarak | `m-3`, `mb-2`, `p-3`, `px-3`, `py-5`, `gap-2` | [Spacing](https://getbootstrap.com/docs/5.3/utilities/spacing/) |
| Susunan sejajar | `d-flex`, `align-items-center`, `justify-content-between`, `flex-grow-1` | [Flex](https://getbootstrap.com/docs/5.3/utilities/flex/) |
| Kotak konten | `card`, `card-body`, `card-footer` | [Card](https://getbootstrap.com/docs/5.3/components/card/) |
| Daftar | `list-group`, `list-group-item` | [List group](https://getbootstrap.com/docs/5.3/components/list-group/) |
| Form | `form-control`, `form-select`, `form-check`, `input-group`, `is-invalid` | [Forms](https://getbootstrap.com/docs/5.3/forms/overview/) |
| Tombol | `btn btn-primary`, `btn-outline-danger`, `btn-sm`, `btn-group` | [Buttons](https://getbootstrap.com/docs/5.3/components/buttons/) |
| Label kecil | `badge`, `text-bg-success`, `rounded-pill` | [Badge](https://getbootstrap.com/docs/5.3/components/badge/) |
| Pesan | `alert alert-danger`, `btn-close` | [Alerts](https://getbootstrap.com/docs/5.3/components/alerts/) |
| Tab / menu | `nav nav-pills`, `nav-link active` | [Navs](https://getbootstrap.com/docs/5.3/components/navs-tabs/) |
| Loading | `spinner-border spinner-border-sm` | [Spinners](https://getbootstrap.com/docs/5.3/components/spinners/) |
| Warna teks | `text-body-secondary`, `text-danger` | [Colors](https://getbootstrap.com/docs/5.3/utilities/colors/) |

Tips:

- **Dark mode** sudah aktif otomatis mengikuti OS (lihat `src/main.tsx`). Supaya tetap terbaca di dark mode, gunakan class seperti `text-body-secondary` dan `bg-body-tertiary`, bukan warna tetap seperti `text-dark` atau `bg-white`.
- **Class dinamis**: gunakan template string, misalnya ``className={`btn ${active ? 'btn-primary' : 'btn-outline-secondary'}`}``.
- **CSS sendiri** ditulis di `src/index.css`. Prioritaskan class Bootstrap; CSS sendiri hanya untuk hal yang tidak ada di Bootstrap (contoh: tombol Delete yang muncul saat hover).
- **Komponen yang butuh JavaScript Bootstrap** (modal, dropdown, collapse, tooltip) belum aktif, karena hanya CSS yang di-import. Cara paling sederhana: atur buka/tutupnya dengan `useState` React, seperti tab di [Tutorial 06](06-tutorial-fitur-baru.md#langkah-9-tampilkan-di-app-dengan-tab). Jika tetap ingin memakai JavaScript Bootstrap, tambahkan `import 'bootstrap/dist/js/bootstrap.bundle.min.js';` di `src/main.tsx`.

### Contoh: mengubah tampilan tombol Add

Di `src/components/TodoForm.tsx`, ganti `btn btn-primary px-4` menjadi `btn btn-success px-4` untuk tombol hijau, atau tambahkan `btn-lg` untuk tombol besar. Simpan file, dan browser langsung berubah.

## Menampilkan error per field

Backend mengirim daftar kesalahan di `details`. `getFieldErrors` mengubahnya menjadi object per field, lalu class Bootstrap `is-invalid` + `invalid-feedback` menampilkan pesannya di bawah input:

```tsx
import { useState, type FormEvent } from 'react';
import { api, getErrorMessage, getFieldErrors } from '../lib/api';

export function ExampleForm() {
  const [title, setTitle] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api.todos.create({ title });
      setTitle('');
      setFieldErrors({});
      setError(null);
    } catch (err) {
      setFieldErrors(getFieldErrors(err)); // { title: 'Title is required' }
      setError(getErrorMessage(err)); // 'Title is required'
    }
  }

  return (
    <form className="p-3" onSubmit={handleSubmit} noValidate>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <label htmlFor="example-title" className="form-label">
        Title
      </label>
      <input
        id="example-title"
        className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {fieldErrors.title && <div className="invalid-feedback">{fieldErrors.title}</div>}

      <button className="btn btn-primary mt-3" type="submit">
        Save
      </button>
    </form>
  );
}
```

`invalid-feedback` harus diletakkan **tepat setelah** input yang memiliki class `is-invalid`, supaya Bootstrap menampilkannya.

## Menambah komponen

1. Buat `src/components/NamaKomponen.tsx`.
2. Tentukan props dengan `interface`.
3. Export dengan nama (`export function NamaKomponen`), lalu import di komponen lain.

```tsx
interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return <p className="py-5 mb-0 text-center text-body-secondary">{message}</p>;
}
```

```tsx
<EmptyState message="Belum ada data." />
```

## Environment variable

Frontend hanya membaca variabel yang diawali `VITE_`. Saat ini hanya ada satu:

| Variabel | Keterangan |
| --- | --- |
| `VITE_API_URL` | URL API jika backend berada di domain lain, misalnya `https://api.example.com/api`. Kosongkan untuk memakai `/api` (lewat proxy Vite saat development). |

Buat `frontend/.env` (contohnya ada di `.env.example`), lalu **restart** `npm run dev` setiap kali `.env` diubah.

Jangan menyimpan rahasia (password, API key) di `.env` frontend. Semua isinya ikut terkirim ke browser.

## Checklist: menambah fitur baru di frontend

- [ ] `src/types/<fitur>.ts` (sama dengan backend) + export di `src/types/index.ts`
- [ ] Method baru di `api` pada `src/lib/api.ts`
- [ ] `src/hooks/use<Fitur>.ts`
- [ ] Komponen tampilan di `src/components/`
- [ ] `src/components/<Fitur>Panel.tsx`
- [ ] Panel ditampilkan di `src/App.tsx`

Contoh lengkapnya ada di [Tutorial 06: menambah fitur baru](06-tutorial-fitur-baru.md).
