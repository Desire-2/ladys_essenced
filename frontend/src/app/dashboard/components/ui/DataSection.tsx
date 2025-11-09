import React from 'react';
import { DataSectionProps } from '../../types';

export const DataSection: React.FC<DataSectionProps> = ({ 
  title, 
  dataType, 
  children, 
  icon,
  showRetry = true,
  isLoading = false,
  error = '',
  hasData = false,
  onRetry
}) => {
  if (isLoading) {
    return (
      <div className="card h-100">
        <div className="card-header d-flex align-items-center">
          {icon && <i className={`${icon} me-2`}></i>}
          <h5 className="mb-0">{title}</h5>
        </div>
        <div className="card-body d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mb-0">Loading {title.toLowerCase()}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card h-100 border-warning">
        <div className="card-header bg-warning text-dark d-flex align-items-center">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <h5 className="mb-0">{title}</h5>
        </div>
        <div className="card-body">
          <div className="alert alert-warning mb-3">
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-circle me-2"></i>
              <div className="flex-grow-1">
                <strong>Unable to load data</strong>
                <div className="small mt-1">{error}</div>
              </div>
            </div>
          </div>
          {showRetry && onRetry && (
            <div className="text-center">
              <button 
                className="btn btn-outline-warning btn-sm"
                onClick={onRetry}
                disabled={isLoading}
              >
                <i className="fas fa-redo me-1"></i>
                Retry Loading
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card h-100">
      <div className="card-header d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          {icon && <i className={`${icon} me-2`}></i>}
          <h5 className="mb-0">{title}</h5>
        </div>
        {hasData && (
          <span className="badge bg-success">
            <i className="fas fa-check-circle me-1"></i>
            Loaded
          </span>
        )}
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};