/** Same shapes as backend/src/types/api.ts */

/** One validation problem, e.g. `{ field: 'title', message: 'Title is required' }` */
export interface FieldError {
  field: string;
  message: string;
}

/** Shape of every error response sent by the API. */
export interface ErrorResponse {
  error: {
    message: string;
    details?: FieldError[];
  };
}

/** Response of GET /api/health */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  uptime: number;
}

/** Connection state shown in the header badge (UI only). */
export type HealthStatus = 'checking' | 'online' | 'degraded' | 'offline';
