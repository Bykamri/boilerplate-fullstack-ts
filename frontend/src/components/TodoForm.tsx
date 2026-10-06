import { useTodoForm } from '../hooks/useTodoForm';

export function TodoForm({ onAdd }: { onAdd: (title: string) => Promise<boolean> }) {
  const { title, setTitle, submitting, canSubmit, handleSubmit } = useTodoForm(onAdd);

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
