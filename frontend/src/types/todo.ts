/**
 * Same shape as backend/src/types/todo.ts.
 * Dates arrive as ISO strings because JSON has no Date type.
 */
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Body for POST /api/todos */
export interface CreateTodoInput {
  title: string;
}

/** Body for PATCH /api/todos/:id (send at least one field) */
export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

/** Which todos are shown in the list (UI only, not sent to the API). */
export type TodoFilter = 'all' | 'active' | 'completed';
