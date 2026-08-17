export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="loading-center">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon = '🔍', title, desc, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {desc && <div className="empty-state-desc">{desc}</div>}
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <div className="error-state-icon">⚠️</div>
      <div className="error-state-title">Something went wrong</div>
      <div className="error-state-desc">{message}</div>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry} style={{ marginTop: '0.75rem' }}>
          Try again
        </button>
      )}
    </div>
  );
}

export function SkeletonCard({ height = 180 }) {
  return (
    <div className="card" style={{ height, padding: '1.25rem' }}>
      <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '65%' }} />
    </div>
  );
}
