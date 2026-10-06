/**
 * Manual request validation for the todos module.
 *
 * Each function receives raw, untrusted input (`req.body` / `req.params`),
 * checks it, and either returns clean typed data or throws a 400 HttpError.
 */
import { assertNoErrors, parseId, requireObject } from '../../lib/validation.js';
import type { FieldError } from '../../types/api.js';
import type { CreateTodoInput, UpdateTodoInput } from '../../types/todo.js';

export const TITLE_MAX_LENGTH = 200;

/** Returns the trimmed title, or records an error and returns undefined. */
function validateTitle(value: unknown, errors: FieldError[]): string | undefined {
  if (value === undefined || value === null) {
    errors.push({ field: 'title', message: 'Title is required' });
    return undefined;
  }
  if (typeof value !== 'string') {
    errors.push({ field: 'title', message: 'Title must be a string' });
    return undefined;
  }

  const title = value.trim();
  if (title.length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.push({
      field: 'title',
      message: `Title must be at most ${TITLE_MAX_LENGTH} characters`,
    });
  }
  return title;
}

/** Validates the `:id` route param. */
export function parseTodoId(value: unknown): number {
  return parseId(value, 'Todo id');
}

/** Body for POST /api/todos: `{ title: string }` */
export function validateCreateTodo(body: unknown): CreateTodoInput {
  const data = requireObject(body);
  const errors: FieldError[] = [];

  const title = validateTitle(data.title, errors);

  assertNoErrors(errors);
  // Safe: if title were missing or invalid, assertNoErrors would have thrown.
  return { title: title as string };
}

/** Body for PATCH /api/todos/:id: `{ title?: string, completed?: boolean }` (at least one). */
export function validateUpdateTodo(body: unknown): UpdateTodoInput {
  const data = requireObject(body);
  const errors: FieldError[] = [];
  const input: UpdateTodoInput = {};

  if (data.title === undefined && data.completed === undefined) {
    errors.push({
      field: 'body',
      message: 'Provide at least one field to update: title or completed',
    });
  }

  if (data.title !== undefined) {
    input.title = validateTitle(data.title, errors);
  }

  if (data.completed !== undefined) {
    if (typeof data.completed === 'boolean') {
      input.completed = data.completed;
    } else {
      errors.push({ field: 'completed', message: 'Completed must be true or false' });
    }
  }

  assertNoErrors(errors);
  return input;
}
