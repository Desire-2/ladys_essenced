import React, { useState } from 'react';
import { useParent } from '@/contexts/ParentContext';

interface Child {
  id: number;
  name: string;
  date_of_birth?: string;
  relationship?: string;
  user_id?: number;
}

interface ChildrenListProps {
  onSelectChild?: (childId: number | null) => void;
  selectedChildId?: number | null;
}

export const ChildrenList: React.FC<ChildrenListProps> = ({ onSelectChild, selectedChildId }) => {
  const { childrenList, selectedChild, setSelectedChild, deleteChild, childrenLoading, childrenError } = useParent();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleSelectChild = (childId: number | null) => {
    setSelectedChild(childId);
    onSelectChild?.(childId);
  };

  const handleDeleteChild = async (childId: number) => {
    if (window.confirm('Are you sure you want to delete this child? This action cannot be undone.')) {
      setDeletingId(childId);
      try {
        await deleteChild(childId);
      } catch (error) {
        console.error('Failed to delete child:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const calculateAge = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (childrenLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white">
            <i className="fas fa-users me-2"></i>
            Your Children
          </h5>
          <span className="badge bg-white text-dark">{childrenList.length}</span>
        </div>
      </div>
      <div className="card-body">
        {childrenError && (
          <div className="alert alert-warning mb-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {childrenError}
          </div>
        )}

        {childrenList.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-child fa-3x text-muted mb-3"></i>
            <h6 className="text-muted">No children added yet</h6>
            <p className="text-muted small">Add your first child to get started</p>
          </div>
        ) : (
          <div className="row g-3">
            {childrenList.map((child: Child) => {
              const age = calculateAge(child.date_of_birth);
              const isSelected = selectedChildId ? selectedChildId === child.id : selectedChild === child.id;

              return (
                <div key={child.id} className="col-md-6">
                  <div
                    className={`card h-100 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary shadow-lg'
                        : 'border-light hover:shadow-md'
                    }`}
                    style={{
                      cursor: 'pointer',
                      borderWidth: isSelected ? '2px' : '1px',
                      backgroundColor: isSelected ? '#f0f7ff' : 'transparent',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => handleSelectChild(child.id)}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="card-title mb-1">
                            <i className={`fas fa-${age !== null && age < 14 ? 'child' : 'user'} me-2 text-primary`}></i>
                            {child.name}
                          </h6>
                          {age !== null && (
                            <small className="text-muted">
                              <i className="fas fa-birthday-cake me-1"></i>
                              Age {age}
                            </small>
                          )}
                        </div>
                        {isSelected && (
                          <span className="badge bg-primary">
                            <i className="fas fa-check me-1"></i>
                            Active
                          </span>
                        )}
                      </div>

                      {child.date_of_birth && (
                        <div className="small mb-2">
                          <i className="fas fa-calendar text-secondary me-2"></i>
                          DOB: {formatDate(child.date_of_birth)}
                        </div>
                      )}

                      {child.relationship && (
                        <div className="small mb-3">
                          <span className={`badge ${
                            child.relationship === 'mother' ? 'bg-danger' :
                            child.relationship === 'father' ? 'bg-info' :
                            'bg-secondary'
                          }`}>
                            <i className={`fas fa-${
                              child.relationship === 'mother' ? 'venus' :
                              child.relationship === 'father' ? 'mars' :
                              'user-shield'
                            } me-1`}></i>
                            {child.relationship.charAt(0).toUpperCase() + child.relationship.slice(1)}
                          </span>
                        </div>
                      )}

                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary flex-grow-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectChild(child.id);
                          }}
                        >
                          <i className="fas fa-eye me-1"></i>
                          View
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger flex-grow-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChild(child.id);
                          }}
                          disabled={deletingId === child.id}
                        >
                          {deletingId === child.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-trash me-1"></i>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {childrenList.length > 0 && (
          <div className="mt-4">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => handleSelectChild(null)}
            >
              <i className="fas fa-x me-2"></i>
              Clear Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
