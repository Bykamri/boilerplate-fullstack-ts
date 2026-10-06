import type {
  CreateTodoInput,
  ErrorResponse,
  FieldError,
  HealthResponse,
  Todo,
  UpdateTodoInput,
} from '../types';

/**
 * Defaults to `/api`, which the Vite dev server proxies to the backend.
 * Set `VITE_API_URL` when the backend lives on another origin.
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (res.status === 204) return undefined as T;

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as ErrorResponse | null)?.error;
    throw new ApiError(error?.message ?? res.statusText, res.status, error?.details);
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  todos: {
    list: () => request<Todo[]>('/todos'),
    create: (input: CreateTodoInput) =>
      request<Todo>('/todos', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: number, input: UpdateTodoInput) =>
      request<Todo>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    remove: (id: number) => request<void>(`/todos/${id}`, { method: 'DELETE' }),
  },
};

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return 'Cannot reach the API. Is the backend running?';
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

/** Turns the `details` of a 400 response into `{ title: 'Title is required', ... }`. */
export function getFieldErrors(err: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (err instanceof ApiError && Array.isArray(err.details)) {
    for (const item of err.details as FieldError[]) {
      result[item.field] = item.message;
    }
  }
  return result;
}
