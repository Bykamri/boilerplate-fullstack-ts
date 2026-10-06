/**
 * Throw this from a route to send an error response with a specific status code.
 * `details` is optional extra info (e.g. a list of validation errors).
 */
export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}
