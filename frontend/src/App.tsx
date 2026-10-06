import { useHealth } from './hooks/useHealth';
import { useTodos } from './hooks/useTodos';
import { FilterBar } from './components/FilterBar';
import { StatusBadge } from './components/StatusBadge';
import { TodoForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';

export default function App() {
  const health = useHealth();
  const todos = useTodos();

  return (
    <div className="container py-5" style={{ maxWidth: 672 }}>
      <header className="d-flex flex-column flex-sm-row align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Todo App</h1>
          <p className="text-body-secondary small mb-0">React · Node.js · PostgreSQL — Bootstrap</p>
        </div>
        <StatusBadge status={health} />
      </header>

      <main className="card shadow-sm overflow-hidden">
        <div className="card-body p-0">
          <TodoForm onAdd={todos.add} />

          {todos.error && (
            <div className="alert alert-danger alert-dismissible small py-2 mx-3 mb-3" role="alert">
              {todos.error}
              <button
                type="button"
                className="btn-close py-2"
                aria-label="Dismiss"
                onClick={todos.dismissError}
              />
            </div>
          )}

          <TodoList
            todos={todos.visibleTodos}
            loading={todos.loading}
            onToggle={todos.toggle}
            onRemove={todos.remove}
          />
        </div>

        <FilterBar
          filter={todos.filter}
          onChange={todos.setFilter}
          remaining={todos.remaining}
          completedCount={todos.completedCount}
          onClearCompleted={todos.clearCompleted}
        />
      </main>

      <footer className="mt-4 text-center small text-body-secondary">
        Edit <code>src/App.tsx</code> to get started.
      </footer>
    </div>
  );
}
