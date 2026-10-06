import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { todosRouter } from './modules/todos/todos.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use('/api/health', healthRouter);
  app.use('/api/todos', todosRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
