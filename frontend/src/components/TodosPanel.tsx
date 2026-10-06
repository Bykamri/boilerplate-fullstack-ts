import { useTodos } from '../hooks/useTodos';
import { FilterBar } from './FilterBar';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';

/** The whole todo feature: form, error message, list, and filter bar. */
export function TodosPanel() {
  const todos = useTodos();

  return (
    <>
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
    </>
  );
}
