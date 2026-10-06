import type { Todo } from '../types';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  onToggle: (todo: Todo) => void;
  onRemove: (id: number) => void;
}

export function TodoList({ todos, loading, onToggle, onRemove }: TodoListProps) {
  if (loading) {
    return (
      <div className="border-top py-5 text-center text-body-secondary">
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <p className="border-top py-5 mb-0 text-center text-body-secondary">Nothing here yet.</p>
    );
  }

  return (
    <ul className="list-group list-group-flush border-top">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className="list-group-item list-group-item-action todo-item d-flex align-items-center justify-content-between gap-3 px-3 py-2"
        >
          <div className="form-check mb-0 flex-grow-1">
            <input
              id={`todo-${todo.id}`}
              type="checkbox"
              className="form-check-input"
              checked={todo.completed}
              onChange={() => onToggle(todo)}
            />
            <label
              htmlFor={`todo-${todo.id}`}
              className={`form-check-label todo-title ${
                todo.completed ? 'text-decoration-line-through text-body-secondary' : ''
              }`}
            >
              {todo.title}
            </label>
          </div>
          <button
            className="btn btn-sm btn-outline-danger todo-delete"
            onClick={() => onRemove(todo.id)}
            aria-label={`Delete "${todo.title}"`}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
