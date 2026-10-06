import { useEffect, useState } from 'react';
import { ApiError, api } from '../lib/api';
import type { HealthStatus } from '../types';

/** Polls GET /api/health to show whether the API and database are reachable. */
export function useHealth(intervalMs = 15_000): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const res = await api.health();
        if (active) setStatus(res.database === 'up' ? 'online' : 'degraded');
      } catch (err) {
        if (active) {
          setStatus(err instanceof ApiError && err.status === 503 ? 'degraded' : 'offline');
        }
      }
    }

    void check();
    const id = setInterval(check, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}
