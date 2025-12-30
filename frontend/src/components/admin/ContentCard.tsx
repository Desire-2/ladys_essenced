'use client';

import { ReactNode } from 'react';

interface ContentCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function ContentCard({ 
  children, 
  title, 
  subtitle, 
  headerActions, 
  className = '',
  noPadding = false 
}: ContentCardProps) {
  return (
    <div 
      className={`card border-0 shadow-sm ${className}`}
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}
    >
      {(title || headerActions) && (
        <div className="card-header bg-white border-0 py-3 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {title && (
                <h6 className="mb-0 fw-semibold" style={{ color: '#2d3748', fontSize: '16px' }}>
                  {title}
                </h6>
              )}
              {subtitle && (
                <p className="mb-0 text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>
                  {subtitle}
                </p>
              )}
            </div>
            {headerActions && <div>{headerActions}</div>}
          </div>
        </div>
      )}
      <div className={noPadding ? '' : 'card-body p-4'}>
        {children}
      </div>
    </div>
  );
}
