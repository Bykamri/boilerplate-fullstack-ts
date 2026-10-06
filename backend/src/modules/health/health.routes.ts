import { Router } from 'express';
import { pool } from '../../db/pool.js';
import type { HealthResponse } from '../../types/api.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const uptime = Math.round(process.uptime());
  try {
    await pool.query('SELECT 1');
    const body: HealthResponse = { status: 'ok', database: 'up', uptime };
    res.json(body);
  } catch {
    const body: HealthResponse = { status: 'degraded', database: 'down', uptime };
    res.status(503).json(body);
  }
});
