/**
 * Small helpers shared by every `*.validation.ts` file.
 */
import type { FieldError } from '../types/api.js';
import { HttpError } from './http-error.js';

/** Makes sure the request body is a JSON object like `{ ... }` (not an array, text, or empty). */
export function requireObject(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  return body as Record<string, unknown>;
}

/** Throws one 400 error that lists every problem found. Does nothing if `errors` is empty. */
export function assertNoErrors(errors: FieldError[]): void {
  if (errors.length > 0) {
    const message = errors.map((error) => error.message).join(', ');
    throw new HttpError(400, message, errors);
  }
}

/** Parses a route param such as `/todos/:id`. Only positive whole numbers are allowed. */
export function parseId(value: unknown, label = 'Id'): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    const message = `${label} must be a positive integer`;
    throw new HttpError(400, message, [{ field: 'id', message }]);
  }
  return Number(value);
}
