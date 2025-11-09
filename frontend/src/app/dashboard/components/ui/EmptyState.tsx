import React from 'react';
import { EmptyStateProps } from '../../types';

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction 
}) => (
  <div className="text-center py-4">
    <i className={`${icon} text-muted mb-3`} style={{ fontSize: '3rem' }}></i>
    <h6 className="text-muted mb-2">{title}</h6>
    <p className="text-muted small mb-3">{description}</p>
    {actionText && onAction && (
      <button className="btn btn-primary btn-sm" onClick={onAction}>
        {actionText}
      </button>
    )}
  </div>
);