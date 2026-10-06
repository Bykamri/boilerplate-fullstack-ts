import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage } from '../lib/api';
import type { Todo, TodoFilter } from '../types';

/** All todo state + actions. Components only render what this returns. */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setTodos(await api.todos.list());
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(async (title: string): Promise<boolean> => {
    try {
      const todo = await api.todos.create({ title: title.trim() });
      setTodos((prev) => [todo, ...prev]);
      setError(null);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  }, []);

  // Optimistic update: flip immediately, roll back if the request fails.
  const toggle = useCallback(async (todo: Todo) => {
    const replace = (next: Todo) =>
      setTodos((prev) => prev.map((t) => (t.id === next.id ? next : t)));

    replace({ ...todo, completed: !todo.completed });
    try {
      replace(await api.todos.update(todo.id, { completed: !todo.completed }));
    } catch (err) {
      replace(todo);
      setError(getErrorMessage(err));
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      await api.todos.remove(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const clearCompleted = useCallback(async () => {
    const done = todos.filter((t) => t.completed);
    try {
      await Promise.all(done.map((t) => api.todos.remove(t.id)));
      setTodos((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      setError(getErrorMessage(err));
      void reload();
    }
  }, [todos, reload]);

  const visibleTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const completedCount = todos.filter((t) => t.completed).length;

  return {
    todos,
    visibleTodos,
    filter,
    setFilter,
    loading,
    error,
    dismissError: () => setError(null),
    remaining: todos.length - completedCount,
    completedCount,
    reload,
    add,
    toggle,
    remove,
    clearCompleted,
  };
}
