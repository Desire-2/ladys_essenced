import React, { useState } from 'react';
import { Child } from '../../types';
import { generateRandomPhone, generateRandomPassword, calculateAge } from '../../utils';

interface ChildrenTabProps {
  children: Child[];
  onChildFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  childFormError: string;
  childFormSuccess: string;
  onDeleteChild: (id: number) => void;
  onViewChild: (child: Child) => void;
}

export const ChildrenTab: React.FC<ChildrenTabProps> = ({
  children,
  onChildFormSubmit,
  childFormError,
  childFormSuccess,
  onDeleteChild,
  onViewChild
}) => {
  const [isEditingChild, setIsEditingChild] = useState(false);
  const [editingChildId, setEditingChildId] = useState<number | null>(null);
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [childPhoneNumber, setChildPhoneNumber] = useState('');
  const [childPassword, setChildPassword] = useState('');

  const startEditing = (child: Child) => {
    setIsEditingChild(true);
    setEditingChildId(child.id);
    setChildName(child.name);
    setChildDob(child.date_of_birth?.split('T')[0] || '');
    setRelationshipType(child.relationship || '');
    setChildPhoneNumber(child.phone_number || '');
    setChildPassword(''); // Don't show password when editing
  };

  const resetForm = () => {
    setIsEditingChild(false);
    setEditingChildId(null);
    setChildName('');
    setChildDob('');
    setRelationshipType('');
    setChildPhoneNumber('');
    setChildPassword('');
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Manage Children</h3>
      </div>
      <div className="card-body">
        <div className="row">
          {/* Form Column */}
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h4>{isEditingChild ? 'Edit Child' : 'Add Child'}</h4>
              </div>
              <div className="card-body">
                {childFormError && <div className="alert alert-danger">{childFormError}</div>}
                {childFormSuccess && <div className="alert alert-success">{childFormSuccess}</div>}
                <form onSubmit={onChildFormSubmit}>
                  <div className="mb-3">
                    <label htmlFor="childName" className="form-label">Name</label>
                    <input
                      type="text"
                      id="childName"
                      className="form-control"
                      value={childName}
                      onChange={e => setChildName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="childDob" className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      id="childDob"
                      className="form-control"
                      value={childDob}
                      onChange={e => setChildDob(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="relationship" className="form-label">Relationship</label>
                    <select
                      id="relationship"
                      className="form-control"
                      value={relationshipType}
                      onChange={e => setRelationshipType(e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="mother">Mother</option>
                      <option value="father">Father</option>
                      <option value="guardian">Guardian</option>
                    </select>
                  </div>
                  
                  {/* Phone Number Field */}
                  <div className="mb-3">
                    <label htmlFor="childPhoneNumber" className="form-label d-flex justify-content-between align-items-center">
                      <span>Phone Number <small className="text-muted">(Optional - can be changed later)</small></span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setChildPhoneNumber(generateRandomPhone())}
                      >
                        <i className="fas fa-sync-alt me-1"></i>
                        Generate
                      </button>
                    </label>
                    <input
                      type="tel"
                      id="childPhoneNumber"
                      className="form-control"
                      value={childPhoneNumber}
                      onChange={e => setChildPhoneNumber(e.target.value)}
                      placeholder="250XXXXXXXXX (leave empty for random)"
                    />
                    <small className="form-text text-muted">
                      If left empty, a random phone number will be assigned that can be changed later when child gets a phone.
                    </small>
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label htmlFor="childPassword" className="form-label d-flex justify-content-between align-items-center">
                      <span>Password <small className="text-muted">(Optional - can be changed later)</small></span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setChildPassword(generateRandomPassword())}
                      >
                        <i className="fas fa-key me-1"></i>
                        Generate
                      </button>
                    </label>
                    <input
                      type="text"
                      id="childPassword"
                      className="form-control"
                      value={childPassword}
                      onChange={e => setChildPassword(e.target.value)}
                      placeholder="Leave empty for random password"
                    />
                    <small className="form-text text-muted">
                      If left empty, a random password will be generated. Child can change it later.
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1">
                      <i className={`fas ${isEditingChild ? 'fa-save' : 'fa-plus'} me-2`}></i>
                      {isEditingChild ? 'Save Changes' : 'Add Child'}
                    </button>
                    
                    {isEditingChild && (
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={resetForm}
                      >
                        <i className="fas fa-times me-2"></i>
                        Cancel
                      </button>
                    )}
                  </div>
                  
                  {!isEditingChild && (
                    <div className="alert alert-info mt-3 mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      <small>
                        <strong>Note:</strong> If phone number and password are left empty, random credentials will be generated. 
                        These can be updated later when the child gets their own phone.
                      </small>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
          {/* List Column */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header"><h4>Your Children</h4></div>
              <div className="card-body">
                {children.length > 0 ? (
                  <ul className="list-group">
                    {children.map(child => (
                      <li key={child.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{child.name}</strong><br/>
                          <small>
                            {child.date_of_birth ? (
                              <>
                                {new Date(child.date_of_birth).toLocaleDateString()} 
                                ({calculateAge(child.date_of_birth)} years old)
                              </>
                            ) : 'No DOB'}
                          </small><br/>
                          <small className="text-muted">Relationship: {child.relationship}</small>
                        </div>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-outline-info" 
                            onClick={() => onViewChild(child)}
                            title="View child information"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => startEditing(child)}
                            title="Edit child information"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => onDeleteChild(child.id)}
                            title="Remove child"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                    <p>No children yet</p>
                    <small className="text-muted">Add children above</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};