import { StatusBadge } from './components/StatusBadge';
import { TodosPanel } from './components/TodosPanel';
import { useHealth } from './hooks/useHealth';

export default function App() {
  const health = useHealth();

  return (
    <div className="container py-5" style={{ maxWidth: 672 }}>
      <header className="d-flex flex-column flex-sm-row align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Todo App</h1>
          <p className="text-body-secondary small mb-0">React · Node.js · PostgreSQL — Bootstrap</p>
        </div>
        <StatusBadge status={health} />
      </header>

      <main className="card shadow-sm overflow-hidden">
        <TodosPanel />
      </main>

      <footer className="mt-4 text-center small text-body-secondary">
        Edit <code>src/App.tsx</code> to get started.
      </footer>
    </div>
  );
}
