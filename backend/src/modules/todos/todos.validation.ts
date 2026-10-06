/**
 * Manual request validation for the todos module.
 *
 * Each function receives raw, untrusted input (`req.body` / `req.params`),
 * checks it, and either returns clean typed data or throws a 400 HttpError.
 */
import { HttpError } from '../../lib/http-error.js';
import type { FieldError } from '../../types/api.js';
import type { CreateTodoInput, UpdateTodoInput } from '../../types/todo.js';

export const TITLE_MAX_LENGTH = 200;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertNoErrors(errors: FieldError[]) {
  if (errors.length > 0) {
    const message = errors.map((error) => error.message).join(', ');
    throw new HttpError(400, message, errors);
  }
}

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

/** Validates the `:id` route param. Only positive whole numbers are allowed. */
export function parseTodoId(value: unknown): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new HttpError(400, 'Todo id must be a positive integer', [
      { field: 'id', message: 'Todo id must be a positive integer' },
    ]);
  }
  return Number(value);
}

/** Body for POST /api/todos: `{ title: string }` */
export function validateCreateTodo(body: unknown): CreateTodoInput {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const errors: FieldError[] = [];
  const title = validateTitle(body.title, errors);
  assertNoErrors(errors);

  // Safe: if title were missing or invalid, assertNoErrors would have thrown.
  return { title: title as string };
}

/** Body for PATCH /api/todos/:id: `{ title?: string, completed?: boolean }` (at least one). */
export function validateUpdateTodo(body: unknown): UpdateTodoInput {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const errors: FieldError[] = [];
  const input: UpdateTodoInput = {};

  if (body.title === undefined && body.completed === undefined) {
    errors.push({
      field: 'body',
      message: 'Provide at least one field to update: title or completed',
    });
  }

  if (body.title !== undefined) {
    input.title = validateTitle(body.title, errors);
  }

  if (body.completed !== undefined) {
    if (typeof body.completed === 'boolean') {
      input.completed = body.completed;
    } else {
      errors.push({ field: 'completed', message: 'Completed must be true or false' });
    }
  }

  assertNoErrors(errors);
  return input;
}
