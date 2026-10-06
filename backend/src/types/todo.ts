/** A row from the `todos` table, as returned by the API. */
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
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
