import { TODO_FILTERS } from '../constants';
import type { TodoFilter } from '../types';

interface FilterBarProps {
  filter: TodoFilter;
  onChange: (filter: TodoFilter) => void;
  remaining: number;
  completedCount: number;
  onClearCompleted: () => void;
}

export function FilterBar({
  filter,
  onChange,
  remaining,
  completedCount,
  onClearCompleted,
}: FilterBarProps) {
  return (
    <div className="card-footer d-flex flex-wrap align-items-center justify-content-between gap-2 small text-body-secondary">
      <span>
        {remaining} {remaining === 1 ? 'item' : 'items'} left
      </span>

      <div className="btn-group btn-group-sm" role="group" aria-label="Filter todos">
        {TODO_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`btn ${filter === value ? 'btn-primary' : 'btn-outline-secondary'}`}
            aria-pressed={filter === value}
            onClick={() => onChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-link btn-sm text-body-secondary p-0"
        onClick={onClearCompleted}
        disabled={completedCount === 0}
      >
        Clear completed
      </button>
    </div>
  );
}
