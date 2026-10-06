import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const NODE_ENVS = ['development', 'production', 'test'] as const;
type NodeEnv = (typeof NODE_ENVS)[number];

const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

function fail(message: string): never {
  console.error(`Invalid environment variable: ${message}`);
  console.error('Copy .env.example to .env and adjust the values.');
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';
if (!NODE_ENVS.includes(nodeEnv as NodeEnv)) {
  fail(`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}`);
}

const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port <= 0) {
  fail('PORT must be a positive integer');
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  fail('DATABASE_URL is required');
}

const corsOrigins = (process.env.CORS_ORIGIN || DEFAULT_CORS_ORIGIN)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  NODE_ENV: nodeEnv as NodeEnv,
  PORT: port,
  DATABASE_URL: databaseUrl,
  CORS_ORIGIN: corsOrigins,
};
