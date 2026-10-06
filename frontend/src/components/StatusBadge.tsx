import { HEALTH_LABELS } from '../constants';
import type { HealthStatus } from '../types';

const variant: Record<HealthStatus, string> = {
  checking: 'secondary',
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
};

export function StatusBadge({ status }: { status: HealthStatus }) {
  const color = variant[status];
  return (
    <span
      role="status"
      className={`badge rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 fw-medium text-${color}-emphasis bg-${color}-subtle border border-${color}-subtle`}
    >
      {status === 'checking' ? (
        <span className="spinner-grow" style={{ width: 8, height: 8 }} aria-hidden="true" />
      ) : (
        <span
          className={`rounded-circle bg-${color}`}
          style={{ width: 8, height: 8 }}
          aria-hidden="true"
        />
      )}
      {HEALTH_LABELS[status]}
    </span>
  );
}
