'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  icon = 'fas fa-inbox', 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="text-center py-5">
      <div 
        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
        style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#f8f9fa',
          color: '#6c757d'
        }}
      >
        <i className={`${icon} fa-2x`}></i>
      </div>
      <h5 className="mb-2" style={{ color: '#2d3748' }}>
        {title}
      </h5>
      {description && (
        <p className="text-muted mb-4" style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <i className="fas fa-plus me-2"></i>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
