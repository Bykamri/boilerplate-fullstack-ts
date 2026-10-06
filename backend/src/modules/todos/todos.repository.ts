import { pool } from '../../db/pool.js';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '../../types/todo.js';

const COLUMNS = `id, title, completed, created_at AS "createdAt", updated_at AS "updatedAt"`;

export const todosRepository = {
  async findAll(): Promise<Todo[]> {
    const { rows } = await pool.query<Todo>(
      `SELECT ${COLUMNS} FROM todos ORDER BY created_at DESC, id DESC`,
    );
    return rows;
  },

  async create(input: CreateTodoInput): Promise<Todo> {
    const { rows } = await pool.query<Todo>(
      `INSERT INTO todos (title) VALUES ($1) RETURNING ${COLUMNS}`,
      [input.title],
    );
    return rows[0];
  },

  async update(id: number, input: UpdateTodoInput): Promise<Todo | null> {
    const { rows } = await pool.query<Todo>(
      `UPDATE todos
          SET title      = COALESCE($2, title),
              completed  = COALESCE($3, completed),
              updated_at = now()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id, input.title ?? null, input.completed ?? null],
    );
    return rows[0] ?? null;
  },

  async remove(id: number): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
