import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import type { ErrorResponse } from '../types/api.js';

function sendError(res: Response, status: number, message: string, details?: unknown) {
  const body: ErrorResponse = { error: { message, details } };
  res.status(status).json(body);
}

export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

// Every error response has the shape of ErrorResponse: `{ error: { message, details? } }`.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    sendError(res, err.status, err.message, err.details);
    return;
  }

  // Malformed JSON body from express.json()
  if (err?.type === 'entity.parse.failed') {
    sendError(res, 400, 'Invalid JSON body');
    return;
  }

  console.error(err);
  sendError(
    res,
    500,
    env.NODE_ENV === 'production' ? 'Internal server error' : String(err?.message ?? err),
  );
};
