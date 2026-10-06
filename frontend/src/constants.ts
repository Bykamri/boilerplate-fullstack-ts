import type { HealthStatus, TodoFilter } from './types';

export const TODO_FILTERS: ReadonlyArray<{ value: TodoFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export const HEALTH_LABELS: Record<HealthStatus, string> = {
  checking: 'Checking…',
  online: 'API & DB online',
  degraded: 'Database down',
  offline: 'API offline',
};
