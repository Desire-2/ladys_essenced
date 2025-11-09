import React from 'react';
import { Child } from '../../types';
import { calculateAge } from '../../utils';

interface ViewChildModalProps {
  child: Child | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (child: Child) => void;
  onSelectChild: (childId: number | null) => void;
}

export const ViewChildModal: React.FC<ViewChildModalProps> = ({
  child,
  isOpen,
  onClose,
  onEdit,
  onSelectChild
}) => {
  if (!isOpen || !child) return null;

  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-user-circle me-2"></i>
              Child Information
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-12">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                    <i className="fas fa-user"></i>
                  </div>
                  <div className="ms-3">
                    <h4 className="mb-0">{child.name}</h4>
                    <small className="text-muted">ID: {child.id}</small>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <label className="form-label fw-bold text-muted small">Date of Birth</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-calendar"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Not set'} 
                    readOnly 
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <label className="form-label fw-bold text-muted small">Age</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-birthday-cake"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={child.date_of_birth 
                      ? `${calculateAge(child.date_of_birth)} years`
                      : 'N/A'
                    } 
                    readOnly 
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <label className="form-label fw-bold text-muted small">Relationship</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-heart"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control text-capitalize" 
                    value={child.relationship || 'Not specified'} 
                    readOnly 
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <label className="form-label fw-bold text-muted small">Phone Number</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-phone"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={child.phone_number || 'Not set'} 
                    readOnly 
                  />
                </div>
              </div>
              
              <div className="col-12">
                <label className="form-label fw-bold text-muted small">User ID</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-id-card"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={child.user_id || 'N/A'} 
                    readOnly 
                  />
                </div>
                <small className="text-muted">This ID is used for tracking child's health data</small>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => {
                onSelectChild(child.user_id || null);
                onClose();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <i className="fas fa-chart-line me-2"></i>
              View Dashboard
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                onEdit(child);
                onClose();
              }}
            >
              <i className="fas fa-edit me-2"></i>
              Edit
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};